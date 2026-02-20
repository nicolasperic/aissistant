"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Calendar } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import type { Event } from "@prisma/client";

function getDaysColor(days: number): string {
  if (days < 14) return "text-red-600 dark:text-red-400";
  if (days < 30) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function getDaysBg(days: number): string {
  if (days < 14) return "bg-red-50 dark:bg-red-950";
  if (days < 30) return "bg-yellow-50 dark:bg-yellow-950";
  return "bg-green-50 dark:bg-green-950";
}

export function EventCard({
  event,
  onDelete,
}: {
  event: Event;
  onDelete?: (id: string) => void;
}) {
  const daysRemaining = differenceInCalendarDays(new Date(event.eventDate), new Date());
  const isPast = daysRemaining < 0;

  return (
    <Card className={`transition-shadow hover:shadow-md ${isPast ? "opacity-60" : ""}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg ${getDaysBg(daysRemaining)}`}>
          <span className={`text-xl font-bold ${getDaysColor(daysRemaining)}`}>
            {isPast ? "-" : daysRemaining}
          </span>
          <span className="text-xs text-muted-foreground">
            {isPast ? "past" : "days"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{event.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(event.eventDate), "MMM d, yyyy")}
            </span>
            {event.category && (
              <Badge variant="outline" className="text-xs">
                {event.category}
              </Badge>
            )}
          </div>
          {event.description && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
