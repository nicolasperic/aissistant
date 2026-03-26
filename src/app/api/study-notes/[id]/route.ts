import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const note = await db.studyNote.findUnique({
    where: { id },
    include: { task: { include: { goal: true } } },
  });

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json();
  const note = await db.studyNote.update({ where: { id }, data: { content } });
  return NextResponse.json(note);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { bookmarkPosition } = await req.json();
  const note = await db.studyNote.update({
    where: { id },
    data: { bookmarkPosition: bookmarkPosition ?? null },
  });
  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.studyNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
