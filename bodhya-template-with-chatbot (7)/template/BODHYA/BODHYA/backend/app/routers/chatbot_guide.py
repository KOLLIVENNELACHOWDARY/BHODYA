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
    "time": {
        "en": "Time Tracking tab: see how long you study each day.",
        "hi": "टाइम ट्रैकिंग टैब: रोज़ कितनी देर पढ़ते हैं, देखें।",
        "te": "టైమ్ ట్రాకింగ్ ట్యాబ్: రోజుకు ఎంత చదువుతున్నారో చూడండి.",
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
