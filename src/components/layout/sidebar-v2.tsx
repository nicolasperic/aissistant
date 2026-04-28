"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Target, Calendar, CalendarDays,
  MessageSquare, ClipboardCheck, FileText, Layers,
  Award, Trophy, Search, Settings, Flame,
} from "lucide-react";
import { useV2 } from "@/components/layout/v2-context";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutGrid, shortcut: "1", enabled: true },
  { id: "goals", href: "/goals", label: "Goals", icon: Target, shortcut: "2", enabled: true },
  { id: "plan", href: "/weekly-plan", label: "Weekly Plan", icon: Calendar, shortcut: "3", enabled: true },
  { id: "calendar", href: "/calendar", label: "Calendar", icon: CalendarDays, shortcut: "4", enabled: true },
  { id: "events", href: "/events", label: "Events", icon: MessageSquare, shortcut: "5", enabled: true },
  { id: "review", href: "/review", label: "Review", icon: ClipboardCheck, shortcut: "6", enabled: true },
  { id: "notes", href: "/study-notes", label: "Study Notes", icon: FileText, shortcut: "7", enabled: true },
  { id: "flash", href: "/flashcards", label: "Flashcards", icon: Layers, shortcut: "8", enabled: true },
  { id: "certs", href: "/certifications", label: "Certifications", icon: Award, shortcut: "9", enabled: true },
  { id: "rewards", href: "/rewards", label: "Rewards", icon: Trophy, shortcut: "0", enabled: true },
];

export function SidebarV2() {
  const pathname = usePathname();
  const { sidebarVariant } = useV2();
  const isRail = sidebarVariant === "rail";

  return (
    <aside
      className="hidden md:flex md:flex-col overflow-hidden"
      style={{
        gridColumn: 1,
        borderRight: "1px solid var(--line)",
        background: "var(--bg-elev)",
        padding: isRail ? "12px 8px" : "14px 12px",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: isRail ? "6px 0" : "6px 8px",
          marginBottom: 8,
          justifyContent: isRail ? "center" : "flex-start",
        }}
      >
        <div
          className="grid place-items-center shrink-0"
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: "var(--ink)", color: "var(--bg)",
            fontFamily: "var(--font-mono)",
            fontWeight: 700, fontSize: 13, letterSpacing: "-0.05em",
          }}
        >
          A
        </div>
        {!isRail && (
          <div className="flex items-baseline gap-1.5" style={{ lineHeight: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>AIssistant</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>v2</span>
          </div>
        )}
      </div>

      {/* Search button */}
      {!isRail ? (
        <button
          className="btn-v2"
          onClick={() => window.dispatchEvent(new CustomEvent("open-cmd"))}
          style={{
            width: "100%", justifyContent: "space-between",
            background: "var(--bg)", color: "var(--ink-3)",
            marginBottom: 12, height: 32,
          }}
        >
          <span className="flex gap-2 items-center">
            <Search size={14} strokeWidth={1.5} />
            <span style={{ fontSize: 12 }}>Search or run…</span>
          </span>
          <span className="flex gap-1">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
      ) : (
        <button
          className="btn-v2-icon self-center mb-1.5"
          onClick={() => window.dispatchEvent(new CustomEvent("open-cmd"))}
        >
          <Search size={15} strokeWidth={1.5} />
        </button>
      )}

      {/* Section label */}
      {!isRail && <div className="eyebrow" style={{ padding: "10px 8px 6px" }}>Workspace</div>}

      {/* Nav */}
      <nav className="flex flex-col gap-px flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 relative",
                isRail ? "justify-center py-2" : "py-[7px] px-[9px]",
                "rounded-lg border-0 text-[13px] transition-colors duration-75",
                isActive
                  ? "font-medium"
                  : "hover:bg-[var(--hover)]",
                !item.enabled && "pointer-events-none",
              )}
              style={{
                background: isActive ? "var(--selected)" : undefined,
                color: isActive ? "var(--ink)" : item.enabled ? "var(--ink-2)" : "var(--ink-4)",
                fontWeight: isActive ? 500 : 400,
              }}
              title={isRail ? `${item.label}  ⌘${item.shortcut}` : undefined}
            >
              {isActive && !isRail && (
                <div
                  className="absolute"
                  style={{
                    left: -12, top: "50%", transform: "translateY(-50%)",
                    width: 2, height: 16, background: "var(--v2-accent)", borderRadius: 1,
                  }}
                />
              )}
              <item.icon size={15} strokeWidth={1.4} />
              {!isRail && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <span className="kbd" style={{ fontSize: 10 }}>⌘{item.shortcut}</span>}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="mt-auto flex items-center gap-2"
        style={{
          paddingTop: 10,
          borderTop: "1px solid var(--line)",
          flexDirection: isRail ? "column" : "row",
          padding: isRail ? "10px 0 0" : "10px 6px 0",
        }}
      >
        {!isRail ? (
          <>
            <div
              className="grid place-items-center shrink-0"
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--v2-accent), oklch(0.65 0.16 30))",
                color: "var(--accent-ink)",
                fontWeight: 600, fontSize: 12, fontFamily: "var(--font-mono)",
              }}
            >
              N
            </div>
            <div className="min-w-0 flex-1" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>nico</div>
              <div className="mono flex gap-1 items-center" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                <Flame size={10} strokeWidth={1.5} />
                <span>streak</span>
              </div>
            </div>
            <button className="btn-v2-icon" title="Settings">
              <Settings size={14} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <div
            className="grid place-items-center"
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--v2-accent), oklch(0.65 0.16 30))",
              color: "var(--accent-ink)",
              fontWeight: 600, fontSize: 12, fontFamily: "var(--font-mono)",
            }}
          >
            N
          </div>
        )}
      </div>
    </aside>
  );
}
