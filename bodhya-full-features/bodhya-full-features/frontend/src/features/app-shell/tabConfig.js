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
    title: { en: "Study Plan", hi: "स्टडी प्लान", te: "స్టడీ ప్లాన్" },
    desc: {
      en: "Exam countdown + a timetable built from your subjects. Say \"make a 7 day plan for maths\".",
      hi: "परीक्षा काउंटडाउन + आपके विषयों से बना टाइमटेबल। कहें: \"गणित का 7 दिन का प्लान बनाओ\"।",
      te: "పరీక్ష కౌంట్‌డౌన్ + మీ సబ్జెక్ట్‌లతో టైమ్‌టేబుల్. అనండి: \"మ్యాథ్స్ కి 7 రోజుల ప్లాన్\".",
    },
    owner: "Team · features/study-schedule",
  },
  {
    id: "todo",
    icon: "✅",
    title: { en: "To-do List", hi: "टू-डू लिस्ट", te: "టూ-డూ లిస్ట్" },
    desc: {
      en: "Tasks with priorities, dates, reminders, steps and repeats. Add them by chat too!",
      hi: "प्राथमिकता, तारीख़, रिमाइंडर, स्टेप्स और दोहराव के साथ काम। चैट से भी जोड़िए!",
      te: "ప్రాధాన్యత, తేదీలు, రిమైండర్లు, స్టెప్పులు, పునరావృతంతో పనులు. చాట్‌లోనూ జోడించండి!",
    },
    owner: "Team · features/todo-list",
  },
  {
    id: "alarms",
    icon: "⏰",
    title: { en: "Alarms", hi: "अलार्म", te: "అలారమ్‌లు" },
    desc: {
      en: "Wake-ups, study blocks and reminders — they ring, buzz and show a full-screen ring you can snooze.",
      hi: "उठने के अलार्म, स्टडी ब्लॉक और रिमाइंडर — बजते हैं, वाइब्रेट करते हैं, पूरी स्क्रीन पर स्नूज़ के साथ दिखते हैं।",
      te: "లేవడానికి అలారమ్‌లు, స్టడీ బ్లాక్‌లు, రిమైండర్లు — మోగుతాయి, వైబ్రేట్ అవుతాయి, స్నూజ్ స్క్రీన్ వస్తుంది.",
    },
    owner: "You · features/alarms",
  },
  {
    id: "notifications",
    icon: "🔔",
    title: { en: "Notifications", hi: "नोटिफिकेशन", te: "నోటిఫికేషన్లు" },
    desc: {
      en: "One inbox for everything Bodhya told you + what is coming next. Quiet hours, sounds, phone alerts.",
      hi: "Bodhya की सारी सूचनाएँ एक जगह + आगे क्या आने वाला है। शांत समय, आवाज़, फ़ोन अलर्ट।",
      te: "Bodhya చెప్పినవన్నీ ఒకే ఇన్‌బాక్స్‌లో + రాబోయేవి. నిశ్శబ్ద సమయం, శబ్దాలు, ఫోన్ అలర్ట్‌లు.",
    },
    owner: "You · features/notifications",
  },
  {
    id: "focus",
    icon: "⏳",
    title: { en: "Focus Timer", hi: "फोकस टाइमर", te: "ఫోకస్ టైమర్" },
    desc: {
      en: "Pomodoro blocks with automatic breaks. Finished blocks become study time + XP.",
      hi: "पोमोडोरो ब्लॉक, अपने आप ब्रेक के साथ। पूरा ब्लॉक स्टडी टाइम और XP बन जाता है।",
      te: "పొమొడోరో బ్లాక్‌లు, ఆటో విరామాలతో. పూర్తయిన బ్లాక్ స్టడీ టైమ్ + XP అవుతుంది.",
    },
    owner: "You · features/focus",
  },
  {
    id: "guardian",
    icon: "👨‍👩‍👧",
    title: { en: "Guardian", hi: "अभिभावक", te: "గార్డియన్" },
    desc: {
      en: "Share a read-only progress view with a parent or teacher — you choose every section, journal writing stays private, and you can revoke it any time.",
      hi: "माता-पिता या शिक्षक के साथ सिर्फ़-पढ़ने वाला व्यू साझा करें — हर भाग आप चुनें, जर्नल निजी रहे, और कभी भी रद्द कर सकें।",
      te: "తల్లిదండ్రులు/టీచర్‌తో చదవడానికి-మాత్రమే వ్యూ పంచుకోండి — విభాగాలు మీరే ఎంచుకోండి, జర్నల్ ప్రైవేట్, ఎప్పుడైనా రద్దు.",
    },
    owner: "You · features/guardian",
  },
  {
    id: "journal",
    icon: "📔",
    title: { en: "Journal", hi: "जर्नल", te: "జర్నల్" },
    desc: {
      en: "A personalised study diary: prompts built from your real day, mood tracking, wins and struggles, and a weekly review.",
      hi: "व्यक्तिगत स्टडी डायरी: आपके असली दिन से बने सवाल, मूड ट्रैकिंग, जीत और कठिनाइयाँ, और साप्ताहिक समीक्षा।",
      te: "వ్యక్తిగత స్టడీ డైరీ: మీ నిజమైన రోజు నుంచి ప్రశ్నలు, మూడ్ ట్రాకింగ్, విజయాలు-ఇబ్బందులు, వారపు సమీక్ష.",
    },
    owner: "You · features/journal",
  },
  {
    id: "shield",
    icon: "🛡️",
    title: { en: "Focus Shield", hi: "फोकस शील्ड", te: "ఫోకస్ షీల్డ్" },
    desc: {
      en: "Anti-doomscroll guard: blocklists you can export, escape tracking during sessions, a 90-second urge routine and a daily scroll budget.",
      hi: "डूमस्क्रॉलिंग रोकने वाली शील्ड: एक्सपोर्ट करने योग्य ब्लॉकलिस्ट, सत्र में भटकाव की निगरानी, 90 सेकंड की इच्छा-रूटीन और रोज़ का स्क्रॉल बजट।",
      te: "డూమ్‌స్క్రోలింగ్ ఆపే షీల్డ్: ఎక్స్‌పోర్ట్ చేయగల బ్లాక్‌లిస్ట్, సెషన్‌లో ఎస్కేప్ ట్రాకింగ్, 90 సెకన్ల ఇచ్ఛా రొటీన్, రోజువారీ స్క్రోల్ బడ్జెట్.",
    },
    owner: "You · features/focus-shield",
  },
  {
    id: "music",
    icon: "🎵",
    title: { en: "Study Music", hi: "स्टडी म्यूज़िक", te: "స్టడీ మ్యూజిక్" },
    desc: {
      en: "Offline generative focus music: warm pads, lo-fi, rain, brown noise and binaural alpha/theta waves — with a mixer and sleep timer.",
      hi: "ऑफ़लाइन संगीत जो खुद बनता है: गर्म पैड, लो-फ़ाई, बारिश, ब्राउन नॉइज़ और बाइनॉरल अल्फा/थीटा तरंगें — मिक्सर और स्लीप टाइमर के साथ।",
      te: "ఆఫ్‌లైన్ జనరేటివ్ ఫోకస్ మ్యూజిక్: వెచ్చని ప్యాడ్‌లు, లో-ఫై, వర్షం, బ్రౌన్ నాయిస్, బైనారల్ తరంగాలు — మిక్సర్, స్లీప్ టైమర్‌తో.",
    },
    owner: "You · features/music",
  },
  {
    id: "forest",
    icon: "🌳",
    title: { en: "Study Forest", hi: "स्टडी फ़ॉरेस्ट", te: "స్టడీ ఫారెస్ట్" },
    desc: {
      en: "Plant a tree, start the task. Finish it and the tree stays — leave and it withers. Grow a forest, keep the streak, earn coins.",
      hi: "पेड़ लगाइए, काम शुरू कीजिए। पूरा हुआ तो पेड़ रहेगा — बीच में छोड़ा तो मुरझा जाएगा। जंगल बनाइए, स्ट्रीक रखिए, सिक्के कमाइए।",
      te: "చెట్టు నాటండి, పని మొదలుపెట్టండి. పూర్తయితే చెట్టు నిలుస్తుంది — మధ్యలో వదిలితే వాడిపోతుంది. అడవి పెంచండి, స్ట్రీక్ కాపాడండి, నాణేలు సంపాదించండి.",
    },
    owner: "You · features/study-forest",
  },
  {
    id: "time",
    icon: "⏱️",
    title: { en: "Time Tracking", hi: "टाइम ट्रैकिंग", te: "టైమ్ ట్రాకింగ్" },
    desc: {
      en: "Every focused minute, logged automatically — daily goal, week chart, per subject.",
      hi: "हर फोकस मिनट अपने आप दर्ज — रोज़ का लक्ष्य, हफ़्ते का चार्ट, हर विषय।",
      te: "ప్రతి ఫోకస్ నిమిషం ఆటోగా నమోదు — రోజు లక్ష్యం, వారం చార్ట్, సబ్జెక్ట్ వారీగా.",
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
