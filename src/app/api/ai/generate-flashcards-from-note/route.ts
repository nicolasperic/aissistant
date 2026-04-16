import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJsonCompletion } from "@/lib/ai";

interface FlashcardPair {
  question: string;
  answer: string;
  hint?: string;
}

interface FlashcardsResponse {
  flashcards: FlashcardPair[];
}

const SYSTEM_PROMPT = `You are a flashcard creator for technical certification exam preparation.

Rules:
- Generate EXACTLY 15 flashcards — no more, no less.
- Each card must test a DISTINCT concept. Never create two cards that test the same fact from different angles.
- If you find yourself with more than 15 candidates, keep only the highest-value exam traps and discard duplicates or low-priority details.
- Priority order: (1) Quick-Reference Checklist items, (2) "Tricky Concepts / Exam Traps" callouts, (3) key architectural decisions explained in the body.
- Questions must be specific and unambiguous — avoid vague questions like "What is X?"
- Answers must be concise (1–3 sentences max).
- Hints give a nudge without revealing the answer.

Return valid JSON only.`;

export async function POST(req: NextRequest) {
  const { studyNoteId } = await req.json();

  if (!studyNoteId) {
    return NextResponse.json({ error: "studyNoteId required" }, { status: 400 });
  }

  const note = await db.studyNote.findUnique({
    where: { id: studyNoteId },
    include: { task: { include: { goal: true } } },
  });

  if (!note) {
    return NextResponse.json({ error: "Study note not found" }, { status: 404 });
  }

  const userMessage = `From the following study notes, create exactly 15 flashcards.

Step 1: Identify all candidate facts from the Quick-Reference Checklist and Exam Trap sections.
Step 2: Deduplicate — if two candidates test the same underlying concept, keep only the more precise one.
Step 3: If you still have more than 15, drop the least exam-relevant ones until you have exactly 15.

Return JSON: { "flashcards": [{ "question": "...", "answer": "...", "hint": "..." }] }

Study Notes:
${note.content}`;

  const result = await generateJsonCompletion<FlashcardsResponse>(SYSTEM_PROMPT, userMessage);

  const goalId = note.goalId ?? note.task?.goalId ?? null;
  const topic = note.task?.title ?? note.title;

  const created = await db.$transaction(
    result.flashcards.map((card) =>
      db.flashcard.create({
        data: {
          question: card.question,
          answer: card.answer,
          hint: card.hint ?? null,
          topic,
          goalId,
          studyNoteId,
        },
      })
    )
  );

  await db.aiContext.create({
    data: {
      type: "generate-flashcards-from-note",
      prompt: userMessage,
      response: JSON.stringify(result),
      metadata: { studyNoteId, count: created.length },
    },
  });

  return NextResponse.json({ count: created.length, flashcards: created }, { status: 201 });
}
