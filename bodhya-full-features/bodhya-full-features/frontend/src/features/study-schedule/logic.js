// ============================================================
//  Study-plan logic — pure, deterministic plan generator.
//  No LLM needed: spreading study time across days is arithmetic,
//  and doing it locally means it works offline and instantly.
// ============================================================

import { DAY_NAMES } from '../alarms/logic.js'

export const SUBJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

export const DIFFICULTY = [
  { id: 1, emoji: '🌱', label: { en: 'Easy', hi: 'आसान', te: 'సులభం' }, factor: 1 },
  { id: 2, emoji: '🔥', label: { en: 'Medium', hi: 'मध्यम', te: 'మధ్యస్థం' }, factor: 1.25 },
  { id: 3, emoji: '🌋', label: { en: 'Hard', hi: 'कठिन', te: 'కష్టం' }, factor: 1.55 },
]

export const SESSION_TYPES = {
  study:    { emoji: '📘', label: { en: 'Study', hi: 'अध्ययन', te: 'చదువు' } },
  revision: { emoji: '🔁', label: { en: 'Revision', hi: 'रिवीज़न', te: 'రివిజన్' } },
  practice: { emoji: '🧩', label: { en: 'Practice', hi: 'अभ्यास', te: 'ప్రాక్టీస్' } },
  test:     { emoji: '📝', label: { en: 'Mock test', hi: 'मॉक टेस्ट', te: 'మాక్ టెస్ట్' } },
}

export const PLAN_TEMPLATES = [
  {
    id: 'exam7', emoji: '🚨',
    title: { en: 'Exam in 7 days', hi: '7 दिन में परीक्षा', te: '7 రోజుల్లో పరీక్ష' },
    desc: { en: 'Heavy 2 h/day, revision every third day.', hi: 'रोज़ 2 घंटे, हर तीसरे दिन रिवीज़न।', te: 'రోజుకు 2 గం, ప్రతి 3వ రోజు రివిజన్.' },
    apply: { days: 7, dailyMinutes: 120, spacedRepetition: true },
  },
  {
    id: 'daily1', emoji: '🌤️',
    title: { en: '1 hour daily habit', hi: 'रोज़ 1 घंटा', te: 'రోజుకు 1 గంట' },
    desc: { en: 'Sustainable daily block, gentle pace.', hi: 'रोज़ थोड़ा-थोड़ा, आराम से।', te: 'రోజూ కొద్దిగా, ప్రశాంతంగా.' },
    apply: { days: 14, dailyMinutes: 60, spacedRepetition: true },
  },
  {
    id: 'weekend', emoji: '🚀',
    title: { en: 'Weekend deep work', hi: 'सप्ताहांत गहन अभ्यास', te: 'వారాంత డీప్ వర్క్' },
    desc: { en: 'Big blocks on Saturday & Sunday only.', hi: 'केवल शनि-रवि बड़े ब्लॉक।', te: 'శని, ఆది పెద్ద బ్లాక్‌లు.' },
    apply: { days: 14, dailyMinutes: 180, studyDays: [0, 6], spacedRepetition: true },
  },
  {
    id: 'revision', emoji: '🔁',
    title: { en: 'Revision sprint', hi: 'रिवीज़न स्प्रिंट', te: 'రివిజన్ స్ప్రింట్' },
    desc: { en: 'Short spaced-repetition revision sessions.', hi: 'छोटे-छोटे दोहराव सत्र।', te: 'చిన్న చిన్న రివిజన్ సెషన్లు.' },
    apply: { days: 5, dailyMinutes: 45, spacedRepetition: true, revisionHeavy: true },
  },
]

// ------------------------------------------------------------------
// date helpers (kept local so logic.js has zero deps)
// ------------------------------------------------------------------
export function dayKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
export function parseDayKey(key) {
  const [y, m, d] = String(key || '').split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}
export function addDays(date, n) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
export function daysBetween(aKey, bKey) {
  const a = parseDayKey(aKey); const b = parseDayKey(bKey)
  return Math.round((b - a) / 86400000)
}
export function minutesToTime(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
export function timeToMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** How much attention a subject deserves: difficulty × priority. */
export function subjectWeight(subject) {
  const diff = DIFFICULTY.find((d) => d.id === Number(subject.difficulty))?.factor || 1
  const pri = 0.8 + (Number(subject.priority) || 2) * 0.3      // 1→1.1, 2→1.4, 3→1.7
  return diff * pri
}

export function examCountdown(examDate, now = new Date()) {
  if (!examDate) return null
  const days = daysBetween(dayKey(now), examDate)
  const exam = parseDayKey(examDate)
  exam.setHours(9, 0, 0, 0)
  const hours = Math.max(0, Math.round((exam.getTime() - now.getTime()) / 3600000))
  return { days, hours, isPast: days < 0, isToday: days === 0 }
}

/**
 * Generate a study plan.
 * @param {object} opts
 * @param {Array}  opts.subjects      [{id,name,priority,difficulty,targetHours,topics[]}]
 * @param {string} opts.examDate      'YYYY-MM-DD' | null
 * @param {number} opts.days          horizon when there is no exam date (default 7)
 * @param {number} opts.dailyMinutes  minutes available per study day
 * @param {Array}  opts.studyDays     weekdays allowed (0=Sun)
 * @param {number} opts.sessionMinutes length of one session (default 30)
 * @param {boolean} opts.spacedRepetition add D+1/+3/+7 recall sessions
 * @param {Date}   opts.now
 */
export function generatePlan(opts = {}) {
  const {
    subjects = [], examDate = null, days = 7, dailyMinutes = 120,
    studyDays = [0, 1, 2, 3, 4, 5, 6], sessionMinutes = 30,
    spacedRepetition = true, startTime = '17:00', now = new Date(),
  } = opts

  const usable = subjects.filter((s) => Number(s.targetHours) > 0)
  if (!usable.length) return { sessions: [], meta: { reason: 'no-subjects' } }

  // horizon: up to the day before the exam (capped at 6 weeks), else `days`
  const today = dayKey(now)
  let horizon = Number(days) || 7
  if (examDate) {
    const left = daysBetween(today, examDate)
    horizon = Math.max(0, Math.min(left, 42))
  }
  if (horizon <= 0) return { sessions: [], meta: { reason: 'exam-today' } }

  // collect usable days (respect chosen weekdays)
  const dayList = []
  for (let i = 0; i < horizon; i++) {
    const d = addDays(now, i)
    if (studyDays.length && !studyDays.includes(d.getDay())) continue
    dayList.push({ key: dayKey(d), date: d })
  }
  if (!dayList.length) return { sessions: [], meta: { reason: 'no-days' } }

  const perDay = Math.max(15, Number(dailyMinutes) || 60)
  const chunk = Math.max(15, Number(sessionMinutes) || 30)
  const totalCapacity = dayList.length * perDay
  const totalWanted = usable.reduce((sum, s) => sum + Number(s.targetHours) * 60, 0)

  // ---- book the "extras" first so a day can never overflow ----
  //  Every study day ends with a 10-minute recall session, and the busiest
  //  subject comes back for spaced repetition on D+3 and D+7. Reserving those
  //  minutes up front means the plan always fits the time the user really has.
  const lastKey = dayList[dayList.length - 1].key
  const spacedDays = []
  if (spacedRepetition) {
    for (const offset of [3, 7]) {
      const d = addDays(now, offset)
      const key = dayKey(d)
      if (daysBetween(key, lastKey) < 0) continue                    // stays inside the plan
      if (examDate && daysBetween(key, examDate) < 0) continue        // and before the exam
      if (studyDays.length && !studyDays.includes(d.getDay())) continue
      if (spacedDays.includes(key)) continue
      spacedDays.push(key)
    }
  }
  const recallPerDay = (usable.length > 1 && perDay >= 60) ? 10 : 0
  const extrasByDay = new Map()
  const addExtra = (key, minutes) => extrasByDay.set(key, (extrasByDay.get(key) || 0) + minutes)
  if (recallPerDay) dayList.forEach((d) => addExtra(d.key, recallPerDay))
  spacedDays.forEach((k) => addExtra(k, 20))

  const dayCapacity = dayList.map((d) => Math.max(15, perDay - (extrasByDay.get(d.key) || 0)))
  const bookable = dayCapacity.reduce((a, b) => a + b, 0)
  const crowded = totalWanted > bookable

  // ---- per-subject minute budgets ----
  const weights = usable.map((s) => ({ s, w: subjectWeight(s) }))
  const wSum = weights.reduce((a, b) => a + b.w, 0) || 1
  const budgets = weights.map(({ s, w }) => ({
    subject: s,
    wanted: Number(s.targetHours) * 60,
    minutes: Math.round(Math.min(Number(s.targetHours) * 60, (w / wSum) * bookable)),
    weight: w,
  }))

  // ---- fill the days in order, never exceeding a day's capacity ----
  //  (a greedy "largest subject remaining first" fill: it can never overflow a
  //   day, never leaves an unusable <15 min remainder, and mixes subjects)
  const queues = budgets.map((b) => ({ subject: b.subject, weight: b.weight, left: b.minutes }))
  const perDayUnits = dayList.map(() => [])
  let placedMinutes = 0
  for (let di = 0; di < dayList.length; di++) {
    let dayLeft = dayCapacity[di]
    const ordered = [...queues].sort((a, b) => (b.left * b.weight) - (a.left * a.weight))
    const shift = ordered.length ? di % ordered.length : 0
    const rotated = [...ordered.slice(shift), ...ordered.slice(0, shift)]
    for (const q of rotated) {
      if (dayLeft < 15) break
      if (q.left < 15) continue
      let take = Math.min(chunk, q.left, dayLeft)
      if (q.left - take > 0 && q.left - take < 15) take = q.left   // keep remainders usable
      perDayUnits[di].push({ subject: q.subject, weight: q.weight, minutes: take })
      q.left -= take
      dayLeft -= take
      placedMinutes += take
    }
  }
  if (!placedMinutes) return { sessions: [], meta: { reason: 'too-little-time' } }

  // ---- build the sessions: hardest subject in the freshest slot ----
  const startMin = timeToMinutes(startTime) ?? 17 * 60
  const gap = 10
  const sessions = []
  const topicCursor = new Map()
  const busiestSubject = () => {
    const counts = new Map()
    sessions.forEach((s) => counts.set(s.subjectId, (counts.get(s.subjectId) || 0) + s.minutes))
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return best ? usable.find((s) => s.id === best[0]) : usable[0]
  }

  for (let di = 0; di < dayList.length; di++) {
    const day = dayList[di]
    let cursorMin = startMin
    let idx = 0
    perDayUnits[di]
      .sort((a, b) => b.weight - a.weight)
      .forEach((u) => {
        const topics = u.subject.topics || []
        const tIndex = topicCursor.get(u.subject.id) || 0
        const topic = topics.length ? topics[tIndex % topics.length] : null
        topicCursor.set(u.subject.id, tIndex + 1)
        sessions.push({
          id: `ss_${day.key}_${di}_${idx++}`,
          subjectId: u.subject.id,
          subjectName: u.subject.name,
          day: day.key,
          startTime: minutesToTime(cursorMin),
          minutes: u.minutes,
          topic,
          type: 'study',
          done: false,
          doneAt: null,
          source: 'plan',
        })
        cursorMin += u.minutes + gap
      })

    // 10-minute "recall" wrap-up so the day's learning sticks
    if (recallPerDay) {
      sessions.push({
        id: `ss_${day.key}_recall`,
        subjectId: usable[0].id,
        subjectName: usable[0].name,
        day: day.key,
        startTime: minutesToTime(cursorMin),
        minutes: recallPerDay,
        topic: null,
        type: 'revision',
        done: false,
        doneAt: null,
        source: 'plan',
      })
      cursorMin += recallPerDay + gap
    }

    // spaced repetition: bring the heaviest subject back on D+3 / D+7
    if (spacedDays.includes(day.key)) {
      const subject = busiestSubject()
      sessions.push({
        id: `ss_${day.key}_spaced`,
        subjectId: subject.id,
        subjectName: subject.name,
        day: day.key,
        startTime: minutesToTime(cursorMin),
        minutes: 20,
        topic: null,
        type: 'revision',
        done: false,
        doneAt: null,
        source: 'spaced',
      })
    }
  }

  sessions.sort((a, b) => (a.day === b.day
    ? (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0)
    : a.day < b.day ? -1 : 1))

  const totalPlanned = sessions.reduce((s, x) => s + x.minutes, 0)
  const perSubject = budgets.map((b) => ({
    subjectId: b.subject.id,
    name: b.subject.name,
    planned: sessions.filter((s) => s.subjectId === b.subject.id).reduce((sum, s) => sum + s.minutes, 0),
    wanted: b.minutes,
    targetMinutes: b.wanted,
  }))

  return {
    sessions,
    meta: {
      reason: 'ok',
      horizon,
      days: dayList.length,
      totalPlanned,
      totalWanted,
      capacity: totalCapacity,
      bookable,
      coverage: totalCapacity ? Math.round((totalPlanned / totalCapacity) * 100) : 0,
      scaled: crowded,
      perSubject,
      sessionsPerDay: Math.max(1, Math.round(perDay / chunk)),
      examDate,
    },
  }
}

/** Human explanation of the generated plan ("why this plan"). */
export function explainPlan(meta, lang = 'en') {
  if (!meta) return ''
  if (meta.reason === 'no-subjects') {
    return {
      en: 'Add at least one subject with target hours and I can build the plan right away.',
      hi: 'कम से कम एक विषय और लक्ष्य घंटे जोड़ें, फिर मैं तुरंत प्लान बना दूँगा।',
      te: 'కనీసం ఒక సబ్జెక్ట్, లక్ష్య గంటలు జోడిస్తే నేను వెంటనే ప్లాన్ చేస్తాను.',
    }[lang]
  }
  if (meta.reason === 'exam-today') {
    return { en: 'Your exam is today — no plan needed. Good luck! 🍀', hi: 'आज ही परीक्षा है — प्लान की ज़रूरत नहीं। शुभकामनाएँ! 🍀', te: 'ఈరోజే పరీక్ష — ప్లాన్ అవసరం లేదు. ఆల్ ది బెస్ట్! 🍀' }[lang]
  }
  if (meta.reason === 'no-days' || meta.reason === 'too-little-time') {
    return {
      en: 'There is not enough free time in the days you picked — add a study day or a few more minutes.',
      hi: 'चुने गए दिनों में पर्याप्त समय नहीं है — एक दिन या थोड़े मिनट और जोड़िए।',
      te: 'మీరు ఎంచుకున్న రోజుల్లో సరిపడా సమయం లేదు — ఒక రోజు లేదా కొన్ని నిమిషాలు జోడించండి.',
    }[lang]
  }
  const h = Math.floor(meta.totalPlanned / 60), m = meta.totalPlanned % 60
  return {
    en: `I spread ${h}h ${m}m across ${meta.days} study day${meta.days > 1 ? 's' : ''} (~${meta.sessionsPerDay} session${meta.sessionsPerDay > 1 ? 's' : ''}/day, 10-minute breaks built in)${meta.scaled ? ' — trimmed so it actually fits your week' : ''}. Harder subjects get the freshest slots, and they come back for revision on day +3 and +7 so you don't forget them.`,
    hi: `मैंने ${h}घं ${m}मि को ${meta.days} दिनों में बाँटा (रोज़ ~${meta.sessionsPerDay} सत्र, 10 मिनट के ब्रेक सहित)${meta.scaled ? ' — हफ़्ते में फिट करने के लिए थोड़ा छोटा किया' : ''}। कठिन विषयों को सबसे ताज़ा समय मिला, और वे दिन +3 व +7 पर दोहराने के लिए लौटते हैं।`,
    te: `${h}గం ${m}ని ${meta.days} రోజుల్లో పంచాను (రోజుకు ~${meta.sessionsPerDay} సెషన్, 10 నిమి విరామాలతో)${meta.scaled ? ' — వారంలో సరిపోయేలా కుదించాను' : ''}. కష్టమైన సబ్జెక్ట్‌లకు ఫ్రెష్ స్లాట్‌లు, అవి +3, +7 రోజులకు రివిజన్‌కు తిరిగి వస్తాయి.`,
  }[lang]
}

/** 7-day grid for the week view. */
export function weekGrid(sessions = [], fromDate = new Date(), days = 7) {
  const out = []
  for (let i = 0; i < days; i++) {
    const d = addDays(fromDate, i)
    const key = dayKey(d)
    const list = sessions.filter((s) => s.day === key)
      .sort((a, b) => (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0))
    out.push({
      key,
      date: d,
      weekday: d.getDay(),
      label: DAY_NAMES.en[d.getDay()],
      isToday: key === dayKey(new Date()),
      sessions: list,
      minutes: list.reduce((sum, s) => sum + s.minutes, 0),
      doneMinutes: list.filter((s) => s.done).reduce((sum, s) => sum + s.minutes, 0),
    })
  }
  return out
}

/** Progress + per-subject breakdown. */
export function planProgress(sessions = [], subjects = []) {
  const totalMinutes = sessions.reduce((s, x) => s + x.minutes, 0)
  const doneMinutes = sessions.filter((s) => s.done).reduce((s, x) => s + x.minutes, 0)
  const perSubject = subjects.map((sub) => {
    const list = sessions.filter((s) => s.subjectId === sub.id)
    const planned = list.reduce((s, x) => s + x.minutes, 0)
    const done = list.filter((x) => x.done).reduce((s, x) => s + x.minutes, 0)
    return { subject: sub, planned, done, pct: planned ? Math.round((done / planned) * 100) : 0, sessions: list.length }
  })
  return {
    totalMinutes, doneMinutes, pct: totalMinutes ? Math.round((doneMinutes / totalMinutes) * 100) : 0,
    totalSessions: sessions.length,
    doneSessions: sessions.filter((s) => s.done).length,
    perSubject,
  }
}

export function todaySessions(sessions = [], now = new Date()) {
  return sessions
    .filter((s) => s.day === dayKey(now))
    .sort((a, b) => (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0))
}

/** Which session should come next? (drives the "start focus" buttons) */
export function nextSession(sessions = [], now = new Date()) {
  const pending = todaySessions(sessions, now).find((s) => !s.done)
  if (pending) return pending
  return sessions
    .filter((s) => !s.done && s.day > dayKey(now))
    .sort((a, b) => (a.day === b.day
      ? (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0)
      : a.day < b.day ? -1 : 1))[0] || null
}

/** Export the plan as text (copy button / share with parents). */
export function planToText(sessions = [], subjects = [], lang = 'en') {
  void subjects
  const byDay = {}
  sessions.forEach((s) => { (byDay[s.day] = byDay[s.day] || []).push(s) })
  const lines = [{ en: '📚 My study plan', hi: '📚 मेरा स्टडी प्लान', te: '📚 నా స్టడీ ప్లాన్' }[lang], '']
  Object.keys(byDay).sort().forEach((day) => {
    const d = parseDayKey(day)
    lines.push(`${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}`)
    byDay[day].forEach((s) => {
      const typeLabel = s.type !== 'study' ? ` (${SESSION_TYPES[s.type]?.label?.[lang] || s.type})` : ''
      lines.push(`  ${s.done ? '✅' : '⬜'} ${s.startTime} · ${s.subjectName} · ${s.minutes} min${s.topic ? ` · ${s.topic}` : ''}${typeLabel}`)
    })
    lines.push('')
  })
  return lines.join('\n')
}

// ------------------------------------------------------------------
// Recurring sessions — "every Mon & Wed until the exam"
//
// A session can carry a rule:  { days:[1,3], until:'YYYY-MM-DD', everyWeeks:1 }
// The session holding the rule stays where it is; the occurrences it implies
// are materialised as normal sessions (tagged with seriesId) so that a
// student can still drag, delete or complete one without breaking the rule.
// ------------------------------------------------------------------

export const WEEKDAY_SHORT = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
}

/** Normalise whatever the UI sent into a rule we can trust. */
export function normaliseRecurrence(rule) {
  if (!rule) return null
  const days = [...new Set((rule.days || []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
  if (!days.length) return null
  const until = rule.until && /^\d{4}-\d{2}-\d{2}$/.test(rule.until) ? rule.until : null
  const everyWeeks = Math.min(4, Math.max(1, Number(rule.everyWeeks) || 1))
  return { days, until, everyWeeks }
}

/**
 * Occurrences implied by a rule, as day keys, between `from` and `horizonDays`.
 * Respects `everyWeeks`, never returns the session's own day twice.
 */
export function recurrenceDays(rule, startDay, { from = new Date(), horizonDays = 21 } = {}) {
  const rec = normaliseRecurrence(rule)
  if (!rec) return []
  const start = parseDayKey(startDay)
  const fromKey = dayKey(from)
  const out = []
  for (let i = 0; i < horizonDays; i++) {
    const d = addDays(from, i)
    const key = dayKey(d)
    if (key <= fromKey && key !== fromKey) continue
    if (rec.until && key > rec.until) break
    if (!rec.days.includes(d.getDay())) continue
    const weeks = Math.floor(daysBetween(dayKey(start), key) / 7)
    if (rec.everyWeeks > 1 && weeks % rec.everyWeeks !== 0) continue
    out.push(key)
  }
  return out
}

/** "Every Mon, Wed until 2026-11-30" — for the chip title/aria label. */
export function describeRecurrence(rule, lang = 'en') {
  const rec = normaliseRecurrence(rule)
  if (!rec) return ''
  const names = WEEKDAY_SHORT[lang] || WEEKDAY_SHORT.en
  const list = rec.days.map((d) => names[d]).join(', ')
  const until = rec.until ? ` · ${rec.until}` : ''
  return `${list}${until}`
}

/** All sessions that belong to the same series (the rule holder included). */
export function seriesSessions(sessions = [], seriesId) {
  if (!seriesId) return []
  return sessions
    .filter((s) => s.seriesId === seriesId || s.id === seriesId)
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0)))
}

/**
 * Can this session go there? Pure, so the UI and the tests agree.
 * `taken` keeps simultaneous sessions legal but visible (two chips per cell is
 * allowed — the grid renders them stacked), so a clash is a warning, not a veto.
 */
export function validateMove(session, target = {}, sessions = []) {
  if (!session) return { ok: false, reason: 'missing', conflicts: [] }
  const day = target.day || session.day
  const startTime = target.startTime || session.startTime
  if (day === session.day && startTime === session.startTime) {
    return { ok: false, reason: 'same', conflicts: [], day, startTime }
  }
  if (session.done) return { ok: false, reason: 'done', conflicts: [], day, startTime }
  const conflicts = sessions.filter((s) => s.id !== session.id && s.day === day && s.startTime === startTime)
  return { ok: true, reason: conflicts.length ? 'clash' : null, conflicts, day, startTime }
}

/** Summary of a series for the UI badge: 3 of 8 done, next on 2026-11-04. */
export function seriesSummary(sessions = [], seriesId, now = new Date()) {
  const all = seriesSessions(sessions, seriesId)
  const done = all.filter((s) => s.done).length
  const future = all.filter((s) => s.day >= dayKey(now) && !s.done)[0] || null
  return { total: all.length, done, remaining: all.length - done, next: future }
}

/** Weekday numbers mentioned in a sentence, in any of the three languages. */
export function weekdaysInText(text = '') {
  const t = String(text || '').toLowerCase()
  const found = new Set()
  const table = [
    { idx: 0, words: ['sunday', 'sun', 'रविवार', 'रवि', 'आदिवार', 'ఆదివారం', 'ఆది'] },
    { idx: 1, words: ['monday', 'mon', 'सोमवार', 'सोम', 'సోమవారం', 'సోమ'] },
    { idx: 2, words: ['tuesday', 'tue', 'tues', 'मंगलवार', 'मंगल', 'మంగళవారం', 'మంగళ'] },
    { idx: 3, words: ['wednesday', 'wed', 'बुधवार', 'बुध', 'బుధవారం', 'బుధ'] },
    { idx: 4, words: ['thursday', 'thu', 'thurs', 'गुरुवार', 'गुरु', 'బృహస్పతివారం', 'గురువారం', 'గురు'] },
    { idx: 5, words: ['friday', 'fri', 'शुक्रवार', 'शुक्र', 'శుక్రవారం', 'శుక్ర'] },
    { idx: 6, words: ['saturday', 'sat', 'शनिवार', 'शनि', 'శనివారం', 'శని'] },
  ]
  table.forEach(({ idx, words }) => { if (words.some((w) => t.includes(w))) found.add(idx) })
  if (/\bweekdays?\b|सोम से शुक्र|వారంరోజుల్లో/.test(t)) [1, 2, 3, 4, 5].forEach((d) => found.add(d))
  if (/\bweekend\b|सप्ताहांत|వారాంత/.test(t)) { found.add(0); found.add(6) }
  return [...found].sort()
}
