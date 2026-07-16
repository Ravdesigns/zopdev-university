# Certified vs uncertified rules

§ T2 · M2.3 · L2 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** which rules can be one-click auto-remediated, **explain** the certification criteria, **and plan** progressive enablement of certified rules in your org.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Know which rules support one-click apply; enable them progressively; understand why the denylist exists." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.1 · M2.2 · M2.3.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Apply), Explain (Understand), Plan (Create) |

---

## 1. Concept

Auto-remediation requires high confidence that the cloud action is safe, reversible-or-undoable, and tested. Only **certified** rules expose the one-click Apply button. As of 2026-05-21, **20 rules** are certified end-to-end on real cloud.

```
THE CERTIFICATION BAR:
  
  CERTIFIED (one-click Apply):
    Tested end-to-end on real cloud accounts
    Failure modes catalogued
    Idempotent + safe
    Audit log verified
    
  UNCERTIFIED (manual execution):
    Rule logic verified
    Remediation steps shown
    Apply button NOT shown
    Customer executes manually
```

The 20-certified count grows over time. Goal: empty denylist (the full rule set) within 12-18 months.

### What "certified" means — the bar

A rule is certified when it passes end-to-end testing on real cloud (not just synthetic). Specifically:

```
CERTIFICATION CRITERIA (all must pass):

1. RULE LOGIC VERIFIED
   Across multiple sample resources
   Edge cases tested
   
2. REMEDIATION WORKFLOW TESTED ON REAL AWS / GCP / Azure
   Not just sandbox; real cloud accounts
   Real resources; real cleanup
   
3. FAILURE MODES CATALOGUED
   Every error class identified
   Right user_action / transient / system classification
   Fix hints documented for each
   
4. IDEMPOTENCY PROVEN
   Re-runs are safe
   Tested with concurrent calls
   No partial-state scenarios
   
5. ROLLBACK PATH DOCUMENTED
   Snapshot before destructive action
   Restore procedure tested
   Recovery time measured
   
6. AUDIT LOG ENTRIES VERIFIED
   Every action recorded correctly
   Reproducible from audit trail
   
7. SAMPLE CUSTOMER ADOPTION TRACKED
   Run in pilot customers
   No incidents over observation period
   Edge cases caught + fixed
```

The bar is high. Certification typically takes 4-12 weeks per rule.

### The certified 20 (as of 2026-05-21)

```
BATCH 1 — IDLE / ORPHAN STOP (10 rules):
  RC-001   Idle EC2 instance (terminate with snapshot)
  RC-002   Orphan EBS volume (delete)
  RC-010   Idle Lambda function
  RC-105   Orphan EBS snapshot (delete)
  RC-152   Orphan ELB (delete)
  RC-202   Idle RDS instance (delete with final snapshot)
  RC-203   Idle Aurora cluster
  RC-301   Orphan EIP (release)
  RC-302   Orphan NAT Gateway (delete)
  + 1 more

BATCH 2 — K8S SCALE-TO-ZERO (5 rules):
  RC-1701  Idle EKS Deployment (scale to 0)
  RC-1702  Suspend EKS CronJob
  RC-1801  Idle GKE Deployment
  RC-1802  Suspend GKE CronJob
  RC-1901  Idle AKS Deployment

BATCH 3 — PAUSE SERVICES (5 rules):
  RC-303   Pause App Runner
  RC-304   Pause Beanstalk Environment
  RC-401   Pause Azure Databricks Cluster
  RC-402   Pause Snowflake warehouse
  RC-501   Pause Redshift cluster
```

The certified rules cluster around the simplest, safest categories — idle/orphan terminations and pause/resume operations. Rightsizing and complex changes are deliberately not yet certified.

### Why uncertified rules don't have Apply

For uncertified rules, the recommendation card hides the Apply Remediate button. The remediation steps are still shown — but as instructions for manual execution.

```
UNCERTIFIED RULE CARD example: RC-006 Oversized EC2
─────────────────────────────────────────────────────────
RC-006 · Oversized EC2 Instance
[no Apply button]

REMEDIATION (manual)
1. Review CloudWatch CPU and memory utilization
2. Use AWS Compute Optimizer for sizing recommendations
3. Stop the instance, change instance type, restart
4. Monitor performance after the change for 48 hours

[Console URL: https://us-east-1.console.aws.amazon.com/ec2/...]
[Dismiss] [Mark Applied] [Snooze]
```

The "Mark Applied" button lets the customer note they've completed the action manually, so savings tracking works correctly.

### What requires certification to land

```
CERTIFICATION PROCESS:

PHASE 1 — REAL-CLOUD TESTING (4-8 weeks):
  Sandbox accounts don't count
  Pre-prod customer accounts (with consent) used
  Multiple regions; multiple resource configurations
  
PHASE 2 — FAILURE HANDLING (1-2 weeks):
  Catalog every failure mode
  Map to error class (user_action / transient / system)
  Write fix hints
  
PHASE 3 — ROLLBACK DOCUMENTATION (1 week):
  For idle EC2: restart from snapshot
  For pause: resume
  For irreversible (delete): final-snapshot policy
  Test rollback procedure
  
PHASE 4 — SAMPLE ADOPTION (2-4 weeks):
  Run with consenting pilot customers
  Track all incidents
  Iterate until clean
  
PHASE 5 — DENYLIST REMOVAL:
  Update certification status
  Apply button appears
  Documentation updated
  Customer notification

TOTAL: 8-16 weeks per rule typical
```

The slow pace is intentional. Quality > velocity for auto-remediation.

### Customer-requested certification

```
A TEAM CAN REQUEST a specific rule certified:
  
  Process:
    1. File request with ZopNight (support / account team)
    2. ZopNight engineering adds to certification queue
    3. Runs end-to-end tests with consenting customers
    4. Catalogs failure modes
    5. Removes from denylist; Apply button appears
  
  TYPICAL TIMELINE: 2-6 weeks
  
  COMMON REQUESTS:
    Rules that the customer manually applies frequently
    Rules with high $ savings impact
    Rules where manual execution has been clean
```

The certification queue is responsive to customer demand.

### When uncertified ≠ unsafe

```
UNCERTIFIED rule isn't "unsafe to apply"
  Just hasn't passed ZopNight's bar for one-click execution
  The remediation is still shown
  Customer executes manually with full context

COMMON UNCERTIFIED CATEGORIES:
  Rightsizing (instance class changes)
    Risk: workload-specific; needs validation
    Reason: tested only in narrow workloads
  
  Compliance configuration changes
    Risk: policy interpretation varies
    Reason: customer policy varies
  
  Network changes
    Risk: high blast radius
    Reason: cross-team dependencies
  
  IAM changes
    Risk: lockout potential
    Reason: hard to test without breaking
```

Customer judgment fills in. Manual execution is still safe.

### Progressive enablement pattern

```
MONTH 0: NO AUTO-REMEDIATION
  Manual triage on all findings
  Average remediation latency: 4 weeks
  Reason: building trust + auditing scope
  
MONTH 1: ENABLE LOW-RISK CERTIFIED (RC-001, RC-002)
  ~30% of findings now auto-remediate
  Latency on those: <1 hour
  Trust validated
  
MONTH 3: ENABLE K8S SCALE-TO-ZERO (RC-1701, RC-1702)
  ~50% of findings auto-remediate
  
MONTH 6: ENABLE PAUSE RULES
  ~65% of findings auto-remediate
  Remaining 35% (rightsizing, complex) still manual
  
ONGOING: AS CERTIFICATION GROWS
  Additional rules enabled per quarter
  Manual residual shrinks
  Customer team focuses on judgment calls
```

The pattern: enable conservatively; trust grows; rate of enablement increases.

### Default state — opt-in

```
DEFAULT for ALL CERTIFIED rules:
  Auto-remediation OFF
  Customer-controlled per-rule per-org
  
ENABLING a rule:
  Settings → Auto-Remediation
  Toggle ON for the specific rule
  Approval policies configurable
  
WHY OPT-IN BY DEFAULT:
  Conservative
  Customer-controlled
  Build trust through visibility first
  Customer chooses when ready
```

Default off; opt-in deliberately. Trust comes from control.

---

## 2. Demo

A team's progressive adoption pattern over 6 months:

```
MONTH 0 — STARTING POINT:
  No auto-remediation enabled
  100% manual triage
  Average latency: 4 weeks finding → action
  ~10% of findings actually acted on (backlog grows)
  Savings realization: poor

MONTH 1 — ENABLE LOW-RISK:
  Enable RC-001 (idle EC2), RC-002 (orphan EBS)
  Pre-approval: NOT required (low blast radius)
  Conservative
  Results after 1 month:
    30% of findings now auto-remediate
    Latency on those: <1 hour
    Zero incidents

MONTH 3 — ENABLE K8S:
  Add RC-1701, RC-1702 (K8s scale-to-zero / suspend)
  Pre-approval: still skipped (reversible)
  Results after 1 month:
    50% of findings auto-remediate
    Cross-team adoption (platform + workload teams)

MONTH 6 — ENABLE PAUSE RULES:
  Add RC-303, RC-304, RC-401, RC-402 (pause services)
  Pre-approval: required for prod (configurable)
  Results after 1 month:
    65% of findings auto-remediate
    Manual residual: rightsizing, compliance (always manual)

MONTH 12 — STEADY STATE:
  All available certified rules enabled
  ~70% of findings auto-remediate
  Median latency: <1 day
  Engineer time on routine actions: dropped 80%
  
REALIZED EFFECT:
  Time-to-remediation: 4 weeks → <1 day
  Savings realization: from 30% to 85%
  Engineer satisfaction: high
  Zero incidents from auto-remediation
```

The progressive enablement is the safe path. Trust through demonstrated reliability.

---

## 3. Hands-on (5 min)

Audit your auto-remediation settings:

```
□ STEP 1: Open Settings → Auto-Remediation
  
□ STEP 2: List enabled rules
  Currently enabled: _____
  Total certified available: _____
  Adoption: _____%

□ STEP 3: Identify candidates to enable
  Low-risk certified rules off:
    RC-_____: __________
    RC-_____: __________

□ STEP 4: Plan enablement
  Pick 1-2 to enable this month
  Pre-approval policy: __________
  Monitor for: ___ weeks
  Owner: __________

□ STEP 5: Set quarterly review
  Date: __________
  Owner: __________
  Goal: track # of certified rules enabled over quarters
```

A 15-minute audit reveals adoption gap. Quarterly cadence drives progressive enablement.

---

## 4. Knowledge check

### Q1
A recommendation card doesn't show Apply Remediate. Most likely cause:

A. The user lacks permission
B. The rule isn't certified yet — customer executes manually using the remediation steps + console link. The card still shows "Mark Applied" for tracking. Manual ≠ unsafe; just not ZopNight-validated for one-click.
C. The cloud is down
D. Bug

<details>
<summary>Show answer</summary>

**Correct: B.** Uncertified rules don't expose one-click apply.
</details>

### Q2
20 rules are certified as of 2026-05-07. The remaining 440+:

A. Don't exist
B. Are shown with remediation steps but no one-click apply. The denylist shrinks over time as more rules pass certification. Customer-requested certifications accelerate specific rules. Goal: empty denylist within 12-18 months.
C. Are buggy
D. Will never be remediated

<details>
<summary>Show answer</summary>

**Correct: B.** Path to certification is open; goal is shrinking the denylist.
</details>

### Q3
Auto-remediation is enabled per-rule per-org. The default state:

A. All certified rules on
B. All rules off (opt-in). Customer-controlled. Default conservative — trust built through visibility before action. Customer enables when ready, progressively, per their risk model.
C. Random
D. Critical rules on by default

<details>
<summary>Show answer</summary>

**Correct: B.** Default off; customer chooses when ready.
</details>

---

## 5. Apply

Settings → Auto-Remediation lists certified rules with toggle. Enable progressively as trust builds.

For your team: 1-2 new rules enabled per quarter is a sustainable pace.

---

## Related lessons

- [L1 — 3-step workflow](L1_three_step_workflow.md)
- [L3 — Approval gate](L3_approval_gate.md) *(next)*
- [L4 — Error classes](L4_error_classes.md)
- [L5 — Database denylist](L5_database_denylist.md)
- [L6 — Terminal notifications](L6_terminal_notifications.md)

## Glossary terms touched

[Certified rule](../../../reference/glossary/certified-rule.md) · [Denylist](../../../reference/glossary/denylist.md) · [One-click apply](../../../reference/glossary/one-click-apply.md) · [Mark applied](../../../reference/glossary/mark-applied.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L2
