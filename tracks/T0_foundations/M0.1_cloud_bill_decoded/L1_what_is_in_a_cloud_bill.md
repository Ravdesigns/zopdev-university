# What's actually in a cloud bill

§ T0 · M0.1 · L1 of 5 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** the four line-item categories on any AWS, GCP, or Azure invoice **and trace any dollar back to the resource and the usage event that caused it.**

---

| | |
|---|---|
| **Tier** | Operator (L100 equivalent) |
| **JTBD** | "Explain my cloud bill to a non-engineer in five minutes." |
| **Personas** | Platform Engineer · FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | None |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember + Understand) |

---

## 1. Concept

A cloud bill looks chaotic. A single mid-size organization will produce hundreds of thousands of line items per month. The Cost and Usage Report (CUR) for one AWS account can hit 10 GB. The instinct is to scroll, lose hope, and trust a dashboard.

The instinct is wrong. **Every dollar on every cloud bill sits in one of four categories.** Once you can name the four, you can read any bill in any provider. That is the entire skill.

### The four categories

**1. Compute time.** Hours that a thing was running. EC2 instances, Compute Engine VMs, Azure VMs, ECS tasks, EKS / GKE / AKS nodes, Lambda invocations, Cloud Functions, Container Instances. Charged at an hourly rate that depends on shape (CPU, memory, GPU, network), region, operating system, and purchase commitment (on-demand, reserved, savings plan, sustained-use, spot).

**2. Stored bytes.** Gigabytes sitting somewhere. S3 / GCS / Blob Storage objects. EBS / Persistent Disks / Managed Disks. RDS / Cloud SQL / Azure SQL allocated storage. Snapshots. Archive tiers. Backup vaults. Charged per GB per month, with rate variants by access tier (Standard, Infrequent, Glacier, Coldline, Archive Storage).

**3. Moved bytes.** Network egress. Cross-region replication. Cross-availability-zone traffic. Public internet egress. NAT Gateway data-processing fees. CloudFront / Cloud CDN / Front Door delivery. Inter-zone traffic within the same region is usually free on AWS but charged on GCP. Egress to the public internet is the priciest of all and is the line item that most often surprises a Finance team.

**4. API requests.** Per-call charges on services that bill by request volume rather than running time. Lambda invocations (separate from Lambda compute), S3 GET / PUT / LIST, DynamoDB Read / Write Capacity Units, Cosmos DB Request Units, SQS messages, EventBridge events, CloudWatch metric ingestion, NAT Gateway data-processing per GB.

### The four categories as a single picture

```
┌─────────────────────────────────────────────────────────┐
│  YOUR CLOUD BILL — 4 line item categories               │
├──────────────────┬──────────────────────────────────────┤
│  COMPUTE TIME    │  EC2 / GCE / Azure VMs               │
│  ~40–60% typical │  K8s nodes · ECS · Lambda            │
│                  │  Cloud Functions · Container Inst.   │
├──────────────────┼──────────────────────────────────────┤
│  STORED BYTES    │  S3 / GCS / Blob Storage             │
│  ~15–30% typical │  EBS / PD / Managed Disks            │
│                  │  RDS storage · snapshots · archives  │
├──────────────────┼──────────────────────────────────────┤
│  MOVED BYTES     │  inter-region replication            │
│  ~5–20% typical  │  internet egress · NAT GW data-proc  │
│                  │  cross-AZ traffic (GCP) · CDN        │
├──────────────────┼──────────────────────────────────────┤
│  API REQUESTS    │  Lambda invocations · S3 GET / PUT   │
│  ~5–15% typical  │  DynamoDB RCU / WCU · Cosmos RUs     │
│                  │  CloudWatch ingestion · queue ops    │
└──────────────────┴──────────────────────────────────────┘
```

The percentages vary widely by workload. A K8s-heavy estate skews 60% on compute. An analytics pipeline with raw and processed datasets can hit 35% on stored bytes. A SaaS serving global users from one region can hit 25% on moved bytes. A serverless-first product can put 30% in API requests.

### What a bill row is NOT

A bill row is **not** the same as a "resource." A single EC2 instance generates compute rows (EC2-Instance), storage rows (EBS:VolumeUsage.gp3, EBS:SnapshotUsage), network rows (DataTransfer-Out-Bytes, DataTransfer-Regional-Bytes), and observability rows (CloudWatch:MetricStorage, CloudWatch:Requests). Five or six rows, one instance.

This is why the question "how much does this instance cost?" almost always has a wrong answer when somebody quotes the EC2 hourly rate times 720. The EC2 rate covers only the first category. The other three are real and add 25 to 60 percent on top for a typical production instance.

### Rack rate vs. what you actually paid

Every row carries a unit price drawn from the provider's public rate card. That public price is the **rack rate.** Your actual paid price can be lower than rack rate because of reserved instances, savings plans, sustained-use discounts, spot pricing, enterprise discount programs, or Azure Hybrid Benefit. The difference between rack rate and what you paid is your **effective discount.**

Knowing both numbers is the first FinOps superpower. Most tools show you only the actual paid amount. That makes the bill look smaller than it would be if every resource were charged at list, which is what hides waste. A scheduled-off non-prod instance that was running at on-demand rates was costing rack rate; killing it saves rack rate. The savings number to claim is rack rate, not the discounted amount.

---

## 2. Demo

Open AWS Cost Explorer (or the equivalent: GCP Cloud Console → Billing → Reports, Azure Portal → Cost Management → Cost Analysis). Filter to a single resource you know — pick an EC2 instance, a Compute Engine VM, or an Azure VM that has been running for the whole month.

Group by **Usage Type.** You will see somewhere between four and eight rows. Read each row name. Annotate it mentally with one of the four categories.

Example output for one m5.large in us-east-1:

| Usage Type | Amount | Category |
|---|---|---|
| `BoxUsage:m5.large` | $69.20 | Compute time |
| `EBS:VolumeUsage.gp3` | $8.40 | Stored bytes |
| `EBS:SnapshotUsage` | $4.10 | Stored bytes |
| `DataTransfer-Out-Bytes` | $14.30 | Moved bytes |
| `CW:MetricStorage` | $0.90 | API requests / observability |

Total: **$96.90**. The naive "instance cost" — the BoxUsage row alone — is $69.20, or **71% of the real number.**

(Annotated screenshot: production team to capture this exact view with orange callouts on each row tagging the category. Asset path: `assets/screenshots/M0.1_L1_cost_explorer_one_instance.png`.)

---

## 3. Hands-on (5 min — uses your bill, not ZopNight)

1. Open last month's cloud bill (any provider).
2. Pick one resource you recognize and know is running for the full month.
3. List every row that belongs to that resource. Use the resource ID / ARN as the filter or grep target.
4. Sort them into the four categories. Write the four numbers down. Add them.
5. Compare the total to your mental estimate of "the cost of that resource."

If the difference is more than 25%, the gap is what was hidden from you. Note which category surprised you. That category is where to look first when you optimize this estate.

You can do this with curl + the AWS CLI:

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-05-01 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=USAGE_TYPE \
  --filter '{"Dimensions":{"Key":"RESOURCE_ID","Values":["i-0abc123def456"]}}'
```

Or in the AWS Console: Cost Explorer → Reports → New report → Group by Usage Type → Filter by Resource = `<your instance ID>`.

---

## 4. Knowledge check

### Q1
Your m5.large EC2 instance shows **$122 in EC2 charges last month.** What is the most accurate estimate of what that instance actually costs your business?

A. Exactly $122
B. Less than $122 — you have an RI
C. Likely 25 to 60 percent higher than $122, because EBS, snapshots, network, and CloudWatch also charge against this instance
D. Impossible to determine without more data

<details>
<summary>Show answer</summary>

**Correct: C.** A single instance generates four to six bill rows. The EC2 charge covers compute time only. EBS storage, snapshot storage, data transfer, and CloudWatch metric / log storage charge separately. The true cost is the sum of all rows tied to that resource, and it sits 25 to 60 percent above the EC2-row figure on most production instances.

A is wrong — almost no instance costs only the EC2 row.
B may be true but isn't what the question asked. RIs change *what you paid*, not *what the instance costs your business*.
D is too cautious. You can determine it; you just need to look at all four categories.
</details>

### Q2
A workload's bill is 25% "Moved bytes." Which is most likely true?

A. The estate uses spot instances
B. The estate is K8s-heavy
C. The estate has cross-region replication, global users served from one region, or NAT-Gateway-routed egress
D. The estate uses serverless

<details>
<summary>Show answer</summary>

**Correct: C.** None of A, B, or D directly drives network egress. Compute purchase type (spot, RI, savings plan) controls the compute-time row, not the moved-bytes row. K8s skews compute, not network — unless the cluster spans zones in GCP (where inter-AZ is charged). Serverless can skew toward API requests but not moved bytes. The three drivers of high moved-bytes bills are inter-region replication, internet egress to global users, and NAT Gateway data-processing.
</details>

### Q3
You hear: "Killing this idle EC2 will save the company $69 a month." What's the safest, most accurate response?

A. "Great, kill it."
B. "Not enough — also kill the attached EBS volume, the snapshots, and the CloudWatch alarms. The actual savings is likely $90 to $110."
C. "It won't save anything because we have a reserved instance covering it."
D. "We can't kill it; production depends on it."

<details>
<summary>Show answer</summary>

**Correct: B.** Killing only the compute row leaves stored bytes (EBS volume + snapshots) and observability (CloudWatch) still billing. The right move is to release everything attached to that instance, which gets you the true category-1-plus-2-plus-4 savings — typically 25 to 60 percent more than the EC2 charge alone.

C is a separate question (RIs don't auto-cancel when the instance terminates; they keep billing until expiry).
D is a workload question, not a cost question.
</details>

---

## 5. Apply

When your cloud account is connected to ZopNight, the four categories are visible at every level:

- **Reports → Cost Breakdown** splits any single resource across the four categories with the dollar amount per row.
- **Reports → Cost Breakdown → Flow** (the Sankey view) cascades from Provider → Account → Service → Type, so you can see the four categories per dimension and drill in.
- **Reports → Resources** lists every resource with its cumulative lifetime cost across all four categories — the number that matters when you're deciding whether to keep a resource alive.

The **Idle EC2** rule (`RC-001`) computes savings using the **full** cost — compute plus storage plus snapshot — not just the EC2 row. The savings amount you see on the recommendation card is the number Finance can defend.

[Open ZopNight Reports →](https://app.zopnight.com/reports/costs) *(deep link will resolve once you're logged in)*

---

## Related lessons

- [L2 — CUR, Cost Explorer, Cost Management, BigQuery — pick one](L2_pick_your_billing_source.md) *(next)*
- [T0.M0.4.L1 — What "rack rate" actually means](../M0.4_rack_rate_vs_billing/L1_rack_rate.md)
- [T0.M0.5.L1 — AWS cost surface: services that print money](../M0.5_multi_cloud_taxonomy/L1_aws_cost_surface.md)
- [T2.M2.1.L5 — Reading a recommendation card](../../T2_zopnight_engineer/M2.1_rule_library/L5_reading_a_rec_card.md)

## Rule references

- [`RC-001` Idle EC2 Instance](../../../reference/rules/RC-001.md) — uses the full-cost rollup, not just the EC2 row
- [`RC-002` Orphaned EBS Volume](../../../reference/rules/RC-002.md) — catches stored bytes that survive after compute is gone

## Glossary terms touched

[Rack rate](../../../reference/glossary/rack-rate.md) · [Effective discount](../../../reference/glossary/effective-discount.md) · [Egress](../../../reference/glossary/egress.md) · [NAT Gateway](../../../reference/glossary/nat-gateway.md) · [Snapshot](../../../reference/glossary/snapshot.md) · [gp3](../../../reference/glossary/gp3.md) · [API request charge](../../../reference/glossary/api-request-charge.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-19 · Lesson ID: T0.M0.1.L1
