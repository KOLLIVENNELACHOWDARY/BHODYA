// ---------- Bodhya UI strings: English / हिन्दी / తెలుగు ----------

export const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧', speech: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', speech: 'hi-IN' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳', speech: 'te-IN' }
]

export const LANG_NAME = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు' }

export const AGE_GROUPS = [
  {
    id: 'kid',
    emoji: '🧒',
    label: { en: 'Kid', hi: 'बच्चा', te: 'పిల్లలు' },
    range: { en: '5–10 years', hi: '5–10 साल', te: '5–10 సంవత్సరాలు' },
    desc: { en: 'Playful, simple words, lots of encouragement', hi: 'खेल-खेल में, आसान शब्द, ढेर सारा प्रोत्साहन', te: 'ఆటగా, సాధారణ పదాలు, ప్రోత్సాహం ఎక్కువ' }
  },
  {
    id: 'teen',
    emoji: '🧑‍🎓',
    label: { en: 'Teen', hi: 'किशोर', te: 'యువ విద్యార్థి' },
    range: { en: '11–17 years', hi: '11–17 साल', te: '11–17 సంవత్సరాలు' },
    desc: { en: 'School & exam focus, friendly study hacks', hi: 'स्कूल और परीक्षा पर ध्यान, मज़ेदार टिप्स', te: 'పాఠశాల, పరీక్షలపై దృష్టి, స్నేహపూర్వక టిప్స్' }
  },
  {
    id: 'college',
    emoji: '🎓',
    label: { en: 'College', hi: 'कॉलेज', te: 'కళాశాల' },
    range: { en: '18–24 years', hi: '18–24 साल', te: '18–24 సంవత్సరాలు' },
    desc: { en: 'Deep concepts, assignments, career-prep', hi: 'गहरे कॉन्सेप्ट, असाइनमेंट, करियर की तैयारी', te: 'లోతైన అంశాలు, అసైన్మెంట్లు, కెరీర్ సన్నద్ధత' }
  },
  {
    id: 'pro',
    emoji: '💼',
    label: { en: 'Professional', hi: 'प्रोफेशनल', te: 'నిపుణులు' },
    range: { en: '25+ years', hi: '25+ साल', te: '25+ సంవత్సరాలు' },
    desc: { en: 'Concise, formal, no-nonsense learning', hi: 'संक्षिप्त, औपचारिक, सीधी बात', te: 'క్లుప్తంగా, క్రమశిక్షణతో, నేరుగా' }
  }
]

export const TONES = {
  auto:  { label: { en: 'Auto (matches my age)', hi: 'ऑटो (उम्र के हिसाब से)', te: 'ఆటో (వయస్సు ప్రకారం)' }, emoji: '✨' },
  fun:   { label: { en: 'Fun & playful', hi: 'मज़ेदार', te: 'సరదాగా' }, emoji: '😄' },
  simple:{ label: { en: 'Simple & easy', hi: 'सरल', te: 'సింపుల్' }, emoji: '🌱' },
  pro:   { label: { en: 'Professional', hi: 'प्रोफेशनल', te: 'ప్రొఫెషనల్' }, emoji: '💼' }
}

export const UI = {
  en: {
    appName: 'Bodhya',
    tagline: 'Your adaptive study companion',
    nav: { home: 'Home', quiz: 'Quiz Arena', planner: 'Planner', progress: 'Progress', settings: 'Settings' },
    chat: {
      title: 'Bodhya',
      subtitle: 'Your offline guide — stuck-help, reminders & tours. Voice in & out! 🎤🔊',
      placeholder: 'Type a message…',
      mic: 'Speak instead of typing',
      voiceOn: 'Voice replies on',
      voiceOff: 'Voice replies off',
      listening: 'Listening…',
      noSpeech: "I couldn't hear you — please try again, or type instead.",
      micDenied: 'Microphone permission was blocked. Allow mic access in your browser to use voice.',
      noMic: 'Voice input needs Chrome or Edge with a microphone.',
      open: 'Chat with Bodhya',
      close: 'Close chat',
      clear: 'Clear chat',
      typing: 'Bodhya is thinking…'
    },
    onboarding: {
      title: 'Welcome to Bodhya!',
      step1: { title: 'Hi there! 👋', text: 'I am Bodhya (बोध्य — Sanskrit for "knowledge", "that which is to be understood") — your personal guide, like the banyan tree (वटवृक्ष), the tree of knowledge under which every learner finds shelter 🌳. No accounts, no API keys, everything runs in your browser. I help when you\'re stuck, remind you when you drift, and show you around with guided tours. And yes — you can talk to me with your voice, and I will talk back! 🎤🔊' },
      langQ: 'Which language should we talk in?',
      nameQ: 'What should I call you?',
      namePh: 'Your name…',
      ageQ: 'Which group fits you best?',
      toneQ: 'How should I talk to you?',
      cta: { next: 'Next', back: 'Back', start: 'Start learning 🚀' }
    },
    tour: {
      skip: 'Skip tour',
      next: 'Next',
      prev: 'Back',
      done: 'Got it!',
      of: 'of',
      restart: 'Restart tour'
    },
    quiz: {
      title: 'Quiz Arena',
      desc: 'Questions tuned to your level. Beat the Boss Battle!',
      start: 'Start Boss Battle',
      again: 'Play again',
      q: 'Question',
      correct: 'Correct!',
      wrong: 'Not quite — but every attempt makes you better. Try again! 💪',
      score: 'Your score',
      xp: 'XP earned',
      levelUp: 'LEVEL UP!',
      youAre: 'You are at level',
      nextLevel: 'XP needed for next level',
      bossDefeated: '🏆 Boss defeated!'
    },
    planner: {
      title: 'Study Planner',
      desc: 'Plan your day — Bodhya can add tasks by chat too.',
      add: 'Add task',
      subject: 'Subject',
      subjectPh: 'e.g. Maths',
      minutes: 'Minutes',
      today: "Today's plan",
      empty: 'No tasks yet. Try typing in chat: “add maths 30 minutes”',
      done: 'Done',
      clear: 'Clear finished'
    },
    progress: {
      title: 'Your Progress',
      level: 'Learning level',
      xp: 'Total XP',
      stats: { quizzes: 'Quizzes taken', accuracy: 'Accuracy', tasks: 'Tasks done', topics: 'Topics learned', streak: 'Day streak' },
      adaptive: '🧠 Adaptive engine status',
      adaptiveText: 'Bodhya tunes difficulty to your answers, chat and quiz performance. Keep going!',
      reset: 'Reset all progress',
      resetDone: 'Progress reset.'
    },
    settings: {
      title: 'Settings',
      profile: 'Your profile',
      language: 'Language',
      tone: 'Chat tone',
      tour: 'Guide',
      voice: 'Voice',
      voiceOutput: 'Voice replies',
      voiceOutputDesc: 'Bodhya reads its replies aloud — free browser speech, no API keys.',
      voiceInput: 'Voice input',
      voiceInputDesc: 'Tap the 🎤 mic in chat and speak. Works in Chrome/Edge for English, Hindi & Telugu.',
      testVoice: 'Test voice',
      about: 'About',
      aboutText: 'Bodhya v1.1 — a fully offline, rule-based adaptive study companion. No API keys, no servers, no tracking. Voice input & output use your browser’s free speech tools. Your data stays in your browser.'
    },
    common: { save: 'Save', saved: 'Saved ✓', cancel: 'Cancel', start: 'Start', skip: 'Skip' }
  },
  hi: {
    appName: 'Bodhya',
    tagline: 'आपका एडेप्टिव स्टडी साथी',
    nav: { home: 'होम', quiz: 'क्विज़ एरीना', planner: 'प्लानर', progress: 'प्रोग्रेस', settings: 'सेटिंग्स' },
    chat: {
      title: 'Bodhya',
      subtitle: 'आपका ऑफ़लाइन गाइड — अटकने पर मदद, रिमाइंडर और टूर। आवाज़ से भी! 🎤🔊',
      placeholder: 'संदेश लिखें…',
      mic: 'बोलकर लिखें',
      voiceOn: 'आवाज़ में जवाब चालू',
      voiceOff: 'आवाज़ में जवाब बंद',
      listening: 'सुन रहा हूँ…',
      noSpeech: 'आपकी आवाज़ सुनाई नहीं दी — फिर कोशिश करें, या लिखकर भेजें।',
      micDenied: 'माइक की अनुमति नहीं मिली। आवाज़ के लिए ब्राउज़र में माइक अलाउ करें।',
      noMic: 'वॉइस इनपुट के लिए Chrome या Edge और माइक्रोफ़ोन चाहिए।',
      open: 'Bodhya से बात करें',
      close: 'चैट बंद करें',
      clear: 'चैट साफ़ करें',
      typing: 'Bodhya सोच रहा है…'
    },
    onboarding: {
      title: 'Bodhya में स्वागत है!',
      step1: { title: 'नमस्ते! 👋', text: 'मैं Bodhya (बोध्य — ज्ञान) हूँ — आपका पर्सनल गाइड, वटवृक्ष की तरह जो हर सीखने वाले को छाँव देता है 🌳। न कोई अकाउंट, न API key — सब कुछ आपके ब्राउज़र में चलता है। अटकने पर मदद, याद दिलाना और गाइडेड टूर — यही मेरा काम है। और हाँ — आप मुझसे आवाज़ में बात कर सकते हैं, और मैं भी जवाब दूँगा! 🎤🔊' },
      langQ: 'हम किस भाषा में बात करें?',
      nameQ: 'मैं आपको क्या बुलाऊँ?',
      namePh: 'आपका नाम…',
      ageQ: 'आप किस समूह में आते हैं?',
      toneQ: 'मैं आपसे कैसे बात करूँ?',
      cta: { next: 'आगे', back: 'पीछे', start: 'सीखना शुरू करें 🚀' }
    },
    tour: {
      skip: 'टूर छोड़ें',
      next: 'आगे',
      prev: 'पीछे',
      done: 'समझ गया!',
      of: 'में से',
      restart: 'टूर फिर से शुरू करें'
    },
    quiz: {
      title: 'क्विज़ एरीना',
      desc: 'सवाल आपके स्तर के हिसाब से। बॉस बैटल जीतो!',
      start: 'बॉस बैटल शुरू करें',
      again: 'फिर से खेलें',
      q: 'सवाल',
      correct: 'सही जवाब!',
      wrong: 'कोई बात नहीं — हर कोशिश से आप बेहतर बनते हैं। फिर से कोशिश करें! 💪',
      score: 'आपका स्कोर',
      xp: 'XP मिला',
      levelUp: 'लेवल अप!',
      youAre: 'आपका लेवल',
      nextLevel: 'अगले लेवल के लिए XP',
      bossDefeated: '🏆 बॉस हार गया!'
    },
    planner: {
      title: 'स्टडी प्लानर',
      desc: 'दिन की योजना बनाओ — Bodhya चैट से भी टास्क जोड़ सकता है।',
      add: 'टास्क जोड़ें',
      subject: 'विषय',
      subjectPh: 'जैसे: गणित',
      minutes: 'मिनट',
      today: 'आज का प्लान',
      empty: 'अभी कोई टास्क नहीं। चैट में लिखो: “गणित 30 मिनट जोड़ो”',
      done: 'पूरा',
      clear: 'पूरे किए हुए हटाएँ'
    },
    progress: {
      title: 'आपकी प्रोग्रेस',
      level: 'लर्निंग लेवल',
      xp: 'कुल XP',
      stats: { quizzes: 'क्विज़ दिए', accuracy: 'सटीकता', tasks: 'टास्क पूरे', topics: 'टॉपिक सीखे', streak: 'स्ट्रीक' },
      adaptive: '🧠 एडेप्टिव इंजन स्टेटस',
      adaptiveText: 'Bodhya आपके जवाब, चैट और क्विज़ के हिसाब से मुश्किल तय करता है। चलते रहो!',
      reset: 'सारी प्रोग्रेस रीसेट करें',
      resetDone: 'प्रोग्रेस रीसेट हो गई।'
    },
    settings: {
      title: 'सेटिंग्स',
      profile: 'आपकी प्रोफ़ाइल',
      language: 'भाषा',
      tone: 'चैट का अंदाज़',
      tour: 'गाइड',
      voice: 'आवाज़',
      voiceOutput: 'आवाज़ में जवाब',
      voiceOutputDesc: 'Bodhya अपने जवाब ज़ोर से पढ़कर सुनाएगा — ब्राउज़र की मुफ्त आवाज़, कोई API key नहीं।',
      voiceInput: 'आवाज़ इनपुट',
      voiceInputDesc: 'चैट में 🎤 माइक दबाकर बोलिए। Chrome/Edge में हिंदी, अंग्रेज़ी और तेलुगु में काम करता है।',
      testVoice: 'आवाज़ टेस्ट करें',
      about: 'बारे में',
      aboutText: 'Bodhya v1.1 — पूरी तरह ऑफ़लाइन, रूल-बेस्ड एडेप्टिव स्टडी साथी। न API key, न सर्वर, न ट्रैकिंग। आवाज़ के लिए आपके ब्राउज़र की मुफ्त स्पीच सुविधा। आपका डेटा आपके ब्राउज़र में ही रहता है।'
    },
    common: { save: 'सेव करें', saved: 'सेव हो गया ✓', cancel: 'रद्द करें', start: 'शुरू करें', skip: 'छोड़ें' }
  },
  te: {
    appName: 'Bodhya',
    tagline: 'మీ అడాప్టివ్ స్టడీ సహచరుడు',
    nav: { home: 'హోమ్', quiz: 'క్విజ్ అరేనా', planner: 'ప్లానర్', progress: 'ప్రోగ్రెస్', settings: 'సెట్టింగ్స్' },
    chat: {
      title: 'Bodhya',
      subtitle: 'మీ ఆఫ్‌లైన్ గైడ్ — స్టక్-హెల్ప్, రిమైండర్లు & టూర్‌లు. వాయిస్ లో కూడా! 🎤🔊',
      placeholder: 'సందేశం టైప్ చేయండి…',
      mic: 'మాట్లాడి టైప్ చేయండి',
      voiceOn: 'వాయిస్ సమాధానాలు ఆన్',
      voiceOff: 'వాయిస్ సమాధానాలు ఆఫ్',
      listening: 'వింటున్నాను…',
      noSpeech: 'మీ గొంతు వినిపించలేదు — మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.',
      micDenied: 'మైక్ అనుమతి బ్లాక్ అయింది. వాయిస్ కోసం బ్రౌజర్ లో మైక్ అనుమతించండి.',
      noMic: 'వాయిస్ ఇన్‌పుట్ కి Chrome లేదా Edge మరియు మైక్రోఫోన్ అవసరం.',
      open: 'Bodhya తో మాట్లాడండి',
      close: 'చాట్ మూసివేయండి',
      clear: 'చాట్ క్లియర్ చేయండి',
      typing: 'Bodhya ఆలోచిస్తోంది…'
    },
    onboarding: {
      title: 'Bodhya కి స్వాగతం!',
      step1: { title: 'నమస్కారం! 👋', text: 'నేను Bodhya (బోధ్య — జ్ఞానం) ని — జ్ఞాన వృక్షం మర్రి చెట్టులా ప్రతి విద్యార్థికి నీడనిచ్చే మీ వ్యక్తిగత గైడ్ 🌳. అకౌంట్ లు, API కీలు లేవు — ప్రతిదీ మీ బ్రౌజర్ లోనే నడుస్తుంది. ఇరుక్కుంటే సహాయం, గుర్తుచేయడం, గైడెడ్ టూర్‌లు — ఇదే నా పని. ఇంకా మీరు వాయిస్ లో మాట్లాడవచ్చు — నేను కూడా బదులు చెబుతాను! 🎤🔊' },
      langQ: 'మనం ఏ భాషలో మాట్లాడుకుందాం?',
      nameQ: 'నేను మిమ్మల్ని ఏమని పిలవాలి?',
      namePh: 'మీ పేరు…',
      ageQ: 'మీరు ఏ వర్గానికి చెందినవారు?',
      toneQ: 'నేను మీతో ఎలా మాట్లాడాలి?',
      cta: { next: 'తదుపరి', back: 'వెనుకకు', start: 'నేర్చుకోవడం మొదలుపెట్టండి 🚀' }
    },
    tour: {
      skip: 'టూర్ దాటవేయి',
      next: 'తదుపరి',
      prev: 'వెనుకకు',
      done: 'అర్థమైంది!',
      of: 'లో',
      restart: 'టూర్ మళ్లీ ప్రారంభించండి'
    },
    quiz: {
      title: 'క్విజ్ అరేనా',
      desc: 'మీ స్థాయికి తగిన ప్రశ్నలు. బాస్ బాటిల్ గెలవండి!',
      start: 'బాస్ బాటిల్ మొదలుపెట్టండి',
      again: 'మళ్లీ ఆడండి',
      q: 'ప్రశ్న',
      correct: 'సరైన సమాధానం!',
      wrong: 'పర్వాలేదు — ప్రతి ప్రయత్నం మిమ్మల్ని మెరుగుపరుస్తుంది. మళ్లీ ప్రయత్నించండి! 💪',
      score: 'మీ స్కోర్',
      xp: 'XP సంపాదించారు',
      levelUp: 'లెవల్ అప్!',
      youAre: 'మీ లెవల్',
      nextLevel: 'తదుపరి లెవల్ కి కావాల్సిన XP',
      bossDefeated: '🏆 బాస్ ఓడిపోయాడు!'
    },
    planner: {
      title: 'స్టడీ ప్లానర్',
      desc: 'రోజు ప్రణాళిక వేయండి — Bodhya చాట్ ద్వారా కూడా టాస్కులు జోడిస్తుంది.',
      add: 'టాస్క్ జోడించండి',
      subject: 'సబ్జెక్ట్',
      subjectPh: 'ఉదా: గణితం',
      minutes: 'నిమిషాలు',
      today: 'నేటి ప్రణాళిక',
      empty: 'ఇంకా టాస్క్ లేదు. చాట్ లో ఇలా రాయండి: “గణితం 30 నిమిషాలు జోడించు”',
      done: 'పూర్తయింది',
      clear: 'పూర్తయినవి తొలగించు'
    },
    progress: {
      title: 'మీ ప్రోగ్రెస్',
      level: 'లెర్నింగ్ లెవల్',
      xp: 'మొత్తం XP',
      stats: { quizzes: 'క్విజ్‌లు', accuracy: 'ఖచ్చితత్వం', tasks: 'టాస్కులు పూర్తి', topics: 'టాపిక్‌లు నేర్చుకున్నారు', streak: 'రోజుల స్ట్రీక్' },
      adaptive: '🧠 అడాప్టివ్ ఇంజన్ స్టేటస్',
      adaptiveText: 'Bodhya మీ సమాధానాలు, చాట్, క్విజ్ పనితీరు బట్టి కష్టతరాన్ని మారుస్తుంది. కొనసాగించండి!',
      reset: 'అన్ని ప్రోగ్రెస్ రీసెట్ చేయండి',
      resetDone: 'ప్రోగ్రెస్ రీసెట్ అయింది.'
    },
    settings: {
      title: 'సెట్టింగ్స్',
      profile: 'మీ ప్రొఫైల్',
      language: 'భాష',
      tone: 'చాట్ ధోరణి',
      tour: 'గైడ్',
      voice: 'వాయిస్',
      voiceOutput: 'వాయిస్ సమాధానాలు',
      voiceOutputDesc: 'Bodhya తన సమాధానాలను బిగ్గరగా చదువుతుంది — బ్రౌజర్ ఉచిత స్పీచ్, API కీలు లేవు.',
      voiceInput: 'వాయిస్ ఇన్‌పుట్',
      voiceInputDesc: 'చాట్ లో 🎤 మైక్ నొక్కి మాట్లాడండి. Chrome/Edge లో తెలుగు, హిందీ, ఇంగ్లీష్ లో పనిచేస్తుంది.',
      testVoice: 'వాయిస్ పరీక్షించండి',
      about: 'గురించి',
      aboutText: 'Bodhya v1.1 — పూర్తిగా ఆఫ్‌లైన్, రూల్ ఆధారిత అడాప్టివ్ స్టడీ సహచరుడు. API కీలు లేవు, సర్వర్లు లేవు, ట్రాకింగ్ లేదు. వాయిస్ కోసం బ్రౌజర్ ఉచిత స్పీచ్ సౌకర్యం. మీ డేటా మీ బ్రౌజర్ లోనే ఉంటుంది.'
    },
    common: { save: 'సేవ్ చేయండి', saved: 'సేవ్ అయింది ✓', cancel: 'రద్దు చేయండి', start: 'మొదలుపెట్టండి', skip: 'దాటవేయి' }
  }
}

function lookup(dict, key) {
  if (!key.includes('.')) return dict[key]
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
}

export function t(lang, key, vars = {}) {
  const dict = UI[lang] || UI.en
  let s = lookup(dict, key)
  if (s === undefined) s = lookup(UI.en, key)
  if (s && typeof s === 'object') s = s.en || ''
  s = String(s ?? '')
  Object.entries(vars).forEach(([k, v]) => { s = s.split('{' + k + '}').join(v) })
  return s
}

export function detectLangOf(text) {
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  return 'en'
}
