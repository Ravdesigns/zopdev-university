# Scheduling clusters

§ T2 · M2.7 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** Databricks autoterm from ZopNight cluster scheduling, **combine** the two layers effectively, **and handle** the timing edge cases.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule Databricks clusters cleanly — combining Databricks' own autoterm with ZopNight's daily lifecycle." |
| **Personas** | Data Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.7.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Combine (Synthesize), Handle (Apply) |

---

## 1. Concept

Databricks Clusters have built-in autotermination: idle clusters terminate after a configurable timeout (5-2880 minutes). This is Databricks-native. ZopNight scheduling is at a different layer.

```
TWO LAYERS OF COST CONTROL:
  
  AUTOTERM (Databricks-native):
    Mid-day idle handler
    Configurable per cluster (5-2880 minutes)
    Default: 60-120 min for most clusters
    
  ZOPNIGHT SCHEDULE:
    Daily lifecycle (start/stop times)
    Independent of activity
    Handles always-on clusters
    
  Both work together; complementary
```

The right setup combines both for best cost control.

### Databricks autoterm — the baseline

```
CLUSTER CONFIG (Databricks-native):
  autotermination_minutes: 30

BEHAVIOR:
  Cluster is idle for 30 minutes → cluster terminates
  Cost stops during the off-period
  Cluster restarts on next use
  
EXAMPLE timing:
  10:00 AM: cluster active
  10:30 AM: no jobs running
  11:00 AM: 30 min idle; cluster auto-terminates
  2:00 PM: user starts new job
  2:00 PM: cluster cold-starts; ~3 min
  2:03 PM: cluster ready; job runs
```

This is the default cost optimization for interactive clusters. Most clusters should have autoterm set.

### ZopNight cluster scheduling — daily lifecycle

```
CLUSTER CONFIG:
  Autotermination: 30 minutes (Databricks default kept)
  ZopNight schedule: business-hours-staging (8 AM - 8 PM)

BEHAVIOR:
  ZopNight's schedule fires:
    Stop at 8 PM: terminates cluster regardless of activity
    Start at 8 AM: ensures cluster is ready for the day

  Databricks autoterm still works:
    During business hours, an idle cluster still self-terminates
    after 30 minutes of no activity
```

The two layers work together. ZopNight handles the daily lifecycle; autoterm handles mid-day idle.

### When ZopNight scheduling matters

For Always-on clusters or clusters with critical activity:

```
SCENARIO: ml-training-cluster
  Configured for "always-on" (autoterm = 0)
  Reason: nightly training jobs run automatically

WITHOUT ZopNight:
  Cluster runs 168 hours/week
  Cost: ~$2,800/month

WITH ZopNight:
  Schedule cluster off weekends
  Train Monday-Friday only
  Savings: ~40% = $1,120/month
  
SCENARIO: dev-experiments-cluster
  Used by 5 engineers, weekdays only
  Currently always-on (autoterm = 120 min)
  Engineers leave it running for "fast start"
  
WITHOUT ZopNight:
  Cluster runs 168 hours/week
  Cost: $1,500/month
  
WITH ZopNight:
  Schedule off-hours stop
  Engineers wait 3 min for restart when they start work
  Cost: $600/month (-60%)
```

The clusters with autoterm=0 are the biggest opportunity. ZopNight adds the missing daily lifecycle.

### Cluster start latency

```
TYPICAL START LATENCY:
  ML cluster (10 nodes):           3-5 minutes
  Data engineering cluster (4 nodes): 2-3 minutes
  Dev cluster (1 node):             1-2 minutes
  
WITH INSTANCE POOL (pre-warmed):
  Any cluster size: 1-2 minutes
  Pool nodes warm; ready to attach to cluster
```

Schedule the start a few minutes before users need the cluster.

### Auto-start workflow on schedule

```
T+0      Cron fires
T+1s     ZopNight: Databricks API: clusters/start
T+2s     Databricks acknowledges
T+30s    Cluster transitioning to RUNNING
T+3 min  Cluster reaches Running state
T+3 min  Cluster ready for jobs
T+3 min  Notification fires (cluster ready)
```

Total start latency: ~3 minutes typical. Schedule the start cron 5 minutes earlier to ensure availability.

### Auto-stop workflow on schedule

```
T+0      Cron fires
T+1s     ZopNight: Databricks API: clusters/delete
T+5s     Databricks acknowledges
T+30s    Cluster fully stopped
T+30s    Cost meter stops
T+30s    Notification fires
```

Faster than start. Total stop time: <1 minute.

### Interactions with autoterm

```
SCENARIO: ZopNight scheduled stop at 8 PM
  But user is still active at 7:55 PM

BEHAVIOR:
  ZopNight schedule fires at 8 PM
  Cluster scaled down regardless of activity
  User's session interrupted
  
THIS IS INTENTIONAL:
  Schedule = explicit hours
  Activity detection = autoterm's job
  
IF USER NEEDS OVERRIDE:
  Use the Override system (T1.M1.5)
  Force-on the cluster for a few hours
  Schedule resumes after override expires
```

The override pattern handles the edge cases. Don't rely on schedule to detect activity.

### Save-on-stop for clusters

```
CLUSTERS save their state on schedule stop:
  Current cluster size
  Spark configuration
  Library installs
  Init scripts
  
ON SCHEDULE START:
  Recreate cluster with same configuration
  Same size; same libraries; same config
  Cold-start latency only (3-5 min typical)
  
NO DATA LOSS:
  Cluster is compute-only (state in workspace)
  Notebooks, code, data unaffected
```

The compute is ephemeral; everything else is preserved.

### Schedule patterns for Databricks

```
PATTERN A — BUSINESS HOURS (most common)
  Start: 7:55 AM Mon-Fri (5 min before users)
  Stop: 8:30 PM Mon-Fri
  Off all weekend
  Savings: ~50% vs always-on
  
PATTERN B — CONSERVATIVE OFF-HOURS
  Start: 7:00 AM Mon-Fri
  Stop: 11:00 PM Mon-Fri
  Off weekends
  Savings: ~30% vs always-on
  More forgiving of late work
  
PATTERN C — NIGHTLY BATCH WINDOW
  Start: 2:00 AM Mon-Fri (for nightly batches)
  Stop: 8:00 AM Mon-Fri (after batches done)
  Off all daytime + weekends
  For batch-only clusters
  Savings: ~80%
  
PATTERN D — ON-DEMAND ONLY (no scheduled start)
  Stop: every weekday at 8 PM (force cleanup)
  Start: only via user initiation
  For low-usage clusters
  Pre-warm via instance pool for fast start
```

The right pattern depends on usage pattern.

---

## 2. Demo

A team's data engineering cluster scheduling:

```
WORKLOAD: data-engineering-cluster, 4 nodes
  Used by 12 data engineers, weekdays 8 AM - 8 PM
  Currently configured: autoterm = 60 min

OBSERVED COST PATTERN:
  Average runtime: 8 hours/day × 5 days = 40 hours/week
  Friday afternoons sometimes idle 30+ minutes; autoterm fires
  Saturday/Sunday: cluster off entirely (autoterm fires)
  Cost: ~$140/week

WITH ZOPNIGHT SCHEDULE:
  business-hours-eng: 8 AM start, 8 PM stop (weekdays)
  
  REVISED for late-afternoon flexibility:
    business-hours-eng: 7:55 AM start, 8:30 PM stop
    Reason: Friday afternoons sometimes run late
    
  Cost: same hours; no autoterm wake-ups in middle of day
  (which were brief and didn't cost much)
  
  Real benefit:
    Predictable cluster availability for the team
    No waiting for cluster start when beginning work
    Clean cost reporting (no random autoterm cycles)
    
COMPARISON:
  Before ZopNight: Cost-per-week $140
                   Engineer wait time: 3 min ~3x/day per engineer
                   = ~150 engineer-minutes/week wasted
                   
  After ZopNight:  Cost-per-week $140 (unchanged; same hours)
                   Engineer wait time: 0 (cluster always ready 8 AM-8 PM)
                   = predictable + better UX
```

ZopNight's schedule changes the cost shape minimally but improves UX significantly.

---

## 3. Hands-on (5 min)

Schedule a Databricks cluster:

```
□ STEP 1: Pick a cluster
  Cluster: __________
  Autoterm setting: ___ minutes
  Currently always-on? □ Yes □ No
  Usage pattern: __________

□ STEP 2: Choose schedule pattern
  □ Business hours
  □ Conservative off-hours
  □ Nightly batch
  □ On-demand only

□ STEP 3: Set times
  Start cron: __________
  Stop cron: __________

□ STEP 4: Attach
  Schedule attached to cluster
  Effective from: __________

□ STEP 5: Monitor first cycle
  Did cluster start as expected? □ Yes □ No
  Engineer impact: __________
  Cost impact: $_____/week
```

A 10-minute exercise per cluster. Track cycle for first week.

---

## 4. Knowledge check

### Q1
Databricks autoterm vs ZopNight scheduling:

A. Conflict
B. Complement — autoterm handles mid-day idle; ZopNight handles daily lifecycle. Both work in parallel. The two layers cover different cost optimization concerns: idle (autoterm) and daily window (ZopNight).
C. Same thing
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Complementary layers.
</details>

### Q2
A cluster takes 3 minutes to start. Schedule cron should fire:

A. At the moment users need it
B. ~3-5 minutes earlier than user need (to account for startup latency). Schedule the start cron a few minutes ahead so cluster is ready when users arrive. Otherwise: brief wait at 8 AM.
C. 30 minutes earlier
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule a few minutes ahead for startup.
</details>

### Q3
A team uses cluster past the schedule's stop time. The schedule fires and stops it:

A. ZopNight backs off
B. Stop fires regardless. The Override system is the explicit mechanism for "keep this running past the schedule" — use that instead of relying on the schedule to detect activity. Schedules are explicit; activity detection is autoterm's job.
C. Random
D. Discovery fails

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule fires. Override is the explicit "keep running" tool.
</details>

---

## 5. Apply

Cluster scheduling is per-cluster. Attach via the cluster's detail page.

For your team: combine autoterm + ZopNight; use Override for edge cases; document the pattern.

---

## Related lessons

- [L1 — What's discovered](L1_what_is_discovered.md)
- [L3 — SQL warehouse](L3_sql_warehouse.md) *(next)*
- [L4 — Dependent jobs](L4_dependent_jobs.md)
- [T1.M1.5 — Override system](../../T1_zopnight_operator/M1.5_overrides/00_README.md)

## Glossary terms touched

[Databricks autoterm](../../../reference/glossary/databricks-autoterm.md) · [Cluster scheduling layer](../../../reference/glossary/cluster-scheduling-layer.md) · [Cold-start latency](../../../reference/glossary/cold-start-latency.md) · [Override + cluster](../../../reference/glossary/override-cluster.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.7.L2
