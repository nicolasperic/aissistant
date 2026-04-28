"use client";

import { useState } from "react";
import { Sun, Moon, Settings, BookOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { TourSticky } from "@/components/v2/tour-sticky";

export function TopBar() {
  const { setTheme } = useTheme();
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between"
        style={{
          padding: "10px 32px",
          background: "var(--bg)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        {/* Left: session info */}
        <div className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--ink-3)" }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="mono" style={{ letterSpacing: ".04em" }}>session active</span>
          </span>
          <span style={{ color: "var(--ink-4)" }}>&middot;</span>
          <span className="mono" style={{ letterSpacing: ".04em" }}>streak</span>
        </div>

        {/* Right: tour + theme + settings */}
        <div className="flex gap-1 items-center">
          <button
            className="btn-v2 btn-v2-sm"
            onClick={() => setTourOpen(true)}
            style={{ marginRight: 4 }}
          >
            <BookOpen size={12} strokeWidth={1.5} />
            Tour
          </button>
          <button
            className="btn-v2-icon relative"
            onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun size={14} strokeWidth={1.5} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon size={14} strokeWidth={1.5} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
          <button className="btn-v2-icon">
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {tourOpen && <TourSticky onClose={() => setTourOpen(false)} />}
    </>
  );
}
