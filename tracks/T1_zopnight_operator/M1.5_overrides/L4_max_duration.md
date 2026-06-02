# Max override duration — the org policy

§ T1 · M1.5 · L4 of 4 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** the org-wide Max Override Duration policy **and explain** why it prevents the most common operational hazard.

---

| | |
|---|---|
| **Tier** | Operator (with Admin access) |
| **JTBD** | "Prevent the forgotten override that runs forever." |
| **Personas** | Engineering Leader · Security/Compliance · Admin |
| **Prerequisites** | [L1–L3](L1_when_to_override.md) |
| **Time** | 9 minutes |
| **Bloom verb** | Configure (Apply) and Explain (Understand) |

---

## 1. Concept

The **Max Override Duration** is an org-wide policy setting that caps how long any single override can be active. Default: **7 days**. Configurable: 1 hour to 90 days. Admin-only to change.

The cap exists to prevent a specific failure mode: the override that gets forgotten and runs indefinitely. Without a cap, a force-on override set "for this weekend" survives a team member's departure, an org chart change, three quarterly reviews, and a $40K bill before anyone notices.

### Why 7 days as default

```
TYPICAL OVERRIDE NEEDS                       TYPICAL DURATION
─────────────────────────────────────────────────────────────
Customer demo                                 2-3 days
Maintenance window                            6-12 hours
Incident response                              12-48 hours
DR drill                                       1-2 days
Off-hours work session                         12-24 hours
Holiday weekend coverage                       3-5 days
End-of-quarter business review                 4-5 days
```

The 95th percentile of legitimate override duration is about 5 days. Setting the cap at 7 days gives generous headroom while still preventing the indefinite-runaway pattern.

Anything longer than 7 days is structurally a schedule edit, not an override:

- "Our team works Sundays in May" → edit the schedule for that period
- "Production is non-24/7 in this region" → edit the schedule permanently
- "Our DR site needs to stay on for a month" → edit or new schedule for that resource set

### What happens when the cap is hit

```
USER SETS OVERRIDE expiring 30 days from now.

ZopNight UI validation:
  "Max override duration is 7 days. Reduce to 7 days or less,
   or consider a schedule edit for permanent changes."

Reject. The user adjusts to 7 days, OR cancels and uses a different tool.
```

Admins can change the cap if their organizational needs justify it:

```
SETTINGS → Cost & Scheduling → Max Override Duration
─────────────────────────────────────────────────────
Current value:    7 days
Allowed range:    1 hour to 90 days
Last changed:     2026-04-12 by admin@org.com
                  Reason: "Allow 14-day overrides for DR drills"

[Change value]
```

Changes to the cap are audited.

### Per-resource exceptions (advanced)

For a few organizations with legitimate need for longer overrides on specific resources (e.g., a single DR cluster that needs to stay on for a quarter), per-resource exception is available:

```
RESOURCE: dr-cluster-eu
Override max duration: 90 days (overrides org default of 7 days)
Set by:   security-admin@org.com
Reason:   "DR cluster requires extended overrides for quarterly drills"
```

Per-resource exceptions are admin-only and require a documented reason. They are rare; ~99% of teams use the org default without exceptions.

### Why this matters for compliance

Several compliance frameworks (SOC 2, ISO 27001) ask about "guardrails against indefinite policy bypasses." The Max Override Duration is a defensible answer:

- The policy is configurable
- The default is conservative (7 days)
- Changes are audited
- Per-resource exceptions are documented and admin-only
- Override history is retained indefinitely in the audit log

A SOC 2 auditor reviewing this policy can verify all five properties from the audit log + settings page. The control is testable.

### What this policy does NOT do

Three deliberate limitations:

1. **Does not limit the number of overrides.** A team can have 50 active overrides simultaneously, each within the duration cap. The cap is per-override duration, not total override count.
2. **Does not auto-cancel overrides.** Overrides expire at their set expiry time. The cap rejects creation of long overrides; it does not retroactively shorten existing ones.
3. **Does not enforce a reason quality bar.** The reason field has a minimum length (>10 chars) but no semantic check. "Test test test" passes; "demo for Acme Corp" passes. The reason field is for human reading, not machine validation.

The policy is a guardrail, not a panopticon. It catches the canonical mistake (forever-overrides) without micromanaging legitimate ones.

### Recommended settings per org type

```
ORG TYPE                                  RECOMMENDED MAX DURATION
─────────────────────────────────────────────────────────────────
Small dev team, low compliance burden     7 days (default)
Mid-size SaaS                              7 days (default)
Enterprise with frequent demos             10 days (slight headroom)
Heavily regulated (banking, healthcare)   3 days (tighter)
Highly automated (DR drills weekly)       5 days
```

Most teams should stay at the default. Tightening (to 3 days) reduces the risk window but increases friction; loosening past 14 days defeats the purpose.

---

## 2. Demo

A team setting up the policy on a new ZopNight deployment:

```
DAY 1, T+0       Admin opens Settings → Cost & Scheduling

T+30 sec         Reviews current Max Override Duration: 7 days (default)
T+45 sec         Discusses with FinOps lead: do any workloads need >7 day overrides?

T+2 min          Identifies one: the quarterly DR drill cluster.
T+3 min          Configures per-resource exception for dr-cluster-eu (90 days max).
                  Documents the reason in the per-resource override settings.

T+4 min          Org default stays at 7 days.
                  Settings panel shows:
                    Org default: 7 days
                    Exceptions: 1 (dr-cluster-eu, 90 days)

T+5 min          Admin saves and continues.

DAY 30+   First override attempted with 14-day duration:
                Validation rejects: "Max is 7 days. Use 7-day max or schedule edit."
                Team uses 7-day expiry instead.

NO incidents of forgotten 90-day overrides recorded over the first year.
```

Five minutes of setup. Zero forgotten-override incidents going forward.

(Asset: `assets/diagrams/M1.5_L4_max_duration_setup.svg`.)

---

## 3. Hands-on (5 min)

If you have admin access:

```
1. Open Settings → Cost & Scheduling.
2. Find the Max Override Duration setting.
3. Note the current value and last-changed timestamp.
4. Consider: does this value match your org's typical override needs?
   - Are most overrides shorter than 7 days?
   - Are there any legitimate longer-duration cases?
5. If no changes needed: leave at default.
6. If changes needed:
   - Document the reason
   - Set the new value
   - Save
7. Verify the change is reflected in the override create dialog
   (the validation rejects values past the new cap).

For non-admin users: review the setting (read-only access).
Understand the policy. Use it to inform your override decisions.
```

---

## 4. Knowledge check

### Q1
A team needs to keep a non-prod environment running for a 2-week sprint. The Max Override Duration is 7 days. The right approach:

A. Set two consecutive 7-day overrides
B. The 2-week sprint is too long for an override. Edit the schedule to skip the weekend stops for those two weeks (a schedule edit), or reduce the schedule's active hours during the sprint, then revert after.
C. Get an admin to extend the org policy
D. Manually start resources every day

<details>
<summary>Show answer</summary>

**Correct: B.** Two weeks is structurally a schedule edit, not an override. The cap correctly redirects the team to the right tool.
</details>

### Q2
A user sets an override with 5-day expiry. The org's Max Override Duration is 7 days. What happens:

A. Rejected
B. Accepted — 5 days is within the 7-day cap. Validation only fires when the expiry exceeds the cap.
C. Warns the user
D. Capped automatically

<details>
<summary>Show answer</summary>

**Correct: B.** The cap is the maximum, not a target. Anything within the cap is valid.
</details>

### Q3
A SOC 2 auditor asks: "How do you prevent indefinite policy bypasses?" The defensible response includes:

A. "We trust our engineers"
B. The Max Override Duration cap (default 7 days, audited, admin-only to change), the required expiry on every override, and the audit log of all override events. Together these are a testable control.
C. "Overrides cannot exist"
D. "We don't use overrides"

<details>
<summary>Show answer</summary>

**Correct: B.** The cap is one part of a layered control: required expiry, audit log, admin-only policy changes. Together they form a testable answer to "how is this prevented?"
</details>

---

## 5. Apply

Max Override Duration is in:

- **[Settings → Cost & Scheduling](https://app.zopnight.com/settings/scheduling)** — org-wide default + exceptions
- **[Audit Log](https://app.zopnight.com/audit-logs)** filter to "policy.max_override_duration" — see every change
- **[Override create dialog](https://app.zopnight.com/overrides/new)** — validation enforces the cap

For the broader RBAC model (who can change policy, who can set overrides), see [T3.M3.1](../../T3_zopnight_architect/M3.1_rbac/00_README.md).

---

## Module quiz

You have now completed all four lessons of M1.5. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.5-quiz](../../../certifications/operator/m1.5-quiz.md). Pass to earn the **Override-Wise** chip.

---

## Related lessons

- [M1.6 — History, notifications, audit](../M1.6_history_notifications_audit/00_README.md) *(next module)*
- [T3.M3.1 — RBAC](../../T3_zopnight_architect/M3.1_rbac/00_README.md)

## Glossary terms touched

[Max override duration](../../../reference/glossary/max-override-duration.md) · [Per-resource exception](../../../reference/glossary/per-resource-exception.md) · [Indefinite-override hazard](../../../reference/glossary/indefinite-override-hazard.md) · [Policy guardrail](../../../reference/glossary/policy-guardrail.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.5.L4
