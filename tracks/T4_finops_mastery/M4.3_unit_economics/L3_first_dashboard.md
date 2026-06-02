# Building the first dashboard

§ T4 · M4.3 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **set up** the first unit economics dashboard, **layout** the key elements (big number, trend, comparison, annotations), **and adopt** a review cadence.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Make unit economics a number every team sees, not a hidden FinOps calculation." |
| **Personas** | FinOps Lead · Engineering Leader · Product Leader |
| **Prerequisites** | M4.3.L1 (denominator) · M4.3.L2 (numerator) |
| **Time** | 9 minutes |
| **Bloom verb** | Set up (Apply), Layout (Create), Adopt (Apply) |

---

## 1. Concept

A unit economics dashboard is the surface where the cost-per-X number becomes visible and discussable. The dashboard turns "we have a metric" into "the team sees it weekly." Five elements compose a good unit economics dashboard:

```
1. CURRENT cost-per-unit  (big number)
2. TREND over time         (line chart, 12 months typical)
3. HISTORICAL comparison    (this quarter vs last)
4. YEAR-OVER-YEAR           (if data available)
5. ANNOTATIONS              (notes on key events affecting the metric)
```

The five elements together tell a story: current state, direction, context, comparison, explanation.

### Dashboard layout

```
[BIG NUMBER]                              [TREND SPARKLINE]
$11.83 / paying user                       ↘ down from $13.20 (3 mo ago)


[LINE CHART — 12 months]
   $14 -│      ████████
   $13 -│              ██████
   $12 -│                    ████████
   $11 -│                            █████
   $10 -│
   $9  -│
       └────────────────────────────────────
       Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar  Apr  May


[COMPARISON]
  This quarter vs same quarter last year:  improving 8%
  Quarter-over-quarter:                     improving 5%


[ANNOTATIONS]
  Mar 15: launched new feature (cost up briefly)
  Apr 30: optimized data pipeline (cost down 6%)
  May 12: scaled to support EU expansion (small increase expected)
```

### Update cadence

```
DATA REFRESH:
  Daily: dashboard reflects yesterday's data (24-hour billing lag)

REVIEW CADENCE:
  Weekly: review at team meeting (quick scan; flag anomalies)
  Monthly: detailed analysis with finance + leadership
  Quarterly: deep variance analysis; re-baseline forecast
```

The data refreshes daily; the review cadence is weekly/monthly. Don't conflate the two — daily updates with monthly review is the typical pattern.

### Annotations matter most

The fifth element — annotations — is the most-skipped and most-valuable:

```
KEY EVENTS to annotate:
  Major feature launches            (cost spike during ramp-up)
  Cost optimization sprints          (cost drop)
  Scaling events                     (Black Friday, EU expansion)
  Acquired company integrations      (one-time noise)
  Pricing model changes              (rate-card or commitment renewals)
  Methodology changes                 (numerator scope revisions)

WITHOUT annotations:
  Six months later, no one remembers why cost spiked in March
  Future-self misreads the trend
  Conversations stuck on "what happened in week 12?"
  
WITH annotations:
  Trend is interpretable years later
  Lessons captured in context
```

The discipline: annotate when the event happens, not later from memory.

### Team adoption pattern

```
WEEK 1:     Set up dashboard; first data populates
WEEK 2-3:   Team starts reviewing in weekly meetings
WEEK 4-8:   Discussion patterns emerge:
              "Cost-per-MAU is up — investigate"
              "Why did cost drop in week 6?"
              "Annotation explains the drop"

WEEK 12+:   Mature usage; routine review
              Team trusts the number; uses it for decisions
              Annotations accumulate; trends become richer
```

The adoption curve is similar to other operating-cadence rituals. The first month is awareness; months 2-3 are habit-formation; month 4+ is routine.

### Sharing the dashboard

```
INTERNAL AUDIENCES:
  Engineering — cost trend awareness in team metrics
  Finance — unit economics for financial reporting
  Leadership — business efficiency narrative
  Product — feature ROI per user
  
EXTERNAL AUDIENCES (some companies report externally):
  Investors — unit economics as efficiency proof
  Board — quarterly business efficiency
  Analysts — comparable to peer benchmarks (if disclosed)

CAUTION:
  External metrics need careful definition + consistency
  Once published externally, the definition is hard to change
  without explanation
```

### Common dashboard mistakes

```
MISTAKE                                       FIX
──────────────────────────────────────────────────────────────────
Too many metrics on one dashboard              Pick one primary;
(visual overload)                              demote others to drill
                                              
No annotations (trends unexplained)            Annotate events as
                                              they happen
                                              
Bad axis scale (small variations look           Use absolute axis
huge or vice versa)                            range matched to value
                                              
No context (just current number)               Add comparison +
                                              trend
                                              
Updated weekly but reviewed never              Adoption ritual missing;
                                              build the review cadence
```

### How ZopNight surfaces the dashboard

ZopNight's [Reports → Unit Economics](https://app.zopnight.com/reports/unit-economics) provides the canonical view with all five elements. The dashboard supports multiple unit metrics (primary + secondary) with toggles; annotations are inline with the chart; quarter-over-quarter and year-over-year comparisons appear in the right panel.

For team-specific unit economics, configure a custom dashboard (M3.7) with the Unit Economics widget filtered to the team.

---

## 2. Demo

A team's unit economics dashboard, 6 months in:

```
DASHBOARD: "Acme — Unit Economics Q2"

BIG NUMBER:
  Cost-per-paying-user: $11.83
  Q-o-Q change: -9% (improving)
  Y-o-Y change: -14% (improving)

LINE CHART (12 months):
  Trend visible: descending from $13.50 (Jun) to $11.83 (May)
  Two visible bumps:
    Feb (data pipeline migration)
    Apr (brief spike during EU launch)

COMPARISON BLOCK:
  vs Q1 2026:    -9% (improving)
  vs Q2 2025:    -14% (improving)
  vs forecast:   -3% (better than forecast — wins)

PER-TEAM BREAKDOWN (chart):
  Platform team:    $4.20 / paying user
  Product team:      $5.10
  Data team:         $1.80 (heavy ETL but small surface)
  ML team:           $0.73 (small inference cost; large user base)
  
ANNOTATIONS (5 visible):
  Feb 8:   Data pipeline migration (one-time +$0.30)
  Mar 15:  Auto-tagger campaign (+5% coverage, no cost change)
  Apr 1:   Q1 optimization completed (-$0.80)
  Apr 18:  EU expansion launch (+$0.40, expected)
  May 5:   Auto-rem rule activated (-$0.20)

DISCUSSION at monthly review:
  "Trend is positive; Q1 optimization sustained."
  "Investigate why ml-team's cost-per-user is so low —
    can we apply the pattern elsewhere?"
  "Q2 target: cost-per-paying-user < $11."

OUTCOME: dashboard is used weekly; annotations are kept current;
team is making decisions from the data.
```

---

## 3. Hands-on (5 min)

Sketch your unit economics dashboard:

```
PRIMARY METRIC (from L1-L2):    $___ per __________

LAYOUT elements you want:
  □ Big number with delta
  □ 12-month trend line
  □ Quarter-over-quarter comparison
  □ Year-over-year comparison
  □ Per-team breakdown (if relevant)
  □ Annotations

REVIEW CADENCE:
  Daily / weekly / monthly: __________
  Owner of the review: __________
  Distribution (who sees it): __________

ANNOTATIONS to seed (events you remember from past 3 months):
  __________________________________________________________
  __________________________________________________________
  __________________________________________________________

FIRST REVIEW MEETING (calendar date):    __________
```

The first review is where the dashboard either becomes a routine or atrophies. Schedule it explicitly.

---

## 4. Knowledge check

### Q1
A dashboard with no annotations:

A. Cleaner — less noise
B. Trends become mysterious. Six months later, no one remembers why cost spiked in March. Annotations capture the why in real time and preserve context for future readers. Annotations are essential for interpretable trends.
C. Random
D. Better — viewers focus on numbers

<details>
<summary>Show answer</summary>

**Correct: B.** Annotations are essential for context. Skipping them is the most common dashboard mistake.
</details>

### Q2
Year-over-year comparison on cost-per-unit:

A. Useless because too much changes year-over-year
B. Useful because it removes seasonality. Same month last year vs same month this year accounts for natural seasonal variation (Black Friday, holiday traffic, ML training cycles). Y-o-Y is often a cleaner signal than Q-o-Q for some workloads.
C. Random
D. Required only for finance

<details>
<summary>Show answer</summary>

**Correct: B.** Y-o-Y removes seasonality. Adds context, especially for cyclical businesses.
</details>

### Q3
Per-team comparison of cost-per-unit:

A. Same as the aggregate
B. Different per team. Each team's workload differs (compute-heavy vs IO-heavy vs ML-heavy), so cost-per-unit varies. Use the comparison for understanding patterns and identifying optimization opportunities, not for cross-team competition or fairness arguments.
C. Random
D. Per-team is meaningless

<details>
<summary>Show answer</summary>

**Correct: B.** Different per team; use thoughtfully. Cross-team comparison is informational, not competitive.
</details>

---

## 5. Apply

Build the dashboard at [Reports → Unit Economics](https://app.zopnight.com/reports/unit-economics). Configure the primary metric per M4.3.L1; the scope per M4.3.L2; annotations as events occur.

Schedule the first review meeting on your calendar. The dashboard exists; the review cadence is what makes it useful.

---

## Related lessons

- [L1 — Picking the denominator](L1_picking_denominator.md)
- [L2 — The cost numerator](L2_cost_numerator.md)
- [L4 — Forecasting unit cost](L4_forecasting_unit_cost.md) *(next)*
- [L5 — Communicating to non-engineers](L5_communicating.md)
- [T3.M3.7 — Dashboards](../../T3_zopnight_architect/M3.7_dashboards/00_README.md)

## Glossary terms touched

[Unit economics dashboard](../../../reference/glossary/unit-economics-dashboard.md) · [Annotation](../../../reference/glossary/annotation.md) · [Year-over-year](../../../reference/glossary/year-over-year.md) · [Review cadence](../../../reference/glossary/review-cadence.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.3.L3
