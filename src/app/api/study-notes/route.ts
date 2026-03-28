import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const notes = await db.studyNote.findMany({
    include: {
      _count: { select: { flashcards: true } },
      task: {
        include: {
          goal: {
            include: {
              parent: {
                include: {
                  parent: {
                    include: {
                      parent: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
}
