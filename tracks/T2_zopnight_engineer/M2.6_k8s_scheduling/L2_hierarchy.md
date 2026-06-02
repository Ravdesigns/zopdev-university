# Cluster → namespace → workload hierarchy

§ T2 · M2.6 · L2 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **navigate** the K8s parent-child hierarchy in ZopNight, **find** any specific workload via filters, **and identify** which workloads are schedulable vs not.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Find any K8s workload quickly via the hierarchy; know what I can and can't schedule." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.6.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Navigate (Apply), Find (Apply), Identify (Apply) |

---

## 1. Concept

ZopNight discovers K8s workloads as children of their cluster. The hierarchy makes navigation predictable: cluster → namespace → workload type → specific workload.

```
EKS cluster
├── Namespace: default
│   ├── Deployment: payment-api (3 replicas)
│   ├── Deployment: order-service (2 replicas)
│   └── CronJob: nightly-cleanup
├── Namespace: staging
│   ├── Deployment: staging-api (1 replica)
│   └── Deployment: staging-worker (2 replicas)
└── Namespace: kube-system
    └── (system workloads, generally not schedulable)
```

Each workload is its own ZopNight resource, with its own ID, schedule attachment, and recommendation eligibility.

### Reaching a specific workload

```
NAVIGATION FLOW:

1. Open Resources
2. Filter type=EKS or GKE or AKS
3. Click into a cluster (child count badge shows workload count)
4. View shows all workloads in the cluster
5. Filter by namespace, kind (deployment/statefulset/cronjob), or name
6. Click into a specific workload
7. Workload detail page with attach-schedule, recommendations, etc.

THREE CLICKS from estate-wide view to a specific deployment
```

The hierarchy is predictable; navigation is fast.

### What ZopNight discovers per workload

```
DEPLOYMENT / STATEFULSET:
  Name, namespace, kind
  Current replicas, desired replicas
  Pod template:
    Container images
    Resource requests/limits
    Labels and annotations
  Status: Available, Progressing, Updated
  
CRONJOB:
  Name, namespace
  Schedule (cron expression in K8s syntax)
  Last schedule time
  Active jobs count
  Suspended (boolean)
  
JOB (one-time):
  Name, namespace
  Completions / Parallelism
  Start time, completion time
```

The discovery runs every 6 hours per cluster, alongside the cluster discovery.

### Why namespace matters

```
NAMESPACE IS THE NATURAL ATTRIBUTION BOUNDARY in K8s

Production / staging / dev separation typically via namespaces
Filtering by namespace = quick access to environment-scoped workloads

COMMON NAMESPACE PATTERNS:
  prod / staging / dev
  team-platform / team-services / team-data
  cluster-autoscaler / kube-system (control plane)
  monitoring / observability
  
NAMESPACE + LABEL is the most useful filter combination
  Namespace narrows to environment
  Label narrows to specific app/team
```

The natural-attribution-boundary property is why K8s teams use namespaces extensively.

### What ZopNight does NOT discover

```
NOT IN SCOPE:
  Pods directly (only via their parent Deployment/STS/Job)
  Services and Ingress
  ConfigMaps / Secrets
  NetworkPolicies
  Custom resources (CRDs)
  Persistent Volume Claims (in K8s discovery; PVC handling in M5.3.L6)

WHY NOT:
  ZopNight discovers what's SCHEDULABLE for cost purposes
  Above objects are config/runtime infrastructure
  Not workloads that can be scaled to zero
  Different cost lens
```

The scope is intentional. K8s has many object types; ZopNight discovers the cost-relevant ones.

### Schedulable vs not-schedulable

```
SCHEDULABLE WORKLOADS:
  Deployment        (scale replicas to zero)
  StatefulSet       (scale replicas to zero — careful with PV)
  CronJob           (suspend / resume)

NOT SCHEDULABLE:
  DaemonSet         (one pod per node, by design)
  ReplicaSet        (managed by Deployment; act on parent instead)
  Job               (one-time execution; not ongoing)
  System workloads  (kube-system; would break cluster)
```

The product surfaces this in the workload detail page: the "Attach Schedule" button is disabled (with tooltip) for non-schedulable workloads.

### Workload status indicators

```
DEPLOYMENT STATUS:
  Available:   pods are healthy + meeting desired replicas
  Progressing: deployment is updating
  ReplicaFailure: replica set having trouble
  
HEALTH SIGNALS (from drilling down):
  Restart count (per pod)
  Last restart time
  Crashloop detection
  OOMKilled events
  
SCHEDULE STATUS:
  Attached to schedule: yes/no (and which)
  Currently in active window: yes/no
  Last action: scale up / scale down / no action
```

The status feeds into recommendations (e.g., "deployment is healthy; safe to scale").

### How discovery handles label changes

```
DISCOVERY EVERY 6 HOURS:
  Discoverer fetches all workloads + their current labels
  Compares to last-known state
  Detects label changes
  Updates ZopNight's record
  
EFFECT IF YOU ADD A LABEL:
  Next discovery: workload's labels updated
  Group memberships re-evaluated
  Schedule attachment based on label may apply or unapply
  
EFFECT IF YOU REMOVE A LABEL:
  Same; opposite direction
  Workload may leave group it was in
  Schedule may stop applying
```

The pull-based model adapts to label changes within 6 hours.

### Multi-cluster workloads

```
A SERVICE may run in multiple clusters:
  prod-eks-us-east-1
  prod-eks-eu-west-1
  prod-eks-ap-south-1
  
ZopNight discovers each cluster's instance separately
  Each has its own workload entry
  Each can be scheduled separately
  
GROUP across clusters:
  Tag selector: app=payments-api
  Group includes all instances across clusters
  Single schedule applies to all
  
SEE L6 (cross-cluster) for the pattern in depth
```

Multi-cluster workloads are common; the group abstraction handles them.

---

## 2. Demo

A typical drill-down:

```
T+0       Resources page → filter type=EKS → 6 clusters
T+5s      Click prod-eks-1 (28 workloads)
T+10s     Filter namespace=staging (8 workloads)
T+12s     Filter kind=Deployment (6 deployments)
T+15s     Click "staging-orders-svc"
T+15s     Workload detail page shows:
            Replicas: 4 (max 6, configured by HPA)
            Image: registry.io/orders-svc:1.2.3
            Container resources:
              Requests: 500m CPU, 1 GB RAM
              Limits:   1000m CPU, 2 GB RAM
            Status: Available, Progressing
            Attached to schedule: (none)
T+18s     Click Attach Schedule → pick "business-hours-staging"
T+25s     Schedule attached. Workload will scale to zero off-hours.

OUTCOME:
  25 seconds from estate view to specific workload scheduling
  No complex search; predictable hierarchy
  Engineer-friendly navigation
```

The hierarchy makes large estates manageable.

---

## 3. Hands-on (5 min)

Navigate to a specific K8s workload:

```
□ STEP 1: Open Resources; filter type=EKS/GKE/AKS
  Cluster count: _____

□ STEP 2: Pick one cluster; click in
  Workload count: _____
  Namespaces: _____

□ STEP 3: Filter to non-prod namespace
  Workloads visible: _____

□ STEP 4: Pick one Deployment
  Replicas: _____
  Resource requests: __________
  Schedule attached: __________

□ STEP 5: Identify schedulable workloads in cluster
  Total deployments: _____
  Schedulable (not DaemonSets, not system): _____
  Already scheduled: _____
  Could schedule: _____
```

A 10-minute exercise reveals the hierarchy + schedulable surface.

---

## 4. Knowledge check

### Q1
A DaemonSet appears in the cluster's workload list. Can you attach a schedule?

A. Yes
B. No — DaemonSets are non-schedulable by design (one pod per node). The Attach Schedule button is disabled with tooltip explaining why. Scheduling a DaemonSet would break the per-node guarantee.
C. With Admin permission
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** DaemonSets are explicitly non-schedulable.
</details>

### Q2
Filtering K8s workloads by namespace is useful because:

A. Performance
B. Namespace is the natural attribution boundary in K8s — production/staging/dev typically separated by namespace. Filtering by namespace gives quick access to environment-scoped workloads. Plus combining with labels narrows further.
C. AWS requires
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Namespace = environment boundary in most K8s setups.
</details>

### Q3
The number of clicks from estate-wide view to a specific deployment:

A. 10+
B. 3 (cluster → workload → attach schedule). The hierarchy is predictable; navigation fast. Three-click drill matches typical FinOps workflow.
C. 5
D. 7

<details>
<summary>Show answer</summary>

**Correct: B.** Three-click drill.
</details>

---

## 5. Apply

K8s workload navigation is in Resources page → filter type=EKS/GKE/AKS → drill into cluster.

For your team: navigate to a specific workload to attach schedule; build the muscle memory.

---

## Related lessons

- [L1 — Why K8s is hard](L1_why_k8s_hard.md)
- [L3 — Deployment to zero](L3_deployment_zero.md) *(next)*
- [L4 — Suspend cronjobs](L4_suspend_cronjobs.md)
- [L5 — StatefulSets](L5_statefulsets.md)
- [L6 — Cross-cluster patterns](L6_cross_cluster.md)

## Glossary terms touched

[K8s hierarchy](../../../reference/glossary/k8s-hierarchy.md) · [Workload schedulability](../../../reference/glossary/workload-schedulability.md) · [Namespace boundary](../../../reference/glossary/namespace-boundary.md) · [Resource drill-down](../../../reference/glossary/resource-drill-down.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L2
