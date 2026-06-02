# Notification severity and routing

§ T1 · M1.6 · L4 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **assign** the right severity to each event class **and design** a routing strategy that delivers the right signal without alert fatigue.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop my Slack from being unreadable." |
| **Personas** | Platform Engineer · FinOps Analyst · Security/Compliance |
| **Prerequisites** | [L3](L3_notifications.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Assign (Apply) and Design (Create) |

---

## 1. Concept

Severity is the lever for routing notifications correctly. Three levels — INFO, WARNING, CRITICAL — drive what channel an event goes to, whether it pages someone, and how often the team should expect to see it.

### The three severity levels

```
LEVEL       MEANING                                         EXAMPLES
─────────────────────────────────────────────────────────────────────────
INFO        Something happened. No action needed.            Schedule fired
                                                              Override applied
                                                              Override expired
                                                              Auto-rem succeeded
                                                              Resource discovered
─────────────────────────────────────────────────────────────────────────
WARNING     Something happened that may need attention      Anomaly detected
            within hours. Investigate.                       Budget threshold crossed
                                                              Permission Denied
                                                              Auto-rem failed
                                                              Discovery degraded
─────────────────────────────────────────────────────────────────────────
CRITICAL    Action needed now. Service impact, audit         Schedule action failed
            evidence, or significant cost event.             after 3 retries
                                                              Cost anomaly emergency
                                                                (>500% deviation)
                                                              Cost > 2× monthly budget
                                                              Connection / cred fail
```

The severity is configurable per event class in the org settings. Defaults are conservative; tune to your org's tolerance.

### Why severity matters for routing

Different audiences tolerate different signal/noise ratios:

```
AUDIENCE                    TOLERATES        OPTIMAL CADENCE
────────────────────────────────────────────────────────────
Engineer's own team          INFO frequency  Many per day, fine
On-call rotation             CRITICAL only   Few per week, ideally
Org-wide #finops-alerts      WARNING+        Few per day
Audit / compliance channel    CRITICAL only   Few per week
Personal DMs (paging)         CRITICAL only   Rare, paging-worthy
```

A routing strategy aligns severity to audience. Engineers see their team's INFO; on-call sees only CRITICAL; auditors see CRITICAL with optional WARNING for context.

### Designing a routing strategy

For a typical 50-engineer SaaS org:

```
CHANNEL                     SUBSCRIBES TO                         FREQUENCY
─────────────────────────────────────────────────────────────────────────
#finops-info                  INFO only, all scopes                100+/day
                              (engineers opt-in for awareness)
#finops-alerts                WARNING + CRITICAL, all scopes       5-15/day
                              (everyone in finops/platform)
#dev-platform                  Events on dev-platform group         varies
                              (dev-platform team only)
#staging-services              Events on staging-services group    varies
                              (services team only)
#prod-shared                  Events on prod-shared group         rare
                              (production-aware engineers)
#ops-oncall                   CRITICAL only, production scope     1-2/week
                              (paging-worthy)
#compliance                   CRITICAL on production               <5/month
                              + auth/audit events
                              (compliance / security)
```

Each channel has a clear audience and tolerance. Notifications aren't duplicated across channels unless multiple audiences need awareness.

### The severity-tune-down move

Most orgs need to tune severity DOWN, not up, as they mature.

```
DEFAULT                                AFTER 30 DAYS OF OPERATION
─────────────────────────────────────────────────────────────────
Cost anomaly:        WARNING            Cost anomaly:        INFO (visible
                                                              but don't page)
Anomaly emergency:   CRITICAL           Anomaly emergency:   CRITICAL (keep)
Budget threshold:    WARNING            Budget threshold:    WARNING (keep)
Schedule action      
  failed after        CRITICAL          Schedule action     CRITICAL (keep)
  retries                                 failed after retries
Discovery degraded:  WARNING            Discovery degraded: WARNING (keep)
Auto-rem failed:     WARNING            Auto-rem failed:    INFO (don't page,
                                                              just log)
```

Severity tuning is iterative. A team that sees too many WARNINGs and starts ignoring them is paying alert fatigue cost. The fix is to downgrade events that are informational, leaving only the genuinely actionable ones as WARNING+.

### When to escalate severity

The opposite move — upgrade severity — is rarer but legitimate:

```
SCENARIO: A team's production has cost-anomaly emergencies (>500% deviation)
two-three times per quarter. The current routing has them as CRITICAL going
to #ops-oncall. The on-call engineer is sometimes asleep.

UPGRADE: Add a "Cost anomaly emergency on production" routing rule that also
fires a PagerDuty notification (via webhook), waking up the on-call engineer.

The event severity stays CRITICAL. The routing changes (additional destination
on top of Slack).
```

Severity itself is the event's classification. Routing is what each channel does with each severity. The two are independent.

### Per-channel filtering

Each channel can filter by severity, scope, event type, and time-of-day:

```
ROUTING RULE FOR #ops-oncall
─────────────────────────────────────────────────────────
Event types:    Schedule action failed, Cost anomaly critical
Severity:       CRITICAL only
Scope:          Production resources (tag env=prod) OR group prod-*
Time-of-day:    Any (24/7)
Format:         Compact (one-line summary, single emoji)
```

```
ROUTING RULE FOR #compliance
─────────────────────────────────────────────────────────
Event types:    Auth events, Permission changes, Audit-relevant
Severity:       CRITICAL only
Scope:          All (org-wide)
Time-of-day:    Any
Format:         Verbose (full event detail for audit evidence)
```

Two channels, two different filtering strategies, each serves its audience.

### The audit-evidence routing

For compliance use cases, a specific routing pattern delivers events to a SIEM or audit channel without depending on humans to read them:

```
ROUTING RULE FOR webhook:siem
─────────────────────────────────────────────────────────
Event types:    All
Severity:       Any
Scope:          All
Time-of-day:    Any
Format:         JSON (structured for ingestion)

DESTINATION: https://api.siem-tool.com/zopnight/events
```

The webhook receives every event, structured. SIEM ingests, correlates, alerts on its own rules. The notification channel is the data plane; the SIEM is the alerting plane. This decoupling is the right pattern for compliance-driven orgs.

---

## 2. Demo

A team's day-30 retro on notification routing:

```
T+0       FinOps lead opens Settings → Notification Routing.

T+30 sec  Reviews: 5 active channels, 18 routing rules.

T+1 min   Identifies issues:
            - #finops-alerts is at 47 notifications/day, mostly INFO
            - #ops-oncall got paged for a non-prod anomaly (severity wrong)
            - #compliance is missing some audit-relevant events

T+5 min   Adjusts:
            #finops-alerts: filter to WARNING+ only
            Move INFO events to #finops-info (new channel)
            Anomaly severity: downgrade non-prod anomalies to INFO
            Add routing for auth events to #compliance

T+10 min  Saves. Tests with a manual trigger to verify routing.

T+30 days After 30 more days:
            #finops-alerts: 5-8 actionable notifications per day
            Engineers actually read it
            #ops-oncall: 1-2 per week, all genuine paging
            #compliance: ~3 per week, all audit-relevant
            Alert fatigue: resolved
```

Ten minutes of tuning, 30 days of better-than-default routing. The cost of the tuning is small; the cost of NOT tuning is alert fatigue and missed signal.

(Asset: `assets/diagrams/M1.6_L4_severity_tuning.svg`.)

---

## 3. Hands-on (6 min)

For your existing notification channels (or sandbox):

```
1. Open Settings → Notification Routing.
2. Count current channels and rules.
3. For each channel, note the per-day notification count (Settings has
   the analytics, or check the channel directly).
4. Identify the noisiest channel.
5. Ask: is everything in this channel actually actionable?
   - If yes, leave it
   - If no, identify which event class is noisy
6. For the noisy event class:
   - Downgrade severity in the org settings (if too high)
   - OR move it to a different channel (if it's informational but
     valuable to track)
7. Save and observe over the next week.
```

---

## 4. Knowledge check

### Q1
A team's #finops-alerts channel receives ~50 notifications per day, mostly successful scheduled actions (INFO). The team has stopped reading it. The right fix:

A. Disable notifications
B. Downgrade routing — #finops-alerts subscribes to WARNING+ only. Move INFO events to a separate #finops-info channel (opt-in). The actionable channel gets 5-15/day; the informational channel gets the rest.
C. Increase the channel
D. Set up an automation to summarize

<details>
<summary>Show answer</summary>

**Correct: B.** Severity-based routing solves alert fatigue. INFO does not belong with WARNING/CRITICAL in an actionable channel.
</details>

### Q2
A non-prod cost anomaly fires as CRITICAL and pages the on-call engineer at 3 AM. The fix is:

A. Disable cost anomaly notifications
B. Downgrade non-prod cost anomalies to WARNING in org settings. Route WARNING to #finops-alerts (visible, not paging). Reserve CRITICAL for production anomalies that genuinely warrant a 3 AM page.
C. Page during business hours only
D. Tell the engineer to mute

<details>
<summary>Show answer</summary>

**Correct: B.** Severity should reflect business impact. Non-prod anomalies are visible but rarely page-worthy.
</details>

### Q3
A compliance team needs every CRITICAL event sent to their SIEM for correlation. The right pattern:

A. Send to compliance team's Slack channel
B. Add a webhook channel pointing at the SIEM's ingest endpoint, subscribed to CRITICAL across all scopes. The SIEM ingests structured data and applies its own correlation rules. This decouples the data plane (ZopNight notifications) from the alerting plane (SIEM).
C. CC the compliance team on every email
D. Export to CSV manually

<details>
<summary>Show answer</summary>

**Correct: B.** Webhook to SIEM is the right pattern for compliance-driven alerting. Decoupled, scalable, and respects the SIEM as the canonical alerting tool.
</details>

---

## 5. Apply

Severity and routing:

- **[Settings → Event Severity](https://app.zopnight.com/settings/notifications)** — assign severity per event class
- **[Settings → Routing Rules](https://app.zopnight.com/settings/notifications/routing)** — define per-channel filters
- **[Notification analytics](https://app.zopnight.com/settings/notifications/stats)** — per-channel volume

For the audit-log foundation that feeds the SIEM pattern, continue to L5.

---

## Related lessons

- [L5 — Where audit logs live](L5_audit_logs.md) *(next — closes the track)*
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Severity](../../../reference/glossary/severity.md) · [Routing rule](../../../reference/glossary/routing-rule.md) · [Alert fatigue](../../../reference/glossary/alert-fatigue.md) · [SIEM](../../../reference/glossary/siem.md) · [Time-of-day filter](../../../reference/glossary/time-of-day-filter.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.6.L4
