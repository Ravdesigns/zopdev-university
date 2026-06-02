# Model selection trade-offs

§ T2 · M2.11 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right model for a workload, **trade off** cost vs capability, **and execute** a mixed-routing pattern.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the cheapest model that handles the workload's quality requirements — avoid overpaying for capability you don't need." |
| **Personas** | ML Engineer · Platform Engineer · Product Engineer |
| **Prerequisites** | M2.11.L1 · M2.11.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Trade off (Evaluate), Execute (Apply) |

---

## 1. Concept

Bedrock offers many models at very different price points. Picking the wrong one is the biggest single Bedrock cost mistake.

```
MODEL COST + CAPABILITY MATRIX:

MODEL            COST/M IN+OUT     CAPABILITY              FIT
─────────────────────────────────────────────────────────────────────
Claude Opus       $15 + $75         Best reasoning          Complex analysis
Claude Sonnet     $3 + $15          Strong general          Most production
Claude Haiku      $0.80 + $4        Fast, capable           Simple Q&A, routing
Titan Express     $0.30 + $0.40     Basic                   Simple text gen
Llama 3.1 8B      $0.30 + $0.60     Basic                   Cost-extreme
Mistral models    varies            Varies                  Various
```

The cost variance is dramatic (100x between Opus and Titan). Picking wrong = paying for capability you don't use.

### Selection criteria

```
QUESTION TO ASK                          MODEL HINT
─────────────────────────────────────────────────────────
"Is precision critical?"                 Opus / Sonnet
"Is reasoning multi-step?"               Opus / Sonnet
"Is workload high-volume + simple?"      Haiku / Titan
"Does cost matter most?"                 Haiku / Titan
"Can response be approximate?"           Haiku / smaller model
"Need consistent style/voice?"           Higher-tier (Sonnet+)
"Latency-critical (real-time)?"          Haiku (faster)
"Long context needed?"                   Sonnet+ (better long-context)
```

The criteria are about workload requirements, not aspirational.

### Mixed-routing pattern

```
INCOMING QUERY:
  Step 1: Classify with Haiku (~$0.001 per classification)
  Step 2: Route based on complexity:
    Haiku for simple Q&A (60% of volume)
    Sonnet for medium complexity (35%)
    Opus for complex reasoning (5%)

VS ALL-OPUS:
  Every query goes to Opus regardless of complexity
  Cost: ~5x average

VS ALL-SONNET:
  Acceptable for many workloads
  But overspends on the simple 60%
  Cost: ~2x average

ROUTING WINS because most production workloads have
natural complexity distribution
```

The routing pattern is the highest-impact optimization for ML workloads.

### Why routing works

```
QUERY COMPLEXITY DISTRIBUTION (typical):
  60-70%: simple (status, lookup, classification)
  20-30%: medium (synthesis, summarization)
  5-10%:  complex (multi-step reasoning, analysis)
  
USING ALL OPUS:
  60-70% of queries overpay 50-100x
  Wasted capability on simple queries
  
USING ROUTING:
  Each query pays only what's needed
  Total cost: 10-25% of all-Opus
  Quality: usually maintained (simple queries don't need premium)
```

The distribution makes routing high-leverage.

### When NOT to use smaller models

```
SCENARIO                                     STAY ON OPUS / SONNET
─────────────────────────────────────────────────────────────────
Complex multi-step reasoning                  
  (research, analysis, architecture)
  
Critical decision-making                      
  (medical, legal, financial guidance)
  
Outputs feed into other automated systems     
  (chained AI workflows)
  
Output quality is the differentiator           
  (creative writing, brand voice)
  
Cost is not the bottleneck                    
  (low-volume but high-value)
  
Long context needed                            
  (smaller models may not handle long input well)
```

If precision or quality matters more than cost, stay on the better model.

### The routing implementation

```
ROUTING ARCHITECTURE:

  Incoming query → Classifier → Route to correct model
  
CLASSIFIER OPTIONS:
  Use Haiku for classification (cheap; accurate enough)
  Use a fine-tuned smaller model for classification
  Use rule-based heuristics (token count, keywords)
  
CLASSIFICATION SIGNAL EXAMPLES:
  Token count: short = simple
  Keywords: "explain in detail" → complex
  History: similar queries handled successfully by N model
  Confidence: classifier returns confidence; route accordingly
  
ROUTING DECISIONS:
  Always route by complexity (most common)
  Sometimes route by user tier (paid → higher model)
  Sometimes route by time (real-time → faster model)
```

The classifier itself uses Haiku ($0.001 per classification); near-zero cost.

### Quality monitoring during rollout

```
WHEN ROUTING TO CHEAPER MODELS:

  RISK: quality regression
  MITIGATION: monitor metrics

METRICS TO TRACK:
  Customer satisfaction (CSAT) per model
  Re-escalation rate (when did simple → complex?)
  Error rate
  Latency p95
  User feedback ratings
  
PROTOCOL:
  Start with high-confidence routes
  Monitor 1-2 weeks
  Expand if quality holds
  Iterate the classifier if quality drops
  Maintain higher-tier fallback for uncertain queries
```

The rollout is gradual; quality is verified at each step.

### Common routing patterns

```
PATTERN A — COMPLEXITY-BASED (most common)
  Classify by query complexity
  Route to matching model
  Best for: most production chatbots
  
PATTERN B — USER-TIER BASED
  Free tier → Haiku
  Paid tier → Sonnet
  Premium tier → Opus
  Best for: tiered SaaS products
  
PATTERN C — TASK-BASED
  Summarization → Haiku
  Q&A → Sonnet
  Code generation → Opus
  Best for: multi-purpose apps
  
PATTERN D — CONFIDENCE-BASED
  Classifier returns confidence score
  Low confidence → escalate to higher model
  Best for: maintaining quality bar
  
PATTERN E — HYBRID
  Multiple patterns combined
  E.g., user-tier + complexity
  Best for: mature ML products
```

The pattern matches the product's needs.

---

## 2. Demo

A team's model selection optimization:

```
WORKLOAD: customer support chatbot
  Currently: Claude Opus for every interaction
  Volume: 30K interactions/day
  Avg input: 1,200 tokens
  Avg output: 500 tokens

CURRENT COST:
  Per interaction: 
    Input: 1,200 / 1M × $15 = $0.018
    Output: 500 / 1M × $75 = $0.0375
    Total: $0.0555 per interaction
  Monthly: 30K × 30 × $0.0555 = $50,000

REVIEW:
  - 70% are simple "where is my order" / "what's my balance"
    Could route to Haiku
  - 25% are complex billing issues
    Sonnet is sufficient
  - 5% are escalations / complex
    Opus appropriate

REVISED ROUTING:
  Haiku 70% (simple queries):
    Per interaction: $0.00096 + $0.002 = $0.003
    
  Sonnet 25% (medium):
    Per interaction: $0.0036 + $0.0075 = $0.011
    
  Opus 5% (complex):
    Per interaction: $0.0555 (unchanged)

WEIGHTED AVERAGE per interaction:
  (0.70 × $0.003) + (0.25 × $0.011) + (0.05 × $0.0555)
  = $0.0021 + $0.00275 + $0.002775
  = $0.0078 per interaction
  
MONTHLY COST: 30K × 30 × $0.0078 = $7,000

SAVINGS:
  $50,000 - $7,000 = $43,000/month (86% reduction)
  Annual: $516,000

IMPLEMENTATION (4 weeks):
  Week 1: build query classifier
  Week 2: shadow-mode testing (classify but still send to Opus)
  Week 3: route 25% to Haiku; monitor quality
  Week 4: full rollout

OUTCOMES (post-implementation):
  Cost: $7,200/mo (close to projection)
  Quality: CSAT unchanged
  Latency: improved (Haiku is faster)
  Customer satisfaction: high
```

The routing changed nothing about user experience (Haiku handles simple queries fine). Only cost changed.

---

## 3. Hands-on (5 min)

Estimate routing opportunity:

```
□ STEP 1: Pick a Bedrock workload
  Workload: __________
  Current model: __________
  Volume per day: __________

□ STEP 2: Estimate complexity distribution
  Simple queries: ___%
  Medium queries: ___%
  Complex queries: ___%

□ STEP 3: Calculate current cost
  Per-query cost on current model: $_____
  Monthly: $_____

□ STEP 4: Calculate routed cost
  Weighted average per-query: $_____
  Monthly: $_____

□ STEP 5: Decide
  Savings: $_____/mo
  Effort: ___ weeks
  ROI: ___x
```

A 15-minute exercise per workload. Most workloads: routing captures 60-80%.

---

## 4. Knowledge check

### Q1
A workload with 70% simple queries currently using Opus. Best optimization:

A. Continue Opus
B. Route simple queries to Haiku. Estimate cost reduction at ~85%. Implementation: add a router (which itself uses Haiku for classification). 70% × 50-100x cost difference = massive savings.
C. Random
D. Switch to manual

<details>
<summary>Show answer</summary>

**Correct: B.** Mixed routing.
</details>

### Q2
A workload requires complex multi-step reasoning. Best model:

A. Haiku
B. Stay on Opus or use Sonnet. Reasoning quality matters more than cost. The use case justifies the premium model.
C. Titan
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Quality wins.
</details>

### Q3
The cost difference between Opus and Haiku for typical queries:

A. Negligible
B. ~50-100x — Opus costs $15/$75 per M tokens; Haiku costs $0.80/$4. The factor is dramatic. This is why model selection matters so much for cost.
C. ~10x
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 50-100x is the typical gap.
</details>

---

## 5. Apply

Mixed routing requires application changes. ZopNight's RC-1603 recommendation provides the savings estimate and which model categories to route to.

For your team: model selection is often the fastest path to significant ML cost savings.

---

## Related lessons

- [L1 — ML cost landscape](L1_ml_landscape.md)
- [L2 — Bedrock rules](L2_bedrock_rules.md)
- [L4 — Batch processing](L4_batch_processing.md) *(next)*
- [L5 — Provisioned throughput](L5_provisioned_throughput.md)

## Glossary terms touched

[Model selection](../../../reference/glossary/model-selection.md) · [Mixed routing](../../../reference/glossary/mixed-routing.md) · [Query classification](../../../reference/glossary/query-classification.md) · [Quality-vs-cost tradeoff](../../../reference/glossary/quality-vs-cost-tradeoff.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.11.L3
