# Audit as compliance evidence

§ T3 · M3.3 · L4 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **map** ZopNight audit-log queries to specific SOC 2 and ISO 27001 controls, **collect** reproducible evidence on demand, **and recognize** the boundary between what the audit log proves and what supplementary evidence is needed.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Walk into an audit conversation with reproducible queries that satisfy the auditor in one sitting." |
| **Personas** | Security/Compliance · Platform Engineer · FinOps Lead |
| **Prerequisites** | M3.3.L1-L3 (audit log structure + querying) |
| **Time** | 9 minutes |
| **Bloom verb** | Map (Apply), Collect (Apply), Recognize (Analyze) |

---

## 1. Concept

Compliance frameworks describe **controls** — policies and procedures the organization claims to operate. An audit verifies that the controls actually operate. The audit log's job is to provide **reproducible evidence** that ZopNight-mediated controls (RBAC, SSO, cloud-account credential management, change tracking) are operating as claimed. Each control maps to one or more audit-log queries; running the query in front of the auditor is the evidence.

The discipline is not in collecting evidence at audit time — it is in knowing the queries in advance so you can run them on demand without scrambling.

### SOC 2 Common Criteria mapping

```
CONTROL                                    AUDIT-LOG QUERY
──────────────────────────────────────────────────────────────────
CC1.1 — Demonstrates commitment to         path matches /roles or
        integrity and ethical values;       /users or /teams; method
        management of changes to access     in [POST,PUT,PATCH,DELETE];
        controls                            time = 12 months
                                            → every RBAC change with
                                            who, when, what
                                            
CC1.2 — Authentication                     path contains /auth/;
                                            time = 12 months
                                            → every login attempt
                                            (successes + failures)
                                            
CC1.3 — User account creation               path = /users; method = POST;
                                            time = 12 months
                                            → every user provisioning,
                                            with role + scope at creation

CC2.1 — Logical access controls             Combined: RBAC config snapshot
        operate                              + audit log of changes
                                            → roles existed, were
                                            assigned, and changed via
                                            documented process
                                            
CC2.2 — Network security                    path = /saml-config or /sso;
        configuration changes               method ≠ GET; time = 12mo
                                            → SSO config history
                                            
CC6.1 — Restriction of access to            path = /roles; method ≠ GET;
        information                         time = 12mo
                                            → role definitions changed
                                            only via authorized process
                                            
CC7.2 — Detection of anomalies              path contains /auth/;
                                            status = 401; time = window
                                            → failed login attempts
                                            (anomaly detection input)
                                            
CC8.1 — Change management                   path = /schedules, /budgets,
                                            /resource-groups, etc.;
                                            method ≠ GET; time = window
                                            → operational change log
```

### ISO 27001 Annex A mapping

```
ANNEX                                      AUDIT-LOG QUERY
──────────────────────────────────────────────────────────────────
A.9 — Access Control                       Same as SOC 2 CC1.x + CC2.x
                                           covering user provisioning,
                                           role assignment, and SSO

A.12 — Operations Security                  Any mutation across resources,
                                           schedules, recommendations,
                                           cloud-accounts; time = window

A.16 — Information security incident       Audit-log entries with
       management                          status >= 400 + cross-ref to
                                           incident tickets

A.18 — Compliance                          The audit log itself is
                                           evidence that the controls
                                           operate continuously
```

### Evidence collection workflow

The pattern that works:

```
1. AUDITOR ASKS:
   "How do you control who can revoke cloud-account credentials?"

2. YOU ANSWER:
   "Only Admin role has cloud-account:delete. The audit log records
   every revocation. Let me show you."

3. YOU RUN THE QUERY (in ZopNight):
   path contains /cloud-accounts and "revoke"
   method = POST
   time = last 12 months

4. RESULT:
   List of every credential revocation event. Each shows:
   timestamp, user, source IP, target account, success/failure.

5. AUDITOR REVIEWS A SAMPLE:
   Click 3-5 events. The captured body confirms the action.
   The user's role at the time is part of the audit entry context.

6. EVIDENCE COLLECTED:
   Screenshot the filtered view + a few event details.
   Attach the export to the evidence package.

7. AUDITOR CAN REPRODUCE:
   If they have read access to the audit log themselves
   (a configured Auditor role), they re-run the query.
```

Reproducibility is the gold standard. An auditor who can re-run the query in real-time is far more satisfied than one who has to trust a screenshot.

### What the audit log CANNOT prove

Knowing the limits is as important as knowing what works:

```
NOT EVIDENCE FROM AUDIT LOG               ALTERNATE EVIDENCE
──────────────────────────────────────────────────────────────────
WHY a change was made (intent)             Slack thread, ticket
                                          comment, change request
                                          
Manual processes outside ZopNight          Process docs + ticketing
                                          system audit trails
                                          
Cloud-side actions performed in            Cloud-side audit logs
cloud provider's own console               (AWS CloudTrail, GCP Audit
                                          Logs, Azure Activity Log)
                                          
Conversations during an incident           Incident ticket transcripts,
                                          recorded meetings
                                          
Effectiveness of a control                 Test results, exception
                                          tracking, KPI dashboards
```

Compliance audits assemble evidence from multiple sources. ZopNight's audit log covers the user-API-mediated controls; supplementary evidence covers the rest.

### Retention for compliance

```
FRAMEWORK / INDUSTRY              TYPICAL RETENTION         WHERE
──────────────────────────────────────────────────────────────────
SOC 2 Type II                     1 year minimum            ZopNight MySQL
                                                            (default)
ISO 27001                         3 years typical            ZopNight MySQL
                                                            or SIEM export
PCI DSS                           1 year online + 1 yr      ZopNight + S3
                                  archive                   cold storage
HIPAA                             6 years                    ZopNight + SIEM
                                                            with long-term
                                                            retention
Financial services (FINRA,        7 years (sometimes        SIEM with
SEC, FINMA, MAS)                  longer for trade)         WORM storage
```

ZopNight's primary store supports indefinite retention; cost-aware orgs configure a retention cutoff and export aged entries to S3/GCS or to a SIEM with long-term retention. ZopNight's retention policy (Settings → Audit → Retention) handles the trimming and the export window in one config.

### Audit log integrity

For the audit log to serve as compliance evidence, the log itself must be tamper-resistant.

```
INTEGRITY GUARANTEES                       MECHANISM
──────────────────────────────────────────────────────────────────
Append-only                                 MySQL audit table has no
                                           UPDATE permission for any
                                           role; INSERT-only
                                           
No user-driven DELETE                       DELETE permitted only by
                                           the retention worker
                                           (system-level, not user-
                                           initiated)
                                           
Tamper detection                            Each entry has a hash
                                           chained to the previous;
                                           verification on export
                                           
Redis Streams append-only                   Stream entries cannot be
                                           modified once written;
                                           trimmed only after MySQL
                                           commit
                                           
Audit log access is itself audited          Reads of audit log via API
                                           are logged (a meta-audit)
```

When an auditor asks "how do we know the audit log itself hasn't been tampered with," the answers are: append-only schema, hash chain, no user DELETE path, meta-audit of reads. ZopNight provides a documented integrity statement in [docs.zopnight.com/security/audit-integrity](https://docs.zopnight.com/security/audit-integrity).

### How ZopNight uses compliance reports

Pre-built compliance evidence packages live in [Settings → Compliance Reports](https://app.zopnight.com/settings/compliance). One click generates a CSV/JSON bundle for a specific framework + time window. Internally, each report is just a saved-search + export, but the framing as "SOC 2 Type II evidence package" reduces the cognitive load during an audit.

```
PRE-BUILT REPORTS                          CONTENT
──────────────────────────────────────────────────────────────────
SOC 2 Type II (last 12 months)              RBAC changes, auth events,
                                            cloud-account mgmt, change
                                            log — bundled
                                            
ISO 27001 (last 12 months)                  Same data, ISO-framed
                                            categorization
                                            
Quarterly RBAC review                       Role/user/team changes
                                            for the quarter
                                            
Monthly access review                       New users, role changes,
                                            departures
```

The reports are useful even outside audit season — quarterly RBAC review surfaces drift before it becomes a finding.

---

## 2. Demo

A real-feeling SOC 2 Type II evidence collection:

```
AUDITOR REQUEST:
  "Show me 5 examples of cloud-account credential rotations from
  the past 12 months. For each, identify who performed the rotation
  and confirm they had Admin role at the time."

ZOPNIGHT USER:
  T+0      Open Audit Log
  T+30 s   Filter: method = POST, path contains "/cloud-accounts"
           AND "/rotate", time = 12 months
  T+45 s   Result: 23 rotations across the year
  T+1 min  Click "Export" → CSV
  T+2 min  Open CSV; pick 5 random samples
  T+3 min  For each: click in UI, view full body
  T+5 min  For each: confirm user had Admin role at the time
           (Settings → Users → user detail → role history)
  T+8 min  Screenshot the 5 events + the role-history confirmations
  T+10 min Attach the CSV + screenshots to the audit evidence package
  
SUBMIT to auditor. Audit conversation continues.

ELAPSED: 10 minutes. Reproducible at any time.
```

---

## 3. Hands-on (5 min)

Pick one compliance control your org handles (SOC 2 CC1.x, ISO A.9, internal control, anything). Map it to an audit-log query:

```
CONTROL FRAMEWORK + ID:    __________
CONTROL DESCRIPTION:       __________

AUDIT-LOG QUERY THAT PRODUCES EVIDENCE:
  Filter: __________________________________________________________
  Time window: __________
  Expected result shape: __________

RUN THE QUERY now. Result count: _____

SUPPLEMENTARY EVIDENCE NEEDED (if any):
  □ Documented process / runbook
  □ Ticketing system entries
  □ Cloud-side audit log
  □ None — audit log alone proves the control

NEXT AUDIT DATE: __________
QUERY OWNER (who runs it for the audit): __________
```

If you cannot map a control to a query, that is a real gap — either the control is not actually mediated by ZopNight (it lives elsewhere), or it is, and you need a query that did not exist before.

---

## 4. Knowledge check

### Q1
A SOC 2 auditor asks "Show me 3 examples of approval-gated remediations." The audit log can:

A. Not help — approvals are out of scope
B. Filter `path` contains `/remediations/.../approve`, method = POST. Return any sample of 3 from the result set. Each entry shows the user, the action, the resource, the response — reproducible evidence the auditor can re-run.
C. Only show that it happened, not the details
D. Only show via cloud audit logs

<details>
<summary>Show answer</summary>

**Correct: B.** Direct query produces direct evidence. The auditor can re-run the query (with read access) for reproducibility.
</details>

### Q2
The audit log captures decisions and the reasoning behind them:

A. Yes, with explicit "reason" field on every entry
B. No — the audit log captures *what* happened (the API calls). The *why* (intent, deliberation, judgment) lives in supplementary sources: Slack threads, ticket comments, change requests. Compliance evidence usually requires combining both.
C. Only for high-risk actions
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** What, not why. Compliance audits assemble evidence from multiple sources — the audit log is one input.
</details>

### Q3
For a financial-services org with a 7-year retention requirement:

A. The default 1-year retention is sufficient
B. Configure long-term retention. ZopNight's primary store supports indefinite retention; cost-aware orgs configure a retention cutoff and export aged entries to S3/GCS or to a SIEM with long-term storage. WORM storage is sometimes required for financial frameworks.
C. Cannot be done in ZopNight
D. Use cloud-side audit only

<details>
<summary>Show answer</summary>

**Correct: B.** Long retention is configurable. The choice between in-place retention (simple, more storage cost) and SIEM export (more setup, often cheaper at year+ horizons) depends on the org.
</details>

---

## 5. Apply

Pre-built compliance reports live at [Settings → Compliance Reports](https://app.zopnight.com/settings/compliance) — one-click generation for SOC 2, ISO 27001, quarterly RBAC review, and others. For framework-specific needs, build saved searches that match each control mapping.

Schedule a quarterly internal review of the compliance reports — not just at audit time. Drift between expected and actual control evidence is much easier to fix in a quarter than during an active audit.

---

## Related lessons

- [L1 — What gets logged](L1_what_logged.md)
- [L2 — Body capture trade-offs](L2_body_capture.md)
- [L3 — Filtering and export](L3_filter_export.md)
- [T3.M3.1.L1 — The 15-entity policy table](../M3.1_rbac/L1_policy_table.md)
- [T3.M3.4.L4 — Cross-account isolation vs rollup](../M3.4_multi_account/L4_rollup_vs_isolation.md)

## Glossary terms touched

[SOC 2](../../../reference/glossary/soc-2.md) · [ISO 27001](../../../reference/glossary/iso-27001.md) · [Control mapping](../../../reference/glossary/control-mapping.md) · [Audit-log integrity](../../../reference/glossary/audit-log-integrity.md) · [WORM storage](../../../reference/glossary/worm-storage.md)

---

## Module quiz

Complete M3.3 → 10-question module quiz unlocks the **Audit-Master** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.3.L4
