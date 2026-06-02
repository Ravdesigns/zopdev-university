# Schedule-and-rollback contract

§ T2 · M2.9 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **trace** an event through its lifecycle states, **execute** rollback (cancel) at the right time, **and recover** from partial failures.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the event lifecycle so I can monitor, cancel, or recover at any point in the cycle." |
| **Personas** | Platform Engineer · SRE |
| **Prerequisites** | M2.9.L1 · M2.9.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Trace (Apply), Execute (Apply), Recover (Apply) |

---

## 1. Concept

Event lifecycle has clear states with defined transitions:

```
draft → scheduling → scheduled → scaling_up → active → scaling_down → completed
                                         ↓
                                      cancelled
```

Each state has specific behavior. The transitions are deterministic.

### State descriptions

```
draft         Event defined but not committed for execution
              Customer can edit freely
              
scheduling    Cloud-native scheduled actions being created
              Brief state (~seconds)
              
scheduled     Cloud-native actions in place
              Event will fire on schedule
              Pre-event state; can still cancel cleanly
              
scaling_up    Event start hit; capacity ramping up
              Pre-warm in progress
              ~5-15 minutes typical
              
active        Capacity at event level; traffic served
              Main event duration
              Can monitor live; can cancel mid-event
              
scaling_down   Event end hit; capacity scaling back
              Returning to baseline
              ~5-15 minutes typical
              
completed      Event finished; baseline restored
              Historical state
              Audit log available
              
cancelled      Event aborted before completion
              Can happen from scheduling/scheduled/scaling_up/active
              Triggers cleanup
```

The states are exhaustive; one state at any time.

### Cloud-native scheduled actions

Instead of polling, ZopNight uses each cloud's native scheduled-action mechanism:

```
AWS ASG          PutScheduledUpdateGroupAction
AWS ECS          Application Auto Scaling PutScheduledAction
Azure            Autoscale Settings with FixedDate profile
GCP              scalingSchedules
```

These cloud-side actions fire at the configured datetime, no polling required. ZopNight just verifies they're set correctly.

```
WHY CLOUD-NATIVE:
  More reliable (cloud guarantees execution at scheduled time)
  No ZopNight downtime risk
  Lower latency to fire
  Cloud-provider scheduled action semantics well-tested

ZOPNIGHT'S ROLE:
  Create the scheduled actions
  Monitor execution
  Verify outcomes
  Coordinate across multiple targets
  Handle rollback
```

The cloud handles the trigger; ZopNight handles the orchestration.

### Rollback design — byte-accurate restoration

```
ON EVENT START:
  Original capacity SAVED: originalMin, originalMax, originalDesired
  Cloud actions scale UP to event capacity
  Pre-warm complete
  
ON EVENT END:
  Cloud actions scale DOWN to originalMin, originalMax
  Original state byte-accurately restored
  
ROLLBACK IS PROVIDER-AWARE:
  AWS ASG: sweep cleans up all "zopnight-event-*" scheduled actions
            Prevents leaks of stale scheduled actions
            
  Azure VMSS: reverts the FixedDate profile
              Cleans up the temporary profile entries
              
  GCP: cancellation handles map-key deletion
       PATCH leaves stale schedules; full Update with ForceSendFields fixes this
       
  Provider-specific quirks handled
```

The byte-accurate rollback is what makes Event Readiness safe.

### Concurrent event handling

```
SCENARIO: Event 1 active: 30 instances
          Event 2 requested overlapping with Event 1
          
WIZARD REJECTS the second request:
  "Concurrent event already scheduled on this target"
  
CONSTRAINT: per-target, one active event at a time
  Prevents conflicting cloud-side actions
  Prevents capacity confusion
  Forces planning around event overlaps

WORKAROUNDS:
  Plan events sequentially (no overlap)
  Combine into one larger event with multiple phases
  Use different target groups if truly independent
```

The constraint forces deliberate planning around event overlaps.

### Cancel before, during, or after

```
BEFORE EVENT START (state: scheduled):
  CANCEL: removes the cloud-side scheduled action
  No infrastructure mutation occurred
  No cost incurred yet
  Clean abort
  
DURING EVENT (state: active):
  CANCEL: triggers immediate scale-back to original capacity
  ZopNight calls cloud APIs to restore
  Cost stops at original capacity
  Recovery from "wait this isn't going as planned"
  
AFTER EVENT END (state: completed):
  CANCEL: not available; event is historical
  Audit log preserved
  No infrastructure changes possible
```

The cancel button is available in any pre-completed state. Different effect depending on state.

### Lifecycle event log

Every state transition is logged:

```
EVENT LOG: black-friday-2026
─────────────────────────────────────────────────────────
T+0d         draft created by user@team
T+5 min      scheduling triggered
T+10 min     scheduled: cloud actions registered
T+25 days    scaling_up started (event start hit)
T+25 days+5m active (capacity reached)
T+26 days    scaling_down started (event end hit)
T+26 days+10m completed
```

Audit trail spans the full lifecycle.

### Failure handling

```
SCHEDULING PHASE FAILURE:
  Cloud API call fails during scheduling
  State: scheduling (stuck)
  Customer action: retry via UI; or cancel + recreate
  No partial state in cloud
  
SCALING_UP PHASE FAILURE:
  Not all targets reach event capacity (partial scale-up)
  State: active (with reduced capacity)
  Customer notified
  Customer action: cancel or proceed with reduced capacity
  
SCALING_DOWN PHASE FAILURE:
  Not all targets return to baseline
  State: stuck in scaling_down
  Customer action: retry via UI; or manually verify cloud state
  
GENERAL FAILURE recovery:
  Idempotent operations
  Saved state preserved
  Audit log captures the failure point
  Customer can resume from where it stopped
```

Failures are visible and recoverable. No silent state corruption.

### Notification at each state transition

```
NOTIFICATIONS FIRE on state transitions:
  
  draft → scheduling: "Event scheduling in progress"
  scheduling → scheduled: "Event scheduled successfully for Nov 28"
  scheduled → scaling_up: "Event started; pre-warming begin"
  scaling_up → active: "Event live; capacity reached"
  active → scaling_down: "Event ending; scaling back"
  scaling_down → completed: "Event complete; baseline restored"
  any → cancelled: "Event cancelled by [user]"
  
Customer aware of progression
On-call team can monitor
Stakeholders can plan around event
```

The visibility into state is part of the trust model.

---

## 2. Demo

A complete event lifecycle:

```
DAY -30        draft state
                Event configured for Nov 28 00:00 - 23:59 UTC
                Capacity multiplier: 3x
                Customer reviews configuration

DAY -29        Customer clicks Approve
                State: scheduling
                ZopNight creates cloud-native scheduled actions:
                  PutScheduledUpdateGroupAction for ASGs
                  ECS PutScheduledAction for services
                State transition: scheduled
                Notification: "Event scheduled successfully"
                
                Cloud-side: scheduled actions now registered
                Will fire on Nov 28 00:00 UTC

DAY 0 (Nov 28 00:00 UTC)
                Cloud-native action fires
                Capacity begins scaling up
                ZopNight detects via webhook/poll
                State transition: scaling_up
                Notification: "Event started; pre-warming"

DAY 0 +5 min   Targets reach event capacity
                State: active
                Notification: "Event live, capacity reached"
                
DAY 0 +24 hr   Cloud-native action fires (event end)
                State transition: scaling_down
                Notification: "Event ending; scaling back"

DAY 0 +24 hr +10 min
                Targets back to baseline
                State: completed
                Notification: "Event complete, baseline restored"
                Cleanup verified: no stale scheduled actions

24-HOUR EVENT cleanly traced:
  6 state transitions
  4 notifications
  Full audit log
  Zero manual intervention
```

24-hour event, full lifecycle traced.

---

## 3. Hands-on (5 min)

Trace through an event's lifecycle:

```
□ STEP 1: Open Event Readiness; pick an event
  Event: __________
  Current state: __________

□ STEP 2: Check audit log
  draft → scheduling: ___ minutes
  scheduling → scheduled: ___ minutes
  scheduled → scaling_up: ___ (at event start)
  scaling_up → active: ___ minutes
  active → scaling_down: ___ (at event end)
  scaling_down → completed: ___ minutes

□ STEP 3: Identify state-specific actions taken
  scheduling: cloud actions created
  scaling_up: capacity ramping
  active: traffic served
  scaling_down: capacity restoring

□ STEP 4: Verify rollback
  Final capacity matches original?
  No stale scheduled actions?
  Audit complete?

□ STEP 5: Cancel option in current state
  Available? □ Yes □ No
  What would happen if cancelled?
```

A 10-minute trace builds confidence in the lifecycle.

---

## 4. Knowledge check

### Q1
An event in `scheduled` state — cancel removes:

A. Nothing
B. The cloud-native scheduled action. The cloud-side scaling won't fire. Infrastructure unchanged. Clean abort before any actual mutation.
C. The event entirely from history
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Cancel pre-execution = remove the cloud-side trigger.
</details>

### Q2
Concurrent events on the same target:

A. Allowed
B. Rejected — one event per target at a time. Wizard refuses overlapping events. Prevents conflicting cloud-side actions. Forces deliberate planning.
C. Both run with priority
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Concurrent is forbidden per target.
</details>

### Q3
Event end fires; cloud-side action triggers scale-down. ZopNight's responsibility:

A. Initiate the scale-down
B. Detect the action (via webhook/poll), update state to scaling_down, verify the targets reach baseline, confirm completed state. ZopNight tracks the lifecycle even though cloud actions drive the mutation.
C. Random
D. AWS handles it

<details>
<summary>Show answer</summary>

**Correct: B.** ZopNight verifies; cloud actions drive.
</details>

---

## 5. Apply

Event Readiness UI shows the current state and audit trail for each event.

For your team: trace at least one event end-to-end before relying on it for production.

---

## Related lessons

- [L1 — What Event Readiness](L1_what_event_readiness.md)
- [L2 — Capacity models](L2_capacity_models.md)
- [L4 — Database monitor-only](L4_db_monitor.md) *(next)*
- [L5 — Cost estimate](L5_cost_estimate.md)

## Glossary terms touched

[Event lifecycle](../../../reference/glossary/event-lifecycle.md) · [Cloud-native scheduled action](../../../reference/glossary/cloud-native-scheduled-action.md) · [Byte-accurate rollback](../../../reference/glossary/byte-accurate-rollback-event.md) · [Concurrent event constraint](../../../reference/glossary/concurrent-event-constraint.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.9.L3
