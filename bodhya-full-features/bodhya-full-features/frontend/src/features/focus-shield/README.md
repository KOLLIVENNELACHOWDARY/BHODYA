# Focus shield (feature owner: you)

The anti-doomscroll layer, in three honest parts:

1. **Real blocking** — packs + your own domains, exported as a `hosts` file, DNS
   denylist rules (`||site^`) or extension/Chrome-policy JSON. This is the part that
   blocks a phone or laptop even when Bodhya is closed.
2. **Session guard** — while a focus block or tree runs, leaving the app is measured,
   logged and warned; strict mode withers the tree. Powered by `visibilitychange`.
3. **Urge routine** — "I want to scroll" → 90 s of urge surfing with a breathing
   circle, then an honest choice, inside a daily scroll budget.

- `logic.js` — packs, exports (`hostsFileContent`, `dnsRules`, `extensionJson`),
  budget maths, urge steps/breath curve, return verdicts, shield stats, setup score.
- `store.js` — blocklist CRUD, `armShield/noteHidden/noteVisible/disarmShield`,
  urge lifecycle, guard log, and the focus-event wiring.
- `FocusShield.jsx` — the tab. `ShieldOverlay.jsx` — the "welcome back" moment
  (mounted by `notifications/NotificationsHost.jsx`).
