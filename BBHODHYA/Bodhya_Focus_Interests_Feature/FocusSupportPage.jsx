import React, { useMemo, useState } from "react";
import { useFocusSupport } from "./FocusSupportContext.js";
import { INTERESTS } from "./focusSupportLogic.js";

const LABELS = {
  en: {
    eyebrow: "Focus & Interests", title: "Let's make studying work for you", intro: "Bodhya can offer a gentle nudge or a more interesting example when you ask for help or when a study session goes quiet.",
    optin: "Enable focus support", privacy: "Only in-session browser signals are used. No webcam, microphone, emotion detection, or monitoring of other apps. Prompts stay on this device; you can turn this off any time.",
    interests: "What do you enjoy?", hint: "Choose a few interests so examples feel more relevant.", idle: "Nudge after inactivity", quiet: "Quiet time between nudges", minutes: "minutes", start: "Start focus session", stop: "End session", active: "Focus session is active", inactive: "No focus session running", preview: "Preview an interest-based idea", subject: "Topic", choose: "Choose topic", math: "Math", science: "Science", coding: "Coding", reading: "Reading / general study", how: "How it helps", howText: "If a session goes quiet, Bodhya can offer one small next step, a quick reset, or an example tied to your interests. It won't call you distracted or punish you.", privacyTitle: "Your control matters", privacyText: "Support is opt-in, prompts are dismissible, and no event history is uploaded. When integrated, connect start/end actions to Bodhya's existing focus timer so it knows when a real study session is running.", saved: "Preferences save on this device automatically.", disabledTip: "Enable focus support first, then start a session to try prompts."
  },
  hi: {
    eyebrow: "फोकस और रुचियाँ", title: "पढ़ाई को अपने लिए बेहतर बनाएँ", intro: "पढ़ाई के दौरान मदद माँगने या कुछ देर शांत रहने पर Bodhya एक हल्का सुझाव या आपकी रुचि से जुड़ा उदाहरण दे सकता है।",
    optin: "फोकस सहायता चालू करें", privacy: "सिर्फ इसी सत्र के ब्राउज़र संकेत उपयोग होते हैं। कैमरा, माइक्रोफ़ोन या दूसरे ऐप की निगरानी नहीं होती। सुझाव इसी डिवाइस पर रहते हैं।", interests: "आपको क्या पसंद है?", hint: "उदाहरणों को उपयोगी बनाने के लिए कुछ रुचियाँ चुनें।", idle: "निष्क्रियता के बाद सुझाव", quiet: "सुझावों के बीच विराम", minutes: "मिनट", start: "फोकस सत्र शुरू करें", stop: "सत्र समाप्त करें", active: "फोकस सत्र चालू है", inactive: "कोई फोकस सत्र नहीं", preview: "रुचि से जुड़ा सुझाव देखें", subject: "विषय", choose: "विषय चुनें", math: "गणित", science: "विज्ञान", coding: "कोडिंग", reading: "पढ़ना / सामान्य अध्ययन", how: "यह कैसे मदद करता है", howText: "सत्र शांत होने पर Bodhya एक छोटा कदम, छोटा विराम या आपकी रुचि से जुड़ा उदाहरण सुझा सकता है।", privacyTitle: "नियंत्रण आपके हाथ में", privacyText: "सहायता वैकल्पिक है, सुझाव बंद किए जा सकते हैं और गतिविधि इतिहास अपलोड नहीं होता।", saved: "पसंद इसी डिवाइस पर सेव होती हैं।", disabledTip: "सुझाव आज़माने के लिए पहले सहायता चालू करें और सत्र शुरू करें।"
  },
  te: {
    eyebrow: "ఫోకస్ & ఆసక్తులు", title: "మీకు నచ్చేలా చదువుకుందాం", intro: "చదువుతున్నప్పుడు సహాయం అడిగినా లేదా సెషన్ కొంతసేపు నిశ్శబ్దంగా ఉన్నా, Bodhya చిన్న సూచన లేదా మీ ఆసక్తికి సంబంధించిన ఉదాహరణ ఇవ్వగలదు.",
    optin: "ఫోకస్ సహాయాన్ని ప్రారంభించండి", privacy: "ఈ సెషన్‌లోని బ్రౌజర్ సంకేతాలు మాత్రమే ఉపయోగిస్తాం. కెమెరా, మైక్రోఫోన్ లేదా ఇతర యాప్‌లను పర్యవేక్షించం. సూచనలు ఈ పరికరంలోనే ఉంటాయి.", interests: "మీకు ఏవి ఇష్టం?", hint: "ఉదాహరణలు మీకు దగ్గరగా ఉండేందుకు కొన్ని ఆసక్తులు ఎంచుకోండి.", idle: "నిష్క్రియ తర్వాత సూచన", quiet: "సూచనల మధ్య విరామం", minutes: "నిమిషాలు", start: "ఫోకస్ సెషన్ ప్రారంభించండి", stop: "సెషన్ ముగించండి", active: "ఫోకస్ సెషన్ కొనసాగుతోంది", inactive: "ఫోకస్ సెషన్ లేదు", preview: "ఆసక్తికి సంబంధించిన ఆలోచన చూడండి", subject: "విషయం", choose: "విషయం ఎంచుకోండి", math: "గణితం", science: "సైన్స్", coding: "కోడింగ్", reading: "చదువు / సాధారణ అధ్యయనం", how: "ఇది ఎలా సహాయపడుతుంది", howText: "సెషన్ నిశ్శబ్దంగా ఉన్నప్పుడు Bodhya చిన్న పని, చిన్న విరామం లేదా మీ ఆసక్తికి సంబంధించిన ఉదాహరణను సూచించగలదు.", privacyTitle: "నియంత్రణ మీ చేతిలోనే", privacyText: "సహాయం మీ ఇష్టంపై ఆధారపడి ఉంటుంది; సూచనలను మూసేయవచ్చు; కార్యకలాపాల చరిత్ర అప్లోడ్ కాదు.", saved: "ఎంపికలు ఈ పరికరంలో ఆటోమేటిక్‌గా సేవ్ అవుతాయి.", disabledTip: "సూచనలను ప్రయత్నించడానికి ముందుగా సహాయాన్ని ప్రారంభించి సెషన్ మొదలుపెట్టండి."
  }
};

export default function FocusSupportPage({ lang = "en" }) {
  const t = LABELS[lang] || LABELS.en;
  const { settings, enabled, setEnabled, updateSettings, sessionActive, startSession, stopSession, requestInterestPrompt, lastAction } = useFocusSupport();
  const [subject, setSubject] = useState("math");
  const picked = useMemo(() => INTERESTS.filter((item) => settings.interests.includes(item.id)), [settings.interests]);

  function toggleInterest(id) {
    const next = settings.interests.includes(id)
      ? settings.interests.filter((item) => item !== id)
      : [...settings.interests, id].slice(-5);
    updateSettings({ interests: next.length ? next : [id] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-3 sm:p-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 p-6 text-white shadow-lg sm:p-8">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-100">{t.eyebrow}</p>
        <h1 className="max-w-2xl text-2xl font-black sm:text-3xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">{t.intro}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-extrabold text-slate-800">{t.optin}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.privacy}</p>
          </div>
          <button onClick={() => setEnabled(!enabled)} aria-pressed={enabled}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-extrabold ${enabled ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            {enabled ? "✓ Enabled" : "Turn on"}
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${sessionActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {sessionActive ? `● ${t.active}` : `○ ${t.inactive}`}
          </span>
          {sessionActive ? (
            <button onClick={stopSession} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{t.stop}</button>
          ) : (
            <button disabled={!enabled} onClick={startSession} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">{t.start}</button>
          )}
          <button onClick={() => requestInterestPrompt(subject)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100">{t.preview}</button>
        </div>
        {!enabled && <p className="mt-3 text-xs text-slate-500">{t.disabledTip}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-800">{t.interests}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.hint} {picked.length}/5</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = settings.interests.includes(interest.id);
            return <button key={interest.id} aria-pressed={active} onClick={() => toggleInterest(interest.id)}
              className={`rounded-full border px-3.5 py-2 text-sm font-bold transition ${active ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>
              {interest.emoji} {interest.label} {active ? "✓" : ""}
            </button>;
          })}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            {t.idle}: {settings.idleMinutes} {t.minutes}
            <input aria-label={t.idle} type="range" min="2" max="15" step="1" value={settings.idleMinutes}
              onChange={(event) => updateSettings({ idleMinutes: Number(event.target.value) })} className="mt-3 block w-full accent-emerald-600" />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            {t.quiet}: {settings.quietMinutes} {t.minutes}
            <input aria-label={t.quiet} type="range" min="5" max="30" step="1" value={settings.quietMinutes}
              onChange={(event) => updateSettings({ quietMinutes: Number(event.target.value) })} className="mt-3 block w-full accent-emerald-600" />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">{t.saved}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-800">{t.how}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-950">{t.howText}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">{t.privacyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.privacyText}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800">{t.subject}</h2>
        <select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full max-w-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="math">{t.math}</option>
          <option value="science">{t.science}</option>
          <option value="coding">{t.coding}</option>
          <option value="reading">{t.reading}</option>
        </select>
        {lastAction?.action && <p className="mt-3 text-xs text-slate-500">Last choice: {lastAction.action.replaceAll("_", " ")}</p>}
      </section>
    </div>
  );
}
