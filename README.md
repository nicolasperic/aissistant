<p align="center">
  <img src="public/logo-128.png" alt="Certento" width="100" />
</p>

# Certento

An AI-powered certification study platform. Plan your goals, generate study notes and flashcards, take practice exams, track your streaks — everything you need to prepare for and pass your certifications.

Built with Next.js, Prisma, PostgreSQL, and the Anthropic Claude API. Self-hosted, open source, and designed to be extended with new certification providers.

---

## Features

### Onboarding Setup Wizard

First-time users walk through a guided setup: pick which certifications you've already passed, which ones you're preparing for, and set your exam dates. Certento creates the initial goal structure and countdown events automatically.

### Dashboard

At-a-glance view of your week: today's tasks, weekly completion rate, active goal progress, upcoming event countdowns, and your current streak. Mid-week check-in nudges on Wednesdays/Thursdays and review reminders on Fridays.

### Goals

Hierarchical and typed: **Yearly → Quarterly → Monthly → Weekly**. Each goal tracks progress and can have sub-goals, tasks, notes, and a category. Switch between a card grid (drag-to-reorder) and a hierarchy tree view.

### Weekly Planner

AI generates a task plan based on your active goals, current progress, and pending work. Choose the scope (this week, next week, or a custom date range) and review the draft — accept, edit, or skip individual tasks. Includes a weekly view (7 days) and a monthly view (4 weeks).

### Study Notes

AI-generated or manually created Markdown study notes, linked to certifications. Full Markdown rendering with syntax-highlighted code blocks, table of contents sidebar, scroll progress tracking, and bookmark position memory. Grouped by certification code with drag-to-reorder at both group and note level.

### Flashcards

Auto-generated from study note content or created manually. Spaced repetition scheduling based on performance (Easy/Medium/Hard/Missed ratings). Filter by certification, goal, or due status. Session stats track your correct/incorrect counts.

### Practice Exams

Timed practice tests with multiple-choice questions. Three modes: Official (fixed order), AI Generated, and Shuffle. Flag questions for later review, track all attempts with scores, and review detailed results with explanations and section-by-section breakdowns. Pass/fail calculation against the certification's passing threshold.

### Certifications

Pluggable certification registry. Browse all available certifications with exam details (sections, question counts, passing scores, time limits). Currently ships with **Adobe Commerce** (7 certifications across Professional, Expert, and Master levels). Adding a new provider is just a folder with TypeScript definitions.

### Calendar

Interactive month calendar with drag-to-reschedule for tasks and events. Day selection panel shows detailed task and event info with inline status toggling.

### Weekly Review

Rate your week (1–5 stars), log study minutes, add notes. The AI analyzes your actual task completion data alongside your notes and returns structured feedback: highlights, areas for improvement, analysis, and concrete recommendations. Past reviews are stored and browsable.

### Events

Countdown tracker for exam dates, conferences, deadlines, and milestones. Events can be linked to goals and appear in the dashboard countdown widget.

### Rewards & Streaks

Points system with 10 unlockable badges (First Step, Week Warrior, streaks, Goal Crusher, Perfect Week, Centurion, Study Master, and more). Confetti celebration animation on badge unlock. Current and longest streak tracking. Certification badges for passed exams displayed by level (gold/silver/bronze).

### Search (Cmd+K)

Global search across study notes and flashcards. Debounced real-time results with snippet previews and quick navigation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Charts | Recharts |
| Drag & Drop | dnd-kit |
| Search Palette | cmdk |
| Markdown | react-markdown + react-syntax-highlighter |
| Celebrations | canvas-confetti |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ running locally (`brew install postgresql@16` on macOS)
- An [Anthropic API key](https://console.anthropic.com)

### Setup

```bash
git clone https://github.com/nicolasperic/certento.git
cd certento
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/certento"
ANTHROPIC_API_KEY="sk-ant-..."
```

Set up the database and seed sample data:

```bash
npx prisma db push
npx prisma generate
npm run seed
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The setup wizard will guide you through picking your certifications.

---

## Project Structure

```
src/
  app/
    (onboarding)/setup/     # First-time setup wizard
    api/                    # All backend logic
      ai/                  # AI endpoints (plan, study notes, flashcards, review)
      certifications/      # Certification catalog & practice exams
      exam/                # Exam attempts, answers, results
      goals/               # CRUD + reorder
      tasks/               # CRUD + status updates
      study-notes/         # CRUD + reorder
      flashcards/          # CRUD + review sessions
      search/              # Global search (Cmd+K)
      events/              # Event management
      reviews/             # Weekly reviews
      rewards/             # Points & badges
      onboarding/          # Setup wizard API
      user-certifications/ # User cert status tracking
    calendar/              # Calendar view
    certifications/        # Cert catalog + exam pages
    events/                # Events page
    flashcards/            # Flashcard management
    goals/                 # Goal management (cards + hierarchy)
    review/                # Weekly review
    rewards/               # Points, badges, streaks
    study-notes/           # Note list + detail viewer
    weekly-plan/           # AI-powered planning
    page.tsx               # Dashboard
  components/
    ui/                    # shadcn/ui primitives
    layout/                # Sidebar, header, search dialog
    dashboard/             # Dashboard widgets
    goals/                 # Goal cards, forms, hierarchy
    tasks/                 # Task list, forms, edit
    study-notes/           # Note viewer, flashcard panel
    flashcards/            # Flashcard session, deck management
    calendar/              # Calendar grid
    rewards/               # Badge grid, streak tracker, confetti
  lib/
    certifications/        # Pluggable cert registry
      adobe-commerce/      # Adobe Commerce provider (7 certs)
    prompts/               # AI prompt builders
    db.ts                  # Prisma client singleton
    ai.ts                  # Anthropic SDK wrapper
    rewards.ts             # Points, badges, streak logic
    types.ts               # Shared TypeScript types
prisma/
  schema.prisma            # Database schema
  seed.ts                  # Sample data seeder
```

### AI Integration

`src/lib/ai.ts` wraps the Anthropic SDK with two functions:
- `generateCompletion()` — plain text responses (study notes)
- `generateJsonCompletion<T>()` — structured JSON with parsing (plans, flashcards, reviews)

All AI calls are logged to the `AiContext` table for audit. No streaming — full responses only. Prompts are built dynamically from database context in `src/lib/prompts/`.

### Adding a Certification Provider

Create a folder in `src/lib/certifications/` with your provider definition:

```
src/lib/certifications/
  your-provider/
    index.ts              # ProviderDefinition with certifications array
    cert-code-1.ts        # CertDefinition with sections, topics, exam params
    cert-code-2.ts
```

Register it in `src/lib/certifications/index.ts`. Each certification defines its exam sections, topic coverage, question count, passing score, and time limit.

---

## Contributing

Certento started as a personal tool I built to pass four Adobe Commerce certifications. It's being opened up in the hope that it can help others preparing for their own exams.

Some ideas for contributions:

- **New certification providers** — AWS, Hyva, Salesforce, or any other vendor
- **Content packs** — study notes, flashcards, and practice questions for specific exams
- **Mobile-friendly layout / PWA support**
- **Data export** — CSV, Markdown, Anki deck format
- **Theming and customization**
- **More AI features** — daily suggestions, goal coaching, study plan optimization

If you want to contribute, open an issue to discuss the idea first — especially for larger features. PRs for bug fixes, accessibility improvements, and small enhancements are welcome directly.

---

## License

MIT
