import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuestionWithOptions = {
  id: string;
  certSectionId: string | null;
  options: { id: string }[];
};

export async function POST(req: NextRequest) {
  const { testId } = await req.json();

  const test = await db.practiceTest.findUnique({
    where: { id: testId },
    include: {
      certification: { include: { sections: true } },
      questionLinks: {
        orderBy: { position: "asc" },
        include: { question: { include: { options: { select: { id: true } } } } },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Practice test not found" }, { status: 404 });
  }

  let selectedQuestions: QuestionWithOptions[];

  if (test.type === "SHUFFLE") {
    const allQuestions = await db.question.findMany({
      where: { certificationId: test.certificationId },
      include: { options: { select: { id: true } } },
    });

    // Sort sections largest-first so rounding remainder falls on the smallest section
    const sections = [...test.certification.sections].sort(
      (a, b) => b.percentage - a.percentage
    );

    if (sections.length > 0) {
      // Group pool questions by section
      const bySection: Record<string, QuestionWithOptions[]> = {};
      const unsectioned: QuestionWithOptions[] = [];

      for (const q of allQuestions) {
        if (q.certSectionId) {
          bySection[q.certSectionId] = [...(bySection[q.certSectionId] ?? []), q];
        } else {
          unsectioned.push(q);
        }
      }

      const picked: QuestionWithOptions[] = [];

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const isLast = i === sections.length - 1;
        // Last section fills whatever remains to avoid rounding drift
        const target = isLast
          ? Math.max(0, test.questionCount - picked.length)
          : Math.round((sec.percentage / 100) * test.questionCount);
        const pool = shuffleArray(bySection[sec.id] ?? []);
        picked.push(...pool.slice(0, target));
      }

      // Fill any remaining gap from unsectioned questions
      if (picked.length < test.questionCount && unsectioned.length > 0) {
        const gap = test.questionCount - picked.length;
        picked.push(...shuffleArray(unsectioned).slice(0, gap));
      }

      selectedQuestions = shuffleArray(picked);
    } else {
      // No sections — draw randomly from the full pool
      selectedQuestions = shuffleArray(allQuestions).slice(0, test.questionCount);
    }
  } else {
    // OFFICIAL or AI_GENERATED: use the fixed question list, but shuffle order
    selectedQuestions = shuffleArray(
      test.questionLinks.map((ql) => ql.question)
    );
  }

  // Create attempt + all AttemptQuestion + AttemptQuestionOption in one transaction
  const attempt = await db.$transaction(async (tx) => {
    const newAttempt = await tx.examAttempt.create({
      data: {
        practiceTestId: testId,
        totalQuestions: selectedQuestions.length,
        status: "IN_PROGRESS",
      },
    });

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      const aq = await tx.attemptQuestion.create({
        data: {
          attemptId: newAttempt.id,
          questionId: q.id,
          position: i + 1,
        },
      });

      const shuffledOptions = shuffleArray(q.options);
      await tx.attemptQuestionOption.createMany({
        data: shuffledOptions.map((opt, j) => ({
          attemptQuestionId: aq.id,
          optionId: opt.id,
          position: j + 1,
        })),
      });
    }

    return newAttempt;
  });

  return NextResponse.json({
    attemptId: attempt.id,
    certificationId: test.certificationId,
  });
}
