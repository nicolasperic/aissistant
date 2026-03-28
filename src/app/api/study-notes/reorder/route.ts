import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { ids } = await req.json();

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }

  await db.$transaction(
    ids.map((id: string, index: number) =>
      db.studyNote.update({ where: { id }, data: { position: index } })
    )
  );

  return NextResponse.json({ success: true });
}
