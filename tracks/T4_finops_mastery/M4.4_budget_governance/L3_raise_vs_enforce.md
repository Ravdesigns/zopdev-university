# Raise vs enforce

§ T4 · M4.4 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** between raising a budget and enforcing a hard cut, **decompose** mixed scenarios into raise + enforce components, **and communicate** the decision clearly.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "When a budget is exceeded, choose the right response — raise, enforce, or both — based on what drove the overrun." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner |
| **Prerequisites** | M4.4.L1-L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Decompose (Analyze), Communicate (Apply) |

---

## 1. Concept

When a budget is exceeded, the response is one of two (or both):

```
RAISE:    Accept the overrun. Adjust the budget upward.
          Legitimate growth gets capacity to continue.
          
ENFORCE:  Kill resources or block actions to bring cost back
          within budget.
          Waste gets eliminated; pattern broken.
```

The decision turns on **why** the overrun happened. The same dollar of overrun looks different depending on its cause.

### When to RAISE

```
RAISE WHEN:
  The overrun reflects genuine need (new feature, customer growth,
    expected scaling)
  Killing resources would cause operational harm
  Leadership has approved the underlying initiative
  The overrun is one-time (not a recurring pattern)
  ROI is positive (the overrun generates value > its cost)
  
EXAMPLES:
  Marketing campaign brought 25% more traffic than expected
    → cost grew proportionally; revenue grew faster; raise
  Acquired company's workload now in scope
    → cost is real; was planned at M&A time; raise
  Migration period with parallel infrastructure
    → temporary; raise for the migration window, revert after
  Product launch with planned scaling
    → expected; raise to match the plan
```

### When to ENFORCE

```
ENFORCE WHEN:
  The overrun is wasteful (forgotten resources, runaway processes)
  Spend is unauthorized
  Pattern recurs (each month the budget is overrun by waste)
  Cost of overrun exceeds operational impact of cutting
  Security or compliance violation
  
EXAMPLES:
  Runaway autoscaler launching unnecessary instances
    → enforce: cap max scaling; investigate
  Compromised credentials launching cryptominers
    → enforce immediately; investigate after
  Forgotten experiment cluster running for months
    → enforce: terminate the orphans
  Misconfigured backup creating massive snapshots
    → enforce: fix config; delete excess snapshots
  Team provisioning outside of policy
    → enforce: terminate; re-train; tighten guards
```

### Raise — the process

```
1. Budget shows red (overrun)
2. Team lead + finance lead review
3. Determine: is the overrun legitimate?
4. If yes: adjust budget
   For current period: one-time exception
   For ongoing: persistent change to budget baseline
5. Document the raise + reason in budget notes
6. Re-baseline forecast for next period

KEY: the raise is a deliberate decision, not silent acceptance.
The audit log records the change with reason.
```

### Enforce — the process

```
1. Budget shows red (overrun)
2. Identify the source of overrun (Cost Flow Sankey + drill)
3. Determine: can/should the source be cut?
4. If yes: take action
   - Kill resources (with safety checks)
   - Pause services
   - Cap autoscaling
   - Revoke credentials (if compromise suspected)
5. Document the action + reason
6. Plan to prevent recurrence (config change, policy update,
   audit log review)

KEY: enforce requires investigation first. Don't kill production
resources without confirming they're waste.
```

### Common raise scenarios

```
SCENARIO 1 — Marketing-driven growth:
  Budget: $200K/mo
  Actual: $245K/mo (+22%)
  Cause: marketing campaign drove +30% MAU
  Revenue: +28% from new users
  ROI: clearly positive
  DECISION: raise budget to $250K for the campaign window;
            review for sustainability after campaign ends
  
SCENARIO 2 — Acquisition integration:
  Budget: $1M/mo
  Actual: $1.4M/mo
  Cause: acquired company's workload added to scope
  DECISION: raise budget to $1.4M; was planned at M&A time;
            documented as part of integration plan

SCENARIO 3 — Compliance-driven expansion:
  Budget: $500K/mo
  Actual: $530K/mo
  Cause: new compliance requirement (SOC 2 Type II audit logging)
  Generated: required audit logging infrastructure
  DECISION: raise budget by $30K; compliance is non-negotiable
```

### Common enforce scenarios

```
SCENARIO 1 — Runaway autoscaler:
  Budget: $100K/mo
  Actual: $145K/mo (+45%)
  Cause: HPA misconfiguration; cluster scaling to 80 nodes
        instead of normal 12
  Damage: $45K of pure waste
  DECISION: revert HPA config; cap max at 20; investigate why
            scaling triggered
  
SCENARIO 2 — Compromised credentials:
  Budget: $50K/mo
  Actual: $200K/mo (+300%)
  Cause: AWS key leaked; attacker launching crypto-mining
  Damage: $150K of fraudulent spend
  DECISION: revoke credentials immediately; kill all unauthorized
            resources; engage security
  Post-incident: rotate all credentials; review audit log
  
SCENARIO 3 — Forgotten resources:
  Budget: $80K/mo
  Actual: $95K/mo (+19%)
  Cause: ML experiment cluster running unattended for 4 months
  Owner: data scientist left the company 6 months ago
  DECISION: terminate the cluster; document the cleanup process
```

### Mixed approach

The most common real-world overrun: part legitimate growth, part waste. Decompose:

```
EXAMPLE:
  Production budget overrun by $30K total
  
  INVESTIGATION reveals:
    $12K of customer onboarding (legitimate growth)
    $8K of autoscaler misconfiguration (waste)
    $10K of forgotten ML experiment (waste)
  
  DECOMPOSITION:
    $12K → RAISE budget by $12K (legitimate)
    $8K → ENFORCE (fix autoscaler config; cap max)
    $10K → ENFORCE (terminate ML experiment cluster)
  
  TOTAL ACTION:
    Budget raised by $12K
    Waste eliminated: $18K
    Net cost change next month: $12K higher baseline
                                vs $18K savings from waste removal
                                = $6K net improvement
```

The decomposition is what makes the response proportionate. Raising the entire $30K would normalize waste; enforcing on the entire $30K would punish legitimate growth.

### How to communicate the decision

```
RAISE COMMUNICATION:
  "Budget exceeded by $X. Investigation shows: legitimate growth
  from [specific cause]. Approving budget raise to $Y for this
  period. Reviewing for sustainability — if pattern continues,
  baseline updated for next quarter."

ENFORCE COMMUNICATION:
  "Budget exceeded by $X. Investigation shows: [specific waste
  cause]. Killing affected instances; correcting configuration.
  Expected to return to baseline within [timeline]. Postmortem
  scheduled."

MIXED COMMUNICATION:
  "Budget exceeded by $X. Investigation shows: $Y of legitimate
  growth and $Z of waste. Raising budget by $Y; eliminating $Z
  of waste through [actions]. Net effect on next month: net cost
  change of $W."
```

All three communications: specific, actionable, accountable.

### Auto-enforce is rarely the right answer

A common ask: "Can ZopNight automatically kill resources when the budget is exceeded?" The answer is no, by design (per T3.M3.6.L5):

```
WHY NO AUTO-ENFORCE:
  Killing production resources mid-month would cause outages
  False positives: lumpy spend looks like overrun
  Loss of human judgment about raise vs enforce
  Audit trail gets murky ("the system decided")
  Customer's specific context lost
  
ZOPNIGHT POSITION:
  Notify aggressively; let humans decide raise vs enforce
  Auto-remediation is opt-in per certified rule (T2.M2.3)
  Budget overruns trigger conversation, not automatic cut
```

### How ZopNight supports the decision

```
WHEN BUDGET CROSSES THRESHOLD:
  Notification fires (per escalation chain)
  Cost Flow Sankey + savings overlay surface the drivers
  Recommendations highlight wasteful spend
  Audit log captures the timeline
  
DECISION SUPPORT:
  Investigation tools surface raise vs enforce candidates
  Each driver categorizable as legitimate vs waste
  Auto-rem rules can enforce on certified waste patterns
  Budget adjustment UI documents the raise with reason
```

---

## 2. Demo

A real budget overrun and the decomposed response:

```
SCENARIO: Production platform-team budget exceeded by 18%
TIMELINE: Day 27 of month

INVESTIGATION (90 minutes):
  Total overage: $30K
  
  Source 1: Customer onboarding spike
    Cost: +$12K
    Driver: 15 new enterprise customers (planned)
    Verification: traffic data confirms; customers active
    Category: LEGITIMATE GROWTH
    
  Source 2: Autoscaler misconfiguration
    Cost: +$8K  
    Driver: HPA max raised from 12 to 30 during load test
            (load test was 10 days ago; HPA never reverted)
    Verification: audit log + cluster metrics
    Category: WASTE (recoverable)
    
  Source 3: Forgotten ML experiment
    Cost: +$10K
    Driver: ML cluster running since 6 months ago
    Verification: zero CPU activity for 3 months;
                  owner left company
    Category: WASTE (recoverable)

DECISIONS:
  1. Customer onboarding → RAISE budget by $12K
     - One-time adjustment for current month
     - Baseline update for next quarter (sustained growth)
  
  2. Autoscaler misconfig → ENFORCE
     - Revert HPA max to 12
     - Add monitoring alert if HPA max changes
     - Recovers $8K/mo going forward
  
  3. Forgotten ML cluster → ENFORCE
     - Snapshot critical data
     - Terminate cluster
     - Recovers $10K/mo going forward

OUTCOMES:
  Budget for current month: raised to $32K
  Next month baseline: +$12K higher (sustained growth)
                       -$18K lower (waste eliminated)
                       Net: $6K lower than current month
  
COMMUNICATIONS:
  Team: "Budget exceeded by $30K. Investigation done. Raising by
        $12K for legitimate growth; eliminating $18K of waste.
        Net effect next month: $6K improvement."
  Leadership: same message + ROI of new customers ($X revenue
        from $12K spend)
  Finance: documented in budget notes + audit log

POSTMORTEM:
  Action items:
    - HPA changes require automatic revert after 14 days
    - Quarterly orphan-resource audit
    - Departing-employee resource handoff checklist
```

---

## 3. Hands-on (5 min)

For your team's most recent budget overage:

```
BUDGET overrun:    $__________

SOURCES of overrun:
  Source 1: __________  $__________
    Category: LEGITIMATE / WASTE
    Action:   RAISE / ENFORCE
    
  Source 2: __________  $__________
    Category: LEGITIMATE / WASTE
    Action:   RAISE / ENFORCE
    
  Source 3: __________  $__________
    Category: LEGITIMATE / WASTE
    Action:   RAISE / ENFORCE

DECISION:
  Total to RAISE: $__________
  Total to ENFORCE (cut): $__________
  Net effect next month: $__________

COMMUNICATIONS plan:
  Team: __________
  Leadership: __________
  Finance: __________

POSTMORTEM action items:
  __________
  __________
```

If you've never decomposed an overrun this way, expect the next overrun to be harder — most overruns are mixed, and the decomposition is the discipline that gets the right response.

---

## 4. Knowledge check

### Q1
Budget exceeded by $50K due to a marketing campaign that brought $500K revenue:

A. Enforce — cut cost
B. Raise — legitimate investment with positive ROI. Document the decision; review for sustainability after the campaign ends; if pattern continues, baseline updated for next quarter.
C. Random
D. Wait until next month

<details>
<summary>Show answer</summary>

**Correct: B.** Raise for legitimate value with positive ROI.
</details>

### Q2
Budget exceeded due to runaway autoscaler:

A. Raise the budget
B. Enforce — fix the autoscaler. Don't raise budget to accommodate waste; that normalizes the issue and the same problem recurs next month. Fix the root cause; document the lesson; prevent recurrence.
C. Random
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** Enforce for waste. Raising would normalize the failure mode.
</details>

### Q3
A mixed scenario (some legitimate growth, some waste):

A. Raise for everything to avoid disputes
B. Decompose. Raise for the legitimate portion; enforce on the waste portion. Common pattern in real-world overruns. The decomposition is what makes the response proportionate.
C. Random
D. Enforce all

<details>
<summary>Show answer</summary>

**Correct: B.** Decompose and address each portion correctly.
</details>

---

## 5. Apply

For each budget overrun, investigate and decompose. Document the raise + enforce decisions in the budget's notes. ZopNight's audit log captures the budget adjustment with reason for compliance.

For ongoing waste patterns (autoscaler issues, forgotten resources), build prevention into the runbook — checklists, alerts, automatic-revert windows, departing-employee handoffs.

---

## Related lessons

- [L1 — The budget pyramid](L1_pyramid.md)
- [L2 — Threshold escalation paths](L2_escalation.md)
- [L4 — Budget as conversation](L4_conversation.md) *(next)*
- [T3.M3.6.L5 — Live computation, not stored](../../T3_zopnight_architect/M3.6_budget_governance/L5_live_compute.md)

## Glossary terms touched

[Raise](../../../reference/glossary/raise.md) · [Enforce](../../../reference/glossary/enforce.md) · [Decomposition](../../../reference/glossary/decomposition.md) · [Legitimate growth](../../../reference/glossary/legitimate-growth.md) · [Wasteful overrun](../../../reference/glossary/wasteful-overrun.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.4.L3
