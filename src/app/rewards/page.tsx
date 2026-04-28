"use client";

import { useEffect, useState, useMemo } from "react";
import { Zap, Flame, Trophy, Award, Check } from "lucide-react";
import { ProgressBar } from "@/components/v2/primitives";
import { POINTS } from "@/lib/rewards";
import type { BadgeDefinition, Reward, UserStats } from "@/lib/types";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rewards");
      const data = await res.json();
      setRewards(data.rewards);
      setStats(data.stats);
      setBadges(data.badgeDefinitions);
      setLoading(false);
    }
    load();
  }, []);

  const earnedIds = useMemo(() => new Set(rewards.filter(r => r.type === "badge").map(r => r.name)), [rewards]);
  const earnedCount = badges.filter(b => earnedIds.has(b.name)).length;
  const lockedCount = badges.length - earnedCount;
  const currentStreak = stats?.currentStreak ?? 0;
  const bestStreak = stats?.longestStreak ?? 0;
  const totalPoints = stats?.totalPoints ?? 0;

  // Level system: every 250 pts = 1 level
  const level = Math.floor(totalPoints / 250) + 1;
  const nextLevelPts = level * 250;
  const ptsToNext = nextLevelPts - totalPoints;
  const levelPct = ((totalPoints % 250) / 250) * 100;

  // Streak milestones
  const milestones = [0, 25, 50, 75, 100];
  const nextMilestone = milestones.find(m => m > currentStreak) ?? 100;
  const streakPct = Math.min(100, (currentStreak / nextMilestone) * 100);

  // 14-day streak strip
  const streakDays = Array.from({ length: 14 }, (_, i) => currentStreak - 13 + i);

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading rewards...</div>
      </div>
    );
  }

  const pointRules = Object.entries(POINTS).map(([key, value]) => ({
    event: key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: `+${value}`,
  }));

  return (
    <div className="page-v2 fade-up">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between" style={{
        paddingBottom: "var(--sp-6)", marginBottom: "var(--sp-6)",
        borderBottom: "1px solid var(--line)", gap: "var(--sp-4)",
      }}>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em",
            margin: 0, display: "flex", alignItems: "baseline", gap: 10,
          }}>
            Rewards <span className="num" style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 400 }}>+{totalPoints}</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink-3)", fontSize: 13 }}>
            Points, streaks, and badges.{" "}
            <span className="mono" style={{ color: "var(--ink-2)" }}>{earnedCount}/{badges.length}</span> badges earned.
          </p>
        </div>
      </div>

      {/* HERO STAT QUAD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <HeroStat icon={Zap} label="Total points" value={totalPoints} sub="lifetime earned" tone="accent" />
        <HeroStat icon={Flame} label="Day streak" value={currentStreak} suffix="d" sub={currentStreak === bestStreak ? "best ever — keep going" : "keep going"} tone="warn" />
        <HeroStat icon={Trophy} label="Best streak" value={bestStreak} suffix="d" sub="all-time peak" />
        <HeroStat icon={Award} label="Badges" value={`${earnedCount}/${badges.length}`} sub={`${lockedCount} more to unlock`} />
      </div>

      {/* STREAK DETAIL */}
      <div className="card-v2" style={{ padding: 24, marginBottom: 20 }}>
        <div className="flex justify-between items-start" style={{ marginBottom: 18 }}>
          <div>
            <div className="eyebrow">Streak tracker</div>
            <div className="flex items-baseline gap-2" style={{ marginTop: 6 }}>
              <div className="stat-num" style={{ fontSize: 36, fontWeight: 500 }}>{currentStreak}</div>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>consecutive days</span>
              <Flame size={18} strokeWidth={1.5} style={{ color: "var(--v2-warn)", marginLeft: 4 }} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">Next milestone</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6 }}>
              <span style={{ color: "var(--v2-accent)" }}>{currentStreak}</span>
              <span style={{ color: "var(--ink-3)" }}> / {nextMilestone} d</span>
            </div>
          </div>
        </div>

        {/* 14-day strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}>
          {streakDays.map((d, i) => (
            <div key={i} style={{
              padding: "12px 0", borderRadius: 6, textAlign: "center",
              background: i === 13 ? "var(--v2-accent)" : "var(--accent-soft)",
              color: i === 13 ? "var(--accent-ink)" : "var(--v2-accent)",
              fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600,
            }}>
              {d > 0 ? d : ""}
            </div>
          ))}
        </div>
        <div className="flex justify-between" style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          <span>day {streakDays[0] > 0 ? streakDays[0] : 1}</span>
          <span>↑ today, day {currentStreak}</span>
        </div>

        {/* Milestone progress */}
        <div style={{ marginTop: 18 }}>
          <ProgressBar value={streakPct} height={6} />
          <div className="flex justify-between" style={{ marginTop: 6 }}>
            {milestones.map(m => (
              <span key={m} className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                {m}d{m <= currentStreak && m > 0 ? <span style={{ color: "var(--v2-success)" }}> ✓</span> : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BADGES + POINTS GUIDE */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* BADGES */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-3)" }}>
            <h3 className="eyebrow" style={{ fontSize: 12 }}>Badges</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {earnedCount} unlocked · {lockedCount} locked
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {badges.map(b => {
              const earned = earnedIds.has(b.name);
              return (
                <div key={b.id} className="card-v2" style={{
                  padding: 14, opacity: earned ? 1 : 0.5,
                  borderStyle: earned ? "solid" : "dashed",
                  position: "relative", minHeight: 130,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  {earned && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "var(--v2-success)", color: "var(--bg)",
                      display: "grid", placeItems: "center",
                    }}>
                      <Check size={9} strokeWidth={3} />
                    </div>
                  )}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: earned ? "var(--accent-soft)" : "var(--bg-elev-2)",
                    display: "grid", placeItems: "center", fontSize: 18,
                    border: "1px solid var(--line)",
                  }}>
                    {b.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>{b.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* POINTS GUIDE */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--sp-3)" }}>
            <h3 className="eyebrow" style={{ fontSize: 12 }}>Points guide</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>how it works</span>
          </div>
          <div className="card-v2" style={{ overflow: "hidden" }}>
            {pointRules.map((r, i) => (
              <div key={r.event} className="flex justify-between items-center" style={{
                padding: "12px 16px",
                borderTop: i === 0 ? undefined : "1px solid var(--line-soft)",
              }}>
                <span style={{ fontSize: 13 }}>{r.event}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--v2-accent)" }}>
                  {r.value}<span style={{ color: "var(--ink-3)", fontWeight: 400 }}> pts</span>
                </span>
              </div>
            ))}
          </div>

          {/* Level card */}
          <div className="card-v2" style={{ marginTop: 14, padding: 18 }}>
            <div className="eyebrow">Level</div>
            <div className="flex justify-between items-baseline" style={{ marginTop: 8, marginBottom: 10 }}>
              <div className="stat-num" style={{ fontSize: 28, fontWeight: 500 }}>L{level}</div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {totalPoints} / {nextLevelPts} to L{level + 1}
              </span>
            </div>
            <ProgressBar value={levelPct} height={6} />
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {ptsToNext} pts away from{" "}
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>L{level + 1}</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string | number;
  suffix?: string;
  sub: string;
  tone?: "accent" | "warn";
}) {
  const toneColor = tone === "accent" ? "var(--v2-accent)" : tone === "warn" ? "var(--v2-warn)" : "var(--ink-2)";

  return (
    <div className="card-v2" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
      <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
        <div className="eyebrow">{label}</div>
        <Icon size={14} strokeWidth={1.5} style={{ color: toneColor }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="stat-num" style={{ fontSize: 30, fontWeight: 500 }}>{value}</span>
        {suffix && <span className="mono" style={{ fontSize: 13, color: "var(--ink-3)" }}>{suffix}</span>}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}
