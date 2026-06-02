# M1.4 — Resource Groups

§ T1 · M1.4 · Operator tier · 4 lessons · ~40 min

---

## Module outcome

Create resource groups for stable membership. Add and remove members in bulk. Configure sequenced execution (storage → compute → app). Recognize when a group is the right scaling pattern over per-resource attachment.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [Why groups — exclusive membership and one source of truth](L1_why_groups.md) | 10 min | Stable membership · exclusive ownership · group vs resource attachment |
| L2 | [Creating and managing groups](L2_creating_groups.md) | 10 min | Name · description · budget · soft delete |
| L3 | [Bulk add and remove with search](L3_bulk_members.md) | 10 min | Search across · multi-select · membership migration |
| L4 | [Sequenced execution — storage / compute / app](L4_sequenced_execution.md) | 10 min | Auto vs custom ordering · per-resource delay · tier-based priorities |

**Total: 4 lessons, ~40 min**

---

## Module diagram

A group lifecycle diagram: create group → add members → attach schedule → schedule fires with sequenced ordering (storage starts first, compute next, app tier last).

(Asset: `assets/diagrams/M1.4_group_lifecycle.svg`.)

---

## Module knowledge check

10 questions. Earn the **Group-Architect** chip on pass.

---

## What's next

[M1.5 — Overrides](../M1.5_overrides/00_README.md).
