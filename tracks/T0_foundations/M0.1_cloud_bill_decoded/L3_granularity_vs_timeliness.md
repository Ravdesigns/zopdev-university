# Granularity vs. timeliness — the trade-off you didn't choose

§ T0 · M0.1 · L3 of 5 · Operator tier · 7 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why every cloud bill is at least 24 hours behind real time, **and pick** the right granularity band for any cost question.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Tell me what we spent today — and don't lie." |
| **Personas** | Platform Engineer · FinOps Analyst · Engineering Leader |
| **Prerequisites** | [L1](L1_what_is_in_a_cloud_bill.md), [L2](L2_pick_your_billing_source.md) |
| **Time** | 7 minutes |
| **Bloom verb** | Explain (Understand) |

---

## 1. Concept

Cloud billing is structurally lagged. Every provider works the same way: usage events stream through metering, get rated against the price catalog, get attributed against any active reservations or savings plans, and only then land in the bill. The pipeline takes hours. The published numbers settle a day later.

This lag is not a bug. It is the cost of an accurate bill. Force the bill to update faster and one of three things gives way: the per-resource attribution gets weaker, the reservation distribution gets sloppy, or the numbers re-write themselves overnight as late events arrive.

### The three bands

```
BAND                  LATENCY      GRANULARITY      COST QUESTION IT ANSWERS
────────────────────────────────────────────────────────────────────────────
LIVE (calculated)     0 seconds    Per resource     "What is running right now,
                                                     priced at the rate card?"
DAILY BILLING         18–36 hrs    Per resource     "What was actually charged
                                                     yesterday?"
MONTHLY SETTLED       3–10 days    Per resource     "What is the final
  past month closing                                authoritative invoice?"
```

**Live (calculated).** Computed by multiplying the current state (running, stopped, instance type, region) by the public rate card. Always available. Always rack-rate. The number is real but it is not the bill. ZopNight's `cost_usd` column carries this number — see [L1 of M0.4](../M0.4_rack_rate_vs_billing/L1_rack_rate.md).

**Daily billing.** What the cloud provider actually charged for yesterday. Reflects discounts, reservation distribution, savings-plan amortization. Becomes available 18 to 36 hours after the day closes. ZopNight's `actual_cost_usd` column carries this number when billing sync is configured.

**Monthly settled.** The closed-out invoice. Provider may revise daily numbers retroactively as late-arriving metering events or reservation adjustments post. Final by the 5th–10th of the following month.

### The mistake everyone makes once

The first time a Finance partner sees "real-time cost data" in a SaaS dashboard, they ask the engineering team to reconcile it against the cloud invoice. The numbers do not match. The Finance partner concludes the SaaS tool is wrong.

What actually happened: the SaaS tool showed live calculated cost (rack rate), the invoice carried daily billing (post-discount). Both are correct. They answer different questions.

The fix is to label which column is which. A tool that says "$1,247 today" without saying *which kind of $1,247* is mis-managing the trust gradient. ZopNight surfaces both labels on the Reports summary — see [the two-source cost model](../M0.4_rack_rate_vs_billing/L4_two_source_model.md).

### Pick the band by the question

```
QUESTION                                      → BAND
─────────────────────────────────────────────────────────────
"Are we leaving things on right now?"         → LIVE
"What did EC2 cost yesterday?"                → DAILY BILLING
"What did EC2 cost last month, final?"        → MONTHLY SETTLED
"Anomaly happening in the last hour?"         → LIVE (with a 24h check)
"Variance vs budget for the closed month?"    → MONTHLY SETTLED
"Did the new schedule save what we expected?" → DAILY BILLING, week-over-week
```

A common error: using live calculated cost for budget reporting. The budget is set against billed amounts (post-discount); the live number is rack rate (pre-discount). Reporting against the wrong band makes every team look 15 to 40 percent over budget when they are on track.

---

## 2. Demo

The same EC2 instance, three bands at the same wall-clock moment (10:00 AM Tuesday, two days into the month):

| Source | Number | Interpretation |
|---|---|---|
| Pricing API × hours running this month so far | **$98.40** | Live, calculated, rack rate, no discount |
| AWS Cost Explorer for yesterday (Monday) | **$3.84** | Billed for one day, post-discount |
| AWS CUR for the past three days, summed | **$11.20** | Billed, post-discount, but Sunday's last 4 hours may still be re-rating |

Three correct numbers. Three different questions answered.

(Asset to produce: side-by-side screenshot of ZopNight Reports showing live rack-rate trend and daily billing trend with the labelled gap between them. Path: `assets/screenshots/M0.1_L3_three_bands.png`.)

---

## 3. Hands-on (5 min)

1. Pick one running EC2 / Compute Engine / Azure VM.
2. Compute the live rack rate manually: `hourly_rate × hours_since_month_start`. The hourly rate is at the provider's pricing page.
3. Pull yesterday's billed cost for the same resource using the CLI block from [L2](L2_pick_your_billing_source.md).
4. Multiply yesterday's billed cost by the number of days elapsed this month.
5. Compare the two numbers. The gap is the effective discount running on this resource.

If the live rack rate is **lower** than the billed-cost-times-days estimate, the instance was running fewer hours than wall-clock would suggest (a schedule fired) or the rate card published today differs from yesterday's (rare but happens at major price changes).

---

## 4. Knowledge check

### Q1
A vendor advertises "real-time cloud cost." This is most accurately interpreted as:

A. Cloud providers publish hourly bills now
B. The vendor is computing live rack rate from the pricing API. The actual bill is still 24+ hours lagged.
C. The vendor has direct access to AWS internal metering
D. The vendor is approximating, badly

<details>
<summary>Show answer</summary>

**Correct: B.** Live cost is always calculated, not billed. Providers do not publish sub-daily bills. A is wrong (no provider does this). C is fantasy (no vendor has internal metering access). D is too cynical — calculated live cost is a real and useful number; it is just not the bill.
</details>

### Q2
A team reports that their FinOps tool shows $14,000 spent today, but the AWS console shows $11,200 for the month so far including today. Which is most likely true?

A. The FinOps tool is broken
B. The console is showing billed cost (post-discount, lagged); the FinOps tool is showing live rack rate (pre-discount). Both are correct.
C. AWS Cost Explorer is broken
D. The team is using the wrong AWS account

<details>
<summary>Show answer</summary>

**Correct: B.** This is the textbook live-vs-billed mismatch. The gap of ~25% is consistent with typical effective discount (RI + Savings Plan + sustained-use). The team needs to read which column they are looking at.
</details>

### Q3
Budget variance reports should be sourced from which band?

A. Live calculated
B. Daily billing (rolled to month-to-date)
C. Monthly settled
D. Whichever is highest

<details>
<summary>Show answer</summary>

**Correct: B.** Budgets are set against billed amounts. Daily billing rolled MTD is the correct match. Monthly settled is too late for in-flight management. Live calculated is rack rate, mismatched against a billed budget.
</details>

---

## 5. Apply

ZopNight separates the two bands explicitly on every report. The Reports header carries a **Cost Source** label — `Unblended Cost` when billing sync is active, `Rack Rate` when not. The Reports → Trend chart can split a data point into `actualCostUsd` and `calculatedCostUsd` so the gap is visible.

For anomaly detection (15-minute cadence), ZopNight uses **live calculated cost** because it needs a stream that updates faster than 24 hours. Once the billed cost lands, the anomaly is re-confirmed against actual. The detection cron at 04:30 UTC daily uses billed data for the previous full day.

[Open ZopNight Reports → Trend](https://app.zopnight.com/reports/costs) *(deep link)*

---

## Related lessons

- [L2 — Pick your billing source](L2_pick_your_billing_source.md)
- [L4 — Tags, labels, and the cost-attribution problem](L4_tags_and_attribution.md) *(next)*
- [T0.M0.4.L4 — The two-source cost model](../M0.4_rack_rate_vs_billing/L4_two_source_model.md)
- [T2.M2.10 — Cost anomaly detection](../../T2_zopnight_engineer/M2.10_cost_anomaly/00_README.md)

## Rule references

- [`RC-001` Idle EC2](../../../reference/rules/RC-001.md) — uses calculated cost for the live signal, billed cost for the verified savings

## Glossary terms touched

[Live calculated cost](../../../reference/glossary/live-calculated-cost.md) · [Daily billing](../../../reference/glossary/daily-billing.md) · [Monthly settled](../../../reference/glossary/monthly-settled.md) · [Effective discount](../../../reference/glossary/effective-discount.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.1.L3
