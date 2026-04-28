"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, format, differenceInDays, addDays, getWeek, addMonths, addWeeks } from "date-fns";
import {
  ClipboardCheck, Sparkles, Play, MoreHorizontal,
  FileText, ArrowUpRight, Plus,
} from "lucide-react";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { Tickbox, PriorityPill, LevelTag, Ring, Sparkline, StatBlock, ProgressBar } from "@/components/v2/primitives";
import { useSettings } from "@/components/layout/settings-context";
import type { Goal, Event, UserStats } from "@prisma/client";
import type { TaskWithGoal } from "@/lib/types";

export default function Dashboard() {
  const { settings: { weekStartsOn, quarterlyMonthsBefore, quarterlyMonthsAfter, weeklyWeeksBefore, weeklyWeeksAfter } } = useSettings();
  const today = new Date();
  const [weekTasks, setWeekTasks] = useState<TaskWithGoal[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const { ws, we } = useMemo(() => ({
    ws: startOfWeek(today, { weekStartsOn }),
    we: endOfWeek(today, { weekStartsOn }),
  }), [weekStartsOn]);

  const fetchTodayTasks = useCallback(async () => {
    const now = new Date();
    const res = await fetch(`/api/tasks?from=${startOfDay(now).toISOString()}&to=${endOfDay(now).toISOString()}`);
    const data = await res.json();
    setTodayTasks(data);
    return data as TaskWithGoal[];
  }, []);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, , eventsRes, rewardsRes] = await Promise.all([
          fetch(`/api/tasks?from=${ws.toISOString()}&to=${we.toISOString()}`),
          fetchGoals(),
          fetch("/api/events"),
          fetch("/api/rewards"),
          fetchTodayTasks(),
        ]);
        const tasks = await tasksRes.json();
        setWeekTasks(tasks);
        setEvents(await eventsRes.json());
        const rewardsData = await rewardsRes.json();
        setStats(rewardsData.stats);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchTodayTasks, fetchGoals, ws, we]);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await Promise.all([fetchTodayTasks(), fetchGoals()]);
    // Refresh week tasks
    const res = await fetch(`/api/tasks?from=${ws.toISOString()}&to=${we.toISOString()}`);
    setWeekTasks(await res.json());
  };

  const handleEditTask = async (data: { id: string; title: string; description: string; priority: string; scheduledDate: string; estimatedMinutes: string; goalId: string }) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id, title: data.title,
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

  // Build week day structure
  const weekDays = useMemo(() => {
    const days: { date: Date; short: string; isToday: boolean; tasks: TaskWithGoal[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      const dayStr = format(d, "yyyy-MM-dd");
      const isToday = dayStr === format(today, "yyyy-MM-dd");
      days.push({
        date: d,
        short: format(d, "EEE d").toUpperCase(),
        isToday,
        tasks: weekTasks.filter(t => {
          const sd = t.scheduledDate ? format(new Date(t.scheduledDate), "yyyy-MM-dd") : null;
          return sd === dayStr;
        }),
      });
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekTasks, ws]);

  const weekCompleted = weekTasks.filter(t => t.status === "COMPLETED").length;
  const weekTotal = weekTasks.length;
  const weekPct = weekTotal ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  const activeGoals = useMemo(() =>
    goals.filter(g => g.progress < 100).slice(0, 5),
  [goals]);

  // Upcoming events sorted by date
  const upcomingEvents = useMemo(() =>
    events
      .filter(e => new Date(e.eventDate) > today)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 3),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [events]);

  // Next significant event for greeting
  const nextEvent = upcomingEvents[0];
  const daysUntilNext = nextEvent ? differenceInDays(new Date(nextEvent.eventDate), today) : null;

  const todayCompleted = todayTasks.filter(t => t.status === "COMPLETED").length;
  const currentStreak = stats?.currentStreak ?? 0;
  const weekNum = getWeek(today, { weekStartsOn });

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading dashboard...</div>
      </div>
    );
  }

  const greetingHour = today.getHours();
  const greeting = greetingHour < 12 ? "good morning," : greetingHour < 17 ? "good afternoon," : "good evening,";

  return (
    <div className="page-v2 fade-up">
      {/* HERO */}
      <div className="flex items-start justify-between" style={{ marginBottom: 32 }}>
        <div>
          <div className="eyebrow">{format(today, "EEE, MMM d")} · day {currentStreak}</div>
          <h1 style={{
            fontSize: 36, lineHeight: 1.1, fontWeight: 400,
            letterSpacing: "-0.025em", margin: "8px 0 0", maxWidth: 640,
          }}>
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--ink-2)" }}>{greeting}</span>{" "}
            <span style={{ fontWeight: 500 }}>nico.</span>{" "}
            {daysUntilNext !== null && (
              <span style={{ color: "var(--ink-3)" }}>
                {daysUntilNext} days until {nextEvent!.title.toLowerCase()}.
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="/review" className="btn-v2 btn-v2-sm">
            <ClipboardCheck size={13} strokeWidth={1.5} /> Weekly review
          </a>
          <a href="/weekly-plan" className="btn-v2 btn-v2-sm btn-v2-accent">
            <Sparkles size={13} strokeWidth={1.5} /> Generate plan
          </a>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* NOW PLAYING */}
          <div className="card-v2" style={{ padding: 20, overflow: "hidden" }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span className="eyebrow">Now playing</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>· today</span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {todayCompleted}/{todayTasks.length} done
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center" style={{ padding: "24px 0", color: "var(--ink-3)", fontSize: 13 }}>
                No tasks scheduled for today
              </div>
            ) : (
              todayTasks.map((t, i) => {
                const isDone = t.status === "COMPLETED";
                return (
                  <div key={t.id} className="flex gap-3.5 items-start" style={{
                    padding: "14px 0",
                    borderTop: i === 0 ? undefined : "1px solid var(--line-soft)",
                  }}>
                    <Tickbox
                      done={isDone}
                      onClick={() => handleStatusChange(t.id, isDone ? "PENDING" : "COMPLETED")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                        <PriorityPill level={t.priority} />
                        {t.estimatedMinutes && (
                          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.estimatedMinutes}m est</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em",
                        textDecoration: isDone ? "line-through" : "none",
                        color: isDone ? "var(--ink-3)" : "var(--ink)",
                      }}>
                        {t.title}
                      </div>
                      <div className="flex gap-1.5 mt-2 items-center flex-wrap">
                        {t.studyNote && (
                          <span className="pill-v2"><FileText size={10} /> Study note</span>
                        )}
                        {t.goal && (
                          <span className="pill-v2" style={{ color: "var(--ink-3)" }}>{t.goal.title}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      {!isDone && (
                        <button className="btn-v2 btn-v2-sm btn-v2-accent">
                          <Play size={11} strokeWidth={1.5} /> Focus
                        </button>
                      )}
                      <button className="btn-v2-icon" onClick={() => setEditingTask(t)}>
                        <MoreHorizontal size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* WEEK STRIP */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="flex justify-between items-baseline" style={{ marginBottom: 14 }}>
              <div>
                <span className="eyebrow">Week {weekNum}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 8 }}>
                  {format(ws, "MMM d")}–{format(we, "d")}
                </span>
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {weekCompleted}/{weekTotal} tasks · {weekPct}%
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {weekDays.map((d, i) => {
                const done = d.tasks.filter(t => t.status === "COMPLETED").length;
                const total = d.tasks.length;
                const pct = total ? done / total : 0;
                return (
                  <div key={i} style={{
                    border: d.isToday ? "1px solid var(--v2-accent)" : "1px solid var(--line-soft)",
                    background: d.isToday ? "var(--accent-soft)" : "var(--bg)",
                    borderRadius: 8, padding: "10px 8px",
                    display: "flex", flexDirection: "column", gap: 6,
                    minHeight: 100,
                  }}>
                    <div className="mono" style={{
                      fontSize: 10, letterSpacing: ".05em",
                      color: d.isToday ? "var(--v2-accent)" : "var(--ink-3)",
                      fontWeight: d.isToday ? 600 : 400,
                    }}>
                      {d.short}{d.isToday ? " · NOW" : ""}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 500, lineHeight: 1.3,
                      color: pct === 1 ? "var(--ink-3)" : "var(--ink)",
                      textDecoration: pct === 1 ? "line-through" : "none",
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                      overflow: "hidden", flex: 1,
                    }}>
                      {d.tasks[0]?.title || "—"}
                    </div>
                    <div className="flex gap-0.5 items-center">
                      {total > 0 ? Array.from({ length: total }).map((_, idx) => (
                        <div key={idx} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: idx < done
                            ? (d.isToday ? "var(--v2-accent)" : "var(--ink-3)")
                            : "var(--line)",
                        }} />
                      )) : (
                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--line)" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE GOALS */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2.5">
                <span className="eyebrow">Active goals</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{activeGoals.length}</span>
              </div>
              <a href="/goals" className="btn-v2 btn-v2-sm btn-v2-ghost">
                View all <ArrowUpRight size={11} strokeWidth={1.5} />
              </a>
            </div>
            <div className="flex flex-col">
              {activeGoals.length === 0 ? (
                <div className="text-center" style={{ padding: "20px 0", color: "var(--ink-3)", fontSize: 13 }}>No active goals</div>
              ) : (
                activeGoals.map((g, i) => (
                  <div key={g.id} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr 90px 50px",
                    alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? undefined : "1px solid var(--line-soft)",
                  }}>
                    <LevelTag level={g.type} />
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{g.title}</div>
                    <ProgressBar value={g.progress} />
                    <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)", textAlign: "right" }}>
                      {Math.round(g.progress)}<span style={{ color: "var(--ink-4)" }}>%</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* STATS */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>This week</div>
            <div className="flex items-center gap-4">
              <Ring value={weekPct} size={84} stroke={6} sub="complete" />
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
                <StatBlock label="streak" value={currentStreak} suffix="d" trend={currentStreak > 0 ? "+1" : undefined} />
                <StatBlock label="points" value={stats?.totalPoints ?? 0} />
                <StatBlock label="tasks" value={`${weekCompleted}/${weekTotal}`} />
                <StatBlock label="best" value={stats?.longestStreak ?? 0} suffix="d" />
              </div>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div className="eyebrow">Activity · {today.getFullYear()}</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <HeatmapPlaceholder />
            </div>
            <div className="flex justify-between items-center" style={{ marginTop: 10 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>less</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(l => (
                  <i key={l} style={{
                    display: "block", width: 8, height: 8, borderRadius: 2,
                    background: l === 0 ? "var(--check-bg)" : `oklch(from var(--v2-accent) l c h / ${l === 4 ? 1 : l * 0.25})`,
                  }} />
                ))}
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>more</span>
            </div>
          </div>

          {/* UPCOMING */}
          <div className="card-v2" style={{ padding: 20 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div className="eyebrow">Upcoming</div>
              <a href="/events" className="btn-v2-icon"><Plus size={13} strokeWidth={1.5} /></a>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center" style={{ padding: "20px 0", color: "var(--ink-3)", fontSize: 13 }}>No upcoming events</div>
            ) : (
              upcomingEvents.map((u, i) => {
                const days = differenceInDays(new Date(u.eventDate), today);
                return (
                  <div key={u.id} style={{
                    display: "grid", gridTemplateColumns: "auto 1fr",
                    alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? undefined : "1px solid var(--line-soft)",
                  }}>
                    <div style={{
                      width: 36, textAlign: "center", padding: "4px 0", borderRadius: 6,
                      background: days < 7 ? "var(--accent-soft)" : "var(--bg-elev-2)",
                      color: days < 7 ? "var(--v2-accent)" : "var(--ink-2)",
                    }}>
                      <div className="mono" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{days}</div>
                      <div className="mono" style={{ fontSize: 8, lineHeight: 1, marginTop: 2, letterSpacing: ".05em" }}>DAYS</div>
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.title}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{format(new Date(u.eventDate), "MMM d, yyyy")}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {editingTask && (
        <TaskEditForm
          task={editingTask}
          goals={goals}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null); }}
          onSubmit={handleEditTask}
        />
      )}
    </div>
  );
}

/** Placeholder heatmap with random data — will be replaced with real activity data */
/** Simple seeded PRNG so server & client produce identical output */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function HeatmapPlaceholder() {
  const cells = useMemo(() => {
    const rand = seededRandom(42);
    const arr: number[] = [];
    for (let w = 0; w < 53; w++) {
      for (let d = 0; d < 7; d++) {
        const recent = w > 40;
        const r = rand();
        let level = 0;
        if (recent) {
          level = r < 0.1 ? 0 : r < 0.35 ? 1 : r < 0.7 ? 2 : r < 0.92 ? 3 : 4;
        } else {
          level = r < 0.55 ? 0 : r < 0.78 ? 1 : r < 0.93 ? 2 : r < 0.99 ? 3 : 4;
        }
        arr.push(level);
      }
    }
    return arr;
  }, []);

  return (
    <div className="heat-v2">
      {cells.map((l, i) => <i key={i} data-l={l > 0 ? l : undefined} />)}
    </div>
  );
}
