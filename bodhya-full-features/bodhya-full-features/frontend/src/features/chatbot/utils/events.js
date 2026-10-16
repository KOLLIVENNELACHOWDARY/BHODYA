// ============================================================
//  Bodhya event bus — how features talk to each other without
//  importing each other's UI.
//
//  Listeners registered with on() are kept in a local registry so
//  the bus works everywhere (browser, jsdom tests, plain Node).
//  Every emit() ALSO dispatches a window CustomEvent, so code that
//  prefers `window.addEventListener('bodhya:...')` (or an external
//  script) sees the same traffic — without double-firing on()
//  subscribers on either side.
// ============================================================

export const EVT = {
  // notifications
  notify: 'bodhya:notify',              // {title, body, kind, action, meta}
  toast: 'bodhya:toast',                // {title, body, tone}
  notifyChanged: 'bodhya:notify-changed', // inbox changed (badge refresh)
  // alarms
  alarmRing: 'bodhya:alarm-ring',       // {alarm}
  alarmStop: 'bodhya:alarm-stop',       // {id}
  alarmChanged: 'bodhya:alarm-changed',
  // tasks / plan / focus
  todoChanged: 'bodhya:todo-changed',
  planChanged: 'bodhya:plan-changed',
  focusChanged: 'bodhya:focus-changed',
  timeLogged: 'bodhya:time-logged',
  // study music · study forest · focus shield
  musicChanged: 'bodhya:music-changed',   // {playing, presetId}
  musicSleep: 'bodhya:music-sleep',       // {minutes} sleep timer finished
  forestChanged: 'bodhya:forest-changed',
  treePlanted: 'bodhya:tree-planted',     // {tree}
  treeGrown: 'bodhya:tree-grown',         // {tree}
  treeWithered: 'bodhya:tree-withered',   // {tree, reason}
  shieldChanged: 'bodhya:shield-changed',
  journalChanged: 'bodhya:journal-changed',
  guardianChanged: 'bodhya:guardian-changed',
  letterReady: 'bodhya:letter-ready',        // {letter}
  journalWritten: 'bodhya:journal-written',   // {entry, xp}
  distractionDetected: 'bodhya:distraction', // {awayMs, sessionId, strictness}
  // app level
  open: 'bodhya:open',                  // open the chat
  chatMessage: 'bodhya:chat-message',   // {text}
  openFeature: 'bodhya:open-feature',   // {id, payload} → switch tab
  levelup: 'bodhya:levelup',            // {level, xp}
  profileChanged: 'bodhya:profile-changed',
  nudgeAction: 'bodhya:nudge-action',
}

const registry = new Map()   // event name → Set(handler)

/** Emit a Bodhya app event to every subscriber (in-process and on window). */
export function emit(name, detail = {}) {
  const handlers = registry.get(name)
  if (handlers) {
    // copy: a handler may unsubscribe while we iterate
    for (const fn of [...handlers]) {
      try { fn(detail) } catch { /* one bad listener must not stop the rest */ }
    }
  }
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }))
    }
  } catch { /* window unavailable (Node/SSR) — the registry already ran */ }
  return detail
}

/** Subscribe to a Bodhya app event. Returns an unsubscribe function. */
export function on(name, handler) {
  if (typeof handler !== 'function') return () => {}
  if (!registry.has(name)) registry.set(name, new Set())
  registry.get(name).add(handler)
  return () => { registry.get(name)?.delete(handler) }
}

/** How many listeners are attached (handy in tests / debugging). */
export function listenerCount(name) {
  return registry.get(name)?.size || 0
}

/** Open a feature tab from anywhere (chat, notification, alarm, todo…). */
export function openFeature(id, payload = {}) {
  return emit(EVT.openFeature, { id, payload })
}

/** Ask Bodhya the chatbot to pop open with a message. */
export function openChatWith(text) {
  emit(EVT.open, {})
  if (text) setTimeout(() => emit(EVT.chatMessage, { text }), 350)
}

// Handy console bridge: bodhya.toast('hi'), bodhya.open('todo')
if (typeof window !== 'undefined') {
  window.bodhya = Object.assign(window.bodhya || {}, { emit, on, openFeature, openChatWith, EVT })
}
