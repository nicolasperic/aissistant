/**
 * Content Pack Seed — Study Notes & Flashcards for Adobe Commerce Certifications
 *
 * Seeds study notes and flashcards from the content-pack/ JSON files.
 * Run: npx ts-node --transpileOnly prisma/seed-content-pack.ts
 *
 * This provides real study content for 7 Adobe Commerce certifications:
 *   AD0-E708, AD0-E712, AD0-E722, AD0-E724, AD0-E725, AD0-E726, AD0-E727
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface FlashcardData {
  question: string;
  answer: string;
  hint: string | null;
  topic: string;
}

interface StudyNoteData {
  title: string;
  content: string;
  certCode: string;
  section?: string;
  position: number;
  flashcards: FlashcardData[];
}

interface CertContentPack {
  certCode: string;
  studyNotes: StudyNoteData[];
}

async function main() {
  const contentDir = path.join(__dirname, "content-pack");

  if (!fs.existsSync(contentDir)) {
    console.error("Error: prisma/content-pack/ directory not found.");
    console.error("Make sure the content pack JSON files are present.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.error("Error: No JSON files found in prisma/content-pack/");
    process.exit(1);
  }

  console.log(`Found ${files.length} content pack files\n`);

  let totalNotes = 0;
  let totalFlashcards = 0;
  let skippedNotes = 0;
  let skippedFlashcards = 0;

  for (const file of files) {
    const filepath = path.join(contentDir, file);
    const pack: CertContentPack = JSON.parse(fs.readFileSync(filepath, "utf-8"));

    console.log(`Processing ${pack.certCode} (${pack.studyNotes.length} notes)...`);

    for (const noteData of pack.studyNotes) {
      // Check if study note already exists (by title + certCode)
      const existing = await prisma.studyNote.findFirst({
        where: { title: noteData.title, certCode: noteData.certCode },
      });

      if (existing) {
        skippedNotes++;
        skippedFlashcards += noteData.flashcards.length;
        continue;
      }

      // Create the study note
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

      // Create flashcards for this note
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

    console.log(`  ✓ ${pack.certCode} done`);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Content pack seeded successfully!`);
  console.log(`  Study notes created: ${totalNotes}`);
  console.log(`  Flashcards created:  ${totalFlashcards}`);
  if (skippedNotes > 0) {
    console.log(`  Notes skipped (already exist): ${skippedNotes}`);
    console.log(`  Flashcards skipped: ${skippedFlashcards}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
