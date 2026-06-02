# RI vs SP vs CUD vs Spot — the four levers

§ T4 · M4.7 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** the four commitment instruments (RI, SP, CUD, Spot), **match** workloads to the instrument that fits, **and avoid** the classic mistake of putting stateful workloads on Spot.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the right commitment instrument for each workload class instead of one-size-fits-all RI purchasing." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader |
| **Prerequisites** | T0 — Foundations (rack rate vs billing) · M4.1 — Maturity |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Match (Apply), Avoid (Evaluate) |

---

## 1. Concept

The major clouds offer four commitment-style instruments that trade flexibility for discount. Knowing which fits which workload is the foundation of commitment portfolio strategy.

```
INSTRUMENT      PROVIDER       SCOPE                       MAX DISCOUNT
──────────────────────────────────────────────────────────────────────
Reserved Inst   AWS             Specific instance family    ~40% (3-yr no-up)
                Azure (similar) Specific SKU                ~38% (3-yr no-up)
                                
Savings Plan    AWS             $/hour spend commitment     ~30% (3-yr no-up)
                                across compute platform
                                
CUD             GCP             Specific machine type       ~57% (3-yr resource)
                                                            ~20% (1-yr flexible)
                                
Spot            All three       Stateless workloads;        50-90% (no commit)
                                interruptible
```

The discounts above are best-case (3-year no-up-front for committed instruments; typical spot pricing for Spot). Real-world discount depends on customer's usage profile and commitment terms.

### Selection criteria

The right instrument depends on the workload, not on what "everyone uses":

```
WORKLOAD PROFILE                          BEST INSTRUMENT
──────────────────────────────────────────────────────────────────
Steady 24/7 production with known          RI (AWS/Azure) or
instance family                            CUD (GCP) for the floor
                                          
Mixed compute usage; instance types         Savings Plan (most flexible)
will change over time
                                          
Specific family, stable usage,             Reserved Instance
no migrations planned                      (cheapest for known stable)
                                          
Stateless batch / dev work                  Spot
                                          
Burst-mode, unpredictable                   On-demand
(don't commit to unpredictable)
                                          
Multi-year predictable                      3-year commit (largest discount)

1-year predictable                          1-year commit (moderate discount)

Brand-new workload (no history)             On-demand for 1-2 quarters,
                                          then commit once profile is known
```

### Savings Plan vs Reserved Instance — the AWS choice

Both are AWS instruments and the distinction matters:

```
RESERVED INSTANCE (RI):
  Commits to a SPECIFIC instance type, AZ, and OS
  Locked: if you change instance type, the RI doesn't apply
  Pros: slightly cheaper for very stable known workloads (~5% more)
  Cons: rigid; doesn't adapt to instance type changes

SAVINGS PLAN (SP):
  Commits to $/hour SPEND across the compute platform
  Applies to any EC2, Fargate, or Lambda usage
  Pros: flexible; moves with workload type changes
  Cons: slightly less discount than RI (~5%)

FOR MOST TEAMS, SP IS THE BETTER DEFAULT:
  Workload types evolve over time
  The 5% extra savings from RI rarely justifies the rigidity
  Engineering changes to instance types shouldn't break the commit
```

A common starting position: 70-80% of the commitment portfolio in SP, 20-30% in RI for specific high-confidence stable workloads.

### Spot — the asterisk

Spot is dramatically cheaper but comes with eviction risk:

```
SPOT ADVANTAGES:
  Cheapest possible compute (often 70-90% below on-demand)
  No commitment required
  Cancellation-free
  
SPOT TRADE-OFFS:
  Cloud can reclaim instance with short notice (2 min on AWS)
  Cannot be used for: 
    - Databases (single-replica or stateful)
    - Single-replica services
    - Latency-sensitive synchronous workloads
    - Long-running stateful jobs that can't checkpoint
    
  Best for:
    - Batch jobs (especially stateless or checkpoint-tolerant)
    - K8s nodes with workloads that tolerate eviction
    - Stateless services with rolling updates
    - CI/CD runners
    - Data pipelines with retry logic
```

Spot is the right answer for batch and stateless workloads. The wrong answer for stateful or latency-critical. Misusing Spot creates incident exposure that the savings don't justify.

### The blended portfolio

Most mature orgs end up with a blend across all four:

```
TYPICAL PORTFOLIO MIX (mature org):
  
  On-demand:    15-25% (unpredictable bursts + new workloads)
  Reserved:     10-20% (stable family-specific)
  Savings Plan: 35-45% (most workloads)
  Spot:          15-25% (batch / stateless)
  
  Net effective discount vs all-on-demand: 25-40%
```

The mix is per-workload, not org-wide. Production has different commitment needs than dev/test.

### Common matching mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
RI for unpredictable workload              SP (more flexible) or
                                          on-demand (no commit)
                                          
SP for very stable known workload          RI (slightly cheaper)
                                          
Spot for stateful workload                 On-demand or RI;
                                          eviction would cause incident
                                          
On-demand for known steady production      Commit (SP or RI);
                                          paying 30% premium for
                                          flexibility you don't need
                                          
3-year commitment on brand-new workload    Wait 1-2 quarters; observe;
                                          then commit
                                          
RI for every team's workload                Build the portfolio mix
"to be safe"                               based on actual profiles
```

### How ZopNight surfaces the mix

ZopNight's Cost Flow by Purchase Type layout (M3.8.L2) shows the current portfolio mix. The Commitment Optimizer module (covered in subsequent lessons) recommends specific RIs, SPs, or CUDs based on observed usage patterns.

For each recommendation, ZopNight shows:
- Estimated annual savings
- Break-even point (when commitment pays for itself)
- Workload that justifies the commit
- Confidence level (high if 6+ months of stable usage)

### When to defer commitment purchasing

```
SCENARIO                                  WAIT
──────────────────────────────────────────────────────────────────
New workload (<3 months history)            Yes — observe first
Major architectural change planned          Yes — let it settle
Org migration in progress                   Yes — instance types
                                          will change
                                          
Crawl-stage maturity                        Yes — get tagging,
                                          scheduling first
                                          
Cloud provider EDP renegotiation coming     Possibly — commit terms
                                          may shift
```

Commitment is a multi-year decision. The cost of waiting one quarter is much smaller than the cost of committing to a bad portfolio.

---

## 2. Demo

A mid-size customer's commitment decisions across three workloads:

```
WORKLOAD 1: production order-processor
  Profile: 24/7, ~6 instances steady floor, ~10 instances peak
  History: 12 months stable on m5.xlarge
  
  DECISION:
    Floor (6 instances): 1-yr Savings Plan at ~25% discount
    Peak above floor (4 instances): on-demand or Spot
    (Spot tolerable here — stateless web tier with retries)
  
  RATIONALE:
    SP for known floor (rigid commit would be RI; SP for flex)
    Spot for burst (stateless; eviction-tolerant)
    Net effective discount: ~30%

WORKLOAD 2: nightly ETL pipeline
  Profile: 4 hours/night, batch, stateless, restartable
  History: 8 months consistent timing
  
  DECISION: Spot (entirely)
  RATIONALE:
    Maximum cost benefit
    Eviction-tolerant by design
    Batch nature fits — restart logic exists
    Net effective discount: 70-85%

WORKLOAD 3: production database (single instance, primary)
  Profile: 24/7, no spot tolerable, m5.2xlarge stable
  History: 18 months
  
  DECISION: 3-year Reserved Instance on m5.2xlarge
  RATIONALE:
    Never Spot (stateful, would cause incident)
    Very stable workload, no plans to change family
    3-year RI captures maximum discount
    Net effective discount: ~38%

PORTFOLIO TOTALS:
  Workload 1: ~30% effective discount on $80K/mo
  Workload 2: ~80% effective discount on $20K/mo
  Workload 3: ~38% effective discount on $25K/mo
  
  Across all three: ~$54K/mo saved vs all on-demand
  Annual: ~$650K saved
```

The right instrument per workload, not one-size-fits-all.

---

## 3. Hands-on (5 min)

For your team's three biggest workloads:

```
WORKLOAD 1: __________
  Profile (steady / burst / batch / stateful):    __________
  History stability:    months ____
  Best instrument:    __________
  Justification:    __________

WORKLOAD 2: __________
  Profile:    __________
  History:    __________
  Best instrument:    __________
  Justification:    __________

WORKLOAD 3: __________
  Profile:    __________
  History:    __________
  Best instrument:    __________
  Justification:    __________

CURRENT COMMITMENT MIX (your org):
  On-demand:    ____% 
  Reserved:     ____%
  Savings Plan: ____%
  Spot:         ____%

GAPS noticed:
  □ Stable workloads on on-demand (commit candidates)
  □ Stateful workloads on Spot (move to on-demand)
  □ Batch/stateless on on-demand (move to Spot)
  □ Single huge RI portfolio (consider SP for flexibility)
```

---

## 4. Knowledge check

### Q1
A workload that is 24/7, stateless web tier with traffic spikes. The best commitment mix:

A. RI for everything
B. Savings Plan for the steady floor + Spot for the burst capacity (stateless tolerates eviction; can restart). The floor is predictable, the burst isn't. SP captures the floor discount; Spot captures the burst discount.
C. Spot for everything
D. On-demand for everything

<details>
<summary>Show answer</summary>

**Correct: B.** SP for floor + Spot for burst. Mixed instruments for mixed workload shapes.
</details>

### Q2
A production database. Spot is:

A. Optimal — cheapest compute
B. Inappropriate. Spot can evict the instance with short notice; databases need persistent compute. Production stateful workloads must use on-demand or RI. The cost of an unexpected database eviction far exceeds the Spot savings.
C. Acceptable with retry logic
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Spot for stateless; not for stateful. Spot mismatch creates incident exposure.
</details>

### Q3
For an org standardizing commitments, SP vs RI:

A. RI always — bigger discount
B. SP for most workloads (more flexible — moves with instance type changes; only ~5% less discount than RI). RI when usage is very stable per-family and no migrations are planned. The ~5% extra discount from RI rarely justifies the rigidity.
C. Both the same
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** SP for flexibility. RI for known-stable per-family.
</details>

---

## 5. Apply

Use [Reports → Cost Flow → Purchase Type layout](https://app.zopnight.com/reports/cost-flow) to see your current portfolio mix. The Commitment Optimizer recommends specific instruments based on observed usage profiles. Apply selectively; defer for new workloads.

---

## Related lessons

- [L2 — Effective discount math](L2_effective_discount.md) *(next)*
- [L3 — Over-commitment is worse than under-commitment](L3_over_commitment.md)
- [L4 — Schedule first, commit second](L4_schedule_first.md)
- [L5 — Share-of-savings vs flat-fee vendors](L5_share_of_savings.md)
- [T3.M3.8.L2 — Cost flow by purchase type](../../T3_zopnight_architect/M3.8_cost_flow/L2_layouts.md)

## Glossary terms touched

[Reserved Instance](../../../reference/glossary/reserved-instance.md) · [Savings Plan](../../../reference/glossary/savings-plan.md) · [CUD](../../../reference/glossary/cud.md) · [Spot instance](../../../reference/glossary/spot-instance.md) · [Commitment portfolio](../../../reference/glossary/commitment-portfolio.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.7.L1
