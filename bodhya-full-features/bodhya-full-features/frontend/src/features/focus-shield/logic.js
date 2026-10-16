// ============================================================
//  Focus Shield logic — pure rules for the anti-doomscroll layer.
//
//  What a web page can and cannot do, honestly:
//   • A browser tab cannot block other apps or other tabs. So the
//     shield does three things that *do* work:
//       1. it guards your session inside Bodhya (leave → logged,
//          warn, or wither the tree in strict mode);
//       2. it gives you an urge routine ("I want to scroll") that
//          replaces the reflex with a 90-second pause;
//       3. it exports a real blocklist (hosts file / DNS rules /
//          extension list) so the *device* blocks the sites.
//   • Nothing here pretends to be a firewall.
// ============================================================

export const SITE_PACKS = [
  {
    id: 'social', emoji: '📱',
    name: { en: 'Social feeds', hi: 'सोशल फ़ीड', te: 'సోషల్ ఫీడ్‌లు' },
    sites: ['instagram.com', 'facebook.com', 'x.com', 'twitter.com', 'threads.net', 'snapchat.com', 'reddit.com'],
  },
  {
    id: 'video', emoji: '▶️',
    name: { en: 'Short video', hi: 'शॉर्ट वीडियो', te: 'షార్ట్ వీడియో' },
    sites: ['youtube.com', 'youtu.be', 'tiktok.com', 'netflix.com', 'primevideo.com', 'hotstar.com', 'twitch.tv'],
  },
  {
    id: 'games', emoji: '🎮',
    name: { en: 'Games', hi: 'गेम्स', te: 'గేమ్‌లు' },
    sites: ['roblox.com', 'store.steampowered.com', 'epicgames.com', 'freefiremobile.com', 'bgmi.in'],
  },
  {
    id: 'shopping', emoji: '🛒',
    name: { en: 'Shopping', hi: 'शॉपिंग', te: 'షాపింగ్' },
    sites: ['amazon.in', 'flipkart.com', 'myntra.com', 'ajio.com', 'meesho.com'],
  },
  {
    id: 'news', emoji: '📰',
    name: { en: 'Endless news', hi: 'अंतहीन ख़बरें', te: 'అంతులేని వార్తలు' },
    sites: ['news.google.com', 'ndtv.com', 'timesofindia.indiatimes.com', 'buzzfeed.com'],
  },
  {
    id: 'chat', emoji: '💬',
    name: { en: 'Chat apps', hi: 'चैट ऐप्स', te: 'చాట్ యాప్‌లు' },
    sites: ['web.whatsapp.com', 'web.telegram.org', 'discord.com', 'messenger.com'],
  },
]

export const CUSTOM_PACK_ID = 'custom'

/** All preset domains, flattened (used for "block everything" & stats). */
export function allPresetSites() {
  return [...new Set(SITE_PACKS.flatMap((p) => p.sites))]
}

export function packById(id) {
  return SITE_PACKS.find((p) => p.id === id) || null
}

export function siteInPacks(site) {
  const s = normalizeSite(site)
  return SITE_PACKS.find((p) => p.sites.includes(s)) || null
}

/** "https://www.instagram.com/reels/" → "instagram.com" */
export function normalizeSite(input) {
  let s = String(input || '').trim().toLowerCase()
  s = s.replace(/^[a-z]+:\/\//, '')       // scheme
  s = s.replace(/^www\./, '')             // www.
  s = s.replace(/\/.*$/, '')              // path
  s = s.replace(/:\d+$/, '')              // port
  return s.replace(/\s+/g, '')
}

export function isValidSite(site) {
  const s = normalizeSite(site)
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) && s.length <= 100
}

// ----------------------------------------------------------------
//  urge / scroll-budget maths
// ----------------------------------------------------------------
export const URGE_STEPS = [
  { seconds: 20, label: { en: 'Breathe in slowly…', hi: 'धीरे-धीरे साँस लें…', te: 'నెమ్మదిగా శ్వాస తీసుకోండి…' } },
  { seconds: 20, label: { en: 'Hold — and notice the urge, don’t act on it…', hi: 'रोकिए — इच्छा को देखिए, करिए मत…', te: 'ఆపండి — కోరికను గమనించండి, చేయకండి…' } },
  { seconds: 20, label: { en: 'Breathe out longer than you breathed in…', hi: 'साँस छोड़ना लंबा रखें…', te: 'ఊపిరి పొడవుగా వదలండి…' } },
  { seconds: 30, label: { en: 'Urges peak in ~90 seconds, then fall. Almost there…', hi: 'इच्छा ~90 सेकंड में चरम पर आती है, फिर उतरती है…', te: 'కోరిక ~90 సెకన్లలో గరిష్ఠానికి వెళ్లి తగ్గుతుంది…' } },
]

export const URGE_TOTAL_SECONDS = URGE_STEPS.reduce((a, s) => a + s.seconds, 0)

/** Which urge step are we in at `elapsedSeconds`? */
export function urgeStep(elapsedSeconds) {
  let acc = 0
  for (let i = 0; i < URGE_STEPS.length; i++) {
    acc += URGE_STEPS[i].seconds
    if (elapsedSeconds < acc) return { index: i, step: URGE_STEPS[i], remaining: acc - elapsedSeconds, total: URGE_TOTAL_SECONDS }
  }
  return { index: URGE_STEPS.length - 1, step: URGE_STEPS[URGE_STEPS.length - 1], remaining: 0, total: URGE_TOTAL_SECONDS, done: true }
}

/** Breathing guide: 4-7-8-ish circle scale for the animation (0.6–1). */
export function breathScale(elapsedSeconds) {
  const cycle = 16
  const t = (elapsedSeconds % cycle) / cycle
  if (t < 0.3) return 0.6 + (t / 0.3) * 0.4          // in
  if (t < 0.7) return 1                              // hold
  return 1 - ((t - 0.7) / 0.3) * 0.4                 // out
}

export function todayKey(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/**
 * Daily scroll budget: how many "scroll breaks" (and how many minutes)
 * the user allows themselves today.
 */
export function budgetState(settings, log = [], now = new Date()) {
  const day = todayKey(now)
  const todays = log.filter((e) => e.day === day)
  const breaks = todays.filter((e) => e.type === 'break')
  const minutes = breaks.reduce((a, e) => a + (e.minutes || 0), 0)
  const used = breaks.length
  const left = Math.max(0, (settings.dailyScrollBreaks || 2) - used)
  const minutesLeft = Math.max(0, (settings.dailyScrollMinutes || 15) - minutes)
  return {
    used,
    left,
    minutes,
    minutesLeft,
    overBudget: left === 0 || minutesLeft === 0,
    resisted: todays.filter((e) => e.type === 'resisted').length,
    escapes: todays.filter((e) => e.type === 'escape').length,
    pct: settings.dailyScrollBreaks ? Math.min(100, Math.round((used / settings.dailyScrollBreaks) * 100)) : 0,
  }
}

/** Sessions with zero escapes, in a row (today). */
export function cleanStreak(sessions = []) {
  const sorted = [...sessions].filter((s) => s.endedAt).sort((a, b) => b.endedAt - a.endedAt)
  let streak = 0
  for (const s of sorted) {
    if ((s.escapes || 0) === 0) streak += 1
    else break
  }
  return streak
}

/** Shield statistics across all the logs. */
export function shieldStats({ sessions = [], log = [], settings = null, now = new Date() } = {}) {
  const week = now.getTime() - 7 * 86400000
  const recent = sessions.filter((s) => (s.startedAt || 0) >= week)
  const totalEscapes = sessions.reduce((a, s) => a + (s.escapes || 0), 0)
  const protectedMinutes = sessions.filter((s) => (s.protectedMinutes || s.minutes)).reduce((a, s) => a + (s.protectedMinutes || s.minutes || 0), 0)
  const clean = sessions.filter((s) => (s.escapes || 0) === 0).length
  const byReason = {}
  log.forEach((e) => { byReason[e.type] = (byReason[e.type] || 0) + 1 })
  return {
    sessions: sessions.length,
    escapes: totalEscapes,
    escapesThisWeek: recent.reduce((a, s) => a + (s.escapes || 0), 0),
    cleanSessions: clean,
    cleanRate: sessions.length ? Math.round((clean / sessions.length) * 100) : 0,
    cleanStreak: cleanStreak(sessions),
    protectedMinutes,
    resisted: log.filter((e) => e.type === 'resisted').length,
    gaveIn: log.filter((e) => e.type === 'gave-in').length,
    breakMinutes: log.filter((e) => e.type === 'break').reduce((a, e) => a + (e.minutes || 0), 0),
    bestHour: busiestHour(log.filter((e) => e.type === 'escape')),
    byType: byReason,
    budget: settings ? budgetState(settings, log, now) : null,
  }
}

export function busiestHour(events = []) {
  if (!events.length) return null
  const hours = new Array(24).fill(0)
  events.forEach((e) => { hours[new Date(e.at).getHours()] += 1 })
  const max = Math.max(...hours)
  return { hour: hours.indexOf(max), count: max }
}

/** Friendly name for an escape time. */
export function formatAway(ms) {
  const s = Math.round((Number(ms) || 0) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

/**
 * Decide what to do when the user comes back after being away.
 * @returns {{level:'ok'|'warn'|'fail', message:string}}
 */
export function evaluateReturn({ awayMs = 0, escapes = 0, settings, treeRunning = false }) {
  const warnMs = (settings?.warnAfterSeconds ?? 20) * 1000
  const failMs = (settings?.failAfterSeconds ?? 120) * 1000
  const maxEscapes = settings?.maxEscapesPerSession ?? 3
  if (awayMs < warnMs) return { level: 'ok', message: 'welcome-back-quiet' }
  if (treeRunning && (settings?.witherOnWander !== false) && (awayMs >= failMs || escapes > maxEscapes)) {
    return { level: 'fail', message: 'tree-withered' }
  }
  if (awayMs >= failMs || escapes > maxEscapes) return { level: 'fail', message: 'session-failed' }
  return { level: 'warn', message: escapes === 1 ? 'first-warning' : 'again-warning' }
}

// ----------------------------------------------------------------
//  blocklist exporters — the part that blocks *outside* the app
// ----------------------------------------------------------------
export function hostsFileContent(sites = []) {
  const list = [...new Set(sites.map(normalizeSite).filter(Boolean))].sort()
  return [
    '# Bodhya Focus Shield — device-wide blocklist',
    '# Paste these lines at the end of your hosts file and save.',
    '#   Windows : C:\\Windows\\System32\\drivers\\etc\\hosts   (open Notepad as Administrator)',
    '#   macOS   : sudo nano /etc/hosts',
    '#   Linux   : sudo nano /etc/hosts',
    '#   Android : use NextDNS/AdGuard with the DNS rules below',
    '# Then flush DNS:  Windows: ipconfig /flushdns   macOS: sudo dscacheutil -flushcache',
    `# Generated ${new Date().toISOString().slice(0, 10)} · ${list.length} sites`,
    '',
    ...list.map((s) => `0.0.0.0 ${s}\n0.0.0.0 www.${s}`),
    '',
  ].join('\n')
}

export function dnsRules(sites = []) {
  const list = [...new Set(sites.map(normalizeSite).filter(Boolean))].sort()
  return [
    '! Bodhya Focus Shield — DNS blocking rules',
    '! NextDNS / AdGuard Home / Pi-hole: paste into "Custom rules / Denylist"',
    '',
    ...list.map((s) => `||${s}^`),
    '',
  ].join('\n')
}

export function extensionJson(sites = [], { blockPage = 'About to study — Bodhya Shield' } = {}) {
  const list = [...new Set(sites.map(normalizeSite).filter(Boolean))].sort()
  return JSON.stringify({
    name: 'Bodhya Focus Shield',
    version: 1,
    generatedAt: new Date().toISOString(),
    blockedSites: list,
    blockPageTitle: blockPage,
    // this shape is eaten by simple "blocklist" browser extensions & Chrome's
    // "URLBlocklist" enterprise policy
    chromePolicyUrlBlocklist: list.map((s) => s),
    note: 'Chrome/Edge: chrome://settings > search "URLBlocklist", or paste the array into an admin policy. Firefox: use an extension like LeechBlock and import the list.',
  }, null, 2)
}

export function blocklistText(sites = [], format = 'text') {
  const list = [...new Set(sites.map(normalizeSite).filter(Boolean))].sort()
  if (format === 'hosts') return hostsFileContent(list)
  if (format === 'dns') return dnsRules(list)
  if (format === 'json') return extensionJson(list)
  return list.join('\n')
}

/** Suggested "protected hours" — when the shield is armed by default. */
export const DEFAULT_SETTINGS = {
  enabled: true,
  armOnFocus: true,               // watch for escapes while a focus block runs
  warnAfterSeconds: 20,           // a quick glance is fine
  failAfterSeconds: 120,          // two minutes away = you left
  maxEscapesPerSession: 3,
  witherOnWander: true,           // strict: leaving kills the tree
  dailyScrollBreaks: 2,           // "scroll breaks" allowed per day
  dailyScrollMinutes: 15,
  urgeSeconds: URGE_TOTAL_SECONDS,
  blockPageMessage: {
    en: 'You came here to study. Bodhya is holding the door for 10 seconds…',
    hi: 'आप यहाँ पढ़ने आए थे। Bodhya 10 सेकंड दरवाज़ा रोक रहा है…',
    te: 'మీరు చదవడానికి వచ్చారు. Bodhya 10 సెకన్లు తలుపు ఆపుతోంది…',
  },
  cooldownSeconds: 10,            // before you can dismiss the block page
  notifyOnEscape: true,
  exportFormat: 'hosts',
}

export function shieldUrlFor(site) {
  return `https://${normalizeSite(site)}`
}

/** How much "protection" the user has set up (drives the health bar). */
export function setupScore({ sites = [], settings = {}, extensionInstalled = false }) {
  let score = 0
  if (sites.length >= 5) score += 30
  else score += Math.min(30, sites.length * 6)
  if (settings.enabled) score += 25
  if (settings.armOnFocus) score += 20
  if (settings.witherOnWander) score += 15
  if (extensionInstalled) score += 10
  return Math.min(100, score)
}
