# Recipe 6 — Untagged spend by provider

§ T6 · M6.4 · Recipe 6 of 15 · Engineer tier · 3 min

## Intent

Find spend that has no owner tag (or required tag is missing) — broken down by cloud provider. Untagged spend = no accountability.

## Prompt to AI agent

```
"Show me last month's untagged spend by cloud provider. Include the
top 5 untagged resources for each provider."
```

## MCP tools used

```
get_cost_by_provider(filters={"tag.team":null}, time="last_month")
list_resources(filters={"tag.team":null}, sort="cost:desc")
```

## Expected output

```
UNTAGGED SPEND (no team tag) — last month:

Provider     Untagged Spend    % of Total     Top Resource
─────────────────────────────────────────────────────────────
AWS          $14,200           18%            EBS vol-0abc ($420)
GCP          $3,800            12%            GCE backup snap ($180)
Azure        $1,400            6%             Disk snap-x ($90)
─────────────────────────────────────────────────────────────
TOTAL        $19,400           14%

TOP 5 UNTAGGED IN AWS:
  vol-0abc (gp3, 5 TB)              $420/mo
  s3://team-old-archive/            $380/mo
  vol-0def (gp3, 3 TB)              $260/mo
  i-0ghi (EC2 stopped, 200 GB EBS)  $180/mo
  snap-0jkl (1 TB)                  $140/mo

RECOMMENDED ACTION:
  - Identify owners via creation timestamps + audit logs
  - Apply team tags
  - Set up tag-enforcement policy going forward
```

## Variations

```
"Untagged spend in dev accounts only"
"Resources tagged but missing the 'cost-center' tag specifically"
"Tag coverage percentage by provider"
"List resources without any tags at all"
```

## When to use

Monthly tag-coverage review. Onboarding new accounts. Showback prep.

---

§ Recipe 6 · Last reviewed 2026-05-20
