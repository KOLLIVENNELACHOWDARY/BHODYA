// ============================================================
//  To-do List — the real thing: priorities, due dates & times,
//  repeats, subtasks, reminders (as linked alarms), search,
//  sorting, XP and one-tap bridges to the focus timer, the study
//  plan and Bodhya's chat.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  TODOS, addTodo, addSubtask, applyChapterTasks, applyPack, applySuggestion, applySuggestions,
  chapterTasksFrom, clearCompleted, createTasksFromPlan, quickAddFromText, removeSubtask, removeTodo,
  setTodoReminder, setTodoSettings, snoozeTodo, suggestionsFor, toggleSubtask, toggleTodo, todoStats,
  updateTodo,
} from './store.js'
import {
  DEFAULT_CATEGORIES, PRIORITIES, REPEATS, TASK_PACKS, dueLabel, dayKey, groupTodos, isOverdue,
  parseQuickTask, todoComparator, xpForTodo,
} from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { startFocus } from '../focus/store.js'
import { planAddQuick } from '../study-schedule/store.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-500'
const btn = 'rounded-full px-3 py-1.5 text-[12px] font-bold transition'
const PRIO_DOT = { high: '🔴', med: '🟡', low: '🟢' }

function ProgressRing({ pct, done, total, lang }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="38" cy="38" r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100} />
      </svg>
      <div className="text-center">
        <div className="text-[15px] font-black leading-none text-slate-800">{done}/{total}</div>
        <div className="text-[9.5px] font-bold text-slate-400">{tr(lang, 'todo.sectionToday')}</div>
      </div>
    </div>
  )
}

function SubTasks({ todo, lang }) {
  const [text, setText] = useState('')
  return (
    <div className="mt-2 rounded-xl bg-slate-50 p-2.5">
      <div className="mb-1.5 text-[11.5px] font-extrabold text-slate-500">🔹 {tr(lang, 'todo.subtasks')}</div>
      <ul className="space-y-1">
        {(todo.subtasks || []).map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <input type="checkbox" className="h-3.5 w-3.5 accent-emerald-600" checked={s.done}
              onChange={() => toggleSubtask(todo.id, s.id)} />
            <span className={`flex-1 text-[12.5px] ${s.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{s.title}</span>
            <button onClick={() => removeSubtask(todo.id, s.id)} className="text-[11px] text-slate-300 hover:text-rose-600">✕</button>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex gap-1.5">
        <input className={`${inputCls} flex-1 py-1.5`} placeholder={tr(lang, 'todo.subtaskPh')} value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { addSubtask(todo.id, text); setText('') } }} />
        <button onClick={() => { if (text.trim()) { addSubtask(todo.id, text); setText('') } }}
          className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>+</button>
      </div>
    </div>
  )
}

function EditBox({ todo, lang, onClose }) {
  const [d, setD] = useState({ ...todo })
  function save() {
    updateTodo(todo.id, {
      title: d.title, notes: d.notes, subject: d.subject, category: d.category,
      priority: d.priority, due: d.due || null, dueTime: d.dueTime || null,
      repeat: d.repeat, minutes: d.minutes ? Number(d.minutes) : null,
    })
    onClose()
  }
  return (
    <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3">
      <input className={`${inputCls} w-full`} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
      <div className="flex flex-wrap gap-2">
        <input className={inputCls} placeholder={tr(lang, 'todo.subjectPh')} value={d.subject || ''}
          onChange={(e) => setD({ ...d, subject: e.target.value })} />
        <select className={inputCls} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
          {DEFAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{tr(lang, `todo.cat.${c.id}`)}</option>)}
        </select>
        <select className={inputCls} value={d.priority} onChange={(e) => setD({ ...d, priority: e.target.value })}>
          {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{tr(lang, `todo.prio${p.id === 'med' ? 'Med' : p.id === 'high' ? 'High' : 'Low'}`)}</option>)}
        </select>
        <input type="date" className={inputCls} value={d.due || ''} onChange={(e) => setD({ ...d, due: e.target.value })} />
        <input type="time" className={inputCls} value={d.dueTime || ''} onChange={(e) => setD({ ...d, dueTime: e.target.value })} />
        <select className={inputCls} value={d.repeat} onChange={(e) => setD({ ...d, repeat: e.target.value })}>
          {REPEATS.map((r) => <option key={r.id} value={r.id}>{tr(lang, `todo.repeat${r.id === 'none' ? 'None' : r.id[0].toUpperCase() + r.id.slice(1)}`)}</option>)}
        </select>
        <input type="number" min="5" step="5" className={`${inputCls} w-24`} placeholder={tr(lang, 'plan.min')}
          value={d.minutes || ''} onChange={(e) => setD({ ...d, minutes: e.target.value })} />
      </div>
      <textarea className={`${inputCls} w-full`} rows={2} placeholder={tr(lang, 'todo.notes')} value={d.notes || ''}
        onChange={(e) => setD({ ...d, notes: e.target.value })} />
      <div className="flex gap-2">
        <button onClick={save} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>{tr(lang, 'common.save')}</button>
        <button onClick={onClose} className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>{tr(lang, 'common.cancel')}</button>
      </div>
    </div>
  )
}

const SOURCE_BADGE = {
  bodhya: { emoji: '🤖', key: 'todo.source.bodhya' },
  pack: { emoji: '📦', key: 'todo.source.pack' },
  plan: { emoji: '📅', key: 'todo.source.plan' },
  chat: { emoji: '💬', key: 'todo.source.bodhya' },
  user: { emoji: '✍️', key: 'todo.source.user' },
}

function SourceBadge({ source, lang }) {
  const badge = SOURCE_BADGE[source]
  if (!badge || source === 'user') return null
  return (
    <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-[10.5px] font-bold text-fuchsia-600">
      {badge.emoji} {tr(lang, badge.key)}
    </span>
  )
}

/** Bodhya proposes tasks from the real day — the user taps to accept. */
function SuggestionsCard({ lang, onAdded }) {
  const items = useMemo(() => suggestionsFor(lang), [lang, TODOS.read().items.length])
  const [flash, setFlash] = useState(null)

  function addOne(sug) {
    const res = applySuggestion(sug)
    setFlash(res?.duplicate ? tr(lang, 'todo.packNothing') : tr(lang, 'todo.added'))
    onAdded?.()
    setTimeout(() => setFlash(null), 1600)
  }

  function addAll() {
    const { added, skipped } = applySuggestions(items)
    setFlash(added.length
      ? tr(lang, 'todo.packAdded', { n: added.length })
      : tr(lang, 'todo.packNothing'))
    onAdded?.()
    setTimeout(() => setFlash(null), 2000)
    void skipped
  }

  return (
    <div className={`${card} mb-4 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/60 to-white`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-extrabold text-slate-800">✨ {tr(lang, 'todo.suggestions')}</h3>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'todo.suggestionsHint')}</span>
        {items.length > 1 && (
          <button data-testid="sugg-add-all" onClick={addAll} className={`${btn} ml-auto bg-fuchsia-600 px-3 text-white hover:bg-fuchsia-700`}>
            ➕ {tr(lang, 'todo.addAll')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[12.5px] text-slate-400">{tr(lang, 'todo.suggEmpty')}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((sug) => (
            <div key={sug.id} className="flex items-start gap-2 rounded-xl border border-fuchsia-100 bg-white p-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-bold text-slate-800">{sug.title}</div>
                <div className="text-[11px] text-slate-400">{sug.why}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10.5px] font-bold text-slate-500">
                  {sug.minutes ? <span className="rounded-full bg-slate-100 px-2 py-0.5">⏱ {sug.minutes}m</span> : null}
                  {sug.priority === 'high' ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">🔴</span> : null}
                  {sug.due ? <span className="rounded-full bg-slate-100 px-2 py-0.5">📅 {dueLabel({ due: sug.due }, lang)}</span> : null}
                </div>
              </div>
              <button data-testid={`sugg-add-${sug.id}`} onClick={() => addOne(sug)} title={tr(lang, 'common.add')}
                className="shrink-0 rounded-full bg-fuchsia-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-fuchsia-700">
                ＋
              </button>
            </div>
          ))}
        </div>
      )}
      {flash && <p className="mt-2 text-[12px] font-bold text-emerald-600">✓ {flash}</p>}
    </div>
  )
}

/** Ready-made packs: written by Bodhya, dropped in by the user. */
/** Paste a chapter → Bodhya cuts it into tasks you can tick off. */
function ChapterCard({ lang, onAdded }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [parsed, setParsed] = useState(null)
  const [picked, setPicked] = useState({})
  const [flash, setFlash] = useState(null)

  const chosen = (parsed?.tasks || []).filter((t) => picked[t.id])

  function look() {
    const res = chapterTasksFrom(text, { lang, subject })
    setParsed(res)
    setPicked(Object.fromEntries(res.tasks.map((t) => [t.id, true])))
    setSubject(res.subject)
    setFlash(res.tasks.length ? tr(lang, 'todo.ch.found', { n: res.tasks.length }) : tr(lang, 'todo.ch.nothing'))
    setTimeout(() => setFlash(null), 2600)
  }

  function addChosen() {
    const res = applyChapterTasks(chosen)
    setFlash(res.added.length ? tr(lang, 'todo.ch.added', { n: res.added.length }) : tr(lang, 'todo.packNothing'))
    onAdded?.()
    setParsed(null)
    setText('')
    setPicked({})
    setTimeout(() => setFlash(null), 2400)
  }

  return (
    <div className={`${card} mb-4 border-amber-200 bg-gradient-to-br from-amber-50/60 to-white`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-extrabold text-slate-800">📖 {tr(lang, 'todo.ch.title')}</h3>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'todo.ch.hint')}</span>
        <button data-testid="chapter-open" onClick={() => setOpen((v) => !v)}
          className={`${btn} ml-auto border border-amber-300 bg-white text-amber-700 hover:bg-amber-50`}>
          {open ? tr(lang, 'todo.ch.close') : `${tr(lang, 'todo.ch.open')} ▾`}
        </button>
      </div>

      {open && (
        <>
          <p className="mb-2 text-[11.5px] text-slate-400">{tr(lang, 'todo.ch.empty')}</p>
          <textarea data-testid="chapter-text" rows={5} value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tr(lang, 'todo.ch.placeholder')}
            className={`${inputCls} w-full font-mono text-[12px]`} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={tr(lang, 'todo.subjectPh')} className={`${inputCls} w-40`} />
            <button data-testid="chapter-scan" onClick={look} disabled={text.trim().length < 20}
              className={`${btn} bg-amber-500 px-4 text-white hover:bg-amber-600 disabled:opacity-40`}>
              🔍 {tr(lang, 'todo.ch.scan')}
            </button>
            <span className="text-[11px] text-slate-400">{tr(lang, 'todo.ch.chars', { n: text.trim().length })}</span>
            {text && (
              <button onClick={() => { setText(''); setParsed(null); setFlash(null) }}
                className={`${btn} text-slate-400 hover:bg-slate-100`}>
                {tr(lang, 'todo.ch.clear')}
              </button>
            )}
          </div>

          {parsed && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-white p-2.5">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                <span>🔍 {parsed.scan.lines} {tr(lang, 'todo.ch.lines')}</span>
                <span>📌 {parsed.scan.headings.length} {tr(lang, 'todo.ch.headingsFound')}</span>
                <span>🔤 {parsed.scan.terms.length} {tr(lang, 'todo.ch.termsFound')}</span>
                <span>✏️ {parsed.scan.exercises.length} {tr(lang, 'todo.ch.exFound')}</span>
                {parsed.subject ? <span className="ml-auto">📚 {parsed.subject}</span> : null}
              </div>

              {parsed.tasks.length === 0 ? (
                <p className="text-[12.5px] text-slate-400">{tr(lang, 'todo.ch.nothing')}</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {parsed.tasks.map((t) => (
                      <label key={t.id} data-testid={`chapter-item-${t.id}`}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-100 p-2 hover:bg-amber-50/60">
                        <input type="checkbox" checked={Boolean(picked[t.id])}
                          onChange={(e) => setPicked((prev) => ({ ...prev, [t.id]: e.target.checked }))}
                          className="mt-0.5" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-bold text-slate-800">{t.title}</span>
                          <span className="block text-[11px] text-slate-400">{t.why}</span>
                          <span className="mt-0.5 flex flex-wrap gap-1 text-[10.5px] font-bold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">⏱ {t.minutes}m</span>
                            {t.priority === 'high' ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">🔴</span> : null}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">{t.category}</span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button data-testid="chapter-add" onClick={addChosen} disabled={!chosen.length}
                    className={`${btn} mt-2 bg-emerald-600 px-4 text-white hover:bg-emerald-700 disabled:opacity-40`}>
                    ✅ {tr(lang, 'todo.ch.addAll', { n: chosen.length })}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {flash && <p className="mt-2 text-[12px] font-bold text-emerald-600">✓ {flash}</p>}
    </div>
  )
}

function PacksCard({ lang, onAdded }) {
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState(null)

  function add(packId) {
    const res = applyPack(packId)
    setFlash(res.added.length
      ? tr(lang, 'todo.packAdded', { n: res.added.length })
      : tr(lang, 'todo.packNothing'))
    onAdded?.()
    setTimeout(() => setFlash(null), 2000)
  }

  return (
    <div className={`${card} mb-4`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2">
        <h3 className="text-[13.5px] font-extrabold text-slate-800">📦 {tr(lang, 'todo.packs')}</h3>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'todo.packsHint')}</span>
        <span className="ml-auto text-[11px] text-slate-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TASK_PACKS.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[13px] font-extrabold text-slate-800">
                {pack.emoji} {tr(lang, pack.labelKey)}
              </div>
              <p className="mt-0.5 min-h-[32px] text-[11.5px] leading-snug text-slate-500">{tr(lang, pack.descKey)}</p>
              <div className="mt-1 text-[10.5px] font-bold text-slate-400">
                {pack.tasks.length} {tr(lang, 'todo.open')} · {pack.tasks.reduce((a, t) => a + t.minutes, 0)}m
              </div>
              <button data-testid={`pack-${pack.id}`} onClick={() => add(pack.id)}
                className="mt-2 w-full rounded-full bg-slate-800 py-1.5 text-[12px] font-bold text-white hover:bg-slate-900">
                {tr(lang, 'todo.applyPack')}
              </button>
            </div>
          ))}
        </div>
      )}
      {flash && <p className="mt-2 text-[12px] font-bold text-emerald-600">✓ {flash}</p>}
    </div>
  )
}

function TodoRow({ todo, lang, now, highlighted = false }) {
  const [open, setOpen] = useState(highlighted)
  const [edit, setEdit] = useState(false)
  const cat = DEFAULT_CATEGORIES.find((c) => c.id === todo.category)
  const doneSubs = (todo.subtasks || []).filter((s) => s.done).length

  return (
    <div data-todo-id={todo.id}
      className={`${card} p-3 transition ${todo.done ? 'opacity-70' : ''} ${
        highlighted ? 'border-amber-400 ring-2 ring-amber-300' : ''
      }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleTodo(todo.id)}
          aria-label={tr(lang, 'todo.markedDone')}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 text-[13px] transition ${
            todo.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500'
          }`}>
          {todo.done ? '✓' : ''}
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={() => setOpen((v) => !v)} className="block w-full text-left">
            <span className={`text-[14px] font-bold ${todo.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {PRIO_DOT[todo.priority]} {todo.title}
            </span>
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {cat && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{cat.emoji} {tr(lang, `todo.cat.${cat.id}`)}</span>}
            {todo.subject && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">{todo.subject}</span>}
            <span className={`rounded-full px-2 py-0.5 ${isOverdue(todo, now) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              📅 {dueLabel(todo, lang, now)}
            </span>
            {todo.repeat && todo.repeat !== 'none' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">🔁 {tr(lang, `todo.repeat${todo.repeat[0].toUpperCase() + todo.repeat.slice(1)}`)}</span>
            )}
            {todo.reminderAlarmId && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">🔔 {tr(lang, 'todo.reminderSet')}</span>}
            {todo.minutes && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">⏱ {todo.minutes} {tr(lang, 'plan.min')}</span>}
            {(todo.subtasks || []).length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">🔹 {doneSubs}/{(todo.subtasks || []).length}</span>
            )}
            <SourceBadge source={todo.source} lang={lang} />
          </div>

          {open && !edit && (
            <div className="mt-2 space-y-2">
              {todo.notes && <p className="whitespace-pre-line rounded-xl bg-slate-50 p-2.5 text-[12.5px] text-slate-600">{todo.notes}</p>}
              <SubTasks todo={todo} lang={lang} />
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setEdit(true)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                  {tr(lang, 'common.edit')}
                </button>
                <button
                  onClick={() => {
                    let due = todo.due; let dueTime = todo.dueTime
                    if (!due) { due = dayKey(); }
                    if (!dueTime) {
                      const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0)
                      dueTime = `${String(d.getHours()).padStart(2, '0')}:00`
                    }
                    updateTodo(todo.id, { due, dueTime })
                    setTodoReminder(todo.id, 15)
                  }}
                  className={`${btn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
                  🔔 {tr(lang, 'todo.remind')} (-15{tr(lang, 'plan.min')})
                </button>
                <button
                  onClick={() => { startFocus({ minutes: todo.minutes || 25, subject: todo.subject || todo.title }); openFeature('focus') }}
                  className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                  ⏳ {tr(lang, 'todo.startFocus')}
                </button>
                <button
                  onClick={() => { planAddQuick({ subjectName: todo.subject || todo.title, minutes: todo.minutes || 30 }); openFeature('planner') }}
                  className={`${btn} bg-sky-50 text-sky-700 hover:bg-sky-100`}>
                  📅 {tr(lang, 'todo.toPlan')}
                </button>
                <button onClick={() => snoozeTodo(todo.id, 1)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                  →| {tr(lang, 'todo.moveTomorrow')}
                </button>
                <button onClick={() => removeTodo(todo.id)} className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
                  🗑 {tr(lang, 'todo.delete')}
                </button>
              </div>
            </div>
          )}

          {edit && <EditBox todo={todo} lang={lang} onClose={() => setEdit(false)} />}
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
          +{xpForTodo(todo)} XP
        </span>
      </div>
    </div>
  )
}

function Section({ title, emoji, items, lang, now, accent, highlightId }) {
  const [show, setShow] = useState(true)
  if (!items.length) return null
  return (
    <section className="mb-4">
      <button onClick={() => setShow((v) => !v)} className="mb-1.5 flex w-full items-center gap-2 px-1">
        <h3 className={`text-[12.5px] font-extrabold uppercase tracking-wide ${accent || 'text-slate-500'}`}>
          {emoji} {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{items.length}</span>
        <span className="ml-auto text-[11px] text-slate-400">{show ? '▾' : '▸'}</span>
      </button>
      {show && (
        <div className="space-y-2">
          {items.map((t) => <TodoRow key={t.id} todo={t} lang={lang} now={now} highlighted={t.id === highlightId} />)}
        </div>
      )}
    </section>
  )
}

export default function TodoList({ lang: langProp = null, focusId = null }) {
  const state = useStore(TODOS)
  const lang = langProp || loadState().profile?.lang || 'en'
  const now = new Date()
  const stats = todoStats(now)

  const [form, setForm] = useState({
    title: '', subject: '', category: state.settings.defaultCategory || 'study',
    priority: 'med', due: dayKey(now), dueTime: '', repeat: 'none', minutes: '', notes: '',
  })
  const [showMore, setShowMore] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState(state.settings.sortBy || 'smart')
  const [showDone, setShowDone] = useState(state.settings.showCompleted !== false)
  const [flash, setFlash] = useState(null)
  const [highlightId, setHighlightId] = useState(focusId)
  const [lastParsed, setLastParsed] = useState(null)

  // deep link: "this task is due" (alarm / toast / notification) opens and marks it
  useEffect(() => {
    if (!focusId) return
    setHighlightId(focusId)
    const t = setTimeout(() => {
      try {
        document.querySelector(`[data-todo-id="${focusId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch { /* ignore */ }
    }, 120)
    return () => clearTimeout(t)
  }, [focusId])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.items.filter((t) => {
      if (!showDone && t.done) return false
      if (category !== 'all' && t.category !== category) return false
      if (q && !(`${t.title} ${t.notes || ''} ${t.subject || ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [state.items, query, category, showDone])

  const groups = useMemo(() => {
    const g = groupTodos(visible, now)
    Object.keys(g).forEach((k) => g[k].sort(todoComparator(sortBy)))
    return g
  }, [visible, sortBy])

  /** Quick add. If the line carries details ("physics 30 min tomorrow 6pm")
   *  they are parsed; otherwise the fields the user filled in win. */
  function submit() {
    const raw = form.title.trim()
    if (!raw) return
    const parsed = parseQuickTask(raw)
    if (parsed.matched && !form.minutes && !form.dueTime) {
      const res = quickAddFromText(raw)
      setLastParsed(res?.parsed || null)
      setForm({ ...form, title: '', subject: '', notes: '' })
      setFlash(tr(lang, 'todo.added'))
      setTimeout(() => { setFlash(null); setLastParsed(null) }, 2600)
      return
    }
    addTodo({
      ...form,
      title: parsed.matched ? parsed.title : raw,
      minutes: form.minutes ? Number(form.minutes) : (parsed.minutes || null),
      due: form.due || parsed.due || null,
      dueTime: form.dueTime || parsed.dueTime || null,
      source: 'ui',
    })
    setForm({ ...form, title: '', subject: '', notes: '', minutes: '', dueTime: '' })
    setFlash(tr(lang, 'todo.added'))
    setTimeout(() => setFlash(null), 1600)
  }

  const avatar = featureAvatar('todo')

  return (
    <div className="mx-auto max-w-3xl">
      {/* header + stats */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-teal-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">✅ {tr(lang, 'todo.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'todo.sub')}</p>
          </div>
          <ProgressRing pct={stats.pct} done={stats.done} total={stats.total} lang={lang} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { emoji: '📌', label: tr(lang, 'todo.open'), value: stats.open },
            { emoji: '⚠️', label: tr(lang, 'todo.overdue'), value: stats.overdue },
            { emoji: '🔥', label: tr(lang, 'todo.streak'), value: stats.streak },
            { emoji: '⭐', label: tr(lang, 'todo.xp'), value: stats.xpToday },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-[15px] font-black text-slate-800">{s.emoji} {s.value}</div>
              <div className="text-[11px] font-bold text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bodhya's suggestions (system-created tasks, user-approved) */}
      <SuggestionsCard lang={lang} onAdded={() => setFlash(tr(lang, 'todo.added'))} />

      {/* ready-made packs */}
      <PacksCard lang={lang} onAdded={() => setFlash(tr(lang, 'todo.added'))} />
      <ChapterCard lang={lang} onAdded={() => setFlash(tr(lang, 'todo.added'))} />

      {/* quick add */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">➕ {tr(lang, 'todo.quickAdd')}</h3>
        <div className="flex flex-wrap gap-2">
          <input className={`${inputCls} min-w-[200px] flex-1`} placeholder={tr(lang, 'todo.smartAdd')}
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
          <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{PRIO_DOT[p.id]} {tr(lang, `todo.prio${p.id === 'med' ? 'Med' : p.id === 'high' ? 'High' : 'Low'}`)}</option>
            ))}
          </select>
          <input type="date" className={inputCls} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          <button data-testid="todo-quick-add" onClick={submit} className={`${btn} bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700`}>
            {tr(lang, 'common.add')}
          </button>
          <button onClick={() => setShowMore((v) => !v)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
            {showMore ? tr(lang, 'common.less') : tr(lang, 'common.more')}
          </button>
        </div>
        {showMore && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input className={inputCls} placeholder={tr(lang, 'todo.subjectPh')} value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {DEFAULT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {tr(lang, `todo.cat.${c.id}`)}</option>)}
            </select>
            <input type="time" className={inputCls} value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} />
            <select className={inputCls} value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>
              {REPEATS.map((r) => (
                <option key={r.id} value={r.id}>
                  {tr(lang, `todo.repeat${r.id === 'none' ? 'None' : r.id[0].toUpperCase() + r.id.slice(1)}`)}
                </option>
              ))}
            </select>
            <input type="number" min="5" step="5" className={`${inputCls} w-28`} placeholder={tr(lang, 'todo.estMinutes')}
              value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
            <input className={`${inputCls} min-w-[180px] flex-1`} placeholder={tr(lang, 'todo.notes')} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        )}
        {flash && (
          <div className="mt-2 text-[12.5px] font-bold text-emerald-600">
            ✓ {flash}
            {lastParsed?.matched && (
              <span className="ml-2 flex flex-wrap gap-1 text-[11px] font-bold text-slate-500">
                <span>{tr(lang, 'todo.parsed')}</span>
                {lastParsed.minutes ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{tr(lang, 'todo.parsedMin', { n: lastParsed.minutes })}</span> : null}
                {lastParsed.due ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{tr(lang, 'todo.parsedDay', { day: lastParsed.due })}</span> : null}
                {lastParsed.dueTime ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{tr(lang, 'todo.parsedTime', { time: lastParsed.dueTime })}</span> : null}
                {lastParsed.priority ? <span className="rounded-full bg-slate-100 px-2 py-0.5">{tr(lang, 'todo.parsedPriority', { p: lastParsed.priority })}</span> : null}
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-[11.5px] text-slate-400">{tr(lang, 'todo.chatHint')}</p>
      </div>

      {/* today's plan → to-dos */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-2`}>
        <span className="text-[12.5px] font-bold text-slate-600">📅 {tr(lang, 'todo.fromPlan')}</span>
        <button
          data-testid="plan-to-todo"
          onClick={() => {
            const added = createTasksFromPlan()
            setFlash(added.length
              ? tr(lang, 'todo.fromPlanAdded', { n: added.length })
              : tr(lang, 'todo.fromPlanNone'))
            setTimeout(() => setFlash(null), 2400)
          }}
          className={`${btn} bg-sky-600 px-3.5 text-white hover:bg-sky-700`}>
          ➕ {tr(lang, 'common.add')}
        </button>
        <span className="text-[11.5px] text-slate-400">{tr(lang, 'todo.fromPlanNote')}</span>
      </div>

      {/* filters */}
      <div className={`${card} mb-4 flex flex-wrap items-center gap-2`}>
        <input className={`${inputCls} min-w-[160px] flex-1`} placeholder={tr(lang, 'todo.searchPh')}
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCategory('all')}
            className={`${btn} ${category === 'all' ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600'}`}>
            {tr(lang, 'common.all')}
          </button>
          {DEFAULT_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`${btn} ${category === c.id ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600'}`}>
              {c.emoji}
            </button>
          ))}
        </div>
        <select className={inputCls} value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setTodoSettings({ sortBy: e.target.value }) }}>
          <option value="smart">{tr(lang, 'todo.sort')}: {tr(lang, 'todo.sortSmart')}</option>
          <option value="due">{tr(lang, 'todo.sortDue')}</option>
          <option value="priority">{tr(lang, 'todo.sortPriority')}</option>
          <option value="created">{tr(lang, 'todo.sortCreated')}</option>
        </select>
        <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={showDone}
            onChange={(e) => { setShowDone(e.target.checked); setTodoSettings({ showCompleted: e.target.checked }) }} />
          {tr(lang, 'todo.showDone')}
        </label>
      </div>

      {/* list */}
      {groups.overdue.length + groups.today.length + groups.tomorrow.length + groups.upcoming.length + groups.someday.length === 0 && (
        <div className={`${card} text-center`}>
          <div className="mb-1 text-3xl">🌱</div>
          <p className="text-[14px] font-extrabold text-slate-700">{tr(lang, 'todo.empty')}</p>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-400">{tr(lang, 'todo.emptyHint')}</p>
        </div>
      )}

      <Section title={tr(lang, 'todo.sectionOverdue')} emoji="⚠️" accent="text-rose-500"
        items={groups.overdue} lang={lang} now={now} />
      <Section title={tr(lang, 'todo.sectionToday')} emoji="🌤️" accent="text-emerald-600"
        items={groups.today} lang={lang} now={now} />
      <Section title={tr(lang, 'todo.sectionTomorrow')} emoji="🌅" items={groups.tomorrow} lang={lang} now={now} />
      <Section title={tr(lang, 'todo.sectionUpcoming')} emoji="📆" items={groups.upcoming} lang={lang} now={now} />
      <Section title={tr(lang, 'todo.sectionSomeday')} emoji="💭" items={groups.someday} lang={lang} now={now} />
      {showDone && (
        <section className="mb-4">
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <h3 className="text-[12.5px] font-extrabold uppercase tracking-wide text-slate-400">
              ✅ {tr(lang, 'todo.sectionCompleted')}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{groups.completed.length}</span>
            {groups.completed.length > 0 && (
              <button onClick={() => clearCompleted()}
                className="ml-auto text-[11.5px] font-bold text-slate-400 hover:text-rose-600">
                {tr(lang, 'todo.clearCompleted')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {groups.completed.slice(0, 20).map((t) => <TodoRow key={t.id} todo={t} lang={lang} now={now} />)}
          </div>
        </section>
      )}
    </div>
  )
}
