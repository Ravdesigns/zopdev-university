# Drift detection + remediation

§ T5 · M5.1 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **detect** tag drift before it accumulates, **classify** drift events by source, **and resolve** each event with the right pattern (trust cloud / trust ZopNight / re-evaluate).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Catch tag drift in the 6-hour cadence and resolve it weekly so tag coverage stays at 95%+." |
| **Personas** | Platform Engineer · FinOps Lead · SRE |
| **Prerequisites** | M5.1.L1 · M5.1.L2 · M5.1.L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Detect (Apply), Classify (Analyze), Resolve (Apply) |

---

## 1. Concept

Tag drift = cloud-side tags diverging from the expected values defined in your policy or IaC. Even with strong inheritance, drift happens — engineers edit via console, automation modifies tags, IaC plans get rolled back. Without detection, drift compounds silently.

```
WHERE DRIFT COMES FROM:

1. MANUAL CLOUD CONSOLE CHANGES
   Engineer fixes a tag in a hurry via console
   IaC doesn't know; next plan shows a diff
   Or: console wins; IaC silently overwritten on next apply
   
2. TERRAFORM/CDK APPLY WITH NEW VALUES
   Tag policy updated; old resources retain old values
   Until re-applied, drift exists
   
3. CLOUD-SIDE AUTOMATION
   Auto-scaling adds resources without tags
   Service Catalog deployments use different conventions
   Backup automation copies resources with original tags
   
4. MULTI-TEAM CONFLICTS
   Team A renames "team=growth" to "team=monetization"
   Team B's resources still tagged team=growth (forgot to sync)
   Org-wide rename incomplete
```

The 6-hour discovery cadence catches drift within the day; weekly review keeps it from accumulating.

### How ZopNight detects drift

```
EVERY DISCOVERY SYNC (every 6h):
  Read cloud-side tags for each resource
  Compare to ZopNight's expected tags (from policy + last-known state)
  Flag differences
  Surface in Insights → Tag Drift drawer

EXPECTED tags come from:
  Tag policy (what should be there)
  Last-known sync state (what was there)
  IaC source-of-truth (if integrated)
```

The detection is fast; the resolution is the work.

### What a drift event looks like

```
DRIFT EVENT (example from the drawer):
  Resource:         i-0abc123
  Account:          prod-us
  Region:           us-east-1
  Resource type:    aws_instance
  Resource name:    payment-api-server-3
  
  Tag in drift:     environment
    ZopNight expected: dev
    Cloud actual:      prod
    Detected:          2026-05-21 at 14:30 UTC
    Previous sync:     2026-05-21 at 08:30 UTC (was dev)
  
  Recent activity:
    Audit log shows: jane@platform updated tag via console at 12:15 UTC
    IaC last plan:   2026-05-20; expected was "dev"
    Likely cause:    Manual console edit; either intentional fix or
                      mistake
```

The event packet has enough context to resolve quickly.

### Resolution patterns — three options

```
PATTERN A — TRUST CLOUD (cloud is now source of truth)
  WHEN: Engineer made a deliberate change
        Cloud-side value is correct
        IaC was outdated
  
  ACTION:
    Update ZopNight's expected to match cloud
    Update IaC (open PR to align)
    Document the reason
  
  EXAMPLE: tagging fix discovered during incident; cloud-side correct

PATTERN B — TRUST ZOPNIGHT (revert cloud)
  WHEN: Unauthorized change
        Cloud-side value violates policy
        IaC source-of-truth should win
  
  ACTION:
    Revert cloud tag to expected (via auto-tagger or manual)
    Investigate the source of the change (audit log)
    Reach out to the engineer if it was a mistake
    Update process if it was a gap
  
  EXAMPLE: stray "environment=qa" tag (not in allowed values)

PATTERN C — RE-EVALUATE (auto-tagger decides)
  WHEN: Both sides are wrong; need fresh inference
        Confidence in either side is low
  
  ACTION:
    Auto-tagger runs fresh prediction from resource lineage
    Applies high-confidence prediction
    Low-confidence: flags for human review
  
  EXAMPLE: post-reorg drift; both expected and actual are stale
```

The choice depends on the source. Reading the audit log + change timestamps usually makes it obvious.

### Detection cadence

```
EVERY 6h:   Discovery cron compares cloud vs expected
            Drift events appear in drawer
            
EVERY DAY:  Slack notification if >10 new drift events
            (cap notifications to avoid alert fatigue)

EVERY WEEK: Friday Operate review — 15-30 minutes
            Triage week's drift; resolve each
            
EVERY QUARTER: Drift trend review
               If consistent 5%+ drift: structural issue;
                                         investigate root cause
```

The weekly cadence is the workhorse. Most drift gets resolved within 7 days of occurrence.

### Drift trending

Cohort the drift events by week. Healthy orgs stay flat; unhealthy orgs trend up.

```
DRIFT RATE TRENDING (resources with drift / total resources):

LOW (<2% of resources):     Healthy
                            Normal weekly fluctuation
                            
MEDIUM (2-5%):              Manageable
                            Investigate sources; one-off
                            issues common
                            
HIGH (>5%):                  Tagging discipline breakdown
                            Structural issue
                            Investigate: bad IaC, manual changes,
                            auto-policies, multi-team conflict
                            
RISING (week over week):     Recent regression
                            New automation? Recent reorg?
                            Investigate immediately
```

The trend matters more than the absolute number. 3% steady is fine; 3% rising is not.

### Tag-policy drift (a level up)

Drift isn't only cloud-side — the policy itself can drift:

```
POLICY-LEVEL DRIFT:
  Informal changes ("we agreed to add 'project' tag in standup")
  New approved values added without updating the canonical list
  Deprecated values not sunset
  Team-level deviations from org policy

PROTECT THE POLICY:
  Documented version in repo (tag-policy.yaml)
  Changes via PR + review (1-week review minimum)
  Communicate changes to teams via #eng-platform
  Quarterly review of policy itself
```

The tag policy is itself a long-lived artifact. Treat it like a contract.

### Auto-tagger as drift mitigation

ZopNight's auto-tagger continuously checks:

```
ROLE 1: BACKFILL UNTAGGED RESOURCES
  Daily scan for resources missing MVT tags
  Predict from resource name + lineage + parent resources
  Apply high-confidence predictions automatically
  Flag low-confidence for human ID
  
ROLE 2: SUGGEST CORRECTIONS FOR DRIFT
  Drift event detected
  Auto-tagger predicts the correct value
  Suggests in the drawer (engineer accepts or overrides)
  
ROLE 3: NORMALIZE VARIANTS
  "PROD" → "prod" (after rule defined)
  "Production" → "prod"
  Standardizes to canonical value list
  
COMBINED WITH DRIFT DETECTION:
  Continuous tag hygiene with minimal human involvement
  Most drift resolved automatically within 24h
```

The combination — detection + auto-tagger — is the steady-state for mature orgs.

### Anti-patterns — what kills tag hygiene

```
ANTI-PATTERN                              FIX
──────────────────────────────────────────────────────────────────
Ignoring drift drawer                     Weekly Friday review
                                          15-30 minutes
                                          
Resolving without root cause              Investigate WHY drifted
                                          Fix the source, not just
                                          the symptom
                                          
Mass "trust cloud" without review         Pattern A is fine sometimes
                                          But mass-clicking it = giving
                                          up on tag policy
                                          
Tags fixed but IaC not updated            Open PR to sync IaC
                                          Otherwise next apply reverts
                                          your fix
                                          
No notification for high drift            Configure Slack alert on
                                          >10 drift/day or >5% rate
```

Most of these are habits, not technical problems. The discipline of weekly review is the main investment.

### Drift in regulated environments

For SOC 2 / ISO 27001 / regulated workloads:

```
ADDITIONAL CONTROLS:
  Drift events logged for audit
  Resolution recorded (who decided, why)
  Quarterly review by FinOps + Security
  Annual third-party audit verifies process
  
COMPLIANCE FRAME:
  Drift = control deficiency until resolved
  Reasonable resolution time (e.g., 7 days)
  Documented process for unauthorized changes
  
ZopNight stores the audit trail; auditors can export.
```

For unregulated orgs: weekly review is sufficient. For regulated: keep the trail and review evidence quarterly.

---

## 2. Demo

A weekly Operate cadence at a 30-team org:

```
FRIDAY 2pm — TAG DRIFT REVIEW (Platform team + FinOps lead)

OPEN INSIGHTS → TAG DRIFT DRAWER:
  This week: 18 drift events
  Last 4 weeks: 22, 19, 21, 18 events (flat trend; healthy)
  Current drift rate: 1.8% (target <2%)

CATEGORIZE the 18 events:

  Source breakdown:
    Terraform-driven (legitimate):    12
    Manual console changes:            5
       - 4 intentional fixes
       - 1 unknown source (investigate)
    Auto-tagger correction:            1

RESOLUTIONS:

  TRUST CLOUD (Terraform was source of truth, now correct):
    10 events resolved
    1 click to accept; ZopNight expected updated
    
  TRUST CLOUD (manual fixes that were correct):
    4 events resolved
    Engineer documents the change in resolution note
    Open PR to sync IaC where applicable

  TRUST ZOPNIGHT (unauthorized change):
    1 event: jane@platform changed environment=prod → dev on
              a prod resource via console
    Audit log: jane was experimenting; left wrong tag
    Resolution: revert to environment=prod
    Followup: 5-min Slack DM to jane; document for future

  TRUST CLOUD (auto-tagger was right):
    1 event: auto-tagger added missing "team" tag
              Confidence 95%; visually confirms via resource name
    Resolution: accept

TOTAL TIME: 22 minutes for 18 events
RESOLVED: 18 of 18 (100%)
FOLLOWUPS: 1 (jane reminder + 2 IaC sync PRs)

LOG entry to #finops-weekly:
  "Week 21 tag drift review complete.
   18 events: 16 legit changes, 1 unauthorized (resolved + educated),
   1 auto-tagger correction.
   Drift rate stable at 1.8%; no structural issues."
```

The 22-minute weekly investment keeps drift bounded. Without it, drift compounds to 5%+ within 6 months.

---

## 3. Hands-on (5 min)

Check your tag drift posture:

```
□ STEP 1: Open ZopNight → Insights → Tag Drift
  Current open drift events: _____
  Drift rate: _____ %

□ STEP 2: Review the past 4 weeks of drift
  Trend: □ Flat   □ Rising   □ Falling
  If rising: investigate the source

□ STEP 3: Triage your current drift events
  Categorize the top 5 by source:
    1. __________   Source: __________   Resolution: __________
    2. __________   Source: __________   Resolution: __________
    3. __________   Source: __________   Resolution: __________
    4. __________   Source: __________   Resolution: __________
    5. __________   Source: __________   Resolution: __________

□ STEP 4: Schedule weekly review
  Day / time: __________
  Owner: __________
  Duration: 20-30 min
```

A 30-minute audit reveals the drift posture. Weekly cadence keeps it stable.

---

## 4. Knowledge check

### Q1
ZopNight detects tag drift via:

A. Real-time event stream
B. Discovery cron (every 6h). Drift surfaces in the next sync after the change. Fast enough that drift is caught within a day, slow enough to batch resolutions in the Friday review.
C. Random
D. Always immediate

<details>
<summary>Show answer</summary>

**Correct: B.** 6-hour cadence; same-day detection.
</details>

### Q2
A drift event caused by Terraform CI updating tag values:

A. Resolve as "Trust ZopNight"
B. Likely "Trust cloud" — Terraform is the legitimate source of truth in this case. Update ZopNight's expected to match. If the CI change was wrong, fix the IaC; but generally CI-driven changes are legitimate.
C. Random
D. Reject the change

<details>
<summary>Show answer</summary>

**Correct: B.** Source of truth wins. Terraform = legitimate source.
</details>

### Q3
A team with a consistent 5%+ drift rate week over week:

A. Random fluctuation
B. Tagging discipline breakdown. Structural issue — investigate sources: bad IaC, frequent manual changes, missing cloud policy, multi-team conflict. The 5% rate compounds; address root cause not symptoms.
C. Random
D. Fine; tags drift

<details>
<summary>Show answer</summary>

**Correct: B.** Structural issue at 5%+. Address root cause.
</details>

---

## 5. Apply

Weekly drift review (15-30 minutes typically). Resolve drift events with the right pattern. Investigate the source for unauthorized changes. Tune detection cadence for your scale.

For ZopNight: Insights → Tag Drift drawer; alerts configurable for >10/day or >5% rate.

---

## Related lessons

- [L1 — Tags as organizational debt](L1_org_debt.md)
- [L2 — MVT](L2_mvt.md)
- [L3 — Inheritance + propagation](L3_inheritance.md)
- [L5 — Reorg-proof tagging](L5_reorg_proof.md) *(next)*
- [M6.4 — Recipe library (tag-coverage check)](../../T6_ai_powered_cloud_ops/M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Tag drift](../../../reference/glossary/tag-drift.md) · [Drift detection cadence](../../../reference/glossary/drift-detection-cadence.md) · [Trust cloud vs trust ZopNight](../../../reference/glossary/trust-cloud-vs-zopnight.md) · [Drift rate](../../../reference/glossary/drift-rate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.1.L4
