import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const updates: { id: string; position: number }[] = body.updates;

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await db.$transaction(
    updates.map(({ id, position }) =>
      db.goal.update({ where: { id }, data: { position } })
    )
  );

  return NextResponse.json({ success: true });
}
