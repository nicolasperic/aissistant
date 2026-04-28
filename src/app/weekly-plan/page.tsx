"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { DraftReviewModal } from "@/components/tasks/draft-review-modal";
import {
  Sparkles, Loader2, ChevronDown, CalendarRange, Calendar,
  Check, ClipboardList, Plus, Clock, Pencil, MoreHorizontal,
  ChevronRight, FileText, Play, ArrowUpRight,
} from "lucide-react";
import {
  startOfWeek, endOfWeek, addWeeks, format, addDays,
  isSameDay, isSameWeek, isAfter, isBefore,
} from "date-fns";
import { Tickbox, PriorityPill, SegmentedControl, ProgressBar } from "@/components/v2/primitives";
import type { TaskWithGoal } from "@/lib/types";
import type { Goal } from "@prisma/client";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSettings } from "@/components/layout/settings-context";

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
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [viewScope, setViewScope] = useLocalStorage<ViewScope>("plan-view-scope", "week");
  const [draftTasks, setDraftTasks] = useState<TaskWithGoal[]>([]);
  const [showDraftReview, setShowDraftReview] = useState(false);
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

  const loadTasks = useCallback(async () => {
    const [tasksRes, goalsRes, draftsRes] = await Promise.all([
      fetch(`/api/tasks?from=${weekStart.toISOString()}&to=${monthEnd.toISOString()}`),
      fetch("/api/goals"),
      fetch("/api/tasks?status=DRAFT"),
    ]);
    const allTasks: TaskWithGoal[] = await tasksRes.json();
    setTasks(allTasks.filter((t) => t.status !== "DRAFT"));
    setGoals(await goalsRes.json());
    setDraftTasks(await draftsRes.json());
    setLoading(false);
  }, [weekStart, monthEnd]);

  useEffect(() => { setLoading(true); loadTasks(); }, [loadTasks]);

  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (!loading && !initialScrollDone.current) {
      initialScrollDone.current = true;
      document.getElementById("plan-today")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          planStart: planStartDate ? new Date(planStartDate).toISOString() : weekStart.toISOString(),
          planEnd: planEndDate ? new Date(planEndDate).toISOString() : weekEnd.toISOString(),
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
      alert("Failed to generate plan. Make sure your ANTHROPIC_API_KEY is configured.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds(prev => {
      const next = new Set(prev);
      next.has(goalId) ? next.delete(goalId) : next.add(goalId);
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

  const handleDeleteConfirmed = async () => {
    if (!taskToDelete) return;
    await handleDelete(taskToDelete);
    setTaskToDelete(null);
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
        id: data.id, title: data.title,
        description: data.description || null,
        priority: data.priority,
        scheduledDate: data.scheduledDate || null,
        estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : null,
        goalId: data.goalId || null,
      }),
    });
    setEditingTask(null);
    loadTasks();
  };

  const activeGoals = useMemo(() => {
    const hidden = new Set(goals.filter(g => g.progress >= 100).map(g => g.id));
    let changed = true;
    while (changed) {
      changed = false;
      goals.forEach(g => {
        if (!hidden.has(g.id) && g.parentId && hidden.has(g.parentId)) {
          hidden.add(g.id);
          changed = true;
        }
      });
    }
    return goals.filter(g => !hidden.has(g.id));
  }, [goals]);

  const visibleTasks = useMemo(() => {
    if (viewScope === "week") {
      return tasks.filter(t => {
        if (!t.scheduledDate) return false;
        const d = new Date(t.scheduledDate);
        return (isAfter(d, weekStart) || isSameDay(d, weekStart)) && (isBefore(d, weekEnd) || isSameDay(d, weekEnd));
      });
    }
    return tasks;
  }, [tasks, viewScope, weekStart, weekEnd]);

  const totalDays = viewScope === "month" ? 28 : 7;
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(weekStart, i)), [totalDays, weekStart]);

  const completedCount = visibleTasks.filter(t => t.status === "COMPLETED").length;
  const totalHrs = useMemo(() => {
    const mins = visibleTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    return (mins / 60).toFixed(1);
  }, [visibleTasks]);

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading plan...</div>
      </div>
    );
  }

  return (
    <div className="page-v2 fade-up">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between" style={{
        paddingBottom: "var(--sp-6)", marginBottom: "var(--sp-6)",
        borderBottom: "1px solid var(--line)", gap: "var(--sp-4)",
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", margin: 0 }}>
            Weekly Plan
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-3)", fontSize: 13 }}>
            <span className="mono" style={{ color: "var(--ink-2)" }}>
              {format(weekStart, "MMM d")} – {format(viewScope === "month" ? monthEnd : weekEnd, "MMM d, yyyy")}
            </span>
            {" · "}
            <span className="mono">{completedCount}/{visibleTasks.length} done</span>
            {" · "}
            <span className="mono" style={{ color: "var(--ink-2)" }}>~{totalHrs} hrs planned</span>
          </p>
        </div>
        <div className="flex gap-2">
          <SegmentedControl
            value={viewScope}
            options={[
              { value: "week" as ViewScope, label: "This week" },
              { value: "month" as ViewScope, label: "4 weeks" },
            ]}
            onChange={setViewScope}
          />
          {draftTasks.length > 0 && (
            <button className="btn-v2 btn-v2-sm" onClick={() => setShowDraftReview(true)}>
              <ClipboardList size={13} strokeWidth={1.5} />
              Review {draftTasks.length} draft{draftTasks.length !== 1 ? "s" : ""}
            </button>
          )}
          <TaskForm goals={goals} onSubmit={handleCreateTask} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn-v2 btn-v2-sm btn-v2-accent" disabled={generating}>
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                {generating ? "Generating..." : "Re-plan"}
                <ChevronDown size={11} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRequestGenerate("weekly")}>
                <Calendar className="mr-2 h-4 w-4" /> Weekly Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRequestGenerate("monthly")}>
                <CalendarRange className="mr-2 h-4 w-4" /> Monthly Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI Plan Banner */}
      {planSummary && (
        <div className="card-v2 flex gap-3 items-center" style={{
          padding: "12px 16px", marginBottom: 18,
          borderColor: "var(--v2-accent)", background: "var(--accent-soft)",
        }}>
          <Sparkles size={16} strokeWidth={1.5} style={{ color: "var(--v2-accent)", flexShrink: 0 }} />
          <div className="flex-1" style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>AI plan generated · </span>
            <span style={{ color: "var(--ink-2)" }}>{planSummary}</span>
          </div>
          {focusAreas.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {focusAreas.map((a, i) => <span key={i} className="pill-v2">{a}</span>)}
            </div>
          )}
        </div>
      )}

      {/* DAY CARDS */}
      <div className="flex flex-col gap-2">
        {days.map(day => {
          const dayTasks = visibleTasks.filter(t =>
            t.scheduledDate && isSameDay(new Date(t.scheduledDate), day)
          );
          const isToday = isSameDay(day, new Date());
          const dayDone = dayTasks.filter(t => t.status === "COMPLETED").length;
          const dayTotal = dayTasks.length;
          const allDone = dayDone === dayTotal && dayTotal > 0;

          return (
            <div
              key={day.toISOString()}
              id={isToday ? "plan-today" : undefined}
              className="card-v2 scroll-mt-28"
              style={{
                padding: 0, overflow: "hidden",
                borderColor: isToday ? "var(--v2-accent)" : "var(--line)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                {/* Date rail */}
                <div style={{
                  padding: 16,
                  borderRight: "1px solid var(--line-soft)",
                  background: isToday ? "var(--accent-soft)" : "var(--bg)",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div className="mono" style={{
                    fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase",
                    color: isToday ? "var(--v2-accent)" : "var(--ink-3)",
                    fontWeight: isToday ? 600 : 400,
                  }}>
                    {format(day, "EEE")}{isToday ? " · TODAY" : ""}
                  </div>
                  <div className="mono" style={{
                    fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em",
                    color: allDone ? "var(--ink-3)" : "var(--ink)",
                    lineHeight: 1,
                  }}>
                    {format(day, "d")}
                  </div>
                  <div className="mt-auto flex items-center gap-1.5">
                    <ProgressBar
                      value={dayTotal ? (dayDone / dayTotal) * 100 : 0}
                      height={3}
                      color={allDone ? "var(--v2-success)" : isToday ? "var(--v2-accent)" : "var(--ink-3)"}
                    />
                    <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{dayDone}/{dayTotal}</span>
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ padding: "8px 6px" }}>
                  {dayTasks.length === 0 ? (
                    <div style={{ padding: "16px 14px", color: "var(--ink-4)", fontSize: 12 }}>No tasks</div>
                  ) : (
                    dayTasks.map(t => {
                      const isDone = t.status === "COMPLETED";
                      return (
                        <div key={t.id} style={{
                          display: "grid", gridTemplateColumns: "auto 1fr auto",
                          gap: 12, padding: "12px 14px", borderRadius: 10,
                        }}
                          className="hover:bg-[var(--hover)] transition-colors"
                        >
                          <Tickbox
                            done={isDone}
                            onClick={() => handleStatusChange(t.id, isDone ? "PENDING" : "COMPLETED")}
                          />
                          <div className="min-w-0">
                            <div style={{
                              fontSize: 14, fontWeight: 500,
                              textDecoration: isDone ? "line-through" : "none",
                              color: isDone ? "var(--ink-3)" : "var(--ink)",
                            }}>
                              {t.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1" style={{ color: "var(--ink-3)", fontSize: 12 }}>
                              {t.estimatedMinutes && (
                                <span className="mono inline-flex items-center gap-1">
                                  <Clock size={10} strokeWidth={1.5} /> {t.estimatedMinutes}m
                                </span>
                              )}
                              {t.estimatedMinutes && <span style={{ color: "var(--ink-4)" }}>·</span>}
                              <PriorityPill level={t.priority} />
                              {t.goal && (
                                <>
                                  <span style={{ color: "var(--ink-4)" }}>·</span>
                                  <span style={{ fontSize: 11.5 }}>{t.goal.title}</span>
                                </>
                              )}
                              {t.studyNote && (
                                <>
                                  <span style={{ color: "var(--ink-4)" }}>·</span>
                                  <span className="pill-v2" style={{ height: 18, fontSize: 10 }}>
                                    <FileText size={9} strokeWidth={1.5} /> note
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-0.5 items-center">
                            {isToday && !isDone && (
                              <button className="btn-v2 btn-v2-sm btn-v2-accent" style={{ marginRight: 4 }}>
                                <Play size={11} strokeWidth={1.5} /> Focus
                              </button>
                            )}
                            <button className="btn-v2-icon" onClick={() => setEditingTask(t)}>
                              <Pencil size={13} strokeWidth={1.5} />
                            </button>
                            <button className="btn-v2-icon" onClick={() => setTaskToDelete(t.id)}>
                              <MoreHorizontal size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal picker dialog */}
      <Dialog open={showGoalPicker} onOpenChange={setShowGoalPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Configure {pendingRangeType === "monthly" ? "Monthly" : "Weekly"} Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Planning period</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
                  <input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End date</label>
                  <input type="date" value={planEndDate} onChange={e => setPlanEndDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Select focus goals <span className="text-muted-foreground font-normal">(optional)</span>
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeGoals.map(goal => {
                  const isSelected = selectedGoalIds.has(goal.id);
                  return (
                    <button key={goal.id} onClick={() => toggleGoalSelection(goal.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{goal.type}</Badge>
                          <span className="text-xs text-muted-foreground">{Math.round(goal.progress)}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGoalPicker(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleGenerate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {pendingRangeType === "monthly" ? "Monthly" : "Weekly"} Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingTask && (
        <TaskEditForm
          task={editingTask} goals={goals} open={!!editingTask}
          onOpenChange={open => { if (!open) setEditingTask(null); }}
          onSubmit={handleEditTask}
        />
      )}

      {showDraftReview && draftTasks.length > 0 && (
        <DraftReviewModal tasks={draftTasks} goals={goals} onClose={() => setShowDraftReview(false)} onRefresh={loadTasks} />
      )}

      <AlertDialog open={!!taskToDelete} onOpenChange={open => { if (!open) setTaskToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the task.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
