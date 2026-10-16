// ============================================================
//  Bodhya sounds — 100% offline. Rendered live with the WebAudio
//  API (no .mp3 files to download, no API keys, works everywhere
//  a browser does). Used by alarms, notifications and the focus
//  timer.
// ============================================================

export const SOUNDS = [
  { id: 'chime',   emoji: '🎐', label: { en: 'Chime',        hi: 'घंटी',        te: 'చిమ్' } },
  { id: 'bell',    emoji: '🔔', label: { en: 'Bell',         hi: 'घंटा',        te: 'గంట' } },
  { id: 'birds',   emoji: '🐦', label: { en: 'Morning birds',hi: 'सुबह की चिड़ियाँ', te: 'ఉదయపు పక్షులు' } },
  { id: 'soft',    emoji: '🌙', label: { en: 'Soft pad',     hi: 'कोमल धुन',    te: 'సాఫ్ట్ ట్యూన్' } },
  { id: 'marimba', emoji: '🎹', label: { en: 'Marimba',      hi: 'मरिम्बा',     te: 'మరింబా' } },
  { id: 'alarm',   emoji: '⏰', label: { en: 'Classic alarm',hi: 'क्लासिक अलार्म', te: 'క్లాసిక్ అలారం' } },
  { id: 'beep',    emoji: '📟', label: { en: 'Beep',         hi: 'बीप',         te: 'బీప్' } },
  { id: 'none',    emoji: '🔇', label: { en: 'Silent',       hi: 'मौन',         te: 'నిశ్శబ్దం' } },
]

// the shared context lives in utils/audio.js so alarms, notification sounds and
// the study-music engine never fight over browser AudioContext limits
import { getAudioContext } from './audio.js'

function audioCtx() {
  return getAudioContext()
}

function tone(freq, startAt, dur, { type = 'sine', gain = 0.22, glideTo = null } = {}) {
  const ac = audioCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startAt + dur)
  // soft attack + release so nothing clicks
  g.gain.setValueAtTime(0.0001, startAt)
  g.gain.exponentialRampToValueAtTime(gain, startAt + Math.min(0.04, dur / 3))
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
  osc.connect(g).connect(getAudioContext().__bodhyaMaster || ac.destination)
  osc.start(startAt)
  osc.stop(startAt + dur + 0.02)
}

const PATTERNS = {
  chime:   (t0) => [[880, 0, 0.35], [1174, 0.18, 0.45]],
  bell:    (t0) => [[1318, 0, 0.7], [1760, 0.05, 0.6]],
  birds:   (t0) => [[2000, 0, 0.09, 'sine', 0.1, 2600], [2400, 0.14, 0.09, 'sine', 0.1, 1800], [2100, 0.3, 0.1, 'sine', 0.1, 2900]],
  soft:    (t0) => [[392, 0, 0.9], [523, 0.12, 0.9], [659, 0.24, 1.0]],
  marimba: (t0) => [[523, 0, 0.28], [659, 0.14, 0.28], [784, 0.28, 0.4], [1046, 0.42, 0.5]],
  alarm:   (t0) => [[1000, 0, 0.16], [1000, 0.22, 0.16], [1000, 0.44, 0.16], [1000, 0.66, 0.3]],
  beep:    (t0) => [[1500, 0, 0.1], [1500, 0.16, 0.1]],
  none:    () => [],
}

/** Play a one-shot sound (notification / preview / session done). */
export function playSound(id = 'chime', volume = 0.7) {
  const ac = audioCtx()
  if (!ac || id === 'none') return false
  const pattern = PATTERNS[id] || PATTERNS.chime
  const t0 = ac.currentTime + 0.02
  for (const [freq, offset, dur, type, gain, glideTo] of pattern(t0)) {
    tone(freq, t0 + offset, dur, { type: type || 'sine', gain: (gain ?? 0.22) * volume, glideTo })
  }
  return true
}

// ---------------------------------------------------------------
// Looping alarm (rings until stopped). Kept in module scope so any
// screen can stop it — the ring overlay, the notification centre,
// the chat command "stop the alarm".
// ---------------------------------------------------------------
let loopTimer = null
let loopState = { id: null, sound: 'alarm', volume: 0.8, vibrate: true, startedAt: 0 }

export function startAlarmLoop(sound = 'alarm', volume = 0.8, { vibrate = true, id = 'alarm' } = {}) {
  stopAlarmLoop()
  loopState = { id, sound, volume, vibrate, startedAt: Date.now() }
  const cycle = () => {
    playSound(sound, volume)
    if (loopState.vibrate) vibratePattern([300, 150, 300, 600])
  }
  cycle()
  loopTimer = setInterval(cycle, sound === 'alarm' ? 1600 : 2800)
  return loopState
}

export function stopAlarmLoop() {
  if (loopTimer) clearInterval(loopTimer)
  loopTimer = null
  loopState = { ...loopState, id: null }
  stopVibration()
}

export function isAlarmLooping() {
  return !!loopTimer
}

export function currentAlarmLoop() {
  return { ...loopState }
}

export function vibratePattern(pattern = [200, 100, 200]) {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern) } catch { /* unsupported */ }
}

export function stopVibration() {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(0) } catch { /* ignore */ }
}

/** Duck helper used by the music engine when an alarm rings. */
export function setDuck(amount = 1, seconds = 0.4) {
  const ac = getAudioContext()
  if (!ac || !ac.__bodhyaMaster) return
  try {
    const g = ac.__bodhyaMaster.gain
    g.cancelScheduledValues(ac.currentTime)
    g.setValueAtTime(g.value, ac.currentTime)
    g.linearRampToValueAtTime(Math.max(0.0001, amount), ac.currentTime + seconds)
  } catch { /* ignore */ }
}

/** Gentle 3-note "session complete" jingle. */
export function playSessionComplete(volume = 0.7) {
  playSound('marimba', volume)
}

/** Short UI tick (task checked off). */
export function playTick(volume = 0.5) {
  playSound('beep', volume)
}
