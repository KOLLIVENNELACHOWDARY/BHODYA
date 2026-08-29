"""Features 19-20: Streaks/consistency, rewards & stickers"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from app.core.supabase_client import supabase

router = APIRouter()


class CheckInRequest(BaseModel):
    user_id: str


@router.post("/check-in")
def daily_check_in(req: CheckInRequest):
    row = supabase.table("streaks").select("*").eq("user_id", req.user_id).execute()
    today = date.today().isoformat()

    if not row.data:
        supabase.table("streaks").insert(
            {"user_id": req.user_id, "current_streak": 1, "longest_streak": 1, "last_active_date": today}
        ).execute()
        return {"current_streak": 1}

    streak = row.data[0]
    new_streak = streak["current_streak"] + 1 if streak["last_active_date"] != today else streak["current_streak"]
    supabase.table("streaks").update(
        {"current_streak": new_streak, "last_active_date": today}
    ).eq("user_id", req.user_id).execute()

    # Award a sticker every 10 points earned, matching the "10k -> sticker" idea from planning notes
    if new_streak % 10 == 0:
        supabase.table("sticker_rewards").insert(
            {"user_id": req.user_id, "sticker_name": "streak_milestone", "sticker_pack": "anime"}
        ).execute()

    return {"current_streak": new_streak}
