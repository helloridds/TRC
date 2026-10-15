import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tiffinPlanId = searchParams.get('tiffin_plan_id');
    const weekStart = searchParams.get('week_start');

    let schedule;
    if (tiffinPlanId && weekStart) {
      schedule = await sql`
        SELECT ws.*, tp.name as plan_name, tp.type as plan_type
        FROM weekly_schedule ws
        JOIN tiffin_plans tp ON ws.tiffin_plan_id = tp.id
        WHERE ws.tiffin_plan_id = ${tiffinPlanId}
        AND ws.week_start_date = ${weekStart}
        ORDER BY CASE ws.day_of_week
          WHEN 'Mon' THEN 1 WHEN 'Tue' THEN 2 WHEN 'Wed' THEN 3
          WHEN 'Thu' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 WHEN 'Sun' THEN 7
        END
      `;
    } else {
      schedule = await sql`
        SELECT ws.*, tp.name as plan_name, tp.type as plan_type
        FROM weekly_schedule ws
        JOIN tiffin_plans tp ON ws.tiffin_plan_id = tp.id
        ORDER BY ws.week_start_date DESC, ws.id
      `;
    }
    return NextResponse.json(schedule);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tiffin_plan_id, day_of_week, meal_name, meal_description, week_start_date } =
      await request.json();

    // Upsert — replace existing for same plan+day+week
    await sql`
      DELETE FROM weekly_schedule
      WHERE tiffin_plan_id = ${tiffin_plan_id}
      AND day_of_week = ${day_of_week}
      AND week_start_date = ${week_start_date}
    `;

    const result = await sql`
      INSERT INTO weekly_schedule (tiffin_plan_id, day_of_week, meal_name, meal_description, week_start_date)
      VALUES (${tiffin_plan_id}, ${day_of_week}, ${meal_name}, ${meal_description}, ${week_start_date})
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await sql`DELETE FROM weekly_schedule WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete schedule entry' }, { status: 500 });
  }
}
