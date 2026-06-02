# Why team-specific prompts beat general ones

§ T6 · M6.5 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **argue** for team-specific prompts over general ones, **design** a prompt with the five required components (scope, exclusions, time window, output format, context), **and recognize** when a prompt is genuinely team-specific vs accidentally generic.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Build prompts that encode our team's context so we don't re-explain it every conversation." |
| **Personas** | Platform Engineer · FinOps Analyst · Engineering Leader |
| **Prerequisites** | M6.1 · M6.2 · M6.3 |
| **Time** | 9 minutes |
| **Bloom verb** | Argue (Evaluate), Design (Create), Recognize (Analyze) |

---

## 1. Concept

A general prompt: "show me my cost." A team-specific prompt: "show me payment-team's variable cost this week vs same week last month, exclude the ml-training resources (they're billed separately under the data team), highlight any resource with >20% deviation."

The team-specific prompt encodes the team's **context, exclusions, conventions, and recurring questions**. It eliminates the back-and-forth and produces a useful answer on the first try.

```
GENERAL PROMPT                       TEAM-SPECIFIC PROMPT
──────────────────────────────────────────────────────────────────
"show cost"                           "payment-team's variable cost
                                       this week vs same week last
                                       month"
                                       
Returns: org-wide cost                Returns: payment-team's number
                                       (pre-filtered to relevance)
                                       
Generic, requires manual filtering    Pre-filtered to relevance
                                       
Slow for the asker                    Fast — direct to answer
                                       
Needs follow-up questions             Answers in one shot
```

### Why team-specific wins

The agent doesn't know your team's context by default. Every general prompt requires the agent to ask back ("which team? which metric? which time window?") OR to guess (often wrong). Team-specific prompts skip the negotiation.

### Five components of a team-specific prompt

```
1. SCOPE
   Which resources / accounts / tags apply
   Example: "team=payment-team, accounts=prod-us, prod-eu"
   
2. EXCLUSIONS
   Known things to exclude
   Example: "exclude ml-training-* resources (billed to data team)"
   
3. TIME WINDOW
   Specific period, not vague
   Example: "last 7 days vs same 7 days previous month"
   
4. OUTPUT FORMAT
   What the team wants to see (table, JSON, narrative)
   Example: "table with columns: resource_id, name, this_week,
            last_week, delta_pct, with a total row"
            
5. CONTEXT
   What makes this team's view different
   Example: "Highlight resources where delta_pct > 20%
            (significant for this team's volatility)"
```

A prompt with all five is team-specific. Missing any one drops back toward generic.

### Example — fully formed team prompt

```
PAYMENT-TEAM'S WEEKLY COST REVIEW PROMPT (saved as a skill):

"Show me the payment-team's variable cost for the last 7 days,
excluding ml-training-* tagged resources (those are billed
separately under the data team).
Compare to the same 7-day period last week.
Highlight any resources with >20% deviation.
Format: table with columns: resource_id, name, this_week,
last_week, delta_pct.
Include a row at the bottom for the team total.
Use this for our Friday cost review."

When invoked: agent returns the formatted table immediately.
Team's weekly review starts here, not with "what should we look at?"
```

A skilled prompt encapsulates the team's unique perspective. Save it as a skill (M6.5.L2) so it's reusable.

### Team-specific vs generic — the test

```
GENERIC PROMPT TEST:
  Could a stranger use this prompt and get the right answer?
  → YES = generic
  
TEAM-SPECIFIC TEST:
  Does this prompt know our team's exclusions, conventions,
  preferred format?
  → YES = team-specific

Most useful prompts FAIL the generic test deliberately.
```

### Where team-specific prompts win

```
USE CASE                                  AGENT WORKLOAD WITHOUT
                                          TEAM PROMPT
──────────────────────────────────────────────────────────────────
Weekly cost review                        10 minutes back-and-forth
                                          (vs 30 seconds with prompt)
                                          
Anomaly investigation                      5 follow-up questions
                                          (vs immediate diagnosis)
                                          
Drafting a chargeback explanation         3 clarifications about
                                          allocation method
                                          (vs immediate draft)
                                          
Quarterly trend summary                    Negotiate scope each time
                                          (vs consistent format)
```

Team-specific prompts compound over months — the same workflow runs 50+ times a year; each runs in seconds with the prompt.

### Team-specific != customer-specific

```
GOOD team-specific (parametrized):
  "Show team={{team}}'s cost for last {{days}} days,
   excluding {{excluded_tags}}"
  → Reusable across teams; configurable

BAD team-specific (hardcoded customer data):
  "Show team-acme-payments' cost..."
  → Locked to one customer; not portable; embeds secrets

Parametrize. Don't hardcode.
```

### Anti-patterns

```
ANTI-PATTERN                              FIX
──────────────────────────────────────────────────────────────────
Too vague                                 Add scope + format
"show me cost stuff"                      "show payment-team cost
                                          last 7 days as table"
                                          
Too many options                          Pick one variant per skill
"could be table or chart or memo..."      "as a markdown table"
                                          
No exclusions                             Add known excludes
                                          (ml-training, etc.)
                                          
No success criteria                       Specify what "good" looks
                                          like (top 3 by impact)
                                          
Ambiguous time window                     "Last 7 days" or
"recently"                                "current quarter"
```

### Building the prompt library

Most teams accumulate 5-15 team-specific prompts over 3-6 months. Each addresses a recurring workflow:

```
TYPICAL team prompt library:
  /payment-team-weekly          Weekly cost summary
  /payment-team-monthly         Monthly trend memo
  /payment-team-budget-status   Budget vs actual snapshot
  /payment-team-recs            Open recommendations digest
  /payment-team-anomaly         Anomaly investigation
  /payment-team-postmortem      Postmortem skeleton with cost
  
8-12 prompts cover most of a team's recurring cost work.
```

### How ZopNight surfaces team-specific patterns

ZopNight's recipe library (M6.4) provides generic templates. Team-specific prompts are the customization layer — start from a recipe; add scope/exclusions/context; save as a team skill.

The path: ZopNight recipe → team customization → personal customization.

---

## 2. Demo

A weekly cost review, two ways:

```
APPROACH A — generic prompt (10-minute review):
  T+0      Engineer: "show me last week's cost"
  T+5s     Agent: shows org-wide numbers
  T+30s    Engineer: "just my team please"
  T+45s    Agent: shows team but no comparison
  T+60s    Engineer: "compare to last week"
  ... 10 minutes of negotiation later ...
  T+10min  Engineer has the answer

APPROACH B — team-specific prompt as a skill (30-second review):
  T+0      Engineer invokes /payment-team-weekly
  T+30s    Agent: returns pre-filtered formatted table
            (scope, exclusions, format all in the prompt)
  T+30s    Engineer reads, identifies 5 anomalies to follow up
  T+30s    Total time: 30 seconds

10 minutes vs 30 seconds. Team prompts are the leverage.

For a team running 50+ cost reviews per year, the savings compound:
  Without team prompts: ~10 hours/year per engineer
  With team prompts: ~30 minutes/year per engineer
```

---

## 3. Hands-on (5 min)

Identify 3 questions your team asks weekly:

```
QUESTION 1: __________
  Generic version: "__________"
  Team-specific version:
    SCOPE:        __________
    EXCLUSIONS:   __________
    TIME WINDOW:  __________
    OUTPUT:       __________
    CONTEXT:      __________

QUESTION 2: __________
  (same template)

QUESTION 3: __________
  (same template)

NEXT STEP:
  □ Save the most-recurring one as a skill (M6.5.L2)
  □ Share with the team (M6.5.L3)
  □ Schedule quarterly review (M6.5.L4)
```

A team that converts 3-5 recurring questions to team-specific prompts in the first month saves hours per week thereafter.

---

## 4. Knowledge check

### Q1
A general prompt vs team-specific:

A. Same outcome; just different wording
B. Team-specific encodes context, exclusions, and format. Eliminates 90%+ of the back-and-forth. The agent doesn't have to ask back "which team?" or "what format?" — those answers are in the prompt.
C. Random
D. Team-specific is slower

<details>
<summary>Show answer</summary>

**Correct: B.** Team-specific is leverage. The compound time savings are huge over a year.
</details>

### Q2
A good team prompt includes:

A. Just the query
B. Five components: scope, exclusions, time window, output format, context. Missing any one drops back toward generic. The full template produces consistent results.
C. Random
D. Just keywords

<details>
<summary>Show answer</summary>

**Correct: B.** Five components. The template is the discipline.
</details>

### Q3
Team-specific prompts vs dashboards:

A. Prompts replace dashboards
B. Complementary surfaces. Dashboards for visual exploration; prompts for fast repeatable queries with team context. Use dashboards when you want to look at the data; use prompts when you want a structured answer about it.
C. Equivalent
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Complementary surfaces. Different strengths.
</details>

---

## 5. Apply

Save prompts as Claude Code skills, Cursor commands, or markdown files in your team's wiki. M6.5.L2 covers the skill format; M6.5.L3 covers sharing patterns.

For your team: identify 3 recurring questions; convert them to team-specific prompts; save as skills. The 60-minute investment pays back within a week.

---

## Related lessons

- [L2 — Building reusable prompts (skills)](L2_reusable_prompts.md) *(next)*
- [L3 — Sharing skills across the team](L3_sharing.md)
- [L4 — Versioning and maintaining skills](L4_versioning.md)
- [M6.4 — Recipe library (generic templates to customize)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Team-specific prompt](../../../reference/glossary/team-specific-prompt.md) · [Skill (Claude Code)](../../../reference/glossary/skill.md) · [Prompt scope](../../../reference/glossary/prompt-scope.md) · [Five components](../../../reference/glossary/five-components-prompt.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.5.L1
