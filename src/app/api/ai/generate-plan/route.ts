import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJsonCompletion } from "@/lib/ai";
import { buildPlanPrompt } from "@/lib/prompts/weekly-plan";
import { startOfWeek, endOfWeek } from "date-fns";
import type { AiWeeklyPlan } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goalIds: string[] = body.goalIds || [];

    // Compute date range — always use explicit planStart/planEnd when provided
    const now = new Date();
    let planStart: Date;
    let planEnd: Date;

    if (body.planStart && body.planEnd) {
      planStart = new Date(body.planStart);
      planEnd = new Date(body.planEnd);
    } else if (body.weekStart) {
      planStart = new Date(body.weekStart);
      planEnd = endOfWeek(planStart, { weekStartsOn: 1 });
    } else {
      planStart = startOfWeek(now, { weekStartsOn: 1 });
      planEnd = endOfWeek(planStart, { weekStartsOn: 1 });
    }

    // Auto-detect rangeType from the date span
    const daySpan = Math.round((planEnd.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24));
    const rangeType: "weekly" | "monthly" = daySpan <= 7 ? "weekly" : "monthly";

    const planEndBuffer = new Date(planEnd.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [allGoals, focusGoals, lastReview, upcomingEvents, incompleteTasks] =
      await Promise.all([
        db.goal.findMany(),
        goalIds.length > 0
          ? db.goal.findMany({ where: { id: { in: goalIds } } })
          : Promise.resolve([]),
        db.weeklyReview.findFirst({ orderBy: { weekStart: "desc" } }),
        db.event.findMany({
          where: { eventDate: { gte: now, lte: planEndBuffer } },
          orderBy: { eventDate: "asc" },
        }),
        db.task.findMany({
          where: { status: { in: ["PENDING", "IN_PROGRESS"] }, scheduledDate: { lt: planStart } },
        }),
      ]);

    const planStartStr = planStart.toISOString().split("T")[0];
    const planEndStr = planEnd.toISOString().split("T")[0];

    const systemPrompt = buildPlanPrompt({
      focusGoals,
      allGoals,
      lastWeekReview: lastReview,
      upcomingEvents,
      incompleteTasks,
      rangeType,
      planStart: planStartStr,
      planEnd: planEndStr,
    });

    const plan = await generateJsonCompletion<AiWeeklyPlan>(
      systemPrompt,
      `Generate a ${rangeType} plan from ${planStartStr} to ${planEndStr}. Today is ${now.toISOString().split("T")[0]}.${focusGoals.length > 0 ? ` Focus on: ${focusGoals.map((g) => g.title).join(", ")}.` : ""}`
    );

    // Create weekly goal containers first, build weekKey → DB id map
    const weeklyGoalMap = new Map<string, string>();
    if (plan.weeklyGoals?.length > 0) {
      for (const wg of plan.weeklyGoals) {
        const created = await db.goal.create({
          data: {
            title: wg.title,
            description: wg.description,
            type: "WEEKLY",
            startDate: new Date(wg.startDate),
            endDate: new Date(wg.endDate),
            parentId: wg.parentGoalId || null,
            progress: 0,
            category: focusGoals[0]?.category ?? null,
          },
        });
        weeklyGoalMap.set(wg.weekKey, created.id);
      }
    }

    // Save generated tasks to DB, linking to weekly goals via weekKey
    const createdTasks = await Promise.all(
      plan.tasks.map((task) => {
        const goalId = task.weekKey
          ? (weeklyGoalMap.get(task.weekKey) ?? task.goalId ?? null)
          : (task.goalId ?? null);
        return db.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            scheduledDate: new Date(task.scheduledDate),
            estimatedMinutes: task.estimatedMinutes,
            goalId,
            status: "DRAFT",
          },
        });
      })
    );

    // Save AI context
    await db.aiContext.create({
      data: {
        type: `${rangeType}_plan`,
        prompt: systemPrompt.substring(0, 5000),
        response: JSON.stringify(plan),
        metadata: {
          rangeType,
          planStart: planStart.toISOString(),
          planEnd: planEnd.toISOString(),
          goalIds,
        },
      },
    });

    return NextResponse.json({
      plan,
      tasks: createdTasks,
      rangeType,
      planStart: planStart.toISOString(),
      planEnd: planEnd.toISOString(),
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
