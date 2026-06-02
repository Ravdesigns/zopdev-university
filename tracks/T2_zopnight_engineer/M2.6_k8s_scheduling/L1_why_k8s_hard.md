# Why K8s is hard to cost-optimize

§ T2 · M2.6 · L1 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** three structural reasons K8s defies traditional FinOps tooling, **explain** ZopNight's decoupled model, **and architect** workload-level scheduling that preserves production.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand why K8s cost is uniquely hard — and why workload-level scheduling is the right answer." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer · FinOps Lead |
| **Prerequisites** | M2.1 (rule library) · T5.M5.3 (K8s discipline) |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Analyze), Explain (Understand), Architect (Create) |

---

## 1. Concept

K8s is the most common workload class with the worst FinOps tooling. Three structural reasons explain why; ZopNight's model addresses each.

```
WHY K8S IS HARD:
  1. Cost lives at the wrong level (node bill ≠ workload responsibility)
  2. Schedule-stop the cluster loses everything (including prod)
  3. Pod-hours ≠ instance-hours (decoupled time accounting)
```

Understanding these enables the right architecture for K8s cost optimization.

### Reason 1 — Cost lives at the wrong level

The cloud bills the cluster's nodes (EC2 instances backing EKS, VMs backing AKS, GCE VMs backing GKE). But the actual workload — the deployment, the cron job — runs as pods scheduled onto those nodes.

```
COST BILLING                          WORKLOAD CONTEXT
─────────────────────────────────────────────────────────────────
EC2 m5.large × 8 in EKS nodegroup     prod-payment-api: 4 pods
                                       ml-training-job: 1 pod
                                                       (resource-hungry)
                                       analytics-dashboard: 2 pods
                                       sidecar-logger: 7 pods
                                                       (1 per pod)
```

```
THE BILL SAYS:
  "8× m5.large = $584/month"

THE WORKLOAD TRUTH:
  4 of those instances are running ml-training-job's single pod
  Each pod uses 6 vCPU
  The bill doesn't tell you this

WITHOUT POD-LEVEL ATTRIBUTION:
  You can't tell which workload is driving the cost
  Showback per team breaks down
  Cost optimization decisions are blind
```

This is the fundamental K8s FinOps problem.

### Reason 2 — Schedule-stop the cluster, lose everything

```
NAIVE THINKING:
  "Just stop the cluster off-hours."
  
REALITY:
  Stopping the EKS control plane takes down ALL workloads
  Not just non-prod
  Dev workloads stop
  Production workloads on the same cluster also stop
  Catastrophic for shared clusters

ZOPNIGHT'S SOLUTION:
  Schedule individual workloads (Deployments, StatefulSets, CronJobs)
  Not the cluster
  Cluster keeps running
  Specific workloads scale to zero
  Production unaffected
```

The workload-level scheduling preserves the cluster while saving cost on non-prod.

### Reason 3 — Pod-hours vs instance-hours

A pod's runtime is independent of the underlying node's runtime:

```
SCENARIO:
  Node m5.large running 10 pods
  Pod A: scales to zero (pod runtime = 0)
  Node still running (other 9 pods active)
  Cluster bill: same (node-hours unchanged)
  
COST ACCOUNTING question:
  Did we save anything?
  
ANSWER depends on accounting model:
  Naive: no (node still running)
  Sophisticated: yes (could scale down node if more pods drop)

WITHOUT INSTANCE-LEVEL vs POD-LEVEL ACCOUNTING:
  FinOps tools either:
  Show "cluster costs $X" without showing what drives → useless
  Show pod-level cost via complex allocation → expensive to compute
  Cannot do both well

ZOPNIGHT'S MODEL:
  Cluster is the COST entity (bill applies to cluster)
  Workload is the SCHEDULING entity (you stop workloads)
  The two are decoupled
  Roll up via labels for pod-level attribution
```

The decoupled model is the right architecture for K8s cost.

### How ZopNight handles these

```
PROBLEM                                  SOLUTION
─────────────────────────────────────────────────────────────────
Cost lives at wrong level                Pod-level attribution (via labels)
                                          rolls up to cluster-level cost
                                          
Schedule-stop the cluster                 Schedule individual workloads
loses everything                          (Deploy/STS/CronJob)
                                          Without affecting cluster
                                          
Pod-hours vs instance-hours              Track pod runtime as scheduling metric
                                          Track cluster runtime as cost metric
                                          Decoupled accounting
```

The model maps neatly: cluster billed; workloads scheduled; labels glue them together.

### What this means in practice

A non-prod Kubernetes cluster: scheduling 12 specific deployments to scale-to-zero overnight.

```
EFFECT ON THE CLUSTER:
  Pods scale to zero
  Cluster-autoscaler may scale down nodes (if other workloads
                                            don't need them)
  Or: nodes stay running (if other workloads still need capacity)
  
EFFECT ON COST:
  Reduced node-hours (if cluster-autoscaler scales down)
  Reduced "active pod-hours" (informs rule's savings claim)

ZOPNIGHT SHOWS BOTH:
  Pod-hours saved (workload-level metric)
  Node-hours saved (cluster-level metric)
  Different perspectives on the same outcome
```

The two perspectives together give the full picture.

### The label-based attribution

```
HOW POD-LEVEL COST GETS COMPUTED:

  Pod has labels: team=payment, environment=prod, app=order-api
  Pod uses CPU + memory
  Pod runtime: 720 hours this month
  
  Cluster bill: $584
  Cluster total pod-hours: 14,400 (avg)
  Pod's share: 720 / 14,400 = 5%
  Pod's attributed cost: $29

ROLL-UP options:
  By team: sum all team=payment pods
  By environment: sum all environment=prod pods
  By app: sum all app=order-api pods
  Multi-dimensional: any combination
  
LABELS DRIVE THE ATTRIBUTION
  Without labels: cost stays cluster-level (useless for showback)
  With good labels: pod-level attribution works
```

This is why M5.1 (tagging strategy) is the prerequisite for K8s cost work. Without good labels, K8s cost attribution is broken.

### Common K8s cost patterns

```
PATTERN                            COST IMPACT      ZOPNIGHT ACTION
───────────────────────────────────────────────────────────────────
Cluster over-provisioned          High               L1 + L4 (right-size)
                                                     M5.3.L1
                                                     
Non-prod workloads 24/7            High               L3 (scale to zero)
                                                     M5.2 patterns
                                                     
CronJobs scheduled but never used  Moderate           L4 (suspend cronjobs)
                                                     
Stateful workloads always-on        High               L5 (statefulset 
                                                     scheduling)
                                                     
Cross-cluster duplication           High               L6 (cross-cluster)
                                                     M5.4 multi-account
                                                     
Idle workloads accumulating          High               M5.3.L3 (7 shapes)
```

The lessons L2-L6 in this module cover each scheduling pattern.

---

## 2. Demo

A team's K8s cost reality:

```
ESTATE: 1 EKS cluster, ~$8,400/month
WORKLOADS:
  Production deployments:    3 (always-on, ~60% of node capacity)
  Production cronjobs:        12 (cron-driven, ~5% of node capacity)
  Staging deployments:        8 (working hours, ~25% of capacity)
  Dev deployments:             5 (working hours, ~10% of capacity)

NAIVE APPROACH:
  "Stop the cluster nights/weekends"
  Problem: also stops production
  Cannot do
  
ZOPNIGHT APPROACH:
  Tag all workloads with team/environment labels (M5.1)
  
  Create groups:
    "staging-deployments" (label environment=staging)
    "dev-deployments" (label environment=dev)
    
  Schedule each group:
    Business Hours schedule (8 AM - 8 PM weekdays)
    Action: scale-to-zero outside hours
  
  Effect:
    Cluster keeps running
    Production workloads unaffected (no label match)
    Staging + dev workloads scale to zero off-hours
    Cluster-autoscaler scales nodes down when pods drop
    
COST IMPACT:
  Before: $8,400/mo (24/7 cluster + workloads)
  After:  ~$5,460/mo (production preserved; non-prod scheduled)
  Savings: ~$2,940/mo = 35% reduction
  No impact on production
  Engineers don't notice (their dev environment came back at 8 AM)
```

The math works because workload-level scheduling is granular enough to leave production alone.

---

## 3. Hands-on (5 min)

Assess your K8s estate for scheduling opportunity:

```
□ STEP 1: Inventory
  Number of clusters: _____
  Number of namespaces: _____
  Number of deployments: _____
  Number of CronJobs: _____
  Number of StatefulSets: _____

□ STEP 2: Label hygiene check
  All workloads have environment label? □ Yes □ No
  All workloads have team label? □ Yes □ No

□ STEP 3: Identify non-prod
  Deployments tagged environment=dev/staging/test: _____
  Currently always-on (24/7): _____

□ STEP 4: Estimate savings
  Non-prod fraction of cluster cost: _____%
  Expected scheduling savings: ~70% of that = $_____/mo

□ STEP 5: Plan rollout
  First cluster to schedule: __________
  Pilot deployments: __________
  Target completion: __________
```

A 20-minute assessment reveals the opportunity. The savings are usually significant.

---

## 4. Knowledge check

### Q1
Why can't you just stop the cluster off-hours?

A. The cloud doesn't allow it
B. Cluster start/stop affects ALL workloads, including production. Workload-level scheduling (individual deployments/cronjobs) preserves production while stopping non-prod. Granular control is the answer.
C. Performance impact
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Cluster-level is too coarse for typical environments.
</details>

### Q2
The cost model decouples:

A. Cluster cost from pod cost
B. Cluster runtime (the billing entity) from workload runtime (the scheduling entity). The two are independent: cluster keeps running while individual workloads scale to zero. Labels link them via attribution.
C. Memory from CPU
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Decoupled cost vs scheduling is the design.
</details>

### Q3
Pod-level attribution rolls up to:

A. Per-pod cost only
B. Cluster-level cost via labels — the cluster is the billing entity, pods inherit the cost share via label-based attribution. Without labels: attribution breaks; with good labels: per-team / per-app cost works.
C. Random
D. Network cost

<details>
<summary>Show answer</summary>

**Correct: B.** Roll-up to cluster level via labels.
</details>

---

## 5. Apply

K8s workload scheduling is in Resources page → drill into a cluster's children → individual Deployments/STS/CronJobs. Each is schedulable.

For your team: tagging hygiene first (M5.1); then workload scheduling (this module).

---

## Related lessons

- [L2 — K8s hierarchy](L2_hierarchy.md) *(next)*
- [L3 — Deployment to zero](L3_deployment_zero.md)
- [L4 — Suspend cronjobs](L4_suspend_cronjobs.md)
- [L5 — StatefulSets](L5_statefulsets.md)
- [L6 — Cross-cluster patterns](L6_cross_cluster.md)
- [T5.M5.3 — K8s discipline](../../T5_devops_cost_discipline/M5.3_k8s_discipline/00_README.md)

## Glossary terms touched

[K8s cost decoupling](../../../reference/glossary/k8s-cost-decoupling.md) · [Pod-level attribution](../../../reference/glossary/pod-level-attribution.md) · [Workload-level scheduling](../../../reference/glossary/workload-level-scheduling.md) · [Pod-hours vs instance-hours](../../../reference/glossary/pod-hours-vs-instance-hours.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L1
