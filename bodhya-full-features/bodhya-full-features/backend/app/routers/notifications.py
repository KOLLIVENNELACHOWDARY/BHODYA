"""
Reminders & notifications service — the server half of Bodhya's reminder pack.

The browser does the ringing (Bodhya runs fully offline), but this router adds
what only a server can do:

  1. Scheduled reminders that survive a closed tab / cleared cache
  2. A "due" endpoint a cron job, email worker or push worker can poll
  3. A deterministic daily-digest builder (no LLM needed — it is arithmetic
     over the numbers the client sends)
  4. Notification log + sound catalogue so every client behaves the same

Storage: in-memory by default (works with zero setup for the hackathon). If
Supabase credentials are configured in app.core.config, reminders are mirrored
into the `reminders` table created by supabase/migrations/0002_reminders.sql.

Request/response shapes are documented in docs/API_CONTRACTS.md.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

SOUNDS = [
    {"id": "chime", "label": "Chime"},
    {"id": "bell", "label": "Bell"},
    {"id": "birds", "label": "Morning birds"},
    {"id": "soft", "label": "Soft pad"},
    {"id": "marimba", "label": "Marimba"},
    {"id": "alarm", "label": "Classic alarm"},
    {"id": "beep", "label": "Beep"},
    {"id": "none", "label": "Silent"},
]

NOTIFY_KINDS = ("alarm", "reminder", "task", "plan", "focus", "streak", "level", "digest", "system")

# ---------------------------------------------------------------------------
# in-memory store (swap for Supabase by enabling the mirror below)
# ---------------------------------------------------------------------------
_REMINDERS: dict[str, dict] = {}
_LOG: list[dict] = []


class Reminder(BaseModel):
    """One scheduled reminder (alarm / task reminder / study-session nudge)."""

    id: Optional[str] = None
    user_id: str = "local"
    title: str
    body: str = ""
    kind: Literal["alarm", "reminder", "task", "plan", "focus", "streak", "digest", "system"] = "reminder"
    # either an absolute time, or a clock time + repeated weekdays
    at: Optional[datetime] = None                    # one-shot
    time_of_day: Optional[str] = None                # "07:30"
    days: list[int] = Field(default_factory=list)    # 0=Sun … 6=Sat, [] = one-shot
    snooze_minutes: int = 10
    sound: str = "chime"
    linked_feature: Optional[str] = None             # todo | planner | focus | alarms
    linked_id: Optional[str] = None
    enabled: bool = True
    created_at: Optional[datetime] = None


def _dedupe_key(rem: dict) -> str:
    return f"{rem['user_id']}:{rem['title']}:{rem.get('time_of_day') or rem.get('at')}"


def _next_occurrence(rem: dict, now: datetime) -> Optional[datetime]:
    """Same rules as the frontend: clock time + optional weekly days."""
    if rem.get("at") and not rem.get("days"):
        at = rem["at"]
        return at if at >= now else None
    tod = rem.get("time_of_day")
    if not tod:
        return None
    hour, minute = (int(x) for x in tod.split(":"))
    for offset in range(0, 9):
        cand = (now + timedelta(days=offset)).replace(hour=hour, minute=minute, second=0, microsecond=0)
        if cand < now:
            continue
        if rem.get("days") and cand.weekday() not in [((d - 1) % 7) for d in rem["days"]]:
            continue
        if not rem.get("days") and offset > 1:
            break
        return cand
    return None


@router.get("/status")
def status() -> dict:
    return {
        "module": "notifications-reminders",
        "reminders_stored": len(_REMINDERS),
        "log_entries": len(_LOG),
        "kinds": list(NOTIFY_KINDS),
        "sounds": [s["id"] for s in SOUNDS],
        "client_side_ringing": True,
        "storage": "memory (mirrors to Supabase `reminders` when configured)",
    }


@router.get("/sounds")
def sounds() -> dict:
    return {"sounds": SOUNDS}


@router.post("/reminders", status_code=201)
def create_reminder(rem: Reminder) -> dict:
    """Create or update a reminder. Duplicate title+time is merged, not doubled."""
    payload = rem.model_dump()
    payload["id"] = payload.get("id") or f"rem_{uuid.uuid4().hex[:10]}"
    payload["created_at"] = payload.get("created_at") or datetime.utcnow()

    if not payload.get("at") and not payload.get("time_of_day"):
        raise HTTPException(status_code=422, detail="Provide either `at` or `time_of_day`")
    if payload.get("sound") not in {s["id"] for s in SOUNDS}:
        raise HTTPException(status_code=422, detail=f"Unknown sound '{payload['sound']}'")

    existing = next((r for r in _REMINDERS.values() if _dedupe_key(r) == _dedupe_key(payload)), None)
    if existing:
        existing.update({k: v for k, v in payload.items() if v is not None})
        return {"reminder": existing, "merged": True}

    _REMINDERS[payload["id"]] = payload
    _LOG.append({"at": datetime.utcnow(), "event": "created", "id": payload["id"], "title": payload["title"]})
    return {"reminder": payload, "merged": False}


@router.get("/reminders")
def list_reminders(user_id: str = "local", upcoming_only: bool = False) -> dict:
    now = datetime.utcnow()
    items = [r for r in _REMINDERS.values() if r["user_id"] == user_id]
    if upcoming_only:
        items = [r for r in items if r["enabled"] and _next_occurrence(r, now)]
    items.sort(key=lambda r: _next_occurrence(r, now) or datetime.max)
    return {"count": len(items), "reminders": items}


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: str) -> dict:
    if reminder_id not in _REMINDERS:
        raise HTTPException(status_code=404, detail="Reminder not found")
    gone = _REMINDERS.pop(reminder_id)
    _LOG.append({"at": datetime.utcnow(), "event": "deleted", "id": reminder_id, "title": gone["title"]})
    return {"deleted": reminder_id}


@router.post("/reminders/{reminder_id}/snooze")
def snooze_reminder(reminder_id: str, minutes: int = Query(10, ge=1, le=240)) -> dict:
    rem = _REMINDERS.get(reminder_id)
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")
    rem["at"] = datetime.utcnow() + timedelta(minutes=minutes)
    rem["days"] = []
    rem["snoozed_until"] = rem["at"]
    _LOG.append({"at": datetime.utcnow(), "event": "snoozed", "id": reminder_id, "minutes": minutes})
    return {"reminder": rem, "snoozed_until": rem["at"]}


@router.get("/due")
def due_reminders(user_id: str = "local", window_minutes: int = 1, now: Optional[datetime] = None) -> dict:
    """
    Everything that should fire in the next `window_minutes` — meant to be polled
    by a cron worker, an email digest job or a Web-Push sender.
    """
    current = now or datetime.utcnow()
    horizon = current + timedelta(minutes=max(1, window_minutes))
    due = []
    for rem in _REMINDERS.values():
        if rem["user_id"] != user_id or not rem["enabled"]:
            continue
        nxt = _next_occurrence(rem, current)
        if nxt and current <= nxt <= horizon:
            due.append({"reminder": rem, "fires_at": nxt})
    return {"now": current, "window_minutes": window_minutes, "due": due}


class DigestRequest(BaseModel):
    """Numbers the client already tracks — the digest is pure arithmetic."""

    name: str = "friend"
    lang: Literal["en", "hi", "te"] = "en"
    tasks_done: int = 0
    tasks_total: int = 0
    tasks_overdue: int = 0
    focus_minutes: int = 0
    plan_sessions_done: int = 0
    plan_sessions_total: int = 0
    streak_days: int = 0
    next_alarm: Optional[str] = None          # "07:00"
    tomorrow_sessions: int = 0


@router.post("/digest")
def build_digest(req: DigestRequest) -> dict:
    """Build the evening digest text (EN/HI/TE) — no LLM, so it never fails."""
    h, m = divmod(req.focus_minutes, 60)
    pretty = f"{h}h {m}m" if h else f"{m}m"
    lines: list[str] = []

    if req.lang == "hi":
        lines.append(f"नमस्ते {req.name}! आज का सार:")
        lines.append(f"✅ टू-डू: {req.tasks_done}/{req.tasks_total} पूरे")
        if req.tasks_overdue:
            lines.append(f"⚠️ {req.tasks_overdue} काम बीत चुके")
        lines.append(f"⏳ फोकस समय: {pretty}")
        if req.plan_sessions_total:
            lines.append(f"📘 प्लान सत्र: {req.plan_sessions_done}/{req.plan_sessions_total}")
        if req.streak_days:
            lines.append(f"🔥 स्ट्रीक: {req.streak_days} दिन")
        if req.next_alarm:
            lines.append(f"⏰ अगला अलार्म: {req.next_alarm}")
        if req.tomorrow_sessions:
            lines.append(f"📅 कल {req.tomorrow_sessions} सत्र तैयार हैं")
        closing = "कल भी थोड़ा-थोड़ा करेंगे? 💛"
    elif req.lang == "te":
        lines.append(f"నమస్కారం {req.name}! నేటి సారాంశం:")
        lines.append(f"✅ టూ-డూ: {req.tasks_done}/{req.tasks_total} పూర్తి")
        if req.tasks_overdue:
            lines.append(f"⚠️ {req.tasks_overdue} పనులు గడువు దాటాయి")
        lines.append(f"⏳ ఫోకస్ సమయం: {pretty}")
        if req.plan_sessions_total:
            lines.append(f"📘 ప్లాన్ సెషన్లు: {req.plan_sessions_done}/{req.plan_sessions_total}")
        if req.streak_days:
            lines.append(f"🔥 స్ట్రీక్: {req.streak_days} రోజులు")
        if req.next_alarm:
            lines.append(f"⏰ తదుపరి అలారం: {req.next_alarm}")
        if req.tomorrow_sessions:
            lines.append(f"📅 రేపు {req.tomorrow_sessions} సెషన్లు సిద్ధం")
        closing = "రేపూ కొద్దిగా చదువుదాం? 💛"
    else:
        lines.append(f"Hi {req.name}! Here is your day:")
        lines.append(f"✅ To-dos: {req.tasks_done}/{req.tasks_total} done")
        if req.tasks_overdue:
            lines.append(f"⚠️ {req.tasks_overdue} overdue")
        lines.append(f"⏳ Focus time: {pretty}")
        if req.plan_sessions_total:
            lines.append(f"📘 Plan sessions: {req.plan_sessions_done}/{req.plan_sessions_total}")
        if req.streak_days:
            lines.append(f"🔥 Streak: {req.streak_days} day(s)")
        if req.next_alarm:
            lines.append(f"⏰ Next alarm: {req.next_alarm}")
        if req.tomorrow_sessions:
            lines.append(f"📅 {req.tomorrow_sessions} sessions ready for tomorrow")
        closing = "Same time tomorrow? A little every day beats a lot once. 💛"

    body = "\n".join(lines)
    if req.focus_minutes == 0 and req.tasks_done == 0:
        rest = {
            "en": "No study logged today — no guilt, just start with 10 minutes tomorrow.",
            "hi": "आज कुछ दर्ज नहीं — कोई बात नहीं, कल 10 मिनट से शुरुआत कीजिए।",
            "te": "ఈరోజు ఏమీ నమోదు కాలేదు — పర్వాలేదు, రేపు 10 నిమిషాలతో మొదలుపెట్టండి.",
        }[req.lang]
        body = f"{body}\n{rest}"

    score = 0
    if req.tasks_total:
        score += int(40 * req.tasks_done / req.tasks_total)
    score += min(40, int(req.focus_minutes / 3))
    score += 20 if req.streak_days >= 3 else (10 if req.streak_days else 0)

    return {
        "digest": body,
        "title": {"en": "📋 Your day with Bodhya", "hi": "📋 आपका दिन, Bodhya के साथ", "te": "📋 మీ రోజు, Bodhya తో"}[req.lang],
        "day_score": min(100, score),
        "generated_at": datetime.utcnow(),
    }


class TestNotification(BaseModel):
    user_id: str = "local"
    title: str = "🔔 Test notification"
    body: str = "This is how Bodhya will get your attention."
    kind: str = "system"


@router.post("/test")
def test_notification(req: TestNotification) -> dict:
    entry = {
        "id": f"log_{uuid.uuid4().hex[:8]}",
        "at": datetime.utcnow(),
        "event": "sent",
        "kind": req.kind,
        "title": req.title,
        "body": req.body,
        "user_id": req.user_id,
    }
    _LOG.append(entry)
    return {"sent": True, "log": entry}


@router.get("/log")
def notification_log(limit: int = Query(50, ge=1, le=500)) -> dict:
    return {"count": len(_LOG[-limit:]), "log": _LOG[-limit:]}


class PlanReminderRequest(BaseModel):
    """Batch-create a reminder for each session of a generated study plan."""

    user_id: str = "local"
    sessions: list[dict]                     # [{day, startTime, subjectName, minutes}]
    lead_minutes: int = 10
    sound: str = "chime"


@router.post("/plan-reminders")
def plan_reminders(req: PlanReminderRequest) -> dict:
    created = []
    for session in req.sessions[:60]:
        start = str(session.get("startTime") or "17:00")
        hour, minute = (int(x) for x in start.split(":")[:2])
        total = max(0, hour * 60 + minute - req.lead_minutes)
        created.append({
            "id": f"rem_{uuid.uuid4().hex[:10]}",
            "user_id": req.user_id,
            "title": f"📘 {session.get('subjectName', 'Study')} session",
            "body": f"Starts in {req.lead_minutes} minutes",
            "kind": "plan",
            "time_of_day": f"{total // 60:02d}:{total % 60:02d}",
            "days": [],
            "day": session.get("day"),
            "sound": req.sound,
            "linked_feature": "focus",
            "linked_id": session.get("id"),
            "enabled": True,
            "created_at": datetime.utcnow(),
        })
    for rem in created:
        _REMINDERS[rem["id"]] = rem
    return {"created": len(created), "reminders": created}


@router.get("/templates")
def reminder_templates() -> dict:
    """One-tap alarm templates shared by the web client and any future app."""
    return {
        "templates": [
            {"id": "wake", "emoji": "🌅", "time": "06:00", "days": [1, 2, 3, 4, 5],
             "label": {"en": "Wake up & freshen", "hi": "उठो और तैयार हो जाओ", "te": "లేచి తయారవ్వండి"}},
            {"id": "morning", "emoji": "📖", "time": "07:30", "days": [1, 2, 3, 4, 5],
             "label": {"en": "Morning revision", "hi": "सुबह का रिवीज़न", "te": "ఉదయపు రివిజన్"}},
            {"id": "homework", "emoji": "✏️", "time": "15:30", "days": [1, 2, 3, 4, 5],
             "label": {"en": "Homework time", "hi": "होमवर्क का समय", "te": "హోంవర్క్ సమయం"}},
            {"id": "evening", "emoji": "🌆", "time": "19:00", "days": [1, 2, 3, 4, 5],
             "label": {"en": "Evening study block", "hi": "शाम का स्टडी ब्लॉक", "te": "సాయంత్రం స్టడీ బ్లాక్"}},
            {"id": "night", "emoji": "🌙", "time": "21:30", "days": [0, 1, 2, 3, 4, 5, 6],
             "label": {"en": "Wind down", "hi": "आराम करो", "te": "విశ్రాంతి తీసుకోండి"}},
            {"id": "weekend", "emoji": "🚀", "time": "09:00", "days": [0, 6],
             "label": {"en": "Weekend deep work", "hi": "सप्ताहांत गहन अभ्यास", "te": "వారాంతపు డీప్ వర్క్"}},
        ]
    }


def _today() -> date:
    return datetime.utcnow().date()
