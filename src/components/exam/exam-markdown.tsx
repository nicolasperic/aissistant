"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";

// ─── ExamMarkdown ─────────────────────────────────────────────────────────────
// Full markdown rendering for question text.
// Supports fenced code blocks with syntax highlighting, inline code, lists, etc.

const questionComponents: Components = {
  pre({ children }) {
    // ReactMarkdown wraps fenced code blocks in <pre> which gets browser's
    // white-space: pre and no overflow — replace with a scrollable div so
    // the SyntaxHighlighter inside can contain its own overflow properly.
    return <div className="overflow-x-auto">{children}</div>;
  },
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const text = String(children).replace(/\n$/, "");
    const isBlock = match || text.includes("\n");

    if (isBlock) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match?.[1] ?? "text"}
          PreTag="div"
          className="rounded-lg !my-3 !text-sm"
        >
          {text}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded border">
        {children}
      </code>
    );
  },
  p({ children }) {
    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>;
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
};

export function ExamMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={questionComponents}>
      {content}
    </ReactMarkdown>
  );
}

// ─── OptionMarkdown ───────────────────────────────────────────────────────────
// Compact markdown for answer option text.
// Code blocks use a smaller font and tighter spacing to fit inside option cards.
// Paragraphs render as inline spans to avoid breaking flex layouts.

const optionComponents: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const text = String(children).replace(/\n$/, "");
    const isBlock = match || text.includes("\n");

    if (isBlock) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match?.[1] ?? "text"}
          PreTag="div"
          className="rounded !my-1.5 !text-xs !leading-relaxed"
          customStyle={{ fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
        >
          {text}
        </SyntaxHighlighter>
      );
    }

    return (
      <code className="font-mono text-xs bg-muted/80 px-1 py-0.5 rounded border">
        {children}
      </code>
    );
  },
  // Render paragraphs as spans so single-line options stay inline
  p({ children }) {
    return <span className="leading-relaxed">{children}</span>;
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
};

export function OptionMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={optionComponents}>
      {content}
    </ReactMarkdown>
  );
}
