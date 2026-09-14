# Final live handoff — ReferralRail

Finish ReferralRail completely from the repository folder I have opened for you.

Do **not** only review it, return a plan, or rewrite the architecture. The product scope and two-contract architecture are already locked. Your job is to execute the remaining environment-dependent release work, fix any real blocker you discover, collect truthful live evidence, configure the frontend against the real contracts, and leave the repository ready for Agent Tank submission.

## Source of truth

Read these files first, in full:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/STATE_MACHINE.md`
- `docs/VALIDATION.md`
- `docs/SECURITY_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/LIVE_EVIDENCE.md`
- `docs/RUBRIC_TRACEABILITY.md`
- `docs/TEST_REPORT.md`
- `contracts/referral_rail.py`
- `contracts/outcome_judge.py`

Preserve the product thesis: **referral attribution becomes enforceable economic state**.

Do not expand into recruiting marketplace, CV scoring, KYC, chat, generalized reputation, DAO, token, cross-chain, multiple work categories, generic bounty or generic dispute features.

## Network lock

Use only:

- Network: Studio Next / Studionet Dev
- Chain ID: 61997
- RPC: `https://studio-next.genlayer.com/api`
- Explorer: `https://explorer-studio-dev.genlayer.com/`

The existing code contains guards. Do not loosen or bypass them.

## Required execution order

1. Install the exact project dependencies from `requirements.txt` and `package.json`.
2. Generate the npm lockfile from those exact dependency versions and commit it.
3. Run `python -m pytest -q`. Preserve all existing passing protocol tests.
4. Run GenVM lint and typecheck on both contracts. Fix actual v0.6 semantic/API errors if any; do not weaken validation or remove security checks merely to silence a tool.
5. Add/run Direct Mode tests covering the scenarios listed in `docs/TEST_PLAN.md`, including a dissenting-validator test proving a leader `COMPLETED` result cannot be accepted by schema alone.
6. Run frontend `typecheck` and production `build`. Fix all actual errors.
7. Run the app locally and inspect the three primary screens at desktop and mobile widths. Keep the current distinct ReferralRail visual system; do not replace it with a starter dashboard.
8. Profile representative **finalized** transaction branches and generate a real root `fee-profile.json`. Do not guess fee values. Cover child-message and payout/refund branches so `totalMessageFees` is sufficient.
9. Re-run the release gate after profiling.
10. Deploy the coherent pair with `deploy/001_deploy_referralrail.ts` against the required RPC. Do not redeploy blindly if a submitted transaction only needs tracking.
11. Confirm `deployment/61997.json` contains real finalized deployment transactions, two real contract addresses, the binding transaction and protocol-config readback.
12. Set the two real addresses in the frontend environment; never hard-code fabricated addresses.
13. Run one complete live success flow with distinct employer/referrer/candidate wallets and a real merged GitHub PR. Confirm final state `PAID`, candidate split, referral split and accounting readback.
14. Run at least one meaningful negative or naturally inconclusive live path if practical. Do not fake source failures through a backend for submission evidence.
15. Record hashes/readbacks in `deployment/live-evidence.json` using the evidence helper or an equally explicit truthful format.
16. Run `python scripts/preflight.py --submission`. Fix every blocker.
17. Deploy the frontend. From a clean browser/wallet session, verify wallet/network handling, every main role action, transaction stages, errors, finality and readback.
18. Update `SUBMISSION.md` only with real repository/live-app/contract/demo links and addresses.
19. Record the mandatory 90–120 second demo following `docs/DEMO_SCRIPT.md`.
20. Final repository audit: no secret/private key, no fabricated evidence, no mock integration in the product, no stale network config, no claims of tests/deployment that did not occur.

## Critical contract properties not to weaken

- exactly two Intelligent Contracts;
- candidate fixed when the employer funds;
- third-party referral only;
- explicit candidate acceptance before work submission;
- immutable referral attribution after lock;
- source restricted to GitHub API paths derived from frozen repository + PR number;
- objective GitHub gates before LLM judgment;
- `COMPLETED / NOT_COMPLETED / INCONCLUSIVE` all real outcomes;
- validator independently refetches **and reruns the substantive judgment**;
- finalized IC messages;
- settlement callback authenticates judge + exact active attempt;
- max two evidence attempts + cure deadline;
- judgment timeout + permissionless recovery;
- exact full-funding invariant and single settlement;
- UI does not call a submitted transaction successful before finalization + finalized readback.

## Stop conditions

Stop and report instead of inventing evidence if:

- wallet funding/authorization is missing;
- Studio Next is unavailable;
- current toolchain exposes an API incompatibility you cannot safely resolve;
- the GitHub evidence needed for the planned success case is not actually public/merged;
- the contract does not pass GenVM validation;
- deployment does not finalize successfully.

Never fabricate an address, transaction hash, fee measurement, screenshot, live result or test result.
