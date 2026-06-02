# Savings overlay — "$X reclaimable"

§ T3 · M3.8 · L4 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **use** the savings overlay to identify reclaimable spend in the Sankey, **deep-link** to filtered recommendations, **and combine** the savings overlay with the unattributed-teams overlay for diagnostic depth.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Find the money I can recover this week directly from the cost flow, without juggling separate recommendation pages." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader |
| **Prerequisites** | M3.8.L1-L3 (Trend vs Flow, layouts, drill) · T1 — Recommendations |
| **Time** | 9 minutes |
| **Bloom verb** | Use (Apply), Deep-link (Apply), Combine (Analyze) |

---

## 1. Concept

The Cost Flow Sankey has an optional **savings overlay** that highlights flows with reclaimable spend (open recommendations) and a separate **unattributed teams** overlay that highlights resources without team tags. Together, these overlays turn the Sankey from a "where is the money" view into a "where to act on the money" view.

```
WITHOUT OVERLAYS:
  Sankey shows flow size only
  Each flow's color = neutral
  User sees composition; must navigate elsewhere to act
  
WITH SAVINGS OVERLAY:
  Flows with open recommendations get a red stripe
  Hover any flow: inspector shows "$X reclaimable" if any
  Click the callout: deep-link to filtered Recommendations
  
WITH UNATTRIBUTED OVERLAY:
  Flows containing untagged resources are highlighted yellow
  Distinguishes "where the money goes" from
                "where the money is unattributed"

BOTH OVERLAYS ON:
  Red-and-yellow striped flows = double signal
  (untagged + reclaimable)
```

### What "reclaimable" means

```
RECLAIMABLE = sum of potential savings from all OPEN recommendations
              on resources in this flow

For a flow showing "prod-aws-us-east-1 → EKS → team-platform":
  Reclaimable = SUM(recommendations.estimated_savings_usd)
                FROM open_recommendations
                WHERE resource IS IN scope(this flow)
```

The number on the callout is the dollar amount of potential savings that have not yet been applied. Applying the recommendation would convert reclaimable → realized.

### Filtering recommendations from overlay

The savings overlay's most useful feature: deep-linking to filtered recommendations.

```
USER CLICKS the "$2,400 reclaimable" callout on a flow

OPENS Recommendations page with filters pre-applied:
  cloud_account_id = prod-aws-us-east-1
  resource_type = EKS
  team = platform (if applicable in the drill path)
  status = open
  
RESULT:
  Recommendations list shows only the 8 specific recs that contribute
  to the $2,400 number. User triages directly.

NO MANUAL FILTER CONSTRUCTION required.
```

This is the bridge between "Cost Flow analysis" (where the money goes) and "Recommendations action" (what to do about it). Without the deep-link, the user would have to read the flow, open Recommendations separately, construct matching filters, and confirm they match. The deep-link compresses 30 seconds of navigation into one click.

### Limitations

```
SUPPORTED DEEP-LINK FILTERS:
  resource_type
  cloud_account_id
  team_id (limited; via team scoping)

NOT YET SUPPORTED:
  provider          (callout shows; deep-link hidden)
  region            (callout shows; deep-link hidden)
  service_name      (callout shows; deep-link hidden)
  purchase_type     (callout shows; deep-link hidden)
  resource_uid       (drill into resource detail page directly)

WHEN A CALLOUT IS HIDDEN:
  The savings exist but cannot be directly filtered to
  Workaround: open Recommendations and filter manually
```

This is a known limitation; future versions are likely to support more dimensions. The current set covers the most-common drill paths.

### Unattributed teams overlay

```
SEPARATE OVERLAY: Unattributed teams highlight

When toggled on:
  Resources without a team tag are highlighted in yellow
  Flows that include any untagged resources show the yellow tint
  Hover: inspector shows the count and total cost of untagged
         resources in the flow
  
USE CASES:
  - Tag-coverage audits
  - Identifying which dimensions have the most untagged spend
  - Finding orphan resources (often correlated with low team-tagging)
```

The unattributed overlay is the visual companion to the Tag Coverage widget (M3.5.L4). Where the widget gives a percentage, the overlay shows where the percentage gap lives geographically in the Sankey.

### Combining overlays

```
BOTH OVERLAYS ON SIMULTANEOUSLY:
  
  Red-striped: open recommendations (reclaimable savings)
  Yellow-highlighted: untagged resources
  Red-and-yellow: both (recommendations + untagged)
  
INTERPRETATION:
  Red only: known waste; act via recommendations
  Yellow only: tagging gap; address via tagging discipline
  Red and yellow: double opportunity — untagged AND optimization
                  available. Often orphan resources from departed
                  users; tag + apply rec or just delete.
                  
The red-and-yellow flows are usually the highest-leverage.
```

### When to use the savings overlay

```
SCENARIO                                  USE OVERLAY?
──────────────────────────────────────────────────────────────────
Weekly Operate review                     Yes — find this week's
                                          action items
                                          
Monthly cost review for leadership        No — overlay adds noise to
                                          executive view; show the
                                          number separately
                                          
Quarterly optimization sprint              Yes — primary tool for
                                          finding savings
                                          
Anomaly investigation                      Maybe — sometimes the
                                          anomaly is from open recs
                                          not yet applied
                                          
Initial onboarding / exploration          Yes — surfaces value
                                          immediately
```

The overlay adds visual complexity. Use it when the additional information helps; turn it off when a clean view is needed.

### Example overlay state

```
COST FLOW with savings overlay, BY SERVICE layout:

  Provider →  Account →  Service →  Team
  
  AWS →     prod-us →    EKS →       team-ml-infra
             ████░░░░     ███████░    ████░░░
             ▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒▒    ▒▒▒▒▒▒▒  (red stripes: $4.2K)
             
  AWS →     prod-us →    RDS →       team-platform
             ████░░░░     ███░░░░░    ██░░░░░
             (red stripes: $1.1K)
             
  GCP →     dev →        Compute →   (untagged)
             ██░░░░░░     █░░░░░░░    █░░░░░░░
             ░░░░░░░░     ░░░░░░░░    ░░░░░░░░  (yellow: $480)
             (red+yellow: $480 from untagged compute, 
              also has open recs)

LEGEND:
  ▒▒▒ = red stripe (reclaimable savings)
  ░░░ = yellow tint (untagged resources)
```

The visual encoding makes opportunities pop out of the Sankey.

### Weekly Operate ritual

The savings overlay is at the center of a productive Weekly Operate ritual:

```
WEEKLY (20 minutes):
  T+0     Open Cost Flow, default layout, this-week scope
  T+1     Toggle savings overlay
  T+2     Identify the largest red-striped flow
  T+3     Click the callout → filtered Recommendations
  T+5     Triage 3-5 recommendations
          (apply / dismiss / investigate further)
  T+10    Repeat for next red-striped flow
  T+18    Document acted recommendations in team wiki
  T+20    Close loop

OUTCOME over time:
  Reclaimable savings decline as recs are applied
  Tag coverage improves as untagged resources are addressed
  The overlay becomes "the thing I scan weekly"
```

### How ZopNight uses the overlays

The overlay states are URL-encoded alongside layout and drill. The toggle states persist across Sankey reloads. The reclaimable-savings calculation joins the Sankey query result with `open_recommendations`; the untagged-resources calculation cross-references the team-tag inventory.

For performance, the overlay queries are cached for a few minutes — recommendations don't change minute-to-minute, so a slight delay is acceptable in exchange for fast renders.

---

## 2. Demo

A weekly Operate cycle using the overlay:

```
TIME: Monday morning, 9:15 AM
GOAL: This week's recommendations to triage

T+0       Open Reports → Cost Flow
T+5 s     Toggle "Savings overlay" → on
T+10 s    Scan the Sankey for red-striped flows
          
          Three biggest:
          1. AWS → prod-us → EKS → team-platform   $2,400
          2. AWS → prod-us → RDS → team-product    $1,100
          3. GCP → prod → BigQuery → team-data      $750
          
T+30 s    Click the EKS callout ($2,400)
T+35 s    Recommendations page opens filtered:
          cloud_account_id=prod-aws-us-east-1, resource_type=EKS
          Sees 8 open recommendations totaling $2,400/mo
          
T+1 min   Triage:
          - 5 right-sizing recs (low risk) → apply now
          - 2 idle-cluster recs (need owner approval) → assign
          - 1 spot-instance switch (medium risk) → defer
          
T+3 min   Apply the 5 right-sizing recs (one-click each)
          
T+5 min   Switch back to Cost Flow; click the RDS callout ($1,100)
T+5:30    Recommendations opens for RDS in prod-us
          Triage: 4 recs; 3 apply now, 1 defer
          
T+8 min   Click the BigQuery callout ($750)
T+8:30    BigQuery recs (snapshot lifecycle, query optimization)
          Triage: 2 recs; both deferred (need data team owner)
          
T+10 min  Switch on Unattributed overlay; notice yellow on flow:
          GCP → dev → Compute → (untagged)
          12 compute resources without team tags
          
T+11 min  Click into the untagged section
          Identify the resources
          Assign team tags or flag for cleanup
          
T+15 min  Document in team wiki:
          "This week: applied 8 recs ($2.4K + $1.1K = $3.5K/mo
          recoverable); tagged 12 GCP compute resources."

ELAPSED: 15 minutes for $3,500/mo of recovered savings + tagging
hygiene.
```

---

## 3. Hands-on (5 min)

Use the savings overlay:

```
OPEN Reports → Cost Flow → toggle Savings overlay

LARGEST RED-STRIPED FLOWS (top 3 you see):
  1. __________  Reclaimable: $__________
  2. __________  Reclaimable: $__________
  3. __________  Reclaimable: $__________

TOTAL VISIBLE RECLAIMABLE: $__________

PICK ONE FLOW; click its callout:
  Recommendations opened? Yes / No
  Filter scope: __________
  Number of recommendations: _____
  
ACTION you can take this week:
  □ Apply N recommendations (low-risk)
  □ Assign owner for high-risk recs
  □ Defer specific recs (note why)
  □ Combine with team meeting

UNATTRIBUTED OVERLAY:
  Toggle on. Largest untagged flow:
  __________  Untagged amount: $__________
  Tagging plan: __________
```

If you have no red-striped flows, your team is in optimal state — recommendations are kept current. Time to switch focus to tagging hygiene or unit-economics improvements.

---

## 4. Knowledge check

### Q1
A red-striped flow indicates:

A. A cloud provider error
B. Open recommendations exist on resources in this flow. The "$X reclaimable" callout deep-links to the matching recommendations. The stripe is the visual cue; the click is the action.
C. A high-cost flow
D. Anomaly detection

<details>
<summary>Show answer</summary>

**Correct: B.** Red stripe = reclaimable savings via open recommendations. The visual cue is what makes the overlay productive.
</details>

### Q2
The deep-link from a savings callout:

A. Opens Recommendations unfiltered
B. Opens Recommendations filtered to match the flow's drill path (cloud_account_id, resource_type, etc.). Saves the user from manually constructing the filter. The filter scope matches the callout's reclaimable amount.
C. Random
D. Just shows the count

<details>
<summary>Show answer</summary>

**Correct: B.** Filtered to match. The bridge between Cost Flow and Recommendations.
</details>

### Q3
The deep-link works for which dimensions?

A. All dimensions
B. resource_type and cloud_account_id are well-supported. Other dimensions (provider, region, service, purchase_type) show the callout but the deep-link is hidden; user opens Recommendations and filters manually. Future versions are likely to expand the supported set.
C. None — manual only
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Limited dimension support is the current state. The most-common dimensions are covered.
</details>

---

## 5. Apply

Toggle the savings overlay in [Reports → Cost Flow](https://app.zopnight.com/reports/cost-flow). The toggle is in the upper-right of the Sankey view. The unattributed overlay is in the same toggle group.

For weekly Operate cadence, build the savings-overlay scan into your routine. 15-20 minutes per week is sufficient to capture most recoverable savings.

---

## Related lessons

- [L1 — Trend vs Flow](L1_trend_vs_flow.md)
- [L2 — Five layout dimensions](L2_layouts.md)
- [L3 — Drill, breadcrumb, back-out](L3_drill.md)
- [T1 — Recommendations module (Operator tier)](../../T1_zopnight_operator/M1.4_recommendations/00_README.md)
- [T3.M3.5.L4 — Tag coverage](../M3.5_showback/L4_tag_coverage.md)

## Glossary terms touched

[Savings overlay](../../../reference/glossary/savings-overlay.md) · [Reclaimable](../../../reference/glossary/reclaimable.md) · [Unattributed overlay](../../../reference/glossary/unattributed-overlay.md) · [Deep-link](../../../reference/glossary/deep-link.md) · [Open recommendation](../../../reference/glossary/open-recommendation.md)

---

## Module quiz

Complete M3.8 → 10-question module quiz unlocks the **Cost-Flow-Architect** chip. **Track 3 complete.**

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.8.L4
