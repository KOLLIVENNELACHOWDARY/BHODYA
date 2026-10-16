// ============================================================
//  Shared Web-Audio context for the whole app.
//  Browsers allow only a handful of AudioContexts, so alarms,
//  notification sounds and the study-music engine all share this
//  one. It is created lazily on the first user gesture (browser
//  autoplay policy) and resumed whenever it gets suspended.
// ============================================================

let ctx = null
let unlocked = false

export function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    try { ctx = new AC({ latencyHint: 'interactive' }) } catch { return null }
    // iOS/Safari: resume on the first touch/click anywhere
    if (!unlocked && typeof document !== 'undefined') {
      unlocked = true
      const unlock = () => { try { ctx.resume() } catch { /* ignore */ } }
      document.addEventListener('pointerdown', unlock, { once: true, passive: true })
      document.addEventListener('keydown', unlock, { once: true, passive: true })
    }
  }
  if (ctx.state === 'suspended') { try { ctx.resume() } catch { /* ignore */ } }
  return ctx
}

export function audioSupported() {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || window.webkitAudioContext)
}

/** A master bus so features can duck each other (music vs alarms). */
export function getMasterBus() {
  const ac = getAudioContext()
  if (!ac) return null
  if (!ac.__bodhyaMaster) {
    const master = ac.createGain()
    master.gain.value = 1
    master.connect(ac.destination)
    ac.__bodhyaMaster = master
  }
  return ac.__bodhyaMaster
}

/** Linear gain ramp that never clicks (exponential ramps can't touch 0). */
export function ramp(param, to, seconds = 1, now = null) {
  const ac = getAudioContext()
  if (!ac) return
  const t = now ?? ac.currentTime
  try {
    param.cancelScheduledValues(t)
    param.setValueAtTime(Math.max(0.0001, param.value || 0.0001), t)
    param.linearRampToValueAtTime(Math.max(0.0001, to), t + Math.max(0.01, seconds))
  } catch { /* param gone */ }
}

export function nowTime() {
  const ac = getAudioContext()
  return ac ? ac.currentTime : 0
}
