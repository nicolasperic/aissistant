import { db } from "./db";
import type { BadgeDefinition } from "./types";

// Points configuration
export const POINTS = {
  COMPLETE_TASK: 10,
  COMPLETE_ALL_DAILY: 25,
  COMPLETE_WEEKLY_GOAL: 50,
  COMPLETE_MONTHLY_GOAL: 200,
  WEEKLY_REVIEW: 15,
  STUDY_SESSION_PER_30MIN: 5,
} as const;

// Badge definitions
export const BADGES: BadgeDefinition[] = [
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first task",
    icon: "🎯",
    condition: "completedTasks >= 1",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Complete all tasks in a week",
    icon: "⚔️",
    condition: "weeklyCompletion === 100",
  },
  {
    id: "streak_7",
    name: "7-Day Streak",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    condition: "currentStreak >= 7",
  },
  {
    id: "streak_30",
    name: "30-Day Streak",
    description: "Maintain a 30-day streak",
    icon: "💪",
    condition: "currentStreak >= 30",
  },
  {
    id: "streak_100",
    name: "100-Day Streak",
    description: "Maintain a 100-day streak",
    icon: "🏆",
    condition: "currentStreak >= 100",
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Complete a quarterly goal",
    icon: "💎",
    condition: "completedQuarterlyGoal",
  },
  {
    id: "cert_ready",
    name: "Cert Ready",
    description: "Complete all study tasks for a certification",
    icon: "📜",
    condition: "certificationComplete",
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Get a 5/5 weekly rating",
    icon: "⭐",
    condition: "weeklyRating === 5",
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Complete 100 tasks",
    icon: "🏅",
    condition: "completedTasks >= 100",
  },
  {
    id: "study_master",
    name: "Study Master",
    description: "Log 1000 minutes of study time",
    icon: "📚",
    condition: "totalStudyMinutes >= 1000",
  },
];

export async function awardPoints(points: number): Promise<number> {
  const stats = await db.userStats.upsert({
    where: { id: "singleton" },
    update: { totalPoints: { increment: points } },
    create: { id: "singleton", totalPoints: points },
  });
  return stats.totalPoints;
}

export async function updateStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await db.userStats.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const lastActive = stats.lastActiveDate;
  let newStreak = stats.currentStreak;

  if (lastActive) {
    const lastDate = new Date(lastActive);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { currentStreak: stats.currentStreak, longestStreak: stats.longestStreak };
    } else if (diffDays === 1) {
      newStreak = stats.currentStreak + 1;
    } else {
      // Check if any of the gap days had scheduled tasks.
      // If all gap days were task-less, the streak shouldn't break.
      const gapStart = new Date(lastDate);
      gapStart.setDate(gapStart.getDate() + 1);
      const gapEnd = new Date(today);
      gapEnd.setDate(gapEnd.getDate() - 1);
      gapEnd.setHours(23, 59, 59, 999);

      const tasksInGap = await db.task.count({
        where: {
          scheduledDate: { gte: gapStart, lte: gapEnd },
        },
      });

      newStreak = tasksInGap === 0 ? stats.currentStreak + 1 : 1;
    }
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, stats.longestStreak);

  const updated = await db.userStats.update({
    where: { id: "singleton" },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
    },
  });

  return { currentStreak: updated.currentStreak, longestStreak: updated.longestStreak };
}

export async function checkAndAwardBadges(): Promise<string[]> {
  const earnedBadges = await db.reward.findMany({ where: { type: "badge" } });
  const earnedIds = new Set(earnedBadges.map((b) => b.name));
  const newBadges: string[] = [];

  const stats = await db.userStats.findUnique({ where: { id: "singleton" } });
  const completedTaskCount = await db.task.count({ where: { status: "COMPLETED" } });
  const totalStudyMinutes = await db.weeklyReview.aggregate({ _sum: { studyMinutes: true } });

  for (const badge of BADGES) {
    if (earnedIds.has(badge.name)) continue;

    let earned = false;

    switch (badge.id) {
      case "first_step":
        earned = completedTaskCount >= 1;
        break;
      case "streak_7":
        earned = (stats?.currentStreak ?? 0) >= 7;
        break;
      case "streak_30":
        earned = (stats?.currentStreak ?? 0) >= 30;
        break;
      case "streak_100":
        earned = (stats?.currentStreak ?? 0) >= 100;
        break;
      case "centurion":
        earned = completedTaskCount >= 100;
        break;
      case "study_master":
        earned = (totalStudyMinutes._sum.studyMinutes ?? 0) >= 1000;
        break;
      case "perfect_week": {
        const perfectWeek = await db.weeklyReview.findFirst({ where: { rating: 5 } });
        earned = !!perfectWeek;
        break;
      }
      case "goal_crusher": {
        const completedQuarterly = await db.goal.findFirst({
          where: { type: "QUARTERLY", progress: { gte: 100 } },
        });
        earned = !!completedQuarterly;
        break;
      }
      case "week_warrior": {
        const review = await db.weeklyReview.findFirst({
          where: {
            completedTasks: { gt: 0 },
            totalTasks: { gt: 0 },
          },
          orderBy: { createdAt: "desc" },
        });
        earned = !!review && review.completedTasks === review.totalTasks;
        break;
      }
      default:
        break;
    }

    if (earned) {
      await db.reward.create({
        data: {
          type: "badge",
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          metadata: { badgeId: badge.id },
        },
      });
      newBadges.push(badge.name);
    }
  }

  return newBadges;
}

export async function onTaskCompleted(): Promise<{
  points: number;
  streak: { currentStreak: number; longestStreak: number };
  newBadges: string[];
}> {
  const points = await awardPoints(POINTS.COMPLETE_TASK);
  const streak = await updateStreak();
  const newBadges = await checkAndAwardBadges();
  return { points, streak, newBadges };
}
