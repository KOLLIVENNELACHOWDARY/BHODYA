// ---------- Bodhya intent definitions (multilingual patterns, no APIs) ----------
// Each intent: id, pri (higher = checked first), and per-language {re:[regex], kw:[keywords]}

export const INTENTS = [
  {
    id: 'explain',
    pri: 90,
    en: { re: [/\b(explain|what is|what are|what's|tell me about|define|describe|teach me|about)\b/i], kw: ['explain', 'what is', 'what are', 'tell me about', 'define', 'describe', 'teach me'] },
    hi: { re: [/^(समझाओ|बताओ|क्या होता है|क्या है|समझाइए|पढ़ाओ)/], kw: ['समझाओ', 'बताओ', 'क्या है', 'समझाइए', 'सिखाओ'] },
    te: { re: [/^(వివరించు|చెప్పు|ఏమిటి|అంటే ఏమిటి|నేర్పు)/], kw: ['వివరించు', 'చెప్పు', 'ఏమిటి', 'నేర్పించు'] }
  },
  {
    id: 'notes_quiz',
    pri: 85,
    en: { re: [/\b(quiz|test|questions?)\b.*\b(notes|note|material|uploaded|topic|chapter)\b|\b(make|generate|create)\b.*\b(quiz|questions?)\b|\b(quiz|questions?)\b.*\b(from my notes|my notes)\b/i], kw: ['quiz from my notes', 'make a quiz', 'generate quiz', 'create a quiz', 'quiz me on my notes', 'from my notes'] },
    hi: { re: [/(क्विज़?|क्विज|सवाल).*(नोट्स|नोट|सामग्री|टॉपिक|अध्याय)|(नोट्स|नोट|सामग्री|टॉपिक).*(क्विज़?|क्विज|सवाल)|(बनाओ|बनाइए|बनाना).*(क्विज़?|क्विज|सवाल)|(क्विज़?|क्विज|सवाल).*(बनाओ|बनाइए)/], kw: ['नोट्स से क्विज़', 'क्विज़ बनाओ', 'क्विज़ बनाइए', 'सवाल बनाओ'] },
    te: { re: [/(క్విజ్|ప్రశ్నలు).*(నోట్స్|నోట్|మెటీరియల్|టాపిక్|అధ్యాయం)|(నోట్స్|నోట్|మెటీరియల్|టాపిక్).*(క్విజ్|ప్రశ్నలు)|(చేయి|చేయండి|చేయు).*(క్విజ్|ప్రశ్నలు)|(క్విజ్|ప్రశ్నలు).*(చేయి|చేయండి)/], kw: ['నోట్స్ నుంచి క్విజ్', 'క్విజ్ చేయి', 'ప్రశ్నలు చేయి'] }
  },
  {
    id: 'quiz_start',
    pri: 80,
    en: { re: [/\b(start|play|begin|give me|take)\b.*\b(quiz|battle|challenge|test|questions?)\b|\bquiz me\b/i], kw: ['start quiz', 'play quiz', 'quiz me', 'start battle', 'boss battle', 'take a quiz'] },
    hi: { re: [/^(क्विज़? (शुरू|खेल)|बॉस बैटल|टेस्ट लो|सवाल पूछो)/], kw: ['क्विज़', 'क्विज', 'बॉस', 'बैटल', 'टेस्ट', 'सवाल'] },
    te: { re: [/^(క్విజ్ (మొదలు|ఆడు)|బాస్ బాటిల్|ప్రశ్నలు వేయి|టెస్ట్)/], kw: ['క్విజ్', 'బాస్', 'బాటిల్', 'టెస్ట్', 'ప్రశ్నలు'] }
  },
  {
    id: 'tour',
    pri: 75,
    en: { re: [/\b(tour|walk me through|show me around|guide me|onboarding|how do i use this|what is this app)\b/i], kw: ['tour', 'show me around', 'walk me through', 'guide', 'onboarding'] },
    hi: { re: [/^(टूर|दिखाओ|घुमाओ|गाइड करो|कैसे इस्तेमाल करूँ)/], kw: ['टूर', 'दिखाओ', 'गाइड', 'इस्तेमाल'] },
    te: { re: [/^(టూర్|చూపించు|గైడ్|ఎలా వాడాలి|తిప్పి చూపించు)/], kw: ['టూర్', 'చూపించు', 'గైడ్', 'ఉపయోగించాలి'] }
  },
  {
    id: 'stuck',
    pri: 70,
    en: { re: [/\b(i'?m stuck|i am stuck|confused|not working|where do i|how do i|can't find|dont understand|don't understand|what do i do)\b/i], kw: ['stuck', 'confused', 'not working', 'how do i', 'where do i', 'can\'t find'] },
    hi: { re: [/^(मैं अटक|अटक गया|समझ नहीं आया|कहाँ|कैसे करूँ|काम नहीं कर रहा)/], kw: ['अटक', 'समझ नहीं', 'कैसे करूँ', 'कहाँ'] },
    te: { re: [/^(నేను ఇరుక్కున్న|ఇరుక్కున్నా|అర్థం కాలేదు|ఎలా చేయాలి|ఎక్కడ|పని చేయడం లేదు)/], kw: ['ఇరుక్కున్న', 'అర్థం కాలేదు', 'ఎలా చేయాలి', 'ఎక్కడ'] }
  },
  {
    id: 'planner_add',
    pri: 68,
    en: { re: [/\b(add|set|schedule|plan for|remind me to study)\b.*\b(min|minutes|hour|hr|mins|today|tomorrow)?\b/i], kw: ['add task', 'add maths', 'add math', 'add physics', 'add science', 'schedule', 'remind me'] },
    hi: { re: [/(जोड़ो|जोड़ दो|रख दो|शेड्यूल करो|प्लान करो)/], kw: ['जोड़ो', 'जोड़ दो', 'शेड्यूल', 'याद दिला'] },
    te: { re: [/(జోడించు|పెట్టు|షెడ్యూల్ చేయి|ప్లాన్ చేయి)/], kw: ['జోడించు', 'షెడ్యూల్', 'గుర్తు చేయి'] }
  },
  {
    id: 'planner_show',
    pri: 66,
    en: { re: [/\b(show|see|list|what'?s)\b.*\b(plan|tasks?|schedule)\b|my plan|my tasks?\b/i], kw: ['my plan', 'show plan', 'my tasks', 'today\'s plan', 'list tasks'] },
    hi: { re: [/^(प्लान दिखाओ|टास्क दिखाओ|आज का प्लान|क्या करना है)/], kw: ['प्लान दिखाओ', 'टास्क', 'आज का'] },
    te: { re: [/^(ప్లాన్ చూపించు|టాస్కులు చూపించు|నేటి ప్లాన్|ఏం చేయాలి)/], kw: ['ప్లాన్ చూపించు', 'టాస్క్', 'నేటి'] }
  },
  {
    id: 'planner_info',
    pri: 60,
    en: { re: [/\b(planner|planning|study plan|schedule|time table|organize)\b/i], kw: ['planner', 'planning', 'schedule', 'time table', 'organize'] },
    hi: { re: [/^(प्लानर|प्लान|शेड्यूल|टाइम टेबल|समय सारणी)/], kw: ['प्लानर', 'प्लान', 'टाइम टेबल', 'शेड्यूल'] },
    te: { re: [/^(ప్లానర్|ప్లాన్|టైమ్ టేబుల్|షెడ్యూల్)/], kw: ['ప్లానర్', 'ప్లాన్', 'టైమ్ టేబుల్'] }
  },
  {
    id: 'quiz_info',
    pri: 60,
    en: { re: [/\b(quiz|battle|boss|questions?|test|practice)\b/i], kw: ['quiz', 'battle', 'boss', 'questions', 'test'] },
    hi: { re: [/^(क्विज़|क्विज|बॉस|बैटल|टेस्ट|प्रैक्टिस|सवाल)/], kw: ['क्विज़', 'क्विज', 'बॉस', 'बैटल', 'टेस्ट', 'सवाल'] },
    te: { re: [/^(క్విజ్|బాస్|బాటిల్|టెస్ట్|ప్రాక్టీస్|ప్రశ్నలు)/], kw: ['క్విజ్', 'బాస్', 'బాటిల్', 'టెస్ట్', 'ప్రశ్నలు'] }
  },
  {
    id: 'progress_info',
    pri: 58,
    en: { re: [/\b(progress|xp|score|level|improve|performance|stats?)\b/i], kw: ['progress', 'xp', 'score', 'level', 'performance', 'improving', 'how am i doing', 'my progress', 'my stats'] },
    hi: { re: [/^(प्रोग्रेस|लेवल|स्कोर|एक्सपी|सुधार|आंकड़े)/], kw: ['प्रोग्रेस', 'लेवल', 'स्कोर', 'एक्सपी', 'सुधार'] },
    te: { re: [/^(ప్రోగ్రెస్|లెవల్|స్కోరు|ఎక్స్‌పి|మెరుగు|గణాంకాలు)/], kw: ['ప్రోగ్రెస్', 'లెవల్', 'స్కోరు', 'ఎక్స్‌పి', 'మెరుగు'] }
  },
  {
    id: 'voice_info',
    pri: 54,
    en: { re: [/\b(voice|speak|speech|mic|talk|audio)\b/i], kw: ['voice', 'speech', 'mic', 'talk', 'audio'] },
    hi: { re: [/^(आवाज़|आवाज|बोल|माइक|वॉइस)/], kw: ['आवाज़', 'आवाज', 'बोलना', 'माइक', 'वॉइस'] },
    te: { re: [/^(వాయిస్|గొంతు|మాట్లాడు|మైక్|స్పీచ్)/], kw: ['వాయిస్', 'మైక్', 'మాట్లాడు', 'స్పీచ్'] }
  },
  {
    id: 'settings_info',
    pri: 52,
    en: { re: [/\b(settings|change (language|name|tone|age)|my profile|preferences|reset)\b/i], kw: ['settings', 'change language', 'change name', 'my profile', 'preferences'] },
    hi: { re: [/^(सेटिंग|भाषा बदलो|नाम बदलो|प्रोफ़ाइल|प्राथमिकताएँ|रीसेट)/], kw: ['सेटिंग', 'भाषा', 'नाम बदलो', 'प्रोफ़ाइल'] },
    te: { re: [/^(సెట్టింగ్స్|భాష మార్చు|పేరు మార్చు|ప్రొఫైల్|ప్రాధాన్యతలు|రీసెట్)/], kw: ['సెట్టింగ్స్', 'భాష', 'పేరు మార్చు', 'ప్రొఫైల్'] }
  },
  {
    id: 'help',
    pri: 50,
    en: { re: [/\b(help|assist|support|how (can|do) i|what should i do)\b/i], kw: ['help', 'assist', 'support', 'help me'] },
    hi: { re: [/^(मदद|सहायता|क्या करूँ)/], kw: ['मदद', 'सहायता'] },
    te: { re: [/^(సహాయం|హెల్ప్|ఏం చేయాలి)/], kw: ['సహాయం', 'హెల్ప్'] }
  },
  {
    id: 'capabilities',
    pri: 46,
    en: { re: [/\b(what can you do|what do you know|your features|who are you|what are you|help with|capabilities|abilities)\b/i], kw: ['what can you do', 'who are you', 'what are you', 'features', 'capabilities', 'help with'] },
    hi: { re: [/^(तुम क्या कर सकते|तुम कौन हो|क्या-क्या कर सकते|फीचर्स|कैसे मदद)/], kw: ['तुम क्या', 'तुम कौन', 'फीचर्स', 'मदद'] },
    te: { re: [/^(నువ్వు ఏం చేయగలవు|నువ్వెవరు|ఫీచర్లు|ఏం చేయగలవు)/], kw: ['ఏం చేయగలవు', 'నువ్వెవరు', 'ఫీచర్లు'] }
  },
  {
    id: 'motivation',
    pri: 44,
    en: { re: [/\b(motivat|encourage|tired|bored|give up|lazy|demotivat|inspire|keep going)\b/i], kw: ['motivate', 'tired', 'bored', 'give up', 'lazy', 'inspire'] },
    hi: { re: [/^(मोटिवेशन|थक गया|थक गई|बोर|हार मान|आलस|प्रेरणा)/], kw: ['मोटिवेशन', 'थक', 'बोर', 'हार मान', 'आलस', 'प्रेरणा'] },
    te: { re: [/^(ప్రేరణ|అలసిపోయా|బోర్|విడిచిపెట్టాలని|సోమరి|ధైర్యం)/], kw: ['ప్రేరణ', 'అలసిపోయా', 'బోర్', 'ధైర్యం', 'సోమరి'] }
  },
  {
    id: 'joke',
    pri: 42,
    en: { re: [/\b(joke|funny|make me laugh|laugh|humour|humor)\b/i], kw: ['joke', 'funny', 'laugh', 'humour'] },
    hi: { re: [/^(चुटकुला|मज़ाक|हँसाओ|मज़ेदार)/], kw: ['चुटकुला', 'मज़ाक', 'हँसाओ'] },
    te: { re: [/^(జోక్|నవ్వించు|హాస్యం|తమాషా)/], kw: ['జోక్', 'నవ్వించు', 'హాస్యం', 'తమాషా'] }
  },
  {
    id: 'level_info',
    pri: 40,
    en: { re: [/\b(my level|what level|am i improving|difficulty)\b/i], kw: ['my level', 'am i improving', 'difficulty'] },
    hi: { re: [/^(मेरा लेवल|कौन सा लेवल|सुधार हो रहा|मुश्किल)/], kw: ['मेरा लेवल', 'सुधार', 'मुश्किल'] },
    te: { re: [/^(నా లెవల్|ఏ లెవల్|మెరుగుపడుతున్నా|కష్టతరం)/], kw: ['నా లెవల్', 'మెరుగు', 'కష్టతరం'] }
  },
  {
    id: 'greet',
    pri: 10,
    en: { re: [/\b(hi|hello|hey|namaste|hola|yo|good (morning|afternoon|evening))\b/i], kw: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening'] },
    hi: { re: [/^(नमस्ते|नमस्कार|हैलो|हाय|प्रणाम|गुड मॉर्निंग)/], kw: ['नमस्ते', 'नमस्कार', 'हैलो', 'हाय', 'प्रणाम'] },
    te: { re: [/^(నమస్కారం|హలో|హాయ్|నమస్తే|గుడ్ మార్నింగ్)/], kw: ['నమస్కారం', 'హలో', 'హాయ్', 'నమస్తే'] }
  },
  {
    id: 'thanks',
    pri: 10,
    en: { re: [/\b(thanks|thank you|thankyou|thx|appreciate)\b/i], kw: ['thanks', 'thank you', 'thx'] },
    hi: { re: [/^(धन्यवाद|शुक्रिया|थैंक्स)/], kw: ['धन्यवाद', 'शुक्रिया', 'थैंक्स'] },
    te: { re: [/^(ధన్యవాదాలు|థాంక్స్|కృతజ్ఞతలు)/], kw: ['ధన్యవాదాలు', 'థాంక్స్', 'కృతజ్ఞతలు'] }
  },
  {
    id: 'bye',
    pri: 10,
    en: { re: [/\b(bye|goodbye|see you|good night|tata|cya|later)\b/i], kw: ['bye', 'goodbye', 'see you', 'good night'] },
    hi: { re: [/^(अलविदा|फिर मिलेंगे|गुड नाइट|बाय|नमस्ते)/], kw: ['अलविदा', 'फिर मिलेंगे', 'गुड नाइट', 'बाय'] },
    te: { re: [/^(వీడ్కోలు|తర్వాత కలుద్దాం|గుడ్ నైట్|బై)/], kw: ['వీడ్కోలు', 'తర్వాత', 'గుడ్ నైట్', 'బై'] }
  }
]

export const FALLBACK_ID = 'fallback'

// Supports: "explain X" / "what is X" / Hindi & Telugu both word orders ("X समझाओ" or "समझाओ X")

// Simpler-request patterns (checked before explain when a topic is in session)
