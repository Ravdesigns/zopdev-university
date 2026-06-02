# The 3-step workflow (precondition → action → validate)

§ T2 · M2.3 · L1 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **trace** any auto-remediation through its 3-4 step workflow, **understand** why each step exists, **and reason** about timing and failure modes.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand how auto-remediation works internally so I can trust it for action and debug it when it doesn't behave as expected." |
| **Personas** | Platform Engineer · SRE · FinOps Engineer |
| **Prerequisites** | M2.1 · M2.2 |
| **Time** | 9 minutes |
| **Bloom verb** | Trace (Apply), Understand (Understand), Reason (Analyze) |

---

## 1. Concept

Every auto-remediation runs 3 or 4 steps in order. Each step has a defined success/failure state. The workflow halts on first failure (no partial state to clean up).

```
STEP 1: PRECONDITION
  Confirm the recommendation is still valid (resource state hasn't changed)
  Re-run the rule's Evaluate with current data
  If the recommendation no longer holds: halt with "stale finding" status
  
STEP 2 (OPTIONAL): APPROVAL
  For destructive operations (delete, terminate, scale-to-zero)
  Send approval request to designated admin
  Wait for human approval (default SLA: 24h)
  If declined or timed out: halt
  
STEP 3: ACTION
  Execute the cloud action via the provisioner
  For Start/Stop: executor handles directly
  For pause/delete: provisioner orchestrates with cascading
  
STEP 4: VALIDATE
  Re-check the cloud-side state to confirm the action took effect
  Within 60 seconds typically; longer for K8s cluster operations
  If validation fails: mark "applied but unverified"; notify team
```

The workflow is deterministic + observable. Every step's progress shows in the UI.

### Why 4 steps — the rationale

```
PRECONDITION exists to prevent acting on stale findings
  Scenario: rec fired 3 hours ago; someone already terminated the resource
  Without precondition: ZopNight tries to terminate an already-gone resource
  With precondition: re-check; "already remediated" success; no wasteful action

APPROVAL exists to route high-blast-radius operations through humans
  Some actions are reversible (start/stop); some aren't (delete)
  Customer policy determines which require approval
  Default: deletes always require; starts/stops typically don't

ACTION is the actual cloud API call
  EC2: terminate-instances
  EBS: delete-volume + create-snapshot first
  RDS: delete-db-instance (with final-snapshot)
  
VALIDATE exists because cloud APIs are eventually consistent
  "Success" response sometimes means "queued" not "done"
  Validation re-reads the state to confirm
  Catches the rare case where API claims success but action failed
```

Each step has a purpose. None is redundant.

### Step execution model

```
EACH STEP HAS STATUS:
  pending     (not started yet)
  running     (in progress)
  succeeded   (done; can proceed to next)
  failed      (halted; workflow stops)
  skipped     (not applicable for this rule type)
  
UI SHOWS PROGRESS IN REAL TIME:
  REMEDIATION: term-idle-i-0abc (RC-001)
  ─────────────────────────────────────────────────
  [●] STEP 1: Precondition       succeeded  (1.2s)
  [●] STEP 2: Approval           skipped (rule pre-approved)
  [◐] STEP 3: Action             running   (4.8s elapsed)
  [ ] STEP 4: Validate           pending
```

Visible progress = trust. Engineers see what's happening.

### How long the workflow takes

```
TYPICAL TIMING per step:
  
  Precondition:                       1-3 seconds
  Approval (when required):           0 sec to 24 hr (human-bounded)
  Action — EC2/EBS:                    5-30 seconds
  Action — RDS termination:           30-60 seconds (with snapshot)
  Action — EKS/GKE/AKS cluster:       30 sec to 5 min
  Validate:                            5-60 seconds
  
TOTAL DURATIONS:
  No approval, fast resource (EC2 stop):       10-15 sec
  No approval, RDS termination:                 60-90 sec
  No approval, K8s cluster operation:           3-6 min
  With approval: 4 hrs to 24 hrs (human-bounded)
```

Most actions complete within a minute; K8s operations take longer; approval-gated actions can be days.

### Idempotency — workflow can re-run safely

```
RE-RUNNING A COMPLETED REMEDIATION:
  Precondition re-checks the resource
  If already in target state: halts with "already remediated"
  Action is a no-op (cloud-side state already matches)
  Validation confirms still-in-state
  
RE-RUNNING A FAILED REMEDIATION:
  Retries from the failed step (not from precondition)
  Subsequent steps re-execute
  No re-doing of prior successful steps
  
GUARANTEE: workflow can be re-run without harm
  Idempotency is the safety property
```

The idempotency means engineers can re-try with confidence.

### What happens at each failure mode

```
FAILURE MODE                                  WORKFLOW BEHAVIOR
────────────────────────────────────────────────────────────────────
Precondition fails (stale finding)            Halt; status "stale"
                                              Recommendation moves to optimised
                                              
Approval declined                              Halt; status "approval declined"
                                              Audit logged with declining user
                                              
Approval timeout (24h elapsed)                 Halt; new approval request required
                                              For retry
                                              
Action returns user_action error              Halt; show fix hint + console link
                                              (Customer fixes; can retry)
                                              
Action returns transient error                 Auto-retry (3 attempts, exp backoff)
                                              If still fails: status "transient_exhausted"
                                              
Action returns system error                    Halt; copy diagnostic + contact support
                                              (ZopNight engineering investigates)
                                              
Validation fails after action                  Mark "applied but unverified"
                                              Notify team
                                              Human verifies; manual close
```

Three error classes (user_action, transient, system) are explored in L4.

### Halt-on-first-failure semantics

```
WHY HALT (vs continue with errors):
  Each step depends on prior steps succeeding
  Partial completion = unclear state
  Halt = clean, observable point to investigate
  
ALTERNATIVE (continue with errors):
  Risk: cascading wrong actions
  Risk: untraceable partial state
  Risk: harder to debug
  
ZOPNIGHT CHOOSES HALT:
  Conservative; observable
  Engineer chooses retry strategy
  Audit log clearly shows the failure point
```

The conservative choice. Better to halt than to wreck.

### Audit log per workflow

```
EVERY WORKFLOW RUN logs:
  Recommendation ID
  Rule ID + version
  Resource UID
  User who triggered (or "auto-remediation cron")
  Timestamp of each step
  Step results (succeeded/failed; duration)
  Cloud API responses
  Approval grants/declines (if applicable)
  Final status + duration
  
RETRIEVAL:
  Settings → Audit → Auto-Remediation
  Filter by user, resource, date, status
  Export for compliance
```

The audit log is complete; every action is reproducible.

### Workflow variations by rule type

```
SIMPLE RULES (e.g., RC-001 idle EC2):
  Precondition → Action → Validate (3 steps)
  Approval typically skipped (pre-approved certified rules)
  
DESTRUCTIVE RULES (e.g., RDS deletion):
  Precondition → Approval → Action (with backup) → Validate (4 steps)
  Approval required by default
  
K8S RULES (e.g., cluster termination):
  Precondition → Approval → Action (cascading) → Validate
  Cascading: terminate dependent resources first
  Long validation: cluster takes minutes to fully terminate
  
SCALE OPERATIONS (e.g., scale-to-1):
  Precondition → Action (scale change) → Validate
  Approval typically skipped
  Reversible action
```

The variations are determined by the rule's blast radius.

---

## 2. Demo

A successful idle-EC2 remediation walked through:

```
T+0       User clicks Apply Remediate on RC-001 card
          Workflow begins

T+0.8s    STEP 1 (Precondition) starts
          Re-evaluating rule with current resource state
          
T+1.2s    STEP 1 (Precondition) SUCCEEDED
          Resource still stopped (status=stopped)
          Still 47 days old (time-in-state)
          Recommendation still valid
          
T+1.2s    STEP 2 (Approval) SKIPPED
          Rule pre-approved: idle EC2 in non-prod environment
          Customer's policy: skip approval for low-blast-radius
          
T+1.3s    STEP 3 (Action) starts
          - Pre-action: create snapshot of attached EBS (in progress)
          
T+4s      Pre-action: snapshot created (3 sec)
          Snapshot ID: snap-0xyz123
          
T+4.1s    Main action: ec2:TerminateInstances on i-0abc123
          Terminating...
          
T+10s     ec2:TerminateInstances SUCCESS
          Termination queued (eventually consistent)
          
T+10.1s   Cascading: ec2:DeleteVolume on attached EBS (3 sec)
          
T+13s     STEP 3 (Action) SUCCEEDED (entire step duration)
          
T+13s     STEP 4 (Validate) starts
          
T+15s     ec2:DescribeInstances → instance state = terminated ✓
          ec2:DescribeVolumes → volume not found ✓
          
T+18s     STEP 4 (Validate) SUCCEEDED
          
T+18s     WORKFLOW COMPLETE
          Status: succeeded
          Notification fires to #finops-info
          Savings projection: $69.20/mo (rack rate)
          Audit log entry created
```

18 seconds from intent to verified action. Fully audited; reproducible.

---

## 3. Hands-on (5 min)

In a sandbox (or low-stakes resource), apply an auto-remediation:

```
□ STEP 1: Pick a low-stakes recommendation
  Recommendation: __________
  Resource: __________
  Severity: __________

□ STEP 2: Click Apply Remediate
  Note start time

□ STEP 3: Watch the workflow
  Precondition duration: ___ sec
  Approval status: ___ (succeeded / skipped)
  Action duration: ___ sec
  Validate duration: ___ sec
  Total duration: ___ sec

□ STEP 4: Verify outcome
  Notification fired? □ Yes □ No
  Audit log entry? □ Yes □ No
  Cloud-side action visible? □ Yes □ No

□ STEP 5: Re-trigger
  Try applying again
  Expected: "already remediated"
  Confirm idempotency
```

A 10-minute hands-on builds intuition for the workflow timing.

---

## 4. Knowledge check

### Q1
The precondition step's purpose:

A. Authorize the user
B. Confirm the recommendation is still valid (resource state hasn't changed). Prevents acting on stale findings. If someone already terminated the resource manually, precondition catches that; "already remediated" instead of failing.
C. Encrypt the credentials
D. Notify the team

<details>
<summary>Show answer</summary>

**Correct: B.** Precondition guards against stale findings; idempotency starts here.
</details>

### Q2
A remediation's action step succeeds but validation fails. What happens:

A. Workflow restarts from precondition
B. Marked "applied but unverified," notifies the team. The cloud reports the change went through but ZopNight can't confirm — could be eventual consistency. Human investigates; can manually close.
C. Reverted automatically
D. Logged silently with no notification

<details>
<summary>Show answer</summary>

**Correct: B.** Honest about the gap. Human investigates the rare cases.
</details>

### Q3
The total typical time for an auto-remediation without approval:

A. <1 second
B. 10-15 seconds for simple resources (EC2 stop); 30-60 seconds for RDS terminations; 3-6 minutes for K8s clusters. Resource type drives duration; cloud API latency is the bottleneck.
C. Always under 60 seconds
D. Several hours

<details>
<summary>Show answer</summary>

**Correct: B.** Resource type drives duration.
</details>

---

## 5. Apply

Remediation workflow visible in real time on the recommendation card during apply. Per-action audit log entry covers the full step trace.

For your team: trust comes from observability. Watch a few remediations end-to-end; understand the timing; rely on the audit trail.

---

## Related lessons

- [L2 — Certified rules](L2_certified_rules.md) *(next)*
- [L3 — Approval gate](L3_approval_gate.md)
- [L4 — Error classes](L4_error_classes.md)
- [L5 — Database denylist](L5_database_denylist.md)
- [L6 — Terminal notifications](L6_terminal_notifications.md)
- [M2.1.L3 — Rule interface](../M2.1_rule_library/L3_rule_interface.md)

## Glossary terms touched

[Auto-remediation workflow](../../../reference/glossary/auto-remediation-workflow.md) · [Precondition](../../../reference/glossary/precondition.md) · [Idempotency](../../../reference/glossary/idempotency.md) · [Validation](../../../reference/glossary/validation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L1
