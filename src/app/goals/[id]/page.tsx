"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { GoalForm } from "@/components/goals/goal-form";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useCelebration } from "@/components/rewards/badge-celebration";
import Link from "next/link";
import { format } from "date-fns";
import type { GoalWithRelations, TaskWithGoal } from "@/lib/types";

function findQuarterlyAncestor(goal: GoalWithRelations | null | undefined): GoalWithRelations | null {
  if (!goal) return null;
  if (goal.type === "QUARTERLY") return goal;
  return findQuarterlyAncestor(goal.parent);
}

export default function GoalDetailPage() {
  const params = useParams();
  const [goal, setGoal] = useState<GoalWithRelations | null>(null);
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [editingTask, setEditingTask] = useState<TaskWithGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressInput, setProgressInput] = useState("0");

  // Planning notes state
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesSaveError, setNotesSaveError] = useState(false);
  // Only seed notes from DB on first load — never overwrite while user is editing
  const notesInitialized = useRef(false);

  const loadData = useCallback(async () => {
    const [goalsRes, tasksRes] = await Promise.all([
      fetch("/api/goals"),
      fetch(`/api/tasks?goalId=${params.id}`),
    ]);
    const goals = await goalsRes.json();
    const found = goals.find((g: GoalWithRelations) => g.id === params.id);
    if (found) {
      setGoal(found);
      setProgress(found.progress);
      setProgressInput(String(found.progress));
      if (!notesInitialized.current) {
        setNotes(found.notes || "");
        notesInitialized.current = true;
      }
    }
    setTasks(await tasksRes.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { celebrate } = useCelebration();

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (data.newBadges?.length) celebrate(data.newBadges);
    loadData();
  };

  const handleTaskDelete = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const handleCreateTask = async (data: Record<string, string>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, goalId: params.id }),
    });
    loadData();
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
        estimatedMinutes: data.estimatedMinutes ? parseInt(data.estimatedMinutes) : null,
        goalId: data.goalId || null,
      }),
    });
    setEditingTask(null);
    loadData();
  };

  const handleCreateSubGoal = async (data: Record<string, string>) => {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadData();
  };

  const handleUpdateProgress = async () => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: params.id, progress }),
    });
    loadData();
  };

  const handleSaveNotes = async () => {
    if (!goal || notes === (goal.notes || "")) return;
    setNotesSaving(true);
    setNotesSaved(false);
    setNotesSaveError(false);
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goal.id, notes }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Keep local goal in sync so the guard works correctly on the next blur
      setGoal({ ...goal, notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch {
      setNotesSaveError(true);
      setTimeout(() => setNotesSaveError(false), 3000);
    } finally {
      setNotesSaving(false);
    }
  };

  if (loading || !goal) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/goals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{goal.type}</Badge>
            {goal.category && <Badge variant="outline">{goal.category}</Badge>}
            <span className="text-sm text-muted-foreground">
              {format(new Date(goal.startDate), "MMM d")} - {format(new Date(goal.endDate), "MMM d, yyyy")}
            </span>
            {(() => {
              const cert = findQuarterlyAncestor(goal.type === "QUARTERLY" ? null : goal.parent);
              return cert?.shortName ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {cert.shortName}
                </Badge>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {goal.description && (
        <p className="text-muted-foreground">{goal.description}</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} className="h-3" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={progressInput}
              onChange={(e) => {
                setProgressInput(e.target.value);
                const num = parseInt(e.target.value, 10);
                if (!isNaN(num)) setProgress(Math.min(100, Math.max(0, num)));
              }}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" onClick={handleUpdateProgress}>
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planning Notes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm font-medium">Planning Notes</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {notesSaving && (
                <span className="text-xs text-muted-foreground">Saving…</span>
              )}
              {notesSaved && (
                <span className="text-xs text-green-600 dark:text-green-400">Saved ✓</span>
              )}
              {notesSaveError && (
                <span className="text-xs text-destructive">Save failed — try again</span>
              )}
              <span className="text-xs text-muted-foreground">
                Used as context when generating AI plans
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={`Add context Claude will use when planning tasks for this goal.\n\nExamples:\n• Exam sections and their weights\n• Key topics to cover\n• Study materials and resources\n• Constraints or preferences\n• Anything that helps shape a better plan`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            rows={10}
            className="resize-y font-mono text-sm leading-relaxed"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <GoalForm
          fixedParentId={goal.id}
          fixedParentLabel={goal.title}
          onSubmit={handleCreateSubGoal}
        />
      </div>

      {goal.children && goal.children.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sub-Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...goal.children].sort((a, b) => b.position - a.position).map((child) => (
                <Link key={child.id} href={`/goals/${child.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{child.type.charAt(0)}</Badge>
                    <span className="text-sm">{child.title}</span>
                  </div>
                  <span className="text-sm font-medium">{Math.round(child.progress)}%</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <TaskForm onSubmit={handleCreateTask} />
        </div>
        <TaskList
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEdit={setEditingTask}
          onDelete={handleTaskDelete}
          emptyMessage="No tasks linked to this goal"
        />
      </div>

      {editingTask && (
        <TaskEditForm
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null); }}
          onSubmit={handleEditTask}
        />
      )}
    </div>
  );
}
