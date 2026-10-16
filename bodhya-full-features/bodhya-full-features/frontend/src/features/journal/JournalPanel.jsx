// ============================================================
//  Journal — a personalised study diary.
//
//  • Today's prompts are chosen from what actually happened
//    (minutes focused, trees grown, escapes, tasks, plan, streak,
//    exam countdown, recent moods) — see journal/logic.js.
//  • One tap fills the page, you edit, save. Mood + energy + wins
//    + struggles + gratitude + tomorrow's one thing.
//  • Timeline with mood strip, search, filters, pin, "on this day".
//  • Weekly review, export to Markdown / JSON, import back.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  JOURNAL, adoptWritingHour, appendVoiceNote, clearJournal, contextLine, deleteEntry, discardDraft,
  exportJournal, exportJournalJSON, importJournal, journalState, listEntries, saveEntry,
  setJournalSettings, setMood, startDraft, suggestedAction, togglePin, updateDraft,
} from './store.js'
import VoiceNote from './VoiceNote.jsx'
import LettersPanel from './LettersPanel.jsx'
import { ENERGY, MOODS, PROMPT_GROUPS, filterEntries, moodBy, promptLine, wordCount } from './logic.js'
import { speak, stopSpeaking, ttsSupported, speechLangFor } from '../chatbot/utils/speech.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-rose-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`
const inputCls = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-rose-500'

function MoodPicker({ value, onChange, lang, label }) {
  return (
    <div>
      {label && <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{label}</span>}
      <div className="flex gap-1.5">
        {MOODS.map((m) => (
          <button key={m.value} onClick={() => onChange(m.value)} title={m.label[lang] || m.label.en}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
              Number(value) === m.value ? 'scale-110 bg-rose-100 ring-2 ring-rose-400' : 'bg-slate-100 hover:bg-slate-200'
            }`}>
            {m.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function EnergyPicker({ value, onChange, lang }) {
  return (
    <div>
      <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'journal.energy')}</span>
      <div className="flex gap-1.5">
        {ENERGY.map((e) => (
          <button key={e.value} onClick={() => onChange(e.value)} title={e.label[lang] || e.label.en}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition ${
              Number(value) === e.value ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-slate-100 hover:bg-slate-200'
            }`}>
            {e.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

function MoodStrip({ strip, lang }) {
  return (
    <div className="flex items-end gap-1">
      {strip.map((d) => {
        const mood = moodBy(d.mood)
        return (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-0.5" title={`${d.key}${d.mood ? ` · ${d.mood}/5` : ''}`}>
            <div className="w-full rounded-t"
              style={{
                height: d.mood ? `${8 + d.mood * 6}px` : '6px',
                background: mood ? mood.color : '#e2e8f0',
              }} />
            <span className="text-[9.5px] font-bold text-slate-400">{d.label}</span>
          </div>
        )
      })}
      <span className="ml-1 self-end text-[10px] font-bold text-slate-400">{tr(lang, 'journal.last14')}</span>
    </div>
  )
}

function EntryCard({ entry, lang, onEdit }) {
  const [open, setOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const mood = moodBy(entry.mood)

  function readAloud() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    speak([entry.text, entry.win && `${tr(lang, 'journal.win')}: ${entry.win}`, entry.tomorrow && `${tr(lang, 'journal.tomorrow')}: ${entry.tomorrow}`]
      .filter(Boolean).join('. '), { lang: speechLangFor(lang), rate: 0.95 }, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    })
  }
  return (
    <div className={`${card} ${entry.pinned ? 'border-amber-300' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">{mood ? mood.emoji : '📄'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[13.5px] text-slate-800">
              {new Date(entry.day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </strong>
            {entry.energy && <span className="text-[12px]">{ENERGY.find((e) => e.value === entry.energy)?.emoji}</span>}
            {entry.subject && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-600">{entry.subject}</span>}
            {entry.words ? <span className="text-[10.5px] font-bold text-slate-400">{entry.words} {tr(lang, 'journal.words')}</span> : null}
            {entry.context?.minutes ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
                ⏳ {entry.context.minutes}m
              </span>
            ) : null}
          </div>

          <button onClick={() => setOpen((v) => !v)} className="mt-1 block w-full text-left">
            <p className={`whitespace-pre-line text-[13px] leading-relaxed text-slate-700 ${open ? '' : 'line-clamp-3'}`}>
              {entry.text || '—'}
            </p>
          </button>

          {open && (
            <div className="mt-2 space-y-1.5">
              {entry.win && <p className="text-[12.5px] text-emerald-700">🏆 <strong>{tr(lang, 'journal.win')}:</strong> {entry.win}</p>}
              {entry.struggle && <p className="text-[12.5px] text-rose-700">🪨 <strong>{tr(lang, 'journal.struggle')}:</strong> {entry.struggle}</p>}
              {entry.gratitude && <p className="text-[12.5px] text-amber-700">🙏 <strong>{tr(lang, 'journal.gratitude')}:</strong> {entry.gratitude}</p>}
              {entry.tomorrow && <p className="text-[12.5px] text-indigo-700">🎯 <strong>{tr(lang, 'journal.tomorrow')}:</strong> {entry.tomorrow}</p>}
              {(entry.tags || []).length > 0 && (
                <p className="flex flex-wrap gap-1">
                  {entry.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">#{t}</span>
                  ))}
                </p>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button onClick={() => setOpen((v) => !v)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
              {open ? tr(lang, 'common.less') : tr(lang, 'common.more')}
            </button>
            <button onClick={() => onEdit(entry)} className={`${btn} border border-slate-200 text-slate-600 hover:bg-slate-50`}>
              ✏️ {tr(lang, 'common.edit')}
            </button>
            {ttsSupported() && entry.text && (
              <button onClick={readAloud}
                className={`${btn} ${speaking ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {speaking ? `🔊 ${tr(lang, 'journal.reading')}` : '🔊'}
              </button>
            )}
            <button onClick={() => togglePin(entry.id)}
              className={`${btn} ${entry.pinned ? 'bg-amber-100 text-amber-800' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              📌
            </button>
            <button onClick={() => deleteEntry(entry.id)}
              className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JournalPanel({ lang: langProp = null }) {
  const store = useStore(JOURNAL)
  const lang = langProp || loadState().profile?.lang || 'en'
  const [tab, setTab] = useState('write')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(null)
  const [promptOpen, setPromptOpen] = useState(true)
  const fileRef = useRef(null)

  const state = useMemo(() => journalState(), [store.entries, store.draft, store.settings])
  const draft = store.draft
  const entries = useMemo(() => listEntries({ filter, query }), [store.entries, filter, query])
  const avatar = featureAvatar('journal')

  // keep a draft alive for today
  useEffect(() => {
    if (!draft) startDraft(state.context.day)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const d = draft || { text: '', mood: null, energy: null }

  function usePrompt(p) {
    const line = promptLine(p, lang)
    const next = d.text ? `${d.text}\n\n${line}\n` : `${line}\n`
    updateDraft({ text: next, promptIds: [...new Set([...(d.promptIds || []), p.id])] })
  }

  function editEntry(entry) {
    startDraft(entry.day, { ...entry })
    setTab('write')
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  function download(text, name) {
    try {
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* download blocked */ }
  }

  const suggestion = state.suggestion

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-rose-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">📔 {tr(lang, 'journal.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'journal.sub')}</p>
            <p className="mt-1 text-[12px] font-bold text-slate-600">{contextLine(state.context, lang)}</p>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-black text-slate-800">🔥 {state.stats.streak}</div>
            <div className="text-[11px] font-bold text-slate-400">
              {tr(lang, 'journal.entries')}: {state.stats.count} · {tr(lang, 'journal.avgMood')}: {state.stats.avgMood}/5
            </div>
          </div>
        </div>

        <div className="mt-3">
          <MoodStrip strip={state.strip} lang={lang} />
        </div>

        {suggestion && (
          <div className="mt-3 rounded-xl bg-rose-50/70 px-3 py-2 text-[12.5px] font-bold text-rose-800">
            💡 {suggestion.text[lang] || suggestion.text.en}
          </div>
        )}
      </div>

      {/* tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { id: 'write', label: `✍️ ${tr(lang, 'journal.tabWrite')}` },
          { id: 'entries', label: `📚 ${tr(lang, 'journal.tabEntries')} (${state.stats.count})` },
          { id: 'review', label: `📈 ${tr(lang, 'journal.tabReview')}` },
          { id: 'letters', label: `💌 ${tr(lang, 'journal.tabLetters')}${state.letters.stats.ready ? ` · ${state.letters.stats.ready}` : ''}` },
          { id: 'settings', label: `⚙️ ${tr(lang, 'notif.settings')}` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={chip(tab === t.id)}>{t.label}</button>
        ))}
        {!state.stats.todayWritten && tab !== 'write' && (
          <button onClick={() => setTab('write')} className={`${btn} bg-rose-600 px-4 text-white hover:bg-rose-700`}>
            ✍️ {tr(lang, 'journal.writeToday')}
          </button>
        )}
      </div>

      {/* ---------- WRITE ---------- */}
      {tab === 'write' && (
        <div className={`${card} mb-4`}>
          <div className="mb-3 flex flex-wrap items-end gap-4">
            <MoodPicker value={d.mood} onChange={(v) => updateDraft({ mood: v })} lang={lang}
              label={`${tr(lang, 'journal.mood')} · ${new Date(d.day || state.context.day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}`} />
            {store.settings.askEnergy && (
              <EnergyPicker value={d.energy} onChange={(v) => updateDraft({ energy: v })} lang={lang} />
            )}
            <label className="min-w-[140px]">
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'journal.subject')}</span>
              <input className={inputCls} value={d.subject || ''} placeholder={tr(lang, 'journal.subjectPh')}
                onChange={(e) => updateDraft({ subject: e.target.value })} />
            </label>
          </div>

          {/* personalised prompts */}
          {store.settings.promptEnabled && state.prompts.prompts.length > 0 && (
            <div className="mb-3 rounded-xl bg-rose-50/60 p-3">
              <button onClick={() => setPromptOpen((v) => !v)} className="mb-1 flex w-full items-center gap-2">
                <span className="text-[12px] font-extrabold text-rose-700">
                  ✨ {tr(lang, 'journal.promptsToday')}
                </span>
                <span className="ml-auto text-[11px] text-rose-400">{promptOpen ? '▾' : '▸'}</span>
              </button>
              {promptOpen && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {state.prompts.prompts.map((p) => (
                      <button key={p.id} onClick={() => usePrompt(p)}
                        className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11.5px] font-bold text-rose-700 transition hover:bg-rose-600 hover:text-white">
                        {promptLine(p, lang)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-rose-400">
                    {tr(lang, 'journal.whyThese')}{' '}
                    {(state.prompts.reason || []).slice(0, 2).map((r) => r.why).join(' · ') || '—'}
                  </p>
                </>
              )}
            </div>
          )}

          {store.settings.voiceNotes && (
            <div className="mb-3">
              <VoiceNote
                lang={lang}
                readText={d.text || ''}
                onAppend={(text) => appendVoiceNote(text)}
              />
            </div>
          )}

          <textarea
            value={d.text || ''}
            onChange={(e) => updateDraft({ text: e.target.value })}
            rows={7}
            placeholder={tr(lang, 'journal.placeholder')}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-700 outline-none focus:border-rose-500"
          />
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span>{wordCount(d.text)} {tr(lang, 'journal.words')}</span>
            <span>#tags {tr(lang, 'journal.tagsHint')}</span>
            {(d.tags || []).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500">#{t}</span>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-emerald-600">🏆 {tr(lang, 'journal.win')}</span>
              <input className={inputCls} value={d.win || ''} placeholder={tr(lang, 'journal.winPh')}
                onChange={(e) => updateDraft({ win: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-rose-600">🪨 {tr(lang, 'journal.struggle')}</span>
              <input className={inputCls} value={d.struggle || ''} placeholder={tr(lang, 'journal.strugglePh')}
                onChange={(e) => updateDraft({ struggle: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-amber-600">🙏 {tr(lang, 'journal.gratitude')}</span>
              <input className={inputCls} value={d.gratitude || ''} placeholder={tr(lang, 'journal.gratitudePh')}
                onChange={(e) => updateDraft({ gratitude: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-indigo-600">🎯 {tr(lang, 'journal.tomorrow')}</span>
              <input className={inputCls} value={d.tomorrow || ''} placeholder={tr(lang, 'journal.tomorrowPh')}
                onChange={(e) => updateDraft({ tomorrow: e.target.value })} />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => { const e = saveEntry(); if (e) setTab('entries') }}
              className={`${btn} bg-rose-600 px-5 py-2.5 text-white hover:bg-rose-700`}>
              💾 {state.stats.todayWritten || d.id ? tr(lang, 'common.save') : tr(lang, 'journal.saveToday')}
            </button>
            <button onClick={() => { discardDraft(); startDraft(state.context.day) }}
              className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              {tr(lang, 'journal.clearPage')}
            </button>
            {d.id && <span className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'journal.editing')}</span>}
            <button onClick={() => openFeature('focus')} className={`${btn} ml-auto border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              ⏳ {tr(lang, 'focus.start')}
            </button>
          </div>
        </div>
      )}

      {/* ---------- ENTRIES ---------- */}
      {tab === 'entries' && (
        <>
          <div className={`${card} mb-4 flex flex-wrap items-center gap-2`}>
            <input className={`${inputCls} min-w-[180px] flex-1`} placeholder={tr(lang, 'journal.searchPh')}
              value={query} onChange={(e) => setQuery(e.target.value)} />
            {[
              { id: 'all', label: tr(lang, 'common.all') },
              { id: 'pinned', label: `📌` },
              { id: 'high', label: `😄` },
              { id: 'low', label: `😕` },
              { id: 'thisMonth', label: tr(lang, 'journal.thisMonth') },
            ].map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={chip(filter === f.id)}>{f.label}</button>
            ))}
          </div>

          {state.onThisDay.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
              <div className="text-[12px] font-extrabold text-amber-800">🕰️ {tr(lang, 'journal.onThisDay')}</div>
              <ul className="mt-1 space-y-1">
                {state.onThisDay.map((e) => (
                  <li key={e.id} className="text-[12.5px] text-amber-900">
                    <strong>{e.day}</strong> — {String(e.text).slice(0, 120)}{String(e.text).length > 120 ? '…' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entries.length === 0 ? (
            <div className={`${card} text-center`}>
              <div className="mb-1 text-3xl">📔</div>
              <p className="text-[14px] font-extrabold text-slate-700">{tr(lang, 'journal.empty')}</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-slate-400">{tr(lang, 'journal.emptyHint')}</p>
              <button onClick={() => setTab('write')} className={`${btn} mt-3 bg-rose-600 px-4 text-white hover:bg-rose-700`}>
                ✍️ {tr(lang, 'journal.writeToday')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => <EntryCard key={e.id} entry={e} lang={lang} onEdit={editEntry} />)}
            </div>
          )}
        </>
      )}

      {/* ---------- LETTERS ---------- */}
      {tab === 'letters' && <LettersPanel lang={lang} />}

      {/* ---------- REVIEW ---------- */}
      {tab === 'review' && (
        <div className="space-y-3">
          <div className={card}>
            <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📈 {tr(lang, 'journal.tabReview')}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: tr(lang, 'journal.entries'), value: state.stats.count },
                { label: tr(lang, 'journal.streak'), value: `🔥 ${state.stats.streak}` },
                { label: tr(lang, 'journal.longest'), value: state.stats.longestStreak },
                { label: tr(lang, 'journal.avgMood'), value: `${state.stats.avgMood}/5` },
                { label: tr(lang, 'journal.trend'), value: state.trend.direction === 'up' ? '📈' : state.trend.direction === 'down' ? '📉' : '➖' },
                { label: tr(lang, 'journal.words'), value: state.stats.words },
                { label: tr(lang, 'journal.bestHour'), value: state.stats.bestHour != null ? `${String(state.stats.bestHour).padStart(2, '0')}:00` : '—' },
                { label: tr(lang, 'journal.pinned'), value: state.stats.pinned },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-[12.5px] font-bold text-slate-600">{row.label}</span>
                  <span className="text-[13.5px] font-black text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            {state.stats.topTags.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-[12px] font-bold text-slate-500">{tr(lang, 'journal.topTags')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {state.stats.topTags.map(([tag, n]) => (
                    <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11.5px] font-bold text-indigo-700">
                      #{tag} · {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {store.weeklyReviews?.length > 0 && (
            <div className={card}>
              <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📔 {tr(lang, 'journal.reviews')}</h3>
              <ul className="space-y-2">
                {store.weeklyReviews.slice(0, 6).map((r) => (
                  <li key={r.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[11.5px] font-extrabold text-slate-500">
                      {tr(lang, 'journal.weekOf')} {r.week}
                    </div>
                    <p className="whitespace-pre-line text-[12.5px] text-slate-700">{r.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={card}>
            <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📚 {tr(lang, 'journal.promptBank')}</h3>
            <div className="space-y-2">
              {Object.entries(PROMPT_GROUPS).map(([group, list]) => (
                <div key={group}>
                  <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-slate-400">{group}</div>
                  <ul className="mt-1 space-y-1">
                    {list.map((p) => (
                      <li key={p.id} className="flex items-start gap-2">
                        <button onClick={() => { usePrompt(p); setTab('write') }}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600 hover:bg-rose-100">
                          ✍️
                        </button>
                        <span className="text-[12.5px] text-slate-600">{promptLine(p, lang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- SETTINGS ---------- */}
      {tab === 'settings' && (
        <div className={`${card} mb-4 space-y-2`}>
          <h3 className="text-[13.5px] font-extrabold text-slate-800">⚙️ {tr(lang, 'journal.settings')}</h3>

          {[
            { key: 'promptEnabled', label: tr(lang, 'journal.setPrompts') },
            { key: 'autoContext', label: tr(lang, 'journal.setContext') },
            { key: 'askEnergy', label: tr(lang, 'journal.setEnergy') },
            { key: 'showOnThisDay', label: tr(lang, 'journal.setOnThisDay') },
            { key: 'reminderEnabled', label: tr(lang, 'journal.setReminder') },
            { key: 'weeklyReview', label: tr(lang, 'journal.setWeekly') },
          ].map((row) => (
            <label key={row.key} className="flex items-center gap-2 py-1 text-[12.5px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-rose-600" checked={store.settings[row.key]}
                onChange={(e) => setJournalSettings({ [row.key]: e.target.checked })} />
              {row.label}
            </label>
          ))}

          <label className="flex flex-wrap items-center gap-2 py-1 text-[12.5px] font-bold text-slate-600">
            ⏰ {tr(lang, 'journal.reminderTime')}
            <input type="time" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13px]"
              value={store.settings.reminderTime}
              onChange={(e) => setJournalSettings({ reminderTime: e.target.value })} />
            <button onClick={() => adoptWritingHour()} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              {tr(lang, 'journal.matchMyHour')}
            </button>
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={() => copy(exportJournal(lang), 'md')} className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
              📋 {copied === 'md' ? tr(lang, 'shield.copied') : tr(lang, 'journal.copyMarkdown')}
            </button>
            <button onClick={() => download(exportJournal(lang), 'bodhya-journal.md')} className={`${btn} bg-rose-600 text-white hover:bg-rose-700`}>
              ⬇️ {tr(lang, 'journal.downloadMd')}
            </button>
            <button onClick={() => download(exportJournalJSON(), 'bodhya-journal.json')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              ⬇️ JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const res = importJournal(text)
                setCopied(res.imported ? `imported-${res.imported}` : 'import-failed')
                setTimeout(() => setCopied(null), 2000)
              }} />
            <button onClick={() => fileRef.current?.click()} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              ⬆️ {tr(lang, 'journal.importJson')}
            </button>
            <button onClick={() => { if (window.confirm(tr(lang, 'common.confirm'))) clearJournal() }}
              className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
              🗑 {tr(lang, 'journal.deleteAll')}
            </button>
          </div>
          {copied && copied.startsWith('imported-') && (
            <p className="text-[12px] font-bold text-emerald-600">
              ✓ {tr(lang, 'journal.imported', { n: copied.split('-')[1] })}
            </p>
          )}
          <p className="pt-1 text-[11.5px] text-slate-400">{tr(lang, 'journal.privacy')}</p>
        </div>
      )}

      <p className="mb-6 text-center text-[11.5px] text-slate-400">💗 {tr(lang, 'journal.footer')}</p>
    </div>
  )
}
