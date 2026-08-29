// ---------- Bodhya chat panel (Tailwind) — feature: chatbot ----------
import { useEffect, useRef, useState } from 'react'
import { think, resolveTone } from '../brain/engine.js'
import { loadState, updateProfile } from '../brain/memory.js'
import { LANGS, t } from '../i18n/ui.js'
import { LEVEL_NAMES } from '../brain/responses.js'
import { speak, stopSpeaking, ttsSupported, sttSupported } from '../utils/speech.js'
import { avatarImg, avatarEmoji } from '../data/avatars.js'
import { chatWithLLM } from '../brain/llmAgent.js'

// Tiny markdown-lite renderer: **bold** + newlines
function renderText(text) {
  const lines = String(text).split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
    return (
      <span key={i}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-bold">{p.slice(2, -2)}</strong>
            : <span key={j}>{p}</span>
        )}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

const WELCOME = {
  en: (name, avatar) => `Hey${name ? ' ' + name : ''}! I'm Bodhya ${avatar} — your offline guide.\n\nI don't teach topics; I make sure you never feel lost! Say **"I'm stuck"** and I'll help on any page, **"show me around"** for a guided tour, or **"add maths 30 minutes"** to plan your day. 🎤 Try the mic to talk — I'll read my replies aloud too!`,
  hi: (name, avatar) => `नमस्ते${name ? ' ' + name : ''}! मैं Bodhya ${avatar} हूँ — आपका ऑफ़लाइन गाइड।\n\nमैं टॉपिक नहीं पढ़ाता; मैं ये सुनिश्चित करता हूँ कि आप कभी खोए न महसूस करें! **"मैं अटक गया"** बोलिए, **"घुमाओ"** कहिए — गाइडेड टूर, या **"गणित 30 मिनट जोड़ो"** से दिन की योजना बनाइए। 🎤 माइक से बोलिए — मैं जवाब ज़ोर से भी पढ़ूँगा!`,
  te: (name, avatar) => `నమస్కారం${name ? ' ' + name : ''}! నేను Bodhya ${avatar} ని — మీ ఆఫ్‌లైన్ గైడ్.\n\nనేను టాపిక్‌లు నేర్పించను; మీరు ఎప్పుడూ దారి తప్పకుండా చూస్తాను! **"నేను ఇరుక్కున్నా"** అనండి, **"చూపించు"** అనండి — గైడెడ్ టూర్, లేదా **"గణితం 30 నిమిషాలు జోడించు"** అని ప్లాన్ చేయండి. 🎤 మైక్ నొక్కి మాట్లాడండి — జవాబులు బిగ్గరగా చదువుతాను!`
}

const WELCOME_QUICK = {
  en: ['What can you do?', 'Show me around', "I'm stuck"],
  hi: ['तुम क्या कर सकते हो?', 'घुमाओ', 'मैं अटक गया'],
  te: ['నువ్వు ఏం చేయగలవు?', 'చూపించు', 'నేను ఇరుక్కున్నా']
}

export default function ChatPanel({ open, onClose, context, onAction }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceOut, setVoiceOut] = useState(() => loadState().profile.voiceOut !== false)
  const [speaking, setSpeaking] = useState(false)
  const [aiMode, setAiMode] = useState(null) // null=offline rules | 'llm' | 'rule-backend'
  const bottomRef = useRef(null)
  const recRef = useRef(null)
  const stateRef = useRef({ context })
  const pendingFinalRef = useRef('')
  const historyRef = useRef([]) // [{role, content}] for the LLM agent

  useEffect(() => { stateRef.current.context = context }, [context])

  // the AGENT can open the chat with a message:
  // window.dispatchEvent(new CustomEvent('bodhya:chat-message', { detail: { text } }))
  useEffect(() => {
    const onMsg = (e) => {
      const text = e.detail?.text;
      if (text) setTimeout(() => send(text), 350);
    };
    window.addEventListener('bodhya:chat-message', onMsg);
    return () => window.removeEventListener('bodhya:chat-message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = loadState().profile
  const lang = profile.lang || 'en'
  const avatar = avatarImg(profile.avatar || 'banyan')
  const avatarEmo = avatarEmoji(profile.avatar || 'banyan')

  useEffect(() => {
    if (open && !welcomed) {
      setWelcomed(true)
      const name = (profile.name || '').trim()
      setMessages([{ role: 'bot', text: WELCOME[lang](name, avatarEmo), quick: WELCOME_QUICK[lang] }])
      say(WELCOME[lang](name, avatarEmo), lang)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  useEffect(() => () => stopSpeaking(), [])

  function say(text, speechLang) {
    if (!voiceOut || !ttsSupported() || !text) return
    const tone = resolveTone(loadState().profile)
    speak(text, { lang: speechLang || lang, rate: tone === 'kid' ? 0.92 : 1 }, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false)
    })
  }

  function toggleVoice() {
    const next = !voiceOut
    setVoiceOut(next)
    updateProfile({ voiceOut: next })
    if (!next) { stopSpeaking(); setSpeaking(false) }
  }

  function pushBot(text, quick, action) {
    setMessages(m => [...m, { role: 'bot', text, quick: quick || [], action: action || null }])
  }

  // occasionally (≈1 in 3 replies) Bodhya asks a light follow-up, like a human would
  const FOLLOWUPS = {
    en: ['What would you like to do next?', 'Want me to show you around?', 'Fancy a quick quiz?', 'Should we add a study task?'],
    hi: ['आगे क्या करना चाहेंगे?', 'क्या टूर दिखाऊँ?', 'एक क्विक क्विज़ लें?', 'कोई स्टडी टास्क जोड़ें?'],
    te: ['తర్వాత ఏం చేద్దాం?', 'టూర్ చూపించాలా?', 'క్విక్ క్విజ్ ఆడదాం?', 'స్టడీ టాస్క్ జోడించాలా?']
  };
  function maybeFollowUp() {
    if (Math.random() > 0.35) return;
    const list = FOLLOWUPS[lang] || FOLLOWUPS.en;
    const q = list[Math.floor(Math.random() * list.length)];
    setTimeout(() => setMessages(m => [...m, { role: 'bot', text: q, quick: [] }]), 900 + Math.random() * 900);
  }

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || typing) return
    stopSpeaking()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    historyRef.current.push({ role: 'user', content: msg })
    setTyping(true)
    // human-like reaction time: longer messages take a moment to "read"
    const thinkMs = 400 + Math.min(msg.length * 6, 1200) + Math.random() * 500;
    await new Promise(r => setTimeout(r, thinkMs))

    // 1) try the LLM AGENT (backend /api/chatbot-guide/chat → team's llm_router)
    let result = null
    let usedLLM = false
    const llm = await chatWithLLM(historyRef.current, {
      context: stateRef.current.context,
      lang,
      profile: { name: profile.name, ageGroup: profile.ageGroup, lang },
    })
    if (llm) {
      result = { text: llm.text, quick: [], action: llm.action }
      usedLLM = true
      setAiMode(llm.mode)
    } else {
      // 2) fallback: offline rule brain (works with zero backend)
      result = think(msg, { context: stateRef.current.context })
      setAiMode(null)
    }
    setTyping(false)
    pushBot(result.text, result.quick, result.action)
    historyRef.current.push({ role: 'assistant', content: result.text })
    say(result.text, result.lang || lang)
    if (!result.action && !usedLLM) maybeFollowUp()
    if (result.action === 'openQuiz') onAction?.('openQuiz')
    if (result.action === 'startTour') onAction?.('startTour')
    if (result.action === 'refreshPlanner') onAction?.('refreshPlanner')
    if (result.lang && result.lang !== profile.lang) updateProfile({ lang: result.lang })
  }

  function startListening() {
    if (!sttSupported()) { pushBot(t(lang, 'chat.noMic')); return }
    stopSpeaking()
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    recRef.current = rec
    rec.lang = (LANGS.find(l => l.code === lang)?.speech) || 'en-IN'
    rec.interimResults = true
    rec.continuous = false
    pendingFinalRef.current = ''
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript
        if (e.results[i].isFinal) final += tr
        else interim += tr
      }
      if (final) pendingFinalRef.current = final
      setInput(final || interim)
    }
    rec.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') pushBot(t(lang, 'chat.micDenied'))
      else if (e.error === 'no-speech') pushBot(t(lang, 'chat.noSpeech'))
    }
    rec.onend = () => {
      setListening(false)
      const final = pendingFinalRef.current
      if (final) { pendingFinalRef.current = ''; setTimeout(() => send(final), 350) }
    }
    try { rec.start() } catch { setListening(false) }
  }

  function stopListening() { try { recRef.current?.stop() } catch {} setListening(false) }

  if (!open) return null

  return (
    <div className="fixed right-4 bottom-24 z-[70] flex h-[min(600px,calc(100vh-130px))] w-[390px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white">
        <img src={avatar} alt="Bodhya" className="h-9 w-9 rounded-full object-cover shadow-md ring-2 ring-white/60" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-extrabold leading-tight">
            {t(lang, 'chat.title')}
            <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9.5px] font-extrabold text-emerald-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              {lang === 'hi' ? 'साथ हूँ' : lang === 'te' ? 'తో ఉన్నాను' : 'with you'}
            </span>
            <span title={aiMode === 'llm' ? 'Powered by AI' : 'Offline guide'}
              className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold ${aiMode === 'llm' ? 'bg-fuchsia-400/25 text-fuchsia-100' : 'bg-white/15 text-white/80'}`}>
              {aiMode === 'llm' ? '✨ AI' : '⚡'}
            </span>
          </div>
          <div className="truncate text-[11px] text-white/85">{t(lang, 'chat.subtitle')}</div>
        </div>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
          {LEVEL_NAMES[loadState().memory.level][lang] || ''}
        </span>
        {ttsSupported() && (
          <button
            onClick={toggleVoice}
            title={voiceOut ? t(lang, 'chat.voiceOn') : t(lang, 'chat.voiceOff')}
            className={`rounded-lg px-2 py-1 text-sm transition ${voiceOut ? 'bg-indigo-100 text-indigo-700' : ''} ${speaking ? 'animate-pulse bg-emerald-100 text-emerald-700' : ''}`}
          >
            {voiceOut ? '🔊' : '🔇'}
          </button>
        )}
        <button onClick={onClose} aria-label={t(lang, 'chat.close')} className="rounded-lg px-2 py-1 text-sm hover:bg-white/15">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex max-w-[88%] gap-2 ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            {m.role === 'bot' && (
              <img src={avatar} alt="Bodhya" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            )}
            <div className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-sm ${
              m.role === 'user'
                ? 'rounded-br-md bg-indigo-600 text-white'
                : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
            }`}>
              {renderText(m.text)}
              {m.role === 'bot' && m.quick?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.quick.map((q, j) => (
                    <button key={j} onClick={() => send(q)}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11.5px] font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <img src={avatar} alt="Bodhya" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative flex items-center gap-2 border-t border-slate-200 bg-white px-3.5 py-3">
        <button
          onClick={listening ? stopListening : startListening}
          title={t(lang, 'chat.mic')}
          className={`rounded-lg px-2 py-1.5 text-lg transition ${listening ? 'animate-pulse bg-rose-100 text-rose-600' : 'hover:bg-slate-100'}`}
        >
          {listening ? '⏹' : '🎤'}
        </button>
        {listening && (
          <span className="absolute left-14 top-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 animate-pulse">
            {t(lang, 'chat.listening')}
          </span>
        )}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder={t(lang, 'chat.placeholder')}
          className="flex-1 rounded-full border-[1.5px] border-slate-200 px-4 py-2 text-[13.5px] outline-none transition focus:border-indigo-500"
        />
        <button onClick={() => send()} aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700">
          ➤
        </button>
      </div>
    </div>
  )
}
