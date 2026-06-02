# What a scaling policy actually is

§ T2 · M2.4 · L1 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** target-tracking from step scaling, **identify** the right model for a workload, **and configure** the four key parameters (min, max, metric, cooldown).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Design autoscaling policies that match actual workload patterns — not over-provision and not under-respond." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | T0.M0.1 (cloud basics) · M2.1 (rule library) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Identify (Apply), Configure (Apply) |

---

## 1. Concept

A scaling policy tells the cloud's autoscaler when to add or remove capacity. ZopNight manages four target types: AWS ASG, AWS ECS service, Azure VMSS, GCP MIG.

```
THE FOUR ZopNight-SUPPORTED TARGETS:
  AWS ASG               (Auto Scaling Group)
  AWS ECS service       (via Application Auto Scaling)
  Azure VMSS            (Virtual Machine Scale Set)
  GCP MIG               (Managed Instance Group)

Each has cloud-specific API; ZopNight abstracts to a common model.
```

The scaling policy = the contract between the workload's load and the cloud's response.

### Two scaling models

```
TARGET TRACKING (most common):
  Pick a metric and a target value
  Autoscaler adjusts capacity to keep metric at target
  
  target_tracking:
    metric:        CPUUtilization (or memory, request count, custom)
    target_value:  60%
    cooldown:      120 seconds
  
  Behavior:
    Metric > 60%: add instances
    Metric < 60%: remove instances
    Autoscaler picks the exact count adjustment
  
  BEST FOR: smooth scaling needs, set-and-forget
```

```
STEP SCALING (more configurable):
  Multiple thresholds with specific adjustments
  
  step_scaling:
    metric: CPUUtilization
    scale_out_steps:
      if 70% ≤ metric < 80%: +1 instance
      if 80% ≤ metric < 90%: +3 instances
      if metric ≥ 90%:       +5 instances
    scale_in_steps:
      if 30% < metric ≤ 40%: -1 instance
      if metric ≤ 30%:       -3 instances
  
  Behavior:
    Precise capacity changes per threshold band
    Aggressive scale-out when high load
    Conservative scale-in
  
  BEST FOR: bursty workloads, rapid scale-out matters
```

Most workloads: target-tracking. Reserve step-scaling for specific spike patterns.

### Provider-specific implementations

```
PROVIDER     TARGET TYPE         IMPLEMENTATION
─────────────────────────────────────────────────────────
AWS          ASG                 EC2 Auto Scaling SDK
                                  PutScalingPolicy + UpdateASG
                                  
AWS          ECS service         AWS Application Auto Scaling SDK
                                  RegisterScalableTarget + PutScalingPolicy
                                  
Azure        VMSS                Autoscale Settings API
                                  (FixedDate or recurrence)
                                  
GCP          MIG                 Autoscaler API
                                  CPU utilization target, min/max/cooldown
```

Each cloud's API is different in vocabulary, but the underlying concept is the same: a policy maps a metric to capacity changes.

### Anatomy of a ZopNight autoscaler policy

```
NAME:         payments-api-prod-autoscale

TARGET:
  Provider:   aws
  Type:       asg
  Cloud ID:   asg-prod-payments-api
  Region:     us-east-1
  
CAPACITY:
  Min:        4
  Max:        20
  Desired:    8 (or autoscaler chooses)
  Cooldown:   120s
  
TRIGGER:
  Type:       target_tracking
  Metric:     CPUUtilization
  Target:     60%
  
SOURCE:       recommended (ZopNight owns this policy)
MODE:         autopilot
STATUS:       active
```

Six conceptual fields. The provider-specific cloud action translates these.

### Min, max — the safety bounds

```
MIN CAPACITY = the FLOOR
  Below this, autoscaler won't scale in
  Guarantees minimum availability
  
  EXAMPLE: payments-api needs 4 tasks for fault tolerance
    Min: 4
    Even at off-peak: stays at 4 tasks minimum
  
MAX CAPACITY = the CEILING
  Above this, autoscaler won't scale out
  Bounds cost; prevents runaway scaling
  
  EXAMPLE: payments-api can burst to 20 tasks
    Max: 20
    Misconfigured load test cannot balloon to 200
```

The bounds are the safety contract. Set thoughtfully.

### Cooldown — preventing oscillation

```
COOLDOWN = minimum interval between scaling actions
  Prevents rapid scale-up + scale-down oscillation
  
  WITHOUT cooldown:
    T+0:    CPU = 75%; scale out
    T+10s:  CPU = 50% (new instances came online)
    T+10s:  Autoscaler considers scale-in
    T+20s:  CPU = 70% (scale-in returned load)
    T+20s:  Autoscaler scales out again
    ...
    Instances thrash; cost balloons; uncomfortable for app
  
  WITH 120s cooldown:
    T+0:    CPU = 75%; scale out
    T+10s:  CPU = 50% (but cooldown blocks scale-in)
    T+120s: Cooldown over; CPU evaluated
    T+120s: CPU stable at 60%; no action
    
  Stable; cost-controlled
```

Default: 120 seconds. Workloads with longer warmup may need 180-300s.

### What metric to use

```
WORKLOAD                    METRIC                          NOTES
──────────────────────────────────────────────────────────────────
Web API                      CPU or request count            Request count
                                                              avoids CPU
                                                              saturation issues
                                                              
Worker pool                  Queue depth                     Direct workload signal
                                                              (best practice for
                                                              async work)
                                                              
Compute-bound batch          CPU                             Standard
                                                              
Memory-bound                 Memory utilization              Requires agent
                                                              (M2.2.L1)
                                                              
Multi-tier app               Custom CloudWatch metric        Application-aware
                                                              Request latency,
                                                              error rate

Mixed workload                Multiple metrics                Step-scaling fits
                                                              well here
```

Pick the metric that most directly reflects "this resource is at capacity."

### Common configuration mistakes

```
MISTAKE                              FIX
──────────────────────────────────────────────────────────────────
Min too low (1)                      Set min to reflect HA + fault tolerance
For prod APIs: 3-4 minimum            
                                      
Max too high (1000)                   Cap based on actual peak needs
Misconfigured load test risk          + 50% headroom

Wrong metric (CPU for queue worker)   Use queue depth for queue workers
                                      Direct signal beats inferred

Cooldown too short (30s)              Default 120s; longer for slow warmup

Target too high (90% CPU)             Set 60-70%; allows scaling headroom

Target too low (30% CPU)              Constant over-provisioning
                                      Set 60-70% sweet spot

No autoscaling (static count)         Add policy; adapt to load
                                      Save cost off-peak
```

Most autoscaler issues are configuration mistakes, not autoscaler bugs.

### How autoscaler integrates with schedules (M5.2)

```
SCHEDULE controls min/max bounds:
  Off-hours: min=1, max=4
  Business hours: min=4, max=20
  
AUTOSCALER scales within bounds:
  Off-hours: actual count 1-3 based on metric
  Business hours: actual count 4-12 based on metric

COMBO EFFECT:
  Schedule provides cost-aware bounds
  Autoscaler provides workload-aware adjustment
  Together: optimal cost + responsive capacity
```

The combo (M2.4 + M5.2) is the sweet spot for most workloads.

### Cost impact of a well-configured autoscaler

```
WORKLOAD: 24/7 production API (m5.large instances)

WITHOUT AUTOSCALING (fixed 4 instances):
  4 × m5.large × 730 hr × $0.096 = $280/mo
  Avg CPU: 35% (over-provisioned 65% of time)

WITH AUTOSCALING (min 3, max 12, target 60% CPU):
  Off-hours (16h × 7d): avg 3 instances
  Business hours (8h × 5d): avg 6 instances
  Average over month: ~4.5 instances
  Cost: 4.5 × 730 × $0.096 = $316/mo
  
  Wait, that's HIGHER. Why?
  
  Because the autoscaler responds to load; load is real
  Without autoscaling: 4 instances handle peak with degradation
  With autoscaling: 6+ instances handle peak with margin
  
ACTUAL VALUE:
  Better availability during peaks
  Lower latency
  Less risk of outages
  Cost stays comparable

REAL COST SAVINGS come from:
  Schedule bounds (off-hours min=1 instead of 3)
  This requires combining with M5.2 schedules
  Together: 30-50% savings on capacity
```

Autoscaler alone doesn't always save cost — it shifts cost to match load. Schedules + autoscaler is the savings combination.

---

## 2. Demo

A typical policy:

```
WORKLOAD: stripe-payments-api (production, 24/7)

CURRENT STATE (without scaling policy):
  4 EC2 m5.large instances in ASG, fixed
  CPU avg: 38%, peak: 89% during sales hours
  Cost: $312/month, but over-provisioned at 38% avg

WITH SCALING POLICY (target tracking):
  Min: 3, Max: 12, Target: 60% CPU
  Cooldown: 180 seconds (give 3 min for instances to warm up)
  
  Behavior:
    Off-hours: autoscaler scales in to 3 (~$234/mo at floor)
    Business hours: autoscaler scales 4-8 typically
    Peak: bursts to 10-12 during sales spikes
    
  Cost result: ~$278/mo average
  Improvement: 11% savings + better availability during peaks
  Engineer experience: noticeable improvement (less manual scaling)
```

The policy reshapes the cost curve to match actual demand. Cost-aware + responsive.

---

## 3. Hands-on (5 min)

Audit an autoscaler policy in your estate:

```
□ STEP 1: Open Automation → Policies
  Find an existing autoscaler policy
  Or: pick a non-autoscaled workload for analysis

□ STEP 2: Note current configuration
  Target: __________
  Type: target_tracking / step_scaling
  Metric: __________
  Target value: ___%
  Min capacity: _____
  Max capacity: _____
  Cooldown: _____ seconds

□ STEP 3: Cross-check with actual load
  CPU avg: ___%
  CPU peak: ___%
  Current capacity: _____
  Is min/max sized appropriately?

□ STEP 4: Identify tuning
  □ Min too low (HA risk)
  □ Max too high (cost risk)
  □ Target too high (latency risk)
  □ Cooldown too short (oscillation)
  
□ STEP 5: Plan changes
  Proposed config: __________
  Expected outcome: __________
```

15 minutes per policy. Quarterly audit keeps autoscalers healthy.

---

## 4. Knowledge check

### Q1
For a workload with smooth scaling needs and a clear single metric (CPU), the right model is:

A. Step scaling
B. Target tracking — set CPU = 60%, autoscaler maintains. Simplest correct configuration; default for smooth workloads. Step-scaling reserved for specific spike patterns.
C. Manual scaling
D. No scaling

<details>
<summary>Show answer</summary>

**Correct: B.** Target tracking is the default for smooth workloads.
</details>

### Q2
A workload's min capacity is set to 4. CPU drops to 5% during off-hours. The autoscaler:

A. Scales to 1
B. Stays at 4 — the floor prevents scaling below the configured minimum. Min is the structural HA / availability floor. Set thoughtfully.
C. Throws an error
D. Scales to 0

<details>
<summary>Show answer</summary>

**Correct: B.** Min is the structural floor.
</details>

### Q3
A scaling policy with no cooldown sees rapid scale-up + scale-down oscillation. The fix:

A. Disable the policy entirely
B. Set cooldown to 120-180s. Prevents oscillation between scale-up and scale-down on transient metric spikes. Cooldown is the stability lever.
C. Increase max capacity
D. Decrease min capacity

<details>
<summary>Show answer</summary>

**Correct: B.** Cooldown is the stability lever.
</details>

---

## 5. Apply

Automation → Policies is the canonical surface for autoscaler management.

For your team: quarterly autoscaler audit; tune per workload; combine with M5.2 schedules for savings.

---

## Related lessons

- [L2 — Welford stats](L2_welford_stats.md) *(next)*
- [L3 — Quick setup](L3_quick_setup.md)
- [L4 — Three modes](L4_three_modes.md)
- [L5 — Lifecycle](L5_lifecycle.md)
- [L6 — Event log](L6_event_log.md)
- [M5.2 — Schedule patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Scaling policy](../../../reference/glossary/scaling-policy.md) · [Target tracking](../../../reference/glossary/target-tracking.md) · [Step scaling](../../../reference/glossary/step-scaling.md) · [Cooldown](../../../reference/glossary/cooldown.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L1
