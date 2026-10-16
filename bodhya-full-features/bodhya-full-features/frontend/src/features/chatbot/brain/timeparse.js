// ============================================================
//  Natural-language time & repeat parsing for Bodhya's chat
//  commands — English, हिन्दी, తెలుగు, zero API keys.
//
//  "remind me to study maths at 7:30 am tomorrow"
//     → { time:'07:30', day:<tomorrow>, days:[], label:'study maths' }
//  "20 मिनट में पानी पीने का रिमाइंडर"
//     → { time:<now+20m>, days:[], relativeMinutes:20 }
//  "రోజూ ఉదయం 6 గంటలకు అలారం"
//     → { time:'06:00', days:[0..6] }
// ============================================================

export const DAY_WORDS = {
  en: { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3, thu: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 },
}

const DAYPART = {
  morning: '07:00', afternoon: '15:00', evening: '19:00', night: '21:30', tonight: '21:30', noon: '12:00',
}
const DAYPART_I18N = {
  hi: { 'सुबह': '07:00', 'दोपहर': '13:30', 'शाम': '18:30', 'रात': '21:30', 'दिन में': '13:00' },
  te: { 'ఉదయం': '07:00', 'మధ్యాహ్నం': '13:30', 'సాయంత్రం': '18:30', 'రాత్రి': '21:30' },
}

const REPEAT_EVERY_DAY = [
  /\bevery\s?day\b/i, /\bdaily\b/i, /रोज़/, /रोज/, /प्रतिदिन/, /हर\s?दिन/, /రోజూ/, /ప్రతిరోజూ/, /ప్రతి\s?రోజు/, /daily/i,
]
const REPEAT_WEEKDAYS = [/\bweekdays?\b/i, /सोमवार\s?से\s?शुक्रवार/, /वीकडे/, /సోమ.*శుక్ర/, /వారపు\s?రోజులు/, /\bmon\s?-\s?fri\b/i]
const REPEAT_WEEKEND = [/\bweekends?\b/i, /शनिवार.*रविवार/, /సప్తాహం\s?చివర/, /వారాంత/, /शनि.*रवि/]
const REPEAT_WEEKLY = [/\bevery\s?week\b/i, /\bweekly\b/i, /हर\s?हफ़्ते/, /हर\s?हफ्ते/, /साप्ताहिक/, /ప్రతి\s?వారం/, /వారానికి/]

const TOMORROW = [/\btomorrow\b/i, /कल/, /రేపు/, /रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार/]
const TODAY_WORDS = [/\btoday\b/i, /tonight/i, /आज/, /ईరోజు/, /ఈ\s?రోజు/, /न आज/, /ఈరోజు/]

/** minutes → "HH:MM" */
export function toHHMM(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function dayKeyOf(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/**
 * Pull a clock time out of a sentence.
 * @returns {null | {minutes:number, explicit:boolean, relativeMinutes:number|null, dayOffset:number}}
 */
export function parseWhen(text, { now = new Date() } = {}) {
  const t = String(text || '')
  const lower = t.toLowerCase()

  // ---- relative: "in 20 minutes" / "20 मिनट में" / "2 घंटे बाद" ----
  const relEn = /in\s+(\d+)\s*(minutes?|mins?|m|hours?|hrs?|h)\b/i.exec(lower)
  const relHi = /(\d+)\s*(मिनट|मिनिट|घंटे|घंटा|घंटों)\s*(में|बाद)/.exec(t)
  const relTe = /(\d+)\s*(నిమిషాల్లో|నిమిషంలో|నిమిషాలలో|గంటల్లో|గంటలో|నిమిషాల\s*తర్వాత|గంటల\s*తర్వాత)/.exec(t)
  const rel = relEn || relHi || relTe
  if (rel) {
    const n = Number(rel[1])
    const unit = (relEn ? rel[2] : relHi ? rel[2] : rel[2]) || ''
    const isHour = /hour|hr|^h$|घंट|గంట/.test(String(unit).toLowerCase())
    const isHourTe = /గంట/.test(String(unit))
    const isMinTe = /నిమిష/.test(String(unit))
    const mins = (isHour || (isHourTe && !isMinTe)) ? n * 60 : n
    const at = new Date(now.getTime() + mins * 60000)
    return { minutes: at.getHours() * 60 + at.getMinutes(), explicit: true, relativeMinutes: mins, dayOffset: 0 }
  }

  // ---- "half an hour" style ----
  if (/half an hour|आधा घंटा|अरगంట|అరగంట/.test(lower) || /आधा घंटा/.test(t) || /అరగంట/.test(t)) {
    const at = new Date(now.getTime() + 30 * 60000)
    return { minutes: at.getHours() * 60 + at.getMinutes(), explicit: true, relativeMinutes: 30, dayOffset: 0 }
  }

  // ---- explicit clock: "7", "7am", "7:30 pm", "19:45", "7 बजे" ----
  const clock12 = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/i.exec(lower)
  const clock24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(t)
  const clockBaje = /(\d{1,2})(?::(\d{2}))?\s*(बजे|వాజ్య|గంటలకు|గంటకు)/.exec(t)

  let minutes = null
  if (clock12) {
    let h = Number(clock12[1]) % 12
    if (/p/i.test(clock12[3])) h += 12
    minutes = h * 60 + Number(clock12[2] || 0)
  } else if (clock24) {
    minutes = Number(clock24[1]) * 60 + Number(clock24[2])
  } else if (clockBaje) {
    minutes = Number(clockBaje[1]) * 60 + Number(clockBaje[2] || 0)
  } else if (/\bat\s+(\d{1,2})\b/i.test(lower)) {
    const m = /\bat\s+(\d{1,2})\b/i.exec(lower)
    const h = Number(m[1])
    // bare hour: 1–7 means PM-ish for study reminders, 8–11 stays AM
    minutes = (h >= 1 && h <= 7 ? h + 12 : h) * 60
  }

  // ---- day part words adjust / provide the time ----
  let dayOffset = 0
  if (/\btomorrow\b/i.test(lower) || /कल/.test(t) || /రేపు/.test(t)) dayOffset = 1

  if (minutes == null) {
    const en = DAYPART[Object.keys(DAYPART).find((k) => new RegExp(`\\b${k}\\b`, 'i').test(lower))]
    if (en) minutes = Number(en.slice(0, 2)) * 60 + Number(en.slice(3))
    if (minutes == null) {
      for (const [lang, map] of Object.entries(DAYPART_I18N)) {
        void lang
        const key = Object.keys(map).find((k) => t.includes(k))
        if (key) { minutes = Number(map[key].slice(0, 2)) * 60 + Number(map[key].slice(3)); break }
      }
    }
  } else {
    // "7" + "evening" → shift into the right half of the day
    const part = Object.keys(DAYPART).find((k) => new RegExp(`\\b${k}\\b`, 'i').test(lower))
    const hiPart = Object.keys(DAYPART_I18N.hi).find((k) => t.includes(k))
    const tePart = Object.keys(DAYPART_I18N.te).find((k) => t.includes(k))
    const pmPart = part && /afternoon|evening|night|tonight/.test(part)
    const hiPm = hiPart && /दोपहर|शाम|रात/.test(hiPart)
    const tePm = tePart && /మధ్యాహ్నం|సాయంత్రం|రాత్రి/.test(tePart)
    if ((pmPart || hiPm || tePm) && minutes < 12 * 60) minutes += 12 * 60
  }

  if (minutes == null) return null
  return { minutes, explicit: true, relativeMinutes: null, dayOffset }
}

/** Repeat rule from words → alarm `days` array ([] = one time). */
export function parseRepeat(text) {
  const t = String(text || '')
  for (const re of REPEAT_WEEKDAYS) if (re.test(t)) return { days: [1, 2, 3, 4, 5], kind: 'weekdays' }
  for (const re of REPEAT_WEEKEND) if (re.test(t)) return { days: [0, 6], kind: 'weekend' }
  for (const re of REPEAT_EVERY_DAY) if (re.test(t)) return { days: [0, 1, 2, 3, 4, 5, 6], kind: 'daily' }
  // "every monday" → weekly on that weekday
  const dayMatch = /every\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i.exec(t)
  if (dayMatch) {
    return { days: [DAY_WORDS.en[dayMatch[1].toLowerCase()]], kind: 'weekly-day' }
  }
  for (const re of REPEAT_WEEKLY) if (re.test(t)) return { days: [], kind: 'weekly', weekly: true }
  return { days: [], kind: 'once' }
}

/** "30 min", "1.5 hours", "आधा घंटा" → minutes (null when absent). */
export function parseDuration(text) {
  const t = String(text || '')
  const h = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|घंटे|घंटा|గంటలు|గంట)\b/i.exec(t)
  if (h) return Math.round(Number(h[1]) * 60)
  const m = /(\d+)\s*(minutes?|mins?|min\b|मिनट|మినిష|నిమిష)/i.exec(t)
  if (m) return Number(m[1])
  if (/half an hour|आधा घंटा|అరగంట/.test(t)) return 30
  return null
}

/** Weekday mentioned in the text ("on friday" / "शुक्रवार" / "శుక్రవారం"). */
export function parseWeekday(text) {
  const t = String(text || '').toLowerCase()
  const en = /(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/.exec(t)
  if (en) return DAY_WORDS.en[en[1]]
  const hi = [['रविवार', 0], ['सोमवार', 1], ['मंगलवार', 2], ['बुधवार', 3], ['गुरुवार', 4], ['शुक्रवार', 5], ['शनिवार', 6]]
    .find(([w]) => t.includes(w))
  if (hi) return hi[1]
  const te = [['ఆదివారం', 0], ['సోమవారం', 1], ['మంగళవారం', 2], ['బుధవారం', 3], ['గురువారం', 4], ['శుక్రవారం', 5], ['శనివారం', 6]]
    .find(([w]) => t.includes(w))
  if (te) return te[1]
  return null
}

/** Next date (dayKey) for a weekday, starting from today. */
export function nextDateForWeekday(weekday, now = new Date()) {
  const d = new Date(now)
  const diff = ((weekday - d.getDay()) + 7) % 7
  d.setDate(d.getDate() + diff)
  return dayKeyOf(d)
}

const STRIP_WORDS = [
  // 1) the clock expression itself — must go before the words around it
  /\bat\s+\d{1,2}(\s*(am|pm|a\.m\.|p\.m\.))?\b/gi,
  /(सुबह|दोपहर|शाम|रात|आज|कल)\s*\d{1,2}(:\d{2})?/g,
  /(ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి|ఈరోజు|రేపు)\s*\d{1,2}(:\d{2})?/g,
  /\d{1,2}(:\d{2})?\s*(बजे|గంటలకు|గంటకు)/g,
  /\b\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)\b/gi,
  /\b\d{1,2}:\d{2}\b/g,
  /\b\d{1,2}\s*గంట\S{0,4}/g,
  /\b\d{1,2}\s*बजे/g,
  // 2) durations
  /(\d+)\s*(minutes?|mins?|min|hours?|hrs?|hr|मिनट|घंटे|घंटा|నిమిషాలు|నిమిషం|గంటలు|గంట)/gi,
  /(in|after)\s+\d+\s*(minutes?|mins?|hours?|hrs?)/gi,
  /(\d+)\s*(मिनट|घंटे|घंटा)?\s*(में|बाद)/g,
  /(\d+)\s*(నిమిషాల్లో|నిమిషంలో|గంటల్లో|గంటలో|తర్వాత)/g,
  // 3) trigger verbs / objects
  /\b(remind me to|remind me|set (an )?alarm( for)?|set a reminder( for)?|alarm for|add (a )?to[- ]?do( for)?|add (a )?task( for)?|todo|to[- ]?do( list)?|note down|mark|remember to|wake me up|wake me)\b/gi,
  /(अलार्म|रिमाइंडर|याद दिलाओ|याद दिलाना|जोड़ो|जोड़ दो|टू-डू|टास्क|काम|उठा दो|जगा दो)/g,
  /(అలారం|రిమైండర్|గుర్తు చేయి|గుర్తు చేయవా|జోడించు|టూ-డూ|టాస్క్|పని|లేపు)/g,
  // 4) time / repeat words
  /\b(at|by|in|on|tomorrow|today|tonight|morning|afternoon|evening|night|noon|every ?day|daily|weekdays?|weekends?|every week|weekly|am|pm)\b/gi,
  /(सुबह|दोपहर|शाम|रात|आज|कल|बजे|में|बाद|रोज़|रोज|हर दिन|प्रतिदिन)/g,
  /(ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి|ఈరోజు|రేపు|గంటలకు|గంటకు|తర్వాత|రోజూ|ప్రతిరోజూ)/g,
  // 5) filler
  /\b(to|for|me|my|please|pls|a|an|the|it)\b/gi,
  /(के लिए|को|का|की|मेरा|मेरी|कृपया|वाला|वाली)/g,
  /(కోసం|కి|నా|దయచేసి)/g,
]

/** Remove trigger/time/repeat words so the rest can be used as a label. */
export function stripTimeWords(text) {
  let s = String(text || '')
  STRIP_WORDS.forEach((re) => { s = s.replace(re, ' ') })
  return s.replace(/[।|,.;!?]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Convenience: full parse for a reminder/alarm sentence. */
export function parseReminderSentence(text, { now = new Date() } = {}) {
  const when = parseWhen(text, { now })
  const repeat = parseRepeat(text)
  const duration = parseDuration(text)
  const weekday = parseWeekday(text)
  const label = stripTimeWords(text)
  return { when, repeat, duration, weekday, label }
}
