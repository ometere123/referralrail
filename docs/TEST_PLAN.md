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

## Direct Mode scenarios

Direct Mode is used only for isolated deterministic contract operations that
are supported by the current Windows runner. The retained suite covers:

- deployment and one-time judge binding;
- exact payable creation;
- underfund rejection;
- overfund rejection.

The current `genlayer-test` v0.30-dev Direct runner has a native Windows
post-deployment context defect. The installed source is commit
`d84591b58746a6202b56b720199ce7b9f12fd666`; the observed symptom is
`gl_call decode error: No module named 'genlayer'`. This is a runner/runtime
failure, not a ReferralRail or OutcomeJudge authorization failure. The
multi-actor, multi-transaction and callback scenarios below therefore belong
in GLSim rather than being forced through Direct Mode.

## GLSim integration scenarios

GLSim uses the same v0.30-dev testing suite on a local RPC only. It is the
stateful integration layer for:

- multiple actors and transactions;
- both deployed contracts and the real address-based callback boundary;
- strict GitHub and LLM mocks;
- leader/validator agreement and substantive disagreement;
- acceptance, work submission, payout, refund, retry, timeout and recovery;
- replay protection and accounting conservation.

GLSim is not Studio Next and its local addresses/hashes must never be copied
into `deployment/61997.json`, `deployment/live-evidence.json`, or live
submission fields.

The first native Windows GLSim smoke deployment currently reaches the
simulator but fails inside the runner with `[WinError 32]` because a temporary
runner file is still in use. Until that runner issue is resolved, the GLSim
integration scenarios are not claimed as passed.

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
