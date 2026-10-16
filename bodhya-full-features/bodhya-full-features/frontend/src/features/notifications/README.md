# Notifications (feature owner: you)

One inbox for everything Bodhya wants to tell you, plus the scheduler heartbeat
that decides *when* to speak.

- `scheduler.js` — `tick()` runs every few seconds: fires alarms, focus-timer
  expiry, plan-session lead warnings, due/overdue task nudges, streak protection,
  end-of-day rollover, morning report and the daily digest — each **once per day
  or per item**. `upcomingSummary()` powers the Upcoming tab.
- `NotificationsHost.jsx` — mount this **once** at app level: runs the tick,
  catches up alarms missed while the tab was closed, renders ring screen + toasts.
- `AlarmRing.jsx` — full-screen alarm (snooze chips, "I'm up", linked actions).
- `ToastStack.jsx` — actionable pop-up cards (open / mark done / snooze).
- `NotificationCenter.jsx` — the tab *and* the compact bell dropdown: inbox,
  upcoming, settings.
- `NotificationBell.jsx` / `NotificationPrefs.jsx` — badge button for the header;
  settings block reused inside Profile settings.

Rules live in `chatbot/brain/notify.js` (master switch, per-category toggles,
quiet hours, dedupe by `groupKey`, snooze, OS-notification bridge).
