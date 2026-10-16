// ============================================================
//  Study Forest — plant a tree, start the timer, finish the task.
//  Leave the app mid-session and the tree withers; finish it and
//  it stays in your forest forever (and your streak grows).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  FOREST, achievements, aliveTree, buySpecies, clearForest, forestState, growTree, linkFocus,
  plantTree, reviveLastWithered, setForestSettings, witherTree,
} from './store.js'
import {
  ACHIEVEMENTS, SPECIES, STAGE_ART, STRICTNESS, forestByDay, forestToText, isUnlocked,
  speciesById, stageFor, unlockReason,
} from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { FOCUS, startFocus, stopFocus } from '../focus/store.js'
import { startForSession } from '../music/store.js'
import { formatMinutes, goalProgress } from '../time-tracking/store.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`

function LiveTree({ lang, tick }) {
  const alive = useStore(FOREST, (s) => s.alive)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  if (!alive) return null
  const species = speciesById(alive.speciesId)
  const active = FOCUS.read().active
  const elapsedMin = Math.max(0, (now - alive.plantedAt) / 60000)
  const total = alive.minutes
  const pct = Math.max(0, Math.min(100, Math.round((elapsedMin / total) * 100)))
  const stage = stageFor(total, elapsedMin)
  const leftMs = active ? Math.max(0, active.endsAt - now) : Math.max(0, alive.plantedAt + total * 60000 - now)
  const clock = `${String(Math.floor(leftMs / 60000)).padStart(2, '0')}:${String(Math.floor((leftMs % 60000) / 1000)).padStart(2, '0')}`
  const strict = STRICTNESS.find((s) => s.id === alive.strictness) || STRICTNESS[1]
  void tick

  return (
    <div className={`${card} mb-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-200/60" />
          <span className="relative text-5xl" title={stage}>{STAGE_ART[stage]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-slate-800">
              {species.emoji} {species.name[lang] || species.name.en}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {strict.emoji} {strict.label[lang] || strict.label.en}
            </span>
            {alive.escapes > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                🚪 {alive.escapes} {tr(lang, 'forest.escapes')}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-slate-800">{clock}</span>
            <span className="text-[12px] font-bold text-slate-400">
              {tr(lang, 'forest.growing')} · {total} {tr(lang, 'plan.min')}
              {alive.subject ? ` · ${alive.subject}` : ''}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-slate-500">
            <span>{pct}% · {STAGE_ART[stage]}</span>
            <span>· {tr(lang, 'forest.ifYouLeave')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {active && (
            <>
              <button onClick={() => openFeature('focus')} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                ⏳ {tr(lang, 'forest.openTimer')}
              </button>
              <button onClick={() => { stopFocus(); witherTree(alive.id, 'cancelled') }}
                className={`${btn} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
                🥀 {tr(lang, 'forest.giveUp')}
              </button>
            </>
          )}
          {!active && (
            <button onClick={() => growTree(alive.id)} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
              ✅ {tr(lang, 'forest.finishEarly')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlantPanel({ lang, st }) {
  const [speciesId, setSpeciesId] = useState('pine')
  const [minutes, setMinutes] = useState(25)
  const [subject, setSubject] = useState(FOCUS.read().active?.subject || '')
  const [strictness, setStrictness] = useState(st.settings.strictness)
  const species = speciesById(speciesId)
  const unlocked = isUnlocked(species, { coins: st.coins, streak: st.stats.streak })

  useEffect(() => { setMinutes(species.minutes) }, [speciesId, species.minutes])

  function plant() {
    const res = plantTree({ speciesId, minutes, subject, strictness })
    if (res.error) return
    const block = startFocus({ minutes, subject, treeId: res.tree.id })
    linkFocus(res.tree.id, block?.id)
    startForSession({ subject, minutes })
  }

  return (
    <div className={`${card} mb-4`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-[13.5px] font-extrabold text-slate-800">🌱 {tr(lang, 'forest.plant')}</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
          🪙 {st.coins} {tr(lang, 'forest.coins')}
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          🔥 {st.stats.streak} {tr(lang, 'todo.streak')}
        </span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
          {tr(lang, 'forest.level')} {st.level.level}
        </span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SPECIES.map((s) => {
          const ok = isUnlocked(s, { coins: st.coins, streak: st.stats.streak })
          const active = speciesId === s.id
          return (
            <button key={s.id}
              onClick={() => { if (ok) setSpeciesId(s.id); else buySpecies(s.id) }}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                active ? 'border-emerald-400 bg-emerald-50/60' : ok ? 'border-slate-200 bg-white hover:border-emerald-200' : 'border-dashed border-slate-200 bg-slate-50 opacity-80'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.emoji}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                  {s.minutes} {tr(lang, 'plan.min')}
                </span>
              </div>
              <div className="mt-1 text-[13px] font-extrabold text-slate-800">{s.name[lang] || s.name.en}</div>
              <div className="text-[10.5px] leading-snug text-slate-500">{s.fact[lang] || s.fact.en}</div>
              {!ok && (
                <div className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
                  {s.unlock?.type === 'coins' ? '🪙' : '🔥'} {unlockReason(s, lang)}
                </div>
              )}
              {active && <div className="mt-1 text-[10.5px] font-bold text-emerald-700">✓ {tr(lang, 'forest.selected')}</div>}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'focus.preset')}</span>
          <input type="number" min="5" max="180" step="5" value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) || 25)}
            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <label className="min-w-[150px] flex-1">
          <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'focus.subject')}</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder={tr(lang, 'focus.subjectPh')}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-emerald-500" />
        </label>
        <div>
          <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'forest.strictness')}</span>
          <div className="flex flex-wrap gap-1.5">
            {STRICTNESS.map((s) => (
              <button key={s.id} onClick={() => { setStrictness(s.id); setForestSettings({ strictness: s.id }) }}
                className={chip(strictness === s.id)} title={s.desc[lang] || s.desc.en}>
                {s.emoji} {s.label[lang] || s.label.en}
              </button>
            ))}
          </div>
        </div>
        <button onClick={plant} className={`${btn} bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700`}>
          🌱 {tr(lang, 'forest.plantNow')}
        </button>
      </div>
      <p className="mt-2 text-[11.5px] text-slate-400">
        {(STRICTNESS.find((s) => s.id === strictness) || STRICTNESS[1]).desc[lang] || ''}
      </p>
    </div>
  )
}

export default function StudyForest({ lang: langProp = null }) {
  const store = useStore(FOREST)
  const lang = langProp || loadState().profile?.lang || 'en'
  const [tick, setTick] = useState(0)
  const [tab, setTab] = useState('forest')
  const [copyMsg, setCopyMsg] = useState(null)

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(iv)
  }, [])

  void tick
  const st = forestState()
  const days = useMemo(() => forestByDay(store.trees, 14), [store.trees])
  const achievementsList = useMemo(() => achievements(), [store.trees, store.achievements])
  const avatar = featureAvatar('forest')
  const alive = aliveTree()
  const withered = store.trees.filter((t) => t.status === 'withered').sort((a, b) => b.witheredAt - a.witheredAt)
  const goal = goalProgress()

  function copyPlan() {
    navigator.clipboard?.writeText(forestToText(store.trees, lang)).then(() => {
      setCopyMsg(tr(lang, 'forest.copied'))
      setTimeout(() => setCopyMsg(null), 1600)
    }).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-emerald-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">🌳 {tr(lang, 'forest.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'forest.sub')}</p>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-black leading-none text-slate-800">{st.stats.total} 🌳</div>
            <div className="text-[11.5px] font-bold text-slate-400">
              {formatMinutes(st.stats.minutes)} · 🔥 {st.stats.streak} {tr(lang, 'todo.streak')}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11.5px] font-bold text-slate-500">
            <span>{tr(lang, 'forest.level')} {st.level.level}</span>
            <span>{st.level.next} 🌳 → {tr(lang, 'forest.level')} {st.level.level + 1}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${st.level.pct}%` }} />
          </div>
        </div>
      </div>

      {/* live tree */}
      <LiveTree lang={lang} tick={tick} />

      {/* plant */}
      {!alive && <PlantPanel lang={lang} st={st} />}

      {/* stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { emoji: '🌳', label: tr(lang, 'forest.totalTrees'), value: st.stats.total },
          { emoji: '📅', label: tr(lang, 'forest.todayTrees'), value: st.stats.todayTrees },
          { emoji: '🔥', label: tr(lang, 'forest.streak'), value: st.stats.streak },
          { emoji: '🛡️', label: tr(lang, 'forest.cleanSessions'), value: st.stats.cleanSessions },
        ].map((s) => (
          <div key={s.label} className={card}>
            <div className="text-[11.5px] font-bold text-slate-400">{s.label}</div>
            <div className="text-[19px] font-black text-slate-800">{s.emoji} {s.value}</div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { id: 'forest', label: `🌲 ${tr(lang, 'forest.tabForest')}` },
          { id: 'stats', label: `📊 ${tr(lang, 'forest.tabStats')}` },
          { id: 'badges', label: `🏅 ${tr(lang, 'forest.tabBadges')}` },
          { id: 'settings', label: `⚙️ ${tr(lang, 'notif.settings')}` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={chip(tab === t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'forest' && (
        <div className={`${card} mb-4`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-[13.5px] font-extrabold text-slate-800">🗺️ {tr(lang, 'forest.yourForest')}</h3>
            {copyMsg && <span className="text-[11.5px] font-bold text-emerald-600">✓ {copyMsg}</span>}
            <div className="ml-auto flex gap-1.5">
              <button onClick={copyPlan} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                📋 {tr(lang, 'plan.copyPlan')}
              </button>
              <button onClick={() => { if (window.confirm(tr(lang, 'common.confirm'))) clearForest() }}
                className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
                🗑 {tr(lang, 'forest.clear')}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {days.map((d) => (
              <div key={d.key} className={`rounded-xl border p-2.5 ${d.isToday ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
                <div className="mb-1 flex items-center gap-2 text-[11.5px] font-extrabold text-slate-600">
                  <span>{d.label}</span>
                  <span className="text-slate-400">{d.date.getDate()}/{d.date.getMonth() + 1}</span>
                  {d.isToday && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white">{tr(lang, 'common.today')}</span>}
                  <span className="ml-auto text-slate-400">
                    {d.trees.length} 🌳{d.withered.length ? ` · ${d.withered.length} 🥀` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xl leading-none">
                  {d.trees.map((t) => (
                    <span key={t.id} title={`${speciesById(t.speciesId).name.en} · ${t.minutes} min`}>
                      {speciesById(t.speciesId).emoji}
                    </span>
                  ))}
                  {d.withered.map((t) => (
                    <span key={t.id} title={`${speciesById(t.speciesId).name.en} · ${t.witherReason}`} className="opacity-60">🥀</span>
                  ))}
                  {!d.trees.length && !d.withered.length && <span className="text-[11px] text-slate-300">—</span>}
                </div>
              </div>
            ))}
          </div>

          {withered.length > 0 && (
            <div className="mt-3 rounded-xl bg-rose-50/60 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] font-extrabold text-rose-700">
                  🥀 {tr(lang, 'forest.withered')}: {withered.length}
                </span>
                <button onClick={() => reviveLastWithered(5)} className={`${btn} bg-white text-rose-700 hover:bg-rose-100`}>
                  💚 {tr(lang, 'forest.revive')} (5 🪙)
                </button>
              </div>
              <div className="flex flex-wrap gap-1 text-lg">
                {withered.slice(0, 30).map((t) => <span key={t.id} className="opacity-70">🥀</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📊 {tr(lang, 'forest.tabStats')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: tr(lang, 'forest.totalMinutes'), value: formatMinutes(st.stats.minutes) },
              { label: tr(lang, 'forest.weekTrees'), value: st.stats.weekTrees },
              { label: tr(lang, 'forest.longestStreak'), value: st.stats.longestStreak },
              { label: tr(lang, 'forest.survival'), value: `${st.stats.survivalRate}%` },
              { label: tr(lang, 'forest.longestSession'), value: `${st.stats.longestSession} ${tr(lang, 'plan.min')}` },
              { label: tr(lang, 'forest.speciesGrown'), value: `${st.stats.speciesCount}/${SPECIES.length}` },
              { label: tr(lang, 'forest.nightSessions'), value: st.stats.nightSessions },
              { label: tr(lang, 'forest.morningSessions'), value: st.stats.morningSessions },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-[12.5px] font-bold text-slate-600">{row.label}</span>
                <span className="text-[14px] font-black text-slate-800">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-indigo-50/60 p-3">
            <div className="text-[12px] font-extrabold text-indigo-700">⏱️ {tr(lang, 'time.goal')}</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${goal.pct}%` }} />
            </div>
            <div className="mt-1 text-[11.5px] font-bold text-indigo-500">
              {formatMinutes(goal.today)} / {formatMinutes(goal.goal)} · {goal.pct}%
            </div>
          </div>
        </div>
      )}

      {tab === 'badges' && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🏅 {tr(lang, 'forest.tabBadges')}</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {achievementsList.map((a) => (
              <div key={a.id}
                className={`rounded-xl border p-3 text-center ${a.earned ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                <div className={`text-2xl ${a.earned ? '' : 'grayscale'}`}>{a.emoji}</div>
                <div className="mt-1 text-[12px] font-extrabold text-slate-700">{a.name[lang] || a.name.en}</div>
                <div className="text-[10.5px] font-bold text-slate-400">
                  {a.earned ? tr(lang, 'forest.earned') : tr(lang, 'forest.locked')}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-slate-400">
            {ACHIEVEMENTS.filter((a) => achievementsList.find((x) => x.id === a.id)?.earned).length}/{ACHIEVEMENTS.length} {tr(lang, 'forest.earned')}
          </p>
        </div>
      )}

      {tab === 'settings' && (
        <div className={`${card} mb-4 space-y-2`}>
          <h3 className="text-[13.5px] font-extrabold text-slate-800">⚙️ {tr(lang, 'forest.settings')}</h3>
          <div>
            <span className="mb-1 block text-[12px] font-bold text-slate-600">{tr(lang, 'forest.strictness')}</span>
            <div className="flex flex-wrap gap-1.5">
              {STRICTNESS.map((s) => (
                <button key={s.id} onClick={() => setForestSettings({ strictness: s.id })}
                  className={chip(store.settings.strictness === s.id)}>
                  {s.emoji} {s.label[lang] || s.label.en}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11.5px] text-slate-400">
              {(STRICTNESS.find((s) => s.id === store.settings.strictness) || STRICTNESS[1]).desc[lang] || ''}
            </p>
          </div>
          {[
            { key: 'autoMusic', label: tr(lang, 'forest.autoMusic') },
            { key: 'warnOnLeave', label: tr(lang, 'forest.warnOnLeave') },
            { key: 'soundOnGrow', label: tr(lang, 'forest.soundOnGrow') },
            { key: 'coinsEnabled', label: tr(lang, 'forest.coinsEnabled') },
          ].map((row) => (
            <label key={row.key} className="flex items-center gap-2 text-[12.5px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-emerald-600"
                checked={store.settings[row.key]}
                onChange={(e) => setForestSettings({ [row.key]: e.target.checked })} />
              {row.label}
            </label>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => openFeature('focus')} className={`${btn} bg-slate-800 px-4 text-white hover:bg-slate-900`}>
              ⏳ {tr(lang, 'focus.title')}
            </button>
            <button onClick={() => openFeature('shield')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              🛡️ {tr(lang, 'shield.title')}
            </button>
            <button onClick={() => openFeature('music')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              🎵 {tr(lang, 'music.title')}
            </button>
          </div>
        </div>
      )}

      <p className="mb-6 text-center text-[11.5px] text-slate-400">💚 {tr(lang, 'forest.footer')}</p>
    </div>
  )
}
