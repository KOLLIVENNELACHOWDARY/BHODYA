// ============================================================
//  📄 Month in review — the printable one-pager for a
//  parent-teacher meeting.
//
//  * every chart is inline SVG, so it prints identically everywhere
//    and needs no external assets
//  * print CSS (@page A4, no page-break inside cards) is inlined
//  * three buttons: print/save-as-PDF, download HTML, copy text
// ============================================================
import { useMemo, useState } from 'react'
import {
  WEEKDAYS, barGeometry, monthLabel, monthReviewText, moodPath, prevMonth, nextMonth,
} from './month.js'
import { monthsWithData } from './store.js'
import { tr } from '../chatbot/i18n/features.js'

const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid'
const btn = 'rounded-full px-3.5 py-2 text-[12.5px] font-bold transition'

function Bars({ review, lang }) {
  const geo = useMemo(() => barGeometry(review.series, { width: 640, height: 110, gap: 2 }), [review.series])
  const max = geo[0]?.max || 30
  const best = review.best?.day
  return (
    <svg viewBox="0 0 640 130" className="w-full" role="img"
      aria-label={tr(lang, 'guardian.monthChartLabel')}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="0" x2="640" y1={110 - f * 100} y2={110 - f * 100}
          stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {geo.map((b) => (
        <rect key={b.day} x={b.x} y={110 - b.h} width={b.w} height={Math.max(1.2, b.h)}
          rx="1.5" fill={b.day === best ? '#10b981' : b.minutes === 0 ? '#e2e8f0' : '#6366f1'} />
      ))}
      <line x1="0" x2="640" y1="110.5" y2="110.5" stroke="#cbd5e1" strokeWidth="1" />
      {[1, 8, 15, 22, geo.length].filter((d, i, arr) => arr.indexOf(d) === i).map((d) => (
        <text key={d} x={((d - 1) / Math.max(1, geo.length - 1)) * 632 + 2} y="126"
          fontSize="9" fill="#94a3b8">{d}</text>
      ))}
      <text x="596" y="14" fontSize="10" fill="#94a3b8" textAnchor="end">{max} min</text>
    </svg>
  )
}

function MoodLine({ review }) {
  const segments = useMemo(() => moodPath(review.series, { width: 640, height: 54 }), [review.series])
  if (!segments.length) return null
  return (
    <svg viewBox="0 0 640 60" className="w-full" role="img">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="0" x2="640" y1={(i / 4) * 54} y2={(i / 4) * 54} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {segments.map((seg, i) => (
        <polyline key={i} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round"
          points={seg.map((p) => `${p.x},${p.y}`).join(' ')} />
      ))}
      {segments.flat().map((p) => (
        <circle key={p.day} cx={p.x} cy={p.y} r="2.4" fill="#f43f5e" />
      ))}
      <text x="4" y="8" fontSize="9" fill="#94a3b8">5 😄</text>
      <text x="4" y="58" fontSize="9" fill="#94a3b8">1 😞</text>
    </svg>
  )
}

function Tile({ emoji, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] font-bold text-slate-400">{emoji} {label}</div>
      <div className="text-[19px] font-black text-slate-800">{value}</div>
      {sub && <div className="text-[10.5px] text-slate-400">{sub}</div>}
    </div>
  )
}

export default function MonthlyReview({ lang = 'en', review, months = null, onMonthChange = null }) {
  const [copied, setCopied] = useState(false)
  const list = useMemo(() => months || monthsWithData(), [months])
  const text = useMemo(() => monthReviewText(review, lang), [review, lang])
  const t = review.totals
  const maxWeekday = Math.max(1, ...review.weekdayAvg.map((w) => w.minutes))

  function download(name, content, type) {
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

  return (
    <div className="monthly-review">
      {/* print rules, scoped to this component */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden !important; }
          .monthly-review, .monthly-review * { visibility: visible !important; }
          .monthly-review { position: absolute; left: 0; top: 0; width: 100%; }
          .monthly-review .no-print { display: none !important; }
          .monthly-review .print-card { border-color: #cbd5e1 !important; box-shadow: none !important; }
        }
        .monthly-review .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
      `}</style>

      {/* toolbar (hidden when printing) */}
      <div className="no-print mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-extrabold text-slate-700">📄 {tr(lang, 'guardian.monthReview')}</span>
        {onMonthChange && (
          <span className="flex items-center gap-1.5">
            <button onClick={() => onMonthChange(prevMonth(review.month))}
              className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>←</button>
            <select value={review.month} onChange={(e) => onMonthChange(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]">
              {list.map((m) => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}
            </select>
            <button onClick={() => onMonthChange(nextMonth(review.month))}
              className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>→</button>
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button onClick={() => window.print()} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
            🖨️ {tr(lang, 'guardian.printPdf')}
          </button>
          <button onClick={() => download(`bodhya-month-${review.month}.html`, htmlDoc(review, lang), 'text/html')}
            className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}>
            ⬇️ {tr(lang, 'guardian.downloadHtml')}
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(text).then(() => {
              setCopied(true); setTimeout(() => setCopied(false), 1500)
            }).catch(() => {})}
            className={`${btn} border border-slate-300 text-slate-600 hover:bg-slate-50`}>
            📋 {copied ? tr(lang, 'shield.copied') : tr(lang, 'guardian.copyReport')}
          </button>
        </div>
      </div>

      {/* ---- the report ---- */}
      <div className="print-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              📄 {tr(lang, 'guardian.monthTitle', { month: review.label })}
            </h2>
            <p className="text-[12px] text-slate-500">
              {review.studentName ? `${review.studentName} · ` : ''}
              {tr(lang, 'guardian.monthSub')}
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div>{tr(lang, 'guardian.generated')} {new Date(review.generatedAt).toLocaleDateString()}</div>
            <div>Bodhya · study companion</div>
          </div>
        </div>

        {!t.minutes ? (
          <p className="py-6 text-center text-[13px] text-slate-500">{tr(lang, 'guardian.monthEmpty')}</p>
        ) : (
          <>
            {/* tiles */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 print:grid-cols-3">
              <Tile emoji="⏳" label={tr(lang, 'guardian.focusTime')} value={`${t.hours}h`}
                sub={`${t.activeDays}/${t.daysInMonth} ${tr(lang, 'guardian.daysStudied')}`} />
              <Tile emoji="🔥" label={tr(lang, 'guardian.bestStreak')} value={`${t.bestStreak}`} sub={tr(lang, 'todo.streak')} />
              <Tile emoji="🌳" label={tr(lang, 'forest.title')} value={`${t.treesGrown}`}
                sub={t.treesLost ? `${t.treesLost} 🥀` : tr(lang, 'guardian.allKept')} />
              <Tile emoji="🛡️" label={tr(lang, 'guardian.cleanRate')} value={`${t.cleanRate}%`}
                sub={`${t.cleanSessions}/${t.sessions} ${tr(lang, 'guardian.sessions')}`} />
              <Tile emoji="✅" label={tr(lang, 'todo.title')} value={`${t.tasksDone}`}
                sub={t.tasksDue ? `${t.tasksDueDone}/${t.tasksDue} ${tr(lang, 'guardian.onTime')}` : ''} />
              <Tile emoji="🙂" label={tr(lang, 'journal.avgMood')} value={t.moodDays ? `${t.avgMood}/5` : '—'}
                sub={`${t.moodDays} ${tr(lang, 'guardian.moodDays')}`} />
            </div>

            {/* daily focus */}
            <div className="mt-4">
              <h3 className="mb-1 text-[12.5px] font-extrabold text-slate-700">
                ⏳ {tr(lang, 'guardian.dailyFocus')}
                {review.best ? ` · ${tr(lang, 'guardian.bestDay')}: ${review.best.day} (${review.best.minutes} min)` : ''}
              </h3>
              <Bars review={review} lang={lang} />
            </div>

            {/* mood */}
            {t.moodDays > 1 && (
              <div className="mt-3">
                <h3 className="mb-1 text-[12.5px] font-extrabold text-slate-700">🙂 {tr(lang, 'journal.mood')}</h3>
                <MoodLine review={review} />
              </div>
            )}

            {/* weekday pattern + subjects */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <h3 className="mb-2 text-[12.5px] font-extrabold text-slate-700">🗓️ {tr(lang, 'guardian.weekdayPattern')}</h3>
                <div className="space-y-1">
                  {review.weekdayAvg.map((w) => (
                    <div key={w.weekday} className="flex items-center gap-2">
                      <span className="w-9 text-[11px] font-bold text-slate-500">{WEEKDAYS[lang]?.[w.weekday] || WEEKDAYS.en[w.weekday]}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(w.minutes / maxWeekday) * 100}%` }} />
                      </div>
                      <span className="w-12 text-right text-[10.5px] font-bold text-slate-500">{w.minutes}m</span>
                    </div>
                  ))}
                </div>
                {review.strongestWeekday && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    {tr(lang, 'guardian.strongestDay', {
                      day: WEEKDAYS[lang]?.[review.strongestWeekday.weekday] || review.strongestWeekday.weekday,
                      weak: WEEKDAYS[lang]?.[review.weakestWeekday.weekday] || review.weakestWeekday.weekday,
                    })}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <h3 className="mb-2 text-[12.5px] font-extrabold text-slate-700">📚 {tr(lang, 'guardian.subjects')}</h3>
                {review.subjects.length === 0 ? (
                  <p className="text-[11.5px] text-slate-400">{tr(lang, 'time.noData')}</p>
                ) : (
                  <div className="space-y-1">
                    {review.subjects.map((s) => (
                      <div key={s.subject} className="flex items-center gap-2">
                        <span className="w-24 truncate text-[11.5px] font-bold text-slate-600">{s.subject}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${(s.minutes / Math.max(1, review.subjects[0].minutes)) * 100}%` }} />
                        </div>
                        <span className="w-12 text-right text-[10.5px] font-bold text-slate-500">
                          {Math.round((s.minutes / 60) * 10) / 10}h
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {review.topTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {review.topTags.map((tag) => (
                      <span key={tag.tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-500">
                        #{tag.tag} · {tag.n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* wins + comparison + notes */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <h3 className="mb-1 text-[12.5px] font-extrabold text-emerald-800">🏆 {tr(lang, 'guardian.wins')}</h3>
                {review.wins.length ? (
                  <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-emerald-900">
                    {review.wins.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                ) : (
                  <p className="text-[11.5px] text-emerald-700">{tr(lang, 'guardian.noWins')}</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <h3 className="mb-1 text-[12.5px] font-extrabold text-slate-700">📈 {tr(lang, 'guardian.compare')}</h3>
                {review.previous.deltaPct == null ? (
                  <p className="text-[11.5px] text-slate-400">{tr(lang, 'guardian.noCompare')}</p>
                ) : (
                  <p className="text-[12.5px] text-slate-700">
                    {review.previous.deltaPct >= 0 ? '📈 +' : '📉 '}{review.previous.deltaPct}%
                    {' '}{tr(lang, 'guardian.vsLastMonth', {
                      h: Math.round((review.previous.minutes / 60) * 10) / 10,
                      month: monthLabel(review.previous.month, lang),
                    })}
                  </p>
                )}
                <p className="mt-2 text-[11.5px] text-slate-500">
                  {tr(lang, 'guardian.helperNote')}
                </p>
              </div>
            </div>

            {/* journal entries only if the student shared that section */}
            {review.sharedEntries.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3">
                <h3 className="mb-1 text-[12.5px] font-extrabold text-slate-700">📔 {tr(lang, 'guardian.sharedEntries')}</h3>
                <ul className="space-y-1.5">
                  {review.sharedEntries.map((e) => (
                    <li key={e.day} className="text-[12px] text-slate-700">
                      <strong className="text-slate-500">{e.day}</strong> — {e.text}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[10.5px] italic text-slate-400">{tr(lang, 'guardian.onlyBecauseShared')}</p>
              </div>
            )}
          </>
        )}

        <p className="mt-4 border-t border-slate-200 pt-2 text-[10.5px] text-slate-400">
          {tr(lang, 'guardian.monthFooter')}
        </p>
      </div>
    </div>
  )
}

/** Self-contained printable HTML (no JS, no external assets). */
export function htmlDoc(review, lang = 'en') {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const t = review.totals
  const geo = barGeometry(review.series, { width: 640, height: 110, gap: 2 })
  const bars = geo.map((b) => `<rect x="${b.x}" y="${110 - b.h}" width="${b.w}" height="${Math.max(1.2, b.h)}" rx="1.5" fill="${b.minutes ? '#6366f1' : '#e2e8f0'}" />`).join('')
  const subjects = review.subjects.map((s) => `<div>${esc(s.subject)} — ${Math.round((s.minutes / 60) * 10) / 10}h</div>`).join('')
  const wins = review.wins.map((w) => `<li>${esc(w)}</li>`).join('')
  return `<!doctype html>
<html lang="${esc(lang)}"><head><meta charset="utf-8" />
<title>Bodhya month in review — ${esc(review.label)}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#0f172a}
  h1{font-size:22px;margin:0 0 2px} .muted{color:#64748b;font-size:13px}
  .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}
  .tile{border:1px solid #e2e8f0;border-radius:12px;padding:10px}
  .tile b{display:block;font-size:20px} .tile span{font-size:11px;color:#64748b}
  svg{width:100%} .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0}
  ul{padding-left:18px;font-size:13px} footer{margin-top:18px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:11px;color:#94a3b8}
  @page{size:A4;margin:14mm}
</style></head>
<body>
  <h1>📄 Month in review — ${esc(review.label)}</h1>
  <p class="muted">${esc(review.studentName || '')} · generated ${new Date(review.generatedAt).toLocaleDateString()}</p>
  <div class="tiles">
    <div class="tile"><b>${t.hours}h</b><span>focus · ${t.activeDays}/${t.daysInMonth} days</span></div>
    <div class="tile"><b>🔥 ${t.bestStreak}</b><span>best streak</span></div>
    <div class="tile"><b>🌳 ${t.treesGrown}</b><span>trees (${t.treesLost} lost)</span></div>
    <div class="tile"><b>🛡️ ${t.cleanRate}%</b><span>distraction-free</span></div>
    <div class="tile"><b>✅ ${t.tasksDone}</b><span>tasks done</span></div>
    <div class="tile"><b>🙂 ${t.moodDays ? `${t.avgMood}/5` : '—'}</b><span>average mood</span></div>
  </div>
  <div class="card"><strong>Daily focus</strong><svg viewBox="0 0 640 116">${bars}</svg></div>
  <div class="card"><strong>Subjects</strong>${subjects || '<div class="muted">No subject data</div>'}</div>
  ${wins ? `<div class="card"><strong>Wins</strong><ul>${wins}</ul></div>` : ''}
  <footer>Shared by the student with Bodhya. Read-only. They can revoke it at any time.</footer>
</body></html>`
}
