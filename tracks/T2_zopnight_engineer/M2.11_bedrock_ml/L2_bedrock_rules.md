# Bedrock rules RC-1601..1610

§ T2 · M2.11 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **apply** the 10 Bedrock rules, **prioritize** by impact (model selection + caching first), **and execute** customer-side remediation.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Know what each Bedrock rule catches so I can route attention to the highest-impact optimizations." |
| **Personas** | ML Engineer · Platform Engineer · FinOps Lead |
| **Prerequisites** | M2.11.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Apply (Apply), Prioritize (Evaluate), Execute (Apply) |

---

## 1. Concept

```
THE 10 BEDROCK RULES:

RC-1601  Idle provisioned throughput         Unused throughput capacity
RC-1602  Over-provisioned throughput          Sized too high for actual usage
RC-1603  Model selection opportunity          Cheaper model would suffice
RC-1604  High output-to-input ratio           Verbose responses
RC-1605  Inefficient context usage           Stuffed context; repeated content
RC-1606  No prompt caching enabled           Could cache between calls
RC-1607  Sequential calls (not batched)      Calls could be batched
RC-1608  Long-running custom model            Always-on, unused capacity
RC-1609  Unused fine-tuned model              Created but no inferences
RC-1610  Streaming vs batch mismatch         Wrong API for the workload
```

Each catches a specific pattern. Together, they cover the major Bedrock cost levers.

### Top 3 rules by typical impact

```
RC-1603 — MODEL SELECTION (often biggest)
  Detection: token usage patterns suggest cheaper model would handle workload
  Savings: 50-90% on inference cost
  Effort: medium (route logic in app)
  
RC-1606 — PROMPT CACHING OPPORTUNITY
  Detection: long context repeated across calls
  Savings: 40-80% on inference cost
  Effort: low-medium (enable caching API)
  
RC-1601/02 — IDLE / OVER-PROVISIONED THROUGHPUT
  Detection: provisioned throughput utilization < 30%
  Savings: 30-70% on throughput cost
  Effort: low (reduce capacity in console)
```

These three drive most of the optimization. Address them first.

### Per-rule remediation guidance

```
RC-1603 (Model Selection):
  Route by query complexity
  Haiku for simple queries (chitchat, status)
  Sonnet for medium queries (most use cases)
  Opus for complex queries (creative, complex reasoning)
  Most workloads can save 60-80% with routing
  Implementation: classifier + routing logic
  Timeline: 1-2 weeks
  
RC-1606 (Prompt Caching):
  Enable Bedrock's prompt caching
  Cached prompts cost ~10% of full price
  Best for: chatbots with system prompts
              Batch processing with templates
              Multi-turn conversations
  Implementation: configuration change + API param
  Timeline: 1-2 days
  
RC-1601 (Idle Provisioned Throughput):
  Identify low-utilization provisioned throughput
  Options:
    Reduce units of throughput (immediate savings)
    Switch to on-demand (if usage doesn't justify)
  Implementation: AWS console change
  Timeline: minutes
  
RC-1604 (Verbose Responses):
  Reduce max_tokens for the use case
  Most apps don't need 4K tokens; 500-1000 sufficient
  Add prompts to be concise
  Implementation: config change
  Timeline: hours
  
RC-1607 (Batching):
  Use Bedrock's batch API for non-real-time
  Significantly cheaper per token
  For: scoring, classification, batch processing
  Implementation: refactor calling pattern
  Timeline: days
  
RC-1605 (Context Usage):
  Reduce repeated context
  Use prompt caching (RC-1606)
  Optimize prompt structure
  Implementation: prompt engineering
  Timeline: hours
```

Each rule has a typical effort + savings profile.

### Action paths — who fixes what

```
RULE      CAN ZopNight AUTO-FIX?              CUSTOMER ACTION
──────────────────────────────────────────────────────────────
RC-1601   Recommend (manual reduction)        Reduce provisioned units
                                              In AWS console
                                              
RC-1602   Recommend                            Resize provisioned throughput
                                              
RC-1603   Recommend (code change needed)      Update application code
                                              Implement routing
                                              
RC-1604   Recommend (config change)            Reduce max_tokens
                                              Application configuration
                                              
RC-1605   Recommend (prompt engineering)       Restructure prompts
                                              Code change
                                              
RC-1606   Recommend (code change needed)      Add caching logic
                                              Application code
                                              
RC-1607   Recommend (code change needed)      Use batch API
                                              Application refactor
                                              
RC-1608/09/10: Recommend                       Application/operational changes
```

All Bedrock optimization requires customer-side code or config changes. ZopNight surfaces the opportunity with the savings number; the customer's ML team executes.

### Why ZopNight doesn't auto-execute Bedrock changes

```
REASONS:
  ML workloads are application-specific
    Routing logic depends on use case
    Quality requirements vary
    
  Code changes carry risk
    Need testing before production
    Quality monitoring needed
    
  Customer expertise required
    Knows their use case
    Knows their quality tradeoffs
    
ZOPNIGHT's role:
  Surface the opportunity
  Quantify the savings
  Suggest the approach
  Customer implements
```

The boundary is similar to the database denylist (M2.3.L5) — ZopNight advisory; customer executes.

### Common patterns across rules

```
INFERENCE SAVINGS COMPOUND:
  Apply RC-1603 (route to cheaper models): save 50%
  Apply RC-1606 (caching) on remaining: save 50% of remaining
  Combined: save 75% of original cost
  
  Apply RC-1604 (less verbose) on top: save another 10-20%
  Combined: save 80%+ of original cost
  
INFRASTRUCTURE SAVINGS ARE SIMPLER:
  RC-1601/02: reduce provisioned throughput
  Immediate cost reduction
  No code changes
  Quick wins
```

The savings compound; apply multiple rules in sequence.

### Quality vs cost trade-off

```
ROUTING TO CHEAPER MODELS (RC-1603):
  Risk: quality degradation if classification is wrong
  
  Mitigation:
    Start with high-confidence routing
    Monitor quality metrics
    Iterate the classifier
    Maintain Opus fallback for uncertain queries
    
  Typical accuracy after tuning: 90%+ correct routing
  Customer satisfaction: maintained or improved
  Cost: 60-80% lower
  
BATCH PROCESSING (RC-1607):
  Risk: latency (real-time → batched)
  
  Mitigation:
    Use batch only for non-real-time workloads
    Real-time queries stay synchronous
    
  Typical: 50% of inference becomes batch
  Cost: significant savings
```

The quality risk is real but manageable. The cost upside is large.

---

## 2. Demo

A team's Bedrock audit:

```
AUDIT RESULTS:

RC-1603 (Model Selection): 3 chatbots using Opus where Sonnet would suffice
  Estimated savings: $14,200/month
  
RC-1606 (Prompt Caching): 2 systems with repeated 8K-token system prompts
  Estimated savings: $4,800/month
  
RC-1601 (Idle Throughput): 1 provisioned throughput at 18% utilization
  Estimated savings: $2,400/month

TOTAL OPPORTUNITY: ~$21,400/month

ACTION TAKEN over next month:

WEEK 1:
  RC-1601: Reduce provisioned throughput in AWS console
  Immediate savings: $2,400/month
  Risk: none (was idle)
  
WEEK 2-3:
  RC-1606: Enable prompt caching
  Test with 1 service first
  Verify quality unchanged
  Roll out to 2nd service
  Savings: $4,800/month

WEEK 3-4:
  RC-1603: Implement model routing
  Build query classifier
  Route 70% to Haiku, 15% to Sonnet, 15% Opus
  Monitor quality metrics
  Iterate
  Savings: $14,200/month
  
ROLLOUT RESULTS (1 month in):
  Realized: ~$19,800/month savings (92% of opportunity)
  Quality metrics: stable
  Customer satisfaction: unchanged
  Engineer effort: 4 weeks across team

DECISION: continue with same rules quarterly
  Audit for new opportunities
  Address compound savings
```

The pattern: prioritize by impact; execute in order; verify quality.

---

## 3. Hands-on (5 min)

Audit your Bedrock workloads:

```
□ STEP 1: Open Recommendations; filter RC-16xx
  Total Bedrock recommendations: _____
  
□ STEP 2: List top 3 by savings
  Rule 1: __________   Savings: $_____/mo
  Rule 2: __________   Savings: $_____/mo
  Rule 3: __________   Savings: $_____/mo

□ STEP 3: Effort assessment
  Rule 1: Effort: ___ weeks
  Rule 2: Effort: ___ weeks
  Rule 3: Effort: ___ weeks

□ STEP 4: Priority order
  Highest ROI: __________
  Next: __________
  
□ STEP 5: Plan execution
  Owner: __________
  Target completion: __________
  Quality monitoring plan: __________
```

A 15-minute audit identifies the highest-ROI Bedrock optimizations.

---

## 4. Knowledge check

### Q1
RC-1603 (model selection) recommendation. The savings come from:

A. Using fewer tokens
B. Routing workload to a cheaper model for queries that don't need top-tier capability. Most workloads can save 60-80%. The cost difference between Opus and Haiku is 50-100x per token; routing captures most of that.
C. Disabling Bedrock
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Model routing.
</details>

### Q2
Prompt caching (RC-1606) is best for:

A. All workloads
B. Workloads with repeated context (system prompts, RAG templates). Caching reduces the input token cost by ~90% on the repeated portion. Best for chatbots, batch processing, multi-turn conversations.
C. None
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Cacheable patterns.
</details>

### Q3
ZopNight auto-remediates Bedrock rules:

A. Yes
B. No — Bedrock optimization requires customer-side code/config changes. ZopNight surfaces opportunities with savings numbers; team's ML engineers execute. ML workloads are application-specific; ZopNight stays advisory.
C. Random
D. Approval-gated

<details>
<summary>Show answer</summary>

**Correct: B.** Customer execution.
</details>

---

## 5. Apply

Bedrock rules in Recommendations filtered by RC-16xx.

For your team: prioritize by savings + effort. Implement in waves; verify quality at each step.

---

## Related lessons

- [L1 — ML cost landscape](L1_ml_landscape.md)
- [L3 — Model selection](L3_model_selection.md) *(next)*
- [L4 — Batch processing](L4_batch_processing.md)
- [L5 — Provisioned throughput](L5_provisioned_throughput.md)

## Glossary terms touched

[Bedrock rule](../../../reference/glossary/bedrock-rule.md) · [Model routing](../../../reference/glossary/model-routing.md) · [Prompt caching](../../../reference/glossary/prompt-caching.md) · [Customer-execution rule](../../../reference/glossary/customer-execution-rule.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.11.L2
