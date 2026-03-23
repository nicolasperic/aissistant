import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const topic = searchParams.get("topic");
  const examCode = searchParams.get("examCode");
  const goalId = searchParams.get("goalId");
  const due = searchParams.get("due");

  const goalIds = searchParams.get("goalIds");

  const where: Record<string, unknown> = {};
  if (topic) where.topic = topic;
  if (examCode) where.examCode = examCode;
  if (goalIds) {
    where.goalId = { in: goalIds.split(",") };
  } else if (goalId) {
    where.goalId = goalId;
  }
  if (due === "true") {
    where.OR = [
      { nextReviewAt: null },
      { nextReviewAt: { lte: new Date() } },
    ];
  }

  const cards = await db.flashcard.findMany({
    where,
    orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const card = await db.flashcard.create({
    data: {
      question: body.question,
      answer: body.answer,
      hint: body.hint || null,
      topic: body.topic,
      examCode: body.examCode || null,
      goalId: body.goalId || null,
    },
  });

  return NextResponse.json(card, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.question !== undefined) data.question = body.question;
  if (body.answer !== undefined) data.answer = body.answer;
  if (body.hint !== undefined) data.hint = body.hint || null;
  if (body.topic !== undefined) data.topic = body.topic;
  if (body.examCode !== undefined) data.examCode = body.examCode || null;
  if (body.goalId !== undefined) data.goalId = body.goalId || null;

  const card = await db.flashcard.update({
    where: { id: body.id },
    data,
  });

  return NextResponse.json(card);
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.flashcard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
