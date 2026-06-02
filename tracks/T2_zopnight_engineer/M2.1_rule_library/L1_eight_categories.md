# The 8 categories

§ T2 · M2.1 · L1 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **categorize** any finding into the right one of 8 rule categories, **predict** the rule's typical severity and remediation path, **and prioritize** categories by savings impact.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the 460-rule library well enough to find what matters in my estate." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | T1.M1.1 (recommendations basics) |
| **Time** | 9 minutes |
| **Bloom verb** | Categorize (Apply), Predict (Apply), Prioritize (Evaluate) |

---

## 1. Concept

ZopNight's 460 rules sort into 8 categories. Knowing the category lets you predict the rule's behavior, the typical severity, and the right remediation path. The categorization is the mental shortcut that turns "460 rules I don't understand" into "8 categories I can navigate."

```
CATEGORY          ~COUNT  WHAT IT CATCHES                        EXAMPLES
─────────────────────────────────────────────────────────────────────────────
idle               ~110    Running but unused                      RC-001 Idle EC2
                                                                    RC-010 Idle Lambda
                                                                    RC-1701 EKS idle pod
rightsizing        ~120    Over-provisioned                        RC-004 EC2 rightsize
                                                                    RC-006 Oversized EC2
                                                                    RC-053 RDS rightsize
schedule            6      Scheduling candidates (carved out)      RC-015, RC-093, RC-126
                                                                    Resources that should
                                                                    use a schedule
orphan             ~60     Detached resources still billing        RC-002 Orphan EBS
                                                                    RC-105 Orphan snapshot
                                                                    RC-1742 Orphan PVC
compliance         ~50     Best-practice gaps                      RC-005 RDS not Multi-AZ
                                                                    Public-access detection
                                                                    Missing encryption
discount           ~20     Commitment opportunities                RI gap detection
                                                                    Savings Plan opportunity
                                                                    GCP CUD recommendation
security (K8s)     ~60     K8s security signal                     Privileged containers
                                                                    Root user
                                                                    Host network mode
reliability (K8s)  ~30     K8s reliability signal                  Missing requests/limits
                                                                    Single replica HPA at max
                                                                    No anti-affinity
governance         ~10     Tag / label hygiene                     Missing environment tag
                                                                    Missing owner tag
─────────────────────────────────────────────────────────────────────────────
```

Plus 6 autoscaler rules (RC-ASC-001..006) and 10 Bedrock rules (RC-1601..1610) — these get their own modules later in the track.

### How the categories map to action

Each category has a default action — what ZopNight recommends doing about the finding:

```
CATEGORY            DEFAULT ACTION                      AUTO-REMEDIATION?
─────────────────────────────────────────────────────────────────────────────
idle                 Terminate (with snapshot)            Yes, for certified rules
rightsizing          Downsize during maintenance           No (planned change)
schedule             Attach to schedule                    Yes, via group attach
orphan               Delete                                 Yes, for certified rules
compliance           Configure missing setting              No (planned change)
discount             Commit / restructure                   No (procurement decision)
security (K8s)       Fix YAML                                No (PR required)
reliability (K8s)    Tune YAML or HPA                          No (PR required)
governance           Apply tag (or auto-tagger)             Yes (via auto-tagger)
```

The default actions are conservative. Customers can change them per-rule, but starting with the defaults is the right move.

### Why this categorization

The 8 categories aren't arbitrary; they reflect the different *kinds* of waste + the different *kinds* of response:

```
COST-RECOVERY categories (direct $ savings):
  idle           → stop or delete things not being used
  rightsizing    → make things smaller
  orphan         → delete leftovers
  schedule       → stop during off-hours
  discount       → commit for better prices

QUALITY categories (cost-adjacent; mostly engineering hygiene):
  compliance     → fix policy violations (some cost, some risk)
  security       → fix security gaps (cost-adjacent: incidents cost)
  reliability    → fix reliability gaps (cost-adjacent: outages cost)
  governance     → fix tag hygiene (enables better cost reporting)
```

Cost-recovery categories deliver immediate $ savings. Quality categories pay back via avoided incidents, better reporting, audit-readiness.

### Typical savings distribution

A mid-size estate (~$500K/mo cloud spend) typically shows:

```
CATEGORY            FINDINGS    SAVINGS POTENTIAL    % OF TOTAL
─────────────────────────────────────────────────────────────────
idle                 47          $14,800/mo           ~49%
rightsizing          62          $9,420/mo            ~31%
schedule             156         (actioned via T1)     ~10%
orphan               183         $1,940/mo            ~6%
compliance           12          $0 (governance)      —
discount             8           $4,200/mo            ~14%
security (K8s)       24          $0 (security debt)   —
reliability (K8s)    18          $0 (reliability)     —
governance           71          $0 (tag debt)        —
─────────────────────────────────────────────────────────────────
TOTAL ACTIONABLE                $30,360/mo (~6% of spend)
```

The biggest savings live in **idle + rightsizing + discount**. These three categories typically account for 80%+ of recoverable savings.

### Reading the category breakdown

The category view in ZopNight Recommendations is the strategic dashboard:

```
WHAT TO ASK PER CATEGORY:

idle:
  How many resources? What's the average idle age?
  What's blocking action (data preservation, approval)?
  
rightsizing:
  Which families are most over-provisioned?
  What's the typical cost-reduction per right-size?
  
schedule:
  Are these resources already in groups?
  Why aren't existing schedules catching them?
  
orphan:
  How old? Cleanup safe?
  Who owns? (often nobody — that's the issue)
  
discount:
  What's the commitment opportunity?
  Coverage / utilization data points to decision

compliance / security / reliability / governance:
  These are debts; address by quarter
  Don't expect direct $ savings
```

The category-level view shapes the strategic conversation. Per-resource action follows.

### Priority sequence — engineering teams

```
WEEK 1-2: idle + orphan
  Biggest wins; lowest risk
  Auto-remediation candidates for certified rules
  
WEEK 3-4: schedule
  Already actionable via T1 schedules
  Tag-driven group attachment
  
MONTH 2: rightsizing
  Plan changes per workload
  Production: maintenance window required
  
MONTH 2-3: discount
  Procurement decision; multi-stakeholder
  Decision in Track 4 (FinOps Mastery)
  
MONTH 3+: compliance + security + reliability
  Quality debts; address by quarter
  No direct $ savings; long-term posture
```

The sequence matches the typical impact-vs-risk gradient.

---

## 2. Demo

A real findings report from a mid-size estate (Q1 2026):

```
ORG: 50-engineer SaaS, $400K/mo cloud spend

CATEGORY            FINDINGS    SAVINGS POTENTIAL    ACTIONED IN Q1
────────────────────────────────────────────────────────────────────
idle                 47          $14,800/mo           41 of 47 (87%)
rightsizing          62          $9,420/mo            38 of 62 (61%)
schedule             156         (T1-handled)         142 of 156 (91%)
orphan               183         $1,940/mo            178 of 183 (97%)
compliance           12          $0 (governance)      11 of 12 (92%)
discount             8           $4,200/mo            5 of 8 (RIs purchased)
security (K8s)       24          $0 (security)        18 of 24 (75%)
reliability (K8s)    18          $0 (reliability)     12 of 18 (67%)
governance           71          $0 (tags)            68 of 71 (96%)
────────────────────────────────────────────────────────────────────
TOTAL                 581 findings

Q1 SAVINGS REALIZED: $28,400/mo recurring = ~$340K/yr
% of total cloud spend: 7% reduction

ACTION RATE by category:
  Highest action rate: orphan, schedule, governance, compliance (>90%)
    (low-risk; easy actions)
  Mid action rate: idle, rightsizing, discount (60-90%)
    (require investigation + decision)
  Lower action rate: K8s security/reliability (67-75%)
    (require PR; multi-team coordination)
```

The pattern is repeatable. The first 6 weeks usually capture 70-80% of the available savings; the next quarter cleans up the remainder.

---

## 3. Hands-on (5 min)

Open ZopNight Recommendations:

```
□ STEP 1: Filter by each category
  idle:           ___ findings   savings: $_____/mo
  rightsizing:    ___ findings   savings: $_____/mo
  schedule:       ___ findings   savings: $_____/mo
  orphan:         ___ findings   savings: $_____/mo
  compliance:     ___ findings   savings: $_____ (often $0)
  discount:       ___ findings   savings: $_____/mo
  security:       ___ findings   savings: $_____ (often $0)
  reliability:    ___ findings   savings: $_____ (often $0)
  governance:     ___ findings   savings: $_____ (often $0)

□ STEP 2: Identify top 3 by absolute savings
  1. __________   savings: $_____/mo
  2. __________   savings: $_____/mo
  3. __________   savings: $_____/mo

□ STEP 3: Sanity-check
  Total actionable savings: $_____/mo
  % of monthly cloud spend: _____ %
  (Typical range: 3-15%)

□ STEP 4: Plan first action
  Pick: category with highest savings + lowest risk
  Owner: __________
  Date: __________
```

A 15-minute scan reveals the strategic picture. The biggest finding usually surprises someone.

---

## 4. Knowledge check

### Q1
A rule fires on a stopped EC2 instance with no attached volumes. Which category?

A. idle
B. orphan
C. rightsizing
D. discount

<details>
<summary>Show answer</summary>

**Correct: B — orphan.** The resource has no attached usage; nothing is running. Idle would be a *running* instance with low utilization. Stopped + no volumes = orphan resource generating cost (e.g., EIPs, snapshots).
</details>

### Q2
A K8s deployment without `resources.limits` set. Which category?

A. governance
B. reliability — missing limits is a reliability signal
C. security
D. idle

<details>
<summary>Show answer</summary>

**Correct: B — reliability.** Missing limits lets a pod consume unbounded resources, threatening other pods' QoS. It's a reliability concern (potential cluster instability), not strictly security or governance.
</details>

### Q3
Six rules carved out from idle/rightsizing in the 2026-04-13 migration. Which category?

A. compliance
B. schedule
C. discount
D. orphan

<details>
<summary>Show answer</summary>

**Correct: B — schedule.** The carve-out gave scheduling-driven recommendations their own first-class filter. Examples: resources that fit dev/test schedule patterns; resources currently always-on that should follow schedule.
</details>

---

## 5. Apply

[Recommendations](https://app.zopnight.com/recommendations) → filter by category. Each category has its own savings rollup. Sort by impact; act on top items.

For your team: schedule a quarterly category review. Most teams capture 70-80% of savings in the first 6 weeks; the rest over the following quarter.

---

## Related lessons

- [L2 — Severity ladder](L2_severity.md) *(next)*
- [L3 — Rule interface](L3_rule_interface.md)
- [L4 — Pricing model](L4_pricing_model.md)
- [L5 — Reading a recommendation card](L5_reading_a_rec_card.md)
- [M2.3 — Auto-remediation](../M2.3_auto_remediation/00_README.md)

## Glossary terms touched

[Rule category](../../../reference/glossary/rule-category.md) · [Recommendation card](../../../reference/glossary/recommendation-card.md) · [Cost-recovery vs quality category](../../../reference/glossary/cost-recovery-vs-quality-category.md) · [Action default](../../../reference/glossary/action-default.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.1.L1
