# Release test plan

## Deterministic protocol invariants

Already represented in `tests/model/` and `tests/static/`:

- exact funding only;
- no employer/candidate self-referral;
- referrer cannot nominate a different candidate;
- candidate is not bound until explicit acceptance;
- referral cannot change after lock/acceptance;
- only candidate may submit/retry;
- one terminal value release only;
- referral reward can be paid once only;
- unauthorized callback rejected;
- stale/wrong opportunity attempt cannot replay;
- malformed/unavailable evidence policy is inconclusive;
- settlement conserves original funding;
- refund/recovery cannot overpay;
- expiry prevents later payout;
- every lock has a terminal recovery route.

## GenVM checks

Run both files through:

```bash
genvm-lint check contracts/referral_rail.py
genvm-lint check contracts/outcome_judge.py
genvm-lint typecheck contracts/referral_rail.py
genvm-lint typecheck contracts/outcome_judge.py
```

Any semantic issue discovered here is a blocker.

## Direct Mode scenarios to add/run with the installed v0.6 testing suite

- deployment and one-time judge binding;
- exact payable create + under/overfund revert;
- referral actor matrix;
- candidate acceptance matrix;
- frozen attribution readback;
- candidate work submission emits expected judge message;
- judge objective NOT_COMPLETED cases using mocked GitHub API;
- judge unavailable source → INCONCLUSIVE;
- judge completed case with mocked GitHub + LLM where leader/validator independently agree;
- intentionally dissenting validator → consensus does not accept a leader completion;
- settlement callback authorization/replay paths;
- completed settlement split and accounting;
- timeout/inconclusive recovery.

The Direct Mode suite should run with strict mocks so a misspelled GitHub path cannot silently pass.

## Frontend release tests

- disconnected wallet state;
- connect + target network check/switch;
- missing contract configuration banner;
- create opportunity validation and exact payable amount;
- role-specific action visibility;
- each write tracks to finalization;
- finalized state readback gates success message;
- reverted/finalized-error transaction renders failure;
- stale state after transaction does not invite blind resubmission;
- mobile layouts for landing, create and opportunity detail;
- no mock/demo opportunity appears when contract reads are empty.

## Live integration

Run the complete success case and one negative/inconclusive case from `LIVE_EVIDENCE.md`; preserve real hashes and readbacks.
