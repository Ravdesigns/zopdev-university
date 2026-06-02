# Carbon-aware computing

§ T4 · M4.8 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** workloads that are carbon-aware-schedulable, **apply** three carbon-aware patterns (time-shift, geographic shift, throttle/batch), **and evaluate** the cost-vs-carbon trade-off honestly.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Reduce carbon by aligning compute timing with clean energy availability — without disrupting customer experience." |
| **Personas** | FinOps Lead · Platform Engineer · Sustainability/ESG team |
| **Prerequisites** | M4.8.L1 — Cloud carbon basics |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember), Apply (Apply), Evaluate (Evaluate) |

---

## 1. Concept

Carbon-aware computing is the practice of **scheduling compute to align with low-carbon energy availability**. The grid's carbon intensity varies throughout the day (solar peaks at midday; wind varies by region; fossil-fuel "peaker plants" fire during peak demand). Running flexible workloads during clean-grid hours produces lower carbon for the same compute work.

```
EXAMPLES:
  Run ML training overnight when grid is wind/solar-heavy
  Defer batch jobs to renewable-energy windows
  Geographic load balancing toward cleaner grids during dirty hours
```

This is **carbon-aware** scheduling — distinct from time-of-day cost optimization (although the two often align).

### How grid carbon varies daily

```
TYPICAL daily pattern (most grids):
  Morning (6-9 AM): high carbon (peaker plants firing for ramp-up)
  Mid-day (11 AM - 2 PM): lower carbon (solar peak)
  Afternoon (3-6 PM): rising carbon (peakers + solar declining)
  Evening (7-10 PM): high carbon (peakers + no solar)
  Night (11 PM - 5 AM): variable (wind in some regions; cleaner)
```

Some regions have constant grid mix (always-on coal or hydro); others have dramatic intraday variation. The variation creates the optimization opportunity.

### Where carbon-aware fits

```
WORKLOAD                              CARBON-AWARE?
──────────────────────────────────────────────────────────────────
Real-time customer-facing               No (latency-critical)
Synchronous API (response < 1 sec)     No
Batch ML training                       Yes — defer to clean windows
Data pipeline (overnight ETL)           Yes — already async
Report generation                        Yes — flexible timing
Backup operations                       Yes — async by nature
CI/CD workloads                         Yes — async, restartable
Webhook fan-out                          Sometimes — queue tolerance
Background processing                    Yes — definitionally async
```

Workloads with timing flexibility are candidates. Workloads with strict latency requirements are not.

### Practical patterns

```
PATTERN A — Daily batch time-shift
  Move daily ML training from 2 AM to 11 AM (solar peak)
  Same compute hours; different timing
  Lower carbon footprint
  
  Example: 50 GPU instances × 4 hours
  At 2 AM (350 gCO2/kWh): 100 kg CO2
  At 11 AM (250 gCO2/kWh during solar peak): 71 kg CO2
  Savings: 29% (29 kg per batch run; thousands of kg annually)

PATTERN B — Geographic shift for batch
  Route batch jobs to lower-carbon regions
  Example: from us-east-1 (350) to eu-north-1 (50)
  Even with data transfer overhead, total carbon drops significantly
  
PATTERN C — Pause-resume during dirty hours
  Critical batch resumes when grid cleans up
  Useful for very large training jobs (multi-day runs)
  Implementation: checkpoint/restart logic + grid-aware orchestrator
```

### Tooling for carbon-aware scheduling

```
TOOL                              PROVIDER
──────────────────────────────────────────────────────────────────
Azure Sustainability Calculator    Microsoft
Google Cloud Carbon Footprint     Google
AWS Customer Carbon Footprint      AWS
Carbon Aware SDK (open-source)     .NET Foundation
electricitymaps.com                Public API for grid intensity
WattTime                           Real-time carbon signal API
                                  (research org; commercial API)
```

For implementation: the Carbon Aware SDK provides a runtime signal "is the grid clean right now?" that orchestrators can use to decide whether to run workloads.

ZopNight's roadmap includes carbon-aware scheduling integration.

### Cost vs carbon trade-off

```
TYPICALLY: cost and carbon are LOOSELY positively correlated
  
  Off-peak times: often cheaper AND cleaner
    - Spot prices drop overnight
    - Renewables generate at off-peak hours (solar, wind)
    - Both factors align in some regions
  
  But not always:
    - Some regions have constant grid mix
    - Some workloads' cost is dominated by storage or egress, not compute time
    - Latency constraints constrain timing flexibility
```

The correlation is real but not perfect. Treat carbon and cost as separate metrics that often align rather than identical.

### When cost and carbon diverge

```
SCENARIO 1 — Different optimal regions
  Cheapest region for compute: us-east-1 (mature market)
  Cleanest region for carbon:  eu-north-1 (hydro)
  These are different choices. Pick based on which constraint
  matters more.

SCENARIO 2 — On-demand vs Spot
  Spot is cheaper but evicts; if eviction causes restart,
  the restart consumes more total energy
  Spot is still usually cleaner per useful compute work
  Edge cases exist for very interrupt-heavy workloads
  
SCENARIO 3 — Right-sizing
  Cost optimization: scale down to minimum instance
  Carbon optimization: same scale-down often applies
  But: some smaller instances are less efficient per watt
  (rarely matters; most efficient is also smallest)
```

Be aware that cost and carbon can diverge. Run the math separately when stakes are high.

### Reporting carbon-aware impact

```
PER-WORKLOAD CARBON REPORTING:
  Annual carbon impact
  Per-team attribution (same as cost allocation)
  Trends over time
  Effects of carbon-aware decisions

DECISION DRIVERS:
  Sustainability goals (corporate, division-level)
  ESG reporting requirements
  Customer / investor sustainability pressure
  Regulatory (some jurisdictions require carbon reporting)
```

### Common carbon-aware mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Applying carbon-aware to                   Real-time means latency-
real-time workloads                       sensitive; can't reschedule
                                          
Ignoring data-transfer carbon when         Geographic shifts that move
moving regions                            data create transfer carbon;
                                          measure end-to-end
                                          
Optimizing the small workloads first      Carbon (like cost) Pareto-
                                          distributed; optimize the
                                          biggest workloads first
                                          
Over-engineering the orchestration         Start with simple time-shifts
                                          (cron jobs); advanced
                                          orchestration is rarely
                                          worth the complexity
                                          
Conflating carbon-aware with               Carbon-aware is timing;
energy-efficient                          efficiency is architecture
                                          (Graviton, right-sizing).
                                          Both reduce carbon but
                                          differently
```

### How ZopNight supports carbon-aware

For now (manual):
- Region carbon intensity reference data
- Workload-level cost reports that can be cross-referenced with carbon

Roadmap:
- Carbon attribution per workload (like cost attribution)
- Carbon-aware scheduling recommendations
- Carbon budget tracking
- ESG reporting exports

---

## 2. Demo

A team applying carbon-aware scheduling to ML training:

```
WORKLOAD: nightly ML training pipeline
  Currently scheduled: cron at 2 AM UTC
  Compute: 50 GPU instances for 4 hours = 200 GPU-hours
  
CURRENT carbon footprint (us-east-1, 350 g/kWh average):
  GPU power: ~250W per GPU × 50 GPUs = 12.5 kW
  4 hours × 12.5 kW = 50 kWh
  At 2 AM: 350 g/kWh × 50 kWh = 17.5 kg CO2 per run
  Daily: 17.5 kg
  Annual: ~6.4 tons CO2/year

OPTIMIZATION: shift to 11 AM (solar peak in us-east-1)
  Carbon intensity: ~250 g/kWh (solar adds clean generation)
  Same 50 kWh × 250 g/kWh = 12.5 kg CO2 per run
  Daily: 12.5 kg (saved 5 kg/day)
  Annual: 4.6 tons CO2/year
  
  Reduction: 28% (~1.8 tons CO2/year saved)

DECISION: shift the cron job timing
EFFORT: trivial (one cron expression change)
COST IMPACT: neutral (same compute hours)
CARBON IMPACT: 28% reduction; meaningful for ESG

ADDITIONAL OPTIONS to layer:
  Move to eu-north-1: another ~80% reduction on the new baseline
  Switch to Graviton equivalents (GPUs limited; some inference 
    workloads can use Trainium or similar): ~30% efficiency gain
```

A simple cron change is the first lever. Region migration is the bigger lever for workloads where it's feasible.

---

## 3. Hands-on (5 min)

Identify a carbon-aware optimization opportunity:

```
WORKLOAD candidate:    __________
  Type:    batch / async / scheduled (carbon-aware eligible)
  Currently runs:    __________  (timing or trigger)

CARBON CALCULATION:
  Current compute: __________ kWh/period
  Current region: __________ at __________ gCO2/kWh
  Current carbon: __________ kg CO2/period

OPTIMIZATION OPTIONS:
  □ Time-shift to clean-grid hours
    Estimated reduction: __________ %
  □ Geographic shift to cleaner region
    Estimated reduction: __________ %
  □ Pause-resume during dirty hours (advanced)
    Estimated reduction: __________ %

CHOSEN approach:    __________
EFFORT:    __________ days
ANNUAL CARBON SAVINGS:    __________ tons

If trivial (cron change): do it now.
If meaningful (region migration): include in next quarter plan.
```

---

## 4. Knowledge check

### Q1
A real-time customer-facing service should be carbon-aware-scheduled:

A. Yes — every workload benefits
B. No — latency requirements eliminate timing flexibility. Carbon-aware suits batch / async workloads. The real-time workload's latency would be compromised by deferral to clean-grid hours.
C. Random
D. Only for ML

<details>
<summary>Show answer</summary>

**Correct: B.** Latency matters for customer-facing. Carbon-aware fits async/batch.
</details>

### Q2
Cost vs carbon correlation:

A. Perfectly inversely correlated
B. Loosely positively correlated. Off-peak times are often both cheaper AND cleaner. But not perfectly — some regions have constant grid mix; some workloads have cost dominated by storage or egress. Run the math separately when stakes are high.
C. Random
D. No relation

<details>
<summary>Show answer</summary>

**Correct: B.** Loose positive correlation; not identical.
</details>

### Q3
Shifting ML training from 2 AM to 11 AM:

A. Same carbon (compute hours identical)
B. Lower carbon — solar peaks at midday in most regions, lowering grid carbon intensity. Compute time is identical; grid mix differs. The cron-job timing change is trivial; the carbon impact is meaningful.
C. Higher carbon (more expensive electricity)
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Solar-aligned timing. The grid is cleaner during solar peak.
</details>

---

## 5. Apply

For batch / async workloads, identify carbon-aware opportunities. Time-shifts via cron expressions are trivial. Region migration is bigger lever; plan in quarterly cycles.

Track carbon impact in your sustainability reports alongside cost impact in your FinOps reports.

---

## Related lessons

- [L1 — Cloud carbon basics](L1_carbon_basics.md)
- [L3 — Region selection for carbon](L3_region_carbon.md) *(next)*
- [L4 — Scheduling for carbon, not just cost](L4_scheduling_carbon.md)
- [L5 — Reporting carbon to leadership](L5_reporting.md)

## Glossary terms touched

[Carbon-aware computing](../../../reference/glossary/carbon-aware-computing.md) · [Time-shift](../../../reference/glossary/time-shift.md) · [Geographic shift](../../../reference/glossary/geographic-shift.md) · [Carbon Aware SDK](../../../reference/glossary/carbon-aware-sdk.md) · [Grid intensity API](../../../reference/glossary/grid-intensity-api.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.8.L2
