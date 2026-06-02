# Team attribution and shared resources

§ T3 · M3.5 · L2 of 6 · Architect tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **distribute** shared-resource costs equitably across consuming teams, **identify** when equal split is wrong and when usage-based attribution is required, **and drive** the Unattributed bucket toward zero.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Show each team a cost number they cannot argue with — including their share of shared infrastructure." |
| **Personas** | FinOps Lead · Platform Engineer · Finance Partner |
| **Prerequisites** | M3.5.L1 — Pick the dimension |
| **Time** | 10 minutes |
| **Bloom verb** | Distribute (Apply), Identify (Analyze), Drive (Evaluate) |

---

## 1. Concept

When a resource has a single team owner, attribution is trivial — the tag tells you who. The hard cases are **shared resources**: load balancers, databases, Kubernetes clusters, monitoring infrastructure that serve multiple teams. The question is how to split the cost equitably, and ZopNight's default is **equal split via `shareCount`**, with overrides for cases where equal is unfair.

```
SHARED RESOURCE: prod-shared-rds-1
  Used by team-platform (60% of queries)
  Used by team-product (40% of queries)
  Cost: $1,200/month
  
ATTRIBUTION OPTIONS:
  Equal split (50/50):  each team gets $600
  Usage-based:           platform $720, product $480
  Tag-driven:            based on workload_share_* tags
  Owner-pays:            one team picks up all of it
```

### Equal split via `shareCount`

This is the default. A resource tagged with multiple `team` values gets its cost split equally:

```
RESOURCE: prod-shared-rds-1
TAGS: team=platform, team=product
SHARE COMPUTATION:
  shareCount = number of distinct team values = 2
  per-team share = total cost / shareCount = $1,200 / 2 = $600

ALLOCATION RESULT:
  team=platform:  $600
  team=product:   $600
  Combined:       $1,200 (matches the resource cost — no over- or
                  under-attribution)
```

Equal split is the default for three reasons. **Simplicity**: no usage data required, no manual configuration. **Predictability**: teams know what to expect; the share does not change month-to-month based on traffic. **Avoids gaming**: usage-based attribution can incentivize teams to "off-load" by reducing their measured usage (e.g., caching aggressively to make their share smaller while still benefiting from the resource).

### When equal split is wrong

Equal split fails when usage is highly skewed:

```
SCENARIO 1: Team A uses 90%, team B uses 10%
  Equal split: each pays 50%.
  Team B is overcharged by 40 percentage points.
  Team A is undercharged by 40 percentage points.
  FIX: usage-based attribution.

SCENARIO 2: Team gets temporary access for a migration
  Equal split: charged ongoing despite the temporary nature.
  FIX: time-bound attribution rule (rare; usually the right answer
       is to remove the team tag after migration).

SCENARIO 3: Team is allocated capacity but doesn't use it
  Equal split: charged regardless.
  FIX: usage-based attribution OR re-evaluate whether the team
       should be on the shared resource at all.
```

The signal that equal split is wrong is usually **complaint volume**. Teams that feel overcharged surface it; teams that feel undercharged stay quiet. If you hear repeated complaints from one team, look at usage skew.

### Usage-based attribution via tags

For resources where equal split doesn't work, opt into usage-based attribution via specific tags:

```
RESOURCE: prod-eks-cluster-1
TAGS:
  team=platform
  team=product
  team=data
  cost_allocation_method=usage  (signals to ZopNight: use shares)
  workload_share_platform=0.6
  workload_share_product=0.3
  workload_share_data=0.1
  
ALLOCATION:
  $1,200 × 0.6 → team=platform → $720
  $1,200 × 0.3 → team=product → $360
  $1,200 × 0.1 → team=data → $120
  Sum:                              $1,200 (matches)
```

The `workload_share_*` tags carry the attribution percentages. ZopNight checks for the `cost_allocation_method=usage` tag; if present, it reads the shares; if absent, it falls back to equal split.

The shares can be sourced from the team's usage telemetry (Kubernetes namespace metrics, RDS query rates, S3 read patterns), refreshed monthly via tag updates. Some customers automate the tag-update from their telemetry; most update manually quarterly.

### What if no team tag?

```
team = (none)
  → Resource lands in the "Unattributed" bucket
  → Visible in Teams report as its own row
  → Cost is not chargeable to any specific team
  → Surfaces as a tagging gap to close
```

The Unattributed row should be visible and trended. A healthy org keeps Unattributed under 5% of total spend; mid-maturity orgs are in the 5-15% range; early-stage orgs can be 20-30%.

### Multi-team shared services pattern

A common, cleaner pattern: stand up a dedicated `shared-services` team that owns shared infrastructure as a unit.

```
PATTERN: dedicated shared-services team

  team=shared-services
  cost_owner=infrastructure-team
  
  Resources owned:
    DNS (Route 53 hosted zones)
    Monitoring (DataDog, Prometheus, Grafana)
    Logging (CloudWatch Logs, ELK, Sumo)
    Security tools (GuardDuty, vulnerability scanners)
    Container registries (ECR, GAR, ACR)
    CI/CD infrastructure (GitHub runners, Buildkite agents)
    
  COST FLOW:
    - All shared infra costs charged to shared-services team
    - shared-services team's budget covers the full cost
    - Optionally: re-allocate to consuming teams via internal
      chargeback (monthly journal entry from finance)
```

This pattern has two advantages over multi-team-tagged shared resources. First, **clarity**: the cost is attributed to one team that has explicit ownership. Second, **incentive alignment**: the shared-services team is responsible for the cost AND the service quality, which tends to produce better-optimized shared infrastructure.

### Drift detection on shared-resource tags

Over time, teams come and go from shared resources. If the team tags do not get updated, the attribution stays stuck at an old shape.

```
DRIFT EXAMPLES:
  - Team is dissolved, but its tag remains on resources
  - New team starts using a shared resource without tagging
  - workload_share_* tags reflect old usage patterns

DETECTION (quarterly review):
  - List all shared resources (resources with shareCount > 1)
  - For each, confirm the team list is current
  - For each with cost_allocation_method=usage, refresh shares from
    current telemetry
  - Update tags; ZopNight re-allocates from next allocation cycle
```

Most orgs catch drift quarterly; a few automate it continuously by sourcing the share tags from telemetry. Either works.

### How ZopNight uses team attribution

The Teams report aggregates `cost_allocation_daily` records where `dimension_type='team'`. Each row in the table represents a (team, date, cost, source_resource_uid, attribution_method) tuple. The attribution_method column distinguishes equal-split from usage-based allocations.

For audit purposes, every allocation is traceable back to the resource and the rule that produced it. If a team disputes a charge, the FinOps lead can drill from the team total → the allocation rows → the source resources → the tag values that drove the attribution.

---

## 2. Demo

A mid-size customer's team attribution after a clean review:

```
ESTATE: 12 cloud accounts, $75K/month total

TAGGING SHAPE:
  Single-team resources           40% of spend (clean attribution)
  Shared between 2 teams           20% of spend (equal split)
  Shared services                  15% of spend (dedicated team)
  Untagged / Unattributed         25% of spend ← gap

REPORTS → Teams view (current month):
  team=platform                    $24,000  (40% of total)
  team=product                     $18,000
  team=data                         $12,000
  team=shared-services              $7,500
  Unattributed                     $13,500  ← target
                                    ────────
  TOTAL                            $75,000

ANALYSIS:
  Top investment opportunity: reduce Unattributed from 18% to <5%.
  Estimated work: 3 days of tagging + 1 week of auto-tagger
  acceptance.
  Estimated impact: ~$10K of spend becomes attributable; chargeback
  becomes practical.

ACTION PLAN:
  Week 1: Run auto-tagger on Unattributed resources; accept
          high-confidence predictions
  Week 2: Manual cleanup of top-spend Unattributed resources
  Week 4: Re-measure; target 5% Unattributed
  Week 12: Steady-state monitoring with monthly trending
```

---

## 3. Hands-on (6 min)

For your estate:

```
SHARED-RESOURCE INVENTORY:
  Number of resources with shareCount > 1:    _____
  Are any using usage-based attribution?      Yes / No
  
HIGHEST-SKEW shared resource (one team uses much more):
  Resource:    __________
  Current attribution:    equal / usage-based
  If equal — should it be usage-based?     Yes / No / Maybe

UNATTRIBUTED BUCKET:
  Current % of total spend:    _____ %
  Target % (typical: <5%):    _____ %
  Gap-closing plan:
    □ Run auto-tagger on Unattributed
    □ Manual cleanup of top resources
    □ IaC tag enforcement to prevent future drift
    □ Quarterly review cadence

SHARED-SERVICES TEAM (if not already):
  Would your org benefit from a dedicated shared-services team?
  __________________________________________________________
```

If your Unattributed is above 20%, the gap-closing has a high return — every percentage point of improvement is real spend becoming chargeable.

---

## 4. Knowledge check

### Q1
A resource has `team=platform, team=product` and costs $1,200/month. Default attribution:

A. `team=platform` pays all
B. Equal split: $600 to each team (`shareCount=2`). This is ZopNight's default for multi-team-tagged resources. Predictable and simple; no usage data required.
C. Alphabetical (platform wins)
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Equal split via `shareCount`. The opt-in path to usage-based attribution exists but is not the default.
</details>

### Q2
A team uses 90% of a shared resource; another team uses 10%. Best attribution:

A. Equal split — simpler is better
B. Usage-based via tag-driven `workload_share_*`. Equal split overcharges the small user (50% of cost for 10% of usage). Refresh the share tags quarterly from telemetry; the small-user team's complaint will be the signal.
C. Owner-pays — bigger user pays all
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Usage-based for highly skewed sharing. Equal split is the default but not the answer for skewed cases.
</details>

### Q3
Unattributed bucket at 18% of total spend. Best action:

A. Ignore — 18% is acceptable
B. Investigate and reduce. Likely causes: untagged resources, resources provisioned before tag policy, manual cloud-console provisioning. Run auto-tagger; manual tag the top-spend Unattributed resources; turn on IaC tag enforcement to prevent re-drift. Target Unattributed → < 5%.
C. Random
D. Stop showing the bucket

<details>
<summary>Show answer</summary>

**Correct: B.** Drive Unattributed toward zero. Every percentage point recovered is real spend that becomes chargeable.
</details>

---

## 5. Apply

The Teams report at [Reports → Teams](https://app.zopnight.com/reports/teams) surfaces attribution by team, with the Unattributed bucket as its own row for visibility. Tag policies in [Settings → Tag policies](https://app.zopnight.com/settings/tag-policies) drive the auto-tagger and enforcement.

For shared-services patterns, create a dedicated team in [Settings → Teams](https://app.zopnight.com/settings/teams) and tag shared-infrastructure resources accordingly. The team's budget should cover the full shared infra cost.

---

## Related lessons

- [L1 — Pick the dimension](L1_pick_dimension.md)
- [L3 — Tag attribution](L3_tag_attribution.md) *(next)*
- [L4 — Tag coverage](L4_tag_coverage.md)
- [L5 — Unit economics](L5_unit_economics.md)
- [T3.M3.4.L1 — Why multi-account](../M3.4_multi_account/L1_why_multi.md)

## Glossary terms touched

[shareCount](../../../reference/glossary/share-count.md) · [Equal split](../../../reference/glossary/equal-split.md) · [Usage-based attribution](../../../reference/glossary/usage-based-attribution.md) · [Unattributed bucket](../../../reference/glossary/unattributed-bucket.md) · [Shared-services team](../../../reference/glossary/shared-services-team.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.5.L2
