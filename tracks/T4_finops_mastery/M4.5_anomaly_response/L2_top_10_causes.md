# Top 10 root causes

§ T4 · M4.5 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the ten most common anomaly root causes, **route** each to the correct investigation pattern, **and avoid** the three discipline mistakes that turn a 30-minute investigation into a 3-hour one.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Skip the wild-goose chase. Identify the most likely cause from the symptom, route to the right investigation." |
| **Personas** | FinOps Lead · SRE / On-call · Platform Engineer |
| **Prerequisites** | M4.5.L1 — The first 15 minutes |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Remember), Route (Apply), Avoid (Evaluate) |

---

## 1. Concept

Most cost anomalies trace to one of ten common causes. The distribution is roughly stable across customers; knowing the top causes lets the on-call cut investigation time by 60-80% on first call.

```
RANK  CAUSE                                   FREQUENCY    TYPICAL VELOCITY
─────────────────────────────────────────────────────────────────────────
1     Forgotten resource (running long-term)  ~25%         slow drift
2     New legitimate workload                   ~20%         step change
3     Misconfigured autoscaler                  ~12%         exponential
4     Compromised credentials                   ~10%         very fast
5     Failed schedule (resource left on)         ~8%          24-hour
6     Stuck job (consuming resources)            ~7%          steady high
7     Cloud-side rate change                     ~5%          step, all-services
8     Acquired entity's spend                    ~4%          one-time
9     Anomalous spot pricing                     ~3%          regional
10    Reserved instance expiry                   ~3%          step, sudden
11+   Other / unknown                            ~3%
```

The percentages are anonymized customer telemetry; your distribution may vary, but the top five (forgotten, new workload, autoscaler, credentials, schedule) reliably cover 75-80% of all anomalies.

### Per-cause investigation pattern

```
CAUSE 1 — FORGOTTEN RESOURCE (~25%)
  Symptom: gradual drift over weeks; no new resources
  Investigate:
    Check state-history for the spiking resource
    Find last user activity (audit log)
    Check tag freshness (was it ever updated?)
  Decision: cleanup, schedule, or accept and tag

CAUSE 2 — NEW LEGITIMATE WORKLOAD (~20%)
  Symptom: step change; new resources visible in inventory
  Investigate:
    Cross-reference with team's launch plans
    Confirm expected cost with workload owner
    Validate the workload itself (not a runaway version)
  Decision: update forecast; document; close

CAUSE 3 — MISCONFIGURED AUTOSCALER (~12%)
  Symptom: exponential growth following a config change
  Investigate:
    Check autoscaler config + recent edit history
    HPA max, replica counts, target utilization
    Audit log for who changed what when
  Decision: revert or tune; document the safe limits

CAUSE 4 — COMPROMISED CREDENTIALS (~10%)
  Symptom: very fast spike, unusual regions/services
  Investigate:
    IMMEDIATELY: kill rogue resources (security on call)
    Audit log: who created the resources
    IAM: how did the credential get used
    Rotate credentials
  Decision: incident response process; involve security

CAUSE 5 — FAILED SCHEDULE (~8%)
  Symptom: resource still on outside business hours
  Investigate:
    Check schedule history for the resource
    Why didn't the stop fire (cron error, permission, dependency)?
  Decision: manual stop + investigate the schedule mechanism

CAUSE 6 — STUCK JOB (~7%)
  Symptom: steady high consumption from one resource
  Investigate:
    Process list on the resource (if reachable)
    Recent deployment / job logs
    What's the resource supposed to be doing
  Decision: kill the job; restart cleanly; debug the stuck condition

CAUSE 7 — CLOUD-SIDE RATE CHANGE (~5%)
  Symptom: step change across many services, all accounts
  Investigate:
    Check cloud provider's pricing changelog
    Confirm with billing dashboard
  Decision: update forecast and budget baseline; document

CAUSE 8 — ACQUIRED ENTITY'S SPEND (~4%)
  Symptom: one-time large addition; new accounts visible
  Investigate:
    Was an M&A close on the books recently?
    Are these new accounts in the right OU / org?
  Decision: integrate properly; possibly chargeback to BU

CAUSE 9 — ANOMALOUS SPOT PRICING (~3%)
  Symptom: spot fleet cost spike; specific region/AZ
  Investigate:
    Cloud spot pricing dashboards
    Spot interruption rate (may also be elevated)
  Decision: move fleet to different region/AZ; tune bidding

CAUSE 10 — RESERVED INSTANCE EXPIRY (~3%)
  Symptom: step increase on specific service exactly at month boundary
  Investigate:
    RI inventory: what just expired?
    Commitment portfolio: were we supposed to renew?
  Decision: renew if still needed; document if intentional sunset
```

### Investigation tools by cause

```
TOOL                              MOST USEFUL FOR
──────────────────────────────────────────────────────────────────
ZopNight Anomaly drawer            All causes — start here
Cost Flow Sankey                   Causes 1-3, 5-6 (resource ID)
State history per resource         Causes 1, 5, 6 (resource changes)
Audit log                           Causes 2, 3, 4, 8 (who changed)
Auto-tagger drift                  Cause 4 (unauthorized provisioning)
Cloud pricing dashboards           Cause 7, 9 (rate / spot prices)
Commitment portfolio                Cause 10 (RI/SP inventory)
```

### Time investment by cause

The complexity of investigation varies dramatically:

```
EASIEST (causes 5, 6, 10): clear pattern, immediate action
  Investigation: 15-30 minutes
  Resolution: same as investigation or shortly after

MEDIUM (causes 1, 3, 8): need cross-referencing
  Investigation: 30-60 minutes
  Resolution: 1-4 hours

COMPLEX (causes 2, 4, 7): often need multiple investigators
  Investigation: hours to days
  Resolution: 4 hours to a quarter (architectural fixes)
```

For most anomalies, the on-call's job is investigation; resolution may involve other teams.

### Common discipline mistakes

```
MISTAKE 1 — Skip root cause; just terminate
  "Killed the resource; closed the ticket."
  RESULT: same anomaly recurs next month (often within 2 weeks)
  FIX: root-cause every anomaly even if the immediate action is
       the same. Document the cause. Build the postmortem.

MISTAKE 2 — Investigate everything yourself
  "I'll figure it out; don't want to wake people up."
  RESULT: 4-hour single-handed investigation; bottleneck;
          burnout
  FIX: clear escalation matrix (M4.5.L3); use it. Cost on-call
       isn't a hero job; it's a coordinated response.

MISTAKE 3 — Wait for "more data"
  "Let me see what tomorrow looks like before acting."
  RESULT: anomaly grows; harder to contain; bigger cleanup
  FIX: act on initial data; refine investigation in parallel.
       For unexpected anomalies, every hour of waiting is
       ~$X of additional spend.

MISTAKE 4 — Trust the first guess
  "Anomaly drawer suggested cause 2; that must be it."
  RESULT: pursue wrong investigation; lose 30 min before
          reconsidering
  FIX: ZopNight's suggested cause is a starting hypothesis,
       not the answer. Verify against the actual data.
       
MISTAKE 5 — No documentation
  "Resolved" with no detail
  RESULT: same anomaly type happens again, on-call has no
          prior art to learn from
  FIX: every anomaly closes with a 3-line documentation entry
       in the audit log (cause, action, lesson)
```

### How the patterns compound

The top-10 list isn't random; it reflects the operational realities of cloud cost:

```
- Engineers forget about resources (1, 5, 6)
- New workloads happen constantly (2)
- Configurations drift (3)
- Security is hard (4)
- Cloud providers change pricing (7)
- M&A happens (8)
- Markets move (9, 10)
```

Knowing the ranking lets you start with the most-likely cause and only escalate hypotheses if the data doesn't fit.

### How ZopNight surfaces causes

The Anomaly drawer in ZopNight surfaces a suggested cause based on the anomaly signature:

```
SIGNATURE → SUGGESTED CAUSE
──────────────────────────────────────────────────────────────────
gradual drift, no new resource    → Cause 1 (forgotten)
step change + new resources       → Cause 2 (new workload)
exponential growth                → Cause 3 (autoscaler)
unusual regions / services         → Cause 4 (compromised)
24-hour periodicity                → Cause 5 (schedule failure)
sustained high single resource     → Cause 6 (stuck job)
step change all-services           → Cause 7 (rate change)
new accounts appearing             → Cause 8 (acquisition)
spot fleet specific                → Cause 9 (spot pricing)
month-boundary step                → Cause 10 (RI expiry)
```

The signature → cause mapping is heuristic and 70-80% accurate. The on-call's job is to verify (15-min triage from L1) before acting.

---

## 2. Demo

A real investigation following the playbook:

```
ANOMALY:    $4,000 spike yesterday on prod-aws-us-east-1
TRIAGE:     completed in 12 minutes per M4.5.L1
            Identified resource: prod-test-eks-cluster
INVESTIGATION (45 min):

Step 1 — Anomaly drawer suggests "Cause 2: new resource"
  Confidence: medium (signature: step change + new resource)
  
Step 2 — Drill into the spiking dimension
  Cost Flow Sankey, prod-aws-us-east-1 → EKS → team=engineering
  Resource: prod-test-eks-cluster
  Created at: 2026-05-15 14:30 UTC
  Spike began: 2026-05-15 14:35 UTC
  
Step 3 — State history for the cluster
  Provisioned 2026-05-15 14:30
  No earlier state (genuinely new)
  
Step 4 — Audit log: who created the cluster
  Filter: cloud-account=prod-aws-us-east-1,
          method=POST, path contains /clusters,
          time = 2026-05-15 14:25-14:35
  Result: created by ci-bot@engineering via Terraform apply
  Trigger: PR #4521 merged to main at 14:28 UTC
  
Step 5 — Read the PR + CI logs
  PR title: "Add staging environment for failing integration test"
  Failure: test threw before reaching cleanup logic
  Result: cluster created, not destroyed
  
Step 6 — ROOT CAUSE
  CI integration test created a cluster
  Test failed BEFORE the cleanup block executed
  Cluster orphaned; cost accumulated for 8 hours before
  alarm fired
  
DIAGNOSIS:
  Cause 1 (forgotten resource) created by a CI bug,
  technically cause 6 (stuck/failed job) at the meta level
  
ACTIONS:
  IMMEDIATE: kill the orphaned cluster (saved ~$500/day going forward)
  SHORT-TERM: fix cleanup to run in `finally` block
  STRUCTURAL: add post-CI verification step that asserts
              no orphan resources exist
              
DOCUMENTATION (in audit log + team wiki):
  "2026-05-15 anomaly: orphaned EKS cluster from CI failure.
   Cause: cleanup not in finally. Fixed by PR #4537.
   Verification step added. Estimated saving: $400/incident
   class going forward."
```

---

## 3. Hands-on (5 min)

For your team's latest anomaly:

```
ANOMALY (one-sentence summary):
  __________________________________________________________

MAPPED CAUSE (best fit from top 10):    __________

INVESTIGATION PATH (what would you check, in order):
  1. __________
  2. __________
  3. __________

EXPECTED INVESTIGATION TIME:    _____ minutes
  Easy: 15-30 min
  Medium: 30-60 min
  Complex: hours

WHO IS THE LIKELY OWNER of the underlying issue?
  __________

IF this cause recurs, what's the structural fix (not the immediate one)?
  __________________________________________________________
```

If you can't fit the anomaly to one of the top 10, you may be looking at a rare cause OR you may be misreading the signature. Cross-check with the ZopNight Anomaly drawer's suggested cause.

---

## 4. Knowledge check

### Q1
The most-common single cause of cost anomalies:

A. Cloud-side rate changes
B. Forgotten resources (running long-term without cleanup). Accounts for ~25% of anomalies across customers. The investigation pattern: check state history for the spiking resource, find last user activity in the audit log, check tag freshness.
C. Compromised credentials
D. Acquired entity's spend

<details>
<summary>Show answer</summary>

**Correct: B.** Forgotten resources are #1. Workload creation > cleanup discipline; the asymmetry compounds over months.
</details>

### Q2
Compromised credentials as a cause:

A. Never happens
B. About 10% of cases — bad actors provision rogue resources, often spike rapidly. The signature is unusual regions/services or fast velocity. Response involves security team, not just FinOps. Real but minority compared to operational causes.
C. The most common cause
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Real but ~10% of total. The fast velocity makes it look more dominant than it is statistically.
</details>

### Q3
Skipping root-cause analysis and just terminating the affected resource:

A. Efficient — saves investigation time
B. Same anomaly type recurs. Without root cause, the structural condition that produced the anomaly persists. The discipline is: every anomaly, even a quick one, gets a documented cause and (where applicable) a structural fix.
C. Random
D. Time-saving and harmless

<details>
<summary>Show answer</summary>

**Correct: B.** Root-cause discipline breaks the cycle. Without it, you respond to the same anomaly class repeatedly.
</details>

---

## 5. Apply

Use the ZopNight Anomaly drawer's suggested cause as a starting hypothesis. Verify against the data (Cost Flow, state history, audit log). Document the actual cause in the audit log entry.

Build a team wiki page tracking your top-10 cause distribution over the past quarter. The patterns will surface where structural fixes are highest-leverage.

---

## Related lessons

- [L1 — The first 15 minutes](L1_first_15.md)
- [L3 — The escalation matrix](L3_escalation.md) *(next)*
- [L4 — Postmortems for cost incidents](L4_postmortems.md)
- [T4.M4.1.L4 — Maturity anti-patterns](../M4.1_maturity_ladder/L4_antipatterns.md)

## Glossary terms touched

[Root cause](../../../reference/glossary/root-cause.md) · [Anomaly signature](../../../reference/glossary/anomaly-signature.md) · [Compromised credentials](../../../reference/glossary/compromised-credentials.md) · [Stuck job](../../../reference/glossary/stuck-job.md) · [Forgotten resource](../../../reference/glossary/forgotten-resource.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.5.L2
