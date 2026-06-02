# Three error classes — user_action, transient, system

§ T2 · M2.3 · L4 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **triage** any remediation failure into the right error class, **execute** the appropriate fix path, **and avoid** the support-ticket reflex for issues you can fix yourself.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Diagnose remediation failures correctly — fix what I can fix, retry what auto-retries, escalate only the truly novel." |
| **Personas** | Platform Engineer · SRE · FinOps Engineer |
| **Prerequisites** | M2.3.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Triage (Apply), Execute (Apply), Avoid (Apply) |

---

## 1. Concept

Remediation failures fall into three classes. Each has a defined UI treatment, fix path, and audit posture. Classifying correctly = fast resolution.

```
THE THREE CLASSES:

user_action (yellow)
  Cloud rejected because customer must fix something
  Examples: missing permission, quota exceeded, in-use
  Fix: customer addresses; retry
  
transient (blue)
  Cloud returned temporary error
  Examples: 429 rate limit, 5xx server error, throttling
  Fix: auto-retries (3 attempts); customer waits
  
system (red)
  Cloud returned unsupported state ZopNight didn't anticipate
  Examples: unexpected cloud API behavior, edge case
  Fix: escalate to support
```

The class determines the response. Don't open support tickets for user_action errors.

### Class 1 — user_action (yellow)

The cloud rejected the action because of a permission, quota, or configuration that the customer must fix.

```
EXAMPLES:
  "AccessDenied: missing ec2:TerminateInstances"
  "InvalidParameterValue: quota exceeded for terminations/day"
  "InstanceInUse: instance is part of an active SSM session"
  "ResourceInUse: cannot delete; attached to other resources"
  "ValidationException: parameter X violates policy Y"

UI TREATMENT:
  Yellow alert color
  Shows the exact missing permission or constraint
  Provides console link to relevant IAM / quota / config page
  Suggests fix steps
  
THE FIX:
  Customer fixes the underlying cloud-side issue
  Then retries the remediation
  No ZopNight involvement needed
```

### user_action error display

```
USER_ACTION ERROR DISPLAY:
─────────────────────────────────────────────────────────
⚠ Action requires customer intervention

Error:    AccessDenied — missing ec2:TerminateInstances permission

To fix:
  1. Add the permission to your IAM role (template provided)
  2. Wait ~30 seconds for IAM to propagate
  3. Retry this remediation

[View IAM template →]    [Retry remediation]
```

Self-service fix. The team handles without ZopNight involvement.

### Class 2 — transient (blue)

The cloud returned a temporary error. Resolves on retry; no customer action needed.

```
EXAMPLES:
  "RateExceeded: throttling, please retry"
  "InternalServerError: please retry"
  "RequestLimitExceeded: too many requests"
  "ServiceUnavailable: try again in 30 seconds"

UI TREATMENT:
  Blue info color
  Auto-retries with exponential backoff (3 attempts default)
  If retries exhaust, shows underlying error + retry CTA
  
THE FIX:
  Automatic: ZopNight retries
  If exhausts: customer manually retries
  Usually self-resolves
```

### transient error display

```
TRANSIENT ERROR DISPLAY:
─────────────────────────────────────────────────────────
ℹ Temporary error, retrying

Error:    RateExceeded — cloud API throttling

Attempt 2 of 3, retrying in 4 seconds...
```

Customer can ignore; auto-retry handles it.

### Class 3 — system (red)

The action returned an unsupported state — the operation cannot complete as designed. Typically a cloud API behavior ZopNight didn't anticipate.

```
EXAMPLES:
  "OperationAborted: cannot terminate instance with attached EFS"
  "UnsupportedOperation: cluster requires manual deletion via console"
  "ResourceStateConflict: incompatible state for this action"
  "Unhandled cloud response: <unrecognized error>"
  Novel error patterns not yet handled

UI TREATMENT:
  Red alert color
  Surfaces the diagnostic detail
  Provides "Copy Diagnostic" + "Contact Support" buttons
  Halts the workflow
  
THE FIX:
  Customer files support ticket with diagnostic
  ZopNight engineering investigates
  Either: adds handling to the rule, OR
  Documents the limitation
```

### system error display

```
SYSTEM ERROR DISPLAY:
─────────────────────────────────────────────────────────
✕ Action could not complete

Error:    UnsupportedOperation: cluster requires manual deletion via console

Diagnostic:
  Resource:  eks-cluster-prod-1
  Action:    deleteCluster
  Returned:  HTTP 400, body: ...
  Trace ID:  abc-123-def-456

[Copy Diagnostic]    [Contact Support]
```

System errors are rare but important. They drive product improvement.

### Auto-retry behavior

```
TRANSIENT ERROR             RETRY STRATEGY
──────────────────────────────────────────────────────────
Rate limit (429)            3 attempts; exponential backoff: 2s, 4s, 8s
5xx errors                  3 attempts; exponential backoff: 2s, 4s, 8s
Eventual consistency        3 attempts; exponential backoff: 2s, 4s, 8s
Timeout                     3 attempts; longer backoff: 10s, 30s, 60s
──────────────────────────────────────────────────────────

USER_ACTION ERRORS           No retry (customer must fix first)
SYSTEM ERRORS                No retry (manual support)
```

After retries exhaust on transient errors, the failure is reported with the underlying transient cause and a manual retry CTA.

### Sensitive data redaction in errors

Before storage or display, certain fields in error messages are redacted:

```
REDACTED                                  STORED AS
─────────────────────────────────────────────────────
AWS account IDs (12-digit)                ****-****-****
GCP project IDs (long)                    [project-id]
Azure subscription IDs                    ****-****-****
IP addresses (private)                    ***.***.***.x
SDK divider lines (verbose stacks)        trimmed to essential
Bearer tokens, keys                       *** redacted ***
```

Customer-visible content carries identifiers needed for action; sensitive identifying material is stripped before persistence. SOC 2 / ISO 27001 / regulatory friendly.

### Class triage decision tree

```
REMEDIATION FAILED. What class?

  Does the error mention "permission" or "AccessDenied"?
    YES → user_action
    
  Does the error mention "rate limit" or "throttling" or "InternalServerError"?
    YES → transient (auto-retry will handle)
    
  Did auto-retry attempts succeed eventually?
    YES → transient (resolved)
    
  Did auto-retry attempts exhaust?
    YES → transient_exhausted (customer retries manually)
    
  Does the error mention "ResourceInUse" or "QuotaExceeded"?
    YES → user_action (customer fixes upstream)
    
  Is the error pattern UNKNOWN / unhandled?
    YES → system (escalate to support)

OUTCOME:
  user_action: customer fixes; retries
  transient: wait or manually retry
  system: file ticket with diagnostic
```

The decision tree is mechanical; most engineers internalize it after 3-5 examples.

### Common user_action fixes

```
COMMON USER_ACTION ERRORS + FIXES:

  AccessDenied (permission missing)
    → Add IAM policy with required permission
    → Wait 30s for IAM propagation
    → Retry
    
  Quota exceeded
    → Request quota increase via cloud console
    → Or: wait until quota refreshes
    → Then retry
    
  ResourceInUse (instance in active session)
    → Wait until session ends
    → Or: terminate session via console
    → Then retry
    
  PreconditionFailed (resource state changed)
    → Re-evaluate the recommendation
    → State may have changed since rec fired
    
  ParameterValidationError
    → Check the parameters in the workflow
    → Usually indicates rule needs update (file ticket)
```

Most user_action errors are 5-minute fixes.

### When transient becomes system

```
EDGE CASE: transient_exhausted (3 retries failed)
  
  IF user can retry manually and it succeeds:
    Still transient — just slower
    
  IF user retries and same error persists:
    Becoming system — escalate
    Cloud-side issue beyond ZopNight's retry strategy
```

The boundary between transient and system blurs at edge. Default to transient; escalate if persistent.

---

## 2. Demo

A failed remediation walked through:

```
ACTION: Terminate EKS cluster eks-prod-1 (RC-equivalent for idle EKS)

T+0       Workflow steps 1, 2, 3 begin
T+1.2s    Precondition succeeds
T+1.2s    Approval skipped (rule pre-approved)
T+1.3s    Action step starts
T+45s     Action returns error:
          "Resource has attached EFS volume; cannot delete cluster
            without first detaching."

T+46s     ZopNight classifies as SYSTEM error
          (unhandled cloud response; novel pattern)
          
T+46s     Workflow halts
T+46s     UI shows red alert with diagnostic detail:
            Error:    OperationAborted
            Resource: eks-prod-1
            Reason:   EFS mounted to multiple pods
            Trace:    abc-123-def-456
          
T+46s     "Copy Diagnostic" + "Contact Support" buttons appear

OUTCOME:
  Customer copies the diagnostic
  Files support ticket with ZopNight
  ZopNight engineering investigates
  
  Resolution (1 week later):
    Rule updated to detect attached EFS
    Recommendation now suggests:
      1. Detach EFS first
      2. Then terminate cluster
    Or: skip the recommendation entirely if EFS detection
        suggests data is in use
  
  Customer notified
  Trust earned through transparent investigation
```

System errors are the rare-but-important class. They drive product improvement.

### Compare: user_action example

```
ACTION: Terminate EC2 instance i-0abc

T+0       Workflow begins
T+5s      Action returns: AccessDenied
          "missing ec2:TerminateInstances"

T+5s      ZopNight classifies as USER_ACTION
T+5s      UI shows yellow alert:
            ⚠ Action requires customer intervention
            
            Error: missing ec2:TerminateInstances permission
            
            To fix:
              1. Add permission to IAM role
                 (IAM template provided)
              2. Wait ~30 seconds for IAM propagation
              3. Click "Retry remediation"
            
            [View IAM template →]    [Retry remediation]

CUSTOMER ACTION (5 min):
  Reviews IAM template
  Updates role
  Waits 30 seconds
  Clicks Retry
  
T+5 min + 5s   Action succeeds
T+5 min + 18s   Workflow complete
                Savings realized
```

The customer fixed it without support ticket. user_action errors are common; self-service.

---

## 3. Hands-on (5 min)

If you have a recent failed remediation, classify it:

```
□ STEP 1: Open the failed recommendation
  Error message: __________

□ STEP 2: Classify
  □ user_action (permission, quota, in-use)
  □ transient (rate limit, 5xx, timeout)
  □ system (novel; unhandled)

□ STEP 3: Take action
  user_action: __________ (fix yourself)
  transient: __________ (retry or wait)
  system: __________ (copy diagnostic + support ticket)

□ STEP 4: Verify resolution
  Did the fix work? □ Yes □ No
  Underlying issue: __________
```

A 5-minute classification + 5-minute fix on most user_action errors.

---

## 4. Knowledge check

### Q1
A remediation fails with "AccessDenied: missing ec2:TerminateInstances." The error class:

A. transient
B. system
C. user_action — the cloud denied the call due to a permission the customer must add. Fix: update IAM role; retry. No ZopNight involvement needed.
D. Random

<details>
<summary>Show answer</summary>

**Correct: C.** AccessDenied is canonical user_action.
</details>

### Q2
A remediation fails twice with rate-limit errors, then succeeds on the third attempt. The class:

A. user_action
B. transient — auto-retry handles this without customer involvement. The system did exactly what it should. Customer doesn't need to do anything.
C. system
D. Bug

<details>
<summary>Show answer</summary>

**Correct: B.** Transient errors auto-retry by design.
</details>

### Q3
A system-error remediation outcome. Best next step:

A. Retry indefinitely
B. Click "Copy Diagnostic" + "Contact Support." ZopNight engineering investigates and either updates the rule or documents the limitation. System errors are rare; they drive product improvement; manual intervention not effective.
C. Manually fix in the cloud console
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** System errors require engineering attention.
</details>

---

## 5. Apply

Error classes appear inline on the recommendation card after a failed remediation. The audit log preserves the full error context with redaction applied.

For your team: the classification skill saves support tickets. user_action = self-fix; transient = wait; system = escalate.

---

## Related lessons

- [L1 — 3-step workflow](L1_three_step_workflow.md)
- [L2 — Certified rules](L2_certified_rules.md)
- [L3 — Approval gate](L3_approval_gate.md)
- [L5 — Database denylist](L5_database_denylist.md) *(next)*
- [L6 — Terminal notifications](L6_terminal_notifications.md)

## Glossary terms touched

[user_action error](../../../reference/glossary/user-action-error.md) · [transient error](../../../reference/glossary/transient-error.md) · [system error](../../../reference/glossary/system-error.md) · [Error class triage](../../../reference/glossary/error-class-triage.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L4
