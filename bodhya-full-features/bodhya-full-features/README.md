# Bodhya — Reminders, Focus & Guide bundle

This is a standalone build of the Bodhya modules you asked for, pulled out
of the full template and wired together into one working app:

- ⏰ **Alarms** — wake-ups, study blocks, reminders (ring screen, snooze, sound + vibration)
- 🔔 **Notifications** — one inbox for everything Bodhya tells you, quiet hours, scheduler heartbeat
- ⏱️ **Time Tracking** — every focused minute logged, daily goal, week chart, per-subject breakdown
- 📅 **Study Plan / Schedule** — exam countdown, subjects, generated timetable, drag-to-move, repeats
- ✅ **To-do List** — priorities, due dates, repeats, steps, chapter→tasks, reminders as linked alarms
- 🎵 **Study Music** — generative focus music synthesised in the browser (no files, no streaming)
- ⏳ **Study Focus (Focus Timer)** — Pomodoro-style blocks with automatic breaks
- 🛡️ **Focus Shield** — anti-doomscroll guard: blocklist export, session guard, urge routine
- 📔 **Journal** — personalised study diary, prompts built from your actual day, weekly review
- 🌳 **Study Forest** *(included — see note below)* — plant-a-tree focus gamification, feeds the dashboard and Focus Shield
- 👨‍👩‍👧 **Guardian** *(included — see note below)* — consensual read-only progress view for a parent/teacher
- 🤖 **Bodhya chatbot + guided tour** — floating chat, onboarding wizard, idle nudges, offline rule-based brain, EN/HI/TE, **and the circular kawaii-mascot tour** (`CircularTour.jsx`) that orbits every tab with its own mascot

> **Note on Study Forest & Guardian:** you didn't explicitly ask for these
> two, but the app shell (`app-shell/AppShell.jsx`) and the Home dashboard
> wire directly into them (the "tree withers if you leave" mechanic feeds
> Focus Shield and the dashboard; Guardian powers the shareable read-only
> link). Pulling them out would mean surgery on the shell with real risk of
> breaking the build, so I kept them in — they're additive and don't get in
> the way of anything you asked for.

## About the tour

**The tour was already in your zip** — it lives entirely inside
`frontend/src/features/chatbot/`:
- `components/Tour.jsx` — classic step-by-step tour (left-side step list)
- `components/CircularTour.jsx` — the circular tour, where your kawaii mascot
  orbits a wheel of every feature, each node wearing that feature's own mascot
- `data/tourSteps.js` — the step/tab script (already updated with alarms,
  notifications, focus, shield, music, forest, journal, guardian, etc.)
- `assets/avatars/` — your 10 kawaii mascots (banyan, owl, diya, book, brain,
  bulb, books, rocket, lotus, peacock)
- `assets/features/` — one mascot image per feature, used on the circular
  tour wheel (`data/featureAvatars.js` maps feature id → image)

The real app shell (`app-shell/AppShell.jsx`) already passes
`tourItems={TABS}` into `<BodhyaAssistant>`, which makes it render the
**circular** tour (not the classic list). Open the chat → tap **"Show me
around"** → the circular tour starts.

## Project layout

```
frontend/    Vite + React + Tailwind app — the real, working app shell
backend/     FastAPI service — reminders, study-plan generator, focus pack,
             journal, guardian, offline chatbot-guide endpoints
```

## 1. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). First load:
onboarding wizard → bot appears → open chat → tap "Show me around" → circular
tour starts and walks every tab.

To reset onboarding/tour during testing: devtools → Application → Local
Storage → delete keys starting with `bodhya_` → refresh.

No `.env` is required to run this — Supabase is wired with safe placeholder
fallbacks (see `frontend/.env.example` if you want to connect a real
Supabase project later).

## 2. Run the backend (optional)

Every feature above works **fully offline in the browser** — alarms,
reminders, the study-plan generator, focus timer, music, journal and
guardian all run client-side with `localStorage`. The backend adds
server-side mirrors of the same logic (useful for a cron/digest job, a
teacher/parent export, or keeping a future mobile client in sync) plus the
chatbot's offline intent classifier.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check it's alive: http://localhost:8000/health
Full route list: http://localhost:8000/docs

Routers included: `chatbot_guide`, `notifications` (alarms/reminders),
`study_plan`, `wellbeing` (music/focus-shield/study-forest), `journal`,
`guardian`, `creating` (recurring sessions + chapter→tasks mirrors).

## Notes

- Everything is dependency-light: the only runtime npm packages are
  `react`, `react-dom`, `react-router-dom` and `@supabase/supabase-js`
  (used only if you wire up real Supabase auth — the app runs fine without it).
- All state is stored in `localStorage` (see `chatbot/brain/memory.js` and
  each feature's own `store.js`) — nothing leaves the browser unless you
  connect the optional backend.
- Voice input/output (used by the chatbot and tour) uses the browser's
  built-in Web Speech APIs — support varies by browser.
