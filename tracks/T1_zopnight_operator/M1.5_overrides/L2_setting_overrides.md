# Force-on, force-off, expiry, reason

§ T1 · M1.5 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** force-on and force-off overrides with appropriate expiry and reason fields **and verify** the override is active.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Set an override correctly the first time so I don't have to remember to clean it up." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1](L1_when_to_override.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply) and Verify (Evaluate) |

---

## 1. Concept

An override has four fields. Three are required: type, reason, expiry. The fourth (scope) is implicit from where the override is set (resource or group). Each field shapes the override's behavior in a specific way.

### Field 1 — Type

Two options:

- **Force-on (`override_type=1`)** — the resource (or group) stays ON during the window. Schedule stop crons are ignored.
- **Force-off (`override_type=0`)** — the resource (or group) stays OFF during the window. Schedule start crons are ignored.

There is no "force into specific state" with more granularity. ON / OFF only. This matches the scheduler's vocabulary; complex state transitions (e.g., "scale to X replicas") use the autoscaler features, not overrides.

### Field 2 — Reason

Free-form text. Required. The reason is the operational documentation:

```
GOOD REASONS                              BAD REASONS
─────────────────────────────────────────────────────────
"Acme demo Sat 2pm, exp Mon 8am"          "test"
"Incident #2026-05-19-payments,           "weekend"
 prevent schedule firing"
"Migration to new instance types,         "asked by sarah"
 expected 6h duration"                     ─── (no context)
"DR drill, force-on all dev for           
 24h window"
```

The reason becomes the answer to "why is this on?" when a future engineer is investigating. Be specific.

ZopNight enforces a minimum length (>10 characters) on the reason field. "test" or "x" is rejected. This is a small friction but a useful one — it forces the team to write a real reason.

### Field 3 — Expiry

Required. The override is removed automatically at the expiry time. No exceptions.

```
EXPIRY OPTIONS
  Exact datetime:       2026-05-26 08:00 (timezone-aware)
  Relative duration:    +24h, +48h, +7d (computed from now)
  End-of-week:          Monday 00:00 (common shorthand)
```

The expiry is stored as an absolute UTC timestamp. Timezone conversions happen at display time only.

If the expiry exceeds the org-wide **Max Override Duration** (covered in [L4](L4_max_duration.md)), the create is rejected. A team trying to set a 90-day override hits the max-duration cap; they must either reduce the duration or get an Admin to extend the org policy.

### Field 4 — Scope (implicit)

- **Per-resource override** is set from the Resource detail page → applies to that one resource only
- **Per-group override** is set from the Group detail page → applies to every member of the group

Group overrides are more common for the demo / maintenance / incident scenarios. Per-resource overrides are for highly-specific situations (one VM needs to stay on for a specific test).

### What the override does internally

```
WHEN A CRON FIRES on a resource with an active override:
  - The scheduler checks for any active overrides on the resource (or its group)
  - If force-on and the cron is a stop → cron is SKIPPED
  - If force-off and the cron is a start → cron is SKIPPED
  - If force-on and the cron is a start → cron fires (already on, no-op)
  - If force-off and the cron is a stop → cron fires (already off, no-op)
  - The skip is logged in the action log with reason "override active"

AT EXPIRY:
  - The override is removed
  - Subsequent cron firings act normally
  - The resource's state at expiry is its actual state (NO automatic transition)
```

The override does NOT actively transition the resource. It only prevents the schedule from transitioning. If a force-off override is removed at expiry and the schedule's next start cron is hours away, the resource stays off until then.

### Notifications

Setting an override fires a notification (per the resource's notification routing — see [M1.6 L3](../M1.6_history_notifications_audit/L3_notifications.md)):

```
Slack notification:
─────────────────────────────────────────────────────────
🔔 Override applied
   Resource:  staging-eu-cluster
   Type:      Force-on
   Reason:    "Acme Corp demo Sat 2pm, requested by sarah@sales"
   Expires:   2026-05-26 08:00 Europe/London
   Set by:    engineer@zopcloud.com
─────────────────────────────────────────────────────────
```

The notification lets the team see overrides happen in real time, even when they're not the one who set them. Reduces "who set this?" confusion.

A second notification fires when the override expires:

```
🔔 Override expired
   Resource:  staging-eu-cluster
   Originally set by: engineer@zopcloud.com
   Reason:    "Acme Corp demo Sat 2pm"
   Schedule now resumes normal operation
```

The expiry notification confirms the override cleanup happened on time.

### Configuration flow

```
Resource (or Group) detail page → Override button
─────────────────────────────────────────────────────────
SET OVERRIDE

  Type:       [ Force-on  ▾ ]                  
  Reason:     [                                       ]  (required, min 10 chars)
  Expiry:     [ Exact ▾ ] [ 2026-05-26 08:00 ]
              [ Relative ▾ ] [ +24h ]
  Scope:      ● This resource only
              ○ Apply to the resource group ('staging-eu')

[Cancel]                                              [Apply override]
```

Three required fields, one optional scope expander. The form is short on purpose — overrides should be set quickly, not deliberated over.

---

## 2. Demo

A team setting a maintenance override:

```
INTENT: Maintenance on dev-cluster-1, expected 6 hours, want schedule
         not to interfere.

T+0       Open dev-cluster-1 → Override button
T+10 sec  Fill in:
            Type:    Force-off
            Reason:  "Planned migration to graviton node types,
                      expected 6h duration. Tracked in ticket DEV-4521."
            Expiry:  Relative +8h (8 hours from now, buffer of 2h)
            Scope:   This resource only

T+20 sec  Apply override.

T+25 sec  Slack notification fires.

T+25 sec  Resource is force-off (was already stopped manually before maintenance).
          Any scheduled start in the next 8 hours is skipped.

T+6 hrs   Maintenance complete. Resource is restarted manually by the team.
          Override is still active — the resource is now running despite the
          force-off override. (The override prevents the SCHEDULE from acting,
          not from manual start.)

T+8 hrs   Override expires automatically.
T+8 hrs   Expiry notification fires.
T+8 hrs   Schedule resumes normal operation.
```

The override prevented schedule interference during maintenance without preventing manual control. The team kept agency over the resource.

(Asset: `assets/diagrams/M1.5_L2_maintenance_override.svg`.)

---

## 3. Hands-on (6 min)

In a sandbox:

```
1. Pick a sandbox resource that has a schedule attached.
2. Apply a force-off override:
   - Reason: "Test override — exploring the UI"
   - Expiry: +1h (one hour from now)
3. Save.
4. Verify the override appears:
   - On the resource detail page
   - On the schedule's 24-hour grid (visible as a separate color band)
   - In the Overrides page list
5. Verify the Slack notification (if configured) fires.
6. Wait or trigger a cron firing during the override window — confirm
   the cron is skipped (the resource state doesn't change).
7. Wait for expiry (or cancel early via L3 mechanics).
8. Confirm the override cleans up.
```

The hands-on takes longer than the 6 minutes if you wait for expiry. The mechanics are quick; the verification is what takes the clock.

---

## 4. Knowledge check

### Q1
An override expires while a resource is in the "wrong" state for what the schedule would normally enforce. What happens?

A. The schedule immediately transitions the resource
B. The resource stays in its current state until the schedule's next cron fires for that resource. Override expiry only removes the override; it does not actively transition the resource.
C. An error fires
D. The override is recreated

<details>
<summary>Show answer</summary>

**Correct: B.** Override expiry is metadata. The next cron firing on the resource is what restores normal scheduled behavior.
</details>

### Q2
A team needs to set an override that expires in 90 days. The Max Override Duration is 7 days. What happens?

A. The override is created with 90-day expiry
B. The create is rejected. The team can either reduce the duration to <=7 days, get an Admin to extend the org policy, or use a schedule edit instead (for changes longer than the max).
C. The override expires after 7 days
D. ZopNight warns but accepts

<details>
<summary>Show answer</summary>

**Correct: B.** Max Override Duration is a guardrail. The intent: anything longer than the cap is probably a schedule edit, not an override.
</details>

### Q3
A force-on override is active on a resource. The user manually clicks Stop. What happens?

A. The stop is rejected (override is forcing on)
B. The stop succeeds — the override prevents the SCHEDULE from acting, not the user from acting manually. After the stop, the resource is off, but the override prevents the schedule from re-starting it during the override window.
C. The override is automatically removed
D. An error fires

<details>
<summary>Show answer</summary>

**Correct: B.** Overrides scope to schedule behavior, not to manual actions. The user keeps agency.
</details>

---

## 5. Apply

Override configuration:

- **[Resource detail](https://app.zopnight.com/resources)** → Override (per-resource)
- **[Group detail](https://app.zopnight.com/resource-groups)** → Override (per-group)
- **[Overrides page](https://app.zopnight.com/overrides)** → see all active overrides

For managing existing overrides, continue to L3.

---

## Related lessons

- [L3 — Managing active overrides](L3_managing_overrides.md) *(next)*
- [L4 — Max override duration](L4_max_duration.md)
- [M1.6 L3 — Notifications](../M1.6_history_notifications_audit/L3_notifications.md)

## Glossary terms touched

[Force-on](../../../reference/glossary/force-on.md) · [Force-off](../../../reference/glossary/force-off.md) · [Reason field](../../../reference/glossary/reason-field.md) · [Override expiry](../../../reference/glossary/override-expiry.md) · [Override scope](../../../reference/glossary/override-scope.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.5.L2
