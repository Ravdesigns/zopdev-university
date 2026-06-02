# M0.4 — Rack rate vs. billing cost vs. amortized cost

§ T0 · M0.4 · Operator tier · 5 lessons · ~50 min

---

## Module outcome

Distinguish rack rate, billing cost, and amortized cost. Explain Azure's amortized-vs-actual gotcha. Read the two-source cost model. Convert non-USD bills with date-specific FX rates.

---

## Lessons

| # | Lesson | Time | Key topics |
|---|---|---|---|
| L1 | [What "rack rate" actually means](L1_rack_rate.md) | 9 min | Pricing API · live calculation · why rack rate is the right savings number |
| L2 | [Billing cost — and why it's lower than rack rate](L2_billing_cost.md) | 9 min | What you actually paid · the discount stack · sources of friction |
| L3 | [Amortized cost — Azure's gotcha](L3_amortized_azure.md) | 10 min | Why ActualCost shows $0 for reservations · amortized as the right column · the trap |
| L4 | [The two-source cost model](L4_two_source_model.md) | 10 min | Rack + Billing · when to use which · ZopNight's `cost_source` semantics |
| L5 | [Currency, FX, and the date-specific exchange rate](L5_currency_and_fx.md) | 8 min | Multi-currency bills · FX as of date · common mistakes |

**Total: 5 lessons, ~46 min**

---

## Module diagram

A stacked-bar comparison showing the same resource priced as rack rate, billing (unblended), and amortized — with the gaps labelled by the friction (discount type) responsible.

(Asset: `assets/diagrams/M0.4_three_costs.svg`.)

---

## Module knowledge check

10 questions. Earn the **Cost-Source-Literate** chip on pass.

---

## What's next

[M0.5 — Multi-cloud taxonomy](../M0.5_multi_cloud_taxonomy/).
