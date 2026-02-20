"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

export function StreakTracker({
  currentStreak,
  longestStreak,
}: {
  currentStreak: number;
  longestStreak: number;
}) {
  // Show last 7 days as dots
  const dots = Array.from({ length: 7 }, (_, i) => i < currentStreak);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <CardTitle className="text-base">Streak Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-2 py-4">
          {dots.reverse().map((active, i) => (
            <div
              key={i}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                active
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {7 - i}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>Current: {currentStreak} days</span>
          <span>Best: {longestStreak} days</span>
        </div>
      </CardContent>
    </Card>
  );
}
