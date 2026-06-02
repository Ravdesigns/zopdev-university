# Reading the trigger column

§ T1 · M1.6 · L2 of 5 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **interpret** every trigger value in the state-history column **and distinguish** schedule, manual, override, auto-remediation, and drift events.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Tell at a glance whether ZopNight or a human or something external caused this state change." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Analyst |
| **Prerequisites** | [L1](L1_state_history.md) |
| **Time** | 9 minutes |
| **Bloom verb** | Interpret (Understand) and Distinguish (Analyze) |

---

## 1. Concept

The trigger column on the state-history timeline answers the operational question "who or what caused this transition?" Every transition carries one of five trigger types, with sub-values that pinpoint the exact cause.

### The five trigger types

```
TRIGGER TYPE        EXAMPLE VALUE                       MEANING
─────────────────────────────────────────────────────────────────────
SCHEDULE             schedule:S1234 (business-hours-eu)   Cron in this schedule fired
MANUAL               manual:user@team.com                  Human action via UI or API
OVERRIDE             override-applied: force-on...        Override took effect
                     override-expired                      Override timed out
AUTO-REMEDIATION     auto-rem:RC-001 (Idle EC2)            Recommendation rule fired
DRIFT                drift: cloud-side                    Cloud state changed outside ZopNight
```

Each value is rich enough to investigate without further lookup. The schedule ID + name lets you click through to the schedule. The user email identifies who acted. The rule ID identifies the recommendation.

### Reading SCHEDULE triggers

```
2026-05-20 08:00 ET   Stopped → Running   schedule:S1234 (business-hours-eu)
```

- Cron in schedule `S1234` ("business-hours-eu") fired
- Clicking the trigger value opens the schedule's detail page
- The schedule's grid shows which cron fired ("0 8 * * 1-5" — the morning start)

Schedule triggers are the expected pattern. A team running healthy schedules sees mostly schedule entries.

### Reading MANUAL triggers

```
2026-05-19 14:23 ET   Running → Stopped   manual:jane@zopcloud.com
```

- A human stopped the resource via ZopNight UI or API
- Email identifies the actor
- Click the trigger to see the audit-log entry with the full request

Manual triggers should be rare for scheduled resources. Frequent manual triggers on a scheduled resource suggest:

- The schedule's hours don't match the team's actual needs (adjust schedule)
- The team doesn't trust the schedule (figure out why, address)
- A specific use case warrants overrides instead (set them up)

### Reading OVERRIDE triggers

```
2026-05-19 17:30 ET   Stopped → Running   override-applied: force-on
                                           (Override:O5678, "Acme demo")
2026-05-22 08:00 ET   Running → (unchanged) override-expired
                                           (Override:O5678)
```

Two related entries: when an override took effect and when it expired. Notice the second entry says "unchanged" — override expiry doesn't transition state; it just allows the schedule to act on the next cron.

### Reading AUTO-REMEDIATION triggers

```
2026-05-18 03:14 ET   Running → Stopped   auto-rem:RC-001 (Idle EC2)
                                           (Recommendation:R-9999)
```

- Recommendation rule `RC-001` (Idle EC2) fired auto-remediation
- The transition stops the resource
- Click through to the recommendation card to see the evidence

Auto-remediation is a specific class of event — covered fully in [T2.M2.3](../../T2_zopnight_engineer/M2.3_auto_remediation/00_README.md). Visible to operators here for awareness.

### Reading DRIFT triggers

```
2026-05-17 14:23 ET   Stopped → Running   DRIFT (detected 14:38)
```

- Cloud-side state changed from Stopped to Running
- ZopNight detected it 15 minutes after via the next discovery sync
- ZopNight did NOT cause this — something external acted

Drift events are the most operationally interesting. They indicate something outside ZopNight is touching the resource. Common causes:

- A terraform apply changed state
- A CI/CD pipeline started a resource for a test
- An engineer in the cloud console
- Auto-recovery from a cloud-side health check
- An out-of-process script

A team that sees repeated drift on scheduled resources should investigate the source. The drift itself isn't a bug; the unknowingness of what's causing it is the gap.

### The retry pattern

If ZopNight attempts a transition and the cloud provider returns an error, the transition is recorded with a "failed" status:

```
2026-05-19 08:00 ET   Stopped → Starting   schedule:S1234 (FAILED)
                                            "InsufficientInstanceCapacity"
2026-05-19 08:05 ET   Starting → Starting   schedule:S1234 (RETRY #1)
2026-05-19 08:05 ET   Starting → Running   schedule:S1234 (succeeded after retry)
```

Three rows for what looks like one event. The first row is the failed attempt; the second is the retry; the third is the success. The team can see the retry pattern.

If retries exhaust (default 3), the resource stays in the previous state and a notification fires.

### Trigger-source as a filter

The state-history view supports filtering by trigger source:

```
FILTER: trigger source = DRIFT, last 30 days, all resources

Result: 14 drift events
  - 8 on dev-platform (terraform pipeline running outside schedule)
  - 4 on staging-services (engineer testing in cloud console)
  - 2 on prod-shared (auto-recovery from a cloud-side health check)
```

The filter surfaces the pattern. Eight drift events from a terraform pipeline is a clear signal to fix the pipeline (or schedule around it). Two from auto-recovery is acceptable noise.

### Aggregated trigger-source stats

The History page has an aggregate panel:

```
LAST 30 DAYS — STATE-CHANGE BREAKDOWN BY TRIGGER

SCHEDULE                14,820  (87%)
MANUAL                   1,240  (7%)
OVERRIDE                   480  (3%)
AUTO-REMEDIATION          312  (2%)
DRIFT                      148  (1%)
```

A healthy estate has mostly SCHEDULE entries. Manual and override are 5–15% each. Auto-remediation is 1–3% (depends on adoption). Drift should be <2%.

If drift exceeds 5%, the team is fighting outside processes. Address the source.

---

## 2. Demo

A weekly history review:

```
T+0       Engineer opens History page, filters to "last 7 days, all resources."

T+30 sec  Reviews the aggregate stats:
            SCHEDULE: 3,210  (84%)
            MANUAL:    420   (11%)   ← higher than normal
            OVERRIDE:   90   (2%)
            AUTO-REM:   45   (1%)
            DRIFT:      75   (2%)

T+1 min   Manual is at 11% — higher than expected. Filters to MANUAL only.

T+1:30    Sees pattern: engineer manually starting/stopping the same 6
            staging RDS instances multiple times per day.

T+2 min   Engineer reaches out: "Why are you manually managing those RDS?"
            Response: "The schedule's wrong — staging RDS needs to be on
            evenings for our team's overnight test suite."

T+5 min   Engineer adjusts the staging-eu schedule:
            Cron #1: "0 8 * * 1-5"   Start
            Cron #2: "0 20 * * 1-5"  Stop (existing)
            +Cron #3: "0 22 * * 1-5"  Start (new — for evening tests)
            +Cron #4: "0 4 * * 2-6"   Stop (new — after overnight tests)

T+6 min   Schedule fires the new cadence. Manual triggers drop to ~2% the
          following week.
```

The history surfaced the operational gap. The fix was a schedule edit, not a process change.

(Asset: `assets/diagrams/M1.6_L2_trigger_breakdown.svg`.)

---

## 3. Hands-on (5 min)

For your estate's last 7 days:

```
1. Open the History page.
2. Review the aggregate breakdown by trigger.
3. Identify any anomalous percentage (e.g., DRIFT >5%, MANUAL >15%).
4. For each anomaly:
   - Filter to that trigger type
   - Look at the affected resources
   - Hypothesize the root cause
5. Common causes for the anomalies:
   - High DRIFT → check IaC, CI/CD, cloud console activity
   - High MANUAL → schedule's pattern doesn't match real need
   - High OVERRIDE → revisit override patterns; some may be schedule edits
6. Document one improvement to make based on what you saw.
```

---

## 4. Knowledge check

### Q1
A drift event appears for a non-prod resource that should be under schedule control. The most likely interpretation:

A. ZopNight bug
B. Something outside ZopNight changed the resource's state (terraform pipeline, engineer in cloud console, auto-recovery). Investigate the source via cloud-side logs (CloudTrail / Cloud Logging / Activity Log).
C. The schedule fired twice
D. The cloud is broken

<details>
<summary>Show answer</summary>

**Correct: B.** Drift is informative. The next step is to identify what external process is touching the resource.
</details>

### Q2
A team sees MANUAL trigger at 15% over the last week. The most actionable next step:

A. Discipline the engineers
B. Investigate which resources are being manually managed and why. Likely: the schedule's pattern doesn't match the team's real need. Adjust the schedule (or recognize a legitimate need for an override pattern).
C. Disable manual actions
D. Add more notifications

<details>
<summary>Show answer</summary>

**Correct: B.** High manual usage is a signal — usually that the schedule isn't right for the workload. The fix is to adjust the schedule (or accept the manual pattern as legitimate).
</details>

### Q3
A history entry shows: `schedule:S1234 (FAILED)` followed by `schedule:S1234 (RETRY #1)` followed by `schedule:S1234 (succeeded after retry)`. Most accurate interpretation:

A. The schedule fired three times
B. The schedule fired once, hit a transient cloud-side error, retried once, and succeeded. ZopNight's retry pattern absorbed the transient failure. The team doesn't need to do anything.
C. The schedule is broken
D. The retry is unauthorized

<details>
<summary>Show answer</summary>

**Correct: B.** Retries are normal — transient cloud-side errors (capacity, rate limits) are absorbed by the executor's retry layer. The team sees the activity in the history; no action needed.
</details>

---

## 5. Apply

Trigger column reading lives in:

- **[Resource detail → State History](https://app.zopnight.com/resources)** — per-resource view
- **[History page](https://app.zopnight.com/history)** — estate-wide aggregate with filters

For notifications (covered next), the trigger context shapes the notification routing.

---

## Related lessons

- [L3 — Slack / Teams / GChat notifications](L3_notifications.md) *(next)*
- [L1 — The state-history timeline](L1_state_history.md)
- [T2.M2.3 — Auto-remediation](../../T2_zopnight_engineer/M2.3_auto_remediation/00_README.md)

## Glossary terms touched

[Trigger column](../../../reference/glossary/trigger-column.md) · [Schedule trigger](../../../reference/glossary/schedule-trigger.md) · [Manual trigger](../../../reference/glossary/manual-trigger.md) · [Auto-remediation trigger](../../../reference/glossary/auto-remediation-trigger.md) · [Drift trigger](../../../reference/glossary/drift-trigger.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.6.L2
