# Forecast accuracy

§ T4 · M4.6 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **measure** forecast accuracy correctly, **identify** the systematic drivers of inaccuracy, **and calibrate** future forecasts based on prior variance.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Make our forecasts measurably better each quarter rather than re-running the same imprecise exercise." |
| **Personas** | FinOps Lead · Finance Partner · Engineering Leader |
| **Prerequisites** | M4.6.L1-L3 (forecasting methods + reconciliation) |
| **Time** | 9 minutes |
| **Bloom verb** | Measure (Apply), Identify (Analyze), Calibrate (Evaluate) |

---

## 1. Concept

Forecast accuracy is **how close the forecast was to the actual**, measured after the period ends. Without tracking accuracy, you can forecast forever and never improve; with accuracy tracking, the forecast becomes a learning instrument.

```
FORMULA:
  Accuracy = 1 - |forecast - actual| / actual
  
EXAMPLE:
  Forecast: $158K/mo
  Actual:    $162K/mo
  Difference: $4K (2.5%)
  Accuracy:  97.5%
  
  (Note: use absolute value; over-forecast and under-forecast are
   both inaccuracies, just in different directions.)
```

The formula is straightforward; the discipline is in tracking it consistently and using it to improve.

### Target accuracy by horizon

Accuracy decreases with horizon. Be honest about what each horizon can achieve:

```
HORIZON              TARGET ACCURACY        TYPICAL ACTUAL
──────────────────────────────────────────────────────────────────
1 month ahead        ≥ 95%                  92-98%
1 quarter ahead       ≥ 90%                  85-95%
6 months ahead        ≥ 85%                  78-90%
1 year ahead          ≥ 80%                  70-85%
> 1 year              ≥ 70%                  60-80%
```

A forecast at 80% accuracy for 1-year horizon is doing the right thing; demanding 95% at the year horizon is asking for false precision.

### Tracking accuracy

```
QUARTERLY VARIANCE REVIEW:
  Pull the forecast made at the start of the quarter
  Compare to the actual
  Compute accuracy %
  Note variance direction (over / under)
  Note major variance drivers

EXAMPLE — Q3 2026 review:
  Forecast (made Jun 1): $165K/mo
  Actual Q3:              $162K/mo
  Difference:             $3K (under by 1.8%)
  Accuracy:               98.2%
  Driver:                 efficiency project landed early; minor
```

### Drivers of inaccuracy

The breakdown across customers:

```
DRIVER                                     SHARE OF VARIANCE
──────────────────────────────────────────────────────────────────
Unplanned events                            ~25%
(launches that weren't in the plan,
incidents, M&A integration timing)
                                            
Optimistic team forecasts                    ~20%
(systematic bias from L2)
                                            
Cost rate changes                             ~15%
(cloud provider price updates,
commitment expiry / renewal)
                                            
Acquired or divested entities                ~10%
(M&A timing affecting baseline)
                                            
Cloud provider rate changes (rare)            ~10%
                                            
Other / cumulative small                      ~20%
```

Naming the driver after each variance event lets the patterns surface over 4-6 quarters.

### Improving accuracy — the calibration loop

```
ANALYSIS:
  Look at the last 6-12 quarters of forecasts
  Identify systematic biases:
    - Are forecasts consistently under or over?
    - Are specific teams consistently over-optimistic?
    - Are specific event categories consistently underestimated?

CORRECTION:
  Apply bias factors to future forecasts:
    Team A: forecasts 12% growth; actuals grow 18%
    → Adjust Team A's forecast by 1.05× (multiply by 1.05)
    
  Apply event categories:
    Marketing campaigns: typically +20% above plan
    → Add 20% to marketing-driven cost projections

VERIFICATION:
  Test the calibration on a holdout: forecast Q3 using
  corrections derived from Q1-Q2 data; check Q3 accuracy
  
ITERATE:
  Recalibrate quarterly as patterns evolve
```

After 3-4 calibration cycles, accuracy typically improves by 3-5 percentage points.

### Reporting accuracy

```
DASHBOARD METRIC: rolling 4-quarter accuracy
  Q1 2026:   92%
  Q2 2026:   96%
  Q3 2026:   98%
  Q4 2026:   94%
  ─────────────
  Rolling avg: 95% — at quarterly target
  
TREND:    stable (within ±2pp); improvement opportunities exist
NEXT review: 2026-04-15
```

### What accuracy means for trust

The accuracy track record determines whether forecasts can be relied on for commitments:

```
HIGH ACCURACY (>95%):
  Forecasts can be used for budget commitments directly
  Leadership trusts the numbers; less buffer needed
  Wider business decisions can rely on the forecast
  
MEDIUM ACCURACY (85-95%):
  Forecasts are guidance; budget commitments include buffer
  Communicate confidence bands prominently
  Leadership reviews the band, not just the point estimate
  
LOW ACCURACY (<85%):
  Forecasts are directional only
  Larger budget buffers required
  Frequent re-forecasting (monthly)
  Focus on improving accuracy before relying on forecasts
```

### Common accuracy traps

```
TRAP                                       AVOID
──────────────────────────────────────────────────────────────────
Cherry-pick best quarters                  Report rolling average,
                                          not selected periods
                                          
Compare forecast date to forecast date     Q1 forecast made in December
                                          should be compared to Q1
                                          actual; not Q1 forecast
                                          made in March (which is
                                          basically a Q1 in-period view)
                                          
Ignore variance direction                  Over-forecasting at 5% is
                                          different from under-forecasting
                                          at 5%; track both directions
                                          
Treat 98% accuracy in Q1 as expected      Recent good quarters may be
forever                                    luck; rolling average smooths
                                          
Conflate variance with anomaly             "Off by 4%" doesn't mean
                                          something was wrong; it means
                                          the forecast was approximate
                                          (as expected)
                                          
Hide low accuracy from leadership          Surface honestly; deserves
                                          improvement plan, not coverup
```

### Variance direction matters

```
OVER-FORECAST (actual < forecast):
  Possibly: optimization landed early
            growth missed expectations
            efficiency gains exceeded plan
  Possibly bad: forecast was inflated to ensure budget headroom
  
UNDER-FORECAST (actual > forecast):
  Possibly: launches generated more cost than planned
            growth exceeded expectations
            hidden costs not anticipated
  Possibly bad: forecast was optimistic to look good
  
Both directions deserve investigation; don't celebrate
under-forecast variance as "we saved money" without
understanding why.
```

### How ZopNight tracks accuracy

ZopNight stores every forecast version with timestamps. The Forecast Accuracy report computes:

```
PER-PERIOD:
  Forecast at start of period vs actual
  Accuracy percentage
  Variance direction
  Top variance drivers (if annotated)
  
PER-TEAM:
  Per-team forecasts vs per-team actuals
  Team-level accuracy trend
  Team-level bias factors (calibration)

DASHBOARD:
  Rolling 4-quarter accuracy
  Trend (improving / stable / declining)
  Drill into specific quarter for driver detail
```

The customer can configure the dashboard to surface accuracy alongside other Operate KPIs.

---

## 2. Demo

A real four-quarter accuracy review:

```
QUARTERLY ACCURACY ANALYSIS (Acme Corp, 2026):

Q1 2026:
  Forecast (made Dec 2025): $155K/mo
  Actual:                    $158K/mo
  Difference:                +$3K (under by 1.9%)
  Accuracy:                  98.1%
  Driver:                    new feature launched 2 weeks earlier than
                            planned; +$3K of incremental cost

Q2 2026:
  Forecast (made Mar 2026): $162K/mo
  Actual:                    $158K/mo
  Difference:                -$4K (over by 2.5%)
  Accuracy:                  97.5%
  Driver:                    Q1 efficiency project sustained into Q2
                            (better than expected sustain rate)

Q3 2026:
  Forecast (made Jun 2026): $170K/mo
  Actual:                    $172K/mo
  Difference:                +$2K (under by 1.2%)
  Accuracy:                  98.8%
  Driver:                    minor — workload mix slight shift

Q4 2026:
  Forecast (made Sep 2026): $178K/mo
  Actual:                    $185K/mo
  Difference:                +$7K (under by 3.9%)
  Accuracy:                  96.1%
  Driver:                    holiday-driven product growth higher than
                            planned; marketing campaign generated more
                            traffic

ANNUAL AVERAGE: 97.6% (above 90% target for quarterly)

INSIGHTS:
  - Forecasts consistently slightly under-forecast (Q1, Q3, Q4)
  - Q2 over-forecast was efficiency-driven (positive surprise)
  - Q4 under-forecast was traffic/marketing-driven
  
CALIBRATION FOR 2027:
  - Add 2-3% bias correction to baseline forecast (consistent under)
  - Add specific buffer for holiday quarters (+5% Q4 specifically)
  - Marketing campaign spend: ask marketing team to forecast
    incremental cost during campaign planning, not after
  - Continue tracking sustain rates of efficiency projects

LEADERSHIP COMMUNICATION:
  "Our forecasts averaged 97.6% accurate in 2026. We're calibrating
   for Q4-style holiday variance going into 2027. Confidence in
   forecasts is high; budget commitments based on forecasts are
   defensible."
```

---

## 3. Hands-on (5 min)

If you have past forecasts, calculate accuracy:

```
PRIOR FORECAST 1:
  Period:            __________
  Forecast amount:   $______
  Actual amount:     $______
  Difference:        $______ (____%)
  Direction:         over / under
  Accuracy:          ____%

PRIOR FORECAST 2:
  Period:            __________
  Forecast amount:   $______
  Actual amount:     $______
  Difference:        $______ (____%)
  Direction:         over / under
  Accuracy:          ____%

ROLLING ACCURACY:    ____%

PATTERNS noticed:
  □ Consistently under
  □ Consistently over
  □ Specific quarters consistently off
  □ Specific teams consistently off

CALIBRATION for next forecast:
  __________________________________________________________

If you don't have past forecasts, start tracking now. The
calibration value compounds over 4+ quarters.
```

---

## 4. Knowledge check

### Q1
Forecast accuracy target for 1-quarter horizon:

A. 50%
B. 90% or better. Lower accuracy makes the forecast unreliable for budget commitments. Above 90% means the forecast is trustworthy enough to act on; below means it should be treated as directional only.
C. 70%
D. 99%

<details>
<summary>Show answer</summary>

**Correct: B.** 90% for quarterly. Higher for shorter horizons; lower for longer.
</details>

### Q2
A team consistently forecasts 12% growth but actual is 18%:

A. Random noise
B. Systematic bias — under-forecasting growth. Apply a bias factor to the team's future forecasts (multiply by 1.05 or similar). Pure noise would be random direction; consistent under-forecasting in one direction is a calibratable bias.
C. Punish the team
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** Correct for bias systematically. The calibration improves with quarters of data.
</details>

### Q3
A 1-year-ahead forecast at 85% accuracy:

A. Bad — should be 95%+
B. Acceptable. Longer horizons have higher uncertainty; 80%+ is target for year-ahead. Demanding 95% at the year horizon is asking for false precision. The honest answer is wider bands and lower expectations at longer horizons.
C. Random
D. Excellent — better than expected

<details>
<summary>Show answer</summary>

**Correct: B.** Year-ahead is harder. 85% is healthy.
</details>

---

## 5. Apply

Track quarterly accuracy in ZopNight's Forecast Accuracy report. Calibrate biases per team and per event category. Communicate accuracy alongside the forecast itself — leadership trust grows with a track record.

---

## Related lessons

- [L1 — Top-down forecasting](L1_top_down.md)
- [L2 — Bottom-up forecasting](L2_bottom_up.md)
- [L3 — Hybrid and reconciliation](L3_hybrid.md)
- [L5 — Communicating uncertainty](L5_uncertainty.md) *(next)*

## Glossary terms touched

[Forecast accuracy](../../../reference/glossary/forecast-accuracy.md) · [Variance direction](../../../reference/glossary/variance-direction.md) · [Bias factor](../../../reference/glossary/bias-factor.md) · [Calibration loop](../../../reference/glossary/calibration-loop.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.6.L4
