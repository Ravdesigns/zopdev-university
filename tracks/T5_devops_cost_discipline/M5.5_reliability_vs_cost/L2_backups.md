# Backup retention as cost

§ T5 · M5.5 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** backup costs based on retention, **right-size** retention per service tier, **and configure** lifecycle policies to prevent indefinite accumulation.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Set backup retention to match what we actually need — not 'keep everything forever' which compounds cost." |
| **Personas** | Platform Engineer · SRE · Database Engineer |
| **Prerequisites** | M5.5.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Calculate (Analyze), Right-size (Apply), Configure (Apply) |

---

## 1. Concept

Backups have ongoing storage cost. Retention period directly affects monthly cost — keep too much, and the storage bill grows without bound. The discipline: retention matches RTO/RPO + compliance, no more.

```
TYPICAL RDS / EBS SNAPSHOT COST:
  Snapshots are INCREMENTAL, not full copies (AWS, GCP, Azure).
  The first snapshot stores the full volume (~full size).
  Every snapshot after that stores only the blocks that CHANGED
  since the previous one. Storage rate ~$0.05/GB-month.

MENTAL MODEL:
  monthly cost ~= (base full copy + retained change-deltas) x $/GB-month
  where each delta ~= daily-change-rate x size, NOT the full size.

EXAMPLE: 1 TB database, ~5% daily change, 30-day daily retention
  Stored ~= 1 TB base + 30 x (5% x 1 TB) = 1 TB + 1.5 TB = 2.5 TB
  Cost   ~= 2.5 TB x $0.05 = ~$125/month per database
  (The naive full-copy model "30 x 1 TB x $0.05 = $1,500"
   overstates this by roughly 10x.)
```

Cost grows with the volume of **retained deltas**, not with the day count. Incremental snapshots plus GFS retention (keep 30 daily + 8 weekly + 12 monthly, not 365 dailies) keep long retention sub-linear: a 7-year archive is a few TB of overlapping deltas, not 365 x 7 full copies. Archive tiers (Glacier, Coldline) then cut that ~90% more. Indefinite retention still grows without bound, just far more slowly than a full-copy model suggests.

### Backup retention principles

```
1. RETENTION MATCHES RTO/RPO
   RTO (Recovery Time Objective): how fast must we recover?
     1 hour: daily snapshots + continuous PIT
     24 hours: daily snapshots
     1 week: weekly + monthly snapshots
   
   RPO (Recovery Point Objective): how much data can we lose?
     <1 hour: continuous backup
     <24 hours: daily snapshots
     <1 week: weekly snapshots

2. COMPLIANCE OFTEN DRIVES MINIMUM RETENTION
   SOC 2: typically 7 days minimum (often more)
   ISO 27001: documented retention; varies
   Banking / financial: 7+ years often required
   HIPAA: 6 years
   GDPR: data deletion timeframes (max retention)
   
3. COST GROWS WITH RETAINED DELTAS, NOT DAY COUNT
   base full copy + sum(retained change-deltas) = monthly cost
   Incremental snapshots + GFS tiering keep long retention sub-linear
   
4. RARELY-ACCESSED BACKUPS = STORAGE TIER OPPORTUNITY
   Old backups: archive tier (Glacier, Coldline)
   90%+ cheaper than standard storage
```

The principles are general; the specific retention varies per workload.

### Common backup patterns

```
PATTERN A — SIMPLE DAILY (minimum viable)
  Daily snapshots, 7-day retention
  Cost: ~ (base full copy + 7 daily deltas) × $0.05/GB-month
  Suits: dev/staging; lower-tier prod
  
PATTERN B — STANDARD PROD (most common)
  Daily for 30 days
  Weekly for 8 weeks (additional)
  Monthly for 12 months (additional)
  Cost: base full copy + retained deltas (well below the 30-50 x
        DB-size a full-copy model implies; deltas, not full copies)
  Suits: standard production workloads
  
PATTERN C — COMPLIANCE (regulated industries)
  Daily for 30 days
  Weekly for 12 weeks
  Monthly for 12 months
  Yearly for 7 years (compliance)
  Cost: significantly higher; for compliance
  
PATTERN D — CONTINUOUS PIT (point-in-time)
  Some clouds offer continuous backup
  Recovery to any point in last N days
  Cost: highest tier
  Suits: critical data with very low RPO
  
PATTERN E — INCREMENTAL ARCHIVE
  Recent backups in standard storage
  Old backups migrate to archive (Glacier)
  Cost: drops 90%+ for archived portion
  Suits: long retention with rare-access pattern
```

Most teams converge on Pattern B for production + Pattern A for non-prod.

### Right-sizing retention per service tier

```
TIER 0 — REVENUE-CRITICAL (payment DBs, etc.):
  Daily: 30 days
  Weekly: 12 weeks
  Monthly: 12 months
  Yearly: 7 years (compliance)
  Possibly: continuous PIT for very low RPO
  Cost: high but justified by criticality
  
TIER 1 — CUSTOMER-FACING (main app DBs):
  Daily: 14-30 days
  Weekly: 8-12 weeks
  Monthly: 6-12 months
  Cost: moderate
  
TIER 2 — INTERNAL / SUPPORTING:
  Daily: 7-14 days
  Weekly: 4-8 weeks
  Cost: low
  
TIER 3 — DEV / TEST:
  Daily: 3-7 days
  No weekly/monthly typically
  Often: no backups at all (depends on tolerance)
  Cost: minimal
  
TIER 4 — DEMO / EPHEMERAL:
  Often no backups
  Recreate from IaC if lost
  Cost: zero
```

The tier framework prevents the most common waste: applying Tier 0 retention to Tier 3 workloads.

### Snapshot vs continuous PIT

```
SNAPSHOT BACKUPS (most common):
  Discrete points in time (daily/weekly/monthly)
  Slower restore (1+ hour typical)
  Cheaper
  RPO: matches snapshot frequency (daily = 24h RPO)
  RTO: 1-2 hours typical
  
CONTINUOUS POINT-IN-TIME:
  Recovery to any point in time
  Faster restore (typically same hour)
  More expensive (2-5× snapshots)
  RPO: minutes
  RTO: minutes
  
WHEN TO PICK PIT:
  Very low RPO requirement (<1 hour data loss tolerance)
  Critical financial / transactional data
  Customer-impacting if data loss
  
WHEN SNAPSHOTS SUFFICE:
  RPO of hours/days acceptable
  Standard production
  Most workloads
```

For most workloads, daily snapshots are fine. PIT for the truly critical.

### Common over-retention anti-patterns

```
ANTI-PATTERN A — FOREVER RETENTION
  Every snapshot kept indefinitely
  No lifecycle policy
  Cost grows monthly without bound
  After 5 years: catastrophic backup storage cost
  
ANTI-PATTERN B — SAME RETENTION FOR ALL ENVIRONMENTS
  Dev backups retained 30 days
  Same as prod
  Dev data isn't compliance-critical
  Wasted money on dev backups
  
ANTI-PATTERN C — NO LIFECYCLE POLICY
  Snapshots accumulate without deletion
  Manual cleanup needed; rarely happens
  Common in older AWS / GCP estates
  
ANTI-PATTERN D — DAILY × WEEKLY × MONTHLY × YEARLY everywhere
  Aggressive retention without business case
  Multiplies cost 5-10×
  Often legacy from "more backup = safer" thinking
  
ANTI-PATTERN E — KEEPING BACKUPS IN STANDARD STORAGE
  90+ day backups in standard storage tier
  Could be in Glacier ($0.004/GB-month vs $0.05)
  90% cost reduction for old backups
  
ANTI-PATTERN F — BACKING UP TEMPORARY DATA
  Cache databases, session stores
  These don't need backups (can rebuild)
  Waste; potentially also exposes more data
```

Each anti-pattern alone can be hundreds to thousands of dollars per month.

### Lifecycle policy — the prevention

Don't manage retention manually; configure lifecycle policies:

```
AWS:
  RDS Backup Retention (built-in; sets daily retention)
  AWS Backup Vault Lifecycle (for centralized policy)
  S3 Lifecycle Policy (for snapshot exports to S3)
  
GCP:
  Snapshot retention policy
  Cloud SQL backup retention
  Persistent Disk snapshot schedule
  
AZURE:
  Backup Policy (Azure Backup)
  Recovery Services Vault retention
  
KEY SETTINGS:
  Daily snapshot retention: N days
  Auto-delete after N days
  Tier transition (e.g., move to archive after X days)
  Final deletion date
```

Configure once; lifecycle policies handle the rest. No manual cleanup.

### Archive tier — long retention done right

For backups that must be kept long term but accessed rarely:

```
STORAGE TIERS (AWS):
  S3 Standard:           $0.023/GB-month
  S3 Standard-IA:         $0.0125/GB-month
  S3 Glacier Instant:     $0.004/GB-month
  S3 Glacier Flexible:    $0.0036/GB-month
  S3 Glacier Deep Archive: $0.00099/GB-month (cheapest)

EXAMPLE FOR 7-YEAR COMPLIANCE RETENTION:
  Keep daily snapshots: 30 days in standard ($0.023/GB-month)
  Move to IA after 30 days ($0.0125)
  Move to Glacier after 90 days ($0.004)
  Move to Deep Archive after 180 days ($0.00099)
  Delete after 7 years
  
COST: 95%+ reduction vs keeping everything in standard
EFFORT: configure lifecycle policy once
```

Tier transitions are free; the storage savings are enormous over time.

---

## 2. Demo

A real backup right-sizing project:

```
TEAM AUDIT (Q3 2026):

CURRENT BACKUP STATE:
  47 production RDS databases
  Average DB size: 200 GB (~9.4 TB of live data)
  Current retention: 30 days daily + weekly + monthly indefinitely
  Total backup storage: ~96 TB (years of indefinite monthly/yearly
    accumulation on top of the incremental daily/weekly deltas)
  Backup cost: ~96 TB x $0.05/GB-month = ~$4,800/month
  
  Plus: 18 staging databases, 6 dev databases with same retention
  Additional cost: $1,500/month

OPPORTUNITY ASSESSMENT:
  
  Production (47 DBs):
    Current: 30 daily + 8 weekly + 24 monthly + yearly indefinite
    Proposed: 30 daily + 8 weekly + 12 monthly + 7 yearly (compliance)
    Savings: indefinite → 7 years; eliminate accumulated old backups
    Plus: migrate 90+ day backups to Glacier
    
  Staging (18 DBs):
    Current: 30 daily + weekly + monthly
    Proposed: 7 daily only
    Reasoning: staging not compliance-critical; restore via IaC
    
  Dev (6 DBs):
    Current: same as staging
    Proposed: 3 daily only
    Reasoning: dev iteration; minimal value of long retention

REMEDIATION (Q4 implementation):

WEEK 1 — POLICY:
  Document new retention per tier in platform repo
  Communicate to engineering + compliance
  Update IaC templates

WEEK 2-3 — IMPLEMENT:
  Update RDS backup retention settings
  Configure S3 lifecycle for archive transition
  Delete accumulated old backups (one-time cleanup)

WEEK 4 — VERIFY:
  Monitor backup cost trend
  Verify compliance retention met
  Document for next audit

POST-IMPLEMENTATION:
  
  Production backup cost:
    Before: $4,800/mo
    After:  $2,200/mo (-54%)
    
    Reasoning:
      - Eliminated indefinite retention ($1,800)
      - Migrated 90+ day backups to Glacier ($800)
    
  Staging backup cost:
    Before: $1,200/mo
    After:  $300/mo (-75%)
    
  Dev backup cost:
    Before: $300/mo
    After:  $80/mo (-73%)
    
  Total monthly savings: $3,720
  Annual savings: $44,640
  Effort: 4 weeks of platform engineering (~$5K)
  ROI: 9:1 in year 1; ongoing

COMPLIANCE: maintained
  7-year retention requirement satisfied
  Audit-ready documentation
```

The pattern: tier the retention; lifecycle policies; archive old backups; quarterly review.

---

## 3. Hands-on (5 min)

Audit your backup configuration:

```
□ STEP 1: List backup-eligible resources
  Production DBs: _____
  Staging DBs: _____
  Dev DBs: _____
  
□ STEP 2: Check current retention
  Production: _____ days daily + _____ weekly + _____ monthly
  Staging: _____ days
  Dev: _____ days

□ STEP 3: Calculate current cost
  Production backup cost: $_____/mo
  Total backup cost: $_____/mo

□ STEP 4: Right-size proposal
  Tier 0 retention: __________
  Tier 1 retention: __________
  Tier 2 retention: __________
  Tier 3 retention: __________
  Archive transition: __________

□ STEP 5: Calculate projected savings
  Projected backup cost: $_____/mo
  Savings: $_____/mo = $_____/yr

□ STEP 6: Configure lifecycle
  □ AWS Backup policy
  □ S3 lifecycle for archive
  □ Document in IaC
```

A 30-minute audit reveals the over-retention. Most teams save $1K-$5K/month.

---

## 4. Knowledge check

### Q1
Backup retention indefinitely:

A. Best practice for safety
B. Anti-pattern — cost grows monthly without bound. Set lifecycle policy with finite retention matching compliance + RTO needs. For compliance retention beyond 90 days: archive tier reduces cost 95%+ while maintaining accessibility.
C. Random
D. Compliant by default

<details>
<summary>Show answer</summary>

**Correct: B.** Set finite retention + archive for long compliance hold.
</details>

### Q2
Dev backups with same retention as prod:

A. Equal protection across environments
B. Anti-pattern — dev data isn't compliance-critical. Dev backups: 3-7 days enough; recreate via IaC if needed. Lower retention for dev is appropriate. Tier-based retention saves significant cost (typically 70-80% of dev backup cost).
C. Random
D. Required for HA

<details>
<summary>Show answer</summary>

**Correct: B.** Tier the retention. Dev = minimal; prod = full compliance.
</details>

### Q3
Daily + weekly + monthly + yearly retention for all workloads:

A. Always the right approach
B. Often over-engineered. Most workloads need: daily 30 days + weekly 8 weeks + monthly 12 months. Yearly only for compliance (Tier 0). Tiered retention prevents waste; matches actual recovery needs.
C. Random
D. Compliance default

<details>
<summary>Show answer</summary>

**Correct: B.** Match retention to tier; not blanket policy.
</details>

---

## 5. Apply

Audit retention; right-size per tier; configure lifecycle policies. Move old backups to archive tier. Quarterly review.

For ZopNight: backup storage shows in Cost by Service; recommendations surface over-retention candidates.

---

## Related lessons

- [L1 — Reliability line](L1_the_line.md)
- [L3 — DR cost discipline](L3_dr_costs.md) *(next)*
- [L4 — Reliability theatre](L4_reliability_theatre.md)
- [M5.3.L6 — Orphan PVC cleanup](../M5.3_k8s_discipline/L6_orphan_pvc.md)

## Glossary terms touched

[Backup retention](../../../reference/glossary/backup-retention.md) · [RTO / RPO](../../../reference/glossary/rto-rpo.md) · [Lifecycle policy](../../../reference/glossary/lifecycle-policy.md) · [Archive tier](../../../reference/glossary/archive-tier.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.5.L2
