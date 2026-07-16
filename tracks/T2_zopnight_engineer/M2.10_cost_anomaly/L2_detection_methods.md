# Percent deviation vs z-score

§ T2 · M2.10 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** the two anomaly detection methods, **understand** when each fires, **and predict** which method will trigger first for a given workload pattern.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand how anomaly detection works so I can predict when it fires and trust the results." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M2.10.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Understand (Understand), Predict (Apply) |

---

## 1. Concept

Two complementary methods detect anomalies. The higher severity wins.

```
TWO METHODS:
  1. Percent deviation (magnitude-based)
  2. Z-score (statistical-significance-based)
  
HIGHER SEVERITY WINS:
  Whichever method produces a higher severity becomes the official severity
  Customer sees the worst-case framing
  No anomaly is downgraded
```

The combined approach catches both "big changes" and "statistically unusual" patterns.

### Percent deviation

```
PERCENT DEVIATION:
  yesterday's cost: $X
  7-day rolling average: $Y
  percent deviation: (X - Y) / Y × 100

SEVERITY MAPPING:
  30-100% deviation:    warning
  100-500% deviation:   critical
  > 500% deviation:     emergency

CHARACTERISTICS:
  Simple to calculate
  Easy to explain
  Works well for steady-state cost patterns
  Magnitude-focused
```

The percent deviation is intuitive. Most users grasp it immediately.

### Z-score

```
Z-SCORE:
  Number of standard deviations from the mean
  
  z-score = (X - mean) / stddev

SEVERITY MAPPING:
  z >= 2  (95th percentile event):    warning
  z >= 3  (99.7th percentile event):  critical
  z >= 5  (extreme outlier):           emergency

  NOTE: the z-score path needs at least 14 data points to compute
  (minDataPointsZScore = 14). A short 7-day series does not qualify;
  the percent-deviation path (4-point minimum) carries those cases.

CHARACTERISTICS:
  Sensitive to volatility
  Statistically defensible
  Catches anomalies that percent deviation misses
  Variance-aware
```

Z-score uses the workload's own variance to judge what's unusual.

### When each fires — comparative table

```
SCENARIO                                     PERCENT     Z-SCORE       WINS
─────────────────────────────────────────────────────────────────────────
$100 → $150 (50%, stddev 5)                  50%        z=10          z (emergency)
$100 → $200 (100%, stddev 50)                100%       z=2           percent (warning)
$100 → $300 (200%, stddev 30)                200%       z=6.7         z (emergency)
$100 → $50  (-50%, stddev 5)                 -50%       z=-10         (suppressed — only above)
$1000 → $1010 (1%, stddev 5)                 1%         z=2           neither
$10 → $50 (400%, stddev 2)                   400%       z=20          z (emergency)
```

Higher severity wins, so the team always sees the more alarming framing.

### False positive guards

Three guards prevent noisy anomalies:

```
GUARD 1: MINIMUM 4 DATA POINTS
  If a resource has fewer than 4 days of data: no anomaly fires
  Prevents false anomalies on brand-new resources
  Discovery period: ZopNight learns the baseline
  
GUARD 2: MINIMUM $1/DAY COST THRESHOLD
  Resources costing less than $1/day are excluded from detection
  Avoids alerts on negligible spend
  Focuses attention on meaningful resources
  
GUARD 3: STDDEV > 10% OF MEAN
  If the resource's natural variance is very low (rare)
  Z-scores would explode for tiny changes
  The guard ensures meaningful variance
  Z-score path bypassed for ultra-stable workloads
```

These guards keep the signal strong; reduce false-positive noise.

### Why both methods

```
PERCENT DEVIATION                          Z-SCORE
─────────────────────────────────────────────────────────────────
Cares about magnitude of change            Cares about how unusual
                                            the change is
                                            
Misses anomalies in volatile workloads     Catches them
(volatile workload's 100% deviation         (z=10 even at low %)
 is normal)
                                            
Catches large changes in steady workloads   Misses small changes in
                                            volatile workloads
                                            
Easy to explain                            Statistically defensible
Magnitude-focused                          Variance-aware

DIFFERENT QUESTIONS:
  Percent: "is this a big change?"
  Z-score: "is this an unusual change?"
```

Together, they catch the union of "this is a big change" and "this is a statistically unusual change."

### Higher-severity wins

When both methods produce a severity, the higher one wins:

```
METHOD 1 says: warning (50% deviation)
METHOD 2 says: critical (z=4)
RESULT: critical (Method 2 wins)

METHOD 1 says: critical (200% deviation)
METHOD 2 says: warning (z=2)
RESULT: critical (Method 1 wins)

NEITHER FIRES: no anomaly recorded
BOTH FIRE: higher reported
```

The system reports the worst-case framing to ensure no anomaly is downgraded.

### Worked examples

```
EXAMPLE 1: STEADY WORKLOAD SUDDEN SPIKE
  Resource: dev-database (RDS)
  Historical 14-day average: $30/day
  Stddev: $4
  Yesterday: $120/day
  
  Percent deviation: (120-30)/30 = 300% → critical
  Z-score: (120-30)/4 = 22.5 → emergency
  
  RESULT: emergency (z wins)
  This is a 22-sigma event; extremely unusual

EXAMPLE 2: VOLATILE WORKLOAD SPIKE
  Resource: ml-training (EC2 spot)
  Historical 14-day: high variance, average $80/day, stddev $40
  Yesterday: $200/day
  
  Percent deviation: (200-80)/80 = 150% → critical
  Z-score: (200-80)/40 = 3 → critical
  
  RESULT: critical (both agree)
  Both signals confirm the anomaly

EXAMPLE 3: LOW-COST RESOURCE SPIKE
  Resource: small dev instance
  Average: $0.50/day
  Yesterday: $5.00/day (1000% jump)
  
  Stddev: $0.10
  Z-score: (5-0.5)/0.1 = 45 (extreme)
  Percent: 1000% (extreme)
  
  BUT: under $1/day threshold guard
  RESULT: no alert
  Excluded by minimum cost threshold

EXAMPLE 4: NEW RESOURCE
  Resource: just-provisioned EC2
  History: 2 days
  Yesterday: $50/day
  Previously: $0/day
  
  RESULT: no alert (minimum 4 data points)
  Will start detecting after 4 days
```

The examples illustrate the interaction of the two methods + the guards.

---

## 2. Demo

Two example detections walked through:

```
EXAMPLE 1: Steady workload sudden spike
  Resource: dev-database (RDS)
  Historical 14-day average: $30/day
  Stddev: $4 (steady)
  Yesterday: $120/day
  
  DETECTION:
    Percent deviation: 300% (critical band)
    Z-score: 22.5 (emergency band)
    
    Higher severity wins: emergency
    
  REPORTED:
    "Severity: emergency
     Resource: dev-database
     Spent $120 yesterday; usual $30
     Statistically: 22 standard deviations from mean
     Action: investigate immediately"

EXAMPLE 2: Volatile workload spike
  Resource: ml-training (EC2 spot fleet)
  Historical 14-day: high variance
  Average: $80/day; stddev: $40
  Yesterday: $200/day
  
  DETECTION:
    Percent deviation: 150% (critical band)
    Z-score: 3 (critical band)
    
    Both agree: critical
    
  REPORTED:
    "Severity: critical
     Resource: ml-training
     Spent $200 yesterday; usual $80 (high variance)
     Action: review within hours"
```

The two methods reinforce in clear cases and produce a single answer.

---

## 3. Hands-on (5 min)

Inspect anomaly detection method:

```
□ STEP 1: Open Reports → Anomalies
  Active anomalies: _____

□ STEP 2: For one anomaly, identify
  Resource: __________
  Reported severity: __________
  Detection method: __________

□ STEP 3: Verify the math
  Percent deviation: ___%
  Z-score: ___
  Higher severity tier: __________

□ STEP 4: Check guards
  Cost > $1/day? □ Yes □ No
  Data points >= 4? □ Yes □ No
  Stddev > 10% of mean? □ Yes □ No

□ STEP 5: Decide if escalation warranted
  Severity warrants: __________
  Investigate: □ Now □ Soon □ Later
```

A 10-minute exercise builds intuition for the two methods.

---

## 4. Knowledge check

### Q1
A workload with stddev $5/day spikes from $30 to $40. Percent deviation says warning (33%). Z-score says z=2 (warning). Severity:

A. info
B. warning (both agree). Both methods produce warning severity. Higher-severity wins = warning. Reported as warning.
C. critical
D. emergency

<details>
<summary>Show answer</summary>

**Correct: B.** Both warning; reported as warning.
</details>

### Q2
A new resource has been running for 2 days. Costs $5/day. Yesterday cost $20. The system:

A. Fires critical alert
B. Doesn't fire — only 2 data points. The 4-point minimum guard prevents anomalies on new resources. Discovery period: ZopNight learns the baseline; detection starts after 4 days.
C. Random
D. Fires warning

<details>
<summary>Show answer</summary>

**Correct: B.** Minimum 4 data points guard.
</details>

### Q3
A 200% percent deviation, z=6.5, on a resource over $1/day. The severity:

A. critical (percent says critical at 200%)
B. emergency (z=6.5 puts it at the highest severity tier). Higher-severity wins. The z-score elevates to emergency; reported as emergency.
C. warning
D. info

<details>
<summary>Show answer</summary>

**Correct: B.** z wins; emergency.
</details>

---

## 5. Apply

Detection methods are in the anomaly system. Both run; higher severity reported.

For your team: understand which method fired for any given anomaly; predict why severity differs across anomalies.

---

## Related lessons

- [L1 — Five dimensions](L1_five_dimensions.md)
- [L3 — Severity bands](L3_severity_bands.md) *(next)*
- [L4 — Root cause](L4_root_cause.md)
- [L5 — Redistribution suppression](L5_redistribution_suppression.md)

## Glossary terms touched

[Percent deviation method](../../../reference/glossary/percent-deviation-method.md) · [Z-score method](../../../reference/glossary/z-score-method.md) · [False positive guards](../../../reference/glossary/false-positive-guards.md) · [Higher-severity-wins](../../../reference/glossary/higher-severity-wins.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.10.L2
