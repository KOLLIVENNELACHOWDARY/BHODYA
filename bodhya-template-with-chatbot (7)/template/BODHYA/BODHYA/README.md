# AI Learning Companion — Team Starter

A gamified, AI-tutor learning platform: character-led explainers, agentic
Socratic dialogue, a personal knowledge graph, boss-battle quizzes,
real-time study rooms, streaks/rewards, and a document-aware chatbot.

This repo is deliberately split into **small, independent feature folders**
so each person on the team can work in their own folder without stepping on
anyone else's code. Nobody needs to touch `main.jsx` or `main.py` to add a
feature — you register your piece and build inside your own folder.

## Stack (and why)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast dev server, huge component ecosystem, easy for multiple people to work in parallel via `src/features/*` |
| Backend (AI logic) | FastAPI (Python) | Best ecosystem for LLM calls, RAG, WebSockets, background jobs |
| Auth + Database + Storage + Realtime | Supabase (Postgres) | One free service gives you login/signup, a real Postgres DB, file storage (for PDF/image uploads), row-level security, AND realtime channels (for the collaborative rooms) — so nobody has to hand-build auth or a WebSocket server from scratch |
| LLM calls | Free-tier routing (Groq → Gemini fallback) | Keeps the project free to run; see `backend/app/services/llm_router.py` |
| Vector search (RAG) | Postgres `pgvector` extension inside Supabase | No separate vector DB to host |

You do **not** need to run your own database server or write your own auth
system — Supabase gives you that for free. FastAPI only needs to exist for
the parts that require real AI logic (chat, quiz generation, the knowledge
graph, RAG, realtime room broadcast helpers).

## Repo layout

```
ai-learning-companion/
├── frontend/         React app — see frontend/README (below)
├── backend/          FastAPI app — the AI/logic service
├── supabase/         DB schema (migrations) — run once, shared by everyone
└── docs/             Feature-to-owner map + API contracts
```

## Getting started

1. One person creates a free project at supabase.com, and shares the
   `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` with
   the team (put them in `.env`, never commit `.env`).
2. Run the schema in `supabase/migrations/0001_init.sql` once, in the
   Supabase SQL editor.
3. Backend:
   ```bash
   cd backend
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp ../.env.example .env   # fill in keys
   uvicorn app.main:app --reload
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   cp .env.example .env      # fill in keys
   npm run dev
   ```

## How to add your feature

1. Find your feature in `docs/FEATURE_MODULE_MAP.md`.
2. Frontend: build inside `frontend/src/features/<your-feature>/` — put
   components, hooks, and API calls there. Export one main component.
3. Backend: extend the matching router in `backend/app/routers/`, or add a
   new one and register it in `backend/app/main.py` (one line).
4. Write your request/response shape at the top of your router file and
   mirror it in `docs/API_CONTRACTS.md` so the frontend person on your
   feature knows exactly what to call.
5. Open a PR touching **only your feature folder + your router file** —
   this is what keeps merge conflicts near zero.
