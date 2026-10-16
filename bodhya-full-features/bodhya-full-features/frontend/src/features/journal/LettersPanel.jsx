// ============================================================
//  💌 Letters to your future self
//
//  Write it now, seal it, and Bodhya hands it back on the date you
//  choose — a month, three months, a year. While it is sealed you can
//  see the countdown but not the words; that is the whole point.
//  When it opens you can reply, which becomes a normal journal entry.
// ============================================================
import { useState } from 'react'
import { deleteLetter, lettersState, openLetter, replyToLetter, writeLetter } from './store.js'
import {
  LETTER_PROMPTS, MOODS, UNLOCK_PRESETS, dayKey, letterCountdown, letterToText, moodBy,
} from './logic.js'
import { openFeature } from '../chatbot/utils/events.js'
import { icsFilename, icsStats, lettersCalendar } from './ics.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-rose-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`
const inputCls = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-rose-500'

function SealedCard({ letter, lang, now, onCalendar }) {
  const countdown = letterCountdown(letter, now, lang)
  return (
    <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/40 p-4 text-center">
      <div className="text-3xl">💌</div>
      <div className="mt-1 text-[13px] font-extrabold text-rose-800">{tr(lang, 'journal.letterSealed')}</div>
      <div className="text-[12px] font-bold text-rose-600">{countdown}</div>
      <div className="mt-1 text-[11.5px] text-rose-400">
        🔒 {new Date(letter.unlockAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
        {' · '}{letter.words} {tr(lang, 'journal.words')}
      </div>
      {letter.promise && <div className="mt-1 text-[11.5px] text-rose-500">🤝 {letter.promise}</div>}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        <button onClick={() => onCalendar?.(letter)}
          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
          📅 {tr(lang, 'journal.addToCalendar')}
        </button>
        <button onClick={() => deleteLetter(letter.id)}
          className="rounded-full px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:text-rose-600">
          {tr(lang, 'common.delete')}
        </button>
      </div>
    </div>
  )
}

function OpenableCard({ letter, lang, onOpen }) {
  return (
    <button onClick={onOpen}
      className="animate-pulse rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-center shadow-md transition hover:scale-[1.02]">
      <div className="text-3xl">✉️</div>
      <div className="mt-1 text-[13px] font-extrabold text-amber-900">{tr(lang, 'journal.letterReady')}</div>
      <div className="text-[11.5px] text-amber-700">
        {new Date(letter.writtenAt).toLocaleDateString()} → {new Date(letter.unlockAt).toLocaleDateString()}
      </div>
      <div className="mt-2 rounded-full bg-amber-500 px-3 py-1 text-[11.5px] font-extrabold text-white">
        {tr(lang, 'journal.letterOpen')}
      </div>
    </button>
  )
}

export default function LettersPanel({ lang = 'en' }) {
  const now = new Date()
  const state = lettersState(now)
  const [tab, setTab] = useState('write')
  const [text, setText] = useState('')
  const [promise, setPromise] = useState('')
  const [preset, setPreset] = useState('1m')
  const [customDay, setCustomDay] = useState('')
  const [mood, setMood] = useState(null)
  const [opened, setOpened] = useState(null)
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(null)
  const [icsMsg, setIcsMsg] = useState(null)

  function seal() {
    if (!text.trim()) return
    const letter = writeLetter({
      text,
      promise,
      mood,
      preset,
      unlockAt: customDay || undefined,
    })
    if (letter) {
      setText('')
      setPromise('')
      setMood(null)
      setCustomDay('')
      setTab('letters')
    }
  }

  function open(id) {
    const res = openLetter(id, now)
    if (res.letter) { setOpened(res.letter); setTab('read') }
  }

  function sendReply() {
    if (!reply.trim() || !opened) return
    replyToLetter(opened.id, reply)
    setReply('')
    setOpened(null)
    setTab('letters')
  }

  function download(name, content, type = 'text/calendar') {
    try {
      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* download blocked */ }
  }

  function addToCalendar(letter) {
    const ics = lettersCalendar([letter], { lang, url: typeof window !== 'undefined' ? window.location.origin : '' })
    download(icsFilename('letter', letter.unlockAt), ics)
    setIcsMsg(tr(lang, 'journal.icsSingle', { date: letter.unlockAt }))
    setTimeout(() => setIcsMsg(null), 2500)
  }

  function addAllToCalendar() {
    const letters = state.letters || []
    if (!letters.length) return
    const ics = lettersCalendar(letters, { lang, url: typeof window !== 'undefined' ? window.location.origin : '' })
    download(icsFilename('letters', new Date().toISOString().slice(0, 10)), ics)
    const stats = icsStats(ics)
    setIcsMsg(tr(lang, 'journal.icsAll', { n: stats.events }))
    setTimeout(() => setIcsMsg(null), 3000)
  }

  function copyLetter(letter) {
    navigator.clipboard?.writeText(letterToText(letter, lang)).then(() => {
      setCopied(letter.id)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className={`${card} flex flex-wrap items-center gap-4`}>
        <span className="text-3xl">💌</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-extrabold text-slate-800">{tr(lang, 'journal.lettersTitle')}</h3>
          <p className="text-[12.5px] text-slate-500">{tr(lang, 'journal.lettersSub')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11.5px] font-bold">
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">🔒 {state.stats.sealed} {tr(lang, 'journal.letterSealedWord')}</span>
          {state.stats.ready > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">✉️ {state.stats.ready} {tr(lang, 'journal.letterReadyWord')}</span>
          )}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">📖 {state.stats.opened} {tr(lang, 'journal.letterOpenedWord')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'write', label: `✍️ ${tr(lang, 'journal.letterWrite')}` },
          { id: 'letters', label: `💌 ${tr(lang, 'journal.letterMine')} (${state.stats.total})` },
          ...(state.ready.length ? [{ id: 'read', label: `✉️ ${tr(lang, 'journal.letterOpen')}` }] : []),
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={chip(tab === t.id || (tab === 'read' && t.id === 'read'))}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- write ---------- */}
      {tab === 'write' && (
        <div className={card}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-extrabold text-rose-700">✨ {tr(lang, 'journal.letterPrompts')}</span>
            {LETTER_PROMPTS.map((p, i) => (
              <button key={p.id} onClick={() => setText((t) => (t ? `${t}\n\n${p.q[lang] || p.q.en}\n` : `${p.q[lang] || p.q.en}\n`))}
                className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11.5px] font-bold text-rose-700 hover:bg-rose-600 hover:text-white">
                {i + 1}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={tr(lang, 'journal.letterPlaceholder')}
            className={inputCls}
          />

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">🤝 {tr(lang, 'journal.letterPromise')}</span>
              <input className={inputCls} value={promise} placeholder={tr(lang, 'journal.letterPromisePh')}
                onChange={(e) => setPromise(e.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'journal.letterMoodNow')}</span>
              <div className="flex gap-1.5">
                {MOODS.map((m) => (
                  <button key={m.value} onClick={() => setMood(m.value)} title={m.label[lang] || m.label.en}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition ${
                      mood === m.value ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-slate-100 hover:bg-slate-200'
                    }`}>
                    {m.emoji}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-[11.5px] font-bold text-slate-500">⏳ {tr(lang, 'journal.letterUnlock')}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {UNLOCK_PRESETS.map((p) => (
                <button key={p.id} onClick={() => { setPreset(p.id); setCustomDay('') }}
                  className={chip(!customDay && preset === p.id)}>
                  {p.emoji} {p.label[lang] || p.label.en}
                </button>
              ))}
              <input type="date" className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-[12.5px]"
                min={dayKey(new Date(Date.now() + 86400000))}
                value={customDay}
                onChange={(e) => setCustomDay(e.target.value)} />
            </div>
            <p className="mt-1 text-[11.5px] text-slate-400">
              🔒 {tr(lang, 'journal.letterSealHint')}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={seal} disabled={!text.trim()}
              className={`${btn} bg-rose-600 px-5 py-2.5 text-white hover:bg-rose-700 disabled:opacity-40`}>
              🔒 {tr(lang, 'journal.letterSeal')}
            </button>
            {text && (
              <button onClick={() => setText('')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                {tr(lang, 'journal.clearPage')}
              </button>
            )}
            <span className="text-[11.5px] text-slate-400">
              {text.trim() ? `${text.trim().split(/\s+/).length} ${tr(lang, 'journal.words')}` : tr(lang, 'journal.letterEmptyHint')}
            </span>
          </div>
        </div>
      )}

      {/* ---------- my letters ---------- */}
      {tab === 'letters' && (
        <div className="space-y-3">
          {state.stats.total === 0 && (
            <div className={`${card} text-center`}>
              <div className="text-3xl">💌</div>
              <p className="mt-1 text-[13.5px] font-extrabold text-slate-700">{tr(lang, 'journal.letterNone')}</p>
              <p className="mt-1 text-[12.5px] text-slate-400">{tr(lang, 'journal.letterNoneHint')}</p>
              <button onClick={() => setTab('write')} className={`${btn} mt-3 bg-rose-600 px-4 text-white hover:bg-rose-700`}>
                ✍️ {tr(lang, 'journal.letterWrite')}
              </button>
            </div>
          )}

          {state.ready.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {state.ready.map((l) => <OpenableCard key={l.id} letter={l} lang={lang} onOpen={() => open(l.id)} />)}
            </div>
          )}

          {state.sealed.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-bold text-slate-500">
                  🔒 {state.sealed.length} {tr(lang, 'journal.letterSealedWord')}
                </span>
                <button onClick={addAllToCalendar}
                  className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                  📅 {tr(lang, 'journal.addAllToCalendar')}
                </button>
                {icsMsg && <span className="text-[11.5px] font-bold text-emerald-600">✓ {icsMsg}</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.sealed.map((l) => (
                  <SealedCard key={l.id} letter={l} lang={lang} now={now} onCalendar={addToCalendar} />
                ))}
              </div>
            </>
          )}

          {state.opened.length > 0 && (
            <div className={card}>
              <h3 className="mb-2 text-[13px] font-extrabold text-slate-800">📖 {tr(lang, 'journal.letterOpenedWord')}</h3>
              <ul className="space-y-2">
                {state.opened.map((l) => (
                  <li key={l.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-slate-500">
                      <span>{new Date(l.writtenAt).toLocaleDateString()} → {new Date(l.unlockAt).toLocaleDateString()}</span>
                      {l.mood && <span>{moodBy(l.mood)?.emoji}</span>}
                      {l.status === 'replied' && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">↩ {tr(lang, 'journal.letterReplied')}</span>}
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-[12.5px] text-slate-700">{l.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button onClick={() => { setOpened(l); setTab('read') }}
                        className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                        {tr(lang, 'common.more')}
                      </button>
                      <button onClick={() => copyLetter(l)}
                        className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
                        📋 {copied === l.id ? tr(lang, 'shield.copied') : tr(lang, 'shield.copy')}
                      </button>
                      <button onClick={() => deleteLetter(l.id)}
                        className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
                        🗑
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ---------- read one ---------- */}
      {tab === 'read' && (
        <div className={`${card} border-amber-200 bg-gradient-to-br from-amber-50 to-white`}>
          {!opened && state.ready.length > 0 ? (
            <div className="text-center">
              <p className="text-[13px] font-bold text-slate-600">{tr(lang, 'journal.letterPickOne')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {state.ready.map((l) => <OpenableCard key={l.id} letter={l} lang={lang} onOpen={() => open(l.id)} />)}
              </div>
            </div>
          ) : opened ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-amber-800">
                <span className="text-2xl">✉️</span>
                <span>{tr(lang, 'journal.letterFromPast')}</span>
                <span className="rounded-full bg-white px-2 py-0.5">
                  {new Date(opened.writtenAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {opened.mood && <span>{moodBy(opened.mood)?.emoji}</span>}
              </div>

              <p className="whitespace-pre-line text-[14px] leading-relaxed text-slate-800">{opened.text}</p>

              {opened.promise && (
                <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-[13px] font-bold text-amber-900">
                  🤝 {opened.promise}
                </p>
              )}

              {opened.context?.minutes ? (
                <p className="mt-3 text-[11.5px] text-slate-500">
                  📊 {tr(lang, 'journal.letterThatDay')}: ⏳ {opened.context.minutes} min
                  {opened.context.trees ? ` · 🌳 ${opened.context.trees}` : ''}
                  {opened.context.tasksDone ? ` · ✅ ${opened.context.tasksDone}` : ''}
                  {opened.context.streak ? ` · 🔥 ${opened.context.streak}` : ''}
                </p>
              ) : null}

              <div className="mt-4">
                <label className="mb-1 block text-[11.5px] font-bold text-slate-500">↩ {tr(lang, 'journal.letterReply')}</label>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
                  placeholder={tr(lang, 'journal.letterReplyPh')} className={inputCls} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={sendReply} disabled={!reply.trim()}
                    className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}>
                    ↩ {tr(lang, 'journal.letterSendReply')}
                  </button>
                  <button onClick={() => copyLetter(opened)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
                    📋 {copied === opened.id ? tr(lang, 'shield.copied') : tr(lang, 'shield.copy')}
                  </button>
                  <button onClick={() => { setOpened(null); setTab('letters') }}
                    className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
                    {tr(lang, 'common.close')}
                  </button>
                  <button onClick={() => openFeature('journal')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
                    📔 {tr(lang, 'journal.tabWrite')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-[13px] text-slate-500">
              {state.stats.sealed
                ? `🔒 ${letterCountdown(state.sealed[0], now, lang)}`
                : tr(lang, 'journal.letterNone')}
            </p>
          )}
        </div>
      )}

      <p className="text-center text-[11.5px] text-slate-400">💌 {tr(lang, 'journal.letterFooter')}</p>
    </div>
  )
}
