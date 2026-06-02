# "Detect and act" — what CDCR means

§ T0 · M0.6 · L1 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **define** CDCR, **distinguish** it from the report-and-ticket pattern, **and articulate** why "act" is the differentiator.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Have the conversation about why detect-only is broken." |
| **Personas** | All five |
| **Prerequisites** | M0.1 through M0.5 |
| **Time** | 10 minutes |
| **Bloom verb** | Define (Remember) and Distinguish (Analyze) |

---

## 1. Concept

**CDCR** stands for *Continuous Detect, Continuous Remediation*. It is the operating model where cost optimization is not an event but a loop: the system continuously detects waste, classifies it by safety, and remediates within minutes-to-hours instead of weeks.

CDCR is the framing this University is built around. The rest of the curriculum is the working knowledge required to operate it.

### The legacy pattern: report and ticket

The pattern CDCR replaces is older than cloud. Call it **report-and-ticket**:

```
1. A tool detects waste (idle EC2, oversized RDS, orphaned EBS)
2. The tool surfaces it in a report or dashboard
3. A human reads the report (days later, typically)
4. The human files a Jira ticket
5. The ticket waits in a backlog (weeks)
6. An engineer eventually picks up the ticket
7. The engineer makes the change in production (manual, error-prone)
8. The savings finally land
9. Loop back to step 1 — but now the waste has accumulated for weeks
```

Every step is friction. The detector is fast (24h cadence at worst). Steps 2 through 8 routinely take 30 days or more. Even with a strong FinOps team, the realized time-to-remediation is 4–8 weeks per finding.

The waste accumulates throughout. A $500/month idle EC2 instance found on day 1 and remediated on day 45 has burned $750 of avoidable spend in the interim. Multiply by hundreds of findings in a typical estate and the structural waste is substantial.

### The CDCR pattern

CDCR replaces the workflow:

```
1. Continuous discovery: the system polls and detects every few hours
2. Continuous classification: each finding is tagged by safety category
                              (safe-to-auto / safe-with-approval / human-only)
3. Continuous remediation: safe findings remediate automatically
                            with-approval findings raise a request
                            human-only findings get an actionable alert
4. Continuous verification: the action's effect is confirmed in billing
5. Loop continues, no human in the critical path for safe findings
```

The time-to-remediation drops from weeks to hours or minutes. The avoidable waste between detection and remediation shrinks to near-zero on the safe class.

### What "continuous" means specifically

```
DISCOVERY CADENCE       6 hours (cron) + manual refresh available
RECOMMENDATION RECOMPUTE Triggered on every discovery event
SAFE REMEDIATION LATENCY <30 minutes from detection
APPROVAL-GATED LATENCY   <24 hours typical (depends on approver SLA)
ANOMALY DETECTION        15 minutes
```

Each cadence is short enough that the loop closes within the same business day. No multi-week backlog. No "I'll get to it next sprint."

### What "act" means specifically

CDCR's act layer is **not** a single big red button. It is a graduated authority model:

```
SAFETY CLASS                  ACT MODE
─────────────────────────────────────────────────────────────
Idle / orphan / scheduled     Auto (within scope and rate limits)
Right-sizing                  Approval-gated (admin sign-off)
Database / stateful changes   Never auto — human-only with playbook
Recommendations                Always shown — auto-remediation is opt-in
```

The system is "act"-capable but does not act recklessly. Customers explicitly choose what to delegate. The default for most write operations is approval-gated, not auto. (Full safety model in [L3](L3_read_only_safety.md).)

### Why "act" is the differentiator

The cost-tracking tool market is crowded. Vantage, CloudHealth, Apptio, CloudZero, Flexera — every major player has cost reporting. What separates is whether they *do* anything about what they report.

CDCR is the practice that closes the report-to-action gap. The competitive landscape (from the [Competition Parity research](../../../../../All%20Research/Compititon%20Parity/00_INDEX.md)):

```
TOOL CATEGORY         DETECT  TICKET  ACT
─────────────────────────────────────────
CloudHealth            Y        Y      N
Flexera                Y        Y      N
Vantage                Y        Y      N
CloudZero              Y        Y      N
Apptio                 Y        Y      N
─────────────────────────────────────────
ZopNight               Y        Y      Y     ← the differentiator
─────────────────────────────────────────
CAST AI (K8s only)     Y        N      Y     ← act-only, narrow scope
Spot.io (K8s + VM)     Y        N      Y     ← act-only, narrow scope
```

The CDCR claim is mathematically defensible: a tool that closes the loop saves more, faster, with less human friction, than a tool that surfaces the same data without acting.

### Five things CDCR makes possible

1. **Time-to-remediation in hours.** Not weeks. The number that matters.
2. **Compounding savings.** Each closed loop reveals the next finding, faster.
3. **Higher confidence in commitments.** A steady operate loop reveals the true floor for commitment design (see [M0.3 L4](../M0.3_scheduling_vs_commitments/L4_decision_tree.md)).
4. **Lower opportunity cost.** Engineering hours are not consumed by ticket triage.
5. **Better ownership.** When the team sees the loop close in real time, ownership of the cost surface becomes natural.

---

## 2. Demo

A real (anonymized) detect-and-act loop in a customer estate:

```
T+0 min   Discovery cron runs, sees i-0xyz123 stopped for >30 days
T+1 min   Recommendation engine fires: RC-001 (Idle EC2), severity medium
          Resource is tagged environment=dev, no override, no DB attachment
T+1 min   Classification: safe-to-auto (idle, non-prod, no dependencies)
T+2 min   Customer's Auto-Remediation toggle is ON for RC-001 in dev
T+3 min   Action: terminate EC2, terminate attached EBS, snapshot first
T+5 min   Verify: state confirmed terminated, billing record drops to $0
T+5 min   Notification: Slack post to #finops-loop with savings claim
T+24 hr   Billing sync confirms the saved hours
T+24 hr   Realized savings: $34.10 (rack rate of avoided EC2 + EBS hours)
```

Five minutes from detection to remediation. Twenty-four hours from start to verified savings. No human ticket, no waiting, no backlog.

For approval-gated rules (rightsizing, anything destructive), the same loop with an extra step:

```
T+0       Detection
T+5 min   Classification: safe-with-approval (rightsizing prod DB)
T+5 min   Approval request sent to designated admin via Slack DM
T+4 hr    Admin approves (the typical SLA — humans are slow)
T+4:05    Action executes
T+24 hr   Billing sync confirms saved hours
```

Four hours from detection to remediation. Worse than the auto path but still 10× faster than the report-and-ticket equivalent (which would have been 4–6 weeks).

(Asset: `assets/diagrams/M0.6_L1_cdcr_timeline.svg`.)

---

## 3. Hands-on (5 min)

Walk your own current FinOps process against the CDCR loop:

```
1. Time from detection to surfacing in a report:
   __________ (target: hours)

2. Time from surfacing to engineering ticket:
   __________ (target: hours)

3. Time from ticket to remediation:
   __________ (target: hours; current state: weeks)

4. Time from remediation to verified savings:
   __________ (target: 24-48 hours via billing sync)

5. TOTAL CURRENT TIME-TO-REMEDIATION: ____________
   TARGET WITH CDCR: < 24 hours for safe, < 1 week for approval-gated
```

The gap between current and target is the structural waste the CDCR model removes.

---

## 4. Knowledge check

### Q1
CDCR most accurately stands for:

A. Continuous Distribution, Continuous Replication
B. Continuous Detect, Continuous Remediation — the operating model where waste is not just reported but acted on continuously
C. Cloud Detection / Cloud Response
D. Custom Detection, Custom Reporting

<details>
<summary>Show answer</summary>

**Correct: B.** CDCR pairs continuous detection (the report side) with continuous remediation (the act side). The pairing is the framing.
</details>

### Q2
The fundamental difference between CDCR and report-and-ticket is:

A. CDCR uses newer tools
B. CDCR closes the loop within hours instead of weeks by removing the human ticket / backlog steps from safe-to-act remediations
C. CDCR is cheaper to license
D. CDCR is automated, report-and-ticket is manual

<details>
<summary>Show answer</summary>

**Correct: B.** The fundamental difference is the closed loop and the latency improvement. Automation is part of how CDCR achieves it but the claim is the loop, not just automation.
</details>

### Q3
"CDCR auto-remediates everything by default" is most accurately:

A. True
B. False. CDCR is graduated: safe findings (idle, orphan) can auto-remediate when enabled. Rightsizing and destructive operations remain approval-gated. Database and stateful changes are human-only. The default is conservative.
C. True for prod, false for dev
D. True only for compute

<details>
<summary>Show answer</summary>

**Correct: B.** CDCR's safety model is the topic of [L3](L3_read_only_safety.md). The system is act-capable but the default is approval-gated for most write paths.
</details>

---

## 5. Apply

ZopNight's product surface implements CDCR throughout:

- **Discovery → Recommendations → Auto-Remediation** is the canonical loop
- **Schedules → Cron Execution** is the same loop for scheduling
- **Anomaly Detection → Alert → Root Cause** is the same loop for spikes
- **Auto-Remediation toggle** (per-rule, per-org) lets customers opt in to auto-remediation for safe rules
- **Approval gate** is configurable per rule; admin sign-off for destructive ops

The [USE-CASES.md](../../../../USE-CASES.md) §7 (Recommendations) and §11 (Reliability) capture the contract: detect, classify, act within scope.

---

## Related lessons

- [L2 — The cost of detect-only](L2_cost_of_detect_only.md) *(next)*
- [L3 — Read-only safety](L3_read_only_safety.md)
- [L4 — What CDCR is NOT](L4_what_cdcr_is_not.md)
- [T2.M2.3 — Auto-remediation](../../T2_zopnight_engineer/M2.3_auto_remediation/00_README.md)

## Glossary terms touched

[CDCR](../../../reference/glossary/cdcr.md) · [Report-and-ticket](../../../reference/glossary/report-and-ticket.md) · [Time-to-remediation](../../../reference/glossary/time-to-remediation.md) · [Safe-to-auto](../../../reference/glossary/safe-to-auto.md) · [Graduated authority](../../../reference/glossary/graduated-authority.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.6.L1
