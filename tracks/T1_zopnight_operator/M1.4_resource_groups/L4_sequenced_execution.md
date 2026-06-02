# Sequenced execution — storage / compute / app

§ T1 · M1.4 · L4 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** sequenced execution within a group **and choose** between auto and custom ordering based on workload dependencies.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop my app from trying to start before its database is up." |
| **Personas** | Platform Engineer |
| **Prerequisites** | [L1–L3](L1_why_groups.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply) and Choose (Evaluate) |

---

## 1. Concept

When a schedule fires on a group with many members, ZopNight needs to know what order to start (or stop) them in. Naive "all at once" parallelism works for independent resources but breaks dependency chains — an application starting before its database is available will fail.

**Sequenced execution** lets a group specify an ordering: storage tier first, compute tier second, app tier third (for start); reverse for stop.

### The default order — auto-sequencing

ZopNight ships with sensible defaults based on resource type:

```
TIER    TYPICAL RESOURCES                START ORDER       STOP ORDER
─────────────────────────────────────────────────────────────────────
1       Databases (RDS, CloudSQL,         FIRST              LAST
        Azure SQL, Cosmos),
        Persistent storage (EBS,
        Persistent Disks, Managed Disks),
        Caches (ElastiCache, Memorystore)

2       Compute (EC2, GCE, Azure VMs,     SECOND             SECOND
        ECS, EKS nodes, GKE nodes,
        AKS nodes)

3       Application / orchestration       THIRD              FIRST
        (Lambda concurrency, container
        services, load balancers,
        autoscalers)
```

The default is: storage first, compute next, application last (for start). Reverse for stop (app first to drain traffic, then compute, then storage). This matches the typical layered-architecture assumption: app depends on compute depends on storage.

**Auto-sequencing covers 80% of cases.** Most groups need no custom configuration.

### Custom sequencing

For workloads with non-standard dependencies:

```
EXAMPLE: A group with 12 resources.
  - 2 RDS instances (db-orders, db-users)
  - 6 EC2 instances (4 app servers, 2 batch workers)
  - 2 ECS services (api-service, worker-service)
  - 1 Lambda function
  - 1 ALB

DEFAULT auto-sequencing would group them by tier (storage / compute / app).
But the team knows:
  - db-orders MUST start before db-users (replication dependency)
  - app servers MUST start before batch workers (registry dependency)
  - api-service waits for app servers; worker-service is independent

CUSTOM SEQUENCE (start order):
  Position 1: db-orders        (RDS, tier 1)
  Position 2: db-users         (RDS, tier 1, depends on db-orders)
  Position 3: app-server-1     (EC2, tier 2)
  Position 4: app-server-2     (EC2, tier 2)
  Position 5: app-server-3     (EC2, tier 2)
  Position 6: app-server-4     (EC2, tier 2)
  Position 7: batch-worker-1   (EC2, depends on app servers)
  Position 8: batch-worker-2   (EC2, depends on app servers)
  Position 9: api-service      (ECS, depends on app servers)
  Position 10: worker-service  (ECS, independent — could move earlier)
  Position 11: lambda-X        (Lambda)
  Position 12: alb-main        (ALB, last)
```

The custom sequence runs strictly in order. Each step waits for the previous to complete (with timeout) before proceeding.

### Per-step delay

For workloads that need warm-up time even after a successful start:

```
SEQUENCE WITH DELAYS
  Position 1: db-orders                                  (no delay)
  Position 2: db-users                Wait 60s after
                                       db-orders before
                                       starting db-users
  Position 3: app-server-1            Wait 120s after
                                       db-users (DB warm-up)
  ...
```

Per-step delay specifies how long ZopNight waits after the previous resource is confirmed-started before starting the next. Useful for warm-cache scenarios, DB replication setup, or service-mesh propagation.

### Stop sequence

For stop, the default sequence reverses (app → compute → storage). Custom sequence is also reversible: ZopNight applies the reverse of the start order on stop, unless the user explicitly defines a separate stop sequence.

### When auto vs custom

```
WORKLOAD PROFILE                              SEQUENCING
─────────────────────────────────────────────────────────
Independent resources                         Auto (tier-based)
Layered architecture (web → app → db)         Auto works
Complex dependencies (replica chains,         Custom
  service mesh ordering)
Warm-up requirements (>30s after start)       Custom with delays
Pure compute groups (no DBs, no app tier)     Auto
```

Most teams start with auto. Move to custom when a specific failure ("the app tried to start before the cache was ready") motivates it.

### Failure handling

If a step in the sequence fails (e.g., a DB times out during start):

```
- The sequence pauses
- The action status panel shows the failure
- Subsequent steps are NOT attempted
- The team is notified (per notification routing)
- The team investigates the root cause
```

Failures do not cascade silently. The intent is to halt and let humans diagnose rather than mass-start everything despite a missing dependency.

For groups with retry tolerance, the schedule can be configured to retry the failed step up to N times with exponential backoff (default: 3 retries). After exhaustion, the failure is logged and the sequence continues from the next step.

### Tag-based custom ordering

For teams that prefer declarative sequencing (vs UI-based drag-drop), resources can carry a sequence tag:

```
Tag: zopnight:start-order = "1"     for db-orders
Tag: zopnight:start-order = "2"     for db-users
Tag: zopnight:start-order = "3"     for app-server-1
...
```

ZopNight reads the tag and orders the sequence accordingly. Tag-driven sequencing scales better than UI clicks for large groups.

---

## 2. Demo

A team's workflow for sequencing a multi-tier app:

```
WORKLOAD: prod-billing-stack
  Members: 1× RDS, 1× ElastiCache Redis, 3× EC2 app servers, 1× ALB

INITIAL APPROACH: Auto-sequencing
  - Tier 1 (storage): RDS, ElastiCache start first (parallel)
  - Tier 2 (compute): 3 EC2 servers start in parallel
  - Tier 3 (app): ALB activated last
  
TESTED: Schedule fires for the first time. Works on Day 1.

DAY 14: An ElastiCache restart takes 90 seconds (cold cache warm-up).
The EC2 app servers start at +30 seconds (default tier delay) but fail
because the cache isn't warm yet.

DIAGNOSIS: The default sequencing is right (cache before app), but the
default delay between tiers (30s) is too short for this workload's
cache warm-up.

FIX: Switch to custom sequencing with per-step delay:
  Position 1: RDS                             (no delay)
  Position 2: ElastiCache    (parallel with RDS)
  Position 3: app-server-1    Wait 120s after ElastiCache
  Position 4: app-server-2    Wait 120s after ElastiCache (concurrent with #3)
  Position 5: app-server-3    Wait 120s after ElastiCache (concurrent)
  Position 6: ALB              Wait 30s after app servers
  
Re-test. Day 15 schedule fires cleanly. No more cold-start failures.
```

The team kept the schedule cadence; they tuned the sequence within the group.

(Asset: `assets/diagrams/M1.4_L4_sequenced_start.svg`.)

---

## 3. Hands-on (6 min)

For a multi-tier group you can experiment with (use a sandbox):

```
1. Open the group → Settings → Execution Order tab.
2. Note the current setting (Auto or Custom).
3. If Auto: review what tiers ZopNight inferred from the member resource
   types. Confirm the order makes sense for your workload.
4. If your workload has non-default dependencies:
   - Switch to Custom
   - Drag-drop the members into the right order
   - Add per-step delays where needed
   - Save
5. Trigger the schedule (or wait for the next firing).
6. Watch the action status panel to verify sequencing fires in order.

If a step fails, read the error. Most failures are:
  - Permission missing (fix via M1.1)
  - Cloud-side timeout (extend the per-step delay)
  - Dependency mismatch (reorder)
```

---

## 4. Knowledge check

### Q1
The default sequencing order (auto) starts:

A. Compute first, then storage, then app
B. Storage first (DBs, persistent disks, caches), compute second (VMs, container nodes), app last (load balancers, autoscalers, Lambda concurrency). Stop reverses the order.
C. All at once
D. In random order

<details>
<summary>Show answer</summary>

**Correct: B.** Storage → compute → app for start. Reverse for stop. Matches the typical layered-architecture dependency assumption.
</details>

### Q2
A team's app servers fail to start because their ElastiCache takes 90 seconds to warm up. The right fix is:

A. Auto-sequencing is broken
B. Switch to custom sequencing with a per-step delay of >90 seconds between cache and app servers. Auto handled the tier order correctly; the warm-up requirement was the gap.
C. Restart the app servers manually
D. Disable the cache

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-sequencing handled tier order. The fix is per-step delay tuning, which is a custom-sequence feature.
</details>

### Q3
A step in a sequence fails. The expected behavior is:

A. The sequence continues with the next step
B. The sequence pauses, the failure is logged with diagnostic detail, subsequent steps are NOT attempted, and the team is notified. Halt-and-diagnose is the default.
C. The entire group is stopped
D. The schedule deletes itself

<details>
<summary>Show answer</summary>

**Correct: B.** Halt-and-diagnose prevents cascading failures where the system would attempt to start dependent resources without their dependencies. The team investigates rather than mass-failures auto-cascading.
</details>

---

## 5. Apply

Sequencing is configured per-group:

- **[Group detail → Execution Order tab](https://app.zopnight.com/resource-groups)** — auto or custom
- **Per-step delays** — configurable per position in custom mode
- **Tag-driven ordering** — via `zopnight:start-order` tag for declarative control
- **Action status panel** — shows sequence progress during firing

For groups with retry configuration, see the per-rule retry settings under organization settings.

---

## Module quiz

You have now completed all four lessons of M1.4. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.4-quiz](../../../certifications/operator/m1.4-quiz.md). Pass to earn the **Group-Architect** chip.

---

## Related lessons

- [M1.5 — Overrides](../M1.5_overrides/00_README.md) *(next module)*
- [T5.M5.2 — Schedule design patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Sequenced execution](../../../reference/glossary/sequenced-execution.md) · [Auto-sequencing](../../../reference/glossary/auto-sequencing.md) · [Custom sequence](../../../reference/glossary/custom-sequence.md) · [Per-step delay](../../../reference/glossary/per-step-delay.md) · [Tier (resource)](../../../reference/glossary/tier-resource.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.4.L4
