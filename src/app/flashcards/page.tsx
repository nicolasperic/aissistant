"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { StudyModal, type SessionResult } from "@/components/flashcards/study-modal";
import { FlashcardForm } from "@/components/flashcards/flashcard-form";
import { Play, Pencil, Trash2, ChevronRight, ChevronDown, ChevronUp, Layers, Filter, Plus } from "lucide-react";
import { SegmentedControl } from "@/components/v2/primitives";
import type { Flashcard, Goal } from "@prisma/client";
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

function getDescendantIds(goalId: string, goals: Goal[]): string[] {
  const result: string[] = [goalId];
  const children = goals.filter((g) => g.parentId === goalId);
  for (const child of children) result.push(...getDescendantIds(child.id, goals));
  return result;
}

function getCertAncestor(goal: Goal, goals: Goal[]): Goal | null {
  if (goal.type === "QUARTERLY") return goal.shortName ? goal : null;
  if (!goal.parentId) return null;
  const parent = goals.find((g) => g.id === goal.parentId);
  return parent ? getCertAncestor(parent, goals) : null;
}

const TYPE_ORDER = { YEARLY: 0, QUARTERLY: 1, MONTHLY: 2, WEEKLY: 3 };

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n).trim() + "…" : s; }

export default function FlashcardsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "due">("due");
  const [mode, setMode] = useState<"dueOnly" | "fullDeck">("dueOnly");

  const loadGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals([...data].sort((a: Goal, b: Goal) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)));
  }, []);

  const loadCards = useCallback(async () => {
    const res = await fetch("/api/flashcards");
    setCards(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadGoals(); loadCards(); }, [loadGoals, loadCards]);

  const filteredCards = useMemo(() => {
    if (!selectedGoalId) return cards;
    const ids = getDescendantIds(selectedGoalId, goals);
    return cards.filter((c) => c.goalId && ids.includes(c.goalId));
  }, [cards, selectedGoalId, goals]);

  const scopeStats = useMemo(() => {
    const scoped = selectedGoalId
      ? cards.filter((c) => { const ids = getDescendantIds(selectedGoalId, goals); return c.goalId && ids.includes(c.goalId); })
      : cards;
    const now = new Date();
    const due = scoped.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    return { total: scoped.length, due: due.length };
  }, [cards, selectedGoalId, goals]);

  const goalsWithCards = useMemo(() => {
    const cardGoalIds = new Set(cards.map((c) => c.goalId).filter(Boolean));
    return goals.filter((g) => getDescendantIds(g.id, goals).some((id) => cardGoalIds.has(id)));
  }, [goals, cards]);

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
    await fetch("/api/flashcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    loadCards();
  };

  const handleEdit = (card: Flashcard) => { setEditingCard(card); setEditOpen(true); };

  const handleEditSubmit = async (data: Partial<Flashcard>) => {
    await fetch("/api/flashcards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingCard!.id, ...data }) });
    loadCards();
  };

  const handleDeleteConfirmed = async () => {
    if (!cardToDelete) return;
    await fetch(`/api/flashcards?id=${cardToDelete}`, { method: "DELETE" });
    setCardToDelete(null);
    loadCards();
  };

  const handleSessionComplete = (_results: SessionResult[]) => { loadCards(); };

  const now = new Date();
  const tabCards = tab === "due"
    ? filteredCards.filter((c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now)
    : filteredCards;

  if (loading) {
    return (
      <div className="page-v2 fade-up flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="mono" style={{ color: "var(--ink-3)", fontSize: 13 }}>Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="page-v2 fade-up">
      <div className="page-hd-v2">
        <div>
          <h1 className="page-title-v2">Flashcards</h1>
          <p className="page-sub-v2">Active recall sessions for exam prep.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <FlashcardForm goals={goals} onSubmit={handleCreate} defaultGoalId={selectedGoalId} />
        </div>
      </div>

      {/* SCOPE PICKER */}
      <div className="card-v2" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Study scope</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              Pick a goal to study only cards in that scope, or leave empty for all cards.
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              className={`btn-v2 btn-v2-sm ${!selectedGoalId ? "btn-v2-accent" : ""}`}
              onClick={() => setSelectedGoalId("")}
            >
              All
            </button>
            {goalsWithCards.slice(0, 3).map(g => (
              <button
                key={g.id}
                className={`btn-v2 btn-v2-sm ${selectedGoalId === g.id ? "btn-v2-accent" : ""}`}
                onClick={() => setSelectedGoalId(g.id)}
              >
                {g.title.length > 20 ? g.title.slice(0, 20) + "…" : g.title}
              </button>
            ))}
          </div>
        </div>

        {/* Counts + mode buttons */}
        <div style={{
          display: "grid", gridTemplateColumns: "auto auto 1fr auto auto", alignItems: "center",
          gap: 18, paddingTop: 14, borderTop: "1px solid var(--line-soft)",
        }}>
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}>{scopeStats.total}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Total cards</div>
          </div>
          <ChevronRight size={14} strokeWidth={1.5} style={{ color: "var(--ink-4)" }} />
          <div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1, color: "var(--v2-accent)", letterSpacing: "-0.02em" }}>{scopeStats.due}</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Due for review</div>
          </div>
          <button
            className={`btn-v2 ${mode === "dueOnly" ? "btn-v2-accent" : ""}`}
            onClick={() => { setMode("dueOnly"); handleStartSession(true); }}
            disabled={scopeStats.due === 0}
            style={{ opacity: scopeStats.due === 0 ? 0.4 : 1 }}
          >
            <Play size={11} strokeWidth={1.5} /> Due only
            <span className="mono" style={{ marginLeft: 4, opacity: 0.7 }}>{scopeStats.due}</span>
          </button>
          <button
            className={`btn-v2 ${mode === "fullDeck" ? "btn-v2-primary" : ""}`}
            onClick={() => { setMode("fullDeck"); handleStartSession(false); }}
            disabled={scopeStats.total === 0}
            style={{ opacity: scopeStats.total === 0 ? 0.4 : 1 }}
          >
            <Layers size={12} strokeWidth={1.5} /> Full deck
            <span className="mono" style={{ marginLeft: 4, opacity: 0.7 }}>{scopeStats.total}</span>
          </button>
        </div>
      </div>

      {/* TAB SEG */}
      <div style={{ marginBottom: 14 }}>
        <SegmentedControl
          value={tab}
          options={[
            { value: "all", label: `All cards ${scopeStats.total}` },
            { value: "due", label: `Due now ${scopeStats.due}` },
          ]}
          onChange={setTab}
        />
      </div>

      {/* CARD LIST */}
      {tabCards.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <Layers size={24} strokeWidth={1.2} style={{ color: "var(--ink-4)", marginBottom: 8 }} />
          <div>{tab === "due" ? "No cards due right now" : "No flashcards yet"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tabCards.map(c => <FlashRow key={c.id} card={c} goals={goals} onEdit={() => handleEdit(c)} onDelete={() => setCardToDelete(c.id)} />)}
        </div>
      )}

      {/* Edit modal */}
      <FlashcardForm goals={goals} onSubmit={handleEditSubmit} initialData={editingCard} open={editOpen} onOpenChange={setEditOpen} />

      {/* Study session modal */}
      <StudyModal open={studyOpen} onClose={() => setStudyOpen(false)} cards={studyCards} onSessionComplete={handleSessionComplete} />

      <AlertDialog open={!!cardToDelete} onOpenChange={(open) => { if (!open) setCardToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the flashcard and its review history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Flash Row ───────────────────────────────────────────── */
function FlashRow({ card, goals, onEdit, onDelete }: {
  card: Flashcard; goals: Goal[]; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const linkedGoal = goals.find(g => g.id === card.goalId);
  const isDue = !card.nextReviewAt || new Date(card.nextReviewAt) <= new Date();

  return (
    <div className="card-v2" style={{ padding: "14px 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 6, letterSpacing: "-0.005em" }}>
            {card.question}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10, lineHeight: 1.55 }}>
            {open ? card.answer : truncate(card.answer, 220)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
            {card.topic && <span className="pill-v2" style={{ fontSize: 9.5 }}>{card.topic}</span>}
            {linkedGoal && (
              <>
                <span style={{ color: "var(--ink-4)" }}>&middot;</span>
                <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>{linkedGoal.title}</span>
              </>
            )}
            {isDue && (
              <>
                <span style={{ color: "var(--ink-4)" }}>&middot;</span>
                <span className="pill-v2" style={{ color: "var(--v2-accent)", borderColor: "var(--accent-dim)", background: "var(--accent-soft)" }}>Due</span>
              </>
            )}
            {(card.correctCount > 0 || card.incorrectCount > 0) && (
              <>
                <span style={{ color: "var(--ink-4)" }}>&middot;</span>
                <span className="mono" style={{ color: "var(--v2-success)", fontSize: 11 }}>&#10003; {card.correctCount}</span>
                <span className="mono" style={{ color: "var(--v2-danger)", fontSize: 11 }}>&#10007; {card.incorrectCount}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <button className="btn-v2-icon" onClick={() => setOpen(o => !o)} title={open ? "Collapse" : "Expand"}>
            {open ? <ChevronUp size={13} strokeWidth={1.5} /> : <ChevronDown size={13} strokeWidth={1.5} />}
          </button>
          <button className="btn-v2-icon" onClick={onEdit}><Pencil size={13} strokeWidth={1.5} /></button>
          <button className="btn-v2-icon" onClick={onDelete} style={{ color: "var(--v2-danger)" }}><Trash2 size={13} strokeWidth={1.5} /></button>
        </div>
      </div>
    </div>
  );
}
