import { useEffect, useMemo, useState } from "react";
import {
  createResource, filterStarterResources, getResources, listReviewQueue,
  reviewResource, scrapePreview, searchBooks,
} from "./api.js";
import { RESOURCE_TYPES, RESOURCE_TYPE_ICONS, STARTER_RESOURCES } from "./starterResources.js";

const SUBJECTS = ["all", ...new Set(STARTER_RESOURCES.map((r) => r.subject))];
const EMPTY_FORM = {
  title: "", description: "", subject: "General Studies", topic: "", academic_level: "All levels",
  resource_type: "article", source_name: "", source_url: "", license_notes: "Check the original source's terms before reusing content.",
  language: "English", tags: "",
};
const BOOKMARKS_KEY = "bodhya.resource.bookmarks.v1";

function readBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]"); }
  catch { return []; }
}

function safeSourceHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "Original source"; }
}

function ResourceCard({ item, bookmarked, onBookmark }) {
  const icon = RESOURCE_TYPE_ICONS[item.resource_type] || "📎";
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-2xl" aria-hidden="true">{icon}</div>
        <button type="button" onClick={() => onBookmark(item)} aria-pressed={bookmarked}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${bookmarked ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
          {bookmarked ? "★ Saved" : "☆ Save"}
        </button>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600">{item.source_name || safeSourceHost(item.source_url)}</p>
      <h3 className="text-base font-bold leading-snug text-slate-900">{item.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{item.description || "Open the original source for details."}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[item.subject, item.academic_level, (item.resource_type || "resource").replaceAll("_", " ")].filter(Boolean).map((label) => (
          <span key={label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{label}</span>
        ))}
      </div>
      {item.license_notes && <p className="mt-3 text-xs leading-5 text-slate-400">Usage: {item.license_notes}</p>}
      <a href={item.source_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
        Open original resource <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function BookCard({ book, onQueue }) {
  return (
    <article className="flex h-full gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-3xl">
        {book.cover_url ? <img src={book.cover_url} alt={`Cover of ${book.title}`} loading="lazy" className="h-full w-full object-cover" /> : "📚"}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-bold text-slate-900">{book.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{(book.authors || []).join(", ") || "Author not listed"}</p>
        <p className="mt-1 text-xs text-slate-400">{book.first_publish_year ? `First published ${book.first_publish_year}` : "Publication year unavailable"}{book.edition_count ? ` · ${book.edition_count} editions` : ""}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <a href={book.open_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">View book record ↗</a>
          <button type="button" onClick={() => onQueue(book)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Queue in Resource</button>
        </div>
      </div>
    </article>
  );
}

export default function ResourcePage({ lang = "en" }) {
  const [view, setView] = useState("browse");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [resourceType, setResourceType] = useState("all");
  const [resources, setResources] = useState(STARTER_RESOURCES);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [bookmarks, setBookmarks] = useState(readBookmarks);
  const [bookQuery, setBookQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [bookMessage, setBookMessage] = useState("Search by title, author or subject to find book records.");
  const [adminToken, setAdminToken] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [queue, setQueue] = useState([]);
  const [queueStatus, setQueueStatus] = useState("pending");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const result = await getResources({ q: query, subject, resourceType });
        if (alive) { setResources(result.items || []); setOffline(false); }
      } catch {
        if (alive) {
          setResources(filterStarterResources({ q: query, subject, resourceType }));
          setOffline(true);
        }
      } finally { if (alive) setBusy(false); }
    }, 180);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, subject, resourceType]);

  const visibleResources = useMemo(() => {
    if (view === "saved") return bookmarks;
    return resources;
  }, [resources, bookmarks, view]);

  function toggleBookmark(item) {
    const next = bookmarks.some((b) => b.id === item.id)
      ? bookmarks.filter((b) => b.id !== item.id)
      : [...bookmarks, item];
    setBookmarks(next);
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next)); } catch { /* storage may be disabled */ }
  }

  async function runBookSearch(event) {
    event?.preventDefault();
    if (bookQuery.trim().length < 2) { setBookMessage("Enter at least two characters to search the book catalogue."); return; }
    setBusy(true); setBookMessage("Searching Open Library…");
    try {
      const result = await searchBooks(bookQuery, 12);
      setBooks(result.items || []);
      setBookMessage(result.items?.length ? `${result.items.length} book records found. Full-text access depends on the individual title.` : "No matching book records were returned. Try another title or author.");
    } catch (error) {
      setBooks([]); setBookMessage(`Book search is unavailable right now. ${error.message}`);
    } finally { setBusy(false); }
  }

  async function queueBook(book) {
    if (!adminToken.trim()) {
      setView("curate");
      setAdminMessage("Enter the curator token, then queue the book for review.");
      setForm({ ...EMPTY_FORM, title: book.title, description: `Book record by ${(book.authors || []).join(", ") || "an unlisted author"}${book.first_publish_year ? `; first published ${book.first_publish_year}` : ""}.`,
        subject: "Books & Reading", topic: "Book discovery", academic_level: "All levels", resource_type: "book",
        source_name: "Open Library", source_url: book.open_url, license_notes: "Catalogue record only. Check rights and borrowing conditions on the original record." });
      return;
    }
    setAdminBusy(true); setAdminMessage("");
    try {
      await createResource({ title: book.title, description: `Book record by ${(book.authors || []).join(", ") || "an unlisted author"}${book.first_publish_year ? `; first published ${book.first_publish_year}` : ""}.`,
        subject: "Books & Reading", topic: "Book discovery", academic_level: "All levels", resource_type: "book",
        source_name: "Open Library", source_url: book.open_url, license_notes: "Catalogue record only. Check rights and borrowing conditions on the original record.", language: "Multiple", tags: ["book", "Open Library"] }, adminToken);
      setAdminMessage("Book added to the pending review queue.");
      if (view === "curate") await refreshQueue();
    } catch (error) { setAdminMessage(error.message); }
    finally { setAdminBusy(false); }
  }

  function applyPreviewToForm(data) {
    setPreview(data);
    setForm((old) => ({ ...old,
      title: data.title || old.title,
      description: data.description || old.description,
      topic: data.topic_guess || old.topic,
      resource_type: data.resource_type_guess || old.resource_type,
      source_name: data.source_name || safeSourceHost(data.canonical_url || data.url),
      source_url: data.canonical_url || data.url,
    }));
  }

  async function fetchPreview(event) {
    event?.preventDefault(); setAdminBusy(true); setAdminMessage(""); setPreview(null);
    try {
      const data = await scrapePreview(scrapeUrl, adminToken);
      applyPreviewToForm(data);
      setAdminMessage("Page metadata fetched. Review it before adding the source to the pending queue.");
    } catch (error) { setAdminMessage(error.message); }
    finally { setAdminBusy(false); }
  }

  async function saveResource(event) {
    event?.preventDefault(); setAdminBusy(true); setAdminMessage("");
    const payload = { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    try {
      await createResource(payload, adminToken);
      setAdminMessage("Resource saved as pending. Students will not see it until a curator approves it.");
      setForm(EMPTY_FORM); setPreview(null); setScrapeUrl(""); await refreshQueue();
    } catch (error) { setAdminMessage(error.message); }
    finally { setAdminBusy(false); }
  }

  async function refreshQueue() {
    if (!adminToken.trim()) { setAdminMessage("Enter the curator token first."); return; }
    setAdminBusy(true);
    try { const result = await listReviewQueue(adminToken, queueStatus); setQueue(result.items || []); }
    catch (error) { setAdminMessage(error.message); }
    finally { setAdminBusy(false); }
  }

  async function decideResource(id, status) {
    setAdminBusy(true); setAdminMessage("");
    try {
      await reviewResource(id, status, "", adminToken);
      setQueue((old) => old.filter((item) => item.id !== id));
      setAdminMessage(status === "approved" ? "Resource approved and visible to students." : "Resource rejected.");
    } catch (error) { setAdminMessage(error.message); }
    finally { setAdminBusy(false); }
  }

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const tabClass = (name) => `rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === name ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.22em] text-indigo-200">Bodhya · learning resources</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Resource</h1>
            <p className="mt-3 text-sm leading-6 text-indigo-100 sm:text-base">Study material, textbooks, books, lecture notes, courses, videos, practice and research — organised in one place, linked to their original sources.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl">📚</div><div className="mt-1 text-xs font-semibold">Books</div></div>
            <div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl">🔎</div><div className="mt-1 text-xs font-semibold">Search</div></div>
            <div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl">🔗</div><div className="mt-1 text-xs font-semibold">Sources</div></div>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Resource sections">
        <button type="button" className={tabClass("browse")} onClick={() => setView("browse")}>🔎 Browse resources</button>
        <button type="button" className={tabClass("books")} onClick={() => setView("books")}>📚 Find books</button>
        <button type="button" className={tabClass("saved")} onClick={() => setView("saved")}>⭐ Saved ({bookmarks.length})</button>
        <button type="button" className={tabClass("curate")} onClick={() => setView("curate")}>🛠️ Curator tools</button>
      </nav>

      {view === "browse" || view === "saved" ? (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_230px]">
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Search resources</span>
              <input className={fieldClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subject, topic, title, publisher…" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Subject</span>
              <select className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)}>{SUBJECTS.map((s) => <option key={s} value={s}>{s === "all" ? "All subjects" : s}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Resource type</span>
              <select className={fieldClass} value={resourceType} onChange={(e) => setResourceType(e.target.value)}>{RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
          </div>
          {offline && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">The Resource API is offline. Showing the built-in starter catalogue; live book search and curator tools need the backend.</div>}
          {busy && <p className="text-sm text-slate-500">Updating the catalogue…</p>}
          {view === "saved" && bookmarks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="text-4xl">⭐</div><h2 className="mt-3 font-bold text-slate-800">Nothing saved yet</h2><p className="mt-1 text-sm text-slate-500">Use the Save button on any resource to keep it here on this device.</p></div>}
          {visibleResources.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleResources.map((item) => <ResourceCard key={item.id} item={item} bookmarked={bookmarks.some((b) => b.id === item.id)} onBookmark={toggleBookmark} />)}</div>
            : view !== "saved" || bookmarks.length > 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="text-4xl">🔍</div><h2 className="mt-3 font-bold text-slate-800">No matching resources</h2><p className="mt-1 text-sm text-slate-500">Try a different keyword or filter.</p></div> : null}
          <p className="text-xs leading-5 text-slate-400">Bodhya stores catalogue details and links to original providers. Availability, access restrictions and licences belong to each source.</p>
        </section>
      ) : null}

      {view === "books" ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">Find books</h2>
            <p className="mt-1 text-sm text-slate-500">Search Open Library's book catalogue by title, author or subject. A record does not necessarily mean a free full-text copy is available.</p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={runBookSearch}>
              <input className={`${fieldClass} flex-1`} value={bookQuery} onChange={(e) => setBookQuery(e.target.value)} placeholder="e.g. physics, Jane Austen, data structures" />
              <button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? "Searching…" : "Search books"}</button>
            </form>
            {bookMessage && <p className="mt-3 text-sm text-slate-500">{bookMessage}</p>}
          </div>
          {books.length > 0 && <div className="grid gap-3 lg:grid-cols-2">{books.map((book) => <BookCard key={book.key || book.open_url} book={book} onQueue={queueBook} />)}</div>}
          <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Book discovery uses bibliographic metadata. Bodhya does not download or redistribute copyrighted books. Use publisher links, authorised borrowing, or files that are legally available to you.</div>
        </section>
      ) : null}

      {view === "curate" ? (
        <section className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Curator area.</strong> Only trusted staff should have the curator token. A scraped page or newly added link stays pending until a curator approves it. The scraper is restricted to configured educational domains and checks robots.txt before fetching a page.</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">Curator access</h2>
            <label className="mt-3 block max-w-xl"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Admin token</span><input className={fieldClass} type="password" autoComplete="off" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Enter the backend curator token" /></label>
            <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" disabled={adminBusy || !adminToken.trim()} onClick={refreshQueue} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Load review queue</button><label className="flex items-center gap-2 text-sm text-slate-600">Queue <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5" value={queueStatus} onChange={(e) => setQueueStatus(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">Fetch webpage metadata</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Paste one page URL from an approved educational domain. Bodhya extracts page metadata and a short preview for review; it does not download books or store an entire page.</p>
                <form className="mt-4 space-y-3" onSubmit={fetchPreview}>
                  <input className={fieldClass} type="url" required value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://…" />
                  <button disabled={adminBusy || !adminToken.trim()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{adminBusy ? "Working…" : "Fetch page preview"}</button>
                </form>
                {preview && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Preview only · not yet approved</p><h3 className="mt-2 font-bold text-slate-900">{preview.title}</h3><p className="mt-1 text-sm text-slate-600">{preview.description || "No meta description found."}</p>{preview.excerpt_preview && <p className="mt-3 border-l-2 border-indigo-300 pl-3 text-xs leading-5 text-slate-500">{preview.excerpt_preview}</p>}<p className="mt-3 break-all text-xs text-slate-400">{preview.canonical_url || preview.url}</p></div>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900">Resource details</h2>
                <p className="mt-1 text-sm text-slate-500">Enter a source manually or review the metadata fetched above.</p>
                <form className="mt-4 space-y-3" onSubmit={saveResource}>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Title</span><input className={fieldClass} required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Description</span><textarea className={fieldClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
                  <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Subject</span><input className={fieldClass} required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Topic</span><input className={fieldClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></label></div>
                  <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Type</span><select className={fieldClass} value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value })}>{RESOURCE_TYPES.filter((x) => x.value !== "all").map((t) => <option key={t.value} value={t.value}>{t.label.replace(/^All /, "")}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Academic level</span><input className={fieldClass} value={form.academic_level} onChange={(e) => setForm({ ...form, academic_level: e.target.value })} /></label></div>
                  <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Source / publisher</span><input className={fieldClass} required value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} /></label><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Language</span><input className={fieldClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></label></div>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Original URL (HTTPS)</span><input className={fieldClass} type="url" required value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Tags (comma-separated)</span><input className={fieldClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="physics, textbook, exam revision" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Licence / reuse notes</span><textarea className={fieldClass} rows={2} value={form.license_notes} onChange={(e) => setForm({ ...form, license_notes: e.target.value })} /></label>
                  <button disabled={adminBusy || !adminToken.trim()} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50">Add to pending review queue</button>
                </form>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-extrabold text-slate-900">Review queue</h2><p className="text-sm text-slate-500">Approve only after checking the original page and permissions.</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{queue.length} loaded</span></div>
              {queue.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center"><div className="text-3xl">🗂️</div><p className="mt-2 text-sm text-slate-500">No entries loaded. Enter the token and load the queue.</p></div> : <div className="mt-4 space-y-3">{queue.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.source_name} · {item.resource_type} · {item.subject}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.verification_status === "approved" ? "bg-emerald-50 text-emerald-700" : item.verification_status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{item.verification_status}</span></div><p className="mt-2 text-sm text-slate-600">{item.description}</p><a href={item.source_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-2 inline-block break-all text-xs font-semibold text-indigo-600">Check source ↗</a>{item.verification_status === "pending" && <div className="mt-3 flex gap-2"><button disabled={adminBusy} onClick={() => decideResource(item.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button><button disabled={adminBusy} onClick={() => decideResource(item.id, "rejected")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reject</button></div>}</article>)}</div>}
            </div>
          </div>
          {adminMessage && <div role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{adminMessage}</div>}
        </section>
      ) : null}
    </div>
  );
}
