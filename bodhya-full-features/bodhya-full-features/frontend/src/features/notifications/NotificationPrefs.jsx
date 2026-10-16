// ============================================================
//  Notification settings — master switch, sound, quiet hours,
//  per-category toggles, phone notifications, digest time and
//  the "smart reminder" schedule. Re-used on the Notifications
//  tab and inside Profile settings.
// ============================================================

import { useState } from 'react'
import {
  NOTIFS, updateNotifSettings, requestOSPermission, osPermission, osSupported,
  testNotification, inQuietHours,
} from '../chatbot/brain/notify.js'
import { useStore } from '../chatbot/utils/store.js'
import { SOUNDS, playSound } from '../chatbot/utils/sound.js'
import { SCHED, setSchedulerSettings } from './scheduler.js'
import { tr } from '../chatbot/i18n/features.js'

export function Switch({ checked, onChange, label, hint, emoji }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left transition hover:bg-slate-50">
      <span className="flex-1">
        <span className="block text-[13.5px] font-bold text-slate-700">{emoji ? `${emoji} ` : ''}{label}</span>
        {hint && <span className="block text-[11.5px] leading-snug text-slate-400">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'rounded-lg border border-slate-300 px-2.5 py-1.5 text-[13px] text-slate-700 outline-none focus:border-indigo-500'

export default function NotificationPrefs({ lang = 'en', showSmartSchedule = true }) {
  const { settings } = useStore(NOTIFS, (s) => ({ settings: s.settings }))
  const { settings: sched } = useStore(SCHED, (s) => ({ settings: s.settings }))
  const [osState, setOsState] = useState(() => osPermission())
  const quiet = inQuietHours(settings)

  const set = (patch) => updateNotifSettings(patch)
  const setCat = (kind, value) => set({ categories: { [kind]: value } })
  const setSched = (patch) => setSchedulerSettings(patch)

  async function enableOS() {
    const res = await requestOSPermission()
    setOsState(res)
    if (res === 'granted') set({ osNotifications: true })
  }

  const permText = {
    granted: tr(lang, 'notif.osGranted'),
    denied: tr(lang, 'notif.osDenied'),
    unsupported: tr(lang, 'notif.osUnsupported'),
    default: tr(lang, 'notif.osEnable'),
  }[osState] || ''

  return (
    <div className="space-y-4">
      {quiet && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-[12.5px] font-semibold text-indigo-700">
          🌙 {tr(lang, 'notif.quietActive')}
        </div>
      )}

      {/* master + feel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 text-[14px] font-extrabold text-slate-800">🔔 {tr(lang, 'notif.title')}</h3>
        <Switch emoji="🔔" label={tr(lang, 'notif.master')} hint={tr(lang, 'notif.masterDesc')}
          checked={settings.master} onChange={(v) => set({ master: v })} />
        <Switch emoji="💬" label={tr(lang, 'notif.toasts')} checked={settings.toasts} onChange={(v) => set({ toasts: v })} />
        <Switch emoji="🔊" label={tr(lang, 'notif.sound')} checked={settings.sound} onChange={(v) => set({ sound: v })} />
        {settings.sound && (
          <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3">
            <div className="flex flex-wrap gap-1.5">
              {SOUNDS.map((s) => (
                <button key={s.id} onClick={() => { set({ soundName: s.id }); playSound(s.id, settings.volume) }}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition ${
                    settings.soundName === s.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}>
                  {s.emoji} {s.label[lang] || s.label.en}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600">
              {tr(lang, 'notif.volume')}
              <input type="range" min="0" max="1" step="0.05" value={settings.volume}
                onChange={(e) => set({ volume: Number(e.target.value) })}
                onMouseUp={() => playSound(settings.soundName, settings.volume)}
                className="flex-1 accent-indigo-600" />
              <span className="w-9 text-right tabular-nums">{Math.round(settings.volume * 100)}%</span>
            </label>
          </div>
        )}
        <Switch emoji="📳" label={tr(lang, 'notif.vibrate')} checked={settings.vibration} onChange={(v) => set({ vibration: v })} />
      </section>

      {/* quiet hours */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <Switch emoji="🌙" label={tr(lang, 'notif.quiet')} hint={tr(lang, 'notif.quietDesc')}
          checked={settings.quietHours.enabled} onChange={(v) => set({ quietHours: { enabled: v } })} />
        {settings.quietHours.enabled && (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <Field label={tr(lang, 'notif.quietFrom')}>
              <input type="time" className={inputCls} value={settings.quietHours.from}
                onChange={(e) => set({ quietHours: { from: e.target.value } })} />
            </Field>
            <Field label={tr(lang, 'notif.quietTo')}>
              <input type="time" className={inputCls} value={settings.quietHours.to}
                onChange={(e) => set({ quietHours: { to: e.target.value } })} />
            </Field>
          </div>
        )}
      </section>

      {/* categories */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-[14px] font-extrabold text-slate-800">🎛️ {tr(lang, 'notif.categories')}</h3>
        <div className="grid gap-1 sm:grid-cols-2">
          {['alarm', 'reminder', 'task', 'plan', 'focus', 'forest', 'shield', 'music', 'journal', 'streak', 'level', 'digest', 'system'].map((kind) => (
            <Switch key={kind}
              emoji={{ alarm: '⏰', reminder: '🔔', task: '✅', plan: '📅', focus: '⏳', streak: '🔥', level: '🏆', digest: '📋', system: '🤖', forest: '🌳', shield: '🛡️', music: '🎵', journal: '📔' }[kind]}
              label={tr(lang, `notif.cat.${kind}`)}
              checked={settings.categories[kind] !== false}
              onChange={(v) => setCat(kind, v)} />
          ))}
        </div>
      </section>

      {/* phone notifications */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 text-[14px] font-extrabold text-slate-800">📱 {tr(lang, 'notif.os')}</h3>
        <p className="mb-2 text-[12px] text-slate-500">{tr(lang, 'notif.osDesc')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={enableOS} disabled={!osSupported()}
            className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold transition ${
              osState === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } disabled:opacity-50`}>
            {permText}
          </button>
          {osState === 'granted' && (
            <Switch label={tr(lang, 'notif.os')} checked={settings.osNotifications}
              onChange={(v) => set({ osNotifications: v })} />
          )}
        </div>
      </section>

      {/* digest + smart schedule */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-[14px] font-extrabold text-slate-800">📋 {tr(lang, 'notif.digest')}</h3>
        <Switch label={tr(lang, 'notif.digest')} hint={tr(lang, 'notif.digestDesc')}
          checked={settings.digest.enabled} onChange={(v) => set({ digest: { enabled: v } })} />
        {settings.digest.enabled && (
          <Field label={tr(lang, 'notif.digestTime')}>
            <input type="time" className={inputCls} value={settings.digest.time}
              onChange={(e) => set({ digest: { time: e.target.value } })} />
          </Field>
        )}

        {showSmartSchedule && (
          <>
            <h4 className="mb-1 mt-3 text-[13px] font-extrabold text-slate-700">🧠 Smart reminders</h4>
            <Field label="Warn before a plan session (min)">
              <input type="number" min="0" max="60" className={inputCls} value={sched.planLeadMinutes}
                onChange={(e) => setSched({ planLeadMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Evening task check-in">
              <input type="time" className={inputCls} value={sched.taskReminderTime}
                onChange={(e) => setSched({ taskReminderTime: e.target.value })} />
            </Field>
            <Field label="Streak protection">
              <input type="time" className={inputCls} value={sched.streakNudgeTime}
                onChange={(e) => setSched({ streakNudgeTime: e.target.value })} />
            </Field>
            <Field label="End-of-day rollover">
              <select className={inputCls} value={sched.rolloverHour}
                onChange={(e) => setSched({ rolloverHour: Number(e.target.value) })}>
                {[18, 19, 20, 21, 22, 23].map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </Field>
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => testNotification(settings)}
          className="rounded-full bg-amber-400 px-4 py-2 text-[12.5px] font-extrabold text-amber-950 hover:bg-amber-300">
          🔔 {tr(lang, 'notif.test')}
        </button>
        <button onClick={() => set({ quietHours: { enabled: !settings.quietHours.enabled } })}
          className="rounded-full border border-slate-300 px-4 py-2 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50">
          🌙 {settings.quietHours.enabled ? tr(lang, 'common.disable') : tr(lang, 'common.enable')}
        </button>
      </div>
    </div>
  )
}
