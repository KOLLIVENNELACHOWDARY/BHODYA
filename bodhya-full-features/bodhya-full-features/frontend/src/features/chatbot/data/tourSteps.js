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
    en: { title: "Study Plan 📅", text: "Two ways to get a timetable. I propose one (say “make a 7 day plan for maths and physics”) and you accept, discard or rebuild it. Or build your own week: tap any empty slot to drop in a session, tap a session to change its time, minutes or subject. Your own sessions are never lost when I rebuild." },
    hi: { title: "स्टडी प्लान 📅", text: "टाइमटेबल के दो तरीके। मैं ड्राफ़्ट बनाता हूँ (कहिए “गणित और भौतिकी का 7 दिन का प्लान बनाओ”) और आप मंज़ूर, हटा या फिर बना सकते हैं। या ख़ुद हफ़्ता बनाइए: किसी खाली स्लॉट पर टैप कीजिए, किसी सत्र पर टैप कर उसका समय, मिनट या विषय बदलिए। आपके सत्र मेरे दोबारा बनाने पर भी बने रहते हैं।" },
    te: { title: "స్టడీ ప్లాన్ 📅", text: "టైమ్‌టేబుల్‌కు రెండు మార్గాలు. నేను డ్రాఫ్ట్ ఇస్తాను (“మ్యాథ్స్, ఫిజిక్స్ కి 7 రోజుల ప్లాన్” అనండి) — మీరు అమలు, తొలగింపు లేదా మళ్లీ చేయవచ్చు. లేదా మీ వారం మీరే: ఖాళీ స్లాట్ నొక్కి సెషన్ జోడించండి, సెషన్ నొక్కి సమయం/నిమిషాలు/సబ్జెక్ట్ మార్చండి." }
  },
  {
    icon: "✅",
    tab: "todo",
    en: { title: "To-do List ✅", text: "Build it your way — smart add understands “physics 30 min tomorrow 6pm” — or let me do it: I suggest tasks from your own day, hand you ready-made packs like Exam week, and can turn today's study plan into tasks." },
    hi: { title: "टू-डू लिस्ट ✅", text: "अपने तरीके से — स्मार्ट एड “गणित 30 मिनट कल” समझ लेता है — या मुझे करने दीजिए: मैं आपके दिन से टास्क सुझाता हूँ, परीक्षा सप्ताह जैसे तैयार पैक देता हूँ, और आज के प्लान को टास्क बना सकता हूँ।" },
    te: { title: "టూ-డూ లిస్ట్ ✅", text: "మీ ఇష్టంగా — స్మార్ట్ యాడ్ “ఫిజిక్స్ 30 నిమిషాలు రేపు” అర్థం చేసుకుంటుంది — లేదా నేను చేస్తాను: మీ రోజు నుంచి పనులు సూచిస్తాను, పరీక్ష వారం లాంటి రెడీ ప్యాక్‌లు ఇస్తాను, నేటి ప్లాన్‌ను పనులుగా మారుస్తాను." }
  },
  {
    icon: "⏰",
    tab: "alarms",
    en: { title: "Alarms ⏰", text: "Wake-up alarms, study blocks and reminders. They ring with sound + vibration, and you can snooze, stop, or start a focus block straight from the ring screen." },
    hi: { title: "अलार्म ⏰", text: "उठने के अलार्म, स्टडी ब्लॉक और रिमाइंडर। आवाज़ और वाइब्रेशन के साथ बजते हैं — स्नूज़, बंद या सीधे फोकस शुरू कर सकते हैं।" },
    te: { title: "అలారమ్‌లు ⏰", text: "లేవడానికి అలారమ్‌లు, స్టడీ బ్లాక్‌లు, రిమైండర్లు. శబ్దం + వైబ్రేషన్‌తో మోగుతాయి — స్నూజ్, ఆపు లేదా నేరుగా ఫోకస్ మొదలుపెట్టవచ్చు." }
  },
  {
    icon: "🔔",
    tab: "notifications",
    en: { title: "Notifications 🔔", text: "One inbox for everything I tell you — plus what is coming next. Set quiet hours, pick a sound, and allow phone notifications if you want me to reach you outside the tab." },
    hi: { title: "नोटिफिकेशन 🔔", text: "मैं जो बताता हूँ, सब एक जगह — और आगे क्या आने वाला है। शांत समय तय करें, आवाज़ चुनें, और चाहें तो फ़ोन नोटिफिकेशन की अनुमति दें।" },
    te: { title: "నోటిఫికేషన్లు 🔔", text: "నేను చెప్పేవన్నీ ఒకే ఇన్‌బాక్స్‌లో — ఇంకా రాబోయేవి కూడా. నిశ్శబ్ద సమయం పెట్టుకోండి, శబ్దం ఎంచుకోండి, కావాలంటే ఫోన్ నోటిఫికేషన్‌లు అనుమతించండి." }
  },
  {
    icon: "⏳",
    tab: "focus",
    en: { title: "Focus Timer ⏳", text: "Pomodoro-style blocks with automatic breaks. Every finished block becomes study time, XP, and (if it came from your plan) a ticked-off session." },
    hi: { title: "फोकस टाइमर ⏳", text: "पोमोडोरो ब्लॉक, अपने आप ब्रेक के साथ। हर पूरा ब्लॉक स्टडी टाइम, XP और प्लान का सत्र पूरा करता है।" },
    te: { title: "ఫోకస్ టైమర్ ⏳", text: "పొమొడోరో బ్లాక్‌లు, ఆటో విరామాలతో. ప్రతి పూర్తి బ్లాక్ స్టడీ టైమ్, XP అవుతుంది." }
  },
  {
    icon: "🛡️",
    tab: "shield",
    en: { title: "Focus Shield 🛡️", text: "This is your anti-doomscroll guard. Pick the site packs you want blocked and export a hosts file or DNS rules — that blocks them on the whole device. During every focus block I watch for escapes, and the urge button gives you 90 seconds of breathing before you decide." },
    hi: { title: "फोकस शील्ड 🛡️", text: "यह डूमस्क्रॉलिंग रोकने वाली शील्ड है। जो पैक ब्लॉक करने हैं चुनिए और hosts फ़ाइल या DNS नियम एक्सपोर्ट कीजिए — पूरे डिवाइस पर ब्लॉक हो जाएँगे। हर फोकस ब्लॉक में मैं भटकाव पर नज़र रखता हूँ, और इच्छा बटन 90 सेकंड की साँसें देता है।" },
    te: { title: "ఫోకస్ షీల్డ్ 🛡️", text: "ఇది మీ డూమ్‌స్క్రోలింగ్ గార్డ్. బ్లాక్ చేయాల్సిన ప్యాక్‌లు ఎంచుకుని hosts ఫైల్ లేదా DNS రూల్స్ ఎక్స్‌పోర్ట్ చేయండి — మొత్తం పరికరంలో బ్లాక్ అవుతాయి. ప్రతి ఫోకస్ బ్లాక్‌లో ఎస్కేప్‌లను గమనిస్తాను, ఇచ్ఛా బటన్ 90 సెకన్ల శ్వాస ఇస్తుంది." }
  },
  {
    icon: "🎵",
    tab: "music",
    en: { title: "Study Music 🎵", text: "Music I make live in your browser — warm pads, lo-fi, rain, brown noise and binaural alpha/theta waves. Mix instruments, ambience and brainwaves yourself, set a sleep timer, and it starts and stops with your focus block." },
    hi: { title: "स्टडी म्यूज़िक 🎵", text: "संगीत आपके ब्राउज़र में ही बनता है — गर्म पैड, लो-फ़ाई, बारिश, ब्राउन नॉइज़ और बाइनॉरल अल्फा/थीटा तरंगें। वाद्य, वातावरण और ब्रेनवेव ख़ुद मिलाइए, स्लीप टाइमर लगाइए — फोकस ब्लॉक के साथ चालू-बंद होगा।" },
    te: { title: "స్టడీ మ్యూజిక్ 🎵", text: "సంగీతం మీ బ్రౌజర్‌లోనే తయారవుతుంది — వెచ్చని ప్యాడ్‌లు, లో-ఫై, వర్షం, బ్రౌన్ నాయిస్, బైనారల్ తరంగాలు. వాద్యం, వాతావరణం, బ్రెయిన్‌వేవ్‌లు మీరే మిక్స్ చేయండి, స్లీప్ టైమర్ పెట్టండి." }
  },
  {
    icon: "🌳",
    tab: "forest",
    en: { title: "Study Forest 🌳", text: "Plant a tree and start the task. Finish it and the tree stays in your forest, you earn coins and your streak grows. Leave the app mid-session and it withers — that small deal is what makes focus real." },
    hi: { title: "स्टडी फ़ॉरेस्ट 🌳", text: "पेड़ लगाइए और काम शुरू कीजिए। पूरा हुआ तो पेड़ आपके फ़ॉरेस्ट में रहेगा, सिक्के मिलेंगे और स्ट्रीक बढ़ेगी। बीच में ऐप छोड़ा तो मुरझा जाएगा — यही छोटा-सा सौदा फोकस को असली बनाता है।" },
    te: { title: "స్టడీ ఫారెస్ట్ 🌳", text: "చెట్టు నాటి పని మొదలుపెట్టండి. పూర్తయితే చెట్టు మీ ఫారెస్ట్‌లో నిలుస్తుంది, నాణేలు, స్ట్రీక్ పెరుగుతాయి. మధ్యలో యాప్ వదిలితే వాడిపోతుంది — ఆ చిన్న ఒప్పందమే ఫోకస్‌ను నిజం చేస్తుంది." }
  },
  {
    icon: "📔",
    tab: "journal",
    en: { title: "Journal 📔", text: "Your personalised diary. The prompts are picked from what your day actually looked like — minutes focused, trees grown, escapes, tasks, exam countdown — and every evening I nudge you to write a line." },
    hi: { title: "जर्नल 📔", text: "आपकी व्यक्तिगत डायरी। सवाल आपके असली दिन से चुने जाते हैं — कितने मिनट पढ़े, पेड़, भटकाव, काम, परीक्षा काउंटडाउन — और हर शाम मैं एक लाइन लिखने को कहता हूँ।" },
    te: { title: "జర్నల్ 📔", text: "మీ వ్యక్తిగత డైరీ. ప్రశ్నలు మీ రోజు నుంచే ఎంపికవుతాయి — నిమిషాలు, చెట్లు, ఎస్కేప్‌లు, పనులు, పరీక్ష కౌంట్‌డౌన్ — ప్రతి సాయంత్రం ఒక లైన్ రాయమని గుర్తు చేస్తాను." }
  },
  {
    icon: "👨‍👩‍👧",
    tab: "guardian",
    en: { title: "Guardian 👨‍👩‍👧", text: "Want to show a parent or teacher how you are doing without handing over your diary? Create a code here: they get a read-only report with only the sections you tick, journal writing stays private unless you open it, and you can pause or rotate the code whenever you like." },
    hi: { title: "अभिभावक 👨‍👩‍👧", text: "डायरी सौंपे बिना माता-पिता या शिक्षक को प्रगति दिखानी है? यहाँ कोड बनाइए: उन्हें सिर्फ़-पढ़ने वाली रिपोर्ट मिलेगी, सिर्फ़ आपके चुने भाग, जर्नल निजी रहेगा, और कोड कभी भी रोक या बदल सकते हैं।" },
    te: { title: "గార్డియన్ 👨‍👩‍👧", text: "డైరీ ఇవ్వకుండా తల్లిదండ్రులు/టీచర్‌కు పురోగతి చూపించాలా? ఇక్కడ కోడ్ సృష్టించండి: చదవడానికి-మాత్రమే రిపోర్ట్, మీరు టిక్ చేసిన విభాగాలే, జర్నల్ ప్రైవేట్, కోడ్ ఎప్పుడైనా మార్చుకోవచ్చు." }
  },
  {
    icon: "⏱️",
    tab: "time",
    en: { title: "Time Tracking ⏱️", text: "Every focused minute logged automatically — daily goal, week chart and per-subject breakdown." },
    hi: { title: "टाइम ट्रैकिंग ⏱️", text: "हर फोकस मिनट अपने आप दर्ज — रोज़ का लक्ष्य, हफ़्ते का चार्ट, हर विषय का हिसाब।" },
    te: { title: "టైమ్ ట్రాకింగ్ ⏱️", text: "ప్రతి ఫోకస్ నిమిషం ఆటోగా నమోదు — రోజు లక్ష్యం, వారం చార్ట్, సబ్జెక్ట్ వారీగా." }
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
