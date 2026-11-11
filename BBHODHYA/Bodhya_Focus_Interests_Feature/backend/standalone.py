"""Standalone development app for Bodhya Focus & Interests."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.focus_support import router

app = FastAPI(title="Bodhya Focus & Interests API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.include_router(router, prefix="/api/focus-support", tags=["focus-support"])

@app.get("/health")
def health():
    return {"status": "ok"}
