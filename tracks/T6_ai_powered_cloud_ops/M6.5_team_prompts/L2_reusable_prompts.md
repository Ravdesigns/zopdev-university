# Building reusable prompts (skills)

§ T6 · M6.5 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **write** a reusable prompt as a Claude Code skill (or Cursor/Codex command), **parametrize** it for variation across teams or time windows, **and choose** the right scope/sharing mode for your team.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Turn our team's recurring prompts into named commands the whole team can invoke." |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Manager |
| **Prerequisites** | M6.5.L1 (why team-specific) · M6.2 (AI tool setup) |
| **Time** | 9 minutes |
| **Bloom verb** | Write (Create), Parametrize (Apply), Choose (Evaluate) |

---

## 1. Concept

A reusable prompt is a markdown file the AI tool loads as a named command. Invoke by name; the agent runs the embedded instructions exactly the same way every time. This is the leverage moment — a team-specific prompt becomes a team-specific *capability*.

```
WITHOUT skill                          WITH skill
──────────────────────────────────────────────────────────────────
Engineer types the 200-word prompt     Engineer types:
every time                              /payment-team-weekly

Inconsistent across team members        Same instructions run every time

Drift over time                         Edit the file → everyone benefits

Pasted into Slack ad-hoc                Versioned in git

Tribal knowledge ("ask jane,            Tooling
 she has the good prompt")              ("/payment-team-weekly")
```

The shift is from prompts-as-text-snippets to prompts-as-software.

### Skill file format (Claude Code)

```
LOCATION:
  ~/.claude/skills/<name>.md       (per-user, available everywhere)
  .claude/skills/<name>.md         (per-project, committed to repo)

STRUCTURE:
  ---
  description: One-line description for the menu
  args:                        (optional)
    team:
      description: Team name
      required: true
    days:
      description: Time window
      default: "7"
  ---
  
  # Instruction body (markdown)
  
  Step-by-step instructions for the agent.
  Can reference MCP tools by name.
  Can include examples.
  Can use {{var}} for parameters.
```

The skill is just a file. No build step. Edit in your editor; reload in Claude Code.

### Cursor command format

```
LOCATION:
  .cursor/commands/<name>.md  (per-project)
  
STRUCTURE: similar to Claude Code; refer to Cursor docs for exact spec.
```

Cursor commands and Claude Code skills are mostly portable — the same prompt body works for both with minor frontmatter changes.

### Minimal example — weekly cost summary

```markdown
---
description: Weekly cost summary for the payment team
---

Use the zopnight MCP server. Do the following:

1. Call get_costs filtered to last 7 days, team=payment-team
2. Call get_costs same filter, previous 7 days
3. Call get_recommendation_summary for payment-team
4. List open recommendations with savings > $100/mo

Output as a markdown table:
  | Metric | This Week | Last Week | Delta |

Followed by:
  ## Open items
  Top 3 recommendations by savings
  
  ## Suggested actions
  2-3 specific next steps for the team
```

Saved as `~/.claude/skills/payment-cost-weekly.md`. Invoked as `/payment-cost-weekly`.

### Parametrizing — same skill, multiple teams

Hardcoding "payment-team" works for one team. Parametrize for multi-team usage:

```markdown
---
description: Cost summary for any team (parameterized)
args:
  team:
    description: Team name (e.g., payment-team, ml-infra)
    required: true
  days:
    description: Time window in days
    default: "7"
---

Use zopnight MCP. Get costs for team={{team}} for last {{days}} days.
Compare to previous {{days}} days.

Output:
  | Metric | This Period | Previous Period | Delta % |

Top 3 resources by cost growth.
Top 3 open recommendations.
```

Invoke variations:
```
/cost-summary --team=payment-team --days=7
/cost-summary --team=ml-infra --days=14
/cost-summary --team=data-platform --days=30
```

One skill; serves the whole org. Parametrization is the highest-leverage skill design pattern.

### Four categories of skills

Most team skills fall into one of four categories. Pick the right one for the workflow.

```
1. REPORTS (regular structured outputs)
   /weekly-cost-summary
   /monthly-team-report
   /quarterly-savings-report
   /budget-status-snapshot
   
   Characteristic: predictable shape, run on cadence, consumed
   by team or leadership.

2. CHECKS (audit / verification)
   /tag-coverage-check
   /pat-rotation-check
   /idle-resource-check
   /multi-az-compliance-check
   
   Characteristic: pass/fail criteria, list of exceptions,
   driven by policy.

3. DRAFTS (writing output)
   /draft-incident-comms
   /draft-postmortem-skeleton
   /draft-budget-justification
   /draft-chargeback-explanation
   
   Characteristic: produces text the engineer edits and ships;
   structures recurring writing.

4. EXPLORATIONS (research / investigation)
   /investigate-cost-spike
   /research-savings-opportunities
   /compare-teams
   /find-similar-resources
   
   Characteristic: open-ended; agent does the legwork; engineer
   reads and decides.
```

Most teams accumulate 3-5 in each category over 6 months. The first one is the hardest; subsequent ones follow the pattern.

### From recipe to skill

The 15 recipes in M6.4 are skill candidates. The conversion is straightforward:

```
RECIPE (generic template from M6.4):
  "List all RDS not in Multi-AZ across all accounts"
  
↓ ADD team context, parameters, output format ↓
  
SKILL (team-specific):
  /rds-multi-az-check
    Filter: team={{team}}
    Account scope: {{accounts}}
    Output: table with resource_id, region, account, owner
    Highlight: prod resources (require Multi-AZ by policy)

USAGE:
  $ claude
  > /rds-multi-az-check --team=payment-team
  → returns formatted table; engineer copies into JIRA
```

The path: ZopNight recipe → team customization → team skill. M6.4 + M6.5 work in series.

### Designing for re-use

```
RE-USABLE skills tend to be:
  ✓ Specific in scope (one team, one workflow)
  ✓ Parametrized for variation
  ✓ Output-format prescriptive (markdown table, JSON, etc.)
  ✓ Idempotent (same input → same output)
  ✓ Self-documenting (description field is clear)
  ✓ Quick (one or two MCP calls, not ten)

NOT re-usable:
  ✗ "Investigate this problem" (too vague)
  ✗ "What do you think about cost?" (no specific output)
  ✗ One-off questions
  ✗ 30-step workflows (LLM loses focus; split it)
  ✗ Requires constant editing each run (parametrize instead)
```

The discipline is the same as writing a good function: single responsibility, clear contract, predictable output.

### Sharing skills with the team — modes

```
MODE 1: Per-user (~/.claude/skills/)
  Each engineer copies the file to their machine
  Simple to start; drifts over time
  Best for: personal preferences not relevant to team
  
MODE 2: Project-scoped (.claude/skills/)
  Committed to repo; auto-loaded for anyone with the repo
  Same skills for everyone touching the repo
  Best for: team-specific or repo-specific workflows
  
MODE 3: Centralized (team wiki + sync script)
  Master copy in wiki / shared folder
  Engineers run sync script to pull latest
  Versioned via wiki history; signed off by maintainer
  Best for: cross-team standards (org-wide skill library)
```

M6.5.L3 covers the sharing patterns in depth. Default for most teams: Mode 2 (project-scoped).

### Skill naming conventions

```
GOOD names (specific, scannable):
  /payment-cost-weekly
  /ml-infra-monthly-report
  /platform-budget-status
  /rds-multi-az-check
  
BAD names (vague, collision-prone):
  /cost
  /report
  /check
  /weekly
  
PATTERN: <team-or-domain>-<workflow>-<cadence>
  /finops-savings-report-quarterly
  /sre-incident-cost-comms-draft
```

The name appears in the slash-command menu. Treat it like a public API.

### Versioning skills

Skills evolve. Track changes the same way you track code.

```
SKILL changes over time. Track:
  - What changed
  - Why (which questions evolved? new data sources?)
  - Who maintains (single owner is best)
  - Last reviewed date
  - Breaking changes vs additive changes

Use git for version history.

Add a header comment in the skill file:
  ---
  description: Payment team weekly cost summary
  maintainer: jane@platform
  last_reviewed: 2026-05-21
  ---
  
M6.5.L4 covers versioning + maintenance in depth.
```

### Common pitfalls

```
PITFALL                                  FIX
──────────────────────────────────────────────────────────────────
Skill returns generic output             Add specific output format
                                          ("Return as table with cols X, Y")
                                          
Works for one engineer, not another      PAT scope or permissions differ
                                          Add "requires PAT scopes: ..."
                                          in skill header

Skill becomes outdated as MCP evolves    Quarterly review
                                          (M6.5.L4)

Skill too long; LLM loses focus          Split into smaller skills
                                          Chain them via instructions

Hard to maintain because no docs         Use the description field well
                                          Add inline comments

"It worked last week, broke today"       Pin assumptions in the prompt
                                          (specific tool names, filter
                                          syntax) so changes are visible
```

### Skills + non-MCP tools

A skill can do more than call MCP tools. Common patterns:

```
SKILL CALLS COMBINATION:
  1. MCP tools (data from ZopNight)
  2. Bash commands (read local files, generate plots)
  3. File reads (load context from team wiki)
  4. Write to file (save output to a path)

EXAMPLE — weekly report skill:
  1. Pull data from ZopNight MCP
  2. Format as table
  3. Append last week's report from disk
  4. Write to docs/weekly-cost/2026-W21.md
  5. Open in editor for review
```

The LLM orchestrates; the skill defines the steps.

### Pricing / cost of skills

```
SKILL EXECUTION cost:
  ZopNight MCP calls: free
  LLM inference: paid by the engineer's AI tool subscription
  
TYPICAL skill costs:
  Short report skill (3 MCP calls + 500-word output):
    ~$0.01-0.05 per invocation (Claude/GPT-4 pricing)
  
  Complex investigation (10+ MCP calls + analysis):
    ~$0.50-2.00 per invocation
  
  Vs. engineer's time:
    Even at $0.50/skill-run, beats 10 minutes of manual analysis
    at $100/hr ($16.66/run).
```

Skills pay back instantly. The economics aren't the constraint; the discipline of writing them is.

---

## 2. Demo

A team-skill workflow over 3 weeks:

```
WEEK 1 (creation):
  PAYMENT-TEAM lead writes the first skill.
  
  EDIT .claude/skills/payment-cost-weekly.md:
  
  ---
  description: Payment team weekly cost summary
  maintainer: jane@platform
  ---
  
  Use zopnight MCP. Generate this week's payment-team cost summary:
  
  1. get_costs (team=payment-team, last 7 days)
  2. get_costs (team=payment-team, previous 7 days)
  3. list_resources (team=payment-team, sorted by 7-day cost growth)
  4. get_recommendation_summary (team=payment-team)
  
  Output:
    ## Payment-Team Weekly Cost
    | Metric | This Week | Last Week | Delta |
    
    Top growers (top 3 by % change)
    
    Open recommendations (top 3 by savings)
    
    Action items for the team
  
  COMMIT to repo. Push to team's main branch.

WEEK 2 (adoption):
  Jane's teammates pull the repo.
  /payment-cost-weekly now appears in their slash menu.
  Friday: all 4 engineers run it before standup.
  Same format, same numbers, no negotiation.
  
WEEK 3 (refinement):
  Engineer asks: "can we add cost-by-account breakdown?"
  Jane edits the skill, adds:
    5. get_cost_by_provider (team=payment-team) → break out by account
    Updated output to include account-level table
  Commits. Push. Everyone gets the update automatically.

ELAPSED: 30-second invocation, weekly, by 4 engineers = 30 minutes
saved per week. 26 hours per year. The skill paid for itself in week 1.
```

The skill becomes part of the team's tool belt — versioned, shared, reliable.

---

## 3. Hands-on (5 min)

Write your first team skill:

```
□ STEP 1: Identify a recurring question (from M6.5.L1 hands-on)
  Question: __________

□ STEP 2: Choose category
  □ Report   □ Check   □ Draft   □ Exploration

□ STEP 3: Draft the skill
  Path:        ~/.claude/skills/__________.md
  Description: __________
  Body:        Step-by-step instructions
  Parameters:  {{team}} / {{days}} / __________

□ STEP 4: Test invocation
  $ claude
  > /__________
  Does it produce the expected output?
  
□ STEP 5: Refine output format
  Add explicit "Output as: ..." instructions
  Re-run until consistent
  
□ STEP 6: Commit to repo
  .claude/skills/__________.md
  Mention in #team-channel: "new skill: /__________"
  
□ STEP 7: Get teammate feedback
  Have 1-2 teammates run it; collect feedback
  Iterate until 3 engineers can run it independently
```

The first skill takes 30 minutes. The 5th takes 5 minutes. Build the muscle.

---

## 4. Knowledge check

### Q1
A reusable skill is:

A. Just a saved prompt
B. A markdown file with structured instructions invoked by name; same input → same output; versioned in git; shared with team. The shift is from prompts-as-text-snippets to prompts-as-software.
C. Random
D. Code

<details>
<summary>Show answer</summary>

**Correct: B.** Prompts-as-software. The skill is the unit of leverage.
</details>

### Q2
A well-designed reusable skill:

A. Is broad and flexible
B. Specific in scope, parametrized for variation, output-format prescriptive, idempotent. Like a good function: single responsibility, clear contract, predictable output.
C. Random
D. Vague is fine

<details>
<summary>Show answer</summary>

**Correct: B.** Software-engineering discipline applies to skills.
</details>

### Q3
Versioning skills:

A. Don't bother
B. Use git for version history. Add maintainer + last-reviewed in the frontmatter. Quarterly review (M6.5.L4). Treat skills as code — they're part of the team's tool belt.
C. Random
D. Each engineer edits independently

<details>
<summary>Show answer</summary>

**Correct: B.** Skills are code; track them like code.
</details>

---

## 5. Apply

Build 1-3 reusable skills for your team this week. Commit to repo (`.claude/skills/`). Document the description well. Have a teammate run them. Iterate.

The first skill is the hardest. The 10th is muscle memory.

---

## Related lessons

- [L1 — Why team-specific prompts beat general ones](L1_why_team_specific.md)
- [L3 — Sharing skills across the team](L3_sharing.md) *(next)*
- [L4 — Versioning and maintaining skills](L4_versioning.md)
- [M6.4 — Recipe library (generic templates to convert)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Skill (Claude Code)](../../../reference/glossary/skill.md) · [Cursor command](../../../reference/glossary/cursor-command.md) · [Parametrized skill](../../../reference/glossary/parametrized-skill.md) · [Skill frontmatter](../../../reference/glossary/skill-frontmatter.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.5.L2
