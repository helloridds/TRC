import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const result = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
