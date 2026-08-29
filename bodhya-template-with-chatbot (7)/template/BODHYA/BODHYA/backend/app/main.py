from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    knowledge_graph,
    tutor_chat,
    quizzes,
    assessment,
    revision_tools,
    study_schedule,
    rag,
    collab_rooms,
    gamification,
    reviews,
    chatbot_guide,
)

app = FastAPI(title="AI Learning Companion — AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register each feature's router here — one line per feature.
# Add a new router by creating a file in app/routers/ and importing it above.
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["knowledge-graph"])
app.include_router(tutor_chat.router, prefix="/api/tutor-chat", tags=["tutor-chat"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["assessment"])
app.include_router(revision_tools.router, prefix="/api/revision-tools", tags=["revision-tools"])
app.include_router(study_schedule.router, prefix="/api/study-schedule", tags=["study-schedule"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(collab_rooms.router, prefix="/api/collab-rooms", tags=["collab-rooms"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["gamification"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(chatbot_guide.router, prefix="/api/chatbot-guide", tags=["chatbot-guide"])


@app.get("/health")
def health():
    return {"status": "ok"}
