# The six FinOps principles in one page

§ T0 · M0.2 · L1 of 6 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **name** the six FinOps Foundation principles **and explain** how each one shapes a real cost decision.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Have a defensible answer when the CFO asks 'what framework are you using?'" |
| **Personas** | All five |
| **Prerequisites** | M0.1 module complete |
| **Time** | 8 minutes |
| **Bloom verb** | Name (Remember) and Explain (Understand) |

---

## 1. Concept

The FinOps Foundation publishes the canonical framework for cloud financial management. Six principles, three lifecycle phases (Inform / Optimize / Operate), 22 named capabilities under four domains. The principles are the philosophical anchor — they describe how a healthy FinOps practice behaves, not what it does day to day.

Memorize the six. They settle most "should we do this?" debates.

### Principle 1 — Teams need to collaborate

FinOps is a cross-functional sport. Engineering, finance, product, leadership, procurement, and security all have decisions that affect cost. None of them can win alone. The principle exists to short-circuit the most common failure mode: finance writing reports that engineering ignores, engineering buying capacity that finance cannot forecast.

**Practice form:** A weekly FinOps standup that includes a finance representative and an engineering lead. Decisions made in the room, not in email threads.

### Principle 2 — Business value drives technology decisions

Cost is not the goal. Cost-per-unit-of-business-value is the goal. A cloud bill that is 10 percent higher than last quarter is a problem only if the business value generated is not also higher. A bill that is 10 percent lower is a problem if the team cut something the business needed.

**Practice form:** Every cost report carries a unit-economics column (cost per MAU, per order, per 1K API requests). The trend in that column matters more than the absolute number.

### Principle 3 — Everyone takes ownership for their technology usage

Cost ownership lives with the team that uses the resource. Not with central FinOps. Not with finance. Not with the platform team. Central groups enable; the consuming team owns. The principle is the antidote to the "FinOps team owns the bill" anti-pattern, which guarantees waste because nobody who can fix anything is on the hook.

**Practice form:** Each team has a monthly cost dashboard scoped to its tagged resources. Each team has a budget. Variance reports go to the team, not to central FinOps.

### Principle 4 — FinOps data should be accessible, timely, and accurate

Stale, inaccurate, or gatekept cost data is FinOps theatre. A team that learns about a cost incident three weeks after it happened cannot fix it. A central group that hoards the bill behind PDFs cannot expect ownership to take root.

**Practice form:** Cost data is in a self-serve tool, refreshed daily, accurate to within a known band. No gatekeeping. No "request a report" tickets.

### Principle 5 — A centralized team drives FinOps practices

The principle is widely misread as "central team owns the bill." It does not. Central enables; teams own. Central provides tooling, training, standards, benchmarks, and the FinOps practice operations. Decentralized teams make the decisions inside those guardrails.

**Practice form:** A central FinOps function with a small headcount that publishes standards (the four MVT tags, the budget threshold playbook, the anomaly response runbook) and runs the tooling, not a central team that approves every Terraform PR.

### Principle 6 — Take advantage of the variable cost model of the cloud

The cloud is variable cost. That is its defining property compared to on-prem. The FinOps practice should exploit elasticity: scale down at night, terminate when idle, use spot for stateless work, commit only on the proven floor. Treating cloud as fixed-cost (provision once, run forever) is the most common single behavioral mistake.

**Practice form:** Scheduling, autoscaling, and commitment policies are first-class organizational disciplines, not Terraform afterthoughts.

### The principles in one picture

```
  ┌─────────────────────────────────────────────────────┐
  │  FINOPS FOUNDATION — six principles                 │
  ├─────────────────────────────────────────────────────┤
  │  1. Teams collaborate                               │
  │  2. Business value drives tech decisions            │
  │  3. Everyone takes ownership                        │
  │  4. Data is accessible, timely, accurate            │
  │  5. Centrally enabled, locally owned                │
  │  6. Exploit the variable cost model                 │
  └─────────────────────────────────────────────────────┘
```

These six are not opinion. They are the public framework. Any organization can adopt the language; the language gives FinOps work the shared vocabulary it needs to be defensible inside an engineering culture that respects defensibility.

---

## 2. Demo

The six principles tested against a real decision: *"Should we apply a 1-year Reserved Instance to dev compute?"*

- **Principle 6 (variable cost):** Dev compute should not be running 24/7 in the first place. A reservation locks in 24/7. The first move is scheduling, not commitment.
- **Principle 3 (ownership):** Who owns the dev environment? They should be on the call.
- **Principle 4 (data):** What is the current utilization of dev compute? Pull the number before deciding.
- **Principle 2 (business value):** What does the dev environment deliver to the business? If it accelerates 30 engineers' work, that frames the budget.
- **Principle 1 (collaborate):** Finance, engineering, product in the room. Not just engineering.
- **Principle 5 (centrally enabled):** Central FinOps publishes the "schedule first, commit on the floor" playbook. The team applies it.

Decision: **Do not apply a 1-year RI to dev.** Schedule the dev compute. After 60 days of scheduled operation, evaluate a commitment on the floor only (the always-on overlap of the schedule).

(Asset to produce: a decision-tree diagram walking the six-principle test on this exact scenario. Path: `assets/diagrams/M0.2_L1_decision_tree.svg`.)

---

## 3. Hands-on (5 min)

Pick a current cost decision your team faces. Apply the six-principle test to it:

```
DECISION: __________________________________

Principle 1 (collaborate)   — Who needs to be in the room? ____________
Principle 2 (business value) — What does this enable? ________________
Principle 3 (ownership)     — Who owns the consequence? ______________
Principle 4 (data)          — What number do we need? ________________
Principle 5 (centrally enabled) — What policy applies? _______________
Principle 6 (variable cost) — Is there a fixed-cost trap to avoid? ___
```

If three or more cells are blank, the decision is not ready to make. Get the data, gather the people, then revisit.

---

## 4. Knowledge check

### Q1
"FinOps is central. Cost ownership is central." This statement most directly violates which principle?

A. Principle 1 (collaborate)
B. Principle 3 (ownership)
C. Principle 5 (centrally enabled)
D. Principle 6 (variable cost)

<details>
<summary>Show answer</summary>

**Correct: B.** Principle 3 is explicit: ownership lives with the team that uses the resource. Central enables but does not own. (Principle 5 is the closest decoy but its statement is "centrally enabled," not "centrally owned" — exactly the distinction the principle is making.)
</details>

### Q2
A team's cost report is published monthly as a PDF. Which principle is undermined?

A. Principle 2 (business value)
B. Principle 4 (accessible, timely, accurate)
C. Principle 5 (centrally enabled)
D. Principle 6 (variable cost)

<details>
<summary>Show answer</summary>

**Correct: B.** Monthly PDFs are neither timely nor accessible. The team cannot act on data they cannot query, refreshed at a cadence that lets them respond.
</details>

### Q3
The CFO asks: "Why is our bill up 12 percent quarter-over-quarter?" The best framing for the answer leans on which principle?

A. Principle 1 (collaborate)
B. Principle 2 (business value)
C. Principle 4 (accessible, timely, accurate)
D. Principle 6 (variable cost)

<details>
<summary>Show answer</summary>

**Correct: B.** The answer must connect bill change to business value change. "Our bill is 12% higher; our MAU is 18% higher; our cost-per-MAU is down 5%" is a different conversation than "our bill is 12% higher, full stop."
</details>

---

## 5. Apply

ZopNight's product surface aligns with the principles by design. Specific examples:

- **Principle 3 (ownership):** Reports → Teams attributes cost by tag, including shared-resource split. The Unattributed bucket is its own row — visible, embarrassing, fixable.
- **Principle 4 (data):** The two-source cost model (Rack Rate + Billing) and the 24-hour sync cadence make daily cost queryable, with the freshness band labelled.
- **Principle 6 (variable cost):** Scheduling is a first-class feature, not a Lambda script. The variable-cost principle is what makes that decision defensible.

[Open ZopNight Reports → Teams](https://app.zopnight.com/reports/teams) *(deep link)*

---

## Related lessons

- [L2 — Inform: what visibility actually means](L2_inform.md) *(next)*
- [L5 — Crawl, Walk, Run](L5_crawl_walk_run.md)
- [T4.M4.1 — The FinOps maturity ladder](../../T4_finops_mastery/M4.1_maturity_ladder/00_README.md)

## Glossary terms touched

[FinOps Foundation](../../../reference/glossary/finops-foundation.md) · [FinOps lifecycle](../../../reference/glossary/finops-lifecycle.md) · [Cost ownership](../../../reference/glossary/cost-ownership.md) · [Variable cost](../../../reference/glossary/variable-cost.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.2.L1
