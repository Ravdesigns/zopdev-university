# Worked Examples

Standalone cost calculations + real-world case studies. Each example is reproducible — you can apply the same math to your own data.

## Examples

| # | Example | Purpose |
|---|---|---|
| WE-01 | EC2 idle savings on a 30-day-stopped instance | Calculate orphan EBS + snapshot cost |
| WE-02 | ASG smart-default from Welford P95 | Show the math behind smart defaults |
| WE-03 | K8s Deployment with requests/limits/HPA | End-to-end pod cost calculation |
| WE-04 | Azure amortized cost on 3-yr RI for D8s_v3 | Show the trap of ActualCost |
| WE-05 | Cost-per-MAU for SaaS workload | Unit economics walkthrough |
| WE-06 | Multi-AZ RDS upgrade cost-vs-risk | Reliability investment math |
| WE-07 | Spot vs RI break-even | When does each lever win |
| WE-08 | Tag-attribution arithmetic for shared services | Cost split methodology |
| WE-09 | Forecasting accuracy on real quarterly data | Forecast variance analysis |
| WE-10 | Cost-per-1K-API-requests | Per-request economics |
| WE-11 | Effective discount under realistic utilization | RI / SP math |
| WE-12 | Currency conversion (GBP→USD, INR→USD) | Date-specific FX |
| WE-13 | Anomaly z-score calculation | Statistical detection |
| WE-14 | Budget threshold escalation arithmetic | Threshold math |
| WE-15 | Tag coverage trend (90 days) | Tag coverage analysis |
| WE-16 | ECS Application Auto Scaling target tracking math | ECS autoscaling design |
| WE-17 | GCP MIG cooldown trade-off | Cooldown tuning |
| WE-18 | Azure VMSS metric trigger arithmetic | Azure autoscaling specifics |
| WE-19 | CronJob suspension cost impact | K8s scheduling math |
| WE-20 | Storage class downgrade savings (gp2→gp3) | EBS optimization |
| WE-21 | NAT GW data-processing cost | Hidden network costs |
| WE-22 | GCS standard→nearline savings | Storage class transitions |
| WE-23 | S3 lifecycle transition arithmetic | Storage lifecycle |
| WE-24 | Reserved vs Spot break-even | Commitment vs interruption |
| WE-25 | MCP cost per-query | Cost of AI-assisted operations |

Each example is at `worked_examples/WE-XX_name.md`.

---

§ Last reviewed 2026-05-20
