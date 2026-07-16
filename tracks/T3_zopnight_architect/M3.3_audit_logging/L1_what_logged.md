# What's logged

§ T3 · M3.3 · L1 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** what the audit log captures and what it deliberately excludes, **explain** the mutations-only design choice, **and describe** the per-event payload that lands in storage.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Know exactly what evidence the audit log will and will not have when an auditor or incident responder asks." |
| **Personas** | Security/Compliance · Platform Engineer · FinOps Lead |
| **Prerequisites** | M3.1 — RBAC fundamentals |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember), Explain (Understand), Describe (Apply) |

---

## 1. Concept

ZopNight's audit log captures every **mutating action** — `POST`, `PUT`, `PATCH`, `DELETE` — performed through the API or the UI (the UI sends API calls under the hood, so the distinction does not matter for logging). Both the request body and the response body are stored. **Reads (`GET`) are not logged.** This choice is deliberate, and the reasoning shapes how the audit log can be used.

```
ACTION                          LOGGED?      WHY
──────────────────────────────────────────────────────────────────
Create / update / delete         Yes          State change
  schedules, recs, budgets,                   = audit-worthy
  resource-groups, etc.
  
Apply remediation                Yes          High-impact mutation
Set / cancel override            Yes          Affects spend
Connect cloud account            Yes          Provenance critical
Rotate / revoke credentials      Yes          Security event
Modify role / user / team        Yes          Authorization change

Read schedule / recommendation   No           Read access already
View dashboard / cost report     No           gated by RBAC; volume
Browse resources                 No           too high to log usefully
```

### Why mutations only

Three reasons converge on the same answer. First, **volume**: a typical mid-size customer issues ~1,000 read requests for every mutation. Logging reads at the same fidelity would multiply the audit storage by 1,000× with minimal forensic value. Second, **redundancy**: RBAC already controls read access. If a user does not have `resource:view`, they cannot read the resource; recording every successful `resource:view` does not tell you anything `policy-table + role assignment` does not already say. Third, **focus**: in an incident or audit, the relevant question is almost always "what changed" not "who looked." Mutations-only keeps the log readable.

Reads do get logged in two narrow cases: when a read fails authorization (the `403`/`404` is recorded so anomalous access attempts surface), and when MCP-driven reads happen (M6 covers this — MCP calls are logged because the agent-driven access pattern is a newer surface that auditors specifically ask about).

### Per-org Redis Streams

The audit log uses Redis Streams as the transport layer, scoped per organization.

```
PATH:    api request → gateway → backend service
                                   ↓ (async)
                              audit middleware
                                   ↓
                           org-scoped Redis Stream
                                   ↓ (every minute)
                              MySQL audit table
                                   ↓
                           Audit Log page + API
```

Per-org streams give three properties: **real-time delivery** (no batch lag — events show up within a second), **org-scoped isolation** (one customer's audit volume cannot affect another's), and **durable buffer** during the brief window between stream write and MySQL flush (so a database hiccup does not lose events).

### MySQL sync

Every minute, accumulated stream entries flush to the MySQL audit table. After flush, MySQL is the canonical store. The Audit Log page in ZopNight UI queries MySQL; the API queries MySQL; long-term retention is MySQL-backed.

```
TIME      WHERE EVENTS LIVE                STATUS
──────────────────────────────────────────────────────────
T+0       Redis Stream (org-scoped)        Real-time queryable
T+1 min   MySQL audit table                Canonical
T+1 min   Stream entries trimmed            Cleaned up
T+30 d    Still in MySQL                    Default retention
T+1 yr    Still in MySQL (Enterprise)       Extended retention
```

Retention is org-controlled. Most customers retain indefinitely for compliance; some configure 1-year or 90-day windows; export-to-SIEM is supported for orgs that want their own long-term storage.

### What gets stored per event

```
ALWAYS PRESENT
  timestamp           UTC, microsecond precision
  org_id              tenant scope
  user_id             who made the request (email + UID)
  pat_id              if PAT-authenticated (else null)
  method              POST / PUT / PATCH / DELETE
  path                /orgs/{org}/schedules
  status_code         response status
  latency_ms          server-side processing time
  trace_id            for cross-log correlation

REQUEST FIELDS
  body                full payload (redacted if sensitive)
  query_params        ?account_id=…
  selected headers    user_agent, ip_address, x-forwarded-for

RESPONSE FIELDS
  body                full response payload (redacted as needed)
  error_message       if applicable
```

Sensitive fields are redacted at the audit middleware before storage. Examples: cloud-account secret keys (replaced with `***`), OAuth client secrets, PAT values on creation (only the PAT ID and description are stored, never the secret).

### Body capture

By default, the full request body and response body are stored. This is "body capture mode" — the audit log answers not just "what endpoint was hit" but "with what data, returning what result." For most customers, this is exactly the right default: a year later when an auditor asks "what did the May 20 schedule update actually do?" you can show them the body.

A small number of orgs disable body capture for storage cost or data-residency reasons. The L2 lesson covers when this trade-off is worth making.

### Reasoning about what is NOT logged

Three categories of activity are conspicuously absent from the audit log:

```
NOT LOGGED                                  WHY
──────────────────────────────────────────────────────────────────
Successful reads (most GETs)                Volume + redundancy
Internal service-to-service calls           Different audit channel
Database queries below the API layer        Not user-initiated
User browser activity (page loads, clicks)  Frontend telemetry separate
LLM conversations (with MCP)                Tool calls logged; chat is not
```

When an auditor asks for evidence in one of these categories, the answer is "we have a different log for that" — frontend telemetry for browser activity, MCP-specific logs for agent tool calls, internal service logs for backend operations. The audit log is intentionally about the user-API surface.

### How ZopNight uses it

The audit log feeds two surfaces directly: the **Audit Log page** in Settings, where admins browse and filter events; and the **Audit API** at `/v1/audit/logs`, which supports export to SIEM systems (Splunk, Datadog, Sumo Logic). The API is paginated, supports filtering by user, time, method, path, and status, and returns the same payload visible in the UI.

For compliance evidence collection (SOC 2, ISO 27001), ZopNight provides pre-formatted exports: "RBAC changes for the audit window," "Cloud-account credential rotations," "Schedule changes by team." These exports are queries against the audit log packaged for auditor consumption.

---

## 2. Demo

A typical audit log entry for a schedule creation:

```
AUDIT LOG ENTRY                                                     
─────────────────────────────────────────────────────────────
timestamp:     2026-05-20T16:42:11.234Z
org_id:        org_abc123
user_id:       jane@example.com (uid_user_xyz)
pat_id:        null  (UI session, not PAT)
method:        POST
path:          /orgs/org_abc123/schedules
status:        201 Created
latency_ms:    87
trace_id:      trc_001abc
ip_address:    198.51.100.42
user_agent:    Mozilla/5.0 (Macintosh; ...)

REQUEST BODY:
  {
    "name": "business-hours-eu",
    "timezone": "Europe/London",
    "crons": [
      {"expression": "0 8 * * 1-5", "action": "start"},
      {"expression": "0 20 * * 1-5", "action": "stop"}
    ],
    "resource_group_id": "rg_eu_dev"
  }

RESPONSE BODY:
  {
    "id": "sch_xyz789",
    "name": "business-hours-eu",
    "created_at": "2026-05-20T16:42:11Z",
    "resource_count": 14
  }
```

A year later, when finance asks "what was the EU dev schedule when we started saving $X/month?" the audit log has the canonical answer — including the cron expressions, timezone, and which resource group was affected.

---

## 3. Hands-on (5 min)

Open ZopNight Settings → Audit Log. Filter to the last 7 days, method=POST:

```
EVENTS COUNTED (last 7 days):
  POST events:    _____
  PUT events:     _____
  PATCH events:   _____
  DELETE events:  _____
  
TOP ACTIONS (count by path):
  __________________________ : _____ events
  __________________________ : _____ events
  __________________________ : _____ events

PICK ONE EVENT. Read its full payload:
  Endpoint:      __________
  User:          __________
  What changed:  __________
  
If your team's last 7 days has <5 mutations, RBAC is probably very
restrictive (or the team is on vacation). If >500, that's an active org.
```

---

## 4. Knowledge check

### Q1
`GET` requests are:

A. Logged with full body and headers
B. Not logged. Volume is ~1,000× mutations; RBAC already controls who can read; recording reads adds storage cost without forensic value. Failed reads (auth denied) are logged separately.
C. Logged but summarized
D. Logged for admins only

<details>
<summary>Show answer</summary>

**Correct: B.** Mutations-only is the deliberate design. Failed reads are captured because they may indicate probing; successful reads are not.
</details>

### Q2
The audit log captures:

A. Request body only — response is too sensitive
B. Both request and response body, with sensitive fields (cloud-account secrets, PAT values, OAuth secrets) redacted at the middleware before storage. Full body capture is the default; some orgs disable it for cost/residency.
C. Response body only
D. Headers only

<details>
<summary>Show answer</summary>

**Correct: B.** Full request + response with redaction. "What was the schedule's exact config?" is the kind of question this answers.
</details>

### Q3
Redis Streams is used for:

A. Long-term storage of the audit log
B. Real-time delivery and a durable buffer until the per-minute MySQL flush. Each org has its own stream, isolating audit volume between tenants and surfacing events in the UI within seconds.
C. Backup of MySQL
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Streams are the transport + buffer; MySQL is the canonical long-term store.
</details>

---

## 5. Apply

Browse the audit log at [Settings → Audit Log](https://app.zopnight.com/settings/audit-log). The page filters on user, method, path, time, and status. Export to CSV from the page or query the [Audit API](https://docs.zopnight.com/api/audit) for SIEM integration.

A useful habit: review audit-log volume weekly. Sudden spikes often indicate a runaway script; sudden drops often indicate a logging-pipeline issue.

---

## Related lessons

- [L2 — Body capture trade-offs](L2_body_capture.md) *(next)*
- [L3 — Filtering and export](L3_filter_export.md)
- [L4 — Compliance posture](L4_compliance.md)
- [T3.M3.1.L1 — The 15-entity policy table](../M3.1_rbac/L1_policy_table.md)

## Glossary terms touched

[Audit log](../../../reference/glossary/audit-log.md) · [Redis Stream](../../../reference/glossary/redis-stream.md) · [Body capture](../../../reference/glossary/body-capture.md) · [Trace ID](../../../reference/glossary/trace-id.md) · [Mutating action](../../../reference/glossary/mutating-action.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.3.L1
