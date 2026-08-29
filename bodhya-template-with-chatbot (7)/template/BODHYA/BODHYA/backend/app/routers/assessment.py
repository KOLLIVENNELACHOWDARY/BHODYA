"""Features 10-11: Tests asked by avatar/character, long/SAQ generation."""
from fastapi import APIRouter
from pydantic import BaseModel
from app.services import llm_router

router = APIRouter()


class TestRequest(BaseModel):
    topic: str
    persona: str = "professional"   # avatar / anime character / professional
    question_type: str = "mcq"      # "mcq" | "short_answer" | "long_answer"


@router.post("/generate")
async def generate_test(req: TestRequest):
    system = (
        f"You are role-playing as {req.persona}, giving a {req.question_type} "
        f"test on {req.topic}. Ask one question at a time."
    )
    question = await llm_router.generate(f"Generate a {req.question_type} question.", system=system)
    return {"question": question}


class GradeRequest(BaseModel):
    question: str
    student_answer: str
    reference_material: str | None = None


@router.post("/grade")
async def grade_answer(req: GradeRequest):
    prompt = (
        f"Question: {req.question}\nStudent answer: {req.student_answer}\n"
        f"Reference material: {req.reference_material or 'none provided'}\n"
        "Grade the answer and explain what's missing."
    )
    feedback = await llm_router.generate(prompt)
    return {"feedback": feedback}
