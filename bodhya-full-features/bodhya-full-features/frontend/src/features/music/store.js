// ============================================================
//  Study-music store — user settings + listening log + the small
//  amount of glue between the audio engine, the focus timer,
//  alarms (ducking) and Bodhya's notifications.
// ============================================================

import { makeStore } from '../chatbot/utils/store.js'
import { emit, on, EVT } from '../chatbot/utils/events.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { FOCUS } from '../focus/store.js'
import * as engine from './engine.js'
import { PRESETS, listeningStats, presetById, suggestPreset, safeMix, fadeFor } from './logic.js'

export const MUSIC = makeStore(
  'bodhya_music_v1',
  {
    presetId: 'deep-focus',
    mix: { master: 0.8, music: 0.6, ambient: 0.5, binaural: 0.5 },
    sleepMinutes: 0,
    settings: {
      autoplayWithFocus: true,     // music starts when a focus block / tree starts
      autoStopWithFocus: true,     // and fades out when it ends
      duckOnAlarm: true,           // drop the volume while an alarm rings
      rememberPreset: true,
      forSubject: true,            // auto-pick a preset from the subject
      fadeSeconds: 3,
      volumeStep: 0.05,
    },
    log: [],                       // {id, preset, minutes, at, duringFocus}
    favourites: ['deep-focus', 'reading-rain'],
    lastPlayedAt: null,
  },
  { changeEvent: EVT.musicChanged }
)

let startedAt = null
let playingPreset = null

// the engine tells us when things change (sleep timer, tray state…)
engine.subscribe((s) => {
  emit(EVT.musicChanged, { playing: s.playing, presetId: s.presetId })
})

// keep the mixer in the engine in sync at boot
engine.setMix(MUSIC.read().mix)

// ---- alarm ducking ------------------------------------------------------
on(EVT.alarmRing, () => { if (MUSIC.read().settings.duckOnAlarm) engine.duck() })
on(EVT.alarmStop, () => engine.unduck())

// ---- autoplay with a focus block / tree --------------------------------
on(EVT.focusChanged, (detail = {}) => {
  if (detail.started && (detail.mode || 'study') === 'study') {
    startForSession({ subject: detail.subject || '', minutes: detail.minutes || 0 })
  }
  if (detail.completed || detail.ended) {
    stopForSession()
  }
})

// ---- sleep-timer finished ----------------------------------------------
on(EVT.musicSleep, ({ minutes }) => {
  pushNotification({
    kind: 'music',
    title: '🎵 Music stopped',
    body: `Your ${minutes}-minute sleep timer finished. Session logged.`,
    silent: true,
  })
  logListening('sleep-timer')
})

// ------------------------------------------------------------------
export function presets() { return PRESETS }

export function currentPreset() {
  return presetById(preservingPresetId()) || PRESETS[0]
}

function preservingPresetId() {
  return engine.getState().presetId || MUSIC.read().presetId
}

export function currentState() {
  return engine.getState()
}

export function isPlaying() {
  return engine.getState().playing
}

/** Play a preset by id (or the remembered one). */
export function playPreset(id = null, { subject = '', sleepMinutes = null } = {}) {
  let preset = presetById(id) || presetById(MUSIC.read().presetId) || PRESETS[0]
  if (!id && subject && MUSIC.read().settings.forSubject) {
    preset = presetById(suggestPreset(subject)) || preset
  }
  const mix = safeMix(engine.getState().mix?.master != null ? engine.getState().mix : MUSIC.read().mix)
  const fade = MUSIC.read().settings.fadeSeconds
  const started = engine.play(
    { music: preset.music, ambient: preset.ambient, binaural: preset.binaural },
    { presetId: preset.id, mix: MUSIC.read().mix, fade: Math.min(fade, fadeFor('start', { music: preset.music, ambient: preset.ambient, binaural: preset.binaural })) }
  )
  void mix
  startedAt = Date.now()
  playingPreset = preset.id
  MUSIC.update({ presetId: preset.id, lastPlayedAt: Date.now() })
  if (!started) {
    // honest fallback: the preset is remembered, but this browser cannot
    // synthesise audio (no Web Audio API) — say so once, quietly
    pushNotification({
      kind: 'system',
      title: '🔇 This browser cannot play generated audio',
      body: 'Web Audio is unavailable here, so the music cannot be synthesised. Everything else still works.',
      silent: true,
    })
  }
  return preset
  void old_block
}

export function stopMusic({ notifyUser = false } = {}) {
  const minutes = logListening('manual-stop')
  engine.stop({ fade: 2, keepFile: false })
  if (notifyUser && minutes > 0) {
    pushNotification({
      kind: 'music',
      title: `🎵 ${minutes} min of study music`,
      body: 'Logged to your music stats. Want to keep the session going?',
      silent: true,
      action: { feature: 'music' },
    })
  }
  return minutes
}

export function toggleMusic(opts = {}) {
  return isPlaying() ? (stopMusic(opts), false) : (playPreset(opts.presetId, opts), true)
}

export function setMix(patch = {}) {
  const mix = engine.setMix(patch)
  MUSIC.update({ mix })
  return mix
}

export function setMusicSettings(patch = {}) {
  MUSIC.update((s) => ({ settings: { ...s.settings, ...patch } }))
}

export function toggleFavourite(id) {
  MUSIC.update((s) => ({
    favourites: s.favourites.includes(id) ? s.favourites.filter((x) => x !== id) : [...s.favourites, id],
  }))
}

export function setSleep(minutes) {
  const until = engine.setSleepTimer(minutes)
  MUSIC.update({ sleepMinutes: Number(minutes) || 0 })
  return until
}

export function sleepRemaining() { return engine.sleepRemaining() }

/** Log the minutes we just listened to (called on stop / sleep-timer / focus end). */
export function logListening(reason = 'stop', now = Date.now()) {
  const from = startedAt || MUSIC.read().lastPlayedAt
  startedAt = null
  if (!from) return 0
  const minutes = Math.max(1, Math.round((now - from) / 60000))
  const entry = {
    id: `ml_${now.toString(36)}`,
    preset: playingPreset || MUSIC.read().presetId,
    minutes,
    at: now,
    duringFocus: !!FOCUS.read().active,
    reason,
  }
  MUSIC.update((s) => ({ log: [entry, ...s.log].slice(0, 500) }))
  playingPreset = null
  return minutes
}

export function musicStats() {
  return listeningStats(MUSIC.read().log)
}

/** Called by the focus/forest flows: start the right music for a subject. */
export function startForSession({ subject = '', minutes = 0 } = {}) {
  if (!MUSIC.read().settings.autoplayWithFocus) return null
  if (isPlaying()) return null
  const preset = playPreset(null, { subject })
  // for long blocks we don't want a short sleep timer, so keep it off by default
  void minutes
  return preset
}

export function stopForSession() {
  if (!MUSIC.read().settings.autoStopWithFocus) return 0
  if (!isPlaying()) return 0
  return stopMusic()
}

export function playOwnFile(file) {
  const track = engine.playFile(file)
  startedAt = Date.now()
  playingPreset = 'own-file'
  return track
}

export function stopOwnFile() { engine.stopFile() }

export const ownTrack = () => engine.getState().ownTrack

export { engine, suggestPreset }

/**
 * Live-tweak the running preset: turn single layers on/off, swap the ambient
 * texture or the binaural band without losing the mixer settings.
 * patch = { music: {style:'pad'} | null, ambient: {...} | null, binaural: {band:'theta'} | null }
 */
export function applyLayers(patch = {}) {
  const preset = currentPreset()
  const conf = {
    music: preset.music,
    ambient: preset.ambient,
    binaural: preset.binaural,
  }
  Object.entries(patch).forEach(([key, value]) => {
    if (value === null) { conf[key] = null; return }
    conf[key] = { ...(conf[key] || {}), ...value }
  })
  engine.play(conf, { presetId: preset.id, mix: MUSIC.read().mix, fade: 1.5 })
  startedAt = startedAt || Date.now()
  playingPreset = preset.id
  MUSIC.update({ presetId: preset.id })
  return conf
}

export function toggleLayer(kind) {
  const st = engine.getState()
  const preset = currentPreset()
  if (st.layers[kind]) return applyLayers({ [kind]: null })
  const fallback = {
    music: preset.music || { style: 'pad', progression: 'lofi', root: 261.63, scale: 'pentatonicMinor', density: 0.3, tempo: 64 },
    ambient: preset.ambient || { type: 'brown', level: 0.5 },
    binaural: preset.binaural || { band: 'alpha', carrier: 200, level: 0.5 },
  }
  return applyLayers({ [kind]: fallback[kind] })
}
