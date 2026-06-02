# The non-prod fallacy

§ T0 · M0.3 · L3 of 4 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why "buy reservations for non-prod" is the textbook over-commitment mistake **and propose** the correct alternative.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Talk a stakeholder out of buying RIs for dev/staging." |
| **Personas** | FinOps Analyst · Finance Partner · Engineering Leader |
| **Prerequisites** | [L1](L1_168_hour_math.md), [L2](L2_commitments.md) |
| **Time** | 8 minutes |
| **Bloom verb** | Explain (Understand) and Propose (Create) |

---

## 1. Concept

The non-prod fallacy is a specific commitment-design mistake that recurs at almost every organization in the first FinOps year: buying reservations or Savings Plans for non-production compute. The error is mathematically guaranteed to under-perform, yet it is intuitive enough that smart Finance teams propose it.

### The proposal

It usually arrives in a slide deck. The slide says something like:

> "We have $40K of non-prod compute spend. Cloud provider offers 40% off on a 1-year RI. Let's commit to non-prod and save $16K per year."

The math is honest if you accept the framing. The framing is wrong.

### Why the framing is wrong

Non-prod compute is *the workload class most suited to scheduling*. By definition, non-prod does not need to run nights and weekends. The math from [L1](L1_168_hour_math.md) said this: standard scheduling saves ~64% of hours, realistically ~45%.

If you schedule non-prod, you have removed the hours that an RI would have covered. The RI keeps billing for those hours regardless. The result:

```
SCENARIO: $40K monthly non-prod compute
  Approach A — Buy 1-yr RI at 40% discount, don't schedule
    Monthly: $40K × (1 − 0.40 × 1.0 × 1.0) = $24K
    Savings: $16K/month

  Approach B — Schedule (no commitment)
    Monthly: $40K × (1 − 0.45) = $22K
    Savings: $18K/month

  Approach C — Buy RI AND schedule (the trap)
    RI covers 40% of theoretical hours but only ~55% of them are
    actually used after scheduling. So:
    Effective discount: 40% × 0.55 × 1.0 = 22%
    But: the RI keeps billing the unused 45% of committed hours
    at the commitment rate, against capacity that is OFF
    Monthly: ~$30K
    Savings: $10K/month — WORST OF THE THREE
```

Approach C is the trap. It looks like "both savings combined." In reality the commitment defeats the scheduling because the commitment continues to bill for capacity that is no longer running.

### The general rule

```
Reservations are calibrated to the FLOOR.
Non-prod scheduling REMOVES the floor.
Therefore: do not buy reservations on workload classes you intend to schedule.
```

This is one of the cleanest decision rules in FinOps. The mechanics are airtight. The cognitive trap is treating "discount" and "savings" as the same word.

### The right alternative

Pick the better of approaches A and B:

- **B (schedule, no commitment)** is the default. It is mechanically simpler, no commitment risk, comparable realized savings.
- **A (commit, no schedule)** wins only when scheduling is not feasible — e.g., the non-prod workload genuinely runs 24/7 due to overnight batch tests, or the team's engineering culture cannot adopt scheduled environments.

Almost every team that *thinks* they need A actually fits B.

### A case study

The simplest worked example, from a real customer engagement:

```
BEFORE
  Non-prod compute spend                $52,000 / month
  Commitment coverage                   0%
  Schedule coverage                     0%
  Status: full on-demand, always on, no FinOps discipline

PROPOSED (Approach C, the trap)
  1-yr RI on the full $52K spend at 40% discount
  "Saves $20.8K/month"
  Stakeholder excitement: high

WHAT ACTUALLY HAPPENED (we steered to Approach B)
  Standard schedule applied (8-8 Mon-Fri)
  Tag coverage cleaned up so the schedule reaches all non-prod
  Realized monthly savings: $23K
  Annual run rate: $276K saved

COUNTERFACTUAL (what would Approach C have done)
  Schedules disabled to keep RI utilization high
  Effective discount realized: 33%
  Monthly savings: $17K
  Annual: $204K — $72K LESS than Approach B
  Plus: 12 months of lock-in, peak inflexibility, renewal pressure
```

Approach B beat Approach C by $72K per year on this single workload.

### Why this fallacy is so common

Three reasons:

1. **Vendor sales motion.** AWS, GCP, Azure account teams are measured on commitment dollar amount. Their incentive is to propose any commitment. They are not lying — they are doing their job. The customer's job is to model it properly.
2. **Finance vocabulary.** "Discount" is a familiar Finance word. "Schedule" is not. The proposal that uses Finance vocabulary lands easier.
3. **The math is unintuitive.** It is genuinely subtle that scheduling and commitments interact destructively on non-prod. A team has to do the worked example to see it.

The fix is the worked example. Once a stakeholder walks through Approach A vs. B vs. C with their own numbers, the right answer is unambiguous.

---

## 2. Demo

A real meeting transcript pattern, condensed:

```
PROCUREMENT: "AWS is offering us 40% off if we commit to $1M of non-prod
             EC2 for one year. That's $400K savings."

FINOPS:      "Walk me through the math. If we schedule non-prod off-hours
             instead, what's our usage?"

ENGINEERING: "About 45% of current hours after schedule fires."

FINOPS:      "So the $1M commitment would cover hours we won't be using.
             We'd be paying the RI rate for capacity that's off."

PROCUREMENT: "But the discount..."

FINOPS:      "The discount is on capacity we use. If we use less capacity,
             the discount applies to less. And the commitment locks us in
             — if we use even less next year, we keep paying."

PROCUREMENT: "What's the alternative?"

FINOPS:      "Schedule now. Observe the steady-state floor for 60 days.
             If there is a real always-on floor in non-prod after that,
             we can commit on the floor only — at a much smaller amount,
             much lower risk."
```

The pattern: lead with the math, name the trap, propose the sequence. The procurement team walks away aligned, not blocked.

(Asset: `assets/diagrams/M0.3_L3_decision_path.svg` — flowchart for the non-prod commitment decision.)

---

## 3. Hands-on (5 min)

Pretend a stakeholder proposes a 1-yr RI on your non-prod compute. Write the defensible counter-proposal in three sentences:

```
Sentence 1 (the math):
  "If we schedule non-prod, we use about __% of the hours we currently
   pay for. A 1-yr RI would cover hours we will not use."

Sentence 2 (the alternative):
  "The right sequence is schedule first, then observe the post-schedule
   floor for 60 days, then commit on the floor only."

Sentence 3 (the dollar comparison):
  "On our $___K monthly non-prod spend, Approach B (schedule) returns
   ~$___K/month. Approach C (commit + schedule) returns ~$___K/month
   and locks in 12 months of inflexibility. The choice is clear."
```

Have the response written before the meeting. It is faster to prevent the trap than to undo it.

---

## 4. Knowledge check

### Q1
A 1-yr Reserved Instance applied to scheduled non-prod compute most accurately:

A. Multiplies savings — discount plus scheduling
B. Defeats scheduling savings because the RI bills for hours the resource is not running
C. Has no effect on scheduling
D. Pays for itself in three months

<details>
<summary>Show answer</summary>

**Correct: B.** RIs bill the committed capacity regardless of whether the resource is running. Schedule-then-commit on non-prod is destructive interference.
</details>

### Q2
The correct sequence for commitment design after scheduling is:

A. Buy commitments first, then schedule
B. Schedule first, observe the post-schedule floor for 60 days, commit on the floor only
C. Skip commitments entirely on all workloads
D. Buy 3-yr commitments for maximum discount

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule reveals the floor. Commitments are calibrated to the floor. The 60-day window allows the post-schedule pattern to stabilize before locking in capacity.
</details>

### Q3
A Finance team has approved a 1-yr Savings Plan on non-prod compute. Best response:

A. Block the purchase
B. Walk them through the worked example with their own numbers. Propose the alternative: schedule first, then commit on the post-schedule production floor.
C. Approve quietly
D. Wait for the next renewal

<details>
<summary>Show answer</summary>

**Correct: B.** The trap is unintentional. The fix is the worked example. Block-without-explanation creates organizational friction; walk-through with numbers builds shared understanding.
</details>

---

## 5. Apply

ZopNight's Reports → Resources view lets you filter to non-prod by tag, then run the [Savings Estimator](https://app.zopnight.com/schedules) on the matching resources to project Approach B savings. The number is the input to the "schedule first" conversation with Finance.

For Approach A modelling (commitment design), AWS Cost Explorer's RI / SP recommendation engine or third-party tools (ProsperOps, Spot Eco) are the right partners. ZopNight stays out of commitment-purchase recommendations — different problem, different tooling.

---

## Related lessons

- [L4 — When scheduling wins, when commitments win](L4_decision_tree.md) *(next)*
- [T4.M4.7 — Commitments demystified](../../T4_finops_mastery/M4.7_commitments_demystified/00_README.md)

## Glossary terms touched

[Non-prod fallacy](../../../reference/glossary/non-prod-fallacy.md) · [Over-commitment](../../../reference/glossary/over-commitment.md) · [Floor](../../../reference/glossary/floor.md) · [Sequence rule](../../../reference/glossary/sequence-rule.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.3.L3
