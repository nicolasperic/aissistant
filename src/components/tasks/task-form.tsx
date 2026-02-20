"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Goal } from "@prisma/client";

type TaskFormData = {
  title: string;
  description: string;
  priority: string;
  scheduledDate: string;
  estimatedMinutes: string;
  goalId: string;
};

export function TaskForm({
  goals,
  onSubmit,
  defaultDate,
}: {
  goals?: Goal[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "MEDIUM",
    scheduledDate: defaultDate || new Date().toISOString().split("T")[0],
    estimatedMinutes: "",
    goalId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        scheduledDate: defaultDate || new Date().toISOString().split("T")[0],
        estimatedMinutes: "",
        goalId: "",
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
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
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="task-minutes">Estimated Minutes</Label>
            <Input
              id="task-minutes"
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
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
