# The state-history timeline

§ T1 · M1.6 · L1 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **trace** any resource's last 30 days of state changes **and explain** what each transition represents.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Answer 'why did this resource stop at 3 AM?' in 30 seconds." |
| **Personas** | Platform Engineer · Security/Compliance |
| **Prerequisites** | M1.3, M1.4, M1.5 |
| **Time** | 10 minutes |
| **Bloom verb** | Trace (Apply) and Explain (Understand) |

---

## 1. Concept

Every state transition on every resource is recorded in `resource_state_history`: when it changed, what it changed from, what it changed to, and what triggered the change. ZopNight retains this history for 30 days by default.

The history table is the answer to "what happened" — the foundation of cost reconciliation, anomaly investigation, and audit evidence.

### What gets recorded

```
EVENT                                            RECORDED?
─────────────────────────────────────────────────────────
Schedule fires a start cron                       Y
Schedule fires a stop cron                        Y
Manual start (via UI or API)                      Y
Manual stop (via UI or API)                       Y
Auto-remediation start                            Y
Auto-remediation stop                             Y
Override force-on takes effect (or schedule is suspended)   Y
Override expires                                   Y
Cloud-side state change ZopNight detects on next sync       Y (as "drift")
Cloud-side state change ZopNight makes via scheduled action   Y
Resource creation (first appearance in discovery)    Y
Resource deletion (last appearance in discovery)    Y
```

Everything that changes a resource's state is recorded. The trigger source is recorded too (covered in L2).

### The history view

```
RESOURCE: i-0abc123def456                    State: Running
─────────────────────────────────────────────────────────────────────
TIMESTAMP            FROM        TO          TRIGGER            DURATION
─────────────────────────────────────────────────────────────────────
2026-05-20 08:00 ET   Stopped     Starting    Schedule:           5min
                                              business-hours-eu
2026-05-20 08:05 ET   Starting    Running     -                   12h
2026-05-19 20:05 ET   Stopping    Stopped     -                   12h
2026-05-19 20:00 ET   Running     Stopping    Schedule:           5min
                                              business-hours-eu
... (continues 30 days back)
```

Each row is one transition. The duration column shows how long the resource sat in the "to" state before the next transition. For the most recent row, the duration is "ongoing" or "current."

### The 30-day window

History is retained for 30 days in the searchable timeline. After that:

- **Audit Log** retains the same events indefinitely (covered in L5) for compliance use
- **State-history table** is purged of rows older than 30 days for performance

So a question like "what was the state on 2026-04-15?" answers from the Audit Log if older than 30 days, from the state-history table if within.

### Reading the timeline for one resource

The resource detail page shows the state-history timeline in two forms:

**Visual timeline.** A horizontal bar showing ON / OFF periods over the 30 days. Color-coded by trigger source (schedule vs manual vs auto-rem). Hover any segment to see the timestamp and trigger.

**Tabular list.** As shown above. Filterable by trigger source and date range.

The visual is the "scan it" view; the tabular is the "drill into specific event" view.

### Why this matters operationally

Three questions the history answers in <30 seconds:

**Question 1: Why did this resource stop at 3 AM?**

Open the resource → check the history → find the transition at 3 AM → read the trigger column. Most likely:

- "Schedule: weekend-stop-all" → an aggressive weekend schedule fired
- "Auto-remediation: RC-002 Orphaned EBS" → the rule fired
- "Manual: api-call-from-user@team" → a human stopped it via API
- "Override expired" → an override that was force-on expired, allowing the schedule to act

In 30 seconds, the team knows the cause without escalation.

**Question 2: How often does this resource actually run?**

The history shows the ON / OFF pattern. A non-prod resource that "should run business hours" but shows ON 18 hours/day suggests the schedule isn't firing — investigate why.

**Question 3: Did the schedule fire as expected?**

Pick the expected firing time. Find the transition (or absence of one). Confirm or diagnose.

### Per-resource vs estate-wide history

The state-history page on the resource detail shows that one resource. For an estate-wide view (e.g., "all transitions in the last 24 hours"), the History page exposes an aggregate timeline filterable by:

- Time range
- Trigger source
- Resource type
- Cloud account
- Schedule
- Override

Useful for "what happened across the estate last night?" investigations.

### Drift detection

If the cloud-side state changes outside of ZopNight (e.g., an engineer stops a VM directly via the AWS console), ZopNight detects this on the next discovery sync and records the transition with trigger "drift":

```
TIMESTAMP            FROM      TO        TRIGGER       
─────────────────────────────────────────────────────
2026-05-20 14:23     Running   Stopped   DRIFT (cloud-side change)
                                          Detected: 14:38 (15min after)
```

Drift means "ZopNight didn't cause this; the cloud's state changed independently." It's important to flag because:

- Schedule planning assumed the resource was running
- The Slack notification might fire to alert the team
- Anomaly detection might pick it up if the drift is meaningful

A team that sees lots of drift events should investigate. Repeated drift on the same resource suggests an unmanaged process (a script, a CI/CD pipeline, a curious engineer) is acting outside ZopNight.

---

## 2. Demo

A team investigating a cost spike:

```
T+0       FinOps lead notices yesterday's spend was $1,400 higher than usual
          on the staging-eu account.

T+1 min   Opens Reports → drills into yesterday's spend on staging-eu.
          Sees EC2 was the driver. Specifically: i-0abc..., i-0def..., i-0ghi...
          ran for 14 extra hours each compared to the typical pattern.

T+3 min   Clicks i-0abc... to open the resource. Opens the state-history timeline.

T+3:30    Sees the unusual pattern:
            2026-05-19 14:30  Stopped → Running   TRIGGER: DRIFT
            2026-05-19 14:35  (no schedule action at this time)
          
          The instance came online at 2:30 PM yesterday, OUTSIDE the schedule.
          The trigger is DRIFT — meaning ZopNight didn't start it.

T+5 min   Checks the Audit Log for the same time window.
          Finds: A CI/CD pipeline (terraform apply via GitHub Actions) ran at 14:28
          and started the instance.

T+6 min   Diagnosis: an engineer's PR included a terraform module that
          accidentally started staging instances outside the schedule. The team
          fixed the PR and reverted.

T+7 min   Cost incident closed. The drift signal in the state history was the key.
```

Six minutes from "the bill is wrong" to root cause. The state-history is the diagnostic backbone.

(Asset: `assets/diagrams/M1.6_L1_drift_investigation.svg`.)

---

## 3. Hands-on (6 min)

For one of your scheduled resources:

```
1. Open the resource detail page.
2. Find the State History section.
3. Scroll through the last 7 days of transitions.
4. For each transition, identify the trigger source from the column.
5. Look for:
   - Expected schedule firings (every weekday 8 AM start, 8 PM stop)
   - Any DRIFT events (cloud-side changes not from ZopNight)
   - Any manual events (who made them?)
   - Any override events (why?)
6. If you see DRIFT events, that's your investigation hook —
   something outside ZopNight is touching this resource.

For estate-wide:
7. Open the History page (top-nav or Reports → History).
8. Filter to "trigger: drift" for the last 30 days.
9. Count drift events. If non-zero, investigate the highest-frequency
   sources.
```

---

## 4. Knowledge check

### Q1
A team asks: "Why did our staging RDS stop at 4 AM Monday?" The fastest path to answer is:

A. Search the Slack history
B. Open the RDS resource → State History timeline → find the 4 AM Monday transition → read the trigger column. Most likely: a schedule fired, or auto-remediation fired, or drift detection saw a cloud-side change.
C. Check AWS CloudTrail
D. Ask the on-call engineer

<details>
<summary>Show answer</summary>

**Correct: B.** The state-history timeline is the canonical source for this question. CloudTrail would also work but ZopNight's timeline correlates the trigger source explicitly.
</details>

### Q2
A "drift" entry in the state history means:

A. The cloud is broken
B. ZopNight detected that the cloud-side state changed without a ZopNight action causing it. Something external (engineer in the console, CI/CD pipeline, another tool) changed the state.
C. The discovery is wrong
D. The schedule double-fired

<details>
<summary>Show answer</summary>

**Correct: B.** Drift is informative — it means the state changed but ZopNight wasn't the cause. Useful for spotting unmanaged processes.
</details>

### Q3
The state-history table retains data for 30 days. To investigate events older than 30 days, the right path is:

A. The data is gone
B. The Audit Log retains every state transition indefinitely. Use Audit Log for >30-day history. The state-history table is purged for performance, but the Audit Log is the permanent record.
C. AWS CloudTrail
D. The vendor support

<details>
<summary>Show answer</summary>

**Correct: B.** Two-tier retention: 30-day table for fast queries, audit log forever. L5 covers the audit log mechanics.
</details>

---

## 5. Apply

State-history is in:

- **[Resource detail → State History](https://app.zopnight.com/resources)** — per-resource timeline
- **[History page](https://app.zopnight.com/history)** — estate-wide aggregate
- **[Audit Log](https://app.zopnight.com/audit-logs)** — >30-day history

For interpreting the trigger column, continue to L2.

---

## Related lessons

- [L2 — Reading the trigger column](L2_reading_triggers.md) *(next)*
- [L5 — Where audit logs live](L5_audit_logs.md)
- [T3.M3.4 — Multi-account architecture (drift across accounts)](../../T3_zopnight_architect/M3.4_multi_account/00_README.md)

## Glossary terms touched

[State history](../../../reference/glossary/state-history.md) · [Transition](../../../reference/glossary/transition.md) · [Drift](../../../reference/glossary/drift.md) · [Trigger source](../../../reference/glossary/trigger-source.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.6.L1
