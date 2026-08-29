"""
Features 5-8: Agentic Socratic dialogue, character-based explainers,
chatbot + avatar tour, animated/8-bit interactive explainer.

All of these are "the AI tutor talking to the user" — they share one
router but each has its own endpoint/prompt style below.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.services import llm_router

router = APIRouter()


class ChatRequest(BaseModel):
    user_id: str
    message: str
    character: str | None = None   # e.g. "spiderman", "naruto" — feature 6
    age_band: str = "teen"


SOCRATIC_SYSTEM_PROMPT = (
    "You are a Socratic tutor. Never give the answer directly — ask "
    "guiding questions that lead the student to discover it themselves."
)


@router.post("/socratic")
async def socratic_dialogue(req: ChatRequest):
    reply = await llm_router.generate(req.message, system=SOCRATIC_SYSTEM_PROMPT)
    return {"reply": reply}


@router.post("/character-explain")
async def character_explain(req: ChatRequest):
    system = (
        f"Explain the topic in the voice and personality of {req.character}, "
        f"adapted for a {req.age_band} audience. Stay in character."
    )
    reply = await llm_router.generate(req.message, system=system)
    return {"reply": reply, "character": req.character}


@router.post("/chat")
async def chatbot(req: ChatRequest):
    """General chatbot behind the avatar/robot tour guide."""
    reply = await llm_router.generate(req.message)
    return {"reply": reply}
