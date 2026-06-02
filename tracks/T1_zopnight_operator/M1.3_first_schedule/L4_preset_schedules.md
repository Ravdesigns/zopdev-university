# Three preset schedules

§ T1 · M1.3 · L4 of 6 · Operator tier · 8 min

---

## Outcome

By the end of this lesson, you will be able to **apply** the right preset schedule (Business Hours, Peak Hours, Weekend Scale-Down) to a workload **and explain** when to customize from a preset.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Get a sensible schedule running in under 30 seconds." |
| **Personas** | All product users |
| **Prerequisites** | [L1–L3](L1_schedule_anatomy.md) |
| **Time** | 8 minutes |
| **Bloom verb** | Apply (Apply) and Explain (Understand) |

---

## 1. Concept

Most schedules in production fall into three patterns. ZopNight ships three preset schedules that cover these patterns. Customers can use a preset as-is or as a starting point to customize. The presets are documented; they are not magic.

### Preset 1 — Business Hours

```
NAME:         Business Hours
INTENT:       Resources ON during business hours, OFF outside
TIMEZONE:     (customer picks at apply time)

CRONS:
  Cron #1   "0 8 * * 1-5"     Start    weekdays 8 AM
  Cron #2   "0 20 * * 1-5"    Stop     weekdays 8 PM
  Cron #3   "0 0 * * 0,6"     Stop     midnight Saturday and Sunday
                              (belt-and-suspenders weekend stop)

COVERAGE:
  ON hours/week:    60 (12h × 5 weekdays)
  OFF hours/week:   108
  Theoretical savings vs always-on:  64.3%
  Realistic savings (0.7× realism factor):  ~45%

BEST FOR:
  Dev, staging, test environments used during business hours
  Long-running workloads that don't need 24/7 availability
```

This is the canonical preset. About 70% of customer schedules are this pattern with minor timezone or hour adjustments.

### Preset 2 — Peak Hours

```
NAME:         Peak Hours
INTENT:       Scale UP during peak traffic, scale DOWN off-peak
TIMEZONE:     (customer picks)

CRONS:
  Cron #1   "0 11 * * *"      Start (or Scale up)   daily 11 AM
  Cron #2   "0 22 * * *"      Stop  (or Scale down) daily 10 PM

COVERAGE:
  ON hours/week:    77 (11h × 7 days)
  OFF hours/week:   91
  Theoretical savings vs always-on:  54.2%

BEST FOR:
  Production capacity above the floor — autoscaler scale-out triggers
  Workloads with predictable diurnal traffic (consumer apps, marketing
  workloads)
  
NOT FOR:
  Always-on production (use a different pattern)
  Workloads with weekend traffic peaks (customize the days field)
```

Peak Hours is the right preset for *additional capacity above the always-on floor*, not for the always-on baseline itself. Use with autoscaling rather than start/stop where appropriate.

### Preset 3 — Weekend Scale-Down

```
NAME:         Weekend Scale-Down
INTENT:       Scale OFF entirely for the weekend
TIMEZONE:     (customer picks)

CRONS:
  Cron #1   "0 0 * * 6"       Stop     midnight Saturday (Friday night)
  Cron #2   "0 8 * * 1"       Start    Monday 8 AM

COVERAGE:
  ON hours/week:   ~112 (Mon 8am - Sat midnight)
  OFF hours/week:   ~56
  Theoretical savings vs always-on:  33.3%

BEST FOR:
  Workloads that run weekdays but should be OFF entirely on weekends
  Cost-sensitive dev environments where weekend usage is rare
  Backup of business hours pattern for engineers in unusual hours

NOT FOR:
  Production that serves weekend traffic
```

Weekend Scale-Down is gentler than Business Hours (doesn't stop nightly). Good fit for teams whose engineers occasionally work late but never weekends.

### How presets behave on apply

When a customer chooses a preset:

```
1. Click "Use preset Business Hours"
2. Customer picks the timezone for this instance
3. Customer reviews the auto-generated crons (visible, editable)
4. Customer renames if needed (default: "Business Hours")
5. Save
6. Attach resources (L5)
```

The preset is **not a special schedule type**. It is a regular schedule, just pre-populated with the canonical crons. The customer can edit any cron after applying the preset.

### When to customize from a preset

Three common customizations:

**1. Shift the hours.** Different team, different working hours. Edit the cron from `0 8` to `0 9` for a 9 AM start.

**2. Add a region-specific shift.** A team in Asia/Kolkata applies Business Hours preset, but their workday is 10 AM - 7 PM. Edit cron #1 from `0 8 * * 1-5` to `0 10 * * 1-5` and cron #2 from `0 20 * * 1-5` to `0 19 * * 1-5`.

**3. Add a Friday early-stop.** Some teams finish early Friday. Add a cron `0 17 * * 5` for "Stop at 5 PM Friday" as a more aggressive stop on top of the Business Hours preset.

### When to NOT use presets

Two situations:

- **Complex schedules** (rolling environments, freeze windows, demo prod). These deserve custom design — see [T5.M5.2](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md).
- **Tightly coupled to specific workload behavior.** A workload that runs every Tuesday for 3 hours doesn't match any preset. Build a custom schedule.

For everything else, presets are the right starting point.

---

## 2. Demo

Customer onboarding flow with presets:

```
T+0       Customer connects AWS account
T+10 min  Discovery completes; 187 non-prod resources discovered
T+11 min  Customer goes to Schedules → New
T+11 min  Choose "Use preset: Business Hours"
T+11 min  Pick timezone: America/Los_Angeles
T+12 min  Verify crons in the grid
T+12 min  Save (still empty)
T+13 min  Attach: filter resources to environment=dev (the grouped filter
          from M1.2), bulk-select all 187, attach to schedule
T+14 min  Schedule is active. Next firing: Monday 8 AM PT, will stop all
          187 resources

REALIZED MONTHLY SAVINGS (first month): $22,300
```

Fifteen minutes from cloud connection to active scheduling on 187 resources. Presets are the reason it's that fast.

(Asset: `assets/diagrams/M1.3_L4_preset_apply.svg`.)

---

## 3. Hands-on (5 min)

Apply one of the three presets:

```
1. Schedules → New Schedule.
2. Choose "Use preset" → pick "Business Hours" (or whichever fits).
3. Pick your team's timezone.
4. Review the crons — verify the human-readable preview matches intent.
5. View the 24-hour grid — check for any gap or overlap.
6. Customize if needed (e.g., shift start to 9 AM instead of 8 AM).
7. Save.
8. Do NOT attach resources yet — that is L5.

If the preset doesn't match your team's working hours:
- Edit the start cron's hour field
- Edit the stop cron's hour field
- The day-of-week field stays the same (1-5 for weekdays)
- The grid updates as you type
```

---

## 4. Knowledge check

### Q1
The Business Hours preset has three crons. The third is a redundant weekend stop. The reason it exists:

A. Backwards compatibility
B. Belt-and-suspenders — catches the case where a manual start fires on Friday evening and would otherwise leave the resource running all weekend. Idempotent on already-stopped resources.
C. Performance
D. Required by AWS

<details>
<summary>Show answer</summary>

**Correct: B.** The belt-and-suspenders weekend stop is defensive. It does nothing in the normal case (resource already stopped from Friday 8 PM); it catches the edge case of a manual override or late start.
</details>

### Q2
A team applies the Peak Hours preset to their production EC2 fleet. They start seeing customer impact at 10:30 PM each day. Most likely cause:

A. The preset is broken
B. Peak Hours stops at 10 PM. If the production fleet has actual traffic past 10 PM, the preset is the wrong tool. Production should not be on a start/stop schedule unless explicitly non-24/7. Use autoscaling or a different preset.
C. The cron is off by an hour
D. DST shift

<details>
<summary>Show answer</summary>

**Correct: B.** Peak Hours is for capacity above the always-on floor, not for the floor itself. Production typically needs an always-on baseline with scale-out triggers, not a start/stop schedule.
</details>

### Q3
A team in Asia/Kolkata applies the Business Hours preset. They forget to change the timezone from the default (which is the customer's primary timezone, e.g., America/New_York). The likely outcome:

A. Works fine
B. The schedule fires at 8 AM and 8 PM America/New_York — which is 5:30 PM and 5:30 AM Asia/Kolkata. The Kolkata team finds resources stopping mid-afternoon and starting at dawn. The fix is to set the timezone to Asia/Kolkata.
C. The schedule doesn't fire
D. AWS rejects the timezone

<details>
<summary>Show answer</summary>

**Correct: B.** Timezone is per-schedule. A team that doesn't change it after applying a preset will see crons fire in the default timezone. The grid (L3) would catch this before save — the visual would show "stop at 5:30 PM" not "stop at 8 PM" in the team's local time.
</details>

---

## 5. Apply

Presets are in the schedule create dialog:

- **[Schedule create](https://app.zopnight.com/schedules/new)** — preset picker is the first choice in the dialog
- Edit any preset's crons after applying — the preset is a starting point, not a constraint
- The 24-hour grid renders identically whether the schedule came from a preset or was written from scratch

For complex schedule patterns beyond the three presets, see [T5.M5.2](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md).

---

## Related lessons

- [L5 — Attaching resources and groups](L5_attaching.md) *(next)*
- [L6 — The savings estimator](L6_savings_estimator.md)
- [T5.M5.2 — Schedule design patterns](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md)

## Glossary terms touched

[Business Hours preset](../../../reference/glossary/business-hours-preset.md) · [Peak Hours preset](../../../reference/glossary/peak-hours-preset.md) · [Weekend Scale-Down preset](../../../reference/glossary/weekend-scale-down-preset.md) · [Preset](../../../reference/glossary/preset.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.3.L4
