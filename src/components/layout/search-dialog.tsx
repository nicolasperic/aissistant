"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Layers, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type NoteResult = {
  id: string;
  title: string;
  snippet: string;
  certGoal: string | null;
};

type FlashcardResult = {
  id: string;
  question: string;
  answer: string;
  topic: string;
  examCode: string | null;
  studyNoteId: string | null;
};

type SearchResults = {
  studyNotes: NoteResult[];
  flashcards: FlashcardResult[];
};

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ studyNotes: [], flashcards: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ studyNotes: [], flashcards: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  }

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults({ studyNotes: [], flashcards: [] });
    router.push(path);
  }

  const hasResults = results.studyNotes.length > 0 || results.flashcards.length > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 text-muted-foreground h-8 px-3"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setQuery("");
            setResults({ studyNotes: [], flashcards: [] });
          }
        }}
        title="Search"
        description="Search across study notes and flashcards"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search study notes, flashcards..."
          value={query}
          onValueChange={onQueryChange}
        />
        <CommandList>
          {query.length >= 2 && !loading && !hasResults && (
            <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
          )}

          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {results.studyNotes.length > 0 && (
            <CommandGroup heading="Study Notes">
              {results.studyNotes.map((note) => (
                <CommandItem
                  key={note.id}
                  value={`note-${note.id}-${note.title}`}
                  onSelect={() => navigate(`/study-notes/${note.id}`)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium text-sm truncate">{note.title}</span>
                  </div>
                  {note.certGoal && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {note.certGoal}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground ml-6 line-clamp-2">
                    {note.snippet}
                  </p>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.flashcards.length > 0 && (
            <CommandGroup heading="Flashcards">
              {results.flashcards.map((card) => (
                <CommandItem
                  key={card.id}
                  value={`card-${card.id}-${card.question}`}
                  onSelect={() => {
                    if (card.studyNoteId) {
                      navigate(`/study-notes/${card.studyNoteId}`);
                    } else {
                      navigate("/flashcards");
                    }
                  }}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Layers className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="font-medium text-sm truncate">{card.question}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    {card.examCode && (
                      <span className="text-xs font-mono text-muted-foreground">{card.examCode}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{card.topic}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query.length < 2 && !loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
