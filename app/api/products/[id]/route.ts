import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { barcode, name, brand, category, image_url, price, stock, nutrition_data } =
      await request.json();
    const result = await sql`
      UPDATE products
      SET barcode = ${barcode || null}, name = ${name}, brand = ${brand || null},
          category = ${category || null}, image_url = ${image_url || null},
          price = ${price}, stock = ${stock ?? 0},
          nutrition_data = ${nutrition_data ? JSON.stringify(nutrition_data) : null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
