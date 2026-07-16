# M3.1 — RBAC

§ T3 · M3.1 · Architect tier · 6 lessons · ~54 min

## Module outcome

Design and operate ZopNight's RBAC: 15 policy entities, 3 system roles, custom roles, team-scoped access.

## Lessons

| # | Lesson | Time | Topics |
|---|---|---|---|
| L1 | [The 15-entity policy table](L1_policy_table.md) | 9 min | Resource, schedule, group, override, cloud-account, notification, team, role, user, org, assignment, state-history, report, audit-log, recommendation |
| L2 | [System roles: Viewer, Editor, Admin, SuperAdmin](L2_system_roles.md) | 9 min | Default permissions, escalation, when to use which |
| L3 | [Custom roles](L3_custom_roles.md) | 9 min | When custom is justified; building from policy entities |
| L4 | [Team-scoped access](L4_team_scoped.md) | 9 min | allResources vs resourceIds; per-team scoping |
| L5 | [The three-state scope model](L5_scope_states.md) | 9 min | nil = no filter, [] = empty, [ids] = filtered |
| L6 | [Frontend gating with usePermission()](L6_frontend_gating.md) | 9 min | How "Access restricted" is rendered |

---

§ Last reviewed 2026-05-20
