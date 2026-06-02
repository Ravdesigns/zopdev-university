# Crawl — visibility-only orgs

§ T4 · M4.1 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** a Crawl-stage organization from its symptoms, **diagnose** the specific gaps holding it at Crawl, **and prescribe** the four move-up actions that lift an org from Crawl to Walk.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Tell whether our org is stuck in Crawl, name the specific gaps, and pick the right first move to start the climb." |
| **Personas** | FinOps Lead · FinOps Analyst · Engineering Leader |
| **Prerequisites** | T0 — Foundations |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember), Diagnose (Analyze), Prescribe (Evaluate) |

---

## 1. Concept

The FinOps Foundation defines three maturity stages: **Crawl**, **Walk**, **Run**. Crawl is the first — the foundational stage every org passes through, characterized by **visibility without action**. The org has dashboards, generates reports, knows the cost number — but consistently cannot get teams to act on what the data shows. Recommendations sit unreviewed; tickets accumulate; the FinOps team carries the work alone.

A Crawl org is not a failing org. It is a typical org early in its cost-discipline journey. The challenge is moving past it deliberately, not pretending it doesn't exist.

### Crawl symptoms

```
SIGNAL                                      WHAT IT INDICATES
──────────────────────────────────────────────────────────────────
FinOps team owns the bill                   No team-level ownership;
                                            cost is "finance's problem"
                                            
Cost report is a monthly PDF                 Engineering doesn't read;
                                            decisions don't happen
                                            in the PDF format
                                            
Tag coverage <70%                            Most spend Unattributed;
                                            attribution arguments
                                            dominate cost conversations
                                            
Recommendations sit unreviewed              Backlog grows; the highest-
                                            value recs are old and stale
                                            
Reservations bought ad-hoc                  No commitment modeling;
                                            often over-committed or
                                            under-committed
                                            
Engineers don't know team cost              Cost not part of the
                                            engineering team's daily
                                            decisions
                                            
Weekly meetings have cost as agenda          But action items rarely
item but never as action item               assigned or completed
                                            
Pre-merge cost estimation absent            Engineers don't see cost
                                            impact of their code changes
```

The cluster is recognizable: information exists in places that don't change behavior. The org has the tools; it lacks the operating model.

### Why orgs stay at Crawl

Crawl is not a stop the org consciously chooses. It is where many orgs land by default because the conditions to advance are absent:

```
CONDITION ABSENT                            WHY IT MATTERS
──────────────────────────────────────────────────────────────────
Team-level cost accountability              Engineering teams won't act
                                            on cost unless they own it
                                            
Operating cadence (weekly review)            Without recurring rhythm,
                                            cost conversations are
                                            ad-hoc and forgotten
                                            
Tagging discipline                          Attribution fights consume
                                            energy that should go to
                                            optimization
                                            
FinOps + engineering collaboration          FinOps in isolation
                                            recommends; engineering
                                            in isolation ignores
                                            
Cost-aware tooling in engineering            If cost isn't in the IDE,
workflows                                   PR, dashboard engineers use,
                                            cost is out-of-band
```

A Crawl org can stay at Crawl for years if no one names the gap and drives the move-up.

### The four move-up actions (Crawl → Walk)

In priority order, the actions that consistently move orgs to Walk:

```
1. ESTABLISH TEAM-LEVEL COST OWNERSHIP
   - Each team has a dashboard showing their resources and cost
   - Each team has a designated cost owner (team lead or assigned
     practitioner)
   - Cost appears in team's regular metrics
   - First step because everything else depends on this

2. GET TAG COVERAGE ABOVE 90%
   - Roll out auto-tagger; accept high-confidence predictions
   - Manually clean up high-spend Unattributed resources
   - Enforce tag policy in IaC (Terraform pre-merge checks)
   - Closes the attribution-fight loop

3. SCHEDULE AT LEAST ONE NON-PROD ENVIRONMENT
   - Pick a dev/staging environment; schedule it on/off
   - Demonstrate that operational discipline produces real savings
   - Builds the muscle for broader scheduling
   - Often saves 30-50% of non-prod cost

4. PUBLISH A WEEKLY KPI DASHBOARD
   - Daily or weekly cadence beats monthly
   - Key signals: total spend, team variance, tag coverage,
     recommendation backlog size
   - Distributed to engineering leadership + FinOps + finance
   - Establishes the rhythm
```

These four actions, executed deliberately, move an org from Crawl to Walk in **60-90 days**. Trying to do all four simultaneously usually means none of them lands; sequencing matters.

### What NOT to do at Crawl

The temptation at Crawl is to skip ahead — buy commitments, build a Sankey, hire a FinOps team. Each can wait until the foundation is in place:

```
TEMPTATION                                  WHY NOT YET
──────────────────────────────────────────────────────────────────
Buy reservations / Savings Plans            Without commitment modeling
                                            you'll under- or over-commit
                                            
Build elaborate dashboards                  No one will look until
                                            ownership exists
                                            
Hire a FinOps consultant team               Consultants can advise but
                                            cannot replace the operating
                                            model your org needs to build
                                            
Roll out auto-remediation                    Risk of breaking things
                                            without the operating cadence
                                            to monitor results
                                            
Quarterly cost reviews                      Without weekly rhythm,
                                            quarterly conversations
                                            lack continuity
```

The right approach: focus on the four move-up actions first. Defer everything else.

### How ZopNight identifies Crawl

ZopNight's onboarding includes a maturity self-assessment. Customers answer 8-10 questions; the system surfaces a maturity score and the top three gaps to address. For Crawl-stage orgs, the gaps almost always include team ownership, tagging, and operating cadence.

```
ZOPNIGHT MATURITY SCORE EXAMPLE (Crawl):
  Visibility:       4/5 (dashboards exist; data is there)
  Ownership:        1/5 (FinOps alone; no team owners)
  Operating model:  1/5 (no weekly cadence; monthly PDFs)
  Tagging:          2/5 (60% coverage; no policy)
  Commitments:      0/5 (no model; ad-hoc buys)
  Optimization:     2/5 (recs exist; not actioned)
  
OVERALL: Crawl
TOP 3 GAPS: Ownership, Operating model, Tagging
RECOMMENDED FIRST ACTION: Team ownership
```

For mature orgs that want to identify outlier teams, the assessment can also run per-team — a Run-stage org may have one Crawl-stage team that needs targeted support.

### The Crawl mindset shift

The hardest part of Crawl → Walk is not technical; it is **mindset**. The org has to stop treating cost as "finance's problem" or "FinOps's problem" and start treating it as "everyone's problem, with team-level ownership." This shift is more cultural than technical.

```
CRAWL MINDSET                               WALK MINDSET
──────────────────────────────────────────────────────────────────
"FinOps will tell us if cost is bad"         "We track our cost weekly"
"Tag drift isn't important"                   "Tagging is part of our PR"
"Reports come from finance"                   "We read our team's report"
"Recommendations are FinOps's job"           "We action our own recs"
"We can wait for end-of-month"                "We catch issues this week"
```

Move-up actions land best when the mindset is shifting in parallel — the team is becoming the owner, and the tools support the ownership.

---

## 2. Demo

A team's actual Crawl → Walk transition over 12 weeks:

```
WEEK 0 — BASELINE
  Tag coverage: 62%
  Monthly cost: $180K; report nobody reads
  Schedules: 0 (everything always-on)
  FinOps team owns the bill alone
  Weekly cadence: none
  Recommendations open: 47; oldest 4 months old
  Engineering knowledge of own team cost: low

WEEK 1-4 — TEAM OWNERSHIP + TAGGING
  Action 1: Designated team cost owners (one per of 5 teams)
  Action 2: Per-team dashboards published; teams trained
  Action 3: Auto-tagger run; accepted high-confidence predictions
  
  Tag coverage: 62% → 84%
  Team owners identified: 5/5
  Per-team dashboards: 5 published
  Awareness: teams now see their cost weekly

WEEK 4-8 — SCHEDULING + RHYTHM
  Action 3: Schedule on dev-platform group (47 resources)
  Action 4: Start weekly Operate meeting (FinOps + team leads)
  
  Tag coverage: 84% → 91%
  Schedules deployed: 1 environment
  Schedule savings: $4K/month
  Weekly meeting: established; 30 min recurring
  Recommendations actioned: 12 closed in 4 weeks

WEEK 8-12 — EXPANSION + STABILIZATION
  Action 3: Schedules on 2 more environments (staging, sandbox)
  Action 4: Weekly KPI email to engineering leadership
  
  Tag coverage: 91% → 94%
  Schedules deployed: 3 environments
  Total schedule savings: $12K/month
  Weekly meeting: 30 min; team leads attend
  Recommendations actioned: 26 closed; backlog at 21
  Engineer awareness of cost: high

WEEK 12 — WALK STAGE ACHIEVED
  Tag coverage: 94% (above the 90% threshold)
  Each team has their cost numbers
  Weekly cadence established and sticky
  Operating discipline demonstrated
  Next stage: M4.1.L2 (Walk)
```

8-12 weeks for a deliberate transition. The four actions, sequenced, deliver the maturity stage shift.

---

## 3. Hands-on (5 min)

Self-assess your org on the Crawl symptoms:

```
SYMPTOMS PRESENT (check those that apply):
  □ FinOps team owns the bill alone
  □ Monthly cost report (PDF or similar)
  □ Tag coverage <70%
  □ Recommendations sit unreviewed for weeks
  □ Reservations bought ad-hoc (no model)
  □ Engineers don't know their team's cost
  □ Weekly meetings don't include cost
  □ Pre-merge cost estimation not in place

CRAWL-STAGE DIAGNOSIS:
  How many checked?  _____ of 8
  4+ checked: probably Crawl
  
TOP 3 GAPS to close (from your checks):
  1. __________
  2. __________
  3. __________

FIRST MOVE-UP ACTION:
  (Pick from the four; usually team ownership goes first)
  Action: __________
  Owner:  __________
  Timeline: __________
```

If you checked fewer than 2 symptoms, you're past Crawl. Move to L2 (Walk).

---

## 4. Knowledge check

### Q1
Crawl is defined by:

A. No data at all
B. Visibility without action. The org has dashboards and reports, but consistently cannot get teams to act on the findings. The information exists in places that don't change behavior.
C. Mature operations
D. Just commitments

<details>
<summary>Show answer</summary>

**Correct: B.** Visibility vs action is the Crawl signature. The fix is operating model, not more data.
</details>

### Q2
The first move-up action from Crawl is typically:

A. Buy reservations
B. Establish team-level cost ownership. Each team gets a dashboard, a designated cost owner, and cost in their regular metrics. Everything else depends on this — without ownership, dashboards go unread, recs unactioned, schedules un-built.
C. Hire a FinOps consultant
D. Quarterly cost reviews

<details>
<summary>Show answer</summary>

**Correct: B.** Ownership is the leverage point. The other three move-up actions all assume ownership exists.
</details>

### Q3
Typical Crawl → Walk timeline:

A. 1 day
B. 60-90 days of deliberate work across the four move-up actions. Faster than that is usually superficial; slower than that means the work isn't focused.
C. 1 year
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 2-3 months with focus. Each move-up action takes 2-4 weeks of focused effort.
</details>

---

## 5. Apply

Self-assess at [Settings → Maturity](https://app.zopnight.com/settings/maturity) (if available in your tier) or use the informal checklist above. The maturity dashboard surfaces top 3 gaps with specific next-action recommendations.

For new orgs starting at Crawl, schedule a kick-off meeting where the four move-up actions are owned and scoped. 60-90 days from kick-off to Walk is achievable with consistent focus.

---

## Related lessons

- [L2 — Walk: weekly Operate cadence](L2_walk.md) *(next)*
- [L3 — Run: forecasted and automated](L3_run.md)
- [L4 — Maturity anti-patterns](L4_antipatterns.md)
- [L5 — 90-day move-up plan](L5_90_day_plan.md)
- [T3.M3.5.L4 — Tag coverage](../../T3_zopnight_architect/M3.5_showback/L4_tag_coverage.md)

## Glossary terms touched

[Crawl stage](../../../reference/glossary/crawl-stage.md) · [FinOps Foundation](../../../reference/glossary/finops-foundation.md) · [Move-up action](../../../reference/glossary/move-up-action.md) · [Team-level ownership](../../../reference/glossary/team-level-ownership.md) · [Operating cadence](../../../reference/glossary/operating-cadence.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.1.L1
