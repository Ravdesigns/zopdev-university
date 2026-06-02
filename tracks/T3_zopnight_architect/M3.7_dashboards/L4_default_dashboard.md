# Default dashboard governance

§ T3 · M3.7 · L4 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** the org default dashboard, **distinguish** org default from per-user bookmarks, **and reason** about when to change the default vs let users bookmark their own.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Decide what new joiners and casual visitors see when they land on /dashboard, and own the change process for that decision." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader |
| **Prerequisites** | M3.7.L1-L3 (presets, cloning, per-widget RBAC) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Distinguish (Analyze), Reason (Evaluate) |

---

## 1. Concept

Every ZopNight org has exactly one **default dashboard**. This is the dashboard new users land on when they first sign in, and the one any user sees on `/dashboard` if they haven't bookmarked a specific dashboard. The default is set by an Admin; the decision affects every user's first impression of cost data.

```
DEFAULT DASHBOARD:
  - One per org
  - Set by Admin (requires dashboard:update policy)
  - Stored as a pointer in org_settings.default_dashboard_id
  - Value: either a preset key (executive / engineering / finops /
           all_widgets) OR a UUID of a saved customized dashboard
  
USERS LAND ON THE DEFAULT when:
  - First sign-in (no bookmark yet)
  - Navigating to /dashboard without a specific dashboard URL
  - Bookmark not set
```

### Setting the default

```
PROCESS:
  1. Open Dashboards page
  2. Pick any preset or any saved dashboard
  3. Click "Set as org default" (admin-only button)
  4. Confirm the change
  5. All users now land on the new default

REQUIRES:
  Admin role with dashboard:update policy
  (or custom role with the policy)

EFFECT:
  Immediate. Next /dashboard visit picks up the new default.
```

The change is one click; the impact is org-wide. Most customers do this once per quarter as the team's needs evolve.

### Changing the default

```
EVERY CHANGE IS AUDITED:
  - Who changed it
  - When
  - From what to what (old dashboard → new dashboard)
  - The change appears in M3.3 audit log
  
EASY TO REVERT:
  If the new default causes confusion (users complain, or new
  joiners report disorientation), revert to the previous in 30 seconds.
  
NO USER-DATA IMPACT:
  Changing the default does not delete other saved dashboards.
  Users' bookmarks remain pointing at their preferred dashboards.
```

The reversibility is what makes default-changing low-risk. A team that experiments with "what if our default were the FinOps preset" can revert to "Engineering preset" without any data loss.

### What the default does NOT do

This is the most important fact about defaults:

```
DEFAULT DOES NOT:
  Lock users to the dashboard          → users can switch
  Prevent users from switching         → header switcher always works
  Force users to view it every visit   → personal bookmarks override
  Hide other dashboards                 → all saved dashboards visible
  Affect per-user customization         → not supported in V1 anyway
  Apply different defaults per role     → one default for the whole org

USERS RETAIN FLEXIBILITY:
  Switch dashboard via header switcher
  Bookmark a different one as their personal landing
  Navigate directly via URL
  Visit any saved dashboard
```

The default is the **org's primary landing**; each user's bookmark is their **personal landing**. The two can differ. The default matters most for new joiners and casual visitors.

### Common default patterns

```
PATTERN A — All Widgets (out of the box)
  System default for new orgs.
  Best for: orgs early in the evaluation, mixed needs.
  Transition path: as the team matures, switch to a focused preset.

PATTERN B — FinOps preset
  Best for: orgs with a dedicated FinOps practice.
  Most-used pattern (42% of mature customers).

PATTERN C — Executive preset
  Best for: orgs where leadership drives the cost conversation.
  Common in finance-led orgs.

PATTERN D — Custom cloned dashboard
  Best for: orgs with specific needs not covered by presets.
  Common after 6-12 months of ZopNight use; reflects accumulated
  learning about what matters to the team.
```

There is no "right" default. The right default for your org is the one that makes the most-common viewer's life easier.

### Multi-role considerations

If different roles need different views, the default cannot satisfy everyone. The solution is **bookmarks**:

```
ORG DEFAULT:     The FinOps preset (org's primary landing)
USER BOOKMARKS:  
  - FinOps Lead's bookmark: FinOps preset (same as default)
  - Engineering Lead's bookmark: Engineering preset
  - Executive's bookmark: Executive preset
  - Junior engineer's bookmark: Engineering preset

NEW JOINER:
  Lands on org default (FinOps preset) on first sign-in
  Explores; discovers Engineering preset; bookmarks it
  Subsequent visits go to Engineering preset (their bookmark)
  
RESULT:
  Each user's experience is personalized; org maintains a sensible
  default for newcomers.
```

This works because the bookmark system is per-user. The default is the org-level decision; bookmarks are personal preferences.

### Tenant cascade

```
IF THE ORG IS DELETED (rare):
  The default_dashboard_id pointer is cleared
  No orphaned configuration in the database
  
IF THE DEFAULT DASHBOARD IS DELETED:
  ZopNight requires reassigning the default before allowing deletion
  Prevents leaving the org with no default
  
IF A USER'S BOOKMARKED DASHBOARD IS DELETED:
  The user's next visit falls back to the org default
  No error; graceful degradation
```

These edge cases are handled cleanly. Customers rarely encounter them but the behavior is predictable when they do.

### Changing the default — when and how often

```
GOOD REASONS TO CHANGE:
  - Org evolves from generic to specific (All Widgets → FinOps preset)
  - Audience focus shifts (engineering-led → leadership-led)
  - Team feedback shows people land on wrong dashboard
  - New custom dashboard is built and validated

BAD REASONS:
  - Individual preference (use a bookmark instead)
  - Trying to "force" everyone to use a specific view (V1
    doesn't lock users; they'll just bookmark something else)
  - Frequent experimentation (creates churn; pick one and commit
    for a quarter)

CADENCE:
  Quarterly review is typical
  Annual review for stable orgs
  Each change documented in team wiki with rationale
```

### How ZopNight uses the default setting

The default is stored as `default_dashboard_id` in the `org_settings` table. The dashboard render path checks for a user bookmark first; if none, falls back to the org default. If the default's preset key is `executive`, the latest version of the Executive preset is rendered; if a UUID, the saved dashboard with that UUID.

For tenant-isolation guarantees, the org's default cannot point to a dashboard owned by another org. This is enforced at write time.

---

## 2. Demo

A typical organizational journey:

```
ORG: Acme Corp; new ZopNight customer
TIMELINE:

T+0 (onboarding day):
  Default: "All Widgets" (system default)
  Audience: new ZopNight users exploring everything
  
T+1 week:
  Admin notices the team mostly uses the FinOps surfaces
  Switches default to "FinOps preset"
  Audit log records the change: "all_widgets → finops"
  
T+1 month:
  Admin clones FinOps preset to "FinOps Acme Daily"
  Modifications:
    Removed "Quick Insights" (not used)
    Added "Resource Summary" (team finds it useful)
    Reordered to put Cost Flow first
  Sets the clone as default
  
T+3 months:
  Some users have bookmarked different views:
    Engineering team → Engineering preset
    CFO → Executive preset
    Compliance → custom "Audit Review" dashboard
  Each user lands on their bookmark
  New joiners still land on "FinOps Acme Daily"
  
T+6 months:
  Admin reviews; "FinOps Acme Daily" is still the right default
  Documents the rationale in team wiki
  
T+9 months:
  Executive leadership wants their own focused dashboard
  Admin clones Executive preset → "Acme Monthly Review"
  Does NOT set as default (org-wide default remains FinOps-focused)
  CFO + execs bookmark "Acme Monthly Review"
  
T+1 year:
  Stable. Default is FinOps Acme Daily. Personal bookmarks per audience.
  Quarterly review confirms current default is right.
```

Two changes in 12 months. Each documented; each reversible. Each user's preference accommodated via bookmarks.

---

## 3. Hands-on (5 min)

Check and adjust your org's default:

```
CURRENT ORG DEFAULT:    __________

IS THIS THE RIGHT DEFAULT for your org?
  □ Yes — it matches the most-common audience's needs
  □ Maybe — has been default a while; review needed
  □ No — should change to: __________

YOUR PERSONAL BOOKMARK:
  Current bookmark:    __________
  Matches default?     Yes / No
  If no — that's normal; bookmarks are personal preferences

QUARTERLY REVIEW DATE: __________
  Set a calendar reminder to re-evaluate the default

DOCUMENTATION:
  Is the default + rationale documented in team wiki? Yes / No
```

If your org has changed the default more than twice in the past year, you might be over-tuning. Pick one default and let bookmarks handle individual preferences.

---

## 4. Knowledge check

### Q1
A user wants a different default than the org's:

A. They cannot — the org default is forced
B. They can bookmark their preferred dashboard. The org default is the landing page for users without a bookmark; the bookmark overrides for the individual user. The two coexist. Most mature orgs have a default plus per-user bookmarks.
C. Random
D. Requires admin help

<details>
<summary>Show answer</summary>

**Correct: B.** Personal bookmarks coexist with the org default. Default for newcomers; bookmark for everyone else.
</details>

### Q2
Changing the org default:

A. Affects only new users
B. Affects all users immediately. Existing users without bookmarks land on the new default on their next /dashboard visit. Users with bookmarks are unaffected (their bookmark overrides). The change is audited in M3.3 audit log.
C. Random
D. Takes effect at midnight

<details>
<summary>Show answer</summary>

**Correct: B.** All users (without bookmarks) immediately. Reversible if the change is wrong.
</details>

### Q3
The default can point to:

A. Only a preset key
B. Either a preset key (executive / engineering / finops / all_widgets) OR a UUID of a saved customized dashboard. Most mature orgs use a UUID after they have cloned and customized a preset. Newer orgs typically use a preset key.
C. Multiple dashboards
D. Per-role defaults

<details>
<summary>Show answer</summary>

**Correct: B.** Preset key or UUID. Two ways to point at the default; both work the same from the user's perspective.
</details>

---

## 5. Apply

Set the org default at [Dashboards → preset/dashboard → "Set as org default"](https://app.zopnight.com/dashboards). The change requires `dashboard:update` policy (typically Admin).

For multi-audience orgs, encourage bookmark adoption — communicate to the team during onboarding that they can bookmark whichever dashboard best fits their daily work. This balances org default (for newcomers) with per-user flexibility.

---

## Related lessons

- [L1 — Four presets](L1_presets.md)
- [L2 — Cloning and customization](L2_cloning.md)
- [L3 — Per-widget RBAC](L3_widget_rbac.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[Default dashboard](../../../reference/glossary/default-dashboard.md) · [Bookmark](../../../reference/glossary/bookmark.md) · [Org settings](../../../reference/glossary/org-settings.md) · [Tenant cascade](../../../reference/glossary/tenant-cascade.md)

---

## Module quiz

Complete M3.7 → 10-question module quiz unlocks the **Dashboard-Architect** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.7.L4
