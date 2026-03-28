"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Circle, Clock, GripVertical, Layers, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TourButton } from "@/components/layout/tour-button";
import { format } from "date-fns";

interface GoalNode {
  id: string;
  title: string;
  type: string;
  parent: GoalNode | null;
}

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
};

interface StudyNoteListItem {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  _count: { flashcards: number };
  task: {
    status: string;
    priority: string;
    scheduledDate: string | null;
    estimatedMinutes: number | null;
    goal: GoalNode | null;
  };
}

interface QuarterlyGroup {
  id: string;
  title: string;
  notes: StudyNoteListItem[];
}

function findQuarterlyAncestor(goal: GoalNode | null): { id: string; title: string } | null {
  if (!goal) return null;
  if (goal.type === "QUARTERLY") return { id: goal.id, title: goal.title };
  return findQuarterlyAncestor(goal.parent);
}

function groupByQuarterly(notes: StudyNoteListItem[]): QuarterlyGroup[] {
  const map = new Map<string, QuarterlyGroup>();

  for (const note of notes) {
    const quarterly = findQuarterlyAncestor(note.task.goal);
    const key = quarterly?.id ?? "uncategorized";
    const label = quarterly?.title ?? "Uncategorized";

    if (!map.has(key)) {
      map.set(key, { id: key, title: label, notes: [] });
    }
    map.get(key)!.notes.push(note);
  }

  return Array.from(map.values());
}

export default function StudyNotesPage() {
  const [notes, setNotes] = useState<StudyNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Refs mirror state so handlers have stable non-stale access
  const draggingIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);

  const groups = useMemo(() => groupByQuarterly(notes), [notes]);

  const load = useCallback(async () => {
    const res = await fetch("/api/study-notes");
    const data: StudyNoteListItem[] = await res.json();
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverIdRef.current = id;
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((groupId: string) => {
    const fromId = draggingIdRef.current;
    const toId = dragOverIdRef.current;
    if (!fromId || !toId || fromId === toId) return;

    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === fromId);
      const toIndex = prev.findIndex((n) => n.id === toId);

      // Only allow reorder within the same group
      const fromGroup = findQuarterlyAncestor(prev[fromIndex]?.task.goal)?.id ?? "uncategorized";
      const toGroup = findQuarterlyAncestor(prev[toIndex]?.task.goal)?.id ?? "uncategorized";
      if (fromGroup !== toGroup || fromGroup !== groupId) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      // Persist new order
      const orderedIds = updated.map((n) => n.id);
      fetch("/api/study-notes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: orderedIds }),
      });

      return updated;
    });

    draggingIdRef.current = null;
    dragOverIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingIdRef.current = null;
    dragOverIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Study Notes</h1>
        </div>
        <TourButton tourId="study-notes" autoStart={groups.length === 0 && !loading} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground">No study notes yet. Generate one from a task.</p>
      ) : (
        <div id="tour-study-notes-list" className="space-y-8">
          {groups.map((group) => (
            <div key={group.id}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {group.title}
              </h2>
              <div className="divide-y rounded-lg border">
                {group.notes.map((note) => (
                  <div
                    key={note.id}
                    draggable
                    onDragStart={() => handleDragStart(note.id)}
                    onDragOver={(e) => handleDragOver(e, note.id)}
                    onDrop={() => handleDrop(group.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg
                      ${draggingId === note.id ? "opacity-40" : ""}
                      ${dragOverId === note.id && dragOverId !== draggingId ? "border-t-2 border-primary" : ""}
                    `}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                    {note.task.status === "COMPLETED" ? (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <Circle className={`h-5 w-5 shrink-0 ${priorityColors[note.task.priority] ?? "text-gray-500"}`} />
                    )}
                    <Link
                      href={`/study-notes/${note.id}`}
                      className="flex-1 min-w-0 flex items-center gap-3"
                      onClick={(e) => {
                        // Prevent navigation if the user was dragging
                        if (draggingIdRef.current) e.preventDefault();
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{note.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {note.task.scheduledDate && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.task.scheduledDate), "MMM d")}
                            </span>
                          )}
                          {note.task.estimatedMinutes && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {note.task.estimatedMinutes}m
                            </span>
                          )}
                          {note.task.goal && (
                            <Badge variant="outline" className="text-xs h-5">
                              {note.task.goal.title}
                            </Badge>
                          )}
                          <Badge variant="secondary" className={`text-xs h-5 ${priorityColors[note.task.priority] ?? "text-gray-500"}`}>
                            {note.task.priority}
                          </Badge>
                          {note._count.flashcards > 0 && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <Layers className="h-3 w-3" />
                              {note._count.flashcards} Flashcards
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p id="tour-study-notes-generate" className="mt-10 text-xs text-muted-foreground">
        To add a note, expand any task in the Weekly Plan or Goals pages and click <strong>Generate Study Note</strong>.
      </p>
    </div>
  );
}
