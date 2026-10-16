// ============================================================
//  Time-tracking store — every minute you actually study lands
//  here: focus-timer sessions, completed plan sessions and
//  manual entries. Feeds the Time tab, the daily goal and the
//  digest Bodhya reads out.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'

export const TIME = makeStore(
  'bodhya_time_v1',
  {
    logs: [],                                  // {id, subject, minutes, at, source}
    settings: { dailyGoalMinutes: 120, weeklyGoalMinutes: 600 },
  },
  { changeEvent: EVT.timeLogged }
)

export function dayKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
export function addDays(date, n) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function logMinutes({ subject = 'Study', minutes = 0, source = 'focus', at = Date.now(), note = '' } = {}) {
  const mins = Math.round(Number(minutes) || 0)
  if (mins <= 0) return null
  const entry = { id: uid('tl'), subject, minutes: mins, at, source, note }
  TIME.update((s) => ({ logs: [entry, ...s.logs].slice(0, 2000) }))
  emit(EVT.timeLogged, { entry })
  return entry
}

export function removeLog(id) {
  TIME.update((s) => ({ logs: s.logs.filter((l) => l.id !== id) }))
}

export function clearLogs() {
  TIME.update({ logs: [] })
}

export function setTimeSettings(patch = {}) {
  TIME.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

// ------------------------------------------------------------------
// queries
// ------------------------------------------------------------------
export function minutesOn(dayK, logs = TIME.read().logs) {
  return logs.filter((l) => dayKey(l.at) === dayK).reduce((s, l) => s + l.minutes, 0)
}

export function todayMinutes(now = new Date()) {
  return minutesOn(dayKey(now))
}

export function weekBars(now = new Date(), days = 7) {
  const logs = TIME.read().logs
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i)
    const key = dayKey(d)
    out.push({
      key,
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      minutes: minutesOn(key, logs),
    })
  }
  return out
}

export function subjectTotals(days = 30, now = new Date()) {
  const cutoff = addDays(now, -days).getTime()
  const map = new Map()
  TIME.read().logs.filter((l) => l.at >= cutoff).forEach((l) => {
    const key = l.subject || 'Study'
    map.set(key, (map.get(key) || 0) + l.minutes)
  })
  return [...map.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

/** Consecutive days (ending today or yesterday) with at least one logged minute. */
export function studyStreak(now = new Date()) {
  const logs = TIME.read().logs
  let streak = 0
  let cursor = new Date(now)
  if (!logs.some((l) => dayKey(l.at) === dayKey(cursor))) cursor = addDays(cursor, -1)
  while (logs.some((l) => dayKey(l.at) === dayKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
    if (streak > 400) break
  }
  return streak
}

export function goalProgress(now = new Date()) {
  const { settings } = TIME.read()
  const today = todayMinutes(now)
  const week = weekBars(now, 7).reduce((s, d) => s + d.minutes, 0)
  return {
    today,
    goal: settings.dailyGoalMinutes,
    pct: settings.dailyGoalMinutes ? Math.min(100, Math.round((today / settings.dailyGoalMinutes) * 100)) : 0,
    week,
    weekGoal: settings.weeklyGoalMinutes,
    weekPct: settings.weeklyGoalMinutes ? Math.min(100, Math.round((week / settings.weeklyGoalMinutes) * 100)) : 0,
  }
}

export function recentLogs(limit = 12) {
  return TIME.read().logs.slice(0, limit)
}

export function formatMinutes(mins) {
  const m = Math.round(Number(mins) || 0)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}
