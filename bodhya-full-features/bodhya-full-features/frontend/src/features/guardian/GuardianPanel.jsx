// ============================================================
//  👨‍👩‍👧 Guardian — the student's side of the sharing switch.
//
//  Transparency is the design: the student sees every section that
//  is shared, can preview exactly what a guardian sees, can pause or
//  rotate the code, and journal text is off until they turn it on.
// ============================================================
import { useState } from 'react'
import {
  GUARDIAN, addNoteToGuardian, buildMonthReviewFor, createGrant, createGuestLink, deleteGrant,
  deleteGuestLink, guestLinks, guardianPanelState, markShared, monthReviewTextFor, monthsWithData,
  pauseSharing, reportHtml, reportText, revokeAndRotate, setGrantDetails, setGuardianSettings,
  setSections, toggleSection, weeklyForGuardian,
} from './store.js'
import { daysLeftOnLink } from './link.js'
import { monthKey } from './month.js'
import { monthlyReviewHtml } from './index.jsx'
import { SECTIONS, SECTION_IDS, defaultSections, sharingScore } from './logic.js'
import { useStore } from '../chatbot/utils/store.js'
import { featureAvatar } from '../chatbot/data/featureAvatars.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'
import GuardianReport from './GuardianReport.jsx'
import MonthlyReview from './MonthlyReview.jsx'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'
const chip = (active) => `rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
  active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
}`
const inputCls = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-500'

export default function GuardianPanel({ lang: langProp = null }) {
  const store = useStore(GUARDIAN)
  const lang = langProp || loadState().profile?.lang || 'en'
  const [preview, setPreview] = useState(false)
  const [mode, setMode] = useState('sharing')
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const [linkMsg, setLinkMsg] = useState(null)
  const [copied, setCopied] = useState(null)
  const [note, setNote] = useState(store.pendingNote || '')
  const state = guardianPanelState()
  const avatar = featureAvatar('guardian')
  const grant = state.grant
  const sections = grant?.sections || defaultSections()
  const score = sharingScore(sections, grant)

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }

  function download(text, name, channel) {
    try {
      const blob = new Blob([text], { type: name.endsWith('.html') ? 'text/html' : 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      markShared(channel)
    } catch { /* download blocked */ }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className={`${card} mb-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {avatar && <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-indigo-100" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-slate-800">👨‍👩‍👧 {tr(lang, 'guardian.title')}</h2>
            <p className="text-[13px] text-slate-500">{tr(lang, 'guardian.sub')}</p>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-black text-slate-800">{score}%</div>
            <div className="text-[11px] font-bold text-slate-400">{tr(lang, 'guardian.sharingScore')}</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-indigo-50/70 px-3 py-2 text-[12.5px] text-indigo-900">
          <strong>{tr(lang, 'guardian.principle')}</strong> {tr(lang, 'guardian.principleBody')}
        </div>
      </div>

      {/* not sharing yet */}
      {!grant && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-1 text-[13.5px] font-extrabold text-slate-800">🔗 {tr(lang, 'guardian.start')}</h3>
          <p className="mb-3 text-[12.5px] text-slate-500">{tr(lang, 'guardian.startBody')}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[150px] flex-1">
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'guardian.whoName')}</span>
              <input className={inputCls} placeholder={tr(lang, 'guardian.whoNamePh')} id="guardian-name" />
            </label>
            <label>
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">{tr(lang, 'guardian.relation')}</span>
              <select className={inputCls} id="guardian-relation" defaultValue="parent">
                {[
                  { id: 'parent', label: tr(lang, 'guardian.relParent') },
                  { id: 'teacher', label: tr(lang, 'guardian.relTeacher') },
                  { id: 'mentor', label: tr(lang, 'guardian.relMentor') },
                ].map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <button
              onClick={() => {
                const name = (document.getElementById('guardian-name')?.value || '').trim()
                const relation = document.getElementById('guardian-relation')?.value || 'parent'
                createGrant({ name, relation })
              }}
              className={`${btn} bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700`}>
              🔗 {tr(lang, 'guardian.create')}
            </button>
          </div>
        </div>
      )}

      {/* sharing active */}
      {grant && (
        <>
          <div className={`${card} mb-4`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[11.5px] font-extrabold ${
                state.status.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {state.status.ok ? `🟢 ${tr(lang, 'guardian.active')}` : `⏸ ${tr(lang, 'guardian.paused')}`}
              </span>
              {grant.name && <span className="text-[12.5px] font-bold text-slate-600">👤 {grant.name}</span>}
              <span className="text-[11.5px] text-slate-400">
                {tr(lang, 'guardian.views')}: {grant.views || 0}
                {grant.lastViewedAt ? ` · ${tr(lang, 'guardian.lastView')} ${new Date(grant.lastViewedAt).toLocaleString()}` : ''}
              </span>
              <div className="ml-auto flex flex-wrap gap-1.5">
                <button onClick={() => pauseSharing(!grant.active)}
                  className={`${btn} ${grant.active ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  {grant.active ? `⏸ ${tr(lang, 'guardian.pause')}` : `▶ ${tr(lang, 'guardian.resume')}`}
                </button>
                <button onClick={revokeAndRotate} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                  🔁 {tr(lang, 'guardian.rotate')}
                </button>
                <button onClick={deleteGrant} className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
                  🗑 {tr(lang, 'guardian.stopSharing')}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
              <span className="text-[11.5px] font-bold text-slate-500">{tr(lang, 'guardian.code')}</span>
              <code className="rounded-lg bg-white px-3 py-1.5 text-[16px] font-black tracking-[0.25em] text-slate-800">
                {grant.code}
              </code>
              <button onClick={() => copy(grant.code, 'code')} className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
                📋 {copied === 'code' ? tr(lang, 'shield.copied') : tr(lang, 'shield.copy')}
              </button>
              <span className="text-[11.5px] text-slate-400">{tr(lang, 'guardian.codeHint')}</span>
            </div>
          </div>

          {/* what is shared */}
          <div className={`${card} mb-4`}>
            <h3 className="mb-1 text-[13.5px] font-extrabold text-slate-800">🎛️ {tr(lang, 'guardian.whatIsShared')}</h3>
            <p className="mb-3 text-[12px] text-slate-500">{tr(lang, 'guardian.whatIsSharedBody')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SECTIONS.map((s) => {
                const on = sections.includes(s.id)
                const isPrivate = !s.default
                return (
                  <button key={s.id} onClick={() => toggleSection(s.id)}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      on ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.emoji}</span>
                      <span className="flex-1 text-[12.5px] font-extrabold text-slate-800">{s.label[lang] || s.label.en}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>{on ? '✓' : '—'}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-snug text-slate-500">{s.detail[lang] || s.detail.en}</p>
                    {isPrivate && (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        🔒 {tr(lang, 'guardian.privateByDefault')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => setSections(SECTION_IDS)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                {tr(lang, 'common.all')}
              </button>
              <button onClick={() => setSections(defaultSections())} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                {tr(lang, 'guardian.recommended')}
              </button>
              <button onClick={() => setSections(['studyTime'])} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
                {tr(lang, 'guardian.minimal')}
              </button>
            </div>
          </div>

          {/* preview + share */}
          <div className={`${card} mb-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13.5px] font-extrabold text-slate-800">👀 {tr(lang, 'guardian.preview')}</h3>
              <button onClick={() => setPreview((v) => !v)} className={chip(preview)}>
                {preview ? tr(lang, 'common.less') : tr(lang, 'guardian.showPreview')}
              </button>
              <div className="ml-auto flex flex-wrap gap-1.5">
                <button onClick={() => copy(reportText(lang), 'text')} className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
                  📋 {copied === 'text' ? tr(lang, 'shield.copied') : tr(lang, 'guardian.copyReport')}
                </button>
                <button onClick={() => download(reportText(lang), 'bodhya-guardian-report.txt', 'text')}
                  className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
                  ⬇️ {tr(lang, 'guardian.downloadText')}
                </button>
                <button onClick={() => download(reportHtml(lang), 'bodhya-guardian-report.html', 'html')}
                  className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
                  🖨️ {tr(lang, 'guardian.downloadHtml')}
                </button>
              </div>
            </div>

            <div className="mt-3">
              <span className="mb-1 block text-[11.5px] font-bold text-slate-500">
                ✍️ {tr(lang, 'guardian.note')}
              </span>
              <input className={inputCls} value={note}
                placeholder={tr(lang, 'guardian.notePh')}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => addNoteToGuardian(note)} />
            </div>

            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
              📨 {tr(lang, 'guardian.weeklyDigest')} <strong>{weeklyForGuardian(lang)}</strong>
            </div>

            {preview && (
              <div className="mt-3">
                <GuardianReport report={state.report} lang={lang} readOnly />
              </div>
            )}
          </div>

          {/* sharing history */}
          {store.history?.length > 0 && (
            <div className={`${card} mb-4`}>
              <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">🕓 {tr(lang, 'guardian.history')}</h3>
              <ul className="space-y-1.5">
                {store.history.slice(0, 10).map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-[12.5px] text-slate-600">
                    <span>{{ 'in-app': '👀', download: '⬇️', text: '📋', html: '🖨️' }[h.channel] || '📨'}</span>
                    <span className="min-w-0 flex-1">
                      {h.channel === 'in-app' ? tr(lang, 'guardian.histViewed') : tr(lang, 'guardian.histShared')}
                    </span>
                    <span className="shrink-0 font-bold text-slate-500">{h.score}/100</span>
                    <span className="shrink-0 text-[11px] text-slate-400">{new Date(h.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* mode switcher */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { id: 'sharing', label: `🔗 ${tr(lang, 'guardian.tabSharing')}` },
          { id: 'link', label: `📨 ${tr(lang, 'guardian.tabLink')}` },
          { id: 'month', label: `📄 ${tr(lang, 'guardian.tabMonth')}` },
        ].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={chip(mode === m.id)}>{m.label}</button>
        ))}
      </div>

      {/* ---------- guest link ---------- */}
      {mode === 'link' && (
        <div className={`${card} mb-4`}>
          <h3 className="mb-1 text-[13.5px] font-extrabold text-slate-800">📨 {tr(lang, 'guardian.linkTitle')}</h3>
          <p className="mb-3 text-[12px] text-slate-500">{tr(lang, 'guardian.linkBody')}</p>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => {
              const link = createGuestLink({ days: store.settings.guestLinkDays || 30, lang })
              setLinkMsg({ kind: 'created', url: link.url, exp: link.exp })
              try { navigator.clipboard?.writeText(link.url) } catch { /* ignore */ }
            }} className={`${btn} bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700`}>
              🔗 {tr(lang, 'guardian.createLink')}
            </button>
            <span className="text-[11.5px] text-slate-400">{tr(lang, 'guardian.linkExpiryHint', { n: store.settings.guestLinkDays || 30 })}</span>
          </div>

          {linkMsg?.kind === 'created' && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3">
              <div className="text-[11.5px] font-extrabold text-emerald-800">
                ✓ {tr(lang, 'guardian.linkCopied', { date: linkMsg.exp })}
              </div>
              <code className="mt-1 block break-all rounded-lg bg-white p-2 text-[10.5px] text-slate-600">
                {linkMsg.url}
              </code>
            </div>
          )}

          {guestLinks().length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-[12px] font-extrabold text-slate-700">🗂️ {tr(lang, 'guardian.linkHistory')}</div>
              <ul className="space-y-1.5">
                {guestLinks().map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span>{l.valid ? '🟢' : l.error === 'expired' ? '⌛' : '⚠️'}</span>
                    <span className="text-[11.5px] font-bold text-slate-600">
                      {l.valid
                        ? tr(lang, 'guardian.linkValid', { days: daysLeftOnLink(l.exp) ?? 0 })
                        : tr(lang, 'guardian.linkExpiredOn', { date: l.exp })}
                    </span>
                    <span className="text-[11px] text-slate-400">{l.sections.length} {tr(lang, 'guardian.sectionsWord')} · {l.stats?.urlChars || 0} chars</span>
                    <span className="ml-auto flex gap-1.5">
                      <button onClick={() => { try { navigator.clipboard?.writeText(l.stats?.url || '') } catch { /* ignore */ } }}
                        className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
                        📋
                      </button>
                      <button onClick={() => deleteGuestLink(l.id)}
                        className={`${btn} border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600`}>
                        🗑
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11.5px] text-slate-500">
            <strong>{tr(lang, 'guardian.linkHowItWorks')}</strong> {tr(lang, 'guardian.linkSnapshotNote')}
          </div>
        </div>
      )}

      {/* ---------- month in review ---------- */}
      {mode === 'month' && (
        <div className="mb-4">
          <MonthlyReview
            lang={lang}
            review={{ ...buildMonthReviewFor({ month, lang }), studentName: grant?.name || '' }}
            months={monthsWithData()}
            onMonthChange={setMonth}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const review = { ...buildMonthReviewFor({ month, lang }), studentName: grant?.name || '' }
                try {
                  const blob = new Blob([monthlyReviewHtml(review, lang)], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `bodhya-month-${month}.html`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { /* download blocked */ }
              }}
              className={`${btn} bg-slate-800 px-4 py-2 text-white hover:bg-slate-900`}>
              📄 {tr(lang, 'guardian.downloadMonth')}
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(monthReviewTextFor({ month, lang })).catch(() => {})}
              className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
              📋 {tr(lang, 'guardian.copyMonthText')}
            </button>
          </div>
        </div>
      )}

      {/* settings */}
      <div className={`${card} mb-4 space-y-2`}>
        <h3 className="text-[13.5px] font-extrabold text-slate-800">⚙️ {tr(lang, 'guardian.settings')}</h3>
        {[
          { key: 'weeklyReport', label: tr(lang, 'guardian.setWeekly') },
          { key: 'notifyOnView', label: tr(lang, 'guardian.setNotify') },
        ].map((row) => (
          <label key={row.key} className="flex items-center gap-2 py-1 text-[12.5px] font-bold text-slate-600">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={store.settings[row.key]}
              onChange={(e) => setGuardianSettings({ [row.key]: e.target.checked })} />
            {row.label}
          </label>
        ))}
        <label className="flex flex-wrap items-center gap-2 py-1 text-[12.5px] font-bold text-slate-600">
          ⏳ {tr(lang, 'guardian.expiry')}
          <select className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13px]"
            value={store.settings.expiryDays}
            onChange={(e) => {
              const days = Number(e.target.value)
              setGuardianSettings({ expiryDays: days })
              if (grant) setGrantDetails({ expiresAt: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null })
            }}>
            {[0, 7, 30, 90, 180].map((d) => (
              <option key={d} value={d}>{d === 0 ? tr(lang, 'guardian.noExpiry') : `${d} ${tr(lang, 'guardian.days')}`}</option>
            ))}
          </select>
          {grant?.expiresAt && (
            <span className="text-[11.5px] font-normal text-slate-400">
              {tr(lang, 'guardian.expiresOn')} {new Date(grant.expiresAt).toLocaleDateString()}
            </span>
          )}
        </label>
        <p className="pt-1 text-[11.5px] text-slate-400">{tr(lang, 'guardian.privacy')}</p>
      </div>

      <p className="mb-6 text-center text-[11.5px] text-slate-400">🤝 {tr(lang, 'guardian.footer')}</p>
    </div>
  )
}
