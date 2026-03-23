import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CardRating } from "@prisma/client";

// Simple spaced repetition intervals
const NEXT_REVIEW_DAYS: Record<CardRating, number> = {
  EASY: 7,
  MEDIUM: 3,
  HARD: 1,
  MISSED: 1,
};

function calcNextReview(rating: CardRating): Date {
  const next = new Date();
  next.setDate(next.getDate() + NEXT_REVIEW_DAYS[rating]);
  next.setHours(0, 0, 0, 0);
  return next;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, rating } = body as { id: string; rating: CardRating };

  if (!id || !rating) {
    return NextResponse.json({ error: "id and rating required" }, { status: 400 });
  }

  const current = await db.flashcard.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const isCorrect = rating === "EASY" || rating === "MEDIUM";

  const card = await db.flashcard.update({
    where: { id },
    data: {
      lastRating: rating,
      lastReviewedAt: new Date(),
      nextReviewAt: calcNextReview(rating),
      correctCount: isCorrect ? current.correctCount + 1 : current.correctCount,
      incorrectCount: !isCorrect ? current.incorrectCount + 1 : current.incorrectCount,
    },
  });

  return NextResponse.json(card);
}
