"use client";

import { useEffect, useState } from "react";
import { PointsDisplay } from "@/components/rewards/points-display";
import { BadgeGrid } from "@/components/rewards/badge-grid";
import { StreakTracker } from "@/components/rewards/streak-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POINTS } from "@/lib/rewards";
import type { BadgeDefinition, Reward, UserStats } from "@/lib/types";
import { TourButton } from "@/components/layout/tour-button";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rewards");
      const data = await res.json();
      setRewards(data.rewards);
      setStats(data.stats);
      setBadges(data.badgeDefinitions);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading rewards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards & Achievements</h1>
          <p className="text-muted-foreground">Track your points, streaks, and badges</p>
        </div>
        <TourButton tourId="rewards" autoStart={false} />
      </div>

      <PointsDisplay
        totalPoints={stats?.totalPoints ?? 0}
        currentStreak={stats?.currentStreak ?? 0}
        longestStreak={stats?.longestStreak ?? 0}
        totalBadges={rewards.filter((r) => r.type === "badge").length}
      />

      <div id="tour-rewards-streak">
        <StreakTracker
          currentStreak={stats?.currentStreak ?? 0}
          longestStreak={stats?.longestStreak ?? 0}
        />
      </div>

      <div id="tour-rewards-badges">
        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <BadgeGrid badges={badges} earned={rewards} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Points Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(POINTS).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="font-medium">+{value} pts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
