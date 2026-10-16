// ---------- Bodhya CIRCULAR tour: kawaii avatars orbit a wheel of all features ----------
// The user's chosen kawaii mascot glides around a circle of feature nodes
// (each node decorated with a different kawaii avatar), stopping at every
// feature to explain it. Read/listen choice, play/pause, no zooming.
import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n/ui.js";
import { speak, stopSpeaking, ttsSupported } from "../utils/speech.js";
import { AVATARS, avatarImg } from "../data/avatars.js";
import { featureAvatar } from "../data/featureAvatars.js";
import { loadState } from "../brain/memory.js";

const SIZE = 720;
const CX = 360, CY = 360, R = 245;

function nodePos(i, n) {
  const angle = (-90 + (i * 360) / n) * (Math.PI / 180); // start at top, clockwise
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
}

export default function CircularTour({ lang, items = [], onDone, onOpenFeature, autoSpeedMs = 5000 }) {
  const [voicePref, setVoicePref] = useState(null); // null | 'read' | 'listen'
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [visited, setVisited] = useState([]);
  const [finished, setFinished] = useState(false);

  const n = items.length;
  const myAvatar = avatarImg(loadState().profile.avatar || "banyan");
  const pos = useMemo(() => nodePos(idx, n), [idx, n]);
  const item = items[idx];
  const title = item?.title?.[lang] || item?.title?.en || "";
  const desc = item?.desc?.[lang] || item?.desc?.en || "";

  function speakStep(force = false) {
    if (!item) return;
    if (voicePref === "read" && !force) return;
    stopSpeaking();
    setSpeaking(true);
    speak(`${title}. ${desc}`, { lang }, { onEnd: () => setSpeaking(false) });
  }

  function goTo(i) {
    if (i < 0 || i >= n) return;
    stopSpeaking();
    setSpeaking(false);
    setIdx(i);
    setVisited((v) => (v.includes(i) ? v : [...v, i]));
    if (voicePref === "listen") setTimeout(speakStep, 450);
  }

  function next() {
    if (idx >= n - 1) {
      setPlaying(false);
      setFinished(true);
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    goTo(idx + 1);
  }

  function prev() {
    if (idx === 0) return;
    goTo(idx - 1);
  }

  // auto-orbit (only after the user picks read/listen)
  useEffect(() => {
    if (!playing || voicePref === null) return;
    const timer = setTimeout(next, autoSpeedMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, playing, voicePref]);

  // ---------- Read vs Listen choice ----------
  if (voicePref === null) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0d1028]/75 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <img src={myAvatar} alt="Bodhya" className="mx-auto mb-3 h-16 w-16 rounded-full object-cover shadow-lg" />
          <h3 className="mb-2 text-xl font-extrabold text-slate-800">
            {lang === "hi" ? "टूर कैसे लेना चाहेंगे?" : lang === "te" ? "టూర్ ఎలా తీసుకోవాలనుకుంటున్నారు?" : "How would you like the tour?"}
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            {lang === "hi"
              ? "मैं हर फीचर के चारों ओर घूमूँगा — आप खुद पढ़ सकते हैं या मेरी आवाज़ सुन सकते हैं।"
              : lang === "te"
                ? "నేను ప్రతి ఫీచర్ చుట్టూ తిరుగుతాను — మీరే చదవవచ్చు లేదా నా గొంతు వినవచ్చు."
                : "I'll circle around every feature — you can read each one yourself or listen to me."}
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setVoicePref("read")}
              className="rounded-2xl border-2 border-slate-200 px-6 py-4 text-[15px] font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50">
              📖 {lang === "hi" ? "मैं खुद पढ़ूँगा/पढ़ूँगी" : lang === "te" ? "నేనే చదువుతాను" : "I'll read it myself"}
            </button>
            <button onClick={() => setVoicePref("listen")}
              className="rounded-2xl bg-emerald-600 px-6 py-4 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700">
              🔊 {lang === "hi" ? "Bodhya की आवाज़ में सुनूँ" : lang === "te" ? "Bodhya గొంతులో వింటాను" : "Listen to Bodhya"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Finished ----------
  if (finished) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0d1028]/75 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-3 text-6xl">🎉</div>
          <h3 className="mb-2 text-xl font-extrabold text-slate-800">
            {lang === "hi" ? "टूर पूरा हुआ!" : lang === "te" ? "టూర్ పూర్తయింది!" : "Tour complete!"}
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            {lang === "hi"
              ? `अब आप सभी ${n} फीचर्स जान गए हैं। अटकें तो मुझे बुलाइए!`
              : lang === "te"
                ? `ఇప్పుడు మీకు అన్ని ${n} ఫీచర్లు తెలిసాయి. ఇరుక్కుంటే నన్ను పిలవండి!`
                : `You now know all ${n} features. Whenever you're stuck, just call me!`}
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => { setFinished(false); setIdx(0); setPlaying(true); setVisited([]); }}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              🔄 {lang === "hi" ? "फिर से" : lang === "te" ? "మళ్లీ" : "Again"}
            </button>
            <button onClick={onDone}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700">
              {t(lang, "tour.done")} ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (n === 0 || !item) return null;

  const pct = (idx / n) * 100;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#0d1028]/80 backdrop-blur-sm">
      {/* header */}
      <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-5 py-2 backdrop-blur">
        <img src={myAvatar} alt="Bodhya" className="h-7 w-7 rounded-full object-cover ring-2 ring-amber-300" />
        <span className="text-sm font-extrabold text-white">
          {lang === "hi" ? "गोलाकार टूर" : lang === "te" ? "వృత్తాకార టూర్" : "Circular tour"}
        </span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">{idx + 1} / {n}</span>
      </div>

      {/* progress ring */}
      <div className="absolute top-1/2 left-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/10" />
      <div className="absolute top-1/2 left-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, #f59e0b ${pct}%, transparent ${pct}%)`,
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))",
        }} />

      {/* the wheel — each node wears a different kawaii avatar */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative z-10 w-[600px] max-w-[94vw]">
        <defs>
          {items.map((it, i) => (
            <clipPath key={it.id} id={`cn-${it.id}`}>
              <circle cx={nodePos(i, n).x} cy={nodePos(i, n).y} r="34" />
            </clipPath>
          ))}
        </defs>
        {items.map((it, i) => {
          const p = nodePos(i, n);
          const active = i === idx;
          const isVisited = visited.includes(i);
          const nodeImg = featureAvatar(it.id) || AVATARS[i % AVATARS.length].img; // relevant kawaii per feature
          return (
            <g key={it.id} onClick={() => goTo(i)} style={{ cursor: "pointer" }}>
              {active && (
                <circle cx={p.x} cy={p.y} r="30" fill="#fbbf24" opacity="0.35">
                  <animate attributeName="r" from="26" to="40" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={active ? 41 : 36}
                fill="#ffffff" stroke={active ? "#fbbf24" : isVisited ? "#818cf8" : "#4f46e5"}
                strokeWidth={active ? 3.5 : 2} style={{ transition: "all .3s" }} />
              <image href={nodeImg} x={p.x - 33} y={p.y - 33} width="66" height="66"
                clipPath={`url(#cn-${it.id})`} preserveAspectRatio="xMidYMid slice" />
              {isVisited && !active && (
                <text x={p.x + 24} y={p.y - 20} fontSize="15" fontWeight="800" fill="#4ade80">✓</text>
              )}
              {active && (
                <text x={p.x} y={p.y + 58} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fbbf24">
                  {(it.title?.[lang] || it.title?.en || "").slice(0, 16)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* the BOT — user's kawaii avatar orbiting the wheel */}
      <div className="pointer-events-none absolute z-20"
        style={{
          left: `${(pos.x / SIZE) * 100}%`,
          top: `${(pos.y / SIZE) * 100}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 1.1s ease-in-out, top 1.1s ease-in-out",
        }}>
        <img src={myAvatar} alt="Bodhya"
          className="h-16 w-16 rounded-full object-cover shadow-[0_0_28px_rgba(251,191,36,0.85)] ring-4 ring-amber-300" />
        <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-amber-400/30" />
      </div>

      {/* center card */}
      <div className="absolute left-1/2 top-1/2 z-10 w-[290px] max-w-[76vw] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="mb-1 text-3xl">{item.icon}</div>
        <h3 className="mb-1 text-lg font-extrabold text-slate-800">{title}</h3>
        <p className="mb-3 text-[13px] leading-relaxed text-slate-500">{desc}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ttsSupported() && (
            <button onClick={() => (speaking ? (stopSpeaking(), setSpeaking(false)) : speakStep(true))}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                speaking ? "animate-pulse bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}>
              {speaking
                ? "⏹ " + (lang === "hi" ? "रोकें" : lang === "te" ? "ఆపు" : "Stop")
                : "🔊 " + (lang === "hi" ? "सुनें" : lang === "te" ? "వినండి" : "Listen")}
            </button>
          )}
          <button onClick={() => onOpenFeature?.(item.id)}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700">
            🚪 {lang === "hi" ? "फीचर खोलें" : lang === "te" ? "ఫీచర్ తెరవండి" : "Open feature"}
          </button>
        </div>
      </div>

      {/* controls */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 backdrop-blur">
        <button onClick={() => setPlaying(!playing)}
          className="rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-extrabold text-white transition hover:bg-white/30"
          title={lang === "hi" ? "रोकें/चलाएँ" : lang === "te" ? "ఆపు/ప్లే" : "Pause / play"}>
          {playing ? "⏸" : "▶️"}
        </button>
        <button onClick={prev} disabled={idx === 0}
          className="rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-extrabold text-white transition hover:bg-white/30 disabled:opacity-30">
          ←
        </button>
        <span className="px-1 text-xs font-bold text-white">{idx + 1} / {n}</span>
        <button onClick={next}
          className="rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-extrabold text-white transition hover:bg-white/30">
          →
        </button>
        <button onClick={() => { stopSpeaking(); onDone(); }}
          className="rounded-full bg-amber-400 px-3.5 py-1.5 text-sm font-extrabold text-amber-950 transition hover:bg-amber-300">
          ✕ {t(lang, "tour.skip")}
        </button>
      </div>
    </div>
  );
}
