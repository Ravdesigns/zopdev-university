# The Metrics drawer

§ T2 · M2.2 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **read** CPU, memory, connections, IOPS, and other metrics from the drawer, **verify** a recommendation's evidence against actual usage, **and identify** the periodic-workload patterns that average-based rules miss.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Verify every rightsizing recommendation against actual metrics before applying — catch the periodic spikes that averages hide." |
| **Personas** | Platform Engineer · SRE · FinOps Lead |
| **Prerequisites** | M2.1.L3 (rule interface) |
| **Time** | 9 minutes |
| **Bloom verb** | Read (Apply), Verify (Evaluate), Identify (Apply) |

---

## 1. Concept

The Metrics drawer is the second-most-clicked surface on a recommendation card (after the savings line). It shows the cloud monitoring data the rule used: CloudWatch (AWS), Cloud Monitoring (GCP), Azure Monitor (Azure). Reading it well = catching the recommendations that look right on paper but would break production.

```
WHO USES THE METRICS DRAWER:
  Anyone evaluating a rightsizing recommendation
  SREs investigating an apply decision
  FinOps auditing a finding before approval
  Engineers cross-checking the rule's logic
```

The drawer is where "rule says X" meets "team knows Y." Reconcile both.

### What the drawer shows

```
METRICS DRAWER — i-0abc123 (rightsizing recommendation)
────────────────────────────────────────────────────────
CPUUtilization (30-day lookback)
  Average:    3.4%
  Maximum:    8.2%
  Minimum:    0.1%
  P95:        7.1%
  P99:        7.9%
  
MemoryUtilization (custom agent, 14-day)
  Average:    24.1%
  Maximum:    41.0%
  P95:         38.5%
  
NetworkIn / NetworkOut (30-day)
  Avg:        12 MB/hr / 8 MB/hr
  Peak:       45 MB/hr / 32 MB/hr
  
DiskReadIOPS (30-day)
  Average:    14 IOPS
  Maximum:    127 IOPS
  
DatabaseConnections (for RDS rules, 14-day)
  Average:    8.3
  Maximum:    23
```

Each metric carries:
- **Lookback window** (30 day typical for compute, 7-14 day for high-frequency, 90 day for some commitment rules)
- **Statistical aggregations** (avg, max, min, P95, P99)
- **Unit** (percent, count, MB/hr, IOPS)
- **Source** (CloudWatch namespace, custom agent, etc.)

The aggregations matter: average alone misses periodic spikes; max alone overweights one-time anomalies; P95/P99 capture the typical-high.

### How metrics get there — the pipeline

```
1. CLOUD MONITORING captures metrics natively
   AWS CloudWatch: CPU, network, disk-IO (free; always available)
   GCP Cloud Monitoring: similar
   Azure Monitor: similar
   
2. DISCOVERER's metrics-sync cron runs daily at 03:00 UTC
   Fetches metrics for running resources
   Batched calls per region
   Stores in ZopNight's metrics database
   
3. RECOMMENDER reads pre-fetched metrics
   MetricsAware rules consume the data
   No live cloud-API calls during evaluation
   
4. UI fetches the metrics from ZopNight DB
   Displays in Metrics drawer
```

The pipeline is pull-based with ~24h freshness lag. Cost optimization tolerates this; real-time monitoring is a different product.

### Cardinality — agent vs no-agent

```
CLOUD-PROVIDED METRICS (no agent needed):
  AWS: CPU, network, disk-IO
  GCP: CPU, network, disk-IO
  Azure: CPU, network, disk-IO
  All FREE; always available

AGENT-REQUIRED METRICS:
  Memory utilization (AWS CloudWatch agent / GCP Ops Agent / Azure
                       Monitor agent)
  Per-process resource use
  Application-specific metrics (request rate, latency, etc.)
  Custom application metrics
  
WITHOUT AGENT:
  Memory data is absent
  Memory-aware rules fall back to CPU-only logic
  Rules degrade gracefully (still recommend, less context)
  
RECOMMENDATION:
  Install cloud-native monitoring agent
  Enables memory-aware rightsizing (RC-004 with memory guard)
  Improves recommendation accuracy
  Cost: usually <$5/instance/month for the agent
```

The agent is the unlock for memory-aware rules. Most teams should install it.

### Reading metrics for a rightsizing rule

The rule's threshold determines whether it fires. The drawer shows the actual numbers so the team can verify:

```
RC-004 (EC2 rightsizing) thresholds:
  CPUUtilization 30-day avg < 5% (downsize candidate)
  CPUUtilization 30-day max < 30% (safety check)
  Memory guard: < 60% (don't downsize memory-heavy)

EXAMPLE evaluation for resource i-0abc123:
  CPUUtilization 30-day avg = 3.4%   < threshold 5%   ✓
  CPUUtilization 30-day max = 8.2%   < threshold 30%  ✓
  Memory utilization avg    = 24.1%  < threshold 60%  ✓
  All conditions met → recommendation fires
  
  Target: m5.large → m5.medium (one step smaller)
  Savings: ~$40/mo
```

The team can verify each condition independently. If any number looks wrong, dig deeper.

### Periodic-workload patterns — the trap

```
THE AVERAGE-MISSES-SPIKE TRAP:

WORKLOAD: monthly batch job (runs on the 28th of each month)
  Days 1-27: CPU < 5% (idle)
  Day 28:    CPU 87% (batch job running)
  Days 29-30: CPU < 5% (back to idle)
  
DRAWER SHOWS:
  CPU avg (30-day):  4.1% (looks idle on average)
  CPU max (30-day):  87% (one big spike)
  CPU P95 (30-day):  12% (looks low)

NAIVE READ: "Looks under-utilized. Downsize."
ACTUAL: workload needs the big instance for the monthly batch
        Downsizing breaks the batch (latency 10x; budget overrun)
        
ALWAYS CHECK THE MAX + READ THE PATTERN:
  Sustained low? = right-sizing OK
  Mostly low + periodic high? = needs investigation
  
COMMON PATTERNS that average misses:
  - Monthly batch jobs (28th of month, EOM reconciliation)
  - Weekly reports (Monday morning crunch)
  - Quarterly compliance runs
  - End-of-quarter calculations
  - Annual loads (year-end close, fiscal year-end)
```

The team's domain knowledge fills the gap. Always cross-check before applying.

### Other metrics in the drawer

```
DATABASE RULES:
  DatabaseConnections (RDS): zero connections for N days = idle
  ReadIOPS / WriteIOPS: very low for prolonged periods = idle
  StorageUsed: tracks growth pattern
  
LAMBDA RULES:
  Invocation count: zero or very low = idle
  Duration p95: longer than expected = right-size up
  ConcurrentExecutions: peak vs reserved
  
K8s RULES:
  HPA ScalingLimited events
  Pod CPU vs requests/limits
  Pod restart count
  Pending pod duration

STORAGE RULES:
  IOPS (for IOPS-tier storage rules)
  Read/write throughput
  Storage utilization

EACH RULE SHOWS the relevant metrics in its drawer
```

The drawer's content adapts to the rule type. What you see is what the rule used.

### Reading metrics — best practices

```
ALWAYS check:
  Average (long-term trend)
  Maximum (the spike)
  P95 / P99 (the typical-high)
  Lookback window (matches workload pattern?)
  
NEVER trust just average:
  Periodic workloads invisible in averages
  
NEVER trust just maximum:
  One-time anomalies overweight
  
P95 IS THE SWEET SPOT:
  Captures realistic high usage
  Robust to single outliers
  Use for right-sizing decisions

CROSS-REFERENCE with team knowledge:
  Do these numbers match what you expect?
  Any periodic patterns the metrics miss?
  Any recent changes that haven't shown yet?
```

The drawer is data; the decision is informed by data + context.

### When the drawer is wrong (rare)

```
RARE CASES:
  Metrics-sync cron stuck (drawer shows stale data >48h)
    Action: check ZopNight admin → metrics-sync status
  
  Resource missing CloudWatch agent (memory data absent)
    Action: install agent; metrics return next day
  
  CloudWatch namespace permissions wrong (no data)
    Action: check IAM; metrics return next sync after fix
  
  Resource recently created (insufficient history)
    Action: wait until 30-day window fills

WHEN IN DOUBT:
  Cross-check directly in CloudWatch console
  Numbers should match (within sync lag)
```

99% of the time the drawer is accurate; the rare cases are diagnostic.

---

## 2. Demo

A team auditing a rightsizing recommendation:

```
SCENARIO: RC-004 EC2 Rightsize on prod-batch-1
  Current: m5.4xlarge ($530/mo)
  Proposed: m5.2xlarge (50% savings = $265/mo)

METRICS DRAWER (clicked open):
  CPU 30-day avg:    4.1%
  CPU 30-day max:    87% (on day 28 of the month)
  CPU P95:           12%
  CPU P99:           42%
  
  Memory 30-day avg: 35%
  Memory 30-day max: 78%
  Memory P95:        54%

TEAM ANALYSIS:
  CPU averaged 4.1% — looks idle on average
  But: 87% spike on day 28, P99 = 42%
  
  Drilling down (Metrics tab on resource detail):
  Day 28 spike correlates with month-end batch job
  
  Slack #data-team: "is prod-batch-1 used for month-end?"
  Reply: "Yes, this is our billing reconciliation job
           Runs 18-22 hours on day 28; uses all the CPU + memory
           Cannot fit in m5.2xlarge (would 10x the runtime)"

DECISION:
  Dismiss the recommendation
  Reason: "Monthly batch job requires m5.4xlarge during EOM reconciliation
           Documented in DEV-2391"
  Set severity for this specific resource to "info"
  Won't re-fire as actionable
  
LESSON:
  The metrics revealed the monthly pattern
  Applying would have broken the batch
  Reading evidence prevented an incident
```

The 5-minute investigation prevented an outage. This is why the drawer matters.

---

## 3. Hands-on (5 min)

Audit a recommendation via the Metrics drawer:

```
□ STEP 1: Open Recommendations
  Pick a rightsizing recommendation (RC-004 or similar)
  Open detail view
  Click Metrics drawer

□ STEP 2: Read the metrics
  CPU average: _____%
  CPU maximum: _____%
  CPU P95: _____%
  Memory average: _____%
  
□ STEP 3: Identify spikes
  Any one-time spike >50% above average?
  □ Yes — investigate the date
  □ No — likely safe
  
□ STEP 4: Cross-check
  Ask the team: any periodic workload pattern?
  Owner: __________
  Confirmed: □ Yes  □ No  □ Unsure

□ STEP 5: Decide
  □ Apply (no concerns)
  □ Dismiss (periodic spike + workload pattern)
  □ Snooze (uncertain; investigate further)
```

A 10-minute audit per rightsizing recommendation prevents the periodic-workload trap.

---

## 4. Knowledge check

### Q1
A rightsizing recommendation shows CPU avg = 3%. The Metrics drawer also shows a 90% spike on one day. Best action:

A. Apply (averaging confirms it's idle)
B. Investigate — the spike may indicate a periodic workload that needs the headroom. Cross-check with the team before applying. The 90% suggests a real load event that the average hides.
C. Dismiss immediately
D. Increase the rule threshold

<details>
<summary>Show answer</summary>

**Correct: B.** Average-based recommendations miss periodic spikes. Always read max + P95 + P99 + investigate spikes before applying.
</details>

### Q2
Memory metrics require an agent. Without it:

A. The recommendation fires with memory data anyway
B. Memory-aware rules fall back to CPU-only logic; the team should install the cloud monitoring agent (CloudWatch agent / Ops Agent / Azure Monitor agent) for full coverage. Without agent: graceful degradation, not failure.
C. Discovery fails
D. Recommendations are blocked

<details>
<summary>Show answer</summary>

**Correct: B.** Agent is opt-in. Without it, memory data absent; rules degrade gracefully.
</details>

### Q3
Metrics in the drawer can be up to:

A. Real-time
B. ~24 hours stale (metrics-sync cron runs daily at 03:00 UTC). Cost optimization tolerates this; real-time monitoring is a different use case.
C. 7 days stale
D. 30 days stale

<details>
<summary>Show answer</summary>

**Correct: B.** Daily sync; ~24h max lag.
</details>

---

## 5. Apply

The Metrics drawer is on every MetricsAware rule's card. For deeper analysis, Resource detail → Metrics tab shows the full chart.

For your team: read the drawer for every rightsizing recommendation before applying. The 5-minute check prevents production breakage.

---

## Related lessons

- [L2 — Activity tab](L2_activity_tab.md) *(next)*
- [L3 — Pricing gap + DLQ](L3_pricing_gap_dlq.md)
- [L4 — Evidence vs bill](L4_evidence_vs_bill.md)
- [M2.1.L3 — Rule interface](../M2.1_rule_library/L3_rule_interface.md)
- [M2.1.L5 — Reading a recommendation card](../M2.1_rule_library/L5_reading_a_rec_card.md)

## Glossary terms touched

[Metrics drawer](../../../reference/glossary/metrics-drawer.md) · [Periodic-workload pattern](../../../reference/glossary/periodic-workload-pattern.md) · [P95 / P99](../../../reference/glossary/p95-p99.md) · [CloudWatch agent](../../../reference/glossary/cloudwatch-agent.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.2.L1
