# Batch processing for cost reduction

§ T2 · M2.11 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **convert** real-time inference to batch when latency permits, **calculate** the ~50% savings, **and combine** batch with model selection for compounding savings.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Cut inference costs by 50%+ for workloads that can tolerate batch latency — combine with model selection for compound savings." |
| **Personas** | ML Engineer · Platform Engineer · Product Engineer |
| **Prerequisites** | M2.11.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Convert (Apply), Calculate (Analyze), Combine (Synthesize) |

---

## 1. Concept

Bedrock offers batch API at ~50% of on-demand pricing. Workloads with relaxed latency requirements should use it.

```
THE TRADE:
  Latency: real-time (seconds) → batch (minutes to hours)
  Cost: 50% reduction
  
WHEN BATCH FITS:
  Workload tolerates batch latency
  Async use cases (email, reports, analysis)
  Off-hours batch processing
  Non-interactive workflows
  
WHEN BATCH DOESN'T FIT:
  Real-time chat
  User-facing recommendations
  Latency-critical applications
```

The discipline: if latency permits, batch wins on cost.

### When batch fits

```
WORKLOAD                          LATENCY OK?     BATCH ELIGIBLE?
──────────────────────────────────────────────────────────────────
Real-time chat                     <1s            No
Real-time recommendation           <1s            No
Async customer email               15-60 min      YES
Document summarization (offline)   hours          YES
Daily report generation            24 hr          YES
ML training data generation        hours          YES
Code review automation             minutes        MAYBE
Customer support ticket triage     30 min         YES
Content moderation (queue-based)    1 hour         YES
Translation service                 5-30 min       YES
```

The threshold: can users wait? If yes (minutes to hours), batch wins.

### How batch works

```
BATCH WORKFLOW:

1. Application accumulates requests into a batch
   Typically: 50-1000 requests
   Trigger: time window (e.g., every 10 min) OR batch size threshold
   
2. Submits to Bedrock Batch API
   Single API call with all requests
   
3. Bedrock processes asynchronously
   Queue-based; processed by Bedrock workers
   
4. Returns results when complete
   Typically: 30 min - 1 hr later
   Some batches: faster
   
5. Application picks up the response
   Polling or webhook
   Updates state; sends to users / downstream systems

COST: ~50% of on-demand
```

The async nature is the trade. Applications need to handle the latency.

### Implementation pattern

```
ON-DEMAND (currently):
  user request → app → Bedrock → response → return to user
  Total latency: ~2 seconds
  Cost: $0.05 per request
  
BATCH (for non-time-critical):
  user request → app → queue (immediate)
  Queue accumulates 10 minutes
  Batch submitted → Bedrock processes → results
  Results dispatched → user receives
  Total latency: ~10-20 minutes (worst case)
  Cost: $0.025 per request (50% off)
```

The change: add a queueing layer; user-facing latency increases.

### Decision matrix

```
WORKLOAD                              CURRENT      LATENCY OK    BATCH?
                                      MODEL         FOR BATCH?
─────────────────────────────────────────────────────────────────────
Real-time chatbot                     On-demand    No            No (keep)
Email auto-responder                  On-demand    Yes           YES → 50% savings
Daily content moderation              On-demand    Yes           YES → 50% savings
Training data labeling                 On-demand    Yes           YES → 50% savings
RT recommendation                     On-demand    No            No (keep)
Off-hours batch reports               On-demand    Yes           YES → 50% savings
Customer support categorization        On-demand    Yes (1 hr)    YES → 50% savings
Document parsing pipeline              On-demand    Yes (mins)    YES → 50% savings
```

For each batch-eligible workload, savings are ~50% of the inference cost.

### Combining with model selection

Batch + cheaper model multiplies savings:

```
EXAMPLE: nightly content moderation
  Current: real-time, Opus
  Cost: 100K events/day × $0.055 = $5,500/day = $165K/month
  
  OPTIMIZATION OPTIONS:
    
    Just switch to batch (50% off):
      Cost: $2,750/day = $82.5K/month
      Savings: 50%
    
    Just switch to Sonnet (5x cheaper):
      Cost: $1,100/day = $33K/month
      Savings: 80%
    
    BOTH (batch + Sonnet):
      Cost: $550/day = $16.5K/month
      Savings: 90%
      
    BOTH (batch + Haiku):
      Cost: $275/day = $8.25K/month
      Savings: 95%
  
  MAXIMAL SAVINGS: 95% from combining both optimizations
```

Model selection + batch compound. Don't pick one; do both where possible.

### Implementation considerations

```
QUEUE INFRASTRUCTURE:
  SQS / SNS / equivalent
  In-process buffer + scheduled flush
  Database-backed queue
  Cost: usually minimal vs Bedrock savings
  
USER-FACING LATENCY:
  Email response: "We'll respond within 30 minutes"
  In-app notification: progress indicator
  Background: invisible to user
  
ERROR HANDLING:
  Batch failure (rare): retry batch
  Per-request failure within batch: individual retry
  Time-out: escalate to on-demand fallback
  
RECONCILIATION:
  Track which requests succeeded
  Match responses to requests
  Handle ordering (batches return out of order sometimes)
```

The infrastructure is straightforward. The discipline is the design choice.

### When batch isn't worth it

```
SCENARIOS WHERE BATCH DOESN'T MAKE SENSE:

  Very low volume:
    Batch min size: ~50 requests
    Below: latency too long for the few requests
    
  Real-time requirement:
    User waiting for response
    Latency > 30 sec is bad UX
    Stay on-demand
    
  Workflow dependencies:
    Result of inference feeds immediate next step
    Can't wait for batch
    
  Already cheap workload:
    Tiny dollar savings
    Implementation effort not justified
    Optimize bigger workloads first
```

Match the optimization to the workload. Not every workload should batch.

### Hybrid pattern

```
SOME WORKLOADS use BOTH:
  
  PEAK HOURS (real-time):
    User-facing; immediate response needed
    On-demand
    
  OFF-HOURS (batch):
    Same workload at night for backfill / processing
    Batch
    
  Bedrock supports calling both APIs from same app
  Application chooses based on time / context
```

The hybrid pattern handles mixed-workload scenarios.

---

## 2. Demo

A team's batch optimization:

```
WORKLOAD: customer service ticket categorization
  Currently: On-demand Opus
  Volume: 8K tickets/day
  Avg input: 600 tokens
  Avg output: 200 tokens
  Latency requirement: tickets categorized within 1 hour

CURRENT COST:
  Per-ticket: ($0.009 + $0.015) = $0.024
  Monthly: 8K × 30 × $0.024 = $5,760/month

REVIEW:
  1-hour latency = batch is fine
  Tickets are simple categorization = Sonnet is sufficient
                                       (or even Haiku for simple)

OPTIMIZATION PLAN:
  
  STEP 1: Switch to Sonnet
    Per-ticket (on-demand): ($0.0018 + $0.003) = $0.0048
    Monthly: 8K × 30 × $0.0048 = $1,152
    Savings: $4,608/mo (80%)
    
  STEP 2: Switch to batch
    Per-ticket: $0.0048 × 50% = $0.0024
    Monthly: 8K × 30 × $0.0024 = $576/month
    Savings: $5,184/mo total (90%)

IMPLEMENTATION (3 weeks):
  Week 1: switch model to Sonnet; test quality
  Week 2: add batch queue + processing pipeline
  Week 3: roll out batch; monitor

OUTCOMES (1 month in):
  Realized: $620/mo (close to projection)
  Savings: $5,140/mo (89%)
  Quality: classification accuracy unchanged
  Latency: avg 15 minutes (within 1-hour requirement)
  User feedback: positive (faster than expected)
```

The compound optimization (cheaper model + batch) captures 90% of cost.

---

## 3. Hands-on (5 min)

Identify batch-eligible workloads:

```
□ STEP 1: List Bedrock workloads
  Workload 1: __________   Latency need: __________
  Workload 2: __________   Latency need: __________
  Workload 3: __________   Latency need: __________

□ STEP 2: Classify
  Real-time (sub-second): _____
  Batch-eligible (minutes-hours OK): _____

□ STEP 3: Calculate savings per batch-eligible workload
  Workload 1: current $_____/mo
              with batch: $_____/mo
              savings: $_____/mo

□ STEP 4: Add model selection compound
  With both batch + cheaper model: $_____/mo
  Total savings: $_____/mo

□ STEP 5: Plan implementation
  Effort: ___ weeks per workload
  Priority: __________
```

A 15-minute audit reveals batch opportunities.

---

## 4. Knowledge check

### Q1
A workload requires sub-second response. Should it use batch?

A. Yes always
B. No — batch latency is 10 minutes to 1 hour. Real-time workloads must stay on-demand. Latency requirement determines batch vs on-demand eligibility.
C. Random
D. Optional

<details>
<summary>Show answer</summary>

**Correct: B.** Latency requirement determines batch vs on-demand.
</details>

### Q2
Batch API cost vs on-demand:

A. Same
B. ~50% of on-demand. Substantial savings for latency-tolerant workloads. The Bedrock pricing model offers batch at half the on-demand rate.
C. 90% lower
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** ~50% reduction.
</details>

### Q3
Combining batch + cheaper model:

A. Same as either alone
B. Compounds — typical 5-10x cheaper model × 50% batch discount = ~10-20x total cost reduction. Multiplicative; not additive. The optimizations stack for major savings.
C. Random
D. Not allowed

<details>
<summary>Show answer</summary>

**Correct: B.** Optimizations compound.
</details>

---

## 5. Apply

RC-1607 (sequential vs batch) surfaces batch opportunities. Requires application change.

For your team: identify batch-eligible workloads; combine with model selection for compound savings.

---

## Related lessons

- [L1 — ML cost landscape](L1_ml_landscape.md)
- [L2 — Bedrock rules](L2_bedrock_rules.md)
- [L3 — Model selection](L3_model_selection.md)
- [L5 — Provisioned throughput](L5_provisioned_throughput.md) *(next)*

## Glossary terms touched

[Batch API](../../../reference/glossary/batch-api.md) · [Batch latency](../../../reference/glossary/batch-latency.md) · [Compound optimization](../../../reference/glossary/compound-optimization.md) · [Hybrid pattern](../../../reference/glossary/hybrid-pattern.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.11.L4
