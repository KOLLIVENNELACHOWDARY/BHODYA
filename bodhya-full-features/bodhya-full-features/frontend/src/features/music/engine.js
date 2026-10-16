// ============================================================
//  Study-music ENGINE — everything is synthesised live with the
//  Web Audio API. There are no mp3s, no streaming and no API keys,
//  so the music works offline and starts instantly.
//
//  Three independent layers, each with its own mixer bus:
//    🎹 music     — generative pads / piano / lo-fi groove / drone
//    📻 ambient   — brown·pink·white noise, rain, ocean, wind, café
//    🧠 binaural  — two tones, one per ear (headphones only)
//
//  The generative part schedules chords, sparse melodies and (for
//  the lo-fi preset) a soft kick+hat pattern a fraction of a second
//  ahead of the audio clock, which is how Web Audio music stays
//  tight without a worker thread.
// ============================================================

import { getAudioContext, getMasterBus, audioSupported } from '../chatbot/utils/audio.js'
import { emit, EVT } from '../chatbot/utils/events.js'
import {
  BEAT_BANDS, SCALES, PROGRESSIONS, noteHz, binauralPair, scaleNote, shouldPlay, safeMix,
} from './logic.js'

const HORIZON = 1.5        // seconds of music scheduled ahead of the clock
const TICK_MS = 200

// ----------------------------------------------------------------
//  state
// ----------------------------------------------------------------
const state = {
  playing: false,
  presetId: null,
  layers: { music: false, ambient: false, binaural: false },
  mix: { master: 0.8, music: 0.6, ambient: 0.5, binaural: 0.5 },
  startedAt: null,
  sleepMinutes: 0,
  sleepUntil: null,
  ducked: false,
  ownTrack: null,       // {name}
}

const listeners = new Set()
function notify() {
  listeners.forEach((fn) => { try { fn(getState()) } catch { /* ignore */ } })
  emit(EVT.musicChanged, { playing: state.playing, presetId: state.presetId })
}

export function getState() {
  return { ...state, layers: { ...state.layers }, mix: { ...state.mix }, supported: audioSupported() }
}
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ----------------------------------------------------------------
//  graph
// ----------------------------------------------------------------
let ctx = null
let engineGain = null
let musicBus = null
let ambientBus = null
let binauralBus = null
let ownGain = null

let ambientNodes = []
let binauralNodes = []
let activeVoices = []
let schedulerTimer = null
let sleepTimer = null
let scheduled = { chord: 0, pluck: 0, beat: 0, bar: 0 }
let musicConf = null

function buildGraph() {
  ctx = getAudioContext()
  if (!ctx) return false
  if (engineGain) return true
  engineGain = ctx.createGain()
  engineGain.gain.value = safeMix(state.mix).master
  engineGain.connect(getMasterBus() || ctx.destination)

  musicBus = ctx.createGain(); musicBus.gain.value = 0
  ambientBus = ctx.createGain(); ambientBus.gain.value = 0
  binauralBus = ctx.createGain(); binauralBus.gain.value = 0
  ownGain = ctx.createGain(); ownGain.gain.value = 0

  musicBus.connect(engineGain)
  ambientBus.connect(engineGain)
  binauralBus.connect(engineGain)
  ownGain.connect(engineGain)
  return true
}

function rampTo(param, value, seconds) {
  if (!ctx) return
  const t = ctx.currentTime
  try {
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
    param.linearRampToValueAtTime(Math.max(0.0001, value), t + Math.max(0.02, seconds))
  } catch { /* param detached */ }
}

function levelFor(kind) {
  const m = safeMix(state.mix)
  return {
    music: m.music * 0.55 * m.headroom,
    ambient: m.ambient * 0.42 * m.headroom,
    binaural: m.binaural * 0.14 * m.headroom,
  }[kind]
}

// ----------------------------------------------------------------
//  noise buffers + ambient layer
// ----------------------------------------------------------------
const bufferCache = new Map()

function noiseBuffer(type) {
  if (bufferCache.has(type)) return bufferCache.get(type)
  const seconds = 4
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  if (type === 'pink') {
    // Paul Kellet's pink-noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else if (type === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      d[i] = last * 3.2
    }
  } else {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  bufferCache.set(type, buf)
  return buf
}

function lfo(rate, depth, target, { base = 0 } = {}) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.frequency.value = rate
  osc.type = 'sine'
  g.gain.value = depth
  osc.connect(g).connect(target)
  if (base) target.value = base
  osc.start()
  return osc
}

function startAmbient(type, level) {
  if (!type || type === 'none') return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(['pink', 'white'].includes(type) ? type : 'brown')
  if (!['pink', 'white'].includes(type)) src.buffer = noiseBuffer('brown')
  src.loop = true

  const gain = ctx.createGain()
  gain.gain.value = levelFor('ambient') * level
  const chain = [src]

  if (type === 'brown') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.7
    src.connect(lp).connect(gain)
  } else if (type === 'white') {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120
    src.connect(hp).connect(gain)
  } else if (type === 'rain') {
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200
    const swell = ctx.createGain(); swell.gain.value = 0.9
    src.connect(hp).connect(lp).connect(swell).connect(gain)
    chain.push(swell)
    // slow swell so it reads as rain, not static
    chain.push(lfo(0.11, 0.09, swell.gain, { base: 0.9 }))
  } else if (type === 'ocean') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.6
    const swell = ctx.createGain(); swell.gain.value = 0.8
    src.connect(lp).connect(swell).connect(gain)
    chain.push(swell)
    chain.push(lfo(0.07, 0.35, swell.gain, { base: 0.8 }))
    chain.push(lfo(0.05, 180, lp.frequency, { base: 380 }))
  } else if (type === 'wind') {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.8
    const swell = ctx.createGain(); swell.gain.value = 0.85
    src.connect(bp).connect(swell).connect(gain)
    chain.push(lfo(0.06, 220, bp.frequency, { base: 480 }))
    chain.push(lfo(0.04, 0.2, swell.gain, { base: 0.85 }))
  } else if (type === 'cafe') {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 260; bp.Q.value = 0.5
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800
    const murmur = ctx.createGain(); murmur.gain.value = 0.9
    src.connect(bp).connect(lp).connect(murmur).connect(gain)
    chain.push(lfo(0.21, 0.08, murmur.gain, { base: 0.9 }))
    chain.push(lfo(0.13, 0.06, murmur.gain, { base: 0.9 }))
  } else {
    src.connect(gain)
  }

  src.start()
  gain.connect(ambientBus)
  ambientNodes.push({ src, gain, chain })
}

// ----------------------------------------------------------------
//  binaural layer (headphones)
// ----------------------------------------------------------------
function startBinaural(band, carrier, level) {
  const { left, right, beat } = binauralPair(band, carrier)
  const merger = ctx.createChannelMerger(2)
  const gain = ctx.createGain()
  gain.gain.value = levelFor('binaural') * level * 0.5
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200

  const oL = ctx.createOscillator(); oL.type = 'sine'; oL.frequency.value = left
  const oR = ctx.createOscillator(); oR.type = 'sine'; oR.frequency.value = right
  oL.connect(merger, 0, 0)
  oR.connect(merger, 0, 1)
  merger.connect(lp).connect(gain)
  gain.connect(binauralBus)

  // gentle pulse at exactly the beat frequency so you can *feel* it too
  const pulse = lfo(beat / 2, 0.012, gain.gain, { base: gain.gain.value })

  oL.start(); oR.start()
  binauralNodes.push({ oL, oR, gain, pulse, beat })
}

// ----------------------------------------------------------------
//  generative music layer
// ----------------------------------------------------------------
function voice({ freq, at, dur, type = 'sine', gain = 0.09, pan = 0, attack = 2.2, release = 3.2, detune = 0 }) {
  const osc = ctx.createOscillator()
  const o2 = ctx.createOscillator()
  const g = ctx.createGain()
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1500
  lp.Q.value = 0.3

  osc.type = type
  osc.frequency.value = freq
  osc.detune.value = detune
  o2.type = 'triangle'
  o2.frequency.value = freq * 2.002
  o2.detune.value = -detune

  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(gain, at + attack)
  g.gain.setValueAtTime(gain, at + Math.max(attack, dur - release))
  g.gain.linearRampToValueAtTime(0.0001, at + dur)

  osc.connect(g)
  o2.connect(g)
  if (p) { g.connect(lp).connect(p); p.pan.value = pan; p.connect(musicBus) }
  else { g.connect(lp).connect(musicBus) }

  osc.start(at); o2.start(at)
  osc.stop(at + dur + 0.1); o2.stop(at + dur + 0.1)
  activeVoices.push({ stop: () => { try { osc.stop(); o2.stop() } catch { /* ignore */ } }, endAt: at + dur })
}

function pluck({ freq, at, gain = 0.06, pan = 0 }) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = freq
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 1.1)
  osc.connect(g)
  if (p) { p.pan.value = pan; g.connect(p).connect(musicBus) } else { g.connect(musicBus) }
  osc.start(at); osc.stop(at + 1.2)
  activeVoices.push({ stop: () => { try { osc.stop() } catch { /* ignore */ } }, endAt: at + 1.2 })
}

function kick(at) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(115, at)
  osc.frequency.exponentialRampToValueAtTime(46, at + 0.16)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(0.16, at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34)
  osc.connect(g).connect(musicBus)
  osc.start(at); osc.stop(at + 0.4)
  activeVoices.push({ stop: () => { try { osc.stop() } catch { /* ignore */ } }, endAt: at + 0.4 })
}

function hat(at) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer('white')
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(0.028, at + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
  src.connect(hp).connect(g).connect(musicBus)
  const stopAt = at + 0.08
  src.start(at); src.stop(stopAt)
  activeVoices.push({ stop: () => { try { src.stop() } catch { /* ignore */ } }, endAt: stopAt })
}

let droneNodes = null
function startDrone(root, scale) {
  // a continuous bed: root, fifth, octave with slow breathing amplitude
  droneNodes = []
  const offsets = [0, 7, 12, 19]
  offsets.forEach((semi, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 700
    osc.type = i === 0 ? 'sine' : 'triangle'
    osc.frequency.value = noteHz(root / 2, scale[semi % scale.length] ?? semi)
    g.gain.value = i === 0 ? 0.065 : 0.03
    osc.connect(lp).connect(g).connect(musicBus)
    g.gain.value = g.gain.value
    osc.start()
    const breath = lfo(0.03 + i * 0.007, (i === 0 ? 0.02 : 0.012), g.gain, { base: i === 0 ? 0.065 : 0.03 })
    droneNodes.push({ osc, g, breath })
  })
}
function stopDrone() {
  if (!droneNodes) return
  droneNodes.forEach(({ osc, breath }) => {
    try { breath.stop() } catch { /* ignore */ }
    try { osc.stop() } catch { /* ignore */ }
  })
  droneNodes = null
}

function scheduleMusic() {
  if (!musicConf || !ctx) return
  const { style, progression, root, scale: scaleName, density, tempo } = musicConf
  const scale = SCALES[scaleName] || SCALES.pentatonicMinor
  const chords = PROGRESSIONS[progression] || PROGRESSIONS.lofi
  const bar = (60 / Math.max(40, tempo)) * 4
  const now = ctx.currentTime

  // ---- chords (2 bars each, overlapping tails) ----
  while (scheduled.chord < now + HORIZON) {
    const at = Math.max(now + 0.06, scheduled.chord || now + 0.06)
    const chord = chords[scheduled.bar % chords.length]
    const dur = bar * 2 + 3        // long release over the next chord
    chord.forEach((semi, i) => {
      voice({
        freq: noteHz(root, semi),
        at,
        dur,
        gain: style === 'drone' ? 0.035 : 0.075 / Math.max(1, i * 0.55 + 1),
        attack: 2.6,
        release: 3.4,
        pan: (i - (chord.length - 1) / 2) * 0.25,
        detune: i % 2 ? 4 : -4,
      })
    })
    scheduled.chord = at + bar * 2
    scheduled.bar += 1
  }

  // ---- sparse melody / plucks ----
  while (scheduled.pluck < now + HORIZON) {
    const at = Math.max(now + 0.1, scheduled.pluck || now + 0.1)
    if (shouldPlay(density)) {
      const step = Math.floor(Math.random() * scale.length * 2)
      const octave = style === 'piano' ? 2 : Math.random() < 0.3 ? 2 : 1
      pluck({
        freq: noteHz(root, scaleNote(scale, step, octave)),
        at,
        gain: style === 'drone' ? 0.035 : 0.055,
        pan: (Math.random() - 0.5) * 0.7,
      })
    }
    scheduled.pluck = at + (bar / 2) * (0.6 + Math.random() * 0.8)
  }

  // ---- soft lo-fi pulse (only the groove presets) ----
  if (style === 'lofi') {
    while (scheduled.beat < now + HORIZON) {
      const at = Math.max(now + 0.1, scheduled.beat || now + 0.1)
      const beatIndex = Math.round((at - (scheduled.beat0 || at)) / (bar / 4))
      void beatIndex
      if (scheduled.beatBar % 4 === 0) kick(at)
      if (scheduled.beatBar % 4 === 2) hat(at + bar / 8)
      if (scheduled.beatBar % 4 === 3 && Math.random() < 0.5) hat(at)
      scheduled.beat = at + bar / 4
      scheduled.beatBar = (scheduled.beatBar || 0) + 1
    }
  }
}

function startScheduler(conf) {
  musicConf = conf
  const now = ctx.currentTime
  scheduled = { chord: now + 0.1, pluck: now + 1.0, beat: now + 0.4, bar: 0, beatBar: 0 }
  if (conf.style === 'drone') startDrone(conf.root, SCALES[conf.scale] || SCALES.pentatonicMinor)
  scheduleMusic()
  schedulerTimer = setInterval(() => {
    try {
      if (conf.style === 'drone' && droneNodes) return   // drone bed plays on its own
      // prune finished voices so long sessions don't pile up nodes
      activeVoices = activeVoices.filter((v) => v.endAt > ctx.currentTime - 1)
      scheduleMusic()
    } catch { /* keep playing */ }
  }, TICK_MS)
}

// ----------------------------------------------------------------
//  own audio files (optional: drop your own mp3/ogg)
// ----------------------------------------------------------------
let ownEl = null
let ownSource = null
const ownUrls = []

export function playFile(file, { loop = true, volume = 1 } = {}) {
  if (!buildGraph() || !file) return null
  const url = URL.createObjectURL(file)
  ownUrls.push(url)
  if (!ownEl) {
    ownEl = new Audio()
    ownEl.crossOrigin = 'anonymous'
    ownEl.addEventListener('ended', () => { if (loop) ownEl.play().catch(() => {}) })
    try {
      ownSource = ctx.createMediaElementSource(ownEl)
      ownSource.connect(ownGain)
    } catch { ownSource = null }
  }
  ownEl.loop = loop
  ownEl.src = url
  ownEl.play().catch(() => {})
  ownGain.gain.value = 0
  rampTo(ownGain.gain, levelFor('music') * volume, 1.2)
  state.ownTrack = { name: file.name, url }
  notify()
  return state.ownTrack
}

export function stopFile({ fade = 0.8 } = {}) {
  if (!ownEl) return
  rampTo(ownGain.gain, 0, fade)
  setTimeout(() => { try { ownEl.pause() } catch { /* ignore */ } }, fade * 1000)
  state.ownTrack = null
  notify()
  ownUrls.splice(0).forEach((u) => { try { URL.revokeObjectURL(u) } catch { /* ignore */ } })
}

// ----------------------------------------------------------------
//  public controls
// ----------------------------------------------------------------
/**
 * Start a preset.
 * @param {{music?:object|null, ambient?:object|null, binaural?:object|null}} conf
 * @param {{mix?:object, fade?:number, presetId?:string, sleepMinutes?:number}} opts
 */
export function play(conf = {}, opts = {}) {
  if (!buildGraph()) return false
  if (opts.mix) state.mix = { ...state.mix, ...opts.mix }
  const levels = safeMix(state.mix)
  rampTo(engineGain.gain, levels.master, 0.4)

  stopLayers({ fade: 0, keepFile: true })
  state.layers = { music: false, ambient: false, binaural: false }
  state.presetId = opts.presetId ?? null

  const fade = opts.fade ?? 3
  if (conf.music && conf.music.style && conf.music.style !== 'none') {
    state.layers.music = true
    startScheduler(conf.music)
    rampTo(musicBus.gain, levelFor('music'), fade)
  }
  if (conf.ambient && conf.ambient.type && conf.ambient.level > 0) {
    state.layers.ambient = true
    startAmbient(conf.ambient.type, conf.ambient.level)
    rampTo(ambientBus.gain, levelFor('ambient') * (conf.ambient.level ?? 0.5) * 2, fade)
  }
  if (conf.binaural && conf.binaural.level > 0) {
    state.layers.binaural = true
    startBinaural(conf.binaural.band, conf.binaural.carrier ?? 200, conf.binaural.level)
    rampTo(binauralBus.gain, levelFor('binaural') * 2.2, fade)
  }

  state.playing = true
  state.startedAt = Date.now()
  if (opts.sleepMinutes) setSleepTimer(opts.sleepMinutes)
  else clearSleepTimer(false)
  notify()
  return true
}

function stopLayers({ fade = 2, keepFile = true } = {}) {
  if (ctx) {
    if (ambientBus) rampTo(ambientBus.gain, 0, fade * 0.7)
    if (binauralBus) rampTo(binauralBus.gain, 0, fade * 0.7)
    if (musicBus) rampTo(musicBus.gain, 0, fade)
  }
  const killAfter = Math.max(0, fade * 1000)
  setTimeout(() => {
    if (schedulerTimer) { clearInterval(schedulerTimer); schedulerTimer = null }
    ambientNodes.forEach(({ src, chain }) => {
      try { src.stop() } catch { /* ignore */ }
      chain.forEach((n) => { try { n.stop?.() } catch { /* ignore */ } })
    })
    ambientNodes = []
    binauralNodes.forEach(({ oL, oR, pulse }) => {
      try { oL.stop(); oR.stop(); pulse.stop() } catch { /* ignore */ }
    })
    binauralNodes = []
    stopDrone()
    activeVoices.forEach((v) => { try { v.stop() } catch { /* ignore */ } })
    activeVoices = []
    if (!keepFile) stopFile({ fade: 0.2 })
  }, killAfter)
}

/** Stop everything (music + ambient + binaural). Optionally keep a file playing. */
export function stop({ fade = 2, keepFile = false } = {}) {
  if (!state.playing && !state.ownTrack) return false
  stopLayers({ fade, keepFile })
  state.playing = false
  state.layers = { music: false, ambient: false, binaural: false }
  state.startedAt = null
  clearSleepTimer(false)
  notify()
  return true
}

export function setMix(patch = {}) {
  state.mix = { ...state.mix, ...patch }
  if (engineGain) {
    rampTo(engineGain.gain, safeMix(state.mix).master, 0.25)
    if (state.layers.music) rampTo(musicBus.gain, levelFor('music'), 0.3)
    if (state.layers.ambient) rampTo(ambientBus.gain, levelFor('ambient') * 1.6, 0.3)
    if (state.layers.binaural) rampTo(binauralBus.gain, levelFor('binaural') * 2.2, 0.3)
  }
  notify()
  return state.mix
}

export function setSleepTimer(minutes) {
  clearSleepTimer(false)
  const m = Number(minutes) || 0
  state.sleepMinutes = m
  if (!m) { state.sleepUntil = null; notify(); return null }
  state.sleepUntil = Date.now() + m * 60000
  sleepTimer = setTimeout(() => {
    stop({ fade: 6 })
    emit(EVT.musicSleep, { minutes: m })
  }, m * 60000)
  notify()
  return state.sleepUntil
}

export function clearSleepTimer(withNotify = true) {
  if (sleepTimer) clearTimeout(sleepTimer)
  sleepTimer = null
  state.sleepUntil = null
  if (withNotify) notify()
}

export function sleepRemaining() {
  return state.sleepUntil ? Math.max(0, state.sleepUntil - Date.now()) : 0
}

/** Duck the music while an alarm rings (never touches the global master). */
export function duck(amount = 0.22, seconds = 0.5) {
  if (!engineGain || state.ducked) return
  state.ducked = true
  rampTo(engineGain.gain, safeMix(state.mix).master * amount, seconds)
}
export function unduck(seconds = 1.2) {
  if (!engineGain || !state.ducked) return
  state.ducked = false
  rampTo(engineGain.gain, safeMix(state.mix).master, seconds)
}

export function elapsedMinutes() {
  if (!state.startedAt) return 0
  return Math.max(0, Math.round((Date.now() - state.startedAt) / 60000))
}

export const EVENTS = { changed: EVT.musicChanged, sleep: EVT.musicSleep }
