# The PAT — what it grants

§ T6 · M6.3 · L1 of 4 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **create** and scope a PAT correctly, **explain** the inheritance model (PAT inherits user policies), **and choose** the right naming + expiry for traceable rotation.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Create a PAT that grants exactly the access the user has, no more, with naming that supports rotation later." |
| **Personas** | Platform Engineer · Security/Compliance · FinOps Lead |
| **Prerequisites** | T3.M3.1 (RBAC) · M6.1 (MCP concept) |
| **Time** | 9 minutes |
| **Bloom verb** | Create (Apply), Explain (Understand), Choose (Apply) |

---

## 1. Concept

A PAT (Personal Access Token) is an opaque bearer credential that authenticates an API user. ZopNight PATs follow a deliberately simple model: read-only by design (for MCP), user-scoped (inherits the user's policies), revocable, and rotatable.

```
ZOPNIGHT PAT PROPERTIES:
  Format:       zn_pat_xxxxxxxxxxxxxxxx (32-char identifier)
  Scope:        Read-only (cannot be changed; architectural)
  User-scoped:  Inherits the user's policies; the org is resolved
                per call with a membership check, so one PAT reaches
                every org the user belongs to (there is no org_id on
                the token itself)
  Expiry:       7 to 365 days (90 days typical)
  Revocable:    Can be revoked anytime in Settings
  Tied to user: When user is removed, PAT deactivates
```

### What a PAT grants

The PAT inherits the user's RBAC policies — no more, no less:

```
USER:      jane@team.com
ROLE:      Engineer
POLICIES:  resource:view, schedule:view+create,
           recommendation:view+apply

PAT INHERITS:
  All read policies the user has (for MCP read-only context)
  Cannot grant policies the user doesn't have
  Cannot be used to read data outside the user's scope
  Cannot be configured for write access (architectural)
```

So the PAT is effectively the user's read-mostly powers, but limited to read-only for MCP. If the user is team-scoped, the PAT is team-scoped. If the user is admin, the PAT can still only read (not write) through MCP.

### Why per-PAT scoping isn't supported

```
DESIGN CHOICE: PAT inherits user policies entirely; no per-PAT
              customization.

REASONS:
  Simpler mental model (user is the source of truth)
  User's role is the canonical authorization
  Per-PAT scoping = configuration explosion (every PAT a snowflake)
  Audit cleaner (PAT activity ↔ user activity)
  
IF YOU NEED different access patterns:
  Create different users with different roles
  Each user has their own PATs
  Keeps the model clean
```

This is a deliberate constraint. Some other vendors offer per-token scopes; ZopNight chose simplicity.

### Multiple PATs per user

A user can have many PATs (one per device, one per integration). Each PAT is independent — revoke one without affecting the others.

```
EXAMPLE USER PATs:
  laptop-desktop:     PAT for Claude Desktop on laptop
  workstation:        PAT for Claude Desktop on workstation
  cursor:             PAT for Cursor IDE on laptop
  ci-bot:             PAT for CI/CD agent that reads MCP

NAMING matters: easier to identify which PAT did what in audit logs.
                Easier to rotate the right one when a device is lost.
```

### Non-human users (service accounts)

For automation, bots, and CI/CD agents:

```
RECOMMENDED:
  Create a dedicated user (e.g., ci-bot@team.com) with appropriate role
  Generate a PAT for that user
  Treat the user as the bot's identity
  
NOT RECOMMENDED:
  Use a human user's PAT for bots
  → Loses traceability ("who did this action?")
  → If human leaves, bot breaks
  → Auditor concerns
```

The dedicated-user pattern keeps human and bot activity cleanly separated in audit logs.

### Expiry mechanics

```
PAT EXPIRY:
  Automatic deletion at expiry (no manual cleanup needed)
  User notified by email 7 days before expiry
  After expiry, the token returns 401 on all API calls
  Cannot be "renewed" — must create a new PAT

TYPICAL EXPIRY CHOICES:
  90 days:   Standard for personal MCP integrations
  180 days:  Power users / FinOps team
  365 days:  Sysadmin / CI bots (with stricter rotation discipline)
  7-30 days: Temporary access for contractors / pilots
```

90-day expiry is the most common starting point. Longer expiry is acceptable when paired with strong rotation discipline.

### PAT vs API key

```
PAT:                              CLOUD-NATIVE API KEY:
  ZopNight-specific                 Cloud provider (AWS/GCP/Azure)
  User-tied                          Often service-account-tied
  Read-only (MCP scope)              Various scopes
  Rotated via ZopNight UI            Rotated via cloud provider
  Audit in ZopNight log              Audit in cloud provider log

Don't confuse them. ZopNight's PAT authenticates against ZopNight;
cloud-provider keys authenticate against the cloud.
```

### Storage best practices

```
DO:
  Store in secrets manager (1Password, Vault, AWS Secrets Manager)
  Load from environment variable in MCP config
  One PAT per device; rotate per device on loss
  Clear, specific PAT descriptions

DON'T:
  Commit to source control
  Paste in chat / Slack / email
  Share PATs between users
  Reuse a PAT across multiple devices (loses isolation)
  Store in plain text files without strong file permissions
```

The PAT is a bearer token — possession is authorization. Treat like a password.

### Audit trail per PAT

Every MCP call logs the PAT ID (not the secret) in the audit log:

```
AUDIT LOG ENTRY:
  Timestamp:   2026-05-21T14:32:00Z
  User:        jane@platform
  PAT ID:      pat_abc123 (not the secret)
  PAT description: "Cursor on laptop"
  Tool called: list_resources
  Filters:     {sort: idle_days}
  Result:      success, 12 results
```

This makes it easy to answer "which device made this call?" — the PAT description identifies the device.

---

## 2. Demo

A clean PAT lifecycle over 90 days:

```
T+0       jane@team.com creates a PAT for Claude Desktop
T+0:30    Settings → Personal Access Tokens → Create
          Name: "Claude Desktop on jane-mbp 2026-Q2"
          Expiry: 90 days
          Generated: zn_pat_8f9a3b... (copied immediately;
                                      shown only once)

T+1 day   Jane uses MCP from Claude Desktop
T+1 day   Each MCP call:
          - Authenticated by zn_pat_8f9a3b...
          - Authorized by jane's policies (Engineer role)
          - Logged in audit: user=jane@team.com via PAT=pat_abc123,
            description="Claude Desktop on jane-mbp 2026-Q2"

T+30 days No usage anomalies in audit log; PAT working normally

T+75 days Jane gets PAT-expiry-soon email notification
          (7 days before automated expiry triggers)

T+80 days Jane creates a new PAT (same name pattern with Q3)
          Updates Claude Desktop config to new PAT
          Verifies new PAT works (asks "Who am I?" via MCP)
          Revokes the old PAT in ZopNight settings

T+90 days Old PAT auto-deleted (already revoked; cleanup completed)

NEXT CYCLE:
  Same pattern repeats for Q3
```

The 5-minute rotation, repeated each quarter, keeps PAT exposure bounded.

---

## 3. Hands-on (5 min)

Create your own PAT:

```
□ STEP 1: Open ZopNight → Settings → Personal Access Tokens
□ STEP 2: Click "Create token"
□ STEP 3: Configure:
  Name:        __________ (specific: "tool on device YYYY-QN")
  Expiry:      90 days (default) or __________
  Description: __________

□ STEP 4: Copy the token immediately (shown only once)
□ STEP 5: Store securely:
  □ 1Password / Bitwarden / secrets manager
  □ Environment variable in ~/.zshrc (with 0600 perms on file)
  □ Cloud secrets manager (AWS Secrets, etc.)

□ STEP 6: Configure in your MCP tool (see M6.2)
□ STEP 7: Verify connection (see M6.2.L4)

REVIEW your existing PATs:
  Total PATs: _____
  Any with vague descriptions? _____
  Any >75 days old? _____ (plan rotation)
```

If you have PATs with vague descriptions ("test", "for stuff"), rename or replace them.

---

## 4. Knowledge check

### Q1
A PAT grants:

A. Whatever the admin configures
B. The same policies as the user it's tied to — inherited, not customized. Cannot grant more than the user has. Cannot be configured for write access via MCP (architectural). The model: user is source of truth; PATs are scoped access tokens for that user.
C. Random
D. All access

<details>
<summary>Show answer</summary>

**Correct: B.** User-scoped inheritance. Simpler than per-token scopes.
</details>

### Q2
A user has 5 PATs. The user is removed from the org. The PATs:

A. Remain active until they expire
B. Are deactivated. PATs are tied to the user. User deletion deactivates them immediately. This is why bots/automation should use a dedicated user, not a human's PAT — when humans leave, bots shouldn't break.
C. Random
D. Convert to org tokens

<details>
<summary>Show answer</summary>

**Correct: B.** PATs are user-scoped; user deletion deactivates them.
</details>

### Q3
For a CI/CD bot needing MCP access:

A. Use any engineer's PAT
B. Create a dedicated user (e.g., ci-bot@team.com) with appropriate role, then create a PAT for that user. Traceability preserved (bot's activity isn't conflated with a human's); bot continues to work when humans leave; auditor-friendly.
C. Random
D. Hardcode the human user's credentials

<details>
<summary>Show answer</summary>

**Correct: B.** Dedicated bot user. Clean separation.
</details>

---

## 5. Apply

Settings → Personal Access Tokens supports multi-PAT per user. Pattern: one PAT per device with specific naming; rotate per device on loss; quarterly rotation policy for ongoing hygiene.

For bots: dedicated user with own role + PAT. Documented in your team's secrets-management runbook.

---

## Related lessons

- [L2 — Org-level MCP toggle](L2_org_toggle.md) *(next)*
- [L3 — Audit logging for MCP](L3_audit.md)
- [L4 — PAT rotation](L4_rotation.md)
- [T3.M3.1 — RBAC fundamentals](../../T3_zopnight_architect/M3.1_rbac/00_README.md)

## Glossary terms touched

[PAT](../../../reference/glossary/pat.md) · [Bearer credential](../../../reference/glossary/bearer-credential.md) · [Policy inheritance](../../../reference/glossary/policy-inheritance.md) · [Dedicated bot user](../../../reference/glossary/dedicated-bot-user.md) · [PAT description](../../../reference/glossary/pat-description.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.3.L1
