# GCP & Azure — service accounts and SPNs

§ T1 · M1.1 · L3 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** GCP service accounts and Azure service principals for ZopNight **and identify** the GCP and Azure equivalents of the AWS read-mostly pattern.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Connect GCP and Azure with the right minimum permissions, in one session." |
| **Personas** | Platform Engineer · Security/Compliance |
| **Prerequisites** | [L1](L1_vault_credentials.md), [L2](L2_aws_iam_policy.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply) and Identify (Remember) |

---

## 1. Concept

GCP and Azure use different identity primitives than AWS, but the read-mostly model maps cleanly. The terms differ; the architecture matches.

### GCP — service account model

GCP uses **service accounts** (long-lived identities for non-human callers). ZopNight asks for a service account with two roles:

```
roles/viewer                           — broad read across the project
roles/billing.viewer                   — read access to billing data
```

For scoped writes (scheduling, auto-remediation), the customer adds narrow custom roles or specific predefined roles:

```
roles/compute.instanceAdmin.v1         — full Compute Engine management (CAUTION)
                                         — typically replaced by a custom role
                                         — with only the start/stop / suspend / resume
                                         — actions

A custom "ZopNight Scheduler" role with:
  compute.instances.start
  compute.instances.stop
  compute.instances.suspend
  compute.instances.resume
  container.clusters.update
  ... (similar narrow list for GKE workloads)
```

### GCP — connecting

Two paths:

**Path 1 — Service account key file.** Customer creates a service account, downloads the JSON key file, and uploads it to ZopNight. The key file is the credential; it goes into the vault per [L1](L1_vault_credentials.md). Convenient but the key file is long-lived; rotation requires re-upload.

**Path 2 — Workload Identity Federation (recommended).** Customer configures GCP to trust ZopNight's identity provider via OIDC. ZopNight exchanges its identity token for a short-lived GCP access token at call time. No long-lived key file in the vault. This is the modern recommended path.

```
Setup steps for Workload Identity:
1. Create a Workload Identity Pool in the customer's GCP project
2. Create a Provider in the pool pointing at ZopNight's OIDC issuer
3. Bind the pool's principal to the service account
4. Configure ZopNight Cloud Account with the project ID and pool ID
```

No credential file changes hands. The short-lived tokens expire in ~1 hour and are re-fetched as needed.

### GCP — multi-project topology

For organizations with many projects (typical: dozens for separate environments, business units), ZopNight discovers across the entire **organization** when the service account or workload-identity binding is at the org level. The Cloud Asset Inventory call lists every accessible project under the org node.

Alternatively, customers can scope ZopNight to specific folders or projects only.

### Azure — service principal model

Azure uses **Azure AD applications** with **service principals** as the runtime identity. ZopNight asks for an app registration with two roles:

```
Reader                                — broad read at subscription scope
Cost Management Reader                — read access to Cost Management data
```

For scoped writes:

```
Virtual Machine Contributor           — VM start/stop/deallocate
AKS Cluster Admin                     — for AKS workload scheduling
Custom role "ZopNight Scheduler"      — preferred, narrow start/stop/deallocate
```

### Azure — connecting

Three values are needed:

```
Tenant ID           — the Azure AD tenant the customer uses
Application ID       — the registered app's UUID  
Client secret        — a long-lived credential (or use certificate)
                      — OR: workload identity federation (preferred)
```

The client secret goes into the vault. Like GCP, workload identity federation is the modern preferred path, eliminating the long-lived secret. Azure's federated credentials feature is the equivalent.

### Azure — multi-subscription topology

Azure organizes by **Management Groups** at the top, then **Subscriptions** under them. ZopNight assigns the service principal at the management group level for multi-subscription discovery, or at individual subscription level for narrower scope.

```
Tenant
  Management Group: root
    Management Group: production
      Subscription: prod-eu-1
      Subscription: prod-us-1
    Management Group: non-production
      Subscription: dev
      Subscription: stage
```

Assigning Reader at "root" gives ZopNight discovery across every subscription. Assigning at "non-production" scopes ZopNight to just dev + stage. The pattern matches AWS's "Organization-wide vs per-account" trade-off.

### The unified pattern

```
LAYER                  AWS                GCP                       AZURE
─────────────────────────────────────────────────────────────────────────────
Identity primitive     IAM Role           Service Account            Service Principal
Multi-account scope    AWS Organization    GCP Organization          Management Group
Read baseline          Read-only policy   roles/viewer + billing    Reader + Cost Reader
Scoped writes          Tagged actions     Custom role               Custom role
Trust mechanism        AssumeRole + ExtID  WI Federation (or key)   App + Secret (or WIF)
```

The architecture is the same. The cloud-specific knobs differ. Master one, the others map by analogy.

---

## 2. Demo

GCP connection walkthrough:

```
T+0       ZopNight → Cloud Accounts → Add GCP Account
T+1 min   Choose "Workload Identity Federation" (recommended)
T+2 min   ZopNight displays terraform snippet for WI Pool + Provider
T+3 min   Customer applies terraform in their GCP project
T+5 min   Customer pastes project ID + pool resource name back to ZopNight
T+6 min   ZopNight validates via Identity Aware Proxy
T+7 min   Account marked Active; discovery preview begins
```

Azure connection walkthrough:

```
T+0       ZopNight → Cloud Accounts → Add Azure Account
T+1 min   Customer creates App Registration in Azure AD portal
T+2 min   Customer creates federated credential under the app
T+3 min   Customer assigns Reader + Cost Mgmt Reader at MG/Sub scope
T+4 min   Customer pastes tenant ID + app ID into ZopNight
T+5 min   ZopNight validates via OAuth2 / federated token exchange
T+6 min   Account marked Active; discovery preview begins
```

Six to seven minutes per cloud. Both paths use workload identity federation as the modern default.

(Asset: `assets/diagrams/M1.1_L3_gcp_azure_flows.svg`.)

---

## 3. Hands-on (7 min)

Connect a GCP project or Azure subscription:

```
GCP:
1. In ZopNight, choose Workload Identity Federation when adding a GCP project.
2. Apply the offered terraform in a sandbox GCP project.
3. Bind ZopNight's principal to a service account with roles/viewer + billing.
4. Paste the project ID and pool resource name back to ZopNight.
5. Verify connection — should take under 60 seconds after the WI pool is set up.

Azure:
1. In ZopNight, choose Federated Credential when adding an Azure subscription.
2. Create the App Registration with the federated credential pointing at ZopNight.
3. Assign Reader and Cost Management Reader at the subscription or MG scope.
4. Paste tenant ID + app ID back to ZopNight.
5. Verify connection — should take under 60 seconds after permissions propagate.

If either fails, open Permission Visibility (L4) to read which specific service
the credential cannot access. The error path is informative.
```

---

## 4. Knowledge check

### Q1
The modern recommended path for GCP and Azure credentials is:

A. Long-lived service account key files / client secrets
B. Workload Identity Federation (GCP) and Federated Credentials (Azure) — no long-lived credentials in the vault, short-lived tokens fetched at call time
C. SSH keys
D. Username and password

<details>
<summary>Show answer</summary>

**Correct: B.** Federation eliminates long-lived credentials, which is the modern security best practice. ZopNight supports both paths and recommends federation.
</details>

### Q2
For an Azure tenant with 15 subscriptions across two management groups, the most operationally efficient way to give ZopNight broad discovery access is:

A. 15 service principal grants, one per subscription
B. Assign Reader at the management group scope. The service principal inherits to every subscription beneath. Use management groups to scope precisely (e.g., "non-production" MG only).
C. Use ARM templates
D. Wait for Microsoft to do it

<details>
<summary>Show answer</summary>

**Correct: B.** Management group scope inherits to all subscriptions. This is the multi-account analog of AWS Organization scope.
</details>

### Q3
The "read-mostly" model maps to GCP and Azure as:

A. Only works on AWS
B. Same architecture: roles/viewer + billing.viewer on GCP, Reader + Cost Mgmt Reader on Azure — both are read-only baselines. Scoped writes are opt-in via narrow custom roles.
C. Different on each cloud
D. Only works on AWS-compatible clouds

<details>
<summary>Show answer</summary>

**Correct: B.** The architecture is the same across clouds; the cloud-specific knobs differ. The read-only baseline + opt-in scoped writes pattern works on all three.
</details>

---

## 5. Apply

ZopNight's connection wizards offer cloud-specific guidance:

- **[Add GCP](https://app.zopnight.com/cloud-accounts/add?provider=gcp)** — workload identity flow with terraform snippet
- **[Add Azure](https://app.zopnight.com/cloud-accounts/add?provider=azure)** — federated credential flow with portal walkthrough
- **[Documentation](https://docs.zopnight.com/connect)** — full step-by-step for each path

Connection-time errors map cleanly to permission errors via the Permission Visibility drawer (L4 next).

---

## Related lessons

- [L4 — Permission Visibility](L4_permission_visibility.md) *(next)*
- [T3.M3.2 — SAML, Google OAuth, GitHub OAuth](../../T3_zopnight_architect/M3.2_sso/00_README.md)

## Glossary terms touched

[Service Account (GCP)](../../../reference/glossary/service-account-gcp.md) · [Service Principal (Azure)](../../../reference/glossary/service-principal-azure.md) · [Workload Identity Federation](../../../reference/glossary/workload-identity-federation.md) · [Management Group](../../../reference/glossary/management-group.md) · [App Registration](../../../reference/glossary/app-registration.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.1.L3
