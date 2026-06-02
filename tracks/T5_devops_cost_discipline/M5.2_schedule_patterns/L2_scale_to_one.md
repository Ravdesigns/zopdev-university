# Scale-to-one weekend pattern

§ T5 · M5.2 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **apply** the scale-to-one pattern for weekend cost reduction without full shutdown, **choose** between scale-to-zero, scale-to-one, and always-on, **and handle** the edge cases (quorum, sharding, health checks).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Cut weekend costs on workloads that can't fully stop but can run lean — keep 1 replica warm; restore on Monday." |
| **Personas** | Platform Engineer · DevOps Engineer · SRE |
| **Prerequisites** | M5.2.L1 (four envs) · T1.M1.3 (schedules) |
| **Time** | 9 minutes |
| **Bloom verb** | Apply (Apply), Choose (Evaluate), Handle (Apply) |

---

## 1. Concept

For workloads that can't fully stop (have weekend traffic, stateful caches, quorum constraints), but can run lean: scale-to-one. Keep one minimal instance running on weekends; scale up to working capacity on Monday.

```
WORKLOAD                              SCALE-TO-ONE FITS?
─────────────────────────────────────────────────────────────────
Stateful services with caches         Often yes (cache stays warm)
Worker pools (background jobs)        Yes (one worker continues
                                       processing at slow rate)
Distributed systems (Kafka, Redis)    Carefully (check quorum)
Stateless web tier                    Yes (one replica handles
                                       weekend traffic)
Database with replicas                Usually no (HA matters)
ML inference pools                    Yes if weekend traffic minimal
```

The pattern: maintain a skeleton; scale up during business hours.

### The pattern in numbers

```
WEEKDAY (Mon-Fri 24h):     6 instances (working capacity)
WEEKEND (Sat-Sun):          1 instance  (skeleton)

WEEKLY INSTANCE-HOURS:
  Weekday:  6 × 24 × 5 = 720 instance-hours
  Weekend:  1 × 24 × 2 = 48 instance-hours
  Total:    768 instance-hours
  
COMPARE TO ALWAYS-ON:
  Always-on:  6 × 168 = 1,008 instance-hours
  
SAVINGS: (1,008 - 768) / 1,008 = 24% reduction

NOT AS BIG as scale-to-zero off weekends (which would save 28%),
BUT scale-to-one preserves:
  - Warm cache (no cold-start)
  - Continuous availability for weekend traffic
  - Health-check stability
  - Quorum (where 1 is enough)
```

For workloads with any weekend activity, the 24% savings + zero cold-start is the right trade.

### Comparing three options

```
                ALWAYS-ON    SCALE-TO-ZERO   SCALE-TO-ONE
                            (weekends)       (weekends)
──────────────────────────────────────────────────────────────────
Instance-hours  1,008        720             768
Savings         0%           28%             24%
Cold-start      None         Monday morning   None
Weekend traffic Handled      Dropped/queued   Handled (lean)
Cache state     Warm         Cold Monday      Warm
Quorum          Maintained   Lost weekends    Lost if N>1 needed
Monitoring      Normal       Off weekends     Normal (single rep)

USE CASE:
  ALWAYS-ON:      Prod, high-traffic, no schedule possible
  SCALE-TO-ZERO:  Dev, no weekend traffic, restart latency OK
  SCALE-TO-ONE:   Workloads with light weekend activity or
                   warm-cache requirements
```

Pick based on actual weekend usage, not assumptions. Audit a few weeks of traffic before deciding.

### How to implement in ZopNight

```
SCHEDULE definition:
  Name: order-processor-weekend-lean
  
  Cron (scale down): "0 0 * * 6"    (Saturday 00:00)
  Action: scale replicas to 1
  
  Cron (scale up):   "0 8 * * 1"    (Monday 08:00)
  Action: scale replicas to 6
  
  Applies to: kubernetes deployment "order-processor"
            OR: Auto-scaling group "order-asg"
            OR: ECS service "order-processor"

EFFECT:
  Friday 23:59:  6 replicas running
  Saturday 00:00 onwards: 1 replica
  Monday 08:00 onwards: 6 replicas back
  Tuesday-Friday: 6 replicas (no schedule action)
```

The schedule is just a cron + action; ZopNight applies it to the configured target.

### Edge cases — handling correctly

```
EDGE 1: WORKLOAD HAS MESSAGE QUEUE
  Scale-to-one = 1 worker processing slowly
  Queue depth may grow on weekends
  
  MITIGATION:
    Queue-depth-based auto-scaling on top of schedule
    Schedule sets MINIMUM (1); autoscaler can scale up if queue grows
    e.g., HPA scales to 1-10 based on queue depth
          Schedule sets min=1 weekday, min=6 weekday
    
EDGE 2: WORKLOAD STATEFUL WITH SHARDING
  Scaling to 1 may lose shard distribution
  Some systems (Cassandra, Elasticsearch) need N>1 for sharding
  
  MITIGATION:
    Check: does workload function with 1 replica?
    If no: scale to MINIMUM safe count (3 for quorum, 2 for HA)
    Document the minimum in the schedule

EDGE 3: HEALTH CHECKS / ALARMS
  Single replica triggers HA-loss alarms (resilience reduced)
  
  MITIGATION:
    Suppress non-critical alarms during scaled-down period
    Or: alarm threshold reflects the schedule (don't alarm on
        "<2 replicas" during scheduled scale-down)
    
EDGE 4: ROLLING DEPLOYMENTS
  Single replica + deployment update = brief downtime
  
  MITIGATION:
    Schedule scale-down for AFTER deploy windows
    Or: deploy during weekdays only (best practice anyway)

EDGE 5: DEPENDENT WORKLOADS
  Workload-A scales to 1; Workload-B depends on Workload-A
  If A can't handle B's weekend load: cascading issue
  
  MITIGATION:
    Map dependencies; scale consistently
    Or: skip schedule on critical-path workloads
```

Most edge cases have known mitigations. The audit pre-rollout catches them.

### Variations of the pattern

```
SCALE-TO-MINIMUM (instead of 1):
  Some workloads need 2 or 3 for quorum (etcd, Kafka, ZooKeeper)
  Schedule scales to MINIMUM SAFE COUNT, not 1
  
  Example for etcd: scale to 3 (minimum quorum); not to 1

PARTIAL SCALE (not just weekends):
  Off-hours weeknights: 3 replicas (half of working capacity)
  Weekends: 1 replica
  Mon-Fri 8 AM - 8 PM: 6 replicas
  
  Three-tier schedule; more savings than weekends-only

DYNAMIC (autoscale + schedule):
  Schedule sets LOWER BOUND
  Autoscaler can scale UP if demand spikes
  
  e.g., HPA min=1 weekend, min=6 weekday, max=20 always
  Weekend traffic spike: autoscale to 5; off-spike: back to 1
  Best of both: cost savings + spike handling

SEASONAL (longer windows):
  Some teams have annual cycles (e.g., e-commerce Q4 surge)
  Schedule can have seasonal patterns
  
  Pre-Q4: 6 replicas baseline; Q4: 12 replicas baseline
```

The variations are tools — combine as needed for the workload's actual pattern.

### Choosing scale-to-zero vs scale-to-one

```
SCALE-TO-ZERO IS BETTER WHEN:
  ✓ Workload TRULY idle outside scheduled hours
  ✓ No incoming traffic / queue activity
  ✓ Restart latency acceptable (no SLA pressure)
  ✓ Cache cold-start tolerable
  ✓ Simpler operational model preferred

SCALE-TO-ONE IS BETTER WHEN:
  ✓ Some incoming traffic during off-hours
  ✓ Warm cache needed (cold-start would hurt)
  ✓ Quorum constraints (need at least 1)
  ✓ Health checks need replica continuity
  ✓ Slightly faster monday morning

DECISION FRAMEWORK:
  IF no weekend traffic AND no warm-state needed
    → scale-to-zero (max savings)
  ELSE
    → scale-to-one (slight savings sacrifice, much safer)
```

A 5-minute review of weekend traffic patterns settles the choice.

### Real-world impact

For a mid-size SaaS company:

```
WORKLOAD INVENTORY:
  Stateless web tier: scale-to-zero weekends → -28% on these
  Worker pools:       scale-to-one weekends → -24% on these
  Cache services:     scale-to-one weekends → -24% on these
  Databases:          always-on (HA matters)
  ML inference:       scale-to-zero (no weekend inference) → -28%

OVERALL non-prod compute savings: ~$32K/mo recurring

PILOT (first 4 weeks):
  3 workloads piloted with scale-to-one
  2 needed minor tuning (queue-based autoscale added)
  All within expected behavior after week 2
  Zero customer-impact incidents
  
ROLLOUT (next 4 weeks):
  18 additional workloads moved to scale-to-one or scale-to-zero
  Monthly savings reached $32K/mo
```

The pattern compounds — every applicable workload contributes.

---

## 2. Demo

A K8s deployment migrating to scale-to-one:

```
TEAM CASE: K8s deployment "order-processor"

USAGE AUDIT (2 weeks of data):
  Weekdays:  high traffic, 6 replicas needed at peak
              Average CPU: 60-75%
              p99 latency: 200ms
              
  Weekends:  light traffic, 1 replica handles 95% of load
              Average CPU: 20-30%
              p99 latency: 280ms (acceptable for non-peak)

DECISION: scale-to-one weekend
  Reasoning:
    - Weekend traffic is real but light (1 rep handles it)
    - Cache stays warm (avoids Monday cold-start)
    - p99 latency 280ms acceptable for weekends (non-peak)

SCHEDULE CONFIGURED:
  Schedule name: order-processor-weekend-lean
  Cron scale-down: "0 0 * * 6"       (Saturday 00:00)
  Cron scale-up:   "0 8 * * 1"       (Monday 08:00)
  Target replicas down: 1
  Target replicas up: 6

VERIFICATION (after first week):
  Saturday throughput: 1 replica handled all traffic
  Monday cold-start: NONE (warm cache from continuous run)
  Latency on rare peak: brief 320ms (acceptable for weekend)
  No incidents
  No queue backlog

COST IMPACT:
  Before:    6 replicas × $0.10/hr × 168 hr/wk = $100.80/wk = $437/mo
  After:     6 × 0.10 × 120 hr + 1 × 0.10 × 48 hr = $72 + $4.80 = $77/wk
                                                                  = $333/mo
  Savings:   $437 - $333 = $104/mo per deployment
            ~24% reduction

DECISION: keep pattern; consider expanding to weeknight scaling too
          (off-hours min=3 weeknights, max=6 working hours)
```

The 24% savings on this single workload = ~$1,300/year. Across 20 similar workloads = $26K/year.

---

## 3. Hands-on (5 min)

Identify scale-to-one candidates in your estate:

```
□ STEP 1: List workloads with weekend traffic
  Workload 1: __________   Weekend traffic: __________ (high/low/none)
  Workload 2: __________   Weekend traffic: __________
  Workload 3: __________   Weekend traffic: __________

□ STEP 2: Classify each
  None (truly idle):       → scale-to-zero candidate
  Light (1 replica works): → scale-to-one candidate
  Heavy (need full):       → always-on

□ STEP 3: Pick top 3 candidates
  1. __________   Pattern: scale-to-___   Est savings: $_____/mo
  2. __________   Pattern: scale-to-___   Est savings: $_____/mo
  3. __________   Pattern: scale-to-___   Est savings: $_____/mo

□ STEP 4: Edge case check
  Quorum needed?      __________
  Sharding involved?  __________
  Health-check alarms? __________

□ STEP 5: Pilot 1, observe 2 weeks
  Owner: __________
  Start date: __________
```

A 30-minute audit identifies the candidates. Pilot one, then roll out.

---

## 4. Knowledge check

### Q1
Scale-to-one vs scale-to-zero:

A. Same thing
B. Different. Scale-to-one keeps a warm instance for continued off-hours activity (cache, light traffic, quorum). Scale-to-zero fully stops (max savings, Monday cold-start). Pick scale-to-one when ANY weekend activity exists or warm cache matters.
C. Random
D. Scale-to-zero always better

<details>
<summary>Show answer</summary>

**Correct: B.** Different patterns; each fits different workloads.
</details>

### Q2
A workload requires 3 replicas for quorum. Scale-to-one:

A. OK
B. Risky — quorum requires 3 minimum. Scale to MINIMUM SAFE COUNT (3), not 1. The pattern is "scale-to-minimum" for these workloads. Some systems like etcd, Kafka, ZooKeeper need N for safety.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Respect quorum minimum. Scale to safe minimum, not 1.
</details>

### Q3
A workload has occasional but real weekend traffic:

A. Always-on
B. Scale-to-one fits — handles the occasional traffic while reducing cost from always-6 to 1-replica-baseline. Better than scale-to-zero (which would drop or queue the traffic). Better than always-on (which wastes capacity during the light period).
C. Random
D. Schedule off entirely

<details>
<summary>Show answer</summary>

**Correct: B.** Middle ground; handles light traffic at low cost.
</details>

---

## 5. Apply

ZopNight Schedules + Groups support per-workload scale-to-N. Pick the pattern based on actual weekend usage. Tune over 2-4 weeks.

For your team: scale-to-one on 3-5 workloads this month; measure savings; expand if clean.

---

## Related lessons

- [L1 — Four envs scheduling](L1_four_envs.md)
- [L3 — Rolling test environment](L3_rolling_test.md) *(next)*
- [L4 — Freeze windows](L4_freeze.md)
- [L5 — Demo / prod-like environments](L5_demo_prod.md)
- [M5.3.L2 — HPA on Kubernetes](../M5.3_k8s_discipline/L2_hpa.md)

## Glossary terms touched

[Scale-to-one](../../../reference/glossary/scale-to-one.md) · [Scale-to-zero](../../../reference/glossary/scale-to-zero.md) · [Scale-to-minimum](../../../reference/glossary/scale-to-minimum.md) · [Skeleton crew](../../../reference/glossary/skeleton-crew.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.2.L2
