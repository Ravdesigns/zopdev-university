# Three unreconstructible refusals

§ T2 · M2.5 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** the three policy shapes that block Replace, **diagnose** why each can't be reconstructed, **and choose** the right alternative (Adopt vs manual cleanup).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the safety guarantees behind Replace refusals — and pick the right workaround when refused." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.5.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Recognize (Apply), Diagnose (Analyze), Choose (Evaluate) |

---

## 1. Concept

Replace requires byte-accurate restoration on Remove. Three policy shapes cannot be reliably restored from their raw_spec — ZopNight refuses Replace on these. Zero AWS mutation.

```
THE THREE REFUSALS:
  1. PredictiveScaling policy type
  2. StepScaling with >2 step adjustments
  3. Customized metric specs with math or multiple dimensions
  
PURPOSE: avoid silent restoration drift; safety architecture
```

The refusals are pessimistic — better to refuse than risk a bad restore.

### Refusal 1 — PolicyType = PredictiveScaling

```
WHY REFUSED:
  Predictive scaling maintains internal predictor state
  (machine learning model)
  
  The rawSpec captures the configuration BUT NOT the trained model
  Restoring would create a brand-new predictor
  New predictor would behave differently
  
  Customer expectation: pre-ZopNight predictor behavior
  Restore reality: new predictor; different decisions

REFUSAL MESSAGE:
  "Predictive scaling policy detected.
   ZopNight cannot guarantee byte-accurate restoration on Remove.
   Use Adopt to manage as observe-only,
   or recreate the predictive policy manually after Remove."

ALTERNATIVE: Adopt only.
```

The stateful nature of predictive scaling makes it un-reconstructible.

### Refusal 2 — Step Scaling with >2 step adjustments

```
WHY REFUSED:
  AWS's step_adjustments field has lower/upper bound semantics
  Bounds vary subtly across SDK versions
  Restoring policies with many steps risks behavior shifts
  ZopNight conservatively refuses Replace on these

EXAMPLE OF PROBLEMATIC POLICY:
  policy_type: StepScaling
  step_adjustments:
    - lower: 0, upper: 25, scaling: +1
    - lower: 25, upper: 50, scaling: +2
    - lower: 50, upper: 75, scaling: +3
    - lower: 75, upper: 100, scaling: +5
    - lower: 100, upper: null, scaling: +8
  
  (5 step adjustments; ZopNight refuses Replace)

REFUSAL MESSAGE:
  "Step scaling policy with N step adjustments detected.
   Replace risks restoration drift.
   Use Adopt or simplify the step structure manually."

ALTERNATIVE: Adopt; OR manually convert to target tracking + 
             a single step, then Replace.
```

The bound semantics are subtle enough that drift is real risk.

### Refusal 3 — Customized metric specs

```
WHY REFUSED:
  Target tracking can use a customized metric
  
  If that customized metric has:
    Metric math (combining multiple metrics)
    Multiple dimensions
    Complex query syntax
  
  The rawSpec capture is complex enough that:
    Restoration risks subtle behavior changes
    Provider-side semantics may have drifted
    
  ZopNight refuses Replace here

EXAMPLE:
  Customized metric:
    Metric math: (RequestCount / Latency) * Errors
    Dimensions: 3 (region, environment, version)
    
  Restoring this exactly is fragile

REFUSAL MESSAGE:
  "Customized metric specification with metric math or multiple
   dimensions detected.
   Replace cannot guarantee restoration. Use Adopt."

ALTERNATIVE: Adopt; OR replace the customized metric with a simpler
             target tracking policy before Replace.
```

The metric complexity defeats byte-accurate restore.

### What happens at Replace time

```
REPLACE PROCESS WITH RECONSTRUCTIBILITY CHECK:

1. Wizard fetches existing config
2. Reconstructibility check runs against each policy
   For each policy:
     Check predictive scaling
     Check step adjustments count
     Check customized metric complexity
     
3. IF ANY CHECK FAILS:
   Replace refused
   Reason displayed
   Zero AWS API calls made
   
4. IF ALL CHECKS PASS:
   Replace proceeds
   Saved + executed normally

USER EXPERIENCE:
  Sees the refusal in wizard
  Sees the specific reason
  Picks: Adopt, or manual cleanup, or cancel
  Zero risk of bad state
```

The check is automatic; the explanation is concrete.

### The editable=false flag

For policies in the three refusal categories, the UI marks them `editable=false`:

```
POLICY: legacy-step-policy-with-5-steps
─────────────────────────────────────────────────────────
Source:     adopted
Editable:   false (step scaling with 5 adjustments)

The Edit button is hidden. You can:
  Observe this policy (Adopt mode)
  Remove it (cloud-side state unchanged since Adopt didn't mutate)
  
WHY editable=false:
  Editing would trigger auto-promote to recommended
  Recommended requires byte-accurate restore capability
  But this policy can't be reconstructed
  So editing isn't allowed
  
WORKAROUND:
  Simplify the cloud-side policy manually
  Then re-Adopt (or re-Replace if reconstructibility now passes)
```

The flag protects against accidental ownership changes that would create unsafe state.

### Why so conservative

```
THE COST OF A BAD RESTORE:
  
  Predictive scaling restored:
    New predictor; different behavior
    Could under-provision during forecasted peak
    Customer impact: latency, errors
    
  Step scaling restored with drift:
    Actions fire at wrong thresholds
    Could over-scale or under-scale
    Customer impact: cost overrun or saturation
    
  Customized metric restored incorrectly:
    Scaling driven by wrong metric
    Could under-respond to real load
    Customer impact: variable; potentially severe

REVERSIBILITY IS THE CONTRACT REPLACE MAKES
  If reversibility can't be guaranteed, the contract is void
  Better to refuse than break the contract
```

The conservative posture builds trust through guaranteed safety.

### Workarounds

```
SHAPE                                 WORKAROUND
──────────────────────────────────────────────────────────
Predictive scaling                    Adopt only
                                      Cannot upgrade to Replace
                                      without recreating cloud-side
                                      
Step scaling with >2 steps             Manually consolidate the steps in
                                      the cloud console first (down to 2)
                                      Then Replace
                                      
Customized metric with math            Replace the cloud-side metric with
                                      a simpler target tracking policy
                                      (single CloudWatch metric; no math)
                                      Then Replace via ZopNight
```

In all cases, the workaround requires manual cleanup in the cloud console before Replace.

### How to plan migrations from refused policies

```
SCENARIO: customer wants to take ZopNight ownership of a predictive
          scaling policy that's been refused

OPTIONS:
  
  OPTION 1: stay with Adopt
    Pros: zero work; observation continues
    Cons: ZopNight can't optimize this policy
    Default: this is fine if the policy is well-tuned
    
  OPTION 2: replace the predictive scaling with target tracking
    Steps:
      1. In cloud console: delete predictive scaling policy
      2. In cloud console: create target tracking policy
      3. In ZopNight: trigger Replace (now passes reconstructibility)
      4. ZopNight manages target tracking going forward
    Pros: ZopNight ownership; cleaner setup
    Cons: temporary period without predictive scaling
    
  OPTION 3: hybrid
    Keep predictive scaling as adopted
    Add ZopNight-managed target tracking alongside
    Two policies on same target; cloud combines them
    Pros: ZopNight value + predictive scaling preserved
    Cons: more complex configuration
```

The right path depends on the workload's actual needs.

---

## 2. Demo

A team encountering a refusal:

```
T+0       Wizard for ASG with step scaling: 5 step adjustments

T+5s      Reconstructibility check runs:
          Predictive scaling: not present ✓
          Step scaling with >2 steps: PRESENT (5 steps) ✗
          
T+5s      Replace REFUSED
          
T+5s      Wizard shows:
          "Step scaling policy with 5 step adjustments cannot be
           reliably restored. Choose:
           - Adopt (observe only)
           - Cancel
           - [Reference: simplify the step structure manually first]"

T+10s     Customer picks Adopt
          Policy tracked as adopted
          Cloud-side unchanged (zero mutation)

LATER (3 months):
  Customer reviews adopted policy
  Decides: "I want ZopNight to manage this"
  
  Customer simplifies the step structure in CloudFormation:
    Was: 5 step adjustments
    Now: 2 step adjustments
    
  Customer re-triggers Replace
  Reconstructibility check passes (2 steps ≤ 2; passes)
  
T+5 min   Re-Replace: succeeds
          Source flips to recommended
          ZopNight manages the policy going forward

OUTCOME:
  Refusal protected against silent risk
  Customer chose deliberately when to upgrade
  Cloud-side restoration capability preserved throughout
```

The refusal protects against silent risk. The customer chose deliberately when to upgrade.

---

## 3. Hands-on (5 min)

Identify reconstructibility issues in your estate:

```
□ STEP 1: Open ASGs with autoscaling
  
□ STEP 2: Check each for refusal triggers
  Predictive scaling? Yes/No
  Step scaling steps count: _____
  Customized metric? Yes/No
  
□ STEP 3: Classify each
  Replaceable (passes all checks): _____
  Refused (one or more check fails): _____

□ STEP 4: Plan for refused policies
  Stay adopted (no work needed): _____
  Simplify and replace later: _____ (which ones)

□ STEP 5: Schedule simplification work (if planned)
  Owner: __________
  Target completion: __________
```

A 10-minute audit reveals the refusal landscape.

---

## 4. Knowledge check

### Q1
A policy with predictive scaling. Can it be Replaced?

A. Yes
B. No — predictive scaling cannot be byte-accurately restored. The trained model state isn't capturable. Adopt is the only path. Refusal #1.
C. With approval
D. Only on AWS

<details>
<summary>Show answer</summary>

**Correct: B.** Refusal #1; trained model state can't be restored.
</details>

### Q2
A step scaling policy has 2 step adjustments. Can it be Replaced?

A. No
B. Yes — 2 adjustments are within the bound. ≥3 is refusal #2. Customer can Replace this normally.
C. Only adopted
D. With downgrade

<details>
<summary>Show answer</summary>

**Correct: B.** 2 adjustments is fine; 3+ triggers refusal #2.
</details>

### Q3
A target tracking policy uses a customized metric that combines RequestCount and Latency via metric math. Can it be Replaced?

A. Yes
B. No — refusal #3 (customized metric with math). Use Adopt, or simplify the metric first (single CloudWatch metric, no math). The complexity defeats byte-accurate restore.
C. With confirmation
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Refusal #3.
</details>

---

## 5. Apply

The reconstructibility check runs automatically. Refusals are shown in the wizard. Editable=false flag visible on policy detail pages.

For your team: classify your policies; understand which fall into refusal categories; plan workarounds for the ones you want to migrate.

---

## Module quiz

Complete M2.5 → 10-question module quiz unlocks the **Adopt-Aware** chip.

---

## Related lessons

- [L1 — Why adopt-or-replace](L1_why_aor.md)
- [L2 — Adopt flow](L2_adopt_flow.md)
- [L3 — Replace flow](L3_replace_flow.md)
- [M2.4 — VM autoscaling](../M2.4_vm_autoscaling/00_README.md)

## Glossary terms touched

[Reconstructibility refusal](../../../reference/glossary/reconstructibility-refusal.md) · [Predictive scaling refusal](../../../reference/glossary/predictive-scaling-refusal.md) · [Step adjustment limit](../../../reference/glossary/step-adjustment-limit.md) · [editable=false](../../../reference/glossary/editable-false.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.5.L4
