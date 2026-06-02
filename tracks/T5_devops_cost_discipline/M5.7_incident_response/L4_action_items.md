# Cost-aware action items

§ T5 · M5.7 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **write** SMART action items from cost postmortems, **assign** single ownership for accountability, **and track** completion to prevent the same incidents from recurring.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Turn every cost incident into specific, owned, dated improvements that actually get done." |
| **Personas** | Incident Commander · FinOps Lead · Engineering Manager |
| **Prerequisites** | M5.7.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Write (Create), Assign (Apply), Track (Apply) |

---

## 1. Concept

Postmortem action items: specific, owned, due-dated improvements that emerge from a cost incident. The discipline is in the specifics — vague items rot; SMART items get done.

```
GOOD ACTION ITEM (gets done):
  WHO:    jane@finops
  WHAT:   Lower autoscaler max from 200 to 50; add quota alarm
  WHY:    Prevents the runaway scenario from incident-2026-05-21
  DUE:    2026-05-30
  STATUS: in-progress
  
BAD ACTION ITEM (rots):
  WHO:    team
  WHAT:   Improve autoscaling
  WHY:    bad incident
  DUE:    someday
  STATUS: open
```

Same intent, very different outcomes. The SMART discipline is the difference between learning and forgetting.

### Action item categories

```
1. ROOT-CAUSE FIXES (the actual fix)
   What broke; fix it directly
   
   Example: "Fix HPA max-replicas misconfiguration"
   Example: "Update CI/CD to not commit credentials"

2. PREVENTION (block recurrence)
   Prevent the failure mode from happening again
   
   Example: "Add quota alarm at 5× baseline cost"
   Example: "Implement cost budget gates in CI"

3. DETECTION (catch faster next time)
   Detect similar incidents earlier in lifecycle
   
   Example: "Add hourly cost-rate detection (not just daily)"
   Example: "Slack alert on new GPU instances >10/hour"

4. RESPONSE (improve handling)
   Make next response faster + better
   
   Example: "Update runbook with autoscaler runaway pattern"
   Example: "Add kill-command to platform CLI for emergencies"

5. PROCESS (organizational)
   System-level improvements
   
   Example: "Quarterly autoscaler config audit"
   Example: "Onboarding update: cost incident response training"
```

Most postmortems generate 3-7 items across these categories. Some categories may not apply per incident.

### SMART criteria for action items

```
S - SPECIFIC
  "Reduce autoscaler max"        not "improve autoscaling"
  "Reduce from 200 to 50"         not "lower it"
  Names the exact change

M - MEASURABLE
  "Reduce from 200 to 50"         not "make it smaller"
  Allows verification of "done"

A - ACTIONABLE
  "Configure HPA setting X"        not "fix the issue"
  Can be executed by the owner

R - RELEVANT
  Addresses the incident root cause
  Or prevents similar incidents
  Not a wishlist item

T - TIME-BOUND
  Due date documented
  "By 2026-05-30"
  Not "soon" or "eventually"
```

The SMART framework turns vague intentions into deliverable work.

### Common cost-aware action items

```
TYPICAL ITEMS GENERATED:

ALARM additions:
  Cost rate alarms (hourly, daily)
  Per-resource type spike alarms
  Per-account spending thresholds
  
AUTOMATED REMEDIATION:
  Auto-rem rule for runaway pattern
  Kill-script for known patterns
  Auto-quota-decrease on detection
  
CONFIG LIMITS:
  Lower max-replicas in autoscalers
  Resource quotas per team
  Budget caps per workload
  
DOCUMENTATION:
  Updated runbook
  New decision tree
  Comms templates
  
TRAINING:
  Tabletop exercise
  Onboarding update
  Cross-team review session
  
AUDIT processes:
  Quarterly config review
  Monthly autoscaler audit
  Annual DR drill
  
APPROVAL gates:
  PR review for config changes
  Sign-off for max-replicas above N
  Pre-merge cost estimation
```

The items compound across incidents — by the 5th cost incident, your runbook + tooling is mature.

### Item ownership rules

```
EACH ITEM HAS:
  ✓ SINGLE OWNER (not a team; not multiple people)
  ✓ Specific deliverable (clear "done" definition)
  ✓ Due date (commitment, not aspirational)
  ✓ Status (open / in-progress / done / cancelled)
  ✓ Verification (how do we know it's done?)
  
WHY SINGLE OWNER:
  Clear accountability
  Easier follow-up (one person to ping)
  Avoids diffusion of responsibility
  Forces commitment, not lip service
  
EXCEPTIONS:
  Larger items may have an owner + 1-2 contributors
  But: ONE person accountable for delivery
  
OWNER QUALIFICATIONS:
  Has authority to make the change
  Has capacity (not over-committed)
  Has knowledge of the area
  Will be on the team at the due date
```

The single-owner discipline is the most-violated rule. Team ownership = nobody's responsibility.

### Tracking — where action items live

```
TRACKING SYSTEMS:

JIRA / LINEAR / GITHUB ISSUES:
  Tag: postmortem-incident-XXX
  Owner field populated
  Due date field populated
  Status updated weekly
  
SHARED DOC:
  Postmortem doc has action items section
  Periodically updated
  Less rigorous; suits smaller orgs
  
SPREADSHEET (for FinOps team):
  All open action items across incidents
  Filterable by owner, category, status
  Reviewed monthly

REVIEW CADENCE:
  Weekly: team meeting reviews open items
  Monthly: aggregate review across incidents
  Quarterly: pattern analysis (which categories underdeliver?)

WITHOUT TRACKING:
  Items forgotten in 2-4 weeks
  Same incidents recur (same gaps unfixed)
  Postmortem becomes performative
```

The tracking discipline is what closes the loop.

### Action item review process

```
WEEKLY (team meeting, 15 min):
  Walk through open items
  Status: still on track? Blocked?
  Update due dates if scope changed
  Close items that are done
  
MONTHLY (FinOps + Platform leads, 30 min):
  Aggregate review across recent postmortems
  Which items closed on time?
  Which lingered?
  Pattern analysis (vague items? wrong owners?)
  
QUARTERLY (1-2 hours):
  Larger retrospective
  Multi-incident patterns
  Process improvements
  Update postmortem template based on learnings

REPORTING:
  Action item completion rate (e.g., 80% target)
  Items overdue by week
  Items linked to recurring incidents
```

The discipline is the routine. Without it, action items become postmortem theater.

### When items don't close — root causes

```
PATTERN: action items consistently linger
  
  CAUSE: TOO VAGUE
    "Improve autoscaling" — what does that mean?
    Owner can't action it
    
  FIX: Break into specific tasks
    "Reduce autoscaler max from X to Y by date Z"

PATTERN: items closed but problems recur
  
  CAUSE: SYMPTOMS NOT ROOT CAUSE
    Fixed surface; underlying still broken
    
  FIX: Deeper investigation
    Was the root cause actually identified?
    Are we treating symptom or cause?

PATTERN: same incident type recurs
  
  CAUSE: ACTION ITEMS NOT EFFECTIVE
    Or: action items not implemented
    Or: organizational pattern not addressed
    
  FIX: Pattern analysis
    Look across recent postmortems
    Systemic intervention needed?

PATTERN: items pile up; never close
  
  CAUSE: OVER-COMMITMENT
    Too many items per incident
    No capacity to deliver
    
  FIX: Prioritize ruthlessly
    Top 3-5 items per incident
    Defer others; track separately
```

The patterns reveal organizational health. Healthy orgs close 80%+ of action items on time.

### Lessons accumulate — pattern recognition

```
MULTIPLE POSTMORTEMS BUILD PATTERN RECOGNITION:

  "Last 3 incidents had autoscaler involvement"
  → Systemic intervention needed: autoscaler review process
  
  "Detection lags by 30+ minutes consistently"
  → Monitoring infrastructure investment
  
  "Same teams keep hitting cost issues"
  → Training or tooling gap; specific team focus
  
  "Action items keep being vague"
  → Postmortem facilitation training needed
  
  "Friday afternoon incidents are common"
  → Maybe Friday deploy freeze policy

PATTERN ANALYSIS (quarterly):
  Aggregate all incidents from last quarter
  Look for common threads
  Propose systemic fixes vs incident-specific
  Track systemic fixes separately

LESSONS COMPOUND:
  Each incident teaches something
  Each cycle improves the tooling/process
  Mature org: fewer incidents, faster response, smaller impact
```

The compounding is the long-term value. Postmortems are an investment, not an obligation.

---

## 2. Demo

A real postmortem's action items:

```
POSTMORTEM: cost runaway 2026-05-21
  Incident: $4,200 cost spike in 6 hours
  Root cause: HPA max-replicas misconfig (200 vs 50)
  Detection: cost anomaly fired at T+3h (too slow)
  Response: 18 min from detect to mitigate

ACTION ITEMS GENERATED (5 items):

ITEM AI-1 (root cause fix):
  WHO: jane@platform
  WHAT: Reduce autoscaler max from 200 to 50 for all
        production payment-team clusters
  WHY: Prevents 1,000-instance runaway scenario
  DUE: 2026-05-25 (within 4 days)
  STATUS: in-progress
  VERIFY: kubectl get hpa shows max=50

ITEM AI-2 (prevention):
  WHO: bob@platform
  WHAT: Add CloudWatch alarm on cost rate >5× baseline for
        prod payment-team accounts
  WHY: Faster detection of cost runaways
  DUE: 2026-06-01 (within 10 days)
  STATUS: open
  VERIFY: alarm fires in test scenario

ITEM AI-3 (detection):
  WHO: alice@finops
  WHAT: Add hourly cost-rate anomaly detection (currently only daily)
  WHY: Detect runaways within 1-2 hours instead of 6-24 hours
  DUE: 2026-06-15 (within 25 days)
  STATUS: open
  VERIFY: hourly anomaly alert tested

ITEM AI-4 (response):
  WHO: jane@platform
  WHAT: Add to runbook: "how to identify+kill runaway autoscaler"
        with specific kubectl commands
  WHY: Future commanders have specific guidance; reduce response time
  DUE: 2026-05-30 (within 9 days)
  STATUS: in-progress
  VERIFY: runbook section reviewed by 2 engineers

ITEM AI-5 (process):
  WHO: sue@platform-lead
  WHAT: Establish quarterly autoscaler config audit process
  WHY: Catch misconfigurations proactively (this incident root cause
       had existed for 2 weeks before triggering)
  DUE: 2026-06-30 (within 40 days)
  STATUS: open
  VERIFY: Q3 audit performed; documented findings

WEEKLY REVIEW (week 1 after postmortem):
  AI-1: complete (kubectl get hpa confirms max=50 across all clusters)
  AI-4: complete (runbook updated; reviewed)
  AI-2: in-progress (alarm being tested)
  AI-3: open (work scheduled)
  AI-5: open (process design in progress)

WEEKLY REVIEW (week 2):
  AI-2: complete
  AI-3: in-progress (50%)
  AI-5: in-progress (process drafted; review pending)

WEEKLY REVIEW (week 4):
  All 5 items complete
  Verification confirmed
  
WEEKLY REVIEW (week 8):
  No recurrence of this incident type
  Process working
  Postmortem learnings applied

OUTCOMES:
  All 5 items closed on time
  Recurrence prevented
  Detection time improved (next test: 45 min vs 3 hours)
  Team confidence in process
```

The discipline is repeatable. Each postmortem teaches; each action item closed compounds.

---

## 3. Hands-on (5 min)

Write SMART action items for a past incident:

```
□ STEP 1: Pick a past cost incident
  Date: __________
  Brief description: __________

□ STEP 2: Identify root cause + categories
  Root cause: __________
  Categories of action items needed:
    □ Root cause fix
    □ Prevention
    □ Detection
    □ Response
    □ Process

□ STEP 3: Write 3-5 SMART items
  
  ITEM 1:
    WHO: __________
    WHAT: __________
    WHY: __________
    DUE: __________
    VERIFY: __________
  
  ITEM 2: (same template)
  ITEM 3: (same template)

□ STEP 4: Check SMART criteria
  □ Specific (names the exact change)
  □ Measurable (clear "done" criteria)
  □ Actionable (owner can execute)
  □ Relevant (addresses root cause)
  □ Time-bound (due date)

□ STEP 5: Plan tracking
  Where will these be tracked? __________
  Who reviews weekly? __________
```

A 30-minute exercise builds the discipline. Apply at next postmortem.

---

## 4. Knowledge check

### Q1
Action item "improve cost discipline":

A. Specific and actionable
B. Too vague. Replace with: "Add CloudWatch alarm X by date Y, owned by Z, verified by..." — Specific, Measurable, Actionable, Relevant, Time-bound (SMART). Vague items rot; specific items get done. The SMART discipline is what separates effective postmortems from theater.
C. Random
D. Acceptable for high-level goals

<details>
<summary>Show answer</summary>

**Correct: B.** Be specific. SMART framework or it rots.
</details>

### Q2
Action item without specific owner:

A. Team accountability shared
B. Diffuse responsibility = no responsibility. Single owner = accountable for delivery. Multiple owners or "the team" = nobody acts (everyone assumes someone else will). The single-owner discipline is the most-violated rule; also the most important.
C. Random
D. Distributed ownership works

<details>
<summary>Show answer</summary>

**Correct: B.** Single owner per item. Always.
</details>

### Q3
Items lingering for months:

A. Random variability
B. Sign of vague items, wrong owners, or over-commitment. Investigate root cause: too vague? wrong owner? too many items per incident? Then break down, reassign, or prioritize. Lingering items = broken postmortem process.
C. Random
D. Acceptable for non-critical items

<details>
<summary>Show answer</summary>

**Correct: B.** Investigate the cause; fix the process.
</details>

---

## 5. Apply

SMART action items. Single ownership. Tracked weekly. Reviewed monthly. Pattern analysis quarterly.

For your team: apply SMART criteria at next postmortem; track in your project management tool; review weekly until close.

---

## Module quiz

Complete M5.7 → 10-question module quiz unlocks the **Incident-Resolver** chip.

---

## Track 5 complete

ALL T5 modules done. DevOps Cost Discipline track ready.

You should now be able to:
- Govern tags org-wide with policy + enforcement (M5.1)
- Apply environment-aware schedule patterns (M5.2)
- Discipline K8s resources end-to-end (M5.3)
- Design multi-account topology with shared services (M5.4)
- Match reliability investment to actual business impact (M5.5)
- Embed cost discipline in IaC + CI (M5.6)
- Respond to cost incidents with commander + comms + action items (M5.7)

---

## Related lessons

- [L1 — Cost SEV definitions](L1_cost_sev.md)
- [L2 — Cost incident commander](L2_commander.md)
- [L3 — Cost incident communication](L3_communication.md)
- [T4.M4.5 — Anomaly response](../../T4_finops_mastery/M4.5_anomaly_response/00_README.md)

## Glossary terms touched

[SMART action item](../../../reference/glossary/smart-action-item.md) · [Single ownership](../../../reference/glossary/single-ownership.md) · [Action item tracking](../../../reference/glossary/action-item-tracking.md) · [Pattern analysis](../../../reference/glossary/pattern-analysis.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.7.L4
