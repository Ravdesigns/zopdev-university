# Freeze windows

§ T5 · M5.2 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **implement** schedule freeze windows for holidays and special events, **choose** the right granularity (org-wide / targeted / per-resource), **and communicate** freezes to the team to avoid surprise.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Disable scheduled stops during holidays / launches / compliance windows so engineers don't return to unexpected shutdowns." |
| **Personas** | Platform Engineer · SRE · Engineering Manager |
| **Prerequisites** | M5.2.L1 - L3 · T1.M1.5 (override system) |
| **Time** | 9 minutes |
| **Bloom verb** | Implement (Apply), Choose (Evaluate), Communicate (Apply) |

---

## 1. Concept

Freeze window: a defined period when normal schedules don't fire. Resources stay in their current state (typically running) regardless of what their schedule would normally do. Used for:

```
WHEN TO FREEZE:

HOLIDAYS
  Christmas / New Year
  Thanksgiving / Easter
  National holidays per region
  Reason: engineers offline; can't respond to unexpected shutdowns
  
CONFERENCE WEEKS
  KubeCon, re:Invent, SaaStr, etc.
  Reason: demo environments need to stay available
  
MAJOR LAUNCHES
  Big product launches
  Reason: stability prioritized over cost savings
  
COMPLIANCE WINDOWS
  SOC 2 / ISO audit period
  Annual financial close
  Reason: auditor expects stable environment
  
MAINTENANCE WINDOWS
  Cloud provider maintenance
  Migration weekends
  Reason: don't compound disruption with scheduled stops
```

The freeze is a deliberate pause of normal scheduling discipline. Document the reason; expire it at the right time.

### What a freeze does

```
DURING A FREEZE:
  ✓ No new schedule actions fire (no off-hours stops, no scale-down)
  ✓ Resources stay in current state
  ✓ Engineers don't return to unexpected shutdowns
  ✓ Cost is higher during the freeze (you pay for the freeze)
  
FREEZE DOES NOT:
  ✗ Affect new resources provisioned during the window
    (those follow their schedule normally unless added to override)
  ✗ Change underlying schedules (just suspends firing)
  ✗ Affect manual actions (engineers can still stop/start manually)
  ✗ Block engineering changes (deployments still happen)
```

The freeze is scope-limited to ZopNight's scheduled actions; everything else continues.

### Configuring via ZopNight override system

ZopNight implements freezes via the override mechanism (covered in T1.M1.5):

```
OVERRIDE CONFIGURATION for a freeze:
  
  Mode:         force-on
  Target:       resource group or tag (e.g., env=prod-critical)
  Start time:   2026-12-20 00:00 UTC
  End time:     2026-01-02 00:00 UTC (auto-expiry)
  Reason:       "Holiday freeze — no scheduled stops"
  Created by:   platform-team@company.com
  Approved by:  (if required by org policy)

EFFECT during the override window:
  Affected schedules don't fire stop actions
  Resources stay running
  Audit log records the override + reason
  
POST-FREEZE (auto-expiry at end time):
  Override expires
  Schedules resume firing
  No human action needed
```

The auto-expiry is critical — manual cleanup gets forgotten and freezes drift.

### Example freeze patterns

```
CHRISTMAS / NEW YEAR FREEZE:
  Override starts: Dec 20 00:00 UTC
  Override ends:   Jan 2 00:00 UTC
  Duration: 13 days
  Target: all non-prod (because engineers offline)
  Cost: ~$8K extra (would have been off; full-cost during freeze)
  Justification: avoid Monday-back-from-holiday surprise outages

MAJOR PRODUCT LAUNCH FREEZE:
  Override starts: 1 week before launch (Mon)
  Override ends:   1 week after launch (Mon)
  Duration: 2 weeks
  Target: production-critical + dependencies
  Justification: stability over savings during launch validation

CONFERENCE WEEK FREEZE (re:Invent):
  Override starts: Mon of conference
  Override ends:   Fri of conference week
  Target: demo environments + presenter dev envs
  Justification: demo continuity

ANNUAL FINANCIAL CLOSE:
  Override starts: Dec 28
  Override ends:   Jan 5
  Target: finance + billing systems
  Justification: no disruption during year-end reporting

QUARTERLY SOC 2 AUDIT WINDOW:
  Override starts: audit-start date
  Override ends:   audit-end date
  Target: in-scope resources (per audit boundary)
  Justification: auditor sees stable environment
```

Common patterns; each has a clear cost/benefit trade.

### Freeze granularity — three levels

```
LEVEL 1 — ORG-WIDE FREEZE
  Apply to: "all" group or all resource groups
  Scope: everything
  Use when: holiday with all engineers offline
  Cost: highest (all schedulable resources stay running)
  Risk: lowest (nothing surprises)

LEVEL 2 — TARGETED FREEZE
  Apply to: specific groups (e.g., env=prod-critical)
  Scope: business-critical only
  Use when: launch / compliance affecting specific scope
  Cost: medium (non-critical still cycles)
  Risk: medium (engineer might miss a critical resource)

LEVEL 3 — PER-RESOURCE FREEZE
  Apply to: specific resources (e.g., 5 specific instances)
  Scope: narrowest
  Use when: specific high-stakes systems need protection
  Cost: lowest (only the listed resources)
  Risk: highest tracking (easy to miss something)
```

Choose granularity matching the freeze reason. Holidays: org-wide. Launches: targeted. Specific systems: per-resource.

### Annual freeze calendar

Most teams maintain a calendar of recurring freezes:

```
ANNUAL FREEZE CALENDAR (example):

  Dec 20 - Jan 2:   Christmas / New Year (org-wide non-prod)
  Mid-March:        Q1 close (finance systems only)
  Mid-June:         Q2 close
  Mid-Sept:         Q3 close
  Mid-Dec:          Q4/annual close (extended through new year)
  Nov 25 - Dec 1:   Thanksgiving + Black Friday (e-commerce only)
  Late June:        Eid (regional, MENA team)
  Various:          Per-team Diwali / Lunar New Year / etc.

CONFERENCES (per-team):
  Mar 4-7:    Vinod attends KubeCon
  Jun 12-14:  Whole team at Demo Day
  Dec 1-5:    re:Invent (cloud team)

LAUNCHES (planned 2026):
  Q1 launch:  Feb 15-22 (1 week before/after)
  Q3 launch:  Aug 10-17

REVIEW: quarterly
OWNER: Platform team lead
```

Publish the calendar; reference it in onboarding. Engineers know when freezes happen.

### Communication — never silent

```
FREEZE COMMUNICATION CHECKLIST:

PRE-FREEZE (1-2 weeks before):
  □ Team Slack: "Holiday freeze Dec 20 - Jan 2; non-prod stays up"
  □ Wiki page updated with current freezes
  □ On-call runbook updated
  □ Cost impact estimated and shared
  
DURING FREEZE:
  □ Daily cost monitoring (catch unintended spikes)
  □ Override visible in ZopNight UI
  □ Engineers can see freeze status when they log in
  
POST-FREEZE:
  □ Verify normal schedules resumed
  □ Document any incidents that occurred
  □ Cost reconciliation (freeze cost vs estimate)
  □ Lessons learned for next freeze
```

The communication is what makes freezes acceptable to leadership — they understand the cost trade.

### Cost of a freeze

```
EXAMPLE COST IMPACT (Christmas freeze, 13 days, org-wide non-prod):

NORMAL non-prod cost (with schedules): $14K/mo = $467/day
DURING FREEZE (no scheduled stops): $467 × (24/12) = ~$933/day
                                    (~2x because schedules normally
                                     halve the daily cost)
FREEZE DURATION: 13 days
EXTRA COST: ($933 - $467) × 13 = $6,058

VALUE: avoid 1-2 unintended outages during the holidays
       Each outage: hours of engineer time to investigate + recover
       Plus: customer-trust impact

DECISION: $6K is worth it for the freeze; engineers offline
          rendered the savings moot anyway (engineers would have
          force-started everything Monday at higher cost)
```

Freezes are deliberate cost trades. Document; review post-freeze for ROI.

### Common pitfalls

```
PITFALL                              MITIGATION
──────────────────────────────────────────────────────────────────
Override left in place after        Always set auto-expiry datetime
event (cost balloons)               Calendar review post-event
                                    
Engineer adds resource during        Document: "new resources during
freeze; assumes it's also frozen     freeze still follow normal schedule"
                                    Or: add new resource to override
                                    
Multiple overlapping freezes         Document each separately
(confused about which wins)          Most-restrictive wins (longest
                                     duration / largest scope)
                                    
Team forgets to communicate          Pre-freeze checklist
freeze; team confused about           Slack reminder 1 week + day-of
unexpected costs                    
                                    
Override granularity wrong          Test with small group first
(too narrow; missed resources)       Audit affected vs unaffected
                                    
Costs balloon during freeze         Daily cost monitoring during
without notice                       Alert if cost >X% of normal
```

Most pitfalls are process gaps. The annual freeze calendar + communication checklist prevent most.

---

## 2. Demo

A real Christmas freeze rollout:

```
TEAM: 200-engineer SaaS, mostly US-based

PLANNING (Dec 5 — 2 weeks ahead):

  Identify scope:
    Org-wide non-prod (engineers offline; full freeze)
    Production excluded (always-on anyway)
    
  Estimate cost:
    Normal non-prod (with schedules): $14K/mo
    During freeze (no schedules): $14K × 2 ≈ $28K/mo run rate
    Freeze duration: 13 days
    Extra cost: ($28K - $14K) × (13/30) = $6,067
    
  Get sign-off:
    Cost owner (CFO ops): approved
    Platform lead: approved
    Engineering VPs: notified

COMMUNICATION:
  Dec 5:   #eng-platform Slack post
           "Holiday freeze planned Dec 20 - Jan 2:
            * Non-prod stays on (no scheduled stops)
            * Estimated extra cost: $6K (reviewed + approved)
            * New resources during freeze: follow normal schedule
            * Production: unchanged
            * Engineers: don't expect anything unusual on return"
  Dec 12:  Reminder + wiki update
  Dec 18:  Final reminder; on-call runbook updated

EXECUTION (Dec 20):
  Dec 20 00:00 UTC: Override applied
                   Type: force-on
                   Target: all groups tagged environment != prod
                   Start: Dec 20 00:00 UTC
                   End: Jan 2 00:00 UTC
                   Reason: "Holiday freeze 2026"
                   
  Dec 20 00:01:    Slack notification fires (automated):
                   "Freeze active until Jan 2"
                   
MONITORING (mid-freeze):
  Dec 23: cost check; tracking $935/day (vs $467/day normal)
          Within projection.
  Dec 27: cost check; same.
  Dec 31: cost check; same.

EXPIRY (Jan 2):
  Jan 2 00:00 UTC: Override expires automatically
                   Schedules resume firing
                   Normal cycle by Jan 2 evening
                   No human action needed.

POST-FREEZE REVIEW (Jan 5):
  Cost reconciliation:
    Estimated extra: $6,067
    Actual extra:    $5,940 (matched within 2%)
    
  Incidents during freeze: 0
  Engineers surprised on return: 0
  
  ROI: $5,940 cost; avoided likely 1-2 unintended outages;
       team return-from-holiday clean.
  
  Calendar updated for 2027 Christmas freeze (same pattern).
```

The pattern is repeatable annually. Set it once, refine each year.

---

## 3. Hands-on (5 min)

Build your freeze calendar:

```
□ STEP 1: List upcoming freezes (next 12 months)
  Christmas/New Year:    __________ - __________
  Major launch?           __________ - __________
  Conference?             __________ - __________
  Compliance audit?       __________ - __________
  Annual close?           __________ - __________
  Regional holidays?      __________

□ STEP 2: For each, decide granularity
  □ Org-wide
  □ Targeted (which groups)
  □ Per-resource

□ STEP 3: Estimate cost
  Freeze 1: __________   Duration: ___ days   Extra cost: $_____
  Freeze 2: __________   Duration: ___ days   Extra cost: $_____

□ STEP 4: Plan communication
  Pre-freeze: __________ (Slack channel + wiki page)
  During:     __________ (cost monitoring + status visibility)
  Post:       __________ (review + lessons)

□ STEP 5: Calendar reminder
  Set calendar reminders 2 weeks before each freeze
  Owner: __________
```

A 30-minute planning session sets up the year of freezes. Saves hours of mid-event scrambling.

---

## 4. Knowledge check

### Q1
A freeze window suspends:

A. New resources from being provisioned
B. Scheduled actions during the window. Existing state preserved. New resources (provisioned during the freeze) still follow their schedule unless explicitly added to the override. Other operations (manual stops, deploys) continue.
C. Random
D. Everything in ZopNight

<details>
<summary>Show answer</summary>

**Correct: B.** Scheduled actions only; not new resources or other ops.
</details>

### Q2
Freeze override expiry:

A. Manual extend required
B. Automatic at the configured expiry datetime. Set explicitly when creating the override. Auto-expiry prevents "freeze drift" where overrides are forgotten and cost stays high indefinitely.
C. Random
D. Never expires

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-expiry is critical; manual extends get forgotten.
</details>

### Q3
A Christmas freeze for production-critical systems:

A. Always org-wide
B. Targeted — freeze on production-critical groups specifically. Other non-critical groups can continue normal schedules (still saving cost). Granular freezes minimize cost while protecting what needs protection. Choose granularity to match the freeze reason.
C. Random
D. Per-resource always

<details>
<summary>Show answer</summary>

**Correct: B.** Granular freeze. Match scope to reason.
</details>

---

## 5. Apply

Annual freeze calendar. Use ZopNight's override system with auto-expiry. Communicate pre/during/post. Document cost trade-offs.

For your team: build a 12-month freeze calendar this quarter. Plan ahead; communicate clearly.

---

## Related lessons

- [L1 — Four envs scheduling](L1_four_envs.md)
- [L2 — Scale-to-one pattern](L2_scale_to_one.md)
- [L3 — Rolling test environment](L3_rolling_test.md)
- [L5 — Demo / prod-like environments](L5_demo_prod.md) *(next)*
- [T1.M1.5 — Override system](../../T1_zopnight_operator/M1.5_overrides/00_README.md)

## Glossary terms touched

[Freeze window](../../../reference/glossary/freeze-window.md) · [Force-on override](../../../reference/glossary/force-on-override.md) · [Auto-expiry](../../../reference/glossary/auto-expiry.md) · [Annual freeze calendar](../../../reference/glossary/annual-freeze-calendar.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.2.L4
