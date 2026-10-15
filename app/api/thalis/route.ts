import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const thalis = await sql`SELECT * FROM thalis ORDER BY created_at DESC`;
    return NextResponse.json(thalis);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch thalis' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, price, description, image_url, available, category } = await request.json();
    const result = await sql`
      INSERT INTO thalis (name, price, description, image_url, available, category)
      VALUES (${name}, ${price}, ${description}, ${image_url}, ${available ?? true}, ${category ?? 'regular'})
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create thali' }, { status: 500 });
  }
}
