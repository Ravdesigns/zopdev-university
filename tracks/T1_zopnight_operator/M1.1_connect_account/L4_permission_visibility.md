# Permission Visibility — what the dashboard tells you

§ T1 · M1.1 · L4 of 4 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** the Permission Visibility drawer **and act** on any Denied entry to restore full discovery.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Know exactly what ZopNight can and cannot see in my cloud." |
| **Personas** | Security/Compliance · Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1–L3](L1_vault_credentials.md) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Understand) and Act (Apply) |

---

## 1. Concept

Most cloud cost tools fail silently when a permission is missing. The IAM denies a Describe call; the tool logs an error somewhere; the customer sees a lower number on their dashboard than the reality and never knows. Months later, an audit reveals that 20 percent of the estate was never scanned.

ZopNight refuses to fail silently. Every AccessDenied / 403 / AuthorizationFailed during discovery is captured per provider, per resource type, per region. The data feeds the **Permission Visibility drawer** — accessible from every Cloud Account card via "View Permissions."

### What the drawer shows

```
ACCOUNT: prod-aws-us-east-1                         Status: Active

CATEGORY               TYPES SCANNED     STATUS
─────────────────────────────────────────────────────────────────
Compute                12 / 12            All Granted
  ec2                  4 regions          Granted   ●
  asg                  4 regions          Granted   ●
  lambda               4 regions          Granted   ●
  ...

Kubernetes              3 / 3            All Granted
  eks                  4 regions          Granted   ●
  ...

Database                4 / 5            Partial
  rds                  4 regions          Granted   ●
  aurora               4 regions          Granted   ●
  elasticache          4 regions          Granted   ●
  documentdb           4 regions          Denied    ●  ← see below
  dynamodb             4 regions          Granted   ●

Storage                 3 / 3            All Granted
  ...

DocumentDB error detail:
  Region: us-east-1
  Error: User: arn:aws:iam::...:assumed-role/ZopNightDiscovery
         is not authorized to perform: docdb:DescribeDBClusters
  Last attempt: 2 hours ago
  
  ACTION: Add docdb:Describe* to the IAM policy and re-run discovery.
  The CloudFormation template snippet to copy is provided.
```

The drawer reveals:

- **Coverage** at category level (Compute, Kubernetes, Database, Storage, etc.)
- **Granted / Denied / Unknown** badge per resource type per region
- **Exact error message** for any Denied entry (with the calling principal and the missing action)
- **Last attempt timestamp** so the user knows how recent the failure is
- **Action guidance** to fix the gap

### The three states

- **Granted (green).** The credential successfully made at least one read call to this resource type in this region within the last 24 hours.
- **Denied (red).** The credential made the call and received an AccessDenied / 403 / AuthorizationFailed response. The drawer shows the exact error.
- **Unknown (gray).** The credential has not yet attempted this combination, OR the cloud provider returned an inconclusive response. Common case: a new region was enabled; the next sync will resolve it to Granted or Denied.

### The 6-hour cron + 24-hour skip + manual retry

The discovery cron runs every 6 hours. For performance:

- **Granted entries** are re-attempted every cycle (~6h)
- **Denied entries** are skipped for 24 hours by default — repeated AccessDenied calls cost time, and the underlying IAM policy rarely changes faster than that
- **Manual refresh** always retries every entry, including Denied ones — useful immediately after granting a permission so the customer doesn't wait 24 hours to confirm the fix

This three-tier cadence balances responsiveness against API cost.

### How to fix a Denied entry

A typical fix loop:

```
1. Open Cloud Accounts → click the account → View Permissions
2. Scroll to Denied entries, expand one
3. Read the error: "not authorized to perform: docdb:DescribeDBClusters"
4. The drawer offers a CloudFormation template snippet adding the missing action
5. Apply the snippet to the customer's IAM role (terraform / console / CLI)
6. Wait ~30 seconds for IAM to propagate
7. Click "Manual refresh" in ZopNight Cloud Accounts page
8. Wait ~60 seconds for the discovery to re-attempt
9. Refresh the Permission Visibility drawer
10. The previously-Denied entry should now show Granted
```

Five minutes from spotting the gap to closing it.

### Why this matters beyond convenience

Three operational uses:

**1. Audit completeness.** A SOC 2 / ISO 27001 audit asks "what is the inventory of cloud resources covered by your monitoring?" The Permission Visibility drawer answers exactly: "All Granted across X categories, no Denied entries." That answer is reproducible by the auditor.

**2. Acquisition due diligence.** When acquiring a company, finding out which parts of their cloud estate were *not* visible to their tooling is critical. The drawer reveals it in minutes, not weeks.

**3. Cost reconciliation.** If the ZopNight monthly report disagrees with the cloud invoice by 8 percent, the Permission Visibility drawer is the first thing to check. If 8 percent of the estate is invisible, the gap is explained.

---

## 2. Demo

A common scenario, walked through:

```
Day 1, Morning:
  Customer connects AWS account with the baseline IAM policy.
  Discovery runs. Permission Visibility drawer shows mostly Granted,
  except DocumentDB (Denied — the customer didn't include docdb:* in policy).

Day 1, Afternoon:
  Customer notices DocumentDB Denied. Reads the error in the drawer.
  Copies the CloudFormation snippet ZopNight offers (adds docdb:Describe*).
  Applies it via CloudFormation.

Day 1, Afternoon + 5 min:
  Customer clicks "Manual refresh" in ZopNight.
  Discovery re-attempts DocumentDB. Returns Granted.
  Permission Visibility shows All Granted.

Day 1, Afternoon + 6 hr:
  First scheduled discovery sync after the manual refresh.
  Discovery picks up 4 DocumentDB clusters that were invisible before.
  Recommendation engine fires for one of them (RC-193: idle DocumentDB).
  $1,840/month potential savings now exposed.

PRE-FIX:   Estate coverage: 87%, missing $1,840/mo savings
POST-FIX:  Estate coverage: 100%, $1,840/mo recommendation surfaced
```

The 5-minute permission fix unblocked $22,080/year of savings that was structurally hidden.

(Asset: `assets/diagrams/M1.1_L4_permission_drawer.svg`.)

---

## 3. Hands-on (5 min)

For one of your connected accounts:

```
1. Open Cloud Accounts → click the account → View Permissions.
2. Scroll the drawer top to bottom. Note any Denied entries.
3. For each Denied entry:
   - Read the error
   - Note which resource type and region
   - Estimate how much hidden spend might live there (best guess)
4. If any Denied is in a high-spend category (compute, database, storage):
   - Apply the suggested IAM extension
   - Click Manual refresh
   - Verify Granted within 5 minutes
5. If all Denied entries are in low-spend / unused categories: document
   them and accept the gap.
```

The goal is to know the coverage state, not to close every gap. A team that knowingly excludes a service is far better off than one that doesn't know it has a gap.

---

## 4. Knowledge check

### Q1
A team's ZopNight monthly cost report is 8% lower than their AWS invoice. The first thing to check is:

A. ZopNight is broken
B. The Permission Visibility drawer. If 8% of the estate is missing because of IAM gaps, the report will be 8% low. Close the IAM gaps via the suggested CloudFormation snippets and re-run discovery.
C. Currency conversion
D. The AWS invoice is wrong

<details>
<summary>Show answer</summary>

**Correct: B.** Permission Visibility is built exactly for this audit. A non-zero Denied count explains coverage gaps that lead to under-reporting.
</details>

### Q2
A new region is enabled in the customer's AWS account. The Permission Visibility drawer shows the new region as Unknown for several resource types. The cause:

A. ZopNight is failing
B. The 6-hour discovery cron hasn't run since the region was enabled. Either wait for the next cron or click Manual refresh to re-attempt immediately. Unknown is a transient state; it resolves to Granted or Denied after one attempt.
C. The credential is invalid
D. The region is unsupported

<details>
<summary>Show answer</summary>

**Correct: B.** Unknown is a "not yet attempted" or "inconclusive response" state. The fix is just to trigger a new discovery, which Manual refresh does immediately.
</details>

### Q3
A SOC 2 auditor asks for evidence of "complete cloud inventory coverage." Most defensible response:

A. Run a Python script
B. Screenshot the Permission Visibility drawer showing All Granted across all categories. This is reproducible by the auditor (they can request a fresh view) and ties cleanly to the underlying credential / policy.
C. Refer the auditor to AWS
D. Manually count resources

<details>
<summary>Show answer</summary>

**Correct: B.** The drawer is the audit evidence. It is generated from the discovery service's logs, reproducible on demand, and tied to a specific credential.
</details>

---

## 5. Apply

The Permission Visibility surface is:

- **[Cloud Accounts → click any account → View Permissions](https://app.zopnight.com/cloud-accounts)** — the main entry point
- **Daily summary email** can include any Denied changes since the last day
- **Audit Log** records permission state transitions (e.g., Denied → Granted after a customer fix)

For new connections, the recommended first check is the drawer immediately after connection. Catching gaps on day one is much cheaper than discovering them in an audit on day 180.

---

## Module quiz

You have now completed all four lessons of M1.1. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.1-quiz](../../../certifications/operator/m1.1-quiz.md). Pass to earn the **Connected** chip.

---

## Related lessons

- [M1.2 — Discover your estate](../M1.2_discover_estate/00_README.md) *(next module)*
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Permission Visibility](../../../reference/glossary/permission-visibility.md) · [Granted / Denied / Unknown](../../../reference/glossary/granted-denied-unknown.md) · [Manual refresh](../../../reference/glossary/manual-refresh.md) · [Coverage](../../../reference/glossary/coverage.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.1.L4
