# Provisioned throughput optimization

§ T2 · M2.11 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** between on-demand and provisioned throughput, **right-size** provisioned capacity, **and schedule** provisioned throughput for time-aware optimization.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the right Bedrock pricing mode (on-demand vs provisioned) and right-size provisioned capacity for actual usage." |
| **Personas** | ML Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.11.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Right-size (Apply), Schedule (Apply) |

---

## 1. Concept

Bedrock offers two pricing modes:

```
ON-DEMAND:
  Pay per token (no commitment)
  Variable cost
  No upfront commitment
  
PROVISIONED THROUGHPUT:
  Pay per hour for guaranteed throughput
  Commit 1 or 6 months
  Up to 50% off effective per-token rate
  
THE CHOICE: depends on workload's pattern + maturity
```

The two modes trade flexibility for cost. Provisioned wins when usage is predictable.

### When provisioned wins

```
SCENARIO                          PROVISIONED OR ON-DEMAND?
─────────────────────────────────────────────────────────────
Predictable high-volume           PROVISIONED (1-month or 6-month)
Variable low-volume               On-demand
Burst-mode                         On-demand
Always-on, steady throughput       PROVISIONED
New workload, unknown load         On-demand (until known)
Mature workload, stable pattern    PROVISIONED
Long-term commitment OK            PROVISIONED 6-month (best discount)
Variable traffic                   On-demand
```

The break-even point: roughly 70% utilization of provisioned throughput.

### Right-sizing provisioned throughput

```
MEASUREMENT (the workload's actual usage):
  Average tokens/sec: 2,400
  Peak tokens/sec: 9,800
  Sustained periods at peak: 5% of time
  
PROVISIONED OPTIONS:

  Option A: Provision for peak (10K tokens/sec)
    Capacity: 24/7
    Cost: $X (highest baseline)
    Utilization: 24% (mostly idle)
    Performance: never throttled
    
  Option B: Provision for average (2,400 tokens/sec)
    Falls back to on-demand for bursts
    Cost: ~30% of Option A
    Utilization: ~80%
    Bursts: occasional on-demand cost
    Total cost: typically 35% of Option A
    
  Option C: Provision at peak × 0.7 (7K tokens/sec)
    On-demand for the burst above
    Cost: ~50% of Option A
    Utilization: ~65%
    Better burst handling than Option B
    
  Option D: Schedule-aware provisioned
    Provisioned during business hours
    On-demand off-hours
    Cost: ~40% of Option A
    Maintains peak handling
```

Option B usually wins for variable-load workloads. Option D handles diurnal patterns.

### Detecting over-provisioning

```
SIGNAL                                    INTERPRETATION
─────────────────────────────────────────────────────────────────
Utilization < 30% sustained               Over-provisioned (RC-1601)
                                          Reduce throughput OR switch to on-demand
                                          
Utilization > 95% sustained                Under-provisioned
                                          Consider increase to avoid throttling
                                          
Periodic peak hits ceiling                  Provisioned for average; OK
                                          On-demand handles peaks (if configured)
                                          
Periodic drop to near-zero                  Idle periods
                                          Consider scheduling
                                          
Spiky utilization                          On-demand might be more cost-effective
                                          Variable patterns don't suit provisioned
```

The 30% threshold catches most over-provisioning. The 95% catches under-provisioning.

### Idle period scheduling

```
PROVISIONED THROUGHPUT is per-hour
If a workload is genuinely idle overnight or weekends:

  PROVISIONED 24/7: paying for 168 hours/week
  PROVISIONED schedule-aware:
    ZopNight schedules the provisioned capacity off overnight + weekends
    Cost saving:
      Non-prod: 60-80% (long idle windows)
      Prod: 30-40% (shorter idle windows)
      
ZOPNIGHT'S AUTOSCALER-STYLE SCHEDULING on Bedrock provisioned throughput:
  Acts like other scheduling
  Cron-driven start/stop
  Audit log; lifecycle management
  Same patterns as M5.2 schedules
```

The schedule pattern extends to Bedrock provisioned throughput.

### Commitment math

```
1-MONTH PROVISIONED:
  Discount: ~20-30%
  Break-even: ~70% utilization
  Commitment: 30 days
  Risk: medium-low
  
6-MONTH PROVISIONED:
  Discount: ~40-50%
  Break-even: ~50% utilization (lower because longer commit)
  Commitment: 180 days
  Risk: medium (workload pattern must hold)
  
ANNUAL PROVISIONED (if available):
  Discount: ~50-60%
  Break-even: ~40% utilization
  Commitment: 365 days
  Risk: higher (workload assumptions over long horizon)
```

For mature workloads with stable patterns, 6-month wins on discount.

### Hybrid pattern — provisioned + on-demand

```
THE BEST PATTERN for most workloads:
  
  Provisioned: base load (e.g., 70% of peak)
  On-demand: bursts above provisioned capacity
  
EXAMPLE:
  Workload peaks 10K tokens/sec; sustains 4K
  
  Provision 7K tokens/sec
  Cost: provisioned hourly rate
  
  Burst above 7K: on-demand
  Pay for the burst tokens
  Most days: minimal on-demand cost
  
TOTAL COST: significantly lower than provisioning for peak
PERFORMANCE: handles peaks without throttling
```

The hybrid pattern is the standard for variable-but-predictable workloads.

### Decision framework

```
QUESTIONS TO ANSWER for any Bedrock workload:

  1. Is the workload mature? (running stable >3 months)
     Yes → consider provisioned
     No → stay on-demand
     
  2. Is utilization predictable?
     Yes → provisioned at average + on-demand for bursts
     No → on-demand
     
  3. Does it have idle periods (overnight/weekend)?
     Yes → schedule the provisioned capacity
     No → provisioned 24/7
     
  4. Can you commit 6 months?
     Yes → 6-month for best discount
     No → 1-month or on-demand
     
  5. Is current cost a concern?
     Yes → optimize aggressively (right-size + schedule)
     No → accept current pattern
```

The framework guides the decision per workload.

---

## 2. Demo

A team's provisioned throughput optimization:

```
WORKLOAD: customer support chatbot
  Mature pattern over 6 months
  Average: 4,000 tokens/sec
  Peak: 7,500 tokens/sec
  Distribution: 95% of time within 2.5x of average
  Off-hours: significant drop in volume (but not zero)

OPTION A (CURRENT): on-demand
  Cost: ~$28,000/month
  Predictable; variable; no commitment

OPTION B: provisioned at 4,500 tokens/sec; on-demand for bursts
  Cost: ~$15,000/month provisioned + ~$2,000/month on-demand bursts
  Total: $17,000/month
  Savings: ~$11,000/month (39%)

OPTION C: SCHEDULE PROVISIONED off overnight
  Provisioned 80 hours/week (during peak hours)
  On-demand for off-hours
  Total: ~$11,000/month
  Savings: ~$17,000/month (60%)

OPTION D: 6-month commitment for Option C
  Additional discount on provisioned hours
  Total: ~$8,500/month
  Savings: ~$19,500/month (70%)

DECISION: Option D for the year-long mature workload pattern

IMPLEMENTATION (4 weeks):
  Week 1: validate utilization measurements
  Week 2: configure provisioned throughput at 4,500 tokens/sec
  Week 3: configure schedule for peak hours
  Week 4: monitor + validate cost projections

OUTCOMES (1 month in):
  Actual cost: $8,700/mo (within 2% of projection)
  Quality: unchanged
  Performance: peaks handled by on-demand burst
  Engineer satisfaction: high
```

Scheduled provisioned + on-demand for bursts is often the optimal pattern for mature workloads.

---

## 3. Hands-on (5 min)

Optimize your provisioned throughput:

```
□ STEP 1: Inventory provisioned throughput
  Workload: __________
  Current capacity: _____ tokens/sec
  Current cost: $_____/mo

□ STEP 2: Measure actual usage
  Average: _____ tokens/sec
  Peak: _____ tokens/sec
  Utilization: ____%

□ STEP 3: Right-sizing options
  Reduce to average + on-demand bursts: $_____/mo
  Schedule off-hours: $_____/mo
  Commit 6-month: $_____/mo

□ STEP 4: Pick best option
  Recommended: __________
  Projected savings: $_____/mo

□ STEP 5: Plan
  Implementation effort: ___ weeks
  Risk: __________
  Monitoring plan: __________
```

A 15-minute optimization exercise per workload.

---

## 4. Knowledge check

### Q1
A workload has 25% sustained utilization on its provisioned throughput. The decision:

A. Increase throughput
B. Investigate over-provisioning — reduce throughput or switch to on-demand. RC-1601 likely surfaced this. 25% utilization is well below the 70% break-even; over-provisioned.
C. Random
D. Keep as is

<details>
<summary>Show answer</summary>

**Correct: B.** Over-provisioning at 25% utilization.
</details>

### Q2
Provisioned throughput discount vs on-demand:

A. Same price
B. ~20-50% discount depending on commit length. 1-month: 20-30%; 6-month: 40-50%. Break-even at 50-70% utilization. Trade flexibility for cost.
C. 90% discount
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 20-50% discount, utilization-dependent break-even.
</details>

### Q3
A mature workload with predictable peak hours and idle off-hours:

A. Provisioned 24/7
B. Provisioned during peak hours, scheduled off overnight. Hybrid pattern reduces cost significantly. Combines: lower base capacity + schedule discipline + on-demand fallback for bursts.
C. On-demand always
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule-aware provisioned.
</details>

---

## 5. Apply

RC-1601/02 surfaces provisioned throughput optimization. Customer adjusts in Bedrock console.

For your team: right-size provisioned throughput; schedule for idle periods; commit 6-month for mature workloads.

---

## Module quiz

Complete M2.11 → 10-question module quiz unlocks the **ML-Cost-Aware** chip.

---

## Track 2 complete

You have now completed all 54 lessons of T2 — ZopNight Engineer track. Take the **Engineer cert exam** at /certifications/engineer.

You should now be able to:
- Read + apply the 490-rule library (M2.1)
- Read evidence + reconcile against billing (M2.2)
- Configure auto-remediation safely (M2.3)
- Manage VM autoscaling (M2.4)
- Adopt-or-replace cloud scaling (M2.5)
- Schedule K8s workloads (M2.6)
- Schedule Databricks (M2.7)
- Use auto-tagger predictions (M2.8)
- Pre-scale for events (M2.9)
- Investigate cost anomalies (M2.10)
- Optimize Bedrock + ML costs (M2.11)

---

## Related lessons

- [L1 — ML cost landscape](L1_ml_landscape.md)
- [L2 — Bedrock rules](L2_bedrock_rules.md)
- [L3 — Model selection](L3_model_selection.md)
- [L4 — Batch processing](L4_batch_processing.md)
- [T6 — AI-powered cloud ops](../../T6_ai_powered_cloud_ops/00_README.md)

## Glossary terms touched

[Provisioned throughput](../../../reference/glossary/provisioned-throughput.md) · [On-demand vs provisioned](../../../reference/glossary/on-demand-vs-provisioned.md) · [Right-sizing throughput](../../../reference/glossary/right-sizing-throughput.md) · [Schedule-aware provisioned](../../../reference/glossary/schedule-aware-provisioned.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.11.L5
