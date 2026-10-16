// ============================================================
//  Bodhya scheduler — the heartbeat that turns time into nudges.
//  Runs every few seconds (NotificationsHost) and decides:
//    ⏰ ring alarms          📘 warn before a plan session
//    📌 task due reminders   🔥 streak protection
//    🌙 end-of-day rollover  📋 daily digest
//  Everything is marked "once per day / once per item" so Bodhya
//  never repeats itself and never spams.
// ============================================================

import { makeStore, clone } from '../chatbot/utils/store.js'
import { pushNotification, NOTIFS } from '../chatbot/brain/notify.js'
import { playSound } from '../chatbot/utils/sound.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { checkDueAlarms, enforceAutoStop, nextAlarm, upcomingAlarms } from '../alarms/store.js'
import { fmtTime, untilText } from '../alarms/logic.js'
import { naggingTodos, todoStats, TODOS } from '../todo-list/store.js'
import { dayKey, daysBetween } from '../todo-list/logic.js'
import { PLAN, planStats } from '../study-schedule/store.js'
import { todaySessions } from '../study-schedule/logic.js'
import { todayMinutes, studyStreak } from '../time-tracking/store.js'
import { FOCUS, finishPhase } from '../focus/store.js'
import { isFinished } from '../focus/logic.js'
import { loadState } from '../chatbot/brain/memory.js'
import { JOURNAL, contextLine, journalState, markLetterNotified, pushWeeklyReview, suggestedAction, unlockedLetters } from '../journal/store.js'
import { GUARDIAN, weeklyForGuardian } from '../guardian/store.js'
import { dayKey as journalDayKey } from '../journal/logic.js'
import { tr } from '../chatbot/i18n/features.js'

export const SCHED = makeStore('bodhya_sched_v1', {
  marks: {},                 // 'once-key' → timestamp
  lastTickAt: 0,
  lastSeenDay: null,
  settings: {
    planLeadMinutes: 10,     // warn before a plan session starts
    taskReminderTime: '19:00',
    streakNudgeTime: '20:30',
    rolloverHour: 21,
    morningReportHour: 8,
  },
})

export function setSchedulerSettings(patch = {}) {
  SCHED.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

/** Mark a "fire once" flag. Returns true the first time only. */
function once(key, now = new Date(), windowMs = 20 * 3600000) {
  const marks = SCHED.read().marks
  const last = marks[key]
  if (last && now.getTime() - last < windowMs) return false
  SCHED.update((s) => ({ marks: { ...s.marks, [key]: now.getTime() } }))
  return true
}

function currentLang() {
  try { return loadState().profile?.lang || 'en' } catch { return 'en' }
}

export function formatHM(minutes) {
  const m = Math.round(minutes || 0)
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

/** Human summary of the day — used by the digest notification and the chat. */
export function buildDigest(lang = currentLang(), now = new Date()) {
  const stats = todoStats(now)
  const plan = planStats(now)
  const focusMinutes = todayMinutes(now)
  const next = nextAlarm(now)
  const streak = studyStreak(now)
  const tomorrow = plan.week?.[1]

  const lines = []
  lines.push(tr(lang, 'todo.sectionToday') + `: ${stats.done}/${stats.total} ✅`)
  if (stats.overdue) lines.push(`${tr(lang, 'todo.overdue')}: ${stats.overdue} ⚠️`)
  lines.push(`${tr(lang, 'time.today')}: ${formatHM(focusMinutes)} ⏳`)
  if (plan.today?.length) {
    const done = plan.today.filter((s) => s.done).length
    lines.push(`${tr(lang, 'plan.today')}: ${done}/${plan.today.length} 📘`)
  }
  if (streak > 1) lines.push(`${tr(lang, 'todo.streak')}: ${streak} 🔥`)
  if (next) lines.push(`${tr(lang, 'notif.nextAlarm')}: ${fmtTime(next.alarm.time, false)} ⏰`)
  if (tomorrow?.sessions?.length) {
    lines.push(`${tr(lang, 'common.tomorrow')}: ${tomorrow.sessions.length} × ${tr(lang, 'plan.type.study')} 📅`)
  }
  return lines.join('\n')
}

/**
 * One scheduler pass. Safe to call as often as you like.
 * @returns {Array<{type:string, detail:object}>} what it did
 */
export function tick(now = new Date()) {
  const events = []
  const settings = SCHED.read().settings

  // 1) alarms ring first — nothing outranks an alarm
  const fired = checkDueAlarms(now)
  fired.forEach((a) => events.push({ type: 'alarm-fired', detail: { alarmId: a.id } }))
  enforceAutoStop(now.getTime())

  // 2) focus timer expiry (works even if the timer page is closed)
  const active = FOCUS.read().active
  if (active && isFinished(active, now.getTime())) {
    const done = finishPhase(now.getTime())
    events.push({ type: 'focus-finished', detail: { block: done } })
  }

  // 3) bring back snoozed notifications
  const snoozed = NOTIFS.read().items.filter(
    (n) => n.snoozedUntil && n.snoozedUntil <= now.getTime() && !n.revivedAt
  )
  snoozed.forEach((n) => {
    NOTIFS.update((s) => ({
      items: s.items.map((x) => (x.id === n.id ? { ...x, snoozedUntil: null, read: false, createdAt: Date.now(), revivedAt: Date.now() } : x)),
    }))
    emit(EVT.toast, { item: { ...n, createdAt: Date.now() }, quiet: false })
    const s2 = NOTIFS.read().settings
    if (s2.sound) playSound(s2.soundName, s2.volume)
    events.push({ type: 'snooze-revived', detail: { id: n.id } })
  })

  // 4) warn before a study-plan session
  const lead = Number(settings.planLeadMinutes) || 10
  for (const session of todaySessions(clone(PLAN.read()).sessions, now)) {
    if (session.done) continue
    const [h, m] = String(session.startTime).split(':').map(Number)
    const start = new Date(now); start.setHours(h || 0, m || 0, 0, 0)
    const diffMin = (start.getTime() - now.getTime()) / 60000
    if (diffMin > 0 && diffMin <= lead && once(`plan-lead-${session.id}-${dayKey(now)}`, now, 3 * 3600000)) {
      pushNotification({
        kind: 'plan',
        title: `📘 ${session.subjectName} in ${Math.round(diffMin)} min`,
        body: `${session.startTime} · ${session.minutes} min${session.topic ? ` · ${session.topic}` : ''}. Open the focus timer when you're ready!`,
        action: { feature: 'focus', payload: { subject: session.subjectName, minutes: session.minutes, sessionId: session.id } },
        meta: { sessionId: session.id },
      })
      events.push({ type: 'plan-lead', detail: { id: session.id } })
    }
  }

  // 5) to-do due-time reminders (tasks with a time but no linked alarm)
  const todos = TODOS.read().items.filter((t) => !t.done && t.due && t.dueTime)
  for (const t of todos) {
    const dueToday = t.due === dayKey(now)
    if (!dueToday) continue
    const [h, m] = t.dueTime.split(':').map(Number)
    const at = new Date(now); at.setHours(h || 0, m || 0, 0, 0)
    const diffMin = (at.getTime() - now.getTime()) / 60000
    if (diffMin > 0 && diffMin <= Math.max(5, lead) && !t.reminderAlarmId
      && once(`todo-due-${t.id}-${dayKey(now)}`, now, 12 * 3600000)) {
      pushNotification({
        kind: 'task',
        title: `📌 Due in ${Math.round(diffMin)} min: ${t.title}`,
        body: t.subject ? `${t.subject} · due ${t.dueTime}` : `due ${t.dueTime}`,
        action: { feature: 'todo', payload: { focus: t.id } },
        meta: { todoId: t.id },
      })
      events.push({ type: 'todo-due', detail: { id: t.id } })
    }
  }

  // 6) overdue tasks — one reminder per day, late morning
  const nag = naggingTodos(now)
  if (nag.overdue.length && now.getHours() >= 10 && once(`todo-overdue-${dayKey(now)}`, now)) {
    pushNotification({
      kind: 'task',
      title: nag.overdue.length === 1
        ? `⚠️ 1 task is overdue: ${nag.overdue[0].title}`
        : `⚠️ ${nag.overdue.length} tasks are overdue`,
      body: 'Want to move them to today, or push them to tomorrow?',
      action: { feature: 'todo' },
    })
    events.push({ type: 'todo-overdue', detail: { n: nag.overdue.length } })
  }

  // 7) evening task check-in
  const taskTime = settings.taskReminderTime || '19:00'
  const [th, tm] = String(taskTime).split(':').map(Number)
  const afterTaskTime = now.getHours() * 60 + now.getMinutes() >= (th || 19) * 60 + (tm || 0)
  if (afterTaskTime && once(`task-evening-${dayKey(now)}`, now)) {
    const stats = todoStats(now)
    const left = stats.groups.today.filter((t) => !t.done).length
    if (left > 0) {
      pushNotification({
        kind: 'task',
        title: `🌆 ${left} task${left > 1 ? 's' : ''} still open today`,
        body: 'Tick them off now so tomorrow starts clean?',
        action: { feature: 'todo' },
      })
      events.push({ type: 'task-evening', detail: { left } })
    }
  }

  // 8) streak protection
  const streakTime = settings.streakNudgeTime || '20:30'
  const [sh, sm] = String(streakTime).split(':').map(Number)
  const afterStreakTime = now.getHours() * 60 + now.getMinutes() >= (sh || 20) * 60 + (sm || 30)
  if (afterStreakTime && todayMinutes(now) === 0 && once(`streak-${dayKey(now)}`, now)) {
    const streak = studyStreak(now)
    pushNotification({
      kind: 'streak',
      title: streak > 0 ? `🔥 Your ${streak}-day streak is at risk!` : '💛 No study time logged today',
      body: 'Even 10 focused minutes counts. Want to start a quick block?',
      action: { feature: 'focus', payload: { minutes: 10, autostart: false } },
    })
    events.push({ type: 'streak-nudge', detail: { streak } })
  }

  // 9) end-of-day rollover for unfinished plan sessions
  const rollover = Number(settings.rolloverHour) || 21
  if (now.getHours() >= rollover && once(`rollover-${dayKey(now)}`, now)) {
    const sessions = todaySessions(clone(PLAN.read()).sessions, now)
    const open = sessions.filter((s) => !s.done)
    if (open.length) {
      pushNotification({
        kind: 'plan',
        title: `🌙 ${open.length} session${open.length > 1 ? 's' : ''} unfinished in today's plan`,
        body: 'Open the study plan — one tap moves them to tomorrow and keeps your plan realistic.',
        action: { feature: 'planner' },
      })
      events.push({ type: 'rollover', detail: { open: open.length } })
    }
  }

  // 10) morning report: what is waiting today
  if (now.getHours() >= (settings.morningReportHour || 8) && now.getHours() < 12
    && once(`morning-${dayKey(now)}`, now)) {
    const stats = todoStats(now)
    const next = nextAlarm(now)
    const parts = []
    if (stats.groups.today.length) parts.push(`${stats.groups.today.length} task${stats.groups.today.length > 1 ? 's' : ''}`)
    const sessions = todaySessions(clone(PLAN.read()).sessions, now)
    if (sessions.length) parts.push(`${sessions.length} study session${sessions.length > 1 ? 's' : ''}`)
    if (next) parts.push(`next alarm ${fmtTime(next.alarm.time, false)} (${untilText(next.at - now)})`)
    if (parts.length) {
      pushNotification({
        kind: 'digest',
        title: '☀️ Good morning — here is today',
        body: parts.join(' · '),
        action: { feature: 'notifications' },
      })
      events.push({ type: 'morning', detail: { parts } })
    }
  }

  // 11) daily digest
  const s2 = NOTIFS.read().settings
  if (s2.digest?.enabled) {
    const [dh, dm] = String(s2.digest.time || '20:00').split(':').map(Number)
    const afterDigest = now.getHours() * 60 + now.getMinutes() >= (dh || 20) * 60 + (dm || 0)
    const digestKey = `digest-${dayKey(now)}`
    if (afterDigest && NOTIFS.read().lastDigestKey !== digestKey) {
      NOTIFS.update({ lastDigestKey: digestKey })
      pushNotification({
        kind: 'digest',
        title: '📋 Your day with Bodhya',
        body: buildDigest(currentLang(), now),
        action: { feature: 'notifications' },
        groupKey: digestKey,
      })
      events.push({ type: 'digest', detail: {} })
    }
  }

  // 11b) journal: evening nudge (personalised reminder hour) + weekly review
  const jSettings = JOURNAL.read().settings
  if (jSettings.reminderEnabled) {
    const [jh, jm] = String(jSettings.reminderTime || '21:30').split(':').map(Number)
    const afterJournalTime = now.getHours() * 60 + now.getMinutes() >= (jh || 21) * 60 + (jm || 30)
    const wroteToday = JOURNAL.read().entries.some((e) => e.day === journalDayKey(now))
    if (afterJournalTime && !wroteToday && once(`journal-${journalDayKey(now)}`, now)) {
      const jState = journalState(now)
      const prompt = jState.prompts.prompts[0]
      pushNotification({
        kind: 'journal',
        title: '📔 One line about today?',
        body: prompt
          ? `${prompt.q[loadState().profile?.lang || 'en'] || prompt.q.en}\n${contextLine(jState.context, loadState().profile?.lang || 'en')}`
          : contextLine(jState.context, loadState().profile?.lang || 'en'),
        silent: true,
        action: { feature: 'journal' },
        meta: { promptId: prompt?.id || null },
      })
      events.push({ type: 'journal-nudge', detail: { streak: jState.stats.streak } })
    }
  }

  if (jSettings.weeklyReview) {
    const isReviewDay = now.getDay() === (jSettings.weeklyReviewDay ?? 0)
    const afterEvening = now.getHours() >= 19
    const key = `journal-week-${journalDayKey(now)}`
    if (isReviewDay && afterEvening && once(key, now) && JOURNAL.read().entries.length >= 2) {
      pushWeeklyReview({ now, lang: currentLang() })
      events.push({ type: 'journal-weekly', detail: {} })
    }
  }

  // a gentle, data-driven journal nudge (mood dipping / many escapes / a great day)
  if (now.getHours() >= 17 && once(`journal-hint-${journalDayKey(now)}`, now)) {
    const hint = suggestedAction()
    if (hint) {
      pushNotification({
        kind: 'journal',
        title: hint.kind === 'celebrate' ? '📔 Worth writing down' : '📔 A nudge for your journal',
        body: hint.text[loadState().profile?.lang || 'en'] || hint.text.en,
        silent: true,
        action: { feature: 'journal' },
      })
      events.push({ type: 'journal-hint', detail: { kind: hint.kind } })
    }
  }

  // 11c) letters that just became readable
  const ready = unlockedLetters(now)
  ready.forEach((letter) => {
    markLetterNotified(letter.id)
    pushNotification({
      kind: 'journal',
      title: '💌 A letter from past you is ready',
      body: `You sealed it on ${new Date(letter.writtenAt).toLocaleDateString()} and it opens today. ${letter.words} words are waiting.`,
      action: { feature: 'journal', payload: { tab: 'letters' } },
      meta: { letterId: letter.id },
      groupKey: `letter-open-${letter.id}`,
    })
    emit(EVT.letterReady, { letter })
  })
  if (ready.length) events.push({ type: 'letter-ready', detail: { count: ready.length } })

  // 11d) weekly guardian digest the student can forward (Sunday evening)
  const gSettings = GUARDIAN.read().settings
  if (gSettings.weeklyReport && GUARDIAN.read().grant?.active && now.getDay() === 0 && now.getHours() >= 19
    && once(`guardian-week-${journalDayKey(now)}`, now)) {
    pushNotification({
      kind: 'system',
      title: '👨‍👩‍👧 Weekly summary ready to forward',
      body: weeklyForGuardian(currentLang()),
      silent: true,
      action: { feature: 'guardian' },
    })
    events.push({ type: 'guardian-weekly', detail: {} })
  }

  // 12) yesterday's leftovers
  if (now.getHours() >= 6 && once(`leftover-${dayKey(now)}`, now)) {
    const stale = TODOS.read().items.filter((t) => !t.done && t.due && daysBetween(dayKey(now), t.due) < -1)
    if (stale.length >= 3) {
      pushNotification({
        kind: 'task',
        title: `🧹 ${stale.length} older tasks are piling up`,
        body: 'Let us tidy: keep the important ones, drop the rest.',
        action: { feature: 'todo' },
      })
      events.push({ type: 'leftover', detail: { n: stale.length } })
    }
  }

  SCHED.update({ lastTickAt: now.getTime() })
  return events
}

/** What is coming next (used by the Notifications ▸ Upcoming tab). */
export function upcomingSummary(now = new Date()) {
  const stats = todoStats(now)
  return {
    alarms: upcomingAlarms(now, 4),
    sessions: todaySessions(clone(PLAN.read()).sessions, now).filter((s) => !s.done).slice(0, 5),
    todos: [...stats.groups.overdue, ...stats.groups.today, ...stats.groups.tomorrow].slice(0, 6),
    focus: FOCUS.read().active,
  }
}
