# Region selection for carbon

§ T4 · M4.8 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** cloud regions with cleaner grids for carbon-flexible workloads, **evaluate** the trade-offs (latency, cost, compliance), **and execute** a region-migration plan when the carbon math justifies it.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Move flexible workloads to clean-grid regions for meaningful carbon reduction without disrupting customer experience." |
| **Personas** | FinOps Lead · Platform Engineer · Sustainability/ESG team |
| **Prerequisites** | M4.8.L1 (carbon basics) · M4.8.L2 (carbon-aware computing) |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Evaluate (Analyze), Execute (Apply) |

---

## 1. Concept

Different cloud regions have wildly different grid carbon intensity. Choosing a cleaner region for a workload can dramatically reduce its carbon footprint — typically 70-90% reduction for the same compute work, with minor cost variance.

```
SAMPLE REGION INTENSITIES (gCO2/kWh, approximate):

VERY CLEAN (mostly renewable):
  eu-north-1 (Sweden — hydro):              ~50
  ca-central-1 (Quebec — hydro):             ~50
  norway-east (Norway — hydro):              ~30
  
MEDIUM:
  us-west-2 (Oregon — mixed hydro/renew):   ~120
  us-west-1 (California — solar-heavy):      ~250
  eu-west-1 (Ireland — wind):                ~180
  
HIGH CARBON:
  us-east-1 (Virginia — gas + some coal):    ~350
  us-east-2 (Ohio — coal-heavy):              ~400
  ap-southeast-2 (Sydney — coal-heavy):       ~700
  
EXTREMELY HIGH:
  ap-southeast-1 (Singapore — coal/gas):     ~500-600
  ap-east-1 (Hong Kong):                      ~550
```

### Region factors driving carbon intensity

```
LOW-CARBON CHARACTERISTICS:
  Hydroelectric grids                    Norway, Sweden, Quebec
                                        baseline ~30-50 gCO2/kWh
                                        
  Solar-heavy + low coal                 California, parts of Asia
                                        baseline ~150-250 gCO2/kWh
                                        
  Wind-heavy                            Texas, Northern Europe
                                        baseline ~100-200 gCO2/kWh
                                        
  Nuclear-heavy                         France, parts of E. Europe
                                        baseline ~50-100 gCO2/kWh

HIGH-CARBON CHARACTERISTICS:
  Coal-heavy grids                       Parts of US, Australia,
                                        Southeast Asia
                                        baseline 400-700 gCO2/kWh
                                        
  Gas-heavy grids                         Some US East regions
                                        baseline 300-450 gCO2/kWh
```

### Trade-offs to consider

Region migration isn't free. Several factors to evaluate:

```
TRADE-OFF                                  IMPACT
──────────────────────────────────────────────────────────────────
LATENCY                                    Distance from users
                                          increases latency
                                          (acceptable for batch;
                                          not for real-time)
                                          
PRICING                                     Cleaner regions sometimes
                                          slightly pricier
                                          (variance: ±5-15%)
                                          
SERVICE AVAILABILITY                       Newer / smaller regions
                                          have fewer services
                                          (Lambda, Bedrock, etc.
                                          may not be everywhere)
                                          
DATA RESIDENCY                             Compliance requirements
                                          may mandate region
                                          (GDPR, HIPAA, etc.)
                                          
DATA TRANSFER                              One-time migration cost
                                          + ongoing inter-region
                                          transfer if hybrid
                                          
COMPLIANCE                                 SOC 2, ISO require
                                          documented data handling
```

### Decision matrix

```
WORKLOAD TYPE                  PRIORITY OF FACTORS
──────────────────────────────────────────────────────────────────
Real-time customer-facing       Latency >> Carbon >> Cost
                                Region near users wins
                                
Batch processing                Cost ≈ Carbon (latency low priority)
                                Clean-grid region usually wins
                                
Backup / archive                Cost ≈ Carbon
                                Cheapest clean region wins
                                
ML training                     Cost > Carbon (some flex)
                                Mixed; depends on org's ESG goals
                                
Development                     Cost > Carbon
                                Closer to engineers usually wins
                                
Internal tools                   Cost > Carbon
                                Closer to office wins for latency
```

The right region depends on workload constraints. Most enterprises have a mix.

### Migration evaluation checklist

```
BEFORE MIGRATING regions for carbon reduction:
  
  □ Latency check: target region's latency still acceptable for
    customer experience?
    
  □ Cost check: comparable cost in target region?
    (allow ±10% acceptable; >15% may not justify)
    
  □ Service availability: all needed services present in target
    region? Check each cloud service in your stack.
    
  □ Data transfer one-time cost: how much to move existing data?
  
  □ Data transfer ongoing cost: will hybrid setup create new
    inter-region transfer charges?
    
  □ Compliance: data residency rules permit target region?
  
  □ Team familiarity: any operational concerns with new region?
  
  IF ALL GREEN: proceed with migration plan
  IF ANY YELLOW: investigate; may need different approach
  IF ANY RED: this workload not a migration candidate
```

### Multi-region for resilience + carbon

A pattern that combines goals:

```
PATTERN: primary + secondary in different regions
  Primary:    closer to users (cost + latency priority)
  Secondary:  cleaner grid (carbon priority)
  
WHEN PRIMARY HEALTHY: traffic stays primary
WHEN PRIMARY DEGRADED: traffic shifts to secondary
                       (now running at lower carbon during
                       a less-than-optimal period)
                       
The secondary serves both DR and a carbon backup function.
```

### Quantifying region carbon

```
TYPICAL ML training workload comparison:

  In us-east-1 (350 gCO2/kWh):
    100 GPU-hours × 1.5 kW × 0.35 kg/kWh = 52.5 kg CO2 per run

  In eu-north-1 (50 gCO2/kWh):
    Same 100 GPU-hours × 1.5 kW × 0.05 kg/kWh = 7.5 kg CO2 per run
    
  REDUCTION: 86% for the same compute

  Annual (if run daily):
    us-east-1: 52.5 kg × 365 = 19.2 tons CO2/year
    eu-north-1: 7.5 kg × 365 = 2.7 tons CO2/year
    Annual savings: 16.4 tons (86%)
```

For meaningful workloads, region migration is typically the single largest carbon lever available.

### Migration execution

```
MIGRATION PLAN typical steps:
  
  WEEK 1-2: Assessment
    Calculate carbon impact of current and target regions
    Verify latency / cost / compliance per checklist
    Estimate migration effort
    
  WEEK 3-4: Pilot
    Migrate one non-critical workload first
    Measure: latency, cost, carbon
    Validate against expectations
    
  WEEK 5-8: Production migration
    Move main workload in waves
    Maintain rollback capability
    
  WEEK 9-10: Verification + decommission
    Confirm target region performance matches
    Decommission source-region resources
    Document the migration in audit log + carbon report
    
EFFORT: 2-4 weeks per workload for clean migrations
ANNUAL CARBON IMPACT: 70-90% reduction typical
```

### Common region-migration mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Don't check latency for the new region    Test from user-representative
                                          locations before committing
                                          
Forget inter-region data transfer costs   Include in TCO; can be
                                          significant for data-heavy
                                          workloads
                                          
Migrate first; check compliance later     Compliance check is the
                                          first gate; some workloads
                                          can't move at all
                                          
Migrate everything to "save the world"     Some workloads have hard
                                          constraints; respect them
                                          
Underestimate operational change           New region means new ops;
                                          team familiarity matters
```

---

## 2. Demo

A team's region migration decision and execution:

```
TEAM:    ML platform team
WORKLOAD: nightly ML training cluster
COST:    $40K/month
COMPUTE: 100 GPU-hours/day average

CURRENT STATE:
  Region: us-east-1
  Annual carbon: 18.4 tons CO2/year (350 gCO2/kWh)

CANDIDATE REGIONS:
  Option A — eu-north-1 (50 gCO2/kWh):
    Annual carbon: 2.6 tons CO2/year (86% reduction)
    Latency to ML pipeline: +50ms (acceptable; async batch)
    Cost: comparable ±2%
    Services available: all needed (verified)
    Compliance: no concerns (training data not subject to residency)
    Data transfer cost: ~$3K one-time migration
    
  Option B — us-west-2 (120 gCO2/kWh):
    Annual carbon: 6.3 tons CO2/year (66% reduction)
    Latency: +30ms
    Cost: comparable
    Services: all available
    Data transfer: ~$1K
    
DECISION ANALYSIS:
  Option A delivers 86% reduction; effort is higher (overseas)
  Option B delivers 66% reduction; effort lower
  Annual carbon saved:
    A: 15.8 tons
    B: 12.1 tons
  
DECISION: Option A (eu-north-1)
  Rationale: largest carbon reduction; cost neutral
  
EXECUTION:
  Week 1-2: detailed migration plan, pilot batch ML run
  Week 3-4: full production migration in 3 waves
  Week 5: decommission us-east-1 resources
  Total effort: 1 engineer × 5 weeks = ~$25K loaded
  
ROI on the migration effort:
  Carbon: 15.8 tons/year saved (significant for ESG report)
  Cost: roughly neutral (small data transfer cost amortized)
  Verdict: clear win for sustainability narrative
  
DOCUMENTED in carbon report; presented to leadership as a
positive ESG signal.
```

---

## 3. Hands-on (5 min)

Identify a workload that could move to a cleaner region:

```
WORKLOAD candidate:    __________
  Class: batch / async / customer-facing / latency-sensitive

CURRENT region:    __________
  Carbon intensity: __________ gCO2/kWh (look up)

CANDIDATE cleaner region:    __________
  Carbon intensity: __________ gCO2/kWh

CARBON REDUCTION estimate:
  Current annual: __________ tons CO2
  Target annual: __________ tons CO2
  Reduction: __________ tons (____ %)

CHECKLIST:
  □ Latency acceptable for this workload?
  □ Cost variance within 10%?
  □ All services available in target?
  □ Compliance / residency permits target?
  □ Team familiar with operating in target region?

EFFORT estimate:    __________ weeks

DECISION:
  □ Migrate (carbon impact justifies)
  □ Defer (constraints unresolved)
  □ Not migratable (compliance / latency)

If migrate: schedule pilot for: __________
```

If you can move even one batch workload to a cleaner region, the carbon impact is often the largest single sustainability win available.

---

## 4. Knowledge check

### Q1
us-east-1 vs eu-north-1 for the same workload:

A. Same carbon
B. eu-north-1 is approximately 7× cleaner due to hydroelectric grid (50 vs 350 gCO2/kWh). Same compute, dramatically lower carbon. Potential cost impact: minor (typically ±5-10%). Region migration is one of the highest-leverage carbon decisions available.
C. us-east-1 is cleaner
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Grid mix dominates. ~7× difference for the same compute.
</details>

### Q2
ML training latency-sensitive vs not:

A. ML is always latency-sensitive
B. Async / batch ML training is NOT latency-sensitive (output is consumed asynchronously; training can take hours-to-days). Real-time inference IS latency-sensitive (output drives user experience). Apply carbon-aware to batch; not to inference.
C. Random
D. Same

<details>
<summary>Show answer</summary>

**Correct: B.** Batch is flexible; inference is latency-bound. Different optimization strategies.
</details>

### Q3
Region migration for carbon:

A. Always trivial — just change a config
B. Requires planning: compliance, latency, cost, service availability all need checking. But for batch workloads with no constraints, the carbon impact (often 70-90% reduction) typically justifies the work. Migrations typically take 2-4 weeks per workload.
C. Always too risky
D. Never works

<details>
<summary>Show answer</summary>

**Correct: B.** Plan carefully; the impact is typically large for batch workloads.
</details>

---

## 5. Apply

Annual region carbon audit. Prioritize batch / async workloads for migration. Track per-workload carbon in your sustainability report.

For reference data on regional grid intensity: [electricitymaps.com](https://electricitymaps.com) (public) or cloud provider carbon footprint tools.

---

## Related lessons

- [L1 — Cloud carbon basics](L1_carbon_basics.md)
- [L2 — Carbon-aware computing](L2_carbon_aware.md)
- [L4 — Scheduling for carbon, not just cost](L4_scheduling_carbon.md) *(next)*
- [L5 — Reporting carbon to leadership](L5_reporting.md)
- [T3.M3.4 — Multi-account topology](../../T3_zopnight_architect/M3.4_multi_account/00_README.md)

## Glossary terms touched

[Region carbon intensity](../../../reference/glossary/region-carbon-intensity.md) · [Data residency](../../../reference/glossary/data-residency.md) · [Inter-region transfer](../../../reference/glossary/inter-region-transfer.md) · [Migration pilot](../../../reference/glossary/migration-pilot.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.8.L3
