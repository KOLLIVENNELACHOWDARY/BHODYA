// ============================================================
//  Study-plan store — exam countdown, subjects, generated
//  sessions, progress, and the bridge to focus/time/XP.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT, openFeature } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp } from '../chatbot/brain/memory.js'
import { addAlarm, removeAlarmsFor } from '../alarms/store.js'
import { logMinutes } from '../time-tracking/store.js'
import {
  addDays, dayKey, daysBetween, examCountdown, explainPlan, generatePlan, minutesToTime,
  nextSession, normaliseRecurrence, parseDayKey, planProgress, planToText, PLAN_TEMPLATES,
  recurrenceDays, seriesSessions, subjectWeight, timeToMinutes, todaySessions, validateMove,
  weekGrid, DIFFICULTY, SUBJECT_COLORS,
} from './logic.js'

export const PLAN = makeStore(
  'bodhya_studyplan_v1',
  {
    exam: { name: '', date: null },          // {name, date:'YYYY-MM-DD'}
    subjects: [],                            // {id,name,color,priority,difficulty,targetHours,topics[]}
    sessions: [],
    settings: {
      dailyMinutes: 120,
      studyDays: [1, 2, 3, 4, 5, 6],
      startTime: '17:00',
      sessionMinutes: 30,
      spacedRepetition: true,
      morningSessionAlarm: true,             // ring 10 min before today's first session
    },
    generatedAt: null,
    lastMeta: null,
    draft: null,             // Bodhya's proposed plan, waiting for Accept/Discard
  },
  { changeEvent: EVT.planChanged }
)

const change = (detail = {}) => { emit(EVT.planChanged, detail); return detail }

// ------------------------------------------------------------------
// subjects
// ------------------------------------------------------------------
export function addSubject(input = {}) {
  const state = PLAN.read()
  const subject = {
    id: uid('sub'),
    name: (input.name || '').trim() || `Subject ${state.subjects.length + 1}`,
    color: input.color || SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length],
    priority: Number(input.priority) || 2,        // 1..3
    difficulty: Number(input.difficulty) || 2,    // 1..3
    targetHours: Number(input.targetHours) || 5,
    topics: Array.isArray(input.topics) ? input.topics.filter(Boolean) : [],
    createdAt: Date.now(),
  }
  PLAN.update((s) => ({ subjects: [...s.subjects, subject] }))
  change({ subjectAdded: subject.id })
  return subject
}

export function updateSubject(id, patch = {}) {
  PLAN.update((s) => ({
    subjects: s.subjects.map((x) => {
      if (x.id !== id) return x
      const next = { ...x, ...patch }
      if (patch.topicsText != null) {
        next.topics = String(patch.topicsText).split(/[\n,]/).map((t) => t.trim()).filter(Boolean)
      }
      delete next.topicsText
      return next
    }),
  }))
  change({ subjectUpdated: id })
  return PLAN.read().subjects.find((s) => s.id === id)
}

export function removeSubject(id) {
  PLAN.update((s) => ({
    subjects: s.subjects.filter((x) => x.id !== id),
    sessions: s.sessions.filter((x) => x.subjectId !== id),
  }))
  change({ subjectRemoved: id })
}

export function setPlanSettings(patch = {}) {
  PLAN.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

export function setExam({ name, date } = {}) {
  PLAN.update((s) => ({ exam: { name: name ?? s.exam.name, date: date ?? s.exam.date } }))
  change({ exam: true })
  const c = examCountdown(PLAN.read().exam.date)
  if (date && c && !c.isPast) {
    pushNotification({
      kind: 'plan',
      title: `📅 ${name || 'Exam'} on ${parseDayKey(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
      body: c.days === 0 ? 'It is today. You have got this! 🍀' : `${c.days} days left — shall I build a plan?`,
      action: { feature: 'planner' },
      groupKey: `exam-${date}`,
    })
  }
}

// ------------------------------------------------------------------
// sessions
// ------------------------------------------------------------------
export function addSession(input = {}) {
  const subject = PLAN.read().subjects.find((s) => s.id === input.subjectId)
  const session = {
    id: uid('ss'),
    subjectId: input.subjectId || subject?.id || null,
    subjectName: input.subjectName || subject?.name || 'Study',
    day: input.day || dayKey(),
    startTime: input.startTime || '17:00',
    minutes: Number(input.minutes) || 30,
    topic: input.topic || null,
    type: input.type || 'study',
    done: false,
    doneAt: null,
    source: input.source || 'manual',
    recurrence: normaliseRecurrence(input.recurrence),
    seriesId: input.seriesId || null,
  }
  PLAN.update((s) => ({ sessions: [...s.sessions, session] }))
  change({ sessionAdded: session.id })
  return session
}

export function updateSession(id, patch = {}) {
  PLAN.update((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
  change({ sessionUpdated: id })
  return PLAN.read().sessions.find((s) => s.id === id)
}

export function removeSession(id) {
  PLAN.update((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }))
  change({ sessionRemoved: id })
}

export function completeSession(id, { minutes } = {}) {
  const session = PLAN.read().sessions.find((s) => s.id === id)
  if (!session || session.done) return session
  const mins = Number(minutes) || session.minutes
  updateSession(id, { done: true, doneAt: Date.now(), minutes: mins })

  logMinutes({ subject: session.subjectName, minutes: mins, source: 'plan', at: Date.now() })
  const gained = 10 + Math.round(mins / 5)
  const res = addXp(gained)
  pushNotification({
    kind: 'plan',
    title: `📘 Session done: ${session.subjectName}`,
    body: `${mins} min${session.topic ? ` · ${session.topic}` : ''} · +${gained} XP`,
    silent: true,
    groupKey: `session-done-${id}`,
    action: { feature: 'planner' },
  })
  emit(EVT.planChanged, { completed: id, xp: gained })
  return { ...session, done: true, xpGained: gained, leveledUp: res.leveledUp }
}

export function uncompleteSession(id) {
  return updateSession(id, { done: false, doneAt: null })
}

export function toggleSession(id) {
  const s = PLAN.read().sessions.find((x) => x.id === id)
  return s?.done ? uncompleteSession(id) : completeSession(id)
}

/** Push today's unfinished sessions to tomorrow (the "life happened" button). */
export function pushToTomorrow(day = dayKey()) {
  const moved = []
  PLAN.update((s) => ({
    sessions: s.sessions.map((x) => {
      if (x.day !== day || x.done) return x
      moved.push(x.id)
      const d = addDays(parseDayKey(day), 1)
      return { ...x, day: dayKey(d) }
    }),
  }))
  change({ pushed: moved })
  return moved.length
}

/** Start a focus block from a plan session (opens the focus timer). */
export function startFocusForSession(id) {
  const session = PLAN.read().sessions.find((s) => s.id === id)
  if (!session) return
  openFeature('focus', {
    subject: session.subjectName,
    minutes: Math.max(10, Math.min(60, session.minutes)),
    sessionId: session.id,
    autostart: true,
  })
}

// ------------------------------------------------------------------
// generation
// ------------------------------------------------------------------
/**
 * Build a *draft* plan (Bodhya's proposal). Nothing touches the week until
 * the user accepts it — see acceptDraft().
 */
export function previewPlan(overrides = {}) {
  const state = PLAN.read()
  const settings = { ...state.settings, ...overrides }
  const result = generatePlan({
    subjects: state.subjects,
    examDate: state.exam?.date || null,
    days: overrides.days ?? (state.exam?.date ? undefined : 7),
    dailyMinutes: settings.dailyMinutes,
    studyDays: settings.studyDays,
    sessionMinutes: settings.sessionMinutes,
    spacedRepetition: settings.spacedRepetition,
    startTime: settings.startTime,
    now: new Date(),
  })
  const stamped = result.sessions.map((x) => ({ ...x, id: uid('ss'), source: x.source || 'plan' }))
  const draft = { sessions: stamped, meta: result.meta, settings, createdAt: Date.now() }
  PLAN.update({ draft })
  change({ draft: true, count: stamped.length })
  return draft
}

export function discardDraft() {
  PLAN.update({ draft: null })
  change({ draftDiscarded: true })
  return null
}

/** Accept Bodhya's draft: generated sessions are replaced, the user's stay. */
export function acceptDraft(now = new Date()) {
  const state = PLAN.read()
  const draft = state.draft
  if (!draft) return { applied: 0 }
  const manual = state.sessions.filter((sc) => sc.source === 'manual')
  PLAN.update({
    sessions: [...manual, ...draft.sessions],
    generatedAt: now.getTime(),
    lastMeta: draft.meta,
    settings: draft.settings,
    draft: null,
  })

  // one reminder alarm for today's first session (unchanged behaviour)
  const first = draft.sessions
    .filter((sc) => sc.day === dayKey(now))
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))[0]
  if (draft.settings.morningSessionAlarm && first) {
    const [h, m] = first.startTime.split(':').map(Number)
    addAlarm({
      label: `📘 ${first.subjectName} session`,
      time: minutesToTime(Math.max(0, h * 60 + m - 10)),
      days: [],
      sound: 'chime',
      volume: 0.7,
      linked: { feature: 'focus', id: first.id },
      note: 'Your study plan starts in 10 minutes',
    })
  }
  if (draft.meta?.reason === 'ok') {
    pushNotification({
      kind: 'plan',
      title: `🗺️ Study plan applied — ${draft.meta.days} days, ${Math.round((draft.meta.totalPlanned / 60) * 10) / 10}h`,
      body: explainPlan(draft.meta, 'en').slice(0, 180),
      action: { feature: 'planner' },
    })
  }
  change({ accepted: draft.sessions.length })
  return { applied: draft.sessions.length, meta: draft.meta }
}

/** Kept for chat + templates: preview then accept immediately. */
export function generateMyPlan(overrides = {}) {
  const state = PLAN.read()
  const settings = { ...state.settings, ...overrides }
  const result = generatePlan({
    subjects: state.subjects,
    examDate: state.exam?.date || null,
    days: overrides.days ?? (state.exam?.date ? undefined : 7),
    dailyMinutes: settings.dailyMinutes,
    studyDays: settings.studyDays,
    sessionMinutes: settings.sessionMinutes,
    spacedRepetition: settings.spacedRepetition,
    startTime: settings.startTime,
    now: new Date(),
  })

  const stamped = result.sessions.map((x) => ({ ...x, id: uid('ss'), source: x.source || 'plan' }))
  const manual = state.sessions.filter((x) => x.source === 'manual')
  PLAN.update({
    sessions: [...manual, ...stamped],
    generatedAt: Date.now(),
    lastMeta: result.meta,
    settings,
    draft: null,
  })

  if (result.meta?.reason === 'ok') {
    const first = stamped
      .filter((x) => x.day === dayKey())
      .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))[0]
    if (settings.morningSessionAlarm && first) {
      const [h, m] = first.startTime.split(':').map(Number)
      addAlarm({
        label: `📘 ${first.subjectName} session`,
        time: minutesToTime(Math.max(0, h * 60 + m - 10)),
        days: [],
        sound: 'chime',
        volume: 0.7,
        linked: { feature: 'focus', id: first.id },
        note: 'Your study plan starts in 10 minutes',
      })
    }
    pushNotification({
      kind: 'plan',
      title: `🗺️ Study plan ready — ${result.meta.days} days, ${Math.round((result.meta.totalPlanned / 60) * 10) / 10}h`,
      body: explainPlan(result.meta, 'en').slice(0, 180),
      action: { feature: 'planner' },
    })
    change({ generated: true })
  }
  return { sessions: stamped, meta: result.meta }
}

// ------------------------------------------------------------------
//  Manual editing — the plan the *user* builds
// ------------------------------------------------------------------
/** Add a session at a specific day + time (used by the tap-to-add grid). */
export function addSessionAt({ day, startTime, subjectId = null, minutes = 30, topic = null, type = 'study', recurrence = null, seriesId = null }, now = new Date()) {
  const state = PLAN.read()
  const subject = state.subjects.find((s) => s.id === subjectId) || state.subjects[0]
  if (!subject) return null
  const session = {
    id: uid('ss'),
    subjectId: subject.id,
    subjectName: subject.name,
    day: day || dayKey(now),
    startTime: startTime || '17:00',
    minutes: Number(minutes) || 30,
    topic: topic || null,
    type,
    done: false,
    doneAt: null,
    source: 'manual',
    recurrence: normaliseRecurrence(recurrence),
    seriesId: seriesId || null,
  }
  PLAN.update((s) => ({ sessions: [...s.sessions, session] }))
  change({ sessionAdded: session.id, manual: true })
  return session
}

/** Drag-free move: change the day and/or start time of a session. */
export function moveSession(id, { day = null, startTime = null } = {}) {
  let moved = null
  PLAN.update((s) => ({
    sessions: s.sessions.map((x) => {
      if (x.id !== id) return x
      moved = { ...x, day: day || x.day, startTime: startTime || x.startTime, source: x.source === 'plan' ? 'manual' : x.source }
      return moved
    }),
  }))
  change({ moved: id })
  return moved
}

/** Move with the same rules the UI shows: refuses no-ops and finished work. */
export function moveSessionChecked(id, target = {}, now = new Date()) {
  const state = PLAN.read()
  const session = state.sessions.find((s) => s.id === id)
  const verdict = validateMove(session, target, state.sessions)
  if (!verdict.ok) return { ...verdict, session: null }
  const moved = moveSession(id, { day: verdict.day, startTime: verdict.startTime })
  void now
  return { ...verdict, session: moved }
}

/**
 * Move a whole series: the rule holder plus every sibling that is not done.
 * The delta (in days and minutes) applied to the anchor is applied to the rest,
 * so "Mon/Wed 18:00" dragged to Tue becomes "Tue/Thu 19:00".
 */
export function moveSeries(id, { day = null, startTime = null } = {}) {
  const state = PLAN.read()
  const anchor = state.sessions.find((s) => s.id === id)
  if (!anchor) return { moved: 0, reason: 'missing' }
  const seriesId = anchor.seriesId || anchor.id
  const members = seriesSessions(state.sessions, seriesId).filter((s) => !s.done)
  const dayDelta = day ? daysBetween(anchor.day, day) : 0
  const fromMins = timeToMinutes(anchor.startTime) ?? 0
  const toMins = startTime ? timeToMinutes(startTime) ?? fromMins : fromMins
  const timeDelta = toMins - fromMins
  if (!dayDelta && !timeDelta) return { moved: 0, reason: 'same' }

  const ids = new Set(members.map((s) => s.id))
  PLAN.update((s) => ({
    sessions: s.sessions.map((x) => {
      if (!ids.has(x.id)) return x
      const shifted = addDays(parseDayKey(x.day), dayDelta)
      const mins = Math.max(0, Math.min(23 * 60 + 55, (timeToMinutes(x.startTime) ?? 0) + timeDelta))
      return { ...x, day: dayKey(shifted), startTime: minutesToTime(mins), source: x.source === 'plan' ? 'manual' : x.source }
    }),
  }))
  change({ seriesMoved: seriesId, moved: members.length })
  return { moved: members.length, seriesId }
}

/** Delete a whole series (used when the student changes the weekly rhythm). */
export function removeSeries(id, { keepThis = false } = {}) {
  const state = PLAN.read()
  const anchor = state.sessions.find((s) => s.id === id)
  if (!anchor) return 0
  const seriesId = anchor.seriesId || anchor.id
  const members = seriesSessions(state.sessions, seriesId)
  const doomed = new Set(members.filter((s) => !(keepThis && s.id === anchor.id)).map((s) => s.id))
  PLAN.update((s) => ({ sessions: s.sessions.filter((x) => !doomed.has(x.id)) }))
  change({ seriesRemoved: seriesId, removed: doomed.size })
  return doomed.size
}

/**
 * Attach (or clear) a repeat rule and lay down the occurrences it implies.
 * Idempotent: running it twice never double-books a slot.
 */
export function setSessionRecurrence(id, rule, { from = new Date(), horizonDays = 21 } = {}) {
  const state = PLAN.read()
  const anchor = state.sessions.find((s) => s.id === id)
  if (!anchor) return { rule: null, created: 0 }
  const rec = normaliseRecurrence(rule)
  const seriesId = rec ? (anchor.seriesId || anchor.id) : anchor.seriesId
  PLAN.update((s) => ({
    sessions: s.sessions.map((x) => (x.id === id ? { ...x, recurrence: rec, seriesId: rec ? seriesId : x.seriesId } : x)),
  }))
  if (!rec) {
    change({ recurrenceCleared: id })
    return { rule: null, created: 0 }
  }
  const created = materialiseSeries({ seriesId, from, horizonDays })
  return { rule: rec, created: created.created }
}

/**
 * Create the missing occurrences for one series (or every series).
 * Deduped on seriesId + day + startTime, so drag/rebuild cycles stay clean.
 */
export function materialiseSeries({ seriesId = null, from = new Date(), horizonDays = 21 } = {}) {
  const state = PLAN.read()
  const anchors = state.sessions.filter((s) => s.recurrence && (!seriesId || s.id === seriesId || s.seriesId === seriesId))
  let created = 0
  const additions = []
  const fromKey = dayKey(from)
  for (const anchor of anchors) {
    const key = anchor.seriesId || anchor.id
    const days = recurrenceDays(anchor.recurrence, anchor.day, { from, horizonDays })
    const taken = new Set(state.sessions
      .filter((s) => s.seriesId === key || s.id === key)
      .map((s) => `${s.day}T${s.startTime}`))
    days.forEach((day) => {
      if (day <= fromKey) return
      if (taken.has(`${day}T${anchor.startTime}`)) return
      taken.add(`${day}T${anchor.startTime}`)
      additions.push({
        id: uid('ss'),
        subjectId: anchor.subjectId,
        subjectName: anchor.subjectName,
        day,
        startTime: anchor.startTime,
        minutes: anchor.minutes,
        topic: anchor.topic,
        type: anchor.type,
        done: false,
        doneAt: null,
        source: anchor.source === 'plan' ? 'plan' : 'manual',
        recurrence: null,
        seriesId: key,
      })
      created++
    })
  }
  if (additions.length) {
    PLAN.update((s) => ({ sessions: [...s.sessions, ...additions] }))
    change({ seriesMaterialised: created })
  }
  return { created, additions }
}

export function duplicateSession(id, { day = null } = {}) {
  const state = PLAN.read()
  const src = state.sessions.find((x) => x.id === id)
  if (!src) return null
  const copy = { ...src, id: uid('ss'), day: day || src.day, done: false, doneAt: null, source: 'manual' }
  PLAN.update((s) => ({ sessions: [...s.sessions, copy] }))
  change({ duplicated: copy.id })
  return copy
}

export function copyDayToNext(day = dayKey(), now = new Date()) {
  const state = PLAN.read()
  const list = state.sessions.filter((x) => x.day === day)
  if (!list.length) return 0
  const next = dayKey(new Date(parseDayKey(day).getTime() + 86400000))
  const copies = list.map((x) => ({ ...x, id: uid('ss'), day: next, done: false, doneAt: null, source: 'manual' }))
  PLAN.update((s) => ({ sessions: [...s.sessions, ...copies] }))
  change({ dayCopied: copies.length })
  void now
  return copies.length
}

export function clearDay(day = dayKey()) {
  const before = PLAN.read().sessions.length
  PLAN.update((s) => ({ sessions: s.sessions.filter((x) => x.day !== day) }))
  change({ dayCleared: before - PLAN.read().sessions.length })
  return before - PLAN.read().sessions.length
}

/** Minutes already booked on a day (for the "that day is full" hint). */
export function bookedMinutes(day, sessions = PLAN.read().sessions) {
  return sessions.filter((x) => x.day === day).reduce((a, x) => a + (x.minutes || 0), 0)
}

export function applyTemplate(templateId) {
  const tpl = PLAN_TEMPLATES.find((t) => t.id === templateId)
  if (!tpl) return null
  setPlanSettings(tpl.apply)
  return generateMyPlan(tpl.apply)
}

export function clearPlan({ keepSubjects = true } = {}) {
  PLAN.update((s) => ({
    sessions: s.sessions.filter((x) => x.source === 'manual'),
    subjects: keepSubjects ? s.subjects : [],
    lastMeta: null,
  }))
  change({ cleared: true })
}

export function clearSubjectAlarms(subjectId) {
  return removeAlarmsFor('subject', subjectId)
}

// ------------------------------------------------------------------
// queries
// ------------------------------------------------------------------
export function planStats(now = new Date()) {
  const s = PLAN.read()
  return {
    ...planProgress(s.sessions, s.subjects),
    countdown: examCountdown(s.exam?.date, now),
    exam: s.exam,
    today: todaySessions(s.sessions, now),
    next: nextSession(s.sessions, now),
    week: weekGrid(s.sessions, now, 7),
    subjects: s.subjects,
    settings: s.settings,
    lastMeta: s.lastMeta,
    generatedAt: s.generatedAt,
  }
}

export function planAsText(lang = 'en') {
  const s = PLAN.read()
  return planToText(s.sessions, s.subjects, lang)
}

export function subjectsForPicker() {
  return PLAN.read().subjects.map((s) => ({ id: s.id, name: s.name, color: s.color }))
}

/** Add study minutes straight to the plan (used by chat + time tracking). */
export function planAddQuick({ subjectName, minutes, day = dayKey(), startTime = '18:00' }) {
  const name = (subjectName || 'Study').trim()
  let subject = PLAN.read().subjects.find((x) => x.name.toLowerCase() === name.toLowerCase())
  if (!subject) subject = addSubject({ name, targetHours: 5 })
  return addSession({ subjectId: subject.id, subjectName: subject.name, minutes, day, startTime })
}

export { DIFFICULTY, SUBJECT_COLORS, subjectWeight, daysBetween, explainPlan, PLAN_TEMPLATES }
