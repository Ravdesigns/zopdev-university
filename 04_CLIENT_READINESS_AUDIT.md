# ZopDev University — client-readiness audit

§ Pre-launch audit · 2026-05-21 · Status: post-fix pass

---

## Purpose

What a client sees when they land on `https://zop.dev/resources/university/` for the first time. This audit asks: what should be visible, what shouldn't, what's broken, and what reads as low-effort.

The fixes called out below have already been applied — this document is the record, not a to-do list.

---

## 1. What clients should see (and do)

| Surface | Goal | Status |
|---|---|---|
| Landing `/resources/university/` | Pick a track, see scale (7 / 237 / 52 / 3), understand voice | ✅ |
| Track pages `/<track>/` | Browse modules at a glance, see total lesson count + time | ✅ |
| Module pages `/<track>/<module>/` | See the 4-5 lessons in this module with codes | ✅ |
| Lesson pages `/<track>/<module>/<lesson>/` | Read one lesson end-to-end with sidebar context + on-page TOC | ✅ |
| Certifications `/certifications/` | Understand the 3 credentials + prereqs + exam stats | ✅ |
| Glossary `/glossary/` | Browse the 922 terms with A-Z navigation | ✅ (was broken pre-fix) |
| Glossary term `/glossary/<term>/` | See every lesson that uses this term | ✅ (was 404 pre-fix) |
| Search `/search/` | Find a lesson by query (client-side, instant) | ✅ |
| 404 | Land softly with brand chrome and a way back | ✅ |
| Sitemap + robots | Discoverable by search + LLM crawlers | ✅ |

---

## 2. What clients should NOT see

| Anti-pattern | Where to check | Status |
|---|---|---|
| Lorem ipsum / placeholder copy | Landing, track heroes, cert hero | ✅ none |
| "Coming soon" placeholders or stubs | Track pages, lesson nav | ✅ none |
| Internal track-spec language ("T2.M2.11.L5") in chrome copy | Headings, breadcrumbs | ✅ relegated to lesson-id badge only |
| Broken outbound links | Glossary terms, lesson references | ✅ glossary fixed (922 term pages now exist) |
| Pure black `#000` or pure white `#fff` | CSS tokens | ✅ none — cream-tinted neutrals only |
| Gradient-on-text | Headings | ✅ none |
| Em-dashes in chrome copy | Landing tiles, hero descriptions | ✅ fixed ("No 'learn about.' Apply." replaces em-dash) |
| Duplicate metadata (signature + metabox) on lesson page | Lesson template | ✅ fixed (strip header block from body markdown) |
| Mobile nav broken (no hamburger, overflowing CTAs) | All pages at <900px | ✅ fixed (drawer + animated toggle) |
| Excessive console.log / debug output | Page source | ✅ none |
| References to unreleased / internal features | Lesson body | ⚠ track-level — lessons reference ZopNight features by RC-code (e.g., RC-1601). These ARE real product capabilities. Editorial review should verify each RC-code maps to a shipped recommendation. |

---

## 3. Bugs fixed in this audit pass

### Lesson page: duplicate signature + duplicate metadata table

**Symptom:** the `§ T0 · M0.1 · L1 of 5 · Operator tier · 9 min` line appeared twice — once in the lesson-id header badge and again as a plain paragraph in the body. The metadata table (Tier / JTBD / Personas / etc.) was also rendered both as the styled metabox AND as a body-content table.

**Root cause:** `renderMarkdown()` rendered the lesson markdown verbatim. The lesson template separately extracts the signature (for the header) and the metadata table (for the metabox), but didn't strip them from the body.

**Fix:** new `stripLessonHeaderBlock()` helper drops everything from the start of the markdown up to the last `---` separator before the first non-Outcome `##` heading. Test: `grep -c "§ T0 · M0.1"` returns 1 (was 2).

**Bonus:** added a dedicated outcome callout (orange left-border, "OUTCOME" label) between the H1 and the metabox, so the most important sentence in the lesson — *what you'll be able to do by the end* — is visible above the fold without competing with metadata.

### Glossary: 922 broken term links

**Symptom:** glossary index linked every term to `/glossary/<slug>/` — but none of those pages existed. Every term was a 404.

**Root cause:** the build wrote `/glossary/index.html` only; per-term pages were planned but never built.

**Fix:**
- Added `buildGlossaryIndex()` — walks every lesson, builds `term → [lessonRef]` map.
- Added `renderGlossaryTermPage(term, refs)` — generates a page per term showing every lesson that uses it (track code + lesson title + arrow).
- Rewrote `renderGlossary()` — adds sticky A-Z navigation, groups terms by first letter, replaces vague "click for definition" copy with concrete "X lessons" counts.
- All 922 term pages now generate; sitemap includes them.

### Mobile nav: hamburger missing, CTAs overflowing

**Symptom:** at <900px width, nav links disappeared as designed — but the `Sign in` and `Book a demo` CTAs stayed visible at full size, breaking the layout, and the hamburger button had zero behavior. There was no way to navigate on mobile.

**Root cause:** `.nav-mobile-toggle` had visual styling for the hamburger icon but no JavaScript handler and no drawer element to open.

**Fix:**
- Built a proper drawer (`#nav-drawer`, fixed-position, full viewport below the nav).
- Wired the toggle to flip `aria-expanded` / `aria-hidden` and lock body scroll.
- Animated the toggle: 3 lines → X cross on open.
- Hid `.nav-cta` at <900px (now lives inside the drawer alongside nav links).
- Moved the drawer outside `.nav` because the parent's `backdrop-filter: blur(8px)` was creating a containing block that pinned the fixed drawer to the nav's 64px-tall box.

---

## 4. Anti-pattern audit (against `DESIGN.md §11`)

| Rule | Verified | Notes |
|---|---|---|
| Square corners only | ✅ | No `border-radius` except on `.nav-brand .mark::after` (the brand mark dot, intentional). |
| Cream paper + ink — no pure black/white | ✅ | `--paper: #FAF7EC`, `--ink: #0A0A0A`. No `#000` or `#fff` tokens. |
| Asymmetric bento (no identical-card grids) | ✅ | First bento section uses `span-7 / span-5 / span-5 / span-7 / span-6 / span-6 / span-12`. Track tiles are NOT a 3×3 of equal cards. |
| No em-dashes in chrome copy | ✅ | One found and fixed in landing copy. Lesson body content keeps em-dashes (editorial, not chrome). |
| No gradient text | ✅ | Outcome callout has a 6%-tinted background gradient (subtle, on a left-bordered block) — not text. |
| No modals as a first-thought | ✅ | Mobile menu uses a full drawer; details/summary used for knowledge checks (native, not modal). |
| Monospace eyebrows, sans-serif body | ✅ | JetBrains Mono for eyebrows + lesson-id + cert stats; Space Grotesk for headings + body. |

---

## 5. Accessibility quick-pass

| Check | Status |
|---|---|
| Skip-link visible on focus | ✅ `a.skip-link` jumps to `#main` |
| Heading hierarchy (one H1 per page) | ✅ |
| Nav has `aria-label="Primary navigation"` | ✅ |
| Mobile toggle has `aria-expanded` + `aria-controls` + label | ✅ |
| Drawer has `aria-hidden` toggled by JS | ✅ |
| Lesson sidebar / TOC have `aria-label` | ✅ |
| Color contrast (ink on paper) | ✅ `#0A0A0A` on `#FAF7EC` ≈ 18.5:1 (WCAG AAA) |
| Color contrast (g-600 on paper for eyebrows) | ⚠ ~5:1 (passes AA at 11px+, marginal at smaller sizes) |
| Focus rings on interactive elements | ⚠ relying on browser default. Recommend explicit `:focus-visible` rings in a follow-up. |
| Keyboard nav (drawer closes on link click) | ✅ |

**Follow-up needed:** add explicit `:focus-visible` outlines (1px ink dotted) on `.btn`, `.nav-links a`, `.bento-tile`, `.lesson-sidebar nav a`, `.glossary-item`, `.glossary-ref-row`.

---

## 6. Broken-link probe (sample of 12 paths)

```
200  /
200  /foundations/
200  /certifications/
200  /glossary/
200  /search/
200  /engineer/bedrock-ml/provisioned-throughput/
200  /operator/
200  /architect/
200  /finops-mastery/
200  /devops-cost-discipline/
200  /ai-powered-cloud-ops/
200  /glossary/cloud-asset-inventory/
```

All 12 sampled routes return 200. The 922 glossary term pages were probed (5-random sample) — all 200.

---

## 7. SEO + crawler footprint

| Element | Status |
|---|---|
| `<title>` per page (specific, includes track/module/lesson) | ✅ |
| `<meta name="description">` per page (uses outcome) | ✅ |
| Canonical URL (production `zop.dev/resources/university/...`) | ✅ |
| Open Graph + Twitter card meta | ✅ |
| JSON-LD on landing (EducationalOccupationalProgram) | ✅ |
| JSON-LD on track pages (Course) | ✅ |
| JSON-LD on lesson pages (LearningResource + BreadcrumbList) | ✅ |
| `sitemap.xml` (1222 URLs) | ✅ |
| `robots.txt` allow-listing GPTBot, ClaudeBot, PerplexityBot | ✅ |

---

## 8. Production deployment checklist

The site is mounted at `/resources/university/...` in production. Local preview runs from `/` via `BASE_URL` env var.

```bash
# Local preview (already working)
cd "ZopNight University"
node site/serve.js   # http://127.0.0.1:5176/

# Production build (paths rooted at /resources/university)
cd "ZopNight University"
BASE_URL=/resources/university node build.js

# Vercel deploy
cd site
vercel deploy --prod
```

**Pre-deploy gate:**
- [ ] Rebuild with `BASE_URL=/resources/university` set
- [ ] `vercel.json` is in place (`trailingSlash: true`, `cleanUrls: true`, security headers)
- [ ] Sitemap and robots.txt point to `https://zop.dev/resources/university/...`
- [ ] Spot-check 3-5 deep lesson URLs after deploy
- [ ] Verify `/resources/university/search/` returns results client-side
- [ ] Verify `/resources/university/glossary/letter-A` anchor works

---

## 9. Known limitations (not blockers)

| Item | Why it's not blocking |
|---|---|
| 922 glossary terms is dense | Real corpus from 237 lessons; A-Z nav makes it scannable. A second-pass editorial dedupe (e.g., merge "60-day baselining rule" and "60-day observation") would tighten this, but is not launch-critical. |
| No glossary definitions, only references | Definitions live in the lessons that introduce each term — clicking a term takes you to the lesson(s) that define it in context. The pedagogical model is "term gets defined where it's used." |
| Outbound `/product/`, `/pricing/`, `/company/`, `/community/`, `/playground/`, `/signin/`, `/book-demo/`, `/blog/`, `/resources/` links 404 against the standalone preview | These resolve against the parent zop.dev site when the University ships as a `/resources/university/...` subsection. Preview-only artifact. |
| Cert exam pages (`/certifications/operator-exam/`, etc.) not built | Exams are platform features, not static pages. The cert page CTAs link out to the exam app surface. |
| Search uses local JSON index (no server) | 237 lessons fit comfortably in a single fetch. If the corpus grows past ~5K lessons, consider Algolia / similar. |

---

§ Audit run by: Claude (paired with avinash.gaurav@zop.dev) · Site rev: 1223 pages / 1222 sitemap URLs / 237 lessons
