# Root cause analysis

§ T2 · M2.10 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **use** the root-cause analysis to diagnose anomalies, **read** probability rankings, **and investigate** when the top candidate is wrong.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get from anomaly to root cause in minutes, not hours, using ZopNight's automated analysis." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.10.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Use (Apply), Read (Apply), Investigate (Analyze) |

---

## 1. Concept

For each anomaly, the system computes a root-cause analysis: what kind of change explains the cost spike. This dramatically speeds investigation.

```
ANOMALY: org-level +200% spike yesterday
ROOT CAUSE ANALYSIS suggests:
  Most likely (60%): New resource provisioned in prod-aws-us-east-1
  Less likely (25%): Instance rate change (rate increase)
  Less likely (10%): Schedule failure (resource that should have stopped)
  Less likely (5%):  Reservation expiry
```

The analysis is probabilistic — these are signals, not certainties.

### Root cause categories

```
1. INSTANCE RATE CHANGE (resource resize)
   Detection: instance type changed; new rate applies
   Example: m5.large → m5.2xlarge mid-day
   Common: rightsizing decisions; experimentation
   
2. NEW RESOURCE
   Detection: resource UID not in yesterday's billing
   First time seeing it
   Common: provisioning by CI/CD; new feature
   
3. RESERVATION / SAVINGS PLAN EXPIRY
   Detection: known reservation end date matches the day
   Cost shifts to on-demand rate
   Common: end-of-quarter; forgot to renew
   
4. SCHEDULE FAILURE
   Detection: resource was supposed to be off but is running
   ZopNight schedule was meant to stop it
   Common: schedule misconfigured; override expired wrong
   
5. UNSCHEDULED RESOURCE USAGE INCREASE
   Detection: usage hours up but instance type unchanged
   Resource ran more hours than expected
   Common: stuck job; runaway loop; auto-scale to max
```

Each category corresponds to a specific signal pattern.

### How the analysis runs

```
FOR EACH ANOMALY:
  Compare yesterday's cost record to recent average
  Compare resource attributes:
    Instance type / class changed?
    Resource was previously unseen?
    Reservation coverage changed?
    State history shows unusual on-state?
    Activity log shows unusual operations?
  
  Score each cause class based on signal strength
  Surface top 3 causes with probability
  
SIGNAL SOURCES:
  cost_records (historical cost data)
  resource attributes (instance type, etc.)
  state history (when resources started/stopped)
  activity logs (CloudTrail equivalent)
```

The signal sources are the existing data; analysis just correlates.

### Acting on the analysis

```
ROOT CAUSE 1: NEW RESOURCE (60% probability)
  Action: identify the new resource by UID
  Investigate:
    Who provisioned it?
    What's its purpose?
    Is it expected?
  Decision: keep / terminate / schedule

ROOT CAUSE 2: INSTANCE RATE CHANGE (25%)
  Action: check the resource's instance type now vs yesterday
  Investigate:
    Who or what changed it?
    Was it intentional?
  Decision: revert / keep / schedule

ROOT CAUSE 3: RESERVATION EXPIRY (5%)
  Action: check reservation status; renewal needed?
  Decision: renew / switch to SP / accept on-demand
  
ROOT CAUSE 4: SCHEDULE FAILURE
  Action: check schedule + override status
  Investigate:
    Why didn't the stop fire?
    Was override accidentally extended?
  Decision: fix schedule / clean up override
```

Each root cause has a typical action path.

### When the analysis is wrong

The analysis is probabilistic. Top-ranked cause might be wrong:

```
ANOMALY: ml-training spike +300%
ANALYSIS suggests:
  New resource (60%)
  Schedule failure (30%)
  Other (10%)

INVESTIGATION:
  Check #1 first: New resource
  Look for new resource UIDs
  None found
  → Top candidate ruled out
  
  Check #2: Schedule failure
  Look at ml-training schedule + recent fires
  Schedule meant to stop at 8 PM yesterday
  Schedule didn't fire (failed)
  → Found the actual cause!

OUTCOME:
  Schedule failure was the right answer
  Ranked #2 in analysis
  Investigation confirmed it
  Operators should read all candidates, not just #1
```

The analysis is a starting point. Top probability isn't always right.

### The "no clear root cause" outcome

Sometimes the analysis can't pinpoint:

```
ANOMALY: org-level spike +50%
ANALYSIS: no clear single cause
  Possible: distributed small increases across multiple resources

SUGGESTED INVESTIGATION:
  Drill into team or resource-group dimensions
  For finer-grained signals
  Look for patterns of many small increases
  
INTERPRETATION:
  The cost spike isn't from one source
  Could be: 50 small resources each adding $20/day
  Or: aggregate growth from many teams
  Or: feature rollout affecting many services
  
HONEST OUTCOME:
  System surfaces "no clear cause"
  Doesn't fabricate a confident answer
  Lets the operator do deeper investigation
```

The analysis flags this transparently rather than guessing.

### Multi-cause anomalies

```
SOMETIMES MULTIPLE CAUSES contribute:

ANOMALY: org spike +400%
ANALYSIS:
  New resource (45%) — new ML cluster
  Schedule failure (35%) — dev environment didn't stop
  Both contributing
  
REALITY:
  ML cluster contributes ~$2,000
  Schedule failure contributes ~$1,500
  Together: $3,500 of the spike
  
BOTH need addressing:
  Investigate new resource → may be legit; keep
  Investigate schedule failure → fix the failure
  Two action items
```

The analysis surfaces top causes; sometimes more than one is real.

### Investigation workflow

```
STANDARD INVESTIGATION:

1. Read top candidate (probability)
2. Drill into the suggested signal
3. Verify or refute
4. If verified: take suggested action
5. If refuted: move to candidate #2
6. Repeat
7. If all candidates refuted: deeper investigation needed
   Check team dimension, resource-group dimension
   Cross-reference with deploy logs, change tickets
   
TYPICAL TIME:
  Top candidate correct: 5-10 min
  Move to candidate #2: 10-20 min
  Deep investigation: 30+ min
```

The cascade speeds investigation by an order of magnitude vs blind search.

---

## 2. Demo

A team's anomaly-with-root-cause:

```
T+0       Daily anomaly cron detects:
          prod-payments cost yesterday up 250%

T+1 min   ROOT CAUSE ANALYSIS surfaces:
            65% New resource (prod-aws-us-east-1)
            20% Schedule failure 
            10% Unscheduled usage increase
            5%  Reservation expiry

T+5 min   Team drills into "New resource" (top candidate):
            Detected: new EKS cluster "experiment-cluster-1"
            Provisioned by ci-cd-tool@zopcloud.com at 14:32 yesterday
            
T+10 min  Investigation:
            Cluster is a temporary experiment cluster
            Was supposed to terminate after the experiment
            CI tool failed to clean up; cluster still running
            
T+15 min  Action: terminate the cluster
T+20 min  Notification: cluster terminated; cost recovered
T+20 min  Postmortem:
          - Improve CI tool's cleanup logic
          - Add Lambda watchdog for orphaned experiment clusters
          - Add cleanup audit job

OUTCOME:
  15 minutes to root cause + remediation
  Top candidate was right
  Action items captured for prevention
  Cost recovered (~$2,500 in this case)
```

15 minutes to root cause + remediation. The analysis pointed at the right cause immediately.

### Contrasting example — top candidate wrong

```
T+0       Anomaly: ml-training spike +400%

T+1 min   ROOT CAUSE ANALYSIS:
            New resource (50%)
            Schedule failure (30%)
            Other (20%)

T+5 min   Drill into "New resource":
            No new resources detected
            All resources known
            
T+8 min   Drill into "Schedule failure":
            Schedule was supposed to stop ml-cluster at 8 PM
            Schedule logs: failed to apply (cloud API error)
            Cluster ran all night
            
T+12 min  Investigation complete:
            Schedule failure was the cause
            Cloud API was rate-limited; retry exhausted
            
T+15 min  Action:
          - Kill the cluster (cost stopped)
          - Add retry logic to schedule application
          - Set up cloud API rate monitoring

OUTCOME:
  Top candidate ruled out; #2 was correct
  Investigation took 4 minutes longer than ideal
  But: still much faster than blind search
  Process improved (retry logic + monitoring)
```

The candidates are starting points; investigate all if top is refuted.

---

## 3. Hands-on (5 min)

Investigate an anomaly using root cause analysis:

```
□ STEP 1: Open active anomaly
  Anomaly: __________
  Severity: __________

□ STEP 2: Read root cause analysis
  Top candidate: __________   Probability: ___%
  #2: __________               Probability: ___%
  #3: __________               Probability: ___%

□ STEP 3: Investigate top candidate
  Check the suggested signal
  Verified or refuted: __________
  Time spent: ___ min

□ STEP 4: If refuted, move to #2
  Verified or refuted: __________
  Time spent: ___ min

□ STEP 5: Document
  Actual root cause: __________
  Resolution: __________
  Action items: __________
```

A 15-minute exercise builds the investigation muscle.

---

## 4. Knowledge check

### Q1
A spike's root cause analysis lists "new resource" at 65%. Best action:

A. Move on
B. Investigate by identifying the new resource (cloud account, UID, who provisioned). Verify or refute the top hypothesis. High probability candidate is the starting point; investigation confirms.
C. Random
D. Terminate everything

<details>
<summary>Show answer</summary>

**Correct: B.** Investigate the top candidate.
</details>

### Q2
The analysis returns no clear single cause. The system suggests:

A. Random investigation
B. Drill into smaller dimensions (team, resource-group) for finer-grained signals. The cause is likely distributed across many small contributors. The system flags this honestly rather than guessing.
C. Ignore
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Drill finer.
</details>

### Q3
Anomaly cost is up 300%. Analysis suggests #1 cause as "rate change" (40%). Investigation finds nothing changed. What next?

A. Discount
B. Examine causes #2 and #3 on the list. Probabilities are starting points, not certainties. Continue down the list until you find the actual cause. Often the cause is #2 or #3; sometimes it requires deeper investigation.
C. Random
D. Bug

<details>
<summary>Show answer</summary>

**Correct: B.** Move down the list.
</details>

---

## 5. Apply

Root cause analysis is on every anomaly card. Top 3 candidates with probabilities.

For your team: build the cascade-investigation habit. Check #1, refute, move on. Faster than blind search.

---

## Related lessons

- [L1 — Five dimensions](L1_five_dimensions.md)
- [L2 — Detection methods](L2_detection_methods.md)
- [L3 — Severity bands](L3_severity_bands.md)
- [L5 — Redistribution suppression](L5_redistribution_suppression.md) *(next)*

## Glossary terms touched

[Root cause analysis](../../../reference/glossary/root-cause-analysis-anomaly.md) · [Cause probability](../../../reference/glossary/cause-probability.md) · [Cascade investigation](../../../reference/glossary/cascade-investigation.md) · [No clear cause](../../../reference/glossary/no-clear-cause.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.10.L4
