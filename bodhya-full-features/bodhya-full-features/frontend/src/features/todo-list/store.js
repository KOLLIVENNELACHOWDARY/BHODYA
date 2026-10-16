// ============================================================
//  To-do list store — rich tasks with subtasks, priorities,
//  dates, repeats, reminders, XP and Bodhya integration.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { playTick } from '../chatbot/utils/sound.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp, loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'
import { addAlarm, removeAlarm, updateAlarm } from '../alarms/store.js'
import { timeToMinutes, minutesToTime } from '../alarms/logic.js'
import {
  buildTodo, chapterSuggestions, completionStreak, dayKey, daysBetween, findByTitle, groupTodos,
  nextRepeatDay, parseDayKey, scanChapter, todoComparator, todoProgress, xpForTodo, DEFAULT_CATEGORIES,
  packTasks, packById, parseQuickTask, suggestTasks, TASK_PACKS,
} from './logic.js'
import { PLAN, planStats } from '../study-schedule/store.js'
import { TIME, goalProgress } from '../time-tracking/store.js'
import { SHIELD } from '../focus-shield/store.js'
import { JOURNAL } from '../journal/store.js'
import { journalStats } from '../journal/logic.js'

export const TODOS = makeStore(
  'bodhya_todos_v1',
  {
    items: [],
    categories: DEFAULT_CATEGORIES,
    xpByDay: {},                 // {'2026-09-17': 36}
    settings: {
      showCompleted: true,
      sortBy: 'smart',           // smart | due | priority | created
      defaultCategory: 'study',
      celebrationSound: true,
      autoReminder: false,       // create an alarm 15 min before due time
      autoReminderMinutes: 15,
    },
  },
  { changeEvent: EVT.todoChanged }
)

const change = (detail = {}) => { emit(EVT.todoChanged, detail); return detail }

// the app's UI language (profile), used when the caller does not pass one
const LANGS_UI_DEFAULT = 'en'
function resolveTitle(key, vars = {}) {
  let lang = LANGS_UI_DEFAULT
  try { lang = loadState().profile?.lang || LANGS_UI_DEFAULT } catch { /* default */ }
  return tr(lang, key, vars)
}

// ------------------------------------------------------------------
// CRUD
// ------------------------------------------------------------------
export function addTodo(input = {}) {
  const todo = buildTodo(input)
  const state = TODOS.read()

  // reminder: an alarm linked to this task, N minutes before its due time
  const wantReminder = input.remind !== false
    && (input.reminderAlarmId
      || (state.settings.autoReminder && todo.due && todo.dueTime))
  if (!todo.reminderAlarmId && wantReminder && todo.due && todo.dueTime) {
    const mins = timeToMinutes(todo.dueTime)
    if (mins != null) {
      const before = Number(input.reminderMinutes ?? state.settings.autoReminderMinutes ?? 15)
      const alarm = addAlarm({
        label: `📌 ${todo.title}`.slice(0, 42),
        time: minutesToTime(mins - before),
        days: [],
        sound: 'chime',
        volume: 0.7,
        snoozeMinutes: 5,
        note: 'Reminder for your to-do',
        linked: { feature: 'todo', id: todo.id },
      })
      todo.reminderAlarmId = alarm.id
    }
  }

  TODOS.update((s) => ({ items: [todo, ...s.items] }))
  change({ added: todo.id })
  return todo
}

export function updateTodo(id, patch = {}) {
  let updated = null
  TODOS.update((s) => ({
    items: s.items.map((t) => {
      if (t.id !== id) return t
      updated = { ...t, ...patch }
      return updated
    }),
  }))
  change({ updated: id })
  return updated
}

export function removeTodo(id) {
  const todo = TODOS.read().items.find((t) => t.id === id)
  if (todo?.reminderAlarmId) removeAlarm(todo.reminderAlarmId)
  TODOS.update((s) => ({ items: s.items.filter((t) => t.id !== id) }))
  change({ removed: id })
  return todo
}

export function removeTodos(ids = []) {
  ids.forEach((id) => {
    const todo = TODOS.read().items.find((t) => t.id === id)
    if (todo?.reminderAlarmId) removeAlarm(todo.reminderAlarmId)
  })
  TODOS.update((s) => ({ items: s.items.filter((t) => !ids.includes(t.id)) }))
  change({ removedMany: ids })
}

export function clearCompleted() {
  const gone = TODOS.read().items.filter((t) => t.done)
  gone.forEach((t) => { if (t.reminderAlarmId) removeAlarm(t.reminderAlarmId) })
  const n = gone.length
  TODOS.update((s) => ({ items: s.items.filter((t) => !t.done) }))
  change({ cleared: n })
  return n
}

// ------------------------------------------------------------------
// completion (+ XP, repeats, notifications)
// ------------------------------------------------------------------
export function toggleTodo(id, { source = 'ui' } = {}) {
  const todo = TODOS.read().items.find((t) => t.id === id)
  if (!todo) return null
  return todo.done ? uncompleteTodo(id) : completeTodo(id, { source })
}

export function completeTodo(id, { source = 'ui' } = {}) {
  const todo = TODOS.read().items.find((t) => t.id === id)
  if (!todo || todo.done) return todo
  const today = dayKey()
  const gained = xpForTodo(todo)

  // subtasks all count as done once the parent is done
  const subtasks = (todo.subtasks || []).map((s) => ({ ...s, done: true }))

  TODOS.update((s) => ({
    items: s.items.map((t) => (t.id === id
      ? { ...t, done: true, doneAt: Date.now(), doneDay: today, subtasks }
      : t)),
    xpByDay: { ...s.xpByDay, [today]: (s.xpByDay?.[today] || 0) + gained },
  }))

  // reminder has done its job (or moves to the next occurrence)
  if (todo.reminderAlarmId) {
    if (todo.repeat && todo.repeat !== 'none') {
      const nextDue = nextRepeatDay(todo.repeat, todo.due || today)
      if (todo.dueTime) {
        const mins = timeToMinutes(todo.dueTime)
        const before = TODOS.read().settings.autoReminderMinutes || 15
        updateAlarm(todo.reminderAlarmId, { time: minutesToTime((mins ?? 0) - before), enabled: true, lastFiredKey: null, days: [] })
      }
      void nextDue
    } else {
      removeAlarm(todo.reminderAlarmId)
      updateTodo(id, { reminderAlarmId: null })
    }
  }

  // repeating task → clone it for the next occurrence
  let spawned = null
  if (todo.repeat && todo.repeat !== 'none') {
    const nextDue = nextRepeatDay(todo.repeat, todo.due || today)
    spawned = addTodo({
      ...todo,
      id: undefined,
      due: nextDue,
      done: false,
      doneAt: null,
      doneDay: null,
      subtasks: (todo.subtasks || []).map((s) => ({ ...s, done: false })),
      reminderAlarmId: null,
      createdAt: Date.now(),
      source,
    })
  }

  // rewards + feedback
  const res = addXp(gained)
  if (TODOS.read().settings.celebrationSound) playTick(0.6)
  pushNotification({
    kind: 'task',
    title: `✅ ${todo.title}`,
    body: `Nice! +${gained} XP${spawned ? ` · next one on ${parseDayKey(spawned.due).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}`,
    silent: true,
    groupKey: `todo-done-${id}`,
    action: { feature: 'todo' },
  })
  emit(EVT.todoChanged, { completed: id, xp: gained })
  return { ...todo, xpGained: gained, leveledUp: res.leveledUp, level: res.level, spawned }
}

export function uncompleteTodo(id) {
  TODOS.update((s) => ({
    items: s.items.map((t) => (t.id === id ? { ...t, done: false, doneAt: null, doneDay: null } : t)),
  }))
  change({ uncompleted: id })
  return TODOS.read().items.find((t) => t.id === id)
}

export function toggleSubtask(todoId, subId) {
  const todo = TODOS.read().items.find((t) => t.id === todoId)
  if (!todo) return null
  const subs = (todo.subtasks || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s))
  const allDone = subs.length > 0 && subs.every((s) => s.done)
  const updated = updateTodo(todoId, { subtasks: subs })
  if (allDone && !todo.done) return completeTodo(todoId, { source: 'subtasks' })
  return updated
}

export function addSubtask(todoId, title) {
  const text = String(title || '').trim()
  if (!text) return null
  const todo = TODOS.read().items.find((t) => t.id === todoId)
  if (!todo) return null
  const subs = [...(todo.subtasks || []), { id: uid('st'), title: text, done: false }]
  return updateTodo(todoId, { subtasks: subs })
}

export function removeSubtask(todoId, subId) {
  const todo = TODOS.read().items.find((t) => t.id === todoId)
  if (!todo) return null
  return updateTodo(todoId, { subtasks: (todo.subtasks || []).filter((s) => s.id !== subId) })
}

// ------------------------------------------------------------------
// quick actions used by the UI and by chat
// ------------------------------------------------------------------
export function snoozeTodo(id, days = 1) {
  const todo = TODOS.read().items.find((t) => t.id === id)
  if (!todo) return null
  const base = todo.due ? parseDayKey(todo.due) : new Date()
  base.setDate(base.getDate() + days)
  return updateTodo(id, { due: dayKey(base) })
}

export function setTodoReminder(id, minutesBefore = 15) {
  const todo = TODOS.read().items.find((t) => t.id === id)
  if (!todo?.dueTime || !todo.due) return null
  const mins = timeToMinutes(todo.dueTime)
  if (mins == null) return null
  if (todo.reminderAlarmId) removeAlarm(todo.reminderAlarmId)
  const alarm = addAlarm({
    label: `📌 ${todo.title}`.slice(0, 42),
    time: minutesToTime(mins - minutesBefore),
    days: [],
    sound: 'chime',
    volume: 0.7,
    linked: { feature: 'todo', id: todo.id },
  })
  updateTodo(id, { reminderAlarmId: alarm.id })
  return alarm
}

export function setTodoSettings(patch = {}) {
  TODOS.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

/** "mark physics homework done" — fuzzy title match from chat. */
export function completeByTitle(text) {
  const todo = findByTitle(TODOS.read().items, text)
  if (!todo) return null
  return { todo, result: completeTodo(todo.id, { source: 'chat' }) }
}

// ------------------------------------------------------------------
//  Creation paths: "made by Bodhya" + "made by you"
// ------------------------------------------------------------------

/** Real numbers Bodhya bases its suggestions on. */
export function suggestionContext(now = new Date()) {
  const items = TODOS.read().items
  const openItems = items.filter((t) => !t.done)
  const plan = planStats(now)
  const goal = goalProgress(now)
  const journal = journalStats(JOURNAL.read().entries, now)
  const today = dayKey(now)
  const todaysShield = SHIELD.read().log.filter((e) => e.day === today)
  const subjectMinutes = {}
  TIME.read().logs.forEach((l) => {
    const name = l.subject || 'Study'
    subjectMinutes[name] = (subjectMinutes[name] || 0) + (l.minutes || 0)
  })
  const weakSubject = Object.entries(subjectMinutes).sort((a, b) => a[1] - b[1])[0]?.[0] || ''

  return {
    examDays: plan.countdown && !plan.countdown.isPast ? plan.countdown.days : null,
    examName: plan.exam?.name || '',
    planToday: plan.today || [],
    planSubjects: [...new Set((plan.today || []).map((s) => s.subjectName))],
    lastPlanSubject: PLAN.read().subjects[0]?.name || '',
    overdue: openItems.filter((t) => t.due && daysBetween(today, t.due) < 0).length,
    open: openItems.length,
    todayDone: items.filter((t) => t.done && t.doneDay === today).length,
    minutesToday: goal.today,
    goalMinutes: goal.goal,
    streak: plan.stats?.streak || 0,
    weakSubject,
    escapesToday: todaysShield.filter((e) => e.type === 'escape').length,
    journalWritten: journal.todayWritten,
  }
}

/** Suggestions with titles and reasons resolved in the chosen language. */
export function suggestionsFor(lang = 'en', now = new Date()) {
  const ctx = suggestionContext(now)
  return suggestTasks(ctx, lang).map((s) => {
    const offset = s.dueOffsetDays || 0
    return {
      ...s,
      title: tr(lang, s.key, s.vars || {}),
      why: s.whyKey ? tr(lang, s.whyKey, s.whyVars || {}) : '',
      due: dayKey(new Date(now.getTime() + offset * 86400000)),
    }
  })
}

/** One-tap add for a suggestion (with a duplicate guard). */
export function applySuggestion(sug, { now = new Date() } = {}) {
  if (!sug?.title) return null
  const dupe = TODOS.read().items.some(
    (t) => !t.done && t.title.toLowerCase() === String(sug.title).toLowerCase()
  )
  if (dupe) return { duplicate: true, title: sug.title }
  const todo = addTodo({
    title: sug.title,
    subject: sug.subject || '',
    category: sug.category || 'study',
    priority: sug.priority || 'med',
    minutes: sug.minutes || null,
    due: sug.due || dayKey(now),
    dueTime: sug.dueTime || null,
    sessionId: sug.sessionId || null,
    notes: sug.why || '',
    source: 'bodhya',
  })
  change({ suggested: todo.id })
  return todo
}

export function applySuggestions(list = []) {
  const added = []
  const skipped = []
  ;(list || []).forEach((s) => {
    const res = applySuggestion(s)
    if (res && !res.duplicate) added.push(res)
    else if (res?.duplicate) skipped.push(res.title)
  })
  change({ suggestedMany: added.length })
  return { added, skipped }
}

/** Apply a ready-made pack: Bodhya wrote it, the user chooses when. */
export function applyPack(packId, now = new Date()) {
  const pack = packById(packId)
  if (!pack) return { added: [], skipped: [] }
  const added = []
  const skipped = []
  packTasks(packId, now).forEach((t) => {
    const title = resolveTitle(t.key, t.vars || {})
    const dupe = TODOS.read().items.some((x) => !x.done && x.title.toLowerCase() === title.toLowerCase())
    if (dupe) { skipped.push(title); return }
    added.push(addTodo({
      title,
      minutes: t.minutes,
      priority: t.priority,
      category: t.category,
      due: dayKey(new Date(now.getTime() + (t.dueOffsetDays || 0) * 86400000)),
      dueTime: t.dueTime || null,
      repeat: t.repeat || 'none',
      notes: resolveTitle(pack.labelKey),
      source: 'pack',
    }))
  })
  change({ pack: packId, added: added.length })
  return { added, skipped, pack }
}

/** "Turn today's plan into tasks" — mirrors unfinished sessions as to-dos. */
export function createTasksFromPlan(day = dayKey(), now = new Date()) {
  const sessions = (PLAN.read().sessions || []).filter((s) => s.day === day && !s.done)
  const alreadyLinked = new Set(
    TODOS.read().items.filter((t) => t.sessionId).map((t) => String(t.sessionId))
  )
  const added = []
  sessions.forEach((s) => {
    if (s.id && alreadyLinked.has(String(s.id))) return
    const title = s.topic ? `${s.subjectName} — ${s.topic}` : `${s.subjectName} session`
    const dupe = TODOS.read().items.some((t) => !t.done && t.title.toLowerCase() === title.toLowerCase())
    if (dupe) return
    added.push(addTodo({
      title,
      subject: s.subjectName || '',
      category: s.type === 'revision' ? 'revision' : 'study',
      priority: s.type === 'test' ? 'high' : 'med',
      minutes: s.minutes || null,
      due: day,
      dueTime: s.startTime || null,
      sessionId: s.id || null,
      notes: resolveTitle('todo.fromPlanNote'),
      source: 'plan',
    }))
  })
  change({ fromPlan: added.length })
  return added
}

/** Quick add that understands "physics 30 min tomorrow 6pm". */
export function quickAddFromText(text, now = new Date()) {
  const parsed = parseQuickTask(text, now)
  if (!parsed.title) return null
  const todo = addTodo({
    title: parsed.title,
    minutes: parsed.minutes,
    due: parsed.due,
    dueTime: parsed.dueTime,
    priority: parsed.priority || 'med',
    source: 'user',
  })
  change({ quickAdded: todo.id, parsed })
  return { todo, parsed }
}

// ------------------------------------------------------------------
// queries
// ------------------------------------------------------------------
export function todoStats(now = new Date()) {
  const items = TODOS.read().items
  const progress = todoProgress(items, now)
  const groups = groupTodos(items, now)
  return {
    ...progress,
    streak: completionStreak(items, now),
    xpToday: TODOS.read().xpByDay?.[dayKey(now)] || 0,
    groups,
    soon: items.filter((t) => !t.done && t.due && daysBetween(dayKey(now), t.due) <= 1).length,
  }
}

export function todaysList(now = new Date()) {
  const items = TODOS.read().items
  return {
    overdue: items.filter((t) => !t.done && t.due && daysBetween(dayKey(now), t.due) < 0)
      .sort(todoComparator('smart')),
    today: items.filter((t) => !t.done && t.due === dayKey(now)).sort(todoComparator('smart')),
    undated: items.filter((t) => !t.done && !t.due).sort(todoComparator('smart')),
  }
}

/** Everything Bodhya should nag about (used by the agent + digest). */
export function naggingTodos(now = new Date()) {
  const items = TODOS.read().items.filter((t) => !t.done)
  const overdue = items.filter((t) => t.due && daysBetween(dayKey(now), t.due) < 0)
  const today = items.filter((t) => t.due === dayKey(now))
  return { overdue, today, all: [...overdue, ...today] }
}

// ------------------------------------------------------------------
// Chapter → tasks (paste a chapter, get a task list)
// ------------------------------------------------------------------

/** Parse a pasted chapter and return tasks with titles/reasons in `lang`. */
export function chapterTasksFrom(text = '', { lang = null, subject = '', max = 8, now = new Date() } = {}) {
  const useLang = lang || (() => { try { return loadState().profile?.lang || LANGS_UI_DEFAULT } catch { return LANGS_UI_DEFAULT } })()
  const scan = scanChapter(text)
  const items = chapterSuggestions(text, { subject, max })
  return {
    scan,
    subject: (subject || scan.subject || '').trim(),
    tasks: items.map((t) => {
      const offset = t.dueOffsetDays || 0
      return {
        ...t,
        title: tr(useLang, t.key, t.vars || {}),
        why: t.whyKey ? tr(useLang, t.whyKey, t.whyVars || {}) : '',
        due: dayKey(new Date(now.getTime() + offset * 86400000)),
      }
    }),
  }
}

/** Store the tasks the student ticked (source: 'chapter', keeps the reason). */
export function applyChapterTasks(list = [], { now = new Date() } = {}) {
  const added = []
  const skipped = []
  ;(list || []).forEach((t) => {
    if (!t?.title) return
    const dupe = TODOS.read().items.some((x) => !x.done && x.title.toLowerCase() === String(t.title).toLowerCase())
    if (dupe) { skipped.push(t.title); return }
    added.push(addTodo({
      title: t.title,
      subject: t.subject || '',
      category: t.category || 'study',
      priority: t.priority || 'med',
      minutes: t.minutes || null,
      due: t.due || dayKey(now),
      dueTime: t.dueTime || null,
      notes: t.why || '',
      source: 'chapter',
    }))
  })
  change({ chapterAdded: added.length })
  return { added, skipped }
}

/** One-shot: chapter text → stored tasks (skipping anything already on the list). */
export function chapterImport(text = '', opts = {}) {
  const parsed = chapterTasksFrom(text, opts)
  const res = applyChapterTasks(parsed.tasks, opts)
  return { ...parsed, ...res }
}
