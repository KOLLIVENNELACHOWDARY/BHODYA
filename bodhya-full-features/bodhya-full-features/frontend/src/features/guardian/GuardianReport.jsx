// ============================================================
//  GuardianReport — the read-only report itself (used by the
//  student's preview and by the guardian's view, so they can never
//  drift apart: there is one renderer).
// ============================================================
import { SECTION_STATUS } from './logic.js'
import { tr } from '../chatbot/i18n/features.js'

const TONE = {
  good: 'border-emerald-200 bg-emerald-50/50',
  watch: 'border-amber-200 bg-amber-50/50',
  low: 'border-rose-200 bg-rose-50/50',
}

export default function GuardianReport({ report, lang = 'en', readOnly = false }) {
  if (!report) return null

  return (
    <div className="space-y-3">
      {report.noteFromStudent && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-[12.5px] text-indigo-900">
          ✍️ <strong>{tr(lang, 'guardian.noteFrom')}</strong> {report.noteFromStudent}
        </div>
      )}

      {report.noneShared ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-1 text-[13.5px] font-extrabold text-slate-700">{tr(lang, 'guardian.nothingShared')}</p>
          <p className="mt-1 text-[12.5px] text-slate-400">{tr(lang, 'guardian.nothingSharedHint')}</p>
        </div>
      ) : (
        <>
          {/* highlights first — the two lines a human actually reads */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-extrabold text-slate-800">💡 {tr(lang, 'guardian.highlights')}</span>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                {report.score}/100
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-slate-700">
                  <span>•</span><span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {report.sections.map((s) => {
              const status = SECTION_STATUS[s.status] || SECTION_STATUS.watch
              return (
                <div key={s.id} className={`rounded-2xl border p-4 ${TONE[s.status] || TONE.watch}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{status.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-extrabold text-slate-800">{s.headline}</div>
                      <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                        {status.label[lang] || status.label.en}
                      </div>
                    </div>
                  </div>

                  {s.rows?.length > 0 && (
                    <dl className="mt-2 space-y-1">
                      {s.rows.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <dt className="text-slate-500">{r.label}</dt>
                          <dd className="font-black text-slate-800">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {s.entries?.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {s.entries.map((e, i) => (
                        <li key={i} className="rounded-lg bg-white/80 px-2.5 py-2 text-[12px] text-slate-700">
                          <span className="font-bold text-slate-500">{e.day}</span>
                          {' — '}
                          {String(e.text).slice(0, 180)}{String(e.text).length > 180 ? '…' : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.note && <p className="mt-2 text-[10.5px] italic text-slate-400">{s.note}</p>}
                </div>
              )
            })}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-slate-400">
        {readOnly ? tr(lang, 'guardian.previewFooter') : tr(lang, 'guardian.viewReadFooter')}
        {report.sharedAt ? ` · ${new Date(report.sharedAt).toLocaleString()}` : ''}
      </p>
    </div>
  )
}
