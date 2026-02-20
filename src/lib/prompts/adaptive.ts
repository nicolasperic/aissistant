import type { WeeklyReview, Goal, Event } from "@prisma/client";

export function buildAdaptiveSuggestionsPrompt(context: {
  recentReviews: WeeklyReview[];
  activeGoals: Goal[];
  upcomingEvents: Event[];
  currentStreak: number;
  totalPoints: number;
}): string {
  return `You are an AI life planning assistant providing adaptive suggestions based on the user's performance patterns.

## Recent Weekly Reviews (last 6 weeks)
${context.recentReviews.map((r) => `- Week of ${r.weekStart.toISOString().split("T")[0]}: ${r.completedTasks}/${r.totalTasks} tasks (${r.totalTasks > 0 ? Math.round((r.completedTasks / r.totalTasks) * 100) : 0}%), Rating: ${r.rating}/5, Study: ${r.studyMinutes} min`).join("\n") || "No reviews yet"}

## Active Goals
${context.activeGoals.map((g) => `- ${g.title} (${g.progress}% complete, ${g.type}, Category: ${g.category || "general"})`).join("\n")}

## Upcoming Events (next 60 days)
${context.upcomingEvents.map((e) => {
    const eventDate = new Date(e.eventDate); eventDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `- ${e.title} in ${daysUntil} days [${e.category || "general"}]`;
  }).join("\n") || "No upcoming events"}

## Gamification Stats
- Current streak: ${context.currentStreak} days
- Total points: ${context.totalPoints}

## Instructions
Generate 3-5 actionable suggestions. Each suggestion should have:
- type: "info" (insight), "warning" (concern), or "action" (recommended action)
- title: Short title (max 60 chars)
- message: Detailed explanation (2-3 sentences)
- actionLabel: Optional button label for actionable items

Respond in JSON format:
{
  "suggestions": [{ "type": "...", "title": "...", "message": "...", "actionLabel": "..." }]
}`;
}
