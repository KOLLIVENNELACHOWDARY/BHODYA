"""
Bodhya guide chatbot — offline rule-based assistant (no API keys).

Product decision: Bodhya is a GUIDE, not a teacher. It does not explain
study topics. It helps when the user is stuck, sends idle reminders
("are you there?"), and gives guided tours of the app.

The conversational brain runs entirely in the browser
(frontend/src/features/chatbot/), so this router intentionally does NOT
call llm_router.py — it only:
  1. Exposes module status/health for the team
  2. Mirrors the frontend intent classifier in Python (for logging /
     analytics without an LLM call)
  3. Serves contextual help copy per page (EN / HI / TE)
"""

from __future__ import annotations

import re
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ---------------------------------------------------------------------------
# Rule-based intent classification (mirror of
# frontend/src/features/chatbot/brain/intents.js)
# ---------------------------------------------------------------------------

INTENT_PATTERNS: dict[str, list[str]] = {
    "stuck": [
        r"i'?m stuck", r"i am stuck", r"confused", r"not working",
        r"where do i", r"how do i", r"can'?t find", r"don'?t understand",
        r"मैं अटक", r"अटक गया", r"समझ नहीं", r"నేను ఇరుక్కున్న", r"అర్థం కాలేదు",
    ],
    "tour": [
        r"tour", r"walk me through", r"show me around", r"guide me",
        r"onboarding", r"how do i use this", r"घुमाओ", r"టూర్", r"చూపించు",
    ],
    "help": [
        r"\bhelp\b", r"assist", r"support", r"what should i do",
        r"मदद", r"సహాయం", r"హెల్ప్",
    ],
    "chapter_tasks": [
        r"(make|turn|convert|create|break)\b.*\b(tasks?|to-?dos?|checklist)\b.*\b(from|out of)\b.*\b(chapter|notes|syllabus|text)\b",
        r"\bchapter tasks?\b", r"\bnotes into tasks\b",
        r"(अध्याय|नोट्स).*(टास्क|टू-डू)", r"(అధ్యాయం|నోట్స్).*(టాస్క్|పనులు)",
    ],
    "plan_repeat": [
        r"(repeat|every)\b.*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|week|day)s?\b",
        r"make .*(it|this|that|session|class|study).*(repeat|weekly)",
        r"(दोहराओ|हर)\s*(सोम|मंगल|बुध|गुरु|शुक्र|शनि|रवि|हफ़्ते)",
        r"(పునరావృతం|ప్రతి)\s*(సోమ|మంగళ|బుధ|గురు|శుక్ర|శని|ఆది|వారం)",
    ],
    "plan_move": [
        r"(move|shift|reschedule|push)\b.*\b(session|class|study|it|that)\b",
        r"move\b.*\b\d{1,2}(:\d{2})?\s*(am|pm)?\b",
        r"(सत्र|क्लास).*(खिसकाओ|आगे बढ़ाओ)", r"(సెషన్|క్లాస్).*(జరుపు|మార్చు|వాయిదా)",
    ],
    "letter_write": [
        r"letter to (my )?(future|past) (me|self)", r"write .*letter.*(future|myself)",
        r"time capsule", r"भविष्य को (चिट्ठी|पत्र)", r"భవిష్యత్తుకు ఉత్తరం",
    ],
    "letter_show": [r"my letters", r"sealed letters?", r"any letters", r"मेरी चिट्ठियाँ", r"నా ఉత్తరాలు"],
    "guardian_share": [
        r"share .*(progress|stats|report).*(parent|mom|mum|dad|teacher|guardian)",
        r"guardian (view|code|report)", r"parent report",
        r"माता-पिता को दिखाओ", r"తల్లిదండ్రులకు చూపించు",
    ],
    "journal_add": [
        r"^(dear )?(journal|diary)\b", r"write in my (journal|diary)",
        r"^(जर्नल|डायरी)\b", r"^(జర్నల్|డైరీ)\b",
        r"add to my (journal|diary)", r"जर्नल\s*[:\-]", r"डायरी में लिखो", r"జర్నల్\s*[:\-]",
    ],
    "journal_prompt": [r"journal prompts?", r"writing prompts?", r"what should i (write|journal) about",
                       r"जर्नल का सवाल", r"జర్నల్ ప్రశ్న"],
    "journal_show": [r"my (journal|diary)", r"show my (journal|diary)", r"how was my week",
                     r"weekly review", r"जर्नल दिखाओ", r"जर्नल చూపించు"],
    "urge_help": [
        r"i (want|wanna|need) to (scroll|browse|check)", r"can'?t stop scrolling",
        r"help me stop scrolling", r"doomscroll", r"मुझे स्क्रॉल", r"డూమ్.?స్క్రోల్",
    ],
    "music_start": [
        r"(play|start|put on).*(music|song|noise|beats?|lofi|rain|piano|brown|white)",
        r"(play|start).*(sound|audio)", r"study music", r"focus music",
        r"music for (studying|reading|focus)|binaural|lo-?fi",
        r"संगीत चलाओ", r"म्यूज़िक", r"మ్యూజిక్ ప్లే", r"సంగీతం",
    ],
    "music_stop": [r"stop the music", r"pause music", r"music off", r"संगीत बंद", r"మ్యూజిక్ ఆపు"],
    "forest_plant": [
        r"plant .*(tree|forest)", r"don'?t let me (scroll|leave)", r"पेड़ लगाओ", r"చెట్టు నాటు",
    ],
    "forest_stats": [r"my forest", r"how.*(forest|trees)", r"my streak", r"मेरा फ़ॉरेस्ट", r"నా ఫారెస్ట్"],
    "shield_block": [r"block (instagram|youtube|social|\w+\.\w+)", r"blocklist", r"ब्लॉक करो", r"బ్లాక్ చేయి"],
    "shield_stats": [r"shield (stats|report)", r"escapes? today", r"कितनी बार भटका", r"ఎస్కేప్.?లు"],
    "alarm_add": [
        r"remind me", r"set (an? )?alarm", r"wake me", r"set a reminder",
        r"रिमाइंडर", r"अलार्म", r"याद दिला", r"రిమైండర్", r"అలారం", r"గుర్తు చేయి",
    ],
    "alarm_stop": [r"stop the alarm", r"snooze the alarm", r"अलार्म बंद", r"అలారం ఆపు"],
    "alarm_show": [r"my alarms?", r"next alarm", r"अलार्म दिखाओ", r"అలారమ్ చూపించు"],
    "todo_add": [
        r"add (a )?to-?do", r"add (a )?task", r"to-?do:", r"टू-डू जोड़ो", r"टास्क जोड़ो", r"టూ-డూ జోడించు",
    ],
    "todo_show": [r"my to-?dos?", r"what should i do", r"pending tasks", r"टू-डू दिखाओ", r"టూ-డూ చూపించు"],
    "todo_done": [r"done with", r"i (finished|completed)", r"mark .* done", r"पूरा हो गया", r"పూర్తయింది"],
    "studyplan_generate": [
        r"(make|build|create|plan).*(study )?(plan|timetable|schedule)",
        r"study plan for", r"प्लान बनाओ", r"टाइमटेबल बनाओ", r"ప్లాన్ చేయి",
    ],
    "studyplan_show": [r"my (study )?plan", r"today'?s sessions", r"आज का प्लान", r"నేటి ప్లాన్"],
    "focus_start": [r"start .*(focus|pomodoro|timer)", r"pomodoro", r"फोकस शुरू", r"ఫోకస్ మొదలు"],
    "notif_show": [r"notifications?", r"what did i miss", r"नोटिफिकेशन", r"నోటిఫికేషన్"],
    "time_show": [r"how long did i study", r"study time today", r"कितना पढ़ा", r"ఎంత చదివాను"],
    "planner_add": [
        r"add .*(\d+)\s*(min|hour)", r"schedule", r"plan for",
        r"जोड़ो", r"జోడించు",
    ],
    "planner_show": [r"show my plan", r"my tasks", r"today'?s plan", r"प्लान दिखाओ", r"ప్లాన్ చూపించు"],
    "quiz_start": [r"start .*quiz", r"play .*quiz", r"boss battle", r"quiz me", r"क्विज़ शुरू", r"క్విజ్ మొదలు"],
    "quiz_info": [r"how does the quiz", r"how do quizzes", r"what is the quiz", r"quiz work"],
    "progress_info": [r"how am i doing", r"my progress", r"my stats", r"my xp", r"मेरी प्रोग्रेस", r"నా ప్రోగ్రెస్"],
    "explain_redirect": [
        r"explain", r"what is", r"what are", r"define", r"teach me",
        r"समझाओ", r"बताओ", r"వివరించు", r"నేర్పించు",
    ],
    "greet": [r"^(hi|hello|hey|namaste)\b", r"नमस्ते", r"నమస్కారం"],
    "capabilities": [r"what can you do", r"who are you", r"your features", r"तुम क्या कर सकते", r"నువ్వు ఏం చేయగలవు"],
}

INTENT_PRIORITY: list[str] = [
    # action intents first: "what are my to-dos" must never be read as "explain"
  "chapter_tasks", "plan_repeat", "plan_move",
  "letter_write", "letter_show", "guardian_share",
    "journal_add", "journal_prompt", "journal_show",
    "urge_help", "music_stop", "music_start", "shield_block", "forest_plant",
    "shield_stats", "forest_stats",
    "alarm_add", "alarm_stop", "todo_add", "todo_done", "alarm_show", "todo_show",
    "studyplan_generate", "studyplan_show", "focus_start", "notif_show", "time_show",
    "stuck", "tour", "planner_add", "planner_show", "quiz_start", "quiz_info",
    "progress_info", "explain_redirect", "capabilities", "help", "greet",
]

CONTEXTUAL_HELP: dict[str, dict[str, str]] = {
    "home": {
        "en": "You're on the Dashboard tab — progress, quick actions and everything at a glance.",
        "hi": "आप डैशबोर्ड टैब पर हैं — प्रोग्रेस, क्विक एक्शन, सब कुछ एक नज़र में।",
        "te": "మీరు డాష్‌బోర్డ్ ట్యాబ్ లో ఉన్నారు — ప్రోగ్రెస్, క్విక్ యాక్షన్లు అన్నీ ఒక చూపులో.",
    },
    "quiz": {
        "en": "Quiz Arena tab: Boss Battle quizzes — 5 questions per battle, difficulty adapts to your level.",
        "hi": "क्विज़ एरीना टैब: बॉस बैटल क्विज़ — हर बैटल में 5 सवाल, कठिनाई आपके लेवल के हिसाब से।",
        "te": "క్విజ్ అరేనా ట్యాబ్: బాస్ బాటిల్ క్విజ్‌లు — ఒక్కో బాటిల్ లో 5 ప్రశ్నలు, కష్టతరం మీ లెవల్ కి తగ్గట్టు.",
    },
    "tests": {
        "en": "Tests tab: assessments and long/short answer questions from your study material.",
        "hi": "टेस्ट टैब: आकलन और स्टडी सामग्री से लॉन्ग/शॉर्ट आंसर प्रश्न।",
        "te": "టెస్ట్లు ట్యాబ్: మీ స్టడీ మెటీరియల్ నుంచి మదింపులు & లాంగ్/షార్ట్ ప్రశ్నలు.",
    },
    "planner": {
        "en": "Study Planner tab: plan sessions, or tell the chat \"add maths 30 minutes\".",
        "hi": "स्टडी प्लानर टैब: सेशन प्लान करें, या चैट में \"गणित 30 मिनट जोड़ो\" कहें।",
        "te": "స్టడీ ప్లానర్ ట్యాబ్: సెషన్లు ప్లాన్ చేయండి, లేదా చాట్ లో \"గణితం 30 నిమిషాలు జోడించు\" అనండి.",
    },
    "todo": {
        "en": "To-do List tab: simple daily tasks.",
        "hi": "टू-डू लिस्ट टैब: आसान रोज़ाना काम।",
        "te": "టూ-డూ లిస్ట్ ట్యాబ్: సింపుల్ రోజువారీ పనులు.",
    },
    "alarms": {
        "en": "Alarms tab: wake-ups, study blocks and reminders. Ring screen with snooze, templates, missed-alarm log — say \"remind me at 7 am to study maths\" and I will set one for you.",
        "hi": "अलार्म टैब: उठने के अलार्म, स्टडी ब्लॉक और रिमाइंडर। स्नूज़, टेम्पलेट और छूटे अलार्म का इतिहास — कहिए \"सुबह 7 बजे गणित का रिमाइंडर\" और मैं लगा दूँगा।",
        "te": "అలారమ్‌లు ట్యాబ్: లేవడానికి అలారమ్‌లు, స్టడీ బ్లాక్‌లు, రిమైండర్లు. స్నూజ్, టెంప్లేట్లు, మిస్ అయిన అలారమ్‌ల చరిత్ర — \"ఉదయం 7 కి మ్యాథ్స్ రిమైండర్\" అనండి.",
    },
    "notifications": {
        "en": "Notifications tab: one inbox for every reminder I send, plus what is coming next. Quiet hours, sounds, digest time and phone notifications live in Settings.",
        "hi": "नोटिफिकेशन टैब: मेरी सभी सूचनाएँ एक जगह, और आगे क्या आने वाला है। शांत समय, आवाज़, दैनिक सार और फ़ोन नोटिफिकेशन सेटिंग्स में हैं।",
        "te": "నోటిఫికేషన్లు ట్యాబ్: నేను పంపే అన్ని రిమైండర్లు ఒకే ఇన్‌బాక్స్‌లో, ఇంకా రాబోయేవి. నిశ్శబ్ద సమయం, శబ్దాలు, సారాంశం సెట్టింగ్స్‌లో ఉన్నాయి.",
    },
    "focus": {
        "en": "Focus Timer tab: Pomodoro blocks with automatic breaks. Every finished block is logged as study time and XP — say \"start a 25 minute focus on chemistry\".",
        "hi": "फोकस टाइमर टैब: पोमोडोरो ब्लॉक, अपने आप ब्रेक के साथ। हर पूरा ब्लॉक स्टडी टाइम और XP में जुड़ता है — कहिए \"रसायन पर 25 मिनट फोकस शुरू करो\"।",
        "te": "ఫోకస్ టైమర్ ట్యాబ్: పొమొడోరో బ్లాక్‌లు, ఆటో విరామాలతో. ప్రతి బ్లాక్ స్టడీ టైమ్, XP అవుతుంది — \"కెమిస్ట్రీ పై 25 నిమిషాల ఫోకస్\" అనండి.",
    },
    "shield": {
        "en": "Focus Shield tab: blocklists you can export to your device (hosts file / DNS rules), escape tracking during sessions, a 90-second urge routine and a daily scroll budget. Say \"I want to scroll\" on any page and I will start the breathing timer.",
        "hi": "फोकस शील्ड टैब: डिवाइस पर एक्सपोर्ट करने योग्य ब्लॉकलिस्ट (hosts फ़ाइल / DNS नियम), सत्र में भटकाव की निगरानी, 90 सेकंड की इच्छा-रूटीन और रोज़ का स्क्रॉल बजट। कहीं भी \"मुझे स्क्रॉल करना है\" कहिए — साँसों का टाइमर शुरू हो जाएगा।",
        "te": "ఫోకస్ షీల్డ్ ట్యాబ్: పరికరంలోకి ఎక్స్‌పోర్ట్ చేయగల బ్లాక్‌లిస్ట్ (hosts/DNS), సెషన్ ఎస్కేప్ ట్రాకింగ్, 90 సెకన్ల ఇచ్ఛా రొటీన్, రోజువారీ స్క్రోల్ బడ్జెట్. \"నాకు స్క్రోల్ చేయాలి\" అనండి.",
    },
    "music": {
        "en": "Study Music tab: music Bodhya synthesises offline — warm pads, lo-fi, rain, brown noise and binaural alpha/theta waves, with a mixer, a sleep timer and autoplay with your focus block. Say \"play focus music\" or \"play rain sounds\".",
        "hi": "स्टडी म्यूज़िक टैब: Bodhya ऑफ़लाइन बनाता है — गर्म पैड, लो-फ़ाई, बारिश, ब्राउन नॉइज़ और बाइनॉरल अल्फा/थीटा तरंगें, मिक्सर, स्लीप टाइमर और फोकस ब्लॉक के साथ ऑटोप्ले। कहिए \"संगीत चलाओ\" या \"बारिश की आवाज़\"।",
        "te": "స్టడీ మ్యూజిక్ ట్యాబ్: Bodhya ఆఫ్‌లైన్‌లో తయారు చేస్తుంది — ప్యాడ్‌లు, లో-ఫై, వర్షం, బ్రౌన్ నాయిస్, బైనారల్ తరంగాలు, మిక్సర్, స్లీప్ టైమర్. \"మ్యూజిక్ ప్లే\" అనండి.",
    },
    "forest": {
        "en": "Study Forest tab: plant a tree and the timer starts; finish the task and the tree stays in your forest with coins and a streak, leave the app and it withers. Say \"plant a tree for 25 minutes\".",
        "hi": "स्टडी फ़ॉरेस्ट टैब: पेड़ लगाइए और टाइमर शुरू; काम पूरा तो पेड़ सिक्कों और स्ट्रीक के साथ रहेगा, ऐप छोड़ा तो मुरझा जाएगा। कहिए \"25 मिनट का पेड़ लगाओ\"।",
        "te": "స్టడీ ఫారెస్ట్ ట్యాబ్: చెట్టు నాటండి, టైమర్ మొదలవుతుంది; పని పూర్తయితే నాణేలు, స్ట్రీక్‌తో నిలుస్తుంది, యాప్ వదిలితే వాడిపోతుంది. \"25 నిమిషాల చెట్టు నాటు\" అనండి.",
    },
    "guardian": {
        "en": "Guardian tab: a consensual read-only view for a parent or teacher. The student creates a 6-character code, picks the sections, and can pause or revoke it any time. Journal writing stays private unless they open that section. Say \"share my progress with my parents\" and I will make the code.",
        "hi": "अभिभावक टैब: माता-पिता या शिक्षक के लिए सहमति-आधारित सिर्फ़-पढ़ने वाला व्यू। छात्र 6 अक्षरों का कोड बनाता है, भाग चुनता है, और कभी भी रोक या रद्द कर सकता है। जर्नल लिखा हुआ तब तक निजी रहता है जब तक वह भाग चालू न करे।",
        "te": "గార్డియన్ ట్యాబ్: తల్లిదండ్రులు/టీచర్ కోసం అనుమతి ఆధారిత చదవడానికి-మాత్రమే వ్యూ. విద్యార్థి 6 అక్షరాల కోడ్ సృష్టించి, విభాగాలు ఎంచుకుని, ఎప్పుడైనా ఆపవచ్చు, రద్దు చేయవచ్చు. జర్నల్ రాత ప్రైవేట్‌గా ఉంటుంది.",
    },
    "journal": {
        "en": "Journal tab: a personalised diary. The prompts are chosen from your own day (minutes focused, trees, escapes, tasks, exam countdown, recent moods) and every evening I nudge you to write one line. Say \"journal: today was rough but optics clicked\" and I will save it for you.",
        "hi": "जर्नल टैब: व्यक्तिगत डायरी। सवाल आपके ही दिन से चुने जाते हैं (कितने मिनट पढ़े, पेड़, भटकाव, काम, परीक्षा काउंटडाउन, हाल का मूड) और हर शाम मैं एक लाइन लिखने को कहता हूँ। कहिए \"जर्नल: आज कठिन था पर ऑप्टिक्स समझ आया\" — मैं सेव कर दूँगा।",
        "te": "జర్నల్ ట్యాబ్: వ్యక్తిగత డైరీ. ప్రశ్నలు మీ రోజు నుంచే ఎంపిక — నిమిషాలు, చెట్లు, ఎస్కేప్‌లు, పనులు, పరీక్ష కౌంట్‌డౌన్, మూడ్. ప్రతి సాయంత్రం ఒక లైన్ రాయమని గుర్తు చేస్తాను. \"జర్నల్: ఈరోజు కష్టం కానీ ఆప్టిక్స్ అర్థమైంది\" అనండి.",
    },
    "time": {
        "en": "Time Tracking tab: every focused minute — daily goal, week chart, per-subject breakdown.",
        "hi": "टाइम ट्रैकिंग टैब: हर फोकस मिनट — रोज़ का लक्ष्य, हफ़्ते का चार्ट, हर विषय का हिसाब।",
        "te": "టైమ్ ట్రాకింగ్ ట్యాబ్: ప్రతి ఫోకస్ నిమిషం — రోజు లక్ష్యం, వారం చార్ట్, సబ్జెక్ట్ వారీగా.",
    },
    "knowledge": {
        "en": "Knowledge Graph tab: your personal map of topics and connections.",
        "hi": "नॉलेज ग्राफ टैब: टॉपिक और कनेक्शन का आपका निजी नक्शा।",
        "te": "నాలెడ్జ్ గ్రాఫ్ ట్యాబ్: టాపిక్‌లు, సంబంధాల మీ వ్యక్తిగత పటం.",
    },
    "tutor": {
        "en": "Tutor Chat tab: the Socratic AI tutor and character explainers (team feature).",
        "hi": "ट्यूटर चैट टैब: सॉक्रेटिक AI ट्यूटर और कैरेक्टर एक्सप्लेनर (टीम फीचर)।",
        "te": "ట్యూటర్ చాట్ ట్యాబ్: సాక్రటిక్ AI ట్యూటర్ & క్యారెక్టర్ ఎక్స్‌ప్లైనర్లు (టీమ్ ఫీచర్).",
    },
    "revision": {
        "en": "Revision Tools tab: mindmaps and flashcards for quick revision.",
        "hi": "रिवीज़न टूल्स टैब: माइंडमैप और फ्लैशकार्ड से क्विक रिवीज़न।",
        "te": "రివిజన్ టూల్స్ ట్యాబ్: త్వరిత రివిజన్ కోసం మైండ్‌మ్యాప్స్ & ఫ్లాష్‌కార్డులు.",
    },
    "rag": {
        "en": "Upload & Query tab: upload PDFs, docs or images and ask questions (RAG).",
        "hi": "अपलोड और पूछें टैब: PDF, डॉक्स या इमेज अपलोड करें और सवाल पूछें (RAG)।",
        "te": "అప్‌లోడ్ & ప్రశ్నలు ట్యాబ్: PDFలు, డాక్స్ లేదా ఇమేజెస్ అప్‌లోడ్ చేసి అడగండి (RAG).",
    },
    "rooms": {
        "en": "Collab Rooms tab: real-time research rooms with your team.",
        "hi": "कोलैब रूम्स टैब: टीम के साथ रीयल-टाइम रिसर्च रूम।",
        "te": "కొలాబ్ రూమ్స్ ట్యాబ్: మీ టీమ్ తో రియల్‌టైమ్ రీసెర్చ్ రూమ్స్.",
    },
    "rewards": {
        "en": "Streaks & Rewards tab: points, streaks and stickers.",
        "hi": "स्ट्रीक्स और रिवॉर्ड्स टैब: पॉइंट्स, स्ट्रीक्स और स्टिकर्स।",
        "te": "స్ట్రీక్స్ & రివార్డ్స్ ట్యాబ్: పాయింట్లు, స్ట్రీక్స్, స్టిక్కర్లు.",
    },
    "reviews": {
        "en": "Reviews tab: share suggestions and feedback with the team.",
        "hi": "रिव्यूज़ टैब: टीम को सुझाव और फीडबैक दें।",
        "te": "రివ్యూలు ట్యాబ్: టీమ్ కి సూచనలు, ఫీడ్‌బ్యాక్ ఇవ్వండి.",
    },
    "safety": {
        "en": "Parental Lock tab: safety controls and emergency contacts.",
        "hi": "पैरेंटल लॉक टैब: सेफ्टी कंट्रोल्स और इमरजेंसी कॉन्टैक्ट।",
        "te": "పేరెంటల్ లాక్ ట్యాబ్: భద్రతా నియంత్రణలు & ఎమర్జెన్సీ కాంటాక్ట్స్.",
    },
}

FALLBACK_HELP: dict[str, str] = {
    "en": "You're on this tab — I'm Bodhya, your guide. Say \"I'm stuck\", \"show me around\", or tap the 🦉 button to chat!",
    "hi": "आप इस टैब पर हैं — मैं Bodhya, आपका गाइड। \"मैं अटक गया\", \"घुमाओ\" कहिए, या 🦉 बटन दबाइए!",
    "te": "మీరు ఈ ట్యాబ్ లో ఉన్నారు — నేను Bodhya, మీ గైడ్. \"నేను ఇరుక్కున్నా\", \"చూపించు\" అనండి, లేదా 🦉 నొక్కండి!",
}

PAGE_IDS = tuple(CONTEXTUAL_HELP.keys())


class ClassifyRequest(BaseModel):
    text: str


def classify(text: str) -> dict:
    """Classify a user message into a Bodhya intent (rule-based, offline)."""
    lowered = (text or "").lower()
    for intent in INTENT_PRIORITY:
        for pattern in INTENT_PATTERNS[intent]:
            if re.search(pattern, lowered):
                return {
                    "intent": intent,
                    "handled_by": "frontend (no API keys)",
                }
    return {"intent": "fallback", "handled_by": "frontend (no API keys)"}


@router.get("/status")
def status() -> dict:
    return {
        "module": "bodhya-chatbot-guide",
        "mode": "offline-frontend",  # the conversational brain lives in the browser
        "api_keys_required": False,
        "features": [
            "stuck-help", "guided-tour", "idle-reminders",
            "voice-input", "voice-output", "multi-language",
            "alarms", "reminders", "to-dos", "study-plan", "focus-timer",
            "notifications-inbox", "daily-digest", "study-time-tracking",
            "doomscroll-shield", "blocklist-export", "urge-routine",
            "study-music", "binaural-beats", "study-forest", "streaks",
            "personalised-journal", "mood-tracking", "weekly-review",
            "voice-notes", "letters-to-future-self", "guardian-share-view",
        ],
        "languages": ["en", "hi", "te"],
    }


@router.post("/classify")
def classify_message(req: ClassifyRequest) -> dict:
    """Classify a message server-side (for analytics/logging) — no LLM involved."""
    return classify(req.text)


@router.get("/help/{page_id}")
def page_help(page_id: str = "home", lang: str = "en") -> dict:
    """Contextual help copy for any tab (falls back to a generic guide message)."""
    lang = lang if lang in ("en", "hi", "te") else "en"
    if page_id in CONTEXTUAL_HELP:
        return {"page": page_id, "help": CONTEXTUAL_HELP[page_id][lang], "lang": lang}
    return {"page": page_id, "help": FALLBACK_HELP[lang], "lang": lang, "generic": True}


# ---------------------------------------------------------------------------
# LLM-powered agent chat (the conversational brain)
# Uses the team's free-tier llm_router (Groq → Gemini). If no keys are
# configured yet (or the provider fails), it falls back to the rule-based
# guide so the app never breaks. The frontend also has its own rule fallback.
# ---------------------------------------------------------------------------

AGENT_SYSTEM = """You are Bodhya (बोध्य, Sanskrit for "knowledge"), the friendly guide chatbot of an AI Learning Companion app.

PERSONALITY & ROLE
- You are a GUIDE, NOT a teacher: you never explain study topics in depth. You help users navigate the app, get unstuck, and feel at home.
- You are warm, concise and human. Use short sentences, sometimes one question at the end.
- You know the app's features: Dashboard, Quiz Arena, Notes Quiz (make quizzes from the user's own notes), Study Planner, Knowledge Graph, Tutor Chat, Revision Tools, Upload & Query (RAG), Collab Rooms, Streaks & Rewards, Reviews, Parental Lock, My Avatar.
- You can understand and reply in the user's language (English / हिन्दी / తెలుగు) — always match it.

WHAT YOU CAN DO FOR THE USER (not just talk about)
- Set alarms and reminders: "remind me at 7 am to revise physics", "remind me in 20 minutes to drink water", "every day at 6 wake me up".
- Keep the to-do list: "add to-do: finish physics notes", "what are my to-dos", "done with physics homework".
- Build a study plan: "make a 7 day study plan for physics and maths, 2 hours a day".
- Run the focus timer: "start a 25 minute focus on chemistry".
- Plant a tree (Forest-style focus): "plant a tree for 25 minutes" — the tree survives only if they stay in the app.
- Play study music: "play focus music", "play rain sounds", "play brown noise", "play lofi" (synthesised offline in the browser).
- Fight the scroll reflex: "block instagram", "block social media", "what is blocked", and when the urge hits: "I want to scroll" (a 90-second breathing routine).
- Write a letter to their future self: "letter to future me, open in 3 months" — it stays sealed until that date.
- Share a read-only progress view with a parent/teacher: "share my progress with my parents" (they get a code; journal writing stays private).
- Keep the journal: "journal: today was rough but optics clicked" saves an entry (mood is detected from the words), "give me a journal prompt" uses the prompts picked from their day, "show my journal" reports the streak, average mood and mood trend, "how was my week" gives the weekly review.
- Report back: "what's my plan today", "how long did I study today", "show my notifications", "my alarms".
When you perform one of these, confirm it with the real details (time, title, minutes) and keep it to a couple of lines.

WHEN THE USER WANTS AN ACTION
If the user asks for a tour, quiz, notes quiz, planner, progress, settings or avatar, end your reply with an action marker on its own line:
[action:startTour]  [action:openQuiz]  [action:openNotesQuiz]  [action:openPlanner]  [action:openProgress]  [action:openSettings]  [action:openAvatar]

RULES
- Keep replies under 90 words unless asked for more.
- If they say they are stuck or frustrated, be reassuring and give one concrete step.
- Never claim to be a human. Never mention API keys unless asked.
- Never give lengthy academic explanations."""


class AgentMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AgentChatRequest(BaseModel):
    messages: list[AgentMessage]
    context: str = "home"
    lang: str = "en"
    profile: dict = {}


def _agent_system_prompt(req: AgentChatRequest) -> str:
    name = (req.profile or {}).get("name", "")
    age = (req.profile or {}).get("ageGroup", "teen")
    page = CONTEXTUAL_HELP.get(req.context, {}).get("en", "the current page")
    intro = AGENT_SYSTEM
    if name:
        intro += f"\n\nTHE USER: their name is {name}, age band {age}."
    intro += f"\n\nTHE USER IS CURRENTLY ON: {page} (context id: {req.context}). Use this to give contextual help."
    return intro


def _extract_action(reply: str) -> tuple[str, str]:
    import re
    m = re.search(r"\[action:(\w+)\]", reply)
    if not m:
        return reply.strip(), ""
    action = m.group(1)
    clean = reply.replace(m.group(0), "").strip()
    return clean, action


@router.post("/chat")
async def agent_chat(req: AgentChatRequest) -> dict:
    """LLM-powered agent reply (via llm_router); falls back to rule guidance."""
    last = req.messages[-1].content if req.messages else ""
    try:
        from app.services import llm_router  # team's free-tier router
        reply = await llm_router.generate(
            prompt=last,
            system=_agent_system_prompt(req),
        )
        if reply and reply.strip() and not reply.startswith("NotImplemented"):
            text, action = _extract_action(reply)
            return {"reply": text, "mode": "llm", "action": action or None}
    except Exception:
        pass  # provider down / no keys yet → rule fallback below

    # Rule fallback: classify + contextual guidance (still helpful, zero keys)
    intent = classify(last)["intent"]
    lang = req.lang if req.lang in ("en", "hi", "te") else "en"
    page = CONTEXTUAL_HELP.get(req.context, {}).get(lang, CONTEXTUAL_HELP.get(req.context, {}).get("en", ""))
    hints = {
        "tour": {"en": "Say \"show me around\" and I'll start the deep-dive tour!", "hi": "“घुमाओ” कहिए — डीप-डाइव टूर शुरू होगा!", "te": "\"చూపించు\" అనండి — డీప్-డైవ్ టూర్ మొదలవుతుంది!"},
        "quiz_start": {"en": "Open the Quiz Arena tab for a Boss Battle!", "hi": "बॉस बैटल के लिए क्विज़ एरीना टैब खोलें!", "te": "బాస్ బాటిల్ కోసం క్విజ్ అరేనా ట్యాబ్ తెరవండి!"},
        "notes_quiz": {"en": "Open the Notes Quiz tab — paste your notes and I'll generate questions!", "hi": "नोट्स क्विज़ टैब खोलें — नोट्स पेस्ट करें, मैं सवाल बनाऊँगा!", "te": "నోట్స్ క్విజ్ ట్యాబ్ తెరవండి — నోట్స్ పేస్ట్ చేయండి!"},
        "planner_add": {"en": "Say \"add maths 30 minutes\" and it lands in your planner!", "hi": "“गणित 30 मिनट जोड़ो” कहिए — प्लानर में जुड़ जाएगा!", "te": "\"గణితం 30 నిమిషాలు జోడించు\" అనండి!"},
    }
    if intent in hints:
        text = hints[intent][lang]
    elif intent == "stuck":
        text = page or "Tell me what's confusing and I'll walk you through it!"
    else:
        text = {"en": "I'm here to help you around the app — tours, quizzes from your notes, planning, or getting unstuck. What do you need?",
                "hi": "मैं ऐप में मदद के लिए हूँ — टूर, नोट्स क्विज़, प्लानिंग या अटकने पर मदद। बताइए क्या चाहिए?",
                "te": "యాప్ లో సహాయం కోసం ఉన్నాను — టూర్‌లు, నోట్స్ క్విజ్, ప్లానింగ్. ఏం కావాలి?"}[lang]
    return {"reply": text, "mode": "rule", "action": None}
