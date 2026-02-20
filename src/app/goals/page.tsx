"use client";

import { useEffect, useState, useCallback } from "react";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalEditForm } from "@/components/goals/goal-edit-form";
import { GoalHierarchy } from "@/components/goals/goal-hierarchy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GoalWithRelations } from "@/lib/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithRelations[]>([]);
  const [editingGoal, setEditingGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  // Build hierarchy map for children
  const goalMap = new Map<string, GoalWithRelations>();
  goals.forEach((g) => goalMap.set(g.id, { ...g, children: [] }));
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

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={setEditingGoal} onDelete={handleDelete} />
            ))}
          </div>
          {goals.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No goals yet. Create your first goal to get started!
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
