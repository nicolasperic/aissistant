"use client";

import { useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/components/layout/onboarding-context";
import { type TourId, TOURS, TOUR_STEP_IDS } from "@/lib/tours";
import "driver.js/dist/driver.css";

interface TourButtonProps {
  tourId: TourId;
  /** Auto-start when none of the tour's steps have been seen yet */
  autoStart?: boolean;
}

export function TourButton({ tourId, autoStart = true }: TourButtonProps) {
  const { completedSteps, isLoaded, markSeen } = useOnboarding();
  const autoStarted = useRef(false);

  const runTour = async () => {
    const { driver } = await import("driver.js");

    const steps = TOURS[tourId];
    const stepIds = TOUR_STEP_IDS[tourId];

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      smoothScroll: true,
      steps,
      onDestroyStarted: () => {
        markSeen(stepIds);
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  useEffect(() => {
    if (!isLoaded || autoStarted.current || !autoStart) return;

    const tourStepIds = TOUR_STEP_IDS[tourId];
    const anyCompleted = tourStepIds.some((id) => completedSteps.has(id));
    if (anyCompleted) return;

    autoStarted.current = true;
    // Small delay so the page elements are mounted
    const timer = setTimeout(() => {
      runTour();
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={runTour}
      className="text-muted-foreground hover:text-foreground"
      title="Take a tour"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="ml-1.5 hidden sm:inline">Tour</span>
    </Button>
  );
}
