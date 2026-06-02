# M1.2 — Discover your estate

§ T1 · M1.2 · Operator tier · 5 lessons · ~50 min

---

## Module outcome

Navigate the resource list confidently. Drill from cluster to nodepool to VM via parent-child hierarchy. Build complex filters using grouped account and grouped type dropdowns. Trigger manual start/stop with confirmation. Recognize a stale discovery and trigger a manual refresh.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [What gets discovered (380+ types) and how](L1_what_gets_discovered.md) | 10 min | AWS RE2 · GCP Asset Inventory · Azure Resource Graph · 380+ types |
| L2 | [Parent-child hierarchies](L2_parent_child.md) | 10 min | Cluster → nodegroup → VM · breadcrumbs · 3-level nesting |
| L3 | [Grouped account + grouped type filters](L3_grouped_filters.md) | 10 min | Multi-select · cascade filters · 9 type categories |
| L4 | [Manual start/stop with confirmation](L4_manual_start_stop.md) | 10 min | Bulk actions · confirmation · action status |
| L5 | [When discovery is stale — the refresh trigger](L5_stale_discovery.md) | 10 min | Refresh button · status polling · don't-act-on-stale |

**Total: 5 lessons, ~50 min**

---

## Module diagram

A breadcrumb navigation example: All resources → AWS → us-east-1 → EKS cluster → nodegroup → individual VMs. Showing the click path from estate-wide view to a single child resource.

(Asset: `assets/diagrams/M1.2_breadcrumb_drill.svg`.)

---

## Module knowledge check

10 questions. Earn the **Estate-Reader** chip on pass.

---

## What's next

[M1.3 — Build your first schedule](../M1.3_first_schedule/00_README.md).
