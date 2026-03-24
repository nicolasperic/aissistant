"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Layers, Loader2, RefreshCw, Trash2, Pencil, Check, X } from "lucide-react";
import type { Components } from "react-markdown";

interface StudyNote {
  id: string;
  title: string;
  content: string;
  goalId: string | null;
  createdAt: string;
  task: {
    id: string;
    title: string;
    goal: { id: string; title: string } | null;
  } | null;
}

export default function StudyNotePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<StudyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flashcardsCount, setFlashcardsCount] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNote = useCallback(async () => {
    const res = await fetch(`/api/study-notes/${id}`);
    if (res.ok) setNote(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  async function handleGenerateFlashcards() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-flashcards-from-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyNoteId: id }),
      });
      const data = await res.json();
      setFlashcardsCount(data.count);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!note?.task?.id) return;
    setRegenerating(true);
    try {
      // Delete current note then regenerate
      await fetch(`/api/study-notes/${id}`, { method: "DELETE" });
      const res = await fetch("/api/ai/generate-study-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: note.task.id }),
      });
      const data = await res.json();
      router.replace(`/study-notes/${data.id}`);
    } finally {
      setRegenerating(false);
    }
  }

  function handleEditStart() {
    setEditContent(note!.content);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/study-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const updated = await res.json();
      setNote((n) => n ? { ...n, content: updated.content } : n);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/study-notes/${id}`, { method: "DELETE" });
    router.back();
  }

  const markdownComponents: Components = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      const content = String(children).replace(/\n$/, "");
      const isBlock = match || content.includes("\n");

      if (!isBlock) {
        return (
          <code
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
            {...props}
          >
            {children}
          </code>
        );
      }

      if (match) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg !my-4 text-sm"
          >
            {content}
          </SyntaxHighlighter>
        );
      }

      // Block code without language — ASCII diagrams, plain text, folder trees
      return (
        <pre className="rounded-lg bg-muted/60 border px-4 py-3 my-4 overflow-x-auto">
          <code
            className="text-sm text-foreground whitespace-pre"
            style={{ fontFamily: "Menlo, 'Courier New', Courier, monospace" }}
          >
            {children}
          </code>
        </pre>
      );
    },
    h1: ({ children }) => (
      <h1 className="mt-8 mb-4 text-2xl font-bold text-foreground border-b pb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-6 mb-3 text-xl font-semibold text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 mb-2 text-base font-semibold text-foreground">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-relaxed text-sm text-foreground/90">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-foreground/90">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-foreground/90">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children }) => (
      <th className="px-4 py-2 text-left font-semibold text-foreground">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border-t px-4 py-2 text-foreground/90">{children}</td>
    ),
    hr: () => <hr className="my-6 border-border" />,
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Study note not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky -top-6 z-10 -mx-6 px-6 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{note.title}</p>
            {note.task?.goal && (
              <p className="text-xs text-muted-foreground truncate">{note.task.goal.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!editing ? (
              <>
                {flashcardsCount !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {flashcardsCount} cards created
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFlashcards}
                  disabled={generating || flashcardsCount !== null}
                  className="gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" />
                  )}
                  {flashcardsCount !== null ? "Flashcards created" : "Generate Flashcards"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  title="Regenerate"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleEditStart}
                  title="Edit note"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="gap-1.5 text-muted-foreground"
                  disabled={saving}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl py-8">
        {editing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[80vh] font-mono text-sm resize-none bg-muted/30"
            autoFocus
          />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {note.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
