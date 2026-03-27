import type { DriveStep } from "driver.js";

export type TourId =
  | "goals"
  | "weekly-plan"
  | "calendar"
  | "events"
  | "review"
  | "rewards"
  | "flashcards"
  | "study-notes";

export const TOUR_STEP_IDS: Record<TourId, string[]> = {
  goals: ["goals-create", "goals-grid", "goals-planning-notes"],
  "weekly-plan": ["plan-generate", "plan-add-task", "plan-view-scope"],
  calendar: ["calendar-grid"],
  events: ["events-create", "events-list"],
  review: ["review-rating", "review-submit", "review-ai"],
  rewards: ["rewards-streak", "rewards-badges"],
  flashcards: ["flashcards-scope", "flashcards-session", "flashcards-manage"],
  "study-notes": ["study-notes-list", "study-notes-generate"],
};

export const ALL_TOUR_STEPS = Object.values(TOUR_STEP_IDS).flat();

export const TOURS: Record<TourId, DriveStep[]> = {
  goals: [
    {
      element: "#tour-goal-create",
      popover: {
        title: "Create Your First Goal",
        description:
          "Start by adding a goal — Yearly, Quarterly, Monthly, or Weekly. Goals can be nested so you can break big objectives into smaller milestones.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-goals-grid",
      popover: {
        title: "Drag & Drop to Reorder",
        description:
          "Grab any goal card and drag it to reorder. Your preferred order is saved automatically so the most important goals stay at the top.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-goal-create",
      popover: {
        title: "Planning Notes = AI Context",
        description:
          "Inside each goal you'll find a Planning Notes field. Whatever you write there is fed directly to the AI when generating plans — the more detail you add, the smarter the plan.",
        side: "bottom",
        align: "end",
      },
    },
  ],
  "weekly-plan": [
    {
      element: "#tour-plan-view-scope",
      popover: {
        title: "Week or 4-Week View",
        description:
          "Toggle between This Week and 4 Weeks to see your tasks in the scope that works best for you.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-generate-plan",
      popover: {
        title: "Generate an AI Plan",
        description:
          "Click Generate Plan and choose Weekly (this week) or Monthly (4 weeks). The AI reads your goals and planning notes, then creates tasks scheduled across the right days.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-add-task",
      popover: {
        title: "Add Tasks Manually",
        description:
          "Prefer to plan yourself? Use Add Task to create individual tasks, assign them to a goal, set a scheduled date, priority, and estimated time.",
        side: "bottom",
        align: "end",
      },
    },
  ],
  calendar: [
    {
      element: "#tour-calendar-grid",
      popover: {
        title: "Calendar with Drag & Drop",
        description:
          "Every task and event appears on the calendar. Drag an item to a different day to instantly reschedule it — no forms needed.",
        side: "top",
        align: "center",
      },
    },
  ],
  events: [
    {
      element: "#tour-add-event",
      popover: {
        title: "Track Important Dates",
        description:
          "Events are for key dates like certification exams, deadlines, or milestones — separate from tasks and goals. Add the exam date and it'll show up on your calendar.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "#tour-events-list",
      popover: {
        title: "Countdown to Exam Day",
        description:
          "Each event card shows a live countdown so you always know exactly how many days you have left to prepare. Use this to pace your study plan.",
        side: "top",
        align: "start",
      },
    },
  ],
  review: [
    {
      element: "#tour-review-form",
      popover: {
        title: "Weekly Review",
        description:
          "At the end of each week, rate your week, log how many minutes you studied, and add any notes. The app auto-pulls your task completion stats.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-review-submit",
      popover: {
        title: "Get AI Feedback",
        description:
          "Submitting your review sends your week's data to Claude, which returns a personalised analysis, highlights, and recommendations for next week.",
        side: "top",
        align: "start",
      },
    },
  ],
  rewards: [
    {
      element: "#tour-rewards-streak",
      popover: {
        title: "Daily Streak",
        description:
          "Complete at least one task every day to keep your streak alive. Streaks earn bonus points and unlock special badges. Miss a day and it resets to zero!",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-rewards-badges",
      popover: {
        title: "Badges & Points",
        description:
          "Every completed task, review, and streak milestone earns points. Collect badges for achievements like your first plan, long streaks, and more. Check the Points Guide below to see what each action is worth.",
        side: "top",
        align: "start",
      },
    },
  ],
  flashcards: [
    {
      element: "#tour-flashcards-scope",
      popover: {
        title: "Scope Your Study Session",
        description:
          "Pick a goal from the dropdown to study only the flashcards tied to that certification or topic. Leave it empty to study everything at once.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-flashcards-session",
      popover: {
        title: "Start a Study Session",
        description:
          "\"Due only\" shows cards that are ready for review based on spaced repetition — great for daily practice. \"Full deck\" lets you go through everything in scope regardless of schedule.",
        side: "top",
        align: "end",
      },
    },
    {
      element: "#tour-flashcards-manage",
      popover: {
        title: "Browse & Manage Cards",
        description:
          "The All cards tab lists every card in scope. Due now filters to only what needs reviewing today. Each card shows your correct/incorrect history and when it's next scheduled.",
        side: "top",
        align: "start",
      },
    },
  ],
  "study-notes": [
    {
      element: "#tour-study-notes-list",
      popover: {
        title: "Notes by Certification",
        description:
          "Study notes are grouped by your quarterly certification goals. Each note is tied to a task — the circle on the left mirrors that task's status so you can see at a glance which topics you've already covered.",
        side: "right",
        align: "start",
      },
    },
    {
      element: "#tour-study-notes-generate",
      popover: {
        title: "Generate Notes from Tasks",
        description:
          "Notes are created from the Weekly Plan or Goals pages. Expand any task, add study context, and hit \"Generate Study Note\" — the AI writes a full structured note for that topic.",
        side: "bottom",
        align: "center",
      },
    },
  ],
};
