// ---------- Kawaii level-up celebration: fires when XP levels the user up ----------
import { useEffect, useRef, useState } from "react";
import { AVATARS, avatarImg } from "../data/avatars.js";
import { loadState } from "../brain/memory.js";
import { LEVEL_NAMES } from "../brain/responses.js";

const CONFETTI = ["🎉", "⭐", "✨", "🎊", "💖", "🌟", "🎈", "🌈"];

export default function LevelUpCelebration({ lang }) {
  const [level, setLevel] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const onLevel = (e) => {
      setLevel(e.detail?.level || loadState().memory.level);
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4200);
    };
    window.addEventListener("bodhya:levelup", onLevel);
    return () => {
      window.removeEventListener("bodhya:levelup", onLevel);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible || !level) return null;

  const state = loadState();
  const myImg = avatarImg(state.profile.avatar || "banyan");
  const levelName = LEVEL_NAMES[level]?.[lang] || LEVEL_NAMES[level]?.en || "";
  const mascots = AVATARS.slice(0, 6);

  return (
    <div className="pointer-events-none fixed inset-0 z-[99] flex items-center justify-center overflow-hidden">
      {/* confetti rain */}
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} className="confetti-piece"
          style={{
            left: `${(i * 137) % 100}%`,
            fontSize: `${14 + (i % 3) * 8}px`,
            animationDelay: `${(i % 10) * 0.18}s`,
            animationDuration: `${2.6 + (i % 5) * 0.4}s`,
          }}>
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}

      {/* center card */}
      <div className="pointer-events-auto relative flex flex-col items-center rounded-[2rem] bg-white/95 px-10 py-8 text-center shadow-2xl backdrop-blur">
        {/* floating mascot crew */}
        {mascots.map((m, i) => (
          <img key={m.id} src={m.img} alt=""
            className="floaty absolute h-12 w-12 rounded-full object-cover shadow-lg ring-2 ring-amber-200"
            style={{ left: `${-40 + i * 34}%`, top: i % 2 === 0 ? "-30%" : "78%", animationDelay: `${i * 0.4}s` }} />
        ))}

        <div className="mb-1 text-5xl">🎉</div>
        <div className="mb-1 text-[12px] font-extrabold uppercase tracking-widest text-amber-500">
          {lang === "hi" ? "लेवल अप!" : lang === "te" ? "లెవల్ అప్!" : "Level up!"}
        </div>
        <div className="flex items-center gap-3">
          <img src={myImg} alt="Bodhya" className="h-14 w-14 rounded-full object-cover ring-4 ring-amber-300 shadow-lg" />
          <div className="text-6xl font-black text-emerald-600">{level}</div>
          <div className="text-left text-[13px] font-bold text-slate-600">
            {levelName}
            <div className="text-[11px] font-semibold text-slate-400">
              ⚡ {loadState().memory.xp} XP
            </div>
          </div>
        </div>
        <p className="mt-3 text-[13px] font-semibold text-slate-500">
          {lang === "hi"
            ? "क्या शानदार! इसी तरह आगे बढ़ते रहिए! 🌟"
            : lang === "te"
              ? "అద్భుతం! ఇలాగే కొనసాగించండి! 🌟"
              : "Amazing! Keep going, superstar! 🌟"}
        </p>
      </div>
    </div>
  );
}
