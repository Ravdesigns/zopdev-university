# M1.1 — Connect a cloud account

§ T1 · M1.1 · Operator tier · 4 lessons · ~38 min

---

## Module outcome

Connect AWS, GCP, and Azure accounts to ZopNight using least-privilege credentials. Read the Permission Visibility drawer to verify what the credentials can actually see. Diagnose a denied permission without re-running discovery.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [Vault credentials — the model](L1_vault_credentials.md) | 9 min | AES-256-GCM · per-org isolation · rotation · revocation |
| L2 | [AWS — the IAM policy and why it's read-mostly](L2_aws_iam_policy.md) | 10 min | The minimum IAM · scoped writes · cross-account assume-role |
| L3 | [GCP & Azure — service accounts and SPNs](L3_gcp_azure_creds.md) | 10 min | GCP service account · Azure SPN + AD app · custom roles |
| L4 | [Permission Visibility — what the dashboard tells you](L4_permission_visibility.md) | 9 min | Granted / Denied / Unknown · 6h cron · manual retry |

**Total: 4 lessons, ~38 min**

---

## Module diagram

The credential trust chain: customer cloud account → IAM credential (read-mostly) → ZopNight vault (AES-256-GCM) → discovery service. Each step audited.

(Asset: `assets/diagrams/M1.1_credential_trust_chain.svg`.)

---

## Module knowledge check

10 questions. Earn the **Connected** chip on pass.

---

## What's next

[M1.2 — Discover your estate](../M1.2_discover_estate/00_README.md).
