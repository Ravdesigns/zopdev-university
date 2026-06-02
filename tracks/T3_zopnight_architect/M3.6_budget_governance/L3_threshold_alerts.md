# Threshold-crossing notifications

§ T3 · M3.6 · L3 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **design** threshold chains that escalate appropriately, **avoid** notification fatigue, **and route** alerts to the right audience at each severity.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Wire up alerts that fire at the right time, on the right channel, to the right people — without becoming background noise." |
| **Personas** | FinOps Lead · Platform Engineer · SRE / On-call |
| **Prerequisites** | M3.6.L1 (budget basics) · M3.6.L2 (budget scopes) |
| **Time** | 9 minutes |
| **Bloom verb** | Design (Create), Avoid (Apply), Route (Apply) |

---

## 1. Concept

Each budget can have multiple **thresholds** — percentage levels of the budget that trigger a notification when spend crosses them. Thresholds combined into an **escalation chain** drive a sequence of conversations from "informational" through "urgent" to "emergency," with different audiences for each.

```
BUDGET: $4,800/month (per-group dev-platform-eu)

ESCALATION CHAIN (5 thresholds, increasing severity):
  50%  ($2,400):  notify #finops-info        (informational)
  75%  ($3,600):  notify #dev-platform-eu    (team awareness)
  90%  ($4,320):  notify #dev-platform-eu +
                   #finops-alerts             (escalation)
  100% ($4,800):  notify lead +
                   #finops-alerts             (overage)
  110% ($5,280):  notify #finops-alerts +
                   PagerDuty                  (incident)
```

Each threshold fires once per period; the next threshold is the next conversation. The chain pattern is what turns budget management from a single end-of-month event into a continuous discipline.

### Threshold patterns

```
SOFT THRESHOLDS (informational)
  50%   — half-way mark; some teams set, some skip
  75%   — three-quarters; common starting point
  
HARD THRESHOLDS (action required)
  90%   — close to budget; investigation warranted
  100%  — at budget; commitment level
  110%  — over budget; meaningful variance
  
EMERGENCY THRESHOLDS (rare)
  125%  — significant overage; for critical budgets only
  150%  — exceptional; runaway suspected
```

A typical chain has 3-5 thresholds. Too few (only 100%) means no early warning; too many (8+) means notification fatigue.

### Escalation logic

The audience changes as severity rises:

```
50%   →  Quiet channel (informational digest)
75%   →  Team channel (team awareness)
90%   →  Team channel + FinOps (escalation)
100%  →  Team lead + FinOps + finance (overage)
110%  →  All of above + paging or executive escalation (emergency)
```

The pattern: lower thresholds inform; higher thresholds escalate. The lowest threshold should not page anyone; the highest threshold should not be silent.

### Threshold reset on period boundary

Threshold notifications fire **once per period per threshold**. After firing, the same threshold does not re-fire even if spend continues to rise.

```
2026-05-15: spend reaches 75% → alert fires
2026-05-20: spend reaches 90% → alert fires (different threshold)
2026-05-25: spend reaches 100% → alert fires (different threshold)
2026-05-28: spend still over 100% → NO new alert
                                   (100% already fired this month)

NEXT MONTH:
2026-06-01: budget period resets; thresholds rearm
2026-06-15: spend reaches 75% → alert fires (new month)
```

The single-fire-per-period rule prevents alert spam. A budget at 105% for two weeks fires once, not daily. The next conversation triggers at the next threshold (110%) or at period-end variance review.

### Variable thresholds by budget importance

Different budgets need different threshold patterns. The same chain does not fit everything.

```
DEV / TEST BUDGETS (less critical):
  Pattern: 50%, 75%, 90%, 100%
  Reason:   tolerable variance; alert at half/3-quarters/close/over
  Audience: team-level; minimal escalation

PROD-CRITICAL BUDGETS (high-importance):
  Pattern: 10%, 25%, 50%, 75%, 90%, 100%, 110%, 125%
  Reason:   more granular; want early signal for production cost
            anomalies that often grow exponentially
  Audience: team + FinOps + on-call (for 100%+)

SMALL BUDGETS ($100/month range):
  Pattern: 50%, 100%
  Reason:   minimize noise; small budgets variance is normal
  Audience: owner only

ANNUAL / QUARTERLY BUDGETS (slow-moving):
  Pattern: weekly checkpoints at 25%, 50%, 75%, 90%
  Reason:   long period; needs intra-period checkpoints
```

Tune per budget. The right pattern is the one that produces actionable alerts at the right cadence for the budget's audience.

### Notification routing

Threshold-to-audience routing should match the conversation needed at that severity:

```
THRESHOLD                NOTIFICATION CHANNELS / AUDIENCES
──────────────────────────────────────────────────────────────────
50%                       Quiet/digest channel (e.g., #finops-info)
                          Goal: passive awareness
                          
75%                       Team channel
                          Goal: team-level visibility
                          
90%                       Team channel + FinOps
                          Goal: focused discussion before overage
                          
100%                      Team lead direct + FinOps + finance
                          Goal: leadership awareness, decision point
                          
110%                      All of above + on-call paging (if prod)
                          Goal: immediate response
                          
125%+                     Executive escalation
                          Goal: business-level intervention
```

The hop from "channel" to "person" should match a real change in expected response time. A channel post can sit for hours; a paging notification expects sub-15-minute acknowledgment.

### What happens after 100%

```
At 100%: hard alert fires; the budget is at commitment level
After 100%: spend continues normally (budgets don't auto-stop)

POSSIBLE RESPONSES (human-mediated):
  1. INVESTIGATE — find the source of the overrun
  2. ADJUST BUDGET — one-time exception or persistent change
  3. CORRECTIVE ACTION — kill / scale-down resources
  4. ACCEPT — document the overrun and move on
  5. ESCALATE — bring to leadership / finance
```

ZopNight cannot enforce a budget without risking production damage. The 100% alert is the conversation trigger; the response is the conversation.

### Common configuration mistakes

```
MISTAKE                          IMPACT             FIX
──────────────────────────────────────────────────────────────────
Only 100% threshold              Late warning;       Add 75% and 90%
                                 no early signal
                                 
Same channel for all thresholds  Channel fatigue;    Route by severity
                                 alerts ignored
                                 
50% threshold pages on-call      Page fatigue;       50% → digest;
                                 alerts ignored      100%+ → page
                                 
No threshold at 75% or 90%       Jump from 50% to    Add intermediate
                                 100% feels sudden    thresholds
                                 
Same pattern for all budgets     Inappropriate for   Tune per budget
                                 small/large mix
                                 
Threshold percentages with no    No clear next       Define audience
audience routing                  step                 + action
```

The most common mistake is the first — setting only the 100% threshold. By the time the conversation starts, the period is mostly spent; there is little time to adjust.

### How ZopNight uses threshold routing

ZopNight's notification engine supports multi-channel routing per threshold. Channels can be Slack, Microsoft Teams, email, PagerDuty, generic webhooks, or custom integrations. Each channel can be conditioned on time-of-day (no pages during off-hours for non-critical) and on day-of-week (no weekend pages for dev environments).

For audit purposes, every threshold-crossing event is logged with the spend amount, threshold percentage, notification channels reached, and acknowledgment timestamps. The audit log (M3.3) captures these events.

---

## 2. Demo

A real escalation through a month:

```
BUDGET:  dev-platform-eu group, $4,800/month
THRESHOLD CHAIN: 50%, 75%, 90%, 100%, 110%

WEEK 2 (mid-period)
  T+0      Spend reaches $2,400 (50%)
  T+0      Notification: #finops-info ("dev-platform-eu at 50%,
            on-track")
  T+0      No one investigates; informational only
  
WEEK 3
  T+0      Spend reaches $3,600 (75%)
  T+0      Notification: #dev-platform-eu ("at 75%, approaching
            limit")
  T+1 day  Team lead asks: "anything unusual happening?"
            Engineer: "we provisioned 2 test instances yesterday for
            a load test"
            
WEEK 4 START
  T+0      Spend reaches $4,320 (90%)
  T+0      Notification: #dev-platform-eu + #finops-alerts
            ("90% — imminent budget overrun")
  T+1 hour FinOps + team lead discuss
            Decision: accept the test-instances cost; clean up
            after the load test completes
            
WEEK 4 END
  T+0      Spend reaches $4,800 (100%)
  T+0      Notification: team lead direct + #finops-alerts +
            finance ("at budget")
  T+30 min Variance conversation:
            Cause: load-test instances (already known)
            Impact: $40 over budget at month-end forecast
            Decision: accept (load test successful; instances
            will be cleaned up on schedule)
            
END OF MONTH
  Spend: $4,820 (100.4%); minimal overage
  110% threshold never crossed; no emergency triggered
  Action: documented; June budget unchanged
  Lessons: include planned load tests in budget planning
```

Five thresholds in the chain; four fired. The 110% would have triggered paging — only used if things went seriously wrong.

---

## 3. Hands-on (5 min)

For one of your team's budgets, audit the threshold chain:

```
BUDGET:               __________
AMOUNT:                $__________ /month
SCOPE:                team / group / resource

CURRENT THRESHOLDS:
  □ 50%   → channel: __________ (or "not set")
  □ 75%   → channel: __________
  □ 90%   → channel: __________
  □ 100%  → channel: __________
  □ 110%  → channel: __________
  □ Other __________

GAPS:
  □ Missing early warning (no 50% or 75%)
  □ All thresholds → same channel (alert fatigue risk)
  □ 50% → high-priority channel (over-alerting)
  □ No paging at 110% for production budget
  □ No audience defined for any threshold

PROPOSED IMPROVEMENT:
  __________________________________________________________
```

If your only threshold is 100%, you have no early warning. Add at minimum a 75% threshold to your team channel.

---

## 4. Knowledge check

### Q1
A budget crosses 90%. What happens to spending?

A. Hard stop — no new resources
B. Notification fires; spending continues. Budgets are conversation triggers, not enforcement. The 90% notification means "talk about this now before the 100% overage."
C. Auto-disable
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Budgets do not auto-enforce. The notification triggers the conversation; the conversation drives action.
</details>

### Q2
A budget crosses the 50% threshold multiple times during the month (spike up, spike down, spike up again):

A. Each crossing fires a notification
B. The 50% notification fires ONCE per period. Subsequent crossings of the same threshold do not re-notify. This prevents alert fatigue. The next conversation triggers at the next threshold (75%), not at a re-crossing of 50%.
C. Random
D. Twice

<details>
<summary>Show answer</summary>

**Correct: B.** One notification per threshold per period is by design. Repeated re-crossings are not separate signals.
</details>

### Q3
Production budget at 110% over. Best response:

A. Wait until next week
B. Emergency. The escalation chain routes 110% to on-call paging (or executive escalation) for production budgets. 110% over on production indicates a real deviation that needs investigation now — runaway cost, schedule failure, security incident, or unplanned launch.
C. Mute alerts; wait it out
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Production overruns at 110% are emergencies. The escalation chain reflects business impact.
</details>

---

## 5. Apply

Configure threshold chains at [Settings → Budgets → budget detail → Thresholds](https://app.zopnight.com/settings/budgets). Per-threshold routing supports Slack, Teams, email, PagerDuty, and webhooks.

For org-wide consistency, document the threshold-pattern convention (which percentages, which channels) in your team wiki — different teams using different patterns makes cross-team variance review harder than it needs to be.

---

## Related lessons

- [L1 — Budget vs forecast vs alert](L1_budget_basics.md)
- [L2 — Budget scopes](L2_budget_scopes.md)
- [L4 — Green/yellow/red signals](L4_signals.md) *(next)*
- [L5 — Live computation, not stored](L5_live_compute.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[Threshold](../../../reference/glossary/threshold.md) · [Escalation chain](../../../reference/glossary/escalation-chain.md) · [Notification routing](../../../reference/glossary/notification-routing.md) · [Alert fatigue](../../../reference/glossary/alert-fatigue.md) · [Single-fire-per-period](../../../reference/glossary/single-fire-per-period.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.6.L3
