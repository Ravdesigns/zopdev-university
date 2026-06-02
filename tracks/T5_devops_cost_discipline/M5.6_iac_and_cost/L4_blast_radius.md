# Blast radius — import / move / destroy

§ T5 · M5.6 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **map** blast radius before destructive IaC operations, **execute** the pre-destruction checklist, **and recognize** the high-risk horror-story scenarios.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Avoid the catastrophic IaC mistakes — destroy on prod, deleting irreplaceable data, orphaning dependencies." |
| **Personas** | Platform Engineer · DevOps Engineer · SRE |
| **Prerequisites** | M5.6.L1 - L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Map (Analyze), Execute (Apply), Recognize (Apply) |

---

## 1. Concept

Destructive IaC operations (destroy, move, sometimes import) have blast radius — the scope of what they affect. The discipline: map the blast radius BEFORE executing; never execute destructive operations without intentional review.

```
RISK LADDER (from lowest to highest):

LOW BLAST RADIUS:
  terraform plan         (no changes; dry run)
  terraform import       (state-only change; no cloud impact)
  terraform state mv     (state surgery; verify no diff)
  
MEDIUM BLAST RADIUS:
  terraform apply (standard)     (changes per plan)
  terraform apply -refresh-only  (sync state to cloud)
  
HIGH BLAST RADIUS:
  terraform destroy -target=...  (specific resource destroy)
  terraform destroy              (entire stack destroy)
  
EXTREME BLAST RADIUS:
  terraform destroy on PRODUCTION
  Cross-account state operations
  IAM destruction
  Storage destruction without backup
```

The blast-radius framing forces deliberate thinking before execution.

### Operation-by-operation risk

```
terraform import
  Effect:    state file changes only
  Cloud:     no change
  Risk:      LOW (worst case: bad import; can re-import)
  Approval:  standard
  
terraform plan
  Effect:    no cloud changes; just shows diff
  Cloud:     no change
  Risk:      ZERO (dry run)
  Approval:  none
  
terraform apply (additive changes)
  Effect:    cloud changes per plan
  Cloud:     new resources created; existing updated
  Risk:      MODERATE (changes happen)
  Approval:  standard PR review
  
terraform apply -refresh-only
  Effect:    state matches cloud (only)
  Cloud:     no change
  Risk:      LOW
  Approval:  standard
  
terraform destroy -target=resource
  Effect:    one resource deleted
  Cloud:     resource removed; data lost if no backup
  Risk:      HIGH (data loss; dependent resources fail)
  Approval:  team lead minimum
  
terraform destroy (whole stack)
  Effect:    all resources in stack deleted
  Cloud:     cascading destruction
  Risk:      EXTREME (often catastrophic)
  Approval:  multi-stakeholder + documented procedure
```

The taxonomy guides how much process to apply per operation.

### Pre-destruction checklist (mandatory for destroy)

```
BEFORE terraform destroy or destroy -target:

  □ AUDIT WHAT WILL BE DESTROYED
    $ terraform plan -destroy
    Review every resource
    Estimate destruction impact
    
  □ IDENTIFY DEPENDENTS
    Resources outside this IaC stack that depend on these
    Cross-account references
    External integrations
    
  □ CHECK FOR DATA AT RISK
    Databases (RDS, DynamoDB)
    Object storage (S3 buckets)
    Volumes (EBS)
    Logs
    
  □ BACKUP CRITICAL STATE
    Snapshot databases
    Backup S3 to different location
    Export critical configurations
    
  □ COMMUNICATE TO TEAM
    Slack post: "Will destroy X in 24 hours"
    Stakeholder notification
    Documentation update
    
  □ HAVE ROLLBACK PLAN
    How to restore if needed?
    Snapshots usable?
    Recreation procedure documented?
    
  □ TEST IN LOWER ENVIRONMENT FIRST
    Run destroy in staging or dev
    Verify expected behavior
    Identify any issues
    
  □ DOCUMENT THE WHY
    PR description / runbook entry
    Audit trail
    
  □ APPROVAL FROM TEAM LEAD
    Sign-off documented
    For prod: senior approval

ONLY THEN: terraform destroy
```

Every item is a separate gate. Skip any: you're rolling the dice.

### Import — hidden complexity

```
SCENARIO: existing cloud resource needs to come under Terraform management

STEPS:

1. CONFIRM RESOURCE EXISTS
   $ aws ec2 describe-instances --instance-ids i-0abc123
   
2. WRITE TERRAFORM RESOURCE BLOCK
   resource "aws_instance" "example" {
     # Match the existing resource's properties
     ami           = "ami-..."
     instance_type = "m5.large"
   }
   
3. RUN IMPORT
   $ terraform import aws_instance.example i-0abc123
   State file now includes this resource
   
4. RUN PLAN
   $ terraform plan
   Likely shows differences:
     Cloud-side has tags X, Y, Z
     IaC has tags A, B, C
     Plan would "fix" the cloud to match IaC
   
5. RECONCILE
   Either:
     Update IaC to match cloud-side (preserve current state)
     OR
     Apply to make cloud match IaC (changes happen)
   
6. RE-RUN PLAN UNTIL CLEAN
   $ terraform plan
   "No changes" = import successful + IaC aligned

NOW: ongoing changes go through IaC properly
```

The post-import diff is the most-misunderstood part. The resource is imported, but IaC isn't yet aligned with cloud. Reconcile carefully.

### Move operations

```
terraform state mv (state-only)
  Move a resource between addresses in state file
  Cloud: NO CHANGE
  Use: refactoring IaC structure (move resource into module)
  Risk: low (verify no plan diff after)

terraform import + destroy original
  Effectively: moving a resource between IaC stacks
  Cloud: no change
  Risk: low (but careful state surgery)

ACTUAL CLOUD-LEVEL MIGRATION
  Resource moved to different account / region
  Effect: new resource created, old deleted
  Risk: HIGH (data loss, downtime, IP changes)
  Use: actual cloud-level migration project
  Plan: separate IaC stack changes + careful coordination
        Often via terraform import/destroy pattern + IaC restructure
```

State moves are usually safe; actual cloud-level moves are major projects.

### Destroy — real-world scenarios

```
SCENARIO 1 — STOPPING A DEV ENVIRONMENT
  Risk: data loss (low — dev data)
  Backup: optional (depends on team needs)
  Approval: team member
  Effort: 1 hour
  
SCENARIO 2 — REMOVING A FEATURE
  Risk: cascading impacts on dependent services
  Backup: required (databases, key configs)
  Approval: team lead
  Effort: 1-3 days
    Identify dependents
    Remove dependents first
    Then destroy
  
SCENARIO 3 — PRODUCTION ENVIRONMENT CLEANUP
  Risk: CATASTROPHIC potential
  Backup: required + verified restore
  Approval: senior engineering leader + product
  Effort: 1-2 weeks
    Multi-stakeholder review
    Rehearse in non-prod
    Detailed runbook
    Rollback plan documented
    Phased execution if possible

SCENARIO 4 — DECOMMISSIONING ACQUIRED COMPANY ACCOUNT
  Risk: HIGH (years of accumulated state)
  Backup: comprehensive audit + backup
  Approval: VP/CTO level
  Effort: 1-3 months
    Audit all resources
    Migrate critical data
    Notify all stakeholders
    Phased shutdown
    Final destruction
```

Match the process to the scenario's risk.

### Destruction order

```
Terraform destroys in DEPENDENCY ORDER:
  Resources that depend on others: destroyed first
  Bedrock resources (VPC, IAM): destroyed last
  
SOMETIMES DESTROY FAILS:
  
  Dependent outside Terraform's scope:
    Manual changes made resource unavailable
    Cross-stack references missed
    
  Stuck deletion:
    DB taking too long to delete
    Pending operations
    
  IAM dependencies:
    Roles referenced by other accounts
    Cannot delete due to attached policies
  
RECOVERY:
  Investigate the failure
  Resolve the blocker manually (carefully)
  Re-run destroy
  Don't skip the audit trail
```

Destroy failures are signals; investigate before continuing.

### Real-world horror stories — learn from them

```
HORROR 1: Destroy of S3 bucket → lost critical data
  No backup; data unrecoverable
  Customer impact: lost customer files
  Lesson: ALWAYS backup before bucket destroy; enable versioning

HORROR 2: Destroy of RDS → deleted production database
  PITR was disabled; no recent snapshots
  Customer impact: hours of downtime; partial data loss
  Lesson: PITR enabled on prod; snapshot before destroy

HORROR 3: Destroy of IAM → locked everyone out
  Removed IAM roles that some teams' automation depended on
  Cascading failures; emergency response
  Lesson: IAM destroys = extreme care; impact analysis

HORROR 4: Destroy of VPC → orphaned cross-account references
  Cross-account peering references the destroyed VPC
  Other account's resources broken
  Lesson: map cross-account dependencies before VPC destruction

HORROR 5: Destroy of Lambda → stopped business-critical workflow
  Lambda function was the heart of nightly reconciliation
  Nobody on team realized it was critical
  Lesson: document criticality; check before destroy

PATTERN ACROSS ALL:
  Skipped pre-destruction checklist
  Insufficient backup or rollback
  No test in lower environment
  No documented why
```

Every horror story has a corresponding gate that was skipped.

### Cost impact

```
DESTROY operations:
  Savings: on resources destroyed
  But: may break dependent services (cost of downtime)
  Net: usually positive (savings) but be sure
  
IMPORT operations:
  No cost change (state-only)
  
MOVE operations (state-only):
  No cost change
  
MOVE operations (cloud-level):
  Potentially expensive (new infrastructure + transition cost)
  Plan as a project, not a routine operation
```

Destruction recovers cost; calculate the savings; verify cleanly.

### IaC operations decision matrix

```
OPERATION                  RISK    APPROVAL              CHECKLIST
─────────────────────────────────────────────────────────────────────
terraform plan             ZERO    None                  None
terraform import           LOW     Standard PR           Verify state diff
terraform state mv         LOW     Standard PR           Verify no plan diff
terraform apply            MED     Standard PR review    PR template
terraform destroy -target  HIGH    Team lead              Pre-destroy
                                                          checklist
terraform destroy (stack)  EXTREME Multi-stakeholder     Pre-destroy + 
                                                          incident
                                                          response plan
```

The matrix is the floor. Some teams add more gates for specific situations.

---

## 2. Demo

A production decommission:

```
WORKLOAD: legacy reporting service (deprecated; no longer used)
RESOURCES:
  5 EC2 instances
  1 RDS database (~200GB data)
  1 Application Load Balancer
  ~50 GB of EBS volumes
  Associated security groups, IAM roles

DECISION: decommission via terraform destroy
RISK ASSESSMENT: HIGH (data loss possible; cross-team references possible)

PRE-DESTROY CHECKLIST EXECUTION:

DAY 1 — AUDIT
  ✓ Confirm no usage:
    Application logs: 0 requests in last 30 days
    Network traffic: no connections
    Dependents check: no services reference these endpoints
  
  ✓ Identify cross-account references:
    Audit IAM roles for cross-account principals: none
    Audit VPC peering / Transit Gateway: not connected
    Audit DNS: A records will need cleanup separately
  
DAY 2 — BACKUP
  ✓ RDS snapshot taken:
    Snapshot ID: rds-snap-20260520-legacy-reporting
    Retention: 90 days
    Verified accessible
  
  ✓ EBS snapshots:
    All 5 instance root volumes snapshotted
    Volume IDs documented
  
  ✓ S3 data (if any):
    No S3 buckets in this stack
  
  ✓ Configuration export:
    Terraform state copied to backup S3
    JIRA tickets archived
  
DAY 3 — TEST IN NON-PROD
  ✓ Identical workload exists in staging
  ✓ Test terraform destroy in staging
  ✓ Verify expected behavior (clean destroy)
  ✓ Verify recovery from snapshot (restore test on staging)
  
DAY 4 — DOCUMENT + APPROVE
  ✓ Memo to team:
    Subject: Decommissioning legacy-reporting
    Why: 30 days no usage; deprecated
    What: 5 instances + 1 RDS + ALB + volumes
    When: 2026-05-25
    Backup: snapshots retained 90 days
    Rollback: restore from snapshots if needed
  
  ✓ Approval from platform-team-lead

DAY 5 — EXECUTE
  $ cd terraform/legacy-reporting
  $ terraform plan -destroy
  Reviewed: 7 resources to destroy (matches expectation)
  
  $ terraform destroy
  Output:
    aws_instance.web-1: Destroyed
    aws_instance.web-2: Destroyed
    aws_instance.web-3: Destroyed
    aws_instance.web-4: Destroyed
    aws_instance.web-5: Destroyed
    aws_lb.legacy-reporting: Destroyed
    aws_db_instance.legacy-reporting: Destroyed
    Destroy complete! Resources: 7 destroyed.
  
  Time: 8 minutes
  
DAY 5 — POST-DESTROY VERIFICATION
  ✓ Verify resources gone in cloud console
  ✓ Verify snapshots intact (recovery option available)
  ✓ Verify no orphaned dependent resources
  ✓ Update runbook (this service no longer exists)
  ✓ Close JIRA tickets referencing it

COST IMPACT:
  Before: $420/month for legacy-reporting
  After:  $5/month (snapshots only)
  Savings: $415/month = $4,980/yr

LESSONS LEARNED:
  Pre-destroy checklist worked
  Snapshot restore test gave confidence
  Total effort: ~6 hours of platform engineering
  No incidents; clean decommission
```

The discipline is what makes destruction safe.

---

## 3. Hands-on (5 min)

Walk through pre-destroy checklist for a non-prod resource:

```
□ STEP 1: Pick a candidate non-prod resource
  Resource: __________
  Stack: __________

□ STEP 2: Run audit
  $ terraform plan -destroy
  Resources to destroy: _____
  
□ STEP 3: Identify dependents
  External services using this: __________
  Cross-account references: __________

□ STEP 4: Check data at risk
  Databases: __________
  Storage: __________
  Logs: __________

□ STEP 5: Backup plan
  □ DB snapshot
  □ EBS snapshot
  □ Configuration export
  □ Backup location: __________

□ STEP 6: Test in lower env
  Lower environment available? □ Yes □ No
  Estimated test cost: __________

□ STEP 7: Approval needed
  □ Team lead   □ Senior engineer   □ Product owner

DON'T EXECUTE — this is a paper exercise.
```

The exercise reveals where your team's process is strong vs gap. Many teams find gaps in the dependent-mapping step.

---

## 4. Knowledge check

### Q1
terraform destroy on production:

A. Routine operation
B. HIGH risk. Pre-destroy checklist mandatory: test in non-prod first, backup data with verified restore, rollback plan, documented why, multi-stakeholder approval. Skipping any gate = potential horror story. Production destroy is a multi-day project, not a routine command.
C. Random
D. Trivial if Terraform manages it

<details>
<summary>Show answer</summary>

**Correct: B.** Extreme care; multi-day project for prod.
</details>

### Q2
terraform import has what risk:

A. High — changes the cloud
B. Low — state-only change; cloud unchanged. Worst case: bad import; can re-import. After import, terraform plan may show differences (cloud vs IaC); reconcile carefully. The import itself is safe; the post-import work needs attention.
C. Random
D. Same as destroy

<details>
<summary>Show answer</summary>

**Correct: B.** Low risk; state-only operation.
</details>

### Q3
After terraform import, the cloud:

A. Has changed
B. Unchanged. Import is purely a state-file operation — it tells Terraform "this resource exists; track it in state." Cloud resource is untouched. Subsequent terraform apply may change cloud based on IaC config (so reconcile the post-import diff first).
C. Random
D. Resets to IaC defaults

<details>
<summary>Show answer</summary>

**Correct: B.** Cloud unchanged by import; reconcile diff post-import.
</details>

---

## 5. Apply

Pre-destruction checklist for every destroy. Test in non-prod first. Backup + rollback plan. Document the why. Approve appropriately.

For your team: print the pre-destroy checklist; reference for every destroy operation.

---

## Module quiz

Complete M5.6 → 10-question module quiz unlocks the **IaC-Disciplinarian** chip.

---

## Related lessons

- [L1 — Tag enforcement](L1_tag_enforcement.md)
- [L2 — IaC drift detection](L2_drift.md)
- [L3 — Pre-merge cost estimation](L3_pre_merge.md)
- [M5.7 — Incident response](../M5.7_incident_response/00_README.md)

## Glossary terms touched

[Blast radius](../../../reference/glossary/blast-radius.md) · [Pre-destruction checklist](../../../reference/glossary/pre-destruction-checklist.md) · [terraform destroy](../../../reference/glossary/terraform-destroy.md) · [State surgery](../../../reference/glossary/state-surgery.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.6.L4
