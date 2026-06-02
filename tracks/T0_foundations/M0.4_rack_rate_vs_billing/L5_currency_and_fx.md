# Currency, FX, and the date-specific exchange rate

§ T0 · M0.4 · L5 of 5 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **convert** non-USD cloud bills to USD using date-specific exchange rates **and recognize** the three FX-conversion mistakes that distort reports.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Produce a global cost report that reconciles against each region's local invoice." |
| **Personas** | FinOps Analyst · Finance Partner |
| **Prerequisites** | [L1–L4](L1_rack_rate.md) |
| **Time** | 8 minutes |
| **Bloom verb** | Convert (Apply) and Recognize (Understand) |

---

## 1. Concept

A cloud bill in a single currency is a solved problem. A cloud bill across multiple currencies — INR for India, GBP for UK, EUR for EU, USD for US — adds a layer that breaks naive reports.

The breaking point is the conversion rate. There is no "the" exchange rate. There is the rate **as of a specific date**, and that date matters.

### The rate-as-of problem

A USD/INR exchange rate today is 83.20. A year ago it was 79.50. Six months ago it was 81.10. A cloud bill in INR converted to USD using "today's rate" gives one answer; converted using the rate-as-of the day of the charge gives another.

For invoice reconciliation, the right rate is **the rate that the cloud provider used to issue the invoice**. For most providers, this is the rate on the first day of the billing month, with some providers using the average rate across the month.

For analytical reports across many months, picking a single "as-of-today" rate distorts the past — costs incurred at older rates get re-priced at the new rate, which is not what the company actually paid.

### Three mistakes to avoid

**Mistake 1 — Using today's rate for historical data.**
A team produces a 12-month USD trend. INR-billed regions convert at today's rate (83.20). The historical USD numbers do not match the historical invoices. Anyone trying to reconcile sees mismatches everywhere.

**Mistake 2 — Using one rate for all months.**
A team produces an annual report. The team picks "year-average USD/INR" and applies it uniformly. Months with stronger INR show as lower USD cost than the invoices say. Months with weaker INR show as higher.

**Mistake 3 — Mixing rates within a single report.**
A team produces a report that uses provider-published rates for known months and falls back to a current rate for unknown months. The report has two trust regimes within it. Users cannot tell which.

### The right approach

For every billing-period charge, store the converted USD value AND the original currency value AND the rate-as-of used:

```
cost_records schema (partial)
─────────────────────────────────────
billing_currency        VARCHAR  e.g. 'INR'
billing_amount          DECIMAL  in original currency
exchange_rate           DECIMAL  the rate USED at conversion
exchange_rate_as_of     DATE     date the rate corresponds to
cost_usd                DECIMAL  the converted USD amount
```

The schema is durable: future reports can re-aggregate by date, re-verify the conversion against historical rate data, and prove that month-3 conversions use month-3 rates.

### Which rate source

Three good sources, picked in order of preference:

1. **The cloud provider's own published rate.** AWS, GCP, Azure publish the rates they used on the invoice. Reconciliation is trivial.
2. **A central bank source.** Federal Reserve Bank H.10 release (USD), European Central Bank, RBI. Authoritative, free.
3. **A reliable third-party feed.** Open Exchange Rates, fixer.io. Frequent updates, paid for higher accuracy.

The pitfall: using the live-rate API at report-render time. The live rate changes constantly. A report that re-converts every time it is rendered gives a different number each render. Use the rate-as-of-billing-period as a stored value.

### How ZopNight handles it

ZopNight stores `exchange_rate` and `exchange_rate_as_of` per cost record. Conversions are computed once at sync time using the provider's stated rate when available, falling back to a published central-bank rate for the charge date. Subsequent reports query the stored USD value; they do not re-convert.

Supported display currencies: USD (default), INR, GBP, EUR. Settings → Display Currency switches the rendering; underlying storage is in USD with the original-currency value preserved for audit.

### Reading the invoice

A Finance partner reconciling an INR-billed AWS invoice against a ZopNight report needs three things to match:

1. The invoice INR total
2. The invoice's stated USD/INR rate for the period
3. The USD total

If any of the three do not match, the conversion was done with a different rate, on a different scope, or with a different exclusion (tax, credits). The two-source model from [L4](L4_two_source_model.md) plus the currency model from this lesson together produce reconcilable reports.

---

## 2. Demo

The same charge converted three ways:

```
ORIGINAL CHARGE: ₹50,000 (Azure Reservation, billed 2026-04-01)

CONVERSION                       RATE     USD       ERROR
────────────────────────────────────────────────────────────────
Provider-published (2026-04-01)  ₹83.10   $601.69   baseline
Mid-quarter rate (2026-05-15)    ₹83.40   $599.52   $2.17 off
Year-end rate (2026-12-31)       ₹84.20   $593.83   $7.86 off
"Today" rate (rendering time)    varies   varies    indefinite drift
```

A 1.3% drift on one record looks small. Multiplied across a year of records and many regions, the divergence becomes hundreds or thousands of dollars and the report is not reconcilable.

The right column: provider-published or central-bank as-of the charge date. Stored once. Re-used by every downstream report.

(Asset: `assets/diagrams/M0.4_L5_fx_conversion.svg`.)

---

## 3. Hands-on (5 min)

If your organization runs in multiple currencies:

```
1. Pick one non-USD billing region.
2. Find the most recent monthly invoice in original currency.
3. Find the FX rate the provider used (usually printed on the invoice
   or in a metadata field of the billing export).
4. Compute the USD equivalent.
5. Compare to your FinOps tool's USD number for that period.

If the two match within $1: the tool uses the right rate.
If they differ by 1–3%: the tool uses a different rate source. Investigate.
If they differ by >3%: the conversion is using a stale or today's rate.
                       Report needs fixing.
```

---

## 4. Knowledge check

### Q1
A team produces a 12-month USD trend report. Some months were billed in INR. The right rate to apply to month 5 of the past:

A. Today's USD/INR rate
B. Month 5's rate-as-of (the rate that was in effect when month 5 was billed)
C. The average annual rate
D. The lowest of the year

<details>
<summary>Show answer</summary>

**Correct: B.** Historical reports must use historical rates. Re-pricing the past at today's rate produces numbers that do not match historical invoices.
</details>

### Q2
A Finance partner reports a 4% discrepancy between the ZopNight USD report and the AWS invoice. Most likely cause:

A. ZopNight is broken
B. The conversion is using a different rate or different exclusions (tax, credits). Audit the rate-as-of, the currency, and any tax / credit adjustments.
C. AWS made a billing error
D. The Finance partner is reading the wrong invoice

<details>
<summary>Show answer</summary>

**Correct: B.** 4% is too small for software error and too large for rate-day noise. The most common cause is rate-source mismatch — provider used a slightly different rate from the cental-bank fallback. Audit and align.
</details>

### Q3
A team builds a report that re-converts cost values to USD every time the report is rendered, using the live FX rate. Most likely problem:

A. The report is fast
B. The same report viewed at different times shows different USD numbers, undermining trust. The fix is to store the converted USD value once at sync time and re-use it.
C. FX rates do not change enough to matter
D. The team should use a faster API

<details>
<summary>Show answer</summary>

**Correct: B.** Re-converting at render time means the report is not deterministic. The fix is rate-as-of storage.
</details>

---

## 5. Apply

ZopNight's currency handling is automatic:

- **Settings → Display Currency** selects rendering currency (USD default; INR / GBP / EUR available)
- **Cloud Accounts → Sync Status** shows the detected billing currency per account
- **Reports** show original currency in tooltips on hover for any non-USD record
- **The rate-as-of** is stored on each `cost_record` so historical reports stay reconcilable

To audit: pick any monthly trend, drill into a single non-USD region, hover any data point. The tooltip shows original currency, rate used, and rate-as-of date.

---

## Module quiz

You have now completed all five lessons of M0.4. The module quiz (10 questions, 80% pass) lives at [/certifications/operator/m0.4-quiz](../../../certifications/operator/m0.4-quiz.md). Pass to earn the **Cost-Source-Literate** chip.

---

## Related lessons

- [M0.5 — Multi-cloud taxonomy](../M0.5_multi_cloud_taxonomy/00_README.md) *(next module)*
- [T3.M3.5 — Showback design](../../T3_zopnight_architect/M3.5_showback/00_README.md)

## Glossary terms touched

[FX rate](../../../reference/glossary/fx-rate.md) · [Rate-as-of](../../../reference/glossary/rate-as-of.md) · [Currency reconciliation](../../../reference/glossary/currency-reconciliation.md) · [Date-specific exchange rate](../../../reference/glossary/date-specific-exchange-rate.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T0.M0.4.L5
