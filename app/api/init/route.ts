import { NextRequest, NextResponse } from 'next/server';
import { initializeDB } from '@/lib/db';

export async function GET() {
  try {
    await initializeDB();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to initialize DB' }, { status: 500 });
  }
}
