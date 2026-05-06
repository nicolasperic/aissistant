import type { Goal, Task, Event, WeeklyReview } from "@prisma/client";

type StudyNoteRef = {
  id: string;
  title: string;
  section: string | null;
  position: number;
};

export function buildPlanPrompt(context: {
  focusGoals: Goal[];
  allGoals: Goal[];
  lastWeekReview: WeeklyReview | null;
  upcomingEvents: Event[];
  incompleteTasks: Task[];
  rangeType: "weekly" | "monthly";
  planStart: string;
  planEnd: string;
  certStudyNotes?: Map<string, StudyNoteRef[]>;
}): string {
  const isMonthly = context.rangeType === "monthly";
  const rangeLabel = isMonthly ? "multi-week" : "weekly";

  const yearlyGoals = context.allGoals.filter((g) => g.type === "YEARLY");
  const quarterlyGoals = context.allGoals.filter((g) => g.type === "QUARTERLY");
  const monthlyGoals = context.allGoals.filter((g) => g.type === "MONTHLY");

  // Build study notes index section if available
  const hasStudyNotes = context.certStudyNotes && context.certStudyNotes.size > 0;
  let studyNotesSection = "";
  if (hasStudyNotes) {
    const parts: string[] = [];
    for (const [goalId, notes] of context.certStudyNotes!) {
      const goal = context.focusGoals.find((g) => g.id === goalId);
      if (!goal || notes.length === 0) continue;
      parts.push(`### Study notes for: ${goal.title}
These are existing study notes available to link to tasks. Use the studyNoteId field to assign one note per task.
| # | studyNoteId | Title | Section |
|---|---|---|---|
${notes.map((n) => `| ${n.position} | ${n.id} | ${n.title} | ${n.section || "—"} |`).join("\n")}`);
    }
    if (parts.length > 0) {
      studyNotesSection = `\n## Available Study Notes\n${parts.join("\n\n")}`;
    }
  }

  // Study note linking instructions
  const studyNoteLinkingRules = hasStudyNotes
    ? `
CRITICAL — Study Note Linking Rules:
- Create exactly ONE task per day. Do not schedule multiple tasks on the same day.
- When study notes are available above, assign exactly one studyNoteId per task using the IDs from the table.
- Each studyNoteId can only be used ONCE across all tasks (one-to-one relationship).
- Follow the study notes in position order (lower position number = earlier in the plan).
- If there are more study notes than available days, prioritize notes covering the highest-weighted exam sections.
- If a study note covers too much for one session, still link it to one task and describe the focus area in the task description.
- Tasks without a matching study note (e.g. practice test days, review days) should omit studyNoteId or set it to null.`
    : `
IMPORTANT — One Task Per Day:
- Create exactly ONE task per day. Do not schedule multiple tasks on the same day.`;

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
${studyNotesSection}

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
${studyNoteLinkingRules}

First, provide weeklyGoals — containers that organize tasks into themed weeks:
- weekKey: Short identifier like "week1", "week2" (used to link tasks)
- title: Descriptive title like "Week 1 — Magento Architecture & Theming"
- description: 1-2 sentence overview of that week's focus
- startDate: ISO date of the Monday starting that week
- endDate: ISO date of the Sunday ending that week
- parentGoalId: ID of the most relevant focus goal from the hierarchy above, or null
For a weekly plan create 1 weekly goal. For a monthly plan create one per week (up to 4).

For each task, provide:
- title: Clear, actionable task title
- description: Detailed description with specific subtopics, key concepts, and actionable guidance. For study tasks: include bullet points of what to learn, specific tools/commands/concepts covered, and any key angle to focus on (e.g. exam relevance, practical application). Do NOT leave this empty for study or work tasks.
- priority: LOW, MEDIUM, HIGH, or CRITICAL
- scheduledDate: ISO date string (YYYY-MM-DD) — must be within ${context.planStart} to ${context.planEnd}
- estimatedMinutes: Estimated time in minutes
- weekKey: The weekKey of the weekly goal this task belongs to${hasStudyNotes ? "\n- studyNoteId: The ID of the study note to link to this task (from the Available Study Notes table above), or null if no note applies" : ""}

Also provide:
- summary: A 2-3 sentence overview of the ${rangeLabel} focus
- focusAreas: Array of 3-5 key focus areas

Respond in JSON format:
{
  "weeklyGoals": [{ "weekKey": "week1", "title": "Week 1 — ...", "description": "...", "startDate": "2026-02-23", "endDate": "2026-03-01", "parentGoalId": "goal_cuid_or_null" }],
  "tasks": [{ "title": "...", "description": "...", "priority": "MEDIUM", "scheduledDate": "2026-02-24", "estimatedMinutes": 60, "weekKey": "week1"${hasStudyNotes ? ', "studyNoteId": "note_id_or_null"' : ""} }],
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
