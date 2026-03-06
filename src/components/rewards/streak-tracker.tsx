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
  // Sliding window: always show 7 slots ending at the current streak day.
  // For streak ≤ 7 the window is 7→1 with gray slots for days not yet reached.
  // For streak > 7 all 7 slots are active and labeled with real day numbers.
  const WINDOW = 7;
  const windowEnd = Math.max(currentStreak, WINDOW);
  const windowStart = windowEnd - WINDOW + 1;
  const slots = Array.from({ length: WINDOW }, (_, i) => {
    const day = windowEnd - i;
    return { day, active: day <= currentStreak };
  });
  const hasHistory = currentStreak > WINDOW;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <CardTitle className="text-base">Streak Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-1.5 py-4">
          {slots.map(({ day, active }) => (
            <div
              key={day}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                active
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}
          {hasHistory && (
            <div className="flex items-center gap-1 ml-1">
              <span className="text-muted-foreground text-xs tracking-tight">···</span>
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium bg-orange-500 text-white">
                1
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>Current: {currentStreak} days</span>
          <span>Best: {longestStreak} days</span>
        </div>
      </CardContent>
    </Card>
  );
}
