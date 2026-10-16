// ============================================================
//  🔗 Guest links — a report a teacher can open without the app.
//
//  Two kinds, and the difference matters:
//
//  1. CLIENT SNAPSHOT LINK (this file)
//     The report data is packed into the URL fragment itself:
//        https://host/#guardian-view=<token>
//     * it is a *snapshot* — it can only ever show what was shared
//       at that moment, so later study/journal data can never leak
//       through it (a privacy feature, not a limitation);
//     * it carries an expiry date and a checksum, so corrupting or
//       tweaking the payload is detectable (tamper-EVIDENT);
//     * the fragment never leaves the browser (it is not sent to
//       any server), so hosting it is trivial and private;
//     * it is not cryptographically signed — use the server link
//       (guardian store + /api/guardian/links) when you need real
//       revocation, or the 6-character code.
//
//  2. SERVER LINK (backend/app/routers/guardian.py)
//     Short token stored server-side, revocable and expiring.
//
//  The packing here is deliberately compact (short keys, integers
//  where possible) because URLs have length limits.
// ============================================================

export const TOKEN_VERSION = 1
export const DEFAULT_EXPIRY_DAYS = 30
export const MAX_TOKEN_LENGTH = 8000          // stay well inside URL limits
export const FRAGMENT_KEY = 'guardian-view'

// section id → 2-char code (shorter URLs, stable on the wire)
const SECTION_CODES = {
  studyTime: 'st',
  tasks: 'tk',
  plan: 'pl',
  forest: 'fo',
  shield: 'sh',
  journalMood: 'jm',
  journalText: 'jt',
  letters: 'lt',
}
const CODE_TO_SECTION = Object.fromEntries(Object.entries(SECTION_CODES).map(([k, v]) => [v, k]))

export function encodeSections(sections = []) {
  return sections.filter((s) => SECTION_CODES[s]).map((s) => SECTION_CODES[s]).join(',')
}
export function decodeSections(str = '') {
  return String(str).split(',').map((c) => CODE_TO_SECTION[c]).filter(Boolean)
}

/** Round numbers sensibly so the URL stays short. */
function r1(n) {
  const v = Number(n) || 0
  return Math.round(v * 10) / 10
}

/**
 * Compact the report payload.
 * Journal entries are capped (3 × 160 chars) — a link is not a diary download.
 */
export function compactPayload({ snapshot = {}, sections = [], studentName = '', note = '' } = {}) {
  const s = snapshot || {}
  const out = {
    v: TOKEN_VERSION,
    n: studentName.slice(0, 40),
    sec: encodeSections(sections),
    nt: note ? note.slice(0, 200) : '',
    mt: r1(s.minutesToday),
    gm: r1(s.goalMinutes || 120),
    mw: r1(s.minutesWeek),
    ss: s.sessionsToday || 0,
    st: s.studyStreak || 0,
    td: s.tasksDone || 0,
    tt: s.tasksTotal || 0,
    to: s.tasksOpen || 0,
    ov: s.tasksOverdue || 0,
    ed: s.examDays == null ? null : s.examDays,
    ps: s.planSessions || 0,
    pd: s.planDone || 0,
    pp: s.planPercent || 0,
    tg: s.treesGrown || 0,
    tl: s.treesLost || 0,
    fs: s.forestStreak || 0,
    ls: s.longestSession || 0,
    cr: s.cleanRate || 0,
    bs: s.blockedSites || 0,
    ur: s.urgesResisted || 0,
    bm: s.breakMinutes || 0,
    am: r1(s.avgMood),
    mtr: s.moodTrend || 'flat',
    jd: s.journalDays || 0,
    js: s.journalStreak || 0,
    lsl: s.lettersSealed || 0,
    nla: s.nextLetterAt || '',
    je: (s.journalEntries || []).slice(0, 3).map((e) => ({
      d: e.day,
      m: e.mood || null,
      t: String(e.text || '').slice(0, 160),
    })),
  }
  // drop empty fields to keep the token small
  Object.keys(out).forEach((k) => {
    const v = out[k]
    if (v === null || v === '' || v === 0 || v === false) delete out[k]
    else if (Array.isArray(v) && !v.length) delete out[k]
  })
  return out
}

/** Expand a compact payload back into the shape buildReport() expects. */
export function expandPayload(payload = {}) {
  const mood = payload.mtr === 'up' || payload.mtr === 'down' ? payload.mtr : 'flat'
  return {
    snapshot: {
      at: payload.at ? new Date(payload.at).getTime() : Date.now(),
      minutesToday: payload.mt || 0,
      goalMinutes: payload.gm || 120,
      minutesWeek: payload.mw || 0,
      sessionsToday: payload.ss || 0,
      studyStreak: payload.st || 0,
      tasksDone: payload.td || 0,
      tasksTotal: payload.tt || 0,
      tasksOpen: payload.to || 0,
      tasksOverdue: payload.ov || 0,
      examDays: payload.ed == null ? null : payload.ed,
      planSessions: payload.ps || 0,
      planDone: payload.pd || 0,
      planPercent: payload.pp || 0,
      treesGrown: payload.tg || 0,
      treesLost: payload.tl || 0,
      forestStreak: payload.fs || 0,
      longestSession: payload.ls || 0,
      cleanRate: payload.cr || 0,
      blockedSites: payload.bs || 0,
      urgesResisted: payload.ur || 0,
      breakMinutes: payload.bm || 0,
      avgMood: payload.am || 0,
      moodTrend: mood,
      journalDays: payload.jd || 0,
      journalStreak: payload.js || 0,
      lettersSealed: payload.lsl || 0,
      nextLetterAt: payload.nla || null,
      journalEntries: (payload.je || []).map((e) => ({ day: e.d, mood: e.m, text: e.t })),
    },
    sections: decodeSections(payload.sec),
    studentName: payload.n || '',
    note: payload.nt || '',
  }
}

// ----------------------------------------------------------------
//  base64url + checksum
// ----------------------------------------------------------------
export function toBase64Url(str) {
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, 'utf8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(token) {
  const b64 = String(token).replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = typeof atob === 'function'
    ? decodeURIComponent(escape(atob(padded)))
    : Buffer.from(padded, 'base64').toString('utf8')
  return raw
}

/** Small non-cryptographic checksum (djb2). Tamper-evident, not tamper-proof. */
export function checksum(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/**
 * Pack a report into a URL-safe token.
 * @param {object} args  {snapshot, sections, studentName, note, expiresAt, now}
 * @returns {string} token
 */
export function encodeSnapshotToken({
  snapshot = {}, sections = [], studentName = '', note = '',
  expiresAt = null, now = new Date(),
} = {}) {
  const exp = expiresAt || new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 86400000).toISOString().slice(0, 10)
  const payload = {
    ...compactPayload({ snapshot, sections: ['_', ...sections], studentName, note }),
    iat: Math.floor(now.getTime() / 1000),
    exp,
    k: `s${Math.random().toString(36).slice(2, 8)}`,   // link nonce, so two links differ
  }
  payload.sec = encodeSections(sections)
  const body = JSON.stringify(payload)
  const withSum = { ...payload, h: checksum(body) }
  return toBase64Url(JSON.stringify(withSum))
}

/**
 * Read a token back.
 * @returns {{ok:true, snapshot, sections, studentName, note, expiresAt, issuedAt}
 *          | {ok:false, error:'malformed'|'corrupt'|'expired'|'future'}}
 */
export function decodeSnapshotToken(token, now = new Date()) {
  if (!token || typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, error: 'malformed' }
  }
  let payload
  try {
    payload = JSON.parse(fromBase64Url(token))
  } catch {
    return { ok: false, error: 'malformed' }
  }
  if (!payload || typeof payload !== 'object' || payload.v !== TOKEN_VERSION) {
    return { ok: false, error: 'malformed' }
  }
  const { h, ...rest } = payload
  if (!h || checksum(JSON.stringify(rest)) !== h) return { ok: false, error: 'corrupt' }
  if (!rest.exp) return { ok: false, error: 'malformed' }

  const today = now.toISOString().slice(0, 10)
  if (rest.exp < today) return { ok: false, error: 'expired', expiresAt: rest.exp }
  if (rest.iat && rest.iat > Math.floor(now.getTime() / 1000) + 86400) return { ok: false, error: 'future' }

  const expanded = expandPayload({ ...rest, at: (rest.iat || 0) * 1000 })
  return {
    ok: true,
    ...expanded,
    expiresAt: rest.exp,
    issuedAt: rest.iat ? new Date(rest.iat * 1000).toISOString() : null,
    nonce: rest.k || null,
  }
}

/** The shareable URL (fragment only — never sent to a server). */
export function guestLink(token, baseUrl = null) {
  const base = baseUrl || (typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://your-app.example/')
  return `${base}#${FRAGMENT_KEY}=${token}`
}

/** Pull a token out of a URL or a bare fragment. */
export function tokenFromUrl(url = '') {
  const m = String(url).match(new RegExp(`${FRAGMENT_KEY}=([A-Za-z0-9_-]+)`))
  return m ? m[1] : null
}

/** Days left on a link (null when it never expires / is invalid). */
export function daysLeftOnLink(expiresAt, now = new Date()) {
  if (!expiresAt) return null
  const ms = new Date(`${expiresAt}T23:59:59Z`).getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86400000))
}

/** How big is the link? Shown in the UI so nobody shares a 4-page URL. */
export function linkStats(token, baseUrl = null) {
  const url = guestLink(token, baseUrl)
  return { tokenChars: token.length, urlChars: url.length, url }
}

/** A short human label for the shared snapshot, used in the guest header. */
export function shareSummary(decoded, lang = 'en') {
  if (!decoded?.ok) return ''
  const n = decoded.sections.length
  return {
    en: `${n} section${n === 1 ? '' : 's'} shared by the student · valid until ${decoded.expiresAt}`,
    hi: `छात्र ने ${n} भाग साझा किए · ${decoded.expiresAt} तक मान्य`,
    te: `విద్యార్థి ${n} విభాగాలు పంచారు · ${decoded.expiresAt} వరకు చెల్లుతుంది`,
  }[lang]
}
