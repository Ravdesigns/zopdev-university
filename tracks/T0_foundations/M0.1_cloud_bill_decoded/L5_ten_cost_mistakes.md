# The ten cost mistakes that show up on every bill

§ T0 · M0.1 · L5 of 5 · Operator tier · 11 min

---

## Outcome

By the end of this lesson, you will be able to **spot** the ten most common cost mistakes in any cloud estate, **and estimate** the savings each one represents.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Where is the easy money hiding in my bill right now?" |
| **Personas** | All five |
| **Prerequisites** | [L1](L1_what_is_in_a_cloud_bill.md), [L2](L2_pick_your_billing_source.md), [L4](L4_tags_and_attribution.md) |
| **Time** | 11 minutes |
| **Bloom verb** | Spot (Analyze) |

---

## 1. Concept

These ten mistakes appear in every cloud bill, in every organization, across every provider. They survive multiple FinOps initiatives. They survive cost reviews. They survive renewals. They are the bedrock of cloud waste because each one feels small and individually defensible. In aggregate they account for 30 to 60 percent of avoidable spend.

```
#   MISTAKE                              TYPICAL SAVINGS RANGE
────────────────────────────────────────────────────────────────────
 1  Idle compute (non-prod left running) 30–60% of non-prod spend
 2  Orphan storage (detached volumes)    2–8% of storage spend
 3  Forgotten snapshots                  3–10% of storage spend
 4  Always-on NAT Gateways               $30–$200 per gateway/month
 5  Unused Elastic IPs                   $3.60 each per month (AWS)
 6  Dev running as prod (oversized)      20–40% of dev compute
 7  Over-provisioned RDS                 20–35% of DB compute
 8  Cross-AZ chatter (GCP)               2–10% of network spend
 9  Public-internet egress for internal  3–15% of network spend
10  Over-retained logs and metrics       5–20% of observability spend
```

### #1 Idle compute (non-prod left running)

Dev, test, and staging environments running 168 hours a week instead of the 50–60 hours a week anyone actually uses them. The math: stopping non-prod outside business hours and weekends recovers ~70% of those hours. (Full math in [M0.3 L1](../M0.3_scheduling_vs_commitments/L1_168_hour_math.md).) Detection: any non-prod resource with low CPU and a steady running schedule. Fix: schedule it off.

### #2 Orphan storage (detached EBS / disks)

EC2 instance terminates, attached EBS volume is configured *not* to delete on termination, volume keeps billing. The volume is unattached, has no workload, and continues at full storage rate. Detection: storage in `available` (AWS) / `unattached` (Azure) status with no recent activity. Fix: snapshot if data matters, then delete the volume.

### #3 Forgotten snapshots

Every snapshot keeps billing forever until explicitly deleted. Lifecycle policies were never set. Result: snapshots of volumes that no longer exist, of databases that were decommissioned years ago, of test data that nobody owns. Detection: snapshots older than 90 days with no associated resource and no tag indicating retention policy. Fix: set lifecycle policy, delete the eligible backlog.

### #4 Always-on NAT Gateways

NAT Gateway on AWS is $0.045 per hour ($32.40 per month per gateway) plus $0.045 per GB data processed. Dev VPCs with one NAT per AZ across three AZs run $97 per month before any traffic flows. Many estates have NAT Gateways provisioned by Terraform modules that never get cleaned up. Detection: NAT Gateways in non-production VPCs with low data-processing volume. Fix: consolidate to single-AZ in non-prod, or replace with NAT Instance / VPC endpoint for specific traffic.

### #5 Unused Elastic IPs

AWS charges $0.005 per hour ($3.60 per month) for any Elastic IP that is not attached to a running instance. The fee exists to discourage IP hoarding. Detection: EIPs in `Unassociated` state. Fix: release them.

### #6 Dev running as prod (oversized)

Dev EC2 instances created at `m5.2xlarge` because somebody copied a Terraform module from prod. The dev workload runs at 2 percent CPU. Detection: non-prod instances with CPU consistently under 10 percent. Fix: drop a size or two. (See [T2.M2.1 lesson 1](../../T2_zopnight_engineer/M2.1_rule_library/L1_eight_categories.md) and rule RC-006.)

### #7 Over-provisioned RDS

The hardest one to fix because it requires confidence in the workload's headroom. RDS instances provisioned for a peak that never comes, multi-AZ enabled in dev, IOPS provisioned higher than throughput requires. Detection: low CPU, low connections, low IOPS. Fix: downsize during a maintenance window. (Database changes never auto-remediated — see [the database denylist](../../T2_zopnight_engineer/M2.3_auto_remediation/L5_database_denylist.md).)

### #8 Cross-AZ chatter (GCP)

On GCP, traffic between zones in the same region is charged ($0.01 per GB ingress + $0.01 per GB egress). On AWS, this is free. Result: a GCP K8s cluster that wasn't pinned to one zone can rack up significant network charges. Detection: GCP inter-zone egress consistently high. Fix: pin workloads to a single zone or use regional persistent disks.

### #9 Public-internet egress for internal traffic

The most embarrassing one. Internal services calling each other through public DNS / public IPs instead of through VPC endpoints or private DNS. Egress to public internet is charged ($0.09 per GB on AWS). Detection: large `DataTransfer-Out-Bytes` to addresses that resolve to your own IP ranges. Fix: route through VPC endpoints, private link, or internal load balancers.

### #10 Over-retained logs and metrics

CloudWatch metric storage at 10 cents per metric per month, log ingestion at 50 cents per GB, log storage at 3 cents per GB-month. Default retention is "Never expire." A team that emits a custom metric per pod per minute, with 200 pods, costs $720 per month *forever*. Detection: log groups and metric namespaces with no retention policy and large monthly delta. Fix: set retention, prune what's not needed.

---

## 2. Demo

A real (anonymized) sample audit, one mid-size SaaS estate, $180,000 monthly AWS spend:

```
MISTAKE                              FOUND     MONTHLY WASTE     % OF BILL
──────────────────────────────────────────────────────────────────────────
 1 Idle compute (non-prod)           47 inst   $18,400           10.2%
 2 Orphan EBS volumes                12 vols   $   430            0.2%
 3 Forgotten snapshots             1,247 snap  $ 1,180            0.7%
 4 Always-on NAT Gateways            6 GWs     $   194            0.1%
 5 Unused Elastic IPs                23 EIPs   $    83            0.0%
 6 Oversized dev compute             31 inst   $ 4,100            2.3%
 7 Over-provisioned RDS              4 DBs     $ 2,800            1.6%
 8 Cross-AZ chatter (n/a here, AWS)  -         -                  -
 9 Public-internet for internal      1 service $   970            0.5%
10 Over-retained logs/metrics        -         $ 1,840            1.0%
──────────────────────────────────────────────────────────────────────────
TOTAL avoidable                                $29,997           16.7%
```

Three observations from this real audit: (a) idle compute is the single biggest line, (b) the long tail of small items together rivals it, (c) every category is present in some volume. The estate is not pathological. It is normal.

---

## 3. Hands-on (10 min)

For your own estate, score each of the ten mistakes. Use this checklist:

```
[ ]  1. Idle compute       — any non-prod instance running 24/7?
[ ]  2. Orphan storage     — any EBS / disk in unattached state?
[ ]  3. Forgotten snapshots — any snapshot >90d with no policy?
[ ]  4. Always-on NAT GWs  — any non-prod VPC with NAT in every AZ?
[ ]  5. Unused EIPs        — any EIP in Unassociated state?
[ ]  6. Oversized dev      — any non-prod instance with <10% CPU?
[ ]  7. Over-provisioned RDS — any RDS with <30% CPU and steady connections?
[ ]  8. Cross-AZ chatter   — GCP only: inter-zone egress >5% of network?
[ ]  9. Public-internet egress — any internal service via public DNS?
[ ] 10. Over-retained logs  — any log group with "Never expire"?
```

For each "yes," write down the resource count and an estimate of monthly waste. Add the total. Compare to your monthly cloud bill. The ratio is your **avoidable spend percentage**. Healthy estates land at 5 percent. Untended estates land at 25 to 40 percent.

---

## 4. Knowledge check

### Q1
Of the ten mistakes, which one typically returns the largest absolute dollar savings in a mid-size estate?

A. Unused Elastic IPs
B. Idle compute (non-prod left running)
C. Over-retained logs
D. Public-internet egress for internal traffic

<details>
<summary>Show answer</summary>

**Correct: B.** Idle non-prod compute is consistently the largest single line, often 10–15% of total bill. Unused EIPs are individually trivial ($3.60 each). Logs and egress are real but typically smaller in absolute terms.
</details>

### Q2
A team finds 1,247 forgotten snapshots, $1,180 per month. They argue: "It's less than 1% of the bill, leave it." Best response:

A. Agree, deprioritize
B. Note that the snapshot pile grows over time. Setting a lifecycle policy is one-time work that prevents the cost from compounding. The action is policy-as-code, not policy-as-promise.
C. Delete all snapshots immediately
D. Buy bigger storage

<details>
<summary>Show answer</summary>

**Correct: B.** The savings number is real but small. The structural fix (lifecycle policy) costs almost nothing once and prevents the pile from doubling next year.
</details>

### Q3
A FinOps team reports avoidable spend at 28% of bill. The CTO pushes back: "That's impossible." Most defensible response:

A. The team is wrong
B. 28% is on the high end of normal for untended estates. The fix is iterative — pick the top three mistakes by absolute dollar value and remediate those first. Re-baseline in 30 days.
C. Buy a more expensive tool
D. Outsource cloud management

<details>
<summary>Show answer</summary>

**Correct: B.** 28% is on the high end but plausible. The right move is sequenced remediation, not all-at-once. Most estates can close half the gap in 60 days with focused effort.
</details>

---

## 5. Apply

ZopNight pre-computes all ten mistakes as a subset of its 460 audit rules. The Recommendations page filters expose each one:

- **Idle compute** → `category=idle, status=open`
- **Orphan storage** → `category=orphan, resource_type=ebs-volume / disk`
- **Forgotten snapshots** → `category=orphan, resource_type=snapshot`
- **Always-on NAT** → `category=idle, resource_type=nat-gateway`
- **Unused EIPs** → `category=orphan, resource_type=elastic-ip`
- **Oversized dev** → `category=rightsizing, severity=high`
- **Over-provisioned RDS** → `category=rightsizing, resource_type=rds`
- **Over-retained logs** → `category=compliance, resource_type=log-group`

The summary card on the Recommendations page shows **Total Open Recommendations** and **Potential Monthly Savings** so the audit is one click away.

[Open ZopNight Recommendations](https://app.zopnight.com/recommendations) *(deep link)*

---

## Module quiz

You have now completed all five lessons of M0.1. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m0.1-quiz](../../../certifications/operator/m0.1-quiz.md). Pass it to earn the **Bill-Reader** chip and unlock M0.2.

---

## Related lessons

- [T0.M0.3 — Why scheduling beats commitments at non-prod scale](../M0.3_scheduling_vs_commitments/00_README.md) *(next module)*
- [T2.M2.1 — The 460-rule library, explained](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md)
- [T5.M5.2 — Schedule design patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Avoidable spend](../../../reference/glossary/avoidable-spend.md) · [Lifecycle policy](../../../reference/glossary/lifecycle-policy.md) · [NAT Gateway](../../../reference/glossary/nat-gateway.md) · [Elastic IP](../../../reference/glossary/elastic-ip.md) · [Cross-AZ traffic](../../../reference/glossary/cross-az-traffic.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.1.L5
