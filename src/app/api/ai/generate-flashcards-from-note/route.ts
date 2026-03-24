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

const SYSTEM_PROMPT = `You are a flashcard creator for technical certification exam preparation. Extract testable Q&A pairs from study content.

Focus primarily on the "Quick-Reference Checklist" section. Each card should test one specific, concrete fact.
- Questions should be clear and unambiguous
- Answers should be concise but complete
- Hints should give a nudge without giving away the answer

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

  const userMessage = `From the following study notes, create flashcards. Focus primarily on the Quick-Reference Checklist section but also pick up key exam-focus points throughout the content.

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
