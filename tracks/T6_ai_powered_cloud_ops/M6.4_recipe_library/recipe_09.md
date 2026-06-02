# Recipe 9 — Idle Lambdas with provisioned concurrency

§ T6 · M6.4 · Recipe 9 of 15 · Engineer tier · 3 min

## Intent

Find Lambda functions with provisioned concurrency configured but zero (or near-zero) actual invocations. Provisioned concurrency costs per-second regardless of use — silent money leak.

## Prompt to AI agent

```
"List Lambda functions with provisioned concurrency that had fewer
than 100 invocations in the last 30 days. Show concurrency size and
monthly cost."
```

## MCP tools used

```
list_resources(filters={"type":"lambda", "provisioned_concurrency>":0})
get_resource_metrics(metric="invocations", time="30d")
get_resource_cost_history(resource_uid=<each>)
```

## Expected output

```
IDLE LAMBDAS WITH PROVISIONED CONCURRENCY (30-day window):

Function                  Concurrency   Invocations   Monthly Cost
─────────────────────────────────────────────────────────────────────
old-image-processor       10            12            $260/mo
deprecated-webhook        5             47            $130/mo
test-api-prod             20            3             $520/mo (!)
stale-cron-trigger        5             0             $130/mo

4 functions. Total: $1,040/mo for ~62 invocations.

ANALYSIS:
  test-api-prod is the worst offender: 20 concurrent units always-warm
  for 3 invocations in 30 days. Cost-per-invocation: $173.
  
RECOMMENDED ACTIONS:
  test-api-prod: remove provisioned concurrency (use cold start)
  stale-cron-trigger: 0 invocations — likely orphan; investigate + delete
  deprecated-webhook: low traffic; remove provisioning
  old-image-processor: low traffic; remove provisioning
  
  Estimated savings: ~$1,000/mo
```

## Variations

```
"Lambdas with high concurrency but consistent under-utilization"
"Functions with reserved concurrency that's never exceeded"
"Compare invocations to concurrent execution metric — efficiency ratio"
"Top 10 most expensive Lambdas by cost-per-invocation"
```

## When to use

Quarterly Lambda audit. Cost-recovery sprint. After deprecation of features.

---

§ Recipe 9 · Last reviewed 2026-05-20
