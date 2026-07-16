# Communicating to non-engineers

§ T4 · M4.3 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **translate** unit economics for finance, leadership, and external audiences, **structure** the narrative crisply, **and avoid** the most common communication mistakes.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Tell the cost-per-unit story to the CFO, the CEO, and the board in language each understands, without losing the technical accuracy." |
| **Personas** | FinOps Lead · Engineering Leader · Finance Partner · Communications |
| **Prerequisites** | M4.3.L1-L4 (full unit economics) |
| **Time** | 9 minutes |
| **Bloom verb** | Translate (Apply), Structure (Apply), Avoid (Evaluate) |

---

## 1. Concept

Unit economics is a quantitative story; the audience determines how the story is told. Engineering audiences want details and methodology; finance wants the variance and forecast; leadership wants the trend and the ask; external audiences want the comparable.

```
ENGINEERING DETAIL                NON-ENGINEERING STORY
──────────────────────────────────────────────────────────────────
Per-resource cost breakdown       Total bill + trend direction
Pricing methodology                Single headline number
Tag attribution complexity         Per-team simple breakdown
Forecast confidence bands         Forecast with range
Numerator scope decisions         "Cost of running the product"
```

Each translation preserves accuracy while matching the audience's vocabulary.

### Storytelling structure

A crisp narrative for any non-engineering audience:

```
1. WHAT HAPPENED?
   Total cost: $X
   Per-X: $Y
   Trend: improving / stable / degrading
   
2. WHY?
   Major drivers (top 3)
   Notable events (launches, optimizations, anomalies)
   
3. WHAT'S NEXT?
   Forecast for next period (with range)
   Expected drivers
   Risks
   
4. ASK?
   Decision needed (or just FYI)
   If FYI: no action requested
   If decision: specific ask with timeline
```

Four sections. Crisp. Actionable. Same structure for finance, leadership, board.

### Finance audience

```
WHAT FINANCE WANTS:
  Total dollars for the period
  Variance to forecast (and the reason for the variance)
  Trend (3-month, 12-month)
  Forecast for next period with confidence band
  Specific decisions where variances need acceptance or budget
  adjustment

LANGUAGE TRANSLATIONS:
  "Cost-per-unit improvement"  =  "efficiency gain"
  "Unit cost trend"            =  "business efficiency direction"
  "Variance vs forecast"       =  "financial discipline"
  "Confidence band"            =  "range" or "spread"
  "Service-specific scope"     =  "cost of running the product"
  "Anomaly"                     =  "unexpected variance"
```

### Leadership audience

```
WHAT LEADERSHIP WANTS:
  Are we efficient?
  Are we on budget?
  What's the trajectory?
  Where are the big wins / losses?
  What decisions do you need from me?

LANGUAGE:
  Lead with the headline ("We're at $X/MAU, trending toward $Y")
  Sub-bullet the drivers ("Major drivers: feature launch +$X,
                          Q1 optimization -$Y")
  Forecast next period ("Forecast next quarter: $Z, range $W-$V")
  Close with the ask ("Approve Q2 optimization budget")
```

### Investor / external audience

```
WHAT EXTERNAL AUDIENCE WANTS:
  Unit economics as efficiency proof
  Comparison to peer benchmarks (if disclosed)
  Margin implications
  Scaling story

CAUTION:
  External metrics need careful definition + consistency
  Once published externally, definition changes require disclosure
  Peer comparisons can be misleading (different denominators,
  different cost scopes)

LANGUAGE:
  Conservative; defensible; reproducible
  Cite the definition; cite the source
  Use ranges, not point estimates
```

### Common communication mistakes

```
MISTAKE                                       FIX
──────────────────────────────────────────────────────────────────
Engineering jargon (RBAC, Sankey, etc.)        Translate to business
to non-engineering audiences                   terms ("access control,"
                                              "cost flow")
                                              
Too many caveats (band, uncertainty, etc.)     For leadership: lead
when leadership wants a summary                with the number; caveat
                                              in the appendix
                                              
Numbers without context (just $X)              Add comparison +
                                              direction ("$X, up 8%
                                              from last quarter")
                                              
Story without numbers                          Anchor each story
                                              point with a number
                                              
Burying the lead                               Start with the
                                              conclusion; explain
                                              afterward
                                              
Single-number forecast presented as certain    Communicate range;
                                              "X to Y with Z most
                                              likely"
                                              
Mixing audiences in one presentation           Tailor the deck to the
                                              audience; separate
                                              technical from business
                                              versions
```

### Slide / report template

A canonical one-slide unit economics report:

```
SLIDE: Unit Economics — Q1 2026
─────────────────────────────────────────────────────────
HEADLINE: Cost-per-paying-user improved ~10% Q-o-Q
$13.20 → $11.83

DRIVERS:
  + Q1 cost optimization sprint (-$1.80 per paying user)
  + Paying user growth +12% Q-o-Q
  - New feature launches (+$0.40 per paying user, expected)

FORECAST Q2:
  Cost-per-paying-user: $11.00 (likely)
  Range: $10.20 - $12.00
  Risk: feature launches may push to $12 short-term;
  expected to recover by end of Q2

ASK: approve Q2 optimization budget ($25K)
─────────────────────────────────────────────────────────
```

Crisp. Actionable. Includes the four sections; reads in 60 seconds.

### Cross-audience deck strategy

For an org-wide cost review, prepare layered slides:

```
HEADLINE SLIDE (for everyone):
  The one-slide template above

EXPANDED slides (for engineering or finance who want depth):
  Slide 2: Per-team breakdown
  Slide 3: Forecast methodology + confidence band
  Slide 4: Variance analysis vs prior quarter's forecast
  Slide 5: Specific recommendations to act on
  
APPENDIX (for finance close):
  Methodology details
  Scope definitions
  Change log entries
```

Present the headline first; offer to drill into any expanded slide on request. Most audiences stop at the headline; some want one level deeper; few want the full appendix.

### Communicating uncertainty

A common leadership pushback: "Why do you need a range? Just give me the number."

```
RESPONSE:
  "The number you'd want is the LIKELY scenario: $11.
  The reason for the range is so you can plan for the worst case
  ($13) without over-investing in optimism. If the actual lands
  outside the range, that's a signal something unexpected happened —
  and we'll diagnose it."
  
LEADERSHIP TYPICALLY ACCEPTS this framing once explained.
```

Communicating uncertainty builds trust over time as outcomes fall within (or near) the band.

### How ZopNight supports communication

ZopNight's Unit Economics report includes export options for slides and finance reports. The report template includes the four-section narrative structure; the report can be exported as PDF or PowerPoint with placeholders for narrative annotations.

For board reports, the customer's FinOps Lead typically curates the data into the company's standard board template.

---

## 2. Demo

A real CFO presentation:

```
QUARTERLY FINANCE REVIEW
SLIDE: Unit Economics — Q1 2026

[ HEADLINE BIG NUMBER ]
COST PER PAYING USER:
  Q4 2025: $13.20
  Q1 2026: $11.83  ↓ ~10%

[ DRIVERS (top 3) ]
  Q1 cost optimization sprint:        -$1.80 / paying user
  Paying user growth (+12%):           Stable per-user
  Q1 feature launch:                   +$0.40 / paying user (temporary)

[ Q2 OUTLOOK ]
  Forecast: $11.00 / paying user (LIKELY)
  Range: $10.20 - $12.00
  Risk: new feature launches expected to push to $12 short-term

[ ASK ]
  Approve Q2 optimization budget ($25K) to sustain trajectory

[ CFO RESPONSE ]
  "Cost-per-paying-user improved ~10% Q-o-Q. Forecast continues down.
  The $25K optimization spend pays back in <2 months. Approved."

ELAPSED: 5-minute slot; question + approval included.
```

Compare to the alternative (engineering-style detailed presentation):

```
SAME DATA, ENGINEERING FRAMING:
  Slide 1: Methodology (numerator scope, denominator definition)
  Slide 2: Per-resource cost breakdown
  Slide 3: Confidence band analysis
  Slide 4: Tag-attribution adjustments
  Slide 5: Service-by-service variance
  ...
  Slide 12: Conclusion + ask

Time required: 30+ min; CFO eyes glaze over by slide 6.
```

The engineering version is accurate but doesn't land.

---

## 3. Hands-on (5 min)

Draft a one-slide summary for your team's unit economics:

```
HEADLINE (one sentence with number):
  __________________________________________________________
  
DRIVERS (top 3):
  1. __________
  2. __________
  3. __________
  
FORECAST NEXT PERIOD:
  $__________ (likely) — Range: $___ to $___
  Risk: __________
  
ASK:
  □ FYI only
  □ Decision needed: __________

PRESENTATION CHECK:
  □ Lead with conclusion (not methodology)
  □ Numbers in every section
  □ Range communicated
  □ Specific ask
```

If you cannot fit the slide on one screen, the message is buried. Trim until it lands.

---

## 4. Knowledge check

### Q1
A finance presentation of unit economics should:

A. Include all the technical detail
B. Be a story with four sections: what happened, why, what's next, ask. Crisp; one slide; leads with the conclusion. Detail is in the appendix or available on request. The audience reads the headline first; only the most-engaged go deeper.
C. Random
D. Engineering-level methodology

<details>
<summary>Show answer</summary>

**Correct: B.** Story structure. Crisp. Detail in appendix.
</details>

### Q2
Engineering jargon in a CFO meeting:

A. Shows expertise
B. Loses audience. Translate to business terms (efficiency, trend, drivers, range). The CFO does not need to know what RBAC is; they need to know whether cost-per-user is improving and by how much. Translation is part of the job, not a compromise of rigor.
C. Required for accuracy
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Translate jargon. Rigor comes from the underlying data, not the technical vocabulary.
</details>

### Q3
A forecast with wide confidence band shown to leadership:

A. Hide the uncertainty for clarity
B. Communicate honestly. "Forecast: $11, range $10-$12, depending on launch impact." Honest about uncertainty builds trust over time as actuals fall within the band. Trust erodes when forecasts presented as certainties miss.
C. Just point estimate
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Honest about uncertainty. Range with most-likely; this is the mature finance posture.
</details>

---

## 5. Apply

Build the canonical one-slide report ([Reports → Unit Economics → Export](https://app.zopnight.com/reports/unit-economics)). Use it for monthly finance reviews; expand for quarterly board reports.

For new FinOps Leads, practice the 60-second version of the slide. If you can deliver the four sections in 60 seconds, the audience listens; if you need 5 minutes, you'll lose them.

---

## Related lessons

- [L1 — Picking the denominator](L1_picking_denominator.md)
- [L2 — The cost numerator](L2_cost_numerator.md)
- [L3 — Building the first dashboard](L3_first_dashboard.md)
- [L4 — Forecasting unit cost](L4_forecasting_unit_cost.md)

## Glossary terms touched

[Storytelling structure](../../../reference/glossary/storytelling-structure.md) · [Audience translation](../../../reference/glossary/audience-translation.md) · [Headline number](../../../reference/glossary/headline-number.md) · [Confidence band communication](../../../reference/glossary/confidence-band-communication.md)

---

## Module quiz

Complete M4.3 → 10-question module quiz unlocks the **Unit-Economist** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.3.L5
