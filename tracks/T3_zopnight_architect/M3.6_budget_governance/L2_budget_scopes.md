# Per-resource, per-group, per-team budgets

§ T3 · M3.6 · L2 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right budget scope for an accountability boundary, **design** a composite budget hierarchy, **and explain** why multiple budgets on the same data are independent (and useful).

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Build a budget hierarchy that surfaces overruns at the right granularity to the right audience." |
| **Personas** | FinOps Lead · Engineering Leader · Platform Engineer |
| **Prerequisites** | M3.6.L1 — Budget vs forecast vs alert |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Design (Create), Explain (Understand) |

---

## 1. Concept

ZopNight supports three budget scopes. Picking the right scope for a budget depends on the **accountability boundary** — who is being asked to manage to the budget?

```
SCOPE             SCOPE OF SPEND TRACKED         ACCOUNTABILITY
──────────────────────────────────────────────────────────────────
Per-resource      One specific resource          The owner of that
                                                  resource (often a
                                                  team-of-one DBA, SRE,
                                                  service owner)
                                                  
Per-group         A resource group (multiple      The group's owner
                  resources, coordinated         (often a team's tech
                  ownership)                      lead)
                                                  
Per-team          All resources tagged with       The team lead +
                  the team                       FinOps partner
```

Choosing the scope is about who you want the alert to land on, not the underlying data — the same dollar of spend can be tracked by multiple budgets simultaneously, each with a different scope and audience.

### Per-resource detail

Use per-resource budgets for **critical individual resources** where the team wants pinpoint accountability.

```
EXAMPLE — Production payments database

  Resource:  db-prod-payments
  Reason:    business-critical; cost reflects sizing decisions
  Budget:    $1,200/month
  Threshold alerts:
    75%  → #db-team-alerts (informational)
    90%  → #db-team-alerts + DB lead (escalate)
    100% → #db-team-alerts + DB lead + FinOps (overrun)
  
  WHO CARES: the DBA who chose the instance size, the DB lead who
  signed off, the FinOps partner who reviews unit economics for
  the database.
  
  WHAT IT CATCHES:
    - Storage growth beyond plan
    - Unplanned scaling-up
    - I/O pattern changes that increase cost
```

Per-resource budgets are most valuable for resources that meet two criteria: high absolute cost AND well-defined ownership. A $50/month resource doesn't need its own budget; a $50K/month database does.

### Per-group detail

Use per-group budgets when multiple resources share **coordinated ownership and lifecycle**.

```
EXAMPLE — EU dev environment

  Group:      dev-platform-eu
  Includes:   47 resources (compute, RDS, ELB, S3, ...)
  Budget:     $4,800/month
  Threshold alerts:
    50%  → #finops-info
    75%  → #dev-platform-eu (team awareness)
    90%  → #dev-platform-eu + #finops-alerts (escalate)
    100% → lead + #finops-alerts (overrun)
  
  WHO CARES: the team that owns the EU dev environment as a unit.
  
  WHAT IT CATCHES:
    - Aggregate growth across the group
    - Forgotten resources that someone provisioned
    - Schedule failures causing weekend spend
```

Groups are a clean accountability unit when the group itself has a coherent owner. They are less useful when group membership is fluid (resources joining and leaving frequently) because the budget tracks the current membership.

### Per-team detail

Use per-team budgets for **top-level team accountability** against the team's committed budget.

```
EXAMPLE — Platform team

  Team:      platform
  Budget:    $24,000/month (top-down allocated from FinOps + leadership)
  Threshold alerts:
    50%  → #platform-team (informational)
    75%  → #platform-team
    90%  → #platform-team + #finops-alerts (escalate)
    100% → team lead + #finops-alerts (overrun)
    
  WHO CARES: the team lead, FinOps partner, engineering leader.
  
  WHAT IT CATCHES:
    - Aggregate team spend trending wrong
    - Sub-team drift (one squad's spend grows without others' visibility)
    - Composite effects (each individual resource looks fine; the
      sum is not)
```

Per-team is the most-used scope. Most cost discipline conversations happen at the team level.

### Composite budgets

A team can have multiple budgets simultaneously, at different scopes, alerting different audiences:

```
TEAM PLATFORM — composite budget hierarchy

  Per-team budget: $24,000/month
    Audience: team lead + FinOps
    Catches:  total team spend trending wrong
    
  Per-group budgets (subset of team's resources):
    prod-platform:    $14,000/month   (prod resources)
    staging-platform:  $3,200/month   (staging)
    dev-platform-eu:   $4,800/month   (EU dev environment)
    
    Audience: group's tech lead + on-call
    Catches:  environment-specific overruns
    
  Per-resource budgets (3 critical resources):
    db-prod-orders:        $1,200/month
    db-prod-payments:      $1,500/month
    monitoring-cluster:    $800/month
    
    Audience: DBA / monitoring owner
    Catches:  resource-specific anomalies
```

The total is the same spend; different budgets watch different slices. When `db-prod-orders` crosses 75%, only the DB team is alerted — the platform team's per-team budget is not affected because the resource's spend is a fraction of the team's total. When the team's per-team budget crosses 75%, the whole team gets alerted.

### Aggregation rules

```
A resource's spend contributes to:
  - Its per-resource budget (if defined)
  - Its parent group's per-group budget (if member of a group with
    a budget)
  - The team's per-team budget (matched by team tag)
  - Any custom budgets that include the resource by filter

NO DOUBLE-COUNTING within a single budget. Each budget is independent;
the same dollar appears in multiple budget totals (which is correct —
the dollar contributes to multiple accountability boundaries).
```

This is sometimes a source of confusion. "Why does my team's budget show $24K and the sum of my resource budgets show $12K?" Because the resource budgets only cover three specific resources; the team budget includes everything tagged with the team. The team total includes the resource subtotals + everything else.

### Designing the hierarchy

A practical sequence for designing budget hierarchy from scratch:

```
1. START with team budgets
   One per-team budget per team that has cost accountability.
   This is the foundation.

2. ADD per-group budgets for environments
   prod / staging / dev per team if these are meaningful boundaries.
   Optional but common.

3. ADD per-resource budgets for outliers
   The top 3-5 most-expensive resources per team. The 80/20 rule —
   per-resource budgets give pinpoint signal where it matters.

4. ROUTE notifications by audience
   Per-team → team lead + FinOps
   Per-group → group lead
   Per-resource → resource owner + escalation chain

5. REVIEW quarterly
   Are the budgets the right amount? Are the thresholds firing
   meaningfully? Are the audiences responding? Adjust.
```

### How ZopNight uses budget hierarchies

Customer telemetry on budget configurations:

```
ORG MATURITY            TYPICAL BUDGET SHAPE
──────────────────────────────────────────────────────────────────
Crawl                    Single org-wide budget; no team budgets
Walk (early)             Per-team budgets, no per-group/resource
Walk (late)              Per-team + per-group (for prod/staging)
Run                       Per-team + per-group + per-resource for
                         outliers; composite alerts
Run (mature)             All of above + budget vs forecast variance
                         tracking; quarterly budget re-baseline
```

The progression is gradual. Don't try to build the full Run-stage hierarchy on day 1 — the per-team budgets capture 80% of the value with 20% of the work.

---

## 2. Demo

A mid-size org's composite budget structure:

```
ORG: 5 teams, $180K/month total spend

PER-TEAM BUDGETS:
  platform:        $24,000/month
  product:         $42,000/month
  data:            $30,000/month
  ml-infra:        $48,000/month
  shared-services:  $9,000/month
                     ─────────
                     $153,000/month (overhead: $27K untagged + 
                                      shared infra for tags review)

PER-GROUP BUDGETS (selected):
  prod-platform:   $14,000   (subset of platform's $24K)
  prod-product:    $26,000   (subset of product's $42K)
  prod-data:       $18,000   (subset of data's $30K)
  ml-training:     $22,000   (subset of ml-infra's $48K)

PER-RESOURCE BUDGETS (top 8 critical):
  db-prod-orders            $1,200
  db-prod-payments          $1,500
  redis-prod-cache          $600
  prod-eks-cluster          $3,500
  ml-training-cluster       $8,000
  data-warehouse            $4,500
  s3-prod-archive            $1,800
  monitoring-cluster         $800

ALERT ROUTING:
  Per-resource:  resource owner + their on-call
  Per-group:     group lead + #group-team-channel
  Per-team:      team lead + #team-channel + #finops-alerts (at 90%)

WHEN A SPECIFIC RESOURCE CROSSES 75%:
  Only that resource's owners are alerted
  The group's budget may be far from 75%; no group alert
  The team's budget unaffected; no team alert

WHEN THE TEAM'S BUDGET CROSSES 75%:
  Team lead + FinOps alerted
  This is a composite signal; investigate which sub-scopes drove it
```

The hierarchy means each alert lands on the right audience with the right specificity.

---

## 3. Hands-on (5 min)

Design your team's budget hierarchy:

```
PER-TEAM BUDGET:
  Team name:    __________
  Budget:        $__________ per month
  Alert audience: __________
  Threshold pattern: __________

PER-GROUP BUDGETS (0-3 typically):
  Group:        __________  Budget: $__________  Audience: __________
  Group:        __________  Budget: $__________  Audience: __________
  Group:        __________  Budget: $__________  Audience: __________

PER-RESOURCE BUDGETS (top 3-5 critical):
  Resource:     __________  Budget: $__________  Owner: __________
  Resource:     __________  Budget: $__________  Owner: __________
  Resource:     __________  Budget: $__________  Owner: __________

REVIEW CADENCE:    monthly / quarterly
```

A common error is to skip per-resource budgets entirely. Even one or two well-chosen per-resource budgets (the database, the EKS cluster) catch anomalies the per-team budget would dilute.

---

## 4. Knowledge check

### Q1
A critical database needs precise budget tracking:

A. Per-team budget is enough
B. Per-resource budget for that database. Alerts fire on this resource specifically, routed to the DB owner. Most precise scope; combine with per-team for composite visibility.
C. Account isolation
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Per-resource is the right scope for high-stakes individual resources.
</details>

### Q2
A per-team budget aggregates spend from:

A. Just one resource
B. All resources tagged team=X. The sum across the team's full estate, regardless of which group or account they live in. Cross-account aggregation via the team tag.
C. Just the most expensive
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Team-tagged aggregation is the per-team scope. Resources in any account with the team tag contribute.
</details>

### Q3
Multiple budgets on the same data:

A. Cause double-counting
B. Are independent. Per-team, per-group, per-resource all track overlapping spend. The same dollar contributes to each budget it falls under, alerting different audiences at the appropriate granularity. Common pattern in mature orgs.
C. Confuse the engine
D. Are not allowed

<details>
<summary>Show answer</summary>

**Correct: B.** Independent budgets, same underlying data. Each watches a different accountability boundary.
</details>

---

## 5. Apply

Create budgets at [Settings → Budgets → New Budget](https://app.zopnight.com/settings/budgets/new). Pick the scope (resource / group / team), set the amount, configure threshold alerts. The Budget Health dashboard surfaces all your budgets in one view.

For new customers, the recommended starting hierarchy is: per-team budgets for each cost-accountable team, plus per-resource budgets for the 3-5 highest-cost critical resources. Add per-group budgets once team budgets are stable.

---

## Related lessons

- [L1 — Budget vs forecast vs alert](L1_budget_basics.md)
- [L3 — Threshold-crossing notifications](L3_threshold_alerts.md) *(next)*
- [L4 — Green/yellow/red signals](L4_signals.md)
- [L5 — Live computation, not stored](L5_live_compute.md)
- [T3.M3.5.L1 — Pick the showback dimension](../M3.5_showback/L1_pick_dimension.md)

## Glossary terms touched

[Budget scope](../../../reference/glossary/budget-scope.md) · [Per-resource budget](../../../reference/glossary/per-resource-budget.md) · [Per-group budget](../../../reference/glossary/per-group-budget.md) · [Per-team budget](../../../reference/glossary/per-team-budget.md) · [Composite budget](../../../reference/glossary/composite-budget.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.6.L2
