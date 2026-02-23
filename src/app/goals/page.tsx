"use client";

import { useEffect, useState, useCallback } from "react";
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
import { GoalHierarchy } from "@/components/goals/goal-hierarchy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GoalWithRelations } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useLocalStorage<"all" | "pending">("goals-filter", "all");
  const [goalsTab, setGoalsTab] = useLocalStorage<string>("goals-tab", "cards");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredGoals = filter === "pending" ? goals.filter((g) => g.progress < 100) : goals;

  const loadGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

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

  const handleEdit = async (data: Record<string, string>) => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        title: data.title,
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

    // Stable swap: reuse the position values already assigned to these visible goals
    // (sorted DESC), re-assign them in the new visual order. Hidden goals are unaffected.
    const sortedPositions = [...filteredGoals]
      .map((g) => g.position)
      .sort((a, b) => b - a);

    const updates = reordered.map((goal, i) => ({
      id: goal.id,
      position: sortedPositions[i],
    }));

    // Optimistic update — no reload needed
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  // Build hierarchy map from filtered goals
  const goalMap = new Map<string, GoalWithRelations>();
  filteredGoals.forEach((g) => goalMap.set(g.id, { ...g, children: [] }));
  goalMap.forEach((g) => {
    if (g.parentId && goalMap.has(g.parentId)) {
      goalMap.get(g.parentId)!.children!.push(g);
    }
  });
  const hierarchyGoals = Array.from(goalMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Manage your yearly, quarterly, monthly, and weekly goals</p>
        </div>
        <GoalForm
          parentGoals={goals.filter((g) => g.type !== "WEEKLY")}
          onSubmit={handleCreate}
        />
      </div>

      <Tabs value={goalsTab} onValueChange={setGoalsTab}>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          </TabsList>

          <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => setFilter("all")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all ${
                filter === "pending"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground"
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        <TabsContent value="cards" className="mt-4">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredGoals.map((g) => g.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGoals.map((goal) => (
                  <SortableGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={setEditingGoal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {filteredGoals.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {filter === "pending"
                ? "All goals are complete. Great work!"
                : "No goals yet. Create your first goal to get started!"}
            </p>
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-4">
          <GoalHierarchy goals={hierarchyGoals} />
        </TabsContent>
      </Tabs>

      {editingGoal && (
        <GoalEditForm
          goal={editingGoal}
          parentGoals={goals.filter((g) => g.type !== "WEEKLY")}
          open={!!editingGoal}
          onOpenChange={(open) => { if (!open) setEditingGoal(null); }}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
