# Requests and limits — the math behind the bill

§ T5 · M5.3 · L1 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** the K8s cost impact of resource requests and limits, **diagnose** over-provisioning from cluster utilization data, **and set** requests/limits to the right p95/p99 sweet spot.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Set K8s requests/limits to the right values so the cluster runs efficiently without throttling pods or OOM-killing workloads." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | T0.M0.1 (cloud basics) · M5.2 (schedules) |
| **Time** | 9 minutes |
| **Bloom verb** | Calculate (Analyze), Diagnose (Analyze), Set (Apply) |

---

## 1. Concept

K8s requests and limits drive the cluster's effective cost. Most clusters have engineers setting requests by intuition ("4 CPU sounds right"); the actual usage is usually 10-30% of the request. The gap is wasted node capacity — paid for, not used.

```
RESOURCE REQUEST    Minimum guaranteed to the pod.
                    Reserved on a node when pod is scheduled.
                    Pod won't get less.
                    
RESOURCE LIMIT      Maximum allowed.
                    Pod throttled (CPU) or OOM-killed (memory)
                    if exceeded.
                    Pod can't get more.
```

The cost lever: requests determine how many pods fit per node. Lower requests = more pods per node = fewer nodes = lower cost.

### The cost math

```
NODE has 8 vCPU, 32 GB RAM available (after k8s overhead).

POD A requests 4 vCPU, 16 GB.
POD B requests 4 vCPU, 16 GB.
NODE FULL. K8s won't schedule any more pods.

ACTUAL USAGE:
  Pod A using 1 vCPU, 4 GB (25% of request)
  Pod B using 0.5 vCPU, 2 GB (12% of request)
  Node total actual usage: 1.5 vCPU, 6 GB (~18% of capacity)
  
EFFECTIVE COST:
  $X/hour for the node, 2 pods on it.
  Each pod: $X/2 per hour
  
  But: actual computation cost would justify $X/4 if requests
       were 2 vCPU instead of 4.
       
THE WASTE: 50% of node cost is "reserved but unused."
           Multiplied by hundreds of pods, this is enormous.
```

Right-sizing requests is often the single biggest K8s cost lever.

### If requests too high

```
SYMPTOMS:
  Node has spare CPU/memory but new pods stay in Pending
  Cluster auto-scales up despite low actual utilization
  Cost per request: very high
  Many nodes; each lightly loaded

DIAGNOSIS:
  kubectl top nodes shows <30% CPU utilization
  kubectl describe nodes shows requests "Allocated" near 100%
  Gap = waste
  
FIX:
  Lower request to p95 of actual usage
  More pods fit per node
  Fewer nodes needed
  Cost drops 30-50% typical
```

### If requests too low

```
SYMPTOMS:
  Pods OOM-killed unexpectedly
  CPU throttling under load
  p99 latency spikes
  Replica restarts during traffic peaks

DIAGNOSIS:
  Pod stats: usage frequently at the limit
  Container logs: "OOMKilled" events
  Throttle metrics from container runtime

FIX:
  Raise request closer to p95 actual
  Raise limit closer to p99 + buffer
  Verify stability over 2 weeks
```

### The sweet spot

```
REQUEST  ≈ p95 of actual usage (30 days)
LIMIT    ≈ p99 of actual usage + 30-50% buffer

REASONING:
  REQUEST at p95: pods comfortably operate within their reserved
                  budget. 5% of the time they need more.
  LIMIT at p99 + buffer: allows occasional spikes without OOM.
                         The buffer is for true peaks (P&L season,
                         traffic surge, etc.)

EXAMPLE:
  Workload p50: 0.3 CPU, 200 MB
  Workload p95: 1.2 CPU, 800 MB
  Workload p99: 2.1 CPU, 1.5 GB
  
  REQUEST: 1.2 CPU, 800 MB (p95)
  LIMIT:   3.0 CPU, 2.2 GB (p99 × 1.4 buffer)
  
  Result: pods comfortable, occasional spikes handled,
          cluster packs tightly.
```

### Common mistakes

```
MISTAKE 1: REQUEST = LIMIT
  Both at 4 CPU. No room for bursts.
  Any spike → OOM-killed.
  
  FIX: limit > request by 30-50%
  
MISTAKE 2: LIMIT VERY HIGH, REQUEST VERY LOW
  Request 0.5 CPU, limit 8 CPU.
  Scheduler doesn't reserve enough; bursts can't get capacity
  (other pods consume the headroom).
  
  FIX: request reflects realistic operation; limit modest buffer above

MISTAKE 3: BOTH VERY HIGH
  Request 4 CPU when pod uses 0.5.
  Wastes node capacity; cluster grows unnecessarily.
  
  FIX: measure actual; set request to p95
  
MISTAKE 4: COPYING FROM ANOTHER WORKLOAD
  "Worked for the API team; use same values"
  Different workloads have different profiles.
  
  FIX: measure each workload; tune per-workload
  
MISTAKE 5: SETTING ONCE, NEVER REVIEWING
  Initial values from year 1.
  Workload profile changed (new features, traffic shifts).
  Requests/limits drift from reality.
  
  FIX: quarterly review of top-10 workloads
```

Most clusters have at least 3 of these mistakes in production.

### Measuring actual usage

```
TOOLS:

kubectl top pod (basic):
  Shows current CPU/memory per pod
  Not historical
  
metrics-server (cluster):
  Aggregates pod metrics
  Used by HPA
  Limited history
  
Prometheus + Grafana (production-grade):
  Long-term history (30+ days)
  Configurable queries
  p50/p95/p99 calculations easy
  
ZopNight (recommended):
  Cluster-aware recommendations
  Reads actual metrics
  Recommends requests/limits per pod
  Bulk view across cluster
```

Use Prometheus + Grafana for the gold standard; ZopNight for cluster-aware recommendations integrated with cost.

### Quality-of-Service (QoS) classes — context

K8s assigns QoS based on request/limit settings:

```
GUARANTEED (highest priority):
  Request == Limit for both CPU and memory
  
BURSTABLE:
  Request < Limit OR request not set for some resources
  Pod can burst into available capacity
  
BESTEFFORT (lowest priority):
  No request, no limit
  First to be evicted under pressure

RECOMMENDATION for most workloads:
  BURSTABLE class (request < limit)
  
  GUARANTEED for latency-sensitive (rare)
  BESTEFFORT for batch/non-critical (rare)
```

QoS affects eviction order under node pressure. Burstable is the right default.

### Right-sizing process

```
QUARTERLY RIGHT-SIZING (per workload):

WEEK 1: Measure
  Pull 30 days of CPU/memory usage
  Calculate p50, p95, p99 per workload
  Compare to current request/limit

WEEK 2: Recommend
  For each workload, new values:
    Request: p95
    Limit: p99 × 1.4
  Estimate cost impact

WEEK 3: Apply (canary)
  Pick 1 workload (low-risk, well-monitored)
  Apply new requests/limits
  Observe 1 week for stability

WEEK 4: Rollout
  If canary stable: apply to top-10 workloads
  Repeat measurement after 2 weeks
  Iterate next quarter
```

Quarterly cadence keeps requests/limits aligned with actual usage.

### Cost impact at scale

```
EXAMPLE: 200-node cluster, average right-sizing opportunity

CURRENT:
  Avg request CPU utilization: 28%
  Cluster CPU cost: $40K/mo
  
RIGHT-SIZED:
  Avg request CPU utilization: 75%
  Cluster needs: 200 × (28/75) = 75 nodes (down from 200)
  
  But: keep some headroom + don't take it that far
  Actual right-size: ~100 nodes
  
  New cluster CPU cost: $20K/mo
  
SAVINGS: $20K/mo = $240K/yr
EFFORT: 1-2 quarters of right-sizing
PAYBACK: weeks
```

The cost lever scales with cluster size. 200-node cluster: $240K/year savings. 1000-node cluster: ~$1.2M/year.

---

## 2. Demo

A real right-sizing for a single workload:

```
WORKLOAD: order-processor (50 replicas)

CURRENT SETTINGS (set 18 months ago):
  request: cpu=2, memory=4Gi
  limit:   cpu=4, memory=8Gi

MEASURED ACTUAL USAGE (30 days from Prometheus):
  cpu p50:  0.3 cores
  cpu p95:  1.2 cores
  cpu p99:  2.1 cores
  cpu max:  2.4 cores
  
  memory p50:  600 MB
  memory p95:  1.4 GB
  memory p99:  2.3 GB
  memory max:  2.8 GB

GAP ANALYSIS:
  Request CPU: 2 cores; actual p95: 1.2 cores
    → 40% over-requested
    → 50 replicas × 0.8 wasted cores = 40 cores reserved-but-unused
    
  Request memory: 4 GB; actual p95: 1.4 GB
    → 64% over-requested
    → 50 replicas × 2.6 wasted GB = 130 GB reserved-but-unused

OPTIMIZED SETTINGS:
  request: cpu=1.2 (p95), memory=1.5Gi (p95)
  limit:   cpu=3 (p99 × 1.4), memory=3.5Gi (p99 × 1.5)

CLUSTER IMPACT:
  Per node (m5.2xlarge = 8 CPU, 32 GB):
    Before: fits 4 replicas (8 / 2 = 4 by CPU; 32/4 = 8 by mem)
            Actually: fits 4 (CPU-bound)
    After:  fits 6 replicas (8 / 1.2 = 6.7 by CPU; 32/1.5 = 21 by mem)
            Actually: fits 6 (CPU-bound)
  
  Nodes needed for 50 replicas:
    Before: 50 / 4 = 13 nodes
    After:  50 / 6 = 9 nodes
  
  Cost per node: $200/mo
  Before: 13 × $200 = $2,600/mo
  After:  9 × $200  = $1,800/mo
  
  SAVINGS: $800/mo = $9,600/yr
  
  Just for this one workload.

DEPLOYMENT:
  Update HelmRelease / Kustomize / yaml
  Canary 5 replicas first (1 week)
  Monitor: latency, error rate, OOM events
  Roll out remaining 45 replicas
  
VERIFICATION (2 weeks):
  No OOM events
  CPU throttling: <0.1% of pod-seconds (acceptable)
  p99 latency: unchanged
  Cost recovered as expected
```

The per-workload pattern scales. 20 similar workloads → $200K/year savings.

---

## 3. Hands-on (5 min)

Measure one of your K8s workloads:

```
□ STEP 1: Pick a high-cost workload
  Workload: __________
  Replicas: _____
  Current request: cpu=___ memory=___
  Current limit:   cpu=___ memory=___

□ STEP 2: Get actual usage
  $ kubectl top pod -l app=<workload>
  
  Sample CPU usage: _____ cores
  Sample mem usage: _____ MB

□ STEP 3: Pull 30-day p95/p99 (from Prometheus or ZopNight)
  CPU p95: _____  p99: _____
  Mem p95: _____  p99: _____

□ STEP 4: Calculate gap
  CPU request vs p95: _____ % over/under
  Mem request vs p95: _____ % over/under

□ STEP 5: Propose new values
  New request: cpu=___ memory=___
  New limit:   cpu=___ memory=___
  Estimated cluster cost reduction: $_____/mo
```

A 15-minute analysis per workload reveals the right-sizing opportunity. Apply to top 5; capture most of the savings.

---

## 4. Knowledge check

### Q1
A pod requests 4 cores when it actually uses 0.5. Result:

A. Better performance
B. Waste — the node has 4 cores reserved for this pod, blocking other pods from being scheduled there. Cluster auto-scales adds more nodes to handle other workloads. Higher cluster cost; same actual computation.
C. Random
D. Better

<details>
<summary>Show answer</summary>

**Correct: B.** Over-request wastes capacity; cluster grows unnecessarily.
</details>

### Q2
Set request to p95 because:

A. Random choice
B. P95 captures typical operation — pods comfortably operate within the request budget without throttling 95% of the time. Sets up healthy scheduling. Higher than p50 (would throttle often); lower than p99 (would over-reserve).
C. P50 is better
D. P99 is better

<details>
<summary>Show answer</summary>

**Correct: B.** P95 for typical operation; balances comfort vs efficiency.
</details>

### Q3
Limit equal to request means:

A. Best performance
B. No headroom for bursts (Guaranteed QoS class). The pod is throttled or OOM-killed on any spike. For most workloads, set limit higher than request by 30-50% to allow spikes without killing the pod.
C. Random
D. Optimal

<details>
<summary>Show answer</summary>

**Correct: B.** No burst headroom; OOM-prone for spiky workloads.
</details>

---

## 5. Apply

ZopNight workload detail shows requests/limits + actual usage. Rules surface over/under-provisioning across the cluster.

For your team: quarterly right-sizing on top-10 workloads. Apply pattern: measure, recommend, canary, rollout, verify.

---

## Related lessons

- [L2 — HPA (horizontal pod autoscaler)](L2_hpa.md) *(next)*
- [L3 — Idle workloads](L3_idle_workloads.md)
- [L4 — Single-replica patterns](L4_single_replica.md)
- [L5 — Security signals from K8s cost](L5_security_signals.md)
- [L6 — Orphan PVC cleanup](L6_orphan_pvc.md)
- [M5.2 — Schedule patterns](../M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Resource request](../../../reference/glossary/resource-request.md) · [Resource limit](../../../reference/glossary/resource-limit.md) · [QoS class](../../../reference/glossary/qos-class.md) · [Right-sizing](../../../reference/glossary/right-sizing.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L1
