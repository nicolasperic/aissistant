"use client";

import { createContext, useCallback, useContext, useState } from "react";
import confetti from "canvas-confetti";
import { BADGES } from "@/lib/rewards";

interface CelebrationContextValue {
  celebrate: (badgeNames: string[]) => void;
}

const CelebrationContext = createContext<CelebrationContextValue>({
  celebrate: () => {},
});

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [badge, setBadge] = useState<{ name: string; icon: string; description: string } | null>(null);

  const celebrate = useCallback((badgeNames: string[]) => {
    if (badgeNames.length === 0) return;

    // Show the first new badge (multiple unlocks are rare)
    const badgeName = badgeNames[0];
    const def = BADGES.find((b) => b.name === badgeName);
    if (!def) return;

    setBadge({ name: def.name, icon: def.icon, description: def.description });

    // Fire confetti bursts
    const duration = 2500;
    const end = Date.now() + duration;

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f59e0b", "#8b5cf6", "#ec4899", "#10b981"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f59e0b", "#8b5cf6", "#ec4899", "#10b981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }
    frame();

    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ["#f59e0b", "#8b5cf6", "#ec4899", "#10b981", "#3b82f6"],
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => setBadge(null), 4000);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {badge && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setBadge(null)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-background border shadow-2xl p-8 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-7xl animate-bounce">{badge.icon}</div>
            <div className="text-center space-y-1">
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Badge Unlocked!
              </p>
              <h2 className="text-2xl font-bold">{badge.name}</h2>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </div>
            <button
              onClick={() => setBadge(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              Click anywhere to dismiss
            </button>
          </div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  return useContext(CelebrationContext);
}
