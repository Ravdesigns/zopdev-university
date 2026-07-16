# Content factual-correctness fixes (tracking)

Addresses the engineering audit on issue [zopdev/zonight#2058](https://github.com/zopdev/zopnight/issues/2058) (97 factual errors + 7 product claims). Verified against `FEATURES (7).md`, `RECOMMENDATION-RULES (8).md`, and the shipped-code citations in the audit. Authority order for corrections: **shipped code (per audit) + RULES(8) catalog > domain math > FEATURES(7) prose** (FEATURES(7) is itself stale on Bedrock count and anomaly bands).

Locked decisions (from product owner):
- Rule count → **"450+ rules across AWS, GCP, Azure"** everywhere (drop 490 / 216-127-147; sources conflict, this is defensible and matches the live homepage).
- Auto-remediation → **rewrite to the real allowlist** (124 wired: 28 auto + 96 guided, `autoremediation_allowlist.go`), reconcile the DB-safety claim with the RDS guided entries.
- MCP setup → **rewrite around the hosted/remote flow** (no npm package found); fix package-name + env-var contradictions.

Status legend: [x] done  ·  [ ] pending

---

## 1. HIGH severity (11 blockers)

- [x] **H1. Break-even formula** `1/(1+d)` → **utilization = 1 - d**. Fixed in BOTH surfaces: `M0.3/L2_commitments.md` (defs swapped back to FinOps standard, worked example reframed around utilization, Q3 rekeyed to 60%) AND `M4.7/L2_effective_discount.md` + `L3_over_commitment.md` (formula, worksheet, Q2 rekeyed to 60%, over-commit example reframed as a net loss not a +14% gain).
- [x] **H2. "AWS cross-AZ traffic is free"** → charged ~$0.01/GB each direction on AWS, GCP, and Azure (only same-zone is free). Fixed all sites: `M0.5/L2_gcp_cost_surface.md` (×4 + heading + outcome), `M0.1/L5_ten_cost_mistakes.md` (#8 reframed multi-cloud + checklist), `M0.5/L3_azure_cost_surface.md` ("unlike AWS" removed), `M0.1/L1_what_is_in_a_cloud_bill.md` (prose + Q2 answer + ASCII box). `aws-cost-surface.md` was already correct.
- [x] **H3. "AWS UnblendedCost is already amortized"** → UnblendedCost is as-charged (≈ Azure ActualCost); AWS has the same $0 trap; use Cost Explorer Amortized / CUR EffectiveCost. Fixed `M0.4/L3_amortized_azure.md`.
- [x] **H4. Backup/snapshot full-copy model (~10× overstated)** → incremental snapshots (base + retained deltas), GFS sub-linear. Fixed `M5.5/L2_backups.md` concept, principles, patterns, and the Demo internal contradiction (12 TB/$4,800 → ~96 TB/$4,800).
- [ ] **H5. Max Override Duration** org-wide/7-day/Settings-page → per-resource `max_override_duration_minutes` column, 0 = disabled. `M1.5/L4_max_duration.md`, `L1_when_to_override.md`, `L2_setting_overrides.md`.
- [ ] **H6. Fabricated denylist code path** `.../remediation/certified` → real allowlist `internal/remediation/contract/autoremediation_allowlist.go`; reconcile "databases never mutated" with RDS guided entries. `M2.3/L5_database_denylist.md`.
- [ ] **H7. VM autoscaler smart-defaults formulas** → from `smart_defaults.go`: Target 3-tier (P95>85→70 / >60→75 / else 80); Min uses cpu.Avg (no P05); Max = max(count+2, ceil(count×P99/target×1.3)). `M2.4/L2_welford_stats.md`, `L3_quick_setup.md`.
- [ ] **H8/H9. RBAC vocabulary** invented verbs (`recommendation:apply`, `resource:manage`, `override:cancel`, …) → uniform view/create/update/delete; apply/dismiss = `recommendation:update`. `M3.1/L1_policy_table.md`, `L6_frontend_gating.md`, `L3_custom_roles.md`, `L2_system_roles.md`; `M3.7/L3_widget_rbac.md`; `M3.8` cost-flow savings-overlay.
- [ ] **H10. Glossary pipeline defect** — NAT-gateway (and ~10 pages) leak lesson fragments / answer keys ("Correct: B") as definitions; ~80 use lesson objectives. Fix at the sourcing (build.js filter + authored defs for the worst offenders). `reference/glossary/`, `build.js`.
- [x] **H11.** Duplicate break-even in commitments-demystified — fixed as part of H1.

## 2. MEDIUM severity (41) — pending, grouped by track
FinOps core (8): coverage/utilization label swap (`commitments.md` done via H1); "MAX DISCOUNT" typical vs max (RI ~72/SP ~66/Azure ~60); SUD→Spot→EDP mutually-exclusive stacking (`billing-cost.md`); CloudWatch $0.30 not $0.10 (#10); GCP Spot no 24h cap (Preemptible only); AWS native FOCUS 1.0 since 2024; rack-rate-vs-billed gap reconcile; 168-hour weekend-skip 120h/28.6%.
Commitments-demystified (2): effective-discount can't go negative vs "might not break even" (partly addressed via H1 over-commit rewrite); four-levers MAX DISCOUNT figures.
Sustainability (2): m5.large 100W vs 50W; 50-GPU workload 100kg vs 17.5kg.
Operator (3): override reason field optional not required; DocumentDB RC-193 not RC-303; RC-001 advisory-only (use RC-002 for auto-remediation example).
Engineer/anomaly (4): critical ≥100% not 150-500%; z≥5 not z≥4; ≥14 data points not 7; five-dimensions per-dimension bands + "EXTREME" fabricated.
Engineer/other (4): Welford P90/95/99 = Gaussian approximation not true percentiles; Bedrock 33 rules (RC-1601..1634) not 10; auto-tagging rule-based vs ML contradiction; RC-004 demo violates its own 30% guard.
Practices (4): single-replica 1,000× not 100,000×; GCP labels don't inherit (Tags do); `self.tags` only valid in postconditions; backups Demo 12TB math (done via H4).
RBAC/dashboards (4): 15-entity closed-set wrong; four system roles not three, Editor=view+update; `override:cancel` nonexistent; `pat:view`/`audit-log:export`/`report:export` nonexistent.
MCP (5): read-only mechanism (blocks, not absent); what-is-mcp 43-tool breakdown fabricated; PAT user-scoped not org-scoped; npm package name inconsistency; env-var inconsistency.
Glossary (5): amortized-cost universal not Azure-only; expressroute AWS "same" not "unlike"; skeleton-crew quorum; model-selection 18.75× not 50-100×; well-architected-framework is 6-pillar not multi-account layout.

## 3. LOW severity (~45) — pending
Rule-count "490" → "450+" everywhere (Operator/Engineer indexes, eight-categories sum, "remaining 440+"); FOCUS ~50 cols; Azure 100GB free; assorted arithmetic slips (GKE $720, COALESCE $11.97, region codes, forecasting %s, EKS pricing, egress free-tier, incident $ drift); Node 16 vs 18; PAT expiry-warning day math; various self-contradictions. Full list mirrors audit §3.

## 4. Product claims (7) — decisions applied
- [ ] "20 certified rules" → rewrite to real 124-rule allowlist (28 auto + 96 guided). `M2.3`.
- [x] "490-rule library" → "450+ rules" (decision locked; edits tracked under §3).
- [ ] `policy_table.yaml` fictional → describe conceptually (Go + permissions.js). `M3.1`.
- [ ] MCP local npx default → rewrite around hosted/remote. `M6.2`.
- [ ] "15 recipes / 80% adoption / 8× faster" telemetry → label illustrative. `M6.4`.
- [ ] "30-50% of backup-DR systems fail" uncited → reframe qualitatively. `M5.5`.
- [ ] CDCR competitor "ACT: N" table → scope/date/cite as ZopNight-defined. `M0.6`.
