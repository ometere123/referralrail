# Test report

## Checks actually executed in the repository-construction environment

Date: 2026-09-15

The checks below are limited to commands genuinely run in the native Windows
Python 3.12 environment.

### Passed

- Python syntax compilation for both Intelligent Contract files.
- Frontend TypeScript typecheck and production build were run after the
  dependency restore.
- Pure protocol/accounting model test suite: **27 passed**.
- Static contract architecture assertions included in the same pytest run.

### Current GenLayer test layers

- Direct Mode: **4 passed**. Retained tests cover both deployments and
  one-time judge binding, exact funding, underfund rejection and overfund
  rejection.
- Direct Mode is native Windows. The installed v0.30-dev source is commit
  `d84591b58746a6202b56b720199ce7b9f12fd666` and includes the current message
  synchronization helpers. After deployment, the runtime still exhibits
  `gl_call decode error: No module named 'genlayer'`; actor switching and
  cross-contract lifecycle cases are consequently not Direct claims.
- The exact upstream GenLayer PR #104 Windows tempfile lifecycle fix was
  backported locally into the installed test package only: stdin temp paths
  are retained until fd 0 is restored, then removed during VM cleanup. The
  patched site-packages files are not repository changes. This removed the
  immediate-unlink race in the installed runner, but the current run is
  blocked earlier because the resolved `v0.6.0-rc5` bundle does not contain
  the pinned `py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng`
  archive.
- GLSim was installed from the same v0.30-dev branch and its CLI was started
  on local chain ID 61997. A ReferralRail deployment smoke test was attempted
  with five validators. It did not pass: the simulator reported finalized
  execution errors caused by native Windows `[WinError 32]` temporary-file
  contention in the runner. No GLSim lifecycle or consensus result is claimed.

GLSim is the intended layer for the deferred stateful scenarios: employer,
referrer and candidate transactions; real ReferralRail/OutcomeJudge
cross-contract execution; strict evidence mocks; validator agreement and
dissent; payout/refund/retry/recovery; replay protection; and accounting.
It is local integration evidence, not Studio Next live evidence.

The model suite exercises self-referral prevention, explicit candidate acceptance, attribution immutability, actor permissions, double-settlement prevention, referral-reward replay prevention, unauthorized judge callbacks, cross-attempt replay, `NOT_COMPLETED` refund, `INCONCLUSIVE` retry/recovery, stalled-judgment recovery, deterministic expiry/cancellation and the funding conservation invariant.

## Not claimed as executed here

The following remain mandatory release gates or are blocked by the current
local simulator runtime:

- GLSim multi-validator integration (blocked by the native Windows runner
  temporary-file defect above);
- live multi-validator integration;
- the final aggregate pytest run after the fresh simulator reinstall (the
  runner cache is missing the pinned `py-genlayer` archive);
- fee-profile measurement;
- Full multi-actor live lifecycle evidence beyond the deployment/binding smoke test;
- browser-level deployed frontend smoke test.

## Additional checks completed after the initial report

- Studio Next deployment of ReferralRail and OutcomeJudge finalized with successful
  GenVM execution on chain 61997.
- Judge binding finalized and `get_protocol_config` read back the expected owner and
  judge address. Evidence is recorded in `deployment/61997.json`.
- Corrected live Studio Next smoke test: **1 passed**. It performs a fresh deployment,
  verifies successful execution and zero-address initial state, binds a judge, and
  verifies the finalized readback.
- Frontend `.env` is configured with the deployed addresses; production build and
  TypeScript check pass with that configuration.

The complete employer/referrer/candidate lifecycle and browser-level smoke test remain
unexecuted and are not claimed here.

`AGENT_HANDOFF.md` tells the deployment agent to execute each remaining gate and stop on failure rather than treating this report as proof of those actions.
