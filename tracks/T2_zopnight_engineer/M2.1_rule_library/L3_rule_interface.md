# How the recommender thinks — Evaluate, MetricsAware, PricingAware

§ T2 · M2.1 · L3 of 5 · Engineer tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **explain** how rules consume data and produce recommendations, **identify** which interfaces a rule implements based on its evidence, **and reason** about why the architecture is designed this way.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the recommender's data flow well enough to debug findings, reason about evidence, and predict what new data would enable." |
| **Personas** | Platform Engineer · FinOps Lead · ZopNight Architect |
| **Prerequisites** | M2.1.L1 · M2.1.L2 |
| **Time** | 10 minutes |
| **Bloom verb** | Explain (Understand), Identify (Apply), Reason (Analyze) |

---

## 1. Concept

Every rule in ZopNight implements one or more interfaces. Understanding them clarifies how the recommender works, why some rules need specific data, and what evidence appears in the UI.

```
INTERFACE             PURPOSE                        EXAMPLE RULES
─────────────────────────────────────────────────────────────────────
Rule (base)           Core logic; always required    All 460 rules
MetricsAware          Needs metrics (CPU, etc.)      RC-004, RC-006, RC-202
PricingAware          Needs per-resource pricing      Most rules with $ savings
```

The interfaces are composable — a rule can be just Rule (state-based), or Rule + MetricsAware, or all three.

### The Rule interface — every rule implements this

```go
type Rule interface {
    ID() string                  // RC-001
    Name() string                // "Idle EC2 Instance"
    Provider() string            // "aws"
    ResourceType() string        // "*" (any) or specific type
    Severity() string            // "critical"|"high"|"medium"|"low"|"info"
    Category() string             // one of the 8 categories (M2.1.L1)
    Evaluate(ctx, resource, history) *Recommendation
}
```

`Evaluate` is where the rule's logic lives. Given a resource and its state history, it returns:
- `*Recommendation` — the rule fired (finding generated)
- `nil` — no finding (resource is healthy)

The contract is simple; the logic per rule varies enormously.

### The MetricsAware interface — rules needing metrics

Rules that need cloud monitoring data implement an additional interface:

```go
type MetricsAware interface {
    RequiredMetrics() []model.MetricSpec
    SetMetrics(metrics map[string]model.ResourceMetric)
}
```

```
RequiredMetrics: declares what metrics the rule needs
                  Example: "CPUUtilization, 30-day lookback, 1h aggregation"
                  
SetMetrics:      called by the recommender to inject pre-fetched data
                 Recommender batches the metric fetches; rule consumes
```

**Examples of MetricsAware rules:**

```
RC-004 (EC2 rightsizing):       CPUUtilization + memory
RC-006 (oversized EC2):          CPUUtilization (lower threshold)
RC-202 (idle RDS):               DatabaseConnections (zero = idle)
RC-053 (RDS rightsizing):        CPU + memory + IOPS
K8s rules (RC-17xx, 18xx, 19xx): HPA ScalingLimited, pod CPU, memory
```

**Non-MetricsAware rules** fire on resource state alone:

```
RC-001 (idle EC2):  just checks status=stopped + time-in-state from history
RC-002 (orphan EBS): just checks attachedTo=null
RC-005 (RDS Multi-AZ): just checks multiAz=false
```

State-based rules are simpler; metrics-based rules need infrastructure to fetch metrics.

### The PricingAware interface — rules that compute $ savings

Rules that compute savings using per-resource pricing implement:

```go
type PricingAware interface {
    SetPricing(pricing map[string]float64)
}
```

```
The recommender fetches per-resource monthly cost from Aggregator's
ComputeResourceCosts RPC and injects it via SetPricing.

Rules then use the injected pricing:
  Idle rules:        savings = 100% of current cost
  Right-size rules:  savings = (current_cost × 30%) typically
  Compliance rules:  often $0 savings (governance-only)
```

PricingAware is what gives the recommendation card its dollar figure.

### Data flow — end to end

```
1. DISCOVERER publishes "resource.refreshed" event to Redis Streams
   (Discoverer is the cron that polls cloud APIs for current state)
   
2. RECOMMENDER receives the event
   
3. RECOMMENDER fetches required data:
   - Resources (from Discoverer)
   - Metrics (from Discoverer's metrics-sync cron output)
   - State history (gRPC GetStateHistory from Config service)
   - Pricing (gRPC ComputeResourceCosts from Aggregator)
   
4. FOR EACH resource:
   - Registry.ForResource(provider, type) returns applicable rules
     (O(1) lookup; pre-indexed)
   - For MetricsAware: inject metrics
   - For PricingAware: inject per-resource cost
   - rule.Evaluate(ctx, resource, history) returns *Recommendation or nil
   
5. RESULTS batched:
   - *Recommendation → batched UpsertRecommendations to DB
   - nil → batched MarkOptimisedBatch (marks resource as healthy)
   
6. FLUSH every 50 resources (batch size for DB efficiency)
```

The flow is pull-based (cron triggers; not real-time). This trade-off is intentional.

### Thread safety + statelessness

```
THREAD SAFETY:
  A fresh Registry is created per evaluation
  Avoids races on shared rule state
  
RULE STATELESSNESS:
  Rules themselves are stateless except for injected per-resource data
  Each Evaluate call is self-contained
  
INJECTED DATA:
  Per-resource metrics: short-lived (only during this Evaluate call)
  Per-resource pricing: same
  
RESULT:
  Rules can be evaluated in parallel safely
  No shared mutable state across resources
```

The architecture is concurrency-friendly by design.

### Why this design — three properties

```
1. FAST READ PATH (the UX win)
   Recommendations are pre-computed; the UI just reads from DB
   No live evaluation on user requests
   User clicks Recommendations → page loads in <500ms
   
   Without pre-computation:
     Live evaluation per request would be 10-30 seconds
     Unscalable; bad UX
   
   With pre-computation:
     Cron runs every 6h (or sooner per event)
     UI reads static DB rows
     Scales to large estates (10K+ resources)

2. EXTENSIBLE (the developer win)
   Adding a rule:
     1 Go struct + 1 Evaluate function + 1 register call
     ~20-50 lines of code typical
   
   No SQL schema changes; no UI changes
   Rule appears in recommendations automatically
   
3. TESTABLE (the quality win)
   Each rule has tabular test cases:
     (resource state + metrics + history) → expected recommendation
   
   Add edge case to test table; rule is verified
   Refactor without fear; tests catch regressions
```

The architecture is the long-game investment: faster UX, faster development, fewer bugs.

### Performance characteristics

```
TYPICAL TIMING (mid-size estate):
  
  Discovery cron: every 6h
    Reads 10K resources from cloud APIs (parallel)
    Publishes events to Redis
    Duration: 5-10 min
    
  Recommender cron: triggered by event
    Processes resources in parallel
    Per-resource: ~50ms (Evaluate + DB upsert)
    Total: 10-15 min for 10K resources
    
  Read path (UI):
    Recommendations list query: <500ms
    Per-resource detail: <100ms
    
ESTATE SIZE SCALING:
  1K resources:    few minutes per cycle
  10K resources:    10-15 min per cycle
  100K resources:   30-60 min per cycle
  
The cron cadence (every 6h) is the throttle; recommender adapts.
```

The performance is good enough for batch; not designed for real-time.

### Adding a new rule — process

```
ADDING A RULE (engineering team's perspective):

1. Define the rule:
   - Category, severity, action default
   - Required metrics (if any)
   - Pricing usage (if any)
   - Evaluate logic
   
2. Implement the Go struct:
   - Embed RuleBase
   - Implement Evaluate
   - Implement MetricsAware (if needed)
   - Implement PricingAware (if needed)
   
3. Write tabular tests:
   - Test resource configurations
   - Expected recommendations or nils
   
4. Register the rule:
   - Add to registry initialization
   - Specify provider + resource type
   
5. Document in user-facing docs

TYPICAL EFFORT: 1-3 days per rule (simple)
                1-2 weeks per rule (complex; novel metrics)
```

The simplicity of adding rules is why the library grows to 460.

---

## 2. Demo

A typical Evaluate call for RC-001 (Idle EC2):

```go
// Inside the IdleEC2 struct's Evaluate function
func (r *IdleEC2) Evaluate(ctx context.Context, resource *Resource, history []StateChange) *Recommendation {
    // STATE check: is the instance stopped?
    if resource.Status != "stopped" {
        return nil  // running = not idle by this rule
    }
    
    // TIME check: how long has it been stopped?
    daysStopped := daysSince(latestStop(history))
    if daysStopped < r.idleThresholdDays {  // 30 by default
        return nil  // recently stopped; not yet idle
    }
    
    // PRICING (injected via PricingAware):
    monthlyCost := r.pricing[resource.UID]
    
    // BUILD recommendation
    return &Recommendation{
        RuleID:            "RC-001",
        ResourceUID:        resource.UID,
        Severity:           "medium",
        Category:           "idle",
        CurrentMonthlyCost: monthlyCost,
        OptimizedMonthlyCost: 0,  // terminate = cost goes to 0
        PotentialSavings:   monthlyCost,  // 100% savings
        Evidence: map[string]any{
            "daysStopped": daysStopped,
            "status":       "stopped",
            "lastStop":     latestStop(history),
        },
        ActionType: "terminate",
    }
}
```

Notice:
- No metrics needed (state-based rule; not MetricsAware)
- Pricing injected via PricingAware
- Returns nil if conditions aren't met
- Evidence map is what shows in the UI

This is the simplest rule type. More complex rules add metrics + multi-condition logic.

### Compare to a MetricsAware rule (RC-004 EC2 right-size)

```go
func (r *EC2RightSize) Evaluate(ctx, resource, history) *Recommendation {
    if resource.Status != "running" {
        return nil  // only evaluate running instances
    }
    
    // METRICS (injected via MetricsAware):
    cpuMetric := r.metrics["CPUUtilization"][resource.UID]
    if cpuMetric.MaxPercentile95 > r.rightSizeThreshold {  // e.g., 40%
        return nil  // using too much; can't downsize
    }
    
    // FIND smaller instance type
    currentType := resource.InstanceType  // m5.2xlarge
    targetType := smallerInstance(currentType)  // m5.xlarge
    
    // PRICING (injected via PricingAware):
    currentMonthly := r.pricing[resource.UID]
    targetMonthly := r.pricingByType[targetType]
    savings := currentMonthly - targetMonthly
    
    return &Recommendation{
        RuleID:            "RC-004",
        ResourceUID:        resource.UID,
        Severity:           "medium",
        Category:           "rightsizing",
        CurrentMonthlyCost: currentMonthly,
        OptimizedMonthlyCost: targetMonthly,
        PotentialSavings:   savings,
        Evidence: map[string]any{
            "cpuP95":      cpuMetric.MaxPercentile95,
            "lookback":     "30 days",
            "currentType":  currentType,
            "targetType":  targetType,
        },
        ActionType: "right-size",
    }
}
```

Same shape; more inputs; richer evidence.

---

## 3. Hands-on (6 min)

Inspect a recommendation in the UI:

```
□ STEP 1: Open Recommendations
  Pick one with $ savings
  Click into detail view

□ STEP 2: Inspect the evidence panel
  Was metrics data shown?
    CPU / memory / connections → MetricsAware rule
  Was pricing involved?
    Specific $ figure → PricingAware rule
  What's the lookback window mentioned?
    "30 days" or similar → from metrics

□ STEP 3: Classify the rule
  □ Just Rule (state-based; no metrics)
  □ Rule + MetricsAware (uses metrics)
  □ Rule + PricingAware (computes $ from injected pricing)
  □ All three (MetricsAware + PricingAware)

□ STEP 4: Find a non-PricingAware rule
  Look for a recommendation with $0 savings
  Examples: K8s reliability rules, governance rules
  These are quality categories (no direct savings)
```

The hands-on shows the interface boundary in action.

---

## 4. Knowledge check

### Q1
A rule needs CPU utilization to fire. It implements:

A. Just Rule
B. Rule + MetricsAware
C. Rule + PricingAware
D. Rule + MetricsAware + PricingAware

<details>
<summary>Show answer</summary>

**Correct: B (or D if it also computes savings).** MetricsAware is required for CPU data. PricingAware is required if it computes dollar savings (most cost-recovery rules also implement this).
</details>

### Q2
The recommender uses pre-computed storage with a cron-triggered evaluation rather than evaluating on every read. The main reason:

A. Cost (fewer compute cycles)
B. Read path is instant (no live evaluation). Better UX, scales to large estates. Pre-computation trades freshness (6-hour cadence) for instant UI.
C. Required by AWS
D. Backward compatibility

<details>
<summary>Show answer</summary>

**Correct: B.** Pre-computed = instant reads. The trade-off is freshness (6-hour cadence) for UX. The architecture optimizes for the common case (browsing recommendations) at the cost of edge cases (just-changed resources).
</details>

### Q3
What does `Registry.ForResource(provider, type)` return?

A. The list of rules indexed for that provider+type combination — O(1) lookup
B. The list of resources
C. A SQL query
D. Nothing

<details>
<summary>Show answer</summary>

**Correct: A.** The registry is the index of rules by provider+type for fast lookup during evaluation. Pre-indexed at startup; O(1) per query.
</details>

---

## 5. Apply

Rule definitions live in `backend/recommender/internal/rules/`. Each rule is a Go file. Customers don't modify rule code; behavior is tuned via severity overrides + auto-rem configuration in Settings.

For your team: when a recommendation surprises you, the evidence panel + interface knowledge explains *how* it fired.

---

## Related lessons

- [L1 — The 8 categories](L1_eight_categories.md)
- [L2 — Severity ladder](L2_severity.md)
- [L4 — Pricing model](L4_pricing_model.md) *(next)*
- [L5 — Reading a recommendation card](L5_reading_a_rec_card.md)
- [M2.2 — Reading evidence](../M2.2_reading_evidence/00_README.md)

## Glossary terms touched

[Evaluate](../../../reference/glossary/evaluate.md) · [MetricsAware](../../../reference/glossary/metricsaware.md) · [PricingAware](../../../reference/glossary/pricingaware.md) · [Pre-computed recommendations](../../../reference/glossary/pre-computed-recommendations.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.1.L3
