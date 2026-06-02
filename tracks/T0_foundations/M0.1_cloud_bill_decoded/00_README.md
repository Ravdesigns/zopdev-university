# M0.1 — The cloud bill, decoded

§ T0 · M0.1 · Operator tier · 5 lessons · ~50 min

---

## Module outcome

Pull last month's invoice from AWS, GCP, or Azure and explain every dollar on it. Spot the ten most common cost mistakes hiding in plain sight. Map any dollar back to the resource and the usage event that caused it.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [What's actually in a cloud bill](L1_what_is_in_a_cloud_bill.md) | 9 min | The 4 line-item categories · why one resource generates many rows · rack rate |
| L2 | [CUR, Cost Explorer, Cost Management, BigQuery — pick one](L2_pick_your_billing_source.md) | 8 min | When to use which · daily vs hourly · cost of the data itself |
| L3 | Granularity vs. timeliness — the trade-off you didn't choose | 7 min | Why CUR is 24h+ stale · what real-time costs · the right band |
| L4 | Tags, labels, and the cost-attribution problem | 10 min | Tags as organizational debt · minimum viable tag set · drift |
| L5 | The ten cost mistakes that show up on every bill | 11 min | Idle compute · orphan storage · forgotten snapshots · NAT GW · unused IPs · dev-running-as-prod · over-provisioned RDS · cross-AZ chatter · public-internet egress for internal traffic · over-retained logs |

---

## Module knowledge check (10 questions)

Available after you complete L5. Pass mark: 80%. Earn the **Bill-Reader** chip when you pass.

---

## Module diagram

A four-quadrant treemap of the cloud bill: compute time, stored bytes, moved bytes, API requests. Each quadrant labeled with the percentage band typical for that line item and the most common services it contains. Used as the cover for this module and re-used as the scaffold for Lessons L1, L2, and L5.

(SVG to be produced — see `assets/diagrams/M0.1_four_categories.svg` once issued.)

---

## What's next

After this module, continue to [M0.2 — FinOps Foundation principles](../M0.2_finops_principles/).
