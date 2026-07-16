# The two-source cost model

§ T0 · M0.4 · L4 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **describe** the two-source cost model **and pick** the right source for any cost question.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Have one canonical cost model that everyone uses the same way." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | [L1](L1_rack_rate.md), [L2](L2_billing_cost.md), [L3](L3_amortized_azure.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Describe (Understand) and Pick (Apply) |

---

## 1. Concept

The **two-source cost model** is the architectural pattern ZopNight uses for cost data, and the recommended pattern for any FinOps practice: maintain *both* a live calculated cost (rack rate) *and* an actual billing cost (post-discount), label them explicitly, and pick the right one per question.

### Why two sources

A single-source cost model breaks under one of three pressures:

**Pressure 1 — Freshness vs. accuracy.** Billing data is 24+ hours lagged. Live calculated cost is real-time. A model that uses only one cannot serve both real-time anomaly detection and accurate invoice reconciliation.

**Pressure 2 — Pre-discount vs. post-discount.** Savings claims need rack rate (the avoided cost). Budget tracking needs billing cost (what was paid). Forcing one column to do both jobs leads to incorrect answers on at least one of them.

**Pressure 3 — Coverage gaps.** Not every account has billing sync configured. A new account may have running resources before the billing sync lands. A live calculated column ensures cost data exists from day one.

### The model

```
TWO COLUMNS, ONE TABLE
─────────────────────────────────────────────────────────────
cost_usd            = live calculated rack rate
                      pricing API × hours running × units
                      ALWAYS available, ZERO lag, NO discount

actual_cost_usd     = post-discount billing cost (provider source)
                      from CUR / Cost Explorer / Cost Mgmt
                      24–48 hr lag, post-discount, NULL if not yet synced

cost_source         = label: 'calculated' or 'actual'
                      tells the reader which column is authoritative
```

### How aggregations work

ZopNight uses a single SQL expression — `costColumn(hasBilling)` — across every aggregate query:

```sql
-- If ALL cloud accounts have billing sync, use actual_cost_usd everywhere
-- Otherwise fall back to cost_usd (rack rate) for consistency
SELECT 
  COALESCE(actual_cost_usd, cost_usd) AS cost
FROM cost_records
WHERE ...
```

The `hasBilling` predicate is resolved once per organization (cached for 60 seconds) and applied identically across summary, MTD, provider, budget, showback, and trends queries. The result: every number on every report comes from the same logic, no per-report drift.

### The cost-source label

Every report header carries the label "Unblended Cost" (when actual is used) or "Rack Rate" (when calculated is used). The label is the contract with the reader:

- **Unblended Cost** = billed, post-discount, lagged. Use for: budgets, chargeback, monthly close.
- **Rack Rate** = calculated, pre-discount, live. Use for: savings claims, anomaly detection, live monitoring.

A report that does not name its column is leaking trust. The two-source model is what makes the label honest.

### When a single source is sufficient

There are organizations where a single source is fine:

- **Very small, single-account.** Calculated cost is close enough; the discount stack is minimal.
- **Single-cloud, billing pipeline mature.** If billing data is consistently fresh and the discount stack is well-understood, the actual column alone may serve.

But for any multi-account, multi-cloud, or governance-heavy environment, the two-source model is the defensible posture.

### The mistake the two-source model prevents

Three common errors disappear when both columns are present and labelled:

1. **The "we don't know what we paid yet" stall.** A team waits for monthly close to know last week's cost. The live calculated column unblocks them.
2. **The "I thought we had a discount" surprise.** Finance reports a rack-rate-flavored number. The bill arrives lower. Trust degrades. Two columns labelled explicitly prevent this.
3. **The over-claimed savings.** A scheduling rollout is reported at billed-cost savings (much smaller than the rack-rate savings). The team loses sponsor confidence. Rack rate, labelled, is the right number for the claim.

Two sources, labelled, picked per question.

### Per-row vs per-rollup

`cost_source` is per-row in `cost_records`. Rollup tables (daily / monthly aggregates) derive their own `cost_source`:

- `actual` if any contributing row is `actual`
- `calculated` otherwise

A daily roll-up that is partially actual and partially calculated is labelled `actual` (with a tooltip explaining the partial state). Users reading the daily number get the most-recent best answer.

---

## 2. Demo

Same resource, same week, both columns visible:

```
RESOURCE: i-0abc123def (m5.large, us-east-1, RI-covered)

DATE        cost_usd (rack)   actual_cost_usd (billed)   cost_source
─────────────────────────────────────────────────────────────────────
2026-05-13     $2.30              $1.49                    actual
2026-05-14     $2.30              $1.49                    actual
2026-05-15     $2.30              $1.49                    actual
2026-05-16     $2.30              $1.49                    actual
2026-05-17     $2.30              $1.49                    actual
2026-05-18     $2.30              NULL                     calculated
2026-05-19     $2.30              NULL                     calculated  ← billing sync lag
─────────────────────────────────────────────────────────────────────
WEEK rack rate              $16.10
WEEK billing (actual)         $7.45    (5 days × $1.49)
WEEK using COALESCE          $12.05    ($7.45 + $4.60 fallback)
```

The COALESCE pattern gives the best-available-answer per day: actual where available, calculated where not. The week label is `actual` (because some days were actual) but the rendered tooltip notes the partial fallback.

(Asset: `assets/diagrams/M0.4_L4_two_columns_visualized.svg` — table view with both columns and the fallback overlay.)

---

## 3. Hands-on (6 min)

For your own organization, evaluate:

```
1. Do you currently maintain both columns (live + billed) in your
   cost data?
   Y / N

2. If N: which one is your default? What gap does the missing column
   create?
   Default: __________
   Missing column gap: __________

3. Which report uses which column?
   Budget reports:          __________ (should be billed)
   Savings claims:          __________ (should be rack rate)
   Anomaly detection:       __________ (should be live)
   Monthly close:           __________ (should be billed)

4. Are the columns labelled visibly on the report?
   Y / N
```

If any "should be" doesn't match what is, the report is structurally lying. The fix is either to swap the column source or to switch the report's stated purpose.

---

## 4. Knowledge check

### Q1
A new cloud account is connected to ZopNight at 10 AM. At 2 PM, what cost data is available for that account?

A. Nothing until tomorrow
B. The live calculated cost (rack rate) is available immediately; the billed cost lands within 24–48 hours
C. Only the billed cost
D. Only the resource list

<details>
<summary>Show answer</summary>

**Correct: B.** The two-source model guarantees live calculated cost from day one. The billed cost arrives when the billing sync catches up.
</details>

### Q2
A team's monthly variance report uses live calculated cost. Most likely consequence:

A. The report is accurate
B. The report systematically overstates spend by the discount stack (typically 20–40%). Variance vs. budget will look worse than reality. Switch to billed cost for variance reporting.
C. The report is irrelevant
D. The budget is wrong

<details>
<summary>Show answer</summary>

**Correct: B.** Budgets are set against billed amounts. Reporting variance against rack rate over-states spend systematically.
</details>

### Q3
The "cost_source" label on a daily rollup shows "actual" but a tooltip says "partial — last 2 days fallback to calculated." How should this be interpreted?

A. The data is unreliable, ignore
B. The data is best-available — actual where it has landed, calculated as a placeholder where billing sync has not yet caught up. The rollup is the right answer for "now."
C. The label is wrong
D. Wait for the billing sync

<details>
<summary>Show answer</summary>

**Correct: B.** This is the intended behaviour. The rollup uses the best available source per day. Users get the most up-to-date number; the tooltip is honest about the fallback.
</details>

---

## 5. Apply

The two-source model is the spine of ZopNight's cost surface. Visible places:

- **Reports header** — Cost Source label: "Unblended Cost" or "Rack Rate"
- **Reports → Trends** — splits each data point into `actualCostUsd` and `calculatedCostUsd`
- **Cloud Accounts → Sync Status** — per-account billing-sync health
- **Recommendations cards** — savings claims use the appropriate column (rack rate for avoided hours, billed for projected forward-looking savings)

The model is documented in the [USE-CASES.md](../../../../USE-CASES.md) and [FEATURES.md](../../../../FEATURES.md) reference. The architectural decision is documented in [00_PLAN.md](../../../../00_PLAN.md) § Voice & accessibility.

---

## Related lessons

- [L5 — Currency, FX, and the date-specific exchange rate](L5_currency_and_fx.md) *(next)*
- [T0.M0.1.L3 — Granularity vs. timeliness](../M0.1_cloud_bill_decoded/L3_granularity_vs_timeliness.md)
- [T3.M3.5 — Showback design](../../T3_zopnight_architect/M3.5_showback/00_README.md)

## Glossary terms touched

[Two-source cost model](../../../reference/glossary/two-source-cost-model.md) · [cost_source](../../../reference/glossary/cost-source.md) · [COALESCE pattern](../../../reference/glossary/coalesce-pattern.md) · [Unblended Cost label](../../../reference/glossary/unblended-cost-label.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.4.L4
