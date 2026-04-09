import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cert = await db.certification.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { percentage: "desc" } },
      _count: { select: { questions: true } },
      practiceTests: {
        orderBy: { createdAt: "asc" },
        include: {
          attempts: {
            orderBy: { startedAt: "desc" },
            select: {
              id: true,
              startedAt: true,
              completedAt: true,
              durationSeconds: true,
              score: true,
              totalQuestions: true,
              passed: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!cert) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  return NextResponse.json(cert);
}
