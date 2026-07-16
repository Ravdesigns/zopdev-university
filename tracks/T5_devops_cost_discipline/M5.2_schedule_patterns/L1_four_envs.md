# Four envs — dev / test / stage / prod

§ T5 · M5.2 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **assign** the right schedule pattern to each of dev/test/stage/prod, **estimate** the cost reduction from environment-aware scheduling, **and adapt** the patterns for global / async / 24/7 teams.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the right schedule for each of my 4 environments, so non-prod compute costs drop 60-70% without disrupting engineers." |
| **Personas** | Platform Engineer · DevOps Engineer · FinOps Lead |
| **Prerequisites** | T1.M1.3 (schedules) · M5.1 (tagging strategy) |
| **Time** | 9 minutes |
| **Bloom verb** | Assign (Apply), Estimate (Analyze), Adapt (Apply) |

---

## 1. Concept

The strongest cost lever in non-prod is the schedule. Most teams run dev/test/stage 24/7 by accident (no one set it up otherwise). Adding environment-aware schedules typically cuts non-prod compute by 60-70% with zero engineer disruption.

```
ENV         TYPICAL SCHEDULE                  RATIONALE
─────────────────────────────────────────────────────────────────
dev         8 AM - 8 PM weekdays              Engineers iterate during
                                                work hours; off-hours
                                                useless
                                                
test        Off entirely after work +         Tests run on schedule,
              Off all weekends                  not on-demand
                                                Scale up on-demand for
                                                CI batches
                                                
stage       Pre-deployment hours only         Used briefly before each
              (e.g., 10 AM - 4 PM weekdays)   prod deploy; rare otherwise
                                                
prod        Always-on                         Customer-facing; no
                                                scheduling unless
                                                explicitly non-24/7
```

Following this pattern: a ~$3/mo non-prod resource drops to ≈ $1/mo. Multiply by hundreds of resources.

### Why each pattern

```
DEV environment — longest active hours
  Engineers iterate; need responsive infrastructure
  Off-hours (evening, weekend): minimal value
  Pattern: 8 AM - 8 PM weekdays = 60 hours/week active
           (vs 168 hours always-on)
           Savings: ~64% reduction on schedulable resources
           
TEST environment — more aggressive
  CI test runs are batchable; engineer attention isn't continuous
  Most teams: tests run in batches at work hours
  Pattern: 8 AM - 6 PM weekdays + on-demand spin-up for CI batches
           ~50 hours/week active
           Savings: ~70% reduction
           
STAGE environment — short windows
  Used briefly before each prod deploy
  Most teams deploy 2-5x/week; each deploy uses stage 1-2h
  Pattern: 10 AM - 4 PM weekdays = ~30 hours/week active
           OR on-demand only (zero baseline; spin up per-deploy)
           Savings: ~82% reduction
           
PROD environment — no scheduling
  Customer-facing; downtime = revenue impact
  Pattern: 24/7 always-on
           Exception: explicitly non-24/7 SaaS (B2B office-hours)
           Exception: regional shutdowns (e.g., Asia prod off
                      during their night if no Asia customers)
```

The pattern is the floor — most teams further refine based on observed usage.

### Variations by team working pattern

```
GLOBAL TEAMS (engineers across timezones)
  Dev runs ~16 hours covering East to West coast or Europe to Asia
  Example: 6 AM PT - 10 PM ET (~16 hours active)
  Savings: ~50% (still significant; less than co-located teams)

SINGLE-REGION TEAMS (one timezone)
  Dev runs 12 hours during working hours
  Example: 8 AM - 8 PM local, Mon-Fri
  Savings: ~64% reduction

ASYNC TEAMS (engineers work irregular hours)
  Dev mostly always-on except weekends
  Example: 24/5 (Mon 6 AM - Fri 10 PM)
  Savings: ~30% (weekends only; weekday off-hours preserved)

24/7 TEAMS (SRE on-call, ops)
  Dev technically always-on for incident response
  But: most incidents touch prod, not dev
  Pattern: dev still scheduled; on-call has wake-up authority
           OR: small "always-on" subset for on-call
  Savings: 40-60% with thoughtful subset selection
```

The right schedule depends on the team's actual working pattern, not assumptions. Audit a week of actual usage before deciding.

### Schedule + auto-discovery

ZopNight's schedules work at the resource-group or tag level:

```
SCHEDULE: dev-workhours
  Window: 8 AM - 8 PM ET, Mon-Fri
  Action: stop outside window; start at window-open
  Applies to: resources tagged environment=dev
  
SCHEDULE: test-batched
  Window: 8 AM - 6 PM ET, Mon-Fri
  Action: stop outside window
  Applies to: resources tagged environment=test
  
SCHEDULE: stage-prerelease
  Window: 10 AM - 4 PM ET, Mon-Fri
  Action: stop outside window
  Applies to: resources tagged environment=stage

NEW resources tagged appropriately:
  Inherit the right schedule automatically
  No per-resource schedule setup
```

This is why M5.1 (tagging) is the prerequisite: with clean tags, schedules apply themselves.

### Cost impact by environment

For a typical mid-size org's non-prod compute:

```
BEFORE SCHEDULES (24/7 always-on):
  dev resources:    $25K/mo
  test resources:   $12K/mo
  stage resources:  $8K/mo
  TOTAL non-prod:   $45K/mo
  
AFTER ENVIRONMENT-AWARE SCHEDULES:
  dev resources:    $9K/mo  (64% reduction)
  test resources:   $3.6K/mo (70% reduction)
  stage resources:  $1.4K/mo (82% reduction)
  TOTAL non-prod:   $14K/mo (69% reduction)
  
ANNUAL SAVINGS: ~$372K
ENGINEER IMPACT: zero (schedule aligns with working hours)

THE ROI: 0% engineering cost to enable; pure savings.
```

The non-prod-scheduling lever is the single largest fast-win in most FinOps programs.

### Exceptions and edge cases

```
CASE: TEST runs in CI need responsive infra
  SOLUTION: scale-to-one (next lesson, L2) instead of full shutdown
            Or: CI triggers warm-up 5 minutes before batch
            Or: keep small permanent footprint for fast spin-up
            
CASE: STAGE used by external integrators (24/7 visibility)
  SOLUTION: keep stage running; add internal stage-internal for
            internal use; schedule the internal one
            
CASE: DEV used by global team
  SOLUTION: 16-hour stretched window OR per-region dev environments
            with regional schedules
            
CASE: PROD has light traffic at night (B2B office-hours app)
  SOLUTION: scale to fewer replicas at night (M5.2.L2 scale-to-one)
            NOT full shutdown unless contract allows
            
CASE: Database / stateful resources
  SOLUTION: caution — stopping databases can lose state, slow restore
            Often: leave databases running; schedule compute only
            Or: use serverless / auto-pause databases (Aurora Serverless,
                DynamoDB on-demand)
```

Every team has exceptions. Plan for them; don't avoid scheduling because of them.

### Schedule rollout — 4-week plan

```
WEEK 1: Audit + plan
  Identify all non-prod resources
  Group by environment (via tags)
  Estimate cost per environment
  Survey teams: when do you use dev? test? stage?
  Identify exceptions

WEEK 2: Pilot
  Pick one team's dev environment
  Apply dev-workhours schedule
  Measure: cost reduction, engineer feedback (any disruption?)
  Tune schedule if needed (extend window for late-night sessions, etc.)

WEEK 3: Expand
  Roll out dev-workhours to all teams
  Roll out test-batched to all test envs
  Communicate via #eng-platform
  Set up alerting for unexpected wake-ups (cost spikes off-hours)

WEEK 4: Verify + iterate
  Confirm cost savings match estimate
  Address any team-specific issues
  Document the schedule patterns in team wiki
  Schedule quarterly review for refinement
```

Most teams capture 50-60% of the savings in week 3; final 10-15% in tuning over the next quarter.

---

## 2. Demo

A real schedule rollout at a mid-size SaaS company:

```
TEAM: zopcloud platform (200 engineers, US + EU teams)

BEFORE:
  All non-prod resources 24/7
  Non-prod compute: $46K/mo

SCHEDULES DEFINED:
  
  dev-platform-aws:    8 AM - 8 PM ET, Mon-Fri
                       Applies to: env=dev AND region=us-east-1
                       
  dev-platform-eu:     8 AM - 8 PM CET, Mon-Fri
                       Applies to: env=dev AND region=eu-west-1
                       
  test-staging:        Mon-Fri 8 AM - 6 PM ET only (US team)
                                + scheduled CI batches at 3 AM
                                + Mon-Fri 8 AM - 6 PM CET (EU team)
                       Applies to: env=test
                       
  stage-prod-verify:   10 AM - 4 PM ET + 10 AM - 4 PM CET, Mon-Fri
                       Applies to: env=stage
                       
  production-zopcloud: Always-on (no schedule)
                       Applies to: env=prod

AFTER (4 weeks in):
  dev:    $25K → $9K (-64%)
  test:   $13K → $3.5K (-73%)
  stage:  $8K → $1.5K (-81%)
  prod:   $42K (no change)
  
  TOTAL non-prod savings: $32K/mo = $384K/year
  Engineer disruption: 2 incidents in first 2 weeks
    - Late-night engineer hit dev being off (resolved by extending
      window to 10 PM for that team)
    - CI batch hit test being off (resolved by adding pre-batch warmup)
  Both fixed within hours of report.
  
  Net team satisfaction: high (cost savings visible; minor friction
  resolved quickly).
```

The pattern is repeatable: define per-env schedules, roll out, monitor, refine.

---

## 3. Hands-on (5 min)

Map your environment schedules:

```
□ STEP 1: Current state per environment
  dev:    Hours/week active: _____   Cost/mo: $_____
  test:   Hours/week active: _____   Cost/mo: $_____
  stage:  Hours/week active: _____   Cost/mo: $_____
  prod:   24/7 (no change)            Cost/mo: $_____

□ STEP 2: Proposed schedules
  dev schedule:    __________________________
  test schedule:   __________________________
  stage schedule:  __________________________

□ STEP 3: Estimate savings
  dev savings:    $_____/mo
  test savings:   $_____/mo
  stage savings:  $_____/mo
  TOTAL annual:   $_____

□ STEP 4: Identify exceptions
  Global team coverage needed? __________
  CI batches that hit off-hours? __________
  External integrators using stage? __________

□ STEP 5: Pilot plan
  Pick: which environment to pilot first? __________
  Owner: __________
  Pilot duration: _____ weeks
```

A 20-minute audit reveals the savings opportunity. Most teams find 50-70% savings on schedulable non-prod.

---

## 4. Knowledge check

### Q1
Production schedule typically:

A. 8 AM - 8 PM
B. Always-on. Production is customer-facing; scheduling rarely applies. Exception: explicitly non-24/7 SaaS (B2B office-hours apps), regional shutdowns where no customers in that region overnight.
C. Random
D. Weekend off

<details>
<summary>Show answer</summary>

**Correct: B.** Production is always-on unless explicitly non-24/7.
</details>

### Q2
Test environment vs dev environment scheduling:

A. Same schedule
B. Test is MORE aggressively scheduled — test runs are batchable; engineer time isn't needed continuously. Dev is more lenient (engineer iteration). Test can off-hour entirely with on-demand spin-up for CI batches; dev stays up during work hours.
C. Random
D. Test is always-on

<details>
<summary>Show answer</summary>

**Correct: B.** Different patterns. Test more aggressive than dev.
</details>

### Q3
Global team's dev environment:

A. Always-on (because someone is always working)
B. Stretched window: 16-hour active window covering coast-to-coast or US-to-EU. Off-hours portion (~8h) still recoverable. Better: per-region dev environments with regional schedules.
C. Random
D. Off most of the time

<details>
<summary>Show answer</summary>

**Correct: B.** Stretched window or per-region; not always-on.
</details>

---

## 5. Apply

ZopNight Schedules + Groups. Apply per-environment schedules with tag-based assignment. Most non-prod compute drops 60-70% within a month.

For your team: audit this week; pilot next week; full rollout in 4 weeks.

---

## Related lessons

- [L2 — Scale-to-one pattern](L2_scale_to_one.md) *(next)*
- [L3 — Rolling test environment](L3_rolling_test.md)
- [L4 — Freeze windows](L4_freeze.md)
- [L5 — Demo / prod-like environments](L5_demo_prod.md)
- [T1.M1.3 — Schedules basics](../../T1_zopnight_operator/M1.3_schedules/00_README.md)

## Glossary terms touched

[Environment schedule](../../../reference/glossary/environment-schedule.md) · [Schedulable resource](../../../reference/glossary/schedulable-resource.md) · [Off-hours recovery](../../../reference/glossary/off-hours-recovery.md) · [Always-on exception](../../../reference/glossary/always-on-exception.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.2.L1
