import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCertByCode } from "@/lib/certifications";

type CertInput = {
  certCode: string;
  status: "PASSED" | "PREPARING" | "NOT_INTERESTED";
  passedAt?: string;
  examDate?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as { certifications: CertInput[] };
  const { certifications } = body;

  if (!certifications?.length) {
    return NextResponse.json({ error: "No certifications provided" }, { status: 400 });
  }

  // Save user certification selections
  for (const cert of certifications) {
    await db.userCertification.upsert({
      where: { certCode: cert.certCode },
      create: {
        certCode: cert.certCode,
        status: cert.status,
        passedAt: cert.passedAt ? new Date(cert.passedAt) : null,
        examDate: cert.examDate ? new Date(cert.examDate) : null,
      },
      update: {
        status: cert.status,
        passedAt: cert.passedAt ? new Date(cert.passedAt) : null,
        examDate: cert.examDate ? new Date(cert.examDate) : null,
      },
    });

    // Create an Event for each "preparing" cert with an exam date
    if (cert.status === "PREPARING" && cert.examDate) {
      const def = getCertByCode(cert.certCode);
      const name = def?.name ?? cert.certCode;
      const level = def?.level ?? "certification";
      const title = `${name} Exam (${cert.certCode})`;

      // Avoid duplicates — check if an event with this title already exists
      const existing = await db.event.findFirst({
        where: { title },
      });

      if (!existing) {
        await db.event.create({
          data: {
            title,
            description: `${level.charAt(0).toUpperCase() + level.slice(1)}-level ${def?.provider === "adobe-commerce" ? "Adobe Commerce " : ""}certification exam.`,
            eventDate: new Date(cert.examDate + "T00:00:00"),
            category: "certification",
          },
        });
      }
    }
  }

  // Mark onboarding as completed
  await db.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", onboardingCompleted: true },
    update: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
}
