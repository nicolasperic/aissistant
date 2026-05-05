/**
 * Extract study notes + flashcards from the database and write sanitized JSON files
 * for the content pack seed.
 *
 * Usage: npx ts-node --transpileOnly prisma/extract-content-pack.ts
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// AD0-E722 Day 20 (pos=64) and Day 21 (pos=65) are incorrectly assigned content — skip them
const SKIP_RULES: Record<string, number[]> = {
  "AD0-E722": [64, 65],
};

// ─── Sanitization ─────────────────────────────────────────────────────────────

function sanitizeContent(text: string): string {
  let result = text;

  // Remove personal name references
  result = result.replace(/\bNico\b/gi, "");
  result = result.replace(/\bNico['']s\b/gi, "");

  // Remove ac-sandbox references (local EE environment)
  result = result.replace(/ac-sandbox/gi, "local-instance");

  // Remove personal exam date references (e.g., "your exam on May 8", "exam date: April 11")
  result = result.replace(
    /(?:your |the )?exam (?:is )?(?:on|date[:\s]*)\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s*\d{4})?/gi,
    ""
  );
  result = result.replace(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s*\d{4})?\s*(?:exam|certification)/gi,
    ""
  );

  // Remove specific date references like "2026-05-08", "2026-04-11"
  result = result.replace(/20\d{2}-\d{2}-\d{2}/g, "YYYY-MM-DD");

  // Remove "Last updated: May 7" type metadata lines and study session headers
  result = result.replace(/>\s*\*\*Last updated:\*\*[^\n]*/g, "");
  result = result.replace(/>\s*\*\*Study Session:\*\*[^\n]*/g, "");
  result = result.replace(/>\s*\*\*Rule:\*\*[^\n]*/g, "");
  result = result.replace(/>\s*\*\*Week \d+ Goal:\*\*[^\n]*/g, "");

  // Remove motivational blocks that are clearly personal coaching
  const personalMotivationalPatterns = [
    /#{1,3}\s*Final Reminders?\s*\n[\s\S]*?(?=\n#{1,3}\s|\n---|\Z)/gi,
    /(?:^|\n)>\s*(?:You know this|Stop studying|Sleep is more valuable|Go get it|13 years|The exam tests architectural)[^\n]*\n?/gm,
    /(?:^|\n)[-*]\s*(?:You know this|Stop studying|Sleep is more valuable|Go get it|Stop at \d)[^\n]*\n?/gm,
    // Inline personal coaching phrases
    /You know this\.\s*/gi,
    /Stop studying at \d{1,2}\s*(?:PM|AM)\.\s*/gi,
    /Stop at \d{1,2}\s*(?:PM|AM)\.\s*(?:Seriously\.)?\s*/gi,
    /Sleep is more valuable than[^.\n]*\.\s*/gi,
    /Go get it\.\s*/gi,
    /The exam tests architectural judgment,?\s*not syntax memorization\.\s*/gi,
  ];

  for (const pattern of personalMotivationalPatterns) {
    result = result.replace(pattern, "");
  }

  // Remove "13 years of AC experience" type references
  result = result.replace(/\d+\s*years?\s*of\s*(?:AC|Adobe Commerce)\s*experience[^.\n]*/gi, "");

  // Clean up dangling "Your ." left after removing "You know this"
  result = result.replace(/[-*]\s*Your\s*\.\s*\n/g, "");

  // Clean up double blank lines left by removals
  result = result.replace(/\n{3,}/g, "\n\n");

  // Clean up lines that are now just whitespace
  result = result.replace(/^\s+$/gm, "");

  return result.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  position: number;
  flashcards: FlashcardData[];
}

interface CertContentPack {
  certCode: string;
  studyNotes: StudyNoteData[];
}

async function main() {
  const outDir = path.join(__dirname, "content-pack");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const certifications = await prisma.certification.findMany({
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });

  console.log(`Found ${certifications.length} certifications`);

  for (const cert of certifications) {
    const skipPositions = SKIP_RULES[cert.code] || [];

    const studyNotes = await prisma.studyNote.findMany({
      where: {
        certCode: cert.code,
        validated: true,
        ...(skipPositions.length > 0
          ? { position: { notIn: skipPositions } }
          : {}),
      },
      include: {
        flashcards: {
          select: {
            question: true,
            answer: true,
            hint: true,
            topic: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    if (studyNotes.length === 0) {
      console.log(`  ${cert.code}: No validated study notes, skipping`);
      continue;
    }

    const pack: CertContentPack = {
      certCode: cert.code,
      studyNotes: studyNotes.map((note, idx) => ({
        title: sanitizeContent(note.title),
        content: sanitizeContent(note.content),
        certCode: note.certCode!,
        position: idx + 1, // Re-index sequentially starting at 1
        flashcards: note.flashcards.map((fc) => ({
          question: sanitizeContent(fc.question),
          answer: sanitizeContent(fc.answer),
          hint: fc.hint ? sanitizeContent(fc.hint) : null,
          topic: fc.topic,
        })),
      })),
    };

    const filename = `${cert.code.toLowerCase()}.json`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(pack, null, 2));

    const totalFlashcards = pack.studyNotes.reduce(
      (sum, n) => sum + n.flashcards.length,
      0
    );
    console.log(
      `  ${cert.code}: ${pack.studyNotes.length} notes, ${totalFlashcards} flashcards → ${filename}`
    );
  }

  console.log("\nContent pack extracted to prisma/content-pack/");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
