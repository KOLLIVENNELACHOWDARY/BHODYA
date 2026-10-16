// ============================================================
//  VoiceNote — dictate a journal entry instead of typing.
//
//  Uses the browser's free SpeechRecognition (no keys, no server),
//  the same API the chat mic uses, through the shared helper in
//  chatbot/utils/speech.js. Interim text shows while you talk; when
//  you stop, the transcript is appended to the draft so you can fix
//  the inevitable mis-hearings before saving.
//
//  Also offers "read it back" (speechSynthesis) so you can hear your
//  own words — surprisingly good for catching a rambling entry.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { createRecognizer, estimateSpeakingMinutes, speak, speechLangFor, stopSpeaking, sttSupported, ttsSupported } from '../chatbot/utils/speech.js'
import { tr } from '../chatbot/i18n/features.js'

const LANGS = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { id: 'te', label: 'తెలుగు', flag: '🇮🇳' },
]

export default function VoiceNote({ lang = 'en', onAppend, onReadAloud, readText = '' }) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const [error, setError] = useState(null)
  const [speechLang, setSpeechLang] = useState(lang)
  const [speaking, setSpeaking] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recRef = useRef(null)
  const timerRef = useRef(null)
  const supported = sttSupported()

  useEffect(() => { setSpeechLang(lang) }, [lang])

  useEffect(() => () => {
    try { recRef.current?.abort() } catch { /* ignore */ }
    if (timerRef.current) clearInterval(timerRef.current)
    stopSpeaking()
  }, [])

  function start() {
    setError(null)
    setInterim('')
    setFinalText('')
    const rec = createRecognizer({
      lang: speechLangFor(speechLang),
      continuous: true,
      interimResults: true,
      onStart: () => {
        setListening(true)
        setSeconds(0)
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      },
      onPartial: ({ interim: i }) => setInterim(i || ''),
      onFinal: (text) => setFinalText(text),
      onError: (key) => {
        setError(key)
        setListening(false)
      },
      onEnd: (text) => {
        setListening(false)
        if (timerRef.current) clearInterval(timerRef.current)
        const spoken = (text || '').trim()
        if (spoken) {
          setFinalText(spoken)
          // hand it to the draft but let the user confirm in the UI too
          onAppend?.(spoken)
        }
      },
    })
    if (!rec) { setError('unsupported'); return }
    recRef.current = rec
    rec.start()
  }

  function stop() {
    try { recRef.current?.stop() } catch { /* ignore */ }
    setListening(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function discard() {
    try { recRef.current?.abort() } catch { /* ignore */ }
    setListening(false)
    setInterim('')
    setFinalText('')
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function readBack() {
    const text = readText || finalText
    if (!text) return
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    speak(text, { lang: speechLangFor(lang), rate: 0.95 }, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    })
  }

  const errorText = {
    denied: tr(lang, 'journal.voiceDenied'),
    'no-speech': tr(lang, 'journal.voiceNoSpeech'),
    'no-mic': tr(lang, 'journal.voiceNoMic'),
    network: tr(lang, 'journal.voiceNetwork'),
    unsupported: tr(lang, 'journal.voiceUnsupported'),
    generic: tr(lang, 'journal.voiceFailed'),
  }[error]

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-extrabold text-rose-700">🎤 {tr(lang, 'journal.voiceTitle')}</span>

        {!listening ? (
          <button type="button" onClick={start} disabled={!supported}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              supported ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-200 text-slate-400'
            }`}>
            {tr(lang, 'journal.voiceStart')}
          </button>
        ) : (
          <>
            <button type="button" onClick={stop}
              className="animate-pulse rounded-full bg-rose-700 px-3.5 py-1.5 text-[12px] font-bold text-white">
              ⏹ {tr(lang, 'journal.voiceStop')} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </button>
            <button type="button" onClick={discard}
              className="rounded-full border border-rose-300 px-3 py-1.5 text-[12px] font-bold text-rose-700 hover:bg-white">
              {tr(lang, 'common.cancel')}
            </button>
          </>
        )}

        <span className="flex gap-1">
          {LANGS.map((l) => (
            <button key={l.id} type="button" onClick={() => setSpeechLang(l.id)} disabled={listening}
              className={`rounded-full px-2 py-1 text-[11px] font-bold transition ${
                speechLang === l.id ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              } ${listening ? 'opacity-60' : ''}`}>
              {l.flag} {l.label}
            </button>
          ))}
        </span>

        {ttsSupported() && (readText || finalText) && (
          <button type="button" onClick={readBack}
            className={`ml-auto rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
              speaking ? 'bg-indigo-600 text-white' : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
            }`}>
            {speaking ? `🔊 ${tr(lang, 'journal.reading')}` : `🔊 ${tr(lang, 'journal.readAloud')}`}
          </button>
        )}
      </div>

      {/* live transcript */}
      {(listening || interim || finalText) && (
        <p className="mt-2 min-h-[20px] text-[12.5px] leading-relaxed text-slate-700">
          <span>{finalText} </span>
          <span className="italic text-slate-400">{interim}</span>
        </p>
      )}

      {!supported && (
        <p className="mt-2 text-[11.5px] text-slate-500">ℹ️ {tr(lang, 'journal.voiceUnsupported')}</p>
      )}
      {errorText && <p className="mt-2 text-[11.5px] font-bold text-rose-700">⚠️ {errorText}</p>}

      {!listening && finalText && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[11.5px] font-bold text-slate-500">
            ✅ {tr(lang, 'journal.voiceAdded')} ({estimateSpeakingMinutes(finalText) > 0
              ? tr(lang, 'journal.voiceSpokenFor', { s: estimateSpeakingMinutes(finalText) })
              : ''})
          </span>
          <button type="button" onClick={() => onAppend?.(finalText)}
            className="rounded-full bg-slate-800 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-slate-900">
            {tr(lang, 'journal.voiceAddAgain')}
          </button>
        </div>
      )}

      <p className="mt-1.5 text-[10.5px] text-rose-400">{tr(lang, 'journal.voiceHint')}</p>
    </div>
  )
}
