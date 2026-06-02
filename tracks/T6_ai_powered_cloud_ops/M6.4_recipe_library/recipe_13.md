# Recipe 13 — Tag coverage trend (90 days)

§ T6 · M6.4 · Recipe 13 of 15 · Engineer tier · 3 min

## Intent

Track tag coverage over the last 90 days. Is the org getting better or worse at tagging? Quarterly trend gives the answer.

## Prompt to AI agent

```
"Show me tag coverage percentage for required tags (team, env, cost-center)
over the last 90 days. Plot the weekly trend."
```

## MCP tools used

```
list_resources for each week, group by has-tag vs missing-tag
compute coverage % per week
get_costs by tag (untagged spend trend)
```

## Expected output

```
TAG COVERAGE TREND (90-day, weekly):

Week           team-tag%   env-tag%   cost-center%   Untagged $
─────────────────────────────────────────────────────────────────
Week of 02-25  78%         85%        62%            $18,400
Week of 03-04  79%         86%        63%            $17,800
Week of 03-11  81%         87%        66%            $16,900
Week of 03-18  82%         88%        68%            $15,400
Week of 03-25  82%         88%        69%            $14,800
Week of 04-01  84%         89%        72%            $13,200
Week of 04-08  85%         90%        74%            $12,400
Week of 04-15  85%         90%        74%            $12,100
Week of 04-22  86%         91%        76%            $11,400
Week of 04-29  87%         92%        78%            $10,800
Week of 05-06  88%         93%        79%            $10,200
Week of 05-13  88%         93%        80%            $9,800
Week of 05-20  89%         94%        81%            $9,200

TREND:
  team-tag: 78% → 89% (+11pp over 90 days)
  env-tag: 85% → 94% (+9pp)
  cost-center: 62% → 81% (+19pp — biggest gain)
  Untagged spend: $18.4k → $9.2k (-50%)

ANALYSIS:
  Steady improvement. Cost-center tag campaign in March was effective.
  Goal of 95% by Q3 is on track.

RECOMMENDED:
  Continue current enforcement
  Target: 95% all-tags by 2026-09-01
```

## Variations

```
"Tag coverage by team — who is leading and who is lagging?"
"Tag coverage by provider"
"Resources missing 2+ required tags (worst offenders)"
"New resources created this month — what % have tags from day 1?"
```

## When to use

Monthly governance review. Quarterly tag-program retrospective. Annual planning.

---

§ Recipe 13 · Last reviewed 2026-05-20
