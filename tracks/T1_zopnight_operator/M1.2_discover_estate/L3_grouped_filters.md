# Grouped account + grouped type filters

§ T1 · M1.2 · L3 of 5 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **construct** a multi-condition filter using the grouped account and grouped type dropdowns **and interpret** the cascade filter behaviour.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Find 'all running GCP databases in EU regions' without writing a query." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | [L1](L1_what_gets_discovered.md), [L2](L2_parent_child.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Construct (Apply) and Interpret (Understand) |

---

## 1. Concept

The Resources page exposes a small number of filter dropdowns, each carrying significant power. Two are worth understanding deeply: **Grouped Account** and **Grouped Type**. Together they handle most filter intents without a query language.

### Grouped Account dropdown

Multi-cloud estates have many cloud accounts. A naive "select an account" dropdown becomes unusable past 20–30 accounts. ZopNight uses a **grouped, multi-select** dropdown:

```
[Cloud Accounts ▾]                          1 selected
─────────────────────────────────────────────────────
[ ] AWS                                     12 accounts
    [✓] prod-aws-us              941614...
    [ ] prod-aws-eu              182947...
    [ ] staging-aws-us           294018...
    [ ] dev-aws-shared           ...
    ...
[ ] GCP                                     8 projects
    [ ] my-gcp-prod              
    [ ] my-gcp-staging           
    ...
[ ] Azure                                   5 subscriptions
    [ ] prod-azure-eu            
    ...
```

Three behaviors matter:

**1. Multi-select.** Tick any combination of accounts across any provider. Filters are applied as a union.

**2. Provider-group selection.** Tick the provider header (e.g., "AWS") to select all AWS accounts at once. The backend receives `provider=AWS` (more efficient than enumerating all accounts).

**3. Mixed selection sends a comma list.** Tick five specific accounts across two providers. The backend receives `cloud_account_id=941614...,182947...,my-gcp-prod,...` — a SQL `IN` clause filters the result.

The dropdown handles the multi-account scale that flat dropdowns cannot.

### Grouped Type dropdown

The 380+ resource types fall into 9 categories. The Grouped Type dropdown organizes the type filter around these categories:

```
[Resource Types ▾]                          3 selected
─────────────────────────────────────────────────────
[ ] Compute                                 23 types
    [✓] EC2                      AWS
    [✓] Compute Engine           GCP
    [ ] Azure VMs                Azure
    [ ] ASG                      AWS
    ...
[ ] Kubernetes                              12 types
    [ ] EKS                      AWS
    [ ] GKE                      GCP
    [ ] AKS                      Azure
    [ ] Deployment               (all clouds)
    [ ] StatefulSet              (all clouds)
    [ ] CronJob                  (all clouds)
    ...
[ ] Database                                18 types
    [✓] RDS                      AWS
    [ ] Cloud SQL                GCP
    [ ] Azure SQL                Azure
    ...
[ ] Storage                                 14 types
[ ] Networking                              28 types
[ ] Serverless                              7 types
[ ] Data & Analytics                        16 types
[ ] ML & AI                                 11 types
[ ] Messaging                               9 types
```

**Category-level checkbox** ticks every type in the category. **Counts** show how many types are in each category.

Same component is reused on the Recommendations page for filtering rules by resource type — so muscle memory transfers.

### Cascade filter behavior

Filters cascade. Selecting accounts narrows the available type / status / region values:

```
SCENARIO: A user selects two AWS accounts. The Type dropdown now shows
only types present in those two accounts. The Status dropdown shows
only statuses observed. The Region dropdown shows only regions where
those accounts have resources.
```

The cascade prevents the "I filtered by type X but got zero results" confusion. If a type isn't present in the selected accounts, it doesn't appear in the dropdown.

**Exception:** the account dropdown itself is NOT cascaded. It always shows all accounts (so a user can re-broaden the selection without manually clearing other filters first). A separate, unfiltered API call sources the full account list for that dropdown.

### Why this matters at scale

A 300-account, 50,000-resource estate is unmanageable with flat filters. Grouped dropdowns plus cascade behavior make the same UI work at 5 accounts or 500 accounts without redesign.

### Other filters

Beyond the two grouped dropdowns, the Resources page exposes:

- **Status** — Running / Stopped / Transitioning
- **Region** — multi-select, cascaded
- **Schedulable** — boolean (resources that can have schedules attached)
- **Search** — name or UID substring
- **Schedule** — filter to resources attached to a specific schedule
- **Group** — filter to resources in a specific group
- **Tags** — filter by tag key/value

Most queries combine 2–3 of these. Power users can stack many at once.

---

## 2. Demo

The signature query: "all running GCP databases in EU regions"

```
FILTER STATE                          RESULTS
─────────────────────────────────────────────────────────
(no filters)                          12,400 resources
+ Cloud Account = GCP (any)            3,200 resources
+ Type Category = Database             47 resources
+ Region = europe-west1, europe-       
          west3, europe-west4          12 resources
+ Status = Running                     11 resources

Final: 11 running GCP databases in EU regions.
Four clicks to construct.
```

A second example: "EC2 + Compute Engine instances larger than t3.xlarge across all clouds, in production accounts only"

```
+ Cloud Account = (filter to prod accounts)
+ Type = EC2, Compute Engine (mixed provider, in the Compute category)
+ Tag: environment = prod
+ Search: "xlarge" or "2xlarge" or "4xlarge"...
```

Mixed-provider, tag-aware, instance-type-aware filtering — without writing a query.

(Asset: `assets/diagrams/M1.2_L3_filter_construction.svg`.)

---

## 3. Hands-on (6 min)

Run three filter exercises on your estate:

```
EXERCISE 1: All Kubernetes workloads (Deployments, StatefulSets, CronJobs)
  - Type Category = Kubernetes
  - Drill: list how many of each type

EXERCISE 2: Stopped resources older than 30 days
  - Status = Stopped
  - (sort by last-active date if available)
  - These are auto-remediation candidates

EXERCISE 3: Untagged resources across all clouds
  - Tag filter: environment = (no value)
  - Multi-cloud, all providers
  - These are tagging coverage gaps
```

Each exercise is 2 minutes. The point is to internalize that the filter UI handles most cost-discovery questions.

---

## 4. Knowledge check

### Q1
A user selects two AWS accounts. The Type dropdown now shows only 47 types instead of the full 191. This is:

A. A bug
B. Intentional — cascade filtering. Type values are narrowed to types present in the selected accounts. This prevents "I filtered by X and got zero" confusion.
C. A limitation
D. A different version of ZopNight

<details>
<summary>Show answer</summary>

**Correct: B.** Cascade is by design. Type values are scoped to what is actually present in the current account selection.
</details>

### Q2
A user wants "all running Kubernetes workloads across all clouds." The most efficient filter construction is:

A. Filter per cloud separately, then combine
B. Type Category = Kubernetes (one click checks all K8s-category types across providers). Then Status = Running. Two filters total.
C. Write a query in HogQL
D. Use the search bar

<details>
<summary>Show answer</summary>

**Correct: B.** Category-level selection in the grouped Type dropdown is the right tool. One click handles cross-provider K8s types.
</details>

### Q3
The Account dropdown does NOT cascade-narrow when other filters are applied. Why:

A. A bug
B. So the user can re-broaden the account selection without first clearing other filters. The account list always shows all available accounts, sourced from a separate unfiltered API call.
C. Performance
D. Backward compatibility

<details>
<summary>Show answer</summary>

**Correct: B.** Deliberate UX. The account dropdown is the broadest filter; allowing the user to re-broaden without first clearing downstream filters is a usability choice.
</details>

---

## 5. Apply

The Resources page exposes the filter UI:

- **[Resources page filters](https://app.zopnight.com/resources)** — open and experiment
- **Grouped Type dropdown** is reused on the Recommendations page — the same component
- **Saved filter URLs** can be bookmarked — every filter combination is reflected in the URL parameters

For complex programmatic queries (across many dimensions, scriptable), use the MCP read-only tools (see [T6.M6.4 recipes](../../T6_ai_powered_cloud_ops/M6.4_recipe_library/00_README.md)). The filter UI is for interactive exploration; MCP is for repeatable queries.

---

## Related lessons

- [L4 — Manual start/stop with confirmation](L4_manual_start_stop.md) *(next)*
- [T2.M2.1 — The 490-rule library](../../T2_zopnight_engineer/M2.1_rule_library/00_README.md)

## Glossary terms touched

[Grouped Account dropdown](../../../reference/glossary/grouped-account-dropdown.md) · [Grouped Type dropdown](../../../reference/glossary/grouped-type-dropdown.md) · [Cascade filter](../../../reference/glossary/cascade-filter.md) · [9 type categories](../../../reference/glossary/nine-type-categories.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.2.L3
