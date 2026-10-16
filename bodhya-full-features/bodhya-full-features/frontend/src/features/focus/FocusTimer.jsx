// ============================================================
//  Focus Timer — Pomodoro-style study blocks. Big ring, rounds,
//  automatic breaks, +5 minutes when you are in flow, and every
//  finished block is logged (time tracker + study plan + XP).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  FOCUS, extendFocus, setFocusSettings, skipBreak, startFocus, stopFocus, togglePause,
} from './store.js'
import { PRESETS, formatClock, progressPct, randomBreakIdea, remainingMs } from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { SOUNDS, playSound } from '../chatbot/utils/sound.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { PLAN } from '../study-schedule/store.js'
import { nextSession } from '../study-schedule/logic.js'
import { formatMinutes, goalProgress } from '../time-tracking/store.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-500'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

function Ring({ pct, clock, phase, subject, paused, mode }) {
  const r = 86
  const c = 2 * Math.PI * r
  const color = mode === 'study' ? '#4f46e5' : '#10b981'
  return (
    <div className="relative mx-auto flex h-[216px] w-[216px] items-center justify-center">
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          style={{ transition: 'stroke-dashoffset 0.6s linear' }} />
      </svg>
      <div className="relative text-center">
        <div className={`text-[46px] font-black tabular-nums leading-none ${paused ? 'text-amber-600' : 'text-slate-800'}`}>
          {clock}
        </div>
        <div className="mt-1 text-[12px] font-extrabold uppercase tracking-wide text-slate-400">{phase}</div>
        {subject && <div className="mt-0.5 max-w-[150px] truncate text-[12.5px] font-bold text-indigo-600">{subject}</div>}
        {paused && <div className="mt-0.5 text-[11px] font-bold text-amber-600">⏸ {tr('en', 'focus.pause')}</div>}
      </div>
    </div>
  )
}

export default function FocusTimer({ lang: langProp = null, prefill = null }) {
  const state = useStore(FOCUS)
  useStore(PLAN)
  const lang = langProp || loadState().profile?.lang || 'en'
  const settings = state.settings

  const [now, setNow] = useState(Date.now())
  const [minutes, setMinutes] = useState(prefill?.minutes || settings.studyMinutes)
  const [subject, setSubject] = useState(prefill?.subject || settings.lastSubject || '')
  const [showSettings, setShowSettings] = useState(false)
  const [sessionId, setSessionId] = useState(prefill?.sessionId || null)
  const [idea, setIdea] = useState(() => randomBreakIdea(lang))

  // deep-link from the study plan / notifications / chat
  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.minutes) setMinutes(prefill.minutes)
    setSessionId(prefill.sessionId || null)
    if (prefill.autostart) {
      startFocus({ minutes: prefill.minutes || settings.studyMinutes, subject: prefill.subject, sessionId: prefill.sessionId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (state.active?.mode && state.active.mode !== 'study') setIdea(randomBreakIdea(lang))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.active?.id])

  const active = state.active
  const remaining = active ? remainingMs(active, now) : 0
  const pct = active ? progressPct(active, now) : 0
  const clock = active ? formatClock(remaining) : formatClock(minutes * 60000)
  const today = useMemo(
    () => state.log.filter((l) => new Date(l.at).toDateString() === new Date().toDateString()),
    [state.log]
  )
  const todayMinutes = today.reduce((a, l) => a + l.minutes, 0)
  const bars = useMemo(() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toDateString()
      out.push({
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        minutes: state.log.filter((l) => new Date(l.at).toDateString() === key).reduce((a, l) => a + l.minutes, 0),
      })
    }
    return out
  }, [state.log])
  const maxBar = Math.max(30, ...bars.map((b) => b.minutes))
  const goal = goalProgress()
  const nextPlan = nextSession(PLAN.read().sessions, new Date())
  const subjectOptions = useMemo(() => {
    const fromPlan = PLAN.read().subjects.map((s) => s.name)
    const fromLog = [...new Set(state.log.map((l) => l.subject))]
    return [...new Set([...fromPlan, ...fromLog])].filter(Boolean).slice(0, 12)
  }, [state.log])

  const cycle = active?.cycle || 1
  const cycles = settings.cycles || 4
  const avatar = featureAvatar('focus')

  function start() {
    startFocus({ minutes, subject: subject.trim(), sessionId, cycle: 1 })
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* header */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-4`}>
        {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-violet-100" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">⏳ {tr(lang, 'focus.title')}</h2>
          <p className="text-[13px] text-slate-500">{tr(lang, 'focus.sub')}</p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-black leading-none text-slate-800">{formatMinutes(todayMinutes)}</div>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'focus.today')}</div>
        </div>
      </div>

      {/* timer card */}
      <div className={`${card} mb-4`}>
        <Ring pct={pct} clock={clock} mode={active?.mode || 'study'} paused={!!active?.pausedAt}
          phase={active
            ? tr(lang, active.mode === 'study' ? 'focus.working' : 'focus.breakTime')
            : tr(lang, 'focus.preset')}
          subject={active?.subject || subject} />

        {/* rounds */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'focus.cycle', { n: cycle, total: cycles })}</span>
          <span className="flex gap-1">
            {Array.from({ length: cycles }).map((_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < cycle - 1 ? 'bg-emerald-500' : i === cycle - 1 && active ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </span>
        </div>

        {/* active controls */}
        {active ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={togglePause} className={`${btn} bg-amber-400 px-5 text-amber-950 hover:bg-amber-300`}>
              {active.pausedAt ? `▶ ${tr(lang, 'focus.resume')}` : `⏸ ${tr(lang, 'focus.pause')}`}
            </button>
            {active.mode === 'study' ? (
              <button onClick={() => extendFocus(5)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                ➕ {tr(lang, 'focus.add5')}
              </button>
            ) : (
              <button onClick={() => skipBreak()} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                ⏭ {tr(lang, 'focus.skipBreak')}
              </button>
            )}
            <button onClick={() => stopFocus()} className={`${btn} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
              ⏹ {tr(lang, 'focus.stop')}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESETS.map((p) => (
                <button key={p.minutes} onClick={() => setMinutes(p.minutes)}
                  className={`${btn} ${minutes === p.minutes ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p.emoji} {p.label[lang] || p.label.en} · {p.minutes}
                </button>
              ))}
              <input type="number" min="5" max="180" step="5" value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 25)}
                className={`${inputCls} w-20`} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input list="focus-subjects" className={`${inputCls} min-w-[180px]`} placeholder={tr(lang, 'focus.subjectPh')}
                value={subject} onChange={(e) => setSubject(e.target.value)} />
              <datalist id="focus-subjects">
                {subjectOptions.map((s) => <option key={s} value={s} />)}
              </datalist>
              <button onClick={start} className={`${btn} bg-indigo-600 px-6 py-2.5 text-white hover:bg-indigo-700`}>
                ▶ {tr(lang, 'focus.start')}
              </button>
            </div>
          </div>
        )}

        {/* break idea */}
        {active && active.mode !== 'study' && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-center">
            <div className="text-[11.5px] font-extrabold text-emerald-700">☕ {tr(lang, 'focus.breakIdea')}</div>
            <div className="text-[13px] text-emerald-900">{idea}</div>
            <button onClick={() => setIdea(randomBreakIdea(lang))} className="mt-1 text-[11.5px] font-bold text-emerald-700 underline">
              {tr(lang, 'common.more')} →
            </button>
          </div>
        )}

        {/* no active block → next plan session */}
        {!active && nextPlan && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 p-3">
            <span className="text-[12px] font-extrabold text-indigo-700">📅 {tr(lang, 'focus.fromPlan')}:</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-indigo-900">
              {nextPlan.startTime} · {nextPlan.subjectName} · {nextPlan.minutes} {tr(lang, 'plan.min')}
              {nextPlan.topic ? ` · ${nextPlan.topic}` : ''}
            </span>
            <button onClick={() => startFocus({ minutes: nextPlan.minutes, subject: nextPlan.subjectName, sessionId: nextPlan.id })}
              className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
              ▶ {tr(lang, 'focus.startPlan')}
            </button>
          </div>
        )}
      </div>

      {/* stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className={card}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'focus.today')}</div>
          <div className="text-[20px] font-black text-slate-800">{formatMinutes(todayMinutes)}</div>
          <div className="text-[11.5px] text-slate-400">{today.length} {tr(lang, 'focus.sessions')}</div>
        </div>
        <div className={card}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'time.goal')}</div>
          <div className="text-[20px] font-black text-slate-800">{goal.pct}%</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${goal.pct}%` }} />
          </div>
        </div>
        <div className={card}>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'focus.streak')}</div>
          <div className="text-[20px] font-black text-slate-800">🔥 {goal.today > 0 ? Math.max(1, bars.filter((b) => b.minutes > 0).length) : 0}</div>
          <div className="flex items-end gap-1 pt-1">
            {bars.map((b, i) => (
              <span key={i} title={`${b.minutes}m`} className="w-3 rounded-t bg-indigo-400"
                style={{ height: `${Math.max(3, (b.minutes / maxBar) * 26)}px` }} />
            ))}
          </div>
        </div>
      </div>

      {/* log + settings */}
      <div className={`${card} mb-4`}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13.5px] font-extrabold text-slate-800">📜 {tr(lang, 'focus.log')}</h3>
          <button onClick={() => setShowSettings((v) => !v)} className={`${btn} border border-slate-200 text-slate-500`}>
            ⚙️ {tr(lang, 'focus.settings')}
          </button>
        </div>
        {state.log.length === 0 ? (
          <p className="text-[12.5px] text-slate-400">{tr(lang, 'focus.logEmpty')}</p>
        ) : (
          <ul className="space-y-1.5">
            {state.log.slice(0, 10).map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-[12.5px]">
                <span>{l.completed ? '✅' : '⚪'}</span>
                <span className="min-w-0 flex-1 truncate text-slate-700">{l.subject}</span>
                <span className="shrink-0 font-bold text-slate-500">{l.minutes} {tr(lang, 'plan.min')}</span>
                {l.xp > 0 && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">+{l.xp} XP</span>}
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(l.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}

        {showSettings && (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'focus.preset')}</span>
                <input type="number" min="5" max="120" className={`${inputCls} w-20`} value={settings.studyMinutes}
                  onChange={(e) => setFocusSettings({ studyMinutes: Number(e.target.value) })} />
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'focus.nextBreak')}</span>
                <input type="number" min="1" max="30" className={`${inputCls} w-20`} value={settings.breakMinutes}
                  onChange={(e) => setFocusSettings({ breakMinutes: Number(e.target.value) })} />
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">🌙</span>
                <input type="number" min="5" max="60" className={`${inputCls} w-20`} value={settings.longBreakMinutes}
                  onChange={(e) => setFocusSettings({ longBreakMinutes: Number(e.target.value) })} />
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'focus.cycle', { n: '', total: '' })}</span>
                <input type="number" min="2" max="8" className={`${inputCls} w-20`} value={settings.cycles}
                  onChange={(e) => setFocusSettings({ cycles: Number(e.target.value) })} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={settings.autoBreak}
                onChange={(e) => setFocusSettings({ autoBreak: e.target.checked })} />
              ☕ {tr(lang, 'focus.autoBreak')}
            </label>
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={settings.autoStartNext}
                onChange={(e) => setFocusSettings({ autoStartNext: e.target.checked })} />
              ▶ {tr(lang, 'focus.autoStart')}
            </label>
            <label className="flex items-center gap-2 text-[12px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={settings.notifications}
                onChange={(e) => setFocusSettings({ notifications: e.target.checked })} />
              🔔 {tr(lang, 'focus.notify')}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {SOUNDS.map((s) => (
                <button key={s.id}
                  onClick={() => { setFocusSettings({ sound: s.id }); playSound(s.id, settings.volume) }}
                  className={`${btn} ${settings.sound === s.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                  {s.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11.5px] text-slate-400">💡 {tr(lang, 'focus.tipText')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => openFeature('planner')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          📅 {tr(lang, 'plan.title')}
        </button>
        <button onClick={() => openFeature('time')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ⏱️ {tr(lang, 'time.title')}
        </button>
        <button onClick={() => openFeature('todo')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ✅ {tr(lang, 'todo.title')}
        </button>
      </div>
    </div>
  )
}
