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
Two levers turn a rate-card discount into a realized one:

  coverage    = (eligible hours covered by the commitment) / (total eligible hours)
  utilization = (committed hours used) / (committed hours purchased)

Coverage sets how much of your eligible spend earns the discount.
Utilization decides whether the commitment wins or loses money at all.
```

A worked example with a 1-year RI on EC2 m5.large at 40% rate-card discount:

```
SCENARIO A, healthy
  Utilization: 95% (you use 95% of the hours you committed to)
  Coverage:    80% (80% of eligible usage runs at the RI rate)
  95% is above the 60% break-even, so every covered hour saves near 40%.
  The uncovered 20% just runs on-demand. Net: a clear win.

SCENARIO B, under-committed (savings left on the table)
  Utilization: 100% (every committed hour is used)
  Coverage:    40% (only 40% of eligible usage is covered)
  Still a win on every covered hour (100% is well above break-even).
  The other 60% pays rack rate. No loss, just unclaimed savings.

SCENARIO C, over-committed (the real failure)
  Utilization: 45% (workload moved; most committed hours go unused)
  45% is below the 60% break-even for a 40% RI.
  You keep paying the committed rate on hours nobody uses, and that
  overpayment now exceeds the discount earned. Net cost INCREASES.
```

The "disaster" case is Scenario C. An RI bought for a workload that gets re-architected or migrated mid-term keeps billing the committed rate until expiry, on capacity nobody uses. That is **over-commitment**, the textbook commitment mistake, and it is driven by low utilization, not low coverage.

### Break-even math

Break-even is a **utilization** threshold, not a coverage one. Under-coverage never loses money: eligible hours the commitment does not cover simply run on-demand at rack rate. Under-utilization is what loses money, because you paid for committed hours you did not use.

```
Break-even utilization = 1 - discount

  40% RI:   1 - 0.40 = 60%    use < 60% of what you bought and you lose vs on-demand
  30% SP:   1 - 0.30 = 70%
  57% CUD:  1 - 0.57 = 43%
```

This is why commitments are bought on the **post-schedule floor**, not the current peak. The floor is the always-on overlap that survives your schedules. Buy for the peak and utilization drops below break-even the moment the peak subsides.

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
A 1-yr RI at 40% discount needs roughly what utilization to break even against pure on-demand?

A. 40%
B. 60%
C. 71.4%
D. 100%

<details>
<summary>Show answer</summary>

**Correct: B.** Break-even utilization = 1 - discount = 1 - 0.40 = 60%. Use less than 60% of the committed hours and the unused commitment costs more than the discount earned. This is a utilization threshold, not a coverage one: under-coverage never loses money.
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
