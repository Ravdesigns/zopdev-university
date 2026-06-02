# Scheduling StatefulSets — careful with replicas

§ T2 · M2.6 · L5 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** safe vs dangerous StatefulSet scheduling patterns, **execute** the safety checklist, **and handle** PVCs correctly during scheduling cycles.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule StatefulSets safely — capture savings on non-prod stateful workloads without risking production outages or data corruption." |
| **Personas** | Platform Engineer · SRE · Database Engineer |
| **Prerequisites** | M2.6.L1 - L4 · M5.3.L4 (single-replica) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Execute (Apply), Handle (Apply) |

---

## 1. Concept

StatefulSets are like Deployments but with pod identity guarantees: pods are ordered (sts-0, sts-1, sts-2) and bound to persistent storage via VolumeClaimTemplates. Scaling a StatefulSet to zero stops all pods. Scaling back creates them in order.

```
STATEFULSET CHARACTERISTICS:
  Pod identity (sts-0, sts-1, sts-2 with ordinal index)
  Persistent storage (PVC per pod)
  Ordered scaling (one at a time)
  Often: distributed system with peer-to-peer communication
```

The identity + storage characteristics make scheduling more careful than Deployments.

### What's different from Deployment

```
DEPLOYMENT                          STATEFULSET
─────────────────────────────────────────────────────────────────
Pods named randomly                 Pods named sts-0, sts-1, etc.
                                    (ordinal identity)
                                    
Pods can replace each other         Pods have specific identity
                                    PVCs are pod-bound
                                    
Rollout strategy: rolling           Rollout strategy: ordered
Scale: parallel                     Scale: ordered (one-at-a-time)

USE CASES:
  Stateless APIs                    Databases (when self-managed)
  Web tier                          Caches (some, like Redis Cluster)
  Workers                           Distributed systems (Kafka, etcd)
```

Different characteristics → different scheduling considerations.

### Scaling behavior — ordered

```
SCALE TO ZERO:
  kubectl scale statefulset/redis --replicas=0
  K8s response:
    Stop pod sts-2 (graceful shutdown; terminationGracePeriodSeconds)
    Wait for sts-2 to terminate
    Stop pod sts-1
    Wait for sts-1 to terminate
    Stop pod sts-0
    Wait for sts-0 to terminate
    
  Time: typically 30-60 seconds for 3-replica StatefulSet

SCALE FROM ZERO:
  kubectl scale statefulset/redis --replicas=3
  K8s response:
    Create pod sts-0
    Wait for sts-0 to be ready
    Create pod sts-1
    Wait for sts-1 to be ready
    Create pod sts-2
    Wait for sts-2 to be ready
    
  Time: typically 60-180 seconds for 3-replica StatefulSet
```

The ordered scaling can be slow. Plan for it.

### Why this is sometimes safe

```
SAFE EXAMPLE: stateful caching layer in staging
  StatefulSet: redis-cluster, 3 pods, ephemeral cache
  
  Scale to zero: all pods stop. PVCs remain (empty cache anyway)
  Scale back: pods restart in order. Cache rebuilds from source.
  
  Cost saving: 3 pods × 12 hours/night = 36 pod-hours saved
  No data loss (cache was rebuildable)
  No service impact (staging only)
  
  DECISION: schedule with confidence
```

The ephemeral data + non-prod combination = safe to schedule.

### Why this is sometimes dangerous

```
DANGEROUS EXAMPLE: production database StatefulSet
  StatefulSet: postgres-prod, 3 pods (primary + 2 replicas)
  
  Scale to zero: all pods stop
  
  RESULTS:
    Customers experience an outage
    Clean shutdown isn't guaranteed
      (terminationGracePeriodSeconds may not be enough for
       in-flight transactions)
    Risk of data corruption
    Replication lag could mean data loss
    Restore time: hours
    
  DECISION: NEVER schedule
```

The persistent data + production = catastrophic if scheduled wrong.

### Safe StatefulSet scheduling — checklist

```
ALL OF THESE MUST BE TRUE TO SCHEDULE SAFELY:

✓ NON-PRODUCTION ENVIRONMENT
  Production stateful workloads: never schedule
  
✓ DATA IS RECONSTRUCTIBLE
  Cache, replicated, or in-memory
  Can rebuild from source on restart
  
✓ NO ACTIVE CLIENT CONNECTIONS DURING OFF-HOURS
  No nightly batch jobs hitting this stateful workload
  No scheduled queries from analytics
  
✓ PVCs ARE NON-CRITICAL (or backed up regularly)
  Test data only; not source of truth
  
✓ RESTART LATENCY TOLERATES ~1-3 MINUTES
  Service can wait for stateful workload to come up
  
✓ POD STARTUP ORDER doesn't have specific business requirements
  Engineers OK with sts-0 starting before sts-1 (standard K8s)
  
ALL CHECKBOXES HIT → schedule with confidence
ANY UNCERTAINTY → default to "no scheduling" or "production = don't schedule"
```

If any checkbox uncertain: don't schedule.

### Dangerous patterns — never schedule

```
NEVER SCHEDULE:
  Production databases (any kind)
  Production message queues
  Stateful systems where data could be lost on hard restart
  Distributed systems with consensus protocols (etcd, Raft, Paxos)
  Anything with cross-pod ordering dependencies that can break

FOR THESE, schedule the workloads that DEPEND on them
Not the stateful system itself
```

The blast-radius of scheduling production stateful workloads is too high.

### PVC behavior — preserved through scheduling

```
PERSISTENT VOLUME CLAIMS attached to StatefulSet:
  Remain bound when StatefulSet scales to zero
  Storage preserved; only compute stops
  
THIS MEANS:
  Data persists across scheduled stops ✓
  Next scale-up sees the same data ✓
  Storage costs continue while compute is paused ✓
  
COST IMPLICATION:
  For staging/dev with caches: savings primarily from compute
  Storage cost continues during pause
  Calculate: if storage is huge, savings may be small
```

PVCs are independent of compute scheduling. The full cost picture includes both.

### Calculating savings for StatefulSet

```
EXAMPLE: 3-replica StatefulSet staging-elasticsearch
  Compute cost: $3/day (3 pods × $0.05/pod-hour × 24)
  Storage cost: $1.50/day (300 GB × $0.10/GB-month / 30)
  Total: $4.50/day = $135/month
  
SCHEDULING 12 hours/day on weekdays + full weekends:
  Compute saved: ~110 hours/week = $11/week
  Storage: unchanged ($1.50/day continues)
  
  Net savings: ~30% of compute = ~$50/month
  Vs compute-only savings: $50 / $90 (compute portion) = 55%
  
  Less impressive than for stateless Deployments
  But still meaningful
```

The math for StatefulSets is less attractive than Deployments due to PVC cost continuity.

### Alternative — scale-to-one for stateful

For some stateful workloads, scale-to-one (M5.3.L4) is better than scale-to-zero:

```
SCALE-TO-ONE for StatefulSet:
  3 replicas during business hours
  1 replica off-hours (skeleton)
  
BENEFITS:
  Maintains state continuity
  No cold-start latency
  Storage cost unchanged (PVCs preserved)
  Some compute saved
  
WHEN TO USE:
  Cache that benefits from warm state
  Distributed system that needs quorum (scale to N quorum, not 1)
  Single-pod operations possible (HA degraded but functional)
```

For workloads with warm-cache value: scale-to-one beats scale-to-zero.

---

## 2. Demo

A team's StatefulSet scheduling decision:

```
WORKLOAD: staging-elasticsearch (3 replicas)
  Ephemeral cache for staging data
  PVCs: 30 GB each (test indices)

CHECKLIST EVALUATION:
  ✓ Non-prod
  ✓ Data reconstructible (cache; can re-index from staging-postgres)
  ✓ No critical off-hours queries  
  ✓ PVCs non-critical (only test data; no source of truth)
  ✓ Restart latency: ~3 minutes total (1 min per pod)
  ✗ Some test scripts run nightly that query staging-elasticsearch

DECISION:
  Schedule the StatefulSet
  Move nightly test scripts to after main start
  
CONFIGURATION:
  Group "staging-stateful" includes staging-elasticsearch
  Schedule: business-hours-staging (8 AM - 8 PM weekdays)
  
  Separate handling for test scripts:
    Daily 2 AM test runs moved to 8:30 AM (after main start)
    Avoids dependency on stopped elasticsearch

RESULT:
  Saves ~3 pod-hours/night × 5 nights × 4 weeks = 60 pod-hours/mo
  Compute savings: ~$3/mo
  Modest but real
  No test impact (rescheduled cleanly)
  
  Across multiple non-prod stateful workloads:
    Aggregated savings: $50-200/mo typical
    Aggregate is the value
```

The careful pattern works for stateful workloads where the data isn't critical.

---

## 3. Hands-on (5 min)

Evaluate a StatefulSet for scheduling:

```
□ STEP 1: Pick a StatefulSet
  Workload: __________
  Replicas: _____
  PVC size: _____
  
□ STEP 2: Run the checklist
  □ Non-production
  □ Data reconstructible
  □ No critical off-hours connections
  □ PVCs non-critical
  □ Restart latency tolerable
  □ No ordering issues

□ STEP 3: Decision
  □ Schedule (all checks pass)
  □ Don't schedule (any uncertainty)
  □ Consider scale-to-one alternative

□ STEP 4: Estimate savings
  Compute cost: $_____/mo
  Storage cost: $_____/mo (unchanged)
  Compute savings (scheduling 50%): $_____/mo

□ STEP 5: If scheduling: attach
  Schedule: __________
  Test cycle: __________
```

A 10-minute exercise per StatefulSet. Most production stateful: don't schedule. Most non-prod: candidate.

---

## 4. Knowledge check

### Q1
Scheduling a production database StatefulSet to zero is:

A. Standard practice
B. Dangerous. Risk of outage and potential data corruption. Production stateful workloads should not be scheduled. Even with terminationGracePeriodSeconds, in-flight transactions could fail. Service outage = customer impact.
C. Required for FinOps
D. Up to the user

<details>
<summary>Show answer</summary>

**Correct: B.** Production stateful = don't schedule.
</details>

### Q2
StatefulSet scaling order is:

A. Random
B. Ordered: scale-down terminates in reverse (sts-2 → sts-1 → sts-0); scale-up creates in order (sts-0 → sts-1 → sts-2). Ordered scaling is a defining feature; takes longer than parallel Deployment scaling.
C. Parallel
D. Forward only

<details>
<summary>Show answer</summary>

**Correct: B.** Ordered scaling is a defining feature.
</details>

### Q3
A safe StatefulSet to schedule has:

A. Production data
B. Non-prod environment + reconstructible data + tolerable restart latency + non-critical PVCs + no critical off-hours connections. Safe pattern requires ALL of these. Any uncertainty → don't schedule.
C. Critical data
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Safe pattern requires all four.
</details>

---

## 5. Apply

StatefulSet scheduling is on the StatefulSet's detail page. Carefully evaluate the checklist before scheduling.

For your team: be conservative. Production stateful: never schedule. Non-prod: checklist first.

---

## Related lessons

- [L1 — Why K8s is hard](L1_why_k8s_hard.md)
- [L2 — Hierarchy](L2_hierarchy.md)
- [L3 — Deployment to zero](L3_deployment_zero.md)
- [L4 — Suspend cronjobs](L4_suspend_cronjobs.md)
- [L6 — Cross-cluster patterns](L6_cross_cluster.md) *(next)*
- [M5.3.L4 — Single-replica patterns](../../T5_devops_cost_discipline/M5.3_k8s_discipline/L4_single_replica.md)

## Glossary terms touched

[StatefulSet](../../../reference/glossary/statefulset.md) · [PVC preservation](../../../reference/glossary/pvc-preservation.md) · [Ordered scaling](../../../reference/glossary/ordered-scaling.md) · [StatefulSet checklist](../../../reference/glossary/statefulset-checklist.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L5
