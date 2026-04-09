import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const certifications = await db.certification.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { sections: true, questions: true } },
      practiceTests: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { attempts: true } },
        },
      },
    },
  });

  return NextResponse.json(certifications);
}
