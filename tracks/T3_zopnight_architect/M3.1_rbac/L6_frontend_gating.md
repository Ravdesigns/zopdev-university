# Frontend gating with usePermission()

§ T3 · M3.1 · L6 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** how ZopNight's frontend gates UI based on RBAC, **distinguish** the frontend gate (UX) from the gateway check (security), **and reason** about what happens when the two disagree.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Build interfaces that show users only what they can act on, while the gateway remains the security boundary." |
| **Personas** | Platform Engineer · Frontend Engineer · Security/Compliance |
| **Prerequisites** | M3.1.L1-L5 (policy table, roles, scope) |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Remember), Distinguish (Analyze), Reason (Evaluate) |

---

## 1. Concept

The ZopNight frontend uses a single hook — `usePermission()` — to decide whether to render an action. The hook reads the policy set encoded in the user's session token, checks against a required `(entity, action)` pair, and returns a boolean. UI components condition their render on the boolean.

```javascript
const canApply = usePermission('recommendation:apply')

return canApply
  ? <ApplyRemediateButton />
  : <AccessRestrictedHint required="recommendation:apply" />
```

The hook is the convention. Every gated UI element uses it. The result is uniform behavior across the product — every page, every button, every settings section gates with the same primitive.

### How it works

```
1. User authenticates (login, SSO, token refresh).
2. The auth server returns a session token containing the user's
   policy set: the union of policies from all their roles, intersected
   with their scope.
3. The frontend decodes the policy set once at session start (cached
   in memory for the session lifetime).
4. usePermission(entity, action) does an O(1) lookup against the cache.
5. Components render conditionally.

No extra API call per check. Renders are instant.
```

This design matters at scale. A typical Resources page renders 50-100 row-level action gates (Stop, Schedule, Override, View Details, etc.). With an API-per-check design, the page would issue hundreds of requests. With the JWT-cached approach, the page renders in one paint cycle.

### Where it's used

```
SURFACE                      EXAMPLE GATE
──────────────────────────────────────────────────────────
Page-level                   Redirect if user lacks the page's policy
                             (e.g., /audit-log requires audit-log:view)

Top-level CTAs               "Apply All", "Connect Cloud Account",
                             "Invite User"

Row-level actions            Per-row Stop / Schedule / Override
                             icons hidden if action unavailable

Settings sections            "Roles" sub-section hidden from non-Admin
                             "Cloud Accounts" read-only for Editors

Inline forms                 Form fields disabled if user cannot edit
                             specific values (e.g., budget threshold
                             requires budget:update)
```

The principle: **every interactive element is a gate**. If the user cannot perform the action, the element is hidden or rendered as a labeled placeholder. Disabled-but-visible buttons are a UX anti-pattern in this design — they invite the user to click and then frustrate them.

### The "Access restricted" experience

When a user *does* manage to hit a gated route (deep link, bookmarked URL, paste from a colleague), they see an explicit panel:

```
ACCESS RESTRICTED
─────────────────────────────────────────────────────
Your role does not include the permission needed for
this action.

  Required:   recommendation:apply
  Your role:  Viewer (no apply permission)
  Your scope: platform team only
  
To request access, contact your admin or ask to be
added to a role that includes this permission.
```

Specific. Names the missing policy, the current role, the scope. The user can copy this and message their admin instead of opening a generic support ticket. The specificity also surfaces real role-design problems faster: if many users are getting the same "Access restricted" for the same policy, the policy is in the wrong role.

### Frontend gates vs gateway enforcement

The most-asked question in code reviews of this layer: "if the gateway enforces anyway, why gate the frontend at all?" The answer is two-fold.

**1. UX**: showing actions the user cannot take leads to confused clicks and support tickets. Hiding them is cleaner. The user does not have to learn the permission model through trial and error.

**2. Performance**: as noted above, gating in the frontend avoids issuing API calls that the gateway will reject. For row-level actions on a 100-row Resources page, this is the difference between one render and dozens of round-trips.

But — and this is the critical caveat — **frontend gating is not the security boundary**. A scripted client that ignores the frontend can still issue any API call. The gateway rejects it. The frontend gates exist for users; the gateway exists for everyone.

```
LAYER             ROLE                          ROLE TYPE
──────────────────────────────────────────────────────────
Frontend gate     UX, performance                Not security
Gateway check     Authorization decision         Security boundary
Backend service   Trusts the gateway             Not security
```

If a frontend gate were to disagree with the gateway (e.g., frontend cached an old policy set), the worst case is a 403 from the gateway and a corresponding "Access restricted" panel — never an unauthorized action.

### How drift is prevented

Frontend gates and the gateway must reference the same policy primitives. ZopNight prevents drift through:

```
1. Single source: the policy table (yaml in the gateway repo) is
   the only declaration of policies. Frontend imports the policy
   names from a generated TypeScript file.
   
2. Build-time check: if a usePermission() call references a policy
   not in the table, the build fails.
   
3. Integration test: every gated route is tested with a Viewer
   role; expected behavior is "Access restricted." Test fails if
   the gate disagrees with the gateway.
```

Drift bugs that did slip through historically were always one of three patterns: an old policy name renamed but a frontend reference missed; a new endpoint added without a frontend gate; a custom role granting a policy the frontend did not check. All three are now CI-caught.

### How ZopNight uses it

The hook itself is a thin wrapper around a memoized policy lookup:

```typescript
function usePermission(policy: PolicyString, opts?: { resourceId?: string }) {
  const session = useSession();
  const policies = session.policies;  // decoded once at login
  
  if (!policies.has(policy)) return false;
  
  if (opts?.resourceId) {
    // Per-resource scope check (state 1/2/3 from L5)
    return session.scope.includes(opts.resourceId);
  }
  
  return true;
}
```

The per-resource variant handles row-level scope: a team-scoped Editor can apply recs on platform resources but not product resources, and the row-level gate handles that distinction.

---

## 2. Demo

Same product, three users, three rendered surfaces:

```
USER A — Viewer role
  Resources page
    ✓ Resource list visible
    ✗ "Stop" button hidden
    ✗ "Attach Schedule" hidden
    ✗ Bulk action checkboxes hidden
  Recommendations page
    ✓ List visible
    ✗ "Apply" hidden
    ✗ "Dismiss" hidden
  Settings
    ✓ Profile visible
    ✗ "Roles" hidden
    ✗ "Cloud Accounts" hidden

USER B — Editor role, platform team
  Resources page
    ✓ Resource list visible (platform team only)
    ✓ "Stop" visible on platform resources
    ✗ "Stop" hidden on product resources (scope filters them out)
    ✓ "Attach Schedule" visible
  Recommendations page
    ✓ "Apply" visible on platform recs
    ✗ "Apply" hidden on product recs (out of scope)

USER C — Admin role, allResources
  All pages
    ✓ Every action visible
    ✓ "Roles" + "Cloud Accounts" + "Audit Log Export" all visible
```

Three users, three role/scope combinations, three coherent UIs. The same component code; the gates do the differentiation.

---

## 3. Hands-on (6 min)

Open the product in a private window. Log in with two different users (or ask a teammate). Notice differences:

```
DIFFERENCES OBSERVED:
  
  USER 1 ROLE: __________________  USER 2 ROLE: __________________
  
  Pages where buttons differ:
    1. Page: ______________
       USER 1 sees: ______________   USER 2 sees: ______________
       
    2. Page: ______________
       USER 1 sees: ______________   USER 2 sees: ______________
       
  Settings sections that are hidden for one but not the other:
    __________________________________________________________
    
  An action one can take and the other cannot:
    Action: ______________
    Why (which policy?): ______________
```

This exercise builds intuition for which policies gate which UI surfaces.

---

## 4. Knowledge check

### Q1
A button is hidden because the user lacks permission. The user constructs the API call manually using a script. What happens?

A. The script succeeds because the frontend was the only check
B. The gateway rejects with 403 Forbidden. Frontend gating is UX; gateway enforcement is security. The script will see the same authorization failure as a clicked button would.
C. The script gets cached approval
D. Random behavior

<details>
<summary>Show answer</summary>

**Correct: B.** This is the canonical test of the security model. Frontend gates are user-facing; the gateway is the authoritative authorization point. Scripts cannot bypass it because they cannot avoid the gateway.
</details>

### Q2
The "Access restricted" panel includes:

A. Just a generic "not allowed" error
B. The specific policy required, the user's current role, and (if scope-relevant) the scope state. Specific enough that the user can request the right access without a support back-and-forth.
C. A stack trace
D. The raw 403 response

<details>
<summary>Show answer</summary>

**Correct: B.** Specific, actionable error messages are a UX investment that reduces support load and surfaces role-design problems faster.
</details>

### Q3
The `usePermission()` hook reads from:

A. An API call to the gateway on every check
B. The session token (JWT or session cookie), decoded once at login and cached. O(1) lookup per check. No per-render API roundtrip.
C. A local config file
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Caching the policy set at session start is what makes the hook fast enough to use on every gated element. The cache is invalidated when the session token is refreshed (typical lifetime: 8 hours).
</details>

---

## 5. Apply

The hook is invoked by every gated component already; no per-feature configuration needed. As an admin, validate the gates work by inspecting a Viewer's perspective in a private browser window.

If a feature lacks a gate (an Editor sees an Admin-only button), file an issue. The build-time check should have caught it; if it slipped through, the test coverage of that gate is missing.

---

## Related lessons

- [L1 — The 15-entity policy table](L1_policy_table.md)
- [L2 — System roles](L2_system_roles.md)
- [L5 — Scope states](L5_scope_states.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[usePermission](../../../reference/glossary/use-permission.md) · [Session token](../../../reference/glossary/session-token.md) · [Frontend gate](../../../reference/glossary/frontend-gate.md) · [Gateway check](../../../reference/glossary/gateway-check.md)

---

## Module quiz

Complete M3.1 → 10-question module quiz unlocks the **RBAC-Architect** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L6
