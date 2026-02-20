"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ThumbsUp, AlertTriangle } from "lucide-react";
import type { AiReviewResponse } from "@/lib/types";

export function AiFeedback({ feedback }: { feedback: AiReviewResponse }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-base">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {feedback.analysis.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <CardTitle className="text-sm">Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="mt-0.5 h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                    {i + 1}
                  </Badge>
                  {h}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="mt-0.5 h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                    {i + 1}
                  </Badge>
                  {a}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {feedback.recommendations.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
