# Bottom-up forecasting

§ T4 · M4.6 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **collect** team-level forecasts via a structured template, **identify** the systematic biases that creep into bottom-up numbers, **and aggregate** them into a defensible org-level total.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get team leads to forecast their own cost so the org-level number reflects ground truth, not a leadership wish." |
| **Personas** | FinOps Lead · Engineering Leader · Team Lead |
| **Prerequisites** | M4.6.L1 — Top-down forecasting |
| **Time** | 9 minutes |
| **Bloom verb** | Collect (Apply), Identify (Analyze), Aggregate (Apply) |

---

## 1. Concept

Bottom-up forecasting reverses the top-down approach: each team forecasts their own needs, and the FinOps function aggregates the results into the org total. The strength is **detail and ownership**; the weakness is **systematic bias** — teams over-forecast their own efficiency gains and under-forecast hidden costs.

```
BOTTOM-UP PROCESS:
  1. Each team's lead receives a forecast template
  2. They forecast resource by resource (or service by service)
  3. They consider planned events (launches, migrations, growth)
  4. They submit to FinOps
  5. FinOps aggregates; the sum is the bottom-up forecast
  6. The result feeds reconciliation with top-down (L3)
```

The process is 6-8 weeks for a quarterly forecast. Teams typically need 1-2 weeks to draft; FinOps needs 1-2 weeks to aggregate and review; the reconciliation takes another 1-2 weeks.

### When bottom-up wins

```
USE CASE                                  GOOD FIT
──────────────────────────────────────────────────────────────────
Major projects with clear scope            Yes — teams know their plan
Predictable steady-state workloads         Yes — easy to forecast
Quarterly budget planning                  Yes — standard cadence
Acquired company integration                Yes — different cost shape
                                          than historical
Multi-team migrations                       Yes — each team forecasts
                                          their leg
Team-level accountability building          Yes — forcing function
```

### When bottom-up misses

```
USE CASE                                  POOR FIT
──────────────────────────────────────────────────────────────────
Sudden unexpected growth                   Better caught by extrapolation
                                          (top-down)
Cross-team impacts                          Each team forecasts independently;
                                          interdependencies hidden
Marketing-driven cost spikes                Marketing isn't on the team list;
                                          falls between cracks
Cloud-rate changes                          External; no team has visibility
Org-wide rationalization                    Top-down captures aggregate
```

### Each team's contribution

A typical bottom-up template per team:

```
TEAM A (engineering-platform):
  Current run rate:  $50K/mo
  Planned changes:
    2 new K8s clusters in Q2 (+$8K each ongoing) = +$16K
    Decommission old monitoring stack (-$3K)
    Net: +$13K/mo
  Forecast Q2: $63K/mo
  
TEAM B (engineering-product):
  Current: $40K/mo
  Planned:
    Feature launch (+5K MAU expected) → +$3K compute
    Migrate API gateway (one-time +$2K Q1, neutral after)
  Forecast Q2: $43K/mo

TEAM C (engineering-data):
  Current: $30K/mo
  Planned:
    Data pipeline migration (+$10K Q2 one-time, baseline unchanged)
    New ML training cluster (+$5K/mo ongoing starting Q2)
  Forecast Q2: $35K/mo + $10K one-time = effective $45K Q2
                ($35K Q3+)

ORG TOTAL (bottom-up): $63K + $43K + $45K = $151K/mo Q2
                       (drops to $141K Q3 after one-time costs)
```

### Reconciling with top-down

The bottom-up total should approximately equal the top-down total. Where they diverge, investigation surfaces real assumptions:

```
TOP-DOWN sees: $145K/mo (8% growth from $134K baseline)
BOTTOM-UP sees: $151K/mo (sum of teams)

DIFFERENCE: $6K/mo (4% — within tolerance)

RECONCILIATION:
  Talk to teams about specific assumptions
  Cross-check planned events
  Resolve to a single committed number
```

A 4% difference is acceptable for a quarterly forecast; 15%+ difference signals significant assumption gaps worth investigating.

### Common systematic biases

Teams predictably forecast in specific directions:

```
BIAS                                        DIRECTION    SIZE TYPICAL
──────────────────────────────────────────────────────────────────
Underestimate cost growth                   under         5-15%
"Our infra is efficient; we won't grow"
                                            
Overestimate efficiency gains                under         5-10%
"We're going to right-size everything"
                                            
Forget hidden costs                          under         3-8%
"Just compute" misses egress, support,
monitoring, backup
                                            
Forget one-time events                       under         varies
"Just our steady state" misses migrations
                                            
Optimism about feature ROI                   under         varies
"New feature will be efficient per user"

Sometimes — OVER-forecasting                 over          5-20%
when defending budget headroom
```

The net bias is usually **under-forecasting by 5-15%**. Apply a correction factor based on historical accuracy (more in L4).

### Improving bottom-up accuracy

```
IMPROVEMENT                                IMPACT
──────────────────────────────────────────────────────────────────
Include hidden costs in template            +5% accuracy
(egress, monitoring, backup explicit)
                                          
Require one-time events as line items       +3% accuracy
                                          
Calibrate against last quarter's actuals    +5% accuracy per cycle
(team feedback loop)
                                          
Force ranges, not point estimates           +3% accuracy
(team commits to range, not single number)
                                          
Cross-team review (peer challenge)          +5% accuracy
(team A reviews team B's forecast)
```

Each improvement compounds. After 3-4 quarterly cycles, bottom-up accuracy can reach 92-95%.

### The forecast template

A minimum-viable template per team:

```
TEAM:    __________
PERIOD:   __________ (Q__ 2026)
PREPARED BY:    __________
DATE:    __________

CURRENT RUN RATE:    $______ /mo

PLANNED CHANGES:
  Resource/service           Driver               Cost impact
  __________                  __________            $______
  __________                  __________            $______
  __________                  __________            $______

ONE-TIME COSTS this period:
  __________                  $______
  __________                  $______

HIDDEN COSTS check (have you included?):
  □ Data egress
  □ Monitoring + logging
  □ Backup storage
  □ Support overhead
  □ DR / failover capacity

FORECAST (per month for the period):    $______
ONE-TIME ADJUSTMENT:    $______
TOTAL FORECAST for period:    $______

ASSUMPTIONS (key):
  __________________________________________________________
```

### How ZopNight supports bottom-up

ZopNight pre-fills the template per team using current spend data + recent trends. The team lead reviews, adjusts, adds planned events. Submitted templates aggregate automatically. FinOps reviews the aggregate before reconciliation.

```
ZOPNIGHT BOTTOM-UP TEMPLATE:
  Per team: pre-filled run rate + 30-day trend
  Manual: planned changes line items
  Manual: hidden cost checklist
  Auto: aggregation across teams
  Auto: variance vs top-down forecast
```

---

## 2. Demo

A quarterly bottom-up cycle:

```
TIMELINE:    Q2 forecast preparation (Feb 1 - Mar 31)

FEB 1 — week -8:
  FinOps sends forecast templates to team leads
  Pre-filled with current run rate + 30-day trend
  Template includes hidden-cost checklist

FEB 8 — week -7:
  Reminder; templates due Feb 15
  Office hours offered for team leads

FEB 15 — week -6:
  Forecasts collected:
    Platform team:  $63K/mo (with new cluster planning)
    Product team:   $43K/mo (feature launch)
    Data team:       $45K/mo (one-time migration)
    Shared services: $15K/mo
    Total: $166K/mo Q2
    
FEB 22 — week -5:
  FinOps review:
    Hidden cost check passed (all teams included egress)
    Data team's one-time migration verified
    Platform's new cluster cost cross-checked against
      RIs available

FEB 29 — week -4:
  Top-down comparison: $158K/mo (8% growth from baseline)
  Difference: $8K/mo (5% — within tolerance)

MAR 7 — week -3:
  Reconciliation meeting with team leads:
    Platform forecast revised slightly (cluster count refined to 2.5)
    Data forecast confirmed (migration is real)
    Product unchanged
    Resolved to $164K/mo Q2

MAR 14 — week -2:
  Forecast committed: $164K/mo Q2, ±10% band
  Communicated to leadership + finance
  
APR 1 — Q2 begins:
  Forecast in dashboard
  Monthly re-forecast scheduled
```

### Variance check at quarter end

```
JUNE 30 — Q2 ends:
  Forecast Q2: $164K/mo
  Actual Q2:   $171K/mo
  Variance:    +4.3%
  
  Within ±10% band ✓
  
  Causes of variance:
    Platform: cluster usage higher than planned (+$3K)
    Product: feature launch generated more traffic (+$4K)
    Data: migration as forecast
  
  Lessons for Q3 forecast:
    Bump platform forecast 3-4%
    Add traffic-driven adjustment to product feature forecasts
```

The variance feedback improves the next forecast.

---

## 3. Hands-on (5 min)

Draft a bottom-up forecast for your team:

```
TEAM:    __________
PERIOD:   __________ (next quarter)

CURRENT RUN RATE:    $______ /mo

PLANNED CHANGES (with dollar impact):
  __________  +/- $______
  __________  +/- $______
  __________  +/- $______

ONE-TIME COSTS this quarter:
  __________  $______
  __________  $______

HIDDEN COSTS check:
  □ Data egress
  □ Monitoring + logging
  □ Backup storage
  □ Support overhead

FORECAST per month:    $______
PLUS one-time:    $______

KEY ASSUMPTIONS:
  __________________________________________________________

CONFIDENCE in this forecast:   high / medium / low
WHY:    __________
```

Compare with the FinOps function's top-down number for your team. Identify the largest difference and investigate.

---

## 4. Knowledge check

### Q1
Bottom-up vs top-down forecast:

A. Same approach
B. Bottom-up is detailed (team-level, line items); top-down is aggregate (org-level, growth rate). Use both; reconciliation between them surfaces real assumption differences and improves overall accuracy. Hybrid (L3) is the typical mature practice.
C. Random
D. Only use one

<details>
<summary>Show answer</summary>

**Correct: B.** Hybrid is best. Each method catches things the other misses.
</details>

### Q2
Each team's bottom-up forecast typically:

A. Overestimates growth
B. Underestimates cost growth, overestimates own efficiency gains, forgets hidden costs (egress, monitoring, backup). Net bias is usually 5-15% under-forecasting. Apply a correction factor based on historical accuracy.
C. Random
D. Accurately reflects truth

<details>
<summary>Show answer</summary>

**Correct: B.** Bias toward optimism in self-forecasting. Correct via calibration.
</details>

### Q3
Bottom-up forecast diverges from top-down by 15%:

A. Pick whichever is lower
B. Reconcile. Investigate which is closer to reality. Big divergence signals real assumption differences worth understanding — could be missing events (top-down higher), forgotten growth (bottom-up lower), or genuine new info. Use the discrepancy as an investigation prompt.
C. Average them
D. Use the top-down (it's leadership-driven)

<details>
<summary>Show answer</summary>

**Correct: B.** Reconcile to find truth. The reconciliation is the value of running both methods.
</details>

---

## 5. Apply

Run quarterly bottom-up + top-down reconciliation. Use the template in this lesson; pre-fill via ZopNight's forecast tool. Track team-level accuracy quarterly; calibrate biases.

---

## Related lessons

- [L1 — Top-down forecasting](L1_top_down.md)
- [L3 — Hybrid and reconciliation](L3_hybrid.md) *(next)*
- [L4 — Forecast accuracy](L4_accuracy.md)
- [L5 — Communicating uncertainty](L5_uncertainty.md)

## Glossary terms touched

[Bottom-up forecast](../../../reference/glossary/bottom-up-forecast.md) · [Forecast template](../../../reference/glossary/forecast-template.md) · [Systematic bias](../../../reference/glossary/systematic-bias.md) · [Hidden costs](../../../reference/glossary/hidden-costs.md) · [Calibration](../../../reference/glossary/calibration.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.6.L2
