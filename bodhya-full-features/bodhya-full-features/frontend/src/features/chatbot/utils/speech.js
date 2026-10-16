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


// ----------------------------------------------------------------
//  Shared speech-recognition wrapper.
//  Both the chat panel and the journal's voice notes use this, so
//  there is one place for language mapping, interim results and the
//  (fiddly) error names browsers report.
// ----------------------------------------------------------------

/** BCP-47 tag for a Bodhya language code. */
export const SPEECH_LANG = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }

export function speechLangFor(lang = 'en') {
  return SPEECH_LANG[String(lang).slice(0, 2)] || 'en-IN'
}

/** Normalise the error names SpeechRecognition actually throws. */
export function sttErrorKey(error = '') {
  const e = String(error)
  if (e === 'not-allowed' || e === 'service-not-allowed') return 'denied'
  if (e === 'no-speech') return 'no-speech'
  if (e === 'audio-capture') return 'no-mic'
  if (e === 'network') return 'network'
  if (e === 'aborted') return 'aborted'
  return 'generic'
}

/**
 * Create a recogniser (or null when the browser has none).
 * @param {{lang?:string, continuous?:boolean, interimResults?:boolean,
 *          onPartial?:Function, onFinal?:Function, onError?:Function,
 *          onStart?:Function, onEnd?:Function}} opts
 * @returns {{start:Function, stop:Function, abort:Function, supported:boolean}|null}
 */
export function createRecognizer(opts = {}) {
  if (!sttSupported()) return null
  const {
    lang = 'en-IN', continuous = false, interimResults = true,
    onPartial, onFinal, onError, onStart, onEnd,
  } = opts
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  let rec = null
  let finalText = ''
  let stopped = false

  function build() {
    rec = new SR()
    rec.lang = lang
    rec.continuous = continuous
    rec.interimResults = interimResults
    rec.maxAlternatives = 1

    rec.onstart = () => onStart?.()

    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const text = res[0]?.transcript || ''
        if (res.isFinal) finalText += (finalText ? ' ' : '') + text.trim()
        else interim += text
      }
      onPartial?.({ interim, final: finalText })
    }

    rec.onerror = (event) => onError?.(sttErrorKey(event?.error), event?.error)

    rec.onend = () => {
      // some browsers fire onend before the last final result - give it a tick
      setTimeout(() => {
        const text = finalText.trim()
        if (!stopped && text) onFinal?.(text)
        onEnd?.(text)
      }, 120)
    }
  }

  return {
    supported: true,
    start() {
      stopped = false
      finalText = ''
      try {
        if (!rec) build()
        rec.start()
      } catch {
        // already started (Chrome throws) - restart cleanly
        try { rec.abort() } catch { /* ignore */ }
        build()
        try { rec.start() } catch { onError?.('generic', 'start-failed') }
      }
    },
    stop() {
      try { rec?.stop() } catch { /* ignore */ }
    },
    /** Cancel and throw away the transcript (used by "discard"). */
    abort() {
      stopped = true
      finalText = ''
      try { rec?.abort() } catch { /* ignore */ }
    },
    get transcript() { return finalText.trim() },
  }
}

/** Rough spoken length of a text, for the "read it back" button. */
export function estimateSpeakingMinutes(text, wordsPerMinute = 150) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(0, Math.round((words / wordsPerMinute) * 60))
}
