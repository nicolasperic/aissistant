"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, Clock, GripVertical, Layers, Loader2, Check, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { format } from "date-fns";

interface GoalNode {
  id: string;
  title: string;
  type: string;
  parent: GoalNode | null;
}

interface StudyNoteListItem {
  id: string;
  title: string;
  position: number;
  validated: boolean;
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
    if (!map.has(key)) map.set(key, { id: key, title: label, notes: [] });
    map.get(key)!.notes.push(note);
  }
  return Array.from(map.values());
}

export default function StudyNotesPage() {
  const [notes, setNotes] = useState<StudyNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupOrder, setGroupOrder] = useLocalStorage<string[]>("study-notes-group-order", []);
  const [search, setSearch] = useState("");

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);

  const [groupDraggingId, setGroupDraggingId] = useState<string | null>(null);
  const [groupDragOverId, setGroupDragOverId] = useState<string | null>(null);
  const groupDraggingIdRef = useRef<string | null>(null);
  const groupDragOverIdRef = useRef<string | null>(null);

  const groups = useMemo(() => groupByQuarterly(notes), [notes]);

  const orderedGroups = useMemo(() => {
    if (groupOrder.length === 0) return groups;
    const map = new Map(groups.map((g) => [g.id, g]));
    const ordered = groupOrder.map((id) => map.get(id)).filter(Boolean) as QuarterlyGroup[];
    groups.forEach((g) => { if (!groupOrder.includes(g.id)) ordered.push(g); });
    return ordered;
  }, [groups, groupOrder]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (groups.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      if (groupOrder.length === 0) {
        setGroupOrder(groups.map((g) => g.id));
      } else {
        const missing = groups.map((g) => g.id).filter((id) => !groupOrder.includes(id));
        if (missing.length > 0) setGroupOrder((prev) => [...prev, ...missing]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/study-notes");
    const data: StudyNoteListItem[] = await res.json();
    const computedGroups = groupByQuarterly(data);
    setCollapsedGroups(new Set(computedGroups.map((g) => g.id)));
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Note-level drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => { e.stopPropagation(); draggingIdRef.current = id; setDraggingId(id); }, []);
  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault(); if (groupDraggingIdRef.current) return; e.stopPropagation(); dragOverIdRef.current = id; setDragOverId(id);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, groupId: string) => {
    if (groupDraggingIdRef.current) return; e.stopPropagation();
    const fromId = draggingIdRef.current; const toId = dragOverIdRef.current;
    if (!fromId || !toId || fromId === toId) return;
    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === fromId);
      const toIndex = prev.findIndex((n) => n.id === toId);
      const fromGroup = findQuarterlyAncestor(prev[fromIndex]?.task.goal)?.id ?? "uncategorized";
      const toGroup = findQuarterlyAncestor(prev[toIndex]?.task.goal)?.id ?? "uncategorized";
      if (fromGroup !== toGroup || fromGroup !== groupId) return prev;
      const updated = [...prev]; const [moved] = updated.splice(fromIndex, 1); updated.splice(toIndex, 0, moved);
      fetch("/api/study-notes/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: updated.map((n) => n.id) }) });
      return updated;
    });
    draggingIdRef.current = null; dragOverIdRef.current = null; setDraggingId(null); setDragOverId(null);
  }, []);
  const handleDragEnd = useCallback(() => { draggingIdRef.current = null; dragOverIdRef.current = null; setDraggingId(null); setDragOverId(null); }, []);

  // ── Group-level drag handlers
  const handleGroupDragStart = useCallback((e: React.DragEvent, id: string) => { e.stopPropagation(); groupDraggingIdRef.current = id; setGroupDraggingId(id); }, []);
  const findGroupIdFromTarget = useCallback((target: EventTarget | null): string | null => {
    let el = target as HTMLElement | null;
    while (el) { const id = el.dataset?.groupId; if (id) return id; el = el.parentElement; }
    return null;
  }, []);
  const handleListDragOver = useCallback((e: React.DragEvent) => {
    if (!groupDraggingIdRef.current) return; e.preventDefault();
    let id = findGroupIdFromTarget(e.target);
    if (!id) {
      const groupEls = document.querySelectorAll<HTMLElement>("[data-group-id]");
      let nearestId: string | null = null; let nearestDist = Infinity;
      groupEls.forEach((el) => { const gId = el.dataset.groupId!; if (gId === groupDraggingIdRef.current) return; const rect = el.getBoundingClientRect(); const midY = rect.top + rect.height / 2; const dist = Math.abs(e.clientY - midY); if (dist < nearestDist) { nearestDist = dist; nearestId = gId; } });
      id = nearestId;
    }
    if (!id || id === groupDraggingIdRef.current || groupDragOverIdRef.current === id) return;
    groupDragOverIdRef.current = id; setGroupDragOverId(id);
  }, [findGroupIdFromTarget]);
  const handleGroupDrop = useCallback((e: React.DragEvent) => {
    e.stopPropagation(); const fromId = groupDraggingIdRef.current; const toId = groupDragOverIdRef.current;
    if (fromId && toId && fromId !== toId) {
      setGroupOrder((prev) => { const updated = [...prev]; const fromIndex = updated.indexOf(fromId); const toIndex = updated.indexOf(toId); if (fromIndex === -1 || toIndex === -1) return prev; updated.splice(fromIndex, 1); updated.splice(toIndex, 0, fromId); return updated; });
    }
    groupDraggingIdRef.current = null; groupDragOverIdRef.current = null; setGroupDraggingId(null); setGroupDragOverId(null);
  }, []);
  const handleGroupDragEnd = useCallback(() => { groupDraggingIdRef.current = null; groupDragOverIdRef.current = null; setGroupDraggingId(null); setGroupDragOverId(null); }, []);

  return (
    <div className="page-v2 fade-up">
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={20} strokeWidth={1.6} style={{ color: "var(--ink-2)" }} />
            Study Notes
          </h1>
          <p className="page-sub-v2">All your generated notes, grouped by certification path.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input-v2" placeholder="Search notes..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn-v2 btn-v2-sm btn-v2-accent"><Sparkles size={13} strokeWidth={1.5} /> Generate</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: "var(--ink-3)" }}>
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          <span>Loading...</span>
        </div>
      ) : orderedGroups.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          No study notes yet. Generate one from a task.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
          {/* CONTENTS SIDEBAR */}
          <aside style={{ position: "sticky", top: 80, alignSelf: "flex-start" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Contents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {orderedGroups.map(c => (
                <button key={c.id} onClick={() => {
                  setCollapsedGroups(prev => { const n = new Set(prev); n.delete(c.id); return n; });
                  document.getElementById(`group-${c.id}`)?.scrollIntoView({ behavior: "smooth" });
                }} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "8px 10px", border: 0, borderRadius: 7,
                  background: !collapsedGroups.has(c.id) ? "var(--selected)" : "transparent",
                  color: !collapsedGroups.has(c.id) ? "var(--ink)" : "var(--ink-2)",
                  fontSize: 12, textAlign: "left", cursor: "default", lineHeight: 1.35,
                  fontFamily: "inherit",
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title.length > 30 ? c.title.slice(0, 30) + "…" : c.title}
                  </span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{c.notes.length}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* NOTES LIST */}
          <div onDragOver={handleListDragOver} onDrop={handleGroupDrop}>
            {orderedGroups.map(group => {
              const isCollapsed = collapsedGroups.has(group.id);
              return (
                <div
                  key={group.id}
                  id={`group-${group.id}`}
                  data-group-id={group.id}
                  draggable
                  onDragStart={(e) => handleGroupDragStart(e, group.id)}
                  onDragEnd={handleGroupDragEnd}
                  style={{
                    marginBottom: 12,
                    opacity: groupDraggingId === group.id ? 0.4 : 1,
                    borderTop: groupDragOverId === group.id && groupDragOverId !== groupDraggingId ? "2px solid var(--v2-accent)" : undefined,
                  }}
                >
                  <button onClick={() => toggleGroup(group.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 10,
                    background: "var(--bg-elev)", color: "var(--ink)", textAlign: "left", cursor: "default",
                    fontFamily: "inherit", fontSize: "inherit",
                  }}>
                    <GripVertical size={12} strokeWidth={1.5} style={{ color: "var(--ink-4)", cursor: "grab" }} />
                    <ChevronRight size={13} strokeWidth={1.5} style={{
                      color: "var(--ink-3)",
                      transform: !isCollapsed ? "rotate(90deg)" : "none",
                      transition: "transform 150ms",
                    }} />
                    <span className="mono" style={{
                      fontSize: 11, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase",
                      color: !isCollapsed ? "var(--v2-accent)" : "var(--ink-2)", flex: 1,
                    }}>
                      {group.title}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>({group.notes.length})</span>
                  </button>

                  {!isCollapsed && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {group.notes.map(note => {
                        const isToday = note.task.scheduledDate && format(new Date(note.task.scheduledDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                        return (
                          <div
                            key={note.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, note.id)}
                            onDragOver={(e) => handleDragOver(e, note.id)}
                            onDrop={(e) => handleDrop(e, group.id)}
                            onDragEnd={handleDragEnd}
                            className="card-v2"
                            style={{
                              padding: "10px 14px",
                              borderColor: isToday ? "var(--v2-accent)" : "var(--line-soft)",
                              background: isToday ? "var(--accent-soft)" : "var(--bg-elev)",
                              display: "grid", gridTemplateColumns: "auto auto 1fr auto", gap: 12, alignItems: "center",
                              opacity: draggingId === note.id ? 0.4 : 1,
                              borderTopWidth: dragOverId === note.id && dragOverId !== draggingId ? 2 : 1,
                              borderTopColor: dragOverId === note.id && dragOverId !== draggingId ? "var(--v2-accent)" : undefined,
                            }}
                          >
                            <GripVertical size={12} strokeWidth={1.5} style={{ color: "var(--ink-4)", cursor: "grab" }} />
                            <span style={{
                              width: 18, height: 18, borderRadius: "50%",
                              border: `1.5px solid ${note.task.status === "COMPLETED" ? "var(--v2-success)" : "var(--v2-danger)"}`,
                              background: note.task.status === "COMPLETED" ? "var(--v2-success)" : "transparent",
                              color: note.task.status === "COMPLETED" ? "var(--bg)" : "transparent",
                              display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
                            }}>
                              {note.task.status === "COMPLETED" && <Check size={9} strokeWidth={3} />}
                            </span>
                            <Link href={`/study-notes/${note.id}`} className="flex-1 min-w-0" style={{ textDecoration: "none", color: "inherit" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                                  {note.task.scheduledDate && (
                                    <span className="mono" style={{ color: isToday ? "var(--v2-accent)" : "var(--ink-2)", fontWeight: 500 }}>
                                      {format(new Date(note.task.scheduledDate), "MMM d")}
                                    </span>
                                  )}
                                  <span style={{ color: "var(--ink-4)", margin: "0 6px" }}>&mdash;</span>
                                  {note.title}
                                </span>
                                {note.validated && <Check size={11} strokeWidth={2} style={{ color: "var(--v2-success)" }} />}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-3)", flexWrap: "wrap" }}>
                                {note.task.estimatedMinutes && (
                                  <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <Clock size={10} strokeWidth={1.5} /> {note.task.estimatedMinutes}m
                                  </span>
                                )}
                                {note.task.goal && <span>{note.task.goal.title}</span>}
                                <span className="pill-v2" style={{ color: "var(--v2-danger)", borderColor: "currentColor", background: "transparent", height: 16, fontSize: 9.5 }}>
                                  {note.task.priority}
                                </span>
                                {note._count.flashcards > 0 && (
                                  <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--ink-2)" }}>
                                    <Layers size={10} strokeWidth={1.5} /> {note._count.flashcards} Flashcards
                                  </span>
                                )}
                              </div>
                            </Link>
                            <ChevronRight size={13} strokeWidth={1.5} style={{ color: "var(--ink-3)" }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 18, padding: "12px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
              To add a note, expand any task in the{" "}
              <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>Weekly Plan</span> and{" "}
              <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>Goals</span> pages and click{" "}
              <span className="mono" style={{ color: "var(--v2-accent)" }}>Generate Study Note</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
