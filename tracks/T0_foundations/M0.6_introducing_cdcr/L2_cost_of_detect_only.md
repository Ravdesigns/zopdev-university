# The cost of detect-only — case study

§ T0 · M0.6 · L2 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **quantify** the cost of detect-only operation **and present** the business case for closing the loop.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Show the CFO the number that justifies investment in CDCR." |
| **Personas** | FinOps Analyst · Engineering Leader · Finance Partner |
| **Prerequisites** | [L1](L1_what_cdcr_means.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Quantify (Apply) and Present (Create) |

---

## 1. Concept

Detect-only operation has a cost. The cost is the avoidable spend that continues to bill between the moment a finding is detected and the moment it is remediated. For a typical estate, this cost is substantial and rarely measured.

### The arithmetic

For any single finding:

```
COST OF DETECT-ONLY (per finding)
  = monthly savings if remediated × (time-to-remediation in months)
```

For 100 findings averaging $300/month potential savings with a 45-day average time-to-remediation:

```
Avoided monthly savings:        100 × $300 = $30,000
Time-to-remediation:            45 days = 1.5 months
Cost of the 45-day delay:       100 × $300 × 1.5 = $45,000

Annualized run-rate:            $45,000 × ~8 cycles per year = ~$360,000
```

Even modest assumptions produce a six-figure annual cost from delay alone. The estate is paying for waste that has been identified but not yet acted on.

### The case study

Anonymized, real customer. 800-employee SaaS, $2.1M monthly cloud spend, three years of FinOps practice at Walk maturity.

**Before CDCR (pure report-and-ticket):**

```
DETECTION
  Recommendations surfaced per month:        ~250
  Median savings per recommendation:         $180/mo
  Total potential monthly savings detected:  $45,000

REMEDIATION
  Median time from surfaced → remediated:    38 days
  Pickup rate (% of recs actually remediated): 47%
                                              (53% closed as "won't fix")

REALIZED VS POTENTIAL
  Theoretical max if all remediated day 0:   $45,000/mo
  Actual realized (47% × time-decay factor):  $11,200/mo (25% of potential)
  Gap (the cost of detect-only):              $33,800/mo (75% of potential)

ANNUALIZED COST OF DELAY                      $405,600/year
```

**After 90 days of CDCR rollout:**

```
DETECTION (unchanged — same detection engine)
  Recommendations surfaced per month:        ~250
  Median savings per recommendation:         $180/mo
  Total potential monthly savings detected:  $45,000

REMEDIATION
  Median time for safe-class auto-rem:       under 30 min
  Median time for approval-gated:            12 hours
  Median time for human-only:                still 38 days but only ~30 such recs
  Pickup rate:                                89%

REALIZED VS POTENTIAL
  Theoretical max:                            $45,000/mo
  Actual realized:                            $37,800/mo (84% of potential)
  Remaining gap:                              $7,200/mo (16% of potential)

ANNUALIZED COST OF DELAY                      $86,400/year
                                              (down from $405,600)
```

**The business case:** $319,200 annual improvement realized purely from closing the detect-to-act loop, with no new detection logic, no new pricing, no headcount change.

### Three sources of detect-only cost

The case study breaks down into three drivers:

**1. Time-decay.** The longer a finding sits unrealized, the more it costs. Auto-remediation drops time-to-remediation from 38 days to 30 minutes. The waste in the interim is the savings.

**2. Won't-fix attrition.** 53% of findings in the detect-only world ended up as "won't fix" — not because they were wrong, but because by the time someone picked them up, the context had changed, the team had moved on, and the finding fell into the backlog. With CDCR auto-remediation, attrition drops sharply because the loop closes before context decays.

**3. Compounding.** A team that successfully closes 250 findings/month has more capacity to spot the next 250. A team that closes 50 of 250 falls behind. Compounding works for or against the practice depending on whether the loop is open.

### The argument that doesn't work

A common objection: "Just hire more people." If the bottleneck is ticket throughput, more engineers can close more tickets, right?

The math doesn't work. A FinOps team of three closing 250 tickets/month at $180 average savings produces $45K realized savings — minus the $300K-450K fully-loaded cost of three FinOps engineers. The team is a net cost until the ticket throughput is much higher than ~250/month at $180 average. Real teams rarely sustain that throughput because of context-switching, prioritization debates, and political friction.

CDCR sidesteps the throughput problem entirely. The loop closes itself for the safe class. Engineering attention focuses on the ~10% of findings that genuinely require judgment.

### When detect-only is the right answer

Two scenarios:

1. **Very small estates (<$10K/month).** The mechanical fixes of CDCR don't pay back the operational overhead. Reading the bill weekly and acting manually is fine.
2. **Regulated environments with hard approval requirements on every change.** If every cloud action requires a Change Advisory Board, CDCR's auto path is not legal. Approval-gated remediation still helps but the latency reverts to weeks.

Above $50K/month, detect-only is structurally suboptimal.

---

## 2. Demo

The same case study, presented as a chart:

```
COST OF DELAY — pre-CDCR vs post-CDCR

   $45K ┤         ────────                           Detected potential
        │
        │              ── ── ──
   $35K ┤                                            Post-CDCR realized
        │
        │
        │
   $11K ┤      ●  ●  ●  ●  ●                         Pre-CDCR realized
        │
     $0 ┴─────────────────────────────────────────
         Jan   Feb   Mar   Apr   May   Jun
                       (CDCR rollout)

ANNUALIZED IMPROVEMENT: $319,200
```

The numbers presented this way settle the business case. The improvement is not from detecting more — it is from acting faster on the same detections.

(Asset: `assets/diagrams/M0.6_L2_realized_vs_potential.svg`.)

---

## 3. Hands-on (6 min)

For your own organization:

```
1. How many recommendations does your current tool surface per month?
   N = __________

2. Median monthly savings per recommendation:
   $S = __________

3. Total monthly potential:
   $P = N × $S = __________

4. Median time from surfaced to remediated:
   T = __________ days

5. Pickup rate (what % actually get acted on):
   R = __________ %

6. Current realized savings:
   $R = $P × R% × (time-decay factor, assume 0.7)
       = __________

7. Cost of detect-only:
   $D = $P − $R = __________ per month

8. Annualized:
   __________ per year
```

The annualized cost of detect-only is the business case for CDCR investment.

---

## 4. Knowledge check

### Q1
A team detects $40K/month in potential savings but only realizes $9K/month. The cost of detect-only operation is:

A. $9K/month
B. $31K/month — the gap between detected potential and realized savings
C. $0 — they are realizing what they can
D. $40K/month — the full potential

<details>
<summary>Show answer</summary>

**Correct: B.** The cost is the gap, not the realized or the potential. The gap is what CDCR closes.
</details>

### Q2
A common objection to CDCR is "we just need more FinOps headcount to close tickets faster." Most defensible counter-argument:

A. Headcount is expensive
B. The math doesn't work — a FinOps engineer fully-loaded costs $150K+. Closing 250 tickets per month at $180 average savings produces $45K realized, less than the headcount cost. CDCR closes the loop without adding people; people focus on the ~10% requiring judgment.
C. Engineers are scarce
D. CDCR is a buzzword

<details>
<summary>Show answer</summary>

**Correct: B.** The math is the argument. Scaling FinOps by headcount alone hits diminishing returns fast. CDCR scales the act layer without scaling people.
</details>

### Q3
A team is at <$10K/month total cloud spend. The defensible posture is:

A. Implement CDCR immediately
B. Manual cost review weekly. CDCR's operational overhead is not paid back at small scale. Plain reading-and-acting is fine.
C. Hire a FinOps consultant
D. Switch clouds

<details>
<summary>Show answer</summary>

**Correct: B.** Honesty about scale. CDCR is a great fit above ~$50K/month. Below that, the discipline matters more than the tooling.
</details>

---

## 5. Apply

ZopNight's [Recommendations](https://app.zopnight.com/recommendations) page tracks both detected and remediated savings. The summary card shows:

- **Total Open Recommendations** (detected potential, not yet realized)
- **Total Applied Recommendations** (realized savings, last 30 days)
- **Auto-Remediation Coverage %** (the percentage of safe-class findings that auto-remediate vs. await approval)

These three numbers are the input to the cost-of-detect-only conversation. Track them weekly. The annualized gap is the business case.

---

## Related lessons

- [L3 — Read-only safety](L3_read_only_safety.md) *(next)*
- [L4 — What CDCR is NOT](L4_what_cdcr_is_not.md)
- [T2.M2.3 — Auto-remediation](../../T2_zopnight_engineer/M2.3_auto_remediation/00_README.md)

## Glossary terms touched

[Cost of detect-only](../../../reference/glossary/cost-of-detect-only.md) · [Time-decay](../../../reference/glossary/time-decay.md) · [Won't-fix attrition](../../../reference/glossary/wont-fix-attrition.md) · [Pickup rate](../../../reference/glossary/pickup-rate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.6.L2
