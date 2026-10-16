// ============================================================
//  Time Tracking — where your minutes actually went. Fed by the
//  focus timer and the study plan, plus a manual log for offline
//  study. Shows today, the week, per subject and your streak.
// ============================================================

import { useState } from 'react'
import {
  TIME, formatMinutes, goalProgress, logMinutes, recentLogs, removeLog, setTimeSettings,
  studyStreak, subjectTotals, weekBars,
} from './store.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-500'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

export default function TimeTracking({ lang: langProp = null }) {
  const state = useStore(TIME)
  const lang = langProp || loadState().profile?.lang || 'en'
  const goal = goalProgress()
  const bars = weekBars(new Date(), 7)
  const perSubject = subjectTotals(30)
  const logs = recentLogs(10)
  const streak = studyStreak()
  const totalAll = state.logs.reduce((a, l) => a + l.minutes, 0)
  const maxBar = Math.max(30, ...bars.map((b) => b.minutes))
  const maxSubject = Math.max(30, ...perSubject.map((s) => s.minutes))
  const avatar = featureAvatar('time')

  const [manual, setManual] = useState({ subject: '', minutes: '', date: new Date().toISOString().slice(0, 10) })

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`${card} mb-4 flex flex-wrap items-center gap-4`}>
        {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-amber-100" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">⏱️ {tr(lang, 'time.title')}</h2>
          <p className="text-[13px] text-slate-500">{tr(lang, 'time.sub')}</p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-black leading-none text-slate-800">{formatMinutes(goal.today)}</div>
          <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'time.today')}</div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: tr(lang, 'time.goal'), value: `${goal.pct}%`, sub: `${formatMinutes(goal.today)} / ${formatMinutes(goal.goal)}` },
          { label: tr(lang, 'time.week'), value: formatMinutes(goal.week), sub: `${goal.weekPct}% of ${formatMinutes(goal.weekGoal)}` },
          { label: tr(lang, 'time.streak'), value: `🔥 ${streak}`, sub: tr(lang, 'todo.streak') },
          { label: tr(lang, 'time.total'), value: formatMinutes(totalAll), sub: `${state.logs.length} ${tr(lang, 'focus.sessions')}` },
        ].map((s) => (
          <div key={s.label} className={card}>
            <div className="text-[11.5px] font-bold text-slate-400">{s.label}</div>
            <div className="text-[19px] font-black text-slate-800">{s.value}</div>
            <div className="text-[11px] text-slate-400">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📊 {tr(lang, 'time.week')}</h3>
        {bars.every((b) => b.minutes === 0) ? (
          <p className="text-[12.5px] text-slate-400">{tr(lang, 'time.noData')}</p>
        ) : (
          <div className="flex h-32 items-end gap-2">
            {bars.map((b) => (
              <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10.5px] font-bold text-slate-400">{b.minutes || ''}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400"
                  style={{ height: `${Math.max(4, (b.minutes / maxBar) * 92)}px` }} />
                <span className="text-[10.5px] font-bold text-slate-500">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📚 {tr(lang, 'time.perSubject')}</h3>
          {perSubject.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">{tr(lang, 'time.noData')}</p>
          ) : (
            <div className="space-y-2">
              {perSubject.slice(0, 8).map((s) => (
                <div key={s.subject} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-[12px] font-bold text-slate-600">{s.subject}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(s.minutes / maxSubject) * 100}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-[11.5px] font-bold text-slate-500">{formatMinutes(s.minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">➕ {tr(lang, 'time.logManual')}</h3>
          <div className="flex flex-wrap items-end gap-2">
            <input className={`${inputCls} min-w-[120px] flex-1`} placeholder={tr(lang, 'time.subjectPh')}
              value={manual.subject} onChange={(e) => setManual({ ...manual, subject: e.target.value })} />
            <input type="number" min="5" step="5" className={`${inputCls} w-20`} placeholder={tr(lang, 'time.manualPh')}
              value={manual.minutes} onChange={(e) => setManual({ ...manual, minutes: e.target.value })} />
            <input type="date" className={inputCls} value={manual.date}
              onChange={(e) => setManual({ ...manual, date: e.target.value })} />
            <button
              onClick={() => {
                if (!Number(manual.minutes)) return
                logMinutes({
                  subject: manual.subject.trim() || 'Study',
                  minutes: Number(manual.minutes),
                  source: 'manual',
                  at: new Date(manual.date).getTime(),
                })
                setManual({ ...manual, subject: '', minutes: '' })
              }}
              className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
              {tr(lang, 'time.add')}
            </button>
          </div>
          <label className="mt-3 flex items-center justify-between text-[12.5px] font-semibold text-slate-600">
            🎯 {tr(lang, 'time.goal')}
            <input type="number" min="15" step="15" className={`${inputCls} w-24`} value={state.settings.dailyGoalMinutes}
              onChange={(e) => setTimeSettings({ dailyGoalMinutes: Number(e.target.value) })} />
          </label>
          <label className="mt-1 flex items-center justify-between text-[12.5px] font-semibold text-slate-600">
            📅 {tr(lang, 'time.week')}
            <input type="number" min="60" step="30" className={`${inputCls} w-24`} value={state.settings.weeklyGoalMinutes}
              onChange={(e) => setTimeSettings({ weeklyGoalMinutes: Number(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🕐 {tr(lang, 'time.recent')}</h3>
        {logs.length === 0 ? (
          <div className="text-[12.5px] text-slate-400">
            {tr(lang, 'time.noData')} —{' '}
            <button onClick={() => openFeature('focus')} className="font-bold text-indigo-600 underline">
              {tr(lang, 'focus.start')}
            </button>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-[12.5px]">
                <span className="min-w-0 flex-1 truncate text-slate-700">{l.subject}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                  {{ focus: '⏳', plan: '📅', manual: '✍️' }[l.source] || '•'} {tr(lang, `time.source.${l.source}`)}
                </span>
                <span className="shrink-0 font-bold text-slate-500">{formatMinutes(l.minutes)}</span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(l.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => removeLog(l.id)} className="shrink-0 text-[11px] text-slate-300 hover:text-rose-600">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => openFeature('focus')} className={`${btn} bg-slate-800 px-4 text-white hover:bg-slate-900`}>
          ⏳ {tr(lang, 'focus.start')}
        </button>
        <button onClick={() => openFeature('planner')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          📅 {tr(lang, 'plan.title')}
        </button>
      </div>
    </div>
  )
}
