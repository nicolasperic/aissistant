"use client";

import { useEffect, useState, useCallback } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventForm } from "@/components/events/event-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Event } from "@prisma/client";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async (data: Record<string, string>) => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    loadEvents();
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditOpen(true);
  };

  const handleEditSubmit = async (data: Record<string, string>) => {
    await fetch("/api/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingEvent!.id, ...data }),
    });
    loadEvents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.eventDate) >= now);
  const past = events.filter((e) => new Date(e.eventDate) < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events & Certifications</h1>
          <p className="text-muted-foreground">Track upcoming exams, deadlines, and milestones</p>
        </div>
        <EventForm onSubmit={handleCreate} />
        <EventForm
          onSubmit={handleEditSubmit}
          open={editOpen}
          onOpenChange={setEditOpen}
          initialData={editingEvent}
        />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No upcoming events. Add your certification exam dates!
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No past events</p>
          ) : (
            <div className="space-y-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
