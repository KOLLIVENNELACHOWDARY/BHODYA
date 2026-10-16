// ---------- App shell: sidebar tabs + main area + Bodhya assistant ----------
import { useEffect, useMemo, useState } from "react";
import { TABS, STATUS } from "./tabConfig.js";
import { avatarImg } from "../chatbot/data/avatars.js";
import { featureAvatar } from "../chatbot/data/featureAvatars.js";
import { featureBg, FeatureBgDecor } from "../chatbot/data/featureBackgrounds.jsx";
import { loadState } from "../chatbot/brain/memory.js";
import ProfileSettings from "../chatbot/components/ProfileSettings.jsx";
import NotesQuiz from "../chatbot/components/NotesQuiz.jsx";
import BodhyaAssistant from "../chatbot/index.jsx";
import NotificationBell from "../notifications/NotificationBell.jsx";
import NotificationCenter from "../notifications/NotificationCenter.jsx";
import AlarmCenter from "../alarms/AlarmCenter.jsx";
import TodoList from "../todo-list/TodoList.jsx";
import StudySchedule from "../study-schedule/StudySchedule.jsx";
import FocusTimer from "../focus/FocusTimer.jsx";
import TimeTracking from "../time-tracking/TimeTracking.jsx";
import MusicPanel from "../music/MusicPanel.jsx";
import StudyForest from "../study-forest/StudyForest.jsx";
import FocusShield from "../focus-shield/FocusShield.jsx";
import JournalPanel from "../journal/JournalPanel.jsx";
import GuardianPanel from "../guardian/GuardianPanel.jsx";
import GuardianGuest from "../guardian/GuardianGuest.jsx";
import HomeDashboard from "./HomeDashboard.jsx";
import { TODOS } from "../todo-list/store.js";
import { NOTIFS, unreadCount } from "../chatbot/brain/notify.js";
import { ALARMS } from "../alarms/store.js";
import { PLAN } from "../study-schedule/store.js";
import { FOREST } from "../study-forest/store.js";
import { SHIELD } from "../focus-shield/store.js";
import { JOURNAL } from "../journal/store.js";
import { GUARDIAN } from "../guardian/store.js";
import { EVT } from "../chatbot/utils/events.js";
import { todaySessions } from "../study-schedule/logic.js";

// badge helpers — live counts for the sidebar
const openTodoCount = () => TODOS.read().items.filter((t) => !t.done).length;
const unreadNotifications = () => unreadCount(NOTIFS.read());
const enabledAlarmCount = () => ALARMS.read().alarms.filter((a) => a.enabled).length;
const todayPlanCount = () => todaySessions(PLAN.read().sessions, new Date()).filter((s) => !s.done).length;
const growingTree = () => (FOREST.read().alive ? 1 : 0);
const journalDueToday = () => {
  const day = new Date();
  const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return JOURNAL.read().entries.some((e) => e.day === key) ? 0 : 1;
};
const guardianPending = () => (GUARDIAN.read().grant?.active ? 0 : 0);
const escapeCount = () => {
  const day = new Date().toDateString();
  return SHIELD.read().log.filter((e) => e.type === 'escape' && new Date(e.at).toDateString() === day).length;
};

function FeaturePage({ tab, lang }) {
  const c = tab || TABS[0];
  const bg = featureBg(c.id);
  return (
    <div className={`relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br p-10 text-center shadow-sm ${bg.grad}`}>
      <FeatureBgDecor id={c.id} />
      <div className="relative z-10 flex flex-col items-center">
        {featureAvatar(c.id) ? (
          <img src={featureAvatar(c.id)} alt={c.title.en} className="mb-4 h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-white/70" />
        ) : (
          <div className="mb-4 text-6xl">{c.icon}</div>
        )}
        <h2 className="mb-2 text-2xl font-extrabold text-slate-800">
          {c.title[lang] || c.title.en}
        </h2>
        <p className="mb-4 max-w-md text-slate-500">{c.desc[lang] || c.desc.en}</p>
        <span className="mb-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          {STATUS[lang] || STATUS.en}
        </span>
        <p className="mb-5 text-xs text-slate-400">{c.owner}</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("bodhya:open"))}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700"
        >
          🤖 Ask Bodhya about this tab
        </button>
      </div>
    </div>
  );
}

// a guardian can be handed a link like  …/#guardian-view=<token>
function readGuestToken() {
  if (typeof window === "undefined") return null;
  return (window.location.hash.match(/guardian-view=([A-Za-z0-9_-]+)/) || [])[1] || null;
}

export default function AppShell() {
  // The route is decided once, at mount, and only changed by real navigation.
  // (Recomputing it on every render let an unrelated re-render while a guest
  // link sat in the URL flip the student's own session into the report view.)
  const [guestToken, setGuestToken] = useState(readGuestToken);
  useEffect(() => {
    const onHash = () => setGuestToken(readGuestToken());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const [activeTab, setActiveTab] = useState(guestToken ? "guardianGuest" : "home");
  const [profileTick, setProfileTick] = useState(0);
  const [boot, setBoot] = useState(() => loadState());
  const [featurePayload, setFeaturePayload] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  const [focusPrefill, setFocusPrefill] = useState(null);
  const lang = boot.profile.lang || "en";
  const avatar = avatarImg(boot.profile.avatar || "banyan");
  const active = TABS.find((t) => t.id === activeTab) || TABS[0];

  // refresh when the profile changes (avatar picked in the Profile tab)
  useEffect(() => {
    const onProfile = () => {
      setBoot(loadState());
      setProfileTick((t) => t + 1);
    };
    window.addEventListener("bodhya:profile-changed", onProfile);
    return () => window.removeEventListener("bodhya:profile-changed", onProfile);
  }, []);

  // any feature (chat, notification, alarm, toast…) can deep-link into a tab
  useEffect(() => {
    const onOpenFeature = (e) => {
      const { id, payload } = e.detail || {};
      if (!id) return;
      setActiveTab(id);
      setFeaturePayload(payload || null);
      if (id === "focus") setFocusPrefill(payload || {});
    };
    window.addEventListener("bodhya:open-feature", onOpenFeature);
    return () => window.removeEventListener("bodhya:open-feature", onOpenFeature);
  }, []);

  // keep sidebar badges fresh when any feature changes
  useEffect(() => {
    const names = [EVT.todoChanged, EVT.notifyChanged, EVT.planChanged, EVT.alarmChanged, EVT.focusChanged, EVT.forestChanged, EVT.shieldChanged, EVT.musicChanged, EVT.journalChanged, EVT.guardianChanged];
    const bump = () => setLiveTick((t) => t + 1);
    names.forEach((n) => window.addEventListener(n, bump));
    return () => names.forEach((n) => window.removeEventListener(n, bump));
  }, []);

  // sidebar badges: pending work at a glance
  const badges = useMemo(() => {
    void profileTick; void liveTick;
    return {
      todo: openTodoCount(),
      notifications: unreadNotifications(),
      alarms: enabledAlarmCount(),
      planner: todayPlanCount(),
      forest: growingTree(),
      shield: escapeCount(),
      journal: journalDueToday(),
      guardian: guardianPending(),
    };
  }, [activeTab, profileTick, featurePayload, liveTick]);

  // A guardian who opens a shared link sees the read-only report and nothing
  // else — no sidebar, no notification bell, no help button, no Bodhya chat.
  // The hooks above always run, so the rules of hooks stay satisfied.
  if (guestToken) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <GuardianGuest token={guestToken} lang={lang} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 will-change-transform">
      {/* Sidebar — every feature is a tab */}
      <aside
        data-tour="sidebar"
        className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto bg-slate-900 px-3 py-4 text-slate-300"
      >
        <div className="mb-4 flex items-center gap-2.5 px-2">
          <img src={avatar} alt="Bodhya" className="h-9 w-9 shrink-0 rounded-full object-cover shadow-md ring-2 ring-emerald-400/60" />
          <div>
            <div className="text-sm font-extrabold leading-tight text-white">
              AI Learning Companion
            </div>
            <div className="text-[10px] font-semibold text-emerald-300/90">
              Bodhya · बोध्य = ज्ञान · वटवृक्ष
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="truncate">{tab.title[lang] || tab.title.en}</span>
              {badges[tab.id] > 0 && (
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === tab.id ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                }`}>
                  {badges[tab.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className={`flex-1 bg-gradient-to-br p-6 transition-colors ${featureBg(activeTab).grad}`} data-active-tab={activeTab}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-slate-800">
            {active.icon} {active.title[lang] || active.title.en}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell lang={lang} />
            <button
              data-tour="helpchip"
              onClick={() => window.dispatchEvent(new CustomEvent("bodhya:open"))}
              className="rounded-full bg-amber-400 px-4 py-2 text-xs font-extrabold text-amber-950 shadow-md shadow-amber-400/30 transition hover:bg-amber-300"
            >
              🆘 Need help?
            </button>
          </div>
        </div>

        {activeTab === "guardianGuest" ? (
          <GuardianGuest token={guestToken} lang={lang} />
        ) : activeTab === "home" ? (
          <HomeDashboard lang={lang} onNavigate={setActiveTab} />
        ) : activeTab === "profile" ? (
          <ProfileSettings onSaved={() => { setBoot(loadState()); setProfileTick((t) => t + 1); }} />
        ) : activeTab === "notesquiz" ? (
          <NotesQuiz lang={lang} />
        ) : activeTab === "planner" ? (
          <StudySchedule lang={lang} />
        ) : activeTab === "todo" ? (
          <TodoList lang={lang} focusId={featurePayload?.focus || null} />
        ) : activeTab === "alarms" ? (
          <AlarmCenter lang={lang} />
        ) : activeTab === "notifications" ? (
          <NotificationCenter lang={lang} />
        ) : activeTab === "focus" ? (
          <FocusTimer lang={lang} prefill={focusPrefill} />
        ) : activeTab === "time" ? (
          <TimeTracking lang={lang} />
        ) : activeTab === "music" ? (
          <MusicPanel lang={lang} />
        ) : activeTab === "forest" ? (
          <StudyForest lang={lang} />
        ) : activeTab === "shield" ? (
          <FocusShield lang={lang} />
        ) : activeTab === "journal" ? (
          <JournalPanel lang={lang} />
        ) : activeTab === "guardian" ? (
          <GuardianPanel lang={lang} />
        ) : (
          <FeaturePage tab={active} lang={lang} />
        )}
      </main>

      {/* Bodhya — chat FAB + idle nudges + onboarding + guided circular tour */}
      <BodhyaAssistant
        key={profileTick}
        context={activeTab}
        onNavigate={setActiveTab}
        tourItems={TABS}
      />
    </div>
  );
}
