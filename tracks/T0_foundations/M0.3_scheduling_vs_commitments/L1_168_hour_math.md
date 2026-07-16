# The math: 168 hours, 60-hour workweek, 64% off

§ T0 · M0.3 · L1 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** the theoretical maximum scheduling savings on any non-prod estate **and explain** the gap between theoretical and realistic savings.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Build a defensible savings business case for scheduling, with the math behind it." |
| **Personas** | All five |
| **Prerequisites** | M0.1 + M0.2 complete |
| **Time** | 10 minutes |
| **Bloom verb** | Calculate (Apply) |

---

## 1. Concept

The arithmetic of scheduling is unforgiving and arrives at one number.

```
HOURS IN A WEEK                                168
TYPICAL WORKWEEK USEFUL HOURS                   60 (Mon–Fri, 12 hrs each, generous)
RATIO                                       60 / 168 = 35.7%
NON-WORKWEEK HOURS (idle in non-prod)        108 / 168 = 64.3%
```

For any resource that is **only** useful during a workweek window, the resource sits idle 64 percent of the calendar week. Stopping it during those idle hours recovers that 64 percent of the cost.

Most non-prod workloads fit this profile. Dev environments. Staging clusters. Ephemeral test infrastructure. Reporting databases that only feed business hours.

The 64 percent number is the theoretical ceiling. Reality is lower because of three frictions:

1. **Some non-prod legitimately runs nights** — long-running batch tests, overnight integration runs.
2. **Restart latency** — first call after a cold start hits a 1–3 minute warm-up that disturbs developer workflow if the schedule is too aggressive.
3. **Time-zone spread** — a global engineering team needs different work windows.

Adjusting for these, the realistic ceiling is 45–55 percent of non-prod compute spend, not 64 percent.

### Three workweek schedules and what they save

```
SCHEDULE                       USEFUL HOURS/WK    SAVINGS
─────────────────────────────────────────────────────────────
Aggressive: 9–6, Mon–Fri               45         73%
Standard:  8–8, Mon–Fri                60         64%
Generous:  8 AM–10 PM, M-Sat           84         50%
Weekend skip (Sat + Sun off)          120         28.6%
Always-on (no schedule)               168          0%
```

The trade-off is friction vs. savings. Aggressive schedules return more but require disciplined override patterns (engineers click "Force on" when they need to work late). Standard schedules are the default sweet spot in most organizations.

### What this means for a real bill

```
WORKED EXAMPLE
─────────────────────────────────────────────────────────────
Non-prod compute spend                  $40,000 / month
Schedule (Standard, 8–8 Mon–Fri)          64% off the non-prod compute
Theoretical monthly savings             $25,600
Realistic at 50%                        $20,000
Realistic at 40% (after friction)       $16,000
─────────────────────────────────────────────────────────────
```

A team going from 0 to 40 percent realized scheduling savings on non-prod compute, on a $40K monthly non-prod bill, recovers $16,000 per month. $192,000 per year. For one schedule on one tier of resources.

### What scheduling is NOT good for

Three workload profiles where scheduling does not help and can hurt:

- **Production traffic.** Customers do not care about your schedule. Production should not be scheduled off (with rare exceptions for explicitly non-24/7 products).
- **Continuous batch.** Jobs that legitimately must run nights.
- **Anything stateful with long restart cost.** Some databases. Some clusters. Some workloads with warm caches that take an hour to rebuild.

For everything else, the math is dominant.

### Compounding with rightsizing

Scheduling and rightsizing compound. A non-prod m5.2xlarge that should be m5.xlarge, scheduled off-hours, saves the rightsizing delta (~50% of compute) AND the scheduling delta (~50% of remaining hours). Combined savings on that single resource: ~75 percent.

This is why the lever sequence in [M0.2 L3](../M0.2_finops_principles/L3_optimize.md) puts scheduling first and rightsizing second. Each works on the others.

---

## 2. Demo

Real numbers, anonymized, from a SaaS company's first scheduling rollout:

```
RESOURCE                       BEFORE         AFTER          REALIZED
                              (on-demand,   (8-8 M-F          MONTHLY
                              168 hrs/wk)   schedule)         SAVINGS
─────────────────────────────────────────────────────────────────────
12× dev EC2 m5.xlarge          $1,728        $617             $1,111
4× staging RDS db.r5.xlarge     $1,440        $514             $   926
2× test EKS cluster (8 nodes)   $2,304        $823             $1,481
1× staging Databricks WS        $1,920        $685             $1,235
─────────────────────────────────────────────────────────────────────
TOTAL                          $7,392        $2,639           $4,753
                                                              (64% off)
```

One schedule applied to 19 resources. Monthly savings: $4,753. Annual: $57,036. Engineering time to set up: 4 hours.

(Asset: `assets/diagrams/M0.3_L1_before_after_table.svg` — bar chart showing the same data.)

---

## 3. Hands-on (7 min)

For your own non-prod estate, compute the scheduling business case:

```
STEP 1. Current monthly non-prod compute spend
         (from your cost tool, filter: environment=dev, test, stage)
         = $ ____________

STEP 2. Pick a schedule
         Aggressive (9-6 M-F)  73% theoretical
         Standard (8-8 M-F)    64% theoretical
         Generous (8-10 M-Sat) 50% theoretical

STEP 3. Apply a realism discount (typically 0.7× theoretical)
         Theoretical %     × 0.7   =   Realistic %

STEP 4. Multiply current spend by realistic %
         = $ ____________ /month realistic savings

STEP 5. Multiply by 12 = annual savings
         = $ ____________
```

The annual number is the business case. Take it to the next FinOps weekly meeting.

---

## 4. Knowledge check

### Q1
A team has $80K monthly non-prod compute spend. Standard schedule (8-8 M-F), realism discount 0.7×. Realistic monthly savings:

A. $51,200
B. $35,840
C. $28,672
D. $80,000

<details>
<summary>Show answer</summary>

**Correct: B.** $80,000 × 0.64 × 0.7 = $35,840 monthly. (A is theoretical max without realism discount. C is 0.6× × 0.6 — too pessimistic. D is the full spend.)
</details>

### Q2
A dev environment must support engineers across UTC-8, UTC, and UTC+8. Best schedule choice:

A. Aggressive 9-6 UTC
B. Standard 8-8 in each engineer's local timezone (run multiple schedules) — or pick a generous window that covers all three
C. Always-on
D. Custom per-engineer

<details>
<summary>Show answer</summary>

**Correct: B.** Global teams need timezone-aware scheduling. ZopNight schedules are timezone-aware (IANA format) — the right answer is multiple schedules, one per region, or a generous window. Always-on (C) gives up the savings. Per-engineer (D) is operational overhead.
</details>

### Q3
The math says scheduling saves 64 percent. A team that has scheduled non-prod sees only 28 percent realized savings. Most likely cause:

A. The math is wrong
B. Override usage is high, several long-running batch jobs run nights, and tag coverage is incomplete so some non-prod is not actually scheduled
C. The schedule did not fire
D. Cloud provider raised prices

<details>
<summary>Show answer</summary>

**Correct: B.** The gap between theoretical and realized is friction. The fix is to audit override patterns (are engineers force-on'ing nightly?), separate legitimate overnight work into its own schedule, and bring tag coverage above 95% so the schedule reaches every non-prod resource.
</details>

---

## 5. Apply

ZopNight surfaces the math directly:

- **Schedules → Savings Estimator** computes theoretical savings per schedule before saving.
- **Reports → Savings Trend** computes realized savings (rack rate of saved hours).
- **Reports → Cost Breakdown → Flow** shows the schedule's impact split per resource.

When a new schedule is attached to resources, the estimator quotes the projected savings. The first month's actual numbers come in via the daily billing sync.

[Open ZopNight Schedules](https://app.zopnight.com/schedules) *(deep link)*

---

## Related lessons

- [L2 — Commitments: what RIs, SPs, CUDs really save](L2_commitments.md) *(next)*
- [L4 — When scheduling wins, when commitments win](L4_decision_tree.md)
- [T1.M1.3 — Build your first schedule](../../T1_zopnight_operator/M1.3_first_schedule/00_README.md)

## Glossary terms touched

[Scheduling](../../../reference/glossary/scheduling.md) · [Theoretical savings](../../../reference/glossary/theoretical-savings.md) · [Realized savings](../../../reference/glossary/realized-savings.md) · [Realism discount](../../../reference/glossary/realism-discount.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.3.L1
