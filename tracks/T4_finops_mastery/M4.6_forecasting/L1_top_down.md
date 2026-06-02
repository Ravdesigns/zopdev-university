# Top-down forecasting

§ T4 · M4.6 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **build** a top-down cost forecast from historical pattern plus leadership goals, **allocate** the total to BUs and teams using historical proportions, **and recognize** when top-down alone misses important team-specific dynamics.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Produce a defensible org-level forecast in two hours using historical data plus the company's growth plan." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner |
| **Prerequisites** | M4.4 — Budget governance · M4.3 — Unit economics |
| **Time** | 9 minutes |
| **Bloom verb** | Build (Apply), Allocate (Apply), Recognize (Analyze) |

---

## 1. Concept

Top-down forecasting starts with the **org's total trajectory** and allocates down to BUs and teams using historical proportions. It is the fast, low-effort method appropriate for org-level commitment and for orgs that don't yet have team-level forecasting discipline.

```
TOP-DOWN PROCESS:
  1. Pull historical org-wide spend (12-24 months)
  2. Apply a growth rate from leadership plan + extrapolation
  3. Add planned major events
     - New product launches with quantified cost impact
     - M&A integrations
     - Migration projects with known cost shape
  4. Add safety margin (typically 10-15%)
  5. Allocate to BUs/teams using historical proportions
  6. The result IS your committed forecast for the period
```

Top-down is one method. Bottom-up (L2) is the other. Hybrid (L3) reconciles the two. For most mature orgs, the answer is hybrid; understanding top-down on its own is the foundation.

### Pros and cons

```
PROS                                       CONS
──────────────────────────────────────────────────────────────────
Fast (2-4 hours total)                      Misses team-specific dynamics
Leadership-driven (uses growth plan)        Less accurate for individual teams
Easy to update each period                  Top number is aggregate, not granular
Captures planned events                     Bottom-up has team-level rigor
Defensible at the org level                 Hard to argue with team leads who
                                            see different patterns
```

### When top-down alone is enough

```
GOOD FIT
  Early-stage company without per-team data
  Org-level reporting only (board, investors)
  Stable cost trajectory; no major team-specific changes
  Quick directional forecasts for planning conversations
  Crawl- or Walk-stage maturity (per M4.1)
```

### When top-down misses

```
POOR FIT
  Major team-specific changes (one team scaling 3×)
  New product launches with different cost shape than historical
  Multi-quarter migrations spanning teams
  Acquisitions where historical trajectory doesn't predict future
  Architectural changes (e.g., moving from EC2 to Lambda)
```

For these scenarios, augment with bottom-up (L2). The combination is hybrid (L3).

### The growth-rate input

The growth rate is the most-leveraged input to a top-down forecast. Getting it right matters more than any other single decision.

```
SOURCES of growth rate:
  Leadership's stated revenue growth target (anchor)
  Historical CAGR (calibration check)
  Customer growth projections (if cost scales with customers)
  Workload expansion plans (engineering roadmap)

EXAMPLE input synthesis:
  Leadership target: 30% YoY revenue growth
  Historical CAGR: 25%
  Customer plan: 28%
  Workload plan: +15% from new launches
  
  Synthesized growth rate: ~30% YoY (= 7% quarter-over-quarter)
  Confidence: medium (range 25-35% defensible)
```

### Safety margin sizing

The safety margin absorbs uncertainty. Too small and forecasts miss; too large and budgets become slack.

```
HORIZON          TYPICAL MARGIN
──────────────────────────────────────────────────────────────────
1 month ahead    5-8%
1 quarter ahead   10-12%
6 months ahead    15-18%
1 year ahead      20-25%
```

The margin grows with horizon. A 12-month top-down with no margin is forecast theater; communicate the actual uncertainty.

### Allocation to BUs/teams

```
EXAMPLE allocation, $1.55M Q4 forecast:
  
  Historical proportions (last 4 quarters):
    engineering-platform:    35%
    engineering-product:      40%
    engineering-data:         20%
    shared-services:          5%
  
  Allocated forecast:
    engineering-platform:    $543K
    engineering-product:      $620K
    engineering-data:         $310K
    shared-services:          $78K
    Sum:                     $1.55M ✓
```

The allocation is a starting point. Teams that disagree (e.g., engineering-data has a planned migration not in the historical proportion) can adjust via bottom-up reconciliation.

### Common mistakes

```
MISTAKE                                    FIX
──────────────────────────────────────────────────────────────────
Use just last quarter as baseline          Use rolling 4-12 quarters;
(noisy)                                   smooths outliers
                                           
Apply same growth rate to all teams        Some teams scale faster;
                                          adjust per-team factors
                                          
No safety margin                           Always include; communicate
                                          the band
                                          
Ignore planned events                      Quantify launches, migrations,
                                          M&A explicitly
                                          
Forecast made then forgotten               Re-forecast monthly;
                                          variance analysis at quarter-end
```

### How ZopNight supports top-down

ZopNight's Cost Trend report supplies the historical baseline. Forecast overlay on the chart visualizes the projection. The customer can configure growth rate + planned events in [Reports → Forecast](https://app.zopnight.com/reports/forecast); the allocation page distributes the total per team using historical proportions or custom weights.

For commitment portfolio planning (RIs, SPs), top-down forecasts feed the commitment-modeling tool (M4.7).

---

## 2. Demo

A clean top-down Q4 forecast:

```
ORG: B2B SaaS, $1.2M/mo current run rate (Q3 2026)

INPUTS:
  Q3 2026 actual: $1.2M/mo
  Growth rate: +8% (leadership plan, calibrated against 6% CAGR)
  Planned events:
    Black Friday traffic spike: +$50K (one-time over 2 weeks)
    New product launch (October): +$30K/mo ongoing
  Safety margin: 12% (quarterly horizon)
  
COMPUTATION:
  Base growth: $1.2M × 1.08 = $1.296M/mo
  + Black Friday (amortized): +$25K/mo for Q4
  + Product launch: +$30K/mo ongoing
  Subtotal: $1.351M/mo
  Safety margin (12%): +$162K/mo
  
  Q4 FORECAST: $1.55M/mo (committed)

ALLOCATION:
  Historical proportions × $1.55M:
    eng-platform (35%):    $543K/mo
    eng-product (40%):     $620K/mo
    eng-data (20%):        $310K/mo
    shared-services (5%):   $78K/mo
    
  Sum: $1.551M ✓

PRESENTED to leadership:
  "Q4 cost forecast: $1.55M/mo, range $1.39M - $1.74M (±12%)
   Drivers: 8% baseline growth, Black Friday, October launch.
   Recommend budgeting at $1.6M/mo for safety."
```

The forecast is built in ~2 hours of work and is defensible enough for a board slide.

---

## 3. Hands-on (5 min)

Build a top-down forecast for your next quarter:

```
CURRENT QUARTER ACTUAL (or YTD run rate):   $__________ /mo

GROWTH RATE INPUTS:
  Leadership target:           ____% YoY
  Historical CAGR:              ____%
  Synthesized rate:             ____% (per quarter or per year)

PLANNED MAJOR EVENTS (with dollar impact):
  __________  +$__________
  __________  +$__________
  __________  +$__________

SAFETY MARGIN:    ____% (10-12% for quarter horizon)

TOP-DOWN FORECAST:    $__________ /mo

ALLOCATION to teams:
  Team A (__%):   $__________
  Team B (__%):   $__________
  Team C (__%):   $__________
  Sum check:      $__________

CONFIDENCE BAND:    $______ to $______
```

If you cannot fill in the growth-rate inputs, the forecast isn't ready. Source the inputs from leadership before committing the number.

---

## 4. Knowledge check

### Q1
Top-down forecasting is best for:

A. Highly granular per-team forecasts
B. Org-level forecasting, stable trajectory, quick turnaround. Top-down is the right tool when you need a defensible org number in a few hours and the per-team detail can come from a separate bottom-up exercise.
C. Per-resource detail
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Top-down for org level. Bottom-up for team rigor; hybrid for both.
</details>

### Q2
A 12% safety margin in a top-down forecast accounts for:

A. Profit
B. Forecasting uncertainty — major events you didn't quantify, unexpected growth surprises, cost-rate changes, normal variability. Without the margin, forecasts that come in over budget look like overspend; with margin, normal variability is absorbed and only true overruns surface.
C. Random
D. Cloud rate hikes only

<details>
<summary>Show answer</summary>

**Correct: B.** Margin absorbs uncertainty. It's not a buffer for laziness; it's an honest band.
</details>

### Q3
Top-down combined with bottom-up (hybrid):

A. Worse than either alone
B. Better than either alone. Top-down provides org context and growth assumptions; bottom-up provides team-level rigor and planned-event detail; reconciliation surfaces discrepancies and improves both. See L3 for the reconciliation process.
C. Random
D. Same as top-down

<details>
<summary>Show answer</summary>

**Correct: B.** Hybrid wins. Both methods catch different things.
</details>

---

## 5. Apply

Build the top-down each quarter. Configure in [Reports → Forecast](https://app.zopnight.com/reports/forecast). Calibrate growth rates against actuals each quarter — your synthesized rate should improve over time.

---

## Related lessons

- [L2 — Bottom-up forecasting](L2_bottom_up.md) *(next)*
- [L3 — Hybrid and reconciliation](L3_hybrid.md)
- [L4 — Forecast accuracy](L4_accuracy.md)
- [L5 — Communicating uncertainty](L5_uncertainty.md)
- [T4.M4.4 — Budget governance](../M4.4_budget_governance/00_README.md)

## Glossary terms touched

[Top-down forecast](../../../reference/glossary/top-down-forecast.md) · [Growth rate](../../../reference/glossary/growth-rate.md) · [Safety margin](../../../reference/glossary/safety-margin.md) · [Historical proportions](../../../reference/glossary/historical-proportions.md) · [CAGR](../../../reference/glossary/cagr.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.6.L1
