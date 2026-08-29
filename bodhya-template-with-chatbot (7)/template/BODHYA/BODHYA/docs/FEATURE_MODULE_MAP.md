# Feature → Module Map

Fill in "Owner" with names. This table is the single source of truth for
who owns what — check it before starting work so two people don't build
the same thing.

| # | Feature (from planning notes) | Frontend folder | Backend piece | Owner | Status |
|---|---|---|---|---|---|
| 1 | Login / signup | `features/auth` | Supabase Auth (no FastAPI needed) | | |
| 2 | Age-adaptive dashboard | `features/dashboard` | Supabase read | | |
| 3 | Onboarding tour (avatar/robot guide) | `features/onboarding-tour` | — | | |
| 4 | Personal knowledge graph | `features/knowledge-graph` | `routers/knowledge_graph.py` | | |
| 5 | Agentic Socratic dialogue | `features/tutor-chat` | `routers/tutor_chat.py` | | |
| 6 | Character explainers (choose a character to explain a topic) | `features/tutor-chat` | `routers/tutor_chat.py` | | |
| 7 | Chatbot + avatar tour | `features/tutor-chat` | `routers/tutor_chat.py` | | |
| 8 | Animated / interactive 8-bit explainer model | `features/tutor-chat` | `routers/tutor_chat.py` | | |
| 9 | Gamified quizzes ("Boss Battle") | `features/quizzes-boss-battle` | `routers/quizzes.py` | | |
| 10 | Tests, asked by avatar/character | `features/tests-assessment` | `routers/assessment.py` | | |
| 11 | Long/SAQ question generation from sources | `features/tests-assessment` | `routers/assessment.py` | | |
| 12 | Quick revision: mindmaps, flashcards | `features/revision-tools` | `routers/revision_tools.py` | | |
| 13 | Study schedule generator | `features/study-schedule` | `routers/study_schedule.py` | | |
| 14 | To-do list | `features/todo-list` | Supabase only | | |
| 15 | Time tracking | `features/time-tracking` | Supabase only | | |
| 16 | Upload PDFs/docs/images + query (RAG) | `features/file-upload-rag` | `routers/rag.py` | | |
| 17 | Dividing reliable study material (curation from webscrapes/books) | `features/file-upload-rag` | `routers/rag.py` | | |
| 18 | Real-time collaborative research rooms | `features/collab-rooms` | `routers/collab_rooms.py` + Supabase Realtime | | |
| 19 | Streaks / consistency (notifications, streak) | `features/gamification-streaks` | `routers/gamification.py` | | |
| 20 | Rewards & stickers (points → stickers) | `features/gamification-streaks` | `routers/gamification.py` | | |
| 21 | Progress tracking | `features/dashboard` | Supabase read | | |
| 22 | Lock system / emergency contacts | `features/parental-lock` | Supabase only | | |
| 23 | Suggestions & reviews | `features/reviews-feedback` | `routers/reviews.py` | | |

| 24 | Guide chatbot (offline stuck-help, idle reminders, app tour) | `features/chatbot` | `routers/chatbot_guide.py` | | ✅ Built |

| 25 | Tabbed interface for all features + guided tab-to-tab tour | `features/app-shell` + `features/chatbot` tour | `routers/chatbot_guide.py` | | ✅ Built |

Notes:
- Rows with "Supabase only" need **no FastAPI code** — just call the
  Supabase JS client directly from the frontend feature folder.
- Features 4–11 share one backend router group because they're all
  "the AI tutor talking to the user" — split further if it gets crowded.
