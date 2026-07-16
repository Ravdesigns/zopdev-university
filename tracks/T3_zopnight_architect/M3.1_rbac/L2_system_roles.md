# System roles: Viewer, Editor, Admin, SuperAdmin

§ T3 · M3.1 · L2 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **describe** the four system roles, **match** a job function to the right system role, **and recognize** when a system role does not fit and a custom role is warranted.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Assign every user to the smallest role that lets them do their job." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | M3.1.L1 — the policy table |
| **Time** | 9 minutes |
| **Bloom verb** | Describe (Understand), Match (Apply), Recognize (Analyze) |

---

## 1. Concept

ZopNight ships with **four** system roles — Viewer, Editor, Admin, and SuperAdmin (`default_roles.go`) — designed to cover the common 80% of role assignments without custom-role work. They are pre-defined, version-controlled, and edited only by ZopNight engineering (customers assign them or build custom roles next to them).

```
ROLE        POLICY ACTIONS                              COVERAGE
──────────────────────────────────────────────────────────────────────
Viewer      view only                                    read everything
Editor      view + update on operational entities;       operate, not administer
            view-only on administrative ones. NOTE: the
            default Editor is view + update, NOT full
            CRUD; create/delete on many entities is
            reserved for Admin/SuperAdmin
Admin       broad create / update / delete across        manage resources + config
            resources and configuration
SuperAdmin  everything Admin has, PLUS user, role,        the org owner
            assignment, and organisation management
```

The progression is additive: Viewer ⊂ Editor ⊂ Admin ⊂ SuperAdmin. The key surprise is that **user, role, and organisation administration lives at SuperAdmin, not Admin** — a plain Admin cannot invite users or edit roles. Promoting up the chain only adds capabilities; demoting only removes them.

### Role boundaries

```
VIEWER
  Read everything; modify nothing
  Sees: resources, schedules, costs, recommendations, audit log
  Cannot: start/stop a resource, create a schedule, apply a rec
  Use for: junior engineers, auditors, finance partners, executives

EDITOR
  view + update on operational entities: schedules, overrides,
    recommendations (apply/dismiss = recommendation:update), resource
    actions (start/stop), resource groups, notifications
  NOT full CRUD by default: create/delete on many entities is reserved
    for Admin / SuperAdmin
  View-only on: roles, users, organisation, cloud-account credentials
  Use for: platform engineers, FinOps analysts, SREs

ADMIN
  Broad create / update / delete across resources and configuration
    (cloud-account:create/update/delete, schedules, budgets, dashboards,
     autoscaler policies, and so on)
  Does NOT include user / role / org administration
  Use for: senior eng, ops leadership, platform owners

SUPERADMIN
  Everything Admin has, PLUS the administrative entities:
    - role:create / role:update / role:delete
    - user:create / user:update / user:delete
    - assignment (assign roles to users)
    - organisation:update
  Use for: the designated org owner, security / compliance lead
```

### Why not just one role per person

These four roles handle most assignments because the cost-ops job ladder clusters into three tiers of need: read-only stakeholders (finance, exec, junior), operational practitioners (engineers, analysts), and administrative owners (leads, security). A role-per-person would explode into hundreds of policy combinations, half of them unused, none of them auditable.

The system-role design is a deliberate trade. You sacrifice some granularity (a FinOps Analyst who wants to dismiss but not apply recommendations needs a custom role) in exchange for a clear, auditable default. The custom-role path remains open for the 20% of cases that need it (covered in L3).

### Why Editor cannot manage RBAC

The Editor role intentionally excludes role management. Editors can change cost (apply recommendations, edit schedules) but not change who can change cost. That separation prevents a compromised Editor account from escalating itself to Admin. It also means RBAC drift cannot happen silently — every role change is an Admin action and is audit-logged.

This is a common point of confusion: customers ask "why can't my Editor change a teammate's role?" The answer is the privilege-escalation prevention. If the Editor truly needs that capability, the answer is Admin (with stronger account protection like SSO + MFA), not loosening Editor.

### How system roles compose with team scoping

A user with the Editor system role can still be **team-scoped** so they only have Editor permissions within a specific team. The role defines *what actions are possible*; the team scope defines *which subset of data those actions apply to*. M3.1.L4 covers team scoping in depth. For now, remember: the system role and the team scope are independent dimensions.

### Audit trail considerations

```
ROLE ASSIGNMENT CHANGES are always logged:
  - Who made the change (assigner)
  - Who received the change (assignee)
  - Old role → new role
  - Timestamp
  - Reason (optional field — recommended for compliance)
```

Quarterly reviews typically pull this log to confirm: no surprise Admins, no demoted Editors who still have lingering access, no role changes by departed users.

### How ZopNight uses the system roles

```
SYSTEM ROLE     TYPICAL HEADCOUNT (mid-size customer, ~50 users)
──────────────────────────────────────────────────────────────
Viewer          15-20 (finance, exec, junior eng, auditors)
Editor          25-30 (platform eng, FinOps analysts, SREs)
Admin           2-5   (org lead, security lead, FinOps owner)
Custom          2-5   (edge cases — compliance-only Auditor,
                       FinOps Analyst with selective recommend)
```

The 2-5 Admins is the most-watched number. More than 5 Admins in a mid-size org usually indicates a role-design problem — capabilities have leaked upward because Editor was too restrictive somewhere, and instead of fixing Editor or creating a custom role, the workaround was "just make them Admin."

---

## 2. Demo

A mid-size customer's role assignment after a clean review:

```
TEAM: 14 users
─────────────────────────────────────────────────────
8 engineers             Editor
1 senior engineer       Admin
1 SRE lead              Admin
3 PM / product          Viewer
1 finance partner       Viewer
1 security/compliance   Custom (Viewer + audit-log:view
                                + report:view extended)
─────────────────────────────────────────────────────
TOTAL                   2 Admins · 8 Editors · 3 Viewers · 1 Custom
```

The customer started with 6 Admins (every engineer-lead was Admin "for convenience"). The review reduced to 2 by giving Editors the recommend-apply capability they actually needed and Admin only to the 2 people who manage roles + cloud accounts. No capability was lost; the blast radius of a compromised account dropped from 6 to 2.

---

## 3. Hands-on (6 min)

For your own team, map current role counts:

```
HEADCOUNT BY ROLE:
  Admin     _____   (target: 2-5 for mid-size org)
  Editor    _____
  Viewer    _____
  Custom    _____

For each Admin, write the one specific capability that requires Admin
(not Editor + custom). If you cannot name one, that person is over-permissioned.

Admin #1 (name): __________ Required Admin capability: __________
Admin #2 (name): __________ Required Admin capability: __________
Admin #3 (name): __________ Required Admin capability: __________
```

A clean output: every Admin has a specific reason. A messy output: Admins for whom no Admin-only capability is required.

---

## 4. Knowledge check

### Q1
A FinOps Analyst needs to view recommendations and dismiss them, but NOT apply them (each apply is high-risk and goes through a separate approval). The right role:

A. Editor — gives full access
B. Custom role — Viewer + `recommendation:update`, without `recommendation:update`. The system roles don't fit exactly; this is the 20% custom case. Document the role in the role description.
C. Admin
D. Viewer (with a separate process for dismissals)

<details>
<summary>Show answer</summary>

**Correct: B.** This is a textbook custom-role case. The system roles are tiered — Editor includes apply. Removing just apply means a custom role. Always document the *why* in the role's description field so reviewers in 6 months understand the intent.
</details>

### Q2
A new engineer joins. The right starting role is:

A. Admin so they can do anything during onboarding
B. Editor — most engineers need to create/modify resources. Promote to Admin only when there is a specific admin-tier need (managing roles, rotating cloud creds).
C. Viewer — they need read-only first
D. Random — pick one and adjust

<details>
<summary>Show answer</summary>

**Correct: B.** Editor is the default for engineers. Admin is reserved for people who manage RBAC and cloud account credentials. The principle: start at the smallest role that lets the person do their job; promote on demonstrated need.
</details>

### Q3
An organization has 8 Admins out of 20 users. The most likely explanation:

A. The org needs all of them
B. Role design has leaked — Editor is probably too restrictive somewhere, so people got promoted to Admin as a workaround. Audit the recent admin-tier actions; in most cases, 1-2 missing Editor capabilities would solve the issue.
C. The product requires it
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 40% Admin density is a red flag. The fix is usually a small Editor adjustment or a focused custom role, not blanket Admin grants. Quarterly RBAC reviews catch this pattern.
</details>

---

## 5. Apply

Assign system roles in [Settings → Users](https://app.zopnight.com/settings/users). For each user, the assignment screen shows the effective policy set so you can confirm before saving.

A useful pre-save check: read the Effective Permissions summary at the bottom of the assignment dialog. It enumerates the `(entity, action)` pairs the user will have. If anything surprises you, the role is wrong or the team scope needs adjusting.

---

## Related lessons

- [L1 — The 15-entity policy table](L1_policy_table.md)
- [L3 — Custom roles](L3_custom_roles.md) *(next)*
- [L4 — Team-scoped roles](L4_team_scoped.md)
- [T3.M3.3.L1 — What gets audit-logged](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[System role](../../../reference/glossary/system-role.md) · [Viewer](../../../reference/glossary/viewer.md) · [Editor](../../../reference/glossary/editor.md) · [Admin](../../../reference/glossary/admin.md) · [Custom role](../../../reference/glossary/custom-role.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L2
