# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal portfolio site for Daniele Raimondi, served as a **static site by GitHub Pages** at https://danieleraimondi.github.io/. There is **no build step, no framework, and no package manager** — no `package.json`, no Jekyll/Gemfile. The files in the repo root are exactly what gets served.

## Develop / preview / deploy

- **Preview locally:** open `index.html` directly in a browser, or serve the root with any static server (e.g. `python3 -m http.server`) so relative `assets/` and `js/` paths and the chatbot `fetch` resolve.
- **Deploy:** push to `main`. GitHub Pages publishes the repo root automatically — there is no CI build to run.
- **No tests, no linter** are configured.

## Architecture

Almost everything lives in **`index.html`** (~5000 lines): all markup, one big `<style>` block (~line 102), JSON-LD structured data, and roughly eight inline `<script>` IIFEs near the end of the file. Each inline script owns exactly one self-contained feature and bails early if its target element is missing:

- Tab switching (the SPA navigation between `home / projects / skills / talks / publications / sport`)
- Hero word rotator, highlights carousel
- Project hover-videos, project lightbox, project image carousel
- Sport photo lightbox
- Publications PDF reader (opens PDFs from `assets/publications/` in an in-page `<iframe>` modal)

Two external scripts in **`js/`** are the only non-inline JS:

- **`js/chatbot.js`** — the "AI Twin" chatbot. Posts to `https://ai-twin-backend.vercel.app/api/chat`. **The backend is not in this repo** (the `backend/` dir is gitignored). Includes a safe DOM-based markdown renderer (never uses `innerHTML` with model output).
- **`js/i18n.js`** — EN/IT toggle. **English is the default and lives directly in the HTML**; this file holds only the Italian strings and swaps them in via `data-i18n` attributes, caching each element's original. By design, technical terms, job titles, and product names stay in English.

## Commits & pushing

**Never cite Claude or any AI in commits or pushes.** Do not add `Co-Authored-By: Claude` (or any AI co-author) and do not mention AI assistance in commit messages. Every commit must appear authored solely by Daniele Raimondi — the author and committer are always the user, never the AI.

## Conventions that matter

- **Cache-busting:** `index.html` loads the JS files with a `?v=YYYYMMDD…` query string (e.g. `js/i18n.js?v=20260622a`). **When you edit `js/chatbot.js` or `js/i18n.js`, bump that version token** or browsers will serve the stale cached file.
- **Content Security Policy:** there is a `<meta http-equiv="Content-Security-Policy">` in the `<head>` (GitHub Pages can't set headers). **Any new external origin** — script, `connect-src` (API), image, media, or font — **must be added there** or it will be blocked in production.
- **Adding UI text:** put the English copy in the HTML with a `data-i18n="some.key"` attribute, then add the matching Italian string under that key in `js/i18n.js`.
- **Assets** live under `assets/`, grouped by category (`projects/`, `publications/`, `highlights/`, `company_logo/`, `university_logo/`, `athletics/`, …). Publications are a cover `.webp` plus the `.pdf`, both referenced from the `publication-card` / `pub-open` markup via `data-pdf-src`.
