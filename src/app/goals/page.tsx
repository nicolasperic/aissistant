"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableGoalCard } from "@/components/goals/sortable-goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalEditForm } from "@/components/goals/goal-edit-form";
import { Plus, Pencil, MoreHorizontal } from "lucide-react";
import { SegmentedControl, LevelChip, ProgressBar } from "@/components/v2/primitives";
import type { GoalWithRelations } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "hierarchy" | "cards" | "table";
type FilterMode = "all" | "yearly" | "quarterly" | "weekly";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [view, setView] = useLocalStorage<ViewMode>("goals-view-v2", "hierarchy");
  const [filter, setFilter] = useLocalStorage<FilterMode>("goals-filter-v2", "all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const filteredGoals = useMemo(() => {
    if (filter === "all") return goals;
    return goals.filter(g => g.type.toLowerCase() === filter);
  }, [goals, filter]);

  const avgProgress = useMemo(() => {
    if (!filteredGoals.length) return 0;
    return Math.round(filteredGoals.reduce((s, g) => s + g.progress, 0) / filteredGoals.length);
  }, [filteredGoals]);

  const subGoalCount = useMemo(() =>
    goals.filter(g => g.parentId).length,
  [goals]);

  const handleCreate = async (data: Record<string, string>) => {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    loadGoals();
  };

  const handleDeleteConfirmed = async () => {
    if (!goalToDelete) return;
    await handleDelete(goalToDelete);
    setGoalToDelete(null);
  };

  const handleEdit = async (data: Record<string, string>) => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id, title: data.title,
        shortName: data.shortName || null,
        description: data.description || null,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        category: data.category || null,
        parentId: data.parentId || null,
      }),
    });
    setEditingGoal(null);
    loadGoals();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredGoals.findIndex((g) => g.id === active.id);
    const newIndex = filteredGoals.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredGoals, oldIndex, newIndex);
    const updates = reordered.map((goal, i) => ({ id: goal.id, position: reordered.length - i }));

    setGoals((prev) => {
      const positionMap = new Map(updates.map((u) => [u.id, u.position]));
      return prev
        .map((g) => (positionMap.has(g.id) ? { ...g, position: positionMap.get(g.id)! } : g))
        .sort((a, b) => b.position - a.position);
    });

    await fetch("/api/goals/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
  };

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading goals...</div>
      </div>
    );
  }

  // Build hierarchy
  const goalMap = new Map<string, GoalWithRelations>();
  filteredGoals.forEach((g) => goalMap.set(g.id, { ...g, children: [] }));
  goalMap.forEach((g) => {
    if (g.parentId && goalMap.has(g.parentId)) {
      goalMap.get(g.parentId)!.children!.push(g);
    }
  });
  const rootGoals = Array.from(goalMap.values()).filter(g => !g.parentId || !goalMap.has(g.parentId));

  return (
    <div className="page-v2 fade-up">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between" style={{
        paddingBottom: "var(--sp-6)", marginBottom: "var(--sp-6)",
        borderBottom: "1px solid var(--line)", gap: "var(--sp-4)",
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em",
            margin: 0, display: "flex", alignItems: "baseline", gap: 10,
          }}>
            Goals <span className="num" style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 400 }}>{goals.length}</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-3)", fontSize: 13 }}>
            Yearly → quarterly → monthly → weekly. Currently tracking{" "}
            <span className="mono" style={{ color: "var(--ink-2)" }}>
              {goals.filter(g => g.progress < 100).length} active
            </span>.
          </p>
        </div>
        <div className="flex gap-2">
          <SegmentedControl
            value={view}
            options={[
              { value: "hierarchy", label: "Hierarchy" },
              { value: "cards", label: "Cards" },
              { value: "table", label: "Table" },
            ]}
            onChange={setView}
          />
          <GoalForm
            parentGoals={goals.filter((g) => g.type !== "WEEKLY")}
            onSubmit={handleCreate}
          />
        </div>
      </div>

      {/* FILTER STRIP */}
      <div className="flex gap-2 items-center" style={{ marginBottom: 18 }}>
        <SegmentedControl
          value={filter}
          options={[
            { value: "all", label: "All" },
            { value: "yearly", label: "Yearly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "weekly", label: "Weekly" },
          ]}
          onChange={setFilter}
        />
        <span className="flex-1" />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          Avg progress: <span style={{ color: "var(--ink)" }}>{avgProgress}%</span> · {subGoalCount} sub-goals
        </span>
      </div>

      {/* VIEWS */}
      {view === "hierarchy" && (
        <HierarchyView
          rootGoals={rootGoals}
          goalMap={goalMap}
          onEdit={setEditingGoal}
        />
      )}
      {view === "cards" && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredGoals.map(g => g.id)} strategy={rectSortingStrategy}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {filteredGoals.map(g => (
                <SortableGoalCard key={g.id} goal={g} onEdit={setEditingGoal} onDelete={setGoalToDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {view === "table" && (
        <TableView goals={filteredGoals} onEdit={setEditingGoal} />
      )}

      {filteredGoals.length === 0 && (
        <div className="text-center" style={{ padding: "48px 0", color: "var(--ink-3)", fontSize: 13 }}>
          {filter !== "all" ? "No goals match this filter." : "No goals yet. Create your first goal to get started!"}
        </div>
      )}

      {editingGoal && (
        <GoalEditForm
          goal={editingGoal}
          parentGoals={goals.filter((g) => g.type !== "WEEKLY")}
          open={!!editingGoal}
          onOpenChange={(open) => { if (!open) setEditingGoal(null); }}
          onSubmit={handleEdit}
        />
      )}

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the goal and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Hierarchy View ─────────────────────────────────────────── */

function HierarchyView({
  rootGoals,
  goalMap,
  onEdit,
}: {
  rootGoals: GoalWithRelations[];
  goalMap: Map<string, GoalWithRelations>;
  onEdit: (g: GoalWithRelations) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {rootGoals.map(g => (
        <HierarchyNode key={g.id} goal={g} depth={0} goalMap={goalMap} onEdit={onEdit} />
      ))}
    </div>
  );
}

function HierarchyNode({
  goal,
  depth,
  goalMap,
  onEdit,
}: {
  goal: GoalWithRelations;
  depth: number;
  goalMap: Map<string, GoalWithRelations>;
  onEdit: (g: GoalWithRelations) => void;
}) {
  const children = goal.children || [];
  const hasProgress = goal.progress > 0;

  return (
    <>
      {depth > 0 && (
        <div style={{ paddingLeft: 24 + depth * 32, height: 12, position: "relative" }}>
          <div style={{
            position: "absolute", left: 24 + (depth - 1) * 32 + 8,
            top: 0, bottom: 0,
            borderLeft: "1px dashed var(--line-strong)",
          }} />
          <div style={{
            position: "absolute", left: 24 + (depth - 1) * 32 + 8,
            top: "50%", width: 24,
            borderTop: "1px dashed var(--line-strong)",
          }} />
        </div>
      )}
      <div className="card-v2" style={{
        marginLeft: depth * 32,
        padding: "14px 18px",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 16, alignItems: "center",
        borderRadius: 12,
      }}>
        <LevelChip level={goal.type} topLevel={depth === 0} />
        <div className="min-w-0">
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <span className="pill-v2" style={{ textTransform: "uppercase" }}>{goal.type.toLowerCase()}</span>
            {goal.category && <span className="pill-v2">{goal.category}</span>}
            {children.length > 0 && (
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>· {children.length} sub-goals</span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 2 }}>{goal.title}</div>
          {goal.description && (
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.45, maxWidth: 720 }}>{goal.description}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5" style={{ minWidth: 160 }}>
          <div className="flex items-baseline gap-1.5">
            <span className="stat-num" style={{ fontSize: 22 }}>{Math.round(goal.progress)}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>%</span>
            <span style={{ width: 6 }} />
            <button className="btn-v2-icon" onClick={() => onEdit(goal)}>
              <MoreHorizontal size={14} strokeWidth={1.5} />
            </button>
          </div>
          <ProgressBar
            value={goal.progress}
            color={hasProgress ? "var(--v2-accent)" : "var(--ink-4)"}
          />
        </div>
      </div>
      {children.map(c => (
        <HierarchyNode key={c.id} goal={c} depth={depth + 1} goalMap={goalMap} onEdit={onEdit} />
      ))}
    </>
  );
}

/* ── Table View ─────────────────────────────────────────────── */

function TableView({
  goals,
  onEdit,
}: {
  goals: GoalWithRelations[];
  onEdit: (g: GoalWithRelations) => void;
}) {
  return (
    <div className="card-v2" style={{ overflow: "hidden" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "32px 1fr 100px 110px 120px 80px",
        padding: "10px 16px",
        borderBottom: "1px solid var(--line)",
        fontSize: 10.5, color: "var(--ink-3)",
        fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".06em",
      }}>
        <span></span>
        <span>Goal</span>
        <span>Tag</span>
        <span>Sub-goals</span>
        <span>Progress</span>
        <span style={{ textAlign: "right" }}>%</span>
      </div>
      {goals.map((g, i) => {
        const childCount = goals.filter(c => c.parentId === g.id).length;
        return (
          <div key={g.id} className="hover:bg-[var(--hover)] cursor-default" onClick={() => onEdit(g)} style={{
            display: "grid", gridTemplateColumns: "32px 1fr 100px 110px 120px 80px",
            padding: "12px 16px", alignItems: "center",
            borderTop: i === 0 ? undefined : "1px solid var(--line-soft)",
            fontSize: 13,
          }}>
            <LevelChip level={g.type} topLevel={false} />
            <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
              {g.title}
            </span>
            <span className="pill-v2" style={{ width: "fit-content" }}>{g.category || "—"}</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{childCount || "—"}</span>
            <ProgressBar value={g.progress} />
            <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>{Math.round(g.progress)}%</span>
          </div>
        );
      })}
    </div>
  );
}
