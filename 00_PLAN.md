# ZopDev University — Master Plan

**Status:** Draft v1 for review · **Owner:** Avinash Gaurav · **Date:** 2026-05-19
**Folder:** `/Users/raramuri/Desktop/ZopNight/ZopNight University/`
**Sources read in full:** `USE-CASES.md` (252 lines), `FEATURES (1).md` (607 lines), `RECOMMENDATION-RULES (1).md` (258 KB, 460 rules), `DESIGN.md` (650 lines), Competition Parity `00_INDEX.md` + Vantage + CloudHealth battlecards, Saviynt University, Vantage University, `zop-dev-website-v3.vercel.app`.

---

## 0. The naming decision (please confirm)

You said "ZopDev University" in the prompt but pointed the work folder at "ZopNight University." Both can be right, but they imply different scopes:

| Option | What it means | Recommendation |
|---|---|---|
| **A. ZopDev University** with **ZopNight as flagship campus** | Umbrella brand. ZopNight is launch campus; ZopDay and ZopCloud add campuses later without rename. Mirrors the v3 site's "Build · Deploy · Govern" framing. | ✅ **Recommended.** Future-proof. Matches the 4-quadrant ZopDev mark and the sub-brand model in DESIGN.md §23. |
| **B. ZopNight University only** | Cost-and-governance focused only. Smaller scope, fewer cross-product overlaps. | Use only if you decide ZopDay/ZopCloud will have separate Universities later. |

The rest of this plan assumes **Option A**. If you pick B, drop Tracks 5 and 6's cross-product overlays and rename references.

---

## 1. Mission · Audience · Success

### Mission (one sentence)
**Teach cloud teams the discipline of Continuous Detect → Continuous Remediation (CDCR), using ZopNight as the worked example — so they stop reporting on waste and start removing it.**

### Why this works
- It's faithful to the v3 site's central pitch ("Most FinOps platforms detect and ticket. CDCR detects and acts.").
- It positions us as a **domain educator first, product trainer second** — the Vantage Cloud Cost Handbook + AWS Skill Builder model, not the narrower Saviynt model.
- It's a moat: no competitor teaches execution-first FinOps because none of them ship the execution layer.

### Audience (5 personas — every lesson tagged to ≥1)

| # | Persona | JTBD | Primary metric they answer to |
|---|---|---|---|
| P1 | **Platform / DevOps Engineer** | "Cut non-prod waste without breaking dev." | Monthly infra spend, MTTR |
| P2 | **FinOps Analyst** | "Show the CFO where the money goes — and what we did about it." | Realized savings %, allocation coverage |
| P3 | **Engineering Leader (Director/VP/Head of Eng)** | "Hit the cost target without blocking shipping." | Cost per unit of business (per MAU, per order) |
| P4 | **Finance Partner (FP&A, Procurement)** | "Forecast cloud, allocate to teams, defend the bill." | Forecast accuracy, budget variance |
| P5 | **Security / Compliance Architect** | "Make sure cost automation doesn't break our governance posture." | Audit completeness, RBAC discipline |

### Success metrics (measured 90 days after launch)

| Tier | Metric | Target |
|---|---|---|
| Reach | Unique learners | 2,000 |
| Engagement | Avg lessons completed per learner | 6+ |
| Conversion | Free → trial / demo CTA click-through | 8% |
| Product | "Apply in product" deep-link click-through | 35% |
| Quality | NPS on completed track | ≥ 45 |
| Brand | "Cited by" — appearances in FinOps Foundation, KubeCost, awesome-finops lists | 5+ in 6 mo |

---

## 2. Pedagogical framework (the "why this course is good")

I picked five frameworks that work together. Each lesson in the University will visibly use all five — that's what separates a real curriculum from a docs site with chapters.

| Framework | What it gives us | Where it shows up |
|---|---|---|
| **Backward Design** (Wiggins & McTighe) | Start every lesson from a measurable learner outcome, not from a feature. | Every lesson begins with `Outcome:` — a single Bloom-verb sentence. |
| **Bloom's Taxonomy (revised)** | Force lessons to climb: Remember → Understand → Apply → Analyze → Evaluate → Create. | Lesson level (L100/L200/L300) maps to Bloom range. |
| **Jobs-to-be-Done** (Christensen) | Every lesson is tied to a job a real persona is trying to do. | Lessons carry a `JTBD:` tag in metadata; surfaced in the role-based path filters. |
| **Microlearning + Spaced Practice** | Lessons fit a 5–12 min window; the same concept is revisited across tracks at increasing depth. | Track 4 and 5 deliberately re-use ZopNight features from Tracks 1–3, but at the *domain* level. |
| **Cognitive Load Theory** (Sweller) | Worked examples first, then fading scaffolds. Reduces extraneous load. | Every L200/L300 lesson opens with a *worked example* before asking the learner to do it. |

**Voice + accessibility (from `/zopnight-branded` + DESIGN.md):**
- Direct, confident, no marketing fluff. Periods over em-dashes (banned).
- Specific numbers always — `$31,000–$54,000`, never "thousands."
- WCAG 2.1 AA. Reduced-motion path for every animated diagram.
- Banned words: amazing, powerful, transform, leverage, revolutionize, best-in-class, industry-leading.

---

## 3. Tier model — Practitioner → Engineer → Architect

Borrowed from Saviynt's L100/L200/L300 scheme (it's a known model in the certification world), tuned for cloud cost:

| Tier | Audience | Bloom range | Cert | Time to complete |
|---|---|---|---|---|
| **L100 — Practitioner** | Anyone who touches the product. Free. | Remember → Apply | Free open exam, 20 Qs, 80% pass | 4–6 hours |
| **L200 — Engineer** | Hands-on engineers who configure schedules, recs, autoscaling, MCP. | Apply → Analyze → Evaluate | Customer-free, 40 Qs + 1 graded lab | 12–16 hours |
| **L300 — Architect / Admin** | Sets up the org: RBAC, SAML, multi-account, governance. | Evaluate → Create | Application-based, takehome + interview | 20–24 hours |

L100 gets a digital badge (shareable to LinkedIn). L200 gets a verifiable cert. L300 gets a named "ZopDev Certified Cloud Cost Architect" credential and a profile on a public registry page.

---

## 4. Information architecture (the catalog)

Seven content tracks + five role-based paths (cross-cutting overlays) + one reference library + one community track. The seven tracks are the *content* — the five paths are *curated sequences through that content for a specific persona*. This is the same dual-axis model Vantage uses (modules + role tracks), scaled up.

### 4.1 Tracks (the content)

#### Track 0 — Cloud Cost Foundations *(L100, free, no product)*
Domain fundamentals every learner needs before touching ZopNight.
- M0.1 — The cloud bill, decoded (CUR / Cost Explorer / Azure Cost Mgmt / GCP BigQuery)
- M0.2 — FinOps Foundation principles: Inform → Optimize → Operate
- M0.3 — Why scheduling beats commitments at non-prod scale (math + worked example)
- M0.4 — Rack rate vs. billing cost vs. amortized cost (the two-source model, explained without ZopNight)
- M0.5 — Multi-cloud taxonomy: AWS / GCP / Azure cost surface
- M0.6 — Introducing CDCR — what "act, don't ticket" actually means

#### Track 1 — ZopNight Practitioner *(L100, product)*
The core scheduling loop. Maps 1:1 to FEATURES Priority 1–2.
- M1.1 — Connect a cloud account (vault credentials, permission visibility)
- M1.2 — Discover your estate (resource list, parent-child, grouped filters)
- M1.3 — Build your first schedule (cron, timezone, weekly grid, presets)
- M1.4 — Resource Groups (exclusive membership, sequenced execution)
- M1.5 — Overrides (force-on / force-off, reason, expiry)
- M1.6 — History, notifications, and audit trail

#### Track 2 — ZopNight Engineer *(L200, product)*
Maps to FEATURES Priority 3–4 + Priority 7 + Priority 8.
- M2.1 — The 490-rule library, explained
- M2.2 — Reading evidence: cloud monitoring + activity-log signals
- M2.3 — Auto-remediation: from recommendation to one-click apply (the 20 certified rules)
- M2.4 — VM autoscaling: monitor → recommend → autopilot
- M2.5 — Adopt-or-replace: working with existing cloud-side scaling
- M2.6 — K8s workload scheduling (Deploy / STS / CronJob)
- M2.7 — Databricks scheduling (Workspace / Cluster / Pool / SQL Warehouse)
- M2.8 — Auto-tagging (env + noStop predictions)
- M2.9 — Event Readiness — pre-scale for traffic events
- M2.10 — Cost anomaly detection, root cause, and response

#### Track 3 — ZopNight Architect / Admin *(L300, product)*
Maps to FEATURES Priority 5–6 + Priority 9.
- M3.1 — RBAC: 3 system roles + custom + team-scoped (15 policy entities)
- M3.2 — SAML, Google OAuth, GitHub OAuth — picking the right SSO
- M3.3 — Audit logging: full request/response capture
- M3.4 — Multi-account architecture (org structure, cloud account hygiene)
- M3.5 — Showback design: Org / Teams / Tags / Unit Economics
- M3.6 — Budget governance + threshold alerts
- M3.7 — Dashboards as a governance surface (presets, defaults, RBAC-gated widgets)
- M3.8 — Cost Flow (Sankey) — diagnosing where the money is

#### Track 4 — FinOps Domain Mastery *(L200, domain-led, cross-product)*
Domain content. ZopNight is *one example* of how to operationalize.
- M4.1 — The FinOps maturity ladder (Crawl / Walk / Run)
- M4.2 — Showback vs. chargeback vs. cost allocation — pick your model
- M4.3 — Unit economics: cost per MAU, cost per order, cost per 1K API calls
- M4.4 — Budget governance: limits, thresholds, escalation paths
- M4.5 — Cost anomaly response playbook
- M4.6 — Forecasting cloud spend (top-down, bottom-up, hybrid)
- M4.7 — Commitments demystified — when RI/SP/CUD/Spot makes sense (and when it doesn't)

#### Track 5 — DevOps Cost Discipline *(L200, domain-led, cross-product)*
The "shift cost left" track — the bridge between engineering and FinOps.
- M5.1 — Tagging strategy that survives reorgs
- M5.2 — Schedule design patterns (dev/test/stage/prod separation)
- M5.3 — K8s cost discipline: requests, limits, HPA, idle workloads
- M5.4 — Multi-account architecture for cost isolation
- M5.5 — Reliability vs. cost — picking the line
- M5.6 — IaC + cost (Terraform/CDK/Pulumi tags, drift, blast radius)
- M5.7 — Incident response when cost is the incident

#### Track 6 — AI-Powered Cloud Ops *(L200, signature, product)*
Our headline differentiator. Maps to FEATURES 6.4 (MCP).
- M6.1 — Why agents for cloud ops? (read-only safety model)
- M6.2 — Setting up Claude Desktop / Cursor / Codex / Claude Code
- M6.3 — PATs, org-level MCP toggle, audit logging
- M6.4 — Recipe library: 15 worked examples (oldest stopped EC2, RDS not in multi-AZ, highest-savings recommendations, who pays for what, etc.)
- M6.5 — Building team-specific prompts and skills
- M6.6 — What's not (and shouldn't be) writable via MCP

### 4.2 Role-based learning paths (curated sequences across tracks)

Each path is a hand-picked subset of lessons from Tracks 0–6, ordered for that persona. Mirrors Vantage's role tracks but deeper.

| Path | Modules pulled from | Duration |
|---|---|---|
| **For Platform / DevOps Engineers** | T0.1, T0.6, T1 (all), T2.1, T2.4, T2.6, T5 (all), T6.1–6.3 | 14 hrs |
| **For FinOps Analysts** | T0 (all), T1.1–1.3, T3.5–3.8, T4 (all), T6.1, T6.4 | 12 hrs |
| **For Engineering Leaders** | T0.1, T0.6, T1.1–1.3, T4.1–4.4, T5.1, T5.5 | 6 hrs |
| **For Finance Partners** | T0.1, T0.4, T4 (all), T3.5–3.6 | 5 hrs |
| **For Security / Compliance** | T0, T3 (all), T5.4, T5.6, T6.3, T6.6 | 10 hrs |

### 4.3 Reference library (always-on, not gated)

- **The 490-rule catalog** (searchable, filterable by provider/category/severity, mapped to lessons that teach it)
- **Cloud cost glossary** (terms used in the curriculum, hyperlinked from every lesson)
- **CDCR pattern library** (10–15 named patterns: "off-hours scheduling," "scale-to-zero with HPA," "tag-then-allocate," etc.)
- **Worked-example gallery** (the cost calculations from every L200/L300 lesson, isolated as reusable artifacts)

### 4.4 Community track (built last, but designed-in from day one)

- **Author-submitted lessons** (template-enforced, editorial review)
- **Case studies** (customer-contributed, anonymizable)
- **Pattern submissions** (new CDCR patterns from the field)
- **Q&A** (Discourse-style; gated to logged-in learners)

---

## 5. Lesson template — the five-part structure

This is the single biggest pedagogy decision in the plan. Every lesson — every one — uses the same five parts in the same order. Predictability lowers cognitive load and makes the curriculum scale across authors.

```
┌──────────────────────────────────────────────────────────────┐
│  § Track · Module · Lesson 4 of 6 · L200 · 9 min             │
│                                                              │
│  ▣ OUTCOME                                                   │
│  By the end of this lesson, you will be able to <Bloom verb> │
│  <observable behavior> using <which feature>.                │
│                                                              │
│  ── JTBD ── Personas ── Prerequisites ── Time ──             │
│                                                              │
│  1. CONCEPT  (200–400 words + 1 diagram)                     │
│     The mental model. Why this exists. Where it fits in CDCR.│
│                                                              │
│  2. DEMO  (annotated screenshots OR ≤60s video)              │
│     Watch it happen. Single-take, no narration over visuals. │
│                                                              │
│  3. HANDS-ON  (guided in-product OR sandbox simulator)       │
│     Do it yourself with rails. Deep-link into product.       │
│                                                              │
│  4. KNOWLEDGE CHECK  (2–3 questions)                         │
│     Multiple choice with explanation on wrong answers.       │
│                                                              │
│  5. APPLY  (CTA into the product, with prefilled URL)        │
│     "Now do this on your own estate →"                       │
│                                                              │
│  ── Related lessons ── Rule references ── Glossary terms ──  │
└──────────────────────────────────────────────────────────────┘
```

**Why this works:** every lesson moves the learner through Bloom's: Concept builds *Understand*, Demo and Hands-on push *Apply*, the Knowledge Check forces a *Remember+Apply* recall pulse, and the Apply CTA drives *Apply in production* — outside the classroom. This is the exact pattern AWS Skill Builder, Snowflake University, and HashiCorp Learn use.

### Module wrapper

Each module of 4–8 lessons wraps with:
- A **module quiz** (10 questions, sampled from lesson knowledge checks + 4 net-new)
- A **module lab** (1 graded scenario per L200+ module; ungraded "tour" for L100)
- A **chip / badge** issued on pass

---

## 6. Mapping: every USE-CASE → a lesson

(Quick proof that the content scope is real, not aspirational. Sample of 12 of the 15 use-case areas — full mapping in `/Users/raramuri/Desktop/ZopNight/ZopNight University/02_USECASE_TO_LESSON_MAP.md`, to be generated in Phase 0.)

| USE-CASES.md area | Lesson(s) |
|---|---|
| 1. Resources (discovery + manual control) | T1.M1.1, T1.M1.2 |
| 2. Schedules | T1.M1.3 |
| 3. Resource Groups | T1.M1.4 |
| 4. Overrides | T1.M1.5 |
| 5. History | T1.M1.6 |
| 6. Notifications | T1.M1.6 |
| 7. Recommendations | T2.M2.1–2.3 |
| 8. Reports (cost, trends, breakdown, attribution, Sankey) | T3.M3.5, T3.M3.8, T4.M4.2–4.3 |
| 9. Auto-Tagging | T2.M2.8 |
| 10. Auth & Onboarding | T3.M3.2 |
| 12. VM Autoscaling | T2.M2.4–2.5 |
| 13. Event Readiness | T2.M2.9 |
| 14. AI Assistant (MCP) | T6 (all) |
| 15. Dashboard Personalization | T3.M3.7 |

Every feature in FEATURES.md has a destination. No "we don't teach that yet" gaps.

---

## 7. Differentiation — what we teach that competitors can't

Pulled directly from the competitor parity research. These become headline lessons because no incumbent's university covers them.

| Topic | Lesson | Why competitors can't teach it |
|---|---|---|
| Execution-first CDCR | T0.M0.6 + T2.M2.3 | CloudHealth, Flexera, Apptio, Vantage, CloudZero are observation-only — they have no execution to teach. |
| K8s workload scheduling (Deploy/STS/CronJob) | T2.M2.6 | Only Harness CCM has anything close, and only for HTTP workloads. We schedule the CronJob, not the cluster. |
| Databricks scheduling | T2.M2.7 | Nobody else discovers Databricks children as schedulable. |
| Permission Visibility | T1.M1.1 | Unique to us — others silently fail discovery. |
| Two-source cost model (Rack + Billing, amortized Azure) | T0.M0.4 | Nobody else uses amortized Azure cost; everyone else has 24h+ stale data. |
| Adopt-or-replace for existing cloud scaling | T2.M2.5 | Unique. Spot, CAST.ai overwrite; we explicitly ask. |
| MCP for cloud cost | T6 (entire track) | Nobody else has an MCP server. 43 read-only tools is a 2026 differentiator. |
| Progressive autonomy (monitor → recommend → autopilot) | T2.M2.4 | CAST AI is all-or-nothing; ProsperOps is hidden. We expose the spectrum. |

These get tagged as **"Only at ZopDev University"** in the catalog — a small orange chip — to make the moat visible.

---

## 8. Visual & branding (mapping DESIGN.md to a learning surface)

The University inherits the ZopDev design system verbatim. The decisions below are about *which* parts to lean into.

### Layout
- `--max: 1200px` container, `--gutter: 32px`. Standard chrome from `homepage-chrome.css`.
- **Catalog page:** asymmetric bento grid of tracks. Hero card for the currently-recommended path; smaller cards for the seven tracks. Banned: identical 5+ same-size card grids (DESIGN.md §11).
- **Track page:** progress rail on the left (square chip per lesson, fills as completed), lesson content in the main column.
- **Lesson page:** the five-part template above, scrollable, single column.

### Sub-brand color rules (DESIGN.md §23)
- ZopNight-product tracks (1, 2, 3) — `--zop-blue` eyebrows and accents.
- ZopDay-product tracks (future) — `--zop-orange`.
- ZopCloud-product tracks (future) — `--zop-green` (dark only, AA-safe variant).
- Domain tracks (0, 4, 5) — neutral chrome only, **no sub-brand color** (so they read as cross-product).
- T6 — `--zop-orange` (because MCP is the signature accent feature, and `/zopnight-branded` already marks it as a 2026 differentiator).

### Signature elements to use
- The `§<num> · <name>` mono eyebrow with the orange 10×10 square — at the top of every track and module.
- The 4-column Sankey-style diagram (from the Cost Flow card) — for the "where the money goes" lessons in T0 and T3.
- The PCB/circuit-board diagram — for the "what runs where" architecture lessons in T5.
- The dotted world map (regions + pulses) — for the multi-cloud taxonomy lesson (T0.M0.5).
- The dashboard mock UI (always-dark) — for any "this is what it looks like in product" inline visuals.
- Cream-tinted neutrals, square corners, Space Grotesk + JetBrains Mono everywhere.

### Banned in University copy (DESIGN.md §11 + brand voice)
- Em-dashes in lesson body.
- Gradient text.
- Bounce / elastic easing on any interactive element.
- "Amazing," "powerful," "transform," "leverage," "revolutionize."
- Pure `#000` / `#fff`.
- Generic illustrations / stock photo people.

---

## 9. Image / diagram inventory (concrete production list)

These are the visuals we **must** produce; everything else is text + screenshots.

### Hero / cover art (8 pieces)
- 1 University home hero (Globe + dot-grid, multi-region — re-use the dotted world map pattern)
- 7 track covers (one per track) — each uses the dominant color rule above

### Module diagrams (one signature diagram per module, ~50 total)
- T0.M0.4: two-source cost model diagram (Rack vs Billing vs Amortized) — original
- T0.M0.6: CDCR loop diagram — original signature visual
- T1.M1.1: cloud-account → permission audit flow — original
- T1.M1.3: weekly 24-hour grid (the actual schedule visualization)
- T2.M2.1: rule taxonomy radial (8 categories × 490 rules)
- T2.M2.4: monitor → recommend → autopilot progressive-autonomy spectrum
- T2.M2.6: K8s parent-child cluster diagram
- T3.M3.1: RBAC policy entity map (15 entities, role-scoped)
- T3.M3.8: Cost Flow Sankey (reuse the production component, with sample data)
- T4.M4.1: FinOps maturity ladder (Crawl/Walk/Run)
- T5.M5.3: K8s cost discipline anatomy
- T6.M6.1: MCP request flow (Claude Desktop → PAT → gateway → tools)

### Annotated screenshots (~80, one per L200 lesson)
- Pull from real product. Annotate with the orange 10×10 squares as callouts (signature element).

### Source files
All diagrams authored in **Figma**; exported as SVG (line art) + PNG@2x (fallback). Storage in `/Users/raramuri/Desktop/ZopNight/ZopNight University/assets/`.

---

## 10. Assessment & certification

| Tier | Format | Pass | Issuance |
|---|---|---|---|
| **L100 — Practitioner** | 20 MCQs, browser-based, open-book | 80% | Digital badge (Credly or self-hosted), shareable to LinkedIn |
| **L200 — Engineer** | 40 MCQs + 1 graded lab (10 tasks in sandbox) | 75% on each | Verifiable cert with unique ID, public registry page |
| **L300 — Architect** | Take-home design exercise + 45-min review interview | Pass / Re-submit | Named credential: "ZopDev Certified Cloud Cost Architect" |

L100 is free. L200 is free for customers, $99 for non-customers (matches Saviynt's tiered-access model). L300 is by application — gates the prestige and gives sales an enterprise hook.

---

## 11. Contribution model (since "people add things")

The user said "whatever people add in the university pages." That's a contribution surface. It needs structure or it becomes a wiki graveyard.

### Three contribution lanes

| Lane | Who | Process | Time-to-publish |
|---|---|---|---|
| **Author-submitted lessons** | Customers, partners, employees | Pull request against the lesson template; editorial board reviews; merged when criteria met | 1–2 weeks |
| **Pattern submissions** | Anyone | Shorter template (one-page); approved by single editor | 3–5 days |
| **Case studies** | Customers (with consent) | Interview → editorial draft → customer sign-off | 2–3 weeks |

### Lesson template enforcement
Authors fork `/Users/raramuri/Desktop/ZopNight/ZopNight University/lesson_template.md` and fill in the five parts. The editorial board (one PM, one engineer, one writer) reviews against a published rubric (the same rubric this plan establishes). Reject if Outcome is missing a Bloom verb, if there's no Hands-on, or if it's a feature ad in disguise.

### Author bylines
Every published lesson lists author name, role, LinkedIn link. Makes contribution prestigious enough that customers want to do it for their own brand.

---

## 12. Platform recommendation (flagged, not decided)

| Option | Pros | Cons | Use |
|---|---|---|---|
| **A. Static, MDX-based (Next.js or Astro)** | Fast, version-controlled, fits the v3 site's stack, zero LMS lock-in, AI-friendly | No native progress tracking; needs custom for quizzes / badges | ✅ **Recommended for V1** |
| B. Hosted LMS (Docebo, Thinkific, LearnWorlds) | Quizzing, certs, badging out of the box | Off-brand, slow, expensive at scale, locks content into proprietary format | When learner count > 5K |
| C. Hybrid (static content + lightweight LMS for progress/quiz/cert) | Best of both | Two systems to maintain | When V1 is validated |

**Recommendation:** Build V1 as MDX on the existing v3 site under `/university`. Quiz state in `localStorage` for V1; database-backed when we add accounts. Badge issuance via Credly when L200 ships.

Decision needed from you before Phase 0 starts.

---

## 13. Build phasing (12-week roadmap)

| Phase | Weeks | Deliverables | Owner |
|---|---|---|---|
| **Phase 0 — Foundation** | 0–1 | This plan approved · IA file · Lesson template · Visual style guide · Image production brief · Platform decision | PM + Design |
| **Phase 1 — Track 0 (Foundations) + Track 1 (Practitioner)** | 2–4 | 6 + 6 = 12 lessons live · 1 catalog page · 2 track pages · L100 cert exam draft | Writer + Eng |
| **Phase 2 — Tracks 4 + 5 (FinOps + DevOps domain)** | 5–6 | 7 + 7 = 14 lessons live · Cross-product pattern library MVP | Writer + Domain SME |
| **Phase 3 — Track 2 (Engineer) + Track 3 (Architect)** | 7–9 | 10 + 8 = 18 lessons live · L200 lab sandbox · 490-rule reference catalog | Eng + Writer |
| **Phase 4 — Track 6 (AI Ops) + role paths + certs** | 10–11 | T6 (6 lessons) · 5 role paths · L100 cert live · L200 cert draft | Eng + PM |
| **Phase 5 — Community track + L300 + iteration** | 12+ | Contribution surface · L300 application · feedback loop · second-cohort cycle | PM + Editorial board |

**Total at launch (end of Phase 4):** ~56 lessons, 7 tracks, 5 paths, 1 cert live, 1 in beta. Closing target is launchable in **10 weeks** with one writer + one engineer + design partner.

---

## 14. Proposed folder structure (this folder)

```
ZopNight University/
├── 00_PLAN.md                              ← this file
├── 01_INFORMATION_ARCHITECTURE.md          (next; expands §4 to full sitemap)
├── 02_USECASE_TO_LESSON_MAP.md             (cross-walk between USE-CASES.md and lessons)
├── 03_LESSON_TEMPLATE.md                   (the canonical author template — §5 made concrete)
├── 04_VISUAL_STYLE_GUIDE.md                (DESIGN.md mapped to learning surface)
├── 05_VOICE_AND_TONE.md                    (brand voice rules for lesson authors)
├── 06_CONTRIBUTION_GUIDE.md                (§11 expanded — for external authors)
├── 07_CERTIFICATION_FRAMEWORK.md           (§10 expanded — exam blueprints)
├── tracks/
│   ├── T0_foundations/
│   │   ├── 00_README.md                    (track overview, outcome, audience)
│   │   ├── M0.1_cloud_bill_decoded.md
│   │   ├── M0.2_finops_principles.md
│   │   └── …
│   ├── T1_zopnight_practitioner/
│   ├── T2_zopnight_engineer/
│   ├── T3_zopnight_architect/
│   ├── T4_finops_mastery/
│   ├── T5_devops_cost_discipline/
│   └── T6_ai_powered_cloud_ops/
├── paths/                                   (the 5 role-based curated paths)
│   ├── platform_engineer.md
│   ├── finops_analyst.md
│   ├── engineering_leader.md
│   ├── finance_partner.md
│   └── security_compliance.md
├── reference/
│   ├── rule_catalog.md                      (the 490 rules, browsable)
│   ├── glossary.md
│   ├── patterns/                            (10–15 CDCR patterns)
│   └── worked_examples/
├── certifications/
│   ├── L100_practitioner_exam_blueprint.md
│   ├── L200_engineer_exam_blueprint.md
│   └── L300_architect_application.md
├── assets/                                  (all diagrams, screenshots, source files)
│   ├── covers/
│   ├── diagrams/
│   └── screenshots/
└── editorial/
    ├── rubric.md                            (what makes a lesson pass review)
    ├── style_guide.md                       (Chicago + brand-voice deltas)
    └── editorial_calendar.md
```

Nothing in this folder is created yet. **I will not write any of it until you approve §1–§13.** That's the next step.

---

## 15. Open questions (decide together before Phase 0 starts)

1. **Naming** — Option A (ZopDev University) or Option B (ZopNight University only)? Default: A.
2. **Platform** — Confirm Option A from §12 (static MDX on `/university`) or push for a hosted LMS now?
3. **L100 / L200 / L300 nomenclature** — keep Saviynt-style L-tiers, or rename to ZopDev-native (e.g., "Operator / Engineer / Architect")? Default: rename to **Operator / Engineer / Architect** (more ZopDev voice; less corporate-LMS).
4. **Pricing model for L200 cert** — free for everyone, free-for-customers + $99 non-customer, or paid for all? Default: free-for-customers + $99 non-customer.
5. **External authors** — open the contribution lane from day one, or wait until V1 is stable (Phase 5)? Default: design-in from day zero, open in Phase 5.
6. **Sub-brand color binding** — confirm the binding in §8 (ZopNight tracks → blue, T6 → orange, domain tracks → neutral)?
7. **Image production** — do we have a Figma source for the existing site's PCB / world-map / Sankey diagrams that I can reuse, or do these need to be re-drawn?
8. **First track to publish** — Track 0 (Foundations, domain-led) or Track 1 (Practitioner, product-led)? Default: ship **both Track 0 and Track 1 together** in Phase 1 so the first public surface is balanced (domain + product).
9. **Voice check** — does `/zopnight-branded` need to be invoked for every lesson, or do we bake the rules into `05_VOICE_AND_TONE.md` and skip per-lesson invocation? Default: bake into the style guide; spot-check with the skill on milestones.
10. **Roadmap for ZopDay / ZopCloud campuses** — are we committing to those campuses in the IA from day one (placeholders + dim links), or hiding until they exist? Default: visible-but-greyed placeholders ("Coming with ZopDay" / "Coming with ZopCloud") — same treatment the v3 site uses for ZopCloud.

---

## 16. What I will *not* do without your sign-off

- Write any lesson content yet.
- Create any of the sub-folders in §14.
- Commission diagrams.
- Decide the platform.
- Touch the v3 site or any deployed surface.

When you reply with the decisions to §15, I'll execute Phase 0 — write IA, lesson template, visual style guide, voice guide, contribution guide, and the cert framework as separate files in this folder. Then we pause for review again before Phase 1 lesson writing starts.

---

**End of plan.** Read the open questions in §15 and reply with your defaults / overrides. The plan adjusts before any file in §14 gets created.
