# The three-state scope model

§ T3 · M3.1 · L5 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **predict** the query behavior of each scope state (nil / empty / list), **explain** why the empty state is a distinct concept rather than a degenerate case, **and identify** which state any given user is in.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Debug 'why am I not seeing my resources' by understanding scope state, not just role." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | M3.1.L1-L4 (policy table through team scoping) |
| **Time** | 9 minutes |
| **Bloom verb** | Predict (Understand), Explain (Analyze), Identify (Remember) |

---

## 1. Concept

Every user's data visibility in ZopNight is computed into a single field — the **scope** — which has exactly three valid states. Each state maps to a specific SQL behavior and produces predictable UI results. Knowing which state a user is in answers most "why can/can't I see X?" questions before any deeper RBAC investigation.

```
STATE                  CANONICAL VALUE       SQL EQUIVALENT
──────────────────────────────────────────────────────────────────
1. nil                 null / undefined      no WHERE clause
2. empty               []                    WHERE id IN ()
3. filtered list       [uid1, uid2, …]       WHERE id IN (uid1, …)
```

The three states emerged from production debugging. Many RBAC systems collapse "no scope" and "empty scope" into a single "no access" or single "everything." That collapse is what causes the classic edge cases — a newly-invited user with all data visible, an Admin who is mysteriously filtered, a compliance auditor who can see things they should not. The three-state model makes each of these scenarios distinguishable.

### State 1 — nil (unfiltered)

```
SCOPE:  nil
SQL:    SELECT * FROM resources  (no WHERE on resource_uid)
RESULT: returns every resource in the org

WHO HAS IT:
  - Admin role (which implies allResources=true)
  - Custom role explicitly created with allResources=true
  - Service accounts running org-wide automations
```

`nil` is the "trust this user with everything" state. The gateway short-circuits the scope check; the backend runs an unscoped query. This is fast (no scope-list to compute, no `IN` clause to evaluate) but appropriately gated to a small population of Admin-tier users.

### State 2 — empty (zero visibility)

```
SCOPE:  []
SQL:    SELECT * FROM resources WHERE resource_uid IN ()
        (or equivalent; many DBs short-circuit at the planner)
RESULT: zero rows

WHO HAS IT:
  - Newly invited user, role assigned, no team yet
  - User whose team has been deleted but user not yet reassigned
  - Compliance scenarios requiring total data isolation
                    (e.g., suspended user during investigation)
```

Empty is **intentional, not degenerate**. The user can authenticate, see the product UI, see their profile, see their assigned role — but no business data leaks. This is the safe default during the gap between provisioning and team assignment. Without an explicit empty state, you would have to either grant unscoped access during the gap (insecure) or fail logins (bad onboarding UX).

ZopNight's UI handles the empty state explicitly — pages show "No resources are scoped to you yet. Ask your admin to add you to a team." This is much better than an empty grid with no explanation, which has been the source of several support tickets over the years before the explicit UX was added.

### State 3 — filtered list (team-scoped)

```
SCOPE:  ['eks-cluster-1', 'rds-prod', 'eks-cluster-2', ...]
SQL:    SELECT * FROM resources WHERE resource_uid IN ('eks-cluster-1', ...)
RESULT: matching rows only

WHO HAS IT:
  - Standard team-scoped user (most engineers)
  - Multi-team user (the union of all assigned teams' resources)
  - Resource-group member (the union of all group memberships)
```

This is the most common state in mid-size customer orgs. The `resourceIds` list is computed at request time from team membership, tags, and resource-group assignments — the user does not see the list directly; the gateway computes it transparently.

The performance characteristic matters at scale. A user scoped to 5,000 resource UIDs produces a 5,000-element `IN` clause. ZopNight's gateway batches and caches these computations per-session to avoid recomputing on every request. For exceptionally large scopes (>50,000), the query plan uses a JOIN against a scope-membership table instead — same semantic result, better performance.

### Why three states, not two

A first-draft system might collapse to two states: "nil" (admin-y, sees all) and "list" (everyone else, sees a list). What that collapse loses:

```
SCENARIO                             TWO-STATE PROBLEM          THREE-STATE SOLUTION
─────────────────────────────────────────────────────────────────────────────────────
Newly invited, no team               Sees everything            Empty list → sees nothing
                                     (over-permissioned)
                                     
Suspended pending investigation      Must remove role           Set scope to empty;
                                     entirely (over-correction) role intact for audit
                                     
Admin during a temporary             Must add Admin then       Set allResources=true on
context need                         remove                     existing role; no role change
```

The three-state model is the cleaner abstraction.

### How services consume the scope

Every backend service that returns resource-scoped data follows this pattern:

```python
def get_resources(user_scope: ResourceScope):
    # Short-circuit on Admin / allResources
    if user_scope.allResources:
        return db.query("SELECT * FROM resources WHERE org_id=:org",
                        org=user_scope.org_id)
    
    # Short-circuit on empty — avoid the IN () round-trip
    if user_scope.resourceIds == []:
        return []
    
    # Standard filtered query
    return db.query(
        "SELECT * FROM resources WHERE resource_uid IN :ids",
        ids=user_scope.resourceIds
    )
```

The two short-circuits (`allResources` and empty list) avoid unnecessary database work for the common edge cases. The middle path is the actual filtered query.

### Debugging "why can't I see X"

The first question to ask: which scope state is this user in? Settings → Users → user detail → Effective Scope shows the state explicitly. The diagnosis flow:

```
SYMPTOM                            STATE         FIX
─────────────────────────────────────────────────────────────────
"I see nothing"                    empty         Assign team
"I see everything (uh-oh)"         nil           Verify allResources=true
                                                 is intentional; if not,
                                                 add team scope
"I see some but not all expected"  list          Check team membership
                                                 + tag coverage; the
                                                 missing resources are
                                                 likely untagged
```

Most "missing resource" tickets resolve at the tag-coverage step. The resource exists; the user is correctly scoped; the resource just isn't tagged into any team.

### How ZopNight uses the model

The scope field is computed at session-start and cached for the session's lifetime (typically 8 hours). When a user is added to or removed from a team, the next session refresh picks up the change. A user can force a refresh via Settings → Profile → "Refresh permissions" if they need the change immediately.

```
SESSION TIMELINE:
  T+0      Login → scope computed (state, resourceIds)
  T+1h     User assigned to new team (admin action)
  T+1h     Audit log records the assignment
  T+1h..8h User still sees old scope (cached)
  T+8h     Session expires → next login picks up new scope
  
  OR
  
  T+1h     Admin tells user to refresh
  T+1h     User clicks Refresh Permissions → scope recomputed
```

This caching is the trade for performance. Customers who need immediate scope changes (during an incident, for example) use the Refresh button; routine team changes propagate at next login.

---

## 2. Demo

Three users in the same org, three distinct scope states:

```
USER A — Admin (org owner)
  Role:     Admin (system)
  Teams:    none required
  Scope:    nil
  Sees:     all 12,000 resources in the org
  
USER B — Junior engineer (newly invited)
  Role:     Editor (system)
  Teams:    none yet (still being onboarded)
  Scope:    []
  Sees:     0 resources; UI shows "No resources scoped to you yet"
  
USER C — Platform engineer (steady state)
  Role:     Editor (system)
  Teams:    [platform]
  Scope:    ['eks-cluster-1', 'rds-prod', 'eks-cluster-2', ... 47 UIDs]
  Sees:     47 resources scoped to the platform team
```

Three users, three roles assigned, three different visibility profiles — all expressible cleanly through the scope state.

---

## 3. Hands-on (6 min)

For three specific users on your team, identify their scope state:

```
USER 1: __________
  Expected state (nil / empty / list): __________
  Settings → Users → Effective Scope says: __________
  Match? __________ (if not, investigate)

USER 2: __________
  Expected state: __________
  Effective Scope says: __________
  Match? __________

USER 3: __________
  Expected state: __________
  Effective Scope says: __________
  Match? __________
```

If any expected ≠ actual, that user is in the wrong state. Common causes: team assignment missing, tag drift, custom role with unexpected `allResources=true`, stale session cache.

---

## 4. Knowledge check

### Q1
A user is reported as "sees no resources." Their scope is `[]`. The right diagnosis:

A. Bug in scope computation
B. The user has no team assignment yet (or team has no resources). Assign them to a team with tagged resources; refresh permissions; they will see data.
C. Their role is wrong
D. Their cloud account is disconnected

<details>
<summary>Show answer</summary>

**Correct: B.** Empty scope = no team membership, common after invitation but before team setup. Role is unrelated; the role defines actions, not visibility.
</details>

### Q2
A user has `scope = nil`. What does that mean?

A. They are restricted
B. No filter applied; the user sees every resource in the org. Typically Admins or users with explicit `allResources=true`. Verify this is intentional — `nil` over-grants if assigned by mistake.
C. Bug
D. Resources are being filtered out

<details>
<summary>Show answer</summary>

**Correct: B.** Nil = no scope filter. Verify the grant is intentional. The most common over-permission incident is `allResources=true` set on a custom role for "just this one user" and then never revoked.
</details>

### Q3
A new user is invited, role assigned, but no team yet. Their initial scope state:

A. nil (sees everything)
B. `[]` (empty list — sees nothing). They can log in, see UI chrome, but no data leaks until a team is assigned. The UI shows an explicit "no resources scoped" message.
C. Cannot log in
D. Default to Admin

<details>
<summary>Show answer</summary>

**Correct: B.** Empty list is the safe default during the onboarding gap. Login works; data is invisible; admin completes team assignment; next session refresh picks up resources.
</details>

---

## 5. Apply

Inspect any user's scope state at [Settings → Users → user detail → Effective Scope](https://app.zopnight.com/settings/users). For ongoing hygiene, run a quarterly report of users in `nil` state (over-permissioned) and `[]` state (under-onboarded). Both should be small intentional populations.

---

## Related lessons

- [L4 — Team-scoped roles](L4_team_scoped.md)
- [L6 — Frontend gating with usePermission](L6_frontend_gating.md) *(next)*
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)
- [T3.M3.4.L3 — Cross-account discovery](../M3.4_multi_account/L3_cross_account_discovery.md)

## Glossary terms touched

[Scope state](../../../reference/glossary/scope-state.md) · [resourceIds](../../../reference/glossary/resource-ids.md) · [allResources flag](../../../reference/glossary/all-resources-flag.md) · [Session permissions](../../../reference/glossary/session-permissions.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L5
