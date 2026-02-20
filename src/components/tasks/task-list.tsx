"use client";

import { TaskItem } from "./task-item";
import type { TaskWithGoal } from "@/lib/types";

export function TaskList({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  emptyMessage = "No tasks yet",
}: {
  tasks: TaskWithGoal[];
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (task: TaskWithGoal) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}) {
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
