# Recipe 11 — Region drift

§ T6 · M6.4 · Recipe 11 of 15 · Engineer tier · 3 min

## Intent

Find resources running in regions outside your organization's approved region list. Drift can happen via Terraform mistakes, autoscaler config, or engineer convenience — leads to compliance + cost surprises.

## Prompt to AI agent

```
"My approved regions are us-east-1, us-west-2, eu-west-1. List any
resources running in OTHER regions. Show resource type, region, owner,
and monthly cost."
```

## MCP tools used

```
list_resources(filters={"region NOT IN": ["us-east-1","us-west-2","eu-west-1"]})
get_resource details for each
```

## Expected output

```
RESOURCES IN UNAPPROVED REGIONS:

Resource              Type    Region        Owner             Cost/mo
─────────────────────────────────────────────────────────────────────
i-0abc123             ec2     ap-south-1    rohan@platform   $84
i-0def456             ec2     ap-south-1    rohan@platform   $84
rds-test-mumbai       rds     ap-south-1    rohan@platform   $190
i-0ghi789             ec2     us-east-2     ops@team         $42
my-test-bucket        s3      ca-central-1  (untagged)       $12

5 resources outside approved regions. Total: $412/mo.

ANALYSIS:
  - ap-south-1: 3 resources owned by rohan@platform
    Investigate: is this approved for a regional pilot?
  - us-east-2: 1 resource, likely a typo (us-east-1 intended?)
  - ca-central-1: untagged S3 bucket; orphan

RECOMMENDED ACTION:
  1. Confirm ap-south-1 status with rohan@platform
  2. Migrate or terminate us-east-2 resource
  3. Investigate orphan S3 bucket — delete or owner-tag
```

## Variations

```
"Resources in disabled regions"
"Resources in regions with no team deployment policy"
"Compare region distribution vs last quarter — was there drift?"
"List the data-residency status of resources by region"
```

## When to use

Quarterly compliance review. Pre-audit prep. After regulator inquiries.

---

§ Recipe 11 · Last reviewed 2026-05-20
