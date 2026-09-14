# State machine

## Opportunity states

| State | Meaning | Who can advance it | Valid next states |
|---|---|---|---|
| `OPEN` | fully funded; no referral bound | third-party referrer, employer before referral, anyone after referral deadline | `REFERRED`, `CANCELLED`, `EXPIRED` |
| `REFERRED` | one referrer is locked; candidate has not accepted | candidate, anyone after referral deadline | `ACCEPTED`, `EXPIRED` |
| `ACCEPTED` | candidate explicitly accepted + locked GitHub login | candidate, anyone after completion deadline | `JUDGING`, `EXPIRED` |
| `JUDGING` | one exact PR/attempt is awaiting final judge callback | configured OutcomeJudge, anyone after judgment timeout | `PAID`, `REFUNDED`, `INCONCLUSIVE`, `REFUNDED` via recovery |
| `INCONCLUSIVE` | evidence could not safely resolve outcome | candidate during cure window, anyone after cure/exhaustion | `JUDGING`, `REFUNDED` |
| `PAID` | candidate and referrer obligations released | nobody | terminal |
| `REFUNDED` | employer recovered funding after failed/recovery path | nobody | terminal |
| `EXPIRED` | deterministic deadline recovery returned funding | nobody | terminal |
| `CANCELLED` | employer cancelled before any referral was bound | nobody | terminal |

## Referral invariants

A referral may be created only while `OPEN`, before the referral deadline, by a wallet that is neither employer nor candidate, and only for the candidate wallet already registered by the employer. After referral creation there is no method that rewrites the referrer.

Candidate acceptance may be called only by the registered candidate and only from `REFERRED`. The candidate binds their GitHub login at this moment. No method changes that identity after acceptance.

## Judgment attempts

An attempt ID is monotonically incremented for each opportunity. The active attempt stores the PR number and timeout. The settlement callback must carry the exact active attempt. A stale callback from an earlier attempt cannot settle funds.

Maximum attempts: **2**.

`INCONCLUSIVE` never silently becomes failure. The first inconclusive result opens a **24-hour cure window** for one candidate retry. After attempts are exhausted, or after the cure window ends, recovery refunds the employer.

A missing judge callback also cannot lock funds indefinitely. A `JUDGING` opportunity has a **24-hour judgment timeout**; after it passes, anyone can execute deterministic recovery.

## Terminal-value rule

Every terminal path releases the entire opportunity funding exactly once:

- `PAID`: candidate payment + referral reward;
- `REFUNDED`: full employer refund;
- `EXPIRED`: full employer refund;
- `CANCELLED`: full employer refund.

A terminal state cannot re-enter the active lifecycle.
