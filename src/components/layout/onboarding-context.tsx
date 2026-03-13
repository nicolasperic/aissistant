"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface OnboardingContextValue {
  completedSteps: Set<string>;
  isLoaded: boolean;
  markSeen: (steps: string[]) => Promise<void>;
  resetTour: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  completedSteps: new Set(),
  isLoaded: false,
  markSeen: async () => {},
  resetTour: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        setCompletedSteps(new Set(data.completedTourSteps ?? []));
        setIsLoaded(true);
      });
  }, []);

  const markSeen = useCallback(async (steps: string[]) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      steps.forEach((s) => next.add(s));
      return next;
    });
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
  }, []);

  const resetTour = useCallback(async () => {
    setCompletedSteps(new Set());
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
  }, []);

  return (
    <OnboardingContext.Provider value={{ completedSteps, isLoaded, markSeen, resetTour }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
