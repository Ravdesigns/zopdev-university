# Scheduling a Deployment to zero replicas

§ T2 · M2.6 · L3 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** scale-to-zero scheduling on a Deployment, **handle** HPA integration, **and resolve** service dependencies during off-hours.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Stop non-prod deployments overnight to save cost without breaking dependent services." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.6.L1 · M2.6.L2 · T1.M1.3 (schedules) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Handle (Apply), Resolve (Apply) |

---

## 1. Concept

Scaling a Deployment to zero stops all its pods. The Deployment object remains in Kubernetes, but no pods are running. On schedule-driven start, replicas restore to the configured count.

```
SCALE-TO-ZERO IS:
  Setting replicas: 0 on the Deployment spec
  All pods drain gracefully (30-60 seconds)
  Deployment object preserved (config, labels, etc.)
  Service objects routing to no endpoints
  
NOT THE SAME AS:
  Deleting the deployment (would lose config)
  Stopping the cluster (way too coarse)
  Suspending the namespace (affects too much)
```

The Deployment exists; nobody's serving traffic from it.

### What "zero" means in practice

```
BEFORE (running):
  Deployment: staging-api
  Replicas:   4 (configured desired count)
  Pods:       4 running
  Service:    routing to 4 endpoints
  
AFTER (scheduled stop):
  Deployment: staging-api (still exists)
  Replicas:   0 (scaled down)
  Pods:       0
  HPA (if any): scaled to min=0 (or paused)
  Service:    routing to no endpoints
  ServiceMonitor (if any): no targets
  
ON RESTART:
  Replicas restored to 4 (saved count)
  Pods come up; warm-up ~30-60 sec
  Service routing resumes
```

The state transition is clean; the recovery is predictable.

### What ZopNight does on scale-to-zero

```
SCALE-TO-ZERO WORKFLOW:

1. Pre-check: confirm the deployment exists; has expected replicas
2. SAVE the current replica count (e.g., 4)
3. Action: kubectl scale deployment/staging-api --replicas=0
   (Executed via the cluster's K8s API; ZopNight has credentials)
4. Validate: confirm replicas dropped to 0
5. Pods drain over 30-60 seconds (graceful shutdown)
6. Action complete
7. Audit log entry created
```

The replica count is **saved on stop** so restore is exact on restart.

### What ZopNight does on scale-from-zero

```
SCALE-FROM-ZERO WORKFLOW:

1. Pre-check: confirm the deployment exists; currently at 0 replicas
2. Action: kubectl scale deployment/staging-api --replicas=4
   (The "4" is the saved-on-stop replica count)
3. Validate: confirm replicas climbed to 4
4. Pods come up (image pull if needed; warm-up if applicable)
5. Service routing resumes
6. Action complete; audit log entry
```

The restore matches what was running before.

### Cluster-autoscaler interaction

```
IF THE CLUSTER HAS CLUSTER-AUTOSCALER:
  Scale-to-zero on a deployment frees node resources
  Cluster-autoscaler may scale down the node pool after a cool-down
  Cost savings come from:
    (a) Zero pod-hours for the deployment
    (b) Reduced node-hours (if cluster downsizes)
  
IF NO CLUSTER-AUTOSCALER:
  Scale-to-zero frees pod-level resources
  Doesn't change node count
  Cost savings: pod's allocated resources available for other pods
  For non-shared clusters: saving via "more capacity"

ZOPNIGHT'S SAVINGS CLAIM:
  Accounts for the cluster's autoscaler configuration
  If autoscale-enabled: typically 60-90% of deployment's effective node share
  If no autoscaler: lower savings claim
```

The savings depend on cluster setup. ZopNight calibrates the claim accordingly.

### Pre-conditions for safe scale-to-zero

```
CHECK BEFORE APPLYING SCHEDULE:

✓ Deployment is non-production (always check)
✓ Service has no critical inbound traffic during off-hours
✓ No dependencies on this deployment from always-on services
✓ HPA (if any) is non-critical OR HPA paused with the deployment
✓ PVCs (if any) are NOT affected (they remain mounted; data preserved)
✓ Restart latency is acceptable (typically 1-3 min warm-up)
✓ No background processes that need to run continuously
```

Most non-prod deployments meet these. Production rarely does.

### HPA integration

If the deployment has a HorizontalPodAutoscaler:

```
WITHOUT HPA:
  Scale-to-zero: kubectl scale --replicas=0
  Scale-back:    kubectl scale --replicas=N (saved)

WITH HPA:
  Scale-to-zero:
    Step 1: Pause HPA (kubectl autoscale --min=0)
    Step 2: Scale deployment to 0
    State: HPA paused; replicas at 0
    
  Scale-back:
    Step 1: Scale deployment to saved replicas
    Step 2: Resume HPA (restore original min)
    State: HPA active; replicas restored
    
  HPA's min/max settings remain intact
  Pause/resume is the integration point
```

HPA + scheduling work together cleanly when handled properly.

### Service-dependency problem

```
SCENARIO:
  Service-A: staging-database-service
  Service-B: staging-api (calls service-A)
  
  Schedule service-A off at 8 PM
  service-B at 8 PM tries to query A → endpoints empty → connection failure
  service-B reports errors
  
PROBLEM:
  Dependent service breaks when dependency is off
  
TWO SOLUTIONS:

  SOLUTION 1 — SCHEDULE TOGETHER:
    Both staging-database-service and staging-api in same group
    Same schedule
    Both stop at 8 PM; both restart at 8 AM
    No error window
    Cleanest approach
    
  SOLUTION 2 — SEQUENCED EXECUTION:
    Stop staging-api at 7:55 PM
    Then staging-database-service at 8:00 PM
    Avoids the error window
    More complex coordination
    See T1.M1.4.L4 for sequenced execution
```

The grouping + sequencing pattern from T1.M1.4 applies cleanly to K8s.

### Save-on-stop pattern

```
WHY ZOPNIGHT SAVES THE REPLICA COUNT:

  Without save:
    Scale-to-zero
    On restart: how many replicas?
    Default? Hardcoded? Configurable?
    Loses the deployment's actual desired state
    
  With save-on-stop:
    Stop: save replicas=4 (or whatever current value is)
    Start: restore replicas=4
    Preserves the desired state
    
  Edge cases handled:
    HPA increased to 8 yesterday → save=8 on next stop
    HPA min changed to 2 → save reflects the new minimum
    Manual scaling to 6 → save=6 if stop captures that state
```

The save-on-stop is what makes the cycle reliable.

### Cost savings calculation

```
EXAMPLE: staging-api deployment
  Replicas: 4 during working hours
  Schedule: 8 AM - 8 PM Mon-Fri
  Off-hours: 12 hours weekday + all weekend
  
PER WEEK:
  Active hours: 12 × 5 = 60 hours
  Off hours: 168 - 60 = 108 hours
  
PER POD-HOUR cost: $0.05 (cluster pod-share)

SAVINGS:
  Off-hours pods saved: 4 × 108 = 432 pod-hours
  At $0.05/pod-hour: $21.60/week
  Monthly: ~$95
  Annual: ~$1,140

ACROSS THE CLUSTER:
  10 similar deployments: ~$11,400/year
  20 similar deployments: ~$22,800/year
  
The compounding is where the savings come from
```

Small per-deployment, big in aggregate.

---

## 2. Demo

A team scheduling a non-prod deployment:

```
SETUP:
T+0      Navigate to staging-api deployment in eks-cluster-prod
T+5s     Note pre-conditions:
            Replicas: 4
            HPA: none
            PVCs: none (stateless)
            Dependencies: none critical
            
T+10s    Attach to "business-hours-staging" schedule
T+10s    Schedule cron:
            Stop: "0 20 * * 1-5"
            Start: "0 8 * * 1-5"

EVENING (8 PM):
T+0      Cron fires
T+1s     ZopNight: save replicas=4
T+1s     ZopNight: kubectl scale deployment/staging-api --replicas=0
T+5s     K8s acknowledges the scale
T+30s    Pods drain (graceful shutdown)
T+30s    Deployment has 0 replicas; pods all gone
T+30s    ZopNight notification fires
T+30s    Audit log entry created

NEXT MORNING (8 AM):
T+0      Cron fires
T+1s     ZopNight: kubectl scale deployment/staging-api --replicas=4
T+5s     K8s acknowledges
T+30s    4 pods come up
T+60s    Service routing resumes
T+60s    Application available for the day

REALIZED SAVINGS:
  Pod-hours saved nightly: 12 hours × 4 pods = 48 pod-hours
  At average pod cost of ~$0.05/pod-hour: $2.40/night
  Weekly: $12 × 5 nights = $60
  Plus full weekend: ~$160
  Monthly: ~$260
  
  Across 12 similar deployments in cluster:
    Monthly: ~$3,100
    Annual: ~$37,000
```

Small per-deployment, big in aggregate.

---

## 3. Hands-on (5 min)

Schedule a non-prod deployment:

```
□ STEP 1: Pick a non-prod deployment
  Workload: __________
  Replicas: _____
  HPA: □ Yes □ No
  Dependencies: __________

□ STEP 2: Verify pre-conditions
  Non-prod: □ Yes
  Off-hours traffic: □ None □ Some
  Dependent services: □ Yes (handle) □ No
  
□ STEP 3: Attach to schedule
  Schedule: __________
  Stop time: __________
  Start time: __________

□ STEP 4: Wait for stop cron (or trigger)
  Observed at time: __________
  Replicas dropped to 0: □ Yes □ No
  Pods drained gracefully: □ Yes

□ STEP 5: Verify restart
  Replicas restored: __________
  Service available: __________
```

A 15-minute exercise builds confidence in scale-to-zero.

---

## 4. Knowledge check

### Q1
Scale-to-zero on a Deployment with HPA:

A. Conflicts with HPA
B. ZopNight pauses HPA during the off-period; resumes HPA on scale-back. Replicas set to 0 directly during the off-period; resumed to the HPA's min on restart. HPA + scheduling work together cleanly.
C. Disables HPA permanently
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Pause and resume HPA is the integration.
</details>

### Q2
A team schedules service-A off but service-B (depending on A) remains running. The most likely problem:

A. No problem
B. service-B fails to connect to service-A during off-hours. The fix: group A+B together with the same schedule, or use sequenced execution to stop B before A and start A before B.
C. service-B auto-restarts
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Dependency handling via groups or sequencing.
</details>

### Q3
The replica count restored on scale-from-zero:

A. Always 1
B. The saved count from the moment of scale-to-zero. ZopNight captures the desired_replicas on stop so restore is exact. Save-on-stop pattern preserves the deployment's actual desired state.
C. The HPA's min
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Saved value is the source of truth for restore.
</details>

---

## 5. Apply

K8s deployment scheduling is on the deployment's detail page. Attach schedule like any other resource.

For your team: start with one deployment; verify the cycle; expand to all non-prod.

---

## Related lessons

- [L1 — Why K8s is hard](L1_why_k8s_hard.md)
- [L2 — Hierarchy](L2_hierarchy.md)
- [L4 — Suspend cronjobs](L4_suspend_cronjobs.md) *(next)*
- [L5 — StatefulSets](L5_statefulsets.md)
- [L6 — Cross-cluster patterns](L6_cross_cluster.md)
- [T1.M1.4.L4 — Sequenced execution](../../T1_zopnight_operator/M1.4_resource_groups/L4_sequenced_execution.md)

## Glossary terms touched

[Scale-to-zero](../../../reference/glossary/scale-to-zero.md) · [Save-on-stop](../../../reference/glossary/save-on-stop.md) · [HPA pause/resume](../../../reference/glossary/hpa-pause-resume.md) · [Service dependency handling](../../../reference/glossary/service-dependency-handling.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L3
