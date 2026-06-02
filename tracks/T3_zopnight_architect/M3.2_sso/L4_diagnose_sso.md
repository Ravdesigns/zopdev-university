# Diagnosing SSO failures

§ T3 · M3.2 · L4 of 4 · Architect tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **classify** an SSO failure into one of four root-cause categories, **apply** the right fix from each category, **and know** when to escalate to ZopNight support with the trace ID.

---

| | |
|---|---|
| **Tier** | Architect |
| **JTBD** | "Get a stuck user logged in without a 30-minute back-and-forth." |
| **Personas** | Platform Engineer · Security/Compliance · IT Admin |
| **Prerequisites** | M3.2.L1-L3 (SSO methods configured) |
| **Time** | 8 minutes |
| **Bloom verb** | Classify (Analyze), Apply (Apply), Know (Remember) |

---

## 1. Concept

SSO failures look chaotic in the moment — a user reports "I can't log in," the screenshot is unhelpful, and the IdP and ZopNight are pointing at each other. The reality is that 95% of failures fall into four categories, each with distinct symptoms and standard fixes. Classifying first, fixing second is the discipline that turns a 30-minute support spiral into a 5-minute resolution.

```
CATEGORY               TYPICAL SYMPTOM                        OWNER
──────────────────────────────────────────────────────────────────────
1. Certificate         "Invalid signature" / "Cert expired"   IdP-side
                                                              (or stored
                                                              cert stale)
                                                              
2. Metadata drift      "Audience mismatch" / "Entity ID"      Config-side
                       errors                                  (either side)
                       
3. Clock / timing      "Assertion expired" within seconds      Both sides
                                                              (NTP sync)
                                                              
4. User-side           "User not found" / wrong role /         Attribute
                       wrong team                              mapping
```

The diagnostic flow is: read the audit log, identify the category, apply the fix. If two cycles do not resolve, escalate.

### Category 1 — Certificate issues

Cert issues are the most common SAML failure mode after the initial setup is complete and stable. The cert worked for months, then suddenly does not.

```
SYMPTOM                          ROOT CAUSE                       FIX
──────────────────────────────────────────────────────────────────────
"Invalid SAML signature"          IdP's signing cert does not       Re-fetch metadata URL
                                  match the cert ZopNight stored.   in ZopNight; or re-upload
                                  Often after IdP cert rotation.    cert manually.
                                  
"Certificate expired"             IdP cert has passed its expiry    Generate new cert at
                                  date.                              IdP; update ZopNight
                                                                    config; renew the
                                                                    calendar reminder.
                                                                    
"Could not validate certificate"  Cert format issue (missing PEM    Re-export the cert in
                                  headers, incomplete chain).        PEM format with full
                                                                    chain (root + intermediate
                                                                    + leaf).
```

The cert-expiry case is preventable. ZopNight surfaces cert expiry on the SAML admin page with warnings at 60 days, 30 days, 7 days. A clean ops practice is to set an external calendar reminder for 90 days before expiry — that gives time to generate, deploy, and test the new cert without pressure.

### Category 2 — Metadata drift

Drift happens when the IdP-side config changes (often during routine maintenance) and ZopNight's stored copy gets out of date.

```
SYMPTOM                          ROOT CAUSE                       FIX
──────────────────────────────────────────────────────────────────────
"Metadata mismatch" / "Audience  IdP changed entity ID, ACS URL,   Re-fetch metadata URL.
mismatch"                        or other metadata fields.          ZopNight repopulates from
                                                                    canonical IdP source.
                                                                    
"User attribute missing"          IdP attribute mapping changed     Re-check IdP attribute
                                  (email no longer sent, or sent    config; verify ZopNight's
                                  with different claim name).        attribute mapping matches.
                                  
"Domain mismatch"                 User signed in from a domain       Either add a SAML config
                                  with no matching SAML config.      for that domain, or have
                                                                    the user use a different
                                                                    method (OAuth fallback).
```

A simple practice: when an IdP admin changes anything in the IdP-side SAML app, re-test the ZopNight flow within the same change window. Catches drift immediately rather than days later when a user reports the issue.

### Category 3 — Clock + timing

SAML assertions have a 5-minute validity window by design (protection against replay attacks). If the clocks on the IdP and ZopNight diverge by more than 5 minutes, every assertion is "expired on arrival."

```
SYMPTOM                          ROOT CAUSE                       FIX
──────────────────────────────────────────────────────────────────────
"Assertion expired" within         Clock skew between IdP and       Verify NTP is configured
seconds of assertion issue        ZopNight servers exceeds the      and syncing on both
                                  5-minute tolerance.                sides. Cloud-hosted IdPs
                                                                    rarely have this issue;
                                                                    self-hosted IdPs do.
                                                                    
"Replay attack detected"          Cached/stored assertion replayed   Clear browser cache, sign
                                  by browser (or page back-button).  in fresh. Confirm 
                                                                    not a real attack via
                                                                    audit-log review.
```

For OAuth, timing issues are less common because OAuth uses ephemeral codes (single-use, short-lived) rather than time-bound assertions.

### Category 4 — User-side issues

The user authenticated correctly but ZopNight cannot provision or route the user properly.

```
SYMPTOM                          ROOT CAUSE                       FIX
──────────────────────────────────────────────────────────────────────
"User not provisioned"             Auto-provisioning is disabled    Enable auto-provisioning,
                                  or the default role is not set.   set a default role, or
                                                                    manually create the user.
                                                                    
"Role missing"                     User provisioned but no role      Set a default role for
                                  was assigned at provisioning.     SAML-provisioned users in
                                                                    Settings → Authentication.
                                                                    
"Wrong team"                       Attribute mapping does not put    Map IdP group claim to
                                  user in the expected team.        ZopNight team in Settings
                                                                    → Teams → SAML group mapping.
                                                                    
"Domain allowlist rejected"        OAuth user's email domain not    Add domain to allowlist,
                                  in the allowlist.                  or reject the user as
                                                                    intended.
```

The wrong-team case is the subtlest. The user authenticates, is provisioned, lands on a Resources page, and sees nothing — because their team scope is empty (L5 covered this state). The fix is the group-to-team mapping; without it, every new SSO user lands without team context.

### The diagnostic process

```
1. READ the audit log for the failed SSO attempt
   Filter to:
     - method = POST
     - status = 4xx (typically 401 or 403)
     - path contains /auth/ or /saml/ or /oauth/
   The error message and trace ID are in the log entry.
   
2. CROSS-REFERENCE with IdP-side logs
   Most IdPs (Okta, Azure AD) log each SAML assertion issuance.
   Match by timestamp and user.
   If the IdP issued the assertion but ZopNight rejected it: 
     ZopNight-side issue (cert, metadata, clock).
   If the IdP did not issue: 
     IdP-side issue (config, user state, IdP outage).
   
3. CLASSIFY into one of the four categories above
   
4. APPLY the fix
   
5. RETEST the user's login
   If success: done. If still failing: re-classify (you might have
   guessed the wrong category) or escalate.
```

### When to escalate

```
IF you have:
  - Verified cert + metadata correct
  - Confirmed clocks are synced
  - Mapped user attributes correctly
  - Domain config matches
  AND still failing:
  
THEN contact ZopNight support with:
  - The trace ID from the audit log entry
  - Approximate timestamp of the failure
  - The user's email and the SSO method attempted
  - Screenshot of any error message
  
ZopNight support can read server-side logs that surface details not
visible in the customer-facing audit log — encrypted assertion 
contents, low-level SAML parsing errors, internal gateway state.
```

The trace ID is the key. Without it, support has to search across logs by timestamp, which is slow and ambiguous.

---

## 2. Demo

A real-feeling diagnosis flow:

```
USER REPORT: "I get 'Invalid signature' when I try to SSO."

STEP 1: Open ZopNight Audit Log, filter status=401, last 30 min
        → Found: SAML assertion rejected for jane@example.com
        → Trace ID: trc_abc123
        → Error detail: "signature validation failed"
        → Category: 1 (Certificate)

STEP 2: Open Okta admin → SAML app for ZopNight → Certificates
        → Cert status: EXPIRED 3 days ago
        → Cert was scheduled to renew 7 days ago but the renewal
          ticket was missed

STEP 3: ROOT CAUSE confirmed: cert expired at IdP, ZopNight still
        has the old cert (which matched), but now Okta is signing
        with the new cert.
        
        Wait — that means the issue is reversed. ZopNight has the
        OLD cert; Okta is sending assertions signed with NEW cert.
        Signature does not match.

FIX:
  - In Okta: confirm new cert is active (it is)
  - In ZopNight: SAML config → Re-fetch metadata URL
  - ZopNight pulls fresh metadata, picks up new cert
  - Test login: SUCCESS

LEARNING:
  - Add cert renewal calendar reminder (90 days before next expiry)
  - Document the renewal process in the team runbook
  - Confirm Okta's auto-renewal is configured (or set a manual reminder
    on the IdP side too)

ELAPSED: 7 minutes (mostly Okta cert investigation).
```

---

## 3. Hands-on (5 min)

Audit your SAML cert(s) for expiry:

```
SAML CONFIGURATION:    __________ (domain)
CERT EXPIRY DATE:      __________
DAYS REMAINING:        __________

IF <60 days:
  Schedule renewal in IdP                            Date: __________
  Update calendar with reminder at 90/30/7 days      Done: yes / no
  Plan a test sign-in immediately after rotation     Done: yes / no
  
IF you have multiple SAML configs:
  Domain 1: __________  Expires: __________
  Domain 2: __________  Expires: __________
  Domain 3: __________  Expires: __________
```

If you do not have SSO yet, sketch the response runbook for a future "Invalid signature" report: which audit-log filter, which IdP page, which fix.

---

## 4. Knowledge check

### Q1
A user reports "Invalid signature" error on SAML sign-in. Most likely cause:

A. The user typed the wrong password (SAML credentials are not their fault)
B. The IdP signing cert does not match what ZopNight has stored. Common causes: cert expired and was rotated, or IdP-side cert rotation did not propagate. Fix by re-fetching metadata or re-uploading cert.
C. Cloud outage
D. User is not provisioned

<details>
<summary>Show answer</summary>

**Correct: B.** Signature failures are always cert-side, not credential-side. The fix is to align ZopNight's stored cert with whatever the IdP is currently signing with.
</details>

### Q2
Assertions are rejected as "expired" within seconds of issue. Most likely cause:

A. Real expiry — the user took too long to authenticate
B. Clock skew between the IdP and ZopNight servers exceeds the 5-minute tolerance. Verify NTP is syncing on both sides; for self-hosted IdPs this is a real risk.
C. Bug
D. Network latency

<details>
<summary>Show answer</summary>

**Correct: B.** Clock skew is the textbook cause of "assertion expired" errors. SAML's timestamps have a strict tolerance; both sides must stay synced.
</details>

### Q3
A user from `jane@partner.com` cannot log in. ZopNight has a SAML config for `example.com` only. The right diagnosis:

A. Cert expired
B. Domain mismatch — no SAML config exists for `partner.com`. Either add a SAML config for that domain (if the partner has their own IdP), or have the user use a different SSO method (Google/GitHub OAuth with the appropriate allowlist).
C. Random
D. Replay attack

<details>
<summary>Show answer</summary>

**Correct: B.** Domain mismatch is a routing issue. SAML configs are per-domain; users from other domains have no path through SAML. OAuth or per-domain SAML are the two options.
</details>

---

## 5. Apply

Use [Settings → Audit Log](https://app.zopnight.com/settings/audit-log) filtered to authentication failures as the first stop. The trace IDs are the key escalation handle; copy them when filing support tickets.

Maintain a small runbook of common SSO failures and their fixes in your team's wiki — this is the highest-leverage IT/ops document a customer can have.

---

## Related lessons

- [L1 — Pick your SSO](L1_pick_sso.md)
- [L2 — SAML per-email-domain](L2_saml_config.md)
- [L3 — Google + GitHub OAuth](L3_oauth.md)
- [T3.M3.3.L1 — Audit log: what gets recorded](../M3.3_audit_logging/L1_what_logged.md)

## Glossary terms touched

[Trace ID](../../../reference/glossary/trace-id.md) · [Clock skew](../../../reference/glossary/clock-skew.md) · [Audience mismatch](../../../reference/glossary/audience-mismatch.md) · [SSO failure categories](../../../reference/glossary/sso-failure-categories.md)

---

## Module quiz

Complete M3.2 → 10-question module quiz unlocks the **SSO-Architect** chip.

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T3.M3.2.L4
