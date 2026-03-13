import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const stats = await db.userStats.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ completedTourSteps: stats?.completedTourSteps ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json() as { steps?: string[]; reset?: boolean };

  if (body.reset) {
    await db.userStats.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", completedTourSteps: [] },
      update: { completedTourSteps: [] },
    });
    return NextResponse.json({ ok: true });
  }

  const steps = body.steps ?? [];
  const stats = await db.userStats.findUnique({ where: { id: "singleton" } });
  const existing = new Set(stats?.completedTourSteps ?? []);
  steps.forEach((s) => existing.add(s));

  await db.userStats.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", completedTourSteps: Array.from(existing) },
    update: { completedTourSteps: Array.from(existing) },
  });

  return NextResponse.json({ ok: true });
}
