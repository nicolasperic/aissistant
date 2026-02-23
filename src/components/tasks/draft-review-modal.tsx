"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Pencil, X, Sparkles, Clock, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import type { TaskWithGoal } from "@/lib/types";
import type { Goal } from "@prisma/client";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

type EditForm = {
  title: string;
  scheduledDate: string;
  priority: string;
  estimatedMinutes: string;
  goalId: string;
};

function DraftTaskCard({
  task,
  goals,
  onAccept,
  onSkip,
  onEdit,
}: {
  task: TaskWithGoal;
  goals: Goal[];
  onAccept: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
  onEdit: (id: string, form: EditForm) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EditForm>({
    title: task.title,
    scheduledDate: task.scheduledDate
      ? new Date(task.scheduledDate).toISOString().split("T")[0]
      : "",
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes?.toString() ?? "",
    goalId: task.goalId ?? "",
  });

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/[0.02] p-4 space-y-3">
        <div>
          <Label htmlFor={`edit-title-${task.id}`} className="text-xs">Title</Label>
          <Input
            id={`edit-title-${task.id}`}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Est. minutes</Label>
            <Input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              placeholder="e.g., 30"
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Linked goal</Label>
            <Select value={form.goalId || "none"} onValueChange={(v) => setForm({ ...form, goalId: v === "none" ? "" : v })}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            disabled={busy || !form.title.trim()}
            onClick={() => wrap(() => onEdit(task.id, form))}
          >
            <Check className="mr-1 h-3 w-3" />
            Save & Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setEditing(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const scheduledLabel = task.scheduledDate
    ? format(new Date(task.scheduledDate), "EEE, MMM d")
    : "No date";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {scheduledLabel}
        </span>
        {task.estimatedMinutes && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimatedMinutes}m
          </span>
        )}
        {task.goal && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {task.goal.title}
          </Badge>
        )}
      </div>
      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          variant="default"
          className="h-7 px-2.5 text-xs"
          disabled={busy}
          onClick={() => wrap(() => onAccept(task.id))}
        >
          <Check className="mr-1 h-3 w-3" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
          disabled={busy}
          onClick={() => wrap(() => onSkip(task.id))}
        >
          <X className="mr-1 h-3 w-3" />
          Skip
        </Button>
      </div>
    </div>
  );
}

export function DraftReviewModal({
  tasks,
  goals,
  onClose,
  onRefresh,
}: {
  tasks: TaskWithGoal[];
  goals: Goal[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [localTasks, setLocalTasks] = useState<TaskWithGoal[]>(tasks);
  const [busy, setBusy] = useState(false);

  const removeTask = (id: string) => setLocalTasks((prev) => prev.filter((t) => t.id !== id));

  const acceptTask = async (id: string) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "PENDING" }),
    });
    removeTask(id);
    onRefresh();
  };

  const skipTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    removeTask(id);
    onRefresh();
  };

  const editTask = async (id: string, form: EditForm) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: form.title,
        priority: form.priority,
        scheduledDate: form.scheduledDate || null,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
        goalId: form.goalId || null,
        status: "PENDING",
      }),
    });
    removeTask(id);
    onRefresh();
  };

  const acceptAll = async () => {
    setBusy(true);
    try {
      await Promise.all(
        localTasks.map((t) =>
          fetch("/api/tasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: t.id, status: "PENDING" }),
          })
        )
      );
      setLocalTasks([]);
      await onRefresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const skipAll = async () => {
    if (!confirm(`Skip all ${localTasks.length} draft tasks? They will be deleted.`)) return;
    setBusy(true);
    try {
      await Promise.all(
        localTasks.map((t) =>
          fetch(`/api/tasks?id=${t.id}`, { method: "DELETE" })
        )
      );
      setLocalTasks([]);
      await onRefresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // Auto-close when all tasks are handled
  const open = localTasks.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Review Generated Plan
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {localTasks.length} task{localTasks.length !== 1 ? "s" : ""} pending review
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs"
                disabled={busy}
                onClick={acceptAll}
              >
                <Check className="mr-1 h-3 w-3" />
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-muted-foreground"
                disabled={busy}
                onClick={skipAll}
              >
                <X className="mr-1 h-3 w-3" />
                Skip All
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {localTasks.map((task) => (
            <DraftTaskCard
              key={task.id}
              task={task}
              goals={goals}
              onAccept={acceptTask}
              onSkip={skipTask}
              onEdit={editTask}
            />
          ))}
        </div>

        <div className="px-6 py-4 border-t shrink-0">
          <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8" onClick={onClose}>
            Close (drafts will be saved)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
