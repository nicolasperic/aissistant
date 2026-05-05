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

<<<<<<< Updated upstream
    // Create a Goal and optionally an Event for each "preparing" cert
=======
    // For "PREPARING" certs: create a goal + event
>>>>>>> Stashed changes
    if (cert.status === "PREPARING") {
      const def = getCertByCode(cert.certCode);
      const name = def?.name ?? cert.certCode;
      const level = def?.level ?? "certification";

<<<<<<< Updated upstream
      // Create a QUARTERLY goal for the cert
      const goalTitle = `Pass ${name} (${cert.certCode.toUpperCase()})`;
      const existingGoal = await db.goal.findFirst({ where: { title: goalTitle } });
      if (!existingGoal) {
        await db.goal.create({
          data: {
            title: goalTitle,
            type: "QUARTERLY",
            shortName: cert.certCode.toUpperCase(),
            startDate: new Date(),
            endDate: cert.examDate ? new Date(cert.examDate + "T00:00:00") : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
=======
      // Create a study goal with planning notes for AI plan generation
      const goalTitle = `Pass ${name} (${cert.certCode})`;
      const existingGoal = await db.goal.findFirst({
        where: { title: goalTitle, category: "certification" },
      });

      let goalId = existingGoal?.id;

      if (!existingGoal) {
        const now = new Date();
        const endDate = cert.examDate
          ? new Date(cert.examDate + "T00:00:00")
          : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +3 months default

        const goal = await db.goal.create({
          data: {
            title: goalTitle,
            description: def?.description ?? `Study and pass the ${cert.certCode} exam`,
            type: "QUARTERLY",
            startDate: now,
            endDate,
            category: "certification",
            notes: def?.planningNotes ?? null,
>>>>>>> Stashed changes
          },
        });
        goalId = goal.id;
      }

      // Link goal to UserCertification
      if (goalId) {
        await db.userCertification.update({
          where: { certCode: cert.certCode },
          data: { goalId },
        });
      }

      // Create an Event for certs with an exam date
      if (cert.examDate) {
        const eventTitle = `${name} Exam (${cert.certCode})`;
        const existingEvent = await db.event.findFirst({
          where: { title: eventTitle },
        });

        if (!existingEvent) {
          await db.event.create({
            data: {
              title: eventTitle,
              description: `${level.charAt(0).toUpperCase() + level.slice(1)}-level ${def?.provider === "adobe-commerce" ? "Adobe Commerce " : ""}certification exam.`,
              eventDate: new Date(cert.examDate + "T00:00:00"),
              category: "certification",
              goalId,
            },
          });
        }
      }

      // Create an Event if an exam date is set
      if (cert.examDate) {
        const eventTitle = `${name} Exam (${cert.certCode})`;
        const existingEvent = await db.event.findFirst({ where: { title: eventTitle } });
        if (!existingEvent) {
          await db.event.create({
            data: {
              title: eventTitle,
              description: `${level.charAt(0).toUpperCase() + level.slice(1)}-level ${def?.provider === "adobe-commerce" ? "Adobe Commerce " : ""}certification exam.`,
              eventDate: new Date(cert.examDate + "T00:00:00"),
              category: "certification",
            },
          });
        }
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
