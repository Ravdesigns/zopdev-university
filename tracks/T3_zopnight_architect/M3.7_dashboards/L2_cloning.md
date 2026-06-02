# Cloning + customization

§ T3 · M3.7 · L2 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **clone** a preset, **customize** it for org-specific needs, **and reason** about the org-shared (not per-user) dashboard model and its limits.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Get from a generic preset to a dashboard that exactly fits the team's working canvas, without breaking the preset for future updates." |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Leader |
| **Prerequisites** | M3.7.L1 — Four presets |
| **Time** | 9 minutes |
| **Bloom verb** | Clone (Apply), Customize (Create), Reason (Analyze) |

---

## 1. Concept

Presets are immutable templates. To make a dashboard specific to your team, **clone** the preset first — this creates a new saved dashboard — then modify the clone. The original preset stays untouched and continues to be available as a re-clone source if ZopNight updates it.

```
WORKFLOW:
  1. View preset (Executive / Engineering / FinOps / All Widgets)
  2. Click "Clone" → creates a new saved dashboard
  3. Modify the clone:
     - Add widgets from the registry
     - Remove widgets that don't apply
     - Reorder widgets via drag-and-drop
     - Pick widget size (Wide / Standard / Compact)
  4. Save with a meaningful name
  5. Optionally set as org default
```

### Why clone vs edit-in-place

The clone pattern decouples customer customization from preset evolution:

```
PRESETS are versioned by ZopNight:
  As new widgets ship, presets may be updated to include them
  Bug fixes to default widget configurations propagate
  
CUSTOMER CLONES are static:
  They reflect the customer's specific layout decisions
  Don't auto-update when ZopNight updates the preset
  Customer can re-clone the latest preset and re-apply changes
  if they want to pick up updates
```

This means a customer cloning the FinOps preset today gets a snapshot. If ZopNight updates the FinOps preset next year to add a new widget, the customer's clone does not change. They can re-clone the latest preset to see the new layout, then choose whether to migrate.

### Customization options

```
ON A CLONED DASHBOARD (V1):
  Add widgets from the registry (~25 available)
  Remove widgets
  Reorder via drag-and-drop
  Pick widget size: Wide (full row) / Standard (half row) / Compact
  Rename the dashboard
  Set as org default
  Delete the dashboard (with confirmation)

NOT YET CUSTOMIZABLE (V1):
  Free-form grid resize (only standard sizes)
  Per-user dashboard customization (org-shared only)
  Cross-dashboard linking (no drill-through)
  Custom widget creation (only selection from registry)
  Themed colors or branding
```

The V1 scope is deliberately bounded. Cloning + modify gets most customers what they need.

### Org-specific patterns

```
PATTERN A — Single org dashboard
  Clone "FinOps" preset
  Modify to remove widgets the org doesn't use
  Add team-specific widgets if relevant
  Set as org default
  All users land on this one dashboard
  
  Best for:  small to mid-size orgs with one cost-discipline focus

PATTERN B — Multiple persona dashboards
  Clone "Executive" → save as "Leadership Review"; org default
  Clone "Engineering" → save as "Platform Engineering"
  Clone "FinOps" → save as "FinOps Operations"
  Each persona has their own; users bookmark theirs
  
  Best for:  mid-to-large orgs with distinct audiences

PATTERN C — Per-team views
  Clone "Engineering" multiple times
  Each clone is a per-team dashboard with team-scoped filters
  Set per-team default via team detail page
  
  Best for:  large orgs with strong team boundaries
```

Pattern A is the most common. Pattern B emerges as orgs mature. Pattern C is for very large orgs.

### Sharing dashboards

Dashboards in V1 are **org-shared** — anyone in the org can view any saved dashboard. There is no per-user private dashboard.

```
WHAT A USER CAN DO:
  - View any saved dashboard in the org
  - Set the org default (if Admin)
  - Bookmark any dashboard as their personal landing (per-user)
  - Switch between dashboards via the header switcher
  
WHAT A USER CANNOT DO (V1):
  - Create a private dashboard not visible to others
  - Customize a dashboard for themselves only
  - Hide a dashboard from specific users
```

The bookmark + switcher gives per-user flexibility on top of the org-shared dashboards. Each user's "preferred view" is their bookmark; the org has a single default for users without a bookmark.

### Limits

```
PER-ORG CAPS:
  Dashboards:           50
  Widgets per dashboard: 50
  Per-widget config:     4 KiB
  Total layout:          64 KiB

ENFORCEMENT:
  Soft limits at 75% (warning)
  Hard limits at 100% (cannot add more without removing first)
  
WHY THESE LIMITS:
  Performance — too many widgets means slow page loads
  Cognitive — too many dashboards means no one knows which to use
  Storage — bounded per-org footprint
```

Most customers do not approach these limits. If you do, consolidate — multiple 30-widget dashboards are usually two or three well-designed dashboards.

### Widget configuration

Each widget has a small config payload:

```
EXAMPLE — Cost Trend widget config:
  {
    "time_range": "30d",
    "compare_to": "previous_period",
    "team_filter": null,
    "currency_display": "USD"
  }
```

The config is per-widget per-dashboard. The same widget on two different dashboards can have different configs (e.g., one shows team-platform's trend, another shows team-product's). This is what makes per-team Pattern C work.

### Cross-references between dashboards

```
V1 LIMITATION:
  Dashboards do not link to each other directly.
  
WORKAROUND:
  Save bookmarks in a team wiki:
    - "FinOps daily review" → /dashboards/finops-daily
    - "Platform engineering" → /dashboards/platform-eng
    - "Executive monthly" → /dashboards/exec-monthly
  
  Users navigate via URLs; switcher in header for in-product navigation.
```

This is a known gap. Future versions may support drill-through.

### How ZopNight uses cloning

The dashboard backend stores each saved dashboard as a row in `dashboards` with a `layout_json` column containing the widget arrangement. Cloning copies the preset's `layout_json` and assigns a new UUID. Modifications update the `layout_json` in-place. The org's default dashboard is a foreign key from `org_settings.default_dashboard_id`.

For admin troubleshooting, the dashboard's `layout_json` is browsable in the API, which lets support reproduce a customer's view without needing UI access.

---

## 2. Demo

A team's customization workflow:

```
TEAM:    platform-engineering (8 engineers)
GOAL:    Start from FinOps preset; customize for daily engineering use

T+0       Admin opens Dashboards page
          Selects FinOps preset
          
T+10 s    Clicks "Clone preset" button
          Default name suggested: "FinOps (clone)"
          Renames to "Platform Eng Daily"
          
T+30 s    Reviews current widgets:
          ✓ Cost Flow Sankey                Keep
          ✗ Showback by Team                Remove (not relevant daily)
          ✓ Budget Health                    Keep
          ✓ Tag Coverage                     Keep
          ✓ Anomaly Detection                Keep
          ✗ Unit Economics                   Remove
          ✗ Recommendations Summary           Remove (use dedicated view)
          
T+1 min   Adds widgets:
          + Resource Summary (their team's resources)
          + Schedule Execution (last 24h)
          + Top 5 Recommendations (their team)
          
T+1:30    Configures widget-level filters:
          Cost Flow Sankey: team-platform only
          Budget Health: show only platform-team budgets
          Anomaly Detection: scoped to team-platform
          
T+2 min   Reorders via drag-and-drop:
          1. Anomaly Detection (top — alerts)
          2. Cost Flow Sankey (where money goes)
          3. Schedule Execution (operational health)
          4. Resource Summary (today's state)
          5. Budget Health (longer-term tracking)
          6. Tag Coverage (hygiene)
          7. Top Recommendations (action items)
          
T+2:30    Saves
          
T+3 min   Sets as org default (everyone on the platform team
          will land here)
          
T+3 min   Bookmarks for personal use
          
TOTAL ELAPSED: 3 minutes from preset to customized + saved + default
```

The team now has a dashboard that exactly matches their daily workflow.

---

## 3. Hands-on (5 min)

Clone and customize a preset:

```
SELECTED PRESET to clone:    __________

CLONE NAME:    __________ (descriptive, your-team-specific)

WIDGETS TO REMOVE (not relevant to your audience):
  □ __________
  □ __________
  □ __________

WIDGETS TO ADD (from registry):
  □ __________
  □ __________
  □ __________

WIDGET CONFIGURATION CHANGES:
  Widget: __________  Filter: __________
  Widget: __________  Filter: __________

REORDER PRIORITY (top to bottom):
  1. __________
  2. __________
  3. __________

SET AS ORG DEFAULT?    Yes / No (why?)
```

If you can't finish this exercise in 5 minutes, the preset was close to your needs. That's a healthy sign — the presets are designed to be close to common needs.

---

## 4. Knowledge check

### Q1
A team wants to remove "Showback by Team" from the FinOps preset:

A. Edit the preset directly
B. Clone the preset first; modify the clone; save under a new name. Presets are immutable templates that can be re-cloned from the latest version; clones are the customer's customization surface. This pattern lets ZopNight update presets without breaking customer dashboards.
C. File a feature request
D. Cannot be done

<details>
<summary>Show answer</summary>

**Correct: B.** Clone, then modify. The pattern is fundamental to dashboard architecture.
</details>

### Q2
Per-user dashboard customization:

A. Supported in V1
B. NOT supported in V1. Dashboards are org-shared. Users can bookmark their preferred saved dashboard and switch via the header switcher, but cannot create private dashboards. Future versions may add per-user customization.
C. Per-team only
D. Per-role only

<details>
<summary>Show answer</summary>

**Correct: B.** Org-shared model in V1. Bookmarks give per-user flexibility on top of shared dashboards.
</details>

### Q3
Per-org dashboard limits:

A. Unlimited
B. 50 dashboards, 50 widgets per dashboard, 4 KiB per widget config, 64 KiB total layout. Soft warning at 75%, hard limit at 100%. The limits protect performance and prevent dashboard proliferation. Most customers do not approach these caps.
C. 10 dashboards
D. Per-tier limits

<details>
<summary>Show answer</summary>

**Correct: B.** Defined caps. Consolidation, not expansion, is the answer when approaching limits.
</details>

---

## 5. Apply

Clone presets at [Dashboards](https://app.zopnight.com/dashboards) → preset → "Clone preset" button. The clone editor supports drag-and-drop widget arrangement, per-widget configuration, and save-as-default.

For team-specific customizations, develop a naming convention (e.g., "Platform Eng Daily," "FinOps Monthly Review") so users can identify dashboards by purpose.

---

## Related lessons

- [L1 — Four presets](L1_presets.md)
- [L3 — Per-widget RBAC](L3_widget_rbac.md) *(next)*
- [L4 — Default dashboard governance](L4_default_dashboard.md)
- [T3.M3.1.L6 — Frontend gating with usePermission](../M3.1_rbac/L6_frontend_gating.md)

## Glossary terms touched

[Clone](../../../reference/glossary/clone.md) · [Customization](../../../reference/glossary/customization.md) · [Org-shared dashboard](../../../reference/glossary/org-shared-dashboard.md) · [Widget config](../../../reference/glossary/widget-config.md) · [Layout JSON](../../../reference/glossary/layout-json.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.7.L2
