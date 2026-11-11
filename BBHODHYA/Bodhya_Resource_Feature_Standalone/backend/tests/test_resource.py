import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("BODHYA_RESOURCE_DB_PATH", str(tmp_path / "resources.sqlite3"))
    monkeypatch.setenv("RESOURCE_ADMIN_TOKEN", "test-secret-for-resource-tests")
    from app.routers.resource import router, init_db
    init_db()
    app = FastAPI()
    app.include_router(router, prefix="/api/resources")
    return TestClient(app)


def test_seed_catalogue_has_approved_sources(client):
    response = client.get("/api/resources/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 10
    assert all(item["verification_status"] == "approved" for item in payload["items"])
    assert any(item["resource_type"] == "book" for item in payload["items"])


def test_new_resource_is_hidden_until_approved(client):
    headers = {"X-Admin-Token": "test-secret-for-resource-tests"}
    payload = {
        "title": "Test resource about robotics",
        "description": "A test-only record.",
        "subject": "Engineering",
        "topic": "Robotics",
        "academic_level": "Undergraduate",
        "resource_type": "article",
        "source_name": "Test Publisher",
        "source_url": "https://example.edu/test-resource-robotics",
        "license_notes": "Check the original licence.",
        "language": "English",
        "tags": ["robotics", "test"],
    }
    created = client.post("/api/resources/admin/resources", json=payload, headers=headers)
    assert created.status_code == 201
    resource_id = created.json()["id"]
    visible = client.get("/api/resources/", params={"q": "Test resource about robotics"}).json()
    assert visible["count"] == 0

    review = client.patch(
        f"/api/resources/admin/resources/{resource_id}/review",
        json={"verification_status": "approved", "review_notes": "Checked in test."},
        headers=headers,
    )
    assert review.status_code == 200
    visible = client.get("/api/resources/", params={"q": "Test resource about robotics"}).json()
    assert visible["count"] == 1
    assert visible["items"][0]["id"] == resource_id


def test_curator_routes_require_token(client):
    response = client.post("/api/resources/admin/scrape-preview", json={"url": "https://example.com"})
    assert response.status_code == 401


def test_scraper_blocks_non_allowlisted_domain_without_fetch(client):
    response = client.post(
        "/api/resources/admin/scrape-preview",
        json={"url": "https://example.com/"},
        headers={"X-Admin-Token": "test-secret-for-resource-tests"},
    )
    assert response.status_code == 400
    assert "approved scrape domain list" in response.json()["detail"]


def test_resource_url_must_be_https(client):
    headers = {"X-Admin-Token": "test-secret-for-resource-tests"}
    payload = {
        "title": "Test insecure resource",
        "subject": "Science",
        "resource_type": "article",
        "source_name": "Test source",
        "source_url": "http://example.edu/test",
    }
    response = client.post("/api/resources/admin/resources", json=payload, headers=headers)
    assert response.status_code == 422
