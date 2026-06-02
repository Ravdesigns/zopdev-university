# Recipe 2 — RDS instances not in Multi-AZ

§ T6 · M6.4 · Recipe 2 of 15 · Engineer tier · 3 min

## Intent

List production RDS instances NOT configured for Multi-AZ. These are reliability risks and sometimes also cost outliers (Multi-AZ doubles infra cost but adds resilience).

## Prompt to AI agent

```
"List all RDS instances in prod accounts that are NOT in Multi-AZ.
Show DB engine, instance class, region, and monthly cost."
```

## MCP tools used

```
list_resources(filters={"type":"rds", "tag.env":"prod", "multi_az":false})
get_resource details for each
get_resource_cost_history for monthly cost
```

## Expected output

```
RDS NOT in Multi-AZ (production accounts):

DB Instance ID         Engine     Class        Region      Monthly Cost
─────────────────────────────────────────────────────────────────────
prod-orders-db         postgres   db.r5.large  us-east-1   $240/mo
prod-analytics-db      postgres   db.t3.xlarge us-east-1   $190/mo
prod-search-cache      mysql      db.r5.xlarge us-west-2   $390/mo

3 instances. Total monthly cost: $820/mo
Multi-AZ upgrade would cost: ~$820/mo additional ($1,640/mo total)

CONSIDERATIONS:
  - prod-orders-db: critical for revenue, should be Multi-AZ
  - prod-analytics-db: not customer-facing, could stay single-AZ
  - prod-search-cache: cache, easily rebuilt, single-AZ OK
```

## Variations

```
"List all prod databases without backup retention >7 days"
"Which RDS instances are using gp2 storage (could move to gp3)?"
"Show RDS instances with low CPU but high cost — right-sizing candidates"
```

## When to use

Quarterly reliability audit. Pre-launch checklist. DR drill prep.

---

§ Recipe 2 · Last reviewed 2026-05-20
