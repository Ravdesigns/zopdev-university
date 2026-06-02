# ZopDev University — Complete Information Architecture

**Companion to:** [`00_PLAN.md`](00_PLAN.md)
**Status:** Draft v1 — every page enumerated, lesson titles + outcomes, no lesson bodies yet (per §16 of the plan)
**Date:** 2026-05-19

This document answers "tell me every page that will exist." It assumes the §15 defaults from `00_PLAN.md` were accepted; overrides noted inline where decisions matter.

---

## 0. Conventions applied (defaults from `00_PLAN.md` §15)

| Decision | Applied here |
|---|---|
| Naming | **ZopDev University** (umbrella), ZopNight = flagship campus |
| Cert tiers (renamed) | **Operator → Engineer → Architect** (replaces Saviynt-style L100/L200/L300) |
| Platform | Static MDX under `/university` on the v3 site |
| ZopDay / ZopCloud campuses | Visible placeholders ("Coming with ZopDay" / "Coming with ZopCloud") |
| First track to ship | Track 0 + Track 1 together (Phase 1) |
| L200 cert pricing | Free for customers, $99 outside |
| Contributions | Designed-in day 0, opened Phase 5 |
| Voice | Baked into `05_VOICE_AND_TONE.md`; spot-checked at milestones |
| Sub-brand color binding | ZopNight tracks → blue · T6 (MCP) → orange · domain tracks (T0/T4/T5) → neutral |

If you want any of these reversed, flag now and the IA shifts accordingly.

---

## 1. Master sitemap (every URL, grouped)

### 1.1 Public chrome — visitor, not logged in

| URL | Page type | Purpose |
|---|---|---|
| `/university` | Home | Hero + the path picker + featured lessons + "Only at ZopDev University" strip + newsroom snippet |
| `/university/catalog` | Catalog | Filterable grid of all 7 tracks · 50 modules · 241 lessons |
| `/university/paths` | Paths landing | The 5 role-based curated sequences |
| `/university/paths/platform-engineer` | Path detail | Curated lesson sequence for Platform / DevOps Engineers |
| `/university/paths/finops-analyst` | Path detail | Sequence for FinOps Analysts |
| `/university/paths/engineering-leader` | Path detail | Sequence for Eng Leaders |
| `/university/paths/finance-partner` | Path detail | Sequence for FP&A / Procurement |
| `/university/paths/security-compliance` | Path detail | Sequence for Security / Compliance Architects |
| `/university/certifications` | Cert landing | Three credentials side by side |
| `/university/certifications/operator` | Cert detail | Operator exam blueprint, prep guide, schedule |
| `/university/certifications/engineer` | Cert detail | Engineer exam + lab blueprint |
| `/university/certifications/architect` | Cert detail | Architect application + take-home |
| `/university/certifications/verify` | Verifier | Public cert lookup by ID |
| `/university/certifications/registry` | Registry | Public list of credentialled people who opted in |
| `/university/community` | Community hub | Q&A + recently-added lessons + contributor leaderboard |
| `/university/community/qa` | Q&A | Discourse-style threads, gated to logged-in learners |
| `/university/reference` | Reference index | Rule catalog · Glossary · Pattern library · Worked examples |
| `/university/reference/rules` | Rule catalog | 460 rules, filterable by provider/category/severity, deep-links to lessons |
| `/university/reference/rules/[ruleId]` | Rule detail | One per rule (or 1 dynamic page) — what it checks, evidence, remediation, lessons |
| `/university/reference/glossary` | Glossary | A–Z, hyperlinked from every lesson |
| `/university/reference/glossary/[term]` | Term detail | One term, 1–2 paragraphs, see-also links |
| `/university/reference/patterns` | Pattern library | 15 named CDCR patterns |
| `/university/reference/patterns/[pattern]` | Pattern detail | One pattern, 1 diagram, 1 worked example, 1 anti-pattern |
| `/university/reference/worked-examples` | Worked examples | All cost-calculation examples extracted from L200+ lessons |
| `/university/reference/worked-examples/[id]` | Worked example | One example, with the numbers and the math |
| `/university/about` | About | Mission, editorial standards, who runs the University |
| `/university/about/editorial-board` | Editorial board | Named board members |
| `/university/about/methodology` | Methodology | The pedagogical framework, in plain language |
| `/university/contributors` | Contributors directory | Authors with bylines + LinkedIn |
| `/university/contributors/[handle]` | Contributor profile | One author, lessons authored, bio |
| `/university/contribute` | Contribute landing | The three lanes (lessons / patterns / case studies) |
| `/university/contribute/lesson` | Submit a lesson | Form + template + rubric link |
| `/university/contribute/pattern` | Submit a pattern | Shorter form |
| `/university/contribute/case-study` | Submit a case study | Form + interview booking |
| `/university/contribute/rubric` | Rubric | What passes editorial review |
| `/university/contribute/style-guide` | Style guide | Voice, tone, banned words, citation style |
| `/university/newsroom` | Newsroom | What's new — new lessons, version updates |
| `/university/newsroom/[slug]` | News post | One update |
| `/university/faq` | FAQ | Top 20 |
| `/university/search` | Search | Across all content |
| `/university/sitemap` | HTML sitemap | Linkable index of every page |
| `/university/privacy` | Privacy | Legal |
| `/university/terms` | Terms | Legal |

**Subtotal:** 32 fixed pages + dynamic detail pages (paths × 5, glossary terms, rules, patterns, examples, contributors).

### 1.2 Track + module + lesson space

| URL pattern | Count | Notes |
|---|---|---|
| `/university/tracks/[track]` | 7 + 2 placeholder | T0–T6 (real) + zopday/zopcloud (placeholders) |
| `/university/tracks/[track]/[module]` | 50 | All modules across the 7 active tracks |
| `/university/tracks/[track]/[module]/[lesson]` | 241 | Full lesson set |

**Subtotal:** 9 + 50 + 241 = **300 track-space pages.**

### 1.3 Learner account space (built in Phase 4)

| URL | Purpose |
|---|---|
| `/university/sign-in` | Auth |
| `/university/sign-up` | Auth |
| `/university/me` | Learner dashboard — progress, completed lessons, earned chips |
| `/university/me/progress` | Track-by-track progress detail |
| `/university/me/certifications` | Issued credentials |
| `/university/me/bookmarks` | Saved lessons |
| `/university/me/contributions` | Lessons / patterns the learner has submitted |
| `/university/me/settings` | Email prefs, profile, privacy |

**Subtotal:** 8 pages.

### 1.4 Editorial back-office (auth-gated, not in public sitemap)

| URL | Purpose |
|---|---|
| `/university/editorial/queue` | Submissions awaiting review |
| `/university/editorial/calendar` | Public-facing editorial calendar (mirrored to `/newsroom/calendar`) |
| `/university/editorial/lessons` | Lesson lifecycle — draft, review, scheduled, published, retired |
| `/university/editorial/analytics` | Lesson-level engagement metrics |

**Subtotal:** 4 pages.

### 1.5 Total public URL count

| Category | Pages |
|---|---|
| Public chrome (fixed) | 32 |
| Paths (5) + cert details (3) + Verifier/Registry (2) | already counted in chrome |
| Tracks + modules + lessons | 300 |
| Glossary terms (assume ~120) | 120 |
| Rules (assume each gets a stable URL even if dynamic) | 460 |
| Patterns | 15 |
| Worked examples | ~25 |
| Contributor profiles (assume ~30 at steady state) | 30 |
| Newsroom posts (assume ~20 in year 1) | 20 |
| **Public total** | **~1,002 URLs** |
| Learner account | 8 (auth) |
| Editorial back-office | 4 (auth) |

**At-launch reality (end of Phase 4):** ~340 unique URLs live. The rest grow as content publishes.

---

## 2. Page templates (the design system for each page type)

Eleven page types cover the entire University. Every URL above slots into one of them.

| # | Template | Used by | Hero element | Primary CTA | Color binding |
|---|---|---|---|---|---|
| T-1 | **University Home** | `/university` | Globe + dot-grid | "Take the 2-min path picker" | Neutral with orange accents |
| T-2 | **Catalog** | `/catalog` | Bento grid of 7 tracks | "Open a track" | Mixed sub-brand chips |
| T-3 | **Path landing** | `/paths/*` | Persona portrait card | "Start the path" | Persona-specific |
| T-4 | **Track overview** | `/tracks/[track]` | Track cover + outcome | "Open Lesson 1" | Track sub-brand |
| T-5 | **Module overview** | `/tracks/[track]/[mod]` | Module diagram | "Open Lesson 1" | Inherits track |
| T-6 | **Lesson** | `/tracks/[track]/[mod]/[lesson]` | Outcome banner | "Apply in product →" | Inherits track |
| T-7 | **Reference index** | `/reference`, `/reference/rules`, etc. | Filter rail | none (browse) | Neutral |
| T-8 | **Detail card** | Rule, glossary term, pattern, worked example | Single panel | "See lesson that teaches this" | Neutral |
| T-9 | **Cert landing** | `/certifications/*` | Badge artwork + blueprint | "Schedule the exam" | Operator=blue, Engineer=orange, Architect=green |
| T-10 | **Form / submit** | All `/contribute/*` | Form | "Submit" | Neutral |
| T-11 | **Account / progress** | `/me/*` | Progress chips | none | Neutral |

Every template inherits `homepage-chrome.css` per `DESIGN.md` §13–§14. Buttons, eyebrows, cards, motion tokens are unchanged from the design system. The Catalog page must follow the asymmetric-bento rule (DESIGN.md §11 anti-pattern: identical 5+ same-size cards forbidden).

---

## 3. Per-track full manifest (every module, every lesson, every outcome)

Track outcomes use Bloom-aligned verbs. Lesson outcomes follow the same convention: "By the end of this lesson, you will be able to **<verb>** **<object>**." For brevity below, the verb+object is shown after the lesson title.

Lesson counts in `()` next to each module title. Time per lesson: 5–12 min. JTBD tag (J1–J5) maps to the personas in `00_PLAN.md` §1.

---

### Track 0 — Cloud Cost Foundations · *Operator tier · 27 lessons · free · neutral chrome*

**Track outcome:** *Explain the cloud cost domain end-to-end, including the FinOps lifecycle, the math of scheduling vs. commitments, the difference between rack rate / billing / amortized cost, and what CDCR means — without using ZopNight yet.*
**Cover diagram:** Dotted world map with three regions pulsing (AWS/GCP/Azure).
**JTBD tags:** J1, J2, J3, J4, J5.

#### M0.1 — The cloud bill, decoded *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What's actually in a cloud bill | Identify the four major line items in an AWS / GCP / Azure invoice |
| 2 | CUR, Cost Explorer, Cost Management, BigQuery billing — pick one | Choose the right billing data source for a given question |
| 3 | Granularity vs. timeliness — the trade-off you didn't choose | Explain why CUR is 24h+ stale and what that costs you |
| 4 | Tags, labels, and the cost-attribution problem | Trace a dollar back to a team using tags |
| 5 | The ten cost mistakes that show up on every bill | Spot the ten patterns in a sample invoice |

#### M0.2 — FinOps Foundation principles *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The six FinOps principles in one page | Name the six principles and give one example of each |
| 2 | Inform — what visibility actually means | Distinguish "visibility" from "actionable visibility" |
| 3 | Optimize — the four levers you have | List the four optimization levers and rank them by impact |
| 4 | Operate — the discipline that beats one-shot wins | Describe the difference between an optimization sprint and an operate motion |
| 5 | Crawl, Walk, Run — pick your starting maturity | Self-assess your org against the FinOps maturity model |

#### M0.3 — Why scheduling beats commitments at non-prod scale *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The math: 168 hours, 60-hour workweek, 64% off | Calculate the theoretical max scheduling savings on a non-prod estate |
| 2 | Commitments — what RIs / SPs / CUDs really save | Calculate effective discount of a 1-yr RI at 40% utilization |
| 3 | The non-prod fallacy | Explain why "buy reservations for non-prod" is rarely the right move |
| 4 | When scheduling wins, when commitments win | Decide between scheduling and commitments for a sample workload |

#### M0.4 — Rack rate vs. billing cost vs. amortized cost *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What "rack rate" actually means | Define rack rate and contrast with on-demand list price |
| 2 | Billing cost — and why it's lower than rack rate | Explain why your bill rarely matches your rate card |
| 3 | Amortized cost — Azure's gotcha | Explain why ActualCost reads $0 for Azure reservations and why amortized cost is the right column |
| 4 | The two-source cost model (Rack + Billing) | Describe a two-source cost model and what each source is best for |
| 5 | Currency, FX, and the date-specific exchange rate | Convert ₹/£ to $ for cost reporting with date-specific FX |

#### M0.5 — Multi-cloud taxonomy *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | AWS cost surface — services that print money | List the top 10 AWS services by spend across typical workloads |
| 2 | GCP cost surface — quirks and gotchas | List GCP's sustained-use vs. committed-use vs. spot models |
| 3 | Azure cost surface — reservations, hybrid benefit, deallocate-vs-stop | Distinguish Azure "stop" from "deallocate" and the cost implication |
| 4 | Multi-cloud governance — the bare-minimum architecture | Draw a minimum-viable governance map for a 3-cloud estate |

#### M0.6 — Introducing CDCR *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | "Detect and act" — what CDCR means | Define CDCR and contrast with the report-and-ticket pattern |
| 2 | The cost of detect-only — case study | Calculate the cost-of-delay between detection and remediation |
| 3 | Read-only safety: where it matters, where it doesn't | Explain why "discover read-only, act with scoped writes" is the right safety model |
| 4 | What CDCR is *not* — boundaries | List 5 things CDCR doesn't try to do |

---

### Track 1 — ZopNight Operator · *Operator tier · 28 lessons · ZopNight blue*

**Track outcome:** *Connect a cloud account, discover the estate, build and run schedules, manage groups and overrides, and trace every action through history and notifications.*
**Cover diagram:** Weekly 24-hour grid (the canonical schedule visualization).
**JTBD tags:** J1.

#### M1.1 — Connect a cloud account *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Vault credentials — the model | Explain how ZopNight stores cloud creds (AES-256-GCM, per-org) |
| 2 | AWS — the IAM policy and why it's read-mostly | Configure the AWS IAM role for read + scoped-write |
| 3 | GCP & Azure — service accounts and SPNs | Configure GCP service account + Azure SPN |
| 4 | Permission Visibility — what the dashboard tells you | Read a Permission Visibility drawer and act on a Denied entry |

#### M1.2 — Discover your estate *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What gets discovered (380+ types) and how | Predict whether a given resource type appears in the resource list |
| 2 | Parent-child hierarchies — clusters, registries, log groups | Navigate from cluster → nodepool → VM |
| 3 | The grouped account + grouped type filters | Build a filter that returns "all running GCP databases in EU regions" |
| 4 | Manual start/stop with confirmation | Stop a resource manually and confirm via action status |
| 5 | When discovery is stale — the refresh trigger | Manually refresh and read the in-progress signal |

#### M1.3 — Build your first schedule *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Anatomy of a schedule — name, timezone, crons | Create a minimal schedule with a start + stop cron |
| 2 | Cron expressions without tears | Write a cron for "weekdays at 9 AM ET" and verify in the human-readable summary |
| 3 | The 24-hour weekly grid — gaps and overlaps | Spot a gap in a schedule using the visual grid |
| 4 | Three preset schedules: Business Hours / Peak / Weekend-Down | Pick the right preset for a sample workload |
| 5 | Attaching resources and groups | Attach a group of 12 dev VMs to a schedule |
| 6 | The savings estimator — what 64% really looks like | Read the savings projection and explain the active/inactive hour math |

#### M1.4 — Resource Groups *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Why groups — exclusive membership and one source of truth | Explain why a resource can only belong to one group |
| 2 | Creating and managing groups | Create a "dev-cluster" group with 20 members |
| 3 | Bulk add / remove with search | Bulk-add by search query, remove individuals |
| 4 | Sequenced execution (storage → compute → app) | Configure auto-sequenced or custom-ordered start/stop |

#### M1.5 — Overrides *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | When you need an override | Identify 3 scenarios that warrant force-on or force-off |
| 2 | Force-on, force-off, expiry, reason | Configure a 48-hour force-on with reason |
| 3 | Managing active overrides | Cancel an override early; spot one about to expire |
| 4 | Max-duration policy — guardrails against forgotten overrides | Set an org-level max-duration policy |

#### M1.6 — History, notifications, audit *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The state-history timeline | Trace one resource's last 30 days of state changes |
| 2 | Reading the trigger column | Distinguish a schedule-triggered stop from a manual one |
| 3 | Slack / Teams / GChat notifications | Wire a Slack webhook for failures only |
| 4 | Notification severity and routing | Route critical notifications to one channel, info to another |
| 5 | Where audit logs live and how to query them | Find all override creations in the last 7 days |

---

### Track 2 — ZopNight Engineer · *Engineer tier · 49 lessons · ZopNight blue*

**Track outcome:** *Operate the recommendations engine, configure VM autoscaling, schedule K8s and Databricks workloads, run Event Readiness, respond to cost anomalies, and trust auto-remediation where it's certified.*
**Cover diagram:** Rule taxonomy radial (8 categories × 460 rules).
**JTBD tags:** J1.

#### M2.1 — The 460-rule library, explained *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The 8 rule categories (idle, rightsizing, schedule, orphan, compliance, discount, security, reliability) | Categorize a sample rule into the right bucket |
| 2 | Severity ladder — critical → info | Assign severity to a given finding |
| 3 | How the recommender thinks — Evaluate, MetricsAware, PricingAware | Explain why a rule needs CloudWatch data |
| 4 | Where pricing comes from — TierRates vs SKURates | Distinguish commitment math from catalog-diff math |
| 5 | Reading a recommendation card — evidence, action, cost, savings | Walk a card top-to-bottom |

#### M2.2 — Reading evidence *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The Metrics drawer | Read CPU, memory, connections from the drawer |
| 2 | The Recent Activity tab | Trace activity-log signals to a rule's verdict |
| 3 | The pricing-gap DLQ | Spot when a rule fired without pricing and what that means |
| 4 | When evidence disagrees with the bill | Reconcile evidence-based savings against actual billing |

#### M2.3 — Auto-remediation: from recommendation to one-click apply *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The 3-step remediation workflow (precondition → action → validate) | Trace a remediation through its steps |
| 2 | Certified rules vs uncertified — why the denylist | Identify which rules are safe to one-click apply |
| 3 | The approval gate — admin sign-off for destructive ops | Configure an approval gate for a high-severity rec |
| 4 | Error classes — user_action, transient, system | Triage a remediation failure into the right class |
| 5 | Why ZopNight never mutates customer DBs | Explain the database denylist and what it protects |
| 6 | Notifications — when to enable terminal email | Configure approval emails without spamming on success |

#### M2.4 — VM autoscaling: monitor → recommend → autopilot *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What a scaling policy actually is | Distinguish target-tracking from step scaling |
| 2 | Smart defaults — Welford stats explained | Read CPU avg/stddev/P90/P95/P99 and pick a target |
| 3 | Quick Setup — the one-screen flow | Configure a policy in 60 seconds |
| 4 | Three modes — monitor, recommend, autopilot | Pick the right mode for your team's risk tolerance |
| 5 | Apply / pause / resume / remove — the lifecycle | Walk the full lifecycle on an ASG |
| 6 | The event log — what to check when something fires | Read the per-policy event log |

#### M2.5 — Adopt-or-replace for existing cloud scaling *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Why adopt-or-replace exists | Explain why ZopNight refuses to silently overwrite |
| 2 | The Adopt flow — zero AWS mutation | Adopt an existing ASG policy as-is |
| 3 | The Replace flow — what gets saved for restore | Replace and then restore; verify byte-accurate restore |
| 4 | The three Replace refusals — Predictive, deep Step, customised metrics | Recognize the three unreconstructible shapes |

#### M2.6 — K8s workload scheduling *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Why K8s is hard to cost-optimize | List the three reasons K8s defies traditional FinOps |
| 2 | The cluster → namespace → workload hierarchy | Navigate from EKS cluster to a CronJob |
| 3 | Scheduling a Deployment to zero replicas | Schedule a non-prod Deployment to scale-to-zero off-hours |
| 4 | Suspending CronJobs on a schedule | Suspend a CronJob and confirm |
| 5 | Scheduling StatefulSets — careful with replicas | Identify when STS scheduling is safe vs. dangerous |
| 6 | Cross-cluster orchestration with groups | Group K8s workloads across clusters into one schedule |

#### M2.7 — Databricks scheduling *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What's discoverable in Databricks | Identify Workspaces, Clusters, Pools, SQL Warehouses |
| 2 | Scheduling clusters — autoterm vs. start/stop | Distinguish Databricks autoterm from ZopNight scheduling |
| 3 | SQL Warehouse cost discipline | Schedule a Warehouse off-hours |
| 4 | Databricks + dependent jobs — the gotcha | Recognize jobs that need warehouses available |

#### M2.8 — Auto-tagging *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The two predictions — environment + noStop | Read a tag prediction and confidence score |
| 2 | How the rules infer the environment | List the signals (name pattern, existing tags, instance class) |
| 3 | Accept, reject, sync-back | Accept a prediction and sync to AWS tags |
| 4 | When auto-tagging is wrong — drift and reconciliation | Reconcile when cloud-side tags drift |

#### M2.9 — Event Readiness *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What Event Readiness solves | Distinguish event pre-scaling from reactive autoscaling |
| 2 | Multiplier vs. expected requests | Pick the right capacity model for your event |
| 3 | The schedule-and-rollback contract | Trace draft → scheduled → active → completed |
| 4 | Databases as monitor-only targets | Explain why DBs are advised, never mutated |
| 5 | The cost-estimate badge — what's actually estimated | Read the estimate band and explain the unknowns |

#### M2.10 — Cost anomaly detection *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Five dimensions — org, account, group, resource, team | Pick the dimension that matches your investigation |
| 2 | Percent deviation vs. z-score | Distinguish the two detection methods |
| 3 | Severity bands — warning / critical / emergency | Read the severity and act |
| 4 | Root cause — instance resize, new resource, expired RI, schedule failure | Diagnose a sample anomaly to root cause |
| 5 | Team redistribution suppression | Explain why a cross-team cost shift doesn't fire |

---

### Track 3 — ZopNight Architect · *Architect tier · 38 lessons · ZopNight blue*

**Track outcome:** *Design the org-wide governance posture — RBAC, SSO, audit, multi-account, showback dimensions, budgets, dashboards as a governance surface.*
**Cover diagram:** RBAC policy entity map (15 entities × 3 roles).
**JTBD tags:** J5, partially J3.

#### M3.1 — RBAC *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The 15-entity policy table | List the 15 policy entities |
| 2 | System roles — Viewer, Editor, Admin | Match a job to a system role |
| 3 | Custom roles — when to make one | Design a custom role for a sample need |
| 4 | Team-scoped access — `allResources` vs `resourceIds` | Configure a team's read-only scope |
| 5 | The three-state scope model — nil, empty, list | Predict query behaviour given a scope state |
| 6 | Frontend gating with `usePermission()` | Identify why a UI page renders "Access restricted" |

#### M3.2 — SAML, Google OAuth, GitHub OAuth *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Pick your SSO — when SAML, when OAuth | Map a buyer requirement to the right SSO type |
| 2 | SAML per-email-domain (Azure AD, Okta, OneLogin) | Configure SAML for a domain via the admin page |
| 3 | Google / GitHub OAuth — the env-var contract | Toggle OAuth providers via env vars |
| 4 | Common SSO failures — cert expiry, metadata drift | Diagnose a SAML failure |

#### M3.3 — Audit logging *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What's logged — every POST/PUT/PATCH/DELETE | Distinguish what is and isn't captured |
| 2 | Request-and-response body capture | Read a captured body and reconstruct what happened |
| 3 | Filtering, sorting, exporting | Query "all override creates by user X in the last 30 days" |
| 4 | Audit as a compliance evidence surface | Map an audit query to a SOC 2 evidence ask |

#### M3.4 — Multi-account architecture *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Why multi-account — blast radius, billing, compliance | Justify a multi-account design to a CFO |
| 2 | AWS Organizations / GCP Folders / Azure Management Groups | Map your org chart to a multi-account topology |
| 3 | Cross-account discovery in ZopNight | Configure 5 accounts under one ZopNight org |
| 4 | Cost rollup vs. cost isolation | Distinguish rollup from per-account isolation |
| 5 | Common org sprawl mistakes and how to avoid them | List 5 multi-account anti-patterns |

#### M3.5 — Showback design *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Organisation, Teams, Tags — which dimension when | Pick the dimension that matches a CFO ask |
| 2 | Team attribution and shared resources | Explain the equal-split rule for shared resources |
| 3 | Tag attribution — cloud tags + accepted auto-tags | Read the `dimension_source` (cloud vs. auto) |
| 4 | Tag coverage — the widget that nobody reads but everyone needs | Read the tagged-vs-untagged donut |
| 5 | Unit economics — cost per MAU, per order, per 1K API calls | Configure a unit metric with push API |
| 6 | The pull, push, CSV ingest paths | Pick the right denominator ingest path |

#### M3.6 — Budget governance *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What a budget is, what it isn't | Distinguish a forecast from a budget from an alert |
| 2 | Budget per resource, per group, per team | Configure a per-team budget |
| 3 | Threshold-crossing notifications | Wire a 75% / 90% / 100% threshold chain |
| 4 | Reading the green / yellow / red signal | Diagnose a red budget |
| 5 | Why spend is computed live, not stored | Explain the architectural choice and what it gives you |

#### M3.7 — Dashboards as a governance surface *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The four presets — Executive, Engineering, FinOps, All Widgets | Pick the right preset for a role |
| 2 | Cloning presets to make org-specific dashboards | Clone, customize, and set as default |
| 3 | Per-widget RBAC and the "no access" placeholder | Explain why some users see a placeholder |
| 4 | Default-dashboard governance | Set, change, and clear the org default |

#### M3.8 — Cost Flow (Sankey) *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | When to switch from Trend to Flow | Pick the right view for a given question |
| 2 | The five layouts — Provider→Account→Type→Team and its variants | Choose a layout that answers "where do my K8s costs go?" |
| 3 | Drill, breadcrumb, back-out | Drill three columns deep and back out one step |
| 4 | The Savings overlay — what "$X reclaimable" actually means | Click a reclaimable callout and arrive at the right rec list |

---

### Track 4 — FinOps Domain Mastery · *Engineer tier · 32 lessons · neutral chrome*

**Track outcome:** *Operate FinOps as a discipline — pick chargeback or showback, design unit economics, govern budgets, respond to anomalies, forecast spend, choose commitments.*
**Cover diagram:** FinOps maturity ladder (Crawl/Walk/Run) cross-walked with capability checklist.
**JTBD tags:** J2, J3, J4.

#### M4.1 — The FinOps maturity ladder *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Crawl — what visibility-only orgs look like | Self-assess a Crawl org |
| 2 | Walk — the optimization motion | Identify a Walk org and what unblocks Run |
| 3 | Run — the operate cadence | Describe what running FinOps weekly looks like |
| 4 | The five anti-patterns at each stage | Spot anti-patterns in a sample org |
| 5 | Moving up — the 90-day plan | Draft a 90-day plan from Crawl to Walk |

#### M4.2 — Showback vs. chargeback *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The definitions — and why they matter | Distinguish showback, chargeback, allocation |
| 2 | When showback is enough | Identify the trigger for moving from showback to chargeback |
| 3 | Designing a chargeback model that survives | Design a fair allocation rule for shared services |
| 4 | The "internal billing engineer" anti-pattern | Recognize when chargeback hurts more than it helps |

#### M4.3 — Unit economics *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Picking the denominator (MAU vs DAU vs orders vs requests) | Pick a denominator that matches the business |
| 2 | The cost numerator — what to include | Decide what cost to attribute to a unit |
| 3 | Building the first dashboard | Build a cost-per-MAU dashboard |
| 4 | Forecasting unit cost — when to be worried | Identify a unit-cost trend that should worry leadership |
| 5 | Communicating unit economics to non-engineers | Write a one-pager for the CFO |

#### M4.4 — Budget governance *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The budget pyramid — org → team → resource | Design a layered budget structure |
| 2 | Threshold escalation paths | Draft an escalation playbook |
| 3 | When to raise vs. when to enforce | Distinguish a raised budget from enforced limits |
| 4 | The budget-as-conversation principle | Defend the conversational stance to a control-loving CFO |

#### M4.5 — Cost anomaly response *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The first 15 minutes — what to check | Draft a 15-minute anomaly triage checklist |
| 2 | Common root causes — top 10 | List the top 10 anomaly root causes |
| 3 | The escalation matrix | Decide who pages when |
| 4 | Postmortems for cost incidents | Run a cost-anomaly postmortem |

#### M4.6 — Forecasting cloud spend *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Top-down — useful for whom | Forecast a quarter top-down |
| 2 | Bottom-up — useful for whom | Forecast a quarter bottom-up |
| 3 | Hybrid forecasting and the reconciliation step | Build a hybrid forecast |
| 4 | Forecast accuracy — what good looks like | Set an accuracy target |
| 5 | Communicating forecast uncertainty | Write a forecast with explicit bands |

#### M4.7 — Commitments demystified *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | RI vs SP vs CUD vs Spot — the four levers | Distinguish all four |
| 2 | The math of effective discount | Calculate effective discount under realistic utilization |
| 3 | The risk side — over-commitment patterns | List 5 over-commitment patterns |
| 4 | Scheduling-first, then commit on the floor | Defend the "schedule before you commit" rule |
| 5 | When share-of-savings vendors make sense (and don't) | Decide whether to use a ProsperOps-style vendor |

---

### Track 5 — DevOps Cost Discipline · *Engineer tier · 33 lessons · neutral chrome*

**Track outcome:** *Make cost a first-class engineering concern — tagging that survives reorgs, schedule design patterns, K8s discipline, multi-account architecture, reliability vs. cost trade-offs, IaC drift, and incident response when cost is the incident.*
**Cover diagram:** PCB-style cost-aware architecture showing dev/test/stage/prod separation.
**JTBD tags:** J1.

#### M5.1 — Tagging strategy that survives reorgs *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Tags are organizational debt unless governed | Defend the "tag policy first, tags second" principle |
| 2 | The minimum viable tag set (env, team, cost-center, owner) | Design an MVT for your org |
| 3 | Inheritance, propagation, and tagged-by-default | Configure tag inheritance in IaC |
| 4 | Drift — when tags lie | Detect tag drift with auto-tagging signal |
| 5 | Reorg-proof tagging — abstracting teams from tags | Decouple tags from current org chart |

#### M5.2 — Schedule design patterns *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The four envs — dev / test / stage / prod and their schedules | Assign a schedule pattern per env |
| 2 | The "scale-to-one weekend" pattern | Configure scale-to-one for weekend |
| 3 | The "rolling test environment" pattern | Configure rolling environments |
| 4 | The "freeze window" pattern | Configure a freeze (no schedules fire) |
| 5 | The "demo prod" pattern — when prod is non-24/7 | Configure a demo-prod schedule with safe overrides |

#### M5.3 — K8s cost discipline *(6 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Requests and limits — the math behind the bill | Calculate K8s bill impact of bad limits |
| 2 | HPA — the signal it gives you for free | Read HPA `ScalingLimited` for rightsizing signals |
| 3 | Idle workloads — the seven shapes | Identify all seven idle-workload patterns |
| 4 | Single-replica deployments — reliability vs cost | Decide when single-replica is OK |
| 5 | Privileged / root / host-net workloads — the security tax | List the cost of bad security posture |
| 6 | Orphan PVCs and released PVs | Reclaim orphan storage |

#### M5.4 — Multi-account architecture *(5 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Per-team accounts vs. per-env accounts | Pick the right axis for your org |
| 2 | Shared services accounts and the cost-attribution problem | Solve shared-services cost attribution |
| 3 | Network architecture and egress cost | Diagnose an egress-cost spike |
| 4 | Cross-account scheduling concerns | Identify cross-account scheduling gotchas |
| 5 | When to consolidate, when to split | Recommend consolidate-vs-split for a sample org |

#### M5.5 — Reliability vs. cost *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The line — what's worth the cost | Defend a multi-AZ choice on cost grounds |
| 2 | Backup policies as cost — keep what you'll use | Right-size backup retention |
| 3 | DR — what RTO/RPO actually cost | Calculate cost for given RTO/RPO targets |
| 4 | The "reliability theatre" anti-pattern | Identify reliability spend with no real impact |

#### M5.6 — IaC + cost *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Tag enforcement in Terraform / CDK / Pulumi | Enforce tags as code |
| 2 | Drift detection — when reality diverges from IaC | Detect and reconcile drift |
| 3 | Pre-merge cost estimation (Infracost-style) | Add a pre-merge cost gate |
| 4 | Blast radius — the import / move / destroy questions | Map blast radius before a destroy |

#### M5.7 — Incident response when cost is the incident *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | When cost becomes an SEV — the criteria | Define SEV criteria for cost incidents |
| 2 | The cost incident commander role | Define the role |
| 3 | Communication — finance, engineering, executive | Draft a comms plan |
| 4 | Post-incident — the cost-aware action items | Write cost-aware action items |

---

### Track 6 — AI-Powered Cloud Ops · *Engineer tier · 34 lessons · ZopDay orange (signature accent)*

**Track outcome:** *Connect Claude / Cursor / Codex / Claude Code to your cloud estate via MCP, and use 43 read-only tools to answer hard cost and governance questions in seconds.*
**Cover diagram:** MCP request flow (Claude Desktop → PAT → gateway → tools).
**JTBD tags:** J1, J2.

#### M6.1 — Why agents for cloud ops *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | What MCP is in one page | Explain MCP without jargon |
| 2 | Why read-only — the safety model | Defend the read-only enforcement |
| 3 | Where agents win over dashboards | List 5 questions an agent answers better than a dashboard |
| 4 | The 2026 differentiator — why no competitor has this yet | Explain why MCP for FinOps is rare |

#### M6.2 — Setup *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Claude Desktop — install + first query | Install MCP and run "list my clouds" |
| 2 | Cursor + Codex setup | Configure two-IDE MCP usage |
| 3 | Claude Code — terminal-native | Configure MCP in Claude Code |
| 4 | Verifying the connection | Diagnose a failed MCP handshake |

#### M6.3 — PATs, org-level toggle, audit *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The PAT — what it grants, how it's scoped | Create and scope a PAT |
| 2 | The org-level MCP toggle | Disable/enable MCP at org level |
| 3 | Audit logging for MCP calls | Audit "who asked what" via MCP |
| 4 | PAT rotation and the no-write enforcement | Rotate a PAT safely |

#### M6.4 — Recipe library *(15 lessons, each a discrete recipe)*
| # | Recipe | Outcome |
|---|---|---|
| 1 | The oldest stopped EC2 | Find the longest-stopped instance still costing money |
| 2 | RDS instances not in Multi-AZ | List RDS not in Multi-AZ in prod |
| 3 | Top 10 highest-savings recommendations | Sort recs by savings, top 10 |
| 4 | Who pays for what (by team) | Output a team-level showback for the month |
| 5 | Which schedules failed last week | Find every failed schedule action |
| 6 | Untagged spend by provider | Output untagged spend split by provider |
| 7 | This week's cost anomalies | List anomalies + root causes |
| 8 | Budget burn-down by team | Output budget burn-down for each team |
| 9 | Idle Lambdas with concurrency | Find Lambdas with concurrency but no invocations |
| 10 | Stopped resources still costing money | List paused-but-billed resources |
| 11 | Region drift — resources outside policy regions | List resources outside approved regions |
| 12 | Departed-user-created resources | Find resources owned by users who left |
| 13 | Tag coverage trend | Output 90-day tag coverage trend |
| 14 | Recent override activity | List overrides created in the last 7 days |
| 15 | The "ready to delete" report | Output orphans, candidates for deletion with confidence |

#### M6.5 — Building team-specific prompts *(4 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | Why team-specific prompts beat general ones | Defend per-team prompt customization |
| 2 | Writing a prompt that's reusable | Author a reusable prompt with one slot |
| 3 | Sharing prompts via Cursor skills / Claude Code skills | Share a prompt across a team |
| 4 | Versioning prompts — what to track | Set up prompt versioning |

#### M6.6 — What's not (and shouldn't be) writable via MCP *(3 lessons)*
| # | Lesson | Outcome |
|---|---|---|
| 1 | The architectural choice — read-only forever | Defend the architectural commitment |
| 2 | When you do need to write — the right paths | Pick the right write path (UI, API, IaC) |
| 3 | The future of write-with-approval (and why we're cautious) | Articulate the cautious roadmap |

---

### Track placeholders (greyed, "Coming with ZopDay" / "Coming with ZopCloud")

| Track | Status | Stub URL |
|---|---|---|
| ZopDay — Internal Developer Platform | Greyed | `/university/tracks/zopday` |
| ZopCloud — Multi-cloud resource graph | Greyed | `/university/tracks/zopcloud` |

Both render as "Coming soon" cards in the catalog and show a one-paragraph teaser + signup-to-be-notified form.

---

## 4. The five role-based paths in detail

Each path page (T-3 template) has the same shape: persona portrait card → outcome → curated lesson sequence with checkpoints → cert recommendation. Paths *don't* duplicate lesson content — they *link to* the canonical lesson in the relevant track.

### 4.1 Platform / DevOps Engineer (14 hrs)

| Step | Lesson | Track |
|---|---|---|
| 1 | T0.M0.1 What's in a cloud bill | Foundations |
| 2 | T0.M0.6 (all 4) CDCR introduced | Foundations |
| 3 | T1 (all 28) ZopNight Operator | Operator track |
| **Checkpoint** | Operator cert exam | — |
| 4 | T2.M2.1–2.3 Rules + evidence + auto-remediation | Engineer |
| 5 | T2.M2.4 VM autoscaling | Engineer |
| 6 | T2.M2.6 K8s workload scheduling | Engineer |
| 7 | T5 (all 33) DevOps Cost Discipline | Domain |
| 8 | T6.M6.1–6.3 MCP setup | AI Ops |
| **Checkpoint** | Engineer cert exam | — |

### 4.2 FinOps Analyst (12 hrs)

| Step | Lesson |
|---|---|
| 1 | T0 (all 27) Foundations |
| 2 | T1.M1.1–1.3 (15 lessons) Operator highlights |
| 3 | T3.M3.5 Showback design |
| 4 | T3.M3.6 Budget governance |
| 5 | T3.M3.7 Dashboards as governance |
| 6 | T3.M3.8 Cost Flow Sankey |
| 7 | T4 (all 32) FinOps Mastery |
| 8 | T6.M6.1 + T6.M6.4 (15 recipes) MCP for analysts |
| **Checkpoint** | Engineer cert exam |

### 4.3 Engineering Leader (6 hrs)

| Step | Lesson |
|---|---|
| 1 | T0.M0.1 What's in a cloud bill |
| 2 | T0.M0.6 CDCR introduced |
| 3 | T1.M1.1–1.3 Operator highlights |
| 4 | T4.M4.1–4.4 FinOps maturity, showback, unit econ, budgets |
| 5 | T5.M5.1 Tagging strategy |
| 6 | T5.M5.5 Reliability vs. cost |
| **No exam recommended** — leaders should take the Operator badge if they want certification |

### 4.4 Finance Partner (5 hrs)

| Step | Lesson |
|---|---|
| 1 | T0.M0.1 What's in a cloud bill |
| 2 | T0.M0.4 Rack rate vs. billing vs. amortized |
| 3 | T4 (all 32) FinOps Mastery |
| 4 | T3.M3.5–3.6 Showback + budgets (Architect-light) |
| **No exam recommended** |

### 4.5 Security / Compliance (10 hrs)

| Step | Lesson |
|---|---|
| 1 | T0 (all) Foundations |
| 2 | T3 (all 38) Architect |
| 3 | T5.M5.4 Multi-account architecture |
| 4 | T5.M5.6 IaC + cost |
| 5 | T6.M6.3 PAT + audit |
| 6 | T6.M6.6 What's not writable via MCP |
| **Checkpoint** | Architect application |

---

## 5. Reference library — every page

### 5.1 Rule catalog (`/reference/rules`)

- One dynamic browse page with: filter rail (provider, category, severity, has-remediation), table view, search, sort.
- Per-rule detail page renders: rule ID, name, provider, resource type, severity, category, evidence, remediation, console link template, lessons that teach this rule, related patterns.
- The 460 rules are seeded from `RECOMMENDATION-RULES.md`. Per-rule URL: `/reference/rules/RC-001`, `/reference/rules/RC-ASC-001`, `/reference/rules/RC-1701`, etc.
- Each rule's "Lessons that teach this" auto-populated from the rule mapping in T2.M2.1.

### 5.2 Glossary (`/reference/glossary`)

A–Z index. Initial entries (target ~120 terms):

| # | Term examples |
|---|---|
| A | Amortized cost · Autoscaler intent · Auto-tagging |
| B | Backup retention · Billing cost · Budget · Blast radius |
| C | CDCR · Chargeback · CloudWatch · Cron expression · CUR · CUD |
| D | Dead-letter queue · Deallocate (Azure) · Discovery · DLQ |
| E | EBS volume · Elasticache · Event Readiness · Evidence |
| F | FinOps Foundation · Forecast · FOCUS |
| G | GCS bucket · Granted (permission) · Group (resource) |
| H | HPA · Hub node (topology) · Hybrid Benefit |
| I | IaC · Idle (rule category) · Inform-Optimize-Operate |
| J | Job (CronJob) · Just-in-time scaling |
| K | KMS key · K8s workload |
| L | Lambda concurrency · Lookback period |
| M | MAU · MCP · Metrics-aware · Multi-AZ · Multi-cloud |
| N | NAT Gateway · NoStop |
| O | Override · On-demand price |
| P | PAT · Pattern (CDCR) · Pre-scale · Pricing-aware · Purchase type |
| Q | Quota |
| R | Rack rate · RBAC · Recommendation · Reservation · Resource group |
| S | SAML · Sankey · Schedule · Showback · Spot · State history |
| T | Tag · Team-scoped · Threshold |
| U | Unattributed · Unit economics |
| V | Vault · Verifier |
| W | Welford stats · Workspace (Databricks) |
| X-Y-Z | YAML manifest · Zero-replica |

### 5.3 Pattern library (`/reference/patterns`)

15 named CDCR patterns. Each gets a detail page with: name, problem, applies-when, anti-pattern, diagram, worked example, lessons.

| # | Pattern |
|---|---|
| P-01 | Off-hours scheduling for non-prod |
| P-02 | Scale-to-zero with HPA |
| P-03 | Tag-then-allocate |
| P-04 | Adopt-then-replace existing cloud policy |
| P-05 | Progressive autonomy (monitor → recommend → autopilot) |
| P-06 | Approval-gated remediation |
| P-07 | Pre-scale for planned events |
| P-08 | Anomaly response with root cause + redistribution suppression |
| P-09 | Unit economics overlay |
| P-10 | Tag-coverage trending |
| P-11 | Per-team budget pyramid |
| P-12 | Multi-account cost rollup |
| P-13 | The freeze-window override pattern |
| P-14 | Cost incident commander |
| P-15 | MCP recipe library for self-serve answers |

### 5.4 Worked examples (`/reference/worked-examples`)

~25 standalone math walkthroughs lifted from L200/L300 lessons. Each has the inputs, the formula, the answer, and a "lessons that use this" backlink.

Examples:
- "EC2 idle savings — 30-day stopped instance"
- "ASG smart-default calculation from Welford P95"
- "K8s deployment cost: requests/limits/HPA worked end-to-end"
- "Azure amortized cost — 3-yr RI on D8s_v3"
- "Cost-per-MAU for a SaaS workload"
- "Multi-AZ RDS upgrade cost-vs-risk"
- "Spot RI break-even"
- "Tag-attribution arithmetic for shared services"

---

## 6. Certifications — every page

### 6.1 `/certifications` (landing)

Three-column comparison: Operator · Engineer · Architect. Outcomes, prerequisites, format, time, pass mark, price, badge artwork.

### 6.2 `/certifications/operator`

| Section | Content |
|---|---|
| Outcome | Operate ZopNight day-to-day — schedules, groups, overrides, history |
| Prerequisites | None |
| Exam format | 20 MCQs, 30 min, open-book |
| Pass mark | 80% |
| Price | Free |
| Issuance | Digital badge, shareable to LinkedIn |
| Prep guide | T0 + T1 |
| Exam blueprint | (see `07_CERTIFICATION_FRAMEWORK.md`) |

### 6.3 `/certifications/engineer`

| Section | Content |
|---|---|
| Outcome | Configure ZopNight at depth — rules, autoscaling, K8s, MCP, anomalies |
| Prerequisites | Operator badge |
| Exam format | 40 MCQs + 1 graded sandbox lab (10 tasks) |
| Pass mark | 75% on MCQs and lab |
| Price | Free for customers, $99 outside |
| Issuance | Verifiable cert with unique ID + public registry entry (opt-in) |
| Prep guide | T2 + T4 + T5 + T6 (or one of the role paths) |

### 6.4 `/certifications/architect`

| Section | Content |
|---|---|
| Outcome | Design an enterprise governance posture using ZopNight |
| Prerequisites | Engineer cert + ≥6 months hands-on |
| Format | Take-home design brief + 45-min review interview |
| Issuance | "ZopDev Certified Cloud Cost Architect" — named credential on public registry |
| Application | Form with experience, current org context, proposed take-home topic |
| Re-submit | Allowed |

### 6.5 `/certifications/verify` and `/certifications/registry`

- Verifier: paste a cert ID, get back issued-to + issued-on + cert level.
- Registry: opt-in list of credentialled people (name, employer, level, year).

### 6.6 Exam booking + badge claim

- `/certifications/[level]/schedule` — pick a slot (Operator + Engineer)
- `/certifications/[level]/claim` — claim the badge / cert after passing

---

## 7. Community + contribution — every page

### 7.1 `/community` (hub)

Three columns: (a) most-active Q&A threads, (b) recent lesson additions, (c) contributor leaderboard.

### 7.2 `/community/qa`

Discourse-style; categories: General, FinOps, ZopNight Product, K8s, MCP, Architecture. Gated to logged-in learners.

### 7.3 `/contribute` (landing)

The three lanes:
- Submit a lesson → `/contribute/lesson`
- Submit a pattern → `/contribute/pattern`
- Submit a case study → `/contribute/case-study`

### 7.4 `/contribute/lesson` (form)

Multi-step form mirroring the lesson template:
1. Title + Outcome (Bloom verb auto-validated)
2. Track, Module, Tier, JTBD tag
3. Concept body (Markdown editor)
4. Demo (image upload OR video URL)
5. Hands-on instructions
6. Knowledge-check questions (2–3 with correct/incorrect explanations)
7. Apply CTA URL
8. Author info (name, role, LinkedIn)
9. Review checklist (rubric)

### 7.5 `/contribute/pattern` (form)

Shorter form: pattern name, problem, applies-when, anti-pattern, diagram, worked example, lessons.

### 7.6 `/contribute/case-study` (form)

Customer-led: company, persona, before/after numbers, narrative, redaction notes, sign-off block.

### 7.7 `/contribute/rubric` and `/contribute/style-guide`

Public rubric + voice rules. The rubric is the same one editorial board uses internally — making it public raises submission quality.

### 7.8 `/contributors` (directory) and `/contributors/[handle]`

Each contributor: name, role, employer, LinkedIn, lessons authored, patterns authored.

---

## 8. Newsroom + meta pages

| URL | Content |
|---|---|
| `/newsroom` | Reverse-chron list of updates: new lessons, version bumps, cert news |
| `/newsroom/[slug]` | One post |
| `/about` | Mission, who runs it, editorial standards |
| `/about/editorial-board` | Named board (PM + engineer + writer, plus rotating customer advisor) |
| `/about/methodology` | Plain-language version of `00_PLAN.md` §2 |
| `/faq` | Top 20 questions |
| `/search` | Algolia-style search across lessons, glossary, rules, patterns |
| `/sitemap` | HTML sitemap |
| `/privacy` and `/terms` | Legal |

---

## 9. Account + editorial back-office

### 9.1 Learner account (Phase 4)

| URL | Content |
|---|---|
| `/sign-in` and `/sign-up` | Auth |
| `/me` | Dashboard: progress chips, next recommended lesson, earned badges |
| `/me/progress` | Per-track progress, lesson-level |
| `/me/certifications` | Issued credentials with verify links |
| `/me/bookmarks` | Saved lessons |
| `/me/contributions` | Lessons / patterns / case-studies submitted |
| `/me/settings` | Profile, email prefs, registry opt-in |

### 9.2 Editorial back-office (auth-gated, not in public sitemap)

| URL | Content |
|---|---|
| `/editorial/queue` | Submissions awaiting review (filter by lane, age, reviewer) |
| `/editorial/calendar` | Internal calendar; mirrored read-only to `/newsroom/calendar` |
| `/editorial/lessons` | Lesson lifecycle table (draft/review/scheduled/published/retired) |
| `/editorial/analytics` | Lesson engagement metrics: completion %, knowledge-check pass rate, time-on-page |

---

## 10. Totals — what gets built

| Surface | Count |
|---|---|
| Fixed public pages (chrome, landings, forms, meta) | 32 |
| Tracks | 7 active + 2 greyed placeholders = 9 |
| Modules | 50 |
| Lessons | 241 |
| Glossary terms (year-1 target) | ~120 |
| Rule reference pages | 460 (URL-routable, page is dynamic) |
| Pattern pages | 15 |
| Worked-example pages | ~25 |
| Role-based paths | 5 |
| Cert program pages | 3 + 2 (verify, registry) = 5 |
| Contributor profiles (steady state) | ~30 |
| Newsroom posts (year-1 target) | ~20 |
| Learner-account pages | 8 (auth) |
| Editorial back-office | 4 (auth) |
| **Public total** | **~1,000 URLs** |

---

## 11. Per-track image inventory (concrete production list)

For Phase 0 image production brief.

| Track | Cover (1) | Module diagrams (1 per module) | Annotated screenshots (per L200+ lesson) | Total visuals |
|---|---|---|---|---|
| T0 | 1 (Globe + 3 regions pulsing) | 6 | 0 (domain-only, uses diagrams not screenshots) | 7 |
| T1 | 1 (Weekly 24-hr grid) | 6 | 28 | 35 |
| T2 | 1 (Rule taxonomy radial) | 10 | 49 | 60 |
| T3 | 1 (RBAC entity map) | 8 | 38 | 47 |
| T4 | 1 (FinOps maturity ladder) | 7 | 0 | 8 |
| T5 | 1 (PCB cost-aware architecture) | 7 | 0 | 8 |
| T6 | 1 (MCP request flow) | 6 | 15 (recipe screenshots) | 22 |
| **Total** | **7** | **50** | **130** | **~190 visuals** |

Plus chrome (catalog hero, path portraits × 5, cert badge art × 3, newsroom thumbnails, contributor avatars). Round to **~210 visual assets** for V1.

---

## 12. Open questions (deltas from `00_PLAN.md` §15)

The IA above applied all `00_PLAN.md` §15 defaults. Two new questions emerge that weren't in the plan:

1. **Search engine** — Algolia (paid, hosted) or a self-hosted alternative (Lyra, MiniSearch)? Default: Algolia for V1 (lower friction); reassess at 1,000+ learners.
2. **Q&A platform** — Discourse (hosted), Discord (chat-style), or a custom MDX-thread system? Default: Discourse — it's the FinOps Foundation's choice and learners likely already have accounts.

---

**End of IA.** Reply with overrides (or "all defaults") and Phase 0 file generation begins — lesson template, voice guide, contribution guide, cert framework, visual style guide as separate files in this folder. Still no lesson content until those files are also reviewed.
