# Cross-account discovery in ZopNight

§ T3 · M3.4 · L3 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** cross-account credentials for AWS / GCP / Azure, **explain** the external-ID security feature, **and predict** the discovery flow timing for a multi-account estate.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Wire up ZopNight to see every cloud account without configuring credentials a hundred times." |
| **Personas** | Platform Engineer · Cloud Architect · Security/Compliance |
| **Prerequisites** | M3.4.L1 (why multi-account) · M3.4.L2 (hierarchy) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Explain (Understand), Predict (Analyze) |

---

## 1. Concept

ZopNight needs read credentials in each cloud account to discover resources and pull cost data. Configuring credentials per account individually would be tedious and error-prone at scale (imagine maintaining 60+ IAM users). **Cross-account credential patterns** solve this: one master credential, federation to many child accounts, automatic short-lived credential exchange.

Each cloud has its own pattern, but the structure is the same:

```
ALL THREE PATTERNS:
  1. ONE source-of-truth credential (managed centrally)
  2. EACH child account trusts the source credential
  3. ZOPNIGHT exchanges short-lived credentials for each access
  4. NO long-lived per-account credentials stored anywhere
```

### AWS pattern: cross-account assume-role

```
STEP 1: ZOPNIGHT's source credential
  The ZopNight-Discovery IAM role in the management account
  (or external IAM user with assume-role-only permission)

STEP 2: PER-CHILD-ACCOUNT trust
  In each child account, deploy an IAM role with this trust policy:
  
  trust_policy:
    Principal: <ZopNight source role ARN>
    Action: sts:AssumeRole
    Condition: { StringEquals: { sts:ExternalId: "<customer-specific>" } }

STEP 3: ZOPNIGHT discovers via assume-role
  sts.AssumeRole(
    RoleArn = arn:aws:iam::<child-account>:role/ZopNight-Discovery,
    ExternalId = <customer-specific external ID>
  )
  → returns temporary credentials (default 1-hour lifetime)
  → ZopNight uses them for discovery in that account
  → credentials expire automatically; next discovery re-issues

DEPLOYMENT VEHICLE: CloudFormation StackSet
  Deploy the IAM role to all accounts in the AWS Organization
  in one operation. New accounts auto-receive the role.
```

### GCP pattern: service account + Workload Identity Federation

Two options, one preferred:

```
LEGACY: Service-account JSON key
  Generate a JSON key for a service account
  Grant organization-viewer role to the service account
  Upload the JSON key to ZopNight
  
  Pros: simple
  Cons: long-lived secret; rotation manual; key compromise = full
        read of GCP estate
        
PREFERRED: Workload Identity Federation (WIF)
  Create a WIF pool in your GCP project
  Configure the pool to trust ZopNight's identity
  Grant organization-viewer to the WIF identity
  ZopNight authenticates via short-lived federated tokens
  
  Pros: no long-lived secret; rotation automatic; revocation instant
  Cons: slightly more setup
```

ZopNight strongly recommends WIF for new GCP integrations. The JSON-key pattern works but is harder to manage securely.

### Azure pattern: service principal

```
STEP 1: REGISTER an Azure AD application
  Portal → Azure AD → App registrations → New registration
  Note: tenant_id, application (client) ID

STEP 2: GRANT permissions
  Azure RBAC → Reader role at the tenant or root MG level
  Inherits to all subscriptions

STEP 3: CREATE a credential
  Option A: Client secret (long-lived; manual rotation)
  Option B: Certificate (long-lived; rotation via cert pipeline)
  Option C: Workload Identity Federation (short-lived; recommended)

STEP 4: ZOPNIGHT authenticates via OAuth client-credentials flow
  tenant_id + app_id + credential
  → returns access token (default 1-hour lifetime)
  → ZopNight uses token for ARM API calls (discovery, cost data)
```

The Azure pattern parallels AWS in structure: one app-level credential, broad RBAC grant at the top, automatic discovery cascading down.

### The external ID — AWS's confused-deputy defense

For AWS, the `ExternalId` field on the IAM role trust policy is critical. It defends against the **confused deputy attack** — where an attacker tricks ZopNight into assuming a role they should not.

```
WITHOUT ExternalId (insecure):
  Attacker says to ZopNight: "Assume role X for me"
  ZopNight (a trusted service) calls sts.AssumeRole(X)
  Returns credentials; attacker's instructions were honored
  
  PROBLEM: ZopNight is acting on attacker's behalf with stolen role
  
WITH ExternalId:
  Attacker says to ZopNight: "Assume role X for me"
  ZopNight calls sts.AssumeRole(X, ExternalId=<ZopNight's per-customer ID>)
  AWS checks the role's trust policy: requires ExternalId = <Y>
  If the attacker did not know Y to inject: AWS rejects
  
  PROTECTION: ExternalId acts as a shared secret between
              ZopNight + the legitimate customer account
```

ZopNight generates a unique external ID for each customer. The customer's role trust policy specifies the exact external ID. AWS enforces the match. Anyone who does not know the external ID cannot trick ZopNight into assuming the role.

### Cross-account discovery flow

What happens at each discovery cycle:

```
T+0       ZopNight scheduled discovery task begins
T+10ms    Loads management-account credentials (long-lived, secured)

For each child account in the customer's estate:
T+11ms    Calls sts.AssumeRole(child_role_arn, ExternalId=customer_eid)
T+50ms    AWS returns temporary credentials (1-hour validity)
T+51ms    ZopNight begins discovery API calls:
            EC2: DescribeInstances, DescribeVolumes, ...
            S3:  ListBuckets, GetBucketLocation, ...
            RDS: DescribeDBInstances, ...
            (parallel calls; rate-limited per AWS guidance)
T+800ms   Discovery complete for this account
T+810ms   Resources persisted to ZopNight's database
T+810ms   Temporary credentials abandoned (no need to revoke;
          they expire automatically)
T+811ms   Next child account; repeat

For an 8-account AWS estate:
  Total cycle: ~3-5 minutes for full discovery (parallelism reduces
  wall-clock time well below 8× single-account time)
```

The short-lived credential lifecycle is what makes this safe at scale. ZopNight never holds long-lived credentials for child accounts; the management-account credential is the only durable secret, and even that is scoped narrowly (assume-role permission only, no direct resource access).

### Credential rotation

```
AWS:           ExternalId can be rotated by updating both ZopNight
              config and each child account's trust policy. Cross-
              account roles themselves do not need rotation if
              ExternalId is in place.
              
GCP (JSON):    Service-account keys must be rotated periodically.
              Recommended: every 90 days. WIF eliminates this need.
              
GCP (WIF):     No rotation needed; tokens are ephemeral.

Azure:         Client secrets rotate per Azure's expiration policy
              (default 1 year, configurable). Certificates rotate
              per the certificate's lifecycle. WIF eliminates need.
```

A maturity signal: orgs without ongoing credential rotation processes are usually using legacy long-lived credentials. Moving to assume-role / WIF reduces the rotation surface dramatically.

### What discovery actually fetches

```
RESOURCE INVENTORY      EC2, RDS, S3, Lambda, EKS, ECS, EBS, ELB,
                        ALB, NLB, Route53, CloudFront, ...
                        (similar surfaces for GCP and Azure)
                        
COST DATA              CUR (AWS), Cloud Billing (GCP), Cost
                        Management (Azure) — typically daily refresh
                        
TAG DATA                All resource tags + their values
                        
USAGE METRICS           CloudWatch / Monitoring / Insights — for
                        recommendations (idle detection, right-sizing)
                        
AUDIT/EVENT             CloudTrail / Audit Logs / Activity Log —
                        for activity-driven recommendations
```

Each of these is a separate set of API calls; the discovery process orchestrates them. The full list of API permissions required is documented at [docs.zopnight.com/setup/iam-permissions](https://docs.zopnight.com/setup/iam-permissions).

### How ZopNight uses it

ZopNight's discovery scheduler runs per-account discovery cycles independently. Account-level failures (one IAM permission missing in one child) do not block other accounts. The Discovery dashboard surfaces per-account status, last-successful-discovery timestamp, and any errors with remediation guidance.

---

## 2. Demo

A clean setup for an 8-account AWS estate:

```
SETUP TIMELINE:

Step 1: Management-account preparation (30 min)
  - Create ZopNight-Source IAM role in management account
  - Trust policy: trust ZopNight's AWS account
  - Permission policy: sts:AssumeRole on child-account roles
  
Step 2: Per-child-account role (StackSet — 15 min once, 0 min per account)
  - Deploy CloudFormation StackSet from management account
  - StackSet template defines ZopNight-Discovery role
  - Trust: management account principal + ExternalId condition
  - Permissions: read-only IAM policies for discovery
  
  Deploy to:
    - All 8 current accounts (1 deploy operation)
    - Auto-deploy to any new accounts added later
  
Step 3: ZopNight configuration (5 min)
  - In ZopNight: Settings → Cloud Accounts → Add AWS Organization
  - Provide: management account credentials,
             AWS Organizations ID, ExternalId
  - ZopNight discovers all 8 accounts; adds each to its inventory
  
Step 4: First discovery cycle (3-5 min)
  - ZopNight begins discovery; per-account assume-role calls
  - Each account: 1-hour temporary credentials; discovery API calls
  - Results: ~3,400 resources across the 8 accounts
  - Cost data: 30-90 day backfill begins

TOTAL ELAPSED: ~50 minutes from first IAM role to first dashboard.
ONGOING: discovery refreshes hourly; cost refreshes nightly.
```

When a new AWS account is later added to the Organization, the StackSet automatically deploys the IAM role and ZopNight picks it up at the next discovery cycle. Zero additional configuration.

---

## 3. Hands-on (6 min)

For your cloud estate, plan the cross-account setup:

```
PROVIDER:                __________ (AWS / GCP / Azure)
ACCOUNT COUNT:           _____
HIERARCHY-LEVEL CONNECTION POINT: __________ (org / folder / MG / etc.)

CREDENTIAL STRATEGY:
  □ Cross-account assume-role (AWS) with ExternalId
  □ Service account + org-viewer (GCP, legacy)
  □ Workload Identity Federation (GCP / Azure, preferred)
  □ Service principal with Reader role (Azure)
  
DEPLOYMENT VEHICLE for per-account IAM roles:
  □ CloudFormation StackSet (AWS)
  □ Terraform module (cloud-agnostic)
  □ Manual (small estates only)

ESTIMATED SETUP TIME:    _____ hours
  (Larger estates with multiple BUs may have political coordination
   overhead beyond the technical work)

CREDENTIAL ROTATION:
  Current rotation cadence: __________
  Target cadence: __________
  Migration to short-lived credentials (WIF / assume-role)? __________
```

If you're using long-lived JSON keys or hardcoded service-principal secrets, plan the migration to ephemeral credentials. The risk reduction is significant.

---

## 4. Knowledge check

### Q1
For AWS, ZopNight authenticates to child accounts via:

A. Direct IAM credentials in each child account
B. Cross-account assume-role from a management account using cross-account trust + ExternalId. The management account holds the source credential; each child account's IAM role trusts the management account. ZopNight exchanges short-lived credentials per discovery cycle.
C. Per-account hardcoded keys
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Assume-role is the canonical AWS multi-account pattern. It scales because the management-side credential is one; the per-account credential is just an IAM role definition, not a stored secret.
</details>

### Q2
The ExternalId field in the IAM role trust policy:

A. Is decoration
B. Defends against the confused-deputy attack. ZopNight passes a customer-specific external ID; the role's trust policy requires it; without the ID, AWS rejects the assume-role call. This means an attacker who doesn't know the external ID cannot trick ZopNight into assuming the role.
C. Is a performance optimization
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** ExternalId is the standard defense against confused-deputy in cross-account IAM. Every reputable third-party service that does cross-account assume-role uses this pattern.
</details>

### Q3
GCP service-account JSON key vs Workload Identity Federation:

A. Same thing
B. JSON key is a long-lived secret (manual rotation, key file management). WIF uses short-lived federated tokens (no long-lived secret, automatic). WIF is the modern best practice. ZopNight strongly recommends WIF for new integrations.
C. JSON key is more secure
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** WIF eliminates the long-lived-secret risk entirely. New GCP integrations should default to WIF.
</details>

---

## 5. Apply

Configure cross-account credentials in [Settings → Cloud Accounts](https://app.zopnight.com/settings/cloud-accounts). The setup wizard generates the IAM role / WIF configuration / service-principal templates with the right trust conditions baked in. CloudFormation StackSet templates are exported directly for AWS Organizations rollout.

After setup, monitor the Discovery dashboard for per-account success status. Any account showing repeated failures usually has a missing IAM permission — the dashboard surfaces the specific permission and remediation step.

---

## Related lessons

- [L1 — Why multi-account](L1_why_multi.md)
- [L2 — Cloud-provider hierarchies](L2_org_structures.md)
- [L4 — Rollup vs isolation](L4_rollup_vs_isolation.md) *(next)*
- [L5 — Multi-account anti-patterns](L5_antipatterns.md)

## Glossary terms touched

[Assume-role](../../../reference/glossary/assume-role.md) · [ExternalId](../../../reference/glossary/external-id.md) · [Workload Identity Federation](../../../reference/glossary/wif.md) · [Service principal](../../../reference/glossary/service-principal.md) · [Confused deputy](../../../reference/glossary/confused-deputy.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.4.L3
