# Accept, reject, sync-back

§ T2 · M2.8 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **accept** or **reject** auto-tag predictions, **sync** accepted tags to the cloud provider, **and track** tag provenance via `dimension_source`.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Process auto-tag predictions efficiently — bulk-accept high confidence; review the rest; sync to cloud where needed." |
| **Personas** | Platform Engineer · FinOps Lead · DevOps Engineer |
| **Prerequisites** | M2.8.L1 · M2.8.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Accept / Reject (Apply), Sync (Apply), Track (Apply) |

---

## 1. Concept

Three actions on each prediction:

```
ACCEPT     Apply the tag in ZopNight; sync to cloud if configured
REJECT     Discard suggestion; don't show again until manual re-trigger
SNOOZE     Re-evaluate the prediction later (defer decision)
```

The decision per prediction shapes the tag landscape.

### Bulk acceptance pattern

For high-confidence predictions:

```
EFFICIENT BULK ACCEPT:

  Filter: confidence ≥ 90% AND no existing env tag
  Select all matching → Accept all
  
  This pattern processes 50-200 high-confidence predictions in seconds
  Most teams' fastest path to coverage

WHEN TO BULK-ACCEPT:
  Initial onboarding (large untagged backlog)
  Periodic discovery sweeps (new resources predicted)
  Post-reorg cleanup
```

The bulk-accept is the leverage point. Use it for high-confidence; deliberate for the rest.

### Sync-back to cloud

Accepted tags can be synced to the cloud's native tag system:

```
WITHOUT SYNC-BACK:
  ZopNight: tag environment=dev applied locally
  Cloud-side: untagged still
  Reports in ZopNight: see the tag
  Cloud-native tools: don't see it
  
WITH SYNC-BACK:
  ZopNight: tag applied locally
  Cloud API call: ec2:CreateTags
    Resources=[i-0abc123]
    Tags=[{Key=environment, Value=dev}]
  Cloud-side: now tagged
  Both ZopNight and cloud-native tools see the tag
```

The cloud now has the tag. Tag-based IAM policies, billing exports, and other cloud-native tools see it.

### When to sync-back

```
SYNC ON                            SCENARIO
─────────────────────────────────────────────────────────────
Tag-based IAM policies              Customer's IAM uses tag conditions
                                    Tag-driven access control
                                    
Cloud billing exports                Customer relies on cloud tags for billing
                                    AWS Cost Explorer, Azure Cost Management
                                    
Tag-based budget enforcement         Customer uses cloud-native budgets
                                    Per-tag budget thresholds
                                    
Compliance / audit reporting         Customer's audit trail expects cloud tags
                                    Auditor compares to cloud-side state
                                    
Multi-tool ecosystem                 Other FinOps/governance tools
                                    Expect cloud tags
```

```
SYNC OFF                          SCENARIO
─────────────────────────────────────────────────────────────
ZopNight-only attribution           Tags only used in ZopNight reports
                                    Cloud-side tagging managed elsewhere
                                    
Read-only credentials               No write permission to tag
                                    Sync-back fails
                                    
Risk-averse                          Want explicit control via cloud console
                                    Manual sync workflow preferred
                                    
Cloud IAM constraints                ZopNight credentials don't allow tagging
                                    Permissions limit
```

Default: sync-back ON. Most teams want consistency between ZopNight and cloud.

### Why `dimension_source` matters

When tags are accepted via auto-tagger and synced back:

```
THE CLOUD now has the tag (indistinguishable from manually-applied)
ZopNight records that the tag came from auto-tagger:
  dimension_source = auto

IN Reports → Tags:
  Filter by dimension_source = auto
  See auto-tagged contributions separately from cloud-native tags

THIS MATTERS FOR:
  Tag-coverage audits ("how much of our coverage comes from auto-tag?")
  Reconciliation against cloud-side tag standards
  Understanding the auto-tagger's effectiveness
  Compliance review (where did this tag originate?)
```

The provenance tracking is the audit-friendly feature.

### Reject workflow — durable

```
1. Customer clicks Reject on a prediction
2. ZopNight records: prediction_status = rejected_by_user_X
3. Prediction hides from the active queue
4. Resource remains untagged (or with cloud-native tags only)
5. Next discovery sync: prediction is NOT re-suggested
   (unless user clicks "Re-evaluate" on the resource)

REJECT IS DURABLE
  The prediction won't haunt the queue forever
  Won't re-appear and waste reviewer time
  Customer's decision is respected
  
TO RE-EVALUATE:
  Explicit action by user
  Manual trigger; not automatic
```

The durability is the UX win. Rejection is a real decision; not "ignore for now."

### Re-evaluation workflow

If conditions change (resource grew, was tagged manually, moved to a different group):

```
1. Open the resource → Actions → Re-evaluate prediction
2. Auto-tagger re-runs the inference with current state
3. New prediction (which may differ from previous)
4. Active in the queue for action

USE CASES for re-evaluation:
  Resource changed environment (dev → staging)
  Resource was renamed
  Resource was moved to different group
  Tags were manually adjusted by another tool
  After major reorganization
```

Manual re-evaluation handles the edge cases where status changed.

### Snooze pattern

```
SNOOZE = "decide later"
  Tag suggestion still in the queue
  But: removed from default view
  Reappears in 30 days (default) or custom timing
  
WHEN TO SNOOZE:
  Uncertain right now; want to check usage first
  Resource changing state (mid-migration)
  Waiting for team owner to confirm
  Not in this triage cycle's scope
```

Snooze is the "I'll think about it" option. Often: 80% accept / 15% reject / 5% snooze.

### Cloud-tag-as-source-of-truth pattern

```
SOME ORGS PREFER cloud tags as source of truth:
  
PATTERN:
  ZopNight predicts; suggests
  Customer reviews; accepts
  Sync-back applies tag to cloud
  Cloud is now the canonical tag store
  
  All tools (ZopNight + others) read from cloud
  Single source of truth
  No divergence

ALTERNATIVE:
  ZopNight as source of truth
  Cloud tags secondary
  
  Works if only ZopNight needs the tags
  Most orgs prefer cloud-as-truth
```

The sync-back pattern enables cloud-as-truth.

### Bulk operations etiquette

```
EFFICIENT BULK ACCEPT (when right):
  All high-confidence predictions
  All in one environment (e.g., all env=prod predictions)
  Same type pattern
  
WHEN BULK IS WRONG:
  Mixed confidence levels (some moderate)
  Mixed environments (would mass-mistag)
  After uncertain inference period

NEVER BULK-ACCEPT below 85% confidence
  Risk of mass-mistagging
  Each reject is more friction than each careful accept
```

Use bulk for efficiency; review for edge cases.

---

## 2. Demo

A team's first auto-tagging pass:

```
T+0      Open Insights → Auto-Tagging
         245 predictions across all resources

T+5min   Filter: confidence ≥ 95%
         84 high-confidence predictions
         Mostly env=prod tags on production-named resources

T+6min   Select all 84 → Bulk Accept → Sync-back enabled
T+30s    Tags applied to ZopNight database
T+30s    84 cloud-side ec2:CreateTags calls
         All succeeded
T+30s    Tag-coverage jumps: 62% → 76%

T+15min  Filter: confidence 85-94%
         78 moderate-confidence predictions
         Open each; review the inference panel briefly
         
         Decision per prediction:
           Match operator's knowledge: 65 → Accept
           Doesn't match (resource is different env): 13 → Reject
           
T+30min  Tag-coverage now at 87%

T+1 MONTH  Discovery picks up new resources
           New predictions surface naturally
           Operator runs through them weekly
           Coverage climbs to 92-94%
           
T+90 DAYS  Stable at ~93% tag coverage
           Quarterly review cleans the long tail
```

Bulk accept on high-confidence predictions is the fastest path to coverage.

---

## 3. Hands-on (5 min)

Process predictions in your estate:

```
□ STEP 1: Open Insights → Auto-Tagging
  Total predictions: _____
  Filter: confidence ≥ 95%

□ STEP 2: Bulk Accept high-confidence
  Select all → Accept (with sync-back if appropriate)
  Verify tags applied in ZopNight: __________
  Verify tags applied in cloud console (if sync-back): __________

□ STEP 3: Review moderate (85-94%)
  Pick 5 to review
  For each:
    Inference makes sense? □ Yes □ No
    Accept / Reject decision: __________

□ STEP 4: Calculate impact
  Tag coverage before: _____%
  Tag coverage after: _____%
  Resources tagged in this session: _____

□ STEP 5: Schedule next session
  Date: __________
  Goal: process moderate confidence remaining
```

A 30-minute session processes 80%+ of high-confidence predictions.

---

## 4. Knowledge check

### Q1
Accepting a prediction with sync-back enabled:

A. Updates ZopNight only
B. Updates ZopNight AND applies the tag to the cloud resource via ec2:CreateTags (or equivalent for GCP/Azure). The tag becomes visible to all tools — cloud-native budgets, IAM policies, audit exports. Sync-back applies the tag in the cloud.
C. Random
D. Tag is suggested only

<details>
<summary>Show answer</summary>

**Correct: B.** Sync-back applies the tag in the cloud.
</details>

### Q2
A rejected prediction:

A. Returns on next discovery
B. Is durable — won't be re-suggested unless the user manually re-evaluates. Reject is a real decision; not "ignore for now." Customer's decision is respected.
C. Auto-deletes
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Reject is durable.
</details>

### Q3
The `dimension_source` field on a tag indicates:

A. The tag value
B. Whether the tag came from cloud-native source or from auto-tagger acceptance. Useful for understanding tag provenance — "how much of our coverage came from auto-tag?" Provenance tracking for audits.
C. The cloud account
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Provenance tracking.
</details>

---

## 5. Apply

Accept / Reject in Insights → Auto-Tagging. Bulk actions for efficient processing.

For your team: monthly auto-tagging review; bulk-accept high-confidence; deliberate review for moderate.

---

## Related lessons

- [L1 — Environment + noStop predictions](L1_predictions.md)
- [L2 — Inference signals](L2_inference.md)
- [L4 — Drift detection](L4_drift.md) *(next)*
- [T5.M5.1.L4 — Tag drift detection](../../T5_devops_cost_discipline/M5.1_tagging_strategy/L4_drift_detection.md)

## Glossary terms touched

[Bulk accept](../../../reference/glossary/bulk-accept.md) · [Sync-back](../../../reference/glossary/sync-back.md) · [dimension_source](../../../reference/glossary/dimension-source.md) · [Tag provenance](../../../reference/glossary/tag-provenance.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.8.L3
