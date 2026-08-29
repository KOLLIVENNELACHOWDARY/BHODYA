// ---------- Bodhya profile settings: pick your avatar + name + tone ----------
import { useState } from "react";
import { AVATARS, avatarImg } from "../data/avatars.js";
import { featureAvatar } from "../data/featureAvatars.js";
import { loadState, updateProfile } from "../brain/memory.js";
import { TONES } from "../i18n/ui.js";

export default function ProfileSettings({ onSaved }) {
  const state = loadState();
  const [avatar, setAvatar] = useState(state.profile.avatar || "banyan");
  const [name, setName] = useState(state.profile.name || "");
  const [tone, setTone] = useState(state.profile.tone || "auto");
  const [quizTheme, setQuizTheme] = useState(state.profile.quizTheme || "auto");
  const [saved, setSaved] = useState(false);
  const lang = state.profile.lang || "en";

  function pickAvatar(id) {
    setAvatar(id);
    updateProfile({ avatar: id });
    window.dispatchEvent(new CustomEvent("bodhya:profile-changed"));
    onSaved?.();
  }

  function save() {
    updateProfile({ name: name.trim(), tone, quizTheme });
    window.dispatchEvent(new CustomEvent("bodhya:profile-changed"));
    onSaved?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const L = lang;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Avatar picker */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          {featureAvatar("profile") && (
            <img src={featureAvatar("profile")} alt="Avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-200" />
          )}
          <img src={avatarImg(avatar)} alt="Bodhya" className="h-8 w-8 rounded-full object-cover" />
          <h3 className="text-lg font-extrabold text-slate-800">
            {L === "hi" ? "अपना अवतार चुनें" : L === "te" ? "మీ అవతార్ ఎంచుకోండి" : "Choose your avatar"}
          </h3>
        </div>
        <p className="mb-4 text-[13px] text-slate-500">
          {L === "hi"
            ? "Bodhya हर जगह आपके चुने हुए अवतार में दिखेगा — चैट, टूर और याद दिलाने में।"
            : L === "te"
              ? "Bodhya మీరు ఎంచుకున్న అవతార్ లో ప్రతిచోటా కనిపిస్తుంది — చాట్, టూర్, రిమైండర్లలో."
              : "Bodhya will appear as your chosen mascot everywhere — chat, tour and reminders."}
        </p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {AVATARS.map((a) => {
            const active = avatar === a.id;
            return (
              <button
                key={a.id}
                onClick={() => pickAvatar(a.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${
                  active
                    ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-200"
                    : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                }`}
              >
                <img src={a.img} alt={a.label.en} className="h-14 w-14 rounded-full object-cover" />
                <span className="text-[11px] font-bold text-slate-700">{a.label[L] || a.label.en}</span>
                <span className="text-[9.5px] text-slate-400">{a.meaning[L] || a.meaning.en}</span>
                {active && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-extrabold text-white">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + tone */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-extrabold text-slate-800">
          {L === "hi" ? "प्रोफ़ाइल" : L === "te" ? "ప్రొఫైల్" : "Profile"}
        </h3>
        <label className="mb-1 block text-[13px] font-bold text-slate-600">
          {L === "hi" ? "आपका नाम" : L === "te" ? "మీ పేరు" : "Your name"}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={L === "hi" ? "आपका नाम…" : L === "te" ? "మీ పేరు…" : "Your name…"}
          className="mb-4 w-full rounded-xl border-[1.5px] border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500"
        />
        <label className="mb-2 block text-[13px] font-bold text-slate-600">
          {L === "hi" ? "चैट का अंदाज़" : L === "te" ? "చాట్ ధోరణి" : "Chat tone"}
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(TONES).map(([id, tn]) => (
            <button
              key={id}
              onClick={() => setTone(id)}
              className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition ${
                tone === id
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tn.emoji} {tn.label[L] || tn.label.en}
            </button>
          ))}
        </div>
        <label className="mb-2 block text-[13px] font-bold text-slate-600">
          {L === "hi" ? "क्विज़ की थीम" : L === "te" ? "క్విజ్ థీమ్" : "Quiz theme"}
        </label>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: "auto", icon: "✨", label: { en: "Auto", hi: "ऑटो", te: "ఆటో" }, desc: { en: "Matches your age group", hi: "उम्र के हिसाब से", te: "వయస్సు ప్రకారం" } },
            { id: "professional", icon: "💼", label: { en: "Professional", hi: "प्रोफेशनल", te: "ప్రొఫెషనల్" }, desc: { en: "Clean & decent", hi: "साफ़-सुथरा", te: "శుభ్రంగా" } },
            { id: "gamified", icon: "🎮", label: { en: "Gamified", hi: "गेमिफाइड", te: "గేమిఫైడ్" }, desc: { en: "Fun characters & colors", hi: "मज़ेदार कैरेक्टर", te: "సరదా క్యారెక్టర్లు" } },
          ].map((th) => (
            <button key={th.id} onClick={() => setQuizTheme(th.id)}
              className={`flex flex-col items-start gap-0.5 rounded-2xl border-2 px-4 py-2.5 transition ${
                quizTheme === th.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
              }`}>
              <span className="text-[13px] font-extrabold text-slate-800">{th.icon} {th.label[L] || th.label.en}</span>
              <span className="text-[10.5px] text-slate-400">{th.desc[L] || th.desc.en}</span>
            </button>
          ))}
        </div>
        <button
          onClick={save}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700"
        >
          {saved
            ? (L === "hi" ? "सेव हो गया ✓" : L === "te" ? "సేవ్ అయింది ✓" : "Saved ✓")
            : (L === "hi" ? "सेव करें" : L === "te" ? "సేవ్ చేయండి" : "Save")}
        </button>
      </div>
    </div>
  );
}
