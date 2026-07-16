# Verifying the connection

§ T6 · M6.2 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **run** the 6-step MCP verification checklist, **diagnose** the most common verification failures, **and adopt** the trust-but-verify discipline for agent-reported numbers.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Verify the MCP connection works end-to-end before relying on it for real work; catch hallucinated numbers before they reach leadership." |
| **Personas** | Platform Engineer · FinOps Analyst · SRE |
| **Prerequisites** | M6.2.L1-L3 (any tool setup) |
| **Time** | 9 minutes |
| **Bloom verb** | Run (Apply), Diagnose (Analyze), Adopt (Apply) |

---

## 1. Concept

A flaky MCP connection is worse than no connection — the agent hallucinates answers when it can't reach the tools but doesn't tell you. Systematic verification before relying on MCP for real work is the discipline that catches problems before they cause expensive mistakes.

```
VERIFICATION CHECKLIST (6 steps):
  ✓ MCP server starts
  ✓ Server reports correct tool count (43)
  ✓ PAT authentication works
  ✓ A read tool returns real data
  ✓ A chained query works (multi-tool)
  ✓ Error path tested (mutation request → clear refusal)
```

Run this on first setup; rerun weekly when you'll rely on MCP heavily (e.g., during cost reviews, incident triage).

### Step 1 — Server starts

```
IN your AI tool:
  /mcp

EXPECTED:
  zopnight: connected (43 tools)

IF FAILED:
  Re-check config file path (right OS-specific location?)
  Run npx -y mcp-remote https://<your-zopnight-mcp-endpoint>/mcp manually in terminal to see errors
  Check Node version (need 18+)
  Check shell env vars are set
```

### Step 2 — Tool count

```
LIST tools:
  /tools zopnight

EXPECTED: 43 tools listed
  Sample: list_resources, get_costs, get_recommendation_summary,
          list_audit_logs, etc.

IF FEWER than 43:
  PAT scope incomplete; regenerate with full read scopes
  MCP server version outdated; update: npx -y mcp-remote@latest https://<your-zopnight-mcp-endpoint>/mcp
```

### Step 3 — Auth check

```
QUICK auth test:
  Ask: "Who am I in ZopNight?"

EXPECTED:
  Agent calls get_organisation + get_user_info
  Returns: org name + your email

IF UNAUTHORIZED:
  PAT expired or invalid
  Generate new PAT in ZopNight settings
  Update env var; restart tool
```

### Step 4 — Real data check

```
DATA test:
  "How many cloud accounts do I have?"

EXPECTED:
  Agent calls list_cloud_accounts
  Returns: actual count + provider breakdown

IF EMPTY:
  Your org may not have onboarded clouds yet
  Or your role doesn't have visibility to accounts
  Cross-check against ZopNight UI for ground truth
```

### Step 5 — Chained query

```
CHAIN test:
  "What's my biggest growing resource and who owns it?"

EXPECTED:
  Agent chains:
    list_resources sorted by cost growth (descending)
    get_resource details for top match
    resolves owner from tag or team mapping
  Synthesizes a single answer

IF AGENT CONFUSED:
  Agent prompt may need better guidance; try simpler queries first
  Some agents need explicit "use MCP" hint for chained calls
```

### Step 6 — Error path (read-only contract test)

```
ERROR test:
  "Delete resource i-0xyz123"

EXPECTED:
  Agent recognizes mutation request
  Responds something like: "I cannot delete via MCP (read-only).
  Open ZopNight UI to take this action: [URL]"

IF AGENT TRIES TO DELETE:
  Your MCP config has wrong server (not ZopNight's read-only one)
  Investigate immediately; this would be a security issue
```

The last test confirms the read-only contract is in effect.

### Common verification failures

```
SYMPTOM                                FIX
──────────────────────────────────────────────────────────────────
"MCP server timeout"                    Increase timeout in mcp.json:
                                       --timeout=60000 (60 sec)
                                       Or scope queries with filters
                                       
"Tool not found"                         PAT scope incomplete OR server
                                       version outdated. Regenerate PAT;
                                       update server to @latest
                                       
"Hallucinated data"                      Agent didn't call MCP; relied
                                       on context window memory
                                       Fix: prompt explicitly "use MCP"
                                       
"Numbers don't match dashboard"          Time-range or filter mismatch
                                       Verify ZopNight UI ground truth
                                       Check exact filters agent applied
                                       
"Server crashes randomly"                MCP server version mismatch
                                       Update: npx -y mcp-remote@latest https://<your-zopnight-mcp-endpoint>/mcp
                                       Or check Node version
                                       
"Auth works but no data"                 Org-level MCP toggle off
                                       Ask admin to enable (M6.3.L2)
```

### Number verification — the discipline

Agents make up numbers when uncertain. The **trust-but-verify** discipline:

```
ALWAYS verify large numbers BEFORE:
  Sending to leadership
  Posting to customer
  Making a budget decision
  Quoting in board materials
  Citing in compliance documentation

VERIFICATION procedure:
  Agent reports "Spend last month = $42,000"
  Engineer opens ZopNight UI → Reports → Cost Overview
  Filter to "last month"; compare totals
  If match (±2%): trust the agent
  If mismatch: investigate the filter or date range

COMMON CAUSES of number mismatch:
  Different date range interpretation (calendar month vs 30 days)
  Different team/account filter
  Stale data (rare; ZopNight is real-time)
  Hallucination (most concerning; the agent made it up)
```

The 2-minute verification step compounds over years. One leadership-quoted hallucinated number can cost more credibility than thousands of correct ones earn.

### Performance check

Expected latency:

```
TYPE                              LATENCY
──────────────────────────────────────────────────────────────────
Single tool call (small org)       200-500 ms
Single tool call (large org)        500-1500 ms
Multi-tool chain (3-5 calls)        2-5 seconds
Complex synthesis with reasoning    5-15 seconds
```

If significantly slower:
- Check network to ZopNight backend
- Check MCP server logs
- May need to scope queries (filter by date, team)
- Consider hosted MCP (enterprise tier) for large orgs

### Weekly smoke test

For teams relying on MCP for cost reviews, run this weekly:

```
WEEKLY SMOKE TEST (2 minutes):

  1. /mcp → connected, 43 tools? ✓
  2. "Who am I?" → returns your user ✓
  3. "List 5 idle resources" → returns 5 ✓
  4. "Last week's spend" → matches ZopNight UI ✓
  5. "Top recommendation" → returns top ✓
  
  If all 5 pass: you're good for the week.
  If any fail: troubleshoot before relying on agent for cost work.
```

A failing smoke test means: don't use agent-reported numbers in leadership presentations this week until fixed.

### Hallucination signals to watch for

```
RED FLAGS that the agent is hallucinating (not calling MCP):

  Numbers too round ($50,000 exactly, $100,000)
  Generic resource names (server-1, db-2)
  No specific resource IDs (no i-0xxx... format)
  No timestamps in the output
  Refuses to drill into specific examples
  Numbers don't match dashboard within 5%
  Agent rephrases without adding detail

When you see any of these: open ZopNight UI; verify manually.
```

The discipline isn't paranoia — it's calibration. Verify a few times; learn which queries the agent handles well and which it doesn't.

---

## 2. Demo

A new engineer's first-week verification:

```
DAY 1: Initial setup (covered in L1-L3)

DAY 2: Verification — all 6 steps

$ claude
> /mcp
  ✓ zopnight: 43 tools (Step 1: server starts)

> /tools zopnight
  ✓ 43 tools listed (Step 2: tool count)

> "Who am I in ZopNight?"
  ✓ "You are jane@platform in 'Acme Corp' org" (Step 3: auth)

> "How many resources are in our prod-payments cluster?"
  ✓ "23 resources: 12 EC2, 4 RDS, 5 EBS, 2 LBs" (Step 4: real data)
  
> Cross-check: open ZopNight UI → resources filtered to prod-payments
  ✓ 23 resources confirmed (Step 4 verification)
  
> "What's the biggest growing resource this week and who owns it?"
  Chains: list_resources sorted by growth + tag lookup
  ✓ Returns: "i-0abc123 (m5.xlarge) grew $120 this week. Owner via
              tag: bob@platform" (Step 5: chained query)

> "Delete resource i-0abc123"
  ✓ "I cannot delete via MCP (read-only). To take this action,
     open ZopNight UI." (Step 6: error path / read-only contract)

All 6 steps pass. Verification complete.

WEEKLY FROM HERE:
  Every Monday morning: 2-minute smoke test
  Catches: stale PAT, server upgrades needed, org toggle changes
```

---

## 3. Hands-on (5 min)

Run the 6-step verification on your MCP setup:

```
□ STEP 1 — Server starts (/mcp shows zopnight: 43 tools): pass/fail
□ STEP 2 — Tool count is 43: pass/fail
□ STEP 3 — Auth check ("Who am I?" returns your user): pass/fail
□ STEP 4 — Real data check (cross-verify against UI): pass/fail
□ STEP 5 — Chained query: pass/fail
□ STEP 6 — Error path (read-only refusal): pass/fail

ANY FAILURES:
  Step: __________
  Symptom: __________
  Likely cause: __________
  Fix: __________

NUMBER VERIFICATION test:
  Ask agent: "What was our total spend last month?"
  Open ZopNight UI: same date range; compare
  Match? Yes / No / Mismatch by __%
  
  If mismatch >5%: investigate before trusting agent numbers
```

---

## 4. Knowledge check

### Q1
After MCP setup, you should:

A. Trust the agent's first response
B. Verify with the 6-step checklist. Confirm a known number against the UI before relying on agent-reported numbers for real work. Trust-but-verify is the operating discipline.
C. Skip verification
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Verify systematically. One leadership-quoted hallucinated number costs more credibility than thousands of correct ones earn.
</details>

### Q2
Agent reports a cost number. What's the right discipline?

A. Trust it without checking
B. Verify against ZopNight UI before acting on large figures. The 2-minute verification compounds over years; one hallucinated number cited to leadership costs more than the verification time saves.
C. Always cite to leadership
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Trust but verify, especially for high-stakes figures.
</details>

### Q3
Read-only verification (Step 6):

A. Skip — already documented
B. Try a destructive query — the agent should refuse with a redirect to ZopNight UI. This confirms the read-only contract is in effect for your specific setup, not just on the docs page.
C. Random
D. Optional

<details>
<summary>Show answer</summary>

**Correct: B.** Test the contract directly. Confirms your config is the right ZopNight MCP, not a write-capable lookalike.
</details>

---

## 5. Apply

Run the 6-step verification on first setup. Run the 2-minute weekly smoke test for ongoing reliability. Trust-but-verify on numbers — especially before sending to leadership or customers.

For team rollout: document the verification checklist in your wiki; ask each engineer to run it before relying on MCP for real work.

---

## Related lessons

- [L1 — Claude Desktop setup](L1_claude_desktop.md)
- [L2 — Cursor + Codex setup](L2_cursor_codex.md)
- [L3 — Claude Code (terminal) setup](L3_claude_code.md)
- [M6.3 — PAT management + audit](../M6.3_pat_audit/00_README.md)
- [M6.4 — Recipe library (production patterns)](../M6.4_recipe_library/00_README.md)

## Glossary terms touched

[Verification checklist](../../../reference/glossary/verification-checklist.md) · [Trust-but-verify](../../../reference/glossary/trust-but-verify.md) · [Smoke test](../../../reference/glossary/smoke-test.md) · [Hallucination](../../../reference/glossary/hallucination.md) · [Read-only contract verification](../../../reference/glossary/read-only-contract-verification.md)

---

## Module quiz

Complete M6.2 → 10-question quiz unlocks the **Connected** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.2.L4
