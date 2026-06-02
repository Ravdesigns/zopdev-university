# Databases as monitor-only

§ T2 · M2.9 · L4 of 5 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **explain** why databases aren't auto-scaled for events, **read** the monitor-only recommendations, **and plan** manual DBA actions before the event.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Plan database capacity for events when ZopNight can't auto-scale them — manual DBA action with ZopNight's guidance." |
| **Personas** | Database Engineer · Platform Engineer · SRE |
| **Prerequisites** | M2.9.L1 · M2.3.L5 (database denylist) |
| **Time** | 9 minutes |
| **Bloom verb** | Explain (Understand), Read (Apply), Plan (Create) |

---

## 1. Concept

Event Readiness does NOT scale databases automatically. Instead, it monitors database readiness signals and surfaces recommendations for the customer to act on manually.

```
THE ASYMMETRY:
  
  COMPUTE (ASG, ECS, etc.):
    Auto-scaled by Event Readiness
    Safe to mutate
    Reversible
    
  DATABASES (RDS, Cosmos, etc.):
    Monitor-only by design
    Recommendations surface
    Customer DBA executes manually
    Higher-risk mutations
```

The asymmetry reflects the database denylist (M2.3.L5).

### Why databases are monitor-only

```
RISKS of auto-scaling databases for an event:

  Cloud-side resize causes brief connection drops
    Customers experiencing the drop during peak event = bad
    Revenue lost during the connection drop
    
  Performance regression on the smaller-during-rebalance state
    During scale-up, database may briefly serve from smaller instance
    Latency spikes during transition
    
  Replication lag during the scale operation
    Replicas may fall behind during the scale
    Read-after-write consistency at risk
    
  Data inconsistency risk in edge cases
    Some rare scenarios involve data state during scaling
    Recovery may require manual intervention
    
  CONNECTION DROPS during cloud-side scale
    Even "online" scaling has brief disconnects
    Connection pool churn affects performance

THE ASYMMETRIC COST:
  Bad event-time database scaling = revenue lost + customer impact
  Manual DBA scaling = controlled; tested; planned
  ZopNight's choice: never auto-scale databases
```

The database denylist from M2.3.L5 extends to Event Readiness.

### What monitoring tells you

```
EVENT READINESS DB MONITORING:
─────────────────────────────────────────────────────────────────
RESOURCE: db-production-orders (RDS db.r5.xlarge)
EXPECTED LOAD INCREASE: 3x (per multiplier on this event)

CONNECTION POOL MATH:
  Current connections (P95):    47
  Current max connections:       200 (per RDS instance limit)
  Headroom:                      153 connections
  
  Expected event connections:    47 × 3 = 141
  Expected remaining headroom:   59 connections (good — within limit)
  
RECOMMENDATION: NO ACTION needed. Headroom sufficient.

BUT IF 47 × 3 ≥ 200, a warning surfaces:
  
  "Connection pool may exhaust during event. Three options:
   1. Increase max_connections (requires restart, careful timing)
   2. Scale instance class (db.r5.xlarge → db.r5.2xlarge)
      which doubles max connections by default
   3. Add read replicas to offload reads
      Or: implement connection pooler (PgBouncer / ProxySQL)"
```

The recommendation is concrete. The customer's DBA executes manually.

### What the wizard suggests

For each database target attached as monitor-only:

```
DB TIER ANALYSIS:

  Current connections P95:       48
  Current max_connections:        200
  Predicted event connections:    96 (assuming 2x load on connections)
  
  Recommendation:
    Suitable: db.r5.xlarge supports this load
    
  OR:
  
  Predicted event connections:    240 (assuming 3x load)
  
  Recommendation:
    Scale db.r5.xlarge → db.r5.2xlarge before event
    (doubles max_connections from 200 to 400)
    No connection pool stress
```

Specific advice with the math behind it.

### Pre-event manual DB actions

A team's typical pre-event DB checklist:

```
3 WEEKS BEFORE EVENT:
  Run load test to validate database can handle 2-3x current load
  Identify any slow queries that may bottleneck
  Plan query optimization or index improvements
  
1 WEEK BEFORE EVENT:
  If scaling decided: deploy a temporary database scale
    (e.g., from db.r5.xlarge → db.r5.2xlarge)
    Outside business hours / planned maintenance window
  Add read replicas if read-heavy
  Pre-warm any caches
  
1 DAY BEFORE EVENT:
  Verify replication lag is low
  Confirm backup is recent
  Document rollback procedure
  Verify connection limits sufficient
  
DURING EVENT:
  Monitor connections, query latency, replication lag
  Watch for unusual error patterns
  Plan to scale down 1-2 weeks AFTER event
    (avoid premature rollback)
  
1 WEEK AFTER EVENT:
  Review actual database performance during event
  Decision: scale back or keep at higher tier?
  Postmortem if any issues occurred
```

ZopNight provides the recommendations and timing; the team executes.

### Connection-pool math — the most important signal

```
WHY CONNECTION POOL MATH MATTERS:

  Most database performance issues during traffic spikes are NOT
    CPU saturation — they are connection pool exhaustion
  An app trying to acquire a connection waits or fails
  Connection pool issues cascade
    Slow connection → request times out → retry → more connections
    
HOW IT IS CALCULATED:
  
  Current P95 connections:        from CloudWatch metrics
  Multiplier:                     from event multiplier
  Expected P95 event connections: current P95 × multiplier
  Max connections per instance:    per-instance-class limit (RDS docs)
  
  IF expected > max:
    Recommend scaling or query optimization
    
  IF expected < max:
    No action needed
```

The math is simple; the impact is large. Most event-time database surprises are connection-pool exhaustion.

### What ZopNight does NOT promise

```
ZOPNIGHT WILL NOT:
  Restart a database (would cause connection drops)
  Scale instance class (would cause connection drops during rebalance)
  Modify max_connections (requires restart)
  Promote a replica (potential data loss)
  Change replication topology
  Modify schema
  Run database optimization
  
ALL OF THE ABOVE are customer DBA responsibilities
ZopNight is advisory for databases
```

The boundary is clear: ZopNight suggests; DBA executes.

### Alternative architectures

```
FOR EVENTS THAT REPEATEDLY OVERFLOW connection pool:

  Connection pooler (PgBouncer / ProxySQL):
    Multiplexes app connections to fewer DB connections
    Allows app to maintain "unlimited" connection appearance
    Database sees fewer actual connections
    Costs: ~$20-100/mo per pooler instance
    
  Read replicas:
    Offload read queries to replicas
    Each replica = max_connections more capacity
    Eventual consistency on read path
    
  Application-level retry + circuit breaker:
    App handles connection failures gracefully
    Fewer cascade failures during pool exhaustion
    
LONGER-TERM ARCHITECTURAL improvements:
  Connection pooling is industry-standard
  Almost always worth implementing once at scale
```

These are architecture decisions; ZopNight surfaces the need.

---

## 2. Demo

A team's event database planning:

```
EVENT: Black Friday 2026
SCOPE: production-checkout-api group (3 ASGs + 1 database)

DATABASE: db-prod-orders (RDS db.r5.xlarge)
  Current max_connections: 200
  Current P95 connections: 67
  Predicted event connections: 67 × 3 = 201

ZOPNIGHT RECOMMENDS (monitor-only):
  "Connection limit may be exceeded. Three options:
    
   1. SCALE UP: db.r5.xlarge → db.r5.2xlarge
      Cost: ~$430/month extra
      max_connections becomes 400
      Plan: 1 week before event, during maintenance window
   
   2. ADD READ REPLICA: offload read queries to replica
      Plan: 2 weeks before event, replica needs to catch up
      
   3. CONNECTION POOLER (PgBouncer or ProxySQL):
      Plan: longer rollout; application changes required
      Most durable solution"

DBA TEAM DECISION:
  Short-term: Option 1 (scale up)
  Long-term: Plan Option 3 for next year
  Reasoning: Option 1 quick; Option 3 better architecture but takes time

EVENT TIMELINE:
  T-7 days   Scale db.r5.xlarge → db.r5.2xlarge during planned 
              maintenance window
              Verify max_connections is now 400
              Verify replication lag returns to normal post-scale
              
  T-1 day    Final verification:
              Backup recent
              Replication lag low
              All systems green
              
  T+0        Event starts
              Database serves 3x traffic comfortably
              P99 connection count: 187 (within 400 limit)
              Query latency: normal
              
  T+30 days  Decide whether to scale back or keep at 2xlarge
              Decision based on ongoing post-event traffic
              Often: keep until ongoing capacity needs assessed

RESULTS:
  Event: smooth, no DB issues
  Cost: $430 extra for the month
  Lessons learned: documented for next event
```

The recommendation drove the team's action; ZopNight didn't act.

---

## 3. Hands-on (5 min)

Audit your databases for event readiness:

```
□ STEP 1: List databases in event scope
  Database 1: __________
  Current max_connections: _____
  Current P95 connections: _____

□ STEP 2: Calculate event multiplier
  Event multiplier: ___x
  Predicted event connections: _____ × ___ = _____

□ STEP 3: Assess
  Predicted > max? □ Yes (need action) □ No (OK)

□ STEP 4: Plan action if needed
  Option 1: Scale up — cost $_____/mo
  Option 2: Read replica — cost $_____/mo
  Option 3: Connection pooler — effort _____ weeks

□ STEP 5: Schedule
  Action date (1 week before event): __________
  Owner: __________
  Maintenance window: __________
```

A 15-minute exercise per database. Plan well ahead of events.

---

## 4. Knowledge check

### Q1
Why doesn't Event Readiness auto-scale databases?

A. Performance issue
B. Asymmetric risk — database mutations during scale can cause connection drops, replication lag, or data inconsistency. The risk dwarfs the event benefit. Manual DBA execution is the correct path. Database denylist from M2.3.L5 extends to Event Readiness.
C. Cloud doesn't allow it
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Asymmetric risk; database denylist extends here.
</details>

### Q2
The key database event-readiness signal is:

A. CPU
B. Connection pool exhaustion — most database performance issues during traffic spikes are connection pool issues, not CPU saturation. Connection math is the diagnostic. An app trying to acquire a connection waits or fails; cascades happen.
C. Memory
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Connection pool is the canonical bottleneck.
</details>

### Q3
ZopNight recommends scaling RDS for an event. Who executes?

A. ZopNight
B. The customer's DBA team — manually during a planned maintenance window. ZopNight surfaces the recommendation and the timing; execution is human. Database mutations require DBA expertise and careful timing.
C. Cloud autoscaler
D. Random

<details>
<summary>Show answer</summary>

**Correct: B.** Customer DBA team executes.
</details>

---

## 5. Apply

Event Readiness DB monitoring is in the wizard. Recommendations + timing surface; team's DBA acts.

For your team: build the event-DB-readiness checklist into your event planning runbook.

---

## Related lessons

- [L1 — What Event Readiness](L1_what_event_readiness.md)
- [L2 — Capacity models](L2_capacity_models.md)
- [L3 — Lifecycle](L3_lifecycle.md)
- [L5 — Cost estimate](L5_cost_estimate.md) *(next)*
- [M2.3.L5 — Database denylist](../M2.3_auto_remediation/L5_database_denylist.md)

## Glossary terms touched

[Monitor-only database](../../../reference/glossary/monitor-only-database.md) · [Connection pool exhaustion](../../../reference/glossary/connection-pool-exhaustion.md) · [DB event readiness](../../../reference/glossary/db-event-readiness.md) · [Connection-pool math](../../../reference/glossary/connection-pool-math.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T2.M2.9.L4
