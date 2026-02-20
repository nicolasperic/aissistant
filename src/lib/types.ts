import type { Goal, Task, Event, WeeklyReview, Reward, UserStats, ProgressSnapshot } from "@prisma/client";

export type GoalWithRelations = Goal & {
  children?: GoalWithRelations[];
  parent?: Goal | null;
  tasks?: Task[];
};

export type TaskWithGoal = Task & {
  goal?: Goal | null;
};

export type WeeklyPlanTask = {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scheduledDate: string;
  estimatedMinutes?: number;
  goalId?: string;
};

export type AiWeeklyPlan = {
  tasks: WeeklyPlanTask[];
  summary: string;
  focusAreas: string[];
};

export type AiReviewResponse = {
  analysis: string;
  recommendations: string;
  highlights: string[];
  areasForImprovement: string[];
};

export type AiSuggestion = {
  type: "info" | "warning" | "action";
  title: string;
  message: string;
  actionLabel?: string;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
};

export type DashboardData = {
  weeklyStats: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
  };
  activeGoals: Goal[];
  upcomingEvents: Event[];
  userStats: UserStats | null;
  recentRewards: Reward[];
  progressSnapshots: ProgressSnapshot[];
};

export { Goal, Task, Event, WeeklyReview, Reward, UserStats, ProgressSnapshot };
