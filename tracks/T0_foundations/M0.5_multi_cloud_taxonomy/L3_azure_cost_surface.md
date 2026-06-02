# Azure cost surface — reservations, hybrid benefit, deallocate-vs-stop

§ T0 · M0.5 · L3 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** Azure's three primary cost levers (Reservations, Hybrid Benefit, Spot) **and recognize** the deallocate-vs-stop trap.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Stop paying for stopped Azure VMs." |
| **Personas** | FinOps Analyst · Platform Engineer · Finance Partner |
| **Prerequisites** | M0.1, M0.4 |
| **Time** | 10 minutes |
| **Bloom verb** | Distinguish (Analyze) and Recognize (Understand) |

---

## 1. Concept

Azure's cost surface looks similar to AWS and GCP but has two mechanics that catch teams: **deallocate vs stop** for VMs and the **Hybrid Benefit** discount for Windows / SQL workloads. Plus the amortized-cost gotcha from [M0.4 L3](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md), which is so important it gets its own lesson.

### The top 10 Azure services by typical spend share

```
RANK  SERVICE                          TYPICAL %  NOTES
─────────────────────────────────────────────────────────────────────
 1    Virtual Machines                 30–50%    Equivalent of EC2
 2    Azure SQL / Cosmos DB            10–20%    Managed databases
 3    Azure Storage (Blob / Disks)      5–15%    Like S3 + EBS combined
 4    AKS                               5–15%    Kubernetes
 5    Network                           5–10%    Egress, ExpressRoute, NAT
 6    Application Gateway / Load Bal.   1–5%     LB equivalents
 7    Azure Monitor / Log Analytics     2–8%     CloudWatch equivalent
 8    Functions                         1–4%     Serverless
 9    Databricks                        2–10%    On Azure
10    Sentinel / Defender               1–5%     Security
```

### The deallocate-vs-stop trap

Azure VMs have two off-states. Most teams discover the difference the hard way.

**"Stopped" (from inside the OS or "Stop" in the Azure portal under certain paths).** The VM is powered off. The compute is still allocated. **You continue to be billed for the VM compute.** This is rare in Azure-native control surfaces but happens when teams shut down via the OS without using the Azure platform's stop command.

**"Stopped (deallocated)".** The VM is powered off and the compute allocation is released. **You stop paying for compute.** Storage (the OS disk and data disks) continues to bill at its per-GB rate.

Net: in Azure, "stop the VM" needs to mean "deallocate." Any tool or human action that stops without deallocating leaves compute billing.

```
STATE                          COMPUTE BILL   STORAGE BILL
─────────────────────────────────────────────────────────
Running                            $X            $Y
Stopped (allocated)                $X            $Y     ← TRAP
Stopped (deallocated)               $0            $Y     ← correct
Deleted                             $0           $Y if managed disks remain, else $0
```

ZopNight's Azure scheduler uses deallocate for VMs. Any team writing their own scheduling needs to verify the API call is `Deallocate`, not `Stop`. (See the [FEATURES.md](../../../../FEATURES%20(1).md) reference for the Azure-specific implementation note.)

### Azure Reservations

Azure Reservations are roughly equivalent to AWS Reserved Instances:

- **1-year or 3-year** terms
- Apply to **specific VM SKU** (e.g., D8s_v3) in a **specific region** (or globally for "scope: shared")
- Upfront, partial-upfront, or monthly payment options
- Up to **~40% discount** on the rate card for 3-year, ~25% for 1-year
- **Exchange / cancel** options available with restrictions

The amortized-cost behaviour from [M0.4 L3](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md) is the critical reading nuance: ActualCost at subscription scope returns $0 for reserved resources, AmortizedCost is the right column for per-resource reporting.

### Azure Hybrid Benefit (AHB)

A discount that the other clouds do not have. If you own on-premises Windows Server or SQL Server licenses with active Software Assurance, you can bring those licenses to Azure and skip paying for the license portion of the VM cost.

```
WORKLOAD                                  HYBRID BENEFIT IMPACT
─────────────────────────────────────────────────────────────────────
Windows Server VM (Standard_D8s_v3)        ~36% discount on VM rate
SQL Server VM (any size)                   ~55% discount on the SQL portion
SQL Managed Instance                       ~55% discount
```

AHB is opt-in per resource. A team migrating from on-prem with existing licenses can capture significant savings. A team that does not check whether AHB applies leaves money on the table.

### Azure Spot

Equivalent of AWS Spot or GCP Spot. Up to **~90% discount** on rate card. Eviction is on a per-VM basis with a 30-second warning. Spot VMs cannot be live-migrated.

### Network specifics

- **Bandwidth within Availability Zones (same region):** free.
- **Bandwidth between zones in same region:** $0.01 per GB each direction (similar to GCP, unlike AWS).
- **Internet egress:** tiered, starting at $0.087 per GB (first 5 GB free).
- **ExpressRoute:** dedicated private connection, separate pricing model, can dramatically reduce egress cost for high-bandwidth flows.

### Other Azure cost notes

- **Disk caching tier** matters: Premium SSD (P-series) vs Standard SSD vs Standard HDD all have different per-GB-month rates and IOPS characteristics. Default Premium SSD on a dev VM is overspend.
- **Backup vaults** charge per protected instance + per GB stored. Cleanup of orphaned backup vaults is a common audit finding.
- **Log Analytics** has a daily cap (configurable) that prevents runaway ingestion. Use it.
- **Bandwidth between Azure regions** ($0.02 per GB) is significantly cheaper than internet egress.

---

## 2. Demo

A real (anonymized) Azure breakdown showing AHB impact and the deallocate trap:

```
SCENARIO 1: Without AHB
  10× Windows D8s_v3 VMs, 24/7              $4,800/month

SCENARIO 2: With AHB (licenses available)
  Same 10× VMs                              $3,072/month (-36%)

SCENARIO 3: Same 10 VMs, 5 of them were "Stopped" not "Deallocated"
  Compute keeps billing for the 5 stopped   $4,800/month
  (no discount because they are not "off")

SCENARIO 4: Correct configuration — AHB + Deallocate 5 nightly
  AHB applies, deallocate frees compute      $2,250/month (-53%)
```

Same starting workload. The right combination of two Azure-specific levers (AHB + deallocate) returns 53% of the original cost. Missing either gives back 0–36% of the available savings.

(Asset: `assets/diagrams/M0.5_L3_azure_levers.svg`.)

---

## 3. Hands-on (7 min)

If your organization runs Azure:

```
1. List your stopped Azure VMs:
   az vm list -d --query "[?powerState=='VM stopped']"
   
   These are still billing for compute. Any in this list should be
   deallocated or deleted.

2. List your deallocated VMs:
   az vm list -d --query "[?powerState=='VM deallocated']"
   
   These are correctly off. Storage still bills.

3. Check Hybrid Benefit eligibility:
   az vm list --query "[?licenseType=='Windows_Server']" 
   
   These have AHB applied.
   
   az vm list --query "[?osProfile.windowsConfiguration && licenseType==null]"
   
   These are Windows VMs WITHOUT AHB. Check if licenses are available.

4. Pull your reservation utilization report from the Azure Portal
   (Cost Management → Reservations). Look for any reservation with
   <85% utilization — these are over-commitment in progress.
```

---

## 4. Knowledge check

### Q1
A team reports: "We stopped our Azure VMs but the bill did not drop." Most likely cause:

A. Azure bills with a 30-day lag
B. The VMs are "Stopped" but not "Deallocated." Compute keeps billing. Use the Deallocate operation to fully release the compute allocation.
C. The team stopped the wrong VMs
D. Azure raised prices

<details>
<summary>Show answer</summary>

**Correct: B.** This is the canonical Azure trap. Stop without Deallocate keeps the compute allocation, which keeps billing.
</details>

### Q2
A team has on-prem Windows Server licenses with Software Assurance. They have not opted in to Azure Hybrid Benefit on their Windows VMs. The defensible savings opportunity:

A. ~5% off Windows VM costs
B. ~36% off Windows VM costs (and ~55% off SQL Server portions)
C. ~85% off everything
D. None

<details>
<summary>Show answer</summary>

**Correct: B.** AHB is a substantial discount that requires opt-in per resource. Worth the effort.
</details>

### Q3
A reservation utilization report shows 62% utilization on a 3-year Azure Reservation. The defensible action:

A. Buy more reservations
B. Investigate — 62% utilization means 38% of the committed capacity is unused. The reservation may need to be exchanged for a different SKU, scope, or term. Use the exchange option before more capacity erodes.
C. Cancel and refund
D. Wait for term expiry

<details>
<summary>Show answer</summary>

**Correct: B.** 62% utilization is below break-even on a 3-yr reservation. Azure allows exchanging reservations (with restrictions) — investigate whether the workload moved to a different SKU and the reservation can be re-scoped.
</details>

---

## 5. Apply

ZopNight's Azure integration handles:

- **Discovery** via Resource Graph (101 resource types)
- **Billing sync** via Azure Cost Management with `AmortizedCost` (the right column — see [M0.4 L3](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md))
- **Scheduling** uses Deallocate (not Stop) for VMs — the correct call
- **Activity logs** via Azure Activity Log for the "Recent Activity" tab

Azure-specific rules in the [460-rule library](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md) include AHB-eligible-VMs-without-AHB, allocated-but-stopped detection, reservation under-utilization, and the deallocate-vs-stop check.

---

## Related lessons

- [L4 — Multi-cloud governance](L4_multi_cloud_governance.md) *(next)*
- [T0.M0.4.L3 — Amortized cost: Azure's gotcha](../M0.4_rack_rate_vs_billing/L3_amortized_azure.md)
- [T2.M2.6 — K8s workload scheduling (AKS)](../../T2_zopnight_engineer/M2.6_k8s_scheduling/00_README.md)

## Glossary terms touched

[Deallocate](../../../reference/glossary/deallocate.md) · [Azure Hybrid Benefit](../../../reference/glossary/azure-hybrid-benefit.md) · [Azure Reservation](../../../reference/glossary/azure-reservation.md) · [Software Assurance](../../../reference/glossary/software-assurance.md) · [ExpressRoute](../../../reference/glossary/expressroute.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.5.L3
