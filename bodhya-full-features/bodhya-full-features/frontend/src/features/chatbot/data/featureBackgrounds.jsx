// ---------- Kawaii backgrounds per feature: themed gradient + floating deco ----------
// Each feature page gets its own soft kawaii backdrop with floating emojis.

export const FEATURE_BG = {
  home:       { grad: "from-emerald-50 via-teal-50 to-white",        deco: ["🏠", "🌷", "☀️", "🦋"] },
  quiz:       { grad: "from-violet-50 via-fuchsia-50 to-white",      deco: ["🎮", "⭐", "🎯", "💥"] },
  notesquiz:  { grad: "from-amber-50 via-yellow-50 to-white",        deco: ["📄", "✏️", "📝", "🌟"] },
  tests:      { grad: "from-sky-50 via-blue-50 to-white",            deco: ["📝", "✏️", "🎓", "☁️"] },
  planner:    { grad: "from-rose-50 via-pink-50 to-white",           deco: ["📅", "⏰", "🌼", "📌"] },
  todo:       { grad: "from-teal-50 via-emerald-50 to-white",        deco: ["✅", "🗒️", "🌱", "✏️"] },
  time:       { grad: "from-yellow-50 via-amber-50 to-white",        deco: ["⏱️", "🕐", "⏳", "✨"] },
  knowledge:  { grad: "from-indigo-50 via-violet-50 to-white",       deco: ["🗺️", "🌟", "🔗", "💎"] },
  tutor:      { grad: "from-cyan-50 via-sky-50 to-white",            deco: ["💬", "🤖", "💡", "🌊"] },
  revision:   { grad: "from-purple-50 via-fuchsia-50 to-white",      deco: ["🧠", "💡", "🎴", "⭐"] },
  rag:        { grad: "from-orange-50 via-amber-50 to-white",        deco: ["📂", "🔍", "📄", "🧲"] },
  rooms:      { grad: "from-pink-50 via-rose-50 to-white",           deco: ["👥", "💬", "🌸", "🌈"] },
  rewards:    { grad: "from-yellow-50 via-orange-50 to-white",       deco: ["🏆", "🔥", "⭐", "🎖️"] },
  reviews:    { grad: "from-lime-50 via-green-50 to-white",          deco: ["⭐", "💖", "🌟", "🍀"] },
  safety:     { grad: "from-blue-50 via-indigo-50 to-white",         deco: ["🔒", "🛡️", "💙", "🕊️"] },
  profile:    { grad: "from-fuchsia-50 via-pink-50 to-white",        deco: ["🎨", "🖌️", "🌈", "✨"] },
};

export function featureBg(id) {
  return FEATURE_BG[id] || { grad: "from-slate-50 to-white", deco: ["✨", "🌟"] };
}

export function FeatureBgDecor({ id }) {
  const bg = featureBg(id);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {bg.deco.map((e, i) => (
        <span key={i} className="floaty absolute opacity-40"
          style={{ left: `${6 + i * 22}%`, top: `${8 + (i % 3) * 26}%`, fontSize: `${20 + (i % 3) * 10}px`, animationDelay: `${i * 0.6}s` }}>
          {e}
        </span>
      ))}
    </div>
  );
}
