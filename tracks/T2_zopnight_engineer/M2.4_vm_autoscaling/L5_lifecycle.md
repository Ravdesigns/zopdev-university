# Apply, pause, resume, remove — the lifecycle

§ T2 · M2.4 · L5 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **walk** an autoscaler policy through its full lifecycle, **understand** what each operation does at the cloud layer, **and execute** safe rollback when needed.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Manage autoscaler policies through their full lifecycle — apply, pause, resume, remove — with confidence in reversibility." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.4.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Walk (Apply), Understand (Understand), Execute (Apply) |

---

## 1. Concept

Four lifecycle operations on every autoscaler policy. Each maps to specific cloud API operations under the hood.

```
APPLY     Push the policy to the cloud (create cloud-side autoscaler)
PAUSE     Disable scaling actions without removing the policy
RESUME    Re-enable a paused policy
REMOVE    Roll back: delete cloud-side autoscaler; restore previous config
```

The lifecycle is the full management surface. All four operations are idempotent + reversible.

### APPLY — pushing to the cloud

```
WORKFLOW STEPS:

1. Provisioner validates the policy against the cloud
   - Target exists?
   - Permissions present?
   - Min/max sensible (max > min)?
   
2. Pre-checks pass; proceed
   
3. Cloud API call (provider-specific):
   AWS ASG: PutScalingPolicy + UpdateAutoScalingGroup
   ECS:     RegisterScalableTarget + PutScalingPolicy
            (prefixed "zopnight-ecs-")
   Azure VMSS: PutAutoScaleSettings
   GCP MIG:    insertAutoscaler
   
4. Previous config saved on policy event row
   For later rollback (Remove operation)
   
5. Cloud policy now active
6. ZopNight monitors metrics; scales per policy
```

The previous-config save is critical. Without it, Remove couldn't restore the original setup byte-for-byte.

### PAUSE — disable temporarily

```
PAUSE STEPS:

1. ZopNight stops sending scaling intents to the cloud
2. Cloud-side autoscaler may continue if it has its own native triggers
   (e.g., AWS ASG's scale_in_protection)
3. ZopNight's logic is dormant:
   - Recommendations still surface
   - But no automated execution
4. Policy event row records the pause action

WHEN TO PAUSE:
  Compliance event (temporary halt of automation)
  Investigating an anomaly
  Coordinating with planned change windows
  Quick rollback without losing configuration
```

Pause is reversible without re-doing all the configuration.

### RESUME — re-enable

```
RESUME STEPS:

1. ZopNight resumes monitoring
2. Cloud-side state may have drifted
   ZopNight queries current state
3. Resumes per-policy logic at next metric check
4. Resume event recorded in audit log

GUARANTEE:
  Resume is non-destructive
  Cloud-side state preserved during pause
  ZopNight picks up where it left off
```

Resume is the simple counterpart to Pause.

### REMOVE — complete rollback

```
REMOVE STEPS:

1. ZopNight queries the previous_config from the policy event row
   (Saved during Apply)
   
2. Cloud API calls:
   - Delete ZopNight's added scaling policy
   - Restore the previous autoscaling group / scalable target config
   - For ECS: deregister the scalable target if previously not registered
   
3. The cloud autoscaling state returns to pre-ZopNight (byte-accurate)
   
4. Event row records the remove with restoration confirmation

EFFECTIVE OUTCOME:
  Cloud-side autoscaling = exactly what it was before ZopNight applied
  No residual ZopNight artifacts
  Audit log shows the full sequence
```

Remove is the "undo" — fully reversible to the pre-ZopNight state, byte-accurate.

### What happens if Remove fails midway

```
SCENARIO: ZopNight tried to remove a policy
  Delete Policy call failed (rate-limited by AWS)
  The Restore step didn't execute

RESULT:
  Cloud is in an inconsistent state
  ZopNight's policy still exists
  ZopNight has logged it as "removing"
  Manual intervention needed

UI RESPONSE:
  Policy shown in "remove failed" status
  Restore step pending
  Operator clicks "Retry Remove" to complete
  
IDEMPOTENT RESTORE:
  Remove can be retried until it succeeds
  No partial-state corruption
```

The idempotency of Remove means engineers can recover gracefully from failures.

### Adopted policies — different rules

Recall from M2.5: some policies are "adopted" (pre-existing in the cloud, observed but not managed by ZopNight). For adopted policies:

```
ADOPTED POLICY LIFECYCLE:

APPLY    No cloud mutation
         Records existing config as "previousConfig"
         
PAUSE    Effectively a no-op (ZopNight wasn't acting anyway)
         
RESUME   Effectively a no-op
         
REMOVE   Same as no-op (cloud-side state unchanged)
         
EDIT     Auto-promotes the policy from "adopted" to "recommended"
         (the ownership flag changes)
         
The user explicitly upgrades to ZopNight management when ready.
```

Adopting a policy is the safe default for existing cloud autoscaling. The customer chooses when to take over management.

### The Edit → auto-promote flow

```
T+0      Customer is observing an adopted policy:
         min=4, max=12, target=60%
         
T+0      Customer wants to change target to 65%. Clicks Edit.
T+0      Modifies the value. Saves.
T+0      ZopNight: source flag flips from "adopted" → "recommended"
         The policy is now owned by ZopNight
         
T+5s     UI prompts: "Re-apply policy to push the new target value
                       to the cloud?"
         
T+15s    Customer clicks Re-apply
T+30s    Cloud-side autoscaler updated. Cooldown clock resets.

OUTCOME:
  Adopted → recommended (irreversible)
  Cloud-side now reflects ZopNight management
  
NOTE: Once recommended, policy stays recommended.
       Don't accidentally edit adopted policies if you want to
       preserve observation-only status.
```

Auto-promote is a one-way change. Once a policy is recommended (ZopNight-owned), it stays recommended.

### Lifecycle audit trail

Every lifecycle operation is logged:

```
POLICY EVENT LOG:
  Apply:    timestamp, user, cloud-side response, previous_config saved
  Pause:    timestamp, user, reason (optional)
  Resume:   timestamp, user
  Remove:   timestamp, user, restoration confirmation
  
RETRIEVAL:
  Policy detail page → Events tab
  Or: Settings → Audit → Autoscaler operations
  
USE CASES:
  Debugging (when did this policy change?)
  Compliance (audit trail of automated actions)
  Rollback investigation (what was the previous config?)
```

The audit log preserves the complete history.

### Common lifecycle mistakes

```
MISTAKE                              MITIGATION
──────────────────────────────────────────────────────────────────
Apply without testing on dev first    Use staging account; test before prod
                                      
Pause as a substitute for fixing      Pause is temporary; investigate
the underlying issue                  root cause
                                      
Remove + Apply (instead of Edit)      Edit + Re-apply is safer
                                      Preserves audit + history
                                      
Frequent policy churn                 Tune existing policies vs recreating
                                      Audit log gets cluttered
                                      
Forgetting that adopted Edit         Read M2.5 before editing adopted
auto-promotes
                                      
Race conditions during Remove          Idempotent retry; investigate
                                      cloud-side state
```

Most mistakes are about misunderstanding what operation to use. The decision matrix above clarifies.

---

## 2. Demo

A team's policy lifecycle in 6 months:

```
MONTH 0    APPLY: created policy on prod-api ASG
           Mode: recommend
           Result: working as expected
           Audit log: policy created; previous_config = ASG had no scaling

MONTH 1    Mode change to autopilot
           Audit log: mode change

MONTH 3    Anomaly detected. Workload pattern changed.
           EDIT: tuned target value from 60% → 70%
           Re-apply to push to cloud
           Audit log: edit + re-apply

MONTH 4    Compliance event. Auto-scaling temporarily concerning.
           PAUSE: ZopNight stops scaling actions
           Result: cloud-side scaler runs its own rules
                   (or static; depending on previous_config)
           Audit log: pause; reason="Compliance review"

MONTH 4.5  Compliance event resolved.
           RESUME: ZopNight resumes management
           Audit log: resume

MONTH 6    Workload retired. Time to remove ZopNight's policy.
           REMOVE: cloud restored to pre-ZopNight config
           Policy archived in the policy event log
           Audit log: remove + restoration confirmation
```

Each lifecycle operation has a specific purpose. Together they cover the full management cycle.

---

## 3. Hands-on (5 min)

Walk a policy through the lifecycle in a sandbox:

```
□ STEP 1: APPLY a new policy
  Create policy via Quick Setup
  Observe cloud-side change
  Verify previous_config saved

□ STEP 2: PAUSE the policy
  Click Pause
  Verify ZopNight stops scaling
  Verify cloud-side state preserved

□ STEP 3: RESUME the policy
  Click Resume
  Verify ZopNight resumes scaling
  Verify state correct

□ STEP 4: REMOVE the policy
  Click Remove
  Verify cloud-side restored to previous_config
  Verify ZopNight policy artifact gone

□ STEP 5: Review audit log
  Settings → Audit → autoscaler operations
  Verify all 4 events logged
```

A 15-minute exercise reveals the lifecycle mechanics.

---

## 4. Knowledge check

### Q1
A policy's previousConfig is captured on Apply because:

A. For backups
B. Remove uses it to restore the cloud-side state to its pre-ZopNight configuration. Byte-accurate restoration is the design goal. Without previousConfig, rollback would be incomplete.
C. Performance optimization
D. Cloud requires it

<details>
<summary>Show answer</summary>

**Correct: B.** Reversibility is the architectural goal.
</details>

### Q2
Editing an adopted policy:

A. Doesn't affect ownership
B. Auto-promotes the policy from "adopted" to "recommended" — ZopNight now owns it. One-way transition. The Edit triggers ownership change; subsequent operations treat it as recommended.
C. Deletes the policy
D. Pauses it

<details>
<summary>Show answer</summary>

**Correct: B.** Edit-of-adopted = ownership change.
</details>

### Q3
Pause and Remove differ how:

A. Same action
B. Pause keeps the cloud-side policy intact but ZopNight stops acting. Remove deletes ZopNight's policy and restores the previous cloud-side configuration. Reversibility scope differs.
C. Random
D. Pause is faster

<details>
<summary>Show answer</summary>

**Correct: B.** Reversibility scope differs.
</details>

---

## 5. Apply

Automation → Policies → click any policy → Apply / Pause / Resume / Remove actions. Each is one click.

For your team: understand the full lifecycle before applying first policy. Reversibility is the safety net.

---

## Related lessons

- [L1 — Scaling policy basics](L1_scaling_policy_basics.md)
- [L2 — Welford stats](L2_welford_stats.md)
- [L3 — Quick setup](L3_quick_setup.md)
- [L4 — Three modes](L4_three_modes.md)
- [L6 — Event log](L6_event_log.md) *(next)*
- [M2.5 — Adopt or replace](../M2.5_adopt_or_replace/00_README.md)

## Glossary terms touched

[Policy lifecycle](../../../reference/glossary/policy-lifecycle.md) · [previous_config](../../../reference/glossary/previous-config.md) · [Idempotent remove](../../../reference/glossary/idempotent-remove.md) · [Adopt-or-promote](../../../reference/glossary/adopt-or-promote.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L5
