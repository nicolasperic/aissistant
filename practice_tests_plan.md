# Practice Tests Feature — Build Plan

## Overview

A full practice exam experience integrated into AIssistant. Students can take timed, proctored-style practice tests tied to specific certifications (Adobe Commerce, Hyva, etc.), with a question pool architecture that enables a shuffle mode for endless variety.

---

## Data Model

### `Certification`
| Field | Type | Notes |
|-------|------|-------|
| id | string | cuid |
| name | string | e.g. "Adobe Commerce Front-End Developer Expert" |
| code | string | e.g. "AD0-E727" |
| provider | string | e.g. "Adobe", "Hyva" |
| description | string? | |
| totalQuestions | int | Default questions on official exam |
| passingScore | int | e.g. 33 (out of totalQuestions) |
| timeLimitMinutes | int | e.g. 100 |
| createdAt | DateTime | |

### `CertSection` (optional — only for certs with defined sections)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| certificationId | string | FK → Certification |
| name | string | e.g. "Content Management" |
| percentage | int | % of exam this section covers |

> Certs without sections skip this. Results breakdown only shows if sections exist.

### `Question` (the pool — belongs to cert, not to a specific test)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| certificationId | string | FK → Certification |
| certSectionId | string? | FK → CertSection (nullable) |
| text | string | Question body |
| type | enum | SINGLE \| MULTIPLE |
| explanation | string? | Shown after exam in results review |
| source | enum | OFFICIAL \| AI_GENERATED |
| createdAt | DateTime | |

### `QuestionOption`
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| questionId | string | FK → Question |
| text | string | Option text |
| isCorrect | boolean | |

### `PracticeTest`
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| certificationId | string | FK → Certification |
| title | string | e.g. "Official Exam", "AI Practice #1", "Shuffle" |
| type | enum | OFFICIAL \| AI_GENERATED \| SHUFFLE |
| questionCount | int | For SHUFFLE: how many to draw per attempt |
| createdAt | DateTime | |

### `PracticeTestQuestion` (join — only for OFFICIAL and AI_GENERATED)
| Field | Type | Notes |
|-------|------|-------|
| practiceTestId | string | |
| questionId | string | |
| position | int | Fixed order for this test |

> SHUFFLE tests have no rows here — questions are chosen dynamically at attempt start.

### `ExamAttempt`
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| practiceTestId | string | FK → PracticeTest |
| startedAt | DateTime | |
| completedAt | DateTime? | |
| durationSeconds | int? | |
| score | int? | Number of correct answers |
| totalQuestions | int | Snapshot at attempt time |
| passed | boolean? | |
| status | enum | IN_PROGRESS \| COMPLETED \| ABANDONED |

### `AttemptQuestion` (snapshot of which questions + order for this attempt)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| attemptId | string | FK → ExamAttempt |
| questionId | string | FK → Question |
| position | int | Order for this attempt (shuffled) |

### `AttemptQuestionOption` (shuffled option order per question per attempt)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| attemptQuestionId | string | FK → AttemptQuestion |
| optionId | string | FK → QuestionOption |
| position | int | Shuffled position for this attempt |

### `AttemptAnswer` (user's response per question)
| Field | Type | Notes |
|-------|------|-------|
| id | string | |
| attemptId | string | FK → ExamAttempt |
| questionId | string | FK → Question |
| flagged | boolean | User flagged for review |
| isCorrect | boolean? | Computed on submission |

### `AttemptAnswerOption` (which options the user selected)
| Field | Type | Notes |
|-------|------|-------|
| attemptAnswerId | string | FK → AttemptAnswer |
| optionId | string | FK → QuestionOption |

---

## Attempt Start Flow

```
1. Create ExamAttempt (status: IN_PROGRESS)

2. Select questions:
   - OFFICIAL / AI_GENERATED → read PracticeTestQuestion, shuffle order
   - SHUFFLE → randomly draw `questionCount` questions from cert's pool
               (if cert has sections: draw proportionally per section %)

3. Write AttemptQuestion rows (question + shuffled position)

4. For each question, shuffle its options
   → Write AttemptQuestionOption rows (option + shuffled position)

5. Return attempt id → redirect to exam screen
```

---

## Pages & Routes

```
/certifications                                         Catalog listing
/certifications/[id]                                    Cert detail + available tests + attempt history
/certifications/[id]/exam/[testId]                      Intro screen
/certifications/[id]/exam/[testId]/[attemptId]          Active exam
/certifications/[id]/exam/[testId]/[attemptId]/results  Results + breakdown
```

---

## Exam Screen UI

### Top Bar
- `Question X / Y`
- `Flag` button — toggles flag on current question (updates `AttemptAnswer.flagged`)
- Hamburger icon → slides panel from right

### Slide-out Navigation Panel
- Grid of question number buttons `[1] [2] [3] ... [N]`
- Flagged questions show a flag icon instead of number
- Answered questions shown with a distinct style
- Click any to jump directly to that question

### Question Card
- Question number + text
- Divider
- Options rendered based on `Question.type`:
  - `SINGLE` → radio buttons
  - `MULTIPLE` → checkboxes (prompt shows "Select 2" etc.)
- Options displayed in `AttemptQuestionOption.position` order

### Bottom Navigation
- Back / Next arrows
- "Submit Exam" button (accessible from last question or always visible)

### Timer (top-right)
- Countdown: `1h 39m 36s`
- Circular SVG ring — fills as time elapses (color changes near end)
- Timer runs client-side; attempt `startedAt` is source of truth

### Focus-lost Overlay
- Triggers on `document.visibilitychange` (tab switch) or `window.blur`
- Also triggers if keyboard keys are pressed outside the window
- Full-screen overlay: "Content Hidden" + "Your exam is still active. Click back into this window to continue."
- Timer keeps running (not paused)
- Overlay dismisses on window focus regain

---

## Results Screen

- Pass / Fail banner
- Score: `33 / 50`
- Completed: date + time
- Duration: `0h 25m 22s`
- Section breakdown table (only if cert has sections):
  | Section | Your % | Section Weight |
  |---------|--------|----------------|
  | Content Management | 72% | 25% |
  | ...     | ...    | ...  |
- "Retake" button → starts a new attempt

---

## Attempt History (on Cert Detail page)

Table showing all past attempts for that cert:
| Date | Test | Score | Passed | Duration |
|------|------|-------|--------|----------|
| Apr 9, 2026 | AI Practice #1 | 28/30 | Yes | 0:22:10 |

---

## Build Phases

| Phase | Scope |
|-------|-------|
| **1** | Prisma schema + `db push` + seed (one cert, sections, small question pool, one of each test type) |
| **2** | Certification catalog page + cert detail page (tests list + attempt history) |
| **3** | Exam intro screen + active exam (question nav, flag, radio/checkbox answers, next/back) |
| **4** | Timer + focus-lost overlay |
| **5** | Submit + results page (grading logic, pass/fail, section breakdown) |
| **6** | Shuffle exam: attempt start logic draws random questions proportionally |
| **7** | *(Later)* Admin UI / JSON import for questions |
| **8** | *(Later)* AI question generation wired to cert pool |

---

## Design Decisions

- **No auth** — personal tool, no userId on attempts
- **Sections are optional** — results breakdown only renders if cert has sections
- **Questions live in a pool** — not owned by a specific test; tests reference them via join table or select dynamically
- **Options shuffled per attempt** — students can't memorize "answer is always A"
- **Question order shuffled per attempt** — even for fixed tests
- **Timer does not pause** on focus loss — matches Adobe behavior
- **Question import** deferred to later phase (seed/manual SQL for now)
- **AI generation** deferred to later phase
