// ---------- Bodhya chat engine: intent scoring + actions (no APIs, no topic tutoring) ----------

import { INTENTS, FALLBACK_ID } from './intents.js'
import { buildReply } from './responses.js'
import { detectLangOf } from '../i18n/ui.js'
import { addTask, loadState, updateMemory } from './memory.js'

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

export function think(rawText, extra = {}) {
  const state = loadState()
  const { profile, memory, tasks } = state
  const langDetected = detectLangOf(rawText)
  // If user typed in another supported language, chat back in it (adaptive!)
  const lang = langDetected !== 'en' ? langDetected : (profile.lang || 'en')
  const tone = resolveTone(profile)
  const name = profile.name || (lang === 'hi' ? 'दोस्त' : lang === 'te' ? 'స్నేహితుడా' : 'friend')
  const context = extra.context || 'home'

  const cleaned = clean(rawText)
  const chatState = { lang, tone, name, context, memory, tasks, profile, session: state.session }

  // --- Intent scoring (priority breaks ties toward specific intents) ---
  let best = { id: FALLBACK_ID, score: 0 }
  for (const intent of INTENTS) {
    const s = scoreIntent(intent, cleaned, lang)
    const total = s > 0 ? s + intent.pri : 0
    if (total > best.score) best = { id: intent.id, score: total }
  }

  let intentId = best.score >= 1.3 ? best.id : FALLBACK_ID

  // --- Planner add: parse subject + duration (order-agnostic for hi/te) ---
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
    // no parseable task → fall through to planner_info style guidance
    intentId = 'planner_info'
  }

  // --- Standard reply ---
  const reply = buildReply(intentId, chatState)
  updateMemory({ chatCount: memory.chatCount + 1 })
  return { ...reply, lang }
}
