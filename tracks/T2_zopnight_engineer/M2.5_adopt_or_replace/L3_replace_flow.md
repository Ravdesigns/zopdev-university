# The Replace flow

§ T2 · M2.5 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** Replace, **understand** what gets saved for restore, **and execute** a successful Remove with byte-accurate rollback.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Take ownership of existing cloud scaling with confidence that I can fully roll back if needed." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.5.L1 · M2.5.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Understand (Understand), Execute (Apply) |

---

## 1. Concept

Replace is the explicit takeover. ZopNight saves the existing cloud-side configuration, deletes it, and creates its own policy. The previous config is preserved so Remove can restore exactly.

```
REPLACE GUARANTEE:
  Save existing config byte-accurate (rawSpec)
  Delete existing policies
  Create ZopNight policy
  Remove operation restores byte-accurate previous state
  Fully reversible
```

The byte-accurate restore is the safety net. Replace becomes safe because Remove always works.

### What happens during Replace

```
REPLACE WORKFLOW:

1. Customer picks Replace in the Create wizard
2. ZopNight calls cloud API to fetch + serialize current config:
   - Scalable target settings
   - All scaling policies (target tracking, step scaling)
   - Scheduled actions
   - Complete rawSpec per policy (provider-specific JSON)
   
3. ZopNight evaluates "reconstructibility":
   Can the current config be reconstructed for byte-accurate restore?
   See L4 for the three refusals
   
4. If reconstructible:
   Save previousConfig.existingPolicies (rawSpec array)
   Delete user's existing scaling policies via cloud API
   Create ZopNight's policy (target tracking with smart defaults)
   Track as source=recommended
   
5. If NOT reconstructible:
   Refuse with explanation
   Zero AWS mutation
   User must use Adopt instead
```

The reconstructibility check is the safety gate. Some configs can't be perfectly restored; ZopNight refuses to take risk.

### What gets saved for Remove

```
previousConfig CAPTURED AT REPLACE TIME:
─────────────────────────────────────────────────────────
{
  "scalable_target": {
    "min_capacity": 4,
    "max_capacity": 12,
    "desired_capacity": 6,
    "service_namespace": "ecs",   // for ECS
    "scalable_dimension": "ecs:service:DesiredCount"
  },
  "policies": [
    {
      "policy_name": "scale-out-cpu",
      "policy_type": "TargetTrackingScaling",
      "raw_spec": "... full cloud-side JSON ..."
    },
    {
      "policy_name": "scale-in-after-hours",
      "policy_type": "TargetTrackingScaling",
      "raw_spec": "... full cloud-side JSON ..."
    }
  ],
  "scheduled_actions": [
    { "name": "morning-scale-out", "raw_spec": "..." }
  ]
}
```

Each `raw_spec` is the byte-accurate provider response. Restore is bit-for-bit recoverable.

### What ZopNight creates instead

```
NEW POLICY: zopnight-asg-stripe-payments-asg-1
─────────────────────────────────────────────────────────
Target tracking
CPU 65%, min 3, max 15, cooldown 240s
Policy name: "zopnight-asg-stripe-payments-asg-1-target-tracking"
```

A single, simple target-tracking policy by default. The team can later customize via Edit.

### Remove — the inverse

```
REMOVE WORKFLOW:

1. Customer clicks Remove on a replaced policy
2. ZopNight retrieves previousConfig.existingPolicies
3. Cloud API calls:
   - Delete ZopNight's policy (zopnight-asg-...)
   - For each saved policy, re-create using its raw_spec
   - For each saved scheduled_action, re-create
   - Restore the scalable_target settings
4. Verify the restored state matches the saved state
5. ZopNight's tracking record is archived

OUTCOME:
  Cloud-side state = byte-for-byte equal to pre-ZopNight
  Original CloudFormation/Terraform-managed configs preserved
  ZopNight footprint: zero
```

Byte-accurate restoration. The cloud-side is bit-for-bit the same as before ZopNight touched it.

### Idempotent restore

Remove can be safely re-run. If it failed mid-way (e.g., cloud rate-limited), retrying picks up from where it left off:

```
REMOVE retry behavior:
  
  Step 1: Delete ZopNight policy → succeeded
  Step 2: Restore first existing policy → FAILED (rate limit)
  
  Retry:
  Step 2: Restore first existing policy → succeeded (this time)
  Step 3: Restore second policy → succeeded
  Step 4: Restore scheduled action → succeeded
  Step 5: Restore scalable_target → succeeded
  
  Final: validation succeeds; restore complete
  
  Saved config preserved across retries
  No risk of double-restoration
  Idempotent design
```

The idempotency = safe to retry; no partial-state corruption.

### Pre-Replace safety check — reconstructibility

Before any cloud mutation, ZopNight runs the reconstructibility check:

```
RECONSTRUCTIBILITY CHECKS:

CHECK 1: Predictive scaling policies
  If any policy has policy_type = "PredictiveScaling" → refuse Replace
  (Cannot recreate from rawSpec; the prediction state is stateful)

CHECK 2: Step scaling with >2 step adjustments
  If a step scaling policy has more than 2 step adjustments → refuse
  (rawSpec includes lower/upper bounds in a specific format that
   doesn't reliably round-trip)

CHECK 3: Customized metrics with multiple dimensions
  If a target tracking policy uses a customized metric with metric math
  or >1 dimension → refuse
  (The metric specification is complex enough that restoration risks
   subtle behavior changes)

IF ANY CHECK FAILS:
  Refuse with explanation
  Suggest Adopt instead
  Zero AWS mutation
```

Three refusals — explored in detail in L4. The refusals are pessimistic guards against subtle restore failures.

### When Replace is the right call

```
SCENARIO                                      RECOMMENDATION
─────────────────────────────────────────────────────────────
Existing config is broken                      Replace
                                              
Migrating from another autoscaler tool         Replace
                                              
Team wants ZopNight as canonical source        Replace
                                              
Existing config is fine, just observe          Adopt
                                              
Risk-averse, want to be conservative           Adopt
                                              
Compliance requires deliberate change          Replace (documented)
                                              
Workload is non-prod                           Replace OK
                                              
Workload is critical prod                       Adopt first, Replace later
                                              When trust built
                                              
Existing config triggers reconstructibility refusal
                                              Must use Adopt
                                              Replace refused
```

The path is contextual. Replace when ownership clarity matters; Adopt when preservation matters.

### Risk model — what could go wrong

```
LOW RISK during Replace:
  Cloud API rate limits
  Transient errors (retried automatically)
  
MEDIUM RISK:
  Cloud-side state changing during the Replace operation
  (rare; <1% of operations)
  
LOW RISK due to design:
  Lost previousConfig (saved before any mutation)
  Partial-state corruption (idempotent retry)
  Unrecoverable state (byte-accurate restore always available)

MITIGATIONS:
  Run during planned change windows for production workloads
  Have rollback path tested (Remove → verify)
  Monitor first hour after Replace for unexpected behavior
```

The Replace flow is safe in practice. The reconstructibility check + saved config + idempotent restore handle the failure modes.

---

## 2. Demo

A team replacing legacy scaling on a critical workload:

```
SCENARIO: ASG has 2-year-old CloudFormation scaling config
  Team is unsure exactly what it does
  Wants ZopNight to manage it cleanly

T+0       Open Create wizard. Pick Replace.
T+5s      ZopNight fetches existing config:
            - 1 target tracking policy (CPU 60%)
            - 1 step scaling policy (custom metric)
            - 2 scheduled actions

T+5s      Reconstructibility check passes
T+5s      ZopNight prompts confirmation:
          "Replace will:
            Save existing config (3 policies + 2 scheduled actions)
            Delete them from the cloud
            Create a new ZopNight policy
            
            Saved for restore on Remove."

T+10s     User confirms
T+15s     Cloud API calls:
            Delete existing policies (3 calls)
            Delete existing scheduled actions (2 calls)
            Create new ZopNight policy
            
T+30s     Validation: confirm new state on cloud-side
T+30s     Replace complete. Source = recommended
          Policy is now ZopNight-managed

LATER: team needs to roll back

T+0       Remove triggered
T+15s     Restore existing policies (3) + scheduled actions (2)
          Using saved raw_spec
T+20s     Delete ZopNight's policy
T+25s     Validate restored state matches saved state
T+25s     Cloud-side back to its pre-ZopNight configuration

OUTCOME:
  Replace + Remove = full reversibility
  Engineer confidence: high
  Audit trail: complete
```

Replace + Remove = full reversibility. The safety net makes Replace acceptable.

---

## 3. Hands-on (5 min)

In a sandbox, walk through Replace:

```
□ STEP 1: Set up existing scaling in a sandbox ASG
  Confirm: ASG has at least one scaling policy

□ STEP 2: Create policy via Replace
  Wizard detects existing config
  Pick Replace
  Confirm

□ STEP 3: Inspect what got saved
  Open the new policy
  View previousConfig
  Compare to original cloud-side config
  Verify byte-accurate match

□ STEP 4: Test Remove
  Click Remove on the new policy
  Watch the cloud-side restore
  Verify state matches saved config

□ STEP 5: Verify full reversibility
  Compare current cloud-side state to original
  Should be byte-for-byte identical
```

A 15-minute exercise builds confidence in the reversibility.

---

## 4. Knowledge check

### Q1
What gets saved during Replace?

A. Nothing
B. The full cloud-side state (scalable_target, all policies' raw_spec, scheduled actions) in previousConfig.existingPolicies — byte-accurate. Saved before any cloud mutation, so restore is always possible.
C. Just min/max
D. A snapshot

<details>
<summary>Show answer</summary>

**Correct: B.** Full configuration saved for byte-accurate restore.
</details>

### Q2
A team runs Remove on a replaced policy. The cloud-side state after Remove:

A. Empty (no scaling)
B. Identical to pre-Replace — the saved previousConfig is restored bit-for-bit. Byte-accurate restore is the design. The whole point of Replace is that Remove fully reverses it.
C. Modified
D. Mixed

<details>
<summary>Show answer</summary>

**Correct: B.** Byte-accurate restore is the design.
</details>

### Q3
A Replace operation fails on cloud API after the first deletion. The cloud-side is now inconsistent. What does ZopNight do?

A. Discard the saved config
B. The saved previousConfig.existingPolicies is preserved. The operator can retry Remove (or Replace) to either: restore via Remove using saved config, or proceed with Replace from the partial state. Saved config is preserved; retries are idempotent.
C. Crash
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Saved config is preserved; retries are idempotent.
</details>

---

## 5. Apply

Replace flow is in Automation → Policies → New Policy → wizard detects existing config. Pick Replace. Remove restores via the same surface.

For your team: use Replace when taking ownership; trust the saved-config safety net.

---

## Related lessons

- [L1 — Why adopt-or-replace](L1_why_aor.md)
- [L2 — Adopt flow](L2_adopt_flow.md)
- [L4 — Three refusals](L4_three_refusals.md) *(next)*
- [M2.4.L5 — Lifecycle](../M2.4_vm_autoscaling/L5_lifecycle.md)

## Glossary terms touched

[Replace flow](../../../reference/glossary/replace-flow.md) · [previousConfig.existingPolicies](../../../reference/glossary/previous-config-existing-policies.md) · [Byte-accurate restore](../../../reference/glossary/byte-accurate-restore.md) · [Reconstructibility check](../../../reference/glossary/reconstructibility-check.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.5.L3
