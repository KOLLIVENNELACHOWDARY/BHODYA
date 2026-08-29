"""Feature 12: Quick revision — mindmaps, flashcards"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.services import llm_router

router = APIRouter()


class RevisionRequest(BaseModel):
    topic: str
    source_text: str | None = None
    format: str = "flashcards"   # "flashcards" | "mindmap"


@router.post("/generate")
async def generate_revision(req: RevisionRequest):
    if req.format == "flashcards":
        prompt = f"Create 10 flashcards (Q&A pairs) for revising: {req.topic}"
    else:
        prompt = f"Create a text-based mindmap (nested bullet outline) for: {req.topic}"
    if req.source_text:
        prompt += f"\nBase it on this material:\n{req.source_text}"
    content = await llm_router.generate(prompt)
    return {"format": req.format, "content": content}
