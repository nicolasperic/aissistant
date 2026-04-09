import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      practiceTest: {
        include: { certification: { select: { passingScore: true, totalQuestions: true } } },
      },
      questions: {
        include: {
          question: {
            include: { options: { select: { id: true, isCorrect: true } } },
          },
        },
      },
      answers: {
        include: { selected: { select: { optionId: true } } },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }
  if (attempt.status === "COMPLETED") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

  let score = 0;

  for (const aq of attempt.questions) {
    const correctIds = new Set(
      aq.question.options.filter((o) => o.isCorrect).map((o) => o.id)
    );
    const answer = answerMap.get(aq.questionId);
    const selectedIds = new Set(answer?.selected.map((s) => s.optionId) ?? []);

    const isCorrect =
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));

    if (answer) {
      await db.attemptAnswer.update({
        where: { id: answer.id },
        data: { isCorrect },
      });
    }

    if (isCorrect) score++;
  }

  const completedAt = new Date();
  const durationSeconds = Math.round(
    (completedAt.getTime() - attempt.startedAt.getTime()) / 1000
  );
  // Scale the passing score to the number of questions in this attempt
  const { passingScore, totalQuestions: certTotal } = attempt.practiceTest.certification;
  const requiredToPass = Math.ceil((passingScore / certTotal) * attempt.totalQuestions);
  const passed = score >= requiredToPass;

  const updated = await db.examAttempt.update({
    where: { id: attemptId },
    data: { status: "COMPLETED", completedAt, durationSeconds, score, passed },
  });

  return NextResponse.json(updated);
}
