# AWS cost surface — services that print money

§ T0 · M0.5 · L1 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **rank** the top 10 AWS services by typical spend share **and identify** the three services that quietly print money in the long tail.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Know where to look first on an AWS bill." |
| **Personas** | FinOps Analyst · Platform Engineer · Finance Partner |
| **Prerequisites** | M0.1 |
| **Time** | 10 minutes |
| **Bloom verb** | Rank (Evaluate) and Identify (Remember) |

---

## 1. Concept

Every AWS bill has the same shape. EC2 dominates. RDS and S3 follow. Then a long tail of services that individually look small and in aggregate are the biggest hidden line item. Knowing the shape lets you scan an unfamiliar bill in seconds.

### The top 10 (by typical spend share across mid-size SaaS estates)

```
RANK  SERVICE                             TYPICAL %  WHY IT'S BIG
─────────────────────────────────────────────────────────────────────
 1    EC2 (compute + EBS)                 30–50%    Long-running VMs at scale
 2    RDS / Aurora                        10–20%    Database compute + storage
 3    S3                                   5–15%    Data lakes, backups, content
 4    Data Transfer                        5–15%    Egress, cross-region, NAT GW
 5    EKS / ECS / Fargate                  5–15%    Container compute and node hours
 6    Lambda                               2–8%     High invocation × small per-call
 7    CloudWatch                           2–8%     Metric ingestion, log storage
 8    ELB (ALB / NLB / Classic)            1–5%     Per-LCU + LB-hour charges
 9    DynamoDB                             1–5%     On-demand RCU/WCU
10    Route 53                            <1–2%    Queries × hosted zones
```

Below this list sits the long tail — 50+ services that each contribute under 1% but collectively can hit 5–10% of bill.

### What each one charges

**EC2.** Hourly rate × hours, plus EBS volume per GB-month, plus snapshot per GB-month, plus DataTransfer-Out-Bytes. Multiple rows per instance.

**RDS.** Instance hourly rate, allocated storage per GB-month, IOPS (for provisioned-IOPS volumes), backup storage, Multi-AZ premium (~double the instance cost).

**S3.** Storage per GB-month (varies by tier: Standard, IA, Glacier, Archive), request count (GET, PUT, LIST priced separately), data retrieval (Glacier in particular), and outbound transfer.

**Data Transfer.** This is the "surprise" line item. NAT Gateway data-processing ($0.045 per GB), inter-region traffic, internet egress (~$0.09 per GB out), CloudFront delivery. Internal-AZ on AWS is free; many teams assume cross-AZ is also free — it costs $0.01 per GB each direction.

**EKS / ECS / Fargate.** EKS control plane ($0.10 per hour per cluster). Node group EC2 charges. Fargate per-vCPU-hour and per-GB-hour for pod compute.

**Lambda.** Per-invocation × per-GB-second of memory used. Free tier covers the first 400K GB-seconds per month. Workloads with high invocation count and small per-call (event-driven, API back-ends) can rack up significant Lambda spend.

**CloudWatch.** Per metric per month ($0.30 for the first 10K custom metrics, less above). Log ingestion ($0.50 per GB). Log storage ($0.03 per GB-month, free for first 5 GB). High-cardinality metrics and uncapped log retention are the failure modes.

**ELB.** Per LB-hour ($0.0225 ALB, $0.0225 NLB) plus per-LCU (load balancer capacity unit) for traffic processed. A 24/7 ALB with modest traffic costs ~$22/month — small individually, but estates with hundreds of ALBs see compounding.

**DynamoDB.** Two pricing modes. On-demand: per-request RCU and WCU charges. Provisioned: reserved RCU/WCU × hours. Storage charged separately. Streams charged separately. On-demand can spike with traffic; provisioned can over-pay during quiet periods.

**Route 53.** Per hosted zone ($0.50/month for the first 25), per query (typically $0.40 per million for standard, more for latency-routed). Almost never a big line item.

### The three quiet money-printers

Three services consistently print money in the long tail of every AWS estate:

**NAT Gateway.** $32.40 per gateway per month *baseline*, plus $0.045 per GB processed. Provisioned in every dev VPC by Terraform modules. Often one per AZ × three AZs × ten VPCs = 30 NAT GWs = $972/month of baseline cost before any traffic. Action: consolidate, use VPC endpoints for AWS-internal traffic, replace with NAT Instance in non-prod.

**CloudWatch metrics + logs.** High-cardinality custom metrics (one per pod, per request label) and uncapped log retention quietly add up. Action: cardinality discipline, log retention policy.

**Data Transfer-Out-Bytes.** Egress to the public internet at $0.09 per GB. Internal services calling each other through public DNS (instead of VPC endpoints) burn this line. Action: VPC endpoints, internal Route 53, private link.

### How to scan an AWS bill in 60 seconds

```
1. Open Cost Explorer for last month.
2. Group by SERVICE, sort by cost desc.
3. EC2 ~40% — expected. Move on.
4. RDS ~15% — expected. Move on.
5. S3 ~10% — expected. Move on.
6. DataTransfer-Out-Bytes — is this above 10%?
                              If yes, dig into egress destinations.
7. NAT Gateway — how many? More than expected? Audit.
8. CloudWatch — above 5%? Cardinality audit.
9. Lambda — above 3%? Check invocation patterns.
10. Anything else above 3%? Investigate.
```

Sixty seconds gets you a working hypothesis. Then drill.

---

## 2. Demo

A real (anonymized) breakdown of one SaaS estate, $182K monthly AWS bill:

```
SERVICE                          MONTHLY    % OF BILL    NOTES
────────────────────────────────────────────────────────────────────────
EC2 (compute + EBS + snapshots)  $74,820     41.1%      m5/c5 mix
RDS (db.r5.* fleet)              $28,100     15.4%      Multi-AZ enabled in prod
S3                               $15,300      8.4%      Standard + IA tier
DataTransfer-Out-Bytes           $12,470      6.9%      ← higher than typical
EKS (compute + cluster fees)     $11,420      6.3%      
NAT Gateway                      $ 3,890      2.1%      28 gateways across non-prod
CloudWatch (metric + log)        $ 7,200      4.0%      ← cardinality high
Lambda                           $ 3,840      2.1%      
ELB                              $ 4,120      2.3%      62 ALBs
Other (long tail)                $20,840     11.4%      
────────────────────────────────────────────────────────────────────────
TOTAL                           $182,000    100.0%
```

Three actionable signals from the 60-second scan: DataTransfer above 10% suggests egress audit, NAT Gateway count (28) suggests consolidation, CloudWatch 4% suggests cardinality discipline. Three concrete starting points.

(Asset: `assets/diagrams/M0.5_L1_aws_breakdown.svg`.)

---

## 3. Hands-on (7 min)

Pull your own last-month AWS bill grouped by service:

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-05-01 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

Sort by cost descending. Run the 60-second scan from §1. Note any anomalies — services higher than the typical ranges. The anomalies are your starting points.

---

## 4. Knowledge check

### Q1
A team sees Data Transfer at 18% of their AWS bill. The most actionable hypothesis to investigate first:

A. Cloud provider error
B. NAT Gateway data-processing fees, internet egress to global users, or cross-region replication. Look at which destination type drives the most volume.
C. EC2 is overcharging
D. Increase the budget

<details>
<summary>Show answer</summary>

**Correct: B.** Data Transfer above 10% is unusual and merits investigation. The three driver classes are NAT processing, internet egress, and cross-region replication. Drill into the bytes-by-destination breakdown.
</details>

### Q2
The "EC2-Other" line item on AWS bills typically includes:

A. EBS, snapshots, and data transfer associated with EC2 instances
B. Lambda
C. EKS
D. S3

<details>
<summary>Show answer</summary>

**Correct: A.** "EC2-Other" rolls up EBS, snapshots, and EC2-attached data transfer. The naive question "how much does EC2 cost?" is answered by combining the EC2 service line with EC2-Other.
</details>

### Q3
A bill shows CloudWatch at 7% of total. Most likely cause:

A. CloudWatch is a normal cost
B. High-cardinality custom metrics, uncapped log retention, or both. Audit the metric namespace count and per-metric cardinality, plus log group retention policies.
C. AWS raised CloudWatch prices
D. Disable monitoring

<details>
<summary>Show answer</summary>

**Correct: B.** 7% is on the high end for CloudWatch and almost always indicates cardinality or retention issues. The fix is cardinality discipline (label cardinality limits) and retention policy.
</details>

---

## 5. Apply

ZopNight's [Reports → Cost Breakdown](https://app.zopnight.com/reports/costs) defaults to Layout: Provider→Account→Type→Team. Switching to "Provider→Account→Service→Team" gives a service-level breakdown across AWS accounts in seconds. Drill into any service node to see the underlying resources.

The Sankey overlay highlights services with reclaimable spend — typically the long tail (NAT GW, CloudWatch, idle Lambda concurrency) shows up as red-striped flows when recommendations exist.

---

## Related lessons

- [L2 — GCP cost surface](L2_gcp_cost_surface.md) *(next)*
- [L3 — Azure cost surface](L3_azure_cost_surface.md)
- [T2.M2.1 — The 460-rule library](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md)

## Glossary terms touched

[EC2-Other](../../../reference/glossary/ec2-other.md) · [NAT Gateway](../../../reference/glossary/nat-gateway.md) · [LCU](../../../reference/glossary/lcu.md) · [Provisioned IOPS](../../../reference/glossary/provisioned-iops.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.5.L1
