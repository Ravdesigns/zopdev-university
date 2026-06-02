# What "rack rate" actually means

§ T0 · M0.4 · L1 of 5 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **define** rack rate, **explain** how it is calculated, **and identify** the right contexts to quote it.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Quote a defensible savings number that matches what the resource would cost without our discounts." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | M0.1 |
| **Time** | 9 minutes |
| **Bloom verb** | Define (Remember) and Explain (Understand) |

---

## 1. Concept

**Rack rate** is the public, undiscounted, per-unit price of a cloud resource as published on the provider's rate card. It is what the resource would cost if no reservations, no savings plans, no enterprise discount programs, and no spot prices were applied.

The name comes from hotels. The rack rate is what the room would cost without any discount, loyalty, or negotiated corporate price. The price *on the rack at the front desk.* Nobody actually pays rack rate at a hotel. Almost nobody pays rack rate in cloud either. But knowing it is the right baseline for almost every cost calculation.

### How rack rate is calculated

For any cloud resource, rack rate is computed as:

```
rack_rate = unit_price (from public rate card) × hours_running × applicable_units
```

For an EC2 instance:
```
rack_rate_monthly = hourly_rate × 730 hours
                  (730 = avg hours per month)
```

For an EBS volume:
```
rack_rate_monthly = per_GB_rate × volume_size_GB
```

For an S3 bucket:
```
rack_rate_monthly = per_GB_storage_rate × GB_stored
                  + per_request_rate × request_count
                  + egress_per_GB × egress_GB
```

The pricing data lives in public APIs:
- AWS Pricing API: `https://pricing.us-east-1.amazonaws.com/...`
- Azure Retail Prices: `https://prices.azure.com/api/retail/prices`
- GCP Cloud Billing Catalog: `https://cloudbilling.googleapis.com/v1/services/...`

These APIs refresh when the providers change prices (relatively rare — typical: a couple of times a year for major price changes, more often for new SKUs).

### When rack rate is the right number to quote

**Calculating realized savings from scheduling or termination.** If you stop a resource, the resource was charged at some discounted rate while running. The savings, however, should be quoted at rack rate, because:

1. The discount applied while running. It does not apply to capacity that is no longer running.
2. The "savings" claim is for the avoided rack-rate hours.
3. Quoting only the discounted savings under-credits the optimization.

Example: a 1-yr RI-covered EC2 at 35% effective discount. The resource costs the customer $65/month after discount. Stop it overnight (12 hours off, 12 hours on). Half the hours are saved.

```
Savings claim (correct):   $50/month  (rack rate × hours saved)
Savings claim (incorrect): $32.50     (discounted rate × hours saved)
```

The correct claim is rack rate. The discount applies to the running hours, not the saved hours.

**Comparing across providers.** AWS at $0.10/hr looks similar to GCP at $0.095/hr. Both are rack rates. The discounted realities can vary significantly by negotiated discount, but rack rate is the apples-to-apples comparison.

**Estimating new workloads.** For a workload that does not yet exist, no discount applies. Rack rate is the only available number until usage is observed.

**Anomaly detection on live signal.** ZopNight runs anomaly detection on live calculated cost (which is rack rate) because billing data is 24-hour lagged. The live signal catches the event fast; the billing-data confirmation comes the next day.

### When rack rate is the wrong number to quote

**To finance, for budget conversations.** Finance budgets against billed amounts (post-discount). Quoting rack rate to a CFO and then showing a lower number on the invoice undermines trust. For budget conversations, billing cost is the right column.

**For cost-per-unit-of-business-value metrics.** Cost per MAU should use the actual cost the business is paying. Rack rate over-states.

**For chargeback to internal teams.** Internal chargeback should match what the company actually pays, not the rate-card rate. Otherwise the team gets a bill that does not reconcile against the company's invoice.

### How ZopNight uses it

ZopNight stores rack rate in the `cost_usd` column of `cost_records` (live calculated from the pricing API every hour). The `actual_cost_usd` column is overlaid by the billing sync (24–48 hours lag, post-discount).

Aggregated reports use `COALESCE(actual_cost_usd, cost_usd)` so the report falls back to rack rate when billing data is not yet available. The Cost Source label on each report tells the reader which they are looking at: "Unblended Cost" (billing, post-discount) or "Rack Rate" (calculated).

---

## 2. Demo

Pulling rack rate from the AWS Pricing API for one instance type, one region:

```bash
# AWS Pricing API — get on-demand rate for m5.large in us-east-1
curl -s 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/us-east-1/index.json' \
  | jq '.terms.OnDemand 
        | to_entries[] 
        | select(.value.priceDimensions 
                 | to_entries[] 
                 | .value.unit == "Hrs")' \
  | jq '. | select(.value.attributes.instanceType=="m5.large")'

# Returns: $0.096 per hour
# Monthly rack rate: $0.096 × 730 = $70.08
```

Then for the same instance, the actual billed cost (post-discount) from Cost Explorer for last month:

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-05-01 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --filter '{"And":[
              {"Dimensions":{"Key":"INSTANCE_TYPE_FAMILY","Values":["m5"]}},
              {"Dimensions":{"Key":"RESOURCE_ID","Values":["i-0abc123"]}}
            ]}'
# Returns: $43.30 (RI coverage applied)
```

The same instance: rack rate $70.08, actual billed $43.30. The 38% gap is the realized discount. Both numbers are correct. They answer different questions.

(Asset: `assets/diagrams/M0.4_L1_rack_vs_actual.svg`.)

---

## 3. Hands-on (6 min)

Pick one of your EC2 / GCE / Azure VM instances. Compute both numbers:

```
INSTANCE: __________________

1. Rack rate (from pricing API or pricing page)
   hourly: $______
   monthly: hourly × 730 = $______

2. Actual billed cost (last month, from Cost Explorer / Cost Mgmt / BigQuery)
   monthly: $______

3. Effective discount = (rack − actual) / rack
   = ______ %
```

The number in step 3 is your realized rate-card discount on this resource. Anything above 25% is significant — usually means commitment coverage is active.

---

## 4. Knowledge check

### Q1
A team stops a dev EC2 instance overnight. The instance was covered by a 1-yr Savings Plan at 30% effective discount. The savings claim should be quoted at:

A. Discounted rate × hours saved
B. Rack rate × hours saved — because the SP discount applied to running hours, not saved hours
C. Either, they are the same
D. Nothing, the SP keeps billing

<details>
<summary>Show answer</summary>

**Correct: B.** Rack rate is the right number for savings claims. The SP discount applied to hours the resource was running, not to hours that were avoided.
</details>

### Q2
For a budget conversation with the CFO, the right column is:

A. Rack rate
B. Billing cost (post-discount, unblended)
C. Either
D. List price minus 10%

<details>
<summary>Show answer</summary>

**Correct: B.** Budgets are set against what the company actually pays. Rack rate overstates and confuses the conversation.
</details>

### Q3
A vendor advertises "60% savings." Investigation reveals the savings number is computed against rack rate, while the customer's actual bill was already 35% below rack rate via existing RIs. The realized savings on the actual bill is most accurately:

A. 60%
B. ~38% — because the rack-rate savings are diluted by the existing discount stack
C. 0%, the vendor is lying
D. 95%

<details>
<summary>Show answer</summary>

**Correct: B.** Rack-rate savings × (1 − existing discount) = 60% × (1 − 0.35) = 39%. The vendor's claim is not lying but is incomplete. Always model realized savings against the actual bill, not the rack rate.
</details>

---

## 5. Apply

ZopNight surfaces rack rate explicitly on every report. The Cost Source label on the Reports header tells you which column you are looking at:

- **"Rack Rate"** label = `cost_usd` (calculated live, no discount)
- **"Unblended Cost"** label = `actual_cost_usd` (billing data, post-discount)

The recommendation cards in [Recommendations](https://app.zopnight.com/recommendations) compute potential savings using both columns where relevant. The savings claim is presented at the column most defensible for the savings type (typically rack rate for idle / orphan rules, since those represent avoided hours).

---

## Related lessons

- [L2 — Billing cost: and why it's lower than rack rate](L2_billing_cost.md) *(next)*
- [L4 — The two-source cost model](L4_two_source_model.md)
- [T0.M0.1.L3 — Granularity vs. timeliness](../M0.1_cloud_bill_decoded/L3_granularity_vs_timeliness.md)

## Glossary terms touched

[Rack rate](../../../reference/glossary/rack-rate.md) · [Pricing API](../../../reference/glossary/pricing-api.md) · [List price](../../../reference/glossary/list-price.md) · [Effective discount](../../../reference/glossary/effective-discount.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.4.L1
