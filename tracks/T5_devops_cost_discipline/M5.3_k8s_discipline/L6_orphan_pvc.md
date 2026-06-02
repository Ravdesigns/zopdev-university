# Orphan PVCs and released PVs

§ T5 · M5.3 · L6 of 6 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **identify** orphaned K8s PersistentVolumeClaims and PersistentVolumes, **calculate** the storage cost they accumulate, **and execute** cleanup with the right reclaim policy going forward.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Find the storage orphans accumulating in our cluster; clean them up; configure auto-cleanup going forward." |
| **Personas** | Platform Engineer · SRE · DevOps Engineer |
| **Prerequisites** | M5.3.L1 - L5 |
| **Time** | 9 minutes |
| **Bloom verb** | Identify (Analyze), Calculate (Analyze), Execute (Apply) |

---

## 1. Concept

PVC = PersistentVolumeClaim (request for storage). PV = PersistentVolume (actual storage allocated). Orphans accumulate when pods/deployments are deleted but the storage objects aren't cleaned up. Storage continues to be billed; nobody is using it.

```
ORPHAN PATTERNS:
  1. PVC exists but no pod uses it          (most common)
  2. PVC bound to PV but pod deleted         (subtle waste)
  3. PV in "Released" state, no claim        (reclaim policy = Retain)
  4. PV in "Failed" state                    (broken; still billed)
  5. PVCs in deleted namespaces (cluster bug)
```

In most production clusters, orphan storage = $500-$5,000/mo in waste. The cleanup is straightforward.

### Why orphans accumulate

```
DEPLOYMENT DELETED:
  Pod deleted → PVC sometimes preserved (depending on
                 statefulSet.persistentVolumeClaimRetentionPolicy)
  PV depending on reclaim policy:
    - Delete: PV deleted automatically (good!)
    - Retain: PV stays (orphan risk)

MISCONFIGURATIONS:
  PVCs without proper deletion handling in IaC
  Multi-cluster orphans (same storage referenced from multiple clusters)
  Manual kubectl delete on pods without addressing PVCs
  
ABANDONED workloads:
  Engineer left; storage continues to bill
  Project ended; cleanup never happened
  
NAMESPACE DELETION INCOMPLETE:
  Sometimes K8s leaves PVs after namespace deletion
  Especially with finalizers / hooks
```

The accumulation is gradual but compounds. Quarterly cleanup keeps it bounded.

### Cost impact

```
STORAGE COSTS (AWS EBS gp3 reference):
  gp3 baseline:       $0.08/GB-month
  gp3 provisioned IOPS (>3000): adds significant cost
  io2 (provisioned):    $0.125/GB-month + IOPS cost
  
EXAMPLES:
  Orphan PV 100 GB gp3:     $8/month
  Orphan PV 500 GB gp3:     $40/month
  Orphan PV 1 TB gp3:       $80/month
  Orphan PV 1 TB io2:        $125+/month
  Orphan PV 1 TB w/ provisioned IOPS: $200-500/month
  
ACROSS MANY ORPHANS:
  Mid-size cluster typical: 30-60 orphans
  Total orphan storage: 5-30 TB
  Monthly waste: $400-$3,000+
  
ANNUAL: meaningful even for cost-disciplined orgs
```

The 1 TB io2 orphan = $125/month for nothing. Most orgs have several.

### Detection — kubectl commands

```
ORPHAN PVCs (PVCs without active pods):
  $ kubectl get pvc --all-namespaces
  Cross-reference with kubectl get pods to find unmounted ones
  
  Or: scripted check (jsonpath query)
  $ kubectl get pvc -A -o json | jq -r '
      .items[] | select(.status.phase != "Bound" or
                         (.status.accessModes == null)) |
      .metadata.namespace + "/" + .metadata.name'

PV STATES:
  $ kubectl get pv
  
  Look for:
    STATUS=Available    - never bound; check if intended
    STATUS=Released      - was bound, claim deleted, still here
                          (Retain policy)
    STATUS=Failed        - broken; investigate + delete
    STATUS=Bound         - normal; PVC actively using
  
  Suspect: Released + Failed + old Available

AGE FILTER:
  $ kubectl get pv -o json | jq -r '
      .items[] | select(.status.phase == "Released") |
      .metadata.name + " " + .metadata.creationTimestamp'

NAMESPACE-LEVEL CHECK:
  $ kubectl get pvc -n <namespace>
  If namespace was decommissioned but PVCs remain: clean up
```

The cluster admin level access surfaces all orphans; scripts can produce age-sorted lists for prioritization.

### ZopNight rules

```
ZOPNIGHT K8S STORAGE RULES:

  RC-1742  K8s Orphan PVC
    Flags PVCs without an active mounting pod
    Lists creation date, size, storage class, cost
    Surfaces in recommendations with cost recovery estimate
    
  RC-1743  K8s Orphan PV (Released state)
    Flags PVs in Released state for >7 days
    Likely "Retain" reclaim policy + PVC was deleted
    
  RC-1744  K8s Failed PV
    Flags PVs in Failed state
    Investigate root cause + delete
    
  RC-1745  K8s Old Unbound PV
    Flags Available PVs >30 days old
    May be intentional reserves OR forgotten
```

ZopNight cross-references with cost; you see immediate $/mo impact per orphan.

### Investigation pattern (per orphan)

```
FOR EACH FLAGGED ORPHAN:
  
  1. CHECK CREATION DATE
     New (<7 days): may be in-progress; defer
     Old (>30 days): likely true orphan
     
  2. CHECK TAGS / LABELS
     Find owner if labels include team/owner
     Find purpose from name conventions
     
  3. CHECK ANY RECENT ACTIVITY
     EBS/disk recent IO? (probably not for orphans)
     
  4. CHECK NAMESPACE STATUS
     If namespace deleted: definite orphan
     If namespace exists: check for related workloads
     
  5. DECISION:
     SNAPSHOT + DELETE (safe; preserves recovery option)
     DIRECT DELETE (if team confirms no recovery needed)
     LEAVE (if intentional reserve; tag it!)

CONFIRMATION:
  Reach out to identifiable owner with 7-day notice
  Default action after 7 days: snapshot + delete
```

The investigation per orphan: 2-5 minutes. 30 orphans = 1-2 hours of work.

### Cleanup options

```
OPTION A — SNAPSHOT + DELETE (safest; recommended default)
  1. Snapshot the PV (cheap):
     aws ec2 create-snapshot --volume-id vol-xxx ...
  2. Delete the PVC:
     kubectl delete pvc <name> -n <namespace>
  3. PV auto-deletes (if reclaim policy = Delete)
     OR delete PV manually (if Retain)
  
  Cost: small (snapshot is cheaper than active storage)
  Recovery: snapshot available for 30 days+ as needed
  
OPTION B — DIRECT DELETE
  1. Confirm with team (Slack / email)
  2. Delete PVC + PV
  
  Cost: $0 (no snapshot)
  Recovery: none
  Use only when: team explicitly confirmed data not needed
  
OPTION C — LEAVE AS-IS WITH OWNER
  1. Identify owner; tag with intentional-reserve label
  2. Set 90-day reminder to re-evaluate
  
  Cost: ongoing
  Use only when: genuine intentional reserve (rare)
```

Default: Option A. Snapshots are cheap insurance; recovery option is valuable.

### Reclaim policy — prevent future orphans

```
PV.spec.persistentVolumeReclaimPolicy:

DELETE
  When PVC is deleted: PV is automatically deleted
  Storage released; no orphan
  Risk: data lost if PVC deleted accidentally
  
RETAIN
  When PVC is deleted: PV stays in "Released" state
  Data preserved but billed forever
  Risk: orphan accumulation
  
RECYCLE (deprecated; don't use)

DEFAULT for new PVCs (per StorageClass):
  Most cloud providers default to Delete (good)
  Custom StorageClasses may default to Retain (risk)

POLICY RECOMMENDATION:
  DELETE for ephemeral and dev workloads
  RETAIN for critical production data with manual review
  
  Set explicitly per StorageClass:
    storageClassName: standard
    reclaimPolicy: Delete
```

The default at provision time is the highest-leverage point. Get it right; prevent the orphan accumulation.

### Cleanup patterns

```
PATTERN A — MONTHLY CLEANUP
  Run script identifying orphans >30 days
  Notify owners (Slack DM with 7-day notice)
  Snapshot + delete after grace period
  Cost: 1 hour/month of effort

PATTERN B — AUTOMATION
  PVC deletion triggers PV deletion (reclaim policy Delete)
  No manual cleanup needed
  Prevents orphan accumulation at the source
  
PATTERN C — NAMESPACE-BASED CLEANUP
  Policy: when a namespace is deleted, all PVCs/PVs cleaned up
  Enforce via cluster policy (Kyverno, OPA Gatekeeper, etc.)
  
PATTERN D — TAGGING POLICY
  All PVCs MUST have owner + ttl label
  Auto-cleanup of PVCs past ttl
  Prevents orphan accumulation at provision time
```

Most teams: Pattern A initially; evolve to Pattern B + D as the discipline matures.

### Common pitfalls

```
PITFALL                              MITIGATION
──────────────────────────────────────────────────────────────────
Delete PV that still has data        Snapshot first (Option A)
                                      Recovery available 30 days
                                      
Reclaim policy "Retain" by default   Set "Delete" in StorageClass
                                      defaults
                                      
Cleanup script delete production     Always: confirm with team
PVC in error                          7-day notice for "abandoned"
                                      Whitelist labels for true orphans
                                      
Orphan accumulation between          Monthly audit cadence
audits (>$1K/mo in 6 months)         Automate where possible
                                      
Orphans across multi-cluster         Track per-cluster
("the other cluster owns it")        Periodic cross-cluster review
                                      
Snapshot orphans accumulate too      Snapshot retention policy
("snapshots forever")                Delete snapshots > 30 days
                                      after volume delete
```

Most pitfalls are process gaps. Monthly cadence + clear runbook fixes them.

---

## 2. Demo

A real orphan cleanup:

```
ESTATE AUDIT (Q3 2026):

DETECTION (via ZopNight scan):
  Orphan PVCs:        47 across 3 clusters
  Orphan PVs (Released): 12
  Failed PVs:          3
  
  Total orphan storage: 8.2 TB
  Monthly cost: $656 (mix of gp3 and io2)

INVESTIGATION (1 hour):
  Owner identifiable (via labels):  28 orphans
  Owner unidentifiable:               31 orphans

NOTIFY (7-day window):
  Identifiable owners:
    Slack DM with list of their orphans
    "Will delete in 7 days unless you confirm intent"
    
  Outcomes:
    18 owners: "delete; we don't need it"
    8 owners: "snapshot + delete" (recovery option)
    2 owners: "leave; we're using it" (false positive; tagged)

UNIDENTIFIABLE (no tags, no labels):
  Default: snapshot + delete
  Snapshot retention: 30 days
  Cost of snapshots: ~$50/mo total for 30 days

EXECUTION (week 2):
  
  Snapshot:
    31 unidentifiable PVs (default safe action)
    8 identifiable PVs (per owner request)
    Total snapshots: 39
    Snapshot cost (30 days): ~$60
    
  Delete:
    47 PVCs
    All affiliated PVs
    
  Update reclaim policies:
    All StorageClasses set to "Delete" (prevent future orphans)

VERIFICATION (week 3):
  Storage usage reduced by 8.2 TB
  Monthly cost reduced by $656
  No incidents (no engineer reporting "where's my data?")

ROI CALCULATION:
  Cleanup cost: 4 hours of platform engineering = $400
  Snapshot cost: $60 over 30 days
  Monthly savings: $656/mo recurring
  Annual savings: $7,872
  
  ROI: 17:1 in year 1; ~$8K/yr ongoing

CULTURAL IMPACT:
  Communicated the issue + cleanup to all engineering
  Teams now tag PVCs with owner + ttl labels
  New StorageClass defaults to Delete reclaim
  Quarterly audit scheduled

NEXT QUARTER:
  Audit found 8 new orphans (down from 47)
  Reclaim policy change working
  Took 30 minutes to clean up
```

The pattern compounds — the discipline establishes; future audits are quick.

---

## 3. Hands-on (5 min)

Audit your clusters for orphans:

```
□ STEP 1: Count orphan PVCs
  $ kubectl get pvc --all-namespaces | grep -v Bound | wc -l
  Or use ZopNight RC-1742 recommendation count
  Count: _____

□ STEP 2: Count orphan PVs
  $ kubectl get pv | grep -E 'Released|Failed' | wc -l
  Count: _____

□ STEP 3: Estimate cost
  Total orphan storage: _____ TB
  Storage type: gp3 / io2 / mixed
  Estimated $/mo: $_____

□ STEP 4: Plan cleanup
  Identifiable owners (via labels): _____ orphans
  Unidentifiable: _____ orphans
  
  Cleanup plan:
    Day 1: Notify identifiable owners (7-day notice)
    Day 8: Snapshot + delete unidentifiable (default safe)
    Day 8: Delete identifiable per owner instructions

□ STEP 5: Prevent future orphans
  □ Update StorageClass reclaim policy to "Delete"
  □ Document PVC tagging requirement (owner + ttl labels)
  □ Schedule monthly orphan audit
```

A 20-minute audit reveals the scope. Cleanup is 1-2 hours. Recurring savings $500-$3K/month.

---

## 4. Knowledge check

### Q1
A PV with reclaim policy "Retain" after its PVC is deleted:

A. PV is deleted automatically
B. PV stays in "Released" state. Orphan risk — billed indefinitely with no claim. Use "Delete" reclaim policy for most workloads (cheaper, cleaner). Reserve "Retain" for critical production data with explicit human review.
C. Random
D. PV becomes unavailable

<details>
<summary>Show answer</summary>

**Correct: B.** Retain = orphan risk; Delete is safer for most cases.
</details>

### Q2
An orphan PV with 1 TB gp3 storage:

A. ~$5/month
B. ~$80/month at $0.08/GB-month. Meaningful at scale. With provisioned IOPS or io2, the cost can be $200-$500/month per orphan. Compounds across many orphans.
C. Random
D. Free

<details>
<summary>Show answer</summary>

**Correct: B.** $0.08 × 1000 GB = $80/mo per TB.
</details>

### Q3
Best practice for new PVCs to prevent future orphans:

A. Manual quarterly cleanup only
B. Configure StorageClass reclaim policy as "Delete" so PVs auto-delete with PVCs. Prevents orphan accumulation at the source. Combine with tagging (owner + ttl labels) for cleanup automation.
C. Random
D. Use Retain everywhere

<details>
<summary>Show answer</summary>

**Correct: B.** Auto-delete via policy + tagging for ownership.
</details>

---

## 5. Apply

Set reclaim policy = Delete in StorageClass defaults. Monthly orphan audit. Tag PVCs with owner + ttl labels. ZopNight rules surface orphans with cost recovery.

For your team: first cleanup audit this month. Pattern compounds quarterly.

---

## Module quiz

Complete M5.3 → 10-question module quiz unlocks the **K8s-Disciplinarian** chip.

---

## Related lessons

- [L1 — Requests and limits](L1_requests_limits.md)
- [L2 — HPA signals](L2_hpa.md)
- [L3 — Idle workload shapes](L3_idle_workloads.md)
- [L4 — Single-replica patterns](L4_single_replica.md)
- [L5 — Security signals](L5_security_signals.md)
- [M5.4 — Multi-account strategy](../M5.4_multi_account/00_README.md)

## Glossary terms touched

[PVC (PersistentVolumeClaim)](../../../reference/glossary/pvc.md) · [PV (PersistentVolume)](../../../reference/glossary/pv.md) · [Reclaim policy](../../../reference/glossary/reclaim-policy.md) · [Orphan storage](../../../reference/glossary/orphan-storage.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T5.M5.3.L6
