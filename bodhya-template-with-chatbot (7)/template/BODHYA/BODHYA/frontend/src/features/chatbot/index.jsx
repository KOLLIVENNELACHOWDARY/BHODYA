// ============================================================
//  Bodhya — offline guide assistant (feature module)
//  Mount anywhere in the template with:
//    <BodhyaAssistant context={currentPage} onNavigate={go} />
//  Or open the chat from anywhere with:
//    window.dispatchEvent(new CustomEvent('bodhya:open'))
// ============================================================
import { useEffect, useRef, useState } from 'react'
import ChatPanel from './components/ChatPanel.jsx'
import IdleNudge from './components/IdleNudge.jsx'
import Onboarding from './components/Onboarding.jsx'
import Tour from './components/Tour.jsx'
import CircularTour from './components/CircularTour.jsx'
import LevelUpCelebration from './components/LevelUpCelebration.jsx'
import { loadState, updateProfile, touchActive } from './brain/memory.js'
import Agent from './agent/Agent.jsx'
import { avatarImg } from './data/avatars.js'
import { t } from './i18n/ui.js'

export { think } from './brain/engine.js'
export { speak, stopSpeaking, ttsSupported, sttSupported } from './utils/speech.js'
export { evaluateNudge, IDLE_NUDGE_MS, PAGE_NUDGE_MS, NUDGE_COOLDOWN_MS } from './utils/nudge.js'
export { loadState, updateProfile, addTask, addXp } from './brain/memory.js'
export { TOUR_STEPS } from './data/tourSteps.js'

export default function BodhyaAssistant({
  context = 'home',
  onNavigate,          // (pageId) => void — e.g. 'quiz' | 'planner' | 'progress' | 'settings'
  skipOnboarding = false,
  ageGroupOverride = null,  // from template's AgeContext, if available
  langOverride = null,      // from template's language setting, if available
  tourItems = null          // circular tour: [{id, icon, title:{...}, desc:{...}}] — all features
}) {
  const [boot] = useState(() => loadState())
  const [profile, setProfile] = useState(boot.profile)
  const [chatOpen, setChatOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [nudge, setNudge] = useState(null)

  // Template integration: respect external age/language if provided
  useEffect(() => {
    if (ageGroupOverride) updateProfile({ ageGroup: ageGroupOverride })
    if (langOverride) updateProfile({ lang: langOverride })
  }, [ageGroupOverride, langOverride])

  const lang = profile.lang || 'en'

  // mark this visit
  useEffect(() => { touchActive() }, [])

  // Let any page in the template open the chat: window.dispatchEvent(new CustomEvent('bodhya:open'))
  useEffect(() => {
    const onOpen = () => setChatOpen(true)
    window.addEventListener('bodhya:open', onOpen)
    return () => window.removeEventListener('bodhya:open', onOpen)
  }, [])

  // open the chat with an agent-initiated message
  function openChatWith(text) {
    setChatOpen(true)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bodhya:chat-message', { detail: { text } }))
    }, 350)
  }

  function handleAction(action) {
    if (action === 'openQuiz') onNavigate?.('quiz')
    if (action === 'startTour') setTourOpen(true)
    if (action === 'refreshPlanner') onNavigate?.('planner')
  }

  function handleNudge(action, kind) {
    // tell the agent what happened (dismissals make it back off)
    window.dispatchEvent(new CustomEvent('bodhya:nudge-action', { detail: { kind, action } }))
    setNudge(null)
    if (action === 'stuck') openChatWith("I'm stuck")
    else if (action === 'tour') setTourOpen(true)
    else if (action === 'chat') setChatOpen(true)
    // 'no' → just dismiss; agent remembers and waits longer next time
  }

  return (
    <>
      {/* The AGENT: senses the user and reactively runs tasks (tour, nudges, chat) */}
      <Agent
        lang={lang}
        context={context}
        onboarded={profile.onboarded}
        tourDone={profile.tourDone}
        tourOpen={tourOpen}
        nudgeVisible={!!nudge}
        onStartTour={() => setTourOpen(true)}
        onShowNudge={(kind) => setNudge(kind)}
        onOpenChatWith={openChatWith}
      />

      {/* Kawaii level-up celebration (fires from any quiz via bodhya:levelup) */}
      <LevelUpCelebration lang={lang} />

      {/* Floating action button */}
      <button
        data-tour="chatbot"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label={t(lang, 'chat.open')}
        className="fixed bottom-6 right-6 z-[60] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-[27px] text-white shadow-xl shadow-emerald-500/50 transition hover:scale-105"
      >
        {chatOpen ? (
          '✕'
        ) : (
          <img
            src={avatarImg(loadState().profile.avatar || 'banyan')}
            alt="Bodhya"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70"
          />
        )}
        <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-emerald-400/30" />
      </button>

      {/* Chat */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} context={context} onAction={handleAction} />

      {/* Idle nudge */}
      {nudge && profile.onboarded && !tourOpen && (
        <IdleNudge lang={lang} kind={nudge} onAction={handleNudge} />
      )}

      {/* Onboarding */}
      {!profile.onboarded && !skipOnboarding && (
        <Onboarding
          onDone={() => {
            setProfile({ ...loadState().profile })
            setTourOpen(true)
          }}
        />
      )}

      {/* Guided tour — map-path travel around all features (or classic step tour) */}
      {profile.onboarded && tourOpen && (
        tourItems ? (
          <CircularTour
            lang={lang}
            items={tourItems}
            onDone={() => {
              updateProfile({ tourDone: true })
              setProfile({ ...loadState().profile })   // keeps the tour one-time
              setTourOpen(false)
            }}
            onOpenFeature={(id) => { setTourOpen(false); onNavigate?.(id); }}
          />
        ) : (
          <Tour
            lang={lang}
            onRequestChat={(open) => setChatOpen(open)}
            onNavigate={(id) => onNavigate?.(id)}
            currentTab={context}
            onDone={() => { updateProfile({ tourDone: true }); setTourOpen(false) }}
          />
        )
      )}
    </>
  )
}
