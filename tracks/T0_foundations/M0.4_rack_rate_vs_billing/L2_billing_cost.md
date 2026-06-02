# Billing cost — and why it's lower than rack rate

§ T0 · M0.4 · L2 of 5 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **enumerate** the discount layers that move billing cost below rack rate **and trace** the gap on any specific resource.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Explain why the bill is 32% below rate card." |
| **Personas** | FinOps Analyst · Finance Partner |
| **Prerequisites** | [L1](L1_rack_rate.md) |
| **Time** | 9 minutes |
| **Bloom verb** | Enumerate (Remember) and Trace (Apply) |

---

## 1. Concept

**Billing cost** is what the customer actually owes after every applicable discount is applied. AWS calls it `UnblendedCost` in CUR. GCP calls it `cost` in the billing export. Azure calls it `Cost` (or with `AmortizedCost` semantics for reservations).

Billing cost can be 10 to 60 percent below rack rate depending on the discount stack. Eight layers stack on top of the rate card, in approximately this order of application:

```
LAYER                            TYPICAL IMPACT
─────────────────────────────────────────────────────────
1. Public rate card (= rack rate)   baseline
2. Sustained-use discount (GCP)     up to 30% on long-running compute, automatic
3. Spot / Preemptible pricing       50–90% off on eligible workloads, no commit
4. Reserved Instance / SP / CUD     up to ~57% with 3-yr commitment
5. Azure Hybrid Benefit             up to ~40% on Windows / SQL with on-prem license
6. Enterprise Discount Program       1–10% negotiated additional discount
7. Credits (marketing, free tier)   variable, finite
8. Tax adjustments                  positive — adds to bill
─────────────────────────────────────────────────────────
NET = BILLING COST
```

### Layer-by-layer

**Layer 1 — Rate card.** The published, public unit price. See [L1](L1_rack_rate.md).

**Layer 2 — Sustained-use (GCP only).** GCP automatically applies a discount to compute that runs for >25% of the month. No commitment required. Up to 30% off on instances running 100% of the month. AWS and Azure have no equivalent.

**Layer 3 — Spot.** Replaces the rate-card price with the spot market price. Discount varies hour by hour (typically 50–90% off). Workload must be eviction-tolerant.

**Layer 4 — Commitments (RI / SP / CUD).** Customer commits to a baseline of usage for 1 or 3 years. Discount applies to covered hours. See [M0.3 L2](../M0.3_scheduling_vs_commitments/L2_commitments.md) for the math.

**Layer 5 — Azure Hybrid Benefit.** A customer with on-prem Windows or SQL Server licenses can bring them to Azure and avoid paying for the license portion of the VM cost. Typical savings: 30–40% on eligible SKUs. AWS has a similar but smaller program for Windows.

**Layer 6 — Enterprise Discount Program (EDP).** A negotiated additional discount, typically a single percentage off everything, in exchange for a multi-year minimum spend commitment. 1–10% range is common. EDPs are confidential and rarely visible to engineering teams; the FinOps team sees them in the billing data.

**Layer 7 — Credits.** Marketing credits, free-tier allowances, startup credits, education credits. Finite — consumed first, expire on a date. Visible as negative line items in the bill.

**Layer 8 — Tax.** Local tax (VAT, GST, state sales tax) is added on top of the discounted cost. Tax is positive — it increases the bill. Most cost analytics tools strip tax to focus on the controllable spend.

### The order matters

Layers stack multiplicatively, not additively. Example:

```
Rack rate                                                  $100
After sustained-use (-25%)                                  $75
After Spot (-70% of the remaining)                          $22.50
After EDP (-3% on top)                                      $21.83
After credits ($10 applied)                                 $11.83
After tax (+5%)                                             $12.42
```

The mathematical effect of one discount on top of another diminishes the absolute dollar impact. A 30% sustained-use discount on top of a 70% Spot price moves the bill by less than 30% absolute, because there is less to discount.

### Where the gap to rack rate comes from

For a specific resource, the gap between rack rate and billing cost decomposes into the contributing layers. AWS CUR exposes the decomposition through specific columns: `pricing/unit`, `reservation/EffectiveCost`, `savingsPlan/SavingsPlanEffectiveCost`, etc. GCP BigQuery export exposes `credits` with type breakdown. Azure Cost Management uses `BenefitName` to mark Hybrid Benefit applications.

For most teams, the right level of decomposition is layer-level, not row-level. Knowing "we saw 35% effective discount this month, 22% from RIs, 8% from sustained-use, 5% from EDP" is more actionable than knowing the per-row breakdown.

### Why the gap matters

Three operational uses for tracking the discount stack:

1. **Renewal modelling.** When a 1-yr commitment expires, what happens to the bill? Knowing the layer contribution lets you model the bump.
2. **Negotiation.** EDP renegotiation is informed by current EDP layer contribution. "We are saving 4% from EDP, we want 7%."
3. **Anomaly attribution.** When the bill spikes, knowing whether the cause is a new resource (rack-rate increase), a lapsed RI (commitment layer drop), or expired credits (layer 7 drop) localizes the investigation.

---

## 2. Demo

Decomposing one month's AWS bill into layers (anonymized real numbers):

```
LAYER                                      $ MOVED       % OF BILL
────────────────────────────────────────────────────────────────────
Rack rate (calculated baseline)           $128,400      —
After Spot ($31K of Spot capacity, ~75% off)  $103,150  −19.7%
After Reserved Instances + Savings Plans   $   76,830   −25.6%
After EDP (3% on top)                      $   74,525   − 3.0%
After credits ($1,200 in startup credits)  $   73,325   − 1.6%
After tax (+8% state)                      $   79,191   + 8.0%
────────────────────────────────────────────────────────────────────
NET BILLING COST                                          $79,191
EFFECTIVE DISCOUNT (excluding tax) FROM RACK             −38.3%
```

This breakdown tells the FinOps team three things: (a) Spot and RIs/SPs together account for most of the gap, (b) EDP is small but positive, (c) tax is a meaningful add-back. A renewal model for next quarter would re-project each layer.

(Asset: `assets/diagrams/M0.4_L2_layer_waterfall.svg` — waterfall chart of the decomposition.)

---

## 3. Hands-on (6 min)

Decompose your own month's bill into the eight layers:

```
LAYER                                  $ AMOUNT   % OF RACK
─────────────────────────────────────────────────────────
1. Rack rate (compute from running     $______
   inventory × pricing API)
2. Sustained-use (GCP only)            $______      ____%
3. Spot                                $______      ____%
4. RI / SP / CUD                       $______      ____%
5. Azure Hybrid Benefit (if any)       $______      ____%
6. EDP                                 $______      ____%
7. Credits                             $______      ____%
8. Tax                                 $______ +    ____%
─────────────────────────────────────────────────────────
NET BILLING COST                       $______
```

If the team has never done this, the first pass takes 2–4 hours. Once a SQL template exists, it is a 5-minute recompute each month. Worth the investment.

---

## 4. Knowledge check

### Q1
A team sees their AWS bill is 38% below rack rate. Most likely contributors:

A. Pure on-demand savings
B. Some combination of Spot, Reserved Instances or Savings Plans, sustained-use (if GCP), Azure Hybrid Benefit (if Azure), and EDP — typically RIs/SPs are the biggest single layer
C. A vendor error
D. Free trial

<details>
<summary>Show answer</summary>

**Correct: B.** 38% effective discount is consistent with strong RI/SP coverage plus some Spot. The team should decompose to know which layers contribute how much, so they can model renewal impact.
</details>

### Q2
A 3-yr Reserved Instance expires next month. The Finance team asks "what happens to our bill?" The right answer is informed by:

A. Looking at the total bill change
B. Decomposing the current bill by layer, identifying the RI layer contribution, and modelling the bump that occurs when those instances revert to on-demand
C. Calling AWS support
D. Buying a new RI immediately

<establishment>
<summary>Show answer</summary>

**Correct: B.** Layer decomposition lets you model the exact bump. Without it, the team is guessing.
</establishment>

### Q3
The "Unblended Cost" column in AWS CUR most closely corresponds to:

A. Rack rate
B. Billing cost (post-discount, pre-credit, pre-tax)
C. The full invoice including tax
D. The negotiated EDP rate

<details>
<summary>Show answer</summary>

**Correct: B.** `UnblendedCost` is the cost after discounts but typically before credits and tax. The full invoice includes those.
</details>

---

## 5. Apply

ZopNight's [Reports → Cost Breakdown → Layout: Purchase Type](https://app.zopnight.com/reports/costs) splits the bill by purchase type (OnDemand, Reservation, SavingsPlan, Spot, etc.) so the commitment / spot layers are visible at a glance.

For the deeper layer-by-layer decomposition (sustained-use, EDP, credits, tax), the source remains the cloud provider's own data. AWS Cost Explorer's "Cost Categories" feature, GCP's `credits` column, and Azure Cost Management's `BenefitName` are the right places. ZopNight aggregates the net billing cost; the layer attribution is sourced from the provider.

---

## Related lessons

- [L3 — Amortized cost: Azure's gotcha](L3_amortized_azure.md) *(next)*
- [L4 — The two-source cost model](L4_two_source_model.md)
- [T4.M4.7 — Commitments demystified](../../T4_finops_mastery/M4.7_commitments_demystified/00_README.md)

## Glossary terms touched

[Unblended cost](../../../reference/glossary/unblended-cost.md) · [Sustained-use discount](../../../reference/glossary/sustained-use-discount.md) · [Enterprise Discount Program](../../../reference/glossary/enterprise-discount-program.md) · [Azure Hybrid Benefit](../../../reference/glossary/azure-hybrid-benefit.md) · [Discount stack](../../../reference/glossary/discount-stack.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.4.L2
