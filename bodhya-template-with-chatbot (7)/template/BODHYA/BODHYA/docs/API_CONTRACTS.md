# API Contracts

Each feature owner adds a section here describing their endpoint(s) so the
frontend side knows exactly what to send/expect. Copy this template:

## Feature: <name>

**Endpoint:** `POST /api/<router>/<action>`

**Request body:**
```json
{
  "example_field": "value"
}
```

**Response:**
```json
{
  "example_field": "value"
}
```

**Notes:** any auth requirements, rate limits, or edge cases.

---
## Feature: Bodhya Guide Chatbot (chatbot)

The conversational brain runs **fully in the browser** (no API keys).
These endpoints are for status/analytics/help-copy only.

**Endpoint:** `GET /api/chatbot-guide/status`

**Response:**
```json
{
  "module": "bodhya-chatbot-guide",
  "mode": "offline-frontend",
  "api_keys_required": false,
  "features": ["stuck-help", "guided-tour", "idle-reminders", "voice-input", "voice-output", "multi-language"],
  "languages": ["en", "hi", "te"]
}
```

**Endpoint:** `POST /api/chatbot-guide/classify`

**Request body:**
```json
{ "text": "I'm stuck on this page" }
```

**Response:**
```json
{ "intent": "stuck", "handled_by": "frontend (no API keys)" }
```

Intents: `stuck | tour | help | planner_add | planner_show | quiz_start | quiz_info | progress_info | explain_redirect | capabilities | greet | fallback`

**Endpoint:** `GET /api/chatbot-guide/help/{page_id}?lang=en`

page_id: `home | quiz | planner | progress | settings` · lang: `en | hi | te`

**Response:**
```json
{ "page": "quiz", "help": "Quiz Arena: press Start Boss Battle — ...", "lang": "en" }
```

page_id now accepts ANY tab id from the app shell (`home | quiz | tests | planner | todo | time | knowledge | tutor | revision | rag | rooms | rewards | reviews | safety`) — unknown ids return a generic guide message (`"generic": true`).

---
