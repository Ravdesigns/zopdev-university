# Where agents win for cloud cost

§ T6 · M6.1 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** the four cost workflows where AI agents add genuine value, **recognize** the workflows where the UI or platform models are faster, **and avoid** the "use the agent for everything" failure mode.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Spend agent time on the work where it actually wins; use the UI where it actually wins." |
| **Personas** | Platform Engineer · FinOps Analyst · Engineering Leader |
| **Prerequisites** | M6.1.L1 · M6.1.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Remember), Recognize (Analyze), Avoid (Evaluate) |

---

## 1. Concept

Not every cost task benefits from an agent. The honest answer is that agents win in narrow, specific places. Knowing those places (and where agents don't help) keeps the tool useful instead of cargo-culted.

```
WHERE AGENTS WIN:
  Multi-step research questions across data sources
  Cross-referencing audit + cost + recommendation data
  Drafting written artifacts (memos, tickets, postmortems)
  Natural-language exploration of unfamiliar data
  Repeated tasks where prompts can be saved as recipes

WHERE AGENTS DO NOT WIN:
  Already-automated workflows (schedules, anomaly detection)
  Dashboard browsing (UI is visually faster)
  Hard math / forecasting (use platform models)
  High-stakes decisions (human judgment required)
  Bulk operations (UI bulk actions are faster)
```

### Winning use case 1 — cross-surface research

```
QUESTION: "Why is team-platform spend up 30% this month?"

WITHOUT AGENT (manual):
  Open ZopNight cost dashboard
  Filter to team-platform
  Toggle current vs last month
  Drill into top growing resources
  Cross-reference with recommendations (anything not applied?)
  Cross-reference with audit log (any schedule changes?)
  15 minutes of clicking through different surfaces

WITH AGENT (MCP-connected):
  Engineer: "Why is team-platform up 30% this month?"
  Agent: chains four MCP calls:
    1. get_costs(team=platform, period=current_month, last_month)
    2. list_resources(team=platform, sort=growth_rate, top=5)
    3. list_recommendations(team=platform, status=open)
    4. list_audit_logs(team=platform, filter=schedule_changes, 7d)
  Synthesizes: "EC2 grew $4,200 driven by 3 new prod-payments
                instances launched 2026-05-03 by jane@platform.
                No schedule changes. No open recs would have
                prevented it. Investigating with @jane."
  
  90 seconds end-to-end.
```

Cross-surface research is where the agent shines — chaining multiple data sources and synthesizing into a single answer.

### Winning use case 2 — drafting incident comms

```
INCIDENT: cost anomaly fired at 14:00 today
ENGINEER needs to write comms for 3 audiences (internal eng,
finance, leadership)

WITHOUT AGENT:
  Engineer writes 3 messages from scratch
  Each requires switching context + tone
  30-45 minutes for the three

WITH AGENT:
  Engineer: "Draft incident comms for the cost spike at 14:00.
            Three audiences: internal eng (technical), finance
            (impact-focused), leadership (high-level summary)."
  Agent: pulls anomaly details from MCP, drafts 3 messages with
         appropriate tone and detail level for each audience
  Engineer reviews, edits, sends
  10 minutes total
```

Drafting is where LLMs are strongest. Cost data + context = useful draft. The engineer's edit is faster than writing from scratch.

### Winning use case 3 — postmortem skeleton

```
AFTER a cost incident:
  Agent generates the postmortem skeleton:
    Timeline from audit logs
    Resources affected from resource summary
    Cost impact from anomaly delta
    Suggested action items based on root cause pattern
  Engineer fills in the analysis and validates
  
  TIME SAVED: 1 hour of formatting + assembly
  Engineer focuses on judgment (lessons, action items)
  not data collection
```

The postmortem itself stays human; the data assembly happens automatically.

### Winning use case 4 — new engineer onboarding

```
NEW engineer joins the team. Doesn't know:
  Which clusters are owned by which team
  What the normal cost baseline is
  What recent incidents looked like
  Where the schedules live and what they do
  Who to ask about specific resources

Without agent:
  Senior engineers field "where do I find X?" questions for weeks

With agent:
  New engineer asks agent any of those questions
  Agent answers from MCP data
  Cuts senior-engineer interrupt time by 80%+
  New engineer ramps faster
```

Onboarding queries are agent-friendly because they're factual, multi-source, and the new engineer doesn't know which UI page to visit.

### Where agents lose

```
DASHBOARD BROWSING:
  A human flicking through a chart is faster than asking the agent.
  Visual pattern recognition beats text description of trends.
  When the data fits on one chart, look at the chart.

REPEATED ATOMIC ACTIONS:
  Killing 100 idle resources is a bulk action in ZopNight UI.
  Agent + human-in-the-loop = slower than the bulk feature.

HARD MATH:
  Forecasting, anomaly statistics, budget projection — use the
  platform's models. Don't ask the LLM to do arithmetic; it will
  approximate and sometimes be wrong.

HIGH-STAKES DECISIONS:
  Should we sign a $1M reservation? Agent can summarize the data.
  Decision is human.

REAL-TIME OPS:
  During an active incident, the dashboard + on-call runbook are
  faster than chatting with an agent.

ANYTHING THE UI DOES IN ONE CLICK:
  If the dashboard has the answer in one click, click the dashboard.
  Don't make the agent earn its keep on trivial work.
```

### When agents help most — the profile

```
AGENT-FRIENDLY PROFILE:
  Multi-step
  Multi-source
  Written output
  Non-trivial synthesis
  Repeated (worth a recipe)
  
EXAMPLES of work matching this profile:
  Weekly cost review prep
  Incident postmortem
  Quarterly trend summary for leadership
  New-engineer onboarding answers
  "How does team A spend differ from team B?"
  Drafting a chargeback explanation
  Pre-meeting briefing memo
```

These are the agentic wins. The UI is faster for everything else.

### Anti-patterns

```
ANTI-PATTERN                              WHY IT FAILS
──────────────────────────────────────────────────────────────────
Asking the agent for a single number       Open the dashboard;
                                          it's one click
                                          
Asking the agent to do arithmetic           LLMs approximate; use
                                          platform forecasting
                                          
Asking the agent before reading the         Often the answer is in
incident runbook                            the runbook; faster to
                                          read it
                                          
Treating the agent as the primary           UI is faster for known
interface (over the UI)                     workflows; agent for
                                          novel queries
                                          
"Let me ask the agent" as default           Often "let me look at
                                          the dashboard" is faster
                                          
Forwarding agent output without              Verify; agents can
verification                                hallucinate (especially
                                          numbers)
```

### How ZopNight evaluates agent value

ZopNight's internal team logs every recipe / prompt used by FinOps. The data:

```
TOP-USE RECIPES (most invoked):
  Weekly cost summary by team:          22% of recipe usage
  Anomaly drill-down                     17%
  Postmortem skeleton                    13%
  Onboarding queries                      9%
  Recommendation review                   7%
  Other                                  32%
  
The top-five cover ~70% of agent usage. These are the canonical
agent-winning workflows.
```

The recipe library (M6.4) captures the proven patterns.

---

## 2. Demo

A team's weekly cost summary, agent-driven:

```
ENGINEER OPENS Cursor with MCP connected:

Engineer: /weekly_cost_summary "team-platform"

Agent (chains five MCP calls):
  1. get_costs(team=platform, last_7_days)
  2. get_cost_trends(team=platform, compare=prior_7_days)
  3. get_recommendation_summary(team=platform)
  4. list_audit_logs(team=platform, filter=material_changes)
  5. list_resources(team=platform, sort=growth_rate, top=5)

Agent synthesizes (output to clipboard):

  "Weekly cost summary — team-platform (week of 2026-05-15):
  
  TOTAL: $12,400 this week, -3% WoW
  
  Top changes:
    EC2: +$200 (new instances for feature launch)
    EBS: -$340 (cleanup from last Friday)
    RDS: stable
  
  Recommendations:
    2 open totaling $480/mo unrealized savings
    Most impactful: right-size i-0abc → $300/mo
  
  Material changes (audit):
    1 schedule disabled 2 days ago by @bob (review)
    
  Top 5 growing resources:
    [list with dollar deltas]
    
  Action items for the week:
    Review @bob's schedule change
    Apply right-sizing on i-0abc"

Engineer pastes into team's weekly thread on Slack.

ELAPSED: 30 seconds of engineer time
```

What used to take 30-45 minutes of dashboard navigation + manual writing is now 30 seconds + agent execution.

---

## 3. Hands-on (5 min)

List your 3 most recurring cost-related questions or tasks:

```
TASK 1: __________
  Multi-source? __________
  Written output? __________
  Repeated? __________
  AGENT FIT: yes / no
  WHY: __________

TASK 2: __________
  Multi-source? __________
  Written output? __________
  Repeated? __________
  AGENT FIT: yes / no
  WHY: __________

TASK 3: __________
  Multi-source? __________
  Written output? __________
  Repeated? __________
  AGENT FIT: yes / no
  WHY: __________

For agent-fit tasks: convert to a recipe (M6.4 has templates).
For UI-fit tasks: bookmark the dashboard view.
```

Honest assessment: half the time the UI is faster. That's fine — apply the agent where it wins.

---

## 4. Knowledge check

### Q1
Best agent use case for cloud cost:

A. Killing 100 idle resources
B. Multi-step research synthesizing across data sources (cost + audit + recommendations) and writing a structured answer. The agent's strength is chaining multiple sources and synthesizing; bulk operations belong in the UI.
C. Replacing dashboards entirely
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Synthesis is where LLMs shine. UI for bulk; agent for multi-source research.
</details>

### Q2
Bad agent use case:

A. Drafting an incident postmortem
B. Looking at a single chart for a quick number. UI / visual pattern recognition beats agent description for visual data. When the answer is one click in the dashboard, click the dashboard.
C. Cross-surface research
D. New-engineer onboarding questions

<details>
<summary>Show answer</summary>

**Correct: B.** Use the UI for visual. Don't make the agent earn its keep on trivial work.
</details>

### Q3
For hard math (forecasting, anomaly statistics):

A. Ask the agent
B. Use the platform's models. Don't ask LLMs to do arithmetic on their own — they approximate and can be wrong. ZopNight's forecasting / anomaly detection / unit economics use deterministic models; route math through them.
C. Random
D. Ignore math; use intuition

<details>
<summary>Show answer</summary>

**Correct: B.** Math goes to models, not LLMs. The agent presents the math; doesn't compute it.
</details>

---

## 5. Apply

Build an honest list of where agents help vs hurt for your workflows. Use the recipe library (M6.4) for proven patterns. Don't apply the agent to single-number queries; let the UI win where it wins.

---

## Related lessons

- [L1 — What MCP is](L1_what_is_mcp.md)
- [L2 — Read-only contract](L2_read_only.md)
- [L4 — Why 2026 is the year](L4_2026_differentiator.md) *(next)*
- [M6.4 — Recipe library (proven patterns)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Agent-friendly workflow](../../../reference/glossary/agent-friendly-workflow.md) · [Multi-source synthesis](../../../reference/glossary/multi-source-synthesis.md) · [Recipe](../../../reference/glossary/recipe.md) · [Drafting vs executing](../../../reference/glossary/drafting-vs-executing.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.1.L3
