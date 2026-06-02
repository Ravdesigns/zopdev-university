# Recipe 15 — Ready-to-delete report

§ T6 · M6.4 · Recipe 15 of 15 · Engineer tier · 3 min

## Intent

Generate a consolidated "ready to delete" report combining multiple signals (untagged, orphaned by departed users, stopped for 90+ days, idle Lambdas, etc.) into one actionable list.

## Prompt to AI agent

```
"Generate a 'ready to delete' report. Include resources matching ALL of:
unused for 90+ days, no team tag, no recent audit activity. Sort by
monthly cost descending. Show recommendation: delete or investigate."
```

## MCP tools used

```
list_resources(filters={
  "last_used_at <": "90d_ago",
  "tag.team": null,
  "creator_status": "deprovisioned OR none"
})
get_resource_cost_history for each
list_audit_logs(filters={"resource": each, "time>=":"90d"})
```

## Expected output

```
READY-TO-DELETE REPORT (high-confidence orphans):

Resource              Type      Last Used     Cost/mo    Confidence
─────────────────────────────────────────────────────────────────────
i-0abc123             ec2       2024-09-01    $84        HIGH
vol-0def456           ebs       2024-08-15    $260       HIGH
rds-old-test          rds       2024-10-12    $190       HIGH
s3://team-x-archive   s3        2024-05-20    $180       MEDIUM (data)
old-load-balancer     elb       2024-11-03    $30        HIGH
backup-snap-abc       snap      2024-04-22    $120       MEDIUM (data)
test-lambda           lambda    2024-07-08    $0         LOW (zero cost)

7 resources matching all criteria.
Total monthly cost: $864/mo.

CATEGORIES:
  HIGH confidence (4 resources, $564/mo):
    No data risk. No recent activity. Delete after snapshot.
    
  MEDIUM confidence (2 resources, $300/mo):
    Contains data. Review before deletion.
    
  LOW confidence (1 resource, $0):
    Zero cost; investigate purpose first.

DELETION PLAYBOOK:
  1. Snapshot all HIGH (zero risk)
  2. Schedule deletion for next maintenance window
  3. Schedule review meetings for MEDIUM resources
  4. Document the deletion in changelog
  5. Recurring report monthly
```

## Variations

```
"Resources unused for 180+ days (more conservative)"
"Delete report by team — who has the most orphans?"
"Resources matching orphan signals + cost > $50/month"
"Dry-run cost savings if all HIGH-confidence are deleted"
```

## When to use

Quarterly cleanup. Annual cost optimization sprint. Pre-budget-planning.

---

§ Recipe 15 · Last reviewed 2026-05-20

---

## Module complete

All 15 recipes done. Mix and match. Schedule recurring runs of high-value recipes.

---

§ Recipe 15 · M6.4 module complete · Last reviewed 2026-05-20
