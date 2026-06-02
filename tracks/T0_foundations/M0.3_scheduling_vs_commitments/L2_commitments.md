# Commitments — what RIs, SPs, CUDs really save

§ T0 · M0.3 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** the effective discount of a reservation **and recognize** the over-commitment trap that destroys ROI.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Decide whether a Savings Plan purchase is going to pay off — with math, not vendor pitch." |
| **Personas** | FinOps Analyst · Finance Partner · Engineering Leader |
| **Prerequisites** | M0.1, M0.2, [L1](L1_168_hour_math.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Calculate (Apply) |

---

## 1. Concept

Cloud providers offer rate discounts in exchange for commitment. The deal: lock in a baseline of usage for one or three years, pay a lower per-unit rate, take the savings. The mechanism is sound. The execution is where most teams lose.

### The four commitment instruments

```
INSTRUMENT          PROVIDER     SCOPE                       MAX DISCOUNT
─────────────────────────────────────────────────────────────────────────
Reserved Instance   AWS          Specific instance family    ~40% (3-yr)
Savings Plan        AWS          Compute-broad ($/hr commit) ~30% (3-yr)
Committed Use       GCP          Specific machine family     ~57% (3-yr)
Reservation         Azure        Specific VM SKU             ~38% (3-yr)
Spot / Preemptible  All three    Stateless workloads only    50–90%
```

Each one trades flexibility for discount. RIs are the strictest (specific instance family, term-locked). Savings Plans are the most flexible (commit a dollar amount per hour, AWS applies it to whatever compute is eligible). CUDs sit in between. Spot is a different category — no commitment, but eviction risk.

### The math: effective discount

A commitment's discount is published as a "rate-card percentage" (e.g., 40% off). The **effective discount** — what you actually realize — is lower because of two friction factors:

```
EFFECTIVE DISCOUNT = published discount × coverage × utilization

WHERE:
  coverage    = (committed hours used) / (committed hours purchased)
  utilization = (committed hours used) / (total eligible hours)
```

A worked example with a 1-year RI on EC2 m5.large at 40% rate-card discount:

```
SCENARIO A — perfect commitment
  Coverage:    100% (RI is fully consumed)
  Utilization:  85% (instance runs 85% of hours)
  Effective discount: 40% × 1.00 × 0.85 = 34%

SCENARIO B — over-committed
  Coverage:     60% (RI hours are not all used)
  Utilization: 100% (every used hour is RI-rate)
  Effective discount: 40% × 0.60 × 1.00 = 24%

SCENARIO C — disaster
  Coverage:     30% (workload moved to a different instance type)
  Utilization:  90% 
  Effective discount: 40% × 0.30 × 0.90 = 11%
  Plus the RI keeps billing the unused hours — net cost INCREASES
```

The "disaster" case is real. An RI purchased for a workload that gets re-architected or migrated mid-term continues to bill at the committed rate until expiry. The customer is paying for capacity they are not using. This is **over-commitment**, the textbook commitment mistake.

### Break-even math

A 1-year RI breaks even when the discount realized exceeds the lost flexibility cost. Translated:

```
Break-even coverage ≈ 1 / (1 + on-demand-discount-ratio)
For a 40% RI:           1 / (1 + 0.40) = 71.4%

You need >71.4% coverage to come out ahead of pure on-demand on a 1-yr 40% RI.
For a 30% Savings Plan: ~76.9% required coverage.
For a 57% 3-yr CUD:     ~63.7% required coverage.
```

This is why commitments are bought on the **post-schedule floor**, not on current peak. The floor is the always-on overlap of your scheduling. Buying RIs for the peak guarantees coverage drops below break-even.

### Spot — the asterisk

Spot instances offer the deepest discount (50–90%) without a commitment but introduce eviction risk: AWS or GCP can reclaim the capacity with 2 minutes' notice. Spot is a fit for:

- Stateless batch workloads
- K8s nodes that can drain gracefully
- Build and CI workloads
- Data processing jobs that checkpoint

Spot is not a fit for:

- Single-replica databases
- Stateful workloads without checkpointing
- Anything where 2-minute eviction is unacceptable

Spot is its own discipline. It is not a substitute for commitments on the floor — it complements them on the variable layer above.

### How commitments compose with scheduling

```
LAYER                                  PRICING
───────────────────────────────────────────────────────────
Peak above the floor (bursty)          on-demand
Steady floor (always-on)               commitment (RI / SP / CUD)
Stateless / batch above the floor      spot, where safe
Non-prod (scheduled off-hours)         on-demand only — no commit
```

Each layer gets the right instrument. The discipline is identifying which layer a workload sits in, not picking one instrument and forcing it.

---

## 2. Demo

A real (anonymized) commitment-design exercise after scheduling fires:

```
WORKLOAD ANALYSIS — Production EC2, post-schedule
─────────────────────────────────────────────────────────
Always-on floor (steady)             40 vCPU
Peak above floor                     +15 vCPU (afternoon)
Burst above peak                     +8 vCPU (event-driven)
─────────────────────────────────────────────────────────
COMMITMENT DESIGN
1-yr Savings Plan covering 40 vCPU       commits the floor
On-demand for the 15-vCPU peak           absorbs daily variance
Spot for the 8-vCPU burst (batch only)   absorbs event-driven

EXPECTED EFFECTIVE DISCOUNT
  Floor (Savings Plan): 30% × 95% × 100% = 28.5%
  Peak (on-demand):     0%
  Burst (Spot):         85% × 100% × 100% = 85%
  Weighted across mix:  ~22% effective discount on production EC2
```

The team's previous plan had been to buy a 1-yr RI on the full 63 vCPU peak. That would have run at ~63% coverage (since burst is sporadic), realizing ~25% effective discount and locking in commitment that they would have lost in a year of growth. The post-schedule, layered approach realizes ~22% with no over-commitment risk and full flexibility on the burst layer.

(Asset: `assets/diagrams/M0.3_L2_layered_commitment.svg`.)

---

## 3. Hands-on (6 min)

For one of your steady-state production workloads:

```
1. Identify the always-on floor (the vCPU count or instance count
   that is running 100% of the hours, after any scheduling)
   FLOOR: ____________

2. Identify the peak (additional capacity at busy hours)
   PEAK: ____________

3. Identify burst (event-driven spikes)
   BURST: ____________

4. The commitment should cover the FLOOR, not the peak or burst.
   For the floor, model a 1-yr Savings Plan or RI:
   
   Committed hours per year   = FLOOR × 8760
   Expected coverage          = ____%  (target >85%)
   Expected utilization       = ____%  (target >95%)
   Effective discount         = published × coverage × utilization
                              = ____ × ____ × ____ = ____%

5. If the effective discount is below ~20%, the commitment is not
   worth the flexibility loss. Stay on-demand on this workload.
```

---

## 4. Knowledge check

### Q1
A team buys a 3-yr RI at 50% rate-card discount, but uses it only 65% of hours. Effective discount:

A. 50%
B. 32.5%
C. 65%
D. 17.5%

<details>
<summary>Show answer</summary>

**Correct: B.** Effective = 50% × 0.65 × 1.0 = 32.5%. The 50% number is the rate-card maximum, not what is realized.
</details>

### Q2
A FinOps Analyst proposes buying a 1-yr Savings Plan calibrated to current peak compute usage. The defensible counter-proposal is:

A. Buy two SPs
B. Calibrate to the post-schedule, post-rightsizing floor — not current peak. Layer on-demand and Spot above the committed floor.
C. Wait for next year
D. Use Spot for everything

<details>
<summary>Show answer</summary>

**Correct: B.** This is the textbook commitment mistake (peak vs. floor). The fix is layered design: commit on the floor, on-demand above, spot where safe.
</details>

### Q3
A 1-yr RI at 40% discount needs roughly what coverage to break even against pure on-demand?

A. 50%
B. 71.4%
C. 90%
D. 100%

<details>
<summary>Show answer</summary>

**Correct: B.** 1 / (1 + 0.40) = 71.4%. Below this, the unused commitment costs more than the discount earned.
</details>

---

## 5. Apply

ZopNight's [Reports → Purchase Type](https://app.zopnight.com/reports/costs) breakdown shows the current mix of on-demand / commitment / spot across the estate. The Sankey view splits any service column by purchase type.

Commitment recommendations (RI / SP planning) are on the ZopNight roadmap. Today the right partner tools are AWS Cost Explorer's RI / SP recommendations or providers like ProsperOps for managed commitment optimization. ZopNight is explicit about staying out of that lane; the right tool for the right job.

---

## Related lessons

- [L3 — The non-prod fallacy](L3_non_prod_fallacy.md) *(next)*
- [L4 — When scheduling wins, when commitments win](L4_decision_tree.md)
- [T4.M4.7 — Commitments demystified](../../T4_finops_mastery/M4.7_commitments_demystified/00_README.md)

## Glossary terms touched

[Reserved Instance](../../../reference/glossary/reserved-instance.md) · [Savings Plan](../../../reference/glossary/savings-plan.md) · [Committed Use Discount](../../../reference/glossary/committed-use-discount.md) · [Spot](../../../reference/glossary/spot.md) · [Effective discount](../../../reference/glossary/effective-discount.md) · [Over-commitment](../../../reference/glossary/over-commitment.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.3.L2
