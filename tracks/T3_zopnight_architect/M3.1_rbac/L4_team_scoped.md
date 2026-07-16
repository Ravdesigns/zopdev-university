# Team-scoped access

§ T3 · M3.1 · L4 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** team-scoped access using the `allResources` and `resourceIds` fields, **distinguish** team scoping from role scoping, **and reason** about the three-state scope model (nil / empty / list).

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Give each team access to their own slice without leaking the rest of the org." |
| **Personas** | Platform Engineer · FinOps Lead · Security/Compliance |
| **Prerequisites** | M3.1.L1-L3 (policy table, system roles, custom roles) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Distinguish (Analyze), Reason (Evaluate) |

---

## 1. Concept

A role answers the question "**what actions** is this user allowed to take?" A team scope answers a separate question: "**which resources** are those actions allowed on?" The two are independent dimensions, and confusing them is the most common RBAC-design mistake in mid-size ZopNight customers.

Team scoping restricts a user's effective policy set to a subset of the org's resources. A user with the Editor role and a team scope of `platform` can apply Editor actions only to resources owned by the platform team; the rest of the estate is invisible to them.

```
SCOPE FLAG          MEANING
───────────────────────────────────────────────────────
allResources=true   The user can act on ALL resources in the org.
                    Used for cross-team roles (Admin, FinOps Lead).
                    
allResources=false  The user is restricted to a specific set.
                    Then resourceIds[] determines that set.
                    
resourceIds=[...]   The explicit list of resource UIDs the user
                    can see and (per role) act on. Computed at
                    request-time from team membership.
```

### How team-scoped access works in practice

A typical setup:

```
USER: jane@platform.com
ROLE: Editor
TEAMS: [platform]
SCOPE FIELDS (computed):
  allResources = false
  resourceIds  = [resources tagged team=platform] +
                 [resources in resource-groups tagged team=platform]

EFFECT when Jane logs in:
  Resources page          filtered to platform's resources only
  Recommendations         only on platform's resources
  Audit log               only platform-relevant events
  Org-wide rollups        hidden or aggregated without other teams
  Cost dashboards         scoped to platform spend
```

The scope follows from team membership. Resources tagged `team=platform` (or grouped into a platform-owned resource-group) are scoped to Jane automatically. Adding a new resource with the right tag immediately becomes visible to Jane; no role re-assignment needed.

### The three-state scope model

ZopNight's scope field has three valid states, each with distinct database-level behavior:

```
STATE             SQL EQUIVALENT          MEANING
──────────────────────────────────────────────────────────────────
nil (null)        no WHERE clause          User sees everything.
                                           Equivalent to allResources=true.
                                           
[] (empty)        WHERE id IN ()           User sees nothing.
                                           Total isolation. Common for
                                           newly-invited users before
                                           team assignment.
                                           
[uid1, uid2,…]    WHERE id IN (uid1,...)   User sees only listed
                                           resources. The normal
                                           team-scoped state.
```

The empty-list state is intentional: it is the safe default for a user with an assigned role but no team yet. They can log in, see the product structure, but no data leaks until they are added to a team. Without this state, you would either have to grant everything (insecure) or fail logins (bad UX).

### Team scoping vs custom roles

```
PROBLEM                             SOLUTION
──────────────────────────────────────────────────────────────
"Engineer can do Editor actions     Team scoping. Role stays Editor;
 but only on their team's stuff"     scope restricts the data.
 
"Engineer can do Editor actions     Custom role. Edit the actions,
 but cannot apply recommendations"   not the data scope.
 
"Engineer can do Editor actions     BOTH. Custom role for the action
 on their team's stuff and cannot    restriction; team scope for the
 apply recommendations"              data restriction.
```

This split is what makes the model composable. The role describes *capability*; the scope describes *visibility*. Combining them lets you express arbitrary "role × team" matrices without exploding role count.

### Cross-team users

For practitioners who legitimately need to span multiple teams (a FinOps lead reviewing all teams' spend, a security auditor investigating an incident across teams):

```
OPTION 1: Multiple team memberships
  jane@finops.com
    teams: [platform, product, data]
    resourceIds = union of all three teams' resources
  
  Pro: bounded view (still excludes unassigned teams)
  Con: must add team manually as new teams are created

OPTION 2: Admin role
  jane@finops.com
    role: Admin
    allResources = true
  
  Pro: automatic visibility of new teams
  Con: also grants RBAC-management capability; usually too broad
       for FinOps practitioners

OPTION 3: Custom "Cross-team Viewer" role
  Custom role with view-only across operational entities
  Combined with allResources=true
  
  Pro: cross-team visibility without RBAC-management power
  Con: requires custom-role design (L3)
```

Most customers settle on option 3 for FinOps leads and option 2 for true org admins. Option 1 is brittle but occasionally right when a practitioner truly only needs two or three teams.

### Resource discovery and team scope

When a new resource is discovered (cloud-account sync), its team scope is determined by:

```
PRIORITY                               SOURCE
──────────────────────────────────────────────────────────
1. Explicit tag: team=<name>           Cloud provider tag
2. Resource group membership          ZopNight UI assignment
3. Account-level default              Cloud account → default team
4. Untagged (no team scope)            Stays in org-wide pool
```

Untagged resources are visible only to users with `allResources=true`. This is intentional: it surfaces tagging gaps. A team-scoped user simply does not see the untagged resource until tagging catches up.

### How ZopNight uses the scope model

The scope check happens after the role check, in the same gateway middleware:

```
client → gateway →  policy check (role → can action)
                    scope check  (scope → can see this resource)
                    → backend
                       ↓
                  if scope denies: 404 (looks like not-found, by design)
```

Returning 404 rather than 403 on scope failures is deliberate. A 403 would leak that the resource exists; a 404 keeps existence private. The role-permission 403 only fires when the user is trying to perform an action they cannot perform anywhere, not when they are trying to perform a valid action on an out-of-scope resource.

---

## 2. Demo

A mid-size org's structure after a clean team scope design:

```
ORG: Acme Corp
─────────────────────────────────────────────────────────────
TEAMS:
  platform     (6 engineers + 1 lead)  scope=platform
  product       (12 engineers + 1 lead) scope=product
  data          (4 engineers + 1 lead)  scope=data
  
CROSS-TEAM ROLES:
  finops-lead  (1 person)  Custom "Cross-team Viewer"
                            + recommendation:update on all
  security      (2 people)  Custom "Compliance Auditor"
                            + audit-log:view on all
  org-admin     (2 people)  Admin (allResources=true)

EFFECT:
  Platform engineer sees only platform's resources
  FinOps lead sees all teams' resources, can apply recs
  Security can view all audit logs, modify nothing
  Org admins can do everything (rotation, role mgmt)

UNTAGGED RESOURCES:
  Visible to org-admins and security; invisible to team-scoped users
  Surfaces tagging gaps automatically
```

---

## 3. Hands-on (6 min)

Map your org's structure:

```
TEAMS (list):
  __________________________________________________________

PER-USER scope decisions:
  USER                ROLE         SCOPE (team / cross / all)
  __________________  ___________  ___________________________
  __________________  ___________  ___________________________
  __________________  ___________  ___________________________

CROSS-TEAM USERS — for each, choose Option 1/2/3 from the concept:
  __________________  Option: ___ (why?)
  __________________  Option: ___ (why?)

UNTAGGED RESOURCES (estimated count): _____
  Action plan: tag them or accept them in the org-wide pool
```

The untagged-resource count is the team-scope hygiene number to track quarterly. Healthy orgs trend toward zero.

---

## 4. Knowledge check

### Q1
A user has `team_id = platform` and `allResources = false`. What do they see?

A. Nothing — the scope is restrictive
B. Only resources tagged `team=platform` (and resources in platform-owned resource groups). Computed at request time from team membership.
C. All resources in the org
D. Only resources they created

<details>
<summary>Show answer</summary>

**Correct: B.** Team scoping computes `resourceIds` from team membership + tags + group assignments. Adding a new platform-tagged resource immediately becomes visible.
</details>

### Q2
A FinOps lead needs to see cost across all teams but should not manage RBAC. Best approach:

A. Grant the Admin role
B. Custom "Cross-team Viewer" role (view-only across operational entities) with `allResources=true`. The role excludes role/user/cloud-account management. Scope grants visibility; role limits capability.
C. Multiple team memberships across every team
D. Editor with a manual filter

<details>
<summary>Show answer</summary>

**Correct: B.** The combination of a narrow custom role and broad scope is the cleanest way to express "broad view, narrow capability." Admin would over-grant; multi-team is brittle as teams are added.
</details>

### Q3
The scope state `[]` (empty list) means:

A. All resources are visible
B. Total isolation — user sees no resources. Common for newly-invited users between role assignment and team assignment. Safe default that prevents accidental visibility.
C. A bug in scope computation
D. Equivalent to `nil`

<details>
<summary>Show answer</summary>

**Correct: B.** Empty-list is a deliberate state. It produces a `WHERE id IN ()` query — valid SQL, zero results. Different from `nil` (no filter, sees everything).
</details>

---

## 5. Apply

Manage team scopes in [Settings → Teams](https://app.zopnight.com/settings/teams). Add users to teams; tag resources with `team=<name>` for automatic membership; the resource-group editor lets you assign resources without tags when team ownership is implicit.

Quarterly hygiene: review the `untagged` resource count. Trending up is a signal of weakening team-scoping discipline.

---

## Related lessons

- [L3 — Custom roles](L3_custom_roles.md)
- [L5 — Scope states (nil / empty / list)](L5_scope_states.md) *(next — covers the three-state model in depth)*
- [L6 — Frontend gating with usePermission](L6_frontend_gating.md)
- [T3.M3.5.L2 — Team attribution](../M3.5_showback/L2_team_attribution.md)

## Glossary terms touched

[Team scope](../../../reference/glossary/team-scope.md) · [allResources flag](../../../reference/glossary/all-resources-flag.md) · [resourceIds](../../../reference/glossary/resource-ids.md) · [Cross-team role](../../../reference/glossary/cross-team-role.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L4
