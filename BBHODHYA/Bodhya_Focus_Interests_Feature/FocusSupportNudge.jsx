import React from "react";

const ACTION_COPY = {
  tiny_step: { en: "Try a 2-minute step", hi: "2 मिनट का छोटा कदम", te: "2 నిమిషాల చిన్న పని" },
  interest_example: { en: "Use my interests", hi: "मेरी रुचियों से जोड़ें", te: "నా ఆసక్తులతో చెప్పు" },
  quick_reset: { en: "Take a quick reset", hi: "छोटा ब्रेक लें", te: "చిన్న విరామం తీసుకోండి" },
  change_format: { en: "Try another format", hi: "दूसरा तरीका आज़माएँ", te: "మరో విధానం ప్రయత్నించండి" },
  continue: { en: "Keep going", hi: "जारी रखें", te: "కొనసాగించండి" },
  dismiss: { en: "Not now", hi: "अभी नहीं", te: "ఇప్పుడు వద్దు" },
};

export default function FocusSupportNudge({ nudge, lang = "en", onAction, onDismiss }) {
  if (!nudge) return null;
  const label = (item) => item?.[lang] || item?.en || item;
  const actions = (nudge.actions || ["tiny_step", "dismiss"]).filter((id) => id !== "dismiss");
  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Bodhya focus support"
      className="fixed bottom-5 right-5 z-[90] w-[min(92vw,390px)] rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"
    >
      <div className="mb-2 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">🌱</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-slate-800">{nudge.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">{nudge.message}</p>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss focus prompt" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button>
      </div>
      <div className="mb-3 rounded-xl bg-emerald-50 p-3">
        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">An idea connected to your interests</p>
        <p className="mt-1 text-sm text-emerald-950">{nudge.subjectExample}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((id) => (
          <button key={id} onClick={() => onAction(id, nudge)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
            {label(ACTION_COPY[id]) || id.replaceAll("_", " ")}
          </button>
        ))}
        <button onClick={onDismiss} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200">
          {label(ACTION_COPY.dismiss)}
        </button>
      </div>
    </aside>
  );
}
