# Parent-child hierarchies

§ T1 · M1.2 · L2 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **navigate** the parent-child hierarchy in the resource list **and drill** from a cluster to its individual child workloads in three or fewer clicks.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Find a specific K8s CronJob nested under a cluster's nodegroup." |
| **Personas** | Platform Engineer |
| **Prerequisites** | [L1](L1_what_gets_discovered.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Navigate (Apply) |

---

## 1. Concept

Cloud resources are not flat. An EKS cluster has nodegroups; each nodegroup has VMs; each cluster also has Deployments, StatefulSets, and CronJobs as workloads. An Azure Databricks workspace contains clusters, instance pools, and SQL warehouses. An AWS ECS cluster contains services; each service contains tasks.

ZopNight discovers these relationships and exposes them in a parent-child navigation model.

### The hierarchy model

```
TOP-LEVEL PARENT                CHILDREN (one level down)
─────────────────────────────────────────────────────────────
EKS / GKE / AKS cluster          → Nodegroup, Deployment, STS, CronJob
ECS cluster                      → Service, Task definition, Container instance
Databricks Workspace             → Cluster, Instance Pool, SQL Warehouse
ECR repository                   → Image
Artifact Registry repository     → Image
CloudWatch                       → Log Group
RDS instance                     → Read replica (if any)
ASG                              → Instance, Scheduled action
```

Some hierarchies go three levels deep:

```
LEVEL 1                LEVEL 2                LEVEL 3
─────────────────────────────────────────────────────────
EKS cluster        →   Nodegroup           →   EC2 instance
GKE cluster        →   Node pool           →   GCE instance
AKS cluster        →   Node pool           →   Azure VM
```

The default Resources view shows **parents only**. Each parent carries a child count badge. Clicking the badge or the parent itself drills into the children.

### The default view

```
RESOURCES → Parents view (default)

NAME                       TYPE        CHILDREN    STATUS
─────────────────────────────────────────────────────────────────
prod-eks-cluster           eks         3 child →    Running
staging-databricks-ws      databricks  12 child →   Running
prod-ecr-payments          ecr         847 child →  -
prod-rds-payments          rds         1 read replica → Available
build-asg-x86              asg         8 instances → Running
```

The child count is a direct link. Clicking "3 child →" on prod-eks-cluster navigates into the children view, scoped to that cluster's nodegroups, deployments, STS, and CronJobs.

### Breadcrumbs and scope

When viewing children, a breadcrumb shows the path:

```
Resources > prod-eks-cluster > Nodegroup: gp-nodes-1 > Instances

Each segment is clickable. Click "prod-eks-cluster" to return to its children.
Click "Resources" to return to the all-parents view.
```

The breadcrumb makes the navigation reversible. A user three levels deep can back out one click at a time or jump directly to a higher level.

### Filters narrow per scope

Filters apply to the current scope, not globally. While viewing children of `prod-eks-cluster`, the Type filter shows only the types present in this cluster (Nodegroup, Deployment, StatefulSet, CronJob) — not the full 380+ list. This keeps the filter UI relevant and uncluttered.

### Search overrides scope

The search bar searches across the entire estate, not just the current scope. Search overrides the parent-child view to surface matching resources regardless of which parent they live under. This is the right behavior when the user knows what they're looking for but doesn't remember where it lives.

### Why parent-child matters for scheduling

K8s workloads are scheduled at the **child** level, not the cluster level. A team that wants to scale a specific CronJob to zero off-hours navigates:

```
Resources → prod-eks-cluster → cronjob-daily-report → Attach Schedule
```

Scheduling the entire cluster off would also stop the production deployments, which is rarely the intent. The parent-child navigation makes child-level scheduling natural and discoverable.

The same applies to Databricks. A team can schedule individual Databricks clusters or SQL warehouses off-hours without affecting other workspace components.

### Why parent-child matters for cost

Cost attribution rolls up the hierarchy. A nodegroup's cost is the sum of its instances. A cluster's cost is the sum of its nodegroups. The Resources page shows the rolled-up monthly cost on the parent row and the per-child cost when drilled into the children.

```
prod-eks-cluster                       Monthly: $14,300
  └── gp-nodes-1   (nodegroup)         Monthly: $11,400
       └── i-0abc1 (instance)          Monthly: $722
       └── i-0abc2 (instance)          Monthly: $722
       └── ...
  └── memory-nodes (nodegroup)         Monthly: $2,900
       └── i-0xyz1 (instance)          Monthly: $972
       └── ...
  └── cronjob-daily-report             Monthly: included in nodegroup
```

The CronJob doesn't have separate compute cost — it runs on the nodegroup's pods. But ZopNight surfaces the CronJob in the hierarchy so it can be scheduled and reasoned about as a unit.

---

## 2. Demo

A typical navigation path:

```
SCENARIO: Find and schedule a specific CronJob to zero off-hours

T+0    Open Resources page (Parents view)
T+5 s  Find "prod-eks-cluster" with "12 child →" badge
T+8 s  Click "12 child →"
       Breadcrumb: Resources > prod-eks-cluster
       View: 12 children (4 nodegroups, 6 Deployments, 1 STS, 1 CronJob)
T+12 s Filter Type=CronJob, search "report"
       View narrowed to 1 CronJob: cronjob-daily-report
T+15 s Click the CronJob row
       Detail page opens: shows resource UID, parent cluster, current schedule, cost
T+18 s Click "Attach Schedule" → schedule selector → pick "Weekend Off"
T+22 s Confirm
       Schedule attached. The CronJob will be suspended on weekends.
```

22 seconds from estate view to scheduled. The hierarchy makes this fast.

(Asset: `assets/diagrams/M1.2_L2_navigation_drill.svg`.)

---

## 3. Hands-on (7 min)

For your own estate:

```
1. Open Resources. Identify any parent with children (cluster, ECS service,
   Databricks workspace, ASG, ECR repo).
2. Click the child count badge to drill in.
3. Note the breadcrumb at the top of the page.
4. Apply a filter (e.g., Type=Deployment).
5. Confirm the filter scope is local to this parent — toggle back to the
   parent view and observe how the filter availability changes.
6. Use the search bar to find a specific resource by name.
7. Confirm search overrides scope — even if you're inside one cluster,
   search returns matches from across the estate.
```

The exercise builds muscle memory for the navigation. Drill and back out multiple times.

---

## 4. Knowledge check

### Q1
A team wants to suspend one specific Kubernetes CronJob outside business hours. The right navigation path is:

A. Schedule the entire EKS cluster off
B. Drill into the cluster's children, find the specific CronJob, attach a schedule to that CronJob individually. The parent-child model makes this child-level scheduling natural.
C. Use the AWS console
D. Delete the CronJob

<details>
<summary>Show answer</summary>

**Correct: B.** Child-level scheduling is exactly what the hierarchy enables. Scheduling the entire cluster would stop production workloads too.
</details>

### Q2
A user is three levels deep (Resources > Cluster > Nodegroup > Instances) and wants to return to the cluster level. The most efficient way is:

A. Use the browser back button twice
B. Click the "Cluster" segment in the breadcrumb. The breadcrumb is the canonical navigation surface for parent-child hierarchies.
C. Refresh the page
D. Navigate from the Resources homepage

<details>
<summary>Show answer</summary>

**Correct: B.** Breadcrumb segments are clickable navigation. This is the designed navigation pattern.
</details>

### Q3
Inside a children view (one specific cluster's children), the Type filter shows only types present in this cluster (not the full 380+ list). This is:

A. A bug
B. Intentional — filters are scoped to the current view to keep the UI relevant. Search, by contrast, overrides scope and operates across the entire estate.
C. A limitation
D. Inconsistent with the rest of the product

<details>
<summary>Show answer</summary>

**Correct: B.** Filters narrow per scope; search overrides scope. This is the designed behavior because each one serves a different intent.
</details>

---

## 5. Apply

The Resources page implements the hierarchy as:

- **Default Parents view** with child-count badges per parent
- **Click child badge → Children view** with breadcrumb navigation
- **Per-scope filters** that adapt to the current view
- **Global search** that overrides scope

For specific workload patterns:

- K8s workloads (Deployments, StatefulSets, CronJobs) are children of their cluster (see [T2.M2.6](../../T2_zopnight_engineer/M2.6_k8s_scheduling/00_README.md))
- Databricks (Clusters, Pools, SQL Warehouses) are children of their workspace (see [T2.M2.7](../../T2_zopnight_engineer/M2.7_databricks_scheduling/00_README.md))

---

## Related lessons

- [L3 — Grouped account + grouped type filters](L3_grouped_filters.md) *(next)*
- [T2.M2.6 — K8s workload scheduling](../../T2_zopnight_engineer/M2.6_k8s_scheduling/00_README.md)

## Glossary terms touched

[Parent-child hierarchy](../../../reference/glossary/parent-child-hierarchy.md) · [Breadcrumb](../../../reference/glossary/breadcrumb.md) · [Scoped filter](../../../reference/glossary/scoped-filter.md) · [Global search](../../../reference/glossary/global-search.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.2.L2
