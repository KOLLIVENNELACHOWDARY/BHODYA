from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    chatbot_guide,
    notifications,
    study_plan,
    wellbeing,
    journal,
    guardian,
    creating,
)

app = FastAPI(title="Bodhya — Reminders, Focus & Guide Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bodhya guide chatbot: status, offline intent classification, contextual
# help text, optional LLM-backed /chat (falls back to rules with no keys).
app.include_router(chatbot_guide.router, prefix="/api/chatbot-guide", tags=["chatbot-guide"])

# Reminder pack: alarms / reminders / notifications + study plan generator
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(study_plan.router, prefix="/api/study-plan", tags=["study-plan"])

# Focus pack: blocklist exports (focus shield), weekly focus report,
# music preset catalogue, urge log (study music / focus / focus-shield / study-forest)
app.include_router(wellbeing.router, prefix="/api/wellbeing", tags=["wellbeing"])

# Personalised journal: prompts, weekly review, mood trend, streak
app.include_router(journal.router, prefix="/api/journal", tags=["journal"])

# Consensual read-only guardian view (codes, sections, reports)
app.include_router(guardian.router, prefix="/api/guardian", tags=["guardian"])

# Server-side mirrors: recurring sessions, validated session moves,
# chapter → tasks (study plan + to-do list)
app.include_router(creating.router, prefix="/api/creating", tags=["creating"])


@app.get("/health")
def health():
    return {"status": "ok"}
