"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_PALETTES = {
  yellow: {
    bg: "#FEF6B8",
    bg2: "#FDEC8E",
    ink: "#3D3514",
    ink2: "#6B5C28",
    shadow: "rgba(180, 140, 30, 0.25)",
    accent: "#8B6F1A",
  },
  green: {
    bg: "#D5EFCB",
    bg2: "#BFE5B0",
    ink: "#1F3D1A",
    ink2: "#446B3D",
    shadow: "rgba(60, 120, 50, 0.22)",
    accent: "#3E6B33",
  },
  blue: {
    bg: "#CCE5F4",
    bg2: "#B4D7EE",
    ink: "#11324A",
    ink2: "#3D5E76",
    shadow: "rgba(50, 110, 160, 0.22)",
    accent: "#2B5A7F",
  },
  pink: {
    bg: "#FBD6E1",
    bg2: "#F5BFD0",
    ink: "#4A1A2C",
    ink2: "#7A3E55",
    shadow: "rgba(170, 70, 110, 0.20)",
    accent: "#8C2E55",
  },
} as const;

export type TourColor = keyof typeof TOUR_PALETTES;

export interface TourStep {
  title: string;
  body: string;
  color?: TourColor;
  rotate?: number;
}

const DEFAULT_STEPS: TourStep[] = [
  {
    title: "Create Your First Goal",
    body: "Start by adding a goal — Yearly, Quarterly, Monthly, or Weekly. Goals can be nested so you can break big objectives into smaller milestones.",
    color: "yellow",
    rotate: -1.4,
  },
  {
    title: "Plan Your Week",
    body: "Drag any goal into a day on the weekly plan. Time-block focused study sessions and the calendar will keep your streak going.",
    color: "green",
    rotate: 1.8,
  },
  {
    title: "Track Your Progress",
    body: "Earn points for every session, flashcard reviewed, and practice exam attempted. Watch your streak grow and unlock badges along the way.",
    color: "blue",
    rotate: -0.8,
  },
];

export function TourSticky({
  steps = DEFAULT_STEPS,
  onClose,
  startStep = 0,
}: {
  steps?: TourStep[];
  onClose: () => void;
  startStep?: number;
}) {
  const [i, setI] = useState(startStep);
  const step = steps[i];
  const palette = TOUR_PALETTES[step.color || "yellow"];
  const total = steps.length;

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight" && i < total - 1) setI(i + 1);
      if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, total, handleClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "radial-gradient(ellipse at 75% 35%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%)",
          backdropFilter: "blur(2px)",
          animation: "tourFade 280ms ease-out",
        }}
      />

      {/* Sticky note */}
      <div
        key={i}
        style={{
          position: "fixed",
          top: 110, right: 64,
          zIndex: 101,
          width: 320,
          padding: "22px 22px 18px",
          background: `linear-gradient(155deg, ${palette.bg} 0%, ${palette.bg2} 100%)`,
          color: palette.ink,
          fontFamily: "var(--font-caveat, 'Caveat'), var(--font-kalam, 'Kalam'), 'Patrick Hand', cursive",
          transform: `rotate(${step.rotate || 0}deg)`,
          boxShadow: `
            0 1px 0 rgba(255,255,255,0.6) inset,
            0 22px 40px -10px ${palette.shadow},
            0 8px 16px -6px rgba(0,0,0,0.35),
            0 2px 4px rgba(0,0,0,0.18)
          `,
          animation: "stickyDrop 420ms cubic-bezier(.34,1.4,.5,1) both",
        }}
      >
        {/* Tape strip */}
        <div style={{
          position: "absolute",
          top: -10, left: "50%", transform: "translateX(-50%) rotate(-2deg)",
          width: 70, height: 18,
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(1px)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
          borderLeft: "1px solid rgba(255,255,255,0.7)",
          borderRight: "1px solid rgba(255,255,255,0.7)",
        }} />

        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Close tour"
          style={{
            position: "absolute", top: 8, right: 8,
            width: 22, height: 22,
            border: "none", background: "transparent",
            cursor: "pointer",
            color: palette.ink2,
            fontSize: 18,
            display: "grid", placeItems: "center",
            borderRadius: 4,
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Step counter */}
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: ".1em",
          textTransform: "uppercase" as const,
          color: palette.ink2,
          marginBottom: 8,
          opacity: 0.75,
        }}>
          Step {i + 1} of {total}
        </div>

        {/* Title */}
        <h3 style={{
          margin: "0 0 10px",
          fontFamily: "var(--font-caveat, 'Caveat'), 'Patrick Hand', cursive",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: palette.ink,
        }}>
          {step.title}
        </h3>

        {/* Body */}
        <p style={{
          margin: "0 0 18px",
          fontFamily: "var(--font-kalam, 'Kalam'), 'Patrick Hand', cursive",
          fontSize: 16,
          lineHeight: 1.45,
          color: palette.ink,
        }}>
          {step.body}
        </p>

        {/* Dots + nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Go to step ${idx + 1}`}
                style={{
                  width: idx === i ? 18 : 7,
                  height: 7,
                  border: "none",
                  borderRadius: 4,
                  background: idx === i ? palette.accent : palette.ink2,
                  opacity: idx === i ? 1 : 0.35,
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 200ms ease",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <TourBtn palette={palette} disabled={i === 0} onClick={() => setI(i - 1)}>
              &larr; Back
            </TourBtn>
            {i < total - 1 ? (
              <TourBtn palette={palette} primary onClick={() => setI(i + 1)}>
                Next &rarr;
              </TourBtn>
            ) : (
              <TourBtn palette={palette} primary onClick={handleClose}>
                Done &check;
              </TourBtn>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TourBtn({
  children,
  onClick,
  disabled,
  primary,
  palette,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  palette: (typeof TOUR_PALETTES)[TourColor];
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-caveat, 'Caveat'), 'Patrick Hand', cursive",
        fontSize: 17,
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.3 : 1,
        background: primary ? palette.ink : "transparent",
        color: primary ? palette.bg : palette.ink2,
        border: primary ? "none" : `1px dashed ${palette.ink2}`,
        transition: "all 140ms ease",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </button>
  );
}
