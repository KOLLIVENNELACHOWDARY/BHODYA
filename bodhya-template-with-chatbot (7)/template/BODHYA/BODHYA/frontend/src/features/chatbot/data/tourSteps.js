// ---------- Bodhya guided tour: jumps tab → tab across the whole app ----------
// Each step either targets a data-tour element, or switches to a tab
// (tab: <id>) and highlights that tab button. The Tour component
// auto-advances, so the tour walks the user through every tab.

export const TOUR_STEPS = [
  {
    icon: "🗂️",
    target: '[data-tour="sidebar"]',
    en: { title: "All features as tabs 🗂️", text: "The app's features live here as tabs. Watch me jump through every tab and explain it!" },
    hi: { title: "सभी फीचर्स टैब के रूप में 🗂️", text: "ऐप की सभी फीचर्स यहाँ टैब के रूप में हैं। मैं हर टैब पर जाकर समझाता हूँ — देखिए!" },
    te: { title: "అన్ని ఫీచర్లు ట్యాబ్‌లుగా 🗂️", text: "యాప్ ఫీచర్లన్నీ ఇక్కడ ట్యాబ్‌లుగా ఉన్నాయి. ప్రతి ట్యాబ్ కి వెళ్లి వివరిస్తాను — చూడండి!" }
  },
  {
    icon: "🏠",
    tab: "home",
    en: { title: "Home — Dashboard 🏠", text: "Your dashboard — progress, quick actions and everything at a glance." },
    hi: { title: "होम — डैशबोर्ड 🏠", text: "आपका डैशबोर्ड — प्रोग्रेस, क्विक एक्शन, सब कुछ एक नज़र में।" },
    te: { title: "హోమ్ — డాష్‌బోర్డ్ 🏠", text: "మీ డాష్‌బోర్డ్ — ప్రోగ్రెస్, క్విక్ యాక్షన్లు అన్నీ ఒక చూపులో." }
  },
  {
    icon: "🎮",
    tab: "quiz",
    en: { title: "Quiz Arena 🎮", text: "Boss Battle quizzes — 5 questions per battle, difficulty adapts to your level." },
    hi: { title: "क्विज़ एरीना 🎮", text: "बॉस बैटल क्विज़ — हर बैटल में 5 सवाल, कठिनाई आपके लेवल के हिसाब से।" },
    te: { title: "క్విజ్ అరేనా 🎮", text: "బాస్ బాటిల్ క్విజ్‌లు — ఒక్కో బాటిల్ లో 5 ప్రశ్నలు, కష్టతరం మీ లెవల్ కి తగ్గట్టు." }
  },
  {
    icon: "📝",
    tab: "tests",
    en: { title: "Tests 📝", text: "Assessments & long/short answer questions generated from your study material." },
    hi: { title: "टेस्ट 📝", text: "आकलन और आपकी स्टडी सामग्री से लॉन्ग/शॉर्ट आंसर प्रश्न।" },
    te: { title: "టెస్ట్లు 📝", text: "మీ స్టడీ మెటీరియల్ నుంచి మదింపులు & లాంగ్/షార్ట్ ప్రశ్నలు." }
  },
  {
    icon: "📅",
    tab: "planner",
    en: { title: "Study Planner 📅", text: "Plan your study sessions — you can even tell me: \"add maths 30 minutes\"!" },
    hi: { title: "स्टडी प्लानर 📅", text: "सेशन प्लान करें — मुझसे कह सकते हैं: \"गणित 30 मिनट जोड़ो\"!" },
    te: { title: "స్టడీ ప్లానర్ 📅", text: "సెషన్లు ప్లాన్ చేయండి — నాతో చెప్పవచ్చు: \"గణితం 30 నిమిషాలు జోడించు\"!" }
  },
  {
    icon: "✅",
    tab: "todo",
    en: { title: "To-do List ✅", text: "A simple daily to-do list." },
    hi: { title: "टू-डू लिस्ट ✅", text: "आसान रोज़ाना टू-डू लिस्ट।" },
    te: { title: "టూ-డూ లిస్ట్ ✅", text: "సింపుల్ రోజువారీ టూ-డూ లిస్ట్." }
  },
  {
    icon: "⏱️",
    tab: "time",
    en: { title: "Time Tracking ⏱️", text: "Track how much time you spend studying each day." },
    hi: { title: "टाइम ट्रैकिंग ⏱️", text: "रोज़ कितनी देर पढ़ते हैं, ट्रैक करें।" },
    te: { title: "టైమ్ ట్రాకింగ్ ⏱️", text: "రోజుకు ఎంత చదువుతున్నారో ట్రాక్ చేయండి." }
  },
  {
    icon: "🗺️",
    tab: "knowledge",
    en: { title: "Knowledge Graph 🗺️", text: "Your personal knowledge graph — topics and how they connect." },
    hi: { title: "नॉलेज ग्राफ 🗺️", text: "टॉपिक और कनेक्शन का आपका निजी नक्शा।" },
    te: { title: "నాలెడ్జ్ గ్రాఫ్ 🗺️", text: "టాపిక్‌లు, సంబంధాల మీ వ్యక్తిగత పటం." }
  },
  {
    icon: "💬",
    tab: "tutor",
    en: { title: "Tutor Chat 💬", text: "The Socratic AI tutor and character explainers — your team's AI feature." },
    hi: { title: "ट्यूटर चैट 💬", text: "सॉक्रेटिक AI ट्यूटर और कैरेक्टर एक्सप्लेनर — टीम का AI फीचर।" },
    te: { title: "ట్యూటర్ చాట్ 💬", text: "సాక్రటిక్ AI ట్యూటర్ & క్యారెక్టర్ ఎక్స్‌ప్లైనర్లు — టీమ్ AI ఫీచర్." }
  },
  {
    icon: "🧠",
    tab: "revision",
    en: { title: "Revision Tools 🧠", text: "Quick revision with mindmaps and flashcards." },
    hi: { title: "रिवीज़न टूल्स 🧠", text: "माइंडमैप और फ्लैशकार्ड से क्विक रिवीज़न।" },
    te: { title: "రివిజన్ టూల్స్ 🧠", text: "మైండ్‌మ్యాప్స్ & ఫ్లాష్‌కార్డులతో త్వరిత రివిజన్." }
  },
  {
    icon: "📂",
    tab: "rag",
    en: { title: "Upload & Query 📂", text: "Upload PDFs, docs or images and ask questions about them (RAG)." },
    hi: { title: "अपलोड और पूछें 📂", text: "PDF, डॉक्स या इमेज अपलोड करें और उनसे सवाल पूछें (RAG)।" },
    te: { title: "అప్‌లోడ్ & ప్రశ్నలు 📂", text: "PDFలు, డాక్స్ లేదా ఇమేజెస్ అప్‌లోడ్ చేసి అడగండి (RAG)." }
  },
  {
    icon: "👥",
    tab: "rooms",
    en: { title: "Collab Rooms 👥", text: "Real-time collaborative research rooms with your team." },
    hi: { title: "कोलैब रूम्स 👥", text: "टीम के साथ रीयल-टाइम रिसर्च रूम।" },
    te: { title: "కొలాబ్ రూమ్స్ 👥", text: "మీ టీమ్ తో రియల్‌టైమ్ రీసెర్చ్ రూమ్స్." }
  },
  {
    icon: "🏆",
    tab: "rewards",
    en: { title: "Streaks & Rewards 🏆", text: "Streaks, points and stickers to keep you going." },
    hi: { title: "स्ट्रीक्स और रिवॉर्ड्स 🏆", text: "स्ट्रीक्स, पॉइंट्स और स्टिकर्स — मोटिवेशन के लिए।" },
    te: { title: "స్ట్రీక్స్ & రివార్డ్స్ 🏆", text: "స్ట్రీక్స్, పాయింట్లు, స్టిక్కర్లు — కొనసాగించడానికి." }
  },
  {
    icon: "⭐",
    tab: "reviews",
    en: { title: "Reviews ⭐", text: "Share suggestions and reviews about the app." },
    hi: { title: "रिव्यूज़ ⭐", text: "ऐप के बारे में सुझाव और रिव्यू दें।" },
    te: { title: "రివ్యూలు ⭐", text: "యాప్ గురించి సూచనలు, రివ్యూలు ఇవ్వండి." }
  },
  {
    icon: "🔒",
    tab: "safety",
    en: { title: "Parental Lock 🔒", text: "Parental lock and emergency contacts — safety controls." },
    hi: { title: "पैरेंटल लॉक 🔒", text: "पैरेंटल लॉक और इमरजेंसी कॉन्टैक्ट — सेफ्टी कंट्रोल्स।" },
    te: { title: "పేరెంటల్ లాక్ 🔒", text: "పేరెంటల్ లాక్ & ఎమర్జెన్సీ కాంటాక్ట్స్ — భద్రతా నియంత్రణలు." }
  },
  {
    icon: "🌳",
    target: '[data-tour="chatbot"]',
    en: { title: "This is me — Bodhya! 🤖", text: "Tap me anytime to chat, get help, or hear reminders. I'm the guide that just walked you through every tab!" },
    hi: { title: "यह मैं हूँ — Bodhya! 🤖", text: "कभी भी दबाइए — चैट, मदद या रिमाइंडर के लिए। मैं वही गाइड हूँ जिसने आपको हर टैब घुमाया!" },
    te: { title: "ఇది నేను — Bodhya! 🤖", text: "ఎప్పుడైనా నొక్కండి — చాట్, సహాయం, రిమైండర్ల కోసం. ప్రతి ట్యాబ్ కి తిప్పిన గైడ్ నేను!" }
  },
  {
    icon: "🎤",
    target: '[data-tour="mic"]',
    openChat: true,
    en: { title: "Talk to me! 🎤", text: "Tap the mic and speak — I'll read my replies aloud too. Works in English, Hindi & Telugu." },
    hi: { title: "मुझसे बोलिए! 🎤", text: "माइक दबाकर बोलिए — मैं जवाब ज़ोर से भी पढ़ूँगा। हिंदी, अंग्रेज़ी, तेलुगु में।" },
    te: { title: "నాతో మాట్లాడండి! 🎤", text: "మైక్ నొక్కి మాట్లాడండి — జవాబులు బిగ్గరగా చదువుతాను. తెలుగు, హిందీ, ఇంగ్లీష్ లో." }
  },
  {
    icon: "🆘",
    target: '[data-tour="helpchip"]',
    en: { title: "Stuck anywhere? 🆘", text: "This button opens me on the current page with context — I already know which tab you're on." },
    hi: { title: "कहीं अटके? 🆘", text: "यह बटन मुझे उसी पेज पर खोलता है — मुझे पता रहता है कि आप किस टैब पर हैं।" },
    te: { title: "ఎక్కడైనా ఇరుక్కున్నారా? 🆘", text: "ఈ బటన్ నన్ను ఆ పేజీలోనే తెరుస్తుంది — మీరు ఏ ట్యాబ్ లో ఉన్నారో నాకు తెలుస్తుంది." }
  },
  {
    icon: "🎉",
    target: '[data-tour="sidebar"]',
    en: { title: "That's everything! 🎉", text: "Explore freely — jump between tabs anytime. I'm here whenever you're stuck. Happy learning!" },
    hi: { title: "बस इतना ही! 🎉", text: "खुलकर एक्सप्लोर करें — कभी भी टैब बदलें। अटकें तो मैं यहीं हूँ। पढ़ाई की शुभकामनाएँ!" },
    te: { title: "అంతే! 🎉", text: "స్వేచ్ఛగా అన్వేషించండి — ఎప్పుడైనా ట్యాబ్ మార్చండి. ఇరుక్కుంటే నేను ఇక్కడే ఉంటాను. శుభాకాంక్షలు!" }
  }
];
