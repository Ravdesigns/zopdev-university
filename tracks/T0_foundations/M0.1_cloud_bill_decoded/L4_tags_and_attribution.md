# Tags, labels, and the cost-attribution problem

§ T0 · M0.1 · L4 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **trace** any dollar of cloud spend back to a team using tags, **and identify** the four tags every cloud estate needs as the minimum viable tag set.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Show me which team is spending the money." |
| **Personas** | All five |
| **Prerequisites** | [L1](L1_what_is_in_a_cloud_bill.md), [L2](L2_pick_your_billing_source.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Trace (Apply) |

---

## 1. Concept

A cloud bill without tags is a stack of dollars with no owner. Tags solve the cost-attribution problem by attaching key-value metadata to every resource, which the billing pipeline propagates to every line item. Get the tags right and any dollar can be traced to its owner in one query. Get them wrong and the bill becomes an internal political artifact.

Tags are called **labels** on GCP and **tags** on both AWS and Azure. The mechanics are the same. The minimum viable set is the same.

### The minimum viable tag set (MVT)

Four tags. Every resource carries them. The values are governed.

```
TAG KEY        WHO USES IT           EXAMPLE VALUES
────────────────────────────────────────────────────────────
environment    Finance, Eng, Sec      dev | test | stage | prod
team           Finance, Eng           billing | identity | growth | data
cost_center    Finance, Procurement   eng-platform | eng-product | gtm | corp
owner          Sec, Ops               an email address or group alias
```

Anything beyond these four is optional. Anything below them is a gap. The four together unlock four core questions:

- *Which environment is spending the most?* (group by environment)
- *Which team owns this resource?* (look at team)
- *What cost center does this charge against?* (look at cost_center)
- *Who do we email when this misbehaves?* (look at owner)

### The cost-attribution problem

Without tags, attribution falls back to cloud account. One account, one team. This works at small scale and falls apart the moment any team uses a shared services account, a sandbox account is reused across teams, or two teams co-own an application.

With tags, attribution flows from the resource. A shared RDS instance with `team=identity,team=growth` (multi-valued or with a shared-services convention) can be split by half. An untagged resource floats up as "Unattributed" — visible, but unowned. The Unattributed bucket is itself a useful KPI: it should trend toward zero.

### The tag-drift problem

Tags are organizational debt unless they are governed. Three forces drive drift:

1. **Manual tagging.** Engineer creates a resource through the console without applying tags. Hours later, the resource exists, the bill is rolling, the team field is empty.
2. **Reorganizations.** The `team` value `growth` becomes `monetization` after a reorg, but old resources still carry `team=growth`. Now the spend is split across two team names that are the same team.
3. **Tag-policy mismatch.** A new tag policy says `environment` must be lowercase; existing resources have `Environment=Production`. Reports show "Production" and "prod" as different environments.

The fix is **tag policy as code,** enforced at provision time (Terraform / CDK / Pulumi pre-commit hook) and audited continuously (the Auto-Tagging service flags drift; see [T2.M2.8](../../T2_zopnight_engineer/M2.8_auto_tagging/00_README.md)).

### A note on hierarchies

Tags are flat. There is no built-in concept of `team.subteam` or `cost_center.parent`. Teams that need hierarchy build it with multiple tag keys (`team`, `subteam`) or by convention (`team=identity-auth`, `team=identity-mfa`). Pick one approach. Stick with it.

---

## 2. Demo

The same query, three providers, attributing yesterday's compute spend to teams:

**AWS:**
```sql
-- CUR query
SELECT resource_tags_user_team AS team,
       SUM(line_item_unblended_cost) AS spend
FROM cur.consolidated_2026_05
WHERE line_item_product_code = 'AmazonEC2'
  AND DATE(line_item_usage_start_date) = DATE '2026-05-19'
GROUP BY resource_tags_user_team
ORDER BY spend DESC;
```

**GCP:**
```sql
-- BigQuery billing export
SELECT labels.value AS team,
       SUM(cost) AS spend
FROM `billing_export.gcp_billing_export_v1_*`,
     UNNEST(labels) AS labels
WHERE labels.key = 'team'
  AND service.description = 'Compute Engine'
  AND DATE(usage_start_time) = '2026-05-19'
GROUP BY team
ORDER BY spend DESC;
```

**Azure:**
```bash
az consumption usage list \
  --start-date 2026-05-19 \
  --end-date 2026-05-20 \
  --query "[?contains(meterCategory, 'Virtual Machines')].{team:tags.team, cost:pretaxCost}" \
  -o json | jq 'group_by(.team) | map({team: .[0].team, cost: (map(.cost | tonumber) | add)})'
```

Sample output:

```
team        spend
─────────────────
identity    $1,247.30
growth      $   893.10
data        $   612.40
(null)      $   211.80   ← Unattributed. This bucket should trend to zero.
```

(Asset to produce: a stacked bar chart of attributed vs. unattributed cost trending over 90 days, showing untagged spend shrinking. Path: `assets/diagrams/M0.1_L4_tag_coverage_trend.svg`.)

---

## 3. Hands-on (8 min)

1. Pick the four tag keys: `environment`, `team`, `cost_center`, `owner`.
2. Query your own bill for last month. Group by `team` (or label-equivalent).
3. Note the **Unattributed** bucket. What percent of total spend has no team tag?
4. Pull a list of the top 20 untagged resources (sort by spend descending).
5. For the top 5 untagged resources, find the actual owner. Use the cloud console, Slack, or a CMDB.
6. If the owner can be determined, apply the four MVT tags through your IaC or console. If the owner cannot be determined, the resource is a candidate for the orphan list — see [T2.M2.1 lesson 5](../../T2_zopnight_engineer/M2.1_rule_library/L5_reading_a_rec_card.md).

Time-bounded version: do this for the top 3 untagged resources only. Eight minutes, not eight hours.

---

## 4. Knowledge check

### Q1
A FinOps Analyst reports: "We can't attribute 18% of our cloud bill." The most accurate first response is:

A. The cloud provider is hiding cost data
B. The tag coverage is incomplete. Find the untagged resources by spend, then assign owners.
C. Tags don't work at scale; use account boundaries
D. Buy a more expensive FinOps tool

<details>
<summary>Show answer</summary>

**Correct: B.** 18% Unattributed is high but not unusual. The fix is mechanical: list the untagged resources by spend, find the owners, apply the four MVT tags, and re-run the report.
</details>

### Q2
A reorg renames "Growth" to "Monetization." The team field on existing resources is not updated. What is the immediate cost-reporting consequence?

A. No consequence
B. The cost of the old Growth team continues to show up under the old name, while new resources show under the new name. The combined team's spend appears split.
C. The bill double-counts
D. Tags become invalid

<details>
<summary>Show answer</summary>

**Correct: B.** Tag values are not retroactive. The old `team=growth` resources carry that value until updated. Reports will show two separate buckets that are the same team. The fix is a bulk tag update on existing resources at the time of the reorg.
</details>

### Q3
A new tag policy requires `environment` to be lowercase. The CI policy is added today. What needs to happen?

A. Nothing; new resources comply
B. Run a one-time bulk update of existing resources (rename `Environment` to `environment`, normalize values to lowercase). Then the policy holds.
C. Wait three months for old resources to be replaced
D. Just live with the inconsistency

<details>
<summary>Show answer</summary>

**Correct: B.** New policies on new resources do not retroactively fix old resources. A one-time reconciliation is required at the moment a policy changes.
</details>

---

## 5. Apply

ZopNight's Reports page exposes the cost-attribution surface in three ways:

- **Reports → Teams** splits spend by the `team` tag (and shared services by share count). The Unattributed bucket appears as its own row.
- **Reports → Tags** lets any tag key (cloud-native or accepted auto-tag) drive the breakdown. Stacked trend chart, expandable rows for provider and resource-type breakdowns.
- **Tag Coverage Widget** on the dashboard shows tagged-vs-untagged as a donut. The target is "Untagged ≤ 5%."

The **Auto-Tagging** service (Insights → Auto-Tagging) infers `environment` and `noStop` predictions for untagged resources using rule-based logic (naming patterns, existing tags, instance class). Accept or reject each suggestion. Accepted tags carry `dimension_source=auto` so they are distinguishable from cloud-native tags. See [T2.M2.8](../../T2_zopnight_engineer/M2.8_auto_tagging/00_README.md).

[Open ZopNight Reports → Tags](https://app.zopnight.com/reports/tags) *(deep link)*

---

## Related lessons

- [L5 — The ten cost mistakes that show up on every bill](L5_ten_cost_mistakes.md) *(next)*
- [T2.M2.8 — Auto-tagging](../../T2_zopnight_engineer/M2.8_auto_tagging/00_README.md)
- [T3.M3.5 — Showback design](../../T3_zopnight_architect/M3.5_showback/00_README.md)
- [T5.M5.1 — Tagging strategy that survives reorgs](../../T5_devops_cost_discipline/M5.1_tagging_strategy/00_README.md)

## Glossary terms touched

[Tag](../../../reference/glossary/tag.md) · [Label](../../../reference/glossary/label.md) · [Unattributed](../../../reference/glossary/unattributed.md) · [Tag coverage](../../../reference/glossary/tag-coverage.md) · [Minimum viable tag set](../../../reference/glossary/minimum-viable-tag-set.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.1.L4
