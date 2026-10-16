"""
Guardian service — the server half of the consensual read-only view.

Principles encoded here (not just documented):
  * a guardian can only read with a code the student created;
  * the student picks the sections; `journal_text` is excluded unless asked for;
  * the student can revoke, and revoking invalidates the code server-side;
  * reports are deterministic text/HTML — no LLM, no email sending by default.

The client works entirely offline; this router exists so a report can be shared
by link, archived, or opened from another device.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # no I/O/0/1 — they get misheard

SECTIONS = [
    {"id": "studyTime", "emoji": "⏱️", "default": True},
    {"id": "tasks", "emoji": "✅", "default": True},
    {"id": "plan", "emoji": "📅", "default": True},
    {"id": "forest", "emoji": "🌳", "default": True},
    {"id": "shield", "emoji": "🛡️", "default": True},
    {"id": "journalMood", "emoji": "🙂", "default": True},
    {"id": "journalText", "emoji": "📔", "default": False},   # private unless opened
    {"id": "letters", "emoji": "💌", "default": False},
]
SECTION_IDS = [s["id"] for s in SECTIONS]
DEFAULT_SECTIONS = [s["id"] for s in SECTIONS if s["default"]]
PRIVATE_BY_DEFAULT = [s["id"] for s in SECTIONS if not s["default"]]

STATUS_EMOJI = {"good": "🟢", "watch": "🟡", "low": "🔴"}

_GRANTS: dict[str, dict] = {}     # code → grant
_SNAPSHOTS: list[dict] = []       # audit trail for the student
_LINKS: dict[str, dict] = {}      # token → frozen guest link (revocable, expiring)
_LINK_OPENS: list[dict] = []      # who opened what, when (student's audit trail)



class GrantRequest(BaseModel):
    user_id: str = "local"
    student_name: str = ""
    guardian_name: str = ""
    relation: Literal["parent", "teacher", "mentor"] = "parent"
    sections: Optional[list[str]] = None          # defaults to everything public
    expires_days: int = Field(0, ge=0, le=365)    # 0 = never


class Snapshot(BaseModel):
    """Only the numbers the student agreed to share."""

    minutes_today: float = 0
    goal_minutes: float = 120
    minutes_week: float = 0
    sessions_today: int = 0
    study_streak: int = 0
    tasks_done: int = 0
    tasks_total: int = 0
    tasks_open: int = 0
    tasks_overdue: int = 0
    exam_days: Optional[int] = None
    plan_sessions: int = 0
    plan_done: int = 0
    plan_percent: int = 0
    trees_grown: int = 0
    trees_lost: int = 0
    forest_streak: int = 0
    longest_session: int = 0
    clean_rate: int = 0
    blocked_sites: int = 0
    urges_resisted: int = 0
    break_minutes: int = 0
    avg_mood: float = 0
    mood_trend: Literal["up", "down", "flat"] = "flat"
    journal_days: int = 0
    journal_streak: int = 0
    letters_sealed: int = 0
    next_letter_at: Optional[str] = None
    journal_entries: list[dict] = Field(default_factory=list)   # only if journalText shared
    note_from_student: str = ""


class ReportRequest(BaseModel):
    lang: Literal["en", "hi", "te"] = "en"
    student_name: str = ""
    sections: list[str] = Field(default_factory=lambda: list(DEFAULT_SECTIONS))
    snapshot: Snapshot = Field(default_factory=Snapshot)


def new_code() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(6))


def _status_for(ratio: float) -> str:
    return "good" if ratio >= 0.75 else "watch" if ratio >= 0.4 else "low"


def build_sections(snap: Snapshot, allowed: list[str], lang: str = "en") -> list[dict]:
    """Same rules and wording as the client, so the two never disagree."""
    has = lambda sid: sid in allowed            # noqa: E731
    out: list[dict] = []

    if has("studyTime"):
        goal = snap.goal_minutes or 120
        out.append({
            "id": "studyTime",
            "status": _status_for(snap.minutes_today / goal if goal else 0),
            "headline": {
                "en": f"{round(snap.minutes_today)} min focused today (goal {round(goal)} min)",
                "hi": f"आज {round(snap.minutes_today)} मिनट फोकस (लक्ष्य {round(goal)} मिनट)",
                "te": f"ఈరోజు {round(snap.minutes_today)} నిమిషాల ఫోకస్ (లక్ష్యం {round(goal)})",
            }[lang],
            "rows": [
                {"label": {"en": "This week", "hi": "इस हफ़्ते", "te": "ఈ వారం"}[lang],
                 "value": f"{round(snap.minutes_week / 60, 1)}h"},
                {"label": {"en": "Study streak", "hi": "स्टडी स्ट्रीक", "te": "స్టడీ స్ట్రీక్"}[lang],
                 "value": f"🔥 {snap.study_streak}"},
            ],
        })

    if has("tasks"):
        out.append({
            "id": "tasks",
            "status": "low" if snap.tasks_overdue >= 3 else "watch" if snap.tasks_overdue else _status_for(
                (snap.tasks_done / snap.tasks_total) if snap.tasks_total else 1),
            "headline": {
                "en": f"{snap.tasks_done} of {snap.tasks_total} tasks done today" if snap.tasks_total else "No tasks due today",
                "hi": f"आज {snap.tasks_total} में से {snap.tasks_done} काम पूरे" if snap.tasks_total else "आज कोई काम नहीं",
                "te": f"ఈరోజు {snap.tasks_total}లో {snap.tasks_done} పనులు పూర్తి" if snap.tasks_total else "ఈరోజు పనులు లేవు",
            }[lang],
            "rows": [
                {"label": {"en": "Open", "hi": "बाकी", "te": "పెండింగ్"}[lang], "value": str(snap.tasks_open)},
                {"label": {"en": "Overdue", "hi": "बीत चुके", "te": "గడువు దాటినవి"}[lang], "value": str(snap.tasks_overdue)},
            ],
            "note": {"en": "Task titles are private.", "hi": "काम के नाम निजी हैं।", "te": "పనుల పేర్లు ప్రైవేట్."}[lang],
        })

    if has("plan"):
        out.append({
            "id": "plan",
            "status": _status_for((snap.plan_done / snap.plan_sessions) if snap.plan_sessions else 0.5),
            "headline": (
                {"en": f"Exam in {snap.exam_days} day(s)", "hi": f"परीक्षा {snap.exam_days} दिन में",
                 "te": f"పరీక్ష {snap.exam_days} రోజుల్లో"}[lang]
                if snap.exam_days is not None and snap.exam_days >= 0 else
                {"en": "No exam date set", "hi": "परीक्षा की तारीख़ तय नहीं", "te": "పరీక్ష తేదీ లేదు"}[lang]
            ),
            "rows": [
                {"label": {"en": "Today's sessions", "hi": "आज के सत्र", "te": "నేటి సెషన్లు"}[lang],
                 "value": f"{snap.plan_done}/{snap.plan_sessions}"},
                {"label": {"en": "Plan finished", "hi": "प्लान पूरा", "te": "ప్లాన్ పూర్తి"}[lang],
                 "value": f"{snap.plan_percent}%"},
            ],
        })

    if has("forest"):
        out.append({
            "id": "forest",
            "status": "watch" if snap.trees_lost > snap.trees_grown else "good",
            "headline": {"en": f"{snap.trees_grown} trees grown, {snap.trees_lost} lost",
                         "hi": f"{snap.trees_grown} पेड़ उगे, {snap.trees_lost} मुरझाए",
                         "te": f"{snap.trees_grown} చెట్లు పెరిగాయి, {snap.trees_lost} వాడిపోయాయి"}[lang],
            "rows": [
                {"label": {"en": "Streak", "hi": "स्ट्रीक", "te": "స్ట్రీక్"}[lang], "value": f"🔥 {snap.forest_streak}"},
                {"label": {"en": "Longest session", "hi": "सबसे लंबा सत्र", "te": "అతి పొడవు సెషన్"}[lang],
                 "value": f"{snap.longest_session} min"},
            ],
            "note": {"en": "A tree withers when a session is abandoned — it is the deal that makes focus real.",
                     "hi": "सत्र बीच में छूटे तो पेड़ मुरझाता है — यही सौदा फोकस को असली बनाता है।",
                     "te": "సెషన్ వదిలేస్తే చెట్టు వాడిపోతుంది — ఇదే ఫోకస్‌ను నిజం చేస్తుంది."}[lang],
        })

    if has("shield"):
        out.append({
            "id": "shield",
            "status": _status_for(snap.clean_rate / 100),
            "headline": {"en": f"{snap.clean_rate}% of sessions distraction-free",
                         "hi": f"{snap.clean_rate}% सत्र बिना भटकाव",
                         "te": f"{snap.clean_rate}% సెషన్లు డిస్ట్రాక్షన్ లేకుండా"}[lang],
            "rows": [
                {"label": {"en": "Sites blocked", "hi": "ब्लॉक साइटें", "te": "బ్లాక్ సైట్లు"}[lang], "value": str(snap.blocked_sites)},
                {"label": {"en": "Urges resisted", "hi": "रोकी इच्छाएँ", "te": "ఆపిన కోరికలు"}[lang], "value": f"💪 {snap.urges_resisted}"},
            ],
        })

    if has("journalMood"):
        out.append({
            "id": "journalMood",
            "status": "watch" if snap.mood_trend == "down" else "good",
            "headline": {"en": f"Average mood {snap.avg_mood}/5 over {snap.journal_days} entries",
                         "hi": f"{snap.journal_days} प्रविष्टियों में औसत मूड {snap.avg_mood}/5",
                         "te": f"{snap.journal_days} ఎంట్రీల్లో సగటు మూడ్ {snap.avg_mood}/5"}[lang],
            "rows": [
                {"label": {"en": "Writing streak", "hi": "लेखन स्ट्रीक", "te": "రచన స్ట్రీక్"}[lang], "value": f"🔥 {snap.journal_streak}"},
                {"label": {"en": "Trend (14 days)", "hi": "रुझान (14 दिन)", "te": "ధోరణి (14 రోజులు)"}[lang],
                 "value": {"up": "📈", "down": "📉", "flat": "➖"}[snap.mood_trend]},
            ],
            "note": {"en": "Mood numbers only — the journal itself stays private.",
                     "hi": "सिर्फ़ मूड आँकड़े — जर्नल निजी रहता है।",
                     "te": "మూడ్ సంఖ్యలు మాత్రమే — జర్నల్ ప్రైవేట్‌గా ఉంటుంది."}[lang],
        })

    if has("journalText"):
        entries = snap.journal_entries[:5]
        out.append({
            "id": "journalText",
            "status": "good",
            "headline": {
                "en": f"{len(entries)} recent entr{'y' if len(entries) == 1 else 'ies'} shared by the student",
                "hi": f"छात्र ने {len(entries)} हाल की प्रविष्टियाँ साझा कीं",
                "te": f"విద్యార్థి {len(entries)} ఎంట్రీలు పంచారు",
            }[lang],
            "entries": [{"day": e.get("day"), "mood": e.get("mood"), "text": str(e.get("text", ""))[:400]} for e in entries],
            "note": {"en": "Only visible because the student chose to share it.",
                     "hi": "यह इसलिए दिख रहा है क्योंकि छात्र ने साझा करना चुना।",
                     "te": "విద్యార్థి పంచాలని ఎంచుకున్నందుకే ఇది కనిపిస్తోంది."}[lang],
        })

    if has("letters"):
        out.append({
            "id": "letters",
            "status": "good",
            "headline": {"en": f"{snap.letters_sealed} sealed letter(s) to their future self",
                         "hi": f"भविष्य के लिए {snap.letters_sealed} सीलबंद चिट्ठियाँ",
                         "te": f"భవిష్యత్తుకు {snap.letters_sealed} ముద్రిత ఉత్తరాలు"}[lang],
            "rows": ([{"label": {"en": "Next opens", "hi": "अगली खुलेगी", "te": "తదుపరి తెరుచుకుంటుంది"}[lang],
                       "value": snap.next_letter_at}] if snap.next_letter_at else []),
            "note": {"en": "The letters themselves are never shown here.",
                     "hi": "चिट्ठियाँ ख़ुद यहाँ कभी नहीं दिखतीं।",
                     "te": "ఉత్తరాలు ఇక్కడ ఎప్పటికీ కనిపించవు."}[lang],
        })

    return out


def build_highlights(snap: Snapshot, lang: str = "en") -> list[str]:
    out: list[str] = []
    if snap.minutes_today >= snap.goal_minutes:
        out.append({"en": "They hit their study goal today. 🎉", "hi": "आज उन्होंने पढ़ाई का लक्ष्य पूरा किया। 🎉",
                    "te": "ఈరోజు వారు లక్ష్యం చేరుకున్నారు. 🎉"}[lang])
    elif snap.minutes_today > 0:
        out.append({"en": f"They studied {round(snap.minutes_today)} of their {round(snap.goal_minutes)}-minute goal — almost there.",
                    "hi": f"{round(snap.goal_minutes)} में से {round(snap.minutes_today)} मिनट पढ़ा — थोड़ा और।",
                    "te": f"{round(snap.goal_minutes)}లో {round(snap.minutes_today)} నిమిషాలు — కొంచెం మిగిలింది."}[lang])
    else:
        out.append({"en": "No study logged today yet. A gentle nudge works better than a lecture.",
                    "hi": "आज अभी पढ़ाई दर्ज नहीं। डाँट से बेहतर है हल्का-सा याद दिलाना।",
                    "te": "ఈరోజు ఇంకా చదువు నమోదు కాలేదు. గద్దింపు కంటే మృదు గుర్తుచేయడం మేలు."}[lang])
    if snap.tasks_overdue:
        out.append({"en": f"{snap.tasks_overdue} task(s) overdue — worth asking if they need help planning.",
                    "hi": f"{snap.tasks_overdue} काम बीत चुके — पूछिए कि योजना में मदद चाहिए या नहीं।",
                    "te": f"{snap.tasks_overdue} పనులు ఆలస్యం — ప్లానింగ్ సహాయం కావాలా అడగండి."}[lang])
    if snap.clean_rate and snap.clean_rate < 50:
        out.append({"en": "Focus sessions were often interrupted — the phone is likely the battle right now.",
                    "hi": "फोकस सत्र बार-बार टूटे — अभी लड़ाई फ़ोन से है।",
                    "te": "ఫోకస్ సెషన్లు తరచూ భంగమయ్యాయి — ఇప్పుడు పోరాటం ఫోన్‌తోనే."}[lang])
    if snap.mood_trend == "down":
        out.append({"en": "Their mood has been dipping. Ask about the day, not the marks.",
                    "hi": "मूड गिर रहा है। अंकों के बजाय दिन के बारे में पूछिए।",
                    "te": "మూడ్ తగ్గుతోంది. మార్కుల గురించి కాదు, రోజు గురించి అడగండి."}[lang])
    if snap.exam_days is not None and 0 <= snap.exam_days <= 7:
        out.append({"en": f"Exam in {snap.exam_days} day(s) — quiet support and sleep matter most now.",
                    "hi": f"परीक्षा {snap.exam_days} दिन में — अब शांत साथ और नींद सबसे ज़रूरी।",
                    "te": f"పరీక్ష {snap.exam_days} రోజుల్లో — ప్రశాంత తోడు, నిద్ర ముఖ్యం."}[lang])
    return out[:4]


def build_report(req: ReportRequest) -> dict:
    allowed = [s for s in req.sections if s in SECTION_IDS]
    snap = req.snapshot
    sections = build_sections(snap, allowed, req.lang)
    score_num = sum({"good": 100, "watch": 60, "low": 25}.get(s["status"], 50) for s in sections)
    score = round(score_num / len(sections)) if sections else 0
    return {
        "sections": sections,
        "highlights": build_highlights(snap, req.lang),
        "score": score,
        "none_shared": not sections,
        "summary": {
            "en": f"{len(sections)} section(s) shared · overall {score}/100",
            "hi": f"{len(sections)} भाग साझा · कुल {score}/100",
            "te": f"{len(sections)} విభాగాలు పంచారు · మొత్తం {score}/100",
        }[req.lang],
        "shared_at": datetime.now(timezone.utc).isoformat(),
        "student_name": req.student_name,
        "note_from_student": snap.note_from_student,
    }


def report_to_text(report: dict, lang: str = "en") -> str:
    lines = [
        f"Bodhya guardian report — {report['student_name'] or 'student'}",
        report["shared_at"],
        report["summary"],
        "",
    ]
    if report["none_shared"]:
        lines.append({"en": "Nothing is shared right now.", "hi": "अभी कुछ साझा नहीं है।", "te": "ఇప్పుడు ఏదీ పంచబడలేదు."}[lang])
    if report["note_from_student"]:
        lines.append(f"Note from the student: {report['note_from_student']}")
    for h in report["highlights"]:
        lines.append(f"• {h}")
    lines.append("")
    for s in report["sections"]:
        lines.append(f"{STATUS_EMOJI.get(s['status'], '')} {s['headline']}")
        for row in s.get("rows", []):
            lines.append(f"   {row['label']}: {row['value']}")
        for entry in s.get("entries", []):
            lines.append(f"   {entry.get('day')}: {str(entry.get('text'))[:160]}")
        if s.get("note"):
            lines.append(f"   ({s['note']})")
        lines.append("")
    lines.append("This report was shared by the student and can be revoked by them at any time.")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------
@router.get("/status")
def status() -> dict:
    return {
        "module": "guardian",
        "sections": SECTIONS,
        "private_by_default": PRIVATE_BY_DEFAULT,
        "grants": len(_GRANTS),
        "principles": [
            "the student creates the code",
            "the student picks the sections",
            "journal text is private unless explicitly shared",
            "the student can revoke, and revocation is instant server-side",
        ],
    }


@router.post("/grants", status_code=201)
def create_grant(req: GrantRequest) -> dict:
    sections = [s for s in (req.sections or DEFAULT_SECTIONS) if s in SECTION_IDS]
    code = new_code()
    grant = {
        "code": code,
        "user_id": req.user_id,
        "student_name": req.student_name,
        "guardian_name": req.guardian_name,
        "relation": req.relation,
        "sections": sections,
        "active": True,
        "views": 0,
        "created_at": datetime.now(timezone.utc),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=req.expires_days)) if req.expires_days else None,
    }
    _GRANTS[code] = grant
    return {"grant": grant, "shareable": sections, "private_by_default": [s for s in PRIVATE_BY_DEFAULT if s not in sections]}


@router.get("/grants/{code}")
def get_grant(code: str) -> dict:
    grant = _GRANTS.get(code.upper())
    if not grant:
        raise HTTPException(status_code=404, detail="Unknown code")
    return {"grant": grant}


class GrantPatch(BaseModel):
    """Body for editing a grant: change what is shared, or pause it."""

    sections: Optional[list[str]] = None
    active: Optional[bool] = None
    guardian_name: Optional[str] = None
    expires_days: Optional[int] = Field(None, ge=0, le=365)


@router.patch("/grants/{code}")
def patch_grant(code: str, patch: GrantPatch = GrantPatch()) -> dict:
    grant = _GRANTS.get(code.upper())
    if not grant:
        raise HTTPException(status_code=404, detail="Unknown code")
    if patch.sections is not None:
        grant["sections"] = [s for s in patch.sections if s in SECTION_IDS]
    if patch.active is not None:
        grant["active"] = patch.active
    if patch.guardian_name is not None:
        grant["guardian_name"] = patch.guardian_name
    if patch.expires_days is not None:
        grant["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(days=patch.expires_days) if patch.expires_days else None
        )
    return {"grant": grant}


@router.delete("/grants/{code}")
def delete_grant(code: str) -> dict:
    if _GRANTS.pop(code.upper(), None) is None:
        raise HTTPException(status_code=404, detail="Unknown code")
    return {"revoked": code.upper(), "message": "The code no longer works."}


@router.post("/grants/{code}/rotate")
def rotate_grant(code: str) -> dict:
    grant = _GRANTS.pop(code.upper(), None)
    if not grant:
        raise HTTPException(status_code=404, detail="Unknown code")
    new = new_code()
    grant["code"] = new
    grant["views"] = 0
    _GRANTS[new] = grant
    return {"grant": grant}


@router.get("/report/{code}")
def guardian_report(code: str, lang: str = "en") -> dict:
    """The only read path for a guardian: valid code + active grant."""
    lang = lang if lang in ("en", "hi", "te") else "en"
    grant = _GRANTS.get(code.upper())
    if not grant:
        raise HTTPException(status_code=404, detail="Unknown code")
    if not grant["active"]:
        raise HTTPException(status_code=403, detail="Sharing is paused by the student")
    if grant.get("expires_at") and grant["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="This code has expired")
    grant["views"] += 1
    return {"grant": {"code": grant["code"], "sections": grant["sections"], "views": grant["views"]}}


@router.post("/report")
def build_report_endpoint(req: ReportRequest) -> dict:
    """Build a report from a client snapshot (used for previews and exports)."""
    report = build_report(req)
    return {"report": report, "text": report_to_text(report, req.lang), "lang": req.lang}


@router.post("/snapshots")
def store_snapshot(req: ReportRequest) -> dict:
    """Archive what the student shared, so they always have the audit trail."""
    report = build_report(req)
    _SNAPSHOTS.append({
        "at": datetime.now(timezone.utc).isoformat(),
        "student_name": req.student_name,
        "sections": req.sections,
        "score": report["score"],
        "text": report_to_text(report, req.lang),
    })
    return {"stored": len(_SNAPSHOTS), "score": report["score"]}


@router.get("/snapshots")
def list_snapshots(limit: int = 20) -> dict:
    return {"count": len(_SNAPSHOTS), "snapshots": _SNAPSHOTS[-limit:]}


class LinkRequest(BaseModel):
    """Create a guest link: a frozen, expiring, revocable snapshot."""

    user_id: str = "local"
    student_name: str = ""
    sections: list[str] = Field(default_factory=lambda: list(DEFAULT_SECTIONS))
    snapshot: Snapshot = Field(default_factory=Snapshot)
    days: int = Field(30, ge=1, le=365)
    note: str = ""
    lang: Literal["en", "hi", "te"] = "en"


class LinkOpen(BaseModel):
    channel: str = "browser"


# ---------------------------------------------------------------------------
# 🔗 guest links — the server variant (revocable, and 410 when expired)
# ---------------------------------------------------------------------------
@router.post("/links", status_code=201)
def create_link(req: LinkRequest) -> dict:
    """
    Freeze the shared numbers into a link a teacher can open without the app.
    Only the snapshot is stored — later activity can never appear in it.
    """
    token = secrets.token_urlsafe(18).replace("-", "A").replace("_", "B")
    sections = [s for s in req.sections if s in SECTION_IDS]
    link = {
        "token": token,
        "user_id": req.user_id,
        "student_name": req.student_name,
        "sections": sections,
        "snapshot": req.snapshot.model_dump(),
        "note": req.note[:200],
        "lang": req.lang,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=req.days),
        "days": req.days,
        "opens": 0,
        "last_opened_at": None,
    }
    _LINKS[token] = link
    public = {k: v for k, v in link.items() if k != "snapshot"}
    return {
        "link": public,
        "path": f"/api/guardian/link/{token}",
        "private_by_default": [s for s in PRIVATE_BY_DEFAULT if s not in sections],
    }


@router.get("/links")
def list_links(user_id: str = "local") -> dict:
    items = [{k: v for k, v in l.items() if k != "snapshot"} for l in _LINKS.values() if l["user_id"] == user_id]
    items.sort(key=lambda l: l["created_at"], reverse=True)
    now = datetime.now(timezone.utc)
    for item in items:
        item["expired"] = item["expires_at"] < now
    return {"count": len(items), "links": items}


@router.get("/link/{token}")
def open_link(token: str, lang: Optional[str] = None) -> dict:
    """The only read path for a guest link. 410 once it has expired."""
    link = _LINKS.get(token)
    if not link:
        raise HTTPException(status_code=404, detail="Unknown or revoked link")
    now = datetime.now(timezone.utc)
    if link["expires_at"] < now:
        raise HTTPException(status_code=410, detail=f"This link expired on {link['expires_at'].date().isoformat()}")
    use_lang = lang if lang in ("en", "hi", "te") else link.get("lang", "en")
    report = build_report(ReportRequest(
        lang=use_lang,
        student_name=link["student_name"],
        sections=link["sections"],
        snapshot=Snapshot(**link["snapshot"]),
    ))
    report["snapshot_link"] = True
    report["expires_at"] = link["expires_at"].isoformat()
    report["issued_at"] = link["created_at"].isoformat()
    link["opens"] += 1
    link["last_opened_at"] = now
    _LINK_OPENS.append({"token": token, "at": now.isoformat(), "channel": "browser"})
    return {"report": report, "text": report_to_text(report, use_lang), "link": {
        "expires_at": link["expires_at"].isoformat(), "opens": link["opens"], "sections": link["sections"],
    }}


@router.delete("/links/{token}")
def revoke_link(token: str) -> dict:
    if _LINKS.pop(token, None) is None:
        raise HTTPException(status_code=404, detail="Unknown link")
    return {"revoked": token, "message": "The link no longer opens — anyone holding it sees an error."}


@router.get("/link-opens")
def link_opens(limit: int = 30) -> dict:
    """The student's audit trail: every time a shared link was opened."""
    return {"count": len(_LINK_OPENS), "opens": _LINK_OPENS[-limit:]}


@router.get("/help")
def how_to_help(lang: str = "en") -> dict:
    lang = lang if lang in ("en", "hi", "te") else "en"
    return {"tips": [
        {"en": 'Ask about the day, not the marks — "what was hard today?" opens more than "did you study?"',
         "hi": 'अंकों के बजाय दिन के बारे में पूछिए — "आज क्या कठिन लगा?" ज़्यादा खोलता है।',
         "te": 'మార్కుల గురించి కాదు, రోజు గురించి అడగండి — "ఈరోజు ఏం కష్టమైంది?"'}[lang],
        {"en": "Protect sleep in exam week; it does more for marks than an extra hour at midnight.",
         "hi": "परीक्षा के हफ़्ते नींद बचाइए; यह एक घंटे की पढ़ाई से ज़्यादा असर करती है।",
         "te": "పరీక్ష వారంలో నిద్ర కాపాడండి; అది అర్ధరాత్రి ఒక గంట కంటే ఎక్కువ పనిచేస్తుంది."}[lang],
        {"en": "Celebrate the streak, not just the score — consistency is what the report measures.",
         "hi": "सिर्फ़ स्कोर नहीं, स्ट्रीक की सराहना कीजिए — रिपोर्ट निरंतरता नाप रही है।",
         "te": "స్కోర్‌తో పాటు స్ట్రీక్‌ను మెచ్చుకోండి — రిపోర్ట్ నిలకడను కొలుస్తోంది."}[lang],
    ]}
