"use client";

import { useId } from "react";
import { Check } from "lucide-react";

/* ── Sparkline ─────────────────────────────────────────────── */
export function Sparkline({
  data,
  w = 120,
  h = 30,
  strokeWidth = 1.5,
  accent = true,
}: {
  data: number[];
  w?: number;
  h?: number;
  strokeWidth?: number;
  accent?: boolean;
}) {
  const id = useId();
  if (!data?.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1 || 1);
  const points = data.map((v, i) => [i * stepX, h - ((v - min) / range) * h] as const);
  const path = points.reduce((p, [x, y], i) => p + (i === 0 ? `M${x},${y}` : ` L${x},${y}`), "");
  const areaPath = path + ` L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];
  const color = accent ? "var(--v2-accent)" : "var(--ink-2)";

  return (
    <svg className="block overflow-visible" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}

/* ── Donut ring ──────────────���──────────────────────���──────── */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--line)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--v2-accent)" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <div className="num" style={{ fontSize: size > 80 ? 22 : 16, fontWeight: 600, lineHeight: 1 }}>
          {value}<span style={{ fontSize: 10, color: "var(--ink-3)" }}>%</span>
        </div>
        {sub && (
          <div className="mono" style={{
            fontSize: 9, color: "var(--ink-3)", marginTop: 2,
            letterSpacing: ".05em", textTransform: "uppercase",
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Goal level tag ────────────────────────────────────────── */
export function LevelTag({ level, size = 18 }: { level: string; size?: number }) {
  const letter = level === "YEARLY" || level === "yearly" ? "Y"
    : level === "QUARTERLY" || level === "quarterly" ? "Q"
    : level === "MONTHLY" || level === "monthly" ? "M"
    : level === "WEEKLY" || level === "weekly" ? "W"
    : level.charAt(0).toUpperCase();

  return (
    <span
      className="mono inline-flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: 5,
        fontSize: size * 0.55, fontWeight: 600,
        background: "var(--bg-elev-2)",
        border: "0.5px solid var(--line)",
        color: "var(--ink-2)",
      }}
    >
      {letter}
    </span>
  );
}

/* ── Large level chip for hierarchy ────────────────────────── */
export function LevelChip({
  level,
  topLevel = false,
}: {
  level: string;
  topLevel?: boolean;
}) {
  const letter = level === "YEARLY" || level === "yearly" ? "Y"
    : level === "QUARTERLY" || level === "quarterly" ? "Q"
    : level === "MONTHLY" || level === "monthly" ? "M"
    : level === "WEEKLY" || level === "weekly" ? "W"
    : level.charAt(0).toUpperCase();

  return (
    <div
      className="grid place-items-center mono shrink-0"
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: topLevel ? "var(--ink)" : "var(--bg-elev-2)",
        color: topLevel ? "var(--bg)" : "var(--ink-2)",
        fontWeight: 600, fontSize: 14,
        border: topLevel ? "0" : "1px solid var(--line)",
      }}
    >
      {letter}
    </div>
  );
}

/* ── Priority pill ───────���─────────────────────────────────── */
export function PriorityPill({ level }: { level: string }) {
  const map: Record<string, { c: string; t: string }> = {
    HIGH: { c: "var(--v2-danger)", t: "high" },
    MED: { c: "var(--v2-warn)", t: "med" },
    MEDIUM: { c: "var(--v2-warn)", t: "med" },
    LOW: { c: "var(--ink-3)", t: "low" },
  };
  const m = map[level?.toUpperCase()] || map.LOW;

  return (
    <span
      className="pill-v2"
      style={{ color: m.c, borderColor: "currentColor", background: "transparent" }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, background: "currentColor" }}
      />
      {m.t}
    </span>
  );
}

/* ── Tickbox ──────────��────────────────────────────────────── */
export function Tickbox({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="tickbox-v2"
      data-done={done}
      onClick={onClick}
    >
      <Check
        size={9}
        strokeWidth={2.5}
        style={{ opacity: done ? 1 : 0, transition: "opacity 120ms" }}
      />
    </button>
  );
}

/* ── Stat block ────────────��───────────────────────────────── */
export function StatBlock({
  label,
  value,
  suffix,
  trend,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="stat-num" style={{ fontSize: 22 }}>{value}</span>
        {suffix && <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{suffix}</span>}
        {trend && <span className="mono" style={{ fontSize: 10, color: "var(--v2-success)", marginLeft: 2 }}>{trend}</span>}
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </div>
    </div>
  );
}

/* ── Segmented control ─────────────────────────────────────── */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg-v2">
      {options.map(opt => (
        <button
          key={opt.value}
          data-active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Progress bar ──────────────────────────────────────────── */
export function ProgressBar({
  value,
  height = 4,
  color,
}: {
  value: number;
  height?: number;
  color?: string;
}) {
  return (
    <div className="bar-v2" style={{ height }}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}
