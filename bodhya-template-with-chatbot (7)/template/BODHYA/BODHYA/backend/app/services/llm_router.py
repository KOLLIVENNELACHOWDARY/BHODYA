"""
Free-tier LLM routing: try Groq first (fast, generous free tier), fall
back to Gemini if it fails or is rate-limited. Every feature that needs
an LLM call (tutor chat, quiz generation, RAG answers, SAQ grading)
should go through this one function instead of calling a provider
directly — it keeps provider swaps/outages from touching feature code.

Fill in the actual API calls with httpx once you have your keys —
left as a clear stub so this is a 10-minute task per provider.
"""
import httpx
from app.core.config import GROQ_API_KEY, GEMINI_API_KEY


async def generate(prompt: str, system: str | None = None) -> str:
    try:
        return await _call_groq(prompt, system)
    except Exception:
        return await _call_gemini(prompt, system)


async def _call_groq(prompt: str, system: str | None) -> str:
    # TODO: implement Groq chat completion call using GROQ_API_KEY
    raise NotImplementedError


async def _call_gemini(prompt: str, system: str | None) -> str:
    # TODO: implement Gemini call using GEMINI_API_KEY
    raise NotImplementedError
