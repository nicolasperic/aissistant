"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudyModal, type SessionResult } from "@/components/flashcards/study-modal";
import { FlashcardForm } from "@/components/flashcards/flashcard-form";
import { Play, Pencil, Trash2, ChevronRight, Layers } from "lucide-react";
import type { Flashcard, Goal } from "@prisma/client";
import { TourButton } from "@/components/layout/tour-button";

// Collect a goal's id and all descendant ids from a flat list
function getDescendantIds(goalId: string, goals: Goal[]): string[] {
  const result: string[] = [goalId];
  const children = goals.filter((g) => g.parentId === goalId);
  for (const child of children) {
    result.push(...getDescendantIds(child.id, goals));
  }
  return result;
}

// Build a display label with type prefix for readability
function goalLabel(goal: Goal, goals: Goal[]): string {
  const depth = getDepth(goal, goals);
  const indent = "  ".repeat(depth);
  return `${indent}[${goal.type}] ${goal.title}`;
}

function getDepth(goal: Goal, goals: Goal[], depth = 0): number {
  if (!goal.parentId) return depth;
  const parent = goals.find((g) => g.id === goal.parentId);
  return parent ? getDepth(parent, goals, depth + 1) : depth;
}

const TYPE_ORDER = { YEARLY: 0, QUARTERLY: 1, MONTHLY: 2, WEEKLY: 3 };

export default function FlashcardsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    const sorted = [...data].sort(
      (a: Goal, b: Goal) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
    );
    setGoals(sorted);
  }, []);

  const loadCards = useCallback(async () => {
    const res = await fetch("/api/flashcards");
    setCards(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGoals();
    loadCards();
  }, [loadGoals, loadCards]);

  // Cards visible in manage tab (all, or filtered by selected goal scope)
  const filteredCards = useMemo(() => {
    if (!selectedGoalId) return cards;
    const ids = getDescendantIds(selectedGoalId, goals);
    return cards.filter((c) => c.goalId && ids.includes(c.goalId));
  }, [cards, selectedGoalId, goals]);

  // Stats for selected scope
  const scopeStats = useMemo(() => {
    const scoped = selectedGoalId
      ? cards.filter((c) => {
          const ids = getDescendantIds(selectedGoalId, goals);
          return c.goalId && ids.includes(c.goalId);
        })
      : cards;
    const now = new Date();
    const due = scoped.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    return { total: scoped.length, due: due.length };
  }, [cards, selectedGoalId, goals]);

  const goalsWithCards = useMemo(() => {
    const cardGoalIds = new Set(cards.map((c) => c.goalId).filter(Boolean));
    return goals.filter((g) =>
      getDescendantIds(g.id, goals).some((id) => cardGoalIds.has(id))
    );
  }, [goals, cards]);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const handleStartSession = (dueOnly: boolean) => {
    let pool: Flashcard[];
    if (selectedGoalId) {
      const ids = getDescendantIds(selectedGoalId, goals);
      pool = cards.filter((c) => c.goalId && ids.includes(c.goalId));
    } else {
      pool = [...cards];
    }
    const now = new Date();
    const due = pool.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    const notDue = pool.filter((c) => c.nextReviewAt && new Date(c.nextReviewAt) > now);
    setStudyCards(dueOnly ? due : [...due, ...notDue]);
    setStudyOpen(true);
  };

  const handleCreate = async (data: Partial<Flashcard>) => {
    await fetch("/api/flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    loadCards();
  };

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setEditOpen(true);
  };

  const handleEditSubmit = async (data: Partial<Flashcard>) => {
    await fetch("/api/flashcards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingCard!.id, ...data }),
    });
    loadCards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flashcard?")) return;
    await fetch(`/api/flashcards?id=${id}`, { method: "DELETE" });
    loadCards();
  };

  const handleSessionComplete = (_results: SessionResult[]) => {
    loadCards(); // refresh stats
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">Active recall sessions for exam prep</p>
        </div>
        <div className="flex items-center gap-2">
          <TourButton tourId="flashcards" autoStart={cards.length === 0} />
          <FlashcardForm
            goals={goals}
            onSubmit={handleCreate}
            defaultGoalId={selectedGoalId}
          />
        </div>
      </div>

      {/* Goal scope selector */}
      <div id="tour-flashcards-scope" className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Study scope</label>
            <p className="text-xs text-muted-foreground">
              Pick a goal to study only cards in that scope, or leave empty for all cards
            </p>
          </div>
          <Select value={selectedGoalId || "all"} onValueChange={(v) => setSelectedGoalId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="All flashcards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All flashcards</SelectItem>
              {goalsWithCards.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="text-muted-foreground text-xs mr-1">[{g.type}]</span>
                  {g.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scope stats + start button */}
        <div id="tour-flashcards-session" className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{scopeStats.total}</div>
              <div className="text-xs text-muted-foreground">Total cards</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{scopeStats.due}</div>
              <div className="text-xs text-muted-foreground">Due for review</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleStartSession(true)}
              disabled={scopeStats.due === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Due only
              <Badge variant="secondary" className="ml-2 text-xs">{scopeStats.due}</Badge>
            </Button>
            <Button
              onClick={() => handleStartSession(false)}
              disabled={scopeStats.total === 0}
            >
              <Layers className="h-4 w-4 mr-2" />
              Full deck
              <Badge variant="secondary" className="ml-2 text-xs">{scopeStats.total}</Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Card manager */}
      <Tabs id="tour-flashcards-manage" defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All cards
            {filteredCards.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">{filteredCards.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="due">
            Due now
            {scopeStats.due > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">{scopeStats.due}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {(["all", "due"] as const).map((tab) => {
          const tabCards =
            tab === "due"
              ? filteredCards.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= new Date())
              : filteredCards;

          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {tabCards.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <Layers className="h-8 w-8 mx-auto opacity-30" />
                  <p className="text-sm">
                    {tab === "due" ? "No cards due right now" : "No flashcards yet"}
                  </p>
                  {tab === "all" && (
                    <p className="text-xs">Add cards using the button above, or select a different scope</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {tabCards.map((card) => {
                    const linkedGoal = goals.find((g) => g.id === card.goalId);
                    const now = new Date();
                    const isDue = !card.nextReviewAt || new Date(card.nextReviewAt) <= now;
                    return (
                      <div
                        key={card.id}
                        className="rounded-lg border bg-card p-4 flex items-start gap-4"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium leading-snug">{card.question}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{card.answer}</p>
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{card.topic}</Badge>
                            {linkedGoal && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                {linkedGoal.type}: {linkedGoal.title}
                              </Badge>
                            )}
                            {isDue ? (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                Due
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Next:{" "}
                                {new Date(card.nextReviewAt!).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            {(card.correctCount > 0 || card.incorrectCount > 0) && (
                              <span className="text-xs text-muted-foreground">
                                ✓ {card.correctCount} · ✗ {card.incorrectCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(card)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(card.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Edit modal */}
      <FlashcardForm
        goals={goals}
        onSubmit={handleEditSubmit}
        initialData={editingCard}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Study session modal */}
      <StudyModal
        open={studyOpen}
        onClose={() => setStudyOpen(false)}
        cards={studyCards}
        onSessionComplete={handleSessionComplete}
      />
    </div>
  );
}
