# Vault credentials — the model

§ T1 · M1.1 · L1 of 4 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **describe** how ZopNight stores cloud credentials **and explain** the four properties of the vault model.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Defend ZopNight's credential storage in a Security review." |
| **Personas** | Security/Compliance · Platform Engineer · FinOps Analyst |
| **Prerequisites** | None (Track 0 recommended) |
| **Time** | 9 minutes |
| **Bloom verb** | Describe (Understand) and Explain (Understand) |

---

## 1. Concept

Every connected cloud account requires a credential — an IAM role, a service account, a service principal. ZopNight stores these credentials in a vault and uses them to call cloud provider APIs on the customer's behalf. The vault model has four explicit properties.

### Property 1 — Encrypted at rest with AES-256-GCM

Credentials are stored encrypted at rest using AES-256-GCM. The encryption key is held in the configuration service's vault module, separate from the credential records themselves. Decryption happens just-in-time at the moment of use; the decrypted credential is held in memory for the duration of the API call and discarded.

The choice of AES-256-GCM matters. GCM (Galois/Counter Mode) provides both confidentiality (the credential cannot be read without the key) and authenticity (an attacker cannot tamper with the encrypted payload without detection). It is the modern standard for credential storage. ISO 27001 and SOC 2 Type II audits accept this as compliant.

### Property 2 — Per-organization isolation

Each customer organization has a distinct credential namespace. The credentials for org-A cannot be queried, decrypted, or used by org-B under any code path. This is enforced in two places:

- **The data layer.** Credentials are stored with `org_id` as a primary key dimension. Queries always include `org_id` in the WHERE clause.
- **The service layer.** The gateway resolves the calling user's organization on every request. A cross-org query is structurally impossible.

Multi-tenant SaaS has many ways to leak credentials across tenants. The vault is hardened against the canonical ones (missing WHERE clauses, IDOR-style enumeration, shared cache keys).

### Property 3 — Rotation, with no downtime

Customers can rotate a credential at any time without affecting in-flight operations. The rotation flow:

```
1. Customer creates a new IAM role / service account / SPN in their cloud
2. Customer adds the new credential to ZopNight (via Cloud Accounts UI)
3. The new credential is validated against the cloud provider's auth endpoint
4. If validation passes, the credential is written to the vault
5. The OLD credential is marked deprecated but kept available for 24 hours
6. New discovery runs use the new credential immediately
7. After 24 hours, the old credential is deleted from the vault
```

The 24-hour overlap lets in-flight schedule executions and discovery runs complete before the old credential disappears. Customers rotating quarterly hit zero downtime.

### Property 4 — Revocation, also no downtime

Customers can revoke a credential at any time. The revocation immediately marks the credential as inactive; subsequent discovery and execution attempts fail loudly (not silently). The Permission Visibility drawer for that account shows "Credential revoked" with the revocation timestamp.

A revoked credential cannot be un-revoked. The customer creates a new credential and connects it to the same cloud account. This is intentional — revocation is a security action, not a configuration toggle. Once a credential is revoked, the assumption is that it must be treated as potentially compromised.

### What the customer sees

The vault model is mostly invisible. The Cloud Accounts page shows:

- Account name, provider, and region
- Connection status (active / degraded / revoked)
- Last successful sync timestamp
- A "Rotate credential" action
- A "Revoke credential" action
- A "View Permissions" drawer (covered in [L4](L4_permission_visibility.md))

The customer does not see the encrypted blob. The customer cannot export the credential. The customer cannot retrieve the original credential after submission — only the cloud provider holds that. ZopNight only verifies usage; it does not have a way to render the credential back.

### What ZopNight engineers cannot do

Even ZopNight engineers cannot read a customer's credential. The vault decryption key is not accessible from engineering tooling. Production debugging that needs credential access goes through a documented break-glass procedure with multi-party approval, logged in the security audit trail. This is required for SOC 2 evidence.

---

## 2. Demo

The credential lifecycle in one timeline:

```
T+0       Customer creates IAM role in AWS Console
T+1 min   Customer pastes role ARN + external ID into ZopNight Cloud Accounts page
T+1 min   ZopNight calls AWS STS AssumeRole to validate
T+1 min   STS returns temporary credentials — validation passes
T+2 min   The role configuration is encrypted (AES-256-GCM) and stored
T+2 min   A "discovery preview" sync runs to confirm the credential can read
T+5 min   Customer sees the account marked Active in the UI
T+5 min   Permission Visibility drawer populates with Granted/Denied per service
T+6 hr    First scheduled discovery sync runs successfully
T+91 day  Customer rotates: adds new role, old role expires after 24h overlap
```

Five minutes to active. Six hours to first scheduled sync. Rotation is a 24-hour overlap with no downtime.

(Asset: `assets/diagrams/M1.1_L1_credential_lifecycle.svg`.)

---

## 3. Hands-on (5 min)

This hands-on is a security-review walkthrough rather than a code task. Open ZopNight Cloud Accounts (or look at the Cloud Accounts page in a screenshot).

```
1. Click any connected account.
2. Confirm you cannot see the underlying credential value (only an
   identifier — role ARN, service account email, app ID).
3. Note the "Rotate credential" and "Revoke credential" actions.
4. Open the "View Permissions" drawer (covered fully in L4).
5. Check the "Last sync" timestamp. Should be within the last 6 hours.

If any element is missing or behaves unexpectedly, escalate. The
vault model has specific guarantees and any deviation is a bug.
```

---

## 4. Knowledge check

### Q1
A Security team asks: "What happens to a credential after rotation?" Most accurate answer:

A. It is immediately deleted
B. It is marked deprecated and kept available for 24 hours so in-flight operations can complete, then deleted from the vault
C. It is archived indefinitely
D. It is encrypted again

<details>
<summary>Show answer</summary>

**Correct: B.** The 24-hour overlap is intentional — lets in-flight syncs and executions finish on the old credential before deletion. Zero downtime rotation depends on this.
</details>

### Q2
A Security team asks: "Can a ZopNight engineer decrypt our credential to help debug?" Most accurate answer:

A. Yes, on request
B. No. Decryption keys are not accessible from engineering tooling. Production debugging that requires credential access goes through a documented break-glass procedure with multi-party approval, logged in the security audit trail. This is required for SOC 2.
C. Only for premium customers
D. Yes, after written consent

<details>
<summary>Show answer</summary>

**Correct: B.** Engineer access to customer credentials is structurally restricted, not policy-restricted. The break-glass procedure is the only path and it is audited.
</details>

### Q3
A team revokes a credential by accident. The right recovery procedure is:

A. Un-revoke through the UI
B. Create a new credential in the cloud provider and connect it. Revocation is intentionally one-way; un-revoking would defeat the security purpose.
C. File a support ticket to restore
D. The credential is unrecoverable, recreate the cloud account

<details>
<summary>Show answer</summary>

**Correct: B.** Revocation cannot be undone — that is the security guarantee. The recovery path is to create a new credential. ZopNight detects the same underlying cloud account and re-attaches.
</details>

---

## 5. Apply

To audit the vault model on your own deployment:

- **[Cloud Accounts page](https://app.zopnight.com/cloud-accounts)** — confirm credential values are not exposed
- **[Audit Logs page](https://app.zopnight.com/audit-logs)** — filter to credential-related events to see rotation, revocation, and permission changes
- **Security review documentation** — request the SOC 2 Type II report + ISO 27001:2022 certificate from ZopNight Trust Center

---

## Related lessons

- [L2 — AWS IAM policy](L2_aws_iam_policy.md) *(next)*
- [L4 — Permission Visibility](L4_permission_visibility.md)
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[AES-256-GCM](../../../reference/glossary/aes-256-gcm.md) · [Vault](../../../reference/glossary/vault.md) · [Per-org isolation](../../../reference/glossary/per-org-isolation.md) · [Credential rotation](../../../reference/glossary/credential-rotation.md) · [Break-glass procedure](../../../reference/glossary/break-glass-procedure.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.1.L1
