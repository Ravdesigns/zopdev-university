# Why groups — exclusive membership and one source of truth

§ T1 · M1.4 · L1 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why groups exist **and decide** when to use a group over per-resource attachment.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop re-attaching schedules every time we add a resource to the dev environment." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M1.3 (schedules) |
| **Time** | 10 minutes |
| **Bloom verb** | Explain (Understand) and Decide (Apply) |

---

## 1. Concept

A **resource group** is a named bundle of cloud resources. Once a schedule (or budget, or notification) is attached to a group, every member of the group inherits the attachment. Adding or removing a member updates who the attachment applies to — without re-attaching the schedule.

Groups solve one main problem: **stable membership against evolving estates**.

### The problem groups solve

```
WITHOUT GROUPS — per-resource attachment

Day 1:   Team creates 23 dev resources. Each is attached to schedule A.
Day 8:   Team provisions 3 new dev resources. They are NOT on the schedule.
         Someone has to remember to attach them.
Day 16:  Team retires 4 old dev resources. The schedule still references them.
         (Harmless but messy.)
Day 30:  Membership drift: only ~70% of dev resources are on the schedule.
         Schedule effectiveness degrades silently.
```

```
WITH GROUPS

Day 1:   Team creates the "dev" group, adds 23 resources, attaches schedule A.
Day 8:   Team provisions 3 new dev resources. Adds them to the "dev" group.
         Schedule automatically applies.
Day 16:  Team retires 4 old dev resources. Removes from group.
         Schedule automatically excludes them.
Day 30:  100% of dev resources are on the schedule, because group membership
         is the single source of truth.
```

The group is the abstraction that survives the estate's evolution.

### What can be attached to a group

```
ATTACHMENT TYPE         BEHAVIOR
─────────────────────────────────────────────────────────────────
Schedule                Every member follows the group's schedule
Budget                  The group has a budget, spend computed across members
Notification rules      Notifications fire on group events
Sequenced execution     Group-level ordering of start/stop (covered L4)
```

A single group can carry all four attachments simultaneously. Adding a resource to the group means it inherits all four.

### Exclusive membership

A resource can be in **at most one group** at a time. The exclusivity rule from [M1.3 L5](../M1.3_first_schedule/L5_attaching.md) extends to groups: one schedule per resource AND one group per resource.

Why exclusive: two groups can have conflicting attached schedules. Group A says "stop at 8 PM"; Group B says "stop at 10 PM." If a resource were in both groups, which schedule wins? Resolving the conflict requires precedence rules or per-resource overrides, both of which add complexity. The simpler model: one group, explicit choice.

When attempting to add a resource that's already in another group:

```
"prod-dev-1 is currently in group 'old-dev-cluster'.

Move to 'new-dev-cluster'?"

[Cancel]                              [Move and add to new group]
```

The user explicitly chooses. Silent migration is not possible.

### Groups vs per-resource attachment — when to use which

```
SCENARIO                                     USE
─────────────────────────────────────────────────────────────
Stable membership over months               Group
Growing or shrinking environment             Group (definitely)
A single resource needing a unique cadence   Per-resource
Cross-team shared infrastructure              Per-resource (no obvious group)
A pilot of 3 resources before scaling up    Per-resource → migrate to group
A team's entire dev environment              Group
```

For most production deployments, groups are the right scaling pattern. Individual resource attachment is for the long tail.

### Anti-pattern: too many tiny groups

A common mistake: creating one group per resource. Defeats the purpose. The right granularity:

```
GOOD GROUPS                  ANTI-PATTERN
─────────────────────────────────────────────────────
dev-platform                  group-for-i-0abc
staging-services              group-for-i-0def
prod-shared-infra             group-for-i-0ghi
ml-training-experiments       group-for-each-resource

5-20 resources per group      1 resource per group
```

Group size guidance: typical 5–50 members per group, 100+ acceptable for very large estates. Below 5, the abstraction adds overhead without scaling benefit.

### Anti-pattern: too few mega-groups

The opposite mistake: one "all-non-prod" group with 500 resources. Defeats the purpose differently — the group becomes too coarse to attach different schedules or budgets across what should be sub-environments.

```
GOOD                              ANTI-PATTERN
─────────────────────────────────────────────────────
dev (Group)                       
staging (Group)                   all-non-prod (Group, 500 members)
test-ephemeral (Group)            

3 groups, each scheduled          1 group, can only have one schedule
slightly differently               for everything
```

Group at the level where membership has the same cadence or budget. Below that level, splitting buys nothing. Above it, splitting buys flexibility.

### Group naming convention

```
GOOD NAMES                        BAD NAMES
─────────────────────────────────────────────────────
dev-platform-eu                   group1
staging-services                  jane-test-group
prod-shared-infra                 misc
ml-training-experiments-aws       new-group-2026-05

Descriptive, hierarchical         Sequential or person-named
Includes environment + scope      Lacks context
```

Group names appear in notifications, audit logs, and the UI. Treat them like database table names: descriptive enough that a future engineer reading them understands the purpose.

---

## 2. Demo

A team's group strategy:

```
ORG: zopcloud-saas-prod
CLOUD ACCOUNTS: 12 (3 AWS, 4 GCP, 5 Azure)

GROUP STRATEGY
─────────────────────────────────────────────────────────
GROUPS:                                  MEMBERS   SCHEDULE
  dev-platform-aws                       34         business-hours-pt
  staging-platform-aws                   28         business-hours-pt
  dev-services-gcp                       47         business-hours-eu
  staging-services-gcp                   31         business-hours-eu
  test-ephemeral-aws                     14         aggressive-weekend
  ml-training-prod-aws                   8          (no schedule)
  prod-shared-infra                      52         (no schedule)
  
TOTAL: 7 groups, 214 resources across 12 cloud accounts.

NOTE: prod-shared-infra is a group for budgets + notifications,
      not for scheduling. It has no schedule attached.

NEW RESOURCE FLOW
  Engineer provisions dev-platform resource in AWS:
    → Resource discovered in 6h (or via manual refresh).
    → Engineer adds to "dev-platform-aws" group.
    → Resource inherits the business-hours-pt schedule.
    → Resource shows up in the dev-platform-aws budget tracking.

Engineer time per new resource: ~30 seconds.
```

Without groups, the same workflow would require attaching the schedule + the budget + the notification rule individually per resource. Five times the click work.

(Asset: `assets/diagrams/M1.4_L1_group_strategy.svg`.)

---

## 3. Hands-on (6 min)

For your own estate:

```
1. Pick one logical group of resources you'd want to manage together
   (e.g., "all dev EC2 in us-east-1," or "all GCP staging databases").
2. Count how many resources fit. Aim for 5-50.
3. Identify what attachments this group would carry:
   - A schedule? Which one?
   - A budget? At what dollar amount?
   - Notification rules?
4. Sketch the group name (follow the descriptive convention).
5. (Optional, if you have a sandbox) Create the group, add the
   resources, attach the schedule, and observe.

You do not have to create the group right now — the exercise is
about practicing group design. The mechanics are in L2.
```

---

## 4. Knowledge check

### Q1
A team retires 4 old dev resources without removing them from their group. The likely consequence:

A. The group breaks
B. The resources are removed from discovery (since they don't exist in the cloud anymore). The group membership table auto-cleans on the next discovery sync. No action needed.
C. The schedule fires errors forever
D. The group must be recreated

<details>
<summary>Show answer</summary>

**Correct: B.** Discovery is the source of truth. Resources that no longer exist in the cloud are removed from the resource table, which auto-cascades to remove from groups. No manual cleanup needed.
</details>

### Q2
A team creates 250 groups, one per resource. Most accurate diagnosis:

A. Excellent organization
B. Anti-pattern — groups are not for single resources. The right granularity is 5-50 members per group. One-resource groups add overhead with no scaling benefit; reconsider the schema.
C. Required for security
D. Improves performance

<details>
<summary>Show answer</summary>

**Correct: B.** Too-many-tiny-groups defeats the purpose. Groups exist to manage many resources at once; a single-resource group is just an awkward per-resource attachment.
</details>

### Q3
A team wants to attach two schedules to one group ("weekday schedule" + "weekend schedule"). The defensible answer is:

A. Yes, one group can carry many schedules
B. No — a group can have at most one schedule attached. Use two crons in one schedule for weekday + weekend coverage. The crons combine in one schedule; the schedule attaches to the group.
C. Create two groups with the same resources
D. Use overrides

<details>
<summary>Show answer</summary>

**Correct: B.** One group, one schedule (just like one resource, one schedule). The right design is two crons in one schedule that together cover both patterns. Multiple-schedule-per-group would invite the conflict-resolution complexity that exclusive membership avoids.
</details>

---

## 5. Apply

Groups are managed in:

- **[Resource Groups page](https://app.zopnight.com/resource-groups)** — create, list, manage
- **[Resource detail panel](https://app.zopnight.com/resources)** — see which group a resource is in
- **[Schedule detail page](https://app.zopnight.com/schedules)** — attach a group instead of individual resources

For the create + manage mechanics, continue to L2.

---

## Related lessons

- [L2 — Creating and managing groups](L2_creating_groups.md) *(next)*
- [L4 — Sequenced execution](L4_sequenced_execution.md)
- [M1.3 L5 — Attaching resources and groups](../M1.3_first_schedule/L5_attaching.md)

## Glossary terms touched

[Resource group](../../../reference/glossary/resource-group.md) · [Exclusive membership](../../../reference/glossary/exclusive-membership.md) · [Stable membership](../../../reference/glossary/stable-membership.md) · [Group attachment](../../../reference/glossary/group-attachment.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.4.L1
