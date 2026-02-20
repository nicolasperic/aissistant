import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJsonCompletion } from "@/lib/ai";
import { buildPlanPrompt } from "@/lib/prompts/weekly-plan";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";
import type { AiWeeklyPlan } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rangeType: "weekly" | "monthly" = body.rangeType || "weekly";
    const goalIds: string[] = body.goalIds || [];

    // Compute date range
    const now = new Date();
    let planStart: Date;
    let planEnd: Date;

    if (rangeType === "monthly") {
      planStart = body.planStart
        ? new Date(body.planStart)
        : startOfWeek(now, { weekStartsOn: 1 });
      planEnd = body.planEnd
        ? new Date(body.planEnd)
        : endOfWeek(addWeeks(planStart, 3), { weekStartsOn: 1 });
    } else {
      planStart = body.weekStart
        ? new Date(body.weekStart)
        : startOfWeek(now, { weekStartsOn: 1 });
      planEnd = endOfWeek(planStart, { weekStartsOn: 1 });
    }

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

    // Save generated tasks to DB
    const createdTasks = await Promise.all(
      plan.tasks.map((task) =>
        db.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            scheduledDate: new Date(task.scheduledDate),
            estimatedMinutes: task.estimatedMinutes,
            goalId: task.goalId || null,
          },
        })
      )
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
