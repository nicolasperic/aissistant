"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Flashcard, Goal } from "@prisma/client";

interface FlashcardFormProps {
  goals: Goal[];
  onSubmit: (data: Partial<Flashcard>) => void;
  initialData?: Flashcard | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultGoalId?: string;
}

export function FlashcardForm({
  goals,
  onSubmit,
  initialData,
  open: controlledOpen,
  onOpenChange,
  defaultGoalId,
}: FlashcardFormProps) {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [topic, setTopic] = useState("");
  const [examCode, setExamCode] = useState("");
  const [goalId, setGoalId] = useState(defaultGoalId || "");

  useEffect(() => {
    if (isOpen) {
      setQuestion(initialData?.question ?? "");
      setAnswer(initialData?.answer ?? "");
      setHint(initialData?.hint ?? "");
      setTopic(initialData?.topic ?? "");
      setExamCode(initialData?.examCode ?? "");
      setGoalId(initialData?.goalId ?? defaultGoalId ?? "");
    }
  }, [isOpen, initialData, defaultGoalId]);

  const handleOpenChange = (val: boolean) => {
    if (isControlled) onOpenChange?.(val);
    else setOpen(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      question: question.trim(),
      answer: answer.trim(),
      hint: hint.trim() || undefined,
      topic: topic.trim(),
      examCode: examCode.trim() || undefined,
      goalId: goalId || undefined,
    });
    handleOpenChange(false);
  };

  const trigger = !isControlled && (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-1" />
      Add Card
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Flashcard" : "New Flashcard"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Question *</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is the Magento theme fallback order?"
              rows={2}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Answer *</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Current theme → Parent theme(s) → Module view files → ..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Hint <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Think about what Magento checks first..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Topic *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Theme Management"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Exam code <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                placeholder="AD0-E727"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Link to goal <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a goal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No goal</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="text-muted-foreground text-xs mr-1.5">[{g.type}]</span>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Save" : "Add Card"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
