"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, Target, Calendar, Trophy, Sparkles,
  Plus, Play, ClipboardCheck, Search,
} from "lucide-react";

interface CmdItem {
  kind: "nav" | "ai" | "action";
  icon: typeof LayoutGrid;
  label: string;
  href?: string;
  shortcut?: string;
}

const ITEMS: CmdItem[] = [
  { kind: "nav", icon: LayoutGrid, label: "Go to Dashboard", href: "/", shortcut: "G D" },
  { kind: "nav", icon: Target, label: "Go to Goals", href: "/goals", shortcut: "G G" },
  { kind: "nav", icon: Calendar, label: "Go to Weekly Plan", href: "/weekly-plan", shortcut: "G P" },
  { kind: "nav", icon: Trophy, label: "Go to Rewards", href: "/rewards", shortcut: "G R" },
  { kind: "ai", icon: Sparkles, label: "Ask AI: \"What should I focus on today?\"" },
  { kind: "ai", icon: Sparkles, label: "Ask AI: \"Generate next week's plan from open goals\"" },
  { kind: "ai", icon: Sparkles, label: "Ask AI: \"Summarize what I learned this week\"" },
  { kind: "action", icon: Plus, label: "New goal", shortcut: "N G" },
  { kind: "action", icon: Plus, label: "New task", shortcut: "N T" },
  { kind: "action", icon: Play, label: "Start focus session", shortcut: "F" },
  { kind: "action", icon: ClipboardCheck, label: "Begin weekly review" },
];

const SECTION_LABELS: Record<string, string> = {
  nav: "Navigate",
  ai: "Ask AI",
  action: "Actions",
};

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape" && open) close();
    }
    function onOpen() { setOpen(true); }

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmd", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-cmd", onOpen);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = query
    ? ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : ITEMS;

  function handleSelect(item: CmdItem) {
    if (item.href) router.push(item.href);
    close();
  }

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[60] flex items-start justify-center"
      style={{
        background: "rgba(0,0,0,.4)",
        backdropFilter: "blur(4px)",
        paddingTop: "16vh",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-up"
        style={{
          width: 580, maxWidth: "92vw",
          background: "var(--bg-elev)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2.5"
          style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}
        >
          <Search size={15} strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command, search goals, or ask AI…"
            className="flex-1 bg-transparent border-0 outline-none"
            style={{ fontSize: 14, color: "var(--ink)" }}
          />
          <span className="kbd">esc</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 ? (
            <div className="text-center" style={{ padding: 30, color: "var(--ink-3)", fontSize: 13 }}>
              No results. Try <span className="kbd">⏎</span> to ask AI directly.
            </div>
          ) : (
            (["nav", "ai", "action"] as const).map(kind => {
              const items = filtered.filter(i => i.kind === kind);
              if (!items.length) return null;
              return (
                <div key={kind} style={{ marginBottom: 4 }}>
                  <div className="eyebrow" style={{ padding: "8px 10px 4px", fontSize: 9.5 }}>
                    {SECTION_LABELS[kind]}
                  </div>
                  {items.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(it)}
                      className="w-full flex items-center gap-2.5 text-left rounded-lg transition-colors duration-75 hover:bg-[var(--hover)]"
                      style={{
                        padding: "8px 10px",
                        background: "transparent",
                        border: 0,
                        color: "var(--ink)",
                        fontSize: 13,
                        cursor: "default",
                      }}
                    >
                      <span
                        className="grid place-items-center shrink-0"
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          background: kind === "ai" ? "var(--accent-soft)" : "var(--bg-elev-2)",
                          color: kind === "ai" ? "var(--v2-accent)" : "var(--ink-2)",
                        }}
                      >
                        <it.icon size={13} strokeWidth={1.5} />
                      </span>
                      <span className="flex-1">{it.label}</span>
                      {it.shortcut && <span className="kbd">{it.shortcut}</span>}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--line)",
            background: "var(--bg)",
            fontSize: 11,
            color: "var(--ink-3)",
          }}
        >
          <span className="flex gap-3">
            <span className="inline-flex gap-1 items-center">
              <span className="kbd">↵</span> select
            </span>
            <span className="inline-flex gap-1 items-center">
              <span className="kbd">↑</span><span className="kbd">↓</span> navigate
            </span>
          </span>
          <span className="inline-flex gap-1 items-center">
            <Sparkles size={11} strokeWidth={1.5} />
            <span>powered by claude</span>
          </span>
        </div>
      </div>
    </div>
  );
}
