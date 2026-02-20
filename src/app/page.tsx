"use client";

import { useCallback, useEffect, useState } from "react";
import { WeeklyOverview } from "@/components/dashboard/weekly-overview";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { EventsCountdown } from "@/components/dashboard/events-countdown";
import { StreakCard } from "@/components/dashboard/streak-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TaskList } from "@/components/tasks/task-list";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format, isWednesday, isThursday, isFriday } from "date-fns";
import { AlertCircle, Calendar, Sparkles } from "lucide-react";
import type { Goal, Event, UserStats } from "@prisma/client";
import type { TaskWithGoal } from "@/lib/types";

export default function Dashboard() {
  const [weeklyStats, setWeeklyStats] = useState({ completedTasks: 0, totalTasks: 0 });
  const [todayTasks, setTodayTasks] = useState<TaskWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayTasks = useCallback(async () => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const res = await fetch(`/api/tasks?from=${dayStart.toISOString()}&to=${dayEnd.toISOString()}`);
    const data = await res.json();
    setTodayTasks(data);
    return data as TaskWithGoal[];
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const ws = startOfWeek(now, { weekStartsOn: 1 });
        const we = endOfWeek(now, { weekStartsOn: 1 });

        const [tasksRes, goalsRes, eventsRes, rewardsRes, todayData] = await Promise.all([
          fetch(`/api/tasks?from=${ws.toISOString()}&to=${we.toISOString()}`),
          fetch("/api/goals"),
          fetch("/api/events"),
          fetch("/api/rewards"),
          fetchTodayTasks(),
        ]);

        const tasks = await tasksRes.json();
        const goalsData = await goalsRes.json();
        const eventsData = await eventsRes.json();
        const rewardsData = await rewardsRes.json();

        setWeeklyStats({
          completedTasks: tasks.filter((t: { status: string }) => t.status === "COMPLETED").length,
          totalTasks: tasks.length,
        });
        setGoals(goalsData);
        setEvents(eventsData);
        setStats(rewardsData.stats);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchTodayTasks]);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchTodayTasks();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    setTodayTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTask = async (data: { id: string; title: string; description: string; priority: string; scheduledDate: string; estimatedMinutes: string; goalId: string }) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        scheduledDate: data.scheduledDate || undefined,
        estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : undefined,
        goalId: data.goalId || undefined,
      }),
    });
    setEditingTask(null);
    await fetchTodayTasks();
  };

  const today = new Date();
  const showMidWeekCheckin = isWednesday(today) || isThursday(today);
  const showEndOfWeekReview = isFriday(today);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {showMidWeekCheckin && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <Sparkles className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="font-medium text-sm">Mid-week check-in</p>
              <p className="text-xs text-muted-foreground">How&apos;s your progress this week? Take a moment to review your tasks.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {showEndOfWeekReview && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-purple-500 shrink-0" />
            <div>
              <p className="font-medium text-sm">Time to review your week!</p>
              <p className="text-xs text-muted-foreground">Head over to the Review page to reflect on your progress and get AI feedback.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WeeklyOverview
          completedTasks={weeklyStats.completedTasks}
          totalTasks={weeklyStats.totalTasks}
        />
        <StreakCard
          currentStreak={stats?.currentStreak ?? 0}
          longestStreak={stats?.longestStreak ?? 0}
          totalPoints={stats?.totalPoints ?? 0}
        />
        <EventsCountdown events={events} />
        <QuickActions />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            {format(today, "EEEE, MMM d")} (Today)
          </CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">
            {todayTasks.filter((t) => t.status === "COMPLETED").length}/{todayTasks.length} done
          </span>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={todayTasks}
            onStatusChange={handleStatusChange}
            onEdit={setEditingTask}
            onDelete={handleDelete}
            emptyMessage="No tasks scheduled for today"
          />
        </CardContent>
      </Card>

      {editingTask && (
        <TaskEditForm
          task={editingTask}
          goals={goals}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null); }}
          onSubmit={handleEditTask}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <GoalProgressChart goals={goals.filter((g: Goal) => g.progress < 100)} />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No goals yet</p>
            ) : (
              <div className="space-y-3">
                {goals.filter((g: Goal) => g.progress < 100).slice(0, 5).map((goal: Goal) => (
                  <div key={goal.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {goal.type.charAt(0)}
                      </Badge>
                      <span className="text-sm truncate">{goal.title}</span>
                    </div>
                    <span className="text-sm font-medium ml-2">{Math.round(goal.progress)}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
