import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.eventDate = {};
    if (from) (where.eventDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.eventDate as Record<string, unknown>).lte = new Date(to);
  }

  const events = await db.event.findMany({
    where,
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const event = await db.event.create({
    data: {
      title: body.title,
      description: body.description,
      eventDate: new Date(body.eventDate),
      category: body.category,
      url: body.url,
      goalId: body.goalId || null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const event = await db.event.update({
    where: { id: body.id },
    data: {
      title: body.title,
      description: body.description,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      category: body.category,
      url: body.url,
      goalId: body.goalId,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
