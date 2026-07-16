# The architectural choice — read-only forever

§ T6 · M6.6 · L1 of 3 · Engineer tier · 9 min

---

## Outcome

By the end of this lesson, you will be able to **defend** the read-only-MCP design choice to a CISO or engineering peer, **map** any write workflow to the right ZopNight surface, **and explain** why the boundary is unlikely to change in V1.

---

| | |
|---|---|
| **Tier** | Engineer |
| **JTBD** | "Understand the read-only contract well enough to defend it, work within it, and route writes through the right surfaces." |
| **Personas** | Platform Engineer · Security/Compliance · CISO · Engineering Manager |
| **Prerequisites** | M6.1 (what is MCP) · M6.1.L2 (read-only by design) |
| **Time** | 9 minutes |
| **Bloom verb** | Defend (Evaluate), Map (Apply), Explain (Understand) |

---

## 1. Concept

ZopNight's MCP server is read-only. The Model Context Protocol itself supports both reads and writes; ZopNight only exposes reads. The choice is deliberate, well-debated internally, and unlikely to change for V1. This lesson covers the reasoning and the implications for engineers.

```
THE BOUNDARY:
  MCP-callable tools:  list_*, get_*, search_*  → reads only
  
  Writes (mutations):  ZopNight UI, ZopNight API,
                       auto-remediation, Terraform/IaC
                       → never reachable via MCP
```

The boundary is enforced in code: write-named tools are explicitly detected and rejected (CodePermissionDenied) by the MCP layer, and there is no toggle or scope to grant that would enable them.

### Why read-only — the four arguments

```
1. SAFETY
   Agents hallucinate. An LLM can call the wrong tool with the wrong
   parameters confidently. A read-only MCP cannot accidentally destroy
   infrastructure even when the LLM is wrong.
   
2. AUDIT
   Every mutation should be a deliberate, traceable, human-intent event.
   Routing through ZopNight UI (with confirmation modals, approval gates,
   change descriptions) ensures intent is captured.
   
3. PREDICTABILITY
   Customers can describe what an agent CAN do to their CISO in one
   sentence: "read everything, modify nothing." That clarity is a feature.
   
4. COMPLIANCE
   Audit log of MCP calls is straightforward (tool, filters, response).
   No approval-of-an-action complexity. No "did the agent intend X?"
   forensics. Read-only halves the security surface area.
```

These aren't just abstract concerns — each maps to a specific failure mode observed in other agent products that allowed writes.

### The internal debate (V1 design)

The product roadmap considered "write-with-approval" as an option for V1. Here's the debate that landed on read-only:

```
PRO ARGUMENTS (for adding writes):
  ✓ "Agents can automate routine writes (apply recommendation, etc.)"
  ✓ "Saves engineers time on common workflows"
  ✓ "Competitive parity — other tools have writes"
  ✓ "Customers will ask for it"

CON ARGUMENTS (against writes):
  ✗ LLMs hallucinate; even with approval, the prompt could be wrong
  ✗ The boundary between "routine" and "important" is hard to define
  ✗ Approval gates add latency that undermines the agent value prop
  ✗ Existing UI / API / auto-remediation already cover the write paths
  ✗ Write capability shifts the audit burden onto customers (must validate
    every agent action)
  ✗ One catastrophic LLM mistake (drop a production resource) erodes trust
    for the entire customer base

DECISION:
  Read-only for V1.
  Re-evaluate when:
    - LLM safety/reliability improves dramatically
    - Industry standards for agent action approval exist
    - Customer feedback strongly favors writes (with deep safeguards)
  
  Until then: writes belong to UI/API/auto-remediation.
```

The decision was made deliberately, not by oversight.

### What's still possible (read-only is plenty)

The read-only contract doesn't cripple the agent value prop. It enables 80%+ of FinOps engineering workflows:

```
READ-ONLY MCP ENABLES:
  ✓ Natural-language cost queries
    "What's our biggest cost driver in payment-team this month?"
  
  ✓ Recommendations browsing
    "Show me top 10 savings opportunities by impact"
  
  ✓ Anomaly investigation
    "Why did spend spike last Tuesday?"
  
  ✓ Audit log forensics
    "Who applied schedules last week?"
  
  ✓ Schedule + budget analysis
    "Which teams are tracking under their quarterly budget?"
  
  ✓ Showback / chargeback
    "Generate the team's monthly cost summary"
  
  ✓ Compliance reporting
    "List all resources missing the required tags"
  
  ✓ Capacity / forecasting questions
    "If current growth continues, when do we hit our annual budget?"

These cover the engineering use cases that drove the agent demand
in the first place. Writes were never the primary value.
```

### Where writes happen — the appropriate surfaces

```
WRITE WORKFLOW                     APPROPRIATE SURFACE
────────────────────────────────────────────────────────
Apply a recommendation             ZopNight UI (one-click) or API
Stop a resource                    ZopNight UI or auto-remediation rule
Create a schedule                  ZopNight UI (with approval if configured)
Edit budget                        ZopNight UI (admin policy applies)
Provision new resource             Terraform / IaC (proper change mgmt)
Add team / change RBAC             ZopNight UI (org-admin only)
Bulk write (mass schedule)         ZopNight API with PAT + audit
```

For every write someone might imagine doing "via the agent," there's a more-appropriate surface that exists today. The agent's job is to identify *what* to write; the human routes it through the right surface.

### Comparison — how other agent tools handle this

```
TOOL                     WRITES?              REASONING
──────────────────────────────────────────────────────────────
ZopNight MCP             NO                   Safety architecture (this lesson)
Cursor / Claude Code     YES (file edits)     IDE writes scoped to local repo;
                                              reversible via git
Claude Desktop           CONFIG-DEPENDENT     Each MCP server decides own scope
Terraform                YES (per resource)   IaC is the *intended* write path
                                              with plan/apply review
AWS CLI                  YES (direct)         Direct cloud API; high blast radius
                                              by design — same as `kubectl`
```

The pattern: high-trust IDEs allow file-level writes (low blast radius). Low-trust cross-system tools (like ZopNight's cost data + cloud) stay read-only or require explicit IaC patterns.

### Applying the rule — what MCP can vs cannot do

The mental model is simple — if it's a question, MCP can answer. If it's a command, MCP refuses.

```
QUESTION                                  CAN MCP DO?
─────────────────────────────────────────────────────────────
"What's our biggest idle resource?"        YES (read)
"Stop the biggest idle resource"           NO (write)
"Show me last week's overrides"            YES (read)
"Create an override for tomorrow"          NO (write)
"What's our schedule failure rate?"        YES (read)
"Fix the schedule"                         NO (write)
"List resources missing tags"              YES (read)
"Apply tags to all matching resources"     NO (write)
"What's the team's budget status?"         YES (read)
"Increase the team's budget by 10%"        NO (write)
"Who applied recommendations last month?"   YES (read — audit)
"Roll back yesterday's applied rec"        NO (write)
```

The asymmetry is intentional. Reading is safe; writing requires deliberate human intent through the appropriate surface.

### Customer FAQ — common pushbacks

```
"Why can't the agent just apply the recommendation for me?"
  → Because applying = a write. Use the UI's one-click Apply button
    after the agent identifies which recommendation to apply.
  → Or configure auto-remediation for that rule type (M5.3.L4).
  → The agent + UI + auto-rem are a 3-tool team. Each owns its lane.

"Other tools' agents can write. Why not yours?"
  → Other tools' agents can also cause production incidents from a bad
    LLM response. Our choice trades some convenience for predictable
    safety. Re-evaluating as LLM safety matures.

"What if I want to give the agent permission to write?"
  → The architecture doesn't expose a write API to MCP at all. There's
    no permission to grant — it's a layer below auth. M6.6.L3 covers
    why this is intentional.

"Will this change?"
  → Not in V1. The roadmap revisits this when LLM reliability + industry
    safety standards mature. No committed date. Don't build workflows
    that depend on writes-via-MCP.
```

### When customers genuinely need agent-driven writes

```
SCENARIO A — auto-remediation already covers it:
  "I want the agent to stop idle resources."
  → Auto-remediation rules do this without an agent. Set the policy;
    ZopNight handles the writes with full audit + approval. (M5.3.L4)

SCENARIO B — IaC already covers it:
  "I want the agent to provision new resources."
  → IaC (Terraform/Pulumi) is the right tool. Agent can DRAFT the IaC
    code; human applies it. (M2.1.L3)

SCENARIO C — UI already covers it (one-click):
  "I want the agent to apply a recommendation."
  → ZopNight UI's Apply button is one click. Agent identifies; human
    clicks. The friction is intentional — a moment of human review.

SCENARIO D — bulk API operation:
  "I want to update 200 resources at once."
  → ZopNight API with PAT works. Write a script; not a chat prompt.
    The bulk write is a deliberate engineering task with code review.
```

Across these scenarios, the answer is the same: read-only MCP is the right boundary; alternative surfaces handle the writes.

---

## 2. Demo

An engineer in Claude Desktop tries a write:

```
T+0:00   /list_idle_resources
T+0:02   Claude returns 12 idle resources via MCP read
         Top result: rds-prod-payments-staging-replica (75 days idle)

T+0:05   Engineer: "Stop that resource"

T+0:07   Claude responds:
         "I can find idle resources, but I cannot stop them via the
          ZopNight MCP. The MCP is read-only by design.
          
          To stop this resource, you have these options:
          
          1. ZopNight UI: open the resource page and click Stop.
             Goes through approval gates and audit log.
          
          2. ZopNight API: 
             POST /v1/resources/rds-prod-payments-staging-replica/stop
             (PAT-authenticated; same audit trail)
          
          3. Auto-remediation: if this matches a certified rule
             (idle-RDS-non-prod), enabling auto-rem applies stops
             automatically going forward.
          
          The MCP identifies the target; the writes happen through
          the appropriate ZopNight surface."

T+1 min  Engineer opens ZopNight UI
T+2 min  Opens resource, reviews 7-day cost ($240/mo), confirms intent
T+3 min  Clicks Stop. Approval workflow (none required; non-prod).
T+3 min  Resource stopped; audit log entry created.

ELAPSED: 3 minutes. The friction was a feature — engineer reviewed
                     before stopping; would have caught misidentification.
```

The 3-minute cycle (agent identifies → human reviews → human applies) is the intended workflow. Skipping the review is exactly what read-only prevents.

---

## 3. Hands-on (5 min)

Map your team's desired writes to the right surfaces:

```
LIST WRITES YOU'D WANT AGENT TO DO:
  1. __________
  2. __________
  3. __________

MAP each to surface:
  Write 1: __________ → Surface: __________ 
    (UI / API / Auto-rem / IaC)
  Write 2: __________ → Surface: __________
  Write 3: __________ → Surface: __________

REFLECTION:
  Which of these would be GENUINELY better via agent vs UI?
  → __________
  
  Which would be SCARY via agent (bad LLM call = production incident)?
  → __________
  
  Where is the right human-review checkpoint?
  → __________
```

Most writes map cleanly to existing surfaces. The agent's job is to identify, not execute.

---

## 4. Knowledge check

### Q1
Can MCP modify a resource directly?

A. Yes, with approval
B. No — read-only by architectural design. Writes route through ZopNight UI, API, or auto-remediation. The agent identifies *what* to write; the human routes through the appropriate surface. There's no toggle to flip; it's a layer below permissions.
C. Random
D. Only via PAT

<details>
<summary>Show answer</summary>

**Correct: B.** Architectural read-only. No write API exists in MCP.
</details>

### Q2
Why is MCP read-only?

A. Performance
B. Four reasons: safety (agents hallucinate; can't destroy what they can't touch), audit (mutations should be deliberate), predictability (clear customer story), compliance (simpler audit surface). The choice is deliberate; alternative surfaces exist for every write.
C. Random
D. Cost

<details>
<summary>Show answer</summary>

**Correct: B.** Safety + audit + predictability + compliance.
</details>

### Q3
A team wants to schedule a resource based on agent analysis. The right path:

A. Ask the agent to create the schedule
B. Use the agent to identify resources + suggest schedule. Then engineer opens ZopNight UI to create the schedule definition (with approval if configured by org policy) and attach the resources. Audited end-to-end. Confirm afterward via MCP read.
C. Random
D. Terraform-only

<details>
<summary>Show answer</summary>

**Correct: B.** UI is the canonical write surface for schedules; agent identifies, human applies.
</details>

---

## 5. Apply

Trust the read-only contract. Routine writes through UI/API; MCP for queries. The 3-tool team (agent + UI + auto-rem) is the intended workflow.

For CISO conversations: this is the single-sentence answer: "MCP can read everything in ZopNight; it cannot modify anything. All writes go through audited UI/API surfaces."

---

## Related lessons

- [L2 — When you need writes (workarounds)](L2_when_you_need_writes.md) *(next)*
- [L3 — Future: write approval roadmap](L3_future_write_approval.md)
- [M6.1.L2 — Read-only by design](../M6.1_why_agents/L2_read_only.md)
- [M5.3.L4 — Auto-remediation policies](../../T5_devops_cost_discipline/M5.3_automation/L4_auto_remediation.md)

## Glossary terms touched

[Read-only MCP](../../../reference/glossary/read-only-mcp.md) · [Write surface](../../../reference/glossary/write-surface.md) · [3-tool team](../../../reference/glossary/three-tool-team.md) · [Architectural boundary](../../../reference/glossary/architectural-boundary.md)

---

§ Authored by the ZopDev University editorial board · Last reviewed 2026-05-21 · Lesson ID: T6.M6.6.L1
