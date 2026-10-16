// ============================================================
//  Focus-timer logic — pure maths for the Pomodoro engine.
// ============================================================

import { dayKey, addDays } from '../time-tracking/store.js'

export const PRESETS = [
  { minutes: 10, emoji: '🌱', label: { en: 'Warm-up', hi: 'वार्म-अप', te: 'వార్మ్-అప్' } },
  { minutes: 25, emoji: '🍅', label: { en: 'Pomodoro', hi: 'पोमोडोरो', te: 'పొమొడోరో' } },
  { minutes: 45, emoji: '🎯', label: { en: 'Deep work', hi: 'गहन कार्य', te: 'డీప్ వర్క్' } },
  { minutes: 60, emoji: '🚀', label: { en: 'Full hour', hi: 'पूरा घंटा', te: 'పూర్తి గంట' } },
]

export const BREAK_IDEAS = {
  en: ['Stand up and stretch your arms 🙆', 'Drink a glass of water 💧', 'Look 20 feet away for 20 seconds 👀', 'Walk around the room a bit 🚶', 'Take 5 slow deep breaths 🌬️', 'Roll your shoulders back 10 times 💪'],
  hi: ['खड़े होकर अंगड़ाई लें 🙆', 'एक गिलास पानी पिएँ 💧', '20 फीट दूर 20 सेकंड देखें 👀', 'कमरे में थोड़ा टहलें 🚶', '5 गहरी साँसें लें 🌬️', 'कंधों को 10 बार घुमाएँ 💪'],
  te: ['లేచి stretch చేయండి 🙆', 'ఒక గ్లాసు నీళ్లు తాగండి 💧', '20 అడుగుల దూరం 20 సెకన్లు చూడండి 👀', 'గదిలో కొంచెం నడవండి 🚶', '5 సార్లు లోతుగా శ్వాస తీసుకోండి 🌬️', 'భుజాలు 10 సార్లు తిప్పండి 💪'],
}

export function randomBreakIdea(lang = 'en') {
  const list = BREAK_IDEAS[lang] || BREAK_IDEAS.en
  return list[Math.floor(Math.random() * list.length)]
}

/** mm:ss for the big display. */
export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function remainingMs(active, now = Date.now()) {
  if (!active) return 0
  if (active.pausedAt) return Math.max(0, active.endsAt - active.pausedAt)
  return Math.max(0, active.endsAt - now)
}

export function elapsedMs(active, now = Date.now()) {
  if (!active) return 0
  const end = active.pausedAt || now
  return Math.max(0, end - active.startedAt - (active.pausedTotal || 0))
}

export function progressPct(active, now = Date.now()) {
  if (!active?.minutes) return 0
  const totalMs = active.minutes * 60000
  return Math.min(100, Math.round(((totalMs - remainingMs(active, now)) / totalMs) * 100))
}

export function isFinished(active, now = Date.now()) {
  return !!active && remainingMs(active, now) <= 0
}

export function phaseLabel(mode, lang = 'en') {
  const map = {
    study: { en: 'Focus', hi: 'फोकस', te: 'ఫోకస్' },
    break: { en: 'Short break', hi: 'छोटा ब्रेक', te: 'చిన్న విరామం' },
    long: { en: 'Long break', hi: 'बड़ा ब्रेक', te: 'పెద్ద విరామం' },
  }
  return (map[mode] || map.study)[lang] || (map[mode] || map.study).en
}

// ---------------- stats ----------------
export function todayFocus(log = [], now = new Date()) {
  const key = dayKey(now)
  const list = log.filter((l) => dayKey(l.at) === key)
  return { minutes: list.reduce((s, l) => s + l.minutes, 0), sessions: list.length }
}

export function focusBars(log = [], now = new Date(), days = 7) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i)
    const key = dayKey(d)
    out.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      minutes: log.filter((l) => dayKey(l.at) === key).reduce((s, l) => s + l.minutes, 0),
    })
  }
  return out
}

export function focusStreak(log = [], now = new Date()) {
  let streak = 0
  let cursor = new Date(now)
  const has = (d) => log.some((l) => dayKey(l.at) === dayKey(d))
  if (!has(cursor)) cursor = addDays(cursor, -1)
  while (has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
    if (streak > 400) break
  }
  return streak
}

export function subjectTotals(log = [], days = 30, now = new Date()) {
  const cutoff = addDays(now, -days).getTime()
  const map = new Map()
  log.filter((l) => l.at >= cutoff).forEach((l) => {
    const k = l.subject || 'Study'
    map.set(k, (map.get(k) || 0) + l.minutes)
  })
  return [...map.entries()].map(([subject, minutes]) => ({ subject, minutes })).sort((a, b) => b.minutes - a.minutes)
}

/** XP for a finished focus block: 1 XP per 2 minutes, +bonus over 25 min. */
export function xpForFocus(minutes) {
  const m = Number(minutes) || 0
  return Math.round(m / 2) + (m >= 25 ? 10 : 0)
}
