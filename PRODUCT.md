# ZopDev University

The operating manual for cloud cost teams. A free, open curriculum from the team that builds ZopNight. Lives at `zop.dev/resources/university/` as a static, hand-authored HTML surface and a marketing landing page that funnels into the curriculum.

## Register

**Brand**. This is identity-driven content: the marketing landing for the University property. The lesson pages themselves are content-led brand, not application UI. There is no app inside this surface.

## Users

- **Platform / FinOps engineers** (primary). Hands-on practitioners who run cloud cost programs day-to-day. Already technical. Skim fast, return for reference. They are the audience the curriculum is written for.
- **Engineering leaders / managers** (secondary). Make hiring and certification decisions. Care about whether a cert is real and whether the content stands up to engineering scrutiny. They evaluate the landing in under 60 seconds.
- **Solution architects (internal)** (tertiary). Send customers to specific tracks during onboarding. Want each track shareable with a single URL.

## Product purpose

Three jobs to be done, in order:

1. **Teach** cloud cost optimization end-to-end. 237 lessons across 7 tracks (Foundations, Operator, Engineer, Architect, FinOps Mastery, DevOps Cost, AI-Powered Ops). Foundations is free; tracks compound from there.
2. **Credential** the people who actually run the practice. Three tiers — Operator, Engineer, Architect — each backed by an exam, each publicly verifiable in two clicks. The cert is real because engineering leaders ask for it on résumés.
3. **Reference** the vocabulary. ~922 glossary terms extracted from the curriculum, 502 with authored definitions.

## Voice

- Direct, confident, no marketing fluff. Short sentences. Periods preferred.
- Em-dashes are banned in copy (they read as AI-generated). Use commas, colons, periods, parentheses.
- Specific numbers: "252 lessons" not "many lessons." "$31,000–$54,000" not "thousands."
- Banned words: amazing, powerful, transform, leverage, revolutionize, best-in-class, industry-leading.

## Anti-references

- Pluralsight / Udemy / LinkedIn Learning. Generic course-marketplace card grids, stock photography, smiling-developer hero shots. Banned.
- Generic SaaS hero with a stat strip and gradient text. Banned.
- "AI-powered" anywhere outside the AI Ops track. The differentiator earns its mention; it does not decorate the hero.

## Strategic principles

- This is the University inside the ZopNight marketing chrome. Buttons, logos, heading lock, whitespace, and the section-meta orange square come from the homepage at `zop.dev`. Do not invent local chrome.
- One signature visual per page. The marketing homepage uses a dotted globe; product pages each carry a different dotted shape. The University needs **its own** signature visual moment, not a repeat of any product-page shape.
- The bento is the structural pattern for the landing — it must feel like the homepage's feature bento (varied widths, asymmetric, ink hover lift, transform-only stripe reveal).
- No italic body or heading text. (Italic Space Grotesk reads as a 90s textbook in this register; periods do the job an emphasis would do.)
- Brand colors are locked: `--zop-blue #2A4494` (ZopNight), `--zop-orange #F58549` (ZopDay + signature accent), `--zop-green #7FB236` (ZopCloud). Cream paper `#FAF7EC`, ink `#0A0A0A`. Never pure black/white.

## Stack

Plain HTML on disk. `build.js` (single Node script, zero runtime deps) renders markdown lessons into 1,227 static pages under `site/`. Local preview via `site/serve.js` or the standalone `preview/` mock. Production deploy via Vercel.
