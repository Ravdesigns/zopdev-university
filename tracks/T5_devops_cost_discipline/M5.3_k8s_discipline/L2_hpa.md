# HPA — the signal it gives you

§ T5 · M5.3 · L2 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** HPA signals to identify right-sizing opportunities, **diagnose** the four common HPA patterns (at-min, at-max, oscillating, balanced), **and tune** HPA settings based on observed behavior.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Read what HPA is telling me — am I over-provisioned, under-provisioned, or just right?" |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M5.3.L1 (requests/limits) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Understand), Diagnose (Analyze), Tune (Apply) |

---

## 1. Concept

HPA (Horizontal Pod Autoscaler) automatically scales pod replicas based on CPU, memory, or custom metrics. Beyond the autoscaling itself, HPA's *history* tells you about workload demand — and reveals right-sizing opportunities you'd miss otherwise.

```
HPA STATUS shows:
  Current replicas       (how many running now)
  Desired replicas       (what HPA wants)
  Min / max settings     (bounds you set)
  Current resource usage vs target
  ScalingLimited condition (if any — important!)
  
HPA HISTORY (over 30 days) shows:
  How often at min      (over-provisioned at min if always there)
  How often at max      (under-provisioned at max if always there)
  Oscillation pattern   (bursty workload signal)
  ScalingLimited events (capacity constraint signal)
```

The history is the goldmine. The current state is a snapshot; the history is a diagnosis.

### The "ScalingLimited" condition — the strongest signal

```
ScalingLimited = HPA wants to scale but can't (typically hit max)

EXAMPLE:
  HPA target: 70% CPU
  Workload at: 95% CPU (clearly above target)
  HPA wants to scale OUT to handle the load
  But: pod count at max (e.g., 10)
  HPA stuck at 10 replicas; ScalingLimited fires
  
This is a strong signal:
  Workload is UNDER-provisioned at max
  Either increase max replicas
  Or right-size pods up (bigger pods = fewer needed)
```

ScalingLimited events should be near zero. Any frequency >once/week = under-provisioning.

### Four common HPA patterns

```
PATTERN 1 — STUCK AT MIN
  HPA at minimum replicas for >50% of the time
  CPU below target most hours
  
  DIAGNOSIS: Min too high
  WORKLOAD: Over-provisioned at the low end
  ACTION: Reduce min replicas
  COST IMPACT: 20-40% savings on low-traffic hours
  
PATTERN 2 — STUCK AT MAX
  HPA at maximum replicas for >20% of the time
  ScalingLimited events frequent
  CPU at or above target
  
  DIAGNOSIS: Max too low OR pods too small
  WORKLOAD: Under-provisioned at the high end
  ACTION: Increase max OR right-size pods up
  COST IMPACT: maybe higher cost; lower latency / better UX
  
PATTERN 3 — OSCILLATING (rapid scale up/down)
  HPA replica count changing >5×/hour
  Constant scale up → scale down → scale up cycle
  
  DIAGNOSIS: Bursty workload; HPA reacting to peaks
  WORKLOAD: Spiky but autoscaler can keep up
  ACTION: Increase scaling stabilization window
          OR set target higher (less sensitive)
          OR add KEDA / custom metrics for predictive scaling
  COST IMPACT: thrash creates churn; smoothing reduces wasted scaling
  
PATTERN 4 — BALANCED (healthy)
  HPA at desired ≈ current always
  Replica count varies smoothly with load
  Rarely at min or max
  
  DIAGNOSIS: Workload matches target well
  ACTION: No action needed; maintain current settings
  COST IMPACT: Optimal
```

Most workloads in unmaintained clusters: 30% Pattern 1, 10% Pattern 2, 10% Pattern 3, 50% Pattern 4. Tuning the first three categories captures the savings.

### Investigation pattern

ZopNight surfaces HPA signals automatically:

```
ZopNight HPA Recommendations:
  Filter: K8s workload type
  Sort by: HPA-derived recommendation impact
  
RECOMMENDATIONS surface as:
  
  "Workload spent 18 hrs/day at min" 
  → Consider reducing min replicas
  → Estimated savings: $X/mo
  
  "Workload hit ScalingLimited 47 times in past week"
  → Consider increasing max OR right-sizing pods up
  → Risk: latency or pod evictions during spikes
  
  "Workload oscillating between 4 and 10 replicas, 50+ events/day"
  → Consider scaling stabilization window
  → Or: predictive scaling via KEDA
```

Each recommendation comes with the evidence (the HPA history) for the engineer to verify before applying.

### HPA + scheduling interaction

```
WHEN HPA AND SCHEDULE BOTH ACTIVE:
  Schedule sets the replica RANGE (min, max)
  HPA scales WITHIN that range based on metrics

EXAMPLE:
  Schedule: BUSINESS HOURS — min=4, max=12
  Schedule: OFF-HOURS    — min=1, max=4
  HPA: targets 70% CPU
  
  During business hours: HPA scales 4-12 based on CPU
  During off-hours: HPA scales 1-4 based on CPU
  
COMBINED EFFECT:
  Schedule provides the floor (cost control)
  HPA provides the dynamic adjustment (responsiveness)
  
  Together: low cost during off-hours, full capacity during peaks
```

The combo is the cost+performance sweet spot for most workloads.

### HPA's limitations

```
HPA SCALES POD COUNT, NOT POD SIZE
  If pods need more memory: HPA can't help
  Need to adjust resource requests/limits manually
  Or: VPA (Vertical Pod Autoscaler) — separate tool
  
HPA SCALES BASED ON METRICS YOU PROVIDE
  CPU: standard, always available
  Memory: often needs custom metric setup
  Custom metrics (queue depth, request rate): need configuration
    Tools: Prometheus Adapter, KEDA
  
HPA HAS LATENCY
  Detection: ~30 seconds
  Scale-up: 30-60 seconds typically
  For sub-second spike response: HPA isn't fast enough
  Use over-provisioning + queue-based load shedding for ultra-low-latency
```

HPA is the workhorse for replica scaling, but it's not a panacea. Pair with right-sizing (L1), schedules (M5.2), and custom metrics where needed.

### Common HPA mistakes

```
MISTAKE                                  FIX
──────────────────────────────────────────────────────────────────
Setting min replicas too high            Measure off-peak utilization
"Just in case" thinking                  Reduce min until off-peak
                                          is healthy (CPU 30-60%)
                                          
Setting max replicas too low             Watch for ScalingLimited
Limits scale-out during real spikes      events; increase max
User impact during peaks                 OR right-size pods up
                                          
Wrong target value (too high)            Target at 80% → scaling near
e.g., 80%                                saturation; latency suffers
                                          Set 65-70% for most workloads
                                          
Wrong target value (too low)             Target at 30% → constantly
e.g., 30%                                over-provisioned
                                          Set higher; only go low for
                                          extremely latency-sensitive
                                          
Custom metric mis-configured             Verify metric in Prometheus
("queue depth" reports wrong)            BEFORE relying on HPA action
                                          
HPA + autoscaler not coordinated         Cluster autoscaler scales nodes
HPA scales pods but no nodes              Both must be configured
                                          See your cluster setup
```

The fixes are mostly observational + iterative. Set, measure, tune.

### Tuning HPA — concrete process

```
QUARTERLY HPA TUNING (per workload):

WEEK 1 — MEASURE
  Pull 30 days of HPA history
  Categorize: stuck-at-min / stuck-at-max / oscillating / balanced
  Quantify: % time at extremes, scaling event count

WEEK 2 — DIAGNOSE
  For each non-balanced workload:
    Identify the issue (too high min, too low max, etc.)
    Estimate cost impact of fixing

WEEK 3 — APPLY
  Pick top 3 highest-impact tunings
  Update HPA spec (kubectl apply)
  Monitor for 1 week

WEEK 4 — VERIFY
  Confirm pattern moved toward balanced
  Confirm no degradation (latency, error rate, OOM)
  Document changes
```

A workload running smoothly for 6 months still benefits from this review — traffic patterns change.

---

## 2. Demo

A real HPA tuning case:

```
WORKLOAD: order-processor (e-commerce, payment-team)
HPA SETTINGS: min=4, max=12, target=70% CPU

OBSERVATIONS OVER 30 DAYS:

  Replica count distribution:
    At 4 replicas (min):  62% of time (overnight + low-traffic)
    At 5-7 replicas:       28% of time (normal business hours)
    At 8-10 replicas:       9% of time (peak times)
    At 11-12 replicas:      <1% of time
    ScalingLimited events:  0

  CPU utilization:
    Daily avg: 38%
    Daily p95: 62%
    Daily p99: 78%

DIAGNOSIS:
  PATTERN 1 — STUCK AT MIN (62% of time)
    Min too high: 4 replicas pinned during off-peak
    Each replica at ~25% CPU during off-peak
    Waste: 4 replicas × 75% unused capacity = 3 replica-equivalents wasted
    
  Max also too high: never reached 12
    Could reduce max to 10 without losing capacity
    
RECOMMENDATIONS:
  Reduce min from 4 to 2
    Off-peak: 2 replicas handle the light load
    HPA scales up to 4-7 during business hours as needed
  Reduce max from 12 to 10
    Never used 12; 10 is comfortable peak
  Keep target at 70%
    p95 CPU 62% within target; healthy

COST IMPACT:
  Each replica: ~$0.04/hr
  Off-peak window: ~14 hrs/day (62% of 24)
  Savings per day: 2 replicas saved × 14 hrs × $0.04 = $1.12
  Monthly savings: $1.12 × 30 = $34/mo per workload
  
  Doesn't sound huge BUT scales across:
    18 workloads with similar pattern: ~$612/mo = $7,344/yr

DEPLOYMENT:
  Update HPA spec:
    minReplicas: 2
    maxReplicas: 10
    target: 70% (unchanged)
  
  Monitor: 2 weeks
    Verify off-peak CPU stays healthy (<80%)
    Verify business hours scaling reaches 4-7 as expected
    Watch for any latency degradation

VERIFICATION (after 2 weeks):
  Off-peak CPU at 2 replicas: 65% (healthy)
  Business hours scaling: 4-6 replicas typical (matches old)
  No latency change
  Saved: $34/mo as projected
  
DECISION: roll out pattern to other 17 similar workloads
          (similar low-utilization-at-min pattern)
```

The pattern compounds. Quarterly review across cluster: $5K-15K/year savings typical.

---

## 3. Hands-on (5 min)

Audit one of your HPA-managed workloads:

```
□ STEP 1: Pick a workload
  Workload: __________
  Current min: ___ max: ___ target: ___%

□ STEP 2: Pull HPA history (30 days)
  $ kubectl describe hpa <workload>
  OR: ZopNight K8s detail view
  
  Time at min: _____ % of period
  Time at max: _____ % of period
  ScalingLimited events: _____

□ STEP 3: Classify pattern
  □ Stuck at min (>50% time)
  □ Stuck at max (>20% time)
  □ Oscillating (>5 events/hr)
  □ Balanced

□ STEP 4: Plan tuning
  Action: __________
  Estimated savings: $_____/mo

□ STEP 5: Apply + observe
  Apply: __________
  Monitor for: ___ days
  Verification metric: __________
```

A 15-minute audit per workload reveals patterns. Address top 3 each quarter.

---

## 4. Knowledge check

### Q1
HPA "ScalingLimited" condition firing frequently:

A. Bug
B. Signal that HPA wanted to scale but couldn't (typically hit max). Strong indicator of under-provisioning at the high end. Real recommendation: increase max OR right-size pods up. Don't ignore ScalingLimited — it correlates with user-visible latency.
C. Random
D. Successful scaling

<details>
<summary>Show answer</summary>

**Correct: B.** Indicates capacity constraint; latency-impacting.
</details>

### Q2
A workload at min replicas for 62% of time (18 hrs/day):

A. Optimal — that's autoscaling working
B. Likely over-provisioned at the min. Reduce min to lower the off-peak baseline. Save 20-40% of pod cost during off-peak. Verify off-peak CPU stays healthy after reduction.
C. Random
D. Increase min

<details>
<summary>Show answer</summary>

**Correct: B.** Reduce min; save off-peak cost.
</details>

### Q3
HPA target value of 80% CPU:

A. Conservative; safe
B. Aggressive — scaling triggers near saturation. Latency suffers because pods are already near their limit when HPA finally decides to scale. Set target 65-70% for most workloads (more headroom during scaling delay).
C. Random
D. Optimal

<details>
<summary>Show answer</summary>

**Correct: B.** Lower target for scaling headroom.
</details>

---

## 5. Apply

Review HPA settings + history quarterly. ZopNight recommendations highlight under/over-provisioning patterns. Tune top 3 workloads each quarter; pattern compounds.

For your team: monthly HPA review on the top 5 highest-cost workloads. Address Patterns 1, 2, 3 in priority order.

---

## Related lessons

- [L1 — Requests and limits](L1_requests_limits.md)
- [L3 — Idle workloads](L3_idle_workloads.md) *(next)*
- [L4 — Single-replica patterns](L4_single_replica.md)
- [L5 — Security signals from K8s cost](L5_security_signals.md)
- [L6 — Orphan PVC cleanup](L6_orphan_pvc.md)
- [M5.2.L2 — Scale-to-one weekends](../M5.2_schedule_patterns/L2_scale_to_one.md)

## Glossary terms touched

[HPA (Horizontal Pod Autoscaler)](../../../reference/glossary/hpa.md) · [ScalingLimited condition](../../../reference/glossary/scaling-limited.md) · [HPA target](../../../reference/glossary/hpa-target.md) · [HPA stabilization window](../../../reference/glossary/hpa-stabilization-window.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L2
