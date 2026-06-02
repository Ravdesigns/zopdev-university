# Notifications — when to enable terminal emails

§ T2 · M2.3 · L6 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** remediation notifications without producing noise, **choose** when to enable terminal notifications, **and tune** channel routing for the right signal-to-noise ratio.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get the right notification at the right time — during rollout for trust-building, then dial down for steady-state." |
| **Personas** | Platform Engineer · SRE · FinOps Lead |
| **Prerequisites** | M2.3.L1 - L5 · T1.M1.6 (notifications) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Choose (Evaluate), Tune (Apply) |

---

## 1. Concept

Remediation actions can fire notifications at multiple points: when started, when completed, when failed. Default behavior is conservative to avoid alert fatigue.

```
NOTIFICATION SPECTRUM:
  
  VERBOSE — every action notifies
    Good for: initial rollout, building trust
    Bad for: steady-state (becomes noise)
    
  DEFAULT — only attention-required notifies
    Approvals, failures, system errors
    Good for: steady-state operations
    
  SILENT — no notifications (audit log only)
    Bad pattern (no visibility)
    Don't use this
```

The right configuration evolves as trust builds.

### What notifications are available

```
EVENT                              DEFAULT
─────────────────────────────────────────────
Approval required                    On — high-value gate
Approval declined                    On
Approval expired                     On (timed out)
Action started                       Off (too noisy at scale)
Action succeeded                     Off by default; opt-in
Action failed (user_action)          On — needs customer attention
Action failed (transient retry)      Off; auto-retry handles
Action failed (system error)         On — needs engineering attention
Validation failed                    On
```

The defaults catch the important; suppress the routine.

### The `REMEDIATION_NOTIFY_TERMINAL` env var

A specific env var gates the verbose mode:

```
REMEDIATION_NOTIFY_TERMINAL = true
  Notify on every action terminal state:
    succeeded, failed, cancelled
  Per-action notification (per recommendation applied)
  
REMEDIATION_NOTIFY_TERMINAL = false  (DEFAULT)
  Notify only on attention-required:
    failed, system errors, approvals
  Successes go silently to audit log
```

For most teams: default is right. Auto-remediated idle EC2 actions don't need a per-action success notification; the weekly digest covers it.

### When to enable terminal notifications

```
THREE SCENARIOS where verbose is right:

1. EARLY-ROLLOUT DEBUGGING
   Team enabling auto-remediation for first time
   Per-action success notifications build visibility
   "Yes, ZopNight just terminated this; here's the proof"
   Trust building period
   Typically 2-4 weeks

2. COMPLIANCE EVIDENCE
   Some compliance frameworks require notification of every action
   SOC 2 / ISO 27001 / regulated environments
   Terminal notifications produce the audit trail
   Stays on indefinitely

3. HIGH-STAKES SCOPING
   Auto-remediating production resources
   Explicit per-action visibility
   Team wants to track every action
   Stays on for production-tier scope
```

After early-rollout debugging period, most teams disable terminal notifications to drop noise. The audit log preserves the events regardless.

### Notification routing for remediation

Remediation notifications follow the same routing rules as other events (T1.M1.6.L4):

```
REMEDIATION CHANNEL                  PURPOSE
─────────────────────────────────────────────────────────────
#finops-rem-success                  Action success (when terminal on)
                                      Volume; only when verbose
                                      
#finops-rem-failures                 Action failures (always on)
                                      Critical; needs attention
                                      
#finops-rem-approvals                 Approval requests
                                      DM to designated approver
                                      Per-rule routing
                                      
#ops-oncall                           Production CRITICAL failures
                                      Page via PagerDuty webhook
                                      
Email digest weekly                   Catch-all for non-urgent
                                      Reduces channel noise
                                      
SIEM webhook                          Compliance evidence collection
                                      Full audit log mirror
                                      For regulated orgs
```

A team can route each event class to a different channel, keeping each channel's signal-to-noise ratio high.

### The approval-required notification format

```
SLACK MESSAGE EXAMPLE:
─────────────────────────────────────────────────────────
🔵 Remediation approval needed

Rule:         RC-202 Idle RDS
Resource:     db-staging-1 (rds db.r5.xlarge)
Account:      staging-aws-us-east-1
Severity:     high
Savings:      $1,420/month

Evidence:
  Connections (30d avg): 0
  Last write activity:    47 days ago
  Status: stopped (90 days)

Action proposed: terminate (with snapshot first)

[APPROVE]    [DECLINE]    [VIEW DETAILS →]
```

The approval message is opinionated — gives enough to decide quickly. Clicking through reveals the full evidence panel if needed.

### Email vs Slack vs webhook

```
CHANNEL TYPE                        WHEN TO USE
─────────────────────────────────────────────────────────
Email                               Default fallback
                                    Compliance documentation
                                    Non-Slack users
                                    
Slack DM                            Real-time approver workflow
                                    Mobile-friendly
                                    Fast response

Slack channel                        Team awareness
                                    Especially for failures
                                    
Microsoft Teams                      Same as Slack for Teams orgs

Google Chat                          Same as Slack for GChat orgs

Webhook (PagerDuty)                  Page on-call for production CRITICAL
                                    24/7 escalation
                                    
Webhook (SIEM)                       Compliance evidence collection
                                    Full audit log mirror
                                    Splunk / Datadog / Elastic
```

Most orgs use email + Slack for primary, PagerDuty for production CRITICAL escalation, SIEM for compliance.

### Suppression — tuning down without losing signal

Notifications can be suppressed:

```
SUPPRESSION RULES                    PATTERN
─────────────────────────────────────────────────────
By resource                          Don't notify on auto-rem events for
                                     specific resources
                                     (e.g., the daily test cluster we always
                                     terminate at midnight)
                                     
By rule                              Don't notify on specific rules
                                     (e.g., RC-002 orphan EBS is routine)
                                     
By severity                          Don't notify on low/info severity
                                     Keep critical visible
                                     
By time-of-day                       Don't notify outside business hours
                                     CRITICAL still pages always
                                     
By success rate                      Don't notify on rules with high
                                     success rate
                                     (the routine ones)
```

Suppression is the lever for tuning down without losing all signal.

### Notification anti-patterns

```
ANTI-PATTERN                              FIX
──────────────────────────────────────────────────────────────────
"Everything to one channel"                Route by class
                                            (success / failure / approval)
                                            
Terminal notifications permanent           Disable after rollout period
                                            Audit log preserves events
                                            
PagerDuty for routine successes            Reserve for prod CRITICAL only
                                            On-call fatigue otherwise
                                            
No notifications at all                     At minimum: failures + approvals
                                            Silent failures = unaddressed issues
                                            
Same notification scheme for all teams      Different teams; different needs
                                            Per-team or per-account routing
                                            
Notifications without context              Include savings, resource, evidence
                                            Approver can decide without
                                            ZopNight context
```

The discipline: notify with intent; suppress with discipline; audit always.

### Notification health metrics

```
TRACK QUARTERLY:
  Notifications per day (total)
  Approval response time (avg)
  Approval timeout rate (%)
  Failed action investigation time
  
HEALTHY METRICS:
  <50 notifications/day (typical mid-size org)
  Approval response <8 hours (within SLA)
  Approval timeout rate <2%
  Failed action investigation <24 hours
  
UNHEALTHY:
  Spike in notifications (maybe a runaway rule)
  Approvals timing out frequently (overloaded approver)
  Failed actions sitting (process gap)
```

The metrics inform tuning. Notifications are a feedback loop on the broader auto-rem program.

---

## 2. Demo

A team's notification rollout over 3 months:

```
MONTH 0 (initial enable):
  REMEDIATION_NOTIFY_TERMINAL = true
  All channels enabled
  
  Result:
    30 notifications per day (verbose mode)
    Team reads them all (builds trust)
    Each notification: "remediation succeeded on resource X, saved $Y"
    Confidence builds
  
  Issues spotted:
    Day 14: notification showed a failed remediation
    Investigated: user_action error (missing permission)
    Fixed: added IAM permission; retried; succeeded
    Pattern learned: terminal notifications caught real issue early

MONTH 1 (post-rollout):
  REMEDIATION_NOTIFY_TERMINAL = false
  Default attention-required notifications
  
  Result:
    1-3 notifications per day (failures + approvals)
    Team checks daily
    Weekly digest covers the routine
    
  Audit log preserves every action regardless of notification setting
  Daily/weekly visibility maintained

MONTH 3 (mature):
  Per-channel routing fully tuned:
    #finops-rem-failures (all failures)
    #ops-oncall (production CRITICAL failures; pages on-call)
    #finops-rem-approvals (DM to approver)
    Email digest weekly (everything else; for FinOps lead)
    SIEM webhook (compliance evidence collection)
  
  Result:
    <1 notification per channel per day (in non-incident times)
    Signal-to-noise ratio: high
    Compliance evidence: complete
    Team focus: clear

QUARTERLY METRICS REVIEW:
  Notifications per day (Q1): 30/day → (Q3): 4/day
  Approval response time avg: 8h → 2h (faster)
  Approval timeout rate: 5% → 0.5%
  Team satisfaction: high (low noise; meaningful signal)
```

Three months from "verbose" to "tuned for production." The discipline pays off.

---

## 3. Hands-on (5 min)

Audit your notification configuration:

```
□ STEP 1: Settings → Auto-Remediation → Notifications
  Current config:
    REMEDIATION_NOTIFY_TERMINAL: □ on □ off
    
□ STEP 2: Channel routing
  Successes go to: __________
  Failures go to:  __________
  Approvals go to: __________

□ STEP 3: Volume audit
  Notifications per day (typical): _____
  Compared to last quarter: □ Up □ Down □ Flat

□ STEP 4: Identify tune opportunities
  □ Disable terminal notifications (if rollout phase over)
  □ Route success to less-noisy channel
  □ Add SIEM webhook for compliance
  □ Tune suppression rules

□ STEP 5: Track health metrics
  Approval response avg: ___ hours
  Approval timeout rate: ___ %
  Failed action investigation time: ___ hours
```

A 15-minute audit reveals the notification health. Quarterly tuning keeps it healthy.

---

## 4. Knowledge check

### Q1
A team enables `REMEDIATION_NOTIFY_TERMINAL = true`. Most likely after a month they will:

A. Keep it on permanently
B. Disable it. Per-action success notifications become noise once trust is built. Failures and approvals continue notifying by default. Audit log preserves all events regardless. Verbose mode is a build-trust tool, not steady-state.
C. Disable all notifications
D. Page on-call instead

<details>
<summary>Show answer</summary>

**Correct: B.** Terminal verbosity is a build-trust tool, not a steady-state.
</details>

### Q2
The audit log captures remediation events. If notifications are disabled, the audit log:

A. Stops recording
B. Continues to record everything regardless of notification settings. Audit log is the source of truth; notifications are a delivery mechanism. You can disable notifications without losing audit evidence.
C. Records only failures
D. Recorded selectively

<details>
<summary>Show answer</summary>

**Correct: B.** Audit log is independent of notifications.
</details>

### Q3
A production-critical failure should:

A. Send only to email (silent)
B. Page on-call via PagerDuty webhook. Other notifications continue (Slack channel for team awareness). Silence is dangerous; over-paging is also dangerous; tune the criteria for production vs non-prod failures.
C. Send to Slack only
D. Be silent

<details>
<summary>Show answer</summary>

**Correct: B.** Page for production CRITICAL. Silence + over-paging both dangerous; tune.
</details>

---

## 5. Apply

Settings → Auto-Remediation → Notifications configures terminal notification policy. Routing rules then deliver to channels.

For your team: tune notifications quarterly. Initial rollout: verbose; steady state: default; mature ops: per-channel routing.

---

## Module quiz

You have now completed all six lessons of M2.3. The module quiz unlocks the **Remediator** chip.

---

## Related lessons

- [L1 — 3-step workflow](L1_three_step_workflow.md)
- [L2 — Certified rules](L2_certified_rules.md)
- [L3 — Approval gate](L3_approval_gate.md)
- [L4 — Error classes](L4_error_classes.md)
- [L5 — Database denylist](L5_database_denylist.md)
- [T1.M1.6.L4 — Severity routing](../../T1_zopnight_operator/M1.6_history_notifications_audit/L4_severity_routing.md)

## Glossary terms touched

[REMEDIATION_NOTIFY_TERMINAL](../../../reference/glossary/remediation-notify-terminal.md) · [Notification suppression](../../../reference/glossary/notification-suppression.md) · [Audit log vs notifications](../../../reference/glossary/audit-log-vs-notifications.md) · [SIEM webhook](../../../reference/glossary/siem-webhook.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L6
