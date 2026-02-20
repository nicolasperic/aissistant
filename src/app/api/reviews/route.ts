import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { awardPoints, POINTS } from "@/lib/rewards";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10");

  const reviews = await db.weeklyReview.findMany({
    orderBy: { weekStart: "desc" },
    take: limit,
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const review = await db.weeklyReview.create({
    data: {
      weekStart: new Date(body.weekStart),
      weekEnd: new Date(body.weekEnd),
      rating: body.rating,
      completedTasks: body.completedTasks || 0,
      totalTasks: body.totalTasks || 0,
      studyMinutes: body.studyMinutes || 0,
      userNotes: body.userNotes,
      aiAnalysis: body.aiAnalysis,
      aiRecommendations: body.aiRecommendations,
    },
  });

  await awardPoints(POINTS.WEEKLY_REVIEW);

  if (body.studyMinutes) {
    const studyBonusPoints = Math.floor(body.studyMinutes / 30) * POINTS.STUDY_SESSION_PER_30MIN;
    if (studyBonusPoints > 0) {
      await awardPoints(studyBonusPoints);
    }
  }

  return NextResponse.json(review, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const review = await db.weeklyReview.update({
    where: { id: body.id },
    data: {
      rating: body.rating,
      completedTasks: body.completedTasks,
      totalTasks: body.totalTasks,
      studyMinutes: body.studyMinutes,
      userNotes: body.userNotes,
      aiAnalysis: body.aiAnalysis,
      aiRecommendations: body.aiRecommendations,
    },
  });

  return NextResponse.json(review);
}
