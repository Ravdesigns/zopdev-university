# Amortized cost — Azure's gotcha

§ T0 · M0.4 · L3 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why Azure ActualCost shows $0 for reservation-covered resources **and use** AmortizedCost as the correct column for per-resource reporting.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop reporting that our reserved Azure VMs cost zero." |
| **Personas** | FinOps Analyst · Finance Partner · Engineering Leader |
| **Prerequisites** | [L1](L1_rack_rate.md), [L2](L2_billing_cost.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Explain (Understand) and Use (Apply) |

---

## 1. Concept

Azure has a billing-data behaviour that breaks naive cost reports. Engineers and FinOps Analysts run into it within days of trying to report reserved-instance costs at the resource level. The behaviour is documented but easy to miss. This lesson is the explicit warning.

### What Azure ActualCost shows for reservations

Azure's Cost Management API exposes two cost columns: `ActualCost` and `AmortizedCost`.

```
ActualCost     = the moment-of-charge cost, as billed to the subscription
AmortizedCost  = the per-day, per-resource distributed cost
```

For pay-as-you-go resources, the two columns return the same number. For reservation-covered resources, they diverge:

```
RESERVATION PURCHASE (3-yr, $36,000 upfront)
  ActualCost:    $36,000 on day 1, $0 every other day for 3 years
  AmortizedCost: $32.88 per day for 1,095 days

VM COVERED BY THAT RESERVATION (Standard_D8s_v3, 24/7)
  ActualCost:    $0 (the reservation is paid; the VM is free)
  AmortizedCost: ~$32.88 per day attributed to this specific VM
```

The mechanic: Azure bills the *reservation purchase* against the subscription, not against each resource. The resource itself is "free" at the moment of consumption because the reservation has already been paid for. ActualCost faithfully reports this. But for any per-resource cost question — *"what does this VM cost?"* — ActualCost returns the misleading answer.

### Why this matters

The naive reporting pipeline pulls `ActualCost` and groups by resource. The resulting report:

```
RESOURCE                              ACTUALCOST (May 2026)
─────────────────────────────────────────────────────────
production-vm-01 (D8s_v3, reserved)    $    0.00   ←  WRONG
production-vm-02 (D8s_v3, reserved)    $    0.00   ←  WRONG
analytics-vm-03  (D16s_v3, PAYG)       $  583.20
─────────────────────────────────────────────────────────
TOTAL VM COST                          $  583.20   ←  WRONG
```

The team concludes that reserved VMs are free. They are not. The reservation is being paid. The cost is just attributed at the subscription level, not the resource level, when ActualCost is the column.

The fix is to use `AmortizedCost`:

```
RESOURCE                              AMORTIZEDCOST (May 2026)
─────────────────────────────────────────────────────────
production-vm-01 (D8s_v3, reserved)    $  983.10   ←  CORRECT
production-vm-02 (D8s_v3, reserved)    $  983.10   ←  CORRECT
analytics-vm-03  (D16s_v3, PAYG)       $  583.20
─────────────────────────────────────────────────────────
TOTAL VM COST                          $2,549.40   ←  CORRECT
```

Same resources. Same month. Same Azure account. The right column changes the number by a factor of four.

### The five places this catches teams

1. **Per-resource cost reports.** Any "cost per VM" or "cost per workload" report against subscription-scope data will show $0 for reserved resources if ActualCost is used.
2. **Showback / chargeback.** Internal billing that uses ActualCost over-charges PAYG teams and under-charges reservation-backed teams.
3. **Recommendation engines.** Cost optimization tools that read ActualCost will miss the savings opportunity on reserved resources (because they appear to cost nothing).
4. **Budget tracking.** A team budget tracked against ActualCost will under-count reserved spend, leading to apparent surplus that is not real.
5. **Anomaly detection.** Anomaly detection on ActualCost will not detect changes in reserved-resource usage.

Every one of these is a real, repeating customer story.

### How AWS and GCP differ

AWS does NOT have the same trap. The CUR exposes `lineItem/UnblendedCost`, which already includes amortized reservation cost per resource. AWS Cost Explorer defaults to "Unblended Costs" which is also the amortized view for reservations.

GCP also avoids the trap. CUD discounts are applied at the resource level on the BigQuery billing export. The `cost` column for a CUD-covered Compute Engine VM shows the post-discount amortized cost.

Azure is the only major cloud where the default cost column (depending on how you query) can return $0 for reservation-covered resources. This is a deliberate design choice (ActualCost reflects the cash flow accurately), but it traps the per-resource reporting use case.

### How ZopNight handles it

ZopNight pulls `AmortizedCost` from Azure Cost Management for all billing sync. The `actual_cost_usd` column in `cost_records` carries the amortized number, so per-resource reports always include the reservation distribution. This is non-negotiable for ZopNight's Azure integration — the alternative (ActualCost) breaks too many downstream features.

The cost_source label on Azure-sourced records is `amortized` to make this explicit in the data. Reports surface a tooltip on Azure rows clarifying the column choice.

---

## 2. Demo

The same Azure resource, queried two ways. ActualCost vs AmortizedCost:

```bash
# ActualCost — the trap
az costmanagement query \
  --type ActualCost \
  --timeframe MonthToDate \
  --scope "/subscriptions/<sub-id>" \
  --dataset-aggregation '{"totalCost":{"name":"Cost","function":"Sum"}}' \
  --dataset-filter '{"dimensions":{"name":"ResourceId","operator":"In","values":["<vm-resource-id>"]}}'
# Returns: $0.00 (reservation-covered resource)

# AmortizedCost — the correct column
az costmanagement query \
  --type AmortizedCost \
  --timeframe MonthToDate \
  --scope "/subscriptions/<sub-id>" \
  --dataset-aggregation '{"totalCost":{"name":"Cost","function":"Sum"}}' \
  --dataset-filter '{"dimensions":{"name":"ResourceId","operator":"In","values":["<vm-resource-id>"]}}'
# Returns: $983.10
```

Same resource. Same month. Two different numbers. AmortizedCost is the right one for per-resource reporting.

(Asset: `assets/diagrams/M0.4_L3_actual_vs_amortized.svg` — comparison table.)

---

## 3. Hands-on (7 min)

If your organization runs Azure:

```
1. Identify one reservation-covered Azure VM.
2. Query its cost two ways from Cost Management (using Azure CLI or
   the portal):
   - Type=ActualCost, MonthToDate, filter by ResourceId
   - Type=AmortizedCost, MonthToDate, filter by ResourceId
3. Compare the two numbers.

If you see $0 from ActualCost and a real number from AmortizedCost,
the gotcha is confirmed for your data.

4. Audit your team's existing Azure cost reports. Which column do they
   use? If ActualCost, the report is silently undercounting reserved
   resources.
```

---

## 4. Knowledge check

### Q1
An Azure-focused engineer reports: "Our reserved D8s_v3 VMs cost $0 in Cost Management." Most accurate response:

A. The reservation is broken
B. The query is using ActualCost. Reservations show $0 there at subscription scope. Switch to AmortizedCost for per-resource reporting.
C. Cost Management has a bug
D. The VMs are not actually running

<details>
<summary>Show answer</summary>

**Correct: B.** This is the canonical Azure gotcha. The data is correct; the column choice is wrong for the question being asked.
</details>

### Q2
A team builds a chargeback system that uses Azure ActualCost. Reserved-resource-heavy teams pay $0 in chargeback. PAYG-heavy teams pay the entire reservation purchase as a lump sum. Best fix:

A. Disable reservations
B. Switch the chargeback system to AmortizedCost so the reservation cost is distributed across the covered resources
C. Manually allocate the reservation purchase
D. Pay teams equally

<details>
<summary>Show answer</summary>

**Correct: B.** AmortizedCost solves this exactly. The reservation purchase is distributed across consuming resources at the daily granularity needed for chargeback.
</details>

### Q3
The Azure ActualCost / AmortizedCost trap exists because:

A. Azure billing is broken
B. Reservations are paid at purchase time, not at consumption time. ActualCost faithfully reports the cash flow; AmortizedCost distributes the cost for per-resource reporting.
C. Microsoft does not want users to know reservation cost
D. The trap is a Cost Management UI issue only

<details>
<summary>Show answer</summary>

**Correct: B.** The two columns each correctly represent a different view of cost. The trap is choosing the wrong column for the question, not a bug in Azure.
</details>

---

## 5. Apply

ZopNight handles Azure cost sourcing automatically. The Cost Management integration pulls AmortizedCost by default. Reports always include reserved-resource cost in per-resource breakdowns.

To verify on your account:

- **Cloud Accounts → click Azure account → View Sync Status** shows the cost-source label. For Azure, this should read "Amortized" — confirming the right column is being pulled.
- **Reports → Cost Breakdown filtered to one reserved VM** should return a non-zero cost.

If either shows $0 or labels as ActualCost, escalate — the sync is misconfigured.

---

## Related lessons

- [L4 — The two-source cost model](L4_two_source_model.md) *(next)*
- [L2 — Billing cost and the discount stack](L2_billing_cost.md)
- [T2.M2.1 — The 490-rule library](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md)

## Glossary terms touched

[Amortized cost](../../../reference/glossary/amortized-cost.md) · [ActualCost](../../../reference/glossary/actual-cost.md) · [Azure reservation](../../../reference/glossary/azure-reservation.md) · [Per-resource attribution](../../../reference/glossary/per-resource-attribution.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.4.L3
