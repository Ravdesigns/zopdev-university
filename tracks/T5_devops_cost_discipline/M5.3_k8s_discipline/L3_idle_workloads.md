# The seven idle workload shapes

§ T5 · M5.3 · L3 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** all seven shapes of K8s idle workloads, **detect** each via kubectl / metrics / ZopNight, **and remediate** appropriately (terminate, fix, leave).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Find every idle workload in my cluster across the seven distinct idle patterns, and reclaim the cost." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M5.3.L1 · M5.3.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Analyze), Detect (Apply), Remediate (Apply) |

---

## 1. Concept

K8s workloads can be idle in seven distinct ways. Each has different detection signals and different remediation. Most cluster audits find at least one of each shape — and each costs something.

```
THE SEVEN SHAPES:
  1. Zero replicas              (scaled to 0; sometimes intentional)
  2. Replicas but no traffic    (running but unused)
  3. Replicas + traffic + no usage (responding but not working)
  4. Stuck in Pending state     (can't schedule)
  5. Failed / CrashLoopBackOff   (broken; not cleaned up)
  6. Suspended CronJob          (paused; forgotten?)
  7. Endpoint without backend   (orphan routing)
```

The biggest waste is Shapes 2 and 3 — running pods doing no useful work. Other shapes are smaller individually but accumulate.

### Shape 1 — Zero replicas

```
DESCRIPTION:
  Deployment exists; replicas=0
  Could be: intentional (off-hours schedule)
            or: forgotten (project ended; deployment left behind)
  
DETECTION:
  $ kubectl get deployment | awk '$3 == 0'
  Or ZopNight: filter resources by replica_count=0
  
COST:
  Free in compute; just metadata
  
ACTION:
  Verify intentional (check schedules, owner)
  If forgotten: delete the deployment + associated services
  If intentional schedule: leave it; verify schedule is right
  
WHY IT MATTERS:
  Even though compute cost is zero, leftover metadata clutters
  the cluster. New engineers see dozens of zero-replica deployments
  and wonder which are real.
```

### Shape 2 — Replicas but no traffic

```
DESCRIPTION:
  Pods running but no inbound connections
  Service exists, endpoints exist, but no clients call it
  Or: service routing misconfigured
  
DETECTION:
  Monitoring shows 0 inbound requests over 7+ days
  Network metrics: no connections
  Application logs: no request entries
  
COST:
  FULL pod cost (running idle)
  This is the BIGGEST waste shape — often hundreds of $/mo per workload
  
ACTION:
  Verify intent (is anyone supposed to be calling this?)
  Check upstream routing
  If genuinely unused: scale to 0 first (reversible)
  After 7 more days idle: delete
  
EXAMPLE COST:
  3 replicas × $0.04/hr × 24 × 30 = $86/mo per workload
  Cluster with 20 of these: $1,700/mo wasted
```

### Shape 3 — Replicas + traffic + no usage

```
DESCRIPTION:
  Pods running, receiving traffic, but doing no work
  CPU and memory near zero
  Possibly: misconfigured (returns empty responses)
            wrong endpoint routing
            broken backend (returns errors quickly)
  
DETECTION:
  CPU/memory usage <2% over 30 days
  Pods "Available" in K8s status
  Traffic happening but useless
  
COST:
  Full pod cost + traffic cost (if cross-AZ)
  Plus: confusing health-check signals (pods think they're healthy)
  
ACTION:
  Investigate the workload behavior
  Verify health checks are doing more than "is the pod alive"
  Read logs; trace requests
  If genuinely broken: fix or remove
  
COMMON CAUSE:
  Migration leftover — service still routes to old workload
  while traffic now flows to new workload
  Old workload responds (because health check passes)
  Real users never hit it
```

### Shape 4 — Stuck Pending

```
DESCRIPTION:
  Pods in "Pending" state for hours
  Common causes:
    Scheduling failure (no node has capacity)
    PVC not provisioned
    Image pull failures
    NodeSelector / taint mismatch
  
DETECTION:
  $ kubectl get pods --field-selector=status.phase=Pending
  Pods Pending >1 hour: anomaly
  
COST:
  No compute cost (pod isn't running)
  But: signals a problem (capacity, config, image registry)
  And: blocks dependent workloads
  
ACTION:
  $ kubectl describe pod <pending-pod>
  Find the event explaining why
  Resolve: scale up cluster, fix PVC, fix image, etc.
  Or: delete if the pod is no longer needed
```

### Shape 5 — Failed / CrashLoopBackOff

```
DESCRIPTION:
  Deployment had a failure; pods crashing in restart loop
  Common causes:
    Bug; pod can't start (config error, missing dependency)
    Resource exhaustion (OOM-killed continuously)
    Manual restart needed but no one looking
  
DETECTION:
  $ kubectl get pods | grep -E 'Crash|Error'
  Pods with high restart count (>10) and recent restarts
  
COST:
  Cost of failed pod (memory + CPU during failure cycles)
  Failure tries consume resources
  Plus: log noise, alert fatigue
  
ACTION:
  $ kubectl logs <pod>
  $ kubectl describe pod <pod>
  Identify root cause
  Fix or terminate
  Don't let crashing pods linger for days
```

### Shape 6 — Suspended CronJob

```
DESCRIPTION:
  CronJob has spec.suspend=true
  Common causes:
    Manually suspended during incident
    Forgotten
    Or ZopNight-scheduled off (legitimate)
  
DETECTION:
  $ kubectl get cronjobs | awk '$3 == "True"'
  Suspended status visible in spec
  
COST:
  Free (no execution)
  But: if intended to run, business work isn't happening
  
ACTION:
  Verify intent (check schedules, runbooks)
  If forgotten: resume or delete
  If ZopNight-scheduled: leave; verify schedule is correct
  
WHY IT MATTERS:
  Forgotten suspended cronjobs = business logic not running
  Possibly missing backups, reports, cleanup tasks
  Cost isn't the issue here — business outcome is
```

### Shape 7 — Endpoint without backend

```
DESCRIPTION:
  Service has endpoints in spec but no matching backend pods
  Selector mismatch (label changed; selector didn't)
  Backend pods never started
  
DETECTION:
  $ kubectl get endpoints <service>
  Empty (no addresses) but service exists
  Or selector mismatch (kubectl describe service)
  
COST:
  Service object itself: free
  But: if pods exist with old labels, they're Shape 2 (cost!)
  
ACTION:
  Fix selector OR remove orphaned service
  If pods exist matching old selector: also handle (Shape 2)
```

### Detection automation — ZopNight rules

```
ZOPNIGHT RULES covering the seven shapes:

  RC-1701  EKS Deployment idle (zero replicas; Shape 1)
  RC-1702  EKS CronJob suspended (Shape 6)
  RC-1703  EKS Deployment with no recent activity (Shape 2/3)
  RC-1704  EKS Pod in CrashLoopBackOff (Shape 5)
  RC-1705  EKS Pod stuck Pending (Shape 4)
  RC-1706  EKS Endpoint without backend (Shape 7)
  
  RC-1801..1806  GKE equivalents
  RC-1901..1906  AKS equivalents

DETECTION COMBINES:
  K8s API state (replica count, statuses)
  Metrics-server / Prometheus (utilization)
  Activity log (traffic, requests)
  Last-deployment timestamp
```

ZopNight surfaces these as recommendations with cost impact + suggested action.

### Cost impact summary

```
SHAPE          TYPICAL COST          PRIORITY
─────────────────────────────────────────────────
Shape 1        Free (metadata)        Low (housekeeping)
Shape 2        $86/mo per workload     HIGH (most common waste)
Shape 3        $86/mo per workload     HIGH (subtle; harder to find)
Shape 4        Free (signaling issue)  Medium (operational)
Shape 5        $5-30/mo (failed pods)   Medium (signal + cost)
Shape 6        Free                    Low (business signal)
Shape 7        Variable                 Medium (cascades to Shape 2)
```

Focus first on Shapes 2 and 3 (the high-cost waste). Then sweep the others.

### Recommended audit cadence

```
WEEKLY (continuous):
  Shape 5 (CrashLoopBackOff): fix immediately
  Shape 4 (Pending >1hr): investigate immediately
  
MONTHLY (housekeeping):
  Shape 1 (zero replicas): confirm intent; delete forgotten
  Shape 6 (suspended cronjobs): confirm intent
  Shape 7 (orphan endpoints): fix selectors
  
QUARTERLY (deep audit):
  Shape 2 (no traffic): scan all deployments; check 30-day traffic
  Shape 3 (no usage): scan all deployments; check 30-day metrics
  Decommission obsolete workloads in waves
```

The deep audit (quarterly) is the high-value one. Most teams find $5K-$30K/mo in Shape 2 + 3 waste.

---

## 2. Demo

A real K8s workload audit at a mid-size SaaS:

```
AUDIT: 200-team K8s cluster, 1,200 deployments total

FINDINGS by shape:

  Shape 1 (zero replicas):       147 deployments
    18 intentional (scheduled off-hours)
    129 forgotten (decision: delete after 30-day notice)
    Cost recovery: $0 (compute) + cluster cleanup

  Shape 2 (no traffic):           42 deployments
    8 dev experiments (3+ months old, no owner)
    14 migration leftovers (old workloads after refactor)
    20 unknown (owner emails sent)
    Cost recovery: ~$3,600/mo

  Shape 3 (replicas, no work):    18 deployments
    All migration leftovers (health-check OK; doing nothing)
    Confirmed via traffic analysis
    Cost recovery: ~$1,550/mo

  Shape 4 (Pending):              3 pods
    1 PVC issue (resolved, scheduled)
    2 image-pull failures (registry creds issue; fixed)
    Cost recovery: $0 (operational)

  Shape 5 (CrashLoopBackOff):     7 deployments
    3 misconfigured (fixed via PR)
    4 obsolete (deleted)
    Cost recovery: ~$300/mo

  Shape 6 (suspended cronjobs):  12
    9 intentional (kept)
    3 forgotten (one was a critical backup job; resumed; investigated)
    Cost recovery: business impact, not cost

  Shape 7 (orphan endpoints):    23 services
    9 fixable (selector update)
    14 fully orphaned (removed)
    Cost recovery: $0 (but cleaned up routing)

TOTAL COST RECOVERY: ~$5,450/mo = $65,400/yr

EFFORT:
  Audit: 8 hours (week 1)
  Remediation: 16 hours over 4 weeks (decommissions, fixes, PRs)
  Total: 24 hours = $2,400 of engineering
  
ROI: 27:1 in year 1

PROCESS COMMUNICATED:
  Quarterly K8s workload audit going forward
  Owner: platform team
  Cadence: every 90 days
  Pattern: ZopNight scan → review → action → followup
```

The pattern compounds — each quarterly audit finds new drift.

---

## 3. Hands-on (5 min)

Audit your K8s cluster for the seven shapes:

```
□ STEP 1: Get cluster overview
  $ kubectl get deployment --all-namespaces | wc -l
  Total deployments: _____
  
  $ kubectl get cronjob --all-namespaces | wc -l
  Total cronjobs: _____

□ STEP 2: Find each shape (quick checks)
  Shape 1 (replicas=0):
    $ kubectl get deployment -A | awk '$3 == 0' | wc -l
    Count: _____
    
  Shape 4 (Pending):
    $ kubectl get pods -A --field-selector=status.phase=Pending | wc -l
    Count: _____
    
  Shape 5 (CrashLoop):
    $ kubectl get pods -A | grep -E 'Crash|Error' | wc -l
    Count: _____
    
  Shape 6 (Suspended):
    $ kubectl get cronjob -A | awk '$3 == "True"' | wc -l
    Count: _____

□ STEP 3: Estimate cost impact
  Quick estimate: Shape 2 + Shape 3 are highest cost
  Use ZopNight recommendations for accurate per-workload cost
  Total estimated recovery: $_____/mo

□ STEP 4: Plan audit
  Owner: __________
  Date: __________
  Time budget: 2-8 hours

□ STEP 5: Schedule quarterly
  Calendar reminder for next audit
```

A 30-minute initial scan reveals the scope. Quarterly deep audit captures the savings.

---

## 4. Knowledge check

### Q1
A Deployment with replicas > 0 but receiving zero traffic for 30 days:

A. Healthy and ready
B. Shape 2 idle workload — paying full pod cost for compute that does no work. Most common waste shape. Verify intent (someone should be calling this); if confirmed idle, scale to 0 first (reversible); after 7 more days, delete.
C. Random
D. Optimal posture

<details>
<summary>Show answer</summary>

**Correct: B.** Shape 2 = high-cost waste. Verify; scale; delete.
</details>

### Q2
A CronJob with spec.suspend=true:

A. Random
B. Shape 6 — likely intentional (scheduled off via ZopNight) or forgotten. Verify intent. If forgotten: re-evaluate (resume the job or delete). Cost is free but business impact may exist (missing backups, missing reports).
C. Bug
D. Failure

<details>
<summary>Show answer</summary>

**Correct: B.** Verify suspend intent. Cost-free but possible business impact.
</details>

### Q3
A pod in CrashLoopBackOff for days:

A. Eventually recovers automatically
B. Shape 5 — failed deployment never cleaned up. Investigate root cause via `kubectl logs` + `kubectl describe`. Fix or terminate. Days-old CrashLoopBackOff = ignored bug. Cost is real (failure cycles consume resources).
C. Random
D. Normal during deployments

<details>
<summary>Show answer</summary>

**Correct: B.** Needs action. Days-old crash loop = ignored bug.
</details>

---

## 5. Apply

ZopNight K8s rules surface all seven shapes with cost impact + suggested action. Quarterly deep audit; weekly for operational shapes (4, 5).

For your team: first audit this month; pattern compounds quarterly.

---

## Related lessons

- [L1 — Requests and limits](L1_requests_limits.md)
- [L2 — HPA signals](L2_hpa.md)
- [L4 — Single-replica patterns](L4_single_replica.md) *(next)*
- [L5 — Security signals from K8s cost](L5_security_signals.md)
- [L6 — Orphan PVC cleanup](L6_orphan_pvc.md)

## Glossary terms touched

[Idle workload shape](../../../reference/glossary/idle-workload-shape.md) · [Shape 2 (no traffic)](../../../reference/glossary/shape-2-no-traffic.md) · [CrashLoopBackOff](../../../reference/glossary/crashloopbackoff.md) · [Suspended CronJob](../../../reference/glossary/suspended-cronjob.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L3
