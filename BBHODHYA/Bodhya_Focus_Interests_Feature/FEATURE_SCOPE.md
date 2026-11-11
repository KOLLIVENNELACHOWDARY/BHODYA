# Bodhya Focus & Interests — scope

A standalone, opt-in feature that notices limited in-app study-session signals and offers supportive, interest-based ways to re-engage.

## Signals used
- Student explicitly starts a focus session.
- Inactivity while that session is active.
- The Bodhya browser tab is hidden and later becomes visible again.
- Frequent changes in the active Bodhya tab, if the host app passes `activeTab`.
- Student explicitly asks to preview an interest-based idea.

## Not used
- No webcam, microphone, face/emotion recognition, keystroke logging, or monitoring of other apps/sites.
- No punitive score, public label, or automatic report to a guardian.
- No raw session/event history is saved by this feature.

## What the student receives
- A gentle, dismissible focus nudge.
- Choice of a tiny first step, short reset, or interest-based example.
- Personal interest preferences saved locally on the device by default.
- Nudge cooldowns to prevent repeated interruptions.

## Compatibility note
Bodhya's existing code already has a basic `IdleNudge` for inactivity and returning to the app. This feature is intended as an opt-in, configurable layer for interest-based activities, not as a replacement for the existing nudge. During integration, avoid showing both prompts for the same signal; connect one signal source to the new nudge flow or disable the overlapping legacy trigger.
