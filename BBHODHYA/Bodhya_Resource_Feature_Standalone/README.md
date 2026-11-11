# Bodhya — Resource feature (standalone)

This package contains **only the Resource feature**. It is not merged into, and does not overwrite, `bodhya-full-features.zip`.

Resource means one place for study material and resource discovery: books, textbooks, lecture notes, courses, videos, practice, articles, research papers, interactive content and trusted learning portals.

## What is included

- Searchable catalogue with subject and resource-type filters.
- Curated starter links to established educational/resource portals.
- Book search through Open Library's bibliographic search API. This returns book metadata and original record links; it does not download book files.
- Curator-only webpage metadata preview (the scraping capability). It uses an allowlist, HTTPS-only URLs, public-IP checks, robots.txt checks, redirects are revalidated, page size is capped at 2 MB, and HTML is processed one page at a time.
- Curator form to add resource metadata and a link to the pending queue.
- Review queue to approve or reject entries. Public catalogue endpoints show approved records only.
- Local-device bookmarks in the frontend.
- A separate SQLite catalogue (`resource_catalog.sqlite3`) and tests.

## Folder contents

```text
frontend/src/features/resource/
  ResourcePage.jsx
  index.jsx
  api.js
  starterResources.js
backend/app/routers/resource.py
backend/requirements-resource.txt
backend/.env.resource.example
backend/tests/test_resource.py
```

## Run the backend locally for testing

From the `backend` folder in this package:

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements-resource.txt
```

Set a backend-only curator token. Windows PowerShell:

```powershell
$env:RESOURCE_ADMIN_TOKEN = "replace-with-a-long-random-secret"
uvicorn app.main:app --reload
```

For this standalone folder, create a temporary `app/main.py` if running by itself:

```python
from fastapi import FastAPI
from app.routers.resource import router, init_db

app = FastAPI(title="Bodhya Resource API")
app.include_router(router, prefix="/api/resources", tags=["resource"])

@app.on_event("startup")
def startup():
    init_db()
```

The production Bodhya backend already has `backend/app/main.py`; the feature ZIP intentionally does not replace it. See “Integrate into Bodhya” below to add the router there.

## Run the frontend in Bodhya

The component uses the React 18 / Vite / Tailwind setup already in Bodhya. Copy this feature folder into:

`frontend/src/features/resource/`

For local development, add `VITE_BODHYA_API_URL=http://127.0.0.1:8000` to `frontend/.env.local` if the frontend and backend use separate ports.

The browse page still works from the embedded starter catalogue when the backend is offline. Live book lookup, webpage preview and curator review require the backend.

## Integrate into Bodhya manually (no other files are included here)

1. Copy `frontend/src/features/resource/` into Bodhya's `frontend/src/features/` directory.
2. Copy `backend/app/routers/resource.py` into Bodhya's `backend/app/routers/resource.py`.
3. Install `backend/requirements-resource.txt`'s packages in the backend environment (`requests` and `beautifulsoup4`; FastAPI and Pydantic are already used by Bodhya).
4. Set `RESOURCE_ADMIN_TOKEN` in the backend environment. Keep it on the server only; never put it in `VITE_*` frontend variables.
5. In Bodhya's `backend/app/main.py`, import `resource` from `app.routers` and add:

   ```python
   app.include_router(resource.router, prefix="/api/resources", tags=["resource"])
   ```

   The router initialises its own SQLite catalogue on startup.
6. In `frontend/src/features/app-shell/AppShell.jsx`, add:

   ```jsx
   import ResourcePage from "../resource/ResourcePage.jsx";
   ```

   Then add a render branch before the final fallback:

   ```jsx
   ) : activeTab === "resource" ? (
     <ResourcePage lang={lang} />
   ) : (
     <FeaturePage tab={active} lang={lang} />
   )}
   ```

7. Add one new tab object with `id: "resource"` and `title.en: "Resource"` to `frontend/src/features/app-shell/tabConfig.js`. The app-shell and tab config are deliberately not changed in this feature-only package.
8. Start the app and test search, book lookup, curator token, scraping preview, duplicate URLs and approval before exposing it to students.

## Web scraping and book-rights guardrails

- This is **metadata discovery**, not a bulk crawler. A curator initiates a single-page preview at a time.
- Default scraper allowlist includes selected education and open-resource domains. To add a domain, configure `RESOURCE_SCRAPE_ALLOWED_DOMAINS` on the backend as comma-separated host names.
- Scrape-preview returns a short text excerpt for human review only. It does not save the excerpt or full body into the catalogue.
- PDFs, EPUBs and books are not downloaded. Book search returns bibliographic metadata and a link to the original record. Full-text access depends on the source and title's rights status.
- A URL in the catalogue is not automatically an endorsement. A curator should check accuracy, level, source quality, current availability and licence before approval.
- Do not expose the curator endpoints directly to anonymous users without adding suitable authentication, rate limiting and audit logging.

## Tests

From this feature package root:

```bash
python -m pip install -r backend/requirements-resource.txt pytest httpx
pytest -q backend/tests
```

The tests use a temporary SQLite database and do not crawl external websites.
