# M6.2 — Setup — Claude / Cursor / Codex / Claude Code

§ T6 · M6.2 · Engineer tier · 4 lessons · ~36 min

> **Connection model.** ZopNight's MCP server is a **hosted** service behind the gateway, not a local npm package. You connect a client to its **remote endpoint** (URL shown in ZopNight, Settings → Integrations → MCP) using your PAT as a bearer header. Stdio-only clients connect through the generic `mcp-remote` bridge (`npx mcp-remote <endpoint>`); clients with native remote-MCP support point at the endpoint directly. L1 has the canonical config; the other lessons follow the same pattern per client.

## Lessons

| # | Lesson | Time |
|---|---|---|
| L1 | [Claude Desktop install + first query](L1_claude_desktop.md) | 9 min |
| L2 | [Cursor + Codex setup](L2_cursor_codex.md) | 9 min |
| L3 | [Claude Code — terminal-native](L3_claude_code.md) | 9 min |
| L4 | [Verifying the connection](L4_verify.md) | 9 min |

---

§ Last reviewed 2026-05-20
