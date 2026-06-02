# Recipe 10 — Stopped resources still costing money

§ T6 · M6.4 · Recipe 10 of 15 · Engineer tier · 3 min

## Intent

Find resources in "stopped" state but still billing — attached storage, snapshots, allocated IPs, etc. "Stopped" misleads engineers into thinking the cost is zero.

## Prompt to AI agent

```
"Show me all stopped resources that are still incurring cost. Group
by resource type. Include monthly cost and what specifically is billing."
```

## MCP tools used

```
list_resources(filters={"status":"stopped"})
get_resource_cost_history for each
analyze: which sub-components are billing
```

## Expected output

```
STOPPED-BUT-BILLING RESOURCES:

EC2 (stopped):
  47 instances stopped, but still billing:
    - 280 GB EBS attached: $1,120/mo
    - 47 elastic IPs allocated (some): $34/mo
    - Snapshots of stopped EBS: $480/mo
  TOTAL stopped-EC2 cost: $1,634/mo

RDS (stopped):
  3 instances stopped:
    - 600 GB storage: $138/mo
    - Snapshots: $42/mo
  TOTAL stopped-RDS cost: $180/mo

EBS (unattached):
  18 volumes not attached to any instance:
    Total: $560/mo

SUMMARY:
  Total "stopped" but billing: $2,374/mo
  
RECOMMENDED ACTION FLOW:
  1. Snapshot critical EBS before deletion
  2. Release unattached EIPs
  3. Delete unattached EBS volumes
  4. Consider terminating long-stopped instances
  
  Estimated recoverable: ~$2,000/mo
```

## Variations

```
"Stopped resources in dev accounts only"
"Stopped resources that have been stopped for 90+ days"
"Elastic IPs allocated but not attached to running instances"
"Snapshots without a parent (orphan snapshots)"
```

## When to use

Monthly cost-recovery review. Quarterly cleanup sprint. New-hire onboarding ("here's our waste pattern").

---

§ Recipe 10 · Last reviewed 2026-05-20
