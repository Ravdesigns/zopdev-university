# How predictions are inferred

§ T2 · M2.8 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **understand** the signals the auto-tagger uses, **explain** the composite scoring approach, **and debug** unexpected predictions by tracing the signal contributions.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Know how the auto-tagger thinks so I can trust the high-confidence predictions and debug the low-confidence ones." |
| **Personas** | Platform Engineer · FinOps Lead · ZopNight Admin |
| **Prerequisites** | M2.8.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Understand (Understand), Explain (Understand), Debug (Analyze) |

---

## 1. Concept

The auto-tagger is rule-based, not ML. It combines several signals to produce predictions. Predictable, explainable, debuggable.

```
SIGNAL TYPES:
  1. Naming patterns (strongest single signal)
  2. Existing tags (corroborates or infers)
  3. Instance configuration (size, multi-AZ, etc.)
  4. Resource group context (explicit human signal)
  5. Cloud account context (org-level grouping)
  
COMPOSITE SCORING combines them
  Multiple signals agreeing = high confidence
  Conflicting signals = lower confidence
  
RULE-BASED + DETERMINISTIC
  Same inputs always produce same predictions
  Reproducible; auditable
  No black-box "magic"
```

The rule-based approach trades sophistication for transparency.

### Signal 1 — Naming patterns

```
NAME PATTERN                 PREDICTION         CONFIDENCE WEIGHT
─────────────────────────────────────────────────────────────────
"-dev", "dev-"                env = dev          40
"-staging", "stg-", "-stage"  env = staging      40
"-test", "qa-"                env = test         40
"-prod", "prd-"               env = prod         40
"-mgmt", "infra-"             env = (no direct)   -
"production"                  env = prod         40
"shared", "common"            env = (no direct)   -
```

Naming patterns are the strongest single signal. They're cheap to detect and frequently used.

### Signal 2 — Existing tags

```
EXISTING TAG                                  PREDICTION
─────────────────────────────────────────────────────────────────
environment=dev                              env=dev (confirmed)
"Env" tag with value "dev"                   env=dev (corroborated)
                                              (Auto-tagger normalizes
                                              to lowercase env=)
                                              
"team=platform-prod"                          env=prod (inferred from
                                              tag value contains "prod")
                                              
"cost_center=finance-eng-prod"                env=prod (similar inference)
```

Existing tags are used both to corroborate and to infer.

### Signal 3 — Instance configuration

```
SIGNAL                              PREDICTION CONTRIBUTION
─────────────────────────────────────────────────────────────
Instance type larger (m5.4xlarge)   More likely production
Instance type smaller (t3.nano)     More likely non-prod
Multi-AZ enabled                    More likely production
Public IP + LB attached             More likely production
Internal-only, single-AZ            More likely non-prod
Backup retention long                More likely production
Encryption at rest                   Slight prod signal
RI / commitment coverage             Often prod (committed capacity)
```

Configuration-based signals are weaker individually but contribute. A small dev VM with no public access strongly suggests non-prod.

### Signal 4 — Resource group context

```
RESOURCE IN GROUP "dev-cluster"             env=dev (high signal)
RESOURCE IN GROUP "prod-shared"             env=prod (high)
RESOURCE IN GROUP "ml-training-prod"        env=prod (high)
RESOURCE IN GROUP "staging-services"        env=staging (high)
```

Group membership is a clear signal because someone explicitly put it there. Higher confidence than name pattern alone.

### Signal 5 — Cloud account

```
ACCOUNT NAMED "prod-aws-us-east-1"          env=prod for all resources
ACCOUNT NAMED "dev-aws-sandbox"             env=dev for all resources
ACCOUNT NAMED "acme-shared-services"        env=(varies; weak signal)
```

Some orgs separate production and non-production at the account level. Account-level prediction is a strong baseline; per-resource signals can refine.

### Composite scoring example

```
RESOURCE: i-0abc123def
  Name: "ml-prod-train-1"
  Tags: (none)
  Instance type: m5.8xlarge
  Multi-AZ: true
  Group: "ml-prod-platform"
  Account: "prod-aws-us-east-1"

SIGNAL BREAKDOWN:
  Name pattern: "prod" → env=prod (+40)
  Tags: (none) → no contribution
  Instance type: m5.8xlarge → +5 prod (large)
  Multi-AZ: true → +10 prod
  Group: "ml-prod-platform" → +30 prod
  Account: "prod-aws-us-east-1" → +20 prod

TOTAL POINTS for env=prod: 105
MAX POSSIBLE for env=prod: ~115

CONFIDENCE = 105/115 = ~91%

PREDICTION: env=prod at 91% confidence
ACTION: high confidence; recommend accept or quick review
```

The composite of signals produces the confidence score.

### Noisy patterns the auto-tagger handles

```
EXAMPLE OF SINGLE-SIGNAL NOISE:

NAME: "prod-experiment-1"
  Single signal would say: env=prod
  
BUT OTHER SIGNALS:
  Group: "dev-experiments" → env=dev (+30)
  Instance type: t3.small → +5 non-prod
  Multi-AZ: false → +5 non-prod
  Account: "acme-dev-sandbox" → +20 dev
  
COMPOSITE:
  Name pattern (+40 prod) vs other signals (+60 dev)
  Wins: env=dev at 65% confidence
  
RESULT:
  Single-signal noise corrected by composite
  Lower confidence flagged for review
```

The composite scoring is robust to confused naming.

### noStop prediction

noStop predictions follow a similar pattern but use different signals:

```
SIGNAL                                       noStop CONTRIBUTION
─────────────────────────────────────────────────────────────────
env=prod                                     +50 (production = noStop=true)
Critical service (load balancer attached)    +20
Public-facing (DNS records, public IP)       +20
Active 24/7 traffic                          +10
"noStop=true" tag exists                     definitive
"can-stop=true" tag                          definitive (noStop=false)
env=dev with business-hours-only usage       -30 (dev = can-stop)
Multi-AZ                                     +10 (suggests prod)
Has scheduled jobs / cron                     -10 (already scheduled)
```

The output is a boolean: noStop=true (don't stop) or noStop=false (safe to stop on schedule).

### How the score combines to confidence

```
RAW SCORE → CONFIDENCE conversion:
  
  Total score (e.g., 95)
  Max possible score for that resource type (e.g., 110)
  
  Confidence = (raw_score / max_score) × 100%
  
  Calibrated against ground truth from beta customers
  
EXAMPLE THRESHOLDS:
  ≥95% confidence: high (bulk-accept candidate)
  85-95%: moderate (review-and-accept)
  70-85%: low-moderate (deliberate review)
  <70%: low (manual investigation)
```

The thresholds match empirical accuracy of the rule-based system.

### Debugging unexpected predictions

```
WHEN A PREDICTION FEELS WRONG:

1. Open the prediction in Insights → Auto-Tagging
2. Click "Show evidence"
3. Read the per-signal contribution:
   "Name pattern '-prod' suggests env=prod (+40)"
   "Group 'dev-experiments' suggests env=dev (+30)"
   "Instance type t3.small suggests non-prod (+5)"
   
4. Decide:
   Auto-tagger is wrong → reject + provide feedback
   Auto-tagger is right; my mental model wrong → accept

VERIFICATION:
  The evidence panel makes the prediction reproducible
  Same inputs → same prediction
  No mystery
```

The transparency builds trust.

---

## 2. Demo

A walked-through prediction:

```
RESOURCE: i-0xyz789abc
  Name: "checkout-svc-prod-1"
  Tags: { "team": "payments", "deployed-by": "terraform" }
  Instance type: m5.2xlarge
  Multi-AZ: true
  Region: us-east-1
  Public IP: yes
  LB-attached: yes (ALB)

SIGNALS:
  Name "prod" → +40 prod
  Team tag "payments" + suffix "prod" → no direct env signal
  m5.2xlarge → +5 prod (mid-large)
  Multi-AZ → +10 prod
  Public IP + LB → +20 prod
  No env tag → cannot corroborate
  No group context → 0

TOTAL: 75 points / 105 max = ~71% confidence env=prod

NOSTOP SIGNALS:
  Multi-AZ → +10
  Public IP + LB → +20
  Likely prod (env signal) → +50
  
TOTAL noStop: ~96% confidence noStop=true

ACTIONS RECOMMENDED:
  env=prod: 71% confidence → recommend REVIEW (verify before accept)
  noStop=true: 96% confidence → recommend ACCEPT (bulk-accept candidate)

EVIDENCE PANEL shows all this
  Reproducible; debuggable
  No mystery in how prediction was made
```

The composite score balances multiple signals; the evidence panel exposes the math.

---

## 3. Hands-on (5 min)

Inspect prediction reasoning:

```
□ STEP 1: Open Insights → Auto-Tagging → pick a prediction
  Resource: __________
  Prediction: __________
  Confidence: ___%

□ STEP 2: Click "Show evidence"
  Read the per-signal contribution

□ STEP 3: Identify dominant signals
  Top 3 contributing signals: 
    1. __________   contribution: ___
    2. __________   contribution: ___
    3. __________   contribution: ___

□ STEP 4: Verify against your knowledge
  Does the prediction match your understanding?
  □ Yes (accept)
  □ Mostly (review)
  □ No (reject + note feedback)

□ STEP 5: Cross-check
  Same prediction in another resource
  Same signal mix → same prediction?
  Reproducibility check
```

A 10-minute exercise builds trust in the auto-tagger's reasoning.

---

## 4. Knowledge check

### Q1
The auto-tagger uses which approach?

A. Machine learning
B. Rule-based (naming patterns, existing tags, instance config, group context, account context) with composite scoring. Predictable and debuggable. Same inputs always produce same predictions. No black-box "magic."
C. Random
D. Pure heuristic (no scoring)

<details>
<summary>Show answer</summary>

**Correct: B.** Rule-based scoring; transparent and reproducible.
</details>

### Q2
A resource named "prod-experiment-1" in a "dev-experiments" group, on a small instance. The prediction:

A. env=prod (name signal wins)
B. Composite favors dev — group context and instance type override the name signal. Confidence may be 60-70% for env=dev. Single-signal noise is corrected by composite scoring.
C. Random
D. env=prod always

<details>
<summary>Show answer</summary>

**Correct: B.** Composite signals correct single-signal noise.
</details>

### Q3
A resource has env=prod tag, m5.4xlarge, multi-AZ, behind LB. noStop prediction:

A. Random
B. noStop=true with high confidence — all signals point to production criticality. The composite of signals (env=prod, multi-AZ, LB, large instance) overwhelmingly supports noStop=true.
C. noStop=false
D. Inconclusive

<details>
<summary>Show answer</summary>

**Correct: B.** Multiple signals align.
</details>

---

## 5. Apply

The auto-tagger's signals are visible in the inference panel. Customer can see exactly why a prediction was made.

For your team: trust high-confidence predictions; debug low-confidence via evidence panel.

---

## Related lessons

- [L1 — Environment + noStop predictions](L1_predictions.md)
- [L3 — Accept / reject patterns](L3_accept_reject.md) *(next)*
- [L4 — Drift detection](L4_drift.md)
- [T5.M5.1.L1 — Tags as org debt](../../T5_devops_cost_discipline/M5.1_tagging_strategy/L1_org_debt.md)

## Glossary terms touched

[Composite scoring](../../../reference/glossary/composite-scoring.md) · [Signal weight](../../../reference/glossary/signal-weight.md) · [Rule-based prediction](../../../reference/glossary/rule-based-prediction.md) · [Evidence panel](../../../reference/glossary/evidence-panel.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.8.L2
