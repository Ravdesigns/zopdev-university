# Unit economics — cost per X

§ T3 · M3.5 · L5 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** a unit economics overlay in ZopNight, **trace** cost-per-X over time, **and avoid** the most common denominator and source-pipeline pitfalls.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Turn the cloud bill into a unit-economic story that survives a meeting with the CFO." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner · Product Leader |
| **Prerequisites** | M3.5.L1-L4 (showback dimensions + tagging) · T4.M4.3 (FinOps unit-economics rationale) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Trace (Analyze), Avoid (Evaluate) |

---

## 1. Concept

Unit economics is the practice of dividing cost by a business denominator — Monthly Active Users (MAU), orders, requests, tenants, anything that scales with revenue or value — to get a **cost-per-X** number. Cost-per-X is the real efficiency story; absolute cost growth is misleading when the business is also growing. ZopNight's unit-economics overlay surfaces cost-per-X over time on cost trend charts.

This lesson covers the product mechanics — how to configure a unit metric, how to wire the source, how to read the overlay. The domain rationale for unit economics (why you want it, how to pick denominators) lives in [T4.M4.3](../../T4_finops_mastery/M4.3_unit_economics/00_README.md).

### Setup in ZopNight

```
1. DEFINE a unit metric
   Settings → Unit Metrics → New
   
   Name:          monthly_active_users
   Label:          MAU
   Display scale:  1     (or 1000, 1000000 for compactness)
   Source:         Push API (most common; alternatives below)
   Cadence:        Daily values
   Retention:      Indefinite (matches cost data retention)

2. CONFIGURE the source
   Push API:      Customer's pipeline POSTs daily {date, value} arrays
   CSV upload:    Bulk historical data; one-time or periodic
   Pull API:      ZopNight fetches from customer's HTTPS endpoint daily
   (L6 covers ingest paths in detail)

3. AUTHENTICATE the source
   API key or PAT — depends on the path
   First push:    today's MAU = 5,000

4. STORAGE
   ZopNight persists in unit_metric_values
   Cross-references to date for daily alignment with cost

5. ACTIVATE the overlay
   Reports → Cost Trend chart shows secondary axis: cost-per-MAU
```

### Where unit metrics appear

```
SURFACE                      USE
──────────────────────────────────────────────────────────────────
Reports → Cost Trend         Time-series with cost-per-metric overlay
                             on secondary y-axis
                             
Reports → Teams              Per-team cost-per-metric where metric is
                             team-scoped (e.g., per-team MAU)
                             
Dashboards                    Widget for cost-per-metric trending
                             (customizable per audience)
                             
Reports → Unit Economics      Dedicated view; multi-metric overlay;
                             comparison vs targets
```

### Reading the overlay

```
COST TREND with MAU overlay:

  Primary axis (left):       Monthly spend ($)
  Secondary axis (right):    $ per MAU
  
  Apr:  spend $84K  / MAU 11,700  =  $7.20 per MAU
  May:  spend $96K  / MAU 14,200  =  $6.76 per MAU
  Jun:  spend $102K / MAU 16,000  =  $6.40 per MAU
  
  ABSOLUTE COST  +21%  (Apr → Jun)
  PER-MAU COST   -11%  (Apr → Jun)  ← efficiency improving
  
  STORY: cost is growing, but slower than the user base.
         Efficiency is improving even though headline cost is up.
```

The story changes completely when you add the denominator. The absolute number rises; the per-MAU number falls. Both are real; the per-MAU story is the right one for leadership.

### Per-team unit economics

When unit metrics are configured per-team, the comparison is more nuanced:

```
PER-TEAM COST-PER-MAU:
  platform-team:    $7.20/MAU
  product-team:     $6.40/MAU
  data-team:        $12.50/MAU
  ml-team:          $48.00/MAU (intensive workload)

CAVEAT: cost-per-MAU is not a competitive metric across teams.
Different teams have different workload natures. ml-team running
inference for AI features will always be more expensive per MAU
than product-team running CRUD endpoints.

USE per-team unit metrics for:
  - Trending within the team (is THIS team improving?)
  - Comparison to the team's targets
  - Investment justification ("ML workload is $48/MAU; we expect
    that to drop to $35 with the new model")

DON'T USE for:
  - Cross-team competition
  - Resource-allocation fairness arguments
  - Performance reviews
```

The denominator matters more than the absolute number. The same team can have wildly different per-X numbers depending on whether X is "active user," "request," "tenant," or "transaction." Pick the denominator that matches the value the team produces.

### Common pitfalls

```
PITFALL                                  FIX
──────────────────────────────────────────────────────────────────
Wrong denominator                         Tie to revenue or core KPI.
                                          "MAU" is generic; "active
                                          paying subscribers" or
                                          "transactions" is sharper.
                                          
Stale data                                Push API daily; if the source
                                          stalls, the overlay drops out
                                          and shows alerts.
                                          
Multiple metrics; no priority             Pick one primary metric;
                                          track 3-5 max. More creates
                                          confusion in reports.
                                          
Comparing teams unfairly                  Cost-per-MAU is not directly
                                          comparable across teams with
                                          different workload natures.
                                          Use within-team trends
                                          instead of cross-team
                                          rankings.
                                          
Denominator changes definition            "MAU" today vs "MAU" six
                                          months ago must mean the
                                          same thing for trends to be
                                          interpretable. Document the
                                          definition; resist redefining.
                                          
Anchoring on absolute cost                Leadership wants per-X
                                          number; engineering wants
                                          absolute. Both views,
                                          contextually.
```

The "denominator changes definition" pitfall is the most insidious. Six months in, someone redefines MAU to include logged-out browsing sessions. The number doubles overnight; the cost-per-MAU halves. The improvement is illusory.

### Picking the denominator

The choice depends on the business model:

```
BUSINESS MODEL                  RECOMMENDED DENOMINATOR
──────────────────────────────────────────────────────────────────
SaaS (B2C / B2B per-seat)        Active users, paid seats
SaaS (B2B per-tenant)            Active tenants, paying tenants
Marketplace                      GMV, transactions, paying customers
API platform                     API requests, paying calls
Ad-supported                     Impressions, sessions, MAUs
E-commerce                       Orders, GMV, paying customers
Consumer mobile                  DAU / MAU, retained users
B2B services                      Contracts, ACV
```

A common starter is MAU for consumer-facing products, ACV for B2B, GMV for marketplaces. Refine after the basics are working.

### Source paths

```
PUSH API (recommended for live data)
  Customer's analytics platform POSTs daily values
  Authentication: API key or PAT
  Format: [{date: '2026-05-20', value: 5000}, ...]
  Cadence: daily; can backfill historical
  
CSV UPLOAD (for backfill or batch)
  Multipart CSV upload via UI or API
  One-time or periodic
  Useful for: bulk historical data; small orgs without dev resources
  
PULL API (when customer prefers central control)
  ZopNight fetches from customer's HTTPS endpoint
  Customer provides: URL, auth mechanism, expected cadence
  Useful for: orgs that maintain central data lakes; compliance
  preferences
  
(L6 covers ingest paths in detail; this lesson covers the metric
itself.)
```

### How ZopNight uses unit metrics

The `unit_metric_values` table stores daily (date, metric_id, value) triples. The cost trend chart joins this with `cost_records` on date to compute cost-per-X for any rendered window. When the cost data is filtered (by team, by tag, by account), the join produces filtered-cost-per-X.

For audit purposes, the source of each value is logged: which API call, which user/PAT, what timestamp. Customers preparing for compliance audits can show the data provenance back to the original push.

---

## 2. Demo

A SaaS company adding the MAU overlay for the first time:

```
COMPANY:  B2B SaaS, growing 8% MoM
PROBLEM:  CEO sees cloud bill +21% over 90 days; concerned
QUESTION: "Is this growth healthy or wasteful?"

SETUP (one-time, ~30 minutes):
  Step 1: Define metric in ZopNight
            Name: monthly_active_users
            Label: MAU
            Display scale: 1
            
  Step 2: Configure push from their analytics platform
            Endpoint: POST /v1/unit-metric-values/MAU
            Auth: PAT
            Source: customer's data pipeline pushes daily at 04:00 UTC
            
  Step 3: Historical backfill (CSV upload)
            Upload 90 days of daily MAU values
            ~90 rows
            
  Step 4: Activate overlay on Reports → Cost Trend
            Done.

REPORT TO CEO (next monthly review):
  Cost Trend chart now shows two lines:
    
    Apr  spend $84K   MAU 11,700   $7.20/MAU
    May  spend $96K   MAU 14,200   $6.76/MAU
    Jun  spend $102K  MAU 16,000   $6.40/MAU
    
  HEADLINE: "Cost grew 21% as user base grew 37%.
             Cost-per-user fell 11%.
             Growth is more efficient than last quarter."
             
DECISION:
  CEO understanding shifts from "we're spending more" to
  "we're more efficient per user." Continued growth investment
  approved.

OUTCOME:
  Unit-economics overlay reframes the cost conversation. The
  absolute number (which was rising and scary) becomes a sub-
  story; the per-MAU number (which is falling and good) becomes
  the headline.
```

---

## 3. Hands-on (5 min)

For your business, draft the unit-economics setup:

```
BUSINESS MODEL:        __________ (SaaS / marketplace / etc.)
PRIMARY DENOMINATOR:    __________ (MAU / ACV / GMV / etc.)

DEFINITION OF YOUR DENOMINATOR (one sentence — be specific):
  __________________________________________________________

PIPELINE FOR DATA:
  Source system:          __________ (analytics platform name)
  Ingest path:            Push API / CSV / Pull API
  Cadence:                Daily / weekly
  Owner of the pipeline:  __________

TARGET COST-PER-X:
  Current (estimate):     $______ per __________
  Target (1 year):        $______ per __________
  Strategy to improve:    __________________________________________

POTENTIAL PITFALLS:
  □ Denominator definition could change
  □ Source data could become stale
  □ Cross-team comparison risk
  □ Lack of historical baseline
```

If you cannot define the denominator in one specific sentence, the metric will drift. Lock the definition before configuring.

---

## 4. Knowledge check

### Q1
A team's cost-per-MAU is $7.20 falling to $6.40 over 3 months. The interpretation:

A. Cost is going down
B. Efficiency is improving. Absolute cost may be rising, but it's rising slower than the user base. The unit-economics narrative ("cost-per-user is down 11%") is more useful than the absolute narrative ("cost is up 21%") for leadership.
C. Cost stable
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Falling cost-per-X = improving efficiency. The absolute number may be up; the unit story is positive.
</details>

### Q2
The three ingest paths for unit metrics:

A. Just one (API only)
B. Push API (customer-driven, live), CSV upload (bulk / historical), Pull API (ZopNight-driven, scheduled). Customer picks based on their data pipeline shape. L6 covers each in detail.
C. Only CSV
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Three paths. Push for live; CSV for backfill; Pull when customer wants central control.
</details>

### Q3
Per-team unit economics across very different workloads:

A. Use for cross-team competition
B. Different teams have different workload natures. Per-team cost-per-MAU isn't directly comparable across teams — ML inference will always cost more per MAU than CRUD endpoints. Use the metric for within-team trends and target-tracking, not for cross-team rankings. Use it WITH context, not as a leaderboard.
C. Identical metrics
D. Aggregate only

<details>
<summary>Show answer</summary>

**Correct: B.** Per-team variation is expected; rankings would be misleading without context. Trend within teams is the right use.
</details>

---

## 5. Apply

Configure unit metrics at [Settings → Unit Metrics](https://app.zopnight.com/settings/unit-metrics). The setup wizard walks through metric definition, source configuration, and historical backfill. After activation, the overlay appears on [Reports → Cost Trend](https://app.zopnight.com/reports/cost-trend).

For executive reporting, build a dashboard widget showing cost-per-X with month-over-month delta — this becomes the headline number for monthly cost reviews.

---

## Related lessons

- [L1 — Pick the dimension](L1_pick_dimension.md)
- [L2 — Team attribution](L2_team_attribution.md)
- [L3 — Tag attribution](L3_tag_attribution.md)
- [L4 — Tag coverage](L4_tag_coverage.md)
- [L6 — Push, pull, CSV ingest](L6_ingest_paths.md) *(next)*
- [T4.M4.3 — Unit economics rationale](../../T4_finops_mastery/M4.3_unit_economics/00_README.md)

## Glossary terms touched

[Unit metric](../../../reference/glossary/unit-metric.md) · [Cost-per-X](../../../reference/glossary/cost-per-x.md) · [Denominator](../../../reference/glossary/denominator.md) · [Unit economics overlay](../../../reference/glossary/unit-economics-overlay.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.5.L5
