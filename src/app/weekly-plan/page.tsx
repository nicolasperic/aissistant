"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { DraftReviewModal } from "@/components/tasks/draft-review-modal";
import {
  Sparkles,
  Loader2,
  CalendarDays,
  ChevronDown,
  CalendarRange,
  Calendar,
  Check,
  ClipboardList,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  addDays,
  isSameDay,
  isSameWeek,
  isAfter,
  isBefore,
} from "date-fns";
import type { TaskWithGoal } from "@/lib/types";
import type { Goal } from "@prisma/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSettings } from "@/components/layout/settings-context";
import { TourButton } from "@/components/layout/tour-button";

type RangeType = "weekly" | "monthly";
type ViewScope = "week" | "month";

export default function PlanPage() {
  const { settings: { weekStartsOn } } = useSettings();
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [generating, setGenerating] = useState(false);
  const [planSummary, setPlanSummary] = useState<string | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<TaskWithGoal | null>(null);
  const [loading, setLoading] = useState(true);

  // View scope (independent of plan generation) — persisted
  const [viewScope, setViewScope] = useLocalStorage<ViewScope>("plan-view-scope", "week");

  // Draft tasks
  const [draftTasks, setDraftTasks] = useState<TaskWithGoal[]>([]);
  const [showDraftReview, setShowDraftReview] = useState(false);

  // Plan generation configuration
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());
  const [pendingRangeType, setPendingRangeType] = useState<RangeType>("weekly");
  const [planStartDate, setPlanStartDate] = useState<string>("");
  const [planEndDate, setPlanEndDate] = useState<string>("");

  const { weekStart, weekEnd, monthEnd } = useMemo(() => {
    const ws = startOfWeek(new Date(), { weekStartsOn });
    return {
      weekStart: ws,
      weekEnd: endOfWeek(new Date(), { weekStartsOn }),
      monthEnd: endOfWeek(addWeeks(ws, 3), { weekStartsOn }),
    };
  }, [weekStartsOn]);

  // Always fetch the full 4-week range so scope toggle is instant
  const loadTasks = useCallback(async () => {
    const [tasksRes, goalsRes, draftsRes] = await Promise.all([
      fetch(
        `/api/tasks?from=${weekStart.toISOString()}&to=${monthEnd.toISOString()}`
      ),
      fetch("/api/goals"),
      fetch("/api/tasks?status=DRAFT"),
    ]);
    const allTasks: TaskWithGoal[] = await tasksRes.json();
    setTasks(allTasks.filter((t) => t.status !== "DRAFT"));
    setGoals(await goalsRes.json());
    setDraftTasks(await draftsRes.json());
    setLoading(false);
  }, [weekStart, monthEnd]);

  useEffect(() => {
    setLoading(true);
    loadTasks();
  }, [loadTasks]);

  // Scroll to today's card once after initial load
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!loading && !initialScrollDone.current) {
      initialScrollDone.current = true;
      const el = document.getElementById("plan-today");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const handleRequestGenerate = (type: RangeType) => {
    setPendingRangeType(type);
    setPlanStartDate(format(weekStart, "yyyy-MM-dd"));
    setPlanEndDate(format(type === "monthly" ? monthEnd : weekEnd, "yyyy-MM-dd"));
    setShowGoalPicker(true);
  };

  const handleGenerate = async () => {
    setShowGoalPicker(false);
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planStart: planStartDate
            ? new Date(planStartDate).toISOString()
            : weekStart.toISOString(),
          planEnd: planEndDate
            ? new Date(planEndDate).toISOString()
            : weekEnd.toISOString(),
          goalIds: Array.from(selectedGoalIds),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate plan");

      const data = await res.json();
      setPlanSummary(data.plan.summary);
      setFocusAreas(data.plan.focusAreas || []);
      await loadTasks();
      setShowDraftReview(true);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert(
        "Failed to generate plan. Make sure your ANTHROPIC_API_KEY is configured."
      );
    } finally {
      setGenerating(false);
    }
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    loadTasks();
  };

  const handleCreateTask = async (data: Record<string, string>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadTasks();
  };

  const handleEditTask = async (data: Record<string, string>) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        scheduledDate: data.scheduledDate || null,
        estimatedMinutes: data.estimatedMinutes
          ? parseInt(data.estimatedMinutes)
          : null,
        goalId: data.goalId || null,
      }),
    });
    setEditingTask(null);
    loadTasks();
  };

  // Goals with progress >= 100, plus any children of those (regardless of child progress)
  const activeGoals = useMemo(() => {
    const hidden = new Set(goals.filter((g) => g.progress >= 100).map((g) => g.id));
    let changed = true;
    while (changed) {
      changed = false;
      goals.forEach((g) => {
        if (!hidden.has(g.id) && g.parentId && hidden.has(g.parentId)) {
          hidden.add(g.id);
          changed = true;
        }
      });
    }
    return goals.filter((g) => !hidden.has(g.id));
  }, [goals]);

  // Filter tasks based on current view scope
  const visibleTasks = useMemo(() => {
    if (viewScope === "week") {
      return tasks.filter((t) => {
        if (!t.scheduledDate) return false;
        const d = new Date(t.scheduledDate);
        return (
          (isAfter(d, weekStart) || isSameDay(d, weekStart)) &&
          (isBefore(d, weekEnd) || isSameDay(d, weekEnd))
        );
      });
    }
    return tasks;
  }, [tasks, viewScope, weekStart, weekEnd]);

  // Compute days for the active range
  const totalDays = viewScope === "month" ? 28 : 7;
  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => addDays(weekStart, i)),
    [viewScope, totalDays, weekStart]
  );

  // Group days by week for monthly view
  const weeks = useMemo(() => {
    if (viewScope !== "month") return null;
    const result: { weekStart: Date; weekEnd: Date; days: Date[] }[] = [];
    for (let w = 0; w < 4; w++) {
      const ws = addWeeks(weekStart, w);
      const we = endOfWeek(ws, { weekStartsOn });
      const weekDays = days.filter((d) =>
        isSameWeek(d, ws, { weekStartsOn })
      );
      result.push({ weekStart: ws, weekEnd: we, days: weekDays });
    }
    return result;
  }, [viewScope, days, weekStart, weekStartsOn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading plan...</div>
      </div>
    );
  }

  const rangeLabel =
    viewScope === "month"
      ? `${format(weekStart, "MMM d")} - ${format(monthEnd, "MMM d, yyyy")}`
      : `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  const completedCount = visibleTasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="sticky -top-6 z-10 -mx-6 px-6 pt-6 pb-4 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Plan</h1>
            {/* View scope toggle */}
            <div id="tour-plan-view-scope" className="inline-flex items-center rounded-lg border bg-muted p-0.5">
              <button
                onClick={() => setViewScope("week")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewScope === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                This Week
              </button>
              <button
                onClick={() => setViewScope("month")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewScope === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                4 Weeks
              </button>
            </div>
          </div>
          <p className="text-muted-foreground">
            {rangeLabel}
            <span className="ml-2 text-xs">
              ({completedCount}/{visibleTasks.length} tasks done)
            </span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <TourButton tourId="weekly-plan" autoStart={tasks.length === 0} />
          {draftTasks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDraftReview(true)}
              className="border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Review {draftTasks.length} draft{draftTasks.length !== 1 ? "s" : ""}
            </Button>
          )}
          <div id="tour-add-task"><TaskForm goals={goals} onSubmit={handleCreateTask} /></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button id="tour-generate-plan" size="sm" disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {generating ? "Generating..." : "Generate Plan"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRequestGenerate("weekly")}>
                <Calendar className="mr-2 h-4 w-4" />
                Weekly Plan
                <span className="ml-auto text-xs text-muted-foreground">
                  This week
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRequestGenerate("monthly")}>
                <CalendarRange className="mr-2 h-4 w-4" />
                Monthly Plan
                <span className="ml-auto text-xs text-muted-foreground">
                  4 weeks
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>

      {/* Goal picker dialog */}
      <Dialog open={showGoalPicker} onOpenChange={setShowGoalPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Configure {pendingRangeType === "monthly" ? "Monthly" : "Weekly"}{" "}
              Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Planning period</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End date</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Select focus goals{" "}
                <span className="text-muted-foreground font-normal">
                  (optional — leave empty to balance across all)
                </span>
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeGoals.map((goal) => {
                  const isSelected = selectedGoalIds.has(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoalSelection(goal.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {goal.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {goal.type}
                          </Badge>
                          {goal.category && (
                            <span className="text-xs text-muted-foreground">
                              {goal.category}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {Math.round(goal.progress)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {activeGoals.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {goals.length === 0 ? "No goals yet." : "All goals are completed."} The AI will create a general plan.
                  </p>
                )}
              </div>
            </div>
            {selectedGoalIds.size > 0 && (
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedGoalIds).map((id) => {
                  const g = goals.find((g) => g.id === id);
                  return g ? (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {g.title}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGoalPicker(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate{" "}
                {pendingRangeType === "monthly" ? "Monthly" : "Weekly"} Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {planSummary && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-2">AI Plan Summary</p>
                <p className="text-sm text-muted-foreground">{planSummary}</p>
                {focusAreas.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {focusAreas.map((area, i) => (
                      <Badge key={i} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly view: group by week */}
      {viewScope === "month" && weeks ? (
        <div className="space-y-6">
          {weeks.map((week, weekIdx) => {
            const weekTasks = visibleTasks.filter(
              (t) =>
                t.scheduledDate &&
                isSameWeek(new Date(t.scheduledDate), week.weekStart, {
                  weekStartsOn,
                })
            );
            const weekCompleted = weekTasks.filter(
              (t) => t.status === "COMPLETED"
            ).length;
            const isCurrentWeek = isSameWeek(new Date(), week.weekStart, {
              weekStartsOn,
            });

            return (
              <div
                key={weekIdx}
                className={`rounded-xl border p-4 ${
                  isCurrentWeek
                    ? "border-primary/40 bg-primary/[0.02]"
                    : "border-border"
                }`}
              >
                {/* Week header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Week {weekIdx + 1}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {format(week.weekStart, "MMM d")} –{" "}
                      {format(week.weekEnd, "MMM d")}
                    </span>
                    {isCurrentWeek && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {weekCompleted}/{weekTasks.length} tasks
                  </span>
                </div>
                {/* Days within the week */}
                <div className="space-y-2">
                  {week.days.map((day) => {
                    const dayTasks = visibleTasks.filter(
                      (t) =>
                        t.scheduledDate &&
                        isSameDay(new Date(t.scheduledDate), day)
                    );
                    const isToday = isSameDay(day, new Date());

                    return (
                      <Card
                        key={day.toISOString()}
                        id={isToday ? "plan-today" : undefined}
                        className={`scroll-mt-28 ${isToday ? "border-primary/50 shadow-sm" : ""}`}
                      >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">
                              {format(day, "EEE, MMM d")}
                            </CardTitle>
                            {isToday && (
                              <Badge variant="default" className="text-xs">
                                Today
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {
                              dayTasks.filter(
                                (t) => t.status === "COMPLETED"
                              ).length
                            }
                            /{dayTasks.length} done
                          </span>
                        </CardHeader>
                        {dayTasks.length > 0 && (
                          <CardContent>
                            <TaskList
                              tasks={dayTasks}
                              onStatusChange={handleStatusChange}
                              onEdit={setEditingTask}
                              onDelete={handleDelete}
                            />
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly view: flat list */
        <div className="space-y-4">
          {days.map((day) => {
            const dayTasks = visibleTasks.filter(
              (t) =>
                t.scheduledDate &&
                isSameDay(new Date(t.scheduledDate), day)
            );
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                id={isToday ? "plan-today" : undefined}
                className={`scroll-mt-28 ${isToday ? "border-primary/50 shadow-sm" : ""}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {format(day, "EEEE, MMM d")}
                    </CardTitle>
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {
                      dayTasks.filter((t) => t.status === "COMPLETED")
                        .length
                    }
                    /{dayTasks.length} done
                  </span>
                </CardHeader>
                <CardContent>
                  {dayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No tasks scheduled
                    </p>
                  ) : (
                    <TaskList
                      tasks={dayTasks}
                      onStatusChange={handleStatusChange}
                      onEdit={setEditingTask}
                      onDelete={handleDelete}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingTask && (
        <TaskEditForm
          task={editingTask}
          goals={goals}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onSubmit={handleEditTask}
        />
      )}

      {showDraftReview && draftTasks.length > 0 && (
        <DraftReviewModal
          tasks={draftTasks}
          goals={goals}
          onClose={() => setShowDraftReview(false)}
          onRefresh={loadTasks}
        />
      )}
    </div>
  );
}
