# Recipe 14 — Recent override activity

§ T6 · M6.4 · Recipe 14 of 15 · Engineer tier · 3 min

## Intent

List all schedule overrides created in the last 7 days. Overrides are a frequent source of unexpected cost spikes — surface them weekly.

## Prompt to AI agent

```
"List all schedule overrides created in the last 7 days. Show who
created, which schedule, override duration, reason, and current status."
```

## MCP tools used

```
list_overrides(filters={"created_at>=":"7d"})
get_override for each
get_schedule for context
```

## Expected output

```
SCHEDULE OVERRIDES (last 7 days):

Created   Schedule              Created By            Duration   Status
─────────────────────────────────────────────────────────────────────
05-15     nights-eu-dev         jane@platform        24 hours   EXPIRED
05-16     weekend-stop-batch    bob@data-eng         until-cancel ACTIVE
05-17     ml-cluster-weekends   sue@ml-infra         48 hours   EXPIRED
05-18     marketing-cdn-nights  ops@marketing        7 days     ACTIVE
05-19     prod-rds-snapshot     security-incident-bot until-cancel ACTIVE

5 overrides. 3 still active.

ANALYSIS:
  - "until-cancel" overrides need quarterly review
  - bob@data-eng's override is now 4 days running — should it still be active?
  - ops@marketing's 7-day override expires 05-25 (auto)
  - security-incident-bot: legitimate, related to active incident

RECOMMENDED ACTION:
  - Reach out to bob@data-eng about active override status
  - Confirm with ops@marketing about 7-day need
  - All others: monitor, will auto-expire

POTENTIAL COST IMPACT:
  3 active overrides ~$3,400/mo if maintained indefinitely
```

## Variations

```
"All overrides currently active across the org"
"Overrides created during incidents"
"Overrides that were created and never cancelled"
"Top creators of overrides (frequent override-ers)"
```

## When to use

Weekly governance review. Incident retrospective. Quarterly override audit.

---

§ Recipe 14 · Last reviewed 2026-05-20
