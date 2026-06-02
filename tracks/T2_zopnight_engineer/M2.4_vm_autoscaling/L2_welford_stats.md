# Smart defaults — Welford stats explained

§ T2 · M2.4 · L2 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** smart-default recommendations, **explain** the Welford math behind them, **and decide** when to accept or override the recommendation.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand how ZopNight computes smart-default autoscaler values so I can trust and tune them." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.4.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Explain (Understand), Decide (Evaluate) |

---

## 1. Concept

ZopNight's smart-defaults endpoint analyzes a target's historical metrics and recommends min, max, target, and cooldown values. The recommendation is data-driven — not magic — and the math behind it is **Welford's online algorithm** for variance computation.

```
THE PROMISE:
  Engineer doesn't have to know what min/max/target to set
  Smart-defaults compute from actual metrics history
  Output: reasonable starting configuration
  Engineer can accept or override
```

The smart-defaults are good first-pass values. Engineer judgment adds context.

### What Welford computes

```
INPUTS: 30 days of CPU utilization metrics (~1,440 5-min samples)
OUTPUTS:
  CPU average:    avg(values)
  CPU stddev:     online standard deviation
  P90:            90th percentile
  P95:            95th percentile
  P99:            99th percentile
  Min/Max:        smallest and largest values
```

Welford's algorithm computes these in a single pass, online, with O(1) memory. This matters because metric data can be large (43,200 samples for 30 days of 1-min resolution).

### How the recommendation uses these stats

```
SMART DEFAULT for CPU-driven target tracking:

  Target value:    P95 - 5%
                    (scaling triggers before saturation; not during normal use)
                    
  Min capacity:    floor((current capacity × P05) / target_value) + 1
                    (low-percentile load handled by min)
                    
  Max capacity:    ceil((current capacity × P99 × 1.5) / target_value)
                    (P99 × 1.5 headroom for extreme spikes)
                    
  Cooldown:        180s default
                    Higher if stddev is high (bursty workload)
```

Each calculation has a rationale rooted in the workload's actual pattern.

### Walk-through example

```
RESOURCE: prod-api ASG
HISTORICAL capacity: 6 (fixed; no autoscaling)

HISTORICAL METRICS (30 days):
  CPU avg:    42%
  CPU P95:    78%
  CPU P99:    92%
  CPU stddev: 18%

SMART-DEFAULT RECOMMENDATION:
  Target value:  78 - 5 = 73%
  Min:           floor(6 × 5% / 73%) + 1 = 1 (+1 = 2)
  Max:           ceil(6 × 92% × 1.5 / 73%) = 12
  Cooldown:      240s (higher than default; high stddev = bursty)

RECOMMENDATION:
  Min: 2, Max: 12, Target: 73%, Cooldown: 240s
```

The recommendation handles the workload's actual demand pattern, not an assumed one.

### Why these specific calculations

```
Target = P95 - 5%
  Reasoning:
    Targets too high → scaling activates only at saturation → poor latency
    Targets too low → over-provisioning → cost waste
    P95 - 5% = the load level that the workload experiences 5% of the time
    Scaling triggers before saturation but not during normal use

Min = floor based on P05
  Reasoning:
    The lowest 5% of loads inform the floor
    Min should handle those loads without scaling actions firing constantly

Max = ceiling at P99 × 1.5
  Reasoning:
    Headroom for the 1% extremes
    + 50% safety margin for unprecedented spikes

Cooldown adjusted for stddev
  Reasoning:
    Bursty workloads (high stddev) need longer cooldowns to avoid oscillation
    Smooth workloads (low stddev) tolerate shorter cooldowns
```

The math is statistical; the calibration tested across many workloads.

### When to override the smart defaults

Smart defaults are statistical. They miss workload-specific context:

```
CONTEXT THAT SMART DEFAULTS MISS                  ADJUST
─────────────────────────────────────────────────────────────
Known seasonal spike (Black Friday)               Increase max temporarily
Pending traffic event (new product launch)         Increase max ahead of launch
SLA requires 100ms p99 latency                    Lower target (scale earlier)
Workload is stateful with warm-cache restart      Longer cooldown
Workload is stateless and fast to scale            Shorter cooldown
Cost-aggressive tolerance                          Higher target (run hotter)
External integration constraints (e.g., DB pool)   Lower max
Compliance or auditing constraints                  Lower max in regulated tiers
```

The smart-default is the starting point. Tune as workload knowledge grows.

### Performance characteristics

```
WELFORD'S ALGORITHM:
  Time complexity: O(n) (linear in samples)
  Space complexity: O(1) (constant memory)
  
PRACTICAL TIMING:
  30 days of 1-min resolution data (43,200 samples)
  Computation: <100ms
  Total smart-defaults endpoint: 200-500ms
  
SCALES TO:
  Hundreds of targets simultaneously
  Real-time UI response when engineer requests
```

The math is fast; the UX is snappy.

### How to view smart defaults

```
ZopNight UI: Automation → Policies → New Policy → Quick Setup

  Target: select your autoscaling group

  ZopNight queries metrics + computes Welford stats automatically
  Displays:

  SUGGESTED VALUES:
    Min:     2     (computed from P05)
    Max:    12     (computed from P99 × 1.5)
    Target: 73%    (computed from P95 - 5%)
    Cooldown: 240s

  BASED ON:
    30 days CPU metrics
    Avg 42%, P95 78%, P99 92%, stddev 18%

  [Accept]    [Override]    [Cancel]
```

The customer can accept or override before saving.

### Smart defaults vs engineer judgment

```
GOOD COMBINATIONS:
  Smart-default + engineer fine-tune (most common)
  Engineer adjusts 1-2 values; accepts rest
  Result: better than either alone
  
  Smart-default + accept as-is (works for ~60% of cases)
  No tune needed; defaults work
  
  Engineer-only (rarely needed)
  When metrics history insufficient
  Or: very specific external context

POOR COMBINATIONS:
  Engineer-only ignoring smart defaults
  Re-implementing the same statistical analysis manually
  
  Smart-default + override without thinking
  Engineer changes values without considering data
```

The smart-defaults are the starting point. Trust them; tune from there.

---

## 2. Demo

A real recommendation walkthrough:

```
WORKLOAD: production order-processor ASG
  Currently fixed at 8 instances (no autoscaling)
  
METRICS (last 30 days):
  CPU avg:    51%
  CPU P95:    89%
  CPU P99:    97%   ← consistently saturating during peak
  Stddev:     23%   ← high variance (bursty)

SMART DEFAULT RECOMMENDATION:
  Min:     3        (P05-based)
  Max:    15        (97% × 1.5 / 60% target = 14.5 → 15)
  Target: 84%       (89% - 5%)
  Cooldown: 300s    (high stddev = longer cooldown)

OPERATOR REVIEW:
  Target 84% feels too high for our latency SLA
    Our p99 latency target is 200ms
    At 84% CPU, latency creeps up
    Override target to 70% (more headroom)
  
  Max 15 acceptable (we don't have hard ceiling)
  
  Cooldown 300s good (matches workload's burst-pattern)
  
  Min 3 acceptable (HA + fault tolerance)

APPLIED CONFIGURATION:
  Min: 3, Max: 15, Target: 70%, Cooldown: 300s

RESULT (after first week):
  Average instances over week: 6.8 (down from 8 fixed)
  P95 CPU: 78% (within scaling threshold)
  P99 latency: 110ms (within 200ms SLA)
  Cost savings: ~15% vs fixed 8 instances
  Engineer experience: smooth; no manual intervention

LESSONS:
  Smart defaults gave reasonable starting point (~80% optimal)
  Engineer tuning added context (SLA-aware target)
  Final config beats both pure defaults + pure engineer
```

The smart-default + operator judgment produced a better-than-default-or-manual configuration.

---

## 3. Hands-on (5 min)

Configure an autoscaler via smart defaults:

```
□ STEP 1: Open Automation → Policies → New Policy → Quick Setup
  
□ STEP 2: Pick a target
  Target name: __________
  Type: __________

□ STEP 3: Read smart defaults
  Suggested min: _____
  Suggested max: _____
  Suggested target: ___%
  Suggested cooldown: ___ seconds
  Based on metrics: __________

□ STEP 4: Identify override candidates
  Target too high for SLA? __________
  Max too high for cost ceiling? __________
  Cooldown right for workload? __________

□ STEP 5: Apply (or save)
  Final config: __________
  Monitor for: 1 week
```

A 15-minute exercise per workload. Most accept with minor tuning.

---

## 4. Knowledge check

### Q1
Smart-default target value for CPU-driven target tracking:

A. The mean CPU
B. P95 - 5% (scaling triggers before saturation but not during normal use). The load level the workload experiences 5% of the time. Calibrated to balance latency vs cost.
C. The peak CPU
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Target is calibrated to the 5%-of-time load level.
</details>

### Q2
A workload with stddev 23% gets a 300-second cooldown. Why:

A. Random
B. High stddev = bursty workload. Longer cooldown prevents oscillation between scale-up and scale-down on transient metric spikes. Stddev correlates to volatility; volatility requires more cooldown.
C. Cloud requires it
D. Arbitrary choice

<details>
<summary>Show answer</summary>

**Correct: B.** Stddev correlates to volatility; volatility requires more cooldown.
</details>

### Q3
Smart defaults are a starting point. They miss:

A. Specific cloud regions
B. Workload-specific context — seasonal spikes, SLA latency requirements, stateful warmup, traffic events, compliance constraints. Statistics don't know about external context. Operators add it through judgment.
C. Math
D. Nothing

<details>
<summary>Show answer</summary>

**Correct: B.** Statistics don't know external context; operators add it.
</details>

---

## 5. Apply

Smart defaults exposed in Automation → Policies → New Policy → Quick Setup flow. Customer can override before saving.

For your team: trust smart defaults as starting point; tune for SLA + business context; document the rationale.

---

## Related lessons

- [L1 — Scaling policy basics](L1_scaling_policy_basics.md)
- [L3 — Quick setup](L3_quick_setup.md) *(next)*
- [L4 — Three modes](L4_three_modes.md)
- [L5 — Lifecycle](L5_lifecycle.md)
- [L6 — Event log](L6_event_log.md)

## Glossary terms touched

[Welford's algorithm](../../../reference/glossary/welfords-algorithm.md) · [Smart defaults](../../../reference/glossary/smart-defaults.md) · [P95 target](../../../reference/glossary/p95-target.md) · [Stddev-based cooldown](../../../reference/glossary/stddev-based-cooldown.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L2
