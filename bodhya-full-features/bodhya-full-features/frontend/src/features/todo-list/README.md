# To-do list (feature owner: you)

Tasks with priorities, categories, due date + time, repeats, steps, notes,
estimated minutes, reminders (as linked alarms), search, sorting and XP.

- `logic.js` — pure: grouping (overdue/today/tomorrow/upcoming/someday/done),
  repeat maths, due labels, fuzzy `findByTitle` (powers "done with physics
  homework"), progress + streak.
- `store.js` — CRUD, completion (XP + next repeat + alarm cleanup), subtasks,
  reminder alarms, `completeByTitle`, `naggingTodos` (used by the agent).
- `TodoList.jsx` — the tab: progress ring, quick add with advanced options,
  filters, grouped list, inline edit, per-task focus/plan/remind actions.

## Chapter → tasks (new)

Paste a chapter, your notes or the syllabus and Bodhya cuts it into tasks.
Entirely local heuristics — no model, no network.

- `logic.js` — `scanChapter()` finds topic headings, "Term: meaning" lines,
  formulas, "Exercise 4.2 (Q1–Q8)" ranges, "draw a labelled diagram" lines and
  dates, while refusing to turn prose or formulas into fake topics.
  `chapterSuggestions()` turns that scan into tasks that each carry an i18n key
  and a reason (`whyKey`).
- `store.js` — `chapterTasksFrom()` (titles/reasons resolved in en/hi/te),
  `applyChapterTasks()` (tags `source: 'chapter'`, keeps the reason as a note,
  refuses duplicates), `chapterImport()` (one-shot paste → tasks).
- `TodoList.jsx` — the **📖 From a chapter** card: paste, "Find tasks", untick
  anything you disagree with, "Add these N". Testids: `chapter-open`,
  `chapter-text`, `chapter-scan`, `chapter-item-<id>`, `chapter-add`.
