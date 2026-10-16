// ============================================================
//  Alarms store — persistence, firing, snoozing, missed alarms.
//  Firing = sound loop + ring overlay + notification inbox entry.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { startAlarmLoop, stopAlarmLoop } from '../chatbot/utils/sound.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import {
  buildAlarm, dueAlarms, fmtTime, missedOccurrences, nextOccurrence, occurrenceKey,
  snoozeTime, sortAlarms,
} from './logic.js'

export const ALARMS = makeStore(
  'bodhya_alarms_v1',
  {
    alarms: [],
    log: [],                 // {id, alarmId, label, at, action}
    lastSeenAt: null,        // for "you missed…" catch-up
    ringing: null,           // {alarmId, startedAt, key}
    settings: {
      use24: false,
      defaultSnooze: 10,
      defaultSound: 'alarm',
      volume: 0.8,
      vibrate: true,
      autoStopMinutes: 5,    // stop ringing after N minutes unattended
    },
  },
  { changeEvent: EVT.alarmChanged }
)

// ------------------------------------------------------------------
// CRUD
// ------------------------------------------------------------------
export function addAlarm(input = {}) {
  const alarm = buildAlarm({ ...input, id: uid('al') })
  ALARMS.update((s) => ({ alarms: [...s.alarms, alarm] }))
  const next = nextOccurrence(alarm)
  pushNotification({
    kind: 'alarm',
    title: `⏰ Alarm set for ${fmtTime(alarm.time, ALARMS.read().settings.use24)}`,
    body: `${alarm.label}${next ? ` · rings ${next.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}`,
    action: { feature: 'alarms' },
    groupKey: `alarm-set-${alarm.id}`,
  })
  return alarm
}

export function updateAlarm(id, patch = {}) {
  let updated = null
  ALARMS.update((s) => ({
    alarms: s.alarms.map((a) => {
      if (a.id !== id) return a
      updated = { ...a, ...patch }
      return updated
    }),
  }))
  return updated
}

export function removeAlarm(id) {
  stopRinging(id)
  ALARMS.update((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }))
}

export function toggleAlarm(id, enabled) {
  const alarm = ALARMS.read().alarms.find((a) => a.id === id)
  if (!alarm) return null
  const next = typeof enabled === 'boolean' ? enabled : !alarm.enabled
  return updateAlarm(id, { enabled: next, snoozeUntil: null, lastFiredKey: next ? null : alarm.lastFiredKey })
}

/** Duplicate an alarm (handy for "add another at 6:30"). */
export function duplicateAlarm(id) {
  const alarm = ALARMS.read().alarms.find((a) => a.id === id)
  if (!alarm) return null
  return addAlarm({ ...alarm, id: undefined, label: `${alarm.label} (copy)`, lastFiredKey: null, firedAt: null })
}

export function setAlarmSettings(patch = {}) {
  ALARMS.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

// ------------------------------------------------------------------
// Ringing lifecycle
// ------------------------------------------------------------------
function logEntry(alarm, action, at = Date.now(), extra = {}) {
  const entry = { id: uid('lg'), alarmId: alarm.id, label: alarm.label, at, action, ...extra }
  ALARMS.update((s) => ({ log: [entry, ...s.log].slice(0, 120) }))
  return entry
}

export function fireAlarm(alarmId, at = new Date(), { reason = 'alarm' } = {}) {
  const state = ALARMS.read()
  const alarm = state.alarms.find((a) => a.id === alarmId)
  if (!alarm) return null
  const key = occurrenceKey(at instanceof Date ? at : new Date(at))
  const settings = state.settings

  startAlarmLoop(alarm.sound, alarm.volume ?? settings.volume, {
    vibrate: alarm.vibrate !== false && settings.vibrate,
    id: alarm.id,
  })
  ALARMS.update((s) => ({
    ringing: { alarmId, startedAt: Date.now(), key, reason },
    alarms: s.alarms.map((a) => (a.id === alarmId
      ? {
        ...a,
        lastFiredKey: key,
        firedAt: Date.now(),
        fireCount: (a.fireCount || 0) + 1,
        snoozeUntil: null,
        enabled: a.days?.length ? a.enabled : false,   // one-time alarms switch off after ringing
      }
      : a)),
  }))
  logEntry(alarm, 'rang', Date.now(), { key })

  pushNotification({
    kind: 'alarm',
    title: `⏰ ${alarm.label}`,
    body: `It's ${fmtTime(alarm.time, settings.use24)} — ${alarm.note || 'time for your study block!'}`,
    silent: false,
    force: true,
    action: { feature: 'alarms', payload: { ringing: alarmId } },
    meta: { alarmId, key, linked: alarm.linked || null },
  })
  emit(EVT.alarmRing, { alarm: { ...alarm }, key })
  return alarm
}

export function ringNow(alarmId) {
  return fireAlarm(alarmId, new Date(), { reason: 'manual' })
}

export function snoozeAlarm(alarmId, minutes) {
  const state = ALARMS.read()
  const alarm = state.alarms.find((a) => a.id === alarmId)
  if (!alarm) return null
  const mins = Number(minutes) || alarm.snoozeMinutes || state.settings.defaultSnooze
  const until = snoozeTime(mins)
  stopAlarmLoop()
  ALARMS.update((s) => ({
    ringing: null,
    alarms: s.alarms.map((a) => (a.id === alarmId ? { ...a, snoozeUntil: until, enabled: true } : a)),
  }))
  logEntry(alarm, 'snoozed', Date.now(), { until })
  pushNotification({
    kind: 'alarm',
    title: `😴 Snoozed: ${alarm.label}`,
    body: `I'll ring again in ${mins} minutes.`,
    silent: true,
    groupKey: `snooze-${alarmId}-${until}`,
    action: { feature: 'alarms' },
  })
  return until
}

export function dismissAlarm(alarmId, { reason = 'dismissed' } = {}) {
  const alarm = ALARMS.read().alarms.find((a) => a.id === alarmId)
  stopAlarmLoop()
  ALARMS.update((s) => ({ ringing: null }))
  if (alarm) logEntry(alarm, reason, Date.now())
  return true
}

export function stopRinging(alarmId) {
  const ringing = ALARMS.read().ringing
  if (!ringing || !alarmId || ringing.alarmId === alarmId) {
    stopAlarmLoop()
    ALARMS.update({ ringing: null })
  }
}

/** Auto-stop guard: if the ring overlay has been up too long, stop it. */
export function enforceAutoStop(now = Date.now()) {
  const { ringing, settings } = ALARMS.read()
  if (!ringing) return false
  const limit = (settings.autoStopMinutes || 5) * 60000
  if (now - ringing.startedAt > limit) {
    dismissAlarm(ringing.alarmId, { reason: 'auto-stopped' })
    pushNotification({
      kind: 'alarm',
      title: '🔇 Alarm stopped by itself',
      body: 'Nobody dismissed it, so I stopped ringing. I kept it in your log.',
      silent: true,
      action: { feature: 'alarms' },
    })
    return true
  }
  return false
}

// ------------------------------------------------------------------
// Queries
// ------------------------------------------------------------------
export function nextAlarm(now = new Date()) {
  const alarms = ALARMS.read().alarms.filter((a) => a.enabled)
  const withNext = alarms
    .map((a) => ({ alarm: a, at: nextOccurrence(a, now) }))
    .filter((x) => x.at)
    .sort((x, y) => x.at - y.at)
  return withNext[0] || null
}

export function upcomingAlarms(now = new Date(), limit = 5) {
  return ALARMS.read().alarms
    .filter((a) => a.enabled)
    .map((a) => ({ alarm: a, at: nextOccurrence(a, now) }))
    .filter((x) => x.at)
    .sort((x, y) => x.at - y.at)
    .slice(0, limit)
}

export function sortedAlarms() {
  return sortAlarms(ALARMS.read().alarms)
}

/** Called by the global scheduler every tick. Returns fired alarms. */
export function checkDueAlarms(now = new Date()) {
  const fired = []
  for (const { alarm, at } of dueAlarms(ALARMS.read().alarms, now)) {
    if (ALARMS.read().ringing) break            // one ring at a time
    fired.push(fireAlarm(alarm.id, at))
  }
  return fired.filter(Boolean)
}

/** When the app was closed, tell the user what they missed (once). */
export function catchUpMissed(now = new Date()) {
  const state = ALARMS.read()
  const missed = missedOccurrences(state.alarms, state.lastSeenAt, now)
  if (missed.length) {
    const newest = missed[missed.length - 1]
    ALARMS.update((s) => ({
      alarms: s.alarms.map((a) => (newest.alarm.id === a.id ? { ...a, lastFiredKey: newest.key } : a)),
      log: [
        ...missed.map((m) => ({
          id: uid('lg'), alarmId: m.alarm.id, label: m.alarm.label,
          at: m.at.getTime(), action: 'missed', key: m.key,
        })),
        ...s.log,
      ].slice(0, 120),
    }))
    pushNotification({
      kind: 'alarm',
      title: missed.length === 1 ? '😴 You missed an alarm' : `😴 You missed ${missed.length} alarms`,
      body: `${missed[0].alarm.label} at ${fmtTime(missed[0].alarm.time, state.settings.use24)}${missed.length > 1 ? ` · +${missed.length - 1} more` : ''}. Want to move it to a better time?`,
      silent: true,
      action: { feature: 'alarms' },
    })
  }
  ALARMS.update({ lastSeenAt: now.getTime() })
  return missed
}

/** Alarms linked to a to-do / session (set from the to-do list UI or chat). */
export function alarmsFor(feature, itemId) {
  return ALARMS.read().alarms.filter(
    (a) => a.linked?.feature === feature && String(a.linked?.id) === String(itemId)
  )
}

export function removeAlarmsFor(feature, itemId) {
  const gone = alarmsFor(feature, itemId).map((a) => a.id)
  if (!gone.length) return 0
  ALARMS.update((s) => ({ alarms: s.alarms.filter((a) => !gone.includes(a.id)) }))
  return gone.length
}

export function clearAlarmLog() {
  ALARMS.update({ log: [] })
}

export { fmtTime, describeRepeat, untilText, nextOccurrence } from './logic.js'
