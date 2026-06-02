# Definitions — showback, chargeback, allocation

§ T4 · M4.2 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **distinguish** showback, chargeback, and allocation, **identify** when each fits, **and explain** why most orgs start with showback before considering chargeback.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Use the right vocabulary in cost conversations so finance and engineering understand each other." |
| **Personas** | FinOps Lead · Finance Partner · Engineering Leader |
| **Prerequisites** | T0 — Foundations · M4.1 — Maturity ladder |
| **Time** | 9 minutes |
| **Bloom verb** | Distinguish (Analyze), Identify (Apply), Explain (Understand) |

---

## 1. Concept

Three related but distinct concepts that often get conflated in cost conversations:

```
SHOWBACK     Teams see their cost. No real financial transfer.
             "Engineering, you spent $40K last month."
             Visibility-only. Accountability driven by transparency.

CHARGEBACK   Teams pay their cost. Real financial transfer or
             internal billing entry.
             "Engineering, here's your $40K bill. Pay it."
             Visibility + financial enforcement.

ALLOCATION   Cost is mathematically distributed across teams.
             Showback or chargeback can use allocation.
             Allocation is the mechanism; showback/chargeback
             are the surfaces that present it.
```

These are not synonyms. Showback and chargeback differ in **whether money actually moves**. Allocation is the math underneath either of them.

### When showback is sufficient

```
SCENARIO                                  USE SHOWBACK
──────────────────────────────────────────────────────────────────
Single team, single budget                Always — no transfer needed
Building cost awareness                   Yes (Walk-stage practice)
Team accountability without bureaucracy   Yes
Visibility-driven decision making         Yes
Org with shared P&L                       Usually
Engineering culture is cost-aware         Yes — showback amplifies it
Maturity stage Walk or early Run          Default choice
```

### When chargeback fits

```
SCENARIO                                  USE CHARGEBACK
──────────────────────────────────────────────────────────────────
Multiple business units, separate P&Ls    Yes
Internal billing already exists           Often integrates naturally
Compliance/regulatory cost attribution    Required in some industries
                                          (financial services,
                                          healthcare with allocations)
Acquired companies kept separate          Yes (for transition periods)
Cross-org services with internal fees      Yes
Showback hasn't produced accountability    Sometimes — chargeback
                                          enforces what showback alone
                                          couldn't
```

### Trade-off summary

```
DIMENSION                  SHOWBACK              CHARGEBACK
──────────────────────────────────────────────────────────────────
Operational overhead       Low                   Higher
                                                  (billing, disputes,
                                                  finance involvement)
                                                  
Visibility                 High to all            Sometimes only finance
                                                  
Review cadence              Quarterly or monthly  Monthly (billing cycle)
                                                  
Accountability mechanism    Self-correction +     Finance enforces
                            leadership review
                            
Audit / compliance trail   Light                 Heavy (billing records)

Friction with engineering   Low                  Higher (disputes,
                                                  internal politics)
                                                  
Suitable maturity stage     Walk and beyond       Run (mature; usually
                                                  multi-BU)
```

Most teams start with showback. Chargeback is a step toward billing complexity that has its own overhead — adopt it only when showback alone is insufficient.

### Why showback first

```
SHOWBACK builds the foundation:
  - Per-team data model + dashboards (needed for both surfaces)
  - Tag discipline (needed for accurate allocation)
  - Team-level accountability culture
  - Allocation rules tested in low-stakes context (no real money
    on the line)

If those foundations work, chargeback layers on cleanly.
If those foundations are weak, chargeback amplifies the dysfunction.
```

Skipping showback to go straight to chargeback is a classic mistake. The org learns billing dynamics on top of an unstable allocation foundation; disputes proliferate; chargeback becomes its own cost center (covered in L4).

### Allocation as a separate concept

```
ALLOCATION is the math:
  "How do we distribute the $80K of shared infrastructure costs
   across the 5 consuming teams?"
   
RULES:
  Equal split:        80K / 5 = $16K each
  Usage-based:        proportional to query count, request count,
                      storage usage
  Tag-driven:         per workload_share_* tags
  Owner-pays:         one team picks up the full cost
  
The allocation rules are the same regardless of whether the
result is shown (showback) or billed (chargeback).
```

This means a customer can build their allocation engine once and decide later whether to present it as showback or chargeback. The decision is about the surface, not the underlying math.

### Real-world example

```
ORG: 60-person SaaS, single P&L
  Showback: per-team cost dashboards, weekly reviews
  Allocation: equal-split for shared infrastructure
  Outcome: engineering teams self-manage their cost; no chargeback
           needed at this scale
           
ORG: 800-person conglomerate across 3 business units
  Chargeback: monthly internal billing from IT cost center to
              consuming BUs
  Allocation: usage-based for compute, equal for shared services
  Outcome: cross-BU accountability; finance integrates with
           corporate billing
```

The same underlying allocation rules, different surfaces.

### How ZopNight surfaces both

ZopNight's allocation engine (the `cost_allocation_daily` table) is the source of truth for both surfaces. Reports → Teams shows showback by default; for chargeback, the same data feeds into a structured export (CSV / JSON) that customer's finance team imports into their internal billing system. The allocation rules are configured once and reused.

---

## 2. Demo

Two contrasting orgs:

```
CASE 1 — 5-team SaaS, single P&L:
  CHOOSE: showback
  Per-team dashboards show cost
  Discussion in monthly cost review
  Teams self-correct based on visibility
  No internal billing complexity
  
  Operational overhead: ~2 hours/month (FinOps Lead curates the
  monthly review)

CASE 2 — Conglomerate with 3 BUs and separate P&Ls:
  CHOOSE: chargeback (BU-level billing)
  Real internal billing transfers cost from IT to consuming BU
  Monthly close: $X to BU-A, $Y to BU-B, $Z to BU-C
  Allocation rules documented; dispute resolution process
  
  Operational overhead: ~20 hours/month (FinOps Lead +
  finance partner manage billing close)

Different scales, different solutions. Neither is "better" — both
match their org's structure.
```

---

## 3. Hands-on (5 min)

Decide which fits your org:

```
ORG PROFILE:
  P&L structure:    single / multiple
  BUs:              one / multiple
  Compliance reqs:   none / SOC 2 / heavy (PCI, HIPAA, finance)
  Existing internal billing:    Yes / No
  
DECISION:    Showback / Chargeback / Both

RATIONALE:
  __________________________________________________________

IF YOU'RE CONSIDERING SWITCHING:
  From: __________
  To:   __________
  Trigger (what changed?): __________
  Estimated additional operational overhead: __________
```

If switching from showback to chargeback, name a specific trigger — vague "we need more accountability" is not enough. Specific triggers: "the new BU acquisition requires cross-BU billing," "compliance auditor flagged the gap," "showback hasn't produced accountability for team X for 6 months despite leadership escalation."

---

## 4. Knowledge check

### Q1
Showback is best when:

A. Different business units share infrastructure
B. Cost awareness drives team behavior; no real billing transfers needed. The org has shared P&L or strong cross-team incentives; visibility produces accountability without the operational overhead of chargeback.
C. Compliance requires charging
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Showback for awareness without billing overhead.
</details>

### Q2
Chargeback adds:

A. No additional overhead
B. Operational overhead — billing cycles, disputes, finance involvement, allocation rule maintenance. Adopt only when showback alone hasn't produced accountability OR when org structure (multiple P&Ls, compliance) requires it.
C. Random
D. Same overhead as showback

<details>
<summary>Show answer</summary>

**Correct: B.** Higher operational cost is the price of stronger enforcement.
</details>

### Q3
Move from showback to chargeback when:

A. Always — chargeback is better
B. Specific conditions trigger it: separate P&Ls, multi-BU billing, compliance attribution requirements, showback failure to produce accountability after sustained effort. Don't switch without a named trigger.
C. Never
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Specific conditions. Showback is the default; chargeback is the upgrade.
</details>

---

## 5. Apply

Configure team allocations in [Settings → Teams](https://app.zopnight.com/settings/teams). The allocation engine outputs feed both showback ([Reports → Teams](https://app.zopnight.com/reports/teams)) and chargeback (export endpoint for finance integration).

For new orgs, default to showback. Revisit annually; switch only with a named trigger.

---

## Related lessons

- [L2 — When showback is enough](L2_showback.md) *(next)*
- [L3 — Chargeback design that survives](L3_chargeback_design.md)
- [L4 — Internal billing engineer anti-pattern](L4_antipattern.md)
- [T3.M3.5.L1 — Pick the showback dimension](../../T3_zopnight_architect/M3.5_showback/L1_pick_dimension.md)

## Glossary terms touched

[Showback](../../../reference/glossary/showback.md) · [Chargeback](../../../reference/glossary/chargeback.md) · [Allocation](../../../reference/glossary/allocation.md) · [Internal billing](../../../reference/glossary/internal-billing.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T4.M4.2.L1
