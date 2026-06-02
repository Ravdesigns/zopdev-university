# SQL Warehouse scheduling

§ T2 · M2.7 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **schedule** SQL Warehouses off-hours, **size** them for actual usage, **and choose** between the three scheduling patterns.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Schedule SQL Warehouses to match actual query patterns — not always-on at largest size." |
| **Personas** | Data Engineer · Analytics Engineer · FinOps Lead |
| **Prerequisites** | M2.7.L1 · M2.7.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Schedule (Apply), Size (Evaluate), Choose (Evaluate) |

---

## 1. Concept

SQL Warehouses are Databricks's modern SQL compute. They auto-pause after inactivity (configurable). They can be scheduled off, scaled in size, or stopped manually.

```
SQL WAREHOUSE LEVERS:
  1. Size (2X-Small to 4X-Large) — affects concurrency + speed
  2. Autopause (off after N min idle)
  3. Schedule (start/stop times)
  4. Scaling (change size at scheduled times)
```

Combinations of these handle different workload patterns.

### Warehouse sizes

```
SIZE              CLUSTER           COST FACTOR (rough)
─────────────────────────────────────────────────────────
2X-Small          1 node             0.25x
X-Small           2 nodes            0.5x
Small             4 nodes            1x (baseline)
Medium            8 nodes            2x
Large             16 nodes           4x
X-Large           32 nodes           8x
2X-Large          64 nodes           16x
3X-Large          128 nodes          32x
4X-Large          256 nodes          64x
```

Each size has different concurrency capacity. Choose based on workload.

### Three scheduling patterns

```
PATTERN A — SCHEDULE OFF-HOURS (like clusters)
  Warehouse stops nights/weekends entirely
  Cost: ~50-60% savings vs always-on
  Restart latency: 1-2 minutes
  Best for: non-prod or off-hours-light workloads

PATTERN B — AUTOPAUSE ONLY
  Warehouse stays available 24/7
  Autoterm = 5 minutes (default)
  Cost: pays for actual query time + ~5 min warm
  Restart latency: zero on use (warehouse stays warm during business)
  Best for: 24/7 query availability needed

PATTERN C — SIZE-SCALING SCHEDULE
  Use Medium (8 nodes) during business hours
  Scale to X-Small (2 nodes) overnight for occasional queries
  Cost: variable based on traffic
  Best for: prod with diurnal variation
```

For non-prod: Pattern A. For prod with 24/7 query load: Pattern B. For prod with diurnal variation: Pattern C.

### Pattern A details

```
WAREHOUSE: reporting-warehouse, Small (4 nodes)
SCHEDULE: business-hours-reporting (8 AM - 8 PM Mon-Fri)

WEEKDAY:
  8 AM: start warehouse (ZopNight: warehouses/start)
  Throughout day: serves queries
  8 PM: stop warehouse (ZopNight: warehouses/stop)

WEEKEND:
  Warehouse stopped (no scheduled actions on weekends)
  Cost during weekend: $0 (warehouse fully off)

RESULT:
  Active hours/week: 60 (12 × 5)
  Inactive hours/week: 108
  Theoretical savings: 64% of weekly cost
  Realistic: ~50% after accounting for some weekend queries (if any)

WEEKEND QUERY HANDLING:
  Queries during weekend: fail (warehouse off)
  Workaround: manual start before query
  Or: switch to Pattern B for 24/7 availability
```

Pattern A is the most cost-aggressive.

### Pattern B details

```
WAREHOUSE: ad-hoc-warehouse, X-Small (2 nodes)
SCHEDULE: none (24/7 available)
AUTOTERM: 5 minutes

BEHAVIOR:
  Idle: warehouse auto-pauses after 5 minutes of no queries
  Query arrives: warehouse resumes (1-2 sec for X-Small)
  Cost: pay only for active query time
  Cold-start: minimal (small warehouse = fast restart)

GOOD FOR:
  Unpredictable / low-volume queries
  24/7 availability requirement
  Cost-aware but availability-first

NOT GOOD FOR:
  Steady-state warehouses (always running anyway)
  Large warehouses (cold-start slower)
```

Pattern B trades some cost for availability.

### Pattern C details

```
WAREHOUSE: prod-bi-warehouse, Medium (8 nodes during business hours)

TWO SCHEDULES:
  business-hours-medium: Medium (8 nodes) 8 AM - 6 PM weekdays
  off-hours-small: X-Small (2 nodes) 6 PM - 8 AM + weekends

ZopNight handles size transitions via warehouse API:
  At 6 PM: scale down to X-Small (2 nodes)
  At 8 AM next day: scale back to Medium (8 nodes)
  Weekend: stays at X-Small

BEHAVIOR:
  Peak hours: Medium for full reporting capacity
  Off-hours: X-Small for occasional queries
  Cost reduced ~50% during off-hours without losing availability
  Some scaling overhead at transitions

GOOD FOR:
  Production BI workloads with predictable variation
  When team works business hours but reports run off-hours
```

Pattern C is most operationally complex but optimal for steady production.

### Cost implications comparison

```
PATTERN                  WEEKLY COST (relative to baseline)
──────────────────────────────────────────────────────────
A (off entirely)         ~35-50% of baseline (savings: 50-65%)
B (autoterm only)         ~50-70% of baseline (savings: 30-50%)
C (size scale)            ~50-70% of baseline (savings: 30-50%)

Baseline = warehouse running 24/7 at fixed size
```

Pattern A wins on pure cost for non-prod. Pattern B/C optimize prod cost with availability.

### Choosing the right pattern

```
SCENARIO                              RECOMMENDED PATTERN
─────────────────────────────────────────────────────────
Non-prod reporting warehouse           A (off entirely)
                                       
Production BI; off-hours queries OK   B (autoterm only)
to be slower                          
                                       
Production BI; queries 24/7 normal     B (autoterm)
                                       
Production BI with diurnal variation   C (size scale)
                                       
Dev / experimental warehouse           A (off entirely)
                                       
Ad-hoc data exploration                B (autoterm)
                                       
Critical regulatory reporting          Keep large; minimal scheduling
                                       Don't compromise availability
```

The pattern depends on the workload's actual access pattern.

### Sizing for actual usage

```
COMMON SIZING MISTAKES:

OVER-SIZED:
  Workload runs Large but actual concurrency stays under Small capacity
  Cost: 4× what's needed
  
UNDER-SIZED:
  Workload runs X-Small but queries queue up
  Cost: low but engineer wait time high
  
RIGHT-SIZED:
  Pick based on actual concurrent query load
  Use Databricks query metrics
  Resize quarterly as workload evolves

SIZING GUIDELINES:
  2X-Small / X-Small: 1-5 concurrent users; light queries
  Small: 5-20 concurrent; standard reporting
  Medium: 20-50 concurrent; production BI
  Large+: 50+ concurrent; heavy data processing
```

Right-sizing the warehouse is independent of scheduling but compounds the savings.

---

## 2. Demo

A team's BI warehouse setup:

```
WAREHOUSE: reporting-warehouse
  Size: Medium (8 nodes)
  Usage: 12 BI users
  Queries: 200/day on weekdays; 0-5 on weekends

BEFORE (no scheduling, autoterm 60 minutes):
  Cost: ~$4,200/month
  Pattern: warehouse runs all the time except brief autoterm
           cooldowns during weekend evenings

WITH PATTERN A (schedule off-hours + autoterm):
  Schedule: business-hours 8 AM - 8 PM Mon-Fri
  Autoterm: 30 minutes (within business hours)
  
  Cost: ~$1,400/month (66% reduction)
  Trade-off: weekend queries fail (warehouse off)
  Team workflow change:
    "queries on weekends require manually starting the warehouse"
    
  Decision factors:
    Few weekend queries (5/week)
    Team OK with manual start for those
    Cost savings significant ($2,800/mo)
  
  DECISION: acceptable for this team

WITH PATTERN B (autoterm only, smaller default size):
  Size: X-Small (2 nodes) baseline (instead of Medium)
  Autoterm: 5 minutes
  
  Cost: ~$1,100/month
  Trade-off: weekend queries still work but with X-Small performance
    Complex reports slower
    
  Decision factors:
    Similar cost to A
    Weekend availability preserved
    Some query latency increase

CHOSEN: Pattern A
  Reasoning: cost clarity; clear off-hours boundary
  Team adapts to "scheduled" weekends
  Predictable cost
  
RESULTS (3 months in):
  Actual cost: $1,420/mo (close to projection)
  Weekend manual starts: averaged 3 per month
  Engineer satisfaction: high (predictable)
  No workload disruption during weekdays
```

The team chose A for the cost clarity, even though B was close.

---

## 3. Hands-on (5 min)

Choose a pattern for your warehouse:

```
□ STEP 1: Identify warehouse usage
  Warehouse: __________
  Size: __________
  Current cost: $_____/mo
  
  Weekday queries: _____/day
  Weekend queries: _____/day
  Off-hours queries: _____/day

□ STEP 2: Pick a pattern
  □ A: Schedule off-hours
  □ B: Autoterm only
  □ C: Size-scaling

□ STEP 3: Estimate savings
  Pattern A: ~50-65% = $_____/mo savings
  Pattern B: ~30-50% = $_____/mo savings
  Pattern C: ~30-50% = $_____/mo savings

□ STEP 4: Configure
  Schedule: __________
  Times: __________

□ STEP 5: Monitor first month
  Actual savings: $_____
  Disruptions: _____
  Decision to adjust: __________
```

A 10-minute exercise per warehouse. Pattern A often the right choice for non-prod.

---

## 4. Knowledge check

### Q1
Pattern A (schedule off-hours) for a SQL Warehouse provides:

A. Highest availability
B. Highest savings (~50-65%) for non-prod or off-hours-light workloads, at the cost of unavailability during scheduled-off times. Cost-aggressive choice; trade-off is weekend / off-hours queries fail.
C. No savings
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Pattern A is the cost-aggressive choice.
</details>

### Q2
Pattern C (size scaling between business and off-hours) is best for:

A. Always-zero workloads
B. Workloads with diurnal variation in query volume — peak during business hours, lower demand off-hours. Diurnal variation is the canonical Pattern C use case. Maintains availability while saving cost during light periods.
C. Random
D. New workloads

<details>
<summary>Show answer</summary>

**Correct: B.** Diurnal variation is the canonical Pattern C use case.
</details>

### Q3
A weekend query to a Pattern A warehouse:

A. Succeeds
B. Fails — warehouse is stopped. Manual start required, then query. Or move to Pattern B for weekend availability. Pattern A trades availability for cost.
C. Auto-starts
D. Cached

<details>
<summary>Show answer</summary>

**Correct: B.** Pattern A = unavailable during off-hours unless manually started.
</details>

---

## 5. Apply

SQL Warehouse scheduling is on the warehouse's detail page. The three patterns are configurable.

For your team: choose pattern by access pattern; tune over quarters.

---

## Related lessons

- [L1 — What's discovered](L1_what_is_discovered.md)
- [L2 — Cluster scheduling](L2_cluster_scheduling.md)
- [L4 — Dependent jobs](L4_dependent_jobs.md) *(next)*
- [M2.6 — K8s scheduling](../M2.6_k8s_scheduling/00_README.md)

## Glossary terms touched

[SQL Warehouse](../../../reference/glossary/sql-warehouse.md) · [Warehouse sizing](../../../reference/glossary/warehouse-sizing.md) · [Autoterm vs schedule](../../../reference/glossary/autoterm-vs-schedule.md) · [Size-scaling pattern](../../../reference/glossary/size-scaling-pattern.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.7.L3
