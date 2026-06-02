# AWS Organizations, GCP Folders, Azure Management Groups

§ T3 · M3.4 · L2 of 5 · Architect tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **map** each cloud's organizational primitives (AWS Organizations, GCP Folders/Projects, Azure Management Groups/Subscriptions), **explain** how the hierarchy enables inheritance, **and predict** how ZopNight integrates at each level.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Set up the cloud hierarchy once, in a way that ZopNight (and IAM, and billing) all understand." |
| **Personas** | Platform Engineer · Cloud Architect · Security/Compliance |
| **Prerequisites** | M3.4.L1 — Why multi-account |
| **Time** | 10 minutes |
| **Bloom verb** | Map (Apply), Explain (Understand), Predict (Analyze) |

---

## 1. Concept

Each major cloud provides organizational primitives for managing multiple accounts/projects/subscriptions in a hierarchy. The primitives differ in naming and detail but follow the same conceptual pattern: a tree, with policies inheriting from higher levels to lower.

```
PROVIDER     ORGANIZATIONAL PRIMITIVE         HIERARCHY
──────────────────────────────────────────────────────────────────
AWS          AWS Organizations                Root → OU → Account
GCP          Folder + Project                 Org → Folder → Project
Azure        Management Group + Subscription  Tenant → MG → Sub
```

Understanding each cloud's hierarchy is foundational for ZopNight integration — the integration entry point differs by cloud, and the discovery surface depends on where you connect.

### AWS Organizations

```
ROOT (top-level)
  ├── OU "Production"
  │   ├── prod-account-1
  │   ├── prod-account-2
  │   └── prod-shared
  └── OU "Non-production"
      ├── dev-account
      ├── staging-account
      └── sandbox-account
```

**Concepts:**
- **AWS Organizations**: the top-level container that owns multiple AWS accounts.
- **OU (Organizational Unit)**: a folder-like grouping of accounts. Service Control Policies (SCPs) at the OU level apply to all accounts in the OU.
- **Account**: the actual cloud account; holds resources.
- **Management account**: the account that created the Organization; billing aggregation lives here, and cross-account roles are typically issued from here.

**ZopNight integration:** Connect at the management-account level. ZopNight uses cross-account assume-role to reach each member account. One IAM role per account (deployed via CloudFormation StackSet for fleet rollout) is the standard pattern.

### GCP Folders + Projects

```
ORGANIZATION (example.com)
  ├── FOLDER "Production"
  │   ├── prod-platform     (project)
  │   ├── prod-product      (project)
  │   └── prod-shared       (project)
  └── FOLDER "Non-production"
      ├── dev-platform      (project)
      ├── staging-product   (project)
      └── sandbox           (project)
```

**Concepts:**
- **Organization**: the top-level GCP entity tied to a domain.
- **Folder**: a grouping of projects (and sub-folders); supports policies that inherit.
- **Project**: the unit of resources, billing, and IAM. Every resource lives in a project.

**ZopNight integration:** Connect at the organization level via a service account with `organization-viewer` (or equivalent) role. ZopNight discovers all projects automatically. The integration uses Workload Identity Federation (recommended) or a service-account JSON key (legacy).

### Azure Management Groups

```
TENANT (example.com)
  ├── MG "Production"
  │   ├── prod-eu          (subscription)
  │   └── prod-us          (subscription)
  └── MG "Non-production"
      ├── dev              (subscription)
      └── staging          (subscription)
```

**Concepts:**
- **Tenant**: the top-level Azure AD identity boundary for an organization.
- **Management Group (MG)**: a grouping of subscriptions; supports policies that inherit.
- **Subscription**: the billing and resource container — equivalent to an AWS account or GCP project.

**ZopNight integration:** Connect at the tenant or root MG level via a service principal (Azure AD application) with Reader role. ZopNight discovers all subscriptions in scope. The service principal authenticates via OAuth client-credentials flow.

### The hierarchy enables three things

The reason each cloud built these primitives is to enable three properties:

```
1. INHERITANCE
   Policies, tags, and budgets defined at higher levels apply to
   all descendants. "Production OU has SCP forbidding region X" —
   every account in the OU inherits the restriction.
   
2. BILLING ROLLUP
   Cost can be aggregated at any level. Org-wide totals, per-OU
   subtotals, per-account details — all derived from the same
   underlying billing records.
   
3. ACCESS CONTROL
   Permissions at higher levels grant on all lower levels. An IAM
   role at the Organization level can act on any descendant
   account; team-specific access is granted at the OU/Folder/MG
   level.
```

These three properties are why the hierarchy matters more than just "a way to group accounts."

### How ZopNight respects the hierarchy

ZopNight's data model preserves the cloud-side hierarchy:

```
DISCOVERY      Walks the hierarchy from the top connection point.
              Surfaces accounts/projects/subscriptions as ZopNight
              "cloud accounts."
              
COST ROLLUP    Aggregates from leaf (account/project/subscription)
              upward. Reports allow drill from org → folder/OU/MG
              → account → resource.
              
TAG VISIBILITY Tags applied at higher levels (via cloud-side
              policy) inherit downward and are visible in ZopNight
              with their inherited provenance.
              
TEAM MAPPING   ZopNight teams can be mapped to OU / Folder / MG.
              A "platform" team mapping to the "platform" folder
              picks up all projects automatically.
```

The result: configuring the hierarchy correctly at the cloud level means ZopNight inherits the structure without per-account reconfiguration.

### Multi-cloud orgs

Many customers operate across multiple clouds. The patterns combine:

```
AWS Organization     →  ZopNight cloud-accounts (one per AWS account)
GCP Organization     →  ZopNight cloud-accounts (one per project)
Azure Tenant         →  ZopNight cloud-accounts (one per subscription)

ZopNight org sees the union, organized by provider.
```

A mid-size customer might have an 8-account AWS Organization, a 12-project GCP Organization, and a 6-subscription Azure tenant — 26 cloud-accounts total in ZopNight, all under one ZopNight org.

### Cost-allocation tags vs hierarchy

A common question: "should I use tags or hierarchy for cost allocation?" The answer is both, at different granularities.

```
HIERARCHY level     Coarse — per-team, per-environment, per-region
TAG level           Fine — per-application, per-feature, per-cost-center

Use hierarchy for boundaries that are infrequent and structural.
Use tags for attributes that change frequently and apply within
an account.
```

A platform team's prod account has one place in the hierarchy. Within it, tags identify which application owns each resource. The two layers compose.

### How ZopNight uses it

ZopNight's Cloud Accounts page lists every connected account/project/subscription with its hierarchy path. Reports allow filtering by OU/Folder/MG. The "Org tree" view (Reports → Org tree) visualizes the hierarchy with per-node spend rollup.

```
ORG TREE VIEW EXAMPLE:
  Acme Corp (AWS Org)
    Production OU                            $1.2M/mo
      prod-platform-account                   $640K/mo
      prod-product-account                    $360K/mo
      prod-shared                              $200K/mo
    Non-production OU                         $180K/mo
      dev-account                              $80K/mo
      staging-account                          $60K/mo
      sandbox-account                          $40K/mo
```

This view answers "where does our money actually go" in one screen.

---

## 2. Demo

A multi-cloud enterprise wiring up to ZopNight:

```
ENTERPRISE:
  8 AWS accounts under one AWS Organization
  12 GCP projects under one Org with 3 folders
  6 Azure subscriptions under one tenant with 2 MGs

ZOPNIGHT SETUP:

AWS:
  Step 1: Connect ZopNight to AWS Organization at the management
          account level
  Step 2: Deploy ZopNight-Discovery IAM role to all 8 accounts
          via CloudFormation StackSet (single deploy)
  Step 3: ZopNight discovers all 8 accounts; each appears as a
          cloud-account entry
  RESULT: 8 ZopNight cloud-accounts, one per AWS account

GCP:
  Step 1: Create a service account at the organization level
  Step 2: Grant organization-viewer role to the service account
  Step 3: Connect ZopNight with the service-account credentials
  Step 4: ZopNight discovers all 12 projects automatically
  RESULT: 12 ZopNight cloud-accounts, one per GCP project

Azure:
  Step 1: Register an Azure AD application (service principal)
  Step 2: Grant Reader role at the tenant or root MG level
  Step 3: Connect ZopNight with tenant_id + app_id + secret
  Step 4: ZopNight discovers all 6 subscriptions
  RESULT: 6 ZopNight cloud-accounts, one per subscription

GRAND TOTAL: 26 cloud-accounts under one ZopNight organization
COST ROLLUP: org-wide view across all three providers + per-
              provider, per-OU/folder/MG, per-account drill
```

A unified view across three clouds, three hierarchies, 26 accounts.

---

## 3. Hands-on (6 min)

Map your own cloud presence:

```
PROVIDER 1: __________ (e.g., AWS)
  Top-level entity:    __________ (Organization name)
  Hierarchy structure:
    __________________________________________________________
  
  Account count:        _____
  Connected to ZopNight: Yes / No
  Connection method:    __________ (assume-role / direct / other)

PROVIDER 2: __________ (e.g., GCP)
  Top-level entity:    __________
  Hierarchy structure:
    __________________________________________________________
  Project count:        _____
  Connected to ZopNight: Yes / No
  Connection method:    __________

PROVIDER 3 (if any): __________
  Hierarchy:           __________
  Resource count:       _____
  Connected:           Yes / No

TOTAL ZopNight cloud-accounts: _____
  Matches actual cloud-side account count? Yes / No
  If no — what's missing?
    __________________________________________________________
```

If your ZopNight cloud-account count is lower than your actual cloud-side count, some accounts are not connected — investigate.

---

## 4. Knowledge check

### Q1
For AWS Organizations, ZopNight connects:

A. To each account individually
B. To the management account via cross-account assume-role across all member accounts. One management-side connection point; one IAM role per member account; ZopNight discovers all of them. CloudFormation StackSet is the standard deployment vehicle for the per-account IAM roles.
C. Via VPC peering
D. Region-by-region

<details>
<summary>Show answer</summary>

**Correct: B.** Org-level connection with assume-role is the canonical pattern. It scales — adding a new AWS account means deploying the IAM role to it (auto-deployed via StackSet) and ZopNight picks it up.
</details>

### Q2
A GCP service account at the organization level with organization-viewer role:

A. Cannot access projects
B. Has read access to all projects in the org (and any new projects added later). ZopNight uses this single credential to discover and report across the entire GCP footprint. No per-project credential required.
C. Needs additional per-project credentials
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Org-level access cascades. This is the GCP advantage over AWS for centralized discovery — fewer credentials to manage.
</details>

### Q3
Azure Management Groups:

A. Are flat (no hierarchy)
B. Form a hierarchy: tenant → MG → subscription. Policies, role assignments, and tags at higher levels apply to all descendants. ZopNight respects this hierarchy in its reporting and discovery.
C. Are deprecated
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** MGs are Azure's hierarchical primitive. The root MG is implicit; everything else nests beneath it.
</details>

---

## 5. Apply

Inspect your hierarchy in [Settings → Cloud Accounts](https://app.zopnight.com/settings/cloud-accounts). The "Org tree" view shows the connected accounts grouped by their cloud-side hierarchy with per-node spend rollup. Use this view as the canonical map of your cloud estate.

For mature orgs, document the hierarchy in your team wiki — knowing "platform team's prod workloads live in OU X / account Y / region Z" is the kind of context that gets lost without explicit documentation.

---

## Related lessons

- [L1 — Why multi-account](L1_why_multi.md)
- [L3 — Cross-account discovery](L3_cross_account_discovery.md) *(next)*
- [L4 — Rollup vs isolation](L4_rollup_vs_isolation.md)
- [L5 — Multi-account anti-patterns](L5_antipatterns.md)

## Glossary terms touched

[AWS Organizations](../../../reference/glossary/aws-organizations.md) · [Organizational Unit](../../../reference/glossary/ou.md) · [GCP Folder](../../../reference/glossary/gcp-folder.md) · [Azure Management Group](../../../reference/glossary/azure-management-group.md) · [Service Control Policy](../../../reference/glossary/scp.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.4.L2
