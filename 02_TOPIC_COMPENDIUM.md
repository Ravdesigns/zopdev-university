# ZopDev University — Complete Topic Compendium

**Companion to:** [`00_PLAN.md`](00_PLAN.md), [`01_INFORMATION_ARCHITECTURE.md`](01_INFORMATION_ARCHITECTURE.md)
**Date:** 2026-05-19

This document enumerates **every topic** the University will teach, organized across **eight axes** so we can stress-test the curriculum for gaps from any angle (curriculum lead, FinOps lead, engineering lead, persona, framework alignment, cloud-service coverage, tooling, standards).

The 241 lesson titles already live in `01_INFORMATION_ARCHITECTURE.md`. This file makes the **subjects underneath those titles** explicit — and benchmarks them against six reference learning platforms surveyed: Saviynt University, Vantage University, AWS Skill Builder, HashiCorp Learn, Snowflake University, FinOps Foundation Learning.

---

## 0. Reference benchmark (what other Universities cover, summarized)

| Platform | Headline IA model | Cert model | What we adopt | What we skip |
|---|---|---|---|---|
| **Saviynt University** | Product-tiered L100/L200/L300 + role-based + partner badges | 6 certs, free entry-level + paid advanced | Three-tier ladder (renamed Operator/Engineer/Architect); free entry-tier model; public registry | Partner badging in V1; classroom-only paid sessions |
| **Vantage University** | Feature lessons + 3 role tracks (Analyst / Dev / Finance Mgr) | No certs | Feature-mapped Operator track; 5 role-based paths (not 3 — we add Eng Leader + Security) | No certs (we add them); video-only format (we mix) |
| **AWS Skill Builder** | Domain × role-based plans + 4-tier cert (Foundational/Associate/Pro/Specialty) + AWS Jam labs + AWS Cloud Quest game | 12 certs, paid exams | Cloud Practitioner-style entry track; sandbox labs for Engineer cert; role plans | 4-tier cert hierarchy (3 is enough at our scale); gamified Cloud Quest (V2 maybe) |
| **HashiCorp Learn** | Product × use case + "Get Started" + browser terminals + tutorials | 4 Associate certs | "Get Started" lane per track (= our Operator track); browser sandboxes; use-case-driven topics | Per-product split (we're one product) |
| **Snowflake University** | 12 role-based journeys + Hands-On Essentials badges + 4-tier SnowPro certs | SnowPro Core / Advanced (5 tracks) / Specialty | Role-based journeys; badge-on-module-completion | 12 paths (5 is enough); paid practice exams (free for V1) |
| **FinOps Foundation Learning** | Framework-aligned (Inform/Optimize/Operate × 4 domains × 22 capabilities) + FOCP cert | FOCP, FOCS, FinOps Practitioner | **The entire FinOps Foundation framework — we anchor T4 to all 22 capabilities (see §5)**; FOCUS spec reference; Crawl/Walk/Run | Pure framework abstraction without the product-level worked examples |

**Key delta we own:** none of the six teaches **execution-first FinOps with a worked product example, plus an MCP/AI-agent track**. Our IA is the first one that does.

---

## 1. The master topic list (flat, alphabetical — every subject taught somewhere)

Numbers in `()` cite the lesson(s) that own each topic. Topics shown here are *the substance* — not the lesson titles.

### A
- Access Denied / 403 / AuthorizationFailed handling (T1.M1.1)
- AccessKey rotation (T6.M6.3)
- Activity logs — AWS CloudTrail, GCP Cloud Logging, Azure Activity Log (T2.M2.2, T3.M3.4)
- Adopt-or-replace (autoscaler) (T2.M2.5)
- Aggregator service (data flow) (T2.M2.1)
- AKS — Azure Kubernetes Service (T2.M2.6, T2.M2.7)
- Algolia (search) — V1 platform choice (meta)
- Allocation — FinOps capability (T3.M3.5, T4.M4.2)
- Amortized cost (Azure) (T0.M0.4)
- Anomaly detection — 5 dimensions, percent + z-score, root cause, redistribution suppression (T2.M2.10, T4.M4.5)
- API Gateway cost (T0.M0.5)
- App Runner (pause/resume) (T2.M2.3)
- Approval gate for remediation (T2.M2.3)
- Architectural decision records (ADR) for cost decisions (T5.M5.6)
- Architecting & Workload Placement — FinOps capability (T5.M5.4)
- Artifact Registry (GCP) — image count + size enrichment (T1.M1.2)
- ASG (AWS Auto Scaling Group) (T2.M2.4, T2.M2.5)
- Audit logging — request + response capture (T3.M3.3)
- Authentication providers — Google OAuth, GitHub OAuth, SAML (T3.M3.2)
- Auto-remediation workflow — precondition → action → validate (T2.M2.3)
- Auto-tagging — env predictions, noStop predictions, confidence scores, accept/reject, sync-back (T2.M2.8)
- Automation, Tools & Services — FinOps capability (T4.M4.1)
- Autopilot mode (autoscaling) (T2.M2.4)
- Azure Cost Management API (T0.M0.1, T3.M3.5)
- Azure Databricks (Workspace / Cluster / Pool / SQL Warehouse) (T2.M2.7)
- Azure Hybrid Benefit (T0.M0.5)
- Azure Reserved Instances (T0.M0.5, T4.M4.7)
- Azure SQL VMs (T2.M2.3)
- Azure Stop vs Deallocate (T0.M0.5)

### B
- Backfill cron — billing data (T3.M3.5)
- Backup retention as cost (T5.M5.5)
- Backwards-compatibility shims (we don't teach these as good — see voice guide)
- Bedrock rules (RC-1601..1610) (T2.M2.1)
- BigQuery billing export (GCP) (T0.M0.1, T3.M3.5)
- Billing cost vs rack rate (T0.M0.4)
- Bin-packing — K8s (not deeply; reference CAST AI / Spot Ocean) (T5.M5.3)
- Blast radius (T5.M5.6)
- Bloom's taxonomy (revised) — used as a curriculum tool (meta — `05_VOICE_AND_TONE.md`)
- Bottom-up forecasting (T4.M4.6)
- Budget alerts and thresholds (T3.M3.6, T4.M4.4)
- Budget governance (T3.M3.6, T4.M4.4)
- Budget pyramid (org/team/resource) (T4.M4.4)
- Budgeting — FinOps capability (T3.M3.6, T4.M4.4)
- Bulk start/stop with worker pool (T1.M1.2)
- Burstable instances (T0.M0.5)
- Business Hours preset (T1.M1.3)

### C
- Capacity engine (Event Readiness) — multiplier vs expected requests (T2.M2.9)
- CAST AI (as competitor reference) (T0.M0.5)
- Case studies — customer-contributed (community)
- Catalog rates (pricing_cache) (T0.M0.4, T2.M2.1)
- Catalog page (design) — bento grid rules (T-2)
- CDCR — Continuous Detect, Continuous Remediation (T0.M0.6, every track)
- Certifications — Operator, Engineer, Architect (own pages)
- Chargeback — design + decision criteria (T4.M4.2)
- Chip / badge issuance (Credly) (meta)
- Cloud account discovery (T1.M1.1)
- Cloud Asset Inventory (GCP) (T1.M1.2)
- Cloud bill anatomy (T0.M0.1)
- Cloud Functions cost (T0.M0.5)
- Cloud Logging (GCP) — activity log source (T3.M3.4)
- Cloud Monitoring (GCP) — metrics source (T2.M2.2)
- CloudHealth (as competitor reference) (T0.M0.6 — what "report-and-ticket" looks like)
- CloudSQL (GCP) (T2.M2.3)
- CloudTrail — AWS audit + activity (T2.M2.2, T3.M3.4)
- CloudWatch metrics (T2.M2.2)
- Cognitive Load Theory (meta — used to design lesson template)
- Commitments — RI / SP / CUD / Spot (T0.M0.3, T4.M4.7)
- Compliance category (rule category) (T2.M2.1)
- Compute Engine (GCE) (T2.M2.3)
- Concurrent operations on cluster — distributed locking (T2.M2.6)
- Connection-pool math (Event Readiness) (T2.M2.9)
- Console URLs in remediation cards (T2.M2.3)
- Container registry size (Artifact Registry) (T1.M1.2)
- Continuous Detect → Continuous Remediation (T0.M0.6)
- Contribution lanes (lessons, patterns, case studies) — community
- Cooldown period (autoscaling) (T2.M2.4)
- Cosmic / aspirational claims — banned in voice (meta)
- Cost allocation (T3.M3.5, T4.M4.2)
- Cost anomaly detection — see "Anomaly detection"
- Cost anomaly response playbook (T4.M4.5)
- Cost breakdown — by provider, region, type, team, account, service, purchase, resource (T3.M3.8)
- Cost Explorer (AWS) (T0.M0.1, T3.M3.5)
- Cost flow (Sankey) — toggle from Trend (T3.M3.8)
- Cost incidents — incident commander pattern (T5.M5.7)
- Cost per MAU / DAU / order / 1K requests (T3.M3.5, T4.M4.3)
- Cost-and-rollup cron (T3.M3.5)
- Cost-source label (calculated vs actual) (T0.M0.4)
- Crawl / Walk / Run maturity (T4.M4.1)
- Cron expressions — start + stop crons, presets (T1.M1.3, T5.M5.2)
- CronJob (K8s) — suspend/resume (T2.M2.6)
- Cross-account scheduling (T5.M5.4)
- CSV upload — unit metrics ingest (T3.M3.5)
- CUD — GCP Committed Use Discount (T0.M0.5, T4.M4.7)
- Currency conversion (date-specific FX) (T0.M0.4)
- Custom roles (RBAC) (T3.M3.1)
- Customer-led contribution (case studies) — community
- Cynefin (decision-making in incidents) (T5.M5.7)

### D
- Dashboards — Executive / Engineering / FinOps / All Widgets presets (T3.M3.7)
- Dashboard default — org-shared, per-org pointer (T3.M3.7)
- Dashboard size tokens — Wide / Standard / Compact (T3.M3.7)
- Data Ingestion — FinOps capability (T0.M0.1, T0.M0.4)
- Database denylist (remediation never mutates customer DBs) (T2.M2.3)
- Databricks — Workspace / Cluster / Pool / SQL Warehouse (T2.M2.7)
- DAU (Daily Active Users) (T4.M4.3)
- Deallocate vs Stop (Azure) (T0.M0.5)
- Dead-letter queue (DLQ) (T2.M2.2)
- Decision-making under uncertainty (T5.M5.7)
- Demo prod pattern (T5.M5.2)
- Departed users — who created what (T3.M3.4)
- Dependency-aware sequenced execution (T1.M1.4)
- Deployment (K8s) — scale-to-zero scheduling (T2.M2.6)
- Detect-and-act vs detect-and-ticket (T0.M0.6)
- Discord (Q&A platform option — meta)
- Discourse (Q&A platform — default) (meta)
- Discount category (rule category) (T2.M2.1, T4.M4.7)
- Discovery — Resource Explorer 2 (AWS), Cloud Asset Inventory (GCP), Resource Graph (Azure) (T1.M1.2)
- Discovery sync (periodic 6h + manual refresh) (T1.M1.1, T1.M1.2)
- DR — RTO / RPO costs (T5.M5.5)
- Drift detection — IaC (T5.M5.6)
- Dropdown — grouped account, grouped type (T1.M1.2)

### E
- EBS volume — orphan rule (T2.M2.1)
- ECS — cluster, service, scaling (T2.M2.4)
- Editorial board — review process (community)
- Editorial calendar (community)
- Effective discount math (T4.M4.7)
- Egress cost (T5.M5.4)
- EKS — Deployments, StatefulSets, CronJobs (T2.M2.6)
- ElastiCache (T2.M2.3)
- ElasticSearch / OpenSearch (T0.M0.5)
- EMR / EMR Serverless (T2.M2.3)
- Encryption at rest — AES-256-GCM (T1.M1.1)
- Engineer cert (Engineer tier) (own page)
- Environment tag prediction (T2.M2.8)
- Estimated savings — confidence band (T2.M2.9)
- Event Readiness — pre-scale for events (T2.M2.9)
- Event Readiness API — calculate, calculate-db, preview-readiness, schedule, cancel (T2.M2.9)
- Evidence JSON — rule firing data (T2.M2.2)
- Exam blueprint — Operator, Engineer, Architect (own pages)
- Executive Strategy Alignment — FinOps capability (T4.M4.1)
- Expected requests model (Event Readiness) (T2.M2.9)
- Expiry — overrides (T1.M1.5)

### F
- FAQ page (chrome)
- Feature flags vs backwards-compatibility shims (we teach the principle)
- FinOps assessment (T4.M4.1)
- FinOps capabilities — all 22 (mapped in §5)
- FinOps Certified Practitioner (FOCP) — reference cert (T4.M4.1, meta)
- FinOps Education & Enablement — FinOps capability (T4.M4.1, this very University)
- FinOps Foundation — framework, principles, domains (T0.M0.2, T4 all)
- FinOps Foundation Crawl/Walk/Run (T4.M4.1)
- FinOps Practice Operations (T4.M4.1)
- FinOps Practitioner (T0.M0.2, persona)
- Five-part lesson template (meta — `03_LESSON_TEMPLATE.md`)
- Flow vs Trend (Cost Reports) (T3.M3.8)
- FOCUS specification — FinOps Open Cost & Usage Spec (T0.M0.1, T4.M4.1)
- Forecasting — top-down, bottom-up, hybrid (T4.M4.6)
- Forecasting — FinOps capability (T4.M4.6)
- Form templates (contribution) (community)
- Freeze window pattern (T5.M5.2)

### G
- Gateway middleware — audit logging (T3.M3.3)
- GCS bucket — size + object count enrichment (T1.M1.2)
- GitHub OAuth (T3.M3.2)
- GKE — Deployments, StatefulSets, CronJobs (T2.M2.6)
- Glossary — A–Z, ~120 terms (reference)
- Golden image pipelines (HashiCorp Learn topic we cite, not teach)
- Google OAuth (T3.M3.2)
- Governance, Policy & Risk — FinOps capability (T3.M3.1, T4.M4.1)
- Grafana board — operational reference (meta, not taught)
- Granted / Denied / Unknown (permission badges) (T1.M1.1)
- Grouped account dropdown (T1.M1.2)
- Grouped type dropdown (T1.M1.2)
- Groups — resource groups (T1.M1.4)
- gRPC transport (MCP) (T6.M6.2, T6.M6.3)
- Guardrails — max override duration (T1.M1.5)

### H
- HashiCorp Learn — referenced as a benchmark, not taught
- Hands-on simulator / sandbox (every L200 lesson)
- Heatmap-based schedule data (T1.M1.3)
- History — state transitions (T1.M1.6)
- Hot reload / warm cache (catalog rates) (T2.M2.1)
- HPA — Horizontal Pod Autoscaler signals (T5.M5.3)
- HTTPS endpoint for unit-metric pull (T3.M3.5)
- Hub nodes (topology) — shared SGs / VNets / networks (meta — visual; rare lesson hook)
- Human caller resolution — IAM ARN, SSO email, GCP principal email (T3.M3.4)
- Hybrid Benefit (Azure) (T0.M0.5)

### I
- IaC — Terraform / CDK / Pulumi cost concerns (T5.M5.6)
- IAM — least privilege, scoped writes (T1.M1.1, T3.M3.1)
- Idle category (rule category) (T2.M2.1)
- Idle Lambda functions (T2.M2.1)
- Identity-sync cron (T3.M3.4)
- IDP — pluggable (SAML per-domain) (T3.M3.2)
- Idempotency — retry-safe cancel, deterministic schedule IDs (T2.M2.9)
- Image inventory — diagrams, screenshots, covers (`04_VISUAL_STYLE_GUIDE.md`)
- Incident commander (cost) (T5.M5.7)
- Incident response when cost is the incident (T5.M5.7)
- Inform / Optimize / Operate — FinOps lifecycle (T0.M0.2)
- Inheritance — tag (T5.M5.1)
- In-memory cost record index (T2.M2.10)
- Intent queue (Redis) — autoscaler, executor (T2.M2.4)
- Intersecting Disciplines — FinOps capability (T4.M4.1, meta)
- Invoicing & Chargeback — FinOps capability (T4.M4.2)
- ISO 27001 — referenced (meta; not deeply taught)
- ITAM / ITFM / ITSM — allied personas (meta)

### J
- Jobs-to-be-Done (JTBD) — meta framework on every lesson
- JTBD tags — J1–J5 personas (meta)

### K
- K8s workloads — Deployment, StatefulSet, CronJob (T2.M2.6, T5.M5.3)
- K8s cost discipline — requests/limits/HPA/orphan PVC (T5.M5.3)
- K8s rules — 41 per provider (EKS/GKE/AKS) (T2.M2.1)
- Kanban for editorial flow (community)
- Kibana / OpenSearch dashboards — not taught
- KMS — key management (T0.M0.5)
- Knowledge check — 2–3 questions per lesson (meta — template)
- KPIs & Benchmarking — FinOps capability (T3.M3.5, T4.M4.3)

### L
- Labs — sandbox simulator (Engineer tier) (meta)
- Lambda — concurrency throttling (T2.M2.3)
- Last-write event — ownership detection (T3.M3.4)
- Latency metric (autoscaling) (T2.M2.4)
- Layered budgets (T4.M4.4)
- LDAP — not in scope
- Lesson template — five-part (meta — `03_LESSON_TEMPLATE.md`)
- Lessons-that-teach-this-rule (rule catalog detail) (reference)
- Licensing & SaaS — FinOps capability (T4.M4.7)
- Lifecycle — Event Readiness (draft → scheduled → active → completed) (T2.M2.9)
- Limit (K8s) (T5.M5.3)
- Lookback periods (rules) (T2.M2.1)
- LRU cache — identity set per org (T3.M3.4)

### M
- Manage the FinOps Practice (FinOps domain) (T4.M4.1)
- Marketing-spam language — banned (meta — voice guide)
- Maturity model (Crawl/Walk/Run) (T4.M4.1)
- Max override duration (T1.M1.5)
- MAU — monthly active users (T3.M3.5, T4.M4.3)
- MCP — Model Context Protocol (T6 entire track)
- MCP — 43 read-only tools (T6.M6.4)
- MCP — Claude Desktop, Cursor, Codex, Claude Code (T6.M6.2)
- Member Certification — partner-based (Saviynt-style, we skip in V1)
- Metrics-aware rules (T2.M2.1)
- Metrics drawer (T2.M2.2)
- Metrics enrichment — S3, GCS, Artifact Registry size (T1.M1.2)
- MIG — GCP Managed Instance Group (T2.M2.4)
- Microlearning — 5–12 min lessons (meta)
- Mobile responsiveness — 375 / 414 / 768 / 1024 / 1440 / 1920 breakpoints (meta — visual)
- Monitor mode (autoscaling) (T2.M2.4)
- Multi-account architecture (T3.M3.4, T5.M5.4)
- Multi-AZ — RDS (T2.M2.1)
- Multi-cloud governance (T0.M0.5)
- Multi-cloud taxonomy — AWS / GCP / Azure (T0.M0.5)
- MySQL Flexible (Azure) (T2.M2.3)

### N
- Named credential — "ZopDev Certified Cloud Cost Architect" (cert page)
- NAT Gateway cost (T0.M0.5)
- Netlify (host platform — meta)
- Network architecture (cost-aware) (T5.M5.4)
- NoStop tag (T2.M2.8)
- Notification channels — Slack, Teams, GChat, Webhooks (T1.M1.6)
- Notification severity (CRITICAL / WARNING / INFO) (T1.M1.6)

### O
- OAuth — Google, GitHub (T3.M3.2)
- Off-hours scheduling pattern (T5.M5.2)
- Onboarding — new ZopNight tenants (T1 all)
- Operate (FinOps lifecycle) (T0.M0.2, T4.M4.1)
- Operator cert (Operator tier) (own page)
- Optimize (FinOps lifecycle) (T0.M0.2, T4.M4.1)
- Optimize Usage & Cost (FinOps domain) (T4.M4.1)
- Org settings — default dashboard (T3.M3.7)
- Org structure — multi-account architecture (T3.M3.4)
- Organization-shared dashboards (T3.M3.7)
- Orphan category (rule category) (T2.M2.1)
- Orphan PVCs and released PVs (T5.M5.3)
- Outcomes — Bloom-verb lesson outcomes (meta — template)
- Over-commitment patterns (T4.M4.7)
- Overrides — force-on, force-off, reason, expiry (T1.M1.5)
- Ownership detection — creator + last writer (T3.M3.4)

### P
- PagerDuty (referenced, not taught)
- Pagination — list endpoints (meta — frontend)
- Parent-child hierarchy (resources) (T1.M1.2)
- Partial-failure handling — schedule action sweep (T2.M2.9)
- PAT — Personal Access Token (T6.M6.3)
- Path picker — homepage (chrome)
- Pattern library — 15 CDCR patterns (reference)
- Peak Hours preset (T1.M1.3)
- Percent deviation (anomaly) (T2.M2.10)
- Permission Visibility (T1.M1.1)
- Persona — 5 (Platform Eng / FinOps Analyst / Eng Leader / Finance Partner / Security) (meta)
- PIT (point-in-time) recovery — backup retention (T5.M5.5)
- Planning & Estimating — FinOps capability (T4.M4.6)
- Policy entities — 15 (T3.M3.1)
- Pool — Databricks instance pool (T2.M2.7)
- Postman — referenced, not taught
- Post-incident review (cost) (T5.M5.7)
- PostgreSQL Flexible (Azure) (T2.M2.3)
- Predictive scaling — refused on Replace (T2.M2.5)
- Pre-merge cost gate (Infracost-style) (T5.M5.6)
- Prefetch — pipeline (anomaly detection) (T2.M2.10)
- Prefilled URL — cross-feature linking (T2.M2.4)
- Prerequisites — per cert (own pages)
- Pricing-aware rules (T2.M2.1)
- Pricing-gap DLQ (T2.M2.2)
- Pricing model — fixed SaaS, no bundling, no multi-year (meta)
- Pricing sync — weekly cron (T2.M2.1)
- Priority-based ordering (sequenced execution) (T1.M1.4)
- Privacy / Terms (legal — chrome)
- Privileged containers (K8s security signal) (T5.M5.3)
- Procurement persona — FinOps (T4 — meta)
- Product persona — FinOps (T4 — meta)
- Progressive autonomy (T2.M2.4)
- Progressive disclosure (UI principle) (meta — visual)
- Provisioner — remediation orchestrator (T2.M2.3)
- Public registry — credentialled people (cert page)
- Pulumi — IaC cost (T5.M5.6)
- Purchase types — OnDemand / Reservation / SavingsPlan / Spot (T0.M0.4, T2.M2.1)
- PVC — orphan PVCs and released PVs (T5.M5.3)

### Q
- Q&A platform — Discourse (default) vs Discord (meta)
- Queue depth metric (autoscaling) (T2.M2.4)
- Quick Setup wizard (autoscaling) (T2.M2.4)
- Quiz — module-level (10 Qs, mixed) (meta — template)
- Quota — cloud-side limits (T2.M2.5)

### R
- Rack rate — pricing API calculation (T0.M0.4)
- Rate Optimization — FinOps capability (T4.M4.7)
- RBAC — Viewer / Editor / Admin + custom + team-scoped (T3.M3.1)
- React 19 + Vite 7 + Tailwind v4 — meta (not taught)
- Reading the bill (T0.M0.1)
- Reason field — overrides (T1.M1.5)
- Recipe library — 15 MCP recipes (T6.M6.4)
- Recommend mode (autoscaling) (T2.M2.4)
- Recommendation rules — 490 total (T2.M2.1)
- Recommendations — Open, Applied, Dismissed, Optimised (T2.M2.1)
- Reduced motion — accessibility (meta — visual)
- Redis Streams — audit logs (T3.M3.3)
- Redis-backed worker pool (T2.M2.4)
- Registry key — autoscaler ("provider:targetType") (T2.M2.4)
- Region drift — resources outside policy regions (T6.M6.4)
- Reliability category (rule category) — K8s workload (T2.M2.1, T5.M5.5)
- Remediation — see "Auto-remediation"
- Reorg-proof tagging (T5.M5.1)
- Reporting & Analytics — FinOps capability (T3.M3.5, T3.M3.8)
- Reports — Org Summary, Trends, Provider, Showback, Cost Flow (T3.M3.5, T3.M3.8)
- Reservations (RI) — AWS / Azure (T0.M0.5, T4.M4.7)
- Resource discovery (T1.M1.2)
- Resource Explorer 2 (AWS) (T1.M1.2)
- Resource Graph (Azure) (T1.M1.2)
- Resource groups — exclusive membership (T1.M1.4)
- Resource ownership detection (T3.M3.4)
- Restore state — autoscaler remove (T2.M2.5)
- Retry — automatic + DLQ (T2.M2.3)
- Reviewing knowledge checks (meta — template)
- Rightsizing category (rule category) (T2.M2.1)
- Role-based learning paths — 5 (T-3 template)
- Roll-up — daily cost (T3.M3.5)
- Root cause analysis (anomaly) (T2.M2.10, T4.M4.5)
- RTO / RPO — cost (T5.M5.5)
- Rubric — lesson review (community)
- Rule interface — Evaluate, MetricsAware, PricingAware (T2.M2.1)

### S
- S3 — metrics enrichment via CloudWatch (T1.M1.2)
- SageMaker Notebooks (T2.M2.3)
- SAML — per-email-domain configuration (T3.M3.2)
- Sankey diagram — Cost Flow (T3.M3.8)
- Savings — calculation (idle 100%, rightsizing 30%, $5 min threshold) (T2.M2.1)
- Savings Plans — AWS (T0.M0.5, T4.M4.7)
- Saviynt L100/L200/L300 — reference model (meta)
- Scale-to-zero pattern (T5.M5.3)
- Schedule category (rule category, carved 2026-04-13) (T2.M2.1)
- Schedule-and-rollback contract (T2.M2.9)
- Schedule design patterns (T5.M5.2)
- Schedule execution — cron evaluator + cloud API calls (T1.M1.3)
- Schedule-resource attachment (T1.M1.3)
- Scheduled actions — AWS ASG, ECS, Azure FixedDate, GCP scalingSchedules (T2.M2.9)
- Schedules — name, description, timezone, crons (T1.M1.3)
- Scope — Product / Cost Center / Custom (FinOps) (T3.M3.5)
- Scopes — `nil` vs `[]` vs `[ids...]` (RBAC) (T3.M3.1)
- Search — Algolia (V1 default) (meta)
- Search results page (chrome)
- Security category (rule category, K8s) (T2.M2.1, T5.M5.3)
- Security / Compliance persona (T-3 path)
- Self-assessment — FinOps maturity (T4.M4.1)
- Sequenced execution — storage / compute / app tiers (T1.M1.4)
- Severity — critical / high / medium / low / info (T2.M2.1)
- Shadow IT — not taught explicitly
- Share-of-savings vendors — when to use, when not (T4.M4.7)
- Shared services — cost attribution (T5.M5.4)
- Shift cost left (T5 entire track)
- Showback — Organisation / Teams / Tags (T3.M3.5)
- Showback vs Chargeback (T4.M4.2)
- Sign-in / Sign-up (auth)
- Singleton widgets (T3.M3.7)
- Sitemap — HTML (chrome)
- Skill — repository (meta)
- Slack notifications (T1.M1.6)
- SLO/SLI — reference, not deeply taught
- SOC 2 Type II — referenced (meta)
- Spaced practice — same concept in multiple tracks (meta — pedagogy)
- Spot instances (T0.M0.5, T4.M4.7)
- SQL injection — referenced, not deeply taught
- SQL Warehouse — Databricks (T2.M2.7)
- SREE — site reliability cost economics (T5.M5.5)
- SSO — SAML + Google + GitHub (T3.M3.2)
- SSRF guard — unit-metric pull (T3.M3.5)
- State history — resource_state_history (T1.M1.6)
- Stateful set (K8s) (T2.M2.6)
- Step Scaling — refused on Replace if >2 steps (T2.M2.5)
- Stop vs Deallocate (Azure) (T0.M0.5)
- Stripe — referenced, not taught (Vantage breadth comparison)
- Sub-brand color binding — blue/orange/green per track (meta — visual)
- Submit a lesson / pattern / case study (community)
- Sustainability — FinOps capability (T4.M4.1, brief)
- Synapse SQL Pools (Azure) (T2.M2.3)
- Synthetic topology-grouping nodes (T2.M2.5)

### T
- Tabular nums / monospace numerals (meta — visual)
- Tag attribution — cloud + auto-tags (T3.M3.5)
- Tag coverage widget (T3.M3.5)
- Tag drift (T5.M5.1)
- Tag-then-allocate pattern (P-03) (reference)
- Tagger — auto-tagging (T2.M2.8)
- Tagging strategy (T5.M5.1)
- Tags — minimum viable tag set (T5.M5.1)
- Take-home design exercise (Architect cert) (cert page)
- Target tracking (autoscaling) (T2.M2.4)
- Team attribution — equal-split for shared resources (T3.M3.5)
- Team budgets (T3.M3.6)
- Team-scoped access (T3.M3.1)
- Tenant cascade — soft-delete on org delete (T3.M3.7, T6.M6.3)
- Terraform — IaC cost (T5.M5.6)
- Test fetch — unit-metric pull (T3.M3.5)
- Threshold — budget (T3.M3.6)
- Tiered cert (Operator / Engineer / Architect) (own pages)
- TierRates (commitment math) (T2.M2.1, T4.M4.7)
- Time-in-state — rule analysis (T2.M2.1)
- Timezone (IANA format) (T1.M1.3)
- Tombstone form — deleted slot (T3.M3.5)
- Top-down forecasting (T4.M4.6)
- Topology graph — Globe + Canvas, hub nodes (T-1 home hero — referenced)
- Trace — failure backward through 4-phase loop (meta — methodology, not lesson)
- Trail — audit trail (T1.M1.6, T3.M3.3)
- Trend chart — cost reports (T3.M3.5)
- Two-source cost model (T0.M0.4)

### U
- Unattributed teams — highlight (T3.M3.5, T3.M3.8)
- Underutilized EC2 — RC-003 (T2.M2.1)
- Unit economics — cost per X (T3.M3.5, T4.M4.3)
- Unit Economics — FinOps capability (T4.M4.3)
- Unit-metric definition (Config) vs values (Aggregator) (T3.M3.5)
- Upper bounds — per-org caps on dashboards (T3.M3.7)
- Usage Optimization — FinOps capability (T2.M2.1–2.4)
- USE-CASES.md → lesson map (`02_USECASE_TO_LESSON_MAP.md`)

### V
- Vault credentials (encrypted store) (T1.M1.1)
- Verifier — public cert lookup (cert page)
- Version — layout schema (T3.M3.7)
- View Transitions API — meta visual
- Viewer / Editor / Admin (system roles) (T3.M3.1)
- Visual style guide (`04_VISUAL_STYLE_GUIDE.md`)
- VM Autoscaling — ASG / VMSS / MIG (T2.M2.4)
- VMSS — Azure (T2.M2.4)
- Voice & tone (`05_VOICE_AND_TONE.md`)

### W
- Watcher (async cluster ops) — gap noted, not deeply taught (T2.M2.6)
- WCAG 2.1 AA (meta — visual + accessibility)
- Webhooks (T1.M1.6)
- Weekend Scale-Down preset (T1.M1.3)
- Welford-based online statistics (T2.M2.4)
- Worked example pedagogy (meta — Cognitive Load Theory)
- Worked examples library (reference)

### X-Y-Z
- z-score (anomaly) (T2.M2.10)
- ZopCloud — placeholder (track stub)
- ZopDay — placeholder (track stub)
- ZopDev University — name (umbrella) (meta)

**Master topic count:** ~340 distinct topics, each tagged to at least one lesson, pattern, glossary term, or meta doc.

---

## 2. Topics by cloud provider + service (coverage matrix)

### 2.1 AWS services explicitly taught (35+ services)

| Service | Where it's taught | Rules referenced |
|---|---|---|
| **EC2** (instance / volume / snapshot) | T1.M1.2, T2.M2.1, T2.M2.4, T6.M6.4 | RC-001, RC-002, RC-003, RC-004, RC-006 |
| **RDS** | T1.M1.2, T2.M2.1, T6.M6.4 | RC-005 + Multi-AZ rule |
| **EKS** (cluster + Deployments + STS + CronJobs) | T2.M2.6 | RC-17xx series (41 rules) |
| **ECS** (cluster + service) | T2.M2.4 (Application Auto Scaling) | autoscaler RC-ASC-001 |
| **ASG** (Auto Scaling Group) | T2.M2.4, T2.M2.5 | RC-ASC-001/004/005/006 |
| **Lambda** | T2.M2.3, T2.M2.1 | RC-010 idle Lambda |
| **S3** | T1.M1.2, T0.M0.5 | size/object metrics enrichment |
| **EBS** | T2.M2.1 | RC-002 orphan EBS |
| **NAT Gateway** | T0.M0.5 | unused-NAT rule |
| **KMS** | T0.M0.5 | unused-key rule |
| **Elasticache** | T2.M2.3 | placeholder |
| **EMR / EMR Serverless** | T2.M2.3 | new resource type |
| **App Runner** | T2.M2.3 | pause/resume |
| **Beanstalk Environments** | T2.M2.3 | new |
| **SageMaker Notebooks** | T2.M2.3 | new |
| **Bedrock** | T2.M2.1 | RC-1601..1610 (10 rules) |
| **CloudTrail** | T3.M3.4 | activity log source |
| **CloudWatch** | T2.M2.2 | metrics source |
| **Cost Explorer** | T0.M0.1, T3.M3.5 | billing data |
| **IAM** | T1.M1.1, T3.M3.1, T3.M3.4 | permission audit |

### 2.2 GCP services (15+)

| Service | Where it's taught |
|---|---|
| **Compute Engine** | T1.M1.2, T2.M2.3 |
| **CloudSQL** | T2.M2.3 |
| **GKE** (Deployments / STS / CronJobs) | T2.M2.6 |
| **GCS** | T1.M1.2 (size + object count) |
| **Artifact Registry** | T1.M1.2 (image count + size) |
| **Cloud Monitoring** | T2.M2.2 |
| **Cloud Logging** | T3.M3.4 |
| **Cloud Asset Inventory** | T1.M1.2 |
| **BigQuery billing export** | T0.M0.1, T3.M3.5 |
| **MIG** | T2.M2.4 |

### 2.3 Azure services (15+)

| Service | Where it's taught |
|---|---|
| **Azure VMs** | T2.M2.3 |
| **AKS** (Deployments / STS / CronJobs) | T2.M2.6 |
| **VMSS** | T2.M2.4 |
| **Databricks (Workspace/Cluster/Pool/SQL Warehouse)** | T2.M2.7 |
| **Azure SQL VMs / MySQL Flexible / PostgreSQL Flexible / Synapse / Data Explorer** | T2.M2.3 |
| **Azure Cost Management** | T0.M0.1, T3.M3.5 (amortized) |
| **Activity Log** | T3.M3.4 |
| **Azure Monitor** | T2.M2.2 |
| **Resource Graph** | T1.M1.2 |
| **Hybrid Benefit / Reservations** | T0.M0.5, T4.M4.7 |

---

## 3. FinOps Foundation framework alignment (the 4 domains × 22 capabilities)

This is the most important defensibility section. We anchor T4 (FinOps Mastery) directly to the FinOps Foundation framework so an FOCP-certified learner sees their entire framework reflected.

### Domain 1: Understand Usage & Cost
| Capability | Lessons |
|---|---|
| Data Ingestion | T0.M0.1, T0.M0.4 |
| Allocation | T3.M3.5 (team + tag), T4.M4.2 |
| Reporting & Analytics | T3.M3.5, T3.M3.8 |
| Anomaly Management | T2.M2.10, T4.M4.5 |

### Domain 2: Quantify Business Value
| Capability | Lessons |
|---|---|
| Planning & Estimating | T4.M4.6 |
| Forecasting | T4.M4.6 |
| Budgeting | T3.M3.6, T4.M4.4 |
| KPIs & Benchmarking | T4.M4.1 (maturity ladder), T4.M4.3 |
| Unit Economics | T3.M3.5 (product), T4.M4.3 (domain) |

### Domain 3: Optimize Usage & Cost
| Capability | Lessons |
|---|---|
| Architecting & Workload Placement | T5.M5.4, T5.M5.5 |
| Usage Optimization | T2.M2.1–2.4 (rules + remediation + autoscaling), T1 (entire track — scheduling) |
| Rate Optimization | T4.M4.7 (RI/SP/CUD/Spot) |
| Licensing & SaaS | T4.M4.7 (brief — covered as a lever) |
| Sustainability | T4.M4.1 (touched — full module not in V1) |

### Domain 4: Manage the FinOps Practice
| Capability | Lessons |
|---|---|
| Executive Strategy Alignment | T4.M4.1 (maturity ladder), T5.M5.7 (cost incidents) |
| FinOps Practice Operations | T4.M4.1, T4.M4.5 |
| Governance, Policy & Risk | T3.M3.1 (RBAC), T3.M3.3 (audit), T5.M5.1 (tag policy) |
| FinOps Education & Enablement | **This University itself** |
| Invoicing & Chargeback | T4.M4.2 |
| FinOps Assessment | T4.M4.1 (self-assessment) |
| Automation, Tools & Services | T6 (entire MCP track), T2.M2.3 (auto-remediation) |
| Intersecting Disciplines | T5 (entire track — DevOps/FinOps bridge) |

**Coverage report:** 22/22 capabilities are addressed. Sustainability is the lightest in V1 — flagged for expansion.

---

## 4. Technical domain coverage (by category)

| Domain | Topics taught | Track location |
|---|---|---|
| **Compute** | EC2, GCE, Azure VMs, ASG, MIG, VMSS, Lambda, App Runner, Beanstalk | T1, T2.M2.4 |
| **Containers / K8s** | EKS, GKE, AKS, Deployment, STS, CronJob, HPA, PVC, requests/limits | T2.M2.6, T5.M5.3 |
| **Database** | RDS, CloudSQL, Azure SQL, Cosmos DB, Multi-AZ, Aurora, MySQL/PostgreSQL Flexible | T0.M0.5, T2.M2.1 (advice only, never mutate) |
| **Storage** | S3, GCS, EBS, Azure Disks, Artifact Registry | T1.M1.2 |
| **Network** | NAT GW, VPC, egress, hub nodes, VNet | T0.M0.5, T5.M5.4 |
| **Serverless** | Lambda, Cloud Functions, App Runner | T2.M2.3 |
| **Data & Analytics** | EMR, Synapse, Databricks, BigQuery (billing) | T2.M2.3, T2.M2.7 |
| **ML / AI** | SageMaker Notebooks, Bedrock, Azure ML | T2.M2.3, T2.M2.1 (Bedrock rules) |
| **Identity / IAM** | IAM, SSO (SAML/OAuth), RBAC, departed users, PATs | T1.M1.1, T3.M3.1, T3.M3.2, T6.M6.3 |
| **Observability** | CloudWatch, Cloud Monitoring, Azure Monitor, activity logs | T2.M2.2, T3.M3.4 |
| **Messaging** | SQS, Pub/Sub, Event Grid | covered briefly under T0.M0.5 |

---

## 5. Persona × topic matrix (top 30 topics per persona)

Every lesson is tagged with one or more persona JTBDs (J1–J5). Here's the inverse — given a persona, what they need to learn most.

### J1 — Platform / DevOps Engineer (top 30)
1. Connect cloud account · 2. Permission visibility · 3. Resource discovery · 4. Cron expressions · 5. Schedule design patterns · 6. Resource groups · 7. Overrides · 8. K8s workload scheduling · 9. Databricks scheduling · 10. VM autoscaling · 11. Adopt-or-replace · 12. Rule library · 13. Reading evidence · 14. Auto-remediation · 15. Tagging strategy · 16. K8s cost discipline (requests/limits/HPA) · 17. Multi-account architecture · 18. Event Readiness · 19. Cost anomaly detection · 20. Cost incident response · 21. MCP setup · 22. MCP recipes · 23. IaC + cost (Terraform/CDK) · 24. Reliability vs cost · 25. Two-source cost model · 26. Notifications (Slack/Teams) · 27. State history · 28. Audit log basics · 29. Idle Lambda · 30. Orphan EBS

### J2 — FinOps Analyst (top 30)
1. Cloud bill anatomy · 2. CUR / Cost Explorer / Cost Mgmt / BigQuery · 3. Tags & cost attribution · 4. Top-10 cost mistakes · 5. FinOps principles (6) · 6. Inform/Optimize/Operate · 7. Crawl/Walk/Run · 8. Showback design (Org/Teams/Tags) · 9. Shared resources · 10. Tag coverage · 11. Unit economics · 12. Forecasting (top-down/bottom-up/hybrid) · 13. Cost anomaly response · 14. Budget governance · 15. Commitments (RI/SP/CUD/Spot) · 16. Effective discount math · 17. Rate optimization · 18. FOCUS spec · 19. Reporting & Analytics · 20. KPI & benchmarking · 21. Chargeback vs showback · 22. Internal billing engineer anti-pattern · 23. Sankey cost flow · 24. Drill paths · 25. MCP for analysts · 26. MCP recipe — top recs · 27. MCP recipe — untagged spend · 28. MCP recipe — anomalies · 29. Currency conversion · 30. Rack rate vs billing

### J3 — Engineering Leader (top 30)
1. What's in the cloud bill · 2. Why we care · 3. CDCR philosophy · 4. The math: 168 hours · 5. Crawl/Walk/Run · 6. Showback vs chargeback · 7. Unit economics for the CFO · 8. Cost per MAU · 9. Tagging strategy (long view) · 10. Budget pyramid · 11. Budget as conversation · 12. Reliability vs cost · 13. Multi-account governance · 14. Schedule design patterns · 15. K8s cost discipline · 16. Cost incidents · 17. Cost incident commander · 18. Forecasting accuracy · 19. Cost incident postmortems · 20. The Architect cert (what to look for in hires) · 21. RBAC basics · 22. Audit basics · 23. SSO choice · 24. Dashboards as governance · 25. Org-default dashboard · 26. Operator badge for everyone · 27. Engineer badge for senior eng · 28. MCP for self-serve answers · 29. How CDCR reduces backlog · 30. Why detection-only fails

### J4 — Finance Partner (top 30)
1. Cloud bill anatomy · 2. Rack rate vs billing vs amortized · 3. Currency conversion · 4. Top-10 cost mistakes · 5. FinOps principles · 6. Crawl/Walk/Run · 7. Showback vs chargeback · 8. Allocation models · 9. Shared services attribution · 10. Tag coverage · 11. Forecasting (all three methods) · 12. Hybrid forecast reconciliation · 13. Forecast accuracy · 14. Forecast uncertainty bands · 15. Budgeting · 16. Threshold escalation · 17. Variance analysis · 18. Unit economics for CFO · 19. Cost per MAU/DAU/order · 20. Commitments (RI/SP/CUD/Spot) · 21. Effective discount math · 22. Share-of-savings vendors · 23. Cost anomaly response · 24. Reporting & analytics · 25. Sankey cost flow · 26. Sankey: where money goes · 27. Reading evidence (light) · 28. Dashboards as governance · 29. KPI benchmarking · 30. Procurement intersection

### J5 — Security / Compliance (top 30)
1. Permission visibility · 2. Read-only safety model · 3. CDCR safety boundary · 4. RBAC (15 entities) · 5. System roles · 6. Custom roles · 7. Team-scoped access · 8. Three-state scope model · 9. SAML per-domain · 10. OAuth provider toggles · 11. SSO failure diagnostics · 12. Audit logging (full request/response) · 13. SOC 2 evidence mapping · 14. Multi-account architecture · 15. Network architecture (cost+sec) · 16. IaC + cost (drift, blast radius) · 17. PAT — what it grants · 18. MCP org-level toggle · 19. MCP audit · 20. PAT rotation · 21. What's NOT writable via MCP · 22. K8s security signals (priv, root, host-net) · 23. Database denylist (mutation safety) · 24. Departed user resources · 25. Region drift detection · 26. Identity-sync cron · 27. Activity log integration · 28. Encryption at rest (AES-256-GCM) · 29. Approval gate for destructive ops · 30. Compliance category rules

---

## 6. Standards / frameworks referenced (8 explicitly)

The University either **teaches**, **aligns to**, or **references** these external frameworks. Each is named explicitly in the relevant lesson so the curriculum is locatable in the industry literature.

| Framework | Treatment | Where |
|---|---|---|
| **FinOps Foundation framework** (6 principles, 22 capabilities, Crawl/Walk/Run, FOCUS spec) | Aligned-to — entire T4 maps to it; T0.M0.2 teaches it directly | T0.M0.2, T4 (all) |
| **AWS Well-Architected — Cost Optimization pillar** | Referenced — point learners to AWS docs for the architectural depth | T5.M5.5 |
| **GCP Cloud Adoption Framework** | Referenced | T0.M0.5 |
| **Microsoft Cloud Adoption Framework — Cost Management discipline** | Referenced | T0.M0.5 |
| **ISO 27001:2022** | Referenced (we hold certification) — explained as compliance context | T3.M3.3 |
| **SOC 2 Type II** | Referenced — audit-log evidence mapping lesson | T3.M3.3 |
| **Bloom's Taxonomy (revised)** | Used internally; visible to authors in lesson template | meta — `03_LESSON_TEMPLATE.md` |
| **Cognitive Load Theory (Sweller)** | Used internally — worked examples + fading scaffolds | meta — `03_LESSON_TEMPLATE.md` |
| **Cynefin** | Referenced — for cost-incident triage (when to consult vs. when to act) | T5.M5.7 |
| **Backward Design (Wiggins & McTighe)** | Used as the lesson-authoring method | meta — `03_LESSON_TEMPLATE.md` |
| **Jobs-to-be-Done (Christensen)** | Used as persona/lesson tagging | meta — all lessons |

---

## 7. Tools & integrations touched

| Tool / integration | Lessons |
|---|---|
| **MCP** (Claude Desktop, Cursor, Codex, Claude Code) | T6 entire track |
| **Slack / Teams / Google Chat / Webhooks** | T1.M1.6 |
| **Terraform / CDK / Pulumi** | T5.M5.6 |
| **SAML providers** (Okta, Azure AD, OneLogin) | T3.M3.2 |
| **Google OAuth / GitHub OAuth** | T3.M3.2 |
| **AWS CloudTrail / Pricing API / Cost Explorer** | T2.M2.2, T3.M3.5 |
| **GCP Cloud Logging / Cloud Monitoring / BigQuery** | T2.M2.2, T3.M3.5 |
| **Azure Activity Log / Azure Monitor / Cost Management** | T2.M2.2, T3.M3.5 |
| **Credly** (badge issuance) | meta — cert flow |
| **Algolia** (search) | meta — V1 platform |
| **Discourse** (Q&A) | meta — V1 platform |
| **Figma** (asset source) | meta — visual style |
| **Infracost** | T5.M5.6 (pre-merge cost gate) |
| **FOCUS spec** (FinOps Open Cost & Usage) | T0.M0.1, T4.M4.1 |

---

## 8. Cross-track topic graph (where the same concept reappears at increasing depth)

Spaced practice is intentional. The same concept shows up at concept-level (T0), product-level (T1–T3), domain-level (T4–T5), and recipe-level (T6). The learner sees it four times.

### Example 1: Tagging
| Level | Lesson | What gets added |
|---|---|---|
| Concept | T0.M0.1 lesson 4 | What tags are, how they attribute cost |
| Product (Operator) | T1.M1.2 lesson 3 | Grouped type dropdown + filter |
| Product (Engineer) | T2.M2.8 (all 4) | Auto-tagging with env + noStop predictions |
| Product (Architect) | T3.M3.5 lessons 3–4 | Tag attribution + Tag coverage widget |
| Domain | T5.M5.1 (all 5) | Tag *strategy* — surviving reorgs, minimum viable tag set |
| Recipe | T6.M6.4 recipe 6 | "Untagged spend by provider" via MCP |

### Example 2: Anomaly detection
| Level | Lesson |
|---|---|
| Concept | T0.M0.6 ("detect-and-act") |
| Product | T2.M2.10 (5 lessons — dimensions, methods, severity, root cause, suppression) |
| Domain | T4.M4.5 (response playbook) |
| Recipe | T6.M6.4 recipe 7 (this week's anomalies via MCP) |

### Example 3: K8s workloads
| Level | Lesson |
|---|---|
| Concept | T0.M0.5 ("K8s is part of the bill") |
| Product (Operator) | T1.M1.2 (parent-child) |
| Product (Engineer) | T2.M2.6 (all 6 — scheduling Deployment/STS/CronJob) |
| Domain | T5.M5.3 (all 6 — requests/limits/HPA/idle/single-replica/security signals/orphan PVCs) |

### Example 4: RBAC
| Level | Lesson |
|---|---|
| Product (Architect) | T3.M3.1 (all 6) |
| Domain | T4.M4.1 (governance as a FinOps practice) |
| Tool | T6.M6.3 (PAT scoping) |

### Example 5: Cost flow / showback
| Level | Lesson |
|---|---|
| Concept | T0.M0.1 ("the bill is a stack of dollars per dimension") |
| Product (Architect) | T3.M3.5 (Org/Teams/Tags) · T3.M3.8 (Sankey) |
| Domain | T4.M4.2 (showback vs chargeback) · T4.M4.3 (unit economics) |
| Recipe | T6.M6.4 recipe 4 (team-level showback via MCP) |

---

## 9. Reference library — every topic enumerated

### 9.1 Rule catalog (490 rules)

By category (counts approximate):
| Category | Count | Where taught |
|---|---|---|
| Idle | ~110 | T2.M2.1, T2.M2.3 |
| Rightsizing | ~120 | T2.M2.1, T2.M2.4 |
| Schedule | 6 (carved) — RC-015, 093, 110, 189, 213, 1302 | T1 all + T2.M2.1 |
| Orphan | ~60 | T2.M2.1 |
| Compliance | ~50 | T2.M2.1 |
| Discount | ~20 | T4.M4.7 |
| Security (K8s) | ~20 per provider × 3 = ~60 | T5.M5.3 |
| Reliability (K8s) | ~10 per provider × 3 = ~30 | T5.M5.3 |
| Governance (tagging) | ~10 | T5.M5.1 |
| Autoscaler | 6 (RC-ASC-001..006) | T2.M2.4 |
| Bedrock | 10 (RC-1601..1610) | T2.M2.1 |

### 9.2 Glossary (~120 terms — full A–Z in `01_INFORMATION_ARCHITECTURE.md` §5.2)

### 9.3 CDCR patterns (15)
P-01 Off-hours scheduling · P-02 Scale-to-zero with HPA · P-03 Tag-then-allocate · P-04 Adopt-then-replace · P-05 Progressive autonomy · P-06 Approval-gated remediation · P-07 Pre-scale for events · P-08 Anomaly response with root-cause + redistribution suppression · P-09 Unit economics overlay · P-10 Tag-coverage trending · P-11 Per-team budget pyramid · P-12 Multi-account cost rollup · P-13 Freeze-window override · P-14 Cost incident commander · P-15 MCP recipe library for self-serve answers

### 9.4 Worked examples (~25)
EC2 idle savings · ASG smart-default from Welford P95 · K8s Deployment cost via requests/limits/HPA · Azure amortized cost (3-yr RI on D8s_v3) · Cost-per-MAU for SaaS · Multi-AZ RDS cost-vs-risk · Spot RI break-even · Tag-attribution arithmetic for shared services · Forecasting accuracy on real quarterly data · Cost-per-1K-API-requests · Effective discount under realistic utilization · Currency conversion (GBP→USD, INR→USD) · Anomaly z-score calculation · Budget threshold escalation path arithmetic · Tag coverage trend (90 days) · ECS Application Auto Scaling target tracking math · GCP MIG cooldown trade-off · Azure VMSS metric trigger arithmetic · CronJob suspension cost impact · Storage class downgrade savings (gp2→gp3) · NAT GW data-processing cost · GCS standard→nearline savings · S3 lifecycle transition arithmetic · Reserved vs Spot break-even for stable workloads · MCP cost (per-query cost of running an agent recipe)

---

## 10. Out-of-scope — what we explicitly DO NOT teach

This list protects scope and time. Each entry is a topic an adjacent curriculum covers; we point to that curriculum instead of building the lesson.

| Topic | Why we skip | Where we point |
|---|---|---|
| **Terraform DSL** | Too deep, off-mission | HashiCorp Learn |
| **CDK / Pulumi DSLs** | Too deep, off-mission | AWS CDK docs, Pulumi docs |
| **General cloud architecture (well-architected pillars beyond cost)** | Too broad | AWS Well-Architected Framework |
| **Specific Snowflake / Datadog / OpenAI cost** | We're infra-cost focused; multi-vendor SaaS cost is Vantage's beat | Vantage Cloud Cost Handbook |
| **ML model training cost (deep)** | Specialized; would dilute the FinOps focus | dedicated MLOps curricula |
| **Oracle Cloud / IBM Cloud / Alibaba Cloud** | Not in product scope | n/a |
| **Snowflake University-style data engineering** | Out of FinOps + cloud-cost domain | Snowflake University |
| **CI/CD pipelines** | Out of scope (except as they touch cost via Infracost) | HashiCorp Learn, GitHub Actions docs |
| **Service mesh / observability tracing** | Out of scope | HashiCorp Consul docs, OpenTelemetry |
| **Application architecture / microservices design** | Out of scope | Martin Fowler, "Building Microservices" by Newman |
| **Security pentesting beyond cost-relevant signals** | Out of scope | OWASP, dedicated security training |
| **Federal FedRAMP-specific compliance** | We're not certified; commercial-first | NIST 800-53 / FedRAMP docs |

---

## 11. Topics seen in surveyed Universities that we explicitly included or skipped

### From AWS Skill Builder
| Their topic | Our decision |
|---|---|
| Cloud Practitioner foundational track | **Adopted shape** — T0 plays the same role for cloud cost |
| AWS Jam labs (gamified) | **Skipped V1** — sandbox labs only; AWS Jam UX is out of scope |
| Cloud Quest game | **Skipped V1** |
| AWS Cloud Financial Management Learning Plan | **Adopted topics** — folded into T0 + T4 |
| Multi-tier certs (Foundational/Associate/Pro/Specialty) | **Reduced to 3** (Operator/Engineer/Architect) — three tiers is enough at our scale |

### From HashiCorp Learn
| Their topic | Our decision |
|---|---|
| "Get Started" lane per product | **Adopted** — T1 is our Get Started for ZopNight |
| Browser-hosted terminal | **Adopted concept** — sandbox simulator in T2 |
| Tutorial collections by use case | **Adopted partly** — our "CDCR patterns" play the same role |
| Per-product split | **Skipped** — we have one product, organize by tier + domain |

### From Snowflake University
| Their topic | Our decision |
|---|---|
| 12 role-based journeys | **Reduced to 5** — Platform Eng / FinOps Analyst / Eng Leader / Finance Partner / Security |
| Hands-On Essentials badges | **Adopted** — module-level badges in our cert flow |
| Multi-level SnowPro certs (Core / Specialty / Advanced × 5) | **Reduced to 3 tiers** |
| Practice exams | **Roadmap, not V1** |

### From FinOps Foundation
| Their topic | Our decision |
|---|---|
| 4 domains × 22 capabilities | **Anchored T4 to all 22** (see §5) |
| FOCP cert | **Referenced** as a peer credential; we recommend FOCP for FinOps Analysts |
| FOCUS spec | **Referenced** in T0.M0.1 and T4.M4.1 |
| Crawl / Walk / Run | **Adopted** in T4.M4.1 |
| Personas (Practitioner / Engineering / Finance / Leadership / Procurement / Product) | **Mapped to our J1–J5** (we collapse Procurement + Product into Finance Partner for V1) |

### From Saviynt University
| Their topic | Our decision |
|---|---|
| Free entry-level cert (ISAA) | **Adopted** — Operator cert is free |
| Paid Professional + Advanced certs | **Adopted shape** — Engineer paid for non-customers, Architect application-based |
| Partner badge tiers (Certified / Gold / Platinum) | **Skipped V1** — revisit when we have a partner channel |
| Hands-On Labs ($1,000 / 30 days) | **Skipped paid labs** — free sandbox for V1 |
| Learning Passes + bundles | **Skipped** — too SaaS-vendor-shaped for V1; revisit |

### From Vantage University
| Their topic | Our decision |
|---|---|
| Feature-mapped video lessons | **Adopted shape** — T1 maps 1:1 to product features |
| 3 role tracks (Analyst / Dev / Finance) | **Expanded to 5** — added Eng Leader + Security |
| Video-first | **Mixed format** — concept + demo + hands-on + quiz; videos optional per lesson |
| No certs | **Diverged** — we add certs because customers expect them |

---

## 12. Net-new topics nobody else teaches (our moat, made explicit)

These topics exist in **none** of the six surveyed Universities. They become flagship lessons with the "Only at ZopDev University" chip.

1. **CDCR as a discipline** — the framing of "detect-and-act" as a named practice (T0.M0.6)
2. **The two-source cost model** (Rack + Billing + amortized Azure) (T0.M0.4)
3. **Permission Visibility as a first-class topic** (T1.M1.1)
4. **K8s Deployment/StatefulSet/CronJob scheduling** (T2.M2.6)
5. **Databricks Workspace / Cluster / Pool / SQL Warehouse scheduling** (T2.M2.7)
6. **Adopt-or-replace for existing cloud-side scaling policies** (T2.M2.5)
7. **Progressive autonomy spectrum (monitor → recommend → autopilot)** (T2.M2.4)
8. **Auto-remediation with three-class error taxonomy + DB denylist** (T2.M2.3)
9. **Event Readiness — pre-scale for planned events** with monitor-only DBs (T2.M2.9)
10. **Anomaly detection with redistribution suppression** (T2.M2.10)
11. **Adopt-then-replace + restore byte-accuracy** as a governance pattern (P-04)
12. **MCP for cloud cost ops** — entire track (T6)
13. **The 15-recipe MCP library** (T6.M6.4)
14. **What's NOT writable via MCP** — the architectural commitment lesson (T6.M6.6)
15. **Cost incident commander** as a named role (T5.M5.7)

---

## 13. Topic prioritization for Phase 1 (the first 10 weeks)

When we ship Phase 1 (T0 + T1, ~55 lessons), these 30 topics are the absolute must-have. The rest are stretch.

1. The cloud bill, decoded · 2. CUR/Cost Explorer/Cost Mgmt/BigQuery · 3. Top-10 cost mistakes · 4. FinOps Foundation 6 principles · 5. Inform/Optimize/Operate · 6. The math of scheduling (168 hrs) · 7. Rack rate vs billing vs amortized · 8. Multi-cloud taxonomy · 9. CDCR introduction · 10. Connect a cloud account · 11. AWS IAM for ZopNight · 12. GCP service account / Azure SPN · 13. Permission Visibility · 14. Resource discovery · 15. Parent-child hierarchy · 16. Grouped account + grouped type filter · 17. Manual start/stop · 18. Build a schedule · 19. Cron expressions · 20. Weekly 24-hr grid · 21. Three preset schedules · 22. Attach resources + groups · 23. Savings estimator · 24. Resource groups · 25. Bulk member add/remove · 26. Sequenced execution · 27. Overrides (all 4 lessons) · 28. State history timeline · 29. Notifications · 30. Audit log basics

These 30 topics, taught well, prove the curriculum is real. Everything else can land in waves.

---

## 14. Open questions surfaced by the compendium

1. **Sustainability** — FinOps Foundation has it as a capability. We touch it lightly in T4.M4.1. Build a full M4.8 in V2?
2. **FOCUS spec depth** — currently referenced. Worth a dedicated lesson in T0?
3. **Sub-brand campuses (ZopDay, ZopCloud)** — keep greyed in V1 as planned, or commit a stub lesson now?
4. **Bedrock / ML cost** — we have rules for it. A dedicated Bedrock module in T2 (M2.11) or fold into existing modules?
5. **Watcher (async cluster ops)** — currently a noted gap. Skip in V1?
6. **Sustainability + carbon-aware computing** — emerging topic. Lesson now or later?
7. **Continuing-education credit** — Snowflake/Saviynt offer CE credits; do we apply?

---

**End of compendium.** Three files now define the full picture:
- `00_PLAN.md` — strategy, framework, phasing
- `01_INFORMATION_ARCHITECTURE.md` — every URL, every lesson
- `02_TOPIC_COMPENDIUM.md` (this file) — every topic, every domain, multi-axis coverage check

Approve any open questions in §14 and we move to Phase 0 file generation.
