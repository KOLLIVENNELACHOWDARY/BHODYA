// ============================================================
//  Guardian store — the student's sharing switch + read-only view.
//
//  gatherSnapshot() is the only place that touches other features,
//  and it deliberately only reads NUMBERS (plus journal text when the
//  student has explicitly allowed that one section).
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { loadState } from '../chatbot/brain/memory.js'
import {
  SECTIONS, SECTION_IDS, buildReport, codeMatches, defaultSections, grantStatus, makeShareCode,
  normaliseCode, reportToHtml, reportToText, sharingScore,
} from './logic.js'
import {
  DEFAULT_EXPIRY_DAYS, decodeSnapshotToken, encodeSnapshotToken, guestLink, linkStats, shareSummary,
  tokenFromUrl,
} from './link.js'
import { buildMonthReview, monthKey, monthReviewText, dayKey as monthDayKey } from './month.js'

import { FOREST, forestState } from '../study-forest/store.js'
import { SHIELD, shieldState } from '../focus-shield/store.js'
import { TODOS, todoStats } from '../todo-list/store.js'
import { PLAN, planStats } from '../study-schedule/store.js'
import { FOCUS } from '../focus/store.js'
import { TIME, goalProgress, studyStreak, weekBars } from '../time-tracking/store.js'
import { JOURNAL, lettersState, listEntries, journalState } from '../journal/store.js'
import { journalStats, moodTrend } from '../journal/logic.js'

export const GUARDIAN = makeStore(
  'bodhya_guardian_v1',
  {
    grant: null,          // {id, code, name, relation, sections, active, createdAt, expiresAt, views}
    history: [],          // snapshots the student chose to send : [{id, at, channel, score}]
    links: [],               // guest links the student created: {id, token, at, exp, note}
    settings: {
      weeklyReport: true,      // offer a weekly summary the student can forward
      notifyOnView: false,     // "your guardian opened the report" (only if student wants to know)
      expiryDays: 0,           // 0 = no expiry
      guestLinkDays: DEFAULT_EXPIRY_DAYS,
    },
  },
  { changeEvent: EVT.guardianChanged }
)

const change = (detail = {}) => { emit(EVT.guardianChanged, detail); return detail }

// ------------------------------------------------------------------
//  the student's side
// ------------------------------------------------------------------
export function createGrant({ name = '', relation = 'parent', sections = null, now = new Date() } = {}) {
  const grant = {
    id: uid('gr'),
    code: makeShareCode(),
    name: name.trim(),
    relation,
    sections: sections || defaultSections(),
    active: true,
    createdAt: now.getTime(),
    expiresAt: null,
    views: 0,
    lastViewedAt: null,
  }
  const days = GUARDIAN.read().settings.expiryDays
  if (days > 0) grant.expiresAt = new Date(now.getTime() + days * 86400000).toISOString()
  GUARDIAN.update({ grant })
  pushNotification({
    kind: 'system',
    title: '👨‍👩‍👧 Sharing link created',
    body: `Code ${grant.code}${grant.name ? ` for ${grant.name}` : ''}. You choose what is visible, and you can revoke it any time.`,
    silent: true,
    action: { feature: 'guardian' },
    groupKey: `guardian-grant-${grant.id}`,
  })
  change({ created: grant.id })
  return grant
}

export function setGrantDetails(patch = {}) {
  GUARDIAN.update((s) => (s.grant ? { grant: { ...s.grant, ...patch } } : {}))
  change({ details: true })
  return GUARDIAN.read().grant
}

export function toggleSection(id) {
  if (!SECTION_IDS.includes(id)) return null
  const grant = GUARDIAN.read().grant
  const sections = grant?.sections || defaultSections()
  const next = sections.includes(id) ? sections.filter((s) => s !== id) : [...sections, id]
  GUARDIAN.update((s) => (s.grant ? { grant: { ...s.grant, sections: next } } : { grant: { ...(s.grant || {}), sections: next } }))
  change({ sections: next })
  return next
}

export function setSections(list = []) {
  const clean = list.filter((id) => SECTION_IDS.includes(id))
  GUARDIAN.update((s) => ({ grant: s.grant ? { ...s.grant, sections: clean } : s.grant }))
  change({ sections: clean })
  return clean
}

export function pauseSharing(active = false) {
  GUARDIAN.update((s) => (s.grant ? { grant: { ...s.grant, active } } : {}))
  change({ active })
  return GUARDIAN.read().grant
}

/** New code (the old one stops working immediately). */
export function revokeAndRotate() {
  const grant = GUARDIAN.read().grant
  const code = makeShareCode()
  GUARDIAN.update((s) => (s.grant ? { grant: { ...s.grant, code, createdAt: Date.now(), views: 0, lastViewedAt: null } } : {}))
  change({ rotated: true })
  pushNotification({
    kind: 'system',
    title: '🔁 New sharing code',
    body: `Old code ${grant?.code || ''} no longer works. Share the new one only with people you trust.`,
    silent: true,
  })
  return code
}

export function deleteGrant() {
  GUARDIAN.update({ grant: null })
  change({ deleted: true })
}

export function setGuardianSettings(patch = {}) {
  GUARDIAN.update((s) => ({ settings: { ...s.settings, ...patch } }))
  change({ settings: true })
}

/** Add a personal note that travels with the next snapshot. */
export function addNoteToGuardian(text) {
  GUARDIAN.update((s) => ({ pendingNote: String(text || '').trim() }))
  change({ note: true })
}

// ------------------------------------------------------------------
//  data gathering (numbers only, unless journalText is allowed)
// ------------------------------------------------------------------
export function gatherSnapshot(now = new Date()) {
  const grant = GUARDIAN.read().grant
  const allowed = grant?.sections || defaultSections()
  const has = (id) => allowed.includes(id)

  const todos = todoStats(now)
  const plan = planStats(now)
  const forest = forestState(now)
  const shield = shieldState()
  const goal = goalProgress(now)
  const week = weekBars(now, 7).reduce((a, d) => a + d.minutes, 0)
  const jState = journalState(now)
  const letters = lettersState(now)
  const todayKey = new Date(now).toDateString()

  const snapshot = {
    at: now.getTime(),
    goalMinutes: goal.goal,
    minutesToday: goal.today,
    minutesWeek: week,
    sessionsToday: FOCUS.read().log.filter((l) => new Date(l.at).toDateString() === todayKey).length,
    studyStreak: studyStreak(now),
    tasksDone: todos.done,
    tasksTotal: todos.total,
    tasksOpen: todos.open,
    tasksOverdue: todos.overdue,
    examDays: plan.countdown ? (plan.countdown.isPast ? null : plan.countdown.days) : null,
    examName: plan.exam?.name || '',
    planSessions: plan.today.length,
    planDone: plan.today.filter((s) => s.done).length,
    planPercent: plan.pct,
    treesGrown: forest.stats.total,
    treesLost: forest.stats.witheredCount,
    forestStreak: forest.stats.streak,
    longestSession: forest.stats.longestSession,
    cleanRate: shield.stats.cleanRate,
    blockedSites: SHIELD.read().sites.length + SHIELD.read().packs.length,
    urgesResisted: shield.stats.resisted,
    breakMinutes: shield.stats.breakMinutes,
    avgMood: jState.stats.avgMood,
    moodTrend: moodTrend(JOURNAL.read().entries, 14, now).direction,
    journalDays: jState.stats.daysWritten,
    journalStreak: jState.stats.streak,
    lettersSealed: letters.stats.sealed,
    nextLetterAt: letters.stats.nextAt,
    journalEntries: has('journalText')
      ? listEntries({ filter: 'thisMonth' }, now).slice(0, 5).map((e) => ({ day: e.day, mood: e.mood, text: e.text }))
      : [],
  }
  return snapshot
}

/** The report as the guardian would see it (used for the student's preview too). */
export function buildGuardianReport({ now = new Date(), lang = 'en' } = {}) {
  const grant = GUARDIAN.read().grant
  const allowed = grant?.sections || defaultSections()
  const snapshot = gatherSnapshot(now)
  const report = buildReport(snapshot, allowed, lang)
  if (GUARDIAN.read().pendingNote) report.noteFromStudent = GUARDIAN.read().pendingNote
  return report
}

export function previewAsGuardian(lang = 'en') {
  return buildGuardianReport({ lang })
}

// ------------------------------------------------------------------
//  the guardian's side (read-only)
// ------------------------------------------------------------------
/**
 * Open the report with a code. Returns {ok, report} or {error, reason}.
 * This is deliberately the ONLY way in — no code, no view.
 */
export function guardianUnlock(code, { lang = 'en', now = new Date() } = {}) {
  const state = GUARDIAN.read()
  const status = grantStatus(state.grant, now)
  if (!status.ok) return { error: status.reason }
  if (!codeMatches(state.grant, code)) return { error: 'wrong-code' }

  const report = buildGuardianReport({ now, lang })
  GUARDIAN.update((s) => ({
    grant: s.grant ? { ...s.grant, views: (s.grant.views || 0) + 1, lastViewedAt: now.getTime() } : null,
    history: [{ id: uid('gv'), at: now.getTime(), channel: 'in-app', score: report.score }, ...(s.history || [])].slice(0, 60),
  }))
  if (state.settings.notifyOnView) {
    pushNotification({
      kind: 'system',
      title: '👀 Your guardian opened the report',
      body: 'You asked to be told when this happens.',
      silent: true,
    })
  }
  change({ viewed: true })
  return { ok: true, report, grant: GUARDIAN.read().grant }
}

export function guardianPanelState(now = new Date()) {
  const state = GUARDIAN.read()
  const status = grantStatus(state.grant, now)
  const sections = state.grant?.sections || defaultSections()
  return {
    ...state,
    status,
    sections,
    score: sharingScore(sections, state.grant),
    snapshot: gatherSnapshot(now),
    report: buildGuardianReport({ now }),
  }
}

// ------------------------------------------------------------------
//  📄 month in review (printable, for parent-teacher meetings)
// ------------------------------------------------------------------
/**
 * Gather a month of numbers from every feature and shape the review.
 * Journal text is only included when the student shared that section.
 */
export function buildMonthReviewFor({ month = monthKey(new Date()), lang = 'en', now = new Date() } = {}) {
  const allowed = GUARDIAN.read().grant?.sections || defaultSections()
  const allowJournalText = allowed.includes('journalText')
  const timeLogs = TIME.read().logs.map((l) => ({ minutes: l.minutes, at: l.at, subject: l.subject }))
  const trees = FOREST.read().trees.map((t) => ({ day: t.day, status: t.status, minutes: t.minutes, escapes: t.escapes }))
  const shieldStateLocal = SHIELD.read()
  const sessions = shieldStateLocal.sessions.map((s) => ({
    startedAt: s.startedAt, endedAt: s.endedAt, escapes: s.escapes, minutes: s.minutes,
  }))
  const todos = TODOS.read().items.map((t) => ({ done: t.done, doneDay: t.doneDay, due: t.due, title: t.title }))
  const journal = JOURNAL.read().entries.map((e) => ({
    day: e.day, mood: e.mood, win: e.win, tags: e.tags,
    ...(allowJournalText ? { text: e.text } : {}),
  }))
  const plan = PLAN.read().sessions.map((s) => ({ day: s.day, done: s.done, minutes: s.minutes, subjectName: s.subjectName }))

  return buildMonthReview(
    { timeLogs, trees, sessions, todos, journal, plan, deadlines: todos, shieldLog: shieldStateLocal.log },
    { month, lang, allowJournalText, now },
  )
}

export function monthReviewTextFor({ month = monthKey(new Date()), lang = 'en' } = {}) {
  return monthReviewText(buildMonthReviewFor({ month, lang }), lang)
}

/** List the months that have any data, newest first (for the picker). */
export function monthsWithData(now = new Date()) {
  const keys = new Set()
  TIME.read().logs.forEach((l) => keys.add(monthDayKey(l.at).slice(0, 7)))
  JOURNAL.read().entries.forEach((e) => keys.add(String(e.day).slice(0, 7)))
  FOREST.read().trees.forEach((t) => keys.add(String(t.day).slice(0, 7)))
  keys.add(monthKey(now))
  return [...keys].sort().reverse().slice(0, 12)
}

// ------------------------------------------------------------------
//  🔗 guest links (a teacher can open the report without the app)
// ------------------------------------------------------------------
/**
 * Create a snapshot link: the report is frozen into the URL itself, so it can
 * never leak data recorded after sharing, and it expires on its own.
 * (For revocable links, use the server token via POST /api/guardian/links.)
 */
export function createGuestLink({ days = null, note = null, lang = 'en' } = {}) {
  const state = GUARDIAN.read()
  const expiry = days ?? state.settings.guestLinkDays ?? DEFAULT_EXPIRY_DAYS
  const snapshot = gatherSnapshot()
  const sections = state.grant?.sections || defaultSections()
  const profile = loadState().profile || {}
  const token = encodeSnapshotToken({
    snapshot,
    sections,
    studentName: profile.name || '',
    note: note ?? state.pendingNote ?? '',
    expiresAt: new Date(Date.now() + Math.max(1, expiry) * 86400000).toISOString().slice(0, 10),
  })
  const link = {
    id: uid('gl'),
    token,
    at: Date.now(),
    exp: new Date(Date.now() + Math.max(1, expiry) * 86400000).toISOString().slice(0, 10),
    days: expiry,
    sections,
    note: (note ?? state.pendingNote ?? '').slice(0, 200),
    stats: linkStats(token),
  }
  GUARDIAN.update((s) => ({ links: [link, ...(s.links || [])].slice(0, 30) }))
  change({ guestLink: link.id })
  return { ...link, url: link.stats.url }
}

export function deleteGuestLink(id) {
  GUARDIAN.update((s) => ({ links: (s.links || []).filter((l) => l.id !== id) }))
  change({ guestLinkDeleted: id })
}

export function guestLinks() {
  const now = new Date()
  return (GUARDIAN.read().links || []).map((l) => {
    const dec = decodeSnapshotToken(l.token, now)
    return { ...l, valid: dec.ok, error: dec.ok ? null : dec.error }
  })
}

/** Read a link the student handed out (or one they pasted back to check). */
export function openGuestLink(tokenOrUrl, lang = 'en') {
  const token = tokenFromUrl(tokenOrUrl) || String(tokenOrUrl || '').trim()
  const decoded = decodeSnapshotToken(token)
  if (!decoded.ok) return decoded
  const report = buildReport(decoded.snapshot, decoded.sections, lang)
  if (decoded.note) report.noteFromStudent = decoded.note
  report.studentName = decoded.studentName
  report.sharedAt = decoded.issuedAt ? new Date(decoded.issuedAt).getTime() : Date.now()
  report.expiresAt = decoded.expiresAt
  report.snapshotLink = true
  return { ...decoded, report, summaryLine: shareSummary(decoded, lang) }
}

/** Track that a guest opened a snapshot link (client-side history only). */
export function noteGuestOpen() {
  GUARDIAN.update((s) => ({
    history: [{ id: uid('gv'), at: Date.now(), channel: 'guest-link', score: null }, ...(s.history || [])].slice(0, 60),
  }))
}

// ------------------------------------------------------------------
//  sharing a report out (print / email / save)
// ------------------------------------------------------------------
export function reportText(lang = 'en') {
  const profile = loadState().profile || {}
  const report = buildGuardianReport({ lang })
  return reportToText(report, { studentName: profile.name || '', lang })
}

export function reportHtml(lang = 'en') {
  const profile = loadState().profile || {}
  const grant = GUARDIAN.read().grant
  const report = buildGuardianReport({ lang })
  return reportToHtml(report, { studentName: profile.name || '', lang, code: grant?.code || '' })
}

export function markShared(channel = 'download') {
  const report = buildGuardianReport({})
  GUARDIAN.update((s) => ({
    history: [{ id: uid('gs'), at: Date.now(), channel, score: report.score }, ...(s.history || [])].slice(0, 60),
    pendingNote: '',
  }))
  change({ shared: channel })
  return report
}

/** Weekly digest for the guardian (Sunday-evening style), three languages. */
export function weeklyForGuardian(lang = 'en') {
  const snapshot = gatherSnapshot()
  const profile = loadState().profile || {}
  const name = profile.name || 'Your student'
  const hours = Math.round((snapshot.minutesWeek / 60) * 10) / 10
  const lines = {
    en: [
      `${name}'s week in numbers`,
      `⏳ Study time: ${hours}h · 🔥 ${snapshot.studyStreak}-day streak`,
      `✅ Tasks: ${snapshot.tasksDone}/${snapshot.tasksTotal} today · ${snapshot.tasksOverdue} overdue`,
      `🌳 Trees: ${snapshot.treesGrown} grown, ${snapshot.treesLost} lost`,
      `🛡️ Distraction-free sessions: ${snapshot.cleanRate}%`,
      `🙂 Mood: ${snapshot.avgMood}/5 (${snapshot.moodTrend})`,
      '',
      'Two things that help most: asking about the day rather than the marks, and protecting sleep before an exam.',
    ],
  }[lang] || []
  void lines
  return {
    en: `${name}'s week: ${hours}h studied · ${snapshot.treesGrown} trees · momentum ${snapshot.cleanRate}% clean sessions · mood ${snapshot.avgMood}/5 (${snapshot.moodTrend}).`,
    hi: `${name} का हफ़्ता: ${hours}घं पढ़ाई · ${snapshot.treesGrown} पेड़ · ${snapshot.cleanRate}% सत्र बिना भटकाव · मूड ${snapshot.avgMood}/5 (${snapshot.moodTrend})।`,
    te: `${name} వారం: ${hours}గం చదువు · ${snapshot.treesGrown} చెట్లు · ${snapshot.cleanRate}% క్లీన్ సెషన్లు · మూడ్ ${snapshot.avgMood}/5 (${snapshot.moodTrend}).`,
  }[lang]
}

/** True when the guardian grant allows a given section (used by the view). */
export function isShared(id) {
  const grant = GUARDIAN.read().grant
  return (grant?.sections || defaultSections()).includes(id)
}

export { SECTIONS, defaultSections, normaliseCode }
export { prevMonth, nextMonth, monthKey, monthLabel, daysInMonth } from './month.js'
export { decodeSnapshotToken, encodeSnapshotToken, guestLink, tokenFromUrl } from './link.js'
