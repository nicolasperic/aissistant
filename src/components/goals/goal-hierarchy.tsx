"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import type { GoalWithRelations } from "@/lib/types";

function GoalNode({ goal, level = 0 }: { goal: GoalWithRelations; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = goal.children && goal.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 transition-colors"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link href={`/goals/${goal.id}`} className="flex flex-1 items-center gap-3 min-w-0">
          <Badge variant="outline" className="shrink-0 text-xs">
            {goal.type.charAt(0)}
          </Badge>
          <span className="truncate text-sm font-medium">{goal.title}</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Progress value={goal.progress} className="h-1.5 w-20" />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(goal.progress)}%
            </span>
          </div>
        </Link>
      </div>
      {expanded && hasChildren && (
        <div>
          {goal.children!.map((child) => (
            <GoalNode key={child.id} goal={child as GoalWithRelations} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalHierarchy({ goals }: { goals: GoalWithRelations[] }) {
  const topLevel = goals.filter((g) => !g.parentId);

  if (topLevel.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No goals yet. Create your first goal to get started!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {topLevel.map((goal) => (
        <GoalNode key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
