# The savings estimator

§ T1 · M1.3 · L6 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **read** the savings estimator on a schedule **and explain** the math behind theoretical vs. realistic savings.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Quote a defensible savings number before the schedule fires." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | T0 M0.3 (the math), [L1–L5](L1_schedule_anatomy.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Read (Understand) and Explain (Understand) |

---

## 1. Concept

After resources are attached to a schedule, the schedule detail page displays a savings estimator. It computes the expected monthly savings from running the schedule on the current set of attached resources.

### What the estimator shows

```
SAVINGS ESTIMATE — non-prod-business-hours
─────────────────────────────────────────────────────────
Attached resources:       234
Always-on monthly cost:   $32,400 (rack rate, calculated)
Schedule active hours/wk: 60     (Mon-Fri 8am-8pm)
Schedule inactive hrs/wk: 108    (nights + weekends)
Theoretical savings %:    64.3%
Theoretical $ savings:    $20,820/month

Realism factor:           0.7
Estimated realized:       $14,574/month
Annual run-rate:          $174,890/year

UPDATED:                  Now (live calculation from pricing API)
```

The numbers are computed from the schedule's crons (active hours per week), the attached resources' rack-rate cost (from the pricing API, live), and a configurable realism factor.

### The math, step by step

```
1. Active hours per week
   Count hours when at least one cron has ON state in the grid.
   For Business Hours preset:  60 hours/week
   For Weekend Scale-Down:    112 hours/week
   For Peak Hours:             77 hours/week

2. Inactive hours per week
   168 - active hours

3. Theoretical savings %
   inactive_hours / 168
   For Business Hours: 108 / 168 = 64.3%

4. Theoretical $ savings per month
   sum(attached_resources.rack_rate_monthly) × theoretical_pct
   = $32,400 × 0.643 = $20,820

5. Realistic $ savings per month
   theoretical × realism_factor (default 0.7)
   = $20,820 × 0.7 = $14,574
```

The realism factor accounts for the friction discussed in [T0 M0.3 L1](../../T0_foundations/M0.3_scheduling_vs_commitments/L1_168_hour_math.md):

- Some non-prod legitimately runs nights (overnight batch tests)
- Restart latency disturbs developer workflows
- Time-zone spread for global teams
- Override usage during specific work windows

The default 0.7 factor is a conservative starting estimate. Customers can adjust the factor on their organization's settings if their historical realized savings deviate.

### Why rack rate, not billed cost

The estimator uses **rack rate** (calculated cost from the pricing API), not billed cost. The reasoning (covered in [T0 M0.4 L1](../../T0_foundations/M0.4_rack_rate_vs_billing/L1_rack_rate.md)):

- The savings claim is for *avoided hours*. The discount stack (RIs, SPs, sustained-use) applied to the hours the resource was running, not to the hours that are now avoided.
- Quoting rack rate captures the full value of the avoided hours, not the post-discount remnant.
- Using rack rate matches industry convention for savings quotes.

The estimator's number is the right number to take to Finance. A team that uses billed cost for savings claims will systematically under-credit the schedule's value.

### Why the estimator is always available

Two reasons:

1. **The estimator runs against rack rate**, which is computed live. It doesn't depend on billing sync.
2. **Active / inactive hours are derived from the cron grid**, not from past behavior. So the estimate works on day 1 of a new schedule, before any billing data exists.

By contrast, *realized* savings (what actually happened) requires billing data and a few days of history. Those numbers appear in Reports → Savings Trend (covered in M1.6).

### How the estimator changes when resources are added or removed

The estimate refreshes when the attached resource set changes:

```
BEFORE: 234 resources attached
        $32,400 monthly cost
        $14,574 estimated savings

ADD:    47 more resources (filter to "GCP databases")
AFTER:  281 resources attached
        $41,200 monthly cost
        $18,531 estimated savings
```

The estimator is a planning tool — try different attachment configurations to see the savings impact before committing.

### When to trust the estimator vs. realized

Three windows:

```
WHEN                          USE
─────────────────────────────────────────────────────────
Day 0 (planning)              Estimator (no realized data exists)
Day 7-30 (early)              Compare estimator to early realized
Day 30+ (mature)              Trust realized over estimator
```

The estimator is a *projection*. Over 30 days, the realized data is the truth. If the realized is significantly different (e.g., realized is 35% but estimator said 50%), investigate:

- Are overrides being used heavily?
- Are some attached resources not being acted on (permission issue)?
- Is the realism factor wrong for this workload?

A well-tuned organization sees realized within 10% of estimated.

### When the estimator shows zero or surprisingly low

A few causes:

**No attached resources.** The schedule is empty. Attach resources (L5).

**Attached resources have $0 rack rate.** The pricing API doesn't have rates for some resource type, region, or instance type. Rare but happens with new instance families.

**Schedule has gaps that cancel themselves.** A schedule with start cron at 8 AM and stop cron at 9 AM (1-hour ON window) has 167 inactive hours/week — theoretically 99% savings. The estimator computes correctly but the schedule design is likely wrong.

---

## 2. Demo

A real schedule's estimator output:

```
SCHEDULE: dev-staging-business-hours
RESOURCES: 187 attached (mixed: EC2, RDS, EKS nodegroups, ECS services)

INPUT
  Cron #1   "0 8 * * 1-5"     Start
  Cron #2   "0 20 * * 1-5"    Stop
  Cron #3   "0 0 * * 0,6"     Stop (weekend belt)
  Timezone  America/Los_Angeles

CALCULATIONS
  Active hours/week:    60
  Inactive hours/week:  108
  Theoretical %:         64.3%
  
  Rack-rate monthly:    $48,720 (sum across 187 resources)
  Theoretical savings:  $31,327/month
  
  Realism factor:        0.7
  Estimated realized:   $21,929/month
  Annual run-rate:      $263,148/year

CONFIDENCE
  - Pricing data:  100% coverage (all 187 resources have rack rates)
  - Attached set:  Verified — no production resources
  - Realism:       0.7 default (no historical data yet)

DECISION
  Save and activate the schedule. Re-check realized at day 30.
```

The team takes $263,148 annual estimate to Finance as the schedule's business case. The estimate is defensible because the math is transparent.

(Asset: `assets/diagrams/M1.3_L6_estimator.svg`.)

---

## 3. Hands-on (6 min)

For your test schedule with attached resources:

```
1. Open the schedule detail page.
2. Find the "Savings Estimate" panel.
3. Note the four numbers:
   - Attached resources count
   - Monthly rack-rate cost
   - Theoretical savings %
   - Estimated realized $/month

4. Verify the math:
   - Active hours/week from your crons: ____
   - Inactive: 168 - active = ____
   - Theoretical %: inactive / 168 = ____%
   - Multiply by monthly cost = theoretical $
   - Multiply by 0.7 = realistic $

5. If your computed numbers match what the estimator shows: the math is
   correct, the estimator works as documented.

6. Note the annual run-rate. This is the number to share with Finance.
```

---

## 4. Knowledge check

### Q1
The estimator uses rack rate (not billed cost) because:

A. ZopNight doesn't have access to billing data
B. The savings claim is for avoided hours. The discount stack applied to the running hours, not to the avoided hours. Rack rate is the right column for "what would this have cost without the schedule."
C. Rack rate is bigger and looks better
D. Billed cost is too slow to compute

<details>
<summary>Show answer</summary>

**Correct: B.** This is the core reason. Rack rate is industry-standard for savings claims; billed cost under-credits the schedule's value.
</details>

### Q2
A schedule's estimator shows $14,000/month estimated savings. After 30 days, the realized savings is $8,500/month. Most likely diagnosis:

A. The estimator is broken
B. Investigate the realism factor and the attached resource set. Likely causes: heavy override usage, some attached resources not actually scheduling (permission issue), or the realism factor (0.7) is too generous for this workload. Adjust factor downward if persistent.
C. The cloud provider is wrong
D. ZopNight's pricing API is stale

<details>
<summary>Show answer</summary>

**Correct: B.** Realized below estimated is informative. Three common causes: overrides, permission gaps, wrong realism factor. Adjust based on observation.
</details>

### Q3
A team adds 50 more resources to a schedule. The estimator updates to show $4,200 additional monthly savings. The math behind this number:

A. Magic
B. Sum the rack rate of the 50 new resources, multiply by the theoretical %, multiply by the realism factor. The estimator re-runs the same calculation against the new attachment set.
C. AWS API call
D. Random sample

<details>
<summary>Show answer</summary>

**Correct: B.** The estimator is deterministic. Adding resources increases the cost base; the savings % stays the same (depends on crons, not resources); the new savings $ is proportional to the added cost.
</details>

---

## 5. Apply

The estimator surface:

- **[Schedule detail page](https://app.zopnight.com/schedules)** → Savings Estimate panel
- **Realism factor setting** lives in Organization Settings → Cost (default 0.7, adjustable per org)
- **Realized savings (post-firing)** appears in Reports → Savings Trend (covered in M1.6)

For a deeper savings analysis after the schedule runs, see [M1.6 L1 — State history timeline](../M1.6_history_notifications_audit/L1_state_history.md).

---

## Module quiz

You have now completed all six lessons of M1.3. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.3-quiz](../../../certifications/operator/m1.3-quiz.md). Pass to earn the **Schedule-Builder** chip.

---

## Related lessons

- [M1.4 — Resource Groups](../M1.4_resource_groups/00_README.md) *(next module)*
- [T0.M0.3 L1 — The 168-hour math](../../T0_foundations/M0.3_scheduling_vs_commitments/L1_168_hour_math.md)
- [T0.M0.4 L1 — Rack rate](../../T0_foundations/M0.4_rack_rate_vs_billing/L1_rack_rate.md)

## Glossary terms touched

[Savings estimator](../../../reference/glossary/savings-estimator.md) · [Realism factor](../../../reference/glossary/realism-factor.md) · [Theoretical savings](../../../reference/glossary/theoretical-savings.md) · [Realized savings](../../../reference/glossary/realized-savings.md) · [Annual run-rate](../../../reference/glossary/annual-run-rate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.3.L6
