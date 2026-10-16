// ============================================================
//  Journal logic — pure helpers for a *personalised* study journal.
//
//  "Personalised" means the prompts and the summaries are built from
//  what actually happened today: minutes focused, trees grown,
//  escapes resisted, tasks ticked, plan sessions, mood history and
//  how close the exam is. Nothing is invented, nothing is generic.
//
//  No React / no browser APIs → fully unit-testable.
// ============================================================

export const MOODS = [
  { value: 1, emoji: '😞', label: { en: 'Rough', hi: 'बहुत ख़राब', te: 'చాలా కష్టం' }, color: '#ef4444' },
  { value: 2, emoji: '😕', label: { en: 'Low', hi: 'कम', te: 'తక్కువ' }, color: '#f97316' },
  { value: 3, emoji: '😐', label: { en: 'Okay', hi: 'ठीक', te: 'ఓకే' }, color: '#eab308' },
  { value: 4, emoji: '🙂', label: { en: 'Good', hi: 'अच्छा', te: 'బాగుంది' }, color: '#22c55e' },
  { value: 5, emoji: '😄', label: { en: 'Great', hi: 'शानदार', te: 'అద్భుతం' }, color: '#10b981' },
]

export const ENERGY = [
  { value: 1, emoji: '🪫', label: { en: 'Drained', hi: 'थका हुआ', te: 'అలసట' } },
  { value: 2, emoji: '🔋', label: { en: 'Low', hi: 'कम', te: 'తక్కువ' } },
  { value: 3, emoji: '⚡', label: { en: 'Steady', hi: 'स्थिर', te: 'స్థిరం' } },
  { value: 4, emoji: '🚀', label: { en: 'Charged', hi: 'ऊर्जावान', te: 'ఉత్సాహం' } },
]

export function moodBy(value) {
  return MOODS.find((m) => m.value === Number(value)) || null
}

export function energyBy(value) {
  return ENERGY.find((m) => m.value === Number(value)) || null
}

// ----------------------------------------------------------------
//  Prompt bank — grouped, then selected by the personalised picker
// ----------------------------------------------------------------
export const PROMPT_GROUPS = {
  opening: [
    { id: 'open-1', q: { en: 'One sentence: how did today actually feel?', hi: 'एक वाक्य: आज असल में कैसा लगा?', te: 'ఒక వాక్యం: ఈరోజు నిజంగా ఎలా అనిపించింది?' } },
    { id: 'open-2', q: { en: 'If today was a weather report, what would it say?', hi: 'अगर आज मौसम की रिपोर्ट होती, तो क्या कहती?', te: 'ఈరోజు వాతావరణ నివేదిక అయితే ఏం చెబుతుంది?' } },
  ],
  study: [
    { id: 'study-1', q: { en: 'What did you understand today that you did not understand yesterday?', hi: 'आज क्या समझ आया जो कल नहीं आया था?', te: 'నిన్న అర్థం కానిది ఈరోజు ఏం అర్థమైంది?' } },
    { id: 'study-2', q: { en: 'Which topic still feels slippery? What is the very next small step?', hi: 'कौन सा टॉपिक अब भी फिसलता है? अगला छोटा कदम क्या है?', te: 'ఏ టాపిక్ ఇంకా జారిపోతోంది? తదుపరి చిన్న అడుగు ఏమిటి?' } },
    { id: 'study-3', q: { en: 'Explain today\'s hardest idea to a 10-year-old in two lines.', hi: 'आज का सबसे कठिन विचार 10 साल के बच्चे को दो लाइनों में समझाइए।', te: 'ఈరోజు కష్టమైన భావనను 10 ఏళ్ల పిల్లవాడికి రెండు లైన్లలో చెప్పండి.' } },
  ],
  focus: [
    { id: 'focus-1', q: { en: 'When was your attention best today, and what was different then?', hi: 'आज ध्यान कब सबसे अच्छा था, और तब क्या अलग था?', te: 'ఈరోజు ఏకాగ్రత ఎప్పుడు బాగుంది, అప్పుడు ఏం భిన్నంగా ఉంది?' } },
    { id: 'focus-2', q: { en: 'What pulled you away? (name it — naming it shrinks it)', hi: 'किसने ध्यान खींचा? (नाम लीजिए — नाम लेने से वह छोटा हो जाता है)', te: 'మిమ్మల్ని ఏది దృష్టి తప్పించింది? (పేరు పెట్టండి — పేరుతో అది చిన్నదవుతుంది)' } },
    { id: 'focus-3', q: { en: 'Rate today\'s focus honestly, then write one thing that would make tomorrow 10% better.', hi: 'आज के फोकस को ईमानदारी से आँकिए, फिर लिखिए कि कल 10% बेहतर कैसे होगा।', te: 'ఈరోజు ఫోకస్‌ను నిజాయితీగా అంచనా వేయండి, రేపు 10% మెరుగుపడేందుకు ఒక మార్గం రాయండి.' } },
  ],
  feelings: [
    { id: 'feel-1', q: { en: 'What is the feeling under the feeling? (tired is often frustrated or bored)', hi: 'भावना के नीचे कौन सी भावना है? (थकान अक्सर झुंझलाहट या बोरियत होती है)', te: 'భావన కింద ఏ భావన ఉంది? (అలసట తరచుగా విసుగు లేదా బోర్)' } },
    { id: 'feel-2', q: { en: 'What are you proud of today, however small?', hi: 'आज किस बात पर गर्व है, चाहे कितनी भी छोटी हो?', te: 'ఈరోజు ఏ విషయంలో గర్వంగా ఉంది, చిన్నదైనా?' } },
    { id: 'feel-3', q: { en: 'Who or what helped you today? Have you told them?', hi: 'आज किसने या किस चीज़ ने मदद की? उन्हें बताया?', te: 'ఈరోజు ఎవరు/ఏది సహాయం చేసింది? వాళ్లకు చెప్పారా?' } },
  ],
  plan: [
    { id: 'plan-1', q: { en: 'Tomorrow\'s one non-negotiable task is…', hi: 'कल का एक अनिवार्य काम है…', te: 'రేపటి ఒక తప్పనిసరి పని…' } },
    { id: 'plan-2', q: { en: 'What will you do differently in the first 10 minutes of study?', hi: 'पढ़ाई के पहले 10 मिनट में क्या अलग करेंगे?', te: 'చదువు మొదటి 10 నిమిషాల్లో ఏం భిన్నంగా చేస్తారు?' } },
    { id: 'plan-3', q: { en: 'One thing to protect tomorrow: sleep, music, a break, or a walk?', hi: 'कल किसे बचाएँगे: नींद, संगीत, ब्रेक या टहलना?', te: 'రేపు ఏది కాపాడుతారు: నిద్ర, సంగీతం, విరామం, నడక?' } },
  ],
  gratitude: [
    { id: 'thanks-1', q: { en: 'Three small good things from today…', hi: 'आज की तीन छोटी अच्छी बातें…', te: 'ఈరోజు మూడు చిన్న మంచి విషయాలు…' } },
    { id: 'thanks-2', q: { en: 'Something ordinary that you would miss if it were gone…', hi: 'कोई आम चीज़ जो न हो तो याद आएगी…', te: 'ఏదైనా సాధారణ విషయం, అది లేకపోతే గుర్తుకొస్తుంది…' } },
  ],
  exam: [
    { id: 'exam-1', q: { en: 'Which chapter would you bet on appearing in the exam? Are you ready for it?', hi: 'कौन सा अध्याय परीक्षा में आने का दावा करेंगे? उसके लिए तैयार हैं?', te: 'పరీక్షలో ఏ చాప్టర్ వస్తుందని పందెం వేస్తారు? దానికి సిద్ధమా?' } },
    { id: 'exam-2', q: { en: 'One fear about the exam — and one fact that argues against it.', hi: 'परीक्षा का एक डर — और उसके विपरीत एक तथ्य।', te: 'పరీక్ష గురించి ఒక భయం — దానికి వ్యతిరేకంగా ఒక వాస్తవం.' } },
  ],
  reset: [
    { id: 'reset-1', q: { en: 'What would you tell a friend who had your exact day?', hi: 'अगर किसी दोस्त का दिन ऐसा होता, तो आप क्या कहते?', te: 'మీ రోజే మీ స్నేహితుడికి ఉంటే ఏం చెబుతారు?' } },
    { id: 'reset-2', q: { en: 'What is the smallest thing you can restart in 5 minutes?', hi: '5 मिनट में सबसे छोटी क्या चीज़ फिर शुरू कर सकते हैं?', te: '5 నిమిషాల్లో తిరిగి మొదలుపెట్టగల చిన్న విషయం ఏది?' } },
  ],
}

export const ALL_PROMPTS = Object.entries(PROMPT_GROUPS).flatMap(([group, list]) =>
  list.map((p) => ({ ...p, group })))

export function promptById(id) {
  return ALL_PROMPTS.find((p) => p.id === id) || null
}

/**
 * Build today's personalised prompt set from the real context.
 * @param {object} ctx
 *   minutes, trees, escapes, resisted, tasksDone, tasksOpen, planSessions,
 *   planDone, streak, spacedDue, examDays, mood7 (array of moods), subject,
 *   wroteYesterday, dayOfWeek, hour, musicMinutes
 * @returns {{prompts: Array, reason: object}} — reason explains *why* these
 */
export function pickPrompts(ctx = {}, lang = 'en') {
  const {
    minutes = 0, trees = 0, escapes = 0, resisted = 0, tasksDone = 0, tasksOpen = 0,
    planSessions = 0, planDone = 0, streak = 0, examDays = null, mood7 = [],
    subject = '', hour = new Date().getHours(), wroteYesterday = false,
  } = ctx

  const picks = []
  const reasons = []
  const push = (id, why) => {
    const p = promptById(id)
    if (p && !picks.some((x) => x.id === id)) { picks.push(p); if (why) reasons.push({ id, why }) }
  }
  const moodAvg = mood7.length ? mood7.reduce((a, b) => a + b, 0) / mood7.length : 0
  const lowRecent = mood7.slice(0, 2).filter((m) => m <= 2).length >= 2

  // 1) how the day went overall
  push(hour >= 20 ? 'open-1' : 'open-2')

  // 2) study-specific
  if (tasksDone >= 2) push('feel-2', 'you finished several tasks today')
  else if (minutes >= 40) push('study-1', `you focused ${minutes} minutes today`)
  else if (minutes > 0) push('study-2', 'short session — pick the next small step')
  else push('reset-2', 'no study logged today — restart small')

  // 5) feelings — when the mood history or streak asks for it
  if (lowRecent) push('feel-1', 'the last two moods were low')
  else if (streak >= 3) push('feel-2', `${streak}-day streak — notice what is working`)
  else if (streak === 0 && wroteYesterday === false) push('feel-3', 'a fresh start — who can help?')

  // 4) exam pressure
  if (examDays != null && examDays <= 14 && examDays > 0) push('exam-1', `${examDays} days to the exam`)
  else if (examDays != null && examDays <= 3) push('exam-2', 'exam is very close')

  // 3) focus quality — only when there is something to reflect on
  if (escapes >= 2) push('focus-2', `${escapes} escapes today — name the trigger`)
  if (resisted >= 1) push('focus-3', `you rode out ${resisted} urge(s) — note what worked`)

  // 6) tomorrow
  if (tasksOpen > 0 || planSessions > planDone) push('plan-1', 'there is still work waiting tomorrow')
  else push('plan-3', 'protect something that keeps you steady')

  // 7) a gratitude nudge roughly once a day, late
  if (hour >= 20 || moodAvg >= 4) push('thanks-1')

  void subject
  return { prompts: picks.slice(0, 5), reason: reasons }
}

// ----------------------------------------------------------------
//  date helpers (self-contained)
// ----------------------------------------------------------------
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

export function isToday(entry, now = new Date()) { return entry?.day === dayKey(now) }

export function findEntry(entries = [], day = dayKey()) {
  return entries.find((e) => e.day === day) || null
}

// ----------------------------------------------------------------
//  text helpers
// ----------------------------------------------------------------
export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

/** Pull #tags out of the body text ("#physics #revision"). */
export function extractTags(text) {
  const out = []
  const re = /#([\p{L}\p{M}\p{N}_-]{2,24})/gu
  let m
  while ((m = re.exec(String(text || '')))) out.push(m[1].toLowerCase())
  return [...new Set(out)]
}

export function searchEntries(entries = [], query = '') {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return entries
  return entries.filter((e) => {
    const hay = [e.text, e.win, e.struggle, e.tomorrow, e.gratitude, e.subject, (e.tags || []).join(' ')]
      .filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function filterEntries(entries = [], filter = 'all') {
  switch (filter) {
    case 'pinned': return entries.filter((e) => e.pinned)
    case 'low': return entries.filter((e) => (e.mood || 3) <= 2)
    case 'high': return entries.filter((e) => (e.mood || 3) >= 4)
    case 'thisMonth': {
      const now = new Date()
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return entries.filter((e) => e.day.startsWith(prefix))
    }
    default: return entries
  }
}

// ----------------------------------------------------------------
//  stats
// ----------------------------------------------------------------
export function journalStats(entries = [], now = new Date()) {
  const sorted = [...entries].sort((a, b) => (a.day < b.day ? 1 : -1))
  const days = new Set(entries.map((e) => e.day))
  let streak = 0
  let cursor = new Date(now)
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  while (days.has(dayKey(cursor))) { streak++; cursor = addDays(cursor, -1) }

  const moods = entries.filter((e) => e.mood).map((e) => e.mood)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : 0
  const words = entries.reduce((a, e) => a + wordCount(e.text), 0)
  const tagCount = {}
  entries.forEach((e) => (e.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1 }))
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const hours = new Array(24).fill(0)
  entries.forEach((e) => { const h = new Date(e.createdAt || e.day).getHours(); hours[h] += 1 })
  const bestHour = entries.length ? hours.indexOf(Math.max(...hours)) : null

  return {
    count: entries.length,
    streak,
    longestStreak: longestStreak(entries),
    avgMood,
    words,
    topTags,
    bestHour,
    todayWritten: days.has(dayKey(now)),
    pinned: entries.filter((e) => e.pinned).length,
    daysWritten: days.size,
  }
}

export function longestStreak(entries = []) {
  const days = [...new Set(entries.map((e) => e.day))].sort()
  let best = 0
  let run = 0
  let prev = null
  days.forEach((d) => {
    if (prev && dayKey(addDays(parseDayKey(prev), 1)) === d) run += 1
    else run = 1
    best = Math.max(best, run)
    prev = d
  })
  return best
}

/** Last `days` of mood for the little chart (null = nothing written). */
export function moodStrip(entries = [], days = 14, now = new Date()) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i)
    const key = dayKey(d)
    const e = findEntry(entries, key)
    out.push({
      key,
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      mood: e?.mood ?? null,
      words: e ? wordCount(e.text) : 0,
    })
  }
  return out
}

export function moodTrend(entries = [], days = 7, now = new Date()) {
  const strip = moodStrip(entries, days, now).filter((d) => d.mood != null)
  if (strip.length < 2) return { direction: 'flat', delta: 0, points: strip.length }
  const half = Math.floor(strip.length / 2)
  const first = strip.slice(0, half).reduce((a, b) => a + b.mood, 0) / Math.max(1, half)
  const second = strip.slice(-half).reduce((a, b) => a + b.mood, 0) / Math.max(1, half)
  const delta = Math.round((second - first) * 10) / 10
  return { direction: delta > 0.3 ? 'up' : delta < -0.3 ? 'down' : 'flat', delta, points: strip.length }
}

/** Same calendar day in previous years — nice "on this day" recall. */
export function onThisDay(entries = [], now = new Date()) {
  const mmdd = dayKey(now).slice(5)
  return entries
    .filter((e) => e.day.slice(5) === mmdd && e.day !== dayKey(now))
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, 3)
}

// ----------------------------------------------------------------
//  personalised summaries (used by chat + the weekly review)
// ----------------------------------------------------------------
export function personalSummary({ journal = [], context = {} } = {}, lang = 'en') {
  const stats = journalStats(journal)
  const trend = moodTrend(journal)
  const { minutes = 0, trees = 0, escapes = 0, resisted = 0, tasksDone = 0, streak = 0 } = context
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const pretty = h ? `${h}h ${m}m` : `${m}m`
  const moodWord = trend.direction === 'up'
    ? { en: 'rising 📈', hi: 'बढ़ रहा 📈', te: 'పెరుగుతోంది 📈' }
    : trend.direction === 'down'
      ? { en: 'dipping 📉', hi: 'घट रहा 📉', te: 'తగ్గుతోంది 📉' }
      : { en: 'steady ➖', hi: 'स्थिर ➖', te: 'స్థిరం ➖' }

  const lines = []
  lines.push({
    en: `You wrote ${stats.count} entr${stats.count === 1 ? 'y' : 'ies'} (🔥 ${stats.streak}-day writing streak) and your mood is ${moodWord[lang]}.`,
    hi: `आपने ${stats.count} प्रविष्टियाँ लिखीं (🔥 ${stats.streak} दिन की स्ट्रीक) और मूड ${moodWord.hi} है।`,
    te: `మీరు ${stats.count} ఎంట్రీలు రాశారు (🔥 ${stats.streak} రోజుల స్ట్రీక్), మూడ్ ${moodWord.te}.`,
  }[lang])

  if (minutes || trees || tasksDone) {
    lines.push({
      en: `Meanwhile: ${pretty} focused · ${trees} tree${trees === 1 ? '' : 's'} · ${tasksDone} task${tasksDone === 1 ? '' : 's'} done${escapes ? ` · ${escapes} escape${escapes === 1 ? '' : 's'}` : ''}${resisted ? ` · 💪 ${resisted} urge${resisted === 1 ? '' : 's'} resisted` : ''}.`,
      hi: `साथ ही: ${pretty} फोकस · ${trees} पेड़ · ${tasksDone} काम पूरे${escapes ? ` · ${escapes} भटकाव` : ''}${resisted ? ` · 💪 ${resisted} इच्छाएँ रोकीं` : ''}।`,
      te: `అలాగే: ${pretty} ఫోకస్ · ${trees} చెట్లు · ${tasksDone} పనులు పూర్తి${escapes ? ` · ${escapes} ఎస్కేప్‌లు` : ''}${resisted ? ` · 💪 ${resisted} కోరికలు ఆపారు` : ''}.`,
    }[lang])
  }

  if (streak) {
    lines.push({
      en: `Study streak: ${streak} day${streak === 1 ? '' : 's'}. ${stats.streak > 0 ? 'Your journal streak too — keep both alive.' : 'One entry today keeps the journal streak alive.'}`,
      hi: `स्टडी स्ट्रीक: ${streak} दिन। ${stats.streak > 0 ? 'जर्नल स्ट्रीक भी चल रही है — दोनों बचाइए।' : 'आज एक प्रविष्टि जर्नल स्ट्रीक बचाएगी।'}`,
      te: `స్టడీ స్ట్రీక్: ${streak} రోజులు. ${stats.streak > 0 ? 'జర్నల్ స్ట్రీక్ కూడా నడుస్తోంది.' : 'ఈరోజు ఒక ఎంట్రీ జర్నల్ స్ట్రీక్ కాపాడుతుంది.'}`,
    }[lang])
  }

  return lines.join('\n')
}

export function promptLine(prompt, lang = 'en') {
  if (!prompt) return ''
  return prompt.q[lang] || prompt.q.en
}

// ----------------------------------------------------------------
//  export
// ----------------------------------------------------------------
export function entriesToMarkdown(entries = [], lang = 'en') {
  const title = { en: 'My study journal', hi: 'मेरा स्टडी जर्नल', te: 'నా స్టడీ జర్నల్' }[lang]
  const stats = journalStats(entries)
  const lines = [
    `# ${title}`, '',
    `**${{ en: 'Entries', hi: 'प्रविष्टियाँ', te: 'ఎంట్రీలు' }[lang]}: ${stats.count} · `
    + `${{ en: 'Streak', hi: 'स्ट्रीक', te: 'స్ట్రీక్' }[lang]}: ${stats.streak} · `
    + `${{ en: 'Avg mood', hi: 'औसत मूड', te: 'సగటు మూడ్' }[lang]}: ${stats.avgMood}/5 · `
    + `${{ en: 'Words', hi: 'शब्द', te: 'పదాలు' }[lang]}: ${stats.words}**`, '',
  ]
  const sorted = [...entries].sort((a, b) => (a.day < b.day ? 1 : -1))
  sorted.forEach((e) => {
    const mood = moodBy(e.mood)
    lines.push(`## ${e.day} ${mood ? mood.emoji + ' ' + (mood.label[lang] || mood.label.en) : ''}${e.pinned ? ' 📌' : ''}`)
    if (e.subject) lines.push(`*${e.subject}*`)
    if (e.text) lines.push('', e.text)
    if (e.win) lines.push('', `**${ { en: 'Win', hi: 'जीत', te: 'గెలుపు' }[lang] }:** ${e.win}`)
    if (e.struggle) lines.push(`**${ { en: 'Struggle', hi: 'कठिनाई', te: 'ఇబ్బంది' }[lang] }:** ${e.struggle}`)
    if (e.gratitude) lines.push(`**${ { en: 'Grateful', hi: 'आभार', te: 'కృతజ్ఞత' }[lang] }:** ${e.gratitude}`)
    if (e.tomorrow) lines.push(`**${ { en: 'Tomorrow', hi: 'कल', te: 'రేపు' }[lang] }:** ${e.tomorrow}`)
    if ((e.tags || []).length) lines.push('', e.tags.map((t) => `#${t}`).join(' '))
    lines.push('', '---', '')
  })
  return lines.join('\n')
}

export function entriesToJSON(entries = []) {
  return JSON.stringify({
    app: 'Bodhya',
    feature: 'journal',
    exportedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  }, null, 2)
}

/** Import side of the JSON export — tolerant, never throws. */
export function parseImport(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    const list = Array.isArray(data) ? data : data?.entries
    if (!Array.isArray(list)) return { entries: [], error: 'no-entries' }
    const entries = list
      .filter((e) => e && typeof e === 'object')
      .map((e) => ({
        id: e.id || `jr_${Math.random().toString(36).slice(2, 9)}`,
        day: e.day || dayKey(new Date(e.createdAt || Date.now())),
        createdAt: e.createdAt || Date.now(),
        updatedAt: e.updatedAt || e.createdAt || Date.now(),
        mood: Number(e.mood) || null,
        energy: Number(e.energy) || null,
        subject: e.subject || '',
        text: String(e.text || ''),
        win: e.win || '',
        struggle: e.struggle || '',
        gratitude: e.gratitude || '',
        tomorrow: e.tomorrow || '',
        tags: Array.isArray(e.tags) ? e.tags : extractTags(e.text || ''),
        promptIds: Array.isArray(e.promptIds) ? e.promptIds : [],
        pinned: !!e.pinned,
        words: wordCount(e.text || ''),
      }))
    return { entries }
  } catch (err) {
    return { entries: [], error: 'bad-json', detail: String(err?.message || err) }
  }
}

export const DEFAULT_SETTINGS = {
  promptEnabled: true,
  voiceNotes: true,             // offer the mic in the write view
  reminderEnabled: true,
  reminderTime: '21:30',        // nudged to your usual writing hour
  autoContext: true,            // pre-fill the "today" strip from other features
  weeklyReview: true,           // Sunday evening summary
  weeklyReviewDay: 0,           // 0 = Sunday
  moodScale: 5,
  askEnergy: true,
  showOnThisDay: true,
}


// ============================================================
//  💌 Letters to your future self
//  Write now, seal it, and Bodhya hands it back on the date you pick.
// ============================================================

export const UNLOCK_PRESETS = [
  { id: '1w', days: 7, emoji: '🌱', label: { en: 'In a week', hi: 'एक हफ़्ते में', te: 'ఒక వారంలో' } },
  { id: '1m', days: 30, emoji: '🌿', label: { en: 'In a month', hi: 'एक महीने में', te: 'ఒక నెలలో' } },
  { id: '3m', days: 90, emoji: '🌳', label: { en: 'In 3 months', hi: '3 महीने में', te: '3 నెలల్లో' } },
  { id: '6m', days: 180, emoji: '🎄', label: { en: 'In 6 months', hi: '6 महीने में', te: '6 నెలల్లో' } },
  { id: '1y', days: 365, emoji: '🎓', label: { en: 'In a year', hi: 'एक साल में', te: 'ఒక సంవత్సరంలో' } },
]

/** Prompts written for a letter (different voice from the daily prompts). */
export const LETTER_PROMPTS = [
  { id: 'lt-1', q: { en: 'Dear future me — what do you hope has changed by then?', hi: 'प्रिय भविष्य का मैं — तब तक क्या बदल जाना चाहते हो?', te: 'ప్రియమైన భవిష్యత్ నేను — అప్పటికి ఏం మారాలని కోరుకుంటున్నావు?' } },
  { id: 'lt-2', q: { en: 'What are you struggling with right now that will look small later?', hi: 'अभी किस बात से जूझ रहे हो जो बाद में छोटी लगेगी?', te: 'ఇప్పుడు ఏ కష్టంతో పోరాడుతున్నావు, అది తర్వాత చిన్నగా కనిపిస్తుంది?' } },
  { id: 'lt-3', q: { en: 'One promise to the person reading this.', hi: 'इसे पढ़ने वाले को एक वादा।', te: 'ఇది చదివే వ్యక్తికి ఒక మాట.' } },
  { id: 'lt-4', q: { en: 'What do you want to remember about this exact week?', hi: 'इस हफ़्ते की कौन सी बात याद रखनी है?', te: 'ఈ వారం గురించి ఏది గుర్తుంచుకోవాలి?' } },
  { id: 'lt-5', q: { en: 'If things go badly, what would you tell yourself to keep going?', hi: 'अगर सब बुरा हो, तो ख़ुद को क्या कहेंगे?', te: 'అంతా దారుణంగా జరిగితే, మీరేం చెబుతారు?' } },
]

export function letterPromptById(id) {
  return LETTER_PROMPTS.find((p) => p.id === id) || null
}

/** Unlock date from a preset id ("1m") or an explicit ISO day. */
export function letterUnlockDate(presetId, from = new Date()) {
  const preset = UNLOCK_PRESETS.find((p) => p.id === presetId)
  if (!preset) return dayKey(addDays(from, 30))
  return dayKey(addDays(from, preset.days))
}

export function daysUntil(targetDay, now = new Date()) {
  if (!targetDay) return null
  return Math.round((parseDayKey(targetDay).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400000)
}

/**
 * A letter is locked until its unlock day (inclusive of that day).
 * status: 'sealed' → 'ready' (unlock day reached) → 'opened' → 'replied'
 */
export function letterStatus(letter, now = new Date()) {
  if (!letter) return null
  if (letter.status === 'replied') return 'replied'
  if (letter.status === 'opened') return 'opened'
  const left = daysUntil(letter.unlockAt, now)
  return left <= 0 ? 'ready' : 'sealed'
}

export function isLetterLocked(letter, now = new Date()) {
  return letterStatus(letter, now) === 'sealed'
}

/** Human countdown: "sealed for 74 more days", "opens today". */
export function letterCountdown(letter, now = new Date(), lang = 'en') {
  const left = daysUntil(letter?.unlockAt, now)
  if (left == null) return ''
  if (left > 1) return { en: `${left} more days`, hi: `${left} दिन और`, te: `${left} రోజులు ఇంకా` }[lang]
  if (left === 1) return { en: 'opens tomorrow', hi: 'कल खुलेगी', te: 'రేపు తెరుచుకుంటుంది' }[lang]
  if (left === 0) return { en: 'opens today', hi: 'आज खुलती है', te: 'ఈరోజే తెరుచుకుంటుంది' }[lang]
  return { en: `waiting ${Math.abs(left)} days`, hi: `${Math.abs(left)} दिन बाद`, te: `${Math.abs(left)} రోజుల తర్వాత` }[lang]
}

export function lettersStats(letters = [], now = new Date()) {
  const sealed = letters.filter((l) => letterStatus(l, now) === 'sealed')
  const ready = letters.filter((l) => letterStatus(l, now) === 'ready')
  const opened = letters.filter((l) => ['opened', 'replied'].includes(letterStatus(l, now)))
  const next = sealed
    .map((l) => ({ letter: l, days: daysUntil(l.unlockAt, now) }))
    .sort((a, b) => a.days - b.days)[0]
  return {
    total: letters.length,
    sealed: sealed.length,
    ready: ready.length,
    opened: opened.length,
    replies: letters.filter((l) => l.status === 'replied').length,
    words: letters.reduce((a, l) => a + wordCount(l.text), 0),
    nextAt: next ? next.letter.unlockAt : null,
    nextInDays: next ? next.days : null,
  }
}

export function letterToText(letter, lang = 'en') {
  const mood = moodBy(letter.mood)
  const head = { en: '💌 A letter from past you', hi: '💌 पिछले आप की चिट्ठी', te: '💌 గత మీరు రాసిన ఉత్తరం' }[lang]
  const lines = [
    head,
    `${letter.writtenAt ? new Date(letter.writtenAt).toLocaleDateString() : ''} → ${letter.unlockAt}`,
    '',
    letter.text || '',
  ]
  if (letter.promise) lines.push('', `${ { en: 'Promise', hi: 'वादा', te: 'మాట' }[lang] }: ${letter.promise}`)
  if (mood) lines.push(`${mood.emoji} ${mood.label[lang] || mood.label.en}`)
  if (letter.context?.minutes) lines.push(`${ { en: 'Focus that day', hi: 'उस दिन का फोकस', te: 'ఆ రోజు ఫోకస్' }[lang] }: ${letter.context.minutes} min`)
  return lines.join('\n')
}
