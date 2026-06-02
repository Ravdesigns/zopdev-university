# Where audit logs live and how to query them

§ T1 · M1.6 · L5 of 5 · Operator tier · 11 min

---

## Outcome

By the end of this lesson, you will be able to **query** the audit log for specific events **and explain** what is captured in request and response bodies.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Produce audit evidence in five minutes when Security asks." |
| **Personas** | Security/Compliance · Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1–L4](L1_state_history.md) |
| **Time** | 11 minutes |
| **Bloom verb** | Query (Apply) and Explain (Understand) |

---

## 1. Concept

The audit log is the canonical record of every mutating action in ZopNight. Every POST, PUT, PATCH, and DELETE is captured by the gateway middleware, including the request body and the response body. Records flow to per-org Redis Streams in real time, then sync to MySQL every minute for durable storage.

This is the foundation for SOC 2 / ISO 27001 audit evidence, debugging "who did what," and reconstructing events.

### What gets logged

```
EVENT CLASS                                  LOGGED?    BODY CAPTURED?
─────────────────────────────────────────────────────────────────────
Schedule created / updated / deleted          Yes        Yes
Override applied / cancelled                  Yes        Yes
Auto-remediation triggered                    Yes        Yes
Manual start / stop                           Yes        Yes
Group created / updated / member changed      Yes        Yes
Resource attached / detached from schedule    Yes        Yes
Cloud account connected / rotated / revoked   Yes        Yes (cred excluded)
Notification channel changed                  Yes        Yes (webhook URL excluded)
RBAC role / policy changed                    Yes        Yes
SAML / OAuth config changed                   Yes        Yes
Dashboard mutations                           Yes        Yes
Discovery sync run (success/failure)          Yes        No (too high volume)
Read operations (GET)                          No         N/A
```

Every mutation is captured. Every read is not (the volume would be enormous and read access is already restricted by RBAC).

### What the log entry looks like

```
AUDIT LOG ENTRY
─────────────────────────────────────────────────────────
Timestamp:    2026-05-19 14:23:47 UTC
Org ID:       org_abc123
User:         jane@zopcloud.com (api_key_xxx)
Method:       POST
Path:         /orgs/org_abc123/overrides
Status:       201 Created
Latency:      87ms

REQUEST BODY:
{
  "target_type": "resource",
  "target_id":   "i-0abc123",
  "override_type": "force_on",
  "reason": "Acme Corp demo Sat 2pm",
  "expires_at": "2026-05-26T08:00:00Z"
}

RESPONSE BODY:
{
  "id": "ov_5678",
  "status": "active",
  "created_at": "2026-05-19T14:23:47Z"
}

REDIS STREAM ID:  org_abc123:1747663427000-0
```

The audit log is rich enough to reconstruct any past mutation. The request body shows what the user asked for; the response shows what ZopNight returned. Both together pinpoint the exact event.

### Sensitive data redaction

Some fields are deliberately redacted before storage:

```
REDACTED FIELDS                                  STORED AS
─────────────────────────────────────────────────────────
Cloud credentials (IAM creds, service account)   [REDACTED]
Webhook URLs (Slack tokens, etc.)                 [REDACTED]
API tokens                                        [REDACTED — last 4 chars only]
Personal information (email partially)            jane***@zopcloud.com
```

The redaction is at storage time, not at view time. There is no way to retrieve the unredacted value through the audit log. This is required for compliance: credentials must never appear in logs.

### Querying the audit log

The Audit Log page exposes filters:

```
FILTERS
─────────────────────────────────────────────────────────
Time range:        [Last 7 days  ▾]    or custom range
Method:            [Any ▾]            POST / PUT / PATCH / DELETE
Resource:          [Any path ▾]        /schedules /overrides /resources etc.
Status:            [Any ▾]            success / failure
User:              [Any user ▾]
Search:            [free-text]         searches request and response bodies

Sort by:           Timestamp (default), latency, status
```

A typical query: "all override creations by jane@zopcloud.com in the last 30 days" — three filters, results in seconds.

### Server-side filtering and pagination

Audit logs are large at scale. The Audit Log page uses server-side filtering and pagination — 50 rows per page by default, with cursor-based pagination for forward/backward.

For programmatic access:

```bash
# Pull last 7 days of override events to JSON
curl -s "https://api.zopnight.com/orgs/{org_id}/audit-logs?method=POST&path=/overrides&from=2026-05-13&to=2026-05-20" \
  -H "Authorization: Bearer ${PAT}" \
  > overrides_last_week.json
```

The same query that the UI runs is available as an API call. Useful for exporting to SIEM, building custom dashboards, or audit evidence collection.

### Common query patterns

```
PATTERN 1: "Who created this schedule?"
  Filter: method=POST, path=/schedules, body.name="business-hours-eu"
  Returns: the create event with user, timestamp, full request body.

PATTERN 2: "All overrides in the last quarter"
  Filter: method=POST, path=/overrides, from=2026-02-01, to=2026-04-30
  Returns: list of all override creations with reason, expiry, target.

PATTERN 3: "Failed actions from yesterday"
  Filter: status>=400, from=2026-05-19, to=2026-05-20
  Returns: every mutating call that returned an error. Useful for debugging.

PATTERN 4: "Changes to the SAML config"
  Filter: path=/saml-config, method=POST OR PUT OR PATCH
  Returns: every SAML config mutation. Audit-relevant.
```

The audit log is a relational queryable surface. The right query gives the right answer in seconds.

### Compliance use

For SOC 2 / ISO 27001 audits, the audit log produces evidence:

```
AUDITOR QUESTION                              EVIDENCE FROM AUDIT LOG
─────────────────────────────────────────────────────────────────────
"Who can create overrides?"                    Query: all override creations
                                                last 12 months. List of users.
"How are SAML config changes controlled?"      Query: SAML config mutations.
                                                Show: which users (Admin only).
"How do you track who started/stopped         Query: manual start/stop events.
 production resources?"                         User, timestamp, justification.
"What's your auditable history of               Query: rotation events for
 credential rotations?"                         cloud accounts. Show monthly.
"Show me 3 examples of approval-gated         Query: auto-remediation events
 changes."                                      with approval. Random sample.
```

Every question maps to a query. Every query returns reproducible evidence. The auditor can run the same queries (with appropriate access) and verify.

### Retention

```
TIER                    RETENTION
─────────────────────────────────
Redis Streams           Real-time, ~1 hour buffer
MySQL primary           Indefinite (organization-controlled)
Export to S3/GCS        Org-configurable for cold storage / SIEM
```

Customers can configure export to cold storage (S3, GCS, customer-controlled) for compliance regulations requiring 7+ year retention. ZopNight does not enforce a retention cap on the primary MySQL store — the customer's organization controls the data lifecycle.

### Performance

The Redis Streams + MySQL design balances real-time visibility with durable storage:

```
WRITE LATENCY            <10ms (Redis Stream)
SYNC TO MySQL             Every 60 seconds
QUERY LATENCY (UI)        <100ms typical
QUERY LATENCY (API)       <500ms with pagination
DATA SIZE                Mid-size org: ~50 MB/month, ~600 MB/year
```

At scale (1,000+ resources, 10,000+ schedule firings per day), the audit log volume grows but stays queryable. Server-side filtering avoids full-table scans.

---

## 2. Demo

A compliance audit walked through:

```
SECURITY ASKS: "How do you control who can rotate cloud account
                credentials? Show me last quarter's rotations."

T+0       Auditor opens the Audit Log page.

T+30 sec  Filter:
            path = /cloud-accounts/*/rotate (or similar)
            method = POST
            from = 2026-02-01
            to = 2026-04-30

T+45 sec  Result: 7 rotation events in the period.

T+1 min   For each event:
            - User who initiated (Admin in all cases — RBAC enforced)
            - Cloud account rotated
            - Timestamp
            - Success status

T+2 min   Click into one event. The full request body shows the new role ARN
          (credential value itself was redacted). The response body confirms
          activation.

T+3 min   Auditor copies the URL of the filtered view + screenshot of the
          7 events. Adds to compliance evidence package.

T+5 min   Compliance evidence collected. Auditor satisfied: rotations are
          Admin-only, audit-logged, with full body context.
```

Five minutes to produce audit evidence that would take hours from raw logs.

(Asset: `assets/diagrams/M1.6_L5_audit_evidence.svg`.)

---

## 3. Hands-on (7 min)

```
1. Open the Audit Log page.
2. Filter to the last 7 days, method=POST.
3. Browse the events — note the diversity of paths (schedules, overrides,
   resources, etc.).
4. Click into one event. Read the request and response body.
5. Try a more specific filter:
   - Filter to your own user (or a sample user)
   - See all your recent mutations
6. Use the search field to find a specific event by name (e.g., search
   for a schedule name).
7. For audit prep: try to answer "Who modified the RBAC role 'Editor'
   in the last 90 days?" via filters.

If the answer is "no one" — that's also useful evidence (no
unauthorized RBAC changes).
```

---

## 4. Knowledge check

### Q1
The Audit Log captures:

A. All actions including reads
B. All mutating actions (POST, PUT, PATCH, DELETE) including request and response bodies. Reads (GET) are NOT logged (volume too high, read access already RBAC-restricted).
C. Only critical actions
D. Only failed actions

<details>
<summary>Show answer</summary>

**Correct: B.** Mutations are the auditable surface. Reads are protected by RBAC at the query level, not by audit-logging every read.
</details>

### Q2
A request body contains a cloud credential. The audit log stores:

A. The full credential value
B. [REDACTED] for the credential field. Other fields in the body are stored unchanged. Sensitive data redaction happens at storage time and is irreversible.
C. The credential, encrypted
D. Nothing about the request

<details>
<summary>Show answer</summary>

**Correct: B.** Credentials are redacted at storage. Required for compliance — credentials must never appear in logs in any form.
</details>

### Q3
A SOC 2 auditor asks: "Show me three examples of approval-gated auto-remediations from last quarter." The Audit Log approach is:

A. Manually inspect every event
B. Filter: path matches auto-remediation, method=POST, body contains approval reference, date range = last quarter. Return random sample of 3. The query produces reproducible evidence in seconds.
C. Generate a custom report
D. Wait for the next audit

<details>
<summary>Show answer</summary>

**Correct: B.** Filter-based queries are the canonical way to produce audit evidence. Reproducible (auditor can re-run) and fast (seconds to results).
</details>

---

## 5. Apply

The audit log surface:

- **[Audit Logs page](https://app.zopnight.com/audit-logs)** — filterable, paginated UI
- **Audit API** — same data, programmatic access
- **Export to S3 / GCS** — org-configurable for cold storage
- **Per-org Redis Streams** — real-time event stream for SIEM integrations

For deeper coverage of audit-as-evidence patterns, see [T3.M3.3](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md) in the Architect track.

---

## Module quiz

You have now completed all five lessons of M1.6 and all 28 lessons of Track 1. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.6-quiz](../../../certifications/operator/m1.6-quiz.md). Pass to earn the **History-Reader** chip.

---

## Track complete — what's next

You have completed Track 1 — ZopNight Operator. Combined with Track 0, you have the working knowledge to use ZopNight day-to-day.

**Take the Operator certification exam.** Free, 20 questions, mixed T0 + T1 coverage, ~30 min, 80% pass. Available at [/certifications/operator](../../../certifications/operator/00_README.md). Pass to earn the **ZopDev Operator** digital badge.

**Or go deeper.** Continue to [Track 2 — ZopNight Engineer](../../T2_zopnight_engineer/00_README.md) for recommendations engine, autoscaling, K8s scheduling, and AI-powered cloud ops via MCP. Or pick a [role-based path](../../../paths/00_README.md) curated for your role.

---

## Related lessons

- [T3.M3.3 — Audit logging deep dive (Architect tier)](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)
- [T1 — full track](../00_README.md)

## Glossary terms touched

[Audit log](../../../reference/glossary/audit-log.md) · [Request body capture](../../../reference/glossary/request-body-capture.md) · [Response body capture](../../../reference/glossary/response-body-capture.md) · [Redacted field](../../../reference/glossary/redacted-field.md) · [SIEM integration](../../../reference/glossary/siem-integration.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.6.L5
