# Severity bands

§ T2 · M2.10 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **map** each anomaly severity to the right operational response, **configure** per-team severity tuning, **and recognize** escalation patterns for persistent anomalies.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Respond to anomalies at the right urgency — warning is investigate-this-week, emergency is page-on-call." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.10.L1 · M2.10.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Map (Apply), Configure (Apply), Recognize (Apply) |

---

## 1. Concept

Three anomaly severity bands. Each has a recommended response, notification routing, and SLA.

```
SEVERITY        DEVIATION         RESPONSE              NOTIFICATION
─────────────────────────────────────────────────────────────────────
warning          30-100%           Investigate this week  Slack channel
critical         100-500%          Action within 24 hours Slack + email
emergency        > 500%            Action immediately     Slack + email + page
```

The severity drives the response intensity.

### Warning — investigate-this-week

```
EXAMPLE: prod-database costs jumped from $80/day to $130/day (62%)

INTERPRETATION: meaningful change but not crisis-level

RESPONSE PLAN:
  Investigate within the week
  Determine if change is one-time or persistent
  Document the cause
  No immediate action needed

TYPICAL OUTCOMES:
  New workload deployment (expected; document)
  Auto-scaling kicked in for normal load (acceptable; verify)
  Marketing event traffic (expected; document)
  Configuration drift (investigate further)
  
RESOLUTION TIME: days; not hours
```

Warnings often resolve without remediation — just understanding.

### Critical — action within 24 hours

```
EXAMPLE: dev-staging cluster costs went from $300/day to $1,400/day (367%)

INTERPRETATION: significant unexpected change

RESPONSE PLAN:
  Investigate within 24 hours
  Identify root cause
  Take corrective action
  Document for postmortem

TYPICAL OUTCOMES:
  Forgotten resource still running (kill it)
  Unauthorized resource provisioning (remove + alert)
  Stuck job consuming resources (investigate)
  Misconfigured autoscaler (adjust)
  Failed deployment leaving leaked resources
  
RESOLUTION TIME: hours; not days
ESCALATION: if persistent >24h, becomes emergency
```

Critical anomalies require human attention within a day.

### Emergency — page on-call immediately

```
EXAMPLE: ml-training cost went from $400/day to $4,800/day (1,100%)

INTERPRETATION: extreme deviation; likely cost runaway

RESPONSE PLAN:
  IMMEDIATE: page on-call engineer
  Investigate within minutes
  Take corrective action ASAP
  Pause billing in worst case

TYPICAL CAUSES:
  Stuck multi-instance job spawning GPU instances
  Misconfigured autoscaler max exhausted
  Compromised credentials provisioning resources
  Buggy CI pipeline launching workloads
  Marketing tool runaway
  Bot/abuse driving consumption

RESOLUTION TIME: minutes; not hours
ESCALATION: incident commander; security if compromise suspected
```

Emergencies require immediate human action.

### Notification routing per severity

```
SEVERITY        ROUTING
─────────────────────────────────────────────────────────
warning          #finops-alerts channel
                 Logged; visible; no page
                 
critical         #finops-alerts + email to designated approver
                 Multiple paths to inbox
                 
emergency        #finops-alerts + email + PagerDuty (page on-call)
                 Maximum signal escalation
                 Engineer woken up if needed
```

The escalation matches the severity. Don't page on warning; do page on emergency.

### Per-team severity tuning

A team can override the default severity for specific event classes:

```
Settings → Anomaly Detection → Severity Overrides

EVENT: cost anomaly on resource-group "dev"
DEFAULT severity at 200%: critical
OVERRIDE: warning (dev environment, less impact)

EVENT: cost anomaly on resource-group "prod-payment"
DEFAULT severity at 200%: critical
OVERRIDE: emergency (revenue-impacting; want immediate response)
```

Tuning down for non-prod is common. Production stays at default; some prod elevated.

### Severity escalation pattern

If a critical anomaly persists unresolved:

```
ESCALATION RULES:

T+0       Critical anomaly fires
T+24h     Still unresolved → severity escalates to emergency
T+24h     New notification fires; on-call paged
          Original anomaly stays linked; not a duplicate
          
T+48h     Still unresolved → escalation to engineering leadership
          Email + Slack DM to engineering manager
          
T+72h     Still unresolved → engineering all-hands notification
          Probably indicates process failure

CATCHES THE GAP:
  "We missed this critical alert; nobody followed up"
  Escalation forces eventual response
  Prevents indefinite ignored alerts
```

Persistent anomalies become emergencies. The auto-escalation is the safety net.

### Severity tuning best practices

```
DO TUNE WHEN:
  Severity doesn't match business impact for your team
  Non-prod workloads (warning often appropriate)
  Specific high-stakes prod resources (elevate to emergency)
  After repeated false-positive critical alerts (tune down)
  
DON'T TUNE WHEN:
  Want to suppress alerts because they're "annoying"
  (signal that severity ladder needs review, not silencing)
  
  Default behavior matches your situation
  
  You haven't observed enough alerts to know
```

Tuning is a deliberate choice. Document the rationale.

### Severity vs urgency interaction

```
SEVERITY = ZopNight's classification of magnitude
URGENCY = team's interpretation of business impact

EXAMPLE:
  Critical anomaly on a non-prod dev environment
  Severity: critical (technical classification)
  Urgency: medium (business impact lower)
  
  Customer can tune:
    Severity override: warning for non-prod
    Or: leave default and dismiss with comment
    
THE CHOICE IS YOURS
  Severity is suggestion; team interprets
```

The numeric classification + team context = actual response.

### Anti-pattern: blanket silencing

```
DON'T silence anomalies without investigation
  
SCENARIO:
  Team disabled all dev environment anomaly alerts
  "Too noisy"
  
PROBLEM:
  Lost visibility into dev workloads
  Bug spawned 50 instances in dev; not detected
  $5K wasted
  
BETTER:
  Investigate noisy patterns
  Tune severity per pattern
  Adjust thresholds, not blanket-silence
  Maintain visibility while reducing noise
```

Silencing is the lazy option. Tuning is the right option.

---

## 2. Demo

A team's severity-based response:

```
EVENT 1 (warning, 75% deviation):
  Resource: prod-api group
  
  Action:
    Investigated next day
    Found: new feature deployment drove modest cost increase
    Expected behavior
    Documented in change log
    Closed: no further action
    
EVENT 2 (critical, 280% deviation):
  Resource: ml-training group
  
  Action:
    Investigated within 24h
    Found: stuck training job
    Killed orphaned instances (6 GPU instances)
    Cost recovered
    Postmortem documented
    Action items:
      Add job-watchdog
      Reduce default training timeout
      
EVENT 3 (emergency, 1,200% deviation):
  Resource: i-0compromised
  
  Action:
    Page on-call at 03:00 UTC
    Engineer investigated within 5 min
    Detected: compromised IAM credentials provisioning GPU instances
    Killed instances; rotated credentials
    Security incident filed (separate process)
    Total cost: $4,200 (caught early)
    Without emergency severity: could have been $50K+
```

Each severity matched its response. The escalation worked.

---

## 3. Hands-on (5 min)

Audit your severity distribution:

```
□ STEP 1: Open Reports → Anomalies
  Last 30 days breakdown:
    Warnings: _____
    Critical: _____
    Emergency: _____

□ STEP 2: Per-severity health
  Warnings resolved: ___% (target: 80%+ resolved)
  Critical resolved within 24h: ___%
  Emergency response time: avg ___ minutes

□ STEP 3: Identify miscategorized
  Any "noisy" warnings that should be info? _____
  Any critical that should be emergency? _____
  Any non-prod patterns over-rated? _____

□ STEP 4: Plan tuning
  Severity overrides to add: __________
  Process improvements: __________

□ STEP 5: Set quarterly review
  Date: __________
  Owner: __________
```

A 15-minute audit reveals severity tuning opportunities.

---

## 4. Knowledge check

### Q1
An anomaly with 200% deviation. The severity:

A. warning
B. critical (100-500% range). The deviation falls in the critical band. Investigate within 24 hours.
C. emergency
D. random

<details>
<summary>Show answer</summary>

**Correct: B.** Critical band.
</details>

### Q2
A team configures non-prod anomalies to warning even at 500% deviation. The reasoning:

A. Avoid alerts
B. Non-prod cost spikes have lower business impact. Severity tuning reflects business impact. Production stays at default (critical at 200%, emergency at 500%). Tuning aligns severity with team's risk posture.
C. Random
D. Bug

<details>
<summary>Show answer</summary>

**Correct: B.** Severity matches impact.
</details>

### Q3
A critical anomaly fires at 03:00 UTC. The team's response should:

A. Wait for morning
B. Investigate within 24 hours per the severity SLA. Production-related critical may warrant immediate action; non-prod can wait. 24-hour SLA is the contract. Persistent critical (>24h unresolved) auto-escalates to emergency.
C. Random
D. Page immediately

<details>
<summary>Show answer</summary>

**Correct: B.** 24-hour SLA for critical.
</details>

---

## 5. Apply

Severity routing is in Settings → Notification routing. Per-severity escalation paths.

For your team: quarterly severity audit. Tune deliberately. Document the rationale.

---

## Related lessons

- [L1 — Five dimensions](L1_five_dimensions.md)
- [L2 — Detection methods](L2_detection_methods.md)
- [L4 — Root cause](L4_root_cause.md) *(next)*
- [L5 — Redistribution suppression](L5_redistribution_suppression.md)

## Glossary terms touched

[Anomaly severity bands](../../../reference/glossary/anomaly-severity-bands.md) · [Severity override](../../../reference/glossary/severity-override.md) · [Auto-escalation](../../../reference/glossary/auto-escalation.md) · [Severity-vs-urgency](../../../reference/glossary/severity-vs-urgency.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.10.L3
