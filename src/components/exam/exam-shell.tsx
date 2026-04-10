"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag, AlignJustify, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExamMarkdown, OptionMarkdown } from "@/components/exam/exam-markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionOption = {
  id: string; // AttemptQuestionOption id
  position: number;
  optionId: string; // QuestionOption id (used for answer tracking)
  option: { id: string; text: string };
};

type AttemptQuestion = {
  id: string;
  position: number;
  questionId: string;
  question: { text: string; type: "SINGLE" | "MULTIPLE" };
  options: QuestionOption[];
};

type AttemptAnswer = {
  questionId: string;
  flagged: boolean;
  selected: { optionId: string }[];
};

type ExamData = {
  id: string;
  startedAt: string;
  totalQuestions: number;
  practiceTest: {
    title: string;
    type: string;
    certification: { id: string; name: string; passingScore: number; timeLimitMinutes: number };
  };
  questions: AttemptQuestion[];
  answers: AttemptAnswer[];
};

// ─── Local answer state ───────────────────────────────────────────────────────

type LocalAnswer = {
  selectedOptionIds: string[];
  flagged: boolean;
};

// ─── Timer component ──────────────────────────────────────────────────────────

function ExamTimer({
  startedAt,
  timeLimitMinutes,
  onExpired,
}: {
  startedAt: string;
  timeLimitMinutes: number;
  onExpired: () => void;
}) {
  const totalSeconds = timeLimitMinutes * 60;
  const startMs = new Date(startedAt).getTime();

  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, totalSeconds - Math.floor((Date.now() - startMs) / 1000))
  );
  const expiredRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(
        0,
        totalSeconds - Math.floor((Date.now() - startMs) / 1000)
      );
      setTimeLeft(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startMs, totalSeconds, onExpired]);

  const pct = timeLeft / totalSeconds;
  const isWarning = pct <= 0.25 && pct > 0.1;
  const isCritical = pct <= 0.1;

  const strokeColor = isCritical
    ? "#ef4444"
    : isWarning
    ? "#f59e0b"
    : "hsl(var(--primary))";

  const r = 11;
  const circ = 2 * Math.PI * r;
  // dashoffset = 0 → full arc (all time remaining); dashoffset = circ → empty (no time left)
  const offset = circ * (1 - timeLeft / totalSeconds);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const label =
    h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 shrink-0" style={{ color: strokeColor }}>
      <span className="text-sm font-mono font-semibold tabular-nums">
        {label}
      </span>
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        className="-rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx="15"
          cy="15"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.2"
        />
        {/* Remaining time — starts full, shrinks as time elapses */}
        <circle
          cx="15"
          cy="15"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── ExamShell ────────────────────────────────────────────────────────────────

export function ExamShell({
  attemptId,
  certId,
  testId,
}: {
  attemptId: string;
  certId: string;
  testId: string;
}) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [navOpen, setNavOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contentHidden, setContentHidden] = useState(false);
  const savingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Focus-lost overlay ────────────────────────────────────────────────────

  useEffect(() => {
    function onBlur() { setContentHidden(true); }
    function onFocus() { setContentHidden(false); }
    function onVisibility() {
      if (document.hidden) setContentHidden(true);
      else setContentHidden(false);
    }

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ── Load attempt ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/exam/${attemptId}`)
      .then((r) => r.json())
      .then((data: ExamData) => {
        setExam(data);
        // Hydrate local answers from saved state
        const initial: Record<string, LocalAnswer> = {};
        for (const a of data.answers) {
          initial[a.questionId] = {
            selectedOptionIds: a.selected.map((s) => s.optionId),
            flagged: a.flagged,
          };
        }
        setAnswers(initial);
      });
  }, [attemptId]);

  // ── Auto-save (debounced 400ms) ───────────────────────────────────────────

  const saveAnswer = useCallback(
    (questionId: string, nextAnswer: LocalAnswer) => {
      if (savingRef.current[questionId]) {
        clearTimeout(savingRef.current[questionId]);
      }
      savingRef.current[questionId] = setTimeout(() => {
        fetch(`/api/exam/${attemptId}/answer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOptionIds: nextAnswer.selectedOptionIds,
            flagged: nextAnswer.flagged,
          }),
        });
      }, 400);
    },
    [attemptId]
  );

  // ── Answer selection ──────────────────────────────────────────────────────

  function toggleOption(questionId: string, optionId: string, type: "SINGLE" | "MULTIPLE") {
    setAnswers((prev) => {
      const current = prev[questionId] ?? { selectedOptionIds: [], flagged: false };
      let next: string[];

      if (type === "SINGLE") {
        next = current.selectedOptionIds[0] === optionId ? [] : [optionId];
      } else {
        next = current.selectedOptionIds.includes(optionId)
          ? current.selectedOptionIds.filter((id) => id !== optionId)
          : [...current.selectedOptionIds, optionId];
      }

      const nextAnswer: LocalAnswer = { ...current, selectedOptionIds: next };
      saveAnswer(questionId, nextAnswer);
      return { ...prev, [questionId]: nextAnswer };
    });
  }

  function toggleFlag(questionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? { selectedOptionIds: [], flagged: false };
      const nextAnswer: LocalAnswer = { ...current, flagged: !current.flagged };
      saveAnswer(questionId, nextAnswer);
      return { ...prev, [questionId]: nextAnswer };
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await fetch(`/api/exam/${attemptId}/submit`, { method: "POST" });
    router.push(`/certifications/${certId}/exam/${testId}/${attemptId}/results`);
  }, [attemptId, certId, testId, router]);

  // ─────────────────────────────────────────────────────────────────────────

  if (!exam) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-muted-foreground">
        Loading exam…
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIdx];
  const currentAnswer = answers[currentQuestion.questionId] ?? {
    selectedOptionIds: [],
    flagged: false,
  };
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === exam.questions.length - 1;
  const answeredCount = exam.questions.filter(
    (q) => (answers[q.questionId]?.selectedOptionIds.length ?? 0) > 0
  ).length;
  const unansweredCount = exam.questions.length - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
        {/* Left: cert + question counter */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {exam.practiceTest.certification.name} — {exam.practiceTest.title}
          </p>
          <p className="text-sm font-semibold">
            Question {currentIdx + 1} / {exam.questions.length}
          </p>
        </div>

        {/* Center: countdown timer */}
        <ExamTimer
          startedAt={exam.startedAt}
          timeLimitMinutes={exam.practiceTest.certification.timeLimitMinutes}
          onExpired={handleSubmit}
        />

        {/* Right: flag + nav panel */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentAnswer.flagged ? "default" : "outline"}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => toggleFlag(currentQuestion.questionId)}
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {currentAnswer.flagged ? "Flagged" : "Flag"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setNavOpen(true)}
            title="Question navigator"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Question */}
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              {currentQuestion.question.type === "MULTIPLE"
                ? "Select all that apply"
                : "Select one answer"}
            </p>
            <div className="text-base font-medium">
              <span className="text-muted-foreground mr-1.5">{currentIdx + 1}.</span>
              <ExamMarkdown content={currentQuestion.question.text} />
            </div>
          </div>

          <div className="border-t mb-6" />

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = currentAnswer.selectedOptionIds.includes(opt.optionId);
              const isMultiple = currentQuestion.question.type === "MULTIPLE";

              return (
                // div instead of button so code blocks (block elements) can live inside
                <div
                  key={opt.optionId}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    toggleOption(
                      currentQuestion.questionId,
                      opt.optionId,
                      currentQuestion.question.type
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleOption(
                        currentQuestion.questionId,
                        opt.optionId,
                        currentQuestion.question.type
                      );
                    }
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left cursor-pointer transition-all select-none",
                    isSelected
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  {/* Radio / Checkbox indicator */}
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2 transition-colors",
                      isMultiple ? "rounded" : "rounded-full",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && (
                      isMultiple ? (
                        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-primary-foreground">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )
                    )}
                  </span>
                  <div className="text-sm min-w-0 flex-1">
                    <OptionMarkdown content={opt.option.text} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom nav ──────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-t px-4 gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((i) => i - 1)}
          disabled={isFirst}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {isLast ? (
          <Button
            onClick={() => setSubmitOpen(true)}
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          >
            Submit Exam
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Nav panel (slide-in from right) ─────────────────────────────── */}
      {navOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-60 bg-black/30"
            onClick={() => setNavOpen(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 z-70 flex w-72 flex-col bg-background shadow-2xl border-l">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <p className="font-semibold text-sm">Question Navigator</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => {
                  const ans = answers[q.questionId];
                  const isFlagged = ans?.flagged ?? false;
                  const isAnswered = (ans?.selectedOptionIds.length ?? 0) > 0;
                  const isCurrent = idx === currentIdx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIdx(idx);
                        setNavOpen(false);
                      }}
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium transition-all",
                        isCurrent && "ring-2 ring-primary ring-offset-1",
                        isFlagged
                          ? "border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : isAnswered
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                      title={
                        isFlagged
                          ? `Q${idx + 1} — Flagged`
                          : isAnswered
                          ? `Q${idx + 1} — Answered`
                          : `Q${idx + 1} — Unanswered`
                      }
                    >
                      {isFlagged ? (
                        <Flag className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="border-t px-4 py-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-primary/40 bg-primary/10" />
                Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" />
                Flagged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-border" />
                Unanswered
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Focus-lost overlay ──────────────────────────────────────────── */}
      {contentHidden && (
        <div
          className="fixed inset-0 z-80 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm cursor-pointer"
          onClick={() => window.focus()}
        >
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Content Hidden</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your exam is still active and the timer is running.
              Click anywhere or return to this window to continue.
            </p>
          </div>
        </div>
      )}

      {/* ── Submit confirmation dialog ───────────────────────────────────── */}
      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount > 0 ? (
                <>
                  You have{" "}
                  <span className="font-semibold text-foreground">
                    {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}
                  </span>
                  . Unanswered questions will be marked as incorrect.
                </>
              ) : (
                "All questions answered. Ready to submit?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Keep Reviewing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Submitting…" : "Submit Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
