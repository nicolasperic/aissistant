"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  Target,
  BookOpen,
  ChevronLeft,
  Play,
  Check,
  X,
  Shuffle,
  Bot,
  FileText,
} from "lucide-react";

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

function BigStat({ icon: Icon, value, label }: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
  value: string | number;
  label: string;
}) {
  return (
    <div className="card-v2" style={{ padding: "20px 18px", textAlign: "center" }}>
      <Icon size={16} strokeWidth={1.5} style={{ color: "var(--ink-3)", marginBottom: 8 }} />
      <div className="stat-num" style={{ fontSize: 28, marginBottom: 4 }}>{value}</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{label}</div>
    </div>
  );
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
      <div className="page-v2 fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--ink-3)" }}>
        Loading…
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="page-v2 fade-up" style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-3)", fontSize: 13 }}>
        Certification not found.
      </div>
    );
  }

  const passPercent = Math.round((cert.passingScore / cert.totalQuestions) * 100);

  const allAttempts = cert.practiceTests
    .flatMap((t) =>
      t.attempts
        .filter((a) => a.status === "COMPLETED")
        .map((a) => ({ ...a, testTitle: t.title, testType: t.type }))
    )
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="page-v2 fade-up" style={{ maxWidth: 1080 }}>
      {/* Back */}
      <Link href="/certifications">
        <button className="btn-v2 btn-v2-sm btn-v2-ghost" style={{ marginBottom: 14 }}>
          <ChevronLeft size={11} strokeWidth={2} /> Certification Catalog
        </button>
      </Link>

      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--bg-elev-2)", border: "1px solid var(--line)",
          display: "grid", placeItems: "center", color: "var(--ink-2)", flex: "none",
        }}>
          <GraduationCap size={20} strokeWidth={1.6} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span className="pill-v2 mono" style={{ whiteSpace: "nowrap" }}>{cert.code}</span>
            <span className="pill-v2" style={{ whiteSpace: "nowrap" }}>{cert.provider}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink)" }}>{cert.name}</h1>
          {cert.description && (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55, maxWidth: 800 }}>
              {cert.description}
            </p>
          )}
        </div>
      </div>

      {/* 3 stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <BigStat icon={BookOpen} value={cert._count.questions} label="Questions in pool" />
        <BigStat icon={Target} value={`${cert.passingScore}/${cert.totalQuestions}`} label={`Passing score (${passPercent}%)`} />
        <BigStat icon={Clock} value={formatTime(cert.timeLimitMinutes)} label="Time limit" />
      </div>

      {/* Exam Sections */}
      {cert.sections.length > 0 && (
        <div className="card-v2" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>Exam Sections</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cert.sections.map((sec) => (
              <div key={sec.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                  <span style={{ color: "var(--ink-2)" }}>{sec.name}</span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>{sec.percentage}%</span>
                </div>
                <div className="bar-v2">
                  <span style={{ width: `${sec.percentage * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Tests */}
      <div className="section-v2" style={{ marginTop: 0, marginBottom: 24 }}>
        <div className="section-hd-v2">
          <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, textTransform: "none", letterSpacing: 0, color: "var(--ink)", fontWeight: 500 }}>Practice Tests</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {cert.practiceTests.map((test) => {
            const TypeIcon = TEST_TYPE_ICON[test.type];
            const isOfficial = test.type === "OFFICIAL";
            const isShuffle = test.type === "SHUFFLE";
            const best = bestAttempt(test.attempts);
            const completedCount = test.attempts.filter((a) => a.status === "COMPLETED").length;

            return (
              <div key={test.id} className="card-v2" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <TypeIcon size={11} strokeWidth={1.6}
                    style={{ color: isOfficial ? "var(--v2-accent)" : "var(--ink-3)" }} />
                  <span className="pill-v2" style={{
                    color: isOfficial ? "var(--v2-accent)" : "var(--ink-2)",
                    background: isOfficial ? "var(--accent-soft)" : "var(--bg-elev-2)",
                    borderColor: isOfficial ? "var(--accent-dim)" : "var(--line)",
                  }}>{TEST_TYPE_LABEL[test.type]}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", color: "var(--ink)" }}>{test.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.55, flex: 1 }}>
                  {isShuffle ? (
                    <>Draws <span className="mono" style={{ color: "var(--ink)" }}>{test.questionCount}</span> from pool of <span className="mono" style={{ color: "var(--ink)" }}>{cert._count.questions}</span></>
                  ) : (
                    <><span className="mono" style={{ color: "var(--ink)" }}>{test.questionCount}</span> questions</>
                  )}
                  <br />
                  {completedCount > 0 ? (
                    <><span className="mono" style={{ color: "var(--ink)" }}>{completedCount}</span> attempts taken</>
                  ) : (
                    <span>Not attempted yet</span>
                  )}
                  {best && (
                    <>
                      <br />Best: <span className="mono" style={{ color: "var(--ink)" }}>{best.score}/{best.totalQuestions}</span>{" "}
                      {best.passed ? (
                        <Check size={10} strokeWidth={2} style={{ color: "var(--v2-success)", verticalAlign: "middle", display: "inline" }} />
                      ) : (
                        <X size={10} strokeWidth={2} style={{ color: "var(--v2-danger)", verticalAlign: "middle", display: "inline" }} />
                      )}
                    </>
                  )}
                </div>
                <Link href={`/certifications/${cert.id}/exam/${test.id}`}>
                  <button className="btn-v2" style={{ justifyContent: "center", width: "100%" }}>
                    <Play size={11} strokeWidth={2} /> Start Exam
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attempt History */}
      {allAttempts.length > 0 && (
        <div className="section-v2" style={{ marginTop: 0 }}>
          <div className="section-hd-v2">
            <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, textTransform: "none", letterSpacing: 0, color: "var(--ink)", fontWeight: 500 }}>Attempt History</h3>
          </div>
          <div className="card-v2" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.8fr 0.8fr 0.8fr",
              padding: "10px 18px", borderBottom: "1px solid var(--line)",
              fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", fontFamily: "var(--font-mono)",
            }}>
              <span>Date</span><span>Test</span><span>Score</span><span>Result</span><span style={{ textAlign: "right" }}>Duration</span>
            </div>
            {allAttempts.map((attempt, i) => (
              <div key={attempt.id} style={{
                display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.8fr 0.8fr 0.8fr",
                padding: "12px 18px", alignItems: "center",
                borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                fontSize: 13,
              }}>
                <span className="mono" style={{ color: "var(--ink-2)" }}>{formatDate(attempt.startedAt)}</span>
                <span style={{ color: "var(--ink)" }}>{attempt.testTitle}</span>
                <span className="mono" style={{ color: "var(--ink)" }}>
                  {attempt.score !== null ? `${attempt.score}/${attempt.totalQuestions}` : "—"}
                </span>
                <span style={{
                  color: attempt.passed ? "var(--v2-success)" : "var(--v2-danger)",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  {attempt.passed === true ? (
                    <><Check size={11} strokeWidth={2} /> Pass</>
                  ) : attempt.passed === false ? (
                    <><X size={11} strokeWidth={2} /> Fail</>
                  ) : "—"}
                </span>
                <span className="mono" style={{ color: "var(--ink-2)", textAlign: "right" }}>
                  {attempt.durationSeconds !== null ? formatDuration(attempt.durationSeconds) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
