# AWS — the IAM policy and why it's read-mostly

§ T1 · M1.1 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** the AWS IAM role for ZopNight **and explain** which permissions enable read-only discovery versus scoped-write execution.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Get an AWS account into ZopNight in under 10 minutes with the right policy." |
| **Personas** | Platform Engineer · Security/Compliance |
| **Prerequisites** | [L1](L1_vault_credentials.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply) and Explain (Understand) |

---

## 1. Concept

ZopNight connects to AWS via an IAM role with cross-account assume-role trust. The role grants the minimum permissions needed for each capability. The customer can grant or deny each scoped-write capability independently.

### The minimum read-only role

For discovery, metrics, billing, and recommendations — the read-heavy side of the product — the IAM role needs read-only access to a defined set of services. Here is the canonical policy structure:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DiscoveryReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "rds:Describe*",
        "eks:Describe*",
        "eks:List*",
        "ecs:Describe*",
        "ecs:List*",
        "lambda:Get*",
        "lambda:List*",
        "s3:Get*",
        "s3:List*",
        "elasticloadbalancing:Describe*",
        "autoscaling:Describe*",
        "cloudfront:Get*",
        "cloudfront:List*",
        "dynamodb:Describe*",
        "dynamodb:List*",
        "route53:Get*",
        "route53:List*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ResourceExplorer",
      "Effect": "Allow",
      "Action": [
        "resource-explorer-2:Search",
        "resource-explorer-2:List*",
        "resource-explorer-2:Get*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Metrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Pricing",
      "Effect": "Allow",
      "Action": [
        "pricing:DescribeServices",
        "pricing:GetProducts"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BillingReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:Get*",
        "ce:List*",
        "ce:Describe*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ActivityLogs",
      "Effect": "Allow",
      "Action": [
        "cloudtrail:LookupEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

The policy is read-mostly: every action is a `Describe`, `Get`, `List`, or `Lookup`. Nothing mutates state. A customer can deploy this and have full discovery, full reporting, and full recommendations — but no scheduling, no auto-remediation. This is the "monitor mode" baseline.

### The scoped-write extensions

To unlock the act layer (scheduling, auto-remediation), the customer adds specific scoped-write permissions. Each extension is independent and opt-in:

**For scheduling EC2 start/stop:**
```json
{
  "Sid": "EC2StartStop",
  "Effect": "Allow",
  "Action": ["ec2:StartInstances", "ec2:StopInstances"],
  "Resource": "*",
  "Condition": {
    "StringEqualsIfExists": {"aws:ResourceTag/environment": ["dev", "test", "stage"]}
  }
}
```

The condition restricts the action to resources tagged non-prod. A misconfigured ZopNight schedule cannot accidentally stop a production instance — the IAM denies the call before ZopNight executes it.

**For EBS termination (auto-remediation of orphaned volumes):**
```json
{
  "Sid": "EBSOrphanCleanup",
  "Effect": "Allow",
  "Action": ["ec2:DeleteVolume", "ec2:CreateSnapshot"],
  "Resource": "*"
}
```

**For autoscaling policy management:**
```json
{
  "Sid": "AutoscalerPolicyMgmt",
  "Effect": "Allow",
  "Action": [
    "autoscaling:UpdateAutoScalingGroup",
    "autoscaling:PutScalingPolicy",
    "autoscaling:DeletePolicy",
    "autoscaling:PutScheduledUpdateGroupAction",
    "autoscaling:DeleteScheduledAction",
    "application-autoscaling:Put*",
    "application-autoscaling:Delete*",
    "application-autoscaling:Register*",
    "application-autoscaling:Deregister*"
  ],
  "Resource": "*"
}
```

The pattern: each scoped write is a specific action set, optionally constrained by tags or conditions, with the customer's policy as the gate. ZopNight requests are filtered by IAM before they reach the resource.

### The trust policy

The role's trust relationship establishes the cross-account assume-role:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::<zopnight-account>:role/discovery-role"},
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {"sts:ExternalId": "<unique-external-id>"}
    }
  }]
}
```

The external ID is mandatory. It is generated unique per customer organization in ZopNight and prevents the **confused deputy** attack (where one customer's account ID could be used to access another customer's role).

### Why "read-mostly"

Read-only would mean: no scheduling, no auto-remediation, no autoscaler management. The product would be a reporting tool. The customer wants execution. So the term is "read-mostly" — read-only is the baseline, scoped writes are opt-in extensions.

Most customers start in monitor mode (read-only baseline) and gradually enable the scoped writes as they build trust with the product. This is the [progressive autonomy](../../T2_zopnight_engineer/M2.4_vm_autoscaling/00_README.md) pattern at the IAM layer.

### Multi-account topology

For an AWS Organization with many accounts, the canonical setup:

- The role is deployed via CloudFormation StackSet to every member account
- Each role has the same name and same external ID per ZopNight organization
- ZopNight discovers all member accounts as separate cloud accounts under one ZopNight organization

The StackSet approach scales to 100+ accounts without per-account manual setup. ZopNight provides the CloudFormation template directly.

---

## 2. Demo

A typical AWS connection walkthrough:

```
T+0       Customer opens ZopNight → Cloud Accounts → Add AWS Account
T+1 min   ZopNight displays the IAM trust policy + permissions template
T+1 min   Customer copies the CloudFormation template URL
T+2 min   Customer launches in AWS CloudFormation Console
T+3 min   Stack creates the IAM role
T+4 min   Customer pastes role ARN + external ID back to ZopNight
T+4 min   ZopNight validates via STS AssumeRole
T+5 min   Account marked Active; discovery preview begins
```

Five minutes from start to active. The CloudFormation template eliminates manual IAM policy editing.

(Asset: `assets/diagrams/M1.1_L2_aws_connection_flow.svg`.)

---

## 3. Hands-on (6 min)

Connect an AWS account (or audit one already connected):

```
1. In ZopNight, navigate to Cloud Accounts → Add AWS Account.
2. Note the offered CloudFormation template URL.
3. In AWS Console (a sandbox account, not production), launch the stack.
4. Inspect the IAM role created. Verify:
   - Every Action ends with Describe, Get, List, or Lookup
     (unless you elected to enable scoped writes)
   - The trust policy includes the external ID
   - The role name matches the ZopNight-published convention
5. Paste the role ARN back to ZopNight; verify connection in <60 seconds.
6. After connection, open Permission Visibility (covered in L4) and
   confirm Granted across the expected service categories.
```

---

## 4. Knowledge check

### Q1
The AWS IAM role for ZopNight discovery is described as "read-mostly" because:

A. It uses an old API
B. The baseline is read-only across all services needed for discovery, metrics, billing, and recommendations. Scoped writes (StartInstances, StopInstances, DeleteVolume, etc.) are opt-in extensions added by the customer to unlock execution.
C. It only has 50% of the permissions it needs
D. It can only read every other request

<details>
<summary>Show answer</summary>

**Correct: B.** Read-mostly = read-only baseline + opt-in scoped writes. The customer controls which extensions to grant.
</details>

### Q2
The `sts:ExternalId` condition in the trust policy primarily defends against:

A. SQL injection
B. The "confused deputy" attack — where one customer's account could trick ZopNight into accessing another customer's role. The unique external ID per organization makes this structurally impossible.
C. Phishing
D. DoS

<details>
<summary>Show answer</summary>

**Correct: B.** External ID is the canonical defense against the confused deputy pattern in cross-account assume-role. AWS documentation calls this out explicitly.
</details>

### Q3
A team wants ZopNight to schedule EC2 instances tagged `environment=dev` but never anything tagged `environment=prod`. The defensible IAM configuration:

A. Don't grant EC2 start/stop permissions
B. Grant `ec2:StartInstances` and `ec2:StopInstances` with a Condition requiring `aws:ResourceTag/environment` to be in ["dev", "test", "stage"]. The IAM denies any prod-tagged request before ZopNight even attempts the call.
C. Rely on ZopNight to never request prod
D. Use a separate AWS account for dev

<details>
<summary>Show answer</summary>

**Correct: B.** Tag-based IAM conditions are the right tool for this. The defense is at the cloud provider's policy layer, not at the application layer. Even a buggy ZopNight call cannot stop a prod instance if the IAM forbids it.
</details>

---

## 5. Apply

ZopNight publishes the canonical IAM policy and CloudFormation template at:

- **[Cloud Accounts → Add AWS Account](https://app.zopnight.com/cloud-accounts/add?provider=aws)** in the product
- **[Documentation](https://docs.zopnight.com/connect/aws)** for offline review

For organizations adopting StackSet deployment across many accounts:

- The CloudFormation template is StackSet-compatible
- The external ID is the same across all member accounts in one ZopNight organization
- Best practice: deploy via StackSet to a defined OU rather than per-account manual setup

---

## Related lessons

- [L3 — GCP & Azure credentials](L3_gcp_azure_creds.md) *(next)*
- [L4 — Permission Visibility](L4_permission_visibility.md)
- [T2.M2.5 — Adopt-or-replace existing cloud scaling](../../T2_zopnight_engineer/M2.5_adopt_or_replace/00_README.md)

## Glossary terms touched

[IAM role](../../../reference/glossary/iam-role.md) · [Assume-role](../../../reference/glossary/assume-role.md) · [External ID](../../../reference/glossary/external-id.md) · [Confused deputy](../../../reference/glossary/confused-deputy.md) · [CloudFormation StackSet](../../../reference/glossary/cloudformation-stackset.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.1.L2
