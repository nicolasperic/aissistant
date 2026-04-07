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
import { TourButton } from "@/components/layout/tour-button";
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

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
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
        id: data.id,
        title: data.title,
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

    // Assign fresh sequential positions (highest = first) so duplicates never cause stale swaps.
    // Hidden goals (pending filter) are not included in updates and keep their own positions.
    const updates = reordered.map((goal, i) => ({
      id: goal.id,
      position: reordered.length - i,
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
        <div className="flex items-center gap-2">
          <TourButton tourId="goals" autoStart={goals.length === 0} />
          <div id="tour-goal-create">
            <GoalForm
              parentGoals={goals.filter((g) => g.type !== "WEEKLY")}
              onSubmit={handleCreate}
            />
          </div>
        </div>
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
              <div id="tour-goals-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGoals.map((goal) => (
                  <SortableGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={setEditingGoal}
                    onDelete={setGoalToDelete}
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

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the goal and all its associated data. This action cannot be undone.
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
