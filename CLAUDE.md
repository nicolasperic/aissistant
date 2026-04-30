# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint
npm run seed      # Seed the database (ts-node)
```

There is no test command configured.

## Environment Setup

Requires two environment variables (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Anthropic API key

## Architecture

**Certento** is a single Next.js 16 App Router application (not a monorepo) — an AI-powered certification study platform combining goal management, study plans, and reviews.

### Key directories

- `src/app/api/` — All backend logic: CRUD, AI calls, business rules. No separate server.
- `src/app/(pages)/` — Client-side pages (`"use client"`), fetching from API routes.
- `src/components/` — UI split into `ui/` (shadcn/ui primitives), `layout/`, and feature folders.
- `src/lib/` — Shared utilities: `db.ts` (Prisma singleton), `ai.ts` (Anthropic wrapper), `types.ts`, `rewards.ts`, `prompts/`.
- `prisma/` — Schema (9 models), migrations, and seed script.

### Data model

Core entities and their relationships:

- **Goal** — Hierarchical (self-referential `parentId`), typed (`YEARLY|QUARTERLY|MONTHLY|WEEKLY`), with `position` for manual ordering. Has many Tasks.
- **Task** — Belongs to a Goal. Status: `DRAFT|PENDING|IN_PROGRESS|COMPLETED|SKIPPED`. Has `scheduledDate`, `completedAt`, `estimatedMinutes`.
- **WeeklyReview** — User input fields (`rating`, `studyMinutes`, `userNotes`) + AI-generated fields (`aiAnalysis`, `aiRecommendations`, etc.).
- **Event** — Countdown events, optionally linked to a Goal.
- **UserStats** — Singleton row (`id = "singleton"`) for global points/streak state.
- **Reward** — Badge/points event log.
- **AiContext** — Audit trail for all AI calls.

### AI integration

`src/lib/ai.ts` wraps the Anthropic SDK with two functions:
- `generateCompletion()` — plain text responses
- `generateJsonCompletion<T>()` — structured JSON with parsing

Model in use: `claude-sonnet-4-6`. No streaming — full responses only.

Prompts are built dynamically from database context in `src/lib/prompts/`.

**Weekly plan generation** (`/api/ai/generate-plan`): fetches goals, last review, events, and incomplete tasks → builds prompt → Claude returns JSON → creates Goal and Task records in DB.

### Rewards system

Defined in `src/lib/rewards.ts`. Call `onTaskCompleted()` when completing a task — it handles points, streak updates, and badge checks. `UserStats` uses a singleton pattern (always `id = "singleton"`).

### Path aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
