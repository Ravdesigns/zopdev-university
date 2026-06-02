# Recipe 7 — This week's cost anomalies

§ T6 · M6.4 · Recipe 7 of 15 · Engineer tier · 3 min

## Intent

Active anomalies + root cause for weekly triage.

## Prompt

```
"List cost anomalies fired this week, ordered by severity.
For each, show the resource, the deviation, and the suggested root cause."
```

## MCP tools

```
list_anomalies(time_range="last_7_days", sort="severity:desc")
get_anomaly_root_cause(anomaly_id=<each>)
```

## Expected output

```
RESOURCE                SEVERITY    DEVIATION    ROOT CAUSE
─────────────────────────────────────────────────────
i-0gpu-train-99         emergency   +1,200%       New resource (CI bug)
db-prod-cache           critical    +250%         Memory pressure
asg-prod-api            warning     +75%          Marketing campaign (expected)
i-0test-456             warning     +60%          New CI runner
─────────────────────────────────────────────────────
TOTAL UNRESOLVED: 3 critical or higher
```

## Variations

```
"Anomalies from last week, with status (open/resolved)"
"Anomalies on production resources only"
"Anomalies that turned into incidents"
```

## When to use

Daily quick check. Weekly Operate review. Postmortem ingestion.

---

§ Recipe 7 · Last reviewed 2026-05-20
