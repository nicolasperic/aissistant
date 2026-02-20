import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJsonCompletion } from "@/lib/ai";
import { buildReviewPrompt } from "@/lib/prompts/review";
import type { AiReviewResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekStart, weekEnd, rating, userNotes, studyMinutes } = body;

    const wsDate = new Date(weekStart);
    const weDate = new Date(weekEnd);

    const [completedTasks, incompleteTasks, activeGoals, previousReviews] =
      await Promise.all([
        db.task.findMany({
          where: {
            status: "COMPLETED",
            scheduledDate: { gte: wsDate, lte: weDate },
          },
        }),
        db.task.findMany({
          where: {
            status: { in: ["PENDING", "IN_PROGRESS"] },
            scheduledDate: { gte: wsDate, lte: weDate },
          },
        }),
        db.goal.findMany({ where: { progress: { lt: 100 } } }),
        db.weeklyReview.findMany({
          orderBy: { weekStart: "desc" },
          take: 4,
        }),
      ]);

    const totalTasks = completedTasks.length + incompleteTasks.length;

    const weeklyReview = {
      weekStart: wsDate,
      weekEnd: weDate,
      rating,
      completedTasks: completedTasks.length,
      totalTasks,
      studyMinutes: studyMinutes || 0,
      userNotes,
    };

    const systemPrompt = buildReviewPrompt({
      completedTasks,
      incompleteTasks,
      weeklyReview,
      activeGoals,
      previousReviews,
    });

    const aiResponse = await generateJsonCompletion<AiReviewResponse>(
      systemPrompt,
      `Review my week (${wsDate.toISOString().split("T")[0]} to ${weDate.toISOString().split("T")[0]}).`
    );

    // Save the review
    const review = await db.weeklyReview.create({
      data: {
        weekStart: wsDate,
        weekEnd: weDate,
        rating,
        completedTasks: completedTasks.length,
        totalTasks,
        studyMinutes: studyMinutes || 0,
        userNotes,
        aiAnalysis: aiResponse.analysis,
        aiRecommendations: aiResponse.recommendations,
      },
    });

    // Save AI context
    await db.aiContext.create({
      data: {
        type: "review",
        prompt: systemPrompt.substring(0, 5000),
        response: JSON.stringify(aiResponse),
        metadata: { reviewId: review.id },
      },
    });

    return NextResponse.json({ review, aiResponse });
  } catch (error) {
    console.error("Error reviewing week:", error);
    return NextResponse.json(
      { error: "Failed to review week" },
      { status: 500 }
    );
  }
}
