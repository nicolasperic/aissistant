"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Play,
  Bot,
  FileText,
  Shuffle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PracticeTest = {
  id: string;
  title: string;
  type: "OFFICIAL" | "AI_GENERATED" | "SHUFFLE";
  questionCount: number;
};

type Certification = {
  id: string;
  name: string;
  code: string;
  passingScore: number;
  totalQuestions: number;
  timeLimitMinutes: number;
  practiceTests: PracticeTest[];
  _count: { questions: number };
};

const TEST_TYPE_ICON = {
  OFFICIAL: FileText,
  AI_GENERATED: Bot,
  SHUFFLE: Shuffle,
};

const TEST_TYPE_LABEL = {
  OFFICIAL: "Official",
  AI_GENERATED: "AI Generated",
  SHUFFLE: "Shuffle",
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

export default function ExamIntroPage() {
  const { id: certId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const [cert, setCert] = useState<Certification | null>(null);
  const [test, setTest] = useState<PracticeTest | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/certifications/${certId}`)
      .then((r) => r.json())
      .then((data: Certification) => {
        setCert(data);
        setTest(data.practiceTests.find((t) => t.id === testId) ?? null);
      });
  }, [certId, testId]);

  async function handleBegin() {
    if (!test) return;
    setStarting(true);
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id }),
      });
      const { attemptId } = await res.json();
      router.push(`/certifications/${certId}/exam/${testId}/${attemptId}`);
    } catch {
      setStarting(false);
    }
  }

  if (!cert || !test) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading…
      </div>
    );
  }

  const Icon = TEST_TYPE_ICON[test.type];
  const passPercent = Math.round((cert.passingScore / cert.totalQuestions) * 100);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href={`/certifications/${certId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {cert.name}
      </Link>

      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-6">
          {/* Icon + badges */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{cert.code}</Badge>
              <Badge variant="secondary" className="text-xs">{TEST_TYPE_LABEL[test.type]}</Badge>
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">{cert.name}</p>
            <h1 className="text-2xl font-bold">{test.title}</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 w-full border rounded-xl p-4">
            <div className="flex flex-col items-center gap-1">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <p className="text-xl font-bold">{test.questionCount}</p>
              <p className="text-xs text-muted-foreground">
                {test.type === "SHUFFLE"
                  ? `from ${cert._count.questions} in pool`
                  : "Questions"}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Target className="h-5 w-5 text-muted-foreground" />
              <p className="text-xl font-bold">{passPercent}%</p>
              <p className="text-xs text-muted-foreground">To pass</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-xl font-bold">{formatTime(cert.timeLimitMinutes)}</p>
              <p className="text-xs text-muted-foreground">Time limit</p>
            </div>
          </div>

          {/* Instructions */}
          {test.type === "SHUFFLE" ? (
            <p className="text-sm text-muted-foreground max-w-sm">
              {test.questionCount} questions are randomly drawn from the full pool of{" "}
              {cert._count.questions}, proportionally across exam sections. Every attempt
              is unique — options are shuffled too. Flag questions to review later.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground max-w-sm">
              Questions and answer options are shuffled each attempt. Flag questions to
              review them later. Your progress is saved automatically.
            </p>
          )}

          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={handleBegin}
            disabled={starting}
          >
            <Play className="h-5 w-5" />
            {starting ? "Preparing exam…" : "Begin Exam"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
