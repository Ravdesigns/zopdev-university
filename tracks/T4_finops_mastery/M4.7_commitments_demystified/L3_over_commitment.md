# Over-commitment patterns

§ T4 · M4.7 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the five common over-commitment patterns, **diagnose** them in your own portfolio, **and remediate** stranded commitments via exchange or sell-on.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Avoid the five mistakes that turn a 'savings' commitment into a stranded cost." |
| **Personas** | FinOps Lead · Platform Engineer · Finance Partner |
| **Prerequisites** | M4.7.L1 (four instruments) · M4.7.L2 (effective discount math) |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Remember), Diagnose (Analyze), Remediate (Apply) |

---

## 1. Concept

Over-commitment means paying for committed capacity that isn't actually being used. The published discount calculation looks great; the bill is worse than on-demand would have been. Five patterns recur:

```
1. NON-PROD COMMITMENT       The classic — RIs on resources that
                              should be scheduled off
                              
2. PEAK-BASED COMMITMENT      Committing on peak hours rather than
                              the floor
                              
3. ARCHITECTURAL MISMATCH     Commitment doesn't match the workload
                              after migration
                              
4. RI HOARDING                Buying ahead of projected growth that
                              didn't materialize
                              
5. EARLY COMMITMENT           Committing before workload patterns
                              are clear
```

Each pattern has a specific diagnosis and remediation. Recognizing them prevents repeat mistakes.

### Pattern 1: Non-prod commitment (the classic)

```
SCENARIO:    Bought RIs for dev/test environments
PROBLEM:     Dev/test should be scheduled off; RI assumes 24/7
RESULT:      Paying for committed hours when resources are off

EXAMPLE:
  $100K of RIs on dev/test resources
  Schedule reduces hours by 65%
  Effective utilization: ~35%
  Effective discount: 40% × 0.35 = 14%
  vs pure on-demand with schedule: 65% savings (vs paying 14% commit)
  
LESSON: schedule first, commit only on the proven floor.
```

This is the textbook over-commitment trap. Most orgs catch it within 6 months of buying.

### Pattern 2: Peak-based commitment

```
SCENARIO:    Bought RIs for the workload's peak capacity
PROBLEM:     Peak is intermittent; commitment runs 24/7

EXAMPLE:
  Workload peak: 100 instances during Black Friday
  Workload typical: 30 instances
  Commitment: 100 instances
  
  Effective utilization: ~37.5% (peak only 1/8 of hours)
  Effective discount: 30% × 0.375 = 11.25%

LESSON: commit on the typical floor; on-demand for peak.
```

The instinct is to "be ready for peak." The math is to "be ready for peak via on-demand burst, commit on the floor."

### Pattern 3: Architectural mismatch

```
SCENARIO:    Bought m5.large RIs; workload migrated to t3.large
PROBLEM:     Different family; original RIs don't apply

EXAMPLE:
  $50K of m5.large RIs purchased Q1
  Migration to t3.large (lower memory needed) in Q2
  m5.large RI utilization: 0%
  t3.large: 100% on-demand
  
  Net: paying both RI cost AND on-demand cost
  
LESSON: plan workload migrations BEFORE committing.
```

This is the worst pattern because the failure is total. The RI provides zero value while still costing the full commit amount.

### Pattern 4: RI hoarding

```
SCENARIO:    Bought RIs in anticipation of growth
PROBLEM:     Growth didn't materialize at the projected scale

EXAMPLE:
  Committed: 50 m5.large for next year (anticipating 2× growth)
  Actual growth: 25 m5.large (50% of projection)
  Utilization: 50%
  Effective discount: 30% × 0.5 = 15%

LESSON: conservative commits with ability to add later beats over-buying.
```

The asymmetry: adding commitment when growth materializes is easy; removing committed but unused capacity is hard.

### Pattern 5: Early commitment

```
SCENARIO:    New workload at month 1; committed at year 1
PROBLEM:     Workload patterns not stable yet

EXAMPLE:
  New product launches; team commits to 50 instances for 1 year
  By month 3: workload re-architected; needs 80% less compute
  RI utilization: 20%
  Wasted spend: $40K for the year
  
LESSON: wait 60-90 days post-launch before committing.
```

The fix is to **observe before committing**. New workloads have unstable patterns; let them settle before locking in commitments.

### Diagnostic checklist

Run through this for your current portfolio:

```
PORTFOLIO HEALTH CHECK:
  □ Any commitments on dev/test/sandbox? → Pattern 1 risk
  □ Any commitments above the steady floor? → Pattern 2 risk
  □ Any commitments on workloads scheduled to migrate? → Pattern 3 risk
  □ Any commitments larger than current usage? → Pattern 4 risk
  □ Any commitments on workloads <90 days old? → Pattern 5 risk
  
  Effective discount per commitment (calculated):
    Commitment A: ____% (target 25%+; flag if below)
    Commitment B: ____%
    Commitment C: ____%
  
  Any below break-even (1 / (1 + d))?
    Yes → losing money vs on-demand; remediate immediately
```

### Detection in ZopNight

ZopNight surfaces under-utilization in:

```
SURFACE                          FINDS
──────────────────────────────────────────────────────────────────
Reports → Cost Flow                Current portfolio mix
→ Purchase Type layout              with utilization percentage
                                   per instrument
                                   
Recommendations engine             Flags under-utilized
(RC-* commitment-related)          commitments with suggested
                                   actions (exchange / let expire /
                                   re-allocate)
                                   
Commitment Coverage report          Coverage + utilization per
                                   instrument type over time
```

Quarterly review catches drift; immediate review when patterns are suspected.

### Remediation options

```
OPTION                            APPLIES WHEN
──────────────────────────────────────────────────────────────────
Exchange (AWS allows for RIs)      Architectural mismatch; can swap
                                   to current instance type
                                   
Sell on RI marketplace             Stranded RI; cloud allows resale
                                   (small loss vs ROI of unused commit)
                                   
Accept the loss + replan            Final option; document lesson
                                   for next cycle
                                   
Increase coverage on the floor      Under-coverage; commit more to
                                   raise effective discount
                                   
Decrease coverage (let expire)      Over-coverage; let unused commits
                                   expire; rebuy at appropriate level
                                   
Convert RI to SP (AWS)             More flexibility for future
                                   workload changes
```

### Common remediation mistakes

```
DOUBLING DOWN on a failing commitment       Don't buy more to "make up"
                                            the loss; sunk-cost trap
                                            
IGNORING the marketplace                    For AWS RIs, the marketplace
                                            recovers some value
                                            
NOT DOCUMENTING the lesson                  Without documentation, the
                                            same mistake happens next
                                            commitment cycle
                                            
WAITING for renewal to remediate            Some remediations work
                                            mid-term (exchange, sell);
                                            don't wait the full term
                                            for an obvious mistake
```

---

## 2. Demo

A real over-commitment discovery + remediation:

```
TEAM finds over-commitment via quarterly review:

DISCOVERY:
  Reports → Purchase Type shows m5.large RIs at 35% utilization
  Effective discount: 40% × 0.35 = 14%
  Break-even check: 1 / (1 + 0.40) = 71.4% required coverage
  Current: 35% → losing money vs on-demand
  
INVESTIGATION:
  Workload migrated to m6i.large in March (improved performance)
  m5.large RIs no longer match the workload (Pattern 3)
  
OPTIONS evaluated:
  1. Exchange RIs (AWS allows m5 → m6i exchange)
     Pros: full value recovery
     Cons: requires AWS API call + reconciliation
  2. Sell on RI marketplace
     Pros: simpler
     Cons: typically 10-20% value loss on resale
  3. Accept and replan
     Pros: simplest
     Cons: ~$30K of stranded spend
     
DECISION: Exchange via AWS
EXECUTION: completed in 2 weeks; new RIs match m6i.large workload
  
NEW STATE:
  Coverage: 90%, Utilization: 95%
  Effective discount: 40% × 0.9 × 0.95 = 34.2%
  Savings recovered: ~$25K/year

LESSON CAPTURED:
  Added a workload-migration check to the commitment-purchase runbook
  Quarterly review now flags "instance type evolved within term"
  Documented in postmortem retrospective
```

15 minutes of investigation, 2 weeks to execute the exchange, $25K of annual savings recovered.

---

## 3. Hands-on (5 min)

Audit your team's commitment portfolio:

```
CURRENT COMMITMENTS:
  Commitment A: __________ (type, term, target)
    Coverage: ____%   Utilization: ____%
    Effective: ____% (= discount × coverage × utilization)
    Pattern risk (1-5): __________
    
  Commitment B: __________
    Coverage: ____%   Utilization: ____%
    Effective: ____%
    Pattern risk: __________

ANY COMMITMENTS below break-even?
  Yes / No / Don't know
  
TOP-RISK pattern:
  □ Pattern 1: Non-prod commitment
  □ Pattern 2: Peak-based
  □ Pattern 3: Architectural mismatch
  □ Pattern 4: RI hoarding
  □ Pattern 5: Early commitment

REMEDIATION plan for highest-risk commitment:
  □ Exchange (if AWS)
  □ Sell on marketplace
  □ Let expire and rebuy
  □ Accept loss; document lesson
  
QUARTERLY REVIEW scheduled? Yes / No
  If no, schedule now.
```

If you don't have effective-discount numbers per commitment, that's the first thing to fix — without them, you're operating blind.

---

## 4. Knowledge check

### Q1
The most common over-commitment pattern:

A. Architectural mismatch
B. Non-prod commitment. Buying RIs/CUDs for resources that should be scheduled off creates mathematically guaranteed under-utilization. Scheduled-off + committed = paying committed rate for hours the resource isn't running.
C. Random
D. Early commitment

<details>
<summary>Show answer</summary>

**Correct: B.** Non-prod is the classic trap. Schedule first; commit on the proven floor.
</details>

### Q2
Peak-based commitment for a workload with intermittent spikes:

A. Optimal — covers the worst case
B. Wasteful. Most hours are below peak; commitment runs 24/7 but utilization is intermittent. Better: commit on the floor (steady demand); use on-demand for peak. The peak rarely justifies committed capacity.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Floor-based commitment + on-demand peak is the right pattern.
</details>

### Q3
Architectural mismatch from workload migration:

A. Unavoidable
B. Avoidable. Plan workload migrations BEFORE committing. If migrations are planned within the term, defer commitment or commit shorter (1-yr vs 3-yr). For mismatches that already happened: exchange (AWS allows), sell on marketplace, or accept and replan.
C. Random
D. Cloud provider's fault

<details>
<summary>Show answer</summary>

**Correct: B.** Plan ahead. The pattern is avoidable with disciplined commitment review.
</details>

---

## 5. Apply

Quarterly commitment audit. Annual portfolio retrospective. Track each commitment's effective discount over time; remediate when below 80% of published.

ZopNight's [Reports → Cost Flow → Purchase Type](https://app.zopnight.com/reports/cost-flow) surfaces current coverage + utilization per instrument.

---

## Related lessons

- [L1 — Four commitment instruments](L1_four_levers.md)
- [L2 — Effective discount math](L2_effective_discount.md)
- [L4 — Schedule first, commit second](L4_schedule_first.md) *(next)*
- [L5 — Share-of-savings vendors](L5_share_of_savings.md)

## Glossary terms touched

[Over-commitment](../../../reference/glossary/over-commitment.md) · [RI exchange](../../../reference/glossary/ri-exchange.md) · [RI marketplace](../../../reference/glossary/ri-marketplace.md) · [Stranded commitment](../../../reference/glossary/stranded-commitment.md) · [Sunk-cost trap](../../../reference/glossary/sunk-cost-trap.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.7.L3
