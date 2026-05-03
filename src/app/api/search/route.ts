import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ studyNotes: [], flashcards: [] });
  }

  const [studyNotes, flashcards] = await Promise.all([
    db.studyNote.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        certCode: true,
        task: {
          select: {
            goal: {
              select: {
                title: true,
                parent: {
                  select: { title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { position: "asc" },
      take: 20,
    }),
    db.flashcard.findMany({
      where: {
        OR: [
          { question: { contains: q, mode: "insensitive" } },
          { answer: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        question: true,
        answer: true,
        topic: true,
        examCode: true,
        studyNoteId: true,
      },
      take: 10,
    }),
  ]);

  // Extract a snippet around the match for study notes
  const notesWithSnippets = studyNotes.map((note) => {
    const snippet = extractSnippet(note.content, q);
    const certGoal = note.certCode ?? note.task?.goal?.parent?.title ?? note.task?.goal?.title ?? null;
    return {
      id: note.id,
      title: note.title,
      snippet,
      certGoal,
    };
  });

  return NextResponse.json({
    studyNotes: notesWithSnippets,
    flashcards,
  });
}

function extractSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 120) + "...";

  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 60);
  let snippet = content.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  // Strip markdown formatting for cleaner display
  snippet = snippet.replace(/[#*`_~\[\]]/g, "");

  return snippet;
}
