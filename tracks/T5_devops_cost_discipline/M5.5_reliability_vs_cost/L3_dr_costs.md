# DR — RTO/RPO costs

§ T5 · M5.5 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** the cost of meeting specific RTO/RPO targets, **match** DR strategy to workload impact, **and design** an annual DR test that validates the plan.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the right DR strategy per workload — don't pay for active-active on internal tools." |
| **Personas** | Platform Engineer · SRE · DR Coordinator |
| **Prerequisites** | M5.5.L1 · M5.5.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Calculate (Analyze), Match (Apply), Design (Create) |

---

## 1. Concept

DR (Disaster Recovery) cost scales steeply with how fast you must recover and how little data you can lose. The framework: define RTO (recovery time) and RPO (recovery point) per workload, then implement the cheapest DR strategy that meets those targets.

```
RTO (Recovery Time Objective) = how quickly you must recover after disaster
RPO (Recovery Point Objective) = how much data you can afford to lose

EXAMPLES:
  RTO 1 min, RPO 0:     Continuous standby + active-active
  RTO 1 hour, RPO 15 min: Multi-region with replication
  RTO 24 hours, RPO 1 hour: Backup + restore from snapshot
  RTO 1 week, RPO 1 day:    Simple backup
  
TIGHTER RTO/RPO = HIGHER COST (exponentially)
```

The decision: what RTO/RPO does the workload actually need? Not what would be "nice to have."

### Cost ladder for DR

```
LEVEL 1 — BACKUP + RESTORE (cheapest)
  RTO: 4-24 hours
  RPO: 1-24 hours
  Strategy: daily snapshots; restore in disaster
  Cost: backup storage only (~$50-200/mo per workload)

LEVEL 2 — MULTI-AZ REPLICATION
  RTO: 1-4 hours
  RPO: 5-15 minutes
  Strategy: synchronous replication within region
  Cost: 1.5-2× baseline (mainly RDS Multi-AZ pricing)

LEVEL 3 — MULTI-REGION WARM STANDBY
  RTO: 15-60 minutes
  RPO: 1-5 minutes
  Strategy: standby replica in second region; promoted on failure
  Cost: 2× baseline + cross-region transfer

LEVEL 4 — ACTIVE-ACTIVE MULTI-REGION
  RTO: <1 minute
  RPO: 0 (no data loss)
  Strategy: synchronous active-active across regions
  Cost: 2-3× baseline + significant cross-region transfer
```

Each level is dramatically more expensive than the previous. Pick the lowest level that meets the actual requirement.

### RTO/RPO decision matrix per workload

```
WORKLOAD                          ACCEPTABLE       ACCEPTABLE
                                   RTO              RPO
─────────────────────────────────────────────────────────────
Payment processing                  <1 min            0
Customer-facing API                  1 hour            5 min
Authentication / identity            5 min             1 min
Customer data store                  1 hour           15 min
Internal admin tool                  24 hours          1 hour
Reporting dashboard                  1 week            1 day
Logging system                       4 hours          15 min
ML training pipeline                 1 week            1 day
Development environment              1 day             1 hour
Demo / training environment          1 week            none (recreate)
```

The discipline: what's the BUSINESS impact of N-minute downtime + M-minute data loss for this specific workload?

### Common mistakes in DR planning

```
1. ASKING FOR LOWER RTO/RPO THAN NEEDED
   "Customers demand instant recovery"
   Customers tolerate 1-hour outages for most services
   Real damage starts at >2-4 hour outages
   Over-engineering DR for "perceived" needs costs 5-10× more
   
2. SAME RTO/RPO ACROSS ALL WORKLOADS
   Payment system: yes, need tight DR
   Reporting dashboard: doesn't need same
   Blanket policies = wasted money
   
3. NOT TESTING DR
   Plan exists; never tested
   Real disaster reveals gaps
   Backup might not restore; failover might fail
   Untested DR = false sense of security
   
4. ASSUMING CLOUD HANDLES IT
   "We're on AWS; they handle reliability"
   Cloud handles infrastructure failures
   Doesn't handle: data corruption, ransomware, deletion
   Your DR is your responsibility
   
5. NO ROLLBACK PROCEDURE
   Plan to failover; no plan to fail back
   Stuck in secondary region
   
6. DEPENDENCIES IGNORED
   App fails over but database doesn't
   Or: secrets manager is single-region
   Test the full stack
```

The mistakes share a theme: blanket policies + insufficient testing.

### Right-sizing DR — the process

```
QUARTERLY DR REVIEW (per workload):

STEP 1 — LIST WORKLOADS
  Inventory production workloads
  Group by service tier (M5.5.L1)

STEP 2 — DEFINE BUSINESS IMPACT
  For each: cost of N-hour downtime
  Cost of M-hour data loss
  Customer-trust impact (qualitative)
  
STEP 3 — DERIVE RTO/RPO
  RTO: how fast must we recover?
  RPO: how much data can we lose?
  Document per workload
  
STEP 4 — PICK DR LEVEL
  Match RTO/RPO to DR level (1-4)
  Estimate annual cost
  Compare to potential downtime cost
  
STEP 5 — IMPLEMENT
  Configure backups / replication / failover
  Document failover procedure
  
STEP 6 — TEST ANNUALLY
  Run DR drill
  Measure actual RTO + RPO
  Update procedures based on findings
```

The process is per-workload, not org-wide. Tier-based blanket policies miss the variance.

### Multi-region DR cost details

```
ALWAYS-ON MULTI-REGION (Level 4 active-active):
  Cost: 2× compute baseline
  Plus: cross-region data transfer ($0.02-0.09/GB)
  Plus: multi-region database overhead
  Total: 2-3× baseline
  
  Use when: RTO < 5 min, RPO 0, customer-impacting

WARM STANDBY (Level 3 active-passive):
  Cost: 1.5× compute baseline
  Standby uses smaller instance (still costs but less)
  Replication ongoing
  Failover takes 15-60 minutes
  Use when: RTO 1 hour OK, RPO 1-5 min

COLD STANDBY (Level 1 backup + restore):
  Cost: ~1.1× baseline (backup storage)
  No active secondary; restore from backup
  RTO measured in hours
  Use when: RTO of hours acceptable
```

Match the strategy to the actual RTO/RPO need. Most workloads (Tier 2-3) live at Level 1 — daily backups, manual restore.

### Testing DR — the discipline

```
ANNUAL DR DRILL (required for serious DR posture):

PRE-DRILL:
  Pick a target workload (rotate through tier-0 yearly)
  Schedule with team + stakeholders
  Document expected RTO/RPO
  Identify success criteria

DURING DRILL:
  Trigger simulated failure (kill primary, or full DR)
  Failover to secondary
  Measure actual RTO (time to recover service)
  Measure actual RPO (data lost during failover)
  Test recovery completeness (all features work?)

POST-DRILL:
  Document actual vs expected
  Identify gaps (anything broken? slower than expected?)
  Update procedures based on findings
  Plan remediation for gaps

WITHOUT TESTING:
  DR exists on paper only
  Real disaster reveals gaps you'd already fixed if you'd tested
  Industry studies: 30-50% of "tested" DR plans fail under real conditions
```

The drill is the difference between DR posture and DR theater. Test annually minimum.

### Common DR scenarios

```
SCENARIO 1 — AZ FAILURE
  Single availability zone goes down
  Multi-AZ replication handles automatically
  RTO: <1 hour typically
  
SCENARIO 2 — REGION FAILURE
  Entire AWS region offline
  Multi-region failover OR restore from cross-region backup
  RTO: 1-24 hours depending on strategy
  Rare but does happen (AWS us-east-1 had 4+ hour outages)
  
SCENARIO 3 — ACCOUNT COMPROMISE
  Credentials leaked; resources deleted
  Restore from backups; rotate credentials
  RTO: hours-days depending on scope
  This is why backups must be in a separate account
  
SCENARIO 4 — APPLICATION BUG CORRUPTING DATA
  Bug deletes or corrupts data
  Point-in-time recovery to before corruption
  Cross-region backup if regional corruption
  RTO depends on PIT capability + restore time
  
SCENARIO 5 — RANSOMWARE
  Data encrypted by attacker
  Restore from immutable backups
  Backups must be: separate account, immutable, recent
  RTO: hours-days depending on restore speed
```

DR planning covers all scenarios; testing validates each scenario's procedure.

---

## 2. Demo

A real DR right-sizing for a 50-engineer SaaS:

```
TEAM ASSESSMENT — three workloads:

WORKLOAD 1: customer-facing payment service
  Business impact analysis:
    1-min downtime: ~$2,000 lost transactions + customer trust impact
    5-min downtime: $10K + significant trust damage
    1-hour downtime: $120K + churn risk + headline news
  
  Required RTO: <1 minute
  Required RPO: 0 (no transaction loss acceptable)
  
  DR LEVEL: 4 (active-active multi-region)
  Cost: 2× baseline = $4K/mo for this workload
  
  JUSTIFICATION:
    Even 1-hour outage costs $120K
    DR cost: $48K/year
    Break-even at <0.4 hours of avoided downtime/year
    Strongly justified

WORKLOAD 2: internal reporting tool
  Business impact analysis:
    1-day downtime: minimal (employees can wait)
    1-week downtime: minor delay in some reports
  
  Required RTO: 24 hours
  Required RPO: 4 hours
  
  DR LEVEL: 1 (backup + restore)
  Cost: 1.1× baseline = +$50/mo
  
  JUSTIFICATION:
    Over-engineering would cost $4K/mo for no real benefit
    Backup + restore sufficient
    Lower-tier strategy correctly applied

WORKLOAD 3: ML training pipeline
  Business impact analysis:
    1-week downtime: training delayed; rerun later
    Re-running is possible from upstream data
  
  Required RTO: 1 week
  Required RPO: 1 day (re-run from yesterday's data)
  
  DR LEVEL: 1 (backup) — barely
  Cost: ~1.05× baseline = +$20/mo
  
  JUSTIFICATION:
    Minimal DR investment appropriate
    Re-run capability is the real recovery mechanism

ANNUAL TOTAL ACROSS 3 WORKLOADS:
  DR cost: $48K + $600 + $240 = $48,840/yr
  
  Vs blanket active-active (would be ~$144K/yr):
  Savings from tiering: $95K/yr

ANNUAL DR DRILL (Q4):
  Test Workload 1 failover from primary to secondary region
  Measure actual RTO/RPO
  Document gaps
  Update procedures
  
  Tier 1 workloads tested annually
  Tier 2/3 tested every 2 years
```

The discipline pays for itself many times over.

---

## 3. Hands-on (5 min)

Right-size DR for your 3 most critical workloads:

```
□ WORKLOAD 1: __________
  Business impact of 1-hour downtime: $_____
  Required RTO: __________
  Required RPO: __________
  DR Level: □ 1  □ 2  □ 3  □ 4
  Estimated cost: $_____/mo

□ WORKLOAD 2: __________
  Business impact: $_____
  Required RTO: __________
  Required RPO: __________
  DR Level: □ 1  □ 2  □ 3  □ 4
  Estimated cost: $_____/mo

□ WORKLOAD 3: __________
  Business impact: $_____
  Required RTO: __________
  Required RPO: __________
  DR Level: □ 1  □ 2  □ 3  □ 4
  Estimated cost: $_____/mo

REFLECTION:
  Any workloads over-engineered (Tier 4 when 1 suffices)?
  Any under-engineered (Tier 1 when 3 needed)?
  
PLAN ANNUAL DR DRILL:
  Workload: __________
  Date: __________
  Owner: __________
```

A 30-minute exercise reveals DR cost waste or under-investment. Most teams have both.

---

## 4. Knowledge check

### Q1
A reporting dashboard requires RTO of 1 minute:

A. Optimal for reliability
B. Likely over-engineered. Reporting tolerates higher RTO (24h typical). The cost difference between RTO 1min and RTO 24h can be 10×. Match RTO to actual business impact; reporting can wait.
C. Random
D. Required for compliance

<details>
<summary>Show answer</summary>

**Correct: B.** Match RTO to impact; reporting doesn't need 1-min.
</details>

### Q2
Multi-region active-active for every workload:

A. Best practice
B. Over-engineering for most workloads. Active-active doubles cost. Use only for workloads where business impact (revenue, trust) justifies. Most workloads need Level 1 (backup + restore) or Level 2 (multi-AZ); reserve Level 4 for Tier 0 revenue-critical services.
C. Random
D. Required for cloud-native

<details>
<summary>Show answer</summary>

**Correct: B.** Tier the DR strategy; not blanket policy.
</details>

### Q3
A DR plan that's never been tested:

A. Trustworthy if documented
B. Reality may differ from documentation. Annual DR drill validates the plan. Industry studies show 30-50% of untested DR plans fail under real conditions. Untested DR = false sense of security.
C. Random
D. Fine if documented

<details>
<summary>Show answer</summary>

**Correct: B.** Test annually. Without testing: DR theater.
</details>

---

## 5. Apply

Right-size DR per workload via RTO/RPO. Annual DR drills. Document failover procedures.

For ZopNight: Reports → Reliability dimensions show DR architecture in use; audit for over/under-investment.

---

## Related lessons

- [L1 — Reliability line](L1_the_line.md)
- [L2 — Backup retention](L2_backups.md)
- [L4 — Reliability theatre](L4_reliability_theatre.md) *(next)*
- [M5.4.L3 — Network egress (cross-region)](../M5.4_multi_account/L3_network_egress.md)

## Glossary terms touched

[RTO](../../../reference/glossary/rto.md) · [RPO](../../../reference/glossary/rpo.md) · [DR drill](../../../reference/glossary/dr-drill.md) · [Active-active vs warm standby](../../../reference/glossary/active-active-vs-warm-standby.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.5.L3
