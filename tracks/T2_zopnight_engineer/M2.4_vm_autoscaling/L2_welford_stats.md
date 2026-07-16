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
INPUTS: 30 days of CPU utilization metrics (~8,640 5-min samples)
OUTPUTS (single-pass Welford):
  CPU average:    avg(values)
  CPU stddev:     online standard deviation
  P90 / P95 / P99: NOT true percentiles. Welford tracks only mean and
                   variance, so the percentiles are a normal-distribution
                   APPROXIMATION: P95 ~= avg + 1.64*stddev,
                   P99 ~= avg + 2.33*stddev (commented "normal approximation"
                   in the code). Accurate for smooth loads; loosest exactly
                   where it matters most, on bursty non-normal workloads.
```

Welford computes mean and variance in a single pass, online, with O(1) memory. This matters because metric data can be large (43,200 samples for 30 days of 1-min resolution). The percentiles above are derived from that mean and variance, not measured directly.

### How the recommendation uses these stats

```
SMART DEFAULT for CPU-driven target tracking (smart_defaults.go):

  Target value:    3-way tier on P95, not "P95 - 5%":
                     P95 > 85%  -> target 70
                     P95 > 60%  -> target 75
                     else       -> target 80
                    (hotter target when the workload already runs hot)

  Min capacity:    derived from cpu.Avg (the average load), NOT P05.
                    P05 is never computed. The floor covers typical demand.

  Max capacity:    max( current + 2,
                        ceil( (current × P99) / target × 1.3 ) )
                    (1.3 headroom for spikes; and never below count + 2)

  Cooldown:        180s default; higher if stddev is high (bursty workload)
```

Each calculation has a rationale rooted in the workload's actual pattern.

### Walk-through example

```
RESOURCE: prod-api ASG
HISTORICAL capacity: 6 (fixed; no autoscaling)

HISTORICAL METRICS (30 days, Welford):
  CPU avg:    45%
  CPU stddev: 15%
  CPU P95:    ~70%   (= 45 + 1.64 x 15, normal approximation)
  CPU P99:    ~80%   (= 45 + 2.33 x 15)

SMART-DEFAULT RECOMMENDATION:
  Target:   P95 (70%) is in (60%, 85%]  ->  75%
  Min:      from cpu.Avg (45%): floor(6 x 0.45 / 0.75) = 3
  Max:      max(6 + 2, ceil(6 x 0.80 / 0.75 x 1.3))
            = max(8, ceil(8.32)) = max(8, 9) = 9
  Cooldown: 240s (higher than default; high stddev = bursty)

RECOMMENDATION:
  Min: 3, Max: 9, Target: 75%, Cooldown: 240s
```

The recommendation handles the workload's actual demand pattern, not an assumed one.

### Why these specific calculations

```
Target = 3-way tier on P95 (70 / 75 / 80)
  Reasoning:
    A hotter workload (high P95) gets a lower target so it scales earlier;
    a cool workload gets a higher target so it does not over-provision.
    The tiers are fixed thresholds, not a P95-minus-margin formula.

Min = floored from cpu.Avg
  Reasoning:
    The AVERAGE load (not a low percentile) sets the floor, so the fleet
    always covers typical demand without constant scale-from-zero churn.

Max = max(count + 2, ceil(count x P99 / target x 1.3))
  Reasoning:
    Headroom for the 1% extremes (1.3x), and never fewer than count + 2
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
    Min:     3     (computed from cpu.Avg)
    Max:     9     (max(count+2, ceil(count × P99 / target × 1.3)))
    Target: 75%    (3-way tier on P95)
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
  Target: 70%       (P95 89% > 85% -> the hot-workload tier picks 70)
  Min:     5        (from cpu.Avg 51%: floor(8 x 0.51 / 0.70) = 5)
  Max:    15        (max(8+2, ceil(8 x 0.97 / 0.70 x 1.3)) = max(10,15) = 15)
  Cooldown: 300s    (high stddev = longer cooldown)

OPERATOR REVIEW:
  Target 70% already suits our latency SLA
    Our p99 latency target is 200ms; 70% CPU leaves headroom
    The hot-workload tier did the right thing automatically
  We do raise Min 5 -> 6 for extra safety margin during peak bursts
  
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
Smart-default target value for CPU-driven target tracking is set by:

A. The mean CPU minus a fixed margin
B. A 3-way tier on P95: >85% picks target 70, >60% picks 75, else 80. A hotter workload gets a lower target so it scales earlier; a cool one gets a higher target to avoid over-provisioning.
C. The peak CPU
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** The target is a fixed 3-tier step on P95 (70 / 75 / 80), not a "P95 minus margin" formula.
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
