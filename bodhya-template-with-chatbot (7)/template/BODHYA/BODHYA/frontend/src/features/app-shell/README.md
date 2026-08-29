# App Shell — Tabbed Feature Interface

The whole app's features as **tabs** in a sidebar, with a placeholder page per
feature (teammates will replace the placeholder with their real page later).

**Files:**
- `AppShell.jsx` — sidebar tabs + main area + Bodhya assistant wired in
- `tabConfig.js` — every tab (id, icon, title/desc in EN/HI/TE, owner)

**How it connects to Bodhya:**
- `<BodhyaAssistant context={activeTab} onNavigate={setActiveTab} />` — Bodhya
  knows which tab is active (contextual stuck-help) and can jump between tabs.
- The guided tour (`features/chatbot`) now jumps from tab to tab automatically,
  explaining each one — see `features/chatbot/data/tourSteps.js`.
- Each feature page has a "🤖 Ask Bodhya about this tab" button.

**To add a tab:** add an entry in `tabConfig.js` (no other file changes needed —
the sidebar, page, and tour all read from it). To plug a teammate's real page:
replace the `<FeaturePage>` placeholder for that tab id in `AppShell.jsx`.
