# Why ZopNight never mutates customer DBs

§ T2 · M2.3 · L5 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **defend** the database denylist to security audiences, **explain** the risk-reward math behind it, **and distinguish** what IS allowed (start/stop) from what isn't (modify/delete).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Answer 'will ZopNight modify our database?' with confidence — and explain why the answer is always no." |
| **Personas** | Platform Engineer · Security/Compliance · CISO |
| **Prerequisites** | M2.3.L1 - L4 |
| **Time** | 9 minutes |
| **Bloom verb** | Defend (Evaluate), Explain (Understand), Distinguish (Analyze) |

---

## 1. Concept

The database denylist is a hardcoded set of resource types and action types that ZopNight categorically refuses to auto-mutate. Even with auto-remediation explicitly enabled, the system will not execute mutating operations on these.

```
THE GUARANTEE:
  ZopNight will NEVER auto-mutate your customer database
  Hardcoded; not configurable; not bypassable
  Applies to: data, schema, instance class, encryption settings,
              multi-AZ config, scaling decisions
  Does not apply to: scheduled start/stop (operational pause)
```

The denylist is the answer to most "is our database safe with ZopNight?" questions.

### What's on the denylist

```
RESOURCE TYPES (never auto-mutate):
  rds*, aurora*           (AWS managed databases)
  cloudsql*               (GCP managed databases)
  elasticache*, memcached* (in-memory caches with state)
  azure-sql*              (Azure managed databases)
  postgres*, mysql*        (self-hosted patterns)
  dynamodb*, cosmos*, mongodb* (NoSQL databases)
  redshift*               (data warehouse)
  snowflake*              (data warehouse SaaS)
  databricks-data*        (data platform)

ACTION TYPES (never auto-execute on the above):
  modify (instance class, multi-AZ, replication settings)
  delete (instance, cluster, snapshot if data-tagged)
  scale (replicas, capacity changes)
  change-tier, change-class
  enable-encryption
  change-multi-az
  upgrade (engine version, minor or major)
```

This is the hardcoded list in the code. Not configurable. Not bypassable.

### Why so conservative — the risk-reward math

```
SCENARIO: Recommendation suggests downsize RDS db.r5.4xlarge → r5.2xlarge
Projected savings: $530/month

POSSIBLE OUTCOMES IF AUTO-EXECUTED:
  SUCCESS: Saved $530/month
  
  FAILURE modes:
    Cloud-side resize causes 30-second connection drop
      Impact: revenue loss from SaaS outage during peak hours
      Cost: potentially $10K-$100K (customer impact)
      
    Performance regression on smaller instance
      Impact: degraded customer experience for days/weeks
      Cost: customer churn, support tickets, eng time to investigate
      
    Concurrent migration job hits the smaller instance class
      Impact: query failures, possible data inconsistency
      Cost: potentially catastrophic; data recovery effort
      Could be: $100K+ to remediate

EXPECTED COST CALCULATION:
  Even at 1% failure rate:
    Expected loss = 0.01 × $50K (avg cost of incident) = $500
    Savings = $530
    Net = barely positive; high variance
    
  At 5% failure rate:
    Expected loss = $2,500
    Net = NEGATIVE $1,970
    
  At 10% failure rate:
    Expected loss = $5,000
    Net = NEGATIVE $4,470
    
ZopNight chooses CATEGORICAL EXCLUSION
  Don't take the risk
  Manual DBA execution is the right surface
  Customer's DBA team has context + judgment
```

The cost of a bad database write is asymmetric. The denylist averts the bad outcome categorically.

### What the system does instead

For database optimization recommendations, the system:

```
1. Shows the recommendation card normally
2. Surfaces the evidence (metrics, activity)
3. Provides the remediation steps + console link
4. HIDES the Apply Remediate button
5. Provides "Mark Applied" so team can record manual execution

EXAMPLE: RDS Right-Sizing recommendation card
  [Apply Remediate is HIDDEN]
  
  REMEDIATION (manual):
    1. Review CloudWatch metrics for the instance
    2. Plan a maintenance window
    3. Modify instance class via AWS Console
    4. Monitor application performance for 48 hours
  
  [Mark Applied]   [Dismiss]   [Snooze]
  
The team's DBA executes the change through normal channels.
```

The team's DBA has the context, the maintenance window, and the runbook.

### What the denylist does NOT prevent

Things still allowed on database resources:

```
ALLOWED for databases:
  ✓ Discovery (every database inventoried, tagged, costed)
  ✓ Scheduling (start/stop schedules on databases — operational pause)
  ✓ Read-only metrics (Connections, CPU, IOPS, etc.)
  ✓ Showback / cost attribution
  ✓ Recommendations (display)
  ✓ Manual remediation marking
  ✓ Cost reports
  ✓ Audit logging

NOT ALLOWED for databases:
  ✗ Auto-execute modify/delete/scale via Apply Remediate
  ✗ One-click destructive actions
  ✗ Automated rightsizing
```

The denylist is specifically about auto-execution of mutating actions. The rest of the surface is intact.

### Why hardcoded, not configurable

```
ALTERNATIVE: configurable denylist
  Some customer would set it permissively
  Incident would follow
  Trust would drop across customer base
  
ZOPNIGHT'S CHOICE: hardcoded
  Safety architecture identical across all customers
  Cannot be defeated by configuration mistakes
  Auditable: "Will ZopNight modify our DB?" Answer always: no
  SOC 2 / ISO 27001 reviewers see structural safeguard
  
TRADE-OFF:
  Some flexibility for one-size-fits-all safety
  Worth it for the trust + audit benefit
```

Hardcoded = guarantee. Configurable = optimization. ZopNight chooses the guarantee.

### Documented at the source

```
THE DENYLIST LIVES in:
  recommender/internal/remediation/certified
  
  (The inverse — certified rules — also defined here)

EVERY RULE'S mutation eligibility:
  Checked against the denylist
  At recommendation card render time
  The Apply button's presence is the answer

ENFORCEMENT IS STRUCTURAL:
  Apply button hidden in UI
  API call to apply would be rejected
  No bypass mechanism
```

The denylist is in the code, not configuration. Auditable to source.

### A subtle point — DB scheduling

```
STOPPING a database via scheduling is NOT a mutating operation
in the same sense as modify/delete/scale.

SCHEDULE-STOP:
  Pauses billing
  Restores state on next start
  Snapshots remain intact
  No schema or data changes
  Operationally analogous to stopping a VM

THE SYSTEM schedules databases off-hours when configured:
  Common pattern: stop non-prod databases overnight
  Saves significant cost
  Data preserved
  
DENYLIST'S "delete" AND "modify" actions:
  Don't include schedule-driven start/stop
  Start/stop is operational pause; not data mutation
```

Customers often want to schedule-stop databases for cost savings. This works.

### Common security questions + answers

```
Q: "Will ZopNight modify our customer database?"
A: "No. The database denylist is hardcoded — RDS, Aurora, CloudSQL,
    DynamoDB, etc. — and the actions modify/delete/scale are
    categorically denied. Recommendations are displayed; Apply button
    is hidden. The customer's DBA executes through normal channels."

Q: "What about scheduling? Can it start/stop a database?"
A: "Yes — start/stop is allowed. Schedule-driven start/stop pauses
    billing without mutating the data. Data, schema, configuration
    preserved across the cycle."

Q: "Can the customer override the denylist?"
A: "No. The denylist is hardcoded in the application, not configurable.
    Even admins can't bypass it. This is intentional safety architecture."

Q: "What about DBs in a development account?"
A: "Same protections apply. Account isn't the factor; resource type is.
    Even dev databases get the denylist treatment."

Q: "What if we need to bulk-modify many DBs?"
A: "Use your normal DBA tools (Liquibase, Flyway, your custom scripts).
    ZopNight's role is detection + recommendation; not execution for
    databases."

Q: "Is this documented for SOC 2 / ISO 27001?"
A: "Yes — the denylist is part of the security architecture
    documentation. Auditors verify the source code shows the hardcoded
    list. Easy compliance evidence."
```

The questions are predictable; the answers are consistent.

### Comparison to other categories

```
CATEGORY                AUTO-REM ELIGIBILITY
─────────────────────────────────────────────────
EC2 / VMs               YES (certified rules; reversible actions)
Storage (EBS, S3)       YES (delete on orphans; reversible recovery)
Lambda / Functions      YES (idle terminations)
Load Balancers          YES (orphan deletes)
Databases               NO (denylist; categorical)
Caches (ElastiCache)    NO (denylist; data state)
Data Warehouses         NO (denylist; analytical workloads)
Kubernetes              YES (scale-to-zero; pause CronJobs)
Networking              CAUTIOUS (some yes, some no per rule)
IAM                     NO (always manual)
```

The denylist sits within a broader risk-based framework. Some categories are auto-rem eligible; others aren't.

---

## 2. Demo

A security review walked through:

```
SECURITY ENGINEER: "Can ZopNight modify our customer database?"

PLATFORM ENGINEER: "No. The database denylist is hardcoded — `rds*`,
                    `aurora*`, `cloudsql*`, `elasticache*`, `azure-sql*`,
                    `postgres*`, `mysql*`, `dynamodb*`, etc. — and the
                    action types modify, delete, scale, change-tier are
                    categorically denied. The system will show
                    optimization recommendations for these resources,
                    but the Apply Remediate button is hidden. The
                    customer's DBA executes any changes through their
                    normal channels."

SECURITY: "What about scheduling? Can it start/stop a database?"

PE: "Yes — start/stop is allowed because it pauses billing without
     mutating the data. Schedule-driven start/stop on RDS is common
     (saves cost on non-prod databases). The data, schema, and
     configuration are preserved across the schedule's cycle."

SECURITY: "What if our org wants to override?"

PE: "Not possible. The denylist is hardcoded in the source code, not
     configurable. Even org admins can't bypass it. This is intentional
     safety architecture."

SECURITY: "Where can I verify in the code?"

PE: "It's at recommender/internal/remediation/certified — open-source
     equivalent. We can show you in code review if needed."

SECURITY: "And for SOC 2 evidence?"

PE: "The architecture is documented. We can provide:
     1. Source code citation
     2. UI screenshot showing hidden Apply button on RDS recommendation
     3. Architecture diagram explaining the denylist enforcement"

SECURITY: "Approved. This is exactly the kind of structural safeguard
          we like to see."
```

The denylist is the answer to most database safety questions. Trust built through consistent, documented architecture.

---

## 3. Hands-on (5 min)

Verify the denylist in your environment:

```
□ STEP 1: Browse Recommendations
  Filter to database-type recommendations
  (RDS, Aurora, CloudSQL, ElastiCache, etc.)

□ STEP 2: Open one recommendation
  Verify: Apply Remediate button is HIDDEN
  Manual remediation steps shown
  Mark Applied button available

□ STEP 3: For comparison
  Open a non-database recommendation (e.g., idle EC2)
  Apply Remediate button is VISIBLE (if rule is certified + enabled)

□ STEP 4: Document for security
  Take a screenshot of the database recommendation
  Note: no Apply button
  File for next security review

□ STEP 5: Plan databases-via-DBA workflow
  Who acts on database recommendations? (Your DBA team)
  Their tooling: __________
  Maintenance window cadence: __________
```

A 10-minute verification reassures security teams.

---

## 4. Knowledge check

### Q1
Customer enables auto-remediation org-wide. The system attempts to modify an RDS instance based on a rightsizing recommendation. What happens:

A. Modification proceeds (org enabled it)
B. Blocked — RDS is on the database denylist. Auto-remediation toggle does not override the hardcoded denylist. Manual remediation path is the only option. The denylist is structural, not configurable.
C. Approval requested
D. Modification proceeds with warning

<details>
<summary>Show answer</summary>

**Correct: B.** Denylist is hardcoded, not customer-configurable.
</details>

### Q2
A team schedule-stops their RDS at night. Is this a mutation?

A. Yes, this is forbidden by the denylist
B. No — schedule-driven start/stop pauses billing without modifying the database. Data, schema, configuration preserved. The denylist's "modify/delete" actions don't include operational start/stop. Common cost-saving pattern for non-prod databases.
C. Only on weekdays
D. Only on prod

<details>
<summary>Show answer</summary>

**Correct: B.** Start/stop is operational pause, not mutation. Allowed.
</details>

### Q3
The denylist exists because:

A. Cloud providers require it
B. The cost of a bad database write is asymmetric — even a small failure rate dwarfs the savings from any optimization. Safety architecture chooses categorical exclusion over edge-case handling. Trust through structural guarantee.
C. Bureaucracy
D. Database vendors require it

<details>
<summary>Show answer</summary>

**Correct: B.** Risk-reward math drives the denylist.
</details>

---

## 5. Apply

The denylist is enforced in code. To audit: open any database-type recommendation card; confirm Apply Remediate is hidden. Show this in security reviews.

For your team: easy answer to security questions; clean compliance evidence.

---

## Related lessons

- [L1 — 3-step workflow](L1_three_step_workflow.md)
- [L2 — Certified rules](L2_certified_rules.md)
- [L3 — Approval gate](L3_approval_gate.md)
- [L4 — Error classes](L4_error_classes.md)
- [L6 — Terminal notifications](L6_terminal_notifications.md) *(next)*

## Glossary terms touched

[Database denylist](../../../reference/glossary/database-denylist.md) · [Hardcoded safety](../../../reference/glossary/hardcoded-safety.md) · [Asymmetric risk](../../../reference/glossary/asymmetric-risk.md) · [Categorical exclusion](../../../reference/glossary/categorical-exclusion.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.3.L5
