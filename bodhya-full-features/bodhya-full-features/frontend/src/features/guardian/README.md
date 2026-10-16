# Guardian (feature owner: you)

A **consensual, read-only** progress view for a parent, teacher or mentor.

Design rules (deliberate):
1. **The student owns the switch** — nothing is shared until they create a grant;
   each section is toggled individually; they can pause, rotate the code or stop.
2. **Journal text is off by default** and is a separate section from the mood
   chart. Writing stays private unless the student opens it.
3. **They can always preview** exactly what a guardian sees (same renderer).
4. **No covert monitoring** — a guardian needs a 6-character code the student
   gives them, and every view is timestamped and listed in the student's history.

- `logic.js` — section catalogue (with "private by default" flags), share-code
  generation/validation, grant status, `buildReport()` (statuses 🟢🟡🔴, rows,
  redaction), `buildHighlights()` (the plain-language lines a parent reads),
  text + self-contained HTML exports, `sharingScore()`.
- `store.js` — grant CRUD (create/pause/rotate/delete), section toggles,
  `gatherSnapshot()` (the ONLY place that reads other features),
  `guardianUnlock(code)` (the only way into the guardian view), history.
- `GuardianPanel.jsx` — the student's tab. `GuardianView.jsx` — code entry +
  read-only dashboard. `GuardianReport.jsx` — one renderer for both.
