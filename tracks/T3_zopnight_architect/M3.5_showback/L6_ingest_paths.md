# Push, pull, CSV ingest

§ T3 · M3.5 · L6 of 6 · Architect tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **choose** the right ingest path for unit-metric data, **configure** each path correctly, **and reason** about the SSRF guard on Pull API.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Pick an ingest path that matches the customer's data pipeline shape, not just the default." |
| **Personas** | Platform Engineer · FinOps Lead · Data Engineer |
| **Prerequisites** | M3.5.L5 — Unit economics |
| **Time** | 8 minutes |
| **Bloom verb** | Choose (Evaluate), Configure (Apply), Reason (Analyze) |

---

## 1. Concept

Three paths exist for getting unit-metric values into ZopNight. Each fits a different customer-side architecture:

```
PATH         WHO INITIATES         WHEN TO PICK
──────────────────────────────────────────────────────────────────
PUSH API     Customer's pipeline   Real-time pipeline; daily cadence;
             pushes to ZopNight    multiple metrics
                                   
CSV UPLOAD   Customer uploads      Historical backfill; manual /
             file via UI or API    batched analytics; small teams
                                   without dev resources
                                   
PULL API     ZopNight pulls from   Customer wants central control;
             customer's endpoint    compliance / governance reasons;
                                   service-oriented architecture
```

The choice is one-time per metric; switching paths later is supported but adds friction (historical data may need re-import).

### When to pick each

```
PUSH API fits when:
  - Customer has an existing pipeline that already produces daily
    aggregates (analytics platforms, data warehouses)
  - Real-time or near-real-time freshness is desired
  - Multiple metrics need to land (one POST per metric per day)
  - Customer's team is comfortable maintaining the push integration

CSV UPLOAD fits when:
  - Initial historical backfill (covers months/years of past data)
  - Small organization without dev resources to build a pipeline
  - Manual analytics (someone runs a query monthly, exports CSV,
    uploads)
  - Periodic batch (quarterly, monthly) updates

PULL API fits when:
  - Customer wants ZopNight to fetch from their canonical endpoint
  - Compliance: data does not leave customer's perimeter except on
    request
  - Customer has a data API that other consumers also use
  - Customer doesn't want to maintain push code; would rather expose
    a read endpoint
```

In practice: most customers start with CSV for backfill, then Push API for ongoing. A minority prefer Pull API for governance reasons.

### Push API details

```
ENDPOINT: POST /orgs/{orgID}/unit-metric-values/{metric_id}
AUTH:     PAT or API key in Authorization header
BODY:     JSON array
            [{"date": "2026-05-20", "value": 5000},
             {"date": "2026-05-21", "value": 5012},
             ...]

VALIDATION:
  Date format:    ISO 8601 (YYYY-MM-DD); UTC implied
  Value:          numeric, non-negative
  Cap:            5,000 rows per request
  Rate limit:     1 request per second per metric
  
IDEMPOTENCY:
  Same date + same value: no-op
  Same date + different value: update (with audit log entry)
  Implications: idempotent retries are safe; updates are visible
                in audit log
```

For high-volume metrics (per-hour, per-region), submit multiple POSTs sequentially rather than one huge batch. The 5,000-row cap protects ZopNight's ingest path from outliers.

### CSV upload details

```
ENDPOINT: POST /orgs/{orgID}/unit-metric-values/{metric_id}/csv
AUTH:     PAT
BODY:     multipart CSV

FORMAT:
  date,value
  2026-04-01,4823
  2026-04-02,4901
  2026-04-03,4965
  ...

LIMITS:
  File size:    1 MB max
  Rows:         5,000 max
  Metrics:      one metric per upload (cannot mix in one CSV)

DRY RUN:
  Optional ?dry_run=true query parameter
  Validates the upload without committing
  Returns: row count, date range, sample values, any errors
  
  Useful for: confirming CSV format before committing; checking
  that the date range matches expectation
```

For larger historical backfills (>5,000 rows), split into multiple CSVs by date range. The Push API supports the same batching at higher throughput.

### Pull API details

```
SETUP (customer-side):
  Expose an HTTPS endpoint that returns:
    [{date, value, ...optional fields...}, ...]
  
  Authentication: Bearer token, API key in header, or mTLS

ZOPNIGHT CONFIGURATION (Settings → Unit Metrics):
  Endpoint URL:        https://your-company.com/api/v1/metrics/MAU
  Auth mechanism:      Bearer / API key / mTLS
  Auth credential:     stored encrypted in ZopNight
  Interval:            daily (04:15 UTC) | hourly
  Test fetch:          "Test Fetch" button validates the endpoint
                       immediately and shows the response

ZOPNIGHT RUNTIME BEHAVIOR:
  Daily at 04:15 UTC, ZopNight calls the customer's endpoint
  Endpoint must respond within 30 seconds
  Response: JSON, < 5 MB
  Includes: previous day's value (for freshness verification)

ON FAILURE:
  3 retries with exponential backoff
  Alert to configured channel (Slack, email)
  Last-known value remains; reports show stale-data indicator
```

The Pull API has two operational advantages for some customers. First, the customer never has to push anything — their endpoint is read-only from ZopNight's perspective. Second, data flow is initiated by ZopNight, which simplifies firewall rules (no customer-initiated outbound to ZopNight required).

### The SSRF guard

Pull API has a critical security feature: ZopNight blocks fetches from any private or internal IP range. Without this, a misconfigured Pull URL could trick ZopNight into fetching from internal AWS metadata services or RFC 1918 networks — a textbook Server-Side Request Forgery (SSRF) attack.

```
BLOCKED RANGES (ZopNight will refuse to fetch):
  Private IPv4:       10.0.0.0/8
                       172.16.0.0/12
                       192.168.0.0/16
  Link-local:          169.254.0.0/16  (incl. AWS metadata 169.254.169.254)
  Loopback:            127.0.0.0/8
  CGNAT:               100.64.0.0/10
  Multicast:           224.0.0.0/4
  Broadcast:           255.255.255.255
  IPv6 private:        fc00::/7 (Unique Local Addresses)
  IPv6 loopback:       ::1/128
  IPv6 link-local:     fe80::/10
  
RESOLUTION CHECK:
  DNS resolution is performed and the resolved IP is checked.
  An attacker cannot circumvent by using a hostname that resolves
  to an internal IP.
  
  TLS certificate verification is also enforced; self-signed certs
  are rejected.
```

The SSRF guard means customer endpoints must be on the public internet (or behind a public load balancer or API gateway). Internal-only endpoints — say, a service inside the customer's VPC — cannot be used directly. For those, a Push API integration is the right path.

### Test fetch

Before scheduling daily pulls, the customer can validate the endpoint:

```
TEST FETCH:
  ZopNight calls the configured endpoint immediately
  Returns the response status, body sample, validation result
  Surfaces issues: auth failures, SSRF blocks, invalid JSON, etc.
  
Useful for:
  - Debugging endpoint setup before going live
  - Confirming auth credentials are correct
  - Validating the JSON shape matches expectations
```

The test-fetch result is logged in audit but does not commit data — it is purely a validation operation.

### Operational considerations

```
PUSH API
  Customer maintains the push pipeline
  Pipeline must survive customer's deploys, infra changes
  Monitoring: customer notices if push stops; ZopNight has stale-data
              indicator
              
CSV UPLOAD
  Manual process; no automation by default
  Easy to forget; periodic re-uploads needed
  Monitoring: ZopNight surfaces "no data in last 7 days" alert
              
PULL API
  Customer maintains the endpoint (HTTPS, auth, JSON format)
  Endpoint must be available at 04:15 UTC daily (or hourly cadence)
  Monitoring: ZopNight retries + alerts; customer also monitors endpoint
              via their own observability stack
```

Each path has different ownership and failure modes. Pick the one whose ownership pattern fits the customer's team structure.

### How ZopNight uses ingest paths

The Unit Metrics admin page surfaces the chosen path per-metric, the last successful ingest timestamp, and the source URL/method. Failed ingests are highlighted with the failure reason and suggested remediation. For customers with multiple metrics, each can independently use a different path.

---

## 2. Demo

A SaaS customer choosing Pull API for compliance reasons:

```
SETUP:

T+0       Customer's data team agrees to expose a metrics endpoint
T+1 day   Customer provisions:
            URL: https://api.acme.com/v1/zopnight-export/MAU
            Auth: Bearer token (rotated quarterly)
            Format: [{date: ISO 8601, value: integer}]
            
T+1 day   In ZopNight Settings → Unit Metrics → MAU:
            Configure Pull API source
            Paste URL + Bearer token
            Click "Test Fetch"
            
TEST FETCH RESULT:
  Status: 200 OK
  Sample: [{"date":"2026-05-20","value":5012},
           {"date":"2026-05-19","value":5004}]
  Validation: passed; date + value formats correct
  SSRF check: passed (public IP)
  TLS check: passed (valid certificate)

T+1 day   Activate Pull API; scheduled fetch enabled
            
DAILY (going forward):
  04:15 UTC:  ZopNight calls endpoint
              Customer's endpoint responds with previous day's value
              ZopNight validates, stores in unit_metric_values
              Reports update at 04:30 UTC
  
OPERATIONAL:
  Customer's pipeline keeps endpoint healthy
  ZopNight retries on 5xx (3 retries, exponential backoff)
  ZopNight alerts customer's Slack on persistent failure
  Customer's own monitoring also alerts on endpoint downtime
  
QUARTERLY:
  Bearer token rotation (customer-driven; updates ZopNight config)
  Endpoint contract review (data team and FinOps confirm)
```

Pull API requires more customer-side setup than Push but gives the customer central control over the data exposure.

---

## 3. Hands-on (5 min)

For your team, pick the right ingest path:

```
DATA SOURCE FOR UNIT METRIC:    __________
  (analytics platform, data warehouse, manual analysis, etc.)

CUSTOMER-SIDE OWNER:              __________
  (which team maintains the pipeline)

CHOSEN INGEST PATH:               __________
  □ Push API
  □ CSV upload
  □ Pull API

WHY THIS PATH:
  __________________________________________________________

OPERATIONAL REQUIREMENTS:
  Auth mechanism:                 __________
  Cadence:                         daily / hourly / weekly
  Backfill needed?                Yes / No
  
IF PULL API:
  Endpoint URL (planned):         __________
  SSRF check: endpoint is on public internet?   Yes / No
  TLS: endpoint has valid public cert?           Yes / No
```

If your endpoint is internal-only (private IP / VPN-only), Pull API will not work — switch to Push API or CSV upload.

---

## 4. Knowledge check

### Q1
Customer's pipeline pushes daily values to ZopNight. Best path:

A. Pull API
B. Push API. Customer-driven, supports live cadence, customer's existing pipeline architecture extends naturally to ZopNight. Authentication via PAT or API key.
C. CSV upload only
D. Both

<details>
<summary>Show answer</summary>

**Correct: B.** Push API matches customer-driven pipelines. Pull would invert ownership unnecessarily.
</details>

### Q2
The SSRF guard on Pull API blocks:

A. All HTTPS endpoints
B. Private IPs, loopback, link-local (including the AWS metadata IP 169.254.169.254), CGNAT, multicast, and IPv6 private ranges. The customer endpoint must resolve to a public IP. DNS is resolved and the resolved IP is checked — an attacker cannot trick ZopNight via hostname tricks.
C. Random
D. Public IPs

<details>
<summary>Show answer</summary>

**Correct: B.** SSRF guard is critical — blocks the textbook attack of using ZopNight to fetch from internal services. Customer endpoints must be on the public internet.
</details>

### Q3
CSV upload limits are:

A. Unlimited
B. 1 MB file, 5,000 rows max, one metric per CSV. Use Push API for ongoing high-volume metrics; CSV is for historical backfill or small batches. The dry-run flag validates without committing.
C. Defined per customer
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Defined limits protect the ingest pipeline. For larger backfills, split into multiple CSVs by date range.
</details>

---

## 5. Apply

Configure ingest paths in [Settings → Unit Metrics](https://app.zopnight.com/settings/unit-metrics). The setup wizard for each metric prompts for the path and validates configuration. Pull API setups include a Test Fetch button before activation.

For high-volume customers, prefer Push API. For one-time backfills, CSV. For governance-sensitive customers, Pull API with the SSRF guard guarantees no fetching from internal infrastructure.

---

## Related lessons

- [L1 — Pick the dimension](L1_pick_dimension.md)
- [L2 — Team attribution](L2_team_attribution.md)
- [L3 — Tag attribution](L3_tag_attribution.md)
- [L4 — Tag coverage](L4_tag_coverage.md)
- [L5 — Unit economics](L5_unit_economics.md)
- [T4.M4.3 — Unit economics](../../T4_finops_mastery/M4.3_unit_economics/00_README.md)

## Glossary terms touched

[Push API](../../../reference/glossary/push-api.md) · [Pull API](../../../reference/glossary/pull-api.md) · [CSV upload](../../../reference/glossary/csv-upload.md) · [SSRF guard](../../../reference/glossary/ssrf-guard.md) · [Idempotency](../../../reference/glossary/idempotency.md)

---

## Module quiz

Complete M3.5 → 10-question module quiz unlocks the **Showback-Designer** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.5.L6
