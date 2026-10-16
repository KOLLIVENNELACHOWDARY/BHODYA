// ============================================================
//  Study-forest logic — pure rules for the Forest-style loop:
//  plant a tree → the timer runs → finish it and it stays in your
//  forest; leave or cancel and it withers.
//
//  No React, no browser APIs → fully unit-testable.
// ============================================================

export const COINS_PER_5_MIN = 1

/** Growth stages every tree walks through while the timer runs. */
export const STAGES = ['seed', 'sprout', 'sapling', 'tree', 'bloom']

export const STAGE_ART = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  tree: '🌳',
  bloom: '🌸',
}

/**
 * Species catalog. `minutes` is the focus length that grows it fully;
 * `unlock` says what it costs (coins) or which streak level opens it.
 */
export const SPECIES = [
  {
    id: 'bamboo', emoji: '🎋', name: { en: 'Bamboo', hi: 'बाँस', te: 'బంబూ' },
    minutes: 10, unlock: { type: 'free' },
    fact: { en: 'Bamboo grows fast — perfect for a short sprint.', hi: 'बाँस तेज़ बढ़ता है — छोटे स्प्रिंट के लिए बढ़िया।', te: 'బంబూ వేగంగా పెరుగుతుంది — చిన్న స్ప్రింట్‌కు బెస్ట్.' },
  },
  {
    id: 'sunflower', emoji: '🌻', name: { en: 'Sunflower', hi: 'सूरजमुखी', te: 'సూర్యకాంతి' },
    minutes: 15, unlock: { type: 'free' },
    fact: { en: 'Turns toward the light — like your attention should.', hi: 'रोशनी की ओर मुड़ता है — जैसे ध्यान मुड़ना चाहिए।', te: 'వెలుతురు వైపు తిరుగుతుంది — మీ ఏకాగ్రతలా.' },
  },
  {
    id: 'pine', emoji: '🌲', name: { en: 'Pine', hi: 'देवदार', te: 'పైన్' },
    minutes: 25, unlock: { type: 'free' },
    fact: { en: 'One classic Pomodoro = one pine.', hi: 'एक पोमोडोरो = एक देवदार।', te: 'ఒక పొమొడోరో = ఒక పైన్.' },
  },
  {
    id: 'oak', emoji: '🌳', name: { en: 'Oak', hi: 'ओक', te: 'ఓక్' },
    minutes: 45, unlock: { type: 'coins', cost: 8 },
    fact: { en: 'Slow, steady, impossible to rush.', hi: 'धीमा, स्थिर, जल्दी नहीं हो सकता।', te: 'నెమ్మది, స్థిరం, తొందరపడలేరు.' },
  },
  {
    id: 'maple', emoji: '🍁', name: { en: 'Maple', hi: 'मेपल', te: 'మేపుల్' },
    minutes: 40, unlock: { type: 'streak', days: 3 },
    fact: { en: 'Unlocked by a 3-day planting streak.', hi: '3 दिन की स्ट्रीक से खुलता है।', te: '3 రోజుల స్ట్రీక్‌తో తెరుచుకుంటుంది.' },
  },
  {
    id: 'cherry', emoji: '🌸', name: { en: 'Cherry blossom', hi: 'चेरी ब्लॉसम', te: 'చెర్రీ బ్లాసమ్' },
    minutes: 30, unlock: { type: 'coins', cost: 15 },
    fact: { en: 'Short-lived and beautiful — like a perfect focus block.', hi: 'थोड़े समय का और सुंदर — जैसे एक बढ़िया फोकस ब्लॉक।', te: 'కొద్దికాలం, అందంగా — మంచి ఫోకస్ బ్లాక్‌లా.' },
  },
  {
    id: 'banyan', emoji: '🌴', name: { en: 'Banyan', hi: 'वटवृक्ष', te: 'మర్రి' },
    minutes: 60, unlock: { type: 'coins', cost: 25 },
    fact: { en: 'Bodhya\'s own tree — an hour of deep work.', hi: 'Bodhya का पेड़ — एक घंटा गहन अध्ययन।', te: 'Bodhya చెట్టు — ఒక గంట డీప్ వర్క్.' },
  },
  {
    id: 'kapok', emoji: '🌵', name: { en: 'Desert cactus', hi: 'रेगिस्तानी कैक्टस', te: 'ఎడారి కాక్టస్' },
    minutes: 20, unlock: { type: 'streak', days: 7 },
    fact: { en: 'Grows where nothing else can — for hard days.', hi: 'वहाँ उगता है जहाँ और कुछ नहीं — कठिन दिनों के लिए।', te: 'ఏదీ పెరగని చోట పెరుగుతుంది — కష్టమైన రోజులకు.' },
  },
]

export const STRICTNESS = [
  {
    id: 'gentle', emoji: '🌤️',
    label: { en: 'Gentle', hi: 'नरम', te: 'సున్నితం' },
    desc: { en: 'Leaving the app only gets logged. Tree survives.', hi: 'ऐप छोड़ने पर सिर्फ़ रिकॉर्ड होगा। पेड़ बचेगा।', te: 'యాప్ వదిలితే లాగ్ మాత్రమే. చెట్టు బతుకుతుంది.' },
    witherAfterMs: null,
    maxEscapes: 99,
  },
  {
    id: 'focused', emoji: '🎯',
    label: { en: 'Focused', hi: 'केंद्रित', te: 'ఫోకస్డ్' },
    desc: { en: 'Away more than 45s twice? The tree wilts.', hi: '45 सेकंड से ज़्यादा दो बार बाहर? पेड़ मुरझाएगा।', te: '45 సెకన్లకు మించి రెండుసార్లు బయట? చెట్టు వాడిపోతుంది.' },
    witherAfterMs: 45000,
    maxEscapes: 2,
  },
  {
    id: 'strict', emoji: '🔒',
    label: { en: 'Strict', hi: 'सख़्त', te: 'స్ట్రిక్ట్' },
    desc: { en: 'Away 20s once and the tree withers. No excuses.', hi: '20 सेकंड एक बार बाहर? पेड़ मुरझा जाएगा।', te: '20 సెకన్లు ఒకసారి బయట? చెట్టు వాడిపోతుంది.' },
    witherAfterMs: 20000,
    maxEscapes: 0,
  },
]

export const ACHIEVEMENTS = [
  { id: 'firstTree', emoji: '🌱', name: { en: 'First tree', hi: 'पहला पेड़', te: 'తొలి చెట్టు' }, test: (s) => s.total >= 1 },
  { id: 'tenTrees', emoji: '🌳', name: { en: 'Ten trees', hi: 'दस पेड़', te: 'పది చెట్లు' }, test: (s) => s.total >= 10 },
  { id: 'fiftyTrees', emoji: '🏞️', name: { en: 'Real forest', hi: 'असली जंगल', te: 'నిజమైన అడవి' }, test: (s) => s.total >= 50 },
  { id: 'streak3', emoji: '🔥', name: { en: '3-day streak', hi: '3 दिन की स्ट्रीक', te: '3 రోజుల స్ట్రీక్' }, test: (s) => s.longestStreak >= 3 },
  { id: 'streak7', emoji: '🚀', name: { en: '7-day streak', hi: '7 दिन की स्ट्रीक', te: '7 రోజుల స్ట్రీక్' }, test: (s) => s.longestStreak >= 7 },
  { id: 'streak30', emoji: '👑', name: { en: '30-day streak', hi: '30 दिन की स्ट्रीक', te: '30 రోజుల స్ట్రీక్' }, test: (s) => s.longestStreak >= 30 },
  { id: 'hourTree', emoji: '🕰️', name: { en: 'One-hour tree', hi: 'एक घंटे का पेड़', te: 'ఒక గంట చెట్టు' }, test: (s) => s.longestSession >= 60 },
  { id: 'clean10', emoji: '🛡️', name: { en: '10 clean sessions', hi: '10 बिना-भटकाव सत्र', te: '10 క్లీన్ సెషన్లు' }, test: (s) => s.cleanSessions >= 10 },
  { id: 'nightOwl', emoji: '🦉', name: { en: 'Night owl', hi: 'रात का उल्लू', te: 'రాత్రి గుడ్లగూబ' }, test: (s) => s.nightSessions >= 1 },
  { id: 'earlyBird', emoji: '🐦', name: { en: 'Early bird', hi: 'सुबह की चिड़िया', te: 'ఉదయ పక్షి' }, test: (s) => s.morningSessions >= 1 },
  { id: 'survivor', emoji: '🌵', name: { en: 'Grew in a hard week', hi: 'कठिन हफ़्ते में पेड़', te: 'కష్టమైన వారంలో చెట్టు' }, test: (s) => s.total >= 5 && s.withered >= 3 },
]

// ----------------------------------------------------------------
//  helpers
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

export function speciesById(id) {
  return SPECIES.find((s) => s.id === id) || SPECIES[0]
}

export function strictnessById(id) {
  return STRICTNESS.find((s) => s.id === id) || STRICTNESS[1]
}

/** Is this species available to plant right now? */
export function isUnlocked(species, { coins = 0, streak = 0 } = {}) {
  const u = species.unlock || { type: 'free' }
  if (u.type === 'free') return true
  if (u.type === 'coins') return coins >= (u.cost || 0)
  if (u.type === 'streak') return streak >= (u.days || 0)
  return true
}

export function unlockReason(species, lang = 'en') {
  const u = species.unlock || { type: 'free' }
  if (u.type === 'coins') {
    return { en: `Unlock for ${u.cost} coins`, hi: `${u.cost} सिक्कों में खोलें`, te: `${u.cost} నాణేలతో తెరవండి` }[lang]
  }
  if (u.type === 'streak') {
    return { en: `Needs a ${u.days}-day streak`, hi: `${u.days} दिन की स्ट्रीक चाहिए`, te: `${u.days} రోజుల స్ట్రీక్ కావాలి` }[lang]
  }
  return { en: 'Free', hi: 'मुफ़्त', te: 'ఉచితం' }[lang]
}

export function coinsFor(minutes) {
  return Math.max(1, Math.floor((Number(minutes) || 0) / 5)) * COINS_PER_5_MIN
}

/** Which emoji should the tree show right now? */
export function stageFor(minutes, elapsedMinutes) {
  const total = Math.max(1, Number(minutes) || 1)
  const ratio = Math.max(0, Math.min(1, (Number(elapsedMinutes) || 0) / total))
  if (ratio >= 1) return 'bloom'
  if (ratio >= 0.65) return 'tree'
  if (ratio >= 0.35) return 'sapling'
  if (ratio >= 0.12) return 'sprout'
  return 'seed'
}

export function growthPct(minutes, elapsedMinutes) {
  const total = Math.max(1, Number(minutes) || 1)
  return Math.max(0, Math.min(100, Math.round(((Number(elapsedMinutes) || 0) / total) * 100)))
}

/**
 * Should the tree wither because the user left the app?
 * @returns {{wither:boolean, reason:string, awayMs:number}}
 */
export function evaluateEscape({ awayMs = 0, escapes = 0, strictness = 'focused', running = true }) {
  if (!running) return { wither: false, reason: 'not-running', awayMs }
  const rule = strictnessById(strictness)
  if (rule.witherAfterMs && awayMs >= rule.witherAfterMs) {
    return { wither: true, reason: 'away-too-long', awayMs }
  }
  if (escapes > rule.maxEscapes) {
    return { wither: true, reason: 'too-many-escapes', awayMs }
  }
  return { wither: false, reason: 'warning', awayMs }
}

// ----------------------------------------------------------------
//  forest statistics
// ----------------------------------------------------------------
export function forestStats(trees = [], now = new Date()) {
  const grown = trees.filter((t) => t.status === 'grown')
  const withered = trees.filter((t) => t.status === 'withered')
  const today = dayKey(now)

  // streak of consecutive days with at least one grown tree
  const days = new Set(grown.map((t) => t.day))
  let streak = 0
  let cursor = new Date(now)
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  while (days.has(dayKey(cursor))) { streak++; cursor = addDays(cursor, -1) }

  // longest streak ever
  const sorted = [...days].sort()
  let longest = 0
  let run = 0
  let prev = null
  sorted.forEach((d) => {
    if (prev && dayKey(addDays(parseDayKey(prev), 1)) === d) run += 1
    else run = 1
    longest = Math.max(longest, run)
    prev = d
  })

  const minutes = grown.reduce((a, t) => a + (t.minutes || 0), 0)
  const cleanSessions = grown.filter((t) => !(t.escapes > 0)).length
  const nightSessions = grown.filter((t) => new Date(t.plantedAt).getHours() >= 22).length
  const morningSessions = grown.filter((t) => new Date(t.plantedAt).getHours() < 7).length
  const speciesCount = new Set(grown.map((t) => t.speciesId)).size

  return {
    total: grown.length,
    witheredCount: withered.length,
    minutes,
    todayTrees: grown.filter((t) => t.day === today).length,
    weekTrees: grown.filter((t) => now.getTime() - t.plantedAt < 7 * 86400000).length,
    streak,
    longestStreak: longest,
    cleanSessions,
    longestSession: grown.reduce((a, t) => Math.max(a, t.minutes || 0), 0),
    nightSessions,
    morningSessions,
    speciesCount,
    survivalRate: grown.length + withered.length
      ? Math.round((grown.length / (grown.length + withered.length)) * 100)
      : 0,
  }
}

export function unlockedAchievements(stats, earned = []) {
  return ACHIEVEMENTS.map((a) => ({ ...a, earned: earned.includes(a.id) || a.test(stats) }))
}

/** Forest level: every 5 trees opens a level, shown as a small badge. */
export function forestLevel(totalTrees) {
  const level = Math.floor((totalTrees || 0) / 5) + 1
  const into = (totalTrees || 0) % 5
  return { level, into, next: 5 - into, pct: Math.round((into / 5) * 100) }
}

/** Group trees for the forest view: today first, then by day. */
export function forestByDay(trees = [], days = 7, now = new Date()) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i)
    const key = dayKey(d)
    out.push({
      key,
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: i === 0,
      trees: trees.filter((t) => t.day === key && t.status === 'grown'),
      withered: trees.filter((t) => t.day === key && t.status === 'withered'),
    })
  }
  return out
}

export function forestToText(trees = [], lang = 'en') {
  const stats = forestStats(trees)
  const lines = [{
    en: '🌳 My study forest',
    hi: '🌳 मेरा स्टडी फ़ॉरेस्ट',
    te: '🌳 నా స్టడీ ఫారెస్ట్',
  }[lang], '']
  lines.push({
    en: `Trees: ${stats.total} · Minutes: ${stats.minutes} · Streak: ${stats.streak} day(s)`,
    hi: `पेड़: ${stats.total} · मिनट: ${stats.minutes} · स्ट्रीक: ${stats.streak} दिन`,
    te: `చెట్లు: ${stats.total} · నిమిషాలు: ${stats.minutes} · స్ట్రీక్: ${stats.streak} రోజులు`,
  }[lang], '')
  forestByDay(trees, 7).forEach((day) => {
    if (!day.trees.length && !day.withered.length) return
    lines.push(`${day.label}: ${day.trees.map((t) => speciesById(t.speciesId).emoji).join(' ')}${day.withered.length ? ` 🥀×${day.withered.length}` : ''}`)
  })
  return lines.join('\n')
}
