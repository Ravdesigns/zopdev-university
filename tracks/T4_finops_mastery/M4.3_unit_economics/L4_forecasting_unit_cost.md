# Forecasting unit cost

§ T4 · M4.3 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **project** unit cost trends using three methods (extrapolation, driver-based, scenarios), **recognize** when to worry about trend reversal, **and communicate** forecast uncertainty honestly.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Tell leadership what cost-per-unit will be next quarter and why, with appropriate uncertainty bands." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner |
| **Prerequisites** | M4.3.L1-L3 (denominator, numerator, dashboard) · M4.6 (forecasting general) |
| **Time** | 9 minutes |
| **Bloom verb** | Project (Apply), Recognize (Analyze), Communicate (Apply) |

---

## 1. Concept

Forecasting unit cost is projecting the cost-per-unit trend forward. The forecast supports budgeting, capacity planning, and the leadership narrative. Three methods, each with its sweet spot:

```
A. EXTRAPOLATION:
   Linear or exponential fit to recent data
   "Cost-per-MAU is dropping 2% per month; project forward."
   
B. DRIVER-BASED:
   Forecast cost and denominator separately; combine
   "Cost will grow $13K next quarter due to new feature;
    MAU will grow 15%; cost-per-MAU = (cost + $13K) / (MAU × 1.15)"
   
C. SCENARIOS:
   Best/likely/worst case projections
   "Best: $9; Likely: $11; Worst: $13"
```

Method A is fastest; Method B is most accurate; Method C handles uncertainty.

### Method A — Extrapolation

```
Last 12 months cost-per-paying-user:
  Month -12:  $13.50
  Month -6:   $12.20
  Month -1:   $11.83
  
TREND: -2% per month average
  
FORECAST month +3: $11.83 × (1 - 0.02)^3 = $11.14
FORECAST month +12: $11.83 × (1 - 0.02)^12 = $9.30

Simple, fast. Useful for "first sketch" forecasts.
WEAKNESS: doesn't account for upcoming changes (launches, optimizations).
```

### Method B — Driver-based

```
SEPARATE forecasts for numerator and denominator:

Numerator (cost) forecast:
  Current: $142K/mo
  Planned launches: +$13K/mo (new product features)
  Optimization in flight: -$5K/mo (Q2 sprint)
  Forecast: $150K/mo by end of Q2

Denominator (paying users) forecast:
  Current: 12,000
  Sales pipeline: +1,500
  Churn rate: -2% per month → -240/mo
  Forecast: 14,000 by end of Q2

COMBINED forecast:
  Cost-per-paying-user = $150K / 14,000 = $10.71
  
COMPARED to extrapolation:
  Extrapolation: $11.14
  Driver-based: $10.71 (more accurate because accounts for both
    planned growth AND optimization)
```

### Method C — Scenarios

```
BEST CASE:
  Cost optimization exceeds plan
  User growth meets plan
  cost-per-paying-user: $9.50

LIKELY CASE:
  Cost optimization meets plan
  User growth meets plan
  cost-per-paying-user: $10.71

WORST CASE:
  New feature consumes more compute than expected
  User growth misses by 30%
  cost-per-paying-user: $13.20

USED FOR:
  Budget planning (commit to LIKELY; reserve for WORST)
  Variance analysis (was the actual closer to BEST or WORST?)
  Leadership conversations (the range, not a single number)
```

### When to worry

```
PATTERN                                    INVESTIGATE?
──────────────────────────────────────────────────────────────────
Trend reverses (decline → increase)         Yes — what changed?
Sudden spike (one-month jump)               Yes — anomaly or
                                              expected event?
Stagnant for 6+ months                      Maybe — efficiency
                                              plateau? Worth a
                                              re-examination
Continued decline                          Note — investigate
                                              what's working;
                                              document the pattern
Sudden drop                                 Yes — definition
                                              change? Denominator
                                              spike? Anomaly?
```

A trend reversal is the strongest signal. The narrative changes from "improving" to "worsening"; investigate immediately rather than waiting for the next monthly review.

### Per-team forecast variation

Different teams have very different trajectories:

```
TEAM A (mature platform team):
  Cost-per-MAU stable or declining slowly
  Forecast: continued slow decline → $10 in 6 months
  Story: efficiency plateau; minor optimizations ongoing
  
TEAM B (new feature ramping):
  Cost-per-MAU rising as feature scales
  Forecast: $14 in 6 months
  Story: new product cost ramp-up; acceptable
  Expected to drop once user base grows to match infrastructure
  
TEAM C (legacy / sunset):
  Cost-per-MAU rising as fixed infra is amortized over shrinking user base
  Forecast: per-MAU rises further (fewer users sharing fixed cost)
  Story: end-of-life economics; consider deprecation timeline

TEAM D (M&A integration):
  Cost-per-MAU spiking during integration
  Forecast: returns to baseline 6-12 months post-integration
  Story: one-time migration cost; should normalize
```

Each team's trajectory tells its own story. Aggregate forecasts mask this; per-team forecasts surface it.

### Forecasting accuracy

Be honest about uncertainty:

```
HORIZON                              TYPICAL ACCURACY
──────────────────────────────────────────────────────────────────
Month-ahead                          ±5-10%
Quarter-ahead                        ±10-20%
Year-ahead                           ±20-30%
Multi-year                            ±40%+
```

Accuracy decreases with horizon. Communicating "Q4 will be $X ± 20%" is more honest than "Q4 will be $X" — and audience trust improves over time when uncertainty is communicated and outcomes fall within the band.

### Forecast vs budget

```
FORECAST: what we think will happen based on current data
BUDGET:   what we have committed to spend

A forecast that exceeds budget is a signal to investigate;
it does not automatically mean the budget will be exceeded
(the team has time to adjust).
```

### How ZopNight forecasts unit cost

ZopNight's Unit Economics report includes a forecast overlay using driver-based methodology by default. The customer can override with extrapolation or import scenarios from a planning sheet. The confidence band visualizes uncertainty.

For variance analysis, the report compares "forecast at time T" vs "actual at time T+N" for past periods, surfacing forecast accuracy trends.

---

## 2. Demo

A SaaS company's Q4 unit cost forecast:

```
CURRENT (end of Q3):
  Cost: $142K/mo
  Paying users: 12,000
  Cost-per-paying-user: $11.83

PLANNED CHANGES Q4:
  Product launch in November:    +$20K/mo for new features
  EU expansion:                    +$5K/mo for regional infra
  Q4 optimization sprint:           -$10K/mo expected savings
  Sales growth target:              +2,400 paying users (20% growth)
  Churn rate:                       -2%/mo (assume continued)

DRIVER-BASED FORECAST Q4:
  Cost: $142K + $20K + $5K - $10K = $157K/mo by end of Q4
  Paying users: 12,000 × 1.18 (net of churn) = 14,160
  Cost-per-paying-user: $157K / 14,160 = $11.09
  
SCENARIOS:
  BEST: optimization exceeds, user growth meets: $9.80
  LIKELY: optimization meets, user growth meets: $11.09
  WORST: optimization misses, user growth misses by 30%: $12.80

DECISION (leadership review):
  "Cost-per-paying-user continues to improve despite new launches.
  Forecast Q4: $11 (likely), range $10-$13.
  Acceptable trajectory; on track for $10/user target by end of Q1 2027."

VARIANCE CHECK against prior forecast:
  Q3 forecast made in Q2: $12.10
  Q3 actual: $11.83 (better than forecast)
  Variance: -2.2% (within ±10% band)
  Track record: forecast accuracy improving over time
```

---

## 3. Hands-on (5 min)

Forecast your unit cost for the next quarter:

```
CURRENT cost-per-unit:    $__________

METHOD A — Extrapolation:
  Recent trend: ____% per month
  Forecast next quarter: $__________

METHOD B — Driver-based:
  Numerator forecast: $__________
    + planned increases: __________
    - planned decreases: __________
  Denominator forecast: __________
    + planned growth: __________
    - churn: __________
  Cost-per-unit forecast: $__________

METHOD C — Scenarios:
  BEST: $__________ (assumes: __________)
  LIKELY: $__________
  WORST: $__________ (assumes: __________)

WHICH METHOD do you trust most for your forecast?    __________
WHY: __________________________________________________________

VARIANCE check against previous quarter's forecast:
  Previous forecast: $__________
  Actual: $__________
  Variance: ____%
  Accuracy improving? Yes / No
```

If you don't have a previous forecast to check against, start producing forecasts now. Variance analysis becomes possible after 2-3 cycles.

---

## 4. Knowledge check

### Q1
Driver-based forecasting (vs extrapolation):

A. Same accuracy
B. More accurate. Forecasts cost and the denominator separately, combining them. Accounts for planned events (launches, optimizations, user growth) that extrapolation cannot see. Extrapolation is fine for first sketches; driver-based is for committed forecasts.
C. Random
D. Worse

<details>
<summary>Show answer</summary>

**Correct: B.** Driver-based is more accurate because it incorporates known future events.
</details>

### Q2
A team's cost-per-MAU rising as a new feature scales:

A. Always bad
B. Often acceptable. New features add cost before users grow to match. Monitor; if the pattern continues 6+ months without MAU growth catching up, investigate. Short-term cost-per-MAU rise during feature ramp-up is normal economics.
C. Random
D. Always good

<details>
<summary>Show answer</summary>

**Correct: B.** Temporary increase during ramp-up is acceptable; sustained increase warrants investigation.
</details>

### Q3
Forecast accuracy at year-ahead horizon:

A. ±2% — same as month-ahead
B. ±20-30%. Long-horizon forecasts have high uncertainty (many unknowns: launches, growth, optimization, market). Communicate this band honestly. Audience trust improves when uncertainty is acknowledged and actual outcomes fall within the band; trust erodes when forecasts are presented as certainties.
C. ±5%
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Long horizon = wider band. Honest communication of uncertainty builds trust.
</details>

---

## 5. Apply

Build your quarterly forecast at [Reports → Unit Economics → Forecast](https://app.zopnight.com/reports/unit-economics) (the forecast overlay). Configure driver-based inputs; use scenarios for budget planning.

Track variance: actual vs forecast for prior periods. Forecast accuracy is itself a metric — improving accuracy is a sign of mature unit economics practice.

---

## Related lessons

- [L1 — Picking the denominator](L1_picking_denominator.md)
- [L2 — The cost numerator](L2_cost_numerator.md)
- [L3 — Building the first dashboard](L3_first_dashboard.md)
- [L5 — Communicating to non-engineers](L5_communicating.md) *(next)*
- [T4.M4.6 — Forecasting deep-dive](../M4.6_forecasting/00_README.md)

## Glossary terms touched

[Forecast](../../../reference/glossary/forecast.md) · [Driver-based forecasting](../../../reference/glossary/driver-based-forecasting.md) · [Scenarios](../../../reference/glossary/scenarios.md) · [Forecast accuracy](../../../reference/glossary/forecast-accuracy.md) · [Confidence band](../../../reference/glossary/confidence-band.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.3.L4
