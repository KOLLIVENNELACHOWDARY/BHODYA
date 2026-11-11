import { STARTER_RESOURCES } from "./starterResources.js";

// Leave empty to use same-origin routes. For local Bodhya development, set
// VITE_BODHYA_API_URL=http://127.0.0.1:8000 in frontend/.env.local.
const API_BASE = (import.meta.env?.VITE_BODHYA_API_URL || "").replace(/\/$/, "");
const API_ROOT = `${API_BASE}/api/resources`;

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.detail || payload.error || `Request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return payload;
}

export function filterStarterResources({ q = "", subject = "all", resourceType = "all" } = {}) {
  const needle = q.trim().toLowerCase();
  return STARTER_RESOURCES.filter((item) => {
    const matchesText = !needle || [item.title, item.description, item.subject, item.topic,
      item.source_name, ...(item.tags || [])].join(" ").toLowerCase().includes(needle);
    const matchesSubject = subject === "all" || item.subject.toLowerCase() === subject.toLowerCase();
    const matchesType = resourceType === "all" || item.resource_type === resourceType;
    return matchesText && matchesSubject && matchesType;
  });
}

export async function getResources(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.subject && filters.subject !== "all") params.set("subject", filters.subject);
  if (filters.resourceType && filters.resourceType !== "all") params.set("resource_type", filters.resourceType);
  params.set("limit", "100");
  return request(`/?${params.toString()}`);
}

export async function searchBooks(query, limit = 12) {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
  return request(`/books/search?${params.toString()}`);
}

export async function scrapePreview(url, adminToken) {
  return request("/admin/scrape-preview", {
    method: "POST", headers: { "X-Admin-Token": adminToken },
    body: JSON.stringify({ url }),
  });
}

export async function createResource(resource, adminToken) {
  return request("/admin/resources", {
    method: "POST", headers: { "X-Admin-Token": adminToken },
    body: JSON.stringify(resource),
  });
}

export async function listReviewQueue(adminToken, status = "pending") {
  const params = new URLSearchParams({ verification_status: status, limit: "100" });
  return request(`/admin/resources?${params.toString()}`, {
    headers: { "X-Admin-Token": adminToken },
  });
}

export async function reviewResource(id, verificationStatus, reviewNotes, adminToken) {
  return request(`/admin/resources/${encodeURIComponent(id)}/review`, {
    method: "PATCH", headers: { "X-Admin-Token": adminToken },
    body: JSON.stringify({ verification_status: verificationStatus, review_notes: reviewNotes || "" }),
  });
}
