// ---------- Bodhya reactive nudges: are you there / tour offer / welcome back / frustrated ----------
import { avatarImg } from "../data/avatars.js";
import { loadState } from "../brain/memory.js";

const COPY = {
  areYouThere: {
    en: { title: "Are you there? 👋", text: "I noticed you've been quiet for a bit. Stuck anywhere? I can help or show you around!" },
    hi: { title: "क्या आप वहाँ हैं? 👋", text: "थोड़ी देर से कोई हलचल नहीं दिखी। कहीं अटके हैं? मैं मदद कर सकता हूँ या टूर दिखा सकता हूँ!" },
    te: { title: "మీరు ఉన్నారా? 👋", text: "కాసేపు నుంచి కదలిక లేదు. ఎక్కడైనా ఇరుక్కున్నారా? సహాయం చేయగలను లేదా టూర్ చూపించగలను!" }
  },
  tourOffer: {
    en: { title: "Want a guided tour? 🗺️", text: "You've been on this page a while — let me walk you through everything so you never feel lost!" },
    hi: { title: "गाइडेड टूर चाहिए? 🗺️", text: "आप इस पेज पर काफी देर से हैं — पूरा ऐप घुमा दूँ, ताकि आप कभी खोए न महसूस करें!" },
    te: { title: "గైడెడ్ టూర్ కావాలా? 🗺️", text: "మీరు ఈ పేజీలో చాలా సేపు ఉన్నారు — మొత్తం యాప్ చుట్టూ తిప్పుతాను!" }
  },
  welcomeBack: {
    en: { title: "Welcome back! 👋", text: "I saw you step away for a bit. Ready to pick up where you left off?" },
    hi: { title: "वापसी पर स्वागत! 👋", text: "आप थोड़ी देर के लिए गए थे। जहाँ छोड़ा था, वहाँ से शुरू करें?" },
    te: { title: "తిరిగి రాకపై స్వాగతం! 👋", text: "మీరు కాసేపు వెళ్లారు. ఎక్కడ ఆపారో అక్కడి నుంచి మొదలుపెడదాం?" }
  },
  frustrated: {
    en: { title: "Looks like something's stuck 🥲", text: "I noticed a lot of clicking — is something not working? Tell me and I'll fix it with you!" },
    hi: { title: "लगता है कुछ अटक गया 🥲", text: "बहुत क्लिक हो रही है — क्या कुछ काम नहीं कर रहा? बताइए, हम मिलकर ठीक करेंगे!" },
    te: { title: "ఏదో ఇరుక్కున్నట్లుంది 🥲", text: "చాలా క్లిక్‌లు జరుగుతున్నాయి — ఏదైనా పని చేయడం లేదా? చెప్పండి, కలిసి సరిచేద్దాం!" }
  }
};

const ACTIONS = {
  areYouThere: [
    { id: "stuck", label: { en: "🆘 I'm stuck", hi: "🆘 मैं अटक गया", te: "🆘 నేను ఇరుక్కున్నా" }, cls: "bg-indigo-600 text-white hover:bg-indigo-700" },
    { id: "tour", label: { en: "🗺️ Show me around", hi: "🗺️ घुमाओ", te: "🗺️ చూపించు" }, cls: "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100" },
    { id: "no", label: { en: "✕ I'm fine", hi: "✕ ठीक हूँ", te: "✕ బాగున్నాను" }, cls: "bg-slate-100 text-slate-700 hover:bg-slate-200" }
  ],
  tourOffer: [
    { id: "tour", label: { en: "🗺️ Start tour", hi: "🗺️ टूर शुरू करें", te: "🗺️ టూర్ మొదలుపెట్టు" }, cls: "bg-indigo-600 text-white hover:bg-indigo-700" },
    { id: "chat", label: { en: "🤖 Open chat", hi: "🤖 चैट खोलें", te: "🤖 చాట్ తెరవండి" }, cls: "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100" },
    { id: "no", label: { en: "✕ No thanks", hi: "✕ नहीं धन्यवाद", te: "✕ వద్దు ధన్యవాదాలు" }, cls: "bg-slate-100 text-slate-700 hover:bg-slate-200" }
  ],
  welcomeBack: [
    { id: "chat", label: { en: "🤖 Open chat", hi: "🤖 चैट खोलें", te: "🤖 చాట్ తెరవండి" }, cls: "bg-indigo-600 text-white hover:bg-indigo-700" },
    { id: "tour", label: { en: "🗺️ Show me around", hi: "🗺️ घुमाओ", te: "🗺️ చూపించు" }, cls: "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100" },
    { id: "no", label: { en: "✕ Not now", hi: "✕ अभी नहीं", te: "✕ ఇప్పుడు కాదు" }, cls: "bg-slate-100 text-slate-700 hover:bg-slate-200" }
  ],
  frustrated: [
    { id: "stuck", label: { en: "🆘 I'm stuck", hi: "🆘 मैं अटक गया", te: "🆘 నేను ఇరుక్కున్నా" }, cls: "bg-indigo-600 text-white hover:bg-indigo-700" },
    { id: "chat", label: { en: "🤖 Chat with me", hi: "🤖 मुझसे बात करो", te: "🤖 నాతో మాట్లాడండి" }, cls: "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100" },
    { id: "no", label: { en: "✕ I'm fine", hi: "✕ ठीक हूँ", te: "✕ బాగున్నాను" }, cls: "bg-slate-100 text-slate-700 hover:bg-slate-200" }
  ]
};

export default function IdleNudge({ lang, kind, onAction }) {
  const c = (COPY[kind] && (COPY[kind][lang] || COPY[kind].en)) || null;
  const buttons = ACTIONS[kind] || [];
  if (!c) return null;

  return (
    <div role="alert" aria-live="polite"
      className="fixed bottom-6 left-6 z-[65] flex max-w-[350px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-[slideUp_0.3s_ease]">
      <img
        src={avatarImg(loadState().profile.avatar || "banyan")}
        alt="Bodhya"
        className="h-11 w-11 shrink-0 rounded-full object-cover shadow-lg ring-2 ring-white"
      />
      <div>
        <strong className="mb-1 block text-[14.5px] text-slate-800">{c.title}</strong>
        <p className="mb-2.5 text-[13px] text-slate-500">{c.text}</p>
        <div className="flex flex-wrap gap-2">
          {buttons.map((b) => (
            <button key={b.id} onClick={() => onAction(b.id, kind)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${b.cls}`}>
              {b.label[lang] || b.label.en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
