# What Event Readiness solves

§ T2 · M2.9 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** Event Readiness from reactive autoscaling, **identify** which events warrant pre-scaling, **and recognize** when the 5-minute ramp-up gap matters.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pre-scale infrastructure for predictable traffic events — eliminate the autoscaler ramp-up gap that costs customers latency during peaks." |
| **Personas** | Platform Engineer · SRE · Site Reliability |
| **Prerequisites** | M2.4 (VM autoscaling) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Identify (Apply), Recognize (Apply) |

---

## 1. Concept

For predictable traffic events (Black Friday, marketing launches, product announcements), reactive autoscaling reacts AFTER traffic arrives. By then, customers may have experienced poor performance during the ramp-up. Event Readiness pre-scales BEFORE the event, eliminating the ramp-up gap.

```
THE PROBLEM:
  Reactive autoscaling has a 5-minute lag
  During lag: capacity saturated; customers feel pain
  
  For unpredictable events: no choice but reactive
  For PREDICTABLE events: we can do better
  
THE SOLUTION:
  Define the event in ZopNight
  Pre-scale BEFORE the event start
  Run at event capacity through the event
  Scale back after
  
  Zero ramp-up gap; smooth customer experience
```

The trade-off is cost (pre-scaled capacity costs money before traffic arrives).

### The reactive autoscaling problem

```
TIMELINE during Black Friday (reactive only):

T+0       Traffic starts ramping up
T+0       Existing capacity: 12 instances
T+1 min   CPU hits 80% (autoscaler trigger threshold)
T+1 min   Autoscaler triggers scale-out
T+1 min   3 new instances launching
T+3 min   New instances reaching ready state
T+5 min   New instances healthy and serving
T+5 min   Capacity catches up to traffic

DURING T+0 to T+5 min window:
  Existing capacity (12 instances) at 100%+ CPU
  P99 latency spikes 3-5x
  Some users see degraded experience
  Possibly: some traffic dropped or queued
  
COST OF THE 5-MIN GAP:
  Lost orders (some customers bounce)
  Latency-correlated lower conversions
  Bad customer reviews / support tickets
  Brand impact for high-profile events
```

The 5-minute gap is the problem. Event Readiness eliminates it.

### How Event Readiness works

```
PHASE 1 — PRE-EVENT (days before)
  Define the event in ZopNight: date, scope, expected multiplier
  ZopNight calculates capacity needs
  Customer reviews + approves
  
PHASE 2 — EVENT START (e.g., 1 hour before peak traffic)
  ZopNight pre-scales the infrastructure:
    Increases ASG min/max
    Pre-warms instance pools
    Scales databases (monitor-only — see L4)
  Pre-warm completes BEFORE traffic arrives
  
PHASE 3 — EVENT DURATION (event period)
  Infrastructure is at event capacity
  Traffic arrives; no ramp-up gap
  Performance stays smooth
  
PHASE 4 — EVENT END (e.g., 1 hour after expected peak)
  ZopNight scales back down to normal
  Cost returns to baseline
  Audit log captures the full lifecycle
```

The event window is treated as a special schedule: pre-warm, run at capacity, scale back.

### What gets pre-scaled

```
TARGETS THAT GET PRE-SCALED (automatic):
  ASG (AWS):                 scale_out to event capacity
  ECS service:               desired_count to event capacity
  GCP MIG:                    target_size to event capacity
  Azure VMSS:                 capacity to event capacity
  Lambda concurrency:         provisioned concurrency increased
  Instance pools:             pre-warm to event capacity

TARGETS THAT ARE MONITORED-ONLY (see L4):
  Databases (RDS, Cosmos, etc.):
    No automated mutation
    Recommendations surface for customer to act manually
    Customer scales DB on their own (because data risk)
```

The asymmetry is intentional: compute is auto-scaled; data is human-scaled. (Recall M2.3.L5 — database denylist.)

### Event Readiness vs scheduling

```
SCHEDULING                       EVENT READINESS
─────────────────────────────────────────────────────────
Recurring (daily, weekly)         One-time event
Cron-driven                       Datetime-driven (event start/end)
Stops at end (off-hours)          Scales back at end (resume normal)
For non-prod                       For prod traffic events
Saves money                        Costs money temporarily
Off → On                           Normal → Higher → Normal
```

The two layers complement. Most teams have both: schedules for non-prod, Event Readiness for one-off events.

### When Event Readiness matters

```
EVENT TYPE                      USE EVENT READINESS?
─────────────────────────────────────────────────────
Product launch                    YES — large predictable spike
Black Friday                       YES — predictable annual spike
Marketing email blast              YES — known time, known multiplier
Newsletter send                    YES — small but known burst
Load test                          YES — for the test duration
Geo-rollout                        YES — predictable per-region spike
TV ad spot                         YES — known timing
Conference / event broadcast        YES — known traffic window
Random viral moment                 NO (can't predict; reactive autoscale)
Daily peak hours                   NO (use Peak Hours preset)
Steady traffic growth              NO (autoscaler handles)
```

The principle: Event Readiness wins when the event is predictable.

### Cost of Event Readiness

```
EXAMPLE: Black Friday event for 24 hours
  Normal capacity: 12 instances ($24/day)
  Event capacity: 36 instances ($72/day)
  Cost during event: $72 (3x normal)
  Cost above baseline: $48
  
  Total cost of pre-scaling: $48
  Plus 1 hour pre-warm: $4
  Plus 1 hour buffer scale-down: $4
  Total event cost: $56
  
VALUE:
  Lost orders prevented: typically $50K-$500K
  Customer experience preserved: priceless
  Brand impact avoided: significant
  
ROI: usually >100x for major events
```

The cost is real but small relative to the value.

### Cost monitoring during event

```
ZopNight provides:
  Live cost tracker during event
  Estimated remaining event cost
  Comparison to baseline
  Recommendations for adjustments
  
EXAMPLE during event:
  Current spend rate: $72/hr (vs $24/hr baseline)
  Estimated event total: $1,728 (24 hours)
  Time remaining: 6 hours
  
  If traffic lower than expected: can scale back early
  If traffic higher: can scale up
  Real-time adaptation
```

The cost transparency during the event allows mid-event tuning.

---

## 2. Demo

A team's Black Friday preparation:

```
EVENT: Black Friday 2026
SCOPE: production checkout service + product API + database tier

PLANNING (October — 5 weeks ahead):
  Define event in ZopNight:
    Date: November 28, 00:00 - 23:59 UTC
    Scope: production-prod-checkout group + production-prod-api group
    Expected multiplier: 3x normal capacity
    Pre-warm: 1 hour
    Scale-down buffer: 1 hour

CAPACITY CALCULATION:
  Current capacity: 12 instances
  Expected: 36 instances (3x)
  Adjustment: round up to 40 for buffer
  
COST ESTIMATE:
  ZopNight quotes $4,200 additional for the 24-hour event window
  Customer approves

NOVEMBER 27 23:00 UTC (1 hour before event):
  ZopNight pre-scales:
    ASG-checkout: scale to 40 instances
    ASG-api: scale to 60 instances
  Pre-warm 40 + 60 = 100 instances over ~10 minutes
  Database tier: monitored-only; team adjusted manually beforehand

NOVEMBER 28 00:00 - 23:59 UTC (event):
  Traffic arrives
  P99 latency: 110ms (normal)
  Capacity utilization: 75% (healthy)
  No degradation during traffic ramp
  Conversion rate: stayed at expected level

NOVEMBER 28 23:59 UTC (event ends):
  Autoscaler scales back to baseline
  Cost returns to normal
  Audit log captures full lifecycle

RESULT:
  $4,200 spent on pre-scaling
  ~$300K of customer orders processed without issues
  Customer experience: smooth
  Engineering team: confident
  ROI: 70:1
```

Pre-scaling cost is real but worth it for the customer experience.

---

## 3. Hands-on (5 min)

Plan a hypothetical event:

```
□ STEP 1: Identify upcoming event
  Event: __________
  Date: __________
  Duration: __________

□ STEP 2: Estimate traffic multiplier
  Normal traffic: __________
  Expected event traffic: __________
  Multiplier: ___x

□ STEP 3: Identify scope
  Affected workloads: __________
  Database tier: __________

□ STEP 4: Calculate capacity needs
  Current capacity: __________
  Event capacity needed: __________
  Buffer: __________

□ STEP 5: Estimate cost
  Normal cost: $_____
  Event cost: $_____
  Additional cost: $_____
  Estimated value of preventing latency spike: $_____
```

A 20-minute exercise reveals the math. Most events: ROI strongly favors pre-scaling.

---

## 4. Knowledge check

### Q1
Reactive autoscaling vs Event Readiness:

A. Same thing
B. Reactive triggers after traffic hits the saturation threshold (5-min lag). Event Readiness pre-scales before. Use both: reactive for unexpected, Event Readiness for known events. Complementary, not competing.
C. Random
D. Different cloud providers

<details>
<summary>Show answer</summary>

**Correct: B.** Complementary.
</details>

### Q2
A team has a marketing launch in 3 weeks. The right approach:

A. Trust reactive autoscaling
B. Use Event Readiness — define the event, pre-scale 1 hour before, scale back 1 hour after. Eliminates the 5-minute ramp-up gap for known events. Predictable events warrant pre-scaling.
C. Manual escalation
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Predictable events warrant Event Readiness.
</details>

### Q3
A viral moment causes unexpected traffic. Best approach:

A. Event Readiness (define event)
B. Reactive autoscaling — viral events are by definition unpredictable. Event Readiness can't pre-schedule. The 5-min lag is unavoidable but rare.
C. Manual
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Reactive handles unpredictable.
</details>

---

## 5. Apply

Event Readiness at Automation → Event Readiness. Define events, calculate capacity, approve, schedule.

For your team: identify upcoming predictable events; use Event Readiness for them.

---

## Related lessons

- [L2 — Capacity models](L2_capacity_models.md) *(next)*
- [L3 — Lifecycle](L3_lifecycle.md)
- [L4 — Database monitor-only](L4_db_monitor.md)
- [L5 — Cost estimate](L5_cost_estimate.md)
- [M2.4 — VM autoscaling](../M2.4_vm_autoscaling/00_README.md)

## Glossary terms touched

[Event Readiness](../../../reference/glossary/event-readiness.md) · [Reactive autoscaling gap](../../../reference/glossary/reactive-autoscaling-gap.md) · [Pre-scaling](../../../reference/glossary/pre-scaling.md) · [Predictable event](../../../reference/glossary/predictable-event.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.9.L1
