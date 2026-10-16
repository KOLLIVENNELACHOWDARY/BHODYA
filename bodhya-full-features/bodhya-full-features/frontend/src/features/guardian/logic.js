// ============================================================
//  Guardian logic — a *consensual*, read-only progress view.
//
//  Design rules (deliberate, not accidental):
//   1. The student owns the switch. Nothing is shared until they turn
//      it on, they choose each section, and they can revoke the code.
//   2. Journal text is OFF by default and shared separately from the
//      mood chart — writing is private unless explicitly opened.
//   3. The student can always preview exactly what the guardian sees.
//   4. No covert monitoring: a guardian needs a code the student gave
//      them, and the grant has a visible "last shared" timestamp.
//
//  Pure functions only — the store gathers the data, this shapes and
//  redacts it, so the rules are unit-testable.
// ============================================================

export const SECTIONS = [
  {
    id: 'studyTime', emoji: '⏱️', default: true,
    label: { en: 'Study time', hi: 'पढ़ाई का समय', te: 'చదువు సమయం' },
    detail: { en: 'Minutes focused today, this week and the daily goal.', hi: 'आज, इस हफ़्ते के मिनट और रोज़ का लक्ष्य।', te: 'నేటి, ఈ వారం నిమిషాలు, రోజు లక్ష్యం.' },
  },
  {
    id: 'tasks', emoji: '✅', default: true,
    label: { en: 'To-do progress', hi: 'टू-डू प्रगति', te: 'టూ-డూ పురోగతి' },
    detail: { en: 'How many tasks are done, open or overdue. Task titles stay private.', hi: 'कितने काम पूरे, बाकी या बीत चुके। काम के नाम निजी रहते हैं।', te: 'ఎన్ని పనులు పూర్తి, పెండింగ్, ఆలస్యం. పనుల పేర్లు ప్రైవేట్.' },
  },
  {
    id: 'plan', emoji: '📅', default: true,
    label: { en: 'Study plan & exam', hi: 'स्टडी प्लान और परीक्षा', te: 'స్టడీ ప్లాన్ & పరీక్ష' },
    detail: { en: 'Exam countdown and how much of the plan is finished.', hi: 'परीक्षा काउंटडाउन और प्लान कितना पूरा हुआ।', te: 'పరీక్ష కౌంట్‌డౌన్, ప్లాన్ ఎంత పూర్తయింది.' },
  },
  {
    id: 'forest', emoji: '🌳', default: true,
    label: { en: 'Study forest & streaks', hi: 'स्टडी फ़ॉरेस्ट और स्ट्रीक', te: 'స్టడీ ఫారెస్ట్ & స్ట్రీక్' },
    detail: { en: 'Trees grown, trees lost and the day streak.', hi: 'उगे पेड़, मुरझाए पेड़ और दिन की स्ट्रीक।', te: 'పెరిగిన, వాడిపోయిన చెట్లు, స్ట్రీక్.' },
  },
  {
    id: 'shield', emoji: '🛡️', default: true,
    label: { en: 'Focus shield summary', hi: 'फोकस शील्ड सार', te: 'ఫోకస్ షీల్డ్ సారాంశం' },
    detail: { en: 'Blocked-site count and how many sessions were distraction-free.', hi: 'ब्लॉक साइटों की संख्या और कितने सत्र बिना भटकाव रहे।', te: 'బ్లాక్ చేసిన సైట్లు, డిస్ట్రాక్షన్ లేని సెషన్లు.' },
  },
  {
    id: 'journalMood', emoji: '🙂', default: true,
    label: { en: 'Mood trend (no text)', hi: 'मूड रुझान (पाठ नहीं)', te: 'మూడ్ ధోరణి (వచనం లేదు)' },
    detail: { en: 'Only the mood numbers and writing streak — never what was written.', hi: 'सिर्फ़ मूड के आँकड़े और लेखन स्ट्रीक — लिखा हुआ कभी नहीं।', te: 'మూడ్ సంఖ్యలు, రచన స్ట్రీక్ మాత్రమే — రాసినది ఎప్పటికీ కాదు.' },
  },
  {
    id: 'journalText', emoji: '📔', default: false,
    label: { en: 'Journal entries (private by default)', hi: 'जर्नल प्रविष्टियाँ (डिफ़ॉल्ट निजी)', te: 'జర్నల్ ఎంట్రీలు (డిఫాల్ట్ ప్రైవేట్)' },
    detail: { en: 'Off unless the student turns it on. This is their diary — most people leave it closed.', hi: 'जब तक छात्र चालू न करे, बंद। यह उसकी डायरी है — ज़्यादातर इसे बंद ही रखते हैं।', te: 'విద్యార్థి ఆన్ చేస్తే తప్ప బంద్. ఇది వారి డైరీ — చాలామంది బందే ఉంచుతారు.' },
  },
  {
    id: 'letters', emoji: '💌', default: false,
    label: { en: 'Letters to future self', hi: 'भविष्य को चिट्ठियाँ', te: 'భవిష్యత్తుకు ఉత్తరాలు' },
    detail: { en: 'Only that letters exist and when they open — never the words.', hi: 'बस इतना कि चिट्ठियाँ हैं और कब खुलेंगी — शब्द कभी नहीं।', te: 'ఉత్తరాలు ఉన్నాయి, ఎప్పుడు తెరుచుకుంటాయి — పదాలు ఎప్పటికీ కాదు.' },
  },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)
export const PRIVATE_BY_DEFAULT = SECTIONS.filter((s) => !s.default).map((s) => s.id)

export function defaultSections() {
  return SECTIONS.filter((s) => s.default).map((s) => s.id)
}

export function sectionById(id) {
  return SECTIONS.find((s) => s.id === id) || null
}

/** 6-char code the student hands to their guardian. Avoids look-alikes. */
export function makeShareCode(rnd = Math.random) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   // no I/O/0/1
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(rnd() * alphabet.length)]
  return code
}

export function normaliseCode(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function isValidCodeFormat(input) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(normaliseCode(input))
}

/** Can this guardian view be opened right now? */
export function grantStatus(grant, now = new Date()) {
  if (!grant || !grant.code) return { ok: false, reason: 'no-grant' }
  if (!grant.active) return { ok: false, reason: 'paused' }
  if (grant.expiresAt && new Date(grant.expiresAt).getTime() < now.getTime()) return { ok: false, reason: 'expired' }
  return { ok: true, reason: 'active' }
}

export function codeMatches(grant, code) {
  if (!grant?.code) return false
  return normaliseCode(code) === normaliseCode(grant.code)
}

// ----------------------------------------------------------------
//  report building
// ----------------------------------------------------------------
export const SECTION_STATUS = {
  good: { emoji: '🟢', label: { en: 'on track', hi: 'ठीक चल रहा है', te: 'బాగుంది' } },
  watch: { emoji: '🟡', label: { en: 'worth a look', hi: 'ध्यान देने योग्य', te: 'గమనించదగినది' } },
  low: { emoji: '🔴', label: { en: 'needs support', hi: 'सहायता चाहिए', te: 'సహాయం కావాలి' } },
}

function statusFor(ratio) {
  if (ratio >= 0.75) return 'good'
  if (ratio >= 0.4) return 'watch'
  return 'low'
}

/**
 * Shape a snapshot into the guardian report.
 * @param {object} snapshot  raw numbers (gathered by store.js)
 * @param {string[]} allowed  section ids the student shared
 */
export function buildReport(snapshot = {}, allowed = defaultSections(), lang = 'en') {
  const has = (id) => allowed.includes(id)
  const sections = []

  if (has('studyTime')) {
    const goal = snapshot.goalMinutes || 120
    const today = snapshot.minutesToday || 0
    const week = snapshot.minutesWeek || 0
    sections.push({
      id: 'studyTime',
      status: statusFor(goal ? today / goal : 0),
      headline: {
        en: `${Math.round(today)} min focused today (goal ${Math.round(goal)} min)`,
        hi: `आज ${Math.round(today)} मिनट फोकस (लक्ष्य ${Math.round(goal)} मिनट)`,
        te: `ఈరోజు ${Math.round(today)} నిమిషాల ఫోకస్ (లక్ష్యం ${Math.round(goal)})`,
      }[lang],
      rows: [
        { label: { en: 'This week', hi: 'इस हफ़्ते', te: 'ఈ వారం' }[lang], value: `${Math.round(week / 60 * 10) / 10}h` },
        { label: { en: 'Sessions today', hi: 'आज के सत्र', te: 'నేటి సెషన్లు' }[lang], value: String(snapshot.sessionsToday || 0) },
        { label: { en: 'Study streak', hi: 'स्टडी स्ट्रीक', te: 'స్టడీ స్ట్రీక్' }[lang], value: `🔥 ${snapshot.studyStreak || 0}` },
      ],
    })
  }

  if (has('tasks')) {
    const done = snapshot.tasksDone || 0
    const total = snapshot.tasksTotal || 0
    const overdue = snapshot.tasksOverdue || 0
    sections.push({
      id: 'tasks',
      status: overdue >= 3 ? 'low' : overdue ? 'watch' : statusFor(total ? done / total : 1),
      headline: {
        en: total ? `${done} of ${total} tasks done today` : 'No tasks due today',
        hi: total ? `आज ${total} में से ${done} काम पूरे` : 'आज कोई काम नहीं',
        te: total ? `ఈరోజు ${total}లో ${done} పనులు పూర్తి` : 'ఈరోజు పనులు లేవు',
      }[lang],
      rows: [
        { label: { en: 'Open', hi: 'बाकी', te: 'పెండింగ్' }[lang], value: String(snapshot.tasksOpen || 0) },
        { label: { en: 'Overdue', hi: 'बीत चुके', te: 'గడువు దాటినవి' }[lang], value: String(overdue) },
      ],
      note: { en: 'Task titles are private.', hi: 'काम के नाम निजी हैं।', te: 'పనుల పేర్లు ప్రైవేట్.' }[lang],
    })
  }

  if (has('plan')) {
    const countdown = snapshot.examDays
    const done = snapshot.planDone || 0
    const total = snapshot.planSessions || 0
    sections.push({
      id: 'plan',
      status: total ? statusFor(done / total) : 'watch',
      headline: countdown != null && countdown >= 0
        ? { en: `Exam in ${countdown} day${countdown === 1 ? '' : 's'}`, hi: `परीक्षा ${countdown} दिन में`, te: `పరీక్ష ${countdown} రోజుల్లో` }[lang]
        : { en: 'No exam date set', hi: 'परीक्षा की तारीख़ तय नहीं', te: 'పరీక్ష తేదీ లేదు' }[lang],
      rows: [
        { label: { en: "Today's sessions", hi: 'आज के सत्र', te: 'నేటి సెషన్లు' }[lang], value: `${done}/${total}` },
        { label: { en: 'Plan finished', hi: 'प्लान पूरा', te: 'ప్లాన్ పూర్తి' }[lang], value: `${snapshot.planPercent || 0}%` },
      ],
    })
  }

  if (has('forest')) {
    const grown = snapshot.treesGrown || 0
    const lost = snapshot.treesLost || 0
    sections.push({
      id: 'forest',
      status: lost > grown ? 'watch' : 'good',
      headline: { en: `${grown} tree${grown === 1 ? '' : 's'} grown, ${lost} lost`, hi: `${grown} पेड़ उगे, ${lost} मुरझाए`, te: `${grown} చెట్లు పెరిగాయి, ${lost} వాడిపోయాయి` }[lang],
      rows: [
        { label: { en: 'Streak', hi: 'स्ट्रीक', te: 'స్ట్రీక్' }[lang], value: `🔥 ${snapshot.forestStreak || 0}` },
        { label: { en: 'Longest session', hi: 'सबसे लंबा सत्र', te: 'అతి పొడవు సెషన్' }[lang], value: `${snapshot.longestSession || 0} min` },
      ],
      note: {
        en: 'A tree withers when a session is abandoned — it is the deal that makes focus real.',
        hi: 'सत्र बीच में छूटे तो पेड़ मुरझाता है — यही सौदा फोकस को असली बनाता है।',
        te: 'సెషన్ వదిలేస్తే చెట్టు వాడిపోతుంది — ఇదే ఫోకస్‌ను నిజం చేస్తుంది.',
      }[lang],
    })
  }

  if (has('shield')) {
    const clean = snapshot.cleanRate || 0
    sections.push({
      id: 'shield',
      status: statusFor(clean / 100),
      headline: { en: `${clean}% of sessions distraction-free`, hi: `${clean}% सत्र बिना भटकाव`, te: `${clean}% సెషన్లు డిస్ట్రాక్షన్ లేకుండా` }[lang],
      rows: [
        { label: { en: 'Sites blocked', hi: 'ब्लॉक साइटें', te: 'బ్లాక్ సైట్లు' }[lang], value: String(snapshot.blockedSites || 0) },
        { label: { en: 'Urges resisted', hi: 'रोकी इच्छाएँ', te: 'ఆపిన కోరికలు' }[lang], value: `💪 ${snapshot.urgesResisted || 0}` },
        { label: { en: 'Break minutes', hi: 'ब्रेक मिनट', te: 'విరామ నిమిషాలు' }[lang], value: String(snapshot.breakMinutes || 0) },
      ],
    })
  }

  if (has('journalMood')) {
    sections.push({
      id: 'journalMood',
      status: snapshot.moodTrend === 'down' ? 'watch' : 'good',
      headline: {
        en: `Average mood ${snapshot.avgMood || 0}/5 over ${snapshot.journalDays || 0} entries`,
        hi: `${snapshot.journalDays || 0} प्रविष्टियों में औसत मूड ${snapshot.avgMood || 0}/5`,
        te: `${snapshot.journalDays || 0} ఎంట్రీల్లో సగటు మూడ్ ${snapshot.avgMood || 0}/5`,
      }[lang],
      rows: [
        { label: { en: 'Writing streak', hi: 'लेखन स्ट्रीक', te: 'రచన స్ట్రీక్' }[lang], value: `🔥 ${snapshot.journalStreak || 0}` },
        { label: { en: 'Trend (14 days)', hi: 'रुझान (14 दिन)', te: 'ధోరణి (14 రోజులు)' }[lang], value: snapshot.moodTrend === 'up' ? '📈' : snapshot.moodTrend === 'down' ? '📉' : '➖' },
      ],
      note: {
        en: 'Mood numbers only — the journal itself stays private.',
        hi: 'सिर्फ़ मूड आँकड़े — जर्नल निजी रहता है।',
        te: 'మూడ్ సంఖ్యలు మాత్రమే — జర్నల్ ప్రైవేట్‌గా ఉంటుంది.',
      }[lang],
    })
  }

  if (has('journalText')) {
    const entries = (snapshot.journalEntries || []).slice(0, 5)
    sections.push({
      id: 'journalText',
      status: 'good',
      headline: {
        en: entries.length ? `${entries.length} recent entr${entries.length === 1 ? 'y' : 'ies'} shared by the student` : 'No entries shared yet',
        hi: entries.length ? `छात्र ने ${entries.length} हाल की प्रविष्टियाँ साझा कीं` : 'अभी कोई प्रविष्टि साझा नहीं',
        te: entries.length ? `విద్యార్థి ${entries.length} ఎంట్రీలు పంచారు` : 'ఇంకా ఎంట్రీలు పంచలేదు',
      }[lang],
      entries: entries.map((e) => ({ day: e.day, mood: e.mood, text: e.text })),
      note: {
        en: 'Only visible because the student chose to share it.',
        hi: 'यह इसलिए दिख रहा है क्योंकि छात्र ने साझा करना चुना।',
        te: 'విద్యార్థి పంచాలని ఎంచుకున్నందుకే ఇది కనిపిస్తోంది.',
      }[lang],
    })
  }

  if (has('letters')) {
    sections.push({
      id: 'letters',
      status: 'good',
      headline: {
        en: `${snapshot.lettersSealed || 0} sealed letter${snapshot.lettersSealed === 1 ? '' : 's'} to their future self`,
        hi: `भविष्य के लिए ${snapshot.lettersSealed || 0} सीलबंद चिट्ठियाँ`,
        te: `భవిష్యత్తుకు ${snapshot.lettersSealed || 0} ముద్రిత ఉత్తరాలు`,
      }[lang],
      rows: snapshot.nextLetterAt
        ? [{ label: { en: 'Next opens', hi: 'अगली खुलेगी', te: 'తదుపరి తెరుచుకుంటుంది' }[lang], value: snapshot.nextLetterAt }]
        : [],
      note: {
        en: 'The letters themselves are never shown here.',
        hi: 'चिट्ठियाँ ख़ुद यहाँ कभी नहीं दिखतीं।',
        te: 'ఉత్తరాలు ఇక్కడ ఎప్పటికీ కనిపించవు.',
      }[lang],
    })
  }

  const score = Math.round(
    sections.reduce((a, s) => a + ({ good: 100, watch: 60, low: 25 }[s.status] || 50), 0) / Math.max(1, sections.length),
  )

  return {
    sections,
    summary: {
      en: `${sections.length} section${sections.length === 1 ? '' : 's'} shared · overall ${score}/100`,
      hi: `${sections.length} भाग साझा · कुल ${score}/100`,
      te: `${sections.length} విభాగాలు పంచారు · మొత్తం ${score}/100`,
    }[lang],
    score,
    sharedAt: snapshot.at || Date.now(),
    highlights: buildHighlights(snapshot, lang),
    noneShared: sections.length === 0,
  }
}

/** Two or three plain-language lines a guardian actually reads. */
export function buildHighlights(snapshot = {}, lang = 'en') {
  const out = []
  const { minutesToday = 0, goalMinutes = 120, tasksOverdue = 0, cleanRate = 0, moodTrend = 'flat', examDays = null } = snapshot

  if (minutesToday >= goalMinutes) {
    out.push({ en: 'They hit their study goal today. 🎉', hi: 'आज उन्होंने पढ़ाई का लक्ष्य पूरा किया। 🎉', te: 'ఈరోజు వారు లక్ష్యం చేరుకున్నారు. 🎉' }[lang])
  } else if (minutesToday > 0) {
    out.push({ en: `They studied ${Math.round(minutesToday)} of their ${Math.round(goalMinutes)}-minute goal — almost there.`, hi: `${Math.round(goalMinutes)} में से ${Math.round(minutesToday)} मिनट पढ़ा — थोड़ा और।`, te: `${Math.round(goalMinutes)}లో ${Math.round(minutesToday)} నిమిషాలు — కొంచెం మిగిలింది.` }[lang])
  } else {
    out.push({ en: 'No study logged today yet. A gentle nudge works better than a lecture.', hi: 'आज अभी पढ़ाई दर्ज नहीं। डाँट से बेहतर है हल्का-सा याद दिलाना।', te: 'ఈరోజు ఇంకా చదువు నమోదు కాలేదు. గద్దింపు కంటే మృదు గుర్తుచేయడం మేలు.' }[lang])
  }
  if (tasksOverdue > 0) {
    out.push({ en: `${tasksOverdue} task${tasksOverdue === 1 ? '' : 's'} overdue — worth asking if they need help planning.`, hi: `${tasksOverdue} काम बीत चुके — पूछिए कि योजना में मदद चाहिए या नहीं।`, te: `${tasksOverdue} పనులు ఆలస్యం — ప్లానింగ్ సహాయం కావాలా అడగండి.` }[lang])
  }
  if (cleanRate && cleanRate < 50) {
    out.push({ en: 'Focus sessions were often interrupted — the phone is likely the battle right now.', hi: 'फोकस सत्र बार-बार टूटे — अभी लड़ाई फ़ोन से है।', te: 'ఫోకస్ సెషన్లు తరచూ భంగమయ్యాయి — ఇప్పుడు పోరాటం ఫోన్‌తోనే.' }[lang])
  }
  if (moodTrend === 'down') {
    out.push({ en: 'Their mood has been dipping. Ask about the day, not the marks.', hi: 'मूड गिर रहा है। अंकों के बजाय दिन के बारे में पूछिए।', te: 'మూడ్ తగ్గుతోంది. మార్కుల గురించి కాదు, రోజు గురించి అడగండి.' }[lang])
  }
  if (examDays != null && examDays >= 0 && examDays <= 7) {
    out.push({ en: `Exam in ${examDays} day${examDays === 1 ? '' : 's'} — quiet support and sleep matter most now.`, hi: `परीक्षा ${examDays} दिन में — अब शांत साथ और नींद सबसे ज़रूरी।`, te: `పరీక్ష ${examDays} రోజుల్లో — ప్రశాంత తోడు, నిద్ర ముఖ్యం.` }[lang])
  }
  return out.slice(0, 4)
}

// ----------------------------------------------------------------
//  exports
// ----------------------------------------------------------------
export function reportToText(report, { studentName = '', lang = 'en' } = {}) {
  const head = {
    en: `Bodhya guardian report${studentName ? ` — ${studentName}` : ''}`,
    hi: `Bodhya अभिभावक रिपोर्ट${studentName ? ` — ${studentName}` : ''}`,
    te: `Bodhya గార్డియన్ రిపోర్ట్${studentName ? ` — ${studentName}` : ''}`,
  }[lang]
  const lines = [head, new Date(report.sharedAt).toLocaleString(), report.summary, '']
  if (report.noneShared) {
    lines.push({ en: 'Nothing is shared right now.', hi: 'अभी कुछ साझा नहीं है।', te: 'ఇప్పుడు ఏదీ పంచబడలేదు.' }[lang])
  }
  report.highlights.forEach((h) => lines.push(`• ${h}`))
  lines.push('')
  report.sections.forEach((s) => {
    lines.push(`${SECTION_STATUS[s.status]?.emoji || ''} ${s.headline}`)
    ;(s.rows || []).forEach((r) => lines.push(`   ${r.label}: ${r.value}`))
    ;(s.entries || []).forEach((e) => lines.push(`   ${e.day}: ${String(e.text).slice(0, 160)}`))
    if (s.note) lines.push(`   (${s.note})`)
    lines.push('')
  })
  lines.push({
    en: 'This report was shared by the student and can be revoked by them at any time.',
    hi: 'यह रिपोर्ट छात्र ने साझा की है और वह कभी भी रोक सकता है।',
    te: 'ఈ రిపోర్ట్‌ను విద్యార్థి పంచారు, వారు ఎప్పుడైనా ఆపవచ్చు.',
  }[lang])
  return lines.join('\n')
}

/** Self-contained, printable HTML (no external assets) for email/print. */
export function reportToHtml(report, { studentName = '', lang = 'en', code = '' } = {}) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const title = `Bodhya guardian report${studentName ? ` — ${esc(studentName)}` : ''}`
  const rows = report.sections.map((s) => `
    <section style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin:12px 0;background:#fff">
      <div style="font-weight:800;color:#0f172a">${SECTION_STATUS[s.status]?.emoji || ''} ${esc(s.headline)}</div>
      ${(s.rows || []).map((r) => `<div style="color:#475569;font-size:14px;margin-top:4px">${esc(r.label)}: <strong>${esc(r.value)}</strong></div>`).join('')}
      ${(s.entries || []).map((e) => `<div style="color:#334155;font-size:14px;margin-top:6px"><em>${esc(e.day)}</em> — ${esc(String(e.text).slice(0, 240))}</div>`).join('')}
      ${s.note ? `<div style="color:#94a3b8;font-size:12px;margin-top:6px">${esc(s.note)}</div>` : ''}
    </section>`).join('')

  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <main style="max-width:720px;margin:0 auto">
    <h1 style="font-size:22px;margin:0 0 4px">🌳 ${title}</h1>
    <p style="color:#64748b;margin:0 0 12px;font-size:13px">${esc(new Date(report.sharedAt).toLocaleString())}${code ? ` · code ${esc(code)}` : ''}</p>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:12px;font-weight:700;color:#065f46">${esc(report.summary)}</div>
    <ul style="color:#334155;font-size:14px">${report.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
    ${report.noneShared ? `<p style="color:#b91c1c">${esc(report.summary)}</p>` : rows}
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">
      Shared by the student. Read-only. They can revoke this at any time — no monitoring happens behind their back.
    </p>
  </main>
</body></html>`
}

/** Rough "how much is shared" score for the student's own settings screen. */
export function sharingScore(sections = [], grant = null) {
  const base = Math.round((sections.filter((s) => s !== 'journalText').length / Math.max(1, SECTION_IDS.length - 1)) * 70)
  const extra = sections.includes('journalText') ? 15 : 0
  const active = grant?.active ? 15 : 0
  return Math.min(100, base + extra + active)
}
