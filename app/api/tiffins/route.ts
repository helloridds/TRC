import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const tiffins = await sql`SELECT * FROM tiffin_plans ORDER BY created_at DESC`;
    return NextResponse.json(tiffins);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch tiffin plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type, price, description, active } = await request.json();
    const result = await sql`
      INSERT INTO tiffin_plans (name, type, price, description, active)
      VALUES (${name}, ${type}, ${price}, ${description}, ${active ?? true})
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create tiffin plan' }, { status: 500 });
  }
}
