# WE-01 — EC2 idle savings on a 30-day-stopped instance

§ Worked Example · Operator level

## Setup

```
RESOURCE: i-0abc123def (EC2 m5.large in us-east-1)
STATE:    Stopped (since 47 days ago)
EBS:      1× gp3 100 GB volume attached
SNAPSHOTS: 3 snapshots (8 GB, 32 GB, 64 GB)
```

## The math

```
EC2 hourly rate (on-demand): $0.096/hour
EC2 monthly equivalent: $0.096 × 730 = $70.08

But — instance is stopped. EC2 charge = $0.

EBS gp3 storage: $0.08/GB-month × 100 GB = $8.00/month
Snapshot storage: $0.05/GB-month × (8 + 32 + 64) = $5.20/month
CloudWatch alarms (3 instance-level): $0.10 × 3 = $0.30/month
─────────────────────────────────────────────────────────
TOTAL MONTHLY: $13.50

ANNUALIZED: $162/year just for one idle instance
```

## What it would save if terminated

```
TERMINATE INSTANCE (already stopped — termination is the action):
  Saves: $13.50/month going forward (until expiry)
  
DELETE EBS VOLUME: 
  Saves: $8.00/month
  Risk: data loss (snapshot first)

DELETE SNAPSHOTS (after volume deleted):
  Saves: $5.20/month per month forward
  Risk: lose backup history
  
CLOUDWATCH ALARMS:
  Saves: $0.30/month (or moved elsewhere if still needed)
```

## Cumulative impact across estate

```
SCENARIO: 47 similar idle EC2 instances across a customer estate
  Average cost per: $13.50/month
  Total: 47 × $13.50 = $634.50/month

ACTION (terminate all 47 with snapshots first, delete volumes/snapshots):
  Monthly savings: $634.50
  Annual: $7,614

  Setup time: ~10 minutes via bulk action
  Effective rate: $76,140 saved per hour of work
```

## Process

```
1. Use ZopNight: Resources page → filter type=ec2, status=stopped
2. Sort by attached-storage-cost
3. Verify each is truly idle (state-history shows no recent activity)
4. Apply Remediate on certified rule RC-001 (Idle EC2):
   - Snapshot EBS volumes
   - Terminate EC2 instance
   - Delete EBS volumes
5. Within 1 hour, all 47 cleaned up
6. Billing data confirms savings in 24 hours
```

## Notes

- Rack rate is the right number for savings claims (avoided hours)
- The customer's billed cost may differ (post-discount)
- For prod-tagged resources, would require approval-gated remediation

## Related lessons

- [T0.M0.1.L5 — Top 10 cost mistakes](../../tracks/T0_foundations/M0.1_cloud_bill_decoded/L5_ten_cost_mistakes.md)
- [T2.M2.1.L5 — Reading a recommendation card](../../tracks/T2_zopnight_engineer/M2.1_rule_library/L5_reading_a_rec_card.md)

---

§ WE-01 · Last reviewed 2026-05-20
