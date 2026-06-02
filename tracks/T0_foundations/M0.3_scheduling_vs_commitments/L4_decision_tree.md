# When scheduling wins, when commitments win

§ T0 · M0.3 · L4 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **decide** which lever (schedule, commit, or both) fits any given workload **using a four-question decision tree.**

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop debating and pick the right lever per workload, every time." |
| **Personas** | All five |
| **Prerequisites** | [L1](L1_168_hour_math.md), [L2](L2_commitments.md), [L3](L3_non_prod_fallacy.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Decide (Evaluate) |

---

## 1. Concept

Every workload sits in one of five categories defined by two questions: *Does it need to run 24/7?* and *How predictable is its capacity demand?* The answers map cleanly to a lever choice.

### The four-question decision tree

```
Q1: Does this workload need to be available 24/7?
    YES → go to Q2
    NO  → SCHEDULE. Stop here.

Q2: Is the steady-state floor predictable for 1+ year?
    YES → go to Q3
    NO  → ON-DEMAND. Skip commitments. Stay flexible.

Q3: Is the workload stateless and eviction-tolerant for SOME portion of its capacity?
    YES → COMMIT FLOOR + SPOT BURST. Hybrid approach.
    NO  → COMMIT FLOOR + ON-DEMAND PEAK.

Q4: Is there an event-driven burst (specific dates, traffic events)?
    YES → add EVENT READINESS pre-scaling on top of the base config.
    NO  → done.
```

The tree is short. Most workloads exit at Q1 (schedulable) or Q3 (commit-the-floor pattern). The trap is asking these questions in the wrong order — most commitment debates start at Q3 without ever testing Q1.

### Workload archetype × right lever

```
ARCHETYPE                        RIGHT LEVER(S)
──────────────────────────────────────────────────────────────────
Dev / staging / test (non-prod)    Schedule (default), no commitment
Production web app (24/7 steady)   Commit floor, on-demand peak
Production with bursty traffic     Commit floor, on-demand peak, spot for stateless work above
K8s clusters with stateless work   Schedule non-prod, commit prod floor, spot for stateless pods
Batch / analytics / ML training    Spot (default), commit only if predictable
Reporting DBs (business hours)     Schedule (treat as non-prod for cost purposes)
Disaster recovery / cold standby   On-demand, scale-to-zero between drills
Event-driven (marketing launches)  Event Readiness pre-scaling on top of base
```

### When commitments DO win on non-prod

The non-prod fallacy from [L3](L3_non_prod_fallacy.md) is the default. But there is a legitimate exception:

**A non-prod environment that has been scheduled, observed, and has a stable post-schedule floor that nobody disputes is going away.**

Example: a long-running performance test infrastructure that runs every weekday for two years. Scheduled off nights and weekends, but the weekday floor is stable. Buying a 1-yr commitment on the post-schedule floor is fine.

The exception applies when steps 1–3 of the decision tree have already been done. Before any of those steps, the default for non-prod is "schedule, do not commit."

### When scheduling does NOT apply

Production is the most common exception. Production usually needs to be available continuously. Scheduling production is rare and intentional — typically only for explicitly non-24/7 products (a B2B SaaS that publishes a 9-6 SLA and explicitly stops outside hours; some single-region developer tools that announce maintenance windows).

For most production, the right pattern is commit-the-floor + on-demand-peak, with autoscaling managing the variance. Production scheduling is a deliberate choice, not a default.

### The combined view

A real estate uses *all* the levers, applied to different workload classes:

```
WORKLOAD CLASS               PRIMARY LEVER           SECONDARY
─────────────────────────────────────────────────────────────────
Non-prod (dev / test / stage)  Schedule               —
Production floor (steady)      1-yr Savings Plan      —
Production peak (predictable)  On-demand              Autoscaling
Production burst (event)       Event Readiness        Autoscaling
Stateless batch                Spot                   Fall back to on-demand
Disaster recovery              On-demand              Scale-to-zero
```

This is the picture a mature FinOps practice produces. Not one lever, not all levers everywhere — the right lever per class.

### The 60-day baselining rule

A useful default rule:

> *For any new workload at non-trivial scale, do not buy commitments in the first 60 days. Schedule what is scheduleable. Observe the post-schedule steady-state. Commit only after the floor is stable.*

This rule averts almost every over-commitment incident. The 60-day window is long enough to absorb the launch curve and short enough not to delay legitimate savings.

---

## 2. Demo

A real workload audit, walked through the decision tree:

```
WORKLOAD: "data-pipeline-staging"
TYPE: GKE cluster, 12 nodes, used by data team

Q1: Does this need to be 24/7?
    Engineering: "Engineers only use it during business hours."
    A: NO
    → DECISION: SCHEDULE
    Pattern: 8-8 Mon-Fri schedule, scale-to-zero off-hours
    Expected savings: ~64% of current cost

─────────────────────────────────────────────────────────

WORKLOAD: "checkout-service-prod"
TYPE: ECS service, 8 tasks at steady, 14 at peak afternoon

Q1: 24/7? YES
Q2: Steady-state floor predictable? 
    Engineering: "Yes, we've run 8 tasks at steady for 18 months."
    A: YES → go to Q3
Q3: Some stateless / eviction-tolerant?
    Engineering: "Tasks are stateless but eviction would cause user-visible errors."
    A: NO
    → DECISION: COMMIT FLOOR + ON-DEMAND PEAK
    Pattern: 1-yr Savings Plan covering 8 tasks, on-demand for peak

─────────────────────────────────────────────────────────

WORKLOAD: "data-warehouse-batch-jobs"
TYPE: EMR Serverless, ~80 vCPU-hours/day, stateless, retryable

Q1: 24/7? Sort of (batch fires multiple times daily)
Q2: Floor predictable? "Daily floor varies, but 40 vCPU-hours/day is the minimum."
    A: YES → go to Q3
Q3: Stateless / eviction-tolerant?
    A: YES (batch jobs checkpoint)
    → DECISION: COMMIT FLOOR + SPOT BURST
    Pattern: Savings Plan for 40 vCPU-hours/day, Spot for the variable layer
```

Three workloads, three different lever combinations. The tree drives each.

(Asset: `assets/diagrams/M0.3_L4_decision_tree_flowchart.svg`.)

---

## 3. Hands-on (7 min)

Run the decision tree on three of your own workloads:

```
WORKLOAD 1: ____________________
  Q1 (24/7 needed?):                 Y / N
  Q2 (floor predictable for 1yr?):   Y / N / n/a
  Q3 (eviction-tolerant burst?):     Y / N / n/a
  Q4 (event-driven burst?):          Y / N / n/a
  → DECISION: ____________________

WORKLOAD 2: ____________________
  ...

WORKLOAD 3: ____________________
  ...
```

For each "schedule" decision, the next step is a real schedule. For each "commit" decision, the next step is the 60-day baselining rule before any purchase.

---

## 4. Knowledge check

### Q1
A workload runs continuously, the floor is predictable, and the burst is stateless / retryable. The right lever combination is:

A. Schedule the workload off-hours
B. Buy a 1-yr Savings Plan for everything
C. Commit on the floor, use Spot for the stateless burst
D. Pure on-demand for flexibility

<details>
<summary>Show answer</summary>

**Correct: C.** This is the commit-floor + spot-burst pattern. Each layer gets the right instrument. (A is wrong because workload is 24/7; B is over-commitment because the burst is variable; D leaves savings on the table.)
</details>

### Q2
A new workload was launched 30 days ago. The engineering team proposes a 1-yr commitment to lock in savings. The right response:

A. Agree
B. Decline — apply the 60-day baselining rule. Schedule first if applicable, observe steady-state, then revisit at day 60.
C. Buy a 3-yr commitment instead, for deeper savings
D. Wait for the next quarter

<details>
<summary>Show answer</summary>

**Correct: B.** The 60-day baselining rule averts most over-commitment. 30 days is too early to commit on a new workload.
</details>

### Q3
Production is rarely scheduled because:

A. Production cannot be scheduled
B. Customers do not respect schedules. Production is available continuously by default. Exceptions exist for explicitly non-24/7 products but are deliberate, not the default.
C. Scheduling production is illegal
D. Production should be on Spot

<details>
<summary>Show answer</summary>

**Correct: B.** Production scheduling is deliberate when it happens (some single-region tools, scheduled-availability SaaS), not a default move.
</details>

---

## 5. Apply

ZopNight's UI is the place this decision tree gets executed:

- **Q1 (schedule?)** → [Schedules](https://app.zopnight.com/schedules) — build the schedule, attach resources or groups
- **Q3 (commit + burst design)** → [Reports → Purchase Type](https://app.zopnight.com/reports/costs) for current mix; commitment purchase happens in provider console / via specialist tools
- **Q4 (event burst)** → [Event Readiness](https://app.zopnight.com/event-readiness) — pre-scale for the event date

The decision tree is the question the team asks. The product is where they apply it.

---

## Module quiz

You have now completed all four lessons of M0.3. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m0.3-quiz](../../../certifications/operator/m0.3-quiz.md). Pass to earn the **Lever-Sequencer** chip.

---

## Related lessons

- [M0.4 — Rack rate vs. billing cost vs. amortized cost](../M0.4_rack_rate_vs_billing/00_README.md) *(next module)*
- [T1.M1.3 — Build your first schedule](../../T1_zopnight_operator/M1.3_first_schedule/00_README.md)
- [T2.M2.4 — VM autoscaling](../../T2_zopnight_engineer/M2.4_vm_autoscaling/00_README.md)
- [T2.M2.9 — Event Readiness](../../T2_zopnight_engineer/M2.9_event_readiness/00_README.md)

## Glossary terms touched

[Decision tree](../../../reference/glossary/decision-tree.md) · [60-day baselining rule](../../../reference/glossary/60-day-baselining-rule.md) · [Floor commit](../../../reference/glossary/floor-commit.md) · [Spot burst](../../../reference/glossary/spot-burst.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.3.L4
