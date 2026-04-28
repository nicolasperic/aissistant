"use client";

import { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore, type ReactNode } from "react";

export type AccentPreset = "amber" | "emerald" | "indigo" | "magenta" | "cyan";
export type Density = "compact" | "regular" | "comfy";
export type SidebarVariant = "full" | "rail";

const ACCENT_MAP: Record<AccentPreset, { h: number; c: number }> = {
  amber:   { h: 60,  c: 0.14 },
  emerald: { h: 155, c: 0.14 },
  indigo:  { h: 265, c: 0.13 },
  magenta: { h: 340, c: 0.14 },
  cyan:    { h: 220, c: 0.10 },
};

interface V2Settings {
  accent: AccentPreset;
  density: Density;
  sidebarVariant: SidebarVariant;
  showGrid: boolean;
}

interface V2ContextValue extends V2Settings {
  setAccent: (v: AccentPreset) => void;
  setDensity: (v: Density) => void;
  setSidebarVariant: (v: SidebarVariant) => void;
  setShowGrid: (v: boolean) => void;
}

const defaults: V2Settings = {
  accent: "amber",
  density: "regular",
  sidebarVariant: "full",
  showGrid: true,
};

const V2Context = createContext<V2ContextValue | null>(null);

const STORAGE_KEY = "aissistant:v2";

function save(s: V2Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function V2Provider({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [settings, setSettings] = useState<V2Settings>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  });

  // Apply accent CSS vars + density attr to root
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const a = ACCENT_MAP[settings.accent] || ACCENT_MAP.amber;
    root.style.setProperty("--accent-h", String(a.h));
    root.style.setProperty("--accent-c", String(a.c));
    root.setAttribute("data-density", settings.density);
    save(settings);
  }, [settings, mounted]);

  const update = useCallback((patch: Partial<V2Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const value: V2ContextValue = {
    ...settings,
    setAccent: (v) => update({ accent: v }),
    setDensity: (v) => update({ density: v }),
    setSidebarVariant: (v) => update({ sidebarVariant: v }),
    setShowGrid: (v) => update({ showGrid: v }),
  };

  return <V2Context.Provider value={value}>{children}</V2Context.Provider>;
}

export function useV2() {
  const ctx = useContext(V2Context);
  if (!ctx) throw new Error("useV2 must be used within V2Provider");
  return ctx;
}
