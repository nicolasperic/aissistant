import type { Goal, Task, Event, WeeklyReview } from "@prisma/client";

export function buildPlanPrompt(context: {
  focusGoals: Goal[];
  allGoals: Goal[];
  lastWeekReview: WeeklyReview | null;
  upcomingEvents: Event[];
  incompleteTasks: Task[];
  rangeType: "weekly" | "monthly";
  planStart: string;
  planEnd: string;
}): string {
  const isMonthly = context.rangeType === "monthly";
  const rangeLabel = isMonthly ? "monthly (4-week)" : "weekly";

  const yearlyGoals = context.allGoals.filter((g) => g.type === "YEARLY");
  const quarterlyGoals = context.allGoals.filter((g) => g.type === "QUARTERLY");
  const monthlyGoals = context.allGoals.filter((g) => g.type === "MONTHLY");

  return `You are an AI life planning assistant. Your job is to create a balanced, achievable ${rangeLabel} plan aligned with the user's goals.

## Planning Period
From ${context.planStart} to ${context.planEnd} (${rangeLabel} plan)

## Focus Goals (prioritize these)
${context.focusGoals.length === 0
  ? "No specific focus — balance across all goals"
  : context.focusGoals.map((g) => {
      const header = `- ${g.title} (${g.progress}% complete) [Type: ${g.type}] [Category: ${g.category || "general"}] [ID: ${g.id}]`;
      if (!g.notes) return header;
      const indentedNotes = g.notes.split("\n").map((l) => `  ${l}`).join("\n");
      return `${header}\n  Planning Notes:\n${indentedNotes}`;
    }).join("\n\n")}

## Full Goal Hierarchy

### Yearly Goals
${yearlyGoals.map((g) => `- ${g.title} (${g.progress}% complete) [Category: ${g.category || "general"}] [ID: ${g.id}]`).join("\n") || "No yearly goals set"}

### Quarterly Goals
${quarterlyGoals.map((g) => `- ${g.title} (${g.progress}% complete) [Category: ${g.category || "general"}] [ID: ${g.id}]`).join("\n") || "No quarterly goals set"}

### Monthly Goals
${monthlyGoals.map((g) => `- ${g.title} (${g.progress}% complete) [Category: ${g.category || "general"}] [ID: ${g.id}]`).join("\n") || "No monthly goals set"}

## Last Week's Review
${context.lastWeekReview ? `Rating: ${context.lastWeekReview.rating}/5
Completed: ${context.lastWeekReview.completedTasks}/${context.lastWeekReview.totalTasks} tasks
Study Minutes: ${context.lastWeekReview.studyMinutes}
Notes: ${context.lastWeekReview.userNotes || "None"}
AI Analysis: ${context.lastWeekReview.aiAnalysis || "None"}` : "No review from last week"}

## Upcoming Events (within planning period + 14 days)
${context.upcomingEvents.map((e) => {
    const eventDate = new Date(e.eventDate); eventDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `- ${e.title} on ${e.eventDate.toISOString().split("T")[0]} (${daysUntil} days away) [${e.category || "general"}]`;
  }).join("\n") || "No upcoming events"}

## Incomplete Tasks from Previous Periods
${context.incompleteTasks.map((t) => `- ${t.title} [Priority: ${t.priority}]`).join("\n") || "No incomplete tasks"}

## Instructions
Create a ${rangeLabel} plan with daily tasks from ${context.planStart} to ${context.planEnd}. ${isMonthly ? "Spread tasks across all 4 weeks. For certification exams, ramp up study intensity as exam dates approach. Include rest days and lighter weekends." : "Distribute tasks Monday through Sunday."}

${context.focusGoals.length > 0 ? `IMPORTANT: The user has selected specific focus goals. Heavily prioritize tasks that advance these goals. At least 70% of tasks should relate to the focus goals.` : ""}

For each task, provide:
- title: Clear, actionable task title
- description: Brief description (optional)
- priority: LOW, MEDIUM, HIGH, or CRITICAL
- scheduledDate: ISO date string (YYYY-MM-DD) — must be within ${context.planStart} to ${context.planEnd}
- estimatedMinutes: Estimated time in minutes

Also provide:
- summary: A 2-3 sentence overview of the ${rangeLabel} focus
- focusAreas: Array of 3-5 key focus areas

Respond in JSON format:
{
  "tasks": [{ "title": "...", "description": "...", "priority": "MEDIUM", "scheduledDate": "2026-02-10", "estimatedMinutes": 60 }],
  "summary": "...",
  "focusAreas": ["..."]
}`;
}

// Keep backward-compatible export
export const buildWeeklyPlanPrompt = (context: {
  yearlyGoals: Goal[];
  quarterlyGoals: Goal[];
  monthlyGoals: Goal[];
  lastWeekReview: WeeklyReview | null;
  upcomingEvents: Event[];
  incompleteTasks: Task[];
}) => buildPlanPrompt({
  focusGoals: [],
  allGoals: [...context.yearlyGoals, ...context.quarterlyGoals, ...context.monthlyGoals],
  lastWeekReview: context.lastWeekReview,
  upcomingEvents: context.upcomingEvents,
  incompleteTasks: context.incompleteTasks,
  rangeType: "weekly",
  planStart: "",
  planEnd: "",
});
