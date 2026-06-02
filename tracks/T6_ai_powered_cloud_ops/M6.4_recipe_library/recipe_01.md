# Recipe 1 — The oldest stopped EC2

§ T6 · M6.4 · Recipe 1 of 15 · Engineer tier · 3 min

## Intent

Find the longest-stopped EC2 instance still incurring storage and snapshot costs.

## Prompt to AI agent

```
"What's the oldest stopped EC2 instance in my account? Show resource ID,
days stopped, and current monthly cost."
```

## MCP tools used

```
list_resources(filters={"type":"ec2","status":"stopped"}, sort="state_changed_at:asc", limit=1)
get_resource_cost_history(resource_uid=<top>)
```

## Expected output

```
Resource UID:        i-0abc123def456
Type:                ec2 (m5.large, us-east-1)
State:               Stopped
Days stopped:        287 days (since 2025-08-07)
Last user activity:  2025-08-02 (manual stop by ops-team@)
Current monthly cost:
  EBS volumes:         $9.20/mo
  Snapshots:           $4.80/mo
  Total:               $14.00/mo

This resource has been stopped for 287 days. The instance itself
is no longer billing, but attached storage and snapshots are.

RECOMMENDATION: Terminate (with snapshot), free the EBS storage.
```

## Variations

```
"Show me my top 10 oldest stopped resources, all clouds"
"Among stopped EC2 instances, which have the highest storage cost?"
"Which stopped resources have not been touched by anyone in 60+ days?"
```

## When to use

Monthly orphan audit. Quarterly compliance review. Cost-recovery sprints.

---

§ Recipe 1 · Last reviewed 2026-05-20
