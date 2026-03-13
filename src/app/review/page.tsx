"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WeekRating } from "@/components/review/week-rating";
import { AiFeedback } from "@/components/review/ai-feedback";
import { Sparkles, Loader2, CheckCircle2, Circle, ChevronDown } from "lucide-react";
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

  const loadData = useCallback(async () => {
    const [scheduledRes, completedRes, reviewsRes] = await Promise.all([
      fetch(`/api/tasks?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`),
      fetch(`/api/tasks?completedFrom=${weekStart.toISOString()}&completedTo=${weekEnd.toISOString()}`),
      fetch("/api/reviews?limit=5"),
    ]);

    const scheduledTasks = await scheduledRes.json();
    const completedTasks = await completedRes.json();
    const reviews = await reviewsRes.json();

    setWeekStats({
      completed: completedTasks.length,
      total: scheduledTasks.length,
    });
    setPastReviews(reviews);
    setLoading(false);
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("Please rate your week first");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ai/review-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          rating,
          userNotes,
          studyMinutes,
        }),
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Review</h1>
        <p className="text-muted-foreground">
          Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This Week&apos;s Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{weekStats.completed}</span>
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Circle className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{weekStats.total}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">
                {weekStats.total > 0
                  ? Math.round((weekStats.completed / weekStats.total) * 100)
                  : 0}%
              </span>
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{studyMinutes}</span>
              <p className="text-xs text-muted-foreground">Study Min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rate Your Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">How did your week go?</Label>
            <WeekRating rating={rating} onRatingChange={setRating} />
          </div>
          <div>
            <Label htmlFor="study-min">Study minutes this week</Label>
            <Input
              id="study-min"
              type="number"
              min={0}
              value={studyMinutesInput}
              onChange={(e) => {
                setStudyMinutesInput(e.target.value);
                const num = parseInt(e.target.value, 10);
                if (!isNaN(num)) setStudyMinutes(Math.max(0, num));
              }}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Any reflections on the week..."
              rows={3}
            />
          </div>
          <Button onClick={handleSubmitReview} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {submitting ? "Analyzing..." : "Submit & Get AI Feedback"}
          </Button>
        </CardContent>
      </Card>

      {aiFeedback && <AiFeedback feedback={aiFeedback} />}

      {pastReviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Past Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {pastReviews.map((review) => {
                const isExpanded = expandedReviewId === review.id;
                const hasAi = !!(review.aiAnalysis || review.aiRecommendations);
                const hasContent = !!(review.userNotes || hasAi);
                const aiFeedbackForReview: AiReviewResponse | null = hasAi ? {
                  analysis: review.aiAnalysis ?? "",
                  recommendations: review.aiRecommendations ?? "",
                  highlights: review.aiHighlights ? JSON.parse(review.aiHighlights) : [],
                  areasForImprovement: review.aiAreasForImprovement ? JSON.parse(review.aiAreasForImprovement) : [],
                } : null;

                return (
                  <div key={review.id} className="border-b last:border-0">
                    <button
                      className={`w-full flex items-center justify-between py-3 text-left transition-colors ${hasContent ? "hover:bg-muted/40 cursor-pointer rounded-sm px-2 -mx-2" : "cursor-default"}`}
                      onClick={() => hasContent && setExpandedReviewId(isExpanded ? null : review.id)}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Week of {format(new Date(review.weekStart), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.completedTasks}/{review.totalTasks} tasks · {review.studyMinutes} study min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < (review.rating ?? 0) ? "text-yellow-400" : "text-muted-foreground/20"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {hasContent && (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </div>
                    </button>

                    {hasContent && (
                      <div className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          <div className="pb-4 pt-2 space-y-4">
                            {review.userNotes && (
                              <div className="rounded-md bg-muted/50 px-3 py-2.5">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Your notes</p>
                                <p className="text-sm whitespace-pre-wrap">{review.userNotes}</p>
                              </div>
                            )}
                            {aiFeedbackForReview && <AiFeedback feedback={aiFeedbackForReview} />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
