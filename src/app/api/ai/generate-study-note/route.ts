import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCompletion } from "@/lib/ai";

const SYSTEM_PROMPT = `You are an expert study content creator specializing in technical certifications. Generate comprehensive, well-structured study notes in Markdown format.

Requirements:
- Use proper Markdown: headings (##, ###), code blocks with language identifiers, **bold**, *italic*, tables
- Throughout the content, add "**Exam focus:**" callout bullets for key testable concepts — place them near the relevant section
- Use fenced code blocks with correct language identifiers (e.g. \`\`\`php, \`\`\`xml, \`\`\`bash) for all code examples
- Be thorough and detailed — this replaces manual CLI-generated study notes
- For ASCII diagrams and box-drawing art, use only plain ASCII characters (-, |, +, >, <, v, ^, /) — do NOT use Unicode box-drawing or arrow characters (─, │, ┌, ►, ▼, etc.) as they cause alignment issues in monospace fonts
- When generating a Table of Contents, anchor links MUST exactly match the slugified full heading text: lowercase, spaces replaced with hyphens, special characters removed. Example: heading "## 2. The Compilation Flow" → anchor "#2-the-compilation-flow". Never shorten or abbreviate anchors.
- End the document with a ## Quick-Reference Checklist section containing concise bullet points of everything testable on the exam`;

export async function POST(req: NextRequest) {
  const { taskId } = await req.json();

  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  // Return existing study note if already generated
  const existing = await db.studyNote.findUnique({
    where: { taskId },
    select: { id: true, title: true },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, title: existing.title, existing: true });
  }

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { goal: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const userMessage = [
    `Generate study notes for the following task:`,
    ``,
    `**Task:** ${task.title}`,
    task.goal ? `**Goal:** ${task.goal.title}` : null,
    ``,
    task.description
      ? `**Task Description:**\n${task.description}`
      : null,
    task.planningNotes
      ? `\n**Additional context and focus areas from the student:**\n${task.planningNotes}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const content = await generateCompletion(SYSTEM_PROMPT, userMessage, 32000);

  const goalId = task.goalId ?? undefined;

  const note = await db.studyNote.create({
    data: {
      title: task.title,
      content,
      taskId: task.id,
      goalId: goalId ?? null,
    },
  });

  // Log AI call
  await db.aiContext.create({
    data: {
      type: "generate-study-note",
      prompt: userMessage,
      response: content,
      metadata: { taskId: task.id, studyNoteId: note.id },
    },
  });

  return NextResponse.json({ id: note.id, title: note.title, existing: false }, { status: 201 });
}
