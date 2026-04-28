"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { EventForm } from "@/components/events/event-form";
import { Plus, Filter, Pencil, Trash2, Check, Clock, MapPin, MoreHorizontal } from "lucide-react";
import { SegmentedControl } from "@/components/v2/primitives";
import type { Event } from "@prisma/client";
import { format, differenceInCalendarDays } from "date-fns";

/* ── Urgency tokens ───────────────────────────────────────── */
const URGENCY_TOKENS = {
  danger: {
    color: "var(--v2-danger)",
    bg: "oklch(from var(--v2-danger) l c h / 0.14)",
    bgStrong: "oklch(from var(--v2-danger) l c h / 0.20)",
    line: "oklch(from var(--v2-danger) l c h / 0.40)",
    label: "Too close",
    sub: "≤ 7 days",
  },
  warn: {
    color: "var(--v2-warn)",
    bg: "oklch(from var(--v2-warn) l c h / 0.13)",
    bgStrong: "oklch(from var(--v2-warn) l c h / 0.20)",
    line: "oklch(from var(--v2-warn) l c h / 0.38)",
    label: "Approaching",
    sub: "8–30 days",
  },
  green: {
    color: "var(--v2-success)",
    bg: "oklch(from var(--v2-success) l c h / 0.12)",
    bgStrong: "oklch(from var(--v2-success) l c h / 0.18)",
    line: "oklch(from var(--v2-success) l c h / 0.36)",
    label: "Plenty of time",
    sub: "> 30 days",
  },
} as const;

type UrgencyKey = keyof typeof URGENCY_TOKENS;

function urgencyOf(days: number): UrgencyKey {
  if (days <= 7) return "danger";
  if (days <= 30) return "warn";
  return "green";
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    setEvents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async (data: Record<string, string>) => {
    await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    loadEvents();
  };

  const handleEdit = (event: Event) => { setEditingEvent(event); setEditOpen(true); };

  const handleEditSubmit = async (data: Record<string, string>) => {
    await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingEvent!.id, ...data }) });
    loadEvents();
  };

  const now = new Date();
  const upcoming = useMemo(() =>
    events.filter(e => new Date(e.eventDate) >= now).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    [events]
  );
  const past = useMemo(() =>
    events.filter(e => new Date(e.eventDate) < now).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [events]
  );

  // Group upcoming by urgency
  const grouped = useMemo(() => {
    const g: Record<UrgencyKey, (Event & { days: number })[]> = { danger: [], warn: [], green: [] };
    upcoming.forEach(e => {
      const days = differenceInCalendarDays(new Date(e.eventDate), now);
      g[urgencyOf(days)].push({ ...e, days });
    });
    return g;
  }, [upcoming]);

  const counts = { danger: grouped.danger.length, warn: grouped.warn.length, green: grouped.green.length };
  const total = counts.danger + counts.warn + counts.green;

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="page-v2 fade-up">
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2">
            Events
            <span className="num">{total} upcoming</span>
          </h1>
          <p className="page-sub-v2">
            Track upcoming exams, deadlines, and milestones across your certification path.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <EventForm onSubmit={handleCreate} />
          <EventForm
            onSubmit={handleEditSubmit}
            open={editOpen}
            onOpenChange={setEditOpen}
            initialData={editingEvent}
          />
        </div>
      </div>

      {/* URGENCY OVERVIEW — three traffic-light cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {(["danger", "warn", "green"] as const).map(k => {
          const tk = URGENCY_TOKENS[k];
          const next = grouped[k][0];
          return (
            <div key={k} className="card-v2" style={{
              padding: "16px 18px", borderColor: tk.line,
              background: tk.bg, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 2, borderRadius: 2, background: tk.color }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 500, color: tk.color,
                    fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".07em",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: tk.color, boxShadow: `0 0 0 3px ${tk.bgStrong}` }} />
                    {tk.label}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 3 }}>{tk.sub}</div>
                </div>
                <div className="mono" style={{
                  fontSize: 28, fontWeight: 500, lineHeight: 1,
                  color: counts[k] > 0 ? tk.color : "var(--ink-4)", letterSpacing: "-0.02em",
                }}>{counts[k]}</div>
              </div>
              {next ? (
                <div style={{ paddingTop: 10, borderTop: `1px solid ${tk.line}`, fontSize: 12 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Next</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{next.title}</span>
                    <span className="mono" style={{ fontSize: 11, color: tk.color, flex: "none" }}>{next.days}d</span>
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: 10, borderTop: `1px solid ${tk.line}`, fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>None scheduled</div>
              )}
            </div>
          );
        })}
      </div>

      {/* TIMELINE BAR */}
      {upcoming.length > 0 && <UrgencyTimeline events={grouped} />}

      {/* TABS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 14 }}>
        <SegmentedControl
          value={tab}
          options={[
            { value: "upcoming", label: `Upcoming (${upcoming.length})` },
            { value: "past", label: `Past (${past.length})` },
          ]}
          onChange={setTab}
        />
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          sorted by {tab === "upcoming" ? "soonest" : "most recent"}
        </span>
      </div>

      {/* LIST */}
      {tab === "upcoming" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {(["danger", "warn", "green"] as const).map(k => {
            if (!grouped[k].length) return null;
            const tk = URGENCY_TOKENS[k];
            return (
              <div key={k}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tk.color }} />
                  <span className="eyebrow" style={{ color: tk.color }}>{tk.label}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{grouped[k].length} · {tk.sub}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--line-soft)", marginLeft: 4 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grouped[k].map(e => (
                    <EventRow key={e.id} event={e} days={e.days} urgency={k} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {past.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No past events</div>
          ) : past.map(e => (
            <PastEventRow key={e.id} event={e} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Urgency Timeline ──────────────────────────────────────── */
function UrgencyTimeline({ events }: { events: Record<UrgencyKey, (Event & { days: number })[]> }) {
  const allEvents = [...events.danger, ...events.warn, ...events.green];
  if (!allEvents.length) return null;
  const max = Math.max(...allEvents.map(e => e.days), 100);
  const ticks = [7, 30, 60, max].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="card-v2" style={{ padding: "18px 20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div className="eyebrow">Runway · next {max} days</div>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          today → {format(new Date(allEvents[allEvents.length - 1]?.eventDate), "MMM d")}
        </span>
      </div>
      <div style={{ position: "relative", height: 60 }}>
        {/* Bands */}
        <div style={{ position: "absolute", inset: 0, display: "flex", borderRadius: 6, overflow: "hidden", height: 16 }}>
          <div style={{ width: `${(7 / max) * 100}%`, background: URGENCY_TOKENS.danger.bg, borderRight: `1px dashed ${URGENCY_TOKENS.danger.line}` }} />
          <div style={{ width: `${((30 - 7) / max) * 100}%`, background: URGENCY_TOKENS.warn.bg, borderRight: `1px dashed ${URGENCY_TOKENS.warn.line}` }} />
          <div style={{ flex: 1, background: URGENCY_TOKENS.green.bg }} />
        </div>
        {/* Tick labels */}
        {ticks.map((t, i) => (
          <div key={t} className="mono" style={{
            position: "absolute", left: `calc(${(t / max) * 100}% - 8px)`, top: 20,
            fontSize: 10, color: "var(--ink-3)",
            transform: i === ticks.length - 1 ? "translateX(-100%)" : "none",
          }}>
            {t}d
          </div>
        ))}
        {/* Event markers */}
        {allEvents.map(e => {
          const tk = URGENCY_TOKENS[urgencyOf(e.days)];
          return (
            <div key={e.id} title={`${e.title} · ${e.days} days`} style={{
              position: "absolute", left: `${(e.days / max) * 100}%`, top: 36,
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: "50%",
                background: tk.color, boxShadow: `0 0 0 3px var(--bg-elev), 0 0 0 4px ${tk.line}`,
              }} />
              <span className="mono" style={{ fontSize: 9.5, color: tk.color, fontWeight: 500 }}>{e.days}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Event Row (upcoming) ──────────────────────────────────── */
function EventRow({ event, days, urgency, onEdit, onDelete }: {
  event: Event; days: number; urgency: UrgencyKey;
  onEdit: () => void; onDelete: () => void;
}) {
  const tk = URGENCY_TOKENS[urgency];
  const d = new Date(event.eventDate);
  const monStr = format(d, "MMM").toUpperCase();
  const dayNum = d.getDate();

  return (
    <div className="card-v2" style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto auto",
      alignItems: "center", gap: 18, padding: "14px 18px 14px 14px",
    }}>
      {/* Date tile */}
      <div style={{
        width: 56, padding: "10px 0", textAlign: "center",
        background: tk.bg, border: `1px solid ${tk.line}`,
        borderRadius: 10, color: tk.color,
      }}>
        <div className="mono" style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".08em", lineHeight: 1, opacity: 0.85 }}>{monStr}</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.05, marginTop: 4, letterSpacing: "-0.02em" }}>{dayNum}</div>
        <div className="mono" style={{ fontSize: 9, opacity: 0.75, marginTop: 3, letterSpacing: ".06em" }}>{days}D</div>
      </div>

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="pill-v2" style={{ color: tk.color, borderColor: tk.line, background: tk.bg }}>
            {event.category || "event"}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{format(d, "MMM d, yyyy")}</span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>{event.title}</div>
        {event.description && (
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{event.description}</div>
        )}
      </div>

      {/* Days remaining */}
      <div style={{ textAlign: "right", paddingRight: 4 }}>
        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: tk.color, lineHeight: 1, letterSpacing: "-0.02em" }}>{days}</div>
        <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 3, letterSpacing: ".06em" }}>DAYS LEFT</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 2 }}>
        <button className="btn-v2-icon" onClick={onEdit} title="Edit"><Pencil size={13} strokeWidth={1.5} /></button>
        <button className="btn-v2-icon" onClick={onDelete} title="Delete"><Trash2 size={13} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}

/* ── Past Event Row ───────────────────────────────────────── */
function PastEventRow({ event, onEdit, onDelete }: { event: Event; onEdit: () => void; onDelete: () => void }) {
  const d = new Date(event.eventDate);
  const monStr = format(d, "MMM").toUpperCase();
  const dayNum = d.getDate();

  return (
    <div className="card-v2" style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto",
      alignItems: "center", gap: 18, padding: "12px 18px 12px 14px",
      borderColor: "var(--line-soft)", opacity: 0.92,
    }}>
      <div style={{
        width: 56, padding: "8px 0", textAlign: "center",
        background: "var(--bg-elev-2)", border: "1px solid var(--line-soft)",
        borderRadius: 10, color: "var(--ink-3)",
      }}>
        <div className="mono" style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: ".08em", lineHeight: 1 }}>{monStr}</div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.05, marginTop: 4, color: "var(--ink-2)" }}>{dayNum}</div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span className="pill-v2">{event.category || "event"}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{format(d, "MMM d, yyyy")}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>{event.title}</div>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        <button className="btn-v2-icon" onClick={onEdit}><Pencil size={13} strokeWidth={1.5} /></button>
        <button className="btn-v2-icon" onClick={onDelete}><Trash2 size={13} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}
