# Certento

An AI-powered certification study platform for Magento and Adobe Commerce. Combines structured goal management, AI-generated study plans, study notes, flashcards, practice exams, and weekly reviews — everything you need to prepare for and pass your certifications.

---

## What it does

Certento helps you plan, study, and track your certification journey. Goals sit at the center: everything you do — tasks, study notes, reviews, weekly plans — connects back to them. AI is woven in to generate study content, plan your weeks, and give you honest feedback on your progress.

### Goals

Goals are hierarchical and typed: **Yearly → Quarterly → Monthly → Weekly**. Each goal tracks its own progress and can have sub-goals, tasks, notes, and a category. On the goals page you can switch between a card grid (with drag-to-reorder) and a hierarchy tree view to see how your goals nest together.

### Weekly Planner

At the start of each week, the AI generates a task plan based on your active goals, current progress, and any pending work from before. You choose the scope (this week, next week, or a specific date range) and the AI produces a structured set of tasks with priorities, time estimates, and goal links. You can accept, edit, or skip individual tasks.

### Weekly Review

On Fridays (or whenever you feel like it), you fill in a brief reflection — a 1–5 rating, study/focus time, and any notes. The AI then reads your actual task completion data for the week alongside your notes and returns structured feedback: highlights, areas for improvement, analysis, and concrete recommendations. Past reviews are stored and browsable.

### Dashboard

The home screen gives you an at-a-glance picture of the week: tasks due today, weekly completion rate, active goal progress chart, upcoming events countdown, and your current streak. On Wednesdays and Thursdays it nudges you for a mid-week check-in; on Fridays it reminds you to write a review.

### Events

A lightweight event tracker for things you want to count down to — conferences, deadlines, personal milestones. Events can be linked to a goal and show up in the dashboard countdown widget.

### Rewards & Streaks

Completing tasks and writing reviews earns points and unlocks badges. A streak counter tracks your daily activity. The rewards page shows your total points, earned badges, and streak history — a small but meaningful feedback loop for consistency.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui + Radix UI |
| Database ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude API (`claude-haiku-4-5`) |
| Charts | Recharts |
| Drag and drop | dnd-kit |
| Forms | React Hook Form + Zod |

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally (`brew install postgresql@16` on macOS)
- An [Anthropic API key](https://console.anthropic.com)

### Setup

```bash
git clone https://github.com/nicotheperico/certento.git
cd certento
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/certento"
ANTHROPIC_API_KEY="sk-ant-..."
```

Set up the database:

```bash
npx prisma db push
npx prisma generate
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
  app/
    api/                  # API route handlers
      goals/              # CRUD + reorder endpoint
      tasks/              # CRUD + status updates
      events/
      reviews/
      rewards/
      ai/
        weekly-plan/      # AI plan generation
        review/           # AI review analysis
    (pages)/
      page.tsx            # Dashboard
      goals/page.tsx      # Goals (cards + hierarchy)
      goals/[id]/page.tsx # Goal detail with linked tasks
      weekly-plan/page.tsx
      review/page.tsx
      events/page.tsx
      rewards/page.tsx
  components/
    dashboard/            # Dashboard widgets
    goals/                # GoalCard, GoalForm, SortableGoalCard, etc.
    tasks/                # TaskList, TaskForm, TaskEditForm
    review/               # WeekRating, AiFeedback
    rewards/              # PointsDisplay, BadgeGrid, StreakTracker
    ui/                   # shadcn/ui primitives
  lib/
    db.ts                 # Prisma client singleton
    types.ts              # Shared TypeScript types
    rewards.ts            # Points and badge definitions
prisma/
  schema.prisma           # Database schema
```

### Data model highlights

- **Goal** — hierarchical via `parentId`; typed as `YEARLY | QUARTERLY | MONTHLY | WEEKLY`; has `progress`, `position` (for manual ordering), `category`, `notes`
- **Task** — linked to a goal; has `status`, `priority`, `scheduledDate`, `estimatedMinutes`, `actualMinutes`
- **WeeklyReview** — stores both user input and AI-generated fields (`aiAnalysis`, `aiRecommendations`, `aiHighlights`, `aiAreasForImprovement`)
- **Reward** — earned event log (badge unlocks, points milestones)
- **UserStats** — singleton row tracking total points, current streak, longest streak

### AI integration

AI features use the Anthropic Claude API via the `@anthropic-ai/sdk`. The weekly plan and review analysis are server-side API routes that build prompts from database state and return structured responses. No streaming — responses are returned as complete JSON. The model used is `claude-haiku-4-5` for speed and cost.

---

## Contributing

This project started as a personal tool and is being opened up in the hope that it can grow with contributions from others. Ideas that came naturally from using it:

- Mobile-friendly layout / PWA support
- Calendar view for tasks and events
- Goal sharing or collaboration
- More AI features (daily suggestions, goal coaching, retrospective summaries)
- Data export (CSV, Markdown)
- Theming and customization

If you want to contribute, open an issue to discuss the idea first — especially for larger features. PRs for bug fixes, accessibility improvements, and small enhancements are welcome directly.

---

## License

MIT
