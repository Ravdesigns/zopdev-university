# When evidence disagrees with the bill

§ T2 · M2.2 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **reconcile** evidence-based savings against actual post-action billing, **diagnose** the typical reasons for the gap, **and tune** the realism factor to set honest expectations.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Explain to finance why projected savings and actual billed savings differ — and adjust expectations honestly going forward." |
| **Personas** | FinOps Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.1.L4 (pricing model) · M2.2.L1-L3 · T0.M0.4.L1 (rack rate vs billing) |
| **Time** | 9 minutes |
| **Bloom verb** | Reconcile (Analyze), Diagnose (Analyze), Tune (Apply) |

---

## 1. Concept

A recommendation projects savings *before* action. Once the action lands, the actual realized savings appear in billing 1-3 days later. Sometimes the two numbers disagree. Understanding why is part of running CDCR maturely — and managing finance expectations honestly.

```
PROJECTED VS REALIZED:
  
  PROJECTED (from rule):
    Computed from rack rate or current cost
    Best estimate at apply time
    Shown on recommendation card
    
  REALIZED (from billing):
    Actual change in monthly bill
    Available 1-3 days post-action
    Shown in Reports → Savings Trend
    
  GAP = PROJECTED - REALIZED
    Sometimes positive (over-projected)
    Sometimes negative (under-projected)
    Sometimes zero (matches expectations)
```

The gap is the truth-test. Track it; learn from it; tune projections accordingly.

### Typical reasons for disagreement

```
CAUSE                                                  GAP DIRECTION
─────────────────────────────────────────────────────────────────────
Evidence used rack rate; billing has RI discount        Realized < Projected
   applied to the freed capacity elsewhere               (over-projected)

Snapshot/data retention costs persist                    Realized < Projected
   after compute termination

Discount tier changed mid-month                          Various
   (commitment expired or new SP kicked in)

Action happened mid-billing-period —                     Realized < Projected
   prorated savings, not full month

Cloud-side action had side effect                        Realized > or < Projected
   (termination cascaded data deletion)                   (unexpected)

Evidence assumed wrong utilization band                   Various
   (metric was P50, actual workload is bursty)

Add-on services not in projection                          Realized < Projected
   (monitoring agent fees, data transfer, etc.)

Cascading downstream savings                              Realized > Projected
   (terminating cluster also released LB, log groups, etc.)
```

Most gaps are explainable. The ones that aren't = bug to file.

### The reconciliation flow

```
DAY 0: Apply remediation
        Evidence shows projected $X/mo savings
        Action logged in audit trail

DAY 1-3: Billing data lands
          Compare actual billed cost change to projected
          Initial reconciliation report available

DAY 7: Full reconciliation report:
        Projected:  $530/mo (rack rate avoided)
        Realized:   $412/mo (after RI redistribution)
        Gap:        $118/mo (22% lower)
        
        Reason: RI capacity was redistributed to remaining workloads
        The RI bill stayed the same
        Cost savings went into other resources' "effective cost"
        Not into outright termination savings
        
DAY 30+: Adjust org-level "realism factor" if gap is systematic
         Update savings communication to finance
```

The 7-day reconciliation gives full picture; 30-day trend confirms patterns.

### When realized > projected (cascading savings)

```
SCENARIO: Terminated an idle EKS cluster
  Projected savings: $5,200/mo (cluster compute + node group)
  Realized savings: $6,400/mo (+$1,200 over projection)
  
WHY HIGHER:
  Terminating the cluster also released:
    - The Load Balancer attached to it ($25/mo)
    - The CloudWatch log group ($45/mo)
    - The per-cluster Kubernetes control plane fee ($73/mo)
    - The EFS volume attached to a pod ($1,057/mo!)
    
  The rule projected only cluster compute.
  Real cleanup recovered MORE than projection.
  
SIGNAL: cascading cleanup exceeds projection
  Common pattern with EKS clusters, ECS clusters
  Less common with simple resources (EC2, RDS)
```

Cascading savings are a feature, not a bug. The rule's projection focuses on its scope; real cleanup recovers more.

### When realized < projected (the more common gap)

```
SCENARIO: Right-sized RDS db.r5.2xlarge → db.r5.xlarge
  Projected savings: $720/mo (rack rate diff)
  Realized savings: $480/mo (-$240)
  
WHY LOWER:
  RI capacity redistribution:
    The org had 8 db.r5 RIs covering 8 instances
    Right-sized 1 instance; 7 remaining
    The RI commitment didn't change
    Cost saved went into "effective cost of remaining 7"
    Not into outright billing reduction
    
  Snapshot retained: +$30/mo (1-week retention)
  
  Other small gaps: monitoring agent ($10/mo)
  
  Total gap: rack-rate vs billed difference
```

The rack-rate vs billed distinction (T0.M0.4.L1) explains most of these. Rack-rate projection is "what we avoided"; billed savings is "what the invoice shows."

### Mid-month action gap

```
SCENARIO: Applied recommendation on day 14 of the month
  Projected: $500/mo savings
  Realized this month: $230 (~46% of projected)
  
WHY:
  Action applied mid-month (day 14 of 30)
  Resource ran 14 days before termination
  Resource off for 16 days
  Savings = 16/30 × $500 = ~$267 (close to actual $230)
  
NEXT MONTH: should see full $500 realized
NOTE in projection: "First month: prorated"
```

The proration math is straightforward; just remember it when reconciling Month 1.

### The "savings audit" pattern

Mature FinOps practices run a monthly savings audit:

```
SAVINGS AUDIT — May 2026
─────────────────────────────────────────────────────────
Actions applied:           147
Projected total savings:   $42,800/mo
Realized total savings:    $36,200/mo
Realization rate:          84%

BY RULE CATEGORY:
  idle              92% realized
  rightsizing       78% realized   ← lower; investigate
  orphan            96% realized
  schedule          88% realized
  discount          95% realized
─────────────────────────────────────────────────────────

INVESTIGATION on rightsizing 78% realization:
  14 of 23 rightsize actions saw RI redistribution effects
  5 had snapshots that retained on terminated instances
  4 had monitoring agent costs not in the rule's projection
  
ACTION: refine rightsizing projection model to account for these
        Update realism factor for rightsizing category to 0.78
        Communicate to finance: "rightsizing projections are
        approximately 78% of billed savings"
```

The audit produces signal: which rule classes underestimate or overestimate. The realism factor in the savings estimator (T1.M1.3.L6) is tuned from this signal.

### The realism factor — making projections honest

```
REALISM FACTOR per category (default 1.0):
  
  Idle:           0.92 (typical realization rate)
  Rightsizing:    0.78 (RI redistribution effect)
  Orphan:         0.96
  Schedule:       0.88
  Discount:       0.95

APPLICATION:
  Card shows: "Projected $500/mo (estimated $390/mo realized)"
  Or: "Projected $500/mo (your typical realization: 78%)"
  
COMMUNICATION:
  Finance sees both numbers
  Sets expectations correctly
  Trust earned through transparency
  
TUNING:
  Quarterly review
  Adjust based on observed realization
  Customers expect projections; honesty earns long-term trust
```

The realism factor turns projections into realistic forecasts.

### What this means for projections

```
PROJECTIONS ARE BEST ESTIMATES:
  Based on rack rate or current cost
  Don't account for:
    Discount redistribution
    Retained data costs
    Add-on services
    Mid-month proration
  
REALIZED IS TRUTH:
  What the invoice actually shows
  After all the cloud-side accounting
  
TRACK BOTH:
  Set expectations with finance accordingly
  A team promising rack-rate savings but delivering
    billed savings has a credibility problem
  A team promising BOTH numbers transparently has a
    better conversation
  
THE REALITY:
  Realized = 70-90% of projected for most categories
  Outliers (>110% or <60%) deserve investigation
```

The discipline is honesty + tracking. Both compound trust over time.

---

## 2. Demo

A team's reconciliation report walked through:

```
ACTION: Terminated idle RDS db-temp-staging
        (RC-002 equivalent for orphan database)
PROJECTED: $1,420/mo (rack rate of the instance)
APPLIED: 2026-05-15

REALIZED (after 14 days extrapolated to monthly): $1,210/mo
GAP: $210/mo (15% lower than projected)

ROOT-CAUSE ANALYSIS:
  
  Snapshot retained: +$30/mo
    1-week retention before snapshot expires
    Projection didn't account for retention cost
    
  Multi-AZ secondary not fully accounted: +$45/mo
    Multi-AZ adds ~$45/mo for HA replica
    Projection assumed single-AZ baseline
    
  12-day proration of partial month: +$135/mo difference
    Resource ran 15 days; off 15 days
    First-month savings prorated
    
  Other: small fees not in projection ($0/mo material)

LEARNINGS:
  
  PROJECTION REFINEMENTS:
    For future RDS terminations:
      Subtract retained-snapshot costs (use snapshot retention setting)
      Account for Multi-AZ pricing if applicable
      Show prorated first-month savings explicitly
  
  REALISM FACTOR UPDATE:
    Current: 0.92 for RDS terminations
    Observed: 0.85 in this case
    No update yet — single data point; need 5-10 to revise
    Track over next quarter
    
  COMMUNICATION TO FINANCE:
    "RDS termination saved $1,210/mo (vs $1,420 projection)
     The 15% gap is from retained snapshot + Multi-AZ + first-month proration
     Future RDS projections will be more accurate"
```

Two refinements to the projection model. Future RDS recommendations will be more accurate.

---

## 3. Hands-on (5 min)

Reconcile a past action:

```
□ STEP 1: Pick an action from last 30 days
  Action: __________
  Apply date: __________
  Projected savings: $_____/mo

□ STEP 2: Pull billing data
  Reports → Savings Trend OR Cost by Resource
  Compare cost on day BEFORE apply to day AFTER+7

□ STEP 3: Calculate realized savings
  Pre-apply cost: $_____/mo
  Post-apply cost: $_____/mo
  Realized monthly savings: $_____

□ STEP 4: Calculate gap
  Projected:  $_____
  Realized:   $_____
  Gap:        $_____ ( _____%)

□ STEP 5: Identify cause(s)
  □ RI / SP redistribution
  □ Snapshot retention
  □ Add-on services not in projection
  □ Mid-month proration
  □ Cascading savings (positive gap)
  □ Other: __________
```

One reconciliation per month = ongoing calibration of projections.

---

## 4. Knowledge check

### Q1
Projected savings is $500/mo (rack rate). Realized billed delta is $380/mo. Most likely cause:

A. The recommendation was wrong
B. RI / Savings Plan redistribution — the discount was reapplied to remaining workloads. Rack rate overstates what cash savings the bill will show. See T0.M0.4.L1 for the rack-rate-vs-billed distinction. This is the classic explanation.
C. Cloud provider error
D. Billing sync is broken

<details>
<summary>Show answer</summary>

**Correct: B.** Classic RI redistribution effect.
</details>

### Q2
A realized > projected savings outcome usually means:

A. Bug in the rule
B. Cascading cleanup — terminating one resource freed dependent costs (LBs, log groups, attached volumes) not in the rule's projection. Common with EKS/ECS terminations where dependents weren't in projection scope.
C. Random luck
D. Different cloud provider math

<details>
<summary>Show answer</summary>

**Correct: B.** Cascading savings are real and often exceed projections.
</details>

### Q3
A team's monthly realization rate is consistently 70%. Best action:

A. Stop applying recommendations
B. Tune the realism factor in the savings estimator to 0.7 instead of the default 1.0. Communicate to finance: "our typical realization is 70%; projections shown but realized number is the truth." Honest expectations earn trust. See T1.M1.3.L6.
C. Switch FinOps tools
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** The realism factor exists for exactly this. Honest = trust-building.
</details>

---

## 5. Apply

Reports → Savings Trend shows realized vs projected after actions. Monthly reconciliation report can be requested from your account team or built via API.

For your team: monthly reconciliation cadence; quarterly realism-factor update; honest communication to finance.

---

## Module quiz

Complete M2.2 → 10-question module quiz unlocks the **Evidence-Reader** chip.

---

## Related lessons

- [L1 — Metrics drawer](L1_metrics_drawer.md)
- [L2 — Activity tab](L2_activity_tab.md)
- [L3 — Pricing gap + DLQ](L3_pricing_gap_dlq.md)
- [T0.M0.4.L1 — Rack rate vs billing](../../T0_foundations/M0.4_rack_rate_vs_billing/L1_rack_rate.md)
- [T1.M1.3.L6 — Realism factor in savings estimator](../../T1_zopnight_operator/M1.3_first_schedule/L6_savings_estimator.md)

## Glossary terms touched

[Realization rate](../../../reference/glossary/realization-rate.md) · [Cascading savings](../../../reference/glossary/cascading-savings.md) · [Realism factor](../../../reference/glossary/realism-factor.md) · [Reconciliation](../../../reference/glossary/reconciliation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.2.L4
