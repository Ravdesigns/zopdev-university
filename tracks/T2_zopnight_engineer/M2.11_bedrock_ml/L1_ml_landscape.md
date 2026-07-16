# The ML cost landscape

§ T2 · M2.11 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **map** ML/Bedrock cost surface to specific optimization levers, **identify** the major cost drivers, **and recognize** which Bedrock rule applies to each pattern.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the ML cost landscape so I can find the right optimization lever for each cost pattern." |
| **Personas** | ML Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.1 (rule library) |
| **Time** | 9 minutes |
| **Bloom verb** | Map (Analyze), Identify (Apply), Recognize (Apply) |

---

## 1. Concept

ML workloads have distinct cost shapes: model inference (per-call), model training (compute-hour), and infrastructure (GPU instances). Each has different optimization patterns.

```
COST DRIVER                  TYPICAL %      OPTIMIZATION
──────────────────────────────────────────────────────────────
Bedrock model inference      30-60%         Model selection, batch processing
Foundation model training    20-40%         Spot instances, scheduled runs
GPU instance hours           15-30%         Right-sizing, scheduling
Vector DB / embedding store   5-15%        Standard storage optimization
SageMaker endpoints           5-20%        Right-sizing endpoints; serverless
```

ML cost optimization requires understanding which lever applies where.

### Bedrock-specific patterns

Bedrock charges per input token + per output token by model. Different models have wildly different costs:

```
MODEL              INPUT $/M TOKENS    OUTPUT $/M TOKENS    RELATIVE COST
─────────────────────────────────────────────────────────────────────────
Claude Opus        $15.00              $75.00               1.0x (baseline)
Claude Sonnet      $3.00               $15.00               0.2x (5x cheaper)
Claude Haiku       $0.80               $4.00                0.05x (20x cheaper)
Titan Express      $0.30               $0.40                0.01x (100x cheaper)
Llama models       $1.00               $2.00                0.05x
Mistral            $0.50-$2.00         $1.00-$8.00          varies
```

A workload using Opus when Haiku would suffice can pay 20-100x what it needs to.

### Detection signals

ZopNight detects ML cost patterns:

```
HIGH INFERENCE COST PER TOKEN:
  Pattern: high-cost model used for simple queries
  Detection: cost per token unusually high
  Rule: RC-1603 (model selection)
  Action: route by complexity
  
IDLE BEDROCK PROVISIONED THROUGHPUT:
  Pattern: capacity reserved but unused
  Detection: utilization vs reservation
  Rule: RC-1601 (provisioned throughput idle)
  Action: reduce capacity or move to on-demand
  
TRAINING JOBS ON ON-DEMAND:
  Pattern: training using premium pricing
  Detection: training workload type + on-demand tier
  Rule: RC-1607
  Action: switch to Spot
  
GPU INSTANCES 24/7:
  Pattern: GPU instances running when training is intermittent
  Detection: GPU usage vs uptime
  Rule: RC-1608, RC-1609
  Action: scheduling + autoterm
```

The 10 Bedrock rules (RC-1601..1610) target these patterns. They sit inside a broader ML rule family that extends to RC-1634 (about 33 rules in total, including the SageMaker set RC-1611..1628). See L2 for the authoritative per-rule list.

### Cost drivers per pattern

```
INFERENCE COSTS (Bedrock or self-hosted):
  Drivers: model choice, request volume, token length
  Levers: model selection (L3), batching (L4)
  Where to optimize: route + batch
  
TRAINING COSTS:
  Drivers: model size, dataset size, hyperparameter tuning
  Levers: Spot instances, scheduled runs, checkpointing
  Where to optimize: instance procurement + scheduling
  
GPU INSTANCE COSTS:
  Drivers: GPU type, uptime, idle time
  Levers: right-sizing, scheduling, instance pools
  Where to optimize: M5.2 schedules + M2.4 autoscaling
  
EMBEDDING / VECTOR DB:
  Drivers: data volume, query rate
  Levers: storage tier, embedding compression
  Where to optimize: standard storage patterns (M5.1)
```

The patterns differ; the optimization levers differ.

### The biggest leverage points

For most ML-heavy workloads:

```
TOP LEVERAGE POINTS (impact order):

1. MODEL SELECTION (most impact)
   Routing simple queries to cheaper models
   Often 70-90% of inference cost recoverable
   Requires query-classification logic
   
2. BATCH PROCESSING (high impact)
   Combining inference calls (5-50x throughput)
   Bedrock supports batch inference at lower cost
   For non-real-time use cases
   
3. PROVISIONED THROUGHPUT TUNING (medium-high impact)
   Right-size committed capacity
   Move to on-demand when low utilization
   
4. TRAINING ON SPOT (medium impact)
   ~70-90% savings on training compute
   Requires checkpointing
   
5. GPU SCHEDULING (medium impact)
   Idle GPU instances cost serious money
   Schedule off when training not running
```

The first two — model selection + batching — usually capture 80%+ of recoverable cost.

### The 10 Bedrock rules

```
Bedrock rules span RC-1601..1610 (e.g. RC-1601 provisioned-throughput
idle, RC-1607 agent idle). The SageMaker rules run RC-1611..1628
(idle endpoints, off-hours scheduling, rightsizing, compliance, e.g.
RC-1628 HyperPod volume-not-CMK-encrypted), with a few more through
RC-1634. The canonical rule names and IDs live in L2 and in the
recommender rule catalog; treat that as the source of truth.
```

Each addresses a specific cost pattern. Customers see them in recommendations.

### Combining patterns

```
TYPICAL ML COST RECOVERY:

  Workload baseline: $126K/month
  
  After applying:
    Model selection (route by complexity):    -$80K/month  (64%)
    Batch processing for offline tasks:        -$15K/month
    Provisioned throughput right-sizing:        -$8K/month
    
  Result: $23K/month (-82% from baseline)
  
The pattern: each lever compounds
```

The cumulative savings are significant for ML-heavy workloads.

---

## 2. Demo

A team's ML cost analysis:

```
WORKLOAD: customer service chatbot using Bedrock
  Calls Claude Opus for every user query
  Average: 800 input + 400 output tokens
  Volume: 100K queries/day

CURRENT COST:
  100K × (800/1M × $15 + 400/1M × $75)
  = 100K × ($0.012 + $0.030)
  = 100K × $0.042
  = $4,200/day
  = $126K/month

ANALYSIS:
  Most queries are simple (greetings, status questions, simple lookups)
  Sonnet would handle 85% of queries adequately
  Haiku would handle 70% of queries adequately
  Opus is overkill for non-complex queries

RECOMMENDATION: route based on query complexity
  Simple queries (70%) → Haiku
    $0.80/M × 800/1M + $4/M × 400/1M = $0.0024/query
    70K queries: $168/day
    
  Medium queries (15%) → Sonnet
    $3/M × 800/1M + $15/M × 400/1M = $0.0084/query
    15K queries: $126/day
    
  Complex queries (15%) → Opus (unchanged)
    100K × 0.15 = 15K queries
    $0.042/query: $630/day

REVISED COST: $168 + $126 + $630 = $924/day = $27.7K/month

SAVINGS: $126K - $28K = $98K/month (78% reduction)

EFFORT:
  Implement query-complexity classifier (~2 weeks)
  Test classification accuracy
  Gradual rollout
  Monitor quality metrics
```

The savings justify the engineering investment many times over.

---

## 3. Hands-on (5 min)

Identify a Bedrock workload:

```
□ STEP 1: Inventory Bedrock usage
  Workloads using Bedrock: _____
  Top spender: __________

□ STEP 2: Analyze top workload
  Model used: __________
  Avg input tokens: _____
  Avg output tokens: _____
  Volume per day: _____

□ STEP 3: Calculate cost
  Cost per call: $_____
  Monthly cost: $_____

□ STEP 4: Could a cheaper model handle it?
  Sonnet candidate? □ Yes □ No
  Haiku candidate? □ Yes □ No
  Percentage of queries: _____%

□ STEP 5: Estimate savings
  Current: $_____/mo
  With routing: $_____/mo
  Savings: $_____/mo
```

A 15-minute exercise reveals the model-selection opportunity.

---

## 4. Knowledge check

### Q1
A workload using Opus for all queries when most could use Haiku:

A. Standard practice
B. Significantly overspending. Opus is ~18.75x more expensive than Haiku per token. Route by complexity. Model selection is the biggest Bedrock cost lever — often 60-80% recoverable.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Model selection is the biggest Bedrock cost lever.
</details>

### Q2
Bedrock charges:

A. Per request
B. Per input token + per output token, with rates varying by model. Token-based pricing means efficiency in token count + model choice both matter.
C. Per hour
D. Per GB

<details>
<summary>Show answer</summary>

**Correct: B.** Token-based pricing per model.
</details>

### Q3
GPU instances running 24/7 for training:

A. Optimal
B. Likely wasteful — training is intermittent. Scheduling + Spot instances for training jobs can cut 70-90% of cost. GPU idle time is the biggest GPU-related cost waste.
C. Random
D. Required for ML

<details>
<summary>Show answer</summary>

**Correct: B.** Scheduling + Spot for training.
</details>

---

## 5. Apply

The 10 Bedrock rules surface these optimization patterns. Review in Recommendations → filter by RC-16xx rules.

For your team: ML cost is often the fastest-growing line item; optimization here pays off quickly.

---

## Related lessons

- [L2 — Bedrock rules detail](L2_bedrock_rules.md) *(next)*
- [L3 — Model selection](L3_model_selection.md)
- [L4 — Batch processing](L4_batch_processing.md)
- [L5 — Provisioned throughput](L5_provisioned_throughput.md)

## Glossary terms touched

[Bedrock pricing](../../../reference/glossary/bedrock-pricing.md) · [Model selection lever](../../../reference/glossary/model-selection-lever.md) · [ML cost driver](../../../reference/glossary/ml-cost-driver.md) · [GPU scheduling](../../../reference/glossary/gpu-scheduling.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.11.L1
