# Per-widget RBAC

§ T3 · M3.7 · L3 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **explain** the placeholder pattern for gated widgets, **identify** which widgets each role can see, **and reason** about layout consistency versus hidden widgets.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Design a dashboard that shows the right widgets to each role without leaking data the role shouldn't see." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | M3.1.L1-L6 (RBAC fundamentals) · M3.7.L1-L2 (presets, cloning) |
| **Time** | 9 minutes |
| **Bloom verb** | Explain (Understand), Identify (Remember), Reason (Analyze) |

---

## 1. Concept

Some dashboard widgets surface data that not all users should see — audit logs, RBAC configuration, raw cost data scoped to other teams. **Per-widget RBAC** controls visibility on the same dashboard, so a dashboard can be designed once and rendered with consistent layout across roles, with each user seeing only the widgets they have permission for.

```
EXAMPLE — Dashboard with multiple gated widgets:

  WIDGETS ON DASHBOARD       REQUIRES
  ──────────────────────────────────────────────
  Cost Trend                  report:view
  Top Costly                  resource:view
  Recommendations             recommendation:view
  Audit Log                   audit-log:view
  Budget Health               budget:view
  Showback by Team             report:view
  
WHAT EACH ROLE SEES:

Junior engineer (Viewer):
  Cost Trend                   shown
  Top Costly                   shown
  Recommendations              shown (view; not apply)
  Audit Log                    placeholder ("Access restricted")
  Budget Health                placeholder
  Showback by Team             shown

Admin:
  All six widgets              all shown

Finance Partner (Viewer + budget-specific custom role):
  Cost Trend, Top Costly        shown
  Recommendations              placeholder
  Audit Log                    placeholder
  Budget Health                shown (their custom role grants this)
  Showback by Team              shown
```

### How it works

```
DECLARATION:
  Each widget declares its required policy in the widget registry.
  Example: AuditLogWidget.requiredPolicy = "audit-log:view"
  
RENDERING:
  When the dashboard renders, for each widget:
    if user.has(widget.requiredPolicy):
      render widget normally (fetch data, display)
    else:
      render "Access restricted" placeholder
      (no data fetch; no API call; no 403 in logs)
      
SECURITY:
  The frontend gating decides what to render
  The gateway still enforces — if the user somehow bypasses the
  gate and calls the widget's data API, the gateway rejects.
  Defense in depth (M3.1.L6).
```

### Widget-to-policy mapping

```
WIDGET                          REQUIRED POLICY
──────────────────────────────────────────────────────────────────
Cost Trend                       report:view
Top Costly Resources             resource:view
Recommendations                  recommendation:view
Schedule Execution               schedule:view
Resource Summary                  resource:view
Anomaly Detection                 anomaly:view (or report:view)
Budget Health                     budget:view (or report:view +
                                  budget context)
Showback by Team                  report:view
Tag Coverage                      report:view
Unit Economics                    report:view
Audit Log                         audit-log:view
                                  (often Admin-only)
RBAC Summary                      role:view (Admin-only)
Cloud Accounts Summary           cloud-account:view
                                  (Admin-only)
Notifications                     notification:view
PAT Inventory                     pat:view (Admin-only)
```

Some widgets (Audit Log, RBAC Summary, Cloud Accounts, PAT Inventory) are typically Admin-only. The placeholder pattern means they can appear on a shared dashboard without showing data to non-Admins.

### The "Access restricted" placeholder

When a widget is gated, the UI renders an explicit, helpful message:

```
┌─────────────────────────────────────────────┐
│  Audit Log                                   │
│  ──────────────────────────────────────────  │
│                                              │
│  Access restricted to this widget            │
│                                              │
│  Required:    audit-log:view                  │
│  Your role:   Engineer                       │
│  Current:     no audit-log access              │
│                                              │
│  Contact your admin to request access.       │
│                                              │
└─────────────────────────────────────────────┘
```

The placeholder is **explicit and actionable**. It names the missing policy, the user's current role, and the path to request access. This is much better than an empty widget (which leaves the user confused about why they see nothing) or a generic "no permission" message (which doesn't tell them what to ask for).

### Placeholder vs hide

The default is to render a placeholder. Customers can also configure widgets to **hide entirely** for specific roles — the widget disappears from the layout rather than showing a placeholder.

```
PLACEHOLDER (default):
  Widget visible on layout
  Shows "Access restricted" with the missing policy
  Maintains layout consistency across roles
  Users see what they could access if granted permission

HIDE (optional, customer-configured):
  Widget removed from layout entirely for that role
  Layout collapses around the missing widget
  Cleaner UI for the role
  But: layout shifts between roles can be confusing

WHEN TO HIDE vs PLACEHOLDER:
  HIDE — when the widget is genuinely irrelevant to the role
         (e.g., RBAC Summary on a dashboard mostly viewed by FinOps)
  PLACEHOLDER — when the widget is relevant in principle but the
                user doesn't yet have access
                (e.g., Audit Log on the Engineering dashboard —
                engineers don't have access, but they may want to
                request it for a specific investigation)
```

Default is placeholder. Hide is a per-widget override configured in dashboard editor.

### Why frontend gating + backend enforcement

The placeholder is a frontend decision; the gateway is the security boundary. Both exist for distinct reasons:

```
FRONTEND PLACEHOLDER:
  UX: don't show empty widgets / 403 errors
  Performance: don't issue API calls that will fail
  Transparency: tell the user what's missing

BACKEND GATEWAY:
  Security: actually enforce that the user can't fetch the data
  Defense in depth: if the frontend has a bug, the gateway still
                    prevents data leak
```

A scripted client that ignores the frontend can still attempt to fetch the widget's data; the gateway rejects with 403. The frontend gate is a UX nicety; the gateway is the security control.

### Configuring per-widget RBAC

```
CUSTOMER CONTROLS:
  
  1. Role assignment (M3.1.L2-L3)
     Which policies a user has via their role(s)
  
  2. Per-widget visibility (per dashboard, per role)
     Customer can choose Hide vs Placeholder for any widget
     Configured in dashboard editor → widget settings
     Default: placeholder for all gated widgets

ZOPNIGHT-MANAGED:
  
  Widget registry declares the required policy
  Customers cannot override the policy (it's a security decision,
  not a customization decision)
```

The split: ZopNight defines the security policy per widget; customer chooses how to render denied widgets (hide vs placeholder).

### How ZopNight uses widget RBAC

The widget registry is in code; each widget exports its required policy. The dashboard renderer reads the user's policy set and decides per widget. For new widgets, the policy declaration is required as part of the widget contract — a widget without a declared policy fails build-time CI.

The placeholder rendering is shared UI code; customer customization (hide vs placeholder) is per-dashboard per-widget metadata in `layout_json`.

---

## 2. Demo

A team dashboard rendered for three different roles:

```
DASHBOARD: "Platform Eng Daily" (cloned from FinOps preset)
WIDGETS:
  1. Cost Trend                 (report:view)
  2. Recommendations             (recommendation:view)
  3. Top Costly                  (resource:view)
  4. Schedule Execution          (schedule:view)
  5. Resource Summary             (resource:view)
  6. Audit Log                   (audit-log:view)
  7. Budget Health                (budget:view)

VIEW A — Admin user:
  All 7 widgets shown with data
  Layout: full
  
VIEW B — Engineer (system Editor role):
  Widgets 1-5: shown with data
  Widget 6 (Audit Log): "Access restricted" placeholder
  Widget 7 (Budget Health): shown with data (budget:view via report:view)
  Layout: full (placeholder occupies same slot)
  
VIEW C — Viewer (junior, just hired):
  Widget 1 (Cost Trend): shown with data
  Widget 2 (Recommendations): shown read-only (view, no apply)
  Widget 3-5: shown with data
  Widget 6 (Audit Log): placeholder
  Widget 7 (Budget Health): placeholder
  Layout: full

OBSERVATIONS:
  - Same dashboard URL renders differently per role
  - Layout consistent (no shifting widgets per role)
  - Each user sees the same widget set; gated widgets show why
  - New engineer (Viewer) sees the full landscape of what's
    available; can request promotion to Editor for action capabilities
```

The placeholder pattern is what makes the dashboard usable for everyone.

---

## 3. Hands-on (5 min)

Verify per-widget RBAC on your dashboard:

```
DASHBOARD reviewed:    __________

WIDGETS visible to you:
  □ __________ (shown / placeholder?)
  □ __________ (shown / placeholder?)
  □ __________ (shown / placeholder?)

If you have admin access:
  Open the same dashboard in a private window as a Viewer
  Note which widgets render vs which show placeholder
  Match against the widget-to-policy table

WIDGETS YOU'D WANT TO ACCESS but currently see as placeholders:
  □ __________ (would require policy: __________)
  □ __________ (would require policy: __________)

REQUEST plan:
  Who to contact: __________
  Justification:   __________
```

If you don't have admin access to test multi-role views, ask an admin to demonstrate the difference in a sync — it's a clear demonstration of the RBAC model.

---

## 4. Knowledge check

### Q1
A user without `audit-log:view` opens a dashboard with the Audit Log widget. What do they see?

A. An empty widget area
B. The "Access restricted" placeholder explicitly stating the required policy (`audit-log:view`) and the user's current role. Layout consistent with admin view; data gated. The widget never tries to fetch data — no 403 in logs.
C. A 403 error message
D. The widget disappears entirely

<details>
<summary>Show answer</summary>

**Correct: B.** Placeholder, not error. Explicit and helpful, matches the M3.1.L6 frontend-gating philosophy.
</details>

### Q2
The placeholder pattern (vs hiding the widget):

A. Is confusing — users see widgets they can't use
B. Is intentional. Keeps layout consistent regardless of role; shows users what they could access if granted permission; surfaces the path to request access. Customers can choose Hide for specific widgets per dashboard if cleaner layout matters more than visibility.
C. Random
D. Disabled by default

<details>
<summary>Show answer</summary>

**Correct: B.** Intentional pattern; trade-off favors visibility + actionable error message.
</details>

### Q3
Per-widget RBAC is configured via:

A. Manual setting per user
B. The widget registry declares the required policy (ZopNight-managed; not customer-overridable for security reasons). Customer controls via role assignment (which policies users get) and per-widget visibility flag (Hide vs Placeholder for that widget on that dashboard).
C. Per-dashboard custom roles
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Registry-declared policy + customer role assignment + visibility flag. Three layers; clean separation of concerns.
</details>

---

## 5. Apply

Per-widget RBAC is automatic; no per-dashboard configuration is required to enable it. Customer-configurable Hide vs Placeholder is in the dashboard editor's per-widget settings.

For multi-role customer demos, show the same dashboard from a Viewer's window vs an Admin's window — the placeholder pattern is a clear demonstration of the RBAC model in action.

---

## Related lessons

- [L1 — Four presets](L1_presets.md)
- [L2 — Cloning and customization](L2_cloning.md)
- [L4 — Default dashboard governance](L4_default_dashboard.md) *(next)*
- [T3.M3.1.L6 — Frontend gating with usePermission](../M3.1_rbac/L6_frontend_gating.md)

## Glossary terms touched

[Per-widget RBAC](../../../reference/glossary/per-widget-rbac.md) · [Widget registry](../../../reference/glossary/widget-registry.md) · [Required policy](../../../reference/glossary/required-policy.md) · [Placeholder pattern](../../../reference/glossary/placeholder-pattern.md) · [Hide vs Placeholder](../../../reference/glossary/hide-vs-placeholder.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.7.L3
