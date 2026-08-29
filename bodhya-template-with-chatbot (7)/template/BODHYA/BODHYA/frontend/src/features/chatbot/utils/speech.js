// ---------- Bodhya voice: input (STT) & output (TTS) using browser built-ins ----------
// No API keys, no servers. speechSynthesis + SpeechRecognition are free browser features.

let cachedVoices = []

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function sttSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function refreshVoices() {
  if (!ttsSupported()) return []
  try { cachedVoices = window.speechSynthesis.getVoices() } catch { cachedVoices = [] }
  return cachedVoices
}

if (ttsSupported()) {
  refreshVoices()
  try { window.speechSynthesis.onvoiceschanged = refreshVoices } catch {}
}

// Prefer a voice for the exact language, e.g. en-IN, hi-IN, te-IN
export function pickVoice(lang) {
  refreshVoices()
  const exact = cachedVoices.find(v => v.lang && v.lang.toLowerCase() === lang.toLowerCase())
  if (exact) return exact
  const prefix = lang.split('-')[0].toLowerCase()
  return cachedVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix)) || null
}

// Strip markdown/emoji so speech stays clean and natural
export function cleanForSpeech(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')                                        // bold
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '') // emoji
    .replace(/[·•▪▸]+/g, ',')
    .replace(/\n+/g, (m, off, str) => (/[.!?।]$/.test(str.slice(0, off).trimEnd()) ? ' ' : '. '))
    .replace(/\s+/g, ' ')
    .trim()
}

// Split long replies into chunks (browsers truncate very long utterances)
export function chunkText(text, max = 180) {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g) || [text]
  const chunks = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { chunks.push(cur.trim()); cur = s }
    else cur += s
  }
  if (cur.trim()) chunks.push(cur.trim())
  return chunks.length ? chunks : [text]
}

/**
 * Speak a reply aloud. Returns true if speech started.
 * @param {string} text
 * @param {{lang?: string, rate?: number}} opts
 * @param {{onStart?: Function, onEnd?: Function}} cbs
 */
export function speak(text, opts = {}, cbs = {}) {
  if (!ttsSupported()) return false
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
  const synth = window.speechSynthesis
  try { synth.cancel() } catch {}
  const chunks = chunkText(cleanForSpeech(text))
  if (!chunks.length) return false
  const { lang = 'en', rate = 1 } = opts
  const voice = pickVoice(lang)
  let finished = false
  const finish = () => { if (!finished) { finished = true; cbs.onEnd?.() } }
  const Utterance = window.SpeechSynthesisUtterance
  if (!Utterance) return false
  chunks.forEach((ch, i) => {
    const u = new Utterance(ch)
    u.lang = lang
    u.rate = rate
    if (voice) u.voice = voice
    u.onstart = () => { if (i === 0) cbs.onStart?.() }
    u.onend = finish
    u.onerror = finish
    try { synth.speak(u) } catch { finish() }
  })
  return true
}

export function stopSpeaking() {
  if (!ttsSupported()) return
  try { window.speechSynthesis.cancel() } catch {}
}
