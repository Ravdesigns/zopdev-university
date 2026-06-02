# Security signals — privileged, root, host network

§ T5 · M5.3 · L5 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the K8s security signals that correlate with cost optimization opportunities, **audit** your cluster for these signals, **and combine** security modernization with cost savings.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Find workloads with security issues; modernize them; capture the cost savings that come with the modernization." |
| **Personas** | Platform Engineer · SRE · Security Engineer |
| **Prerequisites** | M5.3.L1 - L4 · T0.M0.4 (basic K8s security) |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Apply), Audit (Apply), Combine (Synthesize) |

---

## 1. Concept

Some K8s security configurations correlate strongly with cost and reliability issues. Auditing security configs surfaces optimization opportunities — workloads that are *both* a security risk *and* expensive. Modernizing them captures both wins.

```
SECURITY SIGNALS THAT CORRELATE WITH COST WASTE:

  1. Privileged containers       (often legacy; often over-provisioned)
  2. Root user containers         (often unattended; often stale)
  3. Host network mode            (often pre-K8s design; often inefficient)
  4. No security context          (often poorly maintained; often forgotten)
  5. CAP_NET_ADMIN / capabilities (often legacy network tooling)
  6. PodSecurityPolicy violations  (often workloads not modernized)
  7. hostPath volumes (no PVC)     (often legacy storage patterns)
```

These aren't security audits per se — they're signal patterns where security debt and cost debt often co-occur.

### Why security signals correlate with cost

```
PRIVILEGED CONTAINERS — why they're often expensive:
  
  LEGACY origin: containers ported from VMs without modernization
                 Often kept the VM-era sizing (over-provisioned)
  
  POORLY MAINTAINED: nobody touches "scary privileged" workloads
                    Resource requests never tuned
                    Workload behavior never optimized
  
  OUTDATED IMAGES: privileged often pinned to old image versions
                    Old code = often less efficient
                    
  NO MONITORING: less observed → resource patterns unknown
                  Can't right-size what you can't measure

ROOT USER CONTAINERS — why they're often stale:
  
  LEGACY MIGRATIONS: from systems where root was the default
  NO SECURITY REVIEW: never updated to non-root
  ABANDONMENT: original engineers left; nobody owns
  CORRELATION: 60% of root-user containers are >2 years old
               (vs ~20% for non-root containers)
```

The patterns are statistical, not deterministic. Auditing both dimensions together is the highest-leverage approach.

### What ZopNight surfaces

```
ZOPNIGHT K8S SECURITY RULES (cross-referenced with cost):

  RC-1731  K8s Privileged containers (security signal)
    Lists workloads running privileged
    Cross-reference: are they actively used?
    Average cost-recovery if modernized: $500-$2,000/mo
    
  RC-1732  K8s Pods with host network mode
    Lists workloads using host network
    Often pre-Kubernetes designs migrated as-is
    Modernization typically reduces resource needs
    
  RC-1733  K8s Root user containers
    Lists workloads not specifying non-root user
    Operational + security risk
    Often correlates with stale workloads
    
  RC-1734  K8s NoSecurityContext deployments
    Lists deployments without explicit security context
    Defaults often not what intended
    
  RC-1735  K8s capabilities granted (CAP_NET_ADMIN, etc.)
    Identifies elevated capabilities
    Often: easier alternatives exist
    
  RC-1736  K8s hostPath volumes (no PVC)
    Pre-K8s storage pattern
    PVC modernization often cheaper + more durable
```

Each recommendation includes the cost impact + suggested modernization path.

### Auditing workflow

```
QUARTERLY K8S SECURITY-COST AUDIT (90 minutes total):

WEEK 1, DAY 1 — INVENTORY (30 min)
  Open ZopNight → Recommendations → filter K8s security
  Export list to spreadsheet
  Count by category:
    Privileged: ___
    Root user: ___
    Host network: ___
    No security context: ___
    Elevated capabilities: ___
    hostPath volumes: ___

WEEK 1, DAY 2-3 — INVESTIGATION (60 min)
  For each flagged workload:
    1. Why is it configured this way?
    2. Who owns it?
    3. Is it actively used?
    4. Can it be replaced with a less-privileged equivalent?
    5. What's the cost impact of leaving it?
  
  Categorize:
    LEGITIMATE: document the security exception; leave alone
    MODERNIZABLE: plan migration
    OBSOLETE: terminate

WEEK 2-4 — REMEDIATION
  Migrate modernizable
  Terminate obsolete (with 7-day notice)
  Document legitimate exceptions in security wiki

VERIFY (post-quarter)
  Total flagged: down by X%
  Cost recovered: $Y
  Security posture: improved
```

The quarterly audit takes ~2 hours of investigation + 8-16 hours of remediation. ROI typically 5-20×.

### Common patterns + modernization paths

```
PATTERN A — OLD MONITORING AGENT
  Configuration: privileged + host network + root
  Origin: monitoring agent from 2018; never updated
  
  Modernization:
    Replace with modern agent (Datadog v7, New Relic v9, OpenTelemetry)
    Most have non-privileged modes with proper RBAC
    
  Benefits:
    Better security (least privilege)
    Often lower compute overhead (modern agents more efficient)
    Cost savings: $200-800/mo per cluster
    
PATTERN B — LEGACY DATABASE OPERATOR
  Configuration: privileged for low-level operations
  Origin: in-house DB operator from years ago
  
  Modernization:
    Replace with managed K8s database operator
    Kubegres, CloudNativePG, Postgres Operator
    These run non-privileged with proper RBAC
    
  Benefits:
    Better security + better maintainability
    Often: better resource discipline (modern operators are tuned)
    Cost savings: $500-2,000/mo per database cluster
    
PATTERN C — CUSTOM LOGGING SIDECAR
  Configuration: privileged for log file access
  Origin: custom logging pattern from 2019
  
  Modernization:
    Switch to managed logging via FluentBit / Vector
    Or: Loki / Promtail with proper RBAC
    
  Benefits:
    Standard pattern (easier to maintain)
    Lower per-pod overhead
    Cost savings: $50-150/mo per workload
    
PATTERN D — LEGACY NETWORK TOOLING
  Configuration: CAP_NET_ADMIN + host network
  Origin: custom network policy enforcement
  
  Modernization:
    Switch to Cilium / Calico (native K8s network policies)
    No elevated capabilities needed
    
  Benefits:
    Standardization
    Better policies + better observability
    Cost: maintenance reduction
    
PATTERN E — HOSTPATH STORAGE
  Configuration: hostPath volume (no PVC)
  Origin: pre-K8s storage pattern
  
  Modernization:
    PVC backed by EBS / GP3 / managed disks
    Properly versioned + backed up
    
  Benefits:
    Durable storage (survives node restarts)
    Backup-friendly
    Cost: usually cheaper at scale (managed storage tiers)
```

Most legacy workloads fit one of these five patterns. The modernization path is well-known.

### The cost-side benefit

Workloads with security issues often have:

```
CORRELATED COST WASTE:
  ✓ Outdated resource requests/limits (set years ago; not tuned)
  ✓ Over-provisioned compute (legacy sizing)
  ✓ Unnecessary always-on (no schedule applied)
  ✓ Idle pods accumulated (Shape 2/3 from L3)
  ✓ Old image versions (often less efficient code)
  ✓ Missing modern HPA (manual replica counts forever)

MODERNIZING SECURITY usually surfaces all these issues simultaneously
because the migration forces re-architecting the deployment.

Bonus: modern deployments are typically simpler to operate;
        engineers more comfortable touching them;
        ongoing optimization more likely.
```

The security audit becomes a Trojan horse for cost discipline.

### When privileged IS the right choice

Not every privileged container is wrong:

```
LEGITIMATE PRIVILEGED USE CASES:
  
  Storage drivers (CSI plugins for some legacy systems)
    Need host access for volume management
    
  Container runtime sidecars (rare; usually replaceable)
    Hostpath access for runtime data
    
  Custom hardware integration (GPUs, FPGAs)
    Some require privileged for driver loading
    
  Cluster-level tools that genuinely need host access:
    node-exporter (in some modes)
    Some specialized monitoring/observability tools
    Kernel-level eBPF tools

WHEN LEGITIMATE:
  Document the reason in security wiki
  Annotate the workload manifest with the justification
  Review annually (is it still needed? has a non-privileged option emerged?)
  
DON'T blindly remove documented exceptions.
```

The documentation discipline is what separates "legitimate" from "we forgot to revisit it."

### Combined ROI — security + cost

```
TYPICAL QUARTERLY AUDIT FINDINGS (mid-size org, 50-team cluster):

  Privileged containers found:        10
    Legitimate (documented):           3
    Modernizable:                       4
    Obsolete:                           3
    
  Root user containers:                23
    Legitimate:                         2
    Modernizable:                      18
    Obsolete:                           3
    
  Host network mode:                    7
    Legitimate:                         2
    Modernizable:                       5
    
  Total flagged:                       40
  Action items:                         30

REMEDIATION PLAN (next quarter):
  Modernize 4 privileged workloads (in 4 weeks)
  Modernize 18 root-user workloads (in 4-8 weeks, batched)
  Modernize 5 host-network workloads (in 2-4 weeks)
  Terminate 6 obsolete workloads (with 7-day notice)
  Document 7 legitimate exceptions

COST SAVINGS: ~$3,500/mo = $42K/year
SECURITY POSTURE: significantly improved
COMPLIANCE: easier audits (fewer exceptions)
EFFORT: ~4 weeks of part-time engineering work
ROI: ~10:1 in year 1
```

The quarterly audit pays for itself in the first month.

---

## 2. Demo

A real K8s security-cost audit:

```
QUARTERLY AUDIT (Q3 2026):

DAY 1 — INVENTORY:
  Open ZopNight → K8s security rules
  Export: 38 flagged workloads

DAY 2-3 — INVESTIGATE:

  10 PRIVILEGED CONTAINERS:
    3 legitimate (CSI driver, eBPF tool, GPU driver)
      → document; annotate manifests; review annually
    
    4 modernizable:
      - 2 legacy monitoring agents (Datadog v5 → v7)
      - 2 custom log shippers (replace with FluentBit)
      Plan: 4-week migration
      
    3 obsolete:
      - 2 abandoned experiments (no owner; no activity 6+ months)
      - 1 superseded ingress controller (replaced 18 mo ago; still running)
      Plan: 7-day notice; terminate
      
  18 ROOT USER CONTAINERS:
    2 legitimate (special use cases; documented)
    16 modernizable: add `runAsUser: 1000` to manifests
      Plan: batch updates in 4 PR cycles over 4 weeks

  5 HOST NETWORK MODE:
    2 legitimate (network policy enforcement; documented)
    3 modernizable:
      - 2 outdated metrics collectors (replace)
      - 1 legacy DNS proxy (already replaced; still running orphaned)
      Plan: 2-week migration + 1 terminate

REMEDIATION (over Q4):

  WEEK 1 — terminate 4 obsolete workloads
    Cost recovery: $1,400/mo
    
  WEEK 2-3 — modernize 4 privileged
    Per-workload effort: 4-8 hours
    Cost recovery: $1,800/mo
    
  WEEK 4-7 — modernize 16 root-user (batched, 4/wk)
    Cost recovery: $300/mo (root-user issue is mainly security, not cost)
    
  WEEK 5-6 — modernize 3 host-network
    Cost recovery: $400/mo

TOTAL Q4 RECOVERY: ~$3,900/mo recurring = $46,800/year
ENGINEERING EFFORT: ~50 hours over Q4
COST: ~$5,000 of engineering time
ROI: 9:1 in year 1; ongoing

SECURITY POSTURE: significantly improved
  Less privileged surface area
  Fewer compliance exceptions
  Easier audits going forward
```

The pattern is repeatable. Quarterly audits compound — fewer legacy workloads each time.

---

## 3. Hands-on (5 min)

Quick K8s security-cost scan:

```
□ STEP 1: Open ZopNight K8s security recommendations
  Filter to: privileged, root user, host network, hostPath

□ STEP 2: Count by category
  Privileged: _____
  Root user: _____
  Host network: _____
  HostPath: _____
  TOTAL flagged: _____

□ STEP 3: Spot-check 3 flagged workloads
  Workload 1: __________   Why flagged: __________
              Category: □ Legitimate  □ Modernizable  □ Obsolete
              Est cost: $_____/mo
              
  Workload 2: __________   Why flagged: __________
              Category: □ Legitimate  □ Modernizable  □ Obsolete
              Est cost: $_____/mo
              
  Workload 3: __________   Why flagged: __________
              Category: □ Legitimate  □ Modernizable  □ Obsolete
              Est cost: $_____/mo

□ STEP 4: Plan quarterly audit
  Owner: __________
  Cadence: every 90 days
  First audit date: __________

□ STEP 5: Estimate ROI
  Total flagged: _____
  Estimated modernizable: _____ (60-70% typical)
  Estimated cost recovery: $_____/yr
```

A 20-minute scan reveals the surface area. The audit itself is the work.

---

## 4. Knowledge check

### Q1
A privileged container with high cost and low activity (Shape 2/3 idle):

A. Random workload state
B. Likely abandoned legacy. Privileged + idle is a strong signal of "deployed years ago, forgotten." Investigate; often a candidate for termination. Combines security + cost wins.
C. Required for security
D. Modern best practice

<details>
<summary>Show answer</summary>

**Correct: B.** Often legacy + idle = strong termination candidate.
</details>

### Q2
A modern monitoring agent typically uses:

A. Privileged + host network + root
B. Non-privileged with specific RBAC for monitoring (least-privilege model). Modern agents (Datadog v7+, OpenTelemetry, Prometheus operators) replace the legacy "everything as root" pattern. Often: lower resource overhead too.
C. Random
D. Root user always

<details>
<summary>Show answer</summary>

**Correct: B.** Modern agents use least privilege; often lower overhead.
</details>

### Q3
Audit findings: 4 privileged containers, none documented as intentional:

A. Acceptable; leave them
B. Investigate each. Some may be legitimate (e.g., CSI drivers, GPU operators) — document the reason. Others may be migrations from older systems — modernize. The mix is typical; the action is investigation, not blind removal.
C. Random
D. Remove all immediately

<details>
<summary>Show answer</summary>

**Correct: B.** Investigate. Mix of legitimate + modernizable typical.
</details>

---

## 5. Apply

Quarterly K8s security audit. Cost + security improvements together. Document legitimate exceptions; modernize the rest; terminate obsolete.

For ZopNight: K8s security rules with cost cross-reference. Recommendations show modernization paths.

---

## Related lessons

- [L1 — Requests and limits](L1_requests_limits.md)
- [L2 — HPA signals](L2_hpa.md)
- [L3 — Idle workload shapes](L3_idle_workloads.md)
- [L4 — Single-replica patterns](L4_single_replica.md)
- [L6 — Orphan PVC cleanup](L6_orphan_pvc.md) *(next)*
- [T0.M0.4 — Basic cloud security](../../T0_foundations/M0.4_security_basics/00_README.md)

## Glossary terms touched

[Privileged container](../../../reference/glossary/privileged-container.md) · [Host network mode](../../../reference/glossary/host-network-mode.md) · [Security-cost correlation](../../../reference/glossary/security-cost-correlation.md) · [Modernization path](../../../reference/glossary/modernization-path.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L5
