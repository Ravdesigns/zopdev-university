# Reading a recommendation card

§ T2 · M2.1 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** every field on a recommendation card, **decide** apply / dismiss / snooze with confidence, **and execute** a weekly triage flow.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Make a confident decision on every recommendation — act, dismiss, or defer with documented rationale." |
| **Personas** | Platform Engineer · FinOps Engineer · SRE |
| **Prerequisites** | M2.1.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Decide (Evaluate), Execute (Apply) |

---

## 1. Concept

The recommendation card is the unit of action. Every field exists to support one of three decisions: apply (do the thing), dismiss (this doesn't apply), or snooze (revisit later). Reading the card well = making the right decision quickly.

```
THE THREE DECISIONS:
  APPLY     Execute the recommended action
  DISMISS   Mark not applicable; rule won't re-fire
  SNOOZE    Revisit in N days
```

Most findings get one of these three actions. The card shows you what you need to decide.

### Card anatomy — every field

```
┌─────────────────────────────────────────────────────────┐
│  RC-001 · Idle EC2 Instance                              │
│  ────────────────────────────────────────────────────── │
│  Resource:   i-0abc123def (m5.large) · us-east-1         │
│  Account:    prod-aws-us-east-1                          │
│  Status:     OPEN                                         │
│  Severity:   medium                                       │
│  Category:   idle                                         │
│  ────────────────────────────────────────────────────── │
│  CURRENT COST          $69.20 / month                     │
│  OPTIMIZED COST        $0 / month                          │
│  POTENTIAL SAVINGS     $69.20 / month  ($830/year)        │
│  ────────────────────────────────────────────────────── │
│  EVIDENCE                                                  │
│  Status:        stopped                                      │
│  Stopped:       47 days ago                                 │
│  Last activity: 2026-04-03 (manual stop by ops-team)         │
│  Attached:      1 EBS volume (10 GB gp3, $0.80/mo)           │
│  Snapshots:     3 (oldest 2024-11-02)                        │
│  ────────────────────────────────────────────────────── │
│  REMEDIATION (4 steps)                                     │
│  1. Verify no workload depends on this instance              │
│  2. Create an AMI backup if needed                           │
│  3. Terminate the instance via EC2 Console                   │
│  4. Delete associated EBS volumes if no longer needed         │
│  ────────────────────────────────────────────────────── │
│  ACTION                                                     │
│  [Apply Remediate] [Dismiss] [Snooze ▾] [View Resource →]  │
└─────────────────────────────────────────────────────────┘
```

Every field is there because it informs the decision.

### Reading the header — what is this?

```
RULE ID + NAME (RC-001 · Idle EC2)
  Click rule name to see rule documentation
  Same rule may match multiple resources
  
RESOURCE
  Provider + region + instance type
  Click to jump to resource detail
  
ACCOUNT
  Which account hosts this resource
  Matters for blast radius + IAM
  
STATUS
  OPEN (action available)
  APPLIED (already acted on)
  DISMISSED (marked not applicable)
  SNOOZED (will reappear later)
  
SEVERITY + CATEGORY
  Drives routing + prioritization (M2.1.L1, L2)
```

The header tells you what the rule is + which resource it fires on.

### Reading the savings line

```
CURRENT COST — what the resource is costing now
  For idle/orphan: rack rate (the amount avoided)
  For rightsizing: actual or rack-rate based
  For commitment: on-demand rate
  
OPTIMIZED COST — what it would cost after action
  For idle: $0 (terminate)
  For rightsizing: lower SKU rate
  For commitment: discounted tier rate
  
POTENTIAL SAVINGS — the delta
  Monthly: most actionable framing
  Annualized: for finance / leadership context
  
ANNUAL PROJECTION
  Often the deciding number for approvals
  "$830/year saved" is more compelling than "$69/mo"
```

The savings line is the value proposition. Bigger numbers = more attention.

### Reading the evidence panel

The evidence shows what triggered the rule:

```
FOR IDLE EC2 (state-based rule):
  Status: stopped
  Time-in-state: 47 days
  Last activity: when + by whom (from state history)
  Attached resources: what else is involved
  
FOR EC2 RIGHTSIZING (metrics-based rule):
  CPU utilization: p95 over 30 days
  Memory utilization: p95 over 30 days
  Lookback window: explicit
  Current instance type vs proposed
  
FOR DISCOUNT (TierRates rule):
  Current tier: on_demand
  Proposed tier: spot / reserved / etc.
  Rate comparison: $/hr per tier
  Eligibility: why workload qualifies
  
FOR COMPLIANCE (configuration rule):
  Current setting: e.g., multiAz=false
  Required setting: multiAz=true
  Policy reference: which standard
```

The evidence is reproducible — you can cross-check by inspecting the actual cloud resource. This is why ZopNight findings are trustworthy.

### Reading the remediation steps

Step-by-step plan in plain language:

```
TYPICAL STRUCTURE (3-5 steps):
  1. Verify (check assumptions)
  2. Backup (snapshot, AMI, etc.)
  3. Execute action (terminate, modify, etc.)
  4. Clean up (associated resources)
  5. Document (audit trail)

FOR CERTIFIED RULES:
  "Apply Remediate" button executes these steps in order
  With snapshot-first safety
  Full audit log
  
FOR UNCERTIFIED RULES:
  Team executes manually
  Console link provided
  Steps printable for handoff
```

The remediation is the operator's playbook. Print or follow live.

### The action buttons — choosing wisely

```
APPLY REMEDIATE
  Trigger auto-remediation (if certified + opt-in)
  Otherwise: opens console link + shows manual steps
  Audit log records: who, when, what

DISMISS
  Mark "not applicable to my situation"
  Future evaluation marks as optimised (won't re-fire)
  Always include comment explaining why
  
SNOOZE
  Reappear in N days (default 30)
  Use when "this is real but not now"
  Add ticket reference if planned work

VIEW RESOURCE
  Jump to resource detail page
  See full context: usage, dependencies, owner
  Useful for unclear findings
```

The action buttons are how decisions become actions.

### When to APPLY — three signals

```
SIGNAL 1: RESOURCE IS TRULY UNUSED
  Evidence matches reality
  Cross-check with team's knowledge
  Owner confirms (or doesn't object)
  
SIGNAL 2: SAVINGS IS MEANINGFUL
  Worth the audit overhead
  $5/mo idle EBS: maybe not worth the time
  $500/mo idle RDS: definitely worth it
  
SIGNAL 3: REVERSIBILITY PLAN EXISTS
  Snapshot ready
  Ticket / approval documented
  Team aware of action
```

Three signals = strong "apply" candidate. Two of three = "consider; verify the third."

### When to DISMISS — two reasons

```
REASON 1: RULE IS WRONG FOR THIS RESOURCE
  Stopped EC2 used as quick-restart DR target → not idle
  Single-replica K8s deployment intentionally single-replica
  RDS without Multi-AZ in non-prod (acceptable per tier policy)
  
REASON 2: ACTION IS UNSAFE
  Production database; can't terminate
  Resource owns by another team; coordinated change needed
  Compliance requires the current configuration

ALWAYS DISMISS WITH A COMMENT:
  "DR target — must remain available"
  "Intentional single-replica per architecture"
  "Compliance-required Multi-AZ"
  
  Future engineers see the reason; don't have to re-investigate.
```

Dismiss is permanent (until rule re-evaluates with new state). The comment preserves the decision rationale.

### When to SNOOZE — timing concerns

```
USE SNOOZE WHEN:
  Code freeze prevents action this week
  Owner on PTO; can't get approval
  Scheduled change window is next sprint
  Dependent on upstream system change
  
DEFAULT SNOOZE: 30 days
CUSTOM SNOOZE: per-team need
  
COMMENT WITH SNOOZE:
  Always reference the reason
  Link to ticket if planned
  Set realistic re-evaluation date
```

Snoozed findings reappear; the comment tells you why they were deferred.

### Triage cadence

Most teams: weekly triage during Operate meeting.

```
WEEKLY TRIAGE FLOW (45 min for typical team):

  T+0       Open Recommendations
  T+5min    Filter: severity ≥ high; status = open
  T+10min   Sort by savings descending
  T+15min   Triage top 10 findings:
              Apply (with cert rule): 2 minutes
              Dismiss (with comment): 1 minute
              Snooze (with comment + ticket): 2 minutes
            Average: 2 minutes per finding
  T+45min   Done. 30 findings triaged.

REALIZED SAVINGS per session:
  Typical: $5K-$30K/mo in apply actions
  Compounds weekly
```

The cadence keeps the backlog flowing without becoming a daily distraction.

---

## 2. Demo

A team's weekly triage flow:

```
WEEK 1 (mid-size team's first cycle):

T+0       Open Recommendations → filter severity ≥ high
T+30 sec  47 high-severity findings
          Sort by savings descending

T+1 min   FIRST CARD: $5,200/mo idle EKS cluster
          Read evidence: cluster stopped 89 days
                          0 active workloads
                          Owner: data team (in PTO)
          Cross-check: confirm with platform team via Slack
          Owner-team confirms: cluster forgotten; no dependency
          Apply: triggers auto-remediation (certified for idle EKS)
          Notification fires; action completes in 3 min
          Saved: $5,200/mo
          
T+5 min   NEXT: $4,800/mo Multi-AZ RDS in non-prod
          Category: compliance
          Evidence: RDS is in dev environment; Multi-AZ enabled
          Decision: non-prod doesn't need Multi-AZ
          Dismiss with reason: "Non-prod; Multi-AZ not required by tier policy"
          Won't re-fire (until policy changes)
          
T+8 min   NEXT: $3,400/mo over-provisioned RDS in prod
          Category: rightsizing
          Evidence: 30-day p95 CPU = 25%; memory 35%
          Decision: real, but needs maintenance window
          Snooze 7 days; add ticket reference DEV-4521
          Comment: "Planned for next maintenance window"
          Will reappear next week
          
T+15 min  NEXT: 7 more findings:
            3× idle EBS volumes ($65/mo total): Apply (auto-rem)
            2× orphan EIPs ($25/mo total): Apply (auto-rem)
            1× missing tag on RDS: Dismiss (will be auto-tagged this week)
            1× security finding (privileged container): Snooze;
               add to security-debt ticket
          
T+45 min  Total: 30 findings triaged
          Realized savings (apply actions): $14,800/mo
          Deferred (snooze): $4,200/mo (planned for next week)
          Dismissed (with reasons): $7,300/mo opportunity cost
          
DOCUMENT in #finops-weekly:
  "Week 21 triage complete.
   30 findings reviewed.
   Applied: 12 ($14.8K/mo recurring savings).
   Snoozed: 8 (planned work).
   Dismissed: 10 (with reasons; tier policy).
   Next triage: Friday next week."
```

Forty-five minutes per week for the FinOps Engineer. Compounds across quarters.

---

## 3. Hands-on (5 min)

Triage your top 5 open recommendations:

```
□ STEP 1: Open Recommendations
  Filter: severity ≥ high; status = open
  Sort by savings descending

□ STEP 2: Top 5 cards
  For each:
    Card 1: __________   Decision: □ Apply  □ Dismiss  □ Snooze
              Reason: __________
    Card 2: __________   (same)
    Card 3: __________   (same)
    Card 4: __________   (same)
    Card 5: __________   (same)

□ STEP 3: Document
  Realized savings this session: $_____/mo
  Deferred: $_____/mo
  Dismissed: $_____/mo (opportunity cost)

□ STEP 4: Schedule weekly cadence
  Day / time: __________
  Owner: __________
  Channel for results: __________
```

A 30-minute exercise reveals your triage muscle. Compound weekly.

---

## 4. Knowledge check

### Q1
A recommendation card shows $200/mo savings, evidence is solid, but the resource is intentionally always-on for a DR pattern. The right action:

A. Apply
B. Dismiss with reason "DR target, must remain available"
C. Snooze indefinitely
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B — Dismiss with comment.** Dismiss documents the decision; future engineers see why. Snooze indefinitely loses the rationale; ignoring means it'll reappear.
</details>

### Q2
"Current cost" on a card uses which cost column?

A. Always billed cost
B. Rack rate for idle/orphan rules; billed cost for rules computing against actual spend; the evidence panel shows which method. Idle rules use rack rate because billing data is misleading for stopped resources (you'd avoid the rack rate going forward).
C. Always rack rate
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** The right cost column depends on the rule type. See T0.M0.4.L1 for full coverage.
</details>

### Q3
A team's triage cycle frequency. Best practice:

A. Daily
B. Weekly — matches the Operate cadence. Keeps backlog flowing without becoming daily distraction. 30-60 minutes per week is the typical investment for meaningful savings.
C. Monthly (too slow; backlog grows)
D. Quarterly (way too slow)

<details>
<summary>Show answer</summary>

**Correct: B.** Weekly Operate cadence is the sweet spot.
</details>

---

## 5. Apply

[Recommendations](https://app.zopnight.com/recommendations) is the canonical triage surface. Pair with weekly Operate meeting. Document apply / dismiss / snooze in #finops-weekly.

For your team: 45 minutes per week → typically $5K-$30K/mo in realized savings. The compounds across quarters.

---

## Module quiz

Complete M2.1 → 10-question module quiz unlocks the **Rules-Reader** chip.

---

## Related lessons

- [L1 — The 8 categories](L1_eight_categories.md)
- [L2 — Severity ladder](L2_severity.md)
- [L3 — Rule interface](L3_rule_interface.md)
- [L4 — Pricing model](L4_pricing_model.md)
- [M2.2 — Reading evidence](../M2.2_reading_evidence/00_README.md)
- [T0.M0.4.L1 — Rack rate vs billing](../../T0_foundations/M0.4_rack_rate_vs_billing/L1_rack_rate.md)

## Glossary terms touched

[Recommendation card](../../../reference/glossary/recommendation-card.md) · [Apply / dismiss / snooze](../../../reference/glossary/apply-dismiss-snooze.md) · [Triage cadence](../../../reference/glossary/triage-cadence.md) · [Evidence panel](../../../reference/glossary/evidence-panel.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.1.L5
