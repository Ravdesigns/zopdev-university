# Claude Desktop install + first query

§ T6 · M6.2 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **install** the ZopNight MCP server for Claude Desktop, **verify** the connection with a first query, **and diagnose** the three most common setup failures.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Get Claude Desktop talking to ZopNight in 5 minutes; troubleshoot the 5% that don't work first try." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | M6.1 (concept) · Claude Desktop installed |
| **Time** | 9 minutes |
| **Bloom verb** | Install (Apply), Verify (Apply), Diagnose (Analyze) |

---

## 1. Concept

Setting up the ZopNight MCP server for Claude Desktop involves three steps: create a PAT in ZopNight, edit Claude Desktop's MCP configuration file, restart Claude Desktop. The total time is 5-10 minutes for a clean setup; longer if you hit one of the common pitfalls.

```
SETUP STEPS:
  1. Create a Personal Access Token (PAT) in ZopNight
  2. Configure Claude Desktop's MCP settings file
  3. Restart Claude Desktop
  4. Test with a query
```

### Step 1 — Create the PAT

```
ZopNight: Settings → Personal Access Tokens → Create

Recommended fields:
  Name:        my-claude-desktop-mcp
  Expiry:      90 days (typical), or 365 days for power users
  Scope:       Read-only (default for MCP — cannot be changed)
  Description: For MCP integration with Claude Desktop
  
After creation, the token shown is: zn_pat_xxxxxxxxxxxxxx
  Copy it now; the full value is shown only at creation.
  Store securely (1Password, env file in ~/.zopnight/, etc.)
```

PAT management is covered in detail in M6.3. For now: read-only is the only scope option (architectural; see M6.1.L2 and M6.6); the token is bearer credential (treat like a password).

### Step 2 — Configure Claude Desktop

Edit Claude Desktop's MCP configuration file at the correct path for your OS:

```
macOS:    ~/Library/Application\ Support/Claude/claude_desktop_config.json
Windows:  %APPDATA%\Claude\claude_desktop_config.json
Linux:    ~/.config/Claude/claude_desktop_config.json
```

Configuration content (replace placeholders with your values):

```json
{
  "mcpServers": {
    "zopnight": {
      "command": "npx",
      "args": ["-y", "@zopnight/mcp-client"],
      "env": {
        "ZOPNIGHT_PAT": "zn_pat_xxxxxxxxxxxxxx",
        "ZOPNIGHT_ORG_ID": "org_abc123"
      }
    }
  }
}
```

Replace `ZOPNIGHT_PAT` with the value copied from Step 1. Replace `ZOPNIGHT_ORG_ID` with your org ID (find in ZopNight Settings → Organization).

If you already have other MCP servers configured (other vendors, your own MCPs), add the `zopnight` block to the existing `mcpServers` object without replacing them.

### Step 3 — Restart Claude Desktop

Claude Desktop needs a **full restart** to load the MCP configuration. Quitting via the menu bar (Cmd+Q on macOS) is required; closing the window is not enough.

```
macOS:    Cmd+Q to quit fully, then relaunch from Applications
Windows:  File → Quit, then relaunch from Start menu
Linux:    Close all windows; verify process is gone with `ps`, relaunch
```

Reload-after-config is a common gotcha. If your config looks right but Claude doesn't see the tools, it usually means it wasn't actually restarted.

### Step 4 — Verify

```
TEST 1 — List the available tools:
  Type in Claude Desktop: "What ZopNight tools are available?"
  Expected response: list of 43 read-only tools

TEST 2 — Run a real query:
  Type: "What's our biggest idle resource right now?"
  Expected: Claude calls list_resources via MCP and returns the top
  result with details (resource ID, days idle, cost)
  
TEST 3 — Cross-tool chain:
  Type: "Find the biggest idle resource and draft a Slack message
        to its owner about cleanup."
  Expected: Claude calls list_resources, identifies owner via tag,
  drafts a Slack message (does not send it)
```

If all three work: setup complete.

### Common setup failures

```
SYMPTOM                                FIX
──────────────────────────────────────────────────────────────────
"No tools visible"                      Verify Claude Desktop fully
                                       restarted (Cmd+Q not just
                                       close window)
                                       
"Authentication failed"                 Check PAT value (copy without
                                       leading/trailing spaces or
                                       newlines)
                                       
"Org not found"                          Verify ZOPNIGHT_ORG_ID matches
                                       your org's ID exactly
                                       
"Network error"                          Check connectivity to ZopNight's
                                       MCP endpoint (curl to verify);
                                       check corporate proxy / VPN
                                       
"Command 'npx' not found"               Install Node.js (LTS); npx is
                                       included with Node 16+
                                       
Tools visible but error on first call    PAT may have expired or been
                                       revoked; regenerate
                                       
"MCP_DISABLED"                           Org-level toggle off (see M6.3);
                                       ask org admin to enable
```

### What happens on first connection

```
At Claude Desktop startup:
  1. Reads claude_desktop_config.json
  2. For each MCP server entry, spawns the command
  3. Server connects to ZopNight's backend with the PAT
  4. ZopNight validates PAT, returns capabilities (43 tools)
  5. Claude has the tool list in its context
  
At first query:
  6. Claude selects appropriate tool(s) for the query
  7. Tool call goes through MCP server → ZopNight backend
  8. Result returned; Claude synthesizes for user
```

The MCP server runs locally on your machine; the data calls go to ZopNight's hosted backend. The PAT authenticates the calls.

### Security considerations

```
PAT IS BEARER CREDENTIAL — treat like a password:
  Don't commit to git
  Don't paste in chat
  Don't share via email
  
STORE in:
  Secrets manager (1Password, AWS Secrets Manager, etc.)
  OS keychain
  Env var loaded from secure file (~/.zopnight/env with 0600 perms)
  
ROTATE periodically (see M6.3):
  Default expiry: 90 days
  Rotate before expiry
  Revoke immediately if compromised
```

### What you can ask once connected

```
EXAMPLE queries that work on day one:
  "What's our biggest idle resource?"
  "Show me the top 10 cost-saving recommendations"
  "Describe the business-hours-eu schedule"
  "Who owns prod-eks-cluster-1?"
  "Show overrides created in the last week"
  "What was our total spend last month?"
  "Compare team-platform vs team-product spend this quarter"
```

For more advanced patterns, see the Recipe library (M6.4).

### Multi-org setup

If you have access to multiple ZopNight orgs:

```json
{
  "mcpServers": {
    "zopnight-acme": {
      "command": "npx",
      "args": ["-y", "@zopnight/mcp-client"],
      "env": {
        "ZOPNIGHT_PAT": "zn_pat_aaa...",
        "ZOPNIGHT_ORG_ID": "org_acme"
      }
    },
    "zopnight-staging": {
      "command": "npx",
      "args": ["-y", "@zopnight/mcp-client"],
      "env": {
        "ZOPNIGHT_PAT": "zn_pat_bbb...",
        "ZOPNIGHT_ORG_ID": "org_staging"
      }
    }
  }
}
```

Claude sees both orgs; queries specify which one ("show idle resources in zopnight-acme").

---

## 2. Demo

A clean first-time setup:

```
T+0:00     Open ZopNight: Settings → Personal Access Tokens
T+0:15     Click "Create token", fill in name + 90-day expiry
T+0:30     Token displayed: zn_pat_8f9a3b... (copied to clipboard)

T+0:45     Note org ID from Settings → Organization: org_acme123

T+1:00     Open terminal, edit Claude Desktop config:
            $ cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
            {
              "mcpServers": {
                "zopnight": {
                  "command": "npx",
                  "args": ["-y", "@zopnight/mcp-client"],
                  "env": {
                    "ZOPNIGHT_PAT": "zn_pat_8f9a3b...",
                    "ZOPNIGHT_ORG_ID": "org_acme123"
                  }
                }
              }
            }
            EOF

T+2:00     Quit Claude Desktop (Cmd+Q)
T+2:15     Relaunch from Applications

T+2:30     In Claude: "What ZopNight tools are available?"
T+2:35     Claude: "I have access to 43 ZopNight tools across 9
                    categories: Resources (8), Schedules (6), Costs (9),
                    Recommendations (5), Teams (4), Budgets (3),
                    Audit logs (3), Cloud accounts (3), Notifications (2)."

T+2:45     Test query: "What's our biggest idle resource?"
T+2:50     Claude calls list_resources via MCP
T+3:00     Returns: "i-0xyz123 (m5.2xlarge in us-east-1) has been
                     stopped 47 days. EBS attached: $69/month."

CONNECTED. Total elapsed: ~3 minutes.
```

---

## 3. Hands-on (5 min)

Run through the four steps:

```
□ STEP 1: Created PAT in ZopNight
  Token: zn_pat_____________ (stored securely)
  Org ID: __________

□ STEP 2: Configured Claude Desktop
  File path: __________
  Verified valid JSON?  Yes / No

□ STEP 3: Restarted Claude Desktop
  Method: Cmd+Q / File→Quit / kill process

□ STEP 4: Verified
  Test 1 (list tools): pass / fail
  Test 2 (first query): pass / fail
  Test 3 (chain): pass / fail

IF FAILED at any step:
  Symptom: __________
  Likely cause (from common failures table): __________
  Fix attempted: __________
```

If all three tests pass, your setup is working. Onward to M6.4 recipes.

---

## 4. Knowledge check

### Q1
After updating Claude Desktop's MCP config, what's required for it to see the change?

A. Nothing — picks up automatically
B. Full restart of Claude Desktop. Closing the window isn't enough; need Cmd+Q (macOS) or File→Quit (Windows/Linux) to fully terminate, then relaunch. Reload-after-config is a common gotcha.
C. System reboot
D. Reinstall the app

<details>
<summary>Show answer</summary>

**Correct: B.** Full restart picks up config. Closing the window is not enough.
</details>

### Q2
The PAT used for MCP can be:

A. Configured for write access if needed
B. Always read-only. By design; cannot be configured otherwise. The architectural read-only contract (M6.1.L2) extends to PAT scope. Even an admin-tier user's MCP PAT is read-only.
C. Random
D. Both read and write

<details>
<summary>Show answer</summary>

**Correct: B.** Read-only. The constraint is architectural.
</details>

### Q3
The configuration file path on macOS:

A. /etc/claude/config.json
B. ~/Library/Application Support/Claude/claude_desktop_config.json. Standard macOS user-config path. Same logical location on Windows (%APPDATA%) and Linux (~/.config/Claude/).
C. /tmp/claude.json
D. Custom random location

<details>
<summary>Show answer</summary>

**Correct: B.** Standard macOS path. Use the OS-appropriate path for Windows/Linux.
</details>

---

## 5. Apply

Documentation: [docs.zopnight.com/mcp/claude-desktop](https://docs.zopnight.com/mcp/claude-desktop). Generate PAT in [Settings → Personal Access Tokens](https://app.zopnight.com/settings/pats).

For team rollout: provide a template config file in your team wiki. Cover PAT generation in onboarding.

---

## Related lessons

- [L2 — Cursor + Codex setup](L2_cursor_codex.md) *(next)*
- [L3 — Claude Code (terminal) setup](L3_claude_code.md)
- [L4 — Verify the connection](L4_verify.md)
- [M6.3 — PAT management and audit](../M6.3_pat_audit/00_README.md)
- [M6.4 — Recipe library (first useful queries)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[MCP configuration](../../../reference/glossary/mcp-configuration.md) · [PAT](../../../reference/glossary/pat.md) · [Bearer credential](../../../reference/glossary/bearer-credential.md) · [Multi-org setup](../../../reference/glossary/multi-org-setup.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.2.L1
