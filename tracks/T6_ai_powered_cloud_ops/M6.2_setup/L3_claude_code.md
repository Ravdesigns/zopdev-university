# Connecting Claude Code (terminal)

§ T6 · M6.2 · L3 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **install** Claude Code, **connect** ZopNight MCP, **and combine** MCP with Claude Code's skills feature for reusable team workflows.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get cost data callable from the terminal for the engineers who live there." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M6.2.L1 · M6.2.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Install (Apply), Connect (Apply), Combine (Create) |

---

## 1. Concept

Claude Code is Anthropic's CLI agent. It runs in a terminal, reads/writes local files, executes shell commands (with permission), and calls MCP servers. It is the right surface for engineers who already work in the terminal — SREs, DevOps, platform engineers, anyone who scripts.

```
WHEN CLAUDE CODE WINS:
  You live in the terminal
  You want agent + git + cost in one session
  You run automation scripts that need cost data
  You write internal tools that benefit from cost context
  You want skills (reusable commands) as a team
```

Different from Claude Desktop (chat-only) and Cursor (IDE-embedded). Same MCP server; different invocation surface.

### Installation

```
INSTALL (one-time):
  Option A: npm install -g @anthropic-ai/claude-code
  Option B: curl -fsSL https://claude.com/install.sh | sh
  
  Option B is recommended for stability (binary install)

VERIFY:
  $ claude --version
  → claude-code 1.x.x

AUTH (one-time, opens browser):
  $ claude /login
  → sign in to Anthropic account in browser
  → returns to terminal authenticated
```

### Adding ZopNight MCP

Edit Claude Code's MCP configuration:

```
GLOBAL config: ~/.claude/mcp.json

{
  "mcpServers": {
    "zopnight": {
      "command": "npx",
      "args": ["-y", "@zopnight/mcp-server"],
      "env": {
        "ZN_PAT": "${env:ZN_PAT}",
        "ZN_ORG": "${env:ZN_ORG}"
      }
    }
  }
}
```

Set env vars in your shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export ZN_PAT="zn_pat_xxxxxxxxxxxxxx"
export ZN_ORG="org_acme123"
```

Restart your shell (or `source ~/.zshrc`).

### Verifying connection

```
$ claude

> /mcp
  Connected servers:
    zopnight (43 tools)
  
> "List my top 5 idle resources"
  Claude calls: list_resources(filter=idle, sort=days, limit=5)
  Returns formatted output (5 resources with details)
```

If `/mcp` doesn't show zopnight, check:
- `echo $ZN_PAT` returns the PAT
- `~/.claude/mcp.json` exists and is valid JSON
- Network connectivity to ZopNight backend

### Project-scoped MCP

When a specific repo needs cost data (e.g., a prod-monitoring repo that wants real-time cost info during incidents):

```
EDIT in repo root:
  .claude/mcp.json
  
  {
    "mcpServers": {
      "zopnight-prod": {
        "command": "npx",
        "args": ["-y", "@zopnight/mcp-server"],
        "env": {
          "ZN_PAT": "${env:ZN_PAT_PROD}",
          "ZN_ORG": "org_prod"
        }
      }
    }
  }

GITIGNORE the .env (env vars come from environment, not committed)
COMMIT .claude/mcp.json (uses env-var references, not literal PATs)
```

When Claude Code starts inside this repo, the project-scoped config supplements (or overrides) the global one.

### Skills + MCP — the team multiplier

Claude Code supports **custom skills** — markdown files that define reusable commands. Combined with MCP, skills become parameterized cost workflows.

```
EDIT: ~/.claude/skills/cost-summary.md

---
description: Generate this week's cost summary
---

Use the zopnight MCP server to:
1. Call get_costs filtered to last 7 days (by team)
2. Call get_cost_trends for week-over-week comparison
3. Call get_recommendation_summary for open recs
4. Call list_audit_logs for material changes

Synthesize into a markdown summary with these sections:
  Total spend (and WoW delta)
  Top changes (resource-level)
  Open recommendations (top 3 by impact)
  Material changes (audit log highlights)
  Action items (specific to this week)

Output to stdout. Don't write files unless asked.
```

```
USE the skill:
$ claude
> /cost-summary
  → Claude runs the skill, calls MCP tools, returns summary
  
SHARE with team:
  Commit the skill file to a team repo
  Each engineer copies to ~/.claude/skills/ or
  uses project-scoped .claude/skills/
```

Skills make MCP recipes **reusable and shareable**. M6.5 covers building team-shared skills in depth.

### Multi-account workflow

Claude Code is well-suited for consultants / MSPs working with multiple ZopNight orgs:

```
SETUP — ~/.claude/mcp.json:
  zopnight-customer-a:
    Env: ZN_PAT=$ZN_PAT_A, ZN_ORG=org_a
  zopnight-customer-b:
    Env: ZN_PAT=$ZN_PAT_B, ZN_ORG=org_b
  
USE:
  > "Compare customer-a and customer-b spend last month"
  Claude calls both servers, merges results, presents comparison

  > "Show idle resources in customer-a only"
  Claude calls only zopnight-customer-a server
```

The agent reasons about which org to query.

### Permissions and safety

```
WHEN CLAUDE CODE RUNS in your terminal:
  Can read/write local files (with permission prompt)
  Can run shell commands (with permission prompt)
  Calls MCP tools automatically (read-only ones; no prompt)
  
RECOMMENDED setup:
  Don't auto-allow shell commands by default
  Review each shell command before approving
  Audit MCP calls via ZopNight audit log (M6.3.L3)
  
The MCP tool calls are safe (read-only), but shell commands
and file writes deserve case-by-case approval.
```

### Common issues

```
PROBLEM: "MCP server fails to start"
  Check: npx -y @zopnight/mcp-server --version
  Fix:   re-install npm package; check Node version (18+)

PROBLEM: "PAT unauthorized"
  Check: echo $ZN_PAT
  If empty: PAT not exported in shell; add to .zshrc/.bashrc
  If wrong: regenerate PAT in ZopNight settings

PROBLEM: "Tool timeout"
  Cause: org has many resources; default page size is too small
  Fix:   args: ["-y", "@zopnight/mcp-server", "--timeout=60000"]
  Or:    scope queries with filters (by team, date range)

PROBLEM: "Skill not found"
  Check: ~/.claude/skills/<name>.md exists
  Reload: claude /skills (lists currently-loaded skills)
  Verify: filename + frontmatter matches the slash command
```

### Skills for ad-hoc workflows

The skill pattern works for any recurring cost workflow. Examples worth building:

```
~/.claude/skills/
  cost-summary.md          Weekly team cost summary
  anomaly-triage.md        15-min triage helper (M4.5.L1)
  postmortem-skeleton.md   Postmortem template + data (M4.5.L4)
  forecast-prep.md         Bottom-up forecast helper (M4.6.L2)
  reco-review.md           Recommendation triage
```

Build one skill per recurring workflow; share via team repo. M6.5 covers the workflow + sharing patterns.

---

## 2. Demo

A typical engineer's terminal session:

```
$ claude

> /mcp
  Connected servers:
    zopnight (43 tools)

> "What's my biggest unrealized recommendation?"
  Claude calls: get_recommendation_summary
  Returns: "i-0xyz123 right-sizing recommendation worth $400/mo,
            no action since 30 days. Owner via tag: bob@platform."

> "Draft a Slack message to the owner explaining the recommendation
   and asking when we can apply it."
  Claude drafts message tailored to engineer audience:
    "@bob — i-0xyz123 has a right-sizing rec open for 30 days
     ($400/mo savings). Anything blocking us from applying? Let me
     know if you want me to walk through it."

> "Save the draft to ~/cost-summary.md"
  Claude writes file (prompts for permission first)

> "Now generate this week's cost summary using the cost-summary skill"
  Claude invokes /cost-summary skill
  Skill chains 4 MCP calls
  Returns formatted summary to stdout

Engineer reviews, sends Slack, commits the cost-summary.md to a
weekly archive directory.

ELAPSED: 3 minutes of terminal time.
```

The terminal is the surface; ZopNight is the data; the agent is the assistant.

---

## 3. Hands-on (5 min)

Set up Claude Code with ZopNight MCP:

```
□ STEP 1: Install Claude Code
  Method: npm / curl install / already installed
  Verified version: __________

□ STEP 2: Authenticate
  $ claude /login
  Verified: __________

□ STEP 3: Configure MCP
  Created ~/.claude/mcp.json
  Set env vars in ~/.zshrc or ~/.bashrc
  Restarted shell

□ STEP 4: Test
  $ claude
  > /mcp
  Sees zopnight? Yes / No

□ STEP 5: First skill
  Create ~/.claude/skills/cost-summary.md (use the template above)
  $ claude
  > /cost-summary
  Runs? Yes / No

CHALLENGE for the week:
  Build a second skill for a recurring workflow you have
  Skill name: __________
  What it does: __________
```

---

## 4. Knowledge check

### Q1
Claude Code vs Claude Desktop:

A. The same product, different name
B. Different. Claude Code is a CLI agent with file/shell access; Claude Desktop is chat-only. Both can use MCP. Pick Claude Code if you live in the terminal; Claude Desktop if you live in chat.
C. Random
D. Identical functionality

<details>
<summary>Show answer</summary>

**Correct: B.** Different surfaces with overlapping MCP capability.
</details>

### Q2
MCP config in Claude Code lives at:

A. Hardcoded in the binary
B. ~/.claude/mcp.json (global) or .claude/mcp.json in a project (project-scoped). Project-scoped supplements/overrides global. Both reference env vars for PAT values.
C. Only via the CLI
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Config files at standard paths; project + global tiers.
</details>

### Q3
Skills + MCP — the relationship:

A. Skills replace MCP
B. Skills wrap MCP calls into reusable named commands. A skill is a markdown file with instructions ("call these MCP tools; synthesize this output"); invoking `/skill-name` runs it. Skills make MCP recipes shareable across the team.
C. Unrelated
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Skills wrap MCP recipes for reuse. The combination is the team multiplier.
</details>

---

## 5. Apply

Claude Code for terminal workflows. Build skills for recurring tasks (M6.5 covers patterns). Share skills via a team repo so workflows scale across engineers.

---

## Related lessons

- [L1 — Claude Desktop setup](L1_claude_desktop.md)
- [L2 — Cursor + Codex setup](L2_cursor_codex.md)
- [L4 — Verify the connection](L4_verify.md) *(next)*
- [M6.5 — Team-shared prompts and skills](../M6.5_team_prompts/00_README.md)

## Glossary terms touched

[Claude Code](../../../reference/glossary/claude-code.md) · [Skills (Claude Code)](../../../reference/glossary/skills.md) · [Project-scoped MCP](../../../reference/glossary/project-scoped-mcp.md) · [Recipe vs skill](../../../reference/glossary/recipe-vs-skill.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.2.L3
