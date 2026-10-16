// ---------- Bodhya chat engine: intent scoring + actions (no APIs, no topic tutoring) ----------
//  Beyond navigation the engine can now *do* things the moment you ask:
//  create alarms & reminders, file to-dos, tick them off, generate a study
//  plan, start a focus block, and report on notifications / study time.

import { INTENTS, FALLBACK_ID } from './intents.js'
import { buildReply } from './responses.js'
import { detectLangOf } from '../i18n/ui.js'
import { tr } from '../i18n/features.js'
import { addTask, loadState, updateMemory } from './memory.js'
import {
  dayKeyOf, parseReminderSentence, nextDateForWeekday, parseWeekday, parseRepeat, parseWhen,
  stripTimeWords, toHHMM, parseDuration as parseDur,
} from './timeparse.js'
import { addAlarm, dismissAlarm, upcomingAlarms, ALARMS } from '../../alarms/store.js'
import {
  addTodo, applyPack, applySuggestions, chapterImport, completeByTitle, createTasksFromPlan,
  suggestionsFor, todaysList, TODOS,
} from '../../todo-list/store.js'
import { TASK_PACKS } from '../../todo-list/logic.js'
import { dayKey as todoDayKey } from '../../todo-list/logic.js'
import {
  PLAN, addSubject, generateMyPlan, moveSeries, moveSessionChecked, setSessionRecurrence,
} from '../../study-schedule/store.js'
import {
  WEEKDAY_SHORT, addDays, dayKey as planDayKey, parseDayKey, todaySessions, weekdaysInText,
} from '../../study-schedule/logic.js'
import { FOCUS, startFocus } from '../../focus/store.js'
import { startForSession } from '../../music/store.js'
import { linkFocus } from '../../study-forest/store.js'
import { NOTIFS, unreadCount } from './notify.js'
import { todayMinutes, studyStreak, goalProgress } from '../../time-tracking/store.js'
import { MUSIC, playPreset, stopMusic, applyLayers } from '../../music/store.js'
import { AMBIENT_TYPES, BEAT_BANDS } from '../../music/logic.js'
import { FOREST, plantTree, forestState } from '../../study-forest/store.js'
import { SPECIES } from '../../study-forest/logic.js'
import { SHIELD, addSite, startUrge, shieldState } from '../../focus-shield/store.js'
import { SITE_PACKS, URGE_TOTAL_SECONDS, normalizeSite } from '../../focus-shield/logic.js'
import { JOURNAL, journalState, lettersState, promptsForToday, quickCapture, saveEntry, writeLetter } from '../../journal/store.js'
import { GUARDIAN, createGrant, gatherSnapshot } from '../../guardian/store.js'
import { SECTIONS } from '../../guardian/logic.js'
import { promptLine, personalSummary, journalStats } from '../../journal/logic.js'

// Who is this user? Derive tone from age group + preference
export function resolveTone(profile) {
  if (profile.tone && profile.tone !== 'auto') return profile.tone
  return { kid: 'kid', teen: 'teen', college: 'college', pro: 'pro' }[profile.ageGroup] || 'teen'
}

// Keep letters AND combining marks (\p{M}) so Devanagari/Telugu text survives
function clean(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function scoreIntent(intent, cleaned, langSet) {
  const pat = intent[langSet] || intent.en
  if (!pat) return 0
  let score = 0
  if (pat.re) for (const re of pat.re) if (re.test(cleaned)) score += 3
  if (pat.kw) for (const kw of pat.kw) if (cleaned.includes(kw)) score += 1
  return score
}

const PLANNER_DUR_RE = {
  en: /(\d+)\s*(minutes|mins|minute|min|hours|hour|hr)/i,
  hi: /(\d+)\s*(मिनट|घंटे|घंटा)/,
  te: /(\d+)\s*(నిమిషాలు|నిమిషం|గంటలు|గంట)/
}
const PLANNER_VERB_RE = {
  en: /\b(add|set|schedule|plan for|remind me|put)\b/gi,
  hi: /(जोड़ो|जोड़ दो|रख दो|शेड्यूल करो|प्लान करो)/g,
  te: /(జోడించు|పెట్టు|షెడ్యూల్ చేయి|ప్లాన్ చేయి)/g
}

const PLACEHOLDER = {
  en: 'Study reminder', hi: 'पढ़ाई का रिमाइंडर', te: 'స్టడీ రిమైండర్',
}
const DONE_WORDS = [
  /\b(i|have|has|had|am|is|was|done|finished|completed|complete|with|as|mark|marked|tick|off|my|the|a|an|it|task|todo|to[- ]?do)\b/gi,
  /(मैंने|मेरा|मेरी|पूरा|पूरी|हो|गया|गई|कर|लिया|खत्म|टिक|काम|टास्क|डन)/g,
  /(నేను|నా|పూర్తి|పూర్తయింది|అయిపోయింది|చేశాను|టిక్|పని|టాస్క్)/g,
]

function stripDoneWords(text) {
  let s = String(text || '')
  DONE_WORDS.forEach((re) => { s = s.replace(re, ' ') })
  return s.replace(/\s+/g, ' ').trim()
}

/** "important" → high, "later/someday" → low, else medium. */
function guessPriority(text) {
  const t = String(text || '')
  if (/\b(urgent|important|asap|today|first)\b|ज़रूरी|तुरंत|अहम|అత్యవసర|ముఖ్య/i.test(t)) return 'high'
  if (/\b(later|someday|no rush|whenever)\b|बाद में|कभी|తర్వాత|ఎప్పుడో/i.test(t)) return 'low'
  return 'med'
}

/** Subjects out of "plan for physics and maths" / "गणित और विज्ञान का". */
const SUBJECT_STOP = new Set([
  'study', 'plan', 'studyplan', 'timetable', 'schedule', 'for', 'and', 'a', 'the', 'my',
  'day', 'days', 'week', 'weeks', 'hour', 'hours', 'hr', 'hrs', 'minute', 'minutes', 'min', 'per',
  'पढ़ाई', 'अध्ययन', 'का', 'की', 'के', 'और', 'लिए', 'से', 'दिन', 'हफ्ते', 'हफ़्ते', 'घंटे', 'मिनट', 'रोज़',
  'చదువు', 'ప్లాన్', 'టైమ్', 'టేబుల్', 'కి', 'కోసం', 'మరియు', 'రోజులు', 'వారం', 'గంటలు', 'నిమిషాలు', 'రోజుకు',
])
function parseSubjects(text) {
  const cleaned = String(text || '')
    .replace(/[?!.,;:()[\]{}]/g, ' ')
    .replace(/\d+(\.\d+)?\s*(hours?|hrs?|minutes?|mins?|घंटे|घंटा|मिनट|గంటలు|గంట|నిమిషాలు|నిమిషం)/gi, ' ')
    .replace(/\b\d+\s*(day|days|week|weeks|month|months)\b/gi, ' ')
    .replace(/(\d+)\s*(दिन|हफ्ते|हफ़्ते|सप्ताह|महीने|రోజుల|వారం|నెల)/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(study|plan|timetable|schedule|routine|make|create|build|prepare|give|me|my|for|day|days|week|weeks|a|an|the|per|every)\b/gi, ' ')
    .replace(/\b(स्टडी|प्लान|टाइमटेबल|रूटीन|बनाओ|बनाइए|चाहिए|दिन|हफ्ते|हफ़्ते|का|की|के|लिए|मेरा|मेरी)\b/g, ' ')
    .replace(/(స్టడీ|ప్లాన్|టైమ్|టేబుల్|షెడ్యూల్|చేయి|చేయండి|కావాలి|రోజుల|వారం|కి|కోసం)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = cleaned
    .split(/,|&|\band\b|और|మరియు|\/|·/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !SUBJECT_STOP.has(s.toLowerCase()))
  return [...new Set(parts)].slice(0, 5)
}

/** Horizon in days: "7 day plan" / "एक हफ्ते" / "10 రోజుల". */
function parseHorizon(text) {
  const t = String(text || '')
  const m = /(\d+)\s*(day|days|दिन|రోజుల|రోజుల్లో)/i.exec(t)
  if (m) return Math.max(1, Math.min(42, Number(m[1])))
  if (/\bweek|हफ्ते|हफ़्ते|सप्ताह|వారం|వారాల/i.test(t)) return 7
  if (/\bmonth|महीने|महीना|నెల/i.test(t)) return 30
  return null
}

export function think(rawText, extra = {}) {
  const state = loadState()
  const { profile, memory } = state
  const langDetected = detectLangOf(rawText)
  // If user typed in another supported language, chat back in it (adaptive!)
  const lang = langDetected !== 'en' ? langDetected : (profile.lang || 'en')
  const tone = resolveTone(profile)
  const name = profile.name || (lang === 'hi' ? 'दोस्त' : lang === 'te' ? 'స్నేహితుడా' : 'friend')
  const context = extra.context || 'home'
  const now = new Date()

  const cleaned = clean(rawText)
  // fresh session view per turn: a stale lastAlarm/lastTodo must never be
  // reported back as if it happened just now
  const session = {
    ...state.session,
    lastAlarm: null, alarms: null, stoppedAlarm: false,
    musicStarted: null, musicStopped: null,
    plantedTree: null, forest: null,
    blocked: null, blocklist: null, shieldStats: null, urge: null,
    journalSaved: null, journalPrompts: null, journalSummary: null,
    todoSuggestions: null, packApplied: null, planToTasks: null,
    chapterTasks: null, repeatSet: null, movedSession: null,
    letterSealed: null, letters: null, guardian: null,
    lastTodo: null, todoSummary: null, doneTodo: null,
    planMeta: null, planToday: null, subjects: null,
    focus: null, notifSummary: null, timeSummary: null, today: null,
  }
  const chatState = { lang, tone, name, context, memory, tasks: state.tasks, profile, session }

  // --- Intent scoring (priority breaks ties toward specific intents) ---
  let best = { id: FALLBACK_ID, score: 0 }
  for (const intent of INTENTS) {
    const s = scoreIntent(intent, cleaned, lang)
    const total = s > 0 ? s + intent.pri : 0
    if (total > best.score) best = { id: intent.id, score: total }
  }

  let intentId = best.score >= 1.3 ? best.id : FALLBACK_ID

  // Fast path: a journal/diary entry is written like "journal: …" and the
  // cleaner strips the colon, so match the raw text before scoring.
  if (/^\s*(dear\s+)?(journal|diary)\s*[:\-—]\s*\S/i.test(rawText)
      || /^\s*(जर्नल|डायरी)\s*[:\-—]\s*\S/.test(rawText)
      || /^\s*(జర్నల్|డైరీ)\s*[:\-—]\s*\S/.test(rawText)) {
    intentId = 'journal_add'
  }

  // ------------------------------------------------------------------
  // 1) Alarms & reminders — "remind me to study maths at 7:30 am"
  // ------------------------------------------------------------------
  if (intentId === 'alarm_add') {
    const parsed = parseReminderSentence(rawText, { now })
    let when = parsed.when
    // "remind me in 20 minutes to drink water" → duration doubles as the delay
    if (!when && parsed.duration) {
      const at = new Date(now.getTime() + parsed.duration * 60000)
      when = { minutes: at.getHours() * 60 + at.getMinutes(), explicit: true, relativeMinutes: parsed.duration, dayOffset: 0 }
    }
    if (when) {
      let day = null
      if (parsed.weekday != null) {
        day = nextDateForWeekday(parsed.weekday, now)
      } else if (when.dayOffset === 1) {
        day = dayKeyOf(addDays(now, 1))
      } else if (when.relativeMinutes) {
        const at = new Date(now.getTime() + when.relativeMinutes * 60000)
        day = dayKeyOf(at)
      }
      const label = parsed.label
        || stripTimeWords(rawText)
        || PLACEHOLDER[lang]
      const alarm = addAlarm({
        label: label.slice(0, 60),
        time: toHHMM(when.minutes),
        days: parsed.weekday != null ? [] : parsed.repeat.days,
        sound: 'bell',
        volume: 0.8,
        snoozeMinutes: 10,
        note: day && day !== dayKeyOf(now) ? day : '',
        linked: null,
      })
      state.session.lastAlarm = { label: alarm.label, time: alarm.time, days: alarm.days }
      chatState.session.lastAlarm = state.session.lastAlarm
      updateMemory({ chatCount: memory.chatCount + 1 })
      const reply = buildReply(intentId, chatState)
      return { ...reply, lang }
    }
    // no time in the sentence → the reply asks for one
    updateMemory({ chatCount: memory.chatCount + 1 })
    const reply = buildReply(intentId, chatState)
    return { ...reply, lang }
  }

  // ------------------------------------------------------------------
  // 2) Stop a ringing alarm
  // ------------------------------------------------------------------
  if (intentId === 'alarm_stop') {
    const ringing = ALARMS.read().ringing
    if (ringing) {
      dismissAlarm(ringing.alarmId, { reason: 'stopped-by-chat' })
      state.session.stoppedAlarm = true
      chatState.session.stoppedAlarm = true
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 3) Show alarms
  // ------------------------------------------------------------------
  if (intentId === 'alarm_show') {
    chatState.session.alarms = upcomingAlarms(now, 5).map(({ alarm }) => ({
      label: alarm.label, time: alarm.time, days: alarm.days,
    }))
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 4) Add a to-do
  // ------------------------------------------------------------------
  if (intentId === 'todo_add') {
    const parsed = parseReminderSentence(rawText, { now })
    const title = (parsed.label || stripTimeWords(rawText)).replace(/^(and|to|for|:)\s+/i, '').trim()
    if (title) {
      let due = dayKeyOf(now)
      if (parsed.weekday != null) due = nextDateForWeekday(parsed.weekday, now)
      else if (parsed.when?.dayOffset === 1) due = dayKeyOf(addDays(now, 1))
      const dueTime = parsed.when ? toHHMM(parsed.when.minutes) : null
      const todo = addTodo({
        title: title.slice(0, 90),
        due: parsed.when || parsed.weekday != null ? due : null,
        dueTime,
        minutes: parsed.duration,
        priority: guessPriority(rawText),
        category: /homework|assignment|होमवर्क|హోంవర్క్/i.test(rawText) ? 'homework' : 'study',
        source: 'chat',
      })
      state.session.lastTodo = { title: todo.title, due: todo.due, dueTime: todo.dueTime }
      chatState.session.lastTodo = state.session.lastTodo
      chatState.session.today = todoDayKey(now)
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 5) Show the to-do list
  // ------------------------------------------------------------------
  if (intentId === 'todo_show') {
    const { overdue, today: dueToday, undated } = todaysList(now)
    const open = TODOS.read().items.filter((t) => !t.done)
    chatState.session.todoSummary = {
      overdue, today: [...dueToday, ...undated].slice(0, 6), open: open.length,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 6) Mark a to-do done — "done with physics homework"
  // ------------------------------------------------------------------
  if (intentId === 'todo_done') {
    const guess = stripDoneWords(stripTimeWords(rawText))
    const res = guess ? completeByTitle(guess) : null
    if (res) {
      const left = TODOS.read().items.filter((t) => !t.done && t.due === todoDayKey(now)).length
      chatState.session.doneTodo = {
        title: res.todo.title,
        xp: res.result?.xpGained || 0,
        leveledUp: !!res.result?.leveledUp,
        left,
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 7) Generate a study plan — "make a 7 day plan for physics and maths"
  // ------------------------------------------------------------------
  if (intentId === 'studyplan_generate') {
    const names = parseSubjects(rawText)
    const horizon = parseHorizon(rawText) || 7
    const perDay = /(a|per|प्रति|रोज़|రోజుకు|रोज)/i.test(rawText) ? parseDur(rawText) : null
    names.forEach((n) => {
      const exists = PLAN.read().subjects.some((s) => s.name.toLowerCase() === n.toLowerCase())
      if (!exists) addSubject({ name: n, targetHours: 5 })
    })
    if (PLAN.read().subjects.length) {
      const result = generateMyPlan({
        days: PLAN.read().exam?.date ? undefined : horizon,
        dailyMinutes: perDay || PLAN.read().settings.dailyMinutes,
      })
      chatState.session.planMeta = result.meta
      chatState.session.subjects = PLAN.read().subjects.map((s) => s.name)
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 8) Today's plan
  // ------------------------------------------------------------------
  if (intentId === 'studyplan_show') {
    const sessions = todaySessions(PLAN.read().sessions, now)
    chatState.session.planToday = sessions.slice(0, 6).map((s) => ({
      startTime: s.startTime, subjectName: s.subjectName, minutes: s.minutes, topic: s.topic, done: s.done,
    }))
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 9) Start a focus block — "start a 25 minute focus on chemistry"
  // ------------------------------------------------------------------
  if (intentId === 'focus_start') {
    const minutes = parseDur(rawText) || 25
    const subject = stripTimeWords(
      rawText
        .replace(/\b(start|begin|do|run|a|an|the|on|for|of|timer|focus|pomodoro|session)\b/gi, ' ')
        .replace(/(फोकस|पोमोडोरो|टाइमर|शुरू|चालू|लगाओ|पर|का|की)/g, ' ')
        .replace(/(ఫోకస్|పొమొడోరో|టైమర్|మొదలు|పెట్టు|పై|కి)/g, ' ')
    ).slice(0, 40)
    const block = startFocus({ minutes, subject })
    chatState.session.focus = { minutes: block?.minutes || minutes, subject }
    updateMemory({ chatCount: memory.chatCount + 1 })
    const reply = buildReply(intentId, chatState)
    return {
      ...reply,
      lang,
      openWith: { feature: 'focus', payload: { autostart: false } },
    }
  }

  // ------------------------------------------------------------------
  // 10) Notifications summary
  // ------------------------------------------------------------------
  if (intentId === 'notif_show') {
    const nState = NOTIFS.read()
    chatState.session.notifSummary = {
      unread: unreadCount(nState),
      recent: (nState.items || []).slice(0, 4).map((n) => ({ title: n.title })),
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 11) Study time summary
  // ------------------------------------------------------------------
  if (intentId === 'time_show') {
    chatState.session.timeSummary = {
      today: todayMinutes(now),
      streak: studyStreak(now),
      goalPct: goalProgress(now).pct,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 9b) Creation paths: suggestions, packs, plan → to-dos
  // ------------------------------------------------------------------
  if (intentId === 'todo_suggest') {
    chatState.session.todoSuggestions = suggestionsFor(lang, now)
      .map((x) => ({ title: x.title, why: x.why, minutes: x.minutes || 25 }))
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'todo' } }
  }

  if (intentId === 'todo_pack') {
    const t = String(rawText).toLowerCase()
    const found = TASK_PACKS.find((p) => {
      const label = (p.labelKeyLabel || '').toLowerCase()
      const names = [p.id.toLowerCase(), label]
      const keyWords = p.id === 'examWeek' ? ['exam week', 'परीक्षा सप्ताह', 'పరీక్ష వారం']
        : p.id === 'daily' ? ['daily basics', 'रोज़ की बुनियाद', 'రోజువారీ']
          : p.id === 'revisionCycle' ? ['revision cycle', 'रिवीज़न चक्र', 'రివిజన్ సైకిల్']
            : p.id === 'chapter' ? ['chapter', 'अध्याय', 'చాప్టర్']
              : ['weekend', 'सप्ताहांत', 'వారాంత']
      return names.concat(keyWords).some((n) => n && (t.includes(n) || cleaned.includes(n)))
    })
    if (found) {
      const res = applyPack(found.id, now)
      chatState.session.packApplied = {
        id: found.id,
        label: tr(lang, found.labelKey),
        added: res.added.length,
        skipped: res.skipped.length,
        titles: res.added.slice(0, 6).map((x) => x.title),
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'todo' } }
  }

  if (intentId === 'plan_to_tasks') {
    const added = createTasksFromPlan(dayKeyOf(now), now)
    chatState.session.planToTasks = added.map((x) => x.title)
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'todo' } }
  }

  // ------------------------------------------------------------------
  // 9c) Chapter → tasks, repeating sessions, moving a session
  // ------------------------------------------------------------------
  if (intentId === 'chapter_tasks') {
    // Everything after the trigger phrase is the chapter the student pasted.
    const cut = String(rawText)
      .replace(/^[\s\S]*?\b(?:from|out of|of)\b\s*(?:this|the|my)?\s*(?:chapter|notes|syllabus|text)\b\s*[:\-–]?\s*/i, '')
      .replace(/^\s*(?:make|turn|convert|create|break)\b[\s\S]*?\b(?:tasks?|to-?dos?|checklist)\b\s*[:\-–]?\s*/i, '')
    const isTriggerOnly = cut.trim().length < 40 || cut.trim() === String(rawText).trim()
    if (!isTriggerOnly) {
      const subject = PLAN.read().subjects[0]?.name || ''
      const res = chapterImport(cut, { lang, subject, now })
      chatState.session.chapterTasks = {
        found: res.added.length,
        titles: res.added.slice(0, 6).map((x) => x.title),
        lines: res.scan.lines,
        subject: res.subject,
        topics: res.scan.headings.length,
        terms: res.scan.terms.length,
        exercises: res.scan.exercises.length,
        skipped: res.skipped.length,
      }
    } else {
      chatState.session.chapterTasks = null
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'todo' } }
  }

  if (intentId === 'plan_repeat') {
    const text = String(rawText)
    let days = weekdaysInText(text)
    if (!days.length) {
      const rep = parseRepeat(text)
      if (rep?.days?.length) days = rep.days
    }
    const wanted = parseWhen(text, { now })
    const hhmm = wanted ? toHHMM(wanted.minutes) : null
    const sessions = PLAN.read().sessions.filter((s) => !s.done)
    const target = (hhmm && sessions.find((s) => s.startTime === hhmm))
      || sessions.find((s) => s.day === dayKeyOf(now))
      || sessions[0]
    if (!target) {
      chatState.session.repeatSet = { error: 'no-session' }
    } else {
      if (!days.length) days = [parseDayKey(target.day).getDay()]
      // "until the exam" / "until 2026-11-30"
      const explicit = text.match(/\d{4}-\d{2}-\d{2}/)
      const examish = /\b(exam|test|परीक्षा|టెస్ట్|పరీక్ష)\b/i.test(text)
      const until = explicit ? explicit[0] : examish ? (PLAN.read().exam?.date || null) : null
      const res = setSessionRecurrence(target.id, { days, until })
      chatState.session.repeatSet = {
        subject: target.subjectName,
        time: target.startTime,
        days: days.map((d) => (WEEKDAY_SHORT[lang] || WEEKDAY_SHORT.en)[d]).join(', '),
        created: res.created,
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'planner' } }
  }

  if (intentId === 'plan_move') {
    const text = String(rawText)
    const all = PLAN.read().sessions
    const wanted = parseWhen(text, { now })
    const hhmm = wanted ? toHHMM(wanted.minutes) : null
    const pickFrom = (list) => (hhmm && list.find((s) => s.startTime === hhmm))
      || list.find((s) => s.day === dayKeyOf(now))
      || list[0]
    // prefer something still open, but name the finished session if that is
    // what they pointed at — "it is already done" beats "which session?".
    const session = pickFrom(all.filter((s) => !s.done)) || pickFrom(all)
    if (!session) {
      chatState.session.movedSession = null
    } else {
      const dayOffset = wanted?.dayOffset || 0
      const day = dayOffset
        ? dayKeyOf(addDays(parseDayKey(session.day), dayOffset))
        : session.day
      const time = hhmm || session.startTime
      const wholeSeries = /series|all of them|whole repeat|सारे|అన్నీ/i.test(text) && (session.seriesId || session.recurrence)
      const res = wholeSeries
        ? moveSeries(session.id, { day, startTime: time })
        : moveSessionChecked(session.id, { day, startTime: time }, now)
      const movedTo = res.session || (wholeSeries ? { ...session, day, startTime: time } : null)
      chatState.session.movedSession = res.ok || res.moved
        ? { subject: session.subjectName, when: `${movedTo.day} · ${movedTo.startTime}`, moved: res.moved || 1 }
        : { subject: session.subjectName, error: res.reason === 'clash' ? 'busy' : (res.reason || 'error'), conflicts: res.conflicts?.length || 0 }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'planner' } }
  }

  // ------------------------------------------------------------------
  // 10b) Letters to your future self
  // ------------------------------------------------------------------
  if (intentId === 'letter_write') {
    const preset = /year|साल|सालभर|సంవత్సర/i.test(rawText) ? '1y'
      : /6 month|छह महीने|ఆరు నెలల/i.test(rawText) ? '6m'
        : /3 month|तीन महीने|మూడు నెలల/i.test(rawText) ? '3m'
          : /week|हफ़्ते|हफ्ते|వారం/i.test(rawText) ? '1w'
            : '1m'
    const body = String(rawText)
      .replace(/\b(write|start|leave|a|an|the|letter|letters|to|my|myself|me|self|future|past|open|in|after|time|capsule)\b/gi, ' ')
      .replace(/(चिट्ठी|पत्र|भविष्य|ख़ुद|खुद|मैं|को|लिखो|लिखिए|में|के|बाद)/g, ' ')
      .replace(/(ఉత్తరం|ఉత్తరాలు|భవిష్యత్తు|నాకు|నాకై|రాయి|తర్వాత|లో)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const letter = writeLetter({ text: body || 'Dear future me —', preset, promptId: body ? null : 'lt-1' })
    if (letter) {
      const days = Math.max(1, Math.round((new Date(letter.unlockAt) - new Date()) / 86400000))
      chatState.session.letterSealed = { unlockAt: letter.unlockAt, days }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'journal', payload: { tab: 'letters' } } }
  }

  if (intentId === 'letter_show') {
    const st = lettersState(now)
    chatState.session.letters = {
      total: st.stats.total,
      sealed: st.stats.sealed,
      ready: st.stats.ready,
      opened: st.stats.opened,
      replied: st.stats.replies,
      next: st.stats.nextAt,
      nextIn: st.stats.nextInDays,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'journal', payload: { tab: 'letters' } } }
  }

  // ------------------------------------------------------------------
  // 10c) Guardian sharing
  // ------------------------------------------------------------------
  if (intentId === 'guardian_share') {
    let grant = GUARDIAN.read().grant
    if (!grant) grant = createGrant({ name: '', relation: 'parent' })
    const snapshot = gatherSnapshot(now)
    const sections = (grant.sections || []).map((id) => SECTIONS.find((s) => s.id === id)?.label?.en || id)
    chatState.session.guardian = {
      code: grant.code,
      active: grant.active,
      sections: sections.join(', ') || 'nothing yet',
      textShared: (grant.sections || []).includes('journalText'),
      score: snapshot.cleanRate,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'guardian' } }
  }

  // ------------------------------------------------------------------
  // 11a) Journal — the personalised diary
  // ------------------------------------------------------------------
  if (intentId === 'journal_add') {
    // strip the trigger ("journal:", "write in my journal") and keep the content
    const body = String(rawText)
      .replace(/^\s*(dear\s+)?(journal|diary)\s*[:\-]?\s*/i, '')
      .replace(/\b(write|add|note) (this )?(in|to) my (journal|diary)\b[:\-]?\s*/i, '')
      .replace(/^(जर्नल|डायरी)\s*[:\-]?\s*/, '')
      .replace(/^(జర్నల్|డైరీ)\s*[:\-]?\s*/, '')
      .trim()
    if (body) {
      const entry = quickCapture(body)
      const st = journalStats(JOURNAL.read().entries, now)
      chatState.session.journalSaved = {
        words: entry?.words || 0,
        streak: st.streak,
        mood: entry?.mood || null,
        xp: 10 + Math.min(10, Math.round((entry?.words || 0) / 20)),
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'journal' } }
  }

  if (intentId === 'journal_prompt') {
    const { prompts } = promptsForToday(now)
    chatState.session.journalPrompts = prompts.map((p) => promptLine(p, lang))
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'journal' } }
  }

  if (intentId === 'journal_show') {
    const st = journalState(now)
    const last = st.entries[0]
    const journal = JOURNAL.read().entries
    chatState.session.journalSummary = {
      count: st.stats.count,
      streak: st.stats.streak,
      avgMood: st.stats.avgMood,
      words: st.stats.words,
      trend: st.trend.direction,
      last: last ? { day: last.day, text: last.text, moodEmoji: last.mood ? ['', '😞', '😕', '😐', '🙂', '😄'][last.mood] : '' } : null,
      weekly: st.stats.count ? personalSummary({ journal, context: todayStats(now) }, lang) : '',
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'journal' } }
  }

  // ------------------------------------------------------------------
  // 11b) The urge routine — the anti-doomscroll reflex breaker
  // ------------------------------------------------------------------
  if (intentId === 'urge_help') {
    const urge = startUrge()
    chatState.session.urge = { seconds: Math.round((urge.expiresAt - urge.startedAt) / 1000) || URGE_TOTAL_SECONDS }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'shield' } }
  }

  // ------------------------------------------------------------------
  // 11c) Study music
  // ------------------------------------------------------------------
  if (intentId === 'music_start') {
    const t = String(rawText).toLowerCase()
    let presetId = null
    let ambient = null
    let band = null
    if (/brown/.test(t)) { presetId = 'white-noise'; ambient = 'brown' }
    else if (/white noise/.test(t)) { presetId = 'white-noise'; ambient = 'white' }
    else if (/rain|बारिश|వర్ష/.test(t)) presetId = 'reading-rain'
    else if (/ocean|sea|समुद्र|సముద్ర/.test(t)) presetId = 'reading-rain'
    else if (/lo-?fi|beats|hip ?hop|लो-?फ़ाई|లో-?ఫై/.test(t)) presetId = 'lofi-study'
    else if (/memor|revis|याद|रिवीज़न|జ్ఞాపక|రివిజన/.test(t)) presetId = 'memory-boost'
    else if (/exam|test|परीक्षा|పరీక్ష/.test(t)) presetId = 'exam-sprint'
    else if (/theta/.test(t)) { presetId = 'memory-boost'; band = 'theta' }
    else if (/gamma/.test(t)) { presetId = 'peak-thinking'; band = 'gamma' }
    else if (/alpha|binaural|brain ?wave|अल्फा|ఆల్ఫా/.test(t)) { presetId = 'deep-focus'; band = 'alpha' }
    else if (/piano|calm|शांत|ప్రశాంత/.test(t)) presetId = 'reading-rain'
    const preset = playPreset(presetId, { subject: /read|पढ़|చదువ/.test(t) ? 'reading' : '' })
    if (ambient || band) {
      applyLayers({
        ...(ambient ? { ambient: { type: ambient, level: 0.6 } } : {}),
        ...(band ? { binaural: { band, carrier: 200, level: 0.55 } } : {}),
      })
    }
    chatState.session.musicStarted = {
      name: preset.name[lang] || preset.name.en,
      music: preset.music ? (preset.music.style === 'lofi' ? 'lo-fi groove' : preset.music.style) : null,
      ambient: ambient
        ? (AMBIENT_TYPES.find((a) => a.id === ambient)?.label?.en || ambient)
        : (preset.ambient ? (AMBIENT_TYPES.find((a) => a.id === preset.ambient.type)?.label?.en || preset.ambient.type) : null),
      binaural: band
        ? `${BEAT_BANDS[band]?.hz} Hz ${band}`
        : (preset.binaural ? `${BEAT_BANDS[preset.binaural.band]?.hz} Hz ${preset.binaural.band}` : null),
      headphones: !!(band || preset.binaural),
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  if (intentId === 'music_stop') {
    const minutes = stopMusic()
    chatState.session.musicStopped = minutes || 0
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang }
  }

  // ------------------------------------------------------------------
  // 11d) Plant a tree (Forest-style focus)
  // ------------------------------------------------------------------
  if (intentId === 'forest_plant') {
    const minutes = parseDur(rawText) || 25
    // pick the closest free species (paid ones stay paid in the UI)
    const free = SPECIES.filter((sp) => (sp.unlock?.type || 'free') === 'free')
    const species = free.reduce((best, sp) => (Math.abs(sp.minutes - minutes) < Math.abs(best.minutes - minutes) ? sp : best), free[0])
    const subject = stripTimeWords(
      rawText
        .replace(/\b(plant|grow|start|a|an|the|tree|forest|don'?t|let|me|scroll|leave|focus|sprint|for|minutes?|mins?|min)\b/gi, ' ')
        .replace(/(पेड़|पौधा|लगाओ|लगाइए|भटकने|मत|दो|के|लिए|मिनट)/g, ' ')
        .replace(/(చెట్టు|మొక్క|నాటు|నాటండి|నిమిషాల|కి|వదిలెకు)/g, ' ')
        .replace(/\b\d+\b/g, ' ')
    ).slice(0, 30)
    const res = plantTree({ speciesId: species.id, minutes, subject, strictness: FOREST.read().settings.strictness })
    if (!res.error) {
      startFocus({ minutes, subject, treeId: res.tree.id })
      linkFocus(res.tree.id, FOCUS.read().active?.id)
      if (FOREST.read().settings.autoMusic) startForSession({ subject, minutes })
      chatState.session.plantedTree = {
        emoji: species.emoji,
        species: species.name[lang] || species.name.en,
        minutes,
        subject: subject || '',
        music: !!MUSIC.read().settings.autoplayWithFocus,
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'forest' } }
  }

  if (intentId === 'forest_stats') {
    const f = forestState(now)
    chatState.session.forest = {
      total: f.stats.total,
      minutes: f.stats.minutes,
      streak: f.stats.streak,
      coins: f.coins,
      todayTrees: f.stats.todayTrees,
      withered: f.stats.witheredCount,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'forest' } }
  }

  // ------------------------------------------------------------------
  // 11e) Focus Shield — blocklists & guard stats
  // ------------------------------------------------------------------
  if (intentId === 'shield_block') {
    const t = String(rawText).toLowerCase()
    const packWords = [
      [/social|insta|facebook|twitter|snap|reddit|threads|सोशल|इंस्टा|సోషల్|ఇన్.?స్టా/, 'social'],
      [/youtube|video|tiktok|netflix|twitch|reels|शॉर्ट वीडियो|యూట్యూబ్/, 'video'],
      [/game|gaming|roblox|steam|bgmi|गेम|గేమ్/, 'games'],
      [/shop|amazon|flipkart|myntra|शॉपिंग|షాపింగ్/, 'shopping'],
      [/news|ख़बर|खबर|వార్త/, 'news'],
      [/chat|whatsapp|telegram|discord|चैट|చాట్/, 'chat'],
    ]
    const pack = packWords.find(([re]) => re.test(t))
    if (pack) {
      const info = SITE_PACKS.find((x) => x.id === pack[1])
      SHIELD.update((sh) => ({ packs: sh.packs.includes(info.id) ? sh.packs : [...sh.packs, info.id], sites: [...new Set([...sh.sites, ...info.sites])] }))
      chatState.session.blocked = {
        pack: info.name[lang] || info.name.en,
        addedCount: info.sites.length,
        sample: info.sites.slice(0, 3).join(', '),
      }
    } else {
      const guessed = normalizeSite(
        String(rawText).replace(/\b(block|ban|restrict|add|to|the|blocklist|please|site|website|app)\b/gi, ' ')
      )
      if (guessed && guessed.includes('.')) {
        const r = addSite(guessed)
        chatState.session.blocked = r.error === 'duplicate'
          ? { duplicate: true, site: guessed }
          : { site: guessed, total: SHIELD.read().sites.length }
      }
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'shield' } }
  }

  if (intentId === 'shield_show') {
    const sh = SHIELD.read()
    chatState.session.blocklist = { sites: sh.sites, packs: sh.packs }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'shield' } }
  }

  if (intentId === 'shield_stats') {
    const st = shieldState()
    chatState.session.shieldStats = {
      sessions: st.stats.sessions,
      escapes: st.stats.escapes,
      escapesThisWeek: st.stats.escapesThisWeek,
      cleanRate: st.stats.cleanRate,
      cleanStreak: st.stats.cleanStreak,
      resisted: st.stats.resisted,
      protectedMinutes: st.stats.protectedMinutes,
      bestHour: st.stats.bestHour,
    }
    updateMemory({ chatCount: memory.chatCount + 1 })
    return { ...buildReply(intentId, chatState), lang, action: 'openFeature', openWith: { feature: 'shield' } }
  }

  // ------------------------------------------------------------------
  // 12) Legacy planner add: parse subject + duration (order-agnostic)
  // ------------------------------------------------------------------
  if (intentId === 'planner_add') {
    const dur = rawText.match(PLANNER_DUR_RE[lang] || PLANNER_DUR_RE.en)
    if (dur && dur[1]) {
      let subject = rawText
        .replace(dur[0], ' ')
        .replace(PLANNER_VERB_RE[lang] || PLANNER_VERB_RE.en, ' ')
        .replace(/[।|,]/g, ' ')
        .replace(/\b(task|study|class|for|पढ़ाई|టాస్క్|చదువు|పాఠం)\b/gi, ' ')
        .replace(/(\d+\s*(minutes|mins|minute|min|hours|hour|hr|मिनट|घंटे|నిమిషాలు|నిమిషం|గంటలు|గంట))/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      let minutes = parseInt(dur[1], 10)
      if (/hr|hour|घंटा|घंटे|గంట/.test(dur[2])) minutes *= 60
      const task = addTask(subject || (lang === 'hi' ? 'पढ़ाई' : lang === 'te' ? 'చదువు' : 'Study'), minutes)
      state.session.lastTask = task
      updateMemory({ chatCount: memory.chatCount + 1 })
      const reply = buildReply('planner_add', chatState)
      return { ...reply, lang, action: 'refreshPlanner' }
    }
    intentId = 'planner_info'
  }

  // --- Standard reply ---
  const reply = buildReply(intentId, chatState)
  updateMemory({ chatCount: memory.chatCount + 1 })
  return { ...reply, lang }
}

/** Numbers the journal summary and prompts need (kept small and local). */
function todayStats(now = new Date()) {
  const fState = forestState(now)
  const sState = shieldState()
  const todos = TODOS.read().items
  return {
    minutes: todayMinutes(now),
    trees: fState.stats.todayTrees,
    escapes: sState.stats.budget?.escapes || 0,
    resisted: sState.stats.budget?.resisted || 0,
    tasksDone: todos.filter((t) => t.done && t.doneDay === dayKeyOf(now)).length,
    streak: fState.stats.streak,
  }
}

export { parseWhen, parseRepeat, parseWeekday, stripTimeWords, todayStats }
