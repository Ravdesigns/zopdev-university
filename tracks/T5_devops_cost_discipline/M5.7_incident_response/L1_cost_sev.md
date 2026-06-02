# When cost becomes a SEV

§ T5 · M5.7 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **define** criteria for treating cost as an incident, **distinguish** SEV-1 through SEV-4 cost severity levels, **and decide** between "kill immediately" and "investigate first" patterns.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Recognize when cost has crossed into incident territory; respond at the right severity; avoid both overreaction and underreaction." |
| **Personas** | Platform Engineer · SRE · FinOps Lead · On-call Engineer |
| **Prerequisites** | M5.5 (reliability vs cost) · T4.M4.5 (anomaly response) |
| **Time** | 9 minutes |
| **Bloom verb** | Define (Create), Distinguish (Analyze), Decide (Evaluate) |

---

## 1. Concept

Cost can become an incident. Sudden spikes, runaway workloads, compromised credentials launching crypto miners — these are not regular FinOps problems; they're cost-shaped emergencies. The discipline: define cost-SEV criteria; respond appropriately.

```
COST-INCIDENT TRIGGERS                    SEVERITY
─────────────────────────────────────────────────────────────────
Daily spend >2× normal sustained          SEV-2
Daily spend >5× normal (clear runaway)    SEV-2/1
Compromised credentials → cost spike      SEV-1 (security + cost)
Misconfigured autoscaler → instance flood  SEV-2/1
Stuck job consuming GPU/expensive          SEV-2
Quota exhausted from rapid growth          SEV-3
Compliance violation discovered            SEV-2/3
Budget threshold breached                  SEV-3/4
```

The framing: cost spikes are signals, sometimes of larger issues (security incidents, runaway automation). Treat as engineering incidents, not just FinOps concerns.

### SEV definitions for cost incidents

```
SEV-1 — EXISTENTIAL
  Cost trajectory threatens business viability
  OR indicates security compromise
  
  RESPONSE:
    Page everyone (on-call SRE + FinOps lead + Security)
    Stop the bleeding NOW (kill workloads, rotate credentials)
    Communicate to leadership immediately
    Customer comms if security incident
    
  EXAMPLES:
    Compromised key launching crypto miners ($10K+/hour)
    Runaway pipeline launching 1000s of GPU instances
    Suspected fraudulent customer activity at scale

SEV-2 — SIGNIFICANT
  Cost is 2-5× normal
  Or: clear runaway pattern though sustainable for hours
  
  RESPONSE:
    Investigation + corrective action within hours
    Notify finance + leadership
    Page FinOps on-call
    May require kill-stop of identified runaway workloads
    
  EXAMPLES:
    CI/CD bug launching too many test instances
    Misconfigured HPA scaling to max indefinitely
    New feature traffic 10× projection

SEV-3 — CONCERNING
  Spike or growth pattern requires attention
  Not immediate crisis
  
  RESPONSE:
    Document; address within days
    Investigation during business hours
    No paging
    Weekly Operate review item
    
  EXAMPLES:
    50% sustained increase on a workload
    New cost line item ($1K-$10K/mo)
    Budget pacing concerning

SEV-4 — TRENDING
  Modest deviation; monitor
  
  RESPONSE:
    Note in weekly Operate review
    Investigate if persists
    No immediate action
    
  EXAMPLES:
    Mild growth on known feature
    Seasonal patterns within normal range
```

The severity drives the response intensity. Don't overreact; don't underreact.

### Cost SEV vs traditional outage SEV

```
TRADITIONAL OUTAGE SEV          COST SEV
─────────────────────────────────────────────────────────────
Customer impact                  Financial impact
Page on-call SRE                 Page FinOps lead + on-call
SRE leads investigation          FinOps + SRE collaborate
Production stays running         May require kill-stop
Customer status pages             Internal comms primarily
Focus: restore service           Focus: stop the bleeding
                                  (then restore intent)
```

The response differs because cost runaways often involve:
- Possibly compromised credentials (security implication)
- Need to kill rogue workloads (mutation that's risky)
- Finance escalation alongside engineering
- Different stakeholders (CFO/CTO vs CTO/VPE alone)

### Common cost-SEV scenarios

```
SCENARIO 1 — COMPROMISED AWS KEY LAUNCHING CRYPTO MINING
  
  Initial signal: Cost Anomaly alert fires at 3 AM
                  $4,200 cost spike in 3 hours
                  All from us-east-2 GPU instances
                  
  Investigation: 47 GPU instances launched
                  Tagged with placeholder/fake tags
                  Created by AWS access key X-X (not familiar)
                  
  SEVERITY: SEV-1
    Stop the bleeding (kill instances)
    Rotate credentials immediately
    Engage security incident process
    
  ACTIONS:
    T+0:00 Page on-call
    T+0:05 Identify the workload (clearly malicious)
    T+0:10 Kill all 47 GPU instances
    T+0:15 Rotate AWS access keys org-wide for affected scope
    T+0:30 Security forensics begins
    T+2:00 Initial root cause: compromised CI/CD token
    T+24h Postmortem; new credential hygiene policies

SCENARIO 2 — CI/CD BUG LAUNCHING TEST INSTANCES
  
  Initial signal: Cost spike $8,500 in 6 hours
                  ML training instances in non-prod
                  Created by CI/CD service account
                  
  Investigation: ML pipeline change deployed last night
                  Bug: each test run launches new instance, doesn't terminate
                  
  SEVERITY: SEV-2
    Kill the workloads
    Pause CI/CD pipeline
    Fix root cause
    
  ACTIONS:
    T+0:00 Cost alert fires
    T+0:30 Identify source (CI pipeline)
    T+0:45 Pause pipeline; kill orphaned instances
    T+1:30 Engineer identifies bug; develops fix
    T+3:00 Fix deployed
    T+4:00 Pipeline re-enabled; monitor
    T+24h Postmortem; CI cost-monitoring added

SCENARIO 3 — SUDDEN 50% SPIKE ON NON-PROD
  
  Initial signal: deviation alert (non-prod workload up 50%)
                  $2,500/mo increase
                  
  Investigation: feature team ramping up testing
                  Documented in change log
                  Expected for the next 2 weeks
                  
  SEVERITY: SEV-4
    Document
    Track via Operate
    No immediate action
```

Most cost concerns are SEV-3 or SEV-4; SEV-1 and SEV-2 are rarer but consequential.

### The kill-vs-investigate decision — the critical moment

```
KILL IMMEDIATELY when:
  ✓ Cost trajectory clearly unsustainable
    (will exhaust budget in hours/days)
  ✓ Suspected credential compromise
    (every minute the workload runs = more cost)
  ✓ Source is OBVIOUS (one specific resource group)
  ✓ Risk of kill (data loss) is LOW
    (training jobs with checkpoints, test workloads)
  ✓ Off-hours (no engineer to investigate live)
  
INVESTIGATE FIRST when:
  ✓ Cost growth is sustainable / explained
  ✓ Source ISN'T identified yet
  ✓ Killing could cascade (production dependencies)
  ✓ Risk of kill is HIGH (data loss possible)
  ✓ Business hours (engineers available)
  ✓ Workload is customer-facing production

WRONG DECISION CONSEQUENCES:
  Kill when should have investigated: data loss, service impact
  Investigate when should have killed: cost continues to spike;
    potentially $50K+ wasted while you "investigate"

DEFAULT for ambiguous cases:
  Page the team lead; collective decision
  Default to "investigate" if any production involvement
  Default to "kill" if security incident suspected
```

This decision is the highest-stakes part of cost-incident response.

### Detection signals

```
ZopNight + cloud-native alerts trigger:
  
  COST ANOMALY (existing baseline + sudden spike):
    Daily cost > 2× baseline
    Hourly cost > 3× baseline
    Triggers SEV-3+ investigation
    
  BUDGET THRESHOLD:
    Configured per team/workload
    Triggers SEV-2/3 based on threshold severity
    
  CLOUD-NATIVE (AWS Cost Anomaly Detection):
    Catches patterns outside normal
    Latency: 6-24 hour delay
    Use as backup signal
    
  CUSTOM:
    Hourly cost rate check (catches faster than daily)
    Resource count anomaly (1000 new instances = anomalous)
    Specific resource-type spike (sudden GPU costs)
```

The detection latency varies; design for the worst case.

### Response runbook structure

```
COST INCIDENT RUNBOOK (per-team document):

1. DETECTION
   What alerts trigger which severity?
   Who gets paged?
   
2. INITIAL TRIAGE (first 5 minutes)
   What information to gather?
   Identify: source, scope, trajectory
   
3. KILL-OR-INVESTIGATE DECISION
   Decision tree based on signal
   Authority to kill (team lead? on-call?)
   
4. KILL PROCEDURE
   Step-by-step for common runaways
   Approval requirements
   Rollback if killed wrong thing
   
5. INVESTIGATION PROCEDURE
   What logs to check
   Who to contact
   How to track cost while investigating
   
6. ESCALATION
   When to escalate to leadership
   When to engage security
   Customer comms if applicable
   
7. POSTMORTEM
   Template
   Cost impact summary
   Process improvements
```

Print the runbook; reference during incidents. Update post-incident.

---

## 2. Demo

A real SEV-1 cost incident:

```
INCIDENT (May 2026, 3 AM UTC):

T+0:00    AWS Cost Anomaly fires
          Subject: "Cost up 800% in last 3 hours in us-east-2"
          Auto-routed to FinOps on-call
          
T+0:01    FinOps on-call paged (Slack + PagerDuty)
          On-call: alice@platform
          
T+0:03    Initial investigation:
          ZopNight → Cost by Service → us-east-2 → last 3h
          Spike entirely from EC2 in us-east-2
          Specifically: GPU instances (p4d.24xlarge)
          47 new instances in last 3 hours
          
T+0:05    Identify origin:
          Resource group: ml-experiments
          Tags: experiment-id=null (suspicious)
          Owner tag: invalid email
          Created by: AWS access key AKIA... (not familiar)
          
T+0:08    Suspected: credential compromise or rogue automation
          Risk assessment:
            Cost trajectory: $4,200 in 3 hours = $33K/day continued
            Source: clearly malicious (invalid tags)
            Risk of kill: low (training jobs, no production deps)
          
T+0:10    DECISION: SEV-1, kill immediately
          Authority: on-call has authority for SEV-1 kill
          Brief platform-lead via Slack
          
T+0:12    Execute kill:
          aws ec2 terminate-instances --instance-ids \
            i-aaa i-bbb ... (47 instances)
          All instances terminated
          
T+0:15    Cost rate confirms drop:
          New instances per minute: 0 (was 8/min)
          Current spend rate: normal
          
T+0:20    Forensics begin:
          Identify the access key
          Disable it immediately
          Audit log: when was it used? from where?
          Source IP: external (not internal network)
          
T+0:30    Root cause emerging:
          Access key was CI/CD token committed to a public repo
          GitHub leaked-credentials alert had fired 2 hours earlier
          Alert email went to engineer who was offline
          
T+0:45    Containment:
          All access keys rotated org-wide for affected scope
          GitHub repo cleaned (key deleted from history)
          GitHub credentials audit kicked off
          
T+1:00    Incident closed (cost-wise)
          Security incident continues
          
T+1 hour Communication:
          Slack to #eng-platform: "Cost incident contained;
            details to follow in postmortem"
          
T+24h     Postmortem:
          Total wasted spend: $4,800
          Time from detect to mitigate: 12 minutes
          Time from credentials leak to mitigation: ~26 hours
            (this is what we need to improve)
          
          Action items:
            1. Subscribe leaked-credentials alerts to oncall channel
            2. Auto-disable AWS keys flagged by GitHub
            3. Audit other repos for committed credentials
            4. Implement OIDC for CI (no long-lived keys)
            5. Hourly cost-spike detection (catch faster than daily)

OUTCOME:
  Cost runaway prevented (would have been $33K/day)
  Security incident properly handled
  Process improvements identified
  Team confidence in runbook
```

The runbook works because it was documented, practiced, and trusted.

---

## 3. Hands-on (5 min)

Define cost-incident criteria for your team:

```
□ STEP 1: Define SEV thresholds
  SEV-1: __________ (what triggers it?)
  SEV-2: __________
  SEV-3: __________
  SEV-4: __________

□ STEP 2: Identify response responsibilities
  SEV-1: who pages? __________
  SEV-2: who pages? __________
  SEV-3/4: who tracks? __________

□ STEP 3: Document kill-vs-investigate rules
  Kill criteria: __________
  Investigate criteria: __________

□ STEP 4: Build runbook outline
  □ Detection signals
  □ Initial triage
  □ Decision tree
  □ Kill procedure
  □ Investigation procedure
  □ Escalation
  □ Postmortem

□ STEP 5: Schedule test
  Annual drill: practice cost incident response
  Date: __________
```

A 30-minute exercise defines the framework. Annual drill validates it.

---

## 4. Knowledge check

### Q1
A 5× daily cost spike on a single resource group, sustained:

A. Random fluctuation; ignore
B. SEV-2. Sustained 5× spike usually exceeds budget tolerance and indicates real problem. Investigate within hours; corrective action needed. Notify finance + leadership. Not yet SEV-1 unless trajectory is unsustainable for the business.
C. SEV-4
D. Not actionable

<details>
<summary>Show answer</summary>

**Correct: B.** Significant spike = SEV-2; investigate within hours.
</details>

### Q2
Suspected credential compromise driving cost:

A. Investigate first to confirm
B. Kill the workloads IMMEDIATELY. Stop the bleeding. Every minute the workload runs = more cost. Then security incident process. Cost is incidental to the bigger issue (credential compromise). SEV-1 default for compromise scenarios.
C. Random
D. Wait for more data

<details>
<summary>Show answer</summary>

**Correct: B.** Kill first; investigate after. Compromise = SEV-1.
</details>

### Q3
A 50% spike with clear cause (new feature ramping):

A. SEV-1
B. SEV-3 or 4. Cost growth is expected; documented in change log; no incident response needed. Document; track via Operate; review trend. Not all cost growth is an incident — expected growth is just growth.
C. Random
D. SEV-2

<details>
<summary>Show answer</summary>

**Correct: B.** Expected growth ≠ incident.
</details>

---

## 5. Apply

Cost SEV criteria + response playbook in team runbook. Test annually with a drill.

For your team: define SEV thresholds; document runbook; reference during incidents; update post-incident.

---

## Related lessons

- [L2 — Cost-aware incident commander](L2_commander.md) *(next)*
- [L3 — Cost incident communication](L3_communication.md)
- [L4 — Action items + postmortem](L4_action_items.md)
- [T4.M4.5 — Anomaly response](../../T4_finops_mastery/M4.5_anomaly_response/00_README.md)

## Glossary terms touched

[Cost SEV](../../../reference/glossary/cost-sev.md) · [Kill-or-investigate](../../../reference/glossary/kill-or-investigate.md) · [Cost runaway](../../../reference/glossary/cost-runaway.md) · [Compromise-driven cost incident](../../../reference/glossary/compromise-cost-incident.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.7.L1
