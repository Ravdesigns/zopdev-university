# Setting up Cursor and Codex

§ T6 · M6.2 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **connect** ZopNight MCP to Cursor and to OpenAI Codex, **secure** PATs via environment variables (not config files), **and verify** the connection with three tests.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Wire cost data into the AI tool I already use for code." |
| **Personas** | Platform Engineer · Backend / Frontend Engineer |
| **Prerequisites** | M6.1 · M6.2.L1 |
| **Time** | 9 minutes |
| **Bloom verb** | Connect (Apply), Secure (Apply), Verify (Apply) |

---

## 1. Concept

Cursor is an AI-native IDE; Codex (OpenAI's tool, similar to GitHub Copilot's agentic mode) is a code-completion + chat tool. Both support MCP servers. The setup is similar to Claude Desktop (M6.2.L1) but with tool-specific config locations.

```
PREREQUISITES:
  ZopNight account with MCP enabled (covered in M6.3)
  PAT (read-only by design)
  Cursor or Codex installed
  Engineer wants cost data inline in their dev workflow
```

### Cursor setup

```
1. Open Cursor → Settings → MCP Servers
2. Click "Add new MCP server"
3. Configure:
     Name:    zopnight
     Command: npx
     Args:    -y mcp-remote https://<your-zopnight-mcp-endpoint>/mcp
     Env:     ZN_PAT=<your-PAT>, ZN_ORG=<your-org-id>
4. Save
5. Restart Cursor (Cmd+Q / File→Quit, then relaunch)
6. Test in Cursor chat: "list my idle resources"
   → Cursor calls ZopNight MCP; returns top resources
```

### Codex setup

```
1. Open Codex → Settings → Extensions → MCP
2. Add server:
     zopnight: npx -y mcp-remote https://<your-zopnight-mcp-endpoint>/mcp
     Env: ZN_PAT=<your-PAT>, ZN_ORG=<your-org-id>
3. Restart Codex
4. Test in Codex chat
```

### Configuration via file (recommended for teams)

For consistency across team members, use a versioned config file:

```
~/.cursor/mcp.json (Cursor)
~/.codex/mcp.json (Codex)

{
  "mcpServers": {
    "zopnight": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-zopnight-mcp-endpoint>/mcp"],
      "env": {
        "ZN_PAT": "${env:ZN_PAT}",
        "ZN_ORG": "${env:ZN_ORG}"
      }
    }
  }
}
```

The `${env:VAR}` syntax reads from your shell environment. Set them in your shell profile:

```bash
# ~/.zshrc or ~/.bashrc
export ZN_PAT="zn_pat_xxxxxxxxxxxxxx"
export ZN_ORG="org_acme123"
```

Restart shell, then restart Cursor/Codex.

### Security — never commit PATs

```
DO:
  Use ${env:ZN_PAT} in config files
  Store PAT in env var (.bashrc / .zshrc) or secrets manager
  Add .env to .gitignore

DON'T:
  Hardcode PAT in mcp.json
  Commit mcp.json with PAT value
  Share PAT via Slack/email
  Use the same PAT for multiple machines (rotate per device)
```

### Verification — three tests

After setup, run these three:

```
TEST 1 — Server registered:
  In chat: "What MCP servers are connected?"
  Expected: list includes zopnight
  
TEST 2 — Tool call works:
  In chat: "List my idle resources"
  Expected: JSON-formatted resources from ZopNight backend
  
TEST 3 — Chained query:
  In chat: "What's my total monthly spend on EC2 across all accounts?"
  Expected: Chains multiple MCP calls; synthesizes a total
```

If all three pass, you're connected. If any fails, see common setup failures below.

### Common setup failures

```
PROBLEM: "MCP server not found"
  CAUSE: npm package not installed; npx couldn't fetch
  FIX:   npx -y mcp-remote https://<your-zopnight-mcp-endpoint>/mcp installs on every invocation;
         verify network and Node 18+

PROBLEM: "Unauthorized"
  CAUSE: PAT invalid, expired, or wrong env var name
  FIX:   echo $ZN_PAT in shell to verify the env var is set;
         regenerate PAT in ZopNight settings if needed

PROBLEM: "No tools available"
  CAUSE: PAT scope incomplete OR org has MCP toggled off
  FIX:   Check ZopNight admin settings (M6.3); verify PAT has full
         read scopes

PROBLEM: "Tool calls timeout"
  CAUSE: Org has many resources for default page size
  FIX:   Increase MCP server timeout in config:
         args: ["-y", "mcp-remote", "https://<your-zopnight-mcp-endpoint>/mcp", "--timeout=60000"]
         
PROBLEM: "Permission denied" (file system)
  CAUSE: Config file location not writable
  FIX:   Check directory permissions; create parent dir if missing
```

### Permission scope (PAT)

```
PAT REQUIRED SCOPES (all read-only):
  org:read              (basic identity)
  resources:read        (resource inventory)
  costs:read            (cost data)
  schedules:read        (schedule inspection)
  recommendations:read  (rec listing)
  audit:read            (audit log access)
  notifications:read    (notification history)
```

ZopNight's PAT model lets the user scope per-token. For MCP, all read scopes are typically included. M6.3 covers detailed PAT management.

### Multi-org setup

Engineers working across multiple ZopNight orgs (e.g., one per customer in MSP / consulting roles):

```json
{
  "mcpServers": {
    "zopnight-customer-a": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-zopnight-mcp-endpoint>/mcp"],
      "env": { "ZN_PAT": "${env:ZN_PAT_A}", "ZN_ORG": "org_a" }
    },
    "zopnight-customer-b": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-zopnight-mcp-endpoint>/mcp"],
      "env": { "ZN_PAT": "${env:ZN_PAT_B}", "ZN_ORG": "org_b" }
    }
  }
}
```

The agent sees both orgs. Queries specify: "List idle resources for zopnight-customer-a" or "Compare A and B spend last month."

### Team quick-start template

For teams adopting MCP, publish a starter template:

```
# In team's internal docs / wiki

REPO PATH: ~/.cursor/mcp.json  (or ~/.codex/mcp.json)

CONTENT:
{
  "mcpServers": {
    "zopnight": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-zopnight-mcp-endpoint>/mcp"],
      "env": { "ZN_PAT": "${env:ZN_PAT}", "ZN_ORG": "${env:ZN_ORG}" }
    }
  }
}

ENVIRONMENT (in ~/.zshrc):
export ZN_PAT="zn_pat_yourPAThere"
export ZN_ORG="org_acmeOrgId"

GITIGNORE:
.env
*_secret*
```

Document team-shared config in the repo; the actual PAT goes in each engineer's environment.

---

## 2. Demo

```
ENGINEER OPENS Cursor for the first time after setup:

Step 1: Cursor reads ~/.cursor/mcp.json on startup
Step 2: Spawns the MCP server process with PAT from env var
Step 3: Server authenticates to ZopNight backend
Step 4: Cursor receives 43-tool capability list

ENGINEER queries:
  "list my top 5 idle resources"
  
Cursor (via MCP):
  Calls list_resources(filter=idle, sort=days, limit=5)
  Returns 5 resources with details

ENGINEER follow-up:
  "schedule the top one for nights and weekends"
  
Cursor (via MCP):
  Recognizes mutation request
  Responds: "I cannot create schedules via MCP (read-only).
             To schedule i-0xyz123, open ZopNight:
             https://app.zopnight.com/resources/i-0xyz123/schedule
             Want me to draft the schedule config you'd paste?"

ENGINEER: "Yes, draft the schedule."
  
Cursor drafts cron-style schedule + resource group assignment.
ENGINEER copies, opens ZopNight UI, pastes, saves.

Engineer's time: 60 seconds
Without MCP: would require switching to ZopNight UI to find
             the resource + 5 minutes of dashboard navigation
```

The read-only contract surfaces appropriately — the agent recognizes mutation requests and redirects to UI.

---

## 3. Hands-on (5 min)

Set up MCP in your preferred AI tool:

```
TOOL: Cursor / Codex / both

□ STEP 1: Generated PAT in ZopNight
  PAT stored: env var / secrets manager / 1Password

□ STEP 2: Config file created
  Location: __________
  Uses ${env:ZN_PAT}? Yes / No

□ STEP 3: Env var set in shell profile
  Shell: zsh / bash / fish
  File: __________ (e.g., ~/.zshrc)

□ STEP 4: Restarted tool

□ STEP 5: Verification tests
  Test 1 (server registered): pass / fail
  Test 2 (tool call): pass / fail
  Test 3 (chained query): pass / fail

ANY FAILURES:
  Symptom: __________
  Likely cause (from common failures): __________
  Fix: __________
```

If you cannot get all three tests to pass, M6.2.L4 covers deeper verification.

---

## 4. Knowledge check

### Q1
PAT for MCP should be stored:

A. Hardcoded in the mcp.json config file
B. Loaded from environment variable via `${env:ZN_PAT}` syntax. The config file goes in version control (or template repo); the PAT value goes in the shell environment or a secrets manager. Never commit PATs to source control.
C. Shared in team chat
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Env variable. Config in repo; PAT in shell.
</details>

### Q2
After MCP setup, verify with:

A. Just checking the server is registered
B. Both: server registered AND a test tool call returns real data. Without the tool call, you don't know if the PAT is valid. Run all three tests (server registered, tool call, chained query) before relying on the connection.
C. Skip verification
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Test a tool call. Server-registered alone is necessary but not sufficient.
</details>

### Q3
PAT scope for MCP:

A. Admin scope
B. Read-only — org:read, resources:read, costs:read, schedules:read, recommendations:read, audit:read, notifications:read. Minimum needed; full read scopes typical. Write scopes don't exist for MCP (architectural; see M6.1.L2).
C. Random
D. Owner

<details>
<summary>Show answer</summary>

**Correct: B.** Read-only scopes. The PAT model enforces this.
</details>

---

## 5. Apply

Configure MCP for your team's chosen AI tool. Document the team setup in your wiki. M6.3 covers PAT management at scale.

For team rollout: publish a template config + env var setup; each engineer generates their own PAT.

---

## Related lessons

- [L1 — Claude Desktop setup](L1_claude_desktop.md)
- [L3 — Claude Code (terminal) setup](L3_claude_code.md) *(next)*
- [L4 — Verify the connection](L4_verify.md)
- [M6.3 — PAT management](../M6.3_pat_audit/00_README.md)

## Glossary terms touched

[Cursor MCP](../../../reference/glossary/cursor-mcp.md) · [Codex MCP](../../../reference/glossary/codex-mcp.md) · [Env-var loading](../../../reference/glossary/env-var-loading.md) · [Multi-org config](../../../reference/glossary/multi-org-config.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.2.L2
