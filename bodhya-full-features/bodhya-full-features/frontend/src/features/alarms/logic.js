// ============================================================
//  Alarm logic — pure functions (no React, no browser APIs) so
//  they can be unit tested in plain Node.
// ============================================================

export const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
}

export const WEEKDAY_SET = [1, 2, 3, 4, 5]
export const WEEKEND_SET = [0, 6]

/** "7:05" → 425 minutes since midnight. Bad input → null. */
export function timeToMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim())
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function minutesToTime(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** "07:30" → "7:30 AM" (or 24h when use24 is true). */
export function fmtTime(hhmm, use24 = false) {
  const mins = timeToMinutes(hhmm)
  if (mins == null) return hhmm || ''
  const h = Math.floor(mins / 60), m = mins % 60
  if (use24) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function dayKey(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/** Unique id for one occurrence of an alarm (used as "already fired" key). */
export function occurrenceKey(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dayKey(dt)}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

/**
 * The next moment this alarm should ring, at or after `from`.
 * days: [] → one-time (next time today/tomorrow at that clock time)
 * days: [1,3,5] → weekly on those weekdays (0 = Sunday)
 */
export function nextOccurrence(alarm, from = new Date()) {
  const mins = timeToMinutes(alarm?.time)
  if (mins == null) return null
  const base = new Date(from.getTime())
  base.setSeconds(0, 0)
  const isWeekly = Array.isArray(alarm.days) && alarm.days.length > 0

  for (let addDays = 0; addDays <= 8; addDays++) {
    const cand = new Date(base)
    cand.setDate(cand.getDate() + addDays)
    cand.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
    if (cand.getTime() < base.getTime() - 1000) continue      // already passed today
    if (isWeekly && !alarm.days.includes(cand.getDay())) continue
    if (!isWeekly && addDays > 1) break                       // one-time: today or tomorrow only
    return cand
  }
  return null
}

/** How the repeat should read in the UI: "Once", "Every day", "Mon, Wed". */
export function describeRepeat(days, lang = 'en') {
  const list = Array.isArray(days) ? [...days].sort() : []
  if (list.length === 0) {
    return { en: 'Once', hi: 'एक बार', te: 'ఒకసారి' }[lang]
  }
  if (list.length === 7) return { en: 'Every day', hi: 'हर दिन', te: 'ప్రతిరోజూ' }[lang]
  if (list.join(',') === WEEKDAY_SET.join(',')) return { en: 'Weekdays', hi: 'सोम–शुक्र', te: 'సోమ–శుక్ర' }[lang]
  if (list.join(',') === WEEKEND_SET.join(',')) return { en: 'Weekends', hi: 'शनि–रवि', te: 'శని–ఆది' }[lang]
  const names = DAY_NAMES[lang] || DAY_NAMES.en
  return list.map((d) => names[d]).join(', ')
}

/** "in 6h 12m" style countdown for the next ring. */
export function untilText(ms, lang = 'en') {
  if (ms == null) return ''
  const total = Math.max(0, Math.round(ms / 60000))
  const d = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60
  const unit = {
    en: { d: 'd', h: 'h', m: 'm', now: 'ringing now' },
    hi: { d: 'दिन', h: 'घं', m: 'मि', now: 'अभी बजेगा' },
    te: { d: 'రో', h: 'గం', m: 'ని', now: 'ఇప్పుడే మోగుతుంది' },
  }[lang] || { d: 'd', h: 'h', m: 'm', now: 'ringing now' }
  if (total <= 0) return unit.now
  if (d > 0) return `${d}${unit.d} ${h}${unit.h}`
  if (h > 0) return `${h}${unit.h} ${m}${unit.m}`
  return `${m}${unit.m}`
}

export function sortAlarms(alarms = []) {
  return [...alarms].sort((a, b) => (timeToMinutes(a.time) ?? 0) - (timeToMinutes(b.time) ?? 0))
}

export function enabledAlarms(alarms = []) {
  return alarms.filter((a) => a.enabled)
}

/**
 * Which alarms are due right now? Respects:
 *   - snooze (snoozeUntil)
 *   - already-fired-for-this-occurrence (lastFiredKey)
 *   - grace window (don't ring an alarm from 4 hours ago when the tab reopens)
 */
export function dueAlarms(alarms = [], now = new Date(), graceMinutes = 30) {
  const out = []
  for (const a of alarms) {
    if (!a.enabled) continue
    if (a.snoozeUntil && new Date(a.snoozeUntil).getTime() > now.getTime()) continue
    const nmins = timeToMinutes(a.time)
    if (nmins == null) continue
    const today = new Date(now)
    today.setHours(Math.floor(nmins / 60), nmins % 60, 0, 0)
    const key = occurrenceKey(today)
    if (a.lastFiredKey === key) continue
    const late = now.getTime() - today.getTime()
    if (late < -1000 || late > graceMinutes * 60000) continue
    if (a.days?.length && !a.days.includes(today.getDay())) continue
    if (!a.days?.length && a.firedAt && occurrenceKey(new Date(a.firedAt)) === key) continue
    out.push({ alarm: a, at: today, key })
  }
  return out
}

/**
 * Occurrences that happened while the app was closed (so Bodhya can say
 * "you missed your 6:00 AM alarm"). Only looks back `maxDays` days and
 * skips anything already in the log.
 */
export function missedOccurrences(alarms = [], fromTs, to = new Date(), maxDays = 3) {
  if (!fromTs) return []
  const from = new Date(fromTs)
  const out = []
  for (const a of alarms) {
    if (!a.enabled) continue
    const nmins = timeToMinutes(a.time)
    if (nmins == null) continue
    for (let d = 0; d <= maxDays; d++) {
      const day = new Date(from)
      day.setDate(day.getDate() + d)
      day.setHours(Math.floor(nmins / 60), nmins % 60, 0, 0)
      if (day.getTime() <= from.getTime()) continue
      if (day.getTime() > to.getTime()) break
      if (a.days?.length && !a.days.includes(day.getDay())) continue
      const key = occurrenceKey(day)
      if (a.lastFiredKey === key) continue
      if (out.some((o) => o.key === key && o.alarm.id === a.id)) continue
      out.push({ alarm: a, at: day, key })
    }
  }
  return out.sort((x, y) => x.at - y.at)
}

/** Snooze helper → returns a timestamp. */
export function snoozeTime(minutes, now = new Date()) {
  return new Date(now.getTime() + Math.max(1, Number(minutes) || 10) * 60000).toISOString()
}

export const ALARM_TEMPLATES = [
  { id: 'wake', time: '06:00', days: WEEKDAY_SET, label: { en: 'Wake up & freshen',
    hi: 'उठो और तैयार हो जाओ', te: 'లేచి తయారవ్వండి' }, emoji: '🌅' },
  { id: 'morning', time: '07:30', days: WEEKDAY_SET, label: { en: 'Morning revision',
    hi: 'सुबह का रिवीज़न', te: 'ఉదయపు రివిజన్' }, emoji: '📖', linked: { feature: 'focus', subject: 'Revision' } },
  { id: 'school', time: '15:30', days: WEEKDAY_SET, label: { en: 'Homework time',
    hi: 'होमवर्क का समय', te: 'హోంవర్క్ సమయం' }, emoji: '✏️', linked: { feature: 'todo' } },
  { id: 'evening', time: '19:00', days: WEEKDAY_SET, label: { en: 'Evening study block',
    hi: 'शाम का स्टडी ब्लॉक', te: 'సాయంత్రం స్టడీ బ్లాక్' }, emoji: '🌆', linked: { feature: 'focus' } },
  { id: 'night', time: '21:30', days: [0, 1, 2, 3, 4, 5, 6], label: { en: 'Wind down',
    hi: 'आराम करो', te: 'విశ్రాంతి తీసుకోండి' }, emoji: '🌙' },
  { id: 'weekend', time: '09:00', days: WEEKEND_SET, label: { en: 'Weekend deep work',
    hi: 'सप्ताहांत गहन अभ्यास', te: 'వారాంతపు డీప్ వర్క్' }, emoji: '🚀', linked: { feature: 'focus' } },
]

/** Build a full alarm object from partial input (used by UI + chat). */
export function buildAlarm(input = {}) {
  const now = new Date()
  return {
    id: input.id || null,
    label: (input.label || '').trim() || 'Study alarm',
    time: timeToMinutes(input.time) != null ? input.time : minutesToTime(now.getHours() * 60 + now.getMinutes() + 5),
    days: Array.isArray(input.days) ? [...new Set(input.days)].sort() : [],
    enabled: input.enabled !== false,
    sound: input.sound || 'alarm',
    volume: typeof input.volume === 'number' ? input.volume : 0.8,
    vibrate: input.vibrate !== false,
    snoozeMinutes: input.snoozeMinutes || 10,
    linked: input.linked || null,           // {feature, payload}
    note: input.note || '',
    createdAt: input.createdAt || Date.now(),
    lastFiredKey: input.lastFiredKey || null,
    firedAt: input.firedAt || null,
    snoozeUntil: input.snoozeUntil || null,
    fireCount: input.fireCount || 0,
  }
}
