// ============================================================
//  👨‍👩‍👧 GuardianView — what a parent/teacher opens with the code.
//
//  Read-only by construction: this component never edits anything,
//  it renders a report built from the sections the student allowed.
//  Code entry is the only way in.
// ============================================================
import { useState } from 'react'
import { guardianUnlock, weeklyForGuardian } from './store.js'
import GuardianReport from './GuardianReport.jsx'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

export default function GuardianView({ lang: langProp = null, initialCode = '' }) {
  const lang = langProp || loadState().profile?.lang || 'en'
  const [code, setCode] = useState(initialCode)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function open() {
    setError(null)
    setLoading(true)
    const res = guardianUnlock(code, { lang })
    setLoading(false)
    if (res.error) {
      setError({
        'wrong-code': tr(lang, 'guardian.errWrongCode'),
        paused: tr(lang, 'guardian.errPaused'),
        expired: tr(lang, 'guardian.errExpired'),
        'no-grant': tr(lang, 'guardian.errNoGrant'),
      }[res.error] || tr(lang, 'guardian.errGeneric'))
      return
    }
    setReport(res.report)
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-md">
        <div className={`${card} text-center`}>
          <div className="text-4xl">👨‍👩‍👧</div>
          <h2 className="mt-2 text-lg font-extrabold text-slate-800">{tr(lang, 'guardian.viewTitle')}</h2>
          <p className="mt-1 text-[12.5px] text-slate-500">{tr(lang, 'guardian.viewSub')}</p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') open() }}
            placeholder="ABC123"
            inputMode="text"
            autoComplete="off"
            className="mx-auto mt-4 block w-48 rounded-xl border-2 border-slate-300 px-4 py-3 text-center text-[20px] font-black tracking-[0.3em] text-slate-800 outline-none focus:border-indigo-500"
          />

          <button onClick={open} disabled={code.length < 6 || loading}
            className={`${btn} mt-3 bg-indigo-600 px-6 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-40`}>
            {loading ? '…' : `🔓 ${tr(lang, 'guardian.viewOpen')}`}
          </button>

          {error && <p className="mt-3 text-[12.5px] font-bold text-rose-600">⚠️ {error}</p>}

          <p className="mt-4 text-[11.5px] text-slate-400">{tr(lang, 'guardian.viewPrivacy')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className={`${card} mb-4 flex flex-wrap items-center gap-3`}>
        <span className="text-3xl">👨‍👩‍👧</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-extrabold text-slate-800">{tr(lang, 'guardian.viewOpenTitle')}</h2>
          <p className="text-[12px] text-slate-500">{report.summary}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-extrabold text-emerald-800">
          🔒 {tr(lang, 'guardian.readOnly')}
        </span>
        <button onClick={() => setReport(null)} className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
          {tr(lang, 'common.close')}
        </button>
      </div>

      <GuardianReport report={report} lang={lang} />

      <div className={`${card} mt-4`}>
        <h3 className="mb-1 text-[13px] font-extrabold text-slate-800">💬 {tr(lang, 'guardian.howToHelp')}</h3>
        <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-slate-600">
          <li>{tr(lang, 'guardian.help1')}</li>
          <li>{tr(lang, 'guardian.help2')}</li>
          <li>{tr(lang, 'guardian.help3')}</li>
        </ul>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
          📨 {weeklyForGuardian(lang)}
        </p>
      </div>

      <p className="mb-6 mt-3 text-center text-[11.5px] text-slate-400">{tr(lang, 'guardian.viewFooter')}</p>
    </div>
  )
}
