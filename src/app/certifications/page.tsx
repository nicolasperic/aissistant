"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Clock, Target, BookOpen, ChevronRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PracticeTest = {
  id: string;
  title: string;
  type: "OFFICIAL" | "AI_GENERATED" | "SHUFFLE";
  questionCount: number;
  _count: { attempts: number };
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
  _count: { sections: number; questions: number };
  practiceTests: PracticeTest[];
};

const TEST_TYPE_LABEL: Record<PracticeTest["type"], string> = {
  OFFICIAL: "Official",
  AI_GENERATED: "AI Generated",
  SHUFFLE: "Shuffle",
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certifications")
      .then((r) => r.json())
      .then((data) => {
        setCerts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Loading certifications…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Certification Catalog</h1>
          <p className="text-sm text-muted-foreground">Pick a certification and start practicing</p>
        </div>
      </div>

      {certs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No certifications found.
        </div>
      )}

      <div className="grid gap-4">
        {certs.map((cert) => {
          const totalAttempts = cert.practiceTests.reduce(
            (sum, t) => sum + t._count.attempts,
            0
          );
          const passPercent = Math.round((cert.passingScore / cert.totalQuestions) * 100);

          return (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {cert.code}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {cert.provider}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug">{cert.name}</h2>
                    {cert.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {cert.description}
                      </p>
                    )}
                  </div>
                  <Link href={`/certifications/${cert.id}`}>
                    <Button className="shrink-0 gap-1">
                      View <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {cert._count.questions} questions in pool
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    Pass: {cert.passingScore}/{cert.totalQuestions} ({passPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(cert.timeLimitMinutes)}
                  </span>
                  {totalAttempts > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4" />
                      {totalAttempts} attempt{totalAttempts !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {cert.practiceTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                    >
                      <span className="font-medium">{TEST_TYPE_LABEL[test.type]}</span>
                      <span className="text-muted-foreground">
                        · {test.questionCount}q
                        {test._count.attempts > 0 && ` · ${test._count.attempts} taken`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
