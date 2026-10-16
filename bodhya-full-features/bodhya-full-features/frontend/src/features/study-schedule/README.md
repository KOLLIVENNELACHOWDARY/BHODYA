# Study plan (feature owner: you)

Exam countdown, subjects (target hours / priority / difficulty / topics) and a
generated timetable that fits the time you actually have.

- `logic.js` — `generatePlan()` (pure, deterministic, offline), `explainPlan()`
  ("why this plan?"), `weekGrid`, `planProgress`, `nextSession`, `planToText`.
  Guarantees: never over the daily minutes, hardest subject in the freshest slot,
  daily recall + D+3/D+7 spaced repetition, graceful trim when the week is short.
  The Python mirror lives in `backend/app/routers/study_plan.py`.
- `store.js` — subjects, sessions, generation, completion (time log + XP),
  "push unfinished to tomorrow", template application, focus deep-link.
- `StudySchedule.jsx` — the tab: exam card, subjects, settings, week grid,
  today's sessions, per-subject progress.

## Repeats and drag-to-move (new)

A session can carry a weekly rule: `{ days: [1, 3], until: 'YYYY-MM-DD', everyWeeks: 1 }`
(0 = Sunday, matching the rest of the app). The session holding the rule is the
*anchor*; the occurrences it implies are laid down as normal sessions tagged
`seriesId`, so one of them can still be dragged, finished or deleted without
breaking the rule.

- `logic.js` — `normaliseRecurrence`, `recurrenceDays`, `describeRecurrence`,
  `seriesSessions`, `seriesSummary`, `validateMove`, `weekdaysInText`
  (understands "every monday and wednesday", "हर सोम और बुध", "ప్రతి సోమ, బుధ").
- `store.js` — `setSessionRecurrence` (idempotent), `materialiseSeries`
  (tops the series up as days pass; run on mount and after accepting a draft),
  `moveSessionChecked` (refuses no-ops and finished work), `moveSeries`
  (shifts the whole series by the same day + time delta), `removeSeries`.
- `StudySchedule.jsx` — the week grid is a drag-and-drop surface: pointerdown on
  a chip lifts it, the cell under the pointer highlights, pointerup moves it.
  The session editor also has a 🔁 repeat picker (weekday chips + "until" date).
  Two sessions in one slot are allowed, but the drop is flagged as a clash.
