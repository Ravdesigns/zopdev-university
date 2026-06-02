# The Adopt flow

§ T2 · M2.5 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **adopt** an existing cloud-side scaling configuration without mutation, **verify** that no cloud-side changes occurred, **and migrate** to ZopNight management when ready.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Bring existing scaling configs under ZopNight visibility without changing them — preserve customer's existing investment." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.5.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Adopt (Apply), Verify (Evaluate), Migrate (Apply) |

---

## 1. Concept

Adopt is the "zero mutation" path. ZopNight tracks the existing policy, surfaces its configuration, but never modifies the cloud-side. The policy stays exactly as it was.

```
ADOPT GUARANTEE:
  Zero cloud-side mutation during adoption
  Existing scaling continues as before
  ZopNight observes; doesn't act
  Customer can audit before / after; state unchanged
```

Adopt is the safe default for any existing scaling configuration.

### What happens during adopt

```
ADOPT WORKFLOW:

1. Customer picks Adopt in the Create wizard
2. ZopNight calls cloud API to fetch current scaling configuration
3. Full raw config (scalable_target, policies, scheduled_actions)
   is captured as the policy's previousConfig
4. ZopNight creates a tracking record with:
   source = adopted
   target = the cloud-side target
   min, max, target, cooldown = current values
   mode = monitor (default for adopted)
5. NO cloud API mutations. Cloud-side state unchanged.
6. Customer sees the policy in the Autoscaler page
```

The byte-accurate config preservation = ability to restore later if needed.

### What gets stored

```
ADOPTED POLICY: stripe-payments-asg-1
─────────────────────────────────────────────────────────
Source:        adopted
Cloud target:  stripe-payments-asg-1 (ASG)
Last seen:     2026-05-20T08:00:00Z
Mode:          monitor (default for adopted)

CURRENT CLOUD-SIDE CONFIG:
  Scalable target: min 4, max 12, desired 6
  
  Scaling policies:
    "scale-out-cpu": Target tracking, CPU 60%
    "scale-out-step-1": Step scaling, alarm thresholds
    "scheduled-action-1": Scheduled action, weekday 8 AM
  
  PREVIOUS CONFIG (rawSpec):
    {... full provider-specific JSON ...}
```

The "Previous config (rawSpec)" is the byte-accurate cloud-side state. Adopt preserves this so future Remove can restore exactly.

### What the customer sees in the UI

```
AUTOSCALER PAGE: stripe-payments-asg-1
─────────────────────────────────────────────────────────
  Provider:           aws
  Target:             ASG: stripe-payments-asg-1
  Status:             Active (managed by cloud)
  Source:             adopted     ← key indicator
  Mode:               monitor

  ZopNight knows this policy exists but does not modify it.
```

The "adopted" badge is prominent. There is no ambiguity about ownership.

### Recommendations on adopted policies

ZopNight can recommend optimizations on adopted policies:

```
RECOMMENDATIONS for stripe-payments-asg-1 (adopted)
─────────────────────────────────────────────────────────
RC-ASC-004 Scaling target too high (>90%)
  Current target: 90%
  Suggested target: 70%
  
  Why: scaling triggers at saturation; latency suffers
  
[Apply]  (would auto-promote to recommended)
[Dismiss]
[Snooze]
```

Apply triggers the auto-promote on edit flow. The user sees that path explicitly before any cloud mutation.

### When to use Adopt

```
SCENARIO                                  USE ADOPT?
─────────────────────────────────────────────────────────
Existing config from Terraform/CFN          YES (preserve IaC)
                                            
Existing config from console                YES (preserve manual setup)
                                            
Config from other FinOps tool (Spot/etc)   YES (don't disrupt them)
                                            
Config seems well-tuned                     YES (don't second-guess)
                                            
New workload; no existing config            NO (skip adopt; create direct)

Recently-changed config; team uncertain     YES (observe before acting)

Config seems broken or outdated             Maybe (consider Replace instead)
```

Default to Adopt for any non-trivial existing config.

### Removing an adopted policy

```
REMOVE on adopted policy = effectively no-op:
  
  1. Customer clicks Remove on an adopted policy
  2. ZopNight has nothing to undo (no cloud mutations performed)
  3. Tracking record deleted from ZopNight
  4. Cloud-side state remains exactly as it was
  
EFFECTIVELY: "stop tracking this"
  Cloud-side scaling continues as before
  ZopNight no longer shows the policy
  Reversible: re-adopt anytime
```

Adopt is cheap to undo; that's part of its safety.

### Auto-promote flow recap

When editing an adopted policy, the source auto-promotes:

```
Editing adopted policy:
  
  T+0      Adopted: target 60%
  T+5s     User clicks Edit; changes target to 65%
  T+5s     ZopNight prompts: "Source will change adopted → recommended"
  T+5s     User confirms
  T+5s     Source promoted; policy now recommended
  T+5s     UI prompts: "Re-apply to push new value to cloud?"
  T+15s    User clicks Re-apply
  T+30s    Cloud-side updated to target 65%
  
ONE-WAY TRANSITION:
  Once recommended, stays recommended
  Don't accidentally edit adopted policies you want to keep as adopted
```

The auto-promote is explicit; documented in audit log.

### Cost-impact recommendations for adopted

ZopNight provides cost-impact analysis even on adopted policies:

```
COST IMPACT for adopted policy (analytical view):
  
  Estimated cost from current config:    $1,200/mo
  Estimated cost if target were 65%:     $920/mo
  Potential savings:                       $280/mo
  
  Scaling pattern analysis:
    47 scaling actions in past month (high; due to aggressive target)
    Average instances: 5.8 (vs theoretical optimal 4.2)
    Latency impact: minimal (target is high; not at saturation often)
    
  Recommendation: tune target to 65% for cost savings + lower churn
```

The analysis is non-actionable in adopt mode but informative. Customer can choose to act.

---

## 2. Demo

A team adopting all existing scaling on day one:

```
T+0      Team has 47 ASGs across prod and non-prod
         Each with existing cloud-side scaling from CloudFormation
         
T+5 min  Team's onboarding playbook: adopt all existing configurations
         For each ASG:
           Create policy → wizard detects existing config → Adopt
           
         ZopNight tracks 47 policies, all source=adopted
         Zero cloud-side mutations

T+1 MONTH:
  Team reviews recommendations:
    12 ASGs have target too high (>90%)
    8 have cooldown too short
    5 have step scaling that's poorly tuned
    The rest: configured well
  
T+2 MONTHS:
  Team works through recommendations
  For each, editing an adopted policy auto-promotes to recommended
  Tests the change in staging first; then production
  
T+3 MONTHS:
  32 ASGs now ZopNight-recommended (managed)
  15 still adopted (no recommendations; well-tuned originally)
  
RESULTS:
  Cost savings: ~$8K/mo across the optimized 32 policies
  Latency: improved (less scaling churn)
  Trust built: zero incidents from auto-management
  Team comfortable with ZopNight ownership
```

The adopt-then-edit pattern is the standard onboarding pattern for teams with existing scaling.

---

## 3. Hands-on (5 min)

In a sandbox with existing cloud-side scaling:

```
□ STEP 1: Adopt one policy
  Trigger Create on a target with existing scaling
  Pick Adopt
  Confirm

□ STEP 2: Verify zero cloud-side change
  Compare cloud-side config before and after
  Should be identical (byte-accurate)

□ STEP 3: Check the policy detail
  Source: __________  (should be "adopted")
  Mode: __________
  Previous config visible: □ Yes □ No

□ STEP 4: Review recommendations (if any)
  Recommendations for this policy: _____
  Action available: __________

□ STEP 5: Plan future transition
  Will you re-evaluate in 30 days? □ Yes
  Edit policy to take ownership? __________ (when)
```

A 10-minute exercise reveals the adopt flow's safety.

---

## 4. Knowledge check

### Q1
What cloud API mutations happen during Adopt?

A. ZopNight modifies the policies
B. Zero — Adopt is "observe only." The cloud-side state is unchanged. ZopNight reads the config; stores it; never mutates. This is the architectural guarantee that makes Adopt safe.
C. ZopNight creates a copy
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Zero mutation is the design.
</details>

### Q2
Removing an adopted policy:

A. Restores the original config
B. No-op for cloud-side state (nothing was changed); only deletes the ZopNight tracking record. Adopt was no-op; Remove is no-op too. Cloud-side scaling continues as it was.
C. Deletes the policy
D. Triggers an error

<details>
<summary>Show answer</summary>

**Correct: B.** Adopt was no-op; Remove is no-op too.
</details>

### Q3
Adopted policy recommendations are:

A. Auto-applied
B. Advisory — the user sees the recommendation. Applying it auto-promotes the policy to recommended and triggers cloud mutation only after explicit user action. ZopNight never modifies adopted policies without explicit consent.
C. Hidden
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Advisory only, requires explicit user action.
</details>

---

## 5. Apply

The Adopt wizard option is in Automation → Policies → New Policy. Source = adopted shows on the policy detail page.

For your team: default to Adopt for any existing scaling; review monthly; transition to Recommended when ready.

---

## Related lessons

- [L1 — Why adopt-or-replace](L1_why_aor.md)
- [L3 — Replace flow](L3_replace_flow.md) *(next)*
- [L4 — Three refusals](L4_three_refusals.md)
- [M2.4 — VM autoscaling](../M2.4_vm_autoscaling/00_README.md)

## Glossary terms touched

[Adopt flow](../../../reference/glossary/adopt-flow.md) · [previousConfig](../../../reference/glossary/previous-config.md) · [Zero-mutation guarantee](../../../reference/glossary/zero-mutation-guarantee.md) · [Auto-promote](../../../reference/glossary/auto-promote.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.5.L2
