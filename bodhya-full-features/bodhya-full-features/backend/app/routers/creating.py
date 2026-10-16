"""
Server-side mirrors of three offline features:

  1. recurring study sessions   ("every Mon & Wed until the exam")
  2. validated session moves    (drag-to-move, same rules as the grid)
  3. chapter → tasks            (paste a chapter, get a task list)

The identical arithmetic runs in the browser
(`frontend/src/features/study-schedule/logic.js` and
`frontend/src/features/todo-list/logic.js`) so the app works offline and
instantly. This router exists so the *team* can:

  * expand a repeat rule in a cron/digest job or an email reminder
  * validate a move before writing it to Supabase
  * generate tasks from a chapter server-side (parent view, teacher export)

No LLM is involved: the heuristics are deterministic, which is exactly why
they are testable. Nothing here reads the student's private content.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

WEEKDAY_SHORT = {
    "en": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "hi": ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    "te": ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
}


# ----------------------------------------------------------------------
# 1 + 2) recurrence rules and moves
# ----------------------------------------------------------------------
class Recurrence(BaseModel):
    days: list[int] = Field(default_factory=list, description="0=Sun … 6=Sat")
    until: Optional[date] = None
    every_weeks: int = Field(1, ge=1, le=4)


class OccurrencesRequest(BaseModel):
    days: list[int] = Field(default_factory=list)
    until: Optional[date] = None
    every_weeks: int = Field(1, ge=1, le=4)
    start_day: date                                  # the session's own day (the rule anchor)
    horizon_days: int = Field(21, ge=1, le=120)
    from_day: Optional[date] = None                  # defaults to today


class Session(BaseModel):
    id: str
    subject_name: str = "Study"
    day: date
    start_time: str = "17:00"
    minutes: int = Field(30, ge=1, le=600)
    done: bool = False
    series_id: Optional[str] = None


class MoveRequest(BaseModel):
    session: Session
    day: Optional[date] = None
    start_time: Optional[str] = None
    sessions: list[Session] = Field(default_factory=list, description="the rest of the timetable (for clash checks)")


def _normalise_days(days: list[int]) -> list[int]:
    return sorted({int(d) for d in days if isinstance(d, int) and 0 <= d <= 6})


def occurrences(req: OccurrencesRequest) -> list[str]:
    """Day keys implied by a rule — mirrors `recurrenceDays()` in the frontend."""
    days = _normalise_days(req.days)
    if not days:
        return []
    start = req.start_day
    today = req.from_day or date.today()
    out: list[str] = []
    for i in range(req.horizon_days):
        d = today + timedelta(days=i)
        key = d.isoformat()
        if key <= today.isoformat() and key != today.isoformat():
            continue
        if req.until and d > req.until:
            break
        if (d.weekday() + 1) % 7 not in days:   # JS getDay() convention: 0 = Sunday
            continue
        weeks = (d - start).days // 7
        if req.every_weeks > 1 and weeks % req.every_weeks != 0:
            continue
        out.append(key)
    return out


def validate_move(req: MoveRequest) -> dict:
    """Same verdicts the grid UI shows: same / done / clash / ok."""
    day = (req.day or req.session.day).isoformat()
    start = req.start_time or req.session.start_time
    if day == req.session.day.isoformat() and start == req.session.start_time:
        return {"ok": False, "reason": "same", "conflicts": [], "day": day, "start_time": start}
    if req.session.done:
        return {"ok": False, "reason": "done", "conflicts": [], "day": day, "start_time": start}
    conflicts = [
        s.id for s in req.sessions
        if s.id != req.session.id and s.day.isoformat() == day and s.start_time == start
    ]
    return {
        "ok": True,
        "reason": "clash" if conflicts else None,
        "conflicts": conflicts,
        "day": day,
        "start_time": start,
    }


@router.get("/status")
def status() -> dict:
    return {
        "module": "creating",
        "features": ["recurring sessions", "validated moves", "chapter → tasks"],
        "offline": True,
        "notes": "Pure heuristics — the browser runs the same code, so nothing leaves the device.",
    }


@router.post("/recurrence/occurrences")
def recurrence_occurrences(req: OccurrencesRequest) -> dict:
    keys = occurrences(req)
    return {
        "days": _normalise_days(req.days),
        "until": req.until.isoformat() if req.until else None,
        "every_weeks": req.every_weeks,
        "occurrences": keys,
        "count": len(keys),
        "labels": {
            lang: [WEEKDAY_SHORT[lang][d] for d in _normalise_days(req.days)]
            for lang in WEEKDAY_SHORT
        },
    }


@router.post("/recurrence/describe")
def recurrence_describe(req: Recurrence) -> dict:
    keys = _normalise_days(req.days)
    return {
        "labels": {lang: [WEEKDAY_SHORT[lang][d] for d in keys] for lang in WEEKDAY_SHORT},
        "sentence": {
            "en": "Every " + ", ".join(WEEKDAY_SHORT["en"][d] for d in keys) + (" until " + req.until.isoformat() if req.until else ""),
            "hi": "हर " + ", ".join(WEEKDAY_SHORT["hi"][d] for d in keys) + (" — " + req.until.isoformat() + " तक" if req.until else ""),
            "te": "ప్రతి " + ", ".join(WEEKDAY_SHORT["te"][d] for d in keys) + (" — " + req.until.isoformat() + " వరకు" if req.until else ""),
        } if keys else {"en": "", "hi": "", "te": ""},
        "empty": not keys,
    }


@router.post("/move/validate")
def move_validate(req: MoveRequest) -> dict:
    return validate_move(req)


# ----------------------------------------------------------------------
# 3) chapter → tasks
# ----------------------------------------------------------------------
class ChapterRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=60000)
    subject: str = ""
    lang: str = Field("en", pattern="^(en|hi|te)$")
    max_tasks: int = Field(8, ge=1, le=40)


EXERCISE_RE = re.compile(
    r"\b(?:exercise|exercises|ex\.?|problem set|problems|worksheet|assignment|practice questions?)\s*([\d]+(?:\.[\d]+)*)?",
    re.I,
)
RANGE_RE = re.compile(r"\bq(?:uestion)?s?\.?\s*(\d{1,3})\s*(?:[-–—]|to|through)\s*(?:q\.?\s*)?(\d{1,3})", re.I)
TERM_RE = re.compile(r"^\s*(?:definition|define|theorem|law|principle|rule|lemma|postulate)s?\s*(?:of|:)?\s*(.+)$", re.I)
TERM_COLON_RE = re.compile(r"^\s*([A-Z][\w’'\- ]{2,44})\s*[:\u2013-]\s+\S")
FORMULA_RE = re.compile(r"(=|≈|\bformula\b|\bequation\b|\bderivation\b|\bderive\b)", re.I)
DIAGRAM_RE = re.compile(r"\b(diagram|figure|fig\.|flow ?chart|circuit|graph of|label(?:l?ed)?\s+(?:the\s+)?(?:diagram|figure|parts?))\b", re.I)
DRAW_RE = re.compile(r"^\s*(?:draw|label|sketch|plot|study the|see)\b", re.I)
DATES_RE = re.compile(r"\b(1[0-9]{3}|20[0-9]{2})\b")
SUMMARY_RE = re.compile(r"\b(summary|revision notes?|key points|recap|in short|conclusion)\b", re.I)
NOISE_RE = re.compile(r"^(page|p\.|chapter|unit|contents?|index|see also)\b", re.I)

TASK_COPY = {
    "exercise": {
        "en": "Solve {ex} — {n} problems", "hi": "{ex} हल करें — {n} प्रश्न", "te": "{ex} చేయండి — {n} ప్రశ్నలు",
    },
    "exerciseShort": {"en": "Solve {ex}", "hi": "{ex} हल करें", "te": "{ex} చేయండి"},
    "flashcard": {
        "en": 'Make a flashcard for “{term}”', "hi": '“{term}” का फ़्लैशकार्ड बनाएँ', "te": '“{term}” కి ఫ్లాష్‌కార్డ్ చేయండి',
    },
    "formula": {
        "en": "Memorise the formula: {topic}", "hi": "सूत्र याद करें: {topic}", "te": "సూత్రం గుర్తుపెట్టుకోండి: {topic}",
    },
    "readNotes": {
        "en": "Read and make notes on “{topic}”", "hi": "“{topic}” पढ़ें और नोट्स बनाएँ", "te": "“{topic}” చదివి నోట్స్ రాయండి",
    },
    "diagram": {
        "en": "Draw and label: {topic}", "hi": "चित्र बनाएँ और नाम लिखें: {topic}", "te": "చిత్రం గీసి పేర్లు రాయండి: {topic}",
    },
    "dates": {
        "en": "Memorise the dates: {topic}", "hi": "तारीख़ें याद करें: {topic}", "te": "తేదీలు గుర్తుపెట్టుకోండి: {topic}",
    },
    "summary": {
        "en": "Summarise this chapter in 5 lines", "hi": "इस अध्याय का 5 पंक्तियों में सारांश लिखें",
        "te": "ఈ అధ్యాయాన్ని 5 లైన్లలో సారాంశం చెయ్యండి",
    },
}

WHY_COPY = {
    "exercise": {"en": "Practice beats re-reading", "hi": "अभ्यास, दोबारा पढ़ने से बेहतर है", "te": "మళ్లీ చదవడం కంటే ప్రాక్టీస్ మేలు"},
    "term": {"en": "Naming things exactly is where marks are won", "hi": "नाम सही लिखना ही अंक दिलाता है",
             "te": "పేర్లు కచ్చితంగా రాయడం మార్కులు తెస్తుంది"},
    "formula": {"en": "Formulas are exam favourites — write it from memory",
                "hi": "सूत्र परीक्षा में सबसे ज़्यादा पूछे जाते हैं — याद से लिखें",
                "te": "సూత్రాలు పరీక్షలో ఎక్కువ అడుగుతారు — జ్ఞాపకం నుంచి రాయండి"},
    "heading": {"en": "You pasted this as a topic heading", "hi": "आपने इसे टॉपिक शीर्षक के रूप में पेस्ट किया",
                "te": "దీన్ని మీరు అంశ హెడ్డింగ్‌గా పేస్ట్ చేశారు"},
    "diagram": {"en": "Drawing it once beats reading it three times",
                "hi": "एक बार बनाना, तीन बार पढ़ने से अच्छा है", "te": "ఒకసారి గీయడం మూడుసార్లు చదవడం కంటే మెరుగు"},
    "dates": {"en": "Dates are easy marks if you rehearse them", "hi": "तारीख़ें दोहराने से आसान अंक मिलते हैं",
              "te": "తేదీలు సాధన చేస్తే సులభమైన మార్కులు"},
    "summary": {"en": "Explaining it in your own words is the real test", "hi": "अपने शब्दों में समझाना ही असली परीक्षा है",
                "te": "మీ మాటల్లో వివరించడమే నిజమైన పరీక్ష"},
}


def _clip(text: str, limit: int = 48) -> str:
    s = re.sub(r"\s+", " ", str(text)).strip().rstrip(".;,:")
    if len(s) <= limit:
        return s
    return re.sub(r"\s+\S*$", "", s[:limit]).strip()


def chapter_subject(text: str) -> str:
    for line in str(text).splitlines():
        line = line.strip()
        if len(line) > 2:
            m = re.match(r"^(?:chapter|unit|topic|lesson)\s*[\d.]*\s*[:\u2013-]?\s*(.+)$", line, re.I)
            return _clip(m.group(1) if m else "", 40)
    return ""


def scan_chapter(text: str) -> dict:
    """Structure of a pasted chapter — mirrors `scanChapter()` in the frontend."""
    raw = str(text or "")
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    out = {
        "chars": len(raw),
        "lines": len(lines),
        "subject": chapter_subject(raw),
        "headings": [],
        "terms": [],
        "formulas": [],
        "exercises": [],
        "diagrams": [],
        "dates": [],
        "has_summary": False,
    }
    units = lines if len(lines) >= 3 else [s.strip() for s in re.split(r"(?<=[.!?])\s+", raw) if s.strip()]

    def add(bucket: list, value: str, limit: int) -> None:
        if value and len(value) > 2 and value.lower() not in [x.lower() for x in bucket] and len(bucket) < limit:
            bucket.append(value)

    for line in units:
        if NOISE_RE.match(line):
            continue
        clean = re.sub(r"^[\s•*\-–—\d.)\]]+", "", line).strip()
        if len(clean) < 3:
            continue
        ex = EXERCISE_RE.search(line)
        if ex:
            label = re.sub(r"\s+", " ", ex.group(0)).strip().capitalize()
            rng = RANGE_RE.search(line)
            count = None
            if rng:
                count = min(60, max(1, int(rng.group(2)) - int(rng.group(1)) + 1))
            if not any(e["label"].lower() == label.lower() for e in out["exercises"]):
                out["exercises"].append({"label": label, "count": count})
        term = TERM_RE.match(line) or TERM_COLON_RE.match(line)
        if term and term.group(1):
            add(out["terms"], _clip(term.group(1), 48), 8)
        is_formula = bool(FORMULA_RE.search(line)) and len(clean) < 120
        if is_formula:
            add(out["formulas"], _clip(re.split(r"[=≈]", clean)[0], 48), 6)
        if (DIAGRAM_RE.search(line) or DRAW_RE.match(line)) and not DATES_RE.search(line):
            inner = re.search(r"diagram of (?:the )?(.+)$", clean, re.I)
            label = _clip(inner.group(1) if inner else re.sub(r"^(draw|label|sketch|plot|study the|see)\s+", "", clean, flags=re.I), 48)
            add(out["diagrams"], label, 4)
        if DATES_RE.search(line) and re.search(r"[A-Z][a-z]{3,}", clean):
            add(out["dates"], _clip(re.sub(r"^in\s+\d{3,4}\s+", "", clean, flags=re.I), 60), 4)
        if SUMMARY_RE.search(line):
            out["has_summary"] = True
        looks_heading = (
            len(clean) <= 64
            and not re.search(r"[.!?]$", clean)
            and not ex and not term and not is_formula
            and not SUMMARY_RE.search(clean)
        )
        if looks_heading:
            add(out["headings"], _clip(clean, 56), 8)

    if len(out["headings"]) > 1 and out["subject"]:
        if out["subject"].lower() in out["headings"][0].lower():
            out["headings"].pop(0)
    return out


def chapter_tasks(req: ChapterRequest) -> list[dict]:
    """Chapter text → suggested tasks — mirrors `chapterSuggestions()`."""
    scan = scan_chapter(req.text)
    subject = (req.subject or scan["subject"] or "").strip()
    lang = req.lang
    out: list[dict] = []

    def push(kind: str, text_key: str, vars_: dict, why_key: str, minutes: int, priority: str, category: str, tag: str) -> None:
        if len(out) >= req.max_tasks:
            return
        title = TASK_COPY[text_key][lang].format(**vars_) if text_key in TASK_COPY else vars_.get("topic", "")
        out.append({
            "id": f"ch-{kind}-{re.sub(r'[^a-z0-9]+', '-', tag.lower()).strip('-')}",
            "title": title,
            "why": WHY_COPY[why_key][lang],
            "minutes": minutes,
            "priority": priority,
            "category": category,
            "subject": subject,
            "source": "chapter",
            "kind": kind,
        })

    for ex in scan["exercises"][:2]:
        push("exercise", "exercise" if ex["count"] else "exerciseShort",
             {"ex": ex["label"], "n": ex["count"] or 0}, "exercise",
             45 if (ex["count"] or 0) > 8 else 30, "high", "practice", ex["label"])
    for term in scan["terms"][:3]:
        push("term", "flashcard", {"term": term}, "term", 10, "med", "revision", term)
    for topic in scan["formulas"][:2]:
        push("formula", "formula", {"topic": topic}, "formula", 15, "high", "revision", topic)
    for topic in scan["headings"][:3]:
        push("heading", "readNotes", {"topic": topic}, "heading", 30, "med", "study", topic)
    for topic in scan["diagrams"][:1]:
        push("diagram", "diagram", {"topic": topic}, "diagram", 15, "med", "practice", topic)
    for topic in scan["dates"][:1]:
        push("dates", "dates", {"topic": topic}, "dates", 20, "med", "revision", topic)
    if scan["chars"] > 700 or scan["has_summary"]:
        push("summary", "summary", {}, "summary", 20, "low", "revision", "summary")
    return out


@router.post("/chapter/tasks")
def chapter_to_tasks(req: ChapterRequest) -> dict:
    tasks = chapter_tasks(req)
    scan = scan_chapter(req.text)
    return {
        "tasks": tasks,
        "count": len(tasks),
        "subject": (req.subject or scan["subject"] or "").strip(),
        "scan": {
            "chars": scan["chars"],
            "lines": scan["lines"],
            "topics": len(scan["headings"]),
            "terms": len(scan["terms"]),
            "formulas": len(scan["formulas"]),
            "exercises": len(scan["exercises"]),
            "diagrams": len(scan["diagrams"]),
            "dates": len(scan["dates"]),
            "has_summary": scan["has_summary"],
        },
        "private": True,
        "note": "Heuristic parsing on the server — nothing is stored, nothing is sent to a model.",
    }


@router.post("/chapter/scan")
def chapter_scan(req: ChapterRequest) -> dict:
    return {"scan": scan_chapter(req.text), "private": True}
