# Per-team vs per-env accounts

§ T5 · M5.4 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **choose** between per-team and per-environment account axes, **evaluate** the hybrid (per-team × per-env) option, **and assess** the trade-offs (isolation, ops overhead, blast radius).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Design our cloud-account structure to match how our org actually operates — strong team boundaries, strong env boundaries, or both?" |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Manager |
| **Prerequisites** | T0.M0.1 (cloud basics) · M5.1 (tagging) |
| **Time** | 9 minutes |
| **Bloom verb** | Choose (Evaluate), Evaluate (Evaluate), Assess (Analyze) |

---

## 1. Concept

Cloud accounts (AWS) / projects (GCP) / subscriptions (Azure) are the strongest isolation boundary. They define billing, RBAC blast radius, network defaults, quota limits. The structure you pick determines who can do what to whom, and how cost rolls up.

```
TWO PRIMARY AXES:

PER-ENV    accounts split by environment (dev/stage/prod)
            regardless of team
            
PER-TEAM   accounts split by team
            regardless of env
            
HYBRID     per-team × per-env (e.g., team-A-prod, team-A-stage, etc.)
```

The choice matters for the long-term operational model.

### Per-env structure

```
ACCOUNTS:
  acme-prod        production for ALL teams
  acme-staging     staging for ALL teams
  acme-dev         dev for ALL teams
  acme-shared      shared services (DNS, observability)
  
PROS:
  Clear env boundaries (security, IAM policies, network)
  Easy to apply env-specific policies (e.g., prod = read-only IAM
                                       for engineers)
  Compliance scope is the prod account
  Fewer accounts to manage operationally
  
CONS:
  Teams share an account in each env
  Per-team accountability blurs (resources tagged but not isolated)
  Resource limits (quotas) shared across teams
  IAM gets complex (per-team policies within the env account)
  One team's runaway cost affects others' quota headroom
```

Per-env works best for: smaller orgs (10-50 engineers), strong env-level compliance needs, teams that don't operate independently.

### Per-team structure

```
ACCOUNTS:
  acme-platform-team    all envs for platform team
  acme-product-team     all envs for product team
  acme-data-team        all envs for data team
  acme-ops-team         all envs for ops/SRE
  acme-shared           shared services
  
PROS:
  Clear team accountability (one account = one team)
  Team's resources fully isolated
  Team owns their full env stack
  IAM scoped per team (simpler within account)
  Cost roll-up trivially per team
  
CONS:
  Env boundaries inside accounts blur
  Harder to apply env-specific compliance policies
  Each team owns their dev/stage/prod (more responsibility)
  More accounts to manage (one per team)
```

Per-team works best for: orgs with strong team autonomy, microservices architecture, teams that operate independently.

### Hybrid — per-team × per-env

```
ACCOUNTS (5 teams × 3 envs = 15 accounts):
  acme-platform-prod
  acme-platform-stage
  acme-platform-dev
  acme-product-prod
  acme-product-stage
  acme-product-dev
  ... etc
  
PROS:
  Best blast radius (one account compromise = one team × one env)
  Cleanest compliance scope (prod accounts only)
  Cleanest cost roll-up (team and env both clear)
  Resource quotas isolated per team-env combo
  Most operational flexibility
  
CONS:
  Highest account count (5 teams × 3 envs = 15; for 20 teams: 60 accounts)
  Operational overhead: account provisioning, IAM, audit
  Cross-account complexity (more transit gateways, more roles)
  Higher chance of mis-configuration
  Cloud cost: some per-account fees / NAT gateway duplication
```

Hybrid works best for: large orgs (100+ engineers), regulated industries, mature platform teams that can handle the account-level operations.

### Pick based on org structure — the decision matrix

```
ORG CHARACTERISTICS                       RECOMMENDED AXIS
─────────────────────────────────────────────────────────────
Strong team boundaries, weak env           Per-team
  (Each team owns dev→prod independently)
  
Strong env boundaries, weak team           Per-env
  (Engineers move between teams; envs are
   the immutable boundary)
   
Both strong                                Hybrid
  (Regulated; many independent teams;
   mature platform team)
   
Small org (<20 engineers)                  Per-env (start simple)
  (Not enough teams to justify per-team)
  
Multi-tenant SaaS                          Per-tenant (or hybrid)
  (Customer isolation may demand it)
  
M&A integration                             Per-acquired-co initially
  (Then consolidate over 1-2 years)
```

There's no single right answer; the structure should match the org's operational reality.

### Trade-offs at a glance

```
                              MORE ACCOUNTS    FEWER ACCOUNTS
                              (per-team or     (per-env)
                               hybrid)
─────────────────────────────────────────────────────────────
Isolation                     Better            Lesser
Per-team billing clarity      Trivial            Tag-based
Quota headroom                Per-account       Shared
Compliance flexibility        Per-account       Account-wide
Operational overhead          Higher            Lower
IAM complexity                Per-account        Within account
Cross-account routing         More              Less
Org-wide audits               More accounts      Fewer accounts
                              to traverse        to audit
NAT gateway / VPN cost        Duplicated        Shared
Engineer onboarding           Account per team   One account
                              to learn          per env
```

The trade-off pivots on isolation-vs-overhead. More isolation = more operations.

### Pattern — start simple, evolve

Most orgs evolve through these patterns:

```
PHASE 1 (startup, <20 engineers):
  Single account
  All teams share
  Tags for cost attribution
  
PHASE 2 (growth, 20-50 engineers):
  Per-env accounts (dev / stage / prod)
  All teams share each env
  Clear env policies
  
PHASE 3 (scale-up, 50-100 engineers):
  Per-env + shared-services account
  Teams that justify it: get their own per-team prod
  Per-team policies emerge
  
PHASE 4 (mature, 100+ engineers):
  Hybrid (per-team × per-env)
  Strong team accountability
  Platform team manages account lifecycle
  Service catalog for new-team account creation

DON'T jump to Phase 4 too early — the operational overhead is real.
```

The evolution is gradual; over-engineering early is more costly than re-organizing later.

### Account-level concerns

```
PER-ACCOUNT THINGS:
  ✓ Billing (one bill per account; consolidated to org)
  ✓ IAM (users, roles, policies; some federated across accounts)
  ✓ Resource quotas (per service, per region, per account)
  ✓ Compliance posture (per account audit boundary)
  ✓ Network (VPC, subnets, default routing per account)
  ✓ Some services (e.g., AWS Organizations features) are org-wide

CROSS-ACCOUNT CONCERNS:
  ✗ Direct resource access (must be granted via role assumption)
  ✗ Network connectivity (Transit Gateway, peering, PrivateLink)
  ✗ DNS resolution (Route 53 zone sharing, etc.)
  ✗ Cost (NAT gateway per VPC; some duplication)
```

The friction comes from cross-account work. The benefits come from isolation.

### Cost implications

```
COST IMPACT OF ACCOUNT STRUCTURE:

PER-ENV (fewer accounts):
  Lower per-account overhead
  But: harder team-level cost attribution
  Cost: ~$50/mo per account in baseline (NAT, etc.)
  3 accounts: $150/mo baseline
  
PER-TEAM (more accounts):
  Higher per-account overhead
  Clearer team-level attribution
  5 accounts: $250/mo baseline
  
HYBRID (most accounts):
  Highest per-account overhead
  15+ accounts: $750-$1,500/mo baseline
  
  But: NAT gateways, VPNs can be shared via Transit Gateway
       Inspection / firewall costs may dominate; harder to share
```

For most orgs, account-level overhead is small relative to compute. Don't let the overhead drive structure decisions.

---

## 2. Demo

A real org's account-structure decision:

```
ORG: 5-team, 3-env mid-size SaaS company

CURRENT STATE (Phase 1):
  Single AWS account
  All teams + all envs in one account
  Tags for cost attribution (working but blurry)
  IAM getting complex

DECISION POINT (50-engineer growth):
  Need to evolve. Three options considered.

OPTION A — PER-ENV (3 accounts):
  acme-dev, acme-staging, acme-prod
  Pros: simple; clear env compliance
  Cons: per-team accountability still blurry
  Overhead: 3 accounts to manage
  
OPTION B — PER-TEAM (5 accounts):
  acme-platform, acme-product, acme-data, acme-ops, acme-experiments
  Pros: clear team ownership
  Cons: env policies harder; dev/stage/prod blur within
  Overhead: 5 accounts
  
OPTION C — HYBRID (15 accounts):
  Per team × per env
  Pros: full isolation
  Cons: 15 accounts is a lot for a 50-engineer org

DECISION FACTORS:
  ✓ Team boundaries: medium (some autonomy, but co-dependent)
  ✓ Compliance: SOC 2 (prod scope; per-env helps)
  ✓ Team count: 5 (manageable)
  ✓ Operational maturity: medium (platform team of 3 people)
  ✓ Cost discipline: improving (need clarity)

CHOSEN: Option A (per-env) with a roadmap to hybrid

REASONING:
  Per-env now solves compliance + simplicity
  Cost attribution via tags works for current size
  Hybrid is the 2-year goal as platform team matures
  Evolve gradually, not all at once

EXECUTION (Q1 2026):
  Week 1-2: Set up acme-staging + acme-dev accounts
  Week 3-4: Migrate dev/staging resources from monolithic acct
  Week 5-6: Migrate prod resources (with cutover plan)
  Week 7-8: Decommission monolithic; finalize IAM
  
  Result: 3 accounts (dev / stage / prod)
          Tag-based per-team attribution
          Per-env compliance policies clean
          
ROADMAP (2027):
  Re-evaluate per-team accounts as platform team grows
  Likely: per-team accounts for prod (most isolation matters there)
  Dev/staging stay shared (less compliance risk)
  
COST IMPACT of Phase 2 (per-env):
  +$100/mo baseline (2 new accounts)
  But: per-env policies prevent ~$500/mo of dev-into-prod mishaps
  Net: positive
```

The evolution matches the org's actual maturity, not a theoretical ideal.

---

## 3. Hands-on (5 min)

Sketch your org's account structure on each axis:

```
□ STEP 1: Current state
  Number of cloud accounts: _____
  Structure: __________ (per-env / per-team / hybrid / monolithic)

□ STEP 2: Org assessment
  Team boundaries: □ Strong  □ Medium  □ Weak
  Env boundaries: □ Strong  □ Medium  □ Weak
  Compliance: □ Heavy (SOC 2 / ISO / regulated)  □ Light
  Team count: _____
  Operational maturity: □ Mature  □ Developing  □ Starting

□ STEP 3: Recommend axis (use decision matrix)
  Recommended: __________
  
  IF current state matches: no change needed
  IF different: plan evolution

□ STEP 4: Identify pain points with current structure
  Pain 1: __________
  Pain 2: __________
  Pain 3: __________

□ STEP 5: Plan next phase
  Phase 2 target: __________
  Timeline: __________
  Risks: __________
```

A 30-minute assessment reveals whether the current structure matches the org's reality. Evolution gradual; over-engineering expensive.

---

## 4. Knowledge check

### Q1
An org with strong team boundaries (teams own dev→prod independently):

A. Per-env best
B. Per-team — each team owns their account and full env stack within. Clear accountability; team-level cost trivially rolled up. Per-env would blur the team ownership.
C. Hybrid required
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Per-team for strong team boundaries.
</details>

### Q2
Hybrid (per-team × per-env) accounts:

A. Always the best structure
B. Best isolation BUT highest operational overhead. Right for compliance-heavy, large orgs with mature platform teams. Wrong for small teams (overhead exceeds isolation benefit). Don't over-engineer.
C. Random
D. Equivalent to per-team

<details>
<summary>Show answer</summary>

**Correct: B.** Hybrid is heavy; right for mature orgs only.
</details>

### Q3
Per-env account structure:

A. Strong per-team accountability
B. Makes per-env policies easy (firewall rules, IAM standards per env, compliance scope) but per-team accountability blurry within each account (tags handle the attribution).
C. Always lowest cost
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Per-env trades team accountability for env clarity.
</details>

---

## 5. Apply

ZopNight discovers across all accounts. Choose structure based on org needs, not theoretical ideal. Evolve gradually from monolithic → per-env → per-team → hybrid as org matures.

For your team: assess current vs ideal; plan one phase forward; don't skip phases.

---

## Related lessons

- [L2 — Shared services accounts](L2_shared_services.md) *(next)*
- [L3 — Network egress costs](L3_network_egress.md)
- [L4 — Cross-account scheduling](L4_cross_account_schedule.md)
- [L5 — Consolidate or split](L5_consolidate_or_split.md)
- [M5.1 — Tagging strategy](../M5.1_tagging_strategy/00_README.md)

## Glossary terms touched

[Per-env account structure](../../../reference/glossary/per-env-account.md) · [Per-team account structure](../../../reference/glossary/per-team-account.md) · [Hybrid account structure](../../../reference/glossary/hybrid-account-structure.md) · [Account isolation](../../../reference/glossary/account-isolation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.4.L1
