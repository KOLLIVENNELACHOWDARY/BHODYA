// ============================================================
//  🔗 GuardianGuest — a teacher opens a shared link and sees the
//  frozen snapshot. No account, no app knowledge, read-only.
//
//  The data lives in the URL fragment itself, so nothing is fetched
//  from anywhere, the link can only ever show what was shared at that
//  moment, and it stops working after its expiry date.
// ============================================================
import { useEffect, useState } from 'react'
import { noteGuestOpen, openGuestLink } from './store.js'
import GuardianReport from './GuardianReport.jsx'
import { tr } from '../chatbot/i18n/features.js'
import { loadState } from '../chatbot/brain/memory.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

export default function GuardianGuest({ token, lang: langProp = null }) {
  const lang = langProp || loadState().profile?.lang || 'en'
  // decode during the first render: the report is visible immediately
  // (no flash of an empty page, and the same markup works for printing)
  const [state, setState] = useState(() => {
    if (!token) return { ok: false, error: 'malformed' }
    return openGuestLink(token, lang)
  })

  useEffect(() => {
    if (state?.ok) noteGuestOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // a different token (rare) re-decodes
  useEffect(() => {
    setState(token ? openGuestLink(token, lang) : { ok: false, error: 'malformed' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!state) return null

  if (!state.ok) {
    const messages = {
      expired: {
        title: tr(lang, 'guardian.guestExpired'),
        body: tr(lang, 'guardian.guestExpiredBody', { date: state.expiresAt || '—' }),
        emoji: '⌛',
      },
      corrupt: {
        title: tr(lang, 'guardian.guestCorrupt'),
        body: tr(lang, 'guardian.guestCorruptBody'),
        emoji: '⚠️',
      },
      malformed: {
        title: tr(lang, 'guardian.guestBadLink'),
        body: tr(lang, 'guardian.guestBadLinkBody'),
        emoji: '🔗',
      },
      future: {
        title: tr(lang, 'guardian.guestBadLink'),
        body: tr(lang, 'guardian.guestFutureBody'),
        emoji: '🕰️',
      },
    }[state.error] || { title: 'Link problem', body: '', emoji: '⚠️' }

    return (
      <div className="mx-auto max-w-lg">
        <div className={`${card} text-center`}>
          <div className="text-4xl">{messages.emoji}</div>
          <h2 className="mt-2 text-lg font-extrabold text-slate-800">{messages.title}</h2>
          <p className="mt-1 text-[12.5px] text-slate-500">{messages.body}</p>
          <p className="mt-3 text-[11.5px] text-slate-400">{tr(lang, 'guardian.guestAskAgain')}</p>
        </div>
      </div>
    )
  }

  const { report } = state

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`${card} mb-4 flex flex-wrap items-center gap-3`}>
        <span className="text-3xl">👨‍👩‍👧</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold text-slate-800">
            {tr(lang, 'guardian.guestTitle')}
            {state.studentName ? ` — ${state.studentName}` : ''}
          </h2>
          <p className="text-[12px] text-slate-500">{state.summaryLine}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-extrabold text-emerald-800">
          🔒 {tr(lang, 'guardian.readOnly')}
        </span>
      </div>

      <div className="mb-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-[12px] text-indigo-900">
        {tr(lang, 'guardian.guestSnapshotNote', { date: state.issuedAt ? new Date(state.issuedAt).toLocaleDateString() : '—' })}
      </div>

      <GuardianReport report={report} lang={lang} />

      <div className={`${card} mt-4`}>
        <h3 className="mb-1 text-[13px] font-extrabold text-slate-800">💬 {tr(lang, 'guardian.howToHelp')}</h3>
        <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-slate-600">
          <li>{tr(lang, 'guardian.help1')}</li>
          <li>{tr(lang, 'guardian.help2')}</li>
          <li>{tr(lang, 'guardian.help3')}</li>
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button onClick={() => window.print()} className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
          🖨️ {tr(lang, 'guardian.printPdf')}
        </button>
        <button onClick={() => navigator.clipboard?.writeText(state.report ? JSON.stringify(state.report, null, 2) : '').catch(() => {})}
          className={`${btn} border border-slate-300 text-slate-600 hover:bg-white`}>
          📋 {tr(lang, 'shield.copy')}
        </button>
      </div>

      <p className="mb-6 mt-3 text-center text-[11.5px] text-slate-400">
        {tr(lang, 'guardian.guestFooter', { date: state.expiresAt })}
      </p>
    </div>
  )
}
