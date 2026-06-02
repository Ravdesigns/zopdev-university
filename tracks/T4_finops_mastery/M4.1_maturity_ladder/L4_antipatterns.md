# Five anti-patterns at each stage

§ T4 · M4.1 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the stage-specific anti-patterns at Crawl, Walk, and Run, **identify** the cross-stage anti-patterns that worsen at higher maturity, **and prescribe** structural fixes rather than exhortation.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Name the structural traps that are holding our maturity progress back, and design fixes that don't depend on 'trying harder'." |
| **Personas** | FinOps Lead · Engineering Leader · Platform Engineer |
| **Prerequisites** | M4.1.L1-L3 (Crawl, Walk, Run) |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Remember), Identify (Analyze), Prescribe (Evaluate) |

---

## 1. Concept

Each FinOps maturity stage has its own characteristic anti-patterns. Recognizing them in your own org is the precondition to fixing them, and the fix is almost always **structural change** — to data model, organizational cadence, or ownership — not to attitudes or effort.

### Crawl anti-patterns

```
1. FINOPS TEAM OWNS THE BILL
   FinOps is the single point of contact; teams have no ownership.
   FIX: assign cost ownership to each team via tags + dashboards.
   
2. MONTHLY PDF REPORTS
   Reports generated as static documents; nobody reads them.
   FIX: self-serve dashboards in the tool, not PDFs.
   
3. COST DATA BEHIND FIREWALL
   Cost data accessible only to finance / FinOps; engineering
   needs to ask for it.
   FIX: per-team RBAC + accessible dashboards.
   
4. ENGINEERS DON'T KNOW TEAM COST
   No regular surface showing "this is your team's cost."
   FIX: per-team dashboards + weekly KPI emails.
   
5. RESERVATIONS BOUGHT WITHOUT MODELING
   Commitments made ad-hoc without post-schedule floor analysis.
   FIX: defer commitment purchases until basic discipline is in place.
```

### Walk anti-patterns

```
1. SPRINT-DRIVEN OPTIMIZATION
   One-time efforts; no weekly cadence; decay sets in.
   FIX: weekly Operate meeting; 5 KPIs tracked.
   
2. RESERVATION OVERCOMMITMENT
   Bought reservations at peak usage; floor is much lower.
   FIX: model the floor before buying; right-size commitments.
   
3. INCONSISTENT TEAM ADOPTION
   Some teams excel at cost discipline; others ignore.
   FIX: org-wide accountability metrics + leadership backing.
   
4. MONTHLY KPI REVIEW
   Monthly is too slow to catch drift; weekly is the rhythm.
   FIX: weekly KPI review with monthly + quarterly deeper passes.
   
5. NO ANOMALY OWNER
   Alerts go to channels; nobody triages them.
   FIX: designated anomaly responder; <24-hour response SLA.
```

### Run anti-patterns

```
1. TREATING RUN AS A DESTINATION
   "We're at Run; the work is done." Practice atrophies.
   FIX: ongoing discipline; quarterly maturity self-assessment.
   
2. SKIPPING CADENCE DURING MAJOR EVENTS
   Major outage / launch eats Operate meeting; never re-establishes.
   FIX: make-up reviews; cadence is non-optional even during events.
   
3. NOT REFRESHING THE FRAMEWORK
   New clouds / new services adopted; cost model not updated.
   FIX: quarterly framework review; update tag policy, KPIs, etc.
   
4. CONFUSING TOOL WITH PRACTICE
   "We have ZopNight; we have FinOps." A tool without practice
   doesn't move the needle.
   FIX: invest in practice (cadence, ownership, rituals) as
   much as in tooling.
   
5. ATTRIBUTION DRIFT UNNOTICED
   Tag coverage slowly slips; nobody notices until much later.
   FIX: tag coverage as a tracked KPI; alert on downward trend.
```

### Cross-stage anti-patterns

These appear at any stage and worsen at higher stages:

```
1. HARD-CODED AUTO-STOP BUDGETS
   Budgets that auto-disable resources at 100%.
   PROBLEM: production safety risk; false positives common.
   FIX: alert + human conversation; never auto-enforce.
   
2. SCHEDULES WITHOUT OWNERSHIP
   When a schedule fails, no one notices or acts.
   FIX: every schedule has a designated owner + alert routing.
   
3. TAGS MANAGED INFORMALLY
   Tag values vary by who provisioned; no policy.
   FIX: tag taxonomy + IaC enforcement + auto-tagger.
   
4. COST OPTIMIZATION SEPARATED FROM ENGINEERING
   FinOps team optimizes; engineering builds. No integration.
   FIX: cost in PR review, pre-merge estimation, engineering OKRs.
   
5. VANITY METRICS
   "We reviewed 200 recommendations this quarter."
   Measures activity, not impact.
   FIX: measure realized savings, decay rate, unit economics.
```

### How anti-patterns compound

A stage's anti-patterns make moving up harder:

```
CRAWL → WALK is blocked by:
  - "FinOps team owns the bill" (no team-level adoption possible)
  - "Cost data behind firewall" (no visibility for engineering)
  
WALK → RUN is blocked by:
  - "Sprint-driven" (no weekly cadence to enable Run)
  - "No anomaly owner" (incident response can't scale)
  
SUSTAINING RUN is blocked by:
  - "Framework not refreshed" (drift unaddressed)
  - "Confusing tool with practice" (atrophy)
```

The unblock is structural, not effort-based.

### The fix is structural

For each anti-pattern, the fix is **structural change**, not exhortation:

```
ANTI-PATTERN                      EXHORTATION (wrong)        STRUCTURAL FIX
──────────────────────────────────────────────────────────────────
"FinOps owns the bill"            "Engineering should care    Assign cost ownership
                                  about cost"                 via tags + per-team
                                                              dashboards (data model
                                                              change)
                                                              
"Sprint-driven"                   "Be more consistent"        Establish weekly meeting
                                                              with agenda template
                                                              (org cadence change)
                                                              
"No anomaly owner"                "Engineers should respond"   Assign on-call rotation;
                                                              define escalation paths
                                                              (ops process change)
                                                              
"Vanity metrics"                  "Measure better"            Switch KPIs from
                                                              activity to outcome
                                                              (KPI definition change)
```

Exhortation ("try harder," "be more rigorous") does not fix anti-patterns. Structure does. The structural change is usually a one-time effort that pays back for years; the exhortation is a recurring effort that fades after weeks.

### Recognizing your own anti-patterns

The diagnostic question: **"What pulls our maturity backward?"**

```
If recent regressions happened, what caused them?
  Practitioner left? → ownership-too-concentrated anti-pattern
  Reorg dissolved team? → ownership-via-team-only anti-pattern
  Incident skipped cadence? → cadence-fragile anti-pattern
  New cloud not integrated? → framework-not-refreshed anti-pattern
```

The cause of the regression usually points at the structural anti-pattern that needs fixing.

### How ZopNight surfaces anti-patterns

ZopNight's maturity assessment surfaces stage-specific anti-patterns based on observed signals:

```
SIGNAL DETECTED                            SUGGESTED FIX
──────────────────────────────────────────────────────────────────
Tag coverage trending down                  "Framework refresh" + 
                                            auto-tagger re-run
                                            
Recommendation backlog >50 days old         "Sprint-driven" pattern;
                                            establish triage cadence
                                            
One person owns most actions in audit       "Ownership too concentrated"
                                            spread to team owners
                                            
Realized savings declining over time        Decay pattern; switch
                                            from project to operate mode
                                            
No KPI dashboard visits in 30 days          "Tool vs practice" gap
```

Each signal points to a structural fix.

---

## 2. Demo

A real anti-pattern audit:

```
ORG:  200-engineer SaaS, 2 years on cloud
CURRENT MATURITY: Crawl-Walk borderline

ANTI-PATTERNS IDENTIFIED:
  ✗ FinOps team (3 people) owns the bill alone        [Crawl AP1]
  ✗ Monthly cost report (PDF, finance-distributed)     [Crawl AP2]
  ✗ 38% Unattributed spend                              [Crawl AP3]
  ✗ Reservations bought for non-prod                    [Cross-stage]
  ✗ No weekly Operate cadence                            [Walk AP1]
  ✗ Recommendations sit unreviewed                       [Walk AP4 / Crawl]

DIAGNOSIS: Org at Crawl with some Walk aspirations.
Multiple structural anti-patterns.

REMEDIATION PLAN (sequenced, structural):

WEEK 1-4 — Team Ownership + Visibility:
  Action: Per-team dashboards published
  Structural change: data model — team tags + per-team RBAC
  Owner: FinOps Lead + 1 platform engineer
  Target: 5 teams onboarded to their dashboards

WEEK 5-8 — Tagging:
  Action: Auto-tagger + IaC tag enforcement
  Structural change: tag taxonomy committed; CI pre-merge check
  Owner: Platform Engineering
  Target: Untagged spend < 10%

WEEK 9-12 — Cadence:
  Action: Weekly Operate meeting starts
  Structural change: recurring 30-min meeting with template
                     agenda; 5 KPIs in dashboard
  Owner: FinOps Lead chairs; team leads attend
  Target: 12 consecutive weekly meetings held

MONTH 6-9 — Maturity assessment at Walk.
              Defer reservation review until then; current
              over-commitment audit needed first.
              
YEAR 1-2 — Establish Run via weekly cadence reaching maturity.

The plan is structural at every step. No exhortation; just changes
to data model, cadence, and ownership.
```

---

## 3. Hands-on (5 min)

Audit your org for anti-patterns:

```
YOUR STAGE (self-assessed):    Crawl / Walk / Run

ANTI-PATTERNS PRESENT (check those that apply):

Crawl APs:
  □ FinOps team owns the bill alone
  □ Monthly PDF reports
  □ Cost data behind firewall
  □ Engineers don't know team cost
  □ Reservations without modeling
  
Walk APs:
  □ Sprint-driven optimization
  □ Reservation overcommitment
  □ Inconsistent team adoption
  □ Monthly (not weekly) KPI review
  □ No anomaly owner

Run APs:
  □ Treating Run as a destination
  □ Skipping cadence during events
  □ Framework not refreshed for new clouds
  □ Tool ≠ practice gap
  □ Attribution drift unnoticed

Cross-stage APs:
  □ Hard-coded auto-stop budgets
  □ Schedules without ownership
  □ Tags managed informally
  □ Cost separated from engineering
  □ Vanity metrics

TOP 2 ANTI-PATTERNS to address first (highest leverage):
  1. __________
  2. __________

STRUCTURAL FIX for each:
  1. __________
  2. __________
```

The discipline is to fix anti-patterns one or two at a time, not chase all of them. Structural change takes commitment.

---

## 4. Knowledge check

### Q1
A Walk org's most common anti-pattern:

A. Cloud provider choice
B. Sprint-driven optimization. One-time effort produces savings that decay over the following 6-12 months. The fix is weekly Operate cadence — structural change, not bigger sprints. Without the cadence, the same anti-pattern resurfaces every year.
C. Random
D. Tool choice

<details>
<summary>Show answer</summary>

**Correct: B.** Sprint vs sustained is the Walk pattern. The cadence fix is structural.
</details>

### Q2
A Crawl org buying reservations without modeling:

A. Best practice
B. Anti-pattern. Reservations need post-schedule floor analysis. Pre-Walk orgs lack the operational discipline to compute that floor reliably. Result: over-commitment that gets harder to unwind. Defer commitment purchases until basic discipline (scheduling, tagging, weekly cadence) is in place.
C. Required by AWS
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Over-commitment trap. Schedule first; commit later.
</details>

### Q3
The fix for any anti-pattern is:

A. Exhortation — "try harder"
B. Structural change. New cadence, new ownership, new tooling, new policy, new data model. Exhortation produces brief improvement followed by reversion. Structure produces sustained change.
C. Random
D. Cloud upgrade

<details>
<summary>Show answer</summary>

**Correct: B.** Structural change. Effort doesn't fix structure.
</details>

---

## 5. Apply

Audit your org with the checklist above. Pick 1-2 anti-patterns; design structural fixes; commit to a quarter of work on each. Resist the temptation to address all anti-patterns at once — focus is what makes structural change land.

ZopNight's maturity dashboard surfaces detected anti-patterns with suggested structural fixes ([Settings → Maturity](https://app.zopnight.com/settings/maturity)).

---

## Related lessons

- [L1 — Crawl: visibility-only orgs](L1_crawl.md)
- [L2 — Walk: optimization motion](L2_walk.md)
- [L3 — Run: operate cadence compounds](L3_run.md)
- [L5 — 90-day move-up plan](L5_90_day_plan.md) *(next)*

## Glossary terms touched

[Anti-pattern](../../../reference/glossary/anti-pattern.md) · [Structural fix](../../../reference/glossary/structural-fix.md) · [Cross-stage anti-pattern](../../../reference/glossary/cross-stage-anti-pattern.md) · [Vanity metrics](../../../reference/glossary/vanity-metrics.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.1.L4
