"use client";

import { useState, useEffect, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  format,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Check,
  MoreHorizontal,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";
import { Tickbox } from "@/components/v2/primitives";
import type { TaskWithGoal, Event } from "@/lib/types";

/* ── Kind tokens for event chips ─────────────────────────── */
const KIND_TOKENS: Record<string, { color: string; label: string }> = {
  task:          { color: "var(--v2-accent)", label: "task" },
  milestone:     { color: "var(--v2-warn)",   label: "milestone" },
  checkpoint:    { color: "var(--v2-info)",   label: "checkpoint" },
  certification: { color: "var(--v2-danger)", label: "certification" },
  review:        { color: "var(--ink-3)",     label: "review" },
};

const DOW_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getEventKind(event: Event): string {
  return event.category?.toLowerCase() || "task";
}

/* ── Draggable/Droppable wrappers ────────────────────────── */
function DraggableChip({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="touch-none" style={{ opacity: isDragging ? 0 : 1 }}>
      {children}
    </div>
  );
}

function DroppableDay({ dayId, style, onClick, children }: {
  dayId: string;
  style?: React.CSSProperties;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayId });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      style={{
        ...style,
        outline: isOver ? "2px solid var(--v2-accent)" : undefined,
        outlineOffset: isOver ? -2 : undefined,
      }}
    >
      {children}
    </button>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Monday-start calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  useEffect(() => {
    const from = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();
    const to = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }).toISOString();

    setLoading(true);
    Promise.all([
      fetch(`/api/tasks?from=${from}&to=${to}`).then((r) => r.json()),
      fetch(`/api/events?from=${from}&to=${to}`).then((r) => r.json()),
    ]).then(([tasksData, eventsData]) => {
      setTasks((tasksData as TaskWithGoal[]).filter((t) => t.status !== "DRAFT"));
      setEvents(eventsData as Event[]);
      setLoading(false);
    });
  }, [currentMonth]);

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day));

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.eventDate), day));

  const selectedTasks = getTasksForDay(selectedDay);
  const selectedEvents = getEventsForDay(selectedDay);
  const selectedItems = [...selectedEvents.map(e => ({ type: "event" as const, ...e })), ...selectedTasks.map(t => ({ type: "task" as const, ...t }))];

  const toggleTaskStatus = async (task: TaskWithGoal) => {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });
    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: newStatus as typeof task.status } : t)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeStr = active.id as string;
    const overStr = over.id as string;
    if (!overStr.startsWith("day:")) return;
    const [type, itemId] = activeStr.split(":");
    const targetDate = new Date(overStr.replace("day:", ""));

    if (type === "task") {
      const task = tasks.find((t) => t.id === itemId);
      if (!task || (task.scheduledDate && isSameDay(new Date(task.scheduledDate), targetDate))) return;
      setTasks((prev) => prev.map((t) => t.id === itemId ? { ...t, scheduledDate: targetDate } : t));
      await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: itemId, scheduledDate: targetDate.toISOString() }) });
    } else if (type === "event") {
      const ev = events.find((e) => e.id === itemId);
      if (!ev || isSameDay(new Date(ev.eventDate), targetDate)) return;
      setEvents((prev) => prev.map((e) => e.id === itemId ? { ...e, eventDate: targetDate } : e));
      await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: itemId, eventDate: targetDate.toISOString() }) });
    }
  };

  const activeTask = activeId?.startsWith("task:") ? tasks.find((t) => t.id === activeId.replace("task:", "")) : null;
  const activeEvent = activeId?.startsWith("event:") ? events.find((e) => e.id === activeId.replace("event:", "")) : null;

  // Month stats
  const monthLabel = `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const monthTaskCount = tasks.length;
  const monthEventCount = events.length;
  const totalThisMonth = monthTaskCount + monthEventCount;

  // Selected day info
  const selIsToday = isToday(selectedDay);
  const diffDays = differenceInCalendarDays(selectedDay, new Date());

  // Kind breakdown for mini summary
  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      const kind = getEventKind(e);
      counts[kind] = (counts[kind] || 0) + 1;
    });
    if (tasks.length > 0) counts.task = tasks.length;
    return counts;
  }, [events, tasks]);

  return (
    <div className="page-v2 fade-up" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 200ms" }}>
      {/* Page header */}
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2">
            Calendar
            <span className="num">{totalThisMonth} items this month</span>
          </h1>
          <p className="page-sub-v2">
            <span className="mono" style={{ color: "var(--ink-2)" }}>{monthLabel}</span>
            {" · "}
            <span className="mono">tasks, milestones &amp; exams in one view</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
            <button className="btn-v2-icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))} title="Previous month">
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button className="btn-v2 btn-v2-sm" onClick={goToToday}>Today</button>
            <button className="btn-v2-icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))} title="Next month">
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
          <button className="btn-v2 btn-v2-sm btn-v2-accent"><Plus size={13} strokeWidth={1.5} /> Event</button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* MONTH GRID */}
          <div className="card-v2" style={{ padding: 0, overflow: "hidden" }}>
            {/* DOW header */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--line)" }}>
              {DOW_SHORT.map(d => (
                <div key={d} className="mono" style={{
                  padding: "10px 12px", fontSize: 10, letterSpacing: ".08em",
                  textTransform: "uppercase", color: "var(--ink-3)", textAlign: "left",
                }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(98px, 1fr)" }}>
              {calendarDays.map((day, i) => {
                const dayTasks = getTasksForDay(day);
                const dayEvents = getEventsForDay(day);
                const allItems = [...dayEvents, ...dayTasks];
                const inMonth = isSameMonth(day, currentMonth);
                const isSel = isSameDay(day, selectedDay);
                const isTodayDay = isToday(day);
                const colIdx = i % 7;
                const rowIdx = Math.floor(i / 7);
                const dayId = `day:${day.toISOString()}`;

                return (
                  <DroppableDay
                    key={day.toISOString()}
                    dayId={dayId}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      position: "relative",
                      background: isSel ? "var(--accent-soft)" : isTodayDay ? "var(--bg-elev-2)" : "transparent",
                      border: 0,
                      borderRight: colIdx < 6 ? "1px solid var(--line-soft)" : "none",
                      borderTop: rowIdx > 0 ? "1px solid var(--line-soft)" : "none",
                      padding: "8px 10px 6px",
                      textAlign: "left",
                      cursor: "default",
                      color: inMonth ? "var(--ink)" : "var(--ink-4)",
                      display: "flex", flexDirection: "column", gap: 4,
                      minHeight: 98,
                      transition: "background 120ms",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <span className="mono" style={{
                        fontSize: 12, fontWeight: isTodayDay ? 600 : 500,
                        color: isTodayDay ? "var(--accent-ink)" : isSel ? "var(--accent-ink)" : inMonth ? "var(--ink)" : "var(--ink-4)",
                        background: isTodayDay ? "var(--v2-accent)" : "transparent",
                        width: isTodayDay ? 22 : "auto",
                        height: isTodayDay ? 22 : "auto",
                        borderRadius: isTodayDay ? "50%" : 0,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        padding: isTodayDay ? 0 : "0 2px",
                      }}>
                        {format(day, "d")}
                      </span>
                      {allItems.length > 0 && (
                        <span className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>{allItems.length}</span>
                      )}
                    </div>
                    {/* Event/task chips */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {dayEvents.slice(0, 2).map(ev => {
                        const tk = KIND_TOKENS[getEventKind(ev)] || KIND_TOKENS.task;
                        return (
                          <DraggableChip key={ev.id} id={`event:${ev.id}`}>
                            <div style={{
                              fontSize: 10.5, lineHeight: 1.25, padding: "2px 5px 2px 7px",
                              borderRadius: 4, borderLeft: `2px solid ${tk.color}`,
                              background: "var(--bg-elev-2)", color: tk.color,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              fontWeight: 500,
                            }}>
                              {ev.title}
                            </div>
                          </DraggableChip>
                        );
                      })}
                      {dayTasks.slice(0, 3 - Math.min(dayEvents.length, 2)).map(task => (
                        <DraggableChip key={task.id} id={`task:${task.id}`}>
                          <div style={{
                            fontSize: 10.5, lineHeight: 1.25, padding: "2px 5px 2px 7px",
                            borderRadius: 4, borderLeft: "2px solid var(--v2-accent)",
                            background: "var(--bg-elev-2)", color: "var(--v2-accent)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            fontWeight: 500,
                            textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
                            opacity: task.status === "COMPLETED" ? 0.6 : 1,
                          }}>
                            {task.title}
                          </div>
                        </DraggableChip>
                      ))}
                      {allItems.length > 3 && (
                        <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)", paddingLeft: 7 }}>
                          +{allItems.length - 3} more
                        </div>
                      )}
                    </div>
                  </DroppableDay>
                );
              })}
            </div>

            {/* Legend footer */}
            <div style={{
              borderTop: "1px solid var(--line)", padding: "10px 14px",
              display: "flex", gap: 16, alignItems: "center", fontSize: 11,
            }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Legend</span>
              {Object.entries(KIND_TOKENS).map(([k, tk]) => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ink-2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: tk.color }} />
                  <span className="mono" style={{ fontSize: 10.5 }}>{tk.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* DAY DETAIL PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card-v2" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {selIsToday ? "Today" : diffDays > 0 ? `In ${diffDays} day${diffDays === 1 ? "" : "s"}` : diffDays < 0 ? `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago` : "Today"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
                    {format(selectedDay, "EEE, MMMM d")}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {format(selectedDay, "yyyy-MM-dd")}
                  </div>
                </div>
                <div className="mono" style={{
                  fontSize: 32, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em",
                  color: selIsToday ? "var(--v2-accent)" : "var(--ink-2)",
                }}>
                  {format(selectedDay, "d")}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 10 }}>
                <span className="eyebrow">{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"}</span>
                <button className="btn-v2 btn-v2-sm btn-v2-ghost"><Plus size={11} strokeWidth={1.5} /> Add</button>
              </div>

              {selectedItems.length === 0 ? (
                <div style={{
                  padding: "24px 14px", textAlign: "center",
                  border: "1px dashed var(--line)", borderRadius: 10,
                  color: "var(--ink-3)", fontSize: 12.5,
                }}>
                  <Calendar size={18} strokeWidth={1.5} style={{ color: "var(--ink-4)", marginBottom: 6 }} />
                  <div>Nothing scheduled.</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 4 }}>
                    A free day to rest or get ahead.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selectedEvents.map(ev => {
                    const tk = KIND_TOKENS[getEventKind(ev)] || KIND_TOKENS.task;
                    return (
                      <div key={ev.id} style={{
                        display: "grid", gridTemplateColumns: "auto 1fr auto",
                        alignItems: "center", gap: 10, padding: "10px 12px",
                        borderRadius: 8, background: "var(--bg-elev-2)",
                        border: "1px solid var(--line-soft)",
                        borderLeft: `2px solid ${tk.color}`,
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: "var(--bg-elev-2)", color: tk.color,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Calendar size={11} strokeWidth={1.7} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                          <div className="mono" style={{ fontSize: 10, color: tk.color, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>
                            {tk.label}
                          </div>
                        </div>
                        <button className="btn-v2-icon"><MoreHorizontal size={13} strokeWidth={1.5} /></button>
                      </div>
                    );
                  })}
                  {selectedTasks.map(task => (
                    <div key={task.id} style={{
                      display: "grid", gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 8, background: "var(--bg-elev-2)",
                      border: "1px solid var(--line-soft)",
                      borderLeft: "2px solid var(--v2-accent)",
                    }}>
                      <Tickbox done={task.status === "COMPLETED"} onClick={() => toggleTaskStatus(task)} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500,
                          textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
                          color: task.status === "COMPLETED" ? "var(--ink-3)" : "var(--ink)",
                        }}>
                          {task.title}
                        </div>
                        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                          {task.estimatedMinutes && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <Clock size={9} strokeWidth={1.5} /> {task.estimatedMinutes}m
                            </span>
                          )}
                          {task.goal && <span>{task.goal.title}</span>}
                        </div>
                      </div>
                      <button className="btn-v2-icon"><MoreHorizontal size={13} strokeWidth={1.5} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini month breakdown */}
            <div className="card-v2" style={{ padding: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Breakdown &middot; {MONTHS[currentMonth.getMonth()]}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(kindCounts).map(([k, count]) => {
                  const tk = KIND_TOKENS[k] || KIND_TOKENS.task;
                  return (
                    <div key={k} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: tk.color }} />
                      <span style={{ fontSize: 12.5, color: "var(--ink-2)", textTransform: "capitalize" }}>{tk.label}</span>
                      <span className="mono" style={{ fontSize: 12, color: "var(--ink)" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask && (
            <div style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 4,
              background: "var(--bg-elev)", border: "1px solid var(--line)",
              boxShadow: "var(--shadow-lg)", maxWidth: 140, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {activeTask.title}
            </div>
          )}
          {activeEvent && (
            <div style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 4,
              background: "var(--bg-elev)", border: "1px solid var(--line)",
              boxShadow: "var(--shadow-lg)", maxWidth: 140, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {activeEvent.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
