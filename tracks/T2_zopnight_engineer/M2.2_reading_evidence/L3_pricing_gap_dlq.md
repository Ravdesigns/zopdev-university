# The pricing-gap DLQ

§ T2 · M2.2 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **spot** when a rule fired without pricing data, **diagnose** the three causes of pricing gaps, **and respond** appropriately (wait, replay, dismiss, escalate).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand why some recommendations lack savings numbers — and what to do about it." |
| **Personas** | Platform Engineer · FinOps Lead · ZopNight Admin |
| **Prerequisites** | M2.1.L4 (pricing model) · M2.2.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Spot (Apply), Diagnose (Analyze), Respond (Apply) |

---

## 1. Concept

Some rules need per-resource pricing to compute savings. When the pricing API doesn't have a rate for a resource type, region, or SKU, the rule has no savings number to report. Rather than silently skip these, ZopNight tracks them in a **pricing-gap dead-letter queue (DLQ)**.

```
THE PROBLEM IT SOLVES:
  
  Without DLQ:
    Rule needs pricing → pricing missing → rule doesn't fire
    Customer sees nothing
    Hidden gap; no visibility
    
  With DLQ:
    Rule needs pricing → pricing missing → DLQ entry created
    Customer sees: "pending pricing data"
    Visible gap; can be drained
```

The DLQ converts silent misses into a visible backlog. Better than mystery.

### What lands in the DLQ

```
DLQ ENTRY EXAMPLE
─────────────────────────────────────────────────────────
Rule:           RC-188 (Storage class rightsizing)
Resource type:  azure-storage-account (Premium-ZRS tier)
Region:         eastus2
Reason:         No pricing rate found for SKU 'Premium_ZRS' in eastus2
Created:        2026-05-12
Last seen:      2026-05-19 (still gap)
Recommendation: Replay after pricing data lands;
                 or dismiss if SKU is rare
```

DLQ entries are visible in `/internal/pricing-gap-dlq` (admin-only). Each entry shows:

```
- Rule that wanted pricing
- Specific resource type / region / SKU combination missing
- When the gap was first detected
- Whether gap is recurring (re-created each evaluation) or transient
- Suggested action
```

### Three causes of pricing gaps

```
CAUSE 1 — NEW SKU
  Cloud provider releases new instance type or storage class
  Example: AWS releases m7i.16xlarge in May 2026
  Pricing cron is weekly; hasn't fetched yet
  Gap lasts until next sync run (max 7 days)
  RESOLUTION: wait for next pricing-sync; gap resolves automatically

CAUSE 2 — NEW REGION
  Customer enables a new region (e.g., Bahrain)
  Pricing cron will pick up rates on next run
  RESOLUTION: wait for next pricing-sync; gap resolves automatically

CAUSE 3 — RARE COMBINATION
  Unusual region + SKU + OS combination not in public price endpoint
  Example: Azure Premium_LRS in less-common region with specific replication
  Gap is structural; won't auto-resolve
  RESOLUTION: file engineering ticket; needs investigation
```

The cause determines the response. Most gaps are temporary; some are structural.

### What the customer sees (without the DLQ)

A rule that needs pricing but has none would normally just not fire — silent miss. The DLQ converts this:

```
WITHOUT DLQ:
  Customer browses Recommendations
  Resource that should have a rec... isn't there
  Silent gap; nobody knows
  
WITH DLQ:
  Customer browses Recommendations
  Resource shows up with "pending pricing data" 
  Visibility into the gap
  Can decide: act anyway? wait? escalate?
```

The visibility is the design choice. Trust comes from transparency.

### What the recommendation card shows

For affected resources:

```
RECOMMENDATION CARD (with missing pricing):
─────────────────────────────────────────
RC-188 · Storage Class Rightsize
Resource: azure-storage-acct-eastus2
Category: rightsizing

SAVINGS POTENTIAL:  (pending pricing data)
                    Re-evaluation scheduled when rate becomes available.

EVIDENCE:
  Current usage: low (Standard tier candidate)
  Proposed: Standard_LRS
  Pricing data: missing (DLQ entry created 2026-05-12)

[Apply (no savings shown)]  [Dismiss]  [Snooze]
```

Better than silent zero; less alarming than an error. Customers can choose to act on the resource even without the exact savings figure.

### How to act on DLQ entries

```
ACTION                       WHEN
─────────────────────────────────────────────────────────
WAIT                         New SKU or region (cause 1 or 2)
                              Gap resolves in days
                              No action needed

REPLAY                       After pricing-sync ran successfully
                              Triggers re-evaluation of affected resources
                              Drains the backlog
                              Run after major pricing-sync improvements

DISMISS THE ENTRY            SKU is rare/unimportant
                              Team accepts the gap
                              Won't be in any future recommendations
                              
FILE AN ISSUE WITH ZopNight  Persistent gap on high-volume SKU
                              Structural problem
                              Engineering investigation needed
```

The right action depends on the gap's nature.

### Monthly DLQ review process

```
MONTHLY (FinOps admin, 15 min):
  
  1. Open /internal/pricing-gap-dlq
  2. Sort by count (most-affected resources first)
  3. For top entries:
     - Identify the SKU + region
     - Determine the cause (new? rare? volume?)
     - Take action (wait / replay / dismiss / escalate)
  4. Document escalations
  5. Re-check in a week for transients
```

A 15-minute monthly review keeps the DLQ at a healthy size.

### Volumetric considerations

```
A HEALTHY DLQ:
  10-50 entries
  Most: transient (new SKUs/regions; resolved within weeks)
  Some: structural (rare combinations; persistent)

UNHEALTHY DLQ:
  500+ entries
  Many high-volume SKUs missing
  Indicates pricing-sync infrastructure issue
  
WHEN TO ESCALATE:
  Single SKU gap with high resource count (>100 resources affected)
  Multiple gaps in same region
  Trend: DLQ growing month over month
  
ESCALATION PATH:
  ZopNight support → Engineering team
  Provide: DLQ snapshot
  Outcome: engineering investigates pricing-sync coverage
```

The DLQ size + trend = health indicator.

### How DLQ integrates with pricing-sync

```
PRICING-SYNC CRON (weekly):
  Fetches rates from all configured providers
  Stores in pricing_cache table
  Refreshes any stale entries
  
NEW DLQ ENTRY (created during evaluation):
  Rule requests pricing
  No rate found in pricing_cache
  Entry created with details
  
DRAIN CYCLE:
  Next pricing-sync run
  Picks up missing rates (if available from provider)
  Replay job re-evaluates affected resources
  DLQ entries clear if rate now exists
  
PERSISTENCE:
  Gap with no rate available will persist
  Until engineering adds custom fetcher
  Or: SKU truly doesn't exist in price endpoints
```

The drain cycle is automatic for transients; manual for structural gaps.

### Admin access requirements

```
WHO can access /internal/pricing-gap-dlq:
  Organization administrators
  FinOps leads (with grant)
  ZopNight support (for diagnostics)
  
WHO should access regularly:
  FinOps lead (monthly review)
  Platform engineer (escalations)
  
WHO does NOT need access:
  Most engineers
  Casual users
  The DLQ is internal-ops; not customer-facing
```

The internal nature reflects the audience: ops engineers + admins, not the end-user.

---

## 2. Demo

A team's monthly DLQ review:

```
MONTHLY DLQ REVIEW (Q2 2026):

T+0      Open /internal/pricing-gap-dlq (admin access)
T+30 sec Total entries: 47
         Sort by last-seen + count

T+1 min  Top 5 entries:
         
         ENTRY 1: 12 entries
           Type: Azure Premium_LRS storage in 8 less-common regions
           Status: gap created 3 weeks ago; persistent
           Action: file internal ticket (real volume; structural)
           
         ENTRY 2: 8 entries
           Type: New AWS Mac instances (M2 Pro chips)
           Status: Mac instances released recently
           Action: wait (new SKU; will be in next pricing-sync)
           
         ENTRY 3: 6 entries
           Type: GCP Spot pricing in 4 specific zones
           Status: persistent gap
           Action: file internal ticket (high-savings potential)
           
         ENTRY 4: 5 entries
           Type: Various rare combinations
           Status: rare; low value
           Action: dismiss
           
         ENTRY 5: 4 entries  
           Type: Azure ZRS in eastus2
           Status: structural; been there 6 weeks
           Action: file internal ticket

T+5 min  ACTIONS:
         - 3 internal tickets filed (engineering)
         - 1 dismiss (rare; don't matter)
         - 1 wait (transient; will resolve)
         
T+6 min  REPLAY queue:
         28 entries (the actionable ones)
         Trigger replay → recommender re-evaluates
         
T+1 week  Re-check:
         Mac instances: still in DLQ (sync hasn't run yet)
         Mac instances: out of DLQ (sync ran; rates populated)
         Azure Premium_LRS: still there (structural)
         GCP Spot: still there (structural; awaiting eng fix)
         
T+1 month  Re-check at next monthly review:
         DLQ size: 31 entries (down from 47)
         Transients resolved
         Structural gaps remaining (escalated)
```

The pattern: monthly drain; transient gaps resolve; structural ones go to engineering.

---

## 3. Hands-on (5 min)

DLQ awareness check:

```
□ STEP 1: Check admin access
  Have admin role in ZopNight? □ Yes □ No
  If no: find admin to do this exercise

□ STEP 2: If admin: open /internal/pricing-gap-dlq
  Total entries: _____

□ STEP 3: Identify the top 5 by count
  Entry 1: __________   Resource count: _____
  Entry 2: __________   Resource count: _____
  Entry 3: __________   Resource count: _____
  Entry 4: __________   Resource count: _____
  Entry 5: __________   Resource count: _____

□ STEP 4: Classify each by cause
  Cause 1 (new SKU): _____ entries
  Cause 2 (new region): _____ entries
  Cause 3 (rare/structural): _____ entries

□ STEP 5: Plan action
  Wait: _____ entries (will resolve)
  Replay: _____ entries (after next sync)
  Dismiss: _____ entries (rare/low-value)
  Escalate: _____ entries (structural high-volume)
```

A 15-minute audit reveals the DLQ health. Monthly review keeps it bounded.

---

## 4. Knowledge check

### Q1
A rule that needs pricing data but has none:

A. Fires anyway with a $0 savings
B. Creates a pricing-gap DLQ entry; the affected card shows "pending pricing data" rather than failing silently. The DLQ visibility is the design choice over silent miss. Customer sees the gap; can choose how to act.
C. Fails the entire evaluation cycle
D. Is automatically dismissed

<details>
<summary>Show answer</summary>

**Correct: B.** DLQ visibility over silent miss; trust through transparency.
</details>

### Q2
A new AWS instance type lands. ZopNight's recommendation engine:

A. Recognizes it immediately
B. Likely creates DLQ entries until the next pricing-sync cron (weekly) picks up the rates. After sync runs, replay job drains the backlog. The new SKU appears in recommendations once rates are in pricing_cache.
C. Cannot handle new types
D. Requires manual coding

<details>
<summary>Show answer</summary>

**Correct: B.** Pricing-sync is the data source; rules adapt automatically once rates land.
</details>

### Q3
A persistent gap on a high-volume SKU (Azure Premium_LRS in eastus2) should be:

A. Ignored
B. Filed as an issue with ZopNight engineering. Persistent gaps on high-volume SKUs are structural, not transient. Engineering investigates the pricing-sync coverage. Don't wait for it to resolve on its own.
C. Dismissed
D. Worked around manually per resource

<details>
<summary>Show answer</summary>

**Correct: B.** High-volume gaps merit engineering attention.
</details>

---

## 5. Apply

DLQ surface: `/internal/pricing-gap-dlq` (admin-only). Monthly review recommended.

For your team: FinOps admin runs the monthly review. Escalate structural gaps; wait for transients.

---

## Related lessons

- [L1 — Metrics drawer](L1_metrics_drawer.md)
- [L2 — Activity tab](L2_activity_tab.md)
- [L4 — Evidence vs bill](L4_evidence_vs_bill.md) *(next)*
- [M2.1.L4 — Pricing model](../M2.1_rule_library/L4_pricing_model.md)

## Glossary terms touched

[Pricing-gap DLQ](../../../reference/glossary/pricing-gap-dlq.md) · [Pricing-sync](../../../reference/glossary/pricing-sync.md) · [Replay](../../../reference/glossary/replay.md) · [Structural gap](../../../reference/glossary/structural-gap.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.2.L3
