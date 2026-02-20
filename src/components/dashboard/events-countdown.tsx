"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import type { Event } from "@prisma/client";

function getDaysColor(days: number): string {
  if (days < 14) return "text-red-600 dark:text-red-400 font-bold";
  if (days < 30) return "text-yellow-600 dark:text-yellow-400 font-semibold";
  return "text-green-600 dark:text-green-400";
}

export function EventsCountdown({ events }: { events: Event[] }) {
  const upcoming = events
    .filter((e) => new Date(e.eventDate) >= new Date())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => {
              const days = differenceInCalendarDays(new Date(event.eventDate), new Date());
              return (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.eventDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="ml-2 text-right">
                    <span className={`text-sm ${getDaysColor(days)}`}>
                      {days}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
