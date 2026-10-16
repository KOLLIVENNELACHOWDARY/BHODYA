// ============================================================
//  Notification Centre — one inbox for alarms, reminders, to-dos,
//  study-plan news, focus blocks and Bodhya's own messages.
//  Tabs: Inbox · Upcoming · Settings. Used full-page (the
//  Notifications tab) and compact (the bell dropdown).
// ============================================================

import { useMemo, useState } from 'react'
import {
  NOTIFS, NOTIF_KINDS, filterItems, markAllRead, markRead, removeNotification,
  clearAllNotifications, clearReadNotifications, snoozeNotification, unreadCount, relativeTime,
} from '../chatbot/brain/notify.js'
import { useStore } from '../chatbot/utils/store.js'
import { openFeature } from '../chatbot/utils/events.js'
import { ALARMS } from '../alarms/store.js'
import { fmtTime, untilText } from '../alarms/logic.js'
import { TODOS, completeTodo } from '../todo-list/store.js'
import { PLAN } from '../study-schedule/store.js'
import { toggleSession, startFocusForSession } from '../study-schedule/store.js'
import { FOCUS } from '../focus/store.js'
import { todaySessions } from '../study-schedule/logic.js'
import { upcomingSummary } from './scheduler.js'
import NotificationPrefs from './NotificationPrefs.jsx'
import { tr } from '../chatbot/i18n/features.js'

const FILTERS = [
  { id: 'all', key: 'notif.filterAll' },
  { id: 'unread', key: 'notif.filterUnread' },
  { id: 'alarms', key: 'notif.filterAlarms' },
  { id: 'reminders', key: 'notif.filterReminders' },
  { id: 'plan', key: 'notif.filterPlan' },
  { id: 'system', key: 'notif.filterSystem' },
]

const SNOOZE_CHOICES = [10, 30, 60]

function dayBucket(ts, now = Date.now()) {
  const d = new Date(ts); const t = new Date(now)
  const sameDay = d.toDateString() === t.toDateString()
  if (sameDay) return 'today'
  const y = new Date(now - 86400000)
  if (d.toDateString() === y.toDateString()) return 'yesterday'
  return 'earlier'
}

function NotifRow({ item, lang, onDone }) {
  const meta = NOTIF_KINDS[item.kind] || NOTIF_KINDS.system
  const [showSnooze, setShowSnooze] = useState(false)
  const isTask = item.kind === 'task' && item.meta?.todoId

  return (
    <div className={`group flex gap-3 rounded-2xl border p-3 transition ${
      item.read ? 'border-slate-200 bg-white/70' : 'border-indigo-200 bg-indigo-50/40'
    }`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base">
        {meta.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <strong className="min-w-0 flex-1 text-[13.5px] leading-snug text-slate-800">{item.title}</strong>
          <span className="shrink-0 text-[11px] font-semibold text-slate-400">{relativeTime(item.createdAt)}</span>
          {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
        </div>
        {item.body && (
          <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-snug text-slate-500">{item.body}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.action?.feature && (
            <button onClick={() => { markRead(item.id); openFeature(item.action.feature, item.action.payload || {}) }}
              className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-indigo-700">
              {tr(lang, 'notif.open')}
            </button>
          )}
          {isTask && (
            <button onClick={() => { onDone(item); }}
              className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-emerald-700">
              ✓ {tr(lang, 'notif.doneBtn')}
            </button>
          )}
          {!item.read && (
            <button onClick={() => markRead(item.id)}
              className="rounded-full border border-slate-300 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 hover:bg-slate-100">
              👁 {tr(lang, 'notif.markAllRead')}
            </button>
          )}
          <button onClick={() => setShowSnooze((v) => !v)}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 hover:bg-slate-100">
            😴 {tr(lang, 'notif.snooze')}
          </button>
          <button onClick={() => removeNotification(item.id)}
            className="rounded-full border border-slate-200 px-2.5 py-1 text-[11.5px] font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            🗑
          </button>
        </div>
        {showSnooze && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SNOOZE_CHOICES.map((m) => (
              <button key={m} onClick={() => { snoozeNotification(item.id, m); setShowSnooze(false) }}
                className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 hover:bg-amber-200">
                {m}m
              </button>
            ))}
            <button onClick={() => { snoozeNotification(item.id, 60 * 12); setShowSnooze(false) }}
              className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-bold text-amber-800 hover:bg-amber-200">
              🌙 {tr(lang, 'common.tomorrow')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NotificationCenter({ lang = 'en', compact = false }) {
  const [tab, setTab] = useState('inbox')
  const [filter, setFilter] = useState('all')
  const state = useStore(NOTIFS)
  useStore(ALARMS); useStore(TODOS); useStore(PLAN); useStore(FOCUS)

  const unread = unreadCount(state)
  const items = useMemo(() => filterItems(state, filter), [state, filter])
  const upcoming = useMemo(() => upcomingSummary(), [state, tab])

  const grouped = useMemo(() => {
    const groups = { today: [], yesterday: [], earlier: [] }
    items.forEach((n) => groups[dayBucket(n.createdAt)].push(n))
    return groups
  }, [items])

  const now = Date.now()
  const quiet = state.settings?.quietHours?.enabled

  function handleDone(item) {
    if (item.meta?.todoId) completeTodo(item.meta.todoId, { source: 'notification' })
    markRead(item.id)
  }

  return (
    <div className={compact ? '' : 'mx-auto max-w-3xl'}>
      {/* header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-xl">🔔</span>
          <h2 className="text-lg font-extrabold text-slate-800">{tr(lang, 'notif.title')}</h2>
          {unread > 0 && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-white">
              {tr(lang, 'notif.unreadCount', { n: unread })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unread > 0 && (
            <button onClick={markAllRead}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-100">
              ✓ {tr(lang, 'notif.markAllRead')}
            </button>
          )}
          <button onClick={clearReadNotifications}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-100">
            {tr(lang, 'notif.clearRead')}
          </button>
          <button onClick={clearAllNotifications}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            {tr(lang, 'notif.clearAll')}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="mb-3 flex gap-1.5">
        {['inbox', 'upcoming', 'settings'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
              tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}>
            {{
              inbox: `📥 ${tr(lang, 'notif.inbox')}`,
              upcoming: `⏭ ${tr(lang, 'notif.upcoming')}`,
              settings: `⚙️ ${tr(lang, 'notif.settings')}`,
            }[t]}
          </button>
        ))}
      </div>

      {quiet && tab !== 'settings' && (
        <div className="mb-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-[12px] font-semibold text-indigo-700">
          🌙 {tr(lang, 'notif.quietActive')}
        </div>
      )}

      {/* INBOX */}
      {tab === 'inbox' && (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const count = f.id === 'unread' ? unread : null
              return (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3 py-1 text-[12px] font-bold transition ${
                    filter === f.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}>
                  {tr(lang, f.key)}{count ? ` · ${count}` : ''}
                </button>
              )
            })}
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
              <div className="mb-1 text-3xl">🎉</div>
              <p className="text-[14px] font-extrabold text-slate-700">{tr(lang, 'notif.empty')}</p>
              <p className="mt-1 text-[12.5px] text-slate-400">{tr(lang, 'notif.emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {['today', 'yesterday', 'earlier'].map((bucket) => grouped[bucket].length > 0 && (
                <div key={bucket}>
                  <h3 className="mb-1.5 px-1 text-[11.5px] font-extrabold uppercase tracking-wide text-slate-400">
                    {{ today: tr(lang, 'common.today'), yesterday: tr(lang, 'todo.sectionTomorrow').replace('Tomorrow', 'Yesterday'), earlier: tr(lang, 'todo.sectionUpcoming') }[bucket]}
                  </h3>
                  <div className="space-y-2">
                    {grouped[bucket].map((n) => <NotifRow key={n.id} item={n} lang={lang} onDone={handleDone} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* UPCOMING */}
      {tab === 'upcoming' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">⏰ {tr(lang, 'notif.nextAlarm')}</h3>
            {upcoming.alarms.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">{tr(lang, 'alarm.noneUpcoming')}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.alarms.map(({ alarm, at }) => (
                  <li key={alarm.id} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-[14px] font-extrabold tabular-nums text-slate-800">
                      {fmtTime(alarm.time, false)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600">{alarm.label}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      {untilText(at - now, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">📘 {tr(lang, 'notif.todaySessions')}</h3>
            {upcoming.sessions.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">{tr(lang, 'plan.allDone')}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.sessions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-[13px] font-extrabold tabular-nums text-slate-700">{s.startTime}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600">
                      {s.subjectName} · {s.minutes} {tr(lang, 'plan.min')}{s.topic ? ` · ${s.topic}` : ''}
                    </span>
                    <button onClick={() => startFocusForSession(s.id)}
                      className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-indigo-700">
                      ⏳ {tr(lang, 'plan.startThis')}
                    </button>
                    <button onClick={() => toggleSession(s.id)}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-[11.5px] font-bold text-slate-600 hover:bg-white">
                      ✓
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">✅ {tr(lang, 'notif.dueTodos')}</h3>
            {upcoming.todos.length === 0 ? (
              <p className="text-[12.5px] text-slate-400">{tr(lang, 'notif.allRead')}</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.todos.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">{t.title}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      {t.due || tr(lang, 'todo.noDate')}{t.dueTime ? ` ${t.dueTime}` : ''}
                    </span>
                    <button onClick={() => completeTodo(t.id, { source: 'upcoming' })}
                      className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-emerald-700">
                      ✓ {tr(lang, 'notif.doneBtn')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!compact && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-[13.5px] font-extrabold text-slate-800">⏳ {tr(lang, 'focus.title')}</h3>
              {upcoming.focus ? (
                <p className="text-[13px] text-slate-600">
                  {upcoming.focus.subject || tr(lang, 'focus.subject')} · {upcoming.focus.minutes} {tr(lang, 'plan.min')}
                </p>
              ) : (
                <button onClick={() => openFeature('focus')}
                  className="rounded-full bg-indigo-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-indigo-700">
                  ⏳ {tr(lang, 'focus.start')}
                </button>
              )}
            </section>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && <NotificationPrefs lang={lang} />}
    </div>
  )
}
