# Operator Certification

§ Free tier · Online exam · Mixed Track 0 + Track 1 coverage

## Outcome

Demonstrate the ability to operate ZopNight day-to-day: connect cloud accounts, navigate the estate, build schedules, manage groups, configure overrides, read history and audit logs.

## Format

- 20 multiple-choice questions
- 30 minutes
- Open-book (you can have ZopNight docs open)
- Online proctoring optional

## Pass mark

80% (16/20 correct)

## Coverage

```
QUESTION DISTRIBUTION:
  T0 (Foundations):                 7-9 questions
  T1 (ZopDev Certified: Operator):  11-13 questions
  
TOPIC EMPHASIS:
  Schedules + groups: 4-5 questions
  Connect + discover: 3-4 questions
  Overrides: 2-3 questions
  History + audit: 2-3 questions
  Foundation topics: 7-9 questions
```

## Sample question

```
Q: A team applies the "Business Hours" preset schedule (8 AM - 8 PM 
weekdays). They forget to change the timezone from the default 
(America/New_York). The team is in Asia/Kolkata. The most likely 
consequence:

A. The schedule fires at 8 AM and 8 PM America/New_York, which is 
   5:30 PM and 5:30 AM Asia/Kolkata. The Kolkata team finds resources 
   stopping mid-afternoon and starting at dawn.
B. The cron syntax is invalid.
C. The schedule doesn't fire.
D. The schedule fires twice.

Correct: A
```

## Sample question

```
Q: A non-prod EC2 instance shows as stopped. The Permission Visibility 
drawer for that account shows "Denied" on ec2:Describe* for the relevant 
region. The implication for ZopNight:

A. ZopNight cannot see this resource at all.
B. ZopNight may have missed this resource in earlier syncs (silent 
   failure). The drawer documents the gap. Adding the permission 
   restores visibility on next refresh.
C. The resource is incorrectly marked as stopped.
D. ZopNight needs admin escalation.

Correct: B
```

## Issuance

Pass → Digital badge from Credly. Includes:
- Cert ID (unique, verifiable)
- Issued-to date
- Public verification URL
- Shareable to LinkedIn

## Renewal

Re-take the exam at any time. New tier of content does not invalidate prior cert (Operator stays Operator).

## Cost

Free.

## When to take

After completing Track 0 + Track 1 (4.5 + 4.5 = 9 hours of content).

Recommended: take 1 week after finishing the tracks to allow concept consolidation.

## How to schedule

1. Settings → Certifications → Operator
2. Confirm payment (free) and identity
3. Schedule date/time (30-minute slots)
4. Receive confirmation + reminders

---

§ Operator Cert · Last reviewed 2026-05-20
