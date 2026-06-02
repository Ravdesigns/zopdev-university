# Recipe 4 — Who pays for what (by team)

§ T6 · M6.4 · Recipe 4 of 15 · Engineer tier · 3 min

## Intent

Team-level showback for the current month.

## Prompt

```
"Show me how much each team spent this month. Sort by spend descending.
Include any unattributed cost as a separate row."
```

## MCP tools

```
get_showback(dimension="team", period="month_to_date")
```

## Expected output

```
TEAM                MONTH-TO-DATE     PERCENT OF TOTAL
─────────────────────────────────────────────────────
platform            $18,400           38%
product             $15,200           31%
data                $9,300            19%
shared              $3,400            7%
unattributed       $2,300            5%   ← needs investigation
─────────────────────────────────────────────────────
TOTAL              $48,600
```

## Variations

```
"Same query for last month"
"Team spend trend over last 6 months"
"Drill into platform's spend by cost_center tag"
"Show top 5 resources per team"
```

## When to use

Monthly Operate review. Quarterly variance analysis. Finance reporting.

---

§ Recipe 4 · Last reviewed 2026-05-20
