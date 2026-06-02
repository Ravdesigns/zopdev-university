# IaC drift detection

§ T5 · M5.6 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **detect** IaC drift across Terraform/CDK/Pulumi, **classify** drift events by source (intentional, accidental, unauthorized), **and resolve** each with the right response pattern.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Catch when cloud-side state diverges from our IaC source of truth — and resolve the divergence cleanly." |
| **Personas** | Platform Engineer · DevOps Engineer · SRE |
| **Prerequisites** | M5.1 (tagging) · M5.6.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Detect (Apply), Classify (Analyze), Resolve (Apply) |

---

## 1. Concept

IaC drift = manual changes in the cloud console (or other tools) that diverge from what's in your Terraform/CDK/Pulumi. Drift breaks the "IaC as source of truth" promise. Without detection, drift compounds and the IaC becomes increasingly inaccurate.

```
SCENARIO:
  Terraform says: instance_type = "m5.large"
  Cloud console (engineer changed it): m5.2xlarge
  Result: drift; IaC no longer matches reality
  
ON NEXT TERRAFORM APPLY:
  Either:
    Terraform changes back to m5.large (engineer's change lost)
    OR
    Engineer remembers to update IaC first
  
EITHER way: friction. The drift is the symptom of broken discipline.
```

The discipline: detect drift early, resolve it cleanly, prevent it from accumulating.

### Why drift happens

```
SOURCES OF DRIFT:

1. MANUAL CHANGES FOR QUICK FIXES
   Engineer fixes something via console during incident
   Doesn't update IaC afterward
   Next apply: lost fix
   
2. OTHER TOOLS MODIFYING RESOURCES
   Auto-scaling adds tags
   Backup tool modifies properties
   Other teams' automation
   
3. CLOUD-SIDE AUTOMATION
   AWS auto-scaling adjustments
   Managed service updates (RDS minor version)
   
4. ACQUIRED COMPANY INTEGRATIONS
   Pre-existing resources brought under your IaC
   May have drift from start
   
5. MIGRATED OLD IaC PATTERNS
   Resources created before IaC adoption
   Imported with mismatch
   
6. CONSOLE EXPLORATION GONE WRONG
   Engineer experimenting; saves changes inadvertently
```

The root cause is usually broken or skipped IaC discipline. Detect to address.

### Cost impact of drift

```
DRIFT OFTEN CAUSES:
  ✓ Resources at wrong size (oversized after manual upgrade)
  ✓ Wrong instance class (engineer "upgraded" to bigger family)
  ✓ Wrong region (deployment error)
  ✓ Wrong account (multi-account confusion)
  ✓ Tag changes (affecting billing attribution)
  ✓ Storage drift (volume size grown manually)
  ✓ Network drift (added security group rules)

EACH DRIFT EVENT = UNINTENDED STATE = unexpected cost OR security risk

TYPICAL COST IMPACT:
  Small team: 5-10 drift events/week
  Medium team: 30-50/week
  Large org: 100+/week
  
  ~30% are cost-impacting (sizing changes, region differences)
  ~10% are security-impacting
  Rest: configuration drift (still bad, less direct cost)
```

The detection prevents the silent accumulation of cost surprises.

### Detection methods — by IaC tool

```
TERRAFORM:
  $ terraform plan
  - Compares current state to desired state
  - Shows differences (drift)
  - Doesn't auto-fix; shows what WOULD happen on apply
  
  Better: scheduled drift detection
  $ terraform plan -detailed-exitcode
  - Exit 2 if drift detected
  - Use in CI/CD daily check

CDK:
  $ cdk diff
  - Compares CFN template to deployed
  - Shows drift in CloudFormation context
  - CloudFormation also has built-in drift detection
  
  AWS Config:
  cfn:DriftDetectionResource = NOT_IN_SYNC
  - Visible in CFN console

PULUMI:
  $ pulumi refresh
  - Updates state from cloud
  $ pulumi up
  - Shows desired vs actual differences
  
  Workflow:
    1. pulumi refresh (read current)
    2. pulumi up (apply desired or accept drift)

CLOUD-NATIVE (across all IaC):
  AWS Config Rules - "rule-based" drift detection
  GCP Cloud Asset Inventory + Config Validator
  Azure Policy + Compliance scans
  
  These catch drift even if IaC tool doesn't notice
```

Combine IaC-tool detection with cloud-native for full coverage.

### Drift response patterns — three options

```
PATTERN A — ACCEPT (cloud is truth)
  Cloud-side change was intentional and correct
  Action:
    Update IaC to match new cloud-side state
    Document the reason (PR with explanation)
    Future plans converge
  
  Use when:
    Engineer's manual change was correct
    Cloud-side automation made legit change
    Migration / acquisition with desired state

PATTERN B — REVERT (IaC is truth)
  Cloud-side change was wrong / unauthorized
  Action:
    terraform apply (or equivalent)
    Cloud reverts to IaC state
    Investigate why the change happened
    Educate or harden against repeat
  
  Use when:
    Unauthorized manual change
    Accidental console change
    Drift caused by misconfigured automation

PATTERN C — INVESTIGATE FIRST
  Don't know yet; need context
  Action:
    Audit log: who/when made the change
    Slack the engineer
    Wait for response
    Then accept or revert based on intent
  
  Use when:
    Unclear what happened
    Risk of either accept or revert being wrong
```

The right pattern depends on intent + context. Defaulting to one without thinking causes problems.

### Drift frequency benchmarks

```
HEALTHY IaC discipline:
  Drift events per week per 100 resources: <5
  Resolved within 24-72 hours
  Pattern: mostly intentional (accept; update IaC)
  
MODERATELY UNHEALTHY:
  Drift events per week per 100 resources: 5-20
  Mix of intentional and accidental
  Investigation cycle: 1-2 weeks
  
UNHEALTHY:
  Drift events per week per 100 resources: >20
  Tension between manual changes and IaC apply
  Often resolved by re-running terraform (fighting with cloud)
  Engineer trust in IaC eroding
  
TRENDING:
  Drift increasing weekly = signal of process breakdown
  Drift decreasing weekly = signal of healthy discipline
```

The rate trend matters more than the absolute number. <5/week per 100 resources is the target.

### Scheduled drift detection

```
GITHUB ACTIONS (Terraform daily check):

name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM daily

jobs:
  drift_check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: terraform init
        run: terraform init
      
      - name: terraform plan (drift detection)
        run: |
          terraform plan -detailed-exitcode -out=tfplan
          # Exit code 2 means changes detected (drift)
          if [ $? -eq 2 ]; then
            echo "DRIFT DETECTED"
            terraform show tfplan > drift-report.txt
          fi
      
      - name: Notify on drift
        if: success() && env.DRIFT_DETECTED == 'true'
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "Drift detected in production IaC",
              "attachments": [{
                "text": "${{ env.DRIFT_DETAILS }}"
              }]
            }
```

The daily check catches drift overnight; resolved within 24 hours.

### Pre-merge cost gate (Infracost)

Beyond drift, IaC PRs benefit from cost visibility:

```
INFRACOST INTEGRATION:
  Pre-merge: shows cost impact of IaC change
  
  Example PR comment:
    "Cost change: +$400/month
     New EC2 instance (m5.2xlarge): +$280/mo
     New EBS volume (1TB gp3): +$80/mo
     New NAT Gateway: +$40/mo"
  
  CAPTURES COST DECISIONS at PR review time

REVIEWER CAN:
  Question expensive additions
  Suggest right-sizing
  Approve if justified
  Block if over-provisioned
  
BAD COST DECISIONS caught before merge
GOOD COST DECISIONS documented in PR
```

Infracost (or equivalent) is the pre-merge equivalent of drift detection — catches cost surprises early.

### Blast-radius operations — import / move / destroy

```
IMPORT: bring existing cloud resource under IaC
  $ terraform import aws_instance.web i-1234567890
  Risk: LOW (no state changes; just adds to state file)
  Use: when adopting IaC for existing resources
  
MOVE: move resource between IaC sources / states
  $ terraform state mv aws_instance.web module.app.aws_instance.web
  Risk: MODERATE (state surgery; verify no unintended changes)
  Use: refactoring IaC structure
  
DESTROY: delete resource via IaC
  $ terraform destroy -target=aws_instance.web
  Risk: HIGH (may cause cascading data loss)
  Use: deliberate decommissioning
  Always: document, require approval, double-check
```

These operations are riskier than normal apply. The discipline: review carefully, peer-approval, test in staging.

### Drift dashboard / monitoring

```
PERIODIC AUDIT pattern:
  Show drift events per IaC source/team
  Flag stuck drifts (>7 days unresolved)
  Track drift count weekly over time
  Alert on drift count spikes
  
HEALTHY DASHBOARD:
  Drift count flat or trending down
  Stuck drifts: 0 (resolved within 1 week)
  Per-team breakdown shows none over threshold
  
WHEN STUCK:
  Engineer assigned to resolve
  After 7 days: escalate to platform lead
  After 14 days: emergency review
```

Visibility drives behavior. Without dashboards, drift accumulates silently.

---

## 2. Demo

A team's weekly drift audit:

```
TEAM: 100-engineer mid-size org, ~500 Terraform-managed resources

WEEKLY AUDIT (Monday morning):

T+0      Run scheduled drift detection
         terraform plan -detailed-exitcode (across all stacks)
         
T+10min  Results aggregated:
         47 modified resources detected across 12 stacks
         
T+15min  Categorize via investigation:
         
         INTENTIONAL (12 resources):
           Engineer changes for incident response last week
           Manual hotfixes during demo
           ACTION: PRs to update IaC to match cloud-side
           
         UNINTENTIONAL (30 resources):
           Cloud-side automation modifications
           Auto-scaling tag additions
           Managed service auto-updates
           ACTION: PRs to update IaC (cloud automation legit)
           
         UNAUTHORIZED (5 resources):
           Console changes by 2 engineers (unclear intent)
           Will investigate via Slack DM
           ACTION: revert via terraform apply; investigate source

T+1hr    Action items distributed:
         3 PRs to update IaC for intentional + unintentional drift
         2 Slack threads investigating unauthorized
         1 emergency revert (clear unauthorized change)

T+1 week (follow-up audit):
         Previous drifts resolved
         Drift count this week: 12 (down from 47)
         Trend: healthy
         
         Unauthorized investigation results:
           Engineer 1: experimenting; education provided
           Engineer 2: emergency fix; team updated process
         
LONG-TERM TREND:
  Q1: avg 40 drifts/week
  Q2: avg 25 drifts/week (after process improvements)
  Q3: avg 12 drifts/week (steady-state)
  
  Process improvements:
    1. IaC checklist for incident response
    2. Console access reviewed quarterly
    3. Auto-tagger reconciles tag drift automatically
    4. Cloud-native policy blocks some console changes
```

The pattern compounds — process improvements reduce drift over time.

---

## 3. Hands-on (5 min)

Run drift detection on your IaC:

```
□ STEP 1: Pick a Terraform stack
  Stack path: __________
  Resource count: _____

□ STEP 2: Run drift detection
  $ terraform plan -detailed-exitcode
  
  Exit code: _____
  Resources with changes: _____

□ STEP 3: Categorize first 5 drifts
  Resource 1: __________
    Source: □ Intentional □ Unintentional □ Unauthorized
    Action: __________
    
  Resource 2-5: same template

□ STEP 4: Estimate drift rate
  Drifts per 100 resources per week: _____
  Health: □ Healthy (<5) □ Moderate (5-20) □ Unhealthy (>20)

□ STEP 5: Set up scheduled detection
  □ Daily/weekly GitHub Action
  □ Notification to Slack
  □ Owner: __________
```

A 30-minute audit reveals the drift posture. Scheduled detection keeps it manageable.

---

## 4. Knowledge check

### Q1
Detected drift always requires:

A. Immediate revert to IaC
B. Investigation first. Drift could be: intentional (update IaC to match), accidental (revert via apply), unauthorized (investigate source + revert). Context matters. Defaulting to revert without thinking causes problems (lost legitimate changes).
C. Random
D. Ignore

<details>
<summary>Show answer</summary>

**Correct: B.** Context-driven response.
</details>

### Q2
Pre-merge cost gate (Infracost):

A. Slows down development
B. Catches cost surprises before merge. Engineer sees "+$400/month" in PR comment. Reviewer can question expensive additions. Bad cost decisions caught at PR time; good ones documented. Earlier visibility = better decisions.
C. Random
D. Required by all teams

<details>
<summary>Show answer</summary>

**Correct: B.** Earlier visibility; better PR decisions.
</details>

### Q3
Drift events >20 per 100 resources per week:

A. Optimal IaC use
B. Symptom of unhealthy IaC + manual change tension. Investigate sources: too many console operators, missing process discipline, broken automation, missing access controls. High drift erodes trust in IaC; address root causes.
C. Random
D. Acceptable for mature orgs

<details>
<summary>Show answer</summary>

**Correct: B.** High drift = process problem; address root causes.
</details>

---

## 5. Apply

Weekly drift audit. Pre-merge cost gate (Infracost). Scheduled CI drift detection. Documented response patterns.

For your team: schedule weekly drift audit; trend over quarters; address root causes when count rises.

---

## Related lessons

- [L1 — Tag enforcement](L1_tag_enforcement.md)
- [L3 — Pre-merge cost estimation](L3_pre_merge.md) *(next)*
- [L4 — Blast-radius reduction](L4_blast_radius.md)
- [M5.1.L4 — Tag drift detection](../M5.1_tagging_strategy/L4_drift_detection.md)

## Glossary terms touched

[IaC drift](../../../reference/glossary/iac-drift.md) · [Terraform plan](../../../reference/glossary/terraform-plan.md) · [Drift response pattern](../../../reference/glossary/drift-response-pattern.md) · [Infracost](../../../reference/glossary/infracost.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.6.L2
