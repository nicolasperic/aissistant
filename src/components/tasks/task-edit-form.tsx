"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Goal } from "@prisma/client";
import type { TaskWithGoal } from "@/lib/types";

type TaskEditData = {
  id: string;
  title: string;
  description: string;
  priority: string;
  scheduledDate: string;
  estimatedMinutes: string;
  goalId: string;
};

export function TaskEditForm({
  task,
  goals,
  open,
  onOpenChange,
  onSubmit,
}: {
  task: TaskWithGoal;
  goals?: Goal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskEditData) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskEditData>({
    id: task.id,
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    scheduledDate: task.scheduledDate
      ? new Date(task.scheduledDate).toISOString().split("T")[0]
      : "",
    estimatedMinutes: task.estimatedMinutes?.toString() || "",
    goalId: task.goalId || "",
  });

  useEffect(() => {
    setForm({
      id: task.id,
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      scheduledDate: task.scheduledDate
        ? new Date(task.scheduledDate).toISOString().split("T")[0]
        : "",
      estimatedMinutes: task.estimatedMinutes?.toString() || "",
      goalId: task.goalId || "",
    });
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          <div>
            <Label htmlFor="edit-task-title">Title</Label>
            <Input
              id="edit-task-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="overflow-hidden">
            <Label htmlFor="edit-task-description">Description</Label>
            <Textarea
              id="edit-task-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              className="min-h-[80px] max-h-[350px] resize-y font-mono text-xs overflow-auto w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
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
            <div>
              <Label htmlFor="edit-task-date">Date</Label>
              <Input
                id="edit-task-date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-task-minutes">Estimated Minutes</Label>
            <Input
              id="edit-task-minutes"
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              placeholder="e.g., 30"
            />
          </div>
          {goals && goals.length > 0 && (
            <div>
              <Label>Linked Goal</Label>
              <Select value={form.goalId} onValueChange={(v) => setForm({ ...form, goalId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
