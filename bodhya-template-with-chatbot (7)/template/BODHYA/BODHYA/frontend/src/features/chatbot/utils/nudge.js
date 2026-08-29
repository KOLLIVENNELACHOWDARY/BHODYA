// ---------- Bodhya idle-nudge policy (pure & testable) ----------

export const IDLE_NUDGE_MS = 45000   // no cursor/keyboard activity → "are you there?"
export const PAGE_NUDGE_MS = 180000  // parked on the same page → offer a guided tour
export const NUDGE_COOLDOWN_MS = 120000

/**
 * Decide whether Bodhya should show a nudge right now.
 * @returns 'areYouThere' | 'tourOffer' | null
 */
export function evaluateNudge({
  idleMs,
  onPageMs,
  cooldownMs = NUDGE_COOLDOWN_MS,
  active = true,      // user onboarded
  tourOpen = false,
  nudgeVisible = false
}) {
  if (!active || tourOpen || nudgeVisible) return null
  if (cooldownMs < NUDGE_COOLDOWN_MS) return null
  if (idleMs > IDLE_NUDGE_MS) return 'areYouThere'
  if (onPageMs > PAGE_NUDGE_MS) return 'tourOffer'
  return null
}
