# Multiplier vs expected requests

§ T2 · M2.9 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right capacity model for an event, **calculate** event capacity using both models, **and reconcile** when models disagree.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Size event capacity accurately — neither over-provisioning (cost) nor under-provisioning (saturation risk)." |
| **Personas** | Platform Engineer · SRE · Capacity Planning |
| **Prerequisites** | M2.9.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Calculate (Apply), Reconcile (Analyze) |

---

## 1. Concept

Two models for calculating event capacity:

```
MULTIPLIER MODEL:
  Capacity = current_capacity × N
  Where N = expected traffic multiplier
  
EXPECTED REQUESTS MODEL:
  Capacity = expected_requests / max_per_instance × headroom
  Where headroom = safety factor (1.3-1.5 typical)
```

Different inputs; same destination — capacity needed for the event.

### Multiplier model

```
INPUTS:
  Current capacity: 12 instances
  Multiplier:        3x

CALCULATION:
  Event capacity: 12 × 3 = 36 instances
```

Best when:

```
✓ Event traffic is "N times normal"
✓ You don't have precise request-per-second estimates
✓ Historical pattern suggests proportional scaling
✓ Marketing or business gives multiplier projection
  ("Black Friday is 3-5x our typical day")
```

The multiplier model is simpler. Often easier for non-engineers to think about.

### Expected requests model

```
INPUTS:
  Expected requests/sec during event: 1,200
  Per-instance capacity:               50 req/sec (from load testing)
  Safety multiplier:                   1.5x (headroom)

CALCULATION:
  Event capacity = 1,200 / 50 × 1.5
                = 36 instances
```

Best when:

```
✓ You have concrete request-per-second projections
✓ Marketing gives expected RPS
✓ Load tests established per-instance capacity
✓ Want to be precise; not just "Nx normal"
```

The requests model is more rigorous but requires more data.

### Comparing the models

```
SCENARIO                                BEST MODEL
─────────────────────────────────────────────────────
"Black Friday is 3x normal"             Multiplier (3x)
                                        Simple; matches the framing
                                        
"Marketing forecasts 1,500              Expected requests
  signups/sec at peak"                  Have the data; use it
                                        
"Load test ran 5,000 RPS"               Expected requests
                                        Concrete RPS data
                                        
"Don't know exact numbers"               Multiplier (conservative)
                                        Make reasonable guess
                                        Pick larger multiplier
                                        
"New feature; no historical data"        Expected requests + load test
                                        Run load test first
                                        Then use the model
                                        
"Different services see different impacts" Both per-target
                                          Multi-target multipliers
```

Pick based on what data you have.

### Both models produce the same equation

```
THE UNDERLYING MATH:
  
  Capacity = (req/sec) / (per_instance_capacity) × headroom_factor
           = current_capacity × multiplier
  
  If you know req/sec and per-instance capacity: use Expected Requests
  If you have a historical multiplier: use Multiplier
  
  Both arrive at the same place when inputs are consistent
```

The choice is about input availability, not output difference.

### Per-target overrides — complex events

For events spanning multiple targets with different traffic patterns:

```
EVENT: Black Friday
  
  ASG-checkout:     multiplier 4x (heavy checkout volume)
  ASG-api:           multiplier 3x (proportional)
  ASG-search:        multiplier 2x (less affected by Black Friday)
  ASG-recommendations: multiplier 5x (heavy traffic from product browsing)
  
  Different targets see different traffic patterns
```

The wizard lets you set per-target multipliers based on workload-specific behavior. Some workloads see disproportionate impact during specific events.

### The wizard's calculation

When you enter event parameters:

```
WIZARD INPUTS:
  Provider:     AWS
  Target:       asg-checkout
  Current cap:  12
  Multiplier:   3x
  Override:     (allow user to specify)

WIZARD OUTPUT:
  Current capacity: 12
  Recommended: 36 (3x calculation)
  
  [Edit override] → user can specify a different number
  e.g., 40 (rounding up for safety)
```

Override is the manual editing surface. ZopNight calculated; the user can refine.

### When models disagree

```
SCENARIO:
  Multiplier model says: 30 instances (4x current 8)
  Expected requests says: 48 instances (1,200/30 × 1.5)
  
  Discrepancy: 60% difference

INVESTIGATION CHECKLIST:
  Is per-instance capacity measurement current?
    Run new load test if old
  Is the multiplier conservative?
    May need higher
  Is the multiplier overconfident?
    May need lower
  Does deployment optimization affect per-instance capacity?
    Recent optimizations may have changed it
    
RESOLUTION:
  Pick the more cautious number (usually larger)
  Or: do another load test to verify per-instance capacity
  Or: reconcile and pick a midpoint with documented reasoning
```

The disagreement is the signal to investigate. Don't just pick one without understanding why they disagree.

### Per-instance capacity testing

```
LOAD TESTING is the gold standard:
  
  Setup: realistic traffic pattern; representative load
  Measure: max sustainable req/sec at acceptable latency
  Headroom: subtract 20-30% for safety
  
  Result: capacity per instance
  
EXAMPLE:
  Instance starts choking at 60 req/sec (latency spikes)
  Sustainable rate: 50 req/sec at acceptable latency
  Use 50 req/sec for capacity calculations
  
PERIODIC RE-TESTING:
  Every 6 months
  After major deployment changes
  After cloud provider hardware updates
```

The load test is what makes Expected Requests model accurate.

### Headroom factors

```
HEADROOM FACTOR (multiplied on top of base capacity):
  
  Conservative (1.5x):
    More headroom; cost slightly higher
    Good for first-time events
    Critical revenue events
    
  Standard (1.3x):
    Mid-range headroom
    Most events
    
  Aggressive (1.1x):
    Tight; cost-optimized
    Only when very confident
    Lots of historical data
    
  Default in ZopNight: 1.5x for new events
```

Headroom is the safety margin. Higher = safer + more expensive.

---

## 2. Demo

A team's event capacity planning:

```
EVENT: Marketing campaign launch (new sign-up flow)
TARGET TIER: 3 production ASGs

PROJECTED traffic:
  Marketing predicts 800 signups/sec at peak (for new sign-up flow)
  Historical: 200 signups/sec is typical

CAPACITY CALCULATION (two models):
  
  MULTIPLIER MODEL:
    Current: 8 instances
    Multiplier: 200 → 800 = 4x
    Target: 32 instances
    
  EXPECTED REQUESTS MODEL:
    Per-instance capacity: 25 signups/sec (from load test 2 weeks ago)
    Need: 800 / 25 × 1.5 = 48 instances

DISAGREEMENT: 32 vs 48 (50% difference)

INVESTIGATION:
  Question: is per-instance capacity test current?
    Test was 2 weeks ago
    Recent deployment optimization launched 1 week ago
    Optimization should have improved per-instance throughput
    
  Re-test: per-instance capacity now 30 req/sec (improved from 25)
  
  Recalculate Expected Requests:
    800 / 30 × 1.5 = 40 instances

REVISED MODELS:
  Multiplier: 32
  Expected Requests: 40
  
  Still disagreement; closer (20%)
  
DECISION:
  Pick 40 instances (more cautious; better safety margin)
  Set wizard: Multiplier mode but override the target to 40 explicitly
  Documented rationale: "Load test post-optimization shows 30 RPS/instance.
                         800 RPS / 30 × 1.5 = 40 instances needed"
                         
OUTCOME:
  Event day: 800 RPS arrived
  Capacity at 40 instances handled cleanly
  P99 latency: normal
  No saturation
  Marketing campaign successful
```

The models disagree → investigate the discrepancy → settle on a number.

---

## 3. Hands-on (5 min)

Try both models for a hypothetical event:

```
□ STEP 1: Define event
  Event: __________
  Current capacity: __________
  Expected multiplier: __________
  Expected RPS: __________

□ STEP 2: Multiplier model
  Current × multiplier = _____ instances

□ STEP 3: Expected requests model
  Per-instance capacity (load tested): _____ req/sec
  Required: ___ / ___ × 1.5 = _____ instances

□ STEP 4: Compare
  Multiplier: _____
  Expected: _____
  Difference: _____%

□ STEP 5: Reconcile if needed
  Investigation: __________
  Final decision: _____
```

A 10-minute exercise per event. Models should agree within 20% when data is fresh.

---

## 4. Knowledge check

### Q1
A multiplier of 4x on current capacity of 12:

A. 12 instances
B. 12 × 4 = 48 instances. Direct multiplication of current capacity by the multiplier.
C. Random
D. 0

<details>
<summary>Show answer</summary>

**Correct: B.** 48 instances.
</details>

### Q2
Expected requests model with 600 req/sec at peak, per-instance 40 req/sec, headroom 1.5x:

A. 15 instances
B. 22 instances (600 / 40 × 1.5 = 22.5 → 22 instances rounded). Standard calculation. Round up for safety.
C. 30
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** 22 instances.
</details>

### Q3
Models disagree (multiplier says 30, requests model says 40). The right approach:

A. Pick the smaller (cheaper)
B. Investigate the discrepancy. Likely cause: outdated per-instance capacity from old load test. Recalculate or pick the larger number for safety. Don't just commit without understanding why they disagree.
C. Average
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Investigate before committing.
</details>

---

## 5. Apply

Capacity models in Event Readiness wizard. Per-target multipliers available for complex events.

For your team: keep load test data fresh; reconcile model disagreement; document final decision.

---

## Related lessons

- [L1 — What Event Readiness](L1_what_event_readiness.md)
- [L3 — Lifecycle](L3_lifecycle.md) *(next)*
- [L4 — Database monitor-only](L4_db_monitor.md)
- [L5 — Cost estimate](L5_cost_estimate.md)

## Glossary terms touched

[Multiplier model](../../../reference/glossary/multiplier-model.md) · [Expected requests model](../../../reference/glossary/expected-requests-model.md) · [Per-instance capacity](../../../reference/glossary/per-instance-capacity.md) · [Headroom factor](../../../reference/glossary/headroom-factor.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.9.L2
