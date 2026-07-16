# Five dimensions

§ T2 · M2.10 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right dimension for an anomaly investigation, **cascade** from broad to narrow, **and recognize** the noise-reduction patterns.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Drill into cost anomalies fast — find the resource driving the spike via the right dimensional cascade." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.1 · T4.M4.5 (anomaly response) |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Cascade (Apply), Recognize (Apply) |

---

## 1. Concept

ZopNight detects anomalies across 5 dimensions: org, cloud account, resource group, resource, and team. Each dimension catches different kinds of events.

```
THE FIVE DIMENSIONS:

org-level         Org-wide spike
                  Multi-team event; cloud-wide pricing
                  
cloud-account     Per-account spike  
                  New environment in one account
                  
resource-group    Per-group spike
                  Group's workload scaled up unexpectedly
                  
resource          Per-resource spike
                  Single resource misbehaving
                  
team              Per-team spike
                  Team's spend pattern changed
```

Each dimension catches different patterns. The investigation cascade is the technique.

### How dimensions cascade

```
TIME T:
  Org-level spike detected at +200%
  
  Drill 1: cloud-account dimension
    Account "prod-aws" spike +150%
    Other accounts: normal
    → Focused: prod-aws is the source
    
  Drill 2: team dimension on prod-aws
    Team "platform" spike +180%
    Team "data" normal
    Team "search" normal
    → Focused: platform team's resources
    
  Drill 3: resource dimension on platform team
    Resource "i-0xyz" spike +1,200%
    Other resources: normal
    → Diagnosed: i-0xyz is driving the org spike
```

Investigating from broadest to narrowest dimension identifies the root cause. The cascade is the technique.

### When to use which dimension

```
QUESTION                                    DIMENSION TO USE
──────────────────────────────────────────────────────────
"Are we spending more than yesterday?"     org-level
"Which cloud is the issue?"                cloud-account
"Which environment is spiking?"             cloud-account or resource-group
"Which team is over-spending?"             team
"Which specific resource is misbehaving?"  resource
"Which workload?"                          resource-group
```

The right dimension matches the question.

### Top 10 cap per org per dimension

To avoid notification noise, the system caps notifications at top 10 resources per org per dimension:

```
EXAMPLE: 20 resources spike simultaneously
  Top 10 (by deviation): trigger notifications
  Remaining 10: visible in anomaly feed; don't fire alerts
  
PURPOSE:
  Prevent alert fatigue
  Surface the critical few
  Operators can drill in if needed
  
THE OTHER 10:
  Visible in feed
  No notification
  Can be investigated manually
```

The cap is a practical noise-reduction. Operators can always drill into the feed.

### Adaptive batching

Anomaly detection runs on different cadences based on org size:

```
ORG SIZE                BATCH SIZE         FREQUENCY
──────────────────────────────────────────────────────────
≤ 5,000 resources       25 resources       Daily 04:30 UTC
≤ 20,000 resources      5 resources         Daily 04:30 UTC
> 20,000 resources      1 resource at a time Daily 04:30 UTC
```

Larger orgs process more carefully to manage memory and API load. The detection scales sub-linearly with resource count.

### What anomaly detection IS NOT

```
NOT real-time alerting:
  Daily cadence; not minutes-level
  For real-time use cloud-native alarms (CloudWatch, etc.)
  
NOT replacing budget alerts:
  Budget alerts: threshold-based ("spent X% of budget")
  Anomaly detection: deviation-based ("spending 200% of normal")
  Different signals
  
NOT predictive:
  Reactive (anomalies after the fact)
  Not "will spend"; "spent unexpectedly"
  
NOT actionable directly:
  Anomaly = diagnostic surface
  + root cause analysis (L4)
  + remediation through other mechanisms
  Not a one-click "fix the anomaly"
```

Anomaly detection is one tool; use it for what it's designed for.

### Combining with budget alerts

```
BUDGET ALERTS catch when:
  Spend exceeds threshold (e.g., "team-X used 80% of $50K budget")
  Forecasted to exceed by month-end
  
ANOMALY ALERTS catch when:
  Spend deviates from normal pattern (e.g., "today is 200% of typical")
  Statistical anomaly regardless of absolute amount
  
USE BOTH:
  Budget for "are we within plan?"
  Anomaly for "is something wrong?"
  Catch different scenarios
```

The two systems are complementary. Most teams use both.

### Severity bands (one global set, not per-dimension)

The severity bands are the same for every dimension. There is a single global set of thresholds on percent deviation:

```
SEVERITY     PERCENT DEVIATION    RESPONSE
──────────────────────────────────────────────────────
warning       30-100%             note; don't page
critical      100-500%            investigate within hours
emergency     > 500%              page on-call; immediate response
```

A z-score path runs in parallel (emergency at z >= 5); the higher severity of the two wins. The bands are not tuned per dimension.

### When dimensions don't help

```
NEW WORKLOADS:
  Insufficient history; anomalies fire too easily
  Solution: ZopNight uses 7-day rolling baseline
  New workloads have warmup period
  
SEASONAL PATTERNS:
  E-commerce spikes in November
  ML workloads run nightly
  Solution: ZopNight learns weekly patterns
  Sunday vs Monday vs Friday recognized as different baselines
  
LARGE BURSTS:
  Single huge event (Black Friday)
  Solution: Event Readiness (M2.9) marks the period as expected
  Anomalies suppressed during planned spikes
```

The detection has built-in handling for common edge cases.

---

## 2. Demo

A team's anomaly investigation:

```
T+0       Daily anomaly cron runs (04:30 UTC)
T+30s     System detects:
            Org spend yesterday: $4,200 above 7-day average
            +27% above baseline
T+30s     Org-level WARNING anomaly fired
T+30s     Slack notification to #finops-alerts

T+5 min   FinOps engineer opens anomaly feed
T+5 min   Drilling: cloud-account dimension
            prod-aws-us-east-1: +95% (significant)
            prod-aws-eu-west-1: normal
            staging-aws: normal
          → Focused: us-east-1 is the source

T+10 min  Drilling deeper: team dimension on prod-aws-us-east-1
            team=ml: +180% (major)
            team=platform: +10% (background normal)
            team=search: normal
            team=billing: normal
          → Focused: ML team

T+15 min  Drilling: resource dimension on team=ml
            i-0ml-train-99: was $0/hr yesterday, $560/hr today
            (vs prev 30 days average: $0/hr — instance was off)
            Other team=ml resources: normal
          → Identified: i-0ml-train-99 specifically

T+18 min  DIAGNOSIS:
          A long-running ML training job spawned 7 large GPU instances
          overnight that weren't terminated
          Verified via CloudWatch logs + audit trail
          
          Action: manual termination of the 7 instances
          Cost stopped; recovery: 5 min
          
T+25 min  Cost back to normal
T+25 min  Anomaly note: incident-2026-05-21
T+1 day   Postmortem: CI bug fixed; review process improved
```

15 minutes from detection to diagnosis using dimensional drill-down.

---

## 3. Hands-on (5 min)

Practice anomaly investigation:

```
□ STEP 1: Open Reports → Anomalies
  Active anomalies: _____

□ STEP 2: For one anomaly, identify dimension
  Started at: __________
  Dimension: __________
  Severity: __________

□ STEP 3: Practice cascade
  Drill 1: __________ → narrowed to __________
  Drill 2: __________ → narrowed to __________
  Drill 3: __________ → identified __________

□ STEP 4: Estimate time
  Total investigation time: ___ minutes
  Diagnostic confidence: _____%

□ STEP 5: Note pattern
  How did the cascade help vs random search?
  Future improvement: __________
```

A 10-minute practice builds the cascade habit.

---

## 4. Knowledge check

### Q1
An org-level anomaly fires. The right first drill is:

A. resource dimension immediately
B. cloud-account dimension — narrow from broadest to narrowest. Once the account is identified, drill into team or resource as needed. Broad → narrow cascade. Skipping levels often misses the cause.
C. random
D. team dimension

<details>
<summary>Show answer</summary>

**Correct: B.** Broad → narrow cascade.
</details>

### Q2
Anomaly cap of top 10 resources per dimension is intended to:

A. Limit detection
B. Prevent notification noise. The other resources are visible in the feed but don't fire alerts. Critical 10 surface. Without the cap: every spike alerts; fatigue.
C. Reduce cost
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Noise reduction.
</details>

### Q3
Anomaly detection runs:

A. Real-time
B. Daily at 04:30 UTC — reactive, not real-time. For real-time alerting, use cloud-native alarms or budget thresholds. Anomaly detection identifies unexpected deviations after the fact.
C. Hourly
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Daily cadence.
</details>

---

## 5. Apply

Anomaly detection at Reports → Anomalies. Dimensional drill-down available.

For your team: practice the cascade. Build the muscle memory for broad → narrow investigation.

---

## Related lessons

- [L2 — Detection methods](L2_detection_methods.md) *(next)*
- [L3 — Severity bands](L3_severity_bands.md)
- [L4 — Root cause](L4_root_cause.md)
- [L5 — Redistribution suppression](L5_redistribution_suppression.md)
- [T4.M4.5 — Anomaly response](../../T4_finops_mastery/M4.5_anomaly_response/00_README.md)

## Glossary terms touched

[Anomaly dimension](../../../reference/glossary/anomaly-dimension.md) · [Dimensional cascade](../../../reference/glossary/dimensional-cascade.md) · [Top 10 cap](../../../reference/glossary/top-10-cap.md) · [Adaptive batching](../../../reference/glossary/adaptive-batching.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.10.L1
