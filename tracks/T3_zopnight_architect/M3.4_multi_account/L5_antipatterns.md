# Multi-account anti-patterns

§ T3 · M3.4 · L5 of 5 · Architect tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the five most common multi-account anti-patterns, **diagnose** them in your own org, **and outline** a remediation path for each.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Catch the structural mistakes that compound silently into the next architectural rewrite." |
| **Personas** | Platform Engineer · Cloud Architect · Engineering Leader |
| **Prerequisites** | M3.4.L1-L4 (multi-account fundamentals) |
| **Time** | 8 minutes |
| **Bloom verb** | Recognize (Remember), Diagnose (Analyze), Outline (Apply) |

---

## 1. Concept

Five anti-patterns recur across customers. Each is the result of an early shortcut that compounds into structural debt. Recognizing them in your own org is the precondition to fixing them.

```
ANTI-PATTERN 1   One account for everything
ANTI-PATTERN 2   Per-engineer accounts
ANTI-PATTERN 3   Per-microservice accounts
ANTI-PATTERN 4   Prod and non-prod mixed in same account
ANTI-PATTERN 5   No shared services account
```

### Anti-pattern 1 — One account for everything

The most common historical pattern. The company started small, opened one cloud account, and never split it. It works at first; it fails at scale.

```
SYMPTOMS:
  - One IAM blast radius for the entire org
  - Hard to apply different policies per workload
  - Quotas hit harder than they should
  - Billing all rolled up; per-team attribution requires tags
    that are never quite right
  - One tag-misconfigured Terraform run can affect prod
  
PROBLEM SCALE:
  Each of these issues gets worse with team size. By the time
  you notice, you have months of debt to unwind.

FIX:
  Phase 1 (most critical): separate prod from non-prod
    Two accounts; mandatory minimum
  
  Phase 2: separate dev/test/staging
    3-4 accounts; environment isolation
  
  Phase 3: per-team accounts within each env
    15+ accounts for a mid-size org; team accountability
  
  Phase 4: shared services + security + audit
    ~20 accounts; well-architected steady state
```

Each phase delivers value standalone — don't wait until you have time to do all four. Start with prod/non-prod and earn the credibility to keep going.

### Anti-pattern 2 — Per-engineer accounts

The opposite extreme: a well-meaning attempt at isolation that overshoots. "Each engineer gets their own AWS account" sounds clean and quickly becomes operational misery.

```
HISTORICAL CONTEXT:
  Often emerges from a single hard incident (a junior engineer's
  experiment took down prod). The reaction is: never let anyone
  share an account. Per-engineer accounts feel like maximum safety.

SYMPTOMS:
  - 30+ accounts for a 30-engineer team
  - Engineers can't collaborate on shared resources easily
  - Cross-team services impossible
  - Operational overhead enormous (IAM, networking, billing,
    monitoring all multiply by 30)
  - Lock-in to specific engineers (when they leave, their account
    becomes a graveyard)

FIX:
  Per-team accounts, typically 5-12 for a mid-size org. Engineers
  are users within their team's account, sharing infrastructure
  with collaborators. The original incident (a junior breaking
  prod) is fixed by RBAC + production-account access controls,
  not by account proliferation.
```

If you find yourself with per-engineer accounts, the consolidation is multi-quarter work but the operational reduction is significant.

### Anti-pattern 3 — Per-microservice accounts

A similar overreach but at the service granularity. "Microservices = isolation = each service gets an account."

```
SYMPTOMS:
  - 100+ accounts for an estate of 100 microservices
  - Cross-service networking becomes a major project
  - IAM policies multiply: each service needs to access
    shared resources (S3 buckets, secrets, monitoring)
  - Cost: per-cross-account API call, per-cross-account
    networking, per-account standing infrastructure
  - Engineering velocity drops sharply

FIX:
  Group microservices by team OR by environment. A team's
  10-20 microservices share an account. Within the account,
  each service has its own IAM roles, security groups, etc.,
  but they share the account's networking and observability.
  
  Per-env (dev/staging/prod) within per-team is usually the
  right granularity.
```

The microservices-equals-account fallacy comes from confusing two kinds of isolation: service-level (which IAM, security groups, and namespaces provide cheaply) and account-level (which provides blast-radius isolation at much higher operational cost).

### Anti-pattern 4 — Prod and non-prod mixed

The "we'll separate them eventually" temporary measure that becomes permanent.

```
SYMPTOMS:
  - Same IAM policies apply to dev and prod resources
  - Test workloads can accidentally affect prod resources
    (shared VPCs, shared databases, shared S3)
  - Different security postures impossible (prod needs more
    rigorous, dev needs less)
  - Compliance: prod data and non-prod data mingle —
    SOC 2 / ISO findings inevitable
  - Cost-management approaches contradict (schedule non-prod
    aggressively vs leave prod alone — but they're the same
    instances?)

FIX:
  Mandatory split: prod and non-prod ALWAYS in separate
  accounts. This is the minimum-viable multi-account
  structure. Even single-team orgs should do this.
  
  Migration is tractable:
    - Stand up new prod account
    - Migrate prod workloads in waves (DNS cutover per service)
    - Lock down the original account; let non-prod live there
    - Optionally: split non-prod further later
```

This is the single highest-impact split. If you do nothing else, do this.

### Anti-pattern 5 — No shared services account

Every account runs its own DNS, monitoring, logging, security tools, CI/CD agents. Looks decentralized; is actually wasteful and inconsistent.

```
SYMPTOMS:
  - DNS records duplicated across accounts (drift inevitable)
  - Monitoring tools running in every account (cost multiplied)
  - Security tools redundant (Cloudtrail in every account,
    paid per-account, but mostly empty)
  - Log aggregation incomplete (no single pane of glass)
  - Engineers maintaining N copies of common infrastructure

FIX:
  Stand up a dedicated shared-services account
  Move there:
    - DNS (Route 53 hosted zones)
    - Monitoring (CloudWatch dashboards, alarms)
    - Log aggregation (CloudWatch Logs destination, S3 archive)
    - Security tools (GuardDuty master, Security Hub)
    - CI/CD runners (shared GitHub Actions runners, etc.)
    - Container registries (shared ECR / Artifact Registry)
  
  Cross-account access from workload accounts to shared
  services via cross-account IAM (well-understood pattern).
```

The shared-services account is usually the second account a customer stands up after the prod/non-prod split. The cost savings from deduplication are real; the consistency benefits are larger.

### Diagnostic checklist

A 5-minute diagnostic to identify which anti-patterns apply to your org:

```
QUESTION                                                YOUR ANSWER
──────────────────────────────────────────────────────────────────
1. Do prod and non-prod live in different accounts?      Y / N

2. Account count vs employee count ratio?                _____ : _____
   (per-engineer is ~1:1; per-team is ~1:10-20)

3. Is there a dedicated shared-services account?          Y / N

4. Do microservices have their own accounts?              Y / N

5. Does any one account hold > $500K/mo of spend?         Y / N
   (concentrated risk if yes)

6. Can a single IAM role mutation affect both prod and    Y / N
   non-prod simultaneously?
   (yes = anti-pattern 1 or 4)
```

Most orgs find one or two anti-patterns in their answers. The fix is rarely all-at-once; phased migration is the norm.

### How ZopNight surfaces these

Indirectly, ZopNight surfaces structural issues through reports:

```
SYMPTOM IN ZOPNIGHT                          UNDERLYING ANTI-PATTERN
──────────────────────────────────────────────────────────────────
One cloud-account holds 80%+ of spend         AP1 or AP4
                                              (everything-in-one)
                                              
"Unallocated" tag-based spend > 15%           AP1 (no account-level
                                              billing separation)
                                              
30+ small cloud-accounts (< $1K each)         AP2 or AP3 (over-isolation)
                                              
Same tags appearing in prod and dev           AP4 (mixed-environment)
                                              accounts → audit risk
                                              
Discovery sees no shared-services account     AP5 (no dedup)
```

For customers running into these patterns, ZopNight's solution architects can advise on phased migration.

---

## 2. Demo

A mid-size company at the inflection point:

```
COMPANY:  ~150 employees, ~70 engineers
CURRENT:  3 AWS accounts (acme-main, acme-test, acme-personal-sandbox)
SPEND:    $2.0M/mo (mostly in acme-main)

DIAGNOSTIC:
  Q1: prod/non-prod separation? Partial (test ≠ main, but main has
      both prod and "developer convenience" workloads)
  Q2: account-to-employee ratio? 3:150 (heavily under-isolated)
  Q3: shared services? None — DNS, monitoring all in acme-main
  Q4: microservice accounts? No (good)
  Q5: concentrated risk? Yes (acme-main holds $1.8M/mo)
  Q6: single IAM role can affect both prod and convenience workloads? Yes
  
  PRIMARY ANTI-PATTERNS: AP1 (one account for everything) +
                         AP4 (prod and non-prod mixed) +
                         AP5 (no shared services)

REMEDIATION PLAN (target state, 4 quarters):
  Q1: Stand up acme-management, acme-security, acme-shared-services
      Migrate DNS, monitoring, security tools to shared services
      
  Q2: Stand up acme-prod, acme-staging
      Migrate prod workloads from acme-main to acme-prod
      Decommission convenience workloads in acme-main
      
  Q3: Stand up per-team accounts (5-7 teams)
      Migrate team-specific workloads
      
  Q4: Steady state: ~12 accounts, well-architected
      Decommission acme-main
      
TARGET STRUCTURE (12 accounts):
  acme-management            
  acme-security              
  acme-shared-services       
  acme-prod
  acme-staging
  acme-dev-shared
  acme-platform-team
  acme-product-team
  acme-data-team
  acme-ops-team
  acme-experiments
  acme-sandbox

EFFORT: ~2 engineers part-time across 4 quarters.
PAYOFF: blast radius dropped 10×; per-team accountability;
        compliance-ready structure.
```

---

## 3. Hands-on (5 min)

Audit your own structure:

```
CURRENT ACCOUNT COUNT:    _____
EMPLOYEE COUNT:           _____
RATIO (accounts:employees): _____

DIAGNOSTIC CHECKLIST (✓ / ✗):
  □ prod and non-prod in different accounts
  □ at least one dedicated shared-services account
  □ at least one security/audit account
  □ no microservice-per-account structure
  □ no account holds >50% of total spend
  □ tagging discipline > 90% (low if structurally needed)

ANTI-PATTERNS IDENTIFIED:
  □ AP1 (single account)
  □ AP2 (per-engineer)
  □ AP3 (per-microservice)
  □ AP4 (prod + non-prod mixed)
  □ AP5 (no shared services)

REMEDIATION PRIORITY (rank by impact):
  1. __________
  2. __________
  3. __________

NEXT QUARTER TARGET:    __________
```

If no anti-patterns surface, that's a healthy multi-account posture — confirm with the rest of the checklist before declaring victory.

---

## 4. Knowledge check

### Q1
"30 per-engineer accounts" is:

A. Best practice — maximum isolation
B. Anti-pattern. Per-engineer isolation defeats collaboration, multiplies operational overhead, and creates engineer-specific lock-in. Per-team accounts (5-12 typical for mid-size) is the right balance. The original safety concern is addressed by RBAC, not by account proliferation.
C. Required for compliance
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Per-engineer is too granular. RBAC handles the safety concern with much less operational cost.
</details>

### Q2
A company has 1 AWS account for everything. The right first step:

A. Stay single-account; tags will solve attribution
B. Split prod from non-prod. This is the highest-impact single change — addresses the biggest compliance risk (prod and non-prod mingling) and the biggest blast-radius concern. Then per-team accounts. Then shared services. Phased over multiple quarters.
C. Stand up 50 accounts immediately
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Phased migration starting with prod/non-prod. The other splits earn their value once the foundation is right.
</details>

### Q3
A microservices estate with 100+ services. Per-service accounts:

A. Optimal isolation
B. Anti-pattern. The operational cost (per-account networking, IAM, observability) exceeds the isolation benefit, which IAM and namespaces provide at much lower cost. Group services by team or by environment.
C. Required for microservice purity
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Per-service is too granular; per-team-per-env is usually right. Service-level isolation lives in IAM, not in account boundaries.
</details>

---

## 5. Apply

Audit your structure annually. The anti-patterns crystallize over time — what was a small workaround becomes a structural problem. The ZopNight Solution Architects can review the structure as part of onboarding or quarterly reviews.

For new orgs, start with the canonical 3-account split (management / security / workloads); expand to the 12-account well-architected pattern as the org grows past 50 employees.

---

## Related lessons

- [L1 — Why multi-account](L1_why_multi.md)
- [L2 — Cloud-provider hierarchies](L2_org_structures.md)
- [L3 — Cross-account discovery](L3_cross_account_discovery.md)
- [L4 — Rollup vs isolation](L4_rollup_vs_isolation.md)
- [T3.M3.5.L1 — Pick your showback dimension](../M3.5_showback/L1_pick_dimension.md)

## Glossary terms touched

[Anti-pattern](../../../reference/glossary/anti-pattern.md) · [Account proliferation](../../../reference/glossary/account-proliferation.md) · [Shared services account](../../../reference/glossary/shared-services-account.md) · [Well-architected framework](../../../reference/glossary/well-architected.md)

---

## Module quiz

Complete M3.4 → 10-question module quiz unlocks the **Multi-Account-Architect** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.4.L5
