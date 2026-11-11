"""Bodhya Resource feature: catalogue, book discovery, safe page preview and curation.

The catalogue stores metadata and original-source links. The scraper is deliberately
single-page and allowlist-based; it never crawls a site or downloads books/PDFs.
"""
from __future__ import annotations

import hmac
import ipaddress
import json
import os
import re
import socket
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
from uuid import uuid4

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter()
ResourceType = Literal[
    "book", "textbook", "notes", "course", "lecture", "video", "practice",
    "article", "research_paper", "portal", "interactive", "other"
]
VerificationStatus = Literal["pending", "approved", "rejected"]

DEFAULT_LICENSE_NOTE = "Link to the original source. Check the specific item's terms before copying or redistributing content."
DEFAULT_SCRAPE_DOMAINS = {
    "diksha.gov.in", "epathshala.nic.in", "ncert.nic.in", "swayam.gov.in",
    "nptel.ac.in", "openstax.org", "khanacademy.org", "ocw.mit.edu",
    "openlibrary.org", "gutenberg.org", "libretexts.org", "oercommons.org",
    "archive.org", "doabooks.org", "pressbooks.pub", "open.umn.edu",
}
SOURCE_NAMES = {
    "diksha.gov.in": "DIKSHA", "epathshala.nic.in": "ePathshala", "ncert.nic.in": "NCERT",
    "swayam.gov.in": "SWAYAM", "nptel.ac.in": "NPTEL", "openstax.org": "OpenStax",
    "khanacademy.org": "Khan Academy", "ocw.mit.edu": "MIT OpenCourseWare",
    "openlibrary.org": "Open Library", "gutenberg.org": "Project Gutenberg",
    "libretexts.org": "LibreTexts", "oercommons.org": "OER Commons",
    "archive.org": "Internet Archive", "doabooks.org": "Directory of Open Access Books",
    "pressbooks.pub": "Pressbooks", "open.umn.edu": "Open Textbook Library",
}

PUBLIC_FIELDS = (
    "id", "title", "description", "subject", "topic", "academic_level", "resource_type",
    "source_name", "source_url", "license_notes", "language", "tags", "verification_status",
    "reviewed_at", "created_at", "updated_at",
)
ADMIN_FIELDS = PUBLIC_FIELDS + ("review_notes",)

STARTER_RESOURCES = [
    {"title":"DIKSHA learning portal", "description":"Curriculum-linked school learning resources, lessons, videos, activities and quizzes. Select the relevant board, grade and subject.", "subject":"School Education", "topic":"Curriculum-aligned resources", "academic_level":"School", "resource_type":"portal", "source_name":"DIKSHA", "source_url":"https://diksha.gov.in/", "license_notes":"Portal link only; check item-specific reuse terms.", "language":"Multiple", "tags":["India","school","curriculum"]},
    {"title":"ePathshala digital resources", "description":"NCERT digital textbook and supplementary resource access. Choose the required class and subject.", "subject":"School Education", "topic":"Digital textbooks", "academic_level":"School", "resource_type":"textbook", "source_name":"ePathshala", "source_url":"https://epathshala.nic.in/", "license_notes":"Link-only entry. Check NCERT and item-specific reuse permissions.", "language":"Multiple", "tags":["NCERT","textbooks","India"]},
    {"title":"NCERT textbook portal", "description":"Official entry point for NCERT school textbooks by class and subject.", "subject":"School Education", "topic":"Official textbooks", "academic_level":"School", "resource_type":"textbook", "source_name":"NCERT", "source_url":"https://ncert.nic.in/textbook.php", "license_notes":"Link-only entry; do not assume every component has identical reuse rights.", "language":"Multiple", "tags":["official","textbooks"]},
    {"title":"SWAYAM online courses", "description":"Online courses spanning school, undergraduate and other learning levels. Check the current course syllabus and provider.", "subject":"General Education", "topic":"Online courses", "academic_level":"All levels", "resource_type":"course", "source_name":"SWAYAM", "source_url":"https://swayam.gov.in/", "license_notes":"Follow the current terms of each course provider.", "language":"Multiple", "tags":["India","MOOC","courses"]},
    {"title":"NPTEL engineering and science courses", "description":"Courses in engineering, technology, mathematics and science from participating Indian institutes.", "subject":"Engineering & Computer Science", "topic":"Engineering courses", "academic_level":"Undergraduate", "resource_type":"course", "source_name":"NPTEL", "source_url":"https://nptel.ac.in/", "license_notes":"Verify availability and use terms on the original course page.", "language":"English", "tags":["IIT","engineering","science"]},
    {"title":"OpenStax open textbooks", "description":"Free textbooks for selected school and university subjects. Check the licence of the specific book.", "subject":"Science & Mathematics", "topic":"Open textbooks", "academic_level":"Undergraduate", "resource_type":"book", "source_name":"OpenStax", "source_url":"https://openstax.org/subjects", "license_notes":"Check the exact book licence and attribution conditions before reuse.", "language":"English", "tags":["open textbook","science","math"]},
    {"title":"Khan Academy lessons and practice", "description":"Lessons and practice exercises in mathematics, science and other subjects.", "subject":"Multi-subject", "topic":"Lessons and practice", "academic_level":"School", "resource_type":"practice", "source_name":"Khan Academy", "source_url":"https://www.khanacademy.org/", "license_notes":"Link-only entry; follow current source terms.", "language":"Multiple", "tags":["lessons","practice","math"]},
    {"title":"MIT OpenCourseWare", "description":"University course materials, including selected lecture notes, assignments and course resources.", "subject":"Engineering & Computer Science", "topic":"University course material", "academic_level":"Undergraduate", "resource_type":"lecture", "source_name":"MIT OpenCourseWare", "source_url":"https://ocw.mit.edu/", "license_notes":"Check the licence on the relevant course or content page.", "language":"English", "tags":["MIT","university","lecture notes"]},
    {"title":"Open Library book catalogue", "description":"Search bibliographic records by title, author, subject or ISBN. Full-text access varies by title.", "subject":"Books & Reading", "topic":"Book discovery", "academic_level":"All levels", "resource_type":"book", "source_name":"Open Library", "source_url":"https://openlibrary.org/", "license_notes":"Catalogue metadata and borrowing rights are different; use only legally available copies.", "language":"Multiple", "tags":["books","catalogue","reading"]},
    {"title":"Project Gutenberg ebooks", "description":"A large ebook catalogue focused on works that are public domain in the United States. Local status may differ.", "subject":"Books & Literature", "topic":"Public-domain reading", "academic_level":"All levels", "resource_type":"book", "source_name":"Project Gutenberg", "source_url":"https://www.gutenberg.org/", "license_notes":"Check the title's notice and public-domain status in your jurisdiction.", "language":"Multiple", "tags":["books","literature","public domain"]},
    {"title":"LibreTexts learning library", "description":"Open educational textbooks and learning material across a variety of disciplines.", "subject":"Multi-subject", "topic":"Open educational resources", "academic_level":"School and university", "resource_type":"textbook", "source_name":"LibreTexts", "source_url":"https://libretexts.org/", "license_notes":"Check the licence and attribution requirements on each page or book.", "language":"English", "tags":["OER","textbooks","learning"]},
    {"title":"Open Textbook Library", "description":"Discover open textbooks used in higher education and check the linked licence for each title.", "subject":"Multi-subject", "topic":"Open textbooks", "academic_level":"Undergraduate", "resource_type":"textbook", "source_name":"Open Textbook Library", "source_url":"https://open.umn.edu/opentextbooks", "license_notes":"Verify licence, author attribution and any restrictions on the individual book.", "language":"English", "tags":["OER","college","textbooks"]},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _db_path() -> Path:
    configured = os.getenv("BODHYA_RESOURCE_DB_PATH", "").strip()
    if configured:
        return Path(configured).expanduser().resolve()
    return Path(__file__).resolve().parents[2] / "data" / "resource_catalog.sqlite3"


@contextmanager
def _connect():
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 10000")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    """Create the local catalogue and seed source links once; never overwrite edits."""
    with _connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 200),
                description TEXT NOT NULL DEFAULT '',
                subject TEXT NOT NULL,
                topic TEXT NOT NULL DEFAULT '',
                academic_level TEXT NOT NULL DEFAULT 'All levels',
                resource_type TEXT NOT NULL CHECK(resource_type IN ('book','textbook','notes','course','lecture','video','practice','article','research_paper','portal','interactive','other')),
                source_name TEXT NOT NULL,
                source_url TEXT NOT NULL UNIQUE CHECK(source_url LIKE 'https://%'),
                license_notes TEXT NOT NULL DEFAULT '',
                language TEXT NOT NULL DEFAULT 'English',
                tags TEXT NOT NULL DEFAULT '[]',
                verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending','approved','rejected')),
                review_notes TEXT NOT NULL DEFAULT '',
                reviewed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_resources_status_created ON resources(verification_status, created_at DESC)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_resources_subject_type ON resources(subject, resource_type)")
        now = _now()
        for entry in STARTER_RESOURCES:
            db.execute("""INSERT OR IGNORE INTO resources
                (id,title,description,subject,topic,academic_level,resource_type,source_name,source_url,license_notes,language,tags,verification_status,review_notes,reviewed_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                str(uuid4()), entry["title"], entry["description"], entry["subject"], entry["topic"],
                entry["academic_level"], entry["resource_type"], entry["source_name"], entry["source_url"],
                entry["license_notes"], entry["language"], json.dumps(entry["tags"], ensure_ascii=False),
                "approved", "Curated source portal; individual items should still be checked on the source website.",
                now, now, now,
            ))


def _as_dict(row: sqlite3.Row, admin: bool = False) -> dict:
    item = dict(row)
    try:
        item["tags"] = json.loads(item.get("tags") or "[]")
    except (TypeError, json.JSONDecodeError):
        item["tags"] = []
    if not admin:
        item.pop("review_notes", None)
    keys = ADMIN_FIELDS if admin else PUBLIC_FIELDS
    return {key: item.get(key) for key in keys}


def _require_admin(token: str | None) -> None:
    expected = os.getenv("RESOURCE_ADMIN_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Curator tools are disabled. Configure RESOURCE_ADMIN_TOKEN in the backend environment.")
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="A valid curator token is required.")


def _validate_https_url(value: str) -> str:
    cleaned = value.strip()
    try:
        parsed = urlparse(cleaned)
        port = parsed.port
    except ValueError as exc:
        raise ValueError("Enter a valid HTTPS URL") from exc
    if parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Use a valid HTTPS URL from the original source")
    if port not in (None, 443):
        raise ValueError("Only standard HTTPS URLs are accepted")
    if parsed.hostname.lower() in {"localhost", "localhost.localdomain"} or parsed.hostname.endswith(".local"):
        raise ValueError("Local URLs are not accepted")
    return cleaned


def _allowed_scrape_domains() -> set[str]:
    configured = os.getenv("RESOURCE_SCRAPE_ALLOWED_DOMAINS", "").strip()
    if not configured:
        return set(DEFAULT_SCRAPE_DOMAINS)
    return {part.strip().lower().lstrip(".") for part in configured.split(",") if part.strip()}


def _validate_scrape_url(value: str) -> str:
    try:
        cleaned = _validate_https_url(value)
        parsed = urlparse(cleaned)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    host = (parsed.hostname or "").lower().rstrip(".")
    # Exact host or subdomain of a trusted educational source only.
    if not any(host == domain or host.endswith("." + domain) for domain in _allowed_scrape_domains()):
        raise HTTPException(status_code=400, detail="This site is not in the approved scrape domain list. Add trusted educational domains through RESOURCE_SCRAPE_ALLOWED_DOMAINS.")
    try:
        addresses = {entry[4][0] for entry in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
        if not addresses or any(not ipaddress.ip_address(address.split("%", 1)[0]).is_global for address in addresses):
            raise HTTPException(status_code=400, detail="The source host does not resolve exclusively to public IP addresses.")
    except socket.gaierror as exc:
        raise HTTPException(status_code=400, detail="The source hostname could not be resolved.") from exc
    return cleaned


def _robots_allows(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    try:
        response = requests.get(robots_url, headers={"User-Agent": "BodhyaResourceBot/1.0 (+single-page educational metadata preview)"}, timeout=(3.05, 6), allow_redirects=False)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not check robots.txt; the scrape was stopped for safety.") from exc
    if response.status_code in (404, 410):
        return True
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Could not verify robots.txt permissions (HTTP {response.status_code}); the scrape was stopped.")
    parser = RobotFileParser()
    parser.set_url(robots_url)
    parser.parse(response.text.splitlines())
    return parser.can_fetch("BodhyaResourceBot", url) and parser.can_fetch("*", url)


def _fetch_html(url: str) -> tuple[str, str]:
    current = _validate_scrape_url(url)
    headers = {"User-Agent": "BodhyaResourceBot/1.0 (+single-page educational metadata preview; contact site operator before bulk access)", "Accept": "text/html,application/xhtml+xml;q=0.9"}
    for _ in range(4):
        current = _validate_scrape_url(current)
        if not _robots_allows(current):
            raise HTTPException(status_code=403, detail="robots.txt does not allow this page to be fetched.")
        try:
            response = requests.get(current, headers=headers, timeout=(4, 10), allow_redirects=False, stream=True)
        except requests.RequestException as exc:
            raise HTTPException(status_code=502, detail="The source page could not be fetched.") from exc
        if response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get("location")
            response.close()
            if not location:
                raise HTTPException(status_code=502, detail="The source returned an invalid redirect.")
            current = urljoin(current, location)
            continue
        if response.status_code != 200:
            code = response.status_code
            response.close()
            raise HTTPException(status_code=502, detail=f"The source returned HTTP {code}.")
        content_type = response.headers.get("content-type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            response.close()
            raise HTTPException(status_code=415, detail="Only HTML pages are supported. Books and PDFs remain links to the original provider.")
        chunks: list[bytes] = []
        total = 0
        try:
            for chunk in response.iter_content(16384):
                total += len(chunk)
                if total > 2_000_000:
                    raise HTTPException(status_code=413, detail="Page exceeds the 2 MB metadata-preview limit.")
                chunks.append(chunk)
        finally:
            response.close()
        encoding = response.encoding or "utf-8"
        return b"".join(chunks).decode(encoding, errors="replace"), current
    raise HTTPException(status_code=400, detail="Too many redirects; the destination was not fetched.")


def _infer_resource_type(url: str, title: str, text: str) -> str:
    haystack = f"{url} {title} {text[:1000]}".lower()
    if "research paper" in haystack or "journal article" in haystack or "doi.org/" in haystack:
        return "research_paper" if "paper" in haystack else "article"
    if any(word in haystack for word in ("textbook", "text-book", "open textbook")):
        return "textbook"
    if any(word in haystack for word in ("book", "ebook", "e-book", "works/ol")):
        return "book"
    if any(word in haystack for word in ("lecture", "course material", "syllabus")):
        return "lecture" if "lecture" in haystack else "course"
    if any(word in haystack for word in ("quiz", "practice questions", "exercises")):
        return "practice"
    if any(word in haystack for word in (".mp4", "youtube.com", "video lesson")):
        return "video"
    return "article"


def _preview_page(url: str) -> dict:
    html, canonical_url = _fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")
    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    og_title = soup.find("meta", attrs={"property": "og:title"})
    if og_title and og_title.get("content"):
        title = og_title["content"].strip() or title
    description = ""
    for attrs in ({"name": "description"}, {"property": "og:description"}, {"name": "twitter:description"}):
        meta = soup.find("meta", attrs=attrs)
        if meta and meta.get("content"):
            description = meta["content"].strip()
            if description:
                break
    for node in soup(["script", "style", "noscript", "svg", "canvas", "iframe", "nav", "footer", "header", "form"]):
        node.decompose()
    main = soup.find("main") or soup.find("article") or soup.body or soup
    text = re.sub(r"\s+", " ", main.get_text(" ", strip=True)).strip()
    if not description and text:
        description = text[:280].rstrip() + ("…" if len(text) > 280 else "")
    host = (urlparse(canonical_url).hostname or "").lower()
    source_name = next((label for domain, label in SOURCE_NAMES.items() if host == domain or host.endswith("." + domain)), host)
    title = re.sub(r"\s+", " ", title)[:200].strip() or source_name
    description = re.sub(r"\s+", " ", description)[:700].strip()
    excerpt = re.sub(r"\s+", " ", text)[:650].strip()
    resource_type = _infer_resource_type(canonical_url, title, text)
    return {
        "url": url, "canonical_url": canonical_url, "title": title, "description": description,
        "source_name": source_name, "resource_type_guess": resource_type,
        "topic_guess": "", "excerpt_preview": excerpt,
        "note": "Metadata preview only. The full page content is not saved by this endpoint. Verify rights and source quality before adding it.",
    }


class ResourceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=2500)
    subject: str = Field(min_length=2, max_length=100)
    topic: str = Field(default="", max_length=160)
    academic_level: str = Field(default="All levels", max_length=100)
    resource_type: ResourceType = "article"
    source_name: str = Field(min_length=2, max_length=160)
    source_url: str = Field(min_length=10, max_length=2048)
    license_notes: str = Field(default=DEFAULT_LICENSE_NOTE, max_length=1000)
    language: str = Field(default="English", max_length=60)
    tags: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("title", "subject", "source_name")
    @classmethod
    def required_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value.strip()

    @field_validator("source_url")
    @classmethod
    def valid_https(cls, value: str) -> str:
        return _validate_https_url(value)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, values: list[str]) -> list[str]:
        output: list[str] = []
        seen: set[str] = set()
        for raw in values:
            tag = raw.strip()[:40]
            if tag and tag.casefold() not in seen:
                output.append(tag)
                seen.add(tag.casefold())
        return output[:20]


class ResourceReview(BaseModel):
    verification_status: Literal["approved", "rejected"]
    review_notes: str = Field(default="", max_length=1000)


class ScrapeRequest(BaseModel):
    url: str = Field(min_length=10, max_length=2048)

    @field_validator("url")
    @classmethod
    def valid_url_shape(cls, value: str) -> str:
        return _validate_https_url(value)


@router.on_event("startup")
def _startup() -> None:
    init_db()


@router.get("/health")
def resource_health():
    try:
        with _connect() as db:
            count = db.execute("SELECT count(*) FROM resources").fetchone()[0]
        return {"status": "ok", "storage": "sqlite", "resource_count": count}
    except sqlite3.Error as exc:
        raise HTTPException(status_code=503, detail="Resource catalogue is unavailable.") from exc


@router.get("/")
def list_resources(
    q: str | None = Query(default=None, max_length=120),
    subject: str | None = Query(default=None, max_length=100),
    resource_type: ResourceType | None = None,
    level: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=60, ge=1, le=100),
):
    clauses = ["verification_status = 'approved'"]
    params: list[object] = []
    if subject and subject.strip():
        clauses.append("lower(subject) = lower(?)")
        params.append(subject.strip())
    if level and level.strip():
        clauses.append("lower(academic_level) = lower(?)")
        params.append(level.strip())
    if resource_type:
        clauses.append("resource_type = ?")
        params.append(resource_type)
    if q and q.strip():
        needle = q.strip().replace("%", " ").replace("_", " ").replace("\\", " ")[:120]
        pattern = f"%{needle}%"
        clauses.append("(title LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR topic LIKE ? COLLATE NOCASE OR source_name LIKE ? COLLATE NOCASE OR subject LIKE ? COLLATE NOCASE OR tags LIKE ? COLLATE NOCASE)")
        params.extend([pattern] * 6)
    params.append(limit)
    with _connect() as db:
        rows = db.execute(f"SELECT {','.join(PUBLIC_FIELDS)} FROM resources WHERE {' AND '.join(clauses)} ORDER BY source_name COLLATE NOCASE, title COLLATE NOCASE LIMIT ?", params).fetchall()
    items = [_as_dict(row) for row in rows]
    return {"items": items, "count": len(items)}


@router.get("/books/search")
def search_books(q: str = Query(min_length=2, max_length=120), limit: int = Query(default=12, ge=1, le=20)):
    """Search bibliographic metadata from Open Library; does not fetch full book text."""
    query = q.strip()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="Enter at least two characters.")
    try:
        response = requests.get(
            "https://openlibrary.org/search.json",
            params={"q": query, "limit": limit, "fields": "key,title,author_name,first_publish_year,edition_count,cover_i,isbn,subject"},
            headers={"User-Agent": "BodhyaResource/1.0 (educational book search)"}, timeout=(3.05, 8),
        )
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise HTTPException(status_code=502, detail="The book catalogue is temporarily unavailable. Please try again.") from exc
    items = []
    for item in data.get("docs", [])[:limit]:
        key = item.get("key")
        if not isinstance(key, str) or not key.startswith("/works/"):
            continue
        cover_id = item.get("cover_i")
        items.append({
            "key": key, "title": str(item.get("title") or "Untitled")[:300],
            "authors": [str(author)[:160] for author in (item.get("author_name") or [])[:8]],
            "first_publish_year": item.get("first_publish_year"),
            "edition_count": item.get("edition_count"),
            "cover_url": f"https://covers.openlibrary.org/b/id/{int(cover_id)}-M.jpg" if isinstance(cover_id, int) else None,
            "open_url": "https://openlibrary.org" + key,
            "isbn": (item.get("isbn") or [None])[0],
            "subjects": [str(subject)[:100] for subject in (item.get("subject") or [])[:5]],
        })
    return {"items": items, "count": len(items), "provider": "Open Library", "disclaimer": "Bibliographic record only; availability and rights vary by title."}


@router.post("/admin/scrape-preview")
def scrape_preview(request: ScrapeRequest, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    return _preview_page(request.url)


@router.get("/admin/resources")
def list_review_queue(
    verification_status: VerificationStatus = "pending",
    limit: int = Query(default=100, ge=1, le=200),
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
):
    _require_admin(x_admin_token)
    with _connect() as db:
        rows = db.execute(f"SELECT {','.join(ADMIN_FIELDS)} FROM resources WHERE verification_status = ? ORDER BY created_at DESC LIMIT ?", (verification_status, limit)).fetchall()
    return {"items": [_as_dict(row, admin=True) for row in rows], "count": len(rows)}


@router.post("/admin/resources", status_code=201)
def create_resource(request: ResourceCreate, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    now = _now()
    resource_id = str(uuid4())
    try:
        with _connect() as db:
            db.execute("""INSERT INTO resources
              (id,title,description,subject,topic,academic_level,resource_type,source_name,source_url,license_notes,language,tags,verification_status,review_notes,reviewed_at,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                resource_id, request.title, request.description, request.subject, request.topic,
                request.academic_level or "All levels", request.resource_type, request.source_name,
                _validate_https_url(request.source_url), request.license_notes, request.language or "English",
                json.dumps(request.tags, ensure_ascii=False), "pending", "", None, now, now,
            ))
            row = db.execute(f"SELECT {','.join(ADMIN_FIELDS)} FROM resources WHERE id = ?", (resource_id,)).fetchone()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="This original URL is already catalogued, or the resource failed database validation.") from exc
    return _as_dict(row, admin=True)


@router.patch("/admin/resources/{resource_id}/review")
def review_resource(resource_id: str, request: ResourceReview, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    now = _now()
    with _connect() as db:
        cursor = db.execute("UPDATE resources SET verification_status = ?, review_notes = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
                            (request.verification_status, request.review_notes.strip(), now, now, resource_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Resource not found.")
        row = db.execute(f"SELECT {','.join(ADMIN_FIELDS)} FROM resources WHERE id = ?", (resource_id,)).fetchone()
    return _as_dict(row, admin=True)
