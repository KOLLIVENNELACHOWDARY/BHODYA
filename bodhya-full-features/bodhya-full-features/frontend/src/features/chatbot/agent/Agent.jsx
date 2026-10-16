// ---------- Bodhya AGENT: senses the user and reactively runs tasks ----------
// Watches activity, clicks, tab visibility & page changes → evaluates task list →
// starts tours, shows nudges, or opens chat — like a human companion, not a robot.
import { useEffect, useRef } from "react";
import { evaluateTasks } from "./tasks.js";
import { loadAgentMemory, saveAgentMemory } from "./agentMemory.js";

export default function Agent({
  lang,
  context,
  onboarded,
  tourDone,
  tourOpen,
  nudgeVisible,
  onStartTour,
  onShowNudge,
  onOpenChatWith,
  // tunables (mostly for tests; defaults feel right)
  idleMsLimit = 45000,
  parkedMsLimit = 180000,
  hiddenMsLimit = 120000,
  clickThreshold = 10,
  schedulerMs = 4000,
}) {
  const memRef = useRef(null);
  if (!memRef.current) memRef.current = loadAgentMemory();

  const clicksRef = useRef([]);
  const lastActivityRef = useRef(Date.now());
  const sectionSinceRef = useRef(Date.now());
  const lastSectionRef = useRef(context);
  const hiddenSinceRef = useRef(null);

  // activity: any interaction counts as "the user is alive"; clicks counted in a window
  useEffect(() => {
    const onAct = () => {
      lastActivityRef.current = Date.now();
      const now = Date.now();
      clicksRef.current.push(now);
      clicksRef.current = clicksRef.current.filter((t) => now - t < 15000);
    };
    const evts = ["mousedown", "keydown", "scroll", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    return () => evts.forEach((e) => window.removeEventListener(e, onAct));
  }, []);

  // tab visibility: remember how long the user was away → welcome-back task
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else {
        if (hiddenSinceRef.current && Date.now() - hiddenSinceRef.current > hiddenMsLimit) {
          memRef.current.lastHiddenReturnAt = Date.now();
          saveAgentMemory(memRef.current);
        }
        hiddenSinceRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // track how long the user stays on the same page (parked task)
  useEffect(() => {
    if (context !== lastSectionRef.current) {
      lastSectionRef.current = context;
      sectionSinceRef.current = Date.now();
    }
  }, [context]);

  // user dismissals → agent backs off (longer cooldowns)
  useEffect(() => {
    const onNudge = (e) => {
      const { kind, action } = e.detail || {};
      if (kind && (action === "no" || action === "dismiss")) {
        memRef.current.dismissed[kind] = (memRef.current.dismissed[kind] || 0) + 1;
        saveAgentMemory(memRef.current);
      }
    };
    window.addEventListener("bodhya:nudge-action", onNudge);
    return () => window.removeEventListener("bodhya:nudge-action", onNudge);
  }, []);

  // scheduler: every few seconds, sense the user and run the best task
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const ctx = {
        now,
        lang,
        context,
        onboarded,
        tourDone,
        tourOpen,
        nudgeVisible,
        idleMs: now - lastActivityRef.current,
        idleMsLimit,
        onPageMs: now - sectionSinceRef.current,
        parkedMsLimit,
        rapidClicks: clicksRef.current.length,
        clickThreshold,
        hiddenReturn:
          !!memRef.current.lastHiddenReturnAt &&
          now - memRef.current.lastHiddenReturnAt < 15000,
        mem: memRef.current,
      };
      const task = evaluateTasks(ctx);
      if (!task) return;
      memRef.current.lastShown[task.id] = now;
      memRef.current.shownCounts[task.id] = (memRef.current.shownCounts[task.id] || 0) + 1;
      saveAgentMemory(memRef.current);
      const outcome = task.run(ctx);
      if (outcome.action === "tour") onStartTour?.();
      else if (outcome.action === "nudge") onShowNudge?.(outcome.kind);
      else if (outcome.action === "chat") onOpenChatWith?.(outcome.message);
    }, schedulerMs);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, onboarded, tourDone, tourOpen, nudgeVisible]);

  return null;
}
