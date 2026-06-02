# Recommendation Rule Catalog

460 rules across AWS (201), GCP (112), Azure (147).

## Categories

| Category | Count | Description |
|---|---|---|
| idle | ~110 | Running but unused |
| rightsizing | ~120 | Over-provisioned |
| schedule | 6 | Carved scheduling candidates |
| orphan | ~60 | Detached resources |
| compliance | ~50 | Best-practice gaps |
| discount | ~20 | Commitment opportunities |
| security (K8s) | ~60 | K8s security signals |
| reliability (K8s) | ~30 | K8s reliability signals |
| governance | ~10 | Tag/label hygiene |
| autoscaler | 6 | Autoscaler-specific (RC-ASC-001..006) |
| bedrock | 10 | RC-1601..1610 |

## Rule numbering

```
RC-001 to RC-999         General cloud rules (AWS / GCP / Azure)
RC-ASC-001 to RC-ASC-006  Autoscaler rules
RC-1601 to RC-1610        Bedrock + ML cost rules
RC-1700s                  K8s EKS workload rules
RC-1800s                  K8s GKE workload rules
RC-1900s                  K8s AKS workload rules
```

## Top 20 rules by typical savings impact

| Rule | Name | Category | Typical savings |
|---|---|---|---|
| RC-001 | Idle EC2 Instance | idle | $50-500/mo per resource |
| RC-002 | Orphaned EBS Volume | orphan | $5-50/mo per resource |
| RC-003 | Underutilized EC2 | rightsizing | $30-300/mo per resource |
| RC-004 | EC2 Rightsizing | rightsizing | $30-500/mo per resource |
| RC-006 | Oversized EC2 | rightsizing | $40-800/mo per resource |
| RC-010 | Idle Lambda | idle | $5-50/mo per resource |
| RC-088 | Spot Opportunity | discount | $40-800/mo per resource |
| RC-110 | Schedule Candidate | schedule | $20-300/mo per resource |
| RC-202 | Idle RDS | idle | $80-1,500/mo per resource |
| RC-303 | Pause App Runner | idle | $40-400/mo per resource |
| RC-401 | Pause Databricks Cluster | idle | $200-3,000/mo per resource |
| RC-1601 | Idle Bedrock Throughput | idle | $100-2,000/mo per resource |
| RC-1603 | Bedrock Model Selection | rightsizing | $500-10,000/mo per workload |
| RC-1701 | Idle EKS Deployment | idle (K8s) | $50-500/mo per resource |
| RC-1702 | Suspend EKS CronJob | idle (K8s) | $5-50/mo per resource |
| RC-1801 | Idle GKE Deployment | idle (K8s) | $50-500/mo per resource |
| RC-1901 | Idle AKS Deployment | idle (K8s) | $50-500/mo per resource |
| RC-ASC-001 | ASG has no scaling policy | autoscaler | $50-500/mo per ASG |
| RC-ASC-004 | Scaling target too high | autoscaler | $20-200/mo per policy |
| RC-ASC-006 | Cooldown too short | autoscaler | $5-50/mo per policy |

## Per-rule reference

Each rule has its own detail page at `rules/RC-XXX.md` (or RC-ASC-XXX, RC-1701, etc.).

Format: Rule ID, name, provider, resource type, severity, category, evidence, remediation, console URL.

For the canonical implementation, see backend repo `recommender/internal/rules/`.

---

§ Last reviewed 2026-05-20
