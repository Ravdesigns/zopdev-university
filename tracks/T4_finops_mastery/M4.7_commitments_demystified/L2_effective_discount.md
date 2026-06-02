# Effective discount math

§ T4 · M4.7 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** the effective discount of a commitment realistically, **distinguish** published discount from realized discount, **and apply** the break-even formula to decide whether a commitment is worth it.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Predict what a commitment will actually save, not what the vendor calculator claims." |
| **Personas** | FinOps Lead · Finance Partner · Platform Engineer |
| **Prerequisites** | M4.7.L1 — Four commitment instruments |
| **Time** | 9 minutes |
| **Bloom verb** | Calculate (Apply), Distinguish (Analyze), Apply (Apply) |

---

## 1. Concept

The discount published on a commitment ("save up to 40%!") is the **best case**. The actual savings you realize depend on **coverage** and **utilization**. Most teams over-estimate their realized discount; the formula keeps the math honest.

```
EFFECTIVE DISCOUNT = published_discount × coverage × utilization

WHERE:
  published_discount = the headline rate (e.g., 40% for 3-yr RI)
  coverage           = % of eligible hours actually committed
  utilization        = % of committed hours actually used
```

If either coverage or utilization is low, the published discount doesn't translate to your bill.

### Walking through scenarios

```
SCENARIO A — Perfect:
  1-yr RI on m5.large at 40% published discount
  Coverage:    100% (all m5.large hours covered)
  Utilization: 95%  (instance running 95% of the time)
  Effective:   40% × 1.0 × 0.95 = 38%
  
  Nearly the published discount; close to ideal.

SCENARIO B — Imperfect coverage:
  Same 1-yr RI at 40%
  Coverage:    80%  (some m5.large hours go uncovered)
  Utilization: 95%  (committed instances running 95%)
  Effective:   40% × 0.8 × 0.95 = 30.4%
  
  Lost 8 percentage points to incomplete coverage.

SCENARIO C — Imperfect utilization:
  Same 1-yr RI at 40%
  Coverage:    80%
  Utilization: 60%  (instance idle 40% of the time)
  Effective:   40% × 0.8 × 0.6 = 19.2%
  
  Half the headline discount.

SCENARIO D — Bad:
  Coverage:    40%  (committed for less than actual usage)
  Utilization: 50%  (committed instances idle half the time)
  Effective:   40% × 0.4 × 0.5 = 8%
  
  Significantly less than the 40% advertised; might not
  even break even.
```

The publishing-vs-realized gap is what separates "looks like savings" from "actually saves money on the bill."

### Break-even math

Every commitment has a break-even point: below it, you pay more than pure on-demand.

```
BREAK-EVEN COVERAGE FORMULA:
  For a commitment with discount d:
  Required coverage > 1 / (1 + d)
  
EXAMPLES:
  d = 40% → required coverage > 71.4%
  d = 30% → required coverage > 76.9%
  d = 20% → required coverage > 83.3%
  
If your coverage is below the break-even, the commitment LOSES
money vs pure on-demand. You committed for hours you didn't use,
and you paid for them.
```

The break-even is sometimes counter-intuitive. A 40% discount needs only 71% coverage to break even; a 20% discount needs 83% to break even. Bigger discounts have looser break-even thresholds.

### Realistic targets by commitment length

```
COMMITMENT LENGTH    SUGGESTED TARGETS
──────────────────────────────────────────────────────────────────
1-year commit        Coverage target: > 80%
                    Utilization target: > 95%
                    
3-year commit         Coverage target: > 70%
                    Utilization target: > 95%
                    
                    Note: 3-yr has more time for workload to
                    change, so coverage target is looser.
```

If you can't confidently project these levels for the full commitment term, defer the commit or use a shorter term.

### Realistic example

```
WORKLOAD: 100 m5.large instances, 24/7

OPTIONS analysis:
  Option 1 — Pure on-demand:
    100 × $0.096/hr × 24 × 365 = $84,096/year per instance × 100
    Annual cost: $8.41M

  Option 2 — 1-yr RI, all-upfront, 40% published discount:
    If 100% coverage + 95% utilization:
      Effective discount: 40% × 1.0 × 0.95 = 38%
      Cost: $8.41M × (1 - 0.38) = $5.21M
      Savings: $3.20M (38%)
      
    If realistic coverage 90% + utilization 95%:
      Effective discount: 40% × 0.9 × 0.95 = 34.2%
      Cost: $8.41M × (1 - 0.342) = $5.53M
      Savings: $2.88M (34.2%)
      
    Difference between "ideal" and "realistic": $320K/year
    
  Option 3 — 3-yr SP, all-upfront, 30% published discount:
    If 90% coverage + 95% utilization:
      Effective discount: 30% × 0.9 × 0.95 = 25.7%
      Cost: $8.41M × (1 - 0.257) = $6.25M
      Savings: $2.16M (25.7%) per year
      
    Lower discount but more flexible (SP applies to any compute)

DECISION FACTORS:
  Are these 100 instances guaranteed for 3 years? If yes, RI.
  If workload type might change? SP.
  How confident is the 95% utilization? Critical to verify.
```

### How to improve coverage and utilization

```
COVERAGE IMPROVEMENTS:
  - Match RI specs closely to actual usage (don't buy for "projected
    growth"; buy for proven floor)
  - Mix RIs and Savings Plans for flexibility on the edge
  - Buy on the floor, not the peak
  - Re-evaluate quarterly

UTILIZATION IMPROVEMENTS:
  - Don't schedule the committed floor off (defeats the commit)
  - Run committed capacity 24/7
  - Monitor exchange opportunities (AWS lets you exchange RIs)
  - Use unused capacity for low-priority workloads
```

The single biggest improvement lever for most orgs: **don't schedule the committed floor off.** Schedules pause non-committed capacity; committed capacity runs continuously.

### Modeling and tracking tools

```
TOOL                              PURPOSE
──────────────────────────────────────────────────────────────────
AWS Cost Explorer RI/SP            1-yr commitment recommendations
recommendations                    
GCP Commitment planner             3-yr CUD modeling
Azure Reservation calculator       Reservation sizing
ZopNight Commitment Coverage      Track current coverage + utilization
Specialized tools                 Multi-instrument forecasting
(ProsperOps, Spot.io)             (advanced cases)
```

ZopNight provides coverage tracking and utilization monitoring; specialized tools provide forecasting if your portfolio is complex.

### Common discount-math mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Quoting published discount as savings      Apply coverage × utilization
                                          to get realistic number
                                          
Buying for projected growth                Buy for proven floor;
                                          incremental commits for
                                          confirmed growth
                                          
Ignoring utilization                       Track it monthly; alerts on
                                          low utilization
                                          
3-yr commit without 3-yr confidence        Use 1-yr; revisit annually
                                          
Locked into RI when SP would fit          Exchange where possible;
                                          plan migration on renewal
                                          
Scheduling the committed floor off          Schedules don't apply to
                                          committed capacity (the
                                          schedule wastes the commitment)
```

---

## 2. Demo

A real commitment portfolio review:

```
PRODUCTION FLEET commitment status (Acme Corp):

CURRENT STATE:
  100 instances m5.large × 730 hr/mo = 73,000 hours
  Commitment: 60% via Savings Plan at 30% published discount
  Coverage:   60% (60 × 730 = 43,800 hours covered by SP)
  Utilization: 95% (covered hours actually used)
  
  EFFECTIVE DISCOUNT: 30% × 0.6 × 0.95 = 17.1%
  
SAVINGS CURRENT:
  73,000 hours × $0.10/hr × 17.1% = $1,250/month saved
  Annual: $15,000

OPPORTUNITY:
  If coverage rose to 80%:
    30% × 0.8 × 0.95 = 22.8% effective discount
    Annual savings: $20,000 (+$5K vs current)
    
  If coverage rose to 90%:
    30% × 0.9 × 0.95 = 25.7% effective discount
    Annual savings: $22,500 (+$7.5K vs current)

DECISION ANALYSIS:
  Coverage at 80% requires committing to an additional 20 hours
  of m5.large × 730 hours = 14,600 hours of SP commitment.
  If usage shifts off m5.large in 6 months, that commitment
  may be stranded (still applies if SP, but lower coverage).
  
  Confidence in 80% coverage over the next 12 months: HIGH
  (workload has been stable for 6+ months).
  
DECISION:
  Increase SP coverage to 80% next renewal cycle.
  Track utilization; if drops below 90%, re-evaluate.
```

The math turns a vague "should we buy more SP?" into a specific decision.

---

## 3. Hands-on (5 min)

Calculate effective discount for one of your team's commitments:

```
COMMITMENT:    __________ (RI / SP / CUD)
PUBLISHED DISCOUNT:    ____%

COVERAGE: ____% (% of eligible hours actually committed)
  How to find: cloud provider's commitment report

UTILIZATION: ____% (% of committed hours actually used)
  How to find: ZopNight commitment coverage report

EFFECTIVE DISCOUNT:
  ____ % × ____ × ____ = ____%

ANNUAL SAVINGS:
  Total spend on this workload class × Effective % = $______

COMPARED TO publicly quoted savings:
  $______ less than the headline number

IMPROVEMENT OPPORTUNITIES:
  □ Increase coverage (commit more)
  □ Increase utilization (don't schedule covered capacity off)
  □ Exchange to better-fit instrument
  □ Defer renewal if usage likely to change

BREAK-EVEN check:
  Required coverage: 1 / (1 + ____) = ____%
  Current coverage: ____%
  Above break-even? Yes / No
```

If you're below break-even, the commitment is losing money — investigate.

---

## 4. Knowledge check

### Q1
Coverage 80%, utilization 95%, published discount 40%. Effective discount is:

A. 40% (the published rate)
B. 30.4% (40% × 0.8 × 0.95). The formula compounds: every percentage of missed coverage and missed utilization multiplies into the effective discount. Quoting the published rate as savings is fiction; quoting the effective rate is honest.
C. 76%
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 30.4%. The effective discount is the headline times coverage times utilization.
</details>

### Q2
1-year RI at 40% discount. Break-even coverage:

A. 50%
B. 71.4% — calculation: 1 / (1 + 0.40) = 1/1.40 = 71.43%. Below 71.4% coverage, the RI loses money vs pure on-demand. The bigger the discount, the looser the break-even threshold; a 40% discount needs 71.4%, a 20% discount needs 83.3%.
C. 100%
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Break-even formula: 1 / (1 + discount). Memorize this; it's the floor below which you're losing money.
</details>

### Q3
The biggest improvement lever for effective discount:

A. Cloud provider raising the published discount
B. Increasing coverage (commit more of the proven floor) AND increasing utilization (don't schedule covered capacity off). Both compound in the formula. Coverage is usually the bigger lever for under-committed customers; utilization is usually the bigger lever for over-committed customers.
C. Reducing the discount percentage
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Coverage AND utilization. Both are levers; track both monthly.
</details>

---

## 5. Apply

Track coverage and utilization quarterly in [ZopNight's Commitment Coverage report](https://app.zopnight.com/reports/commitments). Re-baseline commitments before renewal; verify break-even is well above the required threshold.

For commitment recommendations, ZopNight's Commitment Optimizer surfaces specific RIs/SPs to buy based on observed usage patterns.

---

## Related lessons

- [L1 — The four commitment instruments](L1_four_levers.md)
- [L3 — Over-commitment is worse than under-commitment](L3_over_commitment.md) *(next)*
- [L4 — Schedule first, commit second](L4_schedule_first.md)
- [L5 — Share-of-savings vs flat-fee vendors](L5_share_of_savings.md)

## Glossary terms touched

[Effective discount](../../../reference/glossary/effective-discount.md) · [Coverage](../../../reference/glossary/coverage.md) · [Utilization](../../../reference/glossary/utilization.md) · [Break-even coverage](../../../reference/glossary/break-even-coverage.md) · [Published vs realized discount](../../../reference/glossary/published-vs-realized.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.7.L2
