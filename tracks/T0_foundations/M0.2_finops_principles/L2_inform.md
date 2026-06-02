# Inform — what visibility actually means

§ T0 · M0.2 · L2 of 6 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** raw visibility from actionable visibility, **and design** a cost reporting cadence that fits each audience.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Make our cost dashboards actually get used." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | [L1](L1_six_principles.md) |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze) and Design (Create) |

---

## 1. Concept

**Inform** is the first phase of the FinOps lifecycle. It answers the question: *who knows what about cloud spend, when, in what form, and with what action available?* Most FinOps initiatives stall here because raw visibility is mistaken for actionable visibility.

### Raw visibility vs. actionable visibility

```
RAW VISIBILITY                     ACTIONABLE VISIBILITY
────────────────────────────────────────────────────────────────────
A dashboard exists                 The dashboard is opened weekly
The bill is exportable             The bill is parsed by someone who owns the cost
There is a cost report             The report carries a verdict ("we are over budget")
You can see your team's spend      You can compare your team's spend to peers
There is a Slack alert             The alert names a specific action and an owner
```

The difference is whether the data leads to a decision. A dashboard that nobody opens is not visibility. A weekly report that is forwarded but not read is not visibility. A Slack channel where alerts pile up is not visibility.

### The three audiences

Inform fails when one report tries to serve three audiences. Engineering, finance, and leadership each need a different cadence, granularity, and shape.

| Audience | Cadence | Granularity | Shape | Decision they make |
|---|---|---|---|---|
| **Engineering team** | Daily / on-demand | Per-resource | Self-serve dashboard + Slack alerts | "Is my team's spend tracking? Is anything anomalous in my service?" |
| **Engineering leadership** | Weekly | Per-team, per-environment | One-page report + drill | "Which teams need help? Which trends need attention?" |
| **Finance / leadership** | Monthly | Per-cost-center | One-page report with unit-economics overlay | "Are we forecasted? Did we deliver the value?" |

Trying to serve all three from one dashboard produces a tool that nobody uses. The engineer needs more granularity than the CFO can absorb. The CFO needs more business framing than the engineer wants to maintain.

### The four cost-data shapes

Inform produces data in four shapes. Each fits a different decision.

**1. Snapshot.** "What did we spend last month?" Single number. Useful for top-line communication. Useless for drilling.

**2. Trend.** "Are we going up or down?" Time series. Useful for catching slow drifts. Misses sharp events.

**3. Breakdown.** "Where is the money?" Stacked bar or Sankey. Useful for understanding composition. Misses outliers within a stack.

**4. Anomaly.** "What changed unexpectedly?" Per-dimension deviation alert. Useful for catching sharp events. Useless without root-cause attribution.

A healthy Inform practice produces all four. Most practices produce one or two.

### The cadence test

For each cost surface in the organization, answer two questions:

- *Who reads this?*
- *What decision do they make after reading it?*

If the answer to either is unknown, the surface is not yet earning its keep. Either find the audience and the decision, or retire it.

### What "accurate" means in the Inform principle

Principle 4 says cost data must be accessible, timely, and *accurate*. Accuracy in cloud cost is a band, not a point. Live calculated cost (rack rate) is accurate to within 5–15 percent of billed cost. Daily billing cost is accurate to within ~1 percent of monthly settled. Monthly settled is the closed invoice.

Each band serves a use. "Accurate" means knowing which band you are looking at and labelling it. (See [M0.1 L3](../M0.1_cloud_bill_decoded/L3_granularity_vs_timeliness.md).)

---

## 2. Demo

The same monthly spend question, three audiences, three different surfaces:

**Engineering (daily, self-serve):**
> Dashboard: live cost trend by service, grouped by team. Filter to "my team." Anomaly markers on the chart. Click a marker → root-cause panel.

**Engineering leadership (weekly, one-page):**
> Email-friendly report: total bill, week-over-week change, top three movers (up and down), open recommendations with savings totals.

**Finance (monthly, one-page):**
> PDF or shareable URL: total spend, variance vs. budget, cost-per-MAU trend, top three cost centers, forecast for next quarter with confidence band.

Same underlying data. Three rendered surfaces. Three usable decisions.

(Asset to produce: a three-panel mockup of these three views, side by side. Path: `assets/diagrams/M0.2_L2_three_audiences.svg`.)

---

## 3. Hands-on (6 min)

For each of the three audiences in your organization, answer:

```
1. What cost surface does this audience use today?
   Engineering team:     ________________
   Engineering leader:   ________________
   Finance / leadership: ________________

2. What is the read cadence?
   Engineering team:     ________________
   Engineering leader:   ________________
   Finance / leadership: ________________

3. What decision does each one make from it?
   Engineering team:     ________________
   Engineering leader:   ________________
   Finance / leadership: ________________
```

For any cell where the cadence is "rare" or the decision is "none," the surface is failing. The fix is either to find the right shape, the right granularity, or to retire the surface and replace it with one that fits.

---

## 4. Knowledge check

### Q1
A monthly cost report is sent as a PDF to engineering teams. Most teams do not open it. Best diagnosis:

A. Engineering teams do not care about cost
B. The shape and cadence are wrong for the audience. Engineering needs daily, self-serve, per-resource granularity. A monthly PDF is finance-shaped.
C. The PDF is not visually appealing
D. Cost is not the team's job

<details>
<summary>Show answer</summary>

**Correct: B.** Engineering will read a self-serve dashboard with daily freshness and per-service granularity. They will not read a monthly PDF designed for finance. The fix is to give engineering a different shape.
</details>

### Q2
A FinOps team launches a Slack channel for cost alerts. After two weeks the channel has 400 messages and is on mute. Most accurate diagnosis:

A. Slack is the wrong tool
B. Alert volume is too high relative to actionability. Each alert needs to name a specific resource, owner, and action. Otherwise the channel becomes noise.
C. Engineers do not check Slack
D. The integration is broken

<details>
<summary>Show answer</summary>

**Correct: B.** Anomaly alerts without root cause and owner attribution become noise within days. The right move is to throttle by severity, attach the suspected root cause, and route to the owning team's primary channel — not a central FinOps channel.
</details>

### Q3
An engineering leader asks: "Which teams need help?" Which Inform shape best answers this?

A. Snapshot
B. Trend
C. Breakdown
D. Anomaly

<details>
<summary>Show answer</summary>

**Correct: C.** Breakdown by team, sorted by absolute spend or variance, surfaces who needs help. Trend shows direction; breakdown shows distribution; anomaly shows events. The question is fundamentally a distribution question.
</details>

---

## 5. Apply

ZopNight's Inform surface has three personas baked in:

- **Engineering team** → Reports → Cost Breakdown, Reports → Resources, MCP for self-serve queries
- **Engineering leadership** → Dashboards → Engineering preset, Weekly summary email
- **Finance / leadership** → Dashboards → FinOps preset and Executive preset, with the cost-per-unit overlay (see [T3.M3.5 L5](../../T3_zopnight_architect/M3.5_showback/L5_unit_economics_in_product.md))

The four shapes are all present: Trend (Reports → Cost Trend), Breakdown (Reports → Cost Flow Sankey), Snapshot (Dashboards), Anomaly (Reports → Anomalies with 15-min cadence).

[Open ZopNight Dashboards](https://app.zopnight.com/dashboards) *(deep link)*

---

## Related lessons

- [L3 — Optimize: the four levers](L3_optimize.md) *(next)*
- [T3.M3.7 — Dashboards as a governance surface](../../T3_zopnight_architect/M3.7_dashboards/00_README.md)
- [T2.M2.10 — Cost anomaly detection](../../T2_zopnight_engineer/M2.10_cost_anomaly/00_README.md)

## Glossary terms touched

[Inform](../../../reference/glossary/inform.md) · [Actionable visibility](../../../reference/glossary/actionable-visibility.md) · [Cadence](../../../reference/glossary/cadence.md) · [Cost shape](../../../reference/glossary/cost-shape.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.2.L2
