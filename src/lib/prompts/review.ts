import type { Task, WeeklyReview, Goal } from "@prisma/client";

export function buildReviewPrompt(context: {
  completedTasks: Task[];
  incompleteTasks: Task[];
  weeklyReview: Partial<WeeklyReview>;
  activeGoals: Goal[];
  previousReviews: WeeklyReview[];
}): string {
  return `You are an AI life planning assistant reviewing a user's weekly performance.

## This Week's Completed Tasks
${context.completedTasks.map((t) => `- ${t.title} [Priority: ${t.priority}]${t.actualMinutes ? ` (${t.actualMinutes} min)` : ""}`).join("\n") || "No tasks completed"}

## Incomplete Tasks
${context.incompleteTasks.map((t) => `- ${t.title} [Priority: ${t.priority}, Status: ${t.status}]`).join("\n") || "All tasks completed!"}

## Week Statistics
- Rating: ${context.weeklyReview.rating || "Not rated"}/5
- Completed: ${context.weeklyReview.completedTasks}/${context.weeklyReview.totalTasks} tasks
- Study Minutes: ${context.weeklyReview.studyMinutes || 0}
- User Notes: ${context.weeklyReview.userNotes || "None"}

## Active Goals
${context.activeGoals.map((g) => `- ${g.title} (${g.progress}% complete, ${g.type})`).join("\n")}

## Previous Week Reviews (last 4)
${context.previousReviews.slice(0, 4).map((r) => `- Week of ${r.weekStart.toISOString().split("T")[0]}: ${r.completedTasks}/${r.totalTasks} tasks, Rating: ${r.rating}/5`).join("\n") || "No previous reviews"}

## Instructions
Provide a thoughtful, encouraging but honest review. Include:
- analysis: 2-3 paragraph analysis of the week
- recommendations: Specific, actionable recommendations for next week
- highlights: Array of 2-4 positive highlights
- areasForImprovement: Array of 2-4 areas to improve

Respond in JSON format:
{
  "analysis": "...",
  "recommendations": "...",
  "highlights": ["..."],
  "areasForImprovement": ["..."]
}`;
}
