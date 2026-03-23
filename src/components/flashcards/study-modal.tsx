"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, Zap, Eye } from "lucide-react";
import type { Flashcard } from "@prisma/client";

type CardRating = "EASY" | "MEDIUM" | "HARD" | "MISSED";

interface StudyModalProps {
  open: boolean;
  onClose: () => void;
  cards: Flashcard[];
  onSessionComplete: (results: SessionResult[]) => void;
}

export interface SessionResult {
  cardId: string;
  rating: CardRating;
}

export function StudyModal({ open, onClose, cards, onSessionComplete }: StudyModalProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [done, setDone] = useState(false);

  const current = cards[index];
  const progress = cards.length > 0 ? Math.round((index / cards.length) * 100) : 0;

  if (!done && !current) return null;

  const handleFlip = () => setFlipped(true);

  const handleRate = async (rating: CardRating) => {
    const newResults = [...results, { cardId: current.id, rating }];
    setResults(newResults);

    await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: current.id, rating }),
    });

    if (index + 1 >= cards.length) {
      setDone(true);
      onSessionComplete(newResults);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  const handleClose = () => {
    setIndex(0);
    setFlipped(false);
    setResults([]);
    setDone(false);
    onClose();
  };

  const summary = {
    easy: results.filter((r) => r.rating === "EASY").length,
    medium: results.filter((r) => r.rating === "MEDIUM").length,
    hard: results.filter((r) => r.rating === "HARD").length,
    missed: results.filter((r) => r.rating === "MISSED").length,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg border-0 bg-background/95 backdrop-blur-md shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {done ? (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold">Session complete!</h2>
              <p className="text-muted-foreground text-sm mt-1">{cards.length} cards reviewed</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{summary.easy}</div>
                <div className="text-xs text-muted-foreground mt-1">Easy</div>
              </div>
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.medium}</div>
                <div className="text-xs text-muted-foreground mt-1">Medium</div>
              </div>
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.hard}</div>
                <div className="text-xs text-muted-foreground mt-1">Hard</div>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{summary.missed}</div>
                <div className="text-xs text-muted-foreground mt-1">Missed</div>
              </div>
            </div>

            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {current.topic}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {index + 1} / {cards.length}
              </span>
            </div>

            <Progress value={progress} className="h-1" />

            {/* Card */}
            <div
              className="min-h-[180px] rounded-xl border bg-card p-6 flex flex-col justify-center cursor-pointer select-none transition-all duration-200 hover:border-primary/50"
              onClick={!flipped ? handleFlip : undefined}
            >
              {!flipped ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
                  <p className="text-base font-medium leading-relaxed">{current.question}</p>
                  {current.hint && (
                    <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                      Hint: {current.hint}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 pt-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to reveal answer</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">Answer</p>
                  <p className="text-base leading-relaxed">{current.answer}</p>
                </div>
              )}
            </div>

            {/* Rating buttons */}
            {flipped ? (
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground">How did you do?</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 border-green-500/40 hover:bg-green-500/10 hover:text-green-600"
                    onClick={() => handleRate("EASY")}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Easy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-600"
                    onClick={() => handleRate("MEDIUM")}
                  >
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs">Medium</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-600"
                    onClick={() => handleRate("HARD")}
                  >
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs">Hard</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 border-red-500/40 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => handleRate("MISSED")}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs">Missed</span>
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleFlip}>
                <Eye className="h-4 w-4 mr-2" />
                Reveal answer
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
