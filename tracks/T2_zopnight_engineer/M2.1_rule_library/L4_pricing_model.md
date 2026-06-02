# Pricing — TierRates vs SKURates

§ T2 · M2.1 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** commitment math (TierRates) from catalog-diff math (SKURates), **identify** which rules use which, **and diagnose** when a savings number doesn't match intuition.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the two pricing-math paths so I can predict and verify any rule's savings calculation." |
| **Personas** | Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.1.L3 (rule interface) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Identify (Apply), Diagnose (Analyze) |

---

## 1. Concept

The recommender uses two different pricing paths depending on what the rule is computing. The split exists because the math differs — commitment-savings math (saving by changing how you pay) vs catalog-diff math (saving by changing what you use).

```
TWO PATHS:

TierRates — COMMITMENT MATH
  When savings come from purchase-type changes
  Same resource; different pricing tier
  Examples: Spot adoption, RI / SP / CUD opportunities
  
SKURates — CATALOG-DIFF MATH
  When savings come from swapping one SKU for cheaper
  Different resource type; same purchase type
  Examples: gp2 → gp3, instance right-size, ARM migration
```

Knowing which path a rule uses tells you what kind of math drives the savings number.

### TierRates — commitment math

Used when the savings come from purchase-type changes (same resource, different pricing model):

```
APPLICATIONS:
  Spot adoption (run on Spot instead of On-Demand)
  Reserved Instance opportunity (commit for discount)
  Savings Plan opportunity (commit for flexibility)
  GCP CUD (Committed Use Discount) opportunity
  Moving stable workloads to commitments

AGGREGATOR returns per-resource rates across tiers:
  on_demand
  reserved (1-year, 3-year)
  savings_plan (1-year, 3-year)
  cud (1-year, 3-year)
  spot
  
RULE CONSUMES via TierRatesAware interface

MATH:
  savings = cost × (1 − tier_rate / on_demand_rate)
```

**Example — Spot adoption rule on a stateless workload:**

```
Current rate: $0.096/hr on-demand
Spot rate: $0.024/hr
Workload runs 730 hours/month

savings = 0.072/hr × 730 hr/mo = $52.50/mo per instance
Savings fraction: 0.024/0.096 = 25% of original cost
Savings percentage: 75%
```

The "tier swap" pattern produces the largest savings (Spot can be 75% cheaper); also has the highest risk (eviction).

### SKURates — catalog-diff math

Used when the savings come from swapping one SKU for a cheaper one (different resource type, same purchase type):

```
APPLICATIONS:
  Graviton (ARM) migration (Intel x86 → ARM)
  Nitro instance migration (older → newer family)
  Right-sizing to smaller instance type (m5.2xlarge → m5.xlarge)
  Disk tier downgrade (gp2 → gp3)
  Storage class downgrade (S3 Standard → Standard-IA)
  Cold storage migration

AGGREGATOR returns rates by (provider, region, sku):
  ebs-gp2: $0.10/GB-month
  ebs-gp3: $0.08/GB-month
  ec2-m5.xlarge: $0.192/hr (on-demand)
  ec2-m5.2xlarge: $0.384/hr (on-demand)

RULE CONSUMES via SKURatesAware interface

MATH:
  savings = (src_rate − dst_rate) × usage_quantity
```

**Example — gp2 → gp3 migration:**

```
src_rate: $0.10/GB-month (gp2)
dst_rate: $0.08/GB-month (gp3)
Volume size: 500 GB

savings = (0.10 − 0.08) × 500 = $10/month per volume
```

**Example — Right-sizing m5.2xlarge → m5.xlarge:**

```
src_rate: $0.384/hr
dst_rate: $0.192/hr
Workload: 730 hours/month

savings = (0.384 − 0.192) × 730 = $140.16/month per instance
```

Catalog-diff savings tend to be smaller per resource but apply to MORE resources (every EBS volume, every instance).

### The target SKU helpers

SKU-diff rules need to pick the destination SKU. Two helpers do this:

```
internal/skuladder/
  Static maps for known swaps:
    Next-smaller instance: m5.2xl → m5.xl → m5.large
    ARM migration: m5.xl → m6g.xl
    Nitro migration: m4.xl → m5.xl
    Burstable migration: m5.large → t3.large (when CPU allows)
    Disk tier: gp2 → gp3, sc1 → st1
    
internal/sizing/
  Walks the SKU ladder using metrics:
    p95 CPU + memory utilization
    1.5× headroom factor
    Picks the smallest SKU that still fits
```

The helpers are utilities — the rules consume them; engineers don't typically modify.

### Sanity band — handling bad data

Every `Derive*` helper clamps fractions to `[0.05, 0.85]`:

```
SANITY GUARDRAILS:

  If derived_savings_fraction < 5% (0.05):
    Return hardcoded fallback (probably stale data; unlikely 0% savings)
    
  If derived_savings_fraction > 85% (0.85):
    Return hardcoded fallback (probably bad rate; unlikely 90% savings)
    
  If rate missing or dst_rate >= src_rate:
    Return hardcoded fallback (rate is wrong direction)

FALLBACK CONSTANTS:
  Every fallback constant carries a `// Source:` comment
  Pointing at the public price page it was derived from
  
RATIONALE:
  A slightly stale fraction beats no recommendation
  Aggressive clamps prevent obvious bugs in customer-facing UI
```

The band is the guardrail. If pricing data is bad, the user still gets a reasonable estimate.

### Adding a new pricing tier

To add a new purchase type (e.g., a new GCP discount program):

```
1. EMIT rows with the new `purchase_type` from a fetcher
   Location: aggregator/internal/pricing/
   
2. MAP the new `purchase_type` into model.TierRates
   Location: aggregator/internal/service/service.go
   
3. EXTEND GetTierRatesResponse if the new tier needs its own field

The recommender side requires no changes when the new tier lands.
The math is data-driven; tiers are dictionary keys.
```

Adding tiers is an Aggregator-side change; the Recommender consumes whatever Tier dictionary it receives.

### Diagnosing a wrong rate

When a recommendation's savings disagrees with intuition:

```
DEBUGGING STEPS:

1. CHECK pricing_cache (newest row wins):
   SELECT * FROM pricing_cache
   WHERE provider='aws' AND region='us-east-1' AND sku='m5.xlarge'
   ORDER BY fetched_at DESC LIMIT 1;
   
2. CURL the public price endpoint directly:
   aws pricing get-products ...
   Or: AWS pricing JSON
   
   Compare to pricing_cache:
   If they differ: weekly cron is stuck; check pricing-sync logs
   
3. CHECK billing data (separate concern):
   If "current cost" disagrees with bill (not pricing data):
   Look in cost_records, not pricing_cache
   Billing data is daily-synced separately

4. CHECK the rule's evidence:
   Recommendations → resource → evidence panel
   Should show: src_rate, dst_rate, usage_quantity
   Trace the math from there

5. CHECK fallback indicators:
   If evidence shows a "fallback" or "estimated" note
   Pricing data was missing; rule used hardcoded fraction
```

The diagnostic chain narrows down where the wrong number came from.

### Pricing data refresh cadence

```
AWS:    weekly pricing sync (cron)
GCP:    weekly pricing sync
Azure:  weekly pricing sync

Per-region SKU rates change rarely (months).
Per-tier rates (RI/SP) change rarely (quarterly).

Pricing freshness is rarely the issue.
Mismatches usually = rule bug or data classification issue.
```

The weekly cadence balances freshness with API rate limits.

---

## 2. Demo

Two rules side by side, showing the two pricing paths:

**RC-088 — Spot opportunity (TierRates path):**
```
Workload: stable EC2 fleet on m5.xlarge
Workload characteristics: stateless, can tolerate eviction
30-day p95 CPU: 35% (right-sized already)

TierRates returns:
  on_demand    $0.192/hr
  reserved-1y  $0.123/hr
  savings_plan $0.135/hr
  spot         $0.048/hr

Rule logic:
  Workload eligible for Spot? Yes (stateless + eviction-tolerant)
  Best non-on-demand tier: Spot
  Savings = 0.192 - 0.048 = $0.144/hr
  Per month: $0.144 × 730 = $105/mo per instance
  
  Savings fraction: 1 - 0.048/0.192 = 75%
  Sanity check: 75% within [0.05, 0.85] = OK; use computed
```

**RC-156 — gp2 → gp3 migration (SKURates path):**
```
Resource: 500 GB EBS gp2 volume
Same purchase type (on-demand storage)

SKURates returns:
  ebs-gp2 (us-east-1)  $0.10/GB-month
  ebs-gp3 (us-east-1)  $0.08/GB-month

Rule logic:
  Volume eligible for gp3? Yes (size >0, gp2 currently)
  Target SKU: gp3 (cheaper, same performance class)
  Savings = (0.10 - 0.08) × 500 = $10/mo per volume
  
  Savings fraction: 1 - 0.08/0.10 = 20%
  Sanity check: 20% within [0.05, 0.85] = OK; use computed
```

```
The first rule's math is about purchase-type ratios (commitment).
The second's math is about catalog price deltas (substitution).
Different mechanics, same recommendation card structure.
```

Both rules show evidence in the UI with the rates used. Engineers can audit the math.

---

## 3. Hands-on (5 min)

Inspect pricing-path differences in real recommendations:

```
□ STEP 1: Open Recommendations
  
□ STEP 2: Pick a TierRates rule (RC-088, RC-094, or similar)
  Open detail view
  Evidence shows:
    - Current rate (on_demand)
    - Target rate (spot / reserved)
    - Savings fraction (typically 30-75%)
  This is the TierRates path.

□ STEP 3: Pick a SKURates rule (gp2→gp3, storage class downgrade)
  Open detail view
  Evidence shows:
    - src_rate (e.g., $0.10/GB-month)
    - dst_rate (e.g., $0.08/GB-month)
    - usage_quantity (e.g., 500 GB)
  This is the SKURates path.

□ STEP 4: Compare
  Note that both show the math
  But the inputs are different
  TierRates: tier-tier ratio
  SKURates: per-SKU difference

□ STEP 5: Find a "fallback" indicator
  Some recommendations may show "estimated" or "fallback"
  This means pricing data was bad; rule used static fraction
```

The hands-on confirms how to read evidence for either pricing path.

---

## 4. Knowledge check

### Q1
A rule recommends moving a workload to Spot pricing. The math path:

A. SKURates
B. TierRates
C. Static fallback
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Purchase-type changes (Spot, RI, SP, CUD) use TierRates. The savings come from changing how you pay, not what you use.
</details>

### Q2
A rule recommends migrating an EBS gp2 volume to gp3. The math path:

A. SKURates — catalog price delta between gp2 and gp3
B. TierRates
C. Doesn't apply
D. Both

<details>
<summary>Show answer</summary>

**Correct: A.** Same purchase type (storage; same on-demand pricing model), different SKU (gp2 vs gp3). Catalog diff math via SKURates.
</details>

### Q3
The sanity band clamps savings fractions to `[0.05, 0.85]`. Why:

A. Random rule
B. To produce sensible recommendations even when pricing data is partially stale or missing. Better a stale-but-reasonable fraction than absent recommendation. The clamp + hardcoded fallbacks provide graceful degradation.
C. AWS requires it
D. Backward compatibility

<details>
<summary>Show answer</summary>

**Correct: B.** Guardrail against bad pricing data. Slightly stale fraction beats no recommendation.
</details>

---

## 5. Apply

Pricing data lives in `pricing_cache` (refreshed weekly). Customers don't interact with this directly. To audit: open a recommendation card → evidence panel → see the rates used. Inconsistencies are reported via support.

For your team: the two-path knowledge helps debug surprise savings numbers. Trace the math via evidence.

---

## Related lessons

- [L1 — The 8 categories](L1_eight_categories.md)
- [L2 — Severity ladder](L2_severity.md)
- [L3 — Rule interface](L3_rule_interface.md)
- [L5 — Reading a recommendation card](L5_reading_a_rec_card.md) *(next)*
- [M2.2 — Reading evidence](../M2.2_reading_evidence/00_README.md)

## Glossary terms touched

[TierRates](../../../reference/glossary/tierrates.md) · [SKURates](../../../reference/glossary/skurates.md) · [SKU ladder](../../../reference/glossary/sku-ladder.md) · [Sanity band](../../../reference/glossary/sanity-band.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.1.L4
