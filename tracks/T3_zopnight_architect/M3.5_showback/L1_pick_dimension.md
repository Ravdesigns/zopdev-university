# Organisation, Teams, Tags — pick the dimension

§ T3 · M3.5 · L1 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right showback dimension based on the audience question, **describe** the underlying data source for each, **and combine** dimensions when a question requires more than one.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Answer a cost question with the least-complex view that actually answers it." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner |
| **Prerequisites** | T0 — Foundations · M3.1 — RBAC · M3.4 — Multi-account |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Describe (Understand), Combine (Apply) |

---

## 1. Concept

Showback — the practice of reporting cost back to the team or unit that incurred it — has three primary dimensions in ZopNight: **Organisation** (rollup), **Teams** (per-team accountability), and **Tags** (flexible attribute-driven breakdown). Picking the right dimension upfront is what makes the resulting report actually answer the question.

```
DIMENSION       USE WHEN                                  EXAMPLE
──────────────────────────────────────────────────────────────────
Organisation    Org-wide rollup needed                    "What did we spend?"
Teams           Per-team accountability                    "Which teams overspent?"
Tags            Per-attribute breakdown                    "Which cost-center burned $?"
```

Each dimension has its sweet spot. Mixing dimensions adds complexity; pick the simplest that answers the question, and only combine when the question truly requires both.

### Each dimension's data source

```
DIMENSION       UNDERLYING TABLE                          AGGREGATION
──────────────────────────────────────────────────────────────────
Organisation    cost_records (raw)                         summed by org
Teams           cost_allocation_daily                      where dimension_
                                                          type='team'
Tags            cost_allocation_daily                      where dimension_
                                                          type='tag'
```

Internally, ZopNight computes daily allocations into a single `cost_allocation_daily` table with a `dimension_type` column. Reports query this table with filters. The three dimensions are not separate data pipelines — they are different filters on the same allocation engine, which is what makes combining them tractable.

### Decision tree

```
"What's our total spend?"                       → Organisation
"How is each team spending?"                     → Teams
"How is each cost_center spending?"              → Tags (key=cost_center)
"How is each environment doing?"                  → Tags (key=environment)
"What's per-team breakdown by tag?"              → Teams + Tags combined
"Which environment is the platform team's
 spend concentrated in?"                          → Teams + Tags combined
"How much did this marketing campaign cost?"     → Tags (key=campaign)
"What did the data team spend on RDS?"           → Teams + service filter
```

The right dimension follows from the noun in the question. "Team" implies Teams; "environment" or "cost-center" implies Tags; "we" or "org" implies Organisation.

### Question-first design

A common mistake is to start with the report layout ("let's build a per-environment dashboard") and then figure out what it answers. Question-first works better:

```
1. Write the question in plain English
2. Identify the noun (team / cost-center / environment / org / etc.)
3. Pick the dimension that has that noun
4. Build the report
```

When you cannot pick a dimension cleanly, the question is probably two questions in one — split them.

### Combining dimensions

```
QUESTION                                    COMBINATION
──────────────────────────────────────────────────────────────────
"Platform team's spend by cost-center"      Teams (filter=platform) +
                                            Tags (group by cost-center)
                                            
"Prod environment spend by team"            Tags (filter env=prod) +
                                            Teams (group by team)
                                            
"Q2 marketing campaign — which teams         Tags (filter campaign=Q2) +
participated and how much?"                  Teams (group by team)
```

The pattern: one dimension filters, the other groups. Three-way combinations are possible but rarely useful; if you need three dimensions, the report is probably too dense.

### What ZopNight surfaces by dimension

```
DIMENSION       PRIMARY SURFACE              SECONDARY VIEWS
──────────────────────────────────────────────────────────────────
Organisation    Reports → Org overview        Per-cloud, per-OU, time-series
Teams           Reports → Teams               Per-team trend, vs budget,
                                              top resources within team
Tags            Reports → Tags                Filter by key + value;
                                              top tag values; coverage
```

Each surface has consistent UX patterns — filters at the top, summary at left, breakdown chart in the middle, drill table at the bottom.

### Audience-to-dimension mapping

```
AUDIENCE                                    DEFAULT DIMENSION
──────────────────────────────────────────────────────────────────
Executive (monthly review)                  Organisation (rollup)
Finance (budget vs actual)                  Organisation + Teams
                                            (with chargeback math)
FinOps Lead                                 All three (depending on the
                                            question of the week)
Engineering Leader                          Teams (their teams' health)
Platform Engineer                           Teams (scoped to their team)
Compliance / Audit                          Tags (compliance-scope tags)
Marketing (campaign cost)                  Tags (campaign key)
```

The mapping is not strict — a FinOps Lead might present an Organisation rollup to the executive team and a Teams view to the engineering team in the same week. But the default surfaces by audience are stable.

### How ZopNight uses the dimensions

The Reports section in ZopNight's UI is organized around these three dimensions. Reports → Org Overview is the rollup landing; Reports → Teams is the team-scoped landing; Reports → Tags is the flexible attribute landing. Each report has consistent filters (time range, account, environment); the data underneath comes from the same allocation engine.

For a new analyst onboarding, the recommended exploration order is: Org Overview (orientation) → Teams (where the money goes) → Tags (deeper attribution). Within a quarter, the analyst should be comfortable switching dimensions to answer questions in real-time during meetings.

---

## 2. Demo

Three meetings, three different dimensions:

```
MONDAY — Exec monthly review
  AUDIENCE: CEO, CFO, CTO
  QUESTION:  "Cloud cost trend MoM?"
  DIMENSION: Organisation
  REPORT:   Reports → Org Overview
  HEADLINE:  "Total $2.1M (-3% MoM); driven by ml-infra rightsizing"
  TIME:      5-minute slot

TUESDAY — Engineering leadership review
  AUDIENCE:  Engineering Leaders + FinOps Lead
  QUESTION: "Which teams are growing fastest?"
  DIMENSION: Teams
  REPORT:    Reports → Teams (trended over 90 days)
  HEADLINE:  "ml-infra +30% YoY, data +8%, platform -5%"
  TIME:      20-minute slot, with discussion of ml-infra growth

WEDNESDAY — Marketing post-campaign review
  AUDIENCE:  Marketing + Finance
  QUESTION:  "Q2 campaign cost?"
  DIMENSION: Tags (key=campaign, value=Q2-launch)
  REPORT:    Reports → Tags → filter
  HEADLINE:  "$14,200 total; 78% on Lambda, 22% CDN egress"
  TIME:      10-minute slot, with ROI discussion vs revenue
```

Three audiences, three dimensions, three reports — all from the same underlying cost data.

---

## 3. Hands-on (6 min)

For your team's monthly cost review, write the questions in order:

```
QUESTION 1 (typically the headline):
  __________________________________________________________
  Best dimension: __________

QUESTION 2 (where is the cost concentrated):
  __________________________________________________________
  Best dimension: __________

QUESTION 3 (compare to budget or prior period):
  __________________________________________________________
  Best dimension: __________

QUESTION 4 (drill into the anomaly, if any):
  __________________________________________________________
  Best dimension: __________

If you find yourself wanting "all three dimensions for question 2",
the question is probably actually multiple questions — split it.
```

---

## 4. Knowledge check

### Q1
"Which team overspent against budget?" Best dimension:

A. Organisation rollup
B. Teams — the noun is "team," and budget data is team-scoped. Reports → Teams with the budget overlay surfaces who is over and by how much.
C. Tags
D. Random account

<details>
<summary>Show answer</summary>

**Correct: B.** Team-scoped question; Teams dimension. The budget data is team-attached in ZopNight.
</details>

### Q2
"Per-environment spend breakdown" requires:

A. Organisation
B. Tags with key=environment, group by value (dev/staging/prod). Environment isn't a team — it's an attribute that applies across teams.
C. Teams
D. Account isolation

<details>
<summary>Show answer</summary>

**Correct: B.** Environment is a tag-driven attribute; Tags is the right dimension. Multiple teams might have prod resources; tag attribution sums them.
</details>

### Q3
A question requires "platform team's spend by cost-center":

A. Single dimension
B. Combined: filter to team=platform (Teams), group by tag cost-center (Tags). The Reports UI supports this composition via the "Group by" + filter chain.
C. Cannot be answered
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Combined dimensions handle multi-attribute questions. One dimension filters; the other groups.
</details>

---

## 5. Apply

Reports surfaces each dimension as a tab: [Reports → Org](https://app.zopnight.com/reports/org), [Reports → Teams](https://app.zopnight.com/reports/teams), [Reports → Tags](https://app.zopnight.com/reports/tags). Filters apply consistently across all three.

For recurring reports, save the configured filter as a dashboard widget (M3.7).

---

## Related lessons

- [L2 — Team attribution and shared resources](L2_team_attribution.md) *(next)*
- [L3 — Tag attribution](L3_tag_attribution.md)
- [L4 — Tag coverage](L4_tag_coverage.md)
- [L5 — Unit economics](L5_unit_economics.md)
- [T3.M3.4.L4 — Rollup vs isolation](../M3.4_multi_account/L4_rollup_vs_isolation.md)

## Glossary terms touched

[Showback](../../../reference/glossary/showback.md) · [Chargeback](../../../reference/glossary/chargeback.md) · [Allocation dimension](../../../reference/glossary/allocation-dimension.md) · [cost_allocation_daily](../../../reference/glossary/cost-allocation-daily.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.5.L1
