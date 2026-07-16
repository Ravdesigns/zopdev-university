# The 15-entity policy table

§ T3 · M3.1 · L1 of 6 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** the core policy entities in ZopNight's RBAC table, **map** any product surface to the policy it enforces, **and explain** why the gateway is the single enforcement point.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Design a role model that lets engineers do their jobs without granting more than they need." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | T1 (operator tier) for product surface awareness |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember), Map (Apply), Explain (Understand) |

---

## 1. Concept

ZopNight's authorization model is built around a small, closed table of policy entities — about 15 core ones, plus a handful of specialized entities (budget, dashboard, autoscaler-policy, event-readiness, unit-metric, policy). Every protected endpoint in the product maps to one or more entities. Every role is, fundamentally, a set of `(entity, action)` pairs that the role's members are allowed to invoke.

The table is closed — it cannot be extended at runtime. Adding a new entity requires a schema migration, a code release, and a policy-table update reviewed by the security team. That deliberate closure is what makes the model auditable: when a customer asks "what can your Admin role do?", the answer is a finite list that fits on one page.

### The core entities

Every policy uses the same four verbs — **view / create / update / delete** — on an entity. There are no per-action verbs like "apply" or "cancel"; product actions map onto the uniform verbs (start/stop and apply/dismiss are both `update`).

```
ENTITY                  ACTIONS (uniform verbs)
─────────────────────────────────────────────────────────
resource                view, update            (start/stop = update)
schedule                view, create, update, delete
resource-group          view, create, update, delete
override                view, create, update, delete
cloud-account           view, create, update, delete
notification            view, create, update, delete
team                    view, create, update, delete
role                    view, create, update, delete
user                    view, create, update, delete
organisation            view, update
assignment              view, create, delete
state-history           view
report                  view
audit-log               view
recommendation          view, update            (apply/dismiss = update)
```

The entities cluster into three groups: **operational** (resource, schedule, resource-group, override, recommendation, notification), **administrative** (cloud-account, team, role, user, organisation, assignment), and **read-only forensic** (state-history, report, audit-log). The grouping matters for role design — a typical Editor role gets full operational and partial administrative; a typical Auditor role gets only the forensic group plus selective view rights.

### Why the table stays small

The number is not arbitrary. Earlier iterations of ZopNight had a much larger entity table (43 in the v2 design) where each backend service exposed its own entities. That model produced unpredictable role behavior — granting `cluster:view` did not also grant `node:view`, even though every cluster page rendered nodes. Customers ended up with custom roles that quietly authorized 30+ disconnected entities.

The v3 consolidation merged the table to a small set of stable, user-facing core entities. The mapping from entity to backend services is internal and managed by the gateway. From the customer's perspective, the entities mirror what they see in the UI: a "resource" is a thing on the Resources page; a "schedule" is a thing on the Schedules page. No mental translation required.

### Policy entity coverage

Every protected endpoint in ZopNight maps to one or more policy entities. The gateway enforces this on every request, before the request reaches the backend service.

```
SURFACE                          REQUIRES
─────────────────────────────────────────────────────
Resources page                   resource:view
Resource detail                  resource:view
Start/stop action                resource:update
Schedules page                   schedule:view
Create schedule                  schedule:create
Apply recommendation             recommendation:update
Dismiss recommendation           recommendation:update
Connect cloud account            cloud-account:create
Rotate cloud-account creds       cloud-account:update
View audit log                   audit-log:view
Export audit log                 audit-log:view + report:view
Invite teammate                  user:create
Create custom role               role:create
Assign role to user              role:update + assignment:create
```

A user without the right policy gets a `403 Access Restricted` from the gateway. The backend never sees the request. This is important — defense in depth means even a backend bug cannot bypass authorization.

### Where the gateway enforces

The gateway sits in front of every backend service. Request flow:

```
client → gateway → policy check → backend service
                       ↓
                  if denied: 403 (request stops here)
```

The policy check is a single function call against the policy table, scoped to the authenticated user's roles. The backend services do not re-check. This separation keeps the security boundary unambiguous: one component (the gateway) is responsible for authorization, and that component is hardened, audited, and changes infrequently.

### Default-deny

The policy model is default-deny. If a new endpoint is added without a policy mapping, the gateway rejects all requests to it. This catches accidental over-exposure during development. The frontend will surface a `policy_missing` error during build-time integration tests if a new API call is made without a policy entry in the table.

### How ZopNight uses the table

The policy table is defined in code, not a YAML file: the gateway's Go `PolicyTable()` is the authoritative endpoint-to-policy map, and the frontend's `permissions.js` mirrors it for UI gating. There is no standalone `policy_table.yaml`. Every change is a PR with security review, and the model holds three invariants:
1. Every mutating endpoint maps to a required policy.
2. Every policy uses the uniform view/create/update/delete verbs on an entity.
3. The frontend's `usePermission()` helper matches the gateway's enforcement (catches drift early).

This three-way check (service → gateway `PolicyTable()` → frontend `permissions.js`) keeps enforcement consistent. Beyond the 15 core entities in the table above, the same model covers a few specialized entities (budget, dashboard, autoscaler-policy, event-readiness, unit-metric, policy) — the table is "core 15 plus a short tail," not literally 15 and no more.

---

## 2. Demo

A team-platform engineer wants to start an EC2 instance from the Resources page. The flow:

```
GET /v1/resources                    [gateway] → resource:view → 200
GET /v1/resources/i-0abc             [gateway] → resource:view → 200
POST /v1/resources/i-0abc/start      [gateway] → resource:update → 403
                                                  ^^^ user role lacks resource:update
```

In the policy table, that endpoint is declared as:

```yaml
- path: /v1/resources/{id}/start
  method: POST
  policy: { entity: resource, action: update }
```

The user's effective role is Viewer. Viewer's policy set is:

```yaml
viewer:
  - { entity: resource, action: view }
  - { entity: schedule, action: view }
  - { entity: recommendation, action: view }
  - { entity: report, action: view }
  # ...all view-only across every entity
```

The gateway resolves the request, finds no matching `(resource, update)` permission, returns 403. The frontend's `usePermission('resource', 'update')` would have returned `false`, so the "Start" button would already be disabled, but the gateway is the actual security boundary — disabled UI is a usability nicety, not a security control.

---

## 3. Hands-on (6 min)

Open Settings → Roles in your ZopNight org. Pick any custom role (or System role for reference).

```
ROLE NAME: __________________

Count policies by entity:
  resource:         _____ actions allowed
  schedule:         _____ actions allowed
  recommendation:   _____ actions allowed
  audit-log:        _____ actions allowed
  user / role:      _____ actions allowed (admin-y)

Estimated tier (Viewer / Editor / Admin): __________________

One action this role CAN do that surprises you: __________________
One action this role CAN'T do that surprises you: __________________
```

The "surprises" are usually where role design needs refinement. A FinOps Analyst that cannot dismiss recommendations is over-restricted. A junior engineer that can rotate cloud-account credentials is over-granted.

---

## 4. Knowledge check

### Q1
A user clicks "Apply Recommendation" but sees Access Restricted. The most likely cause:

A. A bug in the recommendation engine
B. Their role lacks `recommendation:update`. Either assign a more permissive role, or grant the specific policy in a custom role. Confirm in Settings → Users → role inspector.
C. Cloud provider rejected the action
D. The recommendation expired

<details>
<summary>Show answer</summary>

**Correct: B.** Access Restricted is the gateway's 403 response, which is always policy-based. The recommendation engine, cloud provider, and expiry would surface different errors. Always start a permission diagnosis at the role inspector.
</details>

### Q2
The 15-entity policy table is enforced where:

A. The frontend only — disabled buttons prevent action
B. The gateway, on every request. The frontend's disabled-state is a UX nicety; the gateway is the security boundary. A scripted client that bypasses the frontend still hits the gateway and is rejected.
C. Each backend service independently
D. A WAF rule outside the application

<details>
<summary>Show answer</summary>

**Correct: B.** Gateway enforcement means a single, audited code path handles all authorization. Frontend gating exists to avoid showing actions the user cannot take, but it is not the security control.
</details>

### Q3
A new endpoint is added without a policy entry. Default behavior of the gateway:

A. Allow all authenticated requests
B. Reject all requests (default-deny). The build pipeline also fails the integration test, catching the omission before merge.
C. Allow only Admin
D. Allow only the endpoint's author

<details>
<summary>Show answer</summary>

**Correct: B.** Default-deny is the safe default and prevents accidental over-exposure. The integration test failing in CI is the second line of defense.
</details>

---

## 5. Apply

The full policy table is browsable in [Settings → Roles → Policy reference](https://app.zopnight.com/settings/roles/policies). The `usePermission()` hook in the frontend is the canonical way for UI components to check rights before rendering. The gateway is the canonical enforcement point.

When designing a new role, start from a System role (Viewer / Editor / Admin) and remove or add specific `(entity, action)` pairs. The diff is the role's defining characteristic.

---

## Related lessons

- [L2 — System roles: Viewer, Editor, Admin, SuperAdmin](L2_system_roles.md) *(next)*
- [L3 — Custom roles](L3_custom_roles.md)
- [L6 — Frontend gating with usePermission](L6_frontend_gating.md)

## Glossary terms touched

[Policy entity](../../../reference/glossary/policy-entity.md) · [Gateway](../../../reference/glossary/gateway.md) · [Default-deny](../../../reference/glossary/default-deny.md) · [RBAC](../../../reference/glossary/rbac.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.1.L1
