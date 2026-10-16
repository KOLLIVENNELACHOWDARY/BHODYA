// ============================================================
//  Toast stack — the little pop-up cards Bodhya shows when
//  something happens (reminder, task due, plan ready…). They are
//  actionable: open the feature, snooze, or tick the task off
//  right here.
// ============================================================

import { useEffect, useState } from 'react'
import { on, EVT, openFeature } from '../chatbot/utils/events.js'
import { snoozeNotification } from '../chatbot/brain/notify.js'
import { NOTIF_KINDS } from '../chatbot/brain/notify.js'
import { completeTodo } from '../todo-list/store.js'
import { loadState } from '../chatbot/brain/memory.js'
import { avatarImg } from '../chatbot/data/avatars.js'
import { tr } from '../chatbot/i18n/features.js'

const MAX = 3
const LIFETIME = { alarm: 20000, default: 9000 }

export default function ToastStack() {
  const [items, setItems] = useState([])
  const lang = loadState().profile?.lang || 'en'
  const avatar = avatarImg(loadState().profile?.avatar || 'banyan')

  useEffect(() => on(EVT.toast, ({ item }) => {
    if (!item) return
    setItems((list) => [item, ...list.filter((x) => x.id !== item.id)].slice(0, MAX))
    const life = LIFETIME[item.kind] || LIFETIME.default
    setTimeout(() => setItems((list) => list.filter((x) => x.id !== item.id)), life)
  }), [])

  function dismiss(id) {
    setItems((list) => list.filter((x) => x.id !== id))
  }

  function handleOpen(item) {
    const feature = item.action?.feature
    if (feature) openFeature(feature, item.action?.payload || {})
    dismiss(item.id)
  }

  function handleSnooze(item) {
    snoozeNotification(item.id, 10)
    dismiss(item.id)
  }

  function handleDone(item) {
    const todoId = item.meta?.todoId
    if (todoId) completeTodo(todoId, { source: 'toast' })
    dismiss(item.id)
  }

  if (!items.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[85] flex w-[352px] max-w-[calc(100vw-24px)] flex-col gap-2.5">
      {items.map((item) => {
        const meta = NOTIF_KINDS[item.kind] || NOTIF_KINDS.system
        const isAlarm = item.kind === 'alarm'
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto overflow-hidden rounded-2xl border bg-white/95 p-3.5 shadow-2xl backdrop-blur animate-[slideUp_0.25s_ease] ${
              isAlarm ? 'border-rose-300 ring-2 ring-rose-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                isAlarm ? 'bg-rose-100' : 'bg-slate-100'
              }`}>
                {isAlarm ? '⏰' : meta.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <strong className="min-w-0 flex-1 text-[13.5px] leading-snug text-slate-800">{item.title}</strong>
                  <button onClick={() => dismiss(item.id)} aria-label="Dismiss"
                    className="-mr-1 -mt-1 rounded-lg px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100">✕</button>
                </div>
                {item.body && (
                  <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-snug text-slate-500 line-clamp-3">
                    {item.body}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.action?.feature && (
                    <button onClick={() => handleOpen(item)}
                      className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-indigo-700">
                      {tr(lang, 'notif.open')}
                    </button>
                  )}
                  {item.meta?.todoId && (
                    <button onClick={() => handleDone(item)}
                      className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-emerald-700">
                      ✓ {tr(lang, 'notif.doneBtn')}
                    </button>
                  )}
                  {!isAlarm && (
                    <button onClick={() => handleSnooze(item)}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 hover:bg-slate-100">
                      😴 {tr(lang, 'notif.snooze')} 10m
                    </button>
                  )}
                </div>
              </div>
              <img src={avatar} alt="" className="mt-0.5 hidden h-7 w-7 rounded-full object-cover ring-2 ring-white sm:block" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
