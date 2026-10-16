// ============================================================
//  Notification bell — the badge you tap anywhere in the app.
//  Shows the unread count and opens a compact version of the
//  Notification Centre, with a link to the full tab.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { NOTIFS, unreadCount } from '../chatbot/brain/notify.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import NotificationCenter from './NotificationCenter.jsx'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

export default function NotificationBell({ lang = null, className = '' }) {
  const [open, setOpen] = useState(false)
  const state = useStore(NOTIFS)
  const wrapRef = useRef(null)
  const unread = unreadCount(state)
  const L = lang || loadState().profile?.lang || 'en'

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        data-tour="bell"
        onClick={() => setOpen((v) => !v)}
        aria-label={tr(L, 'notif.title')}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
          open ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10.5px] font-extrabold text-white shadow">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[80] mt-2 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-2xl">
          <div className="max-h-[min(70vh,560px)] overflow-y-auto pr-0.5">
            <NotificationCenter lang={L} compact />
          </div>
          <button
            onClick={() => { setOpen(false); openFeature('notifications') }}
            className="mt-2 w-full rounded-xl bg-slate-800 py-2 text-[12.5px] font-bold text-white hover:bg-slate-900"
          >
            {tr(L, 'common.viewAll')} →
          </button>
        </div>
      )}
    </div>
  )
}
