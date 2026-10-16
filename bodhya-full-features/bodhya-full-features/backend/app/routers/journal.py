"""
Journal service — the server half of Bodhya's personalised diary.

The diary itself lives in the browser (localStorage, private by default).
This router adds what a server is genuinely good at:

  1. The canonical prompt bank + the same personalisation rules as the client,
     so the web app, a future mobile client and the docs never drift.
  2. A weekly review builder (EN/HI/TE) from the numbers the client sends —
     deterministic text, no LLM call.
  3. Optional storage in Supabase (`journal_entries`, migration 0004) so entries
     survive a cleared browser, plus a mood trend endpoint for a coach/parent view.

Privacy note: nothing here requires an account. If you store entries, remember
they are personal writing — RLS policies keep them per-user.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

# ---------------------------------------------------------------------------
# Prompt bank — keep in sync with frontend/src/features/journal/logic.js
# ---------------------------------------------------------------------------
PROMPT_GROUPS: dict[str, list[dict]] = {
    "opening": [
        {"id": "open-1", "q": {"en": "One sentence: how did today actually feel?", "hi": "एक वाक्य: आज असल में कैसा लगा?", "te": "ఒక వాక్యం: ఈరోజు నిజంగా ఎలా అనిపించింది?"}},
        {"id": "open-2", "q": {"en": "If today was a weather report, what would it say?", "hi": "अगर आज मौसम की रिपोर्ट होती, तो क्या कहती?", "te": "ఈరోజు వాతావరణ నివేదిక అయితే ఏం చెబుతుంది?"}},
    ],
    "study": [
        {"id": "study-1", "q": {"en": "What did you understand today that you did not understand yesterday?", "hi": "आज क्या समझ आया जो कल नहीं आया था?", "te": "నిన్న అర్థం కానిది ఈరోజు ఏం అర్థమైంది?"}},
        {"id": "study-2", "q": {"en": "Which topic still feels slippery? What is the very next small step?", "hi": "कौन सा टॉपिक अब भी फिसलता है? अगला छोटा कदम क्या है?", "te": "ఏ టాపిక్ ఇంకా జారిపోతోంది? తదుపరి చిన్న అడుగు ఏమిటి?"}},
        {"id": "study-3", "q": {"en": "Explain today's hardest idea to a 10-year-old in two lines.", "hi": "आज का सबसे कठिन विचार दो लाइनों में समझाइए।", "te": "ఈరోజు కష్టమైన భావనను రెండు లైన్లలో చెప్పండి."}},
    ],
    "focus": [
        {"id": "focus-1", "q": {"en": "When was your attention best today, and what was different then?", "hi": "आज ध्यान कब सबसे अच्छा था, और तब क्या अलग था?", "te": "ఈరోజు ఏకాగ్రత ఎప్పుడు బాగుంది, అప్పుడు ఏం భిన్నంగా ఉంది?"}},
        {"id": "focus-2", "q": {"en": "What pulled you away? (name it — naming it shrinks it)", "hi": "किसने ध्यान खींचा? (नाम लीजिए — नाम लेने से वह छोटा हो जाता है)", "te": "మిమ్మల్ని ఏది దృష్టి తప్పించింది? (పేరు పెట్టండి)"}},
        {"id": "focus-3", "q": {"en": "Rate today's focus honestly, then write one thing that would make tomorrow 10% better.", "hi": "आज के फोकस को ईमानदारी से आँकिए, फिर लिखिए कि कल 10% बेहतर कैसे होगा।", "te": "ఈరోజు ఫోకస్‌ను నిజాయితీగా అంచనా వేయండి, రేపు 10% మెరుగుపడే మార్గం రాయండి."}},
    ],
    "feelings": [
        {"id": "feel-1", "q": {"en": "What is the feeling under the feeling? (tired is often frustrated or bored)", "hi": "भावना के नीचे कौन सी भावना है?", "te": "భావన కింద ఏ భావన ఉంది?"}},
        {"id": "feel-2", "q": {"en": "What are you proud of today, however small?", "hi": "आज किस बात पर गर्व है, चाहे कितनी भी छोटी हो?", "te": "ఈరోజు ఏ విషయంలో గర్వంగా ఉంది?"}},
        {"id": "feel-3", "q": {"en": "Who or what helped you today? Have you told them?", "hi": "आज किसने या किस चीज़ ने मदद की? उन्हें बताया?", "te": "ఈరోజు ఎవరు/ఏది సహాయం చేసింది? చెప్పారా?"}},
    ],
    "plan": [
        {"id": "plan-1", "q": {"en": "Tomorrow's one non-negotiable task is…", "hi": "कल का एक अनिवार्य काम है…", "te": "రేపటి ఒక తప్పనిసరి పని…"}},
        {"id": "plan-2", "q": {"en": "What will you do differently in the first 10 minutes of study?", "hi": "पढ़ाई के पहले 10 मिनट में क्या अलग करेंगे?", "te": "చదువు మొదటి 10 నిమిషాల్లో ఏం భిన్నంగా చేస్తారు?"}},
        {"id": "plan-3", "q": {"en": "One thing to protect tomorrow: sleep, music, a break, or a walk?", "hi": "कल किसे बचाएँगे: नींद, संगीत, ब्रेक या टहलना?", "te": "రేపు ఏది కాపాడుతారు: నిద్ర, సంగీతం, విరామం?"}},
    ],
    "gratitude": [
        {"id": "thanks-1", "q": {"en": "Three small good things from today…", "hi": "आज की तीन छोटी अच्छी बातें…", "te": "ఈరోజు మూడు చిన్న మంచి విషయాలు…"}},
        {"id": "thanks-2", "q": {"en": "Something ordinary that you would miss if it were gone…", "hi": "कोई आम चीज़ जो न हो तो याद आएगी…", "te": "ఏదైనా సాధారణ విషయం, లేకపోతే గుర్తుకొస్తుంది…"}},
    ],
    "exam": [
        {"id": "exam-1", "q": {"en": "Which chapter would you bet on appearing in the exam? Are you ready for it?", "hi": "कौन सा अध्याय परीक्षा में आने का दावा करेंगे? तैयार हैं?", "te": "పరీక్షలో ఏ చాప్టర్ వస్తుందని పందెం? సిద్ధమా?"}},
        {"id": "exam-2", "q": {"en": "One fear about the exam — and one fact that argues against it.", "hi": "परीक्षा का एक डर — और उसके विपरीत एक तथ्य।", "te": "పరీక్ష భయం — దానికి వ్యతిరేకంగా ఒక వాస్తవం."}},
    ],
    "reset": [
        {"id": "reset-1", "q": {"en": "What would you tell a friend who had your exact day?", "hi": "अगर किसी दोस्त का दिन ऐसा होता, तो आप क्या कहते?", "te": "మీ రోజే స్నేహితుడికి ఉంటే ఏం చెబుతారు?"}},
        {"id": "reset-2", "q": {"en": "What is the smallest thing you can restart in 5 minutes?", "hi": "5 मिनट में सबसे छोटी क्या चीज़ फिर शुरू कर सकते हैं?", "te": "5 నిమిషాల్లో తిరిగి మొదలుపెట్టగల చిన్న విషయం ఏది?"}},
    ],
}

ALL_PROMPTS = {p["id"]: {**p, "group": g} for g, items in PROMPT_GROUPS.items() for p in items}

UNLOCK_PRESETS = {
    "1w": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365,
}

LETTER_PROMPTS = [
    {"id": "lt-1", "q": {"en": "Dear future me — what do you hope has changed by then?",
                         "hi": "प्रिय भविष्य का मैं — तब तक क्या बदल जाना चाहते हो?",
                         "te": "ప్రియమైన భవిష్యత్ నేను — అప్పటికి ఏం మారాలని కోరుకుంటున్నావు?"}},
    {"id": "lt-2", "q": {"en": "What are you struggling with right now that will look small later?",
                         "hi": "अभी किस बात से जूझ रहे हो जो बाद में छोटी लगेगी?",
                         "te": "ఇప్పుడు ఏ కష్టంతో పోరాడుతున్నావు, అది తర్వాత చిన్నగా కనిపిస్తుంది?"}},
    {"id": "lt-3", "q": {"en": "One promise to the person reading this.",
                         "hi": "इसे पढ़ने वाले को एक वादा।",
                         "te": "ఇది చదివే వ్యక్తికి ఒక మాట."}},
    {"id": "lt-4", "q": {"en": "What do you want to remember about this exact week?",
                         "hi": "इस हफ़्ते की कौन सी बात याद रखनी है?",
                         "te": "ఈ వారం గురించి ఏది గుర్తుంచుకోవాలి?"}},
    {"id": "lt-5", "q": {"en": "If things go badly, what would you tell yourself to keep going?",
                         "hi": "अगर सब बुरा हो, तो ख़ुद को क्या कहेंगे?",
                         "te": "అంతా దారుణంగా జరిగితే, మీరేం చెబుతారు?"}},
]

MOOD_LABELS = {
    1: {"en": "Rough", "hi": "बहुत ख़राब", "te": "చాలా కష్టం"},
    2: {"en": "Low", "hi": "कम", "te": "తక్కువ"},
    3: {"en": "Okay", "hi": "ठीक", "te": "ఓకే"},
    4: {"en": "Good", "hi": "अच्छा", "te": "బాగుంది"},
    5: {"en": "Great", "hi": "शानदार", "te": "అద్భుతం"},
}


class JournalContext(BaseModel):
    """The numbers the client already tracks — used to personalise prompts."""

    minutes: int = 0
    trees: int = 0
    escapes: int = 0
    resisted: int = 0
    tasks_done: int = 0
    tasks_open: int = 0
    plan_sessions: int = 0
    plan_done: int = 0
    streak: int = 0
    exam_days: Optional[int] = None
    mood_recent: list[int] = Field(default_factory=list)
    wrote_yesterday: bool = False
    hour: int = 21


def pick_prompts(ctx: JournalContext, lang: str = "en") -> list[dict]:
    """Same rules as the client: the day decides the questions, and it says why."""
    picks: list[tuple[str, str]] = []
    mood_avg = sum(ctx.mood_recent) / len(ctx.mood_recent) if ctx.mood_recent else 0
    low_recent = len([m for m in ctx.mood_recent[:2] if m <= 2]) >= 2

    picks.append(("open-1" if ctx.hour >= 20 else "open-2", "how the day went"))

    if ctx.tasks_done >= 2:
        picks.append(("feel-2", "several tasks finished today"))
    elif ctx.minutes >= 40:
        picks.append(("study-1", f"{ctx.minutes} minutes focused today"))
    elif ctx.minutes > 0:
        picks.append(("study-2", "short session — pick the next small step"))
    else:
        picks.append(("reset-2", "no study logged yet — restart small"))

    if low_recent:
        picks.append(("feel-1", "recent moods were low"))
    elif ctx.streak >= 3:
        picks.append(("feel-2", f"{ctx.streak}-day streak"))
    elif not ctx.wrote_yesterday:
        picks.append(("feel-3", "a fresh start"))

    if ctx.exam_days is not None and 0 < ctx.exam_days <= 14:
        picks.append(("exam-1", f"{ctx.exam_days} days to the exam"))
    elif ctx.exam_days is not None and ctx.exam_days <= 3:
        picks.append(("exam-2", "exam is very close"))

    if ctx.escapes >= 2:
        picks.append(("focus-2", f"{ctx.escapes} escapes today"))
    if ctx.resisted >= 1:
        picks.append(("focus-3", f"{ctx.resisted} urge(s) resisted"))

    if ctx.tasks_open > 0 or ctx.plan_sessions > ctx.plan_done:
        picks.append(("plan-1", "work waiting tomorrow"))
    else:
        picks.append(("plan-3", "protect something steadying"))

    if ctx.hour >= 20 or mood_avg >= 4:
        picks.append(("thanks-1", "evening"))

    seen: set[str] = set()
    out = []
    for pid, why in picks:
        if pid in seen or pid not in ALL_PROMPTS:
            continue
        seen.add(pid)
        prompt = ALL_PROMPTS[pid]
        out.append({"id": pid, "group": prompt["group"], "q": prompt["q"][lang], "why": why})
        if len(out) == 5:
            break
    return out


# ---------------------------------------------------------------------------
# models
# ---------------------------------------------------------------------------
class PromptRequest(BaseModel):
    lang: Literal["en", "hi", "te"] = "en"
    context: JournalContext = Field(default_factory=JournalContext)


class LetterRequest(BaseModel):
    id: Optional[str] = None
    user_id: str = "local"
    text: str
    promise: str = ""
    mood: Optional[int] = Field(None, ge=1, le=5)
    unlock_preset: str = "1m"
    unlock_at: Optional[date] = None      # explicit date wins over the preset
    prompt_id: Optional[str] = None


class LetterReply(BaseModel):
    user_id: str = "local"
    text: str


class JournalEntry(BaseModel):
    id: Optional[str] = None
    user_id: str = "local"
    day: date
    mood: Optional[int] = Field(None, ge=1, le=5)
    energy: Optional[int] = Field(None, ge=1, le=4)
    subject: Optional[str] = None
    text: str = ""
    win: Optional[str] = None
    struggle: Optional[str] = None
    gratitude: Optional[str] = None
    tomorrow: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    pinned: bool = False


class ReviewRequest(BaseModel):
    name: str = "friend"
    lang: Literal["en", "hi", "te"] = "en"
    entries: list[JournalEntry] = Field(default_factory=list)
    context: JournalContext = Field(default_factory=JournalContext)


_STORE: dict[str, dict] = {}
_LETTERS: dict[str, dict] = {}     # sealed letters to your future self
_LETTER_OPENS: list[str] = []      # audit: which letters were opened


def unlock_date(preset: str = "1m", days: Optional[int] = None, now: Optional[date] = None) -> str:
    base = now or datetime.now(timezone.utc).date()
    span = days if days is not None else UNLOCK_PRESETS.get(preset, 30)
    return (base + timedelta(days=span)).isoformat()


def letter_status(letter: dict, now: Optional[date] = None) -> str:
    """sealed → ready → opened → replied (server-side mirror of the client rule)."""
    if letter.get("status") in ("opened", "replied"):
        return letter["status"]
    today = (now or datetime.now(timezone.utc).date()).isoformat()
    return "ready" if letter["unlock_at"] <= today else "sealed"


def _words(text: str) -> int:
    return len([w for w in (text or "").split() if w])


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------
@router.get("/status")
def status() -> dict:
    return {
        "module": "journal",
        "features": ["personalised-prompts", "weekly-review", "mood-trend", "storage-optional"],
        "prompt_groups": list(PROMPT_GROUPS),
        "prompts": len(ALL_PROMPTS),
        "moods": MOOD_LABELS,
        "privacy": "entries are personal writing; storage is optional and per-user (RLS)",
    }


@router.get("/prompts")
def prompts(lang: str = "en", bank: bool = False, minutes: int = 0,
            escapes: int = 0, resisted: int = 0, tasks_done: int = 0, streak: int = 0,
            exam_days: Optional[int] = None, hour: int = 21) -> dict:
    """
    The whole prompt bank (`?bank=true`) or a personalised selection for the day.
    Passing any number (even zero) gives the personalised path, which is what the
    client uses on every app open.
    """
    lang = lang if lang in ("en", "hi", "te") else "en"
    if bank:
        return {"groups": PROMPT_GROUPS, "lang": lang,
                "bank": [{"id": p["id"], "q": p["q"][lang], "group": p["group"]} for p in ALL_PROMPTS.values()]}
    ctx = JournalContext(minutes=minutes, escapes=escapes, resisted=resisted, tasks_done=tasks_done,
                         streak=streak, exam_days=exam_days, hour=hour)
    return {"prompts": pick_prompts(ctx, lang), "lang": lang}


@router.post("/prompts")
def prompts_personalised(req: PromptRequest) -> dict:
    return {"prompts": pick_prompts(req.context, req.lang), "lang": req.lang}


@router.post("/entries", status_code=201)
def save_entry(entry: JournalEntry) -> dict:
    """Store an entry (one per day per user — re-posting merges into the day)."""
    payload = entry.model_dump()
    payload["day"] = entry.day.isoformat()
    payload["words"] = _words(entry.text)
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    key = f"{entry.user_id}:{payload['day']}"
    existing = _STORE.get(key)
    if existing:
        payload["id"] = existing["id"]
        payload["created_at"] = existing.get("created_at")
    else:
        payload["id"] = entry.id or f"jr_{abs(hash(key)) % 10**10:010d}"
        payload["created_at"] = payload["updated_at"]
    _STORE[key] = payload
    return {"entry": payload, "merged": bool(existing), "stored": len(_STORE)}


@router.get("/entries")
def list_entries(user_id: str = "local", limit: int = Query(60, ge=1, le=365),
                 mood_max: Optional[int] = None, q: Optional[str] = None) -> dict:
    items = [e for e in _STORE.values() if e["user_id"] == user_id]
    if mood_max is not None:
        items = [e for e in items if (e.get("mood") or 0) and e["mood"] <= mood_max]
    if q:
        needle = q.lower()
        items = [e for e in items if needle in " ".join(
            str(e.get(f) or "") for f in ("text", "win", "struggle", "gratitude", "tomorrow", "subject")).lower()]
    items.sort(key=lambda e: e["day"], reverse=True)
    return {"count": len(items), "entries": items[:limit]}


@router.get("/mood-trend")
def mood_trend(user_id: str = "local", days: int = Query(30, ge=7, le=365)) -> dict:
    """Daily moods + a direction, for a chart or a coach view."""
    items = [e for e in _STORE.values() if e["user_id"] == user_id and e.get("mood")]
    items.sort(key=lambda e: e["day"])
    points = [{"day": e["day"], "mood": e["mood"]} for e in items[-days:]]
    if len(points) >= 4:
        half = len(points) // 2
        first = sum(p["mood"] for p in points[:half]) / half
        second = sum(p["mood"] for p in points[-half:]) / half
        delta = round(second - first, 2)
    else:
        delta = 0.0
    avg = round(sum(p["mood"] for p in points) / len(points), 2) if points else 0
    return {
        "points": points,
        "count": len(points),
        "average": avg,
        "delta": delta,
        "direction": "up" if delta > 0.3 else "down" if delta < -0.3 else "flat",
    }


@router.post("/weekly-review")
def weekly_review(req: ReviewRequest) -> dict:
    """Deterministic weekly review (EN/HI/TE) from the entries the client sends."""
    entries = req.entries
    moods = [e.mood for e in entries if e.mood]
    words = sum(_words(e.text) for e in entries)
    tags: dict[str, int] = {}
    for e in entries:
        for t in e.tags:
            tags[t] = tags.get(t, 0) + 1
    top_tags = sorted(tags.items(), key=lambda kv: -kv[1])[:3]
    wins = [e.win for e in entries if e.win][:3]
    struggles = [e.struggle for e in entries if e.struggle][:3]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else 0
    ctx = req.context

    hours, minutes = divmod(ctx.minutes, 60)
    pretty = f"{hours}h {minutes}m" if hours else f"{minutes}m"

    if req.lang == "hi":
        lines = [
            f"नमस्ते {req.name}! आपके हफ़्ते की झलक:",
            f"📔 प्रविष्टियाँ: {len(entries)} दिन · 📝 शब्द: {words}",
            f"🙂 औसत मूड: {avg_mood}/5",
            f"⏳ फोकस: {pretty} · 🌳 पेड़: {ctx.trees}",
        ]
        if top_tags:
            lines.append("🏷️ " + " ".join(f"#{t}" for t, _ in top_tags))
        if wins:
            lines.append("🏆 जीत: " + " · ".join(wins))
        if struggles:
            lines.append("🪨 कठिन: " + " · ".join(struggles))
        closing = "अगले हफ़्ते भी रोज़ एक लाइन — बस इतना काफ़ी है।"
    elif req.lang == "te":
        lines = [
            f"నమస్కారం {req.name}! మీ వారం ఝలక్:",
            f"📔 ఎంట్రీలు: {len(entries)} రోజులు · 📝 పదాలు: {words}",
            f"🙂 సగటు మూడ్: {avg_mood}/5",
            f"⏳ ఫోకస్: {pretty} · 🌳 చెట్లు: {ctx.trees}",
        ]
        if top_tags:
            lines.append("🏷️ " + " ".join(f"#{t}" for t, _ in top_tags))
        if wins:
            lines.append("🏆 గెలుపులు: " + " · ".join(wins))
        if struggles:
            lines.append("🪨 కష్టాలు: " + " · ".join(struggles))
        closing = "వచ్చే వారం రోజుకు ఒక లైన్ చాలు."
    else:
        lines = [
            f"Hi {req.name}! Your week in review:",
            f"📔 Entries: {len(entries)} day(s) · 📝 Words: {words}",
            f"🙂 Average mood: {avg_mood}/5",
            f"⏳ Focus: {pretty} · 🌳 Trees: {ctx.trees}",
        ]
        if top_tags:
            lines.append("🏷️ " + " ".join(f"#{t}" for t, _ in top_tags))
        if wins:
            lines.append("🏆 Wins: " + " · ".join(wins))
        if struggles:
            lines.append("🪨 Hard bits: " + " · ".join(struggles))
        closing = "One line a day next week is enough — that is the whole trick."

    score = 0
    if entries:
        score += min(40, len(entries) * 6)
        score += min(30, words // 20)
        score += 15 if avg_mood >= 4 else 8 if avg_mood >= 3 else 0
        score += 15 if ctx.resisted else 0

    return {
        "review": "\n".join(lines + ["", closing]),
        "stats": {
            "entries": len(entries),
            "words": words,
            "average_mood": avg_mood,
            "top_tags": [t for t, _ in top_tags],
            "focus_minutes": ctx.minutes,
            "trees": ctx.trees,
            "journal_score": min(100, score),
        },
        "generated_at": datetime.now(timezone.utc),
    }


@router.get("/on-this-day")
def on_this_day(user_id: str = "local", day: Optional[date] = None) -> dict:
    """Entries from the same calendar day in earlier years."""
    target = day or datetime.now(timezone.utc).date()
    mmdd = target.strftime("%m-%d")
    hits = [e for e in _STORE.values()
            if e["user_id"] == user_id and e["day"].endswith(mmdd) and e["day"] != target.isoformat()]
    hits.sort(key=lambda e: e["day"], reverse=True)
    return {"day": target.isoformat(), "memories": hits, "count": len(hits)}


# ---------------------------------------------------------------------------
# 💌 letters to your future self
# ---------------------------------------------------------------------------
@router.get("/letters/prompts")
def letter_prompts(lang: str = "en") -> dict:
    lang = lang if lang in ("en", "hi", "te") else "en"
    return {
        "prompts": [{"id": p["id"], "q": p["q"][lang]} for p in LETTER_PROMPTS],
        "presets": [{"id": k, "days": v} for k, v in UNLOCK_PRESETS.items()],
        "lang": lang,
    }


@router.post("/letters", status_code=201)
def seal_letter(req: LetterRequest) -> dict:
    """Seal a letter. The server never returns its text until the unlock day."""
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="A letter needs some words in it.")
    unlock_at = req.unlock_at.isoformat() if req.unlock_at else unlock_date(req.unlock_preset)
    letter = {
        "id": req.id or f"lt_{abs(hash(text[:12] + unlock_at)) % 10**10:010d}",
        "user_id": req.user_id,
        "text": text,
        "promise": req.promise,
        "mood": req.mood,
        "prompt_id": req.prompt_id,
        "words": _words(text),
        "written_at": datetime.now(timezone.utc).isoformat(),
        "unlock_at": unlock_at,
        "status": "sealed",
        "opened_at": None,
        "replied_at": None,
    }
    _LETTERS[letter["id"]] = letter
    return {"letter": {k: v for k, v in letter.items() if k != "text"}, "unlock_at": unlock_at, "sealed": True}


@router.get("/letters")
def list_letters(user_id: str = "local", reveal: bool = False) -> dict:
    """Lists letters; the text is redacted unless it is unlocked AND reveal=true."""
    items = [l for l in _LETTERS.values() if l["user_id"] == user_id]
    out = []
    for letter in sorted(items, key=lambda x: x["unlock_at"]):
        status = letter_status(letter)
        if letter["status"] == "sealed":
            letter["status"] = status
        public = {k: v for k, v in letter.items() if k != "text"}
        public["status"] = status
        if status == "sealed" or not reveal:
            public["text"] = None
            public["locked"] = status == "sealed"
        else:
            public["text"] = letter["text"]
            public["locked"] = False
        out.append(public)
    return {
        "count": len(out),
        "sealed": len([l for l in out if l["status"] == "sealed"]),
        "ready": len([l for l in out if l["status"] == "ready"]),
        "opened": len([l for l in out if l["status"] in ("opened", "replied")]),
        "letters": out,
    }


@router.get("/letters/{letter_id}")
def read_letter(letter_id: str, user_id: str = "local") -> dict:
    letter = _LETTERS.get(letter_id)
    if not letter or letter["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Letter not found")
    status = letter_status(letter)
    if status == "sealed":
        raise HTTPException(status_code=403, detail=f"Still sealed until {letter['unlock_at']}")
    if status == "ready":
        letter["status"] = "opened"
        letter["opened_at"] = datetime.now(timezone.utc).isoformat()
        _LETTER_OPENS.append(letter_id)
    return {"letter": letter, "status": letter["status"]}


@router.post("/letters/{letter_id}/reply", status_code=201)
def reply_to_letter(letter_id: str, body: LetterReply) -> dict:
    """Answer your past self — stored as a normal journal entry for today."""
    letter = _LETTERS.get(letter_id)
    if not letter or letter["user_id"] != body.user_id:
        raise HTTPException(status_code=404, detail="Letter not found")
    if letter_status(letter) == "sealed":
        raise HTTPException(status_code=403, detail="You cannot reply to a sealed letter.")
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Write something first.")
    entry = {
        "id": f"je_{abs(hash(text[:12])) % 10**10:010d}",
        "user_id": body.user_id,
        "day": datetime.now(timezone.utc).date().isoformat(),
        "mood": letter.get("mood"),
        "text": f"Replying to my letter from {letter['written_at'][:10]}: {text}",
        "tags": ["letter"],
        "words": _words(text),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "replied_to_letter": letter_id,
    }
    _STORE[f"{body.user_id}:{entry['day']}"] = {**entry, "updated_at": entry["created_at"]}
    letter["status"] = "replied"
    letter["replied_at"] = entry["created_at"]
    return {"entry": entry, "letter_status": letter["status"]}


@router.delete("/letters/{letter_id}")
def delete_letter(letter_id: str, user_id: str = "local") -> dict:
    letter = _LETTERS.get(letter_id)
    if not letter or letter["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Letter not found")
    _LETTERS.pop(letter_id)
    return {"deleted": letter_id}


@router.get("/streak")
def streak(user_id: str = "local") -> dict:
    days = sorted({e["day"] for e in _STORE.values() if e["user_id"] == user_id}, reverse=True)
    if not days:
        return {"streak": 0, "longest": 0, "days_written": 0}

    def as_date(s: str) -> date:
        return date.fromisoformat(s)

    today = datetime.now(timezone.utc).date()
    cursor = today if days[0] == today.isoformat() else today - timedelta(days=1)
    current = 0
    for d in days:
        if as_date(d) == cursor:
            current += 1
            cursor -= timedelta(days=1)
        elif as_date(d) < cursor:
            break
    longest = run = 0
    prev: Optional[date] = None
    for d in sorted(days):
        current_day = as_date(d)
        run = run + 1 if prev and (current_day - prev).days == 1 else 1
        longest = max(longest, run)
        prev = current_day
    return {"streak": current, "longest": longest, "days_written": len(days), "last_entry": days[0]}
