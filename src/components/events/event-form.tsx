"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@prisma/client";

type EventFormData = {
  title: string;
  description: string;
  eventDate: string;
  category: string;
  url: string;
};

const DEFAULT_FORM: EventFormData = {
  title: "",
  description: "",
  eventDate: "",
  category: "certification",
  url: "",
};

export function EventForm({
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialData,
}: {
  onSubmit: (data: EventFormData) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Event | null;
}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EventFormData>(DEFAULT_FORM);

  const isOpen = isControlled ? controlledOpen! : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description ?? "",
        eventDate: format(new Date(initialData.eventDate), "yyyy-MM-dd"),
        category: initialData.category ?? "certification",
        url: initialData.url ?? "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="event-desc">Description</Label>
            <Textarea
              id="event-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="event-url">URL (optional)</Label>
            <Input
              id="event-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isEditing ? "Saving..." : "Creating..."
              : isEditing ? "Save Changes" : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
