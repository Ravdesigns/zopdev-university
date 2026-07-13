# GCP cost surface — quirks and gotchas

§ T0 · M0.5 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** GCP's three pricing levers (sustained-use, CUD, Spot) **and identify** the cross-AZ traffic charge that catches teams migrating from AWS.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Read a GCP bill without applying AWS assumptions." |
| **Personas** | FinOps Analyst · Platform Engineer |
| **Prerequisites** | M0.1, [L1](L1_aws_cost_surface.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Distinguish (Analyze) and Identify (Remember) |

---

## 1. Concept

GCP's cost surface looks like AWS at first glance — compute, storage, network, services — but several mechanics work differently. Teams migrating from AWS to GCP commonly assume parity and get caught.

### The top 10 GCP services by typical spend share

```
RANK  SERVICE                          TYPICAL %  NOTES
─────────────────────────────────────────────────────────────────────
 1    Compute Engine                   30–50%    VMs, equivalent of EC2
 2    BigQuery                         10–25%    Storage + query cost
 3    Cloud Storage                     5–15%    GCS buckets
 4    GKE (Kubernetes Engine)           5–15%    Node compute + control plane
 5    Cloud SQL                         5–10%    Managed DB
 6    Network egress                    5–10%    Internet + inter-region
 7    Cloud Logging / Monitoring        2–8%     The CloudWatch equivalent
 8    Cloud Load Balancing              1–5%     Forwarding rules + LCU equivalent
 9    Cloud Functions                   1–4%     Serverless
10    Cloud Run                         1–4%     Managed container service
```

### The three GCP-specific pricing levers

**Sustained-use discount (SUD).** Automatic. Any Compute Engine VM running >25% of the month gets a discount that ramps up to 30% off for VMs running 100% of the month. No purchase, no commitment, no opt-in. AWS and Azure have no equivalent. This is GCP's quiet structural advantage and is why "always-on" on GCP is meaningfully cheaper than AWS at the same rate-card price.

**Committed Use Discount (CUD).** GCP's equivalent of AWS Reserved Instances or Azure Reservations, but with two flavors. *Resource-based CUD* commits to a specific machine family in a specific region — up to 57% off for 3-year. *Spend-based CUD* commits to a dollar amount per hour — up to 28% off, more flexible, applies across families.

**Spot (formerly Preemptible).** Stateless workload pricing. 60–91% off rate card. Up to 24-hour runtime (eviction is guaranteed at the 24-hour mark, often sooner). Best fit: batch jobs that checkpoint, K8s nodes that drain gracefully.

### The cross-AZ chatter trap (the migration gotcha)

On AWS, traffic between availability zones within the same region is *free*. On GCP, it is *charged* at $0.01 per GB egress + $0.01 per GB ingress (the receiving side also pays). A K8s cluster spanning three zones with chatty service-to-service traffic can rack up significant network spend on GCP that would have been free on AWS.

```
SCENARIO: 100 GB/day inter-zone traffic in a GKE cluster
AWS equivalent (us-east-1):   $0
GCP (us-central1):            ~$60/month  (100GB × 30 × $0.02)
```

Multiply across many services in a high-traffic cluster and the line item becomes non-trivial. The mitigation is zone-pinning (run a workload's pods in a single zone, accept the reduced AZ-failure tolerance) or regional persistent disks (replicate at the storage layer instead of the network layer).

### BigQuery's two pricing axes

BigQuery is unique in having both **storage** and **query** as primary pricing axes:

- **Storage:** $0.02 per GB-month (active), $0.01 per GB-month (long-term, automatic after 90 days untouched)
- **Query:** $6.25 per TB scanned (on-demand) or flat rate via reserved slots ($2,000–$40,000+ per month per 100 slots)

The query-pricing trap: a poorly-written query (no partition pruning, `SELECT *`, no clustering) can scan terabytes per execution. One bad dashboard refreshing every 30 minutes can add hundreds of dollars a day. The fix is query review, partition discipline, and reserved slot capacity for predictable workloads.

### Per-vCPU pricing nuance

Compute Engine prices custom machine types per vCPU and per GB of RAM independently. This is finer-grained than AWS's instance-family approach: a workload that needs 6 vCPU and 4 GB RAM can be priced exactly at 6+4, not rounded up to the nearest instance type. The implication: rightsizing on GCP is often more granular than on AWS.

### Other GCP cost notes

- **Persistent disks** are charged per GB-month, with SSD and HDD tiers. Snapshots are charged per GB-month at $0.026 (cheaper than EBS).
- **Cloud Logging** has a free tier (50 GiB ingestion / month) which is generous compared to CloudWatch.
- **Network premium tier** is the default for egress (uses Google's premium backbone). Switching to "standard tier" (public internet routing) saves up to 30% on egress, with some latency trade-off.
- **GKE Autopilot** charges per pod (vCPU-second and GB-second) instead of per-node, abstracting the cluster sizing — convenient but harder to optimize without per-pod visibility.

---

## 2. Demo

GCP-specific cost decomposition for a real GKE-heavy estate:

```
SERVICE                          MONTHLY    % OF BILL    NOTES
────────────────────────────────────────────────────────────────────────
Compute Engine (GKE nodes)       $42,300    35%         Cross-zone GKE
BigQuery                         $19,400    16%         8 TB/day scan
Cloud Storage                    $11,200     9%         Data lake
GKE control plane                $   720    <1%         3 clusters × $0.10/hr × 730
Network egress                   $ 9,800     8%         ← high — cross-zone GKE
Cloud SQL                        $ 7,400     6%         
Cloud Logging                    $ 5,200     4%         Above free tier
Cloud Monitoring                 $ 3,100     3%         Custom metrics heavy
Other long tail                  $20,880    18%         
────────────────────────────────────────────────────────────────────────
TOTAL                           $120,000   100%
```

The 8% network line is the GCP gotcha. On AWS the same workload would have spent ~$0 on inter-AZ traffic. The mitigation: pin the GKE workloads to a single zone (accept reduced AZ-failure tolerance) or use regional persistent disks instead of cross-zone replication.

(Asset: `assets/diagrams/M0.5_L2_gcp_breakdown.svg`.)

---

## 3. Hands-on (6 min)

If your organization runs GCP:

```bash
# Pull your top services by spend
bq query --use_legacy_sql=false --format=pretty '
SELECT 
  service.description AS service,
  SUM(cost) AS spend
FROM `your_billing_dataset.gcp_billing_export_v1_*`
WHERE DATE(usage_start_time) BETWEEN "2026-04-01" AND "2026-04-30"
GROUP BY service
ORDER BY spend DESC
LIMIT 10
'
```

Identify:
1. Where does your network egress sit as a percent?
2. Is there cross-zone GKE traffic driving it?
3. Are sustained-use discounts visible in the cost reduction column?

---

## 4. Knowledge check

### Q1
A workload that ran 24/7 on AWS at $X/month is migrated to GCP at the same rate-card price. After one month the GCP bill is lower than $X. Most likely reason:

A. GCP undercharged
B. Sustained-use discount applied automatically — workloads running 100% of the month get up to 30% off on Compute Engine
C. Currency error
D. Spot was applied

<details>
<summary>Show answer</summary>

**Correct: B.** SUD is automatic, no commitment, no opt-in. This is GCP's structural advantage for always-on workloads.
</details>

### Q2
A team migrates a chatty K8s cluster from AWS to GCP. The network egress line on the bill triples. Most likely cause:

A. GCP raised network prices
B. The cluster runs across multiple zones. On AWS, cross-AZ traffic was free; on GCP, it is charged at $0.01 per GB each direction. The fix is zone-pinning or regional persistent disks.
C. DNS misconfiguration
D. The cluster is bigger on GCP

<details>
<summary>Show answer</summary>

**Correct: B.** This is the canonical GCP migration gotcha. The fix is workload zone-pinning or a different network architecture.
</details>

### Q3
A BigQuery dashboard refreshes every 30 minutes by running `SELECT * FROM raw_events`. Monthly cost is $1,800. Most defensible fix:

A. Increase the BigQuery budget
B. Add partition pruning (filter by date), select only needed columns, and consider reserved slots for predictable workloads. The dashboard may drop from $1,800/month to $50/month with no query change in semantics.
C. Use a different tool
D. Disable the dashboard

<details>
<summary>Show answer</summary>

**Correct: B.** BigQuery's on-demand pricing punishes lazy queries. Partition pruning + column projection + clustering can drop scan cost by 1–3 orders of magnitude.
</details>

---

## 5. Apply

ZopNight's GCP integration handles:

- **Resource discovery** via Cloud Asset Inventory (88 resource types)
- **Billing sync** via BigQuery billing export (24h lag)
- **Metrics enrichment** via Cloud Monitoring for size + count on GCS and Artifact Registry
- **Activity logs** via Cloud Logging for the "Recent Activity" tab in evidence panels

GCP-specific rules in the [490-rule library](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md) include sustained-use opportunity detection (workloads on the edge of the SUD bracket), CUD coverage gap detection (steady workloads without commitments), and cross-zone egress alerts (high inter-zone traffic flagged for zone-pinning).

---

## Related lessons

- [L3 — Azure cost surface](L3_azure_cost_surface.md) *(next)*
- [L4 — Multi-cloud governance](L4_multi_cloud_governance.md)
- [T0.M0.4.L2 — Billing cost and the discount stack](../M0.4_rack_rate_vs_billing/L2_billing_cost.md)

## Glossary terms touched

[Sustained-use discount](../../../reference/glossary/sustained-use-discount.md) · [Committed Use Discount](../../../reference/glossary/committed-use-discount.md) · [Cross-AZ traffic](../../../reference/glossary/cross-az-traffic.md) · [BigQuery slots](../../../reference/glossary/bigquery-slots.md) · [Persistent disk](../../../reference/glossary/persistent-disk.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.5.L2
