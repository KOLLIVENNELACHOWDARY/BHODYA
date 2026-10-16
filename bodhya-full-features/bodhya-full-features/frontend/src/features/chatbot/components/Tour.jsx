// ---------- Bodhya guided tour (Tailwind): step list + manual pace + optional voice ----------
// The tour shows a step list on the left (like a menu of all features), highlights
// the current element, and lets the USER control the pace (no auto-advance).
// Voice: nothing is read aloud unless the user taps the 🔊 Listen button.
import { useEffect, useMemo, useState } from "react";
import { TOUR_STEPS } from "../data/tourSteps.js";
import { t } from "../i18n/ui.js";
import { speak, stopSpeaking, ttsSupported } from "../utils/speech.js";
import { loadState } from "../brain/memory.js";
import { avatarImg } from "../data/avatars.js";

export default function Tour({
  lang,
  onDone,
  onRequestChat,
  onNavigate,
  currentTab,
}) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const [speakingStep, setSpeakingStep] = useState(null); // step index currently spoken
  const [panelOpen, setPanelOpen] = useState(true);
  const [voicePref, setVoicePref] = useState(null); // null = ask once | 'read' | 'listen'

  const visible = useMemo(
    () =>
      TOUR_STEPS.filter((s) =>
        s.tab
          ? !!document.querySelector(`[data-tab="${s.tab}"]`)
          : s.openChat
            ? true
            : !!document.querySelector(s.target)
      ),
    []
  );

  const step = visible[Math.min(idx, visible.length - 1)];
  const copy = step ? (step[lang] || step.en) : null;

  function speakStep(i, force = false) {
    const s = visible[i];
    const c = s ? (s[lang] || s.en) : null;
    if (!c) return;
    if (voicePref === "read" && !force) return; // user chose to read
    stopSpeaking();
    setSpeakingStep(i);
    speak(`${c.title}. ${c.text}`, { lang }, {
      onEnd: () => setSpeakingStep(null),
    });
  }

  function stopStepVoice() {
    stopSpeaking();
    setSpeakingStep(null);
  }

  function goTo(i) {
    if (i < 0 || i >= visible.length) return;
    stopStepVoice();
    setRect(null);
    setIdx(i);
  }

  function next() {
    if (idx >= visible.length - 1) {
      stopStepVoice();
      onDone();
      return;
    }
    goTo(idx + 1);
  }

  function prev() {
    goTo(idx - 1);
  }

  // 1) Navigate to the step's tab (if different), then measure the target
  useEffect(() => {
    if (!step) return;
    if (step.tab && step.tab !== currentTab) {
      setRect(null);
      onNavigate?.(step.tab);
      return; // wait for currentTab to change, effect re-runs
    }
    const sel = step.tab ? `[data-tab="${step.tab}"]` : step.target;
    const el = document.querySelector(sel);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    if (step.openChat) onRequestChat?.(true);
    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const timer = setTimeout(measure, step.openChat ? 500 : 300);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, currentTab]);

  // 2) When a step changes, auto-read ONLY if the user chose "listen" mode
  useEffect(() => {
    if (voicePref === "listen" && rect && copy) {
      const timer = setTimeout(() => speakStep(idx, true), 450);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, rect, voicePref]);

  // 3) First visit: ask how they want the tour — read or listen
  if (voicePref === null && step && rect) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0d1028]/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <img src={avatarImg(loadState().profile.avatar || "banyan")} alt="Bodhya" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-lg" />
          <h3 className="mb-2 text-xl font-extrabold text-slate-800">
            {lang === "hi" ? "टूर कैसे लेना चाहेंगे?" : lang === "te" ? "టూర్ ఎలా తీసుకోవాలనుకుంటున్నారు?" : "How would you like the tour?"}
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            {lang === "hi"
              ? "आप खुद पढ़ सकते हैं, या Bodhya की आवाज़ में सुन सकते हैं।"
              : lang === "te"
                ? "మీరే చదవవచ్చు, లేదా Bodhya గొంతులో వినవచ్చు."
                : "You can read each step yourself, or listen to Bodhya read it aloud."}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { setVoicePref("read"); }}
              className="rounded-2xl border-2 border-slate-200 px-6 py-4 text-[15px] font-bold text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50"
            >
              📖 {lang === "hi" ? "मैं खुद पढ़ूँगा/पढ़ूँगी" : lang === "te" ? "నేనే చదువుతాను" : "I'll read it myself"}
            </button>
            <button
              onClick={() => { setVoicePref("listen"); }}
              className="rounded-2xl bg-indigo-600 px-6 py-4 text-[15px] font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700"
            >
              🔊 {lang === "hi" ? "Bodhya की आवाज़ में सुनूँ" : lang === "te" ? "Bodhya గొంతులో వింటాను" : "Listen to Bodhya"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!step || !copy || !rect) return null;

  const isSpeaking = speakingStep === idx;
  const below = rect.top + rect.height + 180 < window.innerHeight;
  const tipStyle = below
    ? { top: rect.top + rect.height + 14 }
    : { bottom: window.innerHeight - rect.top + 14 };

  return (
    <div className="fixed inset-0 z-[90]">
      {/* spotlight highlight */}
      {rect && (
        <div
          className="fixed z-[91] rounded-xl border-[2.5px] border-amber-500 transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow:
              "0 0 0 9999px rgba(13,16,40,0.66), 0 0 0 3px rgba(245,158,11,0.9), 0 0 30px 10px rgba(245,158,11,0.4)",
          }}
        />
      )}

      {/* STEP LIST — left panel (like the reference format) */}
      {panelOpen && (
        <div className="fixed left-4 top-4 z-[93] flex max-h-[calc(100vh-140px)] w-64 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-extrabold text-slate-800">
              {lang === "hi" ? "🗺️ टूर स्टेप्स" : lang === "te" ? "🗺️ టూర్ స్టెప్స్" : "🗺️ Tour steps"}
            </span>
            <button
              onClick={() => setPanelOpen(false)}
              className="rounded-lg px-2 py-0.5 text-xs font-bold text-slate-400 hover:bg-slate-100"
              title={lang === "hi" ? "पैनल छुपाएँ" : lang === "te" ? "ప్యానెల్ దాచు" : "Hide panel"}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {visible.map((s, i) => {
              const c = s[lang] || s.en;
              const active = i === idx;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12.5px] font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold"
                    style={{ background: active ? "rgba(255,255,255,0.25)" : "#eef2ff", color: active ? "#fff" : "#4f46e5" }}>
                    {i + 1}
                  </span>
                  <span className="shrink-0 text-sm">{s.icon}</span>
                  <span className="truncate">{c.title}</span>
                  {active && <span className="ml-auto text-[10px]">📍</span>}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button
              onClick={() => setPanelOpen(true)}
              className="hidden"
            />
            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400">
              {idx + 1} / {visible.length}
            </div>
          </div>
        </div>
      )}

      {/* TOOLTIP CARD */}
      <div className="fixed z-[92] max-w-[340px] rounded-2xl bg-white p-5 shadow-2xl" style={tipStyle}>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700">
            {step.icon} {idx + 1} {t(lang, "tour.of")} {visible.length}
          </span>
          {ttsSupported() && (
            <button
              onClick={() => (isSpeaking ? stopStepVoice() : speakStep(idx, true))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold transition ${
                isSpeaking
                  ? "bg-rose-100 text-rose-600 animate-pulse"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {isSpeaking ? "⏹ " + (lang === "hi" ? "रोकें" : lang === "te" ? "ఆపు" : "Stop") : "🔊 " + (lang === "hi" ? "सुनें" : lang === "te" ? "వినండి" : "Listen")}
            </button>
          )}
        </div>
        <h3 className="mb-1.5 text-base font-extrabold text-slate-800">{copy.title}</h3>
        <p className="text-[13.5px] text-slate-500">{copy.text}</p>
        <div className="mt-3.5 flex items-center justify-between gap-2.5">
          <button
            onClick={prev}
            disabled={idx === 0}
            className={`rounded-xl border px-3.5 py-2 text-[13px] font-bold transition ${
              idx === 0
                ? "cursor-not-allowed border-slate-100 text-slate-300"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            ← {t(lang, "tour.prev")}
          </button>
          <button
            onClick={next}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-700"
          >
            {idx >= visible.length - 1 ? t(lang, "tour.done") : t(lang, "tour.next")} →
          </button>
        </div>
        <div className="mt-2.5 text-center">
          <button
            onClick={() => { stopStepVoice(); onDone(); }}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
          >
            {t(lang, "tour.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
