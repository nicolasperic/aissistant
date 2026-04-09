"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  Target,
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Shuffle,
  Bot,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Attempt = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  totalQuestions: number;
  passed: boolean | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
};

type PracticeTest = {
  id: string;
  title: string;
  type: "OFFICIAL" | "AI_GENERATED" | "SHUFFLE";
  questionCount: number;
  attempts: Attempt[];
};

type Section = {
  id: string;
  name: string;
  percentage: number;
};

type Certification = {
  id: string;
  name: string;
  code: string;
  provider: string;
  description: string | null;
  totalQuestions: number;
  passingScore: number;
  timeLimitMinutes: number;
  sections: Section[];
  _count: { questions: number };
  practiceTests: PracticeTest[];
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

function bestAttempt(attempts: Attempt[]) {
  const completed = attempts.filter((a) => a.status === "COMPLETED" && a.score !== null);
  if (!completed.length) return null;
  return completed.reduce((best, a) => (a.score! > best.score! ? a : best));
}

export default function CertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/certifications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCert(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Certification not found.
      </div>
    );
  }

  const passPercent = Math.round((cert.passingScore / cert.totalQuestions) * 100);

  // Flatten all completed attempts across tests for history table
  const allAttempts = cert.practiceTests
    .flatMap((t) =>
      t.attempts
        .filter((a) => a.status === "COMPLETED")
        .map((a) => ({ ...a, testTitle: t.title, testType: t.type }))
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/certifications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Certification Catalog
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">{cert.code}</Badge>
            <Badge variant="secondary" className="text-xs">{cert.provider}</Badge>
          </div>
          <h1 className="text-2xl font-bold leading-snug">{cert.name}</h1>
          {cert.description && (
            <p className="text-sm text-muted-foreground mt-1">{cert.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center text-center">
            <BookOpen className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{cert._count.questions}</p>
            <p className="text-xs text-muted-foreground">Questions in pool</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center text-center">
            <Target className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{cert.passingScore}/{cert.totalQuestions}</p>
            <p className="text-xs text-muted-foreground">Passing score ({passPercent}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col items-center text-center">
            <Clock className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold">{formatTime(cert.timeLimitMinutes)}</p>
            <p className="text-xs text-muted-foreground">Time limit</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections breakdown */}
      {cert.sections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Exam Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cert.sections.map((sec) => (
              <div key={sec.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{sec.name}</span>
                  <span className="text-muted-foreground font-medium">{sec.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${sec.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Practice Tests */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Practice Tests</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cert.practiceTests.map((test) => {
            const Icon = TEST_TYPE_ICON[test.type];
            const best = bestAttempt(test.attempts);
            const completedCount = test.attempts.filter(
              (a) => a.status === "COMPLETED"
            ).length;

            return (
              <Card key={test.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {TEST_TYPE_LABEL[test.type]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{test.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    {test.type === "SHUFFLE" ? (
                      <p>
                        Draws{" "}
                        <span className="font-medium text-foreground">{test.questionCount}</span>
                        {" from pool of "}
                        <span className="font-medium text-foreground">{cert._count.questions}</span>
                      </p>
                    ) : (
                      <p>{test.questionCount} questions</p>
                    )}
                    {completedCount > 0 ? (
                      <p>{completedCount} attempt{completedCount !== 1 ? "s" : ""} taken</p>
                    ) : (
                      <p>Not attempted yet</p>
                    )}
                    {best && (
                      <p className="flex items-center gap-1">
                        Best:{" "}
                        <span className="font-medium text-foreground">
                          {best.score}/{best.totalQuestions}
                        </span>
                        {best.passed ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/certifications/${cert.id}/exam/${test.id}`}
                    className="mt-auto"
                  >
                    <Button className="w-full gap-2" size="sm">
                      <Play className="h-3.5 w-3.5" />
                      Start Exam
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Attempt History */}
      {allAttempts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Attempt History</h2>
          <Card>
            <CardContent className="pt-4 p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Test</th>
                    <th className="text-center px-4 py-2 font-medium">Score</th>
                    <th className="text-center px-4 py-2 font-medium">Result</th>
                    <th className="text-right px-4 py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(attempt.startedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {attempt.testTitle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {attempt.score !== null
                          ? `${attempt.score}/${attempt.totalQuestions}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {attempt.passed === true ? (
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" /> Pass
                          </span>
                        ) : attempt.passed === false ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Fail
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {attempt.durationSeconds !== null
                          ? formatDuration(attempt.durationSeconds)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
