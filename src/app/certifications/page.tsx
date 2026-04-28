"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Clock, Target, BookOpen, ChevronRight, Award, Play } from "lucide-react";

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

function Stat({ icon: Icon, children }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 12 }}>
      <Icon size={12} strokeWidth={1.5} /> <span>{children}</span>
    </span>
  );
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
      <div className="page-v2 fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--ink-3)" }}>
        Loading certifications…
      </div>
    );
  }

  return (
    <div className="page-v2 fade-up" style={{ maxWidth: 920 }}>
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GraduationCap size={20} strokeWidth={1.6} style={{ color: "var(--ink-2)" }} />
            Certification Catalog
          </h1>
          <p className="page-sub-v2">Pick a certification and start practicing.</p>
        </div>
      </div>

      {certs.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          No certifications found.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {certs.map((cert) => {
            const totalAttempts = cert.practiceTests.reduce(
              (sum, t) => sum + t._count.attempts,
              0
            );
            const passPercent = Math.round((cert.passingScore / cert.totalQuestions) * 100);

            return (
              <div key={cert.id} className="card-v2" style={{ padding: "20px 22px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="pill-v2 mono" style={{ whiteSpace: "nowrap" }}>{cert.code}</span>
                      <span className="pill-v2" style={{ whiteSpace: "nowrap" }}>{cert.provider}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink)" }}>
                      {cert.name}
                    </h2>
                    {cert.description && (
                      <p style={{ margin: "6px 0 14px", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.55, maxWidth: 700 }}>
                        {cert.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: cert.description ? 0 : 14 }}>
                      <Stat icon={BookOpen}>
                        <span className="mono" style={{ color: "var(--ink)" }}>{cert._count.questions}</span> questions in pool
                      </Stat>
                      <Stat icon={Target}>
                        Pass: <span className="mono" style={{ color: "var(--ink)" }}>{cert.passingScore}/{cert.totalQuestions}</span> ({passPercent}%)
                      </Stat>
                      <Stat icon={Clock}>
                        <span className="mono">{formatTime(cert.timeLimitMinutes)}</span>
                      </Stat>
                      {totalAttempts > 0 && (
                        <Stat icon={Play}>
                          <span className="mono" style={{ color: "var(--ink)" }}>{totalAttempts}</span> attempts
                        </Stat>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                      {cert.practiceTests.map((test) => (
                        <span key={test.id} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 9px",
                          fontSize: 11, fontWeight: 500,
                          fontFamily: "var(--font-mono)",
                          borderRadius: 5,
                          whiteSpace: "nowrap",
                          color: test.type === "OFFICIAL" ? "var(--v2-accent)" : "var(--ink-2)",
                          background: test.type === "OFFICIAL" ? "var(--accent-soft)" : "var(--bg-elev-2)",
                          border: `0.5px solid ${test.type === "OFFICIAL" ? "var(--accent-dim)" : "var(--line)"}`,
                          letterSpacing: 0,
                        }}>
                          {TEST_TYPE_LABEL[test.type]} · {test.questionCount}q{test._count.attempts > 0 ? ` · ${test._count.attempts} taken` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/certifications/${cert.id}`}>
                    <button className="btn-v2-primary">
                      View <ChevronRight size={11} strokeWidth={2} />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
