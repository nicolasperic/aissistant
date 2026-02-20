"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BadgeDefinition, Reward } from "@/lib/types";

export function BadgeGrid({
  badges,
  earned,
}: {
  badges: BadgeDefinition[];
  earned: Reward[];
}) {
  const earnedNames = new Set(earned.map((e) => e.name));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {badges.map((badge) => {
        const isEarned = earnedNames.has(badge.name);
        return (
          <Card
            key={badge.id}
            className={cn(
              "text-center transition-all",
              isEarned ? "border-primary/50 shadow-sm" : "opacity-40 grayscale"
            )}
          >
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <span className="text-3xl">{badge.icon}</span>
              <p className="text-sm font-medium">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
