"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GoalCard } from "./goal-card";
import type { GoalWithRelations } from "@/lib/types";

export function SortableGoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: GoalWithRelations;
  onEdit?: (goal: GoalWithRelations) => void;
  onDelete?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GoalCard goal={goal} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
