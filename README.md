# ZopDev University

The operating manual for cloud cost teams. A free, open curriculum from the team that builds ZopNight. 237 lessons across 7 courses. 3 publicly verifiable certifications. Generated as a static site.

Production URL (when deployed): `https://zop.dev/resources/university/`

---

## What this is

A static-site curriculum with three jobs to be done.

1. **Teach** cloud cost optimization end-to-end, from "read your first cloud bill" to "design the cost-discipline practice for a 5,000-engineer org."
2. **Credential** people who actually run the practice — three tiers (Operator, Engineer, Architect), each backed by a proctored exam, each publicly verifiable in two clicks.
3. **Reference** the vocabulary — 921 glossary terms extracted from the curriculum, every one carrying a definition (100% coverage) pulled verbatim from the lesson where the term is first defined.

Everything is hand-authored markdown. The build script renders it into 1,236 static HTML pages.

---

## Stack

- **Node** (any LTS, no specific version pinned). Zero runtime dependencies. No npm install needed.
- **build.js** — single Node script that walks `tracks/`, parses lesson markdown, and writes the static site to `site/`.
- **site/assets/styles.css** — ~2,800 lines of vanilla CSS implementing the ZopDev brand system: Space Grotesk + Inter + JetBrains Mono on cream paper, square corners, orange-square eyebrows, strip-style cells.
- **site/serve.js** — minimal Node HTTP server for local preview.
- **vercel.json** — production deploy config (clean URLs, trailing slashes, security headers, immutable asset caching).

No bundler, no framework, no build step beyond `node build.js`. The whole thing is plain HTML on disk.

---

## Quick start

```bash
# Clone
git clone https://github.com/avinashdotcom/zopdev-university.git
cd zopdev-university

# Build (writes to ./site)
node build.js

# Local preview (port 5176)
node site/serve.js
# → http://127.0.0.1:5176/
```

The build is idempotent. Re-run `node build.js` after any source edit.

For production builds (paths rooted at `/resources/university/...`):

```bash
BASE_URL=/resources/university node build.js
```

---

## Project structure

```
zopdev-university/
├── build.js                   Single-file static-site generator (~4,100 lines)
├── tracks/                    Authored curriculum (markdown only)
│   ├── T0_foundations/
│   │   ├── M0.1_cloud_bill_decoded/
│   │   │   ├── 00_README.md
│   │   │   ├── L1_what_is_in_a_cloud_bill.md
│   │   │   ├── L2_rack_rate_vs_what_you_paid.md
│   │   │   └── ...
│   │   └── ...
│   ├── T1_zopnight_operator/
│   ├── T2_zopnight_engineer/
│   ├── T3_zopnight_architect/
│   ├── T4_finops_mastery/
│   ├── T5_devops_cost_discipline/
│   └── T6_ai_powered_cloud_ops/
├── certifications/            Authored cert descriptions (not used by build yet)
├── paths/                     Role-based reading paths (Engineering Leader, Finance Partner, etc.)
├── reference/                 Glossary, patterns, rules, worked examples
├── preview/                   Generated preview screenshots
├── site/                      ★ GENERATED OUTPUT — what gets deployed
│   ├── index.html             Landing (copied from preview/index.html — see note below)
│   ├── foundations/           Course pages (one per course)
│   ├── operator/
│   ├── engineer/
│   ├── architect/
│   ├── finops-mastery/
│   ├── devops-cost-discipline/
│   ├── ai-powered-cloud-ops/
│   ├── certifications/
│   │   ├── index.html
│   │   ├── operator/sample/   Sample printable credential
│   │   ├── engineer/sample/
│   │   ├── architect/sample/
│   │   └── verify/            Public credential-ID verification page
│   ├── glossary/              921 term pages + index
│   ├── search/                Client-side lesson search
│   ├── assets/styles.css
│   ├── sitemap.xml
│   ├── robots.txt
│   └── vercel.json
├── 00_PLAN.md                 Original plan + IA
├── 01_INFORMATION_ARCHITECTURE.md
├── 02_TOPIC_COMPENDIUM.md
├── 03_DURATION_AND_TONE_CALIBRATION.md
└── 04_CLIENT_READINESS_AUDIT.md  Pre-launch audit report
```

The committed `site/` directory is regenerated from `tracks/` on every build. Both are version-controlled so Vercel can deploy without a build step.

> **Homepage note.** The deployed `site/index.html` is not the `renderLanding()` output. As the final build step, `build.js` copies the hand-authored bento + isometric homepage from `preview/index.html` over the generated landing (search `HOMEPAGE OVERRIDE` in `build.js`). The generated landing still builds; it is simply overwritten. Edit the homepage in `preview/index.html`, not `renderLanding()`.

---

## How a lesson works

Every lesson follows the same shape so engineers and finance partners can find what they need fast.

```
# Lesson title

§ T2 · M2.11 · L5 of 5 · Engineer tier · 9 min       <-- signature (parsed, rendered in chrome)

## Outcome

By the end of this lesson, you will be able to ...   <-- authored outcome (pulled into hero callout)

| | |                                                <-- metadata table (rendered as metabox)
|---|---|
| **Tier** | Engineer |
| **JTBD** | "..."  |
| **Personas** | ... |
| **Prerequisites** | ... |
| **Time** | 9 minutes |
| **Bloom verb** | ... |

## 1. Concept                                        <-- body starts here

[Concept content with code, tables, examples]

## 2. Demo

[Concrete numbers from real estates]

## 3. Hands-on (5 min)

[A 5-minute exercise the reader can run on their own bill]

## 4. Knowledge check

### Q1
[Three questions per lesson, each with a written explanation]

## 5. Apply

[Deep-links into ZopNight where applicable]

## Related lessons

- [L1 — ...](L1_...md)

## Glossary terms touched

[Rack rate](../../../reference/glossary/rack-rate.md) · [Effective discount](...)
```

The build script:
- Parses the signature line and renders it in the lesson header (cleaned up — drops `§`, replaces `·` with `/`).
- Pulls the outcome paragraph into a dedicated orange-bordered callout above the metabox.
- Strips the header block (H1 + § + outcome + metadata table) from the body so they don't render twice.
- Rewrites `[term](../../../reference/glossary/<slug>.md)` links into `/glossary/<slug>/`.
- Extracts the paragraph that mentions each glossary term in body prose and stores it as that term's definition on the glossary index + term page.

---

## Deploy to Vercel

```bash
# One-time setup
cd site
vercel link             # link this directory to a Vercel project

# Subsequent deploys
vercel deploy --prod
```

Or wire up GitHub integration from the Vercel dashboard:

1. https://vercel.com/new → import `avinashdotcom/zopdev-university`
2. Root directory: `site`
3. Framework preset: Other
4. Build command: (empty — already built)
5. Output directory: `.`

Subsequent pushes to `main` will auto-deploy to production.

---

## Brand + design system

The University inherits the ZopDev design system (`SKILL.md` / `DESIGN.md` in the parent zopdev-branding skill). Highlights enforced here:

- **Colors**: cream paper `#FAF7EC`, ink `#0A0A0A`, zop-blue `#2A4494`, zop-orange `#F58549`, zop-green-deep `#3f6320`. Never pure black or white.
- **Type**: Space Grotesk (display), Inter (body), JetBrains Mono (labels/code). Headings hard-locked to Space Grotesk via `!important`.
- **Geometry**: Square corners only (`border-radius: 0`). Two exceptions: pills (`9999px`) and circular dot indicators ≤8px (`50%`).
- **Banned characters in chrome**: `§ · — – → ★ ✦ ❖ ◆ ❯ ▶ ●` and emoji. Replace with comma/period/colon/parentheses, or drop entirely.
- **Eyebrow pattern**: orange 10×10 square + mono uppercase label. No section sign, no middle dot.
- **Hover signature**: `translateY(-4px) + box-shadow: 0 8px 0 -4px var(--ink)`. Universal across buttons, bento tiles, cert cards.
- **Focus rings**: `2px solid var(--zop-orange)` with `2px` offset, via `:focus-visible` only. One contract sitewide.
- **Strip cells** (the proof-strip visual idiom): vertical accent bar on the left edge + big number/text + mono caps label. Used on hero proof strip, cert detail proof strip, cert card ribbons, and cert artwork hero.

If you find an em-dash or section sign in chrome, it's a defect — file it.

---

## Authoring a new lesson

1. Pick the course and module:
   ```
   tracks/<T_course>/<M_module>/L<N>_<slug>.md
   ```
2. Write the lesson using the shape above.
3. Run `node build.js`. The new lesson + its glossary term references + sitemap entries land automatically.
4. Preview at `http://127.0.0.1:5176/<course>/<module>/<lesson>/`.

The build is fast (~1 second for the full 1,236-page generation). Iterate freely.

---

## Editorial conventions

- **One outcome per lesson.** Start with the specific operational thing the reader will be able to do.
- **Specific numbers.** "$31,000" not "thousands of dollars." "47% cost reduction" not "significant savings."
- **No marketing fluff.** Banned: amazing, powerful, transform, leverage, revolutionize, best-in-class, industry-leading.
- **Short sentences.** Periods preferred over em-dashes.
- **Mono labels for meta**, sentence case for headings.
- **Knowledge checks**: three questions per lesson, each with a written explanation — readers learn from the reasoning, not the letter.

---

## License + use

Curriculum content is © 2026 ZopDev University Editorial Board. The static-site generator (`build.js`) and design system (`site/assets/styles.css`) are internal-use code.

For questions or contributions, contact the ZopDev University Editorial Board.

---

## Stats (current)

- 7 courses
- 52 modules
- 237 lessons
- 921 glossary terms (all with an authored or extracted definition, 100% coverage)
- 3 certifications (Operator, Engineer, Architect)
- 1,236 generated HTML pages
- 1,235 sitemap URLs
