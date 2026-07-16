# Tag attribution

§ T3 · M3.5 · L3 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **attribute** cost across any tag dimension (cost-center, environment, project, campaign), **distinguish** cloud-native tags from ZopNight's auto-tags, **and combine** tag attribution with team scoping.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Slice cost by any attribute that matters to the business — not just the team that provisioned it." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner · Marketing |
| **Prerequisites** | M3.5.L1 (pick the dimension) · M3.5.L2 (team attribution) |
| **Time** | 9 minutes |
| **Bloom verb** | Attribute (Apply), Distinguish (Analyze), Combine (Apply) |

---

## 1. Concept

Tag attribution is the flexible attribution dimension. Where team attribution maps cost to ZopNight's `team` concept (a first-class entity in the product), tag attribution maps cost to arbitrary tag keys — `cost_center`, `environment`, `project`, `campaign`, `bu`, `application`, anything the business cares about.

The flexibility is the point. Team attribution answers "who owns this." Tag attribution answers "what category does this fall into." Both can be true at once; they compose.

```
TAG ATTRIBUTION                                EXAMPLE QUERIES
──────────────────────────────────────────────────────────────────
By cost-center                                  "Which cost-centers
                                                burn the most?"
By environment                                  "How does prod
                                                compare to staging?"
By project / initiative                          "What did the 
                                                replatforming cost?"
By campaign                                      "Was the Q2 launch
                                                profitable?"
By compliance scope                              "PCI-scoped vs non-
                                                PCI spend?"
```

### Reports → Tags

```
SURFACE: Reports → Tags

  FILTER:    key=cost_center
  GROUP BY:  value
  RESULT:
    cost_center=engineering-platform   $24,000
    cost_center=engineering-product    $18,000
    cost_center=marketing               $5,800
    cost_center=customer-success        $3,200
    cost_center=(not tagged)            $4,000  ← coverage gap
    
  TIME:      monthly trend
  EXPORT:    CSV / JSON / API
```

The Tags report mirrors the Teams report's structure but uses arbitrary tag keys instead of the team dimension.

### Cloud-native tags vs auto-tags

Tags come from two sources, and ZopNight tracks both:

```
SOURCE        DESCRIPTION                          DIMENSION_SOURCE
──────────────────────────────────────────────────────────────────
Cloud-native   Applied at provision time by         "cloud"
              Terraform / CloudFormation / 
              console / API
              
Auto-tag       Predicted and applied by             "auto"
              ZopNight's auto-tagger (T2.M2.8);
              customer can accept / reject
```

Both contribute to attribution. The `dimension_source` column on `cost_allocation_daily` lets reports filter to only-cloud-native (stricter) or all-tagged (more coverage). Most reports show the union.

The auto-tagger is what makes tag coverage tractable at scale. Manual tagging discipline always slips; auto-tagging closes 20-30% of the gap automatically for most customers.

### Filtering by tag value

```
QUERY:     "Cost where tag environment=prod across all teams"

FILTER:    dimension_type = tag
           dimension_key = environment
           dimension_value = prod
           
RESULT:    Total prod-tagged spend, with drill into:
           - Top resources
           - Top teams contributing
           - Time-series trend
```

The query is two filters away from any cost question that involves an environment, cost-center, or project attribute.

### Multi-tag combinations

```
QUERY: "Cost where environment=prod AND team=platform"

FILTER:    dimension_type = tag, dimension_key = environment,
           dimension_value = prod
           AND
           team = platform
           
RESULT:    Intersection — platform's prod spend, separated from
           platform's dev or staging spend
```

The intersection pattern handles the "show me X's slice of Y" class of questions. Reports → Tags supports up to three filters in combination; for more complex queries, drop into custom dashboards (M3.7).

### Tag coverage matters

Tag attribution is only as good as the coverage:

```
SCENARIO: 73% of resources have `cost_center` tag

  Reports → Tags → key=cost_center
    cost_center=engineering-platform   $24,000   (matched)
    cost_center=engineering-product    $18,000   (matched)
    cost_center=marketing               $5,800   (matched)
    cost_center=(not tagged)             $4,200   (gap)
    
  Coverage:  73% by spend, 81% by resource count
  Report reliability: high but incomplete
  
  Worst case: a $4,200 chunk of spend cannot be attributed.
  An auditor or finance partner will ask about it.
```

ZopNight's Tag Coverage widget (L4) surfaces the coverage gap explicitly so it can be tracked and closed.

### When tag attribution wins over team

```
USE CASE                                  TAG IS RIGHT
──────────────────────────────────────────────────────────────────
Cost-center reporting (finance-driven)    Yes — finance thinks in
                                          cost-centers; teams are an
                                          engineering concept
                                          
Environment breakdown                      Yes — environment crosses
                                          teams; tag is the right
                                          dimension
                                          
Project / initiative cost                  Yes — projects span teams
                                          and time; tag fits
                                          
Compliance scope                          Yes — PCI/HIPAA scope is
                                          attribute-driven
                                          
Marketing campaign cost                   Yes — campaigns are tagged
                                          events
                                          
Per-team accountability                   No — Teams dimension is
                                          first-class for this
```

A common pattern: finance views in `cost_center` tags, engineering views in `team` (the first-class dimension). Reports for each audience use the appropriate dimension.

### Auto-tag governance

Auto-tags can be wrong. ZopNight surfaces them as predictions; the customer accepts or rejects.

```
AUTO-TAG LIFECYCLE:
  ZopNight predicts:   "this resource looks like team=platform"
  Status:              Pending (not applied yet)
  Customer reviews:    Settings → Auto-tags → pending
  Decision:            Accept (applies the tag) or Reject (won't
                       suggest again for this resource)
  Once accepted:       Tag flows into attribution
```

The pending queue is the governance point. Accepting in bulk without review can introduce wrong tags; rejecting nothing leaves coverage low. A weekly review of the pending queue is the typical cadence.

### Tag taxonomy

Before deploying tag attribution at scale, the customer benefits from a tag taxonomy — a documented list of allowed keys and value patterns:

```
ALLOWED TAG KEYS (taxonomy):
  team                Must be one of: platform, product, data, ml, ...
  environment         Must be one of: prod, staging, dev, sandbox
  cost_center         Must be one of: eng-platform, eng-product, ...
  project             Free-form; recommended pattern: kebab-case
  campaign            Free-form; recommended: YYYY-Q?-name format
  application         Free-form; required for prod resources
  
DEPRECATED:
  cost-center (use cost_center)
  env (use environment)
```

A taxonomy prevents tag-value drift (variants like `prod` / `production` / `Prod`) that fragments attribution. Tag policies (Settings → Tag policies) enforce the taxonomy at write time.

### How ZopNight uses tag attribution

Tag attribution is implemented through the same `cost_allocation_daily` table as team attribution, with `dimension_type='tag'`. The Reports → Tags surface queries this table with filters. The auto-tagger writes auto-source tags into the same tag store, distinguished by `dimension_source='auto'`.

For customers transitioning to mature attribution, the recommended sequence is: stand up the taxonomy → enforce in IaC → run auto-tagger to close historical gap → manual cleanup of high-spend stragglers → quarterly review cadence.

---

## 2. Demo

A marketing campaign cost analysis:

```
SCENARIO: Q2 product launch campaign

SETUP:
  All campaign-related resources tagged:
    campaign=2026-Q2-launch
    
  Includes:
    Lambda functions for the launch microsite
    CloudFront distribution for static assets
    S3 buckets for media
    RDS for landing-page leads
    Datadog monitoring scoped to campaign

QUERY in ZopNight:
  Reports → Tags → key=campaign, value=2026-Q2-launch
  Time: campaign window (April 1 → July 31)

RESULT:
  Total cost: $14,200
  Per-service breakdown:
    Lambda           $4,800
    CloudFront        $3,400
    S3                $2,800
    RDS               $2,200
    Datadog           $1,000
  Per-day trend:    spike at launch (April 15), declining to zero
                    by July 28

INTERPRETATION (presented to marketing + finance):
  Campaign generated $X revenue (tracked separately)
  Direct campaign cost (cloud): $14,200
  Campaign ROI: revenue/cost ratio
  Efficiency: $/lead = $14,200 / lead_count

DECISION:
  Q3 campaign will use same tagging approach; we can compare ROI
  across campaigns over time.
```

Tag attribution made this analysis possible. Without the `campaign` tag, the cost would have been spread across multiple teams' accounts with no way to isolate the launch-specific spend.

---

## 3. Hands-on (5 min)

For your team, identify two tag dimensions worth tracking:

```
TAG DIMENSION 1:
  Key:              __________
  Why it matters:    __________________________________________
  Current coverage:  _____ %
  
TAG DIMENSION 2:
  Key:              __________
  Why it matters:    __________________________________________
  Current coverage:  _____ %

QUESTIONS this attribution would answer:
  1. __________________________________________________________
  2. __________________________________________________________

If coverage is low (<70%):
  Run auto-tagger on the missing resources
  Manual-tag the top-spend missing resources
  Add the key to your tag taxonomy + IaC enforcement
```

---

## 4. Knowledge check

### Q1
A team wants to track "marketing campaign Q2" cost. Best dimension:

A. Team
B. Tag with custom key=campaign. Flexible attribution by business event. The campaign spans teams (engineering, marketing, ops); team attribution would split rather than aggregate. Tag attribution aggregates the entire campaign correctly.
C. Account isolation
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Campaigns cross teams; tags are the right dimension. The Q2 campaign tag aggregates regardless of which team provisioned the resource.
</details>

### Q2
Cloud-native tag vs ZopNight auto-tag attribution:

A. Different surfaces — one for each
B. Same surface — both contribute to the same `cost_allocation_daily` table; the `dimension_source` column distinguishes provenance. Reports can filter to only cloud-native (stricter) or include auto-tags (more coverage). Auto-tags require customer acceptance before they take effect.
C. Cloud-native only
D. Auto-tags are read-only previews

<details>
<summary>Show answer</summary>

**Correct: B.** Both contribute equally once accepted. Provenance is tracked for audit.
</details>

### Q3
Tag coverage at 65%. The impact on attribution:

A. Nothing — 65% is fine
B. Reports show 35% Unattributed for that tag key. Tag-driven attribution misses 35% of spend. Worth investing to lift coverage via auto-tagger, manual cleanup, and IaC enforcement. The remaining 35% becomes an Unattributed bucket in any Tags report filtered to that key.
C. Random
D. Reports still 100% accurate

<details>
<summary>Show answer</summary>

**Correct: B.** Coverage limits report reliability for that dimension. The unattributed portion is real spend that cannot be sliced by the chosen tag.
</details>

---

## 5. Apply

Query tag attribution at [Reports → Tags](https://app.zopnight.com/reports/tags) — pick a key, optionally a value, optionally combine with team. The auto-tagger surfaces predictions at [Settings → Auto-tags](https://app.zopnight.com/settings/auto-tags) for accept/reject.

Define and enforce your tag taxonomy at [Settings → Tag policies](https://app.zopnight.com/settings/tag-policies) — this prevents value-drift over time.

---

## Related lessons

- [L1 — Pick the dimension](L1_pick_dimension.md)
- [L2 — Team attribution](L2_team_attribution.md)
- [L4 — Tag coverage](L4_tag_coverage.md) *(next)*
- [L5 — Unit economics](L5_unit_economics.md)
- [T2.M2.8 — Auto-tagger module](../../T2_zopnight_engineer/M2.8_auto_tagging/00_README.md)

## Glossary terms touched

[Tag attribution](../../../reference/glossary/tag-attribution.md) · [Auto-tag](../../../reference/glossary/auto-tag.md) · [dimension_source](../../../reference/glossary/dimension-source.md) · [Tag taxonomy](../../../reference/glossary/tag-taxonomy.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.5.L3
