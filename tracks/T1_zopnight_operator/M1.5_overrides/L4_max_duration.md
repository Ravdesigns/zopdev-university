# Max override duration: the per-resource cap

§ T1 · M1.5 · L4 of 4 · Operator tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **configure** the per-resource Max Override Duration cap **and explain** why it prevents the most common operational hazard.

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

The **Max Override Duration** is a **per-resource and per-resource-group** setting (`max_override_duration_minutes`) that caps how long any single override on that resource or group can be active. It is not an org-wide policy and there is no global default value: the cap lives on the individual resource or group, expressed in minutes.

A value of **0 means overrides are disabled entirely** for that resource or group. Any positive value is the maximum minutes an override may run before it must expire.

The cap exists to prevent a specific failure mode: the override that gets forgotten and runs indefinitely. Without a cap, a force-on override set "for this weekend" survives a team member's departure, an org chart change, three quarterly reviews, and a large bill before anyone notices. Because the cap is per-resource, you set a tighter limit on sensitive resources (or 0 to forbid overrides there) and a looser one where longer overrides are legitimate.

### Choosing a cap per resource

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

Most legitimate overrides finish inside about 5 days, so a cap in the ~5-to-7-day range (7,200 to 10,080 minutes) on a normal resource gives headroom while still catching the runaway. Anything structurally longer is a schedule edit, not an override:

- "Our team works Sundays in May" → edit the schedule for that period
- "Production is non-24/7 in this region" → edit the schedule permanently
- "Our DR site needs to stay on for a month" → edit or new schedule for that resource set

### What happens when the cap is hit

```
USER SETS OVERRIDE on a resource whose max_override_duration_minutes
is 10,080 (7 days), with an expiry 30 days out.

ZopNight validation:
  "Override exceeds this resource's max duration (7 days). Reduce the
   expiry, or edit the schedule for a permanent change."

Reject. The user shortens the override, OR edits the schedule instead.
If the resource's cap is 0, the override is refused outright: overrides
are disabled on that resource.
```

The cap is set on the resource or resource group (admin action), and every override action is captured in the audit log.

### Setting the cap where it matters

Because the cap is per-resource and per-group, you tune it to the resource:

```
RESOURCE: dr-cluster-eu
max_override_duration_minutes: 129,600 (90 days) — extended for quarterly DR drills
Set by:   security-admin@org.com

RESOURCE: prod-payments-db
max_override_duration_minutes: 0 — overrides disabled; never force this on/off manually
```

Setting the field is an admin action, and every override create/clear/expire is captured in the audit log.

### Why this matters for compliance

Several compliance frameworks (SOC 2, ISO 27001) ask about "guardrails against indefinite policy bypasses." The per-resource Max Override Duration is a defensible answer:

- The cap is configurable per resource and per group
- Sensitive resources can set it to 0, disabling overrides entirely
- Every override action is captured in the audit log
- Override history is retained in the audit log

A SOC 2 auditor can verify these properties from the audit log plus the per-resource setting. The control is testable.

### What this cap does NOT do

Three deliberate limitations:

1. **Does not limit the number of overrides.** A team can have many active overrides simultaneously, each within its resource's duration cap. The cap is per-override duration, not total override count.
2. **Does not auto-cancel overrides.** Overrides expire at their set expiry time. The cap rejects creation of an over-long override; it does not retroactively shorten existing ones.
3. **Does not require a reason.** The override reason is optional (the backend does not store a reason field), so it cannot be relied on as a machine-enforced control. Use it for human context, not validation.

The cap is a guardrail, not a panopticon. It catches the canonical mistake (forever-overrides) without micromanaging legitimate ones.

### Choosing a cap per resource class

```
RESOURCE CLASS                            SUGGESTED max_override_duration
─────────────────────────────────────────────────────────────────────
Dev / staging compute                      ~7 days (10,080 min)
Standard production                        ~3-5 days (4,320-7,200 min)
Sensitive / stateful (payments DB, etc.)   0 (overrides disabled)
DR / drill resources                       longer, documented
```

Tightening a resource's cap reduces its risk window but adds friction; setting 0 forbids overrides on resources that should only ever follow their schedule.

---

## 2. Demo

A team setting up the policy on a new ZopNight deployment:

```
DAY 1, T+0       Admin reviews override caps per resource / resource group.

T+1 min          Sets a ~7-day cap (10,080 min) on standard dev/staging groups.
T+2 min          Sets 0 on prod-payments-db: overrides disabled entirely there.
T+3 min          Sets 90 days (129,600 min) on dr-cluster-eu for quarterly drills.

T+5 min          Done. Each resource/group now carries its own
                  max_override_duration_minutes; there is no org-wide value.

DAY 30+   A 14-day override attempted on a dev group (7-day cap):
                Validation rejects: "Exceeds this resource's max (7 days).
                Shorten the override or edit the schedule."
                Team uses a 7-day expiry instead.
          A force-on attempted on prod-payments-db (cap = 0):
                Refused outright: overrides are disabled on that resource.

NO incidents of forgotten runaway overrides recorded over the first year.
```

A few minutes of per-resource setup. Zero forgotten-override incidents going forward.

(Asset: `assets/diagrams/M1.5_L4_max_duration_setup.svg`.)

---

## 3. Hands-on (5 min)

If you have admin access:

```
1. Pick a resource or resource group.
2. Find its Max Override Duration (max_override_duration_minutes).
3. Note the current value (remember: 0 = overrides disabled here).
4. Consider: does it match this resource's needs?
   - Are most overrides on it shorter than the cap?
   - Should sensitive resources be set to 0 (no overrides)?
   - Do any resources (DR, drills) need a longer cap?
5. Set the value per resource / group as needed.
6. Verify by attempting an over-long override in the create dialog
   (validation rejects values past that resource's cap).

For non-admin users: review the caps (read-only access) and use
them to inform your override decisions.
```

---

## 4. Knowledge check

### Q1
A team needs to keep a non-prod environment running for a 2-week sprint. The resource's max override duration is 7 days. The right approach:

A. Set two consecutive 7-day overrides
B. The 2-week sprint is too long for an override. Edit the schedule to skip the weekend stops for those two weeks (a schedule edit), or reduce the schedule's active hours during the sprint, then revert after.
C. Raise the resource's max-duration cap
D. Manually start resources every day

<details>
<summary>Show answer</summary>

**Correct: B.** Two weeks is structurally a schedule edit, not an override. The cap correctly redirects the team to the right tool.
</details>

### Q2
A user sets an override with 5-day expiry. The resource's max override duration is 7 days. What happens:

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
B. The per-resource Max Override Duration cap (settable per resource and group, with 0 disabling overrides entirely on a resource), the required expiry on every override, and the audit log of all override events. Together these are a testable control.
C. "Overrides cannot exist"
D. "We don't use overrides"

<details>
<summary>Show answer</summary>

**Correct: B.** The cap is one part of a layered control: required expiry, audit log, admin-only policy changes. Together they form a testable answer to "how is this prevented?"
</details>

---

## 5. Apply

Max Override Duration is in:

- **The per-resource / per-group setting** (`max_override_duration_minutes` on the resource or resource group; 0 disables overrides there)
- **[Audit Log](https://app.zopnight.com/audit-logs)** — every override create / clear / expire event
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
