# M0.3 — Why scheduling beats commitments at non-prod scale

§ T0 · M0.3 · Operator tier · 4 lessons · ~40 min

---

## Module outcome

Calculate the theoretical maximum savings of scheduling against commitments. Explain why "buy reservations for non-prod" is the textbook over-commitment mistake. Pick the right lever for any given workload.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [The math: 168 hours, 60-hour workweek, 64% off](L1_168_hour_math.md) | 10 min | Hours in a week · workweek windows · theoretical max · realistic max |
| L2 | [Commitments — what RIs, SPs, CUDs really save](L2_commitments.md) | 10 min | Effective discount · coverage · utilization · break-even |
| L3 | [The non-prod fallacy](L3_non_prod_fallacy.md) | 8 min | The textbook over-commitment mistake · utilization math · case study |
| L4 | [When scheduling wins, when commitments win](L4_decision_tree.md) | 10 min | Decision tree · the "schedule first, commit on the floor" rule · combined approaches |

**Total: 4 lessons, ~38 min**

---

## Module diagram

A side-by-side savings ladder: scheduling on the left, commitments on the right, with the floor showing where commitments should be calibrated after scheduling fires.

(Asset: `assets/diagrams/M0.3_savings_ladder.svg`.)

---

## Module knowledge check

10 questions. Earn the **Lever-Sequencer** chip on pass.

---

## What's next

[M0.4 — Rack rate vs. billing cost vs. amortized cost](../M0.4_rack_rate_vs_billing/).
