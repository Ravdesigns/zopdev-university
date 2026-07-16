# Cloud carbon basics

§ T4 · M4.8 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **calculate** a cloud workload's carbon footprint, **identify** the four levers that drive it, **and reason** about which workloads are good candidates for carbon optimization.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Quantify our cloud carbon footprint and identify the highest-leverage levers to reduce it." |
| **Personas** | FinOps Lead · Engineering Leader · Sustainability / ESG team |
| **Prerequisites** | T0 — Foundations · M4.1 — Maturity |
| **Time** | 9 minutes |
| **Bloom verb** | Calculate (Apply), Identify (Remember), Reason (Analyze) |

---

## 1. Concept

Cloud workloads consume electricity. The electricity has a **carbon intensity** that varies by region (the grid mix — coal, gas, hydro, solar, wind, nuclear). The same workload in different regions produces dramatically different carbon footprints.

```
CARBON FOOTPRINT = compute_kWh × carbon_intensity (gCO2/kWh)

WHERE:
  compute_kWh = instance hours × power per instance type
                ≈ rough proxy: cost in $ × industry-typical $/kWh
                
  carbon_intensity = depends on region's grid mix
                     range: 30 gCO2/kWh (Norway hydro) to
                     700+ gCO2/kWh (coal-heavy regions)
```

### Region carbon intensity varies dramatically

```
REGION                       INTENSITY (gCO2/kWh)    RELATIVE
──────────────────────────────────────────────────────────────────
eu-north-1 (Sweden/hydro)     ~50                     0.5× baseline
ca-central-1 (Quebec hydro)   ~50                     0.5×
northwest-1 (Norway hydro)    ~30                     0.3×
                              
us-west-2 (Oregon)            ~120                    1.2× (some hydro)
us-west-1 (California)        ~250                    2.5× (solar-heavy
                                                      but also gas)
                              
us-east-1 (N. Virginia)       ~350                    3.5× (gas + coal)
us-east-2 (Ohio)              ~400                    4× (coal-heavy)
                              
ap-southeast-2 (Sydney)       ~700                    7× (coal-heavy)
ap-southeast-1 (Singapore)    ~500-600                5× (coal/gas)
```

A workload in Sweden generates ~14× less carbon per kWh than the same workload in Sydney. The compute is identical; the grid is the difference.

### What this means for cloud workloads

```
SAME workload running in different regions:

  us-east-1 (Virginia, 350 gCO2/kWh):
    100 m5.large × 730 hr/mo × 0.1 kW × 350g/kWh = 2,555 kg CO2/mo
    
  eu-north-1 (Sweden, 50 gCO2/kWh):
    100 m5.large × 730 hr/mo × 0.1 kW × 50g/kWh = 365 kg CO2/mo
    
  CARBON DIFFERENCE: 2,190 kg CO2/mo (86% reduction)
  COST DIFFERENCE:    minor (regional price variance, usually ±5%)
  
A team can move workloads to cleaner regions and reduce carbon
dramatically with minimal cost impact.
```

### The four levers

Four distinct ways to reduce a workload's carbon footprint:

```
1. REGION SELECTION
   Move workloads to cleaner-grid regions
   Highest single lever (often 50-90% reduction)
   
2. COMPUTE-HOUR REDUCTION
   Schedule off when not needed (scale to zero, schedule on/off)
   Direct proportional reduction (same as cost saving)
   
3. PER-INSTANCE EFFICIENCY
   Use more efficient instance families (Graviton/ARM vs x86)
   Typically 20-40% more compute per watt
   Composable with the other levers
   
4. WORKLOAD-TIME ALIGNMENT
   Carbon-aware scheduling: run during clean grid hours
   Smaller but real impact (10-30%) for batch workloads
```

Each lever is independent. Stacking all four can produce 80-95% carbon reduction on flexible workloads.

### Where carbon and cost align (and don't)

```
CARBON LEVER                       COST IMPACT
──────────────────────────────────────────────────────────────────
Schedule off when not needed        Same-direction savings
                                   (compute-hour reduction)
                                   
Graviton vs x86 instances           Cheaper AND more efficient
                                   (~20% cost savings + carbon)
                                   
Region migration (clean grid)        Minor cost variance; might be
                                   slightly cheaper or pricier
                                   
Time-shift to clean-grid hours       Usually neutral cost
                                   (off-peak hours coincide with
                                   solar/wind peak in some regions)
                                   
Spot for batch                       Cheaper AND lower carbon
                                   (efficient utilization)
```

The good news: most carbon levers also save cost. The exception: region migration, which is roughly carbon-positive and cost-neutral. The lever you pick depends on whether cost or carbon is the binding constraint.

### Calculation example

```
WORKLOAD: 100 m5.large instances 24/7 in us-east-1

POWER DRAW (rough):
  m5.large ~50W (estimate; AWS does not publish per-instance wattage)
  100 instances × 50W = 5 kW continuous
  5 kW × 730 hr/mo = 3,650 kWh/mo

CARBON (us-east-1):
  3,650 kWh × 350 gCO2/kWh = 1,277.5 kg CO2/mo
  Annual: 15.3 tons CO2

WHAT IF MIGRATED TO eu-north-1:
  3,650 kWh × 50 gCO2/kWh = 182.5 kg CO2/mo
  Annual: 2.2 tons CO2
  
  SAVINGS: 13.1 tons CO2/year (86%)
  COST IMPACT: minor (region price variance)
```

86% carbon reduction. The cost impact is small enough that the decision is dominated by carbon considerations.

### Hidden carbon factors

```
NOT JUST DIRECT COMPUTE:
  Cooling overhead (PUE — power usage effectiveness)
  Network equipment
  Storage (constant power for spinning disks; lower for SSD)
  Embodied carbon (manufacturing of hardware — long-term factor)
  
PUBLISHED CARBON DATA varies in what it includes:
  Some report compute only
  Some include PUE
  Some include lifecycle (embodied)
  
KNOW YOUR SOURCE.
```

### How ZopNight surfaces carbon (roadmap)

```
CURRENT (manual):
  Region + instance type calculations using public grid data
  Workload-level carbon reports compiled by hand
  
ROADMAP (planned features):
  Per-resource carbon attribution
  Per-team carbon allocation (like cost allocation)
  Carbon-aware schedule recommendations
  Carbon budget tracking
  ESG reporting exports
```

For now, customers calculate carbon manually using region grid intensity + workload size. The cost calculations are direct; the carbon is a multiplier.

---

## 2. Demo

A team calculating its annual carbon footprint:

```
TEAM Y workload assessment:

CURRENT STATE:
  Region: us-east-1
  Instances: 100 m5.large × 730 hours/month
  Power: 5 kW continuous
  Annual kWh: 43,800
  Annual carbon (us-east-1 350 gCO2/kWh): 15,330 kg = 15.3 tons CO2

OPTIMIZATION OPTIONS:

  Option A — Schedule (non-prod):
    60% of hours off
    Annual kWh: 17,520
    Annual carbon: 6,130 kg = 6.1 tons CO2
    REDUCTION: 60% (9.2 tons saved)

  Option B — Move to eu-north-1 (Sweden):
    Same compute; cleaner grid (50 gCO2/kWh)
    Annual kWh: 43,800
    Annual carbon: 2,190 kg = 2.2 tons CO2
    REDUCTION: 86% (13.1 tons saved)

  Option C — Combined (both):
    Sweden + 60% schedule
    Annual kWh: 17,520
    Annual carbon: 876 kg = 0.9 tons CO2
    REDUCTION: 94% (14.4 tons saved)

DECISION (per workload):
  Production workload (no schedule): Option B alone
  Non-prod workload: Option C combined

ANNUAL IMPACT for the team's full workload mix:
  Estimated: 12-15 tons CO2 reduction
  ESG report: meaningful improvement
```

The right combination of levers depends on workload class.

---

## 3. Hands-on (5 min)

Calculate one of your workload's monthly carbon footprint:

```
WORKLOAD:    __________
REGION:      __________  (look up intensity at electricitymaps.com)
GRID INTENSITY:    __________ gCO2/kWh

POWER DRAW estimate:
  Number of instances: __________
  Instance type:        __________  (look up power draw in cloud docs)
  Total power draw:    __________ kW

MONTHLY HOURS:
  Average compute hours:    __________ (730 if 24/7)
  
MONTHLY kWh:
  __________ kW × __________ hours = __________ kWh

MONTHLY CARBON:
  __________ kWh × __________ gCO2/kWh = __________ g CO2
                                       = __________ kg CO2
                                       = __________ tons CO2

ANNUAL CARBON:    __________ tons CO2

LEVERS available:
  □ Region migration to cleaner grid
  □ Scheduling (if non-prod)
  □ Graviton migration (if eligible)
  □ Time-shift (if batch)

ESTIMATED reduction potential:    __________ %
```

Calculating once builds intuition. Track quarterly for trend.

---

## 4. Knowledge check

### Q1
The same workload in eu-north-1 (Sweden) vs us-east-1 (Virginia):

A. Same carbon footprint
B. Sweden is ~7× cleaner due to hydroelectric grid. Same compute, dramatically lower carbon. The cost difference is minor; the carbon difference is dramatic. Region selection is the single highest-leverage carbon decision.
C. eu-north-1 is dirtier
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Grid mix is the difference. Sweden's hydro grid is among the cleanest globally.
</details>

### Q2
A workload can be scheduled off-hours. Carbon impact:

A. Zero — carbon is fixed
B. Reduces proportionally. Fewer compute-hours means less electricity, which means less carbon. Scheduling is a carbon lever as well as a cost lever. The 60% schedule reduces both cost and carbon by ~60%.
C. Random
D. Negative

<details>
<summary>Show answer</summary>

**Correct: B.** Scheduling reduces carbon too. The savings layers stack.
</details>

### Q3
Graviton (ARM) vs traditional x86 instances:

A. Same carbon
B. Graviton is more compute-efficient — typically 20-40% less carbon per unit of work because ARM architecture uses less power per operation. The cost savings often go together with the carbon savings.
C. Higher carbon
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** ARM is more efficient. Worth migrating eligible workloads.
</details>

---

## 5. Apply

Calculate your team's annual carbon footprint using region intensity + workload size. Track quarterly. Use the result for ESG reporting and as an input to optimization prioritization.

ZopNight's carbon-aware reporting is on the roadmap; until then, manual calculations using public grid data work.

---

## Related lessons

- [L2 — Carbon-aware computing](L2_carbon_aware.md) *(next)*
- [L3 — Region selection for carbon](L3_region_carbon.md)
- [L4 — Scheduling for carbon, not just cost](L4_scheduling_carbon.md)
- [L5 — Reporting carbon to leadership](L5_reporting.md)
- [T4.M4.1 — Maturity ladder](../M4.1_maturity_ladder/00_README.md)

## Glossary terms touched

[Carbon intensity](../../../reference/glossary/carbon-intensity.md) · [Grid mix](../../../reference/glossary/grid-mix.md) · [PUE](../../../reference/glossary/pue.md) · [Graviton](../../../reference/glossary/graviton.md) · [Carbon-aware scheduling](../../../reference/glossary/carbon-aware-scheduling.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.8.L1
