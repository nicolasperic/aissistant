"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronRight, StickyNote } from "lucide-react";
import Link from "next/link";
import type { GoalWithRelations } from "@/lib/types";

const typeColors: Record<string, string> = {
  YEARLY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  QUARTERLY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MONTHLY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  WEEKLY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: GoalWithRelations;
  onEdit?: (goal: GoalWithRelations) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{goal.title}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className={typeColors[goal.type]}>
              {goal.type}
            </Badge>
            {goal.category && (
              <Badge variant="outline">{goal.category}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Link href={`/goals/${goal.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(goal)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(goal.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goal.description && (
          <p className="mb-3 text-sm text-muted-foreground">{goal.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{Math.round(goal.progress)}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          {goal.children && goal.children.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {goal.children.length} sub-goal{goal.children.length !== 1 ? "s" : ""}
            </p>
          )}
          {goal.notes && (
            <span className="flex items-center gap-1 text-xs text-purple-500">
              <StickyNote className="h-3 w-3" />
              Notes
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
