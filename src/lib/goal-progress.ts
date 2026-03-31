import { db } from "./db";

/**
 * Recalculates a goal's progress based on its tasks (leaf) or children (parent),
 * then recurses up the hierarchy until the root is reached.
 *
 * Leaf goal  → progress = completed tasks / total tasks × 100
 * Parent goal → progress = mean of direct children's progress
 */
export async function recalculateGoalProgress(goalId: string): Promise<void> {
  const goal = await db.goal.findUnique({
    where: { id: goalId },
    select: {
      parentId: true,
      children: { select: { progress: true } },
      tasks: { select: { status: true } },
    },
  });

  if (!goal) return;

  let newProgress: number;

  if (goal.children.length > 0) {
    // Non-leaf: average of direct children's progress
    newProgress =
      goal.children.reduce((sum, c) => sum + c.progress, 0) / goal.children.length;
  } else {
    // Leaf: task completion rate
    const total = goal.tasks.length;
    newProgress =
      total === 0
        ? 0
        : (goal.tasks.filter((t) => t.status === "COMPLETED").length / total) * 100;
  }

  newProgress = Math.round(newProgress * 100) / 100;

  await db.goal.update({
    where: { id: goalId },
    data: { progress: newProgress },
  });

  // Recurse up to parent
  if (goal.parentId) {
    await recalculateGoalProgress(goal.parentId);
  }
}
