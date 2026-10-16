// ============================================================
//  Focus Shield store — the blocklist, the session guard, the
//  urge routine and the daily scroll budget.
//
//  Session guard: while a focus block (or a tree) runs, the shield
//  watches tab visibility, records every "escape", and hands the
//  verdict to the UI (warn / fail) and to the forest (wither).
// ============================================================

import { makeStore } from '../chatbot/utils/store.js'
import { emit, on, EVT } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp } from '../chatbot/brain/memory.js'
import { FOCUS } from '../focus/store.js'
import { FOREST, noteEscape, snapshot as treeSnapshot, witherTree } from '../study-forest/store.js'
import {
  DEFAULT_SETTINGS, budgetState, evaluateReturn, formatAway, normalizeSite, shieldStats,
  todayKey, URGE_TOTAL_SECONDS,
} from './logic.js'

export const SHIELD = makeStore(
  'bodhya_shield_v1',
  {
    sites: [],                 // ['instagram.com', …] (custom + pack picks)
    packs: ['social', 'video'],
    log: [],                   // {id, type:'escape'|'resisted'|'gave-in'|'break'|'blocked', at, day, awayMs, minutes, site}
    sessions: [],              // {id, startedAt, endedAt, escapes, minutes, protectedMinutes, treeId}
    urge: null,                // live urge routine {startedAt, seconds, step, expiresAt}
    armedSession: null,        // {id, startedAt, treeId, escapesTotal}
    settings: DEFAULT_SETTINGS,
    extensionInstalled: false,
    lastExportAt: null,
  },
  { changeEvent: EVT.shieldChanged }
)

const change = (detail = {}) => { emit(EVT.shieldChanged, detail); return detail }

// ------------------------------------------------------------------
//  blocklist
// ------------------------------------------------------------------
export function addSite(input) {
  const site = normalizeSite(input)
  if (!site) return { error: 'empty' }
  const state = SHIELD.read()
  if (state.sites.includes(site)) return { error: 'duplicate', site }
  SHIELD.update((s) => ({ sites: [...s.sites, site] }))
  change({ added: site })
  return { ok: true, site }
}

export function removeSite(site) {
  SHIELD.update((s) => ({ sites: s.sites.filter((x) => x !== site) }))
  change({ removed: site })
}

export function togglePack(packId) {
  SHIELD.update((s) => ({
    packs: s.packs.includes(packId) ? s.packs.filter((p) => p !== packId) : [...s.packs, packId],
  }))
  change({ packs: true })
}

export function setShieldSettings(patch = {}) {
  SHIELD.update((s) => ({ settings: { ...s.settings, ...patch } }))
  change({ settings: true })
}

export function markExtensionInstalled(v = true) {
  SHIELD.update({ extensionInstalled: !!v })
}

export function markExported() {
  SHIELD.update({ lastExportAt: Date.now() })
}

// ------------------------------------------------------------------
//  session guard (called by NotificationsHost + the focus flow)
// ------------------------------------------------------------------
let awayStartedAt = null
let currentAwayMs = 0

export function armShield({ sessionId = null, treeId = null } = {}) {
  if (!SHIELD.read().settings.enabled || !SHIELD.read().settings.armOnFocus) return null
  const session = { id: sessionId || `sh_${Date.now().toString(36)}`, startedAt: Date.now(), treeId, escapesTotal: 0 }
  SHIELD.update({ armedSession: session })
  awayStartedAt = null
  currentAwayMs = 0
  return session
}

export function disarmShield({ failed = false } = {}) {
  const state = SHIELD.read()
  const armed = state.armedSession
  if (!armed) return null
  const minutes = Math.round((Date.now() - armed.startedAt) / 60000)
  const entry = {
    id: armed.id,
    startedAt: armed.startedAt,
    endedAt: Date.now(),
    escapes: armed.escapesTotal,
    minutes,
    protectedMinutes: failed ? 0 : minutes,
    treeId: armed.treeId || null,
    failed,
  }
  SHIELD.update((s) => ({ armedSession: null, sessions: [entry, ...s.sessions].slice(0, 300) }))
  awayStartedAt = null
  currentAwayMs = 0
  change({ disarmed: entry.id })
  return entry
}

export function shieldArmed() {
  return SHIELD.read().armedSession
}

/** The tab went to the background / the user switched away. */
export function noteHidden(at = Date.now()) {
  const armed = SHIELD.read().armedSession
  if (!armed) return null
  awayStartedAt = at
  return { at }
}

/**
 * The user came back. Records the escape, decides the verdict and tells
 * the forest (which may wither the tree).
 */
export function noteVisible(at = Date.now()) {
  const state = SHIELD.read()
  const armed = state.armedSession
  if (!armed || !awayStartedAt) return null
  const awayMs = Math.max(0, at - awayStartedAt)
  awayStartedAt = null
  currentAwayMs = awayMs

  const warnMs = state.settings.warnAfterSeconds * 1000
  if (awayMs < warnMs) return { level: 'ok', awayMs }

  const escapes = armed.escapesTotal + 1
  let treeWithered = null
  if (armed.treeId) {
    const res = noteEscape(awayMs)
    if (res?.verdict?.wither) {
      treeWithered = witherTree(armed.treeId, res.verdict.reason)
    }
  }

  const verdict = evaluateReturn({
    awayMs,
    escapes,
    settings: state.settings,
    treeRunning: !!armed.treeId,
  })

  const entry = {
    id: `sl_${at.toString(36)}`,
    type: 'escape',
    at,
    day: todayKey(new Date(at)),
    awayMs,
    sessionId: armed.id,
    witherReason: treeWithered ? treeWithered.witherReason : null,
  }

  SHIELD.update((s) => ({
    log: [entry, ...s.log].slice(0, 800),
    armedSession: { ...s.armedSession, escapesTotal: escapes },
  }))

  if (state.settings.notifyOnEscape && verdict.level !== 'ok') {
    pushNotification({
      kind: 'shield',
      title: treeWithered ? '🥀 Your tree withered — you left the app' : `🛡️ You were away ${formatAway(awayMs)}`,
      body: treeWithered
        ? 'That is what strict mode does. Plant a shorter tree next time.'
        : verdict.message === 'session-failed'
          ? 'Too many breaks. Bodhya is still holding your session — come back to it.'
          : 'No scolding. Just tap "Back to study" and keep going.',
      silent: true,
      action: { feature: 'shield' },
    })
  }

  emit(EVT.distractionDetected, { awayMs, sessionId: armed.id, escapes, level: verdict.level })
  change({ escape: entry.id, level: verdict.level })
  return { level: verdict.level, awayMs, escapes, treeWithered, verdict }
}

export function lastAwayMs() { return currentAwayMs }

// ------------------------------------------------------------------
//  urge routine + scroll budget
// ------------------------------------------------------------------
export function startUrge(now = Date.now()) {
  const seconds = SHIELD.read().settings.urgeSeconds || URGE_TOTAL_SECONDS
  const urge = { startedAt: now, seconds, expiresAt: now + seconds * 1000 }
  SHIELD.update({ urge })
  change({ urge: 'started' })
  return urge
}

export function cancelUrge() {
  SHIELD.update({ urge: null })
  change({ urge: 'cancelled' })
}

/** Outcome of the urge routine: did the user resist, or give in? */
export function resolveUrge(outcome = 'resisted', { minutes = 0, site = null, now = Date.now() } = {}) {
  const entry = {
    id: `sl_${now.toString(36)}_u`,
    type: outcome,               // 'resisted' | 'gave-in' | 'break'
    at: now,
    day: todayKey(new Date(now)),
    minutes,
    site,
  }
  SHIELD.update((s) => ({ log: [entry, ...s.log].slice(0, 800), urge: null }))

  if (outcome === 'resisted') {
    const xp = addXp(6)
    pushNotification({
      kind: 'shield',
      title: '💪 You rode out the urge',
      body: `+6 XP. ${budgetLeftText()} Cravings fall if you keep doing this.`,
      silent: true,
      action: { feature: 'shield' },
    })
    change({ urge: 'resisted', leveledUp: xp.leveledUp })
  } else {
    pushNotification({
      kind: 'shield',
      title: outcome === 'break' ? `☕ ${minutes}-minute scroll break logged` : '📱 Logged honestly',
      body: `${budgetLeftText()} Honest logging beats pretending — that is how the budget works.`,
      silent: true,
      action: { feature: 'shield' },
    })
    change({ urge: outcome })
  }
  return entry
}

function budgetLeftText() {
  const state = SHIELD.read()
  const b = budgetState(state.settings, state.log)
  return `You have ${b.left} of ${state.settings.dailyScrollBreaks} scroll breaks left today.`
}

export function logBlockedSite(site) {
  const entry = { id: `sl_${Date.now().toString(36)}_b`, type: 'blocked', at: Date.now(), day: todayKey(), site }
  SHIELD.update((s) => ({ log: [entry, ...s.log].slice(0, 800) }))
  change({ blocked: site })
  return entry
}

// ------------------------------------------------------------------
//  queries
// ------------------------------------------------------------------
export function shieldState() {
  const state = SHIELD.read()
  return {
    ...state,
    stats: shieldStats({ sessions: state.sessions, log: state.log, settings: state.settings }),
    budget: budgetState(state.settings, state.log),
    armed: state.armedSession,
    tree: state.armedSession?.treeId ? treeSnapshot() : null,
    live: !!FOCUS.read().active || !!FOREST.read().alive,
  }
}

export function urgeState(now = Date.now()) {
  const urge = SHIELD.read().urge
  if (!urge) return null
  const elapsed = Math.max(0, (now - urge.startedAt) / 1000)
  return { ...urge, elapsed, done: elapsed >= urge.seconds, remaining: Math.max(0, urge.seconds - elapsed) }
}

export function clearShieldLog() {
  SHIELD.update({ log: [] })
}

// ------------------------------------------------------------------
//  wiring: arm the guard whenever a study block starts
// ------------------------------------------------------------------
on(EVT.focusChanged, (detail = {}) => {
  if (detail.started && (detail.mode || 'study') === 'study') {
    armShield({ treeId: detail.treeId || null, sessionId: null })
  }
  if (detail.ended) {
    disarmShield({ failed: !!detail.failed })
  }
})
