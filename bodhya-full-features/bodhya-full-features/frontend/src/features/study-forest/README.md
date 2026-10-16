# Study forest (feature owner: you)

A Forest-style loop: plant a tree → the focus timer starts → finish the task and the
tree joins your forest (coins + streak); leave or quit early and it withers.

- `logic.js` — species catalogue with unlock rules, strictness levels, growth stages,
  5-minute coin maths, escape verdicts, forest statistics, achievements, week view
  and text export. Pure, Node-testable.
- `store.js` — plant/grow/wither, coins, buy species, revive, achievements, plus the
  focus-event wiring ("the tree timer IS the focus timer") and `catchUpTree()` for a
  tab that was closed mid-session.
- `StudyForest.jsx` — the tab: live tree, species picker, forest grid, stats,
  badges, settings.
