"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudyModal, type SessionResult } from "@/components/flashcards/study-modal";
import { FlashcardForm } from "@/components/flashcards/flashcard-form";
import { Play, Pencil, Trash2, ChevronRight, Layers } from "lucide-react";
import type { Flashcard, Goal, StudyNote } from "@prisma/client";
import { TourButton } from "@/components/layout/tour-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StudyNoteWithCount = StudyNote & { _count: { flashcards: number } };

export default function FlashcardsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNoteWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertCode, setSelectedCertCode] = useState<string>("");
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
  }, []);

  const loadCards = useCallback(async () => {
    const res = await fetch("/api/flashcards");
    setCards(await res.json());
    setLoading(false);
  }, []);

  const loadStudyNotes = useCallback(async () => {
    const res = await fetch("/api/study-notes");
    setStudyNotes(await res.json());
  }, []);

  useEffect(() => {
    loadGoals();
    loadCards();
    loadStudyNotes();
  }, [loadGoals, loadCards, loadStudyNotes]);

  // Unique cert codes that have flashcards
  const certCodes = useMemo(() => {
    const codes = new Set(cards.map((c) => c.examCode).filter(Boolean) as string[]);
    return Array.from(codes).sort();
  }, [cards]);

  // Study notes for the selected certification, sorted by title
  const filteredNotes = useMemo(() => {
    if (!selectedCertCode) return [];
    return studyNotes
      .filter((n) => n.certCode === selectedCertCode && n._count.flashcards > 0)
      .sort((a, b) => {
        const dayA = parseInt(a.title.match(/Day (\d+)/)?.[1] || "999");
        const dayB = parseInt(b.title.match(/Day (\d+)/)?.[1] || "999");
        return dayA - dayB;
      });
  }, [studyNotes, selectedCertCode]);

  // Cards visible based on cert + optional note filter
  const filteredCards = useMemo(() => {
    if (selectedNoteId) return cards.filter((c) => c.studyNoteId === selectedNoteId);
    if (selectedCertCode) return cards.filter((c) => c.examCode === selectedCertCode);
    return cards;
  }, [cards, selectedCertCode, selectedNoteId]);

  // Stats for selected scope
  const scopeStats = useMemo(() => {
    const now = new Date();
    const due = filteredCards.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    return { total: filteredCards.length, due: due.length };
  }, [filteredCards]);

  const handleCertChange = (v: string) => {
    setSelectedCertCode(v === "all" ? "" : v);
    setSelectedNoteId("");
  };

  const handleNoteChange = (v: string) => {
    setSelectedNoteId(v === "all" ? "" : v);
  };

  const handleStartSession = (dueOnly: boolean) => {
    const pool = [...filteredCards];
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

  const handleDeleteConfirmed = async () => {
    if (!cardToDelete) return;
    await fetch(`/api/flashcards?id=${cardToDelete}`, { method: "DELETE" });
    setCardToDelete(null);
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
          />
        </div>
      </div>

      {/* Certification & study note scope selector */}
      <div id="tour-flashcards-scope" className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Study scope</label>
            <p className="text-xs text-muted-foreground">
              Pick a certification and optionally a study note to focus your session
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCertCode || "all"} onValueChange={handleCertChange}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All certifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All certifications</SelectItem>
                {certCodes.map((code) => {
                  const count = cards.filter((c) => c.examCode === code).length;
                  return (
                    <SelectItem key={code} value={code}>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mr-1">
                        {code}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{count} cards</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedCertCode && filteredNotes.length > 0 && (
              <Select value={selectedNoteId || "all"} onValueChange={handleNoteChange}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="All study notes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All study notes ({filteredNotes.reduce((s, n) => s + n._count.flashcards, 0)} cards)</SelectItem>
                  {filteredNotes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                      <span className="text-xs text-muted-foreground ml-1">({note._count.flashcards})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
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
                    const note = studyNotes.find((n) => n.id === card.studyNoteId);
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
                            {card.examCode && (
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {card.examCode}
                              </Badge>
                            )}
                            {note && (
                              <span className="text-xs text-muted-foreground">{note.title}</span>
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
                            onClick={() => setCardToDelete(card.id)}
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

      <AlertDialog open={!!cardToDelete} onOpenChange={(open) => { if (!open) setCardToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the flashcard and its review history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
