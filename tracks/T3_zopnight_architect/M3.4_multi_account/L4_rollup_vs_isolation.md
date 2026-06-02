# Cost rollup vs cost isolation

§ T3 · M3.4 · L4 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** rollup from isolation views, **decide** which view fits which audience, **and use** ZopNight's account filters to switch between them.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Show executives the org-wide number AND give engineers their per-team view, from the same data." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner · Platform Engineer |
| **Prerequisites** | M3.4.L1-L3 (multi-account fundamentals + discovery) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Decide (Evaluate), Use (Apply) |

---

## 1. Concept

A multi-account environment generates two structurally different cost views from the same underlying data:

```
ROLLUP        Sum costs across multiple accounts to get one number
              "What did our entire AWS estate cost this month?"
              "What does the production OU spend?"
              
ISOLATION     Keep per-account costs distinct and visible
              "What did prod-eu account cost this month?"
              "How does platform-prod compare to product-prod?"
```

Both views are correct; they answer different questions. The skill is picking the right view for the audience and switching cleanly between them. Most multi-account governance failures come from showing the wrong view to the wrong audience — exec teams flooded with per-account detail they cannot act on, engineering teams blocked from seeing their own costs because only org-wide rollups are presented.

### When rollup is the right view

```
SCENARIO                                  WHY ROLLUP WINS
──────────────────────────────────────────────────────────────────
Executive monthly cost review              "What does cloud cost us
                                          this month?" — one number
                                          
Annual budget vs actual reporting          Compare budget against
                                          aggregate spend
                                          
Treasury / cash-flow planning              Aggregate matters; per-
                                          account is irrelevant
                                          
Cost-per-business-unit (rolled up by BU)   Each BU's slice across all
                                          its accounts
                                          
Org-wide compliance reports                "What is our cloud spend
                                          this fiscal year?"
                                          
External reporting (investors, audits)    Single defensible number
```

### When isolation is the right view

```
SCENARIO                                  WHY ISOLATION WINS
──────────────────────────────────────────────────────────────────
Per-team accountability                    Each team owns one (or more)
                                          accounts; their bill is their
                                          responsibility
                                          
Chargeback to teams                        The actual invoice each team
                                          should receive
                                          
Quota management                           Quotas are per-account; need
                                          to see per-account utilization
                                          
Incident response                          "Cost spike — which account?"
                                          → isolation surfaces the source
                                          
Compliance: per-account scope              PCI/HIPAA scope is account-
                                          bounded; reports must isolate
                                          
Anomaly investigation                      Which account's anomaly is
                                          this? → isolation needed
```

Both views matter. Different reports, different audiences, same underlying data.

### How ZopNight handles both

ZopNight surfaces both views from the same data, with explicit toggles between them:

```
SURFACE                       PRIMARY VIEW           SECONDARY VIEW
──────────────────────────────────────────────────────────────────
Reports → Org overview         Rollup (total)         Per-cloud breakdown
                                                     (tabs: AWS, GCP, Azure)

Reports → Cloud Account       Isolation              "Compare with"
                              (drilldown to one      adjacent panel for
                              account)               account-vs-account

Reports → Teams                Rollup (team total)    "By account" breakdown
                                                     (which accounts make
                                                     up this team's total)

Reports → Org Tree (hierarchy) Tree view; expand any  Per-node total + share
                              node to see its         of parent
                              children
                              
Cost Flow                      Time-series rollup     Multi-line: per-account
                                                     overlay
```

### Team scoping vs account filtering

These are two different filters that both narrow the visible data, and confusing them is a common source of "I can't find my cost" support tickets.

```
TEAM SCOPING               Restricts the user's visibility to
                           resources owned by their team. The team
                           may span multiple accounts; the scope
                           sees all resources tagged team=X
                           regardless of account.
                           
ACCOUNT FILTERING          Narrows the displayed report to one or
                           more accounts. Visible only to users who
                           have access to those accounts.
```

A platform engineer scoped to team=platform sees their team's resources across the 3 accounts that hold platform infrastructure. They can further filter to "just acme-platform-prod" using the account filter. Two layers of filtering compose.

### Cross-account analysis examples

```
"Top 10 spenders org-wide" (rollup analysis)
  Filter:    no account filter (or all accounts)
  Sort:      monthly cost descending
  Limit:     10
  → Returns top resources regardless of which account they're in
  Use:       org-wide optimization targeting

"Cost difference: prod-us vs prod-eu" (isolation analysis)
  View:      Cloud Account drilldown
  Compare:   acme-prod-us vs acme-prod-eu
  → Side-by-side spend, growth rate, top services per side
  Use:       regional cost-of-running comparison

"Which account's growth is fastest?" (trend isolation)
  View:      Time-series, multi-line by account
  Period:    last 90 days, week-over-week growth rate
  → Identifies the fastest-growing accounts
  Use:       early warning for runaway accounts

"Show my team's spend across accounts" (team scoping + isolation)
  Scope:     team-scoped user (Editor on team=platform)
  View:      Reports → Teams → platform → "By account" breakdown
  → Shows platform team's total + per-account contribution
  Use:       team lead understanding where their spend lives
```

### Common reporting mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Showing exec team per-account             Use Reports → Org overview
breakdown of 60+ accounts                 with rollup; offer drill on
                                          request
                                          
Showing platform team an org-wide          Use team scoping; filter to
rollup when they wanted theirs            their team scope first
                                          
Mixing prod and non-prod in a single       Filter by account or by tag
report intended for compliance review     to isolate prod-scope
                                          
Comparing accounts without normalizing     Compare cost-per-unit, not
for workload size                          raw cost; small + cheap
                                          account vs large + cheap
                                          account is not the same
                                          insight as small + expensive
                                          vs large + expensive
```

The normalization point is especially important. A cheap small dev account can look "100% growth month-over-month" simply because someone provisioned a single resource. Normalizing by workload size (units, requests, users) avoids over-reacting.

### How ZopNight uses both views

For executive reporting, ZopNight's Org Overview report surfaces the rollup as the primary number, with provider breakdown (AWS/GCP/Azure) as the first level of detail and per-account as the second. For engineering team views, the Teams report rolls up by team with per-account detail accessible via drill.

The "right" answer for which view to default to depends on the user's role and scope. ZopNight uses the user's primary role to choose:

```
USER ROLE / SCOPE                DEFAULT VIEW
─────────────────────────────────────────────────────────
Admin (allResources)              Org overview (rollup)
Editor (team-scoped)              Team view (rolled up to team)
FinOps Lead (cross-team)          Org overview, easy drill
Viewer + audit log access         Account-isolated views
Engineering Leader                Team view + Org context
```

The defaults can be customized per-user via dashboards (M3.7 covers dashboards).

---

## 2. Demo

A mid-size customer's reporting layout:

```
ORG: 8 AWS accounts, 2.1M/mo total spend
ACCOUNTS:
  acme-prod-platform   $640K/mo
  acme-prod-product    $360K/mo
  acme-prod-shared     $200K/mo
  acme-staging         $180K/mo
  acme-dev-shared      $80K/mo
  acme-sandbox         $40K/mo
  acme-security        $30K/mo
  acme-shared-services $90K/mo
                       ────────
                       $1,620K subtotal (+ taxes and discounts → $2.1M)

VIEW BY AUDIENCE:

EXECUTIVE (monthly review):
  Reports → Org Overview
  Headline: "Cloud spend this month: $2.1M (+3% MoM)"
  Per-provider: AWS $2.1M (single cloud in this example)
  Top drivers (rolled up): EC2 $890K, RDS $410K, S3 $290K, ...
  Per-environment rollup: prod $1.2M, staging $180K, dev $80K, ...

FINANCE PARTNER (quarterly review):
  Reports → Teams (chargeback view)
  Per-team subtotals: platform $740K, product $410K, data $260K, ...
  Showback report exported as CSV for finance system import

PLATFORM ENGINEER (their team's view):
  Team-scoped; sees platform team's resources only
  Reports → Teams → platform → drill
  Per-account: acme-prod-platform $640K, acme-staging-platform-slice $100K
  Their team's optimization recommendations: $80K/mo unrealized

INCIDENT RESPONDER (cost-spike investigation):
  Anomaly detected; Cost Flow open
  Multi-line view: which account's line is spiking?
  acme-prod-product line jumps at T+0; investigate that account
```

One data set; four very different reports based on audience.

---

## 3. Hands-on (6 min)

For your team and org:

```
EXECUTIVE-AUDIENCE REPORT (rollup):
  Total monthly spend (org-wide):  $__________
  Top-level breakdown:              by provider / by environment / by team
  Frequency:                        weekly / monthly / quarterly
  Owner:                            __________

PER-TEAM REPORT (isolation):
  Number of teams reported:          _____
  Top spender:                       __________  $__________
  Lowest spender:                    __________  $__________
  Frequency:                         monthly
  Distribution method:               Slack / email / dashboard

INCIDENT VIEW (isolation, time-series):
  Default Cost Flow view:            org rollup / multi-line by account
  
ONE QUESTION you could not answer with the current views:
  __________________________________________________________
  
  Which view would answer it?
  __________________________________________________________
```

If you have a question that the current views don't answer, that's a gap to close (often a custom dashboard — covered in M3.7).

---

## 4. Knowledge check

### Q1
A leadership review wants the org-wide cloud cost total. Best view:

A. Per-account isolation showing all 12 accounts
B. Rollup view (Reports → Org Overview). One headline number with drill-down available for follow-up questions. Executives need a clean number; the per-account detail is available if they ask.
C. Random account
D. Resource-level detail

<details>
<summary>Show answer</summary>

**Correct: B.** Rollup at the top, isolation underneath when asked. Don't lead with detail the audience cannot act on.
</details>

### Q2
A team lead investigating spend on their team's resources. Best view:

A. Org-wide rollup
B. Team-scoped view (automatically filters to their team's resources across all accounts that hold them). Shows only what they own, rolled up by team with per-account contribution visible on drill. Combines RBAC scope with isolation.
C. Random account
D. Anomaly view

<details>
<summary>Show answer</summary>

**Correct: B.** Team scoping is the right filter; the view is rolled up to team for the team's view but isolates across accounts.
</details>

### Q3
Rollup and isolation views:

A. Are different reports stored separately
B. Are different views of the same underlying data. ZopNight supports both natively; users switch via account filters and view toggles. Executive needs rollup; engineering needs isolation; both are produced from the same cost records.
C. Require separate ZopNight tenants
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Same data, two views. Maintaining separate reports for the two would create reconciliation pain.
</details>

---

## 5. Apply

Use Reports → Org Overview for rollup ([app.zopnight.com/reports/org](https://app.zopnight.com/reports/org)); Reports → Cloud Account for isolation ([app.zopnight.com/reports/accounts](https://app.zopnight.com/reports/accounts)); Reports → Teams for team-scoped rollup ([app.zopnight.com/reports/teams](https://app.zopnight.com/reports/teams)).

For recurring audiences, build a dedicated dashboard (covered in M3.7) — saving the audience their preferred view by default.

---

## Related lessons

- [L1 — Why multi-account](L1_why_multi.md)
- [L2 — Cloud-provider hierarchies](L2_org_structures.md)
- [L3 — Cross-account discovery](L3_cross_account_discovery.md)
- [L5 — Multi-account anti-patterns](L5_antipatterns.md) *(next)*
- [T3.M3.7.L1 — Dashboard presets](../M3.7_dashboards/L1_presets.md)

## Glossary terms touched

[Cost rollup](../../../reference/glossary/cost-rollup.md) · [Cost isolation](../../../reference/glossary/cost-isolation.md) · [Account filter](../../../reference/glossary/account-filter.md) · [Team scoping](../../../reference/glossary/team-scoping.md) · [Org Tree](../../../reference/glossary/org-tree.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.4.L4
