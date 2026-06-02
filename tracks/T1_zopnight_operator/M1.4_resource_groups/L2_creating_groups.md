# Creating and managing groups

§ T1 · M1.4 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **create**, **edit**, and **soft-delete** resource groups using the group management surface.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Set up a group with the right metadata so future engineers don't ask me what it is." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1](L1_why_groups.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Create, Edit, Soft-delete (Apply) |

---

## 1. Concept

Group management has four lifecycle operations: create, edit, soft-delete, restore. Each has a specific UI surface and a small number of fields that matter.

### Create

```
RESOURCE GROUPS → New Group
─────────────────────────────────────────────────────────
Name:           [descriptive name]           e.g., "dev-platform-aws"
Description:    [one-line purpose]           e.g., "Dev platform team's
                                                      EC2 + RDS + EKS in AWS"
Budget:         [optional $ amount]          e.g., $4,000/month
Tags:           [optional key-value pairs]   e.g., owner=platform-team,
                                                    environment=dev

[Cancel]                                                       [Create]
```

Four fields. Name and description are required; budget and tags are optional. The group is created empty (no members yet).

### Edit

```
RESOURCE GROUP: dev-platform-aws
─────────────────────────────────────────────────────────
  [Settings ▾] [Members 34] [Attached 1 schedule, 1 budget]

NAME:           dev-platform-aws                     [Edit]
DESCRIPTION:    Dev platform team's AWS EC2+RDS+EKS  [Edit]
BUDGET:         $4,000/month                         [Edit]
TAGS:           owner=platform-team, env=dev         [Edit]

CREATED:        2026-02-12 by jane@zopcloud.com
UPDATED:        2026-05-19 by jane@zopcloud.com
─────────────────────────────────────────────────────────
```

Inline edit on each field. The name change is fast but cascades — references to the old name (in audit logs, in notification history) preserve the original name for that point in time. New events use the new name.

### Soft delete

Groups can be deleted, but the deletion is **soft** by default:

```
DELETE GROUP "dev-platform-aws"?
─────────────────────────────────────────────────────────
This group has:
  - 34 members
  - 1 attached schedule (dev-business-hours)
  - 1 attached budget ($4,000/month)

Deleting will:
  - Remove the group from the active list
  - Detach the schedule from this group (resources stay scheduled
    only if they had a per-resource attachment too)
  - Remove the budget tracking for this group
  - Mark group as soft-deleted (recoverable for 30 days)

Type "dev-platform-aws" to confirm:
[                                                    ]

[Cancel]                                              [Delete group]
```

Name-confirmation pattern (same as schedule delete in M1.3). Prevents accidental deletion. The group is recoverable for 30 days from a Deleted Groups section on the Resource Groups page.

After 30 days, the group is permanently purged. Members are not affected by the purge — they exist independently of the group.

### Restore

For a soft-deleted group within the 30-day window:

```
DELETED GROUPS                                                     
─────────────────────────────────────────────────────────
NAME                       DELETED         RESTORE BY        
dev-platform-aws           2 days ago      28 days remaining  [Restore]
old-staging-group          14 days ago     16 days remaining  [Restore]
─────────────────────────────────────────────────────────
```

Restore brings the group back with its members and attachments intact. Useful for "we deleted this last week and now we realize we shouldn't have."

### What a group does NOT carry

Three things are explicitly NOT properties of a group:

1. **Resource membership.** Members are stored in a separate table. The group has a reference; the membership table is the source of truth for "which resources are in this group."
2. **Attachment state.** Schedule and budget attachments are managed separately. A group can exist with no attachments (useful for organizational grouping without operations).
3. **Cloud-side mirrors.** A ZopNight group is not the same as an AWS Resource Group or Azure Management Group. ZopNight's groups are organizational only; they do not modify cloud-side metadata.

### Permissions

Group management permissions sit under the RBAC entity `resource-group` (covered fully in [T3.M3.1](../../T3_zopnight_architect/M3.1_rbac/00_README.md)):

```
ACTION                  DEFAULT ROLES (Viewer / Editor / Admin)
─────────────────────────────────────────────────────────
List groups             V, E, A   (everyone can see groups)
Create group             E, A
Edit group metadata     E, A
Add / remove members    E, A
Soft-delete group        A
Restore group            A
Permanent purge          A (or automatic after 30 days)
```

Viewers can see groups but not modify them. Editors handle most day-to-day group management. Admins handle deletion and restore.

---

## 2. Demo

A team setting up groups for the first time:

```
T+0       Team has 187 non-prod resources, no groups yet
T+5 sec   Open Resource Groups page → see empty list

T+15 sec  Click "New Group"
T+45 sec  Fill in:
            Name: dev-platform-eu
            Description: EU dev team's primary environment
            Budget: $2,500/month
            Tags: owner=platform-eu, environment=dev
T+50 sec  Save (group created empty)

T+1 min   Repeat for "staging-services-eu" with description, budget, tags

T+1.5 min Open "dev-platform-eu" → click "Add members"
T+1.7 min Filter resources: environment=dev, account=eu-aws-account
          Result: 67 resources
T+1.8 min Select all 67, click "Add to group"
T+1.9 min 67 resources are now members

T+2 min   Open the schedule "business-hours-eu"
T+2.2 min Click "Attach Group" → pick "dev-platform-eu"
T+2.3 min Schedule now applies to all 67 group members

REPEAT for staging-services-eu. Total time: ~5 minutes for two groups.
```

Five minutes to set up the organizational scaffolding. New resources added to either group going forward inherit all attachments automatically.

(Asset: `assets/diagrams/M1.4_L2_group_create_flow.svg`.)

---

## 3. Hands-on (6 min)

Create your first group:

```
1. Open Resource Groups → New Group.
2. Fill in a descriptive name (env + team + cloud).
3. Add a one-sentence description.
4. Set a budget if you have a target (optional).
5. Add 1-2 tags (owner, environment).
6. Save.
7. The group is created empty.
8. (Continuing in L3) Add members.

If you have permission to delete (Admin role): try soft-deleting a
test group. Confirm the name-confirmation pattern. Note the 30-day
restore window. Restore the group to practice that flow.
```

---

## 4. Knowledge check

### Q1
A team deletes a group. The 30-day window allows:

A. The group to keep operating in the background
B. The group to be restored as if no deletion happened, including members and attachments. After 30 days, the group is purged permanently and cannot be restored.
C. AWS notifications to fire
D. Budget tracking to continue

<details>
<summary>Show answer</summary>

**Correct: B.** Soft-delete is recoverable. The 30-day window is a safety net for accidental deletes. After that, the group is permanently gone (members and attachments are not).
</details>

### Q2
A team renames a group from "dev-cluster" to "dev-platform-eu." Past audit logs:

A. Are deleted
B. Preserve the original name for that point in time. New events use the new name. The rename is not retroactive in the audit history.
C. Are renamed retroactively
D. Become unsearchable

<details>
<summary>Show answer</summary>

**Correct: B.** Audit history is immutable. The old name persists in historical records; the new name applies to future events. This is the standard pattern for renames in audit-friendly systems.
</details>

### Q3
A group has 34 members, 1 attached schedule, 1 attached budget. Soft-deleting the group has what immediate effect on members?

A. Members are deleted from ZopNight
B. Members continue to exist as resources in the resource table. They are removed from the group, so the schedule no longer applies via the group. The budget for the group is removed. If the schedule had per-resource attachments too, those persist independently.
C. Members are stopped
D. Members are duplicated

<details>
<summary>Show answer</summary>

**Correct: B.** Members are independent of the group. Soft-deleting the group is metadata-only — it does not modify resources. The attachment relationship is what changes.
</details>

---

## 5. Apply

Group lifecycle operations:

- **[Resource Groups page](https://app.zopnight.com/resource-groups)** — list, create, search
- **Per-group page** — settings, members, attachments
- **Deleted Groups section** — restore within 30 days

For the bulk member management mechanics, continue to L3.

---

## Related lessons

- [L3 — Bulk add and remove with search](L3_bulk_members.md) *(next)*
- [L4 — Sequenced execution](L4_sequenced_execution.md)
- [T3.M3.1 — RBAC](../../T3_zopnight_architect/M3.1_rbac/00_README.md)

## Glossary terms touched

[Soft delete](../../../reference/glossary/soft-delete.md) · [Restore window](../../../reference/glossary/restore-window.md) · [Name-confirmation](../../../reference/glossary/name-confirmation.md) · [Group metadata](../../../reference/glossary/group-metadata.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.4.L2
