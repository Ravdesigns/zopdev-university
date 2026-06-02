# Read-only safety: where it matters, where it doesn't

§ T0 · M0.6 · L3 of 4 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **explain** the read-only safety model **and identify** which CDCR operations cross the read-only line.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Defend CDCR's safety posture to a Security review." |
| **Personas** | Security/Compliance · Platform Engineer · Engineering Leader |
| **Prerequisites** | [L1](L1_what_cdcr_means.md), [L2](L2_cost_of_detect_only.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Explain (Understand) and Identify (Remember) |

---

## 1. Concept

CDCR is "act"-capable, which raises legitimate questions: what can the system actually do? With what permissions? How safe is it?

The answer is the **read-only safety model with scoped writes**. The architecture is:

```
LAYER                                  PERMISSIONS NEEDED
─────────────────────────────────────────────────────────────────
1. Discovery (resource inventory)      Read-only across providers
2. Metrics ingestion                   Read-only (CloudWatch, Cloud Monitoring)
3. Activity log sync                   Read-only (CloudTrail, Cloud Logging)
4. Recommendation generation           Read-only (uses 1–3 as input)
5. Cost reporting                      Read-only (billing data + pricing API)
6. Schedule execution                  Scoped write (start / stop only)
7. Auto-remediation (idle / orphan)    Scoped write (terminate specific resources)
8. Autoscaler policy management        Scoped write (specific policy types)
9. Database mutations                  NEVER. Hard-blocked in code.
```

Layers 1–5 are read-only. This covers most of what the system does. Layers 6–8 are scoped writes — narrow, auditable, opt-in. Layer 9 is forbidden — the system will not mutate customer databases under any circumstances.

### What "scoped write" means

A scoped write has three properties:

1. **Narrow scope.** The write does one specific thing — start a VM, stop a VM, terminate a specific orphan EBS, apply a specific autoscaler policy. It cannot do other things, even if the IAM credentials allow it.
2. **Auditable.** Every write goes through the gateway audit log with the request and response captured. The customer can query "what did ZopNight do, when, to what resource, with what outcome."
3. **Opt-in.** Auto-remediation is opt-in per rule per org. The default for most rules is "show the recommendation, don't auto-apply." Customers explicitly turn on the auto path.

### The database denylist

Layer 9 deserves its own attention. The system **never** mutates customer databases, regardless of what an auto-remediation rule might suggest. The rule library has the database denylist hardcoded:

```
Resource types that NEVER auto-mutate:
  rds*, aurora*, cloudsql*, elasticache*, azure-sql*,
  postgres*, mysql*, dynamodb*, cosmos*, mongodb*,
  redshift*, snowflake*, databricks-data*

Action types that NEVER auto-execute on the above:
  modify, delete, scale, change-tier, change-class,
  enable-encryption, change-multi-az
```

A recommendation that says "downsize this RDS from db.r5.4xlarge to db.r5.2xlarge" is shown to the user. The user can act in the AWS console with a planned maintenance window. The system will not act on the user's behalf.

Why so conservative on databases? Because the cost of a bad database write — corruption, data loss, downtime — dwarfs the cost of any optimization gain. The risk-reward math is unfavorable. The University teaches this as a principle: *cost optimization should never trade against data integrity.*

### IAM minimization

The credentials ZopNight asks for are minimized to what each layer needs. The connection wizard suggests:

- **AWS:** A read-mostly role with scoped permissions per service, with optional `:Action` extensions for the scoped writes.
- **GCP:** A service account with `roles/viewer` plus narrow custom roles for the scoped writes.
- **Azure:** A service principal with `Reader` plus optional `Contributor` scoped to the resource groups the customer wants ZopNight to manage.

Customers can deny any scoped-write permission and the system gracefully degrades — the affected feature shows as "monitor only" instead of "fully active." Discovery continues. Recommendations continue. Only the write side is restricted.

### Permission Visibility

The system makes its permission state visible. The [Permission Visibility](https://app.zopnight.com/cloud-accounts) drawer per account shows Granted / Denied / Unknown badges per provider-type-region with the exact error messages from any denied call. This is unique — most competitors silently fail discovery and report lower numbers. ZopNight refuses to silently mis-report. (Covered in [T1.M1.1](../../T1_zopnight_operator/M1.1_connect_account/00_README.md).)

### The approval gate

For scoped writes that are reversible-but-risky (like terminating a non-prod EC2), the system defaults to "approval-gated." A designated admin receives the request via Slack DM or email, reviews, approves or declines. Only then does the write execute.

The approval gate is:

- Default for most write paths (especially anything destructive)
- Configurable per rule (some rules can be moved to auto for environments the customer trusts)
- Logged in the audit trail (who approved what, when)
- Bypassable for low-risk operations (schedule-triggered start/stop on tagged non-prod, for instance)

### How this passes security review

A Security review of CDCR typically asks five questions. The model's answers:

1. *"What can the tool see?"* → Read-only across the configured providers. Permission Visibility shows exactly what was scanned.
2. *"What can the tool do?"* → Only the scoped writes the customer enabled. Database mutations are categorically blocked.
3. *"How is access audited?"* → Every mutating call to the gateway is logged with request+response capture.
4. *"How is access controlled?"* → Per-rule auto-remediation toggle. Approval gate on destructive ops. Three-tier RBAC.
5. *"What is the blast radius of a compromised ZopNight credential?"* → The IAM credentials are scoped. The worst case is the scoped-write surface, audit-logged, with approval gates on destructive ops.

The answers are defensible because the architecture was designed for the Security review, not retrofitted.

---

## 2. Demo

A live look at the safety model for one rule:

```
RULE: RC-001 Idle EC2
─────────────────────────────────────────────────────────
Detection: read-only, uses CloudWatch CPU + state history
Classification: idle, non-prod, no DB attachment, has snapshot
Default action: SHOW THE RECOMMENDATION
Auto-remediation toggle: OFF by default
                          ON enables the action path

WHEN AUTO IS ON:
  Pre-check: confirm no override active
  Pre-check: confirm not in database denylist
  Pre-check: confirm tags match customer-defined eligibility
  Action: snapshot EBS, terminate instance, terminate EBS
  Post-check: verify termination, confirm savings landed in billing
  Audit log: full request+response captured

CUSTOMER CAN AT ANY TIME:
  - Turn off auto for this rule
  - Add a per-resource exclusion
  - Move this rule to approval-gated
  - Pause all auto-remediation org-wide
```

The customer is in control at every layer. The system's defaults are conservative; the customer opts in to more aggressive automation as they build trust.

(Asset: `assets/diagrams/M0.6_L3_safety_layers.svg`.)

---

## 3. Hands-on (6 min)

For your own deployment (or as a thought exercise on a proposed CDCR rollout):

```
1. Which scoped writes do you want to enable?
   - Schedule start/stop (compute):       Y / N
   - Schedule start/stop (K8s workloads):  Y / N
   - Auto-terminate orphan storage:        Y / N
   - Autoscaler policy management:         Y / N

2. For each "Y," what's the approval-gate posture?
   - Auto for non-prod, approval for prod
   - Always approval-gated
   - Auto always (most aggressive)

3. Who is the designated approver?
   Name: __________
   Backup approver: __________
   Approval SLA: __________ hours

4. What's the org-wide kill switch?
   Where is it: ____________
   Who can trigger it: ____________

If any answer is blank, the rollout has a gap. Close the gaps before
auto-remediation is enabled.
```

---

## 4. Knowledge check

### Q1
A Security reviewer asks: "Can ZopNight modify our customer database?" The most accurate answer is:

A. Yes, if auto-remediation is enabled
B. No. Database mutations are categorically blocked in code via a hardcoded denylist. The system will show database optimization recommendations but never auto-execute them. RDS, Aurora, CloudSQL, Cosmos, Azure SQL, etc. are all in the denylist.
C. Only with approval
D. Only for non-prod databases

<details>
<summary>Show answer</summary>

**Correct: B.** The database denylist is hardcoded. Database optimizations are show-only; the customer's DBA team executes any changes through normal channels.
</details>

### Q2
A team is rolling out CDCR. The Security team requires that all destructive operations go through change management. The compatible configuration is:

A. Disable CDCR
B. Set all destructive-class rules to approval-gated; route approval to the change management system; allow auto on non-destructive scoped writes (schedule start/stop on tagged non-prod). The approval gate is the integration point.
C. Run ZopNight in monitor-only mode forever
D. Custom build

<details>
<summary>Show answer</summary>

**Correct: B.** Approval gates exist for exactly this use case. Destructive operations route through the customer's change process; non-destructive scoped writes can still auto-fire on tagged scope.
</details>

### Q3
"Read-only safety" means:

A. The tool only reads, never writes
B. The default posture is read-only. Writes are opt-in, scoped, audited, with approval gates on destructive ops. Discovery and reporting are always read-only.
C. The tool is too cautious to be useful
D. Permissions are read-only by AWS policy

<details>
<summary>Show answer</summary>

**Correct: B.** "Read-only safety" describes the *default posture and the safety architecture*. Writes exist but are tightly controlled. Discovery and reporting (where most of the value is) are always read-only.
</details>

---

## 5. Apply

ZopNight surfaces the safety model in three places:

- **Cloud Accounts → Permission Visibility** shows what the credentials allow
- **Recommendations → Auto-Remediation toggle per rule** lets the customer opt in
- **Audit Logs** shows every write the system has performed

For a Security review pre-flight: open the Permission Visibility drawer, screenshot it for the Security team. Open the Auto-Remediation panel, show the current state of each rule. Open the Audit Log for the past 30 days, demonstrate the write surface is small and auditable.

---

## Related lessons

- [L4 — What CDCR is NOT](L4_what_cdcr_is_not.md) *(next — closes the module)*
- [T1.M1.1 — Connect a cloud account](../../T1_zopnight_operator/M1.1_connect_account/00_README.md)
- [T3.M3.3 — Audit logging](../../T3_zopnight_architect/M3.3_audit_logging/00_README.md)

## Glossary terms touched

[Read-only safety](../../../reference/glossary/read-only-safety.md) · [Scoped write](../../../reference/glossary/scoped-write.md) · [Database denylist](../../../reference/glossary/database-denylist.md) · [Approval gate](../../../reference/glossary/approval-gate.md) · [Permission Visibility](../../../reference/glossary/permission-visibility.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.6.L3
