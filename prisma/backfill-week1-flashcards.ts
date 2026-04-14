/**
 * Backfill Week 1 flashcards → study notes by topic name.
 * Run with: npx ts-node prisma/backfill-week1-flashcards.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TOPIC_TO_STUDY_NOTE: Record<string, string> = {
  "Theme Management":                    "cmna8q9fm001op3lvxt9k87tz", // Day 1 — Theme Architecture & Creating a New Theme
  "Theme Inheritance & Extension":       "cmna8vut7001rp3lvlah68hnd", // Day 2 — Extending Existing Themes & Theme Inheritance
  "Transactional Emails & Translations": "cmna95ol5001up3lvrv79u3qe", // Day 3 — Transactional Emails & Translations
  "Layout XML Instructions":             "cmna9igc8001xp3lvg5twg3wo", // Day 4 — Layout XML Instructions & Page Layouts
  "Extending vs Overriding Layout XML":  "cmna9ltp60020p3lvqg7x8sqo", // Day 5 — Extending vs Merging vs Overriding Layout XML
  "PHTML Templates & Security":          "cmna9q6hh0023p3lvazktubo5", // Day 6 — PHTML Templates & Template Security
};

async function main() {
  let total = 0;

  for (const [topic, studyNoteId] of Object.entries(TOPIC_TO_STUDY_NOTE)) {
    const result = await db.flashcard.updateMany({
      where: { topic, studyNoteId: null },
      data: { studyNoteId },
    });
    console.log(`  ✅  "${topic}" → ${result.count} flashcard(s) linked`);
    total += result.count;
  }

  console.log(`\nDone. ${total} flashcard(s) updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
