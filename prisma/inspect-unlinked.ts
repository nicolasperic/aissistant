import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const notes = await db.studyNote.findMany({
    orderBy: { createdAt: "desc" },
    take: 7,
    select: { id: true, title: true, createdAt: true, _count: { select: { flashcards: true } } },
  });
  console.log("=== 7 most recent study notes ===");
  notes.forEach((n) => console.log(n.id, "|", n._count.flashcards, "fc |", n.title));

  const unlinked = await db.flashcard.findMany({
    where: { studyNoteId: null },
    select: { id: true, topic: true, question: true },
  });
  console.log("\n=== Unlinked flashcards:", unlinked.length, "===");
  const byTopic: Record<string, number> = {};
  unlinked.forEach((f) => {
    byTopic[f.topic] = (byTopic[f.topic] || 0) + 1;
  });
  console.log("By topic:", JSON.stringify(byTopic, null, 2));
}

main().finally(() => db.$disconnect());
