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

**Notes Quiz (new!):** paste or upload your own notes (.txt/.md) → Bodhya
generates MCQs + true/false questions offline (`brain/quizgen.js`), in EN/HI/TE,
with topic detection for chapter-style notes. Earn XP for correct answers.
Say *"make a quiz from my notes"* in chat to jump there.
