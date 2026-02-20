"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ListTodo } from "lucide-react";

export function WeeklyOverview({
  completedTasks,
  totalTasks,
}: {
  completedTasks: number;
  totalTasks: number;
}) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
        <ListTodo className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{completionRate}%</div>
        <Progress value={completionRate} className="mt-2 h-2" />
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            {completedTasks} done
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3" />
            {totalTasks - completedTasks} remaining
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
