# Recipe 3 — Top 10 highest-savings recommendations

§ T6 · M6.4 · Recipe 3 of 15 · Engineer tier · 3 min

## Intent

Find the recommendations with the largest savings potential for prioritized triage.

## Prompt

```
"Show me the top 10 recommendations sorted by monthly savings.
Include rule ID, resource, severity, and savings amount."
```

## MCP tools

```
list_recommendations(sort="potential_savings:desc", limit=10, status="open")
```

## Expected output

```
RANK  RULE        RESOURCE               SEVERITY  SAVINGS/MO
─────────────────────────────────────────────────────────
1     RC-006     m5.4xlarge i-0abc       high      $580
2     RC-001     m5.large i-0def         medium   $69
3     RC-202     rds db.r5.xlarge        high      $450
4     RC-004     m5.2xlarge i-0ghi      medium   $310
5     RC-1701    eks-deploy-staging      medium   $220
6     RC-088     spot opportunity        high      $190
...
TOTAL OPEN SAVINGS POTENTIAL: $4,200/mo
```

## Variations

```
"Top recommendations by severity"
"Top recommendations on prod-tagged resources"
"Top recommendations our team can fix this week"
```

## When to use

Weekly Operate triage. Quarterly cost-reduction sprints.

---

§ Recipe 3 · Last reviewed 2026-05-20
