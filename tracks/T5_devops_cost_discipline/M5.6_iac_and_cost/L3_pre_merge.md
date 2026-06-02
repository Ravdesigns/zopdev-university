# Pre-merge cost estimation

§ T5 · M5.6 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **set up** pre-merge cost estimation in CI (Infracost or equivalent), **interpret** the output for review decisions, **and combine** it with ZopNight post-merge data for full visibility.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Catch cost-affecting IaC changes at PR time — show the engineer and reviewer '+$400/month' before they merge." |
| **Personas** | Platform Engineer · DevOps Engineer · FinOps Lead |
| **Prerequisites** | M5.6.L1 · M5.6.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Set up (Apply), Interpret (Analyze), Combine (Synthesize) |

---

## 1. Concept

Pre-merge cost estimation: a tool that calculates the cost impact of an IaC change BEFORE the change is merged. The output becomes a PR comment; reviewers see "+$400/month" alongside the code diff. Catches cost surprises before they hit the bill.

```
TOOLS:
  Infracost (most popular, multi-cloud)
  Atlantis with cost output
  Terraform Cloud cost estimation (HCP)
  AWS Cost Anomaly Detection (post-fact; complementary)
  
WHAT IT DOES:
  Parses Terraform/CDK/Pulumi plan
  Looks up per-resource pricing (cloud rate-card)
  Calculates monthly cost delta
  Posts to PR as comment
  
WHAT IT DOESN'T DO:
  Account for customer-specific discounts (RIs, SPs, EDP)
  Predict usage-based costs precisely (Lambda requests, etc.)
  Replace post-merge ZopNight tracking
```

The pre-merge tool gives baseline cost visibility; ZopNight gives reality.

### How it works

```
WORKFLOW:

1. Engineer creates PR with Terraform / CDK change
2. CI runs cost estimation tool (Infracost)
3. Tool calculates cost impact of the change
4. Tool comments on PR with cost breakdown
5. Reviewer + engineer see cost impact BEFORE merge
6. Approve based on cost + functionality
7. Or: engineer revises before re-running CI

CADENCE:
  Updates on every PR push (latest cost reflects current state)
  Or: initial PR open + on-demand re-run
```

The PR comment is the unit of decision-making. Cost becomes a first-class review concern.

### Sample output

```
INFRACOST PR COMMENT:

This PR changes the cost by:
  +$420/month

Breakdown:
  + 4× m5.large EC2 instances:        +$320/month
  + 1× RDS db.r5.large:                +$100/month  
  + 1× EBS 500 GB gp3 volume:         +$40/month
  - 1× EC2 t3.medium removed:          -$40/month

Current monthly cost: $12,400/month
Proposed monthly cost: $12,820/month (+3.4%)

⚠ This change exceeds the $100/month threshold.
  Senior approval required per team policy.
```

The output is engineer-friendly; reviewer-friendly; finance-friendly.

### What to do with the estimate — review patterns

```
ENGINEER (PR author):
  See the cost; is the change justified?
  If unexpected: investigate the source
  If excessive: revise (smaller instances, fewer replicas)
  Document the business case for the cost
  
REVIEWER:
  Approve based on cost AND functionality
  Block if cost is unjustified
  Ask "why this size?" if cost surprising
  Suggest alternatives if applicable
  
APPROVAL FLOW (team policy):
  Cost decrease: auto-approve cost; review code
  Cost increase < $100/mo: standard review
  Cost increase $100-1000/mo: peer approval required
  Cost increase >$1000/mo: senior approval + business case
```

The approval thresholds prevent ungated cost growth.

### Setting up Infracost — concrete steps

```
STEP 1 — INSTALL LOCALLY (for testing):
  $ brew install infracost
  $ infracost auth login
  $ infracost --version

STEP 2 — RUN MANUALLY on existing Terraform:
  $ cd terraform/
  $ infracost breakdown --path .
  
  Shows current cost of resources in the directory.

STEP 3 — INTEGRATE INTO CI (GitHub Actions example):
  
  # .github/workflows/infracost.yml
  name: Infracost
  
  on:
    pull_request:
      paths:
        - 'terraform/**'
  
  jobs:
    infracost:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
          with:
            fetch-depth: 0
        
        - name: Setup Infracost
          uses: infracost/actions/setup@v3
          with:
            api-key: ${{ secrets.INFRACOST_API_KEY }}
        
        - name: Run Infracost (compare branch vs base)
          run: |
            infracost breakdown --path terraform/ \
              --format json --out-file /tmp/base.json \
              --git-branch main
            
            infracost diff --path terraform/ \
              --compare-to /tmp/base.json \
              --format json --out-file /tmp/diff.json
        
        - name: Post comment to PR
          run: |
            infracost comment github \
              --path /tmp/diff.json \
              --pull-request ${{ github.event.pull_request.number }} \
              --behavior new

STEP 4 — CONFIGURE PROJECT (infracost.yml):
  
  version: 0.1
  projects:
    - path: terraform/prod
      name: production
      usage_file: terraform/prod/usage.yml
    - path: terraform/staging
      name: staging

STEP 5 — SET THRESHOLDS:
  In CI: fail-on-cost-increase if exceeds threshold
  Document team policy
```

The setup is a 1-day project; pays back immediately.

### Common patterns

```
THRESHOLD CONFIGURATION:
  Auto-post if change > $50/month (suppress noise on tiny changes)
  Fail CI if change > $1000/month (force review)
  Skip if change < $10/month
  
COMMENT FREQUENCY:
  Post on every PR push (latest cost reflects current state)
  Update existing comment vs new comment (avoid spam)
  
TEAM-LEVEL CONFIG:
  Different thresholds per team based on team budget
  Some teams: $50 threshold
  Other teams: $500 threshold
  Configure in infracost.yml or per-team variable
  
COMMENT FORMAT:
  Compact: just the total delta
  Detailed: per-resource breakdown (recommended)
  With suggestions: includes recommendations for cost reduction
```

The defaults are usually fine; tune based on team feedback.

### What pre-merge estimation captures

```
ESTIMABLE (high confidence):
  ✓ Per-resource hourly costs (EC2, RDS, ELB)
  ✓ Storage costs (EBS, S3 if size known)
  ✓ Networking baseline (NAT GW, Transit Gateway)
  ✓ Managed service base fees
  ✓ Reserved instance pricing (with usage file)
  
HARD TO ESTIMATE (lower confidence):
  ~ Lambda costs (depend on requests)
  ~ DynamoDB on-demand (depend on requests)
  ~ Per-request transit costs
  ~ Variable traffic costs
  
NOT CAPTURED:
  ✗ Customer-specific discounts (use ZopNight for actual)
  ✗ Enterprise Discount Program (EDP) effects
  ✗ Spot instance volatility
  ✗ Real-time pricing variations
  ✗ Actual usage patterns
```

For services with usage-dependent pricing, Infracost uses defaults; provide a `usage.yml` for accuracy.

### Adoption pattern

```
WEEK 1 — INSTALL + LOCAL USE:
  Engineer installs locally
  Runs on a sample Terraform repo
  Sees the output
  
WEEK 2 — CI INTEGRATION:
  Add to GitHub Actions / GitLab CI
  Auto-post on PRs
  Engineer + reviewer see comments
  
WEEK 3-4 — TEAM LEARNING:
  Team reads PR comments
  Questions / discussions about cost
  Some PRs revised based on cost
  
MONTH 2+ — CULTURAL CHANGE:
  Cost-aware PR reviews become normal
  Engineers consider cost BEFORE opening PR
  Better cost decisions org-wide
  
TYPICAL OUTCOMES:
  20-40% of cost-impacting PRs get revised
  10-15% of PRs blocked due to over-provisioning
  Cost-per-feature metric improves
```

The cultural change is the highest-value outcome; tool is just the trigger.

### Combining with ZopNight post-merge

Pre-merge estimation + ZopNight post-merge = full lifecycle:

```
PRE-MERGE (Infracost):
  ✓ Catches surprises at PR review
  ✓ Trains engineer awareness
  ✓ Forces conversation about cost
  ✓ Baseline cost only (rate-card)
  
POST-MERGE (ZopNight):
  ✓ Actual cost after deploy
  ✓ Includes customer-specific discounts
  ✓ Tracks ongoing cost evolution
  ✓ Catches drift from estimate
  
COMBINED:
  Pre-merge: "we expect +$420/mo"
  ZopNight 1 week later: "actual is +$380/mo"
  Difference: $40/mo (likely from discounts)
  Investigate if difference > 30%
```

Use both for the most complete picture.

### Common limitations + mitigation

```
LIMITATION                          MITIGATION
──────────────────────────────────────────────────────────────────
Doesn't capture per-request          Provide usage.yml with expected
variability (Lambda, etc.)            request rates
                                      
Doesn't account for discounts        Use ZopNight for actual cost
(RIs, SPs, EDP)                       Treat estimate as upper bound
                                      
May miss newer services              Update Infracost regularly
                                      Fall back to cloud rate card

Rate-card pricing may differ          Use ZopNight post-merge to verify
from your actual rate                
                                      
Doesn't measure performance           Cost+performance review separately
or reliability impact                
                                      
PR comment becomes noise              Tune thresholds to suppress small
                                      changes
```

The limitations don't kill the tool's value; they shape expectations.

---

## 2. Demo

A team's Infracost adoption + cultural change:

```
TEAM: 40-engineer engineering org, Terraform-heavy

WEEK 1 — INSTALL + EDUCATE:
  Platform team installs Infracost locally
  Runs on current Terraform repo
  Shares output in #eng-platform
  Schedules learning session

WEEK 2 — CI INTEGRATION:
  Add to GitHub Actions
  Threshold: post if change > $50/mo
  Auto-comment on PRs

WEEK 3 — FIRST WAVE OF PRS:

  PR #1342: New feature - 12 EC2 instances
    Infracost comment: "+$960/mo (12× m5.large)"
    Reviewer: "Is this size necessary? CPU profile suggests t3"
    Discussion + engineer revises to t3.large spot
    New estimate: "+$240/mo"
    PR approved
  
  PR #1343: Migrate gp2 to gp3 volumes
    Infracost: "-$180/mo (gp3 cheaper)"
    Reviewer auto-approves; clear savings
  
  PR #1344: Increase RDS instance class
    Infracost: "+$320/mo"
    Reviewer asks: "What's driving this?"
    Engineer: "More capacity headroom"
    Reviewer: "Check actual utilization first"
    Engineer checks; sees CPU at 30%; revises to keep current
    Estimate: $0 net change
    PR approved with monitoring action

WEEK 4 — CULTURAL CHANGE EMERGING:
  Engineers run Infracost locally before opening PR
  PR descriptions include cost rationale
  Reviewers ask cost questions in review

MONTH 2 — STEADY STATE:
  Average PR cost change: -$50/mo (more savings than additions)
  Cost-driven revisions: 35% of cost-impacting PRs
  Blocked PRs (over-provisioning): 12% of attempts
  Team adopted "cost rationale" as PR checklist item

POST-IMPLEMENTATION METRICS (3 months in):
  Cost-per-feature: 18% improvement
  Surprise cost growth: down 60%
  Engineer cost-awareness: visibly better in discussions
  Cost review time: 2-3 min per PR (acceptable)

CULTURAL OUTCOMES:
  "Cost is part of design" mindset
  Engineers proactively consider cost
  Better PR review quality
  Stronger relationship between FinOps + engineering
```

The cultural change is the long-term value; the tool is just the trigger.

---

## 3. Hands-on (5 min)

Set up cost estimation:

```
□ STEP 1: Check current state
  Do you have pre-merge cost estimation? □ Yes □ No
  Cloud-native cost forecasting in use? □ Yes □ No

□ STEP 2: Install Infracost locally
  $ brew install infracost (or download)
  $ infracost auth login

□ STEP 3: Run on existing Terraform
  $ infracost breakdown --path terraform/
  Current monthly cost: $_____

□ STEP 4: Plan CI integration
  CI system: __________ (GitHub Actions / GitLab / etc.)
  Threshold: $_____/mo
  Owner: __________

□ STEP 5: Set team approval policy
  Auto-approve: cost decrease
  Standard review: change <$100/mo
  Peer approval: $100-1000/mo
  Senior approval: >$1000/mo
```

A 1-day project for setup; cultural change emerges over weeks.

---

## 4. Knowledge check

### Q1
Pre-merge cost estimation captures:

A. All cost issues
B. Baseline cost changes from IaC (per-resource hourly + storage + networking). Doesn't capture usage-driven costs (Lambda requests, DynamoDB on-demand) precisely. Provides upper-bound estimate; ZopNight post-merge gives reality.
C. Random
D. Nothing useful

<details>
<summary>Show answer</summary>

**Correct: B.** Baseline costs; useful estimate, not perfect.
</details>

### Q2
Engineer culture from pre-merge cost gate:

A. Slows development
B. Improves cost awareness. Engineers think about cost BEFORE opening PRs; reviewers consider cost alongside functionality; better design decisions. After 2-month adoption: net positive on velocity (fewer rollbacks for cost reasons).
C. Random
D. Hurts review quality

<details>
<summary>Show answer</summary>

**Correct: B.** Better culture; better decisions.
</details>

### Q3
Tool's main limitation:

A. None — it's complete
B. Estimates use cloud rate-card; doesn't account for customer's actual discount stack (RIs, SPs, EDP). Real cost typically lower. Treat estimate as upper bound; use ZopNight post-merge for actual cost with discounts.
C. Random
D. It's perfect

<details>
<summary>Show answer</summary>

**Correct: B.** Rate-card based; supplement with ZopNight for actual.
</details>

---

## 5. Apply

Integrate Infracost (or equivalent) into CI. Set thresholds + approval policy. Educate team. Combine with ZopNight post-merge for full lifecycle visibility.

For your team: 1-day setup; 4-week cultural adoption; long-term cost discipline.

---

## Related lessons

- [L1 — Tag enforcement](L1_tag_enforcement.md)
- [L2 — IaC drift detection](L2_drift.md)
- [L4 — Blast-radius reduction](L4_blast_radius.md) *(next)*
- [M5.5.L1 — Reliability vs cost](../M5.5_reliability_vs_cost/L1_the_line.md)

## Glossary terms touched

[Pre-merge cost estimation](../../../reference/glossary/pre-merge-cost-estimation.md) · [Infracost](../../../reference/glossary/infracost.md) · [PR cost comment](../../../reference/glossary/pr-cost-comment.md) · [Cost approval threshold](../../../reference/glossary/cost-approval-threshold.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.6.L3
