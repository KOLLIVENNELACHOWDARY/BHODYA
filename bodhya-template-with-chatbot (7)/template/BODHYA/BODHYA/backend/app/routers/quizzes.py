"""Feature 9: Gamified quizzes ("Boss Battle")"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.supabase_client import supabase

router = APIRouter()


class AttemptRequest(BaseModel):
    user_id: str
    question_id: int
    submitted_answer: str


@router.get("/{topic}")
def get_quiz(topic: str, difficulty: str = "easy"):
    result = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("topic", topic)
        .eq("difficulty", difficulty)
        .execute()
    )
    return result.data


@router.post("/attempt")
def submit_attempt(req: AttemptRequest):
    q = supabase.table("quiz_questions").select("answer").eq("id", req.question_id).single().execute()
    correct = q.data["answer"].strip().lower() == req.submitted_answer.strip().lower()
    supabase.table("quiz_attempts").insert(
        {"user_id": req.user_id, "question_id": req.question_id, "correct": correct}
    ).execute()
    return {"correct": correct}
