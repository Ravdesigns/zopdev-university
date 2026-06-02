# Four presets — Executive, Engineering, FinOps, All Widgets

§ T3 · M3.7 · L1 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **match** each preset to its audience, **describe** the widget set for each, **and choose** the right starting point for a new dashboard.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Pick a preset that gets a team to a productive dashboard in 30 seconds, instead of building from scratch." |
| **Personas** | FinOps Lead · Engineering Leader · Platform Engineer · Finance Partner |
| **Prerequisites** | T1 — Operator tier · M3.5 — Showback dimensions |
| **Time** | 9 minutes |
| **Bloom verb** | Match (Apply), Describe (Understand), Choose (Evaluate) |

---

## 1. Concept

ZopNight ships four **dashboard presets** — Executive, Engineering, FinOps, and All Widgets. Each is a curated arrangement of widgets, sized and ordered for a specific audience. Presets are immutable templates — they cannot be edited directly. Customization happens by **cloning** a preset and modifying the clone (covered in L2).

```
PRESET          AUDIENCE                     WIDGETS (curated)
──────────────────────────────────────────────────────────────────
Executive       Leadership, Finance          Stat cards (org-wide)
                                              Cost Trend (monthly)
                                              Top Costly Resources
                                              Budget Health
                                              Savings Achieved
                                              
Engineering     Platform / DevOps            Resource Summary
                                              Cost Trend
                                              Schedule Execution
                                              Recommendations
                                              Anomaly Detection
                                              
FinOps          FinOps Analyst, Lead          Cost Flow Sankey
                                              Showback (per-team)
                                              Budget Health
                                              Tag Coverage
                                              Anomaly Detection
                                              Unit Economics
                                              
All Widgets     Power user, evaluation        Every widget visible
                                              (~25+ widgets)
```

### Executive preset

For leadership review and finance check-ins. High-level cost trend, top costly resources, budget health vs forecast, savings achieved over time. No deep technical detail; no per-resource drill; no audit-log surface.

```
EXECUTIVE preset widgets:
  Stat card: total spend MTD (vs same period last month)
  Stat card: forecast end-of-month (vs budget)
  Stat card: realized savings YTD
  Cost Trend (12 months) with forecast overlay
  Top 5 Costly Resources (org-wide)
  Budget Health (top 5 budgets by signal)
  
WHAT IT ANSWERS:
  "How much are we spending?"
  "Are we on budget?"
  "What is the biggest spend?"
  "How much have we saved?"
```

### Engineering preset

For day-to-day platform team use. Resource health, schedule execution status, current recommendations to triage, anomaly detection for incident response.

```
ENGINEERING preset widgets:
  Resource Summary (counts by status: running, stopped, idle)
  Cost Trend (30 days, team-scoped if user is team-scoped)
  Schedule Execution (last 24h: successes / failures)
  Recommendations (open count, top 5 by savings)
  Anomaly Detection (any anomalies in last 24h)
  
WHAT IT ANSWERS:
  "What's the state of my team's resources today?"
  "Did all schedules fire as expected?"
  "What recommendations should I act on?"
  "Is there an active cost incident?"
```

### FinOps preset

For the dedicated FinOps practitioner. Cost flow Sankey, team-level showback, budget vs spend per team, tag coverage trend, anomaly detection, unit economics — the FinOps practitioner's daily working canvas.

```
FINOPS preset widgets:
  Cost Flow Sankey (org-wide; this month)
  Showback by Team (current month)
  Budget Health (all team budgets)
  Tag Coverage (with trend)
  Anomaly Detection (last 7 days)
  Unit Economics (cost-per-MAU overlay)
  Recommendations Summary (open, applied, savings achieved)
  
WHAT IT ANSWERS:
  "Where is the money going right now?"
  "Which teams are growing fastest?"
  "What's the state of tagging discipline?"
  "Where are the anomalies?"
  "Are unit economics improving?"
```

### All Widgets

Everything visible. Useful for evaluation (when first onboarding ZopNight and the team wants to see what's available), for power users who want it all on one screen, and for org defaults when audience needs are mixed.

```
ALL WIDGETS preset:
  All ~25 available widgets
  Default size and ordering
  Scrolling required to see everything
  
WHEN TO USE:
  Initial onboarding / evaluation
  Org default before customizing
  Power user who refuses to switch dashboards
```

### Choosing the right preset

```
QUESTION TO ASK                              PRESET
──────────────────────────────────────────────────────────────────
"What am I optimizing for at this view?"
  Executive summary, leadership review        Executive
  Daily engineering work                      Engineering
  Cost analysis and optimization              FinOps
  Exploring / evaluating                      All Widgets
```

The choice is per-audience, not per-team. A FinOps Lead might use both Executive (for leadership prep) and FinOps (for their own work) on different days.

### Customization path

Presets are starting points, not endpoints. Most mature orgs end up with:

```
1-2 saved dashboards based on cloned presets
  Cloned + customized (added or removed widgets)
  Set as org defaults or team defaults
  
The original presets remain visible as "templates" — never edited,
always available as a re-clone source if ZopNight updates them.
```

The cloning + customization workflow is L2.

### How ZopNight uses presets

Customer telemetry on preset adoption:

```
PRESET                          % OF CUSTOMERS USING
──────────────────────────────────────────────────────
FinOps                          42%
Engineering                     28%
Custom (cloned + modified)      18%
Executive                       8%
All Widgets                     4%
```

Most customers either pick FinOps (mature FinOps practice) or Engineering (engineering-led cost discipline), often customized after a few months.

---

## 2. Demo

Different audiences picking different presets:

```
ORG: 80-engineer SaaS, with mature FinOps + monthly exec reviews

WEEKLY ROUTINE:
  Monday 9am — FinOps Lead opens dashboard
    Dashboard: FinOps preset (her default)
    Scans: cost trend, anomalies, top recs, tag coverage
    Time: 5 minutes
  
  Tuesday — Platform engineer logs in
    Dashboard: Engineering preset (her default)
    Scans: schedule execution, her team's recs
    Time: 3 minutes
  
  Friday — Engineering leader's weekly review
    Dashboard: Engineering preset (org default)
    Scans: team-level summary, recent anomalies
    Time: 5 minutes

MONTHLY EXECUTIVE REVIEW:
  Monday of month-end week — CEO meeting
  CTO opens Executive preset
  Walks through:
    Total spend vs prior month
    Forecast for end of quarter
    Savings YTD
    Top 5 costly resources
  Time: 10-minute slot
  
ORG DEFAULT: All Widgets
  New joiners see all widgets; experienced users have personal
  bookmarks to their preferred preset.
```

The preset matrix matches role to need. Each user reaches their working canvas immediately.

---

## 3. Hands-on (5 min)

Browse the four presets in ZopNight:

```
PRESETS reviewed:
  □ Executive
  □ Engineering
  □ FinOps
  □ All Widgets

BEST FIT for your role today:    __________
WHY:
  __________________________________________________________

ORG DEFAULT (currently):    __________
  Is this the right default for your org? Yes / No
  If no — what would be better? __________

YOUR PERSONAL BOOKMARK / preferred view:
  __________________________________________________________
```

If your team has mixed roles, the org default usually pairs with personal bookmarks for individuals.

---

## 4. Knowledge check

### Q1
The Executive preset is best for:

A. Day-to-day engineering work
B. Leadership and finance — high-level cost trend, top costly resources, budget health, savings achieved. No deep technical detail; designed for monthly review meetings, not daily ops.
C. Engineering team
D. Audit reviewers

<details>
<summary>Show answer</summary>

**Correct: B.** Leadership and finance audience. Designed for high-level review, not deep drill.
</details>

### Q2
The FinOps preset includes:

A. Just cost trend
B. Cost Flow Sankey, team showback, budget vs spend, tag coverage, anomalies, unit economics, recommendations summary. The practitioner's working canvas — everything the FinOps Lead needs in one view.
C. Per-resource only
D. Random widgets

<details>
<summary>Show answer</summary>

**Correct: B.** FinOps-specific surfaces optimized for daily practitioner work.
</details>

### Q3
Customizing a preset:

A. Edits the preset for all users
B. Requires cloning — presets are immutable templates. Clone creates a new saved dashboard; modify the clone freely. The original preset remains untouched. This pattern lets ZopNight update presets without breaking customer customizations.
C. Not possible
D. Per-user

<details>
<summary>Show answer</summary>

**Correct: B.** Clone pattern preserves preset immutability. L2 covers the cloning workflow.
</details>

---

## 5. Apply

Browse presets at [Dashboards](https://app.zopnight.com/dashboards). Each preset has a "Use this preset" button that makes it your current view. To customize, click "Clone preset" — this creates a saved dashboard you can edit. The org default (L4) is set per org by an Admin.

For new orgs, leave the default at "All Widgets" for the first week of onboarding; switch to a more focused preset once the team has experienced the full widget set.

---

## Related lessons

- [L2 — Cloning and customization](L2_cloning.md) *(next)*
- [L3 — Per-widget RBAC](L3_widget_rbac.md)
- [L4 — Default dashboard governance](L4_default_dashboard.md)
- [T3.M3.5.L1 — Pick the showback dimension](../M3.5_showback/L1_pick_dimension.md)

## Glossary terms touched

[Preset](../../../reference/glossary/preset.md) · [Executive preset](../../../reference/glossary/executive-preset.md) · [FinOps preset](../../../reference/glossary/finops-preset.md) · [Engineering preset](../../../reference/glossary/engineering-preset.md) · [Immutable template](../../../reference/glossary/immutable-template.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.7.L1
