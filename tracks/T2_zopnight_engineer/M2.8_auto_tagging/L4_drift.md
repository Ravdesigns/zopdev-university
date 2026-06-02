# Tag drift and reconciliation

§ T2 · M2.8 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **detect** when cloud-side tags drift from ZopNight's expectations, **reconcile** via the three resolution paths (trust cloud / trust ZopNight / re-evaluate), **and prevent** drift accumulation via weekly review.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Keep tag coverage healthy by detecting and resolving drift weekly — don't let cloud-side tag changes silently desync ZopNight's view." |
| **Personas** | Platform Engineer · FinOps Lead · DevOps Engineer |
| **Prerequisites** | M2.8.L1 - L3 · T5.M5.1.L4 (tag drift) |
| **Time** | 9 minutes |
| **Bloom verb** | Detect (Apply), Reconcile (Apply), Prevent (Apply) |

---

## 1. Concept

Tags can change without ZopNight's knowledge: an engineer in the cloud console modifies a tag, terraform applies new values, a cloud-side automation updates tags. Auto-tagger predictions become stale or contradictory.

```
DRIFT IS NORMAL:
  Cloud is large; many tools touch it
  Tags change for legitimate reasons (and sometimes not)
  
ZOPNIGHT'S DRIFT DETECTION:
  Catches divergence within 6 hours
  Surfaces to operator
  Operator resolves with right intent
  
PREVENTION:
  Weekly drift review keeps it bounded
  Without review: drift accumulates; reports degrade
```

The drift handling is the maintenance layer for the auto-tagger.

### How drift detection works

Each discovery sync compares cloud-side tags to ZopNight's expected tags:

```
DRIFT DETECTION EVENT:
─────────────────────────────────────────────────────────────────
Resource: i-0abc123
ZopNight tag: environment=dev (accepted from auto-tagger 2026-04-15)
Cloud-side tag (discovered 2026-05-20): environment=prod

DRIFT: cloud has env=prod; ZopNight has env=dev

ACTION OPTIONS:
  1. Trust cloud (the human changed it deliberately)
  2. Trust ZopNight (auto-tagger had correct context)
  3. Re-evaluate (auto-tagger runs fresh inference)
```

The drift is surfaced to the user; they pick the resolution.

### Common drift sources

```
SOURCE                                  PATTERN
─────────────────────────────────────────────────────────────────
Manual changes in cloud console         Engineer renames env tag
                                        Quick fix during incident
                                        Adjusts for new project
                                        
Terraform apply with new tag config     Tag value changes via IaC
                                        Legitimate but ZopNight unaware
                                        
Cloud-side automation                   Auto-policies adjust tags
                                        Based on instance config
                                        Often triggered by config changes
                                        
Multi-team conflicts                    One team renames; another
                                        hasn't synced
                                        Confusion about ownership
                                        
Manual error                            Typo in tag value
                                        Wrong env applied
                                        Cleanup needed
                                        
Migration / move                         Resource moved to different account
                                        Tags get applied or removed
                                        Standard operation
```

The variety of sources is why drift detection matters.

### How ZopNight handles drift

```
ON DISCOVERY:
  ZopNight compares current cloud tags to its tag record
  
NO DIFFERENCE: silent (everything aligns)

DIFFERENCE:
  Surface in Insights → Tag Drift panel
  List affected resource with old vs new value
  Provide "Trust cloud" / "Trust ZopNight" / "Re-evaluate" buttons
  Highlight high-confidence vs low-confidence drift

ACCUMULATION:
  Drift entries accumulate in the queue
  Until resolved
  Weekly cadence keeps queue manageable
```

The detection is automatic; the resolution is operator-driven.

### Decision criteria for resolution

```
"TRUST CLOUD"
  WHEN:
    Confident the change was deliberate
    Common when terraform/CI is the source of truth
    Manual change made by trusted engineer
    
  EFFECT:
    ZopNight updates its record to match cloud
    Discovery's view becomes the new "expected"
    No cloud-side action

"TRUST ZOPNIGHT"
  WHEN:
    Confident ZopNight's record is correct
    Cloud-side change was unauthorized
    Wrong tag value applied
    
  EFFECT:
    ZopNight re-syncs (overwrites cloud tag)
    Cloud-side tag updated via API
    Discovery confirms next cycle

"RE-EVALUATE"
  WHEN:
    Both could be right
    Resource has changed context
    Want fresh inference
    
  EFFECT:
    Auto-tagger runs fresh inference
    New prediction surfaces
    User accepts/rejects from there
```

The three paths cover the decision space.

### Anti-pattern — ignoring drift

```
IF A TEAM consistently ignores drift detection:
  Tag coverage drifts down over time
  Reports become unreliable
  Compliance gaps appear
  Auto-tagger predictions stale
  Cost attribution accuracy decays
  
WEEKLY DRIFT REVIEW prevents this
  Add it to the Operate cadence
  15 min/week typical
  Backlog stays bounded
```

The discipline is the maintenance. Without it, drift compounds.

### Drift via the Tag Coverage widget

The Tag Coverage widget on the dashboard shows:

```
TAG COVERAGE                          THIS MONTH
─────────────────────────────────────────────────────────────
Tagged resources:        87%
Untagged resources:      13%
DRIFT (mismatch):         3%   ← worth investigating
RECENTLY CHANGED:        12    ← visibility for the operator
```

Drift trending up is a signal to investigate the sources.

### Eventual consistency

ZopNight's tag state is eventually consistent with the cloud:

```
TIMELINE:
  T+0      Cloud-side change happens (10:30 AM)
  T+6h     ZopNight detects at next discovery (max 6 hours)
  T+6h     ZopNight surfaces the drift
  T+1week  User reviews + resolves in weekly cadence
  
LAG IS ACCEPTABLE for governance use cases
  Reports update within a week
  Tag coverage stays healthy
  Trends visible

FOR REAL-TIME TAG-BASED IAM:
  Tag changes affect IAM immediately (cloud-side)
  Drift detection within 6 hours
  ZopNight's view catches up next discovery
  But IAM impact is immediate; not lagged by ZopNight
```

The lag is bounded; acceptable for most use cases.

### Bulk-resolve patterns

```
TYPICAL WEEKLY DRIFT QUEUE:
  10-20 entries
  Mostly Terraform-driven (predictable; can bulk-accept "Trust cloud")
  Some manual changes (review each)
  Few unauthorized (investigate + revert)

BULK RESOLUTION:
  Filter by source: "Terraform apply"
  Bulk-action: Trust cloud (all)
  
  Filter by source: "Manual console change"
  Review each individually
  
  Filter by source: "Unknown / suspicious"
  Investigate first
```

The bulk operations make the weekly cadence sustainable.

### Drift trending — monitor over time

```
HEALTHY pattern:
  Weekly drift: 5-15 entries
  Resolved within the week
  Trend flat
  
WARNING pattern:
  Weekly drift: 20-50 entries
  Resolution backlog growing
  Trend up
  Investigate sources
  
ALARMING pattern:
  Weekly drift: 50+ entries
  Tag coverage falling
  Multiple unknown sources
  Process breakdown; intervene
```

The trend matters more than the absolute count. Flat is healthy.

---

## 2. Demo

A team's drift management:

```
WEEKLY OPERATE MEETING (Friday, 30 min):

T+0      Open Insights → Tag Drift
         15 drift entries this week

T+1 min  Categorize by source:
         10 drift entries on infra managed by Terraform
            (CI updated tags as part of recent deploy)
         3 drift entries from manual console changes
            (engineer renamed env tag for clarity)
         2 drift entries where ZopNight prediction conflicts with newer tag
            (auto-tagger and cloud disagree)

T+5 min  Resolution per category:
         
         10 Terraform-driven:
           Trust cloud (CI is source of truth)
           Bulk-action: Trust cloud for all 10
           Tags updated in ZopNight to match cloud
           
         3 manual:
           Investigate each:
             1 was correct (engineer renamed env appropriately)
                → Trust cloud
             2 were unauthorized (revert)
                → Trust ZopNight; cloud-side fixed
           
         2 conflicts:
           Re-evaluate
           Auto-tagger runs fresh inference
           Better answer emerges
           Accept the new prediction

T+10 min Drift resolved
         Coverage maintained at 91%
         No backlog growth

POST-MEETING:
  Slack #finops-weekly: "Drift review complete"
  15 entries → 0 pending
  3 unauthorized investigated; 2 corrected; 1 confirmed legit
```

15 minutes per week to keep tag coverage healthy.

---

## 3. Hands-on (5 min)

Run a drift review:

```
□ STEP 1: Open Insights → Tag Drift
  Total drift entries: _____
  Categories: __________

□ STEP 2: Group by source
  Terraform-driven: _____
  Manual changes: _____
  Cloud-side automation: _____
  Unknown: _____

□ STEP 3: Resolve in batches
  Bulk-trust-cloud for Terraform-driven: _____ resolved
  Review manual: _____ accept; _____ revert
  Re-evaluate conflicts: _____ resolved

□ STEP 4: Check trend
  Drift count this week: _____
  Prev week: _____
  Trend: □ Up □ Down □ Flat

□ STEP 5: Schedule next review
  Date: __________
  Cadence: weekly
```

A 15-minute weekly review keeps drift bounded.

---

## 4. Knowledge check

### Q1
A drift event shows cloud has env=prod; ZopNight has env=dev. Engineer changed it in the console. Resolution:

A. Random
B. Trust cloud — the engineer's action is the human source of truth. ZopNight updates its record to match. Cloud-side change is the explicit signal.
C. Reject
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** Trust cloud when human change is the explicit signal.
</details>

### Q2
A drift event shows env tag deleted from cloud. Engineer didn't do it. Resolution:

A. Random
B. Trust ZopNight — re-sync ZopNight's tag back to cloud. Investigate the deletion (likely auto-policy or compromised account). Cloud-side change without human authorization = suspicious.
C. Tag is gone
D. Discovery error

<details>
<summary>Show answer</summary>

**Correct: B.** Trust ZopNight + investigate source.
</details>

### Q3
Tag drift trending upward over time suggests:

A. Random fluctuation
B. The cloud-side changes are happening outside the auto-tagger or team policies. Source: investigation needed. Trends inform process improvements. Trending up = unhealthy; tightening required.
C. ZopNight bug
D. Default behavior

<details>
<summary>Show answer</summary>

**Correct: B.** Trends inform process improvements.
</details>

---

## 5. Apply

Drift detection in Insights → Tag Drift. Tag Coverage widget surfaces overall health. Weekly review recommended.

For your team: 15 min/week drift review. Bulk-resolve Terraform-driven; investigate manual; re-evaluate conflicts.

---

## Module quiz

Complete M2.8 → 10-question module quiz unlocks the **Tag-Wise** chip.

---

## Related lessons

- [L1 — Environment + noStop predictions](L1_predictions.md)
- [L2 — Inference signals](L2_inference.md)
- [L3 — Accept / reject](L3_accept_reject.md)
- [T5.M5.1.L4 — Tag drift detection](../../T5_devops_cost_discipline/M5.1_tagging_strategy/L4_drift_detection.md)

## Glossary terms touched

[Tag drift](../../../reference/glossary/tag-drift.md) · [Drift resolution](../../../reference/glossary/drift-resolution.md) · [Trust cloud vs trust ZopNight](../../../reference/glossary/trust-cloud-vs-zopnight.md) · [Tag Coverage widget](../../../reference/glossary/tag-coverage-widget.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.8.L4
