# Audit logging for MCP

§ T6 · M6.3 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** MCP audit logs to track usage, **construct** common audit queries (compliance, forensics, abuse detection), **and wire** anomaly alerts to your SIEM.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Know who used which MCP tools for what, with the audit trail required for compliance and forensics." |
| **Personas** | Security/Compliance · FinOps Lead · SRE |
| **Prerequisites** | M6.3.L1 (PAT) · M6.3.L2 (org toggle) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Construct (Apply), Wire (Apply) |

---

## 1. Concept

Every MCP tool call is logged in ZopNight's audit log — the same audit infrastructure used for UI clicks and API calls. This gives unified visibility: who accessed what, when, via which AI tool, and what result was returned.

```
AUDIT LOG ENTRY for an MCP call:
  Timestamp:    2026-05-21T14:32:00Z
  User:         jane@platform
  PAT ID:       pat_abc123 (not the secret)
  PAT description: "Cursor on jane-mbp 2026-Q2"
  Source:       cursor / claude-code / claude-desktop / unknown
  Tool:         list_idle_resources
  Filters:      {region: us-east-1, sort: idle_days}
  Response:     12 resources returned
  Latency:      340 ms
  Status:       success
```

The audit log is the foundation of compliance + forensics + abuse detection for MCP usage.

### Why this matters

```
COMPLIANCE:
  "Show me everything jane@platform did via MCP in May 2026."
  → Single audit query, returns full history with timestamps,
    tools called, filters applied, response sizes.

INCIDENT FORENSICS:
  "Did anyone read prod-payments cost data last week?"
  → Audit log shows who, when, via which tool, with what filters.

ABUSE DETECTION:
  Spikes in tool call rate → possible misuse or stolen PAT
  Tool used outside business hours → possible compromise
  Audit log feeds detection rules in your SIEM.

CAPACITY PLANNING:
  Which MCP tools are most-used?
  Which engineers rely on MCP most?
  Useful for both ZopNight + customer engineering leadership.
```

### Reading audit logs

```
ZOPNIGHT UI:
  Settings → Audit → MCP filter
  Filter by user, tool, date range, status, source
  Export to CSV / JSON
  
API:
  GET /v1/audit/logs?source=mcp&user=jane@platform&time>=2026-05-01
  Returns paginated JSON
  
DOWNSTREAM (recommended for compliance):
  Stream to your SIEM via ZopNight's audit export
  Splunk / Datadog / Sumo Logic / Elastic
```

### What's logged (in detail)

```
INCLUDED in every MCP audit entry:
  User identity (email + UID)
  PAT used (ID, not the secret)
  PAT description (helpful for device identification)
  Tool called (e.g., list_idle_resources)
  Filter parameters (input)
  Response size (count or bytes, depending on tool)
  Latency
  Status (success / error / unauthorized)
  Source (which AI tool initiated)
  Client IP / region (if available)

NOT INCLUDED by default:
  Full response body (sensitive cost data)
  The LLM's prompt or conversation context
  Engineer's intent ("I asked the agent to find waste")
```

You see the **tool calls** the agent made; you don't see what the engineer asked the LLM. This balance preserves privacy + audit utility.

### Optional — full response logging

Some orgs need to capture full response bodies for compliance:

```
Settings → Audit → MCP → Log full responses: ON

EFFECTS:
  Increases audit log volume 10-50× (response body is most of the entry)
  Cost data is in logs (storage cost increases; security posture for the
  log store must match the data sensitivity)
  Useful for: forensics after a compromise; some regulatory environments

WARNING:
  Default OFF for most customers
  Turn ON only with intentional security planning
```

### Audit log retention

```
DEFAULT:  90 days
EXTENDED: 1 year (Enterprise plan)
EXPORT:   continuous stream to your SIEM for long-term retention

For SOC 2 / regulatory: configure SIEM export to your audit destination.
```

For 7-year or longer retention, SIEM is the right path (storage cost outside ZopNight).

### Common audit queries

```
QUERY 1: "Top 10 most-called tools last week"
  Filter:  source=mcp, time>=7d
  Group:   tool
  Sort:    count desc, limit 10
  Use:     Understand which workflows are popular; informs recipe
           library prioritization (M6.4).

QUERY 2: "Failed MCP calls in last 24 hours"
  Filter:  source=mcp, status=error, time>=24h
  Use:     Detect issues (PAT expired? Tool deprecated?), problems,
           potential attacks.

QUERY 3: "User X's MCP activity in May 2026"
  Filter:  source=mcp, user=jane@platform, time>=2026-05-01
  Use:     Compliance review; "show me what user X did" requests.

QUERY 4: "Unusual unfiltered tool calls"
  Filter:  tool=list_resources, no filter params (or wildcard)
  Use:     Detect data dumps / exfiltration attempts.

QUERY 5: "Audit log access via MCP"
  Filter:  tool=list_audit_logs
  Use:     Meta-audit; who's looking at the audit logs themselves.

QUERY 6: "PAT used from new IP / country"
  Filter:  source=mcp, client_ip NOT IN (known_ips)
  Use:     Geographic anomaly detection.
```

### Alerting on anomalies

Wire these signals to your SIEM:

```
RECOMMENDED ALERTS:
  PAT used from new IP / country
  100+ MCP calls in 1 minute (rate spike)
  Tool calls outside business hours (e.g., 3 AM local)
  User uses tool they've never used (new behavior pattern)
  PAT used after the user was deprovisioned (this should never happen)
  Large unfiltered queries (potential exfiltration)
  Audit log access via MCP (meta-recon)
```

These map to common attack patterns. Investing in alerting once pays off for years.

### What an attacker with a stolen PAT does

```
ATTACKER PROFILE (hypothetical, but well-documented in the wild):

  Initial recon:
    list_cloud_accounts (what clouds are connected)
    list_resources (what's there)
    list_audit_logs (what's been done; security posture)
    
  Mid-attack:
    Large get_costs queries (info gathering for blackmail / ransom)
    Search for high-value data patterns
    
  Detection signals (all visible in audit log if you're watching):
    Unusual hour (3 AM local)
    Large unfiltered queries
    First-time tool usage from this PAT
    Geographic anomaly
    Rate spike

If your SIEM has these rules wired, the attack is detectable in
minutes, not days.
```

### Compliance reports

Quarterly MCP usage report for compliance review:

```
ZopNight Q2 2026 MCP Audit Summary
─────────────────────────────────────────────────────────────────
Total MCP calls:        12,400
Unique users:            23
Tool diversity:           38 of 43 tools used
Failed calls:            47 (0.4%)
Outliers detected:       2 (both benign — investigated and documented)
PATs rotated:           18 (per quarterly policy)
Toggle state:            Enabled (no outages)
Avg latency:             450 ms

REVIEWED BY:  CISO, FinOps Lead, Compliance Officer
SIGNED:       2026-07-15
```

ZopNight provides this as an exportable template; customer customizes for their specific compliance frameworks.

---

## 2. Demo

A weekly MCP review by the FinOps team:

```
WEEKLY MCP REVIEW (every Monday, 10 minutes):

T+0     OPEN ZopNight → Audit → MCP filter, last 7 days

T+1 min INSIGHTS visible:
        1,200 MCP calls across 18 users (healthy adoption)
        Top tool: get_recommendation_summary (200 calls, 17% of total)
        1 PAT used from new IP (verified: engineer working from home)
        3 failed calls (all PAT-expired; user re-rotated successfully)
        No suspicious patterns

T+3 min DRILL into anomalies:
        New-IP usage:
          User: alice@platform
          IP: 198.51.100.XX (residential ISP)
          Calls: normal pattern, just from different IP
          Decision: legitimate (alice WFH); document, no action

T+5 min ACTION ITEMS:
        Educate alice on documenting new-location usage
        (avoids future flagging on the daily alerting)
        Update PAT-rotation runbook to mention WFH pattern

T+8 min DOCUMENT the review (audit log of the audit log):
        Brief Slack post to #finops-leadership:
          "Weekly MCP review: 1.2K calls, 18 users, no incidents.
           Minor flagging on alice@platform from new IP (WFH;
           legitimate). Next review: 2026-05-28."

ELAPSED: 8 minutes; signature on quarterly compliance report.
```

The weekly review keeps anomalies visible; the quarterly report consolidates for compliance.

---

## 3. Hands-on (5 min)

Open your ZopNight audit log:

```
□ Filter to source=mcp, last 7 days
□ Note: total call count, unique users, top tools

INSIGHTS:
  Total calls last 7 days: _____
  Unique users: _____
  Top 3 tools by call count:
    1. __________  count: _____
    2. __________  count: _____
    3. __________  count: _____

ANY ANOMALIES?
  New IPs?              Yes / No
  Off-hours usage?      Yes / No
  Failed call cluster?  Yes / No
  Tool diversity spike? Yes / No

WIRED TO SIEM?
  □ Yes — what alert rules?
  □ No — plan to wire? __________

WEEKLY REVIEW scheduled?
  □ Yes — frequency: __________
  □ No — plan to start
```

If you don't have a weekly MCP review yet, this is a 10-minute habit worth establishing.

---

## 4. Knowledge check

### Q1
MCP audit log captures:

A. The engineer's full chat with the LLM
B. Tool calls + filters + response metadata + status + user identity + PAT used. Not the LLM conversation or the engineer's prompt. The balance: see what the agent did; preserve the privacy of how the engineer phrased it.
C. Random
D. Nothing useful

<details>
<summary>Show answer</summary>

**Correct: B.** Tool calls, not chat. Audit-utility + privacy balance.
</details>

### Q2
Anomaly detection on MCP usage:

A. Not possible
B. Yes — unusual times, new IPs, never-used tools, rate spikes, large unfiltered queries, post-deprovisioning usage. Wire to your SIEM with these rules; investigate matches. Each maps to a known attack pattern.
C. Auto-blocks suspicious activity
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Detectable patterns. SIEM wiring is the implementation.
</details>

### Q3
MCP audit log retention by default:

A. Forever
B. 90 days; Enterprise plan extends to 1 year; SIEM export for longer (7+ years for some regulated industries). Configure the retention in Settings → Audit → MCP.
C. 1 day
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 90 days default; extend via Enterprise or SIEM.
</details>

---

## 5. Apply

Weekly MCP audit review (10 minutes). SIEM export for long-term retention. Alert on the documented anomalies. Quarterly compliance report.

For incidents: the audit log is the forensics tool. Filter to source=mcp; reconstruct what the actor did.

---

## Related lessons

- [L1 — PAT basics](L1_pat_basics.md)
- [L2 — Org-level toggle](L2_org_toggle.md)
- [L4 — PAT rotation](L4_rotation.md) *(next)*
- [T3.M3.3 — Audit logging fundamentals](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[MCP audit log](../../../reference/glossary/mcp-audit-log.md) · [SIEM export](../../../reference/glossary/siem-export.md) · [Anomaly detection](../../../reference/glossary/anomaly-detection.md) · [Full response logging](../../../reference/glossary/full-response-logging.md) · [Meta-audit](../../../reference/glossary/meta-audit.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.3.L3
