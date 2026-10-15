import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, price, description, image_url, available, category } = await request.json();
    const result = await sql`
      UPDATE thalis
      SET name = ${name}, price = ${price}, description = ${description},
          image_url = ${image_url}, available = ${available}, category = ${category}
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update thali' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM thalis WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete thali' }, { status: 500 });
  }
}
