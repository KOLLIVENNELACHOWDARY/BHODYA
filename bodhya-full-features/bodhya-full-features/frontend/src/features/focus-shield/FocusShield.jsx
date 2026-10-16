// ============================================================
//  Focus Shield — the anti-doomscroll tab.
//
//  1. Blocklist for your *device*: pick packs, add your own sites,
//     then export a hosts file / DNS rules / extension list so the
//     sites are blocked even when Bodhya is closed.
//  2. Session guard: while a focus block or a tree is running,
//     every time you leave the app is logged, warned about, and in
//     strict mode it withers your tree.
//  3. Urge routine: "I want to scroll" → a 90-second breathing
//     pause + an honest decision + a daily scroll budget.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  SHIELD, addSite, cancelUrge, clearShieldLog, markExported, markExtensionInstalled, removeSite,
  resolveUrge, setShieldSettings, shieldState, startUrge, togglePack, urgeState,
} from './store.js'
import {
  SITE_PACKS, blocklistText, breathScale, budgetState, formatAway, isValidSite, normalizeSite,
  setupScore, urgeStep,
} from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'

import { FOCUS } from '../focus/store.js'
import { aliveTree } from '../study-forest/store.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-sky-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`
const inputCls = 'rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-sky-500'

export function UrgeOverlay({ lang, onClose = () => {} }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    // opening the overlay always starts (or restarts) the breathing routine
    if (!urgeState()) startUrge()
    const iv = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(iv)
  }, [])
  const u = urgeState(now)
  if (!u) return null
  const info = urgeStep(u.elapsed)
  const scale = breathScale(u.elapsed)

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mb-1 text-[12px] font-extrabold uppercase tracking-wide text-sky-600">
          {tr(lang, 'shield.urgeTitle')}
        </div>
        <div className="relative mx-auto my-4 flex h-40 w-40 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-sky-100"
            style={{ transform: `scale(${scale})`, transition: 'transform 0.4s ease-in-out' }} />
          <span className="relative text-3xl">{info.done ? '💪' : '🫁'}</span>
        </div>
        <p className="min-h-[52px] text-[15px] font-bold leading-snug text-slate-800">
          {info.step.label[lang] || info.step.label.en}
        </p>
        <div className="mx-auto mt-3 h-1.5 w-3/4 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, (u.elapsed / u.seconds) * 100)}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-slate-400">
          {Math.ceil(u.remaining)}s · {tr(lang, 'shield.urgeHint')}
        </p>

        {u.done ? (
          <div className="mt-4 space-y-2">
            <p className="text-[13.5px] font-bold text-slate-700">{tr(lang, 'shield.urgeAsk')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => { resolveUrge('resisted'); onClose?.() }}
                className={`${btn} bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700`}>
                ✅ {tr(lang, 'shield.urgeResisted')}
              </button>
              <button onClick={() => { resolveUrge('break', { minutes: 5 }); onClose?.() }}
                className={`${btn} bg-amber-100 px-4 py-2.5 text-amber-900 hover:bg-amber-200`}>
                ☕ {tr(lang, 'shield.urgeFiveMin')}
              </button>
              <button onClick={() => { resolveUrge('gave-in', { minutes: 0 }); onClose?.() }}
                className={`${btn} border border-slate-300 px-4 py-2.5 text-slate-500 hover:bg-slate-50`}>
                {tr(lang, 'shield.urgeGaveIn')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { cancelUrge(); onClose?.() }}
            className="mt-4 text-[12px] font-bold text-slate-400 underline">
            {tr(lang, 'common.cancel')}
          </button>
        )}
      </div>
    </div>
  )
}

function ExportBox({ lang, sites }) {
  const [format, setFormat] = useState('hosts')
  const [copied, setCopied] = useState(false)
  const content = useMemo(() => blocklistText(sites, format), [sites, format])

  const formats = [
    { id: 'hosts', label: 'hosts file', emoji: '🖥️' },
    { id: 'dns', label: 'DNS rules', emoji: '🌐' },
    { id: 'json', label: 'extension JSON', emoji: '🧩' },
    { id: 'text', label: 'plain list', emoji: '📄' },
  ]

  function download() {
    try {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'json' ? 'bodhya-blocklist.json' : format === 'hosts' ? 'hosts-bodhya.txt' : 'bodhya-blocklist.txt'
      a.click()
      URL.revokeObjectURL(url)
      markExported()
    } catch { /* download blocked */ }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {formats.map((f) => (
          <button key={f.id} onClick={() => setFormat(f.id)} className={chip(format === f.id)}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>
      <pre className="max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] leading-snug text-slate-600">
        {content.slice(0, 4000)}
      </pre>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(content).then(() => {
              setCopied(true); markExported(); setTimeout(() => setCopied(false), 1500)
            }).catch(() => {})
          }}
          className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
          📋 {copied ? tr(lang, 'shield.copied') : tr(lang, 'shield.copy')}
        </button>
        <button onClick={download} className={`${btn} bg-sky-600 text-white hover:bg-sky-700`}>
          ⬇️ {tr(lang, 'shield.download')}
        </button>
      </div>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[11.5px] text-slate-500">
        {(format === 'hosts' ? tr(lang, 'shield.hostsSteps') : format === 'dns' ? tr(lang, 'shield.dnsSteps') : tr(lang, 'shield.extSteps'))
          .split('\n').map((line, i) => <li key={i}>{line}</li>)}
      </ol>
      <p className="mt-2 text-[11px] italic text-slate-400">{tr(lang, 'shield.honest')}</p>
    </div>
  )
}

export default function FocusShield({ lang: langProp = null }) {
  const store = useStore(SHIELD)
  const lang = langProp || loadState().profile?.lang || 'en'
  const [site, setSite] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  void tick
  const st = shieldState()
  const budget = budgetState(store.settings, store.log)
  const score = setupScore({ sites: store.sites, settings: store.settings, extensionInstalled: store.extensionInstalled })
  const avatar = featureAvatar('shield')
  const focusActive = FOCUS.read().active
  const tree = aliveTree()
  const packSites = useMemo(
    () => [...new Set([...store.packs.flatMap((id) => SITE_PACKS.find((p) => p.id === id)?.sites || []), ...store.sites])],
    [store.packs, store.sites]
  )
  const escapesToday = store.log.filter((e) => e.type === 'escape' && (Date.now() - e.at) < 86400000)
  const secondsSinceEscape = escapesToday.length ? Math.round((Date.now() - escapesToday[0].at) / 1000) : null

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-sky-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">🛡️ {tr(lang, 'shield.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'shield.sub')}</p>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-black leading-none text-slate-800">{score}%</div>
            <div className="text-[11.5px] font-bold text-slate-400">{tr(lang, 'shield.setupScore')}</div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: `${score}%` }} />
        </div>

        {/* live status */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(focusActive || tree) && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-extrabold text-emerald-800">
              🛡️ {tr(lang, 'shield.watching')}
              {tree ? ` · ${tr(lang, 'shield.treeAtRisk')}` : ''}
            </span>
          )}
          {secondsSinceEscape != null && secondsSinceEscape < 600 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11.5px] font-extrabold text-amber-900">
              🚪 {tr(lang, 'shield.lastEscape')}: {formatAway(escapesToday[0].awayMs)} ({Math.round(secondsSinceEscape)}s)
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11.5px] font-bold text-slate-600">
            🎯 {tr(lang, 'shield.budgetLeft', { left: budget.left, total: store.settings.dailyScrollBreaks, min: budget.minutesLeft })}
          </span>
          <button onClick={() => startUrge()}
            className={`${btn} bg-rose-500 px-4 py-2 text-white hover:bg-rose-600`}>
            🙋 {tr(lang, 'shield.urgeButton')}
          </button>
        </div>
      </div>

      {/* the three pillars */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { emoji: '🚪', title: tr(lang, 'shield.pillarGuard'), body: tr(lang, 'shield.pillarGuardBody'), value: `${st.stats.cleanRate}%` },
          { emoji: '🫁', title: tr(lang, 'shield.pillarUrge'), body: tr(lang, 'shield.pillarUrgeBody'), value: `${st.stats.resisted}` },
          { emoji: '🚫', title: tr(lang, 'shield.pillarBlock'), body: tr(lang, 'shield.pillarBlockBody'), value: `${packSites.length}` },
        ].map((p) => (
          <div key={p.title} className={card}>
            <div className="text-[15px] font-extrabold text-slate-800">{p.emoji} {p.title}</div>
            <div className="mt-0.5 text-[20px] font-black text-sky-600">{p.value}</div>
            <p className="mt-1 text-[11.5px] leading-snug text-slate-500">{p.body}</p>
          </div>
        ))}
      </div>

      {/* blocklist */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🚫 {tr(lang, 'shield.blocklist')}</h3>

        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          {SITE_PACKS.map((p) => {
            const on = store.packs.includes(p.id)
            return (
              <button key={p.id} onClick={() => togglePack(p.id)}
                className={`rounded-xl border-2 p-2.5 text-left transition ${
                  on ? 'border-sky-400 bg-sky-50/60' : 'border-slate-200 bg-white hover:border-sky-200'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-slate-800">{p.emoji} {p.name[lang] || p.name.en}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${on ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {on ? '✓' : '+'}
                  </span>
                </div>
                <div className="mt-0.5 text-[10.5px] leading-snug text-slate-400">{p.sites.slice(0, 3).join(' · ')}…</div>
              </button>
            )
          })}
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input className={`${inputCls} min-w-[190px] flex-1`} placeholder={tr(lang, 'shield.addSitePh')}
            value={site} onChange={(e) => setSite(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const r = addSite(site); if (!r.error) setSite('') } }} />
          <button
            onClick={() => { const r = addSite(site); if (!r.error) setSite('') }}
            disabled={!isValidSite(site)}
            className={`${btn} bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40`}>
            ➕ {tr(lang, 'common.add')}
          </button>
        </div>
        {site && !isValidSite(site) && (
          <p className="mb-2 text-[11.5px] font-bold text-rose-600">{tr(lang, 'shield.invalidSite')}</p>
        )}

        {store.sites.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {store.sites.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-600">
                {s}
                <button onClick={() => removeSite(s)} className="text-slate-400 hover:text-rose-600">✕</button>
              </span>
            ))}
          </div>
        )}

        <div className="mb-2 rounded-xl bg-sky-50/70 p-3 text-[12px] text-sky-900">
          <strong>{tr(lang, 'shield.howItWorks')}</strong> {tr(lang, 'shield.howItWorksBody')}
        </div>
        <ExportBox lang={lang} sites={packSites} />
      </div>

      {/* settings */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">⚙️ {tr(lang, 'shield.guardSettings')}</h3>
          {[
            { key: 'enabled', label: tr(lang, 'shield.enabled') },
            { key: 'armOnFocus', label: tr(lang, 'shield.armOnFocus') },
            { key: 'witherOnWander', label: tr(lang, 'shield.witherOnWander') },
            { key: 'notifyOnEscape', label: tr(lang, 'shield.notifyOnEscape') },
          ].map((row) => (
            <label key={row.key} className="flex items-center gap-2 py-1 text-[12.5px] font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-sky-600"
                checked={store.settings[row.key]}
                onChange={(e) => setShieldSettings({ [row.key]: e.target.checked })} />
              {row.label}
            </label>
          ))}
          <div className="mt-2 space-y-2">
            <label className="block">
              <span className="mb-1 flex justify-between text-[12px] font-bold text-slate-600">
                <span>⏱️ {tr(lang, 'shield.warnAfter')}</span>
                <span className="tabular-nums text-slate-400">{store.settings.warnAfterSeconds}s</span>
              </span>
              <input type="range" min="5" max="120" step="5" value={store.settings.warnAfterSeconds}
                onChange={(e) => setShieldSettings({ warnAfterSeconds: Number(e.target.value) })}
                className="w-full accent-sky-600" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-[12px] font-bold text-slate-600">
                <span>🚪 {tr(lang, 'shield.maxEscapes')}</span>
                <span className="tabular-nums text-slate-400">{store.settings.maxEscapesPerSession}</span>
              </span>
              <input type="range" min="0" max="10" step="1" value={store.settings.maxEscapesPerSession}
                onChange={(e) => setShieldSettings({ maxEscapesPerSession: Number(e.target.value) })}
                className="w-full accent-sky-600" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-[12px] font-bold text-slate-600">
                <span>☕ {tr(lang, 'shield.dailyBreaks')}</span>
                <span className="tabular-nums text-slate-400">{store.settings.dailyScrollBreaks}</span>
              </span>
              <input type="range" min="0" max="10" step="1" value={store.settings.dailyScrollBreaks}
                onChange={(e) => setShieldSettings({ dailyScrollBreaks: Number(e.target.value) })}
                className="w-full accent-sky-600" />
            </label>
            <label className="block">
              <span className="mb-1 flex justify-between text-[12px] font-bold text-slate-600">
                <span>⏳ {tr(lang, 'shield.dailyMinutes')}</span>
                <span className="tabular-nums text-slate-400">{store.settings.dailyScrollMinutes} {tr(lang, 'plan.min')}</span>
              </span>
              <input type="range" min="5" max="120" step="5" value={store.settings.dailyScrollMinutes}
                onChange={(e) => setShieldSettings({ dailyScrollMinutes: Number(e.target.value) })}
                className="w-full accent-sky-600" />
            </label>
          </div>
        </div>

        {/* stats */}
        <div className={card}>
          <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📊 {tr(lang, 'shield.stats')}</h3>
          <div className="space-y-2">
            {[
              { label: tr(lang, 'shield.statSessions'), value: st.stats.sessions },
              { label: tr(lang, 'shield.statEscapes'), value: st.stats.escapes },
              { label: tr(lang, 'shield.statClean'), value: `${st.stats.cleanSessions} (${st.stats.cleanRate}%)` },
              { label: tr(lang, 'shield.statCleanStreak'), value: `🔥 ${st.stats.cleanStreak}` },
              { label: tr(lang, 'shield.statProtected'), value: `${Math.round(st.stats.protectedMinutes)} ${tr(lang, 'plan.min')}` },
              { label: tr(lang, 'shield.statResisted'), value: `💪 ${st.stats.resisted}` },
              { label: tr(lang, 'shield.statBreakMinutes'), value: `${st.stats.breakMinutes} ${tr(lang, 'plan.min')}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-[12.5px] font-bold text-slate-600">{row.label}</span>
                <span className="text-[13.5px] font-black text-slate-800">{row.value}</span>
              </div>
            ))}
          </div>
          {st.stats.bestHour && (
            <p className="mt-2 text-[11.5px] text-slate-500">
              🕐 {tr(lang, 'shield.worstHour', { hour: `${String(st.stats.bestHour.hour).padStart(2, '0')}:00` })}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => openFeature('forest')} className={`${btn} bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700`}>
              🌳 {tr(lang, 'forest.title')}
            </button>
            <button onClick={() => openFeature('focus')} className={`${btn} border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50`}>
              ⏳ {tr(lang, 'focus.start')}
            </button>
            <button onClick={clearShieldLog} className={`${btn} border border-slate-200 px-4 py-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
              🗑 {tr(lang, 'notif.clearAll')}
            </button>
          </div>
        </div>
      </div>

      {/* recent guard log */}
      <div className={`${card} mb-4`}>
        <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🧾 {tr(lang, 'shield.log')}</h3>
        {store.log.length === 0 ? (
          <p className="text-[12.5px] text-slate-400">{tr(lang, 'shield.logEmpty')}</p>
        ) : (
          <ul className="space-y-1.5">
            {store.log.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-[12.5px]">
                <span>{
                  { escape: '🚪', resisted: '💪', 'gave-in': '📱', break: '☕', blocked: '🚫' }[e.type] || '•'
                }</span>
                <span className="min-w-0 flex-1 truncate text-slate-700">
                  {
                    {
                      escape: tr(lang, 'shield.logEscape'),
                      resisted: tr(lang, 'shield.logResisted'),
                      'gave-in': tr(lang, 'shield.logGaveIn'),
                      break: tr(lang, 'shield.logBreak'),
                      blocked: tr(lang, 'shield.logBlocked'),
                    }[e.type]
                  }
                  {e.site ? ` · ${e.site}` : ''}
                </span>
                {e.awayMs ? <span className="shrink-0 font-bold text-amber-700">{formatAway(e.awayMs)}</span> : null}
                {e.minutes ? <span className="shrink-0 font-bold text-slate-500">{e.minutes} {tr(lang, 'plan.min')}</span> : null}
                <span className="shrink-0 text-[11px] text-slate-400">
                  {new Date(e.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
        {escapesToday.length > 0 && (
          <p className="mt-2 text-[11.5px] text-slate-400">
            {tr(lang, 'shield.todaySummary', { n: escapesToday.length, min: Math.round(st.stats.breakMinutes) })}
          </p>
        )}
      </div>

      {/* extension hint */}
      <div className={`${card} mb-6`}>
        <h3 className="mb-1 text-[13.5px] font-extrabold text-slate-800">🧩 {tr(lang, 'shield.extension')}</h3>
        <p className="text-[12px] text-slate-500">{tr(lang, 'shield.extensionBody')}</p>
        <label className="mt-2 flex items-center gap-2 text-[12.5px] font-bold text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-sky-600" checked={store.extensionInstalled}
            onChange={(e) => markExtensionInstalled(e.target.checked)} />
          {tr(lang, 'shield.extensionDone')}
        </label>
      </div>

    </div>
  )
}
