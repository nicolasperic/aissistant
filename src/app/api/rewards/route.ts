import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BADGES, checkAndAwardBadges } from "@/lib/rewards";

export async function GET() {
  const [rewards, stats] = await Promise.all([
    db.reward.findMany({ orderBy: { earnedAt: "desc" } }),
    db.userStats.findUnique({ where: { id: "singleton" } }),
  ]);

  await checkAndAwardBadges();

  const updatedRewards = await db.reward.findMany({ orderBy: { earnedAt: "desc" } });

  return NextResponse.json({
    rewards: updatedRewards,
    stats: stats || {
      id: "singleton",
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    },
    badgeDefinitions: BADGES,
  });
}
