# Journal (feature owner: you)

A personalised study diary. "Personalised" is the whole point: the prompts,
the greeting line, the suggestion and the weekly review are generated from what
the *other* features recorded today — focus minutes, trees grown, escapes and
resisted urges, tasks done, plan sessions, study streak, exam countdown — plus
your own mood history.

- `logic.js` — pure: mood/energy scales, the prompt bank (opening · study · focus ·
  feelings · plan · gratitude · exam · reset) and `pickPrompts(ctx)` which chooses
  5 prompts **and says why** (“3 escapes today — name the trigger”), mood strip /
  trend / longest streak, "on this day", personalised summary, Markdown + JSON
  export, tolerant import parser.
- `store.js` — `todayContext()` (the personalised heartbeat), draft editing,
  `saveEntry` (XP once per day, mentions `context`), `quickCapture` for chat with
  light mood detection, weekly review + notification, settings, export/import.
- `JournalPanel.jsx` — the tab: write (mood, energy, prompts, #tags, win/struggle/
  gratitude/tomorrow), entries timeline (search, filters, pin, on-this-day),
  review (stats, top tags, past reviews, prompt bank) and settings (reminder hour,
  auto-context, weekly review, export/import, delete all).

Chat: “journal: today was rough but optics finally clicked” · “show my journal” ·
“how was my week” · “give me a journal prompt”.
