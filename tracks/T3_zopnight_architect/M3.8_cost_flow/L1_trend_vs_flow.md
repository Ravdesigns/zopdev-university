# When to switch from Trend to Flow

§ T3 · M3.8 · L1 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** Trend vs Flow based on the question being asked, **combine** them in a single investigation, **and explain** why most cost-review meetings use both views in sequence.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Answer 'are we going up?' with a Trend and 'where is the money?' with a Flow, without conflating the two." |
| **Personas** | FinOps Lead · Engineering Leader · Platform Engineer |
| **Prerequisites** | M3.5 — Showback dimensions · M3.6 — Budget governance |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Combine (Apply), Explain (Understand) |

---

## 1. Concept

Two fundamentally different views of cost data answer two fundamentally different questions:

```
TREND       Time-series chart. Answers: "Are we going up or down?"
            X-axis: time. Y-axis: cost.
            Use for: direction, growth, regression detection.
            
FLOW        Cascade diagram (Sankey). Answers: "Where is the money?"
            Multi-column visualization of cost composition.
            Use for: composition, attribution, "where to look" diagnosis.
```

Neither view answers the other's question. A Trend chart shows that costs are up 18% MoM, but cannot tell you which team or service drove it. A Flow diagram shows that platform-team's EKS is dominating spend, but cannot tell you whether it grew or has been steady. Most cost-review meetings start with one view to set context, then switch to the other to investigate.

### Trend questions

```
"Are we going up or down over time?"
"Is our cost stable week-over-week?"
"How did last week's deployment affect cost?"
"Is the schedule producing the expected savings?"
"Did the right-sizing campaign reduce spend?"
"What's the rate of growth (slope) over the period?"
```

Trends are **time-axis** views. They are best for understanding **direction** — is something getting better, worse, or stable? They surface anomalies as deviations from a baseline.

### Flow questions

```
"Where exactly is our $40K going this month?"
"Which team's resources are biggest contributors?"
"Across which providers does our K8s spend?"
"What's the breakdown of cost by resource type?"
"Inside platform-team, which sub-services dominate?"
"Among on-demand spend, which services contribute most?"
```

Flows are **cascade-axis** views. They are best for understanding **composition** — how a total is built up from its parts. They surface attribution and "where to look" answers.

### The complementary pair

The two views form a complementary pair. Each has a blind spot the other fills.

```
TREND BLIND SPOTS:
  Cannot tell you composition
  Aggregate trend masks heterogeneous causes
    (e.g., one team grew 50%, another shrank 30%; total looks flat)
  
FLOW BLIND SPOTS:
  Cannot tell you direction
  Snapshot of one point in time
    (e.g., the biggest contributor today may not be the fastest-
    growing — Flow doesn't show acceleration)
```

The combined workflow:

```
TREND FIRST:
  Confirm whether direction is concerning
  If concerning: identify the time window of the change

FLOW SECOND:
  For the concerning window, show composition
  Identify which dimension dominates the spend
  Drill to specific resources

OPTIONAL — Back to Trend:
  For the identified component, show its specific trend
  Confirm the component is the driver (not just the largest contributor)
```

### Trend on its own — diagnostic limit

```
Q: "Our bill is up 12% MoM. Why?"
TREND only:
  Confirms the +12%
  Maybe shows when it happened (week 3 vs week 1)
  Cannot tell you: which team, which service, which resource

THE NEXT STEP must be Flow (or per-team Trend).
```

A Trend alone gets you to "something happened in week 3"; Flow gets you to "ml-team's EKS is up."

### Flow on its own — diagnostic limit

```
Q: "Where is our $80K monthly spend going?"
FLOW only:
  Shows: AWS $40K, GCP $30K, Azure $10K
  Drill: which accounts, services, teams within
  Cannot tell you: whether any of this is growing
    (the biggest static contributor might be steady;
    a small contributor might be growing fast)

THE NEXT STEP for growth analysis is Trend per-component.
```

A Flow alone gets you to "where the money is right now"; Trend gets you to "where the money is going (over time)."

### Cost-review meeting pattern

The typical cadence for a monthly cost review:

```
SLIDE 1 — TREND (org-wide)
  "Last month: $96K. Prior: $84K. +14% MoM."
  Audience: leadership; sets the headline.
  
SLIDE 2 — FLOW (composition this month)
  "Where the $96K goes: AWS $58K, GCP $28K, Azure $10K."
  Audience: leadership + engineering; sets the where.

SLIDE 3 — TREND PER TOP CONTRIBUTOR
  "AWS trend: +18% MoM (the +14% is driven by AWS growth)."
  Audience: engineering; identifies the driver.

SLIDE 4 — FLOW (drilled into AWS)
  "Inside AWS: prod-platform $24K, prod-ml-infra $20K, ..."
  Audience: engineering; identifies the team / workload.

SLIDE 5 — TREND PER DRIVER (ml-infra deeper)
  "ml-infra +30% MoM; driven by new training cluster."
  Audience: engineering + ml team; ready to discuss action.

CONCLUSION:
  Action items, owners, next review date.
```

The pattern alternates Trend and Flow. Each switch answers the next-level question.

### How ZopNight surfaces both

```
SURFACE                   PRIMARY VIEW
──────────────────────────────────────────────────────────────────
Reports → Cost Trend       Trend (with optional Flow toggle inside
                          the same report)
                          
Reports → Cost Flow         Flow (Sankey) with optional Trend toggle
                          
Cost Breakdown card        Side-by-side Trend + Flow with linked
                          time-range and filters
                          
Dashboard widgets          Both views as separate widgets;
                          dashboard can show one or both
```

The Cost Breakdown card is the most integrated view — switching toggles within one card. For dedicated analysis, the separate Trend and Flow reports give more space and richer drill.

### How ZopNight uses Trend + Flow

The underlying data is the same `cost_records` table. Trend queries aggregate by date; Flow queries aggregate by dimension. Both share filters — a time range applied in Trend transfers to Flow when the user switches views (and vice versa). This continuity is what makes the workflow productive — you don't lose context when switching.

---

## 2. Demo

A real Trend → Flow → drill investigation:

```
QUESTION: "Why is the bill up 18% this month?"

T+0       Open Reports → Cost Trend
T+5 s     Trend chart confirms: $96K vs $81K prior = +18%
          Inflection point: around week 3
          
T+10 s    Toggle to Flow view (same time range)
T+15 s    Sankey shows:
            AWS:    $58K (+25% from prior)
            GCP:    $28K (+5%)
            Azure:  $10K (-3%)
          AWS is the +18% driver.
          
T+20 s    Click AWS in the Sankey
          Breadcrumb: AWS
          Drill cascade: Account → Type → Team
            prod-aws-us-east-1: $35K (+35%)
            prod-aws-eu-west:    $15K (+8%)
            (other accounts):    $8K (-5%)
          prod-aws-us-east-1 is the AWS driver.
          
T+30 s    Click prod-aws-us-east-1
          Breadcrumb: AWS > prod-aws-us-east-1
          Cascade: Type → Team
            EKS:    $14K (+60%)
            RDS:    $8K (+5%)
            EC2:    $7K (+10%)
          EKS is the account driver.
          
T+40 s    Click EKS
          Drill: which team's EKS?
            team-ml-infra: $11K
            team-platform: $3K
          ml-infra dominates.
          
T+45 s    Switch back to Trend (now filtered to ml-infra EKS)
          Confirms: ml-infra EKS +60% MoM
          Inflection: week 3 — matches the overall pattern
          
T+1 min   Diagnosis: ml-infra's EKS cluster grew sharply in week 3.
          Likely cause: new ml training workload deployed.
          
T+1.5 min ACTION:
          Confirm with ml-team lead: planned or anomalous?
          If planned: expected; document for next month's budget
          If anomalous: investigate further; revert if needed
```

Trend → Flow → drill → Trend (per driver). 90 seconds from question to specific diagnosis.

---

## 3. Hands-on (5 min)

For a question you have about your cost:

```
QUESTION:    __________________________________________________________

WHICH VIEW first?
  □ Trend (looking for direction / growth)
  □ Flow (looking for composition / attribution)

PROJECTED next step:
  □ Trend → switch to Flow to find the driver
  □ Flow → switch to Trend per top contributor
  □ Flow only (snapshot composition is enough)
  □ Trend only (direction is enough)

ESTIMATED time to specific answer:    _____ minutes
```

If your question is "how much do we spend" — Flow. If it's "is it growing" — Trend. Most real questions need both.

---

## 4. Knowledge check

### Q1
"Are we trending up or down?" Best view:

A. Flow
B. Trend — time-series of cost over time. Direction is the question. Flow would show composition (where the money is) but cannot show how the total is changing.
C. Both
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Trend for direction. Flow for composition. Don't conflate.
</details>

### Q2
"Where exactly is our $40K going this month?" Best view:

A. Trend
B. Flow — Sankey cascade composition. Where is the question. Trend would show whether the $40K is growing or shrinking but not where it's coming from.
C. Either
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Flow for composition.
</details>

### Q3
A team identifies that costs are up. Best workflow:

A. Just look at Trend forever
B. Start with Trend to confirm direction and identify the inflection window; switch to Flow to investigate composition for that window; drill to specific resources; optionally switch back to per-driver Trend to confirm. The two views are complementary; investigations alternate between them.
C. Use Flow only
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Trend → Flow → drill → Trend (per driver) is the canonical investigation pattern.
</details>

---

## 5. Apply

Switch between Trend and Flow in [Reports → Cost Breakdown](https://app.zopnight.com/reports/cost-breakdown) or in dedicated Trend ([Reports → Cost Trend](https://app.zopnight.com/reports/cost-trend)) and Flow ([Reports → Cost Flow](https://app.zopnight.com/reports/cost-flow)) views. Filters transfer between the two; time range persists.

For cost-review meetings, build a slide deck that alternates Trend and Flow — five slides telling the cost story. This is more effective than a single chart-dump.

---

## Related lessons

- [L2 — Five layout dimensions](L2_layouts.md) *(next)*
- [L3 — Drill, breadcrumb, back-out](L3_drill.md)
- [L4 — Savings overlay](L4_savings_overlay.md)
- [T3.M3.5.L1 — Pick the showback dimension](../M3.5_showback/L1_pick_dimension.md)
- [T3.M3.6.L4 — Green/yellow/red signals](../M3.6_budget_governance/L4_signals.md)

## Glossary terms touched

[Cost Trend](../../../reference/glossary/cost-trend.md) · [Cost Flow](../../../reference/glossary/cost-flow.md) · [Sankey diagram](../../../reference/glossary/sankey-diagram.md) · [Cost Breakdown card](../../../reference/glossary/cost-breakdown-card.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.8.L1
