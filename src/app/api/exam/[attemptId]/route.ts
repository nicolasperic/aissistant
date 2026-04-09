import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      practiceTest: {
        include: {
          certification: {
            select: { id: true, name: true, passingScore: true, timeLimitMinutes: true },
          },
        },
      },
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: { select: { id: true, text: true, type: true } },
          options: {
            orderBy: { position: "asc" },
            include: {
              option: { select: { id: true, text: true } }, // no isCorrect!
            },
          },
        },
      },
      answers: {
        include: {
          selected: { select: { optionId: true } },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  return NextResponse.json(attempt);
}
