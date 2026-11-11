"""Generic interest-based study activities. No user/session data is persisted."""
from __future__ import annotations

from typing import Literal
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter()

INTERESTS = {
    "games": {"label": "Games", "emoji": "🎮"},
    "sports": {"label": "Sports", "emoji": "⚽"},
    "music": {"label": "Music", "emoji": "🎵"},
    "art": {"label": "Art & design", "emoji": "🎨"},
    "animals": {"label": "Animals & nature", "emoji": "🐾"},
    "space": {"label": "Space", "emoji": "🚀"},
    "coding": {"label": "Coding & technology", "emoji": "💻"},
    "stories": {"label": "Stories", "emoji": "📚"},
    "puzzles": {"label": "Puzzles", "emoji": "🧩"},
    "business": {"label": "Business & money", "emoji": "💡"},
}

SUBJECT_EXAMPLES = {
    "math": {
        "games": "Treat the next problem like one game level: solve just the first step.",
        "sports": "Use a score or average to connect the formula to a sports result.",
        "music": "Think of fractions as parts of a beat or bar of music.",
        "art": "Sketch the problem as a small visual before calculating.",
        "animals": "Use a simple animal-counting or habitat example for the numbers.",
        "space": "Use a planet distance or orbit example to make the numbers concrete.",
        "coding": "Write the calculation as a tiny function and test one input.",
        "stories": "Turn the question into a two-sentence story with knowns and unknowns.",
        "puzzles": "Find one clue first; ignore the rest until that step is solved.",
        "business": "Connect percentages to a simple budget, price change or discount.",
    },
    "science": {
        "games": "Turn the concept into a quick predict-and-check challenge.",
        "sports": "Relate the concept to movement, energy or recovery in sport.",
        "music": "Look for patterns, waves or vibrations in the topic.",
        "art": "Draw the process as three simple shapes with arrows.",
        "animals": "Choose one animal and explain how the concept affects it.",
        "space": "Imagine how the concept appears on a planet or in space.",
        "coding": "Describe the process as input → steps → output.",
        "stories": "Explain the concept as a cause-and-effect mini story.",
        "puzzles": "Make one prediction, then use the evidence to check it.",
        "business": "Find one real-world product or invention that uses the concept.",
    },
    "coding": {
        "games": "Treat the bug as a level: reproduce it, change one thing, test again.",
        "sports": "Debug like reviewing a play: find the first moment the result changes.",
        "music": "Think of each function as a repeated musical phrase with one job.",
        "art": "Draw the data flow before writing the next lines.",
        "animals": "Model a simple animal or habitat with a small class or object.",
        "space": "Trace how one data packet or value travels through the system.",
        "coding": "Run the smallest example and inspect one variable at a time.",
        "stories": "Explain what each line does as a sequence of story events.",
        "puzzles": "Write down the expected output, then test one small case.",
        "business": "Think of the function as a tiny workflow that saves one manual step.",
    },
    "reading": {
        "games": "Read one page as a short quest; collect one key idea.",
        "sports": "Look for the main claim and the evidence that supports it.",
        "music": "Notice the rhythm of the argument: claim, evidence, conclusion.",
        "art": "Make a one-line visual summary of the page.",
        "animals": "Choose one detail that helps explain the subject in real life.",
        "space": "Connect one unfamiliar term to a clear example or image.",
        "coding": "Turn the paragraph into a three-step algorithm in plain English.",
        "stories": "Summarise the page as beginning, key idea, takeaway.",
        "puzzles": "Read the question first, then look for the sentence that answers it.",
        "business": "Identify the main point, the evidence and the practical implication.",
    },
}

ACTIVITIES = [
    {"id": "tiny-step", "kind": "start", "title": "Make it smaller", "message": "Choose the smallest useful next step and work on it for just two minutes.", "action": "start_two_minutes", "interests": list(INTERESTS)},
    {"id": "micro-reset", "kind": "reset", "title": "Take a quick reset", "message": "Look away from the screen, roll your shoulders, and take three slow breaths. Then choose what comes next.", "action": "take_reset", "interests": list(INTERESTS)},
    {"id": "change-format", "kind": "switch", "title": "Try a different format", "message": "Switch from reading to one practice question, a diagram, or explaining the idea aloud.", "action": "change_format", "interests": list(INTERESTS)},
    {"id": "interest-link", "kind": "interest", "title": "Connect it to what you like", "message": "Use a familiar interest to make the next example feel more concrete.", "action": "show_interest_example", "interests": list(INTERESTS)},
]

Signal = Literal["idle", "returned", "frequent_switches", "stuck", "long_session", "student_requested"]

class RecommendationRequest(BaseModel):
    signal: Signal
    interest: str = Field(default="puzzles", max_length=30)
    subject: str = Field(default="study", max_length=40)

@router.get("/activities")
def list_activities(
    interest: str = Query(default="puzzles", max_length=30),
    subject: str = Query(default="study", max_length=40),
):
    safe_interest = interest.lower().strip() if interest.lower().strip() in INTERESTS else "puzzles"
    safe_subject = subject.lower().strip() if subject.lower().strip() in SUBJECT_EXAMPLES else "study"
    result = []
    for item in ACTIVITIES:
        copy = dict(item)
        copy["interest"] = INTERESTS[safe_interest]
        copy["subject_example"] = SUBJECT_EXAMPLES.get(safe_subject, {}).get(
            safe_interest,
            f"Use {INTERESTS[safe_interest]['label'].lower()} as a familiar example for one small step in this topic.",
        )
        result.append(copy)
    return {"activities": result, "interest": safe_interest, "subject": safe_subject, "privacy": "No session signals or personal activity are stored by this endpoint."}

@router.post("/recommendation")
def get_recommendation(payload: RecommendationRequest):
    interest = payload.interest.lower().strip()
    if interest not in INTERESTS:
        interest = "puzzles"
    subject = payload.subject.lower().strip()
    if subject not in SUBJECT_EXAMPLES:
        subject = "study"

    if payload.signal == "idle":
        choice_id = "tiny-step"
    elif payload.signal == "returned":
        choice_id = "change-format"
    elif payload.signal == "frequent_switches":
        choice_id = "tiny-step"
    elif payload.signal == "stuck":
        choice_id = "change-format"
    elif payload.signal == "long_session":
        choice_id = "micro-reset"
    else:
        choice_id = "interest-link"

    item = next(x for x in ACTIVITIES if x["id"] == choice_id)
    example = SUBJECT_EXAMPLES.get(subject, {}).get(
        interest,
        f"Use {INTERESTS[interest]['label'].lower()} as a familiar example for one small step in this topic.",
    )
    return {
        **item,
        "signal": payload.signal,
        "interest": INTERESTS[interest],
        "subject": subject,
        "subject_example": example,
        "dismissible": True,
        "privacy": "This request is answered without saving a student profile or focus event.",
    }
