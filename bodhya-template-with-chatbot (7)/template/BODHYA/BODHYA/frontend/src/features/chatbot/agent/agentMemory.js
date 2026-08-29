// ---------- Agent memory: what Bodhya-the-agent remembers (persisted) ----------

const KEY = "bodhya_agent_v1";

export function defaultAgentMemory() {
  return {
    lastShown: {},        // taskId -> timestamp last shown
    shownCounts: {},      // taskId -> how many times shown
    dismissed: {},        // taskId -> how many times user dismissed it (back-off)
    lastSessionStart: Date.now(),
    sessions: 1,
    lastHiddenReturnAt: 0, // when user came back after leaving the tab
    tourStarted: false,
  };
}

export function loadAgentMemory() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...defaultAgentMemory(), ...JSON.parse(raw) };
  } catch {}
  const m = defaultAgentMemory();
  saveAgentMemory(m);
  return m;
}

export function saveAgentMemory(m) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(m));
  } catch {}
}

export function resetAgentMemory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}
