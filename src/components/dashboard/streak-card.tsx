"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Star } from "lucide-react";

export function StreakCard({
  currentStreak,
  longestStreak,
  totalPoints,
}: {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stats</CardTitle>
        <Trophy className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold">{currentStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 shrink-0 text-yellow-500" />
              <span className="text-2xl font-bold">{totalPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{longestStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">Best</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
