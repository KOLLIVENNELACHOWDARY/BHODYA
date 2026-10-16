// ============================================================
//  Bodhya notification engine (offline, browser-only)
//  One inbox for the whole app: alarms, reminders, to-dos, study
//  plan, focus sessions, streaks, digest and system messages.
//
//  Every feature pushes into this single store; the Notification
//  Centre (bell), the toast stack and the OS-notification bridge
//  all read from it. Rules (quiet hours, per-category toggles,
//  dedupe, snooze) live here so nothing fires twice or at 3 AM.
// ============================================================

import { makeStore, uid } from '../utils/store.js'
import { emit, EVT } from '../utils/events.js'
import { playSound, vibratePattern } from '../utils/sound.js'

export const NOTIF_KINDS = {
  alarm:    { emoji: '⏰', label: { en: 'Alarm',        hi: 'अलार्म',       te: 'అలారం' } },
  reminder: { emoji: '🔔', label: { en: 'Reminder',     hi: 'रिमाइंडर',     te: 'రిమైండర్' } },
  task:     { emoji: '✅', label: { en: 'To-do',        hi: 'टू-डू',        te: 'టూ-డూ' } },
  plan:     { emoji: '📅', label: { en: 'Study plan',   hi: 'स्टडी प्लान',  te: 'స్టడీ ప్లాన్' } },
  focus:    { emoji: '⏳', label: { en: 'Focus timer',  hi: 'फोकस टाइमर',   te: 'ఫోకస్ టైమర్' } },
  streak:   { emoji: '🔥', label: { en: 'Streak',       hi: 'स्ट्रीक',      te: 'స్ట్రీక్' } },
  level:    { emoji: '🏆', label: { en: 'Rewards',      hi: 'रिवॉर्ड्स',    te: 'రివార్డ్స్' } },
  digest:   { emoji: '📋', label: { en: 'Daily digest', hi: 'दैनिक सार',    te: 'రోజువారీ సారాంశం' } },
  system:   { emoji: '🤖', label: { en: 'Bodhya',       hi: 'Bodhya',       te: 'Bodhya' } },
}

export const DEFAULT_SETTINGS = {
  master: true,                     // everything on/off
  toasts: true,                     // in-app pop-ups
  sound: true,
  soundName: 'chime',
  volume: 0.7,
  vibration: true,
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
  categories: {
    alarm: true, reminder: true, task: true, plan: true,
    focus: true, streak: true, level: true, digest: true, system: true,
    forest: true, shield: true, music: true, journal: true,
  },
  digest: { enabled: true, time: '20:00' },
  osNotifications: false,           // OS/browser notifications (needs permission)
  snoozeDefault: 10,                // minutes
  keepInbox: 200,                   // max items kept
}

export const NOTIFS = makeStore('bodhya_notifications_v1', {
  items: [],       // newest first
  settings: DEFAULT_SETTINGS,
  lastDigestKey: null,
  osPermissionAsked: false,
})

// ------------------------------------------------------------------
// pure helpers (unit-tested, no browser needed)
// ------------------------------------------------------------------

/** "22:00" + "07:00" quiet window, handles the midnight wrap. */
export function inQuietHours(settings, date = new Date()) {
  const q = settings?.quietHours
  if (!q?.enabled || !q.from || !q.to) return false
  const toMin = (s) => { const [h, m] = String(s).split(':').map(Number); return (h || 0) * 60 + (m || 0) }
  const now = date.getHours() * 60 + date.getMinutes()
  const from = toMin(q.from), to = toMin(q.to)
  if (from === to) return false
  return from < to ? (now >= from && now < to) : (now >= from || now < to)
}

/** Should this notification be allowed right now, and silently? */
export function decideDelivery(settings, kind, date = new Date()) {
  if (!settings?.master) return { allowed: false, silent: true, reason: 'master-off' }
  if (settings.categories && settings.categories[kind] === false) {
    return { allowed: false, silent: true, reason: 'category-off' }
  }
  // Alarms pierce quiet hours (an alarm nobody hears is useless) but stay silent
  // if the user muted sound globally.
  if (inQuietHours(settings, date) && kind !== 'alarm') {
    return { allowed: true, silent: true, reason: 'quiet-hours' }
  }
  return { allowed: true, silent: false, reason: 'ok' }
}

export function unreadCount(state) {
  return (state.items || []).filter((n) => !n.read).length
}

export function filterItems(state, filter = 'all') {
  const items = state.items || []
  switch (filter) {
    case 'unread': return items.filter((n) => !n.read)
    case 'alarms': return items.filter((n) => n.kind === 'alarm')
    case 'reminders': return items.filter((n) => n.kind === 'reminder' || n.kind === 'task')
    case 'plan': return items.filter((n) => n.kind === 'plan' || n.kind === 'focus')
    case 'system': return items.filter((n) => n.kind === 'system' || n.kind === 'digest' || n.kind === 'streak' || n.kind === 'level')
    default: return items
  }
}

export function relativeTime(ts, now = Date.now()) {
  const diff = Math.round((now - ts) / 1000)
  if (diff < 45) return 'now'
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))}m`
  if (diff < 86400) return `${Math.round(diff / 3600)}h`
  if (diff < 604800) return `${Math.round(diff / 86400)}d`
  return new Date(ts).toLocaleDateString()
}

// ------------------------------------------------------------------
// OS notification bridge (optional; only if the user opts in)
// ------------------------------------------------------------------
export function osSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function osPermission() {
  if (!osSupported()) return 'unsupported'
  return window.Notification.permission
}

export async function requestOSPermission() {
  if (!osSupported()) return 'unsupported'
  try {
    const p = await window.Notification.requestPermission()
    NOTIFS.update({ osPermissionAsked: true })
    return p
  } catch { return 'default' }
}

function showOSNotification(item, settings) {
  if (!settings.osNotifications || !osSupported()) return
  if (window.Notification.permission !== 'granted') return
  try {
    const n = new window.Notification(item.title, { body: item.body, tag: item.id, icon: undefined })
    n.onclick = () => {
      try { window.focus() } catch { /* ignore */ }
      if (item.action?.feature) emit(EVT.openFeature, { id: item.action.feature, payload: item.action.payload || {} })
      n.close()
    }
  } catch { /* some browsers block constructor notifications */ }
}

// ------------------------------------------------------------------
// the public API used by every feature
// ------------------------------------------------------------------

/**
 * Push a notification into the Bodhya inbox.
 * @param {{kind?:string,title:string,body?:string,action?:object,meta?:object,
 *          silent?:boolean,force?:boolean,groupKey?:string,at?:number}} n
 * @returns {object|null} the stored item (null when suppressed/deduped)
 */
export function pushNotification(n = {}) {
  const state = NOTIFS.read()
  const settings = state.settings || DEFAULT_SETTINGS
  const now = n.at || Date.now()
  const delivery = decideDelivery(settings, n.kind || 'system', new Date(now))
  if (!delivery.allowed) return null

  // dedupe: same groupKey within 60s (e.g. double timer ticks) is dropped
  if (n.groupKey) {
    const dupe = (state.items || []).find(
      (i) => i.groupKey === n.groupKey && now - i.createdAt < 60000
    )
    if (dupe) return null
  }

  const item = {
    id: uid('n'),
    kind: n.kind || 'system',
    title: n.title || 'Bodhya',
    body: n.body || '',
    createdAt: now,
    read: false,
    snoozedUntil: null,
    action: n.action || null,
    meta: n.meta || {},
    groupKey: n.groupKey || null,
    silent: !!n.silent || delivery.silent,
  }

  const items = [item, ...(state.items || [])].slice(0, settings.keepInbox || 200)
  NOTIFS.update({ items })
  emit(EVT.notifyChanged, { item })

  // live feedback
  const shouldBeQuiet = item.silent || delivery.silent
  if (!shouldBeQuiet) {
    if (settings.sound) playSound(settings.soundName, settings.volume)
    if (settings.vibration) vibratePattern([160, 80, 160])
  }
  if (settings.toasts) emit(EVT.toast, { item, quiet: shouldBeQuiet })
  showOSNotification(item, settings)
  return item
}

export function markRead(id) {
  NOTIFS.update((s) => ({ items: (s.items || []).map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  emit(EVT.notifyChanged, { id })
}

export function markAllRead() {
  NOTIFS.update((s) => ({
    items: (s.items || []).map((n) => (n.read ? n : { ...n, read: true })),
    lastDigestKey: s.lastDigestKey,
  }))
  emit(EVT.notifyChanged, { all: true })
}

export function removeNotification(id) {
  NOTIFS.update((s) => ({ items: (s.items || []).filter((n) => n.id !== id) }))
  emit(EVT.notifyChanged, { id })
}

export function clearAllNotifications() {
  NOTIFS.update({ items: [] })
  emit(EVT.notifyChanged, { all: true })
}

export function clearReadNotifications() {
  NOTIFS.update((s) => ({ items: (s.items || []).filter((n) => !n.read) }))
  emit(EVT.notifyChanged, { all: true })
}

export function snoozeNotification(id, minutes = 10) {
  const until = Date.now() + minutes * 60000
  NOTIFS.update((s) => ({
    items: (s.items || []).map((n) => (n.id === id ? { ...n, snoozedUntil: until, read: true } : n)),
  }))
  // re-surface it later through the scheduler's catch-up pass
  NOTIFS.update((s) => s)
  emit(EVT.notifyChanged, { id, snoozed: until })
  return until
}

export function updateNotifSettings(patch) {
  const state = NOTIFS.read()
  const next = {
    ...state.settings,
    ...patch,
    quietHours: { ...state.settings.quietHours, ...(patch.quietHours || {}) },
    categories: { ...state.settings.categories, ...(patch.categories || {}) },
    digest: { ...state.settings.digest, ...(patch.digest || {}) },
  }
  NOTIFS.update({ settings: next })
  return next
}

/** Task-complete / XP / level style "good news" message. */
export function notifyReward({ title, body, feature = null, payload = {} }) {
  return pushNotification({ kind: 'level', title, body, action: feature ? { feature, payload } : null })
}

export function testNotification(settings) {
  const s = settings || NOTIFS.read().settings
  if (s.sound) playSound(s.soundName, s.volume)
  if (s.vibration) vibratePattern([160, 80, 160])
  return pushNotification({
    kind: 'system',
    title: '🔔 Test notification',
    body: `This is how Bodhya will get your attention (sound: ${s.soundName}, quiet hours ${s.quietHours.enabled ? `${s.quietHours.from}–${s.quietHours.to}` : 'off'}).`,
    groupKey: null,
  })
}
