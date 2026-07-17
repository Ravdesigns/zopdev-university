# Engineer Certification

§ Free for customers · $99 outside customers · Multiple choice + lab

## Outcome

Demonstrate the ability to configure ZopNight at depth: recommendations engine, auto-remediation, VM autoscaling, K8s workload scheduling, MCP, anomaly detection, Bedrock cost optimization.

## Prerequisites

Operator certification recommended (not required).

## Format

- **40 multiple-choice questions** (60 minutes)
- **1 graded sandbox lab** (10 tasks, 60 minutes)

## Pass mark

- MCQ: 75% (30/40)
- Lab: 75% (7.5/10 tasks completed correctly)

Both must pass to issue cert.

## Coverage

```
QUESTION DISTRIBUTION (40 MCQs):
  T2 (ZopDev Certified: Engineer):  18-22 questions
  T4 (FinOps Domain Mastery):       10-12 questions
  T5 (DevOps Cost Discipline):      6-8 questions
  T6 (AI-Powered Cloud Ops):        4-6 questions
  
LAB:
  Tasks span:
    - Configure auto-remediation
    - Tune autoscaler with smart defaults
    - Schedule K8s workloads
    - Configure event readiness
    - Set up MCP via Claude Desktop
    - Diagnose a cost anomaly
    - Identify the right rule for a sample finding
```

## Sample lab task

```
TASK: Configure auto-remediation for RC-001 on the staging environment
only (not prod).

PROVIDED:
  - Two environments (staging, prod) tagged consistently
  - 5 idle EC2 instances in staging
  - 2 idle EC2 instances in prod (which should NOT be auto-remediated)

SUCCESS CRITERIA:
  - Auto-remediation enabled for RC-001
  - Approval gate configured for prod-tagged
  - 5 staging instances are auto-remediated within the test window
  - 2 prod instances trigger approval requests (not auto-applied)
  - Audit log shows the correct behavior
```

## Issuance

- Verifiable cert ID
- Public registry opt-in
- Shareable to LinkedIn
- Higher visibility than Operator

## Renewal

Annual recertification to keep current. Test covers product changes from the previous year.

## Cost

- Free for ZopNight customers (POC or paid)
- $99 for non-customers

## When to take

After completing Track 2 + Track 4 + Track 5 + Track 6 (~22 hours of content) + Operator cert.

Hands-on with the product strongly recommended before attempting the lab.

---

§ Engineer Cert · Last reviewed 2026-05-20
