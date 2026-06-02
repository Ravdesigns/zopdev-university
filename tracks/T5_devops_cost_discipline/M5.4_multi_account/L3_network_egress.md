# Network architecture and egress cost

§ T5 · M5.4 · L3 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **diagnose** network egress costs in your estate, **identify** the top three cost-reducing patterns (VPC endpoints, Transit Gateway, PrivateLink), **and decide** when cross-region replication is worth its cost.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Find and eliminate egress fees that compound from architectural decisions — most teams have $2-10K/mo in fixable egress costs." |
| **Personas** | Platform Engineer · Network Engineer · SRE |
| **Prerequisites** | M5.4.L1 · M5.4.L2 |
| **Time** | 9 minutes |
| **Bloom verb** | Diagnose (Analyze), Identify (Apply), Decide (Evaluate) |

---

## 1. Concept

Network architecture choices have significant cost implications. Inter-account, inter-region, and internet egress all incur per-GB fees that compound quickly. Most teams have $2K-$10K/month in fixable egress costs without realizing it.

```
TYPICAL EGRESS FEES (AWS, varies by region):

Same AZ:                        $0.00/GB (FREE)
Different AZ same region:       $0.01/GB each way (so $0.02 round-trip)
Cross-region (e.g., us → eu):    $0.02-$0.09/GB
Cross-account same region:      $0.02/GB
Outbound to internet:           $0.09/GB (first 1 GB free)
VPC endpoint to AWS service:     $0.01/GB (much cheaper than internet)
                                 OR free for Gateway endpoints (S3, DynamoDB)

NAT Gateway data processing:    $0.045/GB (on top of base hourly cost)
Transit Gateway data:           $0.02/GB (cheaper than peering at scale)
PrivateLink:                     $0.01/GB (private; cheaper than internet)
```

The numbers look small until multiplied by terabytes per month.

### Network architecture patterns by isolation

```
PATTERN A — SINGLE VPC, SINGLE ACCOUNT
  Lowest cost; lowest isolation
  All traffic within VPC = mostly free
  Suits: startups, dev environments
  
PATTERN B — VPC PER ENVIRONMENT (same account)
  prod-vpc, staging-vpc, dev-vpc
  Cross-VPC traffic free (same account, same region)
  Suits: small orgs evolving from single VPC

PATTERN C — ACCOUNT PER ENVIRONMENT + VPC per account
  Cross-account traffic costs more
  Requires: VPC peering OR Transit Gateway
  Suits: growing orgs with compliance needs

PATTERN D — MULTI-REGION FOR RESILIENCE/LOCALITY
  Cross-region traffic adds significant cost
  Suits: customer-facing critical services with regional users
  
PATTERN E — HUB-AND-SPOKE (Transit Gateway centric)
  Central TGW; team accounts connect as spokes
  Cleaner than mesh peering at scale
  Suits: large orgs with many accounts
```

The right pattern follows from the account structure (L1) and shared services design (L2).

### Top three cost-reducing patterns

```
PATTERN 1 — VPC ENDPOINTS
  
  Direct connection to AWS services (no internet egress)
  Gateway endpoints (FREE):
    S3
    DynamoDB
  Interface endpoints (~$0.01/GB + hourly):
    All other AWS services
    
  TYPICAL SAVINGS:
    S3 traffic without endpoint: $0.09/GB internet egress
    S3 traffic with gateway endpoint: $0.00
    For 10 TB/mo S3 traffic: $900/mo savings → $0
  
  EASY WIN: add Gateway endpoints in every VPC for S3 + DynamoDB
            5-minute change; massive savings

PATTERN 2 — TRANSIT GATEWAY (vs VPC Peering)
  
  Hub-and-spoke topology
  Replaces N×N peering complexity
  Scales better; single point of routing
  
  COST COMPARISON (10 accounts × 10 VPCs):
    Peering: 45 peerings + per-peering cost
    Transit Gateway: 1 TGW + 10 attachments
    
  At scale: TGW often cheaper + simpler

PATTERN 3 — PRIVATELINK / SERVICE ENDPOINTS
  
  Direct service connection without internet
  Reduces egress AND improves security
  
  USE CASES:
    Cross-account API calls (your service B in account 2
                              calls service A in account 1)
    Avoiding internet exposure
    Customer-facing service endpoints
  
  COST: lower than internet; per-GB + hourly endpoint
```

These three patterns address ~80% of egress cost waste.

### Common high-cost anti-patterns

```
ANTI-PATTERN A — CROSS-REGION REAL-TIME REPLICATION
  Real-time db/object replication across regions
  Always-on; pays per-GB transferred
  
  COST: 1 TB/day replicated = $2.4K/mo cross-region
  EVALUATE: do you need real-time, or is daily snapshot enough?

ANTI-PATTERN B — CROSS-ACCOUNT API CALLS via INTERNET
  Service A in account-1 calls service B in account-2
  Without PrivateLink: routes via internet
  $0.09/GB outbound × volume
  
  FIX: PrivateLink for cross-account service-to-service
  OR: Transit Gateway in same region (cheaper)
  OR: Move services to same account (best when possible)

ANTI-PATTERN C — NAT GATEWAY for VPC ENDPOINT TRAFFIC
  Pods/containers in private subnet
  Need S3 access; NAT GW routes to S3 via internet
  NAT GW charges $0.045/GB processed
  
  FIX: Gateway endpoint for S3 (FREE)
  Same for DynamoDB
  
  TYPICAL SAVINGS: $500-$3000/mo per VPC

ANTI-PATTERN D — INTER-AZ CHATTY APPLICATIONS
  Microservice in AZ-A calls service in AZ-B
  Every API call: $0.01/GB each way
  Chatty apps (1000s of calls/min) = real cost
  
  FIX: AZ-affinity for related services
  OR: Service mesh with AZ-awareness
  
ANTI-PATTERN E — VPN/DIRECT CONNECT BANDWIDTH MISMATCH
  Direct Connect at 10 Gbps; using 100 Mbps
  Paying 100× what needed
  OR: VPN with congestion fees
  
  FIX: Right-size DX/VPN to actual bandwidth needs
```

Each anti-pattern alone can be $1K+/month. Most orgs have 2-3 simultaneously.

### Network architecture review process

```
QUARTERLY NETWORK COST AUDIT:

WEEK 1 — MAP CURRENT FLOWS
  Cost explorer: filter by Operation = DataTransfer
  Group by: source region, destination, service
  Identify: top 10 data-transfer cost lines
  
WEEK 2 — IDENTIFY ALTERNATIVES
  For each top cost:
    What's the source/destination?
    Is there a VPC endpoint that would eliminate it?
    Is real-time replication needed?
    Could we co-locate the services?

WEEK 3 — PLAN MIGRATIONS
  Pick top 3 highest-cost paths to fix
  Estimate effort + savings per path
  Risk assessment per change

WEEK 4 — EXECUTE
  Add VPC endpoints (easiest)
  Re-architect anti-patterns
  Verify cost reduction post-change
```

The quarterly audit takes 1-2 days; saves $2K-$10K/month typically.

### Cost vs reliability trade-off

The cheapest path is often less resilient. Make the trade explicitly:

```
LOWER-COST PATH:
  Same-region multi-AZ replication (cheap)
  VPC endpoints to AWS services (cheap)
  No cross-region traffic
  Single-region failover via warm-standby
  
LOWER-LATENCY / HIGHER-RELIABILITY PATH:
  Multi-region active-active (expensive)
  Cross-region real-time replication (expensive)
  Global load balancing (expensive)
  
TRADE-OFF MATRIX:
  Service criticality / Region count / Replication mode / $/mo
  Customer-revenue-critical / Multi-region / Real-time     / $$$$
  Customer-facing / Multi-region / Async                    / $$$
  Customer-facing / Single-region multi-AZ / N/A             / $$
  Internal / Single-region single-AZ / N/A                   / $
  
Most orgs: pick a balance per service tier
  Tier 1: multi-region with async replication
  Tier 2: single-region multi-AZ
  Tier 3: single-region single-AZ
```

The discipline is making the trade explicit per service tier.

### Cross-region replication — when worth it

```
WORTH THE COST when:
  ✓ Customer-facing critical services
  ✓ Compliance / regulatory geographic requirements
  ✓ Real disaster recovery requirement (RPO < hours)
  ✓ Geographic latency matters for UX
  
WASTEFUL when:
  ✗ Internal services (engineers can wait for failover)
  ✗ Eventual-consistency-tolerant systems (async daily fine)
  ✗ Test/dev environments (single-region OK)
  ✗ "Just in case" without specific business case
  
COST COMPARISON:
  10 TB DB, real-time cross-region:    $900/mo
  10 TB DB, daily snapshot cross-region: $30/mo
  10 TB DB, single-region multi-AZ:      $0 (no cross-region cost)
  
  Picking the wrong tier: 30× the cost for negligible benefit
```

The decision should be deliberate, per-service, with cost on the table.

### Cost-monitoring patterns

```
SET UP NETWORK COST ALERTS:
  Daily egress > $100: notify
  NAT GW data processing > $50/day: notify
  Cross-region data transfer >$200/day: notify
  Internet egress > $500/day: notify
  
  Alert to: #network-cost Slack channel
  Owner: platform team

REGULAR DASHBOARDS:
  Top 10 egress paths
  Cost trend by service
  Endpoint utilization (% of S3 traffic via endpoint)
  
QUARTERLY REVIEW:
  Audit findings
  Migrations completed
  Savings realized
  Next-quarter plan
```

The visibility drives behavior. Without monitoring, egress drift goes unnoticed.

---

## 2. Demo

A real network cost audit:

```
TEAM: 50-engineer fintech, mostly AWS

INITIAL COST AUDIT (Q3):
  Total network costs: $4,200/mo
  Breakdown:
    Internet egress: $1,800/mo
    Cross-region transfer: $1,400/mo
    NAT Gateway data processing: $1,000/mo

INVESTIGATION (4 hours):
  
  Internet egress $1,800/mo:
    $1,200 = S3 API calls from EC2 (no VPC endpoint!)
    $400 = External API calls (legit)
    $200 = Customer downloads (legit)
    
  Cross-region $1,400/mo:
    $800 = Real-time S3 replication of non-critical reports
            (could be daily snapshot)
    $400 = DR cross-region for prod database (legit)
    $200 = Misc (logs, telemetry)
    
  NAT Gateway data $1,000/mo:
    $600 = K8s pods → S3 (could use VPC endpoint)
    $400 = External APIs (legit; needs NAT)

REMEDIATIONS:

WEEK 1 — Add VPC endpoints
  S3 Gateway endpoint in all VPCs (5 VPCs)
  DynamoDB Gateway endpoint in all VPCs
  Effort: 5 minutes per VPC; 30 min total
  
  Savings:
    Internet egress -$1,200/mo
    NAT GW data -$600/mo
    Total: $1,800/mo
    
WEEK 2 — Switch S3 cross-region replication to daily
  Replace real-time replication with nightly snapshot
  Restore-time impact: 24h vs minutes
  Decision: acceptable for non-critical reports
  
  Savings: $800 - $30 (snapshot cost) = $770/mo

WEEK 3 — Right-size DR replication
  Database DR replication: stays (legit)
  Misc cross-region: investigate (some legit, some not)
  Modest savings: $100/mo

FINAL RESULT:
  Total savings: $2,670/mo = $32K/year
  Effort: ~12 hours of platform engineering
  ROI: 50:1 in year 1
  
  Network costs dropped from $4,200 to $1,530/mo (-63%)

CULTURAL OUTCOMES:
  Added "use VPC endpoint" to platform engineering checklist
  Cross-region replication decisions now require explicit business case
  Quarterly network audit scheduled going forward
```

The pattern repeats — quarterly audits keep network costs bounded.

---

## 3. Hands-on (5 min)

Audit your network costs:

```
□ STEP 1: Pull network cost report
  Cost Explorer → filter Operation = DataTransfer
  Or ZopNight Cost by Service → Network
  
  Total network spend: $_____/mo

□ STEP 2: Break down by category
  Internet egress: $_____/mo
  Cross-region: $_____/mo
  Cross-account: $_____/mo
  NAT Gateway data: $_____/mo

□ STEP 3: Check VPC endpoints
  S3 Gateway endpoints in all VPCs? □ Yes □ No
  DynamoDB Gateway endpoints in all VPCs? □ Yes □ No
  Estimated savings from adding: $_____/mo

□ STEP 4: Review cross-region replication
  Real-time cross-region: $_____/mo
  Could any switch to async / snapshot? __________
  Estimated savings: $_____/mo

□ STEP 5: Plan top 3 fixes
  1. __________   Estimated savings: $_____/mo
  2. __________   Estimated savings: $_____/mo
  3. __________   Estimated savings: $_____/mo
```

A 30-minute audit reveals the egress opportunities. Most teams find $2K-$10K/mo in fixable costs.

---

## 4. Knowledge check

### Q1
S3 API calls from EC2 without a VPC endpoint:

A. Free
B. Routes through internet egress (~$0.09/GB outbound) OR through NAT Gateway ($0.045/GB processed). Add Gateway endpoint for S3 = $0/GB (free). 5-minute change; can save thousands/month.
C. Random
D. Same as endpoint

<details>
<summary>Show answer</summary>

**Correct: B.** Add Gateway endpoint; massive savings, trivial effort.
</details>

### Q2
Cross-region real-time replication of non-critical data:

A. Always good for resilience
B. Often wasteful. Real-time replication of 10TB = $900+/mo cross-region transfer. Daily snapshot of same: $30/mo. The 30× cost difference must be justified by actual RPO requirements. For non-critical: switch to async/snapshot.
C. Random
D. Required for compliance

<details>
<summary>Show answer</summary>

**Correct: B.** Use-case dependent; often wasteful for non-critical data.
</details>

### Q3
NAT Gateway for VPC endpoint-eligible traffic:

A. Optimal pattern
B. Anti-pattern. NAT GW charges $0.045/GB processed. Gateway endpoints (S3, DynamoDB) are free. Interface endpoints are $0.01/GB. Switch the traffic to endpoints. Typical savings: $500-$3000/mo per VPC.
C. Random
D. Required for security

<details>
<summary>Show answer</summary>

**Correct: B.** Use VPC endpoints; NAT for traffic that can't use them.
</details>

---

## 5. Apply

Quarterly network audit. Top 3 patterns: VPC endpoints, Transit Gateway, PrivateLink. Make cross-region decisions explicit per service tier.

For ZopNight: Cost by Service → Network filter shows the breakdown; recommendations surface specific paths.

---

## Related lessons

- [L1 — Per-team vs per-env accounts](L1_per_team_or_env.md)
- [L2 — Shared services accounts](L2_shared_services.md)
- [L4 — Cross-account scheduling](L4_cross_account_schedule.md) *(next)*
- [L5 — Consolidate or split](L5_consolidate_or_split.md)
- [M5.5.L3 — DR cost discipline](../M5.5_reliability_vs_cost/L3_dr_costs.md)

## Glossary terms touched

[VPC endpoint](../../../reference/glossary/vpc-endpoint.md) · [Transit Gateway](../../../reference/glossary/transit-gateway.md) · [PrivateLink](../../../reference/glossary/privatelink.md) · [Cross-region egress](../../../reference/glossary/cross-region-egress.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.4.L3
