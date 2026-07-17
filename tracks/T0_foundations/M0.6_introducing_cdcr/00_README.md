# M0.6 — Introducing CDCR

§ T0 · M0.6 · Operator tier · 4 lessons · ~40 min

---

## Module outcome

Define CDCR — Continuous Detect, Continuous Remediation. Quantify the cost of detect-only practice. Explain the read-only safety model and its scoped-write extensions. Recognize the four things CDCR is *not* trying to do.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | ["Detect and act" — what CDCR means](L1_what_cdcr_means.md) | 10 min | The framing · vs detect-and-ticket · why "act" is the differentiator |
| L2 | [The cost of detect-only — case study](L2_cost_of_detect_only.md) | 10 min | Real numbers · time-to-remediation · waste accumulation |
| L3 | [Read-only safety: where it matters, where it doesn't](L3_read_only_safety.md) | 10 min | Discovery is read-only · writes are scoped · database denylist |
| L4 | [What CDCR is NOT — the boundaries](L4_what_cdcr_is_not.md) | 10 min | Not autopilot for everything · not bypass · not turning off ownership |

**Total: 4 lessons, ~40 min**

---

## Module diagram

The CDCR loop: detect → classify → remediate (or alert) → verify → re-detect. Annotated with which steps are read-only and which require scoped writes.

(Asset: `assets/diagrams/M0.6_cdcr_loop.svg`.)

---

## Module knowledge check

10 questions. Earn the **CDCR-Native** chip — and complete Track 0 — on pass.

---

## What's next

Complete Track 0 by taking the [Operator certification exam](../../../certifications/operator/00_README.md) (free, 20 questions, 30 min). Or continue straight to [Track 1 — ZopDev Certified: Operator](../../T1_zopnight_operator/00_README.md) to learn the product.
