import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const TSX = 'npx ts-node --compiler-options \'{"module":"commonjs"}\'';

async function main() {
  console.log("🌱 Seeding Certento database...\n");

  // ── 1. Initialize UserStats singleton ──────────────────────────────────────
  await prisma.userStats.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
  });
  console.log("✓ UserStats initialized\n");

  // ── 2. Seed content packs (study notes + flashcards from JSON) ─────────────
  const contentDir = path.join(__dirname, "content-pack");
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".json")).sort();
    console.log(`Found ${files.length} content pack files`);

    let totalNotes = 0;
    let totalFlashcards = 0;
    let skippedNotes = 0;

    for (const file of files) {
      const pack = JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf-8"));
      console.log(`  Processing ${pack.certCode} (${pack.studyNotes.length} notes)...`);

      for (const noteData of pack.studyNotes) {
        const existing = await prisma.studyNote.findFirst({
          where: { title: noteData.title, certCode: noteData.certCode },
        });
        if (existing) { skippedNotes++; continue; }

        const studyNote = await prisma.studyNote.create({
          data: {
            title: noteData.title,
            content: noteData.content,
            certCode: noteData.certCode,
            section: noteData.section ?? null,
            position: noteData.position,
            validated: true,
          },
        });
        totalNotes++;

        for (const fc of noteData.flashcards) {
          await prisma.flashcard.create({
            data: {
              question: fc.question,
              answer: fc.answer,
              hint: fc.hint,
              topic: fc.topic,
              examCode: noteData.certCode,
              studyNoteId: studyNote.id,
            },
          });
          totalFlashcards++;
        }
      }
    }

    console.log(`✓ Content packs: ${totalNotes} notes, ${totalFlashcards} flashcards`);
    if (skippedNotes > 0) console.log(`  (${skippedNotes} notes skipped — already exist)`);
    console.log();
  } else {
    console.log("⚠ No content-pack/ directory found — skipping study notes & flashcards\n");
  }

  // ── 3. Seed practice tests (official Adobe exam questions) ─────────────────
  const practiceTestSeeds = [
    "seed-e708-practice-tests.ts",
    "seed-e712-practice-tests.ts",
    "seed-e722-practice-tests.ts",
    "seed-e724-practice-tests.ts",
    "seed-e725-practice-tests.ts",
    "seed-e726-practice-tests.ts",
    "seed-practice-tests.ts",      // AD0-E727
    "seed-ai-practice-tests.ts",   // AI-generated questions
  ];

  console.log("Seeding practice tests...");
  for (const seedFile of practiceTestSeeds) {
    const seedPath = path.join(__dirname, seedFile);
    if (!fs.existsSync(seedPath)) {
      console.log(`  ⚠ ${seedFile} not found — skipping`);
      continue;
    }
    try {
      execSync(`${TSX} ${seedPath}`, { stdio: "pipe" });
      console.log(`  ✓ ${seedFile}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ✗ ${seedFile}: ${msg.split("\n")[0]}`);
    }
  }
  console.log();

  console.log("─".repeat(50));
  console.log("🌱 Seed complete! Open the app to start the setup wizard.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
