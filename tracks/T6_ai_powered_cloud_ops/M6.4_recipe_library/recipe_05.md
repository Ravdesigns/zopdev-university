# Recipe 5 — Schedules that failed last week

§ T6 · M6.4 · Recipe 5 of 15 · Engineer tier · 3 min

## Intent

Find every scheduled action (start/stop) that failed in the last 7 days. Failed schedules silently lose savings — surface them quickly.

## Prompt to AI agent

```
"Which schedules failed in the last 7 days? Show the schedule name,
attached resource, when it failed, and the failure reason."
```

## MCP tools used

```
list_schedules()
get_schedule for each
list_audit_logs(filters={"type":"schedule_action", "status":"failed", "time>=":"7d"})
```

## Expected output

```
SCHEDULE FAILURES (last 7 days):

Schedule              Resource            Failed At              Reason
────────────────────────────────────────────────────────────────────────
nights-eu-dev         i-0abc123 (EC2)     2026-05-15 22:01      AWS API throttled
weekend-stop-batch    rds-batch-01        2026-05-17 02:00      Permission denied
holiday-stop-misc     i-0xyz789 (EC2)     2026-05-18 02:00      Resource not found

3 schedule failures.

ROOT CAUSE ANALYSIS:
  - AWS API throttled: retry-able; usually self-corrects
  - Permission denied: IAM role lost permission; investigate
  - Resource not found: resource was deleted; remove from schedule

IMPACT:
  - 3 resources missed their scheduled stop
  - Estimated lost savings: $14 (small) — but a permission issue
    will keep recurring until fixed
```

## Variations

```
"Which schedules have failed more than 3 times this month?"
"List schedules that haven't run in 30+ days (stale)"
"For schedule X, show its run history for the last quarter"
```

## When to use

Weekly schedule health check. After IAM/permission changes. Cost-recovery sprint prep.

---

§ Recipe 5 · Last reviewed 2026-05-20
