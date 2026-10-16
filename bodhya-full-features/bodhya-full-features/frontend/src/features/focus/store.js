// ============================================================
//  Focus / Pomodoro store — study blocks, breaks and the log.
//  A finished block: XP + study minutes + (if it came from the
//  study plan) marks that session done + a Bodhya notification.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { playSound, vibratePattern } from '../chatbot/utils/sound.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp } from '../chatbot/brain/memory.js'
import { logMinutes } from '../time-tracking/store.js'
import { completeSession } from '../study-schedule/store.js'
import {
  focusBars, focusStreak, formatClock, isFinished, phaseLabel, progressPct, randomBreakIdea,
  remainingMs, subjectTotals, todayFocus, xpForFocus,
} from './logic.js'

export const FOCUS = makeStore(
  'bodhya_focus_v1',
  {
    active: null,     // {id, mode, minutes, subject, sessionId, startedAt, endsAt, pausedAt, pausedTotal, cycle, cycles}
    log: [],          // {id, subject, minutes, at, mode, sessionId, completed}
    settings: {
      studyMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      cycles: 4,              // long break after N focus blocks
      autoBreak: true,        // start the break automatically
      autoStartNext: false,   // start the next focus block automatically
      sound: 'marimba',
      volume: 0.7,
      notifications: true,
      vibrate: true,
      lastSubject: '',
    },
  },
  { changeEvent: EVT.focusChanged }
)

const change = (detail = {}) => { emit(EVT.focusChanged, detail); return detail }

export function setFocusSettings(patch = {}) {
  FOCUS.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

// ------------------------------------------------------------------
// timer lifecycle
// ------------------------------------------------------------------
export function startFocus({
  minutes, subject, sessionId = null, mode = 'study', cycle = null, autostart = true, treeId = null,
} = {}) {
  const settings = FOCUS.read().settings
  const mins = Number(minutes) || (mode === 'study' ? settings.studyMinutes : settings.breakMinutes)
  const active = {
    id: uid('fx'),
    mode,
    minutes: mins,
    subject: subject || settings.lastSubject || '',
    sessionId,
    treeId,
    startedAt: Date.now(),
    endsAt: Date.now() + mins * 60000,
    pausedAt: null,
    pausedTotal: 0,
    cycle: cycle ?? 1,
    cycles: settings.cycles,
    autostart,
    idea: mode === 'study' ? null : randomBreakIdea('en'),
  }
  FOCUS.update({ active })
  if (subject) setFocusSettings({ lastSubject: subject })
  // other features listen to this: the shield arms, the music starts,
  // the forest marks its tree as "in progress"
  change({ started: active.id, mode, treeId, minutes: mins, subject: active.subject })
  return active
}

export function pauseFocus() {
  const active = FOCUS.read().active
  if (!active || active.pausedAt) return active
  const next = { ...active, pausedAt: Date.now() }
  FOCUS.update({ active: next })
  change({ paused: true })
  return next
}

export function resumeFocus(now = Date.now()) {
  const active = FOCUS.read().active
  if (!active || !active.pausedAt) return active
  const pausedFor = now - active.pausedAt
  const next = {
    ...active,
    pausedAt: null,
    pausedTotal: (active.pausedTotal || 0) + pausedFor,
    endsAt: active.endsAt + pausedFor,        // clock waits for you
  }
  FOCUS.update({ active: next })
  change({ resumed: true })
  return next
}

export function togglePause() {
  return FOCUS.read().active?.pausedAt ? resumeFocus() : pauseFocus()
}

/** Give me 5 more minutes (great when you are mid-flow). */
export function extendFocus(extraMinutes = 5) {
  const active = FOCUS.read().active
  if (!active) return null
  const base = active.pausedAt || Date.now()
  const next = {
    ...active,
    minutes: active.minutes + extraMinutes,
    endsAt: Math.max(base, active.endsAt) + extraMinutes * 60000,
    pausedAt: active.pausedAt,
  }
  FOCUS.update({ active: next })
  change({ extended: extraMinutes })
  spawnTimerNotification(next, `+${extraMinutes} min added. Keep going! 💪`)
  return next
}

/** Stop early — returns the logged block (or null if nothing to log). */
export function stopFocus({ reason = 'stopped' } = {}) {
  const active = FOCUS.read().active
  if (!active) return null
  const minutes = Math.max(1, Math.round((active.pausedAt || Date.now()) - active.startedAt - (active.pausedTotal || 0)) / 60000)
  const mins = Math.max(1, Math.round(minutes))
  FOCUS.update({ active: null })
  if (active.treeId) {
    // a tree only survives a finished session — leaving early withers it
    change({ ended: active.id, failed: true, treeWithered: active.treeId, treeReason: reason, minutes: mins })
  } else {
    change({ ended: active.id, failed: mins < 2, minutes: mins })
  }
  if (active.mode === 'study' && mins >= 2) {
    return logFocusBlock({ ...active, minutes: mins, completed: false, reason })
  }
  change({ stopped: true })
  return null
}

/** The timer ran out — celebrate / switch phase. */
export function finishPhase(now = Date.now()) {
  const active = FOCUS.read().active
  if (!active || !isFinished(active, now)) return null
  const settings = FOCUS.read().settings

  if (active.mode === 'study') {
    const done = logFocusBlock({ ...active, minutes: active.minutes, completed: true })
    const nextCycle = (active.cycle || 1) + 1
    const wantLong = nextCycle > settings.cycles
    FOCUS.update({ active: null })
    if (settings.notifications) {
      playSound(settings.sound, settings.volume)
      if (settings.vibrate) vibratePattern([200, 100, 200, 100, 400])
      pushNotification({
        kind: 'focus',
        title: `⏳ Focus block done${active.subject ? `: ${active.subject}` : ''}`,
        body: `${active.minutes} min logged · +${xpForFocus(active.minutes)} XP. Time for a ${wantLong ? settings.longBreakMinutes : settings.breakMinutes}-minute ${wantLong ? 'long ' : ''}break — ${randomBreakIdea('en')}`,
        action: { feature: 'focus' },
        groupKey: `focus-done-${active.id}`,
      })
    }
    emit(EVT.focusChanged, {
      completed: active.id,
      minutes: active.minutes,
      subject: active.subject,
      treeGrown: active.treeId || null,
      escapes: null,
    })
    if (settings.autoBreak) {
      startFocus({
        minutes: wantLong ? settings.longBreakMinutes : settings.breakMinutes,
        mode: wantLong ? 'long' : 'break',
        cycle: wantLong ? 1 : nextCycle,
        subject: active.subject,
      })
    }
    return done
  }

  // break finished → back to a study block
  FOCUS.update({ active: null })
  if (settings.notifications) {
    playSound('chime', settings.volume)
    pushNotification({
      kind: 'focus',
      title: '☕ Break over',
      body: active.subject ? `Ready for another block of ${active.subject}?` : 'Ready for the next focus block?',
      action: { feature: 'focus' },
      groupKey: `break-done-${active.id}`,
    })
  }
  if (settings.autoStartNext && active.subject) {
    startFocus({ minutes: settings.studyMinutes, subject: active.subject, cycle: active.cycle })
  }
  emit(EVT.focusChanged, { breakDone: active.id })
  return null
}

export function skipBreak() {
  const active = FOCUS.read().active
  if (active && active.mode !== 'study') {
    FOCUS.update({ active: null })
    change({ breakSkipped: true })
    return true
  }
  return false
}

/** Persist a finished/partial block: XP, minutes, plan session, notification. */
function logFocusBlock(block) {
  const entry = {
    id: uid('fl'),
    subject: block.subject || 'Study',
    minutes: block.minutes,
    at: Date.now(),
    mode: 'study',
    sessionId: block.sessionId || null,
    completed: !!block.completed,
    idea: null,
  }
  FOCUS.update((s) => ({ log: [entry, ...s.log].slice(0, 1000) }))
  logMinutes({ subject: entry.subject, minutes: entry.minutes, source: 'focus', at: entry.at })

  let xp = 0
  if (block.completed) {
    xp = xpForFocus(entry.minutes)
    addXp(xp)
    if (block.sessionId) {
      try { completeSession(block.sessionId, { minutes: entry.minutes }) } catch { /* session gone */ }
    }
  } else if (entry.minutes >= 10) {
    xp = Math.round(xpForFocus(entry.minutes) / 2)
    addXp(xp)
  }
  entry.xp = xp
  change({ logged: entry.id, xp })
  return entry
}

function spawnTimerNotification(active, body) {
  if (!FOCUS.read().settings.notifications) return
  pushNotification({
    kind: 'focus',
    title: `${phaseLabel(active.mode, 'en')}${active.subject ? ` · ${active.subject}` : ''}`,
    body,
    silent: true,
    action: { feature: 'focus' },
  })
}

export function clearFocusLog() {
  FOCUS.update({ log: [] })
}

// ------------------------------------------------------------------
// queries (thin wrappers so components import from one place)
// ------------------------------------------------------------------
export function focusState(now = new Date()) {
  const state = FOCUS.read()
  const active = state.active
  return {
    active,
    settings: state.settings,
    log: state.log,
    remaining: active ? remainingMs(active, Date.now()) : 0,
    clock: active ? formatClock(remainingMs(active, Date.now())) : formatClock(state.settings.studyMinutes * 60000),
    pct: active ? progressPct(active) : 0,
    phase: active ? phaseLabel(active.mode, 'en') : null,
    paused: !!active?.pausedAt,
    today: todayFocus(state.log, now),
    bars: focusBars(state.log, now),
    streak: focusStreak(state.log, now),
    subjects: subjectTotals(state.log),
  }
}

export { formatClock, remainingMs, progressPct, randomBreakIdea, todayFocus, focusBars, focusStreak, subjectTotals, xpForFocus }
