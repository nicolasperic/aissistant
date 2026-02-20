import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJsonCompletion } from "@/lib/ai";
import { buildAdaptiveSuggestionsPrompt } from "@/lib/prompts/adaptive";
import type { AiSuggestion } from "@/lib/types";

export async function GET() {
  try {
    const [recentReviews, activeGoals, upcomingEvents, stats] = await Promise.all([
      db.weeklyReview.findMany({
        orderBy: { weekStart: "desc" },
        take: 6,
      }),
      db.goal.findMany({ where: { progress: { lt: 100 } } }),
      db.event.findMany({
        where: { eventDate: { gte: new Date(), lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) } },
        orderBy: { eventDate: "asc" },
      }),
      db.userStats.findUnique({ where: { id: "singleton" } }),
    ]);

    const systemPrompt = buildAdaptiveSuggestionsPrompt({
      recentReviews,
      activeGoals,
      upcomingEvents,
      currentStreak: stats?.currentStreak ?? 0,
      totalPoints: stats?.totalPoints ?? 0,
    });

    const response = await generateJsonCompletion<{ suggestions: AiSuggestion[] }>(
      systemPrompt,
      `Provide adaptive suggestions based on my current progress and upcoming events. Today is ${new Date().toISOString().split("T")[0]}.`
    );

    // Save AI context
    await db.aiContext.create({
      data: {
        type: "suggest",
        prompt: systemPrompt.substring(0, 5000),
        response: JSON.stringify(response),
      },
    });

    return NextResponse.json(response.suggestions);
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
