// ---------- Bodhya response builder: tone-aware, multilingual, no APIs ----------


export const LEVEL_NAMES = {
  1: { en: 'Curious Beginner', hi: 'जिज्ञासु शुरुआत', te: 'ఆసక్తిగల ప్రారంభకుడు' },
  2: { en: 'Steady Explorer', hi: 'स्थिर खोजी', te: 'నిబద్ధ అన్వేషకుడు' },
  3: { en: 'Sharp Thinker', hi: 'तेज़ सोच वाला', te: 'పదునైన ఆలోచనాపరుడు' },
  4: { en: 'Deep Learner', hi: 'गहरा सीखने वाला', te: 'లోతుగా నేర్చుకునేవాడు' },
  5: { en: 'Master Mind', hi: 'मास्टर माइंड', te: 'మాస్టర్ మైండ్' }
}

const R = {
  greet: {
    en: {
      text: [
        "Hey {name}! 👋 Ready to learn something new today?",
        "Hello {name}! Great to see you. What shall we study? 📚",
        "Hi {name}! I'm Bodhya — your study buddy. What do you need help with?"
      ],
      quick: ['What can you do?', 'Help me', 'Start a quiz'],
      kid: "Hiiii {name}! 🌳🌟 I'm so happy to see you! Want to learn something fun today?",
      pro: "Hello {name}. Ready when you are — what would you like to work on?"
    },
    hi: {
      text: [
        "नमस्ते {name}! 👋 क्या आज कुछ नया सीखने का मन है?",
        "नमस्ते {name}! आपको देखकर अच्छा लगा। आज क्या पढ़ेंगे? 📚",
        "हाय {name}! मैं Bodhya हूँ — आपका स्टडी बडी। किसमें मदद चाहिए?"
      ],
      quick: ['तुम क्या कर सकते हो?', 'मदद करो', 'क्विज़ शुरू करो'],
      kid: "नमस्ते {name}! 🌳🌟 तुमसे मिलकर खुशी हुई! आज कुछ मज़ेदार सीखना है?",
      pro: "नमस्ते {name}। बताइए, आज किस विषय पर काम करना है?"
    },
    te: {
      text: [
        "నమస్కారం {name}! 👋 ఈరోజు కొత్తగా ఏదైనా నేర్చుకుందాం?",
        "నమస్కారం {name}! మిమ్మల్ని చూడటం ఆనందంగా ఉంది. ఏం చదువుదాం? 📚",
        "హాయ్ {name}! నేను Bodhya ని — మీ స్టడీ స్నేహితుడిని. దేనిలో సహాయం కావాలి?"
      ],
      quick: ['నువ్వు ఏం చేయగలవు?', 'సహాయం చేయి', 'క్విజ్ మొదలుపెట్టు'],
      kid: "నమస్కారం {name}! 🌳🌟 నిన్ను చూడగానే సంతోషంగా ఉంది! ఈరోజు ఏదైనా సరదాగా నేర్చుకుందామా?",
      pro: "నమస్కారం {name}. ఏ విషయంపై పని చేద్దాం?"
    }
  },
  bye: {
    en: {
      text: ["Bye {name}! 👋 Come back soon — I'll be here waiting. Happy studying!", "See you later! Don't forget: 20 minutes of study today beats 2 hours tomorrow. 📚"],
      quick: ['Start a quiz', 'Motivate me'],
      kid: "Bye bye {name}! 🌳 Come back soon okay? Study a little and play a little!",
      pro: "Goodbye {name}. Consistent small sessions compound. See you next time."
    },
    hi: {
      text: ["अलविदा {name}! 👋 जल्दी लौटना — मैं यहीं हूँ। पढ़ाई मुबारक!", "फिर मिलेंगे! याद रखो: आज 20 मिनट की पढ़ाई कल के 2 घंटे से बेहतर है। 📚"],
      quick: ['क्विज़ शुरू करो', 'मोटिवेशन दो'],
      kid: "अलविदा {name}! 🌳 जल्दी आना ठीक? थोड़ा पढ़ो और थोड़ा खेलो!",
      pro: "अलविदा {name}। नियमित छोटे सत्र ही बड़े परिणाम देते हैं। फिर मिलेंगे।"
    },
    te: {
      text: ["వీడ్కోలు {name}! 👋 త్వరగా రండి — నేను ఇక్కడే ఉంటాను. సంతోషంగా చదువుకోండి!", "మళ్లీ కలుద్దాం! గుర్తుంచుకోండి: రేపటి 2 గంటల కంటే ఈరోజు 20 నిమిషాల చదువు బెటర్. 📚"],
      quick: ['క్విజ్ మొదలుపెట్టు', 'ప్రేరణ ఇవ్వు'],
      kid: "బై బై {name}! 🌳 త్వరగా రా సరేనా? కాస్త చదువు, కాస్త ఆట!",
      pro: "వీడ్కోలు {name}. క్రమం తప్పని చిన్న సెషన్లే ఫలితాలిస్తాయి. మళ్లీ కలుద్దాం."
    }
  },
  thanks: {
    en: { text: ["You're welcome, {name}! 😊 That's what I'm here for.", "Anytime! Learning together is fun. 🎉", "Glad I could help! Come back whenever you're stuck."], quick: ['What can you do?', 'Tell me a joke'] },
    hi: { text: ["कोई बात नहीं, {name}! 😊 इसी के लिए तो हूँ।", "हमेशा! साथ सीखना मज़ेदार है। 🎉", "खुशी हुई मदद करके! जब भी अटको, आ जाना।"], quick: ['तुम क्या कर सकते हो?', 'चुटकुला सुनाओ'] },
    te: { text: ["ఏమి ఫర్వాలేదు, {name}! 😊 అందుకే నేను ఉన్నాను.", "ఎప్పుడైనా! కలిసి నేర్చుకోవడం సరదా. 🎉", "సహాయం చేయగలిగాను అని సంతోషం! ఇరుక్కున్నప్పుడు రండి."], quick: ['నువ్వు ఏం చేయగలవు?', 'జోక్ చెప్పు'] }
  },
  help: {
    en: {
      text: [
        "Of course, {name}! I can help you with:\n🆘 **Getting unstuck** — tell me what's confusing on any page\n🧭 **App tour** — say \"show me around\"\n🎮 **Quizzes** — say \"start a quiz\"\n📅 **Planning** — say \"add maths 30 minutes\"\n📊 **Progress** — ask \"how am I doing?\"\n🎤 **Voice** — tap the mic to talk, and I read replies aloud 🔊\n\nWhere shall we start?",
        "I'm here for you! Ask me to show you around, help you when stuck, plan your day, or start a quiz. What do you need?"
      ],
      quick: ['Show me around', "I'm stuck", 'Start a quiz', 'Add maths 30 min'],
      kid: "Of course! I can help when you're stuck, play quiz games, plan your day, or show you around! What first? 🌟",
      pro: "How can I help? I cover navigation, stuck-help, onboarding tours, assessments, scheduling and progress analytics. State your need."
    },
    hi: {
      text: [
        "ज़रूर, {name}! मैं इन चीज़ों में मदद कर सकता हूँ:\n🆘 **अटकने से निकालना** — किसी भी पेज पर बताइए क्या समझ नहीं आया\n🧭 **ऐप टूर** — \"घुमाओ\" कहो\n🎮 **क्विज़** — \"क्विज़ शुरू करो\"\n📅 **प्लानिंग** — \"गणित 30 मिनट जोड़ो\"\n📊 **प्रोग्रेस** — पूछो \"मेरी प्रोग्रेस कैसी है?\"\n🎤 **आवाज़** — माइक से बोलो, मैं जवाब ज़ोर से पढ़ूँगा 🔊\n\nकहाँ से शुरू करें?",
        "मैं आपके लिए हूँ! टूर, अटकने पर मदद, प्लानिंग या क्विज़ — जो चाहिए वो माँग लो।"
      ],
      quick: ['घुमाओ', 'मैं अटक गया', 'क्विज़ शुरू करो', 'गणित 30 मिनट जोड़ो'],
      kid: "बिल्कुल! अटको तो मदद करता हूँ, क्विज़ खेलता हूँ, प्लान बनाता हूँ, और ऐप घुमाता हूँ! पहले क्या करें? 🌟",
      pro: "बताइए किसमें मदद करूँ — नेविगेशन, स्टक-हेल्प, ऑनबोर्डिंग, आकलन, समय-नियोजन या प्रगति विश्लेषण।"
    },
    te: {
      text: [
        "తప్పకుండా, {name}! నేను వీటిలో సహాయం చేయగలను:\n🆘 **ఇరుక్కోకుండా చూడటం** — ఏ పేజీలో ఏం అర్థం కాలేదో చెప్పండి\n🧭 **యాప్ టూర్** — \"చూపించు\" అనండి\n🎮 **క్విజ్‌లు** — \"క్విజ్ మొదలుపెట్టు\"\n📅 **ప్లానింగ్** — \"గణితం 30 నిమిషాలు జోడించు\"\n📊 **ప్రోగ్రెస్** — \"నా ప్రోగ్రెస్ ఎలా ఉంది?\" అడగండి\n🎤 **వాయిస్** — మైక్ తో మాట్లాడండి, జవాబులు బిగ్గరగా వింటారు 🔊\n\nఎక్కడి నుంచి మొదలుపెడదాం?",
        "నేను మీ కోసం ఉన్నాను! టూర్, ఇరుక్కున్నప్పుడు సహాయం, ప్లానింగ్ లేదా క్విజ్ — ఏది కావాలంటే అది అడగండి."
      ],
      quick: ['చూపించు', 'నేను ఇరుక్కున్నా', 'క్విజ్ మొదలుపెట్టు', 'గణితం 30 నిమిషాలు జోడించు'],
      kid: "తప్పకుండా! ఇరుక్కుంటే సహాయం, క్విజ్ ఆటలు, ప్లాన్, టూర్ — ముందు ఏం చేద్దాం? 🌟",
      pro: "ఏ విషయంలో సహాయం కావాలో చెప్పండి — నావిగేషన్, స్టక్-హెల్ప్, ఆన్‌బోర్డింగ్, అంచనా, ప్రణాళిక లేదా పురోగతి విశ్లేషణ."
    }
  },
  tour: {
    en: {
      text: [
        "Great idea! I'll show you around the whole app. 🗺️ Starting the guided tour now — follow the highlights!",
        "Let's explore Bodhya together! 🗺️ Watch for the glowing boxes — that's me showing you where everything lives."
      ],
      quick: ['What can you do?'],
      action: 'startTour'
    },
    hi: {
      text: ["बढ़िया! मैं आपको पूरा ऐप घुमाता हूँ। 🗺️ गाइडेड टूर शुरू — हाइलाइट्स पर नज़र रखिए!"],
      quick: ['तुम क्या कर सकते हो?'],
      action: 'startTour'
    },
    te: {
      text: ["మంచి ఆలోచన! మొత్తం యాప్ ని చూపిస్తాను. 🗺️ గైడెడ్ టూర్ మొదలవుతోంది — హైలైట్‌లను అనుసరించండి!"],
      quick: ['నువ్వు ఏం చేయగలవు?'],
      action: 'startTour'
    }
  },
  stuck: {
    en: {
      text: [
        "No worries, {name} — getting stuck is how learning starts! 🙌 You're currently on **{section}**. Tell me exactly what happened and I'll walk you through it.",
        "Don't worry! I'm right here. 🤝 You're on the {section} page — try tapping the chat button (me!) anytime, or ask me \"how do I…\" and I'll guide you step by step."
      ],
      quick: ['Show me around', 'Help me', 'What can you do?'],
      kid: "Don't worry {name}! 🌳 Even superheroes get stuck. Tell me what happened and I'll fix it with you!",
      pro: "Understood. State the issue on the {section} module and I'll provide the exact steps."
    },
    hi: {
      text: [
        "कोई बात नहीं, {name} — अटकना ही सीखने की शुरुआत है! 🙌 आप अभी **{section}** पर हैं। बताइए क्या हुआ, मैं आपको पूरा रास्ता दिखाऊँगा।",
        "घबराइए मत! मैं यहीं हूँ। 🤝 आप {section} पेज पर हैं — कभी भी चैट बटन दबाइए, या \"कैसे करूँ…\" पूछिए।"
      ],
      quick: ['घुमाओ', 'मदद करो', 'तुम क्या कर सकते हो?'],
      kid: "परेशान मत हो {name}! 🌳 हीरो भी अटकते हैं। बताओ क्या हुआ, हम मिलकर ठीक करेंगे!",
      pro: "समझ गया। {section} मॉड्यूल की समस्या बताइए, मैं सटीक कदम बताऊँगा।"
    },
    te: {
      text: [
        "ఫర్వాలేదు, {name} — ఇరుక్కోవడమే నేర్చుకోవడం మొదలు! 🙌 మీరు ప్రస్తుతం **{section}** లో ఉన్నారు. ఏం జరిగిందో చెప్పండి, నేను దారి చూపిస్తాను.",
        "భయపడకండి! నేను ఇక్కడే ఉన్నాను. 🤝 మీరు {section} పేజీలో ఉన్నారు — ఎప్పుడైనా చాట్ బటన్ నొక్కండి లేదా \"ఎలా చేయాలి…\" అడగండి."
      ],
      quick: ['చూపించు', 'సహాయం చేయి', 'నువ్వు ఏం చేయగలవు?'],
      kid: "బెంగ పెట్టుకోకు {name}! 🌳 హీరోలు కూడా ఇరుక్కుంటారు. ఏం జరిగిందో చెప్పు, కలిసి సరిచేద్దాం!",
      pro: "అర్థమైంది. {section} మాడ్యూల్ సమస్య చెప్పండి — సరైన దశలు చూపిస్తాను."
    }
  },
  capabilities: {
    en: {
      text: [
        "I'm Bodhya — your offline guide! 🌳 I don't teach topics; I make sure you never feel lost:\n\n🆘 **Help when stuck** — say \"I'm stuck\" on any page\n🧭 **Guided tour** — say \"show me around\"\n⏰ **Reminders** — I nudge you with \"are you there?\" when you go quiet\n🎮 **Quiz Arena** — \"start a boss battle\" (questions tuned to you)\n📄 **Notes quiz** — \"make a quiz from my notes\"\n📅 **Planner** — \"add maths 30 minutes\"\n📊 **Progress** — \"how am I doing?\"\n🎤 **Voice** — talk with the mic, hear replies aloud 🔊\n🗣️ **3 languages** — English, हिन्दी, తెలుగు\n\nNo API keys, no internet needed, no tracking — everything stays in your browser! 🔒",
        "Think of me as your personal app guide: I unstick you, remind you, tour you around, and track your progress — all offline. Try \"show me around\" or \"start a quiz\"!"
      ],
      quick: ['Explain photosynthesis', 'Start a quiz', 'Add maths 30 min', 'Show me around'],
      kid: "I help you when you're stuck, remind you to keep going, show you around the app, and play quiz games! All without internet! 🌳✨",
      pro: "Capabilities: contextual stuck-help, guided onboarding tours, idle reminders, adaptive assessments, task scheduling via chat, progress analytics, multilingual interface (EN/HI/TE), voice in/out, offline & private."
    },
    hi: {
      text: [
        "मैं Bodhya हूँ — आपका ऑफ़लाइन गाइड! 🌳 मैं टॉपिक नहीं पढ़ाता; मैं ये सुनिश्चित करता हूँ कि आप कभी खोए न महसूस करें:\n\n🆘 **अटकने पर मदद** — किसी भी पेज पर \"मैं अटक गया\" कहिए\n🧭 **गाइडेड टूर** — \"घुमाओ\" कहिए\n⏰ **रिमाइंडर** — चुप रहने पर \"क्या आप वहाँ हैं?\" पूछता हूँ\n🎮 **क्विज़ एरीना** — \"बॉस बैटल शुरू करो\" (सवाल आपके लिए)\n📄 **नोट्स क्विज़** — \"मेरे नोट्स से क्विज़ बनाओ\"\n📅 **प्लानर** — \"गणित 30 मिनट जोड़ो\"\n📊 **प्रोग्रेस** — \"मेरी प्रोग्रेस कैसी है?\"\n🎤 **आवाज़** — माइक से बोलो, जवाब सुनो 🔊\n🗣️ **3 भाषाएँ** — English, हिन्दी, తెలుగు\n\nन API key, न इंटरनेट, न ट्रैकिंग — सब कुछ आपके ब्राउज़र में! 🔒",
        "मुझे अपना पर्सनल ऐप गाइड समझो: अटकने पर मदद, रिमाइंडर, टूर और प्रोग्रेस — सब ऑफ़लाइन। \"घुमाओ\" या \"क्विज़ शुरू करो\" आज़माओ!"
      ],
      quick: ['प्रकाश संश्लेषण समझाओ', 'क्विज़ शुरू करो', 'गणित 30 मिनट जोड़ो', 'घुमाओ'],
      kid: "मैं अटकने पर मदद करता हूँ, याद दिलाता हूँ, ऐप घुमाता हूँ और क्विज़ खेलता हूँ! बिना इंटरनेट! 🌳✨",
      pro: "क्षमताएँ: कॉन्टेक्स्टुअल स्टक-हेल्प, गाइडेड ऑनबोर्डिंग टूर, आइडल रिमाइंडर, एडेप्टिव आकलन, चैट से टास्क नियोजन, प्रगति विश्लेषण, बहुभाषी इंटरफ़ेस (EN/HI/TE), वॉइस इन/आउट, ऑफ़लाइन और प्राइवेट।"
    },
    te: {
      text: [
        "నేను Bodhya ని — మీ ఆఫ్‌లైన్ గైడ్! 🌳 నేను టాపిక్‌లు నేర్పించను; మీరు ఎప్పుడూ దారి తప్పకుండా చూస్తాను:\n\n🆘 **ఇరుక్కున్నప్పుడు సహాయం** — ఏ పేజీలోనైనా \"నేను ఇరుక్కున్నా\" అనండి\n🧭 **గైడెడ్ టూర్** — \"చూపించు\" అనండి\n⏰ **రిమైండర్లు** — నిశ్శబ్దంగా ఉంటే \"మీరు ఉన్నారా?\" అని అడుగుతాను\n🎮 **క్విజ్ అరేనా** — \"బాస్ బాటిల్ మొదలుపెట్టు\" (మీకు తగిన ప్రశ్నలు)\n📄 **నోట్స్ క్విజ్** — \"నా నోట్స్ నుంచి క్విజ్ చేయి\"\n📅 **ప్లానర్** — \"గణితం 30 నిమిషాలు జోడించు\"\n📊 **ప్రోగ్రెస్** — \"నా ప్రోగ్రెస్ ఎలా ఉంది?\"\n🎤 **వాయిస్** — మైక్ తో మాట్లాడండి, జవాబులు వినండి 🔊\n🗣️ **3 భాషలు** — English, हिन्दी, తెలుగు\n\nAPI కీలు లేవు, ఇంటర్నెట్ అవసరం లేదు, ట్రాకింగ్ లేదు — అంతా మీ బ్రౌజర్ లోనే! 🔒",
        "నన్ను మీ వ్యక్తిగత యాప్ గైడ్ గా భావించండి: ఇరుక్కుంటే సహాయం, రిమైండర్లు, టూర్, ప్రోగ్రెస్ — అన్నీ ఆఫ్‌లైన్. \"చూపించు\" లేదా \"క్విజ్ మొదలుపెట్టు\" ప్రయత్నించండి!"
      ],
      quick: ['కిరణజన్య సంయోగక్రియ వివరించు', 'క్విజ్ మొదలుపెట్టు', 'గణితం 30 నిమిషాలు జోడించు', 'చూపించు'],
      kid: "నువ్వు ఇరుక్కుంటే సహాయం చేస్తాను, గుర్తు చేస్తాను, యాప్ చుట్టూ తిప్పుతాను, క్విజ్ ఆడతాను! ఇంటర్నెట్ లేకుండానే! 🌳✨",
      pro: "సామర్థ్యాలు: కాంటెక్స్ట్ స్టక్-హెల్ప్, గైడెడ్ ఆన్‌బోర్డింగ్ టూర్‌లు, నిష్క్రియ రిమైండర్లు, అడాప్టివ్ అంచనాలు, చాట్ ద్వారా టాస్క్ నియోజన, పురోగతి విశ్లేషణ, బహుభాషా (EN/HI/TE), వాయిస్ ఇన్/అవుట్, ఆఫ్‌లైన్ & ప్రైవేట్."
    }
  },
  quiz_info: {
    en: {
      text: [
        "Welcome to the Quiz Arena! 🎮 Here's how it works:\n\n⚔️ **Boss Battle** — answer 5 questions to defeat the boss\n🎚️ **Adaptive difficulty** — questions match your current level (now: **{level}**)\n⭐ **XP & levels** — earn XP for every correct answer\n📈 **Progress tracking** — accuracy feeds your learning profile\n\nSay **\"start a quiz\"** to begin! Or open Quiz Arena from the menu.",
        "The Quiz Arena tunes itself to you: right now questions are at difficulty level {level} ({levelName}). Defeat the boss to level up!"
      ],
      quick: ['Start a quiz', 'What level am I?'],
      kid: "This is the Quiz Arena! 🎮 You fight a BOSS by answering questions! Easy questions at first — and they get smarter as YOU get smarter! Say \"start a quiz\"!",
      pro: "Quiz Arena: 5-question assessments at adaptive difficulty (current: level {level}). Correct answers yield XP; accuracy updates your learning profile."
    },
    hi: {
      text: [
        "क्विज़ एरीना में स्वागत है! 🎮 ऐसे काम करता है:\n\n⚔️ **बॉस बैटल** — बॉस को हराने के लिए 5 सवालों के जवाब दो\n🎚️ **एडेप्टिव डिफिकल्टी** — सवाल आपके लेवल के होंगे (अभी: **{level}**)\n⭐ **XP और लेवल** — हर सही जवाब पर XP\n📈 **ट्रैकिंग** — सटीकता आपकी प्रोफ़ाइल बनाती है\n\n**\"क्विज़ शुरू करो\"** बोलो और शुरू करो!",
        "क्विज़ एरीना आपके हिसाब से ढलता है: अभी सवाल लेवल {level} ({levelName}) के हैं। बॉस को हराकर लेवल अप करो!"
      ],
      quick: ['क्विज़ शुरू करो', 'मेरा लेवल क्या है?'],
      kid: "यह है क्विज़ एरीना! 🎮 तुम सवालों के जवाब देकर BOSS से लड़ते हो! पहले आसान सवाल — और जैसे-जैसे तुम स्मार्ट होते हो, सवाल भी स्मार्ट होते जाते हैं! \"क्विज़ शुरू करो\" बोलो!",
      pro: "क्विज़ एरीना: एडेप्टिव कठिनाई पर 5-प्रश्न आकलन (वर्तमान: लेवल {level})। सही उत्तरों पर XP; सटीकता से लर्निंग प्रोफ़ाइल अपडेट होती है।"
    },
    te: {
      text: [
        "క్విజ్ అరేనాకి స్వాగతం! 🎮 ఇలా పనిచేస్తుంది:\n\n⚔️ **బాస్ బాటిల్** — బాస్ ను ఓడించడానికి 5 ప్రశ్నలకు జవాబివ్వండి\n🎚️ **అడాప్టివ్ కష్టతరం** — ప్రశ్నలు మీ లెవల్ కి తగ్గట్టు (ప్రస్తుతం: **{level}**)\n⭐ **XP & లెవల్స్** — ప్రతి సరైన జవాబుకు XP\n📈 **ట్రాకింగ్** — ఖచ్చితత్వం మీ ప్రొఫైల్ ని మెరుగుపరుస్తుంది\n\n**\"క్విజ్ మొదలుపెట్టు\"** అనండి!",
        "క్విజ్ అరేనా మీకు అనుగుణంగా మారుతుంది: ఇప్పుడు లెవల్ {level} ({levelName}) ప్రశ్నలు. బాస్ ను ఓడించి లెవల్ అప్ అవ్వండి!"
      ],
      quick: ['క్విజ్ మొదలుపెట్టు', 'నా లెవల్ ఏమిటి?'],
      kid: "ఇది క్విజ్ అరేనా! 🎮 ప్రశ్నలకు జవాబిచ్చి BOSS తో పోరాడతావు! ముందు ఈజీ ప్రశ్నలు — నువ్వు స్మార్ట్ అవుతుంటే ప్రశ్నలు కూడా స్మార్ట్ అవుతాయి! \"క్విజ్ మొదలుపెట్టు\" అను!",
      pro: "క్విజ్ అరేనా: అడాప్టివ్ కష్టతరం వద్ద 5-ప్రశ్నల మదింపు (ప్రస్తుతం: లెవల్ {level}). సరైన సమాధానాలకు XP; ఖచ్చితత్వం ప్రొఫైల్ ను నవీకరిస్తుంది."
    }
  },
  notes_quiz: {
    en: {
      text: [
        "Great idea! I can build a quiz from YOUR notes 📄 — open the **Notes Quiz** tab, paste or upload your notes (.txt/.md), and hit Generate. Fully offline, no API keys!",
        "Want a quiz from your own material? Go to **Notes Quiz** — paste text or upload a file and I'll generate questions from it! 📄"
      ],
      quick: ['Open Notes Quiz', "I'm stuck"],
      action: 'openNotesQuiz'
    },
    hi: {
      text: [
        "बढ़िया! मैं आपके नोट्स से क्विज़ बना सकता हूँ 📄 — **नोट्स क्विज़** टैब खोलें, नोट्स पेस्ट करें या फ़ाइल अपलोड करें (.txt/.md), और Generate दबाएँ। पूरी तरह ऑफ़लाइन, कोई API key नहीं!",
        "अपनी सामग्री से क्विज़ चाहिए? **नोट्स क्विज़** में जाएँ — टेक्स्ट पेस्ट करें या फ़ाइल अपलोड करें, मैं सवाल बना दूँगा! 📄"
      ],
      quick: ['नोट्स क्विज़ खोलें', 'मैं अटक गया'],
      action: 'openNotesQuiz'
    },
    te: {
      text: [
        "మంచి ఆలోచన! మీ నోట్స్ నుంచి క్విజ్ చేయగలను 📄 — **నోట్స్ క్విజ్** ట్యాబ్ తెరిచి నోట్స్ పేస్ట్ చేయండి లేదా ఫైల్ అప్‌లోడ్ చేయండి (.txt/.md). పూర్తి ఆఫ్‌లైన్, API కీలు లేవు!",
        "మీ మెటీరియల్ నుంచి క్విజ్ కావాలా? **నోట్స్ క్విజ్** కి వెళ్లండి — టెక్స్ట్ పేస్ట్ చేయండి, నేను ప్రశ్నలు చేస్తాను! 📄"
      ],
      quick: ['నోట్స్ క్విజ్ తెరవండి', 'నేను ఇరుక్కున్నా'],
      action: 'openNotesQuiz'
    }
  },
  quiz_start: {
    en: {
      text: ["Let's go! ⚔️ Opening the Quiz Arena at your level ({level} — {levelName}). Defeat the boss, earn XP!", "Boss Battle incoming! 🎮 Opening Quiz Arena — questions tuned to level {level} ({levelName})."],
      quick: [],
      action: 'openQuiz',
      kid: "Yayy! Let's fight the BOSS! 🎮 Opening the quiz — do your best, champion!",
      pro: "Opening the assessment module. Questions are calibrated to level {level}."
    },
    hi: {
      text: ["चलो! ⚔️ क्विज़ एरीना खोल रहा हूँ — आपके लेवल ({level} — {levelName}) पर। बॉस को हराओ, XP कमाओ!", "बॉस बैटल शुरू! 🎮 क्विज़ एरीना खोल रहा हूँ — सवाल लेवल {level} ({levelName}) के।"],
      quick: [],
      action: 'openQuiz',
      kid: "वाह! चलो BOSS से लड़ते हैं! 🎮 क्विज़ खुल रहा है — जीत तुम्हारी होगी!",
      pro: "आकलन मॉड्यूल खोल रहा हूँ। प्रश्न लेवल {level} पर कैलिब्रेटेड हैं।"
    },
    te: {
      text: ["వెళ్దాం! ⚔️ క్విజ్ అరేనా తెరుస్తున్నాను — మీ లెవల్ ({level} — {levelName}). బాస్ ను ఓడించి XP సంపాదించండి!", "బాస్ బాటిల్ వస్తోంది! 🎮 క్విజ్ అరేనా తెరుస్తున్నాను — లెవల్ {level} ({levelName}) ప్రశ్నలు."],
      quick: [],
      action: 'openQuiz',
      kid: "అద్భుతం! బాస్ తో పోరాడదాం! 🎮 క్విజ్ తెరుస్తున్నాను — నీవే గెలుస్తావు!",
      pro: "మదింపు మాడ్యూల్ తెరుస్తున్నాను. ప్రశ్నలు లెవల్ {level} కి క్రమాంకనం చేయబడ్డాయి."
    }
  },
  planner_info: {
    en: {
      text: [
        "The Planner is your study timetable! 📅 Here's how to use it:\n\n➕ Add a task in the Planner page — or just tell me: **\"add maths 30 minutes\"**\n✅ Tick tasks done as you finish\n📊 Finished tasks count toward your Progress\n\nTry saying: \"add physics 45 minutes\"",
        "Plan smarter, not harder! Tell me things like \"add science 20 minutes\" and I'll put it on your schedule. You can also manage tasks in the Planner page."
      ],
      quick: ['Add maths 30 minutes', 'Show my plan'],
      kid: "The Planner is where we write down what to study! 📅 Like a superhero mission list! Tell me: \"add maths 30 minutes\" and I'll write it down for you!",
      pro: "Planner: task scheduling with subjects and durations. Natural-language intake supported — e.g., \"add statistics 45 minutes\"."
    },
    hi: {
      text: [
        "प्लानर आपका स्टडी टाइमटेबल है! 📅 ऐसे इस्तेमाल करें:\n\n➕ प्लानर पेज में टास्क जोड़ें — या मुझसे कहें: **\"गणित 30 मिनट जोड़ो\"**\n✅ पूरा करने पर टिक करें\n📊 पूरे टास्क आपकी प्रोग्रेस में जुड़ते हैं\n\nआज़माएँ: \"भौतिकी 45 मिनट जोड़ो\"",
        "समझदारी से प्लान करो! मुझसे कहो \"विज्ञान 20 मिनट जोड़ो\" और मैं आपके शेड्यूल में डाल दूँगा। प्लानर पेज से भी मैनेज कर सकते हैं।"
      ],
      quick: ['गणित 30 मिनट जोड़ो', 'प्लान दिखाओ'],
      kid: "प्लानर वह जगह है जहाँ हम लिखते हैं क्या पढ़ना है! 📅 जैसे हीरो की मिशन लिस्ट! बोलो: \"गणित 30 मिनट जोड़ो\" और मैं लिख दूँगा!",
      pro: "प्लानर: विषय और अवधि सहित कार्य-नियोजन। प्राकृतिक भाषा इनपुट समर्थित — जैसे \"सांख्यिकी 45 मिनट जोड़ो\"।"
    },
    te: {
      text: [
        "ప్లానర్ మీ స్టడీ టైమ్ టేబుల్! 📅 ఇలా వాడండి:\n\n➕ ప్లానర్ పేజీలో టాస్క్ జోడించండి — లేదా నాతో చెప్పండి: **\"గణితం 30 నిమిషాలు జోడించు\"**\n✅ పూర్తయినప్పుడు టిక్ చేయండి\n📊 పూర్తి టాస్కులు ప్రోగ్రెస్ లో చేరుతాయి\n\nట్రై చేయండి: \"ఫిజిక్స్ 45 నిమిషాలు జోడించు\"",
        "తెలివిగా ప్లాన్ చేయండి! \"సైన్స్ 20 నిమిషాలు జోడించు\" అనండి — షెడ్యూల్ లో పెడతాను. ప్లానర్ పేజీలో కూడా మేనేజ్ చేయవచ్చు."
      ],
      quick: ['గణితం 30 నిమిషాలు జోడించు', 'నా ప్లాన్ చూపించు'],
      kid: "ప్లానర్ అంటే ఏం చదవాలో రాసుకునే చోటు! 📅 హీరో మిషన్ లిస్ట్ లాంటిది! \"గణితం 30 నిమిషాలు జోడించు\" అను — నేను రాసేస్తాను!",
      pro: "ప్లానర్: సబ్జెక్టులు, వ్యవధులతో టాస్క్ నియోజన. సహజ భాషా ఇన్‌పుట్ మద్దతు — ఉదా: \"గణాంకాలు 45 నిమిషాలు జోడించు\"."
    }
  },
  progress_info: {
    en: {
      text: [
        "Here's your report card, {name}! 📊\n\n⭐ **Level**: {level} — {levelName}\n⚡ **XP**: {xp}\n🎮 **Quizzes taken**: {quizzes}\n🎯 **Accuracy**: {accuracy}%\n📅 **Tasks completed**: {tasksDone}\n🔥 **Day streak**: {streak}\n🧠 **Topics learned**: {topics}\n\nKeep going — level {nextLevel} is {xpLeft} XP away!",
        "You're doing great, {name}! Level {level} ({levelName}), {xp} XP so far. Say \"start a quiz\" to earn more XP!"
      ],
      quick: ['Start a quiz', 'Motivate me'],
      kid: "Here's your trophy list, {name}! 🏆 Level {level}, {xp} stars, and {tasksDone} missions done! Keep collecting stars!",
      pro: "Performance summary: level {level} ({levelName}), {xp} XP, quiz accuracy {accuracy}%, {tasksDone} tasks completed, {streak}-day streak. {xpLeft} XP to next level."
    },
    hi: {
      text: [
        "आपकी रिपोर्ट कार्ड, {name}! 📊\n\n⭐ **लेवल**: {level} — {levelName}\n⚡ **XP**: {xp}\n🎮 **क्विज़ दिए**: {quizzes}\n🎯 **सटीकता**: {accuracy}%\n📅 **टास्क पूरे**: {tasksDone}\n🔥 **स्ट्रीक**: {streak} दिन\n🧠 **टॉपिक सीखे**: {topics}\n\nचलते रहो — अगले लेवल में {xpLeft} XP बाकी!",
        "बहुत बढ़िया, {name}! लेवल {level} ({levelName}), अब तक {xp} XP। ज़्यादा XP के लिए \"क्विज़ शुरू करो\" बोलो!"
      ],
      quick: ['क्विज़ शुरू करो', 'मोटिवेशन दो'],
      kid: "यह रही आपकी ट्रॉफी लिस्ट, {name}! 🏆 लेवल {level}, {xp} स्टार, और {tasksDone} मिशन पूरे! स्टार जुटाते रहो!",
      pro: "प्रदर्शन सारांश: लेवल {level} ({levelName}), {xp} XP, क्विज़ सटीकता {accuracy}%, {tasksDone} कार्य पूर्ण, {streak}-दिन स्ट्रीक। अगले लेवल हेतु {xpLeft} XP।"
    },
    te: {
      text: [
        "మీ రిపోర్ట్ కార్డ్, {name}! 📊\n\n⭐ **లెవల్**: {level} — {levelName}\n⚡ **XP**: {xp}\n🎮 **క్విజ్‌లు**: {quizzes}\n🎯 **ఖచ్చితత్వం**: {accuracy}%\n📅 **టాస్కులు పూర్తి**: {tasksDone}\n🔥 **స్ట్రీక్**: {streak} రోజులు\n🧠 **టాపిక్‌లు నేర్చుకున్నారు**: {topics}\n\nకొనసాగించండి — తదుపరి లెవల్ కి {xpLeft} XP మిగిలింది!",
        "బాగా చేస్తున్నారు, {name}! లెవల్ {level} ({levelName}), ఇప్పటివరకు {xp} XP. ఎక్కువ XP కి \"క్విజ్ మొదలుపెట్టు\" అనండి!"
      ],
      quick: ['క్విజ్ మొదలుపెట్టు', 'ప్రేరణ ఇవ్వు'],
      kid: "ఇదిగో నీ ట్రోఫీ లిస్ట్, {name}! 🏆 లెవల్ {level}, {xp} స్టార్లు, {tasksDone} మిషన్లు పూర్తి! స్టార్లు కూడబెట్టుకుంటూ ఉండు!",
      pro: "పనితీరు సారాంశం: లెవల్ {level} ({levelName}), {xp} XP, క్విజ్ ఖచ్చితత్వం {accuracy}%, {tasksDone} టాస్కులు, {streak}-రోజుల స్ట్రీక్. తదుపరి లెవల్ కి {xpLeft} XP."
    }
  },
  explain: {
    en: {
      text: [
        "I'm a guide, not a teacher! 🧭 I don't explain study topics — but I'm great at helping when you're stuck, sending you reminders, and showing you around the app. Say **\"show me around\"** or **\"I'm stuck\"**!",
        "Sorry, topic explanations aren't my job! 😄 I'm here to guide you: tours, help when stuck, and gentle reminders. Try **\"help me\"**!"
      ],
      quick: ['Show me around', "I'm stuck", 'What can you do?'],
      kid: "I'm not a teacher — I'm your tour guide! 🗺️ I help when you're stuck and show you cool stuff in the app!",
      pro: "I'm an application guide, not a domain tutor. I assist with navigation, contextual help, reminders and onboarding tours."
    },
    hi: {
      text: [
        "मैं गाइड हूँ, टीचर नहीं! 🧭 मैं पढ़ाई के टॉपिक नहीं समझाता — लेकिन अटकने पर मदद, याद दिलाना और ऐप घुमाना मेरा काम है! **\"घुमाओ\"** या **\"मैं अटक गया\"** कहिए!",
        "माफ़ कीजिए, टॉपिक समझाना मेरा काम नहीं! 😄 मैं आपका गाइड हूँ: टूर, अटकने पर मदद, और हल्की याद दिलाना। **\"मदद करो\"** आज़माइए!"
      ],
      quick: ['घुमाओ', 'मैं अटक गया', 'तुम क्या कर सकते हो?'],
      kid: "मैं टीचर नहीं — मैं तुम्हारा टूर गाइड हूँ! 🗺️ अटको तो मदद करता हूँ और ऐप की मज़ेदार चीज़ें दिखाता हूँ!",
      pro: "मैं एप्लिकेशन गाइड हूँ, विषय शिक्षक नहीं। नेविगेशन, कॉन्टेक्स्टुअल हेल्प, रिमाइंडर और ऑनबोर्डिंग टूर में सहायता करता हूँ।"
    },
    te: {
      text: [
        "నేను గైడ్ ని, టీచర్ ని కాదు! 🧭 నేను స్టడీ టాపిక్‌లను వివరించను — కానీ ఇరుక్కున్నప్పుడు సహాయం, గుర్తుచేయడం, యాప్ చుట్టూ తిప్పడం నా పని! **\"చూపించు\"** లేదా **\"నేను ఇరుక్కున్నా\"** అనండి!",
        "క్షమించండి, టాపిక్ వివరించడం నా పని కాదు! 😄 నేను మీ గైడ్ ని: టూర్‌లు, ఇరుక్కున్నప్పుడు సహాయం, సున్నిత గుర్తింపులు. **\"సహాయం చేయి\"** ప్రయత్నించండి!"
      ],
      quick: ['చూపించు', 'నేను ఇరుక్కున్నా', 'నువ్వు ఏం చేయగలవు?'],
      kid: "నేను టీచర్ ని కాదు — నీ టూర్ గైడ్ ని! 🗺️ ఇరుక్కుంటే సహాయం చేస్తాను, యాప్ లో బాగుండేవి చూపిస్తాను!",
      pro: "నేను అప్లికేషన్ గైడ్ ని, విషయ బోధకుడిని కాదు. నావిగేషన్, కాంటెక్స్ట్ సహాయం, రిమైండర్లు, ఆన్‌బోర్డింగ్ టూర్‌లలో సహాయపడతాను."
    }
  },
  level_info: {
    en: {
      text: [
        "Your adaptive level is **{level} — {levelName}** 🎚️\n\nI watch your quiz scores and XP, and tune the difficulty so you're always challenged but never lost. Current XP: {xp}. Next level at {xpLeft} XP.\n\nWant harder questions? Score well in quizzes and your level rises automatically!",
        "Level {level}: {levelName}. That's my difficulty setting for you — it adapts as you learn."
      ],
      quick: ['Start a quiz', 'How am I doing?'],
      kid: "Your level is {level} — like a video game! 🎮 Keep winning quizzes and you'll LEVEL UP!"
    },
    hi: {
      text: [
        "आपका एडेप्टिव लेवल **{level} — {levelName}** है 🎚️\n\nमैं आपके क्विज़ स्कोर और XP देखता हूँ, और कठिनाई ऐसे बदलता हूँ कि आपको चुनौती भी मिले और उलझन भी न हो। अभी XP: {xp}। अगले लेवल में {xpLeft} XP चाहिए।\n\nमुश्किल सवाल चाहिए? क्विज़ में अच्छा स्कोर करो — लेवल अपने आप बढ़ेगा!"
      ],
      quick: ['क्विज़ शुरू करो', 'मेरी प्रोग्रेस कैसी है?'],
      kid: "आपका लेवल {level} है — जैसे वीडियो गेम में! 🎮 क्विज़ जीतते रहो और LEVEL UP होगा!"
    },
    te: {
      text: [
        "మీ అడాప్టివ్ లెవల్ **{level} — {levelName}** 🎚️\n\nమీ క్విజ్ స్కోర్లు, XP ని చూసి కష్టతరాన్ని సర్దుబాటు చేస్తాను — సవాల్ ఉంటుంది, అయితే చిక్కులో పడరు. ప్రస్తుతం XP: {xp}. తదుపరి లెవల్ కి {xpLeft} XP.\n\nకష్టమైన ప్రశ్నలు కావాలా? క్విజ్ లో బాగా స్కోర్ చేయండి — లెవల్ స్వయంచాలకంగా పెరుగుతుంది!"
      ],
      quick: ['క్విజ్ మొదలుపెట్టు', 'నా ప్రోగ్రెస్ ఎలా ఉంది?'],
      kid: "నీ లెవల్ {level} — గేమ్ లాంటిది! 🎮 క్విజ్ గెలుస్తూ ఉండు, LEVEL UP అవుతావు!"
    }
  },
  voice_info: {
    en: {
      text: [
        "I can listen AND speak! 🎤 Tap the **mic button** in the chat and talk — your words appear as text and I answer out loud 🔊. Keep the 🔊 button in the header on to hear my voice. Works in English, Hindi and Telugu (Chrome/Edge) — all free browser speech, no API keys!",
        "Yes! Tap the mic icon and just talk — and I'll read my replies aloud. Try it in हिन्दी or తెలుగు too!"
      ],
      quick: ['Start a quiz'],
      kid: "I have ears AND a voice! 🎤🔊 Tap the mic and talk to me — I'll understand and answer you! Even in Hindi and Telugu!"
    },
    hi: {
      text: [
        "मैं सुन भी सकता हूँ और बोल भी! 🎤 चैट में **माइक बटन** दबाइए और बोलिए — आपके शब्द अपने आप लिख जाएँगे और मैं ज़ोर से जवाब दूँगा 🔊। हेडर का 🔊 बटन चालू रखिए मेरी आवाज़ सुनने के लिए। हिंदी, तेलुगु, अंग्रेज़ी (Chrome/Edge) — बिल्कुल मुफ्त, कोई API key नहीं!",
        "हाँ! माइक आइकन दबाइए और बोलिए — मैं जवाब ज़ोर से पढ़ूँगा। हिन्दी या తెలుగు में भी आज़माइए!"
      ],
      quick: ['क्विज़ शुरू करो'],
      kid: "मेरे कान भी हैं और आवाज़ भी! 🎤🔊 माइक दबाओ और मुझसे बोलो — मैं समझकर जवाब दूँगा! हिंदी और तेलुगु में भी!"
    },
    te: {
      text: [
        "నేను వినడమే కాదు, మాట్లాడగలను కూడా! 🎤 చాట్ లో **మైక్ బటన్** నొక్కి మాట్లాడండి — మీ మాటలు టైప్ అవుతాయి, నేను బిగ్గరగా జవాబిస్తాను 🔊. హెడర్ లోని 🔊 బటన్ ఆన్ లో ఉంచితే నా గొంతు వినిపిస్తుంది. తెలుగు, హిందీ, ఇంగ్లీష్ (Chrome/Edge) — పూర్తి ఉచితం, API కీలు లేవు!",
        "అవును! మైక్ ఐకాన్ నొక్కి మాట్లాడండి — నేను జవాబులు బిగ్గరగా చదువుతాను. हिन्दी లో కూడా ట్రై చేయండి!"
      ],
      quick: ['క్విజ్ మొదలుపెట్టు'],
      kid: "నాకు చెవులు కూడా ఉన్నాయి, గొంతు కూడా! 🎤🔊 మైక్ నొక్కి మాట్లాడు — నేను అర్థం చేసుకుని జవాబిస్తాను! తెలుగులో కూడా!"
    }
  },
  settings_info: {
    en: {
      text: [
        "Your profile is in the **Settings** page — change your name, age group, language or chat tone there anytime. Everything saves in your browser. 🔒",
        "Want to switch things up? Open Settings: you can change language (English/हिन्दी/తెలుగు), tone, and even restart the tour."
      ],
      quick: ['Show me around', 'How am I doing?'],
      kid: "You can change things in Settings! Like your name, language, and even make me funnier! 😄"
    },
    hi: {
      text: [
        "आपकी प्रोफ़ाइल **सेटिंग्स** पेज में है — नाम, उम्र समूह, भाषा या चैट अंदाज़ कभी भी बदलें। सब कुछ आपके ब्राउज़र में सेव होता है। 🔒",
        "कुछ बदलना है? सेटिंग्स खोलें: भाषा (English/हिन्दी/తెలుగు), अंदाज़ बदलें, टूर फिर से शुरू करें।"
      ],
      quick: ['घुमाओ', 'मेरी प्रोग्रेस कैसी है?'],
      kid: "सेटिंग्स में बहुत कुछ बदल सकते हो! नाम, भाषा, और मुझे और मज़ेदार भी बना सकते हो! 😄"
    },
    te: {
      text: [
        "మీ ప్రొఫైల్ **సెట్టింగ్స్** పేజీలో ఉంది — పేరు, వయస్సు వర్గం, భాష లేదా చాట్ ధోరణి ఎప్పుడైనా మార్చుకోవచ్చు. అంతా మీ బ్రౌజర్ లోనే సేవ్ అవుతుంది. 🔒",
        "ఏదైనా మార్చుకోవాలా? సెట్టింగ్స్ తెరవండి: భాష (English/हिन्दी/తెలుగు), ధోరణి మార్చుకోవచ్చు, టూర్ మళ్లీ ప్రారంభించవచ్చు."
      ],
      quick: ['చూపించు', 'నా ప్రోగ్రెస్ ఎలా ఉంది?'],
      kid: "సెట్టింగ్స్ లో చాలా మార్చుకోవచ్చు! పేరు, భాష — నన్ను ఇంకా ఫన్నీగా కూడా చేయవచ్చు! 😄"
    }
  },
  motivation: {
    en: {
      text: [
        "Hey {name}, you've got this! 💪 Remember: every expert was once a beginner. You've already earned **{xp} XP** at level {level} — that's proof you're making progress. Take a 5-minute break, drink water, and come back. I'll be right here! 🌟",
        "Feeling tired is normal — it means you're pushing yourself! 🧠 Your brain grows when it's challenged. One small step: just 10 minutes of study. Start, and the momentum will carry you!",
        "You don't need to be perfect — you need to be consistent. {name}, you've completed {tasksDone} tasks and learned {topics} topics so far. Future-you is cheering for you! 🎉"
      ],
      quick: ['Start a quiz', 'Explain something fun'],
      kid: "You're a star, {name}! 🌟 Even superheroes take breaks! Drink some water, stretch, and we'll study a little more. You can do it!",
      pro: "Short-term fatigue is a signal to change mode, not to stop. You have {xp} XP at level {level}. Ten focused minutes will restore momentum."
    },
    hi: {
      text: [
        "सुनो {name}, आप कर सकते हो! 💪 याद रखो: हर विशेषज्ञ कभी शुरुआती था। आपने अब तक **{xp} XP** कमाए हैं, लेवल {level} पर — यानी प्रोग्रेस हो रही है। 5 मिनट का ब्रेक लो, पानी पियो, और वापस आओ। मैं यहीं हूँ! 🌟",
        "थकान लगना सामान्य है — मतलब आप मेहनत कर रहे हैं! 🧠 चुनौती से दिमाग़ बढ़ता है। छोटा कदम: सिर्फ 10 मिनट की पढ़ाई। शुरू करो, और गति खुद मिलेगी!",
        "परफेक्ट होना ज़रूरी नहीं — निरंतर होना ज़रूरी है। {name}, आपने {tasksDone} टास्क पूरे किए और {topics} टॉपिक सीखे। भविष्य का आप आपकी तारीफ़ करेगा! 🎉"
      ],
      quick: ['क्विज़ शुरू करो', 'कुछ मज़ेदार समझाओ'],
      kid: "तुम स्टार हो, {name}! 🌟 हीरो भी ब्रेक लेते हैं! पानी पियो, थोड़ा हिलो-डुलो, फिर थोड़ा पढ़ेंगे। तुम कर सकते हो!",
      pro: "अल्पकालिक थकान मतलब रुकना नहीं, बदलाव है। आपके पास लेवल {level} पर {xp} XP है। दस केंद्रित मिनट गति बहाल कर देंगे।"
    },
    te: {
      text: [
        "విను {name}, నువ్వు చేయగలవు! 💪 గుర్తుంచుకో: ప్రతి నిపుణుడు ఒకప్పుడు ప్రారంభకుడే. ఇప్పటివరకు **{xp} XP** సంపాదించావు, లెవల్ {level} లో — అంటే ప్రోగ్రెస్ అవుతోందని రుజువు. 5 నిమిషాలు బ్రేక్ తీసుకో, నీళ్లు తాగు, తిరిగి రా. నేను ఇక్కడే ఉంటాను! 🌟",
        "అలసట సహజం — నువ్వు కష్టపడుతున్నావని అర్థం! 🧠 సవాల్ వల్ల మెదడు పెరుగుతుంది. చిన్న అడుగు: కేవలం 10 నిమిషాల చదువు. మొదలుపెట్టు — వేగం తానే వస్తుంది!",
        "పర్ఫెక్ట్ అవ్వాల్సిన అవసరం లేదు — నిలకడగా ఉండాలి. {name}, నువ్వు {tasksDone} టాస్కులు పూర్తి చేశావు, {topics} టాపిక్‌లు నేర్చుకున్నావు. భవిష్యత్తు నువ్వు నిన్ను చూసి గర్వపడతాడు! 🎉"
      ],
      quick: ['క్విజ్ మొదలుపెట్టు', 'ఏదైనా సరదాగా వివరించు'],
      kid: "నువ్వు స్టార్ వి, {name}! 🌟 హీరోలు కూడా బ్రేక్ తీసుకుంటారు! నీళ్లు తాగు, కాస్త కదులు, మళ్లీ కాస్త చదువుదాం. నువ్వు చేయగలవు!",
      pro: "స్వల్పకాల అలసిక అంటే ఆగడం కాదు — మారడం. మీ వద్ద లెవల్ {level} లో {xp} XP ఉంది. పది కేంద్రీకృత నిమిషాలు వేగాన్ని తిరిగి తెస్తాయి."
    }
  },
  joke: {
    en: {
      text: [
        "Why did the student eat his homework? Because the teacher said it was a piece of cake! 🍰",
        "Why don't scientists trust atoms? Because they make up everything! ⚛️",
        "What do you call a dinosaur that can't read? A dino-sore! 🦖",
        "Why was the math book sad? It had too many problems. 📘"
      ],
      quick: ['Another one!', 'Motivate me'],
      kid: "Why did the sun go to school? To get brighter! 😆🌞",
      pro: "A physics professor's lecture was so dull, even the electrons stopped moving. (Thank you — I'll focus on teaching from now on.)"
    },
    hi: {
      text: [
        "टीचर: \"तुम्हारा होमवर्क कहाँ है?\" स्टूडेंट: \"मैंने सोचा आप कल पूछेंगे!\" 📚",
        "गणित की किताब उदास क्यों थी? क्योंकि उसमें बहुत सारी समस्याएँ थीं! 📘",
        "बच्चा: \"पापा, स्कूल में मुझे सबसे होशियार कहा गया!\" पापा: \"किसने कहा?\" बच्चा: \"टीचर ने — क्लास में सबसे ऊँचा प्रश्न पूछने पर!\" 😄"
      ],
      quick: ['एक और!', 'मोटिवेशन दो'],
      kid: "सूरज स्कूल क्यों गया? और चमकदार बनने के लिए! 😆🌞",
      pro: "भौतिकी के प्रोफेसर का लेक्चर इतना सूखा था कि इलेक्ट्रॉन भी हिलना बंद कर गए। (खैर, अब पढ़ाई पर ध्यान देते हैं।)"
    },
    te: {
      text: [
        "టీచర్: \"నీ హోంవర్క్ ఎక్కడ?\" స్టూడెంట్: \"రేపు అడుగుతారనుకున్నాను సార్!\" 📚",
        "గణితం పుస్తకం ఎందుకు బాధపడింది? చాలా ప్రాబ్లమ్స్ ఉన్నాయి కాబట్టి! 📘",
        "సైన్స్ టీచర్: \"నీటికి ఫార్ములా ఏమిటి?\" స్టూడెంట్: \"H₂O!\" టీచర్: \"మంచిది. మరి చాయ్ కి?\" స్టూడెంట్: \"C + H₂O + పాలు + పంచదార!\" 😄"
      ],
      quick: ['మరొకటి!', 'ప్రేరణ ఇవ్వు'],
      kid: "సూర్యుడు స్కూల్ కి ఎందుకు వెళ్లాడు? మరింత ప్రకాశవంతంగా అవ్వడానికి! 😆🌞",
      pro: "ఫిజిక్స్ ప్రొఫెసర్ లెక్చర్ చాలా నిస్తేజంగా ఉండేది — ఎలక్ట్రాన్లు కూడా కదలడం మానేశాయి. (సరే, ఇక చదువు మాట్లాడుకుందాం.)"
    }
  },
  simpler: {
    en: {
      text: [
        "Of course! Let me make it super simple. 🌱 Tell me which topic, and I'll explain it like you're 10 — short sentences, zero jargon. Try: \"explain fractions\".",
        "No problem — I'll dial the difficulty way down. Just name the topic and I'll use the simplest words I know!"
      ],
      quick: ['Explain gravity simply', 'Explain fractions'],
      kid: "Okay okay, even simpler! 🌱 Just tell me what you want to know and I'll use my simplest words!"
    },
    hi: {
      text: [
        "ज़रूर! बिल्कुल आसान बनाता हूँ। 🌱 बताइए कौन-सा टॉपिक — छोटे वाक्य, कोई टेक्निकल शब्द नहीं। आज़माएँ: \"भिन्न समझाओ\"।",
        "कोई दिक्कत नहीं — कठिनाई बहुत कम कर देता हूँ। टॉपिक बताइए, सबसे आसान शब्दों में समझाऊँगा!"
      ],
      quick: ['गुरुत्वाकर्षण आसानी से समझाओ', 'भिन्न समझाओ'],
      kid: "ठीक है ठीक है, और भी आसान! 🌱 बताओ क्या जानना है — मैं सबसे आसान शब्द लूँगा!"
    },
    te: {
      text: [
        "తప్పకుండా! చాలా సింపుల్ గా చెప్తాను. 🌱 ఏ టాపిక్ అని చెప్పండి — చిన్న వాక్యాలు, టెక్నికల్ పదాలు లేవు. ట్రై చేయండి: \"భిన్నాలు వివరించు\".",
        "పర్వాలేదు — కష్టతరాన్ని చాలా తగ్గిస్తాను. టాపిక్ చెప్పండి, నాకు తెలిసిన సింపుల్ పదాలతో చెప్తాను!"
      ],
      quick: ['గురుత్వాకర్షణ సింపుల్ గా వివరించు', 'భిన్నాలు వివరించు'],
      kid: "సరే సరే, ఇంకా సింపుల్ గా! 🌱 ఏం తెలుసుకోవాలో చెప్పు — సింపుల్ మాటల్లో చెప్తాను!"
    }
  },
  fallback: {
    en: {
      text: [
        "Hmm, I'm not sure I got that, {name}. 🤔 I'm a guide, not a general chatbot! Try:\n🆘 **\"I'm stuck\"** — I'll help on any page\n🧭 **\"show me around\"** — a guided tour\n🎮 **\"start a quiz\"**\n📅 **\"add maths 30 minutes\"**",
        "I didn't quite understand that. 😅 I help you use Bodhya: tours, stuck-help, reminders, quizzes and planning. Say \"what can you do?\" to see my skills!",
        "That one's beyond my guide brain for now! But I love these: \"show me around\", \"I'm stuck\", \"start a quiz\", \"add maths 30 minutes\". Try one!"
      ],
      quick: ['What can you do?', 'Start a quiz'],
      kid: "Hmm, I didn't get that, {name}! 🙈 But I love tours, games and helping! Say \"show me around\" or \"start a quiz\"!",
      pro: "I did not recognize that request. I specialize in navigation, stuck-help, onboarding tours, assessments and scheduling. Try \"capabilities\"."
    },
    hi: {
      text: [
        "हम्म, मैं समझा नहीं, {name}। 🤔 मैं एक गाइड हूँ, कोई आम चैटबॉट नहीं! ऐसे पूछिए:\n🆘 **\"मैं अटक गया\"** — किसी भी पेज पर मदद\n🧭 **\"घुमाओ\"** — गाइडेड टूर\n🎮 **\"क्विज़ शुरू करो\"**\n📅 **\"गणित 30 मिनट जोड़ो\"**",
        "मैं समझा नहीं। 😅 मैं Bodhya इस्तेमाल करने में मदद करता हूँ: टूर, स्टक-हेल्प, रिमाइंडर, क्विज़, प्लानिंग। \"तुम क्या कर सकते हो?\" बोलकर देखो!",
        "यह मेरे गाइड दिमाग़ से बाहर है! लेकिन ये पूछो: \"घुमाओ\", \"मैं अटक गया\", \"क्विज़ शुरू करो\", \"गणित 30 मिनट जोड़ो\"।"
      ],
      quick: ['तुम क्या कर सकते हो?', 'क्विज़ शुरू करो'],
      kid: "हम्म, समझा नहीं, {name}! 🙈 लेकिन मुझे टूर, खेल और मदद करना पसंद है! \"घुमाओ\" या \"क्विज़ शुरू करो\" पूछो!",
      pro: "मैं यह अनुरोध नहीं पहचान सका। मैं नेविगेशन, स्टक-हेल्प, ऑनबोर्डिंग टूर, आकलन और नियोजन में विशेषज्ञ हूँ। \"क्षमताएँ\" कहकर देखें।"
    },
    te: {
      text: [
        "హ్మ్, అర్థం కాలేదు, {name}. 🤔 నేను గైడ్ ని, సాధారణ చాట్‌బాట్ కాదు! ఇలా అడగండి:\n🆘 **\"నేను ఇరుక్కున్నా\"** — ఏ పేజీలోనైనా సహాయం\n🧭 **\"చూపించు\"** — గైడెడ్ టూర్\n🎮 **\"క్విజ్ మొదలుపెట్టు\"**\n📅 **\"గణితం 30 నిమిషాలు జోడించు\"**",
        "అర్థం కాలేదు. 😅 నేను Bodhya వాడకంలో సహాయపడతాను: టూర్‌లు, స్టక్-హెల్ప్, రిమైండర్లు, క్విజ్‌లు, ప్లానింగ్. \"నువ్వు ఏం చేయగలవు?\" అని అడగండి!",
        "అది నా గైడ్ మెదడుకి అందనిది! కానీ ఇవి అడగండి: \"చూపించు\", \"నేను ఇరుక్కున్నా\", \"క్విజ్ మొదలుపెట్టు\", \"గణితం 30 నిమిషాలు జోడించు\"."
      ],
      quick: ['నువ్వు ఏం చేయగలవు?', 'క్విజ్ మొదలుపెట్టు'],
      kid: "హ్మ్, అర్థం కాలేదు, {name}! 🙈 కానీ నాకు టూర్‌లు, ఆటలు, సహాయం చేయడం ఇష్టం! \"చూపించు\" లేదా \"క్విజ్ మొదలుపెట్టు\" అడగు!",
      pro: "ఆ అభ్యర్థన గుర్తించలేకపోయాను. నేను నావిగేషన్, స్టక్-హెల్ప్, ఆన్‌బోర్డింగ్ టూర్‌లు, మదింపులు, నియోజనలో నిపుణుడిని. \"సామర్థ్యాలు\" అని అడగండి."
    }
  }
}

// ---------- Alarms · to-dos · study plan · focus · notifications · time ----------
//  These replies read what the engine just did (state.session.*) so Bodhya
//  can confirm the action with real numbers instead of a generic answer.

const L3 = (obj, lang) => obj[lang] || obj.en
const timePhrase = (t, lang) => {
  if (!t) return ''
  const [h, m] = String(t).split(':').map(Number)
  if (lang === 'en') {
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${h}:${String(m).padStart(2, '0')}`
}

const R2 = {
  alarm_add: (s) => {
    const a = s.lastAlarm
    if (!a) {
      return L3({
        en: "Sure! Tell me **what** and **when** — like *\"remind me to revise physics at 7 pm\"* or *\"set an alarm in 20 minutes\"*. ⏰",
        hi: "बिल्कुल! बताइए **क्या** और **कब** — जैसे *\"शाम 7 बजे भौतिकी रिवीज़न का रिमाइंडर\"* या *\"20 मिनट में अलार्म लगाओ\"*। ⏰",
        te: "సరే! **ఏం** మరియు **ఎప్పుడు** చెప్పండి — ఉదా *\"సాయంత్రం 7 గంటలకు ఫిజిక్స్ రివిజన్ రిమైండర్\"* లేదా *\"20 నిమిషాల్లో అలారం పెట్టు\"*. ⏰",
      }, s.lang)
    }
    const repeat = a.days?.length === 7
      ? L3({ en: 'every day', hi: 'हर दिन', te: 'ప్రతిరోజూ' }, s.lang)
      : a.days?.length ? L3({ en: `on ${a.days.length} days a week`, hi: `हफ़्ते के ${a.days.length} दिन`, te: `వారంలో ${a.days.length} రోజులు` }, s.lang)
        : L3({ en: 'one time', hi: 'एक बार', te: 'ఒకసారి' }, s.lang)
    return L3({
      en: `Done! ⏰ I set **${a.label}** for **${timePhrase(a.time, 'en')}** (${repeat}).\nI'll ring, buzz and put it in your notifications. Say "my alarms" to see it.`,
      hi: `हो गया! ⏰ मैंने **${a.label}** के लिए **${timePhrase(a.time, 'hi')}** का अलार्म लगा दिया (${repeat})।\nमैं बजाऊँगा, वाइब्रेट करूँगा और नोटिफिकेशन में भी डालूँगा। "मेरे अलार्म" कहिए देखने के लिए।`,
      te: `అయింది! ⏰ **${a.label}** కోసం **${timePhrase(a.time, 'te')}** కి అలారం పెట్టాను (${repeat}).\nమోగిస్తాను, వైబ్రేట్ చేస్తాను, నోటిఫికేషన్‌లో పెడతాను. "నా అలారమ్‌లు" అని చూడండి.`,
    }, s.lang)
  },

  alarm_stop: (s) => (s.stoppedAlarm
    ? L3({
      en: 'Done — alarm stopped. 🔇 Sleep well, and if you want I can push it 10 minutes ahead.',
      hi: 'हो गया — अलार्म बंद। 🔇 अच्छे से आराम कीजिए; चाहें तो 10 मिनट आगे भी कर सकता हूँ।',
      te: 'అయింది — అలారం ఆపేశాను. 🔇 మంచి విశ్రాంతి; కావాలంటే 10 నిమిషాలు ముందుకు జరపగలను.',
    }, s.lang)
    : L3({
      en: "Nothing is ringing right now. ⏰ Say \"my alarms\" to see what is coming up.",
      hi: 'अभी कुछ नहीं बज रहा। ⏰ "मेरे अलार्म" कहिए — आगे क्या है, दिखा दूँगा।',
      te: 'ఇప్పుడు ఏదీ మోగడం లేదు. ⏰ "నా అలారమ్‌లు" అని చూడండి.',
    }, s.lang)),

  alarm_show: (s) => {
    const list = s.alarms || []
    if (!list.length) {
      return L3({
        en: "You have no alarms right now. ⏰ Tell me one like *\"remind me to study maths at 6:30 am\"* — or open the **Alarms** tab for one-tap templates.",
        hi: "अभी कोई अलार्म नहीं है। ⏰ पूछिए: *\"सुबह 6:30 पर गणित पढ़ने का रिमाइंडर\"* — या **अलार्म** टैब में टेम्पलेट चुन लीजिए।",
        te: "ఇప్పుడు అలారమ్‌లు లేవు. ⏰ ఇలా చెప్పండి: *\"ఉదయం 6:30 కి మ్యాథ్స్ రిమైండర్\"* — లేదా **అలారమ్‌లు** ట్యాబ్‌లో టెంప్లేట్లు ఉన్నాయి.",
      }, s.lang)
    }
    const lines = list.slice(0, 5).map((a) => `⏰ **${timePhrase(a.time, s.lang)}** — ${a.label}`).join('\n')
    return L3({
      en: `Here's what will wake me up for you, {name}:\n${lines}\n\nWant to change one? Just say *"move my maths alarm to 7"*.`,
      hi: `आपके अलार्म, {name}:\n${lines}\n\nकुछ बदलना है? बस कहिए *"गणित का अलार्म 7 बजे कर दो"*।`,
      te: `మీ అలారమ్‌లు, {name}:\n${lines}\n\nఏదైనా మార్చాలా? *"మ్యాథ్స్ అలారం 7 కి మార్చు"* అనండి.`,
    }, s.lang)
  },

  todo_add: (s) => {
    const t = s.lastTodo
    if (!t) {
      return L3({
        en: "Tell me the task and I'll file it — like *\"add to-do: finish physics notes\"* or *\"add task: 10 maths sums tomorrow at 5\"*. ✅",
        hi: "काम बताइए, मैं लिख देता हूँ — जैसे *\"टू-डू जोड़ो: भौतिकी नोट्स पूरे करो\"* या *\"काम जोड़ो: कल 5 बजे 10 गणित के सवाल\"*। ✅",
        te: "పని చెప్పండి, నమోదు చేస్తాను — ఉదా *\"టూ-డూ జోడించు: ఫిజిక్స్ నోట్స్ పూర్తి చేయి\"* ✅",
      }, s.lang)
    }
    const when = t.due === s.today ? L3({ en: 'today', hi: 'आज', te: 'ఈరోజు' }, s.lang)
      : t.due ? t.due : L3({ en: 'someday', hi: 'कभी भी', te: 'ఎప్పుడో' }, s.lang)
    const time = t.dueTime ? ` ${timePhrase(t.dueTime, s.lang)}` : ''
    return L3({
      en: `Added to your to-do list ✅\n**${t.title}** — ${when}${time}\n\nSay "my to-dos" to see everything, or "I finished ${t.title}" when it's done (that earns XP!).`,
      hi: `टू-डू लिस्ट में जोड़ दिया ✅\n**${t.title}** — ${when}${time}\n\n"मेरे टू-डू" कहिए सब देखने के लिए, और पूरा होने पर "मेरा ${t.title} पूरा हो गया" कहिए (XP मिलेगा!)।`,
      te: `టూ-డూ లిస్ట్‌లో జోడించాను ✅\n**${t.title}** — ${when}${time}\n\n"నా టూ-డూ" అని అన్నీ చూడండి; పూర్తయ్యాక "నా ${t.title} పూర్తయింది" అనండి (XP వస్తుంది!).`,
    }, s.lang)
  },

  todo_show: (s) => {
    const sum = s.todoSummary || { overdue: [], today: [], open: 0 }
    if (!sum.open) {
      return L3({
        en: "Your list is clear! 🎉 Nothing pending. Want to plan ahead? Say *\"add to-do: revise chapter 4 tomorrow\"*.",
        hi: 'आपकी लिस्ट खाली है! 🎉 कुछ बाकी नहीं। आगे की योजना? कहिए *"टू-डू जोड़ो: कल अध्याय 4 दोहराना"*।',
        te: 'మీ లిస్ట్ ఖాళీ! 🎉 పెండింగ్ ఏమీ లేదు. ముందుగా ప్లాన్ చేయాలా? *"టూ-డూ జోడించు: రేపు చాప్టర్ 4 రివిజన్"* అనండి.',
      }, s.lang)
    }
    const rows = []
    if (sum.overdue.length) rows.push(`⚠️ ${L3({ en: 'Overdue', hi: 'बीत चुके', te: 'గడువు దాటినవి' }, s.lang)}: ${sum.overdue.slice(0, 3).map((t) => t.title).join(', ')}`)
    if (sum.today.length) rows.push(`🌤️ ${L3({ en: 'Today', hi: 'आज', te: 'ఈరోజు' }, s.lang)}:\n${sum.today.slice(0, 5).map((t) => `⬜ ${t.title}`).join('\n')}`)
    return L3({
      en: `Here's your list, {name} — ${sum.open} open:\n\n${rows.join('\n\n')}\n\nSay *"I finished <task>"* and I'll tick it off (+XP!).`,
      hi: `आपकी लिस्ट, {name} — ${sum.open} बाकी:\n\n${rows.join('\n\n')}\n\n*"मेरा <काम> पूरा हो गया"* कहिए, मैं टिक कर दूँगा (+XP!)।`,
      te: `మీ లిస్ట్, {name} — ${sum.open} పెండింగ్:\n\n${rows.join('\n\n')}\n\n*"నా <పని> పూర్తయింది"* అనండి, టిక్ చేస్తాను (+XP!).`,
    }, s.lang)
  },

  todo_done: (s) => {
    const d = s.doneTodo
    if (!d) {
      return L3({
        en: "Nice! Which one did you finish? Say it like *\"done with physics homework\"* and I'll tick it off. ✅",
        hi: "बहुत बढ़िया! कौन सा पूरा हुआ? ऐसे कहिए *\"भौतिकी होमवर्क पूरा हो गया\"* — मैं टिक कर दूँगा। ✅",
        te: "సూపర్! ఏది పూర్తయింది? ఇలా చెప్పండి *\"ఫిజిక్స్ హోంవర్క్ పూర్తయింది\"* — టిక్ చేస్తాను. ✅",
      }, s.lang)
    }
    return L3({
      en: `Yes! ✅ **${d.title}** is done — +${d.xp} XP.${d.leveledUp ? ' 🎉 You levelled up!' : ''}\n${d.left ? `Only ${d.left} left today. You're on a roll!` : 'That was the last one for today. Enjoy it! 🎊'}`,
      hi: `शाबाश! ✅ **${d.title}** पूरा — +${d.xp} XP।${d.leveledUp ? ' 🎉 लेवल अप!' : ''}\n${d.left ? `आज बस ${d.left} बाकी। शानदार चल रहा है!` : 'आज का आख़िरी काम भी पूरा। मज़ा कीजिए! 🎊'}`,
      te: `భలే! ✅ **${d.title}** పూర్తి — +${d.xp} XP.${d.leveledUp ? ' 🎉 లెవల్ అప్!' : ''}\n${d.left ? `ఈరోజు ఇంకా ${d.left} మాత్రమే. అదరగొడుతున్నారు!` : 'ఈరోజు చివరి పని కూడా పూర్తి. ఆనందించండి! 🎊'}`,
    }, s.lang)
  },

  studyplan_generate: (s) => {
    const m = s.planMeta
    if (!m) {
      return L3({
        en: "I can build a timetable for you! 🗺️ Just tell me the subjects and how much time you have — like *\"make a 7 day study plan for physics and maths, 2 hours a day\"*.",
        hi: "मैं टाइमटेबल बना सकता हूँ! 🗺️ विषय और समय बताइए — जैसे *\"भौतिकी और गणित का 7 दिन का प्लान बनाओ, रोज़ 2 घंटे\"*।",
        te: "నేను టైమ్‌టేబుల్ చేయగలను! 🗺️ సబ్జెక్ట్‌లు, సమయం చెప్పండి — ఉదా *\"ఫిజిక్స్, మ్యాథ్స్ కి 7 రోజుల ప్లాన్, రోజుకు 2 గంటలు\"*.",
      }, s.lang)
    }
    if (m.reason !== 'ok') {
      return L3({
        en: 'I need at least one subject with target hours (and a free day) before I can plan. Add one in the **Study Plan** tab and I will do the maths. 📅',
        hi: 'प्लान बनाने के लिए कम से कम एक विषय (लक्ष्य घंटों के साथ) और एक खाली दिन चाहिए। **स्टडी प्लान** टैब में जोड़िए, बाकी मैं कर दूँगा। 📅',
        te: 'ప్లాన్ చేయడానికి కనీసం ఒక సబ్జెక్ట్ (లక్ష్య గంటలతో) మరియు ఖాళీ రోజు కావాలి. **స్టడీ ప్లాన్** ట్యాబ్‌లో జోడించండి. 📅',
      }, s.lang)
    }
    const hours = Math.round((m.totalPlanned / 60) * 10) / 10
    return L3({
      en: `Plan's ready! 🗺️ ${m.days} days · ${hours}h of study · ~${m.sessionsPerDay} sessions a day.\n\n${(s.subjects || []).slice(0, 4).join(', ') || ''}\n\nHarder subjects get the freshest slots and come back for revision on day +3 and +7. Open the Study Plan tab to tweak it, or ask me *"what's my plan today?"*`,
      hi: `प्लान तैयार! 🗺️ ${m.days} दिन · ${hours}घं पढ़ाई · रोज़ ~${m.sessionsPerDay} सत्र।\n\n${(s.subjects || []).slice(0, 4).join(', ') || ''}\n\nकठिन विषयों को सबसे ताज़ा समय मिला और दिन +3 व +7 पर रिवीज़न आएगा। **स्टडी प्लान** टैब में बदल सकते हैं, या पूछिए *"आज का प्लान क्या है?"*`,
      te: `ప్లాన్ సిద్ధం! 🗺️ ${m.days} రోజులు · ${hours}గం చదువు · రోజుకు ~${m.sessionsPerDay} సెషన్లు.\n\n${(s.subjects || []).slice(0, 4).join(', ') || ''}\n\nకష్టమైన సబ్జెక్ట్‌లకు మంచి స్లాట్‌లు, +3/+7 రోజులకు రివిజన్. **స్టడీ ప్లాన్** ట్యాబ్‌లో మార్చుకోవచ్చు.`,
    }, s.lang)
  },

  studyplan_show: (s) => {
    const list = s.planToday || []
    if (!list.length) {
      return L3({
        en: "No sessions today. 🌱 Want me to build a plan? Say *\"make a study plan for maths and science\"* — or just start a quick focus block: *\"start a 25 minute focus on maths\"*.",
        hi: 'आज कोई सत्र नहीं। 🌱 प्लान बनाऊँ? कहिए *"गणित और विज्ञान का स्टडी प्लान बनाओ"* — या तुरंत शुरू कीजिए: *"गणित पर 25 मिनट फोकस शुरू करो"*।',
        te: 'ఈరోజు సెషన్లు లేవు. 🌱 ప్లాన్ చేయాలా? *"మ్యాథ్స్, సైన్స్ కి ప్లాన్ చేయి"* అనండి — లేదా *"మ్యాథ్స్ పై 25 నిమిషాల ఫోకస్"* మొదలుపెట్టండి.',
      }, s.lang)
    }
    const lines = list.slice(0, 6).map((x) => `${x.done ? '✅' : '⬜'} ${x.startTime} · ${x.subjectName} · ${x.minutes}m${x.topic ? ` · ${x.topic}` : ''}`).join('\n')
    const done = list.filter((x) => x.done).length
    const raw = L3({
      en: `Today's plan ({done}/{total} done):\n${lines}\n\nTap a session in the Study Plan tab to start the focus timer.`,
      hi: `आज का प्लान ({done}/{total} पूरे):\n${lines}\n\n**स्टडी प्लान** टैब में किसी सत्र पर टैप कीजिए — फोकस टाइमर शुरू हो जाएगा।`,
      te: `నేటి ప్లాన్ ({done}/{total} పూర్తి):\n${lines}\n\n**స్టడీ ప్లాన్** ట్యాబ్‌లో సెషన్ నొక్కితే ఫోకస్ టైమర్ మొదలవుతుంది.`,
    }, s.lang)
    return raw.split('{done}').join(String(done)).split('{total}').join(String(list.length))
  },

  focus_start: (s) => {
    const f = s.focus
    if (!f) {
      return L3({
        en: "Let's focus! ⏳ Tell me for how long and on what: *\"start a 25 minute focus on chemistry\"*.",
        hi: 'चलिए फोकस करें! ⏳ बताइए कितनी देर और किस पर: *"रसायन विज्ञान पर 25 मिनट फोकस शुरू करो"*।',
        te: 'ఫోకస్ చేద్దాం! ⏳ ఎంత సేపు, ఏది: *"కెమిస్ట్రీ పై 25 నిమిషాల ఫోకస్"* అనండి.',
      }, s.lang)
    }
    return L3({
      en: `Timer running: **${f.minutes} minutes**${f.subject ? ` on **${f.subject}**` : ''} ⏳\nI'll remind you when it's over, log the minutes and give you XP. Want music-quiet, phone-away mode? Just study — I'll handle the rest!`,
      hi: `टाइमर चालू: **${f.minutes} मिनट**${f.subject ? ` — **${f.subject}**` : ''} ⏳\nखत्म होने पर बता दूँगा, मिनट लॉग करूँगा और XP दूँगा। आप बस पढ़िए — बाकी मैं सँभाल लूँगा!`,
      te: `టైమర్ నడుస్తోంది: **${f.minutes} నిమిషాలు**${f.subject ? ` — **${f.subject}**` : ''} ⏳\nఅయ్యాక గుర్తు చేస్తాను, నిమిషాలు లాగ్ చేసి XP ఇస్తాను. మీరు చదవండి!`,
    }, s.lang)
  },

  notif_show: (s) => {
    const n = s.notifSummary || { unread: 0, recent: [] }
    if (!n.unread && !n.recent.length) {
      return L3({
        en: "All quiet — nothing unread. 🔔 I'll let you know the moment something needs you (I can even reach your phone if you allow it in Notifications ▸ Settings).",
        hi: 'सब शांत — कुछ अनपढ़ नहीं। 🔔 जब कुछ ज़रूरी होगा, तुरंत बता दूँगा (नोटिफिकेशन ▸ सेटिंग्स में अनुमति दें, तो फ़ोन पर भी पहुँच जाऊँगा)।',
        te: 'అంతా ప్రశాంతం — చదవనివి ఏమీ లేవు. 🔔 ఏదైనా ముఖ్యమైనప్పుడు చెబుతాను (నోటిఫికేషన్లు ▸ సెట్టింగ్స్‌లో అనుమతిస్తే ఫోన్‌కీ పంపగలను).',
      }, s.lang)
    }
    const lines = (n.recent || []).slice(0, 4).map((r) => `• ${r.title}`).join('\n')
    return L3({
      en: `You have **${n.unread} unread** 🔔\n${lines}\n\nOpen the Notifications tab for the full inbox — you can snooze anything without losing it.`,
      hi: `आपके पास **${n.unread} अनपढ़** हैं 🔔\n${lines}\n\nपूरा इनबॉक्स **नोटिफिकेशन** टैब में है — कुछ भी स्नूज़ कर सकते हैं, खोएगा नहीं।`,
      te: `మీకు **${n.unread} చదవనివి** ఉన్నాయి 🔔\n${lines}\n\nపూర్తి ఇన్‌బాక్స్ **నోటిఫికేషన్లు** ట్యాబ్‌లో. ఏదైనా స్నూజ్ చేయవచ్చు.`,
    }, s.lang)
  },

  time_show: (s) => {
    const t = s.timeSummary || { today: 0, streak: 0, goalPct: 0 }
    const h = Math.floor(t.today / 60), m = t.today % 60
    const pretty = h ? `${h}h ${m}m` : `${m}m`
    if (!t.today) {
      return L3({
        en: "Nothing logged today yet ⏳ — even 10 minutes counts. Say *\"start a 10 minute focus\"* and let's put a number on the board!",
        hi: 'आज अभी कुछ दर्ज नहीं ⏳ — 10 मिनट भी मायने रखते हैं। कहिए *"10 मिनट का फोकस शुरू करो"*, चलिए शुरुआत करें!',
        te: 'ఈరోజు ఇంకా నమోదు కాలేదు ⏳ — 10 నిమిషాలూ లెక్కలోకి వస్తాయి. *"10 నిమిషాల ఫోకస్ మొదలుపెట్టు"* అనండి!',
      }, s.lang)
    }
    return L3({
      en: `You've studied **${pretty}** today (${t.goalPct}% of your goal) and your streak is **${t.streak} day${t.streak === 1 ? '' : 's'}** 🔥\nEvery block lands in the Time tab with the subject breakdown.`,
      hi: `आज आपने **${pretty}** पढ़ा (लक्ष्य का ${t.goalPct}%) और स्ट्रीक **${t.streak} दिन** 🔥\nहर ब्लॉक **टाइम** टैब में विषय के हिसाब से दिखता है।`,
      te: `ఈరోజు **${pretty}** చదివారు (లక్ష్యంలో ${t.goalPct}%), స్ట్రీక్ **${t.streak} రోజులు** 🔥\nప్రతి బ్లాక్ **టైమ్** ట్యాబ్‌లో సబ్జెక్ట్ వారీగా కనిపిస్తుంది.`,
    }, s.lang)
  },
}

// ---------- Study music · study forest · focus shield ----------
const R3 = {
  music_start: (s) => {
    const m = s.musicStarted
    if (!m) {
      return L3({
        en: 'I can play music that I generate right here in your browser — no downloads. Try **"play focus music"**, **"play rain sounds"**, **"play brown noise"** or **"play lo-fi"**. 🎵',
        hi: 'मैं यहीं आपके ब्राउज़र में संगीत बना सकता हूँ — कुछ डाउनलोड नहीं। कहिए **"संगीत चलाओ"**, **"बारिश की आवाज़"**, **"ब्राउन नॉइज़"** या **"लो-फ़ाई चलाओ"**। 🎵',
        te: 'నేను ఇక్కడే మీ బ్రౌజర్‌లో సంగీతం తయారు చేయగలను — డౌన్‌లోడ్ అవసరం లేదు. **"మ్యూజిక్ ప్లే"**, **"వర్షం శబ్దం"**, **"బ్రౌన్ నాయిస్"**, **"లో-ఫై"** అనండి. 🎵',
      }, s.lang)
    }
    const layers = [
      m.music ? '🎹 ' + m.music : null,
      m.ambient ? '📻 ' + m.ambient : null,
      m.binaural ? '🧠 ' + m.binaural + (m.headphones ? ' (🎧)' : '') : null,
    ].filter(Boolean).join(' · ')
    return L3({
      en: `Playing **${m.name}** 🎵\n${layers}\n\nIt will fade out when your session ends. Say "stop the music" any time.`,
      hi: `**${m.name}** चल रहा है 🎵\n${layers}\n\nसत्र खत्म होते ही धीरे से बंद हो जाएगा। कभी भी "संगीत बंद करो" कहिए।`,
      te: `**${m.name}** ప్లే అవుతోంది 🎵\n${layers}\n\nసెషన్ ముగిసినప్పుడు మెల్లగా ఆగిపోతుంది. ఎప్పుడైనా "మ్యూజిక్ ఆపు" అనండి.`,
    }, s.lang)
  },

  music_stop: (s) => {
    if (!s.musicStopped) {
      return L3({
        en: 'Nothing is playing right now 🎵 — say **"play focus music"** when you want me to start something.',
        hi: 'अभी कुछ नहीं चल रहा 🎵 — जब शुरू कराना हो **"संगीत चलाओ"** कहिए।',
        te: 'ఇప్పుడు ఏదీ ప్లే అవ్వడం లేదు 🎵 — మొదలుపెట్టాలంటే **"మ్యూజిక్ ప్లే"** అనండి.',
      }, s.lang)
    }
    return L3({
      en: `Music stopped 🎵 — ${s.musicStopped} minute(s) logged to your study-music stats.`,
      hi: `संगीत बंद 🎵 — ${s.musicStopped} मिनट आपके म्यूज़िक आँकड़ों में जुड़ गए।`,
      te: `మ్యూజిక్ ఆగింది 🎵 — ${s.musicStopped} నిమిషాలు మీ మ్యూజిక్ గణాంకాల్లో చేరాయి.`,
    }, s.lang)
  },

  forest_plant: (s) => {
    const t = s.plantedTree
    if (!t) {
      return L3({
        en: 'Let us plant one 🌱 Say **"plant a tree for 25 minutes"** (or 10/15/45/60) and I will run the timer. If you leave the app, the tree withers — that is the deal.',
        hi: 'चलिए एक पेड़ लगाएँ 🌱 कहिए **"25 मिनट के लिए पेड़ लगाओ"** (या 10/15/45/60) — टाइमर मैं चलाऊँगा। ऐप छोड़ा तो पेड़ मुरझा जाएगा।',
        te: 'ఒకటి నాటుదాం 🌱 **"25 నిమిషాలకు చెట్టు నాటు"** అనండి (లేదా 10/15/45/60) — టైమర్ నేను నడుపుతాను. యాప్ వదిలితే చెట్టు వాడిపోతుంది.',
      }, s.lang)
    }
    return L3({
      en: `${t.emoji} **${t.species}** planted for **${t.minutes} minutes**${t.subject ? ` on ${t.subject}` : ''}!\nI am timing it now${t.music ? ' with study music on' : ''}. Stay in the app — if you leave, the tree wilts and you start again.`,
      hi: `${t.emoji} **${t.species}** **${t.minutes} मिनट** के लिए लग गया${t.subject ? ` — ${t.subject}` : ''}!\nटाइमर चल रहा है${t.music ? ' (संगीत भी)' : ''}। ऐप में बने रहिए — बाहर गए तो पेड़ मुरझा जाएगा।`,
      te: `${t.emoji} **${t.species}** **${t.minutes} నిమిషాలకు** నాటాను${t.subject ? ` — ${t.subject}` : ''}!\nటైమర్ నడుస్తోంది${t.music ? ' (సంగీతంతో)' : ''}. యాప్‌లో ఉండండి — బయటకు వెళితే చెట్టు వాడిపోతుంది.`,
    }, s.lang)
  },

  forest_stats: (s) => {
    const f = s.forest
    if (!f || !f.total) {
      return L3({
        en: 'Your forest is empty 🌱 — say **"plant a tree for 25 minutes"** and let us change that. Every finished session plants one.',
        hi: 'आपका फ़ॉरेस्ट खाली है 🌱 — कहिए **"25 मिनट के लिए पेड़ लगाओ"**। हर पूरा सत्र एक पेड़ लगाता है।',
        te: 'మీ ఫారెస్ట్ ఖాళీ 🌱 — **"25 నిమిషాలకు చెట్టు నాటు"** అనండి. ప్రతి పూర్తి సెషన్ ఒక చెట్టు.',
      }, s.lang)
    }
    return L3({
      en: `🌳 **${f.total} tree${f.total === 1 ? '' : 's'}** grown · ${Math.round(f.minutes / 60 * 10) / 10}h focused\n🔥 Streak: **${f.streak} day${f.streak === 1 ? '' : 's'}** · 🪙 ${f.coins} coins · today: ${f.todayTrees}${f.withered ? ` · 🥀 ${f.withered} lost` : ''}\n\nKeep the streak alive — even a 10-minute bamboo counts.`,
      hi: `🌳 **${f.total} पेड़** उगे · ${Math.round(f.minutes / 60 * 10) / 10}घं फोकस\n🔥 स्ट्रीक: **${f.streak} दिन** · 🪙 ${f.coins} सिक्के · आज: ${f.todayTrees}${f.withered ? ` · 🥀 ${f.withered} गए` : ''}\n\nस्ट्रीक बनाए रखिए — 10 मिनट का बाँस भी गिनता है।`,
      te: `🌳 **${f.total} చెట్లు** · ${Math.round(f.minutes / 60 * 10) / 10}గం ఫోకస్\n🔥 స్ట్రీక్: **${f.streak} రోజులు** · 🪙 ${f.coins} నాణేలు · ఈరోజు: ${f.todayTrees}${f.withered ? ` · 🥀 ${f.withered} పోయాయి` : ''}\n\nస్ట్రీక్ కాపాడండి — 10 నిమిషాల బంబూ కూడా లెక్క.`,
    }, s.lang)
  },

  shield_block: (s) => {
    const b = s.blocked
    if (!b) {
      return L3({
        en: 'Tell me what to block 🛡️ — like **"block instagram"**, **"block social media"** or **"block youtube"**. I keep the list and you can export it as a hosts file or DNS rules for every device.',
        hi: 'बताइए क्या ब्लॉक करना है 🛡️ — जैसे **"इंस्टाग्राम ब्लॉक करो"**, **"सोशल मीडिया ब्लॉक"**, **"यूट्यूब ब्लॉक"**। लिस्ट मैं रखता हूँ और hosts फ़ाइल/DNS नियम के रूप में हर डिवाइस के लिए एक्सपोर्ट कर सकते हैं।',
        te: 'ఏది బ్లాక్ చేయాలో చెప్పండి 🛡️ — **"ఇన్‌స్టా బ్లాక్"**, **"సోషల్ మీడియా బ్లాక్"**, **"యూట్యూబ్ బ్లాక్"**. లిస్ట్ నేను ఉంచుతాను, hosts ఫైల్/DNS రూల్స్‌గా ఎక్స్‌పోర్ట్ చేసుకోవచ్చు.',
      }, s.lang)
    }
    if (b.pack) {
      return L3({
        en: `Done 🛡️ Whole **${b.pack}** pack is on your blocklist now — ${b.addedCount} site${b.addedCount === 1 ? '' : 's'} (${b.sample}).\nExport it from the Focus Shield tab (hosts file or DNS rules) to block them on the device itself.`,
        hi: `हो गया 🛡️ **${b.pack}** का पूरा पैक अब ब्लॉकलिस्ट में है — ${b.addedCount} साइटें (${b.sample})।\nफ़ोकस शील्ड टैब से एक्सपोर्ट कीजिए (hosts फ़ाइल या DNS नियम) ताकि डिवाइस पर ही ब्लॉक हों।`,
        te: `అయింది 🛡️ **${b.pack}** ప్యాక్ మొత్తం బ్లాక్‌లిస్ట్‌లో ఉంది — ${b.addedCount} సైట్లు (${b.sample}).\nఫోకస్ షీల్డ్ ట్యాబ్ నుంచి ఎక్స్‌పోర్ట్ చేయండి (hosts ఫైల్ లేదా DNS రూల్స్).`,
      }, s.lang)
    }
    if (b.duplicate) {
      return L3({
        en: `**${b.site}** is already on the list 🛡️ — open the Focus Shield tab to export or remove it.`,
        hi: `**${b.site}** पहले से लिस्ट में है 🛡️ — फ़ोकस शील्ड टैब में एक्सपोर्ट या हटाने के लिए खोलिए।`,
        te: `**${b.site}** ఇప్పటికే లిస్ట్‌లో ఉంది 🛡️ — ఫోకస్ షీల్డ్ ట్యాబ్‌లో ఎక్స్‌పోర్ట్ లేదా తొలగించండి.`,
      }, s.lang)
    }
    return L3({
      en: `Blocked **${b.site}** 🛡️ (${b.total} site${b.total === 1 ? '' : 's'} on your list now).\nOpen Focus Shield → export the hosts file or DNS rules so it is blocked even when Bodhya is closed.`,
      hi: `**${b.site}** ब्लॉक 🛡️ (अब लिस्ट में ${b.total} साइट)।\nफ़ोकस शील्ड खोलकर hosts फ़ाइल या DNS नियम एक्सपोर्ट कीजिए — Bodhya बंद होने पर भी ब्लॉक रहेगा।`,
      te: `**${b.site}** బ్లాక్ 🛡️ (ఇప్పుడు లిస్ట్‌లో ${b.total} సైట్లు).\nఫోకస్ షీల్డ్ తెరిచి hosts ఫైల్ లేదా DNS రూల్స్ ఎక్స్‌పోర్ట్ చేయండి.`,
    }, s.lang)
  },

  shield_show: (s) => {
    const l = s.blocklist || { sites: [], packs: [] }
    if (!l.sites.length) {
      return L3({
        en: 'Nothing is on your blocklist yet 🛡️ — say **"block social media"** and I will add the whole pack (Instagram, X, TikTok, YouTube Shorts habits…).',
        hi: 'ब्लॉकलिस्ट खाली है 🛡️ — कहिए **"सोशल मीडिया ब्लॉक करो"**, मैं पूरा पैक जोड़ दूँगा (इंस्टाग्राम, X, टिकटॉक…)।',
        te: 'బ్లాక్‌లిస్ట్ ఖాళీ 🛡️ — **"సోషల్ మీడియా బ్లాక్"** అనండి, పూర్తి ప్యాక్ జోడిస్తాను.',
      }, s.lang)
    }
    const list = l.sites.slice(0, 10).map((x) => `🚫 ${x}`).join('\n')
    return L3({
      en: `On your blocklist (${l.sites.length}):\n${list}${l.sites.length > 10 ? `\n… +${l.sites.length - 10} more` : ''}\n\nActive packs: ${l.packs.join(', ') || 'none'}. Open Focus Shield to export it to your device.`,
      hi: `आपकी ब्लॉकलिस्ट (${l.sites.length}):\n${list}${l.sites.length > 10 ? `\n… +${l.sites.length - 10} और` : ''}\n\nचालू पैक: ${l.packs.join(', ') || 'कोई नहीं'}। डिवाइस पर एक्सपोर्ट करने के लिए फ़ोकस शील्ड खोलिए।`,
      te: `మీ బ్లాక్‌లిస్ట్ (${l.sites.length}):\n${list}${l.sites.length > 10 ? `\n… +${l.sites.length - 10}` : ''}\n\nయాక్టివ్ ప్యాక్‌లు: ${l.packs.join(', ') || 'ఏదీ లేదు'}.`,
    }, s.lang)
  },

  shield_stats: (s) => {
    const st = s.shieldStats
    if (!st || !st.sessions) {
      return L3({
        en: 'No guarded sessions yet 🛡️ Start a focus block (or plant a tree) and I will track every time you leave the app.',
        hi: 'अभी कोई निगरानी वाला सत्र नहीं 🛡️ फोकस ब्लॉक शुरू कीजिए (या पेड़ लगाइए) — ऐप छोड़ने की हर बार मैं नज़र रखूँगा।',
        te: 'ఇంకా గార్డెడ్ సెషన్లు లేవు 🛡️ ఫోకస్ బ్లాక్ మొదలుపెట్టండి (లేదా చెట్టు నాటండి) — ప్రతిసారీ గమనిస్తాను.',
      }, s.lang)
    }
    return L3({
      en: `🛡️ **${st.sessions} guarded sessions · ${st.cleanRate}% clean**\n🚪 Escapes: ${st.escapes} (this week ${st.escapesThisWeek}) · 💪 urges resisted: ${st.resisted}\n🔥 Clean streak: ${st.cleanStreak} · ⏳ ${Math.round(st.protectedMinutes)} min protected${st.bestHour ? `\n🕐 You slip most around ${String(st.bestHour.hour).padStart(2, '0')}:00 — worth a strict hour.` : ''}`,
      hi: `🛡️ **${st.sessions} निगरानी सत्र · ${st.cleanRate}% साफ़**\n🚪 भटकाव: ${st.escapes} (इस हफ़्ते ${st.escapesThisWeek}) · 💪 रोकी इच्छाएँ: ${st.resisted}\n🔥 साफ़ स्ट्रीक: ${st.cleanStreak} · ⏳ ${Math.round(st.protectedMinutes)} मिनट बचाए${st.bestHour ? `\n🕐 आप ${String(st.bestHour.hour).padStart(2, '0')}:00 के आसपास फिसलते हैं — उस घंटे को सख़्त रखिए।` : ''}`,
      te: `🛡️ **${st.sessions} గార్డెడ్ సెషన్లు · ${st.cleanRate}% క్లీన్**\n🚪 ఎస్కేప్‌లు: ${st.escapes} (ఈ వారం ${st.escapesThisWeek}) · 💪 ఆపిన కోరికలు: ${st.resisted}\n🔥 క్లీన్ స్ట్రీక్: ${st.cleanStreak} · ⏳ ${Math.round(st.protectedMinutes)} నిమి కాపాడారు${st.bestHour ? `\n🕐 మీరు ${String(st.bestHour.hour).padStart(2, '0')}:00 ప్రాంతంలో జారిపోతారు.` : ''}`,
    }, s.lang)
  },

  urge_help: (s) => {
    const u = s.urge
    if (!u) {
      return L3({
        en: 'That feeling passes — and I will hold you for 90 seconds while it does 🫁\nBreathe in 4, hold 4, out 6. Want to start the urge timer? Just say **"I want to scroll"** again and I will run it.',
        hi: 'यह इच्छा उतर जाती है — और 90 सेकंड मैं आपके साथ हूँ 🫁\n4 पर साँस लें, 4 रोकें, 6 पर छोड़ें। इच्छा-टाइमर शुरू करना है? फिर कहिए **"मुझे स्क्रॉल करना है"**।',
        te: 'ఈ కోరిక తగ్గిపోతుంది — ఆ 90 సెకన్లు నేను తోడు ఉంటాను 🫁\n4 లోపు శ్వాస, 4 ఆపి, 6లో వదలండి. టైమర్ కావాలంటే మళ్లీ **"నాకు స్క్రోల్ చేయాలి"** అనండి.',
      }, s.lang)
    }
    return L3({
      en: `🫁 **Urge surfing started — ${u.seconds} seconds.**\nBreathe with the circle on screen. You do not have to decide anything yet; the urge peaks and falls on its own. I will ask you when it is over.`,
      hi: `🫁 **इच्छा-सर्फ़िंग शुरू — ${u.seconds} सेकंड।**\nस्क्रीन पर गोले के साथ साँस लीजिए। अभी कुछ तय नहीं करना; इच्छा अपने आप चरम पर आकर उतरती है। ख़त्म होने पर मैं पूछूँगा।`,
      te: `🫁 **ఇచ్ఛా సర్ఫింగ్ మొదలైంది — ${u.seconds} సెకన్లు.**\nతెరపై వృత్తంతో శ్వాస తీసుకోండి. ఇప్పుడే ఏదీ నిర్ణయించకండి; కోరిక తనంతట తానే గరిష్ఠానికి వెళ్లి తగ్గుతుంది.`,
    }, s.lang)
  },
}

// ---------- Journal (personalised diary) ----------
const R4 = {
  journal_add: (s) => {
    const j = s.journalSaved
    if (!j) {
      return L3({
        en: 'Tell me what happened and I will file it in today\'s journal 📔 — like *"journal: optics finally clicked, but I lost 40 minutes to my phone"*.',
        hi: 'बताइए क्या हुआ, मैं आज के जर्नल में लिख दूँगा 📔 — जैसे *"जर्नल: ऑप्टिक्स आख़िरकार समझ आया, पर 40 मिनट फ़ोन पर गए"*।',
        te: 'ఏం జరిగిందో చెప్పండి, నేటి జర్నల్‌లో రాస్తాను 📔 — ఉదా *"జర్నల్: ఆప్టిక్స్ ఎట్టకేలకు అర్థమైంది, కానీ 40 నిమిషాలు ఫోన్‌లో పోయాయి"*.',
      }, s.lang)
    }
    const moodLine = j.mood
      ? `\n${['', '😞', '😕', '😐', '🙂', '😄'][j.mood]} ${{ en: 'noted the mood too', hi: 'मूड भी दर्ज किया', te: 'మూడ్ కూడా నమోదు చేశాను' }[s.lang]}`
      : `\n💡 ${{
        en: 'Tip: add a word like “great”, “okay” or “tired” and I will set the mood for you.',
        hi: 'टिप: “शानदार”, “ठीक” या “थका” जैसा शब्द जोड़िए — मूड मैं सेट कर दूँगा।',
        te: 'టిప్: “బాగుంది”, “ఓకే”, “అలసట” లాంటి పదం జోడిస్తే మూడ్ నేను పెడతాను.',
      }[s.lang]}`
    return L3({
      en: `Saved to your journal ✍️ (${j.words} word${j.words === 1 ? '' : 's'}, 🔥 ${j.streak}-day writing streak)${moodLine}${j.xp ? `\n+${j.xp} XP.` : ''}\nOpen the Journal tab to add a win, a struggle or tomorrow\'s one thing.`,
      hi: `जर्नल में सेव ✍️ (${j.words} शब्द, 🔥 ${j.streak} दिन की स्ट्रीक)${moodLine}${j.xp ? `\n+${j.xp} XP।` : ''}\nजर्नल टैब में जीत, कठिनाई या कल का एक काम जोड़ सकते हैं।`,
      te: `జర్నల్‌లో సేవ్ ✍️ (${j.words} పదాలు, 🔥 ${j.streak} రోజుల స్ట్రీక్)${moodLine}${j.xp ? `\n+${j.xp} XP.` : ''}\nజర్నల్ ట్యాబ్‌లో విజయం, ఇబ్బంది, రేపటి పని జోడించండి.`,
    }, s.lang)
  },

  journal_prompt: (s) => {
    const list = s.journalPrompts || []
    if (!list.length) {
      return L3({
        en: 'Prompts appear once I have a day to work with — start a focus block or plant a tree, then ask again 📔',
        hi: 'सवाल तब बनते हैं जब दिन का कुछ डेटा हो — फोकस ब्लॉक या पेड़ शुरू कीजिए, फिर पूछिए 📔',
        te: 'రోజు డేటా ఉంటే ప్రశ్నలు వస్తాయి — ఫోకస్ లేదా చెట్టు మొదలుపెట్టి మళ్లీ అడగండి 📔',
      }, s.lang)
    }
    const lines = list.map((p, i) => `${i + 1}. ${p}`).join('\n')
    return L3({
      en: `Here are today\'s prompts — picked from your own day 📔\n${lines}\n\nAnswer any of them (or just say *"journal: …"*) and I will save it.`,
      hi: `आज के सवाल — आपके ही दिन से चुने हुए 📔\n${lines}\n\nकिसी का भी जवाब दीजिए (या *"जर्नल: …"* कहिए) — मैं सेव कर दूँगा।`,
      te: `నేటి ప్రశ్నలు — మీ రోజు నుంచే ఎంపిక 📔\n${lines}\n\nఏదైనా జవాబు ఇవ్వండి (లేదా *"జర్నల్: …"*) — సేవ్ చేస్తాను.`,
    }, s.lang)
  },

  journal_show: (s) => {
    const j = s.journalSummary
    if (!j || !j.count) {
      return L3({
        en: 'Your journal is empty 📔 — say *"journal: first entry, easier than I thought"* and it will not be.',
        hi: 'जर्नल खाली है 📔 — कहिए *"जर्नल: पहली प्रविष्टि, सोचा था उससे आसान"*।',
        te: 'జర్నల్ ఖాళీ 📔 — *"జర్నల్: మొదటి ఎంట్రీ, అనుకున్నదానికంటే సులభం"* అనండి.',
      }, s.lang)
    }
    const last = j.last
    const lastLine = last
      ? `\n\n📄 **${last.day}** ${last.moodEmoji || ''}\n“${String(last.text).slice(0, 200)}${String(last.text).length > 200 ? '…' : ''}”`
      : ''
    return L3({
      en: `📔 ${j.count} entr${j.count === 1 ? 'y' : 'ies'} · 🔥 ${j.streak}-day writing streak · average mood ${j.avgMood}/5 · ${j.words} words\nMood over 14 days: ${j.trend === 'up' ? 'rising 📈' : j.trend === 'down' ? 'dipping 📉' : 'steady ➖'}${lastLine}\n\n${j.weekly || ''}`,
      hi: `📔 ${j.count} प्रविष्टियाँ · 🔥 ${j.streak} दिन की स्ट्रीक · औसत मूड ${j.avgMood}/5 · ${j.words} शब्द\n14 दिनों का मूड: ${j.trend === 'up' ? 'सुधर रहा 📈' : j.trend === 'down' ? 'घट रहा 📉' : 'स्थिर ➖'}${lastLine}\n\n${j.weekly || ''}`,
      te: `📔 ${j.count} ఎంట్రీలు · 🔥 ${j.streak} రోజుల స్ట్రీక్ · సగటు మూడ్ ${j.avgMood}/5 · ${j.words} పదాలు\n14 రోజుల మూడ్: ${j.trend === 'up' ? 'పెరుగుతోంది 📈' : j.trend === 'down' ? 'తగ్గుతోంది 📉' : 'స్థిరం ➖'}${lastLine}\n\n${j.weekly || ''}`,
    }, s.lang)
  },
}

// ---------- Letters 💌 · Guardian 👨‍👩‍👧 ----------
const R5 = {
  letter_write: (s) => {
    const l = s.letterSealed
    if (!l) {
      return L3({
        en: 'Let us write one 💌 Tell me the date and I will seal it — *"letter to future me, open in 3 months"*. Or open the Journal → Letters tab and write freely; I will keep it shut until then.',
        hi: 'एक लिखते हैं 💌 तारीख़ बताइए, मैं सील कर दूँगा — *"भविष्य को चिट्ठी, 3 महीने बाद खोलो"*। या जर्नल → चिट्ठियाँ टैब में खुलकर लिखिए।',
        te: 'ఒకటి రాస్తాం 💌 తేదీ చెప్పండి, ముద్రిస్తాను — *"భవిష్యత్తుకు ఉత్తరం, 3 నెలల్లో తెరవు"*. లేదా జర్నల్ → ఉత్తరాలు ట్యాబ్‌లో రాయండి.',
      }, s.lang)
    }
    return L3({
      en: `Sealed 💌 I will hand it back on **${l.unlockAt}** (${l.days} day${l.days === 1 ? '' : 's'} from now).\nUntil then you will only see the countdown — not even you can open it early.`,
      hi: `सील हो गई 💌 **${l.unlockAt}** (${l.days} दिन बाद) को लौटा दूँगा।\nतब तक सिर्फ़ उलटी गिनती दिखेगी — जल्दी खोलना आपके लिए भी मुमकिन नहीं।`,
      te: `ముద్రించాను 💌 **${l.unlockAt}** (${l.days} రోజుల తర్వాత) అప్పగిస్తాను.\nఅప్పటివరకు కౌంట్‌డౌన్ మాత్రమే — ముందుగా మీరూ తెరవలేరు.`,
    }, s.lang)
  },

  letter_show: (s) => {
    const l = s.letters
    if (!l || !l.total) {
      return L3({
        en: 'No letters yet 💌 Write one — *"letter to future me, open in a month"* — and I will keep it sealed until then.',
        hi: 'अभी कोई चिट्ठी नहीं 💌 एक लिखिए — *"भविष्य को चिट्ठी, महीने बाद खोलो"* — मैं तब तक बंद रखूँगा।',
        te: 'ఇంకా ఉత్తరాలు లేవు 💌 ఒకటి రాయండి — *"భవిష్యత్తుకు ఉత్తరం, నెల తర్వాత తెరవు"* — అప్పటివరకు బంద్ ఉంచుతాను.',
      }, s.lang)
    }
    const lines = []
    if (l.sealed) lines.push(`🔒 ${l.sealed} ${L3({ en: 'sealed', hi: 'सीलबंद', te: 'ముద్రితం' }, s.lang)}`)
    if (l.ready) lines.push(`✉️ ${l.ready} ${L3({ en: 'ready to open now!', hi: 'अब खोलने के लिए तैयार!', te: 'ఇప్పుడు తెరవడానికి సిద్ధం!' }, s.lang)}`)
    if (l.opened) lines.push(`📖 ${l.opened} ${L3({ en: 'opened', hi: 'खुली', te: 'తెరిచినవి' }, s.lang)}`)
    if (l.replied) lines.push(`↩️ ${l.replied} ${L3({ en: 'replied to', hi: 'जवाब दिए', te: 'జవాబిచ్చారు' }, s.lang)}`)
    const next = l.next ? L3({ en: `\nNext one opens in ${l.nextIn} day(s).`, hi: `\nअगली ${l.nextIn} दिन में खुलेगी।`, te: `\nతదుపరిది ${l.nextIn} రోజుల్లో తెరుచుకుంటుంది.` }, s.lang) : ''
    return L3({
      en: `💌 Your letters:\n${lines.join('\n')}${next}\n\nOpen the Journal → Letters tab to read or reply.`,
      hi: `💌 आपकी चिट्ठियाँ:\n${lines.join('\n')}${next}\n\nपढ़ने या जवाब देने के लिए जर्नल → चिट्ठियाँ टैब खोलिए।`,
      te: `💌 మీ ఉత్తరాలు:\n${lines.join('\n')}${next}\n\nచదవడానికి జర్నల్ → ఉత్తరాలు ట్యాబ్ తెరవండి.`,
    }, s.lang)
  },

  guardian_share: (s) => {
    const g = s.guardian
    if (!g || !g.code) {
      return L3({
        en: 'I can build a read-only progress view for a parent or teacher 👨‍👩‍👧 — you pick the sections, journal writing stays private, and you can revoke it any time. Open the Guardian tab to create a code.',
        hi: 'माता-पिता या शिक्षक के लिए सिर्फ़-पढ़ने वाला प्रोग्रेस व्यू बना सकता हूँ 👨‍👩‍👧 — भाग आप चुनेंगे, जर्नल निजी रहेगा, और कभी भी रद्द कर सकते हैं। गार्डियन टैब में कोड बनाइए।',
        te: 'తల్లిదండ్రులు లేదా టీచర్ కోసం చదవడానికి-మాత్రమే ప్రోగ్రెస్ వ్యూ తయారుచేయగలను 👨‍👩‍👧 — విభాగాలు మీరే ఎంచుకుంటారు, జర్నల్ ప్రైవేట్, ఎప్పుడైనా రద్దు చేయవచ్చు. గార్డియన్ ట్యాబ్‌లో కోడ్ సృష్టించండి.',
      }, s.lang)
    }
    return L3({
      en: `Sharing code: **${g.code}** 👨‍👩‍👧\nThey open Guardian → enter the code. Shared: ${g.sections}. ${g.textShared ? 'Journal writing is visible (you turned it on).' : 'Journal writing stays private.'}\nYou can pause or rotate the code any time — I will tell you if you want.`,
      hi: `शेयरिंग कोड: **${g.code}** 👨‍👩‍👧\nवे अभिभावक → कोड डालेंगे। साझा: ${g.sections}। ${g.textShared ? 'जर्नल लिखा हुआ दिख रहा है (आपने चालू किया)।' : 'जर्नल लिखा हुआ निजी है।'}\nकोड कभी भी रोक या बदल सकते हैं — चाहें तो बता दूँगा।`,
      te: `షేరింగ్ కోడ్: **${g.code}** 👨‍👩‍👧\nవారు గార్డియన్ → కోడ్ నమోదు చేస్తారు. పంచినవి: ${g.sections}. ${g.textShared ? 'జర్నల్ రాత కనిపిస్తోంది (మీరు ఆన్ చేశారు).' : 'జర్నల్ రాత ప్రైవేట్‌గా ఉంది.'}\nఎప్పుడైనా కోడ్ ఆపవచ్చు, మార్చవచ్చు.`,
    }, s.lang)
  },
}

// ---------- creation paths: suggestions, packs, plan → to-dos ----------
const R6 = {
  todo_suggest: (s) => {
    const list = s.todoSuggestions || []
    if (!list.length) {
      return L3({
        en: 'Your list looks fine and nothing needs flagging right now 🌱 Want a ready-made pack instead? Try **“add the exam week pack”** or say *“add to-do: revise chapter 4”*.',
        hi: 'आपकी लिस्ट ठीक है और अभी कुछ ज़रूरी नहीं 🌱 तैयार पैक चाहिए? कहिए **“परीक्षा सप्ताह पैक जोड़ो”** या *“टू-डू जोड़ो: अध्याय 4 दोहराओ”*।',
        te: 'మీ లిస్ట్ బాగుంది, ఇప్పుడు ప్రత్యేకంగా ఏమీ లేదు 🌱 రెడీ ప్యాక్ కావాలా? **“పరీక్ష వారం ప్యాక్ జోడించు”** అనండి.',
      }, s.lang)
    }
    const lines = list.map((x, i) => `${i + 1}. **${x.title}** — ${x.minutes} min\n   _${x.why}_`).join('\n')
    return L3({
      en: `Here is what I would do next, {name} — taken from your own day:\n${lines}\n\nOpen the To-do tab and tap ＋ on any of them, or say **“add all of those”**.`,
      hi: `आपके दिन को देखकर, {name} — अगला यह करूँगा:\n${lines}\n\nटू-डू टैब में किसी पर ＋ दबाइए, या कहिए **“सब जोड़ दो”**।`,
      te: `మీ రోజు చూసి, {name} — తర్వాత ఇది చేస్తాను:\n${lines}\n\nటూ-డూ ట్యాబ్‌లో ＋ నొక్కండి, లేదా **“అన్నీ జోడించు”** అనండి.`,
    }, s.lang)
  },

  todo_pack: (s) => {
    const p = s.packApplied
    if (!p) {
      return L3({
        en: 'Which pack? I have **Exam week**, **Daily basics**, **Revision cycle**, **New chapter workflow** and **Weekend catch-up** — say *“add the exam week pack”*.',
        hi: 'कौन सा पैक? मेरे पास **परीक्षा सप्ताह**, **रोज़ की बुनियाद**, **रिवीज़न चक्र**, **नया अध्याय क्रम** और **सप्ताहांत कैच-अप** हैं — कहिए *“परीक्षा सप्ताह पैक जोड़ो”*।',
        te: 'ఏ ప్యాక్? నా దగ్గర **పరీక్ష వారం**, **రోజువారీ బేసిక్స్**, **రివిజన్ సైకిల్**, **కొత్త చాప్టర్**, **వారాంత క్యాచ్-అప్** ఉన్నాయి.',
      }, s.lang)
    }
    if (!p.added) {
      return L3({
        en: `**${p.label}** is already on your list — nothing added (${p.skipped} task(s) were already there).`,
        hi: `**${p.label}** पहले से आपकी लिस्ट में है — कुछ नहीं जोड़ा (${p.skipped} काम पहले से थे)।`,
        te: `**${p.label}** ఇప్పటికే లిస్ట్‌లో ఉంది — కొత్తగా ఏమీ జోడించలేదు (${p.skipped}).`,
      }, s.lang)
    }
    return L3({
      en: `Added **${p.added}** task${p.added === 1 ? '' : 's'} from **${p.label}** 📦\n${p.titles.map((t) => `• ${t}`).join('\n')}${p.skipped ? `\n(${p.skipped} were already on your list.)` : ''}`,
      hi: `**${p.label}** से **${p.added}** काम जोड़े 📦\n${p.titles.map((t) => `• ${t}`).join('\n')}${p.skipped ? `\n(${p.skipped} पहले से लिस्ट में थे।)` : ''}`,
      te: `**${p.label}** నుంచి **${p.added}** పనులు జోడించాను 📦\n${p.titles.map((t) => `• ${t}`).join('\n')}${p.skipped ? `\n(${p.skipped} ఇప్పటికే ఉన్నాయి.)` : ''}`,
    }, s.lang)
  },

  chapter_tasks: (s) => {
    const ch = s.chapterTasks
    if (!ch) {
      return L3({
        en: 'Paste the chapter text with it and I will cut it into tasks — headings, definitions, exercises and all 📖\n' +
          'Example: *“make tasks from this chapter: 4.1 Reflection of light … Exercise 4.2 Q1–Q8”*\n' +
          'Or open the To-do tab → **From a chapter** and paste it there.',
        hi: 'अध्याय का टेक्स्ट साथ भेजिए और मैं उसे टास्क में बाँट दूँगा — शीर्षक, परिभाषाएँ, अभ्यास, सब 📖\n' +
          'जैसे: *“अध्याय से टास्क बनाओ: 4.1 प्रकाश का परावर्तन … अभ्यास 4.2 प्रश्न 1–8”*\n' +
          'या टू-डू टैब → **अध्याय से** खोलकर वहाँ पेस्ट करें।',
        te: 'అధ్యాయం టెక్స్ట్‌తో పంపండి, నేను దాన్ని టాస్క్‌లుగా విభజిస్తాను — హెడ్డింగ్‌లు, నిర్వచనాలు, వ్యాయామాలు అన్నీ 📖\n' +
          'ఉదా: *“అధ్యాయం నుంచి టాస్క్‌లు: 4.1 కాంతి పరావర్తనం … వ్యాయామం 4.2 ప్రశ్నలు 1–8”*\n' +
          'లేదా టూ-డూ ట్యాబ్ → **అధ్యాయం నుంచి** తెరిచి అక్కడ పేస్ట్ చెయ్యండి.',
      }, s.lang)
    }
    if (!ch.found) {
      return L3({
        en: `I read ${ch.lines} line${ch.lines === 1 ? '' : 's'} but could not spot clear tasks 🤔 Headings, “Term: meaning”, formulas and “Exercise 4.2” lines work best.`,
        hi: `मैंने ${ch.lines} पंक्तियाँ पढ़ीं, पर साफ़ टास्क नहीं मिले 🤔 शीर्षक, “शब्द: अर्थ”, सूत्र और “अभ्यास 4.2” जैसी पंक्तियाँ सबसे अच्छा काम करती हैं।`,
        te: `నేను ${ch.lines} లైన్లు చదివాను కానీ స్పష్టమైన టాస్క్‌లు కనిపించలేదు 🤔 హెడ్డింగ్‌లు, “పదం: అర్థం”, సూత్రాలు, “వ్యాయామం 4.2” లాంటివి బాగా పనిచేస్తాయి.`,
      }, s.lang)
    }
    const bits = `${ch.topics} topic${ch.topics === 1 ? '' : 's'} · ${ch.terms} term${ch.terms === 1 ? '' : 's'} · ${ch.exercises} exercise${ch.exercises === 1 ? '' : 's'}`
    const dup = ch.skipped ? { en: ` (${ch.skipped} were already on your list)`, hi: ` (${ch.skipped} पहले से लिस्ट में थे)`, te: ` (${ch.skipped} ఇప్పటికే ఉన్నాయి)` }[s.lang] || '' : ''
    return L3({
      en: `From **${ch.subject || 'your chapter'}** I found ${ch.found} task${ch.found === 1 ? '' : 's'} and added them ✅${dup}\n${ch.titles.map((t) => `• ${t}`).join('\n')}\n\nScanned: ${bits}. Everything stayed on your device.`,
      hi: `आपके **${ch.subject || 'अध्याय'}** से ${ch.found} टास्क मिले और जोड़ दिए ✅${dup}\n${ch.titles.map((t) => `• ${t}`).join('\n')}\n\nस्कैन: ${ch.topics} टॉपिक · ${ch.terms} शब्द · ${ch.exercises} अभ्यास। सब कुछ आपके डिवाइस पर ही रहा।`,
      te: `**${ch.subject || 'మీ అధ్యాయం'}** నుంచి ${ch.found} టాస్క్‌లు దొరికి జోడించాను ✅${dup}\n${ch.titles.map((t) => `• ${t}`).join('\n')}\n\nస్కాన్: ${ch.topics} అంశాలు · ${ch.terms} పదాలు · ${ch.exercises} వ్యాయామాలు. అంతా మీ పరికరంలోనే ఉండింది.`,
    }, s.lang)
  },

  plan_repeat: (s) => {
    const r = s.repeatSet
    if (!r) {
      return L3({
        en: 'Tell me which days and I will repeat it — say *“repeat my 6 pm session every mon and wed”* 🔁',
        hi: 'कौन से दिन बताइए, मैं दोहरा दूँगा — कहिए *“शाम 6 बजे का सत्र हर सोम-बुध दोहराओ”* 🔁',
        te: 'ఏ రోజులో చెప్పండి, పునరావృతం చేస్తాను — *“సాయంత్రం 6 గంటల సెషన్ ప్రతి సోమ, బుధ”* 🔁',
      }, s.lang)
    }
    if (r.error === 'no-session') {
      return L3({
        en: 'I could not find a session to repeat — build or tap one in the Study Plan tab first 📅',
        hi: 'दोहराने के लिए सत्र नहीं मिला — पहले स्टडी प्लान टैब में एक सत्र बनाइए 📅',
        te: 'పునరావృతం చేయడానికి సెషన్ దొరకలేదు — ముందు స్టడీ ప్లాన్ ట్యాబ్‌లో ఒకటి చేయండి 📅',
      }, s.lang)
    }
    return L3({
      en: `Done — **${r.subject}** at ${r.time} now repeats every ${r.days} 🔁${r.created ? ` (${r.created} more session${r.created === 1 ? '' : 's'} added)` : ''}\nChange or stop it any time from the session in the Study Plan tab.`,
      hi: `हो गया — **${r.subject}** ${r.time} पर अब हर ${r.days} दोहराएगा 🔁${r.created ? ` (${r.created} सत्र जोड़े)` : ''}\nस्टडी प्लान टैब में सत्र से कभी भी बदल या बंद कर सकते हैं।`,
      te: `అయింది — **${r.subject}** ${r.time} కి ఇప్పుడు ప్రతి ${r.days} పునరావృతమవుతుంది 🔁${r.created ? ` (${r.created} సెషన్లు జోడించాను)` : ''}\nస్టడీ ప్లాన్ ట్యాబ్‌లో ఎప్పుడైనా మార్చుకోవచ్చు.`,
    }, s.lang)
  },

  plan_move: (s) => {
    const mv = s.movedSession
    if (!mv) {
      return L3({
        en: 'Which session, and where to? Say *“move my 6 pm session to tomorrow 7 pm”* 🖐️ — or just drag it in the Study Plan grid.',
        hi: 'कौन सा सत्र और कहाँ? कहिए *“शाम 6 का सत्र कल 7 बजे कर दो”* 🖐️ — या स्टडी प्लान ग्रिड में खींच लीजिए।',
        te: 'ఏ సెషన్, ఎక్కడికి? *“సాయంత్రం 6 సెషన్ రేపు 7 కి”* అనండి 🖐️ — లేదా గ్రిడ్‌లో లాగండి.',
      }, s.lang)
    }
    if (mv.error === 'same') {
      return L3({
        en: 'That is exactly where it already is 🙂 Want a different day or time?',
        hi: 'वह पहले से वहीं है 🙂 कोई और दिन या समय चाहिए?',
        te: 'అది ఇప్పటికే అక్కడే ఉంది 🙂 వేరే రోజు లేదా సమయం కావాలా?',
      }, s.lang)
    }
    if (mv.error === 'busy') {
      return L3({
        en: `⚠️ ${mv.conflicts} other session${mv.conflicts === 1 ? ' is' : 's are'} at that slot — I moved it anyway, but the day now has two. Want me to push one to tomorrow?`,
        hi: `⚠️ उस स्लॉट में ${mv.conflicts} और सत्र हैं — मैंने फिर भी खिसका दिया, अब उस दिन दो हैं। किसी को कल भेज दूँ?`,
        te: `⚠️ ఆ స్లాట్‌లో మరో ${mv.conflicts} సెషన్ ఉంది — అయినా జరిపాను, ఇప్పుడు రెండు ఉన్నాయి. ఒకటి రేపటికి పంపనా?`,
      }, s.lang)
    }
    if (mv.error) {
      return L3({
        en: 'A finished session stays where it is (its minutes are already logged) ✅',
        hi: 'पूरा हुआ सत्र वहीं रहता है (उसके मिनट दर्ज हैं) ✅',
        te: 'పూర్తయిన సెషన్ అక్కడే ఉంటుంది (నిమిషాలు నమోదయ్యాయి) ✅',
      }, s.lang)
    }
    return L3({
      en: `Moved — **${mv.subject}** is now ${mv.when} 🖐️${mv.moved > 1 ? ` (${mv.moved} sessions in that repeat)` : ''}`,
      hi: `खिसका दिया — **${mv.subject}** अब ${mv.when} 🖐️${mv.moved > 1 ? ` (उस दोहराव के ${mv.moved} सत्र)` : ''}`,
      te: `జరిపాను — **${mv.subject}** ఇప్పుడు ${mv.when} 🖐️${mv.moved > 1 ? ` (ఆ పునరావృతంలో ${mv.moved} సెషన్లు)` : ''}`,
    }, s.lang)
  },

  plan_to_tasks: (s) => {
    const added = s.planToTasks
    if (!added || !added.length) {
      return L3({
        en: 'Nothing left on today’s plan to turn into tasks 🌱 (Finished sessions never get re-added.)',
        hi: 'आज के प्लान में बदलने लायक कुछ बाकी नहीं 🌱 (पूरे हुए सत्र दोबारा नहीं जुड़ते।)',
        te: 'నేటి ప్లాన్‌లో మార్చడానికి ఏమీ మిగలలేదు 🌱 (పూర్తయిన సెషన్లు మళ్లీ జోడించబడవు.)',
      }, s.lang)
    }
    return L3({
      en: `Done — ${added.length} task${added.length === 1 ? '' : 's'} came from today’s plan 📅\n${added.map((t) => `• ${t}`).join('\n')}\n\nTick them off and I will mark the matching plan session done too.`,
      hi: `हो गया — आज के प्लान से ${added.length} काम आए 📅\n${added.map((t) => `• ${t}`).join('\n')}\n\nटिक करते ही प्लान का सत्र भी पूरा हो जाएगा।`,
      te: `అయింది — నేటి ప్లాన్ నుంచి ${added.length} పనులు 📅\n${added.map((t) => `• ${t}`).join('\n')}\n\nటిక్ చేస్తే సెషన్ కూడా పూర్తవుతుంది.`,
    }, s.lang)
  },
}

const FEATURE_QUICK = {
  alarm_add: { en: ['My alarms', 'Remind me at 7 am to study', 'Set an alarm in 20 minutes'], hi: ['मेरे अलार्म', 'सुबह 7 बजे पढ़ाई का रिमाइंडर', '20 मिनट में अलार्म लगाओ'], te: ['నా అలారమ్‌లు', 'ఉదయం 7 కి రిమైండర్', '20 నిమిషాల్లో అలారం'] },
  alarm_show: { en: ['Remind me at 6 am to revise', 'My to-dos'], hi: ['सुबह 6 बजे रिवीज़न का रिमाइंडर', 'मेरे टू-डू'], te: ['ఉదయం 6 కి రివిజన్ రిమైండర్', 'నా టూ-డూ'] },
  todo_add: { en: ['My to-dos', "Start a 25 minute focus", "What's my plan today?"], hi: ['मेरे टू-डू', '25 मिनट फोकस शुरू करो', 'आज का प्लान क्या है?'], te: ['నా టూ-డూ', '25 నిమిషాల ఫోకస్', 'నేటి ప్లాన్ ఏమిటి?'] },
  todo_show: { en: ['Add to-do: revise chapter 4 tomorrow', 'Start a 25 minute focus'], hi: ['टू-डू जोड़ो: कल अध्याय 4 दोहराना', '25 मिनट फोकस शुरू करो'], te: ['టూ-డూ జోడించు: రేపు చాప్టర్ 4', '25 నిమిషాల ఫోకస్'] },
  todo_done: { en: ['My to-dos', 'How long did I study today?'], hi: ['मेरे टू-डू', 'आज कितना पढ़ा?'], te: ['నా టూ-డూ', 'ఈరోజు ఎంత చదివాను?'] },
  studyplan_generate: { en: ["What's my plan today?", 'Start a 25 minute focus'], hi: ['आज का प्लान क्या है?', '25 मिनट फोकस शुरू करो'], te: ['నేటి ప్లాన్ ఏమిటి?', '25 నిమిషాల ఫోకస్'] },
  studyplan_show: { en: ['Make a 7 day study plan for maths', 'Start the first session'], hi: ['गणित का 7 दिन का प्लान बनाओ', 'पहला सत्र शुरू करो'], te: ['మ్యాథ్స్ కి 7 రోజుల ప్లాన్', 'మొదటి సెషన్ మొదలుపెట్టు'] },
  focus_start: { en: ['How long did I study today?', 'My to-dos'], hi: ['आज कितना पढ़ा?', 'मेरे टू-डू'], te: ['ఈరోజు ఎంత చదివాను?', 'నా టూ-డూ'] },
  notif_show: { en: ['My alarms', "What's my plan today?"], hi: ['मेरे अलार्म', 'आज का प्लान क्या है?'], te: ['నా అలారమ్‌లు', 'నేటి ప్లాన్ ఏమిటి?'] },
  time_show: { en: ['Start a 25 minute focus', "What's my plan today?"], hi: ['25 मिनट फोकस शुरू करो', 'आज का प्लान क्या है?'], te: ['25 నిమిషాల ఫోకస్', 'నేటి ప్లాన్ ఏమిటి?'] },
  music_start: { en: ['Play rain sounds', 'Play brown noise', 'Stop the music'], hi: ['बारिश की आवाज़ चलाओ', 'ब्राउन नॉइज़ चलाओ', 'संगीत बंद करो'], te: ['వర్షం శబ్దం ప్లే', 'బ్రౌన్ నాయిస్', 'మ్యూజిక్ ఆపు'] },
  music_stop: { en: ['Play focus music', 'Plant a tree for 25 minutes'], hi: ['फोकस संगीत चलाओ', '25 मिनट का पेड़ लगाओ'], te: ['ఫోకస్ మ్యూజిక్', '25 నిమిషాల చెట్టు నాటు'] },
  forest_plant: { en: ["How's my forest?", 'Play focus music'], hi: ['मेरा फ़ॉरेस्ट कैसा है?', 'फोकस संगीत चलाओ'], te: ['నా ఫారెస్ట్ ఎలా ఉంది?', 'ఫోకస్ మ్యూజిక్'] },
  forest_stats: { en: ['Plant a tree for 25 minutes', 'Shield stats'], hi: ['25 मिनट का पेड़ लगाओ', 'शील्ड रिपोर्ट'], te: ['25 నిమిషాల చెట్టు', 'షీల్డ్ రిపోర్ట్'] },
  shield_block: { en: ["What's blocked?", 'Block youtube'], hi: ['क्या ब्लॉक है?', 'यूट्यूब ब्लॉक करो'], te: ['ఏమి బ్లాక్?', 'యూట్యూబ్ బ్లాక్'] },
  shield_show: { en: ['Block social media', 'Shield stats'], hi: ['सोशल मीडिया ब्लॉक करो', 'शील्ड रिपोर्ट'], te: ['సోషల్ మీడియా బ్లాక్', 'షీల్డ్ రిపోర్ట్'] },
  shield_stats: { en: ['I want to scroll', 'Plant a tree for 25 minutes'], hi: ['मुझे स्क्रॉल करना है', '25 मिनट का पेड़ लगाओ'], te: ['నాకు స్క్రోల్ చేయాలి', '25 నిమిషాల చెట్టు'] },
  urge_help: { en: ['Play calm music', 'Start a 25 minute focus'], hi: ['शांत संगीत चलाओ', '25 मिनट फोकस शुरू करो'], te: ['ప్రశాంత సంగీతం', '25 నిమిషాల ఫోకస్'] },
  journal_add: { en: ['Show my journal', 'Give me a journal prompt'], hi: ['जर्नल दिखाओ', 'जर्नल का सवाल दो'], te: ['జర్నల్ చూపించు', 'జర్నల్ ప్రశ్న ఇవ్వు'] },
  journal_prompt: { en: ['Show my journal', 'How was my week?'], hi: ['जर्नल दिखाओ', 'मेरा हफ़्ता कैसा रहा?'], te: ['జర్నల్ చూపించు', 'నా వారం ఎలా ఉంది?'] },
  journal_show: { en: ['Give me a journal prompt', 'Start a 25 minute focus'], hi: ['जर्नल का सवाल दो', '25 मिनट फोकस शुरू करो'], te: ['జర్నల్ ప్రశ్న', '25 నిమిషాల ఫోకస్'] },
  todo_suggest: { en: ['Add the exam week pack', 'Turn my plan into tasks'], hi: ['परीक्षा सप्ताह पैक जोड़ो', 'प्लान को टास्क बनाओ'], te: ['పరీక్ష వారం ప్యాక్ జోడించు', 'ప్లాన్‌ను పనులుగా మార్చు'] },
  todo_pack: { en: ['What should I do next?', 'My to-dos'], hi: ['अब क्या करूँ?', 'मेरे टू-डू'], te: ['తర్వాత ఏం చేయాలి?', 'నా టూ-డూ'] },
  plan_to_tasks: { en: ['My to-dos', 'Add the daily basics pack'], hi: ['मेरे टू-डू', 'रोज़ की बुनियाद पैक जोड़ो'], te: ['నా టూ-డూ', 'రోజువారీ బేసిక్స్ ప్యాక్'] },
  chapter_tasks: { en: ['Paste chapter', 'Add the chapter workflow pack'], hi: ['अध्याय पेस्ट करें', 'नया अध्याय पैक जोड़ो'], te: ['అధ్యాయం పేస్ట్', 'కొత్త చాప్టర్ ప్యాక్'] },
  plan_repeat: { en: ["What's my plan today?", 'Show my plan'], hi: ['आज का प्लान क्या है?', 'मेरा प्लान दिखाओ'], te: ['నేటి ప్లాన్ ఏమిటి?', 'నా ప్లాన్ చూపించు'] },
  plan_move: { en: ["What's my plan today?", 'Start the first session'], hi: ['आज का प्लान क्या है?', 'पहला सत्र शुरू करो'], te: ['నేటి ప్లాన్ ఏమిటి?', 'మొదటి సెషన్ మొదలు'] },
  letter_write: { en: ['My letters', 'Show my journal'], hi: ['मेरी चिट्ठियाँ', 'जर्नल दिखाओ'], te: ['నా ఉత్తరాలు', 'జర్నల్ చూపించు'] },
  letter_show: { en: ['Letter to future me, open in a month', 'Show my journal'], hi: ['भविष्य को चिट्ठी, महीने बाद खोलो', 'जर्नल दिखाओ'], te: ['భవిష్యత్తుకు ఉత్తరం, నెల తర్వాత', 'జర్నల్ చూపించు'] },
  guardian_share: { en: ['Show my journal', "How's my forest?"], hi: ['जर्नल दिखाओ', 'मेरा फ़ॉरेस्ट कैसा है?'], te: ['జర్నల్ చూపించు', 'నా ఫారెస్ట్ ఎలా ఉంది?'] },
}

export function hasFeatureReply(intentId) {
  return !!(R2[intentId] || R3[intentId] || R4[intentId] || R5[intentId] || R6[intentId])
}

export function buildFeatureReply(intentId, state) {
  const builder = R2[intentId] || R3[intentId] || R4[intentId] || R5[intentId] || R6[intentId]
  if (!builder) return null
  const text = builder(state)
  const filled = text
    .split('{name}').join(state.name || '')
    .split('{done}').join(String(state.done ?? ''))
    .split('{total}').join(String(state.total ?? ''))
  return { text: filled, quick: FEATURE_QUICK[intentId]?.[state.lang] || FEATURE_QUICK[intentId]?.en || [] }
}

export const FEATURE_ACTIONS = {
  alarm_add: { action: 'openFeature', openWith: { feature: 'alarms' } },
  alarm_stop: { action: null },
  alarm_show: { action: 'openFeature', openWith: { feature: 'alarms' } },
  todo_add: { action: 'openFeature', openWith: { feature: 'todo' } },
  todo_show: { action: 'openFeature', openWith: { feature: 'todo' } },
  todo_done: { action: null },
  studyplan_generate: { action: 'openFeature', openWith: { feature: 'planner' } },
  studyplan_show: { action: 'openFeature', openWith: { feature: 'planner' } },
  focus_start: { action: 'openFeature', openWith: { feature: 'focus' } },
  notif_show: { action: 'openFeature', openWith: { feature: 'notifications' } },
  time_show: { action: 'openFeature', openWith: { feature: 'time' } },
  music_start: { action: 'openFeature', openWith: { feature: 'music' } },
  music_stop: { action: null },
  forest_plant: { action: 'openFeature', openWith: { feature: 'forest' } },
  forest_stats: { action: 'openFeature', openWith: { feature: 'forest' } },
  shield_block: { action: 'openFeature', openWith: { feature: 'shield' } },
  shield_show: { action: 'openFeature', openWith: { feature: 'shield' } },
  shield_stats: { action: 'openFeature', openWith: { feature: 'shield' } },
  urge_help: { action: null },
  journal_add: { action: 'openFeature', openWith: { feature: 'journal' } },
  journal_prompt: { action: 'openFeature', openWith: { feature: 'journal' } },
  journal_show: { action: 'openFeature', openWith: { feature: 'journal' } },
  letter_write: { action: 'openFeature', openWith: { feature: 'journal', payload: { tab: 'letters', write: true } } },
  letter_show: { action: 'openFeature', openWith: { feature: 'journal', payload: { tab: 'letters' } } },
  guardian_share: { action: 'openFeature', openWith: { feature: 'guardian' } },
  todo_suggest: { action: 'openFeature', openWith: { feature: 'todo' } },
  todo_pack: { action: 'openFeature', openWith: { feature: 'todo' } },
  plan_to_tasks: { action: 'openFeature', openWith: { feature: 'todo' } },
  chapter_tasks: { action: 'openFeature', openWith: { feature: 'todo' } },
  plan_repeat: { action: 'openFeature', openWith: { feature: 'planner' } },
  plan_move: { action: 'openFeature', openWith: { feature: 'planner' } },
}

// ---------- Dynamic replies (need live data) ----------

function fmtSection(context, lang) {
  const map = {
    home:    { en: 'Home', hi: 'होम', te: 'హోమ్' },
    quiz:    { en: 'Quiz Arena', hi: 'क्विज़ एरीना', te: 'క్విజ్ అరేనా' },
    tests:   { en: 'Tests', hi: 'टेस्ट', te: 'టెస్ట్లు' },
    planner: { en: 'Study Planner', hi: 'स्टडी प्लानर', te: 'స్టడీ ప్లానర్' },
    todo:    { en: 'To-do List', hi: 'टू-डू लिस्ट', te: 'టూ-డూ లిస్ట్' },
    time:    { en: 'Time Tracking', hi: 'टाइम ट्रैकिंग', te: 'టైమ్ ట్రాకింగ్' },
    knowledge: { en: 'Knowledge Graph', hi: 'नॉलेज ग्राफ', te: 'నాలెడ్జ్ గ్రాఫ్' },
    tutor:   { en: 'Tutor Chat', hi: 'ट्यूटर चैट', te: 'ట్యూటర్ చాట్' },
    revision: { en: 'Revision Tools', hi: 'रिवीज़न टूल्स', te: 'రివిజన్ టూల్స్' },
    rag:     { en: 'Upload & Query', hi: 'अपलोड और पूछें', te: 'అప్‌లోడ్ & ప్రశ్నలు' },
    rooms:   { en: 'Collab Rooms', hi: 'कोलैब रूम्स', te: 'కొలాబ్ రూమ్స్' },
    rewards: { en: 'Streaks & Rewards', hi: 'स्ट्रीक्स और रिवॉर्ड्स', te: 'స్ట్రీక్స్ & రివార్డ్స్' },
    reviews: { en: 'Reviews', hi: 'रिव्यूज़', te: 'రివ్యూలు' },
    safety:  { en: 'Parental Lock', hi: 'पैरेंटल लॉक', te: 'పేరెంటల్ లాక్' },
    progress: { en: 'Progress', hi: 'प्रोग्रेस', te: 'ప్రోగ్రెస్' },
    settings: { en: 'Settings', hi: 'सेटिंग्स', te: 'సెట్టింగ్స్' }
  }
  const entry = map[context] || map.home
  return (entry[lang] || entry.en)
}

export function buildReply(intentId, state) {
  const { lang, tone, name, context, memory, tasks, session } = state
  const L = R[intentId] || R.fallback
  const Lx = L[lang] || L.en

  let text, quick = []
  let action = null
  let openWith = null

  if (hasFeatureReply(intentId)) {
    const fr = buildFeatureReply(intentId, { ...state, ...(state.session || {}) })
    text = fr.text
    quick = fr.quick
    const fa = FEATURE_ACTIONS[intentId]
    if (fa) { action = fa.action; openWith = fa.openWith || null }
  } else if (intentId === 'stuck' || intentId === 'help') {
    // contextual boost: include section name
    text = pick(Lx, tone, { name, section: fmtSection(context, lang) })
    quick = Lx.quick || []
  } else if (intentId === 'planner_add') {
    const task = session.lastTask
    if (task) {
      const subjects = {
        en: `Done! I've added **${task.subject} (${task.minutes} min)** to today's plan. 📅 You can check it in the Planner page. Say "show my plan" to see it!`,
        hi: `हो गया! **${task.subject} (${task.minutes} मिनट)** आज के प्लान में जोड़ दिया। 📅 प्लानर पेज में देख सकते हैं। "प्लान दिखाओ" बोलिए!`,
        te: `అయిపోయింది! **${task.subject} (${task.minutes} నిమి.)** నేటి ప్లాన్ లో చేర్చాను. 📅 ప్లానర్ పేజీలో చూడవచ్చు. "ప్లాన్ చూపించు" అనండి!`
      }
      text = subjects[lang] || subjects.en
      quick = { en: ['Show my plan', 'Add physics 45 minutes'], hi: ['प्लान दिखाओ', 'भौतिकी 45 मिनट जोड़ो'], te: ['ప్లాన్ చూపించు', 'ఫిజిక్స్ 45 నిమిషాలు జోడించు'] }[lang] || []
    } else {
      text = {
        en: "Tell me what to add — like \"add maths 30 minutes\" or \"add physics 45 minutes\". 📅",
        hi: "बताइए क्या जोड़ना है — जैसे \"गणित 30 मिनट जोड़ो\" या \"भौतिकी 45 मिनट जोड़ो\"। 📅",
        te: "ఏం జోడించాలో చెప్పండి — \"గణితం 30 నిమిషాలు జోడించు\" లేదా \"ఫిజిక్స్ 45 నిమిషాలు జోడించు\". 📅"
      }[lang]
    }
  } else if (intentId === 'planner_show') {
    if (tasks.length === 0) {
      text = {
        en: "Your plan is empty! 📭 Try telling me: \"add maths 30 minutes\" — or add a task in the Planner page.",
        hi: "आपका प्लान खाली है! 📭 मुझसे कहिए: \"गणित 30 मिनट जोड़ो\" — या प्लानर पेज में टास्क जोड़िए।",
        te: "మీ ప్లాన్ ఖాళీగా ఉంది! 📭 నాతో చెప్పండి: \"గణితం 30 నిమిషాలు జోడించు\" — లేదా ప్లానర్ పేజీలో జోడించండి."
      }[lang]
    } else {
      const list = tasks.slice(0, 6).map(t => `${t.done ? '✅' : '⬜'} ${t.subject} — ${t.minutes} min`).join('\n')
      text = fill({
        en: `Here's your plan, {name}! 📅\n${list}\n\nSay "add physics 45 minutes" to add more!`,
        hi: `आपका प्लान, {name}! 📅\n${list}\n\nऔर जोड़ने के लिए "भौतिकी 45 मिनट जोड़ो" बोलिए!`,
        te: `మీ ప్లాన్, {name}! 📅\n${list}\n\nఇంకా జోడించడానికి "ఫిజిక్స్ 45 నిమిషాలు జోడించు" అనండి!`
      }[lang], { name })
    }
  } else if (intentId === 'progress_info' || intentId === 'level_info') {
    const accuracy = memory.quizzes > 0 ? Math.round((memory.quizCorrect / memory.quizzes) * 100) : 0
    const vars = {
      name, level: memory.level, levelName: LEVEL_NAMES[memory.level][lang] || LEVEL_NAMES[memory.level].en,
      xp: memory.xp, quizzes: memory.quizzes, accuracy,
      tasksDone: memory.tasksDone, streak: memory.streak || 0, topics: memory.topicsLearned.length,
      nextLevel: Math.min(memory.level + 1, 5), xpLeft: xpLeft(memory.xp, memory.level)
    }
    text = pick(Lx, tone, vars)
  } else if (intentId === 'quiz_info' || intentId === 'quiz_start' || intentId === 'planner_info') {
    const vars = { level: memory.level, levelName: LEVEL_NAMES[memory.level][lang] || LEVEL_NAMES[memory.level].en }
    text = pick(Lx, tone, vars)
  } else {
    text = pick(Lx, tone, { name })
  }

  if (intentId === 'quiz_start') action = 'openQuiz'
  if (intentId === 'notes_quiz') action = 'openNotesQuiz'
  if (intentId === 'tour') action = 'startTour'
  if (intentId === 'planner_add') action = 'refreshPlanner'

  return { text, quick: quick || [], action, openWith, intent: intentId }
}

// XP needed to reach the next level (levels 1..5; thresholds 60/160/300/500)
function xpLeft(xp, level) {
  const THRESH = { 1: 60, 2: 160, 3: 300, 4: 500 }
  if (level >= 5) return 0
  return Math.max(THRESH[level] - xp, 0)
}

function pick(entry, tone, vars) {
  let pool = entry.text
  // tone-specific overrides
  if (tone === 'kid' && entry.kid) return fill(entry.kid, vars)
  if (tone === 'pro' && entry.pro) return fill(entry.pro, vars)
  if (Array.isArray(pool)) return fill(pool[Math.floor(Math.random() * pool.length)], vars)
  return fill(pool, vars)
}

function fill(tpl, vars) {
  let s = String(tpl)
  Object.entries(vars || {}).forEach(([k, v]) => { s = s.split('{' + k + '}').join(String(v ?? '')) })
  return s
}
