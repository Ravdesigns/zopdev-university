# The first 15 minutes

§ T4 · M4.5 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **triage** a cost anomaly within 15 minutes, **distinguish** events from incidents using the severity-times-expectedness matrix, **and decide** whether to escalate, document, or watch.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get from anomaly alert to triage decision in 15 minutes — not 15 hours." |
| **Personas** | FinOps Lead · SRE / On-call · Platform Engineer |
| **Prerequisites** | T1 (operator surface) · M4.1-M4.2 (maturity context) |
| **Time** | 9 minutes |
| **Bloom verb** | Triage (Apply), Distinguish (Analyze), Decide (Evaluate) |

---

## 1. Concept

When a cost anomaly fires, the first 15 minutes determine whether it becomes an **incident** (cost overrun, requires response) or stays an **event** (recorded, no action). The same anomaly can be either, depending on what triage uncovers. Discipline in the first 15 minutes is the difference between a clean close-and-document and an after-the-fact "wait, that was $14K?"

```
MIN 0-1     IDENTIFY the anomaly
            Read the alert (severity, scope, magnitude)
            Confirm it actually fired (not a duplicate)
            Acknowledge to the team channel

MIN 1-3     DRILL into the right dimension
            Start org-level: which provider / account
            Cascade to team / resource
            Use the Sankey to find the dominant flow

MIN 3-8     IDENTIFY the resource(s) driving the anomaly
            From the drill, pinpoint specific resources
            Check the state history for those resources
            Cross-reference with the audit log for recent changes

MIN 8-12    DETERMINE if action is needed
            Is this expected (marketing campaign, scheduled launch)?
            Is this unexpected (autoscaler, compromised cred)?
            What's the severity in dollar terms?
            Who's the owner?

MIN 12-15   DECIDE
            Investigation continues (low severity, document)
            Escalate (critical or emergency, page on-call)
            Close as expected (document; not an incident)
```

The 15-minute target is for **triage**, not resolution. Resolution may take hours or days; triage answers "should anyone act on this right now, and at what severity."

### Triage decision matrix

The two axes are **severity** (dollar impact) and **expectedness** (was this on the calendar):

```
                            EXPECTED                UNEXPECTED
─────────────────────────────────────────────────────────────────
WARNING                    Note + watch             Investigate +
($100-$1K above baseline)  Document in audit        document this week
                                                    
CRITICAL                   Note + bounded watch     Investigate now +
($1K-$10K)                 Confirm scope            escalate if compounding
                                                    
EMERGENCY                  Treat as critical        PAGE on-call
($10K+)                    (even expected is        Incident commander
                           large)                   Cut affected resources
```

The "expected" qualifier is what often turns a critical-looking anomaly into a benign note. Confirming with the affected team takes 30 seconds and saves hours of false-incident response.

### The "expected" qualifier — confirming fast

Many anomalies are expected. They look anomalous to the algorithm because they deviate from baseline, but the team that owns the workload knows about them. Examples:

```
EXPECTED PATTERNS:
  - Marketing campaign (CDN spike, Lambda burst)
  - Product launch (compute scale-up planned in advance)
  - Quarterly data ETL (large but predictable batch)
  - Scheduled ML training (GPU spike)
  - Black Friday / peak day traffic
  - Migration in progress (temporary doubling)
```

The fast confirmation pattern:

```
ON-CALL HAS 30 SECONDS:
  Slack the affected team's #ops or #finops channel:
    "Anomaly on prod-aws-us-east-1, +$2K above baseline.
    Is this expected? Recent launch / campaign / migration?"
  
  If yes within 5 min: close as expected; document.
  If no answer in 5 min: assume unexpected; proceed to investigation.
```

The 5-minute timeout matters. Waiting for confirmation forever lets the anomaly grow if it's actually unexpected.

### Drilling efficiently

The most-common time sink is drilling in the wrong order. Cost anomalies have a natural hierarchy:

```
DRILL ORDER (top-down):
  1. Provider (AWS / GCP / Azure)
  2. Account / project / subscription
  3. Service (EC2, RDS, K8s, etc.)
  4. Team (via tag)
  5. Resource (specific instance / cluster / bucket)
  6. State change (what changed at the inflection point)
```

Skipping levels wastes time. Drilling provider-first usually narrows the search space by 60-80% before you look at any specific resource.

### Severity vs dollar impact

```
"Severity" in cost anomalies is a dollar magnitude AND a velocity:

  $1K total but trending fast    → critical (will grow)
  $10K total but bounded         → critical (already happened)
  $100K total, planned event     → warning (expected)
  $500 spike, one-time           → warning (small, contained)

Velocity matters: a slow-growing anomaly can be addressed during
business hours; a fast-growing one needs immediate attention.
```

### Common 15-minute traps

```
TRAP                                  AVOID BY
──────────────────────────────────────────────────────────────────
"Let me investigate more before        Set a 15-min hard stop;
acting"                                escalate or close at the timer
                                       
"I'll page if it gets worse"           Define worse: dollar threshold,
                                       not vibes
                                       
"This is probably the marketing        Ask, don't assume; takes 30 sec
campaign"                              and saves hours of false ops
                                       
"Let me wait for more data"            ZopNight has the data; the data
                                       you need is in Cost Flow + 
                                       audit log right now
                                       
"I'll handle it after this meeting"    A 15-min triage IS the meeting
                                       priority for critical anomalies
```

### Documentation as triage output

Every anomaly produces an audit log entry. Even if you close as "expected, no action," that entry is the record:

```
GOOD AUDIT ENTRY:
  Anomaly: prod-aws-us-east-1 cost +$2,400 above baseline
  Triage: 11 minutes
  Cause: marketing campaign Q2-launch (confirmed with @marketing)
  Action: close as expected
  Documented by: jane@finops at 2026-05-15 03:47 UTC
  
BAD AUDIT ENTRY:
  "Resolved."
```

Specific entries compound into pattern recognition over months.

### How ZopNight supports 15-minute triage

```
SURFACE                          USE IN TRIAGE
──────────────────────────────────────────────────────────────────
Anomaly drawer                    Shows the anomaly + suggested cause
Cost Flow Sankey                  Drill from provider to resource fast
State history per resource         What changed when
Audit log filter                   Recent mutations affecting the spike
Team tag                          Owner identification
Notification routing              Right person paged at the right SLA
```

The product is designed to support this 15-minute flow. The on-call's job is to follow it.

---

## 2. Demo

A real critical anomaly at 03:00 UTC:

```
T+0:00     CRITICAL ANOMALY fires
            +200% deviation on prod-aws-us-east-1
            PagerDuty notification to on-call
            
T+0:01     On-call ACK; opens ZopNight Anomaly drawer

T+0:02     Anomaly summary:
              spike at 02:55 UTC (~5 min ago)
              dimension: prod-aws-us-east-1
              dollar impact so far: $480
              velocity: ~$96/min (high)
              
T+0:03     DRILL into Cost Flow filtered to prod-aws-us-east-1
            Sankey shows EKS dominant
            
T+0:05     Drill into EKS: team=ml dominates
            
T+0:06     Drill into team=ml: cluster prod-ml-eks-cluster
            
T+0:07     Check state history for the cluster:
              new resource provisioned at 02:55 UTC
              HPA max increased from 12 to 30 at 02:54 UTC
              
T+0:08     CONFIRMATION FAST PATH:
              Slack #ml-team: "Anomaly on prod-ml-eks-cluster,
              +200% spike at 02:55. Planned ML batch?"
              
T+0:10     @ml-lead responds:
              "Yes — overnight ML batch (training new model).
              HPA increase was deliberate. Expected to run 4 hours."
              
T+0:11     DECISION: expected event; close as anomaly-expected
              ZopNight notification: cost was expected; closed.
              Documented in audit log with @ml-lead's confirmation.
              
T+0:14     Triage COMPLETE. Back to sleep.

ELAPSED:   14 minutes from page to close.
OUTCOME:   No incident. Documented expected event.
```

Without the 15-minute discipline, the on-call might have investigated for an hour, paged the FinOps lead, and discovered the same thing at 04:30 UTC.

---

## 3. Hands-on (5 min)

For a past anomaly your team triggered:

```
ANOMALY (what / when):
  __________________________________________________________

TIMELINE:
  T+0       Anomaly fired:        __________
  T+_____   First responder ack:   __________
  T+_____   Drill completed:       __________
  T+_____   Cause identified:      __________
  T+_____   Decision made:         __________

WOULD 15-MINUTE TRIAGE HAVE HELPED?
  □ Faster identification
  □ Faster close-as-expected
  □ Same outcome, less stress
  □ Wouldn't have helped (this case)

KEY GAP in your team's current practice:
  __________________________________________________________

ACTION (what to set up):
  □ Define the 15-min hard stop
  □ Document confirmation channels per team
  □ Update notification routing
  □ Build the audit-log template
```

If your team doesn't have a triage SLA today, set 15 minutes as the target. Adjust based on operational reality after the first month.

---

## 4. Knowledge check

### Q1
An emergency anomaly fires at 03:00 UTC. First action by the on-call:

A. Wait until morning
B. Acknowledge the alert within 1 minute; begin the drill (Cost Flow → resource → state history) within 3 minutes; engage on-call escalation if the pattern continues to grow. Emergency severity means action now, not after coffee.
C. Send to FinOps lead's queue
D. Ignore until business hours

<details>
<summary>Show answer</summary>

**Correct: B.** Immediate acknowledgment + structured drill. Emergency severity is defined by both dollar magnitude and velocity.
</details>

### Q2
A critical anomaly turns out to be a marketing campaign:

A. Treat as a full incident anyway
B. Document as expected; close. Investigate only if the spike compounds on top of expected (e.g., expected $5K + unexpected $8K = investigate the $8K). The fast confirmation pattern (Slack the affected team) takes 30 seconds and saves hours of false-incident response.
C. Random
D. Escalate to leadership

<details>
<summary>Show answer</summary>

**Correct: B.** Expected events don't need incident response. Document and close.
</details>

### Q3
The 15-minute target is for:

A. Closing every anomaly completely
B. Triage — determining whether action is needed and at what level. Resolution (fixing the underlying issue, applying a remediation) may take hours or days; the 15-min target is for the decision, not the fix.
C. Filing the postmortem
D. Cosmetic SLA

<details>
<summary>Show answer</summary>

**Correct: B.** Triage, not resolution. The decision is what makes the next steps actionable.
</details>

---

## 5. Apply

Build your team's 15-minute triage runbook. Document the drill order, the confirmation channels, the severity-dollar mapping. Test it monthly via tabletop exercises (simulated anomaly).

ZopNight's Anomaly drawer + Cost Flow + audit log are the canonical surfaces for the drill. Bookmark them.

---

## Related lessons

- [L2 — Top 10 root causes](L2_top_10_causes.md) *(next)*
- [L3 — The escalation matrix](L3_escalation.md)
- [L4 — Postmortems for cost incidents](L4_postmortems.md)
- [T3.M3.8 — Cost flow Sankey](../../T3_zopnight_architect/M3.8_cost_flow/00_README.md)

## Glossary terms touched

[Triage](../../../reference/glossary/triage.md) · [Anomaly](../../../reference/glossary/anomaly.md) · [Expected event](../../../reference/glossary/expected-event.md) · [Velocity](../../../reference/glossary/velocity.md) · [Triage SLA](../../../reference/glossary/triage-sla.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.5.L1
