"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface OnboardingContextValue {
  completedSteps: Set<string>;
  onboardingCompleted: boolean;
  isLoaded: boolean;
  markSeen: (steps: string[]) => Promise<void>;
  resetTour: () => Promise<void>;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  completedSteps: new Set(),
  onboardingCompleted: true,
  isLoaded: false,
  markSeen: async () => {},
  resetTour: async () => {},
  completeOnboarding: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        setCompletedSteps(new Set(data.completedTourSteps ?? []));
        setOnboardingCompleted(data.onboardingCompleted ?? false);
        setIsLoaded(true);
      });
  }, []);

  // Redirect to setup wizard if onboarding hasn't been completed
  useEffect(() => {
    if (isLoaded && !onboardingCompleted && pathname !== "/setup") {
      router.push("/setup");
    }
  }, [isLoaded, onboardingCompleted, pathname, router]);

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

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
  }, []);

  return (
    <OnboardingContext.Provider value={{ completedSteps, onboardingCompleted, isLoaded, markSeen, resetTour, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
