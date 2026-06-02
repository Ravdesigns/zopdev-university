# Pick your SSO

§ T3 · M3.2 · L1 of 4 · Architect tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **choose** between SAML and OAuth based on org requirements, **explain** the trade-offs of each method, **and recognize** when a customer needs multiple SSO methods simultaneously.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Pick the right SSO method for our org without painting ourselves into a corner six months from now." |
| **Personas** | Platform Engineer · Security/Compliance · IT Admin |
| **Prerequisites** | T0 — Foundations · M3.1 — RBAC fundamentals |
| **Time** | 9 minutes |
| **Bloom verb** | Choose (Evaluate), Explain (Understand), Recognize (Apply) |

---

## 1. Concept

Single Sign-On lets users authenticate once against a trusted identity provider (IdP) and access ZopNight without managing a separate password. ZopNight supports three SSO methods: **SAML** for enterprise IdPs (Okta, Azure AD, OneLogin), **Google OAuth** for Google Workspace orgs, and **GitHub OAuth** for engineering-heavy teams already federated on GitHub.

All three coexist. A customer can enable any combination — SAML as primary, Google OAuth for a contractor pool, GitHub OAuth for an open-source partner team — and each user picks the method that matches their account.

```
SSO METHOD     BEST FOR                              TRADE-OFF
──────────────────────────────────────────────────────────────────
SAML           Enterprises with a central IdP        Per-domain config;
               (Okta, Azure AD, OneLogin, Auth0)    cert management;
                                                     compliance-friendly
                                                     
Google OAuth   Teams already on Google Workspace     Any Google user can
                                                     attempt; need domain
                                                     allowlist for safety
                                                     
GitHub OAuth   Engineering teams on GitHub Enterprise GitHub account
                                                     required; lighter
                                                     compliance posture
```

### Selection criteria

The right choice usually falls out of three questions: where does identity already live, what compliance posture is the customer in, and how heterogeneous is the user population?

```
CRITERION                                    BEST CHOICE
──────────────────────────────────────────────────────────────────
Org already has Okta / Azure AD / OneLogin   SAML (centralizes)
SOC 2 / ISO 27001 audit posture              SAML (compliance trail)
Per-team identity provisioning needed         SAML (group → role)
Mixed users (employees + contractors)         SAML primary +
                                              OAuth for contractors
Pure Google Workspace org                     Google OAuth
Just engineering team, no enterprise IdP      Google or GitHub OAuth
Want shortest setup time                      OAuth (5 min vs 30 min)
Don't want to manage SSO certs                OAuth (no certs)
Need to enforce SCIM auto-provisioning        SAML (well-supported)
```

### SAML: the enterprise default

SAML 2.0 is the assertion-based protocol used by most enterprise IdPs. The customer configures one entry per email domain in ZopNight; users signing in with `jane@example.com` are redirected to the IdP configured for `example.com`. The IdP authenticates, issues a signed XML assertion, and ZopNight validates the signature against the stored cert before creating a session.

SAML's strengths are exactly what compliance teams care about: per-domain configuration is auditable, signing certs are managed centrally, attribute mappings (email, name, group) flow from the IdP, and group claims can drive automatic team assignment. The cost is operational: certs expire annually, metadata can drift, and clock skew between IdP and ZopNight produces puzzling intermittent failures.

### OAuth: the lightweight default

OAuth (Google or GitHub) is faster to enable. Two env vars (client ID + secret), a redirect URI configured at the provider, and the "Sign in with Google" button appears on the login page. No certs, no metadata XML, no per-domain configuration.

The trade-off: OAuth has no built-in domain restriction. Any Google account can attempt sign-in. For most orgs, that's not acceptable as-is — ZopNight applies a **domain allowlist post-OAuth** to bridge the gap. The check happens after the OAuth handshake: if the authenticated user's email is not in the allowlist, ZopNight rejects the session with an explicit message ("This Google account is not allowed for this org").

### Multi-method coexistence

Most mid-size customers end up with one primary method and a secondary for edge cases:

```
PATTERN                                   PRIMARY        SECONDARY
──────────────────────────────────────────────────────────────────
Enterprise with mixed external partners    SAML            Google OAuth
                                                          (contractors)
Pure-Google Workspace mid-stage company    Google OAuth   GitHub OAuth
                                                          (eng partners)
Acquired-then-merged org                   SAML A          SAML B
                                                          (post-acquisition
                                                          consolidation)
```

The user picks the method at login. Account uniqueness is enforced on email — the same `jane@example.com` cannot exist as both SAML and Google OAuth user; whichever method first provisioned the user owns the account.

### How ZopNight uses it

Customer telemetry (anonymized) on enabled SSO methods:

```
SSO STATE                                          % OF CUSTOMERS
──────────────────────────────────────────────────────────────────
SAML only                                          42%
Google OAuth only                                  21%
SAML + Google OAuth                                18%
SAML + GitHub OAuth                                7%
SAML + Google + GitHub                             5%
GitHub OAuth only                                  4%
Password (no SSO)                                  3%  (small/early)
```

The "SAML primary + OAuth secondary" pattern is the most common stable configuration for mid-to-large customers. The "SAML only" enterprises usually require it for compliance and disable any other method.

---

## 2. Demo

Two customers, two methods, two different setup paths:

```
CUSTOMER A — B2B SaaS, 200 employees, on Azure AD
  CHOICE:  SAML via Azure AD
  CONFIG:  1 SAML config in ZopNight (domain=example.com)
  EFFORT:  ~30 minutes (cert setup, attribute mapping, test)
  RESULT:  All users SSO via Azure AD; SCIM provisions new users;
           SOC 2 evidence collection trivial
           
CUSTOMER B — 8-person engineering team, no enterprise IdP
  CHOICE:  Google OAuth (Workspace-backed)
  CONFIG:  Two env vars (client ID + secret) + domain allowlist
  EFFORT:  ~5 minutes
  RESULT:  Engineers sign in with Google; Google's MFA satisfies
           ZopNight's authentication requirement; no cert management
```

Different needs, different methods, both correct.

---

## 3. Hands-on (6 min)

Map your org's identity landscape:

```
PRIMARY IDP (where most user accounts live):   __________

DO YOU HAVE:
  Enterprise IdP (Okta / Azure AD / OneLogin)?       Yes / No
  Google Workspace?                                    Yes / No
  GitHub Enterprise?                                   Yes / No
  Compliance posture (SOC 2 / ISO / HIPAA / etc.)?    __________

USER POPULATION:
  Full-time employees:    _____ headcount
  Contractors/partners:   _____ headcount
  Engineering-only?       _____ Yes / No

RECOMMENDED SSO (based on criteria):
  Primary:    __________
  Secondary:  __________ (or "none")

WHY:
  __________________________________________________________
```

If your primary and secondary differ, that's normal. The choice depends on user heterogeneity.

---

## 4. Knowledge check

### Q1
A team with 500 employees, all on Okta, with a SOC 2 audit next quarter. Best SSO:

A. GitHub OAuth — simplest setup
B. SAML via Okta — enterprise IdP centralizes identity, integrates with existing compliance posture, supports group-based team mapping. The 30-minute setup pays back during the audit.
C. Google OAuth
D. Mix all three

<details>
<summary>Show answer</summary>

**Correct: B.** SAML is the enterprise compliance choice. SOC 2 evidence collection is trivial with SAML's audit trail; OAuth requires more documentation to demonstrate the same controls.
</details>

### Q2
A 5-person startup, all on Google Workspace, no compliance audit on the horizon. Best SSO:

A. SAML — best practice
B. Google OAuth — simpler setup (5 min vs 30 min), no certs to manage, integrates with Google's MFA. Move to SAML later if the org grows into enterprise compliance.
C. GitHub OAuth
D. Password authentication

<details>
<summary>Show answer</summary>

**Correct: B.** At small scale and low compliance burden, OAuth's simplicity wins. Migrating to SAML later is straightforward — accounts persist by email.
</details>

### Q3
Can multiple SSO methods coexist in the same ZopNight org?

A. No, pick one
B. Yes — SAML + Google OAuth + GitHub OAuth can all be enabled at once. Users pick the method at login. Account uniqueness is enforced on email.
C. Only two methods
D. SAML overrides others

<details>
<summary>Show answer</summary>

**Correct: B.** Multi-method is supported. Common pattern: SAML for employees, OAuth for contractors. The per-method config is independent.
</details>

---

## 5. Apply

Configure SSO methods in [Settings → Authentication](https://app.zopnight.com/settings/authentication). The page shows all enabled methods, their status, and per-method test buttons. New users picking a method see only the enabled set; admins can toggle methods independently.

A recommendation: enable a backup login method (password or break-glass) for one admin account, kept under physical key control. SSO providers occasionally have outages; you want a way back in.

---

## Related lessons

- [L2 — SAML per-email-domain](L2_saml_config.md) *(next)*
- [L3 — Google + GitHub OAuth](L3_oauth.md)
- [L4 — Diagnosing SSO failures](L4_diagnose_sso.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[SAML](../../../reference/glossary/saml.md) · [OAuth 2.0](../../../reference/glossary/oauth.md) · [Identity Provider](../../../reference/glossary/identity-provider.md) · [Domain allowlist](../../../reference/glossary/domain-allowlist.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.2.L1
