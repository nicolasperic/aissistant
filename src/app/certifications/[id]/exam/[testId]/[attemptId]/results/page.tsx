"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Flag,
  Clock,
  CalendarCheck,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExamMarkdown, OptionMarkdown } from "@/components/exam/exam-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultOption = {
  optionId: string;
  text: string;
  isCorrect: boolean;
  wasSelected: boolean;
};

type ResultQuestion = {
  questionId: string;
  position: number;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  explanation: string | null;
  certSectionId: string | null;
  isCorrect: boolean;
  flagged: boolean;
  options: ResultOption[];
};

type SectionBreakdown = {
  sectionId: string;
  name: string;
  percentage: number;
  total: number;
  correct: number;
  pct: number;
};

type ResultsData = {
  attempt: {
    id: string;
    score: number | null;
    totalQuestions: number;
    passed: boolean | null;
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number | null;
    status: string;
  };
  practiceTest: { id: string; title: string; type: string };
  certification: {
    id: string;
    name: string;
    code: string;
    passingScore: number;
    totalQuestions: number;
    requiredToPass: number;
    timeLimitMinutes: number;
  };
  sectionBreakdown: SectionBreakdown[];
  questions: ResultQuestion[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Option row ───────────────────────────────────────────────────────────────

function OptionRow({ opt, isMultiple }: { opt: ResultOption; isMultiple: boolean }) {
  const isHighlighted = opt.isCorrect || opt.wasSelected;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
        opt.isCorrect
          ? "border-green-400/60 bg-green-50 dark:bg-green-900/15"
          : opt.wasSelected && !opt.isCorrect
          ? "border-red-400/60 bg-red-50 dark:bg-red-900/15"
          : "border-border opacity-60"
      )}
    >
      {/* Indicator */}
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border-2",
          isMultiple ? "rounded" : "rounded-full",
          opt.isCorrect
            ? "border-green-500 bg-green-500"
            : opt.wasSelected
            ? "border-red-500 bg-red-500"
            : "border-muted-foreground/30"
        )}
      >
        {opt.isCorrect && (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5">
            <path
              d="M1.5 5l2.5 2.5 4.5-4.5"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {opt.wasSelected && !opt.isCorrect && (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5">
            <path
              d="M2 2l6 6M8 2l-6 6"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>

      <div className={cn("text-sm min-w-0 flex-1", isHighlighted ? "text-foreground" : "text-muted-foreground")}>
        <OptionMarkdown content={opt.text} />
      </div>

      {/* Labels */}
      <div className="ml-auto flex gap-1.5 shrink-0">
        {opt.isCorrect && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Correct</span>
        )}
        {opt.wasSelected && !opt.isCorrect && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">Your answer</span>
        )}
        {opt.wasSelected && opt.isCorrect && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Your answer ✓</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id: certId, testId, attemptId } = useParams<{
    id: string;
    testId: string;
    attemptId: string;
  }>();
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/exam/${attemptId}/results`)
      .then((r) => r.json())
      .then(setData);
  }, [attemptId]);

  async function handleRetake() {
    setStarting(true);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      const { attemptId: newId } = await res.json();
      router.push(`/certifications/${certId}/exam/${testId}/${newId}`);
    } catch {
      setStarting(false);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading results…
      </div>
    );
  }

  const { attempt, practiceTest, certification, sectionBreakdown, questions } = data;
  const passed = attempt.passed === true;
  const score = attempt.score ?? 0;
  const scorePercent = Math.round((score / attempt.totalQuestions) * 100);
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const incorrectCount = questions.length - correctCount;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Back */}
      <Link
        href={`/certifications/${certId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {certification.name}
      </Link>

      {/* ── Pass / Fail banner ─────────────────────────────────────────────── */}
      <Card
        className={cn(
          "border-2",
          passed
            ? "border-green-400/50 bg-green-50/50 dark:bg-green-900/10"
            : "border-red-400/50 bg-red-50/50 dark:bg-red-900/10"
        )}
      >
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
          {passed ? (
            <Trophy className="h-14 w-14 text-green-500" />
          ) : (
            <XCircle className="h-14 w-14 text-red-500" />
          )}
          <div>
            <p
              className={cn(
                "text-4xl font-bold mb-1",
                passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {passed ? "Passed!" : "Not Passed"}
            </p>
            <p className="text-muted-foreground text-sm">{practiceTest.title}</p>
          </div>

          {/* Big score */}
          <div className="flex flex-col items-center">
            <p className="text-6xl font-bold tabular-nums">
              {score}
              <span className="text-3xl text-muted-foreground font-normal">
                /{attempt.totalQuestions}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {scorePercent}% · Passing: {certification.requiredToPass}/{attempt.totalQuestions}
            </p>
          </div>

          {/* Correct / Incorrect pills */}
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              {correctCount} correct
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              {incorrectCount} incorrect
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {attempt.completedAt && (
          <Card>
            <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-sm font-medium">{formatDate(attempt.completedAt)}</p>
            </CardContent>
          </Card>
        )}
        {attempt.durationSeconds !== null && (
          <Card>
            <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">{formatDuration(attempt.durationSeconds)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
            <Flag className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Flagged</p>
            <p className="text-sm font-medium">
              {questions.filter((q) => q.flagged).length} questions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section breakdown ──────────────────────────────────────────────── */}
      {sectionBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Section Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionBreakdown.map((sec) => (
              <div key={sec.sectionId}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{sec.name}</span>
                    <Badge variant="outline" className="text-xs">{sec.percentage}% of exam</Badge>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {sec.correct}/{sec.total}
                    <span className="text-muted-foreground font-normal ml-1">({sec.pct}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      sec.pct >= 70 ? "bg-green-500" : sec.pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${sec.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Answer review ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Answer Review</h2>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card
              key={q.questionId}
              className={cn(
                "border-l-4",
                q.isCorrect ? "border-l-green-500" : "border-l-red-500"
              )}
            >
              <CardContent className="pt-4 space-y-3">
                {/* Question header */}
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    {q.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    {q.flagged && (
                      <Flag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                    <ExamMarkdown content={q.text} />
                  </div>
                </div>

                {q.type === "MULTIPLE" && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Select all that apply
                  </p>
                )}

                {/* Options */}
                <div className="space-y-2 pl-6">
                  {q.options.map((opt) => (
                    <OptionRow key={opt.optionId} opt={opt} isMultiple={q.type === "MULTIPLE"} />
                  ))}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="pl-6 pt-1">
                    <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Explanation: </span>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleRetake}
          disabled={starting}
          className="flex-1 gap-2"
          size="lg"
        >
          <RotateCcw className="h-4 w-4" />
          {starting ? "Preparing…" : "Retake Exam"}
        </Button>
        <Link href={`/certifications/${certId}`} className="flex-1">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Certification
          </Button>
        </Link>
      </div>
    </div>
  );
}
