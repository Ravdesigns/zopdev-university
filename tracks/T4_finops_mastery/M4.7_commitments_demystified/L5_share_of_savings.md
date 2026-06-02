# Share-of-savings vendors

§ T4 · M4.7 · L5 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **decide** whether a share-of-savings commitment vendor fits your org, **evaluate** vendor proposals against the in-house alternative, **and audit** vendor performance once engaged.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Pick the right commitment-management model — in-house, share-of-savings vendor, or hybrid — based on org size and headcount." |
| **Personas** | FinOps Lead · Finance Partner · Engineering Leader |
| **Prerequisites** | M4.7.L1-L4 (commitment fundamentals) |
| **Time** | 9 minutes |
| **Bloom verb** | Decide (Evaluate), Evaluate (Analyze), Audit (Apply) |

---

## 1. Concept

Share-of-savings vendors (ProsperOps, Spot.io, etc.) manage cloud commitments and charge a percentage of the verified savings they produce. The model is "pay only when we save you money." It works for some orgs and not others; the decision turns on org size, complexity, and in-house headcount.

```
SHARE-OF-SAVINGS MODEL:
  Vendor manages your RI/SP/CUD portfolio
  Pays for the commits upfront on your behalf (or directs you to)
  Continuously optimizes: exchanges, expirations, new purchases
  Charges a percentage of verified savings (typically 25%)
  Vendor takes the operational + judgment overhead
  
ALTERNATIVE — IN-HOUSE:
  You manage commitments yourself (FinOps team)
  You pay your own commitments + admin overhead
  Full transparency on every decision
  Headcount cost: ~$180K-$250K per FinOps engineer
```

### When share-of-savings makes sense

```
GOOD FIT for vendor:
  Org lacks dedicated FinOps headcount (or part-time only)
  Cloud spend is significant ($5M+ annually)
  Commitment management is complex
    (multi-cloud, multi-instrument, frequent workload changes)
  Want a hands-off approach
  Team's time is better spent on other FinOps work
  In-house team can't realistically achieve >30% effective discount
```

### When in-house is better

```
GOOD FIT for in-house:
  Dedicated FinOps team already in place
  Smaller cloud spend (<$2M annually)
  Predictable workloads (low churn in instance types)
  Want full transparency on every commitment decision
  Team has commitment management skills already
  In-house can realistically achieve 30%+ effective discount
```

### The decision math

```
EXAMPLE — $10M annual cloud spend at 30% in-house discount:

VENDOR-MANAGED:
  Vendor achieves 35% effective discount (5pp improvement)
  Additional savings: $500K/year
  Vendor fee: 25% × $500K = $125K
  Net additional savings: $375K/year
  
IN-HOUSE (with dedicated headcount):
  Achievable with FinOps engineer: 35%
  FinOps headcount cost: $200K/year
  Net additional savings: $500K - $200K = $300K
  
WINNER (this scenario): vendor by $75K

EXAMPLE — $2M annual cloud spend at 30% in-house discount:

VENDOR-MANAGED:
  Vendor achieves 35% effective discount  
  Additional savings: $100K/year
  Vendor fee: 25% × $100K = $25K
  Net additional savings: $75K/year
  
IN-HOUSE (part-time):
  Achievable with part-time effort: 32%
  Marginal savings (no extra headcount): $40K/year
  Net: $40K
  
WINNER: vendor by $35K, but tighter at this scale

EXAMPLE — $500K annual cloud spend:
  Either approach yields small absolute savings
  Vendor fee may eat most of the marginal benefit
  In-house effort minimal (1-2 days per quarter)
  LIKELY WINNER: in-house at this scale
```

The math turns on absolute spend. Small spend → in-house; large spend → vendor often wins.

### Variations on the model

```
VARIATION 1 — Performance tiers
  Lower fee % for less-optimized starting portfolios
  Higher fee % for already-optimized portfolios
  Levels the field for various customer starting points

VARIATION 2 — Hybrid
  Vendor handles RI/SP/CUD optimization
  Customer handles Spot directly (often Spot needs deeper
  workload knowledge)
  
VARIATION 3 — Caps
  Maximum vendor fee per period
  Useful if savings exceed expectations (vendor doesn't get
  windfall)
  
VARIATION 4 — Multi-vendor
  Multiple share-of-savings vendors competing
  Best for very large customers ($50M+ spend)
```

### Risks of share-of-savings

```
RISK                              MITIGATION
──────────────────────────────────────────────────────────────────
VENDOR LOCK-IN                     Negotiate exit clauses upfront;
(transition costs if changing      typical 90-day notice with
vendors are high)                  knowledge transfer
                                  
CONTRACT TERMS                     Typically 1-3 year contracts;
(long-term commitment to           verify mid-term exit option;
vendor itself)                     terminate clauses for under-performance
                                  
INFLATED BASELINE                  Vendor measures savings against
(vendor sets the "baseline"        their stated baseline; insist on
they're improving from)            independent baseline measurement
                                  (your starting point, not theirs)
                                  
SAVINGS DEFINITION                 Define "savings" precisely in
(disputes about what's saved)      contract; include calculation
                                  methodology
                                  
EXIT CLAUSE                        Always negotiate; the worst case
                                  is being unable to exit when
                                  vendor underperforms
```

### Auditing vendor performance

Once engaged, the vendor's performance must be audited regularly:

```
QUARTERLY AUDIT:
  Cross-check vendor's reported savings against your own analysis
  Verify commitment portfolio decisions match the strategy
  Compare to in-house projection (what would we have achieved?)
  Track effective discount over time
  Identify any underperforming periods
  
ANNUAL REVIEW:
  Review fee + value calculation
  Reconsider in-house vs vendor decision
  Negotiate renewal or shop alternatives
  Document the year's learnings
  
SPECIFIC RED FLAGS:
  Effective discount declining
  Commitment portfolio decisions you wouldn't have made
  Lack of transparency on decisions
  Fees increasing without performance increases
```

### Comparison shopping

If considering multiple share-of-savings vendors:

```
COMPARE:
  Fee structure (flat 25%? tiered? capped?)
  Track record (case studies, references, customer count)
  Tools provided (audit, transparency, real-time dashboards)
  Exit terms (notice period, transition support, knowledge
    handoff)
  Multi-cloud support (AWS, GCP, Azure parity)
  Specific instruments covered (RI, SP, CUD, Spot?)
  Contract length (1-year, 3-year, longer?)
  Performance guarantees (refunds if savings miss?)
```

A 6-8 week evaluation cycle is typical for enterprise customers. Don't pick a vendor based on a single pitch.

### Common evaluation mistakes

```
MISTAKE                                   FIX
──────────────────────────────────────────────────────────────────
Choosing vendor by lowest fee %            Lowest fee on smaller
                                          savings can be more
                                          expensive than higher fee
                                          on larger savings
                                          
Not measuring baseline rigorously          Independent baseline
                                          assessment before signing
                                          
Long contract without exit clauses         Negotiate mid-term exit;
                                          performance-tied milestones
                                          
Ignoring multi-cloud capability             If you might add Azure
                                          later, verify vendor supports
                                          it now
                                          
Not auditing actual savings                Schedule quarterly audit
                                          from day 1
                                          
Doubling down on under-performing vendor   Switch sooner; vendor
                                          retention bias is real
```

---

## 2. Demo

A complete vendor vs in-house evaluation for a $4M cloud spend customer:

```
COMPANY: $4M annual cloud spend (mostly AWS)
CURRENT: 30% effective discount, no dedicated FinOps headcount
DECISION needed: hire FinOps engineer OR engage share-of-savings vendor

ASSUMPTIONS:
  In-house FinOps engineer cost: $180K/year (fully loaded)
  Expected in-house improvement: 30% → 32% (small but real)
  Expected vendor improvement: 30% → 38% (larger; vendor is specialized)
  Vendor fee: 25% of additional savings

CALCULATIONS:

  CURRENT savings (no change):
    30% × $4M = $1.2M/year
    
  IN-HOUSE (with new FinOps hire):
    Achievable: 32%
    New savings: 32% × $4M = $1.28M (additional $80K)
    Cost: $180K (FinOps headcount)
    Net additional benefit: $80K - $180K = -$100K
    (FinOps headcount has other value beyond commitments — see note)

  VENDOR:
    Achievable: 38%
    New savings: 38% × $4M = $1.52M (additional $320K)
    Cost: 25% × ($320K) = $80K
    Net additional benefit: $320K - $80K = $240K

DECISION: Vendor wins by $340K

NOTE on FinOps headcount:
  $180K headcount for ONLY commitment management is not justified
  at this scale. But FinOps does other work (tagging, scheduling,
  optimization, reporting) where vendor doesn't help. Reconsider:
  hire FinOps for the broader work + vendor for commitments
  specifically. The "either/or" framing is sometimes wrong.

REVISED DECISION:
  Hire FinOps engineer ($180K) for breadth of work
  Engage vendor for commitments specifically ($80K)
  Total cost: $260K
  Total savings improvement: 30% → 40% (8pp; FinOps work elsewhere
  amplifies vendor's commitment work)
  Annual savings: 40% × $4M = $1.6M (additional $400K)
  Net benefit: $400K - $260K = $140K
  
  Better than either alone. Hybrid model.

LOCKED-IN: vendor with quarterly audits and 90-day exit clause.
```

---

## 3. Hands-on (5 min)

For your org, evaluate vendor vs in-house:

```
CURRENT ANNUAL CLOUD SPEND:    $______
CURRENT EFFECTIVE DISCOUNT:    ____%

IN-HOUSE OPTION:
  Achievable discount with current setup: ____%
  Achievable with new FinOps headcount:    ____%
  Headcount cost:                          $______/yr
  Net annual additional savings:            $______

VENDOR OPTION:
  Estimated achievable discount:            ____% 
  Estimated annual additional savings:      $______
  Vendor fee (25% typical):                 $______
  Net annual additional savings:            $______

DECISION:
  □ In-house (better at this scale)
  □ Vendor (better at this scale)
  □ Hybrid (FinOps for breadth + vendor for commitments)
  □ Defer (not yet ready)

IF VENDOR/HYBRID:
  Evaluation process:
    □ Multi-vendor comparison
    □ Reference checks
    □ Pilot or 6-month trial
    □ Contract review (exit clauses!)
    □ Quarterly audit plan
```

Don't sign a multi-year contract without going through this analysis.

---

## 4. Knowledge check

### Q1
Share-of-savings vendor at 25% fee, $500K savings vs baseline:

A. Bad math — vendor took too much
B. $375K net to customer. Reasonable if customer would not have achieved that savings in-house. The vendor takes 25% in exchange for taking the operational + judgment overhead. Compare against the alternative (in-house cost) before judging.
C. Random
D. Too expensive

<details>
<summary>Show answer</summary>

**Correct: B.** Net to customer is $375K. Compare against in-house alternative cost.
</details>

### Q2
For a $2M annual cloud spend with 30% in-house discount achievable:

A. Always use vendor at this scale
B. Consider in-house. At smaller spend, vendor fees may exceed the marginal savings improvement. The math turns on absolute dollar improvement, not percentage. Always run the specific math for your org.
C. Always vendor
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Spend level matters. At smaller scales, in-house often wins.
</details>

### Q3
A multi-year contract with a share-of-savings vendor:

A. Always good — locks in lower fees
B. Lock-in risk. Negotiate exit clauses; don't sign without an escape mechanism. Lock-in compounded over years can cost more than the savings if the vendor under-performs or the org's needs change.
C. Random
D. Doesn't matter

<details>
<summary>Show answer</summary>

**Correct: B.** Exit clauses matter. Multi-year without escape is the bad version.
</details>

---

## 5. Apply

Evaluate vendor vs in-house annually. Don't auto-renew without comparison. ZopNight provides the data you need for the evaluation: current commitment portfolio, effective discounts, projected improvements.

For new vendor evaluations: 6-8 weeks of analysis, multi-vendor comparison, reference checks, contract review.

---

## Related lessons

- [L1 — Four commitment instruments](L1_four_levers.md)
- [L2 — Effective discount math](L2_effective_discount.md)
- [L3 — Over-commitment patterns](L3_over_commitment.md)
- [L4 — Schedule first, commit second](L4_schedule_first.md)
- [T4.M4.4 — Budget governance](../M4.4_budget_governance/00_README.md)

## Glossary terms touched

[Share-of-savings](../../../reference/glossary/share-of-savings.md) · [ProsperOps](../../../reference/glossary/prosperops.md) · [Vendor lock-in](../../../reference/glossary/vendor-lock-in.md) · [Exit clause](../../../reference/glossary/exit-clause.md) · [Hybrid model](../../../reference/glossary/hybrid-model.md)

---

## Module quiz

Complete M4.7 → 10-question module quiz unlocks the **Commitment-Expert** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T4.M4.7.L5
