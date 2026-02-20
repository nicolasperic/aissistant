import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type");
  const parentId = searchParams.get("parentId");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (parentId) where.parentId = parentId;

  const goals = await db.goal.findMany({
    where,
    include: {
      children: true,
      tasks: true,
      parent: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const goal = await db.goal.create({
    data: {
      title: body.title,
      description: body.description,
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      category: body.category,
      parentId: body.parentId || null,
      notes: body.notes || null,
    },
    include: {
      children: true,
      tasks: true,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const goal = await db.goal.update({
    where: { id: body.id },
    data: {
      title: body.title,
      description: body.description,
      type: body.type,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      progress: body.progress,
      category: body.category,
      parentId: body.parentId,
      notes: body.notes !== undefined ? body.notes : undefined,
    },
    include: {
      children: true,
      tasks: true,
    },
  });

  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.goal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
