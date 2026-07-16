# The Recent Activity tab

§ T2 · M2.2 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** activity-log signals, **distinguish** activity-data from metrics-data, **and confirm** abandonment of stopped or rarely-used resources before action.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Confirm that a recommendation's target resource is truly abandoned before terminating — using cloud activity logs as a second source of truth." |
| **Personas** | Platform Engineer · SRE · FinOps Engineer |
| **Prerequisites** | M2.1 · M2.2.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Distinguish (Analyze), Confirm (Evaluate) |

---

## 1. Concept

Cloud monitoring shows CPU/memory; activity logs show *what's been done to the resource*. A stopped EC2 has 0% CPU but might still be receiving API calls (Describe, Get from monitoring). A "running" K8s service might be serving zero requests despite using compute.

The **Recent Activity tab** in the evidence panel shows operations against the resource — pulled from CloudTrail (AWS) / Cloud Logging (GCP) / Azure Activity Log via the daily `activity-sync` cron.

```
TWO DIFFERENT QUESTIONS:
  
  METRICS: "What did the resource do?"
    CPU, memory, network, IOPS
    Resource's behavior
    
  ACTIVITY: "What happened TO the resource?"
    Operations: Describe, Modify, Start, Stop, Delete, Create snapshot
    Resource's lifecycle events
```

Both matter; both have different signals.

### What activity-sync collects

```
SOURCE                                  COLLECTS
─────────────────────────────────────────────────────────
AWS CloudTrail                          Management events, data events (opt-in)
GCP Cloud Logging                        Audit logs, admin logs
Azure Activity Log                      Resource-level operations
```

Per resource, the system surfaces per-slot operation counts (24-hour slots typically) over the lookback window (default 30 days).

### What the tab shows

```
RECENT ACTIVITY — i-0abc123def
─────────────────────────────────────────────────────────
LAST 30 DAYS

Operations breakdown:
  Describe / Get        1,247  (mostly ZopNight discovery)
  Start                   2     (manual restarts)
  Stop                    2     (matching the 2 starts)
  Modify                  0
  Create snapshot         3     (backup pattern)
  Delete                  0

ZERO-ACTIVITY DAYS:     22 of 30   ← clear idle signal

LAST HUMAN OPERATION
  2026-04-15  manual stop  by  ops-team@zopcloud.com
  (35 days ago)
```

Three signals matter most:

```
1. ZERO-ACTIVITY DAYS
   Count of days where nothing happened to the resource
   22 of 30 zero-activity days = strong idle signal
   
2. LAST HUMAN OPERATION
   When did a human last touch this resource
   35 days ago = potentially abandoned
   90 days ago = strongly abandoned
   
3. OPERATION MIX
   Heavy Describe/Get + zero Start/Stop/Modify
   = resource exists but isn't being managed
   Typical pattern for orphans
```

The three signals compound. All three pointing to abandonment = high confidence.

### Why this is different from metrics

```
EXAMPLE: stopped EC2 instance

METRICS:
  CPU = 0% (always; it's stopped)
  Memory = 0% (always; it's stopped)
  Network = 0% (always; it's stopped)
  
  CONCLUSION FROM METRICS ALONE:
  Stopped resource using no compute. Idle? Maybe? Could be hot-swap DR target.
  
ACTIVITY (Recent Activity tab):
  Last 90 days: 0 human operations
  Last human stop: 6 months ago (by engineer who left org)
  Owner tag: empty
  Snapshot frequency: 0 in 90 days
  
  CONCLUSION FROM ACTIVITY:
  Nobody has cared about this in 6 months. The original owner is gone.
  Almost certainly abandoned. Safe to terminate.

COMBINED:
  Metrics + Activity = high confidence
  Multiple independent signals agreeing
  This is the canonical "safe to terminate" pattern
```

Metrics tell you the resource's state. Activity tells you the organization's relationship with it.

### Cross-checking idle recommendations

The Recent Activity tab is the second source of truth for idle rules:

```
RC-001 (Idle EC2) fires on:
  1. status=stopped (cloud state)
  2. 30+ days stopped (history)

CROSS-CHECK with Recent Activity:
  3. Zero-activity days = how many days untouched
  4. Last human operation = who last cared
  5. Operation mix = is anyone managing it

TRIPLE CONFIRMATION before terminating:
  All three signals align → high confidence
  
TYPICAL HIGH-CONFIDENCE PROFILE:
  Stopped 47 days
  Zero-activity 22 of 30 days
  Last human op: 35 days ago
  
  → Terminate with snapshot; almost certainly safe
```

The cross-check is what separates "auto-rem safe" from "needs human review."

### Recent Activity for production resources

```
FOR RUNNING PRODUCTION RESOURCES:
  Recent Activity less useful (everything's active)
  Operations: thousands per day
  Hard to tease out signals
  
WHERE THE TAB SHINES:
  Stopped resources (confirm abandonment vs hot-standby)
  Rarely-used resources (confirm true low usage)
  Snapshots and orphans (confirm nobody touched)
  Cross-account resources (catch un-owned ones)
  
NOT USEFUL FOR:
  Detecting traffic patterns (use ALB / CloudFront logs)
  Performance debugging (use APM / tracing)
  Security incidents (use proper SIEM)
```

The tab is purpose-built for cost-recovery scenarios. Match the use case.

### Activity signal interpretation

```
SIGNAL                              INTERPRETATION
─────────────────────────────────────────────────────────────
Zero-activity 28 of 30 days        Likely abandoned (highest signal)
Zero-activity 15 of 30 days        Sporadic use; investigate pattern
Zero-activity 5 of 30 days         Active use; not idle

Last human op <7 days ago           Active management
Last human op 30-90 days ago        Possible abandonment
Last human op 90+ days ago          Probable abandonment

Operations all Describe/Get         Read-only; nobody changing it
Operations include Modify/Start    Active management
Recent Delete                       Cleanup in progress (don't action)

Owner tag empty + 60+ days quiet   Strong abandonment
Owner tag valid + recent op         Active management
```

The combinations tell different stories. The triple-check is the canonical pattern.

### What activity-sync doesn't capture

```
NOT IN ACTIVITY-SYNC:
  Read operations from inside the resource (e.g., RDS query count)
  Application-level activity (HTTP requests, db queries)
  Internal service-to-service calls without cloud-API involvement
  
ACTIVITY-SYNC ONLY CAPTURES:
  Cloud-API operations (CloudTrail equivalent)
  Operations that touch the cloud control plane
  
FOR INTERNAL APPLICATION ACTIVITY:
  Use app-level monitoring
  Logs, metrics from the application
  Not in scope for cost-optimization rule evidence
```

The boundary matters: cloud-control-plane activity is in the tab; application-internal activity isn't.

### Frequency / freshness

```
ACTIVITY-SYNC cron:
  Daily at 06:00 UTC (fetches previous day's logs)
  Higher frequency would hit cloud-log-API rate limits
  
DATA FRESHNESS:
  Max ~24 hours stale
  Cost optimization tolerates this
  
ALTERNATIVE for real-time activity:
  CloudTrail console directly (not via ZopNight)
  For incident response, not cost optimization
```

The daily cadence is right for the use case.

---

## 2. Demo

A team's deep audit of a $1,400/mo idle RDS:

```
SCENARIO:
  Resource: db-temp-staging (RDS db.r5.large in production account)
  Original purpose: temporary database for a Q3 2024 project
  Status: still running (forgotten?)
  Current cost: $1,400/mo

ZopNight finding: RC-202 (idle resource pattern)
  Triggers: low utilization + no connections + 30+ day stable state
  Confidence: needs cross-check before terminating

EVIDENCE — METRICS TAB:
  DatabaseConnections (30 days):
    Average: 0
    Maximum: 0
    Minimum: 0
  
  CPU (30 days):
    Average: 1.2% (just monitoring overhead)
    Maximum: 3.4%

EVIDENCE — RECENT ACTIVITY TAB:
  Last 30 days: 4 operations total
    - 4 DescribeDBInstances calls (all from ZopNight)
    - 0 ModifyDBInstance
    - 0 DeleteDBInstance
    - 0 connections
  
  Last human operation: 2026-02-08 by jane@zopcloud.com
    (101 days ago)
  
  Lookup jane@zopcloud.com:
    Status: offboarded 2026-03-15
    Not in current organization
  
  Owner tag: blank (no current owner)
  Zero-activity days: 30 of 30

CONCLUSION:
  Database has 0 connections in 30 days
  No human has touched it in 101 days
  Original owner gone from org
  No remaining engineering owner
  
  Multiple data sources confirm: abandoned

ACTION:
  Apply with high confidence
  Snapshot-first (default)
  Terminate
  Saved: $1,400/mo recurring

TIMELINE:
  Investigation: 10 minutes
  Apply: 1 click
  Annual savings: $16,800
  ROI: 100,000:1 on time invested
```

The Recent Activity tab closed the loop. Without it, the decision would have been ambiguous.

---

## 3. Hands-on (5 min)

Verify a stopped-resource recommendation:

```
□ STEP 1: Open Recommendations
  Filter: category = idle OR orphan
  Pick a stopped resource

□ STEP 2: Open Recent Activity tab
  Operations breakdown:
    Describe/Get: _____
    Start: _____
    Stop: _____
    Modify: _____
    Delete: _____
  
  Zero-activity days: ___ of 30

□ STEP 3: Last human operation
  Date: __________
  Operator: __________
  Days ago: _____

□ STEP 4: Cross-check with metrics
  CPU avg (30 days): _____%
  Connections (if applicable): _____

□ STEP 5: Decision
  □ Apply (multiple signals confirm abandonment)
  □ Snooze (uncertain; investigate further)
  □ Dismiss (false positive; resource is intentional)
  Reason: __________
```

10 minutes per high-value recommendation. Confidence in decisions = faster apply rate.

---

## 4. Knowledge check

### Q1
A stopped EC2 has CPU = 0% and the Recent Activity tab shows 0 human operations in 90 days. Confidence to terminate:

A. Low
B. High — multiple sources confirm abandonment. Safe to apply with snapshot-first. The triple-check (status + age + activity) is the canonical high-confidence pattern. Plus snapshot makes it reversible.
C. Medium
D. Cannot determine without more data

<details>
<summary>Show answer</summary>

**Correct: B.** Multiple data sources agreeing is the canonical high-confidence signal.
</details>

### Q2
The Recent Activity tab is most useful for:

A. Real-time monitoring of busy production resources
B. Confirming abandonment of stopped or rarely-used resources. Best for low-activity scenarios where metrics alone don't tell the story. Orphans, idle, archived resources are the sweet spot.
C. Performance debugging
D. Security incidents

<details>
<summary>Show answer</summary>

**Correct: B.** Best for low-activity scenarios; metrics tell you behavior, activity tells you lifecycle.
</details>

### Q3
The activity-sync cron runs at:

A. Every 5 minutes
B. Daily at 06:00 UTC — fetches the previous day's activity log. Raw activity-log API too expensive for higher frequency. Cost optimization tolerates daily cadence.
C. Real-time
D. Manually triggered

<details>
<summary>Show answer</summary>

**Correct: B.** Daily sync. The cadence balances freshness with API rate limits.
</details>

---

## 5. Apply

Recent Activity is in the Evidence panel on relevant rules. For deeper investigation, Resource detail → Activity tab shows the full operation history.

For your team: combine Metrics drawer (behavior) + Recent Activity tab (lifecycle) for high-confidence apply decisions on idle/orphan recommendations.

---

## Related lessons

- [L1 — Metrics drawer](L1_metrics_drawer.md)
- [L3 — Pricing gap + DLQ](L3_pricing_gap_dlq.md) *(next)*
- [L4 — Evidence vs bill](L4_evidence_vs_bill.md)
- [M2.1.L5 — Reading a recommendation card](../M2.1_rule_library/L5_reading_a_rec_card.md)

## Glossary terms touched

[Recent Activity tab](../../../reference/glossary/recent-activity-tab.md) · [Activity-sync](../../../reference/glossary/activity-sync.md) · [Zero-activity days](../../../reference/glossary/zero-activity-days.md) · [Last human operation](../../../reference/glossary/last-human-operation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.2.L2
