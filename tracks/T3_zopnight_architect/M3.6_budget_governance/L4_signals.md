# Green/yellow/red signals

§ T3 · M3.6 · L4 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** budget traffic-light signals at a glance, **diagnose** a red budget systematically, **and propose** the right corrective action by pattern.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Walk into a budget review, scan the signals, and know within 60 seconds which budgets need attention and why." |
| **Personas** | FinOps Lead · Engineering Leader · SRE / On-call |
| **Prerequisites** | M3.6.L1-L3 (budget fundamentals, scopes, thresholds) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Remember), Diagnose (Analyze), Propose (Evaluate) |

---

## 1. Concept

Budget health surfaces as a traffic-light signal — green, yellow, red — visible at a glance on dashboards and reports. The signal compresses three properties (actual spend, budget commitment, forecast trajectory) into a color that drives action.

```
SIGNAL    SPEND vs BUDGET           ACTION
──────────────────────────────────────────────────────────────────
GREEN     < 75% AND on pace         No action
                                    Healthy steady-state
                                    
YELLOW    75-100% OR off pace       Investigate
                                    May exceed; understand why
                                    
RED       > 100%                    Diagnose + act
                                    Already over; root cause + fix
```

The signal is intentionally three-state. Two-state (over/under) is too binary; five-state (intricately tiered) overloads the dashboard. Three states give meaningful differentiation with simple semantics.

### Reading green

```
GREEN means:
  Spend is below 75% of budget
  AND projected to land at or below budget at period-end
  
ACTION:    None required. Look once a week to confirm, then move on.
  
SUSTAINED-GREEN observation:
  Green for 6 months in a row, never crossing 75%?
  Possible: budget was too generous; could tighten.
  Possible: workload shrank.
  Possible: discount realization improved.
  Periodic review of green budgets surfaces over-budgeted lines.
```

Green budgets are the boring majority in a healthy org. The dashboard should show mostly green; the eye is drawn to the yellow and red exceptions.

### Reading yellow

Yellow is the most interesting signal. It is the early-warning state — spend is approaching budget, but the outcome is not yet decided.

```
YELLOW signals require investigation:
  Will spend continue at current pace? (will exceed budget)
  Or is it a one-time spike that will normalize?
  Or is it forecast-based — at <75% but trending toward overrun?
  
INVESTIGATION STEPS:
  1. Look at the trend in Cost Flow / Cost Trend
     Is the rate of spend changing? Acceleration matters more than
     absolute %.
     
  2. Cross-reference with anomaly detection
     Is the yellow caused by a specific anomaly? Often yes.
     
  3. Identify the driver
     Which resource/team/account is contributing the increased
     velocity?
     
  4. Project: continued or one-off?
     One-off: accept; expect to land yellow but in-budget.
     Continued: project the actual end-of-period; plan response.

ACTIONS by projection:
  Continued and minor overrun (105% projected): document and accept
  Continued and major overrun (130% projected): corrective action
  One-off and will fall back: monitor; expect to land in budget
```

The skill in yellow-state investigation is distinguishing **trend** from **spike**. A spike will reverse; a trend will not.

### Reading red

Red means the budget is already exceeded. The conversation has shifted from "will we overrun?" to "we did; what now?"

```
RED diagnosis follows a specific path:

1. ROOT CAUSE
   What drove the overrun?
   - Open the budget's Cost Trend
   - Identify the day/week the trajectory broke from green
   - Cross-reference with anomaly detection for that period
   - Look at Cost Flow Sankey to find the dimension dominating

2. SEVERITY
   - 105% over:  small overrun; usually accept + document
   - 120% over:  significant; investigate and act
   - 150%+ over: emergency; immediate action + executive awareness

3. CORRECTIVE ACTION (by severity):
   Small (<110%): document the cause; accept; adjust next period
   Medium (110-130%): identify recoverable spend; act if possible
   Large (>130%): kill resources, throttle workloads, escalate
   
4. NEXT-PERIOD ADJUSTMENT
   Was the budget too low? (re-baseline)
   Was the workload unplanned? (planning gap to fix)
   Was the overrun preventable? (process improvement)
```

The red conversation is two-step: stop the bleeding (or accept it), then learn the lesson for next period.

### How budgets surface

```
SURFACE                      DETAIL
──────────────────────────────────────────────────────────────────
Dashboard widgets             Per-budget signal at a glance
                              Color + spend amount + budget amount
                              
Reports → Budget Health       All budgets in one view, filterable
                              Sort by signal (red first by default)
                              Multi-team rollup
                              
Notifications                 Color transitions trigger alerts per
                              threshold (M3.6.L3)
                              
Budget detail page             Full trend, threshold history,
                              audit of changes
```

The widget on the dashboard is the most-used surface. A FinOps Lead's morning routine often includes a 30-second glance at the budget widgets.

### Diagnosing red — the standard path

```
STEP 1: Open the budget detail
  See current spend, budget, % overrun, days remaining

STEP 2: Identify when red was triggered
  The trend chart shows when % crossed 100
  Was it gradual or sudden? Date matters

STEP 3: Cost Trend for that period
  Sudden spike (one-time event)?
  Gradual ramp (growth)?
  Step change (specific event)?

STEP 4: Cost Flow Sankey
  For the budget's scope, which dimension dominates?
  Drill into the top contributors

STEP 5: Identify specific resources or pattern
  Often resolves to: one specific resource, one team, one
  account, one cloud service

STEP 6: Take action
  Decide: stop the spend, accept and adjust, or escalate
  Document the decision
```

For most red budgets, steps 1-5 take 5-10 minutes. The action in step 6 is where the time goes.

### Common red causes

Recurring patterns from customer telemetry:

```
CAUSE                                     PATTERN
──────────────────────────────────────────────────────────────────
New workload deployed                     Step change in spend
                                          (sudden jump on launch day)
                                          
Marketing campaign                        Sudden spike, then decline
                                          (clear start + end)
                                          
Cloud provider rate change                Step change across all
                                          (uniform multiplier effect)
                                          
Failed schedule (resource kept on)        Gradual increase from one
                                          specific resource
                                          
Compromised credentials                   Anomalous spike + unusual
                                          regions/services
                                          
Unauthorized provisioning                 Specific user creating
                                          resources outside policy
                                          
Migration ongoing                         Temporary spike during
                                          the migration window
                                          
Autoscaler misconfiguration               Gradual or sudden growth
                                          tied to a specific cluster
                                          
Forgotten cleanup after experiment        Slow drift; specific
                                          resource hanging around
```

Each pattern guides the remediation. Marketing campaigns are accepted; misconfigurations are reverted; compromised credentials trigger incident response.

### How ZopNight uses signals

ZopNight's Budget Health dashboard widgets render the signal in real-time (the spend is computed live per L5). Color transitions trigger notifications at thresholds. The dashboard supports drill from any signal to the budget's detail page; from there, drill to Cost Trend, Cost Flow Sankey, and resource-level analysis.

For weekly Operate cadences, the recommended ritual is: scan the dashboard, click into any non-green budgets, diagnose, document. 20-30 minutes per week to keep budget hygiene healthy.

---

## 2. Demo

A real red-budget diagnosis:

```
SCENARIO: Tuesday morning; FinOps Lead checks dashboard
SIGNAL: dev-platform-eu group budget is RED at 130% over

T+0       Open the budget detail
          Spend: $6,240 / $4,800 budget = 130%
          Days remaining: 8 (75% through period)

T+30 sec  Look at trend chart
          Budget at 70% on day 10; jumped to 130% on day 15
          Inflection on day 14-15

T+1 min   Open Cost Flow Sankey for the budget's scope
          EKS cluster dominates the spike
          (compute spend 3x of pre-spike baseline)

T+2 min   Click into the EKS cluster details
          Worker node count went from 8 to 23 on day 14
          Sustained through day 21 (current day)

T+3 min   Check the cluster's HPA / autoscaler config
          HPA max was 12 prior to day 14
          Now set to 30 (the change happened on day 14)
          
T+5 min   Audit log query: who changed the HPA config?
          User: jane@platform on day 14, 09:23 UTC
          Reason in audit: not recorded (no description)

T+8 min   Reach out to Jane
          "Did you change the HPA max for prod-eks-cluster?"
          Jane: "Yes — load test for the new feature. Forgot to revert."

T+10 min  Action: revert HPA max to 12
          Set a calendar reminder for next planned load test
          Document in team wiki the HPA-revert checklist after load tests

T+15 min  Confirm: pod count dropped from 23 back to expected range
          Budget impact: ongoing spend back to baseline
          End-of-period projection: $5,400 (some overage but recovered)

LESSONS:
  - Load tests need budget impact noted
  - HPA changes should have time-bound revert (or auto-revert)
  - Audit log "reason" field would have surfaced this faster
```

15 minutes from red signal to root cause to fix. The diagnostic path is the key.

---

## 3. Hands-on (5 min)

For your current budgets:

```
SIGNAL SCAN (all budgets):
  Green count:    _____
  Yellow count:   _____
  Red count:      _____

PICK ONE YELLOW or RED:
  Budget:         __________
  Signal:         yellow / red
  Spend / budget: $_____ / $_____
  
  Driver (best guess):
    □ New workload
    □ Marketing campaign
    □ Failed schedule
    □ Autoscaler misconfig
    □ Forgotten cleanup
    □ Other: __________

DIAGNOSIS STEPS to take:
  1. __________
  2. __________
  3. __________

ACTION PLAN:
  __________________________________________________________
```

If you have no yellow or red budgets, scan the green ones for sustained over-budgeting (budgets set too high). Those are worth tightening to free fiscal headroom.

---

## 4. Knowledge check

### Q1
A budget is yellow at 85% mid-period:

A. Ignore until period-end
B. Investigate whether the spend will continue at this rate (and exceed budget) or whether it will slow. Plan corrective action if continuing; document and monitor if one-off. Yellow is the early-warning state — it has more diagnostic value than red.
C. Crisis mode
D. Always escalate

<details>
<summary>Show answer</summary>

**Correct: B.** Yellow warrants investigation but not crisis response. The diagnostic value is highest here because the period is not yet decided.
</details>

### Q2
A budget is red at 130% over. Diagnosis path:

A. Question the budget setting
B. Open the budget detail → Cost Trend for the period → identify the inflection point → Cost Flow Sankey to find the dominant dimension → drill to root cause (resource, change, anomaly) → take corrective action. The diagnosis is systematic, not just "the budget is wrong."
C. Random
D. Disable the budget

<details>
<summary>Show answer</summary>

**Correct: B.** Diagnose, don't disable. The budget signal is doing its job; the response should match.
</details>

### Q3
A budget is green for 6 months in a row, always staying below 75%:

A. The budget is poorly set
B. Healthy steady-state. The team is comfortably within commitment. A reasonable secondary observation: the budget could possibly be tightened to free fiscal headroom for other priorities — but only after confirming the current state is intentional, not the result of a workload shrinking unexpectedly.
C. Crisis
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Green is healthy; sustained low utilization is a signal to consider re-baselining the budget downward.
</details>

---

## 5. Apply

The Budget Health dashboard widget surfaces signals at a glance ([app.zopnight.com/dashboard](https://app.zopnight.com/dashboard)). The full per-budget detail with diagnostic tools lives at [Reports → Budget Health](https://app.zopnight.com/reports/budget-health).

Schedule a weekly Operate cadence — 20-30 minutes per week to scan the dashboard, diagnose yellows and reds, document. This is the highest-leverage budget discipline activity.

---

## Related lessons

- [L1 — Budget vs forecast vs alert](L1_budget_basics.md)
- [L2 — Budget scopes](L2_budget_scopes.md)
- [L3 — Threshold-crossing notifications](L3_threshold_alerts.md)
- [L5 — Live computation, not stored](L5_live_compute.md) *(next)*
- [T3.M3.8.L1 — Trend vs flow](../M3.8_cost_flow/L1_trend_vs_flow.md)

## Glossary terms touched

[Traffic-light signal](../../../reference/glossary/traffic-light-signal.md) · [Yellow state](../../../reference/glossary/yellow-state.md) · [Red diagnosis](../../../reference/glossary/red-diagnosis.md) · [Variance review](../../../reference/glossary/variance-review.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.6.L4
