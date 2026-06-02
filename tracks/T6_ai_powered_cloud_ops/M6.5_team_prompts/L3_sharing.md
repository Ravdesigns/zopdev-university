# Sharing skills across the team

§ T6 · M6.5 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **choose** the right sharing mode (project-scoped, team-scoped, org-wide), **set** quality gates for shared skills, **and execute** a migration from personal skills to a shared library.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Spread skills across the team / org so everyone benefits, without re-inventing prompts each time." |
| **Personas** | Platform Engineer · Engineering Manager · FinOps Lead |
| **Prerequisites** | M6.5.L1 (why team-specific) · M6.5.L2 (skill format) |
| **Time** | 9 minutes |
| **Bloom verb** | Choose (Evaluate), Set (Apply), Execute (Apply) |

---

## 1. Concept

Skills are most valuable when shared. One engineer writes a skill; everyone uses it. But "share" can mean many things — different scopes for different signal-to-noise ratios.

```
SHARING MODE             SCOPE                    GOOD FOR
─────────────────────────────────────────────────────────────────
Per-individual           ~/.claude/skills/        Personal prefs
                                                  Experiments
                                                  
Project-scoped           .claude/skills/          Repo-specific
                          (committed to repo)     workflows
                                                  
Team-scoped              team-skills repo         Team standards
                                                  (symlinked)
                                                  
Org-wide                 org-ai-skills repo       Cross-team
                                                  capability
```

Most teams use a combination — personal for one-offs, project-scoped for repo work, team-scoped for the team's standard kit.

### Project-scoped sharing

```
PATTERN: skills live in the repo they're relevant to

REPO: cost-platform/
  .claude/skills/
    rds-multi-az-check.md
    schedule-failures.md
    team-cost-summary.md

WORKFLOW:
  Engineer clones repo → skills auto-load when working in this dir
  Engineer edits a skill → PR review → merge → team gets the update
  PR review on skill changes catches regressions
```

```
PROS:
  Simple, versioned via git
  In-context (skills relevant to this repo)
  Auto-discovered by Claude Code when inside the repo
  
CONS:
  Only available when working in this repo
  Cross-repo workflows duplicated
```

Best default for most teams: start here.

### Org-wide sharing

```
PATTERN: a single repo for all org-level skills

REPO: org-ai-skills/
  finops/
    weekly-cost-review.md
    monthly-savings-report.md
    quarterly-budget-snapshot.md
  devops/
    schedule-failure-check.md
    runbook-cost-incident.md
    multi-az-compliance.md
  general/
    cost-spike-investigation.md
    new-resource-onboarding.md

INSTALL (one-time per engineer):
  $ git clone https://github.com/your-org/org-ai-skills ~/org-ai-skills
  $ ln -s ~/org-ai-skills/finops ~/.claude/skills/finops
  $ ln -s ~/org-ai-skills/devops ~/.claude/skills/devops
  
  → all skills now available in any project

UPDATE:
  $ cd ~/org-ai-skills && git pull
  → everyone has the latest immediately
```

```
PROS:
  Discoverable (one place to look)
  Central maintenance + ownership
  Everyone shares the same canonical skills
  Reduces duplication
  
CONS:
  Needs maintenance discipline (or skills rot)
  One-off skills clutter unless curated
  Slower iteration (PR review overhead)
```

### Team-level repo

```
PATTERN: each team owns their skills repo

REPO: payment-team-skills/
  cost-weekly.md
  perf-cost-correlation.md
  incident-cost-impact.md
  budget-justification-draft.md

INSTALL:
  Engineer joins payment-team
  $ git clone payment-team-skills
  $ ln -s ~/payment-team-skills ~/.claude/skills/payment
  → inherits team's skill kit immediately

PORTABILITY:
  Engineer switches team → swap symlinks
  Each team controls its own; no central bottleneck
```

```
PROS:
  Team autonomy; high signal-to-noise (no cross-team noise)
  Onboarding: new teammates inherit the team's expertise
  Independent iteration per team
  
CONS:
  Harder to discover skills in other teams
  Cross-team skill duplication possible
  Need cross-team review for "promote to org-wide"
```

Good for: orgs with strong team autonomy; teams with team-specific workflows.

### Standard skill file header (for sharing)

Every shared skill needs metadata so consumers know what they're getting:

```markdown
---
description: One-line description (shown in slash menu)
when_to_use: "Friday cost review prep"
owner: jane@platform
last_reviewed: 2026-05-21
requirements: "PAT with read:costs, read:recommendations"
parameters:
  team: required (e.g., payment-team)
  days: optional (default 7)
example_output: "Markdown table with This Week vs Last Week"
---

# Skill instructions...
```

The header pays back when someone unfamiliar runs the skill — they know what it does, who owns it, and what it needs.

### Discovery — making skills findable

```
NEW engineer joins; needs to find existing skills:

MECHANISMS:
  1. README.md at top of skills repo
     List every skill with one-line description + tags
     
  2. Per-category README in each subdirectory
     Group skills logically: reports, checks, drafts, exploration
     
  3. Wiki page mirroring the skill catalog
     Searchable by team / cadence / scope
     
  4. Recurring "skill of the week" Slack post
     Promotes underutilized but valuable skills
     
  5. Onboarding doc lists "first 5 skills to try"
     Reduces blank-page problem for new joiners
```

Discovery is usually the bottleneck, not creation. Invest in it.

### Quality gates for shared skills

Personal skills can be sloppy; shared skills should be reviewed.

```
PR-REVIEW CHECKLIST for a new shared skill:
  □ Does it work as described?
  □ Is the description field clear and specific?
  □ Are parameters documented?
  □ Output format clear and consistent?
  □ Edge cases handled (empty results, errors)?
  □ Owner / maintainer specified?
  □ Tested by at least 2 engineers?
  □ Doesn't duplicate an existing skill?

REVIEWER tests:
  $ claude
  > /new-skill --team=payment-team
  
  Confirms output matches description.
  Tries an edge case (empty result).
  Approves PR.
```

Treat skills like internal libraries. The review pays back in trust.

### Anti-patterns

```
ANTI-PATTERN                              FIX
──────────────────────────────────────────────────────────────────
Every engineer writes their own           One canonical skill;
"weekly summary"                          others contribute via PR
                                          
Skills with secrets / customer data       Parametrize ({{team}})
hardcoded                                 Use env vars for secrets
                                          
Skill requires admin PAT (broad scope)    Design for read-only PAT
                                          Use minimum needed scope
                                          
Skill that no one maintains; broken       Quarterly review (M6.5.L4)
for 6 months                              Mark deprecated; delete
                                          
Skill name collisions (/report)           Adopt naming convention
                                          <domain>-<workflow>
                                          
Org-wide repo as dumping ground           Curated; quarterly cleanup
                                          Promote skills that earn it
```

### Migration — personal → shared

Common scenario: org has 50 engineers, each with personal skills, wants to centralize.

```
STEP 1: AUDIT (1-2 weeks)
  Each engineer submits their ~/.claude/skills/ to a survey
  Collect into a single staging directory
  Expected: 100-200 skills, 60% duplicated

STEP 2: DEDUPE + GENERALIZE (1 week)
  Identify duplicates (most-common skill is "weekly summary")
  Pick the best version OR merge features into a parametrized version
  Result: 25-40 canonical skills

STEP 3: STANDARDIZE FORMAT (3-5 days)
  Apply the standard header to each
  Add owner / last_reviewed
  Add description + when_to_use

STEP 4: TEST (1 week)
  Each canonical skill tested by 2+ engineers
  Edge cases verified
  Performance measured

STEP 5: PUBLISH
  Create org-ai-skills repo
  Move standardized skills into categorized directories
  README at top + category READMEs

STEP 6: PROMOTE (ongoing)
  "Use ~/.claude/skills/org-skills" in onboarding
  Slack post: "skill of the week"
  Mention in eng-all-hands

STEP 7: SUNSET PERSONAL DUPLICATES (over 1-2 months)
  Engineers replace personal copies with symlinks
  Personal skills directory shrinks to just personal-specific
```

A 60-person org migration takes ~6 weeks total. The payoff: each engineer saves ~30 min/week thereafter.

### Cross-team skill borrowing

```
SCENARIO: payment team has a great cost-anomaly investigation skill
          data team wants to use it
          
CLEAN approach:
  1. Payment team's skill is parametrized (team=, env=)
  2. Data team forks + customizes for their context
     OR
     Payment team accepts a PR adding data-team-aware logic
  3. Either way: knowledge spreads
  
PROMOTION to org-wide:
  Skill used by 3+ teams → candidate for org-ai-skills
  Owner moves to platform or finops team
  Per-team customization via parameters
```

The path: personal → team → org. Skills earn promotion through usage.

### Backing up skills

```
SHARED skills (in git): backed up automatically
PERSONAL skills (~/.claude/skills/): manual backup risk
  Consider:
    Sync to GitHub Gist
    Sync to company-managed cloud (Dropbox / iCloud)
    Periodic copy to org-skills-staging for review
    
LOSING all skills sets an engineer back 2-3 weeks.
The library is high-value; treat it like code.
```

### Onboarding new engineers — the skills welcome

```
GOOD ONBOARDING includes:
  Day 1:  Symlink org-ai-skills repo
  Day 2:  Walk through "first 5 skills to try"
            /weekly-cost-summary
            /idle-resource-check
            /open-recommendations
            /budget-status
            /team-cost-breakdown
  Week 1: New engineer runs each at least once
  Week 2: New engineer suggests an improvement to one skill
  Month 1: New engineer contributes a new skill via PR
  
This pattern: from consumer → contributor in a month.
```

The skill library becomes part of the team's institutional knowledge — and onboarding is how that knowledge transfers.

---

## 2. Demo

A 60-engineer org adopts shared skills:

```
WEEK 1 — AUDIT:
  Survey: collect ~/.claude/skills/ from 60 engineers
  Result: 142 skills total
          12 unique categories
          5 highly duplicated ("weekly summary" appears 22 times)
  
WEEK 2 — DEDUPE + STANDARDIZE:
  Create org-ai-skills repo
  Migrate top 30 skills (highest-quality + most-used)
  Apply standard header
  Categorize: finops/ devops/ general/ team-specific/
  
WEEK 3 — TEST + PUBLISH:
  Each skill tested by 2 engineers
  README at top of repo + category READMEs
  Skill catalog page in wiki
  
WEEK 4 — PROMOTE:
  Announce to org: "install + use"
  Onboard: 12 engineers symlink the repo
  Office hours: drop-in for help
  
WEEK 6 — ADOPTION CHECK:
  28 of 40 engineers actively using shared skills
  4 PRs to add new skills (good signal)
  Feedback: positive; common ask is "more examples"
  
MONTH 2 — CLEANUP:
  Old personal duplicates removed via promote+sunset
  Skills directory: 35 high-quality, maintained
  Time savings measured: ~30 min/engineer/week
  Estimated org value: 30 engineers × 30 min × 50 weeks
                       = 750 hours/year (~$75K at $100/hr)
```

The migration cost: ~6 weeks of part-time effort. The payback: $75K/year, indefinitely.

---

## 3. Hands-on (5 min)

Audit your team's sharing posture:

```
□ DOES YOUR TEAM HAVE A SHARED skills location?
  □ Yes — where? __________
  □ No — what's blocking? __________

□ HOW MANY PERSONAL skills do you have?
  Count: _____
  Estimate duplicates across team: _____

□ WHICH OF YOUR SKILLS ARE GOOD CANDIDATES TO SHARE?
  Skill 1: __________
  Skill 2: __________
  Skill 3: __________

□ FIRST MIGRATION STEP:
  □ Propose a team-skills repo (sketch the structure)
  □ Move 1 skill to .claude/skills/ in a relevant repo
  □ Discuss org-wide skills repo in next eng all-hands

□ DISCOVERY:
  □ Do you have a README listing skills? _____
  □ Is there a "skill of the week" rhythm? _____
```

If your team has 0 shared skills today, set a 4-week target: 5 shared skills in `.claude/skills/`, in repo, with quality gate.

---

## 4. Knowledge check

### Q1
Project-scoped vs org-wide sharing:

A. Same thing
B. Project-scoped = `.claude/skills/` in the repo for that codebase, auto-loaded when working there. Org-wide = central repo, symlinked, available everywhere. Project for repo-specific work; org-wide for cross-team capability.
C. Random
D. Equivalent

<details>
<summary>Show answer</summary>

**Correct: B.** Different scopes; different signal-to-noise.
</details>

### Q2
Quality gate for a shared skill:

A. None
B. PR review by 2+ engineers, tested with realistic input, edge cases verified, owner specified, description matches behavior. Treat skills like internal libraries.
C. Random
D. Auto-merge

<details>
<summary>Show answer</summary>

**Correct: B.** Review + test. The review pays back in trust.
</details>

### Q3
Worst sharing anti-pattern:

A. Project-scoping skills
B. Every engineer writes their own version of the same skill — leads to duplication, drift, inconsistent outputs across the team. Canonicalize via PR-based contribution.
C. Random
D. Encouraged

<details>
<summary>Show answer</summary>

**Correct: B.** Avoid silos. One canonical skill; others contribute.
</details>

---

## 5. Apply

Move shared skills to a single repo (team-scoped first, then org-wide). Apply the standard header. Quarterly review for currency.

For new engineers: symlink the org-ai-skills repo on day 1. The library is part of the role's tool belt.

---

## Related lessons

- [L1 — Why team-specific prompts beat general ones](L1_why_team_specific.md)
- [L2 — Building reusable prompts (skills)](L2_reusable_prompts.md)
- [L4 — Versioning and maintaining skills](L4_versioning.md) *(next)*
- [M6.4 — Recipe library (generic templates)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Skill sharing](../../../reference/glossary/skill-sharing.md) · [org-ai-skills repo](../../../reference/glossary/org-ai-skills-repo.md) · [Skill discovery](../../../reference/glossary/skill-discovery.md) · [Skill quality gate](../../../reference/glossary/skill-quality-gate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.5.L3
