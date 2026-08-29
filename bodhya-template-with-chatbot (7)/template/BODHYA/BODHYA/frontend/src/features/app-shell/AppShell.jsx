// ---------- App shell: sidebar tabs + main area + Bodhya assistant ----------
import { useEffect, useState } from "react";
import { TABS, STATUS } from "./tabConfig.js";
import { avatarImg } from "../chatbot/data/avatars.js";
import { featureAvatar } from "../chatbot/data/featureAvatars.js";
import { featureBg, FeatureBgDecor } from "../chatbot/data/featureBackgrounds.jsx";
import { loadState } from "../chatbot/brain/memory.js";
import ProfileSettings from "../chatbot/components/ProfileSettings.jsx";
import NotesQuiz from "../chatbot/components/NotesQuiz.jsx";
import BodhyaAssistant from "../chatbot/index.jsx";

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

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("home");
  const [profileTick, setProfileTick] = useState(0);
  const [boot, setBoot] = useState(() => loadState());
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
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className={`flex-1 bg-gradient-to-br p-6 transition-colors ${featureBg(activeTab).grad}`} data-active-tab={activeTab}>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-800">
            {active.icon} {active.title[lang] || active.title.en}
          </h1>
          <button
            data-tour="helpchip"
            onClick={() => window.dispatchEvent(new CustomEvent("bodhya:open"))}
            className="rounded-full bg-amber-400 px-4 py-2 text-xs font-extrabold text-amber-950 shadow-md shadow-amber-400/30 transition hover:bg-amber-300"
          >
            🆘 Need help?
          </button>
        </div>
        {activeTab === "profile" ? (
          <ProfileSettings onSaved={() => { setBoot(loadState()); setProfileTick((t) => t + 1); }} />
        ) : activeTab === "notesquiz" ? (
          <NotesQuiz lang={lang} />
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
