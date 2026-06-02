# Bulk add and remove with search

§ T1 · M1.4 · L3 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **add and remove** group members in bulk using filtered search **and migrate** members between groups when reorganizing.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Populate a new group with the right 67 resources in 60 seconds." |
| **Personas** | Platform Engineer |
| **Prerequisites** | [L1](L1_why_groups.md), [L2](L2_creating_groups.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Add, Remove, Migrate (Apply) |

---

## 1. Concept

Group membership at scale needs efficient bulk operations. The Add Members panel reuses the filter machinery from [M1.2 L3](../M1.2_discover_estate/L3_grouped_filters.md) so a team can construct a filter, multi-select, and add hundreds of resources in one operation.

### The Add Members panel

```
GROUP: dev-platform-eu (currently 0 members)
ADD MEMBERS
─────────────────────────────────────────────────────────
Search:              [type a name, UID, or tag value]

Filters:
  Cloud Account ▾    [grouped multi-select]
  Resource Type ▾    [grouped multi-select, by category]
  Status ▾           [Running / Stopped / Any]
  Region ▾           [cascaded]
  Tag                [tag_key = value]
  Schedule           [✓ Unattached only — default]
  Group              [✓ Not in any group — default]

─────────────────────────────────────────────────────────
Results: 67 resources

[ ] prod-eu-eks-1 (eks)            eu-west-1
[ ] prod-eu-rds-1 (rds)            eu-west-1
[ ] prod-eu-ec2-1 (ec2)            eu-west-1
... 

[ ] Select all 67                                     [Add to group]
```

The two default filters — "Unattached only" and "Not in any group" — are deliberate:

- **Unattached only** hides resources already on a different schedule. A team should know when they're about to disrupt an existing attachment.
- **Not in any group** hides resources already in another group. Trying to add such a resource raises the migration prompt (see below).

A power user can uncheck either filter to see everything. The defaults are the safe path.

### The migration prompt

If a user tries to add a resource that's already in another group:

```
"prod-eu-ec2-1 is currently in group 'old-dev-aws'.

Move to 'dev-platform-eu'?"

This will:
  - Remove from 'old-dev-aws'
  - Add to 'dev-platform-eu'
  - Schedule attached to 'old-dev-aws' will no longer apply
  - Schedule attached to 'dev-platform-eu' will apply going forward

[Cancel]                          [Move and add to new group]
```

The prompt is explicit. The user understands the consequences before acting.

### Bulk migration

For large reorgs (e.g., splitting a 200-member "all-dev" group into "dev-platform" + "dev-services"):

```
SOURCE GROUP: all-dev (200 members)
TARGET GROUP: dev-platform (currently 0 members)

In the source group's member list, filter to the target subset
(e.g., tag team=platform). Select all 78 matches.

Action menu → "Move to group" → pick "dev-platform"

Confirmation modal:
  Move 78 resources from "all-dev" to "dev-platform"?
  
[Cancel]                                          [Move 78 resources]
```

78 resources migrated in one click. The action is logged in the audit trail.

### Remove members

Removing is symmetric:

```
1. Open the group's member list
2. Filter (optional) to narrow
3. Select members
4. Click "Remove from group"
5. Confirm
6. Resources are no longer in the group. They are NOT deleted from
   the cloud — only the group membership is removed.
```

After removal, the resources are "unattached" — eligible for adding to another group or for per-resource attachment.

### Search-across

The Add Members panel's search field searches across the entire estate, not just within the current selection. A user typing "prod-eu" sees every resource with "prod-eu" in its name, UID, or tag values — regardless of which account, region, or current group.

This is useful when the team knows the naming convention but doesn't remember exactly which account or region a resource lives in.

### Membership versioning

The group membership table is versioned implicitly: every add and every remove writes an audit-log entry with timestamp, actor, and reason (optional). A team can ask "when was prod-eu-rds-3 added to this group?" and find the answer in the audit log (covered in [T3.M3.3](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)).

This matters for compliance audits and for debugging "why is this resource being scheduled?" investigations.

### Performance at scale

For very large estates (1,000+ resources per group), the bulk operations use the same 4-worker pool from [M1.2 L4](../M1.2_discover_estate/L4_manual_start_stop.md). Adding 1,000 resources takes 2–3 minutes. The UI shows a per-resource progress indicator during the operation.

If a member-add operation fails for a specific resource (e.g., the resource was deleted from the cloud between filter and add), the bulk operation completes the rest and reports the failure. The user can retry the failed entries.

---

## 2. Demo

A team migrating from "all-non-prod" mega-group to four smaller groups:

```
STATE: One group "all-non-prod" with 487 members.
GOAL:  Split into dev-platform, staging-platform, dev-services, staging-services.

T+0       Create four new empty groups (L2 mechanics).
T+5 min   Open "all-non-prod" member list.
T+5 min   Filter: tag team=platform AND environment=dev
          Result: 142 resources.
T+6 min   Select all 142, Action → Move to group → "dev-platform"
T+6 min   Confirm. 142 resources moved in ~30 seconds.

T+7 min   Filter: tag team=platform AND environment=staging
          Result: 98 resources.
T+8 min   Move all to "staging-platform."

T+9 min   Filter: tag team=services AND environment=dev
          Result: 124 resources.
T+10 min  Move to "dev-services."

T+11 min  Filter: tag team=services AND environment=staging
          Result: 73 resources.
T+12 min  Move to "staging-services."

T+13 min  Old group "all-non-prod" now has 487 - 142 - 98 - 124 - 73 = 50
          unmatched resources. These are stragglers (untagged or unique).
          Review and either tag + move, or leave in a residual group.

T+15 min  Reorganization complete. Four groups populated, one residual.
```

Fifteen minutes for a meaningful reorg of a 487-resource estate. Tag-driven filtering does the heavy lifting.

(Asset: `assets/diagrams/M1.4_L3_bulk_migration.svg`.)

---

## 3. Hands-on (7 min)

Populate the group you created in L2:

```
1. Open the group → click "Add Members."
2. Construct a filter that matches the resources you want:
   - Cloud Account: pick the right account
   - Resource Type: pick the categories
   - Tags: filter to env=dev (or whatever fits)
3. Note the result count.
4. Select all → "Add to group."
5. Confirm.
6. Verify on the group's member list that the resources are now in.

If your filter result is too narrow or too broad: iterate. The filter
is the design tool; the add operation is the commit.

THEN: practice removing a member.
- Pick one member, select it, click "Remove from group."
- Confirm.
- The resource is now eligible for re-adding (or for a different group).
```

---

## 4. Knowledge check

### Q1
A user tries to add a resource to group B. The resource is already in group A. The expected behavior:

A. The resource is added to both groups
B. A migration prompt appears: "X is currently in group A. Move to B?" The user explicitly chooses. Silent migration is not possible because of exclusive membership.
C. The add fails silently
D. The resource is duplicated

<details>
<summary>Show answer</summary>

**Correct: B.** Exclusive membership is enforced. The migration prompt is the only path to move a resource between groups.
</details>

### Q2
The "Not in any group" filter is checked by default in the Add Members panel because:

A. It's a bug
B. It hides resources that would trigger the migration prompt, keeping the bulk-add flow clean. Power users can uncheck to see everything, but the default protects against unintentional migrations.
C. To improve performance
D. To enforce exclusive membership

<details>
<summary>Show answer</summary>

**Correct: B.** The default is a UX choice. It surfaces only resources that can be added without raising the migration question. Unchecking is fine when the user knowingly wants to migrate.
</details>

### Q3
A team removes 50 resources from a group. What happens to the 50 resources in their cloud accounts?

A. They are deleted
B. Nothing — remove-from-group is metadata only. The resources continue to exist in the cloud and in ZopNight's resource table. They are now eligible for adding to a different group or for per-resource attachment.
C. They are stopped
D. They are tagged differently

<details>
<summary>Show answer</summary>

**Correct: B.** Group membership is metadata. Removing from a group is a label change, not a state change.
</details>

---

## 5. Apply

Bulk membership operations:

- **[Group detail page → Add Members](https://app.zopnight.com/resource-groups)** — filter + multi-select
- **Member list → action menu** — remove, move-to-group, attach-schedule, set-tag
- **Audit Log** — every add and remove is recorded with timestamp and actor

For sequenced execution (the cascade order within a group when schedules fire), continue to L4.

---

## Related lessons

- [L4 — Sequenced execution](L4_sequenced_execution.md) *(next)*
- [M1.2 L3 — Grouped filters](../M1.2_discover_estate/L3_grouped_filters.md)
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Bulk membership](../../../reference/glossary/bulk-membership.md) · [Migration prompt](../../../reference/glossary/migration-prompt.md) · [Member list](../../../reference/glossary/member-list.md) · [Worker pool](../../../reference/glossary/worker-pool.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.4.L3
