# SAML per-email-domain

§ T3 · M3.2 · L2 of 4 · Architect tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **configure** SAML for an enterprise IdP, **map** user attributes correctly, **and identify** the most common SAML setup mistakes before they hit production.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Get SAML SSO working with our enterprise IdP without spending half a day debugging certs." |
| **Personas** | Platform Engineer · Security/Compliance · IT Admin |
| **Prerequisites** | M3.2.L1 — Pick your SSO |
| **Time** | 10 minutes |
| **Bloom verb** | Configure (Apply), Map (Apply), Identify (Remember) |

---

## 1. Concept

SAML in ZopNight is configured **per email domain**. A user signing in with `jane@example.com` is matched against the SAML config whose domain field equals `example.com`, then redirected to that IdP for authentication. The IdP returns a signed SAML assertion; ZopNight validates the signature, extracts user attributes, and creates a session.

The per-domain approach has two benefits. First, a parent org with multiple email domains (after an acquisition, for example) can route each domain to its own IdP without forcing consolidation. Second, the configuration is bounded — one record per domain, not one per user — which keeps the admin surface manageable.

### A ZopNight SAML config

```yaml
domain:              example.com
idp_name:            Okta
idp_metadata_url:    https://example.okta.com/app/.../sso/saml/metadata
sso_url:             https://example.okta.com/app/.../sso/saml
entity_id:           https://zopnight.io/saml/example-com
acs_url:             https://app.zopnight.com/auth/saml/example-com/callback
certificate:         |
  -----BEGIN CERTIFICATE-----
  MIIDjzCCAnegAwIBAgIJ...
  -----END CERTIFICATE-----
attribute_mappings:
  email:               http://schemas.../emailaddress
  name:                http://schemas.../name
  groups:              http://schemas.../groups
active:               true
```

Most of these fields come from the IdP's metadata. The metadata URL is the canonical source — ZopNight fetches it during setup to populate `sso_url`, `entity_id`, and `certificate` automatically. Pasting metadata XML directly is also supported when the IdP does not expose a URL.

### Setup flow

The bidirectional handshake. Both sides need to know about each other.

```
STEP 1: In the IdP (Okta / Azure AD / OneLogin)
  - Create a SAML 2.0 application
  - Configure ACS (Assertion Consumer Service) URL:
      https://app.zopnight.com/auth/saml/<your-domain>/callback
  - Configure Entity ID / Audience URI:
      https://zopnight.io/saml/<your-domain>
  - Upload (or generate) signing certificate
  - Add attribute mappings (email, name, optionally groups)
  - Save and export metadata URL

STEP 2: In ZopNight Settings → Authentication → SAML
  - Click "Add SAML configuration"
  - Enter the domain (e.g., example.com)
  - Paste the IdP metadata URL
  - ZopNight fetches metadata, populates fields
  - Review attribute mappings
  - Save as Inactive first (for testing)

STEP 3: Test with an admin account
  - Use the "Test SAML config" button in ZopNight
  - Or have one designated user attempt sign-in
  - Verify session is created with correct attributes

STEP 4: Activate
  - Toggle "Active" to true
  - Communicate the change to users
  - Existing password sessions remain valid until expiry
```

### Multi-domain setup

Orgs with multiple email domains configure one SAML record per domain. Each can point to a different IdP if needed.

```
EXAMPLE — Parent Co after acquiring AcmeCo:

  example.com           → Okta (Parent Co's IdP)
  acme.com              → Azure AD (acquired company's IdP)
  consultants.example.com → SAML federation via Okta
  
Each domain has its own config. Users sign in based on their email
domain. No cross-domain leakage; the lookup is exact-match.
```

### Common IdPs and support level

```
IDP                              SUPPORT LEVEL                  NOTES
──────────────────────────────────────────────────────────────────────
Okta                              Tested, documented            Most common
Azure AD                          Tested, documented            Common
OneLogin                          Tested                         Stable
Auth0                             Tested                         Stable
Google Workspace (SAML mode)      Supported                      OAuth often simpler
JumpCloud                         Supported                      Less tested
Custom SAML 2.0                   Supported if standards         May need debugging
                                  compliant
```

Any standards-compliant SAML 2.0 IdP should work. The "tested, documented" label means ZopNight has step-by-step instructions; uncommon IdPs may require reading the SAML spec.

### Attribute mappings

The IdP sends user attributes as SAML claims. ZopNight needs at least `email`; `name` is recommended. `groups` enables automatic team assignment.

```
ZOPNIGHT FIELD       MUST COME FROM              EXAMPLE OKTA ATTR
──────────────────────────────────────────────────────────────────
user.email           IdP claim (required)        user.email
user.name             IdP claim (recommended)    user.firstName + " " + 
                                                  user.lastName
user.teams            IdP group claim (optional) user.memberOf
                                                  (mapped to team name)
```

Group-to-team mapping enables auto-team-assignment: if the IdP claim `groups` contains "platform-team-okta-group", ZopNight maps that to the `platform` team. The mapping is configured in ZopNight Settings → Teams → SAML group mapping.

### Common configuration mistakes

After years of customer onboardings, the mistakes cluster:

```
MISTAKE                         SYMPTOM                        FIX
──────────────────────────────────────────────────────────────────────
Cert mismatch                   "Invalid signature" on          Re-upload IdP cert
                                assertion                       from metadata URL
                                
Clock skew >5 minutes           Timestamp validation fails      Sync system clocks
                                ("Assertion expired" within     via NTP
                                seconds of issue)
                                
Missing email attribute         User not created post-login    Add email mapping in
                                                                IdP's attribute config
                                                                
Cert expiry                     Suddenly fails one day, all     Annual cert renewal
                                users get "Invalid signature"   (set calendar reminder
                                                                90 days before expiry)
                                                                
Wrong ACS URL                   IdP refuses to send the          Match exactly — case-
                                assertion (or sends to wrong    sensitive, including
                                place)                          trailing path segments
                                
Wrong Entity ID / Audience      "Audience does not match"        Match exactly between
                                                                IdP and ZopNight config
                                                                
Multiple bindings (HTTP-POST    Some browsers fail; others       Stick to HTTP-POST
+ HTTP-Redirect)                work                            binding for ACS;
                                                                HTTP-Redirect for SSO
```

The cert-expiry mistake is the most painful because it manifests as a sudden outage. The fix is preventive: every SAML config in ZopNight surfaces the cert expiry date in the admin UI, and a reminder fires 30 days before expiry to the org Admins.

### How ZopNight uses it

The SAML config is stored in the customer's tenant database, encrypted at rest. The certificate is stored separately in the secret manager. Validation happens at the gateway: when a SAML assertion arrives at the ACS endpoint, the gateway checks the signature against the stored cert, validates the timestamps (with a 5-minute clock-skew tolerance), confirms the audience matches the entity ID, and extracts attributes.

If any check fails, the gateway returns a structured error to the user's browser identifying which check failed. This is what makes debugging tractable — the error tells you "Invalid signature" or "Audience mismatch" instead of a generic "SSO failed."

---

## 2. Demo

A first-time SAML setup for `example.com` with Okta:

```
T+0       Admin opens ZopNight Settings → Authentication → SAML
T+30 sec  Clicks "Add SAML configuration"
T+1 min   Enters domain = example.com
T+1 min   Pastes Okta metadata URL:
            https://example.okta.com/app/.../sso/saml/metadata
T+1.5 min ZopNight fetches metadata, populates:
            sso_url, entity_id, certificate
T+2 min   Reviews attribute mappings (email auto-detected; name OK)
T+2.5 min Saves as Inactive
T+3 min   Clicks "Test SAML config" button
T+3.2 min Pops up Okta login → authenticates as self
T+3.4 min ZopNight test session created → attributes shown
T+4 min   Toggles "Active = true"
T+4.5 min Notifies team via Slack: "SAML SSO is live"

ELAPSED:  ~5 minutes for a clean IdP-side setup;
          +15 minutes if Okta-side app needed to be created from scratch
```

---

## 3. Hands-on (6 min)

If you already have SAML configured, audit it:

```
CURRENT SAML CONFIG (your org):

Domain:              __________
IdP:                 __________
Cert expiry:         __________ days from now
                     (if <60 days, schedule renewal)

Attribute mappings:
  email:             mapped to __________
  name:              mapped to __________
  groups:            mapped to __________ (or "not mapped")

ACS URL:             __________
Entity ID:           __________

Has the configuration been tested in the last 90 days?  Yes / No
  (If no, run a test sign-in to confirm still works)
```

If you do not have SAML configured yet, sketch the values you would use given your IdP choice (from L1).

---

## 4. Knowledge check

### Q1
SAML in ZopNight matches users to IdP by:

A. Username
B. Email domain. Each domain has its own SAML config; the user's domain determines which IdP they are redirected to. This enables multi-domain orgs to use different IdPs per domain.
C. Geographic region
D. Username + region

<details>
<summary>Show answer</summary>

**Correct: B.** Email domain is the routing key. This is what enables multi-IdP configurations after acquisitions or for partner federations.
</details>

### Q2
A SAML assertion fails validation with "Invalid signature." Most likely cause:

A. User typed wrong password
B. The IdP's signing cert does not match the cert stored in ZopNight. Most common after a cert renewal at the IdP that did not propagate. Re-upload the cert (or re-fetch metadata URL).
C. Cloud provider error
D. User does not exist

<details>
<summary>Show answer</summary>

**Correct: B.** Signature validation is purely between IdP and ZopNight; user credentials are not part of the check. Cert mismatch is the textbook cause; cert expiry is a related cause with the same symptom.
</details>

### Q3
A new user signs in via SAML for the first time. What happens?

A. Manual ZopNight account creation is required first
B. Account is auto-provisioned on successful SAML. User attributes (email, name, optionally team) flow from the IdP. The user is added to the org and lands in the default role configured for SAML-provisioned users.
C. Admin must approve
D. The user is rejected on first login

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-provisioning on first SSO is the standard pattern. The default role for new SAML users is configured in Settings → Authentication → SAML → Default role. Group-based team assignment happens at the same time if `groups` claim is mapped.
</details>

---

## 5. Apply

Manage SAML configurations in [Settings → Authentication → SAML](https://app.zopnight.com/settings/authentication/saml). The page lists each per-domain config with status, cert expiry, last-tested date, and a "Test" button. Cert expiry warnings appear in the admin dashboard 30 days before expiry.

For multi-IdP setups, each config is independent — disable or rotate one without affecting others.

---

## Related lessons

- [L1 — Pick your SSO](L1_pick_sso.md)
- [L3 — Google + GitHub OAuth](L3_oauth.md) *(next)*
- [L4 — Diagnosing SSO failures](L4_diagnose_sso.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[SAML 2.0](../../../reference/glossary/saml-2.md) · [Assertion Consumer Service](../../../reference/glossary/acs-url.md) · [Entity ID](../../../reference/glossary/entity-id.md) · [Attribute mapping](../../../reference/glossary/attribute-mapping.md) · [SCIM](../../../reference/glossary/scim.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.2.L2
