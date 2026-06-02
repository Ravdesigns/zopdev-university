# Team redistribution suppression

§ T2 · M2.10 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why a cost shift between teams doesn't fire an anomaly, **configure** the suppression threshold, **and recognize** when suppression might mask a real issue.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Avoid noisy team-level alerts when cost is just shifting between teams — keep attention on actual cost events." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.10.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Explain (Understand), Configure (Apply), Recognize (Apply) |

---

## 1. Concept

When costs shift between teams (one team gains, another loses), no net change happens at the org level. The system suppresses both team-level anomalies to avoid alert noise.

```
THE INSIGHT:
  Cost shift between teams ≠ cost event
  It's redistribution
  Total stays the same
  Two teams' alerts would be noise
  
SUPPRESSION:
  Detect: net change across affected teams
  If net change < threshold: suppress team-level alerts
  Org-level and resource-level still fire
```

The pattern reduces noise without losing signal.

### How redistribution suppression works

```
EXAMPLE:
  yesterday:
    team=platform: $5,000 (was $4,800 day before)  → +4%
    team=services: $3,000 (was $3,200 day before)  → -6%
    TOTAL: $8,000 (was $8,000) → 0% change

WITHOUT SUPPRESSION:
  platform team gets an info alert "+4%"
  services team gets an info alert "-6%"
  Two teams investigate
  Time wasted on a "no net change" event

WITH SUPPRESSION:
  Net change between teams: tiny (<20% net change)
  Both team-level alerts suppressed
  Org-level: no alert (0% change)
  
THE PATTERN:
  Cost shifting between teams isn't a meaningful cost event
  It's a redistribution
  Alerts would be noise
  
  System recognizes the pattern; suppresses
```

The suppression is the noise-reduction mechanism.

### The 20% threshold

```
DEFAULT: if |net change between affected teams| < 20%, suppress alerts
on those teams

EXAMPLES:
  
  CASE 1 (suppress):
    Team A: +500% (was $100, now $600)
    Team B: -98% (was $500, now $10)
    Net change: $600 + $10 - $100 - $500 = $10 (just shifted; tiny net)
    → SUPPRESS both team-level alerts
    
  CASE 2 (don't suppress):
    Team A: +500% (was $100, now $600)
    Team B: +0% (was $500, now $500)
    Net change: $500 (real increase)
    → DON'T SUPPRESS; team A alert fires
    
  CASE 3 (don't suppress):
    Team A: +200% (was $100, now $300)
    Team B: -10% (was $500, now $450)
    Net change: ~$200 → -$50 = $150 (above threshold relative to original)
    → DON'T SUPPRESS; both teams alert
```

Net change captures whether org-level cost actually increased.

### What is NOT suppressed

```
ALWAYS FIRES (regardless of suppression):

1. ORG-LEVEL ANOMALIES
   Reflect total spend changes
   Always fire when significant
   
2. RESOURCE-LEVEL ANOMALIES
   A single resource spiking is reported regardless of team-level pattern
   The resource is the source-of-truth signal
   
3. CLOUD-ACCOUNT OR RESOURCE-GROUP DIMENSIONS
   Have their own detection logic
   Not affected by team-level suppression
   
4. RESOURCE ANOMALIES contributing to a team-level spike
   The resource fires
   The team-level might suppress
   But the resource is still surfaced

SUPPRESSION is targeted only at team-level dimensions
  Other dimensions independent
```

The targeted suppression preserves visibility while reducing noise.

### Why suppress

```
WITHOUT SUPPRESSION:
  Cost shift to a different team category fires team-level alerts
  Team A gets +alert
  Team B gets -alert
  Both teams investigate
  Time wasted on "no net change" events
  
WITH SUPPRESSION:
  Alerts suppress when net is small
  Teams investigate when net change is real
  Time spent on actual cost events
  
SIGNAL-TO-NOISE improves significantly
  Team alerts that fire = team-specific events
  Not redistribution noise
```

The improvement is meaningful in mid-to-large orgs with many teams.

### Configuring the threshold

Per-org configuration:

```
Settings → Anomaly Detection → Team Redistribution Suppression
─────────────────────────────────────────────────────────────
Suppression threshold (% net change):  20% (default)

TIGHTER (10%):
  Only suppress for very small net changes
  More team-level alerts fire
  Best for: tag-disciplined orgs without routine redistribution
  
LOOSER (30%):
  Suppress for larger redistributions
  Fewer team-level alerts
  Best for: orgs with frequent normal redistribution
```

Most orgs leave at default. Tightening creates more team-level alerts; loosening less.

### When redistribution might mask a real issue

If a team's "shift" was actually two separate events (real spike on Team A, unrelated drop on Team B coincidentally), suppression might hide a real issue:

```
SCENARIO:
  Team A: legitimately spiked 500% (real issue)
  Team B: had a separate cost decrease unrelated to A
  Net change between A and B is small
  Suppression fires
  
  RESULT: real Team A issue is masked at team level
```

This is rare but possible. Mitigations exist:

```
MITIGATIONS (multiple safety nets):

1. ORG-LEVEL ANOMALY still fires
   The cost spike is real
   Even though net change is small (cost just moved)
   Resource-level cost is still 500% up
   
2. RESOURCE-LEVEL ANOMALIES on Team A's resources fire
   Individual resources show their cost spike
   Even if team-level is suppressed
   Operator drills into resources
   
3. Other dimensions catch it:
   Cloud-account: may catch
   Resource-group: may catch
   Investigation discovers the masking
```

So the Team A issue would surface via org-level or resource-level, even if team-level was suppressed.

### When to adjust suppression

```
KEEP DEFAULT (20%) when:
  Mid-size org (10-50 teams)
  Tag-discipline good
  Team-level alerts useful when they fire
  
TIGHTEN TO 10% when:
  Small org (<10 teams)
  Don't have routine redistribution
  Want every team-level alert visible
  
LOOSEN TO 30% when:
  Very large org (100+ teams)
  Frequent normal redistribution
  Team-level alerts mostly noise
  
DEPENDS ON YOUR TEAM'S TOLERANCE
  More alerts = more noise but less missing
  Fewer alerts = less noise but more missing
```

The threshold matches team tolerance.

### Audit and verification

```
AUDIT THE SUPPRESSION:
  Settings → Anomaly Detection → suppressed events log
  Shows: every event that was suppressed
  Reason: net change was X% < threshold Y%
  
PERIODIC REVIEW:
  Are any suppressions hiding real issues?
  Cross-reference with org-level + resource-level signals
  Adjust threshold if pattern emerges
```

The audit trail enables verification.

---

## 2. Demo

A team's investigation with suppression in action:

```
T+0       Daily anomaly run

T+1 min   Org-level: +5% (modest; below threshold; no alert)
          Team-level alerts: SUPPRESSED
          (3 teams shifted; net small; redistribution detected)
          
T+1 min   Resource-level: 1 anomaly on team=ml's "i-0gpu-train-7"
          (+500% deviation, was $5/day, now $30/day)
          
T+5 min   Team opens the resource anomaly
          Investigation:
            Yes, this resource started running today
            Was triggered by a routine training job
            Within normal pattern for team=ml
            
T+10 min  Conclusion:
            This is expected and unrelated to redistribution
            Action: no action needed (legitimate workload)
            
T+10 min  Note:
            The team-level "shifts" represent normal redistribution
            Across teams (some teams' workloads ran, others didn't)
            No real anomaly to investigate at team level

WITHOUT SUPPRESSION:
  3 teams would have gotten alerts
  Each would have investigated
  All would have concluded "no real issue"
  9 person-hours wasted on noise
  
WITH SUPPRESSION:
  1 team (ml) investigated 1 resource
  Real issue found (legitimate workload; no action)
  10 minutes spent on actual signal
```

Redistribution suppression worked — kept attention on the real signal.

---

## 3. Hands-on (5 min)

Check redistribution suppression:

```
□ STEP 1: Open anomaly feed
  Last 30 days team-level alerts: _____
  Suppressed events log: _____

□ STEP 2: Review suppressed events
  Were any patterns suspicious?
  Did any look like potential masking?
  
□ STEP 3: Cross-check with org-level
  Any org-level anomalies in suppressed periods?
  If yes: investigate via org-level (catches real issues)
  
□ STEP 4: Audit threshold
  Current: ___%
  Net change distribution in suppressed events: __________
  Adjustment needed: __________

□ STEP 5: Document decision
  Threshold: __________
  Rationale: __________
```

A 10-minute audit reveals whether suppression is tuned right.

---

## 4. Knowledge check

### Q1
Team A goes +400%, Team B goes -380%. Net change tiny. The system:

A. Fires both team-level alerts
B. Suppresses both team-level alerts. The cost shift is redistribution, not a real cost event. Org-level still fires if net change is large; resource-level still fires for specific resources.
C. Random
D. Fires Team A only

<details>
<summary>Show answer</summary>

**Correct: B.** Suppression prevents redistribution noise.
</details>

### Q2
A real Team A spike happens at the same time as an unrelated Team B drop. Suppression might mask. Mitigation:

A. Bug
B. Org-level anomaly and resource-level anomalies still fire. They catch the real signal even if team-level is suppressed. Multiple dimensions provide redundancy; suppression only targets team-level.
C. Random
D. Cannot mitigate

<details>
<summary>Show answer</summary>

**Correct: B.** Multiple dimensions provide redundancy.
</details>

### Q3
A team wants to tighten suppression to 10%. The result:

A. More noise
B. More team-level anomalies fire — even small redistributions trigger alerts. Best for teams that are tag-disciplined and don't have routine redistribution. Depends on team tolerance for alerts.
C. Random
D. Less noise

<details>
<summary>Show answer</summary>

**Correct: B.** Tighter = more alerts. Depends on team's tolerance.
</details>

---

## 5. Apply

Suppression configurable in Settings → Anomaly Detection. Default 20% net change.

For your team: review suppression decisions periodically; tune threshold to match team's tolerance.

---

## Module quiz

Complete M2.10 → 10-question module quiz unlocks the **Anomaly-Detector** chip.

---

## Related lessons

- [L1 — Five dimensions](L1_five_dimensions.md)
- [L2 — Detection methods](L2_detection_methods.md)
- [L3 — Severity bands](L3_severity_bands.md)
- [L4 — Root cause analysis](L4_root_cause.md)
- [T4.M4.5 — Anomaly response](../../T4_finops_mastery/M4.5_anomaly_response/00_README.md)

## Glossary terms touched

[Redistribution suppression](../../../reference/glossary/redistribution-suppression.md) · [Net change threshold](../../../reference/glossary/net-change-threshold.md) · [Team-level anomaly](../../../reference/glossary/team-level-anomaly.md) · [Dimensional redundancy](../../../reference/glossary/dimensional-redundancy.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.10.L5
