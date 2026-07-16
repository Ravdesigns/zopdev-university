# Single-replica deployments — reliability vs cost

§ T5 · M5.3 · L4 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** when single-replica is acceptable vs when reliability requires more, **calculate** the reliability math behind replica counts, **and configure** monitoring + recovery for single-replica workloads.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "For each workload, pick the right replica count balancing cost and reliability — without defaulting to 'always 3' which over-provisions non-prod." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M5.3.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Calculate (Analyze), Configure (Apply) |

---

## 1. Concept

Single-replica deployment: 1 pod, no redundancy. Lowest cost; lowest reliability. The right choice depends on the workload's environment + criticality + restart tolerance.

```
TRADE-OFF:
  COST:        1 pod × $X = $X (vs 3 pods × $X = $3X)
  RELIABILITY: pod dies = service unavailable until restart
              Typical restart time: 1-5 minutes
  
DECISION:
  Is the 1-5 minute downtime acceptable?
  Is the cost difference worth the resilience?
```

For most non-prod and many internal workloads, single-replica is the right choice. For customer-facing prod, almost never.

### When single-replica is OK

```
GOOD CASES for single-replica:
  
  INTERNAL TOOLS USED BY ENGINEERS
    Dev dashboards, admin panels, internal APIs
    Engineers can wait 2 minutes during a restart
    
  DEVELOPMENT / STAGING ENVIRONMENTS
    Pre-production; not user-facing
    Tolerates brief downtime
    
  BATCH WORKERS
    Failure → retry next batch (idempotent jobs)
    No interactive user waiting
    
  STATEFUL SERVICES WITH PERSISTENT VOLUMES
    PV preserves state across pod restarts
    Restart time is the only downtime
    
  COST-SENSITIVE NON-PROD
    Demo environments, training clusters
    Cost matters more than resilience here
    
  STATELESS SERVICES with retry-friendly clients
    Client retries handle pod restart gracefully
    Brief 503 acceptable
```

### When single-replica is wrong

```
DON'T use single-replica for:
  
  CUSTOMER-FACING PRODUCTION
    Any downtime = customer impact
    2+ replicas minimum
    
  REAL-TIME CRITICAL SERVICES
    Financial transactions, alerting systems
    No tolerance for 1-minute outage
    
  HIGH-TRAFFIC LOAD BALANCERS / API GATEWAYS
    Single pod can't handle the traffic
    Capacity-bound, not just reliability-bound
    
  SERVICES WITH SLOW COLD-START
    Warm-up takes 5+ minutes
    Restart = extended outage
    
  COMPLIANCE / REGULATORY WORKLOADS
    Uptime SLAs (99.95%+)
    Single replica can't hit those numbers
    
  WORKLOADS UNDER ATTACK / HEAVY LOAD
    No headroom; one failure cascades
```

For these: 2+ replicas; possibly 3+ with anti-affinity rules.

### Decision matrix

```
SCENARIO                              REPLICA COUNT
─────────────────────────────────────────────────────────────
Production + stateless                 2+ replicas (resilience)
Production + stateful                  1 with PV + monitoring
                                       OR 2+ with leader election
Non-prod + any                         1 typically fine
Demo / dev                             1 fine
Batch / async (idempotent)             1 fine (can retry)
Critical batch (timing matters)        2 (parallelism if needed)
Load balancer / ingress                3+ (HA + capacity)
Database (primary)                     1 with PV + read replicas
Database (replica)                     2-3 for read scaling
```

Print this; tape to the cluster.

### Single-replica with persistent volume — the cheat code

```
SCENARIO: stateful service (DB-like, cache, queue) on single replica
  
  WITH PERSISTENT VOLUME:
    Pod dies → K8s restarts → re-attaches to PV → resumes
    Downtime: 1-3 minutes (acceptable for many workloads)
    Data: intact across restart
    
  WITHOUT PERSISTENT VOLUME:
    Pod dies → K8s restarts → state lost
    Cold-start latency; broken sessions; cache miss storm
    Often: catastrophic for the service

PV makes single-replica viable for stateful workloads.

EXAMPLES:
  Single-replica PostgreSQL with PV (dev/staging)
  Single-replica Redis with PV (internal cache)
  Single-replica RabbitMQ with PV (low-traffic queue)

PRODUCTION-SCALE DBs still need replica/HA setups; this is for
dev/staging or low-traffic prod.
```

### Monitoring single-replica — required setup

A single-replica deployment without monitoring is a ticking time bomb.

```
SINGLE-REPLICA REQUIRES:
  ✓ AGGRESSIVE LIVENESS CHECKS
    Pod restarts itself on health failure
    Don't rely on external monitoring alone
    
  ✓ AUTOMATIC RESTART POLICIES
    K8s restart policy: Always
    BackoffLimit for jobs/cronjobs
    
  ✓ MONITORING ALERTS TO HUMANS
    Pod restart count >N in 1 hour → alert
    Pod down >5 min → escalate
    
  ✓ DOCUMENTED RESTART PROCEDURE
    Runbook in team wiki
    On-call knows what to do
    
  ✓ STATEFUL: PV BACKUP STRATEGY
    Daily snapshot of PV
    Restore tested quarterly

WITHOUT THIS:
  Pod goes down at 2 AM Saturday
  Nobody notices until Monday morning
  Days of downtime; data loss possible
```

The monitoring + ops setup is the trade for the cost savings.

### Replica count vs reliability math

```
SINGLE-POD RELIABILITY (typical Kubernetes pod):
  Pod uptime: ~99.9%
  Service uptime: 99.9% (one pod = one point of failure)
  Allowed downtime: ~8.76 hours/year

TWO-POD RELIABILITY (independent failures, with health checks):
  Probability both fail simultaneously: 0.001 × 0.001 = 0.000001
  Service uptime: 99.9999%
  Allowed downtime: ~32 seconds/year

THREE-POD RELIABILITY:
  Probability all three fail simultaneously: 0.000000001
  Service uptime: 99.9999999%
  Allowed downtime: ~0.03 seconds/year

THE MATH:
  Two pods = 1,000× lower failure rate than one
  Three pods = 1,000,000× lower
  
  Cost: 2× or 3× linearly
  Reliability: orders of magnitude exponentially
  
  For prod: the math always favors 2+ replicas
  For non-prod: 1 replica is usually enough
```

The math is sometimes counterintuitive — most engineers default to 3 ("just to be safe"), but the gap from 2 to 3 is much smaller than 1 to 2.

### Multi-replica with cost discipline

Production doesn't have to mean over-provisioning:

```
PRODUCTION REPLICA OPTIONS:

OPTION A — ALWAYS 3 REPLICAS
  3 × pod cost = $3X
  Reliability: 99.99999%
  Over-provisioned for most workloads
  
OPTION B — MIN 1 + HPA SCALES TO N
  Base: 1 × pod cost = $X
  HPA scales when load increases
  PROBLEM: 1 replica during off-peak = no HA
  Not recommended for prod
  
OPTION C — MIN 2, MAX N (recommended)
  Base: 2 × pod cost = $2X
  HPA scales up to N for traffic
  Reliability: 99.9999% even at min
  This is the sweet spot for most production workloads
  
OPTION D — MIN 3, MAX N (premium)
  Base: 3 × pod cost = $3X
  HPA scales up to N
  Reliability: 99.99999%
  Reserve for critical / high-traffic services
```

Default to Option C; use D for true mission-critical.

### Cost optimization patterns

```
PATTERN — RIGHT-SIZE REPLICA COUNT PER ENVIRONMENT
  
  Production:    minReplicas=2 (or 3 for critical), HPA scales
  Staging:       minReplicas=1, HPA scales to test
  Dev:           replicas=1, no HPA
  
  Per-workload review quarterly
  Many workloads default to 3 by habit; can reduce to 2

PATTERN — TIERED RELIABILITY
  
  Tier 1 (revenue-critical): 3+ replicas, multi-AZ
  Tier 2 (customer-facing): 2 replicas
  Tier 3 (internal): 1 replica (or 2 if SLA matters)
  Tier 4 (dev/demo): 1 replica
  
  Document tier per service; default for new services Tier 2
```

The tier discipline saves real money. Without it, every service ends up Tier 1 by default.

### Common mistakes

```
MISTAKE                              FIX
──────────────────────────────────────────────────────────────────
Production service at 1 replica      Bump to 2 (resilience math
                                      strongly favors)
                                      
Dev/staging at 3 replicas             Reduce to 1 (over-provisioned)
                                      
Stateful service single-replica       Add PV for persistence
without PV
                                      
Multi-replica without anti-affinity  Add podAntiAffinity rules
(all pods on one node)                Or topology spread constraints
                                      
Single-replica without monitoring     Add liveness + alerts
                                      Document restart procedure
                                      
"Just in case" 3 replicas everywhere  Quarterly review per workload
                                      Many can reduce to 2
```

Most fixes are easy; the discipline is doing them.

---

## 2. Demo

A team's deliberate replica strategy:

```
TEAM: payment-team, 18 services in production

REPLICA STRATEGY DECISIONS:

  notification-service (customer-facing)
    Decision: 3 replicas (Tier 1: customer-impacting)
    Cost: $90/mo
    Reliability: 99.999%
    
  internal-dashboard (engineer-facing)
    Decision: 1 replica (Tier 3: internal; restart OK)
    Cost: $30/mo
    Reliability: 99.5%
    Monitoring: aggressive liveness + alert if down >5 min
    
  api-gateway (customer-facing)
    Decision: 3 replicas + anti-affinity (Tier 1)
    Cost: $90/mo
    Reliability: 99.999%
    
  payment-processor (revenue-critical)
    Decision: 3 replicas + 2 AZs + leader election (Tier 1+)
    Cost: $135/mo (3 reps + AZ replication)
    Reliability: 99.9999%+
    
  ml-inference (low-latency customer)
    Decision: 2 replicas with HPA to 10 (Tier 2)
    Cost: $60/mo base + autoscale up
    Reliability: 99.99%
    
  dev/staging environments (all)
    Decision: 1 replica everywhere
    Cost: ~$30/mo per workload
    Reliability: 99% (acceptable for non-prod)

TOTAL MONTHLY COST: $1,800/mo across 18 services
  
COMPARISON to "all 3 replicas always":
  Naive: $1,800 × 1.5 = $2,700/mo (~$10,800/yr extra)
  Discipline: $1,800/mo (current)
  SAVINGS: $10,800/yr from right-sized replicas

DOCUMENT in team wiki:
  Tier definition per service
  Replica count + reasoning
  Quarterly review schedule
```

The discipline saves real money while preserving reliability where it matters.

---

## 3. Hands-on (5 min)

Audit your replica counts:

```
□ STEP 1: List your top 10 deployments
  $ kubectl get deployment -A -o wide
  
  Deployment 1: __________   Replicas: ___   Env: ___
  Deployment 2: __________   Replicas: ___   Env: ___
  ...

□ STEP 2: Classify each by tier
  Tier 1 (revenue-critical):    __________
  Tier 2 (customer-facing):      __________
  Tier 3 (internal):              __________
  Tier 4 (dev/demo):             __________

□ STEP 3: Identify mismatches
  Production at 1 replica:        __________ (BUMP TO 2+)
  Dev/staging at 3 replicas:      __________ (REDUCE TO 1)
  Stateful without PV:            __________ (ADD PV)

□ STEP 4: Plan changes
  Bumps (production):  ___ workloads × ~$60/mo = $_____/mo cost
  Reductions (non-prod): ___ workloads × ~$60/mo = $_____/mo savings
  Net cost impact: $_____/mo

□ STEP 5: Apply changes
  Update HelmReleases / Kustomize / yaml
  Canary 1 workload
  Roll out remaining
```

A 20-minute audit reveals the rep-count opportunities. Often: production has under-provisioned services; non-prod has over-provisioned.

---

## 4. Knowledge check

### Q1
A customer-facing production API at 1 replica:

A. Acceptable cost-saving
B. Not for production. 2+ replicas minimum for resilience. Single-pod failure = service unavailable for 1-5 minutes. The reliability math strongly favors at least 2 — 1,000× lower failure rate. Tier 1 workloads: bump to 2 or 3.
C. Random
D. Optimal cost

<details>
<summary>Show answer</summary>

**Correct: B.** Production needs redundancy. Math favors 2+.
</details>

### Q2
A single-replica deployment with persistent volume:

A. Same as ephemeral single-replica
B. Significantly more viable for stateful workloads. Restart reattaches to PV; data preserved. Downtime ~1-3 min. PV makes single-replica acceptable for dev/staging stateful workloads (PostgreSQL, Redis, queues with low traffic).
C. Random
D. Cannot do

<details>
<summary>Show answer</summary>

**Correct: B.** PV improves single-pod resilience for stateful.
</details>

### Q3
A dev environment at 1 replica:

A. Risky always
B. Fine — dev tolerates brief downtime (99% uptime acceptable for engineer iteration). 2+ replicas for dev is over-provisioning. Save the cost; preserve the reliability budget for production.
C. Random
D. Production-grade required

<details>
<summary>Show answer</summary>

**Correct: B.** Dev allows lower SLAs; 1 replica fits.
</details>

---

## 5. Apply

Replica count = environment + workload type + tier. Document choices in service catalog. Quarterly review prevents drift.

For ZopNight: K8s detail shows replica count + utilization; recommendations surface under/over-provisioning.

---

## Related lessons

- [L1 — Requests and limits](L1_requests_limits.md)
- [L2 — HPA signals](L2_hpa.md)
- [L3 — Idle workload shapes](L3_idle_workloads.md)
- [L5 — Security signals from K8s cost](L5_security_signals.md) *(next)*
- [L6 — Orphan PVC cleanup](L6_orphan_pvc.md)
- [M5.5.L1 — Reliability vs cost line](../M5.5_reliability_vs_cost/L1_the_line.md)

## Glossary terms touched

[Single-replica deployment](../../../reference/glossary/single-replica-deployment.md) · [PodAntiAffinity](../../../reference/glossary/pod-antiaffinity.md) · [Tiered reliability](../../../reference/glossary/tiered-reliability.md) · [Replica count math](../../../reference/glossary/replica-count-math.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L4
