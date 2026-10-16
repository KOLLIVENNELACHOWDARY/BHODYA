// ============================================================
//  Study Plan — exam countdown, subjects with priorities and
//  difficulty, and a generated timetable that actually fits the
//  time you have. Sessions launch the focus timer, feed the
//  time tracker and award XP.
// ============================================================

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  PLAN, acceptDraft, addSession, addSessionAt, addSubject, applyTemplate, bookedMinutes, clearDay,
  clearPlan, copyDayToNext, discardDraft, duplicateSession, materialiseSeries, moveSession,
  moveSessionChecked, moveSeries, planAsText, planStats, previewPlan, pushToTomorrow, removeSeries,
  removeSession, removeSubject, setExam, setPlanSettings, setSessionRecurrence, startFocusForSession,
  toggleSession, updateSession, updateSubject,
} from './store.js'
import { createTasksFromPlan } from '../todo-list/store.js'
import { DIFFICULTY, PLAN_TEMPLATES, SESSION_TYPES, WEEKDAY_SHORT, dayKey, describeRecurrence, explainPlan, seriesSessions } from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature, emit, EVT } from '../chatbot/utils/events.js'
import { DAY_NAMES } from '../alarms/logic.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { icsFilename, icsStats, sessionsCalendar } from '../journal/ics.js'
import { formatMinutes } from '../time-tracking/store.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-500'
const btn = 'rounded-full px-3 py-1.5 text-[12px] font-bold transition'

function SessionRow({ s, subjects, lang, compact = false }) {
  const subject = subjects.find((x) => x.id === s.subjectId)
  const typeLabel = tr(lang, `plan.type.${s.type || 'study'}`)
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 ${s.done ? 'opacity-60' : ''}`}>
      <span className="w-14 shrink-0 text-[13px] font-black tabular-nums text-slate-700">{s.startTime}</span>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: subject?.color || '#6366f1' }} />
      <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${s.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
        {s.subjectName}
        {s.topic && <span className="font-normal text-slate-400"> · {s.topic}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
        {SESSION_TYPES[s.type]?.emoji || '📘'} {typeLabel} · {s.minutes} {tr(lang, 'plan.min')}
      </span>
      {s.source === 'spaced' && (
        <span className="shrink-0 rounded-full bg-fuchsia-50 px-2 py-0.5 text-[11px] font-bold text-fuchsia-600">
          🔁 {tr(lang, 'plan.fromSpaced')}
        </span>
      )}
      <span className="flex shrink-0 gap-1">
        {!s.done && (
          <button onClick={() => startFocusForSession(s.id)} title={tr(lang, 'plan.startThis')}
            className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>⏳</button>
        )}
        <button onClick={() => toggleSession(s.id)} title={tr(lang, 'plan.markDone')}
          className={`${btn} ${s.done ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          ✓
        </button>
        {!compact && (
          <button onClick={() => removeSession(s.id)} className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
            🗑
          </button>
        )}
      </span>
    </div>
  )
}

function SubjectCard({ subject, lang, now }) {
  const [open, setOpen] = useState(false)
  const sessions = PLAN.read().sessions.filter((s) => s.subjectId === subject.id)
  const planned = sessions.reduce((a, s) => a + s.minutes, 0)
  const done = sessions.filter((s) => s.done).reduce((a, s) => a + s.minutes, 0)
  const pct = planned ? Math.round((done / planned) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: subject.color }} />
        <input className={`${inputCls} min-w-[110px] flex-1 py-1.5`} value={subject.name}
          onChange={(e) => updateSubject(subject.id, { name: e.target.value })} />
        <span className="text-[11.5px] font-bold text-slate-400">
          {formatMinutes(planned)} · {pct}%
        </span>
        <button onClick={() => setOpen((v) => !v)} className={`${btn} border border-slate-200 text-slate-500`}>⚙️</button>
        <button onClick={() => removeSubject(subject.id)} className={`${btn} border border-slate-200 text-slate-400 hover:text-rose-600`}>🗑</button>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-slate-500">
        <label className="flex items-center gap-1">
          {tr(lang, 'plan.targetHours')}
          <input type="number" min="0.5" step="0.5" className={`${inputCls} w-16 py-1`} value={subject.targetHours}
            onChange={(e) => updateSubject(subject.id, { targetHours: Number(e.target.value) })} />
        </label>
        <label className="flex items-center gap-1">
          {tr(lang, 'plan.priority')}
          <select className={`${inputCls} py-1`} value={subject.priority}
            onChange={(e) => updateSubject(subject.id, { priority: Number(e.target.value) })}>
            <option value={1}>{tr(lang, 'plan.prioLow')}</option>
            <option value={2}>{tr(lang, 'plan.prioMed')}</option>
            <option value={3}>{tr(lang, 'plan.prioHigh')}</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          {tr(lang, 'plan.difficulty')}
          <select className={`${inputCls} py-1`} value={subject.difficulty}
            onChange={(e) => updateSubject(subject.id, { difficulty: Number(e.target.value) })}>
            {DIFFICULTY.map((d) => <option key={d.id} value={d.id}>{d.emoji} {tr(lang, d.id === 1 ? 'plan.diffEasy' : d.id === 2 ? 'plan.diffMed' : 'plan.diffHard')}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          🎨
          <input type="color" className="h-7 w-8 rounded border border-slate-300" value={subject.color}
            onChange={(e) => updateSubject(subject.id, { color: e.target.value })} />
        </label>
      </div>

      {open && (
        <div className="mt-2">
          <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.topics')}</span>
          <textarea className={`${inputCls} w-full`} rows={3} placeholder={tr(lang, 'plan.topicsPh')}
            defaultValue={(subject.topics || []).join('\n')}
            onBlur={(e) => updateSubject(subject.id, { topicsText: e.target.value })} />
          <p className="mt-1 text-[11.5px] text-slate-400">
            {dayKey(now)} · {sessions.filter((s) => !s.done).length} {tr(lang, 'plan.sessionsCount', { n: '' })}
          </p>
        </div>
      )}
    </div>
  )
}

/** Bodhya's proposed plan — shown before it replaces the week. */
function DraftCard({ draft, lang, onAccept, onDiscard, onRegenerate }) {
  if (!draft) return null
  const meta = draft.meta || {}
  const byDay = {}
  draft.sessions.forEach((sc) => { byDay[sc.day] = (byDay[sc.day] || 0) + sc.minutes })
  const days = Object.keys(byDay).sort()
  const totalMinutes = draft.sessions.reduce((a, sc) => a + sc.minutes, 0)
  return (
    <div className={`${card} mb-4 border-indigo-300 bg-gradient-to-br from-indigo-50/70 to-white ring-2 ring-indigo-100`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-lg">🗺️</span>
        <h3 className="text-[13.5px] font-extrabold text-slate-800">{tr(lang, 'plan.draftTitle')}</h3>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'plan.draftHint')}</span>
      </div>
      <p className="text-[12.5px] font-bold text-indigo-700">
        {tr(lang, 'plan.draftDays', {
          d: meta.days || days.length,
          s: draft.sessions.length,
          h: Math.round((totalMinutes / 60) * 10) / 10,
        })}
      </p>
      {meta.reason && meta.reason !== 'ok' && (
        <p className="mt-1 text-[12px] text-amber-700">{explainPlan(meta, lang)}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {days.map((d) => (
          <span key={d} className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-slate-500 ring-1 ring-slate-200">
            {new Date(d).toLocaleDateString(undefined, { weekday: 'short' })} · {byDay[d]}m
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button data-testid="plan-accept" onClick={onAccept} className={`${btn} bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700`}>
          ✅ {tr(lang, 'plan.accept')}
        </button>
        <button data-testid="plan-discard" onClick={onDiscard} className={`${btn} border border-slate-300 py-2.5 text-slate-600 hover:bg-white`}>
          ✕ {tr(lang, 'plan.discard')}
        </button>
        <button onClick={onRegenerate} className={`${btn} border border-slate-300 py-2.5 text-slate-600 hover:bg-white`}>
          🔄 {tr(lang, 'plan.regenerate')}
        </button>
      </div>
    </div>
  )
}

/** The week grid the *user* builds: tap an empty slot to add, tap a chip to edit. */
function WeekBuilder({ lang, subjects, sessions, week, now, onChanged }) {
  const [addSlot, setAddSlot] = useState(null)      // {day, time} — the "＋" popover
  const [editId, setEditId] = useState(null)        // session whose editor is open
  const [draft, setDraft] = useState({ subjectId: '', minutes: 30, topic: '' })
  const [flash, setFlash] = useState(null)
  const [dragId, setDragId] = useState(null)        // session being dragged
  const [dragOver, setDragOver] = useState(null)    // "day|time" under the pointer
  const [dragWholeSeries, setDragWholeSeries] = useState(false)
  const [recDays, setRecDays] = useState([])        // weekday picks in the repeat editor
  const [recUntil, setRecUntil] = useState('')

  if (!subjects.length) {
    return (
      <div className={`${card} mb-4`}>
        <h3 className="text-[13.5px] font-extrabold text-slate-800">🛠️ {tr(lang, 'plan.builderTitle')}</h3>
        <p className="mt-1 text-[12.5px] text-slate-400">{tr(lang, 'plan.emptySubjects')} — {tr(lang, 'plan.noPlanHint')}</p>
      </div>
    )
  }

  const SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00']
  const dragSession = dragId ? sessions.find((s) => s.id === dragId) || null : null
  const dragSeriesCount = dragSession ? seriesSessions(sessions, dragSession.seriesId || dragSession.id).filter((s) => !s.done).length : 0

  function say(msg) { setFlash(msg); setTimeout(() => setFlash(null), 2000) }

  function addAt(day, time) {
    const created = addSessionAt({
      day, startTime: time, subjectId: draft.subjectId || subjects[0]?.id,
      minutes: draft.minutes, topic: draft.topic || null,
      recurrence: recDays.length ? { days: recDays, until: recUntil || null } : null,
    })
    if (created) {
      say(recDays.length ? tr(lang, 'plan.repeatAdded') : tr(lang, 'plan.sessionAdded'))
      setAddSlot(null)
      setDraft({ subjectId: '', minutes: 30, topic: '' })
      setRecDays([])
      setRecUntil('')
      onChanged?.()
    }
  }

  function openEditor(s) {
    setEditId(s.id)
    setAddSlot(null)
    setDragId(null)
    setRecDays(s.recurrence?.days || [])
    setRecUntil(s.recurrence?.until || '')
  }

  /** Pointer released on a cell: this is the drop. */
  function dropOn(day, time) {
    if (!dragId) return
    const id = dragId
    setDragId(null)
    setDragOver(null)
    const result = dragWholeSeries && dragSeriesCount > 1
      ? moveSeries(id, { day, startTime: time })
      : moveSessionChecked(id, { day, startTime: time })
    if (result?.reason === 'same') return say(tr(lang, 'plan.dropSame'))
    if (result?.reason === 'done') return say(tr(lang, 'plan.dropDone'))
    if (!result?.ok && !result?.moved) return
    say(result.moved ? tr(lang, 'plan.seriesMoved', { n: result.moved }) : tr(lang, 'plan.moved'))
    onChanged?.()
  }

  function saveRepeat(s) {
    const rule = recDays.length ? { days: recDays, until: recUntil || null } : null
    const res = setSessionRecurrence(s.id, rule)
    if (!rule) say(tr(lang, 'plan.repeatCleared'))
    else say(res.created ? tr(lang, 'plan.repeatSet', { n: res.created }) : tr(lang, 'plan.repeatSetNone'))
    onChanged?.()
  }

  return (
    <div className={`${card} mb-4`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-extrabold text-slate-800">🛠️ {tr(lang, 'plan.builderTitle')}</h3>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'plan.builderHint')}</span>
        {flash && <span className="ml-auto text-[11.5px] font-bold text-emerald-600">✓ {flash}</span>}
      </div>
      <p className="mb-2 text-[11px] text-slate-400">ℹ️ {tr(lang, 'plan.manualNote')}</p>
      <p className="mb-2 text-[11px] text-indigo-500" data-testid="drag-hint">🖐️ {tr(lang, 'plan.dragHint')}</p>

      {/* while a chip is lifted: choose this-one or the whole repeat */}
      {dragSession && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-[11.5px] font-bold text-indigo-700">
          <span>🖐️ {dragSession.subjectName} · {dragSession.startTime}</span>
          {dragSeriesCount > 1 && (
            <label className="flex items-center gap-1">
              <input type="checkbox" data-testid="drag-series" checked={dragWholeSeries}
                onChange={(e) => setDragWholeSeries(e.target.checked)} />
              {tr(lang, 'plan.dragWholeSeries', { n: dragSeriesCount })}
            </label>
          )}
          <button onClick={() => { setDragId(null); setDragOver(null) }}
            className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10.5px] text-slate-500 ring-1 ring-slate-200">
            {tr(lang, 'plan.cancel')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[60px_repeat(7,1fr)] gap-1">
          {/* header */}
          <div />
          {week.map((d) => (
            <div key={`h-${d.key}`} className={`rounded-t-lg px-1 py-1 text-center text-[11px] font-extrabold ${
              d.isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {d.label} {d.date.getDate()}
              <div className="text-[9.5px] font-bold text-slate-400">{d.minutes}m</div>
            </div>
          ))}

          {SLOTS.map((time) => (
            <Fragment key={time}>
              <div className="flex items-center justify-end pr-1 text-[10.5px] font-bold text-slate-400">{time}</div>
              {week.map((d) => {
                const here = d.sessions.filter((sc) => sc.startTime === time)
                const isAdd = addSlot && addSlot.day === d.key && addSlot.time === time
                const over = dragOver === `${d.key}|${time}`
                return (
                  <div key={`${d.key}-${time}`}
                    data-drop={`${d.key}|${time}`}
                    data-testid={`drop-${d.key}-${time}`}
                    onPointerOver={() => { if (dragId) setDragOver(`${d.key}|${time}`) }}
                    onPointerUp={() => dropOn(d.key, time)}
                    className={`min-h-[42px] rounded-lg border p-0.5 ${
                      over ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300' : 'border-slate-100 bg-white'
                    }`}>
                    {here.map((sc) => {
                      const sub = subjects.find((x) => x.id === sc.subjectId)
                      const inSeries = Boolean(sc.seriesId || sc.recurrence)
                      if (editId === sc.id) {
                        return (
                          <div key={sc.id} className="rounded-lg bg-slate-50 p-1">
                            <select className="mb-1 w-full rounded border border-slate-300 px-1 py-0.5 text-[10px]"
                              value={sc.subjectId}
                              onChange={(e) => updateSession(sc.id, {
                                subjectId: e.target.value,
                                subjectName: subjects.find((x) => x.id === e.target.value)?.name || sc.subjectName,
                                source: 'manual',
                              })}>
                              {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                            </select>
                            <div className="flex gap-1">
                              <input type="number" min="5" step="5" defaultValue={sc.minutes}
                                onBlur={(e) => updateSession(sc.id, { minutes: Number(e.target.value) || sc.minutes, source: 'manual' })}
                                className="w-12 rounded border border-slate-300 px-1 py-0.5 text-[10px]" />
                              <button onClick={() => { setEditId(null); onChanged?.() }}
                                className="rounded bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                                {tr(lang, 'plan.saveSession')}
                              </button>
                            </div>

                            {/* repeat rule */}
                            <div className="mt-1 rounded bg-white p-1 ring-1 ring-slate-200">
                              <div className="mb-0.5 text-[9.5px] font-extrabold text-slate-500">🔁 {tr(lang, 'plan.repeat')}</div>
                              <div className="mb-1 flex flex-wrap gap-0.5">
                                {(WEEKDAY_SHORT[lang] || WEEKDAY_SHORT.en).map((name, idx) => (
                                  <button key={idx} data-testid={`rec-day-${idx}`}
                                    onClick={() => setRecDays((prev) => prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx].sort())}
                                    className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                                      recDays.includes(idx) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {name}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <input type="date" value={recUntil} onChange={(e) => setRecUntil(e.target.value)}
                                  className="w-[104px] rounded border border-slate-300 px-1 py-0.5 text-[9.5px]" />
                                <button data-testid={`rec-save-${sc.id}`} onClick={() => saveRepeat(sc)}
                                  className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                                  {tr(lang, 'plan.repeatSave')}
                                </button>
                              </div>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-1">
                              <button onClick={() => { moveSession(sc.id, { day: dayKeyPlus(d.key, 1) }); say(tr(lang, 'plan.movedNext')); onChanged?.() }}
                                className="rounded bg-white px-1 text-[9.5px] font-bold text-slate-500 ring-1 ring-slate-200">→|</button>
                              <button onClick={() => { duplicateSession(sc.id); say(tr(lang, 'plan.duplicated')); onChanged?.() }}
                                className="rounded bg-white px-1 text-[9.5px] font-bold text-slate-500 ring-1 ring-slate-200">⧉</button>
                              {inSeries && (
                                <button data-testid={`rec-stop-${sc.id}`} onClick={() => { removeSeries(sc.id); say(tr(lang, 'plan.seriesRemoved')); setEditId(null); onChanged?.() }}
                                  className="rounded bg-white px-1 text-[9.5px] font-bold text-amber-600 ring-1 ring-amber-200">🔁✕</button>
                              )}
                              <button onClick={() => { removeSession(sc.id); say(tr(lang, 'plan.sessionDeleted')); setEditId(null); onChanged?.() }}
                                className="rounded bg-white px-1 text-[9.5px] font-bold text-rose-500 ring-1 ring-rose-200">🗑</button>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <button key={sc.id}
                          data-testid={`chip-${sc.id}`}
                          data-session={sc.id}
                          onPointerDown={() => setDragId(sc.id)}
                          onClick={() => { if (!dragId) openEditor(sc) }}
                          onPointerUp={() => { if (dragId !== sc.id) dropOn(d.key, time) }}
                          title={`${sc.subjectName} · ${sc.minutes}m${sc.topic ? ` · ${sc.topic}` : ''}${
                            sc.recurrence ? ` · 🔁 ${describeRecurrence(sc.recurrence, lang)}` : ''}`}
                          className={`mb-0.5 block w-full touch-none truncate rounded px-1 py-0.5 text-left text-[9.5px] font-bold ${
                            sc.done ? 'bg-emerald-100 text-emerald-700 line-through' : 'text-white'
                          } ${dragId === sc.id ? 'cursor-grabbing ring-2 ring-indigo-400' : 'cursor-grab'}`}
                          style={sc.done ? undefined : { background: sub?.color || '#6366f1' }}>
                          {sc.subjectName.slice(0, 10)} {sc.minutes}′
                          {sc.source === 'manual' ? ' ✍️' : ''}
                          {sc.recurrence ? ' 🔁' : sc.seriesId ? ' 🔁' : ''}
                        </button>
                      )
                    })}

                    {isAdd ? (
                      <div className="rounded-lg bg-indigo-50 p-1">
                        <select className="mb-1 w-full rounded border border-slate-300 px-1 py-0.5 text-[10px]"
                          value={draft.subjectId || subjects[0]?.id}
                          onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}>
                          {subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                        <div className="flex gap-1">
                          <input type="number" min="5" step="5" value={draft.minutes}
                            onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) || 30 })}
                            className="w-12 rounded border border-slate-300 px-1 py-0.5 text-[10px]" />
                          <button data-testid={`slot-confirm-${d.key}-${time}`} onClick={() => addAt(d.key, time)}
                            className="rounded bg-indigo-600 px-1.5 text-[10px] font-bold text-white">✓</button>
                          <button onClick={() => setAddSlot(null)}
                            className="rounded bg-white px-1.5 text-[10px] font-bold text-slate-400 ring-1 ring-slate-200">✕</button>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {(WEEKDAY_SHORT[lang] || WEEKDAY_SHORT.en).map((name, idx) => (
                            <button key={idx} data-testid={`add-rec-${idx}`}
                              onClick={() => setRecDays((prev) => prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx].sort())}
                              className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                                recDays.includes(idx) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                              }`}>
                              {name}
                            </button>
                          ))}
                        </div>
                        {recDays.length > 0 && (
                          <input type="date" value={recUntil} onChange={(e) => setRecUntil(e.target.value)}
                            className="mt-1 w-full rounded border border-slate-300 px-1 py-0.5 text-[9.5px]" />
                        )}
                      </div>
                    ) : here.length === 0 && (
                      <button data-testid={`slot-${d.key}-${time}`} onClick={() => { setEditId(null); setAddSlot({ day: d.key, time }) }}
                        className="h-full w-full rounded text-[10px] font-bold text-slate-300 transition hover:bg-indigo-50 hover:text-indigo-500">
                        {tr(lang, 'plan.emptySlot')}
                      </button>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-400">
        <span>✍️ = {tr(lang, 'plan.fromMe')} · 🤖 = {tr(lang, 'plan.fromBodhya')} · 🔁 = {tr(lang, 'plan.repeats')}</span>
        {week.map((d) => (
          <span key={`tools-${d.key}`} className="flex items-center gap-1">
            <button onClick={() => { const n = copyDayToNext(d.key); say(tr(lang, 'plan.dayCopied', { n })); onChanged?.() }}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-[10.5px] font-bold text-slate-500 hover:bg-slate-50">
              ⧉ {d.label}
            </button>
            <button onClick={() => { clearDay(d.key); say(tr(lang, 'plan.clearDay')); onChanged?.() }}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-[10.5px] font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              🗑
            </button>
          </span>
        ))}
        <span className="ml-auto">
          {tr(lang, 'plan.freeMinutes', {
            n: Math.max(0, (PLAN.read().settings.dailyMinutes || 120) - bookedMinutes(week[0]?.key || now.toISOString().slice(0, 10), sessions)),
          })}
        </span>
      </div>
    </div>
  )
}

function dayKeyPlus(day, n) {
  const [y, m, d] = String(day).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export default function StudySchedule({ lang: langProp = null }) {
  const state = useStore(PLAN)
  const lang = langProp || loadState().profile?.lang || 'en'
  const now = new Date()
  const stats = planStats(now)
  const avatar = featureAvatar('studyplan')

  const [newSubject, setNewSubject] = useState({ name: '', priority: 2, difficulty: 2, targetHours: 5 })
  const [newSession, setNewSession] = useState({ subjectId: state.subjects[0]?.id || '', day: dayKey(now), startTime: '18:00', minutes: 30, topic: '' })
  const [copied, setCopied] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null)
  const [builderTick, setBuilderTick] = useState(0)
  const [icsMsg, setIcsMsg] = useState(null)
  const [showSubjects, setShowSubjects] = useState(true)

  const week = stats.week
  const countdown = stats.countdown

  // A repeat rule keeps filling the calendar as days go by. Running this on
  // mount is safe and idempotent: it only adds occurrences that are missing.
  useEffect(() => {
    if (state.sessions.some((s) => s.recurrence)) materialiseSeries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayList = useMemo(() => stats.today, [state.sessions])
  const progressPct = stats.pct

  /** Bodhya proposes; the user decides (see DraftCard). */
  function build() {
    previewPlan()
    setFlashMsg(null)
  }

  function acceptPlan() {
    const res = acceptDraft()
    materialiseSeries()
    setFlashMsg(tr(lang, 'plan.draftSaved', { n: res.applied }))
    setTimeout(() => setFlashMsg(null), 2600)
  }

  function discardPlan() {
    discardDraft()
    setFlashMsg(tr(lang, 'plan.draftDiscarded'))
    setTimeout(() => setFlashMsg(null), 2600)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-rose-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">📅 {tr(lang, 'plan.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'plan.sub')}</p>
          </div>
          {countdown && (
            <div className="text-right">
              <div className={`text-[26px] font-black leading-none ${countdown.days <= 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                {countdown.isToday ? '🎯' : countdown.days}
              </div>
              <div className="text-[11.5px] font-bold text-slate-400">
                {countdown.isToday ? tr(lang, 'plan.examToday') : tr(lang, 'plan.daysLeft', { n: countdown.days })}
              </div>
            </div>
          )}
        </div>

        {/* exam */}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[180px] flex-1">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.examName')}</span>
            <input className={`${inputCls} w-full`} placeholder={tr(lang, 'plan.examNamePh')} value={state.exam.name || ''}
              onChange={(e) => setExam({ name: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.examDate')}</span>
            <input type="date" className={inputCls} value={state.exam.date || ''}
              onChange={(e) => setExam({ date: e.target.value })} />
          </label>
          {state.exam.date && (
            <button onClick={() => setExam({ date: null })} className={`${btn} border border-slate-300 text-slate-500`}>
              {tr(lang, 'common.reset')}
            </button>
          )}
        </div>

        {/* plan progress */}
        {stats.totalSessions > 0 && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-slate-600">
              <span>🎯 {tr(lang, 'plan.progress')}</span>
              <span className="text-slate-400">
                {formatMinutes(stats.doneMinutes)} {tr(lang, 'plan.done')} / {formatMinutes(stats.totalMinutes)} {tr(lang, 'plan.planned')}
              </span>
              <span className="ml-auto">{progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Bodhya's draft (accept / discard / regenerate) */}
      <DraftCard draft={state.draft} lang={lang}
        onAccept={acceptPlan}
        onDiscard={discardPlan}
        onRegenerate={build} />

      {flashMsg && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] font-bold text-emerald-800">
          ✓ {flashMsg}
        </div>
      )}

      {/* templates */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">⚡ {tr(lang, 'plan.templates')}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLAN_TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => applyTemplate(t.id)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <div className="text-[13.5px] font-extrabold text-slate-800">{t.emoji} {t.title[lang] || t.title.en}</div>
              <div className="text-[12px] text-slate-500">{t.desc[lang] || t.desc.en}</div>
            </button>
          ))}
        </div>
      </div>

      {/* subjects */}
      <div className={`${card} mb-4`}>
        <button onClick={() => setShowSubjects((v) => !v)} className="mb-2 flex w-full items-center gap-2">
          <h3 className="text-[13.5px] font-extrabold text-slate-800">📚 {tr(lang, 'plan.subjects')}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{state.subjects.length}</span>
          <span className="ml-auto text-[11px] text-slate-400">{showSubjects ? '▾' : '▸'}</span>
        </button>

        {showSubjects && (
          <>
            {state.subjects.length === 0 && (
              <p className="mb-2 text-[12.5px] text-slate-400">{tr(lang, 'plan.emptySubjects')} — {tr(lang, 'plan.noPlanHint')}</p>
            )}
            <div className="space-y-2">
              {state.subjects.map((s) => <SubjectCard key={s.id} subject={s} lang={lang} now={now} />)}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
              <label className="min-w-[140px] flex-1">
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.addSubject')}</span>
                <input className={`${inputCls} w-full`} placeholder={tr(lang, 'plan.subjectNamePh')} value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newSubject.name.trim()) { addSubject(newSubject); setNewSubject({ ...newSubject, name: '' }) } }} />
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.targetHours')}</span>
                <input type="number" min="0.5" step="0.5" className={`${inputCls} w-20`} value={newSubject.targetHours}
                  onChange={(e) => setNewSubject({ ...newSubject, targetHours: Number(e.target.value) })} />
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.difficulty')}</span>
                <select className={inputCls} value={newSubject.difficulty}
                  onChange={(e) => setNewSubject({ ...newSubject, difficulty: Number(e.target.value) })}>
                  {DIFFICULTY.map((d) => <option key={d.id} value={d.id}>{d.emoji} {tr(lang, d.id === 1 ? 'plan.diffEasy' : d.id === 2 ? 'plan.diffMed' : 'plan.diffHard')}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.priority')}</span>
                <select className={inputCls} value={newSubject.priority}
                  onChange={(e) => setNewSubject({ ...newSubject, priority: Number(e.target.value) })}>
                  <option value={1}>{tr(lang, 'plan.prioLow')}</option>
                  <option value={2}>{tr(lang, 'plan.prioMed')}</option>
                  <option value={3}>{tr(lang, 'plan.prioHigh')}</option>
                </select>
              </label>
              <button
                onClick={() => { if (newSubject.name.trim()) { addSubject(newSubject); setNewSubject({ ...newSubject, name: '' }) } }}
                className={`${btn} bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700`}>
                {tr(lang, 'common.add')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* planner settings + generate */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🛠️ {tr(lang, 'plan.title')}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.dailyMinutes')}</span>
            <input type="number" min="15" step="15" className={`${inputCls} w-24`} value={state.settings.dailyMinutes}
              onChange={(e) => setPlanSettings({ dailyMinutes: Number(e.target.value) })} />
          </label>
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.startTime')}</span>
            <input type="time" className={inputCls} value={state.settings.startTime}
              onChange={(e) => setPlanSettings({ startTime: e.target.value })} />
          </label>
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.sessionLength')}</span>
            <select className={inputCls} value={state.settings.sessionMinutes}
              onChange={(e) => setPlanSettings({ sessionMinutes: Number(e.target.value) })}>
              {[20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{m} {tr(lang, 'plan.min')}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={state.settings.spacedRepetition}
              onChange={(e) => setPlanSettings({ spacedRepetition: e.target.checked })} />
            🔁 {tr(lang, 'plan.fromSpaced')}
          </label>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={state.settings.morningSessionAlarm}
              onChange={(e) => setPlanSettings({ morningSessionAlarm: e.target.checked })} />
            ⏰ {tr(lang, 'alarm.title')}
          </label>
        </div>

        <div className="mt-3">
          <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.studyDays')}</span>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const active = state.settings.studyDays.includes(d)
              return (
                <button key={d}
                  onClick={() => setPlanSettings({
                    studyDays: active
                      ? state.settings.studyDays.filter((x) => x !== d)
                      : [...state.settings.studyDays, d].sort(),
                  })}
                  className={`h-9 w-9 rounded-full text-[12px] font-extrabold transition ${
                    active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {DAY_NAMES[lang]?.[d]?.slice(0, 2) || DAY_NAMES.en[d].slice(0, 2)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button data-testid="plan-build" onClick={build} className={`${btn} bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700`}>
            ✨ {state.sessions.length ? tr(lang, 'plan.regenerate') : tr(lang, 'plan.generate')}
          </button>
          {state.sessions.length > 0 && (
            <>
              <button onClick={() => pushToTomorrow()} className={`${btn} border border-slate-300 py-2.5 text-slate-600 hover:bg-slate-50`}>
                →| {tr(lang, 'plan.pushTomorrow')}
              </button>
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(planAsText(lang)) } catch { /* clipboard blocked */ }
                  setCopied(true); setTimeout(() => setCopied(false), 1600)
                }}
                className={`${btn} border border-slate-300 py-2.5 text-slate-600 hover:bg-slate-50`}>
                📋 {copied ? tr(lang, 'plan.copied') : tr(lang, 'plan.copyPlan')}
              </button>
              <button
                onClick={() => {
                  const ics = sessionsCalendar(state.sessions, {
                    lang,
                    url: typeof window !== 'undefined' ? window.location.origin : '',
                  })
                  try {
                    const blob = new Blob([ics], { type: 'text/calendar' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = icsFilename('study-plan', dayKey())
                    a.click()
                    URL.revokeObjectURL(url)
                    const stats = icsStats(ics)
                    setIcsMsg(tr(lang, 'plan.icsDone', { n: stats.events }))
                    setTimeout(() => setIcsMsg(null), 3000)
                  } catch { /* download blocked */ }
                }}
                className={`${btn} border border-slate-300 py-2.5 text-slate-600 hover:bg-slate-50`}>
                📅 {tr(lang, 'plan.exportCalendar')}
              </button>
              <button onClick={() => clearPlan()} className={`${btn} border border-slate-300 py-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600`}>
                {tr(lang, 'plan.clearPlan')}
              </button>
            </>
          )}
        </div>

        {icsMsg && (
          <p className="mt-2 text-[12px] font-bold text-emerald-600">✓ {icsMsg} — {tr(lang, 'plan.icsHint')}</p>
        )}

        {state.lastMeta && (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <div className="text-[12px] font-extrabold text-indigo-700">🤔 {tr(lang, 'plan.whyPlan')}</div>
            <p className="mt-0.5 text-[12.5px] text-indigo-900/80">{explainPlan(state.lastMeta, lang)}</p>
            <p className="mt-1 text-[11.5px] font-bold text-indigo-500">
              {tr(lang, 'plan.coverage', { n: state.lastMeta.coverage })} · {formatMinutes(state.lastMeta.totalPlanned)}
            </p>
          </div>
        )}
      </div>

      {/* today's plan → to-do list */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-2`}>
        <span className="text-[12.5px] font-bold text-slate-600">✅ {tr(lang, 'plan.todayTasks')}</span>
        <button data-testid="plan-to-todo" onClick={() => {
          const added = createTasksFromPlan()
          setFlashMsg(added.length ? tr(lang, 'plan.tasksSent', { n: added.length }) : tr(lang, 'todo.fromPlanNone'))
          setTimeout(() => setFlashMsg(null), 2600)
        }} className={`${btn} bg-emerald-600 px-3.5 text-white hover:bg-emerald-700`}>
          ➕ {tr(lang, 'common.add')}
        </button>
        <span className="ml-auto flex gap-1.5 text-[10.5px] font-bold text-slate-400">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">🤖 {tr(lang, 'plan.bodhyaMade')}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">✍️ {tr(lang, 'plan.mine')}</span>
        </span>
      </div>

      {/* today */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🌤️ {tr(lang, 'plan.today')}</h3>
        {todayList.length === 0 ? (
          <div className="text-[12.5px] text-slate-400">
            {state.sessions.length ? tr(lang, 'plan.allDone') : tr(lang, 'plan.noPlanHint')}
          </div>
        ) : (
          <div className="space-y-2">
            {todayList.map((s) => <SessionRow key={s.id} s={s} subjects={state.subjects} lang={lang} />)}
          </div>
        )}

        {/* add session manually */}
        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
          <label>
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'plan.addSession')}</span>
            <select className={`${inputCls} max-w-[150px]`} value={newSession.subjectId}
              onChange={(e) => setNewSession({ ...newSession, subjectId: e.target.value })}>
              {state.subjects.length === 0 && <option value="">{tr(lang, 'plan.emptySubjects')}</option>}
              {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <input type="date" className={inputCls} value={newSession.day}
            onChange={(e) => setNewSession({ ...newSession, day: e.target.value })} />
          <input type="time" className={inputCls} value={newSession.startTime}
            onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })} />
          <input type="number" min="10" step="5" className={`${inputCls} w-20`} value={newSession.minutes}
            onChange={(e) => setNewSession({ ...newSession, minutes: Number(e.target.value) })} />
          <input className={`${inputCls} min-w-[120px]`} placeholder="Topic" value={newSession.topic}
            onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })} />
          <button
            onClick={() => {
              addSession({
                subjectId: newSession.subjectId || state.subjects[0]?.id,
                day: newSession.day, startTime: newSession.startTime,
                minutes: newSession.minutes, topic: newSession.topic || null,
              })
              setNewSession({ ...newSession, topic: '' })
            }}
            className={`${btn} bg-slate-800 px-4 py-2 text-white hover:bg-slate-900`}>
            {tr(lang, 'common.add')}
          </button>
        </div>
      </div>

      {/* manual builder: the plan *you* make */}
      <WeekBuilder key={builderTick} lang={lang} now={new Date()} subjects={state.subjects}
        sessions={state.sessions} week={stats.week} onChanged={() => setBuilderTick((t) => t + 1)} />

      {/* week */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🗓️ {tr(lang, 'plan.week')}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {week.map((d) => (
            <div key={d.key}
              className={`rounded-xl border p-2 ${d.isToday ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] font-extrabold text-slate-700">{d.label}</span>
                <span className="text-[10.5px] font-bold text-slate-400">{d.date.getDate()}</span>
              </div>
              <div className="mt-0.5 text-[10.5px] font-bold text-slate-400">
                {formatMinutes(d.doneMinutes)} / {formatMinutes(d.minutes)}
              </div>
              <div className="mt-1 space-y-1">
                {d.sessions.slice(0, 5).map((s) => {
                  const sub = state.subjects.find((x) => x.id === s.subjectId)
                  return (
                    <button key={s.id} onClick={() => toggleSession(s.id)}
                      title={`${s.startTime} ${s.subjectName} ${s.minutes}min`}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-bold ${
                        s.done ? 'bg-emerald-100 text-emerald-700 line-through' : 'text-white'
                      }`}
                      style={s.done ? undefined : { background: sub?.color || '#6366f1' }}>
                      {s.startTime.slice(0, 5)} {s.subjectName}
                    </button>
                  )
                })}
                {d.sessions.length > 5 && (
                  <div className="text-[10px] font-bold text-slate-400">+{d.sessions.length - 5}</div>
                )}
                {d.sessions.length === 0 && <div className="text-[10px] text-slate-300">—</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* per subject */}
      {stats.perSubject.length > 0 && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📊 {tr(lang, 'plan.perSubject')}</h3>
          <div className="space-y-2">
            {stats.perSubject.map((p) => (
              <div key={p.subject.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.subject.color }} />
                <span className="w-28 shrink-0 truncate text-[12.5px] font-bold text-slate-700">{p.subject.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.subject.color }} />
                </div>
                <span className="w-24 shrink-0 text-right text-[11.5px] font-bold text-slate-500">
                  {formatMinutes(p.done)} / {formatMinutes(p.planned)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mb-4 px-1 text-[11.5px] text-slate-400">{tr(lang, 'plan.chatHint')}</p>
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => openFeature('focus')} className={`${btn} bg-slate-800 px-4 py-2 text-white hover:bg-slate-900`}>
          ⏳ {tr(lang, 'focus.start')}
        </button>
        <button onClick={() => openFeature('todo')} className={`${btn} border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50`}>
          ✅ {tr(lang, 'todo.title')}
        </button>
        <button onClick={() => openFeature('time')} className={`${btn} border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50`}>
          ⏱️ {tr(lang, 'time.title')}
        </button>
      </div>
    </div>
  )
}
