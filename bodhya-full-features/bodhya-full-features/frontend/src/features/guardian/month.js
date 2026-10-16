// ============================================================
//  📄 Month in review — pure aggregation for the printable summary
//  a parent-teacher meeting can actually use.
//
//  Everything here is computed from what the other features recorded:
//  focus minutes per day, trees, clean sessions, tasks ticked, journal
//  moods and wins. No journal *text* is read unless the caller passes
//  it in explicitly (the Guardian section rules decide that upstream).
// ============================================================

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
export function monthKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
export function monthLabel(monthIso, lang = 'en') {
  const [y, m] = String(monthIso).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, 1)
  return dt.toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'te-IN',
    { month: 'long', year: 'numeric' })
}
export function daysInMonth(monthIso) {
  const [y, m] = String(monthIso).split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Every day of a month, with the weekday index (0 = Sunday). */
export function monthDays(monthIso) {
  const total = daysInMonth(monthIso)
  const out = []
  for (let i = 1; i <= total; i++) {
    const dt = new Date(Number(String(monthIso).slice(0, 4)), Number(String(monthIso).slice(5, 7)) - 1, i)
    out.push({ day: dayKey(dt), date: dt, index: i, weekday: dt.getDay() })
  }
  return out
}

/**
 * Build the monthly review.
 * @param {object} data
 *   timeLogs   : [{minutes, at, subject}]         (time-tracking log)
 *   trees      : [{day, status, minutes, escapes}] (forest)
 *   shieldLog  : [{type, at, day, minutes}]       (shield log)
 *   sessions   : [{startedAt, endedAt, escapes, minutes}]  (shield sessions)
 *   todos      : [{done, doneDay}]                (to-do list)
 *   journal    : [{day, mood, text?, win?, tags?}] (mood only unless allowed)
 *   plan       : [{day, done, minutes, subjectName}]
 *   deadlines  : [{due, done, title}]             (to-do titles stay out of the report)
 * @param {object} opts {month, lang, allowJournalText}
 */
export function buildMonthReview(data = {}, opts = {}) {
  const {
    month = monthKey(new Date()), lang = 'en', allowJournalText = false,
    now = new Date(),
  } = opts
  const days = monthDays(month)
  const inMonth = (key) => String(key || '').startsWith(month)
  const dayOf = (ts) => dayKey(ts)

  // ---- per-day series ----
  const minutesByDay = {}
  ;(data.timeLogs || []).forEach((l) => {
    const key = l.day || dayOf(l.at)
    if (!inMonth(key)) return
    minutesByDay[key] = (minutesByDay[key] || 0) + (l.minutes || 0)
  })

  const treesByDay = {}
  ;(data.trees || []).forEach((t) => {
    if (!inMonth(t.day)) return
    treesByDay[t.day] = treesByDay[t.day] || { grown: 0, lost: 0 }
    if (t.status === 'grown') treesByDay[t.day].grown += 1
    if (t.status === 'withered') treesByDay[t.day].lost += 1
  })

  const cleanByDay = {}
  ;(data.sessions || []).forEach((s) => {
    const key = dayOf(s.startedAt)
    if (!inMonth(key)) return
    cleanByDay[key] = cleanByDay[key] || { sessions: 0, clean: 0, escapes: 0 }
    cleanByDay[key].sessions += 1
    cleanByDay[key].escapes += s.escapes || 0
    if (!s.escapes) cleanByDay[key].clean += 1
  })

  const tasksByDay = {}
  ;(data.todos || []).forEach((t) => {
    if (!t.done || !inMonth(t.doneDay)) return
    tasksByDay[t.doneDay] = (tasksByDay[t.doneDay] || 0) + 1
  })

  const moodByDay = {}
  ;(data.journal || []).forEach((e) => {
    if (!inMonth(e.day) || !e.mood) return
    moodByDay[e.day] = e.mood
  })

  const series = days.map((d) => ({
    ...d,
    minutes: minutesByDay[d.day] || 0,
    trees: (treesByDay[d.day]?.grown || 0) - (treesByDay[d.day]?.lost || 0),
    treesGrown: treesByDay[d.day]?.grown || 0,
    treesLost: treesByDay[d.day]?.lost || 0,
    sessions: cleanByDay[d.day]?.sessions || 0,
    clean: cleanByDay[d.day]?.clean || 0,
    escapes: cleanByDay[d.day]?.escapes || 0,
    tasks: tasksByDay[d.day] || 0,
    mood: moodByDay[d.day] ?? null,
  }))

  // ---- totals ----
  const totalMinutes = series.reduce((a, d) => a + d.minutes, 0)
  const activeDays = series.filter((d) => d.minutes > 0).length
  const treesGrown = series.reduce((a, d) => a + d.treesGrown, 0)
  const treesLost = series.reduce((a, d) => a + d.treesLost, 0)
  const sessions = series.reduce((a, d) => a + d.sessions, 0)
  const cleanSessions = series.reduce((a, d) => a + d.clean, 0)
  const escapes = series.reduce((a, d) => a + d.escapes, 0)
  const tasksDone = series.reduce((a, d) => a + d.tasks, 0)
  const moods = series.map((d) => d.mood).filter((m) => m != null)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0

  const best = series.reduce((a, d) => (d.minutes > (a?.minutes ?? -1) ? d : a), null)
  const weekdayTotals = new Array(7).fill(0)
  series.forEach((d) => { weekdayTotals[d.weekday] += d.minutes })
  const weekdayAvg = weekdayTotals.map((m, i) => ({
    weekday: i,
    minutes: Math.round(m / Math.max(1, series.filter((d) => d.weekday === i).length)),
  }))
  const strongest = [...weekdayAvg].sort((a, b) => b.minutes - a.minutes)[0]
  const weakest = [...weekdayAvg].sort((a, b) => a.minutes - b.minutes)[0]

  // ---- previous month, for an honest comparison ----
  const prevDays = monthDays(prevMonth(month))
  const prevMinutes = (data.timeLogs || []).filter((l) => inMonthOf(prevMonth(month), l.day || dayOf(l.at)))
    .reduce((a, l) => a + (l.minutes || 0), 0)
  const deltaPct = prevMinutes ? Math.round(((totalMinutes - prevMinutes) / prevMinutes) * 100) : null

  // ---- streaks inside the month ----
  let bestStreak = 0
  let run = 0
  series.forEach((d) => {
    if (d.minutes > 0) { run += 1; bestStreak = Math.max(bestStreak, run) } else run = 0
  })

  // ---- subjects ----
  const subjectTotals = {}
  ;(data.timeLogs || []).forEach((l) => {
    const key = l.day || dayOf(l.at)
    if (!inMonth(key)) return
    const name = l.subject || 'Study'
    subjectTotals[name] = (subjectTotals[name] || 0) + (l.minutes || 0)
  })
  const subjects = Object.entries(subjectTotals)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6)

  // ---- tasks that were due (counts only; titles stay private) ----
  const dueInMonth = (data.deadlines || []).filter((t) => inMonth(t.due))
  const dueDone = dueInMonth.filter((t) => t.done).length

  // ---- journal highlights: wins and tags only, never the body ----
  const journals = (data.journal || []).filter((e) => inMonth(e.day))
  const wins = journals.map((e) => e.win).filter(Boolean).slice(0, 5)
  const tagCount = {}
  journals.forEach((e) => (e.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1 }))
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, n]) => ({ tag, n }))
  const sharedEntries = allowJournalText
    ? journals.filter((e) => e.text).slice(-4).map((e) => ({ day: e.day, mood: e.mood, text: String(e.text).slice(0, 300) }))
    : []

  return {
    month,
    label: monthLabel(month, lang),
    lang,
    series,
    totals: {
      minutes: totalMinutes,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      activeDays,
      daysInMonth: series.length,
      avgMinutesActiveDay: activeDays ? Math.round(totalMinutes / activeDays) : 0,
      treesGrown,
      treesLost,
      sessions,
      cleanSessions,
      cleanRate: sessions ? Math.round((cleanSessions / sessions) * 100) : 0,
      escapes,
      tasksDone,
      tasksDue: dueInMonth.length,
      tasksDueDone: dueDone,
      avgMood,
      moodDays: moods.length,
      bestStreak,
      journalDays: journals.length,
    },
    best: best && best.minutes > 0 ? { day: best.day, minutes: best.minutes } : null,
    weekdayAvg,
    strongestWeekday: strongest || null,
    weakestWeekday: weakest || null,
    subjects,
    wins,
    topTags,
    sharedEntries,
    previous: { month: prevMonth(month), minutes: prevMinutes, deltaPct },
    generatedAt: now.getTime(),
  }
}

export function prevMonth(monthIso) {
  const [y, m] = String(monthIso).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, 1)
  dt.setMonth(dt.getMonth() - 1)
  return monthKey(dt)
}

export function nextMonth(monthIso) {
  const [y, m] = String(monthIso).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, 1)
  dt.setMonth(dt.getMonth() + 1)
  return monthKey(dt)
}

function inMonthOf(month, key) {
  return String(key || '').startsWith(month)
}

export const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  te: ['ఆది', 'సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని'],
}

/** Coordinates for the inline SVG bar chart (pure → testable). */
export function barGeometry(series = [], { width = 640, height = 120, gap = 2 } = {}) {
  const days = series.length || 1
  const barWidth = Math.max(1, (width - gap * (days - 1)) / days)
  const max = Math.max(30, ...series.map((d) => d.minutes))
  return series.map((d, i) => ({
    ...d,
    x: Math.round(i * (barWidth + gap) * 100) / 100,
    w: Math.round(barWidth * 100) / 100,
    h: Math.round((d.minutes / max) * height * 100) / 100,
    max,
  }))
}

/** Polylines for the mood line (null days are skipped, segments preserved). */
export function moodPath(series = [], { width = 640, height = 60, moodScale = 5 } = {}) {
  const days = series.length || 1
  const step = width / Math.max(1, days - 1)
  const segments = []
  let current = []
  series.forEach((d, i) => {
    if (d.mood == null) {
      if (current.length) { segments.push(current); current = [] }
      return
    }
    current.push({
      x: Math.round(i * step * 100) / 100,
      y: Math.round((1 - (d.mood - 1) / (moodScale - 1)) * height * 100) / 100,
      mood: d.mood, day: d.day,
    })
  })
  if (current.length) segments.push(current)
  return segments
}

/** Plain-text version of the review (for email/WhatsApp, and for tests). */
export function monthReviewText(review, lang = 'en') {
  const t = review?.totals || {}
  const L = {
    en: {
      title: `Month in review — ${review.label}`,
      focus: 'Focus time',
      active: 'Days studied',
      trees: 'Trees',
      clean: 'Distraction-free sessions',
      tasks: 'Tasks completed',
      mood: 'Average mood',
      best: 'Best day',
      streak: 'Best streak',
      subjects: 'Subjects',
      compare: 'vs last month',
      notes: 'Notes',
      none: 'No study logged this month.',
    },
    hi: {
      title: `महीने की समीक्षा — ${review.label}`,
      focus: 'फोकस समय',
      active: 'पढ़ाई के दिन',
      trees: 'पेड़',
      clean: 'बिना-भटकाव सत्र',
      tasks: 'पूरे किए काम',
      mood: 'औसत मूड',
      best: 'सबसे अच्छा दिन',
      streak: 'सबसे लंबी स्ट्रीक',
      subjects: 'विषय',
      compare: 'पिछले महीने से',
      notes: 'नोट्स',
      none: 'इस महीने कोई पढ़ाई दर्ज नहीं।',
    },
    te: {
      title: `నెల సమీక్ష — ${review.label}`,
      focus: 'ఫోకస్ సమయం',
      active: 'చదివిన రోజులు',
      trees: 'చెట్లు',
      clean: 'డిస్ట్రాక్షన్ లేని సెషన్లు',
      tasks: 'పూర్తయిన పనులు',
      mood: 'సగటు మూడ్',
      best: 'ఉత్తమ రోజు',
      streak: 'అతి పొడవు స్ట్రీక్',
      subjects: 'సబ్జెక్ట్‌లు',
      compare: 'గత నెలతో పోలిస్తే',
      notes: 'నోట్స్',
      none: 'ఈ నెలలో చదువు నమోదు కాలేదు.',
    },
  }[lang] || {}

  const lines = [L.title, '']
  if (!t.minutes) {
    lines.push(L.none)
    return lines.join('\n')
  }
  lines.push(`${L.focus}: ${t.hours}h (${t.activeDays}/${t.daysInMonth} days)`)
  lines.push(`${L.trees}: ${t.treesGrown} 🌳 / ${t.treesLost} 🥀`)
  lines.push(`${L.clean}: ${t.cleanRate}%`)
  lines.push(`${L.tasks}: ${t.tasksDone}`)
  if (t.moodDays) lines.push(`${L.mood}: ${t.avgMood}/5 (${t.moodDays} days recorded)`)
  if (review.best) lines.push(`${L.best}: ${review.best.day} · ${review.best.minutes} min`)
  lines.push(`${L.streak}: ${t.bestStreak} days`)
  if (review.subjects.length) {
    lines.push(`${L.subjects}: ${review.subjects.map((s) => `${s.subject} ${s.minutes}m`).join(' · ')}`)
  }
  if (review.previous.deltaPct != null) {
    lines.push(`${L.compare}: ${review.previous.deltaPct >= 0 ? '+' : ''}${review.previous.deltaPct}%`)
  }
  if (review.wins.length) {
    lines.push('', `${L.notes}:`)
    review.wins.forEach((w) => lines.push(`• ${w}`))
  }
  return lines.join('\n')
}
