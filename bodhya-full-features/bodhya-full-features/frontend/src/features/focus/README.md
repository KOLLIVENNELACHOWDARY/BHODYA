# Focus timer (feature owner: you)

Pomodoro-style blocks with automatic breaks; every finished block becomes study
time + XP (and ticks off the matching study-plan session).

- `logic.js` — pure clock maths (`remainingMs`, `progressPct`, `formatClock`),
  break ideas, streaks/bars, `xpForFocus`.
- `store.js` — `startFocus` / `pauseFocus` / `resumeFocus` / `extendFocus` /
  `finishPhase` / `stopFocus`, settings, log, and the cross-feature side effects
  (time tracking, plan, XP, notification).
- `FocusTimer.jsx` — the tab: ring, rounds, presets, subject picker, break ideas,
  session log, timer settings.

The timer keeps running on other tabs — `notifications/scheduler.js` watches for
expiry globally.
