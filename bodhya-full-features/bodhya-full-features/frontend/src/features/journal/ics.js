// ============================================================
//  📅 Calendar export (.ics) — pure, no dependencies.
//
//  Two things get exported:
//    💌 letters  → an all-day event on the unlock date, with a
//                  9 AM reminder, so the letter surfaces even if
//                  Bodhya is not open that day.
//    📅 plan sessions → timed events for a study timetable.
//
//  Privacy rule for letters: the calendar file NEVER contains the
//  letter's words. A calendar entry is stored on someone else's
//  server (Google/Apple/Outlook) — so the event only says that a
//  letter opens, and links back to the app to read it.
//
//  RFC 5545 details handled here: CRLF line endings, 75-octet line
//  folding, TEXT escaping, UID/DTSTAMP, all-day (VALUE=DATE) vs
//  floating local time, and VALARM reminders.
// ============================================================

const PRODID = '-//Bodhya//Study Companion//EN'

/** Escape a TEXT value per RFC 5545 §3.3.11. */
export function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/** Fold long lines at 75 octets (continuation lines start with a space). */
export function foldLine(line) {
  const bytes = utf8Bytes(line)
  if (bytes.length <= 75) return line
  const out = []
  let current = ''
  let count = 0
  let first = true
  for (const ch of String(line)) {
    const size = utf8Bytes(ch).length
    const limit = first ? 75 : 74
    if (count + size > limit) {
      out.push(current)
      current = ''
      count = 0
      first = false
    }
    current += ch
    count += size
  }
  if (current) out.push(current)
  return out.map((part, i) => (i === 0 ? part : ` ${part}`)).join('\r\n')
}

function utf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str)
  // eslint-disable-next-line no-control-regex
  return unescape(encodeURIComponent(str))
}

/** "2026-12-17" → "20261217" (all-day) */
export function dateValue(dayIso) {
  return String(dayIso || '').replace(/-/g, '')
}

/** "2026-12-17" + "17:30" → "20261217T173000" (floating local time) */
export function dateTimeValue(dayIso, hhmm = '17:00') {
  const [h, m] = String(hhmm || '17:00').split(':').map(Number)
  return `${dateValue(dayIso)}T${String(h || 0).padStart(2, '0')}${String(m || 0).padStart(2, '0')}00`
}

export function stampNow(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`
}

/** A stable-enough UID: the app prefix + the item id. */
export function uidFor(kind, id) {
  return `${kind}-${String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60)}@bodhya.app`
}

/** Does an all-day event need an exclusive end date? Yes: DTEND is the next day. */
export function nextDay(dayIso) {
  const [y, m, d] = String(dayIso).split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  dt.setUTCDate(dt.getUTCDate() + 1)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

/**
 * Build a VEVENT.
 * @param {{uid:string, day:string, start?:string, minutes?:number, allDay?:boolean,
 *          summary:string, description?:string, location?:string, reminderMinutes?:number,
 *          alarms?:Array<{minutes:number, description?:string}>, url?:string}} opts
 */
export function vevent(opts = {}) {
  const {
    uid, day, start = null, minutes = 0, allDay = false,
    summary = 'Bodhya event', description = '', location = '',
    alarms = [], url = '', status = 'CONFIRMED',
  } = opts
  const lines = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stampNow()}`]
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateValue(day)}`)
    lines.push(`DTEND;VALUE=DATE:${dateValue(nextDay(day))}`)
  } else {
    lines.push(`DTSTART:${dateTimeValue(day, start || '17:00')}`)
    const end = addMinutes(start || '17:00', Math.max(5, minutes || 30))
    lines.push(`DTEND:${dateTimeValue(day, end)}`)
  }
  lines.push(`SUMMARY:${escapeText(summary)}`)
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`)
  if (location) lines.push(`LOCATION:${escapeText(location)}`)
  if (url) lines.push(`URL:${escapeText(url)}`)
  lines.push(`STATUS:${status}`)
  lines.push('TRANSP:TRANSPARENT')          // study blocks must not mark you busy
  lines.push('BEGIN:VALARM', 'ACTION:DISPLAY')
  const first = alarms[0] || { minutes: allDay ? 0 : 10 }
  if (allDay) {
    // all-day events: alarm relative to the day the event starts
    lines.push(`TRIGGER;VALUE=DATE-TIME:${dateTimeValue(day, '09:00')}`)
  } else {
    lines.push(`TRIGGER:-PT${Math.max(0, Number(first.minutes) || 10)}M`)
  }
  lines.push(`DESCRIPTION:${escapeText(first.description || summary)}`)
  lines.push('END:VALARM')
  lines.push('END:VEVENT')
  return lines
}

export function addMinutes(hhmm, minutes) {
  const [h, m] = String(hhmm).split(':').map(Number)
  const total = ((h || 0) * 60 + (m || 0) + Number(minutes || 0) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Wrap VEVENT lines into a VCALENDAR. */
export function calendar(events = [], { name = 'Bodhya' } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
  ]
  events.forEach((ev) => lines.push(...ev))
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

// ----------------------------------------------------------------
//  Letters 💌
// ----------------------------------------------------------------
/**
 * One letter → an all-day event on its unlock date.
 * The body is intentionally absent: a calendar is not a private place.
 */
export function letterEvent(letter, lang = 'en', { url = '' } = {}) {
  const summary = {
    en: '💌 A letter from your past self opens',
    hi: '💌 पिछले आप की चिट्ठी खुलती है',
    te: '💌 గత మీరు రాసిన ఉత్తరం తెరుచుకుంటుంది',
  }[lang]
  const sealedOn = letter.writtenAt ? new Date(letter.writtenAt).toLocaleDateString() : ''
  const description = [
    {
      en: `Sealed on ${sealedOn} · ${letter.words || 0} words waiting.`,
      hi: `${sealedOn} को सील की गई · ${letter.words || 0} शब्द इंतज़ार में।`,
      te: `${sealedOn}న ముద్రించారు · ${letter.words || 0} పదాలు వేచి ఉన్నాయి.`,
    }[lang],
    letter.promise
      ? { en: `A promise you made: “${letter.promise}”`, hi: `आपका वादा: “${letter.promise}”`, te: `మీరు చేసిన మాట: “${letter.promise}”` }[lang]
      : '',
    { en: 'Open Bodhya → Journal → Letters to read it.', hi: 'पढ़ने के लिए Bodhya → जर्नल → चिट्ठियाँ खोलिए।', te: 'చదవడానికి Bodhya → జర్నల్ → ఉత్తరాలు తెరవండి.' }[lang],
    { en: '(The words stay out of this calendar on purpose.)', hi: '(शब्द जान-बूझकर इस कैलेंडर में नहीं हैं।)', te: '(పదాలు ఉద్దేశపూర్వకంగా ఈ క్యాలెండర్‌లో లేవు.)' }[lang],
  ].filter(Boolean).join('\n')
  return vevent({
    uid: uidFor('letter', letter.id),
    day: letter.unlockAt,
    allDay: true,
    summary,
    description,
    location: 'Bodhya · Journal',
    url,
    alarms: [{ minutes: 0, description: summary }],
  })
}

export function lettersCalendar(letters = [], { lang = 'en', url = '', name = 'Bodhya letters' } = {}) {
  const events = letters
    .filter((l) => l.unlockAt)
    .sort((a, b) => (a.unlockAt < b.unlockAt ? -1 : 1))
    .map((l) => letterEvent(l, lang, { url }))
  return calendar(events, { name })
}

// ----------------------------------------------------------------
//  Study-plan sessions 📅
// ----------------------------------------------------------------
export function sessionEvent(session, lang = 'en', { url = '' } = {}) {
  const typeLabel = {
    study: { en: 'Study', hi: 'अध्ययन', te: 'చదువు' },
    revision: { en: 'Revision', hi: 'रिवीज़न', te: 'రివిజన్' },
    practice: { en: 'Practice', hi: 'अभ्यास', te: 'ప్రాక్టీస్' },
    test: { en: 'Mock test', hi: 'मॉक टेस्ट', te: 'మాక్ టెస్ట్' },
  }[session.type || 'study']?.[lang] || session.type
  const summary = `📘 ${session.subjectName}${session.topic ? ` — ${session.topic}` : ''}`
  const description = [
    `${typeLabel} · ${session.minutes} min`,
    { en: 'Bodhya will log the session and grow a tree when you finish.', hi: 'पूरा होने पर Bodhya सत्र दर्ज करेगा और पेड़ उगाएगा।', te: 'పూర్తయ్యాక Bodhya సెషన్ నమోదు చేసి చెట్టు పెంచుతుంది.' }[lang],
  ].join('\n')
  return vevent({
    uid: uidFor('session', session.id || `${session.day}-${session.startTime}-${session.subjectName}`),
    day: session.day,
    start: session.startTime,
    minutes: session.minutes,
    summary,
    description,
    location: 'Bodhya · Study plan',
    url,
    alarms: [{ minutes: 10, description: summary }],
  })
}

export function sessionsCalendar(sessions = [], { lang = 'en', url = '', name = 'Bodhya study plan' } = {}) {
  const events = sessions
    .filter((s) => s.day && !s.done)
    .sort((a, b) => (a.day === b.day ? (a.startTime < b.startTime ? -1 : 1) : a.day < b.day ? -1 : 1))
    .map((s) => sessionEvent(s, lang, { url }))
  return calendar(events, { name })
}

/** Filename convention so calendars can tell exports apart. */
export function icsFilename(kind = 'letters', day = new Date().toISOString().slice(0, 10)) {
  return `bodhya-${kind}-${day}.ics`
}

/** Quick sanity check used by the UI before offering a download. */
export function icsStats(ics) {
  const events = (String(ics).match(/BEGIN:VEVENT/g) || []).length
  const alarms = (String(ics).match(/BEGIN:VALARM/g) || []).length
  return { events, alarms, bytes: utf8Bytes(ics).length }
}
