# Severity ladder — critical to info

§ T2 · M2.1 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **assign** the right severity for any finding, **tune** severity per-rule to reduce noise, **and route** each severity level to the appropriate response channel.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Make sure the right people see the right findings at the right urgency — not everything is critical." |
| **Personas** | Platform Engineer · SRE · FinOps Lead |
| **Prerequisites** | M2.1.L1 · T1.M1.6 (notifications) |
| **Time** | 9 minutes |
| **Bloom verb** | Assign (Apply), Tune (Apply), Route (Apply) |

---

## 1. Concept

Five severity levels, each tied to an action timeline. The severity ladder is the noise filter — without it, every finding looks equal; with it, attention goes to what matters.

```
LEVEL       MEANING                              TIMELINE
─────────────────────────────────────────────────────────────
critical    Security risk or major waste         Today
high        Significant cost or compliance gap   This week
medium      Worth addressing                     This sprint
low         Nice to have                         Backlog
info        Informational only                   No action required
```

The timeline isn't aspirational; it's the operational contract. Critical findings get same-day attention; info findings live in dashboards for context.

### How severity is assigned

Each rule has a default severity in its definition. Three drivers shape the assignment:

```
1. DOLLAR IMPACT
   Higher monthly savings → higher severity
   Examples:
     $500/mo idle EC2:           medium
     $2,000/mo idle EC2:          high
     $5,000/mo idle EKS cluster:  high
     $50,000/mo cost anomaly:     critical
   
2. SECURITY / COMPLIANCE POSTURE
   Anything compromising encryption, public access,
   missing MFA, exposed credentials → critical regardless
   of dollar
   
3. REVERSIBILITY
   Irreversible findings (rapid spend spikes, billing
   anomalies, data exfiltration) higher than reversible
   (scheduled-stop candidates, right-sizing)
```

The three drivers compound. A rule that's both high-dollar AND security-related is automatically critical.

### Tuning severity — two common patterns

Severity is configurable per rule per org. Two common tunes:

```
DOWNGRADE noisy rules
  Scenario: 200 low-severity findings per day clutter dashboards
  Action: downgrade those rules to "info"
  Effect: still visible in dashboard; suppressed from alerts
  Use when: a rule fires correctly but is too frequent

UPGRADE critical findings for your org's risk model
  Scenario: regulated industry; Multi-AZ is required by policy
  Action: upgrade RC-005 (RDS not Multi-AZ) to critical
  Effect: any RDS without Multi-AZ pages on-call
  Use when: a rule has org-specific criticality
```

The tuning is per-org and per-rule. Document why each tune was made.

### Routing severity to action

Most teams pair severity with routing rules (covered in T1.M1.6.L4):

```
SEVERITY                ROUTING                          RESPONSE TIME
────────────────────────────────────────────────────────────────────────
critical                Pages on-call (PagerDuty)        Same day
                        + #finops-alerts                  Hours, not days
                        + email to platform lead
                        
high                    #finops-alerts                    This week
                        + per-team channel                Days
                        + weekly digest                   
                        
medium                  Per-team channel                  This sprint
                        + weekly digest email             Weeks
                        
low                     Weekly digest only                Backlog
                        + visible in dashboard            Best effort
                        
info                    Suppressed in alerts              No SLA
                        + visible in dashboard            Reference only
```

The routing is the contract between detection and action. Without it, alerts become noise.

### Severity hygiene anti-patterns

```
ANTI-PATTERN                            FIX
──────────────────────────────────────────────────────────────────
Everything is critical                   Tune; reserve critical for
                                          genuine urgency
                                          
Severity ignored                         Tune the routing; not the
in routing                               severity setting itself
                                          
Severity changes without doc             Track why each tune happened
                                          Audit annually
                                          
Severity doesn't match impact            Trust the dollar-based default
                                          Override only with justification

Static severity (never reviewed)         Quarterly review
                                          Some rules upgrade as estate grows
                                          Some downgrade as patterns become
                                          tolerable
```

The hygiene is the quarterly review. Without it, severity drifts.

### Severity vs urgency vs importance

```
SEVERITY = ZopNight's classification of the finding
URGENCY = how fast must we act (varies by team / context)
IMPORTANCE = does this matter (largely captured by severity)

EXAMPLE: critical-severity finding for a known issue
  ZopNight: critical
  Team's urgency: low (already planned for next sprint)
  Importance: high (real issue; just not new)
  
ROUTING: still notifies because the SLA says so
TEAM RESPONSE: acknowledges; works on planned schedule
```

The severity is the standardized classification; urgency is the team's interpretation. Both matter.

### How severities accumulate over time

A typical org's severity distribution:

```
SEVERITY DISTRIBUTION (mid-size estate, steady state):

critical:    < 5 open at any time
high:        20-50 open
medium:      100-300 open
low:         500-1000 open
info:        1000+ open

OPEN AGE (average):
critical:    < 1 day
high:        3-7 days
medium:      14-30 days
low:         evergreen
info:        evergreen
```

This is the "healthy" pattern. Deviation signals process problems:
- 30+ open criticals: routing broken or team overwhelmed
- 100+ open highs: SLA being missed
- 500+ open mediums: prioritization unclear
- Very low totals: rules underconfigured or estate is tiny

### Reading severity distribution

The distribution itself is diagnostic:

```
WHAT THE DISTRIBUTION TELLS YOU:

CRITICAL count growing:
  Routing or response process broken
  Or: new issue class emerging
  Investigate immediately
  
HIGH stuck at >50:
  Team can't keep up with the load
  Consider downgrades OR more resources for action
  
MEDIUM age increasing:
  Backlog growing
  Quarterly cleanup needed
  
LOW/INFO not growing:
  Likely suppressed/disabled rules
  Audit: are valuable signals being missed?
```

The distribution monitoring catches process drift early.

---

## 2. Demo

A team's severity audit (mid-size, mature ops):

```
QUARTERLY SEVERITY AUDIT (Q1 2026):

CURRENT DISTRIBUTION:
  SEVERITY      OPEN COUNT     TYPICAL AGE      TREND vs LAST QUARTER
  critical      3              < 1 day          flat (healthy)
  high          47             3-7 days         flat
  medium        184            14-30 days       up 8% (manage)
  low           623            evergreen        flat
  info          1,247          evergreen        flat
  
HEALTH ASSESSMENT:
  3 critical = healthy (low; resolved fast)
  47 high = manageable (within SLA)
  184 medium = growing slightly (watch; plan extra cleanup)
  623 low + 1247 info = bulk; appropriate

ACTION FROM AUDIT:
  - Quarterly cleanup sprint for medium-severity
    Target: down to 150 by end of Q2
  - Severity rules reviewed:
    - RDS Multi-AZ severity reviewed (still high; org accepts the SLA)
    - 3 rules downgraded from low to info (too frequent)
  - Routing reviewed:
    - Critical → PagerDuty: confirmed working (last incident T+12 min)
    - High → #finops-alerts: confirmed; team's avg response 3 days
  
CONTROL CHECK:
  Last critical: incident 2026-02-15
    Notification fired: T+0
    Acknowledged: T+8 min (PagerDuty)
    Resolved: T+34 min
    SLA met
```

The audit confirms severity + routing is working. Quarterly cadence keeps it healthy.

---

## 3. Hands-on (4 min)

Run severity audit on your estate:

```
□ STEP 1: Open Recommendations; group by severity
  critical: _____
  high: _____
  medium: _____
  low: _____
  info: _____

□ STEP 2: Check open ages
  Critical's oldest: _____ days (target: <1)
  High's oldest: _____ days (target: <7)
  Medium's oldest: _____ days (target: <30)

□ STEP 3: For each critical
  Action this week? □ Yes □ No
  Owner: __________

□ STEP 4: Check routing
  Critical routes to: __________
  High routes to: __________
  Confirm: notifications actually firing

□ STEP 5: Quarterly review reminder
  Date: __________
  Owner: __________
```

A 10-minute audit reveals the health. Quarterly cadence maintains it.

---

## 4. Knowledge check

### Q1
An RDS instance is public-internet accessible. Likely severity:

A. low
B. medium
C. high
D. critical

<details>
<summary>Show answer</summary>

**Correct: D — critical.** Public-access on production data is critical regardless of dollar impact. The security/compliance posture driver overrides dollar-based default.
</details>

### Q2
A team gets 800 low-severity notifications per day. The fix:

A. Hire more engineers
B. Downgrade noisy rules from low to info; routing drops info from alerts
C. Disable the rules entirely
D. Tolerate the noise

<details>
<summary>Show answer</summary>

**Correct: B — downgrade.** Severity is the lever for routing. Move noisy low-impact rules to info; they stay visible in dashboard but stop alerting. Disabling rules loses signal entirely.
</details>

### Q3
A $5,000/mo idle EKS cluster. Default severity:

A. low
B. medium
C. high
D. critical

<details>
<summary>Show answer</summary>

**Correct: C — high.** $5,000/mo is significant cost; high-severity with this-week timeline. Critical reserved for security or extreme dollar (>$50K spikes typically).
</details>

---

## 5. Apply

Settings → Recommendation Severity to override per-rule defaults. Routing rules (T1.M1.6.L4) then map severity to channels.

For your team: quarterly severity + routing audit. Confirm SLAs being met; tune rules per org's risk model.

---

## Related lessons

- [L1 — The 8 categories](L1_eight_categories.md)
- [L3 — Rule interface](L3_rule_interface.md) *(next)*
- [L4 — Pricing model](L4_pricing_model.md)
- [L5 — Reading a recommendation card](L5_reading_a_rec_card.md)
- [T1.M1.6.L4 — Severity routing](../../T1_zopnight_operator/M1.6_history_notifications_audit/L4_severity_routing.md)

## Glossary terms touched

[Severity ladder](../../../reference/glossary/severity-ladder.md) · [Severity routing](../../../reference/glossary/severity-routing.md) · [Critical severity](../../../reference/glossary/critical-severity.md) · [Severity tuning](../../../reference/glossary/severity-tuning.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.1.L2
