# What's discoverable in Databricks

§ T2 · M2.7 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** Databricks Workspaces, Clusters, Instance Pools, and SQL Warehouses in the parent-child hierarchy, **navigate** the discovered resources, **and explain** which entities drive cost.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the Databricks resource hierarchy so I can find every cost-relevant entity to schedule." |
| **Personas** | Data Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.1 (rule library) |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Apply), Navigate (Apply), Explain (Understand) |

---

## 1. Concept

Databricks (Azure-hosted, AWS Marketplace, GCP Marketplace) exposes a hierarchy: Workspace at the top, with Clusters, Instance Pools, and SQL Warehouses as children. ZopNight discovers each as a scheduling target.

```
DATABRICKS HIERARCHY:

Workspace: prod-databricks-eu
├── Clusters
│   ├── ml-training-cluster
│   ├── data-engineering-cluster
│   └── dev-experiments-cluster
├── Instance Pools
│   └── shared-ml-pool
└── SQL Warehouses
    ├── reporting-warehouse
    └── ad-hoc-warehouse
```

Four entity types, each schedulable. Different cost shapes; different scheduling patterns.

### Each component's purpose

```
WORKSPACE
  The Databricks tenant
  Per-region
  Has its own URL and authentication
  Container for all other entities
  
CLUSTER
  A Spark cluster — compute capacity for jobs and interactive notebooks
  Created on demand or kept running
  All-purpose or job-specific
  Major cost contributor
  
INSTANCE POOL
  Pre-warmed pool of nodes for fast cluster startup
  Pools have idle pods waiting
  Reduces cold-start latency
  
SQL WAREHOUSE
  Auto-scaling compute for SQL queries
  Modern Databricks SQL experience
  Sizes from X-Small to 4X-Large
  Auto-pause when idle (configurable)
```

The hierarchy is logical; cost-relevant components are at the right level.

### Scheduling targets

All four are schedulable:

```
WORKSPACE                  Pause/resume affects the whole workspace
                           All sub-entities follow
                           Coarse-grained; rarely the right level
                           
INDIVIDUAL CLUSTERS         Stop/start specific clusters
                           Most common scheduling pattern
                           Fine-grained control
                           
INSTANCE POOLS              Resize (pool of 0 = no idle nodes)
                           Back to N when ready
                           Reduces idle pool cost
                           
SQL WAREHOUSES              Stop (no autoterm needed) or scale
                           Auto-pause handles much already
                           Additional scheduling for hard-stop
```

The flexibility allows tuning for different workload patterns.

### Cost contribution by component

```
COMPONENT                 COST SHAPE
─────────────────────────────────────────────────────────────
Workspace                 Modest fixed cost
                          Few dollars/mo per workspace
                          Mostly metadata + control plane
                          
Clusters                  HIGH variable cost (compute hours)
                          Often the main cost driver
                          $10-1000+/hr depending on size
                          
Instance Pools            Idle pool size × hour
                          $50-500/mo per pool typical
                          Hidden cost; easy to forget
                          
SQL Warehouses            Active hours × warehouse size
                          Auto-pause helps
                          Still: $5-500/mo per warehouse
```

Clusters and SQL Warehouses are the major cost contributors. Pools matter at scale.

### Discovery scope

```
DISCOVERED (in scope):
  ✓ Workspaces (1+ per region)
  ✓ All Clusters in each workspace
  ✓ All Instance Pools in each workspace
  ✓ All SQL Warehouses in each workspace
  ✓ Per-resource state (running / stopped / idle)
  ✓ Configuration (size, autotermination, etc.)
  ✓ Tags

NOT DISCOVERED (out of scope):
  ✗ Notebooks (these aren't billable resources)
  ✗ Jobs (jobs run on clusters; cluster is billable entity)
  ✗ Tables, ML models (not billable in this scope)
  ✗ Users / permissions (not cost-relevant)
  ✗ MLflow experiments
  ✗ Delta Lake tables (storage is separate from compute)
```

The focus is on what costs money. Notebooks are just files; jobs are just schedulers; the cost lives in the compute (Cluster) running them.

### Workspace permission requirements

For ZopNight to discover Databricks resources:

```
PERMISSIONS NEEDED:
  Read on Workspace metadata
  List Clusters
  List Instance Pools
  List SQL Warehouses
  Per-resource: read state + config
  
ACTIONS for scheduling:
  Start/Stop Clusters (cluster:can_attach + can_manage)
  Resize Pools (pool:can_manage)
  Start/Stop SQL Warehouses (warehouses:can_use + can_manage)
  
TYPICAL SETUP:
  Service principal with Databricks workspace permissions
  Or: PAT scoped to the workspace
  ZopNight stores credentials per-workspace
```

The permission model is per-workspace. Onboard each workspace's credentials separately.

### Discovery frequency

```
DATABRICKS DISCOVERY: every 6 hours
  Same cadence as other cloud resources
  
WHAT CHANGES BETWEEN DISCOVERIES:
  Cluster state (running/idle/stopped)
  Cluster size (auto-scaled)
  SQL Warehouse state
  
FRESHNESS:
  Up to 6 hours stale
  Acceptable for cost optimization
  Real-time monitoring use different tools
```

The 6-hour cadence matches other resource discovery.

### How Databricks fits into the broader ZopNight model

```
DATABRICKS resources behave like other resources:
  Discovered automatically
  Show in Resources page
  Get cost calculated
  Get recommendations
  Can be scheduled
  Can be in groups
  Audit log captures actions
  
DIFFERENT:
  Compute units (DBU) vs traditional CPU/memory
  Workspace abstraction (no direct equivalent in AWS/GCP/Azure)
  Tight integration with Databricks API (not generic cloud)
```

Once discovered, Databricks resources behave like any other ZopNight resource.

---

## 2. Demo

A typical Databricks discovery:

```
DATABRICKS DISCOVERY:

T+0      Discovery cron runs for prod-aws-eu-1 (which has the Databricks Workspace)
T+30s    Found:
         
         Workspace: prod-databricks-eu (1)
           Children:
             Clusters: 3
               - ml-training (currently active, 12 nodes)
               - data-engineering (idle, 0 nodes pending)
               - dev-experiments (running, 2 nodes)
             Instance Pools: 1
               - shared-ml-pool (idle 4 nodes)
             SQL Warehouses: 2
               - reporting-warehouse (active, X-Small)
               - ad-hoc-warehouse (auto-paused)

T+30s    All children visible in ZopNight Resources page
T+30s    Cost data calculated per resource
T+30s    Recommendations begin computing

INSPECTION (5 min later):
  Resources page → filter type=databricks
  Workspace tree visible
  Each entity has:
    Current state
    Cost (latest 30 days)
    Recommendations (if any)
    Schedule attachment (if any)
```

The whole Databricks footprint becomes schedulable in 30 seconds of discovery.

---

## 3. Hands-on (5 min)

Explore your Databricks estate (if you have one):

```
□ STEP 1: Open Resources; filter type=databricks
  Workspaces: _____

□ STEP 2: Pick one workspace; drill in
  Clusters: _____
  Instance Pools: _____
  SQL Warehouses: _____

□ STEP 3: Note state of each cluster
  Currently running: _____
  Currently stopped: _____
  
□ STEP 4: Identify cost contributors
  Highest-cost cluster: __________
  Highest-cost SQL warehouse: __________
  Total Databricks spend (last 30 days): $_____

□ STEP 5: Check schedules
  Clusters scheduled: _____ / total
  Opportunity: _____ unscheduled clusters
```

A 10-minute exercise reveals the Databricks footprint.

---

## 4. Knowledge check

### Q1
Databricks Workspace has children:

A. Just Clusters
B. Clusters, Instance Pools, and SQL Warehouses. Three child entity types, all schedulable. Workspace is the container; the children are the cost-relevant entities.
C. Notebooks only
D. Jobs

<details>
<summary>Show answer</summary>

**Correct: B.** Three child types are schedulable.
</details>

### Q2
Notebooks and Jobs:

A. Are billable; ZopNight schedules them
B. Run on Clusters (the cluster is the billable entity). ZopNight doesn't discover them separately. Cost lives at Cluster/Warehouse level, not Notebook/Job level.
C. Random
D. Same as Workspace

<details>
<summary>Show answer</summary>

**Correct: B.** Cost lives at Cluster/Warehouse; not Notebook/Job.
</details>

### Q3
SQL Warehouses contribute cost via:

A. Idle time only
B. Active hours and the warehouse size. Auto-pause minimizes idle cost (default). But active queries on big warehouses get expensive fast — sizing + scheduling matter.
C. Random
D. Notebook count

<details>
<summary>Show answer</summary>

**Correct: B.** Active hours × size.
</details>

---

## 5. Apply

Databricks discovery via Azure account connection (or AWS Marketplace). Children appear under the Workspace.

For your team: navigate the hierarchy; identify cost contributors; plan schedules for L2-L4.

---

## Related lessons

- [L2 — Cluster scheduling](L2_cluster_scheduling.md) *(next)*
- [L3 — SQL warehouse](L3_sql_warehouse.md)
- [L4 — Dependent jobs](L4_dependent_jobs.md)

## Glossary terms touched

[Databricks Workspace](../../../reference/glossary/databricks-workspace.md) · [Databricks Cluster](../../../reference/glossary/databricks-cluster.md) · [Instance Pool](../../../reference/glossary/instance-pool.md) · [SQL Warehouse](../../../reference/glossary/sql-warehouse.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.7.L1
