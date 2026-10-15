import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, type, price, description, active } = await request.json();
    const result = await sql`
      UPDATE tiffin_plans
      SET name = ${name}, type = ${type}, price = ${price},
          description = ${description}, active = ${active}
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Tiffin plan not found' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update tiffin plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM tiffin_plans WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete tiffin plan' }, { status: 500 });
  }
}
