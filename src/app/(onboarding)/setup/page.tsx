"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/components/layout/onboarding-context";
import { GraduationCap, Sparkles, ArrowRight, ArrowLeft, Check, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { allProviders } from "@/lib/certifications";
import type { CertDefinition } from "@/lib/certifications";

type CertStatus = "PASSED" | "PREPARING" | "NOT_INTERESTED";

type CertSelection = {
  certCode: string;
  status: CertStatus;
  passedAt?: string;
  examDate?: string;
};

const STEPS = ["Welcome", "Certifications", "Schedule", "Summary"] as const;

export default function SetupPage() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Map<string, CertSelection>>(() => {
    const map = new Map<string, CertSelection>();
    for (const provider of allProviders) {
      for (const cert of provider.certifications) {
        map.set(cert.code, { certCode: cert.code, status: "NOT_INTERESTED" });
      }
    }
    return map;
  });
  const [saving, setSaving] = useState(false);

  function updateSelection(code: string, updates: Partial<CertSelection>) {
    setSelections((prev) => {
      const next = new Map(prev);
      const existing = next.get(code)!;
      next.set(code, { ...existing, ...updates });
      return next;
    });
  }

  function cycleStatus(code: string) {
    const current = selections.get(code)!;
    const order: CertStatus[] = ["NOT_INTERESTED", "PREPARING", "PASSED"];
    const idx = order.indexOf(current.status);
    const nextStatus = order[(idx + 1) % order.length];
    updateSelection(code, {
      status: nextStatus,
      passedAt: nextStatus === "PASSED" ? current.passedAt : undefined,
      examDate: nextStatus === "PREPARING" ? current.examDate : undefined,
    });
  }

  const preparingCerts = Array.from(selections.values())
    .filter((s) => s.status === "PREPARING")
    .map((s) => {
      for (const p of allProviders) {
        const cert = p.certifications.find((c) => c.code === s.certCode);
        if (cert) return { cert, selection: s };
      }
      return null;
    })
    .filter(Boolean) as { cert: CertDefinition; selection: CertSelection }[];

  const passedCerts = Array.from(selections.values())
    .filter((s) => s.status === "PASSED")
    .map((s) => {
      for (const p of allProviders) {
        const cert = p.certifications.find((c) => c.code === s.certCode);
        if (cert) return { cert, selection: s };
      }
      return null;
    })
    .filter(Boolean) as { cert: CertDefinition; selection: CertSelection }[];

  const canProceed =
    step === 0 ||
    step === 2 ||
    (step === 1 && (preparingCerts.length > 0 || passedCerts.length > 0)) ||
    step === 3;

  async function handleFinish() {
    setSaving(true);
    try {
      const certifications = Array.from(selections.values()).filter(
        (s) => s.status !== "NOT_INTERESTED"
      );
      await fetch("/api/onboarding/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certifications }),
      });
      completeOnboarding();
      router.push("/");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors shrink-0",
                i < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === step
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  i < step ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && <WelcomeStep />}
      {step === 1 && (
        <CertificationsStep
          selections={selections}
          onCycleStatus={cycleStatus}
          onUpdateSelection={updateSelection}
        />
      )}
      {step === 2 && (
        <ScheduleStep
          preparingCerts={preparingCerts}
          onUpdateSelection={updateSelection}
        />
      )}
      {step === 3 && (
        <SummaryStep
          passedCerts={passedCerts}
          preparingCerts={preparingCerts}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={saving}>
            {saving ? "Setting up..." : "Get Started"}
            {!saving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Certento</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Let&apos;s set up your certification study journey. We&apos;ll help you plan, study, and track your progress.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto pt-4">
        <div className="text-center space-y-1">
          <GraduationCap className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Study Notes</p>
        </div>
        <div className="text-center space-y-1">
          <Calendar className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground">AI Planning</p>
        </div>
        <div className="text-center space-y-1">
          <Trophy className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Track Progress</p>
        </div>
      </div>
    </div>
  );
}

function CertificationsStep({
  selections,
  onCycleStatus,
  onUpdateSelection,
}: {
  selections: Map<string, CertSelection>;
  onCycleStatus: (code: string) => void;
  onUpdateSelection: (code: string, updates: Partial<CertSelection>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Your Certifications</h2>
        <p className="text-muted-foreground">
          Click each card to cycle through: <span className="text-muted-foreground/70">not interested</span> → <span className="text-primary font-medium">preparing</span> → <span className="text-green-600 dark:text-green-400 font-medium">passed</span>
        </p>
      </div>

      {allProviders.map((provider) => (
        <div key={provider.id} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {provider.name}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {provider.certifications.map((cert) => {
              const sel = selections.get(cert.code)!;
              return (
                <CertCard
                  key={cert.code}
                  cert={cert}
                  status={sel.status}
                  passedAt={sel.passedAt}
                  onClick={() => onCycleStatus(cert.code)}
                  onPassedAtChange={(date) =>
                    onUpdateSelection(cert.code, { passedAt: date })
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CertCard({
  cert,
  status,
  passedAt,
  onClick,
  onPassedAtChange,
}: {
  cert: CertDefinition;
  status: CertStatus;
  passedAt?: string;
  onClick: () => void;
  onPassedAtChange: (date: string) => void;
}) {
  const levelColors = {
    professional: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    expert: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    master: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all",
        status === "NOT_INTERESTED" && "opacity-50 hover:opacity-70",
        status === "PREPARING" && "border-primary ring-1 ring-primary/20",
        status === "PASSED" && "border-green-500 ring-1 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{cert.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{cert.code}</span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium capitalize", levelColors[cert.level])}>
                {cert.level}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-lg">
            {status === "PASSED" && "✅"}
            {status === "PREPARING" && "🎯"}
            {status === "NOT_INTERESTED" && "⬜"}
          </div>
        </div>

        {status === "PASSED" && (
          <div onClick={(e) => e.stopPropagation()}>
            <label className="text-xs text-muted-foreground">Date passed</label>
            <Input
              type="date"
              value={passedAt ?? ""}
              onChange={(e) => onPassedAtChange(e.target.value)}
              className="h-8 text-sm mt-1"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduleStep({
  preparingCerts,
  onUpdateSelection,
}: {
  preparingCerts: { cert: CertDefinition; selection: CertSelection }[];
  onUpdateSelection: (code: string, updates: Partial<CertSelection>) => void;
}) {
  if (preparingCerts.length === 0) {
    return (
      <div className="text-center space-y-4 py-8">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No Exams to Schedule</h2>
          <p className="text-muted-foreground">
            You haven&apos;t selected any certifications to prepare for. You can go back and select some, or continue to finish setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exam Schedule</h2>
        <p className="text-muted-foreground">
          When are you planning to take each exam? This helps us create a study plan.
        </p>
      </div>

      <div className="space-y-4">
        {preparingCerts.map(({ cert, selection }) => (
          <Card key={cert.code}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="font-medium text-sm">{cert.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{cert.code}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Exam date</label>
                <Input
                  type="date"
                  value={selection.examDate ?? ""}
                  onChange={(e) =>
                    onUpdateSelection(cert.code, { examDate: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Not scheduled yet"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty if not scheduled yet
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {cert.exam.totalQuestions} questions &middot; {cert.exam.passingScore} to pass &middot; {cert.exam.timeLimitMinutes} min
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SummaryStep({
  passedCerts,
  preparingCerts,
}: {
  passedCerts: { cert: CertDefinition; selection: CertSelection }[];
  preparingCerts: { cert: CertDefinition; selection: CertSelection }[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ready to Go</h2>
        <p className="text-muted-foreground">
          Here&apos;s your certification journey at a glance.
        </p>
      </div>

      {passedCerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Already Passed
          </h3>
          <div className="grid gap-2">
            {passedCerts.map(({ cert, selection }) => (
              <div
                key={cert.code}
                className="flex items-center justify-between rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span>✅</span>
                  <div>
                    <p className="text-sm font-medium">{cert.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cert.code}</p>
                  </div>
                </div>
                {selection.passedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(selection.passedAt + "T00:00:00").toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {preparingCerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Preparing For
          </h3>
          <div className="grid gap-2">
            {preparingCerts.map(({ cert, selection }) => (
              <div
                key={cert.code}
                className="flex items-center justify-between rounded-lg border border-primary/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span>🎯</span>
                  <div>
                    <p className="text-sm font-medium">{cert.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cert.code}</p>
                  </div>
                </div>
                {selection.examDate ? (
                  <span className="text-xs text-muted-foreground">
                    Exam: {new Date(selection.examDate + "T00:00:00").toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not scheduled</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {passedCerts.length === 0 && preparingCerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No certifications selected. You can always update this later in settings.</p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          After setup, head to <strong>Goals</strong> to create your study plan, or use the <strong>Weekly Planner</strong> to let AI generate daily study tasks for you.
        </p>
      </div>
    </div>
  );
}
