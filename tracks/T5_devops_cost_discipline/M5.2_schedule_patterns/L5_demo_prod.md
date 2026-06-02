# Demo / prod-like environments

§ T5 · M5.2 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** demo-prod from staging/dev/prod, **configure** the right schedule pattern for sales demos / training / investor showcases, **and recover** the often-forgotten cost from idle demo environments.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule demo and training environments so they're available when needed but not running 24/7 forever after the project is forgotten." |
| **Personas** | Platform Engineer · Sales Engineering · FinOps Lead |
| **Prerequisites** | M5.2.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Configure (Apply), Recover (Apply) |

---

## 1. Concept

Demo-prod = a production-like environment for showcases, customer demos, sales pitches, training. Different from prod (real customers), staging (pre-deployment verification), or dev (engineer iteration).

```
ENVIRONMENT TYPE         AUDIENCE                 SCHEDULING POSTURE
─────────────────────────────────────────────────────────────────
PROD                     Real customers            24/7 always-on
STAGING                  Internal: pre-deploy      Business hours,
                          verification              ~30 hrs/week
DEV                      Engineers iterating        12 hrs × 5 days
                                                    weekday window
DEMO-PROD                Sales, demos, training    Business hours +
                          customers viewing         on-demand start
                                                    
DEMO-EPHEMERAL           Per-demo provisioning      Provision per use;
                          (Terraform tear-down)     destroy after
```

The audiences differ; the scheduling posture follows. Demo-prod's audience is intermittent (a few demos per week), so it scales differently from staging or dev.

### Why a separate demo environment

```
REASONS demo-prod exists separate from prod / staging:

PREDICTABLE DEMOS
  Production has real customer noise; could break mid-demo
  Demo-prod has controlled, curated state
  
SHOWCASE FEATURES SAFELY
  New features go to demo-prod before prod
  Sales can show without risking customer data

SALES DEMOS WITH CONTROLLED DATA
  Customer-friendly sample data
  Reset between demos to clean state
  
INVESTOR / EXTERNAL DEMOS
  High-stakes; can't afford prod blip
  Demo-prod with rehearsed scenarios
  
TRAINING ENVIRONMENTS
  Engineer training (new joiners)
  Customer training (post-sale)
  Don't want trainees touching prod
```

The demo-prod cost is usually worth it — it protects revenue (sales) and prevents the cost of demo-failure (lost deal).

### Schedule patterns for demo-prod

```
PATTERN A — BUSINESS HOURS (most common)
  Active: 7 AM - 7 PM Mon-Fri (sales hours)
  Off:    nights and weekends
  Cost:   ~30% of always-on
  Suits:  most sales demo environments

PATTERN B — ON-DEMAND
  Active: only when explicitly started
  Off:    by default
  Cost:   ~10% of always-on
  Suits:  rarely-used demo environments
  
PATTERN C — ALWAYS-ON
  Active: 24/7
  Off:    never
  Cost:   100%
  Suits:  high-stakes investor demos near launch; daily heavy use

PATTERN D — PRE-WARMED PER DEMO
  Active: 24h before scheduled demo
  Off:    after demo
  Cost:   varies by demo cadence
  Suits:  scheduled external demos (investor pitches, conferences)
  
PATTERN E — EPHEMERAL (per-demo)
  Provision: minutes before demo (Terraform / CDK)
  Destroy:   after demo
  Cost:      pay only for actual demo time
  Suits:     low-volume, high-customization demos
```

Most teams default to Pattern A; switch to B or D for specific use cases.

### Sales demo specifics

```
PATTERN: scheduled active during sales hours globally

SETUP:
  Sales hours: 7 AM - 7 PM Mon-Fri across primary timezones
              (e.g., US: PST + ET; EU: CET; APAC: SGT)
  
  Schedule:
    US-team-region:    7 AM PT - 7 PM ET = 12-hour window
                        OR 6 AM PT - 7 PM ET = 13-hour window
                        Mon-Fri
    EU-region:         7 AM CET - 7 PM CET = 12-hour window
    APAC-region:       7 AM SGT - 7 PM SGT = 12-hour window
  
  Demo data:
    Refreshed weekly (Sunday night refresh)
    OR refreshed per-demo (each demo starts from snapshot)
  
  Reset capability:
    Snapshot at "demo-clean" state
    Restore between demos to remove customer X's session

COST: ~30-40% of always-on for the demo cluster
LATENCY: 15 min cold-start if demo outside sales hours
```

For sales demo envs, the pattern compounds — 20 demo envs × $600/mo savings each = $12K/mo recovered.

### Training environment specifics

```
PATTERN: business hours active during training sessions

SETUP:
  Training session windows: e.g., 9 AM - 6 PM weekdays
                            (instructor + students online)
  Schedule:
    Active: 9 AM - 6 PM Mon-Fri
    Off:    nights and weekends
  
  Training data:
    Per-student isolated namespaces / accounts
    Reset on training conclusion
  
  Capacity:
    Scale up before training cohort starts
    Scale down between cohorts
```

Training envs are often forgotten about between cohorts. Schedule them; recover the cost.

### Investor / external demo specifics

```
PATTERN: pre-warmed for specific demo dates

SETUP:
  Identify upcoming demos (calendar):
    Mar 15: Board meeting demo
    Apr 22: Series B pitch
    May 30: Customer ABC demo
  
  Schedule:
    Active starting 24h before each demo
    Active during demo
    Off 2h after demo
  
  Demo rehearsal:
    Engineer warms up env 1h before
    Run-through to confirm state
    
  Performance verification:
    Pre-demo: ensure no resource constraints
    Pre-demo: refresh demo data
```

For external demos, the cost of a failed demo (lost investor / customer) dwarfs the cost of running the env. Lean toward more uptime here.

### Cost implications

```
COMMON OBSERVATIONS:
  Demo environments are typically 5-15% of production cost
  
  But: often FORGOTTEN about
       Provisioned once for a launch demo; never decommissioned
       Running for years at full cost; demos happen 1-2x/month
       
TYPICAL recovery potential per demo environment:
  $200-2,000/month per environment
  
ORG-LEVEL recovery:
  10-30 demo environments common
  Aggregate recovery: $5K-30K/month

KEY: audit demo environments yearly
     Many "demo" envs were last touched 18 months ago
     Decommission obsolete ones; schedule the active ones
```

The audit is the highest-ROI activity for FinOps — most teams find $10K+/mo in forgotten demo costs.

### Setup options

```
OPTION 1 — STABLE ENVIRONMENT (provisioned once, scheduled)
  Provision: Terraform / CDK / Pulumi (one-time)
  Schedule: business hours pattern
  Maintenance: data refresh weekly
  
  Effort: 1-2 days setup + 0.5 day/week maintenance
  Pros: predictable; engineers familiar
  Cons: cost between demos

OPTION 2 — EPHEMERAL ENVIRONMENT (per-demo)
  Provision: minutes before demo via IaC
  Destroy: after demo
  Maintenance: IaC scripts maintained
  
  Effort: 1 week setup + automation per template
  Pros: zero cost between demos
  Cons: cold-start overhead; IaC complexity
```

Most teams: Option 1 for high-volume demo envs; Option 2 for specific external demos.

### Recovery — auditing forgotten demo envs

```
QUARTERLY AUDIT:
  Open ZopNight → Filter: environment=demo OR name LIKE '*demo*'
  
  For each demo environment:
    □ When was it last used?
    □ Is the project still active?
    □ Who owns it?
    □ Cost: $_____/mo
  
  Categorize:
    Active (used in last 30 days): apply schedule
    Stale (not used 30-180 days): schedule + flag for review
    Obsolete (not used 180+ days): decommission
  
  Decommission process:
    Notify owner via Slack
    7-day notice
    Destroy via IaC if no response
    
TYPICAL OUTCOMES:
  20-30% of "demo" resources are obsolete (decommission)
  50% need scheduling applied (recover most cost)
  20-30% are actively used (keep but optimize)
  
RECOVERY: $5K-30K/mo in typical mid-size org
```

The audit is a 4-hour exercise per quarter. The payback is in the first hour.

---

## 2. Demo

A demo environment cleanup at a SaaS company:

```
TEAM: sales engineering team at a 200-eng SaaS

CURRENT STATE AUDIT (Q3 2026):
  16 demo environments running
  Total cost: $11K/mo (huh, larger than expected)

PER-ENVIRONMENT REVIEW:
  
  Env 1: "demo-customer-acme"  (last used: 2 months ago, project closed)
    Decision: DECOMMISSION
    Recovery: $850/mo
  
  Env 2: "demo-sales-main"     (last used: yesterday, daily use)
    Decision: SCHEDULE (business hours)
    Recovery: $600/mo (70% reduction)
  
  Env 3: "demo-training"        (last used: 3 weeks ago, cohort ended)
    Decision: SCHEDULE (per-cohort)
    Recovery: $400/mo (between cohorts)
  
  Env 4: "demo-roi-calculator"  (last used: 5 days ago, weekly use)
    Decision: SCHEDULE (business hours)
    Recovery: $250/mo
  
  Env 5: "demo-investor-board"  (last used: pre-board, next board in 6 wks)
    Decision: PRE-WARMED PER DEMO
    Recovery: $700/mo (almost-zero between demos)
  
  Envs 6-16: similar analysis

DECISIONS:
  Decommission: 4 envs (project closed)        Recovery: $2,800/mo
  Schedule business hours: 8 envs              Recovery: $4,200/mo
  Pre-warmed per demo: 2 envs                  Recovery: $1,400/mo
  Keep always-on: 2 envs (daily use)           No change
  
  TOTAL RECOVERY: $8,400/mo = $100,800/year

EXECUTION (1 week):
  Day 1-2: Communicate decommissions; 7-day notice to owners
  Day 3-5: Apply schedules
  Day 6:   Test cold-starts; tune any issues
  Day 7:   Documentation; review

OUTCOME:
  16 envs → 12 envs (4 decommissioned)
  12 envs total cost: $2,600/mo (vs original $11K)
  Annual savings: $100,800
  Investment: 1 engineering week ($5K)
  ROI: 20:1 in year 1
```

The pattern is repeatable annually. Each audit finds more drift.

---

## 3. Hands-on (5 min)

Audit your demo environments:

```
□ STEP 1: List all "demo" environments (search by tag/name)
  Env 1: __________   Cost: $_____   Last used: __________
  Env 2: __________   Cost: $_____   Last used: __________
  Env 3: __________   Cost: $_____   Last used: __________
  ... (continue for all)

□ STEP 2: Categorize each
  □ Active (used last 30 days)
  □ Stale (30-180 days; investigate)
  □ Obsolete (180+ days; likely decommission)

□ STEP 3: Decide action per env
  Active: schedule (business hours / pre-warmed)
  Stale: schedule + flag for quarterly review
  Obsolete: 7-day decommission notice

□ STEP 4: Estimate recovery
  Decommissions:        $_____/mo
  New schedules:        $_____/mo
  Pre-warmed conversions: $_____/mo
  TOTAL annual recovery: $_____

□ STEP 5: Schedule the audit
  Quarterly: __________ (date)
  Owner: __________
```

A 1-hour audit reveals the recovery opportunity. Most teams find $5K-30K/month.

---

## 4. Knowledge check

### Q1
Demo-prod vs staging — different because:

A. Same thing
B. Different audience and purpose. Demo-prod is for showcases / customer demos / training with controlled state and reset capability. Staging is for pre-deployment verification by engineers. Different audiences → different schedule patterns.
C. Random
D. Same audience

<details>
<summary>Show answer</summary>

**Correct: B.** Different purpose; different audience; different schedule.
</details>

### Q2
A weekly sales demo environment with sporadic use (3-5 demos/week, 30 min each):

A. Always-on (rarely-needed availability)
B. Scheduled active during sales hours OR pre-warmed per demo. Forgotten demo environments are often the easiest scheduling opportunity — most are running 24/7 but only used a few hours per week. Schedule recovers 60-80%.
C. Random
D. Per-demo provisioning

<details>
<summary>Show answer</summary>

**Correct: B.** Schedule with sales hours; recover most cost.
</details>

### Q3
A training environment with one cohort every 6-8 weeks:

A. Always-on
B. Schedule active during instructor-led hours of each cohort. Off between cohorts entirely (or scale-to-one for tooling). Most training-environment cost is the gap between cohorts; that's the recovery.
C. Random
D. Manual start/stop

<details>
<summary>Show answer</summary>

**Correct: B.** Cohort-aware scheduling; off between cohorts.
</details>

---

## 5. Apply

ZopNight schedule per demo environment. Annual demo-env audit. Decommission obsolete; schedule active; pre-warm per-demo when applicable.

For your team: the quarterly demo-env audit is the highest-ROI hour you'll spend.

---

## Module quiz

Complete M5.2 → 10-question module quiz unlocks the **Schedule-Designer** chip.

---

## Related lessons

- [L1 — Four envs scheduling](L1_four_envs.md)
- [L2 — Scale-to-one pattern](L2_scale_to_one.md)
- [L3 — Rolling test environment](L3_rolling_test.md)
- [L4 — Freeze windows](L4_freeze.md)
- [M5.7 — Incident response](../M5.7_incident_response/00_README.md)

## Glossary terms touched

[Demo-prod environment](../../../reference/glossary/demo-prod-environment.md) · [Ephemeral demo environment](../../../reference/glossary/ephemeral-demo-environment.md) · [Pre-warmed demo](../../../reference/glossary/pre-warmed-demo.md) · [Demo-env audit](../../../reference/glossary/demo-env-audit.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.2.L5
