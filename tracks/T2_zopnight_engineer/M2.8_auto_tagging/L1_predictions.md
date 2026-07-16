# Environment + noStop predictions

§ T2 · M2.8 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** environment and noStop predictions from the auto-tagger, **act** on confidence-tiered suggestions, **and close** the tag-coverage gap with auto-tagging.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Close the tag-coverage gap automatically — auto-tagger handles what IaC + cloud policy missed." |
| **Personas** | Platform Engineer · FinOps Lead · DevOps Engineer |
| **Prerequisites** | T5.M5.1 (tagging strategy) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Act (Apply), Close (Apply) |

---

## 1. Concept

The auto-tagger makes two kinds of predictions per resource:

```
PREDICTION 1: ENVIRONMENT
  Values: dev / test / stage / prod
  
PREDICTION 2: NOSTOP
  Boolean: can this resource be safely stopped?
  
EACH WITH CONFIDENCE SCORE (0-100%)
Customers accept or reject
```

Each prediction has a confidence score. Customers accept or reject.

### Why these two predictions

```
ENVIRONMENT:
  Most important tag in any cost-attribution scheme
  Drives reporting, showback, scheduling policy
  Most-missed tag in practice
  
NOSTOP:
  Critical "is this safe to act on" signal
  Prevents accidental production downtime
  Especially important for auto-remediation
  
TOGETHER:
  These two answer 80% of the "what is this resource?" question
  Other tags (team, cost-center, owner) follow naturally
  Once env + noStop are clean, the rest is easier
```

The two-prediction approach focuses on what matters most.

### Where predictions appear

```
INSIGHTS → Auto-Tagging page
─────────────────────────────────────────────────────────────────────
RESOURCE              CURRENT TAGS    PREDICTION         CONFIDENCE
─────────────────────────────────────────────────────────────────────
dev-platform-eu-1     (none)          env=dev             87%
                                       noStop=false        82%
                                       
staging-postgres      (none)          env=staging         91%
                                       noStop=true         78%
                                       
prod-payment-api      (none)          env=prod            94%
                                       noStop=true         96%
                                       
i-0xyz123             (none)          env=dev             45% ← low
                                       noStop=true         62%
```

For each prediction with high confidence, customer can accept. Low-confidence predictions (<70%) get a "review" suggestion.

### Acting on predictions

```
ACCEPT
  Tag is applied to the resource in ZopNight's database
  Synced to the cloud if configured (cloud-tag sync)
  Resource participates in cost reports going forward
  
REJECT
  Tag suggestion ignored
  Resource remains untagged
  Auto-tagger won't re-suggest this specific tag
  
REVIEW
  Show evidence panel
  User decides based on evidence
  Can accept after reading
  
SNOOZE
  Re-evaluate later
  Predictions can change as more data arrives
  Useful when uncertain right now
```

The four actions cover all decision paths.

### How confidence affects defaults

```
CONFIDENCE   RECOMMENDED ACTION
──────────────────────────────────────────────────────────────
≥ 95%        HIGH CONFIDENCE
              Likely safe to accept
              Bulk-accept is reasonable
              
85-95%       REASONABLE CONFIDENCE
              Review evidence first
              Accept after quick verify
              
70-85%       MODERATE CONFIDENCE
              Definitely review
              Don't bulk-accept
              
< 70%        DON'T AUTO-ACT
              Prediction is uncertain
              Manual investigation required
              May need more discovery cycles
```

A team that auto-accepts at 95% threshold sees most predictions land cleanly. Below that: manual review.

### Why predictions matter

```
AUTO-TAGGING CLOSES THE TAG-COVERAGE GAP automatically

TYPICAL JOURNEY:
  Without auto-tagger: 60-70% tag coverage
  With auto-tagger:    90+% tag coverage
  
  The remaining 5-10%: edge cases that need manual ID

ONCE TAGGED:
  Resources participate in cost reports
  Showback works
  Recommendations apply
  Scheduling can use tag-based selection
  
THE 30% GAP IS SIGNIFICANT:
  Untagged resources = orphaned cost
  Hard to attribute; hard to optimize
  Auto-tagger fills this gap
```

The gap closure compounds — every tagged resource enables more downstream value.

### How predictions are generated

```
SOURCES OF PREDICTION:
  
  Resource name patterns:
    "dev-*" → env=dev
    "prod-*" → env=prod
    "staging-*" → env=stage
    Deterministic pattern matching (no ML)
    
  Parent context:
    Resource in account "acme-dev" → env=dev
    Resource in account "acme-prod" → env=prod
    
  Sibling tagging:
    Other resources in same VPC/cluster
    Inheritance of common tags
    
  Resource type heuristics:
    RDS Multi-AZ → likely prod
    EBS encrypted → likely prod
    Smaller instance types → likely dev
    
  Existing tags + instance config:
    Other tags already on the resource
    Instance type / size (large = likely prod)
    Encryption / Multi-AZ config
    
COMPOSITE SCORE COMBINES all of these
  Higher when multiple rules agree
  Lower when rules conflict
```

The prediction is composite rule-based: a fixed set of signals (naming patterns, existing tags, instance config, group and account context) is scored deterministically. Same inputs always produce the same prediction. There is no ML model, no ensemble, and no behavioral signals like CloudTrail-user or time-of-creation.

### Cost-coverage impact

```
EXAMPLE: untagged resource at $500/mo

WITHOUT AUTO-TAGGER:
  Resource in "untagged" bucket
  No team attribution
  No environment-specific policy
  $500/mo allocated to "shared overhead"
  
WITH AUTO-TAGGER:
  Predicted env=dev, noStop=false
  After accept: tagged appropriately
  Cost reports show under correct team's spend
  Scheduling can apply if non-prod policy exists
  Cost attribution: clean
  
ACROSS THE ESTATE:
  Every untagged resource is a coverage gap
  Auto-tagger systematically closes gaps
  Per-team chargeback accuracy improves
  Recommendation accuracy improves
```

The tagging is the enabler; auto-tagging is what makes it tractable at scale.

---

## 2. Demo

A team's auto-tagging adoption journey:

```
T+0      Before: tag coverage at 62% (untagged accumulated over years)
         47 resources with no team or env tag

T+5 min  Open Insights → Auto-Tagging
         47 resources have predictions

T+15 min Review predictions:
         18 high-confidence (≥95%):
           Mostly env=prod tags
           Bulk-accept all
           
         14 moderate (85-95%):
           Mostly env=dev
           Review evidence for each
           Accept 12 of 14
           Reject 2 (one mistakenly tagged dev that's actually staging)
           
         10 low-moderate (70-85%):
           Mixed predictions
           Accept 4 (high signal alignment)
           Reject 6 (signals don't align)
           
         5 low (<70%):
           Manual investigation needed
           Skip for now

T+45 min Accepted: 34 predictions
         Tag coverage improves: 62% → 76%

T+30 DAYS:
         Re-run auto-tagger as new resources discovered
         Many new resources have predictions
         Tag coverage climbs: 76% → 91%

T+90 DAYS:
         Stable at ~93% tag coverage
         Remaining 7%: edge cases requiring manual ID
         (Old resources with cryptic names; orphans from old projects)

OUTCOME:
  62% → 93% tag coverage in 3 months
  Effort: ~3 hours total across the period
  Cost attribution accuracy: dramatically improved
  Per-team chargeback: trusted
```

Three months from 62% → 93% tag coverage via auto-tagging.

---

## 3. Hands-on (5 min)

Use the auto-tagger:

```
□ STEP 1: Open Insights → Auto-Tagging
  Total predictions: _____
  Resources to evaluate: _____

□ STEP 2: Review by confidence
  High (≥95%): _____ predictions
  Moderate (85-95%): _____ predictions
  Low-moderate (70-85%): _____ predictions
  Low (<70%): _____ predictions

□ STEP 3: Bulk-accept high-confidence
  Accept all ≥95% predictions
  Confirm
  Tag coverage improves: _____% → _____%

□ STEP 4: Review moderate
  For each:
    Read evidence
    Accept or reject
  Note: how many felt obvious vs uncertain

□ STEP 5: Plan for low-confidence
  Mark for manual investigation
  Owner: __________
  Quarterly cleanup target
```

A 30-minute session accepts most actionable predictions. Quarterly cadence keeps coverage high.

---

## 4. Knowledge check

### Q1
A prediction at 92% confidence:

A. Always accept
B. Reasonable confidence — review the evidence and accept if it matches your knowledge of the resource. Moderate-high confidence still warrants quick review. Bulk-accept reserved for ≥95%.
C. Reject
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Moderate-high confidence still warrants quick review.
</details>

### Q2
The two predictions per resource are:

A. Cost and savings
B. Environment (dev/test/stage/prod) and noStop (boolean — safe to stop). These two cover most of the "what is this resource?" question. Other tags follow naturally once env + noStop are clean.
C. Region and account
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Env + noStop are the two predictions.
</details>

### Q3
A prediction at 55% confidence:

A. Auto-accept
B. Don't act automatically — manually investigate. Confidence is too low to safely act. May need more discovery cycles to gather signals. Or: resource is genuinely ambiguous.
C. Reject by default
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Low confidence = manual investigation.
</details>

---

## 5. Apply

Insights → Auto-Tagging is the canonical surface. Predictions update as new data arrives.

For your team: monthly auto-tagging review; quarterly deep-dive on remaining low-confidence resources.

---

## Related lessons

- [L2 — Inference signals](L2_inference.md) *(next)*
- [L3 — Accept / reject patterns](L3_accept_reject.md)
- [L4 — Drift detection](L4_drift.md)
- [T5.M5.1.L2 — MVT (Minimum Viable Tags)](../../T5_devops_cost_discipline/M5.1_tagging_strategy/L2_mvt.md)

## Glossary terms touched

[Auto-tagger](../../../reference/glossary/auto-tagger.md) · [Environment prediction](../../../reference/glossary/environment-prediction.md) · [noStop prediction](../../../reference/glossary/nostop-prediction.md) · [Confidence score](../../../reference/glossary/confidence-score.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.8.L1
