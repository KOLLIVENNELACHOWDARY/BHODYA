# Alarms (feature owner: you)

Wake-up alarms, study blocks and reminders. Rings with a full-screen screen you
can snooze, an offline Web-Audio sound, vibration, and an auto-stop guard.

- `logic.js` — pure occurrence maths (`nextOccurrence`, `dueAlarms`,
  `missedOccurrences`, `describeRepeat`, `untilText`, templates). Node-testable.
- `store.js` — persistence + firing lifecycle (`fireAlarm`, `snoozeAlarm`,
  `dismissAlarm`, `checkDueAlarms`, `catchUpMissed`) and the notification push.
- `AlarmCenter.jsx` — the tab: clock, quick add, day picker, templates, list,
  per-alarm editor, settings, ring history.

Wired by: `notifications/scheduler.js` (fires due alarms), `notifications/AlarmRing.jsx`
(the ring screen), `chatbot/brain/engine.js` ("remind me at 7 am …").
