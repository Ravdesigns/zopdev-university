# Anatomy of a schedule — name, timezone, crons

§ T1 · M1.3 · L1 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **create** a minimal schedule with the four required fields **and explain** the role each field plays in execution.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Create a schedule end-to-end without copy-paste from a template I don't understand." |
| **Personas** | Platform Engineer · FinOps Analyst |
| **Prerequisites** | Track 0 M0.3 (the math), M1.1 + M1.2 |
| **Time** | 10 minutes |
| **Bloom verb** | Create (Apply) and Explain (Understand) |

---

## 1. Concept

A schedule in ZopNight has four required fields and a few optional ones. Once you know the four, every other complication (presets, groups, overrides) is a layer on top.

### The four required fields

```
NAME                 Human-readable, unique within the org
                     e.g., "dev-and-staging-business-hours"

DESCRIPTION          One line of context for teammates
                     e.g., "Stops dev and staging non-prod Mon-Fri 8pm,
                            starts 8am ET. Excludes ephemeral envs."

TIMEZONE             IANA format
                     e.g., "America/New_York" not "EST"

CRONS                One or more cron expressions, each with an action
                     e.g., start cron + stop cron
```

### Why timezone matters

A cron without a timezone is ambiguous. ZopNight requires IANA timezone (e.g., `Europe/London`, `Asia/Kolkata`, `America/Los_Angeles`) so that:

- Crons fire at the same local clock time regardless of daylight saving transitions
- A team in India and a team in California can each have their own schedules in their own timezones
- The visual 24-hour grid renders in the timezone of the schedule, not the viewer

A common mistake: setting a schedule in UTC for a team in a different timezone. The team sees crons firing at "wrong" hours after DST shifts. The fix: use the team's local IANA timezone.

### Why multiple crons

A schedule typically has at least two crons:

```
SCHEDULE: dev-business-hours
  Timezone: America/New_York
  
  Cron #1   "0 8 * * 1-5"           Action: start    "Weekdays 8 AM"
  Cron #2   "0 20 * * 1-5"          Action: stop     "Weekdays 8 PM"
```

The same schedule can have additional crons for finer control:

```
SCHEDULE: aggressive-cost-saver
  Timezone: Europe/London
  
  Cron #1   "0 7 * * 1-5"           Action: start    "Weekdays 7 AM"
  Cron #2   "0 19 * * 1-5"          Action: stop     "Weekdays 7 PM"
  Cron #3   "0 0 * * 0,6"           Action: stop     "Weekend midnight"
```

Three crons combine into one schedule that turns on at 7am weekdays, stops at 7pm weekdays, and ensures it's off all weekend.

### Optional fields

A schedule can also carry:

- **Tags** (for organizing many schedules)
- **Notification overrides** (per-schedule webhook routing)
- **Max override duration** (the longest a force-on / force-off override can be set; see M1.5)
- **Schedule scope tags** (filter resources by tag at attach time)

These are not required to create a working schedule. Leave them blank for the first one.

### What the schedule does NOT carry

Three things are deliberately separate from the schedule:

1. **Resource attachment** — covered in L5. A schedule is the cadence; the attachment is what it acts on. Many resources can share one schedule.
2. **Group attachment** — also L5. Same principle: a schedule attaches to groups for cascade application.
3. **Action sequencing** — covered in M1.4 (groups). Sequencing lives on the group, not the schedule.

The separation lets schedules be reused across many resources and groups without duplication.

### The create flow

```
T+0       Schedules page → New Schedule
T+5 sec   Type a name and description
T+10 sec  Pick timezone (IANA format from the dropdown)
T+15 sec  Add cron #1 with action (start | stop)
T+20 sec  ZopNight shows human-readable summary ("every weekday at 8:00 AM")
T+25 sec  Add cron #2 with action
T+30 sec  Save → schedule is created
T+35 sec  Schedule is empty (no resources yet). Next: attach resources (L5)
```

Less than a minute to create the schedule. Attachment is a separate step.

### Visual preview before save

The create dialog shows a 24-hour weekly grid preview as the user adds crons. Each cron lights up the corresponding hours. The grid makes it obvious whether the schedule has gaps or overlaps before save. (Full coverage in L3.)

### Update and delete

A schedule can be edited at any time. Editing affects future firings; past firings are not retroactive.

Deleting a schedule requires **name-confirmation** (typing the schedule name into a confirmation field) to prevent accidents. The name-confirmation pattern is the same one used for destructive operations elsewhere in the product.

---

## 2. Demo

A complete schedule, created step by step:

```
CREATE SCHEDULE
─────────────────────────────────────────────────────────
Name:         dev-and-staging-eu-business-hours
Description:  Starts dev and staging non-prod Mon-Fri 8am UTC+1,
              stops 8pm UTC+1. EU team coverage.
Timezone:     Europe/London

Crons:
  ┌───────────────────────────────────────────────────────┐
  │  Cron expression  "0 8 * * 1-5"                       │
  │  Human readable   "every weekday at 8:00 AM"          │
  │  Action          [Start ▾]                            │
  └───────────────────────────────────────────────────────┘
  ┌───────────────────────────────────────────────────────┐
  │  Cron expression  "0 20 * * 1-5"                      │
  │  Human readable   "every weekday at 8:00 PM"          │
  │  Action          [Stop ▾]                             │
  └───────────────────────────────────────────────────────┘
  
  + Add another cron

VISUAL PREVIEW (24-hour weekly grid)
  Mon ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░  (ON 8am-8pm)
  Tue ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
  Wed ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
  Thu ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
  Fri ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
  Sat ░░░░░░░░░░░░░░░░░░░░░░░░  (OFF — last stop on Fri 8pm)
  Sun ░░░░░░░░░░░░░░░░░░░░░░░░

ESTIMATED SAVINGS                         (with resources attached)
  Active hours/week:     60
  Inactive hours/week:  108
  Savings vs always-on:  64.3%

[Cancel]                                              [Save schedule]
```

The grid + savings estimator together give the user confidence before saving.

(Asset: `assets/diagrams/M1.3_L1_schedule_create.svg`.)

---

## 3. Hands-on (6 min)

Create your first schedule (use a sandbox if production resources are at risk):

```
1. Open Schedules → New Schedule.
2. Name it something clear: "non-prod-business-hours-test".
3. Description: one sentence.
4. Pick your team's IANA timezone.
5. Add cron #1: "0 8 * * 1-5"  → action = Start (weekdays 8am)
6. Add cron #2: "0 20 * * 1-5" → action = Stop (weekdays 8pm)
7. Verify the human-readable preview.
8. Note the 24-hour grid in the preview.
9. Save. The schedule is created but empty.

For now, do not attach resources. We'll cover attachment in L5.
```

---

## 4. Knowledge check

### Q1
The four required fields on a ZopNight schedule are:

A. Name, description, timezone, crons
B. Name, region, account, resources
C. Cron, timezone, action, resource
D. Name, tags, action, schedule type

<details>
<summary>Show answer</summary>

**Correct: A.** Name + description + timezone + at least one cron. Resources are attached separately.
</details>

### Q2
A schedule's timezone is set to "EST" (not "America/New_York"). The most likely consequence:

A. Works fine
B. Fails to save — IANA format is required. EST is not a valid IANA timezone (DST is ambiguous; America/New_York correctly handles the EDT transitions).
C. Saves but fires twice
D. Saves but fires at midnight always

<details>
<summary>Show answer</summary>

**Correct: B.** ZopNight requires IANA timezones because they handle DST correctly. EST without an offset adjustment becomes ambiguous when DST shifts.
</details>

### Q3
A schedule has two crons: "0 8 * * 1-5" start and "0 20 * * 1-5" stop. The same schedule is attached to 47 resources. The total schedule executions per week:

A. 47
B. 2 × 5 × 47 = 470 actions per week (2 crons × 5 weekdays × 47 resources)
C. 2
D. 10

<details>
<summary>Show answer</summary>

**Correct: B.** Each cron fires once per day, each firing acts on each attached resource. 470 actions per week is the total. The worker pool processes these in parallel; the customer doesn't see 470 individual moments.
</details>

---

## 5. Apply

Schedule creation is in:

- **[Schedules page](https://app.zopnight.com/schedules)** → New Schedule
- The form validates IANA timezone strings and cron syntax inline
- The visual preview updates as you type
- The savings estimator activates once resources are attached (L5)

For complex schedule design patterns (rolling environments, freeze windows, demo prod), see [T5.M5.2 — Schedule design patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md).

---

## Related lessons

- [L2 — Cron expressions without tears](L2_cron_expressions.md) *(next)*
- [L3 — The 24-hour weekly grid](L3_weekly_grid.md)
- [L4 — Three preset schedules](L4_preset_schedules.md)

## Glossary terms touched

[Schedule](../../../reference/glossary/schedule.md) · [IANA timezone](../../../reference/glossary/iana-timezone.md) · [Cron expression](../../../reference/glossary/cron-expression.md) · [Name-confirmation](../../../reference/glossary/name-confirmation.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.3.L1
