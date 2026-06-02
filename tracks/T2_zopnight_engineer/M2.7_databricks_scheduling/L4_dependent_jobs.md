# Databricks + dependent jobs

§ T2 · M2.7 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** when scheduled Databricks downtime breaks job dependencies, **plan** the right resolution pattern (overlap / wake-for-job / job clusters), **and avoid** the common pitfalls.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule Databricks clusters without breaking the scheduled Jobs that depend on them." |
| **Personas** | Data Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.7.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Apply), Plan (Create), Avoid (Apply) |

---

## 1. Concept

Databricks Jobs (scheduled notebooks, pipelines) run on Clusters. If the cluster is scheduled off when a Job is expected to run, the Job will fail.

```
THE DEPENDENCY PROBLEM:
  
  Cluster scheduled off 8 PM - 8 AM
  Job scheduled to run at 2 AM
  
  At 2 AM: Job triggers
  Cluster: not running
  Result: Job FAILS
  
THIS IS A SCHEDULE CONFLICT
  Must be planned for
  ZopNight detects + warns
```

The conflict is predictable; ZopNight surfaces it at attachment time.

### The dependency graph

```
JOB                       RUNS ON                   SCHEDULE
─────────────────────────────────────────────────────────────────
ml-train-nightly          ml-cluster (12 nodes)     2 AM daily
data-pipeline-hourly      data-cluster (4 nodes)    hourly
report-warehouse-refresh  reporting-warehouse        6 AM daily
```

If the cluster is scheduled off at 2 AM, ml-train-nightly fails.

### Three resolution patterns

```
PATTERN A — SCHEDULE CLUSTER TO BE AVAILABLE
  Cluster runs during the Job's time
  Example: cluster business-hours 8 AM - 8 PM
  Job moved to 9 AM (instead of 2 AM)
  
  Result: Job runs successfully
  Trade-off: change Job schedule (may not match other constraints)

PATTERN B — WAKE CLUSTER FOR JOB
  Cluster ml-cluster schedule: 1:30 AM - 4 AM Mon-Fri
  (Plus regular business hours 8 AM - 8 PM)
  
  Cluster wakes just in time
  Job ml-train-nightly runs at 2 AM
  Cluster stops at 4 AM (after Job done)
  
  Result: Job runs; cost minimized
  Trade-off: precise timing required

PATTERN C — RUN JOB ON JOB CLUSTER
  Cluster ml-cluster: scheduled off
  Job configured to use Job cluster (one-time, ephemeral)
  
  Job triggers → Job cluster spawns
  Job runs
  Job cluster terminates
  
  Result: independent of any scheduled cluster
  Trade-off: each Job has cluster cold-start latency
```

The patterns trade off cost, complexity, and timing precision.

### ZopNight detects conflicts at schedule attachment

```
WARNING AT ATTACHMENT TIME:
─────────────────────────────────────────────────────────
This cluster has 3 dependent Jobs scheduled to run during
your selected off-hours:

  ml-train-nightly (2 AM daily, expects ml-cluster)
  hourly-pipeline (every hour, expects ml-cluster)
  weekly-report (Sun 11 PM, expects ml-cluster)

Scheduling the cluster off will cause these Jobs to fail.

Consider:
  Move Jobs to a different schedule
  Use Job clusters (one-time clusters per Job)
  Adjust cluster's schedule to overlap with Jobs

[Cancel]   [Attach anyway]
```

The warning catches the issue before the actual conflict. Customer explicitly chooses.

### Pattern A — change Job schedule

```
SIMPLE: change Job's schedule to match cluster availability

EXAMPLE:
  Cluster business-hours: 8 AM - 8 PM Mon-Fri
  Original Job: 2 AM daily (would fail when cluster off)
  
  Resolution: move Job to 9 AM weekdays
  Or: move to off-peak time within business hours
  
PROS:
  Simplest fix
  Single change point
  No new patterns
  
CONS:
  Job timing may not match other constraints
  Data freshness implications
  Coordination with other jobs needed
```

When Job timing is flexible: Pattern A is simplest.

### Pattern B — overlapping cluster schedule

```
WAKE THE CLUSTER for the Job, then sleep again

EXAMPLE:
  Job ml-train-nightly: 2 AM Mon-Fri only
  Cluster schedule: 1:30 AM - 4 AM Mon-Fri (for nightly Job)
  Plus: 8 AM - 8 PM (interactive use)
  
T+0      Schedule cron fires at 1:30 AM Tuesday
T+1s     ZopNight starts ml-cluster
T+3min   Cluster reaches Running; available for Jobs
T+30min  Job ml-train-nightly fires at 2 AM
T+1.5h   Job completes
T+2.5h   Schedule cron fires at 4 AM (stop cluster)
T+2.5h   Cluster fully stopped
  
TOTAL: cluster ran 2.5 hours
COST: vs 24-hour always-on, ~90% savings on this Job's compute

PROS:
  Precise timing
  Minimal cluster runtime
  
CONS:
  Multi-schedule complexity
  Coordination with Job schedule changes
```

Pattern B is precise: cluster runs only when needed.

### Pattern C — Job clusters

```
JOB CLUSTERS: Databricks's "one-time cluster" feature

CONFIGURATION:
  Job ml-train-nightly:
    Cluster setup: create new cluster, run, terminate
  
  Each scheduled Job run:
    Creates new cluster (cold-start ~3 min)
    Runs the Job
    Terminates cluster

ELIMINATES dependency on long-running cluster

PROS:
  Most cost-efficient for sporadic Jobs
  No cluster scheduling complexity
  Independent of other cluster lifecycle
  
CONS:
  Cold-start latency per Job run
  Less flexibility for interactive cluster use
  Best when Job-only workload
```

For production workloads with sporadic Jobs, this is often the cleanest pattern.

### When the conflict is unavoidable

```
SOMETIMES A JOB needs the specific cluster:
  Uses local files
  Custom Python environment
  Specific cached state
  
CANNOT EASILY MOVE TO JOB CLUSTER
  
RESOLUTION: Pattern B (overlap schedule)
  Cluster runs for Job's window
  Stops outside that window
```

The hard-dependency case requires Pattern B; no alternatives work cleanly.

### Manual override for exceptions

```
SCENARIO: Tonight at 10 PM, emergency ML training run needed
  Cluster is scheduled off at 8 PM

OVERRIDE:
  force-on cluster from 9:30 PM to midnight
  Reason: "emergency ML training requested by data team"
  
EFFECT:
  Stop cron fires at 8 PM but is skipped (override in effect)
  Cluster stays running until midnight
  At midnight: override expires; natural scheduled state resumes
  
NO BACKFILL of skipped crons; simple state model
```

The Override system (T1.M1.5) handles ad-hoc exceptions.

---

## 2. Demo

A team's transition from cluster-always-on to scheduled:

```
BEFORE:
  ml-cluster: always-on, 12 nodes, ~$2,800/month
  
  Jobs:
    ml-train-nightly: 2 AM daily, ~45 min runtime
    hourly-pipeline: every hour, ~5 min runtime
    weekly-report: Sun 11 PM, ~2 hours runtime
  
  Cluster runs 24/7 to support sporadic Jobs

ZOPNIGHT detected conflict when attaching business-hours schedule:
  Warning listed all 3 Jobs as dependent
  
DECISION: mix of patterns
  ml-train-nightly: Pattern B (cluster wakes at 1:30 AM, stops at 4 AM)
  hourly-pipeline: Pattern C (use Job cluster — each hour spawns own)
  weekly-report: Pattern B (cluster wakes Sunday 10:30 PM, runs report,
                            stops at 1 AM Monday)

WEEKLY SCHEDULE for ml-cluster:
  Mon-Fri:
    8 AM - 8 PM: Running (interactive use)
    1:30 AM - 4 AM (Mon-Fri): Running (for nightly train)
    Otherwise: Off
  Sat: Off entirely
  Sun:
    10:30 PM - 1 AM Mon: Running (weekly report)
    Otherwise: Off

PER-JOB CONFIGURATION:
  ml-train-nightly: stays on existing cluster
  hourly-pipeline: switched to Job cluster (per Databricks UI)
  weekly-report: stays on existing cluster

ROLLOUT (gradual):
  Week 1: switch hourly-pipeline to Job cluster
          Verify hourly runs working
  Week 2: attach ml-cluster schedule
          Monitor weekday cluster lifecycle
  Week 3: monitor for the next weekly-report Sunday
          Verify cluster wakes; report runs; cluster stops

NEW COST: ~$1,400/month (50% reduction)
ALL JOBS continue to work
NO INCIDENTS
```

The mix of patterns optimized cost without breaking workflows.

---

## 3. Hands-on (5 min)

Audit your Databricks Job dependencies:

```
□ STEP 1: List Jobs
  Job 1: __________   Cluster: __________   Time: __________
  Job 2: __________   Cluster: __________   Time: __________
  Job 3: __________   Cluster: __________   Time: __________

□ STEP 2: Identify conflicts with proposed schedule
  Cluster proposed off-hours: __________
  Jobs that would conflict: _____

□ STEP 3: Pick resolution per Job
  Job 1: □ A (change time)  □ B (overlap)  □ C (Job cluster)
  Job 2: same
  Job 3: same

□ STEP 4: Estimate cost impact
  Cluster runtime reduction: _____%
  Cost savings: $_____/mo

□ STEP 5: Roll out gradually
  First Job change: __________
  Verification period: ___ week(s)
```

A 15-minute exercise reveals the dependency map.

---

## 4. Knowledge check

### Q1
A Job runs at 2 AM but the cluster is scheduled off 8 PM - 8 AM. What happens?

A. Job runs anyway
B. Job fails. The cluster needs to be running for the Job. Use Pattern A (schedule cluster overlap), B (wake cluster for Job time), or C (use Job cluster). Cluster availability is the dependency.
C. Random
D. Discovery error

<details>
<summary>Show answer</summary>

**Correct: B.** Cluster availability is the dependency.
</details>

### Q2
Pattern C (Job clusters) is best for:

A. All workloads
B. Workloads with sporadic Job runs and no need for cluster state between runs. Each Job creates its own cluster, runs, terminates. Independent of any scheduled cluster.
C. Random
D. ML training only

<details>
<summary>Show answer</summary>

**Correct: B.** Sporadic + no state = Job cluster.
</details>

### Q3
ZopNight detects a schedule-vs-Job conflict at attachment time. What does it do?

A. Refuses to attach
B. Shows a warning listing the affected Jobs. User chooses: cancel, or attach anyway (and resolve the conflict separately). The warning catches the issue before the actual conflict.
C. Auto-creates an override
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Warning + explicit choice.
</details>

---

## 5. Apply

ZopNight's attachment flow checks for Job dependencies on Databricks clusters and warns. Schedule design considers the dependency map.

For your team: audit Jobs before scheduling clusters; pick the right resolution per Job.

---

## Module quiz

Complete M2.7 → 10-question module quiz unlocks the **Databricks-Aware** chip.

---

## Related lessons

- [L1 — What's discovered](L1_what_is_discovered.md)
- [L2 — Cluster scheduling](L2_cluster_scheduling.md)
- [L3 — SQL warehouse](L3_sql_warehouse.md)
- [T1.M1.5 — Override system](../../T1_zopnight_operator/M1.5_overrides/00_README.md)

## Glossary terms touched

[Databricks Job](../../../reference/glossary/databricks-job.md) · [Job cluster](../../../reference/glossary/job-cluster.md) · [Dependency warning](../../../reference/glossary/dependency-warning.md) · [Wake-for-job pattern](../../../reference/glossary/wake-for-job-pattern.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.7.L4
