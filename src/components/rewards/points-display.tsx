"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Star, Zap } from "lucide-react";

export function PointsDisplay({
  totalPoints,
  currentStreak,
  longestStreak,
  totalBadges,
}: {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalBadges: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-1 p-6">
          <Star className="h-8 w-8 text-yellow-500" />
          <span className="text-3xl font-bold">{totalPoints}</span>
          <span className="text-sm text-muted-foreground">Total Points</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center gap-1 p-6">
          <Flame className="h-8 w-8 text-orange-500" />
          <span className="text-3xl font-bold">{currentStreak}</span>
          <span className="text-sm text-muted-foreground">Day Streak</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center gap-1 p-6">
          <Trophy className="h-8 w-8 text-purple-500" />
          <span className="text-3xl font-bold">{longestStreak}</span>
          <span className="text-sm text-muted-foreground">Best Streak</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center gap-1 p-6">
          <Zap className="h-8 w-8 text-blue-500" />
          <span className="text-3xl font-bold">{totalBadges}</span>
          <span className="text-sm text-muted-foreground">Badges</span>
        </CardContent>
      </Card>
    </div>
  );
}
