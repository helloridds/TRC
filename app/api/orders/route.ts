import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let orders;
    if (status) {
      orders = await sql`
        SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC
      `;
    } else {
      orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    }
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customer_name, customer_phone, items, total, order_type, notes } =
      await request.json();
    const result = await sql`
      INSERT INTO orders (customer_name, customer_phone, items, total, order_type, notes)
      VALUES (
        ${customer_name}, ${customer_phone || null},
        ${JSON.stringify(items)}, ${total},
        ${order_type || 'product'}, ${notes || null}
      )
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
