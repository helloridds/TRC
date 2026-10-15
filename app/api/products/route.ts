import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products;
    if (category && category !== 'all') {
      products = await sql`
        SELECT * FROM products
        WHERE category ILIKE ${category}
        ORDER BY created_at DESC
      `;
    } else if (search) {
      products = await sql`
        SELECT * FROM products
        WHERE name ILIKE ${'%' + search + '%'} OR brand ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    }
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { barcode, name, brand, category, image_url, price, stock, nutrition_data } =
      await request.json();
    const result = await sql`
      INSERT INTO products (barcode, name, brand, category, image_url, price, stock, nutrition_data)
      VALUES (
        ${barcode || null}, ${name}, ${brand || null}, ${category || null},
        ${image_url || null}, ${price}, ${stock ?? 0},
        ${nutrition_data ? JSON.stringify(nutrition_data) : null}
      )
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
