"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WeekRating } from "@/components/review/week-rating";
import { AiFeedback } from "@/components/review/ai-feedback";
import { Sparkles, Loader2, CheckCircle2, Circle } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { AiReviewResponse } from "@/lib/types";
import type { WeeklyReview } from "@prisma/client";

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiReviewResponse | null>(null);
  const [weekStats, setWeekStats] = useState({ completed: 0, total: 0 });
  const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const loadData = useCallback(async () => {
    const [tasksRes, reviewsRes] = await Promise.all([
      fetch(`/api/tasks?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`),
      fetch("/api/reviews?limit=5"),
    ]);

    const tasks = await tasksRes.json();
    const reviews = await reviewsRes.json();

    setWeekStats({
      completed: tasks.filter((t: { status: string }) => t.status === "COMPLETED").length,
      total: tasks.length,
    });
    setPastReviews(reviews);
    setLoading(false);
  }, []);

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
              value={studyMinutes}
              onChange={(e) => setStudyMinutes(Number(e.target.value))}
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
            <div className="space-y-3">
              {pastReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      Week of {format(new Date(review.weekStart), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {review.completedTasks}/{review.totalTasks} tasks | {review.studyMinutes} study min
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < (review.rating ?? 0) ? "text-yellow-400" : "text-muted-foreground/20"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
