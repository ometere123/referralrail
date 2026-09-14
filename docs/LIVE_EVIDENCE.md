# Live evidence checklist

This file defines evidence to collect; it does not claim those actions have happened.

## Required deployment evidence

Record in `deployment/61997.json`, generated from real receipts:

- ReferralRail contract address;
- ReferralRail deployment transaction;
- OutcomeJudge contract address;
- OutcomeJudge deployment transaction;
- judge-binding transaction;
- finalized `get_protocol_config` readback.

## Successful end-to-end case

Use three distinct wallets: employer, referrer and candidate.

1. Employer creates and fully funds an opportunity with a small, demonstrable GitHub task and real candidate wallet.
2. Read back state `OPEN` and funded amount.
3. Third-party referrer creates referral for the frozen candidate.
4. Read back `REFERRED`, referrer address and unchanged economic terms.
5. Candidate accepts and locks the GitHub login.
6. Read back `ACCEPTED` and candidate GitHub identity.
7. Candidate supplies the real merged PR number.
8. Observe final `JUDGING` submission and resulting OutcomeJudge attempt.
9. Inspect the real judgment record: outcome, evidence digest, reason and audit.
10. Observe finalized settlement `PAID`.
11. Read back accounting and the opportunity: candidate amount, referral reward, terminal state, lock released.
12. Record the explorer transactions for the user action, judge child flow/callback and settlement effects where visible.

The live frontend should visually state that the referrer earned **because the accepted referral resulted in verified completed work**.

## Negative / uncertainty case

Prefer one real `INCONCLUSIVE` case that does not rely on fabricated chain evidence, for example a PR whose patch is unavailable/unsupported or a temporary source failure that naturally occurs during testing. If a natural inconclusive case is not practical, use a deterministic negative case such as an unmerged PR and record `NOT_COMPLETED` + refund.

Do not stage fake GitHub responses on a backend for submission evidence. Direct-mode mocks are for tests only.

## Readback requirements

A transaction hash alone is insufficient. For each key step capture:

- transaction finalization;
- successful execution result;
- finalized contract state that proves the intended transition;
- addresses and amounts relevant to the transition.

## File format

`scripts/record_live_evidence.py` can create/update `deployment/live-evidence.json`. Every entry must be supplied manually from a real finalized transaction; the script validates shapes but never invents values.
