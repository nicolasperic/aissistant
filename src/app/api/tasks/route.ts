import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onTaskCompleted, awardPoints, POINTS } from "@/lib/rewards";
import { recalculateGoalProgress } from "@/lib/goal-progress";
import { parseDateOnly } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const goalId = searchParams.get("goalId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const completedFrom = searchParams.get("completedFrom");
  const completedTo = searchParams.get("completedTo");

  const where: Record<string, unknown> = {};
  if (goalId) where.goalId = goalId;
  if (status) where.status = status;
  if (from || to) {
    where.scheduledDate = {};
    if (from) (where.scheduledDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.scheduledDate as Record<string, unknown>).lte = new Date(to);
  }
  if (completedFrom || completedTo) {
    where.completedAt = {};
    if (completedFrom) (where.completedAt as Record<string, unknown>).gte = new Date(completedFrom);
    if (completedTo) (where.completedAt as Record<string, unknown>).lte = new Date(completedTo);
  }

  const tasks = await db.task.findMany({
    where,
    include: { goal: true, studyNote: { select: { id: true } } },
    orderBy: [{ scheduledDate: "asc" }, { priority: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority || "MEDIUM",
      scheduledDate: body.scheduledDate ? parseDateOnly(body.scheduledDate) : null,
      estimatedMinutes: body.estimatedMinutes,
      goalId: body.goalId || null,
    },
    include: { goal: true, studyNote: { select: { id: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const previousTask = await db.task.findUnique({ where: { id: body.id } });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.planningNotes !== undefined) data.planningNotes = body.planningNotes;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.scheduledDate !== undefined) data.scheduledDate = body.scheduledDate ? parseDateOnly(body.scheduledDate) : null;
  if (body.estimatedMinutes !== undefined) data.estimatedMinutes = body.estimatedMinutes;
  if (body.actualMinutes !== undefined) data.actualMinutes = body.actualMinutes;
  if (body.goalId !== undefined) data.goalId = body.goalId || null;

  if (body.status !== "COMPLETED" && previousTask?.status === "COMPLETED") {
    data.completedAt = null;
  }

  let newBadges: string[] = [];

  if (body.status === "COMPLETED" && previousTask?.status !== "COMPLETED") {
    data.completedAt = new Date();
    const result = await onTaskCompleted();
    newBadges = result.newBadges;

    // Check if all daily tasks are complete
    if (previousTask?.scheduledDate) {
      const dayStart = new Date(previousTask.scheduledDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTasks = await db.task.findMany({
        where: {
          scheduledDate: { gte: dayStart, lt: dayEnd },
          id: { not: body.id },
        },
      });

      const allDone = dayTasks.every((t) => t.status === "COMPLETED");
      if (allDone && dayTasks.length > 0) {
        await awardPoints(POINTS.COMPLETE_ALL_DAILY);
      }
    }
  }

  const task = await db.task.update({
    where: { id: body.id },
    data,
    include: { goal: true, studyNote: { select: { id: true } } },
  });

  // Recalculate goal progress up the hierarchy whenever status changes
  const statusChanged = body.status !== undefined && body.status !== previousTask?.status;
  if (statusChanged && task.goalId) {
    await recalculateGoalProgress(task.goalId);
  }

  return NextResponse.json({ ...task, newBadges });
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
