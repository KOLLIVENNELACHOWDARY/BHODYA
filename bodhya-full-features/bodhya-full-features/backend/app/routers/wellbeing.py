"""
Wellbeing service — the server half of Bodhya's focus pack
(study music · study forest · focus shield).

Everything those features do happens in the browser (the music is
synthesised with Web Audio, trees are timed locally, the shield guards the
session). This router adds what a server is actually good for:

  1. One canonical blocklist, so every client/device/teammate blocks the same
     domains — with ready-to-paste exports (hosts file, DNS rules, extension
     JSON) that a cron job or a support email could also ship.
  2. A weekly focus report (EN/HI/TE) built from the numbers the client sends:
     focused minutes, trees grown, escapes, resisted urges.
  3. The catalogue of music presets + the honest science notes, so the app, a
     future mobile client and the docs never drift apart.
  4. A tiny "urge log" so a coach/parent view can see patterns by hour.

No LLM calls, no external services — this is deterministic text assembly.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter()

# ---------------------------------------------------------------------------
# Blocklist packs — keep in sync with frontend/src/features/focus-shield/logic.js
# ---------------------------------------------------------------------------
SITE_PACKS: list[dict] = [
    {"id": "social", "emoji": "📱", "name": {"en": "Social feeds", "hi": "सोशल फ़ीड", "te": "సోషల్ ఫీడ్‌లు"},
     "sites": ["instagram.com", "facebook.com", "x.com", "twitter.com", "threads.net", "snapchat.com", "reddit.com"]},
    {"id": "video", "emoji": "▶️", "name": {"en": "Short video", "hi": "शॉर्ट वीडियो", "te": "షార్ట్ వీడియో"},
     "sites": ["youtube.com", "youtu.be", "tiktok.com", "netflix.com", "primevideo.com", "hotstar.com", "twitch.tv"]},
    {"id": "games", "emoji": "🎮", "name": {"en": "Games", "hi": "गेम्स", "te": "గేమ్‌లు"},
     "sites": ["roblox.com", "store.steampowered.com", "epicgames.com", "freefiremobile.com", "bgmi.in"]},
    {"id": "shopping", "emoji": "🛒", "name": {"en": "Shopping", "hi": "शॉपिंग", "te": "షాపింగ్"},
     "sites": ["amazon.in", "flipkart.com", "myntra.com", "ajio.com", "meesho.com"]},
    {"id": "news", "emoji": "📰", "name": {"en": "Endless news", "hi": "अंतहीन ख़बरें", "te": "అంతులేని వార్తలు"},
     "sites": ["news.google.com", "ndtv.com", "timesofindia.indiatimes.com", "buzzfeed.com"]},
    {"id": "chat", "emoji": "💬", "name": {"en": "Chat apps", "hi": "चैट ऐप्स", "te": "చాట్ యాప్‌లు"},
     "sites": ["web.whatsapp.com", "web.telegram.org", "discord.com", "messenger.com"]},
]

# ---------------------------------------------------------------------------
# Music catalogue — keep in sync with frontend/src/features/music/logic.js
# ---------------------------------------------------------------------------
MUSIC_PRESETS: list[dict] = [
    {"id": "deep-focus", "emoji": "🎯", "name": {"en": "Deep Focus", "hi": "गहरा फोकस", "te": "డీప్ ఫోకస్"},
     "layers": {"music": "pad", "ambient": "brown", "binaural": "alpha_10hz"}, "tempo": 68},
    {"id": "memory-boost", "emoji": "🧠", "name": {"en": "Memory Boost", "hi": "याददाश्त बूस्ट", "te": "మెమరీ బూస్ట్"},
     "layers": {"music": "drone", "ambient": "pink", "binaural": "theta_6hz"}, "tempo": 56},
    {"id": "reading-rain", "emoji": "🌧️", "name": {"en": "Reading Rain", "hi": "पढ़ाई की बारिश", "te": "చదువు వర్షం"},
     "layers": {"music": "piano", "ambient": "rain", "binaural": None}, "tempo": 60},
    {"id": "lofi-study", "emoji": "🎧", "name": {"en": "Lo-fi Study Beats", "hi": "लो-फ़ाई बीट्स", "te": "లో-ఫై బీట్స్"},
     "layers": {"music": "lofi", "ambient": "brown", "binaural": None}, "tempo": 74},
    {"id": "exam-sprint", "emoji": "🚀", "name": {"en": "Exam Sprint", "hi": "परीक्षा स्प्रिंट", "te": "పరీక్ష స్ప్రింట్"},
     "layers": {"music": "piano", "ambient": "cafe", "binaural": "beta_16hz"}, "tempo": 92},
    {"id": "peak-thinking", "emoji": "⚡", "name": {"en": "Peak Thinking", "hi": "पीक थिंकिंग", "te": "పీక్ థింకింగ్"},
     "layers": {"music": "pad", "ambient": "pink", "binaural": "gamma_40hz"}, "tempo": 64},
    {"id": "calm-night", "emoji": "🌙", "name": {"en": "Calm Night", "hi": "शांत रात", "te": "ప్రశాంత రాత్రి"},
     "layers": {"music": "drone", "ambient": "wind", "binaural": "theta_6hz"}, "tempo": 50},
    {"id": "white-noise", "emoji": "📻", "name": {"en": "Pure Noise", "hi": "शुद्ध नॉइज़", "te": "ప్యూర్ నాయిస్"},
     "layers": {"music": None, "ambient": "brown", "binaural": None}, "tempo": 0},
]

BINAURAL_BANDS = {
    "delta": 2.5, "theta": 6, "alpha": 10, "smr": 13.5, "beta": 16, "gamma": 40,
}

SCIENCE_NOTES: dict[str, dict] = {
    "focus": {
        "title": {"en": "Alpha waves (8–12 Hz)", "hi": "अल्फा तरंगें (8–12 Hz)", "te": "ఆల్ఫా తరంగాలు (8–12 Hz)"},
        "body": {
            "en": "Alpha activity is linked to relaxed-but-awake attention. Binaural alpha is popular for focused work; studies show small, mixed effects — treat it as a concentration ritual, with headphones.",
            "hi": "अल्फा गतिविधि शांत-पर-जागरूक ध्यान से जुड़ी है। बाइनोरल अल्फा फोकस के लिए लोकप्रिय है; नतीजे छोटे और मिले-जुले हैं — इसे एकाग्रता की आदत मानिए, हेडफ़ोन के साथ।",
            "te": "ఆల్ఫా కార్యకలాపం ప్రశాంత-అప్రమత్త ఏకాగ్రతతో ముడిపడి ఉంది. పరిశోధనలు చిన్న, మిశ్రమ ఫలితాలు ఇస్తాయి — హెడ్‌ఫోన్‌తో ఒక అలవాటుగా వాడండి.",
        },
    },
    "noise": {
        "title": {"en": "Noise masks distraction", "hi": "नॉइज़ ध्यान भंग रोकता है", "te": "నాయిస్ డిస్ట్రాక్షన్ ఆపుతుంది"},
        "body": {
            "en": "Steady brown/pink noise covers sudden sounds — doors, phones, chatter — which are what actually break concentration.",
            "hi": "लगातार ब्राउन/पिंक नॉइज़ अचानक आवाज़ों को ढक देता है — दरवाज़ा, फ़ोन, बातचीत — यही ध्यान तोड़ती हैं।",
            "te": "నిరంతర బ్రౌన్/పింక్ నాయిస్ అకస్మాత్తు శబ్దాలను కవర్ చేస్తుంది — ఇవే ఏకాగ్రతను దెబ్బతీస్తాయి.",
        },
    },
    "disclaimer": {
        "title": {"en": "Honest note", "hi": "सच बात", "te": "నిజం"},
        "body": {
            "en": "Evidence for brainwave entrainment is mixed. Keep volumes comfortable, never painful, and remember breaks and sleep do the heavy lifting for memory.",
            "hi": "ब्रेनवेव एंट्रेनमेंट के सबूत मिले-जुले हैं। आवाज़ आरामदायक रखें, कभी दर्दभरी नहीं, और याद रखें — याददाश्त का असली काम ब्रेक और नींद करते हैं।",
            "te": "బ్రెయిన్‌వేవ్ ఆధారాలు మిశ్రమం. శబ్దం హాయిగా ఉంచండి, నొప్పిగా కాదు — జ్ఞాపకానికి అసలు పని విరామాలు, నిద్ర చేస్తాయి.",
        },
    },
}

# ---------------------------------------------------------------------------
# In-memory urge log (a coach/parent view can read patterns from here)
# ---------------------------------------------------------------------------
_URGES: list[dict] = []


def normalize_site(value: str) -> str:
    s = (value or "").strip().lower()
    for prefix in ("https://", "http://"):
        if s.startswith(prefix):
            s = s[len(prefix):]
    if s.startswith("www."):
        s = s[4:]
    s = s.split("/")[0].split(":")[0]
    return s.replace(" ", "")


def is_valid_site(site: str) -> bool:
    parts = site.split(".")
    return len(parts) >= 2 and all(p for p in parts) and len(site) <= 100


def export_blocklist(sites: list[str], fmt: str = "hosts") -> str:
    clean = sorted({normalize_site(s) for s in sites if s})
    if fmt == "dns":
        lines = ["! Bodhya Focus Shield — DNS blocking rules",
                 "! NextDNS / AdGuard Home / Pi-hole: paste into Custom rules / Denylist", ""]
        lines += [f"||{s}^" for s in clean]
        return "\n".join(lines) + "\n"
    if fmt == "json":
        import json
        return json.dumps({
            "name": "Bodhya Focus Shield",
            "version": 1,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "blockedSites": clean,
            "chromePolicyUrlBlocklist": clean,
        }, indent=2)
    if fmt == "text":
        return "\n".join(clean) + "\n"
    lines = [
        "# Bodhya Focus Shield — device-wide blocklist",
        "# Paste these lines at the end of your hosts file and save.",
        "#   Windows : C:\\Windows\\System32\\drivers\\etc\\hosts (open Notepad as Administrator)",
        "#   macOS   : sudo nano /etc/hosts",
        "#   Linux   : sudo nano /etc/hosts",
        "# Flush DNS: Windows ipconfig /flushdns · macOS sudo dscacheutil -flushcache",
        f"# Generated {datetime.now(timezone.utc).date().isoformat()} · {len(clean)} sites",
        "",
    ]
    for s in clean:
        lines.append(f"0.0.0.0 {s}")
        lines.append(f"0.0.0.0 www.{s}")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# models
# ---------------------------------------------------------------------------
class ExportRequest(BaseModel):
    sites: list[str] = Field(default_factory=list)
    packs: list[str] = Field(default_factory=list)
    format: Literal["hosts", "dns", "json", "text"] = "hosts"


class FocusSession(BaseModel):
    minutes: int = 0
    escapes: int = 0
    tree_grown: bool = False
    withered: bool = False
    subject: Optional[str] = None
    at: Optional[datetime] = None


class FocusReportRequest(BaseModel):
    user_id: str = "local"
    name: str = "friend"
    lang: Literal["en", "hi", "te"] = "en"
    from_ts: Optional[datetime] = None
    to_ts: Optional[datetime] = None
    sessions: list[FocusSession] = Field(default_factory=list)
    urges_resisted: int = 0
    scroll_break_minutes: int = 0
    music_minutes: int = 0
    planted_blocked: int = 0


class UrgeEvent(BaseModel):
    user_id: str = "local"
    outcome: Literal["resisted", "gave-in", "break"] = "resisted"
    at: Optional[datetime] = None
    site: Optional[str] = None
    minutes: int = 0


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------
@router.get("/status")
def status() -> dict:
    return {
        "module": "wellbeing",
        "features": ["focus-shield-blocklist", "focus-report", "music-catalogue", "urge-log"],
        "packs": [p["id"] for p in SITE_PACKS],
        "presets": [p["id"] for p in MUSIC_PRESETS],
        "binaural_bands": BINAURAL_BANDS,
        "client_side": {
            "music": "synthesised in the browser with Web Audio (no files, no stream)",
            "forest": "tree timers run locally",
            "shield": "session guard runs locally; these exports block the device",
        },
    }


@router.get("/blocklist/packs")
def blocklist_packs() -> dict:
    return {
        "packs": SITE_PACKS,
        "all_sites": sorted({s for p in SITE_PACKS for s in p["sites"]}),
    }


@router.post("/blocklist/export")
def blocklist_export(req: ExportRequest) -> dict:
    sites = list(req.sites)
    for pack_id in req.packs:
        pack = next((p for p in SITE_PACKS if p["id"] == pack_id), None)
        if not pack:
            raise HTTPException(status_code=422, detail=f"Unknown pack '{pack_id}'")
        sites.extend(pack["sites"])
    clean = sorted({normalize_site(s) for s in sites if normalize_site(s)})
    bad = [s for s in clean if not is_valid_site(s)]
    if bad:
        raise HTTPException(status_code=422, detail=f"Not a valid domain: {', '.join(bad)}")
    return {
        "format": req.format,
        "count": len(clean),
        "sites": clean,
        "content": export_blocklist(clean, req.format),
    }


@router.post("/focus-report")
def focus_report(req: FocusReportRequest) -> dict:
    """Weekly/monthly focus report — deterministic text, three languages."""
    sessions = req.sessions
    minutes = sum(s.minutes for s in sessions)
    escapes = sum(s.escapes for s in sessions)
    grown = sum(1 for s in sessions if s.tree_grown)
    withered = sum(1 for s in sessions if s.withered)
    clean = sum(1 for s in sessions if s.escapes == 0)
    clean_pct = round(clean / len(sessions) * 100) if sessions else 0
    hours, mins = divmod(minutes, 60)
    pretty = f"{hours}h {mins}m" if hours else f"{mins}m"

    if req.lang == "hi":
        lines = [
            f"नमस्ते {req.name}! यह आपकी फोकस रिपोर्ट है:",
            f"⏳ फोकस समय: {pretty} ({len(sessions)} सत्र)",
            f"🌳 पेड़: {grown} उगे, {withered} मुरझाए",
            f"🛡️ साफ़ सत्र: {clean_pct}%",
            f"🚪 भटकाव: {escapes} · 💪 रोकी इच्छाएँ: {req.urges_resisted}",
        ]
        if req.scroll_break_minutes:
            lines.append(f"☕ स्क्रॉल ब्रेक: {req.scroll_break_minutes} मिनट")
        if req.music_minutes:
            lines.append(f"🎵 संगीत: {req.music_minutes} मिनट साथ रहा")
        hint = "सुझाव: सबसे लंबे सत्र वाले समय को देखिए और उसी घंटे को सख़्त रखिए।" if escapes else "शानदार — एक भी भटकाव नहीं।"
    elif req.lang == "te":
        lines = [
            f"నమస్కారం {req.name}! ఇది మీ ఫోకస్ రిపోర్ట్:",
            f"⏳ ఫోకస్ సమయం: {pretty} ({len(sessions)} సెషన్లు)",
            f"🌳 చెట్లు: {grown} పెరిగాయి, {withered} వాడిపోయాయి",
            f"🛡️ క్లీన్ సెషన్లు: {clean_pct}%",
            f"🚪 ఎస్కేప్‌లు: {escapes} · 💪 ఆపిన కోరికలు: {req.urges_resisted}",
        ]
        if req.scroll_break_minutes:
            lines.append(f"☕ స్క్రోల్ బ్రేక్‌లు: {req.scroll_break_minutes} నిమిషాలు")
        if req.music_minutes:
            lines.append(f"🎵 మ్యూజిక్: {req.music_minutes} నిమిషాలు తోడు")
        hint = "సూచన: ఎక్కువ ఎస్కేప్‌లు ఉన్న గంటను కనిపెట్టి ఆ గంటను స్ట్రిక్ట్ చేయండి." if escapes else "అద్భుతం — ఒక్క ఎస్కేప్ కూడా లేదు."
    else:
        lines = [
            f"Hi {req.name}! Here is your focus report:",
            f"⏳ Focused time: {pretty} ({len(sessions)} sessions)",
            f"🌳 Trees: {grown} grown, {withered} withered",
            f"🛡️ Clean sessions: {clean_pct}%",
            f"🚪 Escapes: {escapes} · 💪 urges resisted: {req.urges_resisted}",
        ]
        if req.scroll_break_minutes:
            lines.append(f"☕ Scroll breaks taken: {req.scroll_break_minutes} min")
        if req.music_minutes:
            lines.append(f"🎵 Study music: {req.music_minutes} min of company")
        hint = ("Tip: your escapes cluster — pick the worst hour and set it to strict."
                if escapes else "Perfect record — not a single escape. 🎉")

    score = 0
    if sessions:
        score += min(40, int(minutes / 5))
        score += 20 if clean_pct >= 80 else 10 if clean_pct >= 50 else 0
        score += min(20, grown * 2)
        score += min(20, req.urges_resisted * 2)

    return {
        "report": "\n".join(lines + ["", hint]),
        "stats": {
            "minutes": minutes,
            "sessions": len(sessions),
            "grown": grown,
            "withered": withered,
            "escapes": escapes,
            "clean_percent": clean_pct,
            "music_minutes": req.music_minutes,
            "scroll_break_minutes": req.scroll_break_minutes,
            "focus_score": min(100, score),
        },
        "generated_at": datetime.now(timezone.utc),
    }


@router.get("/music/presets")
def music_presets() -> dict:
    return {
        "presets": MUSIC_PRESETS,
        "bands": BINAURAL_BANDS,
        "science_notes": SCIENCE_NOTES,
        "headphone_note": {
            "en": "Binaural presets need headphones — the beat exists only inside your head.",
            "hi": "बाइनॉरल प्रीसेट के लिए हेडफ़ोन ज़रूरी है — बीट सिर्फ़ दिमाग़ में बनती है।",
            "te": "బైనారల్ ప్రీసెట్‌లకు హెడ్‌ఫోన్ కావాలి — బీట్ మీ తలలోనే ఏర్పడుతుంది.",
        },
    }


@router.get("/music/preset/{preset_id}")
def music_preset(preset_id: str, lang: str = "en") -> dict:
    preset = next((p for p in MUSIC_PRESETS if p["id"] == preset_id), None)
    if not preset:
        raise HTTPException(status_code=404, detail="Unknown preset")
    lang = lang if lang in ("en", "hi", "te") else "en"
    return {
        "preset": preset,
        "name": preset["name"][lang],
        "science": SCIENCE_NOTES,
    }


@router.post("/urges", status_code=201)
def log_urge(event: UrgeEvent) -> dict:
    entry = {
        "id": f"urge_{len(_URGES) + 1}",
        "user_id": event.user_id,
        "outcome": event.outcome,
        "at": (event.at or datetime.now(timezone.utc)).isoformat(),
        "site": event.site,
        "minutes": event.minutes,
    }
    _URGES.append(entry)
    return {"logged": entry}


@router.get("/urges/summary")
def urge_summary(user_id: str = "local", days: int = Query(7, ge=1, le=90)) -> dict:
    mine = [u for u in _URGES if u["user_id"] == user_id]
    hours = [0] * 24
    for u in mine:
        hours[datetime.fromisoformat(u["at"]).hour] += 1
    resisted = [u for u in mine if u["outcome"] == "resisted"]
    return {
        "total": len(mine),
        "resisted": len(resisted),
        "gave_in": len([u for u in mine if u["outcome"] == "gave-in"]),
        "break_minutes": sum(u["minutes"] for u in mine if u["outcome"] == "break"),
        "resist_rate": round(len(resisted) / len(mine) * 100) if mine else 0,
        "by_hour": hours,
        "riskiest_hour": hours.index(max(hours)) if mine and max(hours) else None,
        "window_days": days,
    }


@router.get("/forest/tips")
def forest_tips(lang: str = "en", streaks: int = 0) -> dict:
    """Small nudges the client can show above the forest."""
    lang = lang if lang in ("en", "hi", "te") else "en"
    tips = {
        "en": [
            "Short trees are not cheating — a 10-minute bamboo you finish beats a 60-minute tree you abandon.",
            "Plant the tree *before* opening your notes, not after.",
            "Your first session of the day decides the rest — make it a bamboo if you feel resistance.",
        ],
        "hi": [
            "छोटा पेड़ धोखा नहीं — 10 मिनट का बाँस जो पूरा हो, 60 मिनट के उस पेड़ से बेहतर है जो छूट जाए।",
            "पेड़ नोट्स खोलने से *पहले* लगाइए, बाद में नहीं।",
            "दिन का पहला सत्र बाक़ी दिन तय करता है — मन न लगे तो बाँस लगाइए।",
        ],
        "te": [
            "చిన్న చెట్టు మోసం కాదు — పూర్తయ్యే 10 నిమిషాల బంబూ, వదిలేసిన 60 నిమిషాల చెట్టు కంటే మేలు.",
            "నోట్స్ తెరవడానికి *ముందే* చెట్టు నాటండి.",
            "రోజు మొదటి సెషన్ మిగతా రోజును నిర్ణయిస్తుంది — సోమరిగా ఉంటే బంబూ నాటండి.",
        ],
    }[lang]
    bonus = {"en": f"You are on a {streaks}-day streak — protect it today.",
             "hi": f"आप {streaks} दिन की स्ट्रीक पर हैं — आज इसे बचाइए।",
             "te": f"మీరు {streaks} రోజుల స్ట్రీక్‌లో ఉన్నారు — ఈరోజు కాపాడండి."}[lang] if streaks else None
    return {"tips": tips + ([bonus] if bonus else []), "lang": lang}
