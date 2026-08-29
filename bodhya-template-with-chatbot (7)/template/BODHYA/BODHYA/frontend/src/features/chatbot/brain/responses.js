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

  if (intentId === 'stuck' || intentId === 'help') {
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

  return { text, quick: quick || [], action }
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
