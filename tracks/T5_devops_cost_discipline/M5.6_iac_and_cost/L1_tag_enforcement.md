# Tag enforcement in Terraform / CDK / Pulumi

§ T5 · M5.6 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **enforce** tag policy at the IaC layer (Terraform, CDK, Pulumi), **configure** CI/CD validation for tag rules, **and combine** IaC enforcement with auto-tagger to achieve 96%+ coverage.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Prevent untagged resources from ever being provisioned via IaC — catch the issue at PR time, not after the resource exists." |
| **Personas** | Platform Engineer · DevOps Engineer · FinOps Lead |
| **Prerequisites** | M5.1 (tagging) · M5.4 (multi-account) |
| **Time** | 9 minutes |
| **Bloom verb** | Enforce (Apply), Configure (Apply), Combine (Synthesize) |

---

## 1. Concept

Tagging discipline is best enforced at provisioning time. IaC tools can validate tags before resources are created — turning what was "we agreed to tag" into "the code won't deploy without tags." This is the preventive enforcement from M5.1.L2 in concrete form.

```
ENFORCEMENT LADDER (effectiveness):

  REACTIVE (worst)     Manual quarterly cleanup
  DETECTIVE (OK)       Daily scan + auto-tagger
  PREVENTIVE (best)    IaC validation rejects untagged provision
```

The preventive layer is where IaC enforcement lives. Combined with detective (auto-tagger), tag coverage stays at 96%+ indefinitely.

### Terraform — three enforcement layers

```hcl
# LAYER 1 — PROVIDER DEFAULT TAGS
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
# → Every resource in this provider gets these tags automatically.

# LAYER 2 — VARIABLE VALIDATION
variable "environment" {
  type        = string
  description = "Environment: dev / test / stage / prod"
  
  validation {
    condition     = contains(["dev", "test", "stage", "prod"], var.environment)
    error_message = "environment must be one of: dev, test, stage, prod"
  }
}

variable "team" {
  type        = string
  description = "Team identifier (lowercase, hyphen-separated)"
  
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]+$", var.team))
    error_message = "team must be lowercase with hyphens (e.g., 'payment-team')"
  }
}

# LAYER 3 — RESOURCE PRECONDITIONS
resource "aws_instance" "example" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.large"
  
  tags = {
    workload = "ml-training"  # additional tag beyond default
  }
  
  lifecycle {
    precondition {
      condition = (
        contains(keys(self.tags), "environment") &&
        contains(keys(self.tags), "team") &&
        contains(keys(self.tags), "cost_center") &&
        contains(keys(self.tags), "owner")
      )
      error_message = "Resource missing required tags: environment, team, cost_center, owner"
    }
  }
}
```

Three layers compound: defaults set the floor; validation catches typos; preconditions catch missing tags at apply time.

### Default tags inheritance — concrete behavior

```hcl
# In root module
provider "aws" {
  default_tags {
    tags = {
      environment = "prod"
      team        = "payment-team"
      cost_center = "ENG-PAYMENT-001"
      owner       = "payment-team@company.com"
    }
  }
}

# In some-module
resource "aws_instance" "web" {
  ami           = "ami-..."
  instance_type = "t3.medium"
  
  # NO tags block here
}

# Result: instance gets all 4 tags from provider default!
# No per-resource tagging needed.

# If you add per-resource tags:
resource "aws_instance" "ml" {
  ami           = "ami-..."
  instance_type = "p4d.24xlarge"
  
  tags = {
    workload    = "ml-training"
    cost_center = "ML-001"  # OVERRIDES the default
  }
}

# Result: ml instance gets:
#   environment = "prod"        (from default)
#   team        = "payment-team" (from default)
#   cost_center = "ML-001"       (RESOURCE OVERRIDE wins)
#   owner       = "..."         (from default)
#   workload    = "ml-training"  (resource added)
```

The merge behavior: most-specific scope wins for each key.

### CDK enforcement (TypeScript)

```typescript
import { Stack, Tags, Aspects, IAspect, IConstruct } from 'aws-cdk-lib';
import { CfnResource } from 'aws-cdk-lib';

// Layer 1: Apply tags to entire stack
const stack = new Stack(app, 'production-stack');
Tags.of(stack).add('environment', 'prod');
Tags.of(stack).add('team', 'payment-team');
Tags.of(stack).add('cost_center', 'ENG-PAYMENT-001');
Tags.of(stack).add('owner', 'payment-team@company.com');

// Layer 2: Aspect to enforce required tags
class RequireTagsAspect implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      const tags = node.cfnOptions.tags || {};
      const required = ['environment', 'team', 'cost_center', 'owner'];
      const missing = required.filter(t => !(t in tags));
      
      if (missing.length > 0) {
        node.cfnOptions.metadata = {
          ...node.cfnOptions.metadata,
          ValidationError: `Missing required tags: ${missing.join(', ')}`,
        };
      }
    }
  }
}

Aspects.of(stack).add(new RequireTagsAspect());
```

CDK's aspect system is the equivalent of Terraform's preconditions.

### Pulumi enforcement (Python)

```python
import pulumi
from pulumi import ResourceTransformation, ResourceTransformationArgs

REQUIRED_TAGS = ['environment', 'team', 'cost_center', 'owner']
ALLOWED_ENVIRONMENTS = ['dev', 'test', 'stage', 'prod']

def enforce_tags(args: ResourceTransformationArgs):
    if 'tags' not in args.props:
        args.props['tags'] = {}
    
    # Apply defaults
    args.props['tags'].setdefault('environment', 'unknown')
    args.props['tags'].setdefault('team', 'unknown')
    
    # Validate
    tags = args.props['tags']
    missing = [t for t in REQUIRED_TAGS if t not in tags]
    if missing:
        raise ValueError(f"Missing required tags: {missing}")
    
    if tags['environment'] not in ALLOWED_ENVIRONMENTS:
        raise ValueError(f"Invalid environment: {tags['environment']}")
    
    return pulumi.ResourceTransformationResult(
        props=args.props,
        opts=args.opts,
    )

pulumi.runtime.register_stack_transformation(enforce_tags)
```

Pulumi's transformation system applies the rule org-wide.

### Pre-commit + CI/CD validation

Beyond IaC framework features, add explicit validation in CI:

```yaml
# .github/workflows/terraform.yml
name: Terraform Validation

on:
  pull_request:
    paths:
      - '**/*.tf'
      - '**/*.tfvars'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Terraform Validate
        run: terraform validate
      
      - name: Custom Tag Validation
        run: python scripts/validate_tags.py terraform/
      
      - name: tflint
        uses: terraform-linters/setup-tflint@v3
        run: tflint --recursive
```

```python
# scripts/validate_tags.py
import sys
import re
from pathlib import Path

REQUIRED_TAGS = {'environment', 'team', 'cost_center', 'owner'}
ALLOWED_ENVS = {'dev', 'test', 'stage', 'prod'}

def check_tf_file(path):
    content = Path(path).read_text()
    errors = []
    
    # Find all resource blocks and check for tags
    # (simplified; real validation uses proper TF parser)
    for resource_match in re.finditer(r'resource "(\w+)" "(\w+)" \{([^}]+)\}', content, re.DOTALL):
        resource_type = resource_match.group(1)
        resource_name = resource_match.group(2)
        resource_body = resource_match.group(3)
        
        # Skip resources that don't support tags
        if not supports_tags(resource_type):
            continue
        
        # Check for tag presence
        if 'tags' not in resource_body and 'default_tags' not in resource_body:
            errors.append(f"{path}: {resource_type}.{resource_name} missing tags block")
    
    return errors

if __name__ == '__main__':
    errors = []
    for tf in Path(sys.argv[1]).rglob('*.tf'):
        errors.extend(check_tf_file(tf))
    
    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        sys.exit(1)
```

The script catches resources missing tags before merge.

### Cloud-native policy as additional layer

```
AWS:
  Service Control Policies (SCPs) - cannot create without tags
  AWS Organizations Tag Policies - require specific tag keys
  Config Rules - flag resources missing tags
  
GCP:
  Organization Policy Service - constraints
  Resource Manager Policy
  
AZURE:
  Azure Policy - "deny resources without tags"
  
DEFENSE IN DEPTH:
  IaC validation (catches PR-level)
  Cloud-native policy (catches console-level)
  Auto-tagger (catches whatever slips through)
  
Combined coverage: 99%+
```

The cloud-native layer catches resources created outside IaC (console, CLI, scripts).

### Effects of IaC-enforced tagging

```
BEFORE ENFORCEMENT:
  30-40% of new resources missing required tags
  Manual cleanup needed monthly
  Reports unreliable for new resources
  Engineers don't internalize the policy

AFTER ENFORCEMENT:
  100% of IaC-provisioned resources have tags (mandatory at PR)
  Only manual cloud-console provisioning misses
  Auto-tagger handles those (M5.1.L4)
  Engineers see policy at PR time; internalize quickly
  
COVERAGE TRAJECTORY (typical):
  Pre-enforcement:           70-80% coverage
  Week 1 (rollout):           78%
  Week 4:                     85%
  Week 12 (auto-tagger):      94%
  Steady state:               96-99%
```

The trajectory: IaC enforcement gets you to ~85% quickly; auto-tagger closes the gap.

### Common pitfalls

```
PITFALL                              MITIGATION
──────────────────────────────────────────────────────────────────
Validation rules too strict          Phase rollout
Existing TF code doesn't pass        Apply to NEW resources first
                                      Backfill existing gradually
                                      
Validation rules out of sync         Single source of truth
across modules                       (shared module imports validation)
                                      
Tag-policy.yaml vs validation.tf      Auto-generate validation from
inconsistent                          policy YAML
                                      
Engineers bypass via console          Cloud-native policy + auto-tagger
                                      
Default tags override desired         Document precedence
per-resource                          Resource-level always wins
                                      
Validation slow CI runs               Cache; lint per-file
```

Most pitfalls are about insufficient automation or process gaps.

---

## 2. Demo

A team's 4-week tag enforcement rollout:

```
TEAM: 50-engineer SaaS, mostly Terraform

WEEK 0 — DEFINE POLICY:
  Document required tags + values in platform-repo:
    REQUIRED:
      environment: dev / test / stage / prod
      team: <from approved list>
      cost_center: <from finance list>
      owner: email
    PUBLISH: tag-policy.yaml in platform repo
    COMMUNICATE: #eng-platform announcement

WEEK 1 — PROVIDER DEFAULTS:
  Update Terraform modules:
    Add default_tags block per provider
    Variable validations for environment + team
  Push as a non-breaking change
  
  Engineers see: their new resources auto-tagged
  No PR breakage (default tags fill gaps)

WEEK 2 — VARIABLE VALIDATION:
  Add validation blocks for variables
  Catch typos at terraform plan time
  
  Engineers see: PR feedback for invalid values
  Quick to fix

WEEK 3 — PRE-COMMIT + CI:
  Add validate_tags.py to CI pipeline
  Pre-commit hook for local validation
  
  Engineers see: PR blocks if missing tags
  Onboarding doc updated

WEEK 4 — CLOUD-NATIVE POLICY:
  AWS SCPs require tags on EC2, RDS, S3, EBS
  Catches console-created resources
  Console users see clear error: "Tags required"

RESULTS (week 6 audit):
  Tag coverage on new resources: 100%
  Tag coverage on existing resources: 92% (auto-tagger working)
  Overall org coverage: 96%
  
  Engineers internalized policy in 2-3 PRs each
  No major friction; some confusion in week 1 (resolved)
```

The trajectory: 4 weeks of focused work; 96%+ coverage indefinite.

---

## 3. Hands-on (5 min)

Add tag enforcement to your IaC:

```
□ STEP 1: Identify your IaC stack
  □ Terraform   □ CDK   □ Pulumi   □ CloudFormation

□ STEP 2: Check current state
  Do you have provider default_tags? □ Yes □ No
  Do you have variable validation? □ Yes □ No
  Do you have CI validation? □ Yes □ No
  Cloud-native policy? □ Yes □ No

□ STEP 3: Pick first improvement
  □ Add provider default_tags (highest leverage)
  □ Add variable validation
  □ Add CI validation script
  □ Add cloud-native policy

□ STEP 4: Test on sample resource
  Create test resource with intentionally bad tag
  Verify validation catches it

□ STEP 5: Roll out gradually
  Week 1: One module
  Week 2: All modules
  Week 3: CI + cloud-native
```

A 30-minute audit reveals which layer is missing. Each layer takes ~1 week to add.

---

## 4. Knowledge check

### Q1
Tag enforcement at provider default_tags level:

A. Per-resource override only
B. Every resource managed by that provider configuration inherits the default tags. Override per-resource only when needed. This is the highest-leverage tagging pattern — set once at provider scope; every resource benefits.
C. Random
D. Doesn't work in production

<details>
<summary>Show answer</summary>

**Correct: B.** Provider-level defaults cascade to all resources in scope.
</details>

### Q2
CI/CD validation of tags:

A. Optional nice-to-have
B. Catches missing/invalid tags before merge. Prevents drift at the source. Combined with IaC framework validation: 100% coverage on new resources. The few minutes of CI time pay back in months of cleanup avoided.
C. Random
D. Manual only

<details>
<summary>Show answer</summary>

**Correct: B.** CI validation = preventive enforcement.
</details>

### Q3
Cloud console provisioning (outside IaC):

A. Always tagged correctly
B. Often missed — IaC enforcement only covers IaC-provisioned. Auto-tagger fills gaps post-fact; cloud-native policy (SCPs, Azure Policy) prevents at the console layer. Defense-in-depth: IaC + policy + auto-tagger together.
C. Random
D. Discovery handles it automatically

<details>
<summary>Show answer</summary>

**Correct: B.** Manual provisioning is the gap; layered enforcement closes it.
</details>

---

## 5. Apply

Terraform default_tags + variable validation + CI script + cloud-native policy + auto-tagger = 96%+ coverage.

For your team: start with provider default_tags (highest leverage). Add layers over 4 weeks.

---

## Related lessons

- [L2 — Drift detection in IaC](L2_drift.md) *(next)*
- [L3 — Pre-merge cost estimation](L3_pre_merge.md)
- [L4 — Blast-radius reduction](L4_blast_radius.md)
- [M5.1 — Tagging strategy](../M5.1_tagging_strategy/00_README.md)
- [M5.1.L3 — Tag inheritance](../M5.1_tagging_strategy/L3_inheritance.md)

## Glossary terms touched

[IaC tag enforcement](../../../reference/glossary/iac-tag-enforcement.md) · [Default tags](../../../reference/glossary/default-tags.md) · [Variable validation](../../../reference/glossary/variable-validation.md) · [Preventive enforcement](../../../reference/glossary/preventive-enforcement.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.6.L1
