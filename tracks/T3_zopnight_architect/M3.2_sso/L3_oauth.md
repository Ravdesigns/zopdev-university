# Google + GitHub OAuth

§ T3 · M3.2 · L3 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** Google and GitHub OAuth as ZopNight SSO methods, **secure** the OAuth flow with a domain allowlist, **and understand** when OAuth is the right tool versus when SAML's stronger controls are required.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Enable a low-friction SSO option for teams that do not have an enterprise IdP — without creating an open door." |
| **Personas** | Platform Engineer · Security/Compliance · IT Admin |
| **Prerequisites** | M3.2.L1 — Pick your SSO · M3.2.L2 — SAML config (for contrast) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply), Secure (Evaluate), Understand (Analyze) |

---

## 1. Concept

OAuth (Google or GitHub) is the lightweight SSO option in ZopNight. Setup takes minutes instead of hours, but the trade-off is fewer enterprise controls out-of-the-box — most notably, OAuth has no built-in domain restriction, which is why ZopNight layers a **post-OAuth domain allowlist** to bridge the gap.

The basic OAuth flow is the standard three-legged dance: user clicks "Sign in with Google," is redirected to Google to authenticate, authorizes ZopNight to read profile and email, gets redirected back with an authorization code, ZopNight exchanges the code for an access token, retrieves the user's email, then matches or provisions a ZopNight account.

### Google OAuth setup

```
PREREQUISITES:
  Google Cloud project (separate from your Google Workspace if you have one)
  Admin access to Google Cloud Console

STEPS:
  1. Create OAuth 2.0 Client ID in Google Cloud Console:
       APIs & Services → Credentials → Create Credentials → 
       OAuth client ID → Web application
       
  2. Set Authorized redirect URI:
       https://app.zopnight.com/auth/google/callback
       
  3. Set OAuth consent screen:
       - User type: Internal (Workspace only) OR External (any Google user)
       - Scopes: email, profile
       
  4. Copy Client ID + Client Secret
  
  5. In ZopNight Settings → Authentication → OAuth:
       Method: Google
       Client ID: <copied>
       Client Secret: <copied>
       Domain allowlist: example.com  ← critical for security
       Default role: Viewer or Editor
       
  6. Save and toggle "Active"
  7. "Sign in with Google" button appears on login page
```

### GitHub OAuth setup

```
PREREQUISITES:
  GitHub organization (or personal account)
  Permission to create OAuth Apps in the org

STEPS:
  1. Create OAuth App in GitHub:
       Settings (org) → Developer settings → OAuth Apps → New OAuth App
       
  2. Application name:    ZopNight (internal)
     Homepage URL:        https://app.zopnight.com
     Callback URL:        https://app.zopnight.com/auth/github/callback
     
  3. Copy Client ID; generate and copy Client Secret
  
  4. In ZopNight Settings → Authentication → OAuth:
       Method: GitHub
       Client ID: <copied>
       Client Secret: <copied>
       Required GitHub org membership: <your-org-name>
       Default role: Editor
       
  5. Save and toggle "Active"
  6. "Sign in with GitHub" button appears
```

GitHub's `org membership required` check is the GitHub equivalent of a domain allowlist — only users who are members of the specified GitHub org can complete the sign-in. ZopNight validates the membership via GitHub's API after the OAuth handshake.

### The domain allowlist

The most important configuration setting for OAuth security. Without it, any Google user (or GitHub user) on the internet can attempt sign-in.

```
WITHOUT ALLOWLIST (insecure):
  Any user with a Google account can complete OAuth
  ZopNight provisions them with the default role
  Risk: random people end up in your org

WITH ALLOWLIST (secure):
  After OAuth completes, ZopNight checks the user's email
  If email domain not in allowlist: reject with explicit message
  Risk: zero — only allowed domains can complete sign-in
```

The allowlist supports exact-match (`example.com`) and subdomain wildcard (`*.example.com` matches `partners.example.com` but not `example.com`). Multiple entries are supported, comma-separated.

The post-OAuth check exists because Google's OAuth flow does not natively gate by domain. Even with Google Workspace's "Internal" consent screen, users from other Workspace accounts can sometimes complete the flow depending on settings. The allowlist makes the boundary explicit and ZopNight-controlled.

### OAuth flow in detail

```
T+0      User clicks "Sign in with Google" in ZopNight
T+0.1s   ZopNight redirects user to Google:
           https://accounts.google.com/o/oauth2/v2/auth?
             client_id=<id>&redirect_uri=<callback>&scope=email+profile&
             state=<csrf-token>&response_type=code

T+1s     User authenticates with Google (if not already)
T+2s     User authorizes ZopNight to read profile + email
T+2.1s   Google redirects to:
           https://app.zopnight.com/auth/google/callback?
             code=<auth-code>&state=<csrf-token>

T+2.2s   ZopNight validates state token (CSRF protection)
T+2.3s   ZopNight exchanges auth code for access token:
           POST https://oauth2.googleapis.com/token
T+2.4s   ZopNight fetches user profile:
           GET https://www.googleapis.com/oauth2/v2/userinfo
T+2.5s   ZopNight checks domain allowlist:
           If pass: provision/find user; create session
           If fail: reject with explicit error

T+2.6s   User lands in ZopNight dashboard
```

Five-step round-trip. Most of the latency is network; the ZopNight-side work is small.

### When OAuth is the right choice

```
SCENARIO                                       OAUTH FITS?
──────────────────────────────────────────────────────────
Small team on Google Workspace                  Yes
Engineering team on GitHub Enterprise           Yes
Contractor pool (secondary method)              Yes
Compliance audit requires SAML                   No → use SAML
Multiple email domains needing different IdPs    No → use SAML
Need group-based team assignment                Limited; SAML stronger
Mature enterprise IT with existing IdP          SAML primary;
                                                OAuth secondary
```

### Multi-method coexistence

OAuth and SAML coexist. A typical configuration:

```
PRIMARY:    SAML for full-time employees (example.com)
SECONDARY:  Google OAuth with allowlist=contractors.example.com
TERTIARY:   GitHub OAuth with required org=example-eng

User picks at login. The login screen shows all three buttons
plus an email field that routes to SAML if the entered domain
matches a configured SAML record.
```

### How ZopNight uses OAuth

OAuth-provisioned users default to a configurable role (Viewer or Editor; Admin requires manual promotion). The audit log records "user provisioned via Google OAuth" with the email, role, and timestamp. Subsequent logins by the same email use the existing user record — no duplicate accounts.

The OAuth tokens themselves are not stored long-term. ZopNight uses the OAuth flow only for authentication; ongoing session management is via ZopNight's own session token (JWT or session cookie), refreshed independently.

---

## 2. Demo

A 25-person engineering team rolling out Google OAuth:

```
CONFIGURATION:
  Method:             Google OAuth
  Client ID:          <Google Cloud Console>
  Client Secret:      <Google Cloud Console>
  Domain allowlist:   example.com  (their primary domain)
  Default role:       Editor
  Auto-provision:     Yes

ROLLOUT TIMELINE:
  Day 1: 2 admins test, confirm flow works
  Day 1: 5 engineers test, confirm Google's MFA prompts work
  Day 2: 20 remaining engineers onboarded
  Day 3: 25 users via Google OAuth; zero password sessions remain

OUTCOMES:
  - Setup time: ~10 minutes (Google Cloud Console + ZopNight config)
  - Zero password resets thereafter
  - MFA enforcement comes from Google's MFA settings (already enforced)
  - Audit log shows clean provenance: every login routes through Google
```

If they needed to add a contractor next month with a different email, they would either add the contractor's domain to the allowlist or provision a SAML config for the contractor's org (preferred for stronger isolation).

---

## 3. Hands-on (6 min)

Decide if OAuth fits your team's needs, and sketch the config:

```
PROPOSED METHOD:      Google / GitHub / Both / Neither (use SAML)

IF YES:
  Client ID source:   __________ (Google Cloud project / GitHub OAuth App)
  
  Domain allowlist:   __________
                      __________ (additional, if any)
  
  Default role:       __________ (Viewer / Editor)
  
  Override for high-trust users:
                      __________ (e.g., admins set manually post-OAuth)
  
  Backup login (in case OAuth provider is down):
                      __________ (password for one admin? SAML?)

IF NO (using SAML only):
  Reason:             __________

A test checklist (before live):
  □ Test sign-in with allowed domain → success
  □ Test sign-in with disallowed domain → rejected with clear msg
  □ Test default-role assignment is correct
  □ Test audit log shows OAuth provenance
```

---

## 4. Knowledge check

### Q1
A team uses Google Workspace exclusively, with no enterprise IdP. Best SSO:

A. SAML
B. Google OAuth — simpler setup, no certs, integrates with Workspace MFA. SAML is the choice if compliance audits demand stronger controls or if the team has multiple domains.
C. Password authentication
D. GitHub OAuth

<details>
<summary>Show answer</summary>

**Correct: B.** Google OAuth is the right fit for pure-Workspace orgs. Lower setup cost, MFA from Google, no certs.
</details>

### Q2
OAuth needs to restrict users to a specific domain. The mechanism:

A. Not possible without SAML
B. The post-OAuth domain allowlist in ZopNight. The OAuth provider does not filter; ZopNight applies the check after the authentication completes. Reject is explicit, not silent.
C. Required at the OAuth provider
D. Per-user manual approval

<details>
<summary>Show answer</summary>

**Correct: B.** The allowlist is ZopNight-side. This is the single most important OAuth security control; without it, any Google user could attempt sign-in.
</details>

### Q3
A new user signs in via OAuth for the first time and meets the allowlist check. What happens?

A. Admin must manually approve before they can use the product
B. Auto-provisioned with the default role configured for OAuth-provisioned users. Audit log records "provisioned via Google OAuth" with email, role, timestamp.
C. They see an error
D. They are added but with no role until claimed

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-provisioning is the OAuth default. The default role is configurable per OAuth method; common choice is Editor for engineering teams or Viewer for broader populations.
</details>

---

## 5. Apply

Configure OAuth in [Settings → Authentication → OAuth](https://app.zopnight.com/settings/authentication/oauth). Two env vars per method (Client ID + Secret), plus the allowlist field. Test with one user before announcing to the team.

Recommended: review the OAuth audit log monthly to catch any unexpected user provisioning — useful when the allowlist is broad (e.g., a parent company domain).

---

## Related lessons

- [L1 — Pick your SSO](L1_pick_sso.md)
- [L2 — SAML per-email-domain](L2_saml_config.md)
- [L4 — Diagnosing SSO failures](L4_diagnose_sso.md) *(next)*
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[OAuth 2.0](../../../reference/glossary/oauth.md) · [Authorization code flow](../../../reference/glossary/auth-code-flow.md) · [Domain allowlist](../../../reference/glossary/domain-allowlist.md) · [Redirect URI](../../../reference/glossary/redirect-uri.md) · [Client ID / Secret](../../../reference/glossary/client-credentials.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.2.L3
