"use client";

import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { Goal } from "@prisma/client";

type GoalFormData = {
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  category: string;
  parentId: string;
};

export function GoalForm({
  parentGoals,
  fixedParentId,
  fixedParentLabel,
  onSubmit,
}: {
  parentGoals?: Goal[];
  fixedParentId?: string;
  fixedParentLabel?: string;
  onSubmit: (data: GoalFormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<GoalFormData>({
    title: "",
    description: "",
    type: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    category: "",
    parentId: fixedParentId ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setForm({
        title: "",
        description: "",
        type: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        category: "",
        parentId: fixedParentId ?? "",
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {fixedParentId ? "Add Sub-Goal" : "New Goal"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          {fixedParentId ? (
            <div className="min-w-0">
              <Label>Parent Goal</Label>
              <Input value={fixedParentLabel ?? fixedParentId} disabled />
            </div>
          ) : parentGoals && parentGoals.length > 0 && (
            <div className="min-w-0">
              <Label>Parent Goal</Label>
              <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                <SelectTrigger className="w-full truncate">
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  {parentGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      [{g.type}] {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
