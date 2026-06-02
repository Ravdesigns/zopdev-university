# Org-level MCP toggle

§ T6 · M6.3 · L2 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **use** the org-level MCP toggle as a central kill switch, **execute** a deliberate MCP rollout pattern, **and explain** the four-layer compliance posture to a CISO.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Roll out MCP deliberately to the org with the right gates; have a kill switch for incidents." |
| **Personas** | Security/Compliance · Org Admin · FinOps Lead |
| **Prerequisites** | M6.3.L1 (PAT basics) |
| **Time** | 9 minutes |
| **Bloom verb** | Use (Apply), Execute (Apply), Explain (Understand) |

---

## 1. Concept

Before any individual PAT can connect to MCP, the org must enable MCP at the organization level. This is the central kill switch — one toggle stops all MCP activity. It exists because compliance teams need a single, auditable lever to control AI-agent access to cost data.

```
ORG SETTING (ZopNight admin only):
  MCP Access: ENABLED  |  DISABLED
  
  ENABLED:  users can create PATs and connect AI agents
  DISABLED: PATs reject all MCP connection attempts
```

The toggle is per-org, not per-user. It's the foundation; individual PATs are the next layer (M6.3.L1).

### Where the toggle lives

```
ZopNight UI:
  Settings → Organization → Access → MCP
  
  Toggle: "Allow MCP connections"
  Audit log shows when toggled and by whom
  Required reason field for audit trail
```

### Default state

```
NEW ORGS: MCP disabled by default (opt-in)
EXISTING orgs at time of MCP rollout: opt-in via the toggle

WHY OPT-IN by default:
  Don't surprise compliance / security teams
  Force a deliberate decision before AI access exists
  Customer can read the docs (M6.1, M6.2), discuss internally, enable
  Reduces "we didn't realize AI was on" scenarios
```

Opt-in by default is the safer position for AI integration features. Customers turn it on when they're ready.

### Who can toggle

```
ROLES that can change the toggle:
  Organization Admin
  Owner

ROLES that cannot:
  Member, Viewer, custom roles without org:update policy

This prevents an engineer from unilaterally enabling. The decision
is intentionally restricted to org-level admins.
```

### What disabling does

```
WHEN TOGGLED OFF:
  ✓ Existing PATs continue to work for non-MCP APIs
  ✓ Existing MCP connections receive "MCP_DISABLED" error on next call
  ✓ New MCP connections fail immediately
  ✓ Users see clear error: "MCP is disabled by org admin"
  ✓ Non-MCP API + UI calls continue normally
  
EFFECT: ALL MCP activity stops within ~30 seconds of toggle.
```

So if a security incident happens or compliance requests a halt, one click stops everything. Other ZopNight operations continue.

### Audit trail of the toggle

```
EVERY toggle change is logged in the audit log:
  Timestamp
  Admin user who toggled
  Old state → new state
  Reason (recommended; optional but expected)

Sample audit entry:
  2026-05-21 14:32 UTC
  user: admin@acme.com
  org: org_acme123
  action: mcp.toggle_disabled
  reason: "Security investigation 2026-05-15-001"
  
Visible in audit log; surfaces in compliance reports.
```

### Recommended rollout pattern

```
1. INTERNAL DISCUSSION (FinOps + sec + eng leadership):
   Confirm read-only architecture is acceptable
   Review M6.1, M6.2, M6.3
   Identify pilot users

2. READ MCP DOCS thoroughly (this module + the docs site)

3. CONFIRM READ-ONLY CONTRACT with security team:
   Walk through M6.1.L2
   Address CISO concerns

4. ENABLE MCP at org level
   Reason field: "Initial MCP enablement, pilot rollout"

5. COMMUNICATE to team:
   "MCP enabled. Generate PATs at Settings → PATs."
   "Read M6.2 for your AI tool's setup."
   "Pilot users: <list>"

6. PILOT with 3-5 engineers for 2-4 weeks
   Collect feedback
   Refine rollout patterns

7. EXPAND to broader team
   Document common workflows
   Build the recipe library (M6.4)
   Train new engineers in onboarding

DON'T enable silently. The deliberate process is the point.
```

### The four-layer compliance posture

When the CISO asks "How is AI agent access to cost data controlled?":

```
LAYER 1 — Org-level toggle (you control)
  Can be disabled with one click; we control the lever.
  
LAYER 2 — Per-user PAT (you provision)
  Each user has their own PAT; rotated quarterly; revocable.
  
LAYER 3 — Read-only by design (ZopNight contract)
  Architectural: agents cannot mutate; no tool exists to do so.
  
LAYER 4 — Audit log on all PAT issuance + MCP calls
  Every action logged; SIEM export for long retention.
```

Four independent controls; any one can be tightened or relaxed without the others. CISO conversations are easier when these layers are documented.

### When to disable

```
TEMPORARILY:
  Active security investigation (suspected breach)
  Compliance audit ongoing (auditor wants no AI access during)
  Migration / maintenance window (system instability)
  Pre-renewal review (vendor change consideration)

PERMANENTLY:
  Org policy decision against AI agents
  Customer chose not to adopt
  Regulatory requirement prohibits agent access
```

### Re-enabling

```
TOGGLE BACK ON:
  ✓ Existing PATs immediately work again
  ✓ No re-provisioning needed
  ✓ Audit log records the re-enable + reason

Smooth re-enable means temporary disables don't disrupt
workflows long-term. Engineers' AI tools reconnect on next call.
```

### Cost

```
MCP toggle: free
PATs: free
Storage of PAT metadata: free
MCP server execution: free (runs on customer's machine for local mode;
                              ZopNight infra for hosted)
ZopNight side: zero charge per MCP call

LLM INFERENCE COST: paid by the AI tool (Claude / Cursor / Codex / etc.)
                    Customer's contract with their AI tool provider
                    Independent of ZopNight pricing.
```

Adoption isn't gated by ZopNight pricing. The cost is in the AI tool's per-token charges.

### Multi-org accounts

For customers with multiple ZopNight orgs (e.g., one per BU after M&A):

```
EACH ORG has its own toggle.
TOGGLE STATE is per-org.

EXAMPLE:
  acme-prod-org:   MCP enabled
  acme-staging:    MCP enabled
  acme-acquired:   MCP disabled (pending compliance review)
  
A user with PATs across multiple orgs sees different behavior
per org based on each org's toggle.
```

### Integration with PAT policy

```
ORG-LEVEL toggle interacts with PAT policy (Settings → Org → API):

  PAT POLICY can require:
    Max PAT age (e.g., 90 days)
    Manager approval for new PATs
    Forced rotation cadence
    Restricted PAT scopes
    
  If MCP toggle is off: PAT policy doesn't apply (no MCP usage)
  If MCP toggle is on: PAT policy + MCP toggle are layered controls
```

---

## 2. Demo

A real incident-driven toggle disable + re-enable:

```
SCENARIO: Acme Corp's CISO asks to disable MCP during a sec
          investigation triggered by unrelated incident.

ADMIN ACTION:
  T+0:00   Open Settings → Org → Access → MCP
  T+0:30   Toggle off
  T+0:45   Reason field: "Security investigation 2026-05-15-001;
                          temporary disable pending forensics"
  T+1:00   Save

EFFECT:
  T+0:30   Audit log entry created
  T+0:45   All MCP connections drop within 30 seconds
  T+1:00   Engineers see in their AI tools:
            "MCP_DISABLED: ZopNight MCP is disabled by org admin"
  T+1:00   Non-MCP API + UI calls continue normally

INVESTIGATION proceeds for 2 days; no findings related to MCP.

ADMIN ACTION (resolution):
  T+48h    Toggle MCP back on
  T+48h    Reason field: "Security investigation closed (2026-05-15-001);
                          no MCP-related findings; re-enabling"
  T+48h    All previously-connected agents reconnect
  T+48h    Audit log records re-enable

TOTAL DISRUPTION:
  Agent workflow paused for 2 days
  Non-agent operations: unaffected
  Engineers reverted to dashboard during the window
  Re-enable: smooth; no PAT regeneration needed
```

The toggle is designed for exactly this scenario.

---

## 3. Hands-on (5 min)

If you're an Org Admin:

```
□ LOCATE the toggle in Settings → Organization → Access → MCP
□ NOTE current state: Enabled / Disabled
□ REVIEW audit log for toggle history (if any)
□ IDENTIFY: who else can toggle (Admins / Owners list)
□ DOCUMENT: rollout pattern in your team wiki
```

If you're not an Org Admin:

```
□ CHECK whether your org has MCP enabled
  (try connecting via M6.2; if "MCP_DISABLED" → toggle is off)
□ IDENTIFY who in your org can enable
□ REQUEST enablement if appropriate (use M6.1 docs to justify)
```

For new MCP rollouts, follow the 7-step pattern in the lesson.

---

## 4. Knowledge check

### Q1
MCP for a new ZopNight org:

A. Enabled by default — ready for agents
B. Disabled by default. Opt-in via admin toggle. Forces a deliberate decision; reduces "we didn't realize AI was on" scenarios. The customer reads the docs, discusses internally, enables when ready.
C. Always enabled (cannot disable)
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Disabled by default; opt-in. The deliberate process is the point.
</details>

### Q2
Disabling the org toggle:

A. Disrupts all non-MCP API calls too
B. Only affects MCP. Non-MCP API + UI calls continue normally. The toggle's blast radius is bounded to MCP activity; other ZopNight operations are unaffected. This makes it safe to use as an emergency lever.
C. Random
D. Deletes all PATs

<details>
<summary>Show answer</summary>

**Correct: B.** Scoped impact — MCP only.
</details>

### Q3
Who can toggle MCP access:

A. Any engineer with a PAT
B. Organization Admins and Owners. Members, Viewers, and custom roles without `org:update` policy cannot. The decision is intentionally restricted to privileged roles to prevent unilateral enablement.
C. Random
D. Anyone with a PAT

<details>
<summary>Show answer</summary>

**Correct: B.** Privileged role required.
</details>

---

## 5. Apply

Org-level MCP toggle is the foundation. Default disabled; opt-in deliberately. Document the four-layer compliance posture for CISO conversations.

For incident scenarios: the toggle is the right emergency lever. 30-second disable; smooth re-enable.

---

## Related lessons

- [L1 — PAT basics](L1_pat_basics.md)
- [L3 — Audit logging for MCP](L3_audit.md) *(next)*
- [L4 — PAT rotation](L4_rotation.md)
- [T3.M3.3 — Audit logging fundamentals](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Org-level toggle](../../../reference/glossary/org-level-toggle.md) · [MCP_DISABLED error](../../../reference/glossary/mcp-disabled-error.md) · [Four-layer compliance](../../../reference/glossary/four-layer-compliance.md) · [Rollout pattern](../../../reference/glossary/rollout-pattern.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.3.L2
