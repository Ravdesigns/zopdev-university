# Slack / Teams / Google Chat notifications

§ T1 · M1.6 · L3 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** notification channels (Slack, Teams, Google Chat, webhooks) **and route** different event types to different channels.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Get the right alerts to the right channel — and avoid alert fatigue." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M1.3 |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply) and Route (Apply) |

---

## 1. Concept

ZopNight notifications fire on schedule actions, override events, anomalies, and failures. Each notification can be routed to one or more channels. Channels are webhook-based — Slack, Microsoft Teams, Google Chat, or any URL that accepts a JSON POST.

### Setting up a channel

```
SETTINGS → Notification Channels → New Channel
─────────────────────────────────────────────────────────
Name:           [team-finops-slack]
Type:           [ Slack ▾ ]    (or Teams / GChat / Webhook)
Webhook URL:    [https://hooks.slack.com/services/T.../B.../...]
Test:           [Send test notification]

[Cancel]                                              [Save channel]
```

The webhook URL is provided by the customer's Slack / Teams / GChat workspace admin. ZopNight encrypts it at rest (same vault pattern as cloud credentials — see M1.1 L1).

### What notifications fire

```
EVENT                                             DEFAULT SEVERITY
─────────────────────────────────────────────────────────────────
Resource scheduled action succeeded (start/stop)   INFO
Resource scheduled action failed (after retries)   CRITICAL
Override applied                                    INFO
Override expired                                    INFO
Override cancelled                                  INFO
Auto-remediation applied                            INFO
Auto-remediation failed                             WARNING
Cost anomaly detected                                WARNING
Cost anomaly critical (>500%)                       CRITICAL
Budget threshold crossed                            WARNING
Schedule action retry exhausted                      CRITICAL
Discovery sync failed                                WARNING
Permission Denied (new gap detected)                 WARNING
```

The severity is configurable per event type (see [L4](L4_severity_routing.md)). The default is sensible for most teams.

### Routing rules

Each channel can subscribe to a subset of events. Common patterns:

```
CHANNEL                          SUBSCRIBES TO
─────────────────────────────────────────────────────────
#finops-alerts                   All CRITICAL + WARNING
#finops-info                     INFO only (low-noise channel)
#dev-platform                    Events affecting dev-platform group
#ops-oncall                      Production CRITICAL only
webhook:datadog                  All events (for centralized alerting)
```

A team can have many channels. Routing logic decides which events go to which channels:

```
ROUTING RULE FOR #finops-alerts
─────────────────────────────────────────────────────────
Event types:    All
Severity:       CRITICAL, WARNING
Scope:          All resources, all schedules
Exclude:        (none)
```

```
ROUTING RULE FOR #dev-platform
─────────────────────────────────────────────────────────
Event types:    All
Severity:       Any
Scope:          Resources in group "dev-platform-eu" or "dev-platform-aws"
Exclude:        (none)
```

```
ROUTING RULE FOR #ops-oncall
─────────────────────────────────────────────────────────
Event types:    Schedule action failed, Cost anomaly critical
Severity:       CRITICAL only
Scope:          Production resources (tag env=prod)
Exclude:        Override events (they go elsewhere)
```

Three different channels serving three different audiences. Each gets the right level of noise.

### Default channel + per-resource override

Most orgs set a **default channel** (e.g., #finops-alerts) that receives everything. Then they add per-resource or per-group overrides for specific workloads:

```
DEFAULT CHANNEL: #finops-alerts (everything)

OVERRIDES:
  Group dev-platform-eu      → also #dev-platform-eu
  Group prod-shared          → also #ops-oncall
  Resource db-prod-orders    → also #db-team-alerts
```

A single event can go to multiple channels. Slack gets the dispatch from #finops-alerts AND #ops-oncall when something CRITICAL hits prod-shared. The team chooses how much overlap to accept.

### What a notification looks like

```
SLACK MESSAGE EXAMPLE
─────────────────────────────────────────────────────────
🔴 [CRITICAL] Schedule action failed: dev-platform-eu

Resource:    dev-cluster-1 (eks)
Action:      Stop
Schedule:    business-hours-eu (firing at 20:00 ET)
Error:       InsufficientPermissions — missing eks:UpdateNodegroupConfig
Retries:     3 of 3 (exhausted)
Detected:    2 minutes ago

[View details →]   [View schedule →]   [Diagnose →]
```

The notification carries:

- Severity (color-coded — red for critical, yellow for warning, gray for info)
- Resource and group context
- Action attempted and outcome
- Error message (for failures)
- Retry status (for retries)
- Detected timestamp
- Action links for follow-up

The notification is actionable — the engineer can click "View details" to get to the resource without searching.

### Avoiding alert fatigue

Three principles:

**1. Separate INFO from CRITICAL/WARNING.** Don't put all notifications in one channel. INFO events (successful scheduled actions) are useful for ops awareness but noisy if mixed with real alerts. Two channels: one for INFO, one for actionable events.

**2. Scope tightly.** A team's channel should not receive notifications about other teams' resources. Use group-based routing.

**3. Tune severity.** If your team finds a specific event type is firing too noisily, downgrade the severity in the org settings (see [L4](L4_severity_routing.md)).

The default routing is conservative — most teams need to tune it down, not up, as their channels mature.

### What ZopNight does NOT notify

A few deliberate non-notifications:

- **Discovery completions** (too frequent — every 6 hours per account)
- **Cost trends** (these go on the dashboard, not in notifications)
- **Resource creation/deletion** (these are CMDB-style events; subscribe via audit log if needed)
- **Audit log activity** (the audit log is the canonical record; notifications would be too noisy)

A custom webhook can pull these if the team has a use case.

---

## 2. Demo

A team's notification setup, day 1 through month 1:

```
DAY 1 (initial setup):
  Channel #1: #finops-alerts (Slack)
  Default routing: everything
  Test notification fires. Engineer confirms it lands.

WEEK 1:
  Team gets ~30 notifications per day. Most are scheduled-action INFO.
  Alert fatigue setting in. People start muting the channel.

WEEK 2 (tuning):
  Setup change:
    Channel #1: #finops-alerts (CRITICAL + WARNING only) — actionable
    Channel #2: #finops-info (INFO only) — opt-in awareness
    
  Notification count in #finops-alerts: drops to ~3 per day.

WEEK 3 (team-specific):
  Setup change:
    Add Channel #3: #dev-platform (events on dev-platform-eu and dev-platform-aws)
    Add Channel #4: #ops-oncall (production CRITICAL only)
    
  Dev-platform team owns their channel. Ops-oncall is dedicated to prod-critical.

MONTH 1:
  Three actionable channels. Each gets ~3-5 notifications per day.
  Engineers actually read the channels.
  Alert fatigue resolved.
```

The lesson: default routing is a starting point. The first month of operation tunes it for the org's actual signal/noise tolerance.

(Asset: `assets/diagrams/M1.6_L3_routing_evolution.svg`.)

---

## 3. Hands-on (6 min)

If you have admin access:

```
1. Set up a notification channel (use a sandbox Slack channel, not your
   real ops channels).
2. Add the webhook URL.
3. Test the notification.
4. Trigger a scheduled action on a sandbox resource (e.g., manually
   stop one — Manual triggers also fire INFO notifications).
5. Confirm the notification lands in the test channel.
6. Add a routing rule to scope the channel to a specific group or
   severity level.
7. Test again — only matching events should fire.
```

---

## 4. Knowledge check

### Q1
A team's #finops-alerts channel is receiving ~30 notifications per day, mostly successful scheduled actions. The team has started muting it. The right fix:

A. Disable notifications entirely
B. Split into two channels: #finops-alerts (CRITICAL + WARNING only) and #finops-info (INFO only). Alert fatigue is from mixing actionable and informational events. Separation gives each its own signal/noise tolerance.
C. Reduce the schedule firing frequency
D. Disable the schedule

<details>
<summary>Show answer</summary>

**Correct: B.** Separation by severity is the canonical fix for alert fatigue. INFO is useful but should not co-channel with CRITICAL.
</details>

### Q2
A team wants production-CRITICAL events to go to BOTH #finops-alerts (org-wide visibility) AND #ops-oncall (paging). The setup:

A. Pick one channel
B. Both channels subscribe to "CRITICAL events on production resources." A single event can dispatch to multiple matching channels. Use group-based routing on both.
C. Forward from one channel to the other
D. Set up a relay channel

<details>
<summary>Show answer</summary>

**Correct: B.** Multi-channel dispatch is supported. Each channel's routing rule independently decides whether to receive an event.
</details>

### Q3
A team's channel is subscribed to "Discovery completion" events. After two weeks they realize this fires every 6 hours per account, generating 240+ notifications per day. The right action:

A. The team should tolerate it
B. Discovery completion notifications are not exposed by default — the team's webhook is likely subscribed to audit-log events instead. Either: unsubscribe from those events, or scope to discovery FAILURES only (which fire rarely and are actionable).
C. Reduce discovery frequency
D. Switch to a different notification tool

<details>
<summary>Show answer</summary>

**Correct: B.** The default is to NOT notify on discovery completion (too noisy). If the team is seeing them, the subscription is too broad. Tune the routing rule.
</details>

---

## 5. Apply

Notifications are configured in:

- **[Settings → Notification Channels](https://app.zopnight.com/settings/notifications)** — manage channels, webhooks
- **[Settings → Notification Routing](https://app.zopnight.com/settings/notifications/routing)** — define routing rules
- **[Schedule detail](https://app.zopnight.com/schedules)** → per-schedule channel override
- **[Group detail](https://app.zopnight.com/resource-groups)** → per-group channel override

For severity and routing patterns, continue to L4.

---

## Related lessons

- [L4 — Notification severity and routing](L4_severity_routing.md) *(next)*
- [L5 — Where audit logs live](L5_audit_logs.md)

## Glossary terms touched

[Notification channel](../../../reference/glossary/notification-channel.md) · [Webhook](../../../reference/glossary/webhook.md) · [Routing rule](../../../reference/glossary/routing-rule.md) · [Alert fatigue](../../../reference/glossary/alert-fatigue.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.6.L3
