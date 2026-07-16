# Managing active overrides

§ T1 · M1.5 · L3 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **list** active overrides, **cancel** one early when the situation resolves, **and interpret** relative expiry displays correctly.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Quickly find and clean up active overrides without breaking anything." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1](L1_when_to_override.md), [L2](L2_setting_overrides.md) |
| **Time** | 10 minutes |
| **Bloom verb** | List (Remember), Cancel (Apply), Interpret (Understand) |

---

## 1. Concept

Active overrides are listed on the Overrides page. The page shows what overrides exist, who set them, when they expire, and offers the cancel-early action.

### The Overrides page

```
OVERRIDES — Active                                       12 total
─────────────────────────────────────────────────────────────────
TARGET                  TYPE       REASON                   EXPIRES
─────────────────────────────────────────────────────────────────
staging-eu-cluster      Force-on   Acme Corp demo Sat 2pm   in 2 days
                                                              (Mon 8am)
dev-platform-aws        Force-off  Planned cluster migration in 4 hours
                                   (DEV-4521)
prod-payment-shared     Force-on   Incident #2026-05-19,    in 11 hours
                                   prevent schedule fires
ml-experiments          Force-off  DR drill, all-team       in 21 hours
                                   coordinated
─────────────────────────────────────────────────────────────────
```

Each row shows:

- **Target** — the resource or group the override applies to
- **Type** — Force-on or Force-off
- **Reason** — the documented reason (full text)
- **Expires** — relative time display ("in 2 days," "in 11 hours")

Click any row to expand the detail panel.

### Relative time display

The expiry column shows relative time, not absolute timestamps:

```
EXPIRY                              DISPLAY
─────────────────────────────────────────────────────
1 hour from now                     "in 1 hour"
6 hours from now                    "in 6 hours"
23 hours from now                   "in 23 hours"
2 days from now                     "in 2 days"
30 minutes ago (already expired)    "expired 30m ago"
2 days past expiry (already gone)    "expired 2 days ago"
                                     [shown in the Expired tab,
                                      not Active]
```

Relative time is the right default because the operational question is "how long do I have?" not "what is the exact timestamp?" Hover the cell to see the exact timestamp if needed.

### Filtering and sorting

The Overrides page supports filtering and sorting:

```
FILTERS                              SORT BY
─────────────────────────────────────────────────────
Type (Force-on / Force-off)           Expires soonest (default)
Set by (user)                         Expires latest
Target type (resource / group)        Set most recently
Cloud account                         Reason (alphabetical)
Tags
Active vs Expired (tab)
```

A common workflow: filter to "Set by me" + sort by "Expires soonest" → see overrides I personally need to follow up on, ordered by urgency.

### Cancel an override early

When the situation that motivated an override is resolved before expiry, cancel:

```
1. Open the Overrides page (or the resource / group detail).
2. Find the override.
3. Click "Cancel override."
4. Confirmation modal:
     "Cancel the override on staging-eu-cluster?
      Type: Force-on
      Reason: 'Acme Corp demo Sat 2pm...'
      
      Cancelling will:
        - Remove the override immediately
        - Schedule resumes normal operation
        - Send a 'Override cancelled' notification"
5. Confirm.
6. Override removed. Schedule resumes.
```

Cancelling sends a notification (analogous to set/expire notifications):

```
🔔 Override cancelled
   Resource:  staging-eu-cluster
   Originally set by:  engineer@zopcloud.com
   Cancelled by:        engineer2@zopcloud.com
   Reason:              "Demo finished early, no longer needed"
                        (cancellation reason, optional)
```

The cancellation reason is optional but useful for the same documentation reasons as the original reason.

### Why cancel early matters

If a force-on override is left running until expiry but the underlying need ended early, the resources stay on for the unneeded hours — burning cost the team thought they had saved. The cancel-early pattern recovers those hours.

```
SCENARIO:
  Force-on override set for 72 hours for a demo.
  Demo ends after 18 hours.
  
WITHOUT CANCEL:
  Override expires at 72 hours. Resources stay on for 54 unneeded hours.
  $1,200 in unnecessary cost.

WITH CANCEL:
  Override cancelled at 19 hours. Schedule's next stop cron fires shortly after.
  Resources stop. $1,200 saved.
```

The team builds the habit: when the situation resolves, cancel the override. Don't wait for expiry.

### Expired overrides — the archive

The Overrides page has an "Expired" tab showing historical overrides:

```
EXPIRED OVERRIDES (last 30 days)
─────────────────────────────────────────────────────────
TARGET                  TYPE       REASON               EXPIRED
─────────────────────────────────────────────────────────
old-demo                Force-on   Demo for Beta Corp   2 days ago
maint-window-march      Force-off  Cluster migration    8 days ago
incident-may-12         Force-on   Incident 2026-05-12  9 days ago
─────────────────────────────────────────────────────────
```

The archive is useful for:

- **Audit:** "How many demo overrides did we do last quarter?"
- **Pattern detection:** "We're applying force-off for migrations every Tuesday. Should that be a scheduled maintenance window instead?"
- **Cost reconciliation:** "What hours did our schedules NOT cover because of overrides last month?"

Expired overrides are retained for 90 days by default, then purged. Audit logs preserve override history indefinitely (see [T3.M3.3](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)).

### What you cannot do

Three things deliberately not exposed:

1. **Extend an override.** To extend, cancel the current override and create a new one with the new expiry. This is intentional — extending past the original expiry should be a deliberate, re-documented decision.
2. **Modify the reason after creation.** The reason is the historical record. To "update" the reason, cancel and recreate.
3. **Delete an override permanently.** Cancel is the only way to end an active override; it moves the override to the Expired archive, not delete.

These restrictions keep the override history honest.

---

## 2. Demo

A typical Friday workflow on the Overrides page:

```
T+0       Engineer opens Overrides page on Friday afternoon.
T+5 sec   12 active overrides visible. Filter "Set by me" → 4 overrides.

T+10 sec  Review each:
            Override 1: demo-weekend, expires Monday 8am. Still needed.
            Override 2: maint-window from yesterday, expired but still listed?
                       (Wait — already in the Expired tab. Filter mistake.)
            Override 3: incident-response, originally 24h, incident resolved.
            Override 4: dr-drill-prep, scheduled for next week, expires Monday.

T+30 sec  Engineer clicks "Cancel override" on #3 (incident resolved).
T+45 sec  Cancellation reason: "Incident resolved, schedule can resume."
T+50 sec  Confirm. Override #3 cancelled.

T+1 min   Engineer closes the page, confident the overrides reflect reality.
```

The pattern: review weekly, cancel anything no longer needed. Five minutes per week, much better than discovering forgotten overrides during an audit.

(Asset: `assets/diagrams/M1.5_L3_friday_review.svg`.)

---

## 3. Hands-on (6 min)

For your sandbox (with overrides from L2):

```
1. Open the Overrides page.
2. Note the active count.
3. Click into one override → detail panel.
4. Verify all fields are visible (target, type, reason, expiry).
5. Hover the relative-time cell — verify the absolute timestamp tooltip.
6. Cancel one override:
   - Click Cancel
   - Add a cancellation reason ("Test cancel from M1.5 L3 hands-on")
   - Confirm
7. Verify the override moves to the Expired tab.
8. Verify the resource's schedule is no longer suspended (the resource
   will follow the schedule's next cron firing).
```

---

## 4. Knowledge check

### Q1
A force-on override was set for a 72-hour demo. The demo ended after 18 hours. The most cost-aware action is:

A. Wait for expiry
B. Cancel the override immediately. This frees the schedule to fire its next stop cron and recovers the avoidable hours. Without cancel, the resources stay on for 54 unneeded hours.
C. Modify the expiry to a shorter value
D. Apply a new override

<details>
<summary>Show answer</summary>

**Correct: B.** Cancel early. Modifying expiry is not exposed (intentionally), so the team uses cancel. The cancellation reason documents the situation for audit purposes.
</details>

### Q2
A team needs to "extend" an override past its original expiry. The right approach is:

A. Click Extend
B. Cancel the current override (with a documented reason). Create a new override with the new expiry. This forces a re-documentation step that an Extend button would not.
C. Modify the expiry
D. Disable the schedule instead

<details>
<summary>Show answer</summary>

**Correct: B.** Extend is not exposed. The cancel-and-recreate pattern preserves audit-log clarity ("override #1 cancelled, override #2 created") over a silent extend.
</details>

### Q3
The Expired tab shows overrides retained for 90 days. For older history:

A. The data is gone
B. The Audit Log preserves override events (set, cancel, expire) indefinitely. Use the audit log for historical analysis older than 90 days.
C. AWS holds the data
D. Cannot be queried

<details>
<summary>Show answer</summary>

**Correct: B.** The Expired tab is a convenience archive; the Audit Log is the permanent record. See T3.M3.3.
</details>

---

## 5. Apply

Override management:

- **[Overrides page](https://app.zopnight.com/overrides)** — active list, expired archive, filter, cancel
- **[Resource detail](https://app.zopnight.com/resources)** → override details inline
- **[Group detail](https://app.zopnight.com/resource-groups)** → override details inline
- **[Audit Log](https://app.zopnight.com/audit-logs)** — full history of override events

For the per-resource guardrail (Max Override Duration), continue to L4.

---

## Related lessons

- [L4 — Max override duration](L4_max_duration.md) *(next)*
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Cancel override](../../../reference/glossary/cancel-override.md) · [Relative time display](../../../reference/glossary/relative-time-display.md) · [Expired override](../../../reference/glossary/expired-override.md) · [Override archive](../../../reference/glossary/override-archive.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.5.L3
