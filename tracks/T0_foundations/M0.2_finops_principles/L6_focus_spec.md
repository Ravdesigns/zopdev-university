# The FOCUS specification, in plain English

§ T0 · M0.2 · L6 of 6 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **explain** what the FOCUS specification is, **why it exists**, **and identify** which cloud providers and tools have adopted it.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Make sense of the FOCUS standard before the next FinOps audit conversation." |
| **Personas** | FinOps Analyst · Finance Partner · Engineering Leader |
| **Prerequisites** | [L1–L5](L1_six_principles.md) |
| **Time** | 8 minutes |
| **Bloom verb** | Explain (Understand) |

---

## 1. Concept

**FOCUS** stands for *FinOps Open Cost and Usage Specification*. It is an open standard for cloud billing data, published by the FinOps Foundation. The goal is straightforward: make cost data portable across providers and tools so the same query can run against AWS, GCP, Azure, Oracle Cloud, and any SaaS service that ships a billing feed.

Before FOCUS, every provider published billing data in its own schema. AWS calls the cost column `lineItem/UnblendedCost`. GCP calls it `cost`. Azure calls it `Cost` (or `CostInBillingCurrency`). Multiply this across 50+ columns per provider and you get the situation that has held FinOps back for years: every tool re-implements a translation layer, every query is provider-specific, and cross-cloud reporting requires a small army of ETL pipelines.

FOCUS fixes the schema. Once a provider exports in FOCUS, the same column name means the same thing across clouds.

### Why it exists

Three forces converged in 2023–2024:

1. **Cross-cloud reality.** Most enterprises now run on multiple clouds. Cross-cloud cost reporting is a daily need.
2. **Tool fragmentation.** Every FinOps vendor maintained its own normalization pipeline, with subtle differences. Costs reported by one tool did not match costs reported by another tool against the same bill.
3. **Vendor pressure.** Customers asked AWS / GCP / Azure to standardize. The vendors agreed to participate in the spec rather than each defining their own.

The FinOps Foundation owns the spec and convenes the working group.

### What FOCUS is, in shape

FOCUS is a **column specification**. It defines:

- The set of required columns (about 30 core ones — `BilledCost`, `EffectiveCost`, `ServiceName`, `ResourceId`, `Region`, `ChargePeriodStart`, etc.)
- The data types and allowed values
- The semantics of each column (what counts as `BilledCost` vs `EffectiveCost`, for instance)

It is **not**:

- A file format (any format works — Parquet, CSV, JSON; provider's choice)
- A query engine (you run your own queries over FOCUS-formatted data)
- A required schema for storage (your warehouse can keep extra columns)
- A guarantee of comparable totals (different providers have legitimate rate-card differences; FOCUS normalizes the structure, not the prices)

### The core columns to know

The FinOps Foundation publishes the full spec. A short list of the most-used:

```
COLUMN                    MEANING
─────────────────────────────────────────────────────────────
BilledCost                What the customer is invoiced for the charge
EffectiveCost             The amortized cost (e.g., reservation distributed)
ListCost                  What the cost would have been at public list price
ServiceName               The cloud service (EC2, Compute Engine, Storage)
ResourceId                Cloud-native identifier of the resource
Region                    Cloud-native region code
ChargeCategory            "Usage" / "Tax" / "Credit" / "Adjustment"
ChargePeriodStart / End   The time window the charge covers
SkuId                     The pricing SKU
CommitmentDiscountStatus  "Used" / "Unused" / null
```

Note `BilledCost` vs `EffectiveCost` vs `ListCost`. These are exactly the three bands from [M0.1 L3](../M0.1_cloud_bill_decoded/L3_granularity_vs_timeliness.md) and [M0.4 L4](../M0.4_rack_rate_vs_billing/L4_two_source_model.md), normalized into the spec.

### Where adoption stands (2026)

- **Microsoft Azure** ships FOCUS-aligned exports natively, opt-in.
- **Oracle Cloud** publishes FOCUS-aligned exports.
- **Google Cloud** offers FOCUS export from BigQuery billing data.
- **AWS** ships a native FOCUS 1.0 export through Data Exports (generally available since 2024), so no converter is needed.
- **Apptio, IBM, Vantage, CloudHealth** offer FOCUS-formatted output.
- **FinOps tools (including ZopNight)** can ingest FOCUS or provider-native and emit FOCUS to a destination warehouse if requested.

Adoption is uneven but accelerating. By 2027 most enterprise FinOps practices will use FOCUS as the canonical schema and treat provider-native as the upstream feed.

### Why it matters for the curriculum

A learner who knows FOCUS can:

- Read any cost dataset across providers with the same vocabulary.
- Validate that vendor cost reports use the right column for the question.
- Write portable cost queries that survive a provider switch.
- Understand why a tool's `cost` number differs from the cloud console number (typically: `BilledCost` vs `EffectiveCost` confusion).

These are everyday FinOps skills. FOCUS is the vocabulary.

---

## 2. Demo

The same query, FOCUS-formatted vs. provider-native:

**Provider-native (AWS CUR):**
```sql
SELECT line_item_product_code AS service,
       SUM(line_item_unblended_cost) AS cost
FROM cur.consolidated_2026_05
WHERE bill_payer_account_id = '123456789012'
  AND DATE(line_item_usage_start_date) = '2026-05-19'
GROUP BY 1
ORDER BY cost DESC;
```

**FOCUS:**
```sql
SELECT ServiceName AS service,
       SUM(BilledCost) AS cost
FROM focus.cost_data
WHERE BillingAccountId = '123456789012'
  AND DATE(ChargePeriodStart) = '2026-05-19'
GROUP BY 1
ORDER BY cost DESC;
```

The FOCUS version runs unchanged against GCP, Azure, Oracle — wherever the FOCUS data lands. The CUR version is AWS-only.

(Asset to produce: a three-panel diagram showing the same query running against AWS CUR, GCP BigQuery FOCUS export, and Azure FOCUS export, all returning compatible results. Path: `assets/diagrams/M0.2_L6_focus_portable_query.svg`.)

---

## 3. Hands-on (5 min)

If you have access to any of the FOCUS-publishing exports:

1. Open the FOCUS export from Azure Cost Management, GCP BigQuery billing, or Oracle.
2. Locate the `BilledCost`, `EffectiveCost`, `ListCost`, `ServiceName`, and `ChargePeriodStart` columns.
3. Pull yesterday's total spend grouped by `ServiceName`.
4. Notice how the query reads identically regardless of source.

If you do not have FOCUS access today: read the public schema reference at <https://focus.finops.org/> — particularly the column list — and identify which of your team's current cost queries would simplify with FOCUS.

---

## 4. Knowledge check

### Q1
FOCUS is most accurately described as:

A. A file format
B. A column specification — a schema for cost data that works across providers
C. A FinOps Foundation cert
D. A SQL query engine

<details>
<summary>Show answer</summary>

**Correct: B.** FOCUS is a schema spec. The file format (Parquet / CSV) and query engine (your own) are not part of the spec.
</details>

### Q2
The `BilledCost` column in FOCUS most closely corresponds to:

A. Live rack rate
B. The lagged daily billing cost (post-discount)
C. The forecasted spend
D. The negotiated EDP discount

<details>
<summary>Show answer</summary>

**Correct: B.** `BilledCost` is what the customer is invoiced. It is the post-discount, lagged billing cost. `ListCost` is rack rate. `EffectiveCost` is amortized cost.
</details>

### Q3
An organization runs on AWS, GCP, and Azure. The FinOps Analyst writes a cost query in FOCUS schema. The query:

A. Will need to be rewritten per provider
B. Should run unchanged once each provider's FOCUS export is wired up
C. Will only work against AWS
D. Will only work against the most recently adopted provider

<details>
<summary>Show answer</summary>

**Correct: B.** That is the entire point of FOCUS — write once, run across providers.
</details>

---

## 5. Apply

ZopNight reads provider-native billing data today (CUR for AWS, BigQuery billing for GCP, Cost Management amortized for Azure) and stores it in an internal schema that is *close to* FOCUS but not identical (the internal schema predates FOCUS adoption). The roadmap converges the internal schema toward FOCUS as the spec stabilizes and provider exports mature.

For learners building their own data warehouse or BI layer downstream of ZopNight, the integration recipe is:

1. Export ZopNight cost records via the API or BigQuery sync.
2. Map ZopNight columns to FOCUS columns at the warehouse boundary.
3. Run portable queries against the FOCUS-shaped destination.

A FOCUS-native export option is on the ZopNight roadmap.

---

## Related lessons

- [M0.3 — Why scheduling beats commitments](../M0.3_scheduling_vs_commitments/00_README.md) *(next module)*
- [T0.M0.1.L2 — Pick your billing source](../M0.1_cloud_bill_decoded/L2_pick_your_billing_source.md)
- [T0.M0.4.L4 — The two-source cost model](../M0.4_rack_rate_vs_billing/L4_two_source_model.md)

## External references

- FinOps Foundation FOCUS spec: <https://focus.finops.org/>

## Glossary terms touched

[FOCUS](../../../reference/glossary/focus.md) · [BilledCost](../../../reference/glossary/billed-cost.md) · [EffectiveCost](../../../reference/glossary/effective-cost.md) · [ListCost](../../../reference/glossary/list-cost.md) · [ServiceName](../../../reference/glossary/service-name.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.2.L6
