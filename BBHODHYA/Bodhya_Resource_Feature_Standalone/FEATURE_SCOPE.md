# Feature boundary

Feature name in Bodhya: **Resource**

This deliverable contains the Resource feature only. It deliberately does not modify `AppShell.jsx`, `tabConfig.js`, the backend `main.py`, Time Tracking, Lock System, or other existing project files. Integration instructions are in `README.md`.

Included capabilities:
- catalogue for notes, study guides, textbooks, books, courses, lectures, videos, practice questions, articles, research papers, portals and interactive learning tools;
- keyword/type/subject filters;
- book discovery via Open Library metadata;
- limited HTML metadata scraping for an allowlisted page, after checking robots.txt;
- review queue and approval/rejection workflow;
- original-source links and licence notes;
- device-local saved resources.

Not included:
- automated site-wide crawling;
- downloading or redistributing books/PDFs;
- AI answer generation/RAG over imported documents;
- production authentication/roles, beyond the server-side curator token gate.
