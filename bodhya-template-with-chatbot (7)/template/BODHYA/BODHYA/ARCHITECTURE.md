# Architecture

## Three pieces, talking to each other

```
┌─────────────────┐        direct (auth, db reads, storage, realtime)
│   React frontend │ ───────────────────────────────────┐
│   (Vite)          │                                     ▼
└─────────┬────────┘                              ┌──────────────┐
          │  AI/logic calls (chat, quiz gen,       │   Supabase   │
          │  knowledge graph, RAG, room broadcast) │  Postgres +  │
          ▼                                          │  Auth +      │
┌──────────────────┐   reads/writes via service key   │  Storage +   │
│  FastAPI backend  │ ─────────────────────────────▶ │  Realtime    │
│  ("AI service")    │                                 └──────────────┘
└─────────┬─────────┘
          │
          ▼
   Groq / Gemini (free-tier LLM calls, with fallback)
```

## Why split it this way

- The **frontend talks to Supabase directly** for anything that's just
  CRUD or auth (login, reading your own todos, your streak count, uploading
  a file to storage, subscribing to a realtime room channel). This avoids
  writing a backend endpoint for every simple database read.
- The **frontend talks to FastAPI** only when something needs actual AI
  reasoning: generating a quiz, running the Socratic dialogue, answering a
  RAG query over uploaded documents, updating the knowledge graph, or
  grading a long-answer question. FastAPI then reads/writes to the same
  Supabase Postgres database using the service role key.
- This means most feature folders only need **one** of the two — e.g. the
  to-do list feature is Supabase-only (no FastAPI code needed at all),
  while the tutor-chat feature is FastAPI-heavy.

## Data model (see `supabase/migrations/0001_init.sql`)

Core tables: `profiles`, `streaks`, `sticker_rewards`, `knowledge_nodes`,
`knowledge_edges`, `quiz_questions`, `quiz_attempts`, `study_rooms`,
`room_messages`, `uploaded_documents`, `document_chunks` (pgvector),
`todos`, `study_schedule_items`, `reviews`.

## Age-adaptive UI

The dashboard reads an `age_band` field on `profiles` (child / teen / adult)
and the frontend's `AgeContext` swaps which components render — the same
data, different explanation depth/visual style. Keep this logic in
`frontend/src/context/AgeContext.jsx` rather than duplicating age checks
inside every feature.
