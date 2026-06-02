# M1.6 — History, notifications, audit

§ T1 · M1.6 · Operator tier · 5 lessons · ~50 min

---

## Module outcome

Read the state-history timeline for any resource. Recognize what triggered each state change. Configure Slack / Teams / Google Chat notifications with severity routing. Query the audit log for compliance and debugging.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [The state-history timeline](L1_state_history.md) | 10 min | Resource state transitions · trigger sources · 30-day window |
| L2 | [Reading the trigger column](L2_reading_triggers.md) | 9 min | Schedule · manual · override · auto-remediation · drift |
| L3 | [Slack / Teams / Google Chat notifications](L3_notifications.md) | 10 min | Webhook setup · channel routing · per-resource override |
| L4 | [Notification severity and routing](L4_severity_routing.md) | 10 min | CRITICAL / WARNING / INFO · default + per-team routing |
| L5 | [Where audit logs live and how to query them](L5_audit_logs.md) | 11 min | Request + response capture · filter · export · compliance evidence |

**Total: 5 lessons, ~50 min**

---

## Module diagram

A single resource's 30-day state-history timeline, with each transition annotated by trigger source (schedule, manual, override) and color-coded by who/what initiated the change.

(Asset: `assets/diagrams/M1.6_state_timeline.svg`.)

---

## Module knowledge check

10 questions. Earn the **History-Reader** chip on pass and complete Track 1.

---

## What's next

After this module, take the **Operator certification exam** (free, 20 questions, mixed T0 + T1, ~30 min). Or continue to [Track 2 — ZopNight Engineer](../../T2_zopnight_engineer/00_README.md) for recommendations, autoscaling, K8s depth.
