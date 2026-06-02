# When discovery is stale — the refresh trigger

§ T1 · M1.2 · L5 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **recognize** when the resource list is stale **and trigger** a manual refresh, **and avoid** acting on stale data.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Trust the resource list to reflect reality before I act on it." |
| **Personas** | All product users |
| **Prerequisites** | [L1–L4](L1_what_gets_discovered.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Recognize (Understand), Trigger (Apply), Avoid (Evaluate) |

---

## 1. Concept

ZopNight's resource list is a snapshot. The state of any resource — running, stopped, tagged, attached to a schedule — was last verified at the most recent discovery sync. Acting on the list is acting on data that may be minutes to hours old. The product makes the staleness visible so the user can choose to wait or refresh.

### The freshness signal

Every resource carries a "last seen" timestamp from the most recent successful discovery. The Resources page header shows the **org-wide most-recent sync**:

```
Resources    Last discovery: 2 hours ago        [Manual refresh ↻]
─────────────────────────────────────────────────────────────────
```

When the sync is fresh (under 6 hours, which is the cron interval), the timestamp is gray. Beyond 6 hours, the timestamp turns amber. Beyond 24 hours, red — at which point the user should investigate the sync, not just refresh.

Per-account sync status is in the Cloud Accounts page; if one account is failing while others are succeeding, only the failing account's resources are stale.

### When to trust the list

```
ACTION                              FRESHNESS REQUIREMENT
─────────────────────────────────────────────────────────
Read-only browsing                  < 24 hours fine
Cost reporting                      6-24 hours typical
Building a new schedule             < 6 hours; refresh if older
Manual start/stop on prod           < 30 minutes; refresh first
Bulk action on many resources       < 30 minutes; refresh first
Auto-remediation                    Discovery runs immediately before
                                    each remediation attempt
```

For most read-only browsing, the default freshness is fine. For high-blast-radius actions (manual stop on a production cluster, bulk action on 50 resources), refreshing first is cheap and reduces the chance of acting on data that has changed.

### The manual refresh trigger

The "Manual refresh ↻" button in the Resources page header triggers an immediate discovery cycle:

```
T+0       User clicks Manual refresh
T+1 sec   Discovery sync starts for all connected accounts
T+10 sec  Provider APIs respond with resource lists
T+60 sec  Per-resource metadata enrichment in progress
T+2 min   Sync completes; UI updates with new state
T+2 min   Permission Visibility drawer updated
```

A manual refresh takes 1–3 minutes for typical estates. The button is disabled with a spinner while a refresh is in progress. The Last Discovery timestamp updates when complete.

### Status indication during refresh

The Resources page shows three states clearly:

```
1. Idle                "Last discovery: 23 minutes ago"
2. In progress         "Refreshing... 47% (1,840 / 3,920 resources)"
3. Recently completed  "Discovery complete — 12 resources changed"
```

The "X resources changed" message highlights what moved. If 12 new resources appeared, the user clicks the toast to filter to "added in this sync."

### Per-account refresh

For multi-account estates, refreshing all accounts at once may be excessive. The Cloud Accounts page exposes per-account refresh:

```
Cloud Accounts
─────────────────────────────────────────────────────
prod-aws-us         Active     Last sync: 5h ago    [↻]
staging-aws-us      Active     Last sync: 5h ago    [↻]
prod-gcp            Active     Last sync: 5h ago    [↻]
prod-azure          Degraded   Last sync: 31h ago   [↻]  ← problem
```

A specific account can be refreshed individually. This is the right tool when only one cloud changed (e.g., the team just provisioned new GCP resources and wants those visible).

### The "don't act on stale data" rule

A principle to internalize:

> *Refresh before acting on resources that matter. The 60 seconds of refresh time is much cheaper than acting on a stale state.*

Examples of when this rule pays off:

- A non-prod cluster was manually started by an engineer in the cloud console 20 minutes ago. ZopNight's list still shows it as stopped. A bulk-start action against "all stopped non-prod" would skip this cluster (it's already running) but would not break anything. Lower risk.
- A production database was stopped for an emergency maintenance 30 minutes ago. ZopNight's list still shows it running. A scheduled action that "stop everything tagged stale-prod" might pick it up and try to stop something already stopped (idempotent — fine). But: in the time since the manual stop, somebody might have restarted the DB for production. Acting on the stale list could re-stop production.

The rule: refresh before high-stakes action. The 60 seconds buys correctness.

### What causes staleness beyond 6 hours

Two scenarios:

**1. The 6-hour cron has not yet fired.** Normal. The next sync is on its way. Refresh manually or wait.

**2. The sync is failing.** Check Cloud Accounts page for any account showing "Degraded" or "Failed." Click into the failing account, read the error in the Permission Visibility drawer or the sync status panel. Most failures resolve with the same fixes from M1.1 L4 (a missing IAM permission, a revoked credential, an expired SAML federation).

### What the user can configure

A few preferences are available:

- **Discovery cadence** is fixed at 6 hours for cost reasons (more frequent runs increase cloud API costs for the customer's account). Premium plans can request lower cadence.
- **Per-account refresh** lets the user trigger one account at a time
- **Notification on completed refresh** can be enabled per organization

The defaults are usually right. The Manual refresh trigger is the lever the user touches most.

---

## 2. Demo

A typical "I should refresh first" moment:

```
T+0       User opens Resources page. Header: "Last discovery: 5h ago"
T+5 sec   User filters to "non-prod, running" — 38 resources match
T+10 sec  User intends to bulk-stop 25 of them for the weekend

PAUSE — user notices the 5h-ago timestamp. Some of these may already
be stopped or may have changed tags.

T+15 sec  User clicks Manual refresh
T+90 sec  Refresh completes. Toast: "12 resources changed since last sync"
T+95 sec  User re-applies the filter — 32 resources match now
          (6 were already stopped by an automation; 2 had their tags changed
          and no longer match "non-prod")
T+100 sec User selects the 25 still-running, still-correctly-tagged resources
T+110 sec Bulk stop with confirmation
T+170 sec All 25 stopped successfully
```

The 90-second refresh saved the team from accidentally trying to stop 6 already-stopped resources (no harm, but noise) and from stopping 2 resources whose tags had changed and shouldn't have been in scope.

(Asset: `assets/diagrams/M1.2_L5_refresh_before_action.svg`.)

---

## 3. Hands-on (6 min)

On the Resources page:

```
1. Note the "Last discovery" timestamp in the header.
2. Click Manual refresh.
3. Observe the progress indicator. Note the duration.
4. When complete, read the change summary toast (if any).
5. Open Cloud Accounts page. Note the per-account sync timestamps.
6. If any account shows "Degraded," click into it and read the
   sync status panel for the error message.
7. If all accounts are healthy, you have confidence the resource
   list reflects reality.

THEN: take the rule home. Before any bulk action on >10 resources
or any manual action on production, hit Manual refresh first.
The 60-90 seconds is cheap.
```

---

## 4. Knowledge check

### Q1
A team is about to bulk-stop 47 production-adjacent resources. The Last Discovery timestamp shows "5 hours ago." Best practice:

A. Proceed; 5 hours is recent
B. Click Manual refresh first. The minute of refresh time is cheap insurance against acting on stale state. After refresh completes, re-verify the resource list still shows the intended targets.
C. Wait for the next scheduled sync
D. Use the cloud console

<details>
<summary>Show answer</summary>

**Correct: B.** Refresh-before-act is the rule for high-stakes operations. Five hours is borderline; the bulk size and production-adjacency make refresh worth it.
</details>

### Q2
A specific GCP project shows "Last sync: 31 hours ago" and "Degraded" status. The expected diagnosis path:

A. ZopNight is broken
B. Open the GCP account from the Cloud Accounts page. Read the sync status panel. The Permission Visibility drawer will show which specific call is failing. Most common: a revoked service account key or a removed Workload Identity binding. Re-add the credential.
C. Wait three days
D. Replace ZopNight

<details>
<summary>Show answer</summary>

**Correct: B.** "Degraded" + 31 hours is a clear signal that the sync is failing, not just behind. The diagnostic path is the Cloud Accounts page → sync status → Permission Visibility.
</details>

### Q3
"Don't act on stale data" most directly motivates:

A. Always wait 24 hours before any action
B. Refresh before high-stakes actions (bulk operations, production resources, anything irreversible). For low-stakes browsing and reporting, the default 6-hour cadence is fine.
C. Disable schedules
D. Manual everything

<details>
<summary>Show answer</summary>

**Correct: B.** The rule is graduated — refresh for stakes, not for everything. Reporting and browsing tolerate 6-hour staleness; production actions don't.
</details>

---

## 5. Apply

The freshness signal is in two places:

- **[Resources page header](https://app.zopnight.com/resources)** — Last Discovery timestamp + Manual refresh button
- **[Cloud Accounts page](https://app.zopnight.com/cloud-accounts)** — per-account sync status and per-account refresh

For automation-driven workflows (MCP, API), refresh is implicit before each remediation attempt — the auto-remediation pipeline always runs a discovery sync immediately before acting on the resource, so it cannot act on stale state by design.

---

## Module quiz

You have now completed all five lessons of M1.2. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m1.2-quiz](../../../certifications/operator/m1.2-quiz.md). Pass to earn the **Estate-Reader** chip.

---

## Related lessons

- [M1.3 — Build your first schedule](../M1.3_first_schedule/00_README.md) *(next module)*
- [M1.1 L4 — Permission Visibility](../M1.1_connect_account/L4_permission_visibility.md)

## Glossary terms touched

[Manual refresh](../../../reference/glossary/manual-refresh.md) · [Last Discovery timestamp](../../../reference/glossary/last-discovery-timestamp.md) · [Stale data](../../../reference/glossary/stale-data.md) · [Per-account sync](../../../reference/glossary/per-account-sync.md) · [Degraded status](../../../reference/glossary/degraded-status.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.2.L5
