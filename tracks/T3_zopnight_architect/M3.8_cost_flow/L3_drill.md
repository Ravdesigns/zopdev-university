# Drill, breadcrumb, back-out

§ T3 · M3.8 · L3 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **drill** into a Sankey node, **navigate** via the breadcrumb, **and share** a drilled-in view via URL.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Get from a question to a specific resource in under 60 seconds by drilling into the right node." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader · SRE / On-call |
| **Prerequisites** | M3.8.L1 (Trend vs Flow) · M3.8.L2 (layouts) |
| **Time** | 9 minutes |
| **Bloom verb** | Drill (Apply), Navigate (Apply), Share (Apply) |

---

## 1. Concept

The Sankey diagram is **interactive**: clicking any node drills the view to filter on that node, displaying the next-level breakdown. The breadcrumb at the top shows the drill path, allowing back-out at any level. The drill state is encoded in the URL — drilled views are shareable.

```
INITIAL STATE — Default layout, full cascade:
  Provider → Account → Type → Team
    AWS:    $1.5M
    GCP:    $800K
    Azure:  $300K
    (sum: $2.6M)

CLICK on "AWS":
  Breadcrumb: AWS
  Filtered view: only AWS-tagged resources
  Cascade: Account → Type → Team (AWS-scoped)
    prod-aws-us-east-1: $640K
    prod-aws-eu-west:    $400K
    (other AWS accounts): $460K

CLICK on "prod-aws-us-east-1":
  Breadcrumb: AWS > prod-aws-us-east-1
  Filtered view: only resources in this account
  Cascade: Type → Team (within this account)
    EKS:  $280K
    RDS:  $180K
    EC2:  $120K
    ...
```

Each click adds a filter; the breadcrumb is the trail of applied filters.

### How drill works

```
USER CLICKS A NODE:
  1. Frontend records the click on a specific node value
  2. URL updates with the drill path appended:
     /reports/cost-flow?layout=default&drill=AWS/prod-aws-us-east-1
  3. Sankey re-fetches data with the additional filter
  4. New cascade renders showing the next level
  5. Breadcrumb appears with back-out buttons
  
BACKEND HANDLING:
  Each drill segment is a filter on the cost_records query
  The cascade columns shown are the layout's columns minus
    the drilled ones
```

### Three levels deep

Cost Flow supports **3 levels of drill** before drilling beyond the Sankey makes sense:

```
LEVEL 0 — Initial cascade (4 columns)
  Provider → Account → Type → Team
  Sees full cost surface
  
LEVEL 1 — Drilled to one provider/region
  Cascade: Account → Type → Team
  Sees one provider's full breakdown
  
LEVEL 2 — Drilled to one account/service
  Cascade: Type → Team
  Sees one account's full breakdown by type and team
  
LEVEL 3 — Drilled to one specific type / team
  Cascade: Team (or Resource if By Resource layout)
  Sees the deepest breakdown
  
BEYOND LEVEL 3:
  The Sankey runs out of distinguishing detail.
  Drill into the resource detail page directly.
  The Sankey's "Click for resource detail" link takes you there.
```

For very deep investigations (e.g., "which pod in which cluster"), the Sankey gets the user to the resource; the resource detail page gets the rest of the way.

### Back-out

The breadcrumb is the back-out mechanism:

```
BREADCRUMB: AWS > prod-aws-us-east-1 > EKS

OPTIONS:
  Click "AWS" segment        → back to AWS-only view (level 1)
  Click "prod-aws-us-east-1" → back to that account's view (level 2)
  Click "Clear all"           → back to the initial cascade (level 0)
  
BROWSER BACK BUTTON: also works
  Each drill push to the URL is a navigation step
  Back button rewinds the drill
```

The breadcrumb-as-trail pattern matches OS-level navigation conventions. Users learn it in seconds.

### URL persistence — the key feature

The drill state lives in the URL. This produces three useful properties:

```
1. SHAREABILITY
   Copy the URL; paste in Slack or ticket
   Teammate clicks; sees the exact same view
   No "look at this thing" without a way to share it
   
2. BOOKMARK-ABILITY
   Bookmark "EKS spend in prod-aws-us-east-1"
   Re-run weekly for ongoing analysis
   The URL captures layout + time range + drill path
   
3. STATEFULNESS
   Reload the page; drill survives
   Browser back button rewinds the drill
   No "lost work" if you accidentally close the tab
```

### Why drill matters more than filters

A traditional filter UI (dropdowns at the top of the page) requires constructing the filter chain. Drill is more natural:

```
FILTER UI (traditional):
  Provider dropdown: pick "AWS"
  Account dropdown: pick "prod-aws-us-east-1"
  Resource type dropdown: pick "EKS"
  
  3 dropdowns; 6+ clicks; pre-knowledge of the names

DRILL UI (Sankey):
  Click "AWS" node (you see it visually)
  Click "prod-aws-us-east-1" node (it's biggest, so easy to find)
  Click "EKS" node (visible by size)
  
  3 clicks; visual; no pre-knowledge required
```

The visual + click pattern is what makes the Sankey efficient for diagnosis. The filter UI exists as a fallback (Reports → Cost Flow → filter chips at the top) but most users discover they prefer drill.

### Drill with layout

```
DRILL is layout-aware:
  - Layout determines which columns appear in the cascade
  - Drilling clicks a value within one of those columns
  - The drill filter is on that column's dimension
  
EXAMPLE in BY SERVICE layout:
  Cascade: Provider → Account → Service → Team
  Click "EKS" in the Service column
  Drill: filter to Service=EKS
  Subsequent view: Provider → Account → Team (with Service filtered)
```

### How ZopNight uses drill

The drill state is encoded in the URL as a sequence of filter values. The backend handles arbitrary drill depth at the SQL layer — each drill segment becomes an additional `WHERE` clause. Performance scales because each drill narrows the result set; deeper drills are typically faster, not slower.

For shareability, the URL is canonical — there is no "internal state not in the URL" that would prevent reproducibility. This was a deliberate design decision.

---

## 2. Demo

A real cost-spike investigation via drill:

```
INVESTIGATION: "Yesterday's cost spiked $4K above baseline. Why?"

T+0       Open Reports → Cost Flow
          Time range: Yesterday
          
T+5 s     Default layout shows: total $32K
          Cascade: Provider → Account → Type → Team
          AWS dominates ($24K vs $8K baseline)
          
T+10 s    Click "AWS" in the Provider column
          Breadcrumb: AWS
          Sees: prod-aws-us-east-1 is the biggest account ($18K)
          
T+15 s    Click "prod-aws-us-east-1"
          Breadcrumb: AWS > prod-aws-us-east-1
          Sees: EKS dominates ($12K)
          
T+20 s    Click "EKS"
          Breadcrumb: AWS > prod-aws-us-east-1 > EKS
          Sees: team-ml-infra owns $11K of the EKS spend
                team-platform owns $1K
          
T+25 s    Switch layout to BY RESOURCE (drill persists semantically)
          Sees: prod-ml-eks-cluster ($10K), prod-platform-eks-1 ($1K)
          
T+30 s    Click resource → opens resource detail page
          See the cluster's node groups, pod counts, etc.
          
T+45 s    Identify: ml-eks-cluster grew from 4 nodes to 16 nodes
                    yesterday at 14:00 UTC. Sustained.
          
T+1 min   Investigate further:
          - Audit log: ml-team member changed HPA max at 13:55
          - Reason in audit: "load test for inference performance"
          - Decision: load test running; will end Friday
          
T+1.5 min Action: notify ml-team; confirm cleanup planned
          Bookmark the URL for tomorrow's follow-up check
          
T+2 min   Copy URL; paste in #ml-team Slack:
          "Yesterday's cost spike traced to this view — load test
          ml-eks-cluster scaling from 4 to 16 nodes. Confirm cleanup
          by Friday."
          
TEAMMATE clicks the URL; sees the exact same drilled view.
```

90 seconds from question to specific cluster. Sharing the URL preserves context.

---

## 3. Hands-on (5 min)

Drill through your estate:

```
START at Reports → Cost Flow (Default layout)

DRILL PATH:
  Level 0:       __________ (total, all providers)
  Level 1 click: __________ (which provider? top spender)
  Level 2 click: __________ (which account/region?)
  Level 3 click: __________ (which type/service?)
  
TIME ELAPSED to identify a specific cost component: _____ sec

COPY URL of your drilled-in view:
  __________________________________________________________
  
SHARE the URL with a teammate; ask them to confirm what they see
```

If the drill took more than 60 seconds, you may have been investigating the wrong cascade — try a different layout for a clearer path.

---

## 4. Knowledge check

### Q1
Drill-down state is preserved in:

A. Session cookies
B. The URL. The drill path, layout, and time range are all URL-encoded. Bookmarking, sharing, reloading, and browser back-button all work. There is no internal state outside the URL — the URL is canonical.
C. Browser local storage
D. Server-side session

<details>
<summary>Show answer</summary>

**Correct: B.** URL is the canonical state. This is what makes Sankey views shareable.
</details>

### Q2
Maximum useful drill depth:

A. Unlimited
B. 3 levels typical in the Sankey. Beyond that, the Sankey runs out of distinguishing detail; drill into the resource detail page directly. The Sankey's "Click for resource detail" link takes you there from any drilled node.
C. 5
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 3 levels in the Sankey, then resource detail page. The handoff is intentional.
</details>

### Q3
A drilled-in URL shared with a teammate:

A. Does not work
B. Reproduces the exact view they see. URL encodes layout + drill path + time range. Teammate clicks; same view appears. This is the canonical way to share a cost analysis.
C. Requires their own filters
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Shareable via URL. The design enables collaborative diagnosis.
</details>

---

## 5. Apply

Practice drilling at [Reports → Cost Flow](https://app.zopnight.com/reports/cost-flow). For complex analyses, copy the URL into a ticket or Slack thread — it captures the full context without needing screenshots or written descriptions.

For recurring weekly investigations (e.g., "Monday Cost Flow review"), bookmark a specific drilled-in view as your starting point — the URL captures your team's preferred cascade and scope.

---

## Related lessons

- [L1 — Trend vs Flow](L1_trend_vs_flow.md)
- [L2 — Five layout dimensions](L2_layouts.md)
- [L4 — Savings overlay](L4_savings_overlay.md) *(next)*
- [T3.M3.6.L4 — Green/yellow/red signals](../M3.6_budget_governance/L4_signals.md)

## Glossary terms touched

[Drill-down](../../../reference/glossary/drill-down.md) · [Breadcrumb](../../../reference/glossary/breadcrumb.md) · [URL persistence](../../../reference/glossary/url-persistence.md) · [Sankey node](../../../reference/glossary/sankey-node.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.8.L3
