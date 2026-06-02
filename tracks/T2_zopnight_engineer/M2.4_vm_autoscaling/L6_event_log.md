# The event log

§ T2 · M2.4 · L6 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** the per-policy event log, **debug** scaling behavior from event evidence, **and identify** anomalous patterns that signal misconfiguration.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Diagnose 'why did we scale at 3 AM?' by reading the event log — and tune the policy based on what I find." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.4.L1 - L5 |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Debug (Analyze), Identify (Apply) |

---

## 1. Concept

Every autoscaler policy maintains an event log of all lifecycle events and scaling actions. The event log is the diagnostic surface — when scaling behaves unexpectedly, the event log explains why.

```
WHAT THE EVENT LOG IS FOR:
  Debugging why a workload scaled at a specific moment
  Auditing scaling actions for cost reporting
  Verifying that the policy is working as expected
  Investigating anomalies
  Correlating cost spikes with scaling decisions
```

The event log turns "what happened?" into a concrete timeline.

### Event log structure

```
EVENT LOG — payments-api-prod-autoscale
─────────────────────────────────────────────────────────────────
TIMESTAMP             EVENT                  DETAIL
─────────────────────────────────────────────────────────────────
2026-05-19 16:42 UTC  Scaling action          Scale-out: 4 → 6
                                                (target 60%, current 73%)
2026-05-19 14:15 UTC  Scaling action          Scale-out: 3 → 4
                                                (target 60%, current 78%)
2026-05-19 09:30 UTC  Apply (re-apply)       Target updated 65% → 60%
2026-05-19 09:30 UTC  Edit                    User: ops-lead@
                                                target=65%→60%
2026-05-18 22:00 UTC  Scaling action          Scale-in: 4 → 3
                                                (target 60%, current 28%)
2026-05-18 21:55 UTC  Scaling action          Scale-in: 5 → 4
                                                (target 60%, current 45%)
2026-05-18 21:50 UTC  Scaling action          Scale-in: 6 → 5
                                                (target 60%, current 52%)
2026-05-18 11:00 UTC  Scaling action          Scale-out: 5 → 6
                                                (target 60%, current 72%)
2026-05-15 08:00 UTC  Resume                  User: ops-lead@
                                                resuming from pause
2026-05-12 17:30 UTC  Pause                   Compliance hold
2026-05-08 14:00 UTC  Apply (initial)         mode: autopilot
2026-05-08 13:55 UTC  Created                 User: jane@
                                                quick-setup defaults
```

Reverse chronological. Each entry has timestamp, event type, and detail.

### Event types

```
Created              Policy created (initial state, not yet applied)
Apply                Policy pushed to the cloud (initial or update)
Pause                Policy paused (stop scaling)
Resume               Policy resumed (re-enable scaling)
Remove               Policy removed (cloud-side restored)
Edit                 Policy parameters changed
Scaling action       Cloud-side scaling event (scale-out or scale-in)
Validation failure   Expected scaling action failed validation
Error                Cloud API error or other system issue
```

Each event type captures a specific moment in the policy's life.

### Reading scaling actions in detail

Each scaling action entry includes:

```
Direction:    scale-out (capacity increase) or scale-in (decrease)
From:         capacity before
To:           capacity after  
Trigger:      metric value at the time of action
Reason:       "exceeded target" or "below target"
Cloud action: provider-specific cloud action (PutScalingPolicy, etc.)
Latency:     time from trigger detected to cloud action completed
Reading:     "CPU 78% triggered scale-out; from 4 → 6 instances"
```

These are the "what happened" rows. Useful for understanding workload patterns.

### Debugging "why did we scale at 3 AM?"

```
TYPICAL DIAGNOSTIC FLOW:

1. Open the policy
2. Filter event log: scaling actions only
3. Find the entry around 3 AM
4. Read details:
   Scale-out from 4 → 6 instances
   Trigger: CPUUtilization 78% (above target 60%)
   Latency: 12 seconds
   
5. Investigation: what caused 78% CPU at 3 AM?
   - Check application metrics for the same timestamp
   - Likely causes:
     - Scheduled batch job
     - Traffic from time-zone region (e.g., APAC awake)
     - Periodic processing
     - Cron-triggered work
     
6. Decision based on cause:
   Yes-this-is-real → policy working correctly
   No-this-is-anomaly → workload pattern unexpected
                         Tune target or investigate further
```

The event log is the diagnostic surface for these investigations.

### Cost reporting via event log

```
SCALING ACTIONS CONTRIBUTE TO COST:
  Each scale-out increases capacity → increases cost
  Each scale-in decreases capacity → decreases cost
  Aggregated = total scaling cost impact

REPORTS INTEGRATION:
  Reports → Trends shows cost time-series
  Correlate with the scaling-event timeline
  
EXAMPLE:
  Yesterday's cost spike: $230 between 2-3 PM
  Event log shows: scaled from 6 → 12 instances during that hour
  6 extra instances × $0.10/hr × 1 hour = $0.60... wait, that's wrong
  
  CORRECTED CALCULATION:
  $230 = total cost for that hour
  Of which ~$120 was the additional 6 instances
  At $0.20/hr per m5.large × 6 instances = $1.20/hr
  Times 60 minutes = sum of scaling actions
  
  The math works out; event log shows the trigger
```

The event log + cost report = answer "did our scaling cost X?"

### Anomaly detection from event log

Anomalous scaling patterns trigger flags:

```
PATTERN                                          FLAG
─────────────────────────────────────────────────────────────
Scaling out > 5 times in 1 hour                  Oscillation
                                                  
Scaling out to max repeatedly                     At ceiling
                                                  Increase max
                                                  
Scaling in to min repeatedly                      At floor
                                                  Decrease min OR adjust target
                                                  
Many failures or errors                            Policy issues to debug
                                                  
Cool-down too short                                Add to backlog
                                                  
Sudden scaling pattern change                     Anomaly investigation
                                                  Possibly traffic shift
```

These flags surface in the Anomaly Detection feed (M2.10).

### Audit retention

```
TIER                         RETENTION
─────────────────────────────────────────────
Per-policy event log         90 days in UI
Audit log (org-wide)         Permanent
Cloud-side scaling history    Provider-dependent
                              (typically 14 days)
```

For analysis of long-term patterns, query the audit log API.

### Common patterns in the event log

```
HEALTHY PATTERN:
  Few scaling actions (a handful per day)
  Aligned with actual demand changes
  Latencies <30 seconds
  No errors
  
UNHEALTHY PATTERNS:
  Frequent oscillation (5+ scales/hour)
  → Tune cooldown or target band
  
  Consistently at max
  → Increase max or right-size pods
  
  Consistently at min
  → Decrease min (over-provisioned)
  
  Many errors in succession
  → Investigate cloud-side issue
  
  Long latencies (>5 min)
  → Cloud-side rate-limiting or other issue
```

The patterns inform tuning decisions.

---

## 2. Demo

A team's investigation of a costly scale-out pattern:

```
SCENARIO: Production scaling is more aggressive than expected
  ZopNight scaled to 12 instances briefly during one hour yesterday
  Then scaled back
  Cost spike: $230 for the hour

INVESTIGATION:
T+0       Open policy → event log → filter scaling actions, last 24h
T+30 sec  Find the period:
          Tuesday 14:00-15:00 UTC
          - 14:02 Scale-out 6 → 8  (CPU 72%, target 60%)
          - 14:08 Scale-out 8 → 10 (CPU 78%, target 60%)
          - 14:15 Scale-out 10 → 12 (CPU 83%, target 60%)
          - 14:30 Scale-in 12 → 11 (CPU 58%, target 60%)
          - 14:45 Scale-in 11 → 10 (CPU 55%, target 60%)
          - 15:00 Scale-in 10 → 8 (CPU 53%, target 60%)

T+1 min   CPU pattern: spike from 14:00 to 14:15, then declined
          Correlate with application logs

T+3 min   Cause identified:
          Marketing campaign sent at 14:00
          50K requests in first 15 minutes
          Workload responded; CPU rose
          Autoscaler responded; capacity rose
          Demand subsided; capacity declined

T+5 min   Decision:
          This is correct scaling behavior
          Cost spike was real and proportional to traffic
          Marketing should schedule campaigns with cost awareness
          ZopNight worked correctly
          
          ACTION ITEMS:
          1. Document the cost-per-campaign-burst with marketing
          2. Consider auto-rem rule to pre-warm before scheduled campaigns
          3. Current configuration validated
```

The event log was the timeline that anchored the investigation. Without it, the team would have wondered if there was a bug.

---

## 3. Hands-on (5 min)

Investigate one of your policies' event logs:

```
□ STEP 1: Open Automation → Policies → pick one
  Policy: __________

□ STEP 2: Open event log; filter scaling actions
  
□ STEP 3: Note recent scaling events
  Total in last 7 days: _____
  Scale-outs: _____
  Scale-ins: _____
  Latest: __________

□ STEP 4: Identify any unusual patterns
  □ Oscillation (>5 in 1 hour)
  □ At max repeatedly
  □ At min repeatedly
  □ Errors
  □ Long latencies

□ STEP 5: Plan tuning if needed
  Issue: __________
  Tune: __________
```

10-minute review per policy. Quarterly cadence catches drift.

---

## 4. Knowledge check

### Q1
A scaling action's "trigger" field shows CPU 78%, target 60%. The interpretation:

A. Scaling failed
B. CPU exceeded target by 18 percentage points; autoscaler chose to add capacity. This is normal scale-out logic. The target 60% was the threshold; current 78% above triggered the action.
C. Cloud is broken
D. Target is wrong

<details>
<summary>Show answer</summary>

**Correct: B.** Canonical scale-out reason.
</details>

### Q2
The event log shows oscillation: 5 → 7 → 5 → 7 → 5 within 20 minutes. Most likely cause:

A. Cloud failure
B. Cooldown too short for the metric volatility, or target too tight against the workload variance. Tune cooldown (longer) or target (wider band). Oscillation = configuration mismatch with workload behavior. Diagnose via the event log.
C. Random
D. ZopNight bug

<details>
<summary>Show answer</summary>

**Correct: B.** Oscillation = configuration mismatch; tune cooldown or target.
</details>

### Q3
Event log retention in the UI is:

A. Forever
B. 90 days — for longer history, query the audit log. The 90-day window covers active investigation; the audit log holds the permanent record for compliance / long-term analysis.
C. 7 days
D. Real-time only

<details>
<summary>Show answer</summary>

**Correct: B.** 90-day window for active investigation; audit log holds permanent record.
</details>

---

## 5. Apply

Per-policy event log is on every policy detail page. Audit log at /audit-logs filters by policy_id for longer history.

For your team: weekly check of event log on top policies. Catches anomalies early.

---

## Module quiz

You have now completed all six lessons of M2.4. The module quiz unlocks the **Autoscaler** chip.

---

## Related lessons

- [L1 — Scaling policy basics](L1_scaling_policy_basics.md)
- [L2 — Welford stats](L2_welford_stats.md)
- [L3 — Quick setup](L3_quick_setup.md)
- [L4 — Three modes](L4_three_modes.md)
- [L5 — Lifecycle](L5_lifecycle.md)
- [M2.10 — Cost anomaly detection](../M2.10_cost_anomaly/00_README.md)

## Glossary terms touched

[Event log](../../../reference/glossary/event-log.md) · [Scaling action](../../../reference/glossary/scaling-action.md) · [Oscillation pattern](../../../reference/glossary/oscillation-pattern.md) · [Event log retention](../../../reference/glossary/event-log-retention.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L6
