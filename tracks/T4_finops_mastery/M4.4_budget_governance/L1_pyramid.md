# The budget pyramid

§ T4 · M4.4 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **design** a layered budget pyramid that rolls up from teams to org, **avoid** common allocation pitfalls (over- and under-allocation), **and reason** about why the pyramid structure beats single-budget or per-team-only approaches.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Build a budget structure that surfaces variance at the right level with the right audience, without over- or under-allocating org budget." |
| **Personas** | FinOps Lead · Finance Partner · Engineering Leader |
| **Prerequisites** | M4.1 (maturity) · M4.2 (showback/chargeback) · T3.M3.6 (budget product mechanics) |
| **Time** | 9 minutes |
| **Bloom verb** | Design (Create), Avoid (Apply), Reason (Evaluate) |

---

## 1. Concept

The budget pyramid is a layered budget structure where each level rolls up to the level above. Org budget is the apex; business unit (BU) budgets sit beneath; team budgets sit beneath the BUs. Variance at any level is visible up the pyramid, and the structure surfaces cost issues at the right audience.

```
ORG BUDGET                          $X (top-level commitment)
  ├── BU BUDGET A                   $X/2 (allocated by BU strategy)
  │   ├── TEAM 1 BUDGET             $X/8
  │   ├── TEAM 2 BUDGET             $X/8
  │   └── BU A overhead              $X/8 (shared infra in BU A)
  └── BU BUDGET B                   $X/2
      ├── TEAM 3 BUDGET             $X/8
      ├── TEAM 4 BUDGET             $X/8
      └── BU B overhead              $X/8
```

### Pyramid principles

```
1. EACH LEVEL ROLLS UP to the level above
   Org budget = sum of BU budgets + org-level overhead
   BU budget = sum of team budgets + BU overhead

2. ORG BUDGET = sum of allocations + reserve
   The math has to add up; otherwise the budget is fictional

3. EACH TEAM MANAGES THEIR OWN NUMBER
   The team's accountability is bounded by their budget
   They don't need to think about the BU's other teams

4. VARIANCE AT ANY LEVEL IS VISIBLE UP THE PYRAMID
   Team's overrun rolls up to BU; BU's variance rolls up to org
   The pyramid surfaces issues at the right level for action

5. AGGREGATION HAPPENS AUTOMATICALLY
   Org budget is not manually updated from team budgets;
   the system aggregates the allocation amounts
```

### Why pyramid beats alternatives

```
SINGLE BUDGET ONLY (no per-team)
  PROBLEM: org sees variance; cannot attribute
  Engineering teams don't know their share
  FinOps becomes referee for any variance
  Hard to allocate accountability

PER-TEAM ONLY (no org rollup)
  PROBLEM: teams see their share; org loses big picture
  Cross-team patterns invisible
  Total commitments unclear at exec level

PYRAMID
  Both views: org-level (executive) + team-level (engineering)
  Variance attributable at every level
  Accountability bounded; total visible
```

### Common pitfalls

```
1. OVER-ALLOCATION
   Sum of team budgets > org budget
   Each team thinks they have $X; collectively they spend $X+$Y
   Org budget overrun guaranteed
   FIX: ensure sum of allocations + reserve ≤ org budget

2. UNDER-ALLOCATION
   Sum of team budgets < org budget
   Org budget has unallocated slack
   Teams operate as if their budget is the cap; some cost
   lands in "shared overhead" without owner
   FIX: allocate ~95-100% of org budget; small reserve only

3. NO RECONCILIATION between forecast and budget
   Forecast says $1.1M; budget is $1M
   Both numbers presented; no one knows which is "the number"
   FIX: forecast informs budget; budget revisits monthly

4. NO BU LAYER
   Skipping BU layer with > 5 teams in org
   Pyramid is too flat; org-level becomes hard to track
   FIX: introduce BU layer to group teams

5. STATIC ALLOCATION
   Allocations set in January, never revised
   Reality drifts; allocations become fictional
   FIX: quarterly re-baseline based on observed run rate

6. ORG OVERHEAD HIDDEN
   Shared services / commitments not allocated to any team
   Each team's budget excludes overhead
   Org budget = sum of team budgets + invisible overhead
   FIX: explicit "shared overhead" line item; allocated
   somewhere or kept as central FinOps cost
```

### How the levels interact

```
TEAM (the operator):
  Manages their day-to-day cost
  Reviews weekly; adjusts as needed
  Reports to their BU lead at monthly variance review

BU (the aggregator):
  Reviews team variances at monthly cadence
  Reallocates within their BU if needed (one team's slack
  goes to another team's growth)
  Reports to org leadership at quarterly variance

ORG (the strategic):
  Reviews quarterly trajectory
  Approves budget raises / structural changes
  Plans annual budget for next year
```

### How ZopNight implements the pyramid

```
ZOPNIGHT BUDGET ENTITY supports:
  Per-resource budget (M3.6.L2)
  Per-resource-group budget
  Per-team budget
  Per-org budget (implicit; sum + variance)

ROLLUP is automatic:
  Each team's actual spend computed from cost_records
  Per-team budget aggregates resource budgets
  BU budget aggregates team budgets
  Org budget aggregates BU budgets (or directly aggregates teams)
  
VARIANCE at each level:
  Surfaced in Budget Health dashboard
  Notifications routed per the escalation chain (L2)
```

---

## 2. Demo

A mid-size org's budget pyramid:

```
ORG BUDGET (FY 2026):    $12M annual / $1M monthly
ALLOCATED to:

BU PLATFORM (engineering platform team):     $4M annual / $333K monthly
  Team Platform-Core:                          $2M
  Team Platform-Data:                          $1M
  Team Platform-Security:                      $0.5M
  BU overhead (shared infra):                  $0.5M
                                                ─────
  BU subtotal:                                  $4M ✓

BU PRODUCT (product engineering):             $6M annual / $500K monthly
  Team Product-Web:                             $3M
  Team Product-Mobile:                          $2M
  Team Product-API:                             $0.7M
  BU overhead:                                  $0.3M
                                                ─────
  BU subtotal:                                  $6M ✓

BU DATA (data team):                          $1.5M annual / $125K monthly
  Team Data-ETL:                                $1M
  Team Data-Analytics:                          $0.4M
  BU overhead:                                  $0.1M
                                                ─────
  BU subtotal:                                  $1.5M ✓

ORG OVERHEAD (central FinOps + security):     $0.5M annual / $42K monthly

SUM:    $4M + $6M + $1.5M + $0.5M = $12M annual ✓
        Matches org budget. No over/under allocation.

CADENCE:
  Weekly: each team reviews their number; projects to month-end
  Monthly: BU lead reviews team variances; reallocates if needed
  Quarterly: org leadership reviews BU variances; re-baselines
```

The pyramid is internally consistent. Each level can drill down to investigate; each level can roll up to see context.

---

## 3. Hands-on (5 min)

Sketch your team's budget pyramid:

```
ORG BUDGET (monthly):    $__________

BU 1: __________  ($__________)
  Team 1.1:         $__________
  Team 1.2:         $__________
  BU overhead:      $__________
  Subtotal:         $__________  (matches BU? Y/N)

BU 2: __________  ($__________)
  Team 2.1:         $__________
  BU overhead:      $__________
  Subtotal:         $__________

ORG OVERHEAD:       $__________

GRAND TOTAL:        $__________
MATCHES org budget? Yes / No

PITFALL CHECK:
  □ Over-allocated (sum > org)
  □ Under-allocated (sum < org by a meaningful amount)
  □ Static (not revised in 6+ months)
  □ Org overhead hidden (not explicitly listed)
```

If the grand total doesn't match the org budget, fix the math before proceeding. The pyramid only works when the levels reconcile.

---

## 4. Knowledge check

### Q1
Team budgets sum to $1.2M, org budget is $1M. Mismatch:

A. Acceptable for buffer
B. Over-allocation. Either reduce team budgets or raise org budget. The two must agree — if teams each think they have $X and collectively spend $X+$Y, the org budget overrun is guaranteed. Reconcile before publishing.
C. Random
D. Cloud limits

<details>
<summary>Show answer</summary>

**Correct: B.** Allocations must add up. Mismatch is a math error to fix, not a buffer.
</details>

### Q2
Per-team budgets without org rollup:

A. Optimal for engineering focus
B. Misses the org-level picture. Variance in one team is invisible at the org level; cross-team patterns are missed; exec-level totals unclear. Pyramid structure provides both views — team for accountability, org for strategic.
C. Random
D. Better than nothing

<details>
<summary>Show answer</summary>

**Correct: B.** Pyramid is the structure that handles both levels.
</details>

### Q3
Monthly variance analysis at the pyramid:

A. Skip — wait for quarter
B. Investigate variance at each level: which team(s) drove the gap, which causes (legitimate growth vs waste), document for next month's planning. The pyramid's value comes from the analysis at each level.
C. Random
D. Only at org level

<details>
<summary>Show answer</summary>

**Correct: B.** Variance analysis is the operate cadence at every level.
</details>

---

## 5. Apply

Build the pyramid at [Settings → Budgets](https://app.zopnight.com/settings/budgets). Start with team budgets; aggregate to BU; check the org sum reconciles.

For new orgs, the pyramid is usually flat for the first quarter (just team + org). Add BU layer when team count exceeds 5-7 — the BU layer reduces cognitive load at the org level.

---

## Related lessons

- [L2 — Threshold escalation paths](L2_escalation.md) *(next)*
- [L3 — Raise vs enforce](L3_raise_vs_enforce.md)
- [L4 — Budget as conversation](L4_conversation.md)
- [T3.M3.6 — Budget product mechanics](../../T3_zopnight_architect/M3.6_budget_governance/00_README.md)

## Glossary terms touched

[Budget pyramid](../../../reference/glossary/budget-pyramid.md) · [Over-allocation](../../../reference/glossary/over-allocation.md) · [Under-allocation](../../../reference/glossary/under-allocation.md) · [Org overhead](../../../reference/glossary/org-overhead.md) · [Rollup](../../../reference/glossary/rollup.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.4.L1
