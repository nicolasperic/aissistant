"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import type { Goal } from "@prisma/client";
import type { GoalWithRelations } from "@/lib/types";

type GoalEditData = {
  id: string;
  title: string;
  shortName: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  category: string;
  parentId: string;
};

export function GoalEditForm({
  goal,
  parentGoals,
  open,
  onOpenChange,
  onSubmit,
}: {
  goal: GoalWithRelations;
  parentGoals?: Goal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalEditData) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<GoalEditData>({
    id: goal.id,
    title: goal.title,
    shortName: goal.shortName || "",
    description: goal.description || "",
    type: goal.type,
    startDate: new Date(goal.startDate).toISOString().split("T")[0],
    endDate: new Date(goal.endDate).toISOString().split("T")[0],
    category: goal.category || "",
    parentId: goal.parentId || "",
  });

  useEffect(() => {
    setForm({
      id: goal.id,
      title: goal.title,
      shortName: goal.shortName || "",
      description: goal.description || "",
      type: goal.type,
      startDate: new Date(goal.startDate).toISOString().split("T")[0],
      endDate: new Date(goal.endDate).toISOString().split("T")[0],
      category: goal.category || "",
      parentId: goal.parentId || "",
    });
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // Exclude the goal itself and its children from possible parents
  const availableParents = parentGoals?.filter(
    (g) => g.id !== goal.id && g.type !== "WEEKLY"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          <div>
            <Label htmlFor="edit-goal-title">Title</Label>
            <Input
              id="edit-goal-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-goal-shortname">Short Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="edit-goal-shortname"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              placeholder="e.g. Front-End Expert"
            />
          </div>
          <div>
            <Label htmlFor="edit-goal-desc">Description</Label>
            <Textarea
              id="edit-goal-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-goal-start">Start Date</Label>
              <Input
                id="edit-goal-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-goal-end">End Date</Label>
              <Input
                id="edit-goal-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          {availableParents && availableParents.length > 0 && (
            <div className="min-w-0">
              <Label>Parent Goal</Label>
              <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                <SelectTrigger className="w-full truncate">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      [{g.type}] {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
