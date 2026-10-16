# Bodhya Guide Chatbot (offline, no API keys)

A guide chatbot that helps when the user is stuck, sends idle reminders
("are you there?"), and gives guided tours of the app. It is a **guide,
not a teacher** — it does not explain study topics.

**Constraint:** zero API keys. The whole conversational brain is rule-based
and runs in the browser; no LLM calls, no external services.

**Suggested files:**
- `index.jsx` — main component (`<BodhyaAssistant/>`), mount it in App.jsx
  (or any page) to get the chat FAB + idle nudges + onboarding + tour
- `components/` — ChatPanel (chat UI + voice), IdleNudge, Onboarding, Tour
- `brain/` — engine.js (intent scoring), intents.js, responses.js (tone-
  adaptive, EN/HI/TE), quiz.js (Boss Battle bank), memory.js (localStorage)
- `utils/` — speech.js (voice input/output via browser APIs), nudge.js
  (idle-detection policy)
- `i18n/ui.js` — UI strings EN / हिन्दी / తెలుగు
- `data/tourSteps.js` — guided-tour step definitions

**Backend:** backend/app/routers/chatbot_guide.py (status + intent
classification + contextual help; no LLM).

**Usage in App.jsx (or anywhere):**

```jsx
import BodhyaAssistant from "./features/chatbot/index.jsx";

<BodhyaAssistant
  context={currentPage}          // "home" | "quiz" | "planner" | "progress" | "settings"
  onNavigate={setPage}           // page switcher
  ageGroupOverride={ageBand}     // from AgeContext
  langOverride={lang}            // optional
  skipOnboarding={false}
/>
```

Open the chat from any button: `window.dispatchEvent(new CustomEvent("bodhya:open"))`

Don't edit files outside this folder (except adding one route line in
`App.jsx` and, if needed, extending your matching backend router).

**Reminder pack (new!):** Bodhya now also *acts*. The brain gained
`brain/timeparse.js` (natural-language time + repeat parsing for EN/HI/TE),
`brain/notify.js` (the notification engine) and new intents
(`alarm_add`, `alarm_show`, `alarm_stop`, `todo_add`, `todo_show`, `todo_done`,
`studyplan_generate`, `studyplan_show`, `focus_start`, `notif_show`, `time_show`).
`utils/` gained `events.js` (app-wide event bus), `store.js` (persisted stores +
`useStore` hook) and `sound.js` (offline Web-Audio sounds). `i18n/features.js`
holds ~190 strings in three languages for the new screens.
See docs/REMINDER_PACK.md for the whole picture.

**Journal:** `journal_add`, `journal_prompt` and `journal_show` intents — say
"journal: optics finally clicked" (mood is detected from the words), "give me a
journal prompt" (the prompts come from your own day) or "how was my week". A plain
"journal: …" is matched on the *raw* text before scoring, because the cleaner
strips the colon. See docs/JOURNAL.md.

**Focus pack:** Bodhya can now help you *not* doomscroll. The brain gained
`urge_help`, `music_start`, `music_stop`, `forest_plant`, `forest_stats`,
`shield_block`, `shield_show` and `shield_stats` intents — so "I want to scroll"
starts a 90-second breathing routine, "plant a tree for 25 minutes" starts a
Forest-style session, "play rain sounds" starts generative music and
"block social media" fills the device blocklist. `utils/audio.js` is the shared
AudioContext (alarms + music), so music ducks when an alarm rings.
See docs/FOCUS_PACK.md.

**Notes Quiz:** paste or upload your own notes (.txt/.md) → Bodhya
generates MCQs + true/false questions offline (`brain/quizgen.js`), in EN/HI/TE,
with topic detection for chapter-style notes. Earn XP for correct answers.
Say *"make a quiz from my notes"* in chat to jump there.
