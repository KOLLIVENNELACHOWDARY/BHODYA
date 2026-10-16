"""
Study-plan generator (server side).

The exact same arithmetic runs in the browser
(frontend/src/features/study-schedule/logic.js) so the app works offline and
plans appear instantly. This router exists so the *team* can:

  * generate/validate a plan on the server (emails, cron digests, parent view)
  * reuse it from other features without duplicating the algorithm
  * store the plan in Supabase (`study_plan_sessions`, migration 0002)

No LLM is involved — spreading study minutes across days is arithmetic, which
means it is instant, deterministic and testable. `llm_router` is only used for
the optional natural-language explanation.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()

SESSION_TYPES = {
    "study": {"emoji": "📘", "label": {"en": "Study", "hi": "अध्ययन", "te": "చదువు"}},
    "revision": {"emoji": "🔁", "label": {"en": "Revision", "hi": "रिवीज़न", "te": "రివిజన్"}},
    "practice": {"emoji": "🧩", "label": {"en": "Practice", "hi": "अभ्यास", "te": "ప్రాక్టీస్"}},
    "test": {"emoji": "📝", "label": {"en": "Mock test", "hi": "मॉक टेस्ट", "te": "మాక్ టెస్ట్"}},
}

DIFFICULTY_FACTOR = {1: 1.0, 2: 1.25, 3: 1.55}

TEMPLATES = [
    {"id": "exam7", "emoji": "🚨", "days": 7, "daily_minutes": 120,
     "title": {"en": "Exam in 7 days", "hi": "7 दिन में परीक्षा", "te": "7 రోజుల్లో పరీక్ష"}},
    {"id": "daily1", "emoji": "🌤️", "days": 14, "daily_minutes": 60,
     "title": {"en": "1 hour daily habit", "hi": "रोज़ 1 घंटा", "te": "రోజుకు 1 గంట"}},
    {"id": "weekend", "emoji": "🚀", "days": 14, "daily_minutes": 180, "study_days": [0, 6],
     "title": {"en": "Weekend deep work", "hi": "सप्ताहांत गहन अभ्यास", "te": "వారాంత డీప్ వర్క్"}},
    {"id": "revision", "emoji": "🔁", "days": 5, "daily_minutes": 45,
     "title": {"en": "Revision sprint", "hi": "रिवीज़न स्प्रिंट", "te": "రివిజన్ స్ప్రింట్"}},
]


class Subject(BaseModel):
    id: str = "s1"
    name: str
    priority: int = Field(2, ge=1, le=3)
    difficulty: int = Field(2, ge=1, le=3)
    target_hours: float = Field(5, ge=0, le=200)
    topics: list[str] = Field(default_factory=list)


class PlanRequest(BaseModel):
    subjects: list[Subject]
    exam_date: Optional[date] = None
    days: int = Field(7, ge=1, le=42)
    daily_minutes: int = Field(120, ge=15, le=900)
    study_days: list[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])  # 0=Mon … 6=Sun
    session_minutes: int = Field(30, ge=15, le=120)
    spaced_repetition: bool = True
    start_time: str = "17:00"
    lang: Literal["en", "hi", "te"] = "en"


def _subject_weight(subject: Subject) -> float:
    return DIFFICULTY_FACTOR.get(subject.difficulty, 1.0) * (0.8 + subject.priority * 0.3)


def _mins_to_hhmm(total: int) -> str:
    total = max(0, total) % 1440
    return f"{total // 60:02d}:{total % 60:02d}"


def generate_plan(req: PlanRequest) -> dict:
    """Deterministic timetable generator (mirror of the frontend logic)."""
    usable = [s for s in req.subjects if s.target_hours > 0]
    if not usable:
        return {"sessions": [], "meta": {"reason": "no-subjects"}}

    today = datetime.utcnow().date()
    horizon = req.days
    if req.exam_date:
        horizon = max(0, min((req.exam_date - today).days, 42))
    if horizon <= 0:
        return {"sessions": [], "meta": {"reason": "exam-today"}}

    # 0 = Mon … 6 = Sun (date.weekday()) — the client uses 0 = Sun, so normalise
    wanted = {(d - 1) % 7 for d in req.study_days} if req.study_days else set(range(7))
    day_list: list[date] = []
    for offset in range(horizon):
        day = today + timedelta(days=offset)
        if day.weekday() in wanted:
            day_list.append(day)
    if not day_list:
        return {"sessions": [], "meta": {"reason": "no-days"}}

    per_day = max(15, req.daily_minutes)
    chunk = max(15, req.session_minutes)
    capacity = len(day_list) * per_day
    wanted_total = sum(s.target_hours * 60 for s in usable)

    # ---- book the "extras" first (daily recall + spaced repetition) ----
    last_day_candidate = day_list[-1]
    spaced_days: list[date] = []
    if req.spaced_repetition:
        for offset in (3, 7):
            day = today + timedelta(days=offset)
            if day > last_day_candidate:
                continue
            if req.exam_date and day >= req.exam_date:
                continue
            if day.weekday() not in wanted:
                continue
            if day in spaced_days:
                continue
            spaced_days.append(day)

    recall_per_day = 10 if (len(usable) > 1 and per_day >= 60) else 0
    extras: dict[date, int] = {}
    if recall_per_day:
        for day in day_list:
            extras[day] = extras.get(day, 0) + recall_per_day
    for day in spaced_days:
        extras[day] = extras.get(day, 0) + 20

    day_capacity = [max(15, per_day - extras.get(day, 0)) for day in day_list]
    bookable = sum(day_capacity)
    crowded = wanted_total > bookable

    weights = [(s, _subject_weight(s)) for s in usable]
    w_sum = sum(w for _, w in weights) or 1.0
    budgets = [
        {
            "subject": s,
            "minutes": round(min(s.target_hours * 60, (w / w_sum) * bookable)),
            "weight": w,
        }
        for s, w in weights
    ]

    # ---- fill the days in order, never exceeding a day's capacity ----
    queues = [{"subject": b["subject"], "weight": b["weight"], "left": b["minutes"]} for b in budgets]
    per_day_units: list[list[dict]] = [[] for _ in day_list]
    placed = 0
    for di, _day in enumerate(day_list):
        day_left = day_capacity[di]
        ordered = sorted(queues, key=lambda q: -(q["left"] * q["weight"]))
        shift = di % len(ordered) if ordered else 0
        rotated = ordered[shift:] + ordered[:shift]
        for q in rotated:
            if day_left < 15:
                break
            if q["left"] < 15:
                continue
            take = min(chunk, q["left"], day_left)
            if q["left"] - take > 0 and q["left"] - take < 15:
                take = q["left"]                     # keep remainders usable
            per_day_units[di].append({"subject": q["subject"], "weight": q["weight"], "minutes": take})
            q["left"] -= take
            day_left -= take
            placed += take
    if not placed:
        return {"sessions": [], "meta": {"reason": "too-little-time"}}

    hour, minute = (int(x) for x in req.start_time.split(":")[:2])
    start_min = hour * 60 + minute
    gap = 10
    sessions: list[dict] = []
    topic_cursor: dict[str, int] = {}

    def busiest() -> Subject:
        counts: dict[str, int] = {}
        for s in sessions:
            counts[s["subject_id"]] = counts.get(s["subject_id"], 0) + s["minutes"]
        if not counts:
            return usable[0]
        top = max(counts.items(), key=lambda kv: kv[1])[0]
        return next((x for x in usable if x.id == top), usable[0])

    for day_index, day in enumerate(day_list):
        cursor = start_min
        for i, unit in enumerate(sorted(per_day_units[day_index], key=lambda u: -u["weight"])):
            subject = unit["subject"]
            index = topic_cursor.get(subject.id, 0)
            topic = subject.topics[index % len(subject.topics)] if subject.topics else None
            topic_cursor[subject.id] = index + 1
            sessions.append({
                "id": f"ss_{day.isoformat()}_{day_index}_{i}",
                "subject_id": subject.id,
                "subject_name": subject.name,
                "day": day.isoformat(),
                "start_time": _mins_to_hhmm(cursor),
                "minutes": unit["minutes"],
                "topic": topic,
                "type": "study",
                "done": False,
                "source": "plan",
            })
            cursor += unit["minutes"] + gap

        if recall_per_day:
            sessions.append({
                "id": f"ss_{day.isoformat()}_recall",
                "subject_id": usable[0].id,
                "subject_name": usable[0].name,
                "day": day.isoformat(),
                "start_time": _mins_to_hhmm(cursor),
                "minutes": recall_per_day,
                "topic": None,
                "type": "revision",
                "done": False,
                "source": "plan",
            })
            cursor += recall_per_day + gap

        if day in spaced_days:
            subject = busiest()
            sessions.append({
                "id": f"ss_{day.isoformat()}_spaced",
                "subject_id": subject.id,
                "subject_name": subject.name,
                "day": day.isoformat(),
                "start_time": _mins_to_hhmm(cursor),
                "minutes": 20,
                "topic": None,
                "type": "revision",
                "done": False,
                "source": "spaced",
            })

    sessions.sort(key=lambda s: (s["day"], s["start_time"]))

    total_planned = sum(s["minutes"] for s in sessions)
    per_subject = [
        {
            "subject_id": b["subject"].id,
            "name": b["subject"].name,
            "planned": sum(s["minutes"] for s in sessions if s["subject_id"] == b["subject"].id),
            "wanted": b["minutes"],
        }
        for b in budgets
    ]

    return {
        "sessions": sessions,
        "meta": {
            "reason": "ok",
            "horizon": horizon,
            "days": len(day_list),
            "total_planned": total_planned,
            "total_wanted": wanted_total,
            "capacity": capacity,
            "bookable": bookable,
            "coverage": round(total_planned / capacity * 100) if capacity else 0,
            "scaled": crowded,
            "per_subject": per_subject,
            "sessions_per_day": max(1, round(per_day / chunk)),
            "exam_date": req.exam_date.isoformat() if req.exam_date else None,
        },
    }


EXPLAIN = {
    "no-subjects": {
        "en": "Add at least one subject with target hours and I can build the plan.",
        "hi": "कम से कम एक विषय और लक्ष्य घंटे जोड़ें, फिर प्लान बन जाएगा।",
        "te": "కనీసం ఒక సబ్జెక్ట్, లక్ష్య గంటలు జోడిస్తే ప్లాన్ సిద్ధం.",
    },
    "exam-today": {
        "en": "Your exam is today — no plan needed. Good luck! 🍀",
        "hi": "आज ही परीक्षा है — प्लान की ज़रूरत नहीं। शुभकामनाएँ! 🍀",
        "te": "ఈరోజే పరీక్ష — ప్లాన్ అవసరం లేదు. ఆల్ ది బెస్ట్! 🍀",
    },
    "no-days": {
        "en": "No free days were selected — pick at least one study day.",
        "hi": "कोई खाली दिन नहीं चुना गया — कम से कम एक दिन चुनिए।",
        "te": "ఖాళీ రోజులు ఏవీ లేవు — కనీసం ఒక రోజు ఎంచుకోండి.",
    },
    "too-little-time": {
        "en": "There is not enough time in those days for even one session.",
        "hi": "उन दिनों में एक सत्र के लिए भी समय नहीं है।",
        "te": "ఆ రోజుల్లో ఒక సెషన్‌కు కూడా సమయం లేదు.",
    },
}


def explain(meta: dict, lang: str = "en") -> str:
    reason = meta.get("reason")
    if reason in EXPLAIN:
        return EXPLAIN[reason].get(lang, EXPLAIN[reason]["en"])
    hours, minutes = divmod(meta["total_planned"], 60)
    return {
        "en": f"I spread {hours}h {minutes}m across {meta['days']} study days "
              f"(~{meta['sessions_per_day']} sessions a day, 10-minute breaks built in)"
              f"{' — trimmed so it fits your week' if meta.get('scaled') else ''}. "
              "Harder subjects get the freshest slots and come back for revision on day +3 and +7.",
        "hi": f"मैंने {hours}घं {minutes}मि को {meta['days']} दिनों में बाँटा (रोज़ ~{meta['sessions_per_day']} सत्र, "
              f"10 मिनट के ब्रेक सहित){' — हफ़्ते में फिट करने के लिए छोटा किया' if meta.get('scaled') else ''}। "
              "कठिन विषयों को सबसे ताज़ा समय मिला और दिन +3 व +7 पर रिवीज़न आता है।",
        "te": f"{hours}గం {minutes}ని {meta['days']} రోజుల్లో పంచాను (రోజుకు ~{meta['sessions_per_day']} సెషన్లు, "
              f"10 నిమి విరామాలతో){' — వారంలో సరిపోయేలా కుదించాను' if meta.get('scaled') else ''}. "
              "కష్టమైన సబ్జెక్ట్‌లకు మంచి స్లాట్‌లు, +3/+7 రోజులకు రివిజన్.",
    }.get(lang, "")


def _plan_stats(sessions: list[dict]) -> dict:
    total = sum(s["minutes"] for s in sessions)
    done = sum(s["minutes"] for s in sessions if s.get("done"))
    by_day: dict[str, int] = {}
    for s in sessions:
        by_day[s["day"]] = by_day.get(s["day"], 0) + s["minutes"]
    return {
        "total_minutes": total,
        "done_minutes": done,
        "percent": round(done / total * 100) if total else 0,
        "sessions": len(sessions),
        "busiest_day": max(by_day.items(), key=lambda kv: kv[1])[0] if by_day else None,
        "minutes_per_day": by_day,
    }


@router.get("/status")
def status() -> dict:
    return {
        "module": "study-plan",
        "generator": "deterministic (no LLM, mirrors frontend/src/features/study-schedule/logic.js)",
        "templates": [t["id"] for t in TEMPLATES],
        "session_types": list(SESSION_TYPES),
        "features": ["exam countdown", "weighted subjects", "spaced repetition", "capacity safety"],
    }


@router.get("/templates")
def templates() -> dict:
    return {"templates": TEMPLATES, "session_types": SESSION_TYPES}


@router.post("/generate")
def generate(req: PlanRequest) -> dict:
    result = generate_plan(req)
    return {
        **result,
        "explanation": explain(result["meta"], req.lang),
        "stats": _plan_stats(result["sessions"]),
    }


@router.post("/stats")
def stats(req: PlanRequest) -> dict:
    result = generate_plan(req)
    return {"stats": _plan_stats(result["sessions"]), "meta": result["meta"]}


@router.post("/reminders")
def plan_reminders(req: PlanRequest) -> dict:
    """The reminders each session should create (consumed by /api/notifications/plan-reminders)."""
    result = generate_plan(req)
    return {
        "reminders": [
            {
                "title": f"📘 {s['subject_name']} session",
                "body": f"{s['start_time']} · {s['minutes']} min",
                "day": s["day"],
                "time_of_day": s["start_time"],
                "kind": "plan",
                "linked_feature": "focus",
                "linked_id": s["id"],
            }
            for s in result["sessions"]
        ][:60],
        "meta": result["meta"],
    }
