# Inheritance, propagation, defaults

§ T5 · M5.1 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** tag inheritance at the IaC + cloud-org level, **resolve** inheritance vs override conflicts predictably, **and explain** the inheritance limits across AWS / GCP / Azure.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Use inheritance to scale tagging without making every engineer set every tag on every resource." |
| **Personas** | Platform Engineer · FinOps Lead · DevOps Engineer |
| **Prerequisites** | M5.1.L1 · M5.1.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Resolve (Analyze), Explain (Understand) |

---

## 1. Concept

Tag inheritance: parent-scoped tags propagate to children. Saves explicit tagging on every child resource and reduces the chance of drift. The pattern: set the tag once at the highest scope; let it cascade.

```
INHERITANCE BY CLOUD:

AWS:
  Org-level tags        → limited inheritance via Tag Policies
  Account-level (SCP)   → applied to all resources in account
  VPC / subnet tags     → some resource types inherit
  Resource-level        → explicit, overrides defaults
  
GCP:
  Folder labels         → inherit to projects (most)
  Project labels        → inherit to most resources
  Resource labels       → explicit, overrides defaults
  
Azure:
  Management group tags → inherit to subscriptions
  Subscription tags     → inherit to resource groups
  Resource group tags   → inherit to resources within (mostly)
  Resource-level        → explicit
```

The strongest leverage is at the highest stable scope (provider/account/folder), not per-resource.

### Default tags at provider level (IaC)

Most IaC systems support "default tags" applied automatically to every resource managed under that provider configuration:

```hcl
# AWS Terraform
provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      environment = var.environment
      team        = var.team
      cost_center = var.cost_center
      owner       = var.owner
      managed-by  = "terraform"
    }
  }
}

# Every aws_* resource in this provider block inherits these 5 tags.
# Reduces the per-resource tags block to just resource-specific tags.
```

```hcl
# GCP Terraform
provider "google" {
  project = var.project_id
  default_labels = {
    environment = var.environment
    team        = var.team
    cost-center = var.cost_center
    owner       = var.owner
  }
}
```

```typescript
// AWS CDK (TypeScript)
import { Stack, Tags } from 'aws-cdk-lib';

const stack = new Stack(app, 'my-stack');
Tags.of(stack).add('environment', 'prod');
Tags.of(stack).add('team', 'payment');
Tags.of(stack).add('cost_center', 'ENG-001');
Tags.of(stack).add('owner', 'payment-team@company.com');

// All resources in this stack inherit these tags.
```

```python
# Pulumi (Python)
import pulumi

pulumi.runtime.register_stack_transformation(
    lambda args: pulumi.ResourceTransformationResult(
        props={**args.props, "tags": {
            "environment": environment,
            "team": team,
            "cost_center": cost_center,
            "owner": owner,
            **(args.props.get("tags") or {})
        }},
        opts=args.opts,
    )
)
```

Each IaC system has its mechanism. The pattern is consistent: define once at provider/stack/project scope; every child resource gets the tags.

### Per-resource additions and overrides

Provider defaults don't preclude per-resource customization:

```hcl
resource "aws_instance" "ml_training" {
  ami           = "ami-..."
  instance_type = "p4d.24xlarge"
  
  tags = {
    # Resource-specific additions (defaults still apply)
    workload    = "ml-training-large"
    expires-on  = "2026-12-31"
    
    # Override defaults if needed
    cost_center = "ML-001"  # different from default ENG-001
  }
}

# Result: this instance gets the merged tag set:
#   environment = "prod"             (from default)
#   team        = "payment"           (from default)
#   cost_center = "ML-001"            (resource override)
#   owner       = "payment-team@..."  (from default)
#   managed-by  = "terraform"         (from default)
#   workload    = "ml-training-large" (resource addition)
#   expires-on  = "2026-12-31"        (resource addition)
```

### How inheritance works at scale — the chain

```
ORG → ACCOUNT → VPC → RESOURCE

Tags propagate downward. A specific resource sees all tags from its
parent chain unless explicitly overridden at a lower scope.

EXAMPLE:
  Org tag:      company = acme
  Account tag:  environment = prod
  VPC tag:      network-tier = public
  Resource tag: workload = payments
  
  Final resource tags:
    company = acme          (from org)
    environment = prod      (from account)
    network-tier = public   (from VPC)
    workload = payments     (from resource)
  
  Reports can group by ANY of these levels.
```

The deeper the scope, the more specific the tag. Cost reports can pivot at any level.

### Inheritance limits — known gotchas

```
AWS:
  Not all resource types support default_tags
  ASG-launched instances inherit only with launch template tag propagation
  Lambda + CloudWatch have separate tag stores
  Org-level tags propagate only to "supported resources" (check docs)
  
GCP:
  Labels inherit project → resource for most services
  Some legacy services (e.g., BigQuery datasets) handle labels differently
  Folder labels don't inherit to resources directly (only to projects)
  
AZURE:
  Resource group tag inheritance is NOT automatic for resources within
  Must explicitly inherit via Azure Policy or Terraform helper
  This catches many teams off guard
```

```
CROSS-ACCOUNT inheritance:
  Limited or nonexistent across most clouds
  Each account is its own boundary; tags don't auto-cross
  
WORKAROUND:
  Use IaC variable propagation (same provider config across accounts)
  Or central tag-management service (custom Lambda / CloudCustodian)
```

Check cloud documentation for the specific behavior; assumptions burn engineers.

### Conflict resolution — what wins

When inheritance + override conflict, the rule is precedence:

```
PRECEDENCE (most specific wins):
  1. Resource-level explicit tag
  2. Stack / module-level default
  3. Provider-level default
  4. Account-level (if inheritable)
  5. Org-level (if inheritable)

SCENARIO:
  Default tag (provider):  environment = prod
  Resource override:        environment = staging
  
  RESULT: environment = staging (resource override wins)

SCENARIO:
  Default tag (provider):  team = platform
  Module variable:          team = "payment-team" (passed to module)
  Resource explicit:        (none set)
  
  RESULT: team = payment-team (module variable wins over provider default
                                because module passes via var.tags)
```

The precedence is consistent across IaC tools. Test on a sample resource before assuming.

### Pattern — module-based tagging

Larger orgs use a shared module to enforce tagging:

```hcl
# modules/tagged_resource/main.tf
variable "team"        { type = string }
variable "environment" { type = string }
variable "cost_center" { type = string }
variable "owner"       { type = string }
variable "extra_tags"  { type = map(string); default = {} }

locals {
  tags = merge(
    {
      team        = var.team
      environment = var.environment
      cost_center = var.cost_center
      owner       = var.owner
      managed-by  = "terraform"
    },
    var.extra_tags
  )
}

# Every resource that uses this module gets the merged tag set.
```

The module is the contract — change the module, every consumer inherits the new behavior on next apply.

### Default tags in cloud-native policy

Beyond IaC, cloud-native policy can require tags at provision:

```
AWS:
  AWS Organizations Tag Policies (declarative)
  Service Control Policies (SCPs) require tag presence
  Resource Groups Tagging API (apply tags org-wide)
  
GCP:
  Organization Policy Service (constraints)
  Tag values inheritable through folder hierarchy
  
AZURE:
  Azure Policy with "inherit-from-resource-group" effect
  Sets tags on resources within a resource group
```

Policy-as-code at the cloud level catches console-created resources that bypass IaC.

### What inheritance can't do

```
✗ Tag immutability — tags can be edited per-resource post-provision
  (Solution: drift detection, M5.1.L4)
  
✗ Cross-account inheritance (without custom plumbing)
  (Solution: shared IaC modules + central tag-management service)
  
✗ Tags on imported resources (existing infra without tags)
  (Solution: auto-tagger backfill, M5.1.L2)
  
✗ Tags via console/CLI bypass IaC
  (Solution: cloud policy + auto-tagger)
```

Inheritance is a tool, not a complete solution. Combine with drift detection and policy enforcement.

---

## 2. Demo

A team's complete tag inheritance setup:

```
TEAM: payment-team, AWS-only, Terraform-based IaC

PROVIDER LEVEL (in terraform/providers.tf):
  provider "aws" {
    region = "us-east-1"
    default_tags {
      tags = {
        team        = "payment-team"
        environment = var.environment  # dev / test / stage / prod
        cost_center = "ENG-PAYMENT-001"
        owner       = "payment-team@company.com"
        managed-by  = "terraform"
      }
    }
  }

MODULE LEVEL (for ML cluster within payment-team):
  module "ml_inference" {
    source = "../modules/ml-cluster"
    
    # Override or add module-specific tags
    extra_tags = {
      workload     = "ml-inference"
      data-class   = "internal"
      expires-on   = "2026-12-31"
    }
  }

RESOURCE LEVEL (specific override for one big GPU):
  resource "aws_instance" "ml_training_p4d" {
    instance_type = "p4d.24xlarge"
    tags = {
      workload      = "ml-training-large"
      cost-warning  = "high-cost-resource"
      approver      = "cfo-required"
    }
  }

RESULT for ml_training_p4d resource:
  Inherited from provider:
    team        = payment-team
    environment = prod
    cost_center = ENG-PAYMENT-001
    owner       = payment-team@company.com
    managed-by  = terraform
  
  From resource block (additions):
    workload     = ml-training-large
    cost-warning = high-cost-resource
    approver     = cfo-required

  Total tags on the p4d instance: 8
  Engineer wrote: 3 tags in the resource block
  Inheritance provided: 5 tags automatically

LEVERAGE:
  Adding a new resource: 3 lines of resource-specific tags
  vs. 8 lines if everything was explicit
  
  Changing cost_center org-wide: 1 line in provider config
  vs. ~10,000 resource updates
```

The inheritance pattern is the leverage. One provider change updates the entire estate on next apply.

---

## 3. Hands-on (5 min)

Configure inheritance for your IaC:

```
□ STEP 1: Identify your IaC stack
  □ Terraform    □ CDK    □ Pulumi    □ CloudFormation    □ Other

□ STEP 2: Add provider-level defaults
  For Terraform AWS:
    provider "aws" {
      default_tags { tags = { ... } }
    }
  
  Tags to add: __________________________

□ STEP 3: Test inheritance on a sample resource
  Provision a test resource
  Inspect actual tags applied:
    aws ec2 describe-instances --instance-ids ... \
      --query 'Reservations[].Instances[].Tags'
  
  Confirm all 4 MVT tags present.

□ STEP 4: Document the inheritance model for your team
  Where do tags live: provider / module / resource?
  Override rules: where can you override?
  Required modules: any shared tagging module?

□ STEP 5: Identify gaps
  Which resource types DON'T inherit default tags?
  Plan for those (custom logic, policy-as-code)
```

Most teams find 2-3 resource types that don't inherit cleanly. Document and handle those explicitly.

---

## 4. Knowledge check

### Q1
Default tags in Terraform AWS provider apply to:

A. Just the next resource
B. All AWS resources defined in that provider block. Saves explicit tagging on every resource. The strongest leverage is setting tags at the highest stable scope (provider/account); per-resource overrides handle exceptions.
C. Random
D. Don't work

<details>
<summary>Show answer</summary>

**Correct: B.** Provider-level defaults inherit to every resource in scope.
</details>

### Q2
Resource-level explicit tag vs provider-level default for the same key:

A. Provider wins
B. Resource-level wins for the specified key (most-specific wins). The resource can ADD new tags AND override defaults. Combine inheritance for the common case with overrides for the exceptions.
C. Random
D. Both apply (duplicated)

<details>
<summary>Show answer</summary>

**Correct: B.** Resource override wins; most-specific scope precedence.
</details>

### Q3
Cross-account inheritance (AWS):

A. Full inheritance
B. Limited. Org-level tags don't fully cascade to per-account resources without help from AWS Organizations Tag Policies, Service Control Policies, or shared IaC modules. Each account is its own boundary; cross-account requires explicit plumbing.
C. Random
D. Yes, always

<details>
<summary>Show answer</summary>

**Correct: B.** Limited; use shared modules or central tag service.
</details>

---

## 5. Apply

Configure default tags at the IaC provider/stack scope. Document the override rules. Test on a sample resource. Use shared modules for org-wide consistency.

For your team: spend 2 hours setting up inheritance once; save dozens of hours of per-resource tag boilerplate annually.

---

## Related lessons

- [L1 — Tags as organizational debt](L1_org_debt.md)
- [L2 — Minimum viable tag set (MVT)](L2_mvt.md)
- [L4 — Drift detection + remediation](L4_drift_detection.md) *(next)*
- [L5 — Reorg-proof tagging](L5_reorg_proof.md)
- [M5.6.L1 — IaC tag enforcement](../M5.6_iac_and_cost/L1_tag_enforcement.md)

## Glossary terms touched

[Tag inheritance](../../../reference/glossary/tag-inheritance.md) · [Provider default tags](../../../reference/glossary/provider-default-tags.md) · [Tag precedence](../../../reference/glossary/tag-precedence.md) · [Shared tagging module](../../../reference/glossary/shared-tagging-module.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.1.L3
