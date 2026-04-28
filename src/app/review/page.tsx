"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp, Clock, Target, LayoutGrid, Zap } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { AiReviewResponse } from "@/lib/types";
import type { WeeklyReview } from "@prisma/client";
import { useSettings } from "@/components/layout/settings-context";

export default function ReviewPage() {
  const { settings: { weekStartsOn } } = useSettings();
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [studyMinutesInput, setStudyMinutesInput] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiReviewResponse | null>(null);
  const [weekStats, setWeekStats] = useState({ completed: 0, total: 0 });
  const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { weekStart, weekEnd } = useMemo(() => ({
    weekStart: startOfWeek(new Date(), { weekStartsOn }),
    weekEnd: endOfWeek(new Date(), { weekStartsOn }),
  }), [weekStartsOn]);

  const weekRange = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
  const completionPct = weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0;

  const loadData = useCallback(async () => {
    const [scheduledRes, completedRes, reviewsRes] = await Promise.all([
      fetch(`/api/tasks?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`),
      fetch(`/api/tasks?completedFrom=${weekStart.toISOString()}&completedTo=${weekEnd.toISOString()}`),
      fetch("/api/reviews"),
    ]);
    const scheduledTasks = await scheduledRes.json();
    const completedTasks = await completedRes.json();
    const reviews = await reviewsRes.json();
    setWeekStats({ completed: completedTasks.length, total: scheduledTasks.length });
    setPastReviews(reviews);
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitReview = async () => {
    if (rating === 0) { alert("Please rate your week first"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ai/review-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), rating, userNotes, studyMinutes }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      const data = await res.json();
      setAiFeedback(data.aiResponse);
      loadData();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Check that your ANTHROPIC_API_KEY is configured.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-v2 fade-up">
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2">Weekly Review</h1>
          <p className="page-sub-v2"><span className="mono" style={{ color: "var(--ink-2)" }}>{weekRange}</span></p>
        </div>
      </div>

      {/* THIS WEEK STATS */}
      <div className="card-v2" style={{ padding: 20, marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>This week&#39;s stats</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          <ReviewStat icon={Check} iconColor="var(--v2-success)" value={weekStats.completed} label="Completed" />
          <ReviewStat icon={LayoutGrid} iconColor="var(--ink-3)" value={weekStats.total} label="Total tasks" />
          <ReviewStat icon={Target} iconColor="var(--v2-accent)" value={`${completionPct}%`} label="Completion" />
          <ReviewStat icon={Clock} iconColor="var(--ink-3)" value={studyMinutes} label="Study min" />
        </div>
      </div>

      {/* RATE YOUR WEEK */}
      <div className="card-v2" style={{ padding: 20, marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Rate your week</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>How did your week go?</label>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} className="btn-v2-icon" style={{
                width: 28, height: 28,
                color: n <= rating ? "var(--v2-warn)" : "var(--ink-4)",
                fontSize: 18,
              }}>&#9733;</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14, maxWidth: 240 }}>
          <label style={{ fontSize: 13, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Study minutes this week</label>
          <input
            className="input-v2"
            type="number"
            value={studyMinutesInput}
            onChange={(e) => {
              setStudyMinutesInput(e.target.value);
              const num = parseInt(e.target.value, 10);
              if (!isNaN(num)) setStudyMinutes(Math.max(0, num));
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Notes (optional)</label>
          <textarea
            className="input-v2"
            placeholder="Any reflections on the week..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            style={{ height: 80, padding: 10, resize: "vertical" }}
          />
        </div>

        <button className="btn-v2 btn-v2-accent" onClick={handleSubmitReview} disabled={submitting}>
          {submitting ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
          {submitting ? "Analyzing..." : "Submit & Get AI Feedback"}
        </button>
      </div>

      {/* AI Feedback (inline after submit) */}
      {aiFeedback && <AiFeedbackCard feedback={aiFeedback} />}

      {/* PAST REVIEWS */}
      {pastReviews.length > 0 && (
        <div className="section-v2" style={{ marginTop: 28 }}>
          <div className="section-hd-v2">
            <h3>Past reviews</h3>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{pastReviews.length} weeks</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pastReviews.map(rv => (
              <PastReviewCard
                key={rv.id}
                review={rv}
                open={expandedReviewId === rv.id}
                onToggle={() => setExpandedReviewId(expandedReviewId === rv.id ? null : rv.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Review Stat ──────────────────────────────────────────── */
function ReviewStat({ icon: Icon, iconColor, value, label }: {
  icon: typeof Check; iconColor: string; value: string | number; label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: "var(--bg-elev-2)", border: "1px solid var(--line-soft)",
        color: iconColor, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <Icon size={14} strokeWidth={1.6} />
      </span>
      <div>
        <div className="stat-num" style={{ fontSize: 22 }}>{value}</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── AI Feedback Card ─────────────────────────────────────── */
function AiFeedbackCard({ feedback }: { feedback: AiReviewResponse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
      <div className="card-v2" style={{ padding: 16, background: "var(--accent-soft)", borderColor: "var(--accent-dim)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Sparkles size={14} strokeWidth={1.5} style={{ color: "var(--v2-accent)" }} />
          <span className="eyebrow" style={{ color: "var(--v2-accent)" }}>AI Analysis</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>{feedback.analysis}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card-v2" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Zap size={13} strokeWidth={1.5} style={{ color: "var(--v2-success)" }} />
            <span className="eyebrow" style={{ color: "var(--v2-success)" }}>Highlights</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "var(--ink-2)", fontSize: 12.5, lineHeight: 1.6 }}>
            {feedback.highlights.map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
          </ol>
        </div>
        <div className="card-v2" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Target size={13} strokeWidth={1.5} style={{ color: "var(--v2-warn)" }} />
            <span className="eyebrow" style={{ color: "var(--v2-warn)" }}>Areas to improve</span>
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, color: "var(--ink-2)", fontSize: 12.5, lineHeight: 1.6 }}>
            {feedback.areasForImprovement.map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
          </ol>
        </div>
      </div>

      <div className="card-v2" style={{ padding: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Recommendations</div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>{feedback.recommendations}</p>
      </div>
    </div>
  );
}

/* ── Past Review Card ─────────────────────────────────────── */
function PastReviewCard({ review, open, onToggle }: {
  review: WeeklyReview; open: boolean; onToggle: () => void;
}) {
  const hasAi = !!(review.aiAnalysis || review.aiRecommendations);
  const hasContent = !!(review.userNotes || hasAi);
  const aiFeedback: AiReviewResponse | null = hasAi ? {
    analysis: review.aiAnalysis ?? "",
    recommendations: review.aiRecommendations ?? "",
    highlights: review.aiHighlights ? JSON.parse(review.aiHighlights) : [],
    areasForImprovement: review.aiAreasForImprovement ? JSON.parse(review.aiAreasForImprovement) : [],
  } : null;

  return (
    <div className="card-v2" style={{ padding: 0, borderColor: open ? "var(--line)" : "var(--line-soft)", overflow: "hidden" }}>
      <button onClick={hasContent ? onToggle : undefined} style={{
        width: "100%", textAlign: "left", border: 0, background: "transparent", color: "inherit",
        padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 16,
        cursor: hasContent ? "default" : "default",
        fontFamily: "inherit",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            Week of {format(new Date(review.weekStart), "MMM d, yyyy")}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            {review.completedTasks}/{review.totalTasks} tasks · {review.studyMinutes} study min
          </div>
        </div>
        <div style={{ display: "flex", gap: 1 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} style={{ color: n <= (review.rating ?? 0) ? "var(--v2-warn)" : "var(--ink-4)", fontSize: 14 }}>&#9733;</span>
          ))}
        </div>
        {hasContent && (
          open ? <ChevronUp size={14} strokeWidth={1.5} style={{ color: "var(--ink-3)" }} /> : <ChevronDown size={14} strokeWidth={1.5} style={{ color: "var(--ink-3)" }} />
        )}
      </button>

      {open && hasContent && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--line-soft)" }}>
          {review.userNotes && (
            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Your notes</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{review.userNotes}</p>
            </div>
          )}
          {aiFeedback && <AiFeedbackCard feedback={aiFeedback} />}
        </div>
      )}
    </div>
  );
}
