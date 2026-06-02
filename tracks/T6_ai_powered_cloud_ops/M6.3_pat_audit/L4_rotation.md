# PAT rotation

§ T6 · M6.3 · L4 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **execute** a safe PAT rotation sequence, **automate** rotation via secret managers, **and respond** to compromise scenarios (lost device, leaked PAT, departed user).

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Rotate PATs on schedule and on demand without disrupting users; respond fast when a PAT is compromised." |
| **Personas** | Platform Engineer · Security/Compliance · DevOps Engineer |
| **Prerequisites** | M6.3.L1-L3 |
| **Time** | 9 minutes |
| **Bloom verb** | Execute (Apply), Automate (Apply), Respond (Apply) |

---

## 1. Concept

PATs are bearer credentials. If leaked, they grant the user's read access until rotated. Rotation = generate new PAT, swap in clients, revoke old. The discipline matters: scheduled quarterly rotations + on-demand rotation for compromise.

```
WHY ROTATE PATs:
  Limit exposure if leaked
  Compliance requirement (typically quarterly)
  User left team / changed role
  Security incident
  Periodic hygiene (industry best practice for bearer tokens)
```

### Rotation policy

```
RECOMMENDED:
  Quarterly rotation (every 90 days) — most common
  Immediate rotation on suspected leak
  Auto-rotation on user role change
  
TRACKED in ZopNight UI:
  PAT age visible per token
  Warning email at 75 days (15 days before 90-day expiry)
  Block on expiry day (configurable per org)
```

The 90-day cadence balances security (limits exposure window) with operational overhead (not constant rotation pressure).

### Manual rotation — safe sequence

```
SAFE ROTATION (no disruption):

  1. Generate new PAT
     ZopNight → Settings → API → My PATs → Generate
     Same scopes / description as before (or update naming)
  
  2. Copy the new PAT (shown only once)
  
  3. Update local config (mcp.json or env var)
     Replace old PAT value with new
  
  4. Restart your AI tool (Claude Desktop, Cursor, etc.)
     Loads the new PAT
  
  5. Verify new PAT works
     Test query: "Who am I in ZopNight?"
     Should return your user (auth working)
  
  6. Revoke the OLD PAT
     ZopNight → Settings → My PATs → Revoke
     This is the moment the old PAT becomes invalid

5-minute process; done correctly, no disruption.
```

Common mistake: revoking the old PAT before step 5. Then the agent breaks until step 4 completes.

### Automated rotation

For teams with strict policies, automate via:

```
OPTION A: ZopNight API direct
  POST /api/v1/pats/rotate
  Body: { pat_id: "pat_abc123", new_description: "..." }
  Returns: new PAT value (shown only on creation)
  Old PAT auto-revoked at the call

OPTION B: Secret manager integration
  1Password CLI rotates and re-syncs
  HashiCorp Vault rotates on schedule
  AWS Secrets Manager rotation lambda
  Each can call ZopNight API + update its store atomically

OPTION C: CI/CD orchestration
  Github Actions / Jenkins runs rotation script quarterly
  Script: generate new PAT → update secrets store → notify users
```

Automation is the answer at scale. Manual rotation across 100 engineers is operational pain; automated rotation is one runbook.

### Coordination with clients (the safe pattern)

```
PROBLEM: rotate PAT while the agent has an active session

WHAT HAPPENS WITHOUT COORDINATION:
  Agent has old PAT in process memory
  You revoke old PAT
  Agent's next call returns 401 Unauthorized
  Agent breaks until restarted with new PAT

THE SAFE PATTERN:
  1. Generate new PAT
  2. Update client config (mcp.json) with new value
  3. Restart client (which reloads PAT)
  4. Verify new PAT works (test query)
  5. ONLY NOW revoke old PAT

If you skip step 4: agent breaks if new PAT is bad
If you skip step 5: old PAT stays valid (bad if leaked)
```

The order matters. Verify before revoke.

### Multi-device strategy

```
ENGINEER uses MCP from multiple devices:
  Cursor on laptop
  Claude Code on desktop workstation
  Claude Desktop on personal Mac (if BYOD allowed)

RECOMMENDED: one PAT per device

WHY:
  If a device is lost (e.g., laptop stolen), revoke that
  device's PAT; other devices keep working.
  
  If using one PAT across devices, losing one device requires
  revoking the shared PAT — interrupts work on the other devices.

NAMING convention:
  pat-laptop-2026-Q2   (or descriptive: "MBP-2026-Q2")
  pat-workstation-2026-Q2
  pat-personal-mac-2026-Q2
```

### Lost or stolen device — response

```
RESPONSE PROCEDURE:

  T+0     Engineer reports device lost / stolen
  T+5min  Open ZopNight → My PATs
  T+5min  Identify PATs tied to lost device (by description)
  T+6min  Revoke immediately
  
  Other devices continue working (different PATs)
  Issue new PAT for replacement device when available
  
LATENCY:
  PAT revocation effective within 60 seconds
  AI tools on the lost device receive 401 on next call
  No way for the lost device to continue using the revoked PAT
```

Speed matters. The longer the PAT is valid on a lost device, the bigger the exposure window.

### Compromise scenarios

```
SCENARIO 1: PAT pushed to public Git
  Action: revoke immediately; rotate; audit recent usage
  Forensics: check audit log for unfamiliar usage from the
             time of push to revocation
  
SCENARIO 2: PAT in old chat / Slack message
  Action: rotate when discovered; verify chat is purged
  Mitigation: secrets scanning on chat archives going forward
  
SCENARIO 3: Suspected insider misuse
  Action: revoke; investigate via audit log; report per
          security incident process
  Forensics: full audit log review for the user's recent activity
  
SCENARIO 4: Engineer leaves the company
  Action: revoke all their PATs (HR-triggered process)
  Verify: zero MCP calls from those PATs after revocation
  
SCENARIO 5: User account compromised
  Action: revoke ALL PATs for that user
  Investigate via audit log
  Reset user's password / re-authenticate SSO
  Investigate downstream actions taken
```

Each scenario has a runbook. Document them; rehearse them annually via tabletop.

### PAT description discipline

```
BAD DESCRIPTIONS (avoid):
  "test"
  "for stuff"
  "delete me"
  "" (empty)
  
GOOD DESCRIPTIONS:
  "Claude Code on jane-mbp 2026-Q2"
  "Cursor on dev-vm prod-account 2026-Q2"
  "CI cron audit-export 2026-Q2"
  "Datadog integration"
  "Notion integration via MCP-Notion 2026-Q2"

WHY: makes rotation easier ("rotate all jane-mbp PATs")
     Makes incident response easier ("revoke devices in IP range
     XYZ")
     Makes audit logs readable ("PAT description: Cursor on jane-mbp")
```

### Centralized PAT policy (compliance-heavy orgs)

```
ORG CAN REQUIRE (Settings → Org → API → PAT Policy):
  
  Max PAT age (e.g., 90 days; cannot create beyond)
  Manager approval required for new PATs (workflow)
  Scope restrictions (always read-only; no further)
  PAT description required (cannot be empty)
  Rotation reminders at 60 / 75 / 85 days
  Auto-deactivation on expiry
```

These policies layer on top of individual PAT discipline. Customer chooses what to enforce centrally.

### Quarterly rotation runbook

```
WEEK 1 OF QUARTER (e.g., week of Jan 1, Apr 1, Jul 1, Oct 1):
  List PATs older than 60 days (ZopNight UI / API)
  Notify users via email: "your PAT XYZ expires in 30 days"
  Provide 1-week window for self-rotation
  Provide updated rotation runbook link

WEEK 2:
  Generate fresh PATs for users who didn't self-rotate
  Block usage of stale PATs (or escalate to user's manager)
  Update SIEM rules if needed

WEEK 3:
  Audit: zero PATs >90 days old? Verify.
  File quarterly compliance report
  Update org's runbook based on lessons learned
```

The runbook is reusable each quarter. Document it once; execute four times a year.

### Cost

```
PAT generation: free
PAT rotation: free
PAT storage: free (metadata only)
Audit log entries: per ZopNight's pricing
LLM tokens: paid by AI tool, not ZopNight

So rotation has no infra cost — only ops effort.
```

---

## 2. Demo

A quarterly rotation cycle:

```
DAY 1 (Quarter start):
  Email: "Your PAT 'Claude Code on jane-mbp 2026-Q1' expires
  in 14 days. Plan to rotate this week."

DAY 2 (Jane responds):
  Jane opens ZopNight → Settings → API → My PATs
  Clicks "Generate new" → "Claude Code on jane-mbp 2026-Q2"
  Same scopes; new description with the new quarter
  Generated: zn_pat_b3c5d7... (copies immediately)
  
  Updates ~/.claude/mcp.json env var ZN_PAT:
    export ZN_PAT="zn_pat_b3c5d7..."  
  
  Restarts shell + Claude Code
  
  Verifies new PAT works:
    > /mcp
    ✓ zopnight: 43 tools
    > "Who am I?"
    ✓ "jane@platform in Acme Corp"
  
  Revokes old PAT in ZopNight UI
  
  Audit log records:
    User: jane@platform
    Action: pat_rotate
    Old PAT: pat_abc123 (revoked)
    New PAT: pat_def456 (created)
    
ELAPSED: 5 minutes
DISRUPTION: 30 seconds while Claude Code restarts
```

---

## 3. Hands-on (5 min)

Audit your own PATs:

```
TOTAL PATs you have:    _____

OLDEST PAT:
  Age:           _____ days
  Description:   __________
  Action needed: rotate / fine

PATs with vague descriptions (rename or replace):
  __________
  __________

PATs >75 days old (rotate this week):
  __________
  __________

ROTATION PLAN:
  □ Self-rotate this week
  □ Document in team wiki
  □ Set calendar reminder for next quarter

SECRETS-MANAGER integration:
  □ Yes (which: __________)
  □ No (consider automating quarterly rotation)
```

---

## 4. Knowledge check

### Q1
Quarterly PAT rotation:

A. Excessive overhead
B. Industry standard for bearer tokens. Limits exposure if leaked. 90 days balances security (bounded window) with operational overhead (not constant pressure). Most security frameworks specify quarterly or shorter rotation.
C. Annual is sufficient
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Quarterly is the industry norm for bearer credentials.
</details>

### Q2
Safe rotation order:

A. Revoke old PAT first, then generate new
B. Generate new → update client config → restart client → verify new works → THEN revoke old. Verifying before revoking prevents the agent from breaking if the new PAT is bad. The five-step sequence is the discipline.
C. Random order
D. Both at the same time

<details>
<summary>Show answer</summary>

**Correct: B.** Verify before revoke. Order is the discipline.
</details>

### Q3
PAT accidentally pushed to public Git:

A. Wait and see
B. Revoke immediately. Investigate via audit log for any usage during the exposure window. Rotate the credential (new PAT for the same user). Document the incident. Consider strengthening commit hooks to prevent recurrence (secrets scanning).
C. Random
D. Tweet about it

<details>
<summary>Show answer</summary>

**Correct: B.** Immediate revoke + investigate + rotate + harden process.
</details>

---

## 5. Apply

Quarterly rotation runbook in your team wiki. Clear PAT descriptions. Automated rotation via secret manager for teams >20 engineers. Document compromise-response procedures for each of the 5 scenarios.

ZopNight's Settings → Personal Access Tokens supports the rotation lifecycle natively.

---

## Related lessons

- [L1 — PAT basics](L1_pat_basics.md)
- [L2 — Org-level toggle](L2_org_toggle.md)
- [L3 — Audit logging](L3_audit.md)
- [M6.5 — Team-shared workflows](../M6.5_team_prompts/00_README.md)

## Glossary terms touched

[PAT rotation](../../../reference/glossary/pat-rotation.md) · [Safe rotation order](../../../reference/glossary/safe-rotation-order.md) · [Secrets manager integration](../../../reference/glossary/secrets-manager-integration.md) · [Compromise response](../../../reference/glossary/compromise-response.md) · [Quarterly runbook](../../../reference/glossary/quarterly-runbook.md)

---

## Module quiz

Complete M6.3 → 10-question quiz unlocks the **MCP-Trusted** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.3.L4
