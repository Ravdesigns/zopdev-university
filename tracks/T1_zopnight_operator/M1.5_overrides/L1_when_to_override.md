# When you need an override

§ T1 · M1.5 · L1 of 4 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** overrides from manual actions and schedule edits **and identify** the three scenarios where override is the right tool.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Keep dev running this weekend without breaking the schedule." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M1.3 + M1.4 |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze) and Identify (Remember) |

---

## 1. Concept

A team running a healthy schedule will, sooner or later, need to temporarily suspend the schedule for some specific case. ZopNight offers three tools for this — each is the right answer in a different scenario:

```
TOOL              WHEN                                  PERSISTENCE
─────────────────────────────────────────────────────────────────────
Manual action     One-shot start or stop, right now    Until next cron fires
Override          Suspend or force state for a window  Until expiry or cancel
Schedule edit     Permanent change to the cadence       Until next edit
```

**Overrides** are for time-bounded exceptions. They suspend or force a resource's state for a defined window with an explicit expiry. After the expiry, the schedule resumes normal operation.

### The three override scenarios

**Scenario 1 — A demo this weekend.** Sales needs the staging environment to stay running over the weekend for a customer demo. The schedule normally stops staging at 8 PM Friday. The team:

- Adds a **force-on override** on the staging group
- Reason: "Customer demo for Acme Corp, scheduled for Saturday 2 PM"
- Expiry: Monday 8 AM (when the schedule's regular start would fire anyway)
- Result: The schedule's stop cron is ignored for these resources during the window. The resources stay running. After Monday 8 AM, the schedule resumes normal control.

The override expressed the intent precisely: temporary exception, documented reason, automatic cleanup.

**Scenario 2 — A planned outage.** The team needs to do maintenance on a non-prod cluster. They don't want the schedule to restart it mid-maintenance:

- Adds a **force-off override** on the cluster
- Reason: "Planned migration to new node types, expected duration 6 hours"
- Expiry: 8 hours from now (with buffer)
- Result: The schedule's start cron is ignored during the window. Even if a scheduled start would normally fire, the override prevents it. After expiry, the schedule resumes.

**Scenario 3 — Production incident requires fewer scheduled actions.** An incident is ongoing; the team doesn't want non-prod schedule-driven actions adding noise to their investigation:

- Adds a **force-on override** on the relevant non-prod groups
- Reason: "Incident #2026-05-19-prod-payment-delay, prevent schedule from firing"
- Expiry: 12 hours
- Result: Non-prod stays in current state during the incident response. Once the incident is resolved (or the override expires), the schedule resumes.

### Override vs. manual action

Manual actions (covered in [M1.2 L4](../M1.2_discover_estate/L4_manual_start_stop.md)) are one-shot:

- Click Stop → resource stops now → next scheduled start fires normally
- Click Start → resource starts now → next scheduled stop fires normally

Manual action does NOT suspend the schedule. The next cron firing acts on the resource as expected.

Override differs:

- It actively suspends the schedule for a window
- The state during the window is enforced (force-on or force-off)
- The schedule's crons do NOT fire on the resource during the window
- After expiry, normal scheduling resumes

For Scenario 1 (demo weekend), a manual start wouldn't help — the schedule would stop staging again Friday at 8 PM. Override force-on prevents that.

### Override vs. schedule edit

Schedule edits are permanent. If the team needs to permanently change the staging cadence (e.g., "we now run staging 24/7"), edit the schedule. If the change is for one weekend, override.

```
INTENT                              TOOL
─────────────────────────────────────────────────────
One demo weekend                    Override (force-on, expires Monday)
Permanent: keep staging 24/7        Schedule edit (remove stop crons)
This one-time maintenance window    Override (force-off, expires 8 hours)
Permanent: stop on Fri 6 PM         Schedule edit (change cron time)
```

The decision criterion: **is the change reverting?** Yes → override. No → schedule edit.

### Why explicit expiry matters

An override without expiry is a forgotten override. Every team has stories of a force-on override set "for the weekend" that ended up running indefinitely. The resource stayed on for months past intent, burning cost the team thought they had saved.

ZopNight requires expiry on every override. This is not negotiable. Common patterns:

```
SCENARIO                         TYPICAL EXPIRY
─────────────────────────────────────────────────────
Weekend demo                     Monday at the schedule's normal start time
Maintenance window               2x the expected duration (buffer)
Incident response                12-24 hours, extend if needed
Off-hours work session            End of session + 2 hours
```

The org-wide **Max Override Duration** policy (covered in [L4](L4_max_duration.md)) sets an upper bound — typically 7 days. Anything longer than that should be a schedule edit, not an override.

### Per-resource vs. per-group override

Overrides can be set at either:

- **Per-resource** — for a single resource (e.g., one specific VM)
- **Per-group** — for every member of a group (e.g., all of "dev-platform")

Per-group is the scaling pattern. For the demo weekend example, set one force-on override on the "staging" group rather than 23 separate per-resource overrides.

### The reason field — why it matters

Every override requires a reason. This is the most operationally useful field on the override:

```
WITHOUT REASON                                 WITH REASON
─────────────────────────────────────────────────────────
"Why is staging still running                  "Why is staging still running
 on Saturday?"                                  on Saturday?"
                                                  
"I don't know, override was set                 "Acme Corp demo Saturday 2pm,
 weeks ago by some engineer."                    expires Monday 8 AM. We're good."
                                                  
Investigation needed.                            Investigation done in 5 seconds.
```

Treat the reason field like a commit message. Future-you (or the next engineer on call) will thank present-you for the context.

---

## 2. Demo

A typical override scenario walked through:

```
T+0       Sales rep emails: "Customer demo Saturday 2 PM, need staging
          running through Monday morning."

T+30 sec  Engineer opens ZopNight → finds the staging group.

T+45 sec  Click "Override" → fill in:
            Type:    Force-on
            Reason:  "Acme Corp demo Sat 2pm, requested by sarah@sales"
            Expiry:  Monday 2026-05-26 08:00 (24-hour notation)

T+1 min   Save. The override is active.

T+1 min   Override appears in the schedule's grid as a separate color band,
          covering Friday 8 PM through Monday 8 AM.

T+1 min   Slack notification posts: "Override applied on group 'staging-eu'
          by engineer X. Expires Monday."

DAY 4 (Monday morning):
T+0       Expiry time hits.
T+1 sec   Override is automatically removed.
T+5 min   Schedule's normal Monday 8 AM start cron fires.
T+5 min   Resources are running (they were already running due to the override).
          Schedule operates normally going forward.
```

Two clicks to set up. Self-expiring. Documented. The pattern scales: 200 demos a year, 200 short overrides, no forgotten overrides.

(Asset: `assets/diagrams/M1.5_L1_demo_weekend.svg`.)

---

## 3. Hands-on (5 min)

For your own estate (or a sandbox):

```
1. Identify a real or hypothetical scenario where override is the right
   tool (not a manual action, not a schedule edit).
2. Decide: force-on or force-off?
3. Write the reason (one sentence — what the override is for, who
   requested it).
4. Pick an expiry time. Choose realistically — when does the exception
   end?
5. (Optional, sandbox) Apply the override. Verify it appears on the
   schedule's grid. Verify the Slack notification fires.

For your real estate, do not apply unless the scenario is real.
Practice the decision; the apply is L2.
```

---

## 4. Knowledge check

### Q1
A team needs staging to stay running this weekend for a customer demo. The right tool is:

A. Edit the schedule to remove the weekend stop crons
B. Apply a force-on override on the staging group, expiring Monday at the normal start time. Document the reason. The schedule reverts to normal control after expiry.
C. Manually start the resources Saturday morning
D. Disable the schedule

<details>
<summary>Show answer</summary>

**Correct: B.** Override is the right tool for a time-bounded exception. Edit (A) is overkill for a one-weekend need. Manual (C) won't work because the schedule's Friday 8 PM stop already fired. Disable (D) loses the schedule entirely.
</details>

### Q2
A force-on override is set on a resource that has no schedule attached. What happens?

A. The override does nothing
B. The override force-keeps the resource ON until expiry — even without a schedule, an override is a state assertion. After expiry, the override is removed; the resource state is unchanged (still on, unless someone else stops it).
C. The override is rejected
D. The override creates a schedule

<details>
<summary>Show answer</summary>

**Correct: B.** Overrides are independent of schedules. A force-on without a schedule still asserts the ON state for the window. After expiry, no state change happens (unlike with a schedule, where the schedule's crons resume).
</details>

### Q3
A team sets an override "for this weekend" without an expiry. What does ZopNight do?

A. Accepts it indefinitely
B. Rejects the override — expiry is required on every override. The team must pick an explicit expiry time. This is intentional to prevent forgotten overrides.
C. Sets expiry to 1 hour
D. Warns but accepts

<details>
<summary>Show answer</summary>

**Correct: B.** Required expiry is the design choice. Forgotten overrides are the canonical operational hazard; mandatory expiry prevents them.
</details>

---

## 5. Apply

Overrides live in:

- **[Overrides page](https://app.zopnight.com/overrides)** — list of all active overrides
- **[Resource detail page](https://app.zopnight.com/resources)** → Override button (per-resource)
- **[Group detail page](https://app.zopnight.com/resource-groups)** → Override button (per-group)
- **[Schedule detail page](https://app.zopnight.com/schedules)** → grid shows active overrides

For configuring the override mechanics, continue to L2.

---

## Related lessons

- [L2 — Force-on, force-off, expiry, reason](L2_setting_overrides.md) *(next)*
- [L4 — Max override duration](L4_max_duration.md)
- [M1.2 L4 — Manual start/stop](../M1.2_discover_estate/L4_manual_start_stop.md)

## Glossary terms touched

[Override](../../../reference/glossary/override.md) · [Force-on / force-off](../../../reference/glossary/force-on-force-off.md) · [Reason field](../../../reference/glossary/reason-field.md) · [Expiry](../../../reference/glossary/expiry.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.5.L1
