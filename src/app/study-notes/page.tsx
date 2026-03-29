"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, Circle, Clock, GripVertical, Layers, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TourButton } from "@/components/layout/tour-button";
import { useLocalStorage } from "@/hooks/use-local-storage";
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupOrder, setGroupOrder] = useLocalStorage<string[]>("study-notes-group-order", []);

  // Note-level drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);

  // Group-level drag state
  const [groupDraggingId, setGroupDraggingId] = useState<string | null>(null);
  const [groupDragOverId, setGroupDragOverId] = useState<string | null>(null);
  const groupDraggingIdRef = useRef<string | null>(null);
  const groupDragOverIdRef = useRef<string | null>(null);

  const groups = useMemo(() => groupByQuarterly(notes), [notes]);

  // orderedGroups respects user-defined groupOrder; appends any new groups at the end
  const orderedGroups = useMemo(() => {
    if (groupOrder.length === 0) return groups;
    const map = new Map(groups.map((g) => [g.id, g]));
    const ordered = groupOrder.map((id) => map.get(id)).filter(Boolean) as QuarterlyGroup[];
    groups.forEach((g) => {
      if (!groupOrder.includes(g.id)) ordered.push(g);
    });
    return ordered;
  }, [groups, groupOrder]);

  // Collapse all groups once on first load; seed groupOrder from groups only if localStorage was empty
  const initializedRef = useRef(false);
  useEffect(() => {
    if (groups.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setCollapsedGroups(new Set(groups.map((g) => g.id)));
      if (groupOrder.length === 0) {
        setGroupOrder(groups.map((g) => g.id));
      } else {
        const missing = groups.map((g) => g.id).filter((id) => !groupOrder.includes(id));
        if (missing.length > 0) {
          setGroupOrder((prev) => [...prev, ...missing]);
        }
      }
    }
  // groupOrder intentionally omitted — we only want to seed it when it's empty on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/study-notes");
    const data: StudyNoteListItem[] = await res.json();
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Note-level drag handlers ─────────────────────────────────────────────

  const handleDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (groupDraggingIdRef.current) return; // let event bubble to list container
    e.stopPropagation();
    dragOverIdRef.current = id;
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, groupId: string) => {
    if (groupDraggingIdRef.current) return;
    e.stopPropagation();
    const fromId = draggingIdRef.current;
    const toId = dragOverIdRef.current;
    if (!fromId || !toId || fromId === toId) return;

    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === fromId);
      const toIndex = prev.findIndex((n) => n.id === toId);

      const fromGroup = findQuarterlyAncestor(prev[fromIndex]?.task.goal)?.id ?? "uncategorized";
      const toGroup = findQuarterlyAncestor(prev[toIndex]?.task.goal)?.id ?? "uncategorized";
      if (fromGroup !== toGroup || fromGroup !== groupId) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      fetch("/api/study-notes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: updated.map((n) => n.id) }),
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

  // ── Group-level drag handlers ─────────────────────────────────────────────

  const handleGroupDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.stopPropagation();
    groupDraggingIdRef.current = id;
    setGroupDraggingId(id);
  }, []);

  // Walk up the DOM from the drag target to find which group is hovered.
  // This avoids relying on per-element dragenter which misfires on child elements.
  const findGroupIdFromTarget = useCallback((target: EventTarget | null): string | null => {
    let el = target as HTMLElement | null;
    while (el) {
      const id = el.dataset?.groupId;
      if (id) return id;
      el = el.parentElement;
    }
    return null;
  }, []);

  const handleListDragOver = useCallback((e: React.DragEvent) => {
    if (!groupDraggingIdRef.current) return;
    e.preventDefault();
    let id = findGroupIdFromTarget(e.target);
    if (!id) {
      // Cursor is in empty space (gap between groups, or above/below all groups).
      // Find the nearest group element by Y position so bottom-to-top drags
      // that overshoot past the top group still resolve correctly.
      const groupEls = document.querySelectorAll<HTMLElement>("[data-group-id]");
      let nearestId: string | null = null;
      let nearestDist = Infinity;
      groupEls.forEach((el) => {
        const gId = el.dataset.groupId!;
        if (gId === groupDraggingIdRef.current) return;
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(e.clientY - midY);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestId = gId;
        }
      });
      id = nearestId;
    }
    if (!id || id === groupDraggingIdRef.current) return;
    if (groupDragOverIdRef.current === id) return;
    groupDragOverIdRef.current = id;
    setGroupDragOverId(id);
  }, [findGroupIdFromTarget]);

  const handleGroupDrop = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    const fromId = groupDraggingIdRef.current;
    const toId = groupDragOverIdRef.current;

    if (fromId && toId && fromId !== toId) {
      setGroupOrder((prev) => {
        const updated = [...prev];
        const fromIndex = updated.indexOf(fromId);
        const toIndex = updated.indexOf(toId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, fromId);
        return updated;
      });
    }

    groupDraggingIdRef.current = null;
    groupDragOverIdRef.current = null;
    setGroupDraggingId(null);
    setGroupDragOverId(null);
  }, []);

  const handleGroupDragEnd = useCallback(() => {
    groupDraggingIdRef.current = null;
    groupDragOverIdRef.current = null;
    setGroupDraggingId(null);
    setGroupDragOverId(null);
  }, []);

  return (
    <div className="flex gap-8 pr-8">
      {/* TOC sidebar */}
      {!loading && orderedGroups.length > 0 && (
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
              Contents
            </p>
            {orderedGroups.map((group) => (
              <a
                key={group.id}
                href={`#group-${group.id}`}
                className="block text-xs leading-snug text-muted-foreground hover:text-foreground transition-colors truncate py-0.5"
              >
                {group.title}
              </a>
            ))}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Notes</h1>
          </div>
          <TourButton tourId="study-notes" autoStart={orderedGroups.length === 0 && !loading} />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : orderedGroups.length === 0 ? (
          <p className="text-muted-foreground">No study notes yet. Generate one from a task.</p>
        ) : (
          <div
            id="tour-study-notes-list"
            className="space-y-8"
            onDragOver={handleListDragOver}
            onDrop={handleGroupDrop}
          >
            {orderedGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.id);
              return (
                <div
                  key={group.id}
                  id={`group-${group.id}`}
                  data-group-id={group.id}
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, group.id)}
                  onDragEnd={handleGroupDragEnd}
                  className={`scroll-mt-20 ${
                    groupDraggingId === group.id ? "opacity-40" : ""
                  } ${
                    groupDragOverId === group.id && groupDragOverId !== groupDraggingId
                      ? "border-t-2 border-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="shrink-0 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center gap-2 flex-1 text-left group"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
                        {group.title}
                      </span>
                      <span className="text-xs text-muted-foreground/60 ml-1">
                        ({group.notes.length})
                      </span>
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className="divide-y rounded-lg border">
                      {group.notes.map((note) => (
                        <div
                          key={note.id}
                          draggable
                          onDragStart={() => handleDragStart(note.id)}
                          onDragOver={(e) => handleDragOver(e, note.id)}
                          onDrop={(e) => handleDrop(e, group.id)}
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
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p id="tour-study-notes-generate" className="mt-10 text-xs text-muted-foreground">
          To add a note, expand any task in the Weekly Plan or Goals pages and click <strong>Generate Study Note</strong>.
        </p>
      </div>
    </div>
  );
}
