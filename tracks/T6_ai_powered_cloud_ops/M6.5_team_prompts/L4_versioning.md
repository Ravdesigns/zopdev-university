# Versioning and maintaining skills

§ T6 · M6.5 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **version** a shared skill with metadata + changelog, **run** a quarterly skill review, **and execute** a graceful deprecation when a skill becomes obsolete.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Maintain shared skills over time without drift or rot, so they keep producing correct answers." |
| **Personas** | Platform Engineer · FinOps Lead · Engineering Manager |
| **Prerequisites** | M6.5.L1 · M6.5.L2 · M6.5.L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Version (Apply), Run (Apply), Execute (Apply) |

---

## 1. Concept

Skills are code. Code bit-rots. MCP tools change, team needs evolve, LLM behavior shifts. Without maintenance, skills produce wrong answers — which is worse than no answer because users trust the skill and act on the output.

```
DRIFT SOURCES                            EXAMPLE
─────────────────────────────────────────────────────────────────
MCP tool renamed / deprecated            list_idle → list_resources(...)
Output format changed                     New fields in response break parsing
Team's question evolved                   Now wants 14-day window, not 7
Required tags changed                     Now requires owner-team tag
Cost model changed                        New billing logic for spot
LLM behavior changed                      Sub-version returns different style
```

Treat skills like internal libraries: versioned, owned, reviewed.

### Versioning strategy

Every shared skill has version metadata in the frontmatter:

```markdown
---
description: Payment team weekly cost review
version: 2.3
last_reviewed: 2026-05-21
maintainer: jane@platform
changelog:
  - "v2.3 (2026-05-21): add audit log check (RC-001 compliance)"
  - "v2.2 (2026-04-15): include savings recovery section"
  - "v2.1 (2026-03-30): fix output table column order"
  - "v2.0 (2026-03-01): parametrize team name (breaking change)"
  - "v1.0 (2026-01-15): initial release"
---
```

Semantic versioning works:
- **Major (v1 → v2):** breaking change (parameters changed, output format different). Notify consumers.
- **Minor (v2.1 → v2.2):** additive change (new section, new option).
- **Patch (v2.2 → v2.2.1):** bug fix; same contract.

### Quarterly review process

Every 90 days, sweep the skills repo for currency.

```
QUARTERLY REVIEW WORKFLOW:
  1. List all skills in the org-ai-skills repo
  2. Filter to skills with last_reviewed > 90 days
  3. For each:
     a. Run it with sample parameters
     b. Verify output matches description
     c. If broken: fix; bump version; update changelog
     d. If fine: update last_reviewed date
     e. If unused (no invocations in 60+ days): mark deprecated
  4. Commit changes
  5. Notify team of significant updates
  
OWNERSHIP:
  Each skill has ONE owner (in maintainer field)
  Owner runs the review for their skills
  Or rotates to a quarterly skill-review duty
  Or central FinOps team owns all org-wide skills

TIME BUDGET:
  ~5 minutes per skill (run + verify + update)
  40-skill repo: ~3.5 hours per quarter
```

The review is the rhythm that keeps the library trustworthy.

### Spot-check after MCP changes

When ZopNight ships an MCP update (new tool, deprecated tool, schema change), do a targeted review:

```
MCP CHANGELOG triggers:
  ZopNight publishes MCP release notes
  Engineer subscribed to changelog
  
ACTIONS:
  1. Identify changed/deprecated tools
  2. Grep skills for references to those tools
     $ grep -r "list_idle_resources" .claude/skills/
  3. For each match: update to new tool name/signature
  4. Re-test affected skills
  5. Bump version + changelog
  6. Communicate via team channel

LOW friction (1-2 hours/quarter) + HIGH value (skills stay reliable).
```

### Deprecation — graceful

When a skill becomes obsolete (replaced by a better one, or workflow ended):

```
DEPRECATION PROCESS:

DAY 0: Mark as deprecated
  ---
  description: [DEPRECATED — use /new-skill-name] Old payment review
  version: 2.3
  deprecated: true
  deprecated_replacement: /payment-cost-weekly-v2
  deprecated_date: 2026-05-21
  removal_date: 2026-08-21
  ---
  
DAY 30: Reminder in team channel
DAY 60: Reminder in team channel
DAY 90: Remove skill from repo
  Keep changelog entry in git history
  
USER experience:
  Engineer runs deprecated skill → sees warning at top of output
    "This skill is deprecated. Use /new-skill-name instead.
     Removal: 2026-08-21."
  
This pattern reduces confusion. Sudden removals break trust.
```

### Ownership rules

```
EVERY shared skill has ONE owner:
  - Maintains the skill (updates as needed)
  - Reviews quarterly
  - Receives bug reports
  - Approves PRs to the skill
  - Decides deprecation

OWNER GOES STALE (left org, switched teams):
  Reassign in next quarterly review
  Or: mark deprecated; let it sunset
  
WITHOUT owner: skill rots silently. Hard rule: no owner, mark for review.
```

A skill without an owner is a skill on countdown.

### Testing skills

```
MANUAL TEST (most common):
  $ claude
  > /skill-name --team=payment-team
  Confirm output matches expectation
  Try an edge case (empty result, error path)
  
SEMI-AUTOMATED:
  Run skill against a known-stable org
  Diff output vs a saved "golden" output
  Detects unexpected format changes
  
AUTOMATED (advanced; for orgs with 50+ skills):
  CI job runs all skills weekly
  Diffs output vs golden
  Pings owner if drift detected
  
  $ make test-skills
    Running 35 skills...
    34 passed, 1 drift detected:
      /payment-cost-weekly — output format changed
      Ping: jane@platform
```

Automated testing is the maturity end-state. Start with manual; graduate as the library grows.

### Output drift detection

Output drift is sneaky — the skill technically runs, but the output is subtly different.

```
SOURCES of output drift:
  - MCP tool returns new fields → table has extra columns
  - LLM model version updates → tone or formatting changes
  - Cost data legitimately changed (not a drift; legitimate)
  
DETECTION:
  Save a "golden" output as a test fixture
    Path: tests/skills/payment-cost-weekly.golden.md
  Run skill weekly; diff vs golden
  
LARGE DIFF:
  □ Real data change (legit) → update golden
  □ Format drift (rot) → fix skill
  □ MCP schema change → update skill
  
SMALL DIFF (typo, minor wording):
  Usually LLM nondeterminism; ignore or tighten prompt
```

### When to refactor a skill

```
SIGNS a skill needs refactoring:
  ✗ Long, complex, hard to follow (>100 lines of instructions)
  ✗ LLM frequently misinterprets steps
  ✗ Output inconsistent across runs
  ✗ Requires unusual prompt engineering tricks
  ✗ Maintainer can't explain it without re-reading
  
REFACTOR PATTERNS:
  ✓ Split into smaller skills (1 skill = 1 outcome)
  ✓ Simplify instructions (remove "please" and verbose prose)
  ✓ Make output format explicit ("Output as: ...")
  ✓ Add 1-2 examples in the skill body
  ✓ Reduce parameter count (3 is often plenty)
```

Refactoring a 10-step skill into 3 smaller skills usually doubles its reliability.

### Aging out unused skills

```
SKILL NOT INVOKED in 60+ days?
  
INVESTIGATE:
  Run usage report (org-ai-skills CI logs invocations)
  Check with the team: still needed?
  
DECIDE:
  □ Still needed (low frequency) → mark seasonal/quarterly
  □ Use case moved to another skill → mark deprecated
  □ Genuinely obsolete → mark deprecated → remove in 90 days

GOAL: skills directory has only living, used skills.
       Aging out keeps signal-to-noise high.
```

### Maintenance teams — by org size

```
SMALL ORG (5-20 engineers):
  Distributed ownership
  Each engineer owns 2-5 skills
  Quarterly skill-review meeting (1 hour)
  Total maintenance: ~2-3 hours/engineer/quarter

MEDIUM ORG (20-100 engineers):
  FinOps team owns finops/ skills
  Platform team owns devops/ skills
  Per-team teams own team-specific
  Central curation for org-wide
  Total maintenance: ~10-20 hours/quarter (across owners)

LARGE ORG (100+ engineers):
  Dedicated AI Skills Curator (part-time role)
  Owns the org-ai-skills repo + governance
  Reviews PRs, runs quarterly tests, runs CI
  ~0.25 FTE for 100-engineer org
  ~1 FTE for 500-engineer org

The scale: a curator pays back when the library hits 30-50 skills.
```

### Migration — major MCP version bump

When ZopNight ships MCP v2 with renamed tools:

```
SCENARIO: ZopNight MCP v2 announcement (60-day deprecation window)

MIGRATION STEPS:
  T+0:       v2 announcement; deprecation list published
  T+1 week:  Curator audits skills repo
             Grep for deprecated tool names
             Identify affected skills (e.g., 12 of 35)
  T+2 weeks: Curator updates affected skills
             Test each against v2
             Bump version; update changelog
  T+4 weeks: Push updated skills; communicate to team
  T+6 weeks: Verify no skill still calls v1 tools
  T+60 days: v1 tools removed; transition complete

EXAMPLE TOOL MIGRATION:
  v1: list_idle_resources()
  v2: list_resources(filters={"status": "idle"})
  
  Affected skills update:
    OLD: Call list_idle_resources
    NEW: Call list_resources with filters={"status": "idle"}
  
  Test; commit; bump skill version; document.
```

### Communicating changes — never silent

```
WHEN updating a popular skill:
  
TEST thoroughly before pushing
NOTE in changelog (with date + reason)
NOTIFY team via Slack / email
BUMP version per semver
  
IF BREAKING: bump major version + provide migration notes
              Consider keeping old version as -v1 suffix for transition
  
NEVER push breaking changes silently. Trust is lost in one bad update.
```

### Skill maturity model

Where does your skill library sit?

```
LEVEL 0: No skills (using ad-hoc prompts)
LEVEL 1: Personal skills (per engineer; not shared)
LEVEL 2: Project-scoped skills (.claude/skills/ in repos)
LEVEL 3: Team-scoped repos (per-team skill libraries)
LEVEL 4: Org-wide skill repo (single source of truth)
LEVEL 5: CI testing + automated drift detection
LEVEL 6: Dedicated curator role; quarterly review cadence

Most orgs land at Level 3-4 after 6-12 months.
Level 5-6 for orgs with 50+ active skills.
```

The maturity model is the roadmap. Move one level at a time.

---

## 2. Demo

A quarterly review by the FinOps curator:

```
FRIDAY of week 13, quarterly skill review:

T+0      Open org-ai-skills repo
         List skills with last_reviewed > 90 days ago
         Result: 12 stale skills (of 35 total)

T+15 min Run each:
         /weekly-cost-summary       ✓ Works; update last_reviewed
         /monthly-savings-report    ✓ Works; update last_reviewed
         /idle-resource-check       ✗ Broken: MCP tool renamed
         /multi-az-check            ✓ Works; update last_reviewed
         /budget-status             ✓ Works; update last_reviewed
         ... (continues for 12 skills)

T+1 hr   Fixes:
         /idle-resource-check:
           Updated list_idle_resources → list_resources(...)
           Bumped to v2.1
           Tested; works
           Updated changelog:
             "v2.1 (2026-05-21): migrate to list_resources for MCP v2"
         
         /quarterly-savings-recovery:
           Hasn't been invoked in 75 days
           Confirmed with team: workflow moved to /monthly-savings
           Marked deprecated; 90-day countdown; removal 2026-08-21

T+1.5 hr Commit + push:
         11 skills certified
         1 skill fixed
         1 skill deprecated
         All last_reviewed dates updated
         Changelog notes in PR description

T+1.75 hr Slack post to #finops-ai-skills:
         "Q2 skill review complete. 1 skill deprecated
          (replaced by /monthly-savings). 1 skill fixed for
          MCP v2 (list_idle_resources renamed). All others
          certified for next quarter. Next review: Aug 2026."

TOTAL: 2 hours per quarter. Library stays trustworthy.
```

This rhythm — quarterly review, clear ownership, transparent changelog — is what separates a living library from a graveyard.

---

## 3. Hands-on (5 min)

Audit your skill library's maintainability:

```
□ EVERY skill has a maintainer in frontmatter?
  Count without owner: _____
  
□ EVERY skill has last_reviewed date?
  Stale (>90 days): _____
  
□ EVERY skill has version + changelog?
  Missing versioning: _____

□ SCHEDULED quarterly review?
  Date: __________
  Owner: __________
  
□ DEPRECATED skills handled gracefully?
  Currently marked deprecated: _____
  Within 90-day countdown: _____

□ ACTIONS THIS QUARTER:
  □ Add maintainer to all skills missing one
  □ Run all skills >90 days old; refresh
  □ Mark obsolete skills deprecated
  □ Schedule next review
```

A 30-minute audit shows you exactly where the library is on the maturity model.

---

## 4. Knowledge check

### Q1
Skill maintenance cadence:

A. Never — they don't change
B. Quarterly review at minimum. Run each, verify output, update metadata. MCP changes trigger targeted reviews between quarters. Without maintenance, skills produce wrong answers — worse than no answer.
C. Random
D. Daily

<details>
<summary>Show answer</summary>

**Correct: B.** Quarterly + change-driven. Skills bit-rot like code.
</details>

### Q2
Deprecating a skill:

A. Delete immediately
B. Mark deprecated in frontmatter, point users to the replacement, 90-day countdown with warnings in output, then delete. Sudden removals break trust; graceful deprecation preserves it.
C. Random
D. Hide it

<details>
<summary>Show answer</summary>

**Correct: B.** Graceful deprecation. Trust is the asset.
</details>

### Q3
Ownership of a skill:

A. Anyone — collective ownership
B. ONE owner per skill (in `maintainer:` field). Maintains, reviews, approves PRs. Without a single owner, skills rot silently. If an owner leaves, reassign in next review or mark for deprecation.
C. Random
D. The team as a whole

<details>
<summary>Show answer</summary>

**Correct: B.** Single-owner rule. Distributed ownership = no ownership.
</details>

---

## 5. Apply

Quarterly skill review on the calendar. Version metadata + changelog in every shared skill. Single owner per skill. Graceful deprecation when retiring.

For the library: aim for Level 3-4 of the maturity model in 6 months; Level 5 when you cross 30+ active skills.

---

## Module quiz

Complete M6.5 → 10-question quiz unlocks the **Skill-Builder** chip.

---

## Related lessons

- [L1 — Why team-specific prompts beat general ones](L1_why_team_specific.md)
- [L2 — Building reusable prompts (skills)](L2_reusable_prompts.md)
- [L3 — Sharing skills across the team](L3_sharing.md)
- [M6.6 — Future: write capability](../M6.6_future_write/00_README.md)

## Glossary terms touched

[Skill versioning](../../../reference/glossary/skill-versioning.md) · [Skill changelog](../../../reference/glossary/skill-changelog.md) · [Skill deprecation](../../../reference/glossary/skill-deprecation.md) · [Skill maturity model](../../../reference/glossary/skill-maturity-model.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.5.L4
