# Attaching resources and groups

§ T1 · M1.3 · L5 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **attach** resources and groups to a schedule **and explain** why exclusive membership is enforced.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Get my non-prod resources onto a schedule in under 5 minutes." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1–L4](L1_schedule_anatomy.md), M1.2 |
| **Time** | 10 minutes |
| **Bloom verb** | Attach (Apply) and Explain (Understand) |

---

## 1. Concept

A schedule by itself does nothing. The schedule defines a cadence (crons + timezone); the attachment is what makes the schedule act on specific resources. Two attachment paths exist: per-resource and per-group.

### Per-resource attachment

Attach a schedule directly to a specific resource:

```
1. Open the resource (Resources → click row)
2. In the detail panel, click "Attach Schedule"
3. Pick the schedule from a dropdown
4. Save
```

The resource will now follow the schedule's cadence. Per-resource attachment is right for:

- One-off scheduling (a single resource needing a unique cadence)
- Resources that don't belong to a group
- Initial pilot before scaling up to groups

### Bulk per-resource attachment

For many resources, the bulk action surface from [M1.2 L4](../M1.2_discover_estate/L4_manual_start_stop.md) extends to schedule attachment:

```
1. Resources → filter to the target set
2. Select all filtered (sticky banner)
3. Choose "Attach schedule" from the banner
4. Pick the schedule
5. Confirm
```

The worker pool processes the attachments. 100 resources attach in 30 seconds.

### Per-group attachment

For repeated scheduling at scale, attach the schedule to a **group** (covered fully in M1.4):

```
1. Open Resource Groups
2. Open the target group
3. Click "Attach Schedule"
4. Pick the schedule
5. Save
```

Now every member of the group follows the schedule. Adding or removing resources from the group changes who the schedule affects — the schedule attachment doesn't need to be re-managed.

### Exclusive membership

A resource can be attached to **at most one schedule** at a time. This is the *exclusive membership* rule.

Why exclusive: two schedules on one resource can conflict. Schedule A says "start at 8 AM"; Schedule B says "start at 10 AM." Which wins? Resolving this would require precedence rules, last-write-wins, or some user-visible "primary schedule" concept — all of which introduce confusion. The product choice is simpler: one schedule per resource, attached explicitly.

If a user attempts to attach a resource that's already attached to another schedule, the UI surfaces a clear prompt:

```
"prod-dev-1 is currently attached to schedule 'Old Schedule'.

Replace with 'New Schedule'?"

[Cancel]                          [Replace attachment]
```

The user explicitly chooses to replace. Silent override is not possible.

### Group exclusivity

Groups have the same rule: a resource can be in at most one group. Two groups cannot share a resource. The exclusivity simplifies sequenced execution (see [M1.4](../M1.4_resource_groups/00_README.md)) and prevents the "two groups' schedules both fire" ambiguity.

### The search-across attachment panel

When attaching resources to a schedule, the attachment panel exposes a precise filter:

```
ATTACH RESOURCES TO SCHEDULE "Business Hours"
─────────────────────────────────────────────────
Search:        [type a name, UID, or tag value]

Filters:
  Cloud Account ▾    [grouped multi-select from M1.2]
  Resource Type ▾    [grouped multi-select from M1.2]
  Status ▾           [Running / Stopped]
  Region ▾           [cascaded]
  Tag                [tag key=value]
  Schedule           [✓ Unattached only — default]
  Group              [✓ Not in any group — default]

─────────────────────────────────────────────────
Results: 187 resources

[ ] prod-eks-cluster (eks)               us-east-1
[ ] dev-postgres-1   (rds)               us-east-1
[ ] dev-postgres-2   (rds)               us-east-1
...

Select all 187                        [Attach selected]
```

The "Unattached only" and "Not in any group" filters are checked by default — they hide resources that would be re-attached (which would force the replace prompt). Power users uncheck to see everything.

The full filter machinery from [M1.2 L3](../M1.2_discover_estate/L3_grouped_filters.md) works here too. A team can construct "All running GCP non-prod databases in EU regions" and attach in one action.

### Detach

Detaching a resource from a schedule is symmetric:

```
1. Open the resource or open the schedule
2. Click "Detach from schedule" (resource) or "Remove resource" (schedule)
3. Confirm
4. The resource is now unattached. Future cron firings will not act on it.
```

Detaching does NOT change the resource's current state. If the resource was running at the time of detach, it stays running. The schedule simply no longer manages it.

### Group attachment vs. resource attachment — which to use

```
SCENARIO                                     USE
─────────────────────────────────────────────────────────────
A single resource needs its own cadence       Per-resource
A small set (<10) of one-off resources        Per-resource bulk
A team's full dev environment                 Group (M1.4)
Resources that share lifecycle dependencies   Group (M1.4) — sequencing
Cross-team shared infrastructure              Per-resource (no obvious group)
Changing membership over time                 Group — the schedule
                                              attachment stays stable
                                              even as members change
```

For most production deployments, groups are the right scaling pattern. Individual resource attachment is for the long tail.

---

## 2. Demo

A team's first schedule rollout:

```
DAY 1, T+0       Schedule "non-prod-business-hours" exists but empty.

T+5 min          Open the schedule.
T+5 min          Click "Attach Resources."
T+6 min          In the panel, apply filters:
                    Type Category: Compute, Kubernetes, Database
                    Tag: environment=dev OR environment=staging
                    Status: Running
T+7 min          Result: 234 resources.
T+8 min          Click "Select all 234" → "Attach selected."
T+8 min          Confirmation modal: "Attach 234 resources to non-prod-business-hours?"
T+9 min          Confirm.
T+9 min          Worker pool processes attachments.
T+10 min         234 resources now attached.

DAY 1, EVENING   8 PM hits. Cron #2 fires. 234 resources begin to stop.

DAY 2, MORNING   8 AM hits. Cron #1 fires. 234 resources begin to start.
                  By 8:15 AM, 230 are running. 4 had errors (logged for
                  investigation — likely transient, will retry next firing).

DAY 7            Realized savings: $4,800 for the week.
                  Annual run-rate: $250K.
```

Ten minutes to set up. $250K annual savings on auto-pilot.

(Asset: `assets/diagrams/M1.3_L5_attachment_flow.svg`.)

---

## 3. Hands-on (6 min)

Attach resources to your test schedule from L1:

```
1. Open the schedule.
2. Click "Attach Resources."
3. Filter to a small, safe test set (a sandbox environment, 3-5 resources max).
4. Verify the filters — make sure no production resources are in the result set.
5. Select all → Attach.
6. Confirm.
7. Verify on the schedule detail page that the resources are listed.

THEN — wait for the schedule to fire (or trigger the next firing manually
if you can adjust the cron). Confirm that the start/stop actions happen
as expected on the attached resources.
```

---

## 4. Knowledge check

### Q1
A resource is currently attached to schedule A. A user tries to attach the same resource to schedule B. What happens?

A. Both schedules attach simultaneously
B. The UI prompts the user to either cancel or replace schedule A with schedule B. Exclusive membership is the rule — one schedule per resource.
C. The attachment fails silently
D. Schedule B becomes a backup

<details>
<summary>Show answer</summary>

**Correct: B.** Exclusive membership is enforced explicitly. The user picks: cancel or replace.
</details>

### Q2
A team detaches a resource from its schedule. The resource is currently running. What happens to the resource's state?

A. Stops immediately
B. Nothing — detach does not change the current state. The resource stays running until manually stopped or until a different schedule starts managing it.
C. Resets to default
D. Restarts

<details>
<summary>Show answer</summary>

**Correct: B.** Detach is a metadata operation. It does not act on the resource's current state. The schedule simply no longer manages future state transitions.
</details>

### Q3
For a team's 47-resource non-prod environment, the best attachment strategy is:

A. Per-resource bulk attach (47 individual attachments via bulk action)
B. Per-group attach — create a Resource Group for the environment, add the 47 resources, attach the schedule to the group. Stable as membership changes.
C. Either works equally
D. Per-resource is faster

<details>
<summary>Show answer</summary>

**Correct: B.** Groups are the scaling pattern for stable membership. Adding or removing one resource from the environment doesn't require re-attaching the schedule. (See M1.4 for groups in detail.)
</details>

---

## 5. Apply

Attachment lives in two surfaces:

- **[Schedule detail page](https://app.zopnight.com/schedules)** → "Attach Resources" or "Attach Group" buttons
- **[Resource detail panel](https://app.zopnight.com/resources)** → "Attach to Schedule" action

For groups (the recommended pattern at scale), see [M1.4 — Resource Groups](../M1.4_resource_groups/00_README.md).

---

## Related lessons

- [L6 — The savings estimator](L6_savings_estimator.md) *(next)*
- [M1.4 — Resource Groups](../M1.4_resource_groups/00_README.md)
- [M1.5 — Overrides](../M1.5_overrides/00_README.md)

## Glossary terms touched

[Schedule attachment](../../../reference/glossary/schedule-attachment.md) · [Exclusive membership](../../../reference/glossary/exclusive-membership.md) · [Group attachment](../../../reference/glossary/group-attachment.md) · [Detach](../../../reference/glossary/detach.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.3.L5
