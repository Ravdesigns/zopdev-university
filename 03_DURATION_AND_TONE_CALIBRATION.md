# Duration, lesson-count, and tone calibration

**Companion to:** [`00_PLAN.md`](00_PLAN.md), [`01_INFORMATION_ARCHITECTURE.md`](01_INFORMATION_ARCHITECTURE.md), [`02_TOPIC_COMPENDIUM.md`](02_TOPIC_COMPENDIUM.md)
**Purpose:** Lock the per-lesson duration, the per-track lesson count, and the brand-voice rules — calibrated against the best e-learning platforms in the industry.

---

## 1. Industry benchmark — what good looks like

Measured directly (where the data was reachable) and pulled from training knowledge for the rest. All numbers reflect *typical* per-course / per-lesson structure, not outliers.

| Platform | Lesson length | Lessons per module | Modules per course | Total course duration | Format mix | Voice register |
|---|---|---|---|---|---|---|
| **Coursera** (AWS Cloud Tech. Essentials, measured) | 5.4 min/video avg · 12 min reading avg | 14–25 sub-items / week | 4 | **20 hrs** | 56 videos + 36 readings + 4 quizzes + 4 labs | Academic + warm |
| **Pluralsight** | 4–8 min/clip | 5–10 | 6–10 | 3–6 hrs | Video-heavy | Authoritative |
| **LinkedIn Learning** | 3–6 min/video | 5–15 | 3–6 | 1–4 hrs | Video-heavy | Conversational |
| **AWS Skill Builder** | 5–10 min/lesson | 4–8 | 4–10 | 4–12 hrs | Video + lab + quiz | Direct, technical |
| **HashiCorp Learn** | 10–20 min/tutorial | 3–8 | n/a (collections) | 1–6 hrs | Tutorial + browser sandbox | Direct, terse |
| **Snowflake University** | 8–15 min/lesson | 5–10 | 4–8 | 4–10 hrs | Video + hands-on | Friendly expert |
| **Khan Academy** | 3–7 min/video | 5–10 | 5–15 | 5–30 hrs | Video + exercises | Patient teacher |
| **Brilliant** | 10–15 min/lesson | n/a (course = lessons) | n/a | 2–15 hrs | Interactive puzzles | Curious + playful |
| **Codecademy** | 5–15 min/lesson | 5–15 | 3–8 | 1–25 hrs | Interactive code | Encouraging |
| **MasterClass** | 8–15 min/episode | n/a (class = episodes) | n/a | 3–5 hrs | Video-only | Cinematic |
| **Duolingo** | 3–5 min/unit | n/a | n/a (path) | indefinite | Microlearning gamified | Gamified |
| **FinOps Foundation FOCP prep** | 15–20 min/lesson | 5–8 | 4 | 9 hrs | Video + reading | Industry-standard |
| **Vantage University** | 5–10 min/video | n/a (8 features) | n/a | ~1 hr | Video + interactive demos | Instructional, terse |

**Convergence band:** lessons cluster at **5–12 minutes**, modules at **5–8 lessons**, courses/tracks at **3–12 hours**. Our current design sits dead-center.

---

## 2. The standards we lock in

| Standard | Value | Rationale |
|---|---|---|
| **Lesson length (target)** | **7–10 min reading time** (~800–1,200 words + 1 diagram + quiz) | Coursera's median; reading-led is faster than video, so we can pack more concept |
| **Lesson length (hard ceiling)** | **15 min** | Beyond this, split into two lessons |
| **Lesson length (hard floor)** | **4 min** | Below this, fold into the adjacent lesson |
| **Lessons per module** | **4–8** (target 5–6) | Coursera, Snowflake, AWS norms |
| **Modules per track** | **6–10** | Coursera/Snowflake norm; our T2 at 11 modules is at the upper end and acceptable |
| **Total track duration** | **3–12 hours** | T0 = 4.5 hrs, T1 = 4.5 hrs, T2 = 8 hrs, T3 = 6 hrs, T4 = 5 hrs, T5 = 5.5 hrs, T6 = 5.5 hrs — all in band |
| **Knowledge check per lesson** | **2–3 MCQs** with answer + explanation | Brilliant/Codecademy norm; Coursera puts these at module level only — we prefer per-lesson for recall pulse |
| **Module quiz** | **10 MCQs** (sampled from lesson knowledge checks + 4 net-new) | Lighter than Coursera's 15–20 — appropriate for self-paced + free |
| **Hands-on per module** | **1 lab** (graded for L200+, ungraded "tour" for Operator) | Coursera puts 1 per week; we match |
| **Diagram per lesson** | **1 signature diagram** (ASCII inline acceptable for V1; SVG when produced) | Cognitive Load Theory: one strong picture beats five weak ones |
| **Reading vs video balance** | **Reading-led, optional 60–90s video** per lesson | Stripe Docs / HashiCorp Learn pattern; cheaper to produce, faster to update |
| **Code samples** | **Yes — inline, copy-able, with `// comment` callouts** | Stripe pattern; teaches encoding conventions in-line |

---

## 3. Per-track sanity check against the standard

| Track | Modules | Lessons | Avg lesson length | Total time | In band? |
|---|---|---|---|---|---|
| T0 Foundations | 6 | 27 | 9 min | 4.5 hrs | ✅ |
| T1 ZopNight Operator | 6 | 28 | 9 min | 4.5 hrs | ✅ |
| T2 ZopNight Engineer | 11 (with new M2.11 Bedrock) | 54 | 9 min | 8 hrs | ✅ |
| T3 ZopNight Architect | 8 | 38 | 9 min | 6 hrs | ✅ |
| T4 FinOps Mastery | 8 (with new M4.8 Sustainability) | 37 | 9 min | 5.5 hrs | ✅ |
| T5 DevOps Cost Discipline | 7 | 33 | 9 min | 5 hrs | ✅ |
| T6 AI-Powered Cloud Ops | 6 | 34 | 8 min (recipes shorter) | 4.5 hrs | ✅ |
| **Updated total** | **52 modules** | **251 lessons** | — | **38 hrs** | ✅ |

**Scope update:** lesson count rose from 241 to **251** with the new M2.11 (Bedrock + ML cost, 5 lessons) and M4.8 (Sustainability + carbon, 5 lessons). Both confirmed by your answers.

---

## 4. Tone calibration — Stripe Docs as our gold standard

Stripe's technical docs are the most-cited brand-voice exemplar in B2B SaaS. The fetched analysis surfaced eight stylistic patterns we adopt and one we deviate from. Voice rules below supersede the brief mention in `00_PLAN.md` §2.

### 4.1 Adopt verbatim (from Stripe)

**A. State the recommendation first, the rationale second.**
- ❌ "Because EBS, snapshots, network, and CloudWatch also charge against an instance, the true cost is higher than the EC2 row alone."
- ✅ "The true cost is 25 to 60 percent higher than the EC2 row alone. EBS, snapshots, network, and CloudWatch each charge separately against the same instance."

**B. Use the imperative without "you" wherever possible.**
- ❌ "You should open the bill and find the resource row."
- ✅ "Open the bill. Find the resource row."

**C. Give agency to the product or system, not the reader.**
- ❌ "You'll see your costs split across four categories."
- ✅ "The bill splits across four categories." or "ZopNight splits the bill across four categories on the Reports page."

**D. Parentheses as the teacher's aside.**
- Used for clarifications, scope caveats, and reveal of what is hidden:
- "The rate card carries a public unit price (the rack rate) for every row."
- "You can see the cost (but not the customer who incurred it)."

**E. Repeat code patterns across variants — show, don't abstract.**
- When showing how to query the same data three ways, show all three CLI commands in full. Don't write "you'd run a similar command for GCP."

**F. Consistent terms — never synonymize.**
- We say **rack rate** always. Not "list price," "catalog price," "on-demand price," or "sticker price."
- We say **CDCR** always. Not "detect-and-act" as a synonym after first introduction.
- We say **resource group**, **schedule**, **override**, **recommendation** — never "bundle," "policy," "exception," "suggestion."

**G. No contractions in technical body copy.**
- "Do not" not "don't" in instructions. Contractions allowed in narrative lead-ins and quiz feedback.

**H. Comment-in-code as the teacher.**
- Every code block carries `// Amount in cents` style annotations that teach an encoding convention as a byproduct of the example.

### 4.2 Deviate from Stripe (deliberately)

**I. We use "you" sparingly, but we use it.** Stripe avoids "you" almost entirely. We need it for the **Outcome** sentence ("you will be able to identify…") and the **Apply** CTA. Limit "you" to those two spots per lesson plus the hands-on instructions where it reads as natural.

### 4.3 Voice rules that come from `DESIGN.md` and `/zopnight-branded`

- **Periods over em-dashes.** Em-dashes banned in lesson body. Use commas, colons, periods, parentheses.
- **Specific numbers always.** "$96.90" not "around a hundred dollars." "25 to 60 percent" not "significantly more."
- **No banned words.** amazing, powerful, transform, leverage, revolutionize, best-in-class, industry-leading, robust, seamless, cutting-edge, innovative.
- **Sentence case for headings.** "What's actually in a cloud bill" not "What's Actually In A Cloud Bill."
- **Mono uppercase for meta labels.** "OUTCOME" "CONCEPT" "HANDS-ON" rendered in mono caps in the visual layer.
- **Line length aim:** 14–18 words/sentence median; one sentence per idea; no run-ons.

---

## 5. Calibration applied to L1 (audit)

Quick pass against the new standards on the already-shipped L1 (`L1_what_is_in_a_cloud_bill.md`):

| Standard | L1 score | Note |
|---|---|---|
| Lesson length 7–10 min | ✅ 9 min | In band |
| Quiz 2–3 MCQs | ✅ 3 MCQs | Hit |
| 1 signature diagram | ✅ ASCII 4-category table | Hit |
| Imperative without "you" | ⚠️ Partial | "You will be able to" used twice unnecessarily; "your bill" reads slightly soft. Tightenable. |
| Consistent terms | ✅ | "rack rate" used 4×; never synonymized |
| Periods over em-dashes | ✅ | Zero em-dashes in body |
| Banned words | ✅ | Zero |
| Specific numbers | ✅ | "$69.20" "$96.90" "25 to 60 percent" |
| Stripe-style code comments | ✅ | `--filter '{"Dimensions":...}'` block has inline structure |

L1 verdict: **ship as-is**, minor "you" trimming optional. L2 onward will hit the tighter voice from the start.

---

## 6. What changes in lesson authoring from L2 onward

1. **Trim "you" to 2–3 instances per lesson** (Outcome, Apply CTA, Hands-on).
2. **Lead every section with the result, not the setup.**
3. **One diagram per lesson, ASCII acceptable, SVG when assets land.**
4. **Code samples are full, not "similar to."**
5. **Parentheses do teaching work** — don't waste them on filler.
6. **"Last reviewed" date** updated when re-edited; lesson ID and tier line up with `01_INFORMATION_ARCHITECTURE.md`.

---

## 7. Open question, deferred

| Item | Decision |
|---|---|
| Coursera-style 15–20 Q module quiz vs. our 10 Q | **Hold at 10 Q** for self-paced free audience. Revisit if cert-exam pass rates suggest learners haven't earned the badge they're claiming. |
| Stripe-style "no `you`" deeper enforcement | **Soft-enforce.** Editorial board flags excessive "you" but doesn't block. |
| Reading-led vs. video-led | **Reading-led for V1.** Add 60–90s explainer videos for the 30 highest-traffic lessons in V2 (measured by analytics). |

---

§ Last reviewed 2026-05-20 · Owner: ZopDev University editorial board
