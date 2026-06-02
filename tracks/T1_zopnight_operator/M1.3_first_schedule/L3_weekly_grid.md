# The 24-hour weekly grid — spotting gaps and overlaps

§ T1 · M1.3 · L3 of 6 · Operator tier · 10 min

---

## Outcome

By the end of this lesson, you will be able to **read** the 24-hour weekly grid **and spot** gaps and overlaps in a schedule before save.

---

| | |
|---|---|
| **Tier** | Operator |
| **JTBD** | "Catch the cron bug before it costs us a Saturday outage." |
| **Personas** | All product users |
| **Prerequisites** | [L1](L1_schedule_anatomy.md), [L2](L2_cron_expressions.md) |
| **Time** | 10 minutes |
| **Bloom verb** | Read (Understand) and Spot (Analyze) |

---

## 1. Concept

Cron expressions are precise but not visual. A team can write three crons and confidently believe they cover the intent — and only discover the gap when Saturday morning's bill arrives. The 24-hour weekly grid catches these mistakes before save.

### What the grid shows

```
            00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23
Mon         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Tue         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Wed         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Thu         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Fri         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Sat         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
Sun         ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░

LEGEND: ██ ON   ░░ OFF
```

This is the visual representation of `0 8 * * 1-5` (start) + `0 20 * * 1-5` (stop). The grid shows ON blocks at 8 AM through 8 PM on weekdays, OFF blocks everywhere else.

The grid is interactive in the product: hover any cell to see the exact firing context ("Started by Cron #1 at 08:00, will stop at Cron #2 at 20:00").

### Three failure modes the grid catches

**Failure 1 — The unintended gap.**

Cron: `0 8 * * 1-5` (start) + `0 18 * * 1-5` (stop). Intent: "weekdays 8am-6pm."

Grid:
```
            ... 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 ...
Mon         ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ...
```

ON 8 AM through 6 PM. That's 10 hours per weekday, not 12. If the intent was 8 AM through 8 PM, the cron `0 18 * * 1-5` is wrong — it stops too early. The grid reveals this. The fix: change the stop cron to `0 20 * * 1-5`.

**Failure 2 — The unintended overlap.**

Cron #1: `0 8 * * 1-5` (start), Cron #2: `0 20 * * 1-5` (stop), Cron #3: `0 9 * * 1-5` (start).

The third cron is redundant — it tries to start the resource at 9 AM when the resource was already started at 8 AM by cron #1. The grid shows two ON triggers in the morning. Not destructive but noisy in the action log. The fix: remove cron #3.

**Failure 3 — The weekend trap.**

Cron #1: `0 8 * * 1-5` (start), Cron #2: `0 20 * * 1-5` (stop). 

```
Mon-Fri ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░
Sat     ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
Sun     ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
```

This is correct AS LONG AS the resource was OFF on Friday at 8 PM. If a manual start fired on Friday 9 PM (for an overnight build), the schedule has no stop cron between Friday-stop (already passed at 8 PM) and Monday-start (next firing) — so the resource stays running all weekend.

The fix: add a belt-and-suspenders weekend stop cron: `0 0 * * 0,6` ("midnight Saturday and Sunday"). It's redundant when the schedule is operating normally but catches the edge case.

### Reading the grid for one specific firing

Hovering over any cell in the grid (in the product) shows the firing context:

```
Tuesday 14:30 (cell hover)
─────────────────────────────────────────────────
State at this time: ON
Most recent firing: Cron #1 at Tuesday 08:00 (Start)
Next firing:         Cron #2 at Tuesday 20:00 (Stop)
Time until next:     5h 30m
```

This is the right level of detail to confirm the schedule's behavior at any point in the week.

### What the grid does NOT show

Two limitations:

1. **It does not show overrides.** Force-on / force-off overrides (M1.5) can suspend the schedule's normal pattern for a window. The grid shows the schedule's intent, not the runtime state.
2. **It does not show resource-specific differences.** If a resource has its own override, the grid still shows the schedule's default pattern. Per-resource state is in the resource detail page.

The grid is a *schedule preview*. The Resources page is where you see actual current state.

### Comparing two schedules side by side

For complex coverage (multiple schedules acting on overlapping resource sets), the Schedules page can render two grids side by side. This is useful when designing complementary schedules — e.g., "Business Hours" + "Weekend Scale-Down" that together cover 168 hours/week without gaps or overlaps.

```
SCHEDULE A: Business Hours          SCHEDULE B: Weekend Scale-Down
                                     
Mon ░░░░██████████████████████░░░░   Mon ░░░░░░░░░░░░░░░░░░░░░░░░
Tue ░░░░██████████████████████░░░░   Tue ░░░░░░░░░░░░░░░░░░░░░░░░
...                                   ...
Sat ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    Sat ░░ ON only midnight ░░ 
Sun ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    Sun ░░ stop firing      ░░
```

Together they ensure resources are OFF outside business hours and OFF entirely on weekends. The visual shows the combined effect.

---

## 2. Demo

A real schedule design session, with the grid catching a bug:

```
INTENT: Stop dev outside business hours and weekends, EU timezone.

ATTEMPT 1 (two crons):
  Cron #1   "0 9 * * 1-5"     Start  09:00 weekdays
  Cron #2   "0 21 * * 1-5"    Stop   21:00 weekdays
  
  Grid shows: ON 09:00-21:00 weekdays. Weekend grid all OFF.
  But: WHAT IF A RESOURCE WAS LEFT ON FRIDAY EVENING?
       It would stay on all weekend (no stop cron until Monday).
  
ATTEMPT 2 (add weekend belt-and-suspenders):
  Cron #3   "0 0 * * 0,6"     Stop   midnight Saturday and Sunday
  
  Grid shows: ON 09:00-21:00 weekdays. OFF all weekend, with a stop
  re-fired at midnight Saturday and Sunday for safety.
  
Save. The schedule covers the intent fully.
```

Without the grid, the missing weekend stop cron would have been invisible until somebody manually started a dev resource on Friday evening and forgot. The grid catches the gap before save.

(Asset: `assets/diagrams/M1.3_L3_grid_catches_gap.svg`.)

---

## 3. Hands-on (6 min)

For your test schedule from L1:

```
1. Open the schedule in edit mode.
2. View the 24-hour weekly grid.
3. Hover over each hour of each day. Confirm the state matches intent.
4. Look specifically for:
   - Gaps you didn't intend
   - Overlaps from redundant crons
   - Weekend behavior (especially if your schedule has weekday-only crons)
5. If you find a gap, add a belt-and-suspenders stop cron.
6. If you find an overlap, remove or merge crons.
7. Save the corrected schedule.
```

---

## 4. Knowledge check

### Q1
The 24-hour weekly grid renders the schedule in:

A. UTC always
B. The schedule's IANA timezone — so a team in Asia/Kolkata sees the grid relative to their local time, not UTC
C. The viewer's local timezone
D. America/New_York

<details>
<summary>Show answer</summary>

**Correct: B.** Grid renders in the schedule's IANA timezone. Crons are interpreted in that timezone; the grid displays the same way.
</details>

### Q2
A schedule has `0 8 * * 1-5` start and `0 18 * * 1-5` stop. A resource is running Friday at 9 PM (it was started manually). The schedule next fires Monday at 8 AM. Between Friday 8 PM and Monday 8 AM, the resource state:

A. Stops automatically Friday at 8 PM
B. Stays running. No stop cron fires between Friday 8 PM (after the stop cron) and Monday 8 AM. The fix is to add a belt-and-suspenders weekend stop cron (e.g., "0 0 * * 0,6").
C. Stops at midnight automatically
D. Stops at noon Sunday

<details>
<summary>Show answer</summary>

**Correct: B.** Cron does not "track" state across firings. A manual start outside the cron firing windows persists until another cron stops it. Belt-and-suspenders weekend stops are the fix.
</details>

### Q3
The grid shows two ON triggers at 08:00 and 09:00 on the same weekday. Most likely cause:

A. The cron is firing twice
B. Two redundant start crons exist. One at "0 8 * * 1-5" and another at "0 9 * * 1-5." Remove the second; it adds no value and produces noise in the action log.
C. The IAM is misconfigured
D. The schedule is broken

<details>
<summary>Show answer</summary>

**Correct: B.** Two start crons firing at different times within the same ON window are redundant. The second start is a no-op on an already-running resource. Remove for cleanliness.
</details>

---

## 5. Apply

The grid is a first-class part of the schedule create / edit flow:

- **[Schedule create dialog](https://app.zopnight.com/schedules/new)** — grid renders as crons are added
- **[Schedule detail page](https://app.zopnight.com/schedules/{id})** — grid for any saved schedule
- **Side-by-side view** — compare two schedules to verify complementary coverage

For schedule design patterns (rolling environments, freeze windows), see [T5.M5.2](../../T5_devops_cost_discipline/M5.2_schedule_patterns/00_README.md).

---

## Related lessons

- [L4 — Three preset schedules](L4_preset_schedules.md) *(next)*
- [M1.5 — Overrides](../M1.5_overrides/00_README.md)

## Glossary terms touched

[24-hour weekly grid](../../../reference/glossary/24-hour-weekly-grid.md) · [Gap (schedule)](../../../reference/glossary/gap-schedule.md) · [Overlap (schedule)](../../../reference/glossary/overlap-schedule.md) · [Belt-and-suspenders cron](../../../reference/glossary/belt-and-suspenders-cron.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-20 · Lesson ID: T1.M1.3.L3
