# Request and response body capture

§ T3 · M3.3 · L2 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** a captured request/response body in the audit log, **predict** what will be redacted vs preserved, **and decide** when to override body-capture defaults for cost or residency reasons.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Use the audit log to reconstruct exactly what happened, without needing to ask the person who did it." |
| **Personas** | Security/Compliance · Platform Engineer · SRE / On-call |
| **Prerequisites** | M3.3.L1 — What gets logged |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Predict (Analyze), Decide (Evaluate) |

---

## 1. Concept

The audit log's body-capture mode is what turns "we have logs" into "we can investigate." For every mutating API call, ZopNight stores the **full request body and full response body** alongside the standard metadata (timestamp, user, path, status). This is the difference between "user X created a schedule on May 20" (low-value) and "user X created a schedule named business-hours-eu with these specific crons on these specific resources" (forensically complete).

```
WHAT'S CAPTURED                  EXAMPLE
──────────────────────────────────────────────────────────
Request body                     The JSON payload posted to the API
Response body                    The JSON response returned
Selected headers                 user_agent, ip_address, content_type
Query parameters                 ?account_id=…, ?status=…
```

Body capture is the default. It can be disabled at the org level (Settings → Audit → Body capture: Off), but the default is on because the forensic value usually exceeds the storage cost.

### Sensitive-data redaction

Before any body is written to the audit log, a redaction middleware scans for known-sensitive fields and replaces them with `[REDACTED]` (or a partial-mask equivalent). The redaction is at storage time and is **irreversible** — the unredacted value never reaches the log.

```
REDACTED FIELDS                          STORED AS
──────────────────────────────────────────────────────────────────
Cloud credentials (secret keys)          [REDACTED]
OAuth client secrets                     [REDACTED]
Webhook URLs (often contain secrets)     [REDACTED]
PAT values on creation                   ***  (PAT ID + description
                                         stored, never the secret)
Personal email (partial mask in some     jane***@example.com
contexts where minimization required)
Cloud account 12-digit numbers           ****-****-****
GCP project IDs (where org-policy is     [project-id]
configured to minimize)
Subscription IDs                         ****-****-****
```

The redaction list is maintained by ZopNight engineering and is conservative by default. Customers can add additional redactions via org policy (Settings → Audit → Redaction policy → custom fields).

### Why redaction matters

Three reasons converge:

```
SECURITY        Sensitive credentials never persist in the audit log.
                If the audit log itself is ever exposed (export to
                a misconfigured SIEM, for example), there are no
                long-lived credentials to leak.

COMPLIANCE      GDPR, CCPA, and similar regulations require data
                minimization. Storing credentials in audit logs
                without justification is a compliance finding.
                Redaction is the practical answer.

INCIDENT        If the audit log were itself the source of a breach,
                RESPONSE redaction limits the blast radius. Defense
                in depth: do not turn one log into a credential dump.
```

The trade-off: some debugging info is lost. If you need to know "which exact credential was rotated," the audit log tells you "credential X was rotated" but not the value. The value is in the cloud-account record (now updated); the audit captures the *event*, not the *secret*. This is the right balance.

### Body size limits

```
MAX REQUEST BODY    64 KB (default)
MAX RESPONSE BODY   128 KB (default)
```

For payloads larger than these limits, the body is truncated and a marker `[BODY TRUNCATED — original size 184 KB]` is added at the truncation point. The first 64 KB (or 128 KB) is preserved. This catches the rare case of a very large bulk-import payload without letting one outlier inflate the audit storage.

In practice, ZopNight's API payloads are well under these limits — most mutations are under 4 KB. Truncation events average less than 0.01% of audit entries across customers.

### Reading a captured body

The Audit Log UI shows captured bodies inline. Click any audit entry and the request + response bodies render as syntax-highlighted JSON. The API returns the same data via the `body` and `response_body` fields.

```
AUDIT LOG ENTRY (POST /orgs/.../schedules)
─────────────────────────────────────────────────────────
Method:    POST
Path:      /orgs/org_abc123/schedules
Status:    201 Created

REQUEST BODY:
  {
    "name": "business-hours-staging",
    "timezone": "America/New_York",
    "crons": [
      {"expression": "0 8 * * 1-5", "action": "start"},
      {"expression": "0 20 * * 1-5", "action": "stop"}
    ],
    "resource_group_id": "rg_staging"
  }

RESPONSE BODY:
  {
    "id": "sch_xyz789",
    "name": "business-hours-staging",
    "created_at": "2026-05-20T16:42:11Z",
    "resource_count": 7
  }
```

The response body's `id` is the handle for tracing follow-up events on the same schedule. Filter the audit log on `sch_xyz789` to find every subsequent mutation against this schedule.

### Forensic use cases

The patterns that recur:

```
QUESTION                                  AUDIT-LOG QUERY
──────────────────────────────────────────────────────────────────
"Who last changed this schedule?"          path = .../schedules/<id>
                                          method = PUT or PATCH
                                          → most recent entry, with user
                                          
"What was the schedule like before?"      Same query as above; the
                                          captured request body is the
                                          new value; previous values are
                                          in earlier entries (compare)
                                          
"Why did the schedule stop firing?"        path contains the schedule_id
                                          look for PATCH on cron expr
                                          
"Who deleted resource X?"                  method = DELETE; path matches
                                          → user + timestamp
                                          
"What did this failed API call look like?" status >= 400; user_id = …
                                          → error context

"Reproduce a customer's issue"             user_id = customer
                                          recent actions in time window
```

The combination of mutations-only logging + body capture is what makes these queries productive. Without body capture, you would know an event happened but not its details. With it, the audit log doubles as a state-change history.

### When to disable body capture

A small population of orgs disables body capture. Reasons:

```
REASON                                      MITIGATION
──────────────────────────────────────────────────────────────────
Audit storage cost is too high              Configure retention
(very high mutation volume)                 cutoff (90 days vs forever);
                                            export old entries to SIEM
                                            before truncation
                                            
Data-residency requires that no payload     Body capture off + use
data leave a specific region                 metadata-only mode
                                            
Customer policy requires no payload         Body capture off
storage                                     
```

Most orgs leave body capture on. Even at high mutation volumes, the storage cost is modest relative to the forensic value.

### How ZopNight uses body capture

Body capture is implemented at the audit middleware layer, after the request is parsed but before the response leaves the gateway. The middleware deep-copies the parsed JSON, runs the redaction pass, applies size limits, and writes to Redis Stream. The middleware is shared across all backend services so every mutation is captured uniformly — no per-service code needed.

---

## 2. Demo

A real-feeling forensic investigation:

```
USER reports: "My staging schedule stopped firing on May 15."

INVESTIGATION via Audit Log:

T+0       Open Audit Log
          Filter: path contains "sch_xyz789", method in [PUT, PATCH, DELETE]
          
T+30 sec  Found entry on 2026-05-15T14:23:17Z:
            User:    peter@example.com
            Method:  PATCH
            Path:    /orgs/.../schedules/sch_xyz789
            Status:  200 OK
          
T+45 sec  Click the entry. REQUEST BODY:
            {
              "crons": [
                {"expression": "0 8 * * 1-5", "action": "start"},
                {"expression": "0 30 * * *",  "action": "stop"}   ← here
              ]
            }
          
T+1 min   Compare to the previous entry (creation):
            second cron was "0 20 * * 1-5" (Mon-Fri 20:00)
            now it's "0 30 * * *" (every day at 00:30)
          
          Peter accidentally edited the cron and broke the schedule.
          The captured body confirms exactly what changed.

T+2 min   Revert via UI; message Peter; document the lesson.

ELAPSED:  ~10 minutes from question to root cause + fix.
```

Without body capture, the audit log would say "Peter PATCHed sch_xyz789 on May 15." The investigation would require finding Peter, asking what he changed, hoping he remembers. With body capture, the change is in the log.

---

## 3. Hands-on (5 min)

Pick one mutation from your audit log and read it end-to-end:

```
PICK an audit entry from the last 30 days. Capture:

Timestamp:    __________
User:         __________
Method+path:  __________
Status:       __________

REQUEST BODY (paste a small portion):
  __________________________________________________________
  __________________________________________________________

RESPONSE BODY (paste a small portion):
  __________________________________________________________

REDACTED FIELDS observed (if any):
  __________

This is the exact form an auditor or incident responder would see.
```

If your team has been using body-capture mode without realizing it, this exercise often surprises people with how much detail is preserved.

---

## 4. Knowledge check

### Q1
A request body contains a cloud credential. The audit log stores:

A. The full credential — needed for forensics
B. `[REDACTED]` in place of the credential field; other fields stored unchanged. Redaction happens at the middleware before storage and is irreversible. The cloud credential itself is in the encrypted cloud-account record, not in the audit log.
C. Encrypted credential
D. Random masking

<details>
<summary>Show answer</summary>

**Correct: B.** Redaction at storage time is irreversible by design. Audit logs should never become a credential-leak vector.
</details>

### Q2
A request body of 200 KB is sent. What lands in the audit log?

A. The full 200 KB
B. The first 64 KB plus a `[BODY TRUNCATED — original size 200 KB]` marker. The truncation marker is itself part of the audit entry, so an investigator knows the body was larger than what's shown.
C. Rejected at the gateway
D. Random sampling

<details>
<summary>Show answer</summary>

**Correct: B.** Truncation with explicit marker preserves the most-useful prefix without letting outlier payloads inflate storage.
</details>

### Q3
Body capture applies to GET requests:

A. Yes, with the same redaction
B. No — body capture only applies to mutations (POST/PUT/PATCH/DELETE). GETs are not logged at all (except failed/denied reads). The capture middleware short-circuits on GET methods.
C. Only successful GETs
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Mutations-only is the canonical scope. Body capture inherits this scope; GETs are excluded entirely.
</details>

---

## 5. Apply

Click any audit-log entry in [Settings → Audit Log](https://app.zopnight.com/settings/audit-log) to read the full body. The API endpoint [`/v1/audit/logs/{id}`](https://docs.zopnight.com/api/audit) returns the same data including `body` and `response_body` fields.

For forensic playbooks, save a few common queries as bookmarks: "who changed this schedule" (path contains, method PUT/PATCH), "all DELETEs last 7 days" (method DELETE, time filter), "all failed mutations" (status >= 400). These three queries cover most ad-hoc investigations.

---

## Related lessons

- [L1 — What gets logged](L1_what_logged.md)
- [L3 — Filtering and export](L3_filter_export.md) *(next)*
- [L4 — Compliance posture](L4_compliance.md)
- [T3.M3.1.L1 — The 15-entity policy table](../M3.1_rbac/L1_policy_table.md)

## Glossary terms touched

[Body capture](../../../reference/glossary/body-capture.md) · [Redaction](../../../reference/glossary/redaction.md) · [Truncation marker](../../../reference/glossary/truncation-marker.md) · [Forensic query](../../../reference/glossary/forensic-query.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.3.L2
