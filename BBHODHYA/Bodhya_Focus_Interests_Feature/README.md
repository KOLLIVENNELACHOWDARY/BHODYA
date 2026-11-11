# Bodhya — Focus & Interests

## Integration Steps

### 1. Copy the feature

Copy the contents of this folder into:

`frontend/src/features/focus-support/`

The React files (`FocusSupportProvider.jsx`, `FocusSupportPage.jsx`, `FocusSupportNudge.jsx`, `FocusSupportContext.js`, `focusSupportLogic.js`, `api.js`, and `index.jsx`) belong directly in that folder.

### 2. Add the provider

Import:

```jsx
import { FocusSupportProvider } from "./features/focus-support";
```

Wrap the app shell with the provider and pass Bodhya's actual active tab identifier:

```jsx
<FocusSupportProvider activeTab={activeTab}>
  <AppShell />
</FocusSupportProvider>
```

This provider does not use React Router hooks, so it can be placed wherever it fits the existing provider tree. Connect `startSession()` and `stopSession()` from `useFocusSupport()` to the existing Focus Timer's start/stop actions. The monitor stays inactive until the student opts in and starts a session.

### 3. Add the settings page

Import:

```jsx
import { FocusSupportPage } from "./features/focus-support";
```

Add a page or tab branch using Bodhya's existing navigation pattern. Example:

```jsx
{activeTab === "focus-support" ? <FocusSupportPage lang={lang} /> : /* existing branches */}
```

Do not overwrite the existing `IdleNudge` blindly. Bodhya already has a basic idle nudge; avoid showing both nudges for the same event. Use the new feature as the interest-aware, configurable re-engagement layer.

### 4. Optional backend endpoint

The frontend has a local fallback. The optional FastAPI endpoint only provides generic activity suggestions; it does not store study sessions or child activity.

From this folder:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements-focus-support.txt
uvicorn standalone:app --reload
```

Endpoint:
`GET http://127.0.0.1:8000/api/focus-support/activities?interest=games&subject=math`

To mount it in Bodhya's existing backend, copy `backend/focus_support.py` to `backend/app/routers/focus_support.py` and register it in `backend/app/main.py`:

```python
from app.routers import focus_support
app.include_router(focus_support.router, prefix="/api/focus-support", tags=["focus-support"])
```

### 5. Privacy and behavior

- Opt-in only; monitoring starts only during an explicitly started focus session.
- Uses in-app signals: inactivity, browser tab hidden/returned, and frequent Bodhya tab changes when `activeTab` is supplied.
- No webcam, microphone, emotion recognition, keystroke logging, or monitoring of other applications/sites.
- Does not create a distraction score or automatically report to a guardian.
- Student interest preferences stay in local storage by default.
- Gentle, dismissible notices have cooldowns to avoid nagging.

### 6. Optional tests

```bash
python -m pip install -r backend/requirements-focus-support.txt pytest httpx
pytest -q backend/tests
```

No database migration or new frontend dependency is required.

### 7. Triggering a helpful change of approach

Existing Bodhya flows can dispatch an explicit event:

```js
window.dispatchEvent(new CustomEvent("bodhya:focus-support-signal", {
  detail: { signal: "stuck", subject: "math" }
}));
```

Supported signal names: `stuck`, `long_session`, `student_requested`, `idle`, `returned`, `frequent_switches`. Emit these only from an actual app event or a user-visible flow. Do not infer the child's emotional state.
