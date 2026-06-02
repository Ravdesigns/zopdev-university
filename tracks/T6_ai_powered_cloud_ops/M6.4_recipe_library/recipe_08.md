# Recipe 8 — Budget burn-down by team

§ T6 · M6.4 · Recipe 8 of 15 · Engineer tier · 3 min

## Intent

Show each team's budget burn-down for the current month — actual spend vs budget, percent consumed, projected end-of-month.

## Prompt to AI agent

```
"Show me budget burn-down for each team this month. Include actual,
budget, % consumed, projected month-end, and status (green/yellow/red)."
```

## MCP tools used

```
list_budgets()
get_budget_summary for each
get_costs by team, current month-to-date
```

## Expected output

```
TEAM BUDGET BURN-DOWN (May 2026, day 20 of 31):

Team               Budget    Actual    %      Projected   Status
──────────────────────────────────────────────────────────────────
platform           $40,000   $24,800   62%    $38,440     GREEN
data-eng           $25,000   $18,200   73%    $28,210     YELLOW
ml-infra           $35,000   $30,800   88%    $47,740     RED
marketing-cdn      $8,000    $5,200    65%    $8,060      YELLOW
legacy-systems     $12,000   $7,600    63%    $11,780     GREEN
─────────────────────────────────────────────────────────────────
TOTAL              $120,000  $86,600   72%    $134,230    YELLOW

ANALYSIS:
  ml-infra: projected to exceed budget by $12,740 (36% over)
    Driver: new GPU training cluster, expected
    Action: re-baseline budget OR optimize workloads
  
  data-eng: tight finish; monitor for overage
  
  Org total: projected $14k over; mostly from ml-infra
```

## Variations

```
"Which teams are on track to exceed budget this month?"
"Year-to-date budget consumption by team"
"Compare actual spend vs budget for last 6 months — which teams consistently overrun?"
"Forecast next month's spend per team based on this month's run rate"
```

## When to use

Mid-month budget review. End-of-month reporting. Quarterly budget retrospective.

---

§ Recipe 8 · Last reviewed 2026-05-20
