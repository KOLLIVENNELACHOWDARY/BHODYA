// ---------- Agent tasks: what Bodhya proactively does, when, and how often ----------
// Policy: the tour shows ONCE after login. After that, Bodhya never disturbs the
// user automatically — except if they look stuck (rapid clicking) or go idle
// (their earlier request for "are you there?" reminders). Dismissals back off ×3.

export const TASK_DEFS = [
  // 1) FIRST VISIT (right after login) — give the deep-dive tour exactly ONCE
  {
    id: "firstTour",
    priority: 100,
    cooldown: 10000,
    trigger: (ctx) =>
      ctx.onboarded &&
      !ctx.tourDone &&
      !ctx.tourOpen &&
      !ctx.nudgeVisible &&
      !ctx.mem.initialTourShown &&           // NEVER repeat, even mid-tour skip
      ctx.now - ctx.mem.lastSessionStart > 1500,
    run: (ctx) => {
      ctx.mem.initialTourShown = true;       // one-time flag (persisted)
      return { action: "tour" };
    },
  },

  // 2) FRUSTRATION — rapid clicking usually means "stuck" → offer help (a stuck signal)
  {
    id: "frustrated",
    priority: 90,
    cooldown: 240000,
    trigger: (ctx) =>
      ctx.onboarded && !ctx.tourOpen && !ctx.nudgeVisible && ctx.rapidClicks >= ctx.clickThreshold,
    run: () => ({ action: "nudge", kind: "frustrated" }),
  },

  // 3) IDLE — no cursor/keyboard activity → gentle "are you there?" (only if not ignored)
  {
    id: "idle",
    priority: 70,
    cooldown: 300000,
    trigger: (ctx) =>
      ctx.onboarded &&
      !ctx.tourOpen &&
      !ctx.nudgeVisible &&
      (ctx.mem.dismissed.idle || 0) < 2 &&    // if ignored twice → stop asking
      ctx.idleMs > ctx.idleMsLimit,
    run: () => ({ action: "nudge", kind: "areYouThere" }),
  },
];

// Pick the highest-priority task that is triggered and not in cooldown
export function evaluateTasks(ctx) {
  const { now, mem } = ctx;
  let best = null;
  for (const t of TASK_DEFS) {
    if (!t.trigger(ctx)) continue;
    const last = mem.lastShown[t.id] || 0;
    let cd = t.cooldown;
    const dismissed = mem.dismissed[t.id] || 0;
    if (dismissed >= 2) cd *= 3; // user said "no" twice → leave them alone longer
    if (now - last < cd) continue;
    if (!best || t.priority > best.priority) best = t;
  }
  return best;
}
