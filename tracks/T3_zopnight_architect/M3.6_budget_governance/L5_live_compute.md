# Live computation, not stored

§ T3 · M3.6 · L5 of 5 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **defend** the architectural choice to compute budget spend live (rather than store a `current_spend_usd` column), **predict** the performance characteristics, **and reason** about why this choice matches the two-source cost model.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Understand why ZopNight's budgets always reflect the latest cost data, with zero batch lag." |
| **Personas** | Platform Engineer · FinOps Lead · Security/Compliance |
| **Prerequisites** | M3.6.L1-L4 (budget basics + signals) · T0.M0.4 (two-source cost model) |
| **Time** | 9 minutes |
| **Bloom verb** | Defend (Evaluate), Predict (Analyze), Reason (Evaluate) |

---

## 1. Concept

A budget's current spend is **computed live** on every read, by aggregating `cost_records` against the budget's scope and time window. There is no `current_spend_usd` stored column in the database. Every dashboard view, every API call, every notification cron computes the value fresh.

```
ARCHITECTURE — LIVE COMPUTATION:

  Read budget detail
    ↓
  SELECT SUM(costColumn(hasBilling))
  FROM cost_records
  WHERE (scope matches budget's filter)
    AND (date in current budget period)
    ↓
  Return the sum
  
ARCHITECTURE NOT USED — STORED CURRENT_SPEND:
  Cron writes current_spend_usd column periodically
  Read budget → return stored value
  (this approach was used in v2; dropped April 2026)
```

The live-compute architecture is what makes budgets always-current and always-correct. It is also what allows arbitrary scope changes to take effect immediately.

### Why live computation

Four reasons, in order of importance:

```
1. ACCURACY
   Always current. No stale data. New cost records show up in the
   budget reading immediately (next read).
   Stored values lag by however long the last cron ran.

2. SIMPLICITY
   One source of truth (cost_records). No sync logic.
   Stored values require maintenance:
     - When cost records change, recompute
     - When scope changes, recompute
     - Handle race conditions during recompute
     - Detect and reconcile drift
     None of this exists in the live-compute model.

3. FLEXIBILITY
   Easy to compute any scope. New filters work immediately.
   Stored would require materialized columns for every possible
   filter combination — impractical at scale.

4. CORRECTNESS
   No drift. The computation matches what reports show.
   Stored values can diverge from actuals (rare, but possible
   bugs cause this; we eliminate the class of bug entirely).
```

### Performance characteristics

The concern with live computation is performance. Aren't aggregate SQL queries slow?

```
TYPICAL BUDGET READ COSTS (with proper indexing):

  Per-resource budget:    ~5 ms   (single resource_uid filter)
  Per-group budget:       ~10-25 ms (small to medium group)
  Per-team budget:         ~10-50 ms (most teams; tag-indexed)
  Org-wide rollup:         ~50-150 ms (full table scan with date filter)
  
DASHBOARD with 12 budget widgets: ~200-400 ms total
  Fast enough for sub-second page renders.
```

The indexing strategy is the key. The `cost_records` table is indexed on `(org_id, date, scope_columns)` — the aggregate queries hit the index, not the full table.

Compare to the stored alternative:
```
STORED-COLUMN READ COSTS:
  Per budget read: 1-2 ms (single row read)
  
  But: more complex sync logic
       Stored values lag behind actuals by minutes-to-hours
       Re-computation on scope change adds latency to write
```

The 10-50 ms live-compute cost is the right trade for the simplicity gains. Sub-100ms is well within UI responsiveness budgets.

### The `costColumn()` function

The SQL aggregation uses a helper function `costColumn(hasBilling)` that picks the right cost source per the two-source model (T0.M0.4):

```
costColumn(hasBilling):
  hasBilling = true   →  COALESCE(actual_cost_usd, cost_usd)
  hasBilling = false  →  cost_usd
```

This ensures budgets use the right cost source for the customer's setup:
- If the cloud-account is configured with billing sync → use actual (post-discount, billing-data) when available, fall back to calculated (rack rate) for unsynced days
- If no billing sync → use only the calculated cost

The result: budgets reflect what the customer will actually pay (when billing data is available) and what we think they will pay (when it isn't), automatically.

### What live compute means for budgets

```
1. SPEND UPDATES IMMEDIATELY when new cost records land
   - Hourly: discovery cron writes new rack-rate cost records
   - 24h: billing sync updates actual_cost_usd
   - In both cases, next budget read picks up the new value
   - Budget transitions from green to yellow to red as data arrives;
     no batch processing delay

2. COST SOURCE LABEL visible on budget detail
   - "Computed from billed cost" (mostly billing data; ideal)
   - "Computed from rack rate" (only calculated; pre-billing-sync
     setup or sync paused)
   - "Mixed" (some billing data, some rack rate)
   - The label lets the user know which cost column is in play

3. BUDGET CHANGES TAKE EFFECT IMMEDIATELY
   - New threshold added: next read evaluates against the new threshold
   - Scope changed (added a resource group): next read includes the
     new scope
   - No stored spend to "recompute" — there is nothing to migrate;
     the next read uses the new scope
```

### Notification firing

The notification cron uses the same live-computation logic:

```
NOTIFICATION CRON (runs hourly):
  
  For each active budget:
    spend = live_compute_spend(budget)
    threshold_crossings = check_thresholds(spend, last_known_spend)
    
    For each newly-crossed threshold:
      fire_notification(threshold, channels)
      record(audit_log, threshold_crossing)
    
    Update budget.last_known_spend = spend
      (this is the only "stored" value — it's a "did we already
       notify on this threshold?" flag, not the spend itself)
```

The single stored field is the cross-period bookkeeping flag, not the spend value. The spend itself is computed live.

### Historical migration

ZopNight historically stored `current_spend_usd`. The column was dropped in April 2026 (PRs #1078 + #1108).

```
MIGRATION (2026-04-30):
  1. PR #1078: convert all budget reads to live computation
              Validate against the stored value (parity check)
              No customer-visible change
              
  2. PR #1108: drop the stored column from the schema
              Remove the cron that maintained it
              Simplify the budget service code

CUSTOMER IMPACT: zero
  Reads use the same underlying cost data, just computed live.
  Performance is comparable (within 50 ms).
  Accuracy improved (no stale-data window).
  Audit log is unchanged.
```

The architecture is intentionally lean. Storing a value that can be computed from other values is duplication; duplication invites drift; drift causes audit headaches. Live compute eliminates the class.

### When live compute would NOT be the right choice

A useful counterfactual:

```
LIVE COMPUTE BREAKS DOWN if:
  - Underlying data is very expensive to query (billion-row scans
    without indexing)
  - Aggregation is recursive or graph-walking
  - Realtime requirement is sub-millisecond (it's not for budgets)
  
For ZopNight's cost_records table:
  - Indexed appropriately; queries hit indices
  - Aggregation is straightforward SUM with date + scope filter
  - 50 ms is fine for budgets
  
So live compute is the right answer here.
```

For a different domain (e.g., a real-time game scoreboard), the trade-offs might shift. For budgets specifically, live compute wins.

### How ZopNight uses live computation

Every surface that displays budget spend reads it live: dashboards, Reports → Budget Health, the budget detail page, the API endpoint `/v1/budgets/{id}`, and the notification cron. All of them share the same `compute_budget_spend(budget_id)` function — there is no second source-of-truth that could disagree.

For customers who want to export budget state, the API returns the computed value at the moment of the call. Snapshotting a budget's spend at a specific time means calling the API at that time; the system does not retain historical "spend at point X" values (those can be derived from `cost_records` time-series if needed).

---

## 2. Demo

A scope-change scenario:

```
SCENARIO: Customer adjusts a budget's scope mid-period.

T+0       Open budget detail
          Current spend: $4,200 (live computed)
          Scope: dev-platform-eu group
          
T+30 s    Click Edit; change scope to:
          dev-platform-eu group + staging-eu group
          (adding a second group to the scope)
          
T+45 s    Save the change
          
T+46 s    Refresh the budget detail page
          Recomputed live: spend = $6,800
          (new scope includes the additional group's spend)

NO BATCH delay. NO cron wait. NO migration job to rerun current_spend_usd.

This works because:
  - The budget definition stores the scope filter
  - Every read evaluates the filter against cost_records
  - No stored value to refresh
  - The change takes effect at read time, not write time
  
CONTRAST with stored-column architecture:
  - Save would trigger a recompute job
  - User refreshes; sees stale value until job completes
  - User wonders if the change took effect
  - Possible race condition between recompute and read
```

The user gets immediate feedback. The system gets simpler. Both win.

---

## 3. Hands-on (5 min)

Verify live computation:

```
1. Open any budget in your org
   Current spend (note value): $__________
   Cost source label: __________ (billed / rack rate / mixed)

2. Wait an hour (or come back tomorrow)
   Refresh the budget detail
   Has the spend value changed? Yes / No
   New value: $__________
   
3. If your billing sync just completed (or if it's been > 24h),
   the cost source label may have changed from "rack rate" to
   "billed" for the most recent days. Note any change.

4. Audit observation:
   Did the budget transition green/yellow/red during the period?
   __________
   
5. Architectural check:
   Open the API endpoint /v1/budgets/{your-budget-id}
   The response should include the same computed spend
   API response: $__________  (matches UI? yes / no)
```

If the API and UI values diverge, that's a bug worth reporting — they should always match because they share the live-compute function.

---

## 4. Knowledge check

### Q1
A budget's current spend is:

A. Stored in a database column for fast reads
B. Computed live on every read by aggregating `cost_records` for the budget's scope and current period. Always current; no stale data; no sync logic. The `costColumn(hasBilling)` helper picks the right cost source (billed vs rack rate) per the two-source model.
C. Cached for 1 hour
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Live computation is the architectural choice. The `current_spend_usd` column was dropped in April 2026; the design is intentional.
</details>

### Q2
A new cost record lands at 14:25 UTC. The budget reflects:

A. After the next cron run (could be hours)
B. Immediately, on the next budget read. Live computation means latency = SQL query time (~10-50 ms). The budget transitions across thresholds in near-real-time as cost records arrive.
C. After 24 hours
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Immediate. There is no batch step between cost arrival and budget visibility.
</details>

### Q3
Why no stored `current_spend` column?

A. Performance — stored would be slower
B. Simplicity and correctness. One source of truth (`cost_records`). Stored would require sync logic, risk drift, and add complexity. Live compute is fast enough (10-50 ms typical) for the UI responsiveness budget. The trade-off favors live compute decisively.
C. Database constraints
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Architectural decision for simplicity. Performance is comparable; correctness is improved.
</details>

---

## 5. Apply

The budget detail page surfaces live-computed spend with the cost-source label. No additional configuration; the architecture handles it.

For customers debugging "why is my budget showing X" questions, the answer is always: look at the underlying `cost_records` for the budget's scope and time window. The budget number is a SUM; the components are queryable.

---

## Related lessons

- [L1 — Budget vs forecast vs alert](L1_budget_basics.md)
- [L2 — Budget scopes](L2_budget_scopes.md)
- [L3 — Threshold-crossing notifications](L3_threshold_alerts.md)
- [L4 — Green/yellow/red signals](L4_signals.md)
- [T0.M0.4.L4 — The two-source cost model](../../T0_foundations/M0.4_rack_rate_vs_billing/L4_two_source_model.md)

## Glossary terms touched

[Live computation](../../../reference/glossary/live-computation.md) · [`costColumn()`](../../../reference/glossary/cost-column.md) · [`current_spend_usd`](../../../reference/glossary/current-spend-usd.md) · [Cost source label](../../../reference/glossary/cost-source-label.md)

---

## Module quiz

Complete M3.6 → 10-question module quiz unlocks the **Budget-Architect** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.6.L5
