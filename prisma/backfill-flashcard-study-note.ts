/**
 * Backfill script: links existing Flashcards to their StudyNote via AiContext metadata.
 *
 * Run with: npx ts-node prisma/backfill-flashcard-study-note.ts
 *
 * Strategy:
 *  1. Find all AiContext records of type "generate-flashcards-from-note"
 *  2. For each, extract studyNoteId from metadata
 *  3. Fetch the StudyNote to get task.title (= flashcard topic) and goalId
 *  4. Update all Flashcards with that topic + goalId that still have no studyNoteId
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const contexts = await prisma.aiContext.findMany({
    where: { type: "generate-flashcards-from-note" },
    select: { metadata: true },
  });

  console.log(`Found ${contexts.length} AiContext record(s) to process.`);

  let updated = 0;
  let skipped = 0;

  for (const ctx of contexts) {
    const meta = ctx.metadata as { studyNoteId?: string } | null;
    const studyNoteId = meta?.studyNoteId;
    if (!studyNoteId) {
      skipped++;
      continue;
    }

    const note = await prisma.studyNote.findUnique({
      where: { id: studyNoteId },
      include: { task: true },
    });

    if (!note) {
      console.log(`  ⚠️  StudyNote ${studyNoteId} not found — skipping.`);
      skipped++;
      continue;
    }

    const topic = note.task?.title ?? note.title;
    const goalId = note.goalId ?? note.task?.goalId ?? null;

    const result = await prisma.flashcard.updateMany({
      where: {
        topic,
        ...(goalId ? { goalId } : {}),
        studyNoteId: null,
      },
      data: { studyNoteId },
    });

    console.log(
      `  ✅  StudyNote "${note.title}" (${studyNoteId}): linked ${result.count} flashcard(s) via topic="${topic}"`
    );
    updated += result.count;
  }

  console.log(`\nDone. ${updated} flashcard(s) updated, ${skipped} context(s) skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
