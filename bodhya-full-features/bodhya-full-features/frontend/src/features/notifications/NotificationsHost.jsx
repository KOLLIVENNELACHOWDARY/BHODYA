// ============================================================
//  NotificationsHost — mount ONCE at app level. It runs the
//  scheduler heartbeat, catches up on alarms missed while the
//  tab was closed, and renders the global overlays (ring screen
//  + toasts). Everything else in the app just pushes to the
//  notification store.
// ============================================================

import { useEffect } from 'react'
import { tick } from './scheduler.js'
import { catchUpMissed } from '../alarms/store.js'
import AlarmRing from './AlarmRing.jsx'
import ToastStack from './ToastStack.jsx'
import { on, EVT } from '../chatbot/utils/events.js'
import ShieldOverlay from '../focus-shield/ShieldOverlay.jsx'
import { UrgeOverlay } from '../focus-shield/FocusShield.jsx'
import { noteHidden, noteVisible, shieldArmed } from '../focus-shield/store.js'
import { catchUpTree } from '../study-forest/store.js'
import { journalState } from '../journal/store.js'
import { FOCUS } from '../focus/store.js'
import { catchUpDaily } from '../chatbot/brain/memory.js'
import { pushNotification } from '../chatbot/brain/notify.js'
import { loadState } from '../chatbot/brain/memory.js'
import { tr } from '../chatbot/i18n/features.js'

const TICK_MS = 5000

export default function NotificationsHost() {
  useEffect(() => {
    const lang = loadState().profile?.lang || 'en'
    // alarms / tasks that were due while the tab was closed
    catchUpMissed(new Date())
    const missed = catchUpDaily()
    if (missed?.isNewDay) {
      pushNotification({
        kind: 'system',
        title: `👋 ${missed.greeting}`,
        body: tr(lang, 'notif.emptyHint'),
        silent: true,
      })
      if (missed.streak) {
        pushNotification({
          kind: 'streak',
          title: `🔥 ${missed.streak}-day streak — day ${missed.streak + 1} starts now`,
          body: tr(lang, 'focus.tipText'),
          silent: true,
          action: { feature: 'focus' },
        })
      }
    }

    // a tree only lives while you stay in the app
    catchUpTree(new Date())

    // yesterday's journal entry: offer a one-line summary in the morning
    const jState = journalState(new Date())
    if (jState.stats.streak > 0 && !jState.stats.todayWritten && new Date().getHours() < 12) {
      pushNotification({
        kind: 'journal',
        title: `📔 ${jState.stats.streak}-day writing streak`,
        body: 'One line today keeps it alive — the prompts are already picked from your data.',
        silent: true,
        action: { feature: 'journal' },
      })
    }

    // the focus-shield guard: every "escape" during a study block is recorded
    const onVisibility = () => {
      if (document.hidden) {
        noteHidden(Date.now())
      } else {
        noteVisible(Date.now())
        tick(new Date())        // catch up the moment we are visible again
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // closing the tab while a tree grows is quitting the session
    const onBeforeUnload = (e) => {
      const armed = shieldArmed()
      const growing = FOCUS.read().active?.treeId
      if (armed && growing) {
        e.preventDefault()
        e.returnValue = 'Your tree will wither if you leave now.'
        return e.returnValue
      }
      return undefined
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    tick(new Date())
    const iv = setInterval(() => tick(new Date()), TICK_MS)

    // re-check immediately after any feature changes something
    const offs = [
      on(EVT.alarmChanged, () => tick(new Date())),
      on(EVT.todoChanged, () => tick(new Date())),
    ]

    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
      offs.forEach((off) => off())
    }
  }, [])

  return (
    <>
      <AlarmRing />
      <ShieldOverlay />
      <UrgeOverlay />
      <ToastStack />
    </>
  )
}
