// ============================================================
//  To-do list logic — pure helpers (testable, no browser).
// ============================================================

export const PRIORITIES = [
  { id: 'high', emoji: '🔴', weight: 3, label: { en: 'High', hi: 'ज़रूरी', te: 'అత్యవసరం' } },
  { id: 'med', emoji: '🟡', weight: 2, label: { en: 'Medium', hi: 'मध्यम', te: 'మధ్యస్థం' } },
  { id: 'low', emoji: '🟢', weight: 1, label: { en: 'Low', hi: 'कम', te: 'తక్కువ' } },
]

export const DEFAULT_CATEGORIES = [
  { id: 'study', emoji: '📘', label: { en: 'Study', hi: 'पढ़ाई', te: 'చదువు' } },
  { id: 'homework', emoji: '✏️', label: { en: 'Homework', hi: 'होमवर्क', te: 'హోంవర్క్' } },
  { id: 'revision', emoji: '🔁', label: { en: 'Revision', hi: 'रिवीज़न', te: 'రివిజన్' } },
  { id: 'project', emoji: '🛠️', label: { en: 'Project', hi: 'प्रोजेक्ट', te: 'ప్రాజెక్ట్' } },
  { id: 'test', emoji: '📝', label: { en: 'Test prep', hi: 'टेस्ट तैयारी', te: 'పరీక్ష సన్నద్ధత' } },
  { id: 'other', emoji: '📌', label: { en: 'Other', hi: 'अन्य', te: 'ఇతర' } },
]

export const REPEATS = [
  { id: 'none', label: { en: 'No repeat', hi: 'दोहराव नहीं', te: 'పునరావృతం వద్దు' } },
  { id: 'daily', label: { en: 'Every day', hi: 'हर दिन', te: 'ప్రతిరోజూ' } },
  { id: 'weekdays', label: { en: 'Weekdays', hi: 'सोम–शुक्र', te: 'సోమ–శుక్ర' } },
  { id: 'weekly', label: { en: 'Every week', hi: 'हर हफ़्ते', te: 'ప్రతి వారం' } },
]

export const XP_PER_TASK = 12
export const XP_SUBTASK = 4

// ---------------- date helpers ----------------
export function dayKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function parseDayKey(key) {
  if (!key) return null
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(date, n) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function daysBetween(a, b) {
  const A = parseDayKey(a) || new Date(a)
  const B = parseDayKey(b) || new Date(b)
  return Math.round((B.setHours(0, 0, 0, 0) - new Date(A).setHours(0, 0, 0, 0)) / 86400000)
}

/** When does a repeating task come back? */
export function nextRepeatDay(repeat, fromKey = dayKey()) {
  const from = parseDayKey(fromKey) || new Date()
  switch (repeat) {
    case 'daily': return dayKey(addDays(from, 1))
    case 'weekdays': {
      let d = addDays(from, 1)
      while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1)
      return dayKey(d)
    }
    case 'weekly': return dayKey(addDays(from, 7))
    default: return null
  }
}

export function dueLabel(todo, lang = 'en', now = new Date()) {
  if (!todo?.due) return { en: 'No date', hi: 'तारीख़ नहीं', te: 'తేదీ లేదు' }[lang]
  const diff = daysBetween(dayKey(now), todo.due)
  const time = todo.dueTime ? ` · ${todo.dueTime}` : ''
  if (diff === 0) return ({ en: 'Today', hi: 'आज', te: 'ఈరోజు' }[lang]) + time
  if (diff === 1) return ({ en: 'Tomorrow', hi: 'कल', te: 'రేపు' }[lang]) + time
  if (diff === -1) return ({ en: 'Yesterday', hi: 'कल (बीता)', te: 'నిన్న' }[lang]) + time
  if (diff < -1) return ({ en: `${Math.abs(diff)} days late`, hi: `${Math.abs(diff)} दिन देर`, te: `${Math.abs(diff)} రోజులు ఆలస్యం` }[lang]) + time
  return `${parseDayKey(todo.due).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}${time}`
}

export function isOverdue(todo, now = new Date()) {
  if (!todo?.due || todo.done) return false
  return daysBetween(dayKey(now), todo.due) < 0
}

export function isToday(todo, now = new Date()) {
  return !todo.done && todo.due === dayKey(now)
}

export function isDueSoon(todo, now = new Date(), hours = 24) {
  if (!todo?.due || todo.done) return false
  const d = parseDayKey(todo.due)
  const minutes = todo.dueTime ? Number(todo.dueTime.split(':')[0]) * 60 + Number(todo.dueTime.split(':')[1]) : 9 * 60
  d.setMinutes(minutes)
  const diff = d.getTime() - now.getTime()
  return diff > -60000 && diff <= hours * 3600000
}

// ---------------- grouping / filtering ----------------
export function groupTodos(items = [], now = new Date()) {
  const open = items.filter((t) => !t.done)
  const groups = { overdue: [], today: [], tomorrow: [], upcoming: [], someday: [], completed: [] }
  for (const t of open) {
    if (!t.due) { groups.someday.push(t); continue }
    const diff = daysBetween(dayKey(now), t.due)
    if (diff < 0) groups.overdue.push(t)
    else if (diff === 0) groups.today.push(t)
    else if (diff === 1) groups.tomorrow.push(t)
    else groups.upcoming.push(t)
  }
  groups.completed = items.filter((t) => t.done)
  Object.values(groups).forEach((g) => g.sort(todoComparator('smart')))
  return groups
}

export function todoComparator(sortBy = 'smart') {
  return (a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (sortBy === 'priority') {
      const w = (t) => PRIORITIES.find((p) => p.id === t.priority)?.weight || 0
      if (w(a) !== w(b)) return w(b) - w(a)
      return (a.createdAt || 0) - (b.createdAt || 0)
    }
    if (sortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0)
    // 'due' and 'smart': overdue first, then soonest date, priority as tiebreak
    const da = a.due ? a.due + (a.dueTime || '23:59') : '9999'
    const db = b.due ? b.due + (b.dueTime || '23:59') : '9999'
    if (da !== db) return da < db ? -1 : 1
    const w = (t) => PRIORITIES.find((p) => p.id === t.priority)?.weight || 0
    if (w(a) !== w(b)) return w(b) - w(a)
    return (a.createdAt || 0) - (b.createdAt || 0)
  }
}

export function filterTodos(items = [], { category = 'all', query = '', showCompleted = true, priority = 'all' } = {}) {
  const q = query.trim().toLowerCase()
  return items.filter((t) => {
    if (!showCompleted && t.done) return false
    if (category !== 'all' && t.category !== category) return false
    if (priority !== 'all' && t.priority !== priority) return false
    if (q && !(`${t.title} ${t.notes || ''} ${t.subject || ''}`.toLowerCase().includes(q))) return false
    return true
  })
}

// ---------------- progress ----------------
export function todoProgress(items = [], now = new Date()) {
  const todays = items.filter((t) => t.due === dayKey(now) || (t.done && t.doneDay === dayKey(now)))
  const done = todays.filter((t) => t.done).length
  const total = todays.length
  return {
    done, total, pct: total ? Math.round((done / total) * 100) : 0,
    overdue: items.filter((t) => isOverdue(t, now)).length,
    open: items.filter((t) => !t.done).length,
  }
}

/** 0..n-day streak of days where at least one task was completed. */
export function completionStreak(items = [], now = new Date()) {
  const days = new Set(items.filter((t) => t.done && t.doneDay).map((t) => t.doneDay))
  let streak = 0
  let cursor = new Date(now)
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)   // today not done yet → count back from yesterday
  while (days.has(dayKey(cursor))) { streak++; cursor = addDays(cursor, -1) }
  return streak
}

export function xpForTodo(todo) {
  const subs = (todo.subtasks || []).length
  return XP_PER_TASK + subs * XP_SUBTASK + (todo.priority === 'high' ? 8 : 0)
}

/** Fuzzy match used by the chat command "mark physics homework done". */
export function findByTitle(items = [], text = '') {
  const q = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!q) return null
  const open = items.filter((t) => !t.done)
  const scored = open.map((t) => {
    const title = `${t.title} ${t.subject || ''}`.toLowerCase()
    let score = 0
    if (title.includes(q)) score += 10
    const words = q.split(' ').filter((w) => w.length > 2)
    score += words.filter((w) => title.includes(w)).length * 3
    if (open.length && t.priority === 'high') score += 0.5
    return { t, score }
  }).sort((a, b) => b.score - a.score)
  return scored[0]?.score >= 3 ? scored[0].t : null
}

/** Build a complete to-do from partial input (UI + chat share this). */
export function buildTodo(input = {}) {
  const now = new Date()
  return {
    id: input.id || `td_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title: String(input.title || '').trim() || 'Study task',
    notes: input.notes || '',
    subject: input.subject || '',
    category: input.category || 'study',
    priority: PRIORITIES.some((p) => p.id === input.priority) ? input.priority : 'med',
    due: input.due || null,                     // 'YYYY-MM-DD'
    dueTime: input.dueTime || null,             // 'HH:MM'
    repeat: input.repeat || 'none',
    minutes: Number(input.minutes) || null,      // optional estimate
    done: false,
    doneAt: null,
    doneDay: null,
    createdAt: input.createdAt || now.getTime(),
    subtasks: Array.isArray(input.subtasks) ? input.subtasks : [],
    reminderAlarmId: input.reminderAlarmId || null,
    sessionId: input.sessionId || null,
    source: input.source || 'ui',                // 'ui' | 'chat'
    order: input.order || 0,
  }
}

// ============================================================
//  Creation paths — "made by Bodhya" and "made by you"
//
//  1. suggestTasks(context)  → tasks Bodhya proposes from what is
//     actually happening (exam countdown, today's plan, overdue work,
//     a weak day, a streak worth protecting). Each one says *why*.
//  2. TASK_PACKS            → ready-made task packs the user can apply
//     in one tap (exam week, daily basics, revision cycle…).
//  3. parseQuickTask(text)  → type "physics 30 min tomorrow 6pm" in the
//     quick-add box and the details are filled in for you.
// ============================================================

/**
 * Bodhya's suggestions.
 * @param {object} ctx  real state (see todoStore.suggestionsFor)
 * @returns {Array<{id,key,vars,whyKey,whyVars,minutes,priority,category,
 *                  dueOffsetDays,dueTime,subject,action}>} — text is resolved
 *                  through i18n keys so all three languages work.
 */
export function suggestTasks(ctx = {}, lang = 'en') {
  const {
    examDays = null, examName = '', planToday = [], planSubjects = [],
    overdue = 0, open = 0, minutesToday = 0, goalMinutes = 120,
    streak = 0, weakSubject = '', todayDone = 0, journalWritten = true,
    escapesToday = 0, lastPlanSubject = '',
  } = ctx
  const out = []
  const push = (s) => {
    if (!out.some((x) => x.key === s.key && x.vars?.subject === s.vars?.subject)) out.push(s)
  }

  // 1) exam pressure → revision task
  if (examDays != null && examDays >= 0 && examDays <= 14) {
    const subject = planSubjects[0] || lastPlanSubject || weakSubject || ''
    push({
      id: `sg-exam-${subject || 'any'}`,
      key: subject ? 'todo.sg.examSubject' : 'todo.sg.examGeneral',
      vars: { subject, days: examDays },
      whyKey: 'todo.sg.whyExam', whyVars: { days: examDays, exam: examName },
      minutes: examDays <= 3 ? 45 : 30, priority: 'high', category: 'revision',
      subject, dueOffsetDays: 0, dueTime: null, action: 'exam',
    })
  }

  // 2) something on today's plan is not ticked → mirror it as a task
  const pending = (planToday || []).filter((s) => !s.done)
  if (pending.length) {
    const s = pending[0]
    push({
      id: `sg-plan-${s.id || s.subjectName}`,
      key: 'todo.sg.planSession',
      vars: { subject: s.subjectName, time: s.startTime || '' },
      whyKey: 'todo.sg.whyPlan', whyVars: { n: pending.length },
      minutes: s.minutes || 30, priority: 'high', category: 'study',
      subject: s.subjectName, dueOffsetDays: 0, dueTime: null, action: 'plan',
      sessionId: s.id || null,
    })
  }

  // 3) overdue work → one catch-up task (not a guilt list)
  if (overdue > 0) {
    push({
      id: 'sg-overdue',
      key: 'todo.sg.catchUp', vars: { n: overdue },
      whyKey: 'todo.sg.whyOverdue', whyVars: { n: overdue },
      minutes: 20, priority: 'high', category: 'study',
      subject: '', dueOffsetDays: 0, dueTime: null, action: 'overdue',
    })
  }

  // 4) below the daily goal → one more short block
  if (goalMinutes && minutesToday < goalMinutes * 0.6 && open < 6) {
    push({
      id: 'sg-goal',
      key: 'todo.sg.oneMoreBlock', vars: {},
      whyKey: 'todo.sg.whyGoal', whyVars: { min: Math.round(minutesToday), goal: Math.round(goalMinutes) },
      minutes: 25, priority: 'med', category: 'study',
      subject: weakSubject || '', dueOffsetDays: 0, dueTime: null, action: 'goal',
    })
  }

  // 5) protect the streak — one small daily task, tomorrow if today is done
  if (streak >= 3) {
    push({
      id: 'sg-streak',
      key: 'todo.sg.dailyHabit', vars: { n: streak },
      whyKey: 'todo.sg.whyStreak', whyVars: { n: streak },
      minutes: 15, priority: 'med', category: 'revision',
      subject: weakSubject || '', dueOffsetDays: todayDone >= 1 ? 1 : 0, dueTime: null, action: 'streak',
    })
  }

  // 6) a subject that keeps slipping
  if (weakSubject && !out.some((s) => s.subjectKey === weakSubject)) {
    push({
      id: `sg-weak-${weakSubject}`,
      key: 'todo.sg.weakSubject', vars: { subject: weakSubject },
      whyKey: 'todo.sg.whyWeak', whyVars: { subject: weakSubject },
      minutes: 30, priority: 'med', category: 'practice',
      subject: weakSubject, dueOffsetDays: 0, dueTime: null, action: 'weak', subjectKey: weakSubject,
    })
  }

  // 7) many escapes today → a tiny "phone away" task
  if (escapesToday >= 2) {
    push({
      id: 'sg-phone',
      key: 'todo.sg.phoneAway', vars: {},
      whyKey: 'todo.sg.whyEscapes', whyVars: { n: escapesToday },
      minutes: 25, priority: 'med', category: 'study',
      subject: '', dueOffsetDays: 0, dueTime: null, action: 'focus',
    })
  }

  // 8) nothing written in the journal → one-line entry tonight
  if (!journalWritten) {
    push({
      id: 'sg-journal',
      key: 'todo.sg.journalLine', vars: {},
      whyKey: 'todo.sg.whyJournal', whyVars: {},
      minutes: 5, priority: 'low', category: 'other',
      subject: '', dueOffsetDays: 0, dueTime: '21:30', action: 'journal',
    })
  }

  void lang
  return out.slice(0, 6)
}

/** Ready-made packs — "created by Bodhya", applied by the user in one tap. */
export const TASK_PACKS = [
  {
    id: 'examWeek', emoji: '🚨',
    labelKey: 'todo.pack.examWeek', descKey: 'todo.pack.examWeekDesc',
    tasks: [
      { titleKey: 'todo.pack.task.reviseWeak', minutes: 45, offset: 0, priority: 'high', category: 'revision' },
      { titleKey: 'todo.pack.task.pastPapers', minutes: 60, offset: 1, priority: 'high', category: 'test' },
      { titleKey: 'todo.pack.task.formulaSheet', minutes: 20, offset: 0, priority: 'med', category: 'revision' },
      { titleKey: 'todo.pack.task.sleepEarly', minutes: 5, offset: 0, priority: 'med', category: 'other', dueTime: '22:00' },
      { titleKey: 'todo.pack.task.mockTest', minutes: 45, offset: 2, priority: 'high', category: 'test' },
    ],
  },
  {
    id: 'daily', emoji: '🌤️',
    labelKey: 'todo.pack.daily', descKey: 'todo.pack.dailyDesc',
    repeatable: true,
    tasks: [
      { titleKey: 'todo.pack.task.reviewToday', minutes: 15, offset: 0, priority: 'med', category: 'revision', repeat: 'daily' },
      { titleKey: 'todo.pack.task.practiceProblems', minutes: 30, offset: 0, priority: 'med', category: 'practice', repeat: 'daily' },
      { titleKey: 'todo.pack.task.planTomorrow', minutes: 5, offset: 0, priority: 'low', category: 'other', repeat: 'daily', dueTime: '21:00' },
    ],
  },
  {
    id: 'revisionCycle', emoji: '🔁',
    labelKey: 'todo.pack.revision', descKey: 'todo.pack.revisionDesc',
    tasks: [
      { titleKey: 'todo.pack.task.recallDay1', minutes: 20, offset: 1, priority: 'med', category: 'revision' },
      { titleKey: 'todo.pack.task.recallDay3', minutes: 20, offset: 3, priority: 'med', category: 'revision' },
      { titleKey: 'todo.pack.task.recallDay7', minutes: 25, offset: 7, priority: 'med', category: 'revision' },
    ],
  },
  {
    id: 'chapter', emoji: '📖',
    labelKey: 'todo.pack.chapter', descKey: 'todo.pack.chapterDesc',
    tasks: [
      { titleKey: 'todo.pack.task.readOnce', minutes: 30, offset: 0, priority: 'med', category: 'study' },
      { titleKey: 'todo.pack.task.makeNotes', minutes: 20, offset: 0, priority: 'med', category: 'study' },
      { titleKey: 'todo.pack.task.solveExamples', minutes: 30, offset: 1, priority: 'med', category: 'practice' },
      { titleKey: 'todo.pack.task.teachBack', minutes: 10, offset: 1, priority: 'low', category: 'revision' },
    ],
  },
  {
    id: 'weekend', emoji: '🚀',
    labelKey: 'todo.pack.weekend', descKey: 'todo.pack.weekendDesc',
    tasks: [
      { titleKey: 'todo.pack.task.clearBacklog', minutes: 45, offset: 0, priority: 'high', category: 'study' },
      { titleKey: 'todo.pack.task.deepWork', minutes: 90, offset: 0, priority: 'med', category: 'study' },
      { titleKey: 'todo.pack.task.tidyNotes', minutes: 20, offset: 1, priority: 'low', category: 'other' },
    ],
  },
]

export function packById(id) {
  return TASK_PACKS.find((p) => p.id === id) || null
}

/** Expand a pack into concrete tasks for the given day. */
export function packTasks(packId, now = new Date()) {
  const pack = packById(packId)
  if (!pack) return []
  return pack.tasks.map((t, i) => ({
    id: `pk_${packId}_${i}`,
    key: t.titleKey,
    vars: {},
    minutes: t.minutes,
    priority: t.priority,
    category: t.category,
    dueOffsetDays: t.offset || 0,
    dueTime: t.dueTime || null,
    repeat: t.repeat || 'none',
    subject: '',
    source: 'pack',
    packId,
  }))
}

// ----------------------------------------------------------------
//  Quick add: "physics 30 min tomorrow 6pm" → a filled-in task
// ----------------------------------------------------------------
const DAY_WORDS = {
  tomorrow: 1, 'कल': 1, రేపు: 1,
  today: 0, 'आज': 0, ఈరోజు: 0,
  'day after tomorrow': 2, 'परसों': 2, ఎల్లుండి: 2,
}

const TITLE_NOISE = [
  /\b(add|create|new|task|todo|to[- ]?do|please|for|at|on|by|in|the|a|an)\b/gi,
  /(जोड़ो|जोड़ें|टास्क|काम|को|के|लिए|पर)/g,
  /(జోడించు|టాస్క్|పని|కి|కోసం|న)/g,
]

/**
 * Parse a sentence typed into the quick-add box.
 * Everything is optional — a plain title comes back unchanged.
 * @returns {{title, minutes, due, dueTime, priority, subject, matched:boolean}}
 */
export function parseQuickTask(text, now = new Date()) {
  const raw = String(text || '').trim()
  const lower = raw.toLowerCase()
  const matched = {}
  let rest = raw

  // duration: "30 min", "1.5 hours", "30 मिनट", "30 నిమిషాలు"
  const durH = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|घंटे|घंटा|గంటలు|గంట)\b/i.exec(raw)
  const durM = /(\d+)\s*(minutes?|mins?|min\b|मिनट|నిమిషాలు|నిమిషం)/i.exec(raw)
  let minutes = null
  if (durH) { minutes = Math.round(Number(durH[1]) * 60); rest = rest.replace(durH[0], ' '); matched.duration = true }
  else if (durM) { minutes = Number(durM[1]); rest = rest.replace(durM[0], ' '); matched.duration = true }

  // time: "at 6pm", "6:30 pm", "18:00", "सुबह 7 बजे", "ఉదయం 7 గంటలకు"
  let dueTime = null
  const t12 = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(raw)
  const t24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(raw)
  const tBaje = /(\d{1,2})(?::(\d{2}))?\s*(बजे|గంటలకు|గంటకు)/.exec(raw)
  const morning = /(सुबह|ఉదయం)/.test(raw)
  const evening = /(शाम|సాయంత్రం|रात|రాత్రి)/.test(raw)
  if (t12) {
    let h = Number(t12[1]) % 12
    if (/p/i.test(t12[3])) h += 12
    dueTime = `${String(h).padStart(2, '0')}:${t12[2] || '00'}`
    rest = rest.replace(t12[0], ' ')
  } else if (t24) {
    dueTime = `${String(Number(t24[1])).padStart(2, '0')}:${t24[2]}`
    rest = rest.replace(t24[0], ' ')
  } else if (tBaje) {
    let h = Number(tBaje[1])
    if (evening && h < 12) h += 12
    else if (morning && h === 12) h = 0
    dueTime = `${String(h).padStart(2, '0')}:${tBaje[2] || '00'}`
    rest = rest.replace(tBaje[0], ' ')
  }
  if (dueTime) matched.time = true

  // day: today / tomorrow / day after
  let offset = null
  Object.entries(DAY_WORDS).forEach(([word, off]) => {
    const re = new RegExp(word, 'i')
    if (re.test(raw) && offset == null) {
      offset = off
      rest = rest.replace(re, ' ')
    }
  })
  // weekday names → next occurrence
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const wd = weekdays.findIndex((d) => new RegExp(`\\b${d}\\b`, 'i').test(raw))
  if (wd >= 0 && offset == null) {
    const diff = ((wd - now.getDay()) + 7) % 7 || 7
    offset = diff
    rest = rest.replace(new RegExp(`\\b${weekdays[wd]}\\b`, 'i'), ' ')
  }
  if (offset != null) matched.day = true

  // priority
  let priority = null
  if (/\b(urgent|important|asap|now)\b|ज़रूरी|త్వరగా/i.test(rest)) {
    priority = 'high'
    matched.priority = true
    rest = rest.replace(/\b(urgent|important|asap|now)\b|ज़रूरी|త్వరగా/gi, ' ')
  } else if (/\b(later|someday|whenever|low priority)\b|बाद में|తర్వాత/i.test(rest)) {
    priority = 'low'
    matched.priority = true
    rest = rest.replace(/\b(later|someday|whenever|low priority)\b|बाद में|తర్వాత/gi, ' ')
  }

  const due = offset == null ? null : dayKey(addDays(now, offset))
  const matchedSomething = Object.keys(matched).length > 0

  // Only tidy the wording when we actually extracted something — otherwise a
  // plain title like "just a plain task" must come back untouched.
  let title = raw
  if (matchedSomething) {
    TITLE_NOISE.forEach((re) => { rest = rest.replace(re, ' ') })
    title = rest.replace(/\s+/g, ' ').replace(/^[\s,;:-]+|[\s,;:-]+$/g, '').trim() || raw
  }

  return {
    title,
    minutes,
    due,
    dueTime,
    priority,
    subject: '',
    matched: matchedSomething,
  }
}

// ------------------------------------------------------------------
// Chapter → tasks
//
// Paste a chapter (or your notes, or the syllabus) and Bodhya cuts it into
// tasks. Entirely local heuristics — no model, no network: headings become
// "read + notes", "Definition/Theorem/Law" lines become flashcards, lines with
// formulas become "memorise", "Exercise 4.2 / Q1–Q10" becomes practice, and
// so on. Every task explains itself with a whyKey, like the other suggestions.
// ------------------------------------------------------------------

const CHAPTER_KEYS = {
  readNotes: 'todo.ch.readNotes',
  flashcard: 'todo.ch.flashcard',
  formula: 'todo.ch.formula',
  exercise: 'todo.ch.exercise',
  exerciseShort: 'todo.ch.exerciseShort',
  diagram: 'todo.ch.diagram',
  dates: 'todo.ch.dates',
  summary: 'todo.ch.summary',
}

const WHY_KEYS = {
  heading: 'todo.ch.whyHeading',
  term: 'todo.ch.whyTerm',
  formula: 'todo.ch.whyFormula',
  exercise: 'todo.ch.whyExercise',
  diagram: 'todo.ch.whyDiagram',
  dates: 'todo.ch.whyDates',
  summary: 'todo.ch.whySummary',
}

const EXERCISE_RE = /\b(?:exercise|exercises|ex\.?|problem set|problems|worksheet|assignment|practice questions?)\s*([\d]+(?:\.[\d]+)*)?/i
const RANGE_RE = /\bq(?:uestion)?s?\.?\s*(\d{1,3})\s*(?:[-–—]|to|through)\s*(?:q\.?\s*)?(\d{1,3})/i
const TERM_RE = /^\s*(?:definition|define|theorem|law|principle|rule|lemma|postulate)s?\s*(?:of|:)?\s*(.+)$/i
const TERM_COLON_RE = /^\s*([A-Z][\w’'\- ]{2,44})\s*[:\u2013-]\s+\S/
const FORMULA_RE = /(=|≈|\bformula\b|\bequation\b|\bderivation\b|\bderive\b)/i
const DIAGRAM_RE = /\b(diagram|figure|fig\.|flow ?chart|circuit|graph of|label(?:l?ed)?\s+(?:the\s+)?(?:diagram|figure|parts?))\b/i
const DRAW_RE = /^\s*(?:draw|label|sketch|plot|study the|see)\b/i
const DATES_RE = /\b(1[0-9]{3}|20[0-9]{2})\b/   // a year in the line
const SUMMARY_RE = /\b(summary|revision notes?|key points|recap|in short|conclusion)\b/i
const NOISE_RE = /^(page|p\.|chapter|unit|contents?|index|see also)\b/i

/** Cut at a word boundary so pasted labels never end mid-word. */
function clip(text = '', max = 48) {
  const s = String(text).replace(/\s+/g, ' ').trim().replace(/[.;,:]+$/, '')
  if (s.length <= max) return s
  return s.slice(0, max).replace(/\s+\S*$/, '').trim()
}

/** Best-effort guess of the subject name from the first line. */
export function chapterSubject(text = '') {
  const first = (text.trim().split('\n').find((l) => l.trim().length > 2) || '').trim()
  const m = first.match(/^(?:chapter|unit|topic|lesson)\s*[\d.]*\s*[:\u2013-]?\s*(.+)$/i)
  return (m ? m[1] : '').replace(/[^\p{L}\p{N} &'\-]/gu, '').trim().slice(0, 40)
}

/** Structural scan — what is actually in this text? */
export function scanChapter(text = '') {
  const raw = String(text || '')
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const out = {
    chars: raw.length,
    lines: lines.length,
    subject: chapterSubject(raw),
    headings: [],
    terms: [],
    formulas: [],
    exercises: [],
    diagrams: [],
    dates: [],
    hasSummary: false,
    sentences: [],
  }
  // long single-paragraph pastes: fall back to sentences
  const units = lines.length >= 3 ? lines : raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (lines.length < 3) out.sentences = units.slice(0, 40)

  units.forEach((line) => {
    if (NOISE_RE.test(line)) return
    const clean = line.replace(/^[\s•*\-–—\d.)\]]+/, '').trim()
    if (clean.length < 3) return

    const ex = line.match(EXERCISE_RE)
    if (ex) {
      const range = line.match(RANGE_RE)
      const label = (ex[0] || 'exercise').replace(/\s+/g, ' ').trim()
      if (!out.exercises.some((e) => e.label.toLowerCase() === label.toLowerCase())) {
        out.exercises.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          count: range ? Math.min(60, Math.max(1, Number(range[2]) - Number(range[1]) + 1)) : null,
        })
      }
    }

    const term = line.match(TERM_RE) || line.match(TERM_COLON_RE)
    if (term && term[1]) {
      const name = clip(term[1], 48)
      if (name.length > 2 && !out.terms.some((t) => t.toLowerCase() === name.toLowerCase())) out.terms.push(name)
    }

    const isFormula = Boolean(FORMULA_RE.test(line) && clean.length < 120)
    if (isFormula) {
      const label = clip(clean.split(/[=≈]/)[0].replace(/\b(the|a|an)\b/gi, ' '), 48)
      if (label.length > 2 && !out.formulas.some((f) => f.toLowerCase() === label.toLowerCase())) out.formulas.push(label)
    }

    if ((DIAGRAM_RE.test(line) || DRAW_RE.test(line)) && !DATES_RE.test(line)) {
      const inner = clean.match(/diagram of (?:the )?(.+)$/i)
      const label = clip(inner ? inner[1] : clean.replace(/^(draw|label|sketch|plot|study the|see)\s+/i, ''), 48)
      if (label.length > 2 && !out.diagrams.some((d) => d.toLowerCase() === label.toLowerCase())) out.diagrams.push(label)
    }

    if (DATES_RE.test(line) && /[A-Z][a-z]{3,}/.test(clean)) {
      const label = clip(clean.replace(/^in\s+\d{3,4}\s+/i, ''), 60)
      if (!out.dates.some((d) => d.toLowerCase() === label.toLowerCase())) out.dates.push(label)
    }

    if (SUMMARY_RE.test(line)) out.hasSummary = true

    // a heading: short, no closing period, not already classified
    const looksHeading = clean.length <= 64 && !/[.!?]$/.test(clean) && !ex && !term && !isFormula && !SUMMARY_RE.test(clean)
      && (line === clean || /^[\d.]+\s/.test(line) || /^[A-Z]/.test(clean))
    if (looksHeading) {
      const name = clip(clean, 56)
      if (name.length >= 4 && !out.headings.some((h) => h.toLowerCase() === name.toLowerCase())) out.headings.push(name)
    }
  })

  // a heading that is really the chapter title is not a study task
  if (out.headings.length > 1 && out.subject && out.headings[0].toLowerCase().includes(out.subject.toLowerCase())) {
    out.headings.shift()
  }
  return out
}

/**
 * Chapter text → task suggestions. Same shape as suggestTasks() items so the
 * UI can render both with one component, plus `title`/`why` resolved by the store.
 */
export function chapterSuggestions(text = '', { subject = '', max = 8 } = {}) {
  const scan = scanChapter(text)
  const subj = (subject || scan.subject || '').trim()
  const out = []
  const push = (item) => { if (out.length < max) out.push(item) }

  scan.exercises.slice(0, 2).forEach((ex) => push({
    id: `ch-ex-${ex.label.toLowerCase().replace(/\W+/g, '-')}`,
    key: ex.count ? CHAPTER_KEYS.exercise : CHAPTER_KEYS.exerciseShort,
    vars: { ex: ex.label, n: ex.count || 0 },
    whyKey: WHY_KEYS.exercise, whyVars: { ex: ex.label },
    minutes: ex.count && ex.count > 8 ? 45 : 30, priority: 'high', category: 'practice',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  scan.terms.slice(0, 3).forEach((term) => push({
    id: `ch-term-${term.toLowerCase().replace(/\W+/g, '-')}`,
    key: CHAPTER_KEYS.flashcard, vars: { term },
    whyKey: WHY_KEYS.term, whyVars: { term },
    minutes: 10, priority: 'med', category: 'revision',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  scan.formulas.slice(0, 2).forEach((topic) => push({
    id: `ch-formula-${topic.toLowerCase().replace(/\W+/g, '-')}`,
    key: CHAPTER_KEYS.formula, vars: { topic },
    whyKey: WHY_KEYS.formula, whyVars: { topic },
    minutes: 15, priority: 'high', category: 'revision',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  scan.headings.slice(0, 3).forEach((topic) => push({
    id: `ch-head-${topic.toLowerCase().replace(/\W+/g, '-')}`,
    key: CHAPTER_KEYS.readNotes, vars: { topic },
    whyKey: WHY_KEYS.heading, whyVars: { topic },
    minutes: 30, priority: 'med', category: 'study',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  scan.diagrams.slice(0, 1).forEach((topic) => push({
    id: `ch-diagram-${topic.toLowerCase().replace(/\W+/g, '-')}`,
    key: CHAPTER_KEYS.diagram, vars: { topic },
    whyKey: WHY_KEYS.diagram, whyVars: { topic },
    minutes: 15, priority: 'med', category: 'practice',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  scan.dates.slice(0, 1).forEach((topic) => push({
    id: `ch-dates-${topic.toLowerCase().replace(/\W+/g, '-')}`,
    key: CHAPTER_KEYS.dates, vars: { topic },
    whyKey: WHY_KEYS.dates, whyVars: { topic },
    minutes: 20, priority: 'med', category: 'revision',
    subject: subj, dueOffsetDays: 0, dueTime: null, action: 'chapter',
  }))
  if (scan.chars > 700 || scan.hasSummary) push({
    id: 'ch-summary',
    key: CHAPTER_KEYS.summary, vars: {},
    whyKey: WHY_KEYS.summary, whyVars: {},
    minutes: 20, priority: 'low', category: 'revision',
    subject: subj, dueOffsetDays: 1, dueTime: null, action: 'chapter',
  })

  return out.slice(0, max)
}
