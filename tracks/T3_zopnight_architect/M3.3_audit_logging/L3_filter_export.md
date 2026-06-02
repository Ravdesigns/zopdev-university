# Filtering, sorting, exporting

§ T3 · M3.3 · L3 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **construct** an audit-log query that answers a specific forensic or compliance question, **sort and paginate** efficiently for large result sets, **and export** the filtered view for SIEM or audit consumption.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Find the audit entry that proves or disproves a hypothesis, in under two minutes." |
| **Personas** | Security/Compliance · FinOps Lead · SRE / On-call |
| **Prerequisites** | M3.3.L1 (what's logged) · M3.3.L2 (body capture) |
| **Time** | 9 minutes |
| **Bloom verb** | Construct (Apply), Sort (Apply), Export (Apply) |

---

## 1. Concept

The Audit Log UI and API support a rich filter vocabulary designed to answer common forensic questions in a single query. Knowing the filter shapes is the difference between "let me page through 4,000 entries" and "let me filter to 7 entries, all directly relevant."

### Filter dimensions

```
DIMENSION       TYPICAL VALUES                        EXAMPLE
──────────────────────────────────────────────────────────────────
Time range      last 1h / 24h / 7d / 30d / custom    last 7d
Method          POST / PUT / PATCH / DELETE          DELETE
User            email or UID                          jane@example.com
PAT             specific PAT ID                       pat_abc123
Path pattern    substring match                      .../schedules
Status code     2xx / 3xx / 4xx / 5xx / specific    >= 400
Body search     full-text search in request/response "sch_xyz789"
Org             current org (default; multi-org      org_abc
                exports require org filter)
Trace ID        for correlation across logs           trc_001abc
```

Filters compose. "POST + path contains schedules + status = 201 + user = jane@example.com" narrows the scope precisely.

### Canonical queries

These appear over and over in real customer ops:

```
QUESTION                            FILTER COMBINATION
──────────────────────────────────────────────────────────────────
"What did user X do last week?"      user = x@example.com, time = 7d
"All schedule modifications"         method in [POST,PUT,PATCH,DELETE],
                                     path contains "/schedules"
"All failed API calls yesterday"     status >= 400, time = yesterday
"Who deleted resource Y?"            method = DELETE, body contains
                                     resource_id Y
"All RBAC changes this month"        path matches /roles|/users|/teams,
                                     method != GET, time = 30d
"Cloud-account credential rotations" path contains /cloud-accounts,
                                     body contains "rotate"
"Failed login attempts"              path contains /auth/, status = 401
"Bulk action by user X"               user=X, count window: > 10 entries
                                     per minute
```

The last one is interesting — it is a *frequency* query, not a content query. Use the export and post-process if the UI does not support frequency-based filtering directly.

### Sorting

```
DEFAULT       timestamp descending (newest first)
ALTERNATIVES  latency_ms desc        (find slow requests)
              status desc            (errors first)
              user                    (group by actor)
              path                    (group by surface)
```

For investigations, timestamp-asc (oldest first within a window) is often more useful — it shows the sequence of events as they happened.

### Pagination

```
DEFAULT page size:   50 rows
CONFIGURABLE up to:  200 rows
NAVIGATION:          next / previous / jump-to
LARGE RESULT SETS:   cursor-based pagination (no offset overflow)
NO infinite scroll:  intentional — bookmarkable pages
```

The "no infinite scroll" choice is a small UX decision with a useful side effect: a filtered audit-log page can be linked, shared in a ticket, or pasted into an incident channel and the recipient sees the same view.

### Export

Once the filter is right, export the result for offline analysis, ticket attachments, or compliance evidence collection.

```
FROM THE UI:
  Click "Export" on the filtered view
  Format: CSV (most common) or JSON (richer; includes nested body)
  Scope: matches the current filter exactly
  Redaction: redacted fields stay redacted in exports
  
FROM THE API:
  curl -H "Authorization: Bearer ${PAT}" \
       "https://api.zopnight.com/v1/audit/logs?
          method=POST&time=7d&path=/schedules"
  
  Response: JSON, cursor-paginated
  Pagination: `next_cursor` field; loop until exhausted
```

The API path is the one to use for SIEM integration. Many customers configure a scheduled job (cron / Lambda / Logic App) that pulls the audit log every hour and forwards to Splunk / Datadog / Sumo Logic.

### Saved searches

For queries that recur on a regular basis, save them.

```
EXAMPLE saved searches:

"Daily schedule changes"        method ≠ GET, path contains
                                "/schedules", time = 24h
                                
"My last 24 hours"              user = me, time = 24h

"All RBAC changes this month"    method ≠ GET, path matches
                                /roles|/users|/teams, time = 30d
                                
"All cloud-account changes"      method ≠ GET, path contains
                                "/cloud-accounts"
                                
"Failed login attempts (week)"   path contains /auth/, status = 401,
                                time = 7d

"Body-truncated entries"          body contains "[BODY TRUNCATED"
                                (find oversized payloads to investigate)
```

Saved searches appear in the Saved Searches menu; one click re-runs with the live data. Useful for weekly review rituals.

### SIEM export patterns

For long-term retention or organization-wide log aggregation, customers export audit logs to their SIEM:

```
INTEGRATION PATTERN
────────────────────────────────────────────────────────────
Cadence:           Hourly cron, or webhook-on-change
Format:            JSON (preserves body structure)
Filter:            Last hour (delta sync)
Destination:       Splunk HEC / Datadog / Sumo / S3
Retention:         Determined by SIEM (often years)
Authentication:    PAT scoped to audit-log:export
```

ZopNight provides reference integrations for the common SIEMs in [docs.zopnight.com/integrations/siem](https://docs.zopnight.com/integrations/siem). The reference scripts handle pagination, deduplication on `trace_id`, and graceful retry on transient errors.

### How ZopNight uses query patterns

For compliance evidence collection (SOC 2, ISO 27001), ZopNight provides pre-formatted reports built on these query patterns:

```
EVIDENCE REPORT                  UNDERLYING QUERY
────────────────────────────────────────────────────────────
"Quarterly RBAC changes"          path /roles|/users, time = 90d
"Cloud-account rotations"         path /cloud-accounts, body
                                  contains "rotate"
"Schedule changes by team"        path /schedules, grouped by
                                  team from request body
"Authentication anomalies"        path /auth/, status >= 400
"Privileged actions log"          method = POST, path matches
                                  admin-tier paths
```

Customers can run these directly or pipe to SIEM for retention.

---

## 2. Demo

Three real workflows where filtering is the bottleneck for response time:

```
DAILY USE — FinOps analyst, 5 minutes
────────────────────────────────────────────────────────
T+0      Open Audit Log
T+10 s    Filter: "method ≠ GET, path contains /schedules, time = 24h"
T+30 s    47 entries returned
T+45 s    Skim for anomalies: 2 unusual ones identified
T+1 min   Click each for body detail; confirm or escalate
T+2 min   Mark reviewed; close loop

WEEKLY USE — Security reviewer, 10 minutes
────────────────────────────────────────────────────────
T+0      Open Audit Log
T+10 s    Saved search: "All RBAC changes this week"
T+15 s    23 entries: role changes, user invites, team assignments
T+2 min   Walk through each: ensure each was authorized
T+5 min   Cross-reference 1 anomaly against ticketing system
T+8 min   Mark cleared; capture export for the quarterly report

INVESTIGATION — On-call, 15 minutes
────────────────────────────────────────────────────────
T+0      Incident report: "schedule sch_xyz789 misfired"
T+30 s    Filter: body contains "sch_xyz789", any method
T+1 min   12 entries chronologically: creation, 3 edits, 8 fire events
T+3 min   Identify the change that broke it (the cron-typo from L2)
T+5 min   Revert; document; close
```

Each workflow follows the same pattern: filter narrows scope, body capture provides detail, export captures the evidence.

---

## 3. Hands-on (6 min)

Run three queries on your audit log:

```
QUERY 1: "Mutations in the last 24 hours, by your user"
  Filter:    user = me, method ≠ GET, time = 24h
  Result count: _____
  Top action types: __________
  
QUERY 2: "All deletions in the last 7 days"
  Filter:    method = DELETE, time = 7d
  Result count: _____
  Surprise count (unauthorized or mysterious)? _____
  
QUERY 3: "Failed mutations this month"
  Filter:    status >= 400, method ≠ GET, time = 30d
  Result count: _____
  Most common failure path: __________

OPTIONAL — set up your first saved search:
  Name: __________________
  Filter: __________________
  Reason you'd run this regularly: __________________
```

If query 2 surfaces unexpected deletions, investigate before closing the lesson.

---

## 4. Knowledge check

### Q1
Server-side pagination is used because:

A. UX preference
B. Audit logs accumulate to months or years of mutations. Client-side pagination would require fetching all entries; server-side returns only the requested page. Cursor pagination (rather than offset) avoids overflow issues at large datasets.
C. Performance optimization for screen rendering
D. Network speed

<details>
<summary>Show answer</summary>

**Correct: B.** Scalability is the driver. Offset pagination breaks down past ~10,000 entries; cursor pagination scales to millions.
</details>

### Q2
A saved search:

A. Is just a URL bookmark
B. Stores the filter combination and re-runs it on click with live data. Useful for ritualized review patterns: daily schedule check, weekly RBAC review, monthly compliance export.
C. Saves the result CSV
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Saved searches are filter definitions, not result snapshots. They surface new entries since last run.
</details>

### Q3
Export of the audit log returns:

A. The full audit log unfiltered
B. Everything matching the current filter, in CSV or JSON. Redacted fields stay redacted. Useful for compliance reporting; for SIEM integration, prefer the API path with cursor pagination over UI exports.
C. Only the visible page (50 rows)
D. Random sampling

<details>
<summary>Show answer</summary>

**Correct: B.** Filtered export. Always confirm the filter matches what the auditor or downstream consumer needs before clicking Export.
</details>

---

## 5. Apply

The Audit Log page at [Settings → Audit Log](https://app.zopnight.com/settings/audit-log) supports all filters and exports. For programmatic access, the [Audit API](https://docs.zopnight.com/api/audit) handles the same filter vocabulary with cursor pagination.

For org-wide log aggregation, follow the SIEM reference at [docs.zopnight.com/integrations/siem](https://docs.zopnight.com/integrations/siem) — the recommended setup is hourly delta sync via PAT-authenticated API calls.

---

## Related lessons

- [L1 — What gets logged](L1_what_logged.md)
- [L2 — Body capture trade-offs](L2_body_capture.md)
- [L4 — Compliance posture](L4_compliance.md) *(next)*
- [T3.M3.1.L6 — Frontend gating with usePermission](../M3.1_rbac/L6_frontend_gating.md)

## Glossary terms touched

[Filter dimension](../../../reference/glossary/filter-dimension.md) · [Saved search](../../../reference/glossary/saved-search.md) · [Cursor pagination](../../../reference/glossary/cursor-pagination.md) · [SIEM export](../../../reference/glossary/siem-export.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.3.L3
