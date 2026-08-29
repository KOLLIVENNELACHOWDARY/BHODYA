"""Feature 23: Suggestions & reviews"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.supabase_client import supabase

router = APIRouter()


class ReviewRequest(BaseModel):
    user_id: str
    feature: str
    rating: int
    comment: str | None = None


@router.post("/")
def submit_review(req: ReviewRequest):
    result = supabase.table("reviews").insert(req.model_dump()).execute()
    return result.data
