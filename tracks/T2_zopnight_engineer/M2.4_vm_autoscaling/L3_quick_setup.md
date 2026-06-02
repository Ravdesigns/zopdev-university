# Quick Setup — the one-screen flow

§ T2 · M2.4 · L3 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** a complete autoscaling policy in 60 seconds using Quick Setup, **distinguish** Quick Setup from Advanced mode, **and choose** the right mode for the workload.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Stand up an autoscaling policy fast — 60 seconds for the common case; Advanced for the edge cases." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.4.L1 · M2.4.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Distinguish (Analyze), Choose (Evaluate) |

---

## 1. Concept

Quick Setup is a streamlined flow for the most common autoscaler scenario: pick a target, accept smart defaults, save. Three clicks. For Advanced cases (custom metrics, multi-tier, schedule triggers, step scaling), there's an Advanced mode.

```
QUICK SETUP COVERS ~70% of autoscaler use cases:
  Single metric (CPU typically)
  Target tracking model
  Smart defaults accepted as-is or with minor tune
  
ADVANCED MODE for the other 30%:
  Custom metrics (queue depth, request count)
  Step scaling
  Schedule-triggered scaling
  Multi-tier or resource group targeting
```

The right mode for the workload — most reach for Quick Setup first.

### Quick Setup screen

```
NEW POLICY (Quick Setup)
─────────────────────────────────────────────────────────
Cloud account:    [prod-aws-us-east-1 ▾]
Target:           [asg-prod-payments-api ▾]
                  (filtered list — only autoscalable targets)

[Use smart defaults]   [Customize ▾]

When you click "Use smart defaults":
  ZopNight queries metrics; computes recommendations
  Shows the suggested policy

  Suggested Policy:
    Min capacity:    3
    Max capacity:   15
    Target:         60% CPU
    Cooldown:      180s
    Mode:           autopilot (based on credential permission level)

[Edit settings]   [Apply policy]
```

Two clicks to a recommendation; three to apply.

### The smart-defaults workflow

```
1. Customer picks cloud account + target (10 seconds)
2. ZopNight queries 30 days of metrics (2-5 seconds)
3. Welford computes stats (sub-second)
4. Smart defaults presented (instant)
5. Customer accepts or edits
6. Customer applies (5-10 seconds — provisioner orchestrates)
7. Cloud-side policy created
8. Policy active

END-TO-END: ~30-60 seconds from "I want autoscaling"
                to "policy is active and managing capacity"
```

The flow is fast by design. Smart defaults remove the friction.

### What the smart defaults set automatically

```
SETTING                          SET TO
─────────────────────────────────────────────────────────
Min capacity                     P05-based (from L2)
Max capacity                     P99 × 1.5 (from L2)
Target value                     P95 - 5% (from L2)
Cooldown                         180s (adjusted by stddev)
Metric                           CPUUtilization (default for compute)
Scaling model                     Target tracking
Mode                              Auto-derived from credential permissions
                                  (monitor / recommend / autopilot)
```

All the calculations from L2 happen automatically.

### Mode auto-derivation

The mode is set based on the IAM credential's permission level:

```
CREDENTIAL TYPE                       AUTO-MODE
─────────────────────────────────────────────────────────
Read-only (Reader role)                monitor
Read-write (Contributor + scaling)     recommend
Full autoscaling permissions           autopilot
```

A team with read-only credentials sees monitor mode automatically. To upgrade to autopilot, they grant the additional scoped-write permissions and the mode upgrades.

### When Quick Setup is enough

About 70% of autoscaler use cases fit Quick Setup defaults:

```
QUICK SETUP FITS:
  Production web tier with target tracking on CPU
  Worker pool with target tracking on queue depth (if queue depth
    is a standard metric)
  ECS service with target tracking
  ASG with predictable load pattern
  Single workload type per policy

ADVANCED MODE NEEDED FOR:
  Multi-metric policies (CPU + latency + queue depth combined)
  Step scaling (specific scale-out steps for spikes)
  Schedule-triggered scaling (time-of-day patterns)
  Custom metrics (application-specific)
  Resource group targeting (scale a group, not single target)
  Multi-tier app coordination
```

When Quick Setup feels too restrictive: switch to Advanced.

### Advanced mode

Same screen, with sections expanded:

```
ADVANCED MODE
─────────────────────────────────────────────────────────
TARGET SETTINGS (same as Quick Setup, plus):
  Resource group target           ✓ if scaling a group of resources
  Custom metric                    ✓ if not CPU
  Memory threshold guard            ✓ if memory-aware
  
SCALING RULES:
  [Target tracking ▾] OR [Step scaling ▾]
  Multiple metrics?               ✓ define each
  Specific scale-out steps         (for step scaling)
  
SCHEDULE TRIGGERS:
  ✓ if time-based scaling
  Preset:                          [Business Hours / Peak / Weekend ▾]
  Cron:                            custom expressions
  
MODE:
  monitor / recommend / autopilot
  (auto-derived but customizable)
```

Advanced is the same surface; smart defaults flow into the same fields. You can fall back to defaults at any time.

### Limited-data handling

For new workloads with minimal metric history:

```
SCENARIO: New service deployed yesterday
  60 minutes of metric data available
  
ZopNight's response:
  Warning: "Only 60 minutes of metrics available"
  Conservative defaults:
    Min: matches current capacity (don't scale below known-good)
    Max: current × 1.5 (conservative ceiling)
    Target: 70% (default; not data-derived)
    Cooldown: 240s (longer; more uncertainty)
    Mode: monitor (until trust is built)
    
PROGRESSIVE TRUST BUILDING:
  Day 1-7: monitor mode; data accumulates
  Day 7-14: re-run smart defaults; switch to recommend mode
  Day 14+: switch to autopilot once defaults stabilize
```

The progressive pattern handles new-service ramp-up safely.

### Mode-switching workflow

```
TYPICAL PROGRESSION:
  
  monitor mode (start):
    Observes; no scaling actions
    Trust building; metrics accumulate
    Duration: 1-2 weeks for new services
    
  recommend mode (build trust):
    Suggests scaling actions in UI
    Engineer clicks Apply or skips
    Duration: 2-4 weeks
    
  autopilot mode (mature):
    Executes scaling actions automatically
    Engineer reviews via dashboard / alerts
    Duration: indefinite (after trust built)
```

The progression is intentional. Don't skip to autopilot from day 1.

### Provisioner orchestration

```
WHEN YOU CLICK APPLY:
  
  1. ZopNight calls cloud provider API:
     AWS: PutScalingPolicy + UpdateASG
     GCP: setAutoscaler
     Azure: PUT autoscaleSettings
     
  2. Cloud creates the policy
  3. Returns success/failure to ZopNight
  4. ZopNight stores policy metadata
  5. UI shows "Policy active"
  
PROVISIONER HANDLES:
  Authentication (using stored cloud credentials)
  Error mapping (cloud error → ZopNight error class)
  Retry on transient errors
  Audit logging
```

The complexity is hidden from the engineer. Just click Apply.

---

## 2. Demo

A team using Quick Setup for a new service:

```
T+0      Service deployed yesterday: 6 EC2 instances behind an ASG
T+5 sec  Navigate to Automation → Policies → New Policy
T+10 sec Quick Setup mode (default)
T+15 sec Pick prod-aws-us-east-1 → asg-new-orders-service
T+20 sec Click "Use smart defaults"
T+30 sec ZopNight queries metrics (60 min of data since deployment)
         
         Warning: Only 60 minutes of metrics available
         Conservative defaults shown:
           Min: 6 (current capacity, since unknown floor)
           Max: 10 (current × 1.5; conservative)
           Target: 70% CPU
           Cooldown: 240s
           Mode: monitor (until trust is built)

T+40 sec Operator accepts. Clicks Apply.
T+50 sec Provisioner orchestrates ASG policy creation
T+60 sec Policy active in monitor mode

PROGRESSION over next 4 weeks:
  Week 1: monitor mode; metrics accumulate
  Week 2: re-run smart defaults; better estimates
          Switch to recommend mode
  Week 4: confidence built; switch to autopilot
          
RESULT after 1 month:
  Stable autopilot operation
  Smart defaults refined to data-driven values
  Engineer rarely touches the policy
```

60 seconds from intent to monitoring. Progressive trust to autopilot.

---

## 3. Hands-on (5 min)

Try Quick Setup in a sandbox:

```
□ STEP 1: Navigate to Automation → Policies → New Policy
  Mode: Quick Setup (default)

□ STEP 2: Pick a target
  Cloud account: __________
  Target: __________

□ STEP 3: Click "Use smart defaults"
  Observe: smart defaults appear
  Note timing: how fast?

□ STEP 4: Review the defaults
  Min: _____
  Max: _____
  Target: ___%
  Cooldown: ___ s
  Mode: __________

□ STEP 5: Cancel (don't commit if sandbox)
  Or apply if you're ready to commit
```

5-minute exercise to internalize the flow. The speed is the feature.

---

## 4. Knowledge check

### Q1
A team has read-only IAM. The Quick Setup mode auto-derived:

A. autopilot
B. monitor (cannot scale, only observe). Mode follows credential capabilities. To upgrade to autopilot, grant additional scoped-write permissions; the mode auto-upgrades.
C. recommend
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Mode follows credential capabilities.
</details>

### Q2
A new service has 60 minutes of metric data. Smart defaults will:

A. Fail
B. Use conservative defaults — small data window means estimates have high uncertainty; the system errs toward conservative min/max/target ranges. Progressive trust building: monitor → recommend → autopilot over weeks.
C. Use defaults anyway (high risk)
D. Wait 30 days

<details>
<summary>Show answer</summary>

**Correct: B.** Limited data → conservative defaults.
</details>

### Q3
After Quick Setup, the policy can be:

A. Only deleted, not edited
B. Edited via the policy detail page. Quick Setup is the create flow; ongoing changes happen on the policy itself. Mode transitions, value tuning, schedule additions — all via policy detail.
C. Replaced
D. Locked

<details>
<summary>Show answer</summary>

**Correct: B.** Policies are first-class entities; editable post-create.
</details>

---

## 5. Apply

Automation → Policies → New Policy is the entry point. Quick Setup is default; Advanced is one toggle away.

For your team: 90% of policies via Quick Setup. Advanced for edge cases. Progressive trust to autopilot.

---

## Related lessons

- [L1 — Scaling policy basics](L1_scaling_policy_basics.md)
- [L2 — Welford stats](L2_welford_stats.md)
- [L4 — Three modes](L4_three_modes.md) *(next)*
- [L5 — Lifecycle](L5_lifecycle.md)
- [L6 — Event log](L6_event_log.md)

## Glossary terms touched

[Quick Setup](../../../reference/glossary/quick-setup.md) · [Advanced mode](../../../reference/glossary/advanced-mode.md) · [Provisioner](../../../reference/glossary/provisioner.md) · [Mode auto-derivation](../../../reference/glossary/mode-auto-derivation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L3
