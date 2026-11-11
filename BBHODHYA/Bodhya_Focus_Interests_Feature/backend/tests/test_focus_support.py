from fastapi.testclient import TestClient
from standalone import app

client = TestClient(app)


def test_activities_returns_safe_catalogue():
    response = client.get("/api/focus-support/activities", params={"interest": "sports", "subject": "math"})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["activities"]) >= 3
    assert payload["interest"] == "sports"
    assert "score" not in payload
    assert "No session signals" in payload["privacy"]
    assert any("sports" in item["subject_example"].lower() for item in payload["activities"])


def test_invalid_interest_falls_back_safely():
    response = client.get("/api/focus-support/activities", params={"interest": "unknown"})
    assert response.status_code == 200
    assert response.json()["interest"] == "puzzles"


def test_recommendation_for_idle_signal():
    response = client.post("/api/focus-support/recommendation", json={"signal": "idle", "interest": "games", "subject": "coding"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "tiny-step"
    assert payload["dismissible"] is True
    assert "game" in payload["subject_example"].lower() or "level" in payload["subject_example"].lower()
    assert "without saving" in payload["privacy"]


def test_long_session_recommends_reset():
    response = client.post("/api/focus-support/recommendation", json={"signal": "long_session", "interest": "space", "subject": "science"})
    assert response.status_code == 200
    assert response.json()["id"] == "micro-reset"
