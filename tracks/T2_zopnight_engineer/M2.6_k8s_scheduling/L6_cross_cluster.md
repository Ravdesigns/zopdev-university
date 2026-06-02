# Cross-cluster orchestration with groups

§ T2 · M2.6 · L6 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **group** K8s workloads across multiple clusters, **apply** a single schedule across cluster boundaries, **and choose** the right grouping pattern (global / per-region / workload-based).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Manage K8s scheduling across multiple clusters / regions without per-cluster duplication." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.6.L1 - L5 · T1.M1.4 (resource groups) |
| **Time** | 9 minutes |
| **Bloom verb** | Group (Apply), Apply (Apply), Choose (Evaluate) |

---

## 1. Concept

For organizations with workloads spread across multiple K8s clusters (often by region or by team), grouping them across cluster boundaries makes scheduling simpler. One group, one schedule, attached to workloads in N clusters.

```
THE CROSS-CLUSTER GROUP PATTERN:
  Group spans cluster boundaries
  Schedule applies to all members
  Per-cluster K8s API calls happen independently
  Failures in one cluster don't block others
```

The pattern handles the scale-up to multi-region without complexity explosion.

### Example structure

```
ORGANIZATION
  Cluster A (us-east-1):    payment-api, order-svc
  Cluster B (eu-west-1):    payment-api, order-svc (regional copies)
  Cluster C (ap-south-1):   payment-api, order-svc (regional copies)

GROUP: "global-payment-api"
  Members: payment-api in all 3 clusters (3 resources, same name)

SCHEDULE: business-hours-global
  Cron: 0 8 * * 1-5 start
        0 20 * * 1-5 stop
  Attached to group "global-payment-api"

RESULT:
  At 8 AM in each cluster's timezone (configurable):
    payment-api starts in each cluster
  At 8 PM:
    payment-api stops in each cluster
  All three regional copies follow the same schedule shape
```

Cross-cluster grouping lets a single attachment manage the whole footprint.

### Implementation behavior

```
WHEN SCHEDULE FIRES:

1. Each cluster's K8s API is accessed separately
2. ZopNight knows which cluster each workload lives in
3. The group's schedule cron fires per timezone (configurable)
4. Each cluster's API call is made independently
5. If one cluster's scale fails, the others continue (idempotent)
6. Failure on one cluster is reported in the action log

FAILURE HANDLING:
  Group spanning 3 clusters; 1 cluster fails
  → 2 succeed; 1 fails (cleanly reported)
  → Idempotent retry possible later
  → Customer sees the per-cluster failure in audit log
```

The independent-per-cluster execution handles failures gracefully.

### Three multi-cluster scheduling patterns

```
PATTERN A — SINGLE GLOBAL SCHEDULE
  All payment-apis (3 clusters) in one group
  One schedule applied to the group
  Same UTC time for all clusters
  
  WORKS WHEN:
    Workloads are functionally identical
    Same business hours work across regions
    Customer doesn't need timezone awareness
    
  TIMING:
    All clusters scale at the same UTC moment
    Variability: ~1-2 seconds between clusters

PATTERN B — PER-REGION GROUPS  
  Group "payment-api-us": us-east-1 payment-api (1 resource)
  Group "payment-api-eu": eu-west-1 payment-api (1 resource)
  Group "payment-api-asia": ap-south-1 payment-api (1 resource)
  Each group has its own schedule (different timezones)
  
  WORKS WHEN:
    Different regions have different business hours
    Multi-region team availability matters
    
  TIMING:
    Each region scales per its local business hours
    Independent timing per region

PATTERN C — WORKLOAD-BASED GROUPING
  Group "non-prod-databases" spans clusters, includes all staging DBs
  Group "non-prod-apps" spans clusters, includes all staging apps
  Schedule fires; databases stop first (sequenced), then apps
  
  WORKS WHEN:
    Service dependencies span clusters
    Coordinated start/stop matters
    
  TIMING:
    Workload-type matters more than region
    Sequenced execution per workload type
```

Pattern A is simplest. Pattern B handles timezones cleanly. Pattern C handles dependencies cleanly.

### When cross-cluster doesn't work

```
SCENARIO                                       ISSUE
─────────────────────────────────────────────────────────
Workloads have different names across clusters Group requires resource UID
                                                Not name; UID per cluster differs
                                                Group needs explicit member adds
                                                
Different timezones, want different             Schedule cron is per-schedule
schedules per region                            Not per-resource
                                                Use separate groups per region
                                                
Workloads have different configurations          Group is a label, not a config-
across clusters (replicas, etc.)                 alignment tool
                                                Each workload scales per its own
                                                config independently
                                                
Cross-region dependencies                        Service-A in cluster-A depends
                                                on service-B in cluster-B
                                                Scheduling them via group works
                                                but timing may be off
                                                Use sequenced execution
```

In these cases, prefer multiple groups (one per region or type) over one global group.

### Multi-cluster permissions

ZopNight needs IAM credentials for each cluster's K8s API:

```
AWS (EKS):
  IAM with eks:DescribeCluster + eks:UpdateClusterConfig
  Plus IRSA role for kubectl access (workloads-level)
  Per-cluster IAM scoping
  
GCP (GKE):
  GKE Service Account with cluster read/update permissions
  
Azure (AKS):
  AKS service principal with cluster read/update permissions

PER-CLUSTER SCOPING:
  Permissions scoped per cluster
  ZopNight cannot modify a cluster it doesn't have credentials for
  
ADDING A CLUSTER:
  Provide credentials; cluster appears in discovery
  Workloads discovered
  Now eligible for cross-cluster groups
```

The permissions are explicit per cluster. No silent cross-cluster access.

### Tag-based group membership

For very large multi-cluster estates, group membership can be tag-driven:

```
RULE: All K8s workloads with tag "environment=staging"
  Match across all clusters
  Auto-populate the group as new workloads are discovered with the tag
  
REQUIREMENTS:
  Tagging discipline (which workloads carry which tags)
  Auto-tagger or manual tagging
  Periodic rediscovery to pick up newly-tagged workloads
  
SELF-MAINTAINING:
  New workload tagged environment=staging → auto-added
  Workload tag removed → auto-removed from group
  Group reflects reality without manual updates
```

Tag-based groups self-maintain as the estate evolves. This is the steady-state for large orgs.

### Audit + observability across clusters

```
PER-CLUSTER AUDIT trail:
  Each cluster's K8s API call logged
  Cluster ID + workload + action + result
  
GROUP-LEVEL summary:
  Group: 3 workloads across 3 clusters
  Schedule cron fired at 2026-05-21T08:00:00Z
  Results: 3 of 3 succeeded
  Detail per cluster available
  
TROUBLESHOOTING:
  "Why didn't payment-api start in eu-west-1?"
  → Per-cluster audit shows the specific failure
  → Cluster credentials? Network? Workload state?
```

The audit trail makes cross-cluster debugging tractable.

### Failure recovery

```
PARTIAL FAILURES are normal at scale:

  Group spans 10 clusters
  Schedule fires
  9 clusters: success
  1 cluster: fails (API rate-limited or transient)
  
RECOVERY OPTIONS:
  Idempotent retry: schedule fires again next cycle
                   ZopNight retries the failed cluster
                   Eventually succeeds
                   
  Manual retry: operator triggers retry
                For the specific cluster
                Immediate
                
  Investigation: if persistent failure
                Per-cluster diagnosis
                May require cluster-specific fix
```

The architecture handles partial failures gracefully.

---

## 2. Demo

A team's multi-cluster scheduling rollout:

```
ESTATE: 6 clusters across 3 regions, ~280 non-prod workloads

STEP 1 — IDENTIFY GROUP STRUCTURE:
  Pattern B (per-region) chosen
  Reasoning: clean timezone handling
  
  Groups planned:
    payment-api-us
    payment-api-eu
    payment-api-asia
    Similar groups for other services

STEP 2 — POPULATE GROUPS:
  payment-api-us: find all payment-api resources in us-east-1 clusters
                  (across 2 clusters in that region)
  payment-api-eu: find all payment-api resources in eu clusters
  payment-api-asia: same for asia
  
  Tag-based selectors:
    region=us-east AND app=payment-api
    region=eu AND app=payment-api
    region=asia AND app=payment-api

STEP 3 — ATTACH SCHEDULES:
  business-hours-us schedule on payment-api-us
    Timezone: America/New_York
    
  business-hours-eu schedule on payment-api-eu
    Timezone: Europe/London
    
  business-hours-asia schedule on payment-api-asia
    Timezone: Asia/Kolkata

EXECUTION:
  Each region's payment-apis follow their region's business hours
  No timezone mishaps
  Each cluster's payment-api scales independently in its region
  
RESULTS (1 month in):
  Aggregate savings: ~$8,200/mo across 6 clusters' non-prod workloads
  Average scaling time: <30 seconds per cluster
  Failure rate: <0.1% (idempotent retry handles)
  Incidents: 0
  Engineer satisfaction: high
```

Pattern B (per-region grouping) handles the multi-region complexity cleanly.

---

## 3. Hands-on (5 min)

Design cross-cluster scheduling for your estate:

```
□ STEP 1: Inventory
  Clusters: _____
  Regions: _____
  Major workload types: __________

□ STEP 2: Pick pattern
  □ A: Single global group (simplest)
  □ B: Per-region groups (timezone handling)
  □ C: Workload-based (dependency handling)

□ STEP 3: Design groups
  Group 1: __________ — Members: __________
  Group 2: __________ — Members: __________

□ STEP 4: Plan schedules
  Each group's schedule + timezone

□ STEP 5: Verify permissions
  Each cluster has correct IAM? □ Yes □ No
  Test cluster access from ZopNight: __________
```

A 30-minute design exercise. Per-region pattern often the right starting point.

---

## 4. Knowledge check

### Q1
A group spans 3 clusters. One cluster's K8s API fails during a scheduled stop. What happens:

A. All clusters fail (transactional)
B. The 2 successful clusters proceed; the failing cluster's action is logged. Idempotent retries are possible. The independent-per-cluster execution handles failures gracefully.
C. Random
D. Discovery stops

<details>
<summary>Show answer</summary>

**Correct: B.** Idempotent retries per cluster; failures don't cascade.
</details>

### Q2
For workloads across regions in 3 different timezones, the recommended pattern is:

A. One global group with UTC schedule
B. Per-region groups (each with its own schedule + timezone). Pattern B handles timezones cleanly; each region's workloads follow their local business hours. Pattern A would force all regions onto one UTC schedule, which doesn't match local engineer availability.
C. Per-cluster groups
D. No grouping

<details>
<summary>Show answer</summary>

**Correct: B.** Per-region groups handle timezones cleanly.
</details>

### Q3
Tag-based group membership auto-populates as:

A. New workloads discovered with matching tags are added on next discovery sync
B. New workloads with matching tags are auto-added; removed workloads are auto-removed. Tag-driven membership is self-maintaining. Group reflects reality without manual updates.
C. Only manually
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Tag-driven self-maintenance.
</details>

---

## 5. Apply

Multi-cluster groups are created the same way as single-cluster ones. The filter machinery lets you select workloads across clusters by tag, region, or name.

For your team: design groups intentionally; per-region usually right for multi-region; tag-based for self-maintaining.

---

## Module quiz

Complete M2.6 → 10-question module quiz unlocks the **K8s-Scheduler** chip.

---

## Related lessons

- [L1 — Why K8s is hard](L1_why_k8s_hard.md)
- [L2 — Hierarchy](L2_hierarchy.md)
- [L3 — Deployment to zero](L3_deployment_zero.md)
- [L4 — Suspend cronjobs](L4_suspend_cronjobs.md)
- [L5 — StatefulSets](L5_statefulsets.md)
- [T1.M1.4 — Resource groups](../../T1_zopnight_operator/M1.4_resource_groups/00_README.md)

## Glossary terms touched

[Cross-cluster group](../../../reference/glossary/cross-cluster-group.md) · [Per-region pattern](../../../reference/glossary/per-region-pattern.md) · [Tag-based membership](../../../reference/glossary/tag-based-membership.md) · [Multi-cluster permission scoping](../../../reference/glossary/multi-cluster-permission-scoping.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L6
