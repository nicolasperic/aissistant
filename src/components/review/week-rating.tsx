"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeekRating({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
