// ============================================================
//  AlarmRing — the full-screen "it's time!" screen. Shows on top
//  of everything while an alarm is ringing, and stays until the
//  user snoozes or gets up. Auto-stops after the configured
//  minutes (Bodhya promises never to ring forever).
// ============================================================

import { useEffect, useState } from 'react'
import { ALARMS, snoozeAlarm, dismissAlarm } from '../alarms/store.js'
import { fmtTime } from '../alarms/logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { stopAlarmLoop } from '../chatbot/utils/sound.js'
import { startFocus } from '../focus/store.js'
import { toggleTodo } from '../todo-list/store.js'
import { loadState } from '../chatbot/brain/memory.js'
import { avatarImg } from '../chatbot/data/avatars.js'
import { tr } from '../chatbot/i18n/features.js'

function clockNow() {
  return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export default function AlarmRing() {
  const ringing = useStore(ALARMS, (s) => s.ringing)
  const state = useStore(ALARMS, (s) => s)
  const [now, setNow] = useState(() => clockNow())
  const [custom, setCustom] = useState(false)
  const lang = loadState().profile?.lang || 'en'
  const avatar = avatarImg(loadState().profile?.avatar || 'banyan')

  useEffect(() => {
    if (!ringing) return
    const iv = setInterval(() => setNow(clockNow()), 1000)
    return () => clearInterval(iv)
  }, [ringing])

  useEffect(() => () => { if (!ALARMS.read().ringing) stopAlarmLoop() }, [])

  if (!ringing) return null
  const alarm = state.alarms.find((a) => a.id === ringing.alarmId)
  if (!alarm) return null

  const autoStopAt = ringing.startedAt + (state.settings.autoStopMinutes || 5) * 60000
  const left = Math.max(0, Math.round((autoStopAt - Date.now()) / 1000))
  const snoozeOptions = [5, 10, 15, alarm.snoozeMinutes || state.settings.defaultSnooze || 10]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
  const linked = alarm.linked

  function snooze(mins) {
    snoozeAlarm(alarm.id, mins)
  }

  function imUp() {
    dismissAlarm(alarm.id, { reason: 'woke-up' })
    openFeature('home')
  }

  function openLinked() {
    dismissAlarm(alarm.id, { reason: 'opened-linked' })
    if (linked?.feature === 'focus') {
      startFocus({ minutes: 25, subject: linked.subject || alarm.label })
      openFeature('focus')
    } else if (linked?.feature === 'todo' && linked.id) {
      openFeature('todo', { focus: linked.id })
    } else {
      openFeature(linked?.feature || 'alarms')
    }
  }

  function markDone() {
    if (linked?.feature === 'todo' && linked.id) toggleTodo(linked.id)
    dismissAlarm(alarm.id, { reason: 'task-done' })
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-gradient-to-br from-rose-500/95 via-amber-400/95 to-indigo-500/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-7 text-center shadow-2xl">
        <div className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-300/60" />
          <span className="absolute inset-2 animate-pulse rounded-full bg-rose-200" />
          <span className="relative text-5xl">⏰</span>
        </div>

        <div className="text-[13px] font-bold uppercase tracking-wide text-rose-500">
          {tr(lang, 'alarm.ringingNow')}
        </div>
        <div className="my-1 text-5xl font-black tabular-nums text-slate-800">{now}</div>
        <h2 className="text-xl font-extrabold text-slate-800">{alarm.label}</h2>
        {alarm.note && <p className="mt-1 text-[13px] text-slate-500">{alarm.note}</p>}
        {linked && (
          <p className="mt-1 text-[12.5px] font-semibold text-indigo-600">
            🔗 {linked.feature === 'todo' ? tr(lang, 'alarm.linkedTodo') : tr(lang, 'alarm.linkedFocus')}
          </p>
        )}

        <div className="my-5 flex flex-col gap-2">
          <button onClick={imUp}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-[15px] font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700">
            ☀️ {tr(lang, 'alarm.imUp')}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12.5px] font-bold text-slate-500">😴 {tr(lang, 'notif.snoozeFor')}</span>
            {snoozeOptions.map((m) => (
              <button key={m} onClick={() => snooze(m)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-[12.5px] font-bold text-slate-700 transition hover:bg-slate-100">
                {m}m
              </button>
            ))}
            <button onClick={() => setCustom((v) => !v)}
              className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[12.5px] font-bold text-slate-500 hover:bg-slate-50">
              {tr(lang, 'focus.custom')}
            </button>
          </div>
          {custom && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {[1, 2, 3, 20, 30, 45].map((m) => (
                <button key={m} onClick={() => snooze(m)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-200">
                  {m}m
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {linked && (
              <button onClick={openLinked}
                className="rounded-full bg-indigo-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-indigo-700">
                {linked.feature === 'todo' ? `📌 ${tr(lang, 'notif.open')}` : `⏳ ${tr(lang, 'focus.start')}`}
              </button>
            )}
            {linked?.feature === 'todo' && (
              <button onClick={markDone}
                className="rounded-full bg-emerald-50 px-3.5 py-2 text-[12.5px] font-bold text-emerald-700 hover:bg-emerald-100">
                ✓ {tr(lang, 'notif.doneBtn')}
              </button>
            )}
            <button onClick={() => dismissAlarm(alarm.id, { reason: 'dismissed' })}
              className="rounded-full border border-slate-300 px-3.5 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100">
              🔇 {tr(lang, 'alarm.dismiss')}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11.5px] text-slate-400">
          <img src={avatar} alt="Bodhya" className="h-6 w-6 rounded-full object-cover" />
          {tr(lang, 'alarm.autoStop')} {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} ·
          {' '}{fmtTime(alarm.time, false)}
        </div>
      </div>
    </div>
  )
}
