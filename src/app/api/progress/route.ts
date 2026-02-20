import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const goalId = searchParams.get("goalId");
  const limit = parseInt(searchParams.get("limit") || "30");

  const where: Record<string, unknown> = {};
  if (goalId) where.goalId = goalId;

  const snapshots = await db.progressSnapshot.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Take a snapshot for each goal or a specific goal
  if (body.goalId) {
    const goal = await db.goal.findUnique({ where: { id: body.goalId } });
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const snapshot = await db.progressSnapshot.create({
      data: {
        date: new Date(),
        goalId: goal.id,
        progress: goal.progress,
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  }

  // Snapshot all active goals
  const goals = await db.goal.findMany({
    where: { progress: { lt: 100 } },
  });

  const snapshots = await Promise.all(
    goals.map((goal) =>
      db.progressSnapshot.create({
        data: {
          date: new Date(),
          goalId: goal.id,
          progress: goal.progress,
        },
      })
    )
  );

  return NextResponse.json(snapshots, { status: 201 });
}
