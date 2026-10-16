// ============================================================
//  ShieldOverlay — the "you just came back" moment.
//
//  Mounted once at app level. When the session guard notices you
//  left the app during a focus block / tree, this panel appears
//  with a calm, non-preachy choice:
//      back to study · I needed a break · stop the session
//  In strict mode it also tells you the tree did not make it.
// ============================================================

import { useEffect, useState } from 'react'
import { on, EVT, openFeature } from '../chatbot/utils/events.js'
import { resolveUrge, shieldState, startUrge } from './store.js'
import { formatAway } from './logic.js'
import { FOCUS } from '../focus/store.js'
import { stopFocus } from '../focus/store.js'
import { loadState } from '../chatbot/brain/memory.js'
import { avatarImg } from '../chatbot/data/avatars.js'
import { tr } from '../chatbot/i18n/features.js'

export default function ShieldOverlay() {
  const [event, setEvent] = useState(null)
  const lang = loadState().profile?.lang || 'en'
  const avatar = avatarImg(loadState().profile?.avatar || 'banyan')

  useEffect(() => on(EVT.distractionDetected, (detail) => {
    if (!detail || detail.level === 'ok') return
    setEvent(detail)
  }), [])

  useEffect(() => {
    // a fresh session clears any stale overlay
    const off = on(EVT.focusChanged, (d) => { if (d.started) setEvent(null) })
    return off
  }, [])

  if (!event) return null
  const st = shieldState()
  const tree = st.tree
  const withered = !!event.treeWithered
  const active = FOCUS.read().active
  const tone = withered ? 'rose' : event.level === 'fail' ? 'amber' : 'sky'

  const palette = {
    rose: { ring: 'ring-rose-200', chip: 'bg-rose-100 text-rose-700', btn: 'bg-rose-600 hover:bg-rose-700' },
    amber: { ring: 'ring-amber-200', chip: 'bg-amber-100 text-amber-800', btn: 'bg-amber-500 hover:bg-amber-600' },
    sky: { ring: 'ring-sky-200', chip: 'bg-sky-100 text-sky-700', btn: 'bg-sky-600 hover:bg-sky-700' },
  }[tone]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl ring-4 ${palette.ring}`}>
        <img src={avatar} alt="Bodhya" className="mx-auto h-16 w-16 rounded-full object-cover shadow ring-2 ring-white" />

        <div className={`mt-3 inline-block rounded-full px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-wide ${palette.chip}`}>
          {withered ? tr(lang, 'shield.overlayWithered') : tr(lang, 'shield.overlayBack')}
        </div>

        <h2 className="mt-2 text-xl font-extrabold text-slate-800">
          {withered ? '🥀 ' : '🚪 '}
          {tr(lang, 'shield.overlayAway', { time: formatAway(event.awayMs) })}
        </h2>

        <p className="mt-1 text-[13px] leading-snug text-slate-500">
          {withered
            ? tr(lang, 'shield.overlayWitheredBody')
            : event.level === 'fail'
              ? tr(lang, 'shield.overlayFailBody', { n: event.escapes })
              : tr(lang, 'shield.overlayWarnBody')}
        </p>

        {tree && !withered && (
          <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[12.5px] font-bold text-emerald-800">
            🌱 {tr(lang, 'shield.treeStillAlive')}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {active && !withered && (
            <button
              onClick={() => { setEvent(null); openFeature('focus') }}
              className={`w-full rounded-2xl py-3 text-[14px] font-extrabold text-white shadow-lg ${palette.btn}`}>
              📚 {tr(lang, 'shield.backToStudy')}
            </button>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => { resolveUrge('break', { minutes: 5 }); setEvent(null) }}
              className="rounded-full bg-amber-100 px-3.5 py-2 text-[12.5px] font-bold text-amber-900 hover:bg-amber-200">
              ☕ {tr(lang, 'shield.urgeFiveMin')}
            </button>
            <button
              onClick={() => { startUrge(); setEvent(null) }}
              className="rounded-full border border-slate-300 px-3.5 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50">
              🫁 {tr(lang, 'shield.urgeButton')}
            </button>
            {active && (
              <button
                onClick={() => { stopFocus({ reason: 'shield-stop' }); setEvent(null) }}
                className="rounded-full border border-slate-300 px-3.5 py-2 text-[12.5px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                ⏹ {tr(lang, 'focus.stop')}
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          {tr(lang, 'shield.overlayFooter', { n: event.escapes })}
        </p>
      </div>
    </div>
  )
}
