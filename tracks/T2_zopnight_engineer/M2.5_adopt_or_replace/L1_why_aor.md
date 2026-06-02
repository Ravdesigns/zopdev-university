# Why adopt-or-replace exists

§ T2 · M2.5 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why ZopNight refuses to silently overwrite existing cloud-side scaling, **identify** the two adoption paths (adopt vs replace), **and execute** the adoption decision for a workload.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the safety guarantee around existing cloud-side autoscaling — and choose the right path for my workload." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M2.4 (VM autoscaling) |
| **Time** | 9 minutes |
| **Bloom verb** | Explain (Understand), Identify (Apply), Execute (Apply) |

---

## 1. Concept

When ZopNight encounters a target (ASG, VMSS, MIG, ECS service) that already has cloud-side autoscaling configured, two paths exist: **adopt** the existing configuration as-is, or **replace** it with a ZopNight-managed policy. The customer chooses explicitly. Silent overwrite is structurally prevented.

```
THE GUARANTEE:
  ZopNight will NEVER silently overwrite existing cloud-side scaling
  Always presents the choice
  Adopt: observe; never mutate
  Replace: save existing config; create ZopNight policy
```

The choice respects the customer's existing investment in their cloud setup.

### Why this matters

Teams often already have:

```
- CloudFormation, Terraform, or CDK provisioned scaling policies
- Manual scaling configurations from the cloud console
- Other tools (Spot.io, Densify, etc.) managing scaling
- Custom scaling logic via Lambda functions
- Legacy scaling configs from previous engineers
- Recently-tuned scaling for specific workload patterns
```

A FinOps tool that silently overwrites these would:

1. **Surprise the team** — "where did our scaling config go?"
2. **Disrupt established workflows** — CI/CD pipeline now misaligned
3. **Risk service incidents** from unexpected behavior changes
4. **Erode trust** — customers can't predict what the tool will do

ZopNight's design: explicitly ask before changing existing cloud-side state.

### The two paths

```
PATH              WHAT IT DOES                              RISK / SAFETY
─────────────────────────────────────────────────────────────────────────
ADOPT             Observe the existing config; never        Zero AWS mutation
                  mutate the cloud-side
                  ZopNight tracks the policy as
                  "source: adopted"
                  
REPLACE           Save the existing config (rawSpec)         Mutates cloud-side
                  Delete it; create ZopNight's policy        (with explicit user
                  Track as "source: recommended"             consent + saved config)
```

The customer picks. ZopNight does what's asked.

### When ZopNight detects existing cloud scaling

The Create wizard opens the autoscaler config and detects the existing setup:

```
WIZARD PROMPTS:
─────────────────────────────────────────────────────────
Existing cloud scaling detected on this target.

Configuration:
  - 1 target tracking policy (CPU 60%)
  - 2 step scaling policies (alarm-based)
  - Min: 4, Max: 12, Desired: 6
  - Cooldown: 120s
  - Last modified: 2024-11-15 by ops-team@

How would you like to proceed?

[Adopt — observe, don't change]    
[Replace — manage with ZopNight]    
[Cancel]
```

The user picks. ZopNight does what's asked. Explicit choice; documented decision.

### Source tracking

Every policy carries a `source` field:

```
source = "adopted"
  Cloud-side existing config
  ZopNight does NOT mutate
  Observation only
  
source = "recommended"
  ZopNight owns this policy
  Manages cloud-side actively
  Can apply, pause, resume, remove
```

The `source` is per-policy. The customer can see this on each policy's detail page. Clear ownership boundary.

### Why "adopt" exists at all

Three benefits to adoption mode:

```
1. DISCOVERY AWARENESS
   ZopNight knows the scaling configuration exists
   Cost reports and recommendations reflect it
   Per-resource cost includes scaled-state factor
   
2. OBSERVABILITY  
   Cost impact of scaling can be analyzed without changing behavior
   Customer learns ZopNight without commitment
   Trust builds
   
3. MIGRATION OPTION
   When ready, customer can upgrade to "replace"
   Adopted → recommended via the Edit flow (auto-promotes)
   Or explicit "convert to recommended" action
```

Adopt is the cautious default. Many customers stay in adopt mode forever.

### Adopted policy operations

What ZopNight does NOT do for adopted policies:

```
✗ Modify the cloud-side configuration
✗ Re-apply changes
✗ Send scaling intents
✗ Override existing scaling behavior
```

What ZopNight DOES do for adopted policies:

```
✓ Track the policy in the autoscaler page
✓ Display configuration details
✓ Compute cost impact via metric correlation
✓ Surface in cost reports
✓ Recommend optimization opportunities (e.g., "target too aggressive")
✓ Show in audit reports
```

The recommendations are advisory — customer must act manually. ZopNight stays observation-only until the customer chooses to take action.

### Auto-promote on edit — the escape hatch

A key escape hatch: when the user edits any field of an adopted policy, the source automatically flips to "recommended."

```
AUTO-PROMOTE FLOW:

T+0       Adopted policy: target 60%
T+5s      User clicks Edit, changes target to 65%
T+5s      ZopNight auto-promotes source: adopted → recommended
T+5s      UI prompts: "Re-apply to push the new value to the cloud?"
T+15s     User clicks Re-apply
T+30s     Cloud-side autoscaler updated with target 65%

OUTCOME:
  Customer's explicit edit = explicit ownership claim
  One-way transition (recommended is sticky)
  No accidental modifications
  Documented in audit log
```

Auto-promote makes the transition explicit. The user clearly chose to take ownership.

### Common adopt-vs-replace scenarios

```
SCENARIO                              RECOMMENDED PATH
──────────────────────────────────────────────────────────
Just started with ZopNight             ADOPT (observe; learn)
                                       
Production workload; risk-averse        ADOPT initially
                                       Migrate to REPLACE later when ready
                                       
Dev / non-critical workload              REPLACE (faster trust)
                                       Lower stakes
                                       
Workload managed by Terraform         ADOPT
                                       Continue managing via Terraform
                                       ZopNight observes only
                                       
Workload managed by spot.io / Densify  ADOPT
                                       Other tool owns; ZopNight reports
                                       
New workload; nothing existing          Create ZopNight policy directly
                                       No adopt-or-replace prompt
                                       
Legacy workload; want full control     REPLACE
                                       Take ownership; rationalize config
```

The decision depends on existing context + risk tolerance + tool relationships.

### What if ZopNight's recommendation conflicts with current config

```
SCENARIO:
  Existing adopted policy: target 80% CPU
  ZopNight's recommendation: target 65% CPU (better for SLA)
  
WHAT ZOPNIGHT DOES (in adopt mode):
  Shows recommendation: "Target 65% would improve latency"
  Does NOT modify the policy
  Customer can:
    Ignore (keep target 80%; status quo)
    Adopt the recommendation (manually update via Edit)
    Investigate further (CloudWatch metrics, etc.)
    
THE CHOICE STAYS WITH THE CUSTOMER
  ZopNight respects existing configuration
  Recommendations are advisory
  No silent intervention
```

The respect for existing config builds trust. Customer = decision authority.

---

## 2. Demo

A team finding an unexpected scaling config:

```
SCENARIO: Team enables ZopNight autoscaler on a target
  Wizard detects existing cloud-side configuration
  Created by previous SRE 6 months ago
  
T+0      Customer: "Oh — the previous SRE set this up. Let's keep it
                  and just observe for a month before doing anything."
                  
T+5s     Customer picks Adopt
T+5s     ZopNight tracks the policy as source=adopted
         Wizard closes
         Policy visible in autoscaler page with adopted badge

T+30 DAYS  Customer reviews:
           Cost impact: ~$1,200/mo
           Scaling events: 47 in the month
           Recommendation: target is too aggressive (75%)
           Causing frequent scaling actions
           Suggest 65% target for better latency + fewer events

T+30 days  Customer: "Yes, let's apply that change."

T+30 days  Customer clicks Edit on the policy
           Changes target to 65%
           
           ZopNight: "Source will change from adopted to recommended.
                       Continue?"
           Customer: Yes
           
           Source auto-promotes to recommended
           Customer clicks Re-apply
           Cloud-side updates target to 65%

OUTCOME (over the following month):
  Cost: $1,000/mo (down from $1,200; less aggressive scaling)
  Scaling events: 18 (down from 47; less churn)
  Latency: improved by ~12% during business hours
  
  Adopt phase preserved existing setup
  Explicit decision to take ownership when ready
```

The adopt-then-replace pattern lets teams migrate at their own pace.

---

## 3. Hands-on (5 min)

In a sandbox with existing cloud-side scaling:

```
□ STEP 1: Trigger Create on a target with existing scaling
  Observe wizard's detection

□ STEP 2: Review the options presented
  Adopt: __________
  Replace: __________

□ STEP 3: Pick Adopt (safe default)
  Confirm
  Observe: policy appears with source=adopted

□ STEP 4: Inspect the adopted policy
  Source field: __________
  Cloud-side config visible: □ Yes □ No
  Can be edited: □ Yes (would auto-promote) □ No

□ STEP 5: Plan for future transition
  When will you re-evaluate? __________
  Action plan: __________
```

A 10-minute exercise reveals the safe adoption pattern.

---

## 4. Knowledge check

### Q1
A target has 3 existing cloud-side scaling policies. ZopNight's wizard:

A. Overwrites them silently
B. Asks: Adopt (observe only) or Replace (manage with ZopNight). User chooses explicitly. Zero silent mutation. The safety guarantee is structural: there is no path to overwrite without explicit consent.
C. Refuses to proceed
D. Random behavior

<details>
<summary>Show answer</summary>

**Correct: B.** Explicit user choice is the design.
</details>

### Q2
An adopted policy has `source = adopted`. The user edits the target value:

A. Source remains adopted
B. Source auto-promotes to recommended. ZopNight now owns the policy. The user is prompted to re-apply to push the changes to the cloud. Auto-promote on edit is intentional — the user explicitly chose ownership by editing.
C. Edit is blocked
D. Source becomes ambiguous

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-promote on edit is intentional.
</details>

### Q3
The reason ZopNight refuses silent overwrite:

A. Performance
B. Trust + surface-respect. Existing scaling configs are usually intentional; silently overwriting them surprises teams and risks incidents. Architectural choice to respect customer's existing infrastructure investment.
C. Cloud requires
D. License

<details>
<summary>Show answer</summary>

**Correct: B.** Trust is the architectural reason.
</details>

---

## 5. Apply

The wizard's adopt-or-replace prompt is on every Create flow for an autoscaler policy. The source field shows on every policy's detail page.

For your team: default to Adopt when existing scaling exists; Replace when ready to take ownership.

---

## Related lessons

- [L2 — Adopt flow](L2_adopt_flow.md) *(next)*
- [L3 — Replace flow](L3_replace_flow.md)
- [L4 — Three refusals](L4_three_refusals.md)
- [M2.4 — VM autoscaling](../M2.4_vm_autoscaling/00_README.md)

## Glossary terms touched

[Adopt-or-replace](../../../reference/glossary/adopt-or-replace.md) · [Source field](../../../reference/glossary/source-field.md) · [Auto-promote](../../../reference/glossary/auto-promote.md) · [Silent overwrite](../../../reference/glossary/silent-overwrite.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.5.L1
