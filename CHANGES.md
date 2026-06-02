# Changes from the original repo

This repo started from [avinashdotcom/zopdev-university](https://github.com/avinashdotcom/zopdev-university) (initial commit `aca4725e`, 22 May 2026). The curriculum content under `tracks/` is unchanged. Everything below is design / layout / build-pipeline work added on top.

## Chrome

- **Dual sticky nav** on every page. Row 1 mirrors the OG marketing nav (`ZopDev` lockup, Product / Resources / Pricing / Company / Community, Playground chip, Sign In, Book a Demo). Row 2 is the secondary University nav — `ZopDev | UNIVERSITY` brand lockup, Courses / Certifications dropdowns, Glossary link, and an inline search input bound to the lesson index.
- **Dark mode locked.** Theme toggle removed. `:root, html, html[data-theme="dark"]` token overrides flip `var(--ink)` to cream and `var(--paper)` to `#0F0F12`. Defensive overrides kill leftover cream sections on legacy classes (`.lp-final`, `.uni-final`, `.track-cta-strip`, `.lesson-cta`).
- **Standalone breadcrumb bar removed** — dual nav already carries the lineage.
- **OG marketing footer + final CTA ("Start with the bill.")** ported onto every page (homepage, track index, module, lesson, glossary, certifications, sample certificate, verify, 404, search).

## Homepage

- **Hero** restructured as 2-col editorial composition (`.hero-grid`): eyebrow + h1 + lead + stats on the LEFT, abstract geometric animated visual on the RIGHT.
- **Bento** redesigned around a featured-card pattern (T3 Architect featured, then T0–T6 + a TOTALS tile). Each cell carries a minimal isometric line-art SVG — receipt, console, open book, dashboard, pipeline-cubes, agent cube. One orange accent per cell, always meaningful (active row, tallest bar, current stage). No grid backdrops, no mono labels, no floating UI panels.
- **Path diagram** rebuilt as an editorial 3-column flow (Tier 1 / Tier 2 / Tier 3) with explicit cert-earn rows beneath each column.

## Track / module / lesson pages

- **Module rows** restyled as an editorial syllabus table: mono module code on the left, title + outcome paragraph in the middle, lesson count + minutes + arrow on the right. Dashed hairline dividers, no card chrome.
- **Module description parser fix.** The original parser was grabbing the markdown `---` HR line as the description. New parser skips headings, eyebrow lines, HRs, table rows, and lists, preferring the paragraph under `## Module outcome` if present.
- **Lesson outcome excerpts** now strip raw markdown (`**bold**`, `*italic*`, `` `code` ``, `[text](url)`) before being shown in cards.
- **Track-page CTA** ("Ready to dig in?") upgraded from centered h2+buttons to a 2-col composition: copy + buttons on the LEFT, a Pattern-A hover-stripe preview card on the RIGHT showing the actual first lesson (code, title, outcome, "Open lesson →").

## Glossary

- **Index page** redesigned as an editorial reference work: massive per-letter section heads (`A`, `B`, …) anchored on the left, dense 2-col entry rows on the right (term + definition + lesson count), live filter input with match counter, alphabet jump row.
- **Term pages** carry the same chrome (eyebrow + h1 + orange-bordered definition + `WHERE IT APPEARS` lesson references).

## Certifications

- **Tier badges** rebuilt three times in response to feedback. The shipped version is a drenched tier-color square (operator deep-green / engineer brand-blue / architect deep-orange) with a cream serif Roman block-bar mark inside (`I` / `II` / `III` with serifs), inner cream hairline frame, a tiny ZopNight brand chip at the top, the tier label flanked by short cream rules at the bottom, and a small tier-numeral footer detail. Three sizes (`medium` 220px, `large` 280px, `xlarge` 360px).
- **Cert cards** on `/certifications/` rebuilt as editorial credential cards: badge rail on the LEFT (seal + `TIER I — EST. 2026` meta), content rail on the RIGHT divided into eyebrow + headline + lead, 4-cell stats grid (mono labels above big tabular numerals), `WHAT IT PROVES` 2-col scope list, `PATH` linear breadcrumb chain (with `✓` checkmarks on earned prereqs and a cream-pill highlight on the destination exam), and a CTA row. Per-card tier-color left stripe.
- **Sample certificate pages** and **verify page** carry consistent chrome.

## Build pipeline

- Added `stripMarkdown()` helper for excerpt rendering.
- Added module README parser improvements (HR/table/list skipping, prefer Module-outcome paragraph).
- Generates 1,227 HTML pages under `/site/` (vs the original's same count) — output structure unchanged so Vercel deploy still works without a build step.
- Search index (237 lessons), sitemap (1,226 URLs), `robots.txt`, `vercel.json`, favicon all preserved.

## Files NOT changed

- `tracks/**/*.md` — every lesson, module README, and signature line is byte-for-byte the OG content.
- `paths/`, `certifications/`, `reference/` — source content unchanged.
- `00_PLAN.md`, `01_INFORMATION_ARCHITECTURE.md`, `02_TOPIC_COMPENDIUM.md`, `03_DURATION_AND_TONE_CALIBRATION.md`, `04_CLIENT_READINESS_AUDIT.md`, `DESIGN.md`, `PRODUCT.md`, `README.md` — preserved as-authored.
