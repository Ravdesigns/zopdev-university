# Suspending CronJobs

§ T2 · M2.6 · L4 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **suspend** K8s CronJobs to skip executions, **resume** them on schedule, **and handle** concurrent jobs gracefully.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pause CronJobs during off-hours / freezes / maintenance without losing their config or history." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.6.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Suspend (Apply), Resume (Apply), Handle (Apply) |

---

## 1. Concept

CronJobs in K8s have a native `spec.suspend` boolean. When `suspend: true`, the CronJob skips its next scheduled execution. ZopNight uses this directly — set suspend=true on stop, suspend=false on start.

```
SUSPEND PATTERN:
  K8s-native; non-destructive
  Skips next execution
  Preserves config + history
  Reversible instantly
```

The pattern matches how the K8s ecosystem already handles CronJob pause.

### Why suspend (not delete)

```
SUSPENDING preserves:
  CronJob's history (past job runs visible)
  Configuration (spec.schedule, concurrencyPolicy, etc.)
  Lineage (annotations, labels)
  
DELETING + RECREATING would:
  Lose job history
  Risk concurrency issues during recreation
  Require re-applying the YAML manifest
  Cause cascading impact if other things reference the CronJob name

CONCLUSION: suspend is the K8s-native way to "pause" a CronJob
            Delete only when permanently retiring
```

The pause/resume cycle is the right primitive.

### What suspend does

```
BEFORE (active):
  CronJob: nightly-cleanup
  Spec.schedule: "0 2 * * *" (daily at 2 AM)
  Spec.suspend: false
  Result: fires every day at 2 AM; creates a Job; runs

AFTER (suspended):
  CronJob: nightly-cleanup
  Spec.schedule: "0 2 * * *" (unchanged)
  Spec.suspend: true
  Result: scheduled time passes without firing. No Job created.
  
AFTER RESUME:
  Spec.suspend: false
  Result: next scheduled time fires normally
  Past skipped times do NOT backfill
```

The K8s scheduler simply checks `suspend` before firing. Skipped times are gone forever — no backfill.

### When to use CronJob suspend

```
PATTERN                                  SUSPEND DURING
─────────────────────────────────────────────────────────
Maintenance window                       The window
Cost-aggressive non-prod cleanup         Weekends
Tooling that runs on prod only           Non-prod cluster
Failed job (until investigation)         Until fixed
Holiday freeze                            The freeze period
Compliance / audit window                During audit
Pre-launch traffic ramp                   During ramp (avoid interference)
```

The use cases are broad. Suspend is the right tool for "pause this CronJob for a defined window."

### How ZopNight schedules CronJob suspend

```
SUSPEND CYCLE:

T+0      Cron stop fires
T+1s     ZopNight: kubectl patch cronjob/nightly-cleanup
         -p '{"spec":{"suspend":true}}'
T+2s     K8s confirms patch
T+2s     CronJob is suspended

T+12h    Cron start fires
T+1s     ZopNight: kubectl patch cronjob/nightly-cleanup
         -p '{"spec":{"suspend":false}}'
T+2s     K8s confirms patch
T+2s     CronJob is active; next scheduled time fires normally

CHARACTERISTICS:
  Two patches per cycle
  Idempotent (suspend=true if already true is no-op)
  Fast (seconds)
  Audit logged
```

The pattern is simple + cheap. Most CronJob scheduling is this.

### Concurrency policy interaction

```
CronJob's concurrencyPolicy field:
  
  Allow:    Multiple Jobs can run concurrently (default)
  Forbid:   If a Job is still running, new ones are skipped
  Replace:  New Jobs replace currently-running one

SUSPENDING A CRONJOB:
  Doesn't affect Jobs currently running
  They complete normally per their concurrency policy
  Only affects NEW scheduled executions
  
NEXT SCHEDULED TIME AFTER RESUME:
  Continues per the policy
  No backfill of skipped times
```

The concurrencyPolicy is independent of suspend; they coexist.

### What happens to already-running jobs

```
A SCHEDULED STOP on a CronJob does NOT affect:
  Jobs already in progress (they complete)
  Pods of running Jobs (they keep running)
  
ONLY new scheduled executions are affected.
The next time the CronJob would fire: doesn't fire (suspend=true).

IF YOU NEED to stop in-progress jobs:
  More invasive action required
  Manually: kubectl delete job <job-name>
  ZopNight's K8s scheduling doesn't kill running jobs by default
  Conservative approach: don't interrupt running work
```

The conservative behavior is intentional. Killing in-progress jobs would be too aggressive.

### Suspending vs scaling parent Deployment

Sometimes a workload involves both:

```
A LONG-RUNNING DEPLOYMENT processes a queue
A CRONJOB publishes work to the queue

IF BOTH ARE NON-PROD, scheduling both gives:
  Stop Deployment at 8 PM (replicas → 0)
  Stop CronJob at 8 PM (suspend → true)
  Start CronJob at 8 AM (suspend → false)
  Start Deployment at 8 AM (replicas → restored)
  
ORDER MATTERS:
  Deployment should start before CronJob fires
  Otherwise: CronJob creates work; nothing to process
  
SOLUTION:
  Sequenced execution (T1.M1.4.L4)
  Start Deployment at 7:55 AM
  Start CronJob at 8:00 AM
  Stop sequence: opposite order
```

The sequencing handles coordinated workloads cleanly.

### Audit + observability

```
EVERY SUSPEND / RESUME logged:
  Timestamp
  CronJob name + namespace
  Action (suspend / resume)
  User (ZopNight automation)
  Cluster
  
VISIBLE IN:
  ZopNight: workload detail → events tab
  K8s: kubectl describe cronjob/<name>
  Cloud-provider event log
  
TROUBLESHOOTING:
  "Why didn't this job run on Sunday?" → events show suspend on Saturday
  "Why are jobs running off-hours?" → events show no suspend; check schedule
```

The audit trail explains every skipped or run execution.

---

## 2. Demo

A team's CronJob scheduling:

```
WORKLOAD: nightly-cleanup CronJob in staging cluster
  Schedule: 0 2 * * * (2 AM daily)
  Purpose: scrub old test data
  
STAGING CLUSTER PATTERN:
  Engineers don't use staging on weekends
  The cleanup is unnecessary off-hours
  
ZOPNIGHT SCHEDULE:
  business-hours-staging cron:
    0 0 * * 6 stop (Saturday midnight)
    0 8 * * 1 start (Monday 8 AM)
  Attached to: nightly-cleanup CronJob

RESULT:
  Saturday 00:00: suspend=true
  Sunday 02:00:    job skipped (still suspended)
  Monday 08:00:    suspend=false
  Tuesday 02:00:   next normal run
  
COST SAVINGS:
  1 Job execution per weekend = 52 Job runs / year
  At ~$0.05 per Job run (resources): ~$2.60/year per CronJob
  
ACROSS THE ESTATE:
  Many CronJobs follow same pattern
  Aggregate savings: meaningful (~$50-200/year typical)
  
PLUS: indirect savings:
  Not running cleanup means data not modified
  Avoids re-creating test data after cleanup
  Smoother Monday morning startup
```

Small per-CronJob, useful in aggregate, structurally safer than not scheduling.

---

## 3. Hands-on (5 min)

Schedule a CronJob:

```
□ STEP 1: Find a CronJob in your cluster
  Workload: __________
  Schedule: __________
  Suspend status: __________

□ STEP 2: Attach to a schedule
  Schedule name: __________
  Stop time: __________
  Start time: __________

□ STEP 3: Trigger stop cron (or wait)
  Verify suspend=true:
  $ kubectl get cronjob <name> -o yaml | grep suspend
  Expected: suspend: true

□ STEP 4: Verify resume
  $ kubectl get cronjob <name> -o yaml | grep suspend
  Expected: suspend: false

□ STEP 5: Verify no missed-time backfill
  $ kubectl get cronjob <name>
  Last schedule time: should be next future time, not skipped past
```

A 10-minute exercise builds CronJob scheduling confidence.

---

## 4. Knowledge check

### Q1
Suspending a CronJob:

A. Stops in-progress Jobs immediately
B. Sets spec.suspend=true. The next scheduled time skips. In-progress Jobs continue running. Conservative behavior — don't interrupt running work. If you need to kill running jobs: separate manual action.
C. Deletes the CronJob
D. Pauses Pods

<details>
<summary>Show answer</summary>

**Correct: B.** Suspend = skip next, not stop running.
</details>

### Q2
Suspending a CronJob preserves:

A. Nothing
B. The schedule, configuration, history, concurrency policy. Only the skipping of scheduled times changes. Resume = reset to normal. Non-destructive operation.
C. Just the schedule
D. Just history

<details>
<summary>Show answer</summary>

**Correct: B.** Suspend is non-destructive.
</details>

### Q3
A team suspends a CronJob on Saturday. On Sunday at 2 AM, the CronJob is still suspended. What happens:

A. The Job runs anyway
B. The Job skips. Sunday 2 AM passes without firing. Resume on Monday makes the next future scheduled time fire. Past skipped times do NOT backfill — they're gone forever.
C. Random
D. AWS schedules

<details>
<summary>Show answer</summary>

**Correct: B.** Suspended = skip. Resume = future times fire (no backfill).
</details>

---

## 5. Apply

CronJob scheduling is on the CronJob's detail page. Attach a schedule. Same UI pattern as Deployment.

For your team: identify non-essential CronJobs in non-prod; schedule them.

---

## Related lessons

- [L1 — Why K8s is hard](L1_why_k8s_hard.md)
- [L2 — Hierarchy](L2_hierarchy.md)
- [L3 — Deployment to zero](L3_deployment_zero.md)
- [L5 — StatefulSets](L5_statefulsets.md) *(next)*
- [L6 — Cross-cluster patterns](L6_cross_cluster.md)
- [T1.M1.4.L4 — Sequenced execution](../../T1_zopnight_operator/M1.4_resource_groups/L4_sequenced_execution.md)

## Glossary terms touched

[CronJob suspend](../../../reference/glossary/cronjob-suspend.md) · [Suspend pattern](../../../reference/glossary/suspend-pattern.md) · [Concurrency policy](../../../reference/glossary/concurrency-policy.md) · [No backfill](../../../reference/glossary/no-backfill.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.6.L4
