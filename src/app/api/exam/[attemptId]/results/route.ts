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
            include: { sections: { orderBy: { percentage: "desc" } } },
          },
        },
      },
      // Questions in their shuffled order for this attempt
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              options: { select: { id: true, text: true, isCorrect: true } },
            },
          },
          // The shuffled option order for this attempt
          options: {
            orderBy: { position: "asc" },
            include: { option: { select: { id: true } } },
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

  const cert = attempt.practiceTest.certification;
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

  // ── Section breakdown ──────────────────────────────────────────────────────

  const sectionBreakdown = cert.sections.map((sec) => {
    const secQuestions = attempt.questions.filter(
      (aq) => aq.question.certSectionId === sec.id
    );
    const correct = secQuestions.filter(
      (aq) => answerMap.get(aq.questionId)?.isCorrect === true
    ).length;
    return {
      sectionId: sec.id,
      name: sec.name,
      percentage: sec.percentage,
      total: secQuestions.length,
      correct,
      pct: secQuestions.length > 0 ? Math.round((correct / secQuestions.length) * 100) : 0,
    };
  });

  // ── Question review ────────────────────────────────────────────────────────
  // Use the shuffled option order stored in AttemptQuestionOption

  const questions = attempt.questions.map((aq) => {
    const answer = answerMap.get(aq.questionId);
    const selectedIds = new Set(answer?.selected.map((s) => s.optionId) ?? []);

    // Build a map from optionId → isCorrect from the canonical question options
    const correctMap = new Map(
      aq.question.options.map((o) => [o.id, o.isCorrect])
    );
    const textMap = new Map(aq.question.options.map((o) => [o.id, o.text]));

    // Render options in the shuffled order used during this attempt
    const options = aq.options.map((aqo) => ({
      optionId: aqo.option.id,
      text: textMap.get(aqo.option.id) ?? "",
      isCorrect: correctMap.get(aqo.option.id) ?? false,
      wasSelected: selectedIds.has(aqo.option.id),
    }));

    return {
      questionId: aq.questionId,
      position: aq.position,
      text: aq.question.text,
      type: aq.question.type,
      explanation: aq.question.explanation,
      certSectionId: aq.question.certSectionId,
      isCorrect: answer?.isCorrect ?? false,
      flagged: answer?.flagged ?? false,
      options,
    };
  });

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      durationSeconds: attempt.durationSeconds,
      status: attempt.status,
    },
    practiceTest: {
      id: attempt.practiceTest.id,
      title: attempt.practiceTest.title,
      type: attempt.practiceTest.type,
    },
    certification: {
      id: cert.id,
      name: cert.name,
      code: cert.code,
      passingScore: cert.passingScore,
      totalQuestions: cert.totalQuestions,
      // Scaled passing score for this specific attempt length
      requiredToPass: Math.ceil((cert.passingScore / cert.totalQuestions) * attempt.totalQuestions),
      timeLimitMinutes: cert.timeLimitMinutes,
    },
    sectionBreakdown,
    questions,
  });
}
