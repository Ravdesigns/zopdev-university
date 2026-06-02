# Optimize — the four levers you have

§ T0 · M0.2 · L3 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **name** the four levers of cloud cost optimization **and rank** them by typical impact and time-to-value.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Tell me what to do first." |
| **Personas** | All five |
| **Prerequisites** | [L1](L1_six_principles.md), [L2](L2_inform.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Name (Remember) and Rank (Evaluate) |

---

## 1. Concept

**Optimize** is the second phase of the FinOps lifecycle. There are exactly four levers. Every optimization initiative is some combination of these four. Ranking them by impact and time-to-value is the most important sequencing decision in a FinOps program.

```
LEVER                  IMPACT (typical)   TIME-TO-VALUE   RISK
─────────────────────────────────────────────────────────────────
1. Eliminate waste     20–40% of bill     Days–weeks       Low
2. Rightsize           10–30% of bill     Weeks            Medium
3. Rate optimize       5–25% of bill      Weeks–months    Medium–High
4. Architect / design  varies (5–50%+)    Quarters         High
```

### Lever 1 — Eliminate waste

Stop paying for things nobody uses. Scheduling non-prod off-hours, terminating idle resources, releasing orphan storage, cleaning forgotten snapshots, deleting unused Elastic IPs. This is the [Top 10 from M0.1 L5](../M0.1_cloud_bill_decoded/L5_ten_cost_mistakes.md).

**Why first:** lowest risk, fastest payback, no architectural debate. Stopping a dev environment at night does not require a redesign. The savings hit the next bill.

**Where it ends:** when the avoidable-spend KPI drops below 5–8 percent of bill. Below that, the remaining waste is in the architecture, not in operations.

### Lever 2 — Rightsize

Run things at the right size. Drop oversized instances a class or two. Move RDS instances down a tier when CPU and connections are persistently low. Switch EBS from `gp2` to `gp3` (same performance, lower cost). Move under-utilized K8s workloads to lower requests / limits.

**Why second:** higher reasoning load than waste elimination but still mostly mechanical. The rules engine ([T2.M2.1](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md)) computes most rightsizing candidates automatically. The remaining question is workload risk tolerance.

**Where it gets hard:** rightsizing databases (cannot be auto-remediated, must be done in a maintenance window) and rightsizing workloads with bursty traffic (the P99, not the average, defines the floor).

### Lever 3 — Rate optimize

Pay less per unit. Reserved Instances, Savings Plans, Committed Use Discounts (CUDs), Spot, Azure Hybrid Benefit. Negotiate enterprise discount programs. Move steady workloads from on-demand to commitment-backed pricing.

**Why third, not first:** commitments only pay back on workloads you actually run for the full term. Committing to capacity you then schedule off is a value-destroying move. The right sequence is *schedule first → rightsize → commit on the proven floor.*

**Where it gets dangerous:** over-commitment. A 1-year RI on capacity you only run six months returns negative ROI. A 3-year RI on the wrong instance family compounds the mistake. (See [M0.3 L2](../M0.3_scheduling_vs_commitments/L2_commitments.md) and [T4.M4.7](../../T4_finops_mastery/M4.7_commitments_demystified/00_README.md).)

### Lever 4 — Architect / design

Change the workload to cost less. Replace a 24/7 service with a serverless equivalent that scales to zero. Move an analytics pipeline from EMR to Athena. Re-implement a real-time feature as event-driven. Decompose a monolith so non-critical paths can run on cheaper compute.

**Why last:** highest impact ceiling, highest risk, longest time-to-value. An architectural change touches code, deployment, on-call, SLOs. The ROI calculation must account for engineering time.

**Where it shines:** the steady-state floor cost after levers 1–3 have been applied. If you are still spending $200K per month on a workload that could be re-architected to $80K, the prize is there. But sequence it after the easy wins.

### The lever ranking is not opinion

```
   IMPACT ─→
   ┌──────────────────────────────────────────────────────┐
   │ 4 ARCHITECT/DESIGN          (highest ceiling, slowest)│
   │ 3 RATE OPTIMIZE             (mid impact, medium speed)│
   │ 2 RIGHTSIZE                 (mid impact, fast)        │
   │ 1 ELIMINATE WASTE           (consistent, fastest)     │
   └──────────────────────────────────────────────────────┘
   TIME-TO-VALUE →
```

The diagonal: lever 1 is in the bottom-left (fast, modest), lever 4 is in the top-right (slow, biggest). Most teams should travel up-and-right diagonally over 12 months, not jump straight to lever 4.

### The most common sequencing mistake

Buying reservations before scheduling. The reservation locks in capacity you intend to schedule down, destroying the savings on both sides. The fix is mechanical: schedule first, observe the resulting steady-state floor for 60 days, then commit on the floor only.

### Where ZopNight focuses

Lever 1 (scheduling) and lever 2 (rightsizing recommendations + autoscaling) are first-class. Lever 3 (commitments) is on the roadmap. Lever 4 (architecture) is out of scope — that is application engineering work, not platform automation.

---

## 2. Demo

A real (anonymized) optimization sequence at a mid-size SaaS, applied over 6 months:

| Month | Lever | Action | Realized monthly savings |
|---|---|---|---|
| 1 | Lever 1 | Schedule all non-prod (dev, staging, ephemeral) off after hours and weekends | $24,000 |
| 2 | Lever 1 | Delete 1,200+ orphan EBS volumes and forgotten snapshots | $1,800 |
| 2 | Lever 2 | Apply RC-006 oversized EC2 recs (one-click for 31 resources) | $4,100 |
| 3 | Lever 2 | Downsize 4 RDS instances at planned maintenance | $2,800 |
| 3 | Lever 1 | Eliminate 6 always-on NAT GWs in non-prod (consolidate to one) | $194 |
| 4 | Lever 3 | Buy 1-yr Savings Plan on the post-schedule steady-state floor | $7,200 |
| 5 | Lever 4 | Re-architect one analytics job from EMR to Athena | $3,400 |
| 6 | (review) | — | (re-baseline) |

Cumulative monthly savings by month 6: **$43,494**. Total project effort: ~140 engineering hours. Effective rate: $310 saved per engineering hour.

(Asset to produce: a stair-step chart of cumulative savings by month, with each lever colored. Path: `assets/diagrams/M0.2_L3_six_month_journey.svg`.)

---

## 3. Hands-on (8 min)

For your own estate, score yourself on each lever:

```
LEVER 1 — Eliminate waste
[ ] Are non-prod resources scheduled off after hours?
[ ] Is the avoidable-spend KPI below 8% of bill?

LEVER 2 — Rightsize
[ ] Are rightsizing recommendations reviewed weekly?
[ ] What's the average gap between "recommendation surfaced" and "remediated"?

LEVER 3 — Rate optimize
[ ] What's the current commitment coverage (RI + SP + CUD)?
[ ] Was the most recent commitment purchased on the post-schedule floor?

LEVER 4 — Architect/design
[ ] Are there any workloads in active redesign for cost reasons?
[ ] Is engineering time being tracked against cost-driven redesigns?
```

If lever 1 is incomplete, do not move to levers 2–3. The sequence is not "do all four in parallel." It is "do 1 first, then 1+2, then 1+2+3, then all four."

---

## 4. Knowledge check

### Q1
A team has $200K monthly cloud spend, mostly non-prod always-on, and wants to start optimizing. The first move is:

A. Buy a 3-year Reserved Instance pool to lock in savings
B. Schedule non-prod off-hours and weekends
C. Migrate to Kubernetes
D. Hire a FinOps consultant

<details>
<summary>Show answer</summary>

**Correct: B.** Lever 1 first. A 3-year RI on always-on non-prod is the textbook over-commitment mistake. Migration to K8s is a lever-4 redesign with quarters of payback. Consultants can help but the first move does not require one.
</details>

### Q2
A FinOps team reports: "We applied 30 rightsizing recommendations this month and saved $4,100. We applied 1 schedule and saved $24,000." Which lever has more headroom to keep finding savings?

A. Lever 1 (scheduling)
B. Lever 2 (rightsizing)
C. Both equally
D. Lever 3 (commitments)

<details>
<summary>Show answer</summary>

**Correct: A.** Lever 1 dwarfs lever 2 in this report. The team should keep finding scheduling opportunities (more non-prod tiers, K8s workloads, Databricks clusters) before scaling lever 2 effort.
</details>

### Q3
A CFO proposes locking in a 3-year RI on the current peak compute usage to "guarantee savings." Best response:

A. Agree, locking in is good
B. Push back. 3-year RIs on current peak are at high risk of over-commitment if usage shifts. The defensible move is 1-year commitment on the post-schedule, post-rightsizing floor — not on current peak.
C. Wait one year
D. Use Spot instead

<details>
<summary>Show answer</summary>

**Correct: B.** Commitments are calibrated to the *floor*, not the *peak*. The floor is what the workload will demand even in a slow quarter. Current peak is a fluctuating ceiling.
</details>

---

## 5. Apply

ZopNight is built around levers 1 and 2 because that is where the fast, repeatable savings live for most estates:

- **Lever 1** → [Schedules](https://app.zopnight.com/schedules) (any time you can stop a resource), [Recommendations](https://app.zopnight.com/recommendations) idle/orphan rules
- **Lever 2** → [Recommendations](https://app.zopnight.com/recommendations) rightsizing/category rules, [VM Autoscaling](https://app.zopnight.com/autoscaler)
- **Lever 3** → coverage tracked in [Reports → Purchase Type](https://app.zopnight.com/reports/costs) breakdown
- **Lever 4** → out of scope; engineering ownership

---

## Related lessons

- [L4 — Operate: the discipline that beats one-shot wins](L4_operate.md) *(next)*
- [M0.3 — Why scheduling beats commitments](../M0.3_scheduling_vs_commitments/00_README.md)
- [T4.M4.7 — Commitments demystified](../../T4_finops_mastery/M4.7_commitments_demystified/00_README.md)

## Glossary terms touched

[Optimize](../../../reference/glossary/optimize.md) · [Eliminate waste](../../../reference/glossary/eliminate-waste.md) · [Rightsize](../../../reference/glossary/rightsize.md) · [Rate optimize](../../../reference/glossary/rate-optimize.md) · [Architect-design lever](../../../reference/glossary/architect-design-lever.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.2.L3
