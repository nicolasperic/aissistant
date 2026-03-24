import type { Goal, Task, Event, WeeklyReview, Reward, UserStats, ProgressSnapshot } from "@prisma/client";

export type GoalWithRelations = Goal & {
  children?: GoalWithRelations[];
  parent?: Goal | null;
  tasks?: Task[];
};

export type TaskWithGoal = Task & {
  goal?: Goal | null;
  studyNote?: { id: string } | null;
};

export type WeeklyGoalDraft = {
  weekKey: string;       // temporary key e.g. "week1", "week2"
  title: string;         // e.g. "Week 1 — Architecture & Theming"
  description?: string;
  startDate: string;     // ISO date (Monday of that week)
  endDate: string;       // ISO date (Sunday of that week)
  parentGoalId?: string; // optional reference to a focus goal ID
};

export type WeeklyPlanTask = {
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scheduledDate: string;
  estimatedMinutes?: number;
  weekKey?: string;  // references WeeklyGoalDraft.weekKey
  goalId?: string;   // fallback direct goal ID
};

export type AiWeeklyPlan = {
  weeklyGoals: WeeklyGoalDraft[];
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
