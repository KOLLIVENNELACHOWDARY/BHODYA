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
    id: 'todo_suggest',
    pri: 95,
    en: {
      re: [/\b(what should i (do|study)|suggest (me )?(some )?(tasks?|things)|give me (some )?tasks?|what'?s next for me)\b/i],
      kw: ['what should i do', 'what should i study', 'suggest tasks', 'give me tasks', 'what is next for me']
    },
    hi: { re: [/(क्या करूँ|क्या पढ़ूँ|कुछ काम सुझाओ|आगे क्या)/], kw: ['क्या करूँ', 'क्या पढ़ूँ', 'काम सुझाओ'] },
    te: { re: [/(ఏం చేయాలి|ఏం చదవాలి|పనులు సూచించు|తర్వాత ఏమిటి)/], kw: ['ఏం చేయాలి', 'ఏం చదవాలి', 'పనులు సూచించు'] }
  },
  {
    id: 'todo_pack',
    pri: 94,
    en: {
      re: [/\b(add|apply|give me|use|start)\b.*\b(exam week|daily basics|revision cycle|chapter workflow|weekend catch-?up|pack)\b/i],
      kw: ['exam week pack', 'add pack', 'daily basics', 'revision cycle', 'weekend catch-up']
    },
    hi: { re: [/(पैक|परीक्षा सप्ताह|रोज़ की बुनियाद|रिवीज़न चक्र).*(जोड़ो|लगाओ|चाहिए)/], kw: ['पैक जोड़ो', 'परीक्षा सप्ताह', 'रिवीज़न चक्र'] },
    te: { re: [/(ప్యాక్|పరీక్ష వారం|రోజువారీ బేసిక్స్|రివిజన్ సైకిల్).*(జోడించు|కావాలి)/], kw: ['ప్యాక్ జోడించు', 'పరీక్ష వారం'] }
  },
  {
    id: 'plan_to_tasks',
    pri: 93,
    en: {
      re: [/\b(turn|add|convert|send)\b.*\b(my|today'?s)\b.*\b(plan|sessions?)\b.*\b(to-?do|tasks?|list)\b|\bplan (to|into) (my )?(to-?do|tasks?)\b/i],
      kw: ['turn my plan into tasks', 'plan to to-do', 'send my plan to my to-do list']
    },
    hi: { re: [/(प्लान|सत्र).*(टू-डू|टास्क|लिस्ट).*(बदलो|भेजो|जोड़ो)/], kw: ['प्लान को टास्क बनाओ', 'प्लान टू-डू में'] },
    te: { re: [/(ప్లాన్|సెషన్లు).*(టూ-డూ|పనులు).*(మార్చు|పంపు|జోడించు)/], kw: ['ప్లాన్‌ను పనులుగా మార్చు'] }
  },
  {
    id: 'chapter_tasks',
    pri: 96,
    en: {
      re: [/\b(make|turn|convert|create|break)\b.*\b(tasks?|to-?dos?|checklist)\b.*\b(from|out of|this|the)\b.*\b(chapter|notes|syllabus|text)\b|^\s*chapter tasks?\b/i,
        /\b(chapter|notes)\b.*\b(into|to)\b.*\b(tasks?|to-?dos?)\b/i],
      kw: ['make tasks from this chapter', 'turn this chapter into tasks', 'chapter tasks', 'turn my notes into tasks'],
    },
    hi: { re: [/(अध्याय|नोट्स|सिलेबस).*(टास्क|टू-डू|काम).*(बनाओ|बदलो|निकालो)/], kw: ['अध्याय से टास्क', 'नोट्स को टास्क बनाओ'] },
    te: { re: [/(అధ్యాయం|నోట్స్|సిలబస్).*(టాస్క్|పనులు).*(చెయ్యి|మార్చు|తయారు)/], kw: ['అధ్యాయం నుంచి టాస్క్', 'నోట్స్ నుంచి పనులు'] },
  },
  {
    id: 'plan_repeat',
    pri: 95,
    en: {
      re: [/\b(repeat|every|each)\b.*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|week|day)s?\b/i,
        /\b(make|set)\b.*\b(it|this|that|my|session|class|study)\b.*\b(repeat|weekly|every)\b/i],
      kw: ['repeat this session', 'every monday', 'make it weekly', 'repeat every monday and wednesday'],
    },
    hi: { re: [/(दोहराओ|हर)\s*(सोम|मंगल|बुध|गुरु|शुक्र|शनि|रवि|हफ़्ते|हफ्ते|दिन)/], kw: ['हर सोमवार दोहराओ', 'साप्ताहिक करो'] },
    te: { re: [/(పునరావృతం|ప్రతి)\s*(సోమ|మంగళ|బుధ|గురు|శుక్ర|శని|ఆది|వారం|రోజు)/], kw: ['ప్రతి సోమవారం', 'వారానికి ఒకసారి'] },
  },
  {
    id: 'plan_move',
    pri: 94,
    en: {
      re: [/\b(move|shift|reschedule|push)\b.*\b(session|class|study|it|that|my|physics|maths|math|chemistry|biology|english)\b.*\b(to|at|by|tomorrow|today|tonight|next|कल|రేపు)\b/i,
        /\b(move|shift|reschedule)\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/i],
      kw: ['move my session', 'move it to tomorrow', 'reschedule my study session'],
    },
    hi: { re: [/(सत्र|क्लास|पढ़ाई|इसे|उसे).*(खिसकाओ|आगे बढ़ाओ|बदलो)/], kw: ['सत्र आगे बढ़ाओ', 'कल कर दो'] },
    te: { re: [/(సెషన్|క్లాస్|చదువు|దాన్ని).*(జరుపు|మార్చు|వాయిదా)/], kw: ['సెషన్ జరుపు', 'రేపటికి మార్చు'] },
  },
  {
    id: 'letter_write',
    pri: 95,
    en: {
      re: [/\b(write|start|leave)\b.*\bletter\b.*\b(future|myself|me|self)\b|\bletter to (my )?(future|past) (me|self)\b|\btime capsule\b/i],
      kw: ['letter to future me', 'letter to myself', 'write a letter to my future self', 'time capsule']
    },
    hi: { re: [/(चिट्ठी|पत्र|पत्रिका).*(भविष्य|ख़ुद|खुद|मैं)/, /भविष्य को (चिट्ठी|पत्र)/], kw: ['भविष्य को चिट्ठी', 'खुद को चिट्ठी', 'पत्र लिखो'] },
    te: { re: [/(ఉత్తరం|లేఖ).*(భవిష్యత్తు|నాకు|నాకై)/], kw: ['భవిష్యత్తుకు ఉత్తరం', 'నాకు ఉత్తరం'] }
  },
  {
    id: 'letter_show',
    pri: 94,
    en: { re: [/\b(my|any|show|do i have)\b.*\bletters?\b|\bletters? (to|from) (my )?(future|past)\b|\bsealed letter\b/i], kw: ['my letters', 'any letters', 'sealed letters', 'read my letter'] },
    hi: { re: [/(मेरी|कोई|दिखाओ).*(चिट्ठी|पत्र)/], kw: ['मेरी चिट्ठियाँ', 'कोई चिट्ठी', 'चिट्ठी दिखाओ'] },
    te: { re: [/(నా|ఏదైనా|చూపించు).*(ఉత్తరాలు|ఉత్తరం)/], kw: ['నా ఉత్తరాలు', 'ఉత్తరాలు చూపించు'] }
  },
  {
    id: 'guardian_share',
    pri: 93,
    en: {
      re: [/\b(share|show)\b.*\b(my )?(progress|stats|report)\b.*\b(parent|mom|mum|dad|teacher|guardian|amma|appa)\b|\bguardian (view|code|report)\b|\bshare with my (parents?|mom|mum|dad|teacher)\b/i],
      kw: ['share with my parents', 'guardian view', 'guardian code', 'parent report', 'share my progress']
    },
    hi: { re: [/(माता-पिता|मम्मी|पापा|टीचर|अभिभावक).*(प्रोग्रेस|रिपोर्ट|दिखाना|साझा)/], kw: ['माता-पिता को दिखाओ', 'अभिभावक रिपोर्ट', 'शेयर करो'] },
    te: { re: [/(తల్లిదండ్రులు|అమ్మ|నాన్న|టీచర్|గార్డియన్).*(ప్రోగ్రెస్|రిపోర్ట్|పంచు)/], kw: ['తల్లిదండ్రులకు చూపించు', 'గార్డియన్ రిపోర్ట్'] }
  },
  {
    id: 'journal_add',
    pri: 96,
    en: {
      re: [/\b(journal|diary)\s*[:\-]/i, /\b(write|add|note) (this )?(in|to) my (journal|diary)\b/i,
           /\b(dear )?(journal|diary)\b.*\b(today|tonight)\b/i, /\bi want to (journal|write in my diary)\b/i],
      kw: ['journal:', 'diary:', 'write in my journal', 'add to my journal', 'dear journal']
    },
    hi: { re: [/(जर्नल|डायरी)\s*[:\-]/, /(जर्नल|डायरी) में लिखो/, /आज की डायरी/], kw: ['जर्नल:', 'डायरी में लिखो', 'डायरी:'] },
    te: { re: [/(జర్నల్|డైరీ)\s*[:\-]/, /(జర్నల్|డైరీ)లో రాయి/], kw: ['జర్నల్:', 'డైరీలో రాయి'] }
  },
  {
    id: 'journal_prompt',
    pri: 94,
    en: { re: [/\b(give me|need|show|any)\b.*\b(journal|writing|diary)? ?prompts?\b|\bwhat should i (write|journal) about\b/i], kw: ['journal prompt', 'writing prompt', 'what should i write about'] },
    hi: { re: [/(लिखने का|जर्नल का) सवाल|क्या लिखूँ/], kw: ['जर्नल का सवाल', 'क्या लिखूँ', 'लिखने के लिए सवाल'] },
    te: { re: [/(జర్నల్|రాయడానికి).*(ప్రశ్న|ఏం రాయాలి)/], kw: ['జర్నల్ ప్రశ్న', 'ఏం రాయాలి'] }
  },
  {
    id: 'journal_show',
    pri: 93,
    en: {
      re: [/\b(show|read|open|see|what'?s in)\b.*\b(journal|diary)\b|\bmy journal\b|\bhow was my week\b|\bweekly review\b/i],
      kw: ['my journal', 'show my journal', 'how was my week', 'weekly review', 'read my diary']
    },
    hi: { re: [/(जर्नल|डायरी).*(दिखाओ|पढ़ो|खोलो)|मेरा हफ़्ता कैसा रहा/], kw: ['जर्नल दिखाओ', 'डायरी दिखाओ', 'मेरा हफ़्ता कैसा रहा'] },
    te: { re: [/(జర్నల్|డైరీ).*(చూపించు|చదువు)|నా వారం ఎలా ఉంది/], kw: ['జర్నల్ చూపించు', 'నా వారం ఎలా ఉంది'] }
  },
  {
    id: 'urge_help',
    pri: 97,
    en: { re: [/\b(i (want|wanna|need) to (scroll|browse|check)|can'?t stop scrolling|help me stop scrolling|stop me from scrolling|i'?m doomscrolling|phone addiction)\b/i], kw: ["i want to scroll", "can't stop scrolling", "help me stop scrolling", "doomscrolling"] },
    hi: { re: [/(मुझे स्क्रॉल|स्क्रॉल करना है|स्क्रॉल रोको|डूमस्क्रॉल|फ़ोन की लत)/], kw: ['स्क्रॉल करना है', 'स्क्रॉल रोको', 'डूमस्क्रॉल'] },
    te: { re: [/(నాకు స్క్రోల్|స్క్రోల్ చేయాలి|స్క్రోల్ ఆపు|డూమ్\s?స్క్రోల్)/], kw: ['స్క్రోల్ చేయాలి', 'స్క్రోల్ ఆపు'] }
  },
  {
    id: 'music_stop',
    pri: 93,
    en: { re: [/\b(stop|pause|kill|turn off)\b.*\b(music|song|audio|noise|beats?|sound)\b/i], kw: ['stop the music', 'pause music', 'music off', 'stop the noise'] },
    hi: { re: [/(संगीत|म्यूज़िक|आवाज़|नॉइज़).*(बंद|रोको|बंदा)/], kw: ['संगीत बंद', 'म्यूज़िक बंद', 'रोको संगीत'] },
    te: { re: [/(సంగీతం|మ్యూజిక్|శబ్దం|నాయిస్).*(ఆపు|ఆఫ్)/], kw: ['మ్యూజిక్ ఆపు', 'సంగీతం ఆపు'] }
  },
  {
    id: 'music_start',
    pri: 92,
    en: {
      re: [/\b(play|start|put on|give me|need)\b.*\b(music|song|focus music|study music|noise|beats?|binaural|lofi|lo-fi|piano|rain sounds?)\b|\bmusic for (studying|focus|reading|revision)\b/i],
      kw: ['play music', 'study music', 'focus music', 'play brown noise', 'play lofi', 'binaural', 'music for reading', 'music for studying', 'play rain']
    },
    hi: { re: [/(संगीत|म्यूज़िक|नॉइज़|बीट्स|लो-फ़ाई|पियानो).*(चलाओ|शुरू|लगाओ)|(चलाओ|शुरू).*(संगीत|म्यूज़िक)/], kw: ['संगीत चलाओ', 'म्यूज़िक शुरू', 'पढ़ने का संगीत', 'ब्राउन नॉइज़'] },
    te: { re: [/(సంగీతం|మ్యూజిక్|నాయిస్|బీట్స్).*(ప్లే|మొదలు|వేయి)/], kw: ['మ్యూజిక్ ప్లే', 'సంగీతం మొదలు', 'చదువు మ్యూజిక్'] }
  },
  {
    id: 'shield_block',
    pri: 92,
    en: { re: [/\b(block|ban|restrict|add to (the )?blocklist)\b/i], kw: ['block instagram', 'block youtube', 'block social media', 'add to blocklist'] },
    hi: { re: [/(ब्लॉक|बंद करो|रोको).*(इंस्टाग्राम|यूट्यूब|सोशल|साइट|ऐप)/], kw: ['ब्लॉक करो', 'इंस्टाग्राम ब्लॉक', 'सोशल मीडिया ब्लॉक'] },
    te: { re: [/(బ్లాక్|ఆపు).*(ఇన్\s?స్టా|యూట్యూబ్|సోషల్|సైట్|యాప్)/], kw: ['బ్లాక్ చేయి', 'ఇన్‌స్టా బ్లాక్', 'సోషల్ మీడియా బ్లాక్'] }
  },
  {
    id: 'shield_show',
    pri: 91,
    en: { re: [/\b(what\s?'?s?\s*blocked|my blocklist|blocklist|blocked sites|protected sites)\b/i], kw: ['what is blocked', "what's blocked", 'my blocklist', 'blocked sites'] },
    hi: { re: [/(ब्लॉकलिस्ट|क्या ब्लॉक|ब्लॉक साइट)/], kw: ['ब्लॉकलिस्ट', 'क्या ब्लॉक है', 'ब्लॉक साइट'] },
    te: { re: [/(బ్లాక్\s?లిస్ట్|ఏమి బ్లాక్|బ్లాక్ సైట్)/], kw: ['బ్లాక్ లిస్ట్', 'ఏమి బ్లాక్'] }
  },
  {
    id: 'forest_plant',
    pri: 91,
    en: {
      re: [/\b(plant|grow|start)\b.*\b(a )?(tree|forest|study tree)\b|\bdon'?t let me (scroll|leave)\b.*\b\d*\s*(min|minutes)?\b|\bfocus (sprint|tree)\b/i],
      kw: ['plant a tree', 'plant tree', 'start a tree', "don't let me scroll", 'grow a tree', 'study tree']
    },
    hi: { re: [/(पेड़|पौधा|फ़ॉरेस्ट).*(लगाओ|लगाइए|उगाओ)|(मुझे भटकने मत दो)/], kw: ['पेड़ लगाओ', 'पौधा लगाओ', 'भटकने मत दो'] },
    te: { re: [/(చెట్టు|మొక్క|ఫారెస్ట్).*(నాటు|నాటండి|పెంచు)/], kw: ['చెట్టు నాటు', 'మొక్క నాటు'] }
  },
  {
    id: 'forest_stats',
    pri: 90,
    en: { re: [/\b(my|how('?s| is)|show)\b.*\b(forest|trees|streak|planted)\b|\bhow many trees\b/i], kw: ['my forest', "how's my forest", 'my trees', 'my streak', 'how many trees'] },
    hi: { re: [/(मेरा|मेरी|दिखाओ).*(फ़ॉरेस्ट|पेड़|स्ट्रीक)/], kw: ['मेरा फ़ॉरेस्ट', 'मेरे पेड़', 'मेरी स्ट्रीक'] },
    te: { re: [/(నా|నాకు|చూపించు).*(ఫారెస్ట్|చెట్లు|స్ట్రీక్)/], kw: ['నా ఫారెస్ట్', 'నా చెట్లు', 'నా స్ట్రీక్'] }
  },
  {
    id: 'shield_stats',
    pri: 89,
    en: { re: [/\b(how many times did i (leave|escape)|escapes? today|shield (stats|report)|distraction report)\b/i], kw: ['how many times did i leave', 'escapes today', 'shield stats', 'distraction report'] },
    hi: { re: [/(कितनी बार भटका|कितनी बार बाहर गया|शील्ड रिपोर्ट|भटकाव)/], kw: ['कितनी बार भटका', 'शील्ड रिपोर्ट', 'भटकाव'] },
    te: { re: [/(ఎన్నిసార్లు బయటకు|ఎస్కేప్‌లు|షీల్డ్ రిపోర్ట్)/], kw: ['ఎన్నిసార్లు బయటకు', 'షీల్డ్ రిపోర్ట్'] }
  },
  {
    id: 'alarm_add',
    pri: 96,
    en: {
      re: [/\b(remind me|set (an? )?alarm|alarm for|wake me|wake me up|set a reminder|reminder for|nudge me)\b/i],
      kw: ['remind me', 'set alarm', 'set an alarm', 'wake me up', 'set a reminder', 'reminder for']
    },
    hi: { re: [/(रिमाइंडर|अलार्म|याद दिला|जगा दो|उठा दो|याद दिलाना)/], kw: ['रिमाइंडर', 'अलार्म', 'याद दिलाओ', 'जगाओ'] },
    te: { re: [/(రిమైండర్|అలారం|గుర్తు చేయి|గుర్తు చేయవా|లేపు|మేల్కొలుపు)/], kw: ['రిమైండర్', 'అలారం', 'గుర్తు చేయి'] }
  },
  {
    id: 'alarm_stop',
    pri: 95,
    en: { re: [/^\s*(stop|snooze|turn off|silence)\b.*\b(alarm|ringing|it)\b|stop the alarm/i], kw: ['stop the alarm', 'snooze the alarm', 'stop ringing'] },
    hi: { re: [/^(अलार्म (बंद|रोको)|बजना बंद|चुप करो)/], kw: ['अलार्म बंद', 'बंद करो अलार्म', 'रोको'] },
    te: { re: [/^(అలారం (ఆపు|ఆపేయి)|మోగడం ఆపు|నిశ్శబ్దం)/], kw: ['అలారం ఆపు', 'ఆపేయి'] }
  },
  {
    id: 'todo_add',
    pri: 94,
    en: {
      re: [/\b(add|create|note)\b.*\b(to[- ]?do|task|homework|assignment)\b|\bto[- ]?do\b.*\b(add|for)\b|\badd (a )?task\b/i],
      kw: ['add to-do', 'add todo', 'add task', 'add a task', 'to-do:']
    },
    hi: { re: [/(टू-डू|टूडू|टास्क|काम).*(जोड़ो|जोड़ दो|लिखो)|(जोड़ो|जोड़ दो).*(टू-डू|टास्क|काम)/], kw: ['टू-डू जोड़ो', 'टास्क जोड़ो', 'काम जोड़ो'] },
    te: { re: [/(టూ-డూ|టాస్క్|పని).*(జోడించు|రాయి)|(జోడించు).*(టూ-డూ|టాస్క్|పని)/], kw: ['టూ-డూ జోడించు', 'టాస్క్ జోడించు', 'పని జోడించు'] }
  },
  {
    id: 'todo_done',
    pri: 93,
    en: { re: [/\b(i (have )?(finished|completed|done)|done with|mark .* (as )?(done|complete)|finished|completed|tick off)\b/i], kw: ['done with', 'i finished', 'i completed', 'mark done', 'tick off'] },
    hi: { re: [/(पूरा हो गया|हो गया|खत्म हो गया|पूरा कर लिया|डन कर)/], kw: ['पूरा हो गया', 'खत्म', 'डन'] },
    te: { re: [/(పూర్తయింది|పూర్తి చేశాను|అయిపోయింది|డన్)/], kw: ['పూర్తయింది', 'పూర్తి చేశాను'] }
  },
  {
    id: 'studyplan_generate',
    pri: 92,
    en: {
      re: [/\b(make|create|build|plan|prepare|give me)\b.*\b(study )?(plan|timetable|schedule|routine)\b|\bstudy plan\b.*\b(for|banao)\b/i],
      kw: ['make a study plan', 'study plan for', 'plan my week', 'timetable for', 'make my schedule', 'study timetable']
    },
    hi: { re: [/(स्टडी प्लान|टाइमटेबल|टाइम टेबल|रूटीन|प्लान).*(बनाओ|बनाइए|बना दो|चाहिए)/], kw: ['प्लान बनाओ', 'टाइमटेबल बनाओ', 'रूटीन बनाओ'] },
    te: { re: [/(స్టడీ ప్లాన్|టైమ్ టేబుల్|ప్లాన్|షెడ్యూల్).*(చేయి|చేయండి|కావాలి)/], kw: ['ప్లాన్ చేయి', 'టైమ్ టేబుల్ చేయి'] }
  },
  {
    id: 'focus_start',
    pri: 91,
    en: {
      re: [/\b(start|begin|do|run)\b.*\b(focus|pomodoro|study timer|focus session|timer)\b|\bpomodoro\b/i],
      kw: ['start focus', 'pomodoro', 'focus timer', 'focus for', 'study timer', 'start a timer']
    },
    hi: { re: [/(फोकस|पोमोडोरो|टाइमर).*(शुरू|चालू|लगाओ)/], kw: ['फोकस शुरू', 'पोमोडोरो', 'टाइमर लगाओ'] },
    te: { re: [/(ఫోకస్|పొమొడోరో|టైమర్).*(మొదలు|పెట్టు|స్టార్ట్)/], kw: ['ఫోకస్ మొదలు', 'పొమొడోరో', 'టైమర్ పెట్టు'] }
  },
  {
    id: 'alarm_show',
    pri: 93,
    en: { re: [/\b(my|next|show|list|what)\b.*\b(alarms?|reminders?)\b|\bwhen (will|does) my alarm\b/i], kw: ['my alarms', 'next alarm', 'show alarms', 'my reminders', 'list alarms'] },
    hi: { re: [/(अलार्म|रिमाइंडर).*(दिखाओ|बताओ|कौन|कब)/], kw: ['अलार्म दिखाओ', 'अगला अलार्म', 'रिमाइंडर दिखाओ'] },
    te: { re: [/(అలారం|రిమైండర్).*(చూపించు|చెప్పు|ఏది|ఎప్పుడు)/], kw: ['అలారమ్ చూపించు', 'రిమైండర్ చూపించు'] }
  },
  {
    id: 'todo_show',
    pri: 93,
    en: {
      re: [/\b(my|show|what|list|any|how many)\b.*\b(to[- ]?dos?|tasks?|homework|pending|left|remaining)\b|\bwhat should i do\b/i],
      kw: ['my to-do', 'my todos', 'show tasks', 'pending tasks', 'what is pending', 'what should i do']
    },
    hi: { re: [/(टू-डू|टास्क|काम|बाकी).*(दिखाओ|क्या|बताओ|कौन)/], kw: ['टू-डू दिखाओ', 'बाकी काम', 'क्या करना है'] },
    te: { re: [/(టూ-డూ|టాస్క్|పనులు|పెండింగ్).*(చూపించు|ఏం|చెప్పు)/], kw: ['టూ-డూ చూపించు', 'పెండింగ్ పనులు', 'ఏం చేయాలి'] }
  },
  {
    id: 'studyplan_show',
    pri: 92,
    en: { re: [/\b(my|today'?s|show|what|any)\b.*\b(study )?(plan|sessions?|timetable|schedule)\b/i], kw: ['my study plan', 'today\'s sessions', 'show my plan', 'my timetable', 'my plan'] },
    hi: { re: [/(आज के सत्र|मेरा प्लान|स्टडी प्लान|आज का प्लान).*(दिखाओ|क्या|बताओ)?/], kw: ['आज के सत्र', 'मेरा स्टडी प्लान', 'प्लान दिखाओ'] },
    te: { re: [/(నేటి సెషన్లు|నా ప్లాన్|స్టడీ ప్లాన్).*(చూపించు|ఏం|చెప్పు)?/], kw: ['నేటి సెషన్లు', 'నా ప్లాన్ చూపించు'] }
  },
  {
    id: 'notif_show',
    pri: 92,
    en: { re: [/\b(notifications?|what did i miss|any updates?|inbox)\b/i], kw: ['notifications', 'what did i miss', 'my inbox', 'any updates'] },
    hi: { re: [/(नोटिफिकेशन|सूचना|क्या छूटा|इनबॉक्स)/], kw: ['नोटिफिकेशन', 'सूचनाएँ', 'क्या छूटा'] },
    te: { re: [/(నోటిఫికేషన్|సూచనలు|ఏమి మిస్|ఇన్‌బాక్స్)/], kw: ['నోటిఫికేషన్లు', 'ఏమి మిస్ అయింది'] }
  },
  {
    id: 'time_show',
    pri: 92,
    en: {
      re: [/\bhow (long|much) (did|have) i (study|studied)|study (time|hours) (today|this week)|time tracking\b/i],
      kw: ['how long did i study', 'study time today', 'time tracking', 'my study hours', 'how much did i study']
    },
    hi: { re: [/(कितना (पढ़ा|पढ़ाई)|कितनी देर पढ़ा|टाइम ट्रैकिंग|स्टडी टाइम)/], kw: ['कितना पढ़ा', 'कितनी देर', 'टाइम ट्रैकिंग'] },
    te: { re: [/(ఎంత చదివాను|ఎంత సేపు చదివాను|టైమ్ ట్రాకింగ్|స్టడీ టైమ్)/], kw: ['ఎంత చదివాను', 'ఎంత సేపు', 'టైమ్ ట్రాకింగ్'] }
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
