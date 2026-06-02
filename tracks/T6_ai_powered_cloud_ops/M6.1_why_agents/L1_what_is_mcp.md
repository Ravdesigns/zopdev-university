# What MCP is in one page

§ T6 · M6.1 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **explain** what MCP (Model Context Protocol) is without jargon, **identify** the 43 read-only tools ZopNight exposes, **and reason** about why a read-only architecture is the right tradeoff for cloud cost.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand MCP well enough to set up a useful workflow without misunderstanding what it can and cannot do." |
| **Personas** | Platform Engineer · FinOps Analyst · Engineering Leader |
| **Prerequisites** | T0 (foundations) · T1 (ZopNight surface awareness) |
| **Time** | 9 minutes |
| **Bloom verb** | Explain (Understand), Identify (Remember), Reason (Analyze) |

---

## 1. Concept

MCP — Model Context Protocol — is an open protocol that connects AI assistants (Claude Desktop, Cursor, Codex, Claude Code) to data sources and tools. It lets an AI agent call functions on a service after authentication, returning structured results the AI can reason about. Anthropic published MCP as an open spec in late 2024; ZopNight implements it as a read-only data adapter.

```
WITHOUT MCP:
  Engineer asks Claude: "What's our biggest idle resource?"
  Claude: "I don't have access to your cloud data."
  Engineer: pastes data manually into the conversation
  (slow, error-prone, doesn't scale, no chain calls)

WITH MCP:
  Engineer asks Claude: "What's our biggest idle resource?"
  Claude (via MCP): calls list_idle_resources on ZopNight
  Claude: "i-0xyz123 has been stopped for 47 days, costs $69/month
  in attached EBS volumes alone."
  
The agent has read-only access to ZopNight via the MCP server.
The engineer never leaves the conversation.
```

### Why this matters in 2026

Before MCP, AI assistants were limited to what the engineer could paste. With MCP, the agent's knowledge boundary shifts — it can query real systems, get current data, and answer with specifics rather than generalities. For cloud cost in particular, this changes the workflow: engineers ask their AI assistant questions about real infrastructure rather than navigating the dashboard.

### What ZopNight's MCP server exposes

The MCP server provides 43 read-only tools organized into 9 categories:

```
TOOL CATEGORY                          TOOL COUNT
─────────────────────────────────────────────────────
Resources (list, inspect, costs)        8 tools
Schedules (list, history, audit)        6 tools
Costs / billing (current, historical)   9 tools
Recommendations (list, summary)         5 tools
Teams / showback (by team, by tag)      4 tools
Budgets (status, variance)              3 tools
Audit logs (filter, export)             3 tools
Cloud accounts (list, status)           3 tools
Notifications (channels, history)       2 tools
─────────────────────────────────────────────────────
TOTAL: 43 read-only tools
```

The full list is documented at [docs.zopnight.com/mcp](https://docs.zopnight.com/mcp). New tools land per release; the read-only constraint is permanent.

### The contract

ZopNight's MCP server is **read-only**. No mutations are possible through MCP. Any attempted write returns "operation not permitted." This is hardcoded into the protocol implementation — it is NOT a permission setting that customers can flip.

This is the single most important MCP design decision (covered fully in M6.6).

### Why MCP matters (the engineering case)

Two practical reasons MCP changes the workflow:

```
1. NATURAL LANGUAGE INTERFACE
   Engineers ask questions in their IDE, chat, or CLI without
   switching contexts. The AI assistant becomes a query layer over
   ZopNight. "Show me the biggest cost growth this week" is faster
   than navigating to Reports → Cost Trend → filter.

2. AGENT COMPOSITION (chain calls)
   Agent chains MCP calls with other tools:
     "Find the top idle EC2 instance.
      Look up the owner from the tag.
      Draft a Slack message asking them about it."
   
   Three calls, three different systems, one conversation.
   The MCP server gives the agent the data; agent chains it
   with Slack, source-control, ticketing systems.
```

### Architecture

```
Claude Desktop / Cursor / Codex / Claude Code
    ↓ (MCP protocol — JSON-RPC over stdio or HTTP/SSE)
ZopNight MCP server (process running locally or hosted)
    ↓ (PAT-authenticated, gRPC)
ZopNight backend (Config, Discoverer, Aggregator, Recommender, Executor)
```

The MCP server is a stateless proxy. PAT-authenticated. Routes calls to the right backend service. No customer data is stored on the MCP server itself — every call retrieves fresh data from the backend.

### Where MCP runs (local vs hosted)

```
LOCAL (default):
  The MCP server runs as a process on the engineer's machine
  Started by their AI tool (Claude Desktop, Cursor, etc.)
  PAT is read from local environment variable
  Tool calls happen over local stdio
  
HOSTED (enterprise):
  ZopNight runs the MCP server on its infrastructure
  AI tool connects over HTTPS + SSE
  PAT authentication via OAuth handshake
  Customer's AI tool can call the hosted server from anywhere
  (still subject to the org's MCP toggle in M6.3)
```

Most customers use the local mode. Hosted is available for enterprise teams that need centralized control.

### MCP vs API

```
RAW ZOPNIGHT API:                       MCP:
  Direct REST/gRPC calls                  Through AI assistant
  Engineer writes code                    Engineer asks in natural language
  Used by: integrations, custom tools     Used by: agent workflows
  Read + write                            Read-only (deliberate)
  
Both are available. MCP is the agent-friendly path; API is the
programmer-friendly path. They share the same underlying data.
```

### How ZopNight uses MCP internally

ZopNight engineers use MCP to query their own ZopNight installations during product development. The dogfooding matters — the team uses MCP daily, which catches usability issues fast and ensures the tool surface is curated for real workflows.

---

## 2. Demo

A typical engineer's session with MCP connected:

```
ENGINEER IN CURSOR (MCP connected to ZopNight):

  Engineer: "What's our biggest idle resource right now?"
  Cursor (via MCP):
    Calls list_idle_resources, sort by cost
    Returns: 12 idle EC2 instances
  Response: "i-0xyz123 (m5.2xlarge, stopped 47 days, $69/mo) is
            the biggest single idle resource. Combined idle: $810/mo."

  Engineer: "Get the top 10 recommendations by savings."
  Cursor (via MCP):
    Calls get_top_recommendations(limit=10, sort=savings)
    Returns: 10 recommendations
  Response: "Top 10 by potential savings:
            1. Right-size i-0abc → $1,200/mo
            2. Terminate i-0def (idle 60d) → $480/mo
            ... (full list)
            Total potential: $4,800/mo"

  Engineer: "Describe the business-hours-eu schedule."
  Cursor (via MCP):
    Calls describe_schedule("business-hours-eu")
    Returns: cron config, attached resources, recent firings
  Response: "business-hours-eu fires 8AM and 8PM Mon-Fri Europe/London.
            Attached to 14 resources in the eu-west-1 region.
            Last 5 firings all succeeded. No overrides active."

  Engineer: "Show me overrides created in the last week."
  Cursor (via MCP):
    Calls list_audit_logs(filter={action: "override_create",
                                  time: "7d ago"})
    Returns: 3 override creations
  Response: "3 overrides created in the past week:
            1. jane@platform on 2026-05-15 (24h override on dev-eks)
            2. bob@product on 2026-05-17 (override on staging-rds)
            3. alice@data on 2026-05-19 (until-cancel on ml-cluster)
            
            One of these (alice's) is still active — worth a check."

The engineer never opens the ZopNight UI. The AI assistant is
the working surface; ZopNight is the data layer.
```

---

## 3. Hands-on (5 min)

Identify which AI tool your team uses:

```
YOUR AI TOOL:
  □ Claude Desktop
  □ Cursor
  □ Codex (GitHub Copilot, OpenAI Codex CLI)
  □ Claude Code
  □ None of the above
  □ Multiple

WHO USES IT:
  □ All engineers
  □ Some engineers (~__%)
  □ FinOps team specifically
  □ Pilot phase

MCP READINESS:
  Does your AI tool support MCP?    Yes / No / Unsure
  Is MCP enabled at the user level?  Yes / No / Unsure

PLAN to connect:
  □ Set up MCP for one engineer as pilot
  □ Enable org-wide (covered in M6.3)
  □ Defer until later (acceptable; not all teams need this yet)
```

If your team doesn't use any AI tool with MCP support, this track is still relevant background — but the practical setup waits until you adopt one.

---

## 4. Knowledge check

### Q1
MCP enables AI agents to:

A. Modify cloud resources (start/stop, scale, delete)
B. Read-only access to ZopNight data via 43 tools across 9 categories. Mutations are not allowed — the contract is hardcoded into the protocol implementation, not a permission setting. The AI can answer questions and draft mutations; humans execute via the ZopNight UI.
C. Replace dashboards
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Read-only access via 43 tools. The mutation prohibition is intentional architecture.
</details>

### Q2
A natural-language query about cost savings from an engineer:

A. Must reference the dashboard
B. The agent calls MCP tools (list_idle_resources, get_top_recommendations) and answers in natural language with specifics. No manual data copying; no dashboard navigation. The AI assistant becomes the query layer over ZopNight.
C. Requires manual paste from the UI
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Agent + MCP eliminates manual paste. The dashboard remains available; MCP just routes around it for query-style workflows.
</details>

### Q3
ZopNight's MCP server is:

A. Configurable to read-write
B. Read-only — hardcoded, not configurable per customer. The constraint is an architectural choice for safety: agents can hallucinate, so removing the ability to mutate eliminates the worst failure modes. Engineers can chain MCP reads with other tools (Slack, source control) for richer workflows.
C. Random
D. Customizable per-tier

<details>
<summary>Show answer</summary>

**Correct: B.** Read-only by design. The safety property is the foundation; M6.6 covers the architectural decision in depth.
</details>

---

## 5. Apply

Read the MCP server's full tool documentation at [docs.zopnight.com/mcp](https://docs.zopnight.com/mcp). Set up the server in your preferred AI tool (M6.2 covers each tool). Authenticate with a PAT (M6.3 covers PAT management).

For the most common workflows, see the recipe library in M6.4 — 15 production-ready prompts for cloud cost workflows.

---

## Related lessons

- [L2 — Read-only by design](L2_read_only.md) *(next)*
- [L3 — Where AI agents win](L3_where_agents_win.md)
- [L4 — Why 2026 is the year for agent-aware cost](L4_2026_differentiator.md)
- [M6.2 — Setup per AI tool](../M6.2_setup/00_README.md)
- [M6.4 — Recipe library](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[MCP](../../../reference/glossary/mcp.md) · [Model Context Protocol](../../../reference/glossary/model-context-protocol.md) · [PAT](../../../reference/glossary/pat.md) · [Tool call](../../../reference/glossary/tool-call.md) · [Read-only contract](../../../reference/glossary/read-only-contract.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.1.L1
