# The approval gate

§ T2 · M2.3 · L3 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** approval-gated remediation, **route** approval requests to the right approvers, **and balance** safety (approval) with velocity (auto-execute).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Set up approval gates that add safety without becoming ceremonial — gate the high-risk; auto-execute the low-risk." |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Manager |
| **Prerequisites** | M2.3.L1 · M2.3.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Route (Apply), Balance (Evaluate) |

---

## 1. Concept

The approval gate is a configurable step in the remediation workflow that routes a request to a human before the cloud action fires. Default-off for low-risk actions; default-on for destructive ones.

```
THE GATE PATTERN:
  
  WITHOUT approval gate:
    Auto-rem detects → workflow runs → action happens
    Fast; risky for high-blast-radius actions
    
  WITH approval gate:
    Auto-rem detects → workflow pauses → approver decides
    Slower; safer; documents intent
```

The right balance: gate the actions that need human judgment; skip for routine.

### When approval fires — defaults

Configurable per rule + per scope:

```
RULE                                       APPROVAL DEFAULT
────────────────────────────────────────────────────────────
RC-001 Idle EC2 (non-prod tagged)           Off
RC-001 Idle EC2 (prod-tagged)               On
RC-002 Orphan EBS                            Off (low risk)
RC-202 Idle RDS                              On (data risk)
RC-303 Pause App Runner                      On (service risk)
K8s scale-to-zero (non-prod)                Off
K8s scale-to-zero (prod)                     ALWAYS (cannot disable)
Database termination                          ALWAYS
IAM modifications                             ALWAYS
```

The convention: destructive on production = approval-gated. Non-prod or reversible = optional. Some actions hard-coded to always require approval.

### Configuration interface

```
Settings → Auto-Remediation → Per-Rule Settings

RULE: RC-001 Idle EC2
─────────────────────────────────────────────────────────
Auto-remediation: ENABLED

Approval REQUIRED when:
  ● Tag environment != "dev" or "staging"
  ● Resource cost > $500/mo
  ● Resource type = rds | redshift | elasticache
  ● Resource location = critical-prod-account

Approver:
  ● Primary: admin-team@zopcloud.com
  ● Backup:  ops-lead@zopcloud.com
  ● Escalation: cto@zopcloud.com (after 12h)
  
Approval SLA: 24 hours
Auto-cancel on timeout: true (don't execute if no approval)
Notification channels:
  ● Slack DM + #approvals
  ● Email
  ● In-product
```

The configuration is rich enough to handle most scenarios. Tag-based, cost-based, type-based criteria.

### Approval channels

When the gate fires:

```
NOTIFICATION sent to designated approver via:
  - Slack DM (if Slack-configured user)
  - Email (always)
  - In-product notification (for app users)

THE NOTIFICATION INCLUDES:
  Resource name, type, current state
  Recommendation details (savings projection)
  Evidence summary
  Resource location (account, region)
  APPROVE / DECLINE buttons (deep-link to ZopNight)
  
RICH CONTEXT for the approval decision:
  Approver sees enough to decide without ZopNight context
  Slack-based approval: 1-click via mobile if needed
  Email approval: link to ZopNight UI
```

The notification is designed for fast, informed decisions.

### Approval workflow timeline

```
T+0          Auto-remediation triggered
             Workflow advances to STEP 2 (approval)
             
T+1 sec      Approval request sent
             Workflow paused
             Resource state unchanged
             
[ human-bounded delay ]

T+12 hr      Approver opens Slack DM
             Reviews details
             Clicks APPROVE
             
T+12 hr+1s   Workflow advances to STEP 3 (Action)
T+12 hr+15s  Action complete
             STEP 4 validates
             Workflow ends
             
OR (alternative path):

T+24 hr      Approval timeout (24-hour SLA)
T+24 hr+1s   Auto-cancel
             Resource state unchanged
             Recommendation remains open for re-attempt
             Notification fires to original triggerer
```

The timing is human-bounded; approval is the slowest step.

### Audit trail for approvals

Every approval action is logged:

```
AUDIT LOG ENTRY:
─────────────────────────────────────────────────────────
Method:    POST /remediations/{id}/approve
User:      sarah-admin@zopcloud.com
Timestamp: 2026-05-19 16:42:11 UTC
Body:      {
             "decision":"approved",
             "comment":"Verified non-prod, safe to proceed"
           }
Source:    Slack DM
IP:        198.51.100.42
```

The comment field is optional but useful for audit evidence. Approver can document reasoning.

### Common approval patterns

```
PATTERN                                  CONFIGURATION
─────────────────────────────────────────────────────────────
Production-only gate                     Approval required for tag env=prod
                                         Off for non-prod

High-value gate                           Approval required for savings > $500
                                         Catches the big one

Specific-type gate                        Approval required for resource type = rds
                                         Database-conscious

24/7 ops team                             SLA 1 hour, page on Slack
                                         Always available approver

Business-hours ops                        SLA 8 hours, email + Slack
                                         Off-hours: queued for morning

Compliance-driven                          Approval required for ALL actions
                                         Maximum auditability

Permissive (lowest friction)               Approval optional / off
                                         Trust + monitoring
```

The pattern matches the team's risk profile. Don't blanket-gate everything; don't blanket-skip everything.

### Approval declined — what happens

```
APPROVAL DECLINED (user clicks Decline):
  Workflow halts immediately
  Status: "approval declined"
  Resource state unchanged
  Decline comment logged
  Recommendation remains open
  
  CONSEQUENCES:
    Original triggerer notified
    Recommendation can be re-attempted later
    Decline reason in audit log for future reference
```

Decline is intentional rejection. Captured cleanly in audit.

### Multi-approver patterns (advanced)

```
SOME ORGS REQUIRE MULTIPLE APPROVERS:
  
  TWO-PERSON RULE:
    Both approvers must approve
    First clicks → "waiting for second approval"
    Second clicks → action proceeds
    For high-stakes actions (production-critical)
    
  ANY-OF-TEAM:
    Any one approver in the team can approve
    Faster than two-person
    For routine non-prod
    
  ESCALATION CHAIN:
    Primary approver gets first
    Backup approver after 4 hours
    Senior after 12 hours
    Ensures action eventually happens
```

Multi-approver patterns trade safety for speed; orgs configure per their needs.

### When approval defeats the purpose

```
APPROVAL CAN BE THEATRICAL:
  
  IF 90% of approvals are routine
  No real judgment value
  Adds latency without safety benefit
  
DIAGNOSE:
  Look at approval decline rates
  Near-zero decline (<5%) = approval is friction without value
  Healthy decline (15-30%) = approval catches genuine cases
  High decline (>50%) = wrong scope; rule is too aggressive

TWO OPTIONS WHEN ROUTINE:
  
  TUNE the criteria
  Narrow the gate to actually-risky scenarios
  Example: "any tag" → "tag=prod only"
  
  REMOVE the gate
  Trust + monitoring instead
  Auto-execute; review post-action
  Lower-risk version of fully-locked approval
```

Track approval metrics. The data tells you whether the gate is doing useful work.

### Approval security

```
WHO CAN APPROVE:
  Configured per rule
  Limited to specific users / groups
  IAM-controlled
  
WHO CANNOT BYPASS:
  Approvals are non-bypassable for the configured rule
  Even admins can't skip the gate
  Hardcoded gates (K8s prod, IAM) require approval always
  
AUDIT IMPACT:
  Every approval action logged
  SOC 2 / ISO 27001 / regulatory friendly
  Documented chain of decision-making
```

The gate is the documented decision point. Auditors love it.

---

## 2. Demo

A team's tuned approval setup after 3 months:

```
TEAM: 50-engineer SaaS, mature auto-remediation adoption

APPROVAL CONFIGURATION (per-rule):

  RC-001 Idle EC2:
    Approval required: tag environment=prod only
    Approver: SRE on-call (1-hour SLA)
    Auto-cancel on timeout: yes
    Result: 90% of recs auto-execute; 10% need eyes
    Decline rate: 15% (healthy)
    
  RC-202 Idle RDS:
    Approval required for all
    Approver: DBA team (24-hour SLA)
    Result: all RDS terminations gate
    Decline rate: 8% (catches genuine concerns)
    
  RC-1701 K8s Deploy idle:
    Approval: not required on non-prod
    Approval: required + locked on prod (hardcoded)
    
  RC-CUSTOM-1 (custom heavy-action rule):
    Off entirely (manual triage)
    Reason: cost too high if wrong; needs full human review

METRICS QUARTERLY REVIEW:
  Approval decline rates by rule
  Time-to-approval averages
  Stuck approvals (timed out)
  
RESULTS Q3:
  Average time-to-approval: 4.2 hours (within SLA)
  Decline rate: 12% org-wide (healthy)
  Stuck approvals: 3 of 412 (0.7%)
  No incidents from auto-rem
```

Each rule has its own configuration. Trust through tuning + observation.

---

## 3. Hands-on (5 min)

Configure approval gates for your enabled rules:

```
□ STEP 1: Settings → Auto-Remediation
  List enabled rules: __________

□ STEP 2: Review each rule's approval configuration
  Rule 1: __________
    Approval required when: __________
    Approver: __________
    SLA: __________
    
  Rule 2: __________
    (same template)

□ STEP 3: Identify mismatches
  Approval required but routine (high decline rate?)
  Approval skipped but high-risk?

□ STEP 4: Plan tuning
  □ Tighten criteria (narrow gate)
  □ Loosen criteria (broader gate)
  □ Update approver / SLA

□ STEP 5: Quarterly metrics review
  Approval decline rate per rule: ___%
  Stuck approval count: _____
  Time-to-approval average: ___ hours
```

A 30-minute audit reveals approval health. Quarterly tuning keeps it healthy.

---

## 4. Knowledge check

### Q1
A team's K8s scale-to-zero on prod always requires approval, even with explicit org config to disable. Why:

A. Bug
B. Hardcoded — prod K8s changes require approval at the rule level, cannot be customer-disabled. Safety architecture: some gates exist at the rule definition, not customer-tunable. Override possible only with engineering review (rare).
C. License limit
D. AWS requires

<details>
<summary>Show answer</summary>

**Correct: B.** Some approvals are at the safety-architecture level, not customer-configurable.
</details>

### Q2
An approval request times out (24h SLA exceeded). What happens to the resource:

A. Action proceeds anyway (assumed approved)
B. Auto-cancel. Resource state unchanged. Recommendation remains open. Team can re-attempt with fresh approval. Conservative default: timeout = no-go. Customer can change this per-rule if business case requires.
C. Approval bypassed
D. Resource is deleted

<details>
<summary>Show answer</summary>

**Correct: B.** Timeout = no-go by default. Conservative.
</details>

### Q3
A team approves 100% of requests with no scrutiny. The right response:

A. Continue as-is
B. Approval is friction without value. Either: tune scope so approval-gated requests are genuinely high-risk (narrow the criteria), or move to monitor mode and auto-remediate (skip the gate; accept the lower safety bar for that rule). Theatrical approvals don't add safety.
C. Disable approval
D. Add a second approver

<details>
<summary>Show answer</summary>

**Correct: B.** Approval should be selective. Routine approvals don't add safety value.
</details>

---

## 5. Apply

Settings → Auto-Remediation → Approval Configuration per rule. Audit log shows every approval decision.

For your team: quarterly approval audit. Track decline rate; tune scope to genuine high-risk.

---

## Related lessons

- [L1 — 3-step workflow](L1_three_step_workflow.md)
- [L2 — Certified rules](L2_certified_rules.md)
- [L4 — Error classes](L4_error_classes.md) *(next)*
- [L5 — Database denylist](L5_database_denylist.md)
- [L6 — Terminal notifications](L6_terminal_notifications.md)

## Glossary terms touched

[Approval gate](../../../reference/glossary/approval-gate.md) · [Approval SLA](../../../reference/glossary/approval-sla.md) · [Multi-approver pattern](../../../reference/glossary/multi-approver-pattern.md) · [Approval decline rate](../../../reference/glossary/approval-decline-rate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L3
