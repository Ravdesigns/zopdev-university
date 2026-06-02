# Schedule first, then commit

§ T4 · M4.7 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **defend** the "schedule first, commit on the floor" rule with the math, **compute** the proven floor for a workload, **and design** a combined optimization (schedule + commit) that captures both savings layers.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Capture savings from BOTH scheduling and commitments, not from one at the cost of the other." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader |
| **Prerequisites** | M4.7.L1-L3 (commitment fundamentals) · T1 (scheduling) |
| **Time** | 9 minutes |
| **Bloom verb** | Defend (Evaluate), Compute (Apply), Design (Create) |

---

## 1. Concept

The most important commitment rule in FinOps:

```
SCHEDULE WORKLOADS WHERE POSSIBLE
THEN COMMIT ON THE PROVEN FLOOR
```

This rule combines two distinct savings layers — scheduling cuts hours; commitment cuts rates. Each is a multiplier. Combining them captures both; doing one without the other captures one.

### Why the rule is mathematically airtight

```
SCHEDULED workloads run partial hours
COMMITMENTS assume the resource runs 24/7
Combining a commitment with a schedule = under-utilization
  (paying committed rate for hours the resource isn't running)

THE FLOOR is what the workload runs even after scheduling
The floor is stable and predictable
Commit on the floor only; everything above can be on-demand
```

### The math — concrete example

```
NON-PROD WORKLOAD: 100 instances always-on at $100/mo each
TOTAL: $10K/mo on-demand baseline

APPROACH A — Commit everything, no schedule:
  Buy RIs for all 100 at 30% discount
  Cost: $7K/mo
  Savings: $3K/mo (30%)
  
APPROACH B — Schedule, no commit:
  Schedule 60% of hours off (overnight + weekends)
  40% remaining hours running on-demand
  Cost: 40 × $100 = $4K/mo
  Savings: $6K/mo (60%)
  
APPROACH C — Schedule + commit on floor:
  Schedule 60% off → equivalent of 40 instances running 24/7
  Commit 40 instances at 30% discount
  Cost: 40 × $100 × 0.7 = $2.8K/mo
  Savings: $7.2K/mo (72%)
  
WINNER: Approach C captures both layers.
  C beats A by $4.2K/mo (2.4× savings)
  C beats B by $1.2K/mo (20% more savings)
```

The math compounds: scheduling cuts hours; commitment cuts the rate on those hours. Combining them stacks the discounts.

### Approach A's hidden failure

Approach A — committing everything without scheduling — is the silent failure. The 30% discount looks great on paper, but the underlying workload was scheduled-eligible. Approach A locks in 70% of the full cost when scheduling could have cut hours by 60%.

```
APPROACH A in detail:
  100 instances on-demand: $10K/mo
  100 instances RI at 30% discount: $7K/mo
  Apparent savings: $3K/mo (30%)
  
  BUT — workload doesn't need 24/7 hours.
  60% of hours were waste (could have been scheduled off).
  
  Real savings vs ideal: $3K/mo vs $7.2K/mo
  $4.2K/mo of opportunity lost to over-commitment.
```

This is Pattern 1 from L3 (non-prod commitment) in full clarity.

### The proof step — wait before committing

```
WAIT 60-90 DAYS after scheduling rollout before committing.

WHY:
  Schedule effect is real but settles over weeks
  Engineers adjust to scheduled environments
  Override patterns emerge (some teams need exceptions)
  Actual floor becomes clear
  
WITHOUT 60-day wait:
  Commit on speculative floor (often lower than reality)
  Realized floor is higher → under-coverage
  OR: commit higher than necessary → over-commitment
  
THE 60-DAY DATA:
  After 60 days, you have:
    - Actual schedule fire rate
    - Actual override rate
    - True minimum running capacity
    - Variance pattern (is the floor stable or seasonal?)
```

### Floor calculation

For a typical scheduled workload:

```
WORKLOAD: 100 instances, scheduled on 8AM-8PM weekdays

WEEKLY HOURS CALCULATION:
  Total possible hours: 168 (24 × 7)
  Scheduled-on hours: 60 (Mon-Fri, 8AM-8PM = 12 × 5)
  Scheduled-off hours: 108
  
  Floor %: 60 / 168 = 35.7%

INSTANCE-HOURS PER WEEK:
  100 instances × 168 hours = 16,800 max
  Scheduled-on: 100 × 60 = 6,000 instance-hours

EQUIVALENT 24/7 INSTANCES:
  6,000 instance-hours / 168 hours per instance = 35.7 instances
  
COMMIT TARGET: 36 instances (slight buffer for overrides)

VERIFICATION via ZopNight after 60 days:
  Actual instance-hours: __________
  Calculated equivalent: __________
  Matches estimate? ±5%
```

The "equivalent 24/7 instances" is what you commit on. That's the proven floor.

### Combined optimization across workload classes

A typical mature estate has different optimization at each layer:

```
WORKLOAD LAYER                  OPTIMIZATION
──────────────────────────────────────────────────────────────────
Peak / burst demand              On-demand (variable; no commit)
                                
Steady production floor          RI / SP commitment (predictable;
                                 24/7 utilization assumed)
                                
Non-prod operational             Schedule on/off (variable; no commit)
                                
Stateless batch                  Spot (interruptible; no commit)
                                
Mixed: scheduled-on + commit on   Schedule reduces hours; commit on
floor                            the proven floor
```

Each layer has its own optimization. The rule "schedule first, commit on floor" applies to layers where both apply.

### Why the rule sticks (defending it to skeptics)

```
SKEPTIC: "We should commit everything. The discount is real."

YOU: "The discount is real but multiplied by utilization. A 30%
discount with 35% utilization is 10.5% effective. A 0% commit
(no discount) plus a 60% schedule cut is 60% effective. The
math favors scheduling first."

SKEPTIC: "What if the floor moves?"

YOU: "We commit on the floor we've proven over 60+ days. We
re-baseline every renewal cycle (annually for 1-yr commits, 
quarterly review for 3-yr). The floor for stable workloads
is very stable; we measure it before we lock in."

SKEPTIC: "Scheduling is annoying for engineers."

YOU: "It's a one-time setup. Engineers adapt to scheduled
environments within 2-3 weeks. The override mechanism handles
exceptions. The savings dwarf the operational friction."
```

The rule is defensible because the math is airtight. Don't accept the bad commit unless the math actually supports it.

### Common mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Commit before scheduling                   Schedule first; observe
                                          60 days; then commit
                                          
Commit on peak                              Commit on proven floor
                                          (equivalent 24/7 instances)
                                          
Use scheduling on committed workloads      Defeats the commit;
                                          either schedule OR commit
                                          per layer, not both on
                                          the same hours
                                          
Skip the 60-day wait                       Verify the floor before
                                          committing
                                          
Commit "for safety" above current usage    Over-commitment risk;
                                          conservative + add later
                                          beats over-buying
```

### How ZopNight supports schedule-first

```
SURFACE                          USE
──────────────────────────────────────────────────────────────────
Reports → Cost Flow              See per-layer breakdown
                                  (committed / scheduled / on-demand)
                                 
Schedule rollout report           Track schedule fire rate post-rollout
                                  + override rate
                                 
Commitment Optimizer              Suggests RI/SP based on the proven
                                  floor (after 60+ days of scheduled
                                  data)
                                 
Saved schedules                   Per-workload schedule definitions
                                  with override budget
```

The product is designed to support the workflow: schedule first, observe, then commit.

---

## 2. Demo

A production workload analysis showing the math:

```
PROD WORKLOAD: 80 instances 24/7 baseline (no scheduling, no commits)
COST: $80 × 730 hr × $0.10 = $5,840/mo per 80 = $584/instance/mo

APPROACH A — Commit all 80 instances:
  RIs at 40% discount on all 80
  Cost: 80 × $584 × 0.6 = $28,032/mo
  Savings: $18,752/mo
  Effective discount: 40%

APPROACH B — Schedule 30 non-essential instances, no commits:
  50 instances run 24/7: $29,200/mo
  30 instances scheduled 60% off: 30 × $584 × 0.4 = $7,008/mo
  Total: $36,208/mo
  Savings: $10,624/mo vs baseline
  Mixed effective: 22.7%
  
APPROACH C — Schedule + commit on floor:
  Schedule 30 instances off 60% of hours → equivalent of 12 instances 24/7
  Total floor: 50 + 12 = 62 instances equivalent
  Commit 62 instances at 40% discount: 62 × $584 × 0.6 = $21,725/mo
  Remaining peak (above floor): on-demand
  Cost total: $21,725/mo
  Savings: $25,107/mo vs baseline
  Effective discount: 53.7%

WINNER: Approach C
  C beats A by $7,075/mo (annual: $85K)
  C beats B by $14,483/mo (annual: $174K)

The combined approach captures savings from both layers.
```

---

## 3. Hands-on (5 min)

For your team's workloads, identify schedule-vs-commit fit:

```
WORKLOAD 1: __________
  Class: prod / non-prod / batch / mixed
  Schedule-eligible? Yes / No / Partial
  Commit-eligible? Yes / No / Partial
  
  PROPOSED APPROACH:
  □ Schedule + commit on floor (combined)
  □ Schedule only (no commit yet)
  □ Commit only (no schedule applicable)
  □ On-demand only (truly unpredictable)
  
WORKLOAD 2: __________
  Class: __________
  Schedule-eligible? __________
  Commit-eligible? __________
  PROPOSED APPROACH: __________

CURRENT STATE: scheduling deployed? Commits in place?
  □ Both deployed
  □ Scheduling only
  □ Commits only (POTENTIAL OVER-COMMITMENT RISK)
  □ Neither
  
60-DAY DATA available?
  Yes — proven floor: __________ instance-equivalent
  No — wait before committing

NEXT STEP:
  □ Deploy schedules to schedule-eligible workloads
  □ Wait 60 days for data
  □ Then commit on the proven floor
```

If your current state is "commits only," investigate immediately — Pattern 1 from L3 is the likely diagnosis.

---

## 4. Knowledge check

### Q1
A team buys RIs for non-prod resources without scheduling:

A. Best practice
B. Non-prod commitment fallacy (Pattern 1 from L3). The team is paying committed rates for resources that could have been scheduled off. Schedule first; commit on the floor. The combined approach captures both savings layers; commit-only captures one.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule first; commit on the proven floor.
</details>

### Q2
The 60-day wait between scheduling rollout and commitment:

A. Unnecessary bureaucracy
B. Ensures the schedule effect is settled and the real floor is known. Committing earlier means guessing the floor; the realized floor will differ from the guess. 60 days of data gives confidence in the floor estimate ±5%.
C. Random
D. Should be skipped to save time

<details>
<summary>Show answer</summary>

**Correct: B.** Wait for stability. The proof step matters.
</details>

### Q3
Combined approach (schedule + commit floor) vs either alone:

A. Same outcome
B. Best. Captures savings from BOTH scheduling (hours cut) AND commitment (rate cut). Each lever fits a different layer. The combination produces 50-70% savings in most non-prod workloads, vs 30-40% for either alone.
C. Worse than commit-only
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Combined is best. The two layers stack.
</details>

---

## 5. Apply

For each workload class: identify schedule-eligibility, deploy schedules where applicable, observe 60+ days, commit on the proven floor. ZopNight's Commitment Optimizer can recommend the floor-based commitment after sufficient scheduling data is available.

For mature teams, this is the discipline that produces 50-70% net effective discounts.

---

## Related lessons

- [L1 — Four commitment instruments](L1_four_levers.md)
- [L2 — Effective discount math](L2_effective_discount.md)
- [L3 — Over-commitment patterns](L3_over_commitment.md)
- [L5 — Share-of-savings vendors](L5_share_of_savings.md) *(next)*
- [T5.M5.2 — Schedule patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Proven floor](../../../reference/glossary/proven-floor.md) · [60-day observation](../../../reference/glossary/60-day-observation.md) · [Combined optimization](../../../reference/glossary/combined-optimization.md) · [Schedule-eligibility](../../../reference/glossary/schedule-eligibility.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.7.L4
