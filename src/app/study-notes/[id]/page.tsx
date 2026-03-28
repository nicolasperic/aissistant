"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Layers, Loader2, RefreshCw, Trash2, Pencil, Check, X, Bookmark } from "lucide-react";
import type { Components } from "react-markdown";

function slugify(children: React.ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((c) => (typeof c === "string" ? c : "")).join("")
    : typeof children === "string"
    ? children
    : "";
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(content: string): { level: number; text: string; slug: string }[] {
  return content
    .split("\n")
    .flatMap((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
      if (!match) return [];
      const text = match[2].trim();
      return [{ level: match[1].length, text, slug: slugify(text) }];
    });
}

interface StudyNote {
  id: string;
  title: string;
  content: string;
  goalId: string | null;
  bookmarkPosition: string | null;
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
  const [bookmarkPosition, setBookmarkPosition] = useState<string | null>(null);
  const initialScrollDone = useRef(false);

  const fetchNote = useCallback(async () => {
    const res = await fetch(`/api/study-notes/${id}`);
    if (res.ok) {
      const data: StudyNote = await res.json();
      setNote(data);
      setBookmarkPosition(data.bookmarkPosition);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  // Auto-scroll to bookmark on initial load
  useEffect(() => {
    if (note?.bookmarkPosition && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        const el = document.getElementById(note.bookmarkPosition!);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [note]);

  const headings = useMemo(
    () => (note ? extractHeadings(note.content) : []),
    [note]
  );

  async function handleBookmark(slug: string) {
    const next = bookmarkPosition === slug ? null : slug;
    setBookmarkPosition(next);
    await fetch(`/api/study-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarkPosition: next }),
    });
  }

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
      setNote((n) => (n ? { ...n, content: updated.content } : n));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await fetch(`/api/study-notes/${id}`, { method: "DELETE" });
    router.back();
  }

  // markdownComponents closes over bookmarkPosition so headings can show their indicator
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
    h1: ({ children }) => {
      const slug = slugify(children);
      const isBookmarked = bookmarkPosition === slug;
      return (
        <h1
          id={slug}
          className={`scroll-mt-20 mt-8 mb-4 text-2xl font-bold text-foreground border-b pb-2 ${
            isBookmarked ? "border-l-[3px] border-l-primary pl-3" : ""
          }`}
        >
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const slug = slugify(children);
      const isBookmarked = bookmarkPosition === slug;
      return (
        <h2
          id={slug}
          className={`scroll-mt-20 mt-6 mb-3 text-xl font-semibold text-foreground ${
            isBookmarked ? "border-l-[3px] border-l-primary pl-3" : ""
          }`}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const slug = slugify(children);
      const isBookmarked = bookmarkPosition === slug;
      return (
        <h3
          id={slug}
          className={`scroll-mt-20 mt-4 mb-2 text-base font-semibold text-foreground ${
            isBookmarked ? "border-l-[3px] border-l-primary pl-3" : ""
          }`}
        >
          {children}
        </h3>
      );
    },
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
        <div className="py-3 flex items-center gap-3 pr-8">
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

      {/* Content + ToC */}
      <div className="py-8 flex gap-8 pr-8">
        {/* ToC sidebar with bookmark controls */}
        {!editing && headings.length > 0 && (
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-20 space-y-0.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                Contents
              </p>
              {headings.map((h, i) => (
                <div key={`${i}-${h.slug}`} className="flex items-center gap-1 group">
                  <button
                    onClick={() => handleBookmark(h.slug)}
                    title={bookmarkPosition === h.slug ? "Remove bookmark" : "Bookmark this section"}
                    className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                  >
                    <Bookmark
                      className={`h-3 w-3 transition-colors ${
                        bookmarkPosition === h.slug
                          ? "text-primary fill-primary"
                          : "text-transparent group-hover:text-muted-foreground"
                      }`}
                    />
                  </button>
                  <a
                    href={`#${h.slug}`}
                    className={`text-xs leading-snug hover:text-foreground transition-colors truncate ${
                      h.level === 1
                        ? "font-medium text-foreground/80"
                        : h.level === 2
                        ? "pl-1 text-muted-foreground"
                        : "pl-3 text-muted-foreground/70"
                    }`}
                  >
                    {h.text}
                  </a>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
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
    </div>
  );
}
