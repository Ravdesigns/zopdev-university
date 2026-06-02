# Cross-account scheduling concerns

§ T5 · M5.4 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** cross-account scheduling concerns, **design** coordinated schedules that respect dependencies, **and avoid** the common multi-account scheduling anti-patterns.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule resources across multiple accounts without breaking cross-account dependencies — workload-A in account-1 shouldn't try to call workload-B in account-2 when B is off." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M5.4.L1 - L3 · M5.2 (schedules) |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Apply), Design (Create), Avoid (Apply) |

---

## 1. Concept

Multi-account architecture creates new scheduling considerations. Cross-account dependencies mean scheduling one account's resources can break another account's workloads. This lesson covers the patterns and pitfalls.

```
KEY CONCERNS:

1. CROSS-ACCOUNT DEPENDENCIES
   Workload in account-A depends on service in account-B
   
2. PER-ACCOUNT SCHEDULING CONSISTENCY
   Each account has its own clock; minor drift between accounts
   
3. SHARED RESOURCES SERVING MULTIPLE ACCOUNTS
   Scheduling shared services off affects all consuming accounts
   
4. TIMING / ORDERING ACROSS ACCOUNTS
   Workload A must stop BEFORE workload B starts
   
5. AUDIT + VISIBILITY ACROSS ACCOUNTS
   Failures might happen in account A; logs in account B
```

These compound — most multi-account orgs hit at least 2-3 simultaneously.

### Cross-account dependencies

```
SCENARIO: app in acme-dev calls API in acme-shared-services
  
  If shared-services is scheduled off:
    App in dev tries to call → connection refused → app fails
  
  RESOLUTIONS (in order of preference):
  
  A) Don't schedule shared services off
     Shared infra serves many; outage cascades
     Default position: shared services always-on
     
  B) Coordinate scheduling
     If dev app off when shared off = no problem
     Schedule them in coordination
     
  C) Add fallback / queuing in dev app
     App degrades gracefully when shared unavailable
     Best for: apps that need resilience anyway
     
  D) Use scale-to-one for shared services
     Shared stays available; capacity reduces off-hours
     Cost savings + reliability
```

The default — never schedule shared services off — is right for most orgs.

### Per-account scheduling considerations

```
EACH ACCOUNT'S ZOPNIGHT INSTANCE:
  Has its own cloud-account entry
  Schedules in each account fire independently
  Cron evaluations per-account (slight clock drift between accounts)
  
COORDINATION OPTIONS:
  - Group spans accounts (M1.4) → single schedule applies to all
  - Per-account schedules in coordination (manually aligned)
  - Override system for special cases
  
DEFAULT pattern: groups span accounts; schedules are group-level
```

The group-level pattern is the cleanest for cross-account coordination.

### Coordinated scheduling via groups

```
GROUP "dev-platform-eu" spans multiple accounts:
  
  Members:
    Resources in acme-dev (EU region)
    Resources in acme-staging (cross-account dependency for tests)
    
  Single schedule attached: dev-business-hours
    Stop 8 PM Mon-Fri EU
    Start 8 AM Mon-Fri EU
    
  EFFECT:
    All group members stop at the same time
    All start at the same time
    Cross-account coordination handled by group membership
    
  ENGINEER SETUP:
    Tag resources across accounts with team=platform-eu
    Group includes all matching tags
    Schedule attached to group
```

The discipline: think in terms of groups (intent), not accounts (geography). Groups cross account boundaries.

### Per-environment scheduling across accounts

```
WHEN ACCOUNTS ARE PER-ENV:
  acme-dev, acme-staging, acme-prod (separate accounts)
  
  SCHEDULING:
    Dev account: schedule per resource (or all-dev group)
    Staging account: schedule per resource (or all-staging group)
    Prod account: no schedule (always-on)
    
  CROSS-ACCOUNT GROUP not needed (envs are accounts)

WHEN ENVS WITHIN ONE ACCOUNT (tagged):
  Single account with env=dev, env=stage, env=prod tags
  
  SCHEDULING:
    Group "env-dev" → schedule off-hours
    Group "env-stage" → schedule off-hours
    Group "env-prod" → no schedule
    
  Tags drive group membership.
```

The schedule lives at the group level; the account organizes the resources differently.

### Shared resource scheduling — don't

```
RULE: shared resources rarely scheduled off

REASONS:
  Many dependents → cascading impact
  Hard to coordinate everyone off at same time
  Failure during off-period = many engineers blocked
  
BETTER patterns for shared services cost:
  
  Scale-down (not stop) during off-hours
    Database: replica reduction, not full off
    Monitoring: lower-capacity ingest, not off
    Cache: smaller capacity, not off
    
  Right-size for actual usage
    If shared service is over-provisioned: reduce capacity
    Quarterly review per shared service
    
  Centralize aggressively
    Get more from fewer shared instances (M5.4.L2)

EXCEPTIONS (when shared CAN be scheduled):
  Genuine off-hours when no one uses (e.g., 3 AM Sat)
  AND clear ownership of when to wake (on-call procedure)
  AND tested failure scenarios (graceful degradation)
```

Default: don't schedule shared. Use other levers for shared cost.

### Cross-account timing — practical concerns

```
SCENARIO: dev-aws-1 and dev-aws-2 both schedule off at 8 PM
  
  WHAT IF schedule cron evaluates at slightly different moments
  in each account?
  
  Reality:
    AWS account A's cron evaluates at 8:00:00.123 PM
    AWS account B's cron evaluates at 8:00:00.456 PM
    Usually < 1 second difference
    
  This is fine for typical scheduling.
  Coordination at second-level rarely matters.

SCENARIO: Workload A must stop BEFORE workload B starts
  
  Cron-level coordination isn't sufficient for strict ordering.
  
  Use:
    Sequenced execution (T1.M1.4.L4)
      Define ordering: stop A → wait → stop B
      ZopNight executes in order
    
    Or: override system
      Manual confirmation per step

SCENARIO: Cross-account audit log correlation
  
  Failure happens in account-A
  Logs scatter across A and dependent accounts (B)
  
  Use:
    Centralized log aggregation (M5.4.L2 shared services)
    Distributed tracing (Jaeger, X-Ray)
    Correlation IDs in cross-account requests
```

Most scheduling concerns are handled by groups + sequenced execution; centralized observability handles the rest.

### Common multi-account scheduling anti-patterns

```
ANTI-PATTERN A — SCHEDULE CLUSTER WITH CROSS-ACCOUNT DEPENDENCY
  Schedule cluster-A off in account-1
  Cluster-B in account-2 calls cluster-A
  Cluster-B fails when cluster-A is off
  
  FIX:
    Schedule them together via group (M1.4)
    Or: cluster-B has retry / circuit-breaker logic
    Or: cluster-A stays on (less savings, more reliability)

ANTI-PATTERN B — DON'T SCHEDULE SHARED DATABASES
  Tempted to schedule shared DB off off-hours
  Many apps fail when DB is off; not all are tracked
  
  FIX:
    Scale-to-one (not stop) shared DBs
    Or: keep always-on; accept cost
    
ANTI-PATTERN C — CROSS-ACCOUNT SERVICES WITHOUT MONITORING
  Schedule off; failures during off-hours not noticed
  Wake on Monday to find broken state
  
  FIX:
    Cross-account monitoring (centralized observability)
    Alert if dependency unhealthy during expected-up periods
    
ANTI-PATTERN D — SCHEDULE WITHOUT GROUP
  Per-resource scheduling across accounts
  Forget to add new resource to schedule
  Coverage degrades over time
  
  FIX:
    Group membership via tag selector
    New resources auto-join when properly tagged
    
ANTI-PATTERN E — INCONSISTENT TIMEZONES
  Account A schedules in UTC
  Account B schedules in local time
  Coordination breaks at DST transitions
  
  FIX:
    Use UTC everywhere
    Or document the timezone per group + verify quarterly
```

Most anti-patterns are about insufficient coordination. The group + tag-based pattern handles most.

### Multi-account scheduling testing

Before rolling out cross-account scheduling, validate:

```
TEST IN SANDBOX:
  Create equivalent test resources in sandbox accounts
  Schedule them
  Verify:
    Stops happen as expected
    Starts happen as expected
    Cross-account dependencies handled gracefully
    Failures (when test workload calls stopped dependency) are
      logged appropriately
    Recovery (when dependency starts) restores normal operation

TEST FAILURE MODES:
  What if account A's stop fails but B's succeeds?
  What if account B can't reach account A during dependency check?
  What if cron fires at slightly different moments?
  
  Document expected behavior and recovery procedure.

ROLL OUT GRADUALLY:
  Start with one team's resources (1 account first, then cross-account)
  Monitor first week
  Refine schedule + group as issues emerge
  Expand to other teams
```

Test the failure modes; don't just test the happy path.

---

## 2. Demo

A real multi-account scheduling rollout:

```
TEAM: platform-team-eu, mid-size org

ARCHITECTURE:
  Accounts:
    acme-dev          (dev workloads, multi-team)
    acme-staging      (staging)
    acme-prod         (prod, no schedule)
    acme-shared       (shared services, no schedule)
  
  EU resources of platform team scattered across acme-dev + acme-staging
  Some cross-account dependencies between dev and staging

GROUP DESIGN:
  Group "platform-eu-dev":
    Tag selector: team=platform AND region=eu AND environment=dev
    Members: ~40 resources across acme-dev and (some) acme-staging
    
  Group "platform-eu-staging":
    Tag selector: team=platform AND region=eu AND environment=stage
    Members: ~15 resources in acme-staging

SCHEDULE DESIGN:
  Schedule "dev-business-hours-eu":
    Cron: weekdays 8 AM - 8 PM CET
    Action: start at 8 AM; stop at 8 PM
    Applies to: group "platform-eu-dev"
    
  Schedule "staging-eu":
    Cron: weekdays 10 AM - 6 PM CET (shorter window; less use)
    Action: start at 10 AM; stop at 6 PM
    Applies to: group "platform-eu-staging"

DEPENDENCY CHECK:
  Workloads in dev-eu group:
    DO NOT depend on staging-eu workloads
    DO depend on shared services (always-on; fine)
  Workloads in staging-eu group:
    Stand-alone for testing purposes
  
  Verified by:
    Dependency map review
    Test runs in sandbox

ROLLOUT:
  Week 1: Apply to 5 resources (small subset)
          Monitor for 1 week
          No failures
          
  Week 2: Expand to all 40 dev-eu resources
          Verify off-hours stops correctly
          Verify start-up timing correct
          
  Week 3: Apply staging-eu schedule
          Verify cross-account dependencies (dev → shared) intact
          
  Week 4: Documentation + handoff
          Team wiki updated
          On-call runbook references the schedules

OUTCOMES:
  Dev cost: -65% (was always-on; now 12h × 5 days = 36% utilization)
  Staging cost: -75% (was always-on; now 8h × 5 days = 24% utilization)
  Total savings: $1,800/mo across both envs
  
  Cross-account issues: 0 in first month
  Engineer feedback: positive
```

The group-based design is what makes the cross-account scheduling clean.

---

## 3. Hands-on (5 min)

Audit your multi-account scheduling:

```
□ STEP 1: List your accounts
  Account 1: __________   Purpose: __________
  Account 2: __________   Purpose: __________
  Account 3: __________   Purpose: __________

□ STEP 2: Identify cross-account dependencies
  Workload A in account-X depends on service B in account-Y:
    __________ → __________
    __________ → __________

□ STEP 3: Review existing schedules
  Per-account schedules: _____
  Cross-account groups: _____ (does it exist?)
  
  Coordination via:
    □ Groups (preferred)
    □ Manually-aligned per-account schedules
    □ No coordination (risky)

□ STEP 4: Identify risky patterns
  Scheduled workloads with cross-account dependents: _____
  Shared resources mis-scheduled: _____

□ STEP 5: Plan improvements
  □ Create cross-account group
  □ Add monitoring for cross-account failures
  □ Test failure modes in sandbox
```

A 20-minute audit reveals the cross-account scheduling risks. Most multi-account orgs have at least one anti-pattern.

---

## 4. Knowledge check

### Q1
Workload in dev-account depends on API in shared-services. To schedule:

A. Schedule both off together
B. Don't schedule shared services off — too many dependents would break. Schedule dev workload off only. If cost matters for shared services: scale-down (not stop), or right-size, or aggressive centralization (M5.4.L2). Shared = "stay available."
C. Random
D. Schedule shared services off (saves more)

<details>
<summary>Show answer</summary>

**Correct: B.** Protect shared services; don't schedule them off.
</details>

### Q2
Cross-account group with one schedule attached:

A. Doesn't work; schedules are per-account only
B. Works fine. Group spans accounts; schedule applies to all members regardless of which account they live in. Each account's cron evaluates per its timezone but stays consistent. The group + tag-based selector is the cleanest pattern for multi-account scheduling.
C. Random
D. Only single-account allowed

<details>
<summary>Show answer</summary>

**Correct: B.** Cross-account groups supported; clean pattern.
</details>

### Q3
A shared database serving multiple accounts:

A. Schedule off to save cost
B. Don't schedule off. Scale-down possibly (replica reduction, capacity tier); complete off would break dependents. Shared databases are the highest-blast-radius shared resource; default position: always-on.
C. Random
D. Required to schedule for cost

<details>
<summary>Show answer</summary>

**Correct: B.** Protect shared databases; scale-down only.
</details>

---

## 5. Apply

Group-based scheduling spans accounts. Test cross-account dependencies in sandbox. Don't schedule shared services off.

For ZopNight: Groups with tag selectors automatically include cross-account resources. Schedules attach at group level.

---

## Related lessons

- [L1 — Per-team vs per-env accounts](L1_per_team_or_env.md)
- [L2 — Shared services accounts](L2_shared_services.md)
- [L3 — Network egress costs](L3_network_egress.md)
- [L5 — Consolidate or split](L5_consolidate_or_split.md) *(next)*
- [M5.2 — Schedule patterns](../M5.2_schedule_patterns/00_README.md)
- [T1.M1.4 — Groups](../../T1_zopnight_operator/M1.4_groups/00_README.md)

## Glossary terms touched

[Cross-account group](../../../reference/glossary/cross-account-group.md) · [Cross-account dependency](../../../reference/glossary/cross-account-dependency.md) · [Tag-selector group](../../../reference/glossary/tag-selector-group.md) · [Sequenced execution](../../../reference/glossary/sequenced-execution.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.4.L4
