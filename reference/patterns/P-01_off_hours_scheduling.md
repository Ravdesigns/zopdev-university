# P-01 — Off-hours scheduling for non-prod

§ Pattern · CDCR · Operator level

## Problem

Non-production resources (dev, test, stage) typically run 24/7 even though engineers only use them during business hours. ~64% of weekly hours are wasted.

## Applies when

- Non-prod environment exists
- Resources are tagged (or can be) with environment label
- Resources tolerate restart latency of 1-3 minutes
- Restart doesn't lose critical state

## Pattern

```
1. Tag all non-prod resources with environment={dev|test|stage}
2. Group resources by environment (M1.4)
3. Create schedule: 8 AM - 8 PM weekdays
4. Attach group to schedule
5. Observe; tune for friction
```

## Anti-pattern

```
- Schedule individual resources without grouping → maintenance overhead
- Schedule weekend hours too aggressively → engineer friction
- Schedule without belt-and-suspenders weekend stop → drift accumulates
- Schedule prod accidentally → outage
```

## Worked example

```
ESTATE: 184 non-prod EC2 instances, total $48K/month always-on cost

SCHEDULE: 8 AM - 8 PM Mon-Fri, weekend belt-and-suspenders
COVERAGE: 60 active hours/week (35.7%); 108 inactive (64.3%)
REALISM FACTOR: 0.7

THEORETICAL SAVINGS: 64% × $48K = $30,700/month
REALISTIC SAVINGS: $21,500/month
ANNUAL: $258,000/year

Time to set up: ~30 minutes (with tagging done)
Time to maintain: 30 min/week (Operate cadence)
```

## Diagram

24-hour weekly grid showing ON blocks 8 AM - 8 PM weekdays, OFF blocks everywhere else, with the belt-and-suspenders weekend cron preventing drift.

## When NOT to apply

- Production workloads (use autoscaling instead)
- Single-replica stateful databases (no margin for restart)
- 24-hour batch workloads
- Workloads with stateful caches requiring long warm-up

## Related lessons

- [T1.M1.3 — Build your first schedule](../../tracks/T1_zopnight_operator/M1.3_first_schedule/00_README.md)
- [T5.M5.2 — Schedule design patterns](../../tracks/T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

---

§ P-01 · Last reviewed 2026-05-20
