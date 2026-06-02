# Three modes — monitor, recommend, autopilot

§ T2 · M2.4 · L4 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **pick** the right mode for a workload's risk tolerance, **execute** progressive adoption from monitor to autopilot, **and downgrade** safely if needed.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Adopt autoscaling progressively — observe first, recommend next, automate when trusted." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer · FinOps Lead |
| **Prerequisites** | M2.4.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Pick (Evaluate), Execute (Apply), Downgrade (Apply) |

---

## 1. Concept

Three modes form the progressive-autonomy spectrum for autoscaling. Each mode is a position on the trust ladder; teams climb at their own pace.

```
MODE         BEHAVIOR                                  PERMISSION
────────────────────────────────────────────────────────────────────
monitor      Observe only; no actions; suggest in UI    Read-only
recommend    Suggests scaling; customer manually        Read-write
              applies each
autopilot    Autoscaler manages capacity automatically  Read-write (full)
```

The progression matches risk tolerance: monitor for new + uncertain; autopilot for trusted + mature.

### When to use each mode

```
MODE         GOOD FOR                              LIMITATION
────────────────────────────────────────────────────────────────────
monitor      New ZopNight customers                No actual scaling
              Baseline observation period           happens automatically
              Read-only credentials                 Team must act manually
              Pre-production validation
              
recommend    Teams building trust                  Each recommended action
              Regulatory approval gates             requires manual apply
              Manual control preference             More friction than auto
              First weeks with new workload
              
autopilot    Teams with high trust                  Full automation
              Standard production workloads        Team must be comfortable
              Cost-aware set-and-forget             with automated actions
              Mature ops practice
```

The right mode depends on team maturity + workload risk + organizational policies.

### Progressive adoption — typical journey

```
MONTH 0-1: monitor
  Team observes how ZopNight would scale
  Builds confidence the suggestions are reasonable
  Validates against team's intuition
  Zero action; safety guaranteed
  
MONTH 1-3: recommend
  Team manually applies most suggestions
  Validates that recommendations match judgment
  Spot-checks the math
  Discovers any edge cases (e.g., workload-specific patterns)
  
MONTH 3+: autopilot
  Team trusts ZopNight to scale automatically
  Engineers stop manually approving each action
  Spot-check dashboard weekly
  Set-and-forget steady state
```

This progressive adoption is intentional. Going straight to autopilot for new teams can fail if recommendations don't match team judgment.

### Mode at the policy level

Mode is per-policy. A team can have a mix:

```
POLICY                    MODE
────────────────────────────────
prod-api-asg              autopilot   (stable, trusted)
prod-batch-asg            recommend   (new workload, validating)
dev-experiment-asg        monitor     (just observing patterns)
ml-training-asg           recommend   (latency-critical; want human review)
```

Each policy carries its own mode. Changing modes is a policy edit; takes effect immediately.

### What changes between modes

```
ACTION                       monitor   recommend   autopilot
────────────────────────────────────────────────────────────
Observe metrics               Yes       Yes        Yes
Compute recommendations       Yes       Yes        Yes
Show recommendations in UI    Yes       Yes        Yes
Send Slack notifications      Yes       Yes        Yes
Apply scaling automatically   No        No         Yes
Allow manual apply            N/A       Yes        N/A (auto)
Cloud-side native autoscaler  
  (if exists, independent)     Yes      Yes        Adopted/replaced
```

In monitor mode, any existing cloud-side autoscaler continues to do its own native scaling — ZopNight just doesn't touch it. ZopNight observes and provides recommendations.

### Mode + Adopt-or-Replace interaction

Mode interacts with the adopt-or-replace flow (M2.5):

```
ZopNight encounters an existing cloud-side policy:

monitor mode:    Never replaces. Observation-only.
recommend mode:  Never replaces without explicit user click.
autopilot mode:  Depends on the policy's `source` field
                  Adopted: stays observation-only
                  Recommended: managed by ZopNight
```

The adopt-or-replace flow (M2.5) is critical for safe operation.

### Downgrade — easy rollback

A team in autopilot can downgrade to recommend at any time:

```
DOWNGRADE STEPS:
  1. Open the policy
  2. Click "Change mode"
  3. Select recommend
  4. Confirm

EFFECT:
  ZopNight stops automated actions
  Cloud-side policy remains intact
  ZopNight's automated layer paused
  
  Easy to roll back if needed (no destructive change)
```

The downgrade is safe. Roll back anytime.

### Upgrade — adds permission check

Upgrading (recommend → autopilot) is similar but requires permissions:

```
UPGRADE STEPS:
  1. Open the policy
  2. Click "Change mode"
  3. Select autopilot
  4. ZopNight checks credential permissions
     If sufficient: confirm
     If insufficient: prompts for IAM update
  5. Confirm

EFFECT:
  ZopNight starts executing scaling actions
  Cloud-side policy now managed by ZopNight
  Engineer can monitor via dashboard
```

The permission check prevents accidental upgrades to autopilot with insufficient IAM.

### Mode anti-patterns

```
ANTI-PATTERN                              FIX
──────────────────────────────────────────────────────────────────
Jump to autopilot on day 1                Progress through monitor → recommend
                                          Build trust incrementally
                                          
Stuck in monitor forever                  Move to recommend after 2-3 weeks
                                          Otherwise no value from observations
                                          
Apply every recommendation blindly         Spot-check the math
in recommend mode                          Verify against intuition
                                          
Re-deploy policy frequently                 Tune existing; don't recreate
                                          Mode changes are non-destructive
                                          
All-policy autopilot from day 1            One workload at a time
                                          Risk-managed rollout
```

The progression discipline prevents the most common adoption failures.

---

## 2. Demo

A team's first autopilot rollout:

```
WEEK 1 — monitor on 3 ASGs (prod web, prod batch, dev)
  Observe ZopNight's recommendations daily
  Note: would scale to N every weekend? Yes
  Average recommendation: scale down 2-3 instances on weekends
  No actions yet

WEEK 2-3 — switch dev ASG to recommend
  Team manually applies suggestions for 2 weeks
  Observed cost savings on dev: ~22%
  No incidents
  Engineer satisfaction: positive
  
WEEK 4 — switch dev ASG to autopilot
  Dev is auto-managed
  Stable
  Monitor dashboard daily for first week

WEEK 5-7 — repeat for prod batch ASG (less critical than prod web)
  Monitor → recommend → autopilot progression
  Same pattern; same results

WEEK 8+ — eventually for prod web
  Full team confidence built
  Prod web in autopilot
  ZopNight manages all scaling
  ~15-25% cost savings across the fleet
  
OUTCOMES at 2 months:
  3 ASGs in autopilot
  Average savings: 18%
  Incidents from auto-rem: 0
  Engineer manual scaling actions: dropped 95%
```

Two months to full autopilot on 3 ASGs. Faster on well-understood workloads, slower on critical ones.

---

## 3. Hands-on (5 min)

Identify current mode of your policies:

```
□ STEP 1: Open Automation → Policies
  
□ STEP 2: For each policy, note mode
  Policy 1: __________   Mode: __________
  Policy 2: __________   Mode: __________
  Policy 3: __________   Mode: __________

□ STEP 3: Plan progression
  Currently in monitor?  Plan move to recommend (after 1-2 weeks)
  Currently in recommend? Plan move to autopilot (after 2-4 weeks of validation)
  
□ STEP 4: Set quarterly mode-review reminder
  Date: __________
  Owner: __________
  Goal: track # of policies in each mode quarter over quarter
```

A 5-minute review reveals mode posture. Quarterly cadence drives the progression.

---

## 4. Knowledge check

### Q1
A team with read-only IAM credentials. The maximum mode they can use:

A. autopilot
B. monitor — read-only can observe and recommend in the UI but cannot execute scaling. To upgrade, customer adds scoped-write permissions; mode auto-upgrades.
C. recommend
D. None

<details>
<summary>Show answer</summary>

**Correct: B.** Permission level limits mode.
</details>

### Q2
A team's risk-averse policy on production. The pattern:

A. Skip autopilot, stay at recommend forever
B. Use recommend, accumulate trust over weeks. Once confident, upgrade to autopilot. Or stay at recommend if regulatory approval gates are strict. Both are defensible.
C. Always autopilot
D. Always monitor

<details>
<summary>Show answer</summary>

**Correct: B.** Progressive autonomy is the typical pattern.
</details>

### Q3
Mode is set per:

A. Org
B. Policy — each autoscaler policy has its own mode, set independently. Per-policy granularity matches the per-workload risk profile.
C. Cloud account
D. Resource type

<details>
<summary>Show answer</summary>

**Correct: B.** Per-policy granularity matches per-workload risk.
</details>

---

## 5. Apply

Automation → Policies → click any policy → Settings → Mode is the configuration point. Mode change takes effect immediately.

For your team: track mode distribution; aim to climb toward autopilot for well-understood workloads.

---

## Related lessons

- [L1 — Scaling policy basics](L1_scaling_policy_basics.md)
- [L2 — Welford stats](L2_welford_stats.md)
- [L3 — Quick setup](L3_quick_setup.md)
- [L5 — Lifecycle](L5_lifecycle.md) *(next)*
- [L6 — Event log](L6_event_log.md)
- [M2.5 — Adopt or replace](../M2.5_adopt_or_replace/00_README.md)

## Glossary terms touched

[Monitor mode](../../../reference/glossary/monitor-mode.md) · [Recommend mode](../../../reference/glossary/recommend-mode.md) · [Autopilot mode](../../../reference/glossary/autopilot-mode.md) · [Progressive autonomy](../../../reference/glossary/progressive-autonomy.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.4.L4
