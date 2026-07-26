# Deterministic Policy Model

## Rule `EXPEDITE-CARRIER-DELAY-24H`

Eligible when all are true:

1. invoice contains a posted `EXPEDITE` charge greater than zero;
2. actual delivery is later than committed delivery by more than 24 hours;
3. the reviewed delay cause category is `CARRIER_CAUSED`;
4. no customer-caused or invalid-address event supersedes the cause;
5. policy version was effective at the case date;
6. no prior credit exists for the same charge/reference.

Resolution amount equals the posted expedite charge, capped by the policy if a cap is introduced.

Approval class:

- amount `<= 1000.00`: `SUPERVISOR`
- amount `> 1000.00`: `FINANCE_MANAGER`

## Escalation rules

- missing committed or actual time;
- contradictory terminal delivery events;
- unknown or unreviewed cause;
- missing charge line;
- policy unavailable or not effective;
- prior credit ambiguity;
- currency mismatch.

The model cannot override these rules. A future policy service may externalize them, but the evaluation remains deterministic and versioned.
