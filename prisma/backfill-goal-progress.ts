/**
 * Backfill script: recalculates and updates progress for all goals based on task completion.
 *
 * Run with: npx ts-node prisma/backfill-goal-progress.ts
 *
 * Strategy:
 *  1. Find all leaf goals (no children) — their progress = completed tasks / total tasks
 *  2. recalculateGoalProgress() already walks up the tree, so running it on every
 *     leaf goal propagates progress to every parent automatically.
 *  3. Print a before/after summary for each updated goal.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function recalculateGoalProgress(goalId: string): Promise<void> {
  const goal = await prisma.goal.findUnique({
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
    newProgress =
      goal.children.reduce((sum, c) => sum + c.progress, 0) / goal.children.length;
  } else {
    const total = goal.tasks.length;
    newProgress =
      total === 0
        ? 0
        : (goal.tasks.filter((t) => t.status === "COMPLETED").length / total) * 100;
  }

  newProgress = Math.round(newProgress * 100) / 100;

  await prisma.goal.update({
    where: { id: goalId },
    data: { progress: newProgress },
  });

  if (goal.parentId) {
    await recalculateGoalProgress(goal.parentId);
  }
}

async function main() {
  // Fetch all goals with a before-snapshot for the summary
  const allGoals = await prisma.goal.findMany({
    select: { id: true, title: true, type: true, progress: true, _count: { select: { children: true } } },
    orderBy: { createdAt: "asc" },
  });

  const before = new Map(allGoals.map((g) => [g.id, g.progress]));

  // Only process leaf goals — recalculate propagates upward automatically
  const leafGoalIds = allGoals.filter((g) => g._count.children === 0).map((g) => g.id);

  console.log(`Found ${allGoals.length} goals total, ${leafGoalIds.length} leaf goals to process.\n`);

  for (const id of leafGoalIds) {
    await recalculateGoalProgress(id);
  }

  // Fetch updated values and print summary
  const updated = await prisma.goal.findMany({
    select: { id: true, title: true, type: true, progress: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("Goal progress update summary:");
  console.log("─".repeat(72));

  let changed = 0;
  for (const g of updated) {
    const prev = before.get(g.id) ?? 0;
    const diff = g.progress - prev;
    const marker = diff !== 0 ? (diff > 0 ? "▲" : "▼") : " ";
    const diffStr = diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff.toFixed(1)}%)` : "";
    console.log(
      `${marker} [${g.type.padEnd(9)}] ${g.title.slice(0, 40).padEnd(40)} ${prev.toFixed(1).padStart(6)}% → ${g.progress.toFixed(1).padStart(6)}%${diffStr}`
    );
    if (diff !== 0) changed++;
  }

  console.log("─".repeat(72));
  console.log(`\n✓ Done. ${changed} goal(s) updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
