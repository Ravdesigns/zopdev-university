# When you actually need writes

§ T6 · M6.6 · L2 of 3 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **choose** the right write surface for a given action, **execute** the "agent helps; human writes" loop, **and avoid** the common mistake of fighting the read-only contract.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "When the agent identifies an action I want to take, pick the right write surface and execute cleanly." |
| **Personas** | Platform Engineer · SRE · FinOps Lead |
| **Prerequisites** | M6.6.L1 (read-only forever) · M6.2 (AI tool setup) |
| **Time** | 9 minutes |
| **Bloom verb** | Choose (Evaluate), Execute (Apply), Avoid (Apply) |

---

## 1. Concept

MCP is read-only. So when the agent says "you should stop i-0xyz123," what's the actual write path? This lesson covers the five write surfaces and the decision logic to pick the right one.

```
THE FIVE WRITE SURFACES:
  1. ZopNight UI                — humans, one-off actions
  2. ZopNight API (PAT)         — programmatic, automation
  3. Auto-remediation rules     — certified, recurring
  4. Terraform / IaC            — provisioning side
  5. Cloud provider direct      — emergency / bypass
```

Each has a sweet spot. Picking the right one is the engineering skill.

### Surface 1: ZopNight UI

```
USE CASE: one-off action, human-in-the-loop, low-to-medium volume

FLOW:
  1. Agent identifies action via MCP
  2. Agent returns ZopNight UI URL (deep link to the resource/rec)
  3. Engineer opens the URL
  4. UI shows context (cost, tags, owner, history)
  5. Engineer clicks "Apply" or "Schedule"
  6. Audit log records: user@email clicked at time T
  
WHEN TO USE:
  ✓ 1-5 actions
  ✓ Need visual confirmation
  ✓ Want audit clearly attributed to human
  ✓ Action requires judgment (not a clean rule)
```

The UI is the highest-confidence write surface. The 30 seconds of "let me look" is worth it.

### Surface 2: ZopNight API

```
USE CASE: scripted bulk action, automation, integration

FLOW:
  1. Engineer reviews agent's suggestion + list of targets
  2. Writes a script using ZopNight API
  3. Runs script; PAT authenticates
  4. Audit log records: PAT_X (description: "scripted bulk apply")
     applied N actions at time T

EXAMPLE (bulk apply recommendations):
  curl -X POST https://api.zopnight.com/v1/recommendations/apply \
    -H "Authorization: Bearer $ZN_PAT" \
    -H "Content-Type: application/json" \
    -d '{
      "recommendation_ids": ["rec_1", "rec_2", "rec_3", ...],
      "actor_note": "Quarterly cleanup; reviewed by jane@platform"
    }'

WHEN TO USE:
  ✓ 10+ actions in one batch
  ✓ Automating a workflow
  ✓ Integrating with internal tools (CI, ticketing)
  ✓ Repeatable script (not one-shot)
```

API + script is the right pattern for bulk operations. The script is the artifact; the agent's suggestions become the input.

### Surface 3: Auto-remediation

```
USE CASE: recurring action covered by a certified rule

PATTERN:
  Customer defines a rule: "delete unattached EBS volumes >30 days old"
  ZopNight runs it on schedule (daily/weekly)
  Each application is fully audited
  No human-in-the-loop for known-safe action types

WHEN TO USE:
  ✓ Action repeats (weekly+)
  ✓ Risk is low (safeguards built in)
  ✓ Customer has approved the rule type
  ✓ Volume too high for one-at-a-time review
  
RULE TYPES (certified, common):
  Delete unattached EBS volumes >30 days
  Delete unused EBS snapshots >90 days
  Stop idle non-prod instances overnight
  Delete idle Lambda versions
  Release unattached EIPs
```

Auto-rem is "agent suggests the policy; ZopNight executes the policy." See M5.3.L4 for full coverage.

### Surface 4: Terraform / IaC

```
USE CASE: infrastructure change (right-size, schedule, lifecycle)
          that should be persistent in your IaC source of truth

PATTERN:
  Agent identifies right-sizing opportunity
  Engineer updates Terraform module (or asks agent to draft the diff)
  PR with cost estimation (M5.6.L3) shows the dollar impact
  Code review by team
  Merge → apply

EXAMPLE diff (drafted by agent, reviewed by engineer):
  resource "aws_instance" "web" {
  -  instance_type = "m5.xlarge"
  +  instance_type = "m5.large"  # cost savings: $80/mo (agent rec)
     ...
  }

WHEN TO USE:
  ✓ Resource is managed by IaC
  ✓ Change should persist across re-provisions
  ✓ Want change-management review
  ✓ Cost delta deserves a PR-level decision
```

For IaC-managed infra, the IaC path is mandatory — otherwise the next `terraform apply` reverts the change.

### Surface 5: Cloud provider direct (emergency only)

```
USE CASE: incident response when ZopNight unavailable

PATTERN:
  Cost spike happens; ZopNight is down or slow
  Engineer kills resources directly via aws/gcloud/az CLI
  Audit log entry recorded manually in incident channel
  Post-incident: reconcile with ZopNight after restoration

CAVEATS:
  ✗ Loses ZopNight's audit + safeguards
  ✗ Risk of inconsistent state vs ZopNight's view
  ✗ Manual audit reconciliation
  
WHEN TO USE:
  ✓ True incident (cost runaway, security)
  ✓ ZopNight unavailable
  ✓ Action too time-critical to wait
  ✓ Document immediately; reconcile after
```

This is the break-glass path. Use rarely; document thoroughly.

### Decision matrix — pick the right surface

```
SITUATION                              RECOMMENDED PATH
─────────────────────────────────────────────────────────────────
One-off, low-stakes (single resource)   ZopNight UI
One-off, high-stakes (production)        ZopNight UI (with approval policy)
Bulk action (10-100 resources)           ZopNight API or auto-rem
Bulk action (100+ resources)             ZopNight API (script + review)
Recurring action (weekly+)               Auto-remediation rule
Infrastructure right-size                Terraform/IaC + PR
Schedule (recurring start/stop)          ZopNight UI for schedule def
Emergency (active incident)              Cloud direct, audit after
Mass tag application                     ZopNight API (bulk)
                                          + Terraform for new resources
```

Print this; tape to monitor.

### Example — agent suggests right-sizing

```
AGENT (via MCP):
  "i-0abc123 is 20% CPU-utilized over last 14 days; 
   recommend right-size m5.xlarge → m5.large
   estimated savings: $80/mo (~$960/yr)"

ENGINEER's decision tree:
  
  Is this resource in Terraform?
    YES → Surface 4 (Terraform PR with cost-estimation)
    NO  → continue
    
  Is this production or dev?
    PROD → Surface 1 (UI with approval) or 4 (Terraform)
    DEV  → Surface 1 (UI, fast) or 3 (auto-rem if pattern is common)
    
  Frequent right-sizing in this team?
    YES → Surface 3 (define auto-rem rule)
    NO  → Surface 1 or 4

DECISION (this case): Dev environment, IaC-managed, infrequent → 
  Terraform PR. Agent drafts the diff; engineer reviews + merges.
  Total time: 15 minutes including review.
```

The "right path" depends on context. The decision matrix gives the starting point.

### Why not just expose writes via MCP

Recap from L1, in case anyone forgets:

```
1. Agents hallucinate (LLM picks wrong target or wrong action)
2. Confirmation fatigue if every call needs approval
3. Audit trail gets ambiguous ("did the agent intend this?")
4. Existing surfaces cover the write needs
5. One bad agent action in production = trust erosion org-wide

ZOPNIGHT'S BET:
  Better UX through dedicated write surfaces
  Than a single MCP "do anything" endpoint
  
The agent + 5 surfaces beat agent-with-writes.
```

### The "agent helps; human writes" loop

The full operating model:

```
1. Engineer asks agent a question
   "what's the biggest cost-saving opportunity in payment-team?"

2. Agent investigates via MCP (read-only)
   list_resources, get_costs, get_recommendations

3. Agent recommends an action with justification
   "Top opportunity: stop rds-prod-staging-replica.
    Idle 75 days. Savings: $240/mo. 
    Confirmed: no recent connections per CloudWatch."

4. Engineer reviews the recommendation
   "Is this in IaC? Who owns this DB?"
   (often the engineer asks the agent these follow-ups via MCP)

5. Engineer executes via the right write surface
   Surface 1 (UI) for a one-off non-IaC resource
   Surface 4 (Terraform PR) for an IaC-managed resource
   
6. Audit log records the human's action
   user@email clicked Stop at time T
   Action: stop rds-prod-staging-replica

LOOP CONTINUES:
  Engineer asks agent: "did the action take effect? cost recovered?"
  Agent checks via MCP read (audit log + current cost)
  Confirms or reports issue
```

Agent is research + drafting. Human is decision + action. The split is the safety architecture.

### Common mistake — fighting the contract

```
WRONG PATTERN:
  Engineer: "stop i-0xyz123"
  Agent:    "I cannot, MCP is read-only"
  Engineer: [annoyed, types "you're useless"]
  Agent:    [apologetic, still cannot stop]

THE PRODUCTIVE PATTERN:
  Engineer: "Should I stop i-0xyz123? It's been idle 30 days."
  Agent:    investigates, confirms idle, checks owner,
            drafts justification with cost + risk assessment
  Engineer: reviews the justification
            opens ZopNight UI from agent's link
            clicks Stop with one click of confidence

REFRAME the request from imperative ("stop X") to investigative
("should I stop X?"). The agent + UI together is FASTER than UI alone
because the agent does the research the engineer would otherwise do
manually.
```

The mistake is treating MCP as a command surface. It's an analysis + recommendation surface that pairs with write surfaces.

### Tool integration — combining surfaces

```
SOME AI TOOLS support cross-surface workflows:
  Cursor:        can edit Terraform files
  Claude Code:   can run CLIs + edit code + open URLs
  Copilot Workspace: can open GitHub PRs
  Claude Desktop: limited to MCP and chat

COMBO PATTERN (best leverage):
  1. Agent reads ZopNight data via MCP
  2. Agent drafts the Terraform change (via Cursor/Claude Code)
  3. Tool creates a Git branch + opens a PR (via Copilot Workspace/CLI)
  4. Human reviews PR (cost estimate visible)
  5. Human merges
  6. Apply runs in CI
  7. Engineer asks agent (MCP) to confirm savings recovered

EFFECTIVE WORKFLOW even with read-only MCP.
The agent + IDE + ZopNight UI + CI = the modern FinOps toolchain.
```

This is the future: agents that orchestrate writes through deliberate, audited surfaces.

---

## 2. Demo

A quarterly cleanup workflow combining surfaces:

```
ENGINEER WANTS TO CLEAN UP IDLE RESOURCES (quarterly task):

STEP 1: Agent (via MCP) — research
  > "list top 20 idle resources across non-prod accounts, 
     sort by monthly cost descending"
  → Returns list: 20 resources, total $2,400/mo savings opportunity

STEP 2: Engineer reviews (with agent's help)
  > "for each, who's the owner? when was it last used?"
  → Agent enriches list with owner emails + last-used dates

STEP 3: Engineer decides
  Decides 14 are safe to stop now
  4 need owner sign-off (Slack to owners)
  2 are actually used (rare workflow); skip

STEP 4: Execute via right surfaces
  6 IaC-managed → ask agent to draft Terraform diff;
                   open as PR with cost estimate
  8 manual resources → bulk apply via API:
    curl -X POST .../v1/resources/bulk-stop -d '{...}'
  
STEP 5: Agent (via MCP) — verify
  > "compare yesterday's run rate to today's for non-prod"
  → Returns: $2,200/mo savings confirmed (98% of estimate)

TOTAL TIME: 45 minutes for $2,200/mo recovery = $26,400/yr.
The agent did 30 minutes of research the engineer would have
done manually; engineer did 15 minutes of decisions + executions.
```

This is the operating model in production. Each surface plays its role.

---

## 3. Hands-on (5 min)

Plan 3 cost-saving actions you want to take this week:

```
ACTION 1: __________
  Recommended surface: __________
  Why: __________

ACTION 2: __________
  Recommended surface: __________
  Why: __________

ACTION 3: __________
  Recommended surface: __________
  Why: __________

REFLECTION:
  Which actions are good candidates for auto-rem rules
  (i.e., they'll repeat)?
  → __________
  
  Which need a Terraform PR (IaC-managed)?
  → __________
```

Mapping actions to surfaces is a 5-minute exercise; saves hours of friction over the quarter.

---

## 4. Knowledge check

### Q1
Agent suggests stopping one resource. Best write path:

A. Via MCP
B. ZopNight UI (one-off, low cognitive overhead, full audit). MCP is read-only by design. API is the alternative for scripted/bulk actions.
C. Random
D. AWS CLI directly

<details>
<summary>Show answer</summary>

**Correct: B.** UI for one-off. The 30 seconds of review is the safeguard.
</details>

### Q2
Recurring write action (delete unattached EBS weekly):

A. Manual every time
B. Auto-remediation rule. Define once; ZopNight applies on schedule with audit. No human-in-loop for the certified rule. See M5.3.L4 for the full pattern.
C. Random
D. Skip

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-rem rule. Manual repetition is the anti-pattern.
</details>

### Q3
Persistent infrastructure right-sizing:

A. UI for one-off
B. Terraform/IaC + PR. Audit + reproducibility + cost estimate pre-merge (M5.6.L3). Without IaC path, the next `terraform apply` reverts the manual change.
C. Random
D. Cloud CLI

<details>
<summary>Show answer</summary>

**Correct: B.** IaC path for IaC-managed resources.
</details>

---

## 5. Apply

Match the write to the surface. Don't fight read-only MCP — work *with* the agent + 5-surface architecture. Reframe imperative prompts ("stop X") into investigative ones ("should I stop X?").

For your team: post the decision matrix in the team wiki. Reference it the first 2-3 times until it becomes muscle memory.

---

## Related lessons

- [L1 — Read-only forever (the architectural choice)](L1_read_only_forever.md)
- [L3 — Future: write approval roadmap](L3_future_write_approval.md) *(next)*
- [M5.3.L4 — Auto-remediation rules](../../T5_devops_cost_discipline/M5.3_automation/L4_auto_remediation.md)
- [M5.6.L3 — Pre-merge cost estimation](../../T5_devops_cost_discipline/M5.6_iac/L3_cost_estimation.md)

## Glossary terms touched

[Write surface](../../../reference/glossary/write-surface.md) · [Agent-helps-human-writes loop](../../../reference/glossary/agent-helps-human-writes.md) · [Decision matrix](../../../reference/glossary/write-surface-decision-matrix.md) · [Break-glass path](../../../reference/glossary/break-glass-path.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.6.L2
