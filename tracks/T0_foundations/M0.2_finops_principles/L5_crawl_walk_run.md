# Crawl, Walk, Run — pick your starting maturity

§ T0 · M0.2 · L5 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **self-assess** an organization against the three FinOps maturity stages **and draft** a 90-day move-up plan.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Tell me where my org actually sits on the maturity curve, no flattery." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | L1–L4 |
| **Time** | 10 minutes |
| **Bloom verb** | Self-assess (Evaluate) and Draft (Create) |

---

## 1. Concept

The FinOps Foundation uses a three-stage maturity model — **Crawl, Walk, Run** — to describe how a practice evolves. The model is not a ladder where each rung is unlocked sequentially. It is a framework that names the stage so the organization can have an honest conversation about what to do next.

```
STAGE    DEFINING TRAIT                          TYPICAL TIME IN STAGE
─────────────────────────────────────────────────────────────────────
CRAWL    Spend visibility exists, action does not  6–18 months
WALK     Optimization happens, decay still wins   12–24 months  
RUN      Operate cadence compounds savings        ongoing
```

Most organizations live in Crawl longer than they think and move to Run later than they hope.

### Crawl

**Defining trait:** The organization can pull a bill but cannot reliably act on it. Cost data exists in spreadsheets, dashboards, or a FinOps tool. The bill is read. Reports go out. But the action surface is weak: no scheduling, recommendations sit unreviewed, tag coverage is below 70%, no team budget enforcement.

**Anti-patterns at this stage:**
- FinOps team owns the bill but cannot make any team turn things off
- Monthly cost report exists but is "for finance"
- Engineers do not know their team's cost
- Reservations are bought ad-hoc without modelling

**Signature symptom:** the FinOps team has high read rates on dashboards and low decisions-per-week.

**To move up:** establish team-level cost ownership. Tag coverage above 90%. Schedule at least one non-prod environment. Publish weekly KPI dashboard.

### Walk

**Defining trait:** Optimization happens, but savings decay without sustained pressure. There is an Operate cadence, but it is monthly, not weekly. Schedules exist but drift. Recommendations are reviewed but not consistently triaged. Some teams have budgets, others do not. Tag coverage is 90–95%.

**Anti-patterns at this stage:**
- Sprint-driven optimizations followed by quiet six-month decay
- Reservations bought before steady-state floor is known
- Some teams excel, others ignore — no consistency
- KPIs measured monthly, not weekly

**Signature symptom:** the same recommendation appears, gets dismissed, appears again two months later.

**To move up:** weekly Operate cadence. Five KPIs reviewed every week. Every team has a budget and reads it. Anomalies have an owner. Commitments calibrated to post-schedule floor.

### Run

**Defining trait:** The Operate cadence compounds. New recommendations are reviewed weekly and triaged within days. Savings persist because the cadence persists. Unit economics is a primary KPI alongside total spend. Tag coverage is above 98%. Every team has a budget. Anomalies are root-caused inside 24 hours.

**Anti-patterns at this stage:**
- Treating Run as a finish line ("we made it, we can relax")
- Letting the Operate cadence skip during major events without scheduling a make-up
- Failing to refresh the framework as new clouds or services are adopted

**Signature symptom:** the avoidable-spend KPI is consistently below 5% and unit economics tracks business growth.

**To stay at Run:** never drop the weekly cadence. Re-baseline quarterly. Bring in new clouds / new tooling under the same framework.

### Stage is per-capability, not per-organization

The FinOps Foundation's full framework rates maturity **per capability** (there are 22 of them, see [T4.M4.1](../../T4_finops_mastery/M4.1_maturity_ladder/00_README.md)). An organization can be at Run on Reporting & Analytics, Walk on Anomaly Management, and Crawl on Forecasting all at once. The averaged stage is less useful than the per-capability heat map.

For a self-assessment, the practical model is: pick the four to six capabilities most relevant to the next quarter's goals. Score each. Pick the worst two. The 90-day plan focuses on moving those two from Crawl to Walk, or Walk to Run.

### The 90-day move-up plan

```
WEEK     ACTION
─────────────────────────────────────────────────────────────
1–2      Self-assess (the table above). Pick two worst capabilities.
3–4      Publish the 90-day plan. Establish the weekly cadence.
5–8      Execute on the two worst capabilities (concrete actions).
9–10     Re-baseline. Are the two worst now Walk instead of Crawl?
11–12    Identify the next two worst. Repeat.
─────────────────────────────────────────────────────────────
```

The pattern is *narrow focus + recurring cadence*. Not *broad sweep + one-time push*.

---

## 2. Demo

A real self-assessment from an Engineering-Leader-led FinOps practice:

```
CAPABILITY                       STAGE     EVIDENCE
─────────────────────────────────────────────────────────────────
Data Ingestion                   Walk      Billing data daily, cost source labelled
Allocation                       Walk      Team tagging 91% coverage
Reporting & Analytics            Walk      Weekly KPI dashboard exists
Anomaly Management               Crawl     Anomalies detected but no owner
Forecasting                      Crawl     Quarterly forecast, no accuracy tracking
Budgeting                        Walk      Per-team budgets, alerts wired
Unit Economics                   Crawl     Defined but not tracked
Architecting / Workload Place.   Walk      
Usage Optimization               Walk      Schedules + recs, lever 1+2 active
Rate Optimization                Crawl     Commitments not modelled
─────────────────────────────────────────────────────────────────
WEAKEST TWO: Anomaly Management, Forecasting
90-DAY PLAN: assign anomaly owner per team; add forecast accuracy tracking
```

Two clear targets. Twelve weeks to move them from Crawl to Walk.

(Asset to produce: a radar / heatmap visualization of the 22 capabilities. Path: `assets/diagrams/M0.2_L5_capability_heatmap.svg`.)

---

## 3. Hands-on (7 min)

Pick six capabilities you can confidently score:

```
1. Data Ingestion              Crawl / Walk / Run
2. Allocation                  Crawl / Walk / Run
3. Reporting & Analytics       Crawl / Walk / Run
4. Anomaly Management          Crawl / Walk / Run
5. Budgeting                   Crawl / Walk / Run
6. Usage Optimization          Crawl / Walk / Run
```

For each Crawl: what is the single highest-impact thing to do in the next 30 days that would move it to Walk? Write it. The 90-day plan is the consolidation of the answers.

---

## 4. Knowledge check

### Q1
A team can pull the bill, has good dashboards, but cannot get any team to act on the data. The team is most likely at:

A. Crawl
B. Walk
C. Run
D. Walk on Inform, Crawl on Optimize

<details>
<summary>Show answer</summary>

**Correct: D.** Per-capability assessment is the right model. Strong Inform with weak Optimize is the textbook profile of an organization stuck before Walk.
</details>

### Q2
A team reports: "We did an optimization sprint, saved $40K monthly, but six months later only $22K of those savings remain." Most likely stage:

A. Crawl
B. Walk
C. Run
D. Beyond Run

<details>
<summary>Show answer</summary>

**Correct: B.** This is the classic Walk symptom — optimization happens, savings decay. Run organizations do not see this pattern because the Operate cadence holds the line.
</details>

### Q3
A 90-day move-up plan should:

A. Address all 22 capabilities at once
B. Focus on the two worst capabilities and move them up one stage
C. Wait until the next quarter to begin
D. Hire a consultant first

<details>
<summary>Show answer</summary>

**Correct: B.** Narrow focus, recurring cadence. Trying to fix all 22 capabilities at once is the failure mode that produces nothing moving.
</details>

---

## 5. Apply

ZopNight does not (yet) ship a self-assessment widget. The capability scoring is a manual exercise done annually or quarterly.

What ZopNight does support directly:

- **Crawl → Walk** moves on Inform (Reports surface) and Allocation (Tag attribution)
- **Walk → Run** moves on Anomaly Management (15-min detection) and Budgeting (per-team budgets with thresholds)
- **Walk → Run** moves on Usage Optimization (recommendations + auto-remediation + scheduling)

The [T4 — FinOps Domain Mastery](../../T4_finops_mastery/00_README.md) track expands on the maturity ladder with per-capability deep dives.

---

## Related lessons

- [L6 — The FOCUS specification, in plain English](L6_focus_spec.md) *(next)*
- [T4.M4.1 — FinOps maturity ladder](../../T4_finops_mastery/M4.1_maturity_ladder/00_README.md)

## Glossary terms touched

[Crawl-Walk-Run](../../../reference/glossary/crawl-walk-run.md) · [Maturity model](../../../reference/glossary/maturity-model.md) · [Per-capability assessment](../../../reference/glossary/per-capability-assessment.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.2.L5
