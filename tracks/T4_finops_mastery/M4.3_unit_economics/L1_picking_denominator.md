# Picking the denominator

§ T4 · M4.3 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right business denominator for your org's unit economics, **avoid** the common bad-denominator traps, **and explain** why the choice of denominator shapes the entire cost narrative.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick a denominator that turns the cloud bill into a business-meaningful efficiency number — not a vanity metric." |
| **Personas** | FinOps Lead · Engineering Leader · Product Leader · Finance Partner |
| **Prerequisites** | T0 — Foundations · M4.1 — Maturity ladder |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Avoid (Apply), Explain (Understand) |

---

## 1. Concept

Unit economics is **cost per unit of business value**. The denominator is the unit — the thing the business cares about producing or serving. Picking the right denominator turns "we spent $40K this month" into "we spent $8 per MAU, down from $9 last quarter," which is a much more actionable story.

```
CANDIDATE DENOMINATORS (by business model):
  MAU / DAU                        Engagement-driven products
  Orders / transactions             E-commerce, marketplaces
  API requests (per 1K)            API-first products
  Signups / activations            Growth-stage SaaS
  Sessions                          Content/media
  Tenants / paid seats              B2B SaaS
  GMV                              Marketplaces
  Inferences served                  ML products
  Bytes processed                    Data products
```

### Picking criteria

The right denominator depends on what the business sells:

```
BUSINESS MODEL                                BEST DENOMINATOR
──────────────────────────────────────────────────────────────────
SaaS — monthly subscription                    MAU or paying users
SaaS — per-seat B2B                            active seats / tenants
SaaS — usage-based pricing                     primary usage unit
                                              (API calls, runs, etc.)
Consumer mobile / web                          DAU + MAU (both)
E-commerce                                     orders, GMV
Marketplace                                    GMV, completed transactions
API platform                                   API requests (per 1K typical)
Ad-supported                                   impressions, sessions
ML product (inference)                         inferences served
ML platform (training)                         model training jobs
Data products                                  bytes processed,
                                              datasets processed
Content / media                                streaming minutes,
                                              content downloads
Internal platform                              consumer team's tickets,
                                              builds, deploys
```

### Trade-offs of each denominator

```
DENOMINATOR              DRIFT BEHAVIOR
──────────────────────────────────────────────────────────────────
MAU                       Grows organically; revenue tied; clear
                          
DAU                       Volatile; depends on engagement; harder
                          to interpret trends
                          
Orders                    Tied to revenue; cyclical (holiday peaks)

Signups                   Trial conversion affects this; can grow
                          without revenue
                          
GMV                       Tied to revenue but volatile

Bytes / requests          Easy to measure; less business meaning
                          unless tied to revenue
                          
Paid seats                Direct revenue tie; B2B's cleanest unit
```

### What NOT to pick

Some denominators are tempting but bad:

```
AVOID                                          WHY
──────────────────────────────────────────────────────────────────
"Engagement" (vague)                          Subjective; not measurable
                                              consistently
                                              
Page views (unless tied to revenue)            Easy to measure but
                                              not causal to value
                                              
"Active users" without definition              "Active" varies; results
                                              not comparable
                                              
Lines of code, deploys, or eng-metrics        Measures activity, not
                                              business value
                                              
Anything not easily measurable                Bad denominator = bad
                                              metric
                                              
Multiple denominators averaged                 Composite metrics are
                                              uninterpretable
```

A common trap: picking "MAU" without defining what makes a user "active." If the definition drifts ("active = logged in once" vs "active = used a feature"), the trend is meaningless. Lock the definition before publishing the metric.

### The MAU example

```
PROFILE:    B2B SaaS, $40K/mo cloud, 5,000 MAU
  Cost-per-MAU: $40,000 / 5,000 = $8.00
  
TREND watching:
  $8.00 → $7.50 → $7.20 (positive: efficiency gains)
  $8.00 → $9.00 → $11.00 (negative: cost growing faster than user
    base; investigate)
```

The trend matters more than the absolute. Two orgs can have very different cost-per-MAU based on workload nature; the trend within an org is what reveals efficiency direction.

### Denominator definition

Lock the definition in writing:

```
EXAMPLE — Monthly Active Users (MAU) at Acme:
  
  Definition:    A user who logged in AND took at least one
                  meaningful action (created, edited, or shared
                  content) within the 30-day window ending on
                  the report date
  Counted by:    distinct user_id
  Source:        analytics platform; daily aggregates
  Window:        rolling 30 days
  Last reviewed: 2026-04-15
  Owner:         data team
  
This definition will not change without org-wide notice. If we
decide to redefine, we will:
  - Document the change with the date
  - Recompute historical values under both definitions for
    overlap period
  - Communicate to stakeholders
```

Without the locked definition, six months in someone redefines MAU to include logged-out browsers; the number doubles overnight; cost-per-MAU halves; the improvement is illusory.

### Multiple denominators

For complex orgs, multiple denominators serve different audiences:

```
PRIMARY (for leadership):  cost-per-MAU
SECONDARY (engineering):    cost-per-1K-API-request
TERTIARY (finance):         cost-per-ACV-dollar

Each tells a different story; together they paint the full picture.
Use one as the headline; others as supporting metrics.
```

The risk of multiple: they can give contradictory signals (cost-per-MAU improving, cost-per-API-request worsening). Pick one as primary; explain when others are referenced.

### How ZopNight uses denominators

ZopNight's unit economics overlay supports arbitrary denominators via the Unit Metrics configuration (M3.5.L5-L6). The customer defines the denominator (name, label, source), wires the data ingest (Push API / CSV / Pull API), and the overlay activates on cost trend charts.

Most customers configure 2-3 unit metrics; one becomes the headline.

---

## 2. Demo

A SaaS company's denominator journey:

```
ORG:    B2B SaaS at Series B
CURRENT setup: just total cloud cost ($40K/mo) reported monthly

PROBLEM: leadership sees the bill grow with the business but
cannot tell if growth is healthy

DENOMINATOR EXPLORATION:
  Option 1: MAU (5,000) → $8/MAU
    Pros: clear; tied to business growth
    Cons: not all MAUs equal (some are heavy ML users)
    
  Option 2: paying users (1,200) → $33/paying user
    Pros: directly tied to revenue
    Cons: smaller number; ratio more volatile
    
  Option 3: 1K API requests (250K/mo total) → $160/M requests
    Pros: closely tracks infrastructure usage
    Cons: not all audiences understand API-request volume

DECISION:
  Primary: $33 per paying user (for leadership + finance)
  Secondary: $160 per million API requests (for engineering)
  Both tracked monthly; reported in the cost review

DEFINITION lock:
  paying user = active subscription at end of month, paid >$0
  API request = one HTTP call to *.api.acme.com, status 2xx
  Both definitions reviewed annually

OUTCOME (after 6 months):
  Cost grew 25% in absolute terms
  Paying users grew 35%
  Cost-per-paying-user dropped 7% (good story for leadership)
  Cost-per-M-API dropped 12% (good story for engineering)
```

Same cloud bill, two narratives, both positive.

---

## 3. Hands-on (5 min)

For your product, pick the denominator:

```
BUSINESS MODEL:    __________
PRIMARY REVENUE METRIC: __________

CANDIDATE DENOMINATORS (3 options):
  1. __________    Pros: __________ Cons: __________
  2. __________    Pros: __________ Cons: __________
  3. __________    Pros: __________ Cons: __________

CHOSEN PRIMARY:    __________
SECONDARY (optional): __________

DEFINITION (one sentence, specific):
  __________________________________________________________
  __________________________________________________________

WHO OWNS the definition:    __________
REVIEW CADENCE:              annually / quarterly

DATA SOURCE for the denominator:
  □ Existing analytics platform
  □ Data warehouse
  □ Manual export
  □ Other: __________
```

If you cannot write the definition in one specific sentence, the denominator isn't ready. Lock it first.

---

## 4. Knowledge check

### Q1
A SaaS company with monthly subscription pricing. Best denominator:

A. Bytes processed
B. MAU or paying users. SaaS pricing is tied to the subscriber base; MAU reflects the engaged customer base, paying users reflects revenue directly. Both work; pick based on what leadership values.
C. Page views
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** MAU or paying users for SaaS. Either reflects business value.
</details>

### Q2
An e-commerce platform's best denominator:

A. Page views
B. Orders (or GMV). Revenue-generating events. Page views measure activity, not value; an order is the unit of value.
C. Sessions
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Orders or GMV for e-commerce. Tied to revenue.
</details>

### Q3
Cost-per-MAU trending from $7 to $11. Interpretation:

A. Healthy growth
B. Cost is growing faster than the user base. Either an efficiency loss (waste accumulating) or pre-revenue growth (new features added before users monetize). Investigate to determine which; the metric alone doesn't say.
C. Optimal
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Unit-cost trend up = inefficiency or pre-revenue growth. The fix depends on the cause.
</details>

---

## 5. Apply

Define your denominator at [Settings → Unit Metrics](https://app.zopnight.com/settings/unit-metrics). Configure data ingest per M3.5.L6. The overlay activates on [Reports → Cost Trend](https://app.zopnight.com/reports/cost-trend) and [Reports → Unit Economics](https://app.zopnight.com/reports/unit-economics).

For new orgs, start with one denominator. Add secondary metrics after the primary is stable.

---

## Related lessons

- [L2 — The cost numerator](L2_cost_numerator.md) *(next)*
- [L3 — Building the first dashboard](L3_first_dashboard.md)
- [L4 — Forecasting unit cost](L4_forecasting_unit_cost.md)
- [L5 — Communicating to non-engineers](L5_communicating.md)
- [T3.M3.5.L5 — Unit economics product mechanics](../../T3_zopnight_architect/M3.5_showback/L5_unit_economics.md)

## Glossary terms touched

[Unit economics](../../../reference/glossary/unit-economics.md) · [Denominator](../../../reference/glossary/denominator.md) · [MAU](../../../reference/glossary/mau.md) · [Cost-per-X](../../../reference/glossary/cost-per-x.md) · [Vanity metric](../../../reference/glossary/vanity-metric.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.3.L1
