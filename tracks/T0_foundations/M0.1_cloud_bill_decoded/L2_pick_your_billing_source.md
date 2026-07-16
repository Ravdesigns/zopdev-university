# CUR, Cost Explorer, Cost Management, BigQuery — pick one

§ T0 · M0.1 · L2 of 5 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **choose** the right billing data source on AWS, GCP, or Azure for a given question, and explain when one source is wrong for the job.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Pull last month's spend by team in under five minutes." |
| **Personas** | Platform Engineer · FinOps Analyst · Finance Partner |
| **Prerequisites** | [L1 — What's actually in a cloud bill](L1_what_is_in_a_cloud_bill.md) |
| **Time** | 8 minutes |
| **Bloom verb** | Choose (Apply) |

---

## 1. Concept

Every cloud provider exposes its bill through more than one surface. Picking the right one for the question saves hours and avoids subtle wrong answers. The four canonical surfaces are:

**AWS Cost and Usage Report (CUR).** The raw fact table. One row per resource per usage type per day (or hour, if configured). Lands as gzipped CSV or Parquet in an S3 bucket. Daily delivery, ~24 hour lag. Read with Athena, Redshift, or any data warehouse. The CUR is the only AWS source that exposes the full schema (resource tags, account, region, usage type, pricing dimension, RI discount attribution).

**AWS Cost Explorer.** A query interface on top of an internally aggregated CUR. Live in the AWS console. Up to 14-month history. Easy to filter and group. The data is *mostly* the same as the CUR but with three caveats: resource-level granularity costs $0.01 per API call, hourly granularity costs more, and tags don't filter as flexibly as in raw CUR queries.

**Azure Cost Management.** Azure's primary cost interface. Sits on top of an internal store that itself reads from the platform's billing service. Exposes ActualCost and AmortizedCost as separate columns — this matters. Reservations and savings plans show $0 under ActualCost at subscription scope and the full effective cost under AmortizedCost. Mis-reading the ActualCost column is the most common Azure FinOps mistake.

**GCP BigQuery billing export.** GCP doesn't have a CUR-equivalent file drop. Instead, billing data exports directly to a BigQuery dataset. One row per SKU per resource per day. Standard or detailed export — the detailed export adds usage details (compute instance type, K8s namespace if labelled) at the cost of higher storage. Query with standard BigQuery SQL.

### When to pick which

```
QUESTION                                  → BEST SOURCE
────────────────────────────────────────────────────────────
"Quick monthly trend for a stakeholder"   → Cost Explorer / Cost Mgmt / BigQuery dashboard
"Per-resource cost yesterday"             → CUR (AWS), BigQuery (GCP), Cost Mgmt with resource scope (Azure)
"Reserved instance attribution"           → CUR (AWS) — RI distribution columns live here
"Reservation cost for Azure resources"    → Cost Mgmt with AmortizedCost — NEVER ActualCost at subscription scope
"K8s namespace breakdown"                 → BigQuery detailed export (GCP), CUR with EKS labels (AWS), Cost Mgmt with AKS labels (Azure)
"Multi-account roll-up"                   → CUR exported at Organization root (AWS), BigQuery billing-account export (GCP), Cost Mgmt at Billing Account scope (Azure)
"Programmatic ingestion into FinOps tool" → CUR / BigQuery / Cost Mgmt Export API — pick whichever lands in object storage
```

### Granularity vs. freshness — the table

| Source | Granularity | Freshness | History | Cost to query |
|---|---|---|---|---|
| AWS CUR | Hourly, per resource, per usage type | 24 h lag | Configurable retention | S3 storage + Athena scan cost |
| AWS Cost Explorer | Daily default, hourly available | 24 h lag | 14 months | Free at daily, $0.01/req at hourly + resource |
| Azure Cost Management | Daily, per resource | 8–24 h lag | 13 months UI, 7 years via export | Free in portal |
| GCP BigQuery export | Daily | 24 h lag | Forever, you own the dataset | BigQuery query cost |

### One non-obvious rule

**The bill you read is one day behind reality.** Every source listed here has 24-hour lag minimum, and the first few hours of "yesterday" are often still being written. If a tool claims real-time cost data, it is either calculating from pricing APIs (not billing — that is rack rate, not actual cost) or quietly extrapolating. Both are useful, but neither is the bill. ZopNight is explicit about this: the **Rack Rate** column is calculated live, and the **Billing Cost** column reflects the lagged actual data. (See [L1 of M0.4](../M0.4_rack_rate_vs_billing/L1_rack_rate.md) for the full two-source model.)

---

## 2. Demo

The same question, "What did EC2 cost yesterday across all my accounts?" answered three ways:

**AWS CUR via Athena:**
```sql
SELECT SUM(line_item_unblended_cost) AS cost_usd
FROM cur.consolidated_2026_05
WHERE product_code = 'AmazonEC2'
  AND line_item_usage_start_date >= DATE '2026-05-19'
  AND line_item_usage_start_date <  DATE '2026-05-20';
-- → returns $4,217.83
```

**AWS Cost Explorer via CLI:**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-05-19,End=2026-05-20 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Elastic Compute Cloud - Compute"]}}'
# → returns $4,217.83
```

**GCP BigQuery (Compute Engine equivalent):**
```sql
SELECT SUM(cost) AS cost_usd
FROM `billing_export.gcp_billing_export_v1_*`
WHERE service.description = 'Compute Engine'
  AND usage_start_time >= TIMESTAMP('2026-05-19')
  AND usage_start_time <  TIMESTAMP('2026-05-20');
-- → returns the equivalent for GCE
```

All three answer the same question. CUR-via-Athena gives the most granular drill-down (resource ID, RI attribution). Cost Explorer returns fastest. BigQuery export is the only option on GCP and is itself the most flexible if SQL is a comfortable surface for the team.

(Demo asset to produce: side-by-side screenshot of the three console interfaces returning the same number. Path: `assets/screenshots/M0.1_L2_three_sources.png`.)

---

## 3. Hands-on (6 min — uses real bill, not ZopNight)

Pick the source that matches your primary cloud and pull yesterday's total EC2 / Compute Engine / Azure VM spend.

**AWS, if CUR is configured:**
```sql
SELECT SUM(line_item_unblended_cost)
FROM <your_cur_database>.<your_cur_table>
WHERE line_item_product_code = 'AmazonEC2'
  AND DATE(line_item_usage_start_date) = CURRENT_DATE - INTERVAL '1' DAY;
```

**AWS, if CUR is not configured but Cost Explorer is:**
Use the CLI block from the Demo, swap dates for yesterday and today.

**Azure:**
```bash
az consumption usage list \
  --start-date 2026-05-19 \
  --end-date 2026-05-20 \
  --query "[?contains(meterCategory, 'Virtual Machines')].pretaxCost" \
  -o tsv | awk '{s+=$1} END {print s}'
```

**GCP:**
```sql
SELECT SUM(cost)
FROM `<your_dataset>.gcp_billing_export_v1_*`
WHERE service.description = 'Compute Engine'
  AND DATE(usage_start_time) = CURRENT_DATE() - 1;
```

Note the number. Now answer the next question without re-running:

> *Which resource ID accounts for the most of that spend?*

If the original query cannot answer that without modification, the source is too coarse for resource-level work. Re-run at the right grain. **CUR with `line_item_resource_id`, BigQuery with `resource.global_name`, and Azure Cost Management with `resource group` or `resource ID` scope** are the right paths.

---

## 4. Knowledge check

### Q1
A Finance Partner asks: "How much did our three reserved AWS instances actually cost the company in May?" Which source is right?

A. Cost Explorer at the resource level
B. CUR with `reservation/EffectiveCost` and `pricing/unit` columns
C. Azure Cost Management with AmortizedCost
D. GCP BigQuery export

<details>
<summary>Show answer</summary>

**Correct: B.** Only CUR exposes the RI distribution columns that explain how a reservation's amortized cost is attributed across resources. Cost Explorer can show aggregate RI usage but is not the right source for line-item attribution. C and D are wrong-cloud answers.
</details>

### Q2
An Azure-focused engineer reports: "Our reserved VM costs $0 in Cost Management. The RI is broken." What is the most likely true cause?

A. The RI is broken
B. The engineer queried ActualCost. Reservations show $0 there at subscription scope. The right column is AmortizedCost.
C. Cost Management has a 48-hour lag and the data is not yet posted
D. Azure does not report RI cost at all

<details>
<summary>Show answer</summary>

**Correct: B.** Azure's ActualCost column reflects the moment of purchase, which is when the reservation was bought, not when it was consumed. The AmortizedCost column distributes the purchase across the term and shows the effective daily cost per consuming resource. This is Azure's most common FinOps trap. (See [M0.4 L3](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md) for the full treatment.)
</details>

### Q3
The team wants to ingest yesterday's per-resource AWS bill into an external FinOps tool every morning. Which source is built for that?

A. Cost Explorer (it has an API)
B. CUR with daily delivery to S3, picked up by a downstream pipeline
C. The AWS Console screenshot
D. Cost Anomaly Detection alerts

<details>
<summary>Show answer</summary>

**Correct: B.** CUR is the only AWS source designed for programmatic ingestion at per-resource grain. Cost Explorer's API exists but is rate-limited and charged per resource-level call. C and D are not data sources.
</details>

---

## 5. Apply

ZopNight reads from all four sources behind the scenes. **The Billing Sync feature** wires AWS Cost Explorer, Azure Cost Management (amortized), and GCP BigQuery billing exports into a single `cost_records` table so reports query one column regardless of provider.

To verify which source is currently feeding your account:

- **Cloud Accounts → click an account → View Sync Status.** Each provider shows the source it is reading and the timestamp of the most recent successful sync.
- **Reports → Cost Overview** displays the active cost-source label ("Unblended Cost" when billing sync is active across every account, "Rack Rate" if even one account is missing). When the label says Unblended Cost, every number on every report is provider-actual.

[Open ZopNight Cloud Accounts →](https://app.zopnight.com/cloud-accounts) *(deep link resolves once signed in)*

---

## Related lessons

- [L1 — What's actually in a cloud bill](L1_what_is_in_a_cloud_bill.md) *(previous)*
- [L3 — Granularity vs. timeliness](L3_granularity_vs_timeliness.md) *(next)*
- [T0.M0.4.L3 — Amortized cost: Azure's gotcha](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md)
- [T3.M3.5.L1 — Showback design: pick the dimension](../../T3_zopnight_architect/M3.5_showback/L1_pick_dimension.md)

## Rule references

- [`RC-002` Orphaned EBS Volume](../../../reference/rules/RC-002.md) — uses CUR resource IDs to detect orphans

## Glossary terms touched

[CUR](../../../reference/glossary/cur.md) · [Cost Explorer](../../../reference/glossary/cost-explorer.md) · [Amortized cost](../../../reference/glossary/amortized-cost.md) · [BigQuery billing export](../../../reference/glossary/bigquery-billing-export.md) · [Unblended cost](../../../reference/glossary/unblended-cost.md) · [RI distribution columns](../../../reference/glossary/ri-distribution-columns.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.1.L2
