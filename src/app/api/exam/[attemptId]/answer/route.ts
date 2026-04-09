import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT — upsert an answer (selected options + flagged) for one question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const { questionId, selectedOptionIds, flagged } = await req.json();

  const answer = await db.$transaction(async (tx) => {
    const existing = await tx.attemptAnswer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });

    if (existing) {
      // Delete previous selections and re-create
      await tx.attemptAnswerOption.deleteMany({ where: { answerId: existing.id } });
      const updated = await tx.attemptAnswer.update({
        where: { id: existing.id },
        data: { flagged: flagged ?? existing.flagged },
      });
      if (selectedOptionIds?.length > 0) {
        await tx.attemptAnswerOption.createMany({
          data: selectedOptionIds.map((optionId: string) => ({
            answerId: updated.id,
            optionId,
          })),
        });
      }
      return updated;
    }

    const created = await tx.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        flagged: flagged ?? false,
      },
    });
    if (selectedOptionIds?.length > 0) {
      await tx.attemptAnswerOption.createMany({
        data: selectedOptionIds.map((optionId: string) => ({
          answerId: created.id,
          optionId,
        })),
      });
    }
    return created;
  });

  return NextResponse.json(answer);
}
