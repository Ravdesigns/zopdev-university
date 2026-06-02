# Shared services accounts

§ T5 · M5.4 · L2 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **design** a shared-services account for cross-cutting infrastructure, **decide** what should be centralized vs team-owned, **and allocate** the shared cost back to consuming teams.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Centralize the infrastructure that every team needs — DNS, monitoring, registry — in a shared account, so teams don't duplicate it 5x." |
| **Personas** | Platform Engineer · FinOps Lead · DevOps Engineer |
| **Prerequisites** | M5.4.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Design (Create), Decide (Evaluate), Allocate (Apply) |

---

## 1. Concept

Shared services account: a dedicated cloud account for infrastructure used by multiple teams. The opposite of every-team-runs-their-own-Prometheus. Centralized; managed by a platform/SRE team; cost-attributed back to consumers.

```
WHAT GOES IN SHARED SERVICES:
  DNS                  (Route 53 / Cloud DNS / Azure DNS)
  Monitoring            (Prometheus, Grafana, Datadog backend)
  Logging aggregation   (ELK, Splunk, Loki, CloudWatch destination)
  Security tools        (CSPM, SIEM, vulnerability scanners)
  Internal CA           (private cert issuance)
  Container registry    (ECR, GCR, ACR, Artifactory)
  Artifact storage      (binaries, packages, ML models)
  Build / CI            (Jenkins, GitLab Runners, Buildkite agents)
  Secrets management    (Vault, AWS Secrets Manager hub)
  Identity provider     (Okta, internal SAML)
```

These are infrastructure-of-infrastructure — services every team needs but shouldn't manage themselves.

### Why a separate account

```
ISOLATION
  Each team's resources don't depend on another team's account
  Outage in team-A doesn't break monitoring for team-B
  
BILLING
  Shared cost in one account; clear visibility
  Easy to identify "infra overhead" line item
  
SECURITY
  Centrally managed; tight access controls
  Only platform/security teams have full access
  Other teams have read-only or service-specific access
  
MAINTENANCE
  Dedicated team owns the account
  Single source of truth for ops procedures
  Version updates, patches, scaling centralized
  
COMPLIANCE
  Centralized control over security/audit tools
  Clear data flow for SOC 2 / ISO audit
  Reduced blast radius across team accounts
```

The shared-services pattern is one of the strongest cost + ops levers at scale.

### What typically goes where

```
DEFINITELY in shared services:
  ✓ DNS (Route 53, etc.)
  ✓ Monitoring/observability platform
  ✓ Log aggregation
  ✓ Security tooling (CSPM, SIEM)
  ✓ Container/artifact registry
  ✓ Internal CA
  ✓ Identity provider integration

PROBABLY in shared services:
  ~ CI/CD infrastructure (centralized = leverage; per-team = autonomy)
  ~ Secrets management (centralized = security; per-team = friction)
  ~ Network appliances (firewall, transit gateway)

PROBABLY NOT in shared services:
  ✗ Team-specific databases
  ✗ Team-specific compute
  ✗ Team's applications
  ✗ Team's data stores

CASE-BY-CASE:
  ? Backup infrastructure (often centralized for compliance)
  ? Disaster recovery (mixed; depends on RPO/RTO)
  ? Cost-attribution tools (ZopNight itself often in shared)
```

The discipline: "would this be duplicated if every team owned it?" If yes, shared services. If team-specific, stays with the team.

### Cost attribution back to teams

Shared services has a cost; that cost should flow back to consumers:

```
TYPICAL SHARED SERVICES COST:
  ~3-10% of total org cloud spend
  Mid-size org ($500K/mo cloud): $15K-$50K/mo shared services
  
ALLOCATION OPTIONS:

OPTION A — EQUAL SPLIT BY TEAM
  Cost / N teams = cost per team
  Simple; easy to communicate
  Fair if teams' usage is roughly equal
  
OPTION B — PROPORTIONAL TO USAGE
  Each team's % of total compute = their share of shared services
  More accurate; harder to calculate
  Use ZopNight to compute attribution
  
OPTION C — PROPORTIONAL TO HEADCOUNT
  Each team's engineers / total = their share
  Aligns with team size; ignores actual usage
  Simple to update
  
OPTION D — TREAT AS OVERHEAD
  Don't allocate; absorb into platform team budget
  Simplest; transparent
  Risk: teams don't see the cost; over-consume
  
OPTION E — METERED USAGE (advanced)
  Per-service metering
  Datadog: per-host charges back
  Logging: per-GB back
  Complex; matches Vendor pricing
  
RECOMMENDATION:
  Small orgs (<50 engineers): Option D (overhead)
  Medium (50-200): Option C (headcount-proportional)
  Large (200+):    Option B or E (usage-proportional)
```

The allocation drives behavior — teams optimize where they see cost.

### Operating model

```
WHO MANAGES shared services account:

OPTION A — DEDICATED PLATFORM TEAM
  Best for: medium-large orgs
  Team size: 2-10 engineers
  Owns: all shared services, lifecycle
  
OPTION B — SRE / OPS TEAM
  Best for: smaller orgs
  Team: existing SRE adds shared-services responsibility
  
OPTION C — DISTRIBUTED OWNERSHIP
  Best for: small orgs
  Each shared service has a "service owner" team
  Platform team coordinates
  Risk: no one feels accountable

ACCESS MODEL:
  Owning team: full admin
  Other engineering teams: read + specific service access
  Security: read everything (audit)
  Finance: read billing
  
  Cross-account IAM (federation) makes this work.
```

The dedicated-team pattern scales best. Distributed ownership works for small orgs but breaks at scale.

### Avoiding duplication — the key win

```
BEFORE shared services (anti-pattern):
  Team A runs their own Prometheus  ($800/mo)
  Team B runs their own Prometheus  ($800/mo)
  Team C runs their own Prometheus  ($800/mo)
  ...
  Team J runs their own Prometheus  ($800/mo)
  
  Total: 10 teams × $800 = $8,000/mo
  Operational: 10 teams × 1 hour/wk maintaining = 10 hrs/wk
  Knowledge: 10 different Prometheus configs; can't share dashboards

AFTER shared services:
  ONE Prometheus in shared services account ($2,500/mo at scale)
  Teams send metrics; consume dashboards
  
  Total: $2,500/mo
  Operational: 1 platform engineer × 5 hrs/wk
  Knowledge: shared dashboards; shared best practices

SAVINGS:
  Direct: $8,000 - $2,500 = $5,500/mo = $66K/yr
  Indirect: 5 hours/week of platform engineering time
            ~$25K/yr in engineer cost
  
TOTAL: ~$91K/yr saved + ecosystem benefits
```

The "infrastructure of infrastructure" multiplied by team count = significant duplication. Centralization is the highest-leverage cost lever.

### When NOT to use shared services

```
DON'T centralize when:

ONE-TEAM TOOL
  Only one team uses it
  Belongs in that team's account
  Centralizing adds friction without benefit
  
TEAM-SPECIFIC DATA
  Tool processes team's private data
  Centralizing creates compliance complexity
  
PERFORMANCE-CRITICAL
  Latency / colocation matters (need to be in team's region)
  Centralizing adds network latency
  
EXPERIMENTAL / SHORT-LIVED
  Team experimenting with a new tool
  Centralize after it proves out (1-2 quarters)
  
HIGHLY CUSTOMIZED
  Each team needs different config
  Centralization removes the customization
  Per-team works better in this case
```

The discipline: don't centralize for centralization's sake. Each tool has a fit decision.

### Compliance + audit benefits

```
SHARED SERVICES has its own:
  ✓ IAM (often more restrictive than team accounts)
  ✓ Audit log (separate from team accounts)
  ✓ Compliance scope (sometimes the entire compliance boundary)
  ✓ Network boundary (different VPC, security groups)
  ✓ Backup/DR posture
  
OFTEN REQUIRED FOR:
  SOC 2 — centralized security tools, audit logs
  ISO 27001 — centralized access controls
  PCI DSS — centralized monitoring + alerting
  HIPAA — centralized audit + key management
  
COMPLIANCE BENEFIT:
  Auditor sees ONE account with security tools
  Vs. having to audit security in every team's account
  Significantly reduces audit complexity
```

For regulated orgs, shared services is often required, not optional.

### Migration — getting to shared services

If you don't have it yet:

```
PHASE 1 (Quarter 1) — IDENTIFY + PLAN
  Audit each team's tools:
    What does every team run?
    What's the duplication?
  Pick top 3 candidates for centralization
  Get platform team buy-in

PHASE 2 (Quarter 2) — BUILD SHARED SERVICES ACCOUNT
  Provision the account
  Set up IAM + access controls
  Deploy first centralized service (e.g., Prometheus)
  Document migration pattern

PHASE 3 (Quarter 3-4) — MIGRATE TEAMS
  Pick a pilot team (most-engaged)
  Migrate their Prometheus to centralized
  Document gotchas; improve pattern
  Roll out to remaining teams (2-3/quarter)

PHASE 4 (Year 2) — EXPAND
  Migrate next service (logging, registry, etc.)
  Build cost-attribution
  Quarterly review

OUTCOME after 18 months:
  Most duplicated infrastructure centralized
  Platform team owns operational burden
  Teams focus on their workloads
  Cost: 30-50% reduction in infra-of-infra
```

The migration is gradual; the benefit compounds.

---

## 2. Demo

A real org's shared services account:

```
ORG: 8 AWS accounts, 200-engineer SaaS

ACCOUNT STRUCTURE:
  acme-management            (Organizations + billing)
  acme-shared-services       ← THIS ONE
  acme-prod                  (production resources)
  acme-staging
  acme-dev                   (multi-team dev)
  acme-experiments
  acme-security              (centralized audit logs)
  acme-sandbox

SHARED SERVICES CONTAINS:
  
  DNS:
    Route 53 hosted zones (all customer-facing DNS)
    Internal DNS resolution
    
  Monitoring:
    Datadog ingest endpoints (all teams ship metrics here)
    Custom Prometheus federation
    Internal Grafana
    
  Logging:
    CloudWatch logs (centralized destination)
    OpenSearch cluster for log search
    
  Security tooling:
    AWS Inspector, GuardDuty
    Wiz scanner
    Internal vulnerability tracking
    
  Container registry:
    ECR with all org images
    Image scanning before push
    
  Secrets:
    Centralized secrets manager (HashiCorp Vault)
    Cross-account secret access via federated IAM
    
  CI/CD:
    GitHub Actions self-hosted runners
    Buildkite agents
    Centralized build cache

TOTAL COST: $18K/month (shared services account)

ALLOCATION (Option C — proportional to team headcount):
  60% to engineering teams ($10.8K)
  30% to product/data teams ($5.4K)
  10% to ops/security ($1.8K)
  
  Each team's monthly bill reflects their share.
  Quarterly review with finance.

OUTCOME (1 year in):
  Clean separation; teams focus on their workloads
  Platform team (5 engineers) owns the shared services
  Compliance: SOC 2 audit easier; single compliance boundary
  Cost: 40% reduction vs duplicated per-team tools
        (estimated $7K/mo savings = $84K/year)
  
  Migration: $5K of platform engineering time over 6 months
  ROI: 17:1 in year 1; ongoing
```

The pattern is repeatable across orgs of similar size.

---

## 3. Hands-on (5 min)

Audit your org for shared-services opportunities:

```
□ STEP 1: List tools each team runs
  Team 1 runs: __________
  Team 2 runs: __________
  Team 3 runs: __________
  ...

□ STEP 2: Identify duplication
  Same tool across teams:
    __________ (N teams running this)
    __________ (N teams running this)
    __________ (N teams running this)

□ STEP 3: Estimate centralization savings
  Tool 1: N teams × $___/mo each = $_____/mo
          Centralized: $_____/mo
          Savings: $_____/mo
  Tool 2: ...

□ STEP 4: Plan first migration
  First tool to centralize: __________
  Owner: __________
  Timeline: __________

□ STEP 5: Allocation method
  □ Equal split
  □ Headcount-proportional
  □ Usage-proportional
  □ Overhead absorb
```

A 30-minute audit finds the centralization opportunities. Start with the highest-duplication tool.

---

## 4. Knowledge check

### Q1
Each team runs their own Prometheus:

A. Optimal for autonomy
B. Anti-pattern — duplication. Shared services with single Prometheus instance saves cost (30-50%) AND reduces operational burden (1 owner vs N). Teams share dashboards + best practices.
C. Random
D. Required

<details>
<summary>Show answer</summary>

**Correct: B.** Centralize the infrastructure of infrastructure.
</details>

### Q2
Shared services account size as % of total org spend:

A. >50%
B. Typically 3-10% of total org cloud spend. Includes DNS, monitoring, logging, security tooling, container registry, internal CA, identity. Centralization keeps it bounded; without shared services, this expands as duplication.
C. Random
D. <1%

<details>
<summary>Show answer</summary>

**Correct: B.** 3-10% typical; bounded by centralization discipline.
</details>

### Q3
A tool used by ONE team only:

A. Move to shared services anyway
B. Stays in that team's account. Centralizing single-team tools adds complexity without benefit. Shared services pattern: tool used by 2+ teams AND duplicated AND infrastructure-of-infrastructure. Single-team tools fail those tests.
C. Random
D. Delete

<details>
<summary>Show answer</summary>

**Correct: B.** Single-team tools stay with the team.
</details>

---

## 5. Apply

ZopNight surfaces per-account spend. Identify duplication; centralize; allocate cost back. Most orgs find $5K-50K/mo savings in centralization opportunities.

For your team: pick the most-duplicated tool; migrate first; pattern compounds.

---

## Related lessons

- [L1 — Per-team vs per-env accounts](L1_per_team_or_env.md)
- [L3 — Network egress costs](L3_network_egress.md) *(next)*
- [L4 — Cross-account scheduling](L4_cross_account_schedule.md)
- [L5 — Consolidate or split](L5_consolidate_or_split.md)
- [M5.5 — Reliability vs cost](../M5.5_reliability_vs_cost/00_README.md)

## Glossary terms touched

[Shared services account](../../../reference/glossary/shared-services-account.md) · [Centralized monitoring](../../../reference/glossary/centralized-monitoring.md) · [Cost allocation method](../../../reference/glossary/cost-allocation-method.md) · [Infrastructure of infrastructure](../../../reference/glossary/infrastructure-of-infrastructure.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.4.L2
