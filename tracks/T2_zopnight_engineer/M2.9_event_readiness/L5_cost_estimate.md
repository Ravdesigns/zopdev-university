# The cost-estimate badge

§ T2 · M2.9 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** the cost-estimate badge, **interpret** the confidence band and per-target breakdown, **and justify** event cost vs revenue impact.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Justify Event Readiness cost to Finance — show the estimate, the confidence band, and the ROI calculation." |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Manager |
| **Prerequisites** | M2.9.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Interpret (Understand), Justify (Evaluate) |

---

## 1. Concept

Event Readiness shows a cost estimate before commit. The estimate has a confidence band, an `isEstimated` flag, and a breakdown by target.

```
THE ESTIMATE TELLS YOU:
  Total additional cost for the event
  Per-target breakdown
  Confidence band (e.g., ±15%)
  Whether it's "estimated" or "calculated"
  ROI framing vs business value
```

The estimate is the basis for the commit decision.

### What the estimate covers

```
EVENT: Black Friday 2026 (24 hours)
SCOPE: 3 production ASGs

COST ESTIMATE:
  Pre-warm cost (24h of event capacity):  $4,800 ±15%
  Scale-down cost (1 hour ramp-back):        $50
  Total additional cost for event:        $4,850
  
  Baseline cost continues normally:        $X,XXX (unchanged)
  
  Per-target breakdown:
    asg-checkout (40 instances × 24h):    $2,880
    asg-api (60 instances × 24h):          $1,680
    asg-search (30 instances × 24h):       $240
    
isEstimated badge: ⚠ YES
```

The transparency lets the customer make informed decisions.

### Why "estimated"

Three sources of estimation uncertainty:

```
1. ACTUAL PEAK DURATION UNKNOWN
   Event might be exactly 24h, or might extend by hours
   Marketing/business may make last-minute adjustments
   
2. CLOUD RATES CAN CHANGE
   Pricing API gives current rates
   Spot prices fluctuate
   On-demand can change rarely (but possible)
   
3. PER-INSTANCE COST VARIES
   RI coverage affects effective per-instance cost
   Savings plans cover variable share
   Sustained-use discounts kick in at certain durations
   
THE ESTIMATE USES current rates and defined duration
ACTUAL COST may vary
```

The uncertainty is reasonable; the estimate is best-effort given the inputs.

### The confidence band

```
COST ESTIMATE: $4,800 ±15%

Lower bound:  $4,080
  (Best case: spot pricing held; event ended on time;
              RI coverage fully utilized)

Upper bound:  $5,520
  (Worst case: rates rose; event extended;
              spot capacity limited)

BAND CALCULATION:
  Recent pricing volatility
  Event duration variance
  Capacity flexibility
  Historical accuracy on similar events
  
For LARGER EVENTS with more uncertainty: bands widen to ±25%
For ROUTINE EVENTS with historical data: bands tighten to ±10%
```

The band gives the customer a realistic range.

### Reading the breakdown

```
PER-TARGET BREAKDOWN:
─────────────────────────────────────────────────────────────────
asg-checkout
  Current:  12 × $4/hr = $48/hr
  Event:    40 × $4/hr × 24h = $3,840
  Additional: $3,840 - ($48 × 24) = $2,688
  Note: assumes $4/hr rate per instance

asg-api
  Current:  20 × $3/hr = $60/hr
  Event:    60 × $3/hr × 24h = $4,320
  Additional: $4,320 - ($60 × 24) = $2,880

asg-search
  Current:  5 × $2/hr = $10/hr
  Event:    30 × $2/hr × 24h = $1,440
  Additional: $1,440 - ($10 × 24) = $1,200
```

The breakdown shows where the estimated cost lands. Helps identify the biggest contributors.

### What the badge means

```
NO BADGE:
  Cost is confidently calculated from pricing data + capacity plans
  Rarely true for new events
  Common for repeated events with history
  
isEstimated = YES:
  Estimate is best-effort
  Actual cost can vary ±15% (or larger for big events)
  Most realistic for any first-time event
  Customer should plan for upper bound

EVOLUTION:
  First execution: badge always YES
  After first execution: real cost data available
  After multiple executions: confidence builds; band tightens
  Eventually: badge removes; calculation is reliable
```

The badge is on by default. It removes once enough actual event data is gathered.

### Updating the estimate

Estimates update if:

```
EVENT CONFIG CHANGES:
  Capacity multiplier adjusted
  Duration changes
  Scope added/removed
  
PRICING DATA UPDATES:
  Weekly sync of pricing_cache
  Spot rates change
  RI coverage adjustments
  
CUSTOMER triggers re-estimate:
  Manual refresh
  After config changes
  Before final commit
```

The customer can re-estimate at any time via the wizard.

### Cost vs benefit framing

Event Readiness costs are typically much less than the customer experience benefit:

```
EVENT: Black Friday
ESTIMATED EVENT READINESS COST: $4,800
EXPECTED ADDITIONAL REVENUE: $250,000+
  (Based on smooth performance maintaining conversion)

ROI: 50x

THE ESTIMATE IS SMALL relative to the value of avoiding
lost sales from latency spikes
```

This framing helps justify the cost to Finance.

### Avoiding under-justification

```
COMMON MISTAKE: present only the cost
  "Event Readiness will cost $4,800. Approve?"
  Finance: "$4,800 is a lot for a one-time scheduling thing."
  Decision delayed; may not approve

BETTER: present cost + value
  "$4,800 cost; projected $250K revenue impact from smooth event"
  "50x ROI"
  "Without this: estimated $25K loss from latency-driven bounces"
  Decision is clear

DOCUMENTATION:
  Save the ROI calculation
  Save the comparison post-event
  Build a track record for future events
```

The cost without context is hard to approve. With value framing, easy decision.

### Post-event reconciliation

```
AFTER EVENT, reconcile estimate vs actual:

ESTIMATED COST: $4,800 ±15%
ACTUAL COST: $4,920
WITHIN ESTIMATE BAND: yes (within $4,080 - $5,520)

ACCURACY: estimate was within 3% of actual
CONFIDENCE: tightens for next time

OVER MULTIPLE EVENTS:
  Estimate accuracy improves
  Band tightens
  Eventually: isEstimated badge removes
  Calculations become precise
```

Reconciliation feeds the learning loop.

---

## 2. Demo

A team's first event estimate review:

```
EVENT: Marketing campaign Nov 30 (24 hours)

ZopNight shows in wizard:

  PRE-WARM 1 HOUR BEFORE: minimal cost (~$200)
  
  EVENT WINDOW (24 hours):
    asg-marketing-api:    25 → 60 instances = $2,160
    asg-search:           10 → 25 instances = $360
    asg-notification:      5 → 15 instances = $180
    TOTAL EVENT WINDOW:   $2,700
    
  SCALE-DOWN (1 hour ramp-back): ~$30
  
  GRAND TOTAL:            ~$2,930 ±15%
  
  isEstimated: YES
  Confidence: 85% (first-time event for this scope)

CUSTOMER REASONING:
  Compare to estimated impact:
  
  ESTIMATED REVENUE IMPACT FROM AVOIDING LATENCY SPIKES:
  ~$45,000 (conservative — based on marketing's projected conversions
   without latency-related dropoff)
  
  ROI: $45K / $3K = 15x
  
  Plus: brand experience preserved
  Plus: customer trust maintained
  
DECISION: approve Event Readiness for $3K to capture $45K opportunity

POST-EVENT (Dec 1):
  Actual cost: $3,060 (close to estimate)
  Actual revenue impact: $52K (above projection)
  ROI confirmed: 17x
  
  Lessons:
    Estimate accurate within 5%
    Capacity adequate for actual peak
    No issues during event
  
  For next event: confidence higher; band can tighten
```

The math makes the case clearly.

---

## 3. Hands-on (5 min)

Read a cost estimate:

```
□ STEP 1: Open Event Readiness; pick an event
  Event: __________
  Cost estimate: $_____
  Confidence band: ±___%

□ STEP 2: Per-target breakdown
  Target 1: __________   Cost: $_____
  Target 2: __________   Cost: $_____
  Target 3: __________   Cost: $_____

□ STEP 3: Estimate vs revenue impact
  Expected revenue if successful: $_____
  Expected loss if latency spikes: $_____
  ROI: _____x

□ STEP 4: Decision
  □ Approve (ROI strong)
  □ Reject (ROI weak; investigate options)
  □ Adjust capacity (cost too high; reduce multiplier)

□ STEP 5: Post-event commit
  When to reconcile: __________
  Owner: __________
```

A 10-minute exercise builds the cost-justification muscle.

---

## 4. Knowledge check

### Q1
The cost-estimate badge `isEstimated = YES` indicates:

A. Bug
B. Best-effort cost estimate. Actual cost can vary ±15% (or larger). Estimates improve as events are executed and rate data improves. Common for first-time events; rare for repeated events.
C. Always wrong
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Estimate confidence; not a guarantee.
</details>

### Q2
A team sees a ±25% band on a large 7-day event. The interpretation:

A. Estimate is bad
B. Larger events with longer duration have more uncertainty. Pricing changes, spot variation, and event extension all compound. The band reflects this. Plan for upper bound.
C. Cancel
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Longer/larger = wider band.
</details>

### Q3
A team's Event Readiness ROI calculation: $5K estimate vs $80K expected revenue impact. The ROI:

A. Approve
B. 16x ROI is strong. Worth approving. The estimate is small relative to the value of avoiding latency-driven customer experience issues. Document the math for future events.
C. Reject
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Strong ROI; approve.
</details>

---

## 5. Apply

Cost estimate appears in Event Readiness wizard. Breakdown by target. Confidence band shown explicitly.

For your team: always present cost + value to Finance, not just cost. ROI math is the easy approval path.

---

## Module quiz

Complete M2.9 → 10-question module quiz unlocks the **Event-Ready** chip.

---

## Related lessons

- [L1 — What Event Readiness](L1_what_event_readiness.md)
- [L2 — Capacity models](L2_capacity_models.md)
- [L3 — Lifecycle](L3_lifecycle.md)
- [L4 — Database monitor-only](L4_db_monitor.md)
- [M2.4 — VM autoscaling](../M2.4_vm_autoscaling/00_README.md)

## Glossary terms touched

[Cost estimate](../../../reference/glossary/cost-estimate.md) · [Confidence band](../../../reference/glossary/confidence-band.md) · [isEstimated badge](../../../reference/glossary/isestimated-badge.md) · [ROI framing](../../../reference/glossary/roi-framing.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.9.L5
