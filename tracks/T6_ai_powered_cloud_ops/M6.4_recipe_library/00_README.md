# M6.4 — Recipe library (15 recipes)

§ T6 · M6.4 · Engineer tier · 15 recipes · ~50 min total

## Module outcome

Use 15 curated MCP recipes for common cost and governance queries.

## The 15 recipes

| # | Recipe | Purpose |
|---|---|---|
| 1 | [The oldest stopped EC2](recipe_01.md) | Find the longest-stopped instance still costing money |
| 2 | [RDS instances not in Multi-AZ](recipe_02.md) | List RDS not in Multi-AZ in prod |
| 3 | [Top 10 highest-savings recommendations](recipe_03.md) | Sort recs by savings, top 10 |
| 4 | [Who pays for what (by team)](recipe_04.md) | Team-level showback for the month |
| 5 | [Which schedules failed last week](recipe_05.md) | Find every failed schedule action |
| 6 | [Untagged spend by provider](recipe_06.md) | Output untagged spend split by provider |
| 7 | [This week's cost anomalies](recipe_07.md) | List anomalies + root causes |
| 8 | [Budget burn-down by team](recipe_08.md) | Output budget burn-down for each team |
| 9 | [Idle Lambdas with concurrency](recipe_09.md) | Lambdas with concurrency, no invocations |
| 10 | [Stopped resources still costing money](recipe_10.md) | Paused-but-billed resources |
| 11 | [Region drift](recipe_11.md) | Resources outside policy regions |
| 12 | [Departed-user-created resources](recipe_12.md) | Resources owned by users who left |
| 13 | [Tag coverage trend](recipe_13.md) | 90-day tag coverage trend |
| 14 | [Recent override activity](recipe_14.md) | Overrides created in last 7 days |
| 15 | [Ready-to-delete report](recipe_15.md) | Orphans candidate for deletion |

---

Each recipe is a worked example: the natural-language prompt, the MCP tools used, the expected output. Reusable across teams.

## Recipe pattern

```
RECIPE FORMAT:
  Intent:      Plain-English description of the query
  Prompt:      What to type into the AI agent
  MCP tools:   Which tools the agent will call
  Output:      What the agent returns
  Variations:  Other ways to ask the same question
```

---

§ Last reviewed 2026-05-20
