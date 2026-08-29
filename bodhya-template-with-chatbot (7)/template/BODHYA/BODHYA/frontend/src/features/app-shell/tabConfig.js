// ---------- App shell: feature tabs (all template features, EN/HI/TE) ----------

export const TABS = [
  {
    id: "home",
    icon: "🏠",
    title: { en: "Dashboard", hi: "डैशबोर्ड", te: "డాష్‌బోర్డ్" },
    desc: {
      en: "Your dashboard — progress, quick actions and everything at a glance.",
      hi: "आपका डैशबोर्ड — प्रोग्रेस, क्विक एक्शन, सब कुछ एक नज़र में।",
      te: "మీ డాష్‌బోర్డ్ — ప్రోగ్రెస్, క్విక్ యాక్షన్లు అన్నీ ఒక చూపులో.",
    },
    owner: "Team · features/dashboard",
  },
  {
    id: "quiz",
    icon: "🎮",
    title: { en: "Quiz Arena", hi: "क्विज़ एरीना", te: "క్విజ్ అరేనా" },
    desc: {
      en: "Boss Battle quizzes — 5 questions per battle, difficulty adapts to your level.",
      hi: "बॉस बैटल क्विज़ — हर बैटल में 5 सवाल, कठिनाई आपके लेवल के हिसाब से।",
      te: "బాస్ బాటిల్ క్విజ్‌లు — ఒక్కో బాటిల్ లో 5 ప్రశ్నలు, కష్టతరం మీ లెవల్ కి తగ్గట్టు.",
    },
    owner: "Team · features/quizzes-boss-battle",
  },
  {
    id: "notesquiz",
    icon: "📄",
    title: { en: "Notes Quiz", hi: "नोट्स क्विज़", te: "నోట్స్ క్విజ్" },
    desc: {
      en: "Generate a quiz from your own notes — paste or upload text, fully offline.",
      hi: "अपने नोट्स से क्विज़ बनाएँ — टेक्स्ट पेस्ट या अपलोड करें, पूरी तरह ऑफ़लाइन।",
      te: "మీ నోట్స్ నుంచి క్విజ్ రూపొందించండి — టెక్స్ట్ పేస్ట్ లేదా అప్‌లోడ్, పూర్తి ఆఫ్‌లైన్.",
    },
    owner: "You · features/chatbot",
  },
  {
    id: "tests",
    icon: "📝",
    title: { en: "Tests", hi: "टेस्ट", te: "టెస్ట్లు" },
    desc: {
      en: "Assessments & long/short answer questions generated from your study material.",
      hi: "आकलन और आपकी स्टडी सामग्री से लॉन्ग/शॉर्ट आंसर प्रश्न।",
      te: "మీ స్టడీ మెటీరియల్ నుంచి మదింపులు & లాంగ్/షార్ట్ ప్రశ్నలు.",
    },
    owner: "Team · features/tests-assessment",
  },
  {
    id: "planner",
    icon: "📅",
    title: { en: "Study Planner", hi: "स्टडी प्लानर", te: "స్టడీ ప్లానర్" },
    desc: {
      en: "Plan your study sessions — tell Bodhya: \"add maths 30 minutes\".",
      hi: "स्टडी सेशन प्लान करें — Bodhya से कहें: \"गणित 30 मिनट जोड़ो\"।",
      te: "స్టడీ సెషన్లు ప్లాన్ చేయండి — Bodhya తో చెప్పండి: \"గణితం 30 నిమిషాలు జోడించు\".",
    },
    owner: "Team · features/study-schedule",
  },
  {
    id: "todo",
    icon: "✅",
    title: { en: "To-do List", hi: "टू-डू लिस्ट", te: "టూ-డూ లిస్ట్" },
    desc: {
      en: "A simple daily to-do list.",
      hi: "आसान रोज़ाना टू-डू लिस्ट।",
      te: "సింపుల్ రోజువారీ టూ-డూ లిస్ట్.",
    },
    owner: "Team · features/todo-list",
  },
  {
    id: "time",
    icon: "⏱️",
    title: { en: "Time Tracking", hi: "टाइम ट्रैकिंग", te: "టైమ్ ట్రాకింగ్" },
    desc: {
      en: "Track how much time you spend studying each day.",
      hi: "रोज़ कितनी देर पढ़ते हैं, ट्रैक करें।",
      te: "రోజుకు ఎంత చదువుతున్నారో ట్రాక్ చేయండి.",
    },
    owner: "Team · features/time-tracking",
  },
  {
    id: "knowledge",
    icon: "🗺️",
    title: { en: "Knowledge Graph", hi: "नॉलेज ग्राफ", te: "నాలెడ్జ్ గ్రాఫ్" },
    desc: {
      en: "Your personal knowledge graph — topics and how they connect.",
      hi: "आपका निजी नॉलेज ग्राफ — टॉपिक और उनके कनेक्शन।",
      te: "మీ వ్యక్తిగత నాలెడ్జ్ గ్రాఫ్ — టాపిక్‌లు, వాటి సంబంధాలు.",
    },
    owner: "Team · features/knowledge-graph",
  },
  {
    id: "tutor",
    icon: "💬",
    title: { en: "Tutor Chat", hi: "ट्यूटर चैट", te: "ట్యూటర్ చాట్" },
    desc: {
      en: "Socratic AI tutor & character explainers (team feature).",
      hi: "सॉक्रेटिक AI ट्यूटर और कैरेक्टर एक्सप्लेनर (टीम फीचर)।",
      te: "సాక్రటిక్ AI ట్యూటర్ & క్యారెక్టర్ ఎక్స్‌ప్లైనర్లు (టీమ్ ఫీచర్).",
    },
    owner: "Team · features/tutor-chat",
  },
  {
    id: "revision",
    icon: "🧠",
    title: { en: "Revision Tools", hi: "रिवीज़न टूल्स", te: "రివిజన్ టూల్స్" },
    desc: {
      en: "Quick revision with mindmaps and flashcards.",
      hi: "माइंडमैप और फ्लैशकार्ड से क्विक रिवीज़न।",
      te: "మైండ్‌మ్యాప్స్ & ఫ్లాష్‌కార్డులతో త్వరిత రివిజన్.",
    },
    owner: "Team · features/revision-tools",
  },
  {
    id: "rag",
    icon: "📂",
    title: { en: "Upload & Query", hi: "अपलोड और पूछें", te: "అప్‌లోడ్ & ప్రశ్నలు" },
    desc: {
      en: "Upload PDFs, docs or images and ask questions about them (RAG).",
      hi: "PDF, डॉक्स या इमेज अपलोड करें और उनसे सवाल पूछें (RAG)।",
      te: "PDFలు, డాక్స్ లేదా ఇమేజెస్ అప్‌లోడ్ చేసి ప్రశ్నలు అడగండి (RAG).",
    },
    owner: "Team · features/file-upload-rag",
  },
  {
    id: "rooms",
    icon: "👥",
    title: { en: "Collab Rooms", hi: "कोलैब रूम्स", te: "కొలాబ్ రూమ్స్" },
    desc: {
      en: "Real-time collaborative research rooms with your team.",
      hi: "टीम के साथ रीयल-टाइम कोलैबोरेटिव रिसर्च रूम।",
      te: "మీ టీమ్ తో రియల్‌టైమ్ కొలాబరేటివ్ రీసెర్చ్ రూమ్స్.",
    },
    owner: "Team · features/collab-rooms",
  },
  {
    id: "rewards",
    icon: "🏆",
    title: { en: "Streaks & Rewards", hi: "स्ट्रीक्स और रिवॉर्ड्स", te: "స్ట్రీక్స్ & రివార్డ్స్" },
    desc: {
      en: "Streaks, points and stickers to keep you going.",
      hi: "स्ट्रीक्स, पॉइंट्स और स्टिकर्स — मोटिवेशन के लिए।",
      te: "స్ట్రీక్స్, పాయింట్లు, స్టిక్కర్లు — కొనసాగించడానికి.",
    },
    owner: "Team · features/gamification-streaks",
  },
  {
    id: "reviews",
    icon: "⭐",
    title: { en: "Reviews", hi: "रिव्यूज़", te: "రివ్యూలు" },
    desc: {
      en: "Share suggestions and reviews about the app.",
      hi: "ऐप के बारे में सुझाव और रिव्यू दें।",
      te: "యాప్ గురించి సూచనలు, రివ్యూలు ఇవ్వండి.",
    },
    owner: "Team · features/reviews-feedback",
  },
  {
    id: "safety",
    icon: "🔒",
    title: { en: "Parental Lock", hi: "पैरेंटल लॉक", te: "పేరెంటల్ లాక్" },
    desc: {
      en: "Parental lock and emergency contacts (safety controls).",
      hi: "पैरेंटल लॉक और इमरजेंसी कॉन्टैक्ट (सेफ्टी कंट्रोल्स)।",
      te: "పేరెంటల్ లాక్ & ఎమర్జెన్సీ కాంటాక్ట్స్ (భద్రతా నియంత్రణలు).",
    },
    owner: "Team · features/parental-lock",
  },
  {
    id: "profile",
    icon: "👤",
    title: { en: "My Avatar", hi: "मेरा अवतार", te: "నా అవతార్" },
    desc: {
      en: "Pick your favorite mascot — Bodhya takes its form everywhere.",
      hi: "अपना पसंदीदा मस्कट चुनें — Bodhya हर जगह वैसा ही दिखेगा।",
      te: "మీకు నచ్చిన మస్కట్ ఎంచుకోండి — Bodhya అలాగే కనిపిస్తుంది.",
    },
    owner: "You · features/chatbot",
  },
];

export const STATUS = {
  en: "🚧 Team feature — in progress",
  hi: "🚧 टीम फीचर — बन रहा है",
  te: "🚧 టీమ్ ఫీచర్ — నిర్మాణంలో",
};
