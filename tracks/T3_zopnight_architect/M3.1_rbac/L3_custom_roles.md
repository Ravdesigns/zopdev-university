# Custom roles

§ T3 · M3.1 · L3 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** when a custom role is justified, **design** a custom role from the 15-entity policy table, **and avoid** the common anti-patterns that turn custom roles into a maintenance burden.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Build a role that fits a real job, without proliferating roles." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | M3.1.L1 (policy table) · M3.1.L2 (system roles) |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Design (Create), Avoid (Apply) |

---

## 1. Concept

A **custom role** is a role that the customer's Admin assembles from the 15-entity policy table. It exists alongside the three system roles (Viewer, Editor, Admin) and is invoked when the system roles do not cleanly fit a job function. The system roles cover roughly 80% of role assignments; custom roles cover the remaining 20%.

The mechanics are simple: pick policy entities, pick actions for each, save the role, assign to users. The discipline is harder: most custom-role decisions look obvious at the time and obvious-in-retrospect a year later, but the middle six months are where roles accumulate that nobody can explain.

### When custom is justified

```
SIGNAL                                              CUSTOM-WORTHY?
─────────────────────────────────────────────────────────────────────
"Editor minus one specific action"                  Yes
"Viewer plus one specific action (audit export)"    Yes
"Job function requires unusual combination          Yes
 (audit-log:view + resource:view, nothing else)"
"Editor but only for one team's resources"          No — that's team
                                                    scoping (L4)
"A few engineers do slightly different work"        No — system roles
"Senior engineers want Admin but won't manage RBAC" No — keep at Editor
"Junior engineer should not start/stop resources"   Yes — Viewer with
                                                    nothing else added
```

The rule of thumb: a custom role is justified when no system role's policy set is the right answer **and** a clear, named job function maps to the role. "Roles for Bob and Alice" is a smell; "Compliance Auditor" is a justification.

### Custom role examples

```
"FinOps Analyst" role
  Policies:
    resource:view
    schedule:view, schedule:create, schedule:update
    recommendation:view, recommendation:update, recommendation:update
    report:view
    team:view
    audit-log:view
  Excludes: cloud-account:create, role:*, user:* (admin functions)
  
  Use: full operational power on cost surface, no RBAC management
```

```
"Compliance Auditor" role
  Policies:
    audit-log:view
    resource:view
    schedule:view
    organisation:view
    report:view
  
  Use: forensic visibility across the surface, zero ability to change
  anything. Common for SOC2/ISO auditors during evidence collection.
```

```
"Junior Engineer" role
  Policies:
    resource:view
    schedule:view
    recommendation:view
  
  Use: read-only across operational entities. Promote to Editor after
  the new engineer demonstrates competence (usually 30-90 days).
```

```
"Cost-spike Responder" role
  Policies (Editor minus most):
    resource:view, resource:update (start/stop)
    schedule:view, schedule:create (emergency-stop schedules)
    override:view, override:create
    audit-log:view
    notification:view
  Excludes: recommendation:*, role:*, user:*, cloud-account:*
  
  Use: on-call cost responder. Narrow but high-impact subset.
```

### How to design a custom role

A repeatable five-step process:

```
1. NAME the job-to-be-done
   "FinOps Analyst", "Compliance Auditor" — not "Bob's role"

2. LIST the surfaces the user needs to interact with
   Map each surface to its policy entity (L1 covered the mapping)

3. PICK actions per entity
   View only? Create/update? Apply? Delete?

4. EXCLUDE anything not strictly needed
   Especially: role:*, user:*, cloud-account:*

5. WRITE the role description field
   One paragraph: who is this for, what is it for, why these specific
   policies. Future-you in 6 months will thank you.
```

The description field is the most-skipped step and the most-valuable one. Roles without descriptions become "what does this even do?" within two quarters.

### When NOT to use custom

```
CASE                                  DO INSTEAD
──────────────────────────────────────────────────────────
"Each engineer is slightly different"  Use Editor + team scoping
"This person needs Admin sometimes"   Add a custom role for the
                                       specific Admin capability,
                                       keep base role at Editor
"Engineer wants extra UI shortcuts"   That's a feature ask, not a
                                       role change
"FinOps team has 8 sub-functions"     Cluster to 2-3 patterns; resist
                                       per-person roles
"Need to restrict by resource type"   Not supported — roles act on
                                       entities, not resource types
                                       (use team scoping or filters)
```

### The proliferation trap

A common failure mode: every team request becomes a new custom role. Six months in, the org has 23 custom roles, 14 of them differ by one policy from another, and no one knows which to use for a new hire.

The fix is **role consolidation reviews**, typically quarterly:

```
QUARTERLY ROLE REVIEW (30 minutes):
  1. List all custom roles
  2. For each, count active assignments
  3. Roles with 0 assignments → archive
  4. Roles with 1-2 assignments → consolidate if a similar role
                                   covers the use case
  5. Document remaining roles with current descriptions
```

A healthy org has 3-5 custom roles + 3 system roles. More than 8 custom roles is a smell.

### How ZopNight uses custom roles

Customer telemetry (anonymized) suggests the most common custom-role patterns:

```
PATTERN                                       FREQUENCY
─────────────────────────────────────────────────────────
"Editor minus role:* / user:*"                 32%
"Viewer plus audit-log:view + report:view"   24%
"FinOps Analyst" variant                       18%
"DBA / DataOps" variant                        9%
"Junior / read-only" variant                   7%
Other                                          10%
```

If the customer's first custom role matches one of these patterns, ZopNight's role-template library has a starter for it. Settings → Roles → "Start from template."

---

## 2. Demo

A team adds a custom "Database Administrator" role:

```
NEED: DBAs should view database resources and apply specific recs
      (Multi-AZ migration), but cannot stop/start DBs in production.

CUSTOM ROLE DESIGN:
  Name: Database Administrator
  Description: "DBAs who own database health. Can view database
                resources and apply DB-specific recommendations.
                Cannot start/stop instances — that requires platform-eng
                Editor role for production safety."
  Policies:
    resource:view
    recommendation:view
    recommendation:update
    recommendation:update
    audit-log:view
    schedule:view  (so they can see when DBs are scheduled)
  Excludes:
    resource:update  (cannot start/stop directly)
    schedule:create / update / delete (cannot schedule DBs)

ASSIGN to 3 DBAs. Save.
```

The role takes ~5 minutes to design, days to weeks of safety afterward. The description field is what makes it auditable in 6 months.

---

## 3. Hands-on (6 min)

Identify one job function on your team that does not cleanly fit Viewer / Editor / Admin. Design a custom role for it:

```
ROLE NAME: __________________

JOB-TO-BE-DONE (one sentence):
__________________________________________________________

POLICIES required (list (entity, action) pairs):
  __________________________________________________________
  __________________________________________________________
  __________________________________________________________
  __________________________________________________________

EXPLICITLY EXCLUDED (one sentence per exclusion, why):
  - __________ : because __________
  - __________ : because __________

DESCRIPTION (one paragraph for future reviewers):
__________________________________________________________
__________________________________________________________
```

If you cannot fill in the JTBD and Description, the role is not yet justified.

---

## 4. Knowledge check

### Q1
A FinOps Analyst needs all the Editor permissions but cannot manage cloud-account credentials. The best approach:

A. Use Editor and trust the user not to rotate credentials
B. Build a custom role with all Editor policies EXCEPT `cloud-account:create`, `cloud-account:update`, and `cloud-account:delete`. Save with a clear description.
C. Promote to Admin temporarily
D. Use Viewer and grant exceptions per task

<details>
<summary>Show answer</summary>

**Correct: B.** "Editor minus specific actions" is the most common custom-role pattern. Trust is not a control; explicit exclusion is.
</details>

### Q2
A team has 12 custom roles, several differing by only one policy. The most likely root cause:

A. The team genuinely has 12 distinct job functions
B. Over-customization. Each new request became a role. The fix is quarterly consolidation — cluster similar roles, archive unused ones, get back to 3-5 custom roles.
C. The system roles are inadequate
D. Compliance requires per-person roles

<details>
<summary>Show answer</summary>

**Correct: B.** 12 custom roles in a single team is a maintenance burden and an audit problem. Quarterly review with hard consolidation is the corrective.
</details>

### Q3
Custom role policies are:

A. A separate system from the policy table used by system roles
B. Drawn from the same 15-entity policy table. System roles and custom roles share the policy primitives, which means a custom role can be expressed as "system role X plus/minus these specific policies" — useful for documentation.
C. Customizable down to specific resources
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** One policy table, shared primitives. Custom roles are subsets/supersets expressed in the same vocabulary.
</details>

---

## 5. Apply

Build custom roles in [Settings → Roles → New Custom Role](https://app.zopnight.com/settings/roles/new). The policy picker lists all 15 entities; check the actions you want; the Effective Permissions panel previews the resulting policy set. Save with a description.

Schedule a recurring quarterly role review on your team calendar. Thirty minutes per quarter prevents the proliferation trap.

---

## Related lessons

- [L1 — The 15-entity policy table](L1_policy_table.md)
- [L2 — System roles](L2_system_roles.md)
- [L4 — Team-scoped roles](L4_team_scoped.md) *(next)*
- [L5 — Scope states](L5_scope_states.md)

## Glossary terms touched

[Custom role](../../../reference/glossary/custom-role.md) · [Policy entity](../../../reference/glossary/policy-entity.md) · [Role description](../../../reference/glossary/role-description.md) · [Role consolidation](../../../reference/glossary/role-consolidation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L3
