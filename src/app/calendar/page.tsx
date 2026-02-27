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
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskWithGoal, Event } from "@/lib/types";

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-gray-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const PRIORITY_TEXT: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Full grid range: Sunday before month start → Saturday after month end
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  useEffect(() => {
    const from = startOfWeek(startOfMonth(currentMonth)).toISOString();
    const to = endOfWeek(endOfMonth(currentMonth)).toISOString();

    setLoading(true);
    Promise.all([
      fetch(`/api/tasks?from=${from}&to=${to}`).then((r) => r.json()),
      fetch(`/api/events?from=${from}&to=${to}`).then((r) => r.json()),
    ]).then(([tasksData, eventsData]) => {
      setTasks(
        (tasksData as TaskWithGoal[]).filter((t) => t.status !== "DRAFT")
      );
      setEvents(eventsData as Event[]);
      setLoading(false);
    });
  }, [currentMonth]);

  const getTasksForDay = (day: Date) =>
    tasks.filter(
      (t) => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day)
    );

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.eventDate), day));

  const selectedTasks = getTasksForDay(selectedDay);
  const selectedEvents = getEventsForDay(selectedDay);

  const toggleTaskStatus = async (task: TaskWithGoal) => {
    const newStatus =
      task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: newStatus }),
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus as typeof task.status }
          : t
      )
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDay(new Date());
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-4">
        {/* Calendar grid */}
        <div
          className={cn(
            "flex flex-1 min-w-0 flex-col transition-opacity",
            loading && "opacity-50 pointer-events-none"
          )}
        >
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 border-l border-t border-border flex-1">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDay);
              const isTodayDay = isToday(day);

              const eventsSlice = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
              const tasksSlice = dayTasks.slice(
                0,
                MAX_VISIBLE_PER_DAY - eventsSlice.length
              );
              const overflow =
                dayTasks.length +
                dayEvents.length -
                eventsSlice.length -
                tasksSlice.length;
              const completedCount = dayTasks.filter(
                (t) => t.status === "COMPLETED"
              ).length;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[110px] border-b border-r border-border p-1.5 text-left",
                    "flex flex-col gap-0.5 transition-colors hover:bg-muted/30",
                    !isCurrentMonth && "bg-muted/10",
                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                  )}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isTodayDay
                          ? "bg-primary text-primary-foreground"
                          : !isCurrentMonth
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-muted-foreground pr-0.5">
                        {completedCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  {eventsSlice.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 rounded px-1 py-0.5 bg-violet-100 dark:bg-violet-900/30 truncate"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      <span className="truncate text-[11px] text-violet-800 dark:text-violet-300">
                        {event.title}
                      </span>
                    </div>
                  ))}

                  {/* Tasks */}
                  {tasksSlice.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 truncate",
                        task.status === "COMPLETED"
                          ? "bg-muted/40"
                          : "bg-muted/60"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          PRIORITY_DOT[task.priority]
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[11px]",
                          task.status === "COMPLETED"
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}

                  {overflow > 0 && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{overflow} more
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day panel */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-4 lg:overflow-y-auto">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">
              {format(selectedDay, "EEEE, MMMM d")}
            </h2>
          </div>

          {selectedEvents.length === 0 && selectedTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled for this day.
            </p>
          )}

          {/* Events */}
          {selectedEvents.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Events
              </p>
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-violet-900 dark:text-violet-100 leading-snug">
                      {event.title}
                    </span>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 mt-0.5 text-violet-500 hover:text-violet-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-violet-700 dark:text-violet-300 leading-snug">
                      {event.description}
                    </p>
                  )}
                  {event.category && (
                    <Badge
                      variant="outline"
                      className="w-fit text-[10px] h-4 px-1.5 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400"
                    >
                      {event.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {selectedTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tasks
              </p>
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "rounded-lg border p-3 flex flex-col gap-2 transition-colors",
                    task.status === "COMPLETED"
                      ? "bg-muted/30 border-border/50"
                      : "bg-background border-border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {task.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        task.status === "COMPLETED" &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-6">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        PRIORITY_TEXT[task.priority]
                      )}
                    >
                      {task.priority.charAt(0) +
                        task.priority.slice(1).toLowerCase()}
                    </span>
                    {task.estimatedMinutes && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                    {task.goal && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {task.goal.title}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
