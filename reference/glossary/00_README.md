# Glossary

A-Z of FinOps and ZopNight terms. ~120 terms.

## A
- **Adopt-or-replace** — Pattern where ZopNight detects existing cloud scaling and asks the user whether to adopt (observe) or replace (manage). See [T2.M2.5](../../tracks/T2_zopnight_engineer/M2.5_adopt_or_replace/00_README.md).
- **AES-256-GCM** — Encryption used for credential storage. See [T1.M1.1.L1](../../tracks/T1_zopnight_operator/M1.1_connect_account/L1_vault_credentials.md).
- **Amortized cost** — Azure-specific cost column that distributes reservation purchases across the term. See [T0.M0.4.L3](../../tracks/T0_foundations/M0.4_rack_rate_vs_billing/L3_amortized_azure.md).
- **Anomaly detection** — Daily cron detecting cost deviations across 5 dimensions. See [T2.M2.10](../../tracks/T2_zopnight_engineer/M2.10_cost_anomaly/00_README.md).
- **Approval gate** — Optional workflow step requiring human sign-off before remediation executes. See [T2.M2.3.L3](../../tracks/T2_zopnight_engineer/M2.3_auto_remediation/L3_approval_gate.md).
- **ASG** — AWS Auto Scaling Group, a target type for autoscaling policies.
- **Audit log** — Per-org record of all mutating API calls. See [T3.M3.3](../../tracks/T3_zopnight_architect/M3.3_audit_logging/00_README.md).
- **Auto-remediation** — One-click apply for certified recommendations. See [T2.M2.3](../../tracks/T2_zopnight_engineer/M2.3_auto_remediation/00_README.md).
- **Auto-tagging** — Rule-based prediction of environment + noStop tags. See [T2.M2.8](../../tracks/T2_zopnight_engineer/M2.8_auto_tagging/00_README.md).
- **Avoidable spend** — Spend on resources flagged as idle / orphan / over-provisioned.

## B
- **Bedrock** — AWS managed foundation model service. Cost optimization rules RC-1601..1610.
- **Billing cost** — Post-discount actual cost from cloud billing APIs. Compare [Rack rate](#R).
- **Budget** — Spend limit per resource/group/team with threshold notifications.
- **Bulk action** — Multi-resource start/stop or attach operation via 4-worker pool.

## C
- **CDCR** — Continuous Detect, Continuous Remediation. The operating model.
- **Certified rule** — Recommendation rule passed end-to-end testing on real cloud. 20 rules certified as of 2026-05-07.
- **CloudWatch metrics** — AWS observability data; source for MetricsAware rules.
- **Commitment** — RI / SP / CUD purchase that exchanges flexibility for discount.
- **Cron expression** — Schedule firing pattern. 5-field format. See [T1.M1.3.L2](../../tracks/T1_zopnight_operator/M1.3_first_schedule/L2_cron_expressions.md).
- **CUD** — GCP Committed Use Discount.

## D
- **Daily billing** — 24-hour lagged actual cost from cloud APIs. See [T0.M0.1.L3](../../tracks/T0_foundations/M0.1_cloud_bill_decoded/L3_granularity_vs_timeliness.md).
- **Database denylist** — Hardcoded set of resource types ZopNight refuses to auto-mutate. See [T2.M2.3.L5](../../tracks/T2_zopnight_engineer/M2.3_auto_remediation/L5_database_denylist.md).
- **Deallocate** — Azure VM state where compute billing stops (different from "Stop"). See [T0.M0.5.L3](../../tracks/T0_foundations/M0.5_multi_cloud_taxonomy/L3_azure_cost_surface.md).
- **DLQ** — Dead Letter Queue. Pricing-gap DLQ surfaces rules that need pricing but lack rates.
- **Drift** — Cloud-side state change ZopNight detects but didn't initiate.

## E
- **Effective discount** — Realized discount: rate-card × coverage × utilization.
- **Egress** — Cloud network traffic leaving the cloud or crossing zones.
- **Engineer tier** — Second cert tier; deep product knowledge.
- **Event Readiness** — Pre-scale infrastructure for known traffic events.

## F
- **FinOps** — Cloud Financial Operations. Industry framework from FinOps Foundation.
- **FinOps Foundation** — Cross-vendor industry body publishing the canonical framework.
- **FOCUS** — FinOps Open Cost and Usage Specification. Open standard for cost data.
- **Force-on / Force-off** — Override types that suspend schedule firing in one direction.

## G
- **GCP CUD** — Committed Use Discount. GCP equivalent of AWS RI.
- **Granted / Denied / Unknown** — Permission Visibility states.

## H-I
- **HPA** — Horizontal Pod Autoscaler. K8s feature controlling pod replica count.
- **IAM** — Identity and Access Management. Cloud-side role / policy mechanism.
- **Idle resource** — Resource running but not used.

## J-K
- **JTBD** — Jobs To Be Done framework for understanding user motivations.
- **K8s** — Kubernetes.

## L-M
- **MCP** — Model Context Protocol. Open standard for AI agent integrations.
- **MetricsAware rule** — Rule that consumes cloud monitoring data.
- **Multi-AZ** — RDS feature replicating across availability zones for reliability.

## N-O
- **noStop** — Tag prediction indicating a resource cannot safely be stopped.
- **Override** — Time-bounded suspension of a schedule's normal cadence.

## P
- **PAT** — Personal Access Token. Read-only credential for API/MCP access.
- **Permission Visibility** — Per-cloud, per-region IAM audit. See [T1.M1.1.L4](../../tracks/T1_zopnight_operator/M1.1_connect_account/L4_permission_visibility.md).
- **PricingAware rule** — Rule that consumes per-resource pricing for savings calculations.

## R
- **Rack rate** — Public, undiscounted unit price from rate cards.
- **RBAC** — Role-Based Access Control. 15 policy entities.
- **Recommendation** — Cost-optimization finding with evidence + remediation.
- **Reserved Instance (RI)** — AWS commitment instrument.

## S
- **SAML** — Security Assertion Markup Language. Enterprise SSO.
- **Savings Plan** — AWS flexible commitment instrument.
- **Schedule** — Cron-based rule for starting/stopping resources.
- **Showback** — Cost attribution to teams without billing transfer.
- **Spot** — Discount via interruptible instances (50-90% off).
- **Sustained-use discount** — GCP automatic discount for long-running compute.

## T-U-V
- **TierRates** — Pricing data for commitment math.
- **Unblended cost** — AWS CUR billing column; post-discount.
- **Unit economics** — Cost per business unit (MAU, order, request).

## W-Z
- **Welford stats** — Online statistics for autoscaler smart defaults.
- **Workload Identity Federation** — Modern cred mechanism for GCP/Azure (no long-lived keys).

---

§ Last reviewed 2026-05-20
