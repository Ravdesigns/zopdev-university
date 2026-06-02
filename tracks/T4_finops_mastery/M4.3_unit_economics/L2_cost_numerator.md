# The cost numerator

§ T4 · M4.3 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** what cost to include in the unit-economics numerator, **scope** service-specific cost correctly, **and document** the numerator so trends remain meaningful over time.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Define a cost numerator that is reproducible, meaningful, and stable enough for cross-quarter trend analysis." |
| **Personas** | FinOps Lead · Engineering Leader · Platform Engineer |
| **Prerequisites** | M4.3.L1 — Picking the denominator |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Scope (Apply), Document (Apply) |

---

## 1. Concept

The denominator (M4.3.L1) tells you what unit of value you are dividing by. The **numerator** is the dollar amount in the cost-per-unit calculation — and which dollars to include matters a lot. Different numerator definitions produce wildly different cost-per-MAU numbers from the same cloud bill.

```
NUMERATOR OPTIONS:
  A. Total cloud cost                All infrastructure
  B. Service-specific cost            Just the user-serving stack
  C. Allocated team cost              Cost attributed to the unit-
                                      producing team
  D. Allocated cost-center cost       Cost in a specific cost-center
```

Each option has trade-offs. The right choice depends on what story you want the metric to tell.

### Each option's trade-off

```
A. TOTAL CLOUD COST
   Simple: "Cost-per-MAU = total cloud / MAU"
   Pros:  easy; comprehensive
   Cons:  includes unrelated cost (ML training, internal tools,
          DR storage, etc.); inflates the unit cost
   Best for: high-level executive metric

B. SERVICE-SPECIFIC COST
   Cost of just the services that serve the unit
   Pros: directly tied to value production; actionable
   Cons: may miss indirect costs (the shared DB the service uses)
   Best for: engineering optimization target

C. TEAM COST
   Cost attributed to the team owning the unit-producing service
   Pros: matches accountability boundary
   Cons: requires strong team tagging discipline
   Best for: per-team unit economics

D. COST-CENTER COST
   Cost in a specific cost-center (finance dimension)
   Pros: aligns with finance reporting
   Cons: cost-centers don't always map cleanly to user-serving
         services
   Best for: finance-aligned reporting
```

### Pragmatic choice for most orgs

```
RECOMMENDED PATTERN:
  PRIMARY:    Option B (Service-specific) for the actionable
              engineering metric
  SECONDARY:  Option A (Total cloud) for the executive "where
              did the money go" number
  
WHY:
  Service-specific is most actionable for engineering decisions
  Total is good for org-level visibility + finance reporting
  Per-team (Option C) added later as the org matures
```

The "primary + secondary" pattern handles the engineering vs leadership tension. Engineers act on the service-specific number; leadership sees the total.

### Service-specific scoping

```
EXAMPLE — "Cost per MAU" for a SaaS company:

DEFINE the scope:
  INCLUDED:
    Cloud account: prod-aws-us-east-1
    Resources: api-cluster, app-cluster, primary-rds, redis-cache
    Service categories: compute, storage, data-transfer
  
  EXCLUDED:
    ml-training cluster (not user-facing; separate workload)
    shared services (logging, monitoring — overhead)
    dev/staging environments (not serving users)
    DR/backup storage (not direct user-serving)
    Internal tools (CI/CD, dev workstations)

NUMERATOR per month = sum of these resource costs
DENOMINATOR per month = MAU
```

The scope is **the cost responsible for serving the unit**. Anything else dilutes the metric.

### What to exclude

```
GENERALLY EXCLUDE                              REASON
──────────────────────────────────────────────────────────────────
ML training infrastructure                     Doesn't scale with MAU;
                                              scales with model size +
                                              training runs
                                              
Internal dev tools (CI/CD, dev envs)          Engineer cost, not user-
                                              serving cost
                                              
Backup / DR storage                            Not direct user-facing
                                              
One-time migrations                            Project cost, not
                                              ongoing serving cost
                                              
Acquired-company integration costs             Transition cost; mask
                                              the trend
                                              
Shared overhead (DNS, monitoring)              Indirect; small relative
                                              to direct cost; add noise
```

```
INCLUDE                                        REASON
──────────────────────────────────────────────────────────────────
Compute serving user requests                  Direct
Database backing user features                 Direct (or indirect
                                              but clearly tied)
CDN / data transfer to users                   Direct
Real-time monitoring of user-facing services   Tied to the service
Caching layers (Redis, Memcached)               Direct
Message queues for user-driven flows           Direct
```

### Per-team variation

```
For team-scoped unit economics:

  team=platform's cost-per-MAU:
    Numerator: sum of all resources tagged team=platform
              + share of shared resources via M3.5.L2 allocation
    Denominator: total org MAU
              (or team's served traffic if specifically measured)

  DIFFERENT teams will have very different numerators:
    Platform team: heavy compute + DB
    ML team:        heavy GPU + storage
    Data team:      heavy ETL + warehouse
    
  Cost-per-MAU varies by team because workloads differ.
  Use within-team trends; resist cross-team comparison.
```

### Drift to track

The numerator must stay reproducible over time:

```
BE REPRODUCIBLE:
  Same definition each month
  Same scope (no creeping additions)
  Same exclusions
  
BE DOCUMENTED:
  Anyone can find the scope rule
  Includes/excludes listed
  Owner identified

BE RE-EVALUATED QUARTERLY:
  Org changes; team boundaries shift
  New services launch; existing services deprecated
  Revise the scope; document the revision
```

Drift in numerator definition over time makes trends meaningless. A 9% improvement in cost-per-MAU is meaningful only if the numerator definition was stable over the comparison period.

### When the numerator changes

If you must redefine the numerator (e.g., new service launches that should be included), document the change and recompute prior periods under the new definition for transition continuity:

```
CHANGE LOG ENTRY:
  Date:           2026-05-01
  Old definition: included api-cluster, app-cluster only
  New definition: also includes ml-inference-cluster (now user-facing
                 for the new AI feature)
  Recomputation: prior 3 months recomputed under both old and new
                definitions for overlap
  Effective:      starting 2026-05-01 reporting cycle
```

This preserves comparability and signals to readers that the definition changed.

### How ZopNight uses the numerator

ZopNight's Unit Economics report supports numerator configuration via resource filters. The customer defines which resources count toward the numerator; the report aggregates them per period and divides by the configured denominator.

For multi-numerator reports, the customer can configure multiple unit economics streams and compare them — primary, secondary, per-team variants.

---

## 2. Demo

A SaaS company's numerator definition:

```
ORG:        B2B SaaS, $190K/mo total cloud
DENOMINATOR: paying users (8,500 at end of month)

NUMERATOR scope analysis:

TOTAL CLOUD ($190K):
  Compute, all envs:           $80K
  Storage, all envs:            $25K
  Data transfer:                $12K
  RDS clusters (prod + dev):    $35K
  ML training cluster:          $28K
  ML inference cluster:         $5K
  Monitoring + logging:         $5K

SERVICE-SPECIFIC SCOPE:
  Includes:
    Prod compute (api-cluster, app-cluster): $48K
    Prod RDS (primary, replicas): $22K
    CDN + data transfer: $12K
    Redis (prod): $5K
    ML inference (now serving user features): $5K
  Excludes:
    Dev/staging compute: ($30K)
    Dev/staging RDS: ($8K)
    ML training: ($28K — separate workload)
    Monitoring: ($5K — shared overhead)

NUMERATOR for cost-per-paying-user:
  Sum: $92K/mo
  Denominator: 8,500 paying users
  Cost-per-paying-user: $10.82

DOCUMENTED scope:
  Living doc in team wiki
  Reviewed quarterly
  Owner: FinOps Lead
  Last reviewed: 2026-04-15
```

The total cloud was $190K; the meaningful service-specific number was $92K. Cost-per-paying-user is $10.82 — a number engineering can act on.

---

## 3. Hands-on (5 min)

Define your numerator scope:

```
DENOMINATOR (from L1):    __________

NUMERATOR OPTION (A/B/C/D):    __________

SCOPE — INCLUDED:
  □ __________
  □ __________
  □ __________

SCOPE — EXCLUDED:
  □ __________ (reason: __________)
  □ __________ (reason: __________)
  □ __________ (reason: __________)

ESTIMATED numerator size:    $__________ /mo
COMPARE to total cloud cost: __________ %  (e.g., 48% of total)

DOCUMENTATION:
  Owner:           __________
  Review cadence:   quarterly
  Located:          (team wiki link / file path)

UNIT COST:
  Numerator / denominator = $__________ per __________
```

If the numerator is more than 80% of total cloud, you're probably including too much. If less than 30%, you might be missing real user-serving cost.

---

## 4. Knowledge check

### Q1
A team includes ML training cost in cost-per-MAU. Likely consequence:

A. More comprehensive metric
B. ML training scales with ML workload (training runs, model size), not with MAU. Including it inflates cost-per-MAU artificially when training intensifies, and deflates it when training pauses — both unrelated to user-serving efficiency. Better: exclude or report separately as cost-per-training-run.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Different scaling drivers; exclude. The metric should be sensitive to user-serving efficiency, not to ML training cadence.
</details>

### Q2
Service-specific numerator vs Total cloud:

A. Identical
B. Service-specific is more actionable but misses indirect costs (DB, monitoring). Total is broader but inflated by unrelated cost. Use both: primary (service-specific) for engineering, secondary (total) for finance and leadership. Tracked together they paint the full picture.
C. Random
D. Worse

<details>
<summary>Show answer</summary>

**Correct: B.** Both have value at different audiences. Primary + secondary pattern.
</details>

### Q3
Drift in numerator definition over time:

A. Doesn't matter for trends
B. Makes trends meaningless. A 9% YoY improvement is meaningful only if the numerator definition was stable over the comparison period. Lock the definition; revise quarterly with explicit change-log entries; recompute prior periods under both definitions during transitions.
C. Random
D. Reduces accuracy slightly

<details>
<summary>Show answer</summary>

**Correct: B.** Stable definition matters. Drift invalidates trend analysis.
</details>

---

## 5. Apply

Document the numerator scope in [Settings → Unit Metrics → numerator config](https://app.zopnight.com/settings/unit-metrics). Re-evaluate the scope quarterly; log any changes in the change log.

For multi-team orgs, define a service-specific numerator at the team level (per M3.5.L2 attribution) to track per-team unit economics.

---

## Related lessons

- [L1 — Picking the denominator](L1_picking_denominator.md)
- [L3 — Building the first dashboard](L3_first_dashboard.md) *(next)*
- [L4 — Forecasting unit cost](L4_forecasting_unit_cost.md)
- [L5 — Communicating to non-engineers](L5_communicating.md)
- [T3.M3.5.L2 — Team attribution](../../T3_zopnight_architect/M3.5_showback/L2_team_attribution.md)

## Glossary terms touched

[Numerator](../../../reference/glossary/numerator.md) · [Service-specific cost](../../../reference/glossary/service-specific-cost.md) · [Scope drift](../../../reference/glossary/scope-drift.md) · [Numerator change log](../../../reference/glossary/numerator-change-log.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.3.L2
