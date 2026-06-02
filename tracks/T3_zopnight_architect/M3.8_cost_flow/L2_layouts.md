# Five layout dimensions

§ T3 · M3.8 · L2 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right Cost Flow layout from the 5 options, **switch** between layouts mid-investigation, **and explain** why the 5 layouts cover the common cost-analysis questions.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Reframe the same cost data in the right cascade for the question I'm asking right now." |
| **Personas** | FinOps Lead · Platform Engineer · Engineering Leader |
| **Prerequisites** | M3.8.L1 — Trend vs Flow |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Switch (Apply), Explain (Understand) |

---

## 1. Concept

The Cost Flow Sankey supports **five preconfigured layouts**, each cascading cost through different dimensions. Picking the right layout reframes the question being asked; switching layouts mid-investigation is the productivity move.

```
LAYOUT                       CASCADE
──────────────────────────────────────────────────────────────────
Default                       Provider → Account → Type → Team
By Service                    Provider → Account → Service → Team
By Region                     Provider → Region → Type → Team
By Purchase Type              Provider → Account → Purchase → Team
By Resource                   Account → Service → Resource → Team
```

Each layout answers a slightly different "where is the money" question. The 5 layouts cover ~90% of cost-analysis questions; the constraint to a fixed set keeps the tool learnable.

### When to use each layout

```
DEFAULT — Provider → Account → Type → Team
  Best for: org-wide understanding
  Question: "Where does our money go at the highest level?"
  Useful for: executive reviews, first-pass investigations
  
BY SERVICE — Provider → Account → Service → Team
  Best for: identifying which cloud services dominate cost
  Question: "Is our spend mostly EKS or RDS or S3?"
  Useful for: service-level rationalization, vendor consolidation

BY REGION — Provider → Region → Type → Team
  Best for: regional spend distribution
  Question: "Where geographically is our money?"
  Useful for: data residency, regional cost-of-running, latency
  vs cost trade-offs

BY PURCHASE TYPE — Provider → Account → Purchase → Team
  Best for: commitment coverage analysis
  Question: "How much on-demand vs Reserved / Savings Plan / Spot?"
  Useful for: commitment optimization, savings recovery
  
BY RESOURCE — Account → Service → Resource → Team
  Best for: drilling to specific resources within a service
  Question: "Which specific resources within EKS are most expensive?"
  Useful for: deep diagnosis, anomaly investigation
```

### Why no fully custom layout

ZopNight deliberately offers a fixed set of 5 layouts rather than allowing arbitrary column ordering. The constraint has three benefits:

```
1. LEARNABILITY
   Users learn the 5 layouts once; they apply across the org.
   A fully custom layout per user would require learning each
   colleague's layout to understand their analysis.

2. COMPARABILITY
   Two analysts using the Default layout can share screenshots
   that look the same. Custom layouts would diverge in style.

3. UX SIMPLICITY
   A layout picker with 5 options is simpler than a column-builder
   UI with infinite combinations.
```

The 5 layouts cover most questions. For the edge cases that need a sixth layout, the typical answer is a custom dashboard widget with a specific filter chain (M3.7) rather than a custom Sankey layout.

### Comparing layouts on the same question

```
QUESTION: "Where is our K8s spend going?"

DEFAULT layout view:
  Provider → Account → Type → Team
  K8s appears in the Type column (across providers)
  Sees: ~$24K of $80K total is K8s
  Cannot tell which service within K8s (EKS vs GKE vs AKS)

BY SERVICE layout view:
  Provider → Account → Service → Team
  EKS, GKE, AKS appear distinctly in the Service column
  Sees: EKS dominates ($18K), GKE ($4K), AKS ($2K)
  Cannot tell which specific cluster within EKS

BY RESOURCE layout view (scoped to EKS):
  Account → Service → Resource → Team
  Specific cluster names appear
  Sees: prod-eks-cluster-1 ($11K), prod-eks-cluster-2 ($4K), ...
  Drilled to actionable specificity

SAME QUESTION, three layouts, three levels of detail.
```

The progression from coarse to fine matches the investigation progression — start broad, narrow as questions sharpen.

### Layout switch behavior

```
SWITCHING LAYOUT clears active drill-down.
  Reasoning: layout defines the high-level structure;
             drill is within-structure navigation
             changing structure invalidates the drill

EXAMPLE:
  User is drilled into "AWS > prod-aws-us-east-1" in Default layout
  Switches to By Service layout
  Drill resets: user sees Default view in the new layout
  Re-drill is fast if needed

WHY: keeping the drill across layouts would produce inconsistent
state. The drilled value "prod-aws-us-east-1" doesn't have meaning
in the By Region layout's cascade.
```

The reset is annoying when frequent layout-switches are needed; in practice, an investigation usually settles on one layout and drills within it.

### Layout in URL

The selected layout is part of the URL:

```
URL FORMAT (simplified):
  /reports/cost-flow?layout=by_service&drill=AWS/prod-aws-us-east-1
  
SHAREABLE:
  Copy the URL; share with a teammate
  Teammate sees the same layout + same drill state
  
BOOKMARKS:
  Bookmark a specific layout + drill for recurring analysis
  Reload preserves the view
```

This URL-encoding makes Sankey views shareable across the team.

### Layout-and-time interaction

```
TIME RANGE applies to all layouts uniformly.
  Pick "last 30 days" once; it persists across layout switches.
  
LAYOUT SWITCH does not change the time range.
```

This is what makes mid-investigation layout switching productive — you don't lose the time-range context when switching layouts.

### How ZopNight uses layouts

Customer telemetry on layout adoption:

```
LAYOUT             FREQUENCY OF USE
──────────────────────────────────────────────────────
Default             45% of Cost Flow views
By Service          25%
By Resource         15%
By Region           8%
By Purchase Type    7%
```

The Default layout is the most-used because it's the most general. By Service and By Resource see heavy use during diagnostic deep-dives. By Region and By Purchase Type are for specialized analyses (data residency, commitment optimization).

---

## 2. Demo

A multi-layout investigation:

```
SCENARIO: "Where is our most expensive K8s spend?"

T+0       Open Reports → Cost Flow
T+5 s     Default layout: Provider → Account → Type → Team
          K8s in the Type column = $24K total
          
T+10 s    Switch to BY SERVICE
T+15 s    Cascade: Provider → Account → Service → Team
          EKS ($18K), GKE ($4K), AKS ($2K) visible
          Click EKS to drill
          
T+20 s    Breadcrumb: EKS
          Sees: 8 EKS clusters across accounts/teams
          Top 3: prod-eks-cluster-1 ($11K), prod-eks-cluster-2
          ($4K), dev-eks-cluster ($1.5K)
          
T+30 s    Switch to BY RESOURCE (scoped to EKS)
T+35 s    Cascade: Account → Service → Resource → Team
          (drilled to EKS in the Service column)
          Each cluster appears with its full breakdown
          prod-eks-cluster-1 sub-breakdown by node group, etc.
          
T+45 s    Click prod-eks-cluster-1 → opens resource detail page
          Inspect node groups, pod resource requests, etc.
          
T+1 min   Identified: 4 oversized node groups in the cluster
          Recommendation: right-size to save $3K/mo
          
T+1.5 min Action: open Recommendations for that cluster
          Apply the right-sizing rec
```

3 layout switches in 90 seconds. Each switch reframed the cascade to surface the next-level question.

---

## 3. Hands-on (5 min)

For your estate, switch through the 5 layouts:

```
QUESTION you want to answer:    __________

PASS THROUGH each layout:

  Default       — What does it show?       __________
                    Useful for the question? Y / N
                    
  By Service    — What does it show?       __________
                    Useful for the question? Y / N
                    
  By Region     — What does it show?       __________
                    Useful for the question? Y / N
                    
  By Purchase   — What does it show?       __________
                    Useful for the question? Y / N
                    
  By Resource   — What does it show?       __________
                    Useful for the question? Y / N

BEST LAYOUT for the question:    __________
WHY:    __________________________________________________________
```

Most questions have a clear best layout. If multiple layouts seem equally useful, the question is probably broad — narrow it first, then re-evaluate.

---

## 4. Knowledge check

### Q1
Question: "Is our K8s spend dominated by EKS or GKE?" Best layout:

A. Default — provider only
B. By Service — shows EKS, GKE, AKS as distinct columns in the cascade, with their individual subtotals. Default would group them all as "Type = K8s" without distinguishing.
C. By Region
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** By Service for service-level breakdown.
</details>

### Q2
Switching layout while drilled into a node:

A. Preserves the drill
B. Resets the drill. Layout defines structure; drill is within-structure navigation. The drilled value doesn't have meaning in a different layout's cascade. Reset prevents inconsistent state. Reset is the trade for layout flexibility.
C. Random
D. Errors out

<details>
<summary>Show answer</summary>

**Correct: B.** Resets drill. The trade-off is intentional.
</details>

### Q3
The 5 layouts are:

A. Customizable by the user
B. Predefined by ZopNight — Default, By Service, By Region, By Purchase Type, By Resource. The constraint serves learnability + comparability across the team. Fully custom would require column-builder UX and would fragment team conventions.
C. Per-user customizable
D. Per-team customizable

<details>
<summary>Show answer</summary>

**Correct: B.** Predefined set. The constraint helps.
</details>

---

## 5. Apply

Switch layouts in [Reports → Cost Flow](https://app.zopnight.com/reports/cost-flow) via the layout dropdown at the top of the Sankey. The URL updates to reflect the selected layout; share the URL to share the view.

For dedicated analyses, bookmark a specific layout (e.g., "By Service for K8s analysis") so the team can re-run the same view month-over-month with consistent framing.

---

## Related lessons

- [L1 — When to switch from Trend to Flow](L1_trend_vs_flow.md)
- [L3 — Drill, breadcrumb, back-out](L3_drill.md) *(next)*
- [L4 — Savings overlay](L4_savings_overlay.md)
- [T3.M3.5.L1 — Pick the showback dimension](../M3.5_showback/L1_pick_dimension.md)

## Glossary terms touched

[Layout](../../../reference/glossary/layout.md) · [Cascade](../../../reference/glossary/cascade.md) · [By Service layout](../../../reference/glossary/by-service-layout.md) · [By Resource layout](../../../reference/glossary/by-resource-layout.md) · [Layout switch reset](../../../reference/glossary/layout-switch-reset.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.8.L2
