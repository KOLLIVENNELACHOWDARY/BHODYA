// ============================================================
//  Journal store — personalised entries, prompts and reviews.
//
//  The "personalised" part lives in todayContext(): every prompt,
//  summary and reminder is built from what the other features
//  actually recorded today (focus minutes, trees, escapes, tasks,
//  plan sessions, streak, exam countdown) plus your mood history.
// ============================================================

import { makeStore, uid } from '../chatbot/utils/store.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { addXp } from '../chatbot/brain/memory.js'
import {
  DEFAULT_SETTINGS, MOODS, addDays, dayKey, daysUntil, energyBy, entriesToJSON, entriesToMarkdown,
  extractTags, filterEntries, findEntry, journalStats, letterCountdown, letterStatus, letterToText,
  letterUnlockDate, lettersStats, moodBy, moodStrip, moodTrend, onThisDay,
  parseImport, personalSummary, pickPrompts, searchEntries, wordCount, promptById,
} from './logic.js'

import { FOCUS } from '../focus/store.js'
import { FOREST, forestState } from '../study-forest/store.js'
import { SHIELD, shieldState } from '../focus-shield/store.js'
import { MUSIC } from '../music/store.js'
import { TODOS, todaysList, todoStats } from '../todo-list/store.js'
import { PLAN, planStats } from '../study-schedule/store.js'
import { TIME, todayMinutes } from '../time-tracking/store.js'

export const JOURNAL = makeStore(
  'bodhya_journal_v1',
  {
    entries: [],          // newest first
    letters: [],          // 💌 sealed letters to your future self
    settings: DEFAULT_SETTINGS,
    lastPromptIds: [],    // so tomorrow's prompts differ from today's
    weeklyReviews: [],    // {id, week, at, text, stats}
    draft: null,          // {day, text, mood, ...} unsaved work
    stats: { total: 0, daysWritten: 0, longestStreak: 0 },
  },
  { changeEvent: EVT.journalChanged }
)

const change = (detail = {}) => { emit(EVT.journalChanged, detail); return detail }

// ------------------------------------------------------------------
//  personalised context — the heart of the feature
// ------------------------------------------------------------------
export function todayContext(now = new Date()) {
  const journal = JOURNAL.read().entries
  const today = dayKey(now)

  const fState = forestState(now)
  const sState = shieldState()
  const todos = todoStats(now)
  const plan = planStats(now)
  const focusMinutes = todayMinutes(now)
  const active = FOCUS.read().active

  const todaysShield = SHIELD.read().log.filter((e) => e.day === today)
  const mood7 = moodStrip(journal, 7, now).filter((d) => d.mood).map((d) => d.mood).reverse()
  const yesterday = findEntry(journal, dayKey(addDays(now, -1)))

  return {
    day: today,
    minutes: focusMinutes,
    sessions: FOCUS.read().log.filter((l) => dayKey(l.at) === today).length,
    activeSubject: active?.subject || '',
    trees: fState.stats.todayTrees,
    treesTotal: fState.stats.total,
    aliveTree: fState.alive ? fState.aliveSpecies?.name?.en : null,
    escapes: todaysShield.filter((e) => e.type === 'escape').length,
    resisted: todaysShield.filter((e) => e.type === 'resisted').length,
    scrollBreaks: todaysShield.filter((e) => e.type === 'break').length,
    cleanStreak: sState.stats.cleanStreak,
    tasksDone: todos.done,
    tasksTotal: todos.total,
    tasksOpen: todos.groups.overdue.length + todos.groups.today.length,
    planSessions: plan.today.length,
    planDone: plan.today.filter((s) => s.done).length,
    planSubjects: [...new Set(plan.today.map((s) => s.subjectName))],
    examDays: plan.countdown && !plan.countdown.isPast ? plan.countdown.days : null,
    examName: plan.exam?.name || '',
    streak: fState.stats.streak,
    musicMinutes: MUSIC.read().log
      .filter((l) => dayKey(l.at) === today)
      .reduce((a, l) => a + l.minutes, 0),
    mood7,
    wroteYesterday: !!yesterday,
    moodToday: findEntry(journal, today)?.mood ?? null,
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
  }
}

/** One-line "what happened today" strip for the UI and for chat. */
export function contextLine(ctx = todayContext(), lang = 'en') {
  const h = Math.floor(ctx.minutes / 60)
  const m = ctx.minutes % 60
  const pretty = h ? `${h}h ${m}m` : `${m}m`
  const bits = []
  if (ctx.minutes) bits.push(`⏳ ${pretty}`)
  if (ctx.sessions) bits.push(`🎯 ${ctx.sessions}×`)
  if (ctx.trees) bits.push(`🌳 ${ctx.trees}`)
  if (ctx.tasksDone) bits.push(`✅ ${ctx.tasksDone}/${ctx.tasksTotal}`)
  if (ctx.planSessions) bits.push(`📅 ${ctx.planDone}/${ctx.planSessions}`)
  if (ctx.escapes) bits.push(`🚪 ${ctx.escapes}`)
  if (ctx.resisted) bits.push(`💪 ${ctx.resisted}`)
  if (ctx.musicMinutes) bits.push(`🎵 ${ctx.musicMinutes}m`)
  if (ctx.streak) bits.push(`🔥 ${ctx.streak}`)
  if (ctx.examDays != null) bits.push(`📚 ${ctx.examDays}d`)
  const empty = { en: 'Nothing logged yet today — a blank page is fine too.', hi: 'आज अभी कुछ दर्ज नहीं — खाली पन्ना भी ठीक है।', te: 'ఈరోజు ఇంకా ఏమీ నమోదు కాలేదు — ఖాళీ పేజీ కూడా పర్వాలేదు.' }[lang]
  return bits.length ? bits.join(' · ') : empty
}

/** Personalised prompts for today (never repeating yesterday's set). */
export function promptsForToday(now = new Date()) {
  const state = JOURNAL.read()
  const ctx = todayContext(now)
  const first = pickPrompts(ctx, state.settings.lang || 'en')
  // rotate: if the top picks are the same as last time, swap in the next ones
  const last = state.lastPromptIds || []
  const sameAsLast = first.prompts.length > 0 && first.prompts.every((p) => last.includes(p.id))
  if (!sameAsLast) return first
  const ctxShifted = { ...ctx, hour: (ctx.hour + 12) % 24, minutes: ctx.minutes ? 0 : 30 }
  return pickPrompts(ctxShifted)
}

// ------------------------------------------------------------------
//  entries
// ------------------------------------------------------------------
export function startDraft(day = dayKey(), patch = {}) {
  const draft = {
    day,
    text: '',
    mood: null,
    energy: null,
    subject: '',
    win: '',
    struggle: '',
    gratitude: '',
    tomorrow: '',
    tags: [],
    promptIds: [],
    ...patch,
  }
  JOURNAL.update({ draft })
  return draft
}

export function updateDraft(patch = {}) {
  const cur = JOURNAL.read().draft || startDraft()
  const next = { ...cur, ...patch }
  if (patch.text != null) next.words = wordCount(patch.text)
  if (patch.text != null) next.tags = [...new Set([...(next.tags || []), ...extractTags(patch.text)])]
  JOURNAL.update({ draft: next })
  return next
}

export function discardDraft() {
  JOURNAL.update({ draft: null })
  change({ discarded: true })
}

/**
 * Save (or update) the entry for a day.
 * @returns {object|null} the saved entry
 */
export function saveEntry(patch = {}, { day = null, now = new Date() } = {}) {
  const state = JOURNAL.read()
  const draft = { ...(state.draft || {}), ...patch }
  const targetDay = day || draft.day || dayKey(now)
  const text = String(draft.text || '').trim()
  const hasDetail = [draft.win, draft.struggle, draft.gratitude, draft.tomorrow].some((v) => String(v || '').trim())
  if (!text && !hasDetail && !draft.mood) return null

  const existing = findEntry(state.entries, targetDay)
  const entry = {
    id: existing?.id || uid('jr'),
    day: targetDay,
    createdAt: existing?.createdAt || now.getTime(),
    updatedAt: now.getTime(),
    mood: draft.mood ?? existing?.mood ?? null,
    energy: draft.energy ?? existing?.energy ?? null,
    subject: draft.subject || '',
    text,
    win: draft.win || '',
    struggle: draft.struggle || '',
    gratitude: draft.gratitude || '',
    tomorrow: draft.tomorrow || '',
    tags: [...new Set([...(draft.tags || []), ...extractTags(text)])],
    promptIds: draft.promptIds || [],
    pinned: draft.pinned ?? existing?.pinned ?? false,
    words: wordCount(text),
    context: state.settings.autoContext ? todayContext(now) : null,
  }

  const entries = existing
    ? state.entries.map((e) => (e.id === entry.id ? entry : e))
    : [entry, ...state.entries]

  const isFirstToday = !existing
  JOURNAL.update((s) => ({
    entries,
    draft: null,
    lastPromptIds: entry.promptIds,
    stats: { ...journalStats(entries, now), total: entries.length },
  }))

  if (isFirstToday) {
    const gained = 10 + Math.min(10, Math.round(wordCount(text) / 20))
    const res = addXp(gained)
    change({ saved: entry.id, xp: gained, leveledUp: res.leveledUp })
    emit(EVT.journalWritten, { entry, xp: gained })
  } else {
    change({ saved: entry.id, edited: true })
  }
  return entry
}

export function deleteEntry(id) {
  JOURNAL.update((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  change({ deleted: id })
}

export function togglePin(id) {
  let pinned = false
  JOURNAL.update((s) => ({
    entries: s.entries.map((e) => {
      if (e.id !== id) return e
      pinned = !e.pinned
      return { ...e, pinned }
    }),
  }))
  return pinned
}

export function setMood(day, mood, now = new Date()) {
  const existing = findEntry(JOURNAL.read().entries, day)
  if (existing) {
    JOURNAL.update((s) => ({
      entries: s.entries.map((e) => (e.id === existing.id ? { ...e, mood: Number(mood), updatedAt: now.getTime() } : e)),
    }))
    change({ mood: day, value: mood })
    return JOURNAL.read().entries.find((e) => e.id === existing.id)
  }
  return saveEntry({ mood: Number(mood), text: '' }, { day, now })
}

/** Quick capture from chat: "journal: today was rough but I finished optics". */
export function quickCapture(text, { mood = null, now = new Date() } = {}) {
  const day = dayKey(now)
  const body = String(text || '').trim()
  const detected = mood ?? detectMood(body)
  const existing = findEntry(JOURNAL.read().entries, day)
  if (existing) {
    return saveEntry({
      ...existing,
      text: existing.text ? `${existing.text}\n${body}` : body,
      mood: detected ?? existing.mood,        // the newest statement wins
      tags: [...(existing.tags || []), ...extractTags(body)],
    }, { day, now })
  }
  return saveEntry({ text: body, mood: detected, tags: extractTags(body) }, { day, now })
}

/** Very light mood detection from the words the user actually used. */
export function detectMood(text = '') {
  const t = String(text).toLowerCase()
  const great = /\b(great|amazing|awesome|proud|happy|elated|fantastic|best day|शानदार|खुश|బాగుంది|సూపర్)\b/.test(t)
  const good = /\b(good|fine|okay|ok|steady|decent|productive|focused|confident|calm|अच्छा|ठीक|బాగా)\b/.test(t)
  const low = /\b(tired|tiring|exhausted|drained|drained|low|sad|upset|stressed|anxious|overwhelmed|distracted|unfocused|tough|rough day|थक|उदास|तनाव|అలసట|బాధ)\b/.test(t)
    || /(could ?n[o']?t focus|could not focus|can'?t focus|wasted (time|the day))/i.test(t)
  const rough = /\b(awful|terrible|hate|hopeless|burnt out|burned out|give up|बहुत खराब|हार|చాలా కష్టం)\b/.test(t)
  if (rough) return 1
  if (low) return 2
  if (great) return 5
  if (good) return 4
  return null
}

// ------------------------------------------------------------------
//  weekly review
// ------------------------------------------------------------------
export function weeklyReview({ now = new Date(), lang = 'en' } = {}) {
  const entries = JOURNAL.read().entries
  const weekStart = addDays(now, -6)
  const weekEntries = entries.filter((e) => e.day >= dayKey(weekStart))
  const ctx = todayContext(now)

  const stats = journalStats(weekEntries, now)
  const trend = moodTrend(entries, 14, now)
  const wins = weekEntries.map((e) => e.win).filter(Boolean).slice(0, 3)
  const struggles = weekEntries.map((e) => e.struggle).filter(Boolean).slice(0, 3)
  const tags = stats.topTags.slice(0, 3).map(([t]) => `#${t}`).join(' ')

  const title = { en: '📔 Your week in review', hi: '📔 आपके हफ़्ते की समीक्षा', te: '📔 మీ వారం సమీక్ష' }[lang]
  const lines = []
  lines.push({
    en: `You journaled ${weekEntries.length} day${weekEntries.length === 1 ? '' : 's'} this week · average mood ${stats.avgMood}/5 (${trend.direction}).`,
    hi: `इस हफ़्ते ${weekEntries.length} दिन लिखा · औसत मूड ${stats.avgMood}/5 (${trend.direction === 'up' ? 'सुधर रहा' : trend.direction === 'down' ? 'घट रहा' : 'स्थिर'})।`,
    te: `ఈ వారం ${weekEntries.length} రోజులు రాశారు · సగటు మూడ్ ${stats.avgMood}/5 (${trend.direction}).`,
  }[lang])
  if (tags) lines.push({ en: `Topics you kept coming back to: ${tags}`, hi: `बार-बार आए विषय: ${tags}`, te: `మళ్లీ మళ్లీ వచ్చిన విషయాలు: ${tags}` }[lang])
  if (wins.length) lines.push({ en: `Wins: ${wins.join(' · ')}`, hi: `जीत: ${wins.join(' · ')}`, te: `గెలుపులు: ${wins.join(' · ')}` }[lang])
  if (struggles.length) lines.push({ en: `Hard bits: ${struggles.join(' · ')}`, hi: `कठिन हिस्से: ${struggles.join(' · ')}`, te: `కష్టమైన భాగాలు: ${struggles.join(' · ')}` }[lang])
  lines.push({ en: '', hi: '', te: '' }[lang])
  lines.push(personalSummary({ journal: entries, context: ctx }, lang))

  const text = lines.filter(Boolean).join('\n')
  const review = { id: uid('wr'), week: dayKey(weekStart), at: now.getTime(), text, stats, trend }
  JOURNAL.update((s) => ({ weeklyReviews: [review, ...(s.weeklyReviews || [])].slice(0, 52) }))
  return review
}

export function pushWeeklyReview({ now = new Date(), lang = 'en' } = {}) {
  const review = weeklyReview({ now, lang })
  pushNotification({
    kind: 'journal',
    title: { en: '📔 Your week in review', hi: '📔 हफ़्ते की समीक्षा', te: '📔 వారం సమీక్ష' }[lang],
    body: review.text.slice(0, 400),
    silent: true,
    action: { feature: 'journal' },
    groupKey: `journal-week-${review.week}`,
  })
  change({ weeklyReview: review.week })
  return review
}

// prompt suggestions tuned to how the week went
export function suggestedAction() {
  const journal = JOURNAL.read().entries
  const trend = moodTrend(journal, 14)
  const ctx = todayContext()
  const recent = moodStrip(journal, 3).filter((d) => d.mood != null).map((d) => d.mood)
  const lowRun = recent.length >= 2 && recent.every((m) => m <= 2)
  if (trend.direction === 'down' || lowRun) {
    return {
      kind: 'care',
      text: {
        en: 'Mood is dipping this week. Want to try the prompt “what helped today?” — or just write three lines?',
        hi: 'इस हफ़्ते मूड गिर रहा है। “आज किसने मदद की?” वाला सवाल आज़माएँ — या बस तीन लाइन लिखिए।',
        te: 'ఈ వారం మూడ్ తగ్గుతోంది. “ఈరోజు ఏది సహాయపడింది?” అనే ప్రశ్న ప్రయత్నించండి — లేదా మూడు లైన్లు రాయండి.',
      },
    }
  }
  if (ctx.escapes >= 3) {
    return {
      kind: 'focus',
      text: {
        en: 'You escaped a lot today. Name the trigger in your journal — naming it shrinks it.',
        hi: 'आज कई बार भटके। जर्नल में कारण लिखिए — नाम लेने से वह छोटा हो जाता है।',
        te: 'ఈరోజు చాలా ఎస్కేప్‌లు. కారణాన్ని జర్నల్‌లో రాయండి — పేరుతో అది చిన్నదవుతుంది.',
      },
    }
  }
  if (ctx.minutes >= 90) {
    return {
      kind: 'celebrate',
      text: {
        en: `${Math.round(ctx.minutes)} minutes today — that is worth writing about. What worked?`,
        hi: `आज ${Math.round(ctx.minutes)} मिनट — यह लिखने लायक है। क्या काम आया?`,
        te: `ఈరోజు ${Math.round(ctx.minutes)} నిమిషాలు — ఇది రాయదగినది. ఏది పనిచేసింది?`,
      },
    }
  }
  return null
}

// ------------------------------------------------------------------
//  settings, export, import
// ------------------------------------------------------------------
export function setJournalSettings(patch = {}) {
  JOURNAL.update((s) => ({ settings: { ...s.settings, ...patch } }))
  change({ settings: true })
}

/** Move the reminder to the hour you usually write at. */
export function adoptWritingHour(now = new Date()) {
  const stats = journalStats(JOURNAL.read().entries, now)
  if (stats.bestHour == null || stats.count < 3) return null
  const time = `${String(stats.bestHour).padStart(2, '0')}:00`
  setJournalSettings({ reminderTime: time })
  return time
}

export function exportJournal(lang = 'en') {
  return entriesToMarkdown(JOURNAL.read().entries, lang)
}

export function exportJournalJSON() {
  return entriesToJSON(JOURNAL.read().entries)
}

export function importJournal(json) {
  const { entries, error } = parseImport(json)
  if (error || !entries.length) return { imported: 0, error }
  const current = JOURNAL.read().entries
  const byDay = new Map(current.map((e) => [e.day, e]))
  let imported = 0
  entries.forEach((e) => {
    if (byDay.has(e.day)) {
      const old = byDay.get(e.day)
      // keep the longer of the two versions of the same day
      if (wordCount(e.text) > wordCount(old.text)) { byDay.set(e.day, { ...old, ...e, id: old.id }); imported++ }
    } else {
      byDay.set(e.day, e)
      imported++
    }
  })
  const merged = [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1))
  JOURNAL.update((s) => ({ entries: merged, stats: journalStats(merged) }))
  change({ imported })
  return { imported }
}

export function clearJournal() {
  JOURNAL.update({ entries: [], draft: null, weeklyReviews: [] })
  change({ cleared: true })
}

// ------------------------------------------------------------------
//  💌 Letters to your future self
// ------------------------------------------------------------------
export function writeLetter({ text = '', unlockAt = null, preset = '1m', promise = '', mood = null, promptId = null } = {}, now = new Date()) {
  const body = String(text || '').trim()
  if (!body) return null
  const letter = {
    id: uid('lt'),
    text: body,
    promise: String(promise || '').trim(),
    mood: mood ?? detectMood(body),
    promptId,
    writtenAt: now.getTime(),
    unlockAt: unlockAt || letterUnlockDate(preset, now),
    status: 'sealed',
    openedAt: null,
    repliedAt: null,
    words: wordCount(body),
    context: todayContext(now),
  }
  JOURNAL.update((s) => ({ letters: [letter, ...(s.letters || [])] }))
  pushNotification({
    kind: 'journal',
    title: '💌 Letter sealed',
    body: `I will keep it shut until ${new Date(letter.unlockAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.`,
    silent: true,
    action: { feature: 'journal' },
    groupKey: `letter-sealed-${letter.id}`,
  })
  change({ letterWritten: letter.id })
  return letter
}

export function deleteLetter(id) {
  JOURNAL.update((s) => ({ letters: (s.letters || []).filter((l) => l.id !== id) }))
  change({ letterDeleted: id })
}

/** Open a letter — only allowed once its unlock day has arrived. */
export function openLetter(id, now = new Date()) {
  const letter = (JOURNAL.read().letters || []).find((l) => l.id === id)
  if (!letter) return { error: 'not-found' }
  if (letterStatus(letter, now) === 'sealed') {
    return { error: 'still-sealed', days: daysUntil(letter.unlockAt, now) }
  }
  JOURNAL.update((s) => ({
    letters: s.letters.map((l) => (l.id === id && !l.openedAt
      ? { ...l, status: 'opened', openedAt: now.getTime() }
      : l)),
  }))
  change({ letterOpened: id })
  return { letter: JOURNAL.read().letters.find((l) => l.id === id) }
}

/** Answer your past self — becomes a normal journal entry for today. */
export function replyToLetter(id, text, now = new Date()) {
  const body = String(text || '').trim()
  if (!body) return null
  const letter = (JOURNAL.read().letters || []).find((l) => l.id === id)
  if (!letter) return null
  const entry = quickCapture(
    `💌 Replying to my letter from ${new Date(letter.writtenAt).toLocaleDateString()}: ${body}`,
    { now },
  )
  JOURNAL.update((s) => ({
    letters: s.letters.map((l) => (l.id === id ? { ...l, status: 'replied', repliedAt: now.getTime() } : l)),
  }))
  change({ letterReplied: id, entry: entry?.id })
  return { entry, letter }
}

export function lettersState(now = new Date()) {
  const letters = [...(JOURNAL.read().letters || [])].sort((a, b) => (a.unlockAt < b.unlockAt ? -1 : 1))
  return {
    letters,
    stats: lettersStats(letters, now),
    sealed: letters.filter((l) => letterStatus(l, now) === 'sealed'),
    ready: letters.filter((l) => letterStatus(l, now) === 'ready'),
    opened: letters.filter((l) => ['opened', 'replied'].includes(letterStatus(l, now))),
  }
}

/** Called by the scheduler: hands back letters that just became readable. */
export function unlockedLetters(now = new Date()) {
  const letters = JOURNAL.read().letters || []
  return letters.filter((l) => letterStatus(l, now) === 'ready' && !l.notifiedAt)
}

export function markLetterNotified(id) {
  JOURNAL.update((s) => ({ letters: s.letters.map((l) => (l.id === id ? { ...l, notifiedAt: Date.now() } : l)) }))
}

/**
 * Text of a letter — but ONLY once it is unlocked.
 * A sealed letter has no readable form anywhere in the app, on purpose.
 */
export function letterText(id, lang = 'en') {
  const letter = (JOURNAL.read().letters || []).find((l) => l.id === id)
  if (!letter) return ''
  if (letterStatus(letter) === 'sealed') return ''
  return letterToText(letter, lang)
}

// ------------------------------------------------------------------
//  quick voice capture (dictated entries)
// ------------------------------------------------------------------
/**
 * Append a dictated transcript to today's draft.
 * If the write view is closed we start a draft with it instead of saving
 * straight away — dictation is messy, so the user always gets to edit first.
 */
export function appendVoiceNote(transcript, { now = new Date() } = {}) {
  const text = String(transcript || '').trim()
  if (!text) return null
  const draft = JOURNAL.read().draft
  if (draft) return updateDraft({ text: draft.text ? `${draft.text} ${text}` : text })
  return startDraft(dayKey(now), { text, tags: extractTags(text), words: wordCount(text) })
}

// ------------------------------------------------------------------
//  queries used by the UI / chat
// ------------------------------------------------------------------
export function journalState(now = new Date()) {
  const state = JOURNAL.read()
  return {
    ...state,
    letters: lettersState(now),
    stats: journalStats(state.entries, now),
    trend: moodTrend(state.entries, 14, now),
    strip: moodStrip(state.entries, 14, now),
    today: findEntry(state.entries, dayKey(now)),
    context: todayContext(now),
    prompts: promptsForToday(now),
    onThisDay: state.settings.showOnThisDay ? onThisDay(state.entries, now) : [],
    suggestion: suggestedAction(),
  }
}

export function listEntries({ filter = 'all', query = '' } = {}, now = new Date()) {
  const entries = JOURNAL.read().entries
  return searchEntries(filterEntries(entries, filter), query)
    .sort((a, b) => (a.day < b.day ? 1 : -1))
}

// (logic.js already exports these — this file only adds store-level helpers)
