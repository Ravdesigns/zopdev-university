# Manual start/stop with confirmation

§ T1 · M1.2 · L4 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **execute** a manual start or stop on one or many resources **and read** the action status to confirm completion.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop a non-prod cluster immediately without setting up a schedule." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M1.1, [L1](L1_what_gets_discovered.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Execute (Apply) and Read (Understand) |

---

## 1. Concept

Schedules are the right tool for recurring start/stop. **Manual start/stop** is the right tool for one-off actions: stop a non-prod cluster before the weekend because the team finished early, start a staging environment for an out-of-band demo. Manual actions are immediate, bypassing any schedule, and always require explicit confirmation.

### The single-resource path

For one resource:

```
1. Open Resources, find the target
2. Click the resource row to open the detail panel
3. Click the Stop (or Start) button — large, primary action
4. Confirmation modal appears with:
   - Resource name and UID
   - Current state
   - Action being requested
   - Effect summary (e.g., "Will stop ~$24/day of billing")
5. Click Confirm
6. Action status appears: Processing... → Completed (or Failed)
7. Resource state updates in the list within 60–90 seconds
```

The confirmation modal is intentional friction. A misclick on Stop should not silently terminate a running prod resource. The modal is brief but explicit.

### The bulk path

For many resources:

```
1. Open Resources, apply filters to narrow to the targets
2. Click the checkbox in the table header → "Select All Filtered"
3. The sticky selection banner appears with the count
4. Click "Stop selected" in the banner
5. Confirmation modal lists the resources (truncated if many) + summary
6. Click Confirm
7. Worker pool processes the actions (4 parallel workers by default)
8. Bulk action status panel appears with per-resource progress
9. Each resource transitions to Stopped state as its action completes
```

The bulk path uses a 4-worker pool to prevent burst load on the cloud provider's APIs. A bulk operation on 100 resources takes 3–5 minutes typically.

### Action status semantics

Every action has a lifecycle:

```
STATE             MEANING
─────────────────────────────────────────────────────────
queued            The action is in the executor queue, not yet started
processing        The cloud provider API call is in flight
completed         The cloud provider confirmed success
failed            The action returned an error (with detail)
timeout           The action took too long; awaiting verification
```

The Resources page shows the current state inline. Click any in-flight action to expand the detail panel with the full error message (if failed) and the action timeline.

### Confirmation modal — what it shows

The confirmation modal is not just a "are you sure?" prompt. It carries information:

```
┌─────────────────────────────────────────────────────────┐
│  Stop EC2 Instance                                       │
├─────────────────────────────────────────────────────────┤
│  Resource:    prod-web-1                                  │
│  UID:         i-0abc123def456                            │
│  Account:     prod-aws-us-east-1                         │
│  Current:     Running                                     │
│  Action:      Stop                                        │
│                                                          │
│  Effect:                                                  │
│  - Compute billing stops immediately                      │
│  - EBS volumes continue billing                           │
│  - Estimated savings while stopped: ~$24.30/day          │
│                                                          │
│  Note: This is a MANUAL action and bypasses any schedule │
│  attached to this resource. The schedule will resume on   │
│  its next firing.                                         │
│                                                          │
│       [Cancel]                          [Stop the VM]     │
└─────────────────────────────────────────────────────────┘
```

The modal is the last chance to catch a wrong click. It also teaches: the user reading the modal learns that EBS keeps billing, that schedules will resume, and what the action's financial impact is.

### What the action does NOT do

Manual stop **does not** detach the resource from its schedule. The schedule remains attached and fires on its next scheduled event. The manual stop is a one-time intervention; the schedule resumes its cadence afterward.

If the user wants to stop the resource AND remove it from its schedule, the action is two steps: stop, then detach from schedule.

### Overrides vs. manual

Manual stop is a one-shot. An **override** (covered in M1.5) is a time-bounded action that explicitly suspends or forces the schedule for a defined window. Use:

- **Manual stop** if the goal is "stop it now, schedule will handle the rest."
- **Override** if the goal is "stop it for the next 48 hours regardless of schedule."

The two surfaces are different. Read M1.5 for the override flow.

### Permission requirements

Manual start/stop requires the scoped-write permissions covered in M1.1 L2 (AWS) and L3 (GCP, Azure). If the IAM policy does not grant the start/stop actions:

- The Stop button is grayed out with a tooltip explaining the missing permission
- The Permission Visibility drawer shows the relevant action as Denied
- The customer's path is to add the scoped-write extension to their IAM and refresh

The button never silently fails. If a click does nothing, the disabled tooltip explains why.

---

## 2. Demo

A typical manual stop workflow:

```
T+0       Engineer notices a non-prod EKS cluster is idle for the weekend
T+5 sec   Opens Resources, searches "staging-eks"
T+10 sec  Clicks the cluster row → detail panel
T+12 sec  Clicks Stop
T+13 sec  Confirmation modal appears with effect summary
T+18 sec  Confirms
T+18 sec  Action queued
T+19 sec  Status: Processing
T+45 sec  Cloud provider confirms: cluster scaled to 0 nodes
T+45 sec  Status: Completed
T+50 sec  Resource state in list updates to Stopped
T+50 sec  Notification fires to Slack channel
T+60 sec  Audit log entry written
```

Less than a minute from intent to confirmed action. The confirmation modal added one second of friction; the rest is real cloud API latency.

(Asset: `assets/diagrams/M1.2_L4_manual_stop_timeline.svg`.)

---

## 3. Hands-on (7 min)

Use a sandbox or non-prod resource. Do NOT do this exercise on production resources.

```
1. Open Resources. Find a non-prod, single-instance resource (a dev EC2,
   a staging RDS, an idle Compute Engine VM).
2. Read the detail panel before acting. Note current state, attached
   schedule (if any), tags.
3. Click Stop.
4. Read the confirmation modal carefully — note the effect summary.
5. Confirm.
6. Watch the action status progress: queued → processing → completed.
7. Once completed, verify in the cloud console that the resource is actually stopped.
8. Click Start to restart it (if appropriate).

Estimated time: 5 minutes including waiting for the cloud API.

BULK EXERCISE (if you have a sandbox with multiple resources):
9. Filter to 3-5 non-prod resources you can safely stop.
10. Use the bulk-action selection and Stop selected.
11. Note the sticky banner and the per-resource progress panel.
```

---

## 4. Knowledge check

### Q1
A manual stop on a resource that has a schedule attached results in:

A. The schedule is deleted
B. The resource stops immediately; the schedule remains attached and will fire on its next scheduled event
C. The schedule is paused
D. An error — manual stop is not allowed on scheduled resources

<details>
<summary>Show answer</summary>

**Correct: B.** Manual stop is a one-shot override of the current state. It does not modify the schedule. The schedule resumes on its next firing.
</details>

### Q2
A team needs to stop 47 staging resources before the weekend. Best approach:

A. Click Stop 47 times
B. Filter to the 47 resources, use the bulk action with "Select All Filtered," confirm once, let the worker pool process in parallel
C. Write a script
D. Schedule them off

<details>
<summary>Show answer</summary>

**Correct: B.** Bulk action is the right tool for >5 resources. The worker pool handles the parallelism; the confirmation modal is one click. For ongoing weekend off-hours, a schedule (D) is the right answer — but for a one-off weekend, bulk action is faster to set up.
</details>

### Q3
The Stop button on a specific resource is grayed out with a tooltip "Missing permission ec2:StopInstances." Most defensible response:

A. File a support ticket
B. Add the ec2:StopInstances permission to the cloud-side IAM policy (with whatever tag conditions are appropriate). Refresh. The button enables once the permission propagates.
C. Use the cloud console instead
D. Wait

<details>
<summary>Show answer</summary>

**Correct: B.** The tooltip is informative — it tells you exactly what permission is missing. Add the scoped-write extension to the IAM policy and the button enables.
</details>

---

## 5. Apply

Manual start/stop lives in the Resources page:

- **[Resources page](https://app.zopnight.com/resources)** — single resource: click row → Stop / Start button
- **Bulk selection** — checkbox + sticky banner → Stop selected / Start selected
- **Action status panel** — appears at the bottom of the page during bulk actions

For ongoing scheduled start/stop, build a schedule in [M1.3](../M1.3_first_schedule/00_README.md). For time-bounded overrides, use the Overrides feature in [M1.5](../M1.5_overrides/00_README.md).

---

## Related lessons

- [L5 — When discovery is stale](L5_stale_discovery.md) *(next)*
- [M1.3 — Build your first schedule](../M1.3_first_schedule/00_README.md)
- [M1.5 — Overrides](../M1.5_overrides/00_README.md)

## Glossary terms touched

[Manual action](../../../reference/glossary/manual-action.md) · [Bulk action](../../../reference/glossary/bulk-action.md) · [Confirmation modal](../../../reference/glossary/confirmation-modal.md) · [Worker pool](../../../reference/glossary/worker-pool.md) · [Action status](../../../reference/glossary/action-status.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.2.L4
