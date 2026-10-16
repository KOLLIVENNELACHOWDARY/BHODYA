// ---------- Notes Quiz: generate & play quizzes from YOUR notes (offline) ----------
import { useRef, useState } from "react";
import { generateQuiz, detectSections, detectNotesLang } from "../brain/quizgen.js";
import { avatarImg } from "../data/avatars.js";
import { featureBg, FeatureBgDecor } from "../data/featureBackgrounds.jsx";
import { loadState, addXp, updateMemory } from "../brain/memory.js";
import { speak, stopSpeaking, ttsSupported } from "../utils/speech.js";

const UI = {
  en: {
    title: "📄 Notes Quiz",
    sub: "Generate a quiz from your own notes — paste text or upload a file. 100% offline, no API keys.",
    paste: "Paste your notes here…",
    upload: "📂 Upload .txt / .md",
    sample: "✨ Try sample notes",
    topic: "Topic",
    all: "All topics",
    gen: "⚡ Generate quiz",
    warn: "That's a bit short — add at least a few full sentences so I can make good questions.",
    listen: "🔊 Listen",
    stop: "⏹ Stop",
    correct: "✓ Correct!",
    wrong: "✗ Not quite…",
    next: "Next →",
    doneTitle: "Quiz complete! 🎉",
    score: "Your score",
    xp: "XP earned",
    again: "🔄 Try again",
    newNotes: "📝 New notes",
    words: (n) => `${n} words`,
    questions: (n) => `${n} questions from your notes`,
  },
  hi: {
    title: "📄 नोट्स क्विज़",
    sub: "अपने नोट्स से क्विज़ बनाएँ — टेक्स्ट पेस्ट करें या फ़ाइल अपलोड करें। पूरी तरह ऑफ़लाइन, कोई API key नहीं।",
    paste: "अपने नोट्स यहाँ पेस्ट करें…",
    upload: "📂 .txt / .md अपलोड करें",
    sample: "✨ नमूना नोट्स देखें",
    topic: "टॉपिक",
    all: "सभी टॉपिक",
    gen: "⚡ क्विज़ बनाएँ",
    warn: "यह बहुत छोटा है — कुछ पूरे वाक्य और जोड़ें ताकि अच्छे सवाल बन सकें।",
    listen: "🔊 सुनें",
    stop: "⏹ रोकें",
    correct: "✓ सही!",
    wrong: "✗ सही नहीं…",
    next: "आगे →",
    doneTitle: "क्विज़ पूरा! 🎉",
    score: "आपका स्कोर",
    xp: "XP मिला",
    again: "🔄 फिर से",
    newNotes: "📝 नए नोट्स",
    words: (n) => `${n} शब्द`,
    questions: (n) => `${n} सवाल आपके नोट्स से`,
  },
  te: {
    title: "📄 నోట్స్ క్విజ్",
    sub: "మీ నోట్స్ నుంచి క్విజ్ రూపొందించండి — టెక్స్ట్ పేస్ట్ చేయండి లేదా ఫైల్ అప్‌లోడ్ చేయండి. పూర్తి ఆఫ్‌లైన్, API కీలు లేవు.",
    paste: "మీ నోట్స్ ఇక్కడ పేస్ట్ చేయండి…",
    upload: "📂 .txt / .md అప్‌లోడ్",
    sample: "✨ నమూనా నోట్స్",
    topic: "టాపిక్",
    all: "అన్ని టాపిక్‌లు",
    gen: "⚡ క్విజ్ రూపొందించండి",
    warn: "చాలా చిన్నది — కొన్ని పూర్తి వాక్యాలు జోడించండి.",
    listen: "🔊 వినండి",
    stop: "⏹ ఆపు",
    correct: "✓ సరైనది!",
    wrong: "✗ సరికాదు…",
    next: "తదుపరి →",
    doneTitle: "క్విజ్ పూర్తయింది! 🎉",
    score: "మీ స్కోర్",
    xp: "XP సంపాదించారు",
    again: "🔄 మళ్లీ",
    newNotes: "📝 కొత్త నోట్స్",
    words: (n) => `${n} పదాలు`,
    questions: (n) => `${n} ప్రశ్నలు మీ నోట్స్ నుంచి`,
  },
};

const SAMPLE = {
  en: "Photosynthesis: How Plants Make Food\n\nPhotosynthesis is the process by which green plants make their own food. Plants take sunlight, water and carbon dioxide from the environment. Chlorophyll is the green pigment found inside the leaves. The plant produces glucose as its food and releases oxygen into the air. This process happens mainly in the leaves during the daytime.",
  hi: "प्रकाश संश्लेषण: पौधे भोजन कैसे बनाते हैं\n\nप्रकाश संश्लेषण वह प्रक्रिया है जिसमें हरे पौधे अपना भोजन खुद बनाते हैं। पौधे सूर्य का प्रकाश, पानी और कार्बन डाइऑक्साइड लेते हैं। क्लोरोफिल पत्तियों में पाया जाने वाला हरा रंगद्रव्य है। इस प्रक्रिया में पौधा ग्लूकोज़ बनाता है और ऑक्सीजन छोड़ता है। यह प्रक्रिया दिन के समय मुख्य रूप से पत्तियों में होती है।",
  te: "కిరణజన్య సంయోగక్రియ: మొక్కలు ఆహారం ఎలా తయారుచేస్తాయి\n\nకిరణజన్య సంయోగక్రియ అంటే పచ్చి మొక్కలు తమ ఆహారాన్ని తామే తయారు చేసుకునే ప్రక్రియ. మొక్కలు సూర్యకాంతి, నీరు మరియు కార్బన్ డయాక్సైడ్ ను తీసుకుంటాయి. క్లోరోఫిల్ ఆకులలో ఉండే ఆకుపచ్చ వర్ణద్రవ్యం. ఈ ప్రక్రియలో మొక్క గ్లూకోజ్ ను తయారుచేసి ఆక్సిజన్ ను విడుదల చేస్తుంది. ఇది ప్రధానంగా పగటి సమయంలో ఆకులలో జరుగుతుంది.",
};

// --- quiz theme resolution (user preference in profile) ---
function resolveQuizTheme() {
  const p = loadState().profile;
  if (p.quizTheme && p.quizTheme !== "auto") return p.quizTheme;
  return ["pro", "college"].includes(p.ageGroup) ? "professional" : "gamified";
}

// Floating characters & confetti for the gamified theme (uses user's kawaii avatars + fun emojis)
const FUN_CHARS = ["🎮", "⭐", "🔥", "🎯", "💥", "🏆"];
function GamifiedDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {FUN_CHARS.map((c, i) => (
        <span key={i} className="floaty absolute text-3xl opacity-70"
          style={{ left: `${8 + i * 12}%`, top: `${10 + (i % 3) * 30}%`, animationDelay: `${i * 0.5}s` }}>
          {c}
        </span>
      ))}
      <img src={avatarImg(loadState().profile.avatar || "banyan")} alt=""
        className="floaty absolute -right-3 -top-3 h-16 w-16 rounded-full object-cover shadow-lg ring-4 ring-white/40" />
      <img src={avatarImg(loadState().profile.avatar || "banyan")} alt=""
        className="floaty absolute -bottom-3 -left-3 h-14 w-14 rounded-full object-cover shadow-lg ring-4 ring-white/40"
        style={{ animationDelay: "1.4s" }} />
    </div>
  );
}

export default function NotesQuiz({ lang }) {
  const [phase, setPhase] = useState("add"); // add | play | done
  const [text, setText] = useState("");
  const [sections, setSections] = useState([]);
  const [topic, setTopic] = useState("all");
  const [quiz, setQuiz] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [theme, setTheme] = useState(() => resolveQuizTheme());
  const [warning, setWarning] = useState("");
  const fileRef = useRef(null);

  const L = UI[lang] || UI.en;

  function refreshSections(t) {
    setText(t);
    const secs = detectSections(t);
    setSections(secs.length > 1 ? secs : []);
    setTopic("all");
    setWarning("");
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => refreshSections(String(reader.result || ""));
    reader.readAsText(file);
  }

  function generate() {
    const body = topic === "all" ? text : (sections.find((s) => s.title === topic)?.body || text);
    const q = generateQuiz(body, { count: 5 });
    if (q.questions.length === 0) {
      setWarning(L.warn);
      return;
    }
    setQuiz(q);
    setQIdx(0);
    setScore(0);
    setAnswered(false);
    setPicked(null);
    setPhase("play");
  }

  function speakQ() {
    if (!quiz) return;
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const q = quiz.questions[qIdx];
    const textToSpeak = `${q.q}. ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}, ${o}`).join(". ")}`;
    speak(textToSpeak, { lang: quiz.lang || lang }, { onEnd: () => setSpeaking(false) });
    setSpeaking(true);
  }

  function answer(i) {
    if (answered) return;
    const q = quiz.questions[qIdx];
    const correct = i === q.answer;
    setAnswered(true);
    setPicked(i);
    const newScore = score + (correct ? 1 : 0);
    if (correct) addXp(10);
    setScore(newScore);
    setTimeout(() => {
      if (qIdx + 1 >= quiz.questions.length) {
        const mem = loadState().memory;
        updateMemory({ quizzes: mem.quizzes + 1, quizCorrect: mem.quizCorrect + newScore });
        stopSpeaking();
        setSpeaking(false);
        setPhase("done");
      } else {
        setQIdx(qIdx + 1);
        setAnswered(false);
        setPicked(null);
      }
    }, 1200);
  }

  function reset() {
    setPhase("add");
    setTheme(resolveQuizTheme());
    setQuiz(null);
    setWarning("");
    stopSpeaking();
    setSpeaking(false);
  }

  const q = quiz?.questions[qIdx];

  const shellCls =
    theme === "professional"
      ? "border-slate-200 bg-white"
      : "border-transparent bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400";
  const panelCls =
    theme === "professional"
      ? "border border-slate-200 bg-white"
      : "border-2 border-white/50 bg-white/95 backdrop-blur";

  const notesBg = featureBg("notesquiz");
  return (
    <div className="mx-auto max-w-3xl">
      <div className={`relative overflow-hidden rounded-3xl p-5 shadow-lg bg-gradient-to-br ${notesBg.grad} ${shellCls}`}>
        <FeatureBgDecor id="notesquiz" />
        {theme === "gamified" && <GamifiedDecor />}
        <div className="relative z-10">
      <h2 className={`text-xl font-extrabold ${theme === "gamified" ? "text-white drop-shadow" : "text-slate-800"}`}>
        {theme === "gamified" && "🎮 "}{L.title}
      </h2>
      <p className={`mb-4 text-[13px] ${theme === "gamified" ? "text-white/90" : "text-slate-500"}`}>{L.sub}</p>

      {phase === "add" && (
        <div className={`rounded-2xl p-5 shadow-sm ${panelCls}`}>
          <textarea
            value={text}
            onChange={(e) => refreshSections(e.target.value)}
            placeholder={L.paste}
            rows={8}
            className="mb-3 w-full rounded-xl border-[1.5px] border-slate-200 p-3 text-[13.5px] outline-none transition focus:border-emerald-500"
          />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept=".txt,.md,text/plain" onChange={onFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="rounded-full bg-slate-100 px-4 py-2 text-[12.5px] font-bold text-slate-700 transition hover:bg-slate-200">
              {L.upload}
            </button>
            <button onClick={() => refreshSections(SAMPLE[lang] || SAMPLE.en)}
              className="rounded-full bg-amber-50 px-4 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-100">
              {L.sample}
            </button>
            {text.trim() && (
              <span className="text-[11px] font-bold text-slate-400">
                {L.words(text.trim().split(/\s+/).length)}
              </span>
            )}
          </div>

          {sections.length > 0 && (
            <div className="mb-3">
              <label className="mb-1 block text-[12.5px] font-bold text-slate-600">{L.topic}</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-xl border-[1.5px] border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-emerald-500"
              >
                <option value="all">{L.all}</option>
                {sections.map((s) => (
                  <option key={s.title} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          {warning && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-[12.5px] font-bold text-rose-600">{warning}</p>}

          <button onClick={generate} disabled={!text.trim()}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${
              text.trim()
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            }`}>
            {L.gen}
          </button>
        </div>
      )}

      {phase === "play" && quiz && q && (
        <div className={`rounded-2xl p-6 shadow-sm ${panelCls}`}>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
              style={{ width: `${((qIdx + (answered ? 1 : 0)) / quiz.questions.length) * 100}%` }} />
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
              {L.title} · {quiz.title ? quiz.title.slice(0, 28) : ""}
            </span>
            <span className="text-[12px] font-bold text-slate-500">
              {qIdx + 1} / {quiz.questions.length} · 🎯 {score}
            </span>
          </div>
          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-indigo-500">
            {q.type === "tf" ? "✅ True / False" : "✏️ Fill in the blank"}
          </div>
          <h3 className="mb-4 text-[15.5px] font-extrabold leading-relaxed text-slate-800">{q.q}</h3>
          <div className="mb-4 flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              let cls = "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50";
              if (answered) {
                if (i === q.answer) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
                else if (i === picked) cls = "border-rose-400 bg-rose-50 text-rose-700";
                else cls = "border-slate-200 bg-white text-slate-400 opacity-60";
              }
              return (
                <button key={i} onClick={() => answer(i)} disabled={answered}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[13.5px] font-semibold transition ${cls}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-extrabold text-slate-600">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            {answered && (
              <span className={`text-[13px] font-extrabold ${picked === q.answer ? "text-emerald-600" : "text-rose-600"}`}>
                {picked === q.answer ? L.correct : L.wrong}
              </span>
            )}
            {ttsSupported() && (
              <button onClick={speakQ}
                className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold transition ${
                  speaking ? "animate-pulse bg-rose-100 text-rose-600" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}>
                {speaking ? L.stop : L.listen}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "done" && quiz && (
        <div className={`rounded-2xl p-8 text-center shadow-sm ${panelCls}`}>
          <div className="mb-2 text-6xl">{score >= 4 ? "🏆" : score >= 3 ? "🎉" : "💪"}</div>
          <h3 className="mb-1 text-xl font-extrabold text-slate-800">{L.doneTitle}</h3>
          <p className="mb-4 text-[13px] text-slate-500">{L.questions(quiz.questions.length)}</p>
          <div className="mb-2 text-5xl font-black text-emerald-600">
            {score}<span className="text-xl text-slate-400">/{quiz.questions.length}</span>
          </div>
          <p className="mb-6 text-[13px] font-bold text-slate-500">⚡ +{score * 10} XP</p>
          <div className="flex justify-center gap-3">
            <button onClick={reset}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              {L.newNotes}
            </button>
            <button onClick={() => { setQIdx(0); setScore(0); setAnswered(false); setPicked(null); setPhase("play"); }}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700">
              {L.again}
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
