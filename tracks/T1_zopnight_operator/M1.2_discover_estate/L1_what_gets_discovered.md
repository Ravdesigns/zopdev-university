# What gets discovered (380+ types) and how

§ T1 · M1.2 · L1 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **predict** whether a given cloud resource type appears in ZopNight's discovery surface **and explain** the three discovery methods (RE2, Asset Inventory, Resource Graph).

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Confirm a resource I just deployed shows up — and know what to do if it doesn't." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M1.1 |
| **Time** | 10 minutes |
| **Bloom verb** | Predict (Apply) and Explain (Understand) |

---

## 1. Concept

ZopNight discovers **380+ resource types** across AWS, GCP, and Azure. The discovery uses each provider's canonical inventory API plus per-service providers for detailed metadata.

```
PROVIDER        DISCOVERY METHOD                       TYPES DISCOVERED
─────────────────────────────────────────────────────────────────────────
AWS             Resource Explorer 2 (RE2) primary       191 unique types
                + per-service providers for detail       (204 RE2 keys)
GCP             Cloud Asset Inventory                    88 types
Azure           Resource Graph (with expanded query)    101 types
```

Total: about 380 distinct resource types covered.

### How AWS discovery works

**Resource Explorer 2** (RE2) is AWS's canonical multi-region, multi-service inventory API. A single `Search` call returns resources across services in one response. ZopNight uses RE2 as the primary discovery source:

```
Discoverer calls RE2:
  Search(query="*", regions=["us-east-1","us-west-2","eu-west-1",...])

Returns: 12,400 resources across 47 service types

For each resource, the discoverer then calls the per-service API for
detailed metadata (instance type, tags, IOPS, Multi-AZ, status):
  ec2.DescribeInstances(InstanceIds=[...])
  rds.DescribeDBInstances(DBInstanceIdentifier=...)
  ...
```

Why both RE2 and per-service: RE2 gives breadth and consistency, per-service gives depth. Some metadata (specific tag values, instance config) is not available via RE2 alone.

**Resource Explorer 2 must be enabled** in the customer's account for full discovery. If RE2 is disabled, ZopNight falls back to per-service-only discovery, which is slower but functional.

### How GCP discovery works

**Cloud Asset Inventory** is GCP's equivalent of RE2. ZopNight calls Asset Inventory with `ContentType_RESOURCE` to enumerate the estate:

```
Discoverer calls Cloud Asset Inventory:
  ListAssets(parent="organizations/{orgId}", contentType=RESOURCE)

Returns ~8,000 assets across 88 types.

GCP has built-in filtering for "noise" — some asset types are not
inventory-worthy (e.g., transient IAM policies). ZopNight filters
these via shouldSkipGCPAsset() in the discoverer.
```

**Region persistence:** GCP resources can be regional or zonal. ZopNight extracts the region from the asset's resource path and stores it consistently.

**Special handling for some services:**

- **GCS buckets** are enriched with size + object count via Cloud Monitoring metrics
- **Artifact Registry** repositories are enriched with image count + total size

### How Azure discovery works

**Azure Resource Graph** is Azure's canonical inventory query API. ZopNight runs an expanded query that covers 101 resource types in one request:

```
Discoverer queries Resource Graph:
  query = "Resources | where type in (...101 type list...)
                       | project id, name, type, location, tags, properties"

Returns ~6,000 resources across the 101 types.
```

**Databricks** is special-cased. ZopNight discovers Databricks workspaces via Resource Graph, then dives into each workspace to enumerate clusters, instance pools, and SQL warehouses as **children of the workspace** (covered in [L2](L2_parent_child.md)).

### The 380+ list

The full inventory of supported types is long. Here is the shape of coverage:

```
CATEGORY                   AWS                GCP                AZURE
─────────────────────────────────────────────────────────────────────────────
Compute                    EC2, ECS, ASG,     Compute Engine,    VM, VMSS, AKS
                           Fargate, App Run.  GKE                 nodepool
K8s control plane          EKS                GKE                AKS
K8s workload children      Deploy, STS, Cron  Deploy, STS, Cron  (same)
Serverless                 Lambda             Cloud Functions    Functions
                                              Cloud Run
Database                   RDS, Aurora,        Cloud SQL,         Azure SQL,
                           DynamoDB, DocDB,    Spanner,           Cosmos DB,
                           ElastiCache,        Memorystore        MySQL Flex,
                           Redshift, Keyspaces                    PostgreSQL Flex
Storage (object)           S3                  GCS                Blob Storage
Storage (block)            EBS                 Persistent Disk    Managed Disks
Storage (file)             EFS                 Filestore          Azure Files
Container registry         ECR                 Artifact Registry  ACR
Networking                 VPC, NAT, ELB,      VPC, Cloud LB,     VNet, App GW,
                           ALB, NLB,           Cloud NAT          Load Balancer
                           CloudFront                              Front Door
Data & Analytics           EMR, EMR Serverless GKE for analytics  Synapse,
                           Glue, Athena                            Data Explorer,
                                                                   Databricks
ML / AI                    SageMaker,          Vertex AI          Azure ML
                           Bedrock
Messaging                  SQS, SNS, EventBridge Pub/Sub          Service Bus,
                                                                   Event Grid
─────────────────────────────────────────────────────────────────────────────
```

If a resource type is missing from the list, ZopNight's resource list won't show it. Adding new types is a matter of extending the discoverer — not a customer-side configuration.

### What is NOT discovered

A few deliberate exclusions:

- **IAM principals** (users, roles, groups) — these are inventoried separately for the ownership-detection feature (T3.M3.4), not in the resource list
- **Secrets and certificates** — security artifacts, not cost-relevant
- **Billing records themselves** — flow through the billing sync, not the discoverer
- **Logs and events** — flow through the activity-log sync, not the discoverer

A team running niche services not in the 380+ list (Oracle Cloud, IBM Cloud, Alibaba) is out of scope for ZopNight discovery. The roadmap may add specific services on demand.

### Update cadence

```
DISCOVERY CRON             Every 6 hours
MANUAL REFRESH              On-demand (covered in L5)
METADATA ENRICHMENT         During the same discovery run
PER-SERVICE DETAIL          Triggered for new or updated resources
```

New resources appear in ZopNight within 6 hours of creation in the cloud. The Manual refresh trigger collapses this to ~2–3 minutes.

---

## 2. Demo

A typical discovery run for a mid-size AWS account:

```
T+0       Discovery cron fires for account 941614911918
T+1 min   RE2 search returns 8,247 resources across 31 type categories
T+2 min   Per-service enrichment begins (parallel calls)
T+3 min   EC2 details: 1,840 instances enriched
T+3 min   RDS details: 47 databases enriched
T+4 min   S3 buckets: 142 buckets, size + object count from CloudWatch
T+5 min   EKS clusters: 6 clusters, each with nodegroups + Deployments enumerated
T+6 min   Permission Visibility drawer updated with Granted/Denied state
T+6 min   Recommendation engine fires for new findings
T+6 min   UI refreshes
```

Six minutes from sync start to UI updated. The customer sees the new estate state without manual intervention.

(Asset: `assets/diagrams/M1.2_L1_discovery_timeline.svg`.)

---

## 3. Hands-on (6 min)

For one of your connected accounts:

```
1. Open ZopNight → Resources.
2. Note the total resource count in the header.
3. Filter by Provider = AWS (or GCP, or Azure).
4. Count visible types (or count via the Grouped Type dropdown — covered L3).
5. Compare against your cloud's expected resource type spread.

If a resource type you know is in the cloud is NOT in the list:
  a. Check the Permission Visibility drawer (M1.1 L4) for any
     Denied state on that resource type.
  b. If Permission is Granted but the resource isn't shown,
     wait for the next 6h cron OR click Manual refresh.
  c. If still missing, the type may be outside ZopNight's 380+
     supported types. Check the documentation; submit a roadmap
     request if it's a frequent type.
```

---

## 4. Knowledge check

### Q1
A new EC2 instance was launched 15 minutes ago. The ZopNight resource list does not show it yet. The most likely cause:

A. ZopNight is broken
B. The 6-hour discovery cron has not run since the launch. Click Manual refresh to discover within 2–3 minutes, or wait for the next scheduled cron.
C. The instance is in the wrong region
D. Permission is denied

<details>
<summary>Show answer</summary>

**Correct: B.** Six-hour cron is the default. Manual refresh is the immediate path.
</details>

### Q2
A team uses AWS Resource Explorer 2 disabled (the customer hasn't enabled it). What happens to ZopNight discovery?

A. Discovery fails completely
B. Discovery falls back to per-service-only calls. Slower (more API calls, longer time), but functional. ZopNight recommends enabling RE2 in the customer's account for full performance.
C. ZopNight cannot connect the account
D. Only EC2 is discovered

<details>
<summary>Show answer</summary>

**Correct: B.** RE2 is the primary path; per-service is the fallback. Both work; RE2 is faster and more consistent across services.
</details>

### Q3
Which of these resource types are NOT discovered by ZopNight?

A. EC2, RDS, S3
B. Lambda, EKS, ECS
C. IAM users, secrets, certificates — these are out of scope for the resource list (IAM users flow through ownership detection, secrets and certificates are security artifacts not cost-relevant)
D. Compute Engine, GKE, Cloud SQL

<details>
<summary>Show answer</summary>

**Correct: C.** Exclusions are deliberate. ZopNight focuses on cost-relevant resources; security artifacts and identity principals are handled by other surfaces.
</details>

---

## 5. Apply

The Resources page is the primary discovery surface:

- **[Resources page](https://app.zopnight.com/resources)** — the canonical view
- **Manual Refresh** in the header — triggers an immediate discovery cycle
- **Discovery Status** indicator — shows when a sync is in progress
- **Permission Visibility** (per account) — shows what is being scanned and what is not

For deeper drill-down (parent-child, filters, bulk actions), continue to L2 and L3.

---

## Related lessons

- [L2 — Parent-child hierarchies](L2_parent_child.md) *(next)*
- [L3 — Grouped account + grouped type filters](L3_grouped_filters.md)
- [M1.1 L4 — Permission Visibility](../M1.1_connect_account/L4_permission_visibility.md)

## Glossary terms touched

[Resource Explorer 2](../../../reference/glossary/resource-explorer-2.md) · [Cloud Asset Inventory](../../../reference/glossary/cloud-asset-inventory.md) · [Resource Graph](../../../reference/glossary/resource-graph.md) · [Discovery cron](../../../reference/glossary/discovery-cron.md) · [Metadata enrichment](../../../reference/glossary/metadata-enrichment.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.2.L1
