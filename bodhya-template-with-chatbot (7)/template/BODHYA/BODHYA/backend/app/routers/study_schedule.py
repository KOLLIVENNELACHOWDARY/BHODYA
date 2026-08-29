"""Feature 13: Study schedule generator"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.supabase_client import supabase

router = APIRouter()


class ScheduleRequest(BaseModel):
    user_id: str
    topics: list[str]
    days_available: int
    minutes_per_day: int


@router.post("/generate")
def generate_schedule(req: ScheduleRequest):
    # Simple even-split scheduler — swap for something smarter
    # (e.g. weighting by knowledge_nodes.mastery_level) once feature 4 exists.
    per_topic_minutes = (req.days_available * req.minutes_per_day) // max(len(req.topics), 1)
    items = [{"topic": t, "duration_minutes": per_topic_minutes} for t in req.topics]
    for item in items:
        supabase.table("study_schedule_items").insert(
            {"user_id": req.user_id, "topic": item["topic"], "duration_minutes": item["duration_minutes"]}
        ).execute()
    return {"schedule": items}
