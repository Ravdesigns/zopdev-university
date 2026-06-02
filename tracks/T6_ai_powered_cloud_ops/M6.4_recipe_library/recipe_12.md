# Recipe 12 — Departed-user-created resources

§ T6 · M6.4 · Recipe 12 of 15 · Engineer tier · 3 min

## Intent

Resources created by users who have left the company often go orphaned — no one knows what they were for, no one updates them. Find them.

## Prompt to AI agent

```
"List resources created by users who are no longer active in our org.
Show resource ID, type, creator email, creation date, current cost,
and tag info."
```

## MCP tools used

```
list_users(filters={"status":"deprovisioned"})  
list_resources(filters={"creator IN deprovisioned users"})
get_resource details for each
```

## Expected output

```
ORPHAN RESOURCES (created by departed users):

Resource              Type    Created By           Created     Cost/mo
─────────────────────────────────────────────────────────────────────
i-0abc                ec2     alice@dep (left)     2024-03-01  $40
rds-old-proj          rds     bob@dep (left)       2023-11-10  $190
s3://test-c           s3      carol@dep (left)     2024-01-05  $25
old-load-balancer     elb     dan@dep (left)       2024-06-20  $30
ml-experiment-1       sagemkr eve@dep (left)       2024-08-12  $410

5 resources from 5 departed users. Total: $695/mo.

ANALYSIS:
  - i-0abc: 2 years old, no recent activity — likely safe to delete
  - rds-old-proj: contains data; snapshot before delete
  - s3://test-c: bucket policy review needed (may have data)
  - old-load-balancer: orphan; check for active connections
  - ml-experiment-1: most recent + most expensive; investigate first

RECOMMENDED ACTION FLOW:
  1. Backup any persistent data
  2. Reassign owner OR delete
  3. Update creation policy: require team tag
  4. Document who can decide on orphans
```

## Variations

```
"Resources created by departed users, last 12 months"
"Resources owned by deprovisioned users (current tag)"
"Audit log entries by deprovisioned users (anomalies)"
"Top-cost orphan resources"
```

## When to use

After bulk offboarding event. Quarterly orphan sweep. Annual cost cleanup.

---

§ Recipe 12 · Last reviewed 2026-05-20
