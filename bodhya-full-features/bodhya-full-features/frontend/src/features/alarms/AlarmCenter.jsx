// ============================================================
//  Alarm Centre — wake-ups, reminders and study-block alarms.
//  Big clock, one-tap templates, full editing, snooze rules,
//  next-ring countdown, missed-alarm history and a ring test.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  ALARMS, addAlarm, removeAlarm, toggleAlarm, updateAlarm, duplicateAlarm, ringNow,
  setAlarmSettings, clearAlarmLog, nextAlarm, upcomingAlarms, sortedAlarms,
} from './store.js'
import {
  ALARM_TEMPLATES, DAY_NAMES, describeRepeat, fmtTime, nextOccurrence, untilText, WEEKDAY_SET,
} from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { SOUNDS, playSound } from '../chatbot/utils/sound.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13.5px] text-slate-700 outline-none focus:border-indigo-500'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

function DayPicker({ days, onToggle, lang }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const active = days.includes(d)
        return (
          <button key={d} type="button" onClick={() => onToggle(d)}
            className={`h-9 w-9 rounded-full text-[12px] font-extrabold transition ${
              active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}>
            {DAY_NAMES[lang]?.[d]?.slice(0, 2) || DAY_NAMES.en[d].slice(0, 2)}
          </button>
        )
      })}
    </div>
  )
}

function AlarmCard({ alarm, lang, use24 }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(alarm)
  const next = useMemo(() => nextAlarmTime(alarm), [alarm])

  function save() {
    updateAlarm(alarm.id, {
      label: draft.label, time: draft.time, days: draft.days,
      sound: draft.sound, volume: draft.volume, snoozeMinutes: draft.snoozeMinutes, note: draft.note,
    })
    setEditing(false)
  }

  const repeat = describeRepeat(alarm.days, lang)

  return (
    <div className={`${card} ${alarm.enabled ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => toggleAlarm(alarm.id)}
          aria-label="toggle"
          className={`mt-1 h-6 w-11 shrink-0 rounded-full transition ${alarm.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <span className={`ml-0.5 mt-0.5 block h-5 w-5 rounded-full bg-white shadow transition ${alarm.enabled ? 'translate-x-5' : ''}`} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums text-slate-800">{fmtTime(alarm.time, use24)}</span>
            <span className="truncate text-[13.5px] font-bold text-slate-600">{alarm.label}</span>
            {alarm.linked && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                🔗 {alarm.linked.feature === 'todo' ? tr(lang, 'alarm.linkedTodo') : tr(lang, 'alarm.linkedFocus')}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
            <span>🔁 {repeat}</span>
            {alarm.enabled && next && <span>⏳ {tr(lang, 'alarm.ringsIn')} {untilText(next - Date.now(), lang)}</span>}
            <span>😴 {alarm.snoozeMinutes || 10}m</span>
            <span>{SOUNDS.find((s) => s.id === alarm.sound)?.emoji || '🔔'}</span>
            {alarm.fireCount > 0 && <span>· {alarm.fireCount}×</span>}
          </div>
          {alarm.note && <p className="mt-1 text-[12px] italic text-slate-400">{alarm.note}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <button onClick={() => ringNow(alarm.id)} className={`${btn} bg-amber-100 text-amber-800 hover:bg-amber-200`} title={tr(lang, 'common.test')}>▶</button>
          <button onClick={() => setEditing((v) => !v)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>✏️</button>
          <button onClick={() => duplicateAlarm(alarm.id)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>⧉</button>
          <button onClick={() => removeAlarm(alarm.id)} className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>🗑</button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex-1 min-w-[180px]">
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'alarm.label')}</span>
              <input className={`${inputCls} w-full`} value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'alarm.time')}</span>
              <input type="time" className={inputCls} value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'alarm.snooze')}</span>
              <select className={inputCls} value={draft.snoozeMinutes}
                onChange={(e) => setDraft({ ...draft, snoozeMinutes: Number(e.target.value) })}>
                {[3, 5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </label>
          </div>
          <div>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'alarm.repeat')}</span>
            <DayPicker lang={lang} days={draft.days}
              onToggle={(d) => setDraft({
                ...draft,
                days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort(),
              })} />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[
                { label: tr(lang, 'alarm.oneTime'), days: [] },
                { label: tr(lang, 'common.all'), days: [0, 1, 2, 3, 4, 5, 6] },
                { label: 'Mon–Fri', days: WEEKDAY_SET },
                { label: 'Sat–Sun', days: [0, 6] },
              ].map((preset) => (
                <button key={preset.label} type="button" onClick={() => setDraft({ ...draft, days: preset.days })}
                  className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-slate-600 border border-slate-200 hover:bg-slate-100">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] font-bold text-slate-500">{tr(lang, 'alarm.sound')}</span>
            {SOUNDS.map((s) => (
              <button key={s.id} type="button"
                onClick={() => { setDraft({ ...draft, sound: s.id }); playSound(s.id, draft.volume || 0.8) }}
                className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
                  draft.sound === s.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}>
                {s.emoji} {s.label[lang] || s.label.en}
              </button>
            ))}
          </div>
          <input className={`${inputCls} w-full`} placeholder={tr(lang, 'todo.notes')}
            value={draft.note || ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={save} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>{tr(lang, 'common.save')}</button>
            <button onClick={() => { setDraft(alarm); setEditing(false) }}
              className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>{tr(lang, 'common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** next ring for this alarm, as a timestamp (null when disabled/never) */
function nextAlarmTime(alarm) {
  if (!alarm.enabled) return null
  const next = nextOccurrence(alarm, new Date())
  return next ? next.getTime() : null
}

export default function AlarmCenter({ lang = null }) {
  const state = useStore(ALARMS)
  const L = lang || loadState().profile?.lang || 'en'
  const [tick, setTick] = useState(0)
  const [showLog, setShowLog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draft, setDraft] = useState({ time: '06:30', label: '', days: WEEKDAY_SET, sound: state.settings.defaultSound, volume: 0.8, snoozeMinutes: state.settings.defaultSnooze })
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const alarms = sortedAlarms()
  const next = nextAlarm(now)
  const upcoming = upcomingAlarms(now, 3)
  const use24 = state.settings.use24
  const onCount = alarms.filter((a) => a.enabled).length

  function quickAdd() {
    if (!draft.label.trim()) draft.label = tr(L, 'alarm.title')
    addAlarm(draft)
    setDraft({ ...draft, label: '', time: draft.time })
    setTick((t) => t + 1)
  }

  function applyTemplate(tpl) {
    addAlarm({
      label: tpl.label[L] || tpl.label.en,
      time: tpl.time,
      days: tpl.days,
      sound: state.settings.defaultSound,
      volume: state.settings.volume,
      linked: tpl.linked || null,
      note: tpl.emoji,
    })
    setTick((t) => t + 1)
  }

  const avatar = featureAvatar('alarms')

  return (
    <div className="mx-auto max-w-3xl" key={tick}>
      {/* header */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-4`}>
        {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-rose-100" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-slate-800">⏰ {tr(L, 'alarm.title')}</h2>
          <p className="text-[13px] text-slate-500">{tr(L, 'alarm.sub')}</p>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-black tabular-nums leading-none text-slate-800">
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: !use24 })}
          </div>
          <div className="text-[12px] font-bold text-slate-400">
            {onCount} {tr(L, 'alarm.count')}
            {next ? ` · ${tr(L, 'alarm.next')} ${fmtTime(next.alarm.time, use24)} (${untilText(next.at - now, L)})` : ''}
          </div>
        </div>
      </div>

      {/* quick add */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">➕ {tr(L, 'alarm.set')}</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(L, 'alarm.time')}</span>
            <input type="time" className={inputCls} value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
          </label>
          <label className="min-w-[170px] flex-1">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(L, 'alarm.label')}</span>
            <input className={`${inputCls} w-full`} placeholder={tr(L, 'alarm.labelPh')} value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          </label>
          <button onClick={quickAdd} className={`${btn} bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700`}>
            {tr(L, 'common.add')}
          </button>
        </div>
        <div className="mt-3">
          <DayPicker lang={L} days={draft.days}
            onToggle={(d) => setDraft({
              ...draft,
              days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort(),
            })} />
          <p className="mt-1 text-[11.5px] text-slate-400">
            {describeRepeat(draft.days, L)} · {tr(L, 'alarm.onlyOneTime')} → {tr(L, 'alarm.oneTime')}
          </p>
        </div>

        <h4 className="mb-1.5 mt-4 text-[12.5px] font-extrabold text-slate-700">⚡ {tr(L, 'alarm.templates')}</h4>
        <div className="flex flex-wrap gap-1.5">
          {ALARM_TEMPLATES.map((tpl) => (
            <button key={tpl.id} onClick={() => applyTemplate(tpl)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-amber-50">
              {tpl.emoji} {tpl.label[L] || tpl.label.en} · {fmtTime(tpl.time, use24)}
            </button>
          ))}
        </div>
      </div>

      {/* upcoming strip */}
      {upcoming.length > 0 && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">⏭ {tr(L, 'alarm.nextRings')}</h3>
          <ul className="space-y-1.5">
            {upcoming.map(({ alarm, at }) => (
              <li key={alarm.id} className="flex items-center gap-2 text-[13px]">
                <span className="w-20 shrink-0 font-extrabold tabular-nums text-slate-700">{fmtTime(alarm.time, use24)}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">{alarm.label}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                  {at.toLocaleDateString(undefined, { weekday: 'short' })} · {untilText(at - now, L)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* alarm list */}
      <div className="mb-4 space-y-3">
        {alarms.length === 0 && (
          <div className={`${card} text-center`}>
            <div className="mb-1 text-3xl">⏰</div>
            <p className="text-[14px] font-extrabold text-slate-700">{tr(L, 'alarm.noneUpcoming')}</p>
            <p className="mt-1 text-[12.5px] text-slate-400">
              {tr(L, 'common.tap')} {tr(L, 'alarm.templates')} — {tr(L, 'alarm.quickAdd')}
            </p>
          </div>
        )}
        {alarms.map((a) => <AlarmCard key={a.id} alarm={a} lang={L} use24={use24} />)}
      </div>

      {/* tools */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => alarms.forEach((a) => toggleAlarm(a.id, true))} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ✅ {tr(L, 'alarm.enableAll')}
        </button>
        <button onClick={() => alarms.forEach((a) => toggleAlarm(a.id, false))} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ⏸ {tr(L, 'alarm.disableAll')}
        </button>
        <button onClick={() => setShowSettings((v) => !v)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          ⚙️ {tr(L, 'alarm.settings')}
        </button>
        <button onClick={() => setShowLog((v) => !v)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          📜 {tr(L, 'alarm.log')} ({state.log.length})
        </button>
        <button onClick={() => openFeature('notifications')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          🔔 {tr(L, 'notif.title')}
        </button>
      </div>

      {showSettings && (
        <div className={`${card} mb-4 space-y-2`}>
          <h3 className="text-[13.5px] font-extrabold text-slate-800">⚙️ {tr(L, 'alarm.settings')}</h3>
          <label className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-semibold text-slate-600">🕐 {tr(L, 'alarm.use24')}</span>
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={use24}
              onChange={(e) => setAlarmSettings({ use24: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-semibold text-slate-600">😴 {tr(L, 'alarm.snooze')}</span>
            <select className={inputCls} value={state.settings.defaultSnooze}
              onChange={(e) => setAlarmSettings({ defaultSnooze: Number(e.target.value) })}>
              {[3, 5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-semibold text-slate-600">🔇 {tr(L, 'alarm.autoStop')}</span>
            <select className={inputCls} value={state.settings.autoStopMinutes}
              onChange={(e) => setAlarmSettings({ autoStopMinutes: Number(e.target.value) })}>
              {[1, 2, 3, 5, 10].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between py-1.5">
            <span className="text-[13px] font-semibold text-slate-600">📳 {tr(L, 'alarm.vibrate')}</span>
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={state.settings.vibrate}
              onChange={(e) => setAlarmSettings({ vibrate: e.target.checked })} />
          </label>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[12.5px] font-semibold text-slate-600">🔔 {tr(L, 'alarm.sound')}</span>
            {SOUNDS.map((s) => (
              <button key={s.id} onClick={() => { setAlarmSettings({ defaultSound: s.id }); playSound(s.id, state.settings.volume) }}
                className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
                  state.settings.defaultSound === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {s.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLog && (
        <div className={card}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13.5px] font-extrabold text-slate-800">📜 {tr(L, 'alarm.log')}</h3>
            {state.log.length > 0 && (
              <button onClick={clearAlarmLog} className="text-[12px] font-bold text-slate-400 hover:text-rose-600">
                {tr(L, 'notif.clearAll')}
              </button>
            )}
          </div>
          {state.log.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">{tr(L, 'alarm.logEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {state.log.slice(0, 20).map((entry) => {
                const icon = { rang: '🔔', snoozed: '😴', dismissed: '☀️', missed: '😴', 'auto-stopped': '🔇', 'woke-up': '☀️', 'task-done': '✅', 'opened-linked': '🔗' }[entry.action] || '•'
                return (
                  <li key={entry.id} className="flex items-center gap-2 text-[12.5px] text-slate-600">
                    <span>{icon}</span>
                    <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    <span className="shrink-0 text-[11.5px] text-slate-400">
                      {new Date(entry.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
