"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Circle, Clock, Pencil, Trash2, ChevronDown, BookOpen, Loader2, ExternalLink } from "lucide-react";
import type { TaskWithGoal } from "@/lib/types";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
};

export function TaskItem({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: TaskWithGoal;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (task: TaskWithGoal) => void;
  onDelete?: (id: string) => void;
}) {
  const router = useRouter();
  const isCompleted = task.status === "COMPLETED";
  const [expanded, setExpanded] = useState(false);
  const hasDescription = !!task.description;

  // Planning notes
  const [planningNotes, setPlanningNotes] = useState(task.planningNotes ?? "");
  const planningNotesSaved = useRef(task.planningNotes ?? "");

  // Study note
  const [studyNoteId, setStudyNoteId] = useState(task.studyNote?.id ?? null);
  const [generating, setGenerating] = useState(false);

  async function savePlanningNotes() {
    if (planningNotes === planningNotesSaved.current) return;
    planningNotesSaved.current = planningNotes;
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, planningNotes }),
    });
  }

  async function handleGenerateStudyNote() {
    if (studyNoteId) {
      router.push(`/study-notes/${studyNoteId}`);
      return;
    }
    setGenerating(true);
    try {
      // Save planning notes first if unsaved
      if (planningNotes !== planningNotesSaved.current) {
        planningNotesSaved.current = planningNotes;
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, planningNotes }),
        });
      }
      const res = await fetch("/api/ai/generate-study-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });
      const data = await res.json();
      setStudyNoteId(data.id);
      router.push(`/study-notes/${data.id}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Main row — click anywhere to expand/collapse description */}
      <div
        className={`flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 ${
          hasDescription ? "cursor-pointer" : ""
        }`}
        onClick={hasDescription ? () => setExpanded((v) => !v) : undefined}
      >
        {/* Status toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(task.id, isCompleted ? "PENDING" : "COMPLETED");
          }}
          className="shrink-0"
        >
          {isCompleted ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <Circle className={`h-5 w-5 ${priorityColors[task.priority]}`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.scheduledDate && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.scheduledDate), "MMM d")}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimatedMinutes}m
              </span>
            )}
            {task.goal && (
              <Badge variant="outline" className="text-xs h-5">
                {task.goal.title}
              </Badge>
            )}
            <Badge variant="secondary" className={`text-xs h-5 ${priorityColors[task.priority]}`}>
              {task.priority}
            </Badge>
            {studyNoteId && (
              <Badge variant="outline" className="text-xs h-5 gap-1 text-primary border-primary/30">
                <BookOpen className="h-2.5 w-2.5" />
                Study note
              </Badge>
            )}
          </div>
        </div>

        {hasDescription && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}

        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsible section — animates with grid-row trick */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t bg-muted/30 px-4 py-3 pl-11 space-y-3">
            {/* Task description */}
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>

            {/* Planning notes */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Study context</p>
              <Textarea
                value={planningNotes}
                onChange={(e) => setPlanningNotes(e.target.value)}
                onBlur={savePlanningNotes}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add any extra context, areas you want to focus on, or specific questions for the AI to address when generating study content…"
                className="min-h-[72px] resize-none !text-xs bg-background"
              />
            </div>

            {/* Generate study note button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant={studyNoteId ? "outline" : "default"}
                className="gap-1.5 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateStudyNote();
                }}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : studyNoteId ? (
                  <ExternalLink className="h-3 w-3" />
                ) : (
                  <BookOpen className="h-3 w-3" />
                )}
                {generating
                  ? "Generating…"
                  : studyNoteId
                  ? "View Study Note"
                  : "Generate Study Note"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
