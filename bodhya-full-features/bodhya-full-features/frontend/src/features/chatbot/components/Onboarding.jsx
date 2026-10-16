// ---------- Bodhya onboarding wizard (Tailwind) — feature: chatbot ----------
import { useState } from 'react'
import { LANGS, AGE_GROUPS, TONES, t } from '../i18n/ui.js'
import { AVATARS } from '../data/avatars.js'
import { updateProfile } from '../brain/memory.js'

export default function Onboarding({ onDone, skip = false }) {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('en')
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('teen')
  const [tone, setTone] = useState('auto')
  const [avatar, setAvatar] = useState('banyan')

  if (skip) return null
  const L = lang
  const steps = 6

  function finish() {
    updateProfile({ name: name.trim(), ageGroup, tone, lang, avatar, onboarded: true })
    onDone()
  }

  const btnBase = 'rounded-xl px-5 py-2.5 text-sm font-bold transition'
  const primary = `${btnBase} bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700`
  const ghost = `${btnBase} border border-slate-200 text-slate-700 hover:bg-slate-50`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#151a3a]/70 p-5 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
        {/* progress dots */}
        <div className="mb-5 flex gap-2">
          {[...Array(steps)].map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center">
            <div className="mb-2 text-5xl">🌳</div>
            <h2 className="mb-2 text-xl font-extrabold text-slate-800">{t(L, 'onboarding.step1.title')}</h2>
            <p className="mb-5 text-sm text-slate-500">{t(L, 'onboarding.step1.text')}</p>
            <button className={primary} onClick={() => setStep(1)}>{t(L, 'onboarding.cta.next')} →</button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h2 className="mb-4 text-lg font-extrabold text-slate-800">{t(L, 'onboarding.langQ')}</h2>
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-5 py-3 text-sm font-bold transition ${
                    lang === l.code ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-400'}`}>
                  <span className="text-2xl">{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button className={ghost} onClick={() => setStep(0)}>{t(L, 'onboarding.cta.back')}</button>
              <button className={primary} onClick={() => setStep(2)}>{t(L, 'onboarding.cta.next')} →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="mb-4 text-lg font-extrabold text-slate-800">{t(L, 'onboarding.nameQ')}</h2>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder={t(L, 'onboarding.namePh')}
              onKeyDown={e => e.key === 'Enter' && setStep(3)}
              className="mb-6 w-full rounded-xl border-[1.5px] border-slate-200 px-4 py-3 text-[15px] outline-none transition focus:border-indigo-500" />
            <div className="flex justify-between">
              <button className={ghost} onClick={() => setStep(1)}>{t(L, 'onboarding.cta.back')}</button>
              <button className={primary} onClick={() => setStep(3)}>{t(L, 'onboarding.cta.next')} →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="mb-4 text-lg font-extrabold text-slate-800">{t(L, 'onboarding.ageQ')}</h2>
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {AGE_GROUPS.map(g => (
                <button key={g.id} onClick={() => setAgeGroup(g.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition ${
                    ageGroup === g.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-400'}`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-sm font-extrabold text-slate-800">{g.label[L] || g.label.en}</span>
                  <span className="text-[10.5px] text-slate-400">{g.range[L] || g.range.en}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button className={ghost} onClick={() => setStep(2)}>{t(L, 'onboarding.cta.back')}</button>
              <button className={primary} onClick={() => setStep(4)}>{t(L, 'onboarding.cta.next')} →</button>
            </div>
          </div>
        )}


        {step === 4 && (
          <div className="text-center">
            <h2 className="mb-1 text-lg font-extrabold text-slate-800">
              {L === "hi" ? "अपना मस्कट चुनें" : L === "te" ? "మీ మస్కట్ ఎంచుకోండి" : "Pick your mascot"}
            </h2>
            <p className="mb-4 text-[12.5px] text-slate-500">
              {L === "hi" ? "यही आपका Bodhya है — हर जगह!" : L === "te" ? "ఇదే మీ Bodhya — ప్రతిచోటా!" : "This is your Bodhya — everywhere!"}
            </p>
            <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 transition ${
                    avatar === a.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"}`}>
                  <img src={a.img} alt={a.label.en} className="h-12 w-12 rounded-full object-cover" />
                  <span className="text-[10.5px] font-bold text-slate-700">{a.label[L] || a.label.en}</span>
                  {avatar === a.id && <span className="rounded-full bg-emerald-500 px-1.5 text-[9px] font-extrabold text-white">✓</span>}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button className={ghost} onClick={() => setStep(3)}>{t(L, 'onboarding.cta.back')}</button>
              <button className={primary} onClick={() => setStep(5)}>{t(L, 'onboarding.cta.next')} →</button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="text-center">
            <h2 className="mb-4 text-lg font-extrabold text-slate-800">{t(L, 'onboarding.toneQ')}</h2>
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {Object.entries(TONES).map(([id, tn]) => (
                <button key={id} onClick={() => setTone(id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-[13px] font-bold transition ${
                    tone === id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-400'}`}>
                  <span className="text-lg">{tn.emoji}</span>{tn.label[L] || tn.label.en}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button className={ghost} onClick={() => setStep(4)}>{t(L, 'onboarding.cta.back')}</button>
              <button className={primary} onClick={finish}>{t(L, 'onboarding.cta.start')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
